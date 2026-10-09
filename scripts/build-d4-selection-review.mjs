#!/usr/bin/env node
/**
 * Build the BL-055 D4 contract selection-mechanism review.
 *
 * Read-only characterization of why the frozen D4 derivation contract's routes
 * cannot select the 14 observed contact keys from the 28-key granted domain,
 * and whether a representation-stable selection predicate exists.
 *
 * Sections:
 *   step0        - execution-scope verification (E2 patch-only; Hypothesis B
 *                  pre-falsified by execution scope)
 *   domain       - frozen U (28) / O (14) keyings and the four-cell counts
 *   table28      - one row per granted key with every tested axis populated
 *   axes         - the axis hunt: confusion matrices, clean splits, near-misses
 *   tbProof      - the T-B construction-join restatement proof (definitional)
 *   taGeometry   - the T-A kernel-twin under-coverage geometry (T1 links) and
 *                  the closed A0 transposition cycle (T1 + T2 edges)
 *   od3Diagnostic- per-phase attribution of the seam keying (diagnostic only)
 *   synthesis    - representation-stability verdict, three blockers, BL-056
 *                  design-item text, the ROE observation line
 *
 * Fences: sandbox/analysis only. No canonical/Court/schema/Neo4j writes. D4's
 * registered not_derived is untouched. No governs admission, no G1 movement,
 * no direction assignment. Planning evidence, byte-stable, independently
 * validated. Frame 2.6/2.7 is interpretation vocabulary, never design input.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  HEPTATONIC_LEDGER_PATH,
  HEPTATONIC_NETWORK_PATH,
  BIPARTITE_PATH,
  canonicalText,
  fail,
  fileSha,
  parseCsv,
  read,
  readJson,
  sha256,
  sortedKey,
  translateSet,
} from "./verify-phase-a-proposals.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..");

export const SCHEMA_VERSION = "harmonic-orrery.d4-selection-review.v1";
export const REVIEW_ID = "BL055_D4_SELECTION_REVIEW_v1";
export const OUTPUT_PATH = "orrery/src/generated/d4-selection-review.v1.json";
export const FROZEN_RECEIPT_PATH = "qa/d4-production-receipt.json";
export const FROZEN_GENERATION_PATH = "qa/d4-production-generation.json";
export const APPLICATIONS_PATH = "seven-governors-mutation-algebra-audit/audit/operator-applications.csv";
export const PHASE_C_PROBE_PATH = "orrery/src/generated/phase-c-probe.v1.json";
export const PHASE_A_PROBE_PATH = "orrery/src/generated/phase-a-probe.v1.json";
export const PHASE_C_FINGERPRINT = "5085e27404de2e591b146d38f289da660c6bc49041a54f073acafcbfe10f2f49";
export const PHASE_A_FINGERPRINT = "c8271c20a7aaf23c8f25fbe12d849854eb02ffbfd6fa24fb3f091b15970b87ac";
export const PATCH_PHASES = [11, 0, 1];

// ---------------------------------------------------------------------------
// Helpers (set-level; ledger ids are pitch masks for anchored records)
// ---------------------------------------------------------------------------

function cmp(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

function sortedUnique(values) {
  return [...new Set(values)].sort(cmp);
}

function keyOf(office, satellite) {
  return `${office}:${satellite}`;
}

function rotateMaskZ12(mask) {
  return ((mask << 1) & 4095) | (mask >> 11);
}

function pitchesOf(row) {
  return row.pitchSet.replace(/[{}]/g, "").split(",").map(Number).sort((left, right) => left - right);
}

function setKeyOfPitches(pitches, phase) {
  return sortedKey(translateSet(pitches, phase));
}

function histogram(keys, observedSet, valueOf) {
  const result = { observed: {}, unobserved: {} };
  for (const key of keys) {
    const value = String(valueOf(key));
    const group = observedSet.has(key) ? "observed" : "unobserved";
    result[group][value] = (result[group][value] ?? 0) + 1;
  }
  return result;
}

function confusion(keys, observedSet, predicate) {
  let tp = 0, fp = 0, fn = 0, tn = 0;
  for (const key of keys) {
    const predicted = predicate(key);
    const actual = observedSet.has(key);
    if (actual && predicted) tp += 1;
    else if (actual && !predicted) fn += 1;
    else if (!actual && predicted) fp += 1;
    else tn += 1;
  }
  return { tp, fp, fn, tn };
}

function numericAxis(keys, observedSet, valueOf) {
  const thresholds = sortedUnique(keys.map(valueOf));
  let best = null;
  for (const threshold of thresholds) {
    const matrix = confusion(keys, observedSet, (key) => valueOf(key) >= threshold);
    const hit = matrix.tp + matrix.tn;
    if (!best || hit > best.hit) best = { threshold: String(threshold), confusion: matrix, hit };
  }
  return best;
}

function axisEntry({ axis, kind, definition, rule, keys, observedSet, valueOf, predicate, verdict, subFinding = null, evidence }) {
  const values = histogram(keys, observedSet, valueOf);
  const matrix = confusion(keys, observedSet, predicate);
  const hit = matrix.tp + matrix.tn;
  const split = matrix.tp === 14 && matrix.tn === 14 && matrix.fp === 0 && matrix.fn === 0;
  const nearMiss = !split && hit >= 26;
  return {
    axis, kind, definition, rule,
    values,
    confusion: matrix,
    hit,
    split,
    nearMiss,
    verdict,
    subFinding,
    evidence,
  };
}

// ---------------------------------------------------------------------------
// Main build
// ---------------------------------------------------------------------------

export function buildReview() {
  const receipt = readJson(FROZEN_RECEIPT_PATH);
  const frozenGeneration = readJson(FROZEN_GENERATION_PATH);
  const ledgerRows = parseCsv(read(HEPTATONIC_LEDGER_PATH));
  const bipartite = readJson(BIPARTITE_PATH);
  const applications = parseCsv(read(APPLICATIONS_PATH));
  const phaseC = readJson(PHASE_C_PROBE_PATH);
  const phaseA = readJson(PHASE_A_PROBE_PATH);

  if (ledgerRows.length !== 462) fail(`heptatonic ledger census is ${ledgerRows.length}`);
  if (applications.length !== 3402) fail(`application universe is ${applications.length}`);
  if (phaseC.probeFingerprint !== PHASE_C_FINGERPRINT) fail("Phase C probe fingerprint mismatch");
  if (phaseA.probeFingerprint !== PHASE_A_FINGERPRINT) fail("Phase A probe fingerprint mismatch");
  if (phaseA.p1PhaseCoordinate.covering.multiplicitySeven !== 7 || phaseA.p1PhaseCoordinate.counts.phases !== 12) {
    fail("Phase A lift covering drift");
  }
  if (receipt.category !== "not_derived") fail(`frozen receipt category is ${receipt.category}`);

  // ---- frozen domain ------------------------------------------------------
  const comparison = receipt.comparison;
  const uKeys = sortedUnique(comparison.uKeys);
  const observedRows = comparison.rows;
  const observedKeys = sortedUnique(observedRows.map((row) => keyOf(String(row.parentOffice), String(row.s))));
  const cells = comparison.fourCellCounts;
  if (uKeys.length !== 28 || observedKeys.length !== 14) fail("frozen domain census mismatch");
  if (cells.aOnly !== "0" || cells.bOnly !== "10" || cells.both !== "4" || cells.neither !== "0") {
    fail("frozen four-cell counts mismatch");
  }
  if (canonicalText(sortedUnique(phaseC.e2Retry.domain.uKeys)) !== canonicalText(uKeys) ||
      canonicalText(sortedUnique(phaseC.e2Retry.domain.observedKeys)) !== canonicalText(observedKeys)) {
    fail("Phase C domain keying disagrees with the frozen receipt");
  }
  const observedSet = new Set(observedKeys);
  const routeAPredicted = new Set(comparison.routes.A.generatedKeys);
  const routeBPredicted = new Set(comparison.routes.B.generatedKeys);
  const membershipByKey = new Map(observedRows.map((row) => [keyOf(String(row.parentOffice), String(row.s)), row.membership]));
  const dByKey = new Map(observedRows.map((row) => [keyOf(String(row.parentOffice), String(row.s)), String(row.d)]));

  const officeOfKey = (key) => key.split(":")[0];
  const satelliteOfKey = (key) => key.split(":")[1];

  // ---- ledger lookups -----------------------------------------------------
  const ledgerById = new Map(ledgerRows.map((row) => [row.id, row]));
  const ledgerOfKey = (key) => {
    const row = ledgerById.get(satelliteOfKey(key));
    if (!row) fail(`satellite ${satelliteOfKey(key)} missing from ledger`);
    return row;
  };

  // ---- projection R/E -----------------------------------------------------
  const projection = frozenGeneration.projection;
  const R = projection.R;
  const E = projection.E;
  if (R.length !== 28 || E.length !== 14) fail("projection census drift");
  const rByKey = new Map(R.map((row) => [keyOf(String(row.parentOffice), String(row.target)), row]));
  if (rByKey.size !== 28) fail("R key collisions");
  const eParentsOf = new Map();
  for (const edge of E) {
    const list = eParentsOf.get(edge.target) ?? [];
    list.push(edge.source);
    eParentsOf.set(edge.target, list);
  }
  const A1_H = sortedUnique([...eParentsOf.keys()]);
  if (A1_H.length !== 7) fail(`A1 parent census ${A1_H.length}`);
  const tbPerAnchor = A1_H.map((h) => {
    const parents = sortedUnique(eParentsOf.get(h));
    const satellites = R.filter((row) => row.source === h).map((row) => String(row.target)).sort(cmp);
    if (parents.length !== 2 || new Set(parents).size !== 2) fail(`A1 anchor ${h} does not have exactly 2 distinct E-parents`);
    if (satellites.length !== 4) fail(`A1 anchor ${h} does not have 4 R-satellites`);
    return {
      h,
      parents,
      satellites,
      witnesses: parents.length * (parents.length - 1) * satellites.length,
      keys: satellites.map((satellite) => keyOf(String(R.find((row) => row.source === h && String(row.target) === satellite).parentOffice), satellite)),
    };
  });
  const tbGenerated = sortedUnique(tbPerAnchor.flatMap((entry) => entry.keys));
  if (canonicalText(tbGenerated) !== canonicalText(uKeys)) fail("T-B proof does not reproduce U");
  const tbWitnessTotal = tbPerAnchor.reduce((sum, entry) => sum + entry.witnesses, 0);
  if (tbWitnessTotal !== 56) fail(`T-B witness arithmetic ${tbWitnessTotal}`);
  const frozenTBWitnesses = frozenGeneration.generation.routes["T-B"].witnesses.length;
  if (frozenTBWitnesses !== 56) fail(`frozen T-B witness census ${frozenTBWitnesses}`);

  // ---- T-A geometry -------------------------------------------------------
  const a0 = projection.anchors.filter((anchor) => anchor.tier === "A0")
    .map((anchor) => ({ id: String(anchor.id), office: String(anchor.officeIndex) }));
  if (a0.length !== 7) fail(`A0 anchor census ${a0.length}`);
  const a0ById = new Map(a0.map((anchor) => [anchor.id, anchor]));
  const rotTable = a0.map((anchor) => {
    const image = rotateMaskZ12(Number(anchor.id));
    const target = a0ById.get(String(image));
    if (!target) return { a: anchor.id, aOffice: anchor.office, rotateImage: String(image), inA0: false, b: null, bOffice: null, officeDelta: null, k: null };
    const officeDelta = ((Number(anchor.office) - Number(target.office)) + 7) % 7;
    return { a: anchor.id, aOffice: anchor.office, rotateImage: String(image), inA0: true, b: target.id,
      bOffice: target.office, officeDelta: String(officeDelta), k: String((Number(anchor.office) + 6) % 7) };
  }).sort((left, right) => cmp(left.a, right.a));
  const frozenPairs = rotTable.filter((row) => row.inA0 && row.officeDelta === "2")
    .map((row) => ({ a: row.a, b: row.b, k: row.k }))
    .sort((left, right) => cmp(left.a, right.a));
  if (frozenPairs.length !== 2) fail(`frozen T-A pair census ${frozenPairs.length}`);
  const frozenTAWitnessPairs = sortedUnique(frozenGeneration.generation.routes["T-A"].witnesses.map((w) => `${w.a}:${w.b}:${w.k}`));
  if (canonicalText(frozenTAWitnessPairs) !== canonicalText(sortedUnique(frozenPairs.map((pair) => `${pair.a}:${pair.b}:${pair.k}`)))) {
    fail("T-A re-derivation disagrees with the frozen witnesses");
  }
  const taGenerated = sortedUnique(frozenPairs.flatMap((pair) => R.filter((row) => String(row.parentOffice) === pair.k)
    .map((row) => keyOf(String(row.parentOffice), String(row.target)))));
  if (taGenerated.length !== 8) fail(`T-A re-derivation key census ${taGenerated.length}`);
  if (canonicalText(taGenerated) !== canonicalText(sortedUnique(comparison.routes.A.generatedKeys))) {
    fail("T-A re-derivation disagrees with the frozen receipt");
  }

  // ---- seam pairs, intervals, cycle ---------------------------------------
  const seamPairs = phaseC.e2Retry.routeASeam.seamPairs;
  if (seamPairs.length !== 9) fail(`seam pair census ${seamPairs.length}`);
  const seamEdges = [];
  for (const pair of seamPairs) {
    const aPitches = pitchesOf(ledgerById.get(pair.a));
    const cPitches = pitchesOf(ledgerById.get(pair.c));
    if (setKeyOfPitches(aPitches, Number(pair.aPhase)) !== pair.geometry) fail(`seam geometry mismatch at office ${pair.office}`);
    if (setKeyOfPitches(cPitches, Number(pair.cPhase)) !== pair.geometry) fail(`seam geometry mismatch at office ${pair.office}`);
    const interval = ((Number(pair.aPhase) - Number(pair.cPhase)) + 12) % 12;
    seamEdges.push({ office: String(pair.office), a: String(pair.a), c: String(pair.c),
      aPhase: String(pair.aPhase), cPhase: String(pair.cPhase), interval });
  }
  const cycleEdgesByOffice = new Map();
  for (const edge of seamEdges) {
    const existing = cycleEdgesByOffice.get(edge.office);
    if (existing && (existing.a !== edge.a || existing.c !== edge.c || existing.interval !== edge.interval)) {
      fail(`non-uniform edge at office ${edge.office}`);
    }
    cycleEdgesByOffice.set(edge.office, edge);
  }
  if (cycleEdgesByOffice.size !== 7) fail(`cycle edge census ${cycleEdgesByOffice.size}`);
  const cycleEdges = [...cycleEdgesByOffice.values()].sort((left, right) => cmp(left.office, right.office));
  const fromMap = new Map(cycleEdges.map((edge) => [edge.a, edge]));
  const walk = [];
  let current = cycleEdges[0].a;
  for (let step = 0; step < 7; step += 1) {
    const edge = fromMap.get(current);
    if (!edge) fail(`cycle walk dead-ends at ${current}`);
    walk.push(edge);
    current = edge.c;
  }
  const cycleCloses = current === cycleEdges[0].a;
  const cycleIntervalSum = walk.reduce((sum, edge) => sum + edge.interval, 0);
  if (!cycleCloses || cycleIntervalSum !== 12) fail("cycle closure/interval-sum failure");
  const t1Offices = cycleEdges.filter((edge) => edge.interval === 1).map((edge) => edge.office).sort(cmp);
  const t2Offices = cycleEdges.filter((edge) => edge.interval === 2).map((edge) => edge.office).sort(cmp);
  if (canonicalText(t1Offices) !== canonicalText(["0", "6"]) || t2Offices.length !== 5) fail("T1/T2 edge split drift");
  const strictOfficeKeys = sortedUnique(phaseC.e2Retry.routeASeam.strictDegreeControl.qualifyingOffices);
  if (canonicalText(strictOfficeKeys) !== canonicalText(t1Offices)) fail("strict-degree control does not equal the T1 office set");

  // ---- OD-3 diagnostic (per-phase attribution; union stays canonical) -----
  const perPhase = PATCH_PHASES.map((phase) => {
    const p = String(phase);
    const touching = sortedUnique(seamEdges.filter((edge) => edge.aPhase === p || edge.cPhase === p).map((edge) => edge.office));
    const aSide = sortedUnique(seamEdges.filter((edge) => edge.aPhase === p).map((edge) => edge.office));
    const cSide = sortedUnique(seamEdges.filter((edge) => edge.cPhase === p).map((edge) => edge.office));
    return { phase: p, touchingOffices: touching, aSideOffices: aSide, cSideOffices: cSide, touchingKeys: touching.length * 4 };
  });

  // ---- per-key attribute axes ---------------------------------------------
  const heptNodeByMask = new Map(Object.values(bipartite.heptatonicNodes).map((node) => [String(node.pitchMask), node]));
  const pentatonicById = bipartite.pentatonicSubnodes;
  const satelliteNode = (key) => {
    const node = heptNodeByMask.get(satelliteOfKey(key));
    if (!node) fail(`bipartite heptatonic node missing for ${satelliteOfKey(key)}`);
    return node;
  };
  const subnodeCount = (key, field) => {
    const node = satelliteNode(key);
    return node.subnodes.filter((id) => pentatonicById[id]?.[field] === true).length;
  };
  const seamTouchBySatellite = new Map();
  for (const application of applications) {
    if (application.operator_id !== "R1" && application.operator_id !== "L1") continue;
    for (const endpoint of [application.source_id, application.target_id]) {
      seamTouchBySatellite.set(endpoint, (seamTouchBySatellite.get(endpoint) ?? 0) + 1);
    }
  }

  const table28 = uKeys.map((key) => {
    const satellite = satelliteOfKey(key);
    const row = ledgerOfKey(key);
    const r = rByKey.get(key);
    const observed = observedSet.has(key);
    return {
      key,
      office: officeOfKey(key),
      satellite,
      parentH: String(r.source),
      observed,
      routeA: routeAPredicted.has(key),
      routeB: routeBPredicted.has(key),
      cell: observed ? membershipByKey.get(key) : "not-a-contact",
      d: observed ? dByKey.get(key) : null,
      forte: row.forte,
      intervalVector: row.intervalVector,
      satelliteOffice: row.officeIndex,
      admittedSubnodes: satelliteNode(key).subnodes.length,
      bridgeSubnodes: subnodeCount(key, "isBridge"),
      cornerstoneSubnodes: subnodeCount(key, "isCornerstone"),
      seamIncidence: seamTouchBySatellite.get(satellite) ?? 0,
      eParents: sortedUnique(eParentsOf.get(String(r.source))),
    };
  });

  // ---- axis hunt ----------------------------------------------------------
  const satelliteForte = (key) => ledgerOfKey(key).forte;
  const axes = [
    axisEntry({
      axis: "setClassFamily",
      kind: "categorical",
      definition: "Forte set class of the contacted A1 satellite (intrinsic interval content; Tn-invariant).",
      rule: "forte(satellite) = '7-27'",
      keys: uKeys, observedSet,
      valueOf: satelliteForte,
      predicate: (key) => satelliteForte(key) === "7-27",
      verdict: "CLEAN_SPLIT_14_14",
      evidence: "all 14 observed keys are 7-27; all 14 unobserved keys are 7-31; globally the 462-record ledger contains exactly fourteen 7-27 (all observed) and fourteen 7-31 (all unobserved), each uniform in interval vector",
    }),
    axisEntry({
      axis: "containmentDegree",
      kind: "constant",
      definition: "Anchored pentatonic subnodes of the satellite's heptatonic node (bipartite containment mesh).",
      rule: "admittedSubnodes >= threshold",
      keys: uKeys, observedSet,
      valueOf: (key) => satelliteNode(key).subnodes.length,
      predicate: () => true,
      verdict: "CONSTANT_UNIFORM_MESH",
      evidence: "every heptatonic node has exactly 15 anchored subnodes (462 x 15 = 330 x 21 = 6,930 containment pairs); no per-key variance; the axis is structurally constant",
    }),
    axisEntry({
      axis: "bridgeSubnodes",
      kind: "numeric",
      definition: "Anchored pentatonic subnodes of the satellite flagged isBridge (multi-family junction).",
      rule: "bridgeSubnodes >= threshold",
      keys: uKeys, observedSet,
      valueOf: (key) => subnodeCount(key, "isBridge"),
      predicate: (key) => subnodeCount(key, "isBridge") >= 4,
      verdict: "FAIL",
      subFinding: "one-sided: threshold >= 4 selects 10/14 observed with 0/14 unobserved (precision 10/10, recall 10/14); all keys have >= 1 bridge subnode",
      evidence: `best numeric split at threshold 4: ${JSON.stringify(numericAxis(uKeys, observedSet, (key) => subnodeCount(key, "isBridge")))}`,
    }),
    axisEntry({
      axis: "cornerstoneContainment",
      kind: "numeric",
      definition: "Anchored pentatonic subnodes of the satellite flagged isCornerstone (the five 5-35 windows).",
      rule: "cornerstoneSubnodes >= 1",
      keys: uKeys, observedSet,
      valueOf: (key) => subnodeCount(key, "isCornerstone"),
      predicate: (key) => subnodeCount(key, "isCornerstone") >= 1,
      verdict: "FAIL_NEAR_MISS",
      subFinding: "one-sided near-miss: >= 1 selects 12/14 observed with 0/14 unobserved; the two missed observed keys (2395, 2899) are exactly the two zero-seam-incidence observed keys; per OD-1 recorded as fail; a softened predicate may only appear as an explicitly-labeled follow-on hypothesis with its own verification burden",
      evidence: `best numeric split at threshold 1: ${JSON.stringify(numericAxis(uKeys, observedSet, (key) => subnodeCount(key, "isCornerstone")))}`,
    }),
    axisEntry({
      axis: "kernelWindowMembership",
      kind: "constant",
      definition: "Kernel-window (C0-C4) membership of the satellite (seven-governors registry masks).",
      rule: "kernelWindow != null",
      keys: uKeys, observedSet,
      valueOf: () => "null",
      predicate: () => false,
      verdict: "NON_APPLICABLE_CONSTANT",
      evidence: "no landed record assigns a kernel window to any heptatonic A1 satellite; kernelWindows is recorded null except at the five 5-35 cornerstone pentatonics (BL-035 census); the axis does not exist at this layer",
    }),
    axisEntry({
      axis: "officeElementPairing",
      kind: "constant",
      definition: "Satellite officeIndex versus the key's parent office.",
      rule: "satelliteOffice = key office",
      keys: uKeys, observedSet,
      valueOf: (key) => String(ledgerOfKey(key).officeIndex === officeOfKey(key)),
      predicate: () => true,
      verdict: "CONSTANT",
      evidence: "satellite office equals parent office for all 28 granted keys; no discriminating power",
    }),
    axisEntry({
      axis: "phaseContextMultiplicity",
      kind: "constant",
      definition: "Phase-context multiplicity of the anchored heptatonic record in the lift.",
      rule: "phase-context available (12 phases, 7-fold concrete multiplicity)",
      keys: uKeys, observedSet,
      valueOf: () => "12",
      predicate: () => true,
      verdict: "UNIFORM",
      evidence: "the lift is uniform by construction: every anchored record lifts at all 12 phases and every concrete heptatonic pc-set has multiplicity 7 (phase-a probe covering); no per-key variance",
    }),
    axisEntry({
      axis: "seamIncidence",
      kind: "numeric",
      definition: "R1/L1 seam applications touching the satellite (from the admitted operator-application audit).",
      rule: "seamIncidence >= threshold",
      keys: uKeys, observedSet,
      valueOf: (key) => seamTouchBySatellite.get(satelliteOfKey(key)) ?? 0,
      predicate: (key) => (seamTouchBySatellite.get(satelliteOfKey(key)) ?? 0) >= 4,
      verdict: "FAIL",
      subFinding: "the two zero-seam-incidence keys (2395, 2899) are observed, so no threshold selects O; structure recorded, not a predicate",
      evidence: `best numeric split at threshold 4: ${JSON.stringify(numericAxis(uKeys, observedSet, (key) => seamTouchBySatellite.get(satelliteOfKey(key)) ?? 0))}`,
    }),
    {
      axis: "satelliteRoleComposite",
      kind: "composite",
      definition: "Addition-1 satellite-role column set: containment degree, bridge status, cornerstone containment, kernel window, office pairing, seam incidence.",
      rule: "the 14 observed versus 14 unobserved satellites share a structural signature",
      values: {
        observed: { setClassFamily: 14, bridgeOneSided: 10, cornerstoneNearMiss: 12, containment: "constant-15", kernelWindow: "absent", officePairing: "constant", seamIncidence: "fail" },
        unobserved: { setClassFamily: 0, bridgeOneSided: 0, cornerstoneNearMiss: 0, containment: "constant-15", kernelWindow: "absent", officePairing: "constant", seamIncidence: "fail" },
      },
      delegatesTo: "setClassFamily",
      split: false,
      nearMiss: false,
      verdict: "FORTE_ONLY",
      subFinding: "only set-class family separates 14/14; bridge (one-sided 10/14 vs 0/14) and cornerstone (near-miss 12/14 vs 0/14) are one-sided sub-findings; containment (constant 15), kernel window (absent), office pairing (constant), seam incidence (fail) do not",
      evidence: "the within-office 2-of-4 split is carried entirely by satellite set class; no other role column splits observed from unobserved",
    },
  ];
  const cleanAxes = axes.filter((entry) => entry.split).map((entry) => entry.axis);
  const nearMissAxes = axes.filter((entry) => entry.nearMiss).map((entry) => entry.axis);

  // ---- synthesis ----------------------------------------------------------
  const predicateKeys = uKeys.filter((key) => satelliteForte(key) === "7-27");
  const predicateIntersectionObserved = predicateKeys.filter((key) => observedSet.has(key)).length;
  const taPredicate = taGenerated.filter((key) => satelliteForte(key) === "7-27");
  const seamTAKeys = sortedUnique(phaseC.e2Retry.routeASeam.generatedKeys);
  const seamTAPredicate = seamTAKeys.filter((key) => satelliteForte(key) === "7-27");
  const missedObservedFrozen = observedKeys.filter((key) => !routeAPredicted.has(key));
  const tcSeam = phaseC.e2Retry.routeC.seam;

  const synthesis = {
    predicate: {
      id: "P",
      definition: "P(s) = [forte(s) = 7-27]",
      cleanSplit: "14/14",
      confusion: { tp: predicateIntersectionObserved, fp: predicateKeys.length - predicateIntersectionObserved, fn: 0, tn: 14 },
      intrinsic: "interval content of the satellite; computed from the canonical ledger, not from observation membership (non-circular)",
      tnInvariant: "set class is Tn-invariant; preserved under the phase lift",
      keyingInvariant: "satellite identity is untouched by re-keying; the predicate is representation-stable",
      nonCircularStatement: "forte and interval vector are canonical-ledger fields; the split was verified independently of O",
    },
    underKeyings: {
      frozenTA: { generated: taGenerated.length, predicateIntersection: taPredicate.length, equalsObserved: false,
        missedObserved: missedObservedFrozen.length, cause: "T1-link limitation: rotateMaskZ12 sees only the cycle's two T1 edges (offices 0 and 6)" },
      seamTA: { generated: seamTAKeys.length, predicateIntersection: seamTAPredicate.length, equalsObserved: true,
        restatement: true, note: "complete at full representation (G_A@seam = U) but restates the granted domain" },
      tb: { generated: tbGenerated.length, equalsObserved: false, definitional: true,
        cause: "construction-join emits every r in R; no predicate on T-B can select a proper subset" },
      tc: { generated: tcSeam.generatedRelations.length, observed: tcSeam.observedRelations.length,
        midpointExactStrict: tcSeam.midpointExactStrict, cause: "seam T-C overshoots the observed seam groups" },
    },
    blockers: [
      { id: 1, name: "frozen-geometry", statement: "frozen T-A intersects P at only 4/14 observed keys (T1-link limit); the route cannot reach offices 1-5" },
      { id: 2, name: "tb-definitional", statement: "T-B = U by construction regardless of any predicate; restatement_signature forces not_derived" },
      { id: 3, name: "tc-overshoot", statement: "seam T-C is strict-inexact (7 generated vs 2 observed); C=false blocks every positive contract row" },
    ],
    verdict: "a representation-stable selection predicate exists (P(s) = [forte(s) = 7-27]); the contract cannot derive because no registered route conjoins the predicate with selective geometry; the failure is route geometry, not topology, semantics, or phase machinery",
    designItem: {
      id: "BL-056",
      statement: "new-route design: a contact route conjoining full cycle-edge traversal (T1+T2) with P(7-27), generating exactly O with G strictly inside U; T-B replaced or P-restricted; T-C scope adjudicated (7-edge seam reality vs 2-group observation)",
      hardConstraint: "design must break the cycle-edge <-> construction-pair identity (BL-055 W3): a route that merely joins the same A0 cycle-edges restates U regardless of predicate",
      precondition: "any D4 amendment event remains a separate ceremony; sandbox-only until admission",
    },
    noPredicateBranch: {
      preRegistered: "had no axis split 14/14, the finding would have been that O is distinguished by derivation history (recorded contacts) rather than intrinsic structure, reframing GOVERNS as a recorded relation",
      fired: false,
      note: "the clean set-class split refutes this branch: the distinction is structural and located in the satellite",
    },
    observationROE: "O's predicate class 7-27 is the same-number complement sibling of admitted bridge class 5-27 (landed binding concept; observation only, not evidence).",
    standing: "the predicate finding stands entirely on its own merits: a clean, intrinsic, Tn-invariant, representation-stable set-class partition of the satellite layer, verified non-circularly from the canonical ledger, that the frozen contract's routes could never express",
  };

  // ---- core assembly ------------------------------------------------------
  const core = {
    schemaVersion: SCHEMA_VERSION,
    reviewId: REVIEW_ID,
    status: "planning_evidence",
    generator: "scripts/build-d4-selection-review.mjs",
    sourceBindings: [
      { artifact: FROZEN_RECEIPT_PATH, sha256: fileSha(FROZEN_RECEIPT_PATH), role: "frozen D4 comparison (U/O keyings, cells, route accounting)" },
      { artifact: FROZEN_GENERATION_PATH, sha256: fileSha(FROZEN_GENERATION_PATH), role: "frozen projection (R/E/anchors) and witness records" },
      { artifact: HEPTATONIC_LEDGER_PATH, sha256: fileSha(HEPTATONIC_LEDGER_PATH), role: "462-record canonical ledger (forte, interval vector, offices)" },
      { artifact: HEPTATONIC_NETWORK_PATH, sha256: fileSha(HEPTATONIC_NETWORK_PATH), role: "structural edges (GOVERNS/CONSTRUCTS/SEAT_CONTACT, seam provenance)" },
      { artifact: BIPARTITE_PATH, sha256: fileSha(BIPARTITE_PATH), role: "containment mesh (bridge/cornerstone subnode flags)" },
      { artifact: APPLICATIONS_PATH, sha256: fileSha(APPLICATIONS_PATH), role: "admitted operator applications (seam incidence)" },
      { artifact: PHASE_C_PROBE_PATH, sha256: fileSha(PHASE_C_PROBE_PATH), role: "Phase C retry (seam pairs, strict control, T-C, contract)" },
      { artifact: PHASE_A_PROBE_PATH, sha256: fileSha(PHASE_A_PROBE_PATH), role: "licensed lift structure (phase multiplicity)" },
    ],
    step0: {
      probe: "execution-scope-verification (gates the framing)",
      s0_1: {
        question: "are the per-X derivation contexts patch-restricted {11,0,1} or global (all 12)?",
        finding: "PATCH_ONLY",
        evidence: {
          artifactKeying: "phase-c-probe e2Retry.keying.patchPhases = [11,0,1]; crossPhaseContainment forbidden (P4)",
          calibrationPerPhase: "11, 0, 1",
          seamPairsPhases: "all aPhase/cPhase in the patch",
          builder: "scripts/build-phase-c-probe.mjs PATCH_PHASES=[11,0,1]; E2 loops PATCH_PHASES; ALL_PHASES is used only by E4",
          validator: "orrery/scripts/validate-phase-c-probe.mjs PATCH=[11,0,1]",
          spec: "scrum/plan/bl-033-phaseC-lifted-keying-spec.md 2.3",
        },
        verdict: "patch-only confirmed; Hypothesis B (global phase leakage) is pre-falsified by execution scope; the over-generation is intrinsic to the seam-extended contract",
      },
      s0_2: {
        question: "within the patch, does G_A@seam = U hold identically at all three patch phases, or does the over-generation vary by phase?",
        finding: "calibration is identical at all three patch phases (8 keys; cells 0/10/4/0); the artifact carries G_A@seam as a union only; the OD-3 per-phase reconstruction shows the union is reached at phases 1 and 11 (all 7 offices) while phase 0 reaches only offices {0,6} (the frozen 8 keys)",
        verdict: "over-generation is phase-independent at the flank phases; the seam extension's phase structure (T2 edges at (1,11)) is real but is not an observed-set discriminator",
      },
      scopeLanguage: "free-context = keying mode; patch = phase scope; never conflated (tonic-vs-collection-root ambiguity class)",
      hypothesisB: "carried as considered-and-adjudicated, not adopted",
    },
    domain: {
      uKeys,
      observedKeys,
      fourCellCounts: { aOnly: cells.aOnly, bOnly: cells.bOnly, both: cells.both, neither: cells.neither },
      perOffice: sortedUnique(uKeys.map((key) => officeOfKey(key))).map((office) => {
        const keys = uKeys.filter((key) => officeOfKey(key) === office);
        const observed = keys.filter((key) => observedSet.has(key));
        const first = rByKey.get(keys[0]);
        return { office, parentH: String(first.source), keys, observed, observedCount: observed.length };
      }),
      observedPerOffice: 2,
      routeAKeys: sortedUnique(comparison.routes.A.generatedKeys),
      routeBKeys: sortedUnique(comparison.routes.B.generatedKeys),
    },
    table28,
    axes,
    axisSummary: { tested: axes.length, cleanSplits: cleanAxes, nearMisses: nearMissAxes,
      failedOrConstant: axes.filter((entry) => !entry.split).map((entry) => entry.axis) },
    tbProof: {
      definition: "construction-join (frozen engine): e1,e2 in E, e1.id != e2.id, e1.source != e2.source, e1.target = e2.target = r.source; emits (r.parentOffice, r.target) for every r in R",
      perAnchor: tbPerAnchor,
      totalWitnesses: tbWitnessTotal,
      allAnchorsHaveTwoDistinctParents: true,
      joinReadsSatelliteOnlyAsPayload: true,
      generatedKeys: tbGenerated,
      definitional: true,
      conclusion: "G_B = U by construction: every r in R qualifies because every A1 anchor has exactly 2 distinct A0 CONSTRUCTS parents; no predicate on T-B can select a proper subset",
    },
    taGeometry: {
      definition: "kernel-twin (frozen engine): a.office = (k+1)%7, b.office = (k-1+7)%7, rotateMaskZ12(a) = b; rotateMaskZ12 is +1 semitone on the mask; the ledger id is the mask",
      a0Anchors: a0,
      rotTable,
      inA0RotationImages: rotTable.filter((row) => row.inA0).length,
      frozenPairs,
      generatedKeys: taGenerated,
      missedObservedKeys: missedObservedFrozen,
      underCoverageStatement: "the kernel-twin relation has exactly 2 edges on the A0 anchor set (the cycle's T1 edges at offices 0 and 6); the five T2 edges (offices 1-5) are invisible to rotateMaskZ12 at any office",
      cycle: {
        edges: cycleEdges,
        intervalSum: cycleIntervalSum,
        closes: cycleCloses,
        t1Edges: t1Offices,
        t2Edges: t2Offices,
        statement: "the 7 A0 anchors form one closed transposition cycle (5 x T2 + 2 x T1, summing to 12); the 7 seam-pair edges are exactly this cycle; T-A sees only the 2 T1 edges",
      },
      seamEdges,
    },
    od3Diagnostic: {
      method: "diagnostic-only per-phase attribution over the landed seam pairs (OD-3); the published union remains canonical",
      patchPhases: PATCH_PHASES.map(String),
      perPhase,
      verdict: "over-generation is phase-independent at the flank phases and absent at the center phase; center-phase restriction reproduces the frozen 8-key under-coverage rather than selecting O; the phase structure exists but is not an observed-set discriminator",
    },
    synthesis,
    fences: {
      governsVerdicts: "none: D4 not_derived (DECISION_LEDGER.md:2195-2252) unchanged; no verdict is claimed from this sandbox",
      recordAmendment: "none: any D4 amendment is its own claim event with its own ceremony",
      topology: "none: no topology/canon/runtime/schema/Court/Neo4j writes",
      g1Intra330: "untouched",
      direction: "unassigned (BL-035 carried)",
      membrane: "frame 2.6/2.7 and the polarity synthesis are interpretation vocabulary, never design input",
      packaging: "review artifact is planning_evidence; landing-time packaging is a separate step",
      sessionProse: "context, not evidence",
      routeExecution: "none: no derivation is executed; the route variant is BL-056 design work",
    },
    contractCitations: [
      "provenance/DECISION_LEDGER.md:2054-2075 (Attachment F comparators; U/O definitions)",
      "provenance/DECISION_LEDGER.md:2104-2117 (outcome contract rows)",
      "provenance/DECISION_LEDGER.md:2163-2164 (pre-registered impossibility note)",
      "provenance/DECISION_LEDGER.md:2127-2130 (freeze guard)",
      "provenance/DECISION_LEDGER.md:2195-2252 (ENTRY 10 not_derived; cells 0/10/4/0)",
      "provenance/OBSERVATION_LEDGER.md:485-532 (OBS-023 mechanics)",
    ],
    notAccomplished: [
      "no D4 record amendment and no governs admission",
      "no new derivation execution (the route variant is BL-056 design work)",
      "no INV-5 graduation and no M-walkability promotion",
      "no G1 movement and no directional-semantics assignment",
      "no topology/canon/Court/Neo4j/schema claims",
      "no claim beyond the landed frozen bytes; session prose is not evidence",
    ],
  };
  const reviewFingerprint = sha256(canonicalText(core));
  return { ...core, reviewFingerprint };
}

// ---------------------------------------------------------------------------

export function serializeReview(review) {
  return `${canonicalText(review)}\n`;
}

function main() {
  const check = process.argv.includes("--check");
  const review = buildReview();
  const serialized = serializeReview(review);
  const outputPath = path.join(root, OUTPUT_PATH);
  const summary = {
    output: OUTPUT_PATH,
    check,
    step0: review.step0.s0_1.verdict,
    cleanAxes: review.axisSummary.cleanSplits,
    nearMissAxes: review.axisSummary.nearMisses,
    tbDefinitional: review.tbProof.definitional,
    taGenerated: review.taGeometry.generatedKeys.length,
    cycleIntervalSum: review.taGeometry.cycle.intervalSum,
    predicate: review.synthesis.predicate.definition,
    blockers: review.synthesis.blockers.length,
    reviewFingerprint: review.reviewFingerprint,
  };
  if (check) {
    const existing = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, "utf8") : null;
    if (existing !== serialized) throw new Error("STALE_D4_SELECTION_REVIEW");
    console.log(JSON.stringify({ ...summary, stale: false }, null, 2));
    return;
  }
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, serialized);
  console.log(JSON.stringify({ ...summary, sha256: sha256(serialized) }, null, 2));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}
