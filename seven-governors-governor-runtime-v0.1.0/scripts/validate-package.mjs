import fs from "node:fs";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import {
  INTEGRATED_ROOT,
  PACKAGE_ROOT,
  canonicalCompact,
  canonicalJson,
  compareCodePoint,
  readJson,
  sha256,
  writeAtomic,
} from "./lib.mjs";

const SCHEMA_IDS = {
  "typed-aspect": "https://seven-governors.local/governor-runtime/0.1.0/schemas/typed-aspect.schema.json",
  quantity: "https://seven-governors.local/governor-runtime/0.1.0/schemas/quantity.schema.json",
  "bridge-rule": "https://seven-governors.local/governor-runtime/0.1.0/schemas/bridge-rule.schema.json",
  "classification-request": "https://seven-governors.local/governor-runtime/0.1.0/schemas/classification-request.schema.json",
  "classification-result": "https://seven-governors.local/governor-runtime/0.1.0/schemas/classification-result.schema.json",
  "policy-release": "https://seven-governors.local/governor-runtime/0.1.0/schemas/policy-release.schema.json",
};

const ajv = new Ajv2020({
  allErrors: true,
  strict: true,
  strictRequired: false,
  allowUnionTypes: true,
});
const schemaFiles = fs
  .readdirSync(path.join(PACKAGE_ROOT, "schemas"))
  .filter((name) => name.endsWith(".json"))
  .sort(compareCodePoint);
for (const name of schemaFiles) {
  ajv.addSchema(readJson(path.join(PACKAGE_ROOT, "schemas", name)));
}
const validators = Object.fromEntries(
  Object.entries(SCHEMA_IDS).map(([name, id]) => [name, ajv.getSchema(id)]),
);

const policy = readJson(path.join(PACKAGE_ROOT, "canonical/policy-release.json"));
const crosswalk = readJson(
  path.join(PACKAGE_ROOT, "canonical/feature-typed-aspect-crosswalk.json"),
);
const examples = readJson(
  path.join(PACKAGE_ROOT, "canonical/canonical-bridge-examples.json"),
);
const featureRegistry = readJson(
  path.join(
    INTEGRATED_ROOT,
    "seven-governors-canonical-feature-profile-registry-v0.1.1/canonical/feature-registry.json",
  ),
);
const checks = [];

function record(name, passed, detail) {
  checks.push({ name, status: passed ? "PASS" : "FAIL", detail });
}

function unique(values) {
  return new Set(values).size === values.length;
}

function hydrate(value, replacements = {}) {
  if (Array.isArray(value)) return value.map((item) => hydrate(item, replacements));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, hydrate(item, replacements)]),
    );
  }
  if (value === "$POLICY_FINGERPRINT") return policy.policyFingerprint;
  if (value === "$SOURCE_FINGERPRINT") return policy.sourceFingerprint;
  if (typeof value === "string" && value in replacements) return replacements[value];
  return value;
}

function collectProvenance(value, found = []) {
  if (Array.isArray(value)) {
    for (const item of value) collectProvenance(item, found);
  } else if (value && typeof value === "object") {
    if (Array.isArray(value.provenance)) found.push(...value.provenance);
    for (const item of Object.values(value)) collectProvenance(item, found);
  }
  return found;
}

function normalizeSchemaErrors(errors = []) {
  const codes = new Set();
  for (const error of errors) {
    const pathValue = error.instancePath ?? "";
    if (error.keyword === "additionalProperties") {
      codes.add("SCHEMA_UNKNOWN_PROPERTY");
    } else if (error.keyword === "required" && error.params?.missingProperty === "provenance") {
      codes.add("PROVENANCE_REQUIRED");
    } else if (error.keyword === "required") {
      codes.add("SCHEMA_REQUIRED_PROPERTY");
    } else if (
      (error.keyword === "enum" || error.keyword === "const") &&
      pathValue.endsWith("/featureId")
    ) {
      codes.add("REF_FEATURE_DANGLING");
    } else if (
      (error.keyword === "enum" || error.keyword === "const") &&
      pathValue.endsWith("/unit")
    ) {
      codes.add("UNIT_DIMENSION_MISMATCH");
    } else if (error.keyword === "enum" || error.keyword === "const") {
      codes.add("ENUM_INVALID");
    } else if (!["if", "oneOf"].includes(error.keyword)) {
      codes.add("SCHEMA_INVALID");
    }
  }
  return [...codes].sort(compareCodePoint);
}

