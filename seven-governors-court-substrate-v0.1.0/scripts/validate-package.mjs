import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
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
import { maskFromPitchClasses, pitchClassesFromMask, primeForm } from "./substrate-builder.mjs";

const require = createRequire(import.meta.url);
const Ajv2020 = require("ajv/dist/2020");
const ajv = new Ajv2020({ allErrors: true, strict: false });
const schemaNames = [
  "common.schema.json",
  "admission-status.schema.json",
  "pentatonic-set-class.schema.json",
  "court-rooted-position.schema.json",
  "bridge-rooting.schema.json",
  "t5-cycle-entry.schema.json",
  "complement-map.schema.json",
  "substrate-registry-release.schema.json",
];
for (const name of schemaNames) {
  ajv.addSchema(readJson(path.join(PACKAGE_ROOT, "schemas", name)));
}

const release = readJson(
  path.join(PACKAGE_ROOT, "canonical/substrate-registry-release.json"),
);
const network = readJson(path.join(INTEGRATED_ROOT, "canonical/universal-network-data.json"));
const nodeById = new Map(network.nodes.map((node) => [node.id, node]));
const familyIds = new Set(network.familyRegistry.map((record) => record.forte));
const checks = [];

function record(name, passed, detail) {
  checks.push({ name, status: passed ? "PASS" : "FAIL", detail });
}

function normalizeSchemaCodes(errors) {
  return [...new Set((errors ?? []).map((error) =>
    error.keyword === "additionalProperties"
      ? "SCHEMA_ADDITIONAL_PROPERTIES"
      : `SCHEMA_${error.keyword.toUpperCase()}`,
  ))].sort(compareCodePoint);
}

function sameArray(left, right) {
  return canonicalCompact(left) === canonicalCompact(right);
}

export function semanticCodes(document) {
  const codes = new Set();
  const complementBySetClass = new Map(
    document.complementMaps.map((item) => [item.pentatonicSetClassId, item]),
  );
  const t5ByIndex = new Map(document.t5Cycle.map((item) => [item.cycleIndex, item]));
  const primeBySetClass = new Map(
    document.pentatonicSetClasses.map((item) => [
      item.setClassId,
      primeForm(item.representativeMask).join(","),
    ]),
  );
  for (const item of document.pentatonicSetClasses) {
    const pitches = pitchClassesFromMask(item.representativeMask);
    if (pitches.length !== 5) codes.add("MASK_WEIGHT_INVALID");
    if (!sameArray(pitches, item.representativePitchClasses)) {
      codes.add("MASK_PITCH_CLASS_MISMATCH");
    }
    const complement = complementBySetClass.get(item.setClassId);
    if (!complement) {
      codes.add("COMPLEMENT_MISSING");
    } else if (!familyIds.has(complement.heptatonicFamilyId)) {
      codes.add("COMPLEMENT_DANGLING");
    }
    if (item.admissionStatus !== "proposed") {
      if (!item.t5Reference) {
        codes.add("ADMITTED_T5_REFERENCE_MISSING");
      } else {
        const entry = t5ByIndex.get(item.t5Reference.cycleIndex);
        if (!entry || entry.offset !== item.t5Reference.offset) {
          codes.add("ADMITTED_T5_REFERENCE_INVALID");
        }
      }
    }
    const expectedStatus =
      item.setClassId === "pentatonic:5-35"
        ? "admitted"
        : new Set(["pentatonic:5-23", "pentatonic:5-27"]).has(item.setClassId)
          ? "admitted-bridge"
          : "proposed";
    if (item.admissionStatus !== expectedStatus) codes.add("OFF_CHAIN_CANONICAL_CLAIM");
    if (item.admissionStatus === "proposed") {
      if (!item.admissionBlocker || !fs.existsSync(path.join(INTEGRATED_ROOT, item.admissionBlocker))) {
        codes.add("ADMISSION_BLOCKER_DANGLING");
      }
    }
  }
  const expectedOffsets = Array.from({ length: 12 }, (_, index) => (index * 5) % 12);
  if (
    document.t5Cycle.length !== 12 ||
    document.t5Cycle.some(
      (entry, index) =>
        entry.cycleIndex !== index ||
        entry.offset !== expectedOffsets[index] ||
        entry.nextOffset !== expectedOffsets[(index + 1) % 12],
    )
  ) {
    codes.add("T5_CYCLE_INVALID");
  }
  if (!sameArray(document.courtSegmentOffsets, [0, 5, 10, 3, 8])) {
    codes.add("T5_COURT_SEGMENT_INVALID");
  }
  const positions = [...document.courtRootedPositions].sort((left, right) =>
    compareCodePoint(left.positionId, right.positionId),
  );
  const xorSupports = [];
  for (let index = 0; index < positions.length; index += 1) {
    const position = positions[index];
    const expectedKappa = [
      { numerator: 0, denominator: 1 },
      { numerator: 1, denominator: 4 },
      { numerator: 1, denominator: 2 },
      { numerator: 3, denominator: 4 },
      { numerator: 1, denominator: 1 },
    ][index];
    if (!sameArray(position.kappaCourt, expectedKappa)) codes.add("COURT_KAPPA_INVALID");
    if (primeBySetClass.get(position.setClassId) !== primeForm(position.pitchMask).join(",")) {
      codes.add("COURT_SET_CLASS_INVALID");
    }
    if (index === 0) {
      if (position.xorSupportFromPrevious !== null) codes.add("COURT_XOR_SUPPORT_INVALID");
    } else {
      const expectedSupport = pitchClassesFromMask(
        positions[index - 1].pitchMask ^ position.pitchMask,
      );
      if (!sameArray(position.xorSupportFromPrevious, expectedSupport)) {
        codes.add("COURT_XOR_SUPPORT_INVALID");
      } else {
        xorSupports.push(...expectedSupport);
      }
    }
  }
  if (new Set(xorSupports).size !== xorSupports.length) codes.add("COURT_XOR_SUPPORT_OVERLAP");
  for (const bridge of document.bridgeRootings) {
    if ((bridge.pitchMask & bridge.sourceScaleStateId) !== bridge.pitchMask) {
      codes.add("BRIDGE_SOURCE_SUBSET_INVALID");
    }
    if ((bridge.pitchMask & bridge.targetScaleStateId) !== bridge.pitchMask) {
      codes.add("BRIDGE_TARGET_SUBSET_INVALID");
    }
    if (primeBySetClass.get(bridge.setClassId) !== primeForm(bridge.pitchMask).join(",")) {
      codes.add("BRIDGE_SET_CLASS_INVALID");
    }
  }
  for (const complement of document.complementMaps) {
    const complementFamilyIsRegistered = familyIds.has(complement.heptatonicFamilyId);
    if (complement.representativeHeptatonicMask !== (4095 ^ complement.representativePentatonicMask)) {
      codes.add("COMPLEMENT_MASK_INVALID");
    }
    if (complement.familyRegistryPointer.familyId !== complement.heptatonicFamilyId) {
      codes.add("COMPLEMENT_POINTER_INVALID");
    }
    for (const pair of complement.rootedPairs) {
      if (pair.rawHeptatonicComplementMask !== (4095 ^ pair.pentatonicMask)) {
        codes.add("ROOTED_COMPLEMENT_MASK_INVALID");
      }
      if (
        complementFamilyIsRegistered &&
        nodeById.get(pair.normalizedHeptatonicScaleStateId)?.forte !==
        complement.heptatonicFamilyId
      ) {
        codes.add("ROOTED_COMPLEMENT_FAMILY_INVALID");
      }
    }
  }
  return [...codes].sort(compareCodePoint);
}

