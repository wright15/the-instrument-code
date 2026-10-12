#!/usr/bin/env node
/**
 * Validate the generated BL-078 D7 re-test against its sources.
 *
 * Independent of the generator: re-reads the 462-record ledger, the network,
 * the containment mesh, the landed BL-068 and BL-070 artifacts and the Gate 3
 * receipt; re-derives the domain verification, the R-OFF calibration, all nine
 * battery tables, the side-by-side comparison, the near-miss anatomy, the
 * combination candidate, the invariants, the orbit rotation intervals and the
 * branch classification; re-checks the artifact fingerprint; statically
 * verifies the generator's region-scoped isolation (forbidden reads absent
 * from the intrinsic region; the comparison region's office reads present -
 * the region-scoping proof; a permissive probe passes; a proof-strip probe is
 * rejected); and runs mutation probes (artifact drift, smuggled reads,
 * presence-strip). Fail-loud.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..", "..");

const ARTIFACT_PATH = "orrery/src/generated/bl078-d7-retest.v1.json";
const GENERATOR_PATH = "scripts/build-bl078-d7-retest.mjs";
const SCHEMA_VERSION = "harmonic-orrery.bl078-d7-retest.v1";
const RETEST_ID = "BL078_D7_RETEST_V1";
const LEDGER_PATH = "canonical/universal-heptatonic-ledger.csv";
const NETWORK_PATH = "canonical/universal-network-data.json";
const MESH_PATH = "derived/hypergraph/bipartite-inclusion-v1.json";
const BL068_PATH = "orrery/src/generated/bl068-d7-asymmetry.v1.json";
const BL070_PATH = "orrery/src/generated/bl070-d7-derivation.v1.json";
const GATE3_PATH = "qa/d4-r2-execution-receipt.json";

const BL068_FINGERPRINT = "b0d65bd6149978de4f5ef3f1a0b281d0f6324a81114e8aa9da07eda8ef5ef849";
const BL070_FINGERPRINT = "9db10a088a05664a5cf60f6fad14514a4fc9aab278dcf0359d684bce70607731";

const NON_Z_D_FAMILIES = ["7-1", "7-15", "7-22", "7-8"];
const Z_D_FAMILIES = ["7-Z12", "7-Z17", "7-Z37"];
const D_TIER_FAMILIES = [...NON_Z_D_FAMILIES, ...Z_D_FAMILIES];

function fail(message) {
  throw new Error(`INVALID_BL078_D7_RETEST: ${message}`);
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
  if (matrix.tp === 0 && matrix.fp === 22 && matrix.fn === 14 && matrix.tn === 0) return "ANTI_SEPARATING";
  return "NON_SEPARATING";
}

const isClean = (matrix) => matrix.tp === 14 && matrix.fp === 0 && matrix.fn === 0 && matrix.tn === 22;

// ---------------------------------------------------------------------------
// Independent re-derivation
// ---------------------------------------------------------------------------

function reDerive(sources) {
  const { ledgerRows, network, mesh, bl068, bl070, gate3 } = sources;
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

  // calibration of the reach
  const allLedgerReach = anchorRows.map((row) => {
    const anchor = String(row.id);
    return { anchor, count: ledgerRows.filter((other) => String(other.id) !== anchor && hamming12(masks.get(anchor), masks.get(String(other.id))) === 2).length };
  });
  if (allLedgerReach.some((entry) => entry.count !== 30)) fail("all-ledger reach not uniform at 30");
  const d6TierReach = anchorRows.map((row) => {
    const anchor = String(row.id);
    return { anchor, count: ledgerRows.filter((other) => other.tier === "D6" && hamming12(masks.get(anchor), masks.get(String(other.id))) === 2).length };
  });

  // the landed recorded relation (ground truth from the network)
  const contactKeys = network.d7SeatContactRows.map((row) => `${String(row.target)}:${String(row.source)}`).sort((left, right) => {
    const [la, ls] = left.split(":").map(Number);
    const [ra, rs] = right.split(":").map(Number);
    return la - ra || ls - rs;
  });
  if (contactKeys.length !== 14) fail("contact census drift");
  const actualSet = new Set(contactKeys);
  const officeEqualKeys = instanceKeys.filter((key) => officeByState.get(key.split(":")[0]) === officeByState.get(key.split(":")[1]));
  if (canonicalText(contactKeys) !== canonicalText(officeEqualKeys)) {
    fail("recorded subset is not set-equal to the seat-contact rows");
  }
  const deltaCounts = {};
  for (const key of instanceKeys.filter((key) => !actualSet.has(key))) {
    const [anchor, satellite] = key.split(":");
    const delta = String(((officeIndexByState.get(satellite) - officeIndexByState.get(anchor)) + 7) % 7);
    deltaCounts[delta] = (deltaCounts[delta] ?? 0) + 1;
  }
  if (canonicalText(deltaCounts) !== canonicalText({ "2": 11, "5": 11 })) fail("delta structure drift");

  // landed domain comparisons
  const sortKey = (left, right) => {
    const [la, ls] = left.split(":").map(Number);
    const [ra, rs] = right.split(":").map(Number);
    return la - ra || ls - rs;
  };
  const bl068Keys = bl068.census.availabilityDomain.perAnchor
    .flatMap((entry) => entry.instances.map((instance) => instance.key))
    .sort(sortKey);
  const bl070Keys = bl070.domainDerivation.perAnchor
    .flatMap((entry) => entry.instances.map((satellite) => `${entry.anchor}:${satellite}`))
    .sort(sortKey);
  const bl068SetEqual = canonicalText(bl068Keys) === canonicalText(instanceKeys);
  const bl070SetEqual = canonicalText(bl070Keys) === canonicalText(instanceKeys);
  if (!bl068SetEqual) fail("derived domain not set-equal to the BL-068 availability domain");
  if (!bl070SetEqual) fail("derived domain not set-equal to the BL-070 derived domain");

  // calibration R-OFF
  const rOffPredicate = (key) => {
    const [anchor, satellite] = key.split(":");
    return officeByState.get(anchor) === officeByState.get(satellite);
  };
  const calibrationConfusion = confusion(instanceKeys, actualSet, rOffPredicate);
  if (!isClean(calibrationConfusion)) fail("calibration drift: R-OFF is not clean on the verified domain");

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

  // battery (verbatim C-M1..C-M9)
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
      const matrix = confusion(instanceKeys, actualSet, subRule.predicate);
      return { name: subRule.name, confusion: matrix, verdict: verdictOf(matrix) };
    });
    const observedVerdict = subRules.some((subRule) => subRule.verdict === "CLEAN_SPLIT")
      ? "CLEAN_SPLIT"
      : subRules.some((subRule) => subRule.verdict === "NEAR_MISS_BOUNDARY")
        ? "NEAR_MISS_BOUNDARY"
        : subRules.some((subRule) => subRule.verdict === "ANTI_SEPARATING")
          ? "ANTI_SEPARATING"
          : "NON_SEPARATING";
    return { id: definition.id, expectedVerdict: definition.expected, observedVerdict, expectationHeld: observedVerdict === definition.expected, subRules };
  });
  const cleanSplitCount = battery.filter((entry) => entry.observedVerdict === "CLEAN_SPLIT").length;
  const nearMissCandidates = battery.filter((entry) => entry.observedVerdict === "NEAR_MISS_BOUNDARY").map((entry) => entry.id);
  const expectationsHeld = battery.filter((entry) => entry.expectationHeld).length;

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
    Object.fromEntries(Object.entries(defs).map(([name, valueOf]) => [name, histogram(instanceKeys, actualSet, valueOf)])),
  ]));

  // near-miss
  const nearMissSelected = instanceKeys.filter((key) => factByKey.get(key).dPcSum === 1);
  const nearMissMissed = instanceKeys.filter((key) => actualSet.has(key) && factByKey.get(key).dPcSum !== 1);
  if (nearMissSelected.length !== 12 || canonicalText(nearMissMissed) !== canonicalText(["127:253", "4033:2017"])) {
    fail("near-miss anatomy drift");
  }
  const nearMissConfusion = confusion(instanceKeys, actualSet, (key) => factByKey.get(key).dPcSum === 1);

  // combination
  const combinationConfusion = confusion(instanceKeys, actualSet, (key) => factByKey.get(key).dPcSum === 1 || factByKey.get(key).parentCount === 1);
  if (!isClean(combinationConfusion)) fail("combination candidate is not clean");

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

  // IC vectors
  const anchorIcVectors = sortedUnique(anchorIds.map((anchor) => canonicalText(icVectorOfMask(masks.get(anchor)))));
  const satelliteIcVectors = sortedUnique(satelliteIds.map((satellite) => canonicalText(icVectorOfMask(masks.get(satellite)))));

  // state censuses
  const cM4StateCensus = distinctStates.map((state) => ({ state, office: officeByState.get(state), sign: signOfMask(masks.get(state)) }));
  const cM9StateCensus = distinctStates.map((state) => ({ state, parentCount: parentCounts.get(state), multiplicity: parentCounts.get(state) }));

  // whole-pair closure
  const partnerOf = new Map();
  for (const [left, right] of inversionPairs) { partnerOf.set(left, right); partnerOf.set(right, left); }
  const closed = (stateSet) => [...stateSet].every((state) => stateSet.has(partnerOf.get(state)));
  const statesWhere = (predicate) => new Set(instanceKeys.filter((key) => predicate(factByKey.get(key))).map((key) => key.split(":")[1]));
  const closure = {
    nearMiss: closed(new Set(nearMissSelected.map((key) => key.split(":")[1]))),
    combination: closed(statesWhere((fact) => fact.dPcSum === 1 || fact.parentCount === 1)),
    zMajority: closed(statesWhere((fact) => fact.sign < 0)),
    reachCensusOne: closed(statesWhere((fact) => fact.parentCount === 1)),
    reachCensusTwo: closed(statesWhere((fact) => fact.parentCount === 2)),
    domain: closed(new Set(distinctStates)),
  };
  if (Object.values(closure).some((value) => value !== true)) fail("whole-pair closure drift");

  // comparison recomputation (vs the landed BL-070 battery and BL-068 axes)
  const sideBySide = bl070.battery.candidates.map((original) => {
    const retest = battery.find((candidate) => candidate.id === original.id);
    const subRuleMatches = original.subRules.map((originalRule) => {
      const retestRule = retest.subRules.find((subRule) => subRule.name === originalRule.name);
      const match = canonicalText(retestRule.confusion) === canonicalText(originalRule.confusion)
        && retestRule.verdict === originalRule.verdict;
      return {
        name: originalRule.name,
        originalConfusion: originalRule.confusion,
        retestConfusion: retestRule.confusion,
        match,
      };
    });
    const verdictMatch = retest.observedVerdict === original.observedVerdict;
    const distributionMatch = canonicalText(recomputedDistributions[original.id]) === canonicalText(original.distributions);
    return {
      id: original.id,
      originalVerdict: original.observedVerdict,
      retestVerdict: retest.observedVerdict,
      verdictMatch,
      distributionMatch,
      subRuleMatches,
      match: verdictMatch && distributionMatch && subRuleMatches.every((entry) => entry.match),
    };
  });
  const domainComparison = {
    bl068SetEqual,
    bl070SetEqual,
    perAnchorMatch: canonicalText(perAnchor.map((entry) => ({ anchor: entry.anchor, count: entry.count })))
      === canonicalText(bl070.domainDerivation.perAnchor.map((entry) => ({ anchor: entry.anchor, count: entry.count }))),
    domainSizeMatch: instanceKeys.length === bl070.domainDerivation.domainSize,
    distinctStatesMatch: distinctStates.length === bl070.domainDerivation.distinctStates,
    multiplicityMatch: canonicalText(multiplicityBuckets) === canonicalText(bl070.domainDerivation.multiplicity),
  };
  const nearMissComparison = {
    confusionMatch: canonicalText(bl070.nearMiss.confusion) === canonicalText(nearMissConfusion),
    selectedMatch: canonicalText(bl070.nearMiss.selectedKeys) === canonicalText(nearMissSelected),
    missedMatch: canonicalText(bl070.nearMiss.missedKeys.map((miss) => miss.key)) === canonicalText(nearMissMissed),
  };
  const combinationComparison = {
    confusionMatch: canonicalText(bl070.tieBreakCandidate.confusion) === canonicalText(combinationConfusion),
  };
  const bl068ZAxis = bl068.axes.find((axis) => axis.axis === "zInterface");
  const cM4Confusion = battery.find((entry) => entry.id === "C-M4").subRules[0].confusion;
  const landedAxesCheck = {
    zInterface: {
      bl068Confusion: bl068ZAxis.confusion,
      retestConfusion: cM4Confusion,
      match: canonicalText(bl068ZAxis.confusion) === canonicalText(cM4Confusion),
    },
  };
  const allMatch = sideBySide.every((entry) => entry.match)
    && Object.values(domainComparison).every((value) => value === true)
    && nearMissComparison.confusionMatch && nearMissComparison.selectedMatch && nearMissComparison.missedMatch
    && combinationComparison.confusionMatch
    && landedAxesCheck.zInterface.match;
  const comparisonVerdict = allMatch ? "REPLICATED" : "DIVERGED";

  const branchLabel = cleanSplitCount > 0 ? "FULL_DERIVATION" : "PARTIAL_DERIVATION";
  const interpretationBranch = cleanSplitCount === 0 ? "R_NONE" : "R_CLEAN";

  return {
    sources: { ledgerRows, network, mesh, bl068, bl070, gate3 },
    anchorIds, satelliteIds, class72Ids, perAnchor, instanceKeys, distinctStates,
    parentCounts, multiplicityBuckets, allLedgerReach, d6TierReach, actualSet, deltaCounts,
    bl068SetEqual, bl070SetEqual, calibrationConfusion,
    factByKey, battery, cleanSplitCount, nearMissCandidates, expectationsHeld,
    nearMissSelected, nearMissMissed, nearMissConfusion,
    recomputedDistributions, combinationConfusion, invariantPairs, orbitPerEdge, intervalHistogram,
    uniqueHubKeys, anchorIcVectors, satelliteIcVectors, cM4StateCensus, cM9StateCensus,
    sideBySide, domainComparison, nearMissComparison, combinationComparison, landedAxesCheck,
    allMatch, comparisonVerdict, branchLabel, interpretationBranch,
  };
}

// ---------------------------------------------------------------------------
// Artifact checks
// ---------------------------------------------------------------------------

function checkAgainstSources(artifact, derived) {
  const {
    anchorIds, satelliteIds, perAnchor, instanceKeys, distinctStates,
    multiplicityBuckets, allLedgerReach, d6TierReach, actualSet, deltaCounts,
    bl068SetEqual, bl070SetEqual, calibrationConfusion,
    battery, cleanSplitCount, nearMissCandidates, expectationsHeld,
    nearMissSelected, nearMissMissed, nearMissConfusion,
    recomputedDistributions, combinationConfusion, invariantPairs, orbitPerEdge, intervalHistogram,
    uniqueHubKeys, anchorIcVectors, satelliteIcVectors, cM4StateCensus, cM9StateCensus,
    sideBySide, domainComparison, nearMissComparison, combinationComparison, landedAxesCheck,
    allMatch, comparisonVerdict, branchLabel, interpretationBranch,
  } = derived;

  if (artifact.schemaVersion !== SCHEMA_VERSION || artifact.retestId !== RETEST_ID) fail("artifact header drift");
  if (artifact.status !== "planning_evidence") fail("status drift");
  if (artifact.generator !== "scripts/build-bl078-d7-retest.mjs") fail("generator path drift");

  // source bindings
  const bindingPaths = artifact.sourceBindings.map((binding) => binding.artifact);
  if (canonicalText(sortedUnique(bindingPaths)) !== canonicalText(sortedUnique([
    LEDGER_PATH, NETWORK_PATH, MESH_PATH, BL068_PATH, BL070_PATH, GATE3_PATH,
  ]))) fail("source binding set drift");
  for (const binding of artifact.sourceBindings) {
    if (binding.sha256 !== fileSha(binding.artifact)) fail(`source binding sha drift: ${binding.artifact}`);
  }

  // chain anchors
  if (artifact.base.bl068.artifact !== BL068_PATH) fail("base BL-068 path drift");
  if (artifact.base.bl068.derivationFingerprint !== BL068_FINGERPRINT) fail("base BL-068 fingerprint literal drift");
  if (artifact.base.bl070.artifact !== BL070_PATH) fail("base BL-070 path drift");
  if (artifact.base.bl070.derivationFingerprint !== BL070_FINGERPRINT) fail("base BL-070 fingerprint literal drift");
  const { derivationFingerprint: bl068Fingerprint, ...bl068Core } = derived.sources.bl068;
  if (sha256(canonicalText(bl068Core)) !== bl068Fingerprint || bl068Fingerprint !== BL068_FINGERPRINT) fail("BL-068 chain fingerprint drift");
  const { derivationFingerprint: bl070Fingerprint, ...bl070Core } = derived.sources.bl070;
  if (sha256(canonicalText(bl070Core)) !== bl070Fingerprint || bl070Fingerprint !== BL070_FINGERPRINT) fail("BL-070 chain fingerprint drift");
  if (derived.sources.gate3.status !== "execution_verified") fail("Gate 3 receipt status drift");

  // pre-registration
  const rulingIds = artifact.preRegistration.rulings.map((ruling) => ruling.id);
  if (canonicalText(rulingIds) !== canonicalText(["OD-N0", "OD-N1", "OD-N2", "OD-N3"])) fail("ruling inventory drift");
  if (canonicalText(artifact.preRegistration.branchCriteria) !== canonicalText(artifact.branch.criteria)) fail("branch criteria drift");
  if (!artifact.preRegistration.comparisonCriteria.replicated || !artifact.preRegistration.comparisonCriteria.diverged) {
    fail("comparison criteria drift");
  }

  // domain verification
  const domain = artifact.domainVerification;
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
  if (domain.setEquality.bl068SetEqual !== bl068SetEqual || domain.setEquality.bl070SetEqual !== bl070SetEqual) {
    fail("domain set-equality flag drift");
  }
  if (domain.setEquality.bl068DomainSize !== 36 || domain.setEquality.bl070DomainSize !== 36) fail("landed domain size drift");
  if (domain.setEquality.contactsSubsetOfDerivedDomain !== true) fail("contacts-subset flag drift");
  if (domain.recordedRelation.recordedCount !== 14 || domain.recordedRelation.unrecordedCount !== 22) fail("recorded/unrecorded totals drift");
  if (canonicalText(domain.recordedRelation.deltaCounts) !== canonicalText(deltaCounts)) fail("delta counts drift");
  if (!domain.nonCircularity.includes("no office")) fail("domain non-circularity statement drift");

  // calibration
  if (artifact.calibration.rule.id !== "R-OFF") fail("calibration rule id drift");
  if (artifact.calibration.actualRelation.count !== 14) fail("calibration actual-relation count drift");
  if (canonicalText(artifact.calibration.confusion) !== canonicalText(calibrationConfusion)) fail("calibration confusion drift");
  if (artifact.calibration.verdict !== "CLEAN_SPLIT") fail("calibration verdict drift");
  if (artifact.calibration.exact !== true) fail("calibration exact flag drift");
  if (!artifact.calibration.licence.includes("domain would be wrong, not the rule")) fail("calibration licence drift");

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
  if (artifact.battery.summary.expectationsHeld !== expectationsHeld) fail("expectations-held count drift");
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

  // combination
  if (artifact.combination.id !== "C-TB-R1") fail("combination id drift");
  if (canonicalText(artifact.combination.confusion) !== canonicalText(combinationConfusion)) fail("combination confusion drift");
  if (!isClean(combinationConfusion)) fail("combination is not clean");
  if (artifact.combination.status !== "UNPROMOTED_DISCOVERY") fail("combination status drift (must stay un-promoted)");
  if (!artifact.combination.branchEffect.startsWith("none")) fail("combination branch effect drift");
  if (!artifact.combination.mechanism.includes("separation is not derivation")) fail("combination mechanism note drift");

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

  // comparison
  if (canonicalText(artifact.comparison.baseline.bl068.axes) !== canonicalText(derived.sources.bl068.axes.map((axis) => ({
    axis: axis.axis, rule: axis.rule, verdict: axis.verdict, confusion: axis.confusion,
  })))) fail("baseline BL-068 axes drift");
  if (artifact.comparison.baseline.bl068.derivationFingerprint !== BL068_FINGERPRINT) fail("baseline BL-068 fingerprint drift");
  if (artifact.comparison.baseline.bl070.derivationFingerprint !== BL070_FINGERPRINT) fail("baseline BL-070 fingerprint drift");
  if (artifact.comparison.baseline.bl070.branch !== derived.sources.bl070.branch.label) fail("baseline BL-070 branch drift");
  if (artifact.comparison.baseline.bl070.cleanSplitCount !== derived.sources.bl070.battery.summary.cleanSplitCount) fail("baseline clean-split count drift");
  if (canonicalText(artifact.comparison.domainComparison) !== canonicalText(domainComparison)) fail("domain comparison drift");
  if (canonicalText(artifact.comparison.sideBySide) !== canonicalText(sideBySide)) fail("side-by-side comparison drift");
  if (canonicalText(artifact.comparison.nearMissComparison) !== canonicalText(nearMissComparison)) fail("near-miss comparison drift");
  if (artifact.comparison.combinationComparison.confusionMatch !== combinationComparison.confusionMatch) fail("combination comparison drift");
  if (canonicalText(artifact.comparison.landedAxesCheck) !== canonicalText(landedAxesCheck)) fail("landed axes check drift");
  if (artifact.comparison.allMatch !== allMatch) fail("comparison all-match flag drift");
  if (artifact.comparison.verdict !== comparisonVerdict) fail("comparison verdict drift");
  if (!artifact.comparison.interpretation.startsWith(`${comparisonVerdict}:`)) fail("comparison interpretation prefix drift");
  if (!artifact.comparison.replicationDiscipline.includes("a different result means the candidates changed")) {
    fail("replication discipline statement drift");
  }

  // isolation
  if (artifact.isolation.regime !== "region-scoped") fail("isolation regime drift");
  if (artifact.isolation.officeBytesInDerivationPath !== 0) fail("isolation office-byte count drift");
  if (artifact.isolation.officeReads.length < 4) fail("isolation office-read inventory drift");
  if (!artifact.isolation.statements.some((statement) => statement.includes("zero granted-office bytes"))) {
    fail("isolation zero-office statement drift");
  }
  if (!artifact.isolation.validatorDiscipline.includes("permissive probe")) fail("isolation validator-discipline drift");

  // gates and branch
  if (artifact.gates["V-D7D-1"].result !== "PASS" || artifact.gates["V-D7D-2"].result !== "PASS" ||
      artifact.gates["V-D7D-3"].result !== (cleanSplitCount > 0 ? "PASS" : "FAIL") ||
      artifact.gates["V-D7D-4"].result !== "PASS" || artifact.gates["V-D7D-5"].result !== "PASS") fail("gate result drift");
  if (artifact.branch.label !== branchLabel || branchLabel !== "PARTIAL_DERIVATION") fail("branch label drift");
  if (canonicalText(artifact.branch.preRegisteredLabels) !== canonicalText(["FULL_DERIVATION", "PARTIAL_DERIVATION", "NO_DERIVATION"])) {
    fail("pre-registered branch labels drift");
  }
  if (canonicalText(artifact.branch.gateResults) !== canonicalText({
    "V-D7D-1": "PASS", "V-D7D-2": "PASS", "V-D7D-3": "FAIL", "V-D7D-4": "PASS", "V-D7D-5": "PASS",
  })) fail("branch gate results drift");
  if (!artifact.branch.statement.includes("office-field-dependent")) fail("branch statement drift");
  if (!artifact.branch.statement.includes(comparisonVerdict)) fail("branch statement replication clause drift");
  if (artifact.interpretation.branch !== interpretationBranch || interpretationBranch !== "R_NONE") fail("interpretation branch drift");
  if (!artifact.interpretation.statement.includes("joins the anchoring remainder")) fail("interpretation statement drift");

  // accounting
  if (artifact.accounting.masksOnly.length < 4 || artifact.accounting.canonicalComputation.length < 6 ||
      artifact.accounting.remainingGranted.length < 3) fail("accounting tier inventory drift");
  if (!artifact.accounting.statement.includes("office field remains the selection's ground")) fail("accounting statement drift");

  // fences
  if (!artifact.fences.d7HypothesisTier.includes("2703-2712")) fail("D7 fence anchor drift");
  if (!artifact.fences.membrane.includes("never a probe input")) fail("membrane fence drift");
  if (!artifact.fences.officeIsolation.includes("target, never an input")) fail("office-isolation fence drift");
  if (!artifact.fences.officeIsolation.includes("halt")) fail("office-isolation halt clause drift");
  if (!artifact.fences.retestScope.includes("BL-070's bytes are frozen")) fail("retest-scope fence drift");
  if (artifact.notAccomplished.length !== 7) fail("notAccomplished inventory drift");
  if (!artifact.notAccomplished.some((item) => item.includes("no BL-070 bytes changed"))) fail("no-BL-070-writes item drift");
  if (artifact.contractCitations.length < 10) fail("contract citation inventory drift");
}

// ---------------------------------------------------------------------------
// Static generator checks (region-scoped)
// ---------------------------------------------------------------------------

function staticIntrinsicCheck(sourceText) {
  const begin = sourceText.indexOf("INTRINSIC-RETEST-BEGIN");
  const end = sourceText.indexOf("INTRINSIC-RETEST-END");
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
  // region-scoping proof: the comparison region must carry the office reads,
  // so a file-scoped scan (over-banning the whole file) is rejected.
  if (!/officeIndex/.test(comparison)) fail("region-scoping proof failed: the comparison region does not read the office index");
  if (!/d7SeatContactRows/.test(comparison)) fail("region-scoping proof failed: the comparison region does not read the network records");
  const required = ["ledgerRows", "pitchSet", "hamming12", "rotateMask12", "maskOfRow", "deriveDomain", "deriveInstanceFacts", "buildMaskGeometricPredicates"];
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
  expectRejection("calibration uniform flip", reachFlip);
  const recordedFlip = clone(artifact);
  recordedFlip.domainVerification.recordedRelation.recordedCount = 13;
  expectRejection("recorded count flip", recordedFlip);
  const deltaDrift = clone(artifact);
  deltaDrift.domainVerification.recordedRelation.deltaCounts = { "2": 12, "5": 10 };
  expectRejection("remainder delta drift", deltaDrift);
  const bl068FlagFlip = clone(artifact);
  bl068FlagFlip.domainVerification.setEquality.bl068SetEqual = false;
  expectRejection("BL-068 set-equality flag flip", bl068FlagFlip);
  const bl070FlagFlip = clone(artifact);
  bl070FlagFlip.domainVerification.setEquality.bl070SetEqual = false;
  expectRejection("BL-070 set-equality flag flip", bl070FlagFlip);
  const calibrationConfusionDrift = clone(artifact);
  calibrationConfusionDrift.calibration.confusion.fn = 1;
  expectRejection("calibration confusion drift", calibrationConfusionDrift);
  const calibrationExactFlip = clone(artifact);
  calibrationExactFlip.calibration.exact = false;
  expectRejection("calibration exact flip", calibrationExactFlip);
  const cM3ConfusionDrift = clone(artifact);
  cM3ConfusionDrift.battery.candidates.find((entry) => entry.id === "C-M3").subRules.find((entry) => entry.name === "absPcSumDeltaOne").confusion.tp = 13;
  expectRejection("near-miss confusion drift", cM3ConfusionDrift);
  const verdictPromotion = clone(artifact);
  verdictPromotion.battery.candidates.find((entry) => entry.id === "C-M1").observedVerdict = "CLEAN_SPLIT";
  expectRejection("battery verdict promotion", verdictPromotion);
  const expectationFlip = clone(artifact);
  expectationFlip.battery.candidates.find((entry) => entry.id === "C-M3").expectationHeld = false;
  expectRejection("expectation-held flip", expectationFlip);
  const distributionDrift = clone(artifact);
  distributionDrift.battery.candidates.find((entry) => entry.id === "C-M9").distributions.parentCount.recorded["1"] = 3;
  expectRejection("distribution drift", distributionDrift);
  const missSwap = clone(artifact);
  missSwap.nearMiss.missedKeys[0].key = "127:191";
  expectRejection("near-miss miss swap", missSwap);
  const nearMissConfusionDrift = clone(artifact);
  nearMissConfusionDrift.nearMiss.confusion.fn = 1;
  expectRejection("near-miss block confusion drift", nearMissConfusionDrift);
  const combinationPromotion = clone(artifact);
  combinationPromotion.combination.status = "PROMOTED";
  expectRejection("combination promotion", combinationPromotion);
  const combinationConfusionDrift = clone(artifact);
  combinationConfusionDrift.combination.confusion.tn = 21;
  expectRejection("combination confusion drift", combinationConfusionDrift);
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
  const comparisonVerdictDrift = clone(artifact);
  comparisonVerdictDrift.comparison.verdict = "DIVERGED";
  expectRejection("comparison verdict flip", comparisonVerdictDrift);
  const sideBySideFlip = clone(artifact);
  sideBySideFlip.comparison.sideBySide[0].match = false;
  expectRejection("side-by-side match flip", sideBySideFlip);
  const branchDrift = clone(artifact);
  branchDrift.branch.label = "FULL_DERIVATION";
  expectRejection("branch label drift", branchDrift);
  const gateDrift = clone(artifact);
  gateDrift.gates["V-D7D-3"].result = "PASS";
  expectRejection("selection gate flip", gateDrift);
  const bindingDrift = clone(artifact);
  bindingDrift.sourceBindings[0].sha256 = "0".repeat(64);
  expectRejection("source binding sha drift", bindingDrift);
  const anchorDrift = clone(artifact);
  anchorDrift.base.bl070.derivationFingerprint = "0".repeat(64);
  expectRejection("BL-070 chain anchor drift", anchorDrift);
  const isolationByteFlip = clone(artifact);
  isolationByteFlip.isolation.officeBytesInDerivationPath = 1;
  expectRejection("isolation office-byte flip", isolationByteFlip);
  const interpretationDrift = clone(artifact);
  interpretationDrift.interpretation.branch = "R_CLEAN";
  expectRejection("interpretation branch drift", interpretationDrift);
  const fenceDrift = clone(artifact);
  fenceDrift.fences.d7HypothesisTier = "unfenced";
  expectRejection("D7 fence drift", fenceDrift);
  const retestScopeDrift = clone(artifact);
  retestScopeDrift.fences.retestScope = "superseded";
  expectRejection("retest-scope fence drift", retestScopeDrift);
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
  const stripProbes = ["deriveDomain", "hamming12", "rotateMask12", "maskOfRow", "pitchSet", "buildMaskGeometricPredicates"];
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
    "// ==== INTRINSIC-RETEST-END ====",
    "// ==== INTRINSIC-RETEST-END ==== const allowedOfficeRead = ledgerRows[0].office; void allowedOfficeRead;",
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
    "domain per-anchor count drift", "domain size drift", "multiplicity drift", "calibration uniform flip",
    "recorded count flip", "remainder delta drift", "BL-068 set-equality flag flip", "BL-070 set-equality flag flip",
    "calibration confusion drift", "calibration exact flip", "near-miss confusion drift", "battery verdict promotion",
    "expectation-held flip", "distribution drift", "near-miss miss swap", "near-miss block confusion drift",
    "combination promotion", "combination confusion drift", "invariant office-sum drift", "status-sharing flip",
    "orbit interval histogram drift", "orbit per-edge interval drift", "unique-hub count drift", "IC vector drift",
    "comparison verdict flip", "side-by-side match flip", "branch label drift", "selection gate flip",
    "source binding sha drift", "BL-070 chain anchor drift", "isolation office-byte flip", "interpretation branch drift",
    "D7 fence drift", "retest-scope fence drift", "accounting tier emptying",
    ...staticProbes.map(([label]) => label),
    ...stripProbes.map((token) => `presence-strip: ${token}`),
    "region-scoping proof strip",
  ];

  console.log(JSON.stringify({
    artifact: ARTIFACT_PATH,
    status: "PASS",
    derivationFingerprint: artifact.derivationFingerprint,
    chainFingerprints: { bl068: BL068_FINGERPRINT, bl070: BL070_FINGERPRINT },
    domain: `${artifact.domainVerification.domainSize} instances, per-anchor ${artifact.domainVerification.perAnchor.map((entry) => entry.count).join("/")}`,
    calibration: `R-OFF ${artifact.calibration.confusion.tp}/${artifact.calibration.confusion.fp}/${artifact.calibration.confusion.fn}/${artifact.calibration.confusion.tn} (${artifact.calibration.verdict})`,
    battery: artifact.battery.candidates.map((candidate) => `${candidate.id}:${candidate.observedVerdict}`),
    sideBySide: artifact.comparison.sideBySide.map((entry) => `${entry.id}:${entry.match ? "match" : "MISMATCH"}`),
    comparison: artifact.comparison.verdict,
    nearMiss: `${artifact.nearMiss.confusion.tp}/${artifact.nearMiss.confusion.fp}/${artifact.nearMiss.confusion.fn}/${artifact.nearMiss.confusion.tn}`,
    combination: `${artifact.combination.confusion.tp}/${artifact.combination.confusion.fp}/${artifact.combination.confusion.fn}/${artifact.combination.confusion.tn} ${artifact.combination.status}`,
    branch: artifact.branch.label,
    gates: artifact.branch.gateResults,
    mutationProbes: mutationProbes.length,
    probeStaticRejections: staticRejections,
    regionScopingProbes: `${regionScopingProbes} (permissive pass + proof strip rejected)`,
  }, null, 2));
}

validate();
