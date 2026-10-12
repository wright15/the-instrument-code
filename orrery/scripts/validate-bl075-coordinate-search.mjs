#!/usr/bin/env node
/**
 * Validate the generated BL-075 coordinate search against its sources.
 *
 * Independent of the generator: re-reads the 462-record ledger and the chain
 * artifacts (BL-073, BL-071, BL-070, the Gate 3 receipt); re-derives both
 * seven-cycles masks-only (the D7 ^11 path + ^6 return; the A0 Hamming-2
 * path + ^6 closure); re-runs the whole coordinate search independently
 * (the 48-map Aff(Z12) census with an exists-a-shift forward/backward
 * classification, the necessity table, the composition-closure test, the
 * pc-level reflection composition); re-checks the landed witness alignment
 * (T1 <-> phi-1, T2 <-> phi-2) key-for-key; re-checks the artifact
 * fingerprint; statically verifies the generator's census-core region
 * (forbidden label/record reads absent, required masks-only reads present);
 * and runs mutation probes (artifact drift, smuggled reads, presence-strip).
 * Fail-loud.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..", "..");

const ARTIFACT_PATH = "orrery/src/generated/bl075-coordinate-search.v1.json";
const GENERATOR_PATH = "scripts/build-bl075-coordinate-search.mjs";
const SCHEMA_VERSION = "harmonic-orrery.bl075-coordinate-search.v1";
const INVESTIGATION_ID = "BL075_COORDINATE_SEARCH_V1";
const LEDGER_PATH = "canonical/universal-heptatonic-ledger.csv";
const BL073_PATH = "orrery/src/generated/bl073-isometry-probe.v1.json";
const BL071_PATH = "orrery/src/generated/bl071-interval-6-structure.v1.json";
const BL070_PATH = "orrery/src/generated/bl070-d7-derivation.v1.json";
const GATE3_PATH = "qa/d4-r2-execution-receipt.json";

const BL073_FINGERPRINT = "811fa786f3a03b03b0c334fe797c85b9b4aeed93332a183be43f86fa1133a65c";
const BL071_FINGERPRINT = "8b2a1f6ca1776851f721eb6bc6ee6532059d81d150ce3f7c9fda1febfe84c3fe";
const BL070_FINGERPRINT = "9db10a088a05664a5cf60f6fad14514a4fc9aab278dcf0359d684bce70607731";

const D7_ORDER_EXPECTED = ["127", "2111", "3103", "3599", "3847", "3971", "4033"];
const A0_ORDER_EXPECTED = ["1387", "1451", "1453", "1709", "1717", "2741", "2773"];
const D7_INTERVALS_EXPECTED = [11, 11, 11, 11, 11, 11, 6];
const A0_INTERVALS_EXPECTED = [7, 7, 7, 7, 7, 7, 6];
const CYCLE_HAMMING_EXPECTED = [2, 2, 2, 2, 2, 2, 10];
const D7_PC_SUM_LADDER = [21, 26, 31, 36, 41, 46, 51];
const A0_PC_SUM_LADDER = [33, 34, 35, 36, 37, 38, 39];
const UNITS_EXPECTED = [1, 5, 7, 11];
const T1_IMAGE_INTERVALS = [7, 7, 7, 7, 7, 7, 6];
const T2_IMAGE_INTERVALS = [5, 5, 5, 5, 5, 5, 6];
const CARRIER_HAMMING = [2, 2, 2, 2, 2, 2, 10];
const T1_IMAGE_PC_SUMS = [33, 34, 35, 36, 37, 38, 39];
const T2_IMAGE_PC_SUMS = [39, 38, 37, 36, 35, 34, 33];
const T1_IMAGE_ORDER = ["1387", "1451", "1453", "1709", "1717", "2741", "2773"];
const T2_IMAGE_ORDER = ["2773", "2741", "1717", "1709", "1453", "1451", "1387"];
const NECESSITY_EXPECTED = [
  { unit: 1, transportedPath: 11, transportedClosure: 6, carriesPathAddress: false },
  { unit: 5, transportedPath: 7, transportedClosure: 6, carriesPathAddress: true },
  { unit: 7, transportedPath: 5, transportedClosure: 6, carriesPathAddress: false },
  { unit: 11, transportedPath: 1, transportedClosure: 6, carriesPathAddress: false },
];
const GROUP_RELATIONS_EXPECTED = [
  { expression: "M5 o M5", result: "M1" },
  { expression: "M7 o M7", result: "M1" },
  { expression: "M5 o M7", result: "M11" },
  { expression: "M7 o M5", result: "M11" },
  { expression: "M11 o M5", result: "M7" },
  { expression: "M11 o M7", result: "M5" },
];

function fail(message) {
  throw new Error(`INVALID_BL075_COORDINATE_SEARCH: ${message}`);
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

function fileSha(relativePath) {
  return sha256(fs.readFileSync(path.join(root, relativePath)));
}

function canonicalText(value) {
  if (value === null) return "null";
  if (value === true) return "true";
  if (value === false) return "false";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isInteger(value)) fail("non-integer number in payload");
    return String(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalText).join(",")}]`;
  if (typeof value === "object") {
    const keys = Object.keys(value).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${canonicalText(value[key])}`).join(",")}}`;
  }
  fail(`unsupported JSON type: ${typeof value}`);
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') { field += '"'; index += 1; }
      else if (character === '"') quoted = false;
      else field += character;
    } else if (character === '"') quoted = true;
    else if (character === ",") { row.push(field); field = ""; }
    else if (character === "\n") { row.push(field.replace(/\r$/, "")); rows.push(row); row = []; field = ""; }
    else field += character;
  }
  if (field.length > 0 || row.length > 0) { row.push(field.replace(/\r$/, "")); rows.push(row); }
  const [headers, ...records] = rows;
  return records.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index]])));
}

function parsePitchSet(text) {
  const trimmed = text.replace(/[{}]/g, "");
  if (trimmed.length === 0) return [];
  return trimmed.split(",").map((value) => Number(value));
}

const cmp = (left, right) => (left < right ? -1 : left > right ? 1 : 0);
const cmpNumericStrings = (left, right) => Number(left) - Number(right);

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

function maskOfPitches(pitches) {
  let mask = 0;
  for (const pitch of pitches) mask |= 1 << pitch;
  return mask;
}

function hamming12(a, b) {
  let x = a ^ b;
  let count = 0;
  while (x !== 0) { count += 1; x &= x - 1; }
  return count;
}

function rotateMask12(mask, d) {
  const shift = ((d % 12) + 12) % 12;
  if (shift === 0) return mask & 4095;
  return (((mask << shift) & 4095) | (mask >> (12 - shift))) & 4095;
}

function pcSumOfMask(mask) {
  let sum = 0;
  for (let pitch = 0; pitch < 12; pitch += 1) if ((mask >> pitch) & 1) sum += pitch;
  return sum;
}

function affineMask(mask, unit, translation) {
  let image = 0;
  for (let pitch = 0; pitch < 12; pitch += 1) {
    if ((mask >> pitch) & 1) {
      const target = (((unit * pitch + translation) % 12) + 12) % 12;
      image |= 1 << target;
    }
  }
  return image & 4095;
}

function composeAffine(outer, inner) {
  return {
    unit: (outer.unit * inner.unit) % 12,
    translation: (outer.unit * inner.translation + outer.translation) % 12,
  };
}

// ---------------------------------------------------------------------------
// Independent re-derivation
// ---------------------------------------------------------------------------

function reDerive(sources) {
  const { ledgerRows, bl073, bl071, bl070, gate3 } = sources;
  if (ledgerRows.length !== 462) fail(`ledger census ${ledgerRows.length}`);
  const masks = new Map(ledgerRows.map((row) => [String(row.id), maskOfPitches(parsePitchSet(row.pitchSet))]));
  for (const row of ledgerRows) {
    if (masks.get(String(row.id)) !== Number(row.id)) fail(`ledger mask/id disagreement at ${row.id}`);
  }

  const membersOf = (tier, role) => ledgerRows
    .filter((row) => row.tier === tier && (row.role === role))
    .map((row) => String(row.id))
    .sort(cmpNumericStrings);
  const d7Anchors = membersOf("D7", "anchor");
  const a0Anchors = membersOf("A0", "anchor");
  if (d7Anchors.length !== 7 || a0Anchors.length !== 7) fail("partition census drift");

  // D7 cycle: the ^11 path + the ^6 return (walk from the unique ^11 source).
  const d7Successor = new Map();
  for (const a of d7Anchors) {
    const target = rotateMask12(masks.get(a), 11);
    const hit = d7Anchors.find((b) => masks.get(b) === target);
    if (hit) d7Successor.set(a, hit);
  }
  if (d7Successor.size !== 6) fail("D7 ^11 edge census drift");
  const d7Targets = new Set([...d7Successor.values()]);
  const d7Starts = d7Anchors.filter((node) => !d7Targets.has(node));
  if (d7Starts.length !== 1) fail("D7 ^11 start census drift");
  const d7Order = [d7Starts[0]];
  for (let step = 0; step < 6; step += 1) {
    const next = d7Successor.get(d7Order[d7Order.length - 1]);
    if (!next) fail("D7 ^11 walk dead-end");
    d7Order.push(next);
  }
  if (rotateMask12(masks.get(d7Order[6]), 6) !== masks.get(d7Order[0])) fail("D7 ^6 closure drift");
  if (canonicalText(d7Order) !== canonicalText(D7_ORDER_EXPECTED)) fail("D7 order cross-check drift");

  // A0 ring: the Hamming-2 path from the lower-pcSum endpoint + the ^6 closure.
  const a0Adjacency = new Map(a0Anchors.map((node) => [node, []]));
  for (let left = 0; left < a0Anchors.length; left += 1) {
    for (let right = left + 1; right < a0Anchors.length; right += 1) {
      if (hamming12(masks.get(a0Anchors[left]), masks.get(a0Anchors[right])) === 2) {
        a0Adjacency.get(a0Anchors[left]).push(a0Anchors[right]);
        a0Adjacency.get(a0Anchors[right]).push(a0Anchors[left]);
      }
    }
  }
  const a0Endpoints = a0Anchors.filter((node) => a0Adjacency.get(node).length === 1);
  if (a0Endpoints.length !== 2) fail("A0 path endpoint census drift");
  const endpointChoice = pcSumOfMask(masks.get(a0Endpoints[0])) <= pcSumOfMask(masks.get(a0Endpoints[1]))
    ? a0Endpoints[0]
    : a0Endpoints[1];
  const a0Order = [endpointChoice];
  for (let step = 0; step < 6; step += 1) {
    const cursor = a0Order[a0Order.length - 1];
    const previous = step === 0 ? null : a0Order[a0Order.length - 2];
    const next = a0Adjacency.get(cursor).find((neighbor) => neighbor !== previous);
    if (!next) fail("A0 Hamming-2 walk dead-end");
    a0Order.push(next);
  }
  if (rotateMask12(masks.get(a0Order[6]), 6) !== masks.get(a0Order[0])) fail("A0 ^6 closure drift");
  if (canonicalText(a0Order) !== canonicalText(A0_ORDER_EXPECTED)) fail("A0 order cross-check drift");

  const directedEdges = (order) => {
    const edges = [];
    for (let index = 0; index < order.length; index += 1) {
      const a = order[index];
      const b = order[(index + 1) % order.length];
      const hamming = hamming12(masks.get(a), masks.get(b));
      const intervals = [];
      for (let d = 1; d <= 11; d += 1) if (rotateMask12(masks.get(a), d) === masks.get(b)) intervals.push(d);
      if (intervals.length !== 1) fail(`cycle edge not an exact rotation at ${a}->${b}`);
      edges.push({ a, b, hamming, rotateInterval: intervals[0], closure: hamming !== 2 });
    }
    return edges;
  };
  const d7Edges = directedEdges(d7Order);
  const a0Edges = directedEdges(a0Order);
  if (canonicalText(d7Edges.map((edge) => edge.rotateInterval)) !== canonicalText(D7_INTERVALS_EXPECTED)) {
    fail("D7 interval inventory drift");
  }
  if (canonicalText(a0Edges.map((edge) => edge.rotateInterval)) !== canonicalText(A0_INTERVALS_EXPECTED)) {
    fail("A0 interval inventory drift");
  }
  if (canonicalText(d7Edges.map((edge) => edge.hamming)) !== canonicalText(CYCLE_HAMMING_EXPECTED) ||
      canonicalText(a0Edges.map((edge) => edge.hamming)) !== canonicalText(CYCLE_HAMMING_EXPECTED)) {
    fail("cycle hamming inventory drift");
  }
  const d7PcSums = d7Order.map((state) => pcSumOfMask(masks.get(state)));
  const a0PcSums = a0Order.map((state) => pcSumOfMask(masks.get(state)));
  if (canonicalText(d7PcSums) !== canonicalText(D7_PC_SUM_LADDER)) fail("D7 ladder drift");
  if (canonicalText(a0PcSums) !== canonicalText(A0_PC_SUM_LADDER)) fail("A0 ladder drift");

  // The affine search, re-implemented independently: exists-a-shift forward
  // and backward classification on the image sequences.
  const units = [];
  for (let candidate = 1; candidate < 12; candidate += 1) {
    if (gcd(candidate, 12) === 1) units.push(candidate);
  }
  if (canonicalText(units) !== canonicalText(UNITS_EXPECTED)) fail("unit census drift");
  const d7Masks = d7Order.map((state) => masks.get(state));
  const a0Masks = a0Order.map((state) => masks.get(state));
  const a0MaskSet = new Set(a0Masks);
  const searchRows = [];
  for (const unit of units) {
    for (let translation = 0; translation < 12; translation += 1) {
      const imageMasks = d7Masks.map((mask) => affineMask(mask, unit, translation));
      const setwise = new Set(imageMasks).size === 7 && imageMasks.every((mask) => a0MaskSet.has(mask));
      let directed = false;
      let reversed = false;
      let imageIntervals = null;
      let imageHamming = null;
      if (setwise) {
        const forward = [0, 1, 2, 3, 4, 5, 6].some((shift) =>
          imageMasks.every((mask, index) => mask === a0Masks[(index + shift) % 7]));
        const backward = [0, 1, 2, 3, 4, 5, 6].some((shift) =>
          imageMasks.every((mask, index) => mask === a0Masks[(((shift - index) % 7) + 7) % 7]));
        directed = forward;
        reversed = !forward && backward;
        imageIntervals = [];
        imageHamming = [];
        for (let index = 0; index < 7; index += 1) {
          const from = imageMasks[index];
          const to = imageMasks[(index + 1) % 7];
          const intervals = [];
          for (let d = 1; d <= 11; d += 1) if (rotateMask12(from, d) === to) intervals.push(d);
          imageIntervals.push(intervals.length === 1 ? intervals[0] : null);
          imageHamming.push(hamming12(from, to));
        }
      }
      searchRows.push({ unit, translation, setwise, directed, reversed, imageIntervals, imageHamming });
    }
  }
  const countsOf = (candidateRows) => ({
    size: candidateRows.length,
    setwise: candidateRows.filter((row) => row.setwise).length,
    directed: candidateRows.filter((row) => row.directed).length,
    reversed: candidateRows.filter((row) => row.reversed).length,
  });
  const classL0 = countsOf(searchRows.filter((row) => row.unit === 1));
  const classL1 = countsOf(searchRows);
  if (canonicalText(classL0) !== canonicalText({ size: 12, setwise: 0, directed: 0, reversed: 0 })) fail("L0 census drift");
  if (canonicalText(classL1) !== canonicalText({ size: 48, setwise: 2, directed: 1, reversed: 1 })) fail("L1 census drift");
  const tCensus = {};
  for (const unit of units) {
    tCensus[String(unit)] = searchRows.filter((row) => row.unit === unit && row.setwise).map((row) => row.translation);
  }
  if (canonicalText(tCensus) !== canonicalText({ "1": [], "5": [0], "7": [0], "11": [] })) fail("t-census drift");
  const directedRows = searchRows.filter((row) => row.directed);
  const reversedRows = searchRows.filter((row) => row.reversed);
  if (directedRows.length !== 1 || reversedRows.length !== 1) fail("carrier census drift");
  const a0StateByMask = new Map(a0Masks.map((mask, index) => [mask, a0Order[index]]));
  const carrierOf = (row, id, level) => ({
    id,
    unit: row.unit,
    translation: row.translation,
    level,
    directed: row.directed,
    reversed: row.reversed,
    imageOrder: d7Masks.map((mask) => a0StateByMask.get(affineMask(mask, row.unit, row.translation))),
    imageIntervals: row.imageIntervals,
    imageHamming: row.imageHamming,
    imagePcSums: d7Masks.map((mask) => pcSumOfMask(affineMask(mask, row.unit, row.translation))),
  });
  const carriers = { T1: carrierOf(directedRows[0], "T1", "D"), T2: carrierOf(reversedRows[0], "T2", "U") };
  if (carriers.T1.unit !== 5 || carriers.T1.translation !== 0) fail("T1 identity drift");
  if (carriers.T2.unit !== 7 || carriers.T2.translation !== 0) fail("T2 identity drift");
  if (canonicalText(carriers.T1.imageOrder) !== canonicalText(T1_IMAGE_ORDER)) fail("T1 image order drift");
  if (canonicalText(carriers.T2.imageOrder) !== canonicalText(T2_IMAGE_ORDER)) fail("T2 image order drift");
  if (canonicalText(carriers.T1.imageIntervals) !== canonicalText(T1_IMAGE_INTERVALS)) fail("T1 intervals drift");
  if (canonicalText(carriers.T2.imageIntervals) !== canonicalText(T2_IMAGE_INTERVALS)) fail("T2 intervals drift");
  if (canonicalText(carriers.T1.imageHamming) !== canonicalText(CARRIER_HAMMING)) fail("T1 hamming drift");
  if (canonicalText(carriers.T2.imageHamming) !== canonicalText(CARRIER_HAMMING)) fail("T2 hamming drift");
  if (canonicalText(carriers.T1.imagePcSums) !== canonicalText(T1_IMAGE_PC_SUMS)) fail("T1 pcSums drift");
  if (canonicalText(carriers.T2.imagePcSums) !== canonicalText(T2_IMAGE_PC_SUMS)) fail("T2 pcSums drift");

  // Necessity table.
  const necessity = units.map((unit) => {
    const transportedPath = (11 * unit) % 12;
    return {
      unit,
      transportedPath,
      transportedClosure: (6 * unit) % 12,
      carriesPathAddress: transportedPath === 7,
    };
  });
  if (canonicalText(necessity) !== canonicalText(NECESSITY_EXPECTED)) fail("necessity table drift");

  // Composition closure of the unit maps.
  const groupElements = units.map((unit) => ({ id: `M${unit}`, unit, translation: 0 }));
  const memberKeys = new Set(groupElements.map((element) => `${element.unit}:${element.translation}`));
  const products = [];
  let closed = true;
  let commutative = true;
  for (const outer of groupElements) {
    for (const inner of groupElements) {
      const product = composeAffine(outer, inner);
      const reversedProduct = composeAffine(inner, outer);
      const inside = memberKeys.has(`${product.unit}:${product.translation}`);
      if (!inside) closed = false;
      if (product.unit !== reversedProduct.unit || product.translation !== reversedProduct.translation) commutative = false;
      products.push({ outer: outer.id, inner: inner.id, product: `M${product.unit}`, inside });
    }
  }
  const allInvolutions = groupElements.every((element) => {
    const square = composeAffine(element, element);
    return square.unit === 1 && square.translation === 0;
  });
  if (!closed || !commutative || !allInvolutions) fail("group structure drift");

  // pc-level reflection composition.
  const rho = { unit: 11, translation: 0 };
  const rhoT1 = composeAffine(rho, { unit: carriers.T1.unit, translation: carriers.T1.translation });
  const rhoT2 = composeAffine(rho, { unit: carriers.T2.unit, translation: carriers.T2.translation });
  if (rhoT1.unit !== carriers.T2.unit || rhoT2.unit !== carriers.T1.unit) fail("pc reflection relation drift");

  // Landed witness alignment (BL-073).
  const phi1 = bl073.phiWitnesses.witnesses.find((witness) => witness.id === "phi-1");
  const phi2 = bl073.phiWitnesses.witnesses.find((witness) => witness.id === "phi-2");
  if (!phi1 || !phi2) fail("BL-073 witness inventory drift");
  if (phi1.dihedralElement !== "r0" || phi1.kind !== "rotation" || phi1.parity !== "even" || phi1.inversions !== 0) {
    fail("phi-1 classification drift");
  }
  if (phi2.dihedralElement !== "refl6" || phi2.kind !== "reflection" || phi2.parity !== "odd" || phi2.inversions !== 21) {
    fail("phi-2 classification drift");
  }
  if (canonicalText(phi1.map.map((entry) => entry.a0)) !== canonicalText(carriers.T1.imageOrder)) {
    fail("T1 vs phi-1 target drift");
  }
  if (canonicalText(phi2.map.map((entry) => entry.a0)) !== canonicalText(carriers.T2.imageOrder)) {
    fail("T2 vs phi-2 target drift");
  }

  // Landed cycle cross-checks (BL-073, BL-070, Gate 3, BL-071).
  if (canonicalText(d7Order) !== canonicalText(bl073.cycles.D7.order)) fail("BL-073 D7 order cross-check drift");
  if (canonicalText(a0Order) !== canonicalText(bl073.cycles.A0.order)) fail("BL-073 A0 order cross-check drift");
  if (canonicalText(d7Edges) !== canonicalText(bl073.cycles.D7.edges)) fail("BL-073 D7 edge cross-check drift");
  if (canonicalText(a0Edges) !== canonicalText(bl073.cycles.A0.edges)) fail("BL-073 A0 edge cross-check drift");
  for (const edge of d7Edges) {
    const landed = bl070.orbitalRotation.perEdge.find((entry) => String(entry.a) === edge.a && String(entry.b) === edge.b);
    if (!landed || landed.rotateInterval !== edge.rotateInterval) fail(`BL-070 per-edge drift at ${edge.a}->${edge.b}`);
    const gate3Edge = gate3.d7Analogue.cycleTwinVerification.perEdge.find(
      (entry) => String(entry.a) === edge.a && String(entry.b) === edge.b,
    );
    if (!gate3Edge || gate3Edge.rotateInterval !== edge.rotateInterval) fail(`Gate 3 per-edge drift at ${edge.a}->${edge.b}`);
  }
  const a0Universe = bl071.census.universes.find((universe) => universe.id === "A0-P7");
  if (!a0Universe) fail("BL-071 A0-P7 universe missing");
  if (canonicalText(a0Universe.memberStates.slice().sort(cmp)) !== canonicalText(a0Order.slice().sort(cmp))) {
    fail("BL-071 A0-P7 member drift");
  }
  if (canonicalText(a0Universe.rotation6Witnesses) !== canonicalText(["1387:2773"])) fail("BL-071 closure witness drift");

  return {
    sources,
    masks,
    d7Order, a0Order, d7Edges, a0Edges, d7PcSums, a0PcSums,
    units, searchRows, classL0, classL1, tCensus, carriers,
    necessity, group: { elements: groupElements, products, closed, commutative, allInvolutions },
    phi1, phi2,
  };
}

// ---------------------------------------------------------------------------
// Artifact checks
// ---------------------------------------------------------------------------

function checkAgainstSources(artifact, derived) {
  if (artifact.schemaVersion !== SCHEMA_VERSION || artifact.investigationId !== INVESTIGATION_ID) {
    fail("artifact header drift");
  }
  if (artifact.status !== "planning_evidence") fail("status drift");
  if (artifact.generator !== GENERATOR_PATH) fail("generator path drift");

  const bindingPaths = artifact.sourceBindings.map((binding) => binding.artifact);
  if (canonicalText([...bindingPaths].sort()) !== canonicalText([
    BL070_PATH, BL071_PATH, BL073_PATH, GATE3_PATH, LEDGER_PATH,
  ].sort())) fail("source binding set drift");
  for (const binding of artifact.sourceBindings) {
    if (binding.sha256 !== fileSha(binding.artifact)) fail(`source binding sha drift: ${binding.artifact}`);
  }
  if (artifact.base.bl073.investigationFingerprint !== BL073_FINGERPRINT) fail("BL-073 chain literal drift");
  if (artifact.base.bl071.investigationFingerprint !== BL071_FINGERPRINT) fail("BL-071 chain literal drift");
  if (artifact.base.bl070.derivationFingerprint !== BL070_FINGERPRINT) fail("BL-070 chain literal drift");
  const { investigationFingerprint: bl073Fingerprint, ...bl073Core } = derived.sources.bl073;
  if (sha256(canonicalText(bl073Core)) !== bl073Fingerprint || bl073Fingerprint !== BL073_FINGERPRINT) {
    fail("BL-073 fingerprint self-check drift");
  }
  const { investigationFingerprint: bl071Fingerprint, ...bl071Core } = derived.sources.bl071;
  if (sha256(canonicalText(bl071Core)) !== bl071Fingerprint || bl071Fingerprint !== BL071_FINGERPRINT) {
    fail("BL-071 fingerprint self-check drift");
  }
  const { derivationFingerprint: bl070Fingerprint, ...bl070Core } = derived.sources.bl070;
  if (sha256(canonicalText(bl070Core)) !== bl070Fingerprint || bl070Fingerprint !== BL070_FINGERPRINT) {
    fail("BL-070 fingerprint self-check drift");
  }

  // pre-registration
  const rulingIds = artifact.preRegistration.rulings.map((ruling) => ruling.id);
  if (canonicalText(rulingIds) !== canonicalText([
    "OD-CT-1", "OD-CT-2", "OD-CT-3", "OD-CT-4", "OD-CT-5", "OD-CT-6", "OD-CT-7",
  ])) fail("ruling inventory drift");
  if (artifact.preRegistration.hypothesis.predictedBranch !== "CHIRAL_PAIR") fail("predicted branch drift");
  if (!artifact.preRegistration.hypothesis.primary.includes("u=5")) fail("primary hypothesis drift");
  if (!artifact.preRegistration.hypothesis.chiralPartner.includes("u=7")) fail("chiral hypothesis drift");
  if (!artifact.preRegistration.hypothesis.necessity.includes("11u = 7")) fail("necessity hypothesis drift");
  for (const level of ["S", "D", "U"]) {
    if (!artifact.preRegistration.levels[level]) fail(`level definition missing: ${level}`);
  }
  for (const key of ["coordinateMapFound", "chiralPair", "partialMap", "noMap"]) {
    if (!artifact.preRegistration.branchTable[key]) fail(`branch table key missing: ${key}`);
  }
  if (!artifact.preRegistration.reindexingClassDisposition.includes("0/5040")) fail("reindexing disposition drift");

  // cycles
  const d7 = artifact.cycles.D7;
  const a0 = artifact.cycles.A0;
  if (canonicalText(d7.order) !== canonicalText(derived.d7Order)) fail("D7 artifact order drift");
  if (canonicalText(a0.order) !== canonicalText(derived.a0Order)) fail("A0 artifact order drift");
  if (canonicalText(d7.masks) !== canonicalText(d7.order.map((state) => derived.masks.get(state)))) fail("D7 mask list drift");
  if (canonicalText(a0.masks) !== canonicalText(a0.order.map((state) => derived.masks.get(state)))) fail("A0 mask list drift");
  if (canonicalText(d7.edges) !== canonicalText(derived.d7Edges)) fail("D7 artifact edge drift");
  if (canonicalText(a0.edges) !== canonicalText(derived.a0Edges)) fail("A0 artifact edge drift");
  if (canonicalText(d7.closureEdge) !== canonicalText(derived.d7Edges[6])) fail("D7 closure edge drift");
  if (canonicalText(a0.closureEdge) !== canonicalText(derived.a0Edges[6])) fail("A0 closure edge drift");
  if (canonicalText(d7.pcSumLadder) !== canonicalText(derived.d7PcSums) || d7.pcSumStep !== 5) fail("D7 ladder drift");
  if (canonicalText(a0.pcSumLadder) !== canonicalText(derived.a0PcSums) || a0.pcSumStep !== 1) fail("A0 ladder drift");

  // search
  const search = artifact.search;
  if (canonicalText(search.units) !== canonicalText(derived.units)) fail("search units drift");
  if (search.mapCount !== 48 || search.census.length !== 48) fail("search census size drift");
  if (search.classL0.size !== derived.classL0.size || search.classL0.setwise !== derived.classL0.setwise ||
      search.classL0.directed !== derived.classL0.directed || search.classL0.reversed !== derived.classL0.reversed) {
    fail("L0 artifact census drift");
  }
  if (!search.classL0.statement.includes("(0/12)")) fail("L0 statement drift");
  if (search.classL1.size !== derived.classL1.size || search.classL1.setwise !== derived.classL1.setwise ||
      search.classL1.directed !== derived.classL1.directed || search.classL1.reversed !== derived.classL1.reversed) {
    fail("L1 artifact census drift");
  }
  if (!search.classL1.statement.includes("exactly two setwise maps")) fail("L1 statement drift");
  if (canonicalText(search.tCensus) !== canonicalText(derived.tCensus)) fail("tCensus drift");
  if (canonicalText(search.census) !== canonicalText(derived.searchRows)) fail("search census rows drift");
  if (search.carriers.length !== 2) fail("carrier inventory drift");
  for (const expected of [derived.carriers.T1, derived.carriers.T2]) {
    const carrier = search.carriers.find((candidate) => candidate.id === expected.id);
    if (!carrier) fail(`carrier missing: ${expected.id}`);
    if (carrier.unit !== expected.unit || carrier.translation !== expected.translation) fail(`carrier identity drift: ${expected.id}`);
    if (carrier.level !== expected.level) fail(`carrier level drift: ${expected.id}`);
    if (typeof carrier.map !== "string" || !carrier.map.includes(`${expected.unit}x`)) fail(`carrier map string drift: ${expected.id}`);
    if (carrier.setwise !== true || typeof carrier.role !== "string" || carrier.role.length === 0) fail(`carrier flags drift: ${expected.id}`);
    if (carrier.directed !== expected.directed || carrier.reversed !== expected.reversed) fail(`carrier orientation flags drift: ${expected.id}`);
    if (canonicalText(carrier.imageOrder) !== canonicalText(expected.imageOrder)) fail(`carrier image order drift: ${expected.id}`);
    if (canonicalText(carrier.imageIntervals) !== canonicalText(expected.imageIntervals)) fail(`carrier intervals drift: ${expected.id}`);
    if (canonicalText(carrier.imageHamming) !== canonicalText(expected.imageHamming)) fail(`carrier hamming drift: ${expected.id}`);
    if (canonicalText(carrier.imagePcSums) !== canonicalText(expected.imagePcSums)) fail(`carrier pcSums drift: ${expected.id}`);
  }
  const t1 = search.carriers.find((carrier) => carrier.id === "T1");
  const t2 = search.carriers.find((carrier) => carrier.id === "T2");
  if (!t1.directed || t1.reversed) fail("T1 orientation flags drift");
  if (t2.directed || !t2.reversed) fail("T2 orientation flags drift");

  // necessity
  if (canonicalText(artifact.necessity.table) !== canonicalText(derived.necessity)) fail("necessity table drift");
  if (artifact.necessity.uniqueUnit !== 5) fail("necessity unique unit drift");
  if (!artifact.necessity.closureInvariance.includes("6u = 6")) fail("closure invariance drift");
  if (!artifact.necessity.requirement.includes("11u = 7")) fail("necessity requirement drift");
  if (!artifact.necessity.conjugacyIdentity.includes("rot^{u*d}")) fail("conjugacy identity drift");

  // group
  const group = artifact.group;
  if (group.order !== 4 || group.closed !== true || group.commutative !== true ||
      group.allInvolutions !== true || group.identityPresent !== true) fail("group flags drift");
  if (!group.isomorphicTo.includes("Klein-4")) fail("group identification drift");
  if (canonicalText(group.products) !== canonicalText(derived.group.products)) fail("group products drift");
  if (canonicalText(group.relations) !== canonicalText(GROUP_RELATIONS_EXPECTED)) fail("group relations drift");
  if (canonicalText(group.workingSet.closure) !== canonicalText(["M1", "M5", "M7", "M11"])) fail("working set closure drift");
  if (group.workingSet.compositionClosed !== false) fail("working set closure flag drift");
  if (group.elements.length !== 4) fail("group element inventory drift");
  for (const element of group.elements) {
    const expectedSetwise = element.unit === 5 || element.unit === 7;
    if (element.setwise !== expectedSetwise) fail(`group element setwise flag drift: ${element.id}`);
    if (element.unit === 1 && (element.map !== "identity" || !element.carries.startsWith("neither"))) {
      fail("identity element description drift");
    }
    if (element.unit === 5 && !element.carries.includes("directed (T1)")) fail("M5 carries description drift");
    if (element.unit === 7 && !element.carries.includes("reversed (T2)")) fail("M7 carries description drift");
    if (element.unit === 11 && (!element.map.includes("rho") || !element.carries.startsWith("neither"))) {
      fail("rho element description drift");
    }
  }

  // reflection
  if (artifact.reflection.status !== "VERIFIED") fail("reflection status drift");
  if (artifact.reflection.pcLevel.verified !== true) fail("pc-level verification flag drift");
  if (!artifact.reflection.pcLevel.reflection.includes("11x")) fail("pc reflection description drift");
  const pcRelations = artifact.reflection.pcLevel.relations;
  if (canonicalText(pcRelations.map((entry) => entry.value)) !== canonicalText(["rho o T1", "rho o T2", "T1 o T2 = T2 o T1"])) {
    fail("pc relation inventory drift");
  }
  if (artifact.reflection.indexLevel.verified !== true) fail("index-level verification flag drift");
  const alignment = artifact.reflection.indexLevel.alignment;
  if (alignment.length !== 2) fail("alignment inventory drift");
  if (canonicalText(alignment[0]) !== canonicalText({
    carrier: "T1", witness: "phi-1", element: "r0", kind: "rotation", parity: "even", orientation: "forward",
  })) fail("T1 alignment drift");
  if (canonicalText(alignment[1]) !== canonicalText({
    carrier: "T2", witness: "phi-2", element: "refl6", kind: "reflection", parity: "odd", orientation: "reversed",
  })) fail("T2 alignment drift");

  // branch
  const branch = artifact.branch;
  if (canonicalText(branch.preRegisteredLabels) !== canonicalText([
    "COORDINATE_MAP_FOUND", "CHIRAL_PAIR", "PARTIAL_MAP", "NO_MAP",
  ])) fail("branch label inventory drift");
  if (canonicalText(branch.fired) !== canonicalText(["COORDINATE_MAP_FOUND", "CHIRAL_PAIR"])) fail("fired branch drift");
  if (branch.label !== "CHIRAL_PAIR") fail("branch label drift");
  if (branch.coordinateMapFound !== true) fail("coordinate-map flag drift");
  if (branch.reading !== "READING_1_CONFIRMED") fail("branch reading drift");
  if (!branch.statement.includes("canonically determined")) fail("branch statement drift");
  if (!branch.statement.includes("separately gated")) fail("branch gating drift");

  // scoping accretion
  if (!artifact.scopingAccretion.canonicity.includes("u = 5")) fail("canonicity sentence drift");
  if (!artifact.scopingAccretion.klein4.includes("Klein-4")) fail("klein4 sentence drift");
  if (!artifact.scopingAccretion.c2Note.includes("without endorsing")) fail("C2 note drift");

  // binding gate, gates, accounting, fences
  if (artifact.bindingGate.status !== "SEPARATELY_GATED") fail("binding gate status drift");
  if (!artifact.bindingGate.statement.includes("No mechanism claim")) fail("binding gate fence drift");
  for (const gate of ["V-CT-1", "V-CT-2", "V-CT-3"]) {
    if (artifact.gates[gate].result !== "PASS") fail(`gate drift: ${gate}`);
  }
  if (!artifact.gates["V-CT-1"].statement.includes("48 candidate maps")) fail("V-CT-1 statement drift");
  if (!artifact.gates["V-CT-2"].statement.includes("pc-level") || !artifact.gates["V-CT-2"].statement.includes("index-level")) {
    fail("V-CT-2 statement drift");
  }
  if (artifact.accounting.masksOnly.length < 3 || artifact.accounting.canonicalComputation.length < 3 ||
      artifact.accounting.remainingGranted.length < 3) fail("accounting tier inventory drift");
  if (!artifact.fences.d7HypothesisTier.includes("2703-2712")) fail("D7 fence drift");
  if (!artifact.fences.measurementOnly.includes("coordinate search is measurement")) fail("measurement fence drift");
  if (!artifact.fences.governsAdmission.includes("separately gated")) fail("governs fence drift");
  if (!artifact.fences.membrane.includes("never a probe input")) fail("membrane fence drift");

  // cross-checks
  const cross = artifact.crossChecks;
  if (cross.bl073Anchor.matchesDerived !== true || cross.d7LandedIntervals.matchesDerived !== true ||
      cross.a0LandedUniverse.matchesDerived !== true) fail("cross-check flags drift");
  if (cross.chainFingerprints.bl073 !== BL073_FINGERPRINT || cross.chainFingerprints.bl071 !== BL071_FINGERPRINT ||
      cross.chainFingerprints.bl070 !== BL070_FINGERPRINT) fail("cross-check fingerprint drift");
  if (!cross.bl073Anchor.statement.includes("phi-1") || !cross.bl073Anchor.statement.includes("phi-2")) {
    fail("cross-check anchor statement drift");
  }
  if (artifact.contractCitations.length < 10) fail("contract citation inventory drift");
  if (artifact.notAccomplished.length < 6) fail("notAccomplished inventory drift");
  if (!artifact.notAccomplished.some((item) => item.includes("no claim event"))) fail("notAccomplished claim item drift");
  if (!artifact.notAccomplished.some((item) => item.includes("no GOVERNS admission"))) fail("notAccomplished admission item drift");
  if (!artifact.notAccomplished.some((item) => item.includes("no C2 endorsement"))) fail("notAccomplished C2 item drift");
  if (!artifact.notAccomplished.some((item) => item.includes("does not amend records"))) fail("notAccomplished resolution item drift");
}

// ---------------------------------------------------------------------------
// Static generator checks
// ---------------------------------------------------------------------------

function staticCensusCoreCheck(sourceText) {
  const begin = sourceText.indexOf("CENSUS-CORE-BEGIN");
  const end = sourceText.indexOf("CENSUS-CORE-END");
  if (begin < 0 || end < 0 || end <= begin) fail("generator census-core markers missing");
  const head = sourceText.slice(0, end);
  const region = sourceText.slice(begin, end);
  const forbidden = [
    /\bforte\b/, /office/i, /observed/, /coverage/, /uKeys/,
    /d7ModalRows/, /d7SeatContactRows/, /d6SatelliteRows/, /d7AnchorRows/, /\bnearMiss\b/,
    /\bphiWitnesses\b/,
  ];
  for (const pattern of forbidden) {
    if (pattern.test(region)) fail(`generator census-core reads a forbidden input: ${pattern}`);
    if (pattern.test(head)) fail(`forbidden token before the census-core end: ${pattern}`);
  }
  const required = [
    "partitionMembers", "hamming12", "rotateMask12", "maskOfRow", "pitchSet",
    "pcSumOfMask", "icVectorOfMask", "deriveD7Cycle", "deriveA0Ring",
    "affineMapOfMask", "unitsOfZ12", "coordinateSearch", "necessityOfUnit",
    "groupClosureTest", "composeAffineMap",
  ];
  for (const token of required) {
    if (!region.includes(token)) fail(`generator census-core is missing a required masks-only token: ${token}`);
  }
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validate() {
  const artifact = readJson(ARTIFACT_PATH);
  const sources = {
    ledgerRows: parseCsv(read(LEDGER_PATH)),
    bl073: readJson(BL073_PATH),
    bl071: readJson(BL071_PATH),
    bl070: readJson(BL070_PATH),
    gate3: readJson(GATE3_PATH),
  };

  const derived = reDerive(sources);
  checkAgainstSources(artifact, derived);

  const { investigationFingerprint, ...artifactCore } = artifact;
  if (sha256(canonicalText(artifactCore)) !== investigationFingerprint) fail("artifact fingerprint self-check failed");

  const generatorSource = read(GENERATOR_PATH);
  staticCensusCoreCheck(generatorSource);

  const repin = (candidate) => {
    const { investigationFingerprint: ignored, ...probeCore } = candidate;
    void ignored;
    return { ...probeCore, investigationFingerprint: sha256(canonicalText(probeCore)) };
  };
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const expectRejection = (label, mutated) => {
    let rejected = false;
    try {
      checkAgainstSources(repin(mutated), derived);
    } catch {
      rejected = true;
    }
    if (!rejected) fail(`mutation probe not rejected: ${label}`);
  };

  const driftProbes = [
    ["D7 order element swap", (candidate) => { candidate.cycles.D7.order[0] = "2111"; }],
    ["D7 edge interval flip", (candidate) => { candidate.cycles.D7.edges[0].rotateInterval = 10; }],
    ["D7 closure flag strip", (candidate) => { candidate.cycles.D7.edges[6].closure = false; }],
    ["D7 closure edge target drift", (candidate) => { candidate.cycles.D7.closureEdge.b = "2111"; }],
    ["A0 order element drift", (candidate) => { candidate.cycles.A0.order[3] = "1707"; }],
    ["A0 edge interval flip", (candidate) => { candidate.cycles.A0.edges[0].rotateInterval = 6; }],
    ["A0 closure edge source drift", (candidate) => { candidate.cycles.A0.closureEdge.a = "1451"; }],
    ["D7 pcSum ladder drift", (candidate) => { candidate.cycles.D7.pcSumLadder[0] = 22; }],
    ["A0 pcSum step drift", (candidate) => { candidate.cycles.A0.pcSumStep = 5; }],
    ["T1 image order drift", (candidate) => { candidate.search.carriers[0].imageOrder[0] = "2773"; }],
    ["T1 image interval drift", (candidate) => { candidate.search.carriers[0].imageIntervals[0] = 11; }],
    ["T1 image pcSum drift", (candidate) => { candidate.search.carriers[0].imagePcSums[0] = 34; }],
    ["T1 hamming drift", (candidate) => { candidate.search.carriers[0].imageHamming[6] = 8; }],
    ["T1 unit flip", (candidate) => { candidate.search.carriers[0].unit = 7; }],
    ["T2 level flip", (candidate) => { candidate.search.carriers[1].level = "D"; }],
    ["T2 reversed flag strip", (candidate) => { candidate.search.carriers[1].reversed = false; }],
    ["carrier inventory strip", (candidate) => { candidate.search.carriers = []; }],
    ["tCensus drift", (candidate) => { candidate.search.tCensus["5"] = [0, 1]; }],
    ["classL0 setwise flip", (candidate) => { candidate.search.classL0.setwise = 1; }],
    ["classL1 directed count flip", (candidate) => { candidate.search.classL1.directed = 2; }],
    ["search census row drift", (candidate) => { candidate.search.census[0].unit = 5; }],
    ["search units drift", (candidate) => { candidate.search.units = [1, 5, 7]; }],
    ["necessity unit flip", (candidate) => { candidate.necessity.table[1].unit = 7; }],
    ["necessity unique unit flip", (candidate) => { candidate.necessity.uniqueUnit = 7; }],
    ["necessity closure invariance strip", (candidate) => { candidate.necessity.closureInvariance = "none"; }],
    ["group closed flip", (candidate) => { candidate.group.closed = false; }],
    ["group order flip", (candidate) => { candidate.group.order = 2; }],
    ["group identification drift", (candidate) => { candidate.group.isomorphicTo = "cyclic Z4"; }],
    ["group products entry flip", (candidate) => { candidate.group.products[0].product = "M5"; }],
    ["group relations flip", (candidate) => { candidate.group.relations[2].result = "M1"; }],
    ["working set closure flag flip", (candidate) => { candidate.group.workingSet.compositionClosed = true; }],
    ["group element carries drift", (candidate) => { candidate.group.elements[1].carries = "neither"; }],
    ["pc reflection verified flip", (candidate) => { candidate.reflection.pcLevel.verified = false; }],
    ["pc reflection relation drift", (candidate) => { candidate.reflection.pcLevel.relations[0].value = "T1"; }],
    ["index alignment drift", (candidate) => { candidate.reflection.indexLevel.alignment[0].witness = "phi-2"; }],
    ["branch label flip", (candidate) => { candidate.branch.label = "COORDINATE_MAP_FOUND"; }],
    ["branch fired strip", (candidate) => { candidate.branch.fired = ["COORDINATE_MAP_FOUND"]; }],
    ["branch reading flip", (candidate) => { candidate.branch.reading = "READING_2_CONFIRMED"; }],
    ["branch statement strip", (candidate) => { candidate.branch.statement = "none"; }],
    ["scoping canonicity strip", (candidate) => { candidate.scopingAccretion.canonicity = "conventional"; }],
    ["scoping klein4 strip", (candidate) => { candidate.scopingAccretion.klein4 = "none"; }],
    ["chain fingerprint zero", (candidate) => { candidate.base.bl073.investigationFingerprint = "0".repeat(64); }],
    ["cross-check flag flip", (candidate) => { candidate.crossChecks.bl073Anchor.matchesDerived = false; }],
    ["binding gate strip", (candidate) => { candidate.bindingGate.status = "BOUND"; }],
    ["accounting strip", (candidate) => { candidate.accounting.masksOnly = []; }],
    ["fence strip", (candidate) => { candidate.fences.d7HypothesisTier = "none"; }],
    ["notAccomplished strip", (candidate) => { candidate.notAccomplished = []; }],
    ["ruling inventory strip", (candidate) => { candidate.preRegistration.rulings.pop(); }],
  ];
  for (const [label, mutate] of driftProbes) {
    const candidate = clone(artifact);
    mutate(candidate);
    expectRejection(label, candidate);
  }
  {
    const mutatedFingerprint = clone(artifact);
    mutatedFingerprint.investigationFingerprint = "0".repeat(64);
    const { investigationFingerprint: ignoredFingerprint, ...mutatedCore } = mutatedFingerprint;
    void ignoredFingerprint;
    if (sha256(canonicalText(mutatedCore)) === mutatedFingerprint.investigationFingerprint) {
      fail("fingerprint probe not rejected: zeroed fingerprint");
    }
  }

  const staticProbes = [
    ["smuggled office-field read", "const drawn = ledgerRows[0].office; void drawn;"],
    ["smuggled class-label read", "const drawn = ledgerRows[0].forte; void drawn;"],
    ["smuggled recorded-status read", "const drawn = ledgerRows[0].observedStatus; void drawn;"],
    ["smuggled modal-record read", "const drawn = network.d7ModalRows; void drawn;"],
    ["smuggled witness-artifact read", "const drawn = readJson(BL073_PATH).phiWitnesses; void drawn;"],
  ];
  let staticRejections = 0;
  for (const [label, smuggled] of staticProbes) {
    let rejected = false;
    try {
      staticCensusCoreCheck(generatorSource.replace(
        "export function partitionMembers(ledgerRows) {",
        `export function partitionMembers(ledgerRows) { ${smuggled}`,
      ));
    } catch {
      rejected = true;
    }
    if (!rejected) fail(`mutation probe not rejected: ${label}`);
    staticRejections += 1;
  }
  const stripProbes = [
    "partitionMembers", "hamming12", "rotateMask12", "maskOfRow", "icVectorOfMask",
    "affineMapOfMask", "coordinateSearch",
  ];
  for (const token of stripProbes) {
    let rejected = false;
    try {
      staticCensusCoreCheck(generatorSource.split(token).join("STRIPPED"));
    } catch {
      rejected = true;
    }
    if (!rejected) fail(`presence-strip probe not rejected: ${token}`);
    staticRejections += 1;
  }

  console.log(JSON.stringify({
    artifact: ARTIFACT_PATH,
    status: "PASS",
    investigationFingerprint: artifact.investigationFingerprint,
    chainFingerprints: {
      bl073: BL073_FINGERPRINT,
      bl071: BL071_FINGERPRINT,
      bl070: BL070_FINGERPRINT,
    },
    cycles: {
      d7: `${derived.d7Order.join(" -> ")} (intervals ${derived.d7Edges.map((edge) => edge.rotateInterval).join(",")})`,
      a0: `${derived.a0Order.join(" -> ")} (intervals ${derived.a0Edges.map((edge) => edge.rotateInterval).join(",")})`,
    },
    search: {
      maps: derived.searchRows.length,
      classL0: derived.classL0,
      classL1: derived.classL1,
      carriers: [derived.carriers.T1, derived.carriers.T2].map((carrier) =>
        `${carrier.id}: u=${carrier.unit} t=${carrier.translation} level=${carrier.level}`),
    },
    branch: artifact.branch.label,
    mutationProbes: driftProbes.length + 1 + staticProbes.length + stripProbes.length,
    probeStaticRejections: staticRejections,
  }, null, 2));
}

validate();