const releaseValidator = ajv.getSchema(
  "https://seven-governors.local/court-substrate/0.1.0/schemas/substrate-registry-release.schema.json",
);
const releaseSchemaValid = releaseValidator(release);
record(
  "release-schema",
  releaseSchemaValid,
  releaseSchemaValid ? "valid" : releaseValidator.errors,
);
const semantic = semanticCodes(release);
record("semantic-closure", semantic.length === 0, semantic);

const releaseCore = Object.fromEntries(
  Object.entries(release).filter(([key]) => key !== "substrateFingerprint"),
);
record(
  "substrate-fingerprint",
  sha256(canonicalCompact(releaseCore)) === release.substrateFingerprint,
  release.substrateFingerprint,
);
const recomputedSourceHashes = release.sourceHashes.map((item) => ({
  path: item.path,
  sha256: sha256(fs.readFileSync(path.join(INTEGRATED_ROOT, item.path))),
}));
record(
  "source-hash-parity",
  sameArray(recomputedSourceHashes, release.sourceHashes) &&
    sha256(canonicalCompact(release.sourceHashes)) === release.sourceFingerprint,
  { sourceCount: release.sourceHashes.length, sourceFingerprint: release.sourceFingerprint },
);
record(
  "registry-counts",
  release.summary.pentatonicSetClassCount === 38 &&
    release.summary.courtRootedPositionCount === 5 &&
    release.summary.bridgeRootingCount === 2 &&
    release.summary.proposedSetClassCount === 35 &&
    release.summary.complementMapCount === 38,
  release.summary,
);
record(
  "bridge-minimality",
  release.minimalAdditionalBridgeSetClasses.length === 0 &&
    release.bridgeRootings.every(
      (bridge) =>
        (bridge.pitchMask & bridge.sourceScaleStateId) === bridge.pitchMask &&
        (bridge.pitchMask & bridge.targetScaleStateId) === bridge.pitchMask,
    ),
  {
    bridgeIds: release.bridgeRootings.map((item) => item.bridgeRootingId),
    minimalAdditionalBridgeSetClasses: release.minimalAdditionalBridgeSetClasses,
  },
);

