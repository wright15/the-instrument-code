#!/usr/bin/env node
/**
 * P0 verification gate for BL-031 Phase A (multi-phase topology program).
 *
 * The Phase A planning pass held four session-derived mathematics claims at
 * PROPOSAL grade. This script grounds them mechanically before any build
 * artifact may cite them:
 *
 *   M1  lift arithmetic: 462 x 12 = 5,544; 330 x 12 = 3,960; total 9,504;
 *       anchored records all contain pc 0; the pair-space covers 792 distinct
 *       concrete 7-sets at uniform multiplicity 7 and 792 concrete 5-sets at
 *       uniform multiplicity 5 (the OD-1 covering-space pin).
 *   M2  freeness: no heptatonic or pentatonic pc-set is invariant under any
 *       nontrivial transposition (orbit-divisibility proof + 792 x 11 sweep).
 *   P1  phase-coordinate rooting check: every anchored record carries exactly
 *       one root in its own pitch-class set, concrete sets are unique, and the
 *       root assignment is a function of the concrete set (no ambiguity).
 *
 * M3 (seam relation) and M4 (B/C/C# patch coverage) are verified inside the
 * P3 seam census of `scripts/build-phase-a-probe.mjs`; this gate records them
 * as deferred and the builder completes their status.
 *
 * Read-only against the landed sources. Defines no operators, admits nothing,
 * emits no graph edges, writes no canonical/Court/Neo4j artifact. Planning
 * evidence. Fail-loud on any mismatch.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..");

export const HEPTATONIC_NETWORK_PATH = "canonical/universal-network-data.json";
export const HEPTATONIC_LEDGER_PATH = "canonical/universal-heptatonic-ledger.csv";
export const BIPARTITE_PATH = "derived/hypergraph/bipartite-inclusion-v1.json";

export const SCHEMA_VERSION = "harmonic-orrery.phase-a-verification.v1";

export function fail(message) {
  throw new Error(`INVALID_PHASE_A_VERIFICATION: ${message}`);
}

export function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function fileSha(relativePath) {
  return sha256(fs.readFileSync(path.join(root, relativePath)));
}

export function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

export function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n") {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field.replace(/\r$/, ""));
    rows.push(row);
  }

  const [headers, ...records] = rows;
  return records.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index]])));
}

export function canonicalText(value) {
  if (value === null) return "null";
  if (value === true) return "true";
  if (value === false) return "false";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isInteger(value)) fail("non-integer number in verification payload");
    return String(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalText).join(",")}]`;
  }
  if (typeof value === "object") {
    const keys = Object.keys(value).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${canonicalText(value[key])}`).join(",")}}`;
  }
  fail(`unsupported JSON type: ${typeof value}`);
}

export function parsePitchSet(text) {
  const trimmed = text.replace(/[{}]/g, "");
  if (trimmed.length === 0) return [];
  return trimmed.split(",").map((value) => Number(value));
}

export function sortedKey(pitches) {
  return [...pitches].sort((left, right) => left - right).join(",");
}

export function translateSet(pitches, offset) {
  return pitches.map((pitch) => (pitch + offset) % 12);
}

export function combinationsCount(n, k) {
  let result = 1;
  for (let index = 0; index < k; index += 1) {
    result = (result * (n - index)) / (index + 1);
  }
  return Math.round(result);
}

export function loadAnchoredUniverse() {
  const ledger = parseCsv(read(HEPTATONIC_LEDGER_PATH));
  if (ledger.length !== 462) fail(`heptatonic ledger census is ${ledger.length}`);
  const heptatonic = ledger.map((record) => {
    const pitchClasses = parsePitchSet(record.pitchSet);
    return {
      id: Number(record.id),
      pitchClasses,
      root: null,
      forte: record.forte,
      role: record.role,
      tier: record.tier,
    };
  });
  if (heptatonic.some((record) => !record.pitchClasses.includes(0))) {
    fail("heptatonic ledger contains a record without pc 0");
  }

  const bipartite = readJson(BIPARTITE_PATH);
  const heptatonicNodeCount = Object.keys(bipartite.heptatonicNodes).length;
  const pentatonicNodeCount = Object.keys(bipartite.pentatonicSubnodes).length;
  if (heptatonicNodeCount !== 462) fail(`bipartite heptatonic census is ${heptatonicNodeCount}`);
  if (pentatonicNodeCount !== 330) fail(`bipartite pentatonic census is ${pentatonicNodeCount}`);

  const ledgerBySet = new Map(heptatonic.map((record) => [sortedKey(record.pitchClasses), record]));
  for (const [nodeId, node] of Object.entries(bipartite.heptatonicNodes)) {
    const record = ledgerBySet.get(sortedKey(node.pitchClasses));
    if (!record) fail(`bipartite heptatonic node ${nodeId} has no ledger record`);
    record.root = node.root;
    record.bipartiteId = nodeId;
  }

  const pentatonic = Object.entries(bipartite.pentatonicSubnodes).map(([nodeId, node]) => ({
    id: nodeId,
    pitchClasses: node.pitchClasses,
    root: node.root,
    setClassId: node.setClassId,
    isBridge: node.isBridge,
    isCornerstone: node.isCornerstone,
    parentsRooted: node.parentsRooted,
    subnodes: null,
  }));

  return { heptatonic, pentatonic, bipartite };
}

export function buildPhaseAVerification() {
  const { heptatonic, pentatonic } = loadAnchoredUniverse();

  for (const record of pentatonic) {
    if (!record.pitchClasses.includes(0)) fail(`pentatonic node ${record.id} does not contain pc 0`);
  }

  // ---- M1: lift arithmetic and covering multiplicity --------------------
  const heptatonicPairs = heptatonic.length * 12;
  const pentatonicPairs = pentatonic.length * 12;
  const totalPairs = heptatonicPairs + pentatonicPairs;
  const expectedHeptatonicPairs = 5544;
  const expectedPentatonicPairs = 3960;
  const expectedTotal = 9504;
  if (heptatonicPairs !== expectedHeptatonicPairs) {
    fail(`heptatonic pair count is ${heptatonicPairs}, proposal says ${expectedHeptatonicPairs}`);
  }
  if (pentatonicPairs !== expectedPentatonicPairs) {
    fail(`pentatonic pair count is ${pentatonicPairs}, proposal says ${expectedPentatonicPairs}`);
  }
  if (totalPairs !== expectedTotal) fail(`total lifted count is ${totalPairs}, proposal says ${expectedTotal}`);

  const concreteSevenSets = new Set();
  const sevenMultiplicity = new Map();
  for (const record of heptatonic) {
    for (let phase = 0; phase < 12; phase += 1) {
      const key = sortedKey(translateSet(record.pitchClasses, phase));
      concreteSevenSets.add(key);
      sevenMultiplicity.set(key, (sevenMultiplicity.get(key) ?? 0) + 1);
    }
  }
  const concreteFiveSets = new Set();
  const fiveMultiplicity = new Map();
  for (const record of pentatonic) {
    for (let phase = 0; phase < 12; phase += 1) {
      const key = sortedKey(translateSet(record.pitchClasses, phase));
      concreteFiveSets.add(key);
      fiveMultiplicity.set(key, (fiveMultiplicity.get(key) ?? 0) + 1);
    }
  }
  const binomialSeven = combinationsCount(12, 7);
  const binomialFive = combinationsCount(12, 5);
  const sevenCounts = [...new Set(sevenMultiplicity.values())];
  const fiveCounts = [...new Set(fiveMultiplicity.values())];
  if (concreteSevenSets.size !== binomialSeven || sevenCounts.length !== 1 || sevenCounts[0] !== 7) {
    fail(`heptatonic covering is ${concreteSevenSets.size} sets, multiplicities ${sevenCounts.join("/")}`);
  }
  if (concreteFiveSets.size !== binomialFive || fiveCounts.length !== 1 || fiveCounts[0] !== 5) {
    fail(`pentatonic covering is ${concreteFiveSets.size} sets, multiplicities ${fiveCounts.join("/")}`);
  }
  if (binomialSeven !== 792 || binomialFive !== 792) {
    fail(`binomial cross-check is C(12,7)=${binomialSeven}, C(12,5)=${binomialFive}`);
  }

  const m1 = {
    id: "M1-lift-arithmetic",
    statement: "462 x 12 = 5,544 heptatonic pairs; 330 x 12 = 3,960 pentatonic pairs; 9,504 total; every anchored record contains pc 0; pair-space covers 792 distinct concrete 7-sets at multiplicity 7 and 792 concrete 5-sets at multiplicity 5",
    status: "PASS",
    anchoredHeptatonic: heptatonic.length,
    anchoredPentatonic: pentatonic.length,
    heptatonicPairs,
    pentatonicPairs,
    totalPairs,
    distinctConcreteSevenSets: concreteSevenSets.size,
    distinctConcreteFiveSets: concreteFiveSets.size,
    uniformMultiplicitySeven: sevenCounts[0],
    uniformMultiplicityFive: fiveCounts[0],
    binomialCrossCheck: { c12k7: binomialSeven, c12k5: binomialFive },
    redundancyReading: "the lift is 7-fold redundant in concrete pc-set terms and exactly non-redundant in (anchored-form, phase) terms; the redundancy is the phase information",
  };

  // ---- M2: freeness of the transposition action --------------------------
  const anchoredSets = [
    ...heptatonic.map((record) => record.pitchClasses),
    ...pentatonic.map((record) => record.pitchClasses),
  ];
  let anchoredChecks = 0;
  const freenessCounterexamples = [];
  for (const pitches of anchoredSets) {
    const key = sortedKey(pitches);
    for (let shift = 1; shift < 12; shift += 1) {
      anchoredChecks += 1;
      if (sortedKey(translateSet(pitches, shift)) === key) {
        freenessCounterexamples.push({ set: key, shift });
      }
    }
  }
  if (freenessCounterexamples.length > 0) {
    fail(`freeness fails on anchored records: ${JSON.stringify(freenessCounterexamples.slice(0, 3))}`);
  }

  const distinctSeven = [...concreteSevenSets].map((key) => key.split(",").map(Number));
  const distinctFive = [...concreteFiveSets].map((key) => key.split(",").map(Number));
  let distinctChecks = 0;
  for (const pitches of [...distinctSeven, ...distinctFive]) {
    const key = sortedKey(pitches);
    for (let shift = 1; shift < 12; shift += 1) {
      distinctChecks += 1;
      if (sortedKey(translateSet(pitches, shift)) === key) {
        freenessCounterexamples.push({ set: key, shift });
      }
    }
  }
  if (freenessCounterexamples.length > 0) {
    fail(`freeness fails on distinct sets: ${JSON.stringify(freenessCounterexamples.slice(0, 3))}`);
  }

  const m2 = {
    id: "M2-freeness",
    statement: "no heptatonic (weight-7) or pentatonic (weight-5) pc-set has a nontrivial transpositional stabilizer; the phase action is free",
    status: "PASS",
    proofSketch: "T_n acts freely on Z12, so every orbit has size d in {2,3,4,6,12}; an invariant set is a union of orbits, so its cardinality is divisible by d; neither 7 nor 5 is divisible by any such d",
    anchoredRecordsSwept: anchoredSets.length,
    anchoredChecks,
    distinctSetsSwept: distinctSeven.length + distinctFive.length,
    distinctChecks,
    counterexamples: freenessCounterexamples.length,
    stabilizerRedHerring: "mutation-algebra-audit/audit/stabilizer-results.csv records operator-property stabilization, not transpositional stabilizers; it is not evidence for this claim",
  };

  // ---- P1: phase-coordinate rooting check --------------------------------
  let rootInSetFailures = 0;
  for (const record of [...heptatonic, ...pentatonic]) {
    if (record.root === null || record.root === undefined || !record.pitchClasses.includes(record.root)) {
      rootInSetFailures += 1;
    }
  }
  if (rootInSetFailures !== 0) fail(`${rootInSetFailures} anchored records have a root outside their own pc-set`);

  const heptatonicBySet = new Map();
  for (const record of heptatonic) {
    const key = sortedKey(record.pitchClasses);
    if (heptatonicBySet.has(key)) fail(`duplicate heptatonic concrete set ${key}`);
    heptatonicBySet.set(key, record);
  }
  const pentatonicBySet = new Map();
  for (const record of pentatonic) {
    const key = sortedKey(record.pitchClasses);
    if (pentatonicBySet.has(key)) fail(`duplicate pentatonic concrete set ${key}`);
    pentatonicBySet.set(key, record);
  }
  if (heptatonicBySet.size !== heptatonic.length) fail("heptatonic concrete sets are not unique");
  if (pentatonicBySet.size !== pentatonic.length) fail("pentatonic concrete sets are not unique");

  const p1 = {
    id: "P1-rooting-check",
    statement: "phase coordinate is well-defined: every anchored record carries exactly one root in its own pc-set, concrete anchored sets are unique per cardinality, and the root assignment is a function of the concrete set",
    status: "PASS",
    rootedRecords: heptatonic.length + pentatonic.length,
    rootInSetFailures,
    heptatonicSetsUnique: true,
    pentatonicSetsUnique: true,
    rootingAmbiguity: false,
    rootingConvention: "root is the canonical scale root of the concrete set (bipartite-inclusion-v1 metadata); the anchored cut is pc 0; phase p is the translation offset applied to the anchored record",
  };

  const claims = [
    m1,
    m2,
    p1,
    {
      id: "M3-seam-relation",
      statement: "canonical seam adjacency is Lydian(p) <-> Locrian(p+1), tonic-for-tonic handoff, 6/7 common tones; mirror Lydian(p) <-> Locrian(p-1) predicted as secondary adjacency",
      status: "deferred_to_p3",
      verifiedBy: "p3SeamCensus",
    },
    {
      id: "M4-minimal-patch",
      statement: "the seam set at C is fully covered by the three-phase patch {B, C, C#}; no fourth phase-context is needed",
      status: "deferred_to_p3",
      verifiedBy: "p3SeamCensus",
    },
  ];

  const sourceBindings = [
    { artifact: HEPTATONIC_NETWORK_PATH, sha256: fileSha(HEPTATONIC_NETWORK_PATH), role: "anchored heptatonic universe (462) and audit-source identity" },
    { artifact: HEPTATONIC_LEDGER_PATH, sha256: fileSha(HEPTATONIC_LEDGER_PATH), role: "462-record pitch sets, roles, tiers" },
    { artifact: BIPARTITE_PATH, sha256: fileSha(BIPARTITE_PATH), role: "anchored pentatonic universe (330), roots, containment" },
  ];

  return {
    schemaVersion: SCHEMA_VERSION,
    verificationId: "BL031_PHASE_A_P0_VERIFICATION",
    status: "planning_evidence",
    generator: "scripts/verify-phase-a-proposals.mjs",
    sourceBindings,
    claims,
    overall: claims.every((claim) => claim.status === "PASS" || claim.status === "deferred_to_p3") ? "PASS" : "FAIL",
  };
}

function main() {
  const receipt = buildPhaseAVerification();
  console.log(JSON.stringify(receipt, null, 2));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}