const sourceIds = new Set(policy.sourceHashes.map((item) => item.sourceId));
const sourceById = new Map(policy.sourceHashes.map((item) => [item.sourceId, item]));
const featureIds = new Set(policy.featureCrosswalk.map((item) => item.featureId));
const aspectById = new Map(policy.typedAspects.map((item) => [item.aspectId, item]));
const ruleById = new Map(policy.bridgeRules.map((item) => [item.ruleId, item]));
const operationById = new Map(policy.operations.map((item) => [item.operationId, item]));
const activeAspectIds = new Set(policy.activeAspectIds);
const activeRuleIds = new Set(policy.activeRuleIds);
const unitDimensions = new Map([
  ["nm", "length"],
  ["m", "length"],
  ["Hz", "frequency"],
  ["J", "energy"],
  ["eV", "energy"],
  ["one", "dimensionless"],
  ["normalized_inverse_wavelength", "dimensionless"],
]);
const expectedOperationMetadata = new Map([
  [
    "operation:length-nm-to-m:v1",
    {
      kind: "conversion",
      inputDimensions: ["length"],
      inputUnits: ["nm"],
      outputDimension: "length",
      outputUnit: "m",
      outputEpistemicClass: "physically_derived",
      formula: "value_nm * 1e-9",
      constants: [],
      requiredAssumptions: [],
    },
  ],
  [
    "operation:energy-j-to-ev:v1",
    {
      kind: "conversion",
      inputDimensions: ["energy"],
      inputUnits: ["J"],
      outputDimension: "energy",
      outputUnit: "eV",
      outputEpistemicClass: "physically_derived",
      formula: "value_j / electron_volt_j",
      constants: [{ name: "electron_volt_j", value: 1.602176634e-19, unit: "J" }],
      requiredAssumptions: [],
    },
  ],
  [
    "operation:vacuum-wavelength-frequency:v1",
    {
      kind: "derivation",
      inputDimensions: ["length"],
      inputUnits: ["nm"],
      outputDimension: "frequency",
      outputUnit: "Hz",
      outputEpistemicClass: "physically_derived",
      formula: "speed_of_light_m_s / (wavelength_nm * 1e-9)",
      constants: [{ name: "speed_of_light_m_s", value: 299792458, unit: "m_per_s" }],
      requiredAssumptions: ["vacuum_wavelength"],
    },
  ],
  [
    "operation:photon-energy-frequency:v1",
    {
      kind: "derivation",
      inputDimensions: ["frequency"],
      inputUnits: ["Hz"],
      outputDimension: "energy",
      outputUnit: "J",
      outputEpistemicClass: "physically_derived",
      formula: "planck_constant_j_s * frequency_hz",
      constants: [{ name: "planck_constant_j_s", value: 6.62607015e-34, unit: "J_s" }],
      requiredAssumptions: ["single_photon"],
    },
  ],
  [
    "operation:photonic-compression:v1",
    {
      kind: "derivation",
      inputDimensions: ["length"],
      inputUnits: ["nm"],
      outputDimension: "dimensionless",
      outputUnit: "normalized_inverse_wavelength",
      outputEpistemicClass: "physical_anchor_plus_normalization_convention",
      formula: "(1/lambda - 1/700) / (1/400 - 1/700)",
      constants: [
        { name: "saturn_anchor_nm", value: 400, unit: "nm" },
        { name: "sun_anchor_nm", value: 700, unit: "nm" },
      ],
      requiredAssumptions: ["registry_coordinate_not_absolute_physical_endpoint"],
    },
  ],
  [
    "operation:relative-rayleigh:v1",
    {
      kind: "evaluation",
      inputDimensions: ["length", "length"],
      inputUnits: ["nm", "nm"],
      outputDimension: "dimensionless",
      outputUnit: "one",
      outputEpistemicClass: "physically_derived",
      formula: "(comparison_wavelength_nm / target_wavelength_nm)^4",
      constants: [],
      requiredAssumptions: [
        "fixed_geometry_polarization_and_angle",
        "fixed_refractive_properties_and_number_density",
        "relative_intensity_only",
        "scatterer_size_much_smaller_than_both_wavelengths",
      ],
    },
  ],
]);

