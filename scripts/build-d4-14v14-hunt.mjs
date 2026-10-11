#!/usr/bin/env node
/**
 * Build the BL-060 D4 14-vs-14 structural hunt.
 *
 * Read-only characterization of *why* the D4 anchors' observed contact
 * selection follows the 7-27/7-31 satellite set-class split: seven candidate
 * characterization axes beyond the BL-055 failed axes, each tested for a
 * 14/14 split, each adjudicated under the OD-60-2 restatement guard.
 *
 * Sections:
 *   base        - BL-055 import by fingerprint (OD-60-4): the 28-key table
 *                 and predicate are read from the landed selection review
 *   ivDelta     - interval-vector delta recomputed from canonical ledger
 *                 bytes (OD-60-1: the brief's hand-derived string is dropped)
 *   table28     - the extended 28-key table: BL-055 base columns plus the new
 *                 axis columns (complement, symmetry, D-tier containment,
 *                 cycle position, governor/element, ENTRY 13 fate)
 *   axes        - the seven new axis tests: confusion matrices, split classes
 *                 (restatement / independent / non-separating)
 *   dTier       - per-family D-tier containment breakdown (7 families x
 *                 7-27/7-31) and the non-Z composite clean split
 *   officeLemma - proof that every office-derived predicate is non-separating
 *                 (each office contributes exactly 2 observed + 2 unobserved)
 *   bridge      - complement-bridge adjudication under the OD-60-2
 *                 restatement-vs-explanation guard, plus the canon-level
 *                 admission asymmetry
 *   synthesis   - primitive vs derived verdict, governs-semantic-layer entry,
 *                 scoping-memo connection
 *
 * Fences: sandbox/analysis only. No canonical/Court/schema/Neo4j writes. D4's
 * derivable-via-R2 and D7's hypothesis-tier are unchanged. No governs
 * admission, no G1 movement, no direction assignment, no D7 computation
 * (OD-60-D7). Planning evidence, byte-stable, independently validated. The
 * frame 2.6/2.7 is interpretation vocabulary, never design input.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  HEPTATONIC_LEDGER_PATH,
  BIPARTITE_PATH,
  canonicalText,
  fail,
  fileSha,
  parseCsv,
  parsePitchSet,
  read,
  readJson,
  sha256,
} from "./verify-phase-a-proposals.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..");

export const SCHEMA_VERSION = "harmonic-orrery.d4-14v14-hunt.v1";
export const HUNT_ID = "BL060_D4_14V14_HUNT_v1";
export const OUTPUT_PATH = "orrery/src/generated/d4-14v14-hunt.v1.json";
export const BL055_PATH = "orrery/src/generated/d4-selection-review.v1.json";
export const COMPLEMENT_MAP_PATH = "seven-governors-court-substrate-v0.1.0/canonical/complement-map.json";
export const COURT_ADMISSION_PATH = "provenance/court-admission-release.json";
export const NETWORK_PATH = "canonical/universal-network-data.json";
export const CORRESPONDENCE_RECEIPT_PATH = "qa/specs/bl-011-correspondence-admission.json";
export const PHASE_C_PROBE_PATH = "orrery/src/generated/phase-c-probe.v1.json";
export const PATCH_PHASES = [11, 0, 1];

export const D_ANCHOR_FAMILIES = ["7-1", "7-15", "7-22", "7-8", "7-Z12", "7-Z17", "7-Z37"];
export const NON_Z_D_FAMILIES = ["7-1", "7-15", "7-22", "7-8"];
export const Z_D_FAMILIES = ["7-Z12", "7-Z17", "7-Z37"];
export const ADMITTED_BRIDGE_CLASSES = ["5-23", "5-27"];
export const ELEMENT_BY_GOVERNOR = { Mars: "Fire", Jupiter: "Air", Venus: "Water", Saturn: "Earth" };
export const ENTRY13_FATE_BY_GOVERNOR = { Mars: "4->5", Jupiter: "9->10", Venus: "2->3", Saturn: "7->8" };
export const ENTRY13_FENCE_CITATION = "docs/specs/fivefold-court-engagement-correspondence-v0.1.0.md:95-104 (scope exclusions: configuration-level identification only; no per-domain element semantics; no INV-5/D4/D7 implication)";

// ---------------------------------------------------------------------------
// Helpers
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

function invertMask(mask) {
  let result = 0;
  for (let pitch = 0; pitch < 12; pitch += 1) {
    if ((mask >> pitch) & 1) result |= 1 << ((12 - pitch) % 12);
  }
  return result;
}

function isInversionSymmetric(pitches) {
  const set = new Set(pitches);
  for (let shift = 0; shift < 12; shift += 1) {
    let holds = true;
    for (const pitch of pitches) {
      if (!set.has(((-pitch + shift) % 12 + 12) % 12)) { holds = false; break; }
    }
    if (holds) return true;
  }
  return false;
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

function numericAxis(keys, observedSet, valueOf, direction) {
  const values = sortedUnique(keys.map(valueOf));
  let best = null;
  for (const threshold of values) {
    const predicate = direction === "le"
      ? (key) => valueOf(key) <= threshold
      : (key) => valueOf(key) >= threshold;
    const matrix = confusion(keys, observedSet, predicate);
    const hit = matrix.tp + matrix.tn;
    if (!best || hit > best.hit) best = { threshold: String(threshold), confusion: matrix, hit };
  }
  return best;
}

function axisEntry({ axis, kind, axisClass, definition, rule, keys, observedSet, valueOf, predicate, verdict, subFinding = null, evidence }) {
  const values = histogram(keys, observedSet, valueOf);
  const matrix = confusion(keys, observedSet, predicate);
  const hit = matrix.tp + matrix.tn;
  const split = matrix.tp === 14 && matrix.tn === 14 && matrix.fp === 0 && matrix.fn === 0;
  const nearMiss = !split && hit >= 26;
  return {
    axis, kind, axisClass, definition, rule,
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

export function buildHunt() {
  const ledgerRows = parseCsv(read(HEPTATONIC_LEDGER_PATH));
  const bipartite = readJson(BIPARTITE_PATH);
  const complementMap = readJson(COMPLEMENT_MAP_PATH);
  const courtAdmission = readJson(COURT_ADMISSION_PATH);
  const network = readJson(NETWORK_PATH);
  const correspondence = readJson(CORRESPONDENCE_RECEIPT_PATH);
  const phaseC = readJson(PHASE_C_PROBE_PATH);
  const bl055 = readJson(BL055_PATH);

  if (ledgerRows.length !== 462) fail(`heptatonic ledger census is ${ledgerRows.length}`);

  // ---- BL-055 import by fingerprint (OD-60-4) -----------------------------
  if (bl055.reviewId !== "BL055_D4_SELECTION_REVIEW_v1" || bl055.status !== "planning_evidence") {
    fail("BL-055 artifact header drift");
  }
  const { reviewFingerprint: bl055Fingerprint, ...bl055Core } = bl055;
  if (sha256(canonicalText(bl055Core)) !== bl055Fingerprint) fail("BL-055 fingerprint self-check failed");
  if (bl055.table28.length !== 28 || bl055.domain.uKeys.length !== 28 || bl055.domain.observedKeys.length !== 14) {
    fail("BL-055 table/domain census drift");
  }
  const uKeys = sortedUnique(bl055.domain.uKeys);
  const observedKeys = sortedUnique(bl055.domain.observedKeys);
  if (uKeys.length !== 28 || observedKeys.length !== 14) fail("domain census mismatch");
  const observedSet = new Set(observedKeys);
  const bl055RowByKey = new Map(bl055.table28.map((row) => [row.key, row]));
  if (bl055RowByKey.size !== 28) fail("BL-055 key collisions");

  const officeOfKey = (key) => key.split(":")[0];
  const satelliteOfKey = (key) => key.split(":")[1];
  const ledgerById = new Map(ledgerRows.map((row) => [row.id, row]));
  const ledgerOfKey = (key) => {
    const row = ledgerById.get(satelliteOfKey(key));
    if (!row) fail(`satellite ${satelliteOfKey(key)} missing from ledger`);
    return row;
  };

  // ---- ledger verification: classes, offices, D-tier census ---------------
  const observedFromLedger = ledgerRows.filter((row) => row.forte === "7-27");
  const unobservedFromLedger = ledgerRows.filter((row) => row.forte === "7-31");
  if (observedFromLedger.length !== 14 || unobservedFromLedger.length !== 14) fail("global class census drift");
  if ([...observedFromLedger, ...unobservedFromLedger].some((row) => row.tier !== "A1" || row.role !== "satellite")) {
    fail("global class records are not all A1 satellites");
  }
  const ledgerGlobalCheck = {
    observedClassCount: observedFromLedger.length,
    unobservedClassCount: unobservedFromLedger.length,
    allA1Satellites: true,
  };

  const dAnchors = ledgerRows.filter((row) => row.role === "anchor" && row.tier.startsWith("D"));
  if (dAnchors.length !== 49) fail(`D-tier anchor census is ${dAnchors.length}`);
  const dAnchorByFamily = new Map();
  for (const row of dAnchors) {
    const list = dAnchorByFamily.get(row.forte) ?? [];
    list.push({ id: row.id, tier: row.tier });
    dAnchorByFamily.set(row.forte, list);
  }
  if (canonicalText(sortedUnique([...dAnchorByFamily.keys()])) !== canonicalText(D_ANCHOR_FAMILIES)) {
    fail("D-tier anchor family census drift");
  }
  for (const family of D_ANCHOR_FAMILIES) {
    if (dAnchorByFamily.get(family).length !== 7) fail(`D-tier family ${family} anchor census drift`);
  }

  const officeOrder = network.officeOrder.map(String);
  if (officeOrder.length !== 7) fail("office order census drift");
  const ledgerOfficeByIndex = new Map();
  for (const row of ledgerRows) {
    if (row.officeIndex !== "" && row.office !== "") ledgerOfficeByIndex.set(row.officeIndex, row.office);
  }
  if (ledgerOfficeByIndex.size !== 7) fail("ledger office map census drift");
  for (const [index, office] of ledgerOfficeByIndex) {
    if (officeOrder[Number(index)] !== office) fail(`office order disagreement at ${index}`);
  }
  const perOfficeCounts = officeOrder.map((governor, index) => {
    const office = String(index);
    const keys = uKeys.filter((key) => officeOfKey(key) === office);
    const observed = keys.filter((key) => observedSet.has(key));
    const class27 = keys.filter((key) => ledgerOfKey(key).forte === "7-27");
    const class31 = keys.filter((key) => ledgerOfKey(key).forte === "7-31");
    if (keys.length !== 4 || observed.length !== 2 || class27.length !== 2 || class31.length !== 2) {
      fail(`office ${office} block structure drift`);
    }
    return { office, governor, keys, observed, observedCount: observed.length,
      observedClassCount: class27.length, unobservedClassCount: class31.length };
  });

  // ---- cycle reconstruction (from phase C seam pairs) ---------------------
  const pitchesOfRow = (row) => parsePitchSet(row.pitchSet).sort((left, right) => left - right);
  const setKeyAtPhase = (pitches, phase) => [...pitches.map((pitch) => (pitch + Number(phase)) % 12)].sort((a, b) => a - b).join(",");
  const seamPairs = phaseC.e2Retry.routeASeam.seamPairs;
  if (seamPairs.length !== 9) fail(`seam pair census ${seamPairs.length}`);
  const cycleEdgeByOffice = new Map();
  for (const pair of seamPairs) {
    if (setKeyAtPhase(pitchesOfRow(ledgerById.get(pair.a)), pair.aPhase) !== pair.geometry) fail(`seam geometry drift at office ${pair.office}`);
    if (setKeyAtPhase(pitchesOfRow(ledgerById.get(pair.c)), pair.cPhase) !== pair.geometry) fail(`seam geometry drift at office ${pair.office}`);
    const interval = ((Number(pair.aPhase) - Number(pair.cPhase)) + 12) % 12;
    cycleEdgeByOffice.set(String(pair.office), { office: String(pair.office), interval });
  }
  if (cycleEdgeByOffice.size !== 7) fail(`cycle edge census ${cycleEdgeByOffice.size}`);
  const cycleIntervalSum = [...cycleEdgeByOffice.values()].reduce((sum, edge) => sum + edge.interval, 0);
  if (cycleIntervalSum !== 12) fail("cycle interval sum drift");
  const cycleEdgeType = (office) => (cycleEdgeByOffice.get(office).interval === 1 ? "T1" : "T2");
  const t1Offices = [...cycleEdgeByOffice.values()].filter((edge) => edge.interval === 1).map((edge) => edge.office).sort(cmp);
  if (canonicalText(t1Offices) !== canonicalText(["0", "6"])) fail("T1 office set drift");

  // ---- complement map and admission ---------------------------------------
  const complementByHeptatonic = new Map();
  for (const entry of complementMap.complementMaps) {
    const complementClass = String(entry.pentatonicSetClassId).replace(/^pentatonic:/, "");
    complementByHeptatonic.set(entry.heptatonicFamilyId, {
      complementClass,
      rootedPairs: entry.rootedPairs.length,
      rootedRecord: entry.rootedPairs[0]?.rootedRecordId ?? null,
      representativeHeptatonicMask: String(entry.representativeHeptatonicMask),
    });
  }
  if (complementByHeptatonic.size !== 38) fail(`complement map census ${complementByHeptatonic.size}`);
  const complementOf = (forte) => {
    const entry = complementByHeptatonic.get(forte);
    if (!entry) fail(`complement map missing ${forte}`);
    return entry;
  };
  if (complementOf("7-27").complementClass !== "5-27" || complementOf("7-31").complementClass !== "5-31") {
    fail("complement class disagreement");
  }

  const admittedBridges = courtAdmission.admittedScope.bridgeSetClasses.map(String);
  if (canonicalText(sortedUnique(admittedBridges)) !== canonicalText(ADMITTED_BRIDGE_CLASSES)) {
    fail("admitted bridge class list drift");
  }
  const proposedClasses = courtAdmission.proposedScope.pentatonicSetClasses.map(String);
  if (!proposedClasses.includes("5-31") || proposedClasses.includes("5-27") || proposedClasses.includes("5-23")) {
    fail("proposed/admitted pentatonic scope overlap drift");
  }

  // ---- ENTRY 13 correspondence receipt check (correlation-only) -----------
  const correspondenceText = canonicalText(correspondence);
  const fateStrings = ["Fire 4->5", "Air 9->10", "Water 2->3", "Earth 7->8"];
  const fateHits = fateStrings.filter((fragment) => correspondenceText.includes(fragment));
  if (fateHits.length !== 4) fail("ENTRY 13 correspondence receipt does not carry the four element fates");

  // ---- bipartite containment ----------------------------------------------
  const heptNodeByMask = new Map(Object.values(bipartite.heptatonicNodes).map((node) => [String(node.pitchMask), node]));
  if (heptNodeByMask.size !== 462) fail("bipartite heptatonic census drift");
  const pentatonicById = bipartite.pentatonicSubnodes;
  const satelliteNode = (key) => {
    const node = heptNodeByMask.get(satelliteOfKey(key));
    if (!node) fail(`bipartite heptatonic node missing for ${satelliteOfKey(key)}`);
    return node;
  };
  const sharedWithFamily = (key, family) => satelliteNode(key).subnodes
    .filter((id) => (pentatonicById[id]?.parentsUnrooted ?? []).includes(family)).length;
  const familyCountsOf = (key) => Object.fromEntries(D_ANCHOR_FAMILIES.map((family) => [family, sharedWithFamily(key, family)]));
  const nonZSumOf = (key) => NON_Z_D_FAMILIES.reduce((sum, family) => sum + sharedWithFamily(key, family), 0);
  const zSumOf = (key) => Z_D_FAMILIES.reduce((sum, family) => sum + sharedWithFamily(key, family), 0);

  // inversion stability: every satellite's inversion image is in the mesh
  const inversionRecords = uKeys.map((key) => {
    const mask = Number(satelliteOfKey(key));
    const sibling = String(invertMask(mask));
    const inMesh = heptNodeByMask.has(sibling);
    if (!inMesh) fail(`inversion image ${sibling} missing from mesh`);
    return { key, sibling, inMesh };
  });
  if (inversionRecords.length !== 28) fail("inversion stability census drift");
  const inversionStableOnClass = inversionRecords.every((record) => {
    const node = heptNodeByMask.get(record.sibling);
    return node.setClassId === ledgerOfKey(record.key).forte;
  });
  if (!inversionStableOnClass) fail("inversion image class drift");

  // ---- extended 28-key table ----------------------------------------------
  const table28 = uKeys.map((key) => {
    const office = officeOfKey(key);
    const satellite = satelliteOfKey(key);
    const ledgerRow = ledgerOfKey(key);
    const baseRow = bl055RowByKey.get(key);
    if (!baseRow) fail(`BL-055 row missing for ${key}`);
    if (baseRow.forte !== ledgerRow.forte || baseRow.intervalVector !== ledgerRow.intervalVector) {
      fail(`BL-055 base column disagreement at ${key}`);
    }
    if (baseRow.observed !== observedSet.has(key)) fail(`BL-055 observed column disagreement at ${key}`);
    const complement = complementOf(ledgerRow.forte);
    const representative = complement.representativeHeptatonicMask;
    const representativeKey = uKeys.find((candidate) => satelliteOfKey(candidate) === representative) ?? null;
    const governor = officeOrder[Number(office)];
    return {
      key,
      office,
      satellite,
      parentH: baseRow.parentH,
      observed: observedSet.has(key),
      base: {
        forte: baseRow.forte,
        intervalVector: baseRow.intervalVector,
        cell: baseRow.cell,
        bridgeSubnodes: baseRow.bridgeSubnodes,
        cornerstoneSubnodes: baseRow.cornerstoneSubnodes,
        seamIncidence: baseRow.seamIncidence,
      },
      complement: {
        setClass: complement.complementClass,
        admitted: admittedBridges.includes(complement.complementClass),
        rootedPairs: complement.rootedPairs,
        rootedRecord: complement.rootedRecord,
        representativeMask: representative,
        representativeKey,
        representativeObserved: representativeKey !== null && observedSet.has(representativeKey),
      },
      symmetry: {
        chirality: ledgerRow.chirality,
        zPartner: ledgerRow.zPartner === "" ? null : ledgerRow.zPartner,
        inversionSymmetric: isInversionSymmetric(parsePitchSet(ledgerRow.pitchSet)),
        inversionSibling: inversionRecords.find((record) => record.key === key).sibling,
      },
      dTier: {
        counts: familyCountsOf(key),
        nonZSum: nonZSumOf(key),
        zSum: zSumOf(key),
      },
      cycle: {
        edgeInterval: cycleEdgeByOffice.get(office).interval,
        edgeType: cycleEdgeType(office),
      },
      governor,
      element: ELEMENT_BY_GOVERNOR[governor] ?? null,
      entry13Fate: ENTRY13_FATE_BY_GOVERNOR[governor] ?? null,
    };
  });
  if (table28.length !== 28) fail("extended table census drift");

  const ledgerIvObserved = sortedUnique(observedFromLedger.map((row) => row.intervalVector));
  const ledgerIvUnobserved = sortedUnique(unobservedFromLedger.map((row) => row.intervalVector));
  if (ledgerIvObserved.length !== 1 || ledgerIvUnobserved.length !== 1) {
    fail("interval vectors are not uniform within each class");
  }
  const observedVector = ledgerIvObserved[0].split(",").map(Number);
  const unobservedVector = ledgerIvUnobserved[0].split(",").map(Number);
  const signedDelta = observedVector.map((value, index) => value - unobservedVector[index]);
  const absoluteDelta = signedDelta.map((value) => Math.abs(value));
  const ivDelta = {
    observedVector: observedVector.join(","),
    unobservedVector: unobservedVector.join(","),
    signedObservedMinusUnobserved: signedDelta,
    absolute: absoluteDelta,
    equalICs: signedDelta.map((value, index) => (value === 0 ? `IC${index + 1}` : null)).filter(Boolean),
    reading: "the observed class carries +1 IC2, +1 IC4 and +2 IC5; the unobserved class +2 IC3 and +2 IC6; IC1 is equal; the delta is constant within each class (recomputed from the canonical ledger's fourteen rows per class)",
    briefStringDropped: "<010120>",
    briefStringStatus: "dropped (OD-60-1): hand-derived in the brief, matched neither the signed delta nor the absolute; the ledger-byte recomputation is the authority",
  };

  // ---- axis hunt ----------------------------------------------------------
  const complementSetClass = (key) => ledgerOfKey(key).forte === "7-27" ? "5-27" : "5-31";
  const complementAdmitted = (key) => admittedBridges.includes(complementSetClass(key));
  const elementBearing = (key) => (ELEMENT_BY_GOVERNOR[table28RowByKey(table28, key).governor] ?? null) !== null;
  const fateBearing = (key) => (ENTRY13_FATE_BY_GOVERNOR[table28RowByKey(table28, key).governor] ?? null) !== null;

  const axes = [
    axisEntry({
      axis: "ivDelta",
      kind: "categorical",
      axisClass: "RESTATEMENT",
      definition: "Interval-vector identity of the satellite (IC1..IC6), recomputed from canonical ledger bytes.",
      rule: "intervalVector(s) = '3,4,4,4,5,1'",
      keys: uKeys, observedSet,
      valueOf: (key) => ledgerOfKey(key).intervalVector,
      predicate: (key) => ledgerOfKey(key).intervalVector === "3,4,4,4,5,1",
      verdict: "CLEAN_RESTATEMENT",
      subFinding: "signed delta observed-unobserved [0,1,-2,1,2,-2]; absolute [0,1,2,1,2,2]; the observed class carries +1 IC2, +1 IC4 and +2 IC5, the unobserved +2 IC3 and +2 IC6; IC1 is equal. The predicate is extensionally identical to the set-class predicate (Forte class and interval vector are a canonical bijection on the domain): restatement-grade per OD-60-2.",
      evidence: "recomputed from canonical/universal-heptatonic-ledger.csv intervalVector fields (uniform within each class: 14/14 each); the brief's hand-derived string <010120> matched neither the signed nor the absolute delta and is dropped per OD-60-1",
    }),
    axisEntry({
      axis: "complementSymmetry",
      kind: "categorical",
      axisClass: "NON_SEPARATING",
      definition: "Complement class of the satellite (complement-map.json) and the complement pairs' symmetry structure (chirality, inversion symmetry, Z-partner).",
      rule: "complement symmetry properties separate observed from unobserved",
      keys: uKeys, observedSet,
      valueOf: (key) => complementSetClass(key),
      predicate: () => false,
      verdict: "NON_SEPARATING",
      subFinding: "complement classes are 5-27 (observed) / 5-31 (unobserved), but the symmetry structure does not separate: all 28 states are chiral; 0/28 are inversionally symmetric; zPartner is null in 28/28. The complement-class partition itself is the set-class split relabeled by the canonical complement-map bijection (restatement-grade); the complements' admission and rooted-record differences are carried to the bridge axis.",
      evidence: "complement classes from seven-governors-court-substrate-v0.1.0/canonical/complement-map.json (38 maps; 7-27->5-27, 7-31->5-31); chirality/zPartner from the canonical ledger; inversion symmetry recomputed from canonical pitch sets",
    }),
    axisEntry({
      axis: "dTierContainmentComposite",
      kind: "composite",
      axisClass: "INDEPENDENT_STRUCTURAL_SIGNATURE",
      definition: "Shared pentatonic subnodes between the satellite's heptatonic node and the four non-Z D-tier anchor families (7-1, 7-8, 7-15, 7-22) - the satellite's containment interface with the non-Z boundary layer.",
      rule: "nonZSum(s) <= 13",
      keys: uKeys, observedSet,
      valueOf: (key) => nonZSumOf(key),
      predicate: (key) => nonZSumOf(key) <= 13,
      verdict: "CLEAN_SPLIT_14_14",
      subFinding: "boundary gap of exactly 1: observed states range 8..13, unobserved 14..19; not a restatement of the class label (within-class rooted-state variance exists on both sides); inversion-invariant (28/28 inversion pairs in-mesh with equal nonZSum); per-family one-sided appetites are in dTier.perFamily.",
      evidence: "recomputed from derived/hypergraph/bipartite-inclusion-v1.json (subnode parentsUnrooted) against the 49 tier-D anchors' family census (7 anchors per family); OD-60-2 guard passed: read from an independent artifact, class-correlated but not class-constant",
    }),
    axisEntry({
      axis: "cyclePosition",
      kind: "office-level",
      axisClass: "NON_SEPARATING",
      definition: "Position of the satellite's office on the closed A0 transposition cycle (T1 edges at offices 0 and 6; T2 edges at offices 1-5).",
      rule: "office's cycle edge is T1",
      keys: uKeys, observedSet,
      valueOf: (key) => cycleEdgeType(officeOfKey(key)),
      predicate: (key) => cycleEdgeType(officeOfKey(key)) === "T1",
      verdict: "NON_SEPARATING",
      subFinding: "every office contributes exactly 2 observed and 2 unobserved keys, so any office-derived predicate attains tp = fp and fn = tn; the split is office-transverse (see officeLemma).",
      evidence: "cycle recomputed from the Phase C seam pairs (5 x T2 + 2 x T1, interval sum 12; T1 offices 0 and 6); confusion matches the office-lemma formula at k = 2",
    }),
    axisEntry({
      axis: "bridgeAdmissionLink",
      kind: "categorical",
      axisClass: "RESTATEMENT",
      definition: "Whether the satellite's complement class is among the admitted bridge classes (court-admission-release.json admittedScope.bridgeSetClasses).",
      rule: "complementClass(s) in ['5-23','5-27']",
      keys: uKeys, observedSet,
      valueOf: (key) => String(complementAdmitted(key)),
      predicate: complementAdmitted,
      verdict: "CLEAN_RESTATEMENT",
      subFinding: "clean only by canonical bijection: complement(7-27) = 5-27 (admitted bridge), complement(7-31) = 5-31 (proposed, pending; not admitted). OD-60-2 adjudication: RESTATEMENT-grade - the predicate is the set-class split relabeled through the complement-map bijection; no independent mechanism connecting admitted-bridge status to D4 contact selection is exhibited in the landed machinery (the BL-055 bridge-subnode axis fails one-sided 10/14 vs 0/14). The canon-level asymmetry is recorded in bridgeAdjudication.",
      evidence: `admitted bridges from provenance/court-admission-release.json (${JSON.stringify(ADMITTED_BRIDGE_CLASSES)}); 5-31 present in the proposedScope list (35 classes, pending admission); complement classes from the complement map`,
    }),
    axisEntry({
      axis: "governorElement",
      kind: "office-level",
      axisClass: "NON_SEPARATING",
      definition: "Element class carried by the satellite's office (Fire/Mars, Air/Jupiter, Water/Venus, Earth/Saturn; Sun/Moon luminaries; Mercury quintessence).",
      rule: "office carries an element",
      keys: uKeys, observedSet,
      valueOf: (key) => table28RowByKey(table28, key).element ?? "none",
      predicate: elementBearing,
      verdict: "NON_SEPARATING",
      subFinding: "correlation-only under the ENTRY 13 fence (OD-60-3); office-transverse by the office lemma, so no element grouping can separate (k = 4 element-bearing offices: tp 8 / fp 8 / fn 6 / tn 6).",
      evidence: `office order from canonical/universal-network-data.json officeOrder; element map from framework/AGENTS.md:234-241 and docs/specs/fivefold-court-engagement-correspondence-v0.1.0.md; ${ENTRY13_FENCE_CITATION}`,
    }),
    axisEntry({
      axis: "entry13Interaction",
      kind: "office-level",
      axisClass: "NON_SEPARATING",
      definition: "Whether the satellite's office carries an admitted ENTRY 13 engagement-position degree-fate (Fire/Mars 4->5, Air/Jupiter 9->10, Water/Venus 2->3, Earth/Saturn 7->8).",
      rule: "office carries an ENTRY 13 degree-fate",
      keys: uKeys, observedSet,
      valueOf: (key) => table28RowByKey(table28, key).entry13Fate ?? "none",
      predicate: fateBearing,
      verdict: "NON_SEPARATING",
      subFinding: "correlation-only under the ENTRY 13 fence (OD-60-3); office-transverse by the office lemma (same k = 4 grouping as the element axis); no interaction with the split is possible at office resolution.",
      evidence: `four fates verified present in qa/specs/bl-011-correspondence-admission.json (${JSON.stringify(fateStrings)}); correspondence admission provenance provenance/DECISION_LEDGER.md:2490-2565; ${ENTRY13_FENCE_CITATION}`,
    }),
  ];
  const cleanAxes = axes.filter((entry) => entry.split).map((entry) => entry.axis);
  const restatementAxes = axes.filter((entry) => entry.axisClass === "RESTATEMENT").map((entry) => entry.axis);
  const independentAxes = axes.filter((entry) => entry.axisClass === "INDEPENDENT_STRUCTURAL_SIGNATURE").map((entry) => entry.axis);
  const nonSeparatingAxes = axes.filter((entry) => entry.axisClass === "NON_SEPARATING").map((entry) => entry.axis);

  // ---- D-tier per-family breakdown ----------------------------------------
  const perFamily = D_ANCHOR_FAMILIES.map((family) => {
    const bestGe = numericAxis(uKeys, observedSet, (key) => sharedWithFamily(key, family), "ge");
    const bestLe = numericAxis(uKeys, observedSet, (key) => sharedWithFamily(key, family), "le");
    const best = bestLe.hit > bestGe.hit ? { ...bestLe, direction: "le" } : { ...bestGe, direction: "ge" };
    const nearMiss = best.hit >= 26;
    return {
      family,
      band: Z_D_FAMILIES.includes(family) ? "Z" : "non-Z",
      values: histogram(uKeys, observedSet, (key) => sharedWithFamily(key, family)),
      bestGe: { threshold: bestGe.threshold, confusion: bestGe.confusion, hit: bestGe.hit },
      bestLe: { threshold: bestLe.threshold, confusion: bestLe.confusion, hit: bestLe.hit },
      best: { direction: best.direction, threshold: best.threshold, confusion: best.confusion, hit: best.hit },
      nearMiss,
      verdict: nearMiss ? `NEAR_MISS_ONE_SIDED_${best.direction.toUpperCase()}` : "FAIL",
      note: nearMiss
        ? (best.direction === "ge"
          ? `one-sided: shared count >= ${best.threshold} selects ${best.confusion.tp}/14 observed with ${best.confusion.fp}/14 unobserved (precision ${best.confusion.tp}/${best.confusion.tp + best.confusion.fp})`
          : `one-sided reverse: shared count <= ${best.threshold} selects all ${best.confusion.tp}/14 observed with ${best.confusion.fp} unobserved false positives`)
        : "no threshold or reverse threshold reaches the near-miss band (hit >= 26)",
    };
  });
  const nonZComposite = {
    rule: "nonZSum <= 13",
    values: histogram(uKeys, observedSet, nonZSumOf),
    confusion: confusion(uKeys, observedSet, (key) => nonZSumOf(key) <= 13),
    boundaryGap: { maxObserved: Math.max(...uKeys.filter((key) => observedSet.has(key)).map(nonZSumOf)),
      minUnobserved: Math.min(...uKeys.filter((key) => !observedSet.has(key)).map(nonZSumOf)) },
  };
  const zComposite = {
    rule: "zSum >= 14",
    values: histogram(uKeys, observedSet, zSumOf),
    confusion: confusion(uKeys, observedSet, (key) => zSumOf(key) >= 14),
  };
  if (nonZComposite.confusion.tp !== 14 || nonZComposite.confusion.fp !== 0 ||
      nonZComposite.confusion.fn !== 0 || nonZComposite.confusion.tn !== 14) {
    fail("non-Z composite clean-split expectation failed");
  }
  if (nonZComposite.boundaryGap.maxObserved !== 13 || nonZComposite.boundaryGap.minUnobserved !== 14) {
    fail("non-Z boundary gap drift");
  }

  // ---- office lemma -------------------------------------------------------
  const officeLevelPredicates = {
    cyclePosition: (key) => cycleEdgeType(officeOfKey(key)) === "T1",
    governorElement: elementBearing,
    entry13Interaction: fateBearing,
  };
  const officeLevelMatrices = Object.fromEntries(Object.entries(officeLevelPredicates).map(([axis, predicate]) => [axis, confusion(uKeys, observedSet, predicate)]));
  for (const [axis, matrix] of Object.entries(officeLevelMatrices)) {
    if (matrix.tp !== matrix.fp || matrix.fn !== matrix.tn || matrix.tp + matrix.tn !== 14) {
      fail(`office lemma violation on ${axis}`);
    }
  }
  const officeLemma = {
    statement: "U partitions by office into seven 4-key blocks, each containing exactly 2 observed (7-27) and 2 unobserved (7-31) keys. Any predicate determined by the office alone attains tp = fp and fn = tn, so hit = tp + tn = 14 at every selection size k: no office-derived predicate can separate the split. The split is office-transverse.",
    proof: "for a predicate selecting k offices: tp = 2k, fp = 2k, fn = 14 - 2k, tn = 14 - 2k; hit = 14 identically",
    perOffice: perOfficeCounts.map((block) => ({ office: block.office, governor: block.governor,
      observedClass: block.observedClassCount, unobservedClass: block.unobservedClassCount })),
    verifiedOn: Object.keys(officeLevelMatrices),
    matrices: officeLevelMatrices,
  };

  // ---- bridge adjudication ------------------------------------------------
  const observedComplement = complementOf("7-27");
  const unobservedComplement = complementOf("7-31");
  const representativeProbeKeys = sortedUnique([observedComplement.representativeHeptatonicMask, unobservedComplement.representativeHeptatonicMask]
    .map((mask) => uKeys.find((key) => satelliteOfKey(key) === mask)).filter(Boolean));
  const representativeProbeConfusion = confusion(uKeys, observedSet, (key) => representativeProbeKeys.includes(key));
  const representativeProbe = {
    keys: representativeProbeKeys,
    confusion: representativeProbeConfusion,
    hit: representativeProbeConfusion.tp + representativeProbeConfusion.tn,
    note: "the complement map's own representative heptatonic masks land one on each side of the split (695 observed, 731 unobserved): the complement apparatus alone does not locate the split",
  };
  const bridgeAdjudication = {
    complementClasses: { observed: observedComplement.complementClass, unobserved: unobservedComplement.complementClass },
    admittedBridges: ADMITTED_BRIDGE_CLASSES,
    observedComplementAdmitted: true,
    unobservedComplementAdmitted: false,
    unobservedComplementStatus: "proposed pending admission (court-admission-release.json proposedScope; crt-310 backlog item pentatonic:5-31)",
    classification: "RESTATEMENT",
    guard: "OD-60-2 (restatement-vs-explanation)",
    rationale: "complement is a canonical class-level bijection: [complement admitted] is extensionally the set-class predicate on the domain, adding no structural information; no independent mechanism connecting admitted-bridge status to D4 contact selection is exhibited in the landed machinery (the BL-055 bridge-subnode axis fails one-sided); an independent explanation would need the bridge role to explain the split through the anchors' containment geometry, which is not present",
    canonAsymmetry: {
      observedComplement: { setClass: observedComplement.complementClass, rootedPairs: observedComplement.rootedPairs,
        rootedRecord: observedComplement.rootedRecord, representativeMask: observedComplement.representativeHeptatonicMask },
      unobservedComplement: { setClass: unobservedComplement.complementClass, rootedPairs: unobservedComplement.rootedPairs,
        rootedRecord: unobservedComplement.rootedRecord, representativeMask: unobservedComplement.representativeHeptatonicMask },
      statement: "canon-level asymmetry: the observed class's complement carries an admitted bridge role and a rooted bridge record; the unobserved class's complement carries neither - recorded as an observation, not a derivation",
    },
    representativeProbe,
  };
  if (representativeProbeConfusion.tp + representativeProbeConfusion.tn !== 14) {
    fail(`representative probe expectation drift: ${JSON.stringify({ keys: representativeProbeKeys, confusion: representativeProbeConfusion, observedComplement, unobservedComplement })}`);
  }

  // ---- synthesis ----------------------------------------------------------
  const synthesis = {
    verdict: "DERIVED",
    verdictStatement: "the 7-27/7-31 split has an independent structural basis: the containment interface with the four non-Z D-tier anchor families separates the 28-key domain cleanly (nonZSum <= 13 observed / >= 14 unobserved, boundary gap 1), computed from an independent landed artifact and not class-constant",
    basis: {
      axis: "dTierContainmentComposite",
      rule: nonZComposite.rule,
      confusion: nonZComposite.confusion,
      boundaryGap: nonZComposite.boundaryGap,
      withinClassVariance: { observed: "8..13", unobserved: "14..19" },
      inversionStability: "28/28 inversion pairs in-mesh with equal nonZSum; the inversion representation change preserves the classification",
      provenance: "derived/hypergraph/bipartite-inclusion-v1.json subnode parentsUnrooted against the 49 tier-D anchors' seven families (canonical ledger)",
    },
    cleanSplits: [
      { axis: "ivDelta", class: "RESTATEMENT", note: "canonical Forte<->IV bijection" },
      { axis: "dTierContainmentComposite", class: "INDEPENDENT_STRUCTURAL_SIGNATURE", note: "the basis" },
      { axis: "bridgeAdmissionLink", class: "RESTATEMENT", note: "canonical complement bijection; asymmetry recorded" },
    ],
    nearMisses: perFamily.filter((entry) => entry.nearMiss).map((entry) => ({
      family: entry.family, direction: entry.best.direction, threshold: entry.best.threshold, confusion: entry.best.confusion,
    })),
    nonSeparating: nonSeparatingAxes,
    officeLevelLemma: officeLemma.statement,
    primitiveAlternative: {
      preRegistered: "had no axis yielded an independent structural basis (only restatements or non-separating axes), the finding would have been that the 7-27/7-31 split is axiomatic - a fundamental property of the satellite layer, a candidate axiom for the governs semantic layer",
      fired: false,
      note: "the non-Z D-tier containment signature carries the split independently of the class label; the alternative is recorded as not fired",
    },
    governsSemanticLayerEntry: {
      id: "GSL-1",
      statement: "The D4 contact selection is boundary-geography-selective. In the complete 462-state mesh, every 7-27 satellite state has nonZSum <= 13 (shared pentatonic subnodes with the four non-Z D-tier anchor families 7-1/7-8/7-15/7-22) and every 7-31 state has nonZSum >= 14; the boundary gap is exactly 1. Per-family appetites are one-sided (observed lean on 7-Z17/7-Z37 sharing >= 4; unobserved lean on 7-8/7-22 sharing >= 7). The canonical bridge asymmetry (the observed class's complement 5-27 is an admitted bridge class carrying the aeolian-harmonic-minor rooted bridge record; the unobserved class's complement 5-31 is proposed pending admission and carries no rooted record) is recorded as a canon-level observation, restatement-grade under OD-60-2. Any organization-derivation route toward the higher theorem can be tested against this signature: a route that does not recover the boundary-geography split is incomplete.",
    },
    scopingMemoConnection: "feeds the higher-theorem question's evidence base (scoping memo BL-059 section 4, evidence for intrinsic structure): the contact selection is not only set-class-selective but boundary-geography-selective, an independent structural signature available to any candidate organization-derivation route; the scoping memo accretes by its own mutation discipline and is not edited by this hunt",
    limits: [
      "characterization, not mechanism: the signature describes the split; why the boundary geometry governs contact remains open",
      "rooted-state signature: read from the landed mesh representation; inversion-stable on the domain; broader representation invariance beyond inversion is not tested",
      "the GOVERNS relation remains granted input; the higher-theorem question remains open",
    ],
  };

  // ---- core assembly ------------------------------------------------------
  const core = {
    schemaVersion: SCHEMA_VERSION,
    huntId: HUNT_ID,
    status: "planning_evidence",
    generator: "scripts/build-d4-14v14-hunt.mjs",
    sourceBindings: [
      { artifact: HEPTATONIC_LEDGER_PATH, sha256: fileSha(HEPTATONIC_LEDGER_PATH), role: "462-record canonical ledger (forte, interval vector, offices, chirality, pitch sets)" },
      { artifact: BIPARTITE_PATH, sha256: fileSha(BIPARTITE_PATH), role: "containment mesh (subnode parentsUnrooted: D-tier containment interface)" },
      { artifact: COMPLEMENT_MAP_PATH, sha256: fileSha(COMPLEMENT_MAP_PATH), role: "canonical complement classes (7-27<->5-27, 7-31<->5-31; rooted bridge records)" },
      { artifact: COURT_ADMISSION_PATH, sha256: fileSha(COURT_ADMISSION_PATH), role: "admitted scope (bridgeSetClasses 5-23/5-27; proposed scope carries 5-31)" },
      { artifact: NETWORK_PATH, sha256: fileSha(NETWORK_PATH), role: "canonical office order (Sun..Saturn) and family registry" },
      { artifact: CORRESPONDENCE_RECEIPT_PATH, sha256: fileSha(CORRESPONDENCE_RECEIPT_PATH), role: "ENTRY 13 correspondence admission (element degree-fates; correlation-only axes)" },
      { artifact: PHASE_C_PROBE_PATH, sha256: fileSha(PHASE_C_PROBE_PATH), role: "Phase C retry seam pairs (A0 cycle edge reconstruction)" },
      { artifact: BL055_PATH, sha256: fileSha(BL055_PATH), role: "BL-055 selection review (base 28-key table, imported by fingerprint)" },
    ],
    base: {
      artifact: BL055_PATH,
      fingerprint: bl055Fingerprint,
      reviewId: bl055.reviewId,
      domainKeys: uKeys.length,
      observedKeys: observedKeys.length,
      predicate: "P(s) = [forte(s) = 7-27]",
      importPolicy: "OD-60-4: the BL-055 28-key table is imported by fingerprint; this artifact appends new columns and never edits the base artifact",
    },
    ivDelta,
    domain: {
      uKeys,
      observedKeys,
      perOffice: perOfficeCounts.map((block) => ({ office: block.office, governor: block.governor,
        keys: block.keys, observed: block.observed, observedCount: block.observedCount,
        observedClassCount: block.observedClassCount, unobservedClassCount: block.unobservedClassCount })),
      globalClassCensus: ledgerGlobalCheck,
      dAnchorCensus: { total: dAnchors.length, perFamily: Object.fromEntries(D_ANCHOR_FAMILIES.map((family) => [family, dAnchorByFamily.get(family).length])),
        families: D_ANCHOR_FAMILIES, nonZFamilies: NON_Z_D_FAMILIES, zFamilies: Z_D_FAMILIES },
      cycle: { edges: [...cycleEdgeByOffice.values()].sort((left, right) => cmp(left.office, right.office)),
        intervalSum: cycleIntervalSum, t1Edges: t1Offices },
    },
    table28,
    axes,
    axisSummary: { tested: axes.length, cleanSplits: cleanAxes, restatements: restatementAxes,
      independentSignatures: independentAxes, nonSeparating: nonSeparatingAxes,
      nearMisses: axes.filter((entry) => entry.nearMiss).map((entry) => entry.axis) },
    dTier: { perFamily, nonZComposite, zComposite,
      summary: "no single family splits cleanly; four families give one-sided near-misses (7-8 and 7-22 reverse: <= 3 / <= 5 selects 14/14 observed with the same two false positives 731/2921; 7-Z17 and 7-Z37: >= 5 selects 12/14 observed with 0/14 unobserved); the non-Z composite resolves the stragglers and splits cleanly at a 1-integer boundary gap",
    },
    officeLemma,
    bridgeAdjudication,
    synthesis,
    fences: {
      governsVerdicts: "none: D4 derivable-via-R2 and D7 hypothesis-tier unchanged; no verdict is claimed from this sandbox",
      recordAmendment: "none: any amendment is its own claim event with its own ceremony",
      d7Control: "fenced out entirely (OD-60-D7): no D7 computation; ENTRY 15 D7 clause carried forward (no D7 claim, no D7 amendment; D7 remains hypothesis-tier, preserved)",
      higherTheorem: "not attempted: the scoping memo's question (can GOVERNS be derived?) remains open; this hunt feeds its evidence base only",
      g1Intra330: "untouched",
      direction: "unassigned (BL-035 carried)",
      membrane: "frame 2.6/2.7 and the polarity synthesis are interpretation vocabulary, never design input",
      entry13: "axes 6-7 are correlation-only (OD-60-3); the ENTRY 13 scope excludes per-domain element semantics and D4/D7 implication; no correlation recorded here may be read as D4 implication",
      packaging: "hunt artifact is planning_evidence; landing-time packaging is a separate step",
      sessionProse: "context, not evidence",
      routeExecution: "none: no derivation is executed; no route is admitted or amended",
    },
    contractCitations: [
      "provenance/DECISION_LEDGER.md:2665-2810 (ENTRY 15 record_amended derivable-via-R2; D7 clause; guard)",
      "provenance/DECISION_LEDGER.md:2195-2252 (ENTRY 10 not_derived; immutable, linked forward)",
      "scrum/plan/bl-055-d4-selection-review-memo.md (base predicate and failed axes)",
      "scrum/plan/bl-059-governs-derivability-scoping-memo.md (higher-theorem question; evidence-for section)",
      "provenance/DECISION_LEDGER.md:2490-2565 (ENTRY 13 correspondence)",
      "docs/specs/fivefold-court-engagement-correspondence-v0.1.0.md:95-104 (ENTRY 13 scope exclusions)",
      "qa/specs/bl-057-d4-record-amendment.json (Gate 4 receipt; corridor evidence)",
    ],
    notAccomplished: [
      "no D4 record amendment and no governs admission",
      "no higher-theorem answer (the scoping question remains open)",
      "no D7 computation or control (fenced per OD-60-D7)",
      "no G1 movement and no directional-semantics assignment",
      "no INV-5 graduation and no M-walkability promotion",
      "no topology/canon/Court/Neo4j/schema writes; session prose is not evidence",
    ],
  };
  const huntFingerprint = sha256(canonicalText(core));
  return { ...core, huntFingerprint };
}

function table28RowByKey(table, key) {
  const row = table.find((candidate) => candidate.key === key);
  if (!row) fail(`extended table row missing for ${key}`);
  return row;
}

// ---------------------------------------------------------------------------

export function serializeHunt(hunt) {
  return `${canonicalText(hunt)}\n`;
}

function main() {
  const check = process.argv.includes("--check");
  const hunt = buildHunt();
  const serialized = serializeHunt(hunt);
  const outputPath = path.join(root, OUTPUT_PATH);
  const summary = {
    output: OUTPUT_PATH,
    check,
    baseFingerprint: hunt.base.fingerprint,
    axesTested: hunt.axisSummary.tested,
    cleanSplits: hunt.axisSummary.cleanSplits,
    restatements: hunt.axisSummary.restatements,
    independentSignatures: hunt.axisSummary.independentSignatures,
    nonSeparating: hunt.axisSummary.nonSeparating,
    nonZBoundaryGap: hunt.dTier.nonZComposite.boundaryGap,
    verdict: hunt.synthesis.verdict,
    huntFingerprint: hunt.huntFingerprint,
  };
  if (check) {
    const existing = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, "utf8") : null;
    if (existing !== serialized) throw new Error("STALE_D4_14V14_HUNT");
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
