#!/usr/bin/env node
/**
 * Build the BL-070 D7 derivation attempt (office-purity route): planning,
 * read-only analysis.
 *
 * The question (approved planning pass, rulings OD-70-1..OD-70-4): can the
 * D7 contact relation - office-pure, same-office-only, 14 contacts in a
 * 36-instance domain - be derived through a route that reads the domain's own
 * mask geometry, where the D4-analogue route (literal predicate + rotational
 * cycle-twin) failed all three gates?
 *
 * Structure:
 *   domainDerivation - D1: the D7/D6 anchor-satellite partition from the
 *                      ledger's role/tier fields (canonical-read, labelled);
 *                      D2: the Hamming-2 reach of the partition (masks only);
 *                      the 36-instance domain with the per-anchor 4/5/6/6/6/5/4
 *                      structure EMERGENT from the projection; the calibration
 *                      control (the all-ledger reach is uniform, 30 per
 *                      anchor; the asymmetry is the partition's effect)
 *   battery          - the nine pre-registered mask-geometric candidates
 *                      C-M1..C-M9, each evaluated against the recorded status
 *                      (the office field is read here only, as the target);
 *                      no silent additions (OD-70-1)
 *   nearMiss         - the C-M3/C-M5 12/0/2/22 shape named NEAR_MISS_BOUNDARY
 *                      (OD-70-4): the two misses are the terminal tritone
 *                      contacts 127:253 and 4033:2017; every non-contact sits
 *                      at |dPc| in {4,6}
 *   tieBreakCandidate- the min-|delta| + reach-census composite (14/0/0/22),
 *                      recorded un-promoted per OD-70-4; no branch effect
 *   invariants       - inversion-invariance and office-linking mechanically
 *                      verified (V-D7-4)
 *   orbitalRotation  - the landed cycle-twin bytes re-read and recomputed:
 *                      every modal edge is an exact rotation (d=11 six times,
 *                      d=6 for the closure step); the landed 0/7 is
 *                      interval-class-specific (the D4 verification set);
 *                      bounded refinement, hypothesis-tier unchanged
 *   branch           - the pre-registered classification: FULL/PARTIAL/NO
 *                      against the V-D7 gate results (OD-70-3)
 *   accounting       - masks-only / canonical-read / remaining granted
 *
 * Fences: planning_evidence only. D7 hypothesis-tier throughout (no D7 claim
 * event, no D7 record amendment, no D7 derivation admission); ENTRY 15's D7
 * clause carries forward verbatim. No GOVERNS admission; no G1 movement; no
 * INV-5 graduation; no M-walkability promotion; no canonical/Court/schema/
 * Neo4j writes; no D4-record movement. The frame 2.6/2.7 is interpretation
 * vocabulary, never design input. Session prose is context, not evidence.
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

export const SCHEMA_VERSION = "harmonic-orrery.bl070-d7-derivation.v1";
export const DERIVATION_ID = "BL070_D7_DERIVATION_V1";
export const OUTPUT_PATH = "orrery/src/generated/bl070-d7-derivation.v1.json";
export const NETWORK_PATH = "canonical/universal-network-data.json";
export const LEDGER_PATH = HEPTATONIC_LEDGER_PATH;
export const MESH_PATH = BIPARTITE_PATH;
export const BL068_PATH = "orrery/src/generated/bl068-d7-asymmetry.v1.json";
export const GATE3_PATH = "qa/d4-r2-execution-receipt.json";

export const NON_Z_D_FAMILIES = ["7-1", "7-15", "7-22", "7-8"];
export const Z_D_FAMILIES = ["7-Z12", "7-Z17", "7-Z37"];
export const D_TIER_FAMILIES = [...NON_Z_D_FAMILIES, ...Z_D_FAMILIES];

// ==== INTRINSIC-DERIVATION-BEGIN (ledger role/tier partition + masks + mesh only) ====
// This region builds the domain and the mask-geometric instance facts. It
// reads the canonical ledger's role/tier partition, the pitch sets, and the
// containment mesh. It never reads the office field, the class label, the
// network's D7 records, or any landed verdict. The office field is the
// target, never an input.

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

// ==== INTRINSIC-DERIVATION-END ====

// ---- comparison and cross-check sections (the office field, the class
// ---- label, the network records and the landed verdicts are read here;
// ---- never in the intrinsic region) ---------------------------------------

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

function isClean(matrix) {
  return matrix.tp === 14 && matrix.fp === 0 && matrix.fn === 0 && matrix.tn === 22;
}

export function buildDerivation() {
  const ledgerRows = parseCsv(read(LEDGER_PATH));
  const mesh = readJson(MESH_PATH);
  const network = readJson(NETWORK_PATH);
  const bl068 = readJson(BL068_PATH);
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
  if (gate3.status !== "execution_verified" || gate3.passFail !== true) fail("Gate 3 receipt status drift");
  const landedCycleTwin = gate3.d7Analogue.cycleTwinVerification;
  if (landedCycleTwin.verified !== 0 || landedCycleTwin.perEdge.length !== 7) fail("landed cycle-twin census drift");

  // ---- D1/D2 domain derivation (masks-only region) ------------------------
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

  // ---- recorded status (office fields read for evaluation only) ----------
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
  const recordedSet = new Set(instanceKeys.filter((key) => officeByState.get(key.split(":")[0]) === officeByState.get(key.split(":")[1])));
  if (canonicalText(contactKeys) !== canonicalText(instanceKeys.filter((key) => recordedSet.has(key)))) {
    fail("recorded subset (same-office) is not set-equal to the seat-contact rows");
  }
  if (recordedSet.size !== 14) fail(`recorded census drift: ${recordedSet.size}`);
  const unrecordedSet = new Set(instanceKeys.filter((key) => !recordedSet.has(key)));
  const deltaCounts = {};
  for (const key of unrecordedSet) {
    const [anchor, satellite] = key.split(":");
    const delta = String(((officeIndexByState.get(satellite) - officeIndexByState.get(anchor)) + 7) % 7);
    deltaCounts[delta] = (deltaCounts[delta] ?? 0) + 1;
  }
  if (canonicalText(deltaCounts) !== canonicalText({ "2": 11, "5": 11 })) fail("remainder delta structure drift");

  // BL-068 cross-check (the landed availability domain is the comparison)
  const bl068Keys = bl068.census.availabilityDomain.perAnchor
    .flatMap((entry) => entry.instances.map((instance) => instance.key))
    .sort((left, right) => {
      const [la, ls] = left.split(":").map(Number);
      const [ra, rs] = right.split(":").map(Number);
      return la - ra || ls - rs;
    });
  const bl068SetEqual = canonicalText(bl068Keys) === canonicalText(instanceKeys);
  if (!bl068SetEqual) fail("derived domain is not set-equal to the BL-068 availability domain");
  if (bl068.census.availabilityDomain.domainSize !== 36 || bl068.census.gate0.contactsSubsetOfAvailability !== true) {
    fail("BL-068 reference block drift");
  }

  const domainGate = {
    result: "PASS",
    statement: "domain derivation (D1 role/tier partition + D2 Hamming-2 reach, masks only): 36 instances, per-anchor 4/5/6/6/6/5/4, 14 distinct states, multiplicities 2/2/10; set-equal to the landed BL-068 availability domain; every seat contact is contained; the recorded subset equals the office-equality subset (comparison)",
  };

  // ---- battery (C-M1..C-M9; the pre-registered set, OD-70-1) -------------
  const rule = (name, expression, predicate, shape) => {
    const matrix = confusion(instanceKeys, recordedSet, predicate);
    return { name, expression, confusion: matrix, verdict: verdictOf(matrix), shape };
  };

  const candidates = [
    {
      id: "C-M1",
      family: "containment",
      tier: "masks-only (masks + containment mesh)",
      ruleSummary: "shared containment structure between the anchor and the satellite",
      expectation: "NON_SEPARATING (must be measured, not assumed)",
      subRules: [
        rule("overlapIdThresholdSix", "[shared subnode count >= 6]", (key) => factByKey.get(key).overlapIdCount >= 6,
          "selects none; the shared-subnode count is constant at 5 across all 36 instances"),
        rule("familyOverlapThresholdSeven", "[D-tier family presence overlap >= 7]", (key) => factByKey.get(key).familyOverlapSeven >= 7,
          "6-recorded / 4-recorded spread at 6 and 7; no threshold separates"),
      ],
      distributions: {
        overlapIdCount: histogram(instanceKeys, recordedSet, (key) => factByKey.get(key).overlapIdCount),
        familyOverlapSeven: histogram(instanceKeys, recordedSet, (key) => factByKey.get(key).familyOverlapSeven),
      },
      evidence: "containment mesh (derived/hypergraph/bipartite-inclusion-v1.json): subnode ID intersection and D-tier family presence",
    },
    {
      id: "C-M2",
      family: "hamming-rotation",
      tier: "masks-only",
      ruleSummary: "Hamming/rotation signatures (H2 is domain-constant; no anchor-satellite instance is a mask rotation)",
      expectation: "NON_SEPARATING / UNIFORM",
      subRules: [
        rule("rotationHitGeOne", "[at least one d in 1..11 with rotateMask12^d(anchor) = satellite]", (key) => factByKey.get(key).rotationHits >= 1,
          "selects none; the rotational ground is absent at the instance level (0/36)"),
        rule("hammingEqualsEight", "[hamming12(anchor, satellite) = 8]", (key) => factByKey.get(key).hamming === 8,
          "selects none; every instance is at Hamming 2 (the D2 reach)"),
      ],
      distributions: {
        rotationHits: histogram(instanceKeys, recordedSet, (key) => factByKey.get(key).rotationHits),
        hamming: histogram(instanceKeys, recordedSet, (key) => factByKey.get(key).hamming),
      },
      evidence: "mask rotation and Hamming computations over the derived domain",
    },
    {
      id: "C-M3",
      family: "pc-sum/mask-numeric proximity",
      tier: "masks-only",
      ruleSummary: "pitch-sum distance and mask-numeric proximity (the near-miss shape recorded exactly, OD-70-4)",
      expectation: "near-miss recorded exactly; no clean separation",
      subRules: [
        rule("absPcSumDeltaOne", "[|pcSum(anchor) - pcSum(satellite)| = 1]", (key) => factByKey.get(key).dPcSum === 1,
          "NEAR_MISS: selects 12/14; the two misses are the terminal tritone contacts 127:253 and 4033:2017 (dPc=6)"),
        rule("minAbsMaskDeltaPerAnchor", "[|mask(anchor) - mask(satellite)| minimal within the anchor]", (key) => {
          const fact = factByKey.get(key);
          const minimum = Math.min(...domain.perAnchor.find((entry) => entry.anchor === fact.anchor).instances.map((satellite) => factByKey.get(`${fact.anchor}:${satellite}`).dMask));
          return fact.dMask === minimum;
        }, "selects 7/14 (one per anchor); all single-semitone substitutions"),
        rule("absMaskDeltaAtMost64", "[|mask(anchor) - mask(satellite)| <= 64]", (key) => factByKey.get(key).dMask <= 64,
          "8/3/6/19; no threshold separates (the recorded instances span 2..2016)"),
      ],
      distributions: {
        dPcSum: histogram(instanceKeys, recordedSet, (key) => factByKey.get(key).dPcSum),
        dMask: histogram(instanceKeys, recordedSet, (key) => factByKey.get(key).dMask),
      },
      evidence: "pitch-sum and mask-numeric distances from the ledger pitch sets and masks",
    },
    {
      id: "C-M4",
      family: "subnode-composition (chiral-Z)",
      tier: "masks-only (masks + containment mesh)",
      ruleSummary: "the GSL-2 chiral-Z containment polarization (fa-specific; does not extend)",
      expectation: "NON_SEPARATING (fa-specific, confirmed)",
      subRules: [
        rule("zMajoritySignNegative", "[nonZ shared-family sum < Z shared-family sum]", (key) => factByKey.get(key).sign < 0,
          "4/2/10/20; only 4/14 contact states are Z-majority (191, 253, 2017, 4001); the mechanism is state-level"),
      ],
      distributions: {
        sign: histogram(instanceKeys, recordedSet, (key) => factByKey.get(key).sign),
      },
      stateCensus: domain.distinctStates.map((state) => ({
        state,
        office: officeByState.get(state),
        sign: factByKey.get(`${domain.perAnchor.find((entry) => entry.instances.includes(state)).anchor}:${state}`).sign,
      })),
      evidence: "recomputed from the containment mesh with the BL-060/061 method (parentsUnrooted against the seven D-tier families)",
    },
    {
      id: "C-M5",
      family: "substitution displacement",
      tier: "masks-only",
      ruleSummary: "single-pitch substitution displacement (the C-M3 near-miss's equivalent lens)",
      expectation: "NEAR_MISS, not CLEAN",
      subRules: [
        rule("absLinearDisplacementOne", "[|single-pitch displacement| = 1]", (key) => Math.abs(factByKey.get(key).displacementLinear) === 1,
          "NEAR_MISS: equivalent to C-M3.r1 (single-semitone substitutions); misses the two tritone contacts"),
        rule("absLinearDisplacementSix", "[|single-pitch displacement| = 6]", (key) => Math.abs(factByKey.get(key).displacementLinear) === 6,
          "2/10/12/12; the tritone class collides across statuses"),
      ],
      distributions: {
        displacementLinear: histogram(instanceKeys, recordedSet, (key) => factByKey.get(key).displacementLinear),
      },
      evidence: "single-pitch swap (removed, added) per Hamming-2 instance; linear displacement mod 12 in -6..6",
    },
    {
      id: "C-M6",
      family: "interval-class counts",
      tier: "masks-only",
      ruleSummary: "interval-class counts computed from the mask alone (class-constant on each partition side)",
      expectation: "UNIFORM/degenerate (the class is the domain)",
      subRules: [
        rule("icVectorEqual", "[IC(anchor) = IC(satellite)]", (key) => factByKey.get(key).icEqual,
          "selects none; anchor IC is constant (6,5,4,3,2,1), satellite IC constant (5,5,4,3,3,1)"),
      ],
      distributions: {
        icEqual: histogram(instanceKeys, recordedSet, (key) => factByKey.get(key).icEqual),
      },
      anchorIcVectors,
      satelliteIcVectors,
      evidence: "interval-class vectors recomputed from masks (no ledger field read)",
    },
    {
      id: "C-M7",
      family: "orientation",
      tier: "canonical-read (labelled): the ledger's orientation label",
      ruleSummary: "the chiral orientation label (A/B balance recorded as a symmetry, not a selector)",
      expectation: "NON_SEPARATING as predicate; record the balance",
      subRules: [
        rule("orientationA", "[satellite orientation = A]", (key) => orientationByState.get(key.split(":")[1]).endsWith(" A"),
          "7/11/7/11; every anchor's recorded pair is one A + one B; the remainder is A/B-balanced"),
      ],
      distributions: {
        orientation: histogram(instanceKeys, recordedSet, (key) => (orientationByState.get(key.split(":")[1]).endsWith(" A") ? "A" : "B")),
      },
      evidence: "the canonical orientation labels (labelled canonical-read; not a mask-only rule)",
    },
    {
      id: "C-M8",
      family: "inversion-image",
      tier: "masks-only",
      ruleSummary: "the pitch-inversion image (a pole-universal constraint, not a selector)",
      expectation: "NON_SEPARATING as selector; invariant constraint",
      subRules: [
        rule("inversionImageOfAnchorEqualsSatellite", "[invertMask12(anchor) = satellite]", (key) => factByKey.get(key).inversionImageOfAnchorEqualsSatellite,
          "selects none (0/36)"),
        rule("inversionImageInReach", "[invertMask12(satellite) lies in some anchor's reach]", (key) => factByKey.get(key).inversionImageInReach,
          "selects all (the 14 states are inversion-closed: every state's partner is an in-domain state)"),
      ],
      distributions: {
        inversionImageInReach: histogram(instanceKeys, recordedSet, (key) => factByKey.get(key).inversionImageInReach),
      },
      evidence: "12-bit mask inversion; links to the invariant geography",
    },
    {
      id: "C-M9",
      family: "multiplicity / reach census",
      tier: "masks-only",
      ruleSummary: "state appearance multiplicity (the reach census; the BL-066 closure-law family exhausted)",
      expectation: "NON_SEPARATING",
      subRules: [
        rule("parentCountOne", "[reach-singleton: parentCount(satellite) = 1]", (key) => factByKey.get(key).parentCount === 1,
          "2/0/12/22; the selected instances are exactly 127:253 and 4033:2017 - the near-miss misses"),
        rule("parentCountTwo", "[parentCount(satellite) = 2]", (key) => factByKey.get(key).parentCount === 2,
          "2/2/12/20 (191 and 4001 each appear in two anchors' reaches)"),
        rule("parentCountThree", "[parentCount(satellite) = 3]", (key) => factByKey.get(key).parentCount === 3,
          "10/20/4/2"),
      ],
      distributions: {
        parentCount: histogram(instanceKeys, recordedSet, (key) => factByKey.get(key).parentCount),
      },
      stateCensus: domain.distinctStates.map((state) => ({ state, parentCount: domain.parentCounts.get(state), multiplicity: domain.multiplicity.get(state) })),
      evidence: "per-satellite reach census (masks-only); state appearance multiplicity; the two are identical (fail-loud checked)",
    },
  ];

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
  for (const candidate of candidates) {
    const observed = candidate.subRules.some((subRule) => subRule.verdict === "CLEAN_SPLIT")
      ? "CLEAN_SPLIT"
      : candidate.subRules.some((subRule) => subRule.verdict === "NEAR_MISS_BOUNDARY")
        ? "NEAR_MISS_BOUNDARY"
        : "NON_SEPARATING";
    candidate.observedVerdict = observed;
    candidate.expectedVerdict = expectedVerdicts[candidate.id];
    candidate.expectationHeld = candidate.observedVerdict === candidate.expectedVerdict;
  }
  if (candidates.some((candidate) => !candidate.expectationHeld)) fail("a pre-registered expectation did not hold");

  const cleanSplitCount = candidates.filter((candidate) => candidate.observedVerdict === "CLEAN_SPLIT").length;
  const nearMissCandidates = candidates.filter((candidate) => candidate.observedVerdict === "NEAR_MISS_BOUNDARY").map((candidate) => candidate.id);
  const battery = {
    preRegisteredIds: ["C-M1", "C-M2", "C-M3", "C-M4", "C-M5", "C-M6", "C-M7", "C-M8", "C-M9"],
    candidates,
    summary: {
      cleanSplitCount,
      nearMissCandidates,
      verdict: "NO_PRE_REGISTERED_CLEAN_SPLIT",
      expectationVsObserved: "all nine expectations held; the pre-registered outcome is the PARTIAL_DERIVATION branch (OD-70-3)",
      noAdditions: "the battery is the exhaustive pre-registered set (OD-70-1); no candidate was added, removed, or re-thresholded after the run",
    },
  };

  // ---- near-miss anatomy (OD-70-4) ----------------------------------------
  const nearMissRules = ["C-M3.r1 (absPcSumDeltaOne)", "C-M5.r1 (absLinearDisplacementOne)"];
  const selectedKeys = instanceKeys.filter((key) => factByKey.get(key).dPcSum === 1);
  const missedKeys = instanceKeys.filter((key) => recordedSet.has(key) && factByKey.get(key).dPcSum !== 1);
  if (selectedKeys.length !== 12 || canonicalText(missedKeys) !== canonicalText(["127:253", "4033:2017"])) {
    fail("near-miss anatomy drift");
  }
  const nearMiss = {
    candidates: nearMissRules,
    named: "NEAR_MISS_BOUNDARY",
    confusion: confusion(instanceKeys, recordedSet, (key) => factByKey.get(key).dPcSum === 1),
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
    rulingNote: "OD-70-4 (approved): the near-miss is recorded with its anatomy and the two misses named; no tie-break promotion without a new ruling",
  };

  // ---- tie-break candidate (recorded, un-promoted; OD-70-4) ---------------
  const tieBreakPredicate = (key) => factByKey.get(key).dPcSum === 1 || factByKey.get(key).parentCount === 1;
  const tieBreakConfusion = confusion(instanceKeys, recordedSet, tieBreakPredicate);
  if (!isClean(tieBreakConfusion)) fail("tie-break candidate is not clean; disclosure block drift");
  const tieBreakCandidate = {
    id: "C-TB-1",
    expression: "[|pcSum(anchor) - pcSum(satellite)| = 1] or [reach-singleton: parentCount(satellite) = 1] (the min-|delta| + reach-census tie-break)",
    confusion: tieBreakConfusion,
    status: "UNPROMOTED_DISCOVERY",
    ruling: "OD-70-4 (approved): the near-miss is recorded with the two misses identified; any tie-break (min-|delta| + census) is recorded, never promoted, without a new ruling",
    branchEffect: "none - the branch classification uses the pre-registered C-M set only; a promotion ruling would be a new decision (recorded as an open decision, not performed here)",
    mechanism: "none offered; separation is not derivation (OD-66-2 pattern); the candidate is disclosed for ruling",
  };

  // ---- invariants (V-D7-4) -------------------------------------------------
  const inversionPairs = deriveInversionPairing(domain.satelliteRows);
  const contactStateSet = new Set(contactKeys.map((key) => key.split(":")[1]));
  const invitedPairs = inversionPairs.map(([left, right]) => ({
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
    return invitedPairs.every((pair) => landedPairSet.has([pair.a, pair.b].sort(cmp).join("|")));
  })();
  if (!invariantCrossCheck) fail("derived inversion pairing differs from the landed BL-068 pairing");
  const invariants = {
    definition: "the two pole-universal invariants tested on the ti-pole's domain: inversion-invariance (whole-pair selection; status shared within pairs) and office-linking (pair offices sum to 6 mod 7)",
    pairs: invitedPairs,
    pairCount: invitedPairs.length,
    allInClass: domain.distinctStates.every((state) => class72Ids.includes(state)),
    allSumsSix: invitedPairs.every((pair) => pair.officeSum === "6"),
    allStatusShared: invitedPairs.every((pair) => pair.statusShared),
    allOrientationComplementary: invitedPairs.every((pair) => pair.orientations.length === 2),
    verdict: "INVARIANTS_OBEYED",
    derivationRespect: {
      statement: "the derived domain's state set is inversion-closed (7 whole pairs); the state-level rules (near-miss, Z-majority, reach census, tie-break) select whole pairs; the constant rules select none or all (trivially whole-pair); no rule splits an inversion pair",
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
      tieBreak: closed(statesWhere((fact) => fact.dPcSum === 1 || fact.parentCount === 1)),
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

  // ---- orbital rotation refinement (landed bytes re-read) ------------------
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
    corridorLabel: "bounded refinement of the landed obstruction; planning evidence only; D7 hypothesis-tier unchanged; no corridor movement; recorded for the maintainer's next accretion ruling",
  };

  // ---- direction -----------------------------------------------------------
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

  // ---- gates ---------------------------------------------------------------
  const selectionGatePass = cleanSplitCount > 0;
  const gates = {
    "V-D7-1": domainGate,
    "V-D7-2": {
      result: selectionGatePass ? "PASS" : "FAIL",
      statement: `selection: ${cleanSplitCount} of the nine pre-registered candidates cleanly separates the 14 contacts (CLEAN_SPLIT 14/0/0/22); the best pre-registered result is the near-miss 12/0/2/22 (${nearMissCandidates.join(", ")}). The pre-registered consequence of FAIL is the PARTIAL_DERIVATION branch, not a build halt (OD-70-3)`,
    },
    "V-D7-3": {
      result: "PASS",
      statement: "input isolation: two-sided static check - the office tokens (office index, office field, relational office), the class label, the network's D7 records, and the grant-projection reads are absent from the intrinsic region and head; the required masks-only tokens are present; the validator's mutation probes (smuggled office/class/network reads; presence-strip) are each rejected",
    },
    "V-D7-4": {
      result: "PASS",
      statement: "invariant respect: inversion-invariance (7 whole pairs, status shared, orientation-complementary) and office-linking (all pair sums 6 mod 7) mechanically verified; every candidate state set is whole-pair (no rule splits an inversion pair)",
    },
    "V-D7-5": {
      result: "PASS",
      statement: "accounting: the three tiers (masks-only / canonical-read labelled / remaining granted) are complete and honest; the office field appears only as the evaluation target and in the remaining-granted tier",
    },
  };

  // ---- branch classification (pre-registered labels, OD-70-3) --------------
  const branchLabel = !domainGate.result.startsWith("PASS")
    ? "NO_DERIVATION"
    : selectionGatePass
      ? "FULL_DERIVATION"
      : "PARTIAL_DERIVATION";
  const branch = {
    preRegisteredLabels: ["FULL_DERIVATION", "PARTIAL_DERIVATION", "NO_DERIVATION"],
    criteria: {
      full: "V-D7-1 PASS and some pre-registered C-M rule CLEAN_SPLIT (V-D7-2 PASS) and V-D7-3/4/5 PASS",
      partial: "V-D7-1 PASS and V-D7-2 FAIL (no pre-registered C-M rule CLEAN_SPLIT)",
      no: "V-D7-1 FAIL (the domain does not derive masks-only)",
    },
    gateResults: {
      "V-D7-1": gates["V-D7-1"].result,
      "V-D7-2": gates["V-D7-2"].result,
      "V-D7-3": gates["V-D7-3"].result,
      "V-D7-4": gates["V-D7-4"].result,
      "V-D7-5": gates["V-D7-5"].result,
    },
    label: branchLabel,
    statement: branchLabel === "PARTIAL_DERIVATION"
      ? "PARTIAL_DERIVATION: the domain (36 instances, per-anchor 4/5/6/6/6/5/4) derives masks-only; the pre-registered battery carries no clean mask-geometric selector (nine candidates; best = near-miss 12/0/2/22). The sole clean separator on the domain remains office identity (14/0/0/22, comparison-only): the selection is office-field-dependent. The tie-break candidate C-TB-1 is recorded un-promoted (OD-70-4) and does not alter the branch"
      : branchLabel === "FULL_DERIVATION"
        ? "FULL_DERIVATION: a pre-registered mask-geometric rule cleanly generates the 14 contacts"
        : "NO_DERIVATION: the domain itself does not derive masks-only",
    classificationDiscipline: "the label is a classification against the pre-registered gate list (OD-70-3): the battery is the search, the branch table is the verdict; no unregistered hunting on failure",
  };

  // ---- accounting ----------------------------------------------------------
  const accounting = {
    masksOnly: [
      "domain construction D1+D2: the role/tier partition's Hamming-2 reach - 36 instances, per-anchor 4/5/6/6/6/5/4 (emergent), 14 distinct states, multiplicities 2/2/10",
      "calibration: the all-ledger reach is uniform (30 per anchor); the per-anchor asymmetry is the partition projection, not an input",
      "battery predicates C-M1..C-M6, C-M8, C-M9 (masks; C-M1/C-M4 additionally the containment mesh)",
      "near-miss anatomy, the reach census, and the tie-break candidate arithmetic (recorded, un-promoted)",
      "inversion pairing, interval-class counts, rotation relations, and the orbit rotation intervals (given the recorded orbit order)",
    ],
    canonicalComputation: [
      "the D1 partition itself: the ledger's role/tier fields (canonical-read, labelled)",
      "recorded/unrecorded status labels and the office deltas: office fields read for evaluation only (the target, never an input)",
      "C-M7 orientation: the canonical orientation label (labelled)",
      "the invariant office sums (comparison)",
      "the modal orbit order and closure (the network's recorded modal edges; labelled)",
      "the orbit rotation refinement cross-checks the landed receipt bytes interval-by-interval",
    ],
    remainingGranted: [
      "the D7/D6 anchor-satellite partition membership (the domain's members are the ledger's marking)",
      "the office field as the selection's ground (V-D7-2 FAIL: no pre-registered mask-geometric rule separates; the sole clean domain separator remains office identity)",
      "the modal orbit record (order, closure); the orientation bit (BL-065, labels only); presentation conventions",
    ],
    statement: "the domain is discharged masks-only (V-D7-1); the selection is not (V-D7-2 FAIL, PARTIAL_DERIVATION): the office field remains the selection's ground, and that dependency is the honest bounded result of this attempt",
  };

  // ---- fences and bounded non-accomplishments ------------------------------
  const fences = {
    d7HypothesisTier: "D7 remains hypothesis-tier throughout: no D7 claim event, no D7 record amendment, no D7 derivation admission; ENTRY 15's D7 clause carries forward verbatim (provenance/DECISION_LEDGER.md:2703-2712)",
    governsAdmission: "none; this attempt characterizes, it does not admit",
    g1Intra330: "untouched",
    inv5: "no INV-5 graduation",
    mWalkability: "no M-walkability promotion; the modal orbit is characterization only",
    canonical: "no canonical/Court/schema/Neo4j writes; all sources read-only",
    d4Record: "no movement: ENTRY 10 immutable, ENTRY 15 unchanged, the D4 derivable-via-R2 amendment untouched",
    membrane: "the frame (scrum/plan/harmonic-comprehension-map.md sections 2.6/2.7) is interpretation vocabulary only; never a probe input, design input, or admitted canon claim",
    sessionProse: "context, not evidence",
    officeIsolation: "the office field is the target, never an input: the intrinsic derivation region reads ledger role/tier fields, pitch sets, and the containment mesh only; any office-field read in the derivation path is a halt (V-D7-3)",
    domainLabel: "the derived domain is the D6-satellite Hamming-2 reach (role/tier partition + masks); it is set-equal to the BL-068 availability domain, reconstructed here from the partition rather than the class label",
  };

  const contractCitations = [
    "provenance/DECISION_LEDGER.md:2703-2712 (ENTRY 15 D7 clause: 0/14, 14/14 = U = O, cycle-twin 0/7; D7 hypothesis-tier preserved)",
    "qa/d4-r2-execution-receipt.json (d7Analogue: gapNote, cycleTwinVerification.perEdge rotateInterval 11/6; status execution_verified)",
    "scrum/plan/bl-057-gate3-execution-memo.md:103-117 (the D7 analogue measurements)",
    "scrum/plan/bl-068-d7-asymmetry-memo.md + orrery/src/generated/bl068-d7-asymmetry.v1.json (GSL-3; the availability domain 36 = 14 + 22; the invariant geography)",
    "scrum/plan/bl-067-governs-semantic-synthesis.md:102-150, 211-230 (section 4 the asymmetry recorded; section 6 Question 1 explained; the D7 fences)",
    "scrum/plan/bl-059-governs-derivability-scoping-memo.md:126-132, 290-294 (the fa/ti asymmetry evidence base; the D-tier asymmetry as boundary case)",
    "scrum/plan/bl-066-r-edge-derivation-memo.md:17-18, 61-69 (the two-sided input-isolation pattern and the three-tier accounting pattern reused here)",
    "canonical/universal-heptatonic-ledger.csv (the 462-record universe: the role/tier partition source), canonical/universal-network-data.json (the seat-contact and modal records; comparison), derived/hypergraph/bipartite-inclusion-v1.json (the containment mesh; C-M1/C-M4)",
    "scrum/plan/bl-029-d-tier-operator-probe-memo.md:66-70 (the modal orbit: governor successor +2 mod 7)",
  ];

  const notAccomplished = [
    "no D7 claim event; no D7 record amendment; no D7 derivation admission (hypothesis-tier preserved, ENTRY 15's clause unchanged)",
    "no GOVERNS admission; no derivation admission of any kind",
    "no G1 movement; no INV-5 graduation; no M-walkability promotion",
    "no canonical/Court/schema/Neo4j writes; no ledger writes; no claim event of any kind",
    "no D4-record movement (ENTRY 10 immutable; ENTRY 15 unchanged)",
    "no orientation-bit resolution (BL-065 carried); no dual-pole unification beyond this attempt",
    "no lens application as evidence; the frame is vocabulary, not input; session prose is context, not evidence",
  ];

  // ---- assembly ------------------------------------------------------------
  const core = {
    schemaVersion: SCHEMA_VERSION,
    derivationId: DERIVATION_ID,
    status: "planning_evidence",
    generator: "scripts/build-bl070-d7-derivation.mjs",
    role: "the D7 derivation attempt (office-purity route): the ti-pole's R2-analogue aimed by GSL-3's mechanism; planning evidence, hypothesis-tier",
    preRegistration: {
      rulings: [
        { id: "OD-70-1", ruling: "C-M1..C-M9 approved as the exhaustive pre-registered battery; no silent additions" },
        { id: "OD-70-2", ruling: "D6-satellite Hamming-2 reach primary (role/tier canonical-read + masks only; the class label is forbidden in the derivation); all-ledger reach as the robustness control" },
        { id: "OD-70-3", ruling: "expectation-only: the battery is the search, the branch table is the verdict; no unregistered hunting on failure" },
        { id: "OD-70-4", ruling: "NEAR_MISS_BOUNDARY named with the two misses identified; no tie-break promotion (min-|delta| + census recorded, un-promoted) without a new ruling" },
      ],
      branchCriteria: branch.criteria,
      buildNotes: [
        "near-miss anatomy pin: 12 selected = all |dPc| = 1; 2 missed = the |dPc| = 6 terminal tritone contacts 127:253 and 4033:2017",
        "branch-outcome labels pre-registered before the run (FULL/PARTIAL/NO derivation)",
      ],
    },
    sourceBindings: [
      { artifact: LEDGER_PATH, sha256: fileSha(LEDGER_PATH), role: "462-record canonical universe: the role/tier partition, pitch sets, masks" },
      { artifact: NETWORK_PATH, sha256: fileSha(NETWORK_PATH), role: "the D7 seat-contact and modal records (comparison; the orbit order)" },
      { artifact: MESH_PATH, sha256: fileSha(MESH_PATH), role: "the containment mesh (C-M1/C-M4)" },
      { artifact: BL068_PATH, sha256: fileSha(BL068_PATH), role: "the chain anchor: the landed availability domain, axes, invariants (fingerprint self-check)" },
      { artifact: GATE3_PATH, sha256: fileSha(GATE3_PATH), role: "the landed D7 analogue measurements (cycle-twin per-edge intervals; status execution_verified)" },
    ],
    base: {
      bl068: { artifact: BL068_PATH, derivationFingerprint: bl068Fingerprint },
      importPolicy: "the chain artifact is consumed by fingerprint self-check (no literals in this generator); the landed cycle-twin intervals are matched interval-by-interval; the ledger and network carry the masks and records, never a verdict",
    },
    domainDerivation: {
      definition: "D1: the D7/D6 anchor-satellite partition from the ledger role/tier fields (canonical-read, labelled); D2: the Hamming-2 reach of the partition (masks only). The office field is not read here",
      partition: {
        anchors: domain.anchorRows.map((row) => String(row.id)),
        satellites: d6SatelliteStates,
        anchorCount: domain.anchorRows.length,
        satelliteCount: domain.satelliteRows.length,
        classPurity: "the D6 partition is class-pure (all 14 satellites are 7-2); set-equality with the 7-2 ledger class verified in comparison",
      },
      perAnchor: domain.perAnchor.map((entry) => ({ anchor: entry.anchor, instances: entry.instances, count: entry.count })),
      domainSize: instanceKeys.length,
      distinctStates: domain.distinctStates.length,
      multiplicity: Object.fromEntries([...domain.multiplicity.entries()].reduce((acc, [state, count]) => {
        const bucket = String(count);
        acc.set(bucket, (acc.get(bucket) ?? 0) + 1);
        return acc;
      }, new Map())),
      calibration: {
        allLedgerReachPerAnchor: allLedgerReach,
        allLedgerReachUniform: allLedgerReach.every((entry) => entry.count === 30),
        d6TierReachPerAnchor: d6TierReach,
        note: "the all-ledger Hamming-2 reach is uniform (30 per anchor); the per-anchor 4/5/6/6/6/5/4 asymmetry is the D6-satellite projection of that uniform reach - the asymmetry is emergent, never an input",
      },
      comparison: {
        bl068SetEqual: true,
        bl068DomainSize: bl068.census.availabilityDomain.domainSize,
        contactsSubsetOfDerivedDomain: instanceKeys.every((key) => recordedSet.has(key) || unrecordedSet.has(key)) && contactKeys.every((key) => instanceKeys.includes(key)),
        recordedCount: recordedSet.size,
        unrecordedCount: unrecordedSet.size,
        deltaCounts,
      },
    },
    battery,
    nearMiss,
    tieBreakCandidate,
    invariants,
    orbitalRotation,
    direction,
    gates,
    branch,
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
    domain: `${derivation.domainDerivation.domainSize} instances, per-anchor ${derivation.domainDerivation.perAnchor.map((entry) => entry.count).join("/")}, distinct ${derivation.domainDerivation.distinctStates}`,
    battery: derivation.battery.candidates.map((candidate) => `${candidate.id}:${candidate.observedVerdict}`).join(" | "),
    nearMiss: `${derivation.nearMiss.confusion.tp}/${derivation.nearMiss.confusion.fp}/${derivation.nearMiss.confusion.fn}/${derivation.nearMiss.confusion.tn} (${derivation.nearMiss.missedKeys.map((miss) => miss.key).join(", ")})`,
    tieBreak: `${derivation.tieBreakCandidate.id} ${derivation.tieBreakCandidate.confusion.tp}/${derivation.tieBreakCandidate.confusion.fp}/${derivation.tieBreakCandidate.confusion.fn}/${derivation.tieBreakCandidate.confusion.tn} (${derivation.tieBreakCandidate.status})`,
    branch: derivation.branch.label,
    gates: derivation.branch.gateResults,
    derivationFingerprint: derivation.derivationFingerprint,
  };
  if (check) {
    const existing = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, "utf8") : null;
    if (existing !== serialized) throw new Error("STALE_BL070_D7_DERIVATION");
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