function operationConstants(operation) {
  return Object.fromEntries(
    operation.constants.map((item) => [item.name, item.value]),
  );
}

function operationMetadata(operation) {
  return {
    kind: operation.kind,
    inputDimensions: operation.inputDimensions,
    inputUnits: operation.inputUnits,
    outputDimension: operation.outputDimension,
    outputUnit: operation.outputUnit,
    outputEpistemicClass: operation.outputEpistemicClass,
    formula: operation.formula,
    constants: operation.constants,
    requiredAssumptions: operation.requiredAssumptions,
  };
}

function resultCoreFingerprint(document) {
  const { resultFingerprint, ...core } = document;
  return sha256(canonicalCompact(core));
}

function provenanceSourceIds(value) {
  return [...new Set(collectProvenance(value).map((item) => item.sourceId))];
}

function semanticCodes(kind, document) {
  const codes = new Set();
  for (const provenance of collectProvenance(document)) {
    if (!sourceIds.has(provenance.sourceId)) codes.add("REF_PROVENANCE_DANGLING");
  }
  if (kind === "typed-aspect" && !featureIds.has(document.featureId)) {
    codes.add("REF_FEATURE_DANGLING");
  }
  if (kind === "bridge-rule") {
    const aspect = aspectById.get(document.output?.aspectId);
    if (!aspect) codes.add("REF_ASPECT_DANGLING");
    if (aspect && aspect.primaryGovernor !== document.output.primaryGovernor) {
      codes.add("RESULT_GOVERNOR_MISMATCH");
    }
    if (document.authoritySourceIds?.some((sourceId) => !sourceIds.has(sourceId))) {
      codes.add("REF_PROVENANCE_DANGLING");
    }
    if (document.causalClaim === true || document.epistemicClass === "causal_claim") {
      codes.add("CAUSAL_OVERCLAIM");
    }
  }
  if (kind === "classification-result") {
    if (document.policyFingerprint !== policy.policyFingerprint) {
      codes.add("POLICY_FINGERPRINT_MISMATCH");
    }
    if (document.sourceFingerprint !== policy.sourceFingerprint) {
      codes.add("SOURCE_FINGERPRINT_MISMATCH");
    }
    if (document.resultFingerprint !== resultCoreFingerprint(document)) {
      codes.add("RESULT_FINGERPRINT_MISMATCH");
    }
    for (const facet of document.facetResults ?? []) {
      if (!aspectById.has(facet.requestedAspectId)) {
        codes.add("REF_ASPECT_DANGLING");
      }
      if (facet.outcome === "classified") {
        const aspect = aspectById.get(facet.aspectId);
        if (!aspect) codes.add("REF_ASPECT_DANGLING");
        if (!activeAspectIds.has(facet.aspectId)) codes.add("ASPECT_NOT_ACTIVE");
        if (aspect && aspect.primaryGovernor !== facet.primaryGovernor) {
          codes.add("RESULT_GOVERNOR_MISMATCH");
        }
        for (const evidencePath of facet.evidencePaths ?? []) {
          const rule = ruleById.get(evidencePath.ruleId);
          if (!rule) {
            codes.add("REF_RULE_DANGLING");
          } else {
            if (!activeRuleIds.has(rule.ruleId)) codes.add("RULE_NOT_ACTIVE");
            if (
              rule.output.aspectId !== facet.aspectId ||
              rule.output.primaryGovernor !== facet.primaryGovernor
            ) {
              codes.add("RESULT_RULE_OUTPUT_MISMATCH");
            }
          }
          if (evidencePath.provenanceSourceIds.some((sourceId) => !sourceIds.has(sourceId))) {
            codes.add("REF_PROVENANCE_DANGLING");
          }
        }
      } else if (facet.outcome === "ambiguous") {
        const candidateKeys = new Set();
        for (const candidate of facet.candidates ?? []) {
          const aspect = aspectById.get(candidate.aspectId);
          if (!aspect) codes.add("REF_ASPECT_DANGLING");
          if (!activeAspectIds.has(candidate.aspectId)) codes.add("ASPECT_NOT_ACTIVE");
          if (aspect && aspect.primaryGovernor !== candidate.primaryGovernor) {
            codes.add("RESULT_GOVERNOR_MISMATCH");
          }
          const candidateKey = `${candidate.aspectId}\u0000${candidate.primaryGovernor}`;
          if (candidateKeys.has(candidateKey)) codes.add("RESULT_CANDIDATE_DUPLICATE");
          candidateKeys.add(candidateKey);
          for (const ruleId of candidate.ruleIds) {
            const rule = ruleById.get(ruleId);
            if (!rule) {
              codes.add("REF_RULE_DANGLING");
            } else if (
              rule.output.aspectId !== candidate.aspectId ||
              rule.output.primaryGovernor !== candidate.primaryGovernor
            ) {
              codes.add("RESULT_RULE_OUTPUT_MISMATCH");
            }
            if (!activeRuleIds.has(ruleId)) codes.add("RULE_NOT_ACTIVE");
          }
        }
      }
    }
  }
  if (kind === "classification-request") {
    for (const aspectId of document.requestedAspectIds ?? []) {
      if (!aspectById.has(aspectId)) codes.add("REF_ASPECT_DANGLING");
    }
    const quantityIds = new Set((document.quantities ?? []).map((item) => item.quantityId));
    for (const quantity of document.quantities ?? []) {
      if (quantity.basis?.kind !== "registered_operation") continue;
      const operation = operationById.get(quantity.basis.operationId);
      if (!operation) {
        codes.add("QUANTITY_OPERATION_NOT_REGISTERED");
      }
      const operands = quantity.basis.inputQuantityIds.map((id) =>
        document.quantities.find((item) => item.quantityId === id),
      );
      if (quantity.basis.inputQuantityIds.some((id) => !quantityIds.has(id))) {
        codes.add("REF_QUANTITY_DANGLING");
      } else if (operation) {
        for (const code of validateQuantityOperation({
          operationId: operation.operationId,
          operands,
          output: quantity,
        })) {
          codes.add(code);
        }
      }
    }
  }
  if (kind === "quantity" && document.basis?.kind === "registered_operation") {
    const operation = operationById.get(document.basis.operationId);
    if (!operation) {
      codes.add("QUANTITY_OPERATION_NOT_REGISTERED");
    } else if (
      operation.outputDimension !== document.dimension ||
      operation.outputUnit !== document.unit
    ) {
      codes.add("QUANTITY_OPERATION_OUTPUT_MISMATCH");
    }
    if (operation && operation.outputEpistemicClass !== document.epistemicClass) {
      codes.add("QUANTITY_OPERATION_EPISTEMIC_MISMATCH");
    }
  }
  return [...codes].sort(compareCodePoint);
}

