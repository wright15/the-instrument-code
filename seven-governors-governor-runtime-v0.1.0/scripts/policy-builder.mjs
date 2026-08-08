import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import {
  INTEGRATED_ROOT,
  PACKAGE_ROOT,
  assert,
  canonicalCompact,
  canonicalJson,
  compareCodePoint,
  readJson,
  sha256,
  sortById,
  sortProvenance,
} from "./lib.mjs";

const PACKAGE_DIRECTORY = path.basename(PACKAGE_ROOT);

const SOURCE_SPECS = [
  {
    sourceId: "source:governor-runtime-crosswalk:0.1.0",
    path: `${PACKAGE_DIRECTORY}/source/feature-crosswalk.json`,
    authority: "runtime_policy",
    admission: "canonical",
    runtimeAuthority: true,
  },
  {
    sourceId: "source:governor-runtime-policy-input:0.1.0",
    path: `${PACKAGE_DIRECTORY}/source/policy-input.json`,
    authority: "runtime_policy",
    admission: "canonical",
    runtimeAuthority: true,
  },
  {
    sourceId: "source:governor-domain-authority:1.0.0",
    path: "docs/GOVERNOR_DOMAIN_AUTHORITY.md",
    authority: "runtime_policy",
    admission: "canonical",
    runtimeAuthority: true,
  },
  {
    sourceId: "source:feature-registry:0.1.1",
    path: "seven-governors-canonical-feature-profile-registry-v0.1.1/canonical/feature-registry.json",
    authority: "profile_registry",
    admission: "canonical",
    runtimeAuthority: true,
  },
  {
    sourceId: "source:photonic-records:0.1.1",
    path: "seven-governors-canonical-feature-profile-registry-v0.1.1/canonical/photonic-records.json",
    authority: "profile_registry",
    admission: "canonical",
    runtimeAuthority: true,
  },
  {
    sourceId: "source:canonical-governor-profiles:0.1.1",
    path: "seven-governors-canonical-feature-profile-registry-v0.1.1/canonical/canonical-governor-profiles.json",
    authority: "profile_registry",
    admission: "canonical",
    runtimeAuthority: true,
  },
  {
    sourceId: "source:profile-registry-release:0.1.1",
    path: "seven-governors-canonical-feature-profile-registry-v0.1.1/canonical/registry-release.json",
    authority: "profile_registry",
    admission: "canonical",
    runtimeAuthority: true,
  },
  {
    sourceId: "source:domain-projection-registry:0.1.1",
    path: "seven-governors-canonical-feature-profile-registry-v0.1.1/canonical/domain-projection-registry.json",
    authority: "profile_registry",
    admission: "canonical",
    runtimeAuthority: true,
  },
  {
    sourceId: "source:physical-phenomena:0.2.0",
    path: "seven-governors-state-machine-spec-and-authoring-toolkit-v0.2.0/schemas/physical_phenomena.yaml",
    authority: "candidate_companion",
    admission: "proposed",
    runtimeAuthority: false,
  },
];

function normalizeCrosswalk(entries, reverseInputOrder) {
  const source = reverseInputOrder ? [...entries].reverse() : entries;
  return sortById(source, "featureId").map((entry) => ({ ...entry }));
}

function normalizeOperations(operations, reverseInputOrder) {
  const source = reverseInputOrder ? [...operations].reverse() : operations;
  return sortById(source, "operationId").map((operation) => ({
    ...operation,
    constants: sortById(
      reverseInputOrder ? [...operation.constants].reverse() : operation.constants,
      "name",
    ),
    requiredAssumptions: [
      ...(reverseInputOrder
        ? [...operation.requiredAssumptions].reverse()
        : operation.requiredAssumptions),
    ].sort(compareCodePoint),
    provenance: sortProvenance(
      reverseInputOrder ? [...operation.provenance].reverse() : operation.provenance,
    ),
  }));
}

