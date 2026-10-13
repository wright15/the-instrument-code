#!/usr/bin/env node
/**
 * Validate the generated BL-072 composite-mechanism investigation against its
 * sources.
 *
 * Independent of the generator: re-reads the 462-record ledger, the network,
 * the containment mesh, the landed BL-068/BL-070/BL-071 artifacts and the
 * landed BL-055 table; re-derives the 36-instance domain, the property table,
 * the two composite terms, the pre-registered label permutation (N=1000, seed
 * 72072), the orbit-window geometry, the fa-pole cross-domain read, and the
 * minimality enumeration; re-checks the artifact fingerprint; statically
 * verifies the generator's two-region isolation (forbidden reads absent from
 * the intrinsic region; the comparison region's labelled reads present - the
 * region-scoping proof; a permissive probe passes; a proof-strip probe is
 * rejected); and runs mutation probes (artifact drift, smuggled reads,
 * presence-strip). Fail-loud.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..", "..");

const ARTIFACT_PATH = "orrery/src/generated/bl072-composite-mechanism.v1.json";
const GENERATOR_PATH = "scripts/build-bl072-composite-mechanism.mjs";
const SCHEMA_VERSION = "harmonic-orrery.bl072-composite-mechanism.v1";
const INVESTIGATION_ID = "BL072_COMPOSITE_MECHANISM_V1";
const LEDGER_PATH = "canonical/universal-heptatonic-ledger.csv";
const NETWORK_PATH = "canonical/universal-network-data.json";
const MESH_PATH = "derived/hypergraph/bipartite-inclusion-v1.json";
const BL068_PATH = "orrery/src/generated/bl068-d7-asymmetry.v1.json";
const BL070_PATH = "orrery/src/generated/bl070-d7-derivation.v1.json";
const BL071_PATH = "orrery/src/generated/bl071-interval-6-structure.v1.json";
const BL055_PATH = "orrery/src/generated/d4-selection-review.v1.json";

const BL068_FINGERPRINT = "b0d65bd6149978de4f5ef3f1a0b281d0f6324a81114e8aa9da07eda8ef5ef849";
const BL070_FINGERPRINT = "9db10a088a05664a5cf60f6fad14514a4fc9aab278dcf0359d684bce70607731";
const BL071_FINGERPRINT = "8b2a1f6ca1776851f721eb6bc6ee6532059d81d150ce3f7c9fda1febfe84c3fe";
const BL055_FINGERPRINT = "6d11fd932efbe96892b3cf2e6a6cdad6f54e69cd2a8f284ebb72232c59d8b745";

const PERMUTATION_N = 1000;
const PERMUTATION_SEED = 72072;
const DISCLOSURE =
  "C-TB-1 was discovered by searching the composite space, not pre-registered — the permutation p-value is conditional on C-TB-1's selection from the search and should be interpreted as a lower bound, not as an independent confirmation.";

const NON_Z_D_FAMILIES = ["7-1", "7-15", "7-22", "7-8"];
const Z_D_FAMILIES = ["7-Z12", "7-Z17", "7-Z37"];
const D_TIER_FAMILIES = [...NON_Z_D_FAMILIES, ...Z_D_FAMILIES];

function fail(message) {
  throw new Error(`INVALID_BL072_COMPOSITE_MECHANISM: ${message}`);
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
const sortedUnique = (values) => [...new Set(values)].sort(cmp);

function maskOfPitches(pitches) {
  let mask = 0;
  for (const pitch of pitches) mask |= 1 << pitch;
  return mask;
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

function rotationRelations(a, b) {
  const hits = [];
  for (let d = 1; d <= 11; d += 1) if (rotateMask12(a, d) === b) hits.push(d);
  return hits;
}

function invertMask12(mask) {
  let result = 0;
  for (let pitch = 0; pitch < 12; pitch += 1) {
    if ((mask >> pitch) & 1) result |= 1 << ((12 - pitch) % 12);
  }
  return result;
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

function confusion(keys, recordedSet, predicate) {
  let tp = 0, fp = 0, fn = 0, tn = 0;
  for (const key of keys) {
    const predicted = predicate(key);
    const actual = recordedSet.has(key);
    if (actual && predicted) tp += 1;
    else if (actual && !predicted) fn += 1;
    else if (!actual && predicted) fp += 1;
    else tn += 1;
  }
  return { tp, fp, fn, tn };
}

const isClean = (matrix) => matrix.tp === 14 && matrix.fp === 0 && matrix.fn === 0 && matrix.tn === 22;

function verdictOf(matrix) {
  if (isClean(matrix)) return "CLEAN_SPLIT";
  if (matrix.tp === 12 && matrix.fp === 0 && matrix.fn === 2 && matrix.tn === 22) return "NEAR_MISS_BOUNDARY";
  if (matrix.tp === 0 && matrix.fp === 22 && matrix.fn === 14 && matrix.tn === 0) return "ANTI_SEPARATING";
  return "NON_SEPARATING";
}

const selectionHash = (selectedKeys) => sha256(canonicalText(selectedKeys)).slice(0, 16);

function sortInstanceKey(left, right) {
  const [la, ls] = left.split(":").map(Number);
  const [ra, rs] = right.split(":").map(Number);
  return la - ra || ls - rs;
}

function mulberry32(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (state + 0x6D2B79F5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function binomialBigInt(n, k) {
  let result = 1n;
  for (let index = 0n; index < BigInt(k); index += 1n) {
    result = (result * (BigInt(n) - index)) / (index + 1n);
  }
  return result;
}

// ---------------------------------------------------------------------------
// Independent re-derivation
// ---------------------------------------------------------------------------

function reDerive(sources) {
  const { ledgerRows, network, mesh, bl068, bl070, bl071, bl055 } = sources;
  if (ledgerRows.length !== 462) fail(`ledger census ${ledgerRows.length}`);

  const rowById = new Map(ledgerRows.map((row) => [String(row.id), row]));
  const masks = new Map(ledgerRows.map((row) => [String(row.id), maskOfPitches(parsePitchSet(row.pitchSet))]));
  for (const row of ledgerRows) {
    if (masks.get(String(row.id)) !== Number(row.id)) fail(`ledger mask/id disagreement at ${row.id}`);
  }
  const officeByState = new Map(ledgerRows.map((row) => [String(row.id), row.office]));
  const officeIndexByState = new Map(ledgerRows.map((row) => [String(row.id), Number(row.officeIndex)]));
  const orientationByState = new Map(ledgerRows.map((row) => [String(row.id), row.orientation]));
  const chiralityByState = new Map(ledgerRows.map((row) => [String(row.id), row.chirality]));
  const forteByState = new Map(ledgerRows.map((row) => [String(row.id), row.forte]));

  const anchorRows = ledgerRows.filter((row) => row.tier === "D7" && row.role === "anchor").sort((a, b) => Number(a.id) - Number(b.id));
  const satelliteRows = ledgerRows.filter((row) => row.tier === "D6" && row.role === "satellite").sort((a, b) => Number(a.id) - Number(b.id));
  if (anchorRows.length !== 7 || satelliteRows.length !== 14) fail("D7/D6 partition census drift");
  const anchorIds = anchorRows.map((row) => String(row.id));
  const satelliteIds = satelliteRows.map((row) => String(row.id));

  const perAnchor = anchorRows.map((row) => {
    const anchor = String(row.id);
    const instances = satelliteRows
      .filter((satellite) => hamming12(masks.get(anchor), masks.get(String(satellite.id))) === 2)
      .map((satellite) => String(satellite.id))
      .sort((left, right) => cmp(Number(left), Number(right)));
    return { anchor, instances, count: instances.length };
  });
  const instanceKeys = perAnchor.flatMap((entry) => entry.instances.map((satellite) => `${entry.anchor}:${satellite}`)).sort(sortInstanceKey);
  if (instanceKeys.length !== 36) fail(`domain size ${instanceKeys.length}`);
  const distinctStates = sortedUnique(instanceKeys.map((key) => key.split(":")[1]));
  const parentCounts = new Map(satelliteIds.map((satellite) => [
    satellite,
    perAnchor.filter((entry) => entry.instances.includes(satellite)).length,
  ]));
  const multiplicityBuckets = {};
  for (const state of distinctStates) {
    const bucket = String(parentCounts.get(state));
    multiplicityBuckets[bucket] = (multiplicityBuckets[bucket] ?? 0) + 1;
  }
  if (canonicalText(multiplicityBuckets) !== canonicalText({ "1": 2, "2": 2, "3": 10 })) fail("multiplicity drift");
  if (canonicalText(perAnchor.map((entry) => entry.count)) !== canonicalText([4, 5, 6, 6, 6, 5, 4])) fail("per-anchor drift");

  const bl070Keys = bl070.domainDerivation.perAnchor
    .flatMap((entry) => entry.instances.map((satellite) => `${entry.anchor}:${satellite}`))
    .sort(sortInstanceKey);
  if (canonicalText(bl070Keys) !== canonicalText(instanceKeys)) fail("derived domain not set-equal to the landed BL-070 domain");

  const contactKeys = network.d7SeatContactRows.map((row) => `${String(row.target)}:${String(row.source)}`).sort(sortInstanceKey);
  if (contactKeys.length !== 14) fail("contact census drift");
  const actualSet = new Set(contactKeys);
  const officeEqualKeys = instanceKeys.filter((key) => officeByState.get(key.split(":")[0]) === officeByState.get(key.split(":")[1]));
  if (canonicalText(contactKeys) !== canonicalText(officeEqualKeys)) fail("recorded subset not set-equal to the seat-contact rows");
  const deltaCounts = {};
  for (const key of instanceKeys.filter((key) => !actualSet.has(key))) {
    const [anchor, satellite] = key.split(":");
    const delta = String(((officeIndexByState.get(satellite) - officeIndexByState.get(anchor)) + 7) % 7);
    deltaCounts[delta] = (deltaCounts[delta] ?? 0) + 1;
  }
  if (canonicalText(deltaCounts) !== canonicalText({ "2": 11, "5": 11 })) fail("delta structure drift");

  // instance facts (masks + mesh only)
  const subnodesByMask = new Map(Object.values(mesh.heptatonicNodes).map((node) => [String(node.pitchMask), node.subnodes]));
  const pentatonicById = mesh.pentatonicSubnodes;
  const signOfMask = (mask) => {
    const subnodes = subnodesByMask.get(String(mask));
    if (!subnodes) fail(`mesh node missing for mask ${mask}`);
    const shared = (family) => subnodes.filter((id) => (pentatonicById[id]?.parentsUnrooted ?? []).includes(family)).length;
    return NON_Z_D_FAMILIES.reduce((sum, family) => sum + shared(family), 0)
      - Z_D_FAMILIES.reduce((sum, family) => sum + shared(family), 0);
  };
  const familiesOfMask = (mask) => {
    const subnodes = subnodesByMask.get(String(mask));
    if (!subnodes) fail(`mesh node missing for mask ${mask}`);
    const families = new Set();
    for (const id of subnodes) for (const family of (pentatonicById[id]?.parentsUnrooted ?? [])) families.add(family);
    return families;
  };
  const factByKey = new Map();
  for (const key of instanceKeys) {
    const [anchor, satellite] = key.split(":");
    const anchorMask = masks.get(anchor);
    const satelliteMask = masks.get(satellite);
    const anchorPitches = parsePitchSet(rowById.get(anchor).pitchSet);
    const satellitePitches = parsePitchSet(rowById.get(satellite).pitchSet);
    const anchorSet = new Set(anchorPitches);
    const satelliteSet = new Set(satellitePitches);
    const removed = anchorPitches.filter((pitch) => !satelliteSet.has(pitch));
    const added = satellitePitches.filter((pitch) => !anchorSet.has(pitch));
    if (removed.length !== 1 || added.length !== 1) fail(`displacement drift at ${key}`);
    const raw = (added[0] - removed[0] + 12) % 12;
    const anchorSubnodes = subnodesByMask.get(String(anchorMask));
    const satelliteSubnodes = subnodesByMask.get(String(satelliteMask));
    factByKey.set(key, {
      key,
      anchor,
      satellite,
      dPcSum: Math.abs(pcSumOfMask(anchorMask) - pcSumOfMask(satelliteMask)),
      dMask: Math.abs(anchorMask - satelliteMask),
      displacementLinear: raw > 6 ? raw - 12 : raw,
      sign: signOfMask(satelliteMask),
      icEqual: canonicalText(icVectorOfMask(anchorMask)) === canonicalText(icVectorOfMask(satelliteMask)),
      rotationHits: rotationRelations(anchorMask, satelliteMask).length,
      hamming: hamming12(anchorMask, satelliteMask),
      overlapIdCount: anchorSubnodes.filter((id) => satelliteSubnodes.includes(id)).length,
      familyOverlapSeven: [...familiesOfMask(anchorMask)].filter((family) => D_TIER_FAMILIES.includes(family) && familiesOfMask(satelliteMask).has(family)).length,
      inversionImageOfAnchorEqualsSatellite: invertMask12(anchorMask) === satelliteMask,
      parentCount: parentCounts.get(satellite),
      multiplicity: parentCounts.get(satellite),
    });
  }

  // the canonical language (nine singles; OD-72-4)
  const predicateRules = [
    { id: "P1", candidate: "C-M1", expression: "[shared subnode count >= 6]", tier: "masks-only (masks + containment mesh)", predicate: (key) => factByKey.get(key).overlapIdCount >= 6 },
    { id: "P2", candidate: "C-M2", expression: "[at least one d in 1..11 with rotateMask12^d(anchor) = satellite]", tier: "masks-only (masks + containment mesh)", predicate: (key) => factByKey.get(key).rotationHits >= 1 },
    { id: "P3", candidate: "C-M3", expression: "[|pcSum(anchor) - pcSum(satellite)| = 1]", tier: "masks-only (masks + containment mesh)", predicate: (key) => factByKey.get(key).dPcSum === 1 },
    { id: "P4", candidate: "C-M4", expression: "[nonZ shared-family sum < Z shared-family sum]", tier: "masks-only (masks + containment mesh)", predicate: (key) => factByKey.get(key).sign < 0 },
    { id: "P5", candidate: "C-M5", expression: "[|single-pitch displacement| = 1]", tier: "masks-only (masks + containment mesh)", predicate: (key) => Math.abs(factByKey.get(key).displacementLinear) === 1 },
    { id: "P6", candidate: "C-M6", expression: "[IC(anchor) = IC(satellite)]", tier: "masks-only (masks + containment mesh)", predicate: (key) => factByKey.get(key).icEqual },
    { id: "P7", candidate: "C-M7", expression: "[satellite orientation = A]", tier: "canonical-read (labelled, comparison region)", predicate: (key) => orientationByState.get(key.split(":")[1]).endsWith(" A") },
    { id: "P8", candidate: "C-M8", expression: "[invertMask12(anchor) = satellite]", tier: "masks-only (masks + containment mesh)", predicate: (key) => factByKey.get(key).inversionImageOfAnchorEqualsSatellite },
    { id: "P9", candidate: "C-M9", expression: "[reach-singleton: parentCount(satellite) = 1]", tier: "masks-only (masks + containment mesh)", predicate: (key) => factByKey.get(key).parentCount === 1 },
  ];
  const language = predicateRules;

  // per-term
  const termARule = language.find((rule) => rule.id === "P3");
  const termBRule = language.find((rule) => rule.id === "P9");
  const termAConfusion = confusion(instanceKeys, actualSet, termARule.predicate);
  const termBConfusion = confusion(instanceKeys, actualSet, termBRule.predicate);
  const compositePredicate = (key) => termARule.predicate(key) || termBRule.predicate(key);
  const compositeConfusion = confusion(instanceKeys, actualSet, compositePredicate);
  if (!isClean(compositeConfusion)) fail("composite is not clean");
  const termASelected = instanceKeys.filter(termARule.predicate);
  const termBSelected = instanceKeys.filter(termBRule.predicate);
  const overlapKeys = termASelected.filter((key) => termBSelected.includes(key));
  const residualRecordedOutside = contactKeys.filter((key) => !compositePredicate(key));
  const residualSelectedNonRecorded = instanceKeys.filter((key) => compositePredicate(key) && !actualSet.has(key));
  const missedLanding = instanceKeys.filter((key) => actualSet.has(key) && factByKey.get(key).dPcSum !== 1);
  if (canonicalText(missedLanding) !== canonicalText(["127:253", "4033:2017"])) fail("near-miss misses drift");

  // property table
  const stateByMask = new Map(satelliteRows.map((row) => [masks.get(String(row.id)), String(row.id)]));
  const seen = new Set();
  const inversionPairs = [];
  for (const state of distinctStates) {
    if (seen.has(state)) continue;
    const partner = stateByMask.get(invertMask12(masks.get(state)));
    if (!partner) fail(`inversion image of ${state} missing`);
    seen.add(state);
    seen.add(partner);
    inversionPairs.push([state, partner].sort(cmp));
  }
  inversionPairs.sort((left, right) => cmp(left[0], right[0]) || cmp(left[1], right[1]));
  if (inversionPairs.length !== 7) fail("inversion pair census drift");
  const partnerOf = new Map();
  for (const [left, right] of inversionPairs) { partnerOf.set(left, right); partnerOf.set(right, left); }
  const propertyRows = instanceKeys.map((key) => {
    const [anchor, satellite] = key.split(":");
    const fact = factByKey.get(key);
    return {
      key,
      anchor,
      satellite,
      anchorMask: masks.get(anchor),
      satelliteMask: masks.get(satellite),
      pcSumAnchor: pcSumOfMask(masks.get(anchor)),
      pcSumSatellite: pcSumOfMask(masks.get(satellite)),
      dPcSum: fact.dPcSum,
      displacementLinear: fact.displacementLinear,
      hamming: fact.hamming,
      parentCount: fact.parentCount,
      multiplicity: fact.multiplicity,
      inversionPartner: partnerOf.get(satellite),
      satelliteClass: forteByState.get(satellite),
      satelliteChirality: chiralityByState.get(satellite),
      satelliteOrientation: orientationByState.get(satellite).endsWith(" A") ? "A" : "B",
      anchorOffice: officeByState.get(anchor),
      satelliteOffice: officeByState.get(satellite),
      officeDelta: ((officeIndexByState.get(satellite) - officeIndexByState.get(anchor)) + 7) % 7,
      sign: fact.sign,
      zMajority: fact.sign < 0,
      overlapIdCount: fact.overlapIdCount,
      rotationHits: fact.rotationHits,
      icEqual: fact.icEqual,
      inversionImageOfAnchorEqualsSatellite: fact.inversionImageOfAnchorEqualsSatellite,
      recorded: actualSet.has(key),
      termA: termARule.predicate(key),
      termB: termBRule.predicate(key),
      composite: compositePredicate(key),
      compositeTerm: termARule.predicate(key) ? "A" : termBRule.predicate(key) ? "B" : null,
    };
  });

  // whole-pair respect
  const closedUnder = (selectedKeys) => {
    const states = new Set(selectedKeys.map((key) => key.split(":")[1]));
    return [...states].every((state) => states.has(partnerOf.get(state)));
  };
  const wholePairRespect = {
    termA: closedUnder(termASelected),
    termB: closedUnder(termBSelected),
    joint: closedUnder(instanceKeys.filter(compositePredicate)),
    mechanicallyVerified: true,
  };

  // permutation baseline (fixed margins; deterministic)
  const selectionSet = new Set(instanceKeys.filter(compositePredicate));
  const labels = instanceKeys.map((key) => actualSet.has(key));
  const rng = mulberry32(PERMUTATION_SEED);
  const selectionFlags = instanceKeys.map((key) => selectionSet.has(key));
  const tpHistogram = {};
  for (let value = 0; value <= 14; value += 1) tpHistogram[String(value)] = 0;
  const tpValues = [];
  let cleanSplitCount = 0;
  for (let iteration = 0; iteration < PERMUTATION_N; iteration += 1) {
    const shuffled = labels.slice();
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(rng() * (index + 1));
      const held = shuffled[index];
      shuffled[index] = shuffled[swap];
      shuffled[swap] = held;
    }
    let tp = 0;
    for (let index = 0; index < shuffled.length; index += 1) {
      if (selectionFlags[index] && shuffled[index]) tp += 1;
    }
    tpHistogram[String(tp)] += 1;
    tpValues.push(tp);
    if (tp === 14) cleanSplitCount += 1;
  }
  tpValues.sort((left, right) => left - right);
  const permutationResults = {
    cleanSplitCount,
    cleanSplitRate: `${cleanSplitCount}/${PERMUTATION_N}`,
    tpHistogram,
    tpSum: tpValues.reduce((sum, value) => sum + value, 0),
    maxTP: tpValues[PERMUTATION_N - 1],
    central95: {
      lower: tpValues[Math.floor(0.025 * PERMUTATION_N)],
      upper: tpValues[Math.min(PERMUTATION_N - 1, Math.ceil(0.975 * PERMUTATION_N) - 1)],
    },
    expectedMeanFraction: "49/9",
  };
  const exactDenominator = binomialBigInt(36, 14).toString();
  const hArtifactSupported = cleanSplitCount > 0
    || (14 >= permutationResults.central95.lower && 14 <= permutationResults.central95.upper);
  const hArtifactVerdict = hArtifactSupported ? "SUPPORTED" : "REFUTED";

  // geometric mapping
  const successor = new Map(network.d7ModalRows.map((row) => [String(row.source), String(row.target)]));
  const orbitOrder = [];
  let cursor = "127";
  for (let step = 0; step < 7; step += 1) {
    orbitOrder.push(cursor);
    const next = successor.get(cursor);
    if (!next) fail(`orbit dead-end at ${cursor}`);
    cursor = next;
  }
  if (cursor !== "127") fail("orbit does not close");
  const orbitIndex = new Map(orbitOrder.map((anchor, index) => [anchor, index]));
  const orbitEdges = orbitOrder.map((anchor, index) => ({
    a: anchor,
    b: orbitOrder[(index + 1) % 7],
    rotateInterval: rotationRelations(masks.get(anchor), masks.get(orbitOrder[(index + 1) % 7]))[0] ?? null,
  }));
  if (orbitEdges.some((edge) => edge.rotateInterval === null)) fail("orbit edge not an exact rotation");
  const orbitRotationHistogram = orbitEdges.reduce((accumulator, edge) => {
    accumulator[String(edge.rotateInterval)] = (accumulator[String(edge.rotateInterval)] ?? 0) + 1;
    return accumulator;
  }, {});
  const windows = distinctStates.map((state) => {
    const parentEntries = perAnchor.filter((entry) => entry.instances.includes(state));
    const indices = parentEntries.map((entry) => orbitIndex.get(entry.anchor)).sort((left, right) => left - right);
    const start = indices[0];
    const end = indices[indices.length - 1];
    return {
      state,
      parents: parentEntries.map((entry) => entry.anchor),
      indices,
      start,
      end,
      size: indices.length,
      consecutive: end - start + 1 === indices.length,
      terminal: indices.length === 1,
    };
  }).sort((left, right) => left.start - right.start || left.size - right.size || cmp(left.state, right.state));
  const allConsecutive = windows.every((window) => window.consecutive);
  const terminalWindows = windows.filter((window) => window.terminal).map((window) => window.state);
  const sizeTwoWindows = windows.filter((window) => window.size === 2).map((window) => window.state);
  const windowSizeHistogram = windows.reduce((accumulator, window) => {
    accumulator[String(window.size)] = (accumulator[String(window.size)] ?? 0) + 1;
    return accumulator;
  }, {});
  if (canonicalText(windowSizeHistogram) !== canonicalText({ "1": 2, "2": 2, "3": 10 })) fail("window size histogram drift");
  const windowStartCensus = [];
  for (let start = 0; start < 7; start += 1) {
    const entries = windows.filter((window) => window.start === start);
    windowStartCensus.push({ start, states: entries.map((window) => window.state), sizes: entries.map((window) => window.size) });
  }
  const singletonKeys = windows
    .filter((window) => window.terminal)
    .flatMap((window) => window.parents.map((anchor) => `${anchor}:${window.state}`))
    .sort(sortInstanceKey);
  const termBLocalized = canonicalText(singletonKeys) === canonicalText(termBSelected.slice().sort(sortInstanceKey));
  const singletonDisplacement = singletonKeys.map((key) => factByKey.get(key).displacementLinear);
  if (canonicalText(singletonDisplacement) !== canonicalText([6, 6])) fail("singleton displacement drift");
  const perAnchorOverlapCounts = orbitOrder.map((anchor, index) => windows.filter((window) => window.indices.includes(index)).length);
  const perAnchorCountsMatch = canonicalText(perAnchorOverlapCounts) === canonicalText(perAnchor.map((entry) => entry.count));
  if (!allConsecutive || !termBLocalized || !perAnchorCountsMatch) fail("geometric structural checks drift");
  const inversionMirror = windows.map((window) => {
    const partner = partnerOf.get(window.state);
    const partnerWindow = windows.find((entry) => entry.state === partner);
    return {
      state: window.state,
      partner,
      window: [window.start, window.end],
      partnerWindow: [partnerWindow.start, partnerWindow.end],
      mirrored: partnerWindow.start === 6 - window.end && partnerWindow.end === 6 - window.start,
    };
  });
  const allMirrored = inversionMirror.every((entry) => entry.mirrored);
  if (!allMirrored) fail("window inversion-mirroring drift");
  const anchorInversionPairs = anchorRows.map((row) => {
    const anchor = String(row.id);
    const partner = anchorRows.find((other) => masks.get(String(other.id)) === invertMask12(masks.get(anchor)));
    if (!partner) fail(`anchor inversion image of ${anchor} missing`);
    return {
      a: anchor,
      b: String(partner.id),
      indices: [orbitIndex.get(anchor), orbitIndex.get(String(partner.id))],
      indexSum: orbitIndex.get(anchor) + orbitIndex.get(String(partner.id)),
    };
  }).filter((entry) => Number(entry.a) <= Number(entry.b));
  if (anchorInversionPairs.some((entry) => entry.indexSum !== 6)) fail("anchor inversion pairing drift");
  const orbitOfficeSequence = orbitOrder.map((anchor) => Number(officeIndexByState.get(anchor)));
  const officeSteps = orbitOfficeSequence.map((value, index) => (value - orbitOfficeSequence[(index + 6) % 7] + 7) % 7);
  if (officeSteps.some((step) => step !== 2)) fail("orbit office step drift");
  const geometric = {
    orbitOrder,
    orbitEdges,
    orbitRotationHistogram,
    closureEdge: orbitEdges[6],
    orbitOfficeSequence,
    officeSteps,
    windows,
    windowStartCensus,
    windowSizeHistogram,
    allConsecutive,
    terminalWindows,
    sizeTwoWindows,
    singletonKeys,
    singletonDisplacement,
    termBLocalized,
    perAnchorOverlapCounts,
    perAnchorCountsMatch,
    inversionSymmetry: {
      allMirrored,
      pairs: inversionMirror,
      anchorPairs: anchorInversionPairs,
      singletonPair: terminalWindows.slice().sort(cmp),
    },
    closureAlignment: {
      closureInterval: orbitEdges[6].rotateInterval,
      singletonDisplacement,
    },
    structuralChecks: {
      consecutiveWindows: allConsecutive,
      terminalLocalization: termBLocalized,
      perAnchorFromWindows: perAnchorCountsMatch,
      nonVacuous: windowSizeHistogram["1"] === 2 && windowSizeHistogram["3"] === 10,
    },
  };

  // cross-domain (fa-pole descriptive read)
  const table28 = bl055.table28;
  if (table28.length !== 28) fail("BL-055 table28 census drift");
  const faFacts = table28.map((row) => {
    const parent = rowById.get(String(row.parentH));
    const satellite = rowById.get(String(row.satellite));
    if (!parent || !satellite) fail(`BL-055 key ${row.key}: ledger record missing`);
    const delta = pcSumOfMask(masks.get(String(row.satellite))) - pcSumOfMask(masks.get(String(row.parentH)));
    return {
      key: String(row.key),
      parentH: String(row.parentH),
      satellite: String(row.satellite),
      forte: row.forte,
      observed: row.observed === true,
      delta,
      absDelta: Math.abs(delta),
    };
  });
  const faRecorded = new Set(faFacts.filter((fact) => fact.observed).map((fact) => fact.key));
  if (faRecorded.size !== 14) fail("BL-055 observed census drift");
  const faKeys = faFacts.map((fact) => fact.key);
  const faTermAConfusion = confusion(faKeys, faRecorded, (key) => Math.abs(faFacts.find((fact) => fact.key === key).absDelta) === 1);
  const faDeltaHistogram = faFacts.reduce((accumulator, fact) => {
    accumulator[String(fact.absDelta)] = (accumulator[String(fact.absDelta)] ?? 0) + 1;
    return accumulator;
  }, {});
  const faSelectedClassComposition = faFacts
    .filter((fact) => fact.absDelta === 1)
    .reduce((accumulator, fact) => {
      accumulator[fact.forte] = (accumulator[fact.forte] ?? 0) + 1;
      return accumulator;
    }, {});
  const faMissedObserved = faFacts.filter((fact) => fact.observed && fact.absDelta !== 1).map((fact) => fact.key).sort(cmp);
  const faFalsePositives = faFacts.filter((fact) => !fact.observed && fact.absDelta === 1).map((fact) => fact.key).sort(cmp);
  const faClean = faTermAConfusion.fp === 0 && faTermAConfusion.fn === 0;
  const hInformationalVerdict = !faClean && (faTermAConfusion.fp + faTermAConfusion.fn) > 4
    ? "SUPPORTED"
    : faClean ? "REFUTED" : "INDETERMINATE";

  // minimality enumeration
  const evaluate = (rule) => {
    const selected = instanceKeys.filter(rule.predicate);
    const matrix = confusion(instanceKeys, actualSet, rule.predicate);
    return {
      id: rule.id,
      candidate: rule.candidate,
      expression: rule.expression,
      tier: rule.tier,
      selectionSize: selected.length,
      confusion: matrix,
      verdict: verdictOf(matrix),
      clean: isClean(matrix),
      selectionHash: selectionHash(selected),
      selectedKeys: selected,
    };
  };
  const singles = language.map(evaluate);
  const pairs = [];
  for (let leftIndex = 0; leftIndex < language.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < language.length; rightIndex += 1) {
      const left = language[leftIndex];
      const right = language[rightIndex];
      const unionPredicate = (key) => left.predicate(key) || right.predicate(key);
      const selected = instanceKeys.filter(unionPredicate);
      const matrix = confusion(instanceKeys, actualSet, unionPredicate);
      pairs.push({
        pairId: `${left.id}+${right.id}`,
        left: left.id,
        right: right.id,
        expression: `[${left.expression}] or [${right.expression}]`,
        selectionSize: selected.length,
        confusion: matrix,
        verdict: verdictOf(matrix),
        clean: isClean(matrix),
        selectionHash: selectionHash(selected),
        selectedKeys: selected,
      });
    }
  }
  if (pairs.length !== 36) fail("pair enumeration census drift");
  const byHash = new Map();
  for (const single of singles) {
    if (!byHash.has(single.selectionHash)) byHash.set(single.selectionHash, []);
    byHash.get(single.selectionHash).push(single.id);
  }
  const degeneracyClasses = [...byHash.entries()].map(([hash, ids]) => ({
    selectionHash: hash,
    selectionSize: singles.find((single) => single.selectionHash === hash).selectionSize,
    ids,
  })).sort((left, right) => cmp(left.ids[0], right.ids[0]));
  const classRepresentative = new Map();
  for (const group of degeneracyClasses) {
    for (const id of group.ids) classRepresentative.set(id, group.ids[0]);
  }
  const cleanSingles = singles.filter((single) => single.clean).map((single) => single.id);
  const cleanPairs = pairs.filter((pair) => pair.clean);
  const minimalCleanCardinality = cleanSingles.length > 0 ? 1 : cleanPairs.length > 0 ? 2 : null;
  const compositeInMinimalSet = cleanPairs.some((pair) => pair.pairId === "P3+P9");
  const uniqueMinimalClasses = new Set(cleanPairs.map((pair) => [pair.left, pair.right]
    .map((id) => classRepresentative.get(id))
    .sort(cmp)
    .join("+"))).size;
  const hPrimitiveSupported = cleanSingles.length === 0 && minimalCleanCardinality === 2;

  const anchorMinMask = new Map(perAnchor.map((entry) => [
    entry.anchor,
    Math.min(...entry.instances.map((satellite) => factByKey.get(`${entry.anchor}:${satellite}`).dMask)),
  ]));
  const appendixVariants = [
    { id: "C-M1.r2", candidate: "C-M1", expression: "[D-tier family presence overlap >= 7]", predicate: (key) => factByKey.get(key).familyOverlapSeven >= 7 },
    { id: "C-M2.r2", candidate: "C-M2", expression: "[hamming12(anchor, satellite) = 8]", predicate: (key) => factByKey.get(key).hamming === 8 },
    { id: "C-M3.r2", candidate: "C-M3", expression: "[|mask(anchor) - mask(satellite)| minimal within the anchor]", predicate: (key) => factByKey.get(key).dMask === anchorMinMask.get(factByKey.get(key).anchor) },
    { id: "C-M3.r3", candidate: "C-M3", expression: "[|mask(anchor) - mask(satellite)| <= 64]", predicate: (key) => factByKey.get(key).dMask <= 64 },
    { id: "C-M5.r2", candidate: "C-M5", expression: "[|single-pitch displacement| = 6]", predicate: (key) => Math.abs(factByKey.get(key).displacementLinear) === 6 },
    { id: "C-M8.r2", candidate: "C-M8", expression: "[invertMask12(satellite) lies in some anchor's reach]", predicate: (key) => anchorRows.some((row) => hamming12(masks.get(String(row.id)), invertMask12(masks.get(factByKey.get(key).satellite))) === 2) },
    { id: "C-M9.r2", candidate: "C-M9", expression: "[parentCount(satellite) = 2]", predicate: (key) => factByKey.get(key).parentCount === 2 },
    { id: "C-M9.r3", candidate: "C-M9", expression: "[parentCount(satellite) = 3]", predicate: (key) => factByKey.get(key).parentCount === 3 },
  ].map((variant) => {
    const matrix = confusion(instanceKeys, actualSet, variant.predicate);
    return { id: variant.id, candidate: variant.candidate, expression: variant.expression, confusion: matrix, verdict: verdictOf(matrix) };
  });

  const geometricVerdict = allConsecutive && termBLocalized && perAnchorCountsMatch ? "SUPPORTED" : "REFUTED";

  return {
    sources,
    anchorIds, satelliteIds, perAnchor, instanceKeys, distinctStates, parentCounts,
    multiplicityBuckets, actualSet, deltaCounts, factByKey, language,
    termAConfusion, termBConfusion, compositeConfusion, termASelected, termBSelected,
    overlapKeys, residualRecordedOutside, residualSelectedNonRecorded, missedLanding,
    wholePairRespect, propertyRows, inversionPairs,
    permutationResults, exactDenominator, hArtifactVerdict,
    geometric, geometricVerdict,
    faTermAConfusion, faDeltaHistogram, faSelectedClassComposition, faMissedObserved,
    faFalsePositives, hInformationalVerdict,
    singles, pairs, degeneracyClasses, cleanSingles,
    cleanPairs: cleanPairs.map((pair) => pair.pairId),
    minimalCleanCardinality, compositeInMinimalSet,
    uniqueMinimalUpToDegeneracy: uniqueMinimalClasses === 1,
    appendixVariants, hPrimitiveSupported,
  };
}

// ---------------------------------------------------------------------------
// Artifact checks
// ---------------------------------------------------------------------------

function checkAgainstSources(artifact, derived) {
  if (artifact.schemaVersion !== SCHEMA_VERSION || artifact.investigationId !== INVESTIGATION_ID) fail("artifact header drift");
  if (artifact.status !== "planning_evidence") fail("status drift");
  if (artifact.generator !== "scripts/build-bl072-composite-mechanism.mjs") fail("generator path drift");

  const bindingPaths = artifact.sourceBindings.map((binding) => binding.artifact);
  if (canonicalText(sortedUnique(bindingPaths)) !== canonicalText(sortedUnique([
    LEDGER_PATH, NETWORK_PATH, MESH_PATH, BL068_PATH, BL070_PATH, BL071_PATH, BL055_PATH,
  ]))) fail("source binding set drift");
  for (const binding of artifact.sourceBindings) {
    if (binding.sha256 !== fileSha(binding.artifact)) fail(`source binding sha drift: ${binding.artifact}`);
  }

  if (artifact.base.bl068.derivationFingerprint !== BL068_FINGERPRINT) fail("BL-068 pin drift");
  if (artifact.base.bl070.derivationFingerprint !== BL070_FINGERPRINT) fail("BL-070 pin drift");
  if (artifact.base.bl071.investigationFingerprint !== BL071_FINGERPRINT) fail("BL-071 pin drift");
  if (artifact.base.bl055.reviewFingerprint !== BL055_FINGERPRINT) fail("BL-055 pin drift");
  const { derivationFingerprint: bl068Fingerprint, ...bl068Core } = derived.sources.bl068;
  if (sha256(canonicalText(bl068Core)) !== bl068Fingerprint || bl068Fingerprint !== BL068_FINGERPRINT) fail("BL-068 chain drift");
  const { derivationFingerprint: bl070Fingerprint, ...bl070Core } = derived.sources.bl070;
  if (sha256(canonicalText(bl070Core)) !== bl070Fingerprint || bl070Fingerprint !== BL070_FINGERPRINT) fail("BL-070 chain drift");
  const { investigationFingerprint: bl071Fingerprint, ...bl071Core } = derived.sources.bl071;
  if (sha256(canonicalText(bl071Core)) !== bl071Fingerprint || bl071Fingerprint !== BL071_FINGERPRINT) fail("BL-071 chain drift");
  const { reviewFingerprint: bl055Fingerprint, ...bl055Core } = derived.sources.bl055;
  if (sha256(canonicalText(bl055Core)) !== bl055Fingerprint || bl055Fingerprint !== BL055_FINGERPRINT) fail("BL-055 chain drift");

  const rulings = artifact.preRegistration.rulings.map((ruling) => ruling.id);
  if (canonicalText(rulings) !== canonicalText(["OD-72-1", "OD-72-2", "OD-72-3", "OD-72-4", "OD-72-5", "OD-72-6"])) {
    fail("ruling inventory drift");
  }
  const method = artifact.preRegistration.permutationMethod;
  if (method.iterations !== PERMUTATION_N || method.seed !== PERMUTATION_SEED || method.prng !== "mulberry32") {
    fail("pre-registered permutation method drift");
  }
  if (method.disclosure !== DISCLOSURE) fail("pre-registered disclosure drift");

  const grounding = artifact.grounding;
  if (grounding.domain.size !== 36) fail("grounding domain size drift");
  if (canonicalText(grounding.domain.perAnchor) !== canonicalText([4, 5, 6, 6, 6, 5, 4])) fail("grounding per-anchor drift");
  if (grounding.domain.setEqualBl070 !== true || grounding.domain.bl070DerivationFingerprint !== BL070_FINGERPRINT) fail("grounding domain set-equality drift");
  if (grounding.contacts.recorded !== 14 || grounding.contacts.unrecorded !== 22) fail("grounding contact totals drift");
  if (canonicalText(grounding.contacts.deltaCounts) !== canonicalText({ "2": 11, "5": 11 })) fail("grounding delta drift");
  if (!isClean(grounding.composite.confusion) || grounding.composite.landedMatch !== true) fail("grounding composite drift");
  if (canonicalText(grounding.nearMiss.confusion) !== canonicalText({ tp: 12, fp: 0, fn: 2, tn: 22 })) fail("grounding near-miss drift");
  if (canonicalText(grounding.nearMiss.missedKeys) !== canonicalText(["127:253", "4033:2017"])) fail("grounding missed keys drift");
  if (grounding.battery.landedCleanSplitCount !== 0 || grounding.battery.analysisCleanSplitCount !== 0) fail("grounding battery drift");
  if (canonicalText(grounding.chainAnchors) !== canonicalText({
    bl068: BL068_FINGERPRINT, bl070: BL070_FINGERPRINT, bl071: BL071_FINGERPRINT, bl055: BL055_FINGERPRINT,
  })) fail("grounding chain-anchor table drift");

  if (canonicalText(artifact.propertyTable.rows) !== canonicalText(derived.propertyRows)) fail("property table drift");
  if (artifact.propertyTable.columns.length !== 30) fail("property table column census drift");

  const perTerm = artifact.perTerm;
  if (canonicalText(perTerm.joint.confusion) !== canonicalText(derived.compositeConfusion)) fail("joint confusion drift");
  if (!perTerm.joint.expression.includes("reach-singleton")) fail("joint expression drift");
  if (canonicalText(perTerm.termA.confusion) !== canonicalText(derived.termAConfusion)) fail("Term-A confusion drift");
  if (canonicalText(perTerm.termA.selectedKeys) !== canonicalText(derived.termASelected)) fail("Term-A selected set drift");
  if (canonicalText(perTerm.termA.misses) !== canonicalText(derived.missedLanding)) fail("Term-A misses drift");
  if (canonicalText(perTerm.termB.confusion) !== canonicalText(derived.termBConfusion)) fail("Term-B confusion drift");
  if (canonicalText(perTerm.termB.selectedKeys) !== canonicalText(derived.termBSelected)) fail("Term-B selected set drift");
  if (canonicalText(perTerm.overlap.keys) !== canonicalText(derived.overlapKeys)) fail("overlap keys drift");
  if (perTerm.overlap.disjoint !== true || perTerm.overlap.count !== 0) fail("disjointness flag drift");
  if (canonicalText(perTerm.residual.recordedOutsideUnion) !== canonicalText(derived.residualRecordedOutside)) fail("residual recorded drift");
  if (canonicalText(perTerm.residual.selectedNonRecorded) !== canonicalText(derived.residualSelectedNonRecorded)) fail("residual selected drift");
  if (perTerm.residual.exact !== true) fail("residual exact flag drift");
  if (canonicalText(perTerm.wholePairRespect) !== canonicalText(derived.wholePairRespect)) fail("whole-pair respect drift");
  if (!perTerm.anatomy.includes("12 + 2 = 14")) fail("anatomy statement drift");

  const permutation = artifact.permutation;
  if (permutation.method.iterations !== PERMUTATION_N || permutation.method.seed !== PERMUTATION_SEED) fail("permutation method drift");
  if (permutation.method.prng !== "mulberry32" || !permutation.method.shuffle.includes("Fisher-Yates")) fail("permutation mechanics drift");
  if (canonicalText(permutation.results) !== canonicalText(derived.permutationResults)) fail("permutation results drift");
  if (permutation.exact.cleanMatchDenominator !== derived.exactDenominator || permutation.exact.cleanMatchNumerator !== 1) fail("exact-match probability drift");
  if (permutation.disclosure !== DISCLOSURE) fail("disclosure verbatim drift");
  if (permutation.verdict !== derived.hArtifactVerdict) fail("H-Artifact verdict drift");
  if (!permutation.decisionRule.includes("central 95%")) fail("permutation decision rule drift");

  const geometric = artifact.geometricMapping;
  for (const field of ["orbitOrder", "orbitEdges", "orbitRotationHistogram", "closureEdge", "orbitOfficeSequence",
    "officeSteps", "windows", "windowStartCensus", "windowSizeHistogram", "allConsecutive", "terminalWindows",
    "sizeTwoWindows", "singletonKeys", "singletonDisplacement", "termBLocalized", "perAnchorOverlapCounts",
    "perAnchorCountsMatch", "structuralChecks"]) {
    if (canonicalText(geometric[field]) !== canonicalText(derived.geometric[field])) fail(`geometric field drift: ${field}`);
  }
  if (canonicalText(geometric.inversionSymmetry) !== canonicalText(derived.geometric.inversionSymmetry)) fail("inversion symmetry drift");
  if (geometric.closureAlignment.closureInterval !== derived.geometric.closureAlignment.closureInterval) fail("closure interval drift");
  if (canonicalText(geometric.closureAlignment.singletonDisplacement) !== canonicalText(derived.geometric.closureAlignment.singletonDisplacement)) fail("singleton displacement drift");
  if (!geometric.closureAlignment.note.includes("inversion poles")) fail("closure alignment note drift");
  if (!geometric.a0Context.includes("No A0 measurement occurs here")) fail("A0 context scope drift");
  if (geometric.findings.length !== 6) fail("geometric findings census drift");
  if (!geometric.findings.some((finding) => finding.includes("orbit-window ladder"))) fail("ladder finding drift");
  if (!geometric.interpretation.includes("NOT ESTABLISHED")) fail("geometric production note drift");

  const crossDomain = artifact.crossDomain;
  if (crossDomain.source.artifact !== BL055_PATH || crossDomain.source.reviewFingerprint !== BL055_FINGERPRINT) fail("cross-domain source drift");
  if (crossDomain.source.table28Count !== 28 || crossDomain.source.observedCount !== 14) fail("cross-domain census drift");
  if (canonicalText(crossDomain.termA.confusion) !== canonicalText(derived.faTermAConfusion)) fail("cross-domain Term-A confusion drift");
  if (canonicalText(crossDomain.termA.deltaHistogram) !== canonicalText(derived.faDeltaHistogram)) fail("cross-domain delta histogram drift");
  if (canonicalText(crossDomain.termA.classComposition) !== canonicalText(derived.faSelectedClassComposition)) fail("cross-domain class composition drift");
  if (canonicalText(crossDomain.termA.missedObserved) !== canonicalText(derived.faMissedObserved)) fail("cross-domain missed observed drift");
  if (crossDomain.termA.falsePositiveCount !== derived.faFalsePositives.length) fail("cross-domain false-positive count drift");
  if (crossDomain.termB.applicability !== "NOT_APPLICABLE") fail("Term-B applicability drift");
  if (!crossDomain.termB.reason.includes("never constructed") && !crossDomain.termB.reason.includes("no counterpart is constructed")) fail("Term-B reason drift");
  if (canonicalText(crossDomain.compositeOnFa.confusion) !== canonicalText(derived.faTermAConfusion)) fail("cross-domain composite confusion drift");
  if (crossDomain.verdict !== derived.hInformationalVerdict) fail("H-Informational verdict drift");
  if (!crossDomain.attribution.includes("INDETERMINATE")) fail("cross-domain attribution note drift");

  const minimality = artifact.minimality;
  if (canonicalText(minimality.language.canonicalOrder) !== canonicalText(["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8", "P9"])) {
    fail("language order drift");
  }
  if (minimality.language.pairCount !== 36 || minimality.language.singles.length !== 9) fail("language census drift");
  for (const single of minimality.singles) {
    const expected = derived.singles.find((entry) => entry.id === single.id);
    if (!expected) fail(`single missing: ${single.id}`);
    if (canonicalText(single) !== canonicalText(expected)) fail(`single row drift: ${single.id}`);
  }
  if (canonicalText(minimality.pairs) !== canonicalText(derived.pairs)) fail("pair table drift");
  if (canonicalText(minimality.degeneracyClasses) !== canonicalText(derived.degeneracyClasses)) fail("degeneracy class drift");
  if (canonicalText(minimality.summary.cleanSingles) !== canonicalText(derived.cleanSingles)) fail("clean singles drift");
  if (canonicalText(minimality.summary.cleanPairs) !== canonicalText(derived.cleanPairs)) fail("clean pairs drift");
  if (minimality.summary.minimalCleanCardinality !== derived.minimalCleanCardinality) fail("minimal cardinality drift");
  if (minimality.summary.compositeInMinimalSet !== derived.compositeInMinimalSet || derived.compositeInMinimalSet !== true) fail("composite-in-minimal-set drift");
  if (minimality.summary.uniqueMinimalUpToDegeneracy !== derived.uniqueMinimalUpToDegeneracy) fail("uniqueness drift");
  if (minimality.appendixVariants.length !== derived.appendixVariants.length) fail("appendix variant census drift");
  for (const variant of minimality.appendixVariants) {
    const expected = derived.appendixVariants.find((entry) => entry.id === variant.id);
    if (!expected) fail(`appendix variant missing: ${variant.id}`);
    if (variant.candidate !== expected.candidate || variant.expression !== expected.expression) fail(`appendix variant definition drift: ${variant.id}`);
    if (canonicalText(variant.confusion) !== canonicalText(expected.confusion) || variant.verdict !== expected.verdict) {
      fail(`appendix variant result drift: ${variant.id}`);
    }
    if (!variant.note.includes("excluded")) fail(`appendix variant note drift: ${variant.id}`);
  }
  if (minimality.verdict !== (derived.hPrimitiveSupported ? "SUPPORTED" : "REFUTED")) fail("H-Primitive verdict drift");
  if (!minimality.scope.includes("language-relative")) fail("minimality scope drift");

  const verdictSet = artifact.verdictSet;
  if (verdictSet.nonExclusive !== true) fail("non-exclusivity flag drift");
  if (verdictSet["H-Geometric"].verdict !== derived.geometricVerdict) fail("H-Geometric verdict drift");
  if (verdictSet["H-Informational"].verdict !== derived.hInformationalVerdict) fail("H-Informational verdict drift");
  if (verdictSet["H-Artifact"].verdict !== derived.hArtifactVerdict) fail("H-Artifact verdict drift");
  if (verdictSet["H-Primitive"].verdict !== (derived.hPrimitiveSupported ? "SUPPORTED" : "REFUTED")) fail("H-Primitive verdict drift");
  if (verdictSet["H-Artifact"].disclosure !== DISCLOSURE) fail("H-Artifact disclosure verbatim drift");
  if (!verdictSet["H-Geometric"].production.includes("NOT ESTABLISHED")) fail("H-Geometric production note drift");
  if (!verdictSet["H-Informational"].attribution.includes("INDETERMINATE")) fail("H-Informational attribution drift");
  if (!verdictSet["H-Primitive"].scope.includes("language-relative")) fail("H-Primitive scope drift");

  const gsl = artifact.gslTreatment;
  if (!gsl.rule.includes("OD-72-6")) fail("GSL rule drift");
  if (!gsl.distinction.includes("language-relative")) fail("GSL distinction drift");
  if (gsl.gsl4Refinement.status !== "inline, unapplied (no status change, no new GSL number)") fail("GSL-4 refinement status drift");
  if (!gsl.gsl4Refinement.text.includes("terminal face")) fail("GSL-4 refinement text drift");
  if (gsl.newEntryDraft.id !== "GSL-7" || gsl.newEntryDraft.status !== "candidate draft, un-promoted") fail("GSL-7 draft status drift");
  if (!gsl.newEntryDraft.registration.includes("none performed")) fail("GSL-7 registration drift");

  if (artifact.accounting.masksOnly.length < 4 || artifact.accounting.canonicalComputation.length < 4 ||
      artifact.accounting.remainingGranted.length < 3) fail("accounting tier inventory drift");
  if (!artifact.accounting.statement.includes("no new measurement")) fail("accounting statement drift");

  if (!artifact.fences.d7HypothesisTier.includes("2703-2712")) fail("D7 fence drift");
  if (artifact.fences.permutationDisclosure !== DISCLOSURE) fail("fence disclosure drift");
  if (!artifact.fences.compositeStatusUnchanged.includes("UNPROMOTED_DISCOVERY")) fail("composite-status fence drift");
  if (!artifact.fences.noNewMeasurement.includes("halt")) fail("no-new-measurement fence drift");
  if (!artifact.fences.crossDomainRule.includes("OD-72-1")) fail("cross-domain fence drift");
  if (!artifact.fences.languageClosure.includes("post-run expansion forbidden")) fail("language fence drift");
  if (artifact.notAccomplished.length !== 7) fail("notAccomplished inventory drift");
  if (!artifact.notAccomplished.some((item) => item.includes("no new measurement"))) fail("no-new-measurement item drift");
  if (!artifact.notAccomplished.some((item) => item.includes("no C-TB-1 promotion"))) fail("no-promotion item drift");
  if (artifact.contractCitations.length < 10) fail("contract citation inventory drift");
}

// ---------------------------------------------------------------------------
// Static generator checks (two-region)
// ---------------------------------------------------------------------------

function staticIntrinsicCheck(sourceText) {
  const begin = sourceText.indexOf("INTRINSIC-MECHANISM-BEGIN");
  const end = sourceText.indexOf("INTRINSIC-MECHANISM-END");
  if (begin < 0 || end < 0 || end <= begin) fail("generator intrinsic-region markers missing");
  const before = sourceText.slice(0, begin);
  const region = sourceText.slice(begin, end);
  const comparison = sourceText.slice(end);
  const forbidden = [
    /projection\.R\b/, /projection\.E\b/, /generation\.projection/,
    /officeIndex/, /parentOffice/, /\.office\b/, /relationalOffice/,
    /\bforte\b/, /intervalVector/, /setClass/, /\bobserved\b/, /coverage/,
    /d7AnchorRows/, /d7SeatContactRows/, /d7ModalRows/,
  ];
  for (const pattern of forbidden) {
    if (pattern.test(region)) fail(`generator intrinsic region reads a forbidden input: ${pattern}`);
    if (pattern.test(before)) fail(`forbidden token before the intrinsic region: ${pattern}`);
  }
  // region-only patterns: constant declarations before the marker are allowed
  const forbiddenRegion = [
    /orientationByState/, /chiralityByState/, /\btable28\b/, /BL055_PATH/, /d4-selection-review/,
  ];
  for (const pattern of forbiddenRegion) {
    if (pattern.test(region)) fail(`generator intrinsic region reads a forbidden input: ${pattern}`);
  }
  // region-scoping proof: the comparison region must carry the labelled reads,
  // so a file-scoped scan (over-banning the whole file) is rejected.
  if (!/officeIndexByState/.test(comparison)) fail("region-scoping proof failed: the comparison region does not read the office index");
  if (!/d7SeatContactRows/.test(comparison)) fail("region-scoping proof failed: the comparison region does not read the network records");
  if (!/orientationByState/.test(comparison)) fail("region-scoping proof failed: the comparison region does not read the orientation label");
  const required = ["ledgerRows", "pitchSet", "hamming12", "rotateMask12", "maskOfRow", "deriveDomain", "deriveInstanceFacts", "buildCanonicalPredicates"];
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
    bl068: readJson(BL068_PATH),
    bl070: readJson(BL070_PATH),
    bl071: readJson(BL071_PATH),
    bl055: readJson(BL055_PATH),
  };

  const derived = reDerive(sources);
  checkAgainstSources(artifact, derived);

  const { investigationFingerprint, ...artifactCore } = artifact;
  if (sha256(canonicalText(artifactCore)) !== investigationFingerprint) fail("artifact fingerprint self-check failed");

  const generatorSource = read(GENERATOR_PATH);
  staticIntrinsicCheck(generatorSource);

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

  const domainDrift = clone(artifact);
  domainDrift.grounding.domain.perAnchor = [5, 5, 6, 6, 6, 5, 3];
  expectRejection("grounding per-anchor drift", domainDrift);
  const recordedCountDrift = clone(artifact);
  recordedCountDrift.grounding.contacts.recorded = 13;
  expectRejection("grounding recorded-count drift", recordedCountDrift);
  const compositeDrift = clone(artifact);
  compositeDrift.grounding.composite.confusion.tp = 13;
  expectRejection("grounding composite drift", compositeDrift);
  const missSwap = clone(artifact);
  missSwap.grounding.nearMiss.missedKeys = ["127:191", "4033:2017"];
  expectRejection("grounding miss swap", missSwap);
  const chainDrift = clone(artifact);
  chainDrift.grounding.chainAnchors.bl055 = "0".repeat(64);
  expectRejection("grounding chain-anchor drift", chainDrift);
  const rowDrift = clone(artifact);
  rowDrift.propertyTable.rows[0].dPcSum = 6;
  expectRejection("property row drift", rowDrift);
  const rowCompositeDrift = clone(artifact);
  rowCompositeDrift.propertyTable.rows[0].composite = false;
  expectRejection("property composite flag drift", rowCompositeDrift);
  const rowStrip = clone(artifact);
  rowStrip.propertyTable.rows.pop();
  expectRejection("property row strip", rowStrip);
  const columnStrip = clone(artifact);
  columnStrip.propertyTable.columns.pop();
  expectRejection("property column strip", columnStrip);
  const termADrift = clone(artifact);
  termADrift.perTerm.termA.confusion.tp = 11;
  expectRejection("Term-A confusion drift", termADrift);
  const termBStrip = clone(artifact);
  termBStrip.perTerm.termB.selectedKeys.pop();
  expectRejection("Term-B selected strip", termBStrip);
  const overlapFlip = clone(artifact);
  overlapFlip.perTerm.overlap.disjoint = false;
  expectRejection("disjointness flip", overlapFlip);
  const residualFlip = clone(artifact);
  residualFlip.perTerm.residual.exact = false;
  expectRejection("residual exact flip", residualFlip);
  const pairRespectFlip = clone(artifact);
  pairRespectFlip.perTerm.wholePairRespect.termA = false;
  expectRejection("whole-pair respect flip", pairRespectFlip);
  const cleanSplitDrift = clone(artifact);
  cleanSplitDrift.permutation.results.cleanSplitCount = 1;
  expectRejection("permutation clean-split drift", cleanSplitDrift);
  const histogramDrift = clone(artifact);
  histogramDrift.permutation.results.tpHistogram["6"] = 999;
  expectRejection("permutation histogram drift", histogramDrift);
  const disclosureDrift = clone(artifact);
  disclosureDrift.permutation.disclosure = "conditional but confirmatory";
  expectRejection("permutation disclosure drift", disclosureDrift);
  const artifactVerdictFlip = clone(artifact);
  artifactVerdictFlip.permutation.verdict = "SUPPORTED";
  expectRejection("H-Artifact verdict flip", artifactVerdictFlip);
  const denominatorDrift = clone(artifact);
  denominatorDrift.permutation.exact.cleanMatchDenominator = "1";
  expectRejection("exact-match denominator drift", denominatorDrift);
  const orbitDrift = clone(artifact);
  orbitDrift.geometricMapping.orbitOrder = ["127", "2111", "3103", "3847", "3599", "3971", "4033"];
  expectRejection("orbit order drift", orbitDrift);
  const terminalDrift = clone(artifact);
  terminalDrift.geometricMapping.terminalWindows = ["191", "4001"];
  expectRejection("terminal window drift", terminalDrift);
  const mirrorFlip = clone(artifact);
  mirrorFlip.geometricMapping.inversionSymmetry.allMirrored = false;
  expectRejection("inversion mirror flip", mirrorFlip);
  const officeStepDrift = clone(artifact);
  officeStepDrift.geometricMapping.officeSteps[0] = 3;
  expectRejection("office step drift", officeStepDrift);
  const closureDrift = clone(artifact);
  closureDrift.geometricMapping.closureAlignment.closureInterval = 11;
  expectRejection("closure interval drift", closureDrift);
  const windowStrip = clone(artifact);
  windowStrip.geometricMapping.windows.pop();
  expectRejection("window row strip", windowStrip);
  const faConfusionDrift = clone(artifact);
  faConfusionDrift.crossDomain.termA.confusion.fp = 11;
  expectRejection("cross-domain confusion drift", faConfusionDrift);
  const faCompositionDrift = clone(artifact);
  faCompositionDrift.crossDomain.termA.classComposition["7-27"] = 24;
  expectRejection("cross-domain class composition drift", faCompositionDrift);
  const faApplicabilityDrift = clone(artifact);
  faApplicabilityDrift.crossDomain.termB.applicability = "APPLICABLE";
  expectRejection("Term-B applicability drift", faApplicabilityDrift);
  const informationalVerdictFlip = clone(artifact);
  informationalVerdictFlip.crossDomain.verdict = "REFUTED";
  expectRejection("H-Informational verdict flip", informationalVerdictFlip);
  const singleCleanFlip = clone(artifact);
  singleCleanFlip.minimality.singles[2].clean = true;
  expectRejection("single clean flip", singleCleanFlip);
  const pairStrip = clone(artifact);
  pairStrip.minimality.pairs.pop();
  expectRejection("pair table strip", pairStrip);
  const cleanPairsDrift = clone(artifact);
  cleanPairsDrift.minimality.summary.cleanPairs = ["P3+P9"];
  expectRejection("clean-pairs drift", cleanPairsDrift);
  const cardinalityDrift = clone(artifact);
  cardinalityDrift.minimality.summary.minimalCleanCardinality = 3;
  expectRejection("minimal cardinality drift", cardinalityDrift);
  const degeneracyDrift = clone(artifact);
  degeneracyDrift.minimality.degeneracyClasses[0].ids = ["P1", "P2"];
  expectRejection("degeneracy class drift", degeneracyDrift);
  const appendixDrift = clone(artifact);
  appendixDrift.minimality.appendixVariants[0].confusion.tp = 11;
  expectRejection("appendix variant drift", appendixDrift);
  const primitiveVerdictFlip = clone(artifact);
  primitiveVerdictFlip.verdictSet["H-Primitive"].verdict = "REFUTED";
  expectRejection("H-Primitive verdict flip", primitiveVerdictFlip);
  const geometricVerdictFlip = clone(artifact);
  geometricVerdictFlip.verdictSet["H-Geometric"].verdict = "REFUTED";
  expectRejection("H-Geometric verdict flip", geometricVerdictFlip);
  const attributionDrift = clone(artifact);
  attributionDrift.verdictSet["H-Informational"].attribution = "attributed";
  expectRejection("H-Informational attribution drift", attributionDrift);
  const scopeDrift = clone(artifact);
  scopeDrift.verdictSet["H-Primitive"].scope = "absolute";
  expectRejection("H-Primitive scope drift", scopeDrift);
  const gslPromotion = clone(artifact);
  gslPromotion.gslTreatment.newEntryDraft.status = "PROMOTED";
  expectRejection("GSL-7 promotion", gslPromotion);
  const gslRefinementApplied = clone(artifact);
  gslRefinementApplied.gslTreatment.gsl4Refinement.status = "applied";
  expectRejection("GSL-4 refinement status drift", gslRefinementApplied);
  const fenceDrift = clone(artifact);
  fenceDrift.fences.permutationDisclosure = "n/a";
  expectRejection("permutation fence drift", fenceDrift);
  const statusFenceDrift = clone(artifact);
  statusFenceDrift.fences.compositeStatusUnchanged = "promoted";
  expectRejection("composite-status fence drift", statusFenceDrift);
  const notAccomplishedStrip = clone(artifact);
  notAccomplishedStrip.notAccomplished.pop();
  expectRejection("notAccomplished strip", notAccomplishedStrip);
  const basePinDrift = clone(artifact);
  basePinDrift.base.bl070.derivationFingerprint = "0".repeat(64);
  expectRejection("BL-070 base pin drift", basePinDrift);
  const bindingDrift = clone(artifact);
  bindingDrift.sourceBindings[0].sha256 = "0".repeat(64);
  expectRejection("source binding sha drift", bindingDrift);
  const seedDrift = clone(artifact);
  seedDrift.preRegistration.permutationMethod.seed = 1;
  expectRejection("pre-registered seed drift", seedDrift);
  const accountingDrift = clone(artifact);
  accountingDrift.accounting.masksOnly = [];
  expectRejection("accounting tier emptying", accountingDrift);
  const citationDrift = clone(artifact);
  citationDrift.contractCitations = [];
  expectRejection("contract citation emptying", citationDrift);
  const rulingDrift = clone(artifact);
  rulingDrift.preRegistration.rulings.pop();
  expectRejection("ruling inventory strip", rulingDrift);

  const staticProbes = [
    ["smuggled office-index read", "const drawn = ledgerRows[0].officeIndex; void drawn;"],
    ["smuggled office-field read", "const drawn = ledgerRows[0].office; void drawn;"],
    ["smuggled class-label read", "const drawn = ledgerRows[0].forte; void drawn;"],
    ["smuggled orientation read", "const drawn = orientationByState.get('127'); void drawn;"],
    ["smuggled network seat-contact read", "const drawn = network.d7SeatContactRows; void drawn;"],
    ["smuggled fa-table read", "const drawn = bl055.table28; void drawn;"],
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
  const stripProbes = ["deriveDomain", "hamming12", "rotateMask12", "maskOfRow", "pitchSet", "deriveInstanceFacts", "buildCanonicalPredicates"];
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
  // region-scoping probes (two-sided)
  const permissiveSource = generatorSource.replace(
    "// ==== INTRINSIC-MECHANISM-END ====",
    "// ==== INTRINSIC-MECHANISM-END ==== const allowedOfficeRead = ledgerRows[0].office; void allowedOfficeRead;",
  );
  staticIntrinsicCheck(permissiveSource);
  let proofStripRejected = false;
  try {
    staticIntrinsicCheck(generatorSource.split("officeIndexByState").join("office_index_state"));
  } catch {
    proofStripRejected = true;
  }
  if (!proofStripRejected) fail("mutation probe not rejected: region-scoping proof strip");
  const regionScopingProbes = 2;

  const mutationProbes = [
    "grounding per-anchor drift", "grounding recorded-count drift", "grounding composite drift",
    "grounding miss swap", "grounding chain-anchor drift", "property row drift",
    "property composite flag drift", "property row strip", "property column strip",
    "Term-A confusion drift", "Term-B selected strip", "disjointness flip", "residual exact flip",
    "whole-pair respect flip", "permutation clean-split drift", "permutation histogram drift",
    "permutation disclosure drift", "H-Artifact verdict flip", "exact-match denominator drift",
    "orbit order drift", "terminal window drift", "inversion mirror flip", "office step drift",
    "closure interval drift", "window row strip", "cross-domain confusion drift",
    "cross-domain class composition drift", "Term-B applicability drift", "H-Informational verdict flip",
    "single clean flip", "pair table strip", "clean-pairs drift", "minimal cardinality drift",
    "degeneracy class drift", "appendix variant drift", "H-Primitive verdict flip",
    "H-Geometric verdict flip", "H-Informational attribution drift", "H-Primitive scope drift",
    "GSL-7 promotion", "GSL-4 refinement status drift", "permutation fence drift",
    "composite-status fence drift", "notAccomplished strip", "BL-070 base pin drift",
    "source binding sha drift", "pre-registered seed drift", "accounting tier emptying",
    "contract citation emptying", "ruling inventory strip",
    ...staticProbes.map(([label]) => label),
    ...stripProbes.map((token) => `presence-strip: ${token}`),
    "region-scoping proof strip",
  ];

  console.log(JSON.stringify({
    artifact: ARTIFACT_PATH,
    status: "PASS",
    investigationFingerprint: artifact.investigationFingerprint,
    chainFingerprints: {
      bl068: BL068_FINGERPRINT,
      bl070: BL070_FINGERPRINT,
      bl071: BL071_FINGERPRINT,
      bl055: BL055_FINGERPRINT,
    },
    domain: `${artifact.grounding.domain.size} instances, per-anchor ${artifact.grounding.domain.perAnchor.join("/")}`,
    perTerm: {
      termA: `${artifact.perTerm.termA.confusion.tp}/${artifact.perTerm.termA.confusion.fp}/${artifact.perTerm.termA.confusion.fn}/${artifact.perTerm.termA.confusion.tn}`,
      termB: `${artifact.perTerm.termB.confusion.tp}/${artifact.perTerm.termB.confusion.fp}/${artifact.perTerm.termB.confusion.fn}/${artifact.perTerm.termB.confusion.tn}`,
      joint: `${artifact.perTerm.joint.confusion.tp}/${artifact.perTerm.joint.confusion.fp}/${artifact.perTerm.joint.confusion.fn}/${artifact.perTerm.joint.confusion.tn}`,
    },
    permutation: `${artifact.permutation.results.cleanSplitRate} clean splits; exact 1/${artifact.permutation.exact.cleanMatchDenominator}`,
    crossDomain: `Term-A fa ${artifact.crossDomain.termA.confusion.tp}/${artifact.crossDomain.termA.confusion.fp}/${artifact.crossDomain.termA.confusion.fn}/${artifact.crossDomain.termA.confusion.tn}; Term-B ${artifact.crossDomain.termB.applicability}`,
    minimality: `singles ${artifact.minimality.summary.cleanSingles.length}; pairs ${artifact.minimality.summary.cleanPairs.join(", ")}`,
    verdicts: Object.fromEntries(Object.entries(artifact.verdictSet).filter(([key]) => key !== "nonExclusive").map(([key, value]) => [key, value.verdict])),
    mutationProbes: mutationProbes.length,
    probeStaticRejections: staticRejections,
    regionScopingProbes: `${regionScopingProbes} (permissive pass + proof strip rejected)`,
  }, null, 2));
}

validate();