function validateSchemaDocument(schemaName, document) {
  const validator = validators[schemaName];
  if (!validator) return ["SCHEMA_NOT_REGISTERED"];
  const valid = validator(document);
  const shapeCodes = valid ? [] : normalizeSchemaErrors(validator.errors);
  return [
    ...new Set([
      ...shapeCodes,
      ...(valid ? semanticCodes(schemaName, document) : []),
    ]),
  ].sort(compareCodePoint);
}

function validateQuantityOperation(document) {
  const codes = [];
  for (const quantity of [...(document.operands ?? []), ...(document.output ? [document.output] : [])]) {
    codes.push(...validateSchemaDocument("quantity", quantity));
  }
  if (document.operationId === "intrinsic:add" || document.operationId === "intrinsic:compare") {
    if (new Set(document.operands.map((item) => item.dimension)).size !== 1) {
      codes.push("QUANTITY_DIMENSION_MISMATCH");
    } else if (new Set(document.operands.map((item) => item.unit)).size !== 1) {
      codes.push("QUANTITY_UNIT_CONVERSION_REQUIRED");
    }
    return [...new Set(codes)].sort(compareCodePoint);
  }
  const operation = operationById.get(document.operationId);
  if (!operation) {
    codes.push("QUANTITY_OPERATION_NOT_REGISTERED");
    return [...new Set(codes)].sort(compareCodePoint);
  }
  const operandDimensions = document.operands.map((item) => item.dimension);
  const operandUnits = document.operands.map((item) => item.unit);
  if (
    canonicalCompact(operandDimensions) !== canonicalCompact(operation.inputDimensions) ||
    canonicalCompact(operandUnits) !== canonicalCompact(operation.inputUnits)
  ) {
    codes.push("QUANTITY_OPERATION_SIGNATURE_MISMATCH");
  }
  if (
    document.output &&
    (document.output.dimension !== operation.outputDimension ||
      document.output.unit !== operation.outputUnit)
  ) {
    codes.push("QUANTITY_OPERATION_OUTPUT_MISMATCH");
  }
  if (
    document.output &&
    document.output.epistemicClass !== operation.outputEpistemicClass
  ) {
    codes.push("QUANTITY_OPERATION_EPISTEMIC_MISMATCH");
  }
  if (document.output?.basis?.kind === "registered_operation") {
    const expectedInputIds = document.operands.map((item) => item.quantityId);
    if (
      document.output.basis.operationId !== operation.operationId ||
      canonicalCompact(document.output.basis.inputQuantityIds) !==
        canonicalCompact(expectedInputIds)
    ) {
      codes.push("QUANTITY_OPERATION_PROVENANCE_MISMATCH");
    }
  }
  if (
    document.output &&
    operation.requiredAssumptions.some(
      (assumption) => !document.output.assumptions.includes(assumption),
    )
  ) {
    codes.push("MODEL_ASSUMPTION_MISSING");
  }
  if (document.output) {
    const values = document.operands.map((item) => item.value);
    const constants = operationConstants(operation);
    let expectedValue;
    switch (operation.operationId) {
      case "operation:length-nm-to-m:v1":
        expectedValue = values[0] * 1e-9;
        break;
      case "operation:energy-j-to-ev:v1":
        expectedValue = values[0] / constants.electron_volt_j;
        break;
      case "operation:vacuum-wavelength-frequency:v1":
        expectedValue = constants.speed_of_light_m_s / (values[0] * 1e-9);
        break;
      case "operation:photon-energy-frequency:v1":
        expectedValue = constants.planck_constant_j_s * values[0];
        break;
      case "operation:photonic-compression:v1":
        expectedValue =
          (1 / values[0] - 1 / constants.sun_anchor_nm) /
          (1 / constants.saturn_anchor_nm - 1 / constants.sun_anchor_nm);
        break;
      case "operation:relative-rayleigh:v1":
        expectedValue = (values[1] / values[0]) ** 4;
        break;
    }
    const tolerance = Math.max(1, Math.abs(expectedValue)) * Number.EPSILON * 8;
    if (!Number.isFinite(expectedValue) || Math.abs(document.output.value - expectedValue) > tolerance) {
      codes.push("QUANTITY_OPERATION_VALUE_MISMATCH");
    }
  }
  return [...new Set(codes)].sort(compareCodePoint);
}