function normalizeAspects(aspects, reverseInputOrder) {
  const source = reverseInputOrder ? [...aspects].reverse() : aspects;
  return sortById(source, "aspectId").map((aspect) => ({
    ...aspect,
    provenance: sortProvenance(
      reverseInputOrder ? [...aspect.provenance].reverse() : aspect.provenance,
    ),
  }));
}

function normalizeRules(rules, reverseInputOrder) {
  const source = reverseInputOrder ? [...rules].reverse() : rules;
  return sortById(source, "ruleId").map((rule) => ({
    ...rule,
    antecedents: sortById(
      reverseInputOrder ? [...rule.antecedents].reverse() : rule.antecedents,
      "antecedentId",
    ).map((antecedent) => ({
      ...antecedent,
      provenance: sortProvenance(
        reverseInputOrder
          ? [...antecedent.provenance].reverse()
          : antecedent.provenance,
      ),
    })),
    authoritySourceIds: [
      ...(reverseInputOrder
        ? [...rule.authoritySourceIds].reverse()
        : rule.authoritySourceIds),
    ].sort(compareCodePoint),
    provenance: sortProvenance(
      reverseInputOrder ? [...rule.provenance].reverse() : rule.provenance,
    ),
  }));
}

function buildSourceHashes() {
  return sortById(SOURCE_SPECS, "sourceId").map((source) => {
    const bytes = fs.readFileSync(path.join(INTEGRATED_ROOT, source.path));
    return { ...source, sha256: sha256(bytes) };
  });
}

function makeQuantity({
  quantityId,
  value,
  dimension,
  unit,
  epistemicClass,
  basis,
  sourceId,
  pointer,
  assumptions = [],
}) {
  return {
    schemaVersion: "1.0.0",
    quantityId,
    value,
    dimension,
    unit,
    epistemicClass,
    basis,
    provenance: [{ sourceId, pointer }],
    assumptions: [...assumptions].sort(compareCodePoint),
  };
}

