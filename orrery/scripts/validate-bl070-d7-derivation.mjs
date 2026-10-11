#!/usr/bin/env node
/**
 * Validate the generated BL-070 D7 derivation attempt against its sources.
 *
 * Independent of the generator: re-reads the 462-record ledger, the network,
 * the containment mesh, the landed BL-068 artifact and the Gate 3 receipt;
 * re-derives the D1/D2 domain, the calibration, all nine battery tables, the
 * near-miss anatomy, the tie-break candidate, the invariants, the orbit
 * rotation intervals and the branch classification; re-checks the artifact
 * fingerprint; statically verifies the generator's intrinsic region (forbidden
 * reads absent, required masks-only reads present); and runs mutation probes
 * (artifact drift, smuggled reads, presence-strip). Fail-loud.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..", "..");

const ARTIFACT_PATH = "orrery/src/generated/bl070-d7-derivation.v1.json";
const GENERATOR_PATH = "scripts/build-bl070-d7-derivation.mjs";
const SCHEMA_VERSION = "harmonic-orrery.bl070-d7-derivation.v1";
const DERIVATION_ID = "BL070_D7_DERIVATION_V1";
const LEDGER_PATH = "canonical/universal-heptatonic-ledger.csv";
const NETWORK_PATH = "canonical/universal-network-data.json";
const MESH_PATH = "derived/hypergraph/bipartite-inclusion-v1.json";
const BL068_PATH = "orrery/src/generated/bl068-d7-asymmetry.v1.json";
const GATE3_PATH = "qa/d4-r2-execution-receipt.json";

const BL068_FINGERPRINT = "b0d65bd6149978de4f5ef3f1a0b281d0f6324a81114e8aa9da07eda8ef5ef849";

const NON_Z_D_FAMILIES = ["7-1", "7-15", "7-22", "7-8"];
const Z_D_FAMILIES = ["7-Z12", "7-Z17", "7-Z37"];
const D_TIER_FAMILIES = [...NON_Z_D_FAMILIES, ...Z_D_FAMILIES];

function fail(message) {
  throw new Error(`INVALID_BL070_D7_DERIVATION: ${message}`);
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

function histogram(keys, recordedSet, valueOf) {
  const result = { recorded: {}, unrecorded: {} };
  for (const key of keys) {
    const value = String(valueOf(key));
    const group = recordedSet.has(key) ? "recorded" : "unrecorded";
    result[group][value] = (result[group][value] ?? 0) + 1;
  }
  return result;
}

function verdictOf(matrix) {
  if (matrix.tp === 14 && matrix.fp === 0 && matrix.fn === 0 && matrix.tn === 22) return "CLEAN_SPLIT";
  if (matrix.tp === 12 && matrix.fp === 0 && matrix.fn === 2 && matrix.tn === 22) return "NEAR_MISS_BOUNDARY";
  return "NON_SEPARATING";
}

// ---------------------------------------------------------------------------
// Independent re-derivation
// ---------------------------------------------------------------------------

function reDerive(sources) {
  const { ledgerRows, network, mesh, bl068, gate3 } = sources;
  if (ledgerRows.length !== 462) fail(`ledger census ${ledgerRows.length}`);

  const masks = new Map(ledgerRows.map((row) => [String(row.id), maskOfPitches(parsePitchSet(row.pitchSet))]));
  for (const row of ledgerRows) {
    if (masks.get(String(row.id)) !== Number(row.id)) fail(`ledger mask/id disagreement at ${row.id}`);
  }
  const officeByState = new Map(ledgerRows.map((row) => [String(row.id), row.office]));
  const officeIndexByState = new Map(ledgerRows.map((row) => [String(row.id), Number(row.officeIndex)]));
  const orientationByState = new Map(ledgerRows.map((row) => [String(row.id), row.orientation]));

  // D1 partition
  const anchorRows = ledgerRows.filter((row) => row.tier === "D7" && row.role === "anchor").sort((a, b) => Number(a.id) - Number(b.id));
  const satelliteRows = ledgerRows.filter((row) => row.tier === "D6" && row.role === "satellite").sort((a, b) => Number(a.id) - Number(b.id));
  if (anchorRows.length !== 7 || satelliteRows.length !== 14) fail("D7/D6 partition census drift");
  const anchorIds = anchorRows.map((row) => String(row.id));
  const satelliteIds = satelliteRows.map((row) => String(row.id));
  const class72Ids = ledgerRows.filter((row) => row.forte === "7-2").map((row) => String(row.id)).sort(cmp);
  if (canonicalText(class72Ids) !== canonicalText(satelliteIds.slice().sort(cmp))) {
    fail("D6-satellite partition is not set-equal to the 7-2 ledger class");
  }
  const d6Classes = {};
  for (const row of satelliteRows) d6Classes[row.forte] = (d6Classes[row.forte] ?? 0) + 1;
  if (Object.keys(d6Classes).length !== 1 || d6Classes["7-2"] !== 14) fail("D6 class purity drift");

  // D2 reach
  const perAnchor = anchorRows.map((row) => {
    const anchor = String(row.id);
    const instances = satelliteRows
      .filter((satellite) => hamming12(masks.get(anchor), masks.get(String(satellite.id))) === 2)
      .map((satellite) => String(satellite.id))
      .sort((left, right) => cmp(Number(left), Number(right)));
    return { anchor, instances, count: instances.length };
  });
  const instanceKeys = perAnchor.flatMap((entry) => entry.instances.map((satellite) => `${entry.anchor}:${satellite}`))
    .sort((left, right) => {
      const [la, ls] = left.split(":").map(Number);
      const [ra, rs] = right.split(":").map(Number);
      return la - ra || ls - rs;
    });
  if (instanceKeys.length !== 36) fail(`derived domain size ${instanceKeys.length}`);
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

  // calibration
  const allLedgerReach = anchorRows.map((row) => {
    const anchor = String(row.id);
    return { anchor, count: ledgerRows.filter((other) => String(other.id) !== anchor && hamming12(masks.get(anchor), masks.get(String(other.id))) === 2).length };
  });
  if (allLedgerReach.some((entry) => entry.count !== 30)) fail("all-ledger reach not uniform at 30");
  const d6TierReach = anchorRows.map((row) => {
    const anchor = String(row.id);
    return { anchor, count: ledgerRows.filter((other) => other.tier === "D6" && hamming12(masks.get(anchor), masks.get(String(other.id))) === 2).length };
  });

  // recorded status (the target, evaluation only)
  const recordedSet = new Set(instanceKeys.filter((key) => officeByState.get(key.split(":")[0]) === officeByState.get(key.split(":")[1])));
  if (recordedSet.size !== 14) fail(`recorded census ${recordedSet.size}`);
  const contactKeys = network.d7SeatContactRows.map((row) => `${String(row.target)}:${String(row.source)}`).sort((left, right) => {
    const [la, ls] = left.split(":").map(Number);
    const [ra, rs] = right.split(":").map(Number);
    return la - ra || ls - rs;
  });
  if (contactKeys.length !== 14) fail("contact census drift");
  if (canonicalText(contactKeys) !== canonicalText(instanceKeys.filter((key) => recordedSet.has(key)))) {
    fail("recorded subset is not set-equal to the seat-contact rows");
  }
  const deltaCounts = {};
  for (const key of instanceKeys.filter((key) => !recordedSet.has(key))) {
    const [anchor, satellite] = key.split(":");
    const delta = String(((officeIndexByState.get(satellite) - officeIndexByState.get(anchor)) + 7) % 7);
    deltaCounts[delta] = (deltaCounts[delta] ?? 0) + 1;
  }
  if (canonicalText(deltaCounts) !== canonicalText({ "2": 11, "5": 11 })) fail("delta structure drift");

  // BL-068 comparison
  const bl068Keys = bl068.census.availabilityDomain.perAnchor
    .flatMap((entry) => entry.instances.map((instance) => instance.key))
    .sort((left, right) => {
      const [la, ls] = left.split(":").map(Number);
      const [ra, rs] = right.split(":").map(Number);
      return la - ra || ls - rs;
    });
  if (canonicalText(bl068Keys) !== canonicalText(instanceKeys)) fail("derived domain not set-equal to the BL-068 availability domain");

  // instance facts (masks + mesh only)
  const subnodesByMask = new Map(Object.values(mesh.heptatonicNodes).map((node) => [String(node.pitchMask), node.subnodes]));
  const pentatonicById = mesh.pentatonicSubnodes;
  const familiesByMask = (mask) => {
    const subnodes = subnodesByMask.get(String(mask));
    if (!subnodes) fail(`mesh node missing for mask ${mask}`);
    const families = new Set();
    for (const id of subnodes) for (const family of (pentatonicById[id]?.parentsUnrooted ?? [])) families.add(family);
    return families;
  };
  const signOfMask = (mask) => {
    const subnodes = subnodesByMask.get(String(mask));
    if (!subnodes) fail(`mesh node missing for mask ${mask}`);
    const shared = (family) => subnodes.filter((id) => (pentatonicById[id]?.parentsUnrooted ?? []).includes(family)).length;
    return NON_Z_D_FAMILIES.reduce((sum, family) => sum + shared(family), 0)
      - Z_D_FAMILIES.reduce((sum, family) => sum + shared(family), 0);
  };
  const facts = new Map();
  for (const key of instanceKeys) {
    const [anchor, satellite] = key.split(":");
    const anchorMask = masks.get(anchor);
    const satelliteMask = masks.get(satellite);
    const anchorPitches = parsePitchSet(ledgerRows.find((row) => String(row.id) === anchor).pitchSet);
    const satellitePitches = parsePitchSet(ledgerRows.find((row) => String(row.id) === satellite).pitchSet);
    const anchorSet = new Set(anchorPitches);
    const satelliteSet = new Set(satellitePitches);
    const removed = anchorPitches.filter((pitch) => !satelliteSet.has(pitch));
    const added = satellitePitches.filter((pitch) => !anchorSet.has(pitch));
    if (removed.length !== 1 || added.length !== 1) fail(`displacement drift at ${key}`);
    const raw = (added[0] - removed[0] + 12) % 12;
    const anchorSubnodes = subnodesByMask.get(String(anchorMask));
    const satelliteSubnodes = subnodesByMask.get(String(satelliteMask));
    facts.set(key, {
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
      familyOverlapSeven: [...familiesByMask(anchorMask)].filter((family) => D_TIER_FAMILIES.includes(family) && familiesByMask(satelliteMask).has(family)).length,
      inversionImageOfAnchorEqualsSatellite: invertMask12(anchorMask) === satelliteMask,
      inversionImageInReach: anchorIds.some((other) => hamming12(masks.get(other), invertMask12(satelliteMask)) === 2),
      parentCount: parentCounts.get(satellite),
    });
  }
  const factByKey = facts;

  // battery
  const anchorMinMask = new Map(anchorIds.map((anchor) => [
    anchor,
    Math.min(...perAnchor.find((entry) => entry.anchor === anchor).instances.map((satellite) => factByKey.get(`${anchor}:${satellite}`).dMask)),
  ]));
  const batteryDefs = [
    { id: "C-M1", expected: "NON_SEPARATING", subRules: [
      { name: "overlapIdThresholdSix", predicate: (key) => factByKey.get(key).overlapIdCount >= 6 },
      { name: "familyOverlapThresholdSeven", predicate: (key) => factByKey.get(key).familyOverlapSeven >= 7 },
    ] },
    { id: "C-M2", expected: "NON_SEPARATING", subRules: [
      { name: "rotationHitGeOne", predicate: (key) => factByKey.get(key).rotationHits >= 1 },
      { name: "hammingEqualsEight", predicate: (key) => factByKey.get(key).hamming === 8 },
    ] },
    { id: "C-M3", expected: "NEAR_MISS_BOUNDARY", subRules: [
      { name: "absPcSumDeltaOne", predicate: (key) => factByKey.get(key).dPcSum === 1 },
      { name: "minAbsMaskDeltaPerAnchor", predicate: (key) => {
        const fact = factByKey.get(key);
        return fact.dMask === anchorMinMask.get(fact.anchor);
      } },
      { name: "absMaskDeltaAtMost64", predicate: (key) => factByKey.get(key).dMask <= 64 },
    ] },
    { id: "C-M4", expected: "NON_SEPARATING", subRules: [
      { name: "zMajoritySignNegative", predicate: (key) => factByKey.get(key).sign < 0 },
    ] },
    { id: "C-M5", expected: "NEAR_MISS_BOUNDARY", subRules: [
      { name: "absLinearDisplacementOne", predicate: (key) => Math.abs(factByKey.get(key).displacementLinear) === 1 },
      { name: "absLinearDisplacementSix", predicate: (key) => Math.abs(factByKey.get(key).displacementLinear) === 6 },
    ] },
    { id: "C-M6", expected: "NON_SEPARATING", subRules: [
      { name: "icVectorEqual", predicate: (key) => factByKey.get(key).icEqual },
    ] },
    { id: "C-M7", expected: "NON_SEPARATING", subRules: [
      { name: "orientationA", predicate: (key) => orientationByState.get(key.split(":")[1]).endsWith(" A") },
    ] },
    { id: "C-M8", expected: "NON_SEPARATING", subRules: [
      { name: "inversionImageOfAnchorEqualsSatellite", predicate: (key) => factByKey.get(key).inversionImageOfAnchorEqualsSatellite },
      { name: "inversionImageInReach", predicate: (key) => factByKey.get(key).inversionImageInReach },
    ] },
    { id: "C-M9", expected: "NON_SEPARATING", subRules: [
      { name: "parentCountOne", predicate: (key) => factByKey.get(key).parentCount === 1 },
      { name: "parentCountTwo", predicate: (key) => factByKey.get(key).parentCount === 2 },
      { name: "parentCountThree", predicate: (key) => factByKey.get(key).parentCount === 3 },
    ] },
  ];
  const battery = batteryDefs.map((definition) => {
    const subRules = definition.subRules.map((subRule) => {
      const matrix = confusion(instanceKeys, recordedSet, subRule.predicate);
      return { name: subRule.name, confusion: matrix, verdict: verdictOf(matrix) };
    });
    const observedVerdict = subRules.some((subRule) => subRule.verdict === "CLEAN_SPLIT")
      ? "CLEAN_SPLIT"
      : subRules.some((subRule) => subRule.verdict === "NEAR_MISS_BOUNDARY")
        ? "NEAR_MISS_BOUNDARY"
        : "NON_SEPARATING";
    return { id: definition.id, expectedVerdict: definition.expected, observedVerdict, expectationHeld: observedVerdict === definition.expected, subRules };
  });
  const cleanSplitCount = battery.filter((entry) => entry.observedVerdict === "CLEAN_SPLIT").length;
  const nearMissCandidates = battery.filter((entry) => entry.observedVerdict === "NEAR_MISS_BOUNDARY").map((entry) => entry.id);

  const distributionsOf = {
    "C-M1": { overlapIdCount: (key) => factByKey.get(key).overlapIdCount, familyOverlapSeven: (key) => factByKey.get(key).familyOverlapSeven },
    "C-M2": { rotationHits: (key) => factByKey.get(key).rotationHits, hamming: (key) => factByKey.get(key).hamming },
    "C-M3": { dPcSum: (key) => factByKey.get(key).dPcSum, dMask: (key) => factByKey.get(key).dMask },
    "C-M4": { sign: (key) => factByKey.get(key).sign },
    "C-M5": { displacementLinear: (key) => factByKey.get(key).displacementLinear },
    "C-M6": { icEqual: (key) => factByKey.get(key).icEqual },
    "C-M7": { orientation: (key) => (orientationByState.get(key.split(":")[1]).endsWith(" A") ? "A" : "B") },
    "C-M8": { inversionImageInReach: (key) => factByKey.get(key).inversionImageInReach },
    "C-M9": { parentCount: (key) => factByKey.get(key).parentCount },
  };
  const recomputedDistributions = Object.fromEntries(Object.entries(distributionsOf).map(([id, defs]) => [
    id,
    Object.fromEntries(Object.entries(defs).map(([name, valueOf]) => [name, histogram(instanceKeys, recordedSet, valueOf)])),
  ]));

  // near-miss
  const nearMissSelected = instanceKeys.filter((key) => factByKey.get(key).dPcSum === 1);
  const nearMissMissed = instanceKeys.filter((key) => recordedSet.has(key) && factByKey.get(key).dPcSum !== 1);
  const nearMissConfusion = confusion(instanceKeys, recordedSet, (key) => factByKey.get(key).dPcSum === 1);
  if (nearMissSelected.length !== 12 || canonicalText(nearMissMissed) !== canonicalText(["127:253", "4033:2017"])) {
    fail("near-miss anatomy drift");
  }

  // tie-break
  const tieBreakConfusion = confusion(instanceKeys, recordedSet, (key) => factByKey.get(key).dPcSum === 1 || factByKey.get(key).parentCount === 1);

  // invariants
  const pairByMask = new Map(satelliteRows.map((row) => [masks.get(String(row.id)), String(row.id)]));
  const seen = new Set();
  const inversionPairs = [];
  for (const state of distinctStates) {
    if (seen.has(state)) continue;
    const partner = pairByMask.get(invertMask12(masks.get(state)));
    if (!partner) fail(`inversion image of ${state} missing`);
    seen.add(state);
    seen.add(partner);
    inversionPairs.push([state, partner].sort(cmp));
  }
  inversionPairs.sort((left, right) => cmp(left[0], right[0]) || cmp(left[1], right[1]));
  if (inversionPairs.length !== 7) fail("inversion pair census drift");
  const contactStateSet = new Set(contactKeys.map((key) => key.split(":")[1]));
  const invariantPairs = inversionPairs.map(([left, right]) => ({
    a: left,
    b: right,
    aOffice: officeByState.get(left),
    bOffice: officeByState.get(right),
    inClass: class72Ids.includes(left) && class72Ids.includes(right),
    officeSum: String((officeIndexByState.get(left) + officeIndexByState.get(right)) % 7),
    statusShared: contactStateSet.has(left) === contactStateSet.has(right),
    orientations: sortedUnique([
      orientationByState.get(left).endsWith(" A") ? "A" : "B",
      orientationByState.get(right).endsWith(" A") ? "A" : "B",
    ]),
  }));
  const landedPairSet = new Set(bl068.invariants.pairs.map((pair) => [pair.a, pair.b].sort(cmp).join("|")));
  if (!invariantPairs.every((pair) => landedPairSet.has([pair.a, pair.b].sort(cmp).join("|")))) {
    fail("derived pairing differs from the landed BL-068 pairing");
  }

  // orbital rotation
  const successor = new Map(network.d7ModalRows.map((row) => [String(row.source), String(row.target)]));
  const orbitEdges = [];
  let current = "127";
  for (let step = 0; step < 7; step += 1) {
    const next = successor.get(current);
    if (!next) fail(`orbit dead-end at ${current}`);
    orbitEdges.push({ a: current, b: next });
    current = next;
  }
  if (current !== "127") fail("orbit does not close");
  const orbitPerEdge = orbitEdges.map((edge) => {
    const intervals = rotationRelations(masks.get(edge.a), masks.get(edge.b));
    if (intervals.length !== 1) fail(`orbit edge not an exact rotation at ${edge.a}->${edge.b}`);
    const landed = gate3.d7Analogue.cycleTwinVerification.perEdge.find((entry) => String(entry.a) === edge.a && String(entry.b) === edge.b);
    if (!landed || landed.rotateInterval !== intervals[0]) fail(`landed interval disagreement at ${edge.a}->${edge.b}`);
    return { a: edge.a, b: edge.b, rotateInterval: intervals[0], landedRotateInterval: landed.rotateInterval, exact: true };
  });
  const intervalHistogram = orbitPerEdge.reduce((acc, edge) => { acc[edge.rotateInterval] = (acc[edge.rotateInterval] ?? 0) + 1; return acc; }, {});
  if (canonicalText(intervalHistogram) !== canonicalText({ "11": 6, "6": 1 })) fail("orbit interval histogram drift");

  // direction
  const uniqueHubKeys = instanceKeys.filter((key) => factByKey.get(key).parentCount === 1);

  // branch
  const branchLabel = cleanSplitCount > 0 ? "FULL_DERIVATION" : "PARTIAL_DERIVATION";

  // IC vectors
  const anchorIcVectors = sortedUnique(anchorIds.map((anchor) => canonicalText(icVectorOfMask(masks.get(anchor)))));
  const satelliteIcVectors = sortedUnique(satelliteIds.map((satellite) => canonicalText(icVectorOfMask(masks.get(satellite)))));

  // C-M4/C-M9 state censuses
  const anchorOfState = new Map(distinctStates.map((state) => [state, perAnchor.find((entry) => entry.instances.includes(state)).anchor]));
  const cM4StateCensus = distinctStates.map((state) => ({ state, office: officeByState.get(state), sign: signOfMask(masks.get(state)) }));
  const cM9StateCensus = distinctStates.map((state) => ({ state, parentCount: parentCounts.get(state), multiplicity: parentCounts.get(state) }));

  // whole-pair closure
  const partnerOf = new Map();
  for (const [left, right] of inversionPairs) { partnerOf.set(left, right); partnerOf.set(right, left); }
  const closed = (stateSet) => [...stateSet].every((state) => stateSet.has(partnerOf.get(state)));
  const statesWhere = (predicate) => new Set(instanceKeys.filter((key) => predicate(factByKey.get(key))).map((key) => key.split(":")[1]));
  const closure = {
    nearMiss: closed(new Set(nearMissSelected.map((key) => key.split(":")[1]))),
    tieBreak: closed(statesWhere((fact) => fact.dPcSum === 1 || fact.parentCount === 1)),
    zMajority: closed(statesWhere((fact) => fact.sign < 0)),
    reachCensusOne: closed(statesWhere((fact) => fact.parentCount === 1)),
    reachCensusTwo: closed(statesWhere((fact) => fact.parentCount === 2)),
    domain: closed(new Set(distinctStates)),
  };
  if (Object.values(closure).some((value) => value !== true)) fail("whole-pair closure drift");

  return {
    sources: { ledgerRows, network, mesh, bl068, gate3 },
    anchorIds, satelliteIds, class72Ids, perAnchor, instanceKeys, distinctStates,
    parentCounts, multiplicityBuckets, allLedgerReach, d6TierReach, recordedSet, deltaCounts,
    factByKey, battery, cleanSplitCount, nearMissCandidates, nearMissSelected, nearMissMissed, nearMissConfusion,
    recomputedDistributions, tieBreakConfusion, invariantPairs, orbitPerEdge, intervalHistogram,
    uniqueHubKeys, branchLabel, anchorIcVectors, satelliteIcVectors, cM4StateCensus, cM9StateCensus, anchorOfState,
  };
}

// ---------------------------------------------------------------------------
// Artifact checks
// ---------------------------------------------------------------------------

function checkAgainstSources(artifact, derived) {
  const {
    anchorIds, satelliteIds, perAnchor, instanceKeys, distinctStates,
    multiplicityBuckets, allLedgerReach, d6TierReach, recordedSet, deltaCounts,
    battery, cleanSplitCount, nearMissCandidates, nearMissSelected, nearMissMissed, nearMissConfusion,
    recomputedDistributions, tieBreakConfusion, invariantPairs, orbitPerEdge, intervalHistogram,
    uniqueHubKeys, branchLabel, anchorIcVectors, satelliteIcVectors, cM4StateCensus, cM9StateCensus,
  } = derived;

  if (artifact.schemaVersion !== SCHEMA_VERSION || artifact.derivationId !== DERIVATION_ID) fail("artifact header drift");
  if (artifact.status !== "planning_evidence") fail("status drift");
  if (artifact.generator !== "scripts/build-bl070-d7-derivation.mjs") fail("generator path drift");

  // source bindings
  const bindingPaths = artifact.sourceBindings.map((binding) => binding.artifact);
  if (canonicalText(sortedUnique(bindingPaths)) !== canonicalText(sortedUnique([
    LEDGER_PATH, NETWORK_PATH, MESH_PATH, BL068_PATH, GATE3_PATH,
  ]))) fail("source binding set drift");
  for (const binding of artifact.sourceBindings) {
    if (binding.sha256 !== fileSha(binding.artifact)) fail(`source binding sha drift: ${binding.artifact}`);
  }
  if (artifact.base.bl068.artifact !== BL068_PATH) fail("base artifact path drift");
  if (artifact.base.bl068.derivationFingerprint !== BL068_FINGERPRINT) fail("base fingerprint literal drift");
  const { derivationFingerprint: bl068Fingerprint, ...bl068Core } = derived.sources.bl068;
  if (sha256(canonicalText(bl068Core)) !== bl068Fingerprint || bl068Fingerprint !== BL068_FINGERPRINT) fail("BL-068 chain fingerprint drift");
  if (derived.sources.gate3.status !== "execution_verified") fail("Gate 3 receipt status drift");

  // pre-registration
  const rulingIds = artifact.preRegistration.rulings.map((ruling) => ruling.id);
  if (canonicalText(rulingIds) !== canonicalText(["OD-70-1", "OD-70-2", "OD-70-3", "OD-70-4"])) fail("ruling inventory drift");
  if (canonicalText(artifact.preRegistration.branchCriteria) !== canonicalText(artifact.branch.criteria)) fail("branch criteria drift");

  // domain derivation
  const domain = artifact.domainDerivation;
  if (canonicalText(domain.partition.anchors) !== canonicalText(anchorIds)) fail("partition anchors drift");
  if (canonicalText(domain.partition.satellites) !== canonicalText(satelliteIds)) fail("partition satellites drift");
  if (domain.partition.anchorCount !== 7 || domain.partition.satelliteCount !== 14) fail("partition census drift");
  if (canonicalText(domain.perAnchor) !== canonicalText(perAnchor)) fail("domain per-anchor drift");
  if (domain.domainSize !== instanceKeys.length || domain.domainSize !== 36) fail("domain size drift");
  if (domain.distinctStates !== distinctStates.length || domain.distinctStates !== 14) fail("distinct states drift");
  if (canonicalText(domain.multiplicity) !== canonicalText(multiplicityBuckets)) fail("multiplicity drift");
  if (canonicalText(domain.calibration.allLedgerReachPerAnchor) !== canonicalText(allLedgerReach)) fail("all-ledger reach drift");
  if (domain.calibration.allLedgerReachUniform !== true) fail("all-ledger reach uniform flag drift");
  if (canonicalText(domain.calibration.d6TierReachPerAnchor) !== canonicalText(d6TierReach)) fail("D6-tier reach drift");
  if (domain.comparison.bl068SetEqual !== true || domain.comparison.bl068DomainSize !== 36) fail("BL-068 comparison drift");
  if (domain.comparison.recordedCount !== recordedSet.size || domain.comparison.recordedCount !== 14 ||
      domain.comparison.unrecordedCount !== 22) fail("recorded/unrecorded totals drift");
  if (canonicalText(domain.comparison.deltaCounts) !== canonicalText(deltaCounts)) fail("delta counts drift");

  // battery
  if (canonicalText(artifact.battery.preRegisteredIds) !== canonicalText(["C-M1", "C-M2", "C-M3", "C-M4", "C-M5", "C-M6", "C-M7", "C-M8", "C-M9"])) {
    fail("pre-registered battery id list drift");
  }
  if (artifact.battery.candidates.length !== 9) fail("battery candidate census drift");
  for (const expected of battery) {
    const candidate = artifact.battery.candidates.find((entry) => entry.id === expected.id);
    if (!candidate) fail(`battery candidate missing: ${expected.id}`);
    if (candidate.observedVerdict !== expected.observedVerdict) fail(`observed verdict drift: ${expected.id}`);
    if (candidate.expectedVerdict !== expected.expectedVerdict) fail(`expected verdict drift: ${expected.id}`);
    if (candidate.expectationHeld !== expected.expectationHeld) fail(`expectation-held flag drift: ${expected.id}`);
    if (candidate.subRules.length !== expected.subRules.length) fail(`sub-rule census drift: ${expected.id}`);
    for (const expectedRule of expected.subRules) {
      const subRule = candidate.subRules.find((entry) => entry.name === expectedRule.name);
      if (!subRule) fail(`sub-rule missing: ${expected.id}.${expectedRule.name}`);
      if (canonicalText(subRule.confusion) !== canonicalText(expectedRule.confusion)) fail(`sub-rule confusion drift: ${expected.id}.${expectedRule.name}`);
      if (subRule.verdict !== expectedRule.verdict) fail(`sub-rule verdict drift: ${expected.id}.${expectedRule.name}`);
    }
    if (canonicalText(candidate.distributions) !== canonicalText(recomputedDistributions[expected.id])) {
      fail(`distribution drift: ${expected.id}`);
    }
  }
  if (artifact.battery.summary.cleanSplitCount !== cleanSplitCount || cleanSplitCount !== 0) fail("clean-split count drift");
  if (canonicalText(artifact.battery.summary.nearMissCandidates) !== canonicalText(nearMissCandidates)) fail("near-miss candidate list drift");
  if (artifact.battery.summary.verdict !== "NO_PRE_REGISTERED_CLEAN_SPLIT") fail("battery summary verdict drift");
  const cM3 = artifact.battery.candidates.find((entry) => entry.id === "C-M3");
  const cM3Rule = cM3.subRules.find((entry) => entry.name === "absPcSumDeltaOne");
  if (canonicalText(cM3Rule.confusion) !== canonicalText({ tp: 12, fp: 0, fn: 2, tn: 22 })) fail("C-M3 near-miss confusion drift");

  // near miss
  if (artifact.nearMiss.named !== "NEAR_MISS_BOUNDARY") fail("near-miss name drift");
  if (canonicalText(artifact.nearMiss.confusion) !== canonicalText(nearMissConfusion)) fail("near-miss confusion drift");
  if (canonicalText(artifact.nearMiss.selectedKeys) !== canonicalText(nearMissSelected)) fail("near-miss selected set drift");
  if (canonicalText(artifact.nearMiss.missedKeys.map((miss) => miss.key)) !== canonicalText(nearMissMissed)) fail("near-miss missed set drift");
  for (const miss of artifact.nearMiss.missedKeys) {
    const fact = derived.factByKey.get(miss.key);
    if (miss.dPcSum !== fact.dPcSum || miss.displacementLinear !== fact.displacementLinear || miss.parentCount !== fact.parentCount) {
      fail(`near-miss miss detail drift: ${miss.key}`);
    }
  }
  if (!artifact.nearMiss.nonContactShape.includes("{4,6}")) fail("non-contact shape note drift");

  // tie break
  if (artifact.tieBreakCandidate.id !== "C-TB-1") fail("tie-break id drift");
  if (canonicalText(artifact.tieBreakCandidate.confusion) !== canonicalText(tieBreakConfusion)) fail("tie-break confusion drift");
  if (!(tieBreakConfusion.tp === 14 && tieBreakConfusion.fp === 0 && tieBreakConfusion.fn === 0 && tieBreakConfusion.tn === 22)) fail("tie-break is not clean");
  if (artifact.tieBreakCandidate.status !== "UNPROMOTED_DISCOVERY") fail("tie-break status drift (must stay un-promoted)");
  if (!artifact.tieBreakCandidate.branchEffect.startsWith("none")) fail("tie-break branch effect drift");

  // invariants
  if (canonicalText(artifact.invariants.pairs) !== canonicalText(invariantPairs)) fail("invariant pair block drift");
  if (artifact.invariants.pairCount !== 7) fail("invariant pair count drift");
  if (artifact.invariants.allInClass !== true || artifact.invariants.allSumsSix !== true ||
      artifact.invariants.allStatusShared !== true || artifact.invariants.allOrientationComplementary !== true) {
    fail("invariant flag drift");
  }
  if (artifact.invariants.verdict !== "INVARIANTS_OBEYED") fail("invariant verdict drift");
  if (artifact.invariants.derivationRespect.mechanicallyVerified !== true) fail("whole-pair verification flag drift");

  // orbital rotation
  if (canonicalText(artifact.orbitalRotation.perEdge) !== canonicalText(orbitPerEdge)) fail("orbit per-edge drift");
  if (artifact.orbitalRotation.exactRotationCount !== 7) fail("exact rotation count drift");
  if (canonicalText(artifact.orbitalRotation.intervalHistogram) !== canonicalText(intervalHistogram)) fail("orbit interval histogram drift");
  if (artifact.orbitalRotation.landedVerifiedAtD4Intervals !== 0) fail("landed D4-interval verification count drift");

  // direction
  if (canonicalText(artifact.direction.uniqueHub.keys) !== canonicalText(uniqueHubKeys)) fail("unique-hub keys drift");
  if (artifact.direction.uniqueHub.resolved !== uniqueHubKeys.length || artifact.direction.uniqueHub.resolved !== 2) fail("unique-hub count drift");
  if (artifact.direction.total !== 14) fail("direction total drift");

  // IC vectors and state censuses
  const cM6 = artifact.battery.candidates.find((entry) => entry.id === "C-M6");
  if (canonicalText(cM6.anchorIcVectors) !== canonicalText(anchorIcVectors)) fail("anchor IC vectors drift");
  if (canonicalText(cM6.satelliteIcVectors) !== canonicalText(satelliteIcVectors)) fail("satellite IC vectors drift");
  const cM4 = artifact.battery.candidates.find((entry) => entry.id === "C-M4");
  if (canonicalText(cM4.stateCensus) !== canonicalText(cM4StateCensus)) fail("C-M4 state census drift");
  const cM9 = artifact.battery.candidates.find((entry) => entry.id === "C-M9");
  if (canonicalText(cM9.stateCensus) !== canonicalText(cM9StateCensus)) fail("C-M9 state census drift");

  // gates and branch
  if (artifact.gates["V-D7-1"].result !== "PASS" || artifact.gates["V-D7-2"].result !== "FAIL" ||
      artifact.gates["V-D7-3"].result !== "PASS" || artifact.gates["V-D7-4"].result !== "PASS" ||
      artifact.gates["V-D7-5"].result !== "PASS") fail("gate result drift");
  if (artifact.branch.label !== branchLabel || branchLabel !== "PARTIAL_DERIVATION") fail("branch label drift");
  if (canonicalText(artifact.branch.preRegisteredLabels) !== canonicalText(["FULL_DERIVATION", "PARTIAL_DERIVATION", "NO_DERIVATION"])) {
    fail("pre-registered branch labels drift");
  }
  if (canonicalText(artifact.branch.gateResults) !== canonicalText({
    "V-D7-1": "PASS", "V-D7-2": "FAIL", "V-D7-3": "PASS", "V-D7-4": "PASS", "V-D7-5": "PASS",
  })) fail("branch gate results drift");

  // accounting
  if (artifact.accounting.masksOnly.length < 4 || artifact.accounting.canonicalComputation.length < 4 ||
      artifact.accounting.remainingGranted.length < 3) fail("accounting tier inventory drift");
  if (!artifact.accounting.statement.includes("PARTIAL_DERIVATION") && !artifact.accounting.statement.includes("the selection is not")) {
    fail("accounting statement drift");
  }

  // fences
  if (!artifact.fences.d7HypothesisTier.includes("2703-2712")) fail("D7 fence anchor drift");
  if (!artifact.fences.membrane.includes("never a probe input")) fail("membrane fence drift");
  if (!artifact.fences.officeIsolation.includes("target, never an input")) fail("office-isolation fence drift");
  if (artifact.notAccomplished.length !== 7) fail("notAccomplished inventory drift");
  if (artifact.contractCitations.length < 8) fail("contract citation inventory drift");
}

// ---------------------------------------------------------------------------
// Static generator checks
// ---------------------------------------------------------------------------

function staticIntrinsicCheck(sourceText) {
  const begin = sourceText.indexOf("INTRINSIC-DERIVATION-BEGIN");
  const end = sourceText.indexOf("INTRINSIC-DERIVATION-END");
  if (begin < 0 || end < 0 || end <= begin) fail("generator intrinsic-region markers missing");
  const head = sourceText.slice(0, end);
  const region = sourceText.slice(begin, end);
  const forbidden = [
    /projection\.R\b/, /projection\.E\b/, /generation\.projection/,
    /officeIndex/, /parentOffice/, /\.office\b/, /relationalOffice/,
    /\bforte\b/, /intervalVector/, /setClass/, /observed/, /coverage/,
    /d7AnchorRows/, /d7SeatContactRows/, /d7ModalRows/,
  ];
  for (const pattern of forbidden) {
    if (pattern.test(region)) fail(`generator intrinsic region reads a forbidden input: ${pattern}`);
    if (pattern.test(head)) fail(`forbidden token before the intrinsic-region end: ${pattern}`);
  }
  const required = ["ledgerRows", "pitchSet", "hamming12", "rotateMask12", "maskOfRow", "deriveDomain", "deriveInstanceFacts"];
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
    gate3: readJson(GATE3_PATH),
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
  perAnchorDrift.domainDerivation.perAnchor[0].count = 5;
  expectRejection("domain per-anchor count drift", perAnchorDrift);
  const domainSizeDrift = clone(artifact);
  domainSizeDrift.domainDerivation.domainSize = 35;
  expectRejection("domain size drift", domainSizeDrift);
  const multiplicityDrift = clone(artifact);
  multiplicityDrift.domainDerivation.multiplicity = { "1": 3, "2": 2, "3": 9 };
  expectRejection("multiplicity drift", multiplicityDrift);
  const calibrationFlip = clone(artifact);
  calibrationFlip.domainDerivation.calibration.allLedgerReachUniform = false;
  expectRejection("calibration uniform flip", calibrationFlip);
  const recordedFlip = clone(artifact);
  recordedFlip.domainDerivation.comparison.recordedCount = 13;
  expectRejection("recorded count flip", recordedFlip);
  const deltaDrift = clone(artifact);
  deltaDrift.domainDerivation.comparison.deltaCounts = { "2": 12, "5": 10 };
  expectRejection("remainder delta drift", deltaDrift);
  const confusionDrift = clone(artifact);
  confusionDrift.battery.candidates.find((entry) => entry.id === "C-M3").subRules.find((entry) => entry.name === "absPcSumDeltaOne").confusion.tp = 13;
  expectRejection("near-miss confusion drift", confusionDrift);
  const verdictPromotion = clone(artifact);
  verdictPromotion.battery.candidates.find((entry) => entry.id === "C-M1").observedVerdict = "CLEAN_SPLIT";
  expectRejection("battery verdict promotion", verdictPromotion);
  const distributionDrift = clone(artifact);
  distributionDrift.battery.candidates.find((entry) => entry.id === "C-M9").distributions.parentCount.recorded["1"] = 3;
  expectRejection("distribution drift", distributionDrift);
  const missSwap = clone(artifact);
  missSwap.nearMiss.missedKeys[0].key = "127:191";
  expectRejection("near-miss miss swap", missSwap);
  const nearMissConfusionDrift = clone(artifact);
  nearMissConfusionDrift.nearMiss.confusion.fn = 1;
  expectRejection("near-miss block confusion drift", nearMissConfusionDrift);
  const tieBreakPromotion = clone(artifact);
  tieBreakPromotion.tieBreakCandidate.status = "PROMOTED";
  expectRejection("tie-break promotion", tieBreakPromotion);
  const tieBreakConfusionDrift = clone(artifact);
  tieBreakConfusionDrift.tieBreakCandidate.confusion.tn = 21;
  expectRejection("tie-break confusion drift", tieBreakConfusionDrift);
  const officeSumDrift = clone(artifact);
  officeSumDrift.invariants.pairs[0].officeSum = "5";
  expectRejection("invariant office-sum drift", officeSumDrift);
  const statusSharedFlip = clone(artifact);
  statusSharedFlip.invariants.allStatusShared = false;
  expectRejection("status-sharing flip", statusSharedFlip);
  const orbitHistogramDrift = clone(artifact);
  orbitHistogramDrift.orbitalRotation.intervalHistogram = { "11": 7 };
  expectRejection("orbit interval histogram drift", orbitHistogramDrift);
  const orbitEdgeDrift = clone(artifact);
  orbitEdgeDrift.orbitalRotation.perEdge[0].rotateInterval = 10;
  expectRejection("orbit per-edge interval drift", orbitEdgeDrift);
  const hubDrift = clone(artifact);
  hubDrift.direction.uniqueHub.resolved = 3;
  expectRejection("unique-hub count drift", hubDrift);
  const icDrift = clone(artifact);
  icDrift.battery.candidates.find((entry) => entry.id === "C-M6").satelliteIcVectors = ["6,5,4,3,2,1"];
  expectRejection("IC vector drift", icDrift);
  const branchDrift = clone(artifact);
  branchDrift.branch.label = "FULL_DERIVATION";
  expectRejection("branch label drift", branchDrift);
  const gateDrift = clone(artifact);
  gateDrift.gates["V-D7-2"].result = "PASS";
  expectRejection("selection gate flip", gateDrift);
  const bindingDrift = clone(artifact);
  bindingDrift.sourceBindings[0].sha256 = "0".repeat(64);
  expectRejection("source binding sha drift", bindingDrift);
  const fenceDrift = clone(artifact);
  fenceDrift.fences.d7HypothesisTier = "unfenced";
  expectRejection("D7 fence drift", fenceDrift);
  const accountingDrift = clone(artifact);
  accountingDrift.accounting.masksOnly = [];
  expectRejection("accounting tier emptying", accountingDrift);

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
  const stripProbes = ["deriveDomain", "hamming12", "rotateMask12", "maskOfRow", "pitchSet"];
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

  const mutationProbes = [
    "domain per-anchor count drift", "domain size drift", "multiplicity drift", "calibration uniform flip",
    "recorded count flip", "remainder delta drift", "near-miss confusion drift", "battery verdict promotion",
    "distribution drift", "near-miss miss swap", "near-miss block confusion drift", "tie-break promotion",
    "tie-break confusion drift", "invariant office-sum drift", "status-sharing flip", "orbit interval histogram drift",
    "orbit per-edge interval drift", "unique-hub count drift", "IC vector drift", "branch label drift",
    "selection gate flip", "source binding sha drift", "D7 fence drift", "accounting tier emptying",
    ...staticProbes.map(([label]) => label),
    ...stripProbes.map((token) => `presence-strip: ${token}`),
  ];

  console.log(JSON.stringify({
    artifact: ARTIFACT_PATH,
    status: "PASS",
    derivationFingerprint: artifact.derivationFingerprint,
    chainFingerprints: { bl068: BL068_FINGERPRINT },
    domain: `${artifact.domainDerivation.domainSize} instances, per-anchor ${artifact.domainDerivation.perAnchor.map((entry) => entry.count).join("/")}`,
    battery: artifact.battery.candidates.map((candidate) => `${candidate.id}:${candidate.observedVerdict}`),
    nearMiss: `${artifact.nearMiss.confusion.tp}/${artifact.nearMiss.confusion.fp}/${artifact.nearMiss.confusion.fn}/${artifact.nearMiss.confusion.tn}`,
    tieBreak: `${artifact.tieBreakCandidate.confusion.tp}/${artifact.tieBreakCandidate.confusion.fp}/${artifact.tieBreakCandidate.confusion.fn}/${artifact.tieBreakCandidate.confusion.tn} ${artifact.tieBreakCandidate.status}`,
    branch: artifact.branch.label,
    gates: artifact.branch.gateResults,
    mutationProbes: mutationProbes.length,
    probeStaticRejections: staticRejections,
  }, null, 2));
}

validate();