function prepareCaseDocument(item, caseById) {
  const replacements = {};
  let requestDocument = null;
  if (item.requestCaseId) {
    requestDocument = hydrate(caseById.get(item.requestCaseId).document);
    replacements.$REQUEST_FINGERPRINT = sha256(canonicalCompact(requestDocument));
  }
  const document = hydrate(item.document, replacements);
  if (document.resultFingerprint === "$RESULT_FINGERPRINT") {
    document.resultFingerprint = resultCoreFingerprint(document);
  }
  return { document, requestDocument };
}

function validateCase(item, caseById) {
  const { document, requestDocument } = prepareCaseDocument(item, caseById);
  const codes = item.kind === "quantity_operation"
    ? validateQuantityOperation(document)
    : validateSchemaDocument(item.schemaName, document);
  if (requestDocument && item.schemaName === "classification-result") {
    if (document.requestFingerprint !== sha256(canonicalCompact(requestDocument))) {
      codes.push("REQUEST_FINGERPRINT_MISMATCH");
    }
    const factIds = new Set(requestDocument.facts.map((fact) => fact.factId));
    const requestedAspectIds = new Set(requestDocument.requestedAspectIds);
    const resultRequestedAspectIds = document.facetResults.map(
      (facet) => facet.requestedAspectId,
    );
    if (document.subjectId !== requestDocument.subject.subjectId) {
      codes.push("RESULT_SUBJECT_MISMATCH");
    }
    if (new Set(resultRequestedAspectIds).size !== resultRequestedAspectIds.length) {
      codes.push("RESULT_REQUEST_DUPLICATE");
    }
    if (
      [...requestedAspectIds].sort(compareCodePoint).join("\n") !==
      [...new Set(resultRequestedAspectIds)].sort(compareCodePoint).join("\n")
    ) {
      codes.push("RESULT_REQUEST_SET_MISMATCH");
    }
    for (const facet of document.facetResults ?? []) {
      if (facet.outcome === "classified") {
        if (!requestedAspectIds.has(facet.aspectId)) {
          codes.push("RESULT_ASPECT_NOT_REQUESTED");
        }
        for (const evidencePath of facet.evidencePaths) {
          if (evidencePath.factIds.some((factId) => !factIds.has(factId))) {
            codes.push("REF_FACT_DANGLING");
          }
        }
      } else if (facet.outcome === "ambiguous") {
        for (const candidate of facet.candidates) {
          if (!requestedAspectIds.has(candidate.aspectId)) {
            codes.push("RESULT_ASPECT_NOT_REQUESTED");
          }
        }
      }
    }
  }
  return [...new Set(codes)].sort(compareCodePoint);
}

