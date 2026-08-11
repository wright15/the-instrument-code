import fs from "node:fs";
import path from "node:path";
import { parse as parseYaml } from "yaml";
import {
  INTEGRATED_ROOT,
  PACKAGE_ROOT,
  assert,
  canonicalCompact,
  canonicalJson,
  compareCodePoint,
  readJson,
  sha256,
} from "./lib.mjs";

const FULL_MASK = (1 << 12) - 1;
const POLE_ORDER = ["Mars", "Jupiter", "Venus", "Saturn"];
const COURT_SEGMENT_OFFSETS = [0, 5, 10, 3, 8];
const OUTPUT_NAMES = [
  "admission-status-ledger.json",
  "bridge-rootings.json",
  "complement-map.json",
  "court-rooted-positions.json",
  "pentatonic-set-class-registry.json",
  "substrate-registry-release.json",
  "t5-cycle.json",
];

export { OUTPUT_NAMES };

export function pitchClassesFromMask(mask) {
  return Array.from({ length: 12 }, (_, pitchClass) => pitchClass).filter(
    (pitchClass) => mask & (1 << pitchClass),
  );
}

export function maskFromPitchClasses(pitchClasses) {
  return pitchClasses.reduce((mask, pitchClass) => mask | (1 << pitchClass), 0);
}

export function mask12(mask) {
  return Array.from({ length: 12 }, (_, pitchClass) =>
    mask & (1 << pitchClass) ? "1" : "0",
  ).join("");
}

function transposeMask(mask, steps) {
  return maskFromPitchClasses(
    pitchClassesFromMask(mask).map((pitchClass) => (pitchClass + steps) % 12),
  );
}

function invertMask(mask, axis) {
  return maskFromPitchClasses(
    pitchClassesFromMask(mask).map((pitchClass) => (axis - pitchClass + 12) % 12),
  );
}

export function primeForm(mask) {
  const candidates = new Map();
  for (let index = 0; index < 12; index += 1) {
    for (const transformed of [transposeMask(mask, index), invertMask(mask, index)]) {
      const pitches = pitchClassesFromMask(transformed);
      if (pitches[0] === 0) candidates.set(pitches.join(","), pitches);
    }
  }
  return [...candidates.values()].sort((left, right) => {
    const leftRank = [left.at(-1), ...left.slice(1, -1)];
    const rightRank = [right.at(-1), ...right.slice(1, -1)];
    for (let index = 0; index < leftRank.length; index += 1) {
      if (leftRank[index] !== rightRank[index]) return leftRank[index] - rightRank[index];
    }
    return 0;
  })[0];
}

function collectFamilyPointers(value, segments = [], result = new Map()) {
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      collectFamilyPointers(item, [...segments, String(index)], result),
    );
  } else if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      collectFamilyPointers(item, [...segments, key], result);
    }
  } else if (typeof value === "string" && /^7-(?:Z)?\d+$/.test(value)) {
    if (!result.has(value)) {
      const pointer = segments
        .map((segment) => segment.replaceAll("~", "~0").replaceAll("/", "~1"))
        .join("/");
      result.set(value, `/${pointer}`);
    }
  }
  return result;
}

function view(release, recordsKey) {
  return {
    schemaVersion: release.schemaVersion,
    releaseId: release.releaseId,
    integratedAdmission: release.integratedAdmission,
    sourceFingerprint: release.sourceFingerprint,
    substrateFingerprint: release.substrateFingerprint,
    [recordsKey]: release[recordsKey],
  };
}

