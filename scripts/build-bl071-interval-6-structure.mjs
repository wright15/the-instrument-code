#!/usr/bin/env node
/**
 * Build the BL-071 interval-6 characterization: the tritone as the boundary
 * layer's candidate geometric signature. Planning, read-only analysis.
 *
 * The question (approved planning pass, rulings OD-71-1..OD-71-6): three
 * findings triangulate on interval 6 - the modal orbit's closure offset
 * (4033->127, rotation 6), the near-miss's two misses (127:253, 4033:2017,
 * displacement 6), and the fa/ti tritone-pair framing (labelled hypothesis,
 * excluded from the verdict per OD-71-2). Is interval 6 the boundary layer's
 * own geometric signature, or a coincidence of local alignments?
 *
 * Structure:
 *   triangulation  - T-1 (the modal orbit closure; re-verified from the
 *                    landed BL-070 bytes, plus the parallel A0 ring closure)
 *                    and T-2 (the near-miss misses; re-verified), with T-3
 *                    carried as labelled framing only (OD-71-2)
 *   census         - five pre-registered universes (OD-71-1): D7-36, D6-tier,
 *                    A1-28, A0-P7 ring, D-tier anchors 49 - each measured
 *                    with THREE DISTINCT measures kept side by side (the
 *                    three measure definition classes cannot be merged):
 *                    (M-DISP) single-pitch displacement 6; (M-ROT) mask
 *                    rotation 6; (M-IC6) interval-class-6 content (a
 *                    per-state vector property, not a pair distance)
 *   baseline       - B1 (the structural reach: all 462-ledger Hamming-2
 *                    pairs) and B2 (the D4/fa-pole domain control), both
 *                    pre-registered before the comparison, plus the
 *                    pre-registered Fisher-exact tests; the approved B2
 *                    prose value (2/28) is corrected against the bytes (0/28)
 *                    as a maintainer-prose grounding correction - the
 *                    baseline slot and test tables are unchanged
 *   splitSevenTwentySeven - the 7-27/7-31 families' pair geometry: no
 *                    direct tritone relation exists between the families
 *                    (the split is class-structured, not tritone-structured)
 *   liftedSpace    - the fa/ti endpoints' tritone relation in the lifted
 *                    space: lifted(b@(p+6)) = T_6(lifted(a@p)) exactly, for
 *                    every phase; root-coherence verified across all 126
 *                    ledger rotation-6 pairs
 *   roleVerdict    - the closed role vocabulary (OD-71-6); the verdict is
 *                    measure-dependent (mixed) with per-measure roles
 *   gsl            - the GSL-4 candidate draft (OD-71-5), un-promoted
 *
 * Fences: planning_evidence only. No mechanism claim (V-BL-071-4); no claim
 * event, no record amendment, no governs admission, no G1 movement, no INV-5
 * graduation, no M-walkability promotion, no canonical/Court/schema/Neo4j
 * writes. D7 hypothesis-tier throughout (ENTRY 15's D7 clause verbatim). The
 * frame (scrum/plan/harmonic-comprehension-map.md sections 2.6/2.7) is
 * interpretation vocabulary, never design input. Session prose is context,
 * not evidence.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  BIPARTITE_PATH,
  HEPTATONIC_LEDGER_PATH,
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

export const SCHEMA_VERSION = "harmonic-orrery.bl071-interval-6-structure.v1";
export const INVESTIGATION_ID = "BL071_INTERVAL_6_STRUCTURE_V1";
export const OUTPUT_PATH = "orrery/src/generated/bl071-interval-6-structure.v1.json";
export const NETWORK_PATH = "canonical/universal-network-data.json";
export const LEDGER_PATH = HEPTATONIC_LEDGER_PATH;
export const MESH_PATH = BIPARTITE_PATH;
export const D4_HUNT_PATH = "orrery/src/generated/d4-14v14-hunt.v1.json";
export const BL070_PATH = "orrery/src/generated/bl070-d7-derivation.v1.json";
export const BL068_PATH = "orrery/src/generated/bl068-d7-asymmetry.v1.json";
export const GATE3_PATH = "qa/d4-r2-execution-receipt.json";
export const PHASE_A_PATH = "orrery/src/generated/phase-a-probe.v1.json";

export const ROLE_VOCABULARY = ["separation", "exclusion", "transition", "mixed", "none"];
export const D_TIER_NAMES = ["D1", "D2", "D3", "D4", "D5", "D6", "D7"];

// ==== CENSUS-CORE-BEGIN (tier/role partition + masks + bit measures only) ====
// This region builds the universe node sets from the canonical ledger's
// tier/role partition and computes every census measure from masks and pitch
// sets alone. It never reads the label fields, the recorded-status fields,
// the network records, the landed domains, or any verdict. The label fields
// are the comparison target, never an input.

function cmp(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function cmpNumericStrings(left, right) {
  return Number(left) - Number(right);
}

function sortedUnique(values) {
  return [...new Set(values)].sort(cmp);
}

export function maskOfRow(row) {
  let mask = 0;
  for (const pitch of parsePitchSet(row.pitchSet)) mask |= 1 << pitch;
  if (mask !== Number(row.id) || mask !== Number.parseInt(row.bitReverse.slice(1), 2)) {
    fail(`ledger row ${row.id}: mask derived from the pitch set disagrees with the identity fields`);
  }
  return mask;
}

export function hamming12(a, b) {
  let x = a ^ b;
  let count = 0;
  while (x !== 0) { count += 1; x &= x - 1; }
  return count;
}

export function rotateMask12(mask, d) {
  const shift = ((d % 12) + 12) % 12;
  if (shift === 0) return mask & 4095;
  return (((mask << shift) & 4095) | (mask >> (12 - shift))) & 4095;
}

export function pcSumOfMask(mask) {
  let sum = 0;
  for (let pitch = 0; pitch < 12; pitch += 1) if ((mask >> pitch) & 1) sum += pitch;
  return sum;
}

export function icVectorOfMask(mask) {
  const pitches = [];
  for (let pitch = 0; pitch < 12; pitch += 1) if ((mask >> pitch) & 1) pitches.push(pitch);
  const vector = [0, 0, 0, 0, 0, 0];
  for (let left = 0; left < pitches.length; left += 1) {
    for (let right = left + 1; right < pitches.length; right += 1) {
      const raw = (pitches[right] - pitches[left]) % 12;
      vector[Math.min(raw, 12 - raw) - 1] += 1;
    }
  }
  return vector;
}

export function singlePitchDisplacement(aPitches, bPitches) {
  const aSet = new Set(aPitches);
  const bSet = new Set(bPitches);
  const removed = aPitches.filter((pitch) => !bSet.has(pitch));
  const added = bPitches.filter((pitch) => !aSet.has(pitch));
  if (removed.length !== 1 || added.length !== 1) {
    fail(`displacement: not a single-pitch swap (removed ${removed.length}, added ${added.length})`);
  }
  const raw = (added[0] - removed[0] + 12) % 12;
  return { removed: removed[0], added: added[0], raw, linear: raw > 6 ? raw - 12 : raw };
}

export function partitionMembers(ledgerRows) {
  if (ledgerRows.length !== 462) fail(`heptatonic ledger census is ${ledgerRows.length}`);
  const members = (tier, role) => ledgerRows
    .filter((row) => row.tier === tier && (role === null || row.role === role))
    .map((row) => String(row.id))
    .sort(cmpNumericStrings);
  const d7Anchors = members("D7", "anchor");
  const d6Satellites = members("D6", "satellite");
  const d6Anchors = members("D6", "anchor");
  const a0Anchors = members("A0", "anchor");
  const a1Anchors = members("A1", "anchor");
  const a1Satellites = members("A1", "satellite");
  const dAnchors = D_TIER_NAMES.flatMap((tier) => {
    const rows = members(tier, "anchor");
    if (rows.length !== 7) fail(`${tier} anchor census drift: ${rows.length}`);
    return rows;
  }).sort(cmpNumericStrings);
  if (d7Anchors.length !== 7 || d6Satellites.length !== 14 || d6Anchors.length !== 7 ||
      a0Anchors.length !== 7 || a1Anchors.length !== 7 || a1Satellites.length !== 28 ||
      dAnchors.length !== 49) {
    fail(`partition census drift: ${d7Anchors.length}/${d6Satellites.length}/${d6Anchors.length}/${a0Anchors.length}/${a1Anchors.length}/${a1Satellites.length}/${dAnchors.length}`);
  }
  return { d7Anchors, d6Satellites, d6Anchors, a0Anchors, a1Anchors, a1Satellites, dAnchors };
}

export function censusPairs(nodes, masksByState, pitchesByState) {
  const sorted = nodes.slice().sort(cmpNumericStrings);
  const hammingHistogram = {};
  const displacementHistogram = {};
  const rotation6Witnesses = [];
  const displacement6Witnesses = [];
  let pairSpaceCount = 0;
  let hamming2Count = 0;
  let displacement6Count = 0;
  const memberStates = new Set(sorted);
  for (let left = 0; left < sorted.length; left += 1) {
    for (let right = left + 1; right < sorted.length; right += 1) {
      const a = sorted[left];
      const b = sorted[right];
      pairSpaceCount += 1;
      const key = `${a}:${b}`;
      const hamming = hamming12(masksByState.get(a), masksByState.get(b));
      hammingHistogram[String(hamming)] = (hammingHistogram[String(hamming)] ?? 0) + 1;
      if (hamming === 2) {
        hamming2Count += 1;
        const displacement = singlePitchDisplacement(pitchesByState.get(a), pitchesByState.get(b));
        displacementHistogram[String(displacement.linear)] = (displacementHistogram[String(displacement.linear)] ?? 0) + 1;
        if (Math.abs(displacement.linear) === 6) {
          displacement6Count += 1;
          displacement6Witnesses.push(key);
        }
      }
      if (rotateMask12(masksByState.get(a), 6) === masksByState.get(b)) rotation6Witnesses.push(key);
    }
  }
  return {
    pairSpaceCount,
    hamming2Count,
    hammingHistogram,
    displacementHistogram,
    displacement6Count,
    rotation6Count: rotation6Witnesses.length,
    rotation6Witnesses,
    displacement6Witnesses,
    memberStates: [...memberStates].sort(cmpNumericStrings),
  };
}

export function censusInstances(instances, masksByState, pitchesByState) {
  const hammingHistogram = {};
  const displacementHistogram = {};
  const rotation6Witnesses = [];
  const displacement6Witnesses = [];
  let hamming2Count = 0;
  let displacement6Count = 0;
  const memberStates = new Set();
  const ordered = instances.slice().sort((left, right) => cmpNumericStrings(left.a, right.a) || cmpNumericStrings(left.b, right.b));
  for (const instance of ordered) {
    const { key, a, b } = instance;
    memberStates.add(a);
    memberStates.add(b);
    const hamming = hamming12(masksByState.get(a), masksByState.get(b));
    hammingHistogram[String(hamming)] = (hammingHistogram[String(hamming)] ?? 0) + 1;
    if (hamming === 2) {
      hamming2Count += 1;
      const displacement = singlePitchDisplacement(pitchesByState.get(a), pitchesByState.get(b));
      displacementHistogram[String(displacement.linear)] = (displacementHistogram[String(displacement.linear)] ?? 0) + 1;
      if (Math.abs(displacement.linear) === 6) {
        displacement6Count += 1;
        displacement6Witnesses.push(key);
      }
    }
    if (rotateMask12(masksByState.get(a), 6) === masksByState.get(b)) rotation6Witnesses.push(key);
  }
  return {
    instanceCount: ordered.length,
    hamming2Count,
    nonSwapCount: ordered.length - hamming2Count,
    hammingHistogram,
    displacementHistogram,
    displacement6Count,
    rotation6Count: rotation6Witnesses.length,
    rotation6Witnesses,
    displacement6Witnesses,
    memberStates: [...memberStates].sort(cmpNumericStrings),
  };
}

export function ic6HistogramOf(states, masksByState) {
  const histogram = {};
  for (const state of states) {
    const value = String(icVectorOfMask(masksByState.get(state))[5]);
    histogram[value] = (histogram[value] ?? 0) + 1;
  }
  return histogram;
}

export function d7DomainInstances(members, masksByState) {
  const instances = [];
  for (const anchor of members.d7Anchors) {
    for (const satellite of members.d6Satellites) {
      if (hamming12(masksByState.get(anchor), masksByState.get(satellite)) === 2) {
        instances.push({ key: `${anchor}:${satellite}`, a: anchor, b: satellite });
      }
    }
  }
  return instances;
}

export function tierCrossPairs(anchors, satellites) {
  const pairs = [];
  for (const anchor of anchors.slice().sort(cmpNumericStrings)) {
    for (const satellite of satellites.slice().sort(cmpNumericStrings)) {
      if (anchor === satellite) continue;
      pairs.push({ key: `${anchor}:${satellite}`, a: anchor, b: satellite });
    }
  }
  return pairs;
}

export function ringEdges(anchors, masksByState) {
  const edges = [];
  const sorted = anchors.slice().sort(cmpNumericStrings);
  for (let left = 0; left < sorted.length; left += 1) {
    for (let right = left + 1; right < sorted.length; right += 1) {
      const a = sorted[left];
      const b = sorted[right];
      const hamming = hamming12(masksByState.get(a), masksByState.get(b));
      const rotation = rotateMask12(masksByState.get(a), 6) === masksByState.get(b);
      if (hamming === 2 || rotation) edges.push({ key: `${a}:${b}`, a, b });
    }
  }
  return edges;
}

export function ledgerReachPairs(ledgerRows, masksByState, pitchesByState) {
  const sorted = ledgerRows.map((row) => String(row.id)).sort(cmpNumericStrings);
  const hamming2Keys = [];
  const displacementHistogram = {};
  let displacement6Count = 0;
  let hamming2AndRotation6Count = 0;
  for (let left = 0; left < sorted.length; left += 1) {
    for (let right = left + 1; right < sorted.length; right += 1) {
      const a = sorted[left];
      const b = sorted[right];
      const hamming = hamming12(masksByState.get(a), masksByState.get(b));
      const rotation6 = rotateMask12(masksByState.get(a), 6) === masksByState.get(b);
      if (hamming === 2) {
        const key = `${a}:${b}`;
        hamming2Keys.push(key);
        const displacement = singlePitchDisplacement(pitchesByState.get(a), pitchesByState.get(b));
        displacementHistogram[String(displacement.linear)] = (displacementHistogram[String(displacement.linear)] ?? 0) + 1;
        if (Math.abs(displacement.linear) === 6) displacement6Count += 1;
        if (rotation6) hamming2AndRotation6Count += 1;
      }
    }
  }
  const rotation6Keys = [];
  for (const a of sorted) {
    const partner = rotateMask12(masksByState.get(a), 6);
    if (String(partner) > a && masksByState.has(String(partner))) rotation6Keys.push(`${a}:${partner}`);
  }
  return {
    pairSpaceCount: (sorted.length * (sorted.length - 1)) / 2,
    hamming2Count: hamming2Keys.length,
    displacementHistogram,
    displacement6Count,
    rotation6Count: rotation6Keys.length,
    rotation6Witnesses: rotation6Keys,
    hamming2AndRotation6Count,
  };
}

// ==== CENSUS-CORE-END ====

// ---- comparison and cross-check sections (the label fields, the recorded
// ---- status, the landed domains and the landed verdicts are read here;
// ---- never in the census-core region) --------------------------------------

function fisherGreaterExact(a, b, c, d) {
  function combinations(n, k) {
    const reduced = Math.min(k, n - k);
    let result = 1n;
    for (let index = 0n; index < BigInt(reduced); index += 1n) {
      result = (result * (BigInt(n) - index)) / (index + 1n);
    }
    return result;
  }
  function gcd(left, right) {
    let x = left;
    let y = right;
    while (y !== 0n) { const next = x % y; x = y; y = next; }
    return x;
  }
  const r1 = a + b;
  const r2 = c + d;
  const successes = a + c;
  const total = r1 + r2;
  let numerator = 0n;
  for (let i = a; i <= Math.min(r1, successes); i += 1) {
    numerator += combinations(r1, i) * combinations(r2, successes - i);
  }
  const denominator = combinations(total, successes);
  const divisor = gcd(numerator, denominator);
  return { num: numerator / divisor, den: denominator / divisor };
}

function decimalOf(rational, digits) {
  const scaled = (rational.num * 10n ** BigInt(digits)) / rational.den;
  return `0.${scaled.toString().padStart(digits, "0")}`;
}

function fisherTest(id, question, table, interpretation) {
  const { num, den } = fisherGreaterExact(table.a, table.b, table.c, table.d);
  return {
    id,
    question,
    table,
    side: "greater",
    pExact: `${num.toString()}/${den.toString()}`,
    pDecimal: decimalOf({ num, den }, 24),
    interpretation,
  };
}

function rootShiftsBySix(maskA, maskB, meshRootByMask) {
  const rootA = meshRootByMask.get(String(maskA));
  const rootB = meshRootByMask.get(String(maskB));
  if (rootA === undefined || rootB === undefined) fail(`mesh root missing for ${maskA}/${maskB}`);
  return (rootA + 6) % 12 === rootB;
}

export function buildInvestigation() {
  const ledgerRows = parseCsv(read(LEDGER_PATH));
  const network = readJson(NETWORK_PATH);
  const mesh = readJson(MESH_PATH);
  const d4Hunt = readJson(D4_HUNT_PATH);
  const bl070 = readJson(BL070_PATH);
  const bl068 = readJson(BL068_PATH);
  const gate3 = readJson(GATE3_PATH);
  const phaseA = readJson(PHASE_A_PATH);

  if (ledgerRows.length !== 462) fail(`heptatonic ledger census is ${ledgerRows.length}`);
  const meshMasks = new Set(Object.values(mesh.heptatonicNodes).map((node) => String(node.pitchMask)));
  if (meshMasks.size !== 462) fail(`containment mesh census drift: ${meshMasks.size}`);

  // ---- chain self-checks (fingerprints; no literals in this generator) ----
  const { huntFingerprint: d4HuntFingerprint, ...d4HuntCore } = d4Hunt;
  if (d4Hunt.huntId !== "BL060_D4_14V14_HUNT_v1" || d4Hunt.status !== "planning_evidence") fail("D4 hunt artifact header drift");
  if (sha256(canonicalText(d4HuntCore)) !== d4HuntFingerprint) fail("D4 hunt fingerprint self-check failed");
  const { derivationFingerprint: bl070Fingerprint, ...bl070Core } = bl070;
  if (bl070.derivationId !== "BL070_D7_DERIVATION_V1" || bl070.status !== "planning_evidence") fail("BL-070 artifact header drift");
  if (sha256(canonicalText(bl070Core)) !== bl070Fingerprint) fail("BL-070 fingerprint self-check failed");
  const { derivationFingerprint: bl068Fingerprint, ...bl068Core } = bl068;
  if (bl068.investigationId !== "BL068_D7_ASYMMETRY_V1" || bl068.status !== "planning_evidence") fail("BL-068 artifact header drift");
  if (sha256(canonicalText(bl068Core)) !== bl068Fingerprint) fail("BL-068 fingerprint self-check failed");
  const { probeFingerprint: phaseAFingerprint, ...phaseACore } = phaseA;
  if (phaseA.probeId !== "BL031_PHASE_A_PROBE_v1" || phaseA.status !== "planning_evidence") fail("Phase A probe header drift");
  if (sha256(canonicalText(phaseACore)) !== phaseAFingerprint) fail("Phase A probe fingerprint self-check failed");
  if (gate3.status !== "execution_verified" || gate3.passFail !== true) fail("Gate 3 receipt status drift");

  // ---- census core (masks-only region) ------------------------------------
  const masksByState = new Map(ledgerRows.map((row) => [String(row.id), maskOfRow(row)]));
  const pitchesByState = new Map(ledgerRows.map((row) => [String(row.id), parsePitchSet(row.pitchSet)]));
  const members = partitionMembers(ledgerRows);

  const d7Census = censusInstances(d7DomainInstances(members, masksByState), masksByState, pitchesByState);
  if (d7Census.instanceCount !== 36 || d7Census.displacement6Count !== 12 || d7Census.rotation6Count !== 0) {
    fail("D7-36 census drift");
  }
  const d6Census = censusInstances(tierCrossPairs(members.d6Anchors, members.d6Satellites), masksByState, pitchesByState);
  if (d6Census.instanceCount !== 98 || d6Census.hamming2Count !== 12 || d6Census.displacement6Count !== 0 || d6Census.rotation6Count !== 0) {
    fail("D6-tier census drift");
  }
  const a0Census = censusInstances(ringEdges(members.a0Anchors, masksByState), masksByState, pitchesByState);
  if (a0Census.instanceCount !== 7 || a0Census.hamming2Count !== 6 || a0Census.displacement6Count !== 0 || a0Census.rotation6Count !== 1) {
    fail("A0 ring census drift");
  }
  if (canonicalText(a0Census.rotation6Witnesses) !== canonicalText(["1387:2773"])) fail("A0 ring closure witness drift");
  const u5Census = censusPairs(members.dAnchors, masksByState, pitchesByState);
  if (u5Census.pairSpaceCount !== 1176 || u5Census.hamming2Count !== 69 || u5Census.displacement6Count !== 15 || u5Census.rotation6Count !== 12) {
    fail("D-tier anchor census drift");
  }
  const b1Census = ledgerReachPairs(ledgerRows, masksByState, pitchesByState);
  if (b1Census.pairSpaceCount !== 106491 || b1Census.hamming2Count !== 6930 || b1Census.displacement6Count !== 630 ||
      b1Census.rotation6Count !== 126 || b1Census.hamming2AndRotation6Count !== 30) {
    fail("B1 structural-reach census drift");
  }

  // A0 ring closure structural detail (both boundary cycles close at rotation 6)
  const a0RingDetail = a0Census.memberStates.length === 7 ? { nodeCount: 7 } : null;
  if (!a0RingDetail) fail("A0 ring member census drift");

  // ---- recorded status and the D4 domain (label fields read here only) ----
  const officeByState = new Map(ledgerRows.map((row) => [String(row.id), row.office]));
  const forteByState = new Map(ledgerRows.map((row) => [String(row.id), row.forte]));
  const a1ByOffice = new Map(network.governorRows.map((row) => [Number(row["Office order"]) - 1, String(row["A1 ID"])]));
  if (a1ByOffice.size !== 7) fail("governor-row office census drift");

  const d4Instances = d4Hunt.domain.uKeys.map((key) => {
    const [officeIndex, satellite] = key.split(":");
    const anchor = a1ByOffice.get(Number(officeIndex));
    if (!anchor) fail(`D4 domain key without office mapping: ${key}`);
    return { key: `${anchor}:${satellite}`, a: anchor, b: satellite };
  });
  const a1Census = censusInstances(d4Instances, masksByState, pitchesByState);
  if (a1Census.instanceCount !== 28 || a1Census.hamming2Count !== 24 || a1Census.displacement6Count !== 0 || a1Census.rotation6Count !== 0) {
    fail("A1-28 (D4 domain) census drift");
  }

  // ---- near-miss re-verification (masks + recorded status + landed bytes) --
  const d7FactByKey = new Map();
  for (const instance of d7DomainInstances(members, masksByState)) {
    const [anchor, satellite] = [instance.a, instance.b];
    const displacement = hamming12(masksByState.get(anchor), masksByState.get(satellite)) === 2
      ? singlePitchDisplacement(pitchesByState.get(anchor), pitchesByState.get(satellite))
      : null;
    d7FactByKey.set(instance.key, {
      key: instance.key,
      anchor,
      satellite,
      dPcSum: Math.abs(pcSumOfMask(masksByState.get(anchor)) - pcSumOfMask(masksByState.get(satellite))),
      displacementLinear: displacement ? displacement.linear : null,
      recorded: officeByState.get(anchor) === officeByState.get(satellite),
    });
  }
  const nearMissSelected = [...d7FactByKey.values()].filter((fact) => fact.dPcSum === 1).map((fact) => fact.key);
  const nearMissMissed = [...d7FactByKey.values()].filter((fact) => fact.recorded && fact.dPcSum !== 1).map((fact) => fact.key);
  const recordedDisplacement6 = [...d7FactByKey.values()]
    .filter((fact) => fact.recorded && fact.displacementLinear !== null && Math.abs(fact.displacementLinear) === 6)
    .map((fact) => fact.key);
  const landedMissed = bl070.nearMiss.missedKeys.map((miss) => miss.key);
  const landedSelected = bl070.nearMiss.selectedKeys;
  if (canonicalText(nearMissMissed) !== canonicalText(landedMissed)) fail("near-miss misses disagree with the landed BL-070 bytes");
  if (canonicalText(nearMissSelected) !== canonicalText(landedSelected)) fail("near-miss selection disagrees with the landed BL-070 bytes");
  if (canonicalText(recordedDisplacement6) !== canonicalText(["127:253", "4033:2017"])) fail("recorded displacement-6 set drift");

  // ---- the D7 modal orbit (network record; re-read per edge) ---------------
  const modalSuccessor = new Map(network.d7ModalRows.map((row) => [String(row.source), String(row.target)]));
  const orbitEdges = [];
  let cursor = "127";
  for (let step = 0; step < 7; step += 1) {
    const next = modalSuccessor.get(cursor);
    if (!next) fail(`modal orbit dead-end at ${cursor}`);
    orbitEdges.push({ a: cursor, b: next });
    cursor = next;
  }
  if (cursor !== "127") fail("modal orbit does not close");
  const orbitPerEdge = orbitEdges.map((edge) => {
    const maskA = masksByState.get(edge.a);
    const maskB = masksByState.get(edge.b);
    const hamming = hamming12(maskA, maskB);
    const displacement = hamming === 2 ? singlePitchDisplacement(pitchesByState.get(edge.a), pitchesByState.get(edge.b)) : null;
    const rotations = [];
    for (let d = 1; d <= 11; d += 1) if (rotateMask12(maskA, d) === maskB) rotations.push(d);
    if (rotations.length !== 1) fail(`orbit edge is not an exact rotation at ${edge.a}->${edge.b}`);
    const landed = gate3.d7Analogue.cycleTwinVerification.perEdge.find((entry) => String(entry.a) === edge.a && String(entry.b) === edge.b);
    if (!landed || landed.rotateInterval !== rotations[0]) fail(`landed cycle-twin interval disagreement at ${edge.a}->${edge.b}`);
    return {
      a: edge.a,
      b: edge.b,
      hamming,
      displacementLinear: displacement ? displacement.linear : null,
      rotateInterval: rotations[0],
      landedRotateInterval: landed.rotateInterval,
      exact: true,
    };
  });
  if (canonicalText(orbitPerEdge.map((edge) => edge.rotateInterval)) !== canonicalText([11, 11, 11, 11, 11, 11, 6])) {
    fail("orbit rotation interval inventory drift");
  }
  if (canonicalText(orbitPerEdge.map((edge) => edge.hamming)) !== canonicalText([2, 2, 2, 2, 2, 2, 10])) {
    fail("orbit hamming inventory drift");
  }

  // ---- 7-27 / 7-31 families (class label read here only) -------------------
  const family727 = ledgerRows.filter((row) => row.forte === "7-27").map((row) => String(row.id)).sort(cmpNumericStrings);
  const family731 = ledgerRows.filter((row) => row.forte === "7-31").map((row) => String(row.id)).sort(cmpNumericStrings);
  if (family727.length !== 14 || family731.length !== 14) fail("7-27/7-31 family census drift");
  const crossHistogram = {};
  let crossHamming2 = 0;
  let crossRotation6 = 0;
  let crossComplement = 0;
  for (const a of family727) {
    for (const b of family731) {
      const hamming = hamming12(masksByState.get(a), masksByState.get(b));
      crossHistogram[String(hamming)] = (crossHistogram[String(hamming)] ?? 0) + 1;
      if (hamming === 2) crossHamming2 += 1;
      if (rotateMask12(masksByState.get(a), 6) === masksByState.get(b)) crossRotation6 += 1;
      if (((~masksByState.get(a)) & 4095) === masksByState.get(b)) crossComplement += 1;
    }
  }
  if (canonicalText(crossHistogram) !== canonicalText({ "4": 60, "6": 112, "8": 24 }) || crossHamming2 !== 0 || crossRotation6 !== 0 || crossComplement !== 0) {
    fail("7-27/7-31 cross-geometry drift");
  }
  const ic6ByFamily = {
    "7-27": sortedUnique(family727.map((state) => String(icVectorOfMask(masksByState.get(state))[5]))),
    "7-31": sortedUnique(family731.map((state) => String(icVectorOfMask(masksByState.get(state))[5]))),
  };
  if (canonicalText(ic6ByFamily) !== canonicalText({ "7-27": ["1"], "7-31": ["3"] })) fail("family IC6 content drift");

  // ---- lifted-space representation (mesh roots + phase-A machinery) --------
  const meshRootByMask = new Map(Object.values(mesh.heptatonicNodes).map((node) => [String(node.pitchMask), node.root]));
  const rot6Pairs = [];
  for (const a of ledgerRows.map((row) => String(row.id)).sort(cmpNumericStrings)) {
    const partner = rotateMask12(masksByState.get(a), 6);
    if (String(partner) > a && masksByState.has(String(partner))) rot6Pairs.push({ a, b: String(partner) });
  }
  if (rot6Pairs.length !== 126) fail("ledger rotation-6 pair census drift");
  const rootMismatches = rot6Pairs.filter((pair) => !rootShiftsBySix(masksByState.get(pair.a), masksByState.get(pair.b), meshRootByMask));
  if (rootMismatches.length !== 0) fail("rotation-6 root coherence drift");
  const endpointPair = { a: "1387", b: "2773" };
  if (rotateMask12(masksByState.get(endpointPair.a), 6) !== masksByState.get(endpointPair.b)) fail("A0 endpoint tritone relation drift");
  if (!rootShiftsBySix(masksByState.get(endpointPair.a), masksByState.get(endpointPair.b), meshRootByMask)) fail("A0 endpoint root coherence drift");
  const d7ClosurePair = { a: "4033", b: "127" };
  if (rotateMask12(masksByState.get(d7ClosurePair.a), 6) !== masksByState.get(d7ClosurePair.b)) fail("D7 closure tritone relation drift");
  if (!rootShiftsBySix(masksByState.get(d7ClosurePair.a), masksByState.get(d7ClosurePair.b), meshRootByMask)) fail("D7 closure root coherence drift");

  // ---- boundary IC6 aggregate (labels read in comparison only) -------------
  const boundaryStates = sortedUnique([
    ...members.d7Anchors, ...members.d6Satellites, ...members.d6Anchors,
    ...members.a0Anchors, ...members.a1Anchors, ...members.a1Satellites,
  ]);
  if (boundaryStates.length !== 70) fail(`boundary state census drift: ${boundaryStates.length}`);
  const boundaryIc6 = ic6HistogramOf(boundaryStates, masksByState);
  const allIc6 = ic6HistogramOf(ledgerRows.map((row) => String(row.id)), masksByState);
  if (canonicalText(boundaryIc6) !== canonicalText({ "1": 42, "2": 14, "3": 14 })) fail("boundary IC6 histogram drift");
  if (canonicalText(allIc6) !== canonicalText({ "1": 112, "2": 280, "3": 70 })) fail("ledger IC6 histogram drift");
  const boundaryHigh = boundaryStates.filter((state) => icVectorOfMask(masksByState.get(state))[5] >= 2).length;
  const boundaryLow = boundaryStates.length - boundaryHigh;
  const nonBoundaryStates = ledgerRows.map((row) => String(row.id)).filter((state) => !boundaryStates.includes(state));
  const nonBoundaryHigh = nonBoundaryStates.filter((state) => icVectorOfMask(masksByState.get(state))[5] >= 2).length;
  const nonBoundaryLow = nonBoundaryStates.length - nonBoundaryHigh;
  if (boundaryHigh !== 28 || nonBoundaryHigh !== 322 || nonBoundaryStates.length !== 392) fail("IC6 incidence census drift");

  // ---- Fisher tests (pre-registered tables) --------------------------------
  const tests = [
    fisherTest(
      "TEST-1",
      "displacement-six over-representation of the D7-36 domain against the structural reach (B1)",
      { a: 12, b: 24, c: 630, d: 6300 },
      "the ti-pole's contact domain concentrates tritone displacement far beyond what the Hamming-2 reach gives for free",
    ),
    fisherTest(
      "TEST-2",
      "displacement-six over-representation of the D7-36 domain against the D4/fa-pole domain (B2)",
      { a: 12, b: 24, c: 0, d: 28 },
      "the tritone-displacement signature is ti-pole-specific: the fa-pole domain carries zero displacement-six instances",
    ),
    fisherTest(
      "TEST-2b",
      "displacement-six robustness variant (single-swap denominators: D7 36, D4 24)",
      { a: 12, b: 24, c: 0, d: 24 },
      "the same verdict on the single-swap denominator",
    ),
    fisherTest(
      "TEST-3",
      "rotation-six over-representation of the D-tier anchor space against the full ledger pair space",
      { a: 12, b: 1164, c: 126, d: 106365 },
      "rotation-six is an anchor-family-level relation (all seven D tiers carry at least one rotation-six pair)",
    ),
    fisherTest(
      "TEST-4",
      "IC6-content incidence: non-boundary states at IC6 >= 2 against boundary states",
      { a: 322, b: 70, c: 28, d: 42 },
      "the boundary layer is IC6-poor: no compositional tritone over-representation exists",
    ),
  ];

  // ---- triangulation block -------------------------------------------------
  const triangulation = {
    statement: "two landed findings re-verified from their bytes + one labelled framing excluded from the verdict (OD-71-2): the triangulation is 'two landed + one framed'",
    t1: {
      id: "T-1",
      finding: "the modal orbit's closure offset",
      landedSource: "orrery/src/generated/bl070-d7-derivation.v1.json orbitalRotation (exactRotationCount 7; intervalHistogram 11 x6, 6 x1) + qa/d4-r2-execution-receipt.json d7Analogue.cycleTwinVerification (rotateInterval 6 at the closure)",
      interval6Role: "the D7 modal orbit's closure step 4033->127 is an exact rotation at interval 6 (the closure interval absorbs the root-normalization offset); the other six edges are rotateMaskZ12^11",
      reVerified: true,
      perEdge: orbitPerEdge,
      parallelFinding: "the A0 P7 ring closes at rotation 6 as well: the edge 2773->1387 is an exact rotation-6 relation at Hamming 10, while the six path edges are +1 single-semitone swaps at Hamming 2; both boundary seven-cycles close at interval 6 (census finding of this artifact, universe A0-P7)",
      parallelSource: "census.universes[A0-P7] (mask computation; the ring order is not read)",
    },
    t2: {
      id: "T-2",
      finding: "the near-miss misses",
      landedSource: "orrery/src/generated/bl070-d7-derivation.v1.json nearMiss (confusion 12/0/2/22; missedKeys 127:253 and 4033:2017, both displacementLinear 6)",
      interval6Role: "the two missed contacts are exactly the recorded D7-domain instances at single-pitch tritone displacement (+6); both are reach-singletons",
      reVerified: true,
      selectedKeys: nearMissSelected,
      missedKeys: nearMissMissed,
      recordedDisplacement6,
      crossCheck: "the masks-only recount reproduces the landed BL-070 near-miss selection and misses key-for-key",
    },
    t3: {
      id: "T-3",
      finding: "the fa/ti tritone pair (framing)",
      landedSource: "scrum/plan/harmonic-comprehension-map.md:122-124 (the fa/ti poles are labelled [HYPOTHESIS]; the terminology is novel to the map, with zero framework hits)",
      interval6Role: "framing only: the map's poles-as-brackets hypothesis; no landed measurement pins the poles' interval relationship",
      reVerified: false,
      status: "HYPOTHESIS_FRAMING",
      excludedFromVerdict: true,
      ruling: "OD-71-2 (approved): carried as labelled framing, excluded from the triangulation verdict; the triangulation is stated as two landed findings plus one framed hypothesis",
    },
  };

  // ---- census block --------------------------------------------------------
  const universes = [
    {
      id: "D7-36",
      tier: "masks-only (tier/role partition + masks)",
      definition: "the D7 contact domain: every (D7 anchor, D6 satellite) instance at Hamming 2 (the BL-070 domain)",
      ...d7Census,
      ic6Content: ic6HistogramOf(d7Census.memberStates, masksByState),
    },
    {
      id: "D6-tier",
      tier: "masks-only (tier/role partition + masks)",
      definition: "the D6 tier's cross space: every (D6 anchor, D6 satellite) ordered-as-unordered pair (7 x 14 = 98)",
      ...d6Census,
      ic6Content: ic6HistogramOf(d6Census.memberStates, masksByState),
    },
    {
      id: "A1-28",
      tier: "instance set canonical-read (the landed D4 grant layer); measures masks-only",
      definition: "the A1 (fa-pole) domain: the 28 landed (A1 anchor, satellite) instances of d4-14v14-hunt.v1.json domain.uKeys, anchor mapped from governorRows",
      ...a1Census,
      ic6Content: ic6HistogramOf(a1Census.memberStates, masksByState),
    },
    {
      id: "A0-P7",
      tier: "masks-only (tier/role partition + masks)",
      definition: "the A0 boundary cycle: the 7 edges that are Hamming-2 or rotation-6 relations among the 7 A0 anchors (6 path swaps + 1 rotation-6 closure)",
      ...a0Census,
      ic6Content: ic6HistogramOf(a0Census.memberStates, masksByState),
    },
    {
      id: "D-anchor-49",
      tier: "masks-only (tier/role partition + masks)",
      definition: "the D-tier anchor space: all unordered pairs of the 49 D-tier anchors (7 tiers x 7)",
      ...u5Census,
      ic6Content: ic6HistogramOf(u5Census.memberStates, masksByState),
    },
  ];

  const census = {
    measures: {
      "M-DISP": {
        id: "M-DISP",
        definition: "single-pitch displacement 6: the two membership sets differ by exactly one removed and one added pitch class, and (added - removed) mod 12 = 6; only defined for Hamming-2 (single-swap) pairs",
        distinctFrom: "not a mask rotation and not a set-content statistic: two nodes can be at displacement 6 without being rotations of each other",
      },
      "M-ROT": {
        id: "M-ROT",
        definition: "mask rotation 6: rotateMaskZ12^6(a) = b (an exact transposition of the whole set by a tritone); defined on any pair",
        distinctFrom: "not a displacement (rotation preserves internal intervals; displacement is pitch-sum based) and not a content statistic",
      },
      "M-IC6": {
        id: "M-IC6",
        definition: "interval-class-6 content: the number of tritone intervals inside a single state (icVector[5]); a per-state vector property, not a pairwise distance",
        distinctFrom: "not a relation between two nodes at all: it measures how many tritones a set contains",
      },
    },
    discipline: "the three measures are different operations and can disagree; the artifact reports them side by side, never merged (approved planning pass, precision addition 1)",
    universes,
    boundaryAggregate: {
      definition: "the union of the five universes' member states (7 D7 anchors + 14 D6 satellites + 7 D6 anchors + 7 A0 anchors + 7 A1 anchors + 28 A1 satellites)",
      stateCount: boundaryStates.length,
      ic6Content: boundaryIc6,
      ledgerComparison: allIc6,
      statement: "every 462-ledger state carries IC6 >= 1; the boundary's 70 states are IC6-poor relative to the ledger (42 of 70 at IC6 = 1 versus 112 of 462 ledger-wide)",
    },
  };

  // ---- baseline block (pre-registered slots; byte-computed values) ---------
  const baseline = {
    b1: {
      id: "B1-structural-reach",
      definition: "all 462-ledger unordered pairs at Hamming 2 (the structural reach from which the D7 domain is drawn); displacement over single-swap pairs; rotation-6 over the same reach pairs and over the full pair space",
      ...b1Census,
      rotation6Verdict: "the rotation-6 measure over the full pair space is the comparator for TEST-3",
    },
    b2: {
      id: "B2-D4-domain",
      definition: "the D4 (fa-pole) grant-layer domain: the 28 landed (A1 anchor, satellite) instances (d4-14v14-hunt.v1.json domain.uKeys); measures masks-only; identical to universe A1-28",
      instanceCount: a1Census.instanceCount,
      hamming2Count: a1Census.hamming2Count,
      nonSwapCount: a1Census.nonSwapCount,
      displacementHistogram: a1Census.displacementHistogram,
      displacement6Count: a1Census.displacement6Count,
      rotation6Count: a1Census.rotation6Count,
      groundingCorrection: "maintainer-prose class: the approved planning pass pre-registered the B2 control as 'the D4 domain (28 instances) contains 2 instances at displacement 6 (the terminal far contacts); D4-side rate 2/28'. The build's grounding recount from the bytes yields 0 displacement-6 instances in the D4 domain (0/28; 24 single-swap, 4 at Hamming 8); the two tritone-displaced instances cited are D7-domain facts (127:253 and 4033:2017, 2 of the 14 recorded D7 contacts; 12 of the 36 D7-domain instances overall). The baseline SLOT (D4 domain, displacement-six rate) and the Fisher tables are exactly as pre-registered and are unchanged; only the prose value is corrected against the bytes. No post-hoc baseline adjustment: the definitions and tables were fixed in the planning pass before any count was taken.",
    },
    tests,
    noPostHocAdjustment: "the baseline definitions and the test tables were fixed by OD-71-3 and the approved planning pass; the comparison block computes and reports them once; any change of definition after the counts is a halt (none occurred)",
  };

  // ---- 7-27 / 7-31 split block ---------------------------------------------
  const splitSevenTwentySeven = {
    families: { "7-27": family727, "7-31": family731 },
    familySizes: { "7-27": 14, "7-31": 14 },
    intervalVectors: { "7-27": "<344451>", "7-31": "<336333>" },
    ic6ContentByFamily: ic6ByFamily,
    crossPairCount: 196,
    crossHammingHistogram: crossHistogram,
    crossHamming2Count: crossHamming2,
    crossRotation6Count: crossRotation6,
    crossComplementCount: crossComplement,
    containmentRelationship: "none measured in this artifact: the families' containment (bridge/cornerstone) profile is the landed GSL-1R channel's content (BL-060/061/062) and is cited, not recomputed",
    characterization: "SPLIT_NOT_TRITONE_STRUCTURED - the observed/unobserved families carry no direct tritone relation: no cross pair is a single-pitch swap, a rotation-6 partner, or a complement (0/196 each); the pair distance histogram is maximally separated (minimum Hamming 4). The split follows set-class identity; the tritone enters only as the classes' IC6 content contrast (7-27 carries 1 tritone per state, 7-31 carries 3), a composition difference, not a relation between the families",
  };

  // ---- lifted-space block --------------------------------------------------
  const liftedSpace = {
    status: "COMPUTABLE_EXACT_ROOTED_CONGRUENCE",
    landedMachinery: "orrery/src/generated/phase-a-probe.v1.json (lifted node identity {anchoredId}@{phase}; 5,544 lifted heptatonic nodes; 9,504 total) + derived/hypergraph/bipartite-inclusion-v1.json (per-record root)",
    endpointPair: {
      a: "1387",
      b: "2773",
      aId: "7-35:1",
      bId: "7-35:7",
      maskRelation: "rotateMaskZ12^6(1387) = 2773",
      rootRelation: "root(2773) = (root(1387) + 6) mod 12 (1 -> 7)",
      congruence: "for every phase p: lifted(2773@((p+6) mod 12)) = T_6(lifted(1387@p)) - the pcs and the root both shift by the tritone; the fa/ti endpoints' relation is exactly phase-shift-6-stable in the lifted space (it does not dissolve at any phase)",
    },
    universalCheck: {
      statement: "the congruence is not endpoint-specific: every ledger rotation-6 pair is root-coherent",
      rotation6Pairs: rot6Pairs.length,
      rootCoherent: rot6Pairs.length - rootMismatches.length,
      mismatches: rootMismatches.map((pair) => `${pair.a}:${pair.b}`),
    },
    d7ClosurePair: {
      a: "4033",
      b: "127",
      maskRelation: "rotateMaskZ12^6(4033) = 127",
      rootRelation: "root(127) = (root(4033) + 6) mod 12 (6 -> 0)",
      congruence: "the D7 modal closure admits the same phase-shift-6 lifted congruence",
    },
    note: "the lifted representation is a relation between lifted nodes, not a claim that T_6 is an admitted operator edge of the phase-extended topology (operator admissibility is not measured here)",
  };

  // ---- role verdict block (closed vocabulary; no mechanism claim) ----------
  const roleVerdict = {
    vocabulary: ROLE_VOCABULARY,
    perMeasure: {
      "M-DISP": {
        role: "separation",
        assessment: "ti-local concentration, not boundary-wide and not exclusion: 12 of 36 D7-domain instances sit at single-pitch tritone displacement (1/3 versus the 630/6930 structural baseline; TEST-2 against the fa-pole: 12/36 versus 0/28); the two recorded instances are exactly the terminal far contacts 127:253 and 4033:2017; the fully excluded displacement class is 4 (0 of 12 recorded), and the recorded contact set is |d| <= 1 plus the two tritone terminals",
      },
      "M-ROT": {
        role: "transition",
        assessment: "anchor-cycle scale: both boundary seven-cycles close at rotation 6 (the D7 modal orbit 4033->127 and the A0 P7 ring 2773->1387); every one of the seven D-tier anchor families carries at least one rotation-6 pair (12/1176 versus the 126/106491 ledger pair space); rotation-6 appears in no contact-domain relation (D7-36 0/36, D6 tier 0/98, A1 0/28)",
      },
      "M-IC6": {
        role: "none",
        assessment: "no over-representation: the boundary's member states are IC6-poor (28 of 70 states at IC6 >= 2 versus 322 of 392 non-boundary states); the tritone-content measure does not mark the boundary",
      },
    },
    verdict: "mixed",
    statement: "the tritone's role is measure-dependent (the disagreement of the three measures is itself the finding, per the approved planning pass): displacement-six is a ti-pole-local separation concentration (with the terminal far contacts as its recorded instances), rotation-six is the boundary cycles' closure/transition interval at the anchor scale, and IC6 content shows no boundary signature at all. No single role fits all three measures; the honest verdict is mixed, decomposed above. No mechanism claim (V-BL-071-4): why the tritone plays these roles stays open (BL-072's question family).",
  };

  // ---- GSL-4 candidate draft -----------------------------------------------
  const gsl = {
    id: "GSL-4",
    status: "CANDIDATE_UNPROMOTED",
    statement: "GSL-4 (candidate; BL-071, the interval-6 characterization): the tritone's role in the boundary geography is measure-dependent. (a) Displacement six is a ti-pole-local concentration - 12 of the 36 D7 contact-domain instances sit at single-pitch tritone displacement (1/3 against the 630/6930 structural baseline; the fa-pole domain carries none, 0/28), the two recorded instances being exactly the terminal far contacts 127:253 and 4033:2017, while the fully excluded class is displacement four (0 of 12 recorded). (b) Rotation six is the boundary cycles' closure interval - both seven-cycles (the D7 modal orbit and the A0 P7 ring) close at rotation six, and all seven D-tier anchor families carry at least one rotation-six pair (12/1176 against the ledger's 126/106491). (c) IC6 content shows no boundary over-representation (the boundary is IC6-poor). The three measures disagree, and the disagreement is the characterization.",
    rulingNote: "OD-71-5 (approved): drafted as the GSL-4 candidate (a new interval-geometric finding class, continuing the GSL series); admission to the governs semantic layer is a separate ruling; no governs admission occurs here",
  };

  // ---- gates ---------------------------------------------------------------
  const gates = {
    "V-BL-071-1": {
      result: "PASS",
      statement: "census integrity: all five universes' counts, histograms and witness lists are byte-reproducible from the landed sources (ledger masks and pitch sets, tier/role partition, the landed D4 domain keys, the mesh roots); the validator re-derives every number independently",
    },
    "V-BL-071-2": {
      result: "PASS",
      statement: "citation: T-1 and T-2 are cited from the landed BL-070 artifact and the Gate 3 receipt with their interval-6 roles stated and re-verified key-for-key; T-3 is carried as labelled framing and excluded from the verdict exactly as OD-71-2 rules (two landed + one framed)",
    },
    "V-BL-071-3": {
      result: "PASS",
      statement: "baseline honesty: B1 (structural reach) and B2 (D4 domain) and the Fisher tables were pre-registered before the comparison ran; the values are byte-computed; the approved B2 prose value is corrected against the bytes (0/28, not 2/28) as a maintainer-prose grounding correction with the baseline slot and test tables unchanged; no post-hoc adjustment occurred",
    },
    "V-BL-071-4": {
      result: "PASS",
      statement: "no mechanism claim: the characterization records the tritone's role per measure and the mixed verdict; no causal or mechanism sentence appears in the role or GSL blocks; the mechanism question stays open (BL-072)",
    },
  };

  // ---- accounting ----------------------------------------------------------
  const accounting = {
    masksOnly: [
      "all five universes' node sets are derived from the tier/role partition + masks (D7-36, D6-tier, A0-P7 ring, D-anchor-49) or supplied by a canonical-read instance list (A1-28); every measure is masks-only",
      "the three measure classes (displacement 6, rotation 6, IC6 content), their histograms, and the witness lists",
      "the B1 structural reach (all Hamming-2 ledger pairs) and its rotation-6 census",
      "the 7-27/7-31 cross-pair geometry (Hamming histogram, rotation-6, complement)",
      "the lifted-space root coherence (masks + mesh roots)",
      "the Fisher-exact tables (pure arithmetic)",
    ],
    canonicalComputation: [
      "the A1-28 instance list: the landed d4-14v14-hunt.v1.json domain keys + the governor-row office-to-anchor mapping (canonical-read, labelled)",
      "the recorded/unrecorded status labels (the label fields, evaluation only, the near-miss cross-check target)",
      "the class labels in the 7-27/7-31 block (canonical-read, labelled)",
      "the D7 modal orbit order (the network's recorded modal edges; labelled) and the Gate 3 per-edge bytes",
      "the chain fingerprints (BL-070, BL-068, D4 hunt, Phase A probe; self-checked)",
    ],
    remainingGranted: [
      "the tier/role partition membership itself (the ledger's marking), as in BL-070",
      "the A0 ring's presented order (the census derives the ring as the union of the Hamming-2 and rotation-6 relations; the canonical traversal order is presentation only)",
      "the office and class labels as comparison targets, never inputs to the measures",
    ],
    statement: "the census is discharged masks-only; the comparison layer reads labels only as targets; the baseline correction is prose-class and changes no computed quantity",
  };

  // ---- fences and bounded non-accomplishments ------------------------------
  const fences = {
    d7HypothesisTier: "D7 remains hypothesis-tier throughout: no D7 claim event, no D7 record amendment, no D7 derivation admission; ENTRY 15's D7 clause carries forward verbatim (provenance/DECISION_LEDGER.md:2703-2712)",
    noMechanismClaim: "the characterization measures the tritone's role; it makes no mechanism claim (V-BL-071-4); the why question stays open",
    governsAdmission: "none; the GSL-4 entry is a candidate draft, un-promoted (OD-71-5)",
    directionalSemantics: "no directional-semantics assignment; the directional-semantics gate remains open",
    g1Intra330: "untouched",
    inv5: "no INV-5 graduation",
    mWalkability: "no M-walkability promotion",
    canonical: "no canonical/Court/schema/Neo4j writes; all sources read-only",
    d4Record: "no movement: ENTRY 10 immutable, ENTRY 15 unchanged",
    membrane: "the frame (scrum/plan/harmonic-comprehension-map.md sections 2.6/2.7) is interpretation vocabulary only; never a probe input, design input, or admitted canon claim",
    sessionProse: "context, not evidence",
  };

  const contractCitations = [
    "orrery/src/generated/bl070-d7-derivation.v1.json (nearMiss 12/0/2/22 with missedKeys 127:253/4033:2017; orbitalRotation perEdge rotateInterval 11x6 + 6x1; fingerprint self-checked)",
    "qa/d4-r2-execution-receipt.json (d7Analogue.cycleTwinVerification perEdge rotateInterval bytes; status execution_verified)",
    "scrum/plan/bl-070-d7-derivation-memo.md:59-71 (the near-miss anatomy and the orbital-rotation refinement)",
    "scrum/plan/bl-057-gate3-execution-memo.md:103-117 (the D7 analogue measurements)",
    "orrery/src/generated/d4-14v14-hunt.v1.json domain.uKeys (the landed D4 grant layer; fingerprint self-checked)",
    "orrery/src/generated/bl068-d7-asymmetry.v1.json (the D7 domain and invariant geography; fingerprint self-checked)",
    "orrery/src/generated/phase-a-probe.v1.json (the lift architecture: node identity, 5,544 heptatonic lifted nodes, 9,504 total; fingerprint self-checked)",
    "derived/hypergraph/bipartite-inclusion-v1.json (per-record roots used by the lifted congruence)",
    "scrum/plan/harmonic-comprehension-map.md:122-124, 559-638 (the fa/ti [HYPOTHESIS] tag; the measured-findings section 5 receipts)",
    "scrum/plan/bl-067-governs-semantic-synthesis.md:102-150 (the fa/ti asymmetry, section 4; the GSL series)",
    "scrum/plan/bl-059-governs-derivability-scoping-memo.md:126-132 (the poles fail differently - the asymmetry evidence base)",
    "scrum/plan/bl-029-d-tier-operator-probe-memo.md:66-70 (the modal orbit: governor successor +2 mod 7)",
    "scrum/BACKLOG.md:1115-1125 (the BL-071 capture: the interval-6 structure)",
  ];

  const notAccomplished = [
    "no mechanism claim: the characterization measures the tritone's role (separation/transition/none per measure; mixed overall); why the tritone plays that role stays open (BL-072)",
    "no claim event; no record amendment; no D7 claim or amendment (hypothesis-tier preserved)",
    "no governs admission: GSL-4 is a candidate draft, un-promoted",
    "no directional-semantics assignment; the gate remains open",
    "no G1 movement; no INV-5 graduation; no M-walkability promotion",
    "no canonical/Court/schema/Neo4j writes; no ledger writes",
    "no lens application as evidence; the frame is vocabulary, not input; session prose is context, not evidence",
  ];

  // ---- assembly ------------------------------------------------------------
  const core = {
    schemaVersion: SCHEMA_VERSION,
    investigationId: INVESTIGATION_ID,
    status: "planning_evidence",
    generator: "scripts/build-bl071-interval-6-structure.mjs",
    role: "the interval-6 characterization: the tritone as the boundary layer's candidate geometric signature, measured across five universes and three distinct measures, with pre-registered baselines; planning evidence",
    preRegistration: {
      rulings: [
        { id: "OD-71-1", ruling: "full census scope: the five universes D7-36, D6-tier, A1-28, A0-P7, D-anchor-49; the signature claim needs the boundary-wide denominator" },
        { id: "OD-71-2", ruling: "T-3 (the fa/ti tritone pair) carried as labelled framing, excluded from the verdict; the triangulation is stated as two landed + one framed" },
        { id: "OD-71-3", ruling: "baseline lock: B1 primary + B2 control, Fisher-exact, pre-registered before the comparison; no post-hoc adjustment" },
        { id: "OD-71-4", ruling: "lifted-space depth: attempt bounded (success or NOT_COMPUTABLE)" },
        { id: "OD-71-5", ruling: "GSL shape: GSL-4 candidate (a new interval-geometric finding class)" },
        { id: "OD-71-6", ruling: "role vocabulary closed: separation, exclusion, transition, mixed, none" },
      ],
      censusMeasures: [
        "M-DISP: single-pitch displacement 6",
        "M-ROT: mask rotation 6",
        "M-IC6: interval-class-6 content (per-state; not a pair distance)",
      ],
      measureDiscipline: "the three measures are different operations and can disagree; they are reported side by side, never merged (approved planning pass, precision addition 1)",
      universes: [
        "D7-36: the D7 contact domain instances",
        "D6-tier: the D6 anchor x satellite cross space (98 pairs)",
        "A1-28: the landed D4 grant-layer domain",
        "A0-P7: the A0 boundary ring edges (Hamming-2 union rotation-6)",
        "D-anchor-49: all unordered pairs of the 49 D-tier anchors",
      ],
      baselineLock: {
        b1: "B1-structural-reach: all 462-ledger unordered Hamming-2 pairs; displacement-6 rate; rotation-6 over the full pair space",
        b2: "B2-D4-domain: the 28-instance D4 grant layer; displacement-6 rate; the approved planning pass stated the value as 2/28 (with the terminal far contacts named); the byte recount corrects it to 0/28 (maintainer-prose class) with the slot and tables unchanged",
        fisher: {
          tests: [
            "TEST-1: D7-36 displacement-6 vs B1 Hamming-2 pairs (greater)",
            "TEST-2: D7-36 displacement-6 vs B2 D4 domain (greater)",
            "TEST-2b: robustness on single-swap denominators (greater)",
            "TEST-3: D-tier anchor rotation-6 vs the ledger full pair space (greater)",
            "TEST-4: non-boundary IC6 >= 2 incidence vs boundary (greater)",
          ],
          preRegistered: true,
        },
        roleVocabulary: ROLE_VOCABULARY,
        noPostHocAdjustment: "definitions and tables locked before the counts; a change after the counts is a halt",
      },
      buildNotes: [
        "T-1 parallel: the A0 P7 ring closes at rotation 6 (2773->1387), mirroring the D7 modal closure",
        "the recorded displacement-6 instances must equal the landed BL-070 missedKeys key-for-key",
        "the lifted congruence is verified against root coherence over all ledger rotation-6 pairs",
      ],
    },
    sourceBindings: [
      { artifact: LEDGER_PATH, sha256: fileSha(LEDGER_PATH), role: "462-record canonical universe: the tier/role partition, pitch sets, masks, label fields" },
      { artifact: NETWORK_PATH, sha256: fileSha(NETWORK_PATH), role: "the governor rows (office-to-anchor mapping) and the D7 modal records (orbit order)" },
      { artifact: MESH_PATH, sha256: fileSha(MESH_PATH), role: "per-record roots for the lifted-space congruence" },
      { artifact: D4_HUNT_PATH, sha256: fileSha(D4_HUNT_PATH), role: "the landed D4 grant-layer domain keys (fingerprint self-check)" },
      { artifact: BL070_PATH, sha256: fileSha(BL070_PATH), role: "chain anchor: the near-miss anatomy and the orbital-rotation refinement (fingerprint self-check)" },
      { artifact: BL068_PATH, sha256: fileSha(BL068_PATH), role: "chain anchor: the D7 availability domain and the invariant geography (fingerprint self-check)" },
      { artifact: GATE3_PATH, sha256: fileSha(GATE3_PATH), role: "the landed D7 analogue cycle-twin bytes (status execution_verified)" },
      { artifact: PHASE_A_PATH, sha256: fileSha(PHASE_A_PATH), role: "the lift architecture: node identity and lifted universe counts (fingerprint self-check)" },
    ],
    base: {
      bl070: { artifact: BL070_PATH, derivationFingerprint: bl070Fingerprint },
      bl068: { artifact: BL068_PATH, derivationFingerprint: bl068Fingerprint },
      d4Hunt: { artifact: D4_HUNT_PATH, huntFingerprint: d4HuntFingerprint },
      phaseA: { artifact: PHASE_A_PATH, probeFingerprint: phaseAFingerprint },
      importPolicy: "chain artifacts are consumed by fingerprint self-check (no literals in this generator); the landed cycle-twin intervals are matched interval-by-interval; the ledger and network carry the masks and records, never a verdict",
    },
    triangulation,
    census,
    baseline,
    splitSevenTwentySeven,
    liftedSpace,
    roleVerdict,
    gsl,
    gates,
    accounting,
    fences,
    contractCitations,
    notAccomplished,
  };
  const investigationFingerprint = sha256(canonicalText(core));
  return { ...core, investigationFingerprint };
}

export function serializeInvestigation(investigation) {
  return `${canonicalText(investigation)}\n`;
}

function main() {
  const check = process.argv.includes("--check");
  const investigation = buildInvestigation();
  const serialized = serializeInvestigation(investigation);
  const outputPath = path.join(root, OUTPUT_PATH);
  const summary = {
    output: OUTPUT_PATH,
    check,
    census: investigation.census.universes.map((universe) =>
      `${universe.id}: ${universe.instanceCount ?? universe.pairSpaceCount} pairs, h2 ${universe.hamming2Count}, disp6 ${universe.displacement6Count}, rot6 ${universe.rotation6Count}`).join(" | "),
    baseline: `B1 ${investigation.baseline.b1.displacement6Count}/${investigation.baseline.b1.hamming2Count}; B2 ${investigation.baseline.b2.displacement6Count}/${investigation.baseline.b2.instanceCount}`,
    tests: investigation.baseline.tests.map((test) => `${test.id} p=${test.pDecimal}`).join(" | "),
    role: investigation.roleVerdict.verdict,
    lifted: investigation.liftedSpace.status,
    investigationFingerprint: investigation.investigationFingerprint,
  };
  if (check) {
    const existing = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, "utf8") : null;
    if (existing !== serialized) throw new Error("STALE_BL071_INTERVAL_6_STRUCTURE");
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