const policyValid = validators["policy-release"](policy);
record(
  "schema:policy-release",
  policyValid,
  policyValid ? "valid" : normalizeSchemaErrors(validators["policy-release"].errors),
);
for (const [name, validator] of Object.entries(validators)) {
  record(`schema:compiled:${name}`, typeof validator === "function", "strict AJV compilation");
}

const upstreamFeatureIds = featureRegistry.definitions.map((item) => item.featureId);
record(
  "crosswalk:exact-closure",
  policy.featureCrosswalk.length === 31 &&
    unique(policy.featureCrosswalk.map((item) => item.featureId)) &&
    [...upstreamFeatureIds].sort(compareCodePoint).join("\n") ===
      [...featureIds].sort(compareCodePoint).join("\n"),
  { upstream: upstreamFeatureIds.length, crosswalk: policy.featureCrosswalk.length },
);
record(
  "crosswalk:dispositions",
  crosswalk.counts.reusable === 15 &&
    crosswalk.counts.extended === 15 &&
    crosswalk.counts.unresolved === 1 &&
    policy.featureCrosswalk.find((item) => item.featureId === "harmonic.C_H")
      ?.disposition === "unresolved",
  crosswalk.counts,
);
record(
  "crosswalk:compatibility-markers",
  policy.constraintMarkers.length === 4 &&
    policy.constraintMarkers.every((marker) => !featureIds.has(marker.legacyCompilerString)),
  policy.constraintMarkers.map((item) => item.markerId),
);