export function buildRelease({ reverseInputOrder = false } = {}) {
  const inputPath = path.join(PACKAGE_ROOT, "source/substrate-input.json");
  const authored = readJson(inputPath);
  const input = structuredClone(authored);
  if (reverseInputOrder) {
    for (const key of [
      "bridgeRootings",
      "courtRootedPositions",
      "setClassAdmissions",
      "sourcePaths",
    ]) {
      input[key].reverse();
    }
  }

  const network = readJson(path.join(INTEGRATED_ROOT, "canonical/universal-network-data.json"));
  const authorityContract = readJson(
    path.join(INTEGRATED_ROOT, "schemas/court-admission-contract.json"),
  );
  const topologyIdentity = readJson(
    path.join(INTEGRATED_ROOT, "canonical/topology-identity-definitions.json"),
  );
  const familyIds = network.familyRegistry.map((record) => record.forte);
  assert(
    authorityContract.admissionScope.canonicalSetClass === "5-35" &&
      canonicalCompact(authorityContract.admissionScope.canonicalCourtPositions) ===
        canonicalCompact(["C0", "C1", "C2", "C3", "C4"]) &&
      canonicalCompact(authorityContract.admissionScope.bridgeSetClasses) ===
        canonicalCompact(["5-23", "5-27"]),
    "AUTHORITY_SCOPE_MISMATCH",
    "CRT-301 Court scope",
  );
  const fivefoldPath = path.join(
    INTEGRATED_ROOT,
    "seven-governors-state-machine-spec-and-authoring-toolkit-v0.2.0/schemas/fivefold_engine.yaml",
  );
  const fivefold = parseYaml(fs.readFileSync(fivefoldPath, "utf8")).fivefold_engine;
  assert(fivefold.admission === "proposed", "FIVEFOLD_ADMISSION_MISMATCH", fivefold.admission);
  assert(
    canonicalCompact(fivefold.pole_order.map((record) => record.governor)) ===
      canonicalCompact(POLE_ORDER),
    "FIVEFOLD_POLE_ORDER_MISMATCH",
    "pole order",
  );
  const fivefoldStates = new Map(
    fivefold.canonical_states.map((record) => [record.state_id, record]),
  );
  for (const position of input.courtRootedPositions) {
    const sourceState = fivefoldStates.get(position.positionId);
    assert(sourceState, "FIVEFOLD_STATE_MISSING", position.positionId);
    assert(
      sourceState.vector === position.poleVector &&
        canonicalCompact(sourceState.internal_poles) ===
          canonicalCompact(position.internalPoles) &&
        sourceState.kappa_court ===
          position.kappaCourt.numerator / position.kappaCourt.denominator,
      "FIVEFOLD_STATE_MISMATCH",
      position.positionId,
    );
  }
  assert(familyIds.length === 38, "FAMILY_COUNT", `expected 38, received ${familyIds.length}`);
  assert(new Set(familyIds).size === 38, "FAMILY_DUPLICATE", "heptatonic families");
  const nodeById = new Map(network.nodes.map((node) => [node.id, node]));
  const nodesByFamily = new Map(
    familyIds.map((familyId) => [
      familyId,
      network.nodes
        .filter((node) => node.forte === familyId)
        .sort((left, right) => left.id - right.id),
    ]),
  );
  const topologyIdentityPointers = collectFamilyPointers(topologyIdentity);
  const admissionBySetClass = new Map(
    input.setClassAdmissions.map((record) => [record.setClassId, record.admissionStatus]),
  );

  const complementMaps = [];
  const primeKeyToSetClass = new Map();
  const pentatonicSetClasses = familyIds.map((heptatonicFamilyId, index) => {
    const forteNumber = heptatonicFamilyId.replace(/^7-/, "5-");
    const setClassId = `pentatonic:${forteNumber}`;
    const sourceNode = nodesByFamily.get(heptatonicFamilyId)?.[0];
    assert(sourceNode, "FAMILY_SOURCE_MISSING", heptatonicFamilyId);
    const representativeMask = FULL_MASK ^ sourceNode.id;
    const representativePitchClasses = pitchClassesFromMask(representativeMask);
    const key = primeForm(representativeMask).join(",");
    assert(!primeKeyToSetClass.has(key), "PRIME_FORM_DUPLICATE", key);
    primeKeyToSetClass.set(key, setClassId);
    const admissionStatus = admissionBySetClass.get(setClassId) ?? "proposed";
    const complementMapId = `complement:${forteNumber}:${heptatonicFamilyId}`;
    const t5Reference =
      admissionStatus === "admitted"
        ? { cycleIndex: 0, offset: 0, semantics: "canonical_court_segment_origin" }
        : admissionStatus === "admitted-bridge"
          ? { cycleIndex: 0, offset: 0, semantics: "root_alignment_only" }
          : null;
    const record = {
      setClassId,
      forteNumber,
      forteOrdinal: index + 1,
      representativePitchClasses,
      representativeMask,
      representativeMask12: mask12(representativeMask),
      weight: representativePitchClasses.length,
      sourceScaleStateId: sourceNode.id,
      complementMapId,
      t5Reference,
      admissionStatus,
      admissionBlocker:
        admissionStatus === "proposed" ? input.proposedAdmissionBlocker : null,
    };
    complementMaps.push({
      complementMapId,
      pentatonicSetClassId: setClassId,
      heptatonicFamilyId,
      familyRegistryPointer: {
        path: "canonical/universal-network-data.json#familyRegistry",
        familyId: heptatonicFamilyId,
      },
      topologyIdentityPointer: topologyIdentityPointers.has(heptatonicFamilyId)
        ? `canonical/topology-identity-definitions.json#${topologyIdentityPointers.get(heptatonicFamilyId)}`
        : null,
      representativePentatonicMask: representativeMask,
      representativeHeptatonicMask: sourceNode.id,
      rootedPairs: [],
    });
    return record;
  });
  assert(admissionBySetClass.size === 3, "ADMISSION_OVERRIDE_COUNT", admissionBySetClass.size);
  assert(
    [...admissionBySetClass].every(([setClassId]) =>
      pentatonicSetClasses.some((record) => record.setClassId === setClassId),
    ),
    "ADMISSION_OVERRIDE_DANGLING",
    "set class",
  );

  const t5Cycle = Array.from({ length: 12 }, (_, cycleIndex) => {
    const offset = (cycleIndex * 5) % 12;
    return {
      cycleIndex,
      offset,
      nextOffset: ((cycleIndex + 1) * 5) % 12,
      courtSegmentIndex: cycleIndex < 5 ? cycleIndex : null,
      courtPositionId: cycleIndex < 5 ? `C${cycleIndex}` : null,
    };
  });
  const courtRootedPositions = input.courtRootedPositions
    .map((source) => {
      const pitchMask = maskFromPitchClasses(source.pitchClasses);
      const rawComplementMask = FULL_MASK ^ pitchMask;
      const normalizedComplementScaleStateId = maskFromPitchClasses(
        primeForm(rawComplementMask),
      );
      const complementNode = nodeById.get(normalizedComplementScaleStateId);
      assert(complementNode?.forte === "7-35", "COURT_COMPLEMENT_INVALID", source.positionId);
      assert(
        primeKeyToSetClass.get(primeForm(pitchMask).join(",")) === "pentatonic:5-35",
        "COURT_SET_CLASS_INVALID",
        source.positionId,
      );
      return {
        positionId: source.positionId,
        setClassId: "pentatonic:5-35",
        rootPc: 0,
        pitchClasses: source.pitchClasses,
        pitchMask,
        pitchMask12: mask12(pitchMask),
        poleRegister: {
          vector: source.poleVector,
          poleOrder: POLE_ORDER,
          internalPoles: source.internalPoles,
        },
        kappaCourt: source.kappaCourt,
        xorSupportFromPrevious: source.xorSupportFromPrevious,
        t5CycleIndex: source.t5CycleIndex,
        t5Offset: t5Cycle[source.t5CycleIndex].offset,
        rawComplementMask,
        normalizedComplementScaleStateId,
        complementFamilyId: complementNode.forte,
        admissionStatus: "admitted",
      };
    })
    .sort((left, right) => compareCodePoint(left.positionId, right.positionId));

  const bridgeRootings = input.bridgeRootings
    .map((source) => {
      const pitchMask = maskFromPitchClasses(source.pitchClasses);
      const rawComplementMask = FULL_MASK ^ pitchMask;
      const normalizedComplementScaleStateId = maskFromPitchClasses(
        primeForm(rawComplementMask),
      );
      const expectedSetClassId = primeKeyToSetClass.get(primeForm(pitchMask).join(","));
      assert(expectedSetClassId === source.setClassId, "BRIDGE_SET_CLASS_INVALID", source.bridgeRootingId);
      assert((pitchMask & source.sourceScaleStateId) === pitchMask, "BRIDGE_SOURCE_SUBSET_INVALID", source.bridgeRootingId);
      assert((pitchMask & source.targetScaleStateId) === pitchMask, "BRIDGE_TARGET_SUBSET_INVALID", source.bridgeRootingId);
      const complementNode = nodeById.get(normalizedComplementScaleStateId);
      assert(
        complementNode,
        "BRIDGE_COMPLEMENT_STATE_MISSING",
        normalizedComplementScaleStateId,
      );
      return {
        bridgeRootingId: source.bridgeRootingId,
        setClassId: source.setClassId,
        rootPc: source.rootPc,
        pitchClasses: source.pitchClasses,
        pitchMask,
        pitchMask12: mask12(pitchMask),
        sourceScaleStateId: source.sourceScaleStateId,
        targetScaleStateId: source.targetScaleStateId,
        t5Reference: {
          cycleIndex: source.t5RootCycleIndex,
          offset: t5Cycle[source.t5RootCycleIndex].offset,
          semantics: "root_alignment_only",
        },
        rawComplementMask,
        normalizedComplementScaleStateId,
        complementFamilyId: complementNode.forte,
        admissionStatus: source.admissionStatus,
      };
    })
    .sort((left, right) => compareCodePoint(left.bridgeRootingId, right.bridgeRootingId));

  const rootedRecords = [
    ...courtRootedPositions.map((record) => ({
      rootedRecordId: `court-position:${record.positionId}`,
      setClassId: record.setClassId,
      pentatonicMask: record.pitchMask,
      rawHeptatonicComplementMask: record.rawComplementMask,
      normalizedHeptatonicScaleStateId: record.normalizedComplementScaleStateId,
    })),
    ...bridgeRootings.map((record) => ({
      rootedRecordId: record.bridgeRootingId,
      setClassId: record.setClassId,
      pentatonicMask: record.pitchMask,
      rawHeptatonicComplementMask: record.rawComplementMask,
      normalizedHeptatonicScaleStateId: record.normalizedComplementScaleStateId,
    })),
  ];
  for (const rooted of rootedRecords) {
    const complementMap = complementMaps.find(
      (record) => record.pentatonicSetClassId === rooted.setClassId,
    );
    assert(complementMap, "ROOTED_COMPLEMENT_MAP_MISSING", rooted.rootedRecordId);
    const complementNode = nodeById.get(rooted.normalizedHeptatonicScaleStateId);
    assert(
      complementNode?.forte === complementMap.heptatonicFamilyId,
      "ROOTED_COMPLEMENT_FAMILY_INVALID",
      rooted.rootedRecordId,
    );
    complementMap.rootedPairs.push({
      rootedRecordId: rooted.rootedRecordId,
      pentatonicMask: rooted.pentatonicMask,
      rawHeptatonicComplementMask: rooted.rawHeptatonicComplementMask,
      normalizedHeptatonicScaleStateId: rooted.normalizedHeptatonicScaleStateId,
    });
  }
  complementMaps.sort((left, right) =>
    compareCodePoint(left.pentatonicSetClassId, right.pentatonicSetClassId),
  );
  for (const record of complementMaps) {
    record.rootedPairs.sort((left, right) =>
      compareCodePoint(left.rootedRecordId, right.rootedRecordId),
    );
  }

  const sourcePaths = [...input.sourcePaths].sort(compareCodePoint);
  const sourceHashes = [
    ...sourcePaths.map((sourcePath) => ({
      path: sourcePath,
      sha256: sha256(fs.readFileSync(path.join(INTEGRATED_ROOT, sourcePath))),
    })),
    {
      path: "seven-governors-court-substrate-v0.1.0/source/substrate-input.json",
      sha256: sha256(fs.readFileSync(inputPath)),
    },
  ].sort((left, right) => compareCodePoint(left.path, right.path));
  const sourceFingerprint = sha256(canonicalCompact(sourceHashes));
  const admissionStatuses = [
    {
      admissionStatusId: "admitted",
      meaning: "Eligible canonical Court substrate within this package; integrated admission still waits for CRT-309.",
      integratedEffect: "none_until_crt_309",
    },
    {
      admissionStatusId: "admitted-bridge",
      meaning: "Eligible bridge substrate within the amended CRT-301 scope; not a canonical Court position.",
      integratedEffect: "none_until_crt_309",
    },
    {
      admissionStatusId: "proposed",
      meaning: "Registered for field closure but blocked from canonical or runtime use.",
      integratedEffect: "none_until_crt_309",
    },
  ];
  const releaseCore = {
    schemaVersion: "1.0.0",
    packageId: input.packageId,
    packageVersion: input.packageVersion,
    releaseId: input.releaseId,
    integratedAdmission: input.integratedAdmission,
    authorityContract: "schemas/court-admission-contract.json",
    sourceHashes,
    sourceFingerprint,
    admissionStatuses,
    pentatonicSetClasses,
    courtRootedPositions,
    bridgeRootings,
    t5Cycle,
    courtSegmentOffsets: COURT_SEGMENT_OFFSETS,
    complementMaps,
    minimalAdditionalBridgeSetClasses: [],
    summary: {
      pentatonicSetClassCount: pentatonicSetClasses.length,
      courtRootedPositionCount: courtRootedPositions.length,
      bridgeRootingCount: bridgeRootings.length,
      admittedSetClassCount: pentatonicSetClasses.filter(
        (record) => record.admissionStatus === "admitted",
      ).length,
      admittedBridgeSetClassCount: pentatonicSetClasses.filter(
        (record) => record.admissionStatus === "admitted-bridge",
      ).length,
      proposedSetClassCount: pentatonicSetClasses.filter(
        (record) => record.admissionStatus === "proposed",
      ).length,
      complementMapCount: complementMaps.length,
      t5CycleEntryCount: t5Cycle.length,
    },
  };
  return {
    ...releaseCore,
    substrateFingerprint: sha256(canonicalCompact(releaseCore)),
  };
}

export function buildArtifacts(options = {}) {
  const release = buildRelease(options);
  return new Map([
    ["substrate-registry-release.json", canonicalJson(release)],
    ["pentatonic-set-class-registry.json", canonicalJson(view(release, "pentatonicSetClasses"))],
    ["court-rooted-positions.json", canonicalJson(view(release, "courtRootedPositions"))],
    ["bridge-rootings.json", canonicalJson(view(release, "bridgeRootings"))],
    ["t5-cycle.json", canonicalJson({
      ...view(release, "t5Cycle"),
      courtSegmentOffsets: release.courtSegmentOffsets,
    })],
    ["complement-map.json", canonicalJson(view(release, "complementMaps"))],
    ["admission-status-ledger.json", canonicalJson(view(release, "admissionStatuses"))],
  ]);
}