function buildExamples({ jupiterPhotonic, sunPhotonic, jupiterProfile, rayleigh }) {
  const photonicConstants = jupiterPhotonic.calculation.constants;
  const wavelength = makeQuantity({
    quantityId: "quantity:jupiter:declared-wavelength:v1",
    value: jupiterPhotonic.representativeWavelengthNm,
    dimension: "length",
    unit: "nm",
    epistemicClass: "framework_declared_physical_anchor",
    basis: {
      kind: "framework_declaration",
      ownerScope: "governor.office",
      ownerId: "office:Jupiter",
    },
    sourceId: "source:photonic-records:0.1.1",
    pointer: "/records/4/representativeWavelengthNm",
  });
  const frequency = makeQuantity({
    quantityId: "quantity:jupiter:vacuum-frequency:v1",
    value: photonicConstants.speedOfLightMS / (wavelength.value * 1e-9),
    dimension: "frequency",
    unit: "Hz",
    epistemicClass: "physically_derived",
    basis: {
      kind: "registered_operation",
      operationId: "operation:vacuum-wavelength-frequency:v1",
      inputQuantityIds: [wavelength.quantityId],
    },
    sourceId: "source:photonic-records:0.1.1",
    pointer: "/records/4/vacuumFrequencyHz",
    assumptions: ["vacuum_wavelength"],
  });
  const energyJ = makeQuantity({
    quantityId: "quantity:jupiter:photon-energy-j:v1",
    value: photonicConstants.planckConstantJS * frequency.value,
    dimension: "energy",
    unit: "J",
    epistemicClass: "physically_derived",
    basis: {
      kind: "registered_operation",
      operationId: "operation:photon-energy-frequency:v1",
      inputQuantityIds: [frequency.quantityId],
    },
    sourceId: "source:photonic-records:0.1.1",
    pointer: "/records/4/photonEnergyJ",
    assumptions: ["single_photon"],
  });
  const energyEv = makeQuantity({
    quantityId: "quantity:jupiter:photon-energy-ev:v1",
    value: energyJ.value / photonicConstants.electronVoltJ,
    dimension: "energy",
    unit: "eV",
    epistemicClass: "physically_derived",
    basis: {
      kind: "registered_operation",
      operationId: "operation:energy-j-to-ev:v1",
      inputQuantityIds: [energyJ.quantityId],
    },
    sourceId: "source:photonic-records:0.1.1",
    pointer: "/records/4/photonEnergyEv",
  });
  const comparisonWavelength = makeQuantity({
    quantityId: "quantity:sun:declared-wavelength:v1",
    value: sunPhotonic.representativeWavelengthNm,
    dimension: "length",
    unit: "nm",
    epistemicClass: "framework_declared_physical_anchor",
    basis: {
      kind: "framework_declaration",
      ownerScope: "governor.office",
      ownerId: "office:Sun",
    },
    sourceId: "source:photonic-records:0.1.1",
    pointer: "/records/0/representativeWavelengthNm",
  });
  const rayleighAssumptions = [
    "scatterer_size_much_smaller_than_both_wavelengths",
    "fixed_refractive_properties_and_number_density",
    "fixed_geometry_polarization_and_angle",
    "relative_intensity_only",
  ];
  const rayleighRatio = makeQuantity({
    quantityId: "quantity:rayleigh:470nm-to-700nm-relative-ratio:v1",
    value: (comparisonWavelength.value / wavelength.value) ** 4,
    dimension: "dimensionless",
    unit: "one",
    epistemicClass: "physically_derived",
    basis: {
      kind: "registered_operation",
      operationId: "operation:relative-rayleigh:v1",
      inputQuantityIds: [wavelength.quantityId, comparisonWavelength.quantityId],
    },
    sourceId: "source:physical-phenomena:0.2.0",
    pointer: "/physical_phenomena/governor_registry/jupiter/reference_formula",
    assumptions: rayleighAssumptions,
  });

  return {
    schemaVersion: "1.0.0",
    releaseId: "governor-runtime:0.1.0",
    examples: [
      {
        exampleId: "example:jupiter:470nm-declared-anchor",
        kind: "declared_photonic_anchor",
        admission: "canonical",
        active: true,
        ruleId: "rule:jupiter:declared-wavelength:v1",
        quantities: [wavelength, frequency, energyJ, energyEv],
        facts: [
          "470 nm is Jupiter's framework-declared representative office anchor.",
          "Frequency and photon energy are registered SI derivations.",
          "The record is not an empirical measurement of Jupiter and makes no musical causation claim.",
        ],
      },
      {
        exampleId: "example:jupiter:scoped-rayleigh-behavior",
        kind: "scoped_physical_model",
        admission: "proposed",
        active: false,
        ruleId: "rule:jupiter:rayleigh-descriptive-model:v1",
        quantities: [wavelength, comparisonWavelength, rayleighRatio],
        facts: [
          rayleigh.physical_scope,
          `Relative fixed-condition ratio I(470 nm)/I(700 nm) = ${rayleighRatio.value}.`,
          "The physical calculation does not cause or admit the proposed Governor association.",
        ],
      },
      {
        exampleId: "example:jupiter:atmospheric-aeolian-process",
        kind: "authored_process_association",
        admission: "proposed",
        active: false,
        ruleId: "rule:jupiter:atmospheric-aeolian-process:v1",
        quantities: [],
        facts: [
          "process:atmospheric_aeolian_transport is distinct from mode:aeolian.",
          `Jupiter's authored thermodynamic correspondence is ${jupiterProfile.semantic.thermodynamicFunction}.`,
          "The proposed association does not assert that Aeolian mode causes wind or atmospheric transport.",
        ],
      },
      {
        exampleId: "example:jupiter:symbolic-profile",
        kind: "canonical_reference_association",
        admission: "canonical",
        active: true,
        ruleId: "rule:jupiter:symbolic-profile:v1",
        quantities: [],
        facts: [
          "The exact Jupiter profile contains eagle in its canonical symbolic reference pool.",
          "An arbitrary eagle entity is not thereby classified as Jupiter.",
          "Reference association is non-causal and non-exclusive outside the profile scope.",
        ],
      },
    ].sort((left, right) => compareCodePoint(left.exampleId, right.exampleId)),
  };
}