record(
  "identity:unique-ids",
  unique(policy.sourceHashes.map((item) => item.sourceId)) &&
    unique(policy.operations.map((item) => item.operationId)) &&
    unique(policy.typedAspects.map((item) => item.aspectId)) &&
    unique(policy.bridgeRules.map((item) => item.ruleId)),
  "source, operation, aspect, and rule IDs unique",
);
const policySemanticCodes = new Set();
for (const operation of policy.operations) {
  for (const sourceId of provenanceSourceIds(operation)) {
    if (!sourceIds.has(sourceId)) policySemanticCodes.add("REF_PROVENANCE_DANGLING");
  }
}
for (const aspect of policy.typedAspects) {
  for (const code of semanticCodes("typed-aspect", aspect)) policySemanticCodes.add(code);
}
for (const rule of policy.bridgeRules) {
  for (const code of semanticCodes("bridge-rule", rule)) policySemanticCodes.add(code);
  for (const antecedent of rule.antecedents) {
    if (antecedent.operationId && !operationById.has(antecedent.operationId)) {
      policySemanticCodes.add("QUANTITY_OPERATION_NOT_REGISTERED");
    }
  }
}
record(
  "closure:policy-children",
  policySemanticCodes.size === 0,
  policySemanticCodes.size
    ? [...policySemanticCodes].sort(compareCodePoint)
    : "all policy child references close",
);
record(
  "closure:operation-signatures",
  policy.operations.every(
    (operation) =>
      operation.inputDimensions.length === operation.inputUnits.length &&
      operation.inputUnits.every(
        (unit, index) => unitDimensions.get(unit) === operation.inputDimensions[index],
      ) &&
      unitDimensions.get(operation.outputUnit) === operation.outputDimension,
  ),
  "all operation dimensions and units agree",
);
record(
  "closure:operation-metadata",
  policy.operations.length === expectedOperationMetadata.size &&
    policy.operations.every((operation) => {
      const expected = expectedOperationMetadata.get(operation.operationId);
      return expected &&
        canonicalCompact(operationMetadata(operation)) === canonicalCompact(expected);
    }),
  "registered kinds, signatures, constants, assumptions, and epistemic outputs match the reviewed contract",
);
record(
  "closure:rule-output",
  policy.bridgeRules.every((rule) => {
    const aspect = aspectById.get(rule.output.aspectId);
    return aspect && aspect.primaryGovernor === rule.output.primaryGovernor;
  }),
  "every rule resolves to an aspect with the same Governor",
);
record(
  "closure:active-admission",
  policy.activeAspectIds.every((id) =>
    ["provisionally_admitted", "canonical"].includes(aspectById.get(id)?.admission),
  ) &&
    policy.activeRuleIds.every((id) =>
      ["provisionally_admitted", "canonical"].includes(ruleById.get(id)?.admission),
    ),
  { activeAspects: policy.activeAspectIds, activeRules: policy.activeRuleIds },
);
record(
  "closure:active-runtime-authority",
  policy.activeAspectIds.every((id) => {
    const aspect = aspectById.get(id);
    return aspect && provenanceSourceIds(aspect).every(
      (sourceId) => sourceById.get(sourceId)?.runtimeAuthority === true,
    );
  }) &&
    policy.activeRuleIds.every((id) => {
      const rule = ruleById.get(id);
      if (!rule) return false;
      return [
        ...new Set([
          ...provenanceSourceIds(rule),
          ...rule.authoritySourceIds,
        ]),
      ].every((sourceId) => sourceById.get(sourceId)?.runtimeAuthority === true);
    }),
  "active aspects and rules depend only on runtime-authoritative sources",
);
record(
  "closure:admitted-runtime-authority",
  policy.typedAspects
    .filter((item) => ["provisionally_admitted", "canonical"].includes(item.admission))
    .every((item) =>
      provenanceSourceIds(item).every(
        (sourceId) => sourceById.get(sourceId)?.runtimeAuthority === true,
      ),
    ) &&
    policy.bridgeRules
      .filter((item) => ["provisionally_admitted", "canonical"].includes(item.admission))
      .every((item) =>
        [...new Set([...provenanceSourceIds(item), ...item.authoritySourceIds])].every(
          (sourceId) => sourceById.get(sourceId)?.runtimeAuthority === true,
        ),
      ),
  "every executable-admission item has runtime-authoritative provenance",
);
record(
  "guard:numeric-only-governor-bridge",
  policy.bridgeRules
    .filter((rule) =>
      rule.antecedents.some((item) => item.featureId?.startsWith("physical.")),
    )
    .every((rule) => rule.antecedents.some((item) => item.kind === "owner_equals")),
  "physical values require an exact source owner and never classify by number alone",
);
record(
  "guard:noncausal-policy",
  policy.bridgeRules.every(
    (rule) => rule.causalClaim === false && rule.epistemicClass !== "causal_claim",
  ),
  "no causal Governor bridge admitted",
);

let sourceHashParity = true;
for (const source of policy.sourceHashes) {
  const actual = sha256(fs.readFileSync(path.join(INTEGRATED_ROOT, source.path)));
  if (actual !== source.sha256) sourceHashParity = false;
}
record("fingerprint:source-hash-parity", sourceHashParity, `${policy.sourceHashes.length} explicit sources`);
record(
  "fingerprint:source",
  sha256(canonicalCompact(policy.sourceHashes)) === policy.sourceFingerprint,
  policy.sourceFingerprint,
);
const { policyFingerprint, ...policyCore } = policy;
record(
  "fingerprint:policy",
  sha256(canonicalCompact(policyCore)) === policyFingerprint,
  policyFingerprint,
);
record(
  "fingerprint:derived-artifacts",
  crosswalk.policyFingerprint === policyFingerprint &&
    crosswalk.sourceFingerprint === policy.sourceFingerprint &&
    examples.policyFingerprint === policyFingerprint &&
    examples.sourceFingerprint === policy.sourceFingerprint,
  "crosswalk and examples bind to policy/source fingerprints",
);

