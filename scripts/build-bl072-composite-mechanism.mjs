#!/usr/bin/env node
/**
 * Build the BL-072 composite-mechanism investigation: why does the
 * min-|delta| + reach-census composite (C-TB-1) separate the D7 contact
 * relation (14/0/0/22) when the nine pre-registered single-axis candidates
 * all fail (cleanSplitCount 0). Planning, read-only analysis.
 *
 * The question (approved planning pass, rulings OD-72-1..OD-72-6): the
 * composite [|ΔpcSum| = 1] ∨ [reach-singleton] selects exactly the 14
 * recorded contacts masks-only (BL-070; replicated BL-078). Its mechanism is
 * unexplained. This investigation characterizes the mechanism - or
 * characterizes why it resists explanation - through four pre-registered,
 * non-exclusive hypotheses:
 *
 *   H-Geometric     the composite captures an orbit-geometry property (the
 *                   D7 modal orbit's reach-window ladder); the terminal
 *                   windows localize the reach-singletons; test: map the
 *                   selection onto the landed orbit structure
 *   H-Informational the composite captures a domain property (class purity);
 *                   test: apply the two terms to the class-mixed fa-pole
 *                   domain (BL-055 table28, fingerprint 6d11fd93...) as a
 *                   descriptive read (OD-72-1); no fa-pole reach census is
 *                   constructed - Term-B reports NOT-APPLICABLE
 *   H-Artifact      the separation is a randomization artifact; test: the
 *                   pre-registered fixed-margin label permutation (N=1000,
 *                   seed 72072) with the verbatim selection-effect
 *                   disclosure (OD-72-2)
 *   H-Primitive     the separation is real but axiomatic - the composite is
 *                   the minimal description within the pre-registered
 *                   language (nine canonical landed single-axis predicates +
 *                   all 36 pairwise disjunctions; OD-72-4); minimality is
 *                   language-relative and does not close the mechanism
 *                   question (OD-72-6)
 *
 * Structure:
 *   grounding       - the census grounding base re-read and matched: the
 *                     36-instance domain (set-equal BL-070), the 14
 *                     contacts, the near-miss, the composite's landed
 *                     confusion; any mismatch is a halt
 *   propertyTable   - the full 36-instance property table (mask, pcSum,
 *                     displacement, Hamming, reach census, class, office,
 *                     chirality/orientation, containment sign, status, the
 *                     composite's per-term selection)
 *   perTerm         - the two terms separately and jointly: confusions,
 *                     overlap (disjoint), residual, whole-pair respect
 *   permutation     - the pre-registered counterfactual baseline and the
 *                     H-Artifact verdict
 *   geometricMapping- the orbit-window ladder, terminal localization,
 *                     inversion symmetry, the closure alignment, and the
 *                     cited A0-P7 context (OD-72-5)
 *   crossDomain     - the fa-pole descriptive read (H-Informational)
 *   minimality      - the exhaustive 9 + 36 enumeration (H-Primitive)
 *   verdictSet      - the four non-exclusive verdicts with evidence
 *   gslTreatment    - per OD-72-6: GSL-4 annotated refinement + the GSL-7
 *                     candidate draft (un-promoted); no admission
 *
 * Fences: planning_evidence only. No new measurement (the census artifact is
 * the grounding base; the analysis reads it and the landed BL-055 table).
 * D7 hypothesis-tier throughout (no D7 claim event, no D7 record amendment,
 * no D7 derivation admission; ENTRY 15's D7 clause carries forward). No
 * claim event; no record amendment; no GOverns admission; no G1 movement;
 * no INV-5 graduation; no M-walkability promotion; no canonical/Court/
 * schema/Neo4j writes. C-TB-1's status is unchanged (UNPROMOTED_DISCOVERY);
 * the mechanism question is characterized, not closed. The frame
 * (scrum/plan/harmonic-comprehension-map.md sections 2.6/2.7) is
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

export const SCHEMA_VERSION = "harmonic-orrery.bl072-composite-mechanism.v1";
export const INVESTIGATION_ID = "BL072_COMPOSITE_MECHANISM_V1";
export const OUTPUT_PATH = "orrery/src/generated/bl072-composite-mechanism.v1.json";
export const NETWORK_PATH = "canonical/universal-network-data.json";
export const LEDGER_PATH = HEPTATONIC_LEDGER_PATH;
export const MESH_PATH = BIPARTITE_PATH;
export const BL068_PATH = "orrery/src/generated/bl068-d7-asymmetry.v1.json";
export const BL070_PATH = "orrery/src/generated/bl070-d7-derivation.v1.json";
export const BL071_PATH = "orrery/src/generated/bl071-interval-6-structure.v1.json";
export const BL055_PATH = "orrery/src/generated/d4-selection-review.v1.json";

export const NON_Z_D_FAMILIES = ["7-1", "7-15", "7-22", "7-8"];
export const Z_D_FAMILIES = ["7-Z12", "7-Z17", "7-Z37"];
export const D_TIER_FAMILIES = [...NON_Z_D_FAMILIES, ...Z_D_FAMILIES];

export const PERMUTATION_N = 1000;
export const PERMUTATION_SEED = 72072;
export const DISCLOSURE =
  "C-TB-1 was discovered by searching the composite space, not pre-registered — the permutation p-value is conditional on C-TB-1's selection from the search and should be interpreted as a lower bound, not as an independent confirmation.";

// ==== INTRINSIC-MECHANISM-BEGIN (ledger role/tier partition + masks + mesh only) ====
// This region builds the domain, the mask-geometric instance facts, and the
// eight intrinsic canonical predicate definitions (P1..P6, P8, P9). It reads
// the canonical ledger's role/tier partition, the pitch sets, and the
// containment mesh. It never reads the office field, the class label, the
// orientation label, the network's records, or any landed verdict. The
// comparison region (after the marker) reads those as labelled targets.

function cmp(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
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
  while (x !== 0) { count += x & 1; x >>= 1; }
  return count;
}

export function rotateMask12(mask, d) {
  const shift = ((d % 12) + 12) % 12;
  if (shift === 0) return mask & 4095;
  return (((mask << shift) & 4095) | (mask >> (12 - shift))) & 4095;
}

export function rotationRelations(a, b) {
  const hits = [];
  for (let d = 1; d <= 11; d += 1) if (rotateMask12(a, d) === b) hits.push(d);
  return hits;
}

export function invertMask12(mask) {
  let result = 0;
  for (let pitch = 0; pitch < 12; pitch += 1) {
    if ((mask >> pitch) & 1) result |= 1 << ((12 - pitch) % 12);
  }
  return result;
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

export function singlePitchDisplacement(anchorPitches, satellitePitches) {
  const anchorSet = new Set(anchorPitches);
  const satelliteSet = new Set(satellitePitches);
  const removed = anchorPitches.filter((pitch) => !satelliteSet.has(pitch));
  const added = satellitePitches.filter((pitch) => !anchorSet.has(pitch));
  if (removed.length !== 1 || added.length !== 1) {
    fail(`displacement: not a single-pitch swap (removed ${removed.length}, added ${added.length})`);
  }
  const raw = (added[0] - removed[0] + 12) % 12;
  return { removed: removed[0], added: added[0], raw, linear: raw > 6 ? raw - 12 : raw };
}

export function deriveDomain(ledgerRows) {
  const anchorRows = ledgerRows
    .filter((row) => row.tier === "D7" && row.role === "anchor")
    .sort((left, right) => cmp(Number(left.id), Number(right.id)));
  const satelliteRows = ledgerRows
    .filter((row) => row.tier === "D6" && row.role === "satellite")
    .sort((left, right) => cmp(Number(left.id), Number(right.id)));
  if (anchorRows.length !== 7 || satelliteRows.length !== 14) {
    fail(`D7/D6 partition census drift: ${anchorRows.length} anchors / ${satelliteRows.length} satellites`);
  }
  const rowById = new Map(ledgerRows.map((row) => [String(row.id), row]));
  const maskById = new Map(ledgerRows.map((row) => [String(row.id), maskOfRow(row)]));
  const perAnchor = anchorRows.map((row) => {
    const anchor = String(row.id);
    const instances = satelliteRows
      .filter((satellite) => hamming12(maskById.get(anchor), maskById.get(String(satellite.id))) === 2)
      .map((satellite) => String(satellite.id))
      .sort((left, right) => cmp(Number(left), Number(right)));
    return { anchor, instances, count: instances.length };
  });
  const instanceKeys = perAnchor.flatMap((entry) => entry.instances.map((satellite) => `${entry.anchor}:${satellite}`));
  const distinctStates = sortedUnique(instanceKeys.map((key) => key.split(":")[1]));
  const parentCounts = new Map(satelliteRows.map((row) => {
    const satellite = String(row.id);
    return [satellite, perAnchor.filter((entry) => entry.instances.includes(satellite)).length];
  }));
  const multiplicity = new Map();
  for (const key of instanceKeys) {
    const state = key.split(":")[1];
    multiplicity.set(state, (multiplicity.get(state) ?? 0) + 1);
  }
  for (const state of distinctStates) {
    if (parentCounts.get(state) !== multiplicity.get(state)) {
      fail(`state ${state}: reach census and appearance multiplicity disagree`);
    }
  }
  return { anchorRows, satelliteRows, rowById, maskById, perAnchor, instanceKeys, distinctStates, parentCounts, multiplicity };
}

function familySharedCount(subnodes, pentatonicById, family) {
  let count = 0;
  for (const id of subnodes) {
    if ((pentatonicById[id]?.parentsUnrooted ?? []).includes(family)) count += 1;
  }
  return count;
}

export function signOfMask(mask, subnodesByMask, pentatonicById) {
  const subnodes = subnodesByMask.get(String(mask));
  if (!subnodes) fail(`containment mesh node missing for mask ${mask}`);
  const nonZSum = NON_Z_D_FAMILIES.reduce((sum, family) => sum + familySharedCount(subnodes, pentatonicById, family), 0);
  const zSum = Z_D_FAMILIES.reduce((sum, family) => sum + familySharedCount(subnodes, pentatonicById, family), 0);
  return nonZSum - zSum;
}

export function deriveInstanceFacts(ledgerRows, mesh) {
  const domain = deriveDomain(ledgerRows);
  const subnodesByMask = new Map(Object.values(mesh.heptatonicNodes).map((node) => [String(node.pitchMask), node.subnodes]));
  const pentatonicById = mesh.pentatonicSubnodes;
  const familiesCache = new Map();
  const familiesOfMask = (mask) => {
    const key = String(mask);
    if (!familiesCache.has(key)) {
      const subnodes = subnodesByMask.get(key);
      if (!subnodes) fail(`containment mesh node missing for mask ${mask}`);
      const families = new Set();
      for (const id of subnodes) for (const family of (pentatonicById[id]?.parentsUnrooted ?? [])) families.add(family);
      familiesCache.set(key, families);
    }
    return familiesCache.get(key);
  };
  const facts = [];
  for (const entry of domain.perAnchor) {
    const anchor = entry.anchor;
    const anchorMask = domain.maskById.get(anchor);
    const anchorPitches = parsePitchSet(domain.rowById.get(anchor).pitchSet);
    const anchorIc = icVectorOfMask(anchorMask);
    const anchorFamilies = familiesOfMask(anchorMask);
    const anchorSubnodes = subnodesByMask.get(String(anchorMask));
    for (const satellite of entry.instances) {
      const satelliteMask = domain.maskById.get(satellite);
      const satellitePitches = parsePitchSet(domain.rowById.get(satellite).pitchSet);
      const satelliteSubnodes = subnodesByMask.get(String(satelliteMask));
      const sharedIds = anchorSubnodes.filter((id) => satelliteSubnodes.includes(id));
      const familyOverlap = [...anchorFamilies].filter((family) => D_TIER_FAMILIES.includes(family) && familiesOfMask(satelliteMask).has(family)).length;
      const displacement = singlePitchDisplacement(anchorPitches, satellitePitches);
      facts.push({
        key: `${anchor}:${satellite}`,
        anchor,
        satellite,
        dPcSum: Math.abs(pcSumOfMask(anchorMask) - pcSumOfMask(satelliteMask)),
        dMask: Math.abs(anchorMask - satelliteMask),
        displacementRaw: displacement.raw,
        displacementLinear: displacement.linear,
        sign: signOfMask(satelliteMask, subnodesByMask, pentatonicById),
        icEqual: canonicalText(anchorIc) === canonicalText(icVectorOfMask(satelliteMask)),
        rotationHits: rotationRelations(anchorMask, satelliteMask).length,
        hamming: hamming12(anchorMask, satelliteMask),
        overlapIdCount: sharedIds.length,
        familyOverlapSeven: familyOverlap,
        inversionImageOfAnchorEqualsSatellite: invertMask12(anchorMask) === satelliteMask,
        parentCount: domain.parentCounts.get(satellite),
        multiplicity: domain.multiplicity.get(satellite),
      });
    }
  }
  return { domain, facts };
}

export function buildCanonicalPredicates(factByKey) {
  const predicate = (id, candidate, expression, test) => {
    const rule = {
      id,
      candidate,
      expression,
      tier: "masks-only (masks + containment mesh)",
      predicate: (key) => test(factByKey.get(key)),
    };
    return rule;
  };
  return [
    predicate("P1", "C-M1", "[shared subnode count >= 6]", (fact) => fact.overlapIdCount >= 6),
    predicate("P2", "C-M2", "[at least one d in 1..11 with rotateMask12^d(anchor) = satellite]", (fact) => fact.rotationHits >= 1),
    predicate("P3", "C-M3", "[|pcSum(anchor) - pcSum(satellite)| = 1]", (fact) => fact.dPcSum === 1),
    predicate("P4", "C-M4", "[nonZ shared-family sum < Z shared-family sum]", (fact) => fact.sign < 0),
    predicate("P5", "C-M5", "[|single-pitch displacement| = 1]", (fact) => Math.abs(fact.displacementLinear) === 1),
    predicate("P6", "C-M6", "[IC(anchor) = IC(satellite)]", (fact) => fact.icEqual),
    predicate("P8", "C-M8", "[invertMask12(anchor) = satellite]", (fact) => fact.inversionImageOfAnchorEqualsSatellite),
    predicate("P9", "C-M9", "[reach-singleton: parentCount(satellite) = 1]", (fact) => fact.parentCount === 1),
  ];
}

// ==== INTRINSIC-MECHANISM-END ====

// ---- comparison and evaluation region (the office field, the class label,
// ---- the orientation label, the network records, the landed artifacts and
// ---- the BL-055 table are read here as labelled targets; never in the
// ---- intrinsic region) ------------------------------------------------------

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

function isClean(matrix) {
  return matrix.tp === 14 && matrix.fp === 0 && matrix.fn === 0 && matrix.tn === 22;
}

function verdictOf(matrix) {
  if (isClean(matrix)) return "CLEAN_SPLIT";
  if (matrix.tp === 12 && matrix.fp === 0 && matrix.fn === 2 && matrix.tn === 22) return "NEAR_MISS_BOUNDARY";
  if (matrix.tp === 0 && matrix.fp === 22 && matrix.fn === 14 && matrix.tn === 0) return "ANTI_SEPARATING";
  return "NON_SEPARATING";
}

function selectionHash(selectedKeys) {
  return sha256(canonicalText(selectedKeys)).slice(0, 16);
}

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

function permutationBaseline(instanceKeys, labels, selectionSet) {
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
  const lowerIndex = Math.floor(0.025 * PERMUTATION_N);
  const upperIndex = Math.min(PERMUTATION_N - 1, Math.ceil(0.975 * PERMUTATION_N) - 1);
  return {
    cleanSplitCount,
    tpHistogram,
    tpSum: tpValues.reduce((sum, value) => sum + value, 0),
    maxTP: tpValues[PERMUTATION_N - 1],
    central95: { lower: tpValues[lowerIndex], upper: tpValues[upperIndex] },
  };
}

export function buildInvestigation() {
  const ledgerRows = parseCsv(read(LEDGER_PATH));
  const network = readJson(NETWORK_PATH);
  const mesh = readJson(MESH_PATH);
  const bl068 = readJson(BL068_PATH);
  const bl070 = readJson(BL070_PATH);
  const bl071 = readJson(BL071_PATH);
  const bl055 = readJson(BL055_PATH);

  if (ledgerRows.length !== 462) fail(`heptatonic ledger census is ${ledgerRows.length}`);

  // ---- chain self-checks (fingerprints; no literals in this generator) ----
  const { derivationFingerprint: bl068Fingerprint, ...bl068Core } = bl068;
  if (bl068.investigationId !== "BL068_D7_ASYMMETRY_V1" || bl068.status !== "planning_evidence") {
    fail("BL-068 artifact header drift");
  }
  if (sha256(canonicalText(bl068Core)) !== bl068Fingerprint) fail("BL-068 fingerprint self-check failed");
  const { derivationFingerprint: bl070Fingerprint, ...bl070Core } = bl070;
  if (bl070.derivationId !== "BL070_D7_DERIVATION_V1" || bl070.status !== "planning_evidence") {
    fail("BL-070 artifact header drift");
  }
  if (sha256(canonicalText(bl070Core)) !== bl070Fingerprint) fail("BL-070 fingerprint self-check failed");
  const { investigationFingerprint: bl071Fingerprint, ...bl071Core } = bl071;
  if (bl071.investigationId !== "BL071_INTERVAL_6_STRUCTURE_V1" || bl071.status !== "planning_evidence") {
    fail("BL-071 artifact header drift");
  }
  if (sha256(canonicalText(bl071Core)) !== bl071Fingerprint) fail("BL-071 fingerprint self-check failed");
  const { reviewFingerprint: bl055Fingerprint, ...bl055Core } = bl055;
  if (bl055.reviewId !== "BL055_D4_SELECTION_REVIEW_v1" || bl055.status !== "planning_evidence") {
    fail("BL-055 artifact header drift");
  }
  if (sha256(canonicalText(bl055Core)) !== bl055Fingerprint) fail("BL-055 fingerprint self-check failed");

  // ---- the grounding base: domain (masks-only, set-equal BL-070) ----------
  const { domain, facts } = deriveInstanceFacts(ledgerRows, mesh);
  const factByKey = new Map(facts.map((fact) => [fact.key, fact]));
  const instanceKeys = domain.instanceKeys.slice().sort(sortInstanceKey);
  if (instanceKeys.length !== 36 || facts.length !== 36) fail(`derived domain size drift: ${instanceKeys.length}`);
  const bl070Keys = bl070.domainDerivation.perAnchor
    .flatMap((entry) => entry.instances.map((satellite) => `${entry.anchor}:${satellite}`))
    .sort(sortInstanceKey);
  if (canonicalText(bl070Keys) !== canonicalText(instanceKeys)) {
    fail("derived domain is not set-equal to the landed BL-070 derived domain");
  }
  const perAnchorCounts = domain.perAnchor.map((entry) => entry.count);
  if (canonicalText(perAnchorCounts) !== canonicalText([4, 5, 6, 6, 6, 5, 4])) {
    fail("per-anchor reach structure drift");
  }

  // ---- comparison-region labels (the evaluation target) --------------------
  const officeByState = new Map(ledgerRows.map((row) => [String(row.id), row.office]));
  const officeIndexByState = new Map(ledgerRows.map((row) => [String(row.id), Number(row.officeIndex)]));
  const orientationByState = new Map(ledgerRows.map((row) => [String(row.id), row.orientation]));
  const chiralityByState = new Map(ledgerRows.map((row) => [String(row.id), row.chirality]));
  const forteByState = new Map(ledgerRows.map((row) => [String(row.id), row.forte]));

  // the landed recorded relation (ground truth: the network's seat contacts)
  const contactRows = network.d7SeatContactRows.map((row) => ({
    id: String(row.id),
    satellite: String(row.source),
    anchor: String(row.target),
  }));
  if (contactRows.length !== 14) fail(`contact census drift: ${contactRows.length}`);
  const contactKeys = contactRows.map((row) => `${row.anchor}:${row.satellite}`).sort(sortInstanceKey);
  const actualSet = new Set(contactKeys);
  if (actualSet.size !== 14) fail(`recorded census drift: ${actualSet.size}`);
  const officeEqualKeys = instanceKeys.filter((key) => officeByState.get(key.split(":")[0]) === officeByState.get(key.split(":")[1]));
  if (canonicalText(contactKeys) !== canonicalText(officeEqualKeys)) {
    fail("recorded subset (same-office) is not set-equal to the seat-contact rows");
  }
  const deltaCounts = {};
  for (const key of instanceKeys.filter((key) => !actualSet.has(key))) {
    const [anchor, satellite] = key.split(":");
    const delta = String(((officeIndexByState.get(satellite) - officeIndexByState.get(anchor)) + 7) % 7);
    deltaCounts[delta] = (deltaCounts[delta] ?? 0) + 1;
  }
  if (canonicalText(deltaCounts) !== canonicalText({ "2": 11, "5": 11 })) fail("remainder delta structure drift");

  // ---- the canonical language (nine singles; OD-72-4) ----------------------
  const intrinsicPredicates = new Map(buildCanonicalPredicates(factByKey).map((definition) => [definition.id, definition]));
  const orientationPredicate = {
    id: "P7",
    candidate: "C-M7",
    expression: "[satellite orientation = A]",
    tier: "canonical-read (labelled, comparison region)",
    predicate: (key) => orientationByState.get(key.split(":")[1]).endsWith(" A"),
  };
  const language = ["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8", "P9"]
    .map((id) => (id === "P7" ? orientationPredicate : intrinsicPredicates.get(id)));

  // ---- per-term decomposition ----------------------------------------------
  const termARule = language.find((rule) => rule.id === "P3");
  const termBRule = language.find((rule) => rule.id === "P9");
  const termASelected = instanceKeys.filter(termARule.predicate);
  const termBSelected = instanceKeys.filter(termBRule.predicate);
  const termAConfusion = confusion(instanceKeys, actualSet, termARule.predicate);
  const termBConfusion = confusion(instanceKeys, actualSet, termBRule.predicate);
  const compositePredicate = (key) => termARule.predicate(key) || termBRule.predicate(key);
  const compositeConfusion = confusion(instanceKeys, actualSet, compositePredicate);
  if (!isClean(compositeConfusion)) fail("composite is not clean on the verified domain; grounding-base mismatch");
  if (canonicalText(compositeConfusion) !== canonicalText(bl070.tieBreakCandidate.confusion)) {
    fail("composite confusion disagrees with the landed BL-070 tie-break bytes");
  }
  if (canonicalText(termAConfusion) !== canonicalText(bl070.nearMiss.confusion)) {
    fail("Term-A confusion disagrees with the landed BL-070 near-miss bytes");
  }
  if (bl070.battery.summary.cleanSplitCount !== 0) fail("landed cleanSplitCount baseline drift");
  const overlapKeys = termASelected.filter((key) => termBSelected.includes(key));
  const residualRecordedOutside = contactKeys.filter((key) => !compositePredicate(key));
  const residualSelectedNonRecorded = instanceKeys.filter((key) => compositePredicate(key) && !actualSet.has(key));

  // ---- property table (36 rows; all landed fields re-tabulated) ------------
  const stateByMask = new Map(domain.satelliteRows.map((row) => [maskOfRow(row), String(row.id)]));
  const inversionPairs = (() => {
    const seen = new Set();
    const pairs = [];
    for (const state of domain.distinctStates) {
      if (seen.has(state)) continue;
      const partner = stateByMask.get(invertMask12(domain.maskById.get(state)));
      if (!partner) fail(`inversion image of ${state} missing from the satellite set`);
      seen.add(state);
      seen.add(partner);
      pairs.push([state, partner].sort(cmp));
    }
    if (pairs.length !== 7) fail(`inversion pairing census drift: ${pairs.length}`);
    return pairs.sort((left, right) => cmp(left[0], right[0]) || cmp(left[1], right[1]));
  })();
  const partnerOf = new Map();
  for (const [left, right] of inversionPairs) { partnerOf.set(left, right); partnerOf.set(right, left); }
  const propertyTable = instanceKeys.map((key) => {
    const [anchor, satellite] = key.split(":");
    const fact = factByKey.get(key);
    return {
      key,
      anchor,
      satellite,
      anchorMask: domain.maskById.get(anchor),
      satelliteMask: domain.maskById.get(satellite),
      pcSumAnchor: pcSumOfMask(domain.maskById.get(anchor)),
      pcSumSatellite: pcSumOfMask(domain.maskById.get(satellite)),
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

  // ---- the two landed baseline comparisons (fail-loud grounding) -----------
  const missedLanding = instanceKeys.filter((key) => actualSet.has(key) && factByKey.get(key).dPcSum !== 1);
  if (canonicalText(missedLanding) !== canonicalText(["127:253", "4033:2017"])) {
    fail("near-miss misses disagree with the landed BL-070 bytes");
  }
  if (bl070.nearMiss.selectedKeys.length !== 12) fail("landed near-miss selected census drift");
  if (canonicalText(bl070.tieBreakCandidate.confusion) !== canonicalText({ tp: 14, fp: 0, fn: 0, tn: 22 })) {
    fail("landed tie-break confusion drift");
  }
  if (bl070.tieBreakCandidate.status !== "UNPROMOTED_DISCOVERY") fail("landed tie-break status drift");
  if (bl070.branch.label !== "PARTIAL_DERIVATION") fail("landed BL-070 branch drift");

  // whole-pair respect of the two terms
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
  if (!Object.values(wholePairRespect).every((value) => value === true)) fail("whole-pair respect drift");

  const perTerm = {
    joint: {
      expression: "[|pcSum(anchor) - pcSum(satellite)| = 1] or [reach-singleton: parentCount(satellite) = 1]",
      confusion: compositeConfusion,
      verdict: verdictOf(compositeConfusion),
      selectedKeys: instanceKeys.filter(compositePredicate),
    },
    termA: {
      id: "P3",
      candidate: "C-M3",
      expression: termARule.expression,
      confusion: termAConfusion,
      verdict: verdictOf(termAConfusion),
      selectedKeys: termASelected,
      selectedCount: termASelected.length,
      coverage: "covers 12 of the 14 recorded contacts; the 12 interior single-semitone substitutions",
      misses: instanceKeys.filter((key) => actualSet.has(key) && !termARule.predicate(key)),
    },
    termB: {
      id: "P9",
      candidate: "C-M9",
      expression: termBRule.expression,
      confusion: termBConfusion,
      verdict: verdictOf(termBConfusion),
      selectedKeys: termBSelected,
      selectedCount: termBSelected.length,
      coverage: "covers 2 of the 14 recorded contacts; exactly the terminal tritone contacts (the near-miss misses)",
    },
    overlap: { keys: overlapKeys, count: overlapKeys.length, disjoint: overlapKeys.length === 0 },
    residual: {
      recordedOutsideUnion: residualRecordedOutside,
      selectedNonRecorded: residualSelectedNonRecorded,
      exact: residualRecordedOutside.length === 0 && residualSelectedNonRecorded.length === 0,
    },
    wholePairRespect,
    anatomy: "the single-semitone term covers the 12 interior contacts; the reach-singleton term covers the 2 terminal tritone contacts (127:253, 4033:2017); the terms are disjoint and jointly exact (12 + 2 = 14)",
  };

  // ---- the permutation baseline (H-Artifact; OD-72-2) -----------------------
  const selectionSet = new Set(instanceKeys.filter(compositePredicate));
  const labels = instanceKeys.map((key) => actualSet.has(key));
  const permutation = permutationBaseline(instanceKeys, labels, selectionSet);
  const exactDenominator = binomialBigInt(36, 14);
  const hArtifactSupported = permutation.cleanSplitCount > 0
    || (14 >= permutation.central95.lower && 14 <= permutation.central95.upper);
  const artifactVerdict = hArtifactSupported ? "SUPPORTED" : "REFUTED";

  const permutationBlock = {
    method: {
      population: "the 36-instance domain (fixed); labels = recorded/unrecorded status; margins fixed at 14/22",
      statistic: "clean-split count (tp = 14, equivalently fp = fn = 0 given |S| = |recorded| = 14) + the TP histogram",
      selection: "the composite's fixed 14-key selection S (C-TB-1)",
      iterations: PERMUTATION_N,
      seed: PERMUTATION_SEED,
      prng: "mulberry32",
      shuffle: "Fisher-Yates (descending) over the 36-label vector",
    },
    observed: { tp: 14, fp: 0, fn: 0, tn: 22 },
    results: {
      cleanSplitCount: permutation.cleanSplitCount,
      cleanSplitRate: `${permutation.cleanSplitCount}/${PERMUTATION_N}`,
      tpHistogram: permutation.tpHistogram,
      tpSum: permutation.tpSum,
      maxTP: permutation.maxTP,
      central95: permutation.central95,
      expectedMeanFraction: "49/9",
    },
    exact: {
      cleanMatchNumerator: 1,
      cleanMatchDenominator: exactDenominator.toString(),
      note: "exactly one of the C(36,14) uniform labelings reproduces the observed separation; pure arithmetic, supplementary to the pre-registered sample",
    },
    disclosure: DISCLOSURE,
    decisionRule: "SUPPORTED iff the clean-split count > 0 or the observed TP (14) lies within the central 95% interval of the empirical TP distribution; REFUTED iff cleanSplitCount = 0 and TP = 14 lies outside that interval",
    verdict: artifactVerdict,
    interpretation: artifactVerdict === "REFUTED"
      ? "the observed separation is not within random variation: no permutation of 1000 reproduces it and TP = 14 lies above the empirical central 95% interval; the exact-match probability (1/C(36,14)) is a lower bound conditional on the composite's selection from the search (the disclosure above)"
      : "the separation is within random variation under the pre-registered statistic - the artifact reading stands",
  };

  // ---- the geometric mapping (H-Geometric; OD-72-5) -------------------------
  const successor = new Map(network.d7ModalRows.map((row) => [String(row.source), String(row.target)]));
  const orbitOrder = [];
  let orbitCursor = "127";
  for (let step = 0; step < 7; step += 1) {
    orbitOrder.push(orbitCursor);
    const next = successor.get(orbitCursor);
    if (!next) fail(`modal orbit dead-end at ${orbitCursor}`);
    orbitCursor = next;
  }
  if (orbitCursor !== "127") fail("modal orbit does not close");
  const orbitIndex = new Map(orbitOrder.map((anchor, index) => [anchor, index]));
  const orbitEdges = orbitOrder.map((anchor, index) => ({
    a: anchor,
    b: orbitOrder[(index + 1) % 7],
    rotateInterval: rotationRelations(domain.maskById.get(anchor), domain.maskById.get(orbitOrder[(index + 1) % 7]))[0] ?? null,
  }));
  if (orbitEdges.some((edge) => edge.rotateInterval === null)) fail("orbit edge is not an exact rotation");
  const orbitRotationHistogram = orbitEdges.reduce((accumulator, edge) => {
    accumulator[String(edge.rotateInterval)] = (accumulator[String(edge.rotateInterval)] ?? 0) + 1;
    return accumulator;
  }, {});
  if (canonicalText(orbitRotationHistogram) !== canonicalText({ "11": 6, "6": 1 })) {
    fail("orbit rotation interval histogram drift");
  }
  const windows = domain.distinctStates.map((state) => {
    const parentEntries = domain.perAnchor.filter((entry) => entry.instances.includes(state));
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
  if (canonicalText(windowSizeHistogram) !== canonicalText({ "1": 2, "2": 2, "3": 10 })) {
    fail("window size histogram drift");
  }
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
  const overlapCountsFromWindows = orbitOrder.map((anchor, index) => windows.filter((window) => window.indices.includes(index)).length);
  const perAnchorCountsMatch = canonicalText(overlapCountsFromWindows) === canonicalText(perAnchorCounts);
  if (!perAnchorCountsMatch) fail("window-overlap counts disagree with the per-anchor reach counts");
  if (!allConsecutive) fail("window consecutiveness fails; the geometric mapping's premise is broken");
  if (!termBLocalized) fail("the reach-singletons are not the terminal windows; geometric localization fails");

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
  if (!allMirrored) fail("window inversion-mirroring fails");
  const anchorInversionPairs = domain.anchorRows.map((row) => {
    const anchor = String(row.id);
    const partner = domain.anchorRows.find((other) => maskOfRow(other) === invertMask12(maskOfRow(row)));
    if (!partner) fail(`anchor inversion image of ${anchor} missing`);
    return {
      a: anchor,
      b: String(partner.id),
      indices: [orbitIndex.get(anchor), orbitIndex.get(String(partner.id))],
      indexSum: orbitIndex.get(anchor) + orbitIndex.get(String(partner.id)),
    };
  }).filter((entry) => Number(entry.a) <= Number(entry.b));
  if (anchorInversionPairs.some((entry) => entry.indexSum !== 6)) fail("anchor inversion pairing does not mirror the orbit");
  const orbitOfficeSequence = orbitOrder.map((anchor) => Number(officeIndexByState.get(anchor)));
  const officeSteps = orbitOfficeSequence.map((value, index) => (value - orbitOfficeSequence[(index + 6) % 7] + 7) % 7);
  if (officeSteps.some((step) => step !== 2)) fail("orbit office step is not uniformly +2 mod 7");

  const geometricMapping = {
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
    perAnchorOverlapCounts: overlapCountsFromWindows,
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
      note: "the two reach-singleton contacts carry displacement 6 — the orbit's own closure interval — and sit at the orbit's inversion poles (indices 0 and 6; the anchors 127/4033 are an inversion pair)",
    },
    structuralChecks: {
      consecutiveWindows: allConsecutive,
      terminalLocalization: termBLocalized,
      perAnchorFromWindows: perAnchorCountsMatch,
      nonVacuous: windowSizeHistogram["1"] === 2 && windowSizeHistogram["3"] === 10,
    },
    a0Context: "cited context only (BL-073/BL-075/BL-076): the D7 orbit and the A0 P7 ring are one structure in two canonically related coordinate systems (T1 = x→5x); the A0 closure pair {2773,1387} is the coordinate image of the D7 closure pair {4033,127}; the family-level action pairs 7-1↔7-35. No A0 measurement occurs here (OD-72-5)",
    findings: [
      "the reach census is an orbit-window ladder: every satellite is reached by a consecutive interval of orbit anchors (windows of size 1/2/3; histogram 2/2/10)",
      "the per-anchor counts 4/5/6/6/6/5/4 are the window-overlap counts — the reach asymmetry is the ladder's overlap structure",
      "the reach-singletons are exactly the size-1 terminals (253 at index 0; 2017 at index 6) — Term-B's selection is the ladder's endpoints",
      "the ladder is inversion-symmetric: pitch-inversion mirrors every window (k → 6-k) and pairs the anchors at summed index 6 (127↔4033, 2111↔3971, 3103↔3847; 3599 self-paired)",
      "the singleton pair (253, 2017) is an inversion pair; the terminal tritone displacement equals the closure interval (6) on the unique ^6 rotation edge 4033→127",
      "the contact relation splits into two orbit regimes: interior (window size >= 2) single-semitone substitutions (12/14) and terminal (window size 1) tritone contacts (2/14); the composite is the interior rule ∨ the terminal rule",
    ],
    interpretation: "H-Geometric: the composite's two-term structure is exactly localized in the orbit-window geometry; the localization is descriptive — the recorded relation itself remains granted (production NOT ESTABLISHED)",
  };

  // ---- the cross-domain check (H-Informational; OD-72-1) --------------------
  const ledgerById = new Map(ledgerRows.map((row) => [String(row.id), row]));
  const table28 = bl055.table28;
  if (table28.length !== 28) fail(`BL-055 table28 census drift: ${table28.length}`);
  const faFacts = table28.map((row) => {
    const parent = ledgerById.get(String(row.parentH));
    const satellite = ledgerById.get(String(row.satellite));
    if (!parent || !satellite) fail(`BL-055 key ${row.key}: ledger record missing`);
    const delta = pcSumOfMask(maskOfRow(satellite)) - pcSumOfMask(maskOfRow(parent));
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
  if (faRecorded.size !== 14) fail(`BL-055 observed census drift: ${faRecorded.size}`);
  const faKeys = faFacts.map((fact) => fact.key);
  const faTermAConfusion = confusion(faKeys, faRecorded, (key) => Math.abs(faFacts.find((fact) => fact.key === key).absDelta) === 1);
  const faDeltaHistogram = faFacts.reduce((accumulator, fact) => {
    accumulator[String(fact.absDelta)] = (accumulator[String(fact.absDelta)] ?? 0) + 1;
    return accumulator;
  }, {});
  if (canonicalText(faDeltaHistogram) !== canonicalText({ "1": 24, "6": 4 })) fail("fa-pole delta histogram drift");
  const faSelectedClassComposition = faFacts
    .filter((fact) => fact.absDelta === 1)
    .reduce((accumulator, fact) => {
      accumulator[fact.forte] = (accumulator[fact.forte] ?? 0) + 1;
      return accumulator;
    }, {});
  const faMissedObserved = faFacts.filter((fact) => fact.observed && fact.absDelta !== 1).map((fact) => fact.key).sort(cmp);
  const faFalsePositives = faFacts.filter((fact) => !fact.observed && fact.absDelta === 1).map((fact) => fact.key).sort(cmp);
  const faClean = faTermAConfusion.fp === 0 && faTermAConfusion.fn === 0;
  const hInformationalSupported = !faClean && faTermAConfusion.fp + faTermAConfusion.fn > 4;
  const hInformationalVerdict = hInformationalSupported ? "SUPPORTED" : faClean ? "REFUTED" : "INDETERMINATE";
  const crossDomain = {
    source: {
      artifact: BL055_PATH,
      reviewFingerprint: bl055Fingerprint,
      table28Count: table28.length,
      observedCount: faRecorded.size,
      rule: "OD-72-1: descriptive-read over the landed BL-055 table; no fa-pole reach re-measurement; Term-B reported NOT-APPLICABLE rather than constructed",
    },
    termA: {
      expression: termARule.expression,
      deltaHistogram: faDeltaHistogram,
      confusion: faTermAConfusion,
      verdict: verdictOf(faTermAConfusion),
      clean: faClean,
      selectedCount: faFacts.filter((fact) => fact.absDelta === 1).length,
      classComposition: faSelectedClassComposition,
      missedObserved: faMissedObserved,
      falsePositiveCount: faFalsePositives.length,
      note: "on the class-mixed domain the proximity term selects both classes in equal number (12 + 12) and reproduces neither the class split nor the observed set",
    },
    termB: {
      id: "P9",
      applicability: "NOT_APPLICABLE",
      reason: "the fa-pole 28-key table is a granted enumeration with no landed Hamming-2 reach census (no parentCount counterpart); per OD-72-1 no counterpart is constructed — the language-relative limit is itself the finding",
    },
    compositeOnFa: {
      expression: "the composite degenerates to Term-A (Term-B absent on this domain)",
      confusion: faTermAConfusion,
      clean: faClean,
    },
    decisionRule: "SUPPORTED iff Term-A does not clean-split on the fa table (fp + fn > 4) and Term-B is NOT-APPLICABLE; REFUTED iff Term-A clean-splits; INDETERMINATE iff 0 < fp + fn <= 4",
    verdict: hInformationalVerdict,
    attribution: "INDETERMINATE within the supported finding: this check cannot separate class-purity dependence from reach-geometry dependence (Term-B's inapplicability is itself the confound)",
    interpretation: hInformationalSupported
      ? "the composite's separation does not survive on the class-mixed fa-pole domain: it is a D7-domain property, consistent with an informational (domain-composition) dependence that the check localizes but cannot attribute"
      : "the cross-domain reading did not fire as pre-registered",
  };

  // ---- the minimality enumeration (H-Primitive; OD-72-4) --------------------
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
  if (pairs.length !== 36) fail(`pair enumeration census drift: ${pairs.length}`);
  const degeneracyClasses = (() => {
    const byHash = new Map();
    for (const single of singles) {
      if (!byHash.has(single.selectionHash)) byHash.set(single.selectionHash, []);
      byHash.get(single.selectionHash).push(single.id);
    }
    return [...byHash.entries()].map(([hash, ids]) => ({
      selectionHash: hash,
      selectionSize: singles.find((single) => single.selectionHash === hash).selectionSize,
      ids,
    })).sort((left, right) => cmp(left.ids[0], right.ids[0]));
  })();
  const classRepresentative = new Map();
  for (const group of degeneracyClasses) {
    for (const id of group.ids) classRepresentative.set(id, group.ids[0]);
  }
  const cleanSingles = singles.filter((single) => single.clean).map((single) => single.id);
  const cleanPairs = pairs.filter((pair) => pair.clean);
  const minimalCleanCardinality = cleanSingles.length > 0 ? 1 : cleanPairs.length > 0 ? 2 : null;
  const compositePairId = "P3+P9";
  const compositeInMinimalSet = cleanPairs.some((pair) => pair.pairId === compositePairId);
  const uniqueMinimalClasses = new Set(cleanPairs.map((pair) => [pair.left, pair.right]
    .map((id) => classRepresentative.get(id))
    .sort(cmp)
    .join("+"))).size;
  const hPrimitiveSupported = cleanSingles.length === 0 && minimalCleanCardinality === 2;
  const minimality = {
    language: {
      definition: "the nine canonical landed single-axis predicates (one per candidate family; OD-72-4) + all 36 unordered pairwise disjunctions; no conjunctions, no 3+-term rules, no new thresholds; post-run expansion forbidden",
      canonicalOrder: language.map((rule) => rule.id),
      singles: language.map((rule) => ({ id: rule.id, candidate: rule.candidate, expression: rule.expression, tier: rule.tier })),
      pairCount: pairs.length,
      exclusions: "the C-M3 min-|Δmask| and |Δmask| <= 64 sub-rules, the C-M5 tritone sub-rule, the C-M9 parentCount 2/3 sub-rules, the C-M1 family-overlap sub-rule, the C-M2 hamming-8 sub-rule, and the C-M8 image-in-reach variant are recorded in the appendix table and excluded from the language",
    },
    singles,
    pairs,
    degeneracyClasses,
    summary: {
      cleanSingles,
      cleanPairs: cleanPairs.map((pair) => pair.pairId),
      minimalCleanCardinality,
      compositePairId,
      compositeInMinimalSet,
      uniqueMinimalUpToDegeneracy: uniqueMinimalClasses === 1,
      note: "P3 ≡ P5 as selections on this domain (the two near-miss lenses are set-equal); the minimal clean pairs are {P3+P9, P5+P9}, one equivalence class",
    },
    appendixVariants: (() => {
      const anchorMinMask = new Map(domain.perAnchor.map((entry) => [
        entry.anchor,
        Math.min(...entry.instances.map((satellite) => factByKey.get(`${entry.anchor}:${satellite}`).dMask)),
      ]));
      const variants = [
        { id: "C-M1.r2", candidate: "C-M1", expression: "[D-tier family presence overlap >= 7]", predicate: (key) => factByKey.get(key).familyOverlapSeven >= 7 },
        { id: "C-M2.r2", candidate: "C-M2", expression: "[hamming12(anchor, satellite) = 8]", predicate: (key) => factByKey.get(key).hamming === 8 },
        { id: "C-M3.r2", candidate: "C-M3", expression: "[|mask(anchor) - mask(satellite)| minimal within the anchor]", predicate: (key) => factByKey.get(key).dMask === anchorMinMask.get(factByKey.get(key).anchor) },
        { id: "C-M3.r3", candidate: "C-M3", expression: "[|mask(anchor) - mask(satellite)| <= 64]", predicate: (key) => factByKey.get(key).dMask <= 64 },
        { id: "C-M5.r2", candidate: "C-M5", expression: "[|single-pitch displacement| = 6]", predicate: (key) => Math.abs(factByKey.get(key).displacementLinear) === 6 },
        { id: "C-M8.r2", candidate: "C-M8", expression: "[invertMask12(satellite) lies in some anchor's reach]", predicate: (key) => domain.anchorRows.some((row) => hamming12(domain.maskById.get(String(row.id)), invertMask12(domain.maskById.get(factByKey.get(key).satellite))) === 2) },
        { id: "C-M9.r2", candidate: "C-M9", expression: "[parentCount(satellite) = 2]", predicate: (key) => factByKey.get(key).parentCount === 2 },
        { id: "C-M9.r3", candidate: "C-M9", expression: "[parentCount(satellite) = 3]", predicate: (key) => factByKey.get(key).parentCount === 3 },
      ];
      return variants.map((variant) => {
        const matrix = confusion(instanceKeys, actualSet, variant.predicate);
        return { id: variant.id, candidate: variant.candidate, expression: variant.expression, confusion: matrix, verdict: verdictOf(matrix), note: "excluded from the minimality language (OD-72-4); recorded for completeness" };
      });
    })(),
    decisionRule: "SUPPORTED iff no canonical single predicate clean-splits and the minimal clean-split cardinality is 2; REFUTED iff a single clean-splits",
    verdict: hPrimitiveSupported ? "SUPPORTED" : "REFUTED",
    scope: "language-relative: the minimality holds within the OD-72-4 language; it does not establish the absence of a simpler rule in any other language, and it carries no admission weight (OD-72-6)",
  };

  // ---- the verdict set (non-exclusive) --------------------------------------
  const geometricVerdict = allConsecutive && termBLocalized && perAnchorCountsMatch ? "SUPPORTED" : "REFUTED";
  const verdictSet = {
    nonExclusive: true,
    "H-Geometric": {
      verdict: geometricVerdict,
      statement: geometricVerdict === "SUPPORTED"
        ? "the composite captures the orbit-window geometry exactly: the reach census is a consecutive-window ladder; Term-B is the size-1 terminals; the per-anchor counts are the overlap counts; the ladder is inversion-symmetric and the terminal tritone displacement equals the closure interval"
        : "the geometric mapping's structural checks failed",
      evidence: "geometricMapping (windows, terminal localization, inversion symmetry, closure alignment); the structural checks are mechanically verified",
      production: "NOT ESTABLISHED: the geometry localizes the composite's two terms; it does not derive the recorded relation (R_NONE carried — the recording remains granted)",
    },
    "H-Informational": {
      verdict: hInformationalVerdict,
      statement: hInformationalVerdict === "SUPPORTED"
        ? "the composite's separation does not survive on the class-mixed fa-pole domain: Term-A selects 12 + 12 across the two classes and reproduces neither the class split nor the observed set; the composite's exactness is a D7-domain property"
        : `the cross-domain reading returned ${hInformationalVerdict}`,
      evidence: "crossDomain (BL-055 table28, fingerprint self-checked; Term-A confusion; Term-B NOT-APPLICABLE per OD-72-1)",
      attribution: "INDETERMINATE: the check cannot separate class-purity dependence from reach-geometry dependence",
    },
    "H-Artifact": {
      verdict: artifactVerdict,
      statement: artifactVerdict === "REFUTED"
        ? "the composite's separation is not within random variation under the pre-registered label permutation: 0 of 1000 shuffles reproduce it; the exact-match probability is 1/C(36,14); the separation is not a randomization artifact of the labeling"
        : "the separation is within random variation under the pre-registered statistic",
      evidence: "permutation (N=1000, seed 72072, fixed margins; TP histogram; central 95% interval)",
      disclosure: DISCLOSURE,
      scope: "the permutation p-value is conditional on C-TB-1's selection from the composite space (the disclosure above); it refutes the label-randomness reading, not every artifact reading — the in-language minimality enumeration addresses the loose-coverage reading",
    },
    "H-Primitive": {
      verdict: hPrimitiveSupported ? "SUPPORTED" : "REFUTED",
      statement: hPrimitiveSupported
        ? "no canonical single predicate clean-splits; the minimal clean-split cardinality in the pre-registered language is 2; the unique minimal description (up to the P3 ≡ P5 degeneracy) is the composite — the proximity + uniqueness pair"
        : "a single-axis predicate clean-splits; the minimality reading fails",
      evidence: "minimality (the 9 + 36 exhaustive enumeration; clean pairs {P3+P9, P5+P9})",
      scope: "language-relative (OD-72-4); carries no admission weight (OD-72-6); the 'no deeper mechanism' clause is not testable by this enumeration and is not claimed",
    },
  };

  // ---- GSL treatment (OD-72-6) ----------------------------------------------
  const gslTreatment = {
    rule: "OD-72-6: minimality is a language-relative description and does not justify a new GSL entry; a new GSL entry requires a supported mechanism (H-Geometric or H-Informational supported), which is language-independent; otherwise the treatment is at most a GSL-4 annotated refinement",
    distinction: "minimality = 'no simpler rule in the tested language achieves this' (language-relative description); mechanism = 'the boundary layer's structure produces this selection because [reason]' (language-independent cause); H-Primitive's support carries no admission weight by itself",
    gsl4Refinement: {
      status: "inline, unapplied (no status change, no new GSL number)",
      text: "GSL-4 annotated refinement (BL-072): the interval-6 structure's terminal face — the two recorded displacement-6 contacts (127:253, 4033:2017) are exactly the reach-singleton terminals of the D7 orbit (window size 1, at the inversion poles); their displacement equals the orbit's closure interval (6, the unique ^6 rotation edge 4033→127); the near-miss's misses are the terminal regime; the interior regime is semitone-exclusive (12/14 contacts at |ΔpcSum| = 1)",
    },
    newEntryDraft: {
      id: "GSL-7",
      status: "candidate draft, un-promoted",
      statement: "the composite's separation is the ti-pole reach-geography's two-regime rule: the D7 modal orbit induces a consecutive-window ladder on the satellite reach census; the interior windows carry the semitone-exclusive substitutions; the size-1 terminals are exactly the orbit's tritone contacts (an inversion pair, displacement = the closure interval); the composite [|ΔpcSum| = 1] ∨ [reach-singleton] is the interior regime ∨ the terminal regime, and its clean separation is language-independent (any language expressing the two regimes reproduces it)",
      condition: "OD-72-6's promotion condition is met at the characterization level (H-Geometric supported: the orbit-window structure is language-independent; H-Informational supported: the separation does not transfer to the class-mixed domain)",
      caveat: "the recording remains granted (R_NONE carried); production NOT ESTABLISHED; the entry is a draft for maintainer ruling, never an admission",
      registration: "none performed by this artifact; registration into the synthesis/map is a separate disposition",
    },
  };

  // ---- accounting, fences, citations ----------------------------------------
  const accounting = {
    masksOnly: [
      "the 36-instance domain and the reach census (role/tier partition + Hamming-2 reach + masks; set-equal to the landed BL-070 domain; fail-loud)",
      "the full property table's mask-geometric fields (masks, pcSum, displacement, Hamming, rotation hits, IC equality, inversion-image, containment sign, shared-subnode count, reach census)",
      "the two composite terms' confusions, the joint confusion, the disjointness and residual arithmetic, the whole-pair respect",
      "the permutation baseline (fixed margins; the selection fixed; pure deterministic arithmetic over the fixed labels)",
      "the orbit-window ladder, the inversion mirroring, the closure alignment (given the recorded orbit order — labelled)",
      "the minimality enumeration (the nine predicates + the 36 pairwise unions; pure arithmetic)",
    ],
    canonicalComputation: [
      "the recorded/unrecorded status labels (the evaluation target; the network seat-contact rows; comparison only)",
      "the office fields and deltas (comparison; the recorded relation's ground per R_NONE; never a derivation input)",
      "the class labels, chirality, and orientation labels (comparison targets, labelled)",
      "the orbit order (the network's recorded modal edges; labelled)",
      "the BL-055 table28 read (the fa-pole descriptive read; fingerprint self-checked)",
      "the BL-068/BL-070/BL-071 baseline reads (fingerprint self-checked; comparison)",
    ],
    remainingGranted: [
      "the D7/D6 anchor-satellite partition membership (the ledger's marking)",
      "the recorded contact relation itself (the selection's ground; BL-070/BL-078: granted-dependent, PARTIAL_DERIVATION/R_NONE)",
      "the modal orbit record (order, closure); the orientation bit (BL-065, labels only); presentation conventions",
    ],
    statement: "the analysis is arithmetic over the landed census: the domain, the predicates, the permutation, the geometry, and the minimality enumeration are masks-only or labelled-comparison reads; the contact recording remains granted (R_NONE carried); no new measurement occurs",
  };

  const fences = {
    d7HypothesisTier: "D7 remains hypothesis-tier throughout: no D7 claim event, no D7 record amendment, no D7 derivation admission; ENTRY 15's D7 clause carries forward verbatim (provenance/DECISION_LEDGER.md:2703-2712)",
    noNewMeasurement: "no new measurement: the census artifact is the grounding base; the analysis reads it and the landed BL-055 table (OD-72-1's descriptive-read boundary); any mismatch with the landed census is a halt",
    permutationDisclosure: DISCLOSURE,
    compositeStatusUnchanged: "C-TB-1 remains UNPROMOTED_DISCOVERY: this investigation characterizes its mechanism; separation ≠ derivation (OD-66-2 / OD-70-5) and promotion is a maintainer ruling",
    governsAdmission: "none; the GSL-7 draft is un-promoted and performs no registration",
    g1Intra330: "untouched",
    inv5: "no INV-5 graduation",
    mWalkability: "no M-walkability promotion",
    canonical: "no canonical/Court/schema/Neo4j writes; all sources read-only",
    d4Record: "no movement: ENTRY 10/15/16/17/18/19/20/21 byte-untouched",
    membrane: "the frame (scrum/plan/harmonic-comprehension-map.md sections 2.6/2.7) is interpretation vocabulary only; never a probe input, design input, or admitted canon claim",
    sessionProse: "context, not evidence",
    crossDomainRule: "OD-72-1: the fa-pole check is a descriptive read over the landed BL-055 table; no fa-pole reach re-measurement; Term-B reports NOT-APPLICABLE rather than being constructed",
    languageClosure: "OD-72-4: the language is closed before the run (nine canonical singles + 36 pairwise disjunctions); no conjunctions, no 3+-term rules, no new thresholds; post-run expansion forbidden",
  };

  const contractCitations = [
    "orrery/src/generated/bl070-d7-derivation.v1.json (the landed battery: cleanSplitCount 0, the near-miss 12/0/2/22, C-TB-1 14/0/0/22 UNPROMOTED_DISCOVERY; fingerprint self-checked)",
    "orrery/src/generated/bl068-d7-asymmetry.v1.json (GSL-3; the availability domain 36 = 14 + 22; the office-purity reading; fingerprint self-checked)",
    "orrery/src/generated/bl071-interval-6-structure.v1.json (the interval-6 census; the dual closure; the terminal tritone contacts; fingerprint self-checked)",
    "orrery/src/generated/d4-selection-review.v1.json (BL-055; table28; the 7-27/7-31 class split; fingerprint self-checked)",
    "qa/d4-r2-execution-receipt.json (the D7 analogue measurements; cycle-twin per-edge intervals)",
    "scrum/plan/bl-070-d7-derivation-memo.md (the near-miss anatomy; the tie-break disclosure; OD-70-5)",
    "scrum/plan/bl-074-tritone-anatomy-memo.md (the fa-pole substitution histogram; the D2 overlap trio; the trichotomy)",
    "scrum/plan/bl-078-d7-retest-memo.md (the replication under region-scoped isolation; the composite's status unchanged)",
    "scrum/plan/bl-073-dual-cycle-isometry-and-synthesis-scoping.md and scrum/plan/bl-075-coordinate-search-memo.md (the dual-cycle closure and the canonical coordinate maps; cited context for the A0-P7 line)",
    "scrum/BACKLOG.md (BL-072 capture; the approved planning pass 2026-10-13 — OD-72-1..OD-72-6)",
  ];

  const notAccomplished = [
    "no new measurement (the census artifact is the grounding base; the BL-055 table is read, not extended; no fa-pole reach census is constructed)",
    "no mechanism (causal) claim beyond the verdict set: the geometric localization is descriptive; production is NOT ESTABLISHED; the causal question stays open",
    "no claim event; no record amendment; no governs admission (the GSL-7 draft is un-promoted; the GSL-4 refinement is inline, unapplied)",
    "no C-TB-1 promotion; the composite's status is unchanged (UNPROMOTED_DISCOVERY)",
    "no G1 movement; no INV-5 graduation; no M-walkability promotion; no directional-semantics assignment",
    "no canonical/Court/schema/Neo4j writes; no ledger writes; no D4/D7 record movement",
    "no new universe enumeration or pair discovery beyond the landed witness lists (OD-72-5); session prose is context, not evidence",
  ];

  // ---- grounding block (the re-read anchors, fail-loud) ----------------------
  const grounding = {
    domain: { size: instanceKeys.length, perAnchor: perAnchorCounts, setEqualBl070: true, bl070DerivationFingerprint: bl070Fingerprint, bl070DomainSize: bl070.domainDerivation.domainSize },
    contacts: { recorded: actualSet.size, unrecorded: instanceKeys.length - actualSet.size, deltaCounts, setEqualSeatContactRows: true },
    composite: { expression: perTerm.joint.expression, confusion: compositeConfusion, landedMatch: true, landedStatus: bl070.tieBreakCandidate.status },
    nearMiss: { confusion: termAConfusion, landedMatch: true, missedKeys: missedLanding },
    battery: { landedCleanSplitCount: bl070.battery.summary.cleanSplitCount, analysisCleanSplitCount: cleanSingles.length },
    chainAnchors: {
      bl068: bl068Fingerprint,
      bl070: bl070Fingerprint,
      bl071: bl071Fingerprint,
      bl055: bl055Fingerprint,
    },
  };

  const preRegistration = {
    rulings: [
      { id: "OD-72-1", ruling: "cross-domain scope: descriptive-read over the landed BL-055 table28 (fingerprint 6d11fd93...); no fa-pole reach re-measurement; Term-B reported NOT-APPLICABLE if no landed counterpart, never constructed; the language-relative limit is itself the finding" },
      { id: "OD-72-2", ruling: "permutation pre-registration: N = 1000, seed 72072, fixed-margin label shuffle (Fisher-Yates, mulberry32), statistic = clean-split rate + TP histogram, the selection-effect disclosure verbatim; all parameters locked before the run" },
      { id: "OD-72-3", ruling: "landing form: machine-checkable artifact + memo; the permutation p-value and the minimality enumeration are arithmetic over landed bytes with fail-loud invariants" },
      { id: "OD-72-4", ruling: "minimality language: the nine canonical landed single-axis predicates + all 36 pairwise disjunctions; no conjunctions, no 3+-term rules, no new thresholds; post-run expansion forbidden" },
      { id: "OD-72-5", ruling: "geometric scope: the orbit/cycle mapping is confined to landed orders + landed witness lists with census-identical mask functions; new edge/rotation discovery is a halt" },
      { id: "OD-72-6", ruling: "GSL treatment: default no new GSL entry; at most a GSL-4 annotated refinement; a new GSL entry requires a supported mechanism (not minimality alone); minimality is language-relative and carries no admission weight" },
    ],
    decisionRules: {
      hGeometric: "SUPPORTED iff all three structural checks pass (consecutive windows; terminal localization; per-anchor counts from window overlaps) and the mapping is non-vacuous; REFUTED if any check fails; production is reported separately",
      hInformational: "SUPPORTED iff Term-A does not clean-split on the fa table (fp + fn > 4) and Term-B is NOT-APPLICABLE; REFUTED iff Term-A clean-splits; INDETERMINATE iff 0 < fp + fn <= 4",
      hArtifact: "SUPPORTED iff the clean-split count > 0 or the observed TP (14) lies within the central 95% interval of the empirical TP distribution; REFUTED iff cleanSplitCount = 0 and TP = 14 lies outside that interval",
      hPrimitive: "SUPPORTED iff no canonical single predicate clean-splits and the minimal clean-split cardinality in the language is 2; REFUTED iff a single clean-splits",
    },
    permutationMethod: {
      population: "the 36-instance domain; labels = recorded/unrecorded status; margins fixed at 14/22",
      statistic: "clean-split count (tp = 14) + the TP histogram",
      iterations: PERMUTATION_N,
      seed: PERMUTATION_SEED,
      prng: "mulberry32",
      shuffle: "Fisher-Yates (descending) over the 36-label vector",
      disclosure: DISCLOSURE,
    },
    buildNotes: [
      "the analysis plan was approved 2026-10-13 (the planning pass's rulings OD-72-1..OD-72-6); the build executes it verbatim",
      "the census artifact (BL-070, fingerprint self-checked) is the grounding base; any mismatch between the analysis's reading and the landed census is a halt",
      "the verdict set is non-exclusive: geometric and informational may both hold; primitive is a language-relative geometric fact",
      "the GSL treatment follows OD-72-6's line: minimality alone does not carry admission weight; the GSL-7 draft is un-promoted",
    ],
  };

  // ---- assembly --------------------------------------------------------------
  const core = {
    schemaVersion: SCHEMA_VERSION,
    investigationId: INVESTIGATION_ID,
    status: "planning_evidence",
    generator: "scripts/build-bl072-composite-mechanism.mjs",
    role: "the composite's mechanism investigation: the min-|delta| + reach-census composite's separation characterized through the four pre-registered non-exclusive hypotheses (geometric / informational / artifact / primitive); planning evidence, hypothesis-tier",
    preRegistration,
    sourceBindings: [
      { artifact: LEDGER_PATH, sha256: fileSha(LEDGER_PATH), role: "462-record canonical universe: the role/tier partition, pitch sets, masks, offices, classes, orientations (comparison fields labelled)" },
      { artifact: NETWORK_PATH, sha256: fileSha(NETWORK_PATH), role: "the D7 seat-contact and modal records (the evaluation target and the orbit order)" },
      { artifact: MESH_PATH, sha256: fileSha(MESH_PATH), role: "the containment mesh (the sign predicate P4 and the shared-subnode predicate P1)" },
      { artifact: BL068_PATH, sha256: fileSha(BL068_PATH), role: "chain anchor: GSL-3, the office-purity reading (fingerprint self-check)" },
      { artifact: BL070_PATH, sha256: fileSha(BL070_PATH), role: "chain anchor + grounding base: the landed battery, near-miss, composite (fingerprint self-check)" },
      { artifact: BL071_PATH, sha256: fileSha(BL071_PATH), role: "chain anchor: the interval-6 census and the dual closure (fingerprint self-check)" },
      { artifact: BL055_PATH, sha256: fileSha(BL055_PATH), role: "the fa-pole table28 (the cross-domain descriptive read; fingerprint self-check)" },
    ],
    base: {
      bl068: { artifact: BL068_PATH, derivationFingerprint: bl068Fingerprint },
      bl070: { artifact: BL070_PATH, derivationFingerprint: bl070Fingerprint },
      bl071: { artifact: BL071_PATH, investigationFingerprint: bl071Fingerprint },
      bl055: { artifact: BL055_PATH, reviewFingerprint: bl055Fingerprint },
      importPolicy: "the chain artifacts and the BL-055 table are consumed by fingerprint self-check (no literals in this generator); the landed confusion tables are matched fail-loud; no landed artifact is rewritten",
    },
    grounding,
    propertyTable: {
      columns: [
        "key", "anchor", "satellite", "anchorMask", "satelliteMask", "pcSumAnchor", "pcSumSatellite",
        "dPcSum", "displacementLinear", "hamming", "parentCount", "multiplicity", "inversionPartner",
        "satelliteClass", "satelliteChirality", "satelliteOrientation", "anchorOffice", "satelliteOffice",
        "officeDelta", "sign", "zMajority", "overlapIdCount", "rotationHits", "icEqual",
        "inversionImageOfAnchorEqualsSatellite", "recorded", "termA", "termB", "composite", "compositeTerm",
      ],
      rows: propertyTable,
    },
    perTerm,
    permutation: permutationBlock,
    geometricMapping,
    crossDomain,
    minimality,
    verdictSet,
    gslTreatment,
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
    domain: `${investigation.grounding.domain.size} instances, per-anchor ${investigation.grounding.domain.perAnchor.join("/")}`,
    perTerm: {
      termA: `${investigation.perTerm.termA.confusion.tp}/${investigation.perTerm.termA.confusion.fp}/${investigation.perTerm.termA.confusion.fn}/${investigation.perTerm.termA.confusion.tn}`,
      termB: `${investigation.perTerm.termB.confusion.tp}/${investigation.perTerm.termB.confusion.fp}/${investigation.perTerm.termB.confusion.fn}/${investigation.perTerm.termB.confusion.tn}`,
      joint: `${investigation.perTerm.joint.confusion.tp}/${investigation.perTerm.joint.confusion.fp}/${investigation.perTerm.joint.confusion.fn}/${investigation.perTerm.joint.confusion.tn}`,
      disjoint: investigation.perTerm.overlap.disjoint,
    },
    permutation: `${investigation.permutation.results.cleanSplitRate} clean splits; max TP ${investigation.permutation.results.maxTP}; exact 1/${investigation.permutation.exact.cleanMatchDenominator}`,
    crossDomain: `Term-A fa ${investigation.crossDomain.termA.confusion.tp}/${investigation.crossDomain.termA.confusion.fp}/${investigation.crossDomain.termA.confusion.fn}/${investigation.crossDomain.termA.confusion.tn}; Term-B ${investigation.crossDomain.termB.applicability}`,
    minimality: `singles clean ${investigation.minimality.summary.cleanSingles.length}; pairs clean ${investigation.minimality.summary.cleanPairs.join(", ")}; minimal cardinality ${investigation.minimality.summary.minimalCleanCardinality}`,
    verdicts: Object.fromEntries(Object.entries(investigation.verdictSet).filter(([key]) => key !== "nonExclusive").map(([key, value]) => [key, value.verdict])),
    investigationFingerprint: investigation.investigationFingerprint,
  };
  if (check) {
    const existing = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, "utf8") : null;
    if (existing !== serialized) throw new Error("STALE_BL072_COMPOSITE_MECHANISM");
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