const positiveFixtures = readJson(path.join(PACKAGE_ROOT, "fixtures/positive-cases.json"));
record(
  "positive-fixtures",
  positiveFixtures.cases.length === 5,
  positiveFixtures.cases.map((item) => item.fixtureId),
);

function mutatedRelease(testCase) {
  const copy = structuredClone(release);
  const setClass = copy.pentatonicSetClasses.find((item) => item.setClassId === testCase.target);
  const position = copy.courtRootedPositions.find((item) => item.positionId === testCase.target);
  const complement = copy.complementMaps.find(
    (item) => item.pentatonicSetClassId === testCase.target,
  );
  switch (testCase.operation) {
    case "add_unknown_property":
      setClass.unknownProperty = true;
      break;
    case "set_representative_mask":
      setClass.representativeMask = testCase.value;
      break;
    case "set_out_of_range_mask":
      setClass.representativeMask = testCase.value;
      break;
    case "remove_complement_map":
      copy.complementMaps = copy.complementMaps.filter(
        (item) => item.pentatonicSetClassId !== testCase.target,
      );
      break;
    case "set_complement_family":
      complement.heptatonicFamilyId = testCase.value;
      complement.familyRegistryPointer.familyId = testCase.value;
      break;
    case "remove_t5_reference":
      setClass.t5Reference = null;
      break;
    case "set_t5_cycle_index":
      setClass.t5Reference.cycleIndex = testCase.value;
      break;
    case "promote_proposed_class":
      setClass.admissionStatus = "admitted";
      setClass.admissionBlocker = null;
      setClass.t5Reference = {
        cycleIndex: 0,
        offset: 0,
        semantics: "canonical_court_segment_origin",
      };
      break;
    case "set_unknown_admission_status":
      setClass.admissionStatus = testCase.value;
      break;
    case "set_kappa":
      position.kappaCourt = testCase.value;
      break;
    case "set_xor_support":
      position.xorSupportFromPrevious = testCase.value;
      break;
    default:
      throw new Error(`UNKNOWN_NEGATIVE_FIXTURE_OPERATION: ${testCase.operation}`);
  }
  return copy;
}

const setClassValidator = ajv.getSchema(
  "https://seven-governors.local/court-substrate/0.1.0/schemas/pentatonic-set-class.schema.json",
);
const negativeFixtures = readJson(path.join(PACKAGE_ROOT, "fixtures/negative-cases.json"));
const fixtureResults = negativeFixtures.cases.map((testCase) => {
  const document = mutatedRelease(testCase);
  let actualCodes;
  if (
    new Set([
      "add_unknown_property",
      "set_out_of_range_mask",
      "set_unknown_admission_status",
    ]).has(testCase.operation)
  ) {
    const target = document.pentatonicSetClasses.find(
      (item) => item.setClassId === testCase.target,
    );
    setClassValidator(target);
    actualCodes = normalizeSchemaCodes(setClassValidator.errors);
  } else {
    actualCodes = semanticCodes(document);
  }
  return {
    fixtureId: testCase.fixtureId,
    expectedCodes: testCase.expectedCodes,
    actualCodes,
    ...(testCase.operation === "promote_proposed_class"
      ? { reasonCode: "off_chain", proposedSetClassId: testCase.target }
      : {}),
    passed: sameArray(actualCodes, testCase.expectedCodes),
  };
});
record(
  "negative-fixtures",
  fixtureResults.every((item) => item.passed),
  fixtureResults,
);

const forbiddenAuthorityKeys = new Set([
  "office",
  "officeindex",
  "hasgovernorseat",
  "occupiesoffice",
  "degreegovernor",
  "primarygovernor",
  "operationalgovernor",
]);
function containsForbiddenKey(value) {
  if (Array.isArray(value)) return value.some(containsForbiddenKey);
  if (value && typeof value === "object") {
    return Object.entries(value).some(([key, item]) => {
      const normalized = [...key.toLowerCase()].filter((character) => /[a-z0-9]/.test(character)).join("");
      return forbiddenAuthorityKeys.has(normalized) || containsForbiddenKey(item);
    });
  }
  return false;
}
record("topology-write-prohibition", !containsForbiddenKey(release), "no forbidden authority fields");

const failed = checks.filter((item) => item.status === "FAIL");
const report = {
  schemaVersion: "1.0.0",
  packageVersion: release.packageVersion,
  releaseId: release.releaseId,
  substrateFingerprint: release.substrateFingerprint,
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
