#!/usr/bin/env node
/**
 * Validate the generated BL-090 D7 office-purity derivation against its
 * sources.
 *
 * Independent of the generator: re-reads the 462-record ledger, the network,
 * the containment mesh and the landed chain artifacts; independently
 * re-derives the kappa inputs (P7, positions, constructors, midpoints - a
 * local reimplementation, not an import), the domain verification, the R-OFF
 * calibration, the M1 anchor field, the M2 affine transports and the D6
 * transport attempt, the selections, the controls, the discovery block, the
 * gates and the branch classification; re-checks the artifact fingerprint;
 * statically verifies the generator's region-scoped isolation (forbidden
 * reads absent from the intrinsic region; the comparison region's office
 * reads present - the region-scoping proof; a permissive probe passes; a
 * proof-strip probe is rejected); and runs mutation probes (artifact drift,
 * smuggled reads, presence-strip). Fail-loud.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..", "..");

const ARTIFACT_PATH = "orrery/src/generated/bl090-d7-office-purity-derivation.v1.json";
const GENERATOR_PATH = "scripts/build-bl090-d7-office-purity-derivation.mjs";
const SCHEMA_VERSION = "harmonic-orrery.bl090-d7-office-purity-derivation.v1";
const DERIVATION_ID = "BL090_D7_OFFICE_PURITY_DERIVATION_V1";
const LEDGER_PATH = "canonical/universal-heptatonic-ledger.csv";
const NETWORK_PATH = "canonical/universal-network-data.json";
const MESH_PATH = "derived/hypergraph/bipartite-inclusion-v1.json";
const BL063_PATH = "orrery/src/generated/bl063-office-reconstruction.v1.json";
const BL064_PATH = "orrery/src/generated/bl064-cycle-ground.v1.json";
const BL066_PATH = "orrery/src/generated/bl066-r-edge-derivation.v1.json";
const BL068_PATH = "orrery/src/generated/bl068-d7-asymmetry.v1.json";
const BL070_PATH = "orrery/src/generated/bl070-d7-derivation.v1.json";
const BL078_PATH = "orrery/src/generated/bl078-d7-retest.v1.json";
const BL089_PATH = "orrery/src/generated/bl089-anchoring-remainder-interaction.v1.json";

const BL063_FINGERPRINT = "6d33c67be7b8f87b8ad2f964cd3560ebcbc1ec0dc6b2088ad1f223c35caff8c3";
const BL064_FINGERPRINT = "aa975820136658dd2fb3c84d98b34bf7a1901d39edd6548a300f458858305918";
const BL066_FINGERPRINT = "94f0661ff6e76b0dea69fbe9f09ead24da7901393fb735495f3a25c3d9a1a886";
const BL068_FINGERPRINT = "b0d65bd6149978de4f5ef3f1a0b281d0f6324a81114e8aa9da07eda8ef5ef849";
const BL070_FINGERPRINT = "9db10a088a05664a5cf60f6fad14514a4fc9aab278dcf0359d684bce70607731";
const BL078_FINGERPRINT = "11644d401eff5ef951a2173f390041531743df682ad9c502f98a048c0f76e1b1";
const BL089_FINGERPRINT = "eb1526bed7f333f83ce6f610b59e0d4ced933d2b8ad91579a63da2d7277e2fb0";

const TRANSIT = {
  T1: { id: "T1", unit: 5, a: 5, b: 2, expression: "y = 5x + 2 (mod 7)" },
  T2: { id: "T2", unit: 7, a: 2, b: 4, expression: "y = 2x + 4 (mod 7)" },
};

const NON_Z_D_FAMILIES = ["7-1", "7-15", "7-22", "7-8"];
const Z_D_FAMILIES = ["7-Z12", "7-Z17", "7-Z37"];

function fail(message) {
  throw new Error(`INVALID_BL090_D7_OFFICE_PURITY_DERIVATION: ${message}`);
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

const cmp = (left, right) => (left < right ? -1 : left > right ? 1 : 0);
const sortedUnique = (values) => [...new Set(values)].sort(cmp);

function maskOfPitches(pitches) {
  let mask = 0;
  for (const pitch of pitches) mask |= 1 << pitch;
  return mask;
}

function parsePitchSet(text) {
  const trimmed = text.replace(/[{}]/g, "");
  if (trimmed.length === 0) return [];
  return trimmed.split(",").map((value) => Number(value));
}

function hamming12(a, b) {
  let x = a ^ b;
  let count = 0;
  while (x !== 0) { count += x & 1; x >>= 1; }
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

function affineImage(mask, unit) {
  let image = 0;
  for (let pitch = 0; pitch < 12; pitch += 1) {
    if ((mask >> pitch) & 1) image |= 1 << ((unit * pitch) % 12);
  }
  return image & 4095;
}

function midZ7(a, b) {
  return (4 * (a + b)) % 7;
}

// ---- local reimplementation of the BL-063 masks-only functions ------------

function deriveP7(a0Masks) {
  const nodes = a0Masks.map((mask) => ({ mask, degree: 0 }));
  const edges = [];
  for (let i = 0; i < a0Masks.length; i += 1) {
    for (let j = i + 1; j < a0Masks.length; j += 1) {
      if (hamming12(a0Masks[i], a0Masks[j]) === 2) {
        edges.push([a0Masks[i], a0Masks[j]].sort(cmp));
        nodes.find((node) => node.mask === a0Masks[i]).degree += 1;
        nodes.find((node) => node.mask === a0Masks[j]).degree += 1;
      }
    }
  }
  edges.sort((left, right) => cmp(left[0], right[0]) || cmp(left[1], right[1]));
  const endpoints = nodes.filter((node) => node.degree === 1).map((node) => node.mask).sort(cmp);
  const adjacency = new Map(a0Masks.map((mask) => [mask, []]));
  for (const [a, b] of edges) { adjacency.get(a).push(b); adjacency.get(b).push(a); }
  for (const list of adjacency.values()) list.sort(cmp);
  const start = endpoints[0];
  const order = [];
  const visited = new Set([start]);
  const queue = [start];
  while (queue.length > 0) {
    const current = queue.shift();
    order.push(current);
    for (const next of adjacency.get(current)) {
      if (!visited.has(next)) { visited.add(next); queue.push(next); }
    }
  }
  return { edges, endpoints, order };
}

function deriveKappaLocal(p7) {
  return {
    kappa0: new Map(p7.order.map((mask, index) => [mask, index])),
    kappa1: new Map(p7.order.map((mask, index) => [mask, 6 - index])),
  };
}

function sandwichHolds(p, q, child) {
  const inter = p & q;
  const union = p | q;
  return ((inter & child) === inter) && ((child & union) === child);
}

function derivePiLocal(a1Mask, p7) {
  const neighbors = p7.order
    .filter((mask) => hamming12(mask, a1Mask) === 2)
    .sort(cmp);
  if (neighbors.length === 2) {
    const [p, q] = neighbors;
    if (!sandwichHolds(p, q, a1Mask)) fail(`construction envelope: sandwich fails at ${a1Mask}`);
    return { child: a1Mask, constructors: [p, q].sort(cmp) };
  }
  if (neighbors.length === 1) {
    const pStar = neighbors[0];
    const twins = p7.order
      .filter((q) => q !== pStar && (
        rotateMask12(pStar, 1) === q || rotateMask12(pStar, 11) === q ||
        rotateMask12(q, 1) === pStar || rotateMask12(q, 11) === pStar))
      .sort(cmp);
    if (twins.length !== 1) fail(`twin-closure: ${twins.length} rotation partners at ${a1Mask}`);
    return { child: a1Mask, constructors: [pStar, twins[0]].sort(cmp) };
  }
  fail(`Hamming-2 neighbor count ${neighbors.length} outside {1,2} at ${a1Mask}`);
}

function deriveMidpointsLocal(piEntry, kappa) {
  const [p, q] = piEntry.constructors;
  return {
    child: piEntry.child,
    g0: midZ7(kappa.kappa0.get(p), kappa.kappa0.get(q)),
    g1: midZ7(kappa.kappa1.get(p), kappa.kappa1.get(q)),
  };
}

function confusion(keys, targetSet, predicate) {
  let tp = 0, fp = 0, fn = 0, tn = 0;
  for (const key of keys) {
    const predicted = predicate(key);
    const actual = targetSet.has(key);
    if (actual && predicted) tp += 1;
    else if (actual && !predicted) fn += 1;
    else if (!actual && predicted) fp += 1;
    else tn += 1;
  }
  return { tp, fp, fn, tn };
}

const isClean = (matrix) => matrix.tp === 14 && matrix.fp === 0 && matrix.fn === 0 && matrix.tn === 22;

const SORT_INSTANCE_KEYS = (left, right) => {
  const [la, ls] = left.split(":").map(Number);
  const [ra, rs] = right.split(":").map(Number);
  return la - ra || ls - rs;
};

// ---------------------------------------------------------------------------
// Independent re-derivation
// ---------------------------------------------------------------------------

function reDerive(sources) {
  const { ledgerRows, network, mesh, bl063, bl064, bl066, bl068, bl070, bl078, bl089 } = sources;
  if (ledgerRows.length !== 462) fail(`ledger census ${ledgerRows.length}`);

  const masks = new Map(ledgerRows.map((row) => [String(row.id), maskOfPitches(parsePitchSet(row.pitchSet))]));
  for (const row of ledgerRows) {
    if (masks.get(String(row.id)) !== Number(row.id)) fail(`ledger mask/id disagreement at ${row.id}`);
  }
  const grantedOfficeIndex = new Map(ledgerRows.map((row) => [String(row.id), Number(row.officeIndex)]));

  // D1 partition
  const anchorRows = ledgerRows.filter((row) => row.tier === "D7" && row.role === "anchor").sort((a, b) => Number(a.id) - Number(b.id));
  const satelliteRows = ledgerRows.filter((row) => row.tier === "D6" && row.role === "satellite").sort((a, b) => Number(a.id) - Number(b.id));
  if (anchorRows.length !== 7 || satelliteRows.length !== 14) fail("D7/D6 partition census drift");
  const anchorIds = anchorRows.map((row) => String(row.id));
  const satelliteIds = satelliteRows.map((row) => String(row.id));

  // D2 reach
  const perAnchor = anchorIds.map((anchor) => {
    const instances = satelliteIds.filter((satellite) => hamming12(masks.get(anchor), masks.get(satellite)) === 2);
    return { anchor, instances, count: instances.length };
  });
  const instanceKeys = perAnchor.flatMap((entry) => entry.instances.map((satellite) => `${entry.anchor}:${satellite}`)).sort(SORT_INSTANCE_KEYS);
  if (instanceKeys.length !== 36) fail(`domain size ${instanceKeys.length}`);
  const perAnchorCounts = perAnchor.map((entry) => entry.count);
  if (canonicalText(perAnchorCounts) !== canonicalText([4, 5, 6, 6, 6, 5, 4])) fail("per-anchor count drift");
  const distinctStates = sortedUnique(satelliteIds);
  const parentCounts = new Map(satelliteIds.map((satellite) => [satellite, perAnchor.filter((entry) => entry.instances.includes(satellite)).length]));
  const multiplicityBuckets = {};
  for (const state of distinctStates) {
    const bucket = String(parentCounts.get(state));
    multiplicityBuckets[bucket] = (multiplicityBuckets[bucket] ?? 0) + 1;
  }
  if (canonicalText(multiplicityBuckets) !== canonicalText({ "1": 2, "2": 2, "3": 10 })) fail("multiplicity drift");

  // reach calibration
  const allLedgerReach = anchorIds.map((anchor) => ({
    anchor,
    count: ledgerRows.filter((other) => String(other.id) !== anchor && hamming12(masks.get(anchor), masks.get(String(other.id))) === 2).length,
  }));
  if (allLedgerReach.some((entry) => entry.count !== 30)) fail("all-ledger reach not uniform at 30");
  const d6TierReach = anchorIds.map((anchor) => ({
    anchor,
    count: ledgerRows.filter((other) => other.tier === "D6" && hamming12(masks.get(anchor), masks.get(String(other.id))) === 2).length,
  }));

  // licensed edge content
  const parentOf = new Map();
  for (const edge of network.structuralEdges) {
    if (edge.type === "GOVERNS") {
      if (parentOf.has(String(edge.target))) fail(`satellite ${edge.target} carries two governing anchors`);
      parentOf.set(String(edge.target), String(edge.source));
    }
  }
  if (parentOf.size !== 238) fail("governing census drift");
  const governingParents = sortedUnique(satelliteIds.map((satellite) => parentOf.get(satellite)));
  if (governingParents.length !== 7) fail("governing parent census drift");
  const d6ParentCensus = governingParents.map((parent) => ({
    parent,
    satellites: satelliteIds.filter((satellite) => parentOf.get(satellite) === parent),
  }));
  if (d6ParentCensus.some((entry) => entry.satellites.length !== 2)) fail("D6 governing arity drift");

  // kappa inputs (local reimplementation)
  const a0Rows = ledgerRows.filter((row) => row.tier === "A0" && row.role === "anchor").sort((a, b) => Number(a.id) - Number(b.id));
  const a1Rows = ledgerRows.filter((row) => row.tier === "A1" && row.role === "anchor").sort((a, b) => Number(a.id) - Number(b.id));
  const a0Masks = a0Rows.map((row) => masks.get(String(row.id))).sort(cmp);
  const a1Masks = a1Rows.map((row) => masks.get(String(row.id))).sort(cmp);
  const p7 = deriveP7(a0Masks);
  const kappa = deriveKappaLocal(p7);
  const midpoints = a1Masks.map((mask) => derivePiLocal(mask, p7)).map((entry) => deriveMidpointsLocal(entry, kappa));
  const cA0 = a0Masks.map((mask) => (kappa.kappa1.get(mask) + pcSumOfMask(mask)) % 7);
  const cA1 = a1Masks.map((mask, index) => (midpoints[index].g1 + pcSumOfMask(mask)) % 7);
  const cValues = [...new Set([...cA0, ...cA1])];
  if (cValues.length !== 1) fail("kappa orientation constant is not unique");
  const C = cValues[0];

  // M1
  const m1OfficeOf = new Map();
  const anchorRuleRows = [];
  for (const anchor of sortedUnique([...anchorIds, ...governingParents])) {
    const derived = (C - pcSumOfMask(masks.get(anchor)) + 70) % 7;
    m1OfficeOf.set(anchor, derived);
    anchorRuleRows.push({ id: anchor, pcSum: pcSumOfMask(masks.get(anchor)), derived });
  }
  for (const satellite of satelliteIds) m1OfficeOf.set(satellite, m1OfficeOf.get(parentOf.get(satellite)));
  const m1SelectionKeys = instanceKeys.filter((key) => {
    const [anchor, satellite] = key.split(":");
    return m1OfficeOf.get(anchor) === m1OfficeOf.get(satellite);
  });

  // M2
  const idByMask = new Map(ledgerRows.map((row) => [masks.get(String(row.id)), String(row.id)]));
  const m2Of = (map) => {
    const a0ByImage = new Map(a0Masks.map((mask) => [affineImage(mask, map.unit), mask]));
    const officeById = new Map();
    const partnerById = new Map();
    for (const id of anchorIds) {
      const partnerMask = a0ByImage.get(masks.get(id));
      if (partnerMask === undefined) fail(`M2 ${map.id}: A0 partner missing for ${id}`);
      partnerById.set(id, idByMask.get(partnerMask));
      officeById.set(id, (map.a * kappa.kappa1.get(partnerMask) + map.b) % 7);
    }
    const officeOf = new Map();
    for (const anchor of anchorIds) officeOf.set(anchor, officeById.get(anchor));
    for (const satellite of satelliteIds) officeOf.set(satellite, m1OfficeOf.get(parentOf.get(satellite)));
    const selectionKeys = instanceKeys.filter((key) => {
      const [anchor, satellite] = key.split(":");
      return officeOf.get(anchor) === officeOf.get(satellite);
    });
    return { officeById, partnerById, officeOf, selectionKeys };
  };
  const m2T1 = m2Of(TRANSIT.T1);
  const m2T2 = m2Of(TRANSIT.T2);
  const d6TransportOf = (map) => {
    const a1ByImage = new Map(a1Masks.map((mask) => [affineImage(mask, map.unit), mask]));
    const g1ByMask = new Map(midpoints.map((entry) => [entry.child, entry.g1]));
    const rows = governingParents.map((id) => {
      const partnerMask = a1ByImage.get(masks.get(id));
      if (partnerMask === undefined) fail(`M2 ${map.id}: A1 partner missing for ${id}`);
      return { d6Anchor: id, a1Partner: idByMask.get(partnerMask), source: g1ByMask.get(partnerMask), target: m1OfficeOf.get(id) };
    });
    const affineFits = [];
    for (let a = 1; a <= 6; a += 1) {
      for (let b = 0; b <= 6; b += 1) {
        if (rows.every((row) => (a * row.source + b) % 7 === row.target)) affineFits.push({ a, b });
      }
    }
    const swap = (x) => (x === 0 ? 6 : x === 6 ? 0 : x);
    return {
      rows,
      affineFits,
      affineMismatches: rows.filter((row) => (map.a * row.source + map.b) % 7 !== row.target).map((row) => row.d6Anchor),
      swapResolutionMismatches: rows.filter((row) => (map.a * swap(row.source) + map.b) % 7 !== row.target).map((row) => row.d6Anchor),
    };
  };
  const m2T1D6 = d6TransportOf(TRANSIT.T1);
  const m2T2D6 = d6TransportOf(TRANSIT.T2);

  // evaluation target and control
  const contactKeys = network.d7SeatContactRows.map((row) => `${String(row.target)}:${String(row.source)}`).sort(SORT_INSTANCE_KEYS);
  if (contactKeys.length !== 14) fail("contact census drift");
  const contactSet = new Set(contactKeys);
  const calibrationConfusion = confusion(instanceKeys, contactSet, (key) => {
    const [anchor, satellite] = key.split(":");
    return grantedOfficeIndex.get(anchor) === grantedOfficeIndex.get(satellite);
  });
  if (!isClean(calibrationConfusion)) fail("calibration drift: R-OFF is not clean on the verified domain");
  const calibrationKeys = instanceKeys.filter((key) => {
    const [anchor, satellite] = key.split(":");
    return grantedOfficeIndex.get(anchor) === grantedOfficeIndex.get(satellite);
  });

  const m1Confusion = confusion(instanceKeys, contactSet, (key) => {
    const [anchor, satellite] = key.split(":");
    return m1OfficeOf.get(anchor) === m1OfficeOf.get(satellite);
  });
  const m1SetEqual = canonicalText(m1SelectionKeys) === canonicalText(contactKeys);
  if (!m1SetEqual) fail("M1 selection not set-equal to the contacts");
  const selectionConfusionOf = (officeOf) => confusion(instanceKeys, contactSet, (key) => {
    const [anchor, satellite] = key.split(":");
    return officeOf.get(anchor) === officeOf.get(satellite);
  });
  const m2T1Confusion = selectionConfusionOf(m2T1.officeOf);
  const m2T2Confusion = selectionConfusionOf(m2T2.officeOf);
  const m2T1SetEqual = canonicalText(m2T1.selectionKeys) === canonicalText(contactKeys);
  const m2T2SetEqual = canonicalText(m2T2.selectionKeys) === canonicalText(contactKeys);
  if (!m2T1SetEqual || !m2T2SetEqual) fail("M2 selection not set-equal to the contacts");

  // kappa recovery comparisons
  const a0Recovered = a0Rows.map((row) => {
    const id = String(row.id);
    const kappa1 = kappa.kappa1.get(masks.get(id));
    return { id, kappa1, canonical: grantedOfficeIndex.get(id), match: kappa1 === grantedOfficeIndex.get(id) };
  });
  const a1Recovered = midpoints.map((entry) => {
    const id = idByMask.get(entry.child);
    return { id, g1: entry.g1, canonical: grantedOfficeIndex.get(id), match: entry.g1 === grantedOfficeIndex.get(id) };
  });
  if (a0Recovered.some((entry) => !entry.match) || a1Recovered.some((entry) => !entry.match)) fail("kappa recovery drift");

  const blockNodeIds = sortedUnique([...anchorIds, ...governingParents, ...satelliteIds]);
  const blockFieldChecks = blockNodeIds.map((id) => ({
    id,
    derived: m1OfficeOf.get(id),
    canonical: grantedOfficeIndex.get(id),
    match: m1OfficeOf.get(id) === grantedOfficeIndex.get(id),
  }));
  if (blockFieldChecks.some((entry) => !entry.match)) fail("M1 field disagrees with the canonical offices on the block");

  // per-anchor contacts
  const perAnchorContacts = perAnchor.map((entry) => ({
    anchor: entry.anchor,
    contacts: entry.instances.filter((satellite) => contactSet.has(`${entry.anchor}:${satellite}`)),
  }));

  // Z control
  const subnodesByMask = new Map(Object.values(mesh.heptatonicNodes).map((node) => [String(node.pitchMask), node.subnodes]));
  const pentatonicById = mesh.pentatonicSubnodes;
  const signOf = (mask) => {
    const subnodes = subnodesByMask.get(String(mask));
    if (!subnodes) fail(`mesh node missing for mask ${mask}`);
    const shared = (family) => subnodes.filter((id) => (pentatonicById[id]?.parentsUnrooted ?? []).includes(family)).length;
    return NON_Z_D_FAMILIES.reduce((sum, family) => sum + shared(family), 0)
      - Z_D_FAMILIES.reduce((sum, family) => sum + shared(family), 0);
  };
  const satelliteSigns = new Map(satelliteIds.map((state) => [state, signOf(masks.get(state))]));
  const zConfusion = confusion(instanceKeys, contactSet, (key) => satelliteSigns.get(key.split(":")[1]) < 0);
  const bl068ZAxis = bl068.axes.find((axis) => axis.axis === "zInterface");
  if (canonicalText(zConfusion) !== canonicalText(bl068ZAxis.confusion)) fail("Z control disagrees with the landed BL-068 axis");
  const zMajorityStates = satelliteIds.filter((state) => satelliteSigns.get(state) < 0);

  // discovery
  const successor = new Map(network.d7ModalRows.map((row) => [String(row.source), String(row.target)]));
  const d7Orbit = [];
  let cursor = anchorIds[0];
  for (let step = 0; step < 7; step += 1) {
    d7Orbit.push(cursor);
    const next = successor.get(cursor);
    if (!next) fail(`orbit dead-end at ${cursor}`);
    cursor = next;
  }
  if (cursor !== anchorIds[0]) fail("orbit does not close");
  const d6AnchorOrbit = network.sevenEightOrbit.map(String);
  if (canonicalText(sortedUnique(d6AnchorOrbit)) !== canonicalText(sortedUnique(governingParents))) {
    fail("D6 orbit is not set-equal to the governing parents");
  }
  const stepHolds = (order) => order.every((id, index) => {
    const next = order[(index + 1) % order.length];
    return ((m1OfficeOf.get(next) - m1OfficeOf.get(id)) + 14) % 7 === 2;
  });
  const d7OrbitStepHolds = stepHolds(d7Orbit);
  const d6OrbitStepHolds = stepHolds(d6AnchorOrbit);
  const officeSequencesEqual = d7Orbit.every((id, index) => m1OfficeOf.get(id) === m1OfficeOf.get(d6AnchorOrbit[index]));
  const orbitIndex = new Map();
  d7Orbit.forEach((id, index) => orbitIndex.set(id, index));
  d6AnchorOrbit.forEach((id, index) => orbitIndex.set(id, index + 100));
  const orbitConfusion = confusion(instanceKeys, contactSet, (key) => {
    const [anchor, satellite] = key.split(":");
    return orbitIndex.get(anchor) === orbitIndex.get(parentOf.get(satellite)) - 100;
  });

  // landed-domain set-equality
  const bl068Keys = bl068.census.availabilityDomain.perAnchor
    .flatMap((entry) => entry.instances.map((instance) => instance.key))
    .sort(SORT_INSTANCE_KEYS);
  const bl070Keys = bl070.domainDerivation.perAnchor
    .flatMap((entry) => entry.satellites ?? entry.instances.map((satellite) => `${entry.anchor}:${satellite}`))
    .sort(SORT_INSTANCE_KEYS);
  const bl068SetEqual = canonicalText(bl068Keys) === canonicalText(instanceKeys);
  const bl070SetEqual = canonicalText(bl070Keys) === canonicalText(instanceKeys);
  if (!bl068SetEqual || !bl070SetEqual) fail("derived domain not set-equal to the landed domains");

  const branchLabel = "FULL_DERIVATION";
  return {
    sources,
    anchorIds, satelliteIds, perAnchor, perAnchorCounts, instanceKeys, distinctStates, parentCounts, multiplicityBuckets,
    allLedgerReach, d6TierReach, governingParents, d6ParentCensus, contactKeys, contactSet,
    calibrationConfusion, calibrationKeys, m1OfficeOf, anchorRuleRows, m1SelectionKeys, m1Confusion, m1SetEqual,
    C, p7, kappa, midpoints, a0Recovered, a1Recovered, blockNodeIds, blockFieldChecks,
    m2T1, m2T2, m2T1D6, m2T2D6, m2T1Confusion, m2T2Confusion, m2T1SetEqual, m2T2SetEqual,
    perAnchorContacts, zConfusion, zMajorityStates, satelliteSigns,
    d7Orbit, d6AnchorOrbit, d7OrbitStepHolds, d6OrbitStepHolds, officeSequencesEqual, orbitConfusion,
    bl068SetEqual, bl070SetEqual, branchLabel,
  };
}

// ---------------------------------------------------------------------------
// Artifact checks
// ---------------------------------------------------------------------------

function checkAgainstSources(artifact, derived) {
  const {
    anchorIds, satelliteIds, perAnchor, instanceKeys, distinctStates, parentCounts, multiplicityBuckets,
    allLedgerReach, d6TierReach, governingParents, d6ParentCensus, contactKeys, contactSet,
    calibrationConfusion, m1OfficeOf, anchorRuleRows, m1SelectionKeys, m1Confusion, m1SetEqual,
    C, a0Recovered, a1Recovered, blockNodeIds, blockFieldChecks,
    m2T1, m2T2, m2T1D6, m2T2D6, m2T1Confusion, m2T2Confusion, m2T1SetEqual, m2T2SetEqual,
    perAnchorContacts, zConfusion, zMajorityStates,
    d7Orbit, d6AnchorOrbit, d7OrbitStepHolds, d6OrbitStepHolds, officeSequencesEqual, orbitConfusion,
    bl068SetEqual, bl070SetEqual,
  } = derived;

  if (artifact.schemaVersion !== SCHEMA_VERSION || artifact.derivationId !== DERIVATION_ID) fail("artifact header drift");
  if (artifact.status !== "planning_evidence") fail("status drift");
  if (artifact.generator !== "scripts/build-bl090-d7-office-purity-derivation.mjs") fail("generator path drift");

  // source bindings
  const bindingPaths = artifact.sourceBindings.map((binding) => binding.artifact);
  if (canonicalText(sortedUnique(bindingPaths)) !== canonicalText(sortedUnique([
    LEDGER_PATH, NETWORK_PATH, MESH_PATH, BL063_PATH, BL064_PATH, BL066_PATH, BL068_PATH, BL070_PATH, BL078_PATH, BL089_PATH,
  ]))) fail("source binding set drift");
  for (const binding of artifact.sourceBindings) {
    if (binding.sha256 !== fileSha(binding.artifact)) fail(`source binding sha drift: ${binding.artifact}`);
  }

  // chain fingerprints (literals + self-check of the chain artifacts)
  const chain = artifact.base.chainFingerprints;
  if (chain.bl063 !== BL063_FINGERPRINT || chain.bl064 !== BL064_FINGERPRINT || chain.bl066 !== BL066_FINGERPRINT
    || chain.bl068 !== BL068_FINGERPRINT || chain.bl070 !== BL070_FINGERPRINT || chain.bl078 !== BL078_FINGERPRINT
    || chain.bl089 !== BL089_FINGERPRINT) fail("chain fingerprint literal drift");
  const chainChecks = [
    [derived.sources.bl063, "reconstructionFingerprint", BL063_FINGERPRINT],
    [derived.sources.bl064, "derivationFingerprint", BL064_FINGERPRINT],
    [derived.sources.bl066, "derivationFingerprint", BL066_FINGERPRINT],
    [derived.sources.bl068, "derivationFingerprint", BL068_FINGERPRINT],
    [derived.sources.bl070, "derivationFingerprint", BL070_FINGERPRINT],
    [derived.sources.bl078, "derivationFingerprint", BL078_FINGERPRINT],
    [derived.sources.bl089, "investigationFingerprint", BL089_FINGERPRINT],
  ];
  for (const [chainArtifact, key, literal] of chainChecks) {
    const { [key]: fingerprint, ...core } = chainArtifact;
    if (sha256(canonicalText(core)) !== fingerprint || fingerprint !== literal) fail(`chain fingerprint drift: ${key}`);
  }

  // pre-registration
  const rulingIds = artifact.preRegistration.rulings.map((ruling) => ruling.id);
  if (canonicalText(rulingIds) !== canonicalText(["OD-90-1", "OD-90-2", "OD-90-3"])) fail("ruling inventory drift");
  if (artifact.preRegistration.rule.id !== "R-kappa") fail("pre-registered rule id drift");
  if (canonicalText(artifact.preRegistration.branchCriteria) !== canonicalText(artifact.branch.criteria)) fail("branch criteria drift");
  if (!artifact.preRegistration.kappaVerdictTable.both || !artifact.preRegistration.kappaVerdictTable.one
    || !artifact.preRegistration.kappaVerdictTable.neither) fail("kappa verdict table drift");
  const refutationIds = artifact.preRegistration.refutationConditions.map((entry) => entry.id);
  if (canonicalText(refutationIds) !== canonicalText(["R-90-1", "R-90-2", "R-90-3", "R-90-4"])) fail("refutation condition inventory drift");

  // domain verification
  const domain = artifact.domainVerification;
  if (canonicalText(domain.partition.anchors) !== canonicalText(anchorIds)) fail("partition anchors drift");
  if (canonicalText(domain.partition.satellites) !== canonicalText(satelliteIds)) fail("partition satellites drift");
  if (canonicalText(domain.partition.governingCensus) !== canonicalText(d6ParentCensus)) fail("governing census drift");
  if (canonicalText(domain.perAnchor) !== canonicalText(perAnchor)) fail("domain per-anchor drift");
  if (domain.domainSize !== 36 || domain.distinctStates !== 14) fail("domain size drift");
  if (canonicalText(domain.multiplicity) !== canonicalText(multiplicityBuckets)) fail("multiplicity drift");
  if (canonicalText(domain.calibration.allLedgerReachPerAnchor) !== canonicalText(allLedgerReach)) fail("all-ledger reach drift");
  if (domain.calibration.allLedgerReachUniform !== true) fail("uniform reach flag drift");
  if (canonicalText(domain.calibration.d6TierReachPerAnchor) !== canonicalText(d6TierReach)) fail("D6-tier reach drift");
  if (domain.setEquality.bl068SetEqual !== bl068SetEqual || domain.setEquality.bl070SetEqual !== bl070SetEqual) fail("set-equality flag drift");
  if (domain.setEquality.bl068DomainSize !== 36 || domain.setEquality.bl070DomainSize !== 36) fail("landed domain sizes drift");
  if (domain.setEquality.contactsSubsetOfDerivedDomain !== true) fail("contacts-subset flag drift");
  if (!domain.nonCircularity.includes("no office value")) fail("non-circularity statement drift");

  // calibration
  if (artifact.calibration.rule.id !== "R-OFF") fail("calibration rule id drift");
  if (canonicalText(artifact.calibration.confusion) !== canonicalText(calibrationConfusion)) fail("calibration confusion drift");
  if (artifact.calibration.verdict !== "CLEAN_SPLIT" || artifact.calibration.exact !== true) fail("calibration verdict drift");
  if (artifact.calibration.actualRelation.count !== 14) fail("calibration target count drift");
  if (!artifact.calibration.licence.includes("domain would be wrong, not the rule")) fail("calibration licence drift");

  // kappa grounding
  const grounding = artifact.kappaGrounding;
  if (grounding.gate !== "V-D7D-3") fail("kappa grounding gate id drift");
  if (canonicalText(grounding.rule) !== canonicalText(artifact.preRegistration.rule)) fail("grounding rule block drift");
  if (grounding.kappaRecovery.orientationConstant.C !== C) fail("orientation constant drift");
  if (canonicalText(grounding.kappaRecovery.kappa1MatchesCanonical) !== canonicalText(7)) fail("kappa1 match count drift");
  if (grounding.kappaRecovery.midpointMatchesCanonical !== 7) fail("midpoint match count drift");
  if (canonicalText(grounding.kappaRecovery.a0Recovered) !== canonicalText(a0Recovered)) fail("a0 recovery block drift");
  if (canonicalText(grounding.kappaRecovery.a1Recovered) !== canonicalText(a1Recovered)) fail("a1 recovery block drift");
  if (grounding.blockField.nodes !== blockNodeIds.length || grounding.blockField.matches !== blockNodeIds.length) fail("block field census drift");
  if (canonicalText(grounding.blockField.checks) !== canonicalText(blockFieldChecks)) fail("block field checks drift");
  const m1 = grounding.mappings.M1;
  if (canonicalText(m1.anchorRuleRows) !== canonicalText(anchorRuleRows)) fail("M1 anchor rule rows drift");
  if (m1.orientationConstant !== C) fail("M1 orientation constant drift");
  if (canonicalText(m1.selection.keys) !== canonicalText(m1SelectionKeys)) fail("M1 selection keys drift");
  if (canonicalText(m1.selection.confusion) !== canonicalText(m1Confusion)) fail("M1 confusion drift");
  if (m1.selection.setEqual !== m1SetEqual || m1SetEqual !== true) fail("M1 set-equality drift");
  const m2 = grounding.mappings.M2;
  const poleCheck = (side, offices, transportCheck) => {
    const agreements = anchorIds.map((id) => ({
      id,
      m1: m1OfficeOf.get(id),
      transported: offices.officeById.get(id),
      partner: offices.partnerById.get(id),
      match: offices.officeById.get(id) === m1OfficeOf.get(id),
    }));
    if (canonicalText(side.d7Pole.agreements) !== canonicalText(agreements)) fail("M2 D7-pole agreements drift");
    if (side.d7Pole.agreementCount !== 7) fail("M2 D7-pole agreement count drift");
    if (canonicalText(side.d6Pole.rows) !== canonicalText(transportCheck.rows)) fail("M2 D6 rows drift");
    if (canonicalText(side.d6Pole.affineFits) !== canonicalText(transportCheck.affineFits)) fail("M2 affine fits drift");
    if (canonicalText(side.d6Pole.affineMismatches) !== canonicalText(transportCheck.affineMismatches)) fail("M2 affine mismatch loci drift");
    if (canonicalText(side.d6Pole.swapResolutionMismatches) !== canonicalText(transportCheck.swapResolutionMismatches)) fail("M2 swap resolution drift");
  };
  poleCheck(m2.T1, m2T1, m2T1D6);
  poleCheck(m2.T2, m2T2, m2T2D6);
  if (canonicalText(m2.selection.T1.confusion) !== canonicalText(m2T1Confusion)) fail("M2 T1 confusion drift");
  if (canonicalText(m2.selection.T2.confusion) !== canonicalText(m2T2Confusion)) fail("M2 T2 confusion drift");
  if (m2.selection.T1.setEqual !== m2T1SetEqual || m2.selection.T2.setEqual !== m2T2SetEqual) fail("M2 set-equality drift");
  if (canonicalText(m2.selection.T1.keys) !== canonicalText(m2T1.selectionKeys)) fail("M2 T1 keys drift");
  if (canonicalText(m2.selection.T2.keys) !== canonicalText(m2T2.selectionKeys)) fail("M2 T2 keys drift");
  if (grounding.verdict !== "BOTH") fail("kappa verdict drift");
  if (canonicalText(grounding.perAnchorContacts) !== canonicalText(perAnchorContacts)) fail("per-anchor contact census drift");

  // controls
  if (canonicalText(artifact.controls.zInterface.confusion) !== canonicalText(zConfusion)) fail("Z control confusion drift");
  if (artifact.controls.zInterface.verdict !== "NON_SEPARATING") fail("Z control verdict drift");
  if (canonicalText(artifact.controls.zInterface.zMajorityStates) !== canonicalText(zMajorityStates)) fail("Z control state list drift");
  if (!artifact.controls.midpoint.statement.includes("does not select")) fail("midpoint control statement drift");

  // discovery
  const discovery = artifact.discovery;
  if (discovery.status !== "UNPROMOTED_DISCOVERY") fail("discovery status drift (must stay un-promoted)");
  if (!discovery.branchEffect.startsWith("none")) fail("discovery branch effect drift");
  if (canonicalText(discovery.orbitAlignment.d7Orbit) !== canonicalText(d7Orbit)) fail("discovery D7 orbit drift");
  if (canonicalText(discovery.orbitAlignment.d6AnchorOrbit) !== canonicalText(d6AnchorOrbit)) fail("discovery D6 orbit drift");
  if (discovery.orbitAlignment.officeSequencesEqual !== officeSequencesEqual || officeSequencesEqual !== true) fail("office sequence equality drift");
  if (discovery.orbitAlignment.d7OrbitStepHolds !== d7OrbitStepHolds || discovery.orbitAlignment.d6OrbitStepHolds !== d6OrbitStepHolds) fail("orbit step flags drift");
  if (d7OrbitStepHolds !== true || d6OrbitStepHolds !== true) fail("orbit step law failed");
  if (canonicalText(discovery.orbitAlignment.orbitPredicateConfusion) !== canonicalText(orbitConfusion)) fail("orbit predicate confusion drift");

  // isolation
  if (artifact.isolation.regime !== "region-scoped") fail("isolation regime drift");
  if (artifact.isolation.officeBytesInDerivationPath !== 0) fail("isolation office-byte count drift");
  if (!artifact.isolation.statements.some((statement) => statement.includes("zero granted-office bytes"))) fail("isolation zero-office statement drift");
  if (!artifact.isolation.validatorDiscipline.includes("permissive probe")) fail("isolation validator-discipline drift");

  // gates and branch
  if (artifact.gates["V-D7D-1"].result !== "PASS" || artifact.gates["V-D7D-2"].result !== "PASS"
    || artifact.gates["V-D7D-3"].result !== "PASS" || artifact.gates["V-D7D-4"].result !== "PASS"
    || artifact.gates["V-D7D-5"].result !== "PASS") fail("gate result drift");
  if (artifact.branch.label !== "FULL_DERIVATION") fail("branch label drift");
  if (canonicalText(artifact.branch.gateResults) !== canonicalText({
    "V-D7D-1": "PASS", "V-D7D-2": "PASS", "V-D7D-3": "PASS", "V-D7D-4": "PASS", "V-D7D-5": "PASS",
  })) fail("branch gate results drift");
  if (!artifact.branch.statement.includes("set-equal to the 14 landed contacts")) fail("branch statement drift");
  const fired = artifact.interpretation.branches.filter((entry) => entry.fired).map((entry) => entry.label);
  if (canonicalText(fired) !== canonicalText(["FULL_DERIVATION"]) || artifact.interpretation.fired !== "FULL_DERIVATION") fail("interpretation fired-branch drift");
  if (!artifact.interpretation.partialFramingCarried.includes("did not fire")) fail("partial framing note drift");

  // synthesis
  if (artifact.synthesis.verdict !== "FULL_DERIVATION") fail("synthesis verdict drift");
  if (artifact.synthesis.kappaGroundingVerdict !== "BOTH") fail("synthesis kappa verdict drift");
  if (!artifact.synthesis.d7Tier.includes("hypothesis-tier")) fail("synthesis D7 tier drift");

  // accounting
  if (artifact.accounting.masksOnly.length < 5 || artifact.accounting.canonicalComputation.length < 5
    || artifact.accounting.remainingGranted.length < 3) fail("accounting tier inventory drift");
  if (!artifact.accounting.statement.includes("comparison target + control")) fail("accounting statement drift");
  if (!artifact.accounting.officePathFence.includes("zero granted office bytes")) fail("accounting fence drift");

  // fences
  if (!artifact.fences.d7HypothesisTier.includes("2703-2712")) fail("D7 fence anchor drift");
  if (!artifact.fences.officeFieldDiscipline.includes("halt")) fail("office-field halt clause drift");
  if (!artifact.fences.membrane.includes("never a derivation input")) fail("membrane fence drift");
  if (!artifact.fences.sessionProse.includes("context, not evidence")) fail("session-prose fence drift");
  if (!artifact.fences.failLoud.includes("did not fire")) fail("fail-loud fence drift");
  if (artifact.notAccomplished.length !== 7) fail("notAccomplished inventory drift");
  if (artifact.contractCitations.length < 15) fail("contract citation inventory drift");
}

// ---------------------------------------------------------------------------
// Static generator checks (region-scoped)
// ---------------------------------------------------------------------------

function staticIntrinsicCheck(sourceText) {
  const begin = sourceText.indexOf("INTRINSIC-DERIVATION-BEGIN");
  const end = sourceText.indexOf("INTRINSIC-DERIVATION-END");
  if (begin < 0 || end < 0 || end <= begin) fail("generator intrinsic-region markers missing");
  const before = sourceText.slice(0, begin);
  const region = sourceText.slice(begin, end);
  const comparison = sourceText.slice(end);
  const forbidden = [
    /projection\.R\b/, /projection\.E\b/, /generation\.projection/,
    /officeIndex/, /parentOffice/, /\.office\b/, /relationalOffice/,
    /\bforte\b/, /intervalVector/, /setClass/, /observed/, /coverage/,
    /d7AnchorRows/, /d7SeatContactRows/, /d7ModalRows/,
  ];
  for (const pattern of forbidden) {
    if (pattern.test(region)) fail(`generator intrinsic region reads a forbidden input: ${pattern}`);
    if (pattern.test(before)) fail(`forbidden token before the intrinsic region: ${pattern}`);
  }
  if (!/officeIndex/.test(comparison)) fail("region-scoping proof failed: the comparison region does not read the office index");
  if (!/d7SeatContactRows/.test(comparison)) fail("region-scoping proof failed: the comparison region does not read the network records");
  const required = [
    "ledgerRows", "pitchSet", "hamming12", "affineImage", "maskOfRow", "pcSumOfMask",
    "deriveKappaInputs", "deriveDomain", "deriveM1Offices", "deriveM2D7Offices", "deriveM2D6Transport", "deriveAllLedgerReach",
  ];
  for (const token of required) {
    if (!region.includes(token)) fail(`generator intrinsic region is missing a required masks-only token: ${token}`);
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
    mesh: readJson(MESH_PATH),
    bl063: readJson(BL063_PATH),
    bl064: readJson(BL064_PATH),
    bl066: readJson(BL066_PATH),
    bl068: readJson(BL068_PATH),
    bl070: readJson(BL070_PATH),
    bl078: readJson(BL078_PATH),
    bl089: readJson(BL089_PATH),
  };

  const derived = reDerive(sources);
  checkAgainstSources(artifact, derived);

  const { derivationFingerprint, ...artifactCore } = artifact;
  if (sha256(canonicalText(artifactCore)) !== derivationFingerprint) fail("artifact fingerprint self-check failed");

  const generatorSource = read(GENERATOR_PATH);
  staticIntrinsicCheck(generatorSource);

  const repin = (candidate) => {
    const { derivationFingerprint: ignored, ...probeCore } = candidate;
    void ignored;
    return { ...probeCore, derivationFingerprint: sha256(canonicalText(probeCore)) };
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

  const perAnchorDrift = clone(artifact);
  perAnchorDrift.domainVerification.perAnchor[0].count = 5;
  expectRejection("domain per-anchor count drift", perAnchorDrift);
  const domainSizeDrift = clone(artifact);
  domainSizeDrift.domainVerification.domainSize = 35;
  expectRejection("domain size drift", domainSizeDrift);
  const multiplicityDrift = clone(artifact);
  multiplicityDrift.domainVerification.multiplicity = { "1": 3, "2": 2, "3": 9 };
  expectRejection("multiplicity drift", multiplicityDrift);
  const reachFlip = clone(artifact);
  reachFlip.domainVerification.calibration.allLedgerReachUniform = false;
  expectRejection("uniform reach flip", reachFlip);
  const bl068FlagFlip = clone(artifact);
  bl068FlagFlip.domainVerification.setEquality.bl068SetEqual = false;
  expectRejection("BL-068 set-equality flip", bl068FlagFlip);
  const bl070FlagFlip = clone(artifact);
  bl070FlagFlip.domainVerification.setEquality.bl070SetEqual = false;
  expectRejection("BL-070 set-equality flip", bl070FlagFlip);
  const governingDrift = clone(artifact);
  governingDrift.domainVerification.partition.governingCensus[0].satellites = ["191"];
  expectRejection("governing census drift", governingDrift);
  const calibrationDrift = clone(artifact);
  calibrationDrift.calibration.confusion.fn = 1;
  expectRejection("calibration confusion drift", calibrationDrift);
  const calibrationExactFlip = clone(artifact);
  calibrationExactFlip.calibration.exact = false;
  expectRejection("calibration exact flip", calibrationExactFlip);
  const cDrift = clone(artifact);
  cDrift.kappaGrounding.kappaRecovery.orientationConstant.C = 3;
  expectRejection("orientation constant drift", cDrift);
  const kappa1Drift = clone(artifact);
  kappa1Drift.kappaGrounding.kappaRecovery.a0Recovered[0].kappa1 = 0;
  expectRejection("kappa1 recovery drift", kappa1Drift);
  const blockFieldDrift = clone(artifact);
  blockFieldDrift.kappaGrounding.blockField.checks[0].match = false;
  expectRejection("block field check flip", blockFieldDrift);
  const m1RowDrift = clone(artifact);
  m1RowDrift.kappaGrounding.mappings.M1.anchorRuleRows[0].derived = 0;
  expectRejection("M1 anchor rule row drift", m1RowDrift);
  const m1ConfusionDrift = clone(artifact);
  m1ConfusionDrift.kappaGrounding.mappings.M1.selection.confusion.tp = 13;
  expectRejection("M1 confusion drift", m1ConfusionDrift);
  const m1SetEqualFlip = clone(artifact);
  m1SetEqualFlip.kappaGrounding.mappings.M1.selection.setEqual = false;
  expectRejection("M1 set-equality flip", m1SetEqualFlip);
  const m1KeySwap = clone(artifact);
  m1KeySwap.kappaGrounding.mappings.M1.selection.keys = ["127:191", "127:253"];
  expectRejection("M1 key swap", m1KeySwap);
  const m2AgreementDrift = clone(artifact);
  m2AgreementDrift.kappaGrounding.mappings.M2.T1.d7Pole.agreementCount = 6;
  expectRejection("M2 T1 agreement count drift", m2AgreementDrift);
  const m2PartnerDrift = clone(artifact);
  m2PartnerDrift.kappaGrounding.mappings.M2.T2.d7Pole.agreements[0].partner = "1451";
  expectRejection("M2 T2 partner drift", m2PartnerDrift);
  const m2FitPromotion = clone(artifact);
  m2FitPromotion.kappaGrounding.mappings.M2.T1.d6Pole.affineFits = [{ a: 5, b: 2 }];
  expectRejection("M2 affine fit promotion", m2FitPromotion);
  const m2MismatchDrift = clone(artifact);
  m2MismatchDrift.kappaGrounding.mappings.M2.T1.d6Pole.affineMismatches = [];
  expectRejection("M2 affine mismatch strip", m2MismatchDrift);
  const m2SwapDrift = clone(artifact);
  m2SwapDrift.kappaGrounding.mappings.M2.T1.d6Pole.swapResolutionMismatches = ["381"];
  expectRejection("M2 swap resolution drift", m2SwapDrift);
  const m2SetEqualFlip = clone(artifact);
  m2SetEqualFlip.kappaGrounding.mappings.M2.selection.T2.setEqual = false;
  expectRejection("M2 T2 set-equality flip", m2SetEqualFlip);
  const verdictFlip = clone(artifact);
  verdictFlip.kappaGrounding.verdict = "NEITHER";
  expectRejection("kappa verdict flip", verdictFlip);
  const zDrift = clone(artifact);
  zDrift.controls.zInterface.confusion.tp = 5;
  expectRejection("Z control confusion drift", zDrift);
  const zPromotion = clone(artifact);
  zPromotion.controls.zInterface.verdict = "CLEAN_SPLIT";
  expectRejection("Z control verdict promotion", zPromotion);
  const discoveryPromotion = clone(artifact);
  discoveryPromotion.discovery.status = "PROMOTED";
  expectRejection("discovery promotion", discoveryPromotion);
  const orbitDrift = clone(artifact);
  orbitDrift.discovery.orbitAlignment.d7Orbit = ["2111", "127", "3103", "3599", "3847", "3971", "4033"];
  expectRejection("discovery orbit order drift", orbitDrift);
  const orbitConfusionDrift = clone(artifact);
  orbitConfusionDrift.discovery.orbitAlignment.orbitPredicateConfusion.tn = 21;
  expectRejection("orbit confusion drift", orbitConfusionDrift);
  const gateDrift = clone(artifact);
  gateDrift.gates["V-D7D-3"].result = "FAIL";
  expectRejection("kappa gate flip", gateDrift);
  const branchDrift = clone(artifact);
  branchDrift.branch.label = "PARTIAL_DERIVATION";
  expectRejection("branch label drift", branchDrift);
  const interpretationDrift = clone(artifact);
  interpretationDrift.interpretation.branches.find((entry) => entry.label === "PARTIAL_DERIVATION").fired = true;
  expectRejection("interpretation fired flip", interpretationDrift);
  const isolationByteFlip = clone(artifact);
  isolationByteFlip.isolation.officeBytesInDerivationPath = 1;
  expectRejection("isolation office-byte flip", isolationByteFlip);
  const synthesisDrift = clone(artifact);
  synthesisDrift.synthesis.verdict = "PARTIAL_DERIVATION";
  expectRejection("synthesis verdict drift", synthesisDrift);
  const fenceDrift = clone(artifact);
  fenceDrift.fences.officeFieldDiscipline = "unfenced";
  expectRejection("office-field fence drift", fenceDrift);
  const accountingDrift = clone(artifact);
  accountingDrift.accounting.masksOnly = [];
  expectRejection("accounting tier emptying", accountingDrift);
  const bindingDrift = clone(artifact);
  bindingDrift.sourceBindings[0].sha256 = "0".repeat(64);
  expectRejection("source binding sha drift", bindingDrift);
  const chainAnchordrift = clone(artifact);
  chainAnchordrift.base.chainFingerprints.bl089 = "0".repeat(64);
  expectRejection("chain anchor drift", chainAnchordrift);

  const staticProbes = [
    ["smuggled office-index read", "const drawn = ledgerRows[0].officeIndex; void drawn;"],
    ["smuggled office-field read", "const drawn = ledgerRows[0].office; void drawn;"],
    ["smuggled class-label read", "const drawn = ledgerRows[0].forte; void drawn;"],
    ["smuggled relational-office read", "const drawn = ledgerRows[0].relationalOffice; void drawn;"],
    ["smuggled network seat-contact read", "const drawn = network.d7SeatContactRows; void drawn;"],
  ];
  let staticRejections = 0;
  for (const [label, smuggled] of staticProbes) {
    let rejected = false;
    try {
      staticIntrinsicCheck(generatorSource.replace(
        "export function deriveDomain(ledgerRows) {",
        `export function deriveDomain(ledgerRows) { ${smuggled}`,
      ));
    } catch {
      rejected = true;
    }
    if (!rejected) fail(`mutation probe not rejected: ${label}`);
    staticRejections += 1;
  }
  const stripProbes = ["deriveDomain", "hamming12", "affineImage", "maskOfRow", "deriveKappaInputs", "deriveM1Offices"];
  for (const token of stripProbes) {
    let rejected = false;
    try {
      staticIntrinsicCheck(generatorSource.split(token).join("STRIPPED"));
    } catch {
      rejected = true;
    }
    if (!rejected) fail(`presence-strip probe not rejected: ${token}`);
    staticRejections += 1;
  }
  const permissiveSource = generatorSource.replace(
    "// ==== INTRINSIC-DERIVATION-END ====",
    "// ==== INTRINSIC-DERIVATION-END ==== const allowedOfficeRead = ledgerRows[0].office; void allowedOfficeRead;",
  );
  staticIntrinsicCheck(permissiveSource);
  let proofStripRejected = false;
  try {
    staticIntrinsicCheck(generatorSource.split("officeIndex").join("office_index"));
  } catch {
    proofStripRejected = true;
  }
  if (!proofStripRejected) fail("mutation probe not rejected: region-scoping proof strip");
  const regionScopingProbes = 2;

  const mutationProbes = [
    "domain per-anchor count drift", "domain size drift", "multiplicity drift", "uniform reach flip",
    "BL-068 set-equality flip", "BL-070 set-equality flip", "governing census drift",
    "calibration confusion drift", "calibration exact flip", "orientation constant drift",
    "kappa1 recovery drift", "block field check flip", "M1 anchor rule row drift", "M1 confusion drift",
    "M1 set-equality flip", "M1 key swap", "M2 T1 agreement count drift", "M2 T2 partner drift",
    "M2 affine fit promotion", "M2 affine mismatch strip", "M2 swap resolution drift", "M2 T2 set-equality flip",
    "kappa verdict flip", "Z control confusion drift", "Z control verdict promotion", "discovery promotion",
    "discovery orbit order drift", "orbit confusion drift", "kappa gate flip", "branch label drift",
    "interpretation fired flip", "isolation office-byte flip", "synthesis verdict drift",
    "office-field fence drift", "accounting tier emptying", "source binding sha drift", "chain anchor drift",
    ...staticProbes.map(([label]) => label),
    ...stripProbes.map((token) => `presence-strip: ${token}`),
    "region-scoping proof strip",
  ];

  console.log(JSON.stringify({
    artifact: ARTIFACT_PATH,
    status: "PASS",
    derivationFingerprint: artifact.derivationFingerprint,
    chainFingerprints: artifact.base.chainFingerprints,
    domain: `${artifact.domainVerification.domainSize} instances, per-anchor ${artifact.domainVerification.perAnchor.map((entry) => entry.count).join("/")}`,
    calibration: `R-OFF ${artifact.calibration.confusion.tp}/${artifact.calibration.confusion.fp}/${artifact.calibration.confusion.fn}/${artifact.calibration.confusion.tn} (${artifact.calibration.verdict})`,
    M1: `${artifact.kappaGrounding.mappings.M1.selection.confusion.tp}/${artifact.kappaGrounding.mappings.M1.selection.confusion.fp}/${artifact.kappaGrounding.mappings.M1.selection.confusion.fn}/${artifact.kappaGrounding.mappings.M1.selection.confusion.tn} set-equal ${artifact.kappaGrounding.mappings.M1.selection.setEqual}`,
    M2: `T1 ${artifact.kappaGrounding.mappings.M2.selection.T1.setEqual ? "set-equal" : "MISMATCH"}; T2 ${artifact.kappaGrounding.mappings.M2.selection.T2.setEqual ? "set-equal" : "MISMATCH"}; D7-pole ${artifact.kappaGrounding.mappings.M2.T1.d7Pole.agreementCount}/7 + ${artifact.kappaGrounding.mappings.M2.T2.d7Pole.agreementCount}/7; D6 transport affine fits ${artifact.kappaGrounding.mappings.M2.T1.d6Pole.affineFits.length}; swap06 resolution ${artifact.kappaGrounding.mappings.M2.T1.d6Pole.swapResolutionMismatches.length === 0 ? "exact" : "residual"}`,
    kappaVerdict: artifact.kappaGrounding.verdict,
    controls: `zInterface ${artifact.controls.zInterface.confusion.tp}/${artifact.controls.zInterface.confusion.fp}/${artifact.controls.zInterface.confusion.fn}/${artifact.controls.zInterface.confusion.tn}`,
    discovery: `${artifact.discovery.id} ${artifact.discovery.status}`,
    branch: artifact.branch.label,
    gates: artifact.branch.gateResults,
    mutationProbes: mutationProbes.length,
    probeStaticRejections: staticRejections,
    regionScopingProbes: `${regionScopingProbes} (permissive pass + proof strip rejected)`,
  }, null, 2));
}

validate();