const exampleQuantities = examples.examples.flatMap((example) => example.quantities);
record(
  "examples:quantity-schema",
  exampleQuantities.every((quantity) => validators.quantity(quantity)),
  `${exampleQuantities.length} quantities valid`,
);
const exampleOperationCodes = [];
for (const example of examples.examples) {
  const quantityById = new Map(example.quantities.map((item) => [item.quantityId, item]));
  for (const output of example.quantities) {
    if (output.basis.kind !== "registered_operation") continue;
    const operands = output.basis.inputQuantityIds.map((id) => quantityById.get(id));
    if (operands.some((item) => !item)) {
      exampleOperationCodes.push("REF_QUANTITY_DANGLING");
      continue;
    }
    exampleOperationCodes.push(
      ...validateQuantityOperation({
        operationId: output.basis.operationId,
        operands,
        output,
      }),
    );
  }
}
record(
  "examples:operation-closure",
  exampleOperationCodes.length === 0,
  exampleOperationCodes.length
    ? [...new Set(exampleOperationCodes)].sort(compareCodePoint)
    : "derived values, assumptions, and input IDs verified",
);
const anchorExample = examples.examples.find(
  (item) => item.exampleId === "example:jupiter:470nm-declared-anchor",
);
const rayleighExample = examples.examples.find(
  (item) => item.exampleId === "example:jupiter:scoped-rayleigh-behavior",
);
record(
  "examples:jupiter-470-anchor",
  anchorExample?.active === true &&
    anchorExample.quantities[0].value === 470 &&
    anchorExample.quantities[0].epistemicClass ===
      "framework_declared_physical_anchor" &&
    anchorExample.facts.some((fact) => fact.includes("no musical causation")),
  "declared anchor is distinct from observation and causation",
);
record(
  "examples:rayleigh-scope",
  rayleighExample?.active === false &&
    rayleighExample.admission === "proposed" &&
    rayleighExample.quantities.some(
      (quantity) => quantity.value === 4.920403608350627,
    ),
  "fixed-condition inverse-fourth-power ratio remains proposed association",
);
record(
  "examples:aeolian-symbolic-separation",
  examples.examples.some(
    (item) =>
      item.exampleId === "example:jupiter:atmospheric-aeolian-process" &&
      item.active === false &&
      item.facts.some((fact) => fact.includes("distinct from mode:aeolian")),
  ) &&
    examples.examples.some(
      (item) =>
        item.exampleId === "example:jupiter:symbolic-profile" &&
        item.active === true,
    ),
  "proposed process and canonical profile reference remain separate",
);

const positive = readJson(path.join(PACKAGE_ROOT, "fixtures/positive-cases.json"));
const negative = readJson(path.join(PACKAGE_ROOT, "fixtures/negative-cases.json"));
const caseById = new Map(
  [...positive.cases, ...negative.cases].map((item) => [item.caseId, item]),
);
for (const item of positive.cases) {
  const codes = validateCase(item, caseById);
  record(`fixture:${item.caseId}`, codes.length === 0, codes.length ? codes : "accepted");
}
for (const item of negative.cases) {
  const codes = validateCase(item, caseById);
  const expectedCodes = [...item.expectedCodes].sort(compareCodePoint);
  record(
    `fixture:${item.caseId}`,
    canonicalCompact(codes) === canonicalCompact(expectedCodes),
    { expected: expectedCodes, actual: codes },
  );
}

const failed = checks.filter((item) => item.status === "FAIL");
const report = {
  schemaVersion: "1.0.0",
  packageVersion: "0.1.0",
  releaseId: "governor-runtime:0.1.0",
  sourceFingerprint: policy.sourceFingerprint,
  policyFingerprint: policy.policyFingerprint,
  status: failed.length ? "failed" : "passed",
  summary: {
    checks: checks.length,
    passed: checks.length - failed.length,
    failed: failed.length,
  },
  checks,
};
writeAtomic(path.join(PACKAGE_ROOT, "qa/validation-report.json"), canonicalJson(report));
console.log(JSON.stringify({ status: report.status, summary: report.summary }));
if (failed.length) process.exitCode = 1;