export function buildArtifacts({ reverseInputOrder = false } = {}) {
  const featureCrosswalk = readJson(path.join(PACKAGE_ROOT, "source/feature-crosswalk.json"));
  const policyInput = readJson(path.join(PACKAGE_ROOT, "source/policy-input.json"));
  const featureRegistry = readJson(
    path.join(
      INTEGRATED_ROOT,
      "seven-governors-canonical-feature-profile-registry-v0.1.1/canonical/feature-registry.json",
    ),
  );
  const photonicRecords = readJson(
    path.join(
      INTEGRATED_ROOT,
      "seven-governors-canonical-feature-profile-registry-v0.1.1/canonical/photonic-records.json",
    ),
  );
  const profiles = readJson(
    path.join(
      INTEGRATED_ROOT,
      "seven-governors-canonical-feature-profile-registry-v0.1.1/canonical/canonical-governor-profiles.json",
    ),
  );
  const profileRelease = readJson(
    path.join(
      INTEGRATED_ROOT,
      "seven-governors-canonical-feature-profile-registry-v0.1.1/canonical/registry-release.json",
    ),
  );
  const domainProjections = readJson(
    path.join(
      INTEGRATED_ROOT,
      "seven-governors-canonical-feature-profile-registry-v0.1.1/canonical/domain-projection-registry.json",
    ),
  );
  const phenomenonRegistry = YAML.parse(
    fs.readFileSync(
      path.join(
        INTEGRATED_ROOT,
        "seven-governors-state-machine-spec-and-authoring-toolkit-v0.2.0/schemas/physical_phenomena.yaml",
      ),
      "utf8",
    ),
  ).physical_phenomena;

  assert(
    profileRelease.releaseId === policyInput.upstreamReleaseId &&
      profileRelease.releaseFingerprint ===
        "e67089fb4f81584710aca15b34eb61a1f382709d057518a69e4cadcd541d327d",
    "UPSTREAM_RELEASE_MISMATCH",
    "profile registry release identity or fingerprint changed",
  );
  assert(
    domainProjections.projections.length === 1 &&
      domainProjections.projections[0].domain === "landforms",
    "DOMAIN_PROJECTION_ADMISSION_MISMATCH",
    "landforms must remain the sole executable projection",
  );
  assert(
    phenomenonRegistry.admission === "proposed",
    "CANDIDATE_ADMISSION_MISMATCH",
    "physical phenomena must remain proposed",
  );

  const upstreamFeatureIds = featureRegistry.definitions.map((item) => item.featureId);
  const crosswalkIds = featureCrosswalk.entries.map((item) => item.featureId);
  assert(new Set(upstreamFeatureIds).size === 31, "FEATURE_REGISTRY_COUNT", "expected 31 unique upstream features");
  assert(new Set(crosswalkIds).size === 31, "FEATURE_CROSSWALK_DUPLICATE", "crosswalk must contain 31 unique IDs");
  assert(
    [...upstreamFeatureIds].sort(compareCodePoint).join("\n") ===
      [...crosswalkIds].sort(compareCodePoint).join("\n"),
    "FEATURE_CROSSWALK_CLOSURE",
    "crosswalk IDs must exactly match the upstream registry",
  );
  const dispositionCounts = featureCrosswalk.entries.reduce((counts, item) => {
    counts[item.disposition] = (counts[item.disposition] ?? 0) + 1;
    return counts;
  }, {});
  assert(
    dispositionCounts.reusable === 15 &&
      dispositionCounts.extended === 15 &&
      dispositionCounts.unresolved === 1,
    "FEATURE_CROSSWALK_DISPOSITIONS",
    "expected 15 reusable, 15 extended, and one unresolved",
  );
  assert(
    featureCrosswalk.entries.find((item) => item.featureId === "harmonic.C_H")?.disposition ===
      "unresolved",
    "HARMONIC_COMPRESSION_ADMISSION",
    "harmonic.C_H must remain unresolved",
  );

  const jupiterPhotonic = photonicRecords.records.find((item) => item.office === "Jupiter");
  const sunPhotonic = photonicRecords.records.find((item) => item.office === "Sun");
  const jupiterProfile = profiles.profiles.find((item) => item.office === "Jupiter");
  const rayleigh = phenomenonRegistry.governor_registry.jupiter;
  assert(
    jupiterPhotonic?.representativeWavelengthNm === 470 &&
      jupiterPhotonic.interpretationPolicy.causationClaim === false &&
      jupiterPhotonic.interpretationPolicy.mutatedByMusicalOperator === false,
    "JUPITER_PHOTONIC_FIXTURE",
    "Jupiter must retain its declared, non-causal 470 nm anchor",
  );
  assert(
    jupiterProfile?.profileId === "profile:jupiter:v0.1.1" &&
      jupiterProfile.canonicalIdentity.mode === "aeolian" &&
      jupiterProfile.semantic.thermodynamicFunction === "distribution" &&
      jupiterProfile.domainReferences.symbolicReferences.includes("eagle"),
    "JUPITER_PROFILE_FIXTURE",
    "Jupiter profile semantics or references changed",
  );
  assert(
    rayleigh?.phenomenon_id === "phenomenon:rayleigh_scattering" &&
      phenomenonRegistry.assignment_policy.physical_causation_claim === false &&
      rayleigh.prohibited_inferences.some((item) =>
        item.includes("not caused by Jupiter, Aeolian, Air, or a mutation"),
      ),
    "RAYLEIGH_FIXTURE",
    "Rayleigh candidate model changed or became causal",
  );

  const sourceHashes = buildSourceHashes();
  const sourceFingerprint = sha256(canonicalCompact(sourceHashes));
  const normalizedCrosswalk = normalizeCrosswalk(featureCrosswalk.entries, reverseInputOrder);
  const constraintMarkers = sortById(
    reverseInputOrder
      ? [...policyInput.constraintMarkers].reverse()
      : policyInput.constraintMarkers,
    "markerId",
  );
  const policyCore = {
    schemaVersion: "1.0.0",
    packageName: "seven-governors-governor-runtime",
    packageVersion: "0.1.0",
    policyVersion: policyInput.policyVersion,
    releaseId: policyInput.releaseId,
    releaseDate: policyInput.releaseDate,
    releaseAdmission: policyInput.releaseAdmission,
    upstreamReleaseId: policyInput.upstreamReleaseId,
    sourceHashes,
    sourceFingerprint,
    featureCrosswalk: normalizedCrosswalk,
    constraintMarkers,
    operations: normalizeOperations(policyInput.operations, reverseInputOrder),
    typedAspects: normalizeAspects(policyInput.typedAspects, reverseInputOrder),
    bridgeRules: normalizeRules(policyInput.bridgeRules, reverseInputOrder),
    activeAspectIds: [...policyInput.activeAspectIds].sort(compareCodePoint),
    activeRuleIds: [...policyInput.activeRuleIds].sort(compareCodePoint),
  };
  const policyFingerprint = sha256(canonicalCompact(policyCore));
  const policyRelease = { ...policyCore, policyFingerprint };
  const crosswalkRelease = {
    schemaVersion: "1.0.0",
    releaseId: policyInput.releaseId,
    upstreamReleaseId: featureCrosswalk.sourceReleaseId,
    sourceFingerprint,
    policyFingerprint,
    counts: dispositionCounts,
    entries: normalizedCrosswalk,
  };
  const examples = {
    ...buildExamples({ jupiterPhotonic, sunPhotonic, jupiterProfile, rayleigh }),
    sourceFingerprint,
    policyFingerprint,
  };

  return new Map([
    ["policy-release.json", canonicalJson(policyRelease)],
    ["feature-typed-aspect-crosswalk.json", canonicalJson(crosswalkRelease)],
    ["canonical-bridge-examples.json", canonicalJson(examples)],
  ]);
}
