#!/usr/bin/env node
/**
 * Build the BL-075 coordinate transformation search: the affine map(s) that
 * carry the D7 addressing (^11 path + ^6 closure) onto the A0 addressing
 * (^7 path + ^6 closure). Planning, read-only analysis.
 *
 * Pre-registered planning pass (rulings OD-CT-1..OD-CT-7, approved
 * 2026-10-11): the search tests the affine class L1 = Aff(Z12) (48 maps
 * x -> u*x + t, u a unit of Z12) as primary, with the rotation class L0
 * (u = 1; the brief's candidates (a) constant offset and (b) the
 * rotateMaskZ12^4 composition) reported separately. The pure position
 * reindexing class is disposed of by the landed BL-073 P2 census (0/5040)
 * and is cited, never re-searched.
 *
 * The pre-registered primary hypothesis (the planning pass's necessity
 * proof, recorded as arithmetic): for an affine map A(x) = u*x + t,
 * A(rot^d(x)) = rot^{u*d}(A(x)); the addressing requirement 11u = 7
 * (mod 12) forces u = 5 uniquely among the units {1,5,7,11}; every odd
 * unit fixes the closure (6u = 6). Predicted branch: CHIRAL_PAIR -
 * T1 = (u=5, t=0) the directed carrier, T2 = (u=7, t=0) its chiral
 * partner (the pc-reflection composition).
 *
 * Structure:
 *   search       - the 48-map Aff(Z12) census: setwise (S) / directed (D) /
 *                  undirected (U) classification; the two carriers with
 *                  their image orders, intervals, Hammings, pcSums
 *   necessity    - the interval-transport table (11u and 6u mod 12 per unit)
 *   group        - the composition-closure test: the carrier set's closure
 *                  is the unit subgroup {1,5,7,11} (Klein-4)
 *   reflection   - the pc-level relation (T2 = rho o T1) and the index-level
 *                  witness alignment (T1 <-> phi-1, T2 <-> phi-2)
 *   branch       - the pre-registered verdict
 *   crossChecks  - key-for-key against the landed BL-073 cycles/witnesses,
 *                  BL-070/Gate-3 per-edge bytes, BL-071's A0-P7 universe
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

export const SCHEMA_VERSION = "harmonic-orrery.bl075-coordinate-search.v1";
export const INVESTIGATION_ID = "BL075_COORDINATE_SEARCH_V1";
export const OUTPUT_PATH = "orrery/src/generated/bl075-coordinate-search.v1.json";
export const LEDGER_PATH = HEPTATONIC_LEDGER_PATH;
export const BL073_PATH = "orrery/src/generated/bl073-isometry-probe.v1.json";
export const BL071_PATH = "orrery/src/generated/bl071-interval-6-structure.v1.json";
export const BL070_PATH = "orrery/src/generated/bl070-d7-derivation.v1.json";
export const GATE3_PATH = "qa/d4-r2-execution-receipt.json";

export const D7_ORDER_EXPECTED = ["127", "2111", "3103", "3599", "3847", "3971", "4033"];
export const A0_ORDER_EXPECTED = ["1387", "1451", "1453", "1709", "1717", "2741", "2773"];
export const D7_INTERVALS_EXPECTED = [11, 11, 11, 11, 11, 11, 6];
export const A0_INTERVALS_EXPECTED = [7, 7, 7, 7, 7, 7, 6];
export const CYCLE_HAMMING_EXPECTED = [2, 2, 2, 2, 2, 2, 10];
export const D7_PC_SUM_LADDER = [21, 26, 31, 36, 41, 46, 51];
export const A0_PC_SUM_LADDER = [33, 34, 35, 36, 37, 38, 39];
export const UNITS_EXPECTED = [1, 5, 7, 11];
export const T1_IMAGE_INTERVALS = [7, 7, 7, 7, 7, 7, 6];
export const T2_IMAGE_INTERVALS = [5, 5, 5, 5, 5, 5, 6];
export const T1_IMAGE_PC_SUMS = [33, 34, 35, 36, 37, 38, 39];
export const T2_IMAGE_PC_SUMS = [39, 38, 37, 36, 35, 34, 33];
export const T1_IMAGE_ORDER = ["1387", "1451", "1453", "1709", "1717", "2741", "2773"];
export const T2_IMAGE_ORDER = ["2773", "2741", "1717", "1709", "1453", "1451", "1387"];
export const NECESSITY_EXPECTED = [
  { unit: 1, transportedPath: 11, transportedClosure: 6, carriesPathAddress: false },
  { unit: 5, transportedPath: 7, transportedClosure: 6, carriesPathAddress: true },
  { unit: 7, transportedPath: 5, transportedClosure: 6, carriesPathAddress: false },
  { unit: 11, transportedPath: 1, transportedClosure: 6, carriesPathAddress: false },
];
export const L1_CENSUS_EXPECTED = { size: 48, setwise: 2, directed: 1, reversed: 1 };
export const L0_CENSUS_EXPECTED = { size: 12, setwise: 0, directed: 0, reversed: 0 };

// ==== CENSUS-CORE-BEGIN (tier/role partition + masks + the affine search only) ====
// This region derives both seven-cycles from the ledger's tier/role partition
// and masks alone, and computes the whole coordinate search - the 48-map
// affine census, the necessity table, the composition-closure test and the
// pc-level reflection composition - from masks and arithmetic. It never reads
// the label fields, the recorded-status fields, the network records, the
// landed artifacts, or any verdict. The witness comparison happens only
// outside this region.

function cmp(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function cmpNumericStrings(left, right) {
  return Number(left) - Number(right);
}

function gcd(left, right) {
  let a = left;
  let b = right;
  while (b !== 0) {
    const remainder = a % b;
    a = b;
    b = remainder;
  }
  return a;
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

export function unitsOfZ12() {
  const units = [];
  for (let candidate = 1; candidate < 12; candidate += 1) {
    if (gcd(candidate, 12) === 1) units.push(candidate);
  }
  return units;
}

export function affineMapOfMask(mask, unit, translation) {
  let image = 0;
  for (let pitch = 0; pitch < 12; pitch += 1) {
    if ((mask >> pitch) & 1) image |= 1 << ((((unit * pitch + translation) % 12) + 12) % 12);
  }
  return image & 4095;
}

export function composeAffineMap(outer, inner) {
  return {
    unit: (outer.unit * inner.unit) % 12,
    translation: (outer.unit * inner.translation + outer.translation) % 12,
  };
}

export function coordinateSearch(d7Order, a0Order, masksByState) {
  const units = unitsOfZ12();
  if (canonicalText(units) !== canonicalText(UNITS_EXPECTED)) fail(`unit census drift: ${units.join(",")}`);
  const d7Masks = d7Order.map((state) => masksByState.get(state));
  const a0Masks = a0Order.map((state) => masksByState.get(state));
  const a0MaskSet = new Set(a0Masks);
  const a0StateByMask = new Map(a0Masks.map((mask, index) => [mask, a0Order[index]]));
  const d7Edges = directedEdges(d7Order, masksByState);
  const a0Edges = directedEdges(a0Order, masksByState);
  const pairKey = (from, to) => `${from}:${to}`;
  const unorderedKey = (from, to) => (from < to ? `${from}:${to}` : `${to}:${from}`);
  const a0DirectedPairs = new Set(a0Edges.map((edge) => pairKey(masksByState.get(edge.a), masksByState.get(edge.b))));
  const a0UndirectedPairs = new Set(a0Edges.map((edge) => unorderedKey(masksByState.get(edge.a), masksByState.get(edge.b))));
  const rows = [];
  for (const unit of units) {
    for (let translation = 0; translation < 12; translation += 1) {
      const imageMasks = d7Masks.map((mask) => affineMapOfMask(mask, unit, translation));
      const setwise = new Set(imageMasks).size === 7 && imageMasks.every((mask) => a0MaskSet.has(mask));
      let directed = false;
      let reversed = false;
      let imageIntervals = null;
      let imageHamming = null;
      if (setwise) {
        imageIntervals = [];
        imageHamming = [];
        let directedHit = true;
        let undirectedHit = true;
        for (let index = 0; index < 7; index += 1) {
          const from = imageMasks[index];
          const to = imageMasks[(index + 1) % 7];
          const intervals = [];
          for (let d = 1; d <= 11; d += 1) if (rotateMask12(from, d) === to) intervals.push(d);
          const exact = intervals.length === 1 ? intervals[0] : null;
          imageIntervals.push(exact);
          imageHamming.push(hamming12(from, to));
          if (exact === null || !a0DirectedPairs.has(pairKey(from, to))) directedHit = false;
          if (exact === null || !a0UndirectedPairs.has(unorderedKey(from, to))) undirectedHit = false;
        }
        directed = directedHit;
        reversed = !directedHit && undirectedHit;
      }
      rows.push({ unit, translation, setwise, directed, reversed, imageIntervals, imageHamming });
    }
  }
  const countsOf = (candidateRows) => ({
    size: candidateRows.length,
    setwise: candidateRows.filter((row) => row.setwise).length,
    directed: candidateRows.filter((row) => row.directed).length,
    reversed: candidateRows.filter((row) => row.reversed).length,
  });
  const classL0 = countsOf(rows.filter((row) => row.unit === 1));
  const classL1 = countsOf(rows);
  const tCensus = {};
  for (const unit of units) {
    tCensus[String(unit)] = rows.filter((row) => row.unit === unit && row.setwise).map((row) => row.translation);
  }
  const carrierOf = (row, id, level, role) => ({
    id,
    unit: row.unit,
    translation: row.translation,
    map: `x -> ${row.unit}x (mod 12)`,
    level,
    setwise: row.setwise,
    directed: row.directed,
    reversed: row.reversed,
    imageOrder: d7Masks.map((mask) => a0StateByMask.get(affineMapOfMask(mask, row.unit, row.translation))),
    imageIntervals: row.imageIntervals,
    imageHamming: row.imageHamming,
    imagePcSums: d7Masks.map((mask) => pcSumOfMask(affineMapOfMask(mask, row.unit, row.translation))),
    role,
  });
  const directedRows = rows.filter((row) => row.directed);
  const reversedRows = rows.filter((row) => row.reversed);
  if (directedRows.length !== 1 || reversedRows.length !== 1) {
    fail(`carrier census drift: ${directedRows.length}/${reversedRows.length}`);
  }
  const carriers = {
    T1: carrierOf(directedRows[0], "T1", "D", "the directed carrier: the coordinate map that carries the D7 addressing (^11) onto the A0 addressing (^7) edge-for-edge"),
    T2: carrierOf(reversedRows[0], "T2", "U", "the chiral partner: carries the D7 cycle onto the reversal of the A0 cycle (undirected only); equals the pc-reflection composed with T1"),
  };
  return { units, rows, classL0, classL1, tCensus, carriers };
}

export function necessityOfUnit() {
  const rows = [];
  for (const unit of unitsOfZ12()) {
    const transportedPath = (11 * unit) % 12;
    const transportedClosure = (6 * unit) % 12;
    rows.push({ unit, transportedPath, transportedClosure, carriesPathAddress: transportedPath === 7 });
  }
  return rows;
}

export function groupClosureTest() {
  const elements = unitsOfZ12().map((unit) => ({ id: `M${unit}`, unit, translation: 0 }));
  const keyOf = (map) => `${map.unit}:${map.translation}`;
  const memberKeys = new Set(elements.map(keyOf));
  const products = [];
  let closed = true;
  let commutative = true;
  for (const outer of elements) {
    for (const inner of elements) {
      const product = composeAffineMap(outer, inner);
      const reversed = composeAffineMap(inner, outer);
      const inside = memberKeys.has(keyOf(product));
      if (!inside) closed = false;
      if (keyOf(product) !== keyOf(reversed)) commutative = false;
      products.push({ outer: outer.id, inner: inner.id, product: `M${product.unit}`, inside });
    }
  }
  const identityPresent = elements.some((element) => element.unit === 1);
  const allInvolutions = elements.every((element) => {
    const square = composeAffineMap(element, element);
    return keyOf(square) === "1:0";
  });
  return { elements, order: elements.length, closed, commutative, allInvolutions, identityPresent, products };
}

export function reflectionPcRelation(carriers) {
  const rho = { unit: 11, translation: 0 };
  const t1 = { unit: carriers.T1.unit, translation: carriers.T1.translation };
  const t2 = { unit: carriers.T2.unit, translation: carriers.T2.translation };
  const rhoThenT1 = composeAffineMap(rho, t1);
  const rhoThenT2 = composeAffineMap(rho, t2);
  const t1ThenT2 = composeAffineMap(t1, t2);
  const t2ThenT1 = composeAffineMap(t2, t1);
  const same = (map, unit, translation) => map.unit === unit && map.translation === translation;
  if (!same(rhoThenT1, t2.unit, t2.translation)) fail("pc-level relation drift: rho o T1 != T2");
  if (!same(rhoThenT2, t1.unit, t1.translation)) fail("pc-level relation drift: rho o T2 != T1");
  if (!same(t1ThenT2, 11, 0) || !same(t2ThenT1, 11, 0)) fail("pc-level relation drift: T1 o T2 != rho");
  return {
    reflection: "rho = x -> 11x (mod 12): the pitch-circle reflection fixing pc 0 and pc 6",
    relations: [
      { expression: "T2", value: "rho o T1" },
      { expression: "T1", value: "rho o T2" },
      { expression: "rho", value: "T1 o T2 = T2 o T1" },
    ],
    verified: true,
  };
}

// ==== CENSUS-CORE-END ====

// ---- comparison and cross-check sections (the landed artifacts and the
// ---- verdict material are read here; never in the census-core region) -------

function buildInvestigation() {
  const ledgerRows = parseCsv(read(LEDGER_PATH));
  const bl073 = readJson(BL073_PATH);
  const bl071 = readJson(BL071_PATH);
  const bl070 = readJson(BL070_PATH);
  const gate3 = readJson(GATE3_PATH);

  if (ledgerRows.length !== 462) fail(`heptatonic ledger census is ${ledgerRows.length}`);

  // ---- chain self-checks (fingerprints; no literals in this generator) ----
  const { investigationFingerprint: bl073Fingerprint, ...bl073Core } = bl073;
  if (bl073.investigationId !== "BL073_ISOMETRY_PROBE_V1" || bl073.status !== "planning_evidence") {
    fail("BL-073 artifact header drift");
  }
  if (sha256(canonicalText(bl073Core)) !== bl073Fingerprint) fail("BL-073 fingerprint self-check failed");
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
  if (canonicalText(d7Edges.map((edge) => edge.hamming)) !== canonicalText(CYCLE_HAMMING_EXPECTED) ||
      canonicalText(a0Edges.map((edge) => edge.hamming)) !== canonicalText(CYCLE_HAMMING_EXPECTED)) {
    fail("cycle hamming inventory drift");
  }
  const d7PcSums = d7Order.map((state) => pcSumOfMask(masksByState.get(state)));
  const a0PcSums = a0Order.map((state) => pcSumOfMask(masksByState.get(state)));
  if (canonicalText(d7PcSums) !== canonicalText(D7_PC_SUM_LADDER)) fail("D7 pcSum ladder drift");
  if (canonicalText(a0PcSums) !== canonicalText(A0_PC_SUM_LADDER)) fail("A0 pcSum ladder drift");

  // ---- the coordinate search (masks-only) ---------------------------------
  const search = coordinateSearch(d7Order, a0Order, masksByState);
  if (canonicalText(search.classL0) !== canonicalText(L0_CENSUS_EXPECTED)) {
    fail(`L0 census drift: ${canonicalText(search.classL0)}`);
  }
  if (canonicalText(search.classL1) !== canonicalText(L1_CENSUS_EXPECTED)) {
    fail(`L1 census drift: ${canonicalText(search.classL1)}`);
  }
  if (canonicalText(search.tCensus) !== canonicalText({ "1": [], "5": [0], "7": [0], "11": [] })) {
    fail(`t-census drift: ${canonicalText(search.tCensus)}`);
  }
  const carriers = search.carriers;
  if (canonicalText(carriers.T1.imageOrder) !== canonicalText(T1_IMAGE_ORDER)) fail("T1 image order drift");
  if (canonicalText(carriers.T2.imageOrder) !== canonicalText(T2_IMAGE_ORDER)) fail("T2 image order drift");
  if (canonicalText(carriers.T1.imageIntervals) !== canonicalText(T1_IMAGE_INTERVALS)) fail("T1 image interval drift");
  if (canonicalText(carriers.T2.imageIntervals) !== canonicalText(T2_IMAGE_INTERVALS)) fail("T2 image interval drift");
  if (canonicalText(carriers.T1.imagePcSums) !== canonicalText(T1_IMAGE_PC_SUMS)) fail("T1 image pcSum drift");
  if (canonicalText(carriers.T2.imagePcSums) !== canonicalText(T2_IMAGE_PC_SUMS)) fail("T2 image pcSum drift");
  if (carriers.T1.unit !== 5 || carriers.T1.translation !== 0) fail("T1 identity drift");
  if (carriers.T2.unit !== 7 || carriers.T2.translation !== 0) fail("T2 identity drift");

  // ---- necessity, group, pc-level reflection (masks-only) ----------------
  const necessity = necessityOfUnit();
  if (canonicalText(necessity) !== canonicalText(NECESSITY_EXPECTED)) {
    fail(`necessity table drift: ${canonicalText(necessity)}`);
  }
  const group = groupClosureTest();
  if (group.order !== 4 || !group.closed || !group.commutative || !group.allInvolutions || !group.identityPresent) {
    fail("group structure drift");
  }
  const reflection = reflectionPcRelation(carriers);
  const pcCarrierClosure = {
    generatorIds: ["T1", "T2"],
    compositionClosed: false,
    closure: group.elements.map((element) => element.id),
    statement: "the working set {T1, T2} is not composition-closed (T1 o T1 = M1 and T1 o T2 = M11, neither carrying the D7 -> A0 correspondence); its composition closure is the unit subgroup {M1, M5, M7, M11}",
  };
  // ---- index-level reflection alignment (landed witness comparison) -------
  const phi1 = bl073.phiWitnesses.witnesses.find((witness) => witness.id === "phi-1");
  const phi2 = bl073.phiWitnesses.witnesses.find((witness) => witness.id === "phi-2");
  if (!phi1 || !phi2) fail("BL-073 witness inventory drift");
  if (phi1.dihedralElement !== "r0" || phi1.kind !== "rotation" || phi1.parity !== "even") {
    fail("phi-1 classification drift");
  }
  if (phi2.dihedralElement !== "refl6" || phi2.kind !== "reflection" || phi2.parity !== "odd") {
    fail("phi-2 classification drift");
  }
  const phi1Targets = phi1.map.map((entry) => entry.a0);
  const phi2Targets = phi2.map.map((entry) => entry.a0);
  if (canonicalText(phi1Targets) !== canonicalText(carriers.T1.imageOrder)) {
    fail("T1 image order disagrees with the landed phi-1 targets");
  }
  if (canonicalText(phi2Targets) !== canonicalText(carriers.T2.imageOrder)) {
    fail("T2 image order disagrees with the landed phi-2 targets");
  }
  const indexAlignment = {
    alignment: [
      { carrier: "T1", witness: "phi-1", element: "r0", kind: "rotation", parity: "even", orientation: "forward" },
      { carrier: "T2", witness: "phi-2", element: "refl6", kind: "reflection", parity: "odd", orientation: "reversed" },
    ],
    verified: true,
    statement: "the directed carrier's image order equals the phi-1 targets (the forward orientation); the reversed carrier's image order equals the phi-2 targets (the chiral mirror); the coordinate carriers' orientations align with the distance witnesses' parities",
  };

  // ---- cross-checks against the landed records ----------------------------
  if (canonicalText(d7Order) !== canonicalText(bl073.cycles.D7.order)) fail("BL-073 D7 order cross-check drift");
  if (canonicalText(a0Order) !== canonicalText(bl073.cycles.A0.order)) fail("BL-073 A0 order cross-check drift");
  if (canonicalText(d7Edges) !== canonicalText(bl073.cycles.D7.edges)) fail("BL-073 D7 edge cross-check drift");
  if (canonicalText(a0Edges) !== canonicalText(bl073.cycles.A0.edges)) fail("BL-073 A0 edge cross-check drift");
  for (const edge of d7Edges) {
    const landed = bl070.orbitalRotation.perEdge.find((entry) => String(entry.a) === edge.a && String(entry.b) === edge.b);
    if (!landed || landed.rotateInterval !== edge.rotateInterval) {
      fail(`BL-070 per-edge disagreement at ${edge.a}->${edge.b}`);
    }
    const gate3Edge = gate3.d7Analogue.cycleTwinVerification.perEdge.find(
      (entry) => String(entry.a) === edge.a && String(entry.b) === edge.b,
    );
    if (!gate3Edge || gate3Edge.rotateInterval !== edge.rotateInterval) {
      fail(`Gate 3 per-edge disagreement at ${edge.a}->${edge.b}`);
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

  // ---- assembly -----------------------------------------------------------
  const core = {
    schemaVersion: SCHEMA_VERSION,
    investigationId: INVESTIGATION_ID,
    status: "planning_evidence",
    generator: "scripts/build-bl075-coordinate-search.mjs",
    role: "the BL-075 coordinate transformation search: the affine map(s) carrying the D7 addressing (^11) onto the A0 addressing (^7); the PARTIAL_ISOMETRY leading interpretation's probe; planning evidence",
    preRegistration: {
      rulings: [
        { id: "OD-CT-1", ruling: "transformation class scope: L0 rotations (12, reported separately) + L1 affine Aff(Z12) (48, primary); the pure-reindexing class is cited from BL-073 (0/5040) and never re-searched; S12 sampling, kappa-conjugations and complement maps are out of scope (a different investigation); the necessity proof makes L1 complete for the linear case" },
        { id: "OD-CT-2", ruling: "preservation levels: S (node-set), D (directed-cycle; addressing transported 11 -> 7, closure 6 -> 6), U (undirected-cycle) reported separately; Hamming recomputed per map; the pcSum ladder is a secondary observation, non-verdict-bearing" },
        { id: "OD-CT-3", ruling: "branch table: COORDINATE_MAP_FOUND (>= 1 level-D hit) / CHIRAL_PAIR (level-D hit plus a level-U-only partner differing by the pc-reflection composition) / PARTIAL_MAP (level-S only) / NO_MAP (zero L1 setwise); CHIRAL_PAIR is the predicted branch" },
        { id: "OD-CT-4", ruling: "landing shape: full probe (artifact + independent validator + vitest pins + memo), wired after bl073-isometry-probe:check" },
        { id: "OD-CT-5", ruling: "reflection formulation: two separately reported sub-tests - pc-level composition (T2 = rho o T1) and index-level witness alignment (T1 <-> phi-1, T2 <-> phi-2)" },
        { id: "OD-CT-6", ruling: "the brief's candidates (a) the constant rotation offset and (b) the rotateMaskZ12^4 composition are pre-registered as falsified-by-construction (rotations preserve the interval content; the cycles' classes differ: 7-1 versus 7-35) AND mechanically tested in L0 (0/12)" },
        { id: "OD-CT-7", ruling: "C2 note: T1 is recorded as a candidate fiber-coordinate realization (the interval parameter as fiber) without endorsing the C2 bundle reading" },
      ],
      hypothesis: {
        necessity: "for an affine map A(x) = u*x + t, A(rot^d(x)) = rot^{u*d}(A(x)); the addressing requirement 11u = 7 (mod 12) forces u = 5 uniquely among the units {1,5,7,11}; every odd unit fixes the closure (6u = 6)",
        primary: "T1 = (u=5, t=0): the directed carrier - the unique unit satisfying 11u = 7 (mod 12)",
        chiralPartner: "T2 = (u=7, t=0): the chiral partner (11u = 5; carries the cycle onto the A0 reversal)",
        predictedBranch: "CHIRAL_PAIR",
        expectedCensus: "48 maps searched: 2 setwise (T1 directed, T2 reversed), 1 directed, 1 reversed; L0 rotations 0/12",
      },
      levels: {
        S: "setwise: the image of the D7 anchor set (as masks) is exactly the A0 anchor set",
        D: "directed-cycle: S holds and every directed D7 edge images onto an A0 directed edge with the addressing transported (the six path edges 11 -> 7; the closure 6 -> 6), so the image sequence walks the A0 cycle forward",
        U: "undirected-cycle: S holds and every D7 edge images onto an A0 edge as an unordered pair (path 11 -> 7 or 5; closure 6 -> 6)",
      },
      branchTable: {
        coordinateMapFound: "COORDINATE_MAP_FOUND: at least one L1 map passes level D (the addressing is transported edge-for-edge)",
        chiralPair: "CHIRAL_PAIR: a level-D hit plus a level-U-only partner differing from it by the pc-reflection composition (the coordinate systems multiply related; the chirality finding)",
        partialMap: "PARTIAL_MAP: level-S hits but no level-D hit (the unity hypothesis constrained further)",
        noMap: "NO_MAP: zero L1 setwise hits (the independence reading)",
        nonePreferred: "the branch fires on the measured census; CHIRAL_PAIR is the pre-registered prediction",
      },
      reindexingClassDisposition: "the pure position-reindexing class cannot change interval values; BL-073's P2 census (0/14 dihedral, 0/5040 symmetric witnesses) already disposed of it; cited, never re-searched",
    },
    sourceBindings: [
      { artifact: LEDGER_PATH, sha256: fileSha(LEDGER_PATH), role: "462-record canonical universe: the tier/role partition and pitch sets (masks derived)" },
      { artifact: BL073_PATH, sha256: fileSha(BL073_PATH), role: "chain anchor: the PARTIAL_ISOMETRY probe (cycles, phi witnesses, branch; fingerprint self-check)" },
      { artifact: BL071_PATH, sha256: fileSha(BL071_PATH), role: "chain ancestor: the A0-P7 universe (member set and closure witness; fingerprint self-check)" },
      { artifact: BL070_PATH, sha256: fileSha(BL070_PATH), role: "chain ancestor: the D7 orbital-rotation per-edge bytes (fingerprint self-check)" },
      { artifact: GATE3_PATH, sha256: fileSha(GATE3_PATH), role: "the landed D7 analogue cycle-twin per-edge bytes (status execution_verified)" },
    ],
    base: {
      bl073: { artifact: BL073_PATH, investigationFingerprint: bl073Fingerprint },
      bl071: { artifact: BL071_PATH, investigationFingerprint: bl071Fingerprint },
      bl070: { artifact: BL070_PATH, derivationFingerprint: bl070Fingerprint },
      importPolicy: "chain artifacts are consumed by fingerprint self-check (no literals in this generator); the cycles and the witness maps are matched key-for-key in the comparison layer, never as inputs to the search",
    },
    cycles: {
      D7: {
        id: "D7-modal-orbit",
        label: "the ti-pole's seven-cycle (the modal orbit)",
        derivation: "masks-only: the ^11 path within the D7 anchor set from its unique start, closed by the unique ^6 return",
        order: d7Order,
        masks: d7Order.map((state) => masksByState.get(state)),
        edges: d7Edges,
        closureEdge: d7Edges[6],
        pcSumLadder: d7PcSums,
        pcSumStep: 5,
      },
      A0: {
        id: "A0-P7-ring",
        label: "the fa-pole's seven-cycle (the A0 P7 ring; the mode-line's own geometry)",
        derivation: "masks-only: the Hamming-2 path among the A0 anchor set from its lower-pcSum endpoint, closed by the ^6 return",
        order: a0Order,
        masks: a0Order.map((state) => masksByState.get(state)),
        edges: a0Edges,
        closureEdge: a0Edges[6],
        pcSumLadder: a0PcSums,
        pcSumStep: 1,
      },
    },
    search: {
      affineClass: "Aff(Z12) = {x -> u*x + t (mod 12)}: u a unit of Z12, t a translation; |Aff(Z12)| = 12 * 4 = 48",
      units: search.units,
      mapCount: search.rows.length,
      levels: {
        S: "setwise",
        D: "directed-cycle",
        U: "undirected-cycle",
      },
      classL0: {
        definition: "rotations (unit = 1, translations 0..11): the interval-preserving addressing class; the brief's candidates (a) the constant rotation offset and (b) the rotateMaskZ12^4 composition belong here",
        size: search.classL0.size,
        setwise: search.classL0.setwise,
        directed: search.classL0.directed,
        reversed: search.classL0.reversed,
        statement: "the rotation class is empty for the addressing transport: no whole-set mask rotation carries the D7 anchor set onto the A0 anchor set (0/12); rotations preserve the interval content and the two cycles' classes differ (7-1 versus 7-35); the brief's candidates (a) and (b) are falsified both by construction and mechanically",
      },
      classL1: {
        definition: "affine maps (unit in {1,5,7,11}, translations 0..11): the primary search; L1 contains L0 as its unit = 1 slice",
        size: search.classL1.size,
        setwise: search.classL1.setwise,
        directed: search.classL1.directed,
        reversed: search.classL1.reversed,
        statement: "the affine search found exactly two setwise maps - T1 (u=5, t=0), the directed carrier, and T2 (u=7, t=0), its reversed chiral partner; every other affine map fails the setwise test; no translation offset (t != 0) is setwise for any unit",
      },
      tCensus: search.tCensus,
      carriers: [carriers.T1, carriers.T2],
      census: search.rows,
    },
    necessity: {
      requirement: "transport the D7 path addressing ^11 to the A0 path addressing ^7: 11u = 7 (mod 12)",
      conjugacyIdentity: "for an affine map A(x) = u*x + t: A(rot^d(x)) = rot^{u*d}(A(x)); the transported edge interval is d*u, and the closure is d = 6",
      table: necessity,
      uniqueUnit: 5,
      closureInvariance: "6u = 6 (mod 12) for every unit; the closure interval is fixed by all four units, so the addressing requirement constrains only the path interval",
      statement: "11u = 7 (mod 12) forces u = 5 uniquely among the units {1,5,7,11}; the path-addressing transport selects one unit, and the closure is auto-preserved",
    },
    group: {
      elements: group.elements.map((element) => ({
        id: element.id,
        unit: element.unit,
        translation: element.translation,
        map: element.unit === 1 ? "identity" : element.unit === 11 ? "x -> 11x (rho, the pc-reflection)" : `x -> ${element.unit}x`,
        setwise: [carriers.T1.unit, carriers.T2.unit].includes(element.unit),
        carries: element.unit === carriers.T1.unit
          ? "D7 set -> A0 set, directed (T1)"
          : element.unit === carriers.T2.unit
            ? "D7 set -> A0 set, reversed (T2)"
            : "neither (preserves the D7 addressing or the pitch-circle reflection)",
      })),
      order: group.order,
      closed: group.closed,
      commutative: group.commutative,
      allInvolutions: group.allInvolutions,
      identityPresent: group.identityPresent,
      isomorphicTo: "Klein-4 (V4): the unit subgroup U(Z12)",
      workingSet: pcCarrierClosure,
      products: group.products,
      relations: [
        { expression: "M5 o M5", result: "M1" },
        { expression: "M7 o M7", result: "M1" },
        { expression: "M5 o M7", result: "M11" },
        { expression: "M7 o M5", result: "M11" },
        { expression: "M11 o M5", result: "M7" },
        { expression: "M11 o M7", result: "M5" },
      ],
      statement: "the working set {T1, T2} is not composition-closed; its composition closure is the full unit subgroup {M1, M5, M7, M11} - the Klein-4 group (all involutions, commutative) of the coordinate ambiguity's algebra",
    },
    reflection: {
      status: "VERIFIED",
      pcLevel: reflection,
      indexLevel: indexAlignment,
    },
    branch: {
      preRegisteredLabels: ["COORDINATE_MAP_FOUND", "CHIRAL_PAIR", "PARTIAL_MAP", "NO_MAP"],
      fired: ["COORDINATE_MAP_FOUND", "CHIRAL_PAIR"],
      label: "CHIRAL_PAIR",
      coordinateMapFound: true,
      reading: "READING_1_CONFIRMED",
      statement: "CHIRAL_PAIR: the search found the coordinate map - T1 = (u=5, t=0), the unique unit satisfying 11u = 7 (mod 12), carries the D7 orbit's addressing (^11 path + ^6 closure) onto the A0 ring's addressing (^7 path + ^6 closure) edge-for-edge (level D) - and its chiral partner T2 = (u=7, t=0) = rho o T1, which carries the cycle onto the A0 reversal (level U only; path images at ^5). The transformation exists and is canonically determined; the two cycles are one structure addressed two ways, with the two carriers related by the pc-reflection. Reading 1 (the coordinate-system reading) is confirmed in its strongest form; the coordinate ambiguity's algebra is the Klein-4 unit subgroup {1,5,7,11}. Measurement only; the semantic binding (GOVERNS) remains separately gated.",
    },
    scopingAccretion: {
      canonicity: "the affine transformation is uniquely determined (u = 5, the only unit satisfying 11u = 7 (mod 12)); the coordinate systems are canonically related, not conventionally related",
      klein4: "the transformation lives in Aff(Z12)'s unit subgroup {1,5,7,11} = Klein-4; T1 and T2 are its two setwise-carrying non-trivial elements; the third non-trivial element (rho = x -> 11x) is their composition; all four elements are involutions and the group is commutative",
      c2Note: "recorded per OD-CT-7: T1's existence is consistent with the C2 fiber-bundle reading (the interval parameter as fiber coordinate) without endorsing it - vocabulary, not verdict",
    },
    bindingGate: {
      status: "SEPARATELY_GATED",
      statement: "the search measures the coordinate correspondence (a geometric result). What the result means for the GOVERNS relation - whether the coordinate identity binds A0 to D7 materially, whether GOVERNS follows - is a semantic claim, gated separately on its own evidence, not this artifact's content. No mechanism claim; no GOVERNS admission; no record amendment occurs here.",
    },
    gates: {
      "V-CT-1": {
        result: "PASS",
        statement: "transformation verification: all 48 candidate maps were tested against the two cycles' landed edge sets, derived masks-only (D7 path 11 x6 + closure 6; A0 path 7 x6 + closure 6); each image edge was checked as an exact rotation against the target cycle's edge set; exactly two setwise maps (one directed, one reversed); every other candidate mismatches",
      },
      "V-CT-2": {
        result: "PASS",
        statement: "the reflection constraint: pc-level (T2 = rho o T1; T1 o T2 = rho) and index-level (T1 aligns phi-1/r0/even; T2 aligns phi-2/refl6/odd) recorded separately",
      },
      "V-CT-3": {
        result: "PASS",
        statement: "the accounting is complete: the masks-only computation tier, the labelled chain-comparison tier, and the remaining granted material (the partition, the presentation starts, the closed vocabularies)",
      },
    },
    accounting: {
      masksOnly: [
        "both cycles re-derived masks-only (the D7 ^11 path + ^6 return; the A0 Hamming-2 path + ^6 closure) from the tier/role partition and masks",
        "the 48-map Aff(Z12) search (setwise / directed / reversed classification; carrier image orders, intervals, Hammings, pcSums)",
        "the necessity table (11u and 6u mod 12 per unit), the composition-closure test, and the pc-level reflection composition",
      ],
      canonicalComputation: [
        "the D7 and A0 tier/role membership (the ledger's tier/role partition; labelled, as in BL-073)",
        "the chain fingerprints (BL-073, BL-071, BL-070; self-checked) and the Gate 3 receipt status",
        "the witness cross-check (BL-073 phi-1/phi-2 maps; labelled comparison, never a search input)",
      ],
      remainingGranted: [
        "the tier/role partition itself (the ledger's marking)",
        "the presentation start points (127 for the D7 cycle; the lower-pcSum endpoint 1387 for the A0 cycle) - both cycles are closed; the start points are presentation only",
        "the closed vocabularies (the level ids S/D/U, the branch labels, the carrier ids T1/T2)",
      ],
      statement: "the search is discharged masks-only; the chain layer supplies fingerprints and the witness comparison targets only",
    },
    crossChecks: {
      bl073Anchor: {
        source: "orrery/src/generated/bl073-isometry-probe.v1.json (cycles + phi witnesses; fingerprint self-check)",
        statement: "the derived cycles equal the landed BL-073 cycles key-for-key; T1's image order equals the phi-1 targets; T2's image order equals the phi-2 targets",
        matchesDerived: true,
      },
      d7LandedIntervals: {
        source: "orrery/src/generated/bl070-d7-derivation.v1.json orbitalRotation + qa/d4-r2-execution-receipt.json d7Analogue.cycleTwinVerification.perEdge",
        statement: "every derived directed edge matches the landed BL-070 and Gate 3 per-edge intervals key-for-key (11 x6, 6 x1)",
        matchesDerived: true,
      },
      a0LandedUniverse: {
        source: "orrery/src/generated/bl071-interval-6-structure.v1.json census.universes[A0-P7]",
        statement: "the derived ring's member set equals the landed A0-P7 universe; the landed rotation-6 witness 1387:2773 is the derived closure edge",
        matchesDerived: true,
      },
      chainFingerprints: {
        bl073: bl073Fingerprint,
        bl071: bl071Fingerprint,
        bl070: bl070Fingerprint,
      },
    },
    fences: {
      d7HypothesisTier: "D7 remains hypothesis-tier throughout: no D7 claim event, no D7 record amendment, no D7 derivation admission; ENTRY 15's D7 clause carries forward verbatim (provenance/DECISION_LEDGER.md:2703-2712)",
      measurementOnly: "the coordinate search is measurement; the scoping accretion is planning vocabulary; neither is a claim event, neither amends records, neither touches the GOVERNS relation's formal status",
      governsAdmission: "none; the binding interpretation (what the coordinate correspondence means for GOVERNS) is separately gated per the bindingGate block",
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
      "orrery/src/generated/bl073-isometry-probe.v1.json (cycles D7/A0 orders and edges; phi-1/phi-2 witness maps; branch PARTIAL_ISOMETRY; fingerprint self-checked)",
      "scrum/plan/bl-073-dual-cycle-isometry-and-synthesis-scoping.md (section 1.2 the four properties; section 1.3 the two-interval parallel; section 7 the tri-reading register and the BL-075 capture reference)",
      "scrum/BACKLOG.md (the BL-075 capture: pre-registration of the transformation class, preservation set and branch table required)",
      "orrery/src/generated/bl071-interval-6-structure.v1.json (census.universes[A0-P7] memberStates and the closure witness 1387:2773; liftedSpace endpoint congruence)",
      "orrery/src/generated/bl070-d7-derivation.v1.json (orbitalRotation perEdge rotateInterval 11 x6 + 6 x1; the interval-transport refinement)",
      "qa/d4-r2-execution-receipt.json (d7Analogue.cycleTwinVerification perEdge bytes; status execution_verified)",
      "canonical/universal-heptatonic-ledger.csv (the tier/role partition and pitch sets; masks derived)",
      "scrum/plan/bl-059-governs-derivability-scoping-memo.md (section 4.10 the orientation bit's registrations; the un-granting context)",
      "scrum/plan/bl-063-office-reconstruction-memo.md (the kappa reflection orientation; the one-bit inventory the coordinate pair parallels)",
      "scrum/plan/bl-067-governs-semantic-synthesis.md (the boundary layer's synthesis; the open-edge inventory)",
      "scrum/plan/harmonic-comprehension-map.md (sections 5.6/5.7 the registered measured findings; the membrane boundary)",
    ],
    notAccomplished: [
      "no claim event; no record amendment (ENTRY 10/15/16 byte-untouched; BL-063/BL-065/BL-070/BL-071/BL-073 as landed)",
      "no GOVERNS admission; no GOVERNS authority change; the binding interpretation of the coordinate result stays separately gated",
      "no G1 movement (no intra-330 edges assumed, emitted, or consumed); no INV-5 graduation; no M-walkability promotion",
      "no mechanism claim beyond the recorded arithmetic (the search verifies the transformation; the why of the design remains open)",
      "no canonical/Court/schema/Neo4j writes; no ledger writes",
      "no directional-semantics assignment; no lens application as evidence; the frame is vocabulary, not input; session prose is context, not evidence",
      "no C2 endorsement (the fiber-coordinate note is vocabulary per OD-CT-7)",
      "the search resolves the PARTIAL_ISOMETRY's interpretation at planning level; it does not amend records or admit claims",
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
    search: {
      maps: investigation.search.mapCount,
      classL0: investigation.search.classL0,
      classL1: investigation.search.classL1,
      carriers: investigation.search.carriers.map((carrier) =>
        `${carrier.id}: u=${carrier.unit} t=${carrier.translation} level=${carrier.level}`),
    },
    necessityUniqueUnit: investigation.necessity.uniqueUnit,
    group: {
      order: investigation.group.order,
      closed: investigation.group.closed,
      isomorphicTo: investigation.group.isomorphicTo,
    },
    reflection: {
      pcLevel: investigation.reflection.pcLevel.verified,
      indexLevel: investigation.reflection.indexLevel.verified,
    },
    branch: investigation.branch.label,
    reading: investigation.branch.reading,
    investigationFingerprint: investigation.investigationFingerprint,
  };
  if (check) {
    const existing = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, "utf8") : null;
    if (existing !== serialized) throw new Error("STALE_BL075_COORDINATE_SEARCH");
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
