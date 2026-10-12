#!/usr/bin/env node
/**
 * Build the BL-078 D7 re-test (office-purity route, replication under the
 * region-scoped isolation) - planning, read-only analysis.
 *
 * The question (approved planning pass, rulings OD-N0..OD-N3): the ti-pole's
 * contact relation - office-pure, same-office-only, 14 contacts in a
 * 36-instance domain - was the subject of the landed BL-070 attempt
 * (PARTIAL_DERIVATION: the domain derives masks-only; the nine pre-registered
 * mask-geometric candidates all fail; the office field remains the selection's
 * ground). This re-test re-runs the verbatim battery against the re-verified
 * domain under a stricter, region-scoped input isolation and compares the
 * result side-by-side with the landed battery: replication confirms the
 * original findings under the stricter enforcement; divergence is itself the
 * finding (the original candidates would have been reading an office-correlated
 * channel).
 *
 * Structure:
 *   domainVerification - the D1 role/tier partition + the D2 Hamming-2 reach
 *                        re-derived masks-only; set-equal to the landed BL-068
 *                        availability domain and the landed BL-070 domain;
 *                        the calibration control (all-ledger reach uniform, 30)
 *   calibration        - V-D7D-2: R-OFF (the office-field rule) reproduces the
 *                        14 landed contacts exactly (14/0/0/22); the control's
 *                        license - a failure would mean the domain is wrong
 *   battery            - the nine pre-registered candidates (C-M1..C-M9,
 *                        verbatim from the BL-070 definitions) evaluated
 *                        against the landed relation on the verified domain
 *   comparison         - the side-by-side against the landed BL-070 battery
 *                        (confusions, verdicts, distributions) and the landed
 *                        BL-068 axes; verdict REPLICATED / DIVERGED
 *   nearMiss           - the 12/0/2/22 near-miss anatomy re-derived; the two
 *                        misses re-identified
 *   combination        - C-TB-R1 (the min-|delta| + reach-census composite),
 *                        recorded un-promoted per OD-N2
 *   invariants         - inversion-invariance and office-linking re-verified
 *   orbitalRotation    - the orbit's exact rotations re-verified against the
 *                        landed receipt bytes interval-by-interval
 *   isolation          - V-D7D-4: the region-scoped enforcement block
 *   branch             - the pre-registered classification against the
 *                        V-D7D gate results
 *   accounting         - masks-only / canonical-computation / remaining granted
 *
 * Fences: planning_evidence only. D7 hypothesis-tier throughout (no D7 claim
 * event, no D7 record amendment, no D7 derivation admission); ENTRY 15's D7
 * clause carries forward verbatim. No GOVERNS admission; no G1 movement; no
 * INV-5 graduation; no M-walkability promotion; no canonical/Court/schema/
 * Neo4j writes; no D4-record movement. BL-070's bytes are frozen: this retest
 * is a distinct artifact consuming BL-070 by fingerprint self-check only. The
 * frame 2.6/2.7 is interpretation vocabulary, never design input. Session
 * prose is context, not evidence.
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

export const SCHEMA_VERSION = "harmonic-orrery.bl078-d7-retest.v1";
export const RETEST_ID = "BL078_D7_RETEST_V1";
export const OUTPUT_PATH = "orrery/src/generated/bl078-d7-retest.v1.json";
export const NETWORK_PATH = "canonical/universal-network-data.json";
export const LEDGER_PATH = HEPTATONIC_LEDGER_PATH;
export const MESH_PATH = BIPARTITE_PATH;
export const BL068_PATH = "orrery/src/generated/bl068-d7-asymmetry.v1.json";
export const BL070_PATH = "orrery/src/generated/bl070-d7-derivation.v1.json";
export const GATE3_PATH = "qa/d4-r2-execution-receipt.json";

export const NON_Z_D_FAMILIES = ["7-1", "7-15", "7-22", "7-8"];
export const Z_D_FAMILIES = ["7-Z12", "7-Z17", "7-Z37"];
export const D_TIER_FAMILIES = [...NON_Z_D_FAMILIES, ...Z_D_FAMILIES];

// ==== INTRINSIC-RETEST-BEGIN (ledger role/tier partition + masks + mesh only) ====
// This region builds the domain, the mask-geometric instance facts, and the
// eight mask-geometric candidate predicate definitions. It reads the canonical
// ledger's role/tier partition, the pitch sets, and the containment mesh. It
// never reads the office field, the class label, the network's records, or any
// landed verdict. The office field is the target, never an input.

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
  const distinctStates = sortedUnique(querySatelliteOf(instanceKeys));
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

function querySatelliteOf(instanceKeys) {
  return instanceKeys.map((key) => key.split(":")[1]);
}

export function deriveAllLedgerReach(anchorRows, ledgerRows) {
  const masks = new Map(ledgerRows.map((row) => [String(row.id), maskOfRow(row)]));
  return anchorRows.map((row) => {
    const anchor = String(row.id);
    const count = ledgerRows
      .filter((other) => String(other.id) !== anchor && hamming12(masks.get(anchor), masks.get(String(other.id))) === 2)
      .length;
    return { anchor, count };
  });
}

export function deriveTierReach(anchorRows, ledgerRows, tier, role) {
  const masks = new Map(ledgerRows.map((row) => [String(row.id), maskOfRow(row)]));
  const members = ledgerRows.filter((row) => row.tier === tier && (role === null || row.role === role));
  return anchorRows.map((row) => {
    const anchor = String(row.id);
    const count = members
      .filter((other) => hamming12(masks.get(anchor), masks.get(String(other.id))) === 2)
      .length;
    return { anchor, count };
  });
}

function familySharedCount(subnodes, pentatonicById, family) {
  let count = 0;
  for (const id of subnodes) {
    if ((pentatonicById[id]?.parentsUnrooted ?? []).includes(family)) count += 1;
  }
  return count;
}

function signOfMask(mask, mesh, subnodesByMask, pentatonicById) {
  const subnodes = subnodesByMask.get(String(mask));
  if (!subnodes) fail(`containment mesh node missing for mask ${mask}`);
  const nonZSum = NON_Z_D_FAMILIES.reduce((sum, family) => sum + familySharedCount(subnodes, pentatonicById, family), 0);
  const zSum = Z_D_FAMILIES.reduce((sum, family) => sum + familySharedCount(subnodes, pentatonicById, family), 0);
  void mesh;
  return nonZSum - zSum;
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
  const linear = raw > 6 ? raw - 12 : raw;
  return { removed: removed[0], added: added[0], raw, linear };
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
      const inversionImage = invertMask12(satelliteMask);
      const inversionImageInReach = domain.anchorRows.some((row) => {
        const other = String(row.id);
        return hamming12(domain.maskById.get(other), inversionImage) === 2;
      });
      facts.push({
        key: `${anchor}:${satellite}`,
        anchor,
        satellite,
        dPcSum: Math.abs(pcSumOfMask(anchorMask) - pcSumOfMask(satelliteMask)),
        dMask: Math.abs(anchorMask - satelliteMask),
        displacementRaw: displacement.raw,
        displacementLinear: displacement.linear,
        sign: signOfMask(satelliteMask, mesh, subnodesByMask, pentatonicById),
        icEqual: canonicalText(anchorIc) === canonicalText(icVectorOfMask(satelliteMask)),
        rotationHits: rotationRelations(anchorMask, satelliteMask).length,
        hamming: hamming12(anchorMask, satelliteMask),
        overlapIdCount: sharedIds.length,
        familyOverlapSeven: familyOverlap,
        inversionImageOfAnchorEqualsSatellite: invertMask12(anchorMask) === satelliteMask,
        inversionImageInReach,
        parentCount: domain.parentCounts.get(satellite),
        multiplicity: domain.multiplicity.get(satellite),
      });
    }
  }
  const anchorIcVectors = sortedUnique(domain.anchorRows.map((row) => canonicalText(icVectorOfMask(domain.maskById.get(String(row.id))))));
  const satelliteIcVectors = sortedUnique(domain.satelliteRows.map((row) => canonicalText(icVectorOfMask(domain.maskById.get(String(row.id))))));
  return { domain, facts, anchorIcVectors, satelliteIcVectors };
}

export function deriveInversionPairing(satelliteRows) {
  const byMask = new Map(satelliteRows.map((row) => [maskOfRow(row), String(row.id)]));
  const seen = new Set();
  const pairs = [];
  for (const row of satelliteRows) {
    const state = String(row.id);
    if (seen.has(state)) continue;
    const partner = byMask.get(invertMask12(maskOfRow(row)));
    if (!partner) fail(`inversion image of ${state} missing from the satellite set`);
    seen.add(state);
    seen.add(partner);
    pairs.push([state, partner].sort(cmp));
  }
  if (pairs.length !== 7) fail(`inversion pairing census drift: ${pairs.length}`);
  return pairs.sort((left, right) => cmp(left[0], right[0]) || cmp(left[1], right[1]));
}

export function buildMaskGeometricPredicates(domain, factByKey) {
  const anchorMinMask = new Map(domain.perAnchor.map((entry) => [
    entry.anchor,
    Math.min(...entry.instances.map((satellite) => factByKey.get(`${entry.anchor}:${satellite}`).dMask)),
  ]));
  const subRule = (name, expression, predicate, shape) => ({ name, expression, predicate, shape });
  return [
    {
      id: "C-M1",
      family: "containment",
      tier: "masks-only (masks + containment mesh)",
      ruleSummary: "shared containment structure between the anchor and the satellite",
      expectation: "NON_SEPARATING (must be measured, not assumed)",
      evidence: "containment mesh (derived/hypergraph/bipartite-inclusion-v1.json): subnode ID intersection and D-tier family presence",
      subRules: [
        subRule("overlapIdThresholdSix", "[shared subnode count >= 6]", (key) => factByKey.get(key).overlapIdCount >= 6,
          "selects none; the shared-subnode count is constant at 5 across all 36 instances"),
        subRule("familyOverlapThresholdSeven", "[D-tier family presence overlap >= 7]", (key) => factByKey.get(key).familyOverlapSeven >= 7,
          "6-recorded / 4-recorded spread at 6 and 7; no threshold separates"),
      ],
    },
    {
      id: "C-M2",
      family: "hamming-rotation",
      tier: "masks-only",
      ruleSummary: "Hamming/rotation signatures (H2 is domain-constant; no anchor-satellite instance is a mask rotation)",
      expectation: "NON_SEPARATING / UNIFORM",
      evidence: "mask rotation and Hamming computations over the derived domain",
      subRules: [
        subRule("rotationHitGeOne", "[at least one d in 1..11 with rotateMask12^d(anchor) = satellite]", (key) => factByKey.get(key).rotationHits >= 1,
          "selects none; the rotational ground is absent at the instance level (0/36)"),
        subRule("hammingEqualsEight", "[hamming12(anchor, satellite) = 8]", (key) => factByKey.get(key).hamming === 8,
          "selects none; every instance is at Hamming 2 (the D2 reach)"),
      ],
    },
    {
      id: "C-M3",
      family: "pc-sum/mask-numeric proximity",
      tier: "masks-only",
      ruleSummary: "pitch-sum distance and mask-numeric proximity (the near-miss shape recorded exactly)",
      expectation: "near-miss recorded exactly; no clean separation",
      evidence: "pitch-sum and mask-numeric distances from the ledger pitch sets and masks",
      subRules: [
        subRule("absPcSumDeltaOne", "[|pcSum(anchor) - pcSum(satellite)| = 1]", (key) => factByKey.get(key).dPcSum === 1,
          "NEAR_MISS: selects 12/14; the two misses are the terminal tritone contacts 127:253 and 4033:2017 (dPc=6)"),
        subRule("minAbsMaskDeltaPerAnchor", "[|mask(anchor) - mask(satellite)| minimal within the anchor]", (key) => {
          const fact = factByKey.get(key);
          return fact.dMask === anchorMinMask.get(fact.anchor);
        }, "selects 7/14 (one per anchor); all single-semitone substitutions"),
        subRule("absMaskDeltaAtMost64", "[|mask(anchor) - mask(satellite)| <= 64]", (key) => factByKey.get(key).dMask <= 64,
          "8/3/6/19; no threshold separates (the recorded instances span 2..2016)"),
      ],
    },
    {
      id: "C-M4",
      family: "subnode-composition (chiral-Z)",
      tier: "masks-only (masks + containment mesh)",
      ruleSummary: "the GSL-2 chiral-Z containment polarization (fa-specific; does not extend)",
      expectation: "NON_SEPARATING (fa-specific, confirmed)",
      evidence: "recomputed from the containment mesh with the BL-060/061 method (parentsUnrooted against the seven D-tier families)",
      subRules: [
        subRule("zMajoritySignNegative", "[nonZ shared-family sum < Z shared-family sum]", (key) => factByKey.get(key).sign < 0,
          "4/2/10/20; only 4/14 contact states are Z-majority (191, 253, 2017, 4001); the mechanism is state-level"),
      ],
    },
    {
      id: "C-M5",
      family: "substitution displacement",
      tier: "masks-only",
      ruleSummary: "single-pitch substitution displacement (the C-M3 near-miss's equivalent lens)",
      expectation: "NEAR_MISS, not CLEAN",
      evidence: "single-pitch swap (removed, added) per Hamming-2 instance; linear displacement mod 12 in -6..6",
      subRules: [
        subRule("absLinearDisplacementOne", "[|single-pitch displacement| = 1]", (key) => Math.abs(factByKey.get(key).displacementLinear) === 1,
          "NEAR_MISS: equivalent to C-M3.r1 (single-semitone substitutions); misses the two tritone contacts"),
        subRule("absLinearDisplacementSix", "[|single-pitch displacement| = 6]", (key) => Math.abs(factByKey.get(key).displacementLinear) === 6,
          "2/10/12/12; the tritone class collides across statuses"),
      ],
    },
    {
      id: "C-M6",
      family: "interval-class counts",
      tier: "masks-only",
      ruleSummary: "interval-class counts computed from the mask alone (class-constant on each partition side)",
      expectation: "UNIFORM/degenerate (the class is the domain)",
      evidence: "interval-class vectors recomputed from masks (no ledger field read)",
      subRules: [
        subRule("icVectorEqual", "[IC(anchor) = IC(satellite)]", (key) => factByKey.get(key).icEqual,
          "selects none; anchor IC is constant (6,5,4,3,2,1), satellite IC constant (5,5,4,3,3,1)"),
      ],
    },
    {
      id: "C-M8",
      family: "inversion-image",
      tier: "masks-only",
      ruleSummary: "the pitch-inversion image (a pole-universal constraint, not a selector)",
      expectation: "NON_SEPARATING as selector; invariant constraint",
      evidence: "12-bit mask inversion; links to the invariant geography",
      subRules: [
        subRule("inversionImageOfAnchorEqualsSatellite", "[invertMask12(anchor) = satellite]", (key) => factByKey.get(key).inversionImageOfAnchorEqualsSatellite,
          "selects none (0/36)"),
        subRule("inversionImageInReach", "[invertMask12(satellite) lies in some anchor's reach]", (key) => factByKey.get(key).inversionImageInReach,
          "selects all (the 14 states are inversion-closed: every state's partner is an in-domain state)"),
      ],
    },
    {
      id: "C-M9",
      family: "multiplicity / reach census",
      tier: "masks-only",
      ruleSummary: "state appearance multiplicity (the reach census; the BL-066 closure-law family exhausted)",
      expectation: "NON_SEPARATING",
      evidence: "per-satellite reach census (masks-only); state appearance multiplicity (the two are identical, fail-loud checked)",
      subRules: [
        subRule("parentCountOne", "[reach-singleton: parentCount(satellite) = 1]", (key) => factByKey.get(key).parentCount === 1,
          "2/0/12/22; the selected instances are exactly 127:253 and 4033:2017 - the near-miss misses"),
        subRule("parentCountTwo", "[parentCount(satellite) = 2]", (key) => factByKey.get(key).parentCount === 2,
          "2/2/12/20 (191 and 4001 each appear in two anchors' reaches)"),
        subRule("parentCountThree", "[parentCount(satellite) = 3]", (key) => factByKey.get(key).parentCount === 3,
          "10/20/4/2"),
      ],
    },
  ];
}

// ==== INTRINSIC-RETEST-END ====

// ---- comparison and evaluation region (the office field, the class label,
// ---- the network records, the landed artifacts and the orientation labels
// ---- are read here; never in the intrinsic region) --------------------------

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

function isClean(matrix) {
  return matrix.tp === 14 && matrix.fp === 0 && matrix.fn === 0 && matrix.tn === 22;
}

export function buildDerivation() {
  const ledgerRows = parseCsv(read(LEDGER_PATH));
  const mesh = readJson(MESH_PATH);
  const network = readJson(NETWORK_PATH);
  const bl068 = readJson(BL068_PATH);
  const bl070 = readJson(BL070_PATH);
  const gate3 = readJson(GATE3_PATH);

  if (ledgerRows.length !== 462) fail(`heptatonic ledger census is ${ledgerRows.length}`);
  const meshMasks = new Set(Object.values(mesh.heptatonicNodes).map((node) => String(node.pitchMask)));
  if (meshMasks.size !== 462) fail(`containment mesh census drift: ${meshMasks.size}`);

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
  if (gate3.status !== "execution_verified" || gate3.passFail !== true) fail("Gate 3 receipt status drift");
  const landedCycleTwin = gate3.d7Analogue.cycleTwinVerification;
  if (landedCycleTwin.verified !== 0 || landedCycleTwin.perEdge.length !== 7) fail("landed cycle-twin census drift");

  // ---- V-D7D-1: domain re-derivation (masks-only region) -------------------
  const { domain, facts, anchorIcVectors, satelliteIcVectors } = deriveInstanceFacts(ledgerRows, mesh);
  const factByKey = new Map(facts.map((fact) => [fact.key, fact]));
  const instanceKeys = domain.instanceKeys.slice().sort((left, right) => {
    const [la, ls] = left.split(":").map(Number);
    const [ra, rs] = right.split(":").map(Number);
    return la - ra || ls - rs;
  });
  if (instanceKeys.length !== 36 || facts.length !== 36) fail(`derived domain size drift: ${instanceKeys.length}`);

  const allLedgerReach = deriveAllLedgerReach(domain.anchorRows, ledgerRows);
  const d6TierReach = deriveTierReach(domain.anchorRows, ledgerRows, "D6", null);
  const perAnchorCounts = domain.perAnchor.map((entry) => `${entry.anchor}:${entry.count}`);
  if (canonicalText(perAnchorCounts) !== canonicalText(["127:4", "2111:5", "3103:6", "3599:6", "3847:6", "3971:5", "4033:4"])) {
    fail("per-anchor reach structure drift");
  }
  if (allLedgerReach.some((entry) => entry.count !== 30)) fail("all-ledger reach is not uniform at 30");
  const multiplicityBuckets = {};
  for (const state of domain.distinctStates) {
    const bucket = String(domain.multiplicity.get(state));
    multiplicityBuckets[bucket] = (multiplicityBuckets[bucket] ?? 0) + 1;
  }

  // ---- comparison-region labels (the evaluation target) --------------------
  const officeByState = new Map(ledgerRows.map((row) => [String(row.id), row.office]));
  const officeIndexByState = new Map(ledgerRows.map((row) => [String(row.id), Number(row.officeIndex)]));
  const orientationByState = new Map(ledgerRows.map((row) => [String(row.id), row.orientation]));
  const d6SatelliteStates = domain.satelliteRows.map((row) => String(row.id));
  const d6Classes = {};
  for (const row of domain.satelliteRows) d6Classes[row.forte] = (d6Classes[row.forte] ?? 0) + 1;
  if (Object.keys(d6Classes).length !== 1 || d6Classes["7-2"] !== 14 || domain.satelliteRows.some((row) => row.forte !== "7-2")) {
    fail("D6 satellite class census drift (the D6 partition must be class-pure)");
  }
  const class72Ids = ledgerRows.filter((row) => row.forte === "7-2").map((row) => String(row.id)).sort(cmp);
  if (canonicalText(class72Ids) !== canonicalText(d6SatelliteStates.slice().sort(cmp))) {
    fail("D6-satellite partition is not set-equal to the 7-2 ledger class");
  }

  // the landed recorded relation (ground truth: the network's seat contacts)
  const contactRows = network.d7SeatContactRows.map((row) => ({
    id: String(row.id),
    satellite: String(row.source),
    anchor: String(row.target),
    phaseDelta: String(row.phaseDelta),
  }));
  if (contactRows.length !== 14) fail(`contact census drift: ${contactRows.length}`);
  const contactKeys = contactRows.map((row) => `${row.anchor}:${row.satellite}`).sort((left, right) => {
    const [la, ls] = left.split(":").map(Number);
    const [ra, rs] = right.split(":").map(Number);
    return la - ra || ls - rs;
  });
  const actualSet = new Set(contactKeys);
  const officeEqualKeys = instanceKeys.filter((key) => officeByState.get(key.split(":")[0]) === officeByState.get(key.split(":")[1]));
  if (canonicalText(contactKeys) !== canonicalText(officeEqualKeys)) {
    fail("recorded subset (same-office) is not set-equal to the seat-contact rows");
  }
  if (actualSet.size !== 14) fail(`recorded census drift: ${actualSet.size}`);
  const unrecordedSet = new Set(instanceKeys.filter((key) => !actualSet.has(key)));
  const deltaCounts = {};
  for (const key of unrecordedSet) {
    const [anchor, satellite] = key.split(":");
    const delta = String(((officeIndexByState.get(satellite) - officeIndexByState.get(anchor)) + 7) % 7);
    deltaCounts[delta] = (deltaCounts[delta] ?? 0) + 1;
  }
  if (canonicalText(deltaCounts) !== canonicalText({ "2": 11, "5": 11 })) fail("remainder delta structure drift");

  // landed domain comparisons (BL-068 + BL-070, both fingerprint self-checked)
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
  if (!bl068SetEqual) fail("derived domain is not set-equal to the BL-068 availability domain");
  const bl070SetEqual = canonicalText(bl070Keys) === canonicalText(instanceKeys);
  if (!bl070SetEqual) fail("derived domain is not set-equal to the BL-070 derived domain");
  if (bl068.census.availabilityDomain.domainSize !== 36 || bl068.census.gate0.contactsSubsetOfAvailability !== true) {
    fail("BL-068 reference block drift");
  }

  const domainVerification = {
    definition: "D1: the D7/D6 anchor-satellite partition from the ledger role/tier fields (canonical-read, labelled); D2: the Hamming-2 reach of the partition (masks only). The office field is not read here",
    partition: {
      anchors: domain.anchorRows.map((row) => String(row.id)),
      satellites: d6SatelliteStates,
      anchorCount: domain.anchorRows.length,
      satelliteCount: domain.satelliteRows.length,
      classPurity: "the D6 partition is class-pure (all 14 satellites are 7-2); set-equality with the 7-2 ledger class verified in the comparison region",
    },
    perAnchor: domain.perAnchor.map((entry) => ({ anchor: entry.anchor, instances: entry.instances, count: entry.count })),
    domainSize: instanceKeys.length,
    distinctStates: domain.distinctStates.length,
    multiplicity: multiplicityBuckets,
    calibration: {
      allLedgerReachPerAnchor: allLedgerReach,
      allLedgerReachUniform: allLedgerReach.every((entry) => entry.count === 30),
      d6TierReachPerAnchor: d6TierReach,
      note: "the all-ledger Hamming-2 reach is uniform (30 per anchor); the per-anchor 4/5/6/6/6/5/4 asymmetry is the D6-satellite projection of that uniform reach - the asymmetry is emergent, never an input",
    },
    setEquality: {
      bl068SetEqual,
      bl068DomainSize: bl068.census.availabilityDomain.domainSize,
      bl070SetEqual,
      bl070DomainSize: bl070.domainDerivation.domainSize,
      contactsSubsetOfDerivedDomain: contactKeys.every((key) => instanceKeys.includes(key)),
    },
    recordedRelation: {
      recordedCount: actualSet.size,
      unrecordedCount: unrecordedSet.size,
      deltaCounts,
      note: "the recorded/unrecorded labels and the office deltas are the evaluation target (comparison region); the derivation above reads none of them",
    },
    nonCircularity: "the domain block reads no office, class, or network record: the partition is role/tier only; set-equality with the 7-2 class and with the landed availability domains is verified in the comparison region",
  };

  // ---- V-D7D-2: calibration (R-OFF, comparison-region control) -------------
  const rOffPredicate = (key) => {
    const [anchor, satellite] = key.split(":");
    return officeByState.get(anchor) === officeByState.get(satellite);
  };
  const calibrationConfusion = confusion(instanceKeys, actualSet, rOffPredicate);
  if (!isClean(calibrationConfusion)) {
    fail("calibration failed: the office-field rule does not reproduce the 14 contacts on the verified domain - the domain is wrong, not the rule");
  }
  const calibration = {
    gate: "V-D7D-2",
    rule: {
      id: "R-OFF",
      expression: "[office(s) = office(h)]",
      region: "comparison (labelled): the office field is the calibration target, never a derivation input",
      role: "the control: the office-field rule the mask-geometric candidates must match if the derivation succeeds; licensed for calibration and evaluation only",
    },
    actualRelation: {
      source: "canonical/universal-network-data.json d7SeatContactRows (the landed relation)",
      count: actualSet.size,
      note: "the recorded relation is read from the network; the office-equality predicate is evaluated against it, not against its own definition",
    },
    confusion: calibrationConfusion,
    verdict: "CLEAN_SPLIT",
    exact: true,
    setEquality: "the office-equality subset of the derived domain is set-equal to the landed seat-contact rows (checked key-by-key)",
    licence: "if R-OFF failed on the verified domain, the domain would be wrong, not the rule",
  };

  // ---- V-D7D-3: the battery (C-M1..C-M9 verbatim; OD-N1) -------------------
  const expectedVerdicts = {
    "C-M1": "NON_SEPARATING",
    "C-M2": "NON_SEPARATING",
    "C-M3": "NEAR_MISS_BOUNDARY",
    "C-M4": "NON_SEPARATING",
    "C-M5": "NEAR_MISS_BOUNDARY",
    "C-M6": "NON_SEPARATING",
    "C-M7": "NON_SEPARATING",
    "C-M8": "NON_SEPARATING",
    "C-M9": "NON_SEPARATING",
  };
  const orientationRule = {
    id: "C-M7",
    family: "orientation",
    tier: "canonical-read (labelled): the ledger's orientation label",
    ruleSummary: "the chiral orientation label (A/B balance recorded as a symmetry, not a selector)",
    expectation: "NON_SEPARATING as predicate; record the balance",
    evidence: "the canonical orientation labels (labelled canonical-read; the predicate is defined in the comparison region by design)",
    subRules: [
      {
        name: "orientationA",
        expression: "[satellite orientation = A]",
        predicate: (key) => orientationByState.get(key.split(":")[1]).endsWith(" A"),
        shape: "7/11/7/11; every anchor's recorded pair is one A + one B; the remainder is A/B-balanced",
      },
    ],
  };
  const maskDefinitions = new Map(buildMaskGeometricPredicates(domain, factByKey).map((definition) => [definition.id, definition]));
  const candidateDefinitions = ["C-M1", "C-M2", "C-M3", "C-M4", "C-M5", "C-M6", "C-M7", "C-M8", "C-M9"]
    .map((id) => (id === "C-M7" ? orientationRule : maskDefinitions.get(id)));
  const candidates = candidateDefinitions.map((definition) => {
    const subRules = definition.subRules.map((subRule) => {
      const matrix = confusion(instanceKeys, actualSet, subRule.predicate);
      return { name: subRule.name, expression: subRule.expression, confusion: matrix, verdict: verdictOf(matrix), shape: subRule.shape };
    });
    const observedVerdict = subRules.some((subRule) => subRule.verdict === "CLEAN_SPLIT")
      ? "CLEAN_SPLIT"
      : subRules.some((subRule) => subRule.verdict === "NEAR_MISS_BOUNDARY")
        ? "NEAR_MISS_BOUNDARY"
        : subRules.some((subRule) => subRule.verdict === "ANTI_SEPARATING")
          ? "ANTI_SEPARATING"
          : "NON_SEPARATING";
    return {
      ...definition,
      subRules,
      observedVerdict,
      expectedVerdict: expectedVerdicts[definition.id],
      expectationHeld: observedVerdict === expectedVerdicts[definition.id],
    };
  });

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
  for (const candidate of candidates) {
    candidate.distributions = Object.fromEntries(Object.entries(distributionsOf[candidate.id]).map(([name, valueOf]) => [
      name,
      histogram(instanceKeys, actualSet, valueOf),
    ]));
  }
  const cM4 = candidates.find((candidate) => candidate.id === "C-M4");
  cM4.stateCensus = domain.distinctStates.map((state) => ({
    state,
    office: officeByState.get(state),
    sign: factByKey.get(`${domain.perAnchor.find((entry) => entry.instances.includes(state)).anchor}:${state}`).sign,
  }));
  const cM6 = candidates.find((candidate) => candidate.id === "C-M6");
  cM6.anchorIcVectors = anchorIcVectors;
  cM6.satelliteIcVectors = satelliteIcVectors;
  const cM9 = candidates.find((candidate) => candidate.id === "C-M9");
  cM9.stateCensus = domain.distinctStates.map((state) => ({ state, parentCount: domain.parentCounts.get(state), multiplicity: domain.multiplicity.get(state) }));

  const cleanSplitCount = candidates.filter((candidate) => candidate.observedVerdict === "CLEAN_SPLIT").length;
  const nearMissCandidates = candidates.filter((candidate) => candidate.observedVerdict === "NEAR_MISS_BOUNDARY").map((candidate) => candidate.id);
  const expectationsHeld = candidates.filter((candidate) => candidate.expectationHeld).length;
  const battery = {
    preRegisteredIds: ["C-M1", "C-M2", "C-M3", "C-M4", "C-M5", "C-M6", "C-M7", "C-M8", "C-M9"],
    candidates,
    summary: {
      cleanSplitCount,
      nearMissCandidates,
      expectationsHeld,
      verdict: "NO_PRE_REGISTERED_CLEAN_SPLIT",
      expectationVsObserved: expectationsHeld === 9
        ? "all nine pre-registered replication expectations held"
        : `the re-test diverges from the landed battery: ${9 - expectationsHeld} candidate expectation(s) did not hold; the mismatch is the finding (see comparison)`,
      noAdditions: "the battery is the pre-registered set (OD-N1): C-M1..C-M9 verbatim from the landed BL-070 definitions; no candidate was added, removed, or re-thresholded",
    },
  };

  // ---- near-miss anatomy (re-derived) --------------------------------------
  const nearMissRules = ["C-M3.r1 (absPcSumDeltaOne)", "C-M5.r1 (absLinearDisplacementOne)"];
  const selectedKeys = instanceKeys.filter((key) => factByKey.get(key).dPcSum === 1);
  const missedKeys = instanceKeys.filter((key) => actualSet.has(key) && factByKey.get(key).dPcSum !== 1);
  if (selectedKeys.length !== 12 || canonicalText(missedKeys) !== canonicalText(["127:253", "4033:2017"])) {
    fail("near-miss anatomy drift");
  }
  const nearMiss = {
    candidates: nearMissRules,
    named: "NEAR_MISS_BOUNDARY",
    confusion: confusion(instanceKeys, actualSet, (key) => factByKey.get(key).dPcSum === 1),
    selectedKeys,
    selectedAnatomy: "all instances with |pcSum(anchor) - pcSum(satellite)| = 1 (equivalently |single-pitch displacement| = 1): the single-semitone substitutions",
    missedKeys: missedKeys.map((key) => ({
      key,
      dPcSum: factByKey.get(key).dPcSum,
      displacementLinear: factByKey.get(key).displacementLinear,
      parentCount: factByKey.get(key).parentCount,
    })),
    missIdentity: "the two missed contacts are exactly the terminal tritone contacts: 127:253 (Jupiter) and 4033:2017 (Mars), the first and last anchors of the modal orbit; both are single-pitch substitutions at tritone distance (+6) and both are reach-singletons",
    nonContactShape: "every one of the 22 non-contacts has |dPcSum| in {4,6} (12 at 4, 10 at 6); no non-contact sits at |dPcSum| <= 3",
    rulingNote: "OD-N1/OD-N2 carried: the near-miss is recorded with its anatomy and the two misses named; no tie-break promotion without a mechanism argument (the OD-66-2 / OD-70-5 bar)",
  };

  // ---- combination candidate (recorded, un-promoted; OD-N2) ----------------
  const combinationPredicate = (key) => factByKey.get(key).dPcSum === 1 || factByKey.get(key).parentCount === 1;
  const combinationConfusion = confusion(instanceKeys, actualSet, combinationPredicate);
  if (!isClean(combinationConfusion)) fail("combination candidate is not clean; disclosure block drift");
  const combination = {
    id: "C-TB-R1",
    expression: "[|pcSum(anchor) - pcSum(satellite)| = 1] or [reach-singleton: parentCount(satellite) = 1] (the min-|delta| + reach-census composite; the BL-070 C-TB-1 form)",
    confusion: combinationConfusion,
    status: "UNPROMOTED_DISCOVERY",
    ruling: "OD-N2 (approved): at most one disjunctive census composite is pre-registered; it is recorded, never promoted, without a mechanism argument (the OD-66-2 / OD-70-5 bar)",
    branchEffect: "none - the branch classification uses the pre-registered C-M battery only; a promotion ruling would be a new decision",
    mechanism: "none offered; separation is not derivation; the mechanism question remains BL-072",
  };

  // ---- invariants (re-verified) --------------------------------------------
  const inversionPairs = deriveInversionPairing(domain.satelliteRows);
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
  const invariantCrossCheck = (() => {
    const bl068Pairs = bl068.invariants.pairs;
    if (bl068Pairs.length !== 7 || bl068Pairs.some((pair) => pair.officeSum !== "6" || pair.statusShared !== true)) {
      fail("BL-068 invariant block drift");
    }
    const landedPairSet = new Set(bl068Pairs.map((pair) => [pair.a, pair.b].sort(cmp).join("|")));
    return invariantPairs.every((pair) => landedPairSet.has([pair.a, pair.b].sort(cmp).join("|")));
  })();
  if (!invariantCrossCheck) fail("derived inversion pairing differs from the landed BL-068 pairing");
  const invariants = {
    definition: "the two pole-universal invariants tested on the ti-pole's domain: inversion-invariance (whole-pair selection; status shared within pairs) and office-linking (pair offices sum to 6 mod 7)",
    pairs: invariantPairs,
    pairCount: invariantPairs.length,
    allInClass: domain.distinctStates.every((state) => class72Ids.includes(state)),
    allSumsSix: invariantPairs.every((pair) => pair.officeSum === "6"),
    allStatusShared: invariantPairs.every((pair) => pair.statusShared),
    allOrientationComplementary: invariantPairs.every((pair) => pair.orientations.length === 2),
    verdict: "INVARIANTS_OBEYED",
    derivationRespect: {
      statement: "the derived domain's state set is inversion-closed (7 whole pairs); the state-level rules (near-miss, Z-majority, reach census, combination) select whole pairs; the constant rules select none or all (trivially whole-pair); no rule splits an inversion pair",
      wholePairSelection: true,
      mechanicallyVerified: true,
    },
    evidence: "masks-only pairing (12-bit inversion) + comparison office sums; cross-checked against the BL-068 invariant block (7 pairs, status shared, sums 6)",
  };

  const candidateStateClosure = (() => {
    const partnerOf = new Map();
    for (const [left, right] of inversionPairs) { partnerOf.set(left, right); partnerOf.set(right, left); }
    const closed = (stateSet) => [...stateSet].every((state) => stateSet.has(partnerOf.get(state)));
    const statesWhere = (predicate) => new Set(instanceKeys.filter((key) => predicate(factByKey.get(key))).map((key) => key.split(":")[1]));
    return {
      nearMiss: closed(new Set(selectedKeys.map((key) => key.split(":")[1]))),
      combination: closed(statesWhere((fact) => fact.dPcSum === 1 || fact.parentCount === 1)),
      zMajority: closed(statesWhere((fact) => fact.sign < 0)),
      reachCensusOne: closed(statesWhere((fact) => fact.parentCount === 1)),
      reachCensusTwo: closed(statesWhere((fact) => fact.parentCount === 2)),
      domain: closed(new Set(domain.distinctStates)),
      mechanicallyVerified: true,
    };
  })();
  if (Object.entries(candidateStateClosure).some(([key, value]) => key !== "mechanicallyVerified" && value !== true)) {
    fail("whole-pair selection check failed");
  }

  // ---- orbital rotation (landed bytes re-read) ------------------------------
  const successor = new Map(network.d7ModalRows.map((row) => [String(row.source), String(row.target)]));
  const orbitEdges = [];
  let current = "127";
  for (let step = 0; step < 7; step += 1) {
    const next = successor.get(current);
    if (!next) fail(`modal orbit dead-end at ${current}`);
    orbitEdges.push({ a: current, b: next });
    current = next;
  }
  if (current !== "127") fail("modal orbit does not close");
  const maskById = domain.maskById;
  const perEdge = orbitEdges.map((edge) => {
    const intervals = rotationRelations(maskById.get(edge.a), maskById.get(edge.b));
    const landed = landedCycleTwin.perEdge.find((entry) => String(entry.a) === edge.a && String(entry.b) === edge.b);
    if (!landed) fail(`landed cycle-twin edge missing: ${edge.a}->${edge.b}`);
    if (landed.rotateInterval !== (intervals[0] ?? null)) fail(`cycle-twin interval disagrees with the landed bytes at ${edge.a}->${edge.b}`);
    if (intervals.length !== 1) fail(`orbit edge is not an exact rotation at ${edge.a}->${edge.b}`);
    return { a: edge.a, b: edge.b, rotateInterval: intervals[0], landedRotateInterval: landed.rotateInterval, exact: true };
  });
  const intervalHistogram = perEdge.reduce((acc, edge) => { acc[edge.rotateInterval] = (acc[edge.rotateInterval] ?? 0) + 1; return acc; }, {});
  if (canonicalText(intervalHistogram) !== canonicalText({ "11": 6, "6": 1 })) fail("orbit rotation interval histogram drift");
  const orbitalRotation = {
    source: "qa/d4-r2-execution-receipt.json d7Analogue.cycleTwinVerification.perEdge (landed bytes, matched interval-by-interval) + independent mask recomputation",
    perEdge,
    exactRotationCount: perEdge.length,
    intervalHistogram,
    d4VerificationIntervals: [1, 2],
    landedVerifiedAtD4Intervals: landedCycleTwin.verified,
    refinement: "the modal orbit is an exact rotation orbit: rotateMaskZ12^11 for six steps and rotateMaskZ12^6 for the closure step 4033->127 (the closure interval absorbs the root-normalization offset). The landed 0/7 count is interval-class-specific: it verifies the D4 route's intervals {1,2} and does not test the orbit's own intervals. The recorded obstruction 'cycle-twin non-closure' is precise as an interval-transport failure (the D4 twin relation does not transport), not as an absence of rotational structure on the ti-pole",
    corridorLabel: "bounded refinement of the landed obstruction; planning evidence only; D7 hypothesis-tier unchanged; no corridor movement; re-verified by the re-test",
  };

  // ---- direction ------------------------------------------------------------
  const uniqueHubKeys = instanceKeys.filter((key) => factByKey.get(key).parentCount === 1);
  const direction = {
    rule: "the contact direction is anchor -> contact (h -> s) by the domain construction; the seat-contact relation is evaluated anchor->contact",
    tier: "structural (canonical-read, labelled) + unique-hub (masks-only)",
    uniqueHub: {
      resolved: uniqueHubKeys.length,
      keys: uniqueHubKeys,
      note: "the reach-singleton states resolve their parent masks-only; they are exactly the two near-miss misses",
    },
    total: 14,
  };

  // ---- comparison: the side-by-side against the landed battery (OD-N1) -----
  const sideBySide = bl070.battery.candidates.map((original) => {
    const retest = candidates.find((candidate) => candidate.id === original.id);
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
    const distributionMatch = canonicalText(retest.distributions) === canonicalText(original.distributions);
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
    perAnchorMatch: canonicalText(domain.perAnchor.map((entry) => ({ anchor: entry.anchor, count: entry.count })))
      === canonicalText(bl070.domainDerivation.perAnchor.map((entry) => ({ anchor: entry.anchor, count: entry.count }))),
    domainSizeMatch: instanceKeys.length === bl070.domainDerivation.domainSize,
    distinctStatesMatch: domain.distinctStates.length === bl070.domainDerivation.distinctStates,
    multiplicityMatch: canonicalText(multiplicityBuckets) === canonicalText(bl070.domainDerivation.multiplicity),
  };
  const nearMissComparison = {
    confusionMatch: canonicalText(bl070.nearMiss.confusion) === canonicalText(nearMiss.confusion),
    selectedMatch: canonicalText(bl070.nearMiss.selectedKeys) === canonicalText(nearMiss.selectedKeys),
    missedMatch: canonicalText(bl070.nearMiss.missedKeys.map((miss) => miss.key)) === canonicalText(nearMiss.missedKeys.map((miss) => miss.key)),
  };
  const combinationComparison = {
    confusionMatch: canonicalText(bl070.tieBreakCandidate.confusion) === canonicalText(combination.confusion),
    note: "the landed C-TB-1 form and the pre-registered C-TB-R1 form are the same composite (min-|delta| + reach-singleton); the comparison is confusion-level",
  };
  const bl068ZAxis = bl068.axes.find((axis) => axis.axis === "zInterface");
  const landedAxesCheck = {
    zInterface: {
      bl068Confusion: bl068ZAxis.confusion,
      retestConfusion: cM4.subRules[0].confusion,
      match: canonicalText(bl068ZAxis.confusion) === canonicalText(cM4.subRules[0].confusion),
    },
  };
  const allMatch = sideBySide.every((entry) => entry.match)
    && Object.values(domainComparison).every((value) => value === true)
    && nearMissComparison.confusionMatch && nearMissComparison.selectedMatch && nearMissComparison.missedMatch
    && combinationComparison.confusionMatch
    && landedAxesCheck.zInterface.match;
  const comparison = {
    baseline: {
      bl068: {
        artifact: BL068_PATH,
        derivationFingerprint: bl068Fingerprint,
        axes: bl068.axes.map((axis) => ({ axis: axis.axis, rule: axis.rule, verdict: axis.verdict, confusion: axis.confusion })),
        synthesisVerdict: bl068.synthesis.verdict,
      },
      bl070: {
        artifact: BL070_PATH,
        derivationFingerprint: bl070Fingerprint,
        branch: bl070.branch.label,
        cleanSplitCount: bl070.battery.summary.cleanSplitCount,
        nearMissCandidates: bl070.battery.summary.nearMissCandidates,
      },
      note: "the comparison baseline is the landed battery (BL-070) and the landed axes (BL-068) - not the phase-C probes (OD-N1); both artifacts are consumed by fingerprint self-check, never rewritten",
    },
    domainComparison,
    sideBySide,
    nearMissComparison,
    combinationComparison,
    landedAxesCheck,
    allMatch,
    verdict: allMatch ? "REPLICATED" : "DIVERGED",
    interpretation: allMatch
      ? "REPLICATED: the re-test (region-scoped isolation, re-verified domain) reproduces the landed battery exactly - every confusion matrix, verdict, and distribution, the near-miss anatomy, the composite arithmetic, and the BL-068 zInterface axis match. The original investigation's candidates are robust under the stricter enforcement; the isolation regime did not change what the candidates could see. The R-NONE finding stands: the office field is the selection's ground (OD-N3 framing)"
      : "DIVERGED: the re-test differs from the landed battery - the difference is the finding. The isolation regime changed what the candidates could see, which means the original candidates were reading the office field through a correlated channel; the mismatched candidates/sub-rules are named in sideBySide and the channel question (which channel, does it survive the isolation) is the follow-on",
    replicationDiscipline: "pre-registered (OD-N1): the comparison baseline is the landed BL-070 C-M battery (per candidate, per sub-rule, per distribution) and the BL-068 axes; a different result means the candidates changed, not the test's conditions",
  };

  // ---- V-D7D-4: isolation (the region-scoped enforcement block) ------------
  const isolation = {
    regime: "region-scoped",
    intrinsicRegion: "the marked INTRINSIC-RETEST region: the D1 partition (role/tier fields), the pitch sets, the mask geometry, and the containment mesh; the eight mask-geometric candidate predicate definitions (C-M1..C-M6, C-M8, C-M9) are defined here",
    comparisonRegion: "the labelled region after the intrinsic markers: the recorded/unrecorded status labels (office equality), the R-OFF calibration, the C-M7 orientation label, the invariant office sums, and the baseline artifact reads",
    officeBytesInDerivationPath: 0,
    officeReads: [
      "the recorded/unrecorded status labels (evaluation only; the target)",
      "the R-OFF calibration predicate (comparison-region control)",
      "C-M7 orientation: not the office field (canonical-read, labelled)",
      "the invariant office sums (comparison)",
      "the BL-068/BL-070 baseline reads (fingerprint self-checked)",
    ],
    statements: [
      "the derivation path (domain construction + the eight mask-geometric candidate predicates) reads zero granted-office bytes: no office index, no office field, no relational office in the intrinsic region",
      "R-OFF is the calibration control, never the primary derivation: it reproduces the 14 contacts by definition and is licensed only as the regression the mask-geometric rules must match",
      "the region-scoping proof: the validator's static check requires the forbidden office tokens to be absent from the intrinsic region and present in the comparison region - a file-scoped scan is rejected by construction",
    ],
    validatorDiscipline: "two-sided: smuggled office/class/network reads injected into the intrinsic region are rejected; a permissive probe injected into the comparison region is not rejected; a strip of the comparison-region office read is rejected (the region-scoping proof fails)",
  };

  // ---- gates ----------------------------------------------------------------
  const domainGatePass = domainVerification.domainSize === 36 && bl068SetEqual && bl070SetEqual;
  const selectionGatePass = cleanSplitCount > 0;
  const gates = {
    "V-D7D-1": {
      result: domainGatePass ? "PASS" : "FAIL",
      statement: "domain verification: the D1 role/tier partition + D2 Hamming-2 reach re-derive the 36-instance domain (per-anchor 4/5/6/6/6/5/4, 14 distinct states, multiplicities 2/2/10); set-equal to the landed BL-068 availability domain and the landed BL-070 derived domain key-by-key; calibration control: the all-ledger reach is uniform at 30 per anchor",
    },
    "V-D7D-2": {
      result: "PASS",
      statement: "calibration: R-OFF ([office(s) = office(h)], comparison-region) reproduces the 14 landed contacts exactly on the verified domain (14/0/0/22; office-equality subset set-equal to the seat-contact rows); the control's license holds - a calibration failure would mean the domain is wrong, not the rule",
    },
    "V-D7D-3": {
      result: selectionGatePass ? "PASS" : "FAIL",
      statement: `candidate testing: ${cleanSplitCount} of the nine pre-registered candidates cleanly separates the 14 contacts (CLEAN_SPLIT 14/0/0/22); the best pre-registered result is the near-miss 12/0/2/22 (${nearMissCandidates.join(", ")}). The pre-registered consequence of FAIL is the PARTIAL_DERIVATION branch, not a build halt (the OD-70-3 criteria carried)`,
    },
    "V-D7D-4": {
      result: "PASS",
      statement: "input isolation: region-scoped enforcement - zero office bytes in the derivation path; the eight mask-geometric candidate predicates are defined inside the statically checked intrinsic region; smuggled-read probes rejected; the comparison-region permissive probe passes and the region-scoping proof holds; R-OFF and C-M7 are labelled comparison-region reads",
    },
    "V-D7D-5": {
      result: "PASS",
      statement: "accounting: the three tiers (masks-only / canonical-computation labelled / remaining granted) are complete and honest; the office field appears only as the evaluation target, the calibration control, and the remaining-granted tier",
    },
  };

  // ---- branch classification (pre-registered labels) ------------------------
  const branchLabel = !domainGatePass
    ? "NO_DERIVATION"
    : selectionGatePass
      ? "FULL_DERIVATION"
      : "PARTIAL_DERIVATION";
  const branch = {
    preRegisteredLabels: ["FULL_DERIVATION", "PARTIAL_DERIVATION", "NO_DERIVATION"],
    criteria: {
      full: "V-D7D-1 PASS and V-D7D-2 PASS (calibration EXACT) and some pre-registered C-M rule CLEAN_SPLIT (V-D7D-3 PASS) and V-D7D-4/5 PASS",
      partial: "V-D7D-1 PASS and V-D7D-2 PASS and V-D7D-3 FAIL (no pre-registered C-M rule CLEAN_SPLIT)",
      no: "V-D7D-1 FAIL (the domain does not re-derive masks-only) or V-D7D-2 FAIL (calibration: the domain is wrong, not the rule)",
    },
    gateResults: {
      "V-D7D-1": gates["V-D7D-1"].result,
      "V-D7D-2": gates["V-D7D-2"].result,
      "V-D7D-3": gates["V-D7D-3"].result,
      "V-D7D-4": gates["V-D7D-4"].result,
      "V-D7D-5": gates["V-D7D-5"].result,
    },
    label: branchLabel,
    statement: branchLabel === "PARTIAL_DERIVATION"
      ? `PARTIAL_DERIVATION: the domain (36 instances, per-anchor 4/5/6/6/6/5/4) re-derives masks-only; the pre-registered battery carries no clean mask-geometric selector (nine candidates; best = near-miss 12/0/2/22). The sole clean separator remains office identity (14/0/0/22, comparison-only): the selection is office-field-dependent. The re-test replicated the landed battery under the region-scoped isolation (comparison verdict ${comparison.verdict}). The composite C-TB-R1 is recorded un-promoted (OD-N2) and does not alter the branch`
      : branchLabel === "FULL_DERIVATION"
        ? "FULL_DERIVATION: a pre-registered mask-geometric rule cleanly generates the 14 contacts under the re-test"
        : "NO_DERIVATION: the domain itself does not re-derive masks-only, or the calibration failed",
    classificationDiscipline: "the label is a classification against the pre-registered gate list: the battery is the search, the branch table is the verdict; no unregistered hunting on failure",
  };

  const interpretation = cleanSplitCount === 0
    ? {
      branch: "R_NONE",
      statement: comparison.verdict === "REPLICATED"
        ? "R-NONE fires: no mask-geometric candidate discriminates same-office from cross-office; the office field is the selection's ground and joins the anchoring remainder - confirmed by the stricter re-test (comparison verdict REPLICATED)"
        : "R-NONE fires at the re-test level; the comparison verdict DIVERGED - the divergence itself is the finding (the candidates were reading an office-correlated channel; see comparison.sideBySide)",
      framing: "OD-N3 (approved): not a wall-dissolution claim; not a governs-admission claim; the scoping memo 5.1 contrast reading stays intact",
    }
    : {
      branch: "R_CLEAN",
      statement: "a mask-geometric rule cleanly separates: the D7 contact relation is derivable masks-only under the re-test; the fa/ti asymmetry is fully explained (both predicates mask-derivable); the corridor-amendment question opens (separately gated)",
      framing: "OD-N3 framing not fired; the full-derivation branch carries its own pre-registered consequences",
    };

  // ---- accounting ------------------------------------------------------------
  const accounting = {
    masksOnly: [
      "domain construction D1+D2: the role/tier partition's Hamming-2 reach - 36 instances, per-anchor 4/5/6/6/6/5/4 (emergent), 14 distinct states, multiplicities 2/2/10; set-equal to the landed BL-068 and BL-070 domains",
      "calibration: the all-ledger reach is uniform (30 per anchor); the per-anchor asymmetry is the partition projection, not an input",
      "the eight mask-geometric candidate predicate definitions (C-M1..C-M6, C-M8, C-M9; masks; C-M1/C-M4 additionally the containment mesh), defined inside the statically checked intrinsic region",
      "near-miss anatomy, the reach census, and the combination arithmetic (recorded, un-promoted)",
      "inversion pairing, interval-class counts, rotation relations, and the orbit rotation intervals (given the recorded orbit order)",
    ],
    canonicalComputation: [
      "the D1 partition itself: the ledger's role/tier fields (canonical-read, labelled)",
      "recorded/unrecorded status labels and the office deltas: office fields read for evaluation only (the target, never an input)",
      "R-OFF calibration: the office-field rule evaluated against the landed relation (the comparison-region control)",
      "C-M7 orientation: the canonical orientation label (labelled)",
      "the invariant office sums (comparison)",
      "the modal orbit order and closure (the network's recorded modal edges; labelled)",
      "the BL-068/BL-070 baseline artifact reads (fingerprint self-checked; comparison)",
    ],
    remainingGranted: [
      "the D7/D6 anchor-satellite partition membership (the domain's members are the ledger's marking)",
      "the office field as the selection's ground (R-NONE: no mask-geometric rule separates, replicated under the region-scoped isolation; the sole clean domain separator remains office identity)",
      "the modal orbit record (order, closure); the orientation bit (BL-065, labels only); presentation conventions",
    ],
    statement: cleanSplitCount === 0
      ? "the domain and the mask-geometric battery are discharged masks-only (V-D7D-1); the selection is not (V-D7D-3 FAIL, PARTIAL_DERIVATION, REPLICATED): the office field remains the selection's ground and joins the anchoring remainder - the honest bounded result of the re-test"
      : "the domain and a clean mask-geometric selector are discharged masks-only (FULL_DERIVATION): the office field is no longer the selection's ground for the D7 contact relation",
  };

  // ---- fences and bounded non-accomplishments ------------------------------
  const fences = {
    d7HypothesisTier: "D7 remains hypothesis-tier throughout: no D7 claim event, no D7 record amendment, no D7 derivation admission; ENTRY 15's D7 clause carries forward verbatim (provenance/DECISION_LEDGER.md:2703-2712)",
    governsAdmission: "none; this re-test characterizes, it does not admit",
    g1Intra330: "untouched",
    inv5: "no INV-5 graduation",
    mWalkability: "no M-walkability promotion; the modal orbit is characterization only",
    canonical: "no canonical/Court/schema/Neo4j writes; all sources read-only",
    d4Record: "no movement: ENTRY 10 immutable, ENTRY 15 unchanged, the D4 derivable-via-R2 amendment untouched",
    membrane: "the frame (scrum/plan/harmonic-comprehension-map.md sections 2.6/2.7) is interpretation vocabulary only; never a probe input, design input, or admitted canon claim",
    sessionProse: "context, not evidence",
    officeIsolation: "the office field is the target, never an input: the intrinsic region reads ledger role/tier fields, pitch sets, and the containment mesh only; any office-field read in the derivation path is a halt (V-D7D-4, region-scoped)",
    domainLabel: "the derived domain is the D6-satellite Hamming-2 reach (role/tier partition + masks); set-equal to the BL-068 availability domain and the BL-070 derived domain",
    retestScope: "BL-070's bytes are frozen: this re-test is a distinct artifact consuming BL-070 and BL-068 by fingerprint self-check only; no landed artifact is rewritten or superseded",
  };

  const contractCitations = [
    "provenance/DECISION_LEDGER.md:2703-2712 (ENTRY 15 D7 clause: 0/14, 14/14 = U = O, cycle-twin 0/7; D7 hypothesis-tier preserved)",
    "orrery/src/generated/bl070-d7-derivation.v1.json (the landed battery: cleanSplitCount 0, near-miss 12/0/2/22, C-TB-1 un-promoted, the orbital-rotation refinement; fingerprint self-checked)",
    "orrery/src/generated/bl068-d7-asymmetry.v1.json (GSL-3; the availability domain 36 = 14 + 22; the axes; the invariant geography; fingerprint self-checked)",
    "qa/d4-r2-execution-receipt.json (d7Analogue: gapNote, cycleTwinVerification.perEdge rotateInterval 11/6; status execution_verified)",
    "scrum/plan/bl-070-d7-derivation-memo.md (the attempt's findings: PARTIAL_DERIVATION, the near-miss anatomy, the tie-break disclosure, OD-70-5/OD-70-6 dispositions)",
    "scrum/plan/bl-068-d7-asymmetry-memo.md (GSL-3; the office-linking clean split; the modal remainder)",
    "scrum/plan/bl-059-governs-derivability-scoping-memo.md:347-364 (the 5.1 accretion: the attempt executed; the selection office-field-dependent; the interval-transport refinement)",
    "scrum/plan/bl-066-r-edge-derivation-memo.md:17-18, 61-69 (the two-sided input-isolation pattern and the three-tier accounting pattern reused here)",
    "canonical/universal-heptatonic-ledger.csv (the 462-record universe: the role/tier partition source), canonical/universal-network-data.json (the seat-contact and modal records; comparison), derived/hypergraph/bipartite-inclusion-v1.json (the containment mesh; C-M1/C-M4)",
    "scrum/BACKLOG.md:1108-1143 (BL-070's landing record) and the approved planning pass 2026-10-12 (OD-N0..OD-N3; the re-test's pre-registration)",
  ];

  const notAccomplished = [
    "no D7 claim event; no D7 record amendment; no D7 derivation admission (hypothesis-tier preserved, ENTRY 15's clause unchanged)",
    "no GOVERNS admission; no derivation admission of any kind",
    "no G1 movement; no INV-5 graduation; no M-walkability promotion",
    "no canonical/Court/schema/Neo4j writes; no ledger writes; no claim event of any kind",
    "no D4-record movement (ENTRY 10 immutable; ENTRY 15 unchanged)",
    "no BL-070 bytes changed (the frozen artifact is consumed by fingerprint self-check only)",
    "no lens application as evidence; the frame is vocabulary, not input; session prose is context, not evidence",
  ];

  // ---- assembly --------------------------------------------------------------
  const core = {
    schemaVersion: SCHEMA_VERSION,
    retestId: RETEST_ID,
    status: "planning_evidence",
    generator: "scripts/build-bl078-d7-retest.mjs",
    role: "the D7 derivation re-test (office-purity route): the BL-070 battery re-run against the re-verified domain under the region-scoped input isolation, with the side-by-side replication comparison; planning evidence, hypothesis-tier",
    preRegistration: {
      rulings: [
        { id: "OD-N0", ruling: "authorized: a new BL-078 probe, not a BL-070 rebuild; BL-070's bytes are frozen (self-checked fingerprint); any new test is a distinct artifact with BL-068/BL-070 as chain anchors" },
        { id: "OD-N1", ruling: "candidate-set scope: C-M1..C-M9 verbatim from the landed BL-070 definitions + the C-TB-R1 composite; the comparison battery prevents silent narrowing/broadening; comparability with the landed cleanSplitCount 0 baseline is the re-test's meaning" },
        { id: "OD-N2", ruling: "combination-rule form: at most one disjunctive census composite ([|delta| = 1] or [reach-singleton]) is pre-registered, recorded UNPROMOTED_DISCOVERY unless a mechanism argument is supplied (the OD-66-2 / OD-70-5 bar)" },
        { id: "OD-N3", ruling: "R-NONE framing: 'the office field as the selection's ground, joins the anchoring remainder' per BL-070 section 10's accounting; not a wall-dissolution claim; not a governs-admission claim; the scoping memo 5.1 contrast reading stays intact" },
      ],
      branchCriteria: {
        full: "V-D7D-1 PASS and V-D7D-2 PASS (calibration EXACT) and some pre-registered C-M rule CLEAN_SPLIT (V-D7D-3 PASS) and V-D7D-4/5 PASS",
        partial: "V-D7D-1 PASS and V-D7D-2 PASS and V-D7D-3 FAIL (no pre-registered C-M rule CLEAN_SPLIT)",
        no: "V-D7D-1 FAIL (the domain does not re-derive masks-only) or V-D7D-2 FAIL (calibration: the domain is wrong, not the rule)",
      },
      comparisonCriteria: {
        replicated: "every per-candidate confusion matrix, verdict, and distribution, the near-miss anatomy, the composite arithmetic, and the BL-068 zInterface axis match the landed results exactly",
        diverged: "any mismatch - the mismatch is the finding: the isolation regime changed what the candidates could see; the mismatched candidates/sub-rules are named per entry",
      },
      buildNotes: [
        "the comparison baseline is the landed BL-070 C-M battery (side-by-side per candidate, per sub-rule, per distribution) and the BL-068 axes - not the phase-C probes (OD-N1)",
        "the region-scoped isolation: the eight mask-geometric candidate predicates are defined inside the statically checked intrinsic region; the office reads live in the comparison region only; the validator proves the scan is region-scoped (permissive probe + proof-strip probe)",
        "the re-test's meaning: identical results = the original findings are robust under the stricter enforcement; differing results = the difference is the finding (an office-correlated channel)",
      ],
    },
    sourceBindings: [
      { artifact: LEDGER_PATH, sha256: fileSha(LEDGER_PATH), role: "462-record canonical universe: the role/tier partition, pitch sets, masks" },
      { artifact: NETWORK_PATH, sha256: fileSha(NETWORK_PATH), role: "the D7 seat-contact and modal records (comparison; the orbit order)" },
      { artifact: MESH_PATH, sha256: fileSha(MESH_PATH), role: "the containment mesh (C-M1/C-M4)" },
      { artifact: BL068_PATH, sha256: fileSha(BL068_PATH), role: "chain anchor + baseline axes: the landed availability domain, axes, invariants (fingerprint self-check)" },
      { artifact: BL070_PATH, sha256: fileSha(BL070_PATH), role: "chain anchor + comparison baseline: the landed battery, near-miss, composite (fingerprint self-check)" },
      { artifact: GATE3_PATH, sha256: fileSha(GATE3_PATH), role: "the landed D7 analogue measurements (cycle-twin per-edge intervals; status execution_verified)" },
    ],
    base: {
      bl068: { artifact: BL068_PATH, derivationFingerprint: bl068Fingerprint },
      bl070: { artifact: BL070_PATH, derivationFingerprint: bl070Fingerprint },
      importPolicy: "the chain artifacts are consumed by fingerprint self-check (no literals in this generator); the landed battery tables are matched per candidate, per sub-rule, and per distribution; BL-070's bytes are never rewritten",
    },
    domainVerification,
    calibration,
    battery,
    comparison,
    nearMiss,
    combination,
    invariants,
    orbitalRotation,
    direction,
    isolation,
    gates,
    branch,
    interpretation,
    accounting,
    fences,
    contractCitations,
    notAccomplished,
  };
  const derivationFingerprint = sha256(canonicalText(core));
  return { ...core, derivationFingerprint };
}

export function serializeDerivation(derivation) {
  return `${canonicalText(derivation)}\n`;
}

function main() {
  const check = process.argv.includes("--check");
  const derivation = buildDerivation();
  const serialized = serializeDerivation(derivation);
  const outputPath = path.join(root, OUTPUT_PATH);
  const summary = {
    output: OUTPUT_PATH,
    check,
    domain: `${derivation.domainVerification.domainSize} instances, per-anchor ${derivation.domainVerification.perAnchor.map((entry) => entry.count).join("/")}, distinct ${derivation.domainVerification.distinctStates}; set-equal BL-068 + BL-070`,
    calibration: `R-OFF ${derivation.calibration.confusion.tp}/${derivation.calibration.confusion.fp}/${derivation.calibration.confusion.fn}/${derivation.calibration.confusion.tn} (${derivation.calibration.verdict})`,
    battery: derivation.battery.candidates.map((candidate) => `${candidate.id}:${candidate.observedVerdict}`).join(" | "),
    nearMiss: `${derivation.nearMiss.confusion.tp}/${derivation.nearMiss.confusion.fp}/${derivation.nearMiss.confusion.fn}/${derivation.nearMiss.confusion.tn} (${derivation.nearMiss.missedKeys.map((miss) => miss.key).join(", ")})`,
    combination: `${derivation.combination.id} ${derivation.combination.confusion.tp}/${derivation.combination.confusion.fp}/${derivation.combination.confusion.fn}/${derivation.combination.confusion.tn} (${derivation.combination.status})`,
    sideBySide: derivation.comparison.sideBySide.map((entry) => `${entry.id}:${entry.match ? "match" : "MISMATCH"}`).join(" | "),
    comparison: derivation.comparison.verdict,
    branch: derivation.branch.label,
    gates: derivation.branch.gateResults,
    derivationFingerprint: derivation.derivationFingerprint,
  };
  if (check) {
    const existing = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, "utf8") : null;
    if (existing !== serialized) throw new Error("STALE_BL078_D7_RETEST");
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
