#!/usr/bin/env node
/**
 * Validate the generated BL-073 isometry probe against its sources.
 *
 * Independent of the generator: re-reads the 462-record ledger, the network,
 * the BL-071 and BL-070 artifacts and the Gate 3 receipt; re-derives both
 * seven-cycles masks-only (the D7 ^11 path + ^6 return; the A0 Hamming-2
 * path + ^6 closure); re-computes the four pre-registered properties (P1
 * pairwise Hamming multiset, P2 directed rotation-interval signature, P3
 * distance-matrix isomorphism, P4 tritone marking); re-runs both bijection
 * searches (dihedral 14 + symmetric 5040); re-checks the witnesses, their
 * parity and their maps; re-checks the landed cross-references key-for-key;
 * re-checks the artifact fingerprint; statically verifies the generator's
 * census-core region (forbidden label/record reads absent, required
 * masks-only reads present); and runs mutation probes (artifact drift,
 * smuggled reads, presence-strip). Fail-loud.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..", "..");

const ARTIFACT_PATH = "orrery/src/generated/bl073-isometry-probe.v1.json";
const GENERATOR_PATH = "scripts/build-bl073-isometry-probe.mjs";
const SCHEMA_VERSION = "harmonic-orrery.bl073-isometry-probe.v1";
const INVESTIGATION_ID = "BL073_ISOMETRY_PROBE_V1";
const LEDGER_PATH = "canonical/universal-heptatonic-ledger.csv";
const NETWORK_PATH = "canonical/universal-network-data.json";
const BL071_PATH = "orrery/src/generated/bl071-interval-6-structure.v1.json";
const BL070_PATH = "orrery/src/generated/bl070-d7-derivation.v1.json";
const GATE3_PATH = "qa/d4-r2-execution-receipt.json";

const BL071_FINGERPRINT = "8b2a1f6ca1776851f721eb6bc6ee6532059d81d150ce3f7c9fda1febfe84c3fe";
const BL070_FINGERPRINT = "9db10a088a05664a5cf60f6fad14514a4fc9aab278dcf0359d684bce70607731";

const D7_ORDER_EXPECTED = ["127", "2111", "3103", "3599", "3847", "3971", "4033"];
const A0_ORDER_EXPECTED = ["1387", "1451", "1453", "1709", "1717", "2741", "2773"];
const D7_INTERVALS_EXPECTED = [11, 11, 11, 11, 11, 11, 6];
const A0_INTERVALS_EXPECTED = [7, 7, 7, 7, 7, 7, 6];
const CYCLE_HAMMING_EXPECTED = [2, 2, 2, 2, 2, 2, 10];
const HAMMING_HISTOGRAM_EXPECTED = { "2": 6, "4": 5, "6": 4, "8": 3, "10": 3 };
const D7_PC_SUM_LADDER = [21, 26, 31, 36, 41, 46, 51];
const A0_PC_SUM_LADDER = [33, 34, 35, 36, 37, 38, 39];
const D7_INTERVAL_VECTOR = [6, 5, 4, 3, 2, 1];
const A0_INTERVAL_VECTOR = [2, 5, 4, 3, 6, 1];

function fail(message) {
  throw new Error(`INVALID_BL073_ISOMETRY_PROBE: ${message}`);
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

function icVectorOfMask(mask) {
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

function permutations(size) {
  if (size === 1) return [[0]];
  const result = [];
  const smaller = permutations(size - 1);
  for (const perm of smaller) {
    for (let position = 0; position < size; position += 1) {
      const copy = perm.slice();
      copy.splice(position, 0, size - 1);
      result.push(copy);
    }
  }
  return result;
}

function inversionsOf(perm) {
  let count = 0;
  for (let left = 0; left < perm.length; left += 1) {
    for (let right = left + 1; right < perm.length; right += 1) {
      if (perm[left] > perm[right]) count += 1;
    }
  }
  return count;
}

function distanceIsomorphic(matrixA, matrixB, perm) {
  for (let left = 0; left < perm.length; left += 1) {
    for (let right = left + 1; right < perm.length; right += 1) {
      if (matrixA[left][right] !== matrixB[perm[left]][perm[right]]) return false;
    }
  }
  return true;
}

function dihedralMaps() {
  const maps = [];
  for (let k = 0; k < 7; k += 1) {
    maps.push({ name: `r${k}`, kind: "rotation", perm: Array.from({ length: 7 }, (_, i) => (i + k) % 7) });
  }
  for (let k = 0; k < 7; k += 1) {
    maps.push({ name: `refl${k}`, kind: "reflection", perm: Array.from({ length: 7 }, (_, i) => ((k - i) % 7 + 7) % 7) });
  }
  return maps;
}

// ---------------------------------------------------------------------------
// Independent re-derivation
// ---------------------------------------------------------------------------

function reDerive(sources) {
  const { ledgerRows, network, bl071, bl070, gate3 } = sources;
  if (ledgerRows.length !== 462) fail(`ledger census ${ledgerRows.length}`);
  const masks = new Map(ledgerRows.map((row) => [String(row.id), maskOfPitches(parsePitchSet(row.pitchSet))]));
  for (const row of ledgerRows) {
    if (masks.get(String(row.id)) !== Number(row.id)) fail(`ledger mask/id disagreement at ${row.id}`);
  }
  const pitches = new Map(ledgerRows.map((row) => [String(row.id), parsePitchSet(row.pitchSet)]));

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
  if (canonicalText(d7Edges.map((edge) => edge.rotateInterval)) !== canonicalText(D7_INTERVALS_EXPECTED)) fail("D7 interval inventory drift");
  if (canonicalText(a0Edges.map((edge) => edge.rotateInterval)) !== canonicalText(A0_INTERVALS_EXPECTED)) fail("A0 interval inventory drift");

  const geometryOf = (order) => {
    const matrix = order.map((a) => order.map((b) => hamming12(masks.get(a), masks.get(b))));
    const histogram = {};
    for (let left = 0; left < order.length; left += 1) {
      for (let right = left + 1; right < order.length; right += 1) {
        const hamming = matrix[left][right];
        histogram[String(hamming)] = (histogram[String(hamming)] ?? 0) + 1;
      }
    }
    return {
      matrix,
      histogram,
      tritoneSlot: order.map((state) => icVectorOfMask(masks.get(state))[5]),
      intervalVectors: order.map((state) => icVectorOfMask(masks.get(state))),
      pcSumLadder: order.map((state) => pcSumOfMask(masks.get(state))),
    };
  };
  const d7Geometry = geometryOf(d7Order);
  const a0Geometry = geometryOf(a0Order);
  if (canonicalText(d7Geometry.histogram) !== canonicalText(HAMMING_HISTOGRAM_EXPECTED) ||
      canonicalText(a0Geometry.histogram) !== canonicalText(HAMMING_HISTOGRAM_EXPECTED)) fail("Hamming histogram drift");
  if (canonicalText(d7Geometry.pcSumLadder) !== canonicalText(D7_PC_SUM_LADDER)) fail("D7 ladder drift");
  if (canonicalText(a0Geometry.pcSumLadder) !== canonicalText(A0_PC_SUM_LADDER)) fail("A0 ladder drift");
  if (canonicalText(d7Geometry.intervalVectors[0]) !== canonicalText(D7_INTERVAL_VECTOR) ||
      canonicalText(a0Geometry.intervalVectors[0]) !== canonicalText(A0_INTERVAL_VECTOR)) fail("interval vector drift");

  const intervalPreserving = (perm) => {
    for (let index = 0; index < 7; index += 1) {
      const next = (index + 1) % 7;
      const interval = d7Edges[index].rotateInterval;
      if (rotateMask12(masks.get(a0Order[perm[index]]), interval) !== masks.get(a0Order[perm[next]])) return false;
    }
    return true;
  };
  const allPermutations = permutations(7);
  if (allPermutations.length !== 5040) fail("permutation census drift");
  const dihedral = dihedralMaps();
  const p2Dihedral = dihedral.filter((map) => intervalPreserving(map.perm)).length;
  const p2Symmetric = allPermutations.filter((perm) => intervalPreserving(perm)).length;
  if (p2Dihedral !== 0 || p2Symmetric !== 0) fail("P2 passing witness census drift");

  const p3Symmetric = allPermutations
    .filter((perm) => distanceIsomorphic(d7Geometry.matrix, a0Geometry.matrix, perm))
    .sort((left, right) => (canonicalText(left) < canonicalText(right) ? -1 : 1));
  const p3Dihedral = dihedral.filter((map) => distanceIsomorphic(d7Geometry.matrix, a0Geometry.matrix, map.perm));
  if (p3Symmetric.length !== 2 || p3Dihedral.length !== 2) fail("P3 witness census drift");
  const d7Aut = allPermutations.filter((perm) => distanceIsomorphic(d7Geometry.matrix, d7Geometry.matrix, perm));
  const a0Aut = allPermutations.filter((perm) => distanceIsomorphic(a0Geometry.matrix, a0Geometry.matrix, perm));
  if (d7Aut.length !== 2 || a0Aut.length !== 2) fail("automorphism census drift");
  const elementOf = (perm) => {
    const element = dihedral.find((map) => canonicalText(map.perm) === canonicalText(perm));
    if (!element) fail("passing witness outside the dihedral search space");
    return element;
  };
  const expectedWitnesses = p3Symmetric.map((perm, index) => {
    const element = elementOf(perm);
    return {
      id: `phi-${index + 1}`,
      dihedralElement: element.name,
      kind: element.kind,
      parity: inversionsOf(perm) % 2 === 0 ? "even" : "odd",
      inversions: inversionsOf(perm),
      map: d7Order.map((state, position) => ({ d7: state, a0: a0Order[perm[position]] })),
    };
  });
  if (canonicalText(expectedWitnesses.map((witness) => witness.kind)) !== canonicalText(["rotation", "reflection"])) {
    fail("witness kind inventory drift");
  }
  if (canonicalText(expectedWitnesses.map((witness) => witness.dihedralElement)) !== canonicalText(["r0", "refl6"])) {
    fail("witness element inventory drift");
  }

  // Cross-checks against the landed records.
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
  if (canonicalText(recordedOrder) !== canonicalText(d7Order)) fail("recorded modal order cross-check drift");
  for (const edge of d7Edges) {
    const landed = bl070.orbitalRotation.perEdge.find((entry) => String(entry.a) === edge.a && String(entry.b) === edge.b);
    if (!landed || landed.rotateInterval !== edge.rotateInterval) fail(`BL-070 per-edge cross-check drift at ${edge.a}->${edge.b}`);
    const gate3Edge = gate3.d7Analogue.cycleTwinVerification.perEdge.find(
      (entry) => String(entry.a) === edge.a && String(entry.b) === edge.b,
    );
    if (!gate3Edge || gate3Edge.rotateInterval !== edge.rotateInterval) fail(`Gate 3 per-edge cross-check drift at ${edge.a}->${edge.b}`);
  }
  if (bl070.orbitalRotation.exactRotationCount !== 7) fail("BL-070 exact rotation count drift");
  const a0Universe = bl071.census.universes.find((universe) => universe.id === "A0-P7");
  if (!a0Universe) fail("BL-071 A0-P7 universe missing");
  if (canonicalText(a0Universe.memberStates.slice().sort(cmp)) !== canonicalText(a0Order.slice().sort(cmp))) {
    fail("BL-071 A0-P7 member cross-check drift");
  }
  if (canonicalText(a0Universe.rotation6Witnesses) !== canonicalText(["1387:2773"])) fail("BL-071 closure witness drift");

  // Phase-relation expectations.
  const closureImages = expectedWitnesses.map((witness) => {
    const image = witness.map.filter((entry) => entry.d7 === "4033" || entry.d7 === "127").map((entry) => entry.a0).sort(cmp);
    return canonicalText(image);
  });
  const expectedClosureImage = canonicalText(["1387", "2773"]);
  if (closureImages.some((image) => image !== expectedClosureImage)) fail("closure-pair image drift");
  const rotationInduction = expectedWitnesses.map((witness) => witness.map.filter((entry) => {
    for (let d = 1; d <= 11; d += 1) if (rotateMask12(masks.get(entry.d7), d) === masks.get(entry.a0)) return true;
    return false;
  }).length);
  if (rotationInduction.some((count) => count !== 0)) fail("rotation-induction drift");

  return {
    sources,
    masks, pitches,
    d7Anchors, a0Anchors,
    d7Order, a0Order, d7Edges, a0Edges,
    d7Geometry, a0Geometry,
    p2: { dihedral: p2Dihedral, symmetric: p2Symmetric },
    p3: { symmetric: p3Symmetric.length, dihedral: p3Dihedral.length, beyondDihedral: p3Symmetric.length - p3Dihedral.length },
    expectedWitnesses,
    d7AutCount: d7Aut.length,
    a0AutCount: a0Aut.length,
  };
}

// ---------------------------------------------------------------------------
// Artifact checks
// ---------------------------------------------------------------------------

function checkAgainstSources(artifact, derived) {
  if (artifact.schemaVersion !== SCHEMA_VERSION || artifact.investigationId !== INVESTIGATION_ID) fail("artifact header drift");
  if (artifact.status !== "planning_evidence") fail("status drift");
  if (artifact.generator !== "scripts/build-bl073-isometry-probe.mjs") fail("generator path drift");

  const bindingPaths = artifact.sourceBindings.map((binding) => binding.artifact);
  if (canonicalText([...bindingPaths].sort()) !== canonicalText([
    BL070_PATH, BL071_PATH, GATE3_PATH, LEDGER_PATH, NETWORK_PATH,
  ].sort())) fail("source binding set drift");
  for (const binding of artifact.sourceBindings) {
    if (binding.sha256 !== fileSha(binding.artifact)) fail(`source binding sha drift: ${binding.artifact}`);
  }
  if (artifact.base.bl071.investigationFingerprint !== BL071_FINGERPRINT) fail("BL-071 chain literal drift");
  if (artifact.base.bl070.derivationFingerprint !== BL070_FINGERPRINT) fail("BL-070 chain literal drift");
  const { investigationFingerprint: bl071Fingerprint, ...bl071Core } = derived.sources.bl071;
  if (sha256(canonicalText(bl071Core)) !== bl071Fingerprint || bl071Fingerprint !== BL071_FINGERPRINT) fail("BL-071 fingerprint self-check drift");
  const { derivationFingerprint: bl070Fingerprint, ...bl070Core } = derived.sources.bl070;
  if (sha256(canonicalText(bl070Core)) !== bl070Fingerprint || bl070Fingerprint !== BL070_FINGERPRINT) fail("BL-070 fingerprint self-check drift");

  const rulingIds = artifact.preRegistration.rulings.map((ruling) => ruling.id);
  if (canonicalText(rulingIds) !== canonicalText(["OD-73-1", "OD-73-2", "OD-73-3", "OD-73-4", "OD-73-5", "OD-73-6"])) fail("ruling inventory drift");
  const refinementIds = artifact.preRegistration.refinements.map((refinement) => refinement.id);
  if (canonicalText(refinementIds) !== canonicalText(["R1", "N1", "N2"])) fail("refinement inventory drift");
  if (artifact.preRegistration.properties.length !== 4) fail("property inventory drift");
  if (artifact.preRegistration.searchSpaces.dihedral.size !== 14 || artifact.preRegistration.searchSpaces.symmetric.size !== 5040) {
    fail("pre-registered search-space census drift");
  }
  if (!artifact.preRegistration.branchTable.full.startsWith("FULL_ISOMETRY") ||
      !artifact.preRegistration.branchTable.partial.startsWith("PARTIAL_ISOMETRY") ||
      !artifact.preRegistration.branchTable.no.startsWith("NO_ISOMETRY")) fail("branch table drift");

  // cycles
  const d7 = artifact.cycles.D7;
  const a0 = artifact.cycles.A0;
  if (!d7 || !a0) fail("cycles block missing");
  if (canonicalText(d7.order) !== canonicalText(derived.d7Order)) fail("D7 artifact order drift");
  if (canonicalText(a0.order) !== canonicalText(derived.a0Order)) fail("A0 artifact order drift");
  if (canonicalText(d7.edges) !== canonicalText(derived.d7Edges)) fail("D7 artifact edge drift");
  if (canonicalText(a0.edges) !== canonicalText(derived.a0Edges)) fail("A0 artifact edge drift");
  if (canonicalText(d7.closureEdge) !== canonicalText(derived.d7Edges[6])) fail("D7 closure edge drift");
  if (canonicalText(a0.closureEdge) !== canonicalText(derived.a0Edges[6])) fail("A0 closure edge drift");
  if (canonicalText(d7.pcSumLadder) !== canonicalText(derived.d7Geometry.pcSumLadder) || d7.pcSumStep !== 5) fail("D7 ladder drift");
  if (canonicalText(a0.pcSumLadder) !== canonicalText(derived.a0Geometry.pcSumLadder) || a0.pcSumStep !== 1) fail("A0 ladder drift");
  if (canonicalText(d7.masks) !== canonicalText(d7.order.map((state) => derived.masks.get(state)))) fail("D7 mask list drift");
  if (canonicalText(a0.masks) !== canonicalText(a0.order.map((state) => derived.masks.get(state)))) fail("A0 mask list drift");
  if (canonicalText(d7.distanceMatrix) !== canonicalText(derived.d7Geometry.matrix)) fail("D7 distance matrix drift");
  if (canonicalText(a0.distanceMatrix) !== canonicalText(derived.a0Geometry.matrix)) fail("A0 distance matrix drift");
  if (canonicalText(d7.degreeSequence) !== canonicalText([2, 2, 2, 2, 2, 2, 2])) fail("D7 degree sequence drift");
  if (canonicalText(a0.degreeSequence) !== canonicalText([2, 2, 2, 2, 2, 2, 2])) fail("A0 degree sequence drift");

  // P1
  const p1 = artifact.perProperty.P1;
  if (canonicalText(p1.d7HammingHistogram) !== canonicalText(derived.d7Geometry.histogram) ||
      canonicalText(p1.a0HammingHistogram) !== canonicalText(derived.a0Geometry.histogram)) fail("P1 histogram drift");
  if (p1.multisetsEqual !== true || p1.verdict !== "PASS") fail("P1 verdict drift");
  if (!p1.witnesses.includes("phi-invariant")) fail("P1 witness note drift");

  // P2
  const p2 = artifact.perProperty.P2;
  if (p2.primaryStrict.passingWitnesses.dihedral !== 0 || p2.primaryStrict.passingWitnesses.symmetric !== 0) fail("P2 witness count drift");
  if (p2.primaryStrict.verdict !== "FAIL" || p2.verdict !== "FAIL") fail("P2 verdict drift");
  if (!p2.primaryStrict.failureMode.includes("interval 11") || !p2.primaryStrict.failureMode.includes("7 (A0)")) fail("P2 failure mode drift");
  const d7Histogram = {};
  for (const edge of derived.d7Edges) d7Histogram[String(edge.rotateInterval)] = (d7Histogram[String(edge.rotateInterval)] ?? 0) + 1;
  const a0Histogram = {};
  for (const edge of derived.a0Edges) a0Histogram[String(edge.rotateInterval)] = (a0Histogram[String(edge.rotateInterval)] ?? 0) + 1;
  if (canonicalText(p2.primaryStrict.d7DirectedIntervalHistogram) !== canonicalText(d7Histogram)) fail("P2 D7 interval histogram drift");
  if (canonicalText(p2.primaryStrict.a0DirectedIntervalHistogram) !== canonicalText(a0Histogram)) fail("P2 A0 interval histogram drift");
  const secondary = p2.secondaryStructural;
  if (secondary.d7.pathInterval !== 11 || secondary.a0.pathInterval !== 7) fail("P2 secondary path interval drift");
  if (secondary.d7.pathCount !== 6 || secondary.a0.pathCount !== 6) fail("P2 secondary path count drift");
  if (secondary.d7.closureInterval !== 6 || secondary.a0.closureInterval !== 6) fail("P2 secondary closure interval drift");
  if (secondary.d7.closureHamming !== 10 || secondary.a0.closureHamming !== 10) fail("P2 secondary closure hamming drift");
  if (secondary.nonVerdictBearing !== true) fail("P2 secondary verdict flag drift");
  if (!secondary.statement.includes("two-interval structure shared")) fail("P2 secondary statement drift");
  if (!secondary.shared.includes("two-interval shape")) fail("P2 shared inventory drift");

  // P3
  const p3 = artifact.perProperty.P3;
  if (canonicalText(p3.d7DistanceMatrix) !== canonicalText(derived.d7Geometry.matrix) ||
      canonicalText(p3.a0DistanceMatrix) !== canonicalText(derived.a0Geometry.matrix)) fail("P3 matrix drift");
  if (canonicalText(p3.witnessesBySpace.dihedral) !== canonicalText(["r0", "refl6"])) fail("P3 dihedral witness list drift");
  if (p3.witnessesBySpace.symmetric !== 2 || p3.witnessesBySpace.beyondDihedral !== 0) fail("P3 witness count drift");
  if (p3.automorphismGroups.order !== 2) fail("P3 automorphism order drift");
  if (p3.verdict !== "PASS") fail("P3 verdict drift");

  // P4
  const p4 = artifact.perProperty.P4;
  if (canonicalText(p4.d7TritoneSlotPerNode) !== canonicalText(derived.d7Geometry.tritoneSlot) ||
      canonicalText(p4.a0TritoneSlotPerNode) !== canonicalText(derived.a0Geometry.tritoneSlot)) fail("P4 tritone slot drift");
  if (canonicalText(derived.d7Geometry.tritoneSlot) !== canonicalText([1, 1, 1, 1, 1, 1, 1]) ||
      canonicalText(derived.a0Geometry.tritoneSlot) !== canonicalText([1, 1, 1, 1, 1, 1, 1])) fail("P4 uniform marking drift");
  if (p4.verdict !== "PASS") fail("P4 verdict drift");
  if (!p4.fullVectorObservation.note.includes("not a verdict input")) fail("P4 full-vector note drift");
  if (canonicalText(p4.fullVectorObservation.d7IntervalVectors) !== canonicalText(derived.d7Geometry.intervalVectors) ||
      canonicalText(p4.fullVectorObservation.a0IntervalVectors) !== canonicalText(derived.a0Geometry.intervalVectors)) {
    fail("P4 full-vector observation drift");
  }

  // phiWitnesses
  const phi = artifact.phiWitnesses;
  if (phi.searchSpaces.dihedral.size !== 14 || phi.searchSpaces.symmetric.size !== 5040) fail("witness search-space drift");
  if (phi.witnesses.length !== derived.expectedWitnesses.length) fail("witness inventory drift");
  for (const expected of derived.expectedWitnesses) {
    const witness = phi.witnesses.find((candidate) => candidate.id === expected.id);
    if (!witness) fail(`witness missing: ${expected.id}`);
    if (witness.dihedralElement !== expected.dihedralElement || witness.kind !== expected.kind) fail(`witness element drift: ${expected.id}`);
    if (witness.parity !== expected.parity || witness.inversions !== expected.inversions) fail(`witness parity drift: ${expected.id}`);
    if (canonicalText(witness.map) !== canonicalText(expected.map)) fail(`witness map drift: ${expected.id}`);
    if (!witness.classification.includes("N2 fork")) fail(`witness classification drift: ${expected.id}`);
  }
  if (canonicalText(phi.combinedPreservation.properties) !== canonicalText(["P1", "P3", "P4"])) fail("combined property set drift");
  if (canonicalText(phi.combinedPreservation.witnessIds) !== canonicalText(["phi-1", "phi-2"])) fail("combined witness set drift");
  if (phi.fullIsometry.witnessIds.length !== 0) fail("full-isometry witness list drift");
  if (!phi.fullIsometry.reason.includes("P2-strict")) fail("full-isometry reason drift");
  if (!phi.parityNote.includes("both N2-fork readings")) fail("parity note drift");

  // search spaces
  const spaces = artifact.searchSpaceResults;
  if (spaces.dihedral.size !== 14 || spaces.symmetric.size !== 5040) fail("search-space size drift");
  if (spaces.dihedral.P2 !== "0/14" || spaces.symmetric.P2 !== "0/5040") fail("search-space P2 count drift");
  if (!spaces.dihedral.P3.includes("2/14") || !spaces.symmetric.P3.includes("2/5040")) fail("search-space P3 count drift");
  if (spaces.symmetric.beyondDihedral !== 0) fail("beyond-dihedral witness drift");

  // phase relation
  const phase = artifact.phaseRelation;
  if (phase.status !== "RECORDED_SECONDARY" || phase.nonVerdictBearing !== true) fail("phase relation status drift");
  if (!phase.closurePairCoherence.statement.includes("{4033, 127}") || !phase.closurePairCoherence.statement.includes("{2773, 1387}")) {
    fail("closure-pair coherence statement drift");
  }
  if (!phase.closurePairCoherence.phi1.includes("4033->2773") || !phase.closurePairCoherence.phi2.includes("4033->1387")) {
    fail("closure-pair witness strings drift");
  }
  for (const entry of phase.rotationInduction.perWitness) {
    if (entry.rotationRelatedPairs !== 0 || entry.pairCount !== 7) fail("rotation-induction census drift");
  }
  if (!phase.liftedReuse.includes("lifted(2773@(p+6)) = T_6(lifted(1387@p))")) fail("lifted reuse citation drift");

  // cross-checks
  const cross = artifact.crossChecks;
  if (cross.d7RecordedOrder.matchesDerived !== true || cross.d7LandedIntervals.matchesDerived !== true || cross.a0LandedUniverse.matchesDerived !== true) {
    fail("cross-check flags drift");
  }
  if (cross.chainFingerprints.bl071 !== BL071_FINGERPRINT || cross.chainFingerprints.bl070 !== BL070_FINGERPRINT) fail("cross-check fingerprint drift");
  if (!cross.d7LandedIntervals.statement.includes("key-for-key")) fail("landed interval statement drift");

  // branch
  const branch = artifact.branch;
  if (canonicalText(branch.preRegisteredLabels) !== canonicalText(["FULL_ISOMETRY", "PARTIAL_ISOMETRY", "NO_ISOMETRY"])) fail("branch label inventory drift");
  if (canonicalText(branch.propertyResults) !== canonicalText({ P1: "PASS", P2: "FAIL", P3: "PASS", P4: "PASS" })) fail("branch property results drift");
  if (canonicalText(branch.passingSubset) !== canonicalText(["P1", "P3", "P4"])) fail("branch passing subset drift");
  if (canonicalText(branch.failingSubset) !== canonicalText(["P2"])) fail("branch failing subset drift");
  if (branch.label !== "PARTIAL_ISOMETRY") fail("branch label drift");
  if (!branch.statement.startsWith("PARTIAL_ISOMETRY:")) fail("branch statement drift");
  if (!branch.statement.includes("separately gated")) fail("branch gating sentence drift");

  // binding gate
  if (artifact.bindingGate.status !== "SEPARATELY_GATED") fail("binding gate status drift");
  if (!artifact.bindingGate.statement.includes("No mechanism claim")) fail("binding gate mechanism fence drift");
  if (!artifact.bindingGate.statement.includes("gated separately on its own evidence")) fail("binding gate gating sentence drift");

  // gates
  for (const gate of ["V-BL-073-1", "V-BL-073-2", "V-BL-073-3", "V-BL-073-4"]) {
    if (artifact.gates[gate].result !== "PASS") fail(`gate drift: ${gate}`);
  }
  if (!artifact.gates["V-BL-073-4"].statement.includes("no mechanism sentence")) fail("measurement-only gate drift");

  // fences and accounting
  if (!artifact.fences.d7HypothesisTier.includes("2703-2712")) fail("D7 fence drift");
  if (!artifact.fences.membrane.includes("never a probe input")) fail("membrane fence drift");
  if (!artifact.fences.measurementOnly.includes("measurement")) fail("measurement fence drift");
  if (!artifact.fences.governsAdmission.includes("separately gated")) fail("governs fence drift");
  if (artifact.accounting.masksOnly.length < 4 || artifact.accounting.canonicalComputation.length < 3 || artifact.accounting.remainingGranted.length < 3) {
    fail("accounting tier inventory drift");
  }
  if (artifact.contractCitations.length < 10) fail("contract citation inventory drift");
  if (artifact.notAccomplished.length < 6) fail("notAccomplished inventory drift");
  if (!artifact.notAccomplished.some((item) => item.includes("no GOVERNS admission"))) fail("notAccomplished admission item drift");
  if (!artifact.notAccomplished.some((item) => item.includes("no claim event"))) fail("notAccomplished claim item drift");
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
  ];
  for (const pattern of forbidden) {
    if (pattern.test(region)) fail(`generator census-core reads a forbidden input: ${pattern}`);
    if (pattern.test(head)) fail(`forbidden token before the census-core end: ${pattern}`);
  }
  const required = [
    "partitionMembers", "hamming12", "rotateMask12", "maskOfRow", "pitchSet",
    "pcSumOfMask", "icVectorOfMask", "deriveD7Cycle", "deriveA0Ring",
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
    network: readJson(NETWORK_PATH),
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
    ["D7 closure hamming flip", (candidate) => { candidate.cycles.D7.closureEdge.hamming = 8; }],
    ["D7 closure flag strip", (candidate) => { candidate.cycles.D7.edges[6].closure = false; }],
    ["A0 order element drift", (candidate) => { candidate.cycles.A0.order[3] = "1707"; }],
    ["A0 path interval flip", (candidate) => { candidate.perProperty.P2.secondaryStructural.a0.pathInterval = 11; }],
    ["A0 closure edge target drift", (candidate) => { candidate.cycles.A0.closureEdge.a = "1451"; }],
    ["D7 pcSum ladder drift", (candidate) => { candidate.cycles.D7.pcSumLadder[0] = 22; }],
    ["A0 pcSum step drift", (candidate) => { candidate.cycles.A0.pcSumStep = 5; }],
    ["D7 distance matrix drift", (candidate) => { candidate.cycles.D7.distanceMatrix[0][1] = 3; }],
    ["P1 histogram flip", (candidate) => { candidate.perProperty.P1.d7HammingHistogram["2"] = 7; }],
    ["P1 verdict flip", (candidate) => { candidate.perProperty.P1.verdict = "FAIL"; }],
    ["P2 D7 interval histogram flip", (candidate) => { candidate.perProperty.P2.primaryStrict.d7DirectedIntervalHistogram["11"] = 5; }],
    ["P2 A0 interval histogram flip", (candidate) => { candidate.perProperty.P2.primaryStrict.a0DirectedIntervalHistogram["7"] = 5; }],
    ["P2 verdict flip", (candidate) => { candidate.perProperty.P2.primaryStrict.verdict = "PASS"; }],
    ["P2 failure mode strip", (candidate) => { candidate.perProperty.P2.primaryStrict.failureMode = "none"; }],
    ["P2 secondary strip", (candidate) => { candidate.perProperty.P2.secondaryStructural = null; }],
    ["P3 witness strip", (candidate) => { candidate.phiWitnesses.witnesses = []; }],
    ["P3 witness parity flip", (candidate) => { candidate.phiWitnesses.witnesses[0].parity = "odd"; }],
    ["P3 witness map drift", (candidate) => { candidate.phiWitnesses.witnesses[0].map[0].a0 = "2773"; }],
    ["P3 witness kind flip", (candidate) => { candidate.phiWitnesses.witnesses[0].kind = "reflection"; }],
    ["P4 tritone slot flip", (candidate) => { candidate.perProperty.P4.d7TritoneSlotPerNode[0] = 2; }],
    ["P4 verdict flip", (candidate) => { candidate.perProperty.P4.verdict = "FAIL"; }],
    ["branch label flip", (candidate) => { candidate.branch.label = "FULL_ISOMETRY"; }],
    ["branch passing subset drift", (candidate) => { candidate.branch.passingSubset = ["P1", "P2"]; }],
    ["branch failing subset strip", (candidate) => { candidate.branch.failingSubset = []; }],
    ["combined witness strip", (candidate) => { candidate.phiWitnesses.combinedPreservation.witnessIds = []; }],
    ["full isometry claimed", (candidate) => { candidate.phiWitnesses.fullIsometry.witnessIds = ["phi-1"]; }],
    ["search-space dihedral count flip", (candidate) => { candidate.searchSpaceResults.dihedral.size = 7; }],
    ["search-space P2 pass count flip", (candidate) => { candidate.searchSpaceResults.symmetric.P2 = "1/5040"; }],
    ["phase relation closure coherence flip", (candidate) => { candidate.phaseRelation.closurePairCoherence.phi1 = "none"; }],
    ["phase relation rotation-induction flip", (candidate) => { candidate.phaseRelation.rotationInduction.perWitness[0].rotationRelatedPairs = 1; }],
    ["binding gate strip", (candidate) => { candidate.bindingGate.status = "BOUND"; }],
    ["chain fingerprint zero", (candidate) => { candidate.base.bl071.investigationFingerprint = "0".repeat(64); }],
  ];
  for (const [label, mutate] of driftProbes) {
    const candidate = clone(artifact);
    mutate(candidate);
    expectRejection(label, candidate);
  }

  const staticProbes = [
    ["smuggled office-field read", "const drawn = ledgerRows[0].office; void drawn;"],
    ["smuggled class-label read", "const drawn = ledgerRows[0].forte; void drawn;"],
    ["smuggled recorded-status read", "const drawn = ledgerRows[0].observedStatus; void drawn;"],
    ["smuggled modal-record read", "const drawn = network.d7ModalRows; void drawn;"],
    ["smuggled contact-record read", "const drawn = network.d7SeatContactRows; void drawn;"],
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
  const stripProbes = ["partitionMembers", "hamming12", "rotateMask12", "maskOfRow", "icVectorOfMask"];
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
      bl071: BL071_FINGERPRINT,
      bl070: BL070_FINGERPRINT,
    },
    cycles: {
      d7: `${derived.d7Order.join(" -> ")} (intervals ${derived.d7Edges.map((edge) => edge.rotateInterval).join(",")})`,
      a0: `${derived.a0Order.join(" -> ")} (intervals ${derived.a0Edges.map((edge) => edge.rotateInterval).join(",")})`,
    },
    properties: artifact.branch.propertyResults,
    witnesses: derived.expectedWitnesses.map((witness) => `${witness.id}:${witness.kind}:${witness.dihedralElement}`),
    branch: artifact.branch.label,
    mutationProbes: driftProbes.length + staticProbes.length + stripProbes.length,
    probeStaticRejections: staticRejections,
  }, null, 2));
}

validate();
