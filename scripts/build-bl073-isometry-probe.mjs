#!/usr/bin/env node
/**
 * Build the BL-073 isometry probe: are the boundary layer's two seven-cycles
 * (the D7 modal orbit 4033->127 and the A0 P7 ring 2773->1387) isometric
 * duals? Planning, read-only analysis.
 *
 * The probe (approved planning pass, rulings OD-73-1..OD-73-6, refinements
 * R1/N1/N2): four pre-registered preservation properties
 *   P1 adjacency/distance distribution  (the 21-pair Hamming histogram)
 *   P2 interval signature               (the directed rotation intervals along the landed orders)
 *   P3 Hamming-distance matrix          (per-node profiles under a bijection)
 *   P4 tritone marking                  (the per-node interval-class-6 content)
 * measured masks-only over the two cycles' listed witnesses; the bijection
 * search is primary dihedral (14) + secondary symmetric (5040), reported
 * separately; every passing witness is recorded with its parity; the branch
 * table FULL / PARTIAL / NO is pre-registered.
 *
 * Structure:
 *   cycles        - both cycles derived masks-only (the D7 ^11 path + the
 *                   unique ^6 return; the A0 Hamming-2 path from the lower
 *                   pcSum endpoint + the ^6 closure), their geometry (masks,
 *                   orders, edges, pcSum ladders, distance matrices)
 *   perProperty   - P1..P4 verdicts with their data and witnesses
 *   phiWitnesses  - the explicit bijections with dihedral names and parity
 *   searchSpaceResults - dihedral (14) and symmetric (5040), separately
 *   phaseRelation - secondary: closure-pair coherence; the lifted congruence
 *                   cited from BL-071; neither witness is rotation-induced
 *   branch        - the pre-registered verdict
 *   bindingGate   - measurement only: the GOVERNS reading is separately gated
 *   crossChecks   - the derived cycles matched key-for-key against the landed
 *                   records (the recorded modal rows, BL-070's orbital
 *                   rotation bytes, Gate 3's per-edge bytes, BL-071's A0-P7
 *                   universe)
 *
 * Fences: planning_evidence only. No claim event; no record amendment; no
 * GOVERNS admission; no G1 movement; no INV-5 graduation; no M-walkability
 * promotion; no canonical/Court/schema/Neo4j writes. D7 hypothesis-tier
 * throughout. The frame (scrum/plan/harmonic-comprehension-map.md sections
 * 2.6/2.7) is interpretation vocabulary, never design input. Session prose
 * is context, not evidence.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
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

export const SCHEMA_VERSION = "harmonic-orrery.bl073-isometry-probe.v1";
export const INVESTIGATION_ID = "BL073_ISOMETRY_PROBE_V1";
export const OUTPUT_PATH = "orrery/src/generated/bl073-isometry-probe.v1.json";
export const LEDGER_PATH = HEPTATONIC_LEDGER_PATH;
export const NETWORK_PATH = "canonical/universal-network-data.json";
export const BL071_PATH = "orrery/src/generated/bl071-interval-6-structure.v1.json";
export const BL070_PATH = "orrery/src/generated/bl070-d7-derivation.v1.json";
export const GATE3_PATH = "qa/d4-r2-execution-receipt.json";

export const D7_ORDER_EXPECTED = ["127", "2111", "3103", "3599", "3847", "3971", "4033"];
export const A0_ORDER_EXPECTED = ["1387", "1451", "1453", "1709", "1717", "2741", "2773"];
export const D7_INTERVALS_EXPECTED = [11, 11, 11, 11, 11, 11, 6];
export const A0_INTERVALS_EXPECTED = [7, 7, 7, 7, 7, 7, 6];
export const CLOSURE_HAMMING_EXPECTED = [2, 2, 2, 2, 2, 2, 10];
export const HAMMING_HISTOGRAM_EXPECTED = { "2": 6, "4": 5, "6": 4, "8": 3, "10": 3 };
export const D7_PC_SUM_LADDER = [21, 26, 31, 36, 41, 46, 51];
export const A0_PC_SUM_LADDER = [33, 34, 35, 36, 37, 38, 39];
export const D7_INTERVAL_VECTOR = [6, 5, 4, 3, 2, 1];
export const A0_INTERVAL_VECTOR = [2, 5, 4, 3, 6, 1];

// ==== CENSUS-CORE-BEGIN (tier/role partition + masks + cycle geometry only) ====
// This region derives both seven-cycles from the ledger's tier/role partition
// and masks alone, and computes every preservation property and both witness
// searches from masks and pitch sets. It never reads the label fields, the
// recorded-status fields, the network records, the landed artifacts, or any
// verdict. The recorded orders are cross-checked only outside this region.

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

export function partitionMembers(ledgerRows) {
  if (ledgerRows.length !== 462) fail(`heptatonic ledger census is ${ledgerRows.length}`);
  const members = (tier, role) => ledgerRows
    .filter((row) => row.tier === tier && (role === null || row.role === role))
    .map((row) => String(row.id))
    .sort(cmpNumericStrings);
  const d7Anchors = members("D7", "anchor");
  const a0Anchors = members("A0", "anchor");
  if (d7Anchors.length !== 7 || a0Anchors.length !== 7) {
    fail(`partition census drift: ${d7Anchors.length}/${a0Anchors.length}`);
  }
  return { d7Anchors, a0Anchors };
}

export function deriveD7Cycle(members, masksByState) {
  const nodes = members.d7Anchors;
  const successor = new Map();
  for (const a of nodes) {
    const target = rotateMask12(masksByState.get(a), 11);
    const hit = nodes.find((b) => masksByState.get(b) === target);
    if (hit) successor.set(a, hit);
  }
  if (successor.size !== 6) fail(`D7 ^11 path edge census drift: ${successor.size}`);
  const targets = new Set([...successor.values()]);
  const starts = nodes.filter((node) => !targets.has(node));
  if (starts.length !== 1) fail(`D7 ^11 path start census drift: ${starts.length}`);
  const order = [starts[0]];
  let cursor = starts[0];
  for (let step = 0; step < 6; step += 1) {
    const next = successor.get(cursor);
    if (!next) fail(`D7 ^11 path dead-end at ${cursor}`);
    order.push(next);
    cursor = next;
  }
  if (rotateMask12(masksByState.get(cursor), 6) !== masksByState.get(starts[0])) {
    fail("D7 closure is not the unique ^6 return to the path start");
  }
  return order;
}

export function deriveA0Ring(members, masksByState) {
  const nodes = members.a0Anchors;
  const adjacency = new Map(nodes.map((node) => [node, []]));
  for (let left = 0; left < nodes.length; left += 1) {
    for (let right = left + 1; right < nodes.length; right += 1) {
      if (hamming12(masksByState.get(nodes[left]), masksByState.get(nodes[right])) === 2) {
        adjacency.get(nodes[left]).push(nodes[right]);
        adjacency.get(nodes[right]).push(nodes[left]);
      }
    }
  }
  for (const node of nodes) {
    if (adjacency.get(node).length > 2) fail(`A0 two-pair graph is not a path at ${node}`);
  }
  const endpoints = nodes.filter((node) => adjacency.get(node).length === 1);
  if (endpoints.length !== 2) fail(`A0 path endpoint census drift: ${endpoints.length}`);
  const orderedEndpoints = endpoints.slice().sort(cmpNumericStrings);
  const start = pcSumOfMask(masksByState.get(orderedEndpoints[0])) <= pcSumOfMask(masksByState.get(orderedEndpoints[1]))
    ? orderedEndpoints[0]
    : orderedEndpoints[1];
  const order = [start];
  let previous = null;
  let cursor = start;
  for (let step = 0; step < 6; step += 1) {
    const next = adjacency.get(cursor).find((neighbor) => neighbor !== previous);
    if (!next) fail(`A0 two-pair path dead-end at ${cursor}`);
    order.push(next);
    previous = cursor;
    cursor = next;
  }
  if (rotateMask12(masksByState.get(cursor), 6) !== masksByState.get(start)) {
    fail("A0 closure is not the ^6 return to the path start");
  }
  return order;
}

export function directedEdges(order, masksByState) {
  const edges = [];
  for (let index = 0; index < order.length; index += 1) {
    const a = order[index];
    const b = order[(index + 1) % order.length];
    const maskA = masksByState.get(a);
    const maskB = masksByState.get(b);
    const hamming = hamming12(maskA, maskB);
    const intervals = [];
    for (let d = 1; d <= 11; d += 1) if (rotateMask12(maskA, d) === maskB) intervals.push(d);
    if (intervals.length !== 1) fail(`cycle edge is not an exact rotation at ${a}->${b}`);
    edges.push({ a, b, hamming, rotateInterval: intervals[0], closure: hamming !== 2 });
  }
  const closures = edges.filter((edge) => edge.closure);
  const path = edges.filter((edge) => !edge.closure);
  if (closures.length !== 1 || path.length !== 6) fail(`two-interval structure census drift: ${closures.length}/${path.length}`);
  if (new Set(path.map((edge) => edge.rotateInterval)).size !== 1) fail("path edges are not uniform-interval");
  return edges;
}

export function cycleGeometry(order, masksByState) {
  const matrix = order.map((a) => order.map((b) => hamming12(masksByState.get(a), masksByState.get(b))));
  const histogram = {};
  for (let left = 0; left < order.length; left += 1) {
    for (let right = left + 1; right < order.length; right += 1) {
      const hamming = matrix[left][right];
      histogram[String(hamming)] = (histogram[String(hamming)] ?? 0) + 1;
    }
  }
  const degreeSequence = order.map(() => 2);
  const tritoneSlotPerNode = order.map((state) => icVectorOfMask(masksByState.get(state))[5]);
  const intervalVectors = order.map((state) => icVectorOfMask(masksByState.get(state)));
  const pcSumLadder = order.map((state) => pcSumOfMask(masksByState.get(state)));
  return { matrix, histogram, degreeSequence, tritoneSlotPerNode, intervalVectors, pcSumLadder };
}

export function directedIntervalHistogram(edges) {
  const histogram = {};
  for (const edge of edges) {
    histogram[String(edge.rotateInterval)] = (histogram[String(edge.rotateInterval)] ?? 0) + 1;
  }
  return histogram;
}

export function dihedralElements() {
  const elements = [];
  for (let k = 0; k < 7; k += 1) {
    elements.push({ name: `r${k}`, kind: "rotation", k, perm: Array.from({ length: 7 }, (_, i) => (i + k) % 7) });
  }
  for (let k = 0; k < 7; k += 1) {
    elements.push({ name: `refl${k}`, kind: "reflection", k, perm: Array.from({ length: 7 }, (_, i) => ((k - i) % 7 + 7) % 7) });
  }
  return elements;
}

export function permutationsOfRange(size) {
  const result = [];
  const used = new Array(size).fill(false);
  const current = [];
  function recurse() {
    if (current.length === size) { result.push(current.slice()); return; }
    for (let value = 0; value < size; value += 1) {
      if (used[value]) continue;
      used[value] = true;
      current.push(value);
      recurse();
      current.pop();
      used[value] = false;
    }
  }
  recurse();
  return result;
}

export function inversionsOf(perm) {
  let count = 0;
  for (let left = 0; left < perm.length; left += 1) {
    for (let right = left + 1; right < perm.length; right += 1) {
      if (perm[left] > perm[right]) count += 1;
    }
  }
  return count;
}

export function distanceIsomorphic(matrixA, matrixB, perm) {
  for (let left = 0; left < perm.length; left += 1) {
    for (let right = left + 1; right < perm.length; right += 1) {
      if (matrixA[left][right] !== matrixB[perm[left]][perm[right]]) return false;
    }
  }
  return true;
}

export function intervalPreserving(orderA, edgesA, orderB, edgesB, perm, masksByState) {
  for (let index = 0; index < orderA.length; index += 1) {
    const next = (index + 1) % orderA.length;
    const interval = edgesA[index].rotateInterval;
    const targetA = masksByState.get(orderB[perm[index]]);
    const targetB = masksByState.get(orderB[perm[next]]);
    if (rotateMask12(targetA, interval) !== targetB) return false;
  }
  return true;
}

export function findSymmetricIsomorphisms(matrixA, matrixB) {
  return permutationsOfRange(matrixA.length).filter((perm) => distanceIsomorphic(matrixA, matrixB, perm));
}

export function findAutomorphisms(matrix) {
  return permutationsOfRange(matrix.length).filter((perm) => distanceIsomorphic(matrix, matrix, perm));
}

// ==== CENSUS-CORE-END ====

// ---- comparison and cross-check sections (the recorded orders, the landed
// ---- intervals, the chain artifacts and the verdicts are read here; never
// ---- in the census-core region) ---------------------------------------------

function edgeKey(edge) {
  return `${edge.a}:${edge.b}`;
}

function rotationsBetween(maskA, maskB) {
  const intervals = [];
  for (let d = 1; d <= 11; d += 1) if (rotateMask12(maskA, d) === maskB) intervals.push(d);
  return intervals;
}

function witnessClassification(kind, name) {
  if (kind === "rotation") {
    return `identical-reindexed witness (rotation element ${name}): the two cycles are the same structure under the aligned re-indexing; per the N2 fork this is the 'one structure re-indexed' reading`;
  }
  return `mirror witness (reflection element ${name}): the cycles are chiral duals under this map; it is the identity witness composed with the cycles' own reversal automorphism (each distance matrix has automorphism group {identity, reversal}), so per the N2 fork both readings coexist at the distance layer`;
}

export function buildInvestigation() {
  const ledgerRows = parseCsv(read(LEDGER_PATH));
  const network = readJson(NETWORK_PATH);
  const bl071 = readJson(BL071_PATH);
  const bl070 = readJson(BL070_PATH);
  const gate3 = readJson(GATE3_PATH);

  if (ledgerRows.length !== 462) fail(`heptatonic ledger census is ${ledgerRows.length}`);

  // ---- chain self-checks (fingerprints; no literals in this generator) ----
  const { investigationFingerprint: bl071Fingerprint, ...bl071Core } = bl071;
  if (bl071.investigationId !== "BL071_INTERVAL_6_STRUCTURE_V1" || bl071.status !== "planning_evidence") {
    fail("BL-071 artifact header drift");
  }
  if (sha256(canonicalText(bl071Core)) !== bl071Fingerprint) fail("BL-071 fingerprint self-check failed");
  const { derivationFingerprint: bl070Fingerprint, ...bl070Core } = bl070;
  if (bl070.derivationId !== "BL070_D7_DERIVATION_V1" || bl070.status !== "planning_evidence") {
    fail("BL-070 artifact header drift");
  }
  if (sha256(canonicalText(bl070Core)) !== bl070Fingerprint) fail("BL-070 fingerprint self-check failed");
  if (gate3.status !== "execution_verified" || gate3.passFail !== true) fail("Gate 3 receipt status drift");

  // ---- the masks-only core ------------------------------------------------
  const masksByState = new Map(ledgerRows.map((row) => [String(row.id), maskOfRow(row)]));
  const members = partitionMembers(ledgerRows);
  const d7Order = deriveD7Cycle(members, masksByState);
  const a0Order = deriveA0Ring(members, masksByState);
  if (canonicalText(d7Order) !== canonicalText(D7_ORDER_EXPECTED)) fail("D7 derived order drift");
  if (canonicalText(a0Order) !== canonicalText(A0_ORDER_EXPECTED)) fail("A0 derived order drift");

  const d7Edges = directedEdges(d7Order, masksByState);
  const a0Edges = directedEdges(a0Order, masksByState);
  if (canonicalText(d7Edges.map((edge) => edge.rotateInterval)) !== canonicalText(D7_INTERVALS_EXPECTED)) {
    fail("D7 directed interval inventory drift");
  }
  if (canonicalText(a0Edges.map((edge) => edge.rotateInterval)) !== canonicalText(A0_INTERVALS_EXPECTED)) {
    fail("A0 directed interval inventory drift");
  }
  if (canonicalText(d7Edges.map((edge) => edge.hamming)) !== canonicalText(CLOSURE_HAMMING_EXPECTED) ||
      canonicalText(a0Edges.map((edge) => edge.hamming)) !== canonicalText(CLOSURE_HAMMING_EXPECTED)) {
    fail("cycle hamming inventory drift");
  }

  const d7Geometry = cycleGeometry(d7Order, masksByState);
  const a0Geometry = cycleGeometry(a0Order, masksByState);
  if (canonicalText(d7Geometry.histogram) !== canonicalText(HAMMING_HISTOGRAM_EXPECTED) ||
      canonicalText(a0Geometry.histogram) !== canonicalText(HAMMING_HISTOGRAM_EXPECTED)) {
    fail("pairwise Hamming histogram drift");
  }
  if (canonicalText(d7Geometry.pcSumLadder) !== canonicalText(D7_PC_SUM_LADDER)) fail("D7 pcSum ladder drift");
  if (canonicalText(a0Geometry.pcSumLadder) !== canonicalText(A0_PC_SUM_LADDER)) fail("A0 pcSum ladder drift");
  if (canonicalText(d7Geometry.intervalVectors[0]) !== canonicalText(D7_INTERVAL_VECTOR)) fail("D7 interval vector drift");
  if (canonicalText(a0Geometry.intervalVectors[0]) !== canonicalText(A0_INTERVAL_VECTOR)) fail("A0 interval vector drift");
  if (d7Geometry.intervalVectors.some((vector) => canonicalText(vector) !== canonicalText(D7_INTERVAL_VECTOR)) ||
      a0Geometry.intervalVectors.some((vector) => canonicalText(vector) !== canonicalText(A0_INTERVAL_VECTOR))) {
    fail("interval vector constancy drift");
  }

  // ---- P1: adjacency / distance distribution (a multiset property) --------
  const p1Equal = canonicalText(d7Geometry.histogram) === canonicalText(a0Geometry.histogram);
  if (!p1Equal) fail("P1 multiset equality drift");

  // ---- P2: interval signature (primary strict) ----------------------------
  const dihedral = dihedralElements();
  const allPermutations = permutationsOfRange(7);
  if (dihedral.length !== 14 || allPermutations.length !== 5040) fail("search space census drift");
  const p2DihedralPass = dihedral.filter((element) =>
    intervalPreserving(d7Order, d7Edges, a0Order, a0Edges, element.perm, masksByState));
  const p2SymmetricPass = allPermutations.filter((perm) =>
    intervalPreserving(d7Order, d7Edges, a0Order, a0Edges, perm, masksByState));
  if (p2DihedralPass.length !== 0 || p2SymmetricPass.length !== 0) fail("P2 passing witness census drift");
  const p2Pass = false;

  // ---- P2 secondary: the two-interval structure ---------------------------
  const pathEdgesD7 = d7Edges.filter((edge) => !edge.closure);
  const closureEdgeD7 = d7Edges.find((edge) => edge.closure);
  const pathEdgesA0 = a0Edges.filter((edge) => !edge.closure);
  const closureEdgeA0 = a0Edges.find((edge) => edge.closure);

  // ---- P3: distance-matrix isomorphism ------------------------------------
  const p3DihedralPass = dihedral.filter((element) =>
    distanceIsomorphic(d7Geometry.matrix, a0Geometry.matrix, element.perm));
  const p3SymmetricPass = findSymmetricIsomorphisms(d7Geometry.matrix, a0Geometry.matrix);
  if (p3SymmetricPass.length !== 2 || p3DihedralPass.length !== 2) fail("P3 witness census drift");
  const p3Pass = true;
  const d7Automorphisms = findAutomorphisms(d7Geometry.matrix);
  const a0Automorphisms = findAutomorphisms(a0Geometry.matrix);
  if (d7Automorphisms.length !== 2 || a0Automorphisms.length !== 2) fail("distance-matrix automorphism census drift");

  const witnessName = (perm) => {
    const element = dihedral.find((candidate) => canonicalText(candidate.perm) === canonicalText(perm));
    if (!element) fail("passing witness outside the dihedral search space");
    return element;
  };
  const witnesses = p3SymmetricPass.map((perm, index) => {
    const element = witnessName(perm);
    return {
      id: `phi-${index + 1}`,
      dihedralElement: element.name,
      kind: element.kind,
      parity: inversionsOf(perm) % 2 === 0 ? "even" : "odd",
      inversions: inversionsOf(perm),
      map: d7Order.map((state, position) => ({ d7: state, a0: a0Order[perm[position]] })),
      classification: witnessClassification(element.kind, element.name),
    };
  });
  if (canonicalText(witnesses.map((witness) => witness.kind)) !== canonicalText(["rotation", "reflection"])) {
    fail("witness kind inventory drift");
  }

  // ---- P4: tritone marking ------------------------------------------------
  const p4Equal = canonicalText(d7Geometry.tritoneSlotPerNode) === canonicalText(a0Geometry.tritoneSlotPerNode);
  if (!p4Equal) fail("P4 tritone-marking equality drift");
  const p4Pass = true;

  // ---- combined preservation ----------------------------------------------
  const propertyResults = { P1: "PASS", P2: "FAIL", P3: "PASS", P4: "PASS" };
  const passingSubset = Object.keys(propertyResults).filter((id) => propertyResults[id] === "PASS");
  const failingSubset = Object.keys(propertyResults).filter((id) => propertyResults[id] === "FAIL");
  if (canonicalText(passingSubset) !== canonicalText(["P1", "P3", "P4"])) fail("passing subset drift");

  // ---- phase relation (secondary) -----------------------------------------
  const closurePairD7 = new Set(["4033", "127"]);
  const closurePairA0 = new Set(["2773", "1387"]);
  for (const witness of witnesses) {
    const image = new Set(witness.map.filter((entry) => closurePairD7.has(entry.d7)).map((entry) => entry.a0));
    if (canonicalText([...image].sort(cmp)) !== canonicalText([...closurePairA0].sort(cmp))) {
      fail(`witness ${witness.id} does not map the closure pair onto the closure pair`);
    }
  }
  const rotationInduction = witnesses.map((witness) => {
    const related = witness.map.filter((entry) =>
      rotationsBetween(masksByState.get(entry.d7), masksByState.get(entry.a0)).length > 0);
    if (related.length !== 0) fail(`witness ${witness.id} is rotation-induced`);
    return { witness: witness.id, rotationRelatedPairs: related.length, pairCount: 7 };
  });

  // ---- cross-checks against the landed records ----------------------------
  const modalSuccessor = new Map(network.d7ModalRows.map((row) => [String(row.source), String(row.target)]));
  const recordedOrder = [];
  let cursor = D7_ORDER_EXPECTED[0];
  for (let step = 0; step < 7; step += 1) {
    recordedOrder.push(cursor);
    const next = modalSuccessor.get(cursor);
    if (!next) fail(`recorded modal orbit dead-end at ${cursor}`);
    cursor = next;
  }
  if (cursor !== D7_ORDER_EXPECTED[0]) fail("recorded modal orbit does not close");
  if (canonicalText(recordedOrder) !== canonicalText(d7Order)) fail("recorded modal order disagrees with the derived order");

  const landedOrbit = bl070.orbitalRotation;
  if (landedOrbit.exactRotationCount !== 7) fail("BL-070 exact rotation count drift");
  if (canonicalText(landedOrbit.intervalHistogram) !== canonicalText({ "11": 6, "6": 1 })) {
    fail("BL-070 interval histogram drift");
  }
  for (const edge of d7Edges) {
    const landed = landedOrbit.perEdge.find((entry) => String(entry.a) === edge.a && String(entry.b) === edge.b);
    if (!landed || landed.rotateInterval !== edge.rotateInterval) {
      fail(`BL-070 per-edge interval disagreement at ${edgeKey(edge)}`);
    }
    const gate3Edge = gate3.d7Analogue.cycleTwinVerification.perEdge.find(
      (entry) => String(entry.a) === edge.a && String(entry.b) === edge.b,
    );
    if (!gate3Edge || gate3Edge.rotateInterval !== edge.rotateInterval) {
      fail(`Gate 3 per-edge interval disagreement at ${edgeKey(edge)}`);
    }
  }

  const a0Universe = bl071.census.universes.find((universe) => universe.id === "A0-P7");
  if (!a0Universe) fail("BL-071 A0-P7 universe missing");
  if (canonicalText(a0Universe.memberStates.slice().sort(cmp)) !== canonicalText(a0Order.slice().sort(cmp))) {
    fail("BL-071 A0-P7 member set disagrees with the derived ring");
  }
  if (canonicalText(a0Universe.rotation6Witnesses) !== canonicalText(["1387:2773"])) {
    fail("BL-071 A0-P7 closure witness drift");
  }
  if (a0Universe.hamming2Count !== 6 || a0Universe.rotation6Count !== 1) fail("BL-071 A0-P7 census drift");

  // ---- assembly -----------------------------------------------------------
  const core = {
    schemaVersion: SCHEMA_VERSION,
    investigationId: INVESTIGATION_ID,
    status: "planning_evidence",
    generator: "scripts/build-bl073-isometry-probe.mjs",
    role: "the BL-073 isometry probe: the two boundary seven-cycles (the D7 modal orbit, the A0 P7 ring) measured against four pre-registered preservation properties over a dihedral + symmetric bijection search; the boundary object's first structural probe; planning evidence",
    preRegistration: {
      rulings: [
        { id: "OD-73-1", ruling: "preservation set: all four P1-P4 required for FULL; a subset leaves the duality under-determined; any narrowing pre-registers its rationale before execution" },
        { id: "OD-73-2", ruling: "bijection search: primary dihedral (14) + secondary symmetric (5040), reported separately; an S7-only witness is a different kind of isometry (recorded as such)" },
        { id: "OD-73-3", ruling: "witness reporting: every passing bijection published explicitly with parity (rotation vs reflection); the chirality record is required" },
        { id: "OD-73-4", ruling: "landing shape: probe JSON + scoping memo in one pass, both planning_evidence, one grounding receipt" },
        { id: "OD-73-5", ruling: "computation boundary: masks-only over the listed witnesses; the Descriptive-Read boundary applies (no new universe enumeration, no new pair discovery)" },
        { id: "OD-73-6", ruling: "candidate endorsement ban: the scoping memo states candidates with falsification shapes; none endorsed" },
      ],
      refinements: [
        { id: "R1", ruling: "interval-vocabulary mapping: both cycles' directed rotation intervals are computed with the identical function (rotateMask12) along the landed orders; the R2 cycle-twin T1/T2 vocabulary is cited as context only, never a P2 input; the primary strict test compares like with like; the structural parallel is recorded as secondary, non-verdict-bearing" },
        { id: "N1", ruling: "P2-structural sharpened: both cycles are two-interval-structured (six uniform path edges at one rotation interval plus one distinguished closure edge at rotation 6; both closures Hamming-10); the shared two-interval shape is recorded, and does not alter P2-strict" },
        { id: "N2", ruling: "witness parity semantics: a reflection witness means chiral duals (distinct but mirror-related); a rotation witness means identical re-indexed (one structure counted twice); recorded per witness; when both exist the classification states both readings" },
      ],
      properties: [
        { id: "P1", definition: "adjacency / distance distribution: both cycles are 7-cycles (degree sequence 2-regular); the load-bearing test is the multiset equality of the 21 unordered pairwise Hamming distances within each cycle" },
        { id: "P2", definition: "interval signature: the directed rotation intervals along each cycle's landed order (the identical rotateMask12 computation on both sides); PASS iff a bijection maps every directed edge onto an edge at the same interval (primary strict); the two-interval structural parallel is recorded as a secondary observation" },
        { id: "P3", definition: "Hamming-distance distribution: exists a bijection preserving every pairwise Hamming distance (distance-matrix isomorphism), the strict form of the degree-sequence/distance-profile match" },
        { id: "P4", definition: "tritone marking: the per-node interval-class-6 content (the interval vector's tritone slot); PASS iff the marking vectors agree under a bijection; office/class labels are comparison targets only" },
      ],
      branchTable: {
        full: "FULL_ISOMETRY: P1 and P2 and P3 and P4 hold under at least one bijection",
        partial: "PARTIAL_ISOMETRY: a nonempty proper subset of the properties holds under at least one bijection; the differing properties are the boundary layer's asymmetry signature",
        no: "NO_ISOMETRY: no bijection satisfies P1 (with P2, P3, P4 all failing); the two cycles are structurally distinct objects",
        nonePreferred: "all three branches are findings; none is preferred",
      },
      searchSpaces: {
        dihedral: { size: 14, description: "the order-aligned dihedral maps of the 7-cycle (rotations i->i+k and reflections i->k-i)" },
        symmetric: { size: 5040, description: "every bijection of the seven positions (the full symmetric group)" },
      },
      witnessParityRule: "every passing witness is classified by its dihedral element name and permutation parity (inversions even = rotation-representative; odd = reflection-representative), per OD-73-3 and N2",
    },
    sourceBindings: [
      { artifact: LEDGER_PATH, sha256: fileSha(LEDGER_PATH), role: "462-record canonical universe: the tier/role partition, pitch sets, masks" },
      { artifact: NETWORK_PATH, sha256: fileSha(NETWORK_PATH), role: "the recorded D7 modal rows (the order cross-check; labelled)" },
      { artifact: BL071_PATH, sha256: fileSha(BL071_PATH), role: "chain anchor: the A0-P7 universe and the lifted congruence (fingerprint self-check)" },
      { artifact: BL070_PATH, sha256: fileSha(BL070_PATH), role: "chain anchor: the orbital-rotation per-edge bytes (fingerprint self-check)" },
      { artifact: GATE3_PATH, sha256: fileSha(GATE3_PATH), role: "the landed D7 analogue cycle-twin per-edge bytes (status execution_verified)" },
    ],
    base: {
      bl071: { artifact: BL071_PATH, investigationFingerprint: bl071Fingerprint },
      bl070: { artifact: BL070_PATH, derivationFingerprint: bl070Fingerprint },
      importPolicy: "chain artifacts are consumed by fingerprint self-check (no literals in this generator); the recorded modal order, the BL-070 intervals and the Gate 3 intervals are matched key-for-key, never as inputs to the property computations",
    },
    cycles: {
      D7: {
        id: "D7-modal-orbit",
        label: "the ti-pole's seven-cycle (the modal orbit)",
        derivation: "masks-only: the ^11 path within the D7 anchor set from its unique start, closed by the unique ^6 return (the ^11 orbit absorbs its root-normalization offset at the closure)",
        nodeCount: 7,
        order: d7Order,
        masks: d7Order.map((state) => masksByState.get(state)),
        degreeSequence: d7Geometry.degreeSequence,
        edges: d7Edges,
        closureEdge: closureEdgeD7,
        pcSumLadder: d7Geometry.pcSumLadder,
        pcSumStep: 5,
        distanceMatrix: d7Geometry.matrix,
      },
      A0: {
        id: "A0-P7-ring",
        label: "the fa-pole's seven-cycle (the A0 P7 ring; the mode-line's own geometry)",
        derivation: "masks-only: the Hamming-2 path among the A0 anchor set from its lower-pcSum endpoint, closed by the ^6 return",
        nodeCount: 7,
        order: a0Order,
        masks: a0Order.map((state) => masksByState.get(state)),
        degreeSequence: a0Geometry.degreeSequence,
        edges: a0Edges,
        closureEdge: closureEdgeA0,
        pcSumLadder: a0Geometry.pcSumLadder,
        pcSumStep: 1,
        distanceMatrix: a0Geometry.matrix,
      },
    },
    perProperty: {
      P1: {
        id: "P1",
        definition: "adjacency / distance distribution",
        d7HammingHistogram: d7Geometry.histogram,
        a0HammingHistogram: a0Geometry.histogram,
        multisetsEqual: p1Equal,
        witnesses: "phi-invariant: the equality holds for every bijection (a multiset property; no per-map dependence)",
        verdict: "PASS",
      },
      P2: {
        id: "P2",
        definition: "interval signature (primary strict) with the two-interval structural parallel recorded as secondary",
        primaryStrict: {
          d7DirectedIntervalHistogram: directedIntervalHistogram(d7Edges),
          a0DirectedIntervalHistogram: directedIntervalHistogram(a0Edges),
          equal: false,
          passingWitnesses: { dihedral: p2DihedralPass.length, symmetric: p2SymmetricPass.length },
          failureMode: "the six path edges carry interval 11 (D7) versus 7 (A0) under the landed orders; the closure edges coincide at interval 6; no bijection preserves the directed interval multiset (0/14 dihedral; 0/5040 symmetric)",
          verdict: "FAIL",
        },
        secondaryStructural: {
          statement: "two-interval structure shared: both cycles are six uniform path edges at one rotation interval plus one distinguished closure edge at rotation 6; both closures are Hamming-10 whole-set rotations; the path intervals differ (11 vs 7) and the pcSum ladders ascend at different steps (+5 vs +1)",
          d7: {
            pathInterval: pathEdgesD7[0].rotateInterval,
            pathCount: pathEdgesD7.length,
            pathHammings: pathEdgesD7.map((edge) => edge.hamming),
            closureInterval: closureEdgeD7.rotateInterval,
            closureHamming: closureEdgeD7.hamming,
          },
          a0: {
            pathInterval: pathEdgesA0[0].rotateInterval,
            pathCount: pathEdgesA0.length,
            pathHammings: pathEdgesA0.map((edge) => edge.hamming),
            closureInterval: closureEdgeA0.rotateInterval,
            closureHamming: closureEdgeA0.hamming,
          },
          shared: ["six uniform path edges", "closure at rotation 6", "closure Hamming-10", "Hamming-2 path edges", "two-interval shape"],
          nonVerdictBearing: true,
        },
        verdict: "FAIL",
      },
      P3: {
        id: "P3",
        definition: "Hamming-distance distribution (distance-matrix isomorphism)",
        d7DistanceMatrix: d7Geometry.matrix,
        a0DistanceMatrix: a0Geometry.matrix,
        witnessesBySpace: {
          dihedral: p3DihedralPass.map((element) => element.name),
          symmetric: p3SymmetricPass.length,
          beyondDihedral: p3SymmetricPass.length - p3DihedralPass.length,
        },
        automorphismGroups: {
          d7: "order 2: {identity, reversal}",
          a0: "order 2: {identity, reversal}",
          order: 2,
        },
        verdict: "PASS",
      },
      P4: {
        id: "P4",
        definition: "tritone marking (per-node interval-class-6 content)",
        d7TritoneSlotPerNode: d7Geometry.tritoneSlotPerNode,
        a0TritoneSlotPerNode: a0Geometry.tritoneSlotPerNode,
        witnesses: "phi-invariant: every node in both cycles carries exactly one tritone (IC6 = 1), so the marking agrees under every bijection",
        fullVectorObservation: {
          d7IntervalVectors: d7Geometry.intervalVectors,
          a0IntervalVectors: a0Geometry.intervalVectors,
          note: "the full interval vectors differ slotwise between the classes (7-1 vs 7-35); the pre-registered P4 tests the tritone marking, which agrees; the full-vector contrast is recorded context, not a verdict input",
        },
        verdict: "PASS",
      },
    },
    phiWitnesses: {
      searchSpaces: {
        dihedral: { size: dihedral.length, description: "primary: the order-aligned dihedral maps (six rotations + seven reflections of the 7-cycle)" },
        symmetric: { size: allPermutations.length, description: "secondary: every bijection of the seven positions" },
      },
      witnesses,
      combinedPreservation: {
        properties: passingSubset,
        witnessIds: witnesses.map((witness) => witness.id),
        statement: "the combined passing set is P1 + P3 + P4; both witnesses satisfy all three (P1 and P4 are phi-invariant)",
      },
      fullIsometry: {
        witnessIds: [],
        reason: "P2-strict fails under every bijection (0/14 dihedral; 0/5040 symmetric); no witness satisfies all four properties",
      },
      parityNote: "both N2-fork readings exist simultaneously at the distance layer: the rotation witness (identical re-indexing) exists, and the reflection witness is its composition with the cycles' own reversal automorphism; the P2-strict failure is what keeps the identity from being total",
    },
    searchSpaceResults: {
      dihedral: {
        size: dihedral.length,
        P1: "14/14 (phi-invariant multiset property)",
        P2: "0/14",
        P3: "2/14 (r0 and refl6)",
        P4: "14/14 (phi-invariant uniform marking)",
      },
      symmetric: {
        size: allPermutations.length,
        P1: "5040/5040 (phi-invariant multiset property)",
        P2: "0/5040",
        P3: "2/5040 (both dihedral; zero beyond-dihedral witnesses)",
        P4: "5040/5040 (phi-invariant uniform marking)",
        beyondDihedral: p3SymmetricPass.length - p3DihedralPass.length,
      },
    },
    phaseRelation: {
      status: "RECORDED_SECONDARY",
      closurePairCoherence: {
        statement: "under both witnesses the D7 closure pair {4033, 127} maps setwise onto the A0 closure pair {2773, 1387}; both closure relations are exact ^6 rotations (self-inverse), so the closure-level correspondence is interval-preserving",
        phi1: "4033->2773 and 127->1387 (aligned orientation)",
        phi2: "4033->1387 and 127->2773 (reversed orientation)",
      },
      rotationInduction: {
        statement: "neither witness is induced by a whole-set mask rotation: no mapped node pair (a, phi(a)) is an exact rotation relation under any interval",
        perWitness: rotationInduction,
      },
      liftedReuse: "cited from BL-071 (no new computation): lifted(2773@(p+6)) = T_6(lifted(1387@p)) for every phase, root-coherent across all 126 ledger rotation-6 pairs; the A0 closure pair is the lifted-congruence endpoint pair and the D7 closure pair admits the same lifted congruence, so either witness maps one congruent closure pair onto the other",
      nonVerdictBearing: true,
    },
    crossChecks: {
      d7RecordedOrder: {
        source: "canonical/universal-network-data.json d7ModalRows",
        statement: "the recorded modal order walked from 127 reproduces the derived ^11-path order exactly; the recorded closure edge 4033->127 matches the derived ^6 return",
        matchesDerived: true,
      },
      d7LandedIntervals: {
        source: "orrery/src/generated/bl070-d7-derivation.v1.json orbitalRotation + qa/d4-r2-execution-receipt.json d7Analogue.cycleTwinVerification.perEdge",
        statement: "every derived directed edge matches the landed BL-070 and Gate 3 per-edge intervals key-for-key (11 x6, 6 x1); exactRotationCount 7",
        matchesDerived: true,
      },
      a0LandedUniverse: {
        source: "orrery/src/generated/bl071-interval-6-structure.v1.json census.universes[A0-P7]",
        statement: "the derived ring's member set equals the landed A0-P7 universe; the landed rotation-6 witness 1387:2773 is the derived closure edge; Hamming-2 count 6",
        matchesDerived: true,
      },
      chainFingerprints: {
        bl071: bl071Fingerprint,
        bl070: bl070Fingerprint,
      },
    },
    branch: {
      preRegisteredLabels: ["FULL_ISOMETRY", "PARTIAL_ISOMETRY", "NO_ISOMETRY"],
      propertyResults,
      passingSubset,
      failingSubset,
      label: "PARTIAL_ISOMETRY",
      statement: "PARTIAL_ISOMETRY: the two seven-cycles share their adjacency/distance structure (P1: identical 21-pair Hamming histograms), their distance-matrix structure (P3: exactly two isomorphism witnesses, both dihedral - the aligned rotation r0 and the reversal reflection refl6), and their tritone marking (P4: every node carries exactly one tritone); they do not share their rotation-interval signature (P2 strict: the path edges run at 11 vs 7 under the landed orders; the closures coincide at 6). Per the pre-registered branch table the verdict is PARTIAL; the differing property (P2) is the boundary layer's interval-signature asymmetry. Measurement only; the semantic binding is separately gated.",
    },
    bindingGate: {
      status: "SEPARATELY_GATED",
      statement: "the probe measures isometry (a geometric measurement). What the result means for the GOVERNS relation - whether the isometry binds A0 to D7, whether GOVERNS is derivable from it, whether any office structure follows - is a semantic claim, gated separately on its own evidence, not this artifact's content. No mechanism claim; no GOVERNS admission; no record amendment occurs here.",
    },
    gates: {
      "V-BL-073-1": {
        result: "PASS",
        statement: "property integrity: all four properties and both bijection searches are byte-reproducible from the ledger masks and pitch sets; the validator re-derives every number independently",
      },
      "V-BL-073-2": {
        result: "PASS",
        statement: "pre-registration: P1-P4, the branch table, the two search spaces and the witness-parity rule were locked before execution; the interval-vocabulary mapping is stated (R1); the two-interval structural parallel is recorded as secondary (N1); the witness parity semantics are recorded (N2)",
      },
      "V-BL-073-3": {
        result: "PASS",
        statement: "chain cross-checks: the derived cycles match the landed bytes key-for-key (the recorded modal order, BL-070's orbitalRotation, Gate 3's per-edge intervals, BL-071's A0-P7 universe and closure witness)",
      },
      "V-BL-073-4": {
        result: "PASS",
        statement: "measurement-only: the binding gate is stated; no mechanism sentence and no GOVERNS-derivability claim appears in the property, witness or branch blocks",
      },
    },
    accounting: {
      masksOnly: [
        "both cycles derived masks-only (D7: the ^11 path within the D7 anchor set from its unique start + the unique ^6 return; A0: the Hamming-2 path from the lower-pcSum endpoint + the ^6 closure)",
        "all four property computations (pairwise Hamming histograms, distance matrices, directed rotation intervals, IC6 marking, pcSum ladders, interval vectors)",
        "the dihedral (14) and symmetric (5040) bijection searches; the witness parity classification (inversion counts); the automorphism-group computation",
        "the phase-relation secondary (closure-pair coherence; the rotation-induction check)",
      ],
      canonicalComputation: [
        "the D7 and A0 tier/role membership (the ledger's tier/role partition; labelled, as in BL-071)",
        "the chain fingerprints (BL-071, BL-070; self-checked) and the recorded modal-order cross-check (the network's modal rows; labelled)",
        "the landed interval cross-checks (BL-070 orbitalRotation perEdge; Gate 3 d7Analogue perEdge; BL-071 A0-P7 witness; labelled)",
      ],
      remainingGranted: [
        "the tier/role partition itself (the ledger's marking)",
        "the presentation start points (127 for the D7 walk; the lower-pcSum endpoint 1387 for the A0 walk) - both cycles are closed; the start points are presentation only",
        "the closed vocabularies (property ids P1-P4, branch labels, witness parity names)",
      ],
      statement: "the probe is discharged masks-only; the comparison layer reads the recorded orders and the landed intervals as cross-check targets only, never as inputs to the property computations",
    },
    fences: {
      d7HypothesisTier: "D7 remains hypothesis-tier throughout: no D7 claim event, no D7 record amendment, no D7 derivation admission; ENTRY 15's D7 clause carries forward verbatim (provenance/DECISION_LEDGER.md:2703-2712)",
      measurementOnly: "the isometry probe is measurement; the scoping is definition; neither is a claim event, neither amends records, neither touches the GOVERNS relation's formal status",
      governsAdmission: "none; the binding interpretation (what the isometry means for GOVERNS) is separately gated per the bindingGate block",
      directionalSemantics: "no directional-semantics assignment; the directional-semantics gate remains open",
      g1Intra330: "untouched",
      inv5: "no INV-5 graduation",
      mWalkability: "no M-walkability promotion",
      canonical: "no canonical/Court/schema/Neo4j writes; all sources read-only",
      d4Record: "no movement: ENTRY 10 immutable, ENTRY 15 unchanged, ENTRY 16 unchanged",
      membrane: "the frame (scrum/plan/harmonic-comprehension-map.md sections 2.6/2.7) is interpretation vocabulary only; never a probe input, design input, or admitted canon claim",
      sessionProse: "context, not evidence",
    },
    contractCitations: [
      "orrery/src/generated/bl071-interval-6-structure.v1.json (census.universes[A0-P7] memberStates and the closure witness 1387:2773; liftedSpace endpoint congruence; fingerprint self-checked)",
      "orrery/src/generated/bl070-d7-derivation.v1.json (orbitalRotation perEdge rotateInterval 11x6 + 6x1; nearMiss terminal contacts; fingerprint self-checked)",
      "qa/d4-r2-execution-receipt.json (d7Analogue.cycleTwinVerification perEdge bytes; status execution_verified)",
      "canonical/universal-network-data.json (d7ModalRows: the recorded modal orbit order)",
      "scrum/plan/bl-071-interval-6-memo.md (the dual closure finding; the interval-6 characterization)",
      "scrum/plan/bl-074-tritone-anatomy-memo.md (the relational-relational-internal trichotomy; the D2 dual-phenomenon trio)",
      "scrum/plan/bl-070-d7-derivation-memo.md (the orbital-rotation refinement: an interval-transport failure, not a rotational absence)",
      "scrum/plan/bl-068-d7-asymmetry-memo.md (the D7 side's counted structure: the modal orbit, per-anchor 4/5/6/6/6/5/4)",
      "scrum/plan/bl-059-governs-derivability-scoping-memo.md (the higher-theorem question; section 4.9 the dual closure accretion)",
      "scrum/plan/harmonic-comprehension-map.md (sections 5.6/5.7 the registered measured findings; the membrane boundary)",
      "scrum/plan/bl-067-governs-semantic-synthesis.md (the boundary layer's synthesis; the open-edge inventory naming BL-073)",
      "scrum/BACKLOG.md (the BL-073 capture: the dual seven-cycle closure at rotation 6 - isometry / phase-relation / coincidence?)",
    ],
    notAccomplished: [
      "no claim event; no record amendment (D4's derivable-via-R2 and D7's hypothesis-tier unchanged; ENTRY 10/15/16 byte-untouched)",
      "no GOVERNS admission; the binding interpretation of the isometry is separately gated (the bindingGate block)",
      "no G1 movement (no intra-330 edges assumed, emitted, or consumed); no INV-5 graduation; no M-walkability promotion",
      "no mechanism claim (the probe measures structure; why the structure is what it is stays open)",
      "no canonical/Court/schema/Neo4j writes; no ledger writes",
      "no directional-semantics assignment; no lens application as evidence; the frame is vocabulary, not input; session prose is context, not evidence",
      "the scoping memo defines; the probe measures; neither claims nor admits",
    ],
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
    cycles: Object.values(investigation.cycles).map((cycle) =>
      `${cycle.id}: ${cycle.order.join(" -> ")}; intervals ${cycle.edges.map((edge) => edge.rotateInterval).join(",")}`).join(" | "),
    properties: investigation.branch.propertyResults,
    witnesses: investigation.phiWitnesses.witnesses.map((witness) =>
      `${witness.id}:${witness.kind}:${witness.dihedralElement}:${witness.inversions} inversions`).join(" | "),
    branch: investigation.branch.label,
    bindingGate: investigation.bindingGate.status,
    investigationFingerprint: investigation.investigationFingerprint,
  };
  if (check) {
    const existing = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, "utf8") : null;
    if (existing !== serialized) throw new Error("STALE_BL073_ISOMETRY_PROBE");
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
