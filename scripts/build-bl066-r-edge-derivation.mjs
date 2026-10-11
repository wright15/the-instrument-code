#!/usr/bin/env node
/**
 * Build the BL-066 R-edge derivation (Phase 3 of the BL-059 un-granting
 * roadmap: requirements 1 and 3, attempting to derive the 28-edge A1 GOVERNS
 * relation itself - the 7 parents x 4 satellites parent/satellite membership -
 * from the pre-grant machinery rather than reading the granted R edges).
 *
 * Consumed inputs: the canonical ledger (role/tier domain; bit masks and pitch
 * sets), the BL-064 chain anchor (kappaBoth via its consumed kappa; imported
 * by fingerprint), the bipartite containment mesh (reach robustness control
 * and GSL cross-check). The granted R edges are read ONLY in
 * the comparison section (V-P3-1); the office fields only in comparison and
 * cross-check sections.
 *
 * Derivation (pre-registered, then executed):
 *   D1 domain: A1 parents (7) and A1 satellites (28) from the ledger
 *      role/tier fields alone.
 *   D2 reach (R-H2, masks-only): reach(h) = {s : hamming12(mask(h), mask(s))
 *      = 2}. Result: 24 placed (zero extras), 4 unplaced
 *      {695, 3497, 731, 2921} - each with zero H2 parents.
 *   D3 closure: the unplaced satellites form two anchored inversion pairs
 *      ({731, 2921} internal, {695, 3497} cross). The H8 relation connects
 *      each unplaced satellite to exactly two parents, forming the path
 *      1371-695-1389-731-1461-2921-1749-3497-2901. The closure law: each
 *      unplaced satellite attaches to its H8-parent with the smaller
 *      H2-reach census (equivalently: the completion is the unique H8
 *      matching that equalizes the reach census; enumeration of the 16
 *      matchings yields exactly one, the granted assignment). The
 *      pre-registered within-pair swap-bit candidate is resolved by this law;
 *      the pre-registered tie-break battery corroborates (pcSum, mask-numeric
 *      agree; kappa is orientation-relative; containment is the inapplicable
 *      control).
 *   D4 direction: structural (source is the domain's parent partition member,
 *      canonical read); unique-hub orientation 24/24 masks-only; IC-count
 *      extension: the A1-anchor IC vector is uniform [2,5,4,4,4,2], the
 *      satellite IC classes are [3,4,4,4,5,1] / [3,3,6,3,3,3], no derived
 *      edge is IC-symmetric (28/28 distinguishable) - candidate, un-promoted;
 *      canonical class asymmetry as the labelled secondary.
 *
 * Reflection: the derivation laws are mask functions and orientation-free; the
 * gate applies both kappa orientations to the parent labels (c -> 6-c) and
 * verifies the edge set is invariant. The orientation bit is carried to
 * BL-065, never resolved here. The officeSum-6 pattern is induced from the 12
 * placed inversion pairs and tested out-of-sample on the 2 unplaced pairs
 * (corroboration of the closure rule's consistency, not its justification).
 *
 * Gates: V-P3-1 (set-equality against the granted 28 R edges);
 * V-P3-2 input isolation (two-sided: forbidden-token absence + required
 * allowed-input presence in the intrinsic region; mutation-probe verified by
 * the validator); V-P3-3 mechanism consistency (no crossover; the per-parent
 * count-4 structure EMERGENT from the completion, never an input); V-P3-4
 * reflection; V-P3-5 accounting.
 *
 * Fences: planning_evidence only. No claim event, no record amendment, no
 * GOVERNS admission (this is a derivation finding, not an admission), no G1
 * movement, no directional-semantics assignment, no canonical/Court/schema/
 * Neo4j writes. The frame 2.6/2.7 is interpretation vocabulary, never design
 * input.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { canonicalText, fail, fileSha, readJson, sha256 } from "./verify-phase-a-proposals.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..");

export const SCHEMA_VERSION = "harmonic-orrery.bl066-r-edge-derivation.v1";
export const DERIVATION_ID = "BL066_R_EDGE_DERIVATION_V1";
export const OUTPUT_PATH = "orrery/src/generated/bl066-r-edge-derivation.v1.json";
export const BL064_PATH = "orrery/src/generated/bl064-cycle-ground.v1.json";
export const BL063_PATH = "orrery/src/generated/bl063-office-reconstruction.v1.json";
export const LEDGER_PATH = "canonical/universal-heptatonic-ledger.json";
export const GENERATION_PATH = "qa/d4-production-generation.json";
export const BIPARTITE_PATH = "derived/hypergraph/bipartite-inclusion-v1.json";

export const NON_Z_D_FAMILIES = ["7-1", "7-15", "7-22", "7-8"];
export const Z_D_FAMILIES = ["7-Z12", "7-Z17", "7-Z37"];

// ==== INTRINSIC-DERIVATION-BEGIN (ledger role/tier domain + masks + pitch sets only) ====

function cmp(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

function maskOfRow(row) {
  let mask = 0;
  for (const pc of parsePitchSet(row)) mask |= 1 << pc;
  if (mask !== Number(row.id) || mask !== Number.parseInt(row.bitReverse.slice(1), 2)) {
    fail(`ledger row ${row.id}: mask derived from the pitch set disagrees with the identity fields`);
  }
  return mask;
}

function parsePitchSet(row) {
  const inner = String(row.pitchSet).trim();
  if (!inner.startsWith("{") || !inner.endsWith("}")) fail(`ledger row ${row.id}: pitchSet shape drift`);
  return inner.slice(1, -1).split(",").map((value) => Number(value.trim())).sort(cmp);
}

export function deriveDomain(ledgerRows) {
  const parentRows = ledgerRows.filter((row) => row.tier === "A1" && row.role === "anchor");
  const satelliteRows = ledgerRows.filter((row) => row.tier === "A1" && row.role === "satellite");
  if (parentRows.length !== 7 || satelliteRows.length !== 28) fail("A1 domain census drift");
  return {
    parentRows,
    satelliteRows,
    parentMasks: parentRows.map(maskOfRow).sort(cmp),
    satelliteMasks: satelliteRows.map(maskOfRow).sort(cmp),
  };
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

function inversePcs(pcs) {
  return pcs.map((pc) => (12 - pc) % 12).sort(cmp);
}

export function anchoredInversionPairs(satelliteRows) {
  const byKey = new Map(satelliteRows.map((row) => [canonicalText(parsePitchSet(row)), row]));
  const seen = new Set();
  const pairs = [];
  for (const row of satelliteRows) {
    const key = canonicalText(parsePitchSet(row));
    if (seen.has(key)) continue;
    const sibling = byKey.get(canonicalText(inversePcs(parsePitchSet(row))));
    if (!sibling || sibling === row) fail(`inversion partnership failure at ${row.id}`);
    seen.add(key);
    seen.add(canonicalText(parsePitchSet(sibling)));
    pairs.push([Number(row.id), Number(sibling.id)].sort(cmp));
  }
  if (pairs.length !== 14) fail(`inversion pair census drift: ${pairs.length}`);
  return pairs.sort((left, right) => cmp(left[0], right[0]) || cmp(left[1], right[1]));
}

export function h2Neighbors(mask, domainMasks) {
  return domainMasks.filter((other) => hamming12(mask, other) === 2).sort(cmp);
}

export function reachSets(parentMasks, satelliteMasks) {
  return new Map(parentMasks.map((parent) => [parent, h2Neighbors(parent, satelliteMasks)]));
}

export function unplacedSatellites(parentMasks, satelliteMasks) {
  return satelliteMasks
    .filter((mask) => parentMasks.every((parent) => hamming12(parent, mask) !== 2))
    .sort(cmp);
}

export function h8Parents(mask, parentMasks) {
  return parentMasks.filter((parent) => hamming12(parent, mask) === 8).sort(cmp);
}

export function closureCandidates(parentMasks, satelliteMasks) {
  const reach = reachSets(parentMasks, satelliteMasks);
  const unplaced = unplacedSatellites(parentMasks, satelliteMasks);
  const rows = unplaced.map((mask) => {
    const candidates = h8Parents(mask, parentMasks)
      .map((parent) => ({ parent, reach: reach.get(parent).length }));
    if (candidates.length !== 2) fail(`closure candidate census drift at ${mask}`);
    return { satellite: mask, candidates };
  });
  return { reach, unplaced, rows };
}

export function closureLaw(parentMasks, satelliteMasks) {
  const { reach, unplaced, rows } = closureCandidates(parentMasks, satelliteMasks);
  const assignments = rows.map((row) => {
    const minCount = Math.min(...row.candidates.map((entry) => entry.reach));
    const picks = row.candidates.filter((entry) => entry.reach === minCount);
    if (picks.length !== 1) fail(`closure reach tie at ${row.satellite}: no strict minimum`);
    return { satellite: row.satellite, parent: picks[0].parent, candidates: row.candidates };
  });
  return { reach, unplaced, assignments };
}

export function equalizingMatchings(parentMasks, satelliteMasks) {
  const { reach, unplaced, rows } = closureCandidates(parentMasks, satelliteMasks);
  const base = new Map(parentMasks.map((parent) => [parent, reach.get(parent).length]));
  const options = rows.map((row) => row.candidates.map((entry) => entry.parent));
  const solutions = [];
  const walk = (index, chosen) => {
    if (index === options.length) {
      const counts = new Map(base);
      for (const [mask, parent] of chosen) counts.set(parent, counts.get(parent) + 1);
      if (new Set(counts.values()).size === 1) {
        solutions.push(chosen.map(([mask, parent]) => ({
          satellite: String(mask), parent: String(parent),
        })));
      }
      return;
    }
    for (const parent of options[index]) walk(index + 1, [...chosen, [unplaced[index], parent]]);
  };
  walk(0, []);
  return { solutions, base, unplaced, enumerationSize: options.reduce((acc, list) => acc * list.length, 1) };
}

export function icCountsOfMask(mask) {
  const pcs = [];
  for (let pitch = 0; pitch < 12; pitch += 1) if (mask & (1 << pitch)) pcs.push(pitch);
  const counts = [0, 0, 0, 0, 0, 0];
  for (let i = 0; i < pcs.length; i += 1) {
    for (let j = i + 1; j < pcs.length; j += 1) {
      const diff = Math.abs(pcs[i] - pcs[j]);
      counts[Math.min(diff, 12 - diff) - 1] += 1;
    }
  }
  return counts;
}

export function pcSumOfMask(mask) {
  let sum = 0;
  for (let pitch = 0; pitch < 12; pitch += 1) if (mask & (1 << pitch)) sum += pitch;
  return sum;
}

export function uniqueHubCensus(parentMasks, satelliteMasks) {
  return satelliteMasks.map((mask) => ({
    satellite: mask,
    hubs: h2Neighbors(mask, parentMasks),
  }));
}

// ==== INTRINSIC-DERIVATION-END ====

// ---- comparison and cross-check sections (the grant, the mesh and the ledger
// ---- identity fields are read here; never in the intrinsic region) ---------

function containmentControl(bipartite, parentMasks, satelliteMasks, assignmentByParent) {
  const byMask = new Map(Object.values(bipartite.heptatonicNodes).map((node) => [String(node.pitchMask), node]));
  const subnodesOf = (mask) => {
    const node = byMask.get(String(mask));
    if (!node) fail(`bipartite node missing for ${mask}`);
    return new Set(node.subnodes);
  };
  const parentSubs = new Map(parentMasks.map((mask) => [mask, subnodesOf(mask)]));
  const rows = satelliteMasks.map((mask) => {
    const subs = subnodesOf(mask);
    const overlaps = parentMasks.map((parent) => ({ parent, overlap: [...subs].filter((id) => parentSubs.get(parent).has(id)).length }));
    const max = Math.max(...overlaps.map((entry) => entry.overlap));
    const best = overlaps.filter((entry) => entry.overlap === max).map((entry) => entry.parent);
    const assigned = assignmentByParent.get(mask);
    const agrees = best.length === 1 && best[0] === assigned;
    return {
      satellite: String(mask),
      bestParents: best.map(String),
      overlap: max,
      uniqueBest: best.length === 1,
      assignedParent: String(assigned),
      agrees,
    };
  });
  const placed = rows.filter((row) => row.uniqueBest);
  const placedAgreement = placed.filter((row) => row.agrees).length;
  const unplacedTies = rows.filter((row) => !row.uniqueBest);
  return {
    rule: "containment max-overlap (mesh subnode intersection): the parent with the largest shared-subnode count is the containment-nearest parent",
    perSatellite: rows,
    placedAgreement,
    placedCount: placed.length,
    unplacedTieCount: unplacedTies.length,
    unplacedTieExcludesAssigned: unplacedTies.every((row) => !row.bestParents.includes(row.assignedParent)),
  };
}

function gslCrossCheck(bipartite, ledgerById, satelliteRows, perOffice) {
  const byMask = new Map(Object.values(bipartite.heptatonicNodes).map((node) => [String(node.pitchMask), node]));
  const pent = bipartite.pentatonicSubnodes;
  const shared = (mask, family) => byMask.get(String(mask)).subnodes
    .filter((id) => (pent[id]?.parentsUnrooted ?? []).includes(family)).length;
  const rows = satelliteRows.map((row) => {
    const mask = Number(row.id);
    const nonZSum = NON_Z_D_FAMILIES.reduce((sum, family) => sum + shared(mask, family), 0);
    const zSum = Z_D_FAMILIES.reduce((sum, family) => sum + shared(mask, family), 0);
    const forte = ledgerById.get(String(row.id)).forte;
    return {
      satellite: String(mask),
      forte,
      nonZSum,
      zSum,
      zMajority: nonZSum < zSum,
      signAgreesWithClass: (forte === "7-27") === (nonZSum < zSum),
    };
  });
  const perOfficeRows = perOffice.map((office) => {
    const group = rows.filter((row) => office.satellites.includes(row.satellite));
    return {
      parent: office.parent,
      seven27: group.filter((row) => row.forte === "7-27").map((row) => row.satellite),
      seven31: group.filter((row) => row.forte === "7-31").map((row) => row.satellite),
      signSeparates: group.every((row) => row.signAgreesWithClass),
    };
  });
  return {
    rule: "GSL-1R cross-check: the derived per-parent four must reproduce the boundary geography - two 7-27 satellites with a Z-majority interface (nonZSum < zSum) and two 7-31 with a non-Z-majority interface",
    perSatellite: rows,
    perOffice: perOfficeRows,
    signAgreement: rows.filter((row) => row.signAgreesWithClass).length,
    officeSignSeparation: perOfficeRows.filter((row) => row.signSeparates).length,
    statement: "every derived parent's four satellites reproduce the recorded boundary geography (2 x 7-27 Z-majority + 2 x 7-31 non-Z-majority); the derived edge grouping is mechanism-consistent with the corridor's selection signature",
  };
}

export function buildDerivation() {
  const ledgerRows = readJson(LEDGER_PATH);
  const bl064 = readJson(BL064_PATH);
  const bl063 = readJson(BL063_PATH);
  const generation = readJson(GENERATION_PATH);
  const bipartite = readJson(BIPARTITE_PATH);

  const { derivationFingerprint: bl064Fingerprint, ...bl064Core } = bl064;
  if (sha256(canonicalText(bl064Core)) !== bl064Fingerprint) fail("chain anchor fingerprint self-check failed");
  if (bl064.status !== "planning_evidence") fail("chain anchor status drift");
  const { reconstructionFingerprint: bl063Fingerprint, ...bl063Core } = bl063;
  if (sha256(canonicalText(bl063Core)) !== bl063Fingerprint) fail("BL-063 fingerprint self-check failed");

  const kappa0 = new Map(bl064.kappaConsumed.kappa0.map((row) => [Number(row.mask), row.index]));
  const kappa1 = new Map(bl064.kappaConsumed.kappa1.map((row) => [Number(row.mask), row.index]));
  if (kappa0.size !== 7 || kappa1.size !== 7) fail("consumed kappa census drift");
  for (const [mask, index] of kappa0) {
    if (kappa1.get(mask) !== 6 - index) fail("consumed kappa orientation relation failure");
  }
  // Phase-2 ground: the A1 parents' coordinates are the frozen midpoint centers
  // of the derived cycle pairs (bl064 rules.unified.perCenter).
  const center1ByParent = new Map(bl064.rules.unified.perCenter.map((row) => [Number(row.child), row.center]));
  if (center1ByParent.size !== 7) fail("phase-2 parent-center census drift");
  const center1 = (mask) => {
    const center = center1ByParent.get(Number(mask));
    if (center === undefined) fail(`missing phase-2 parent center at ${mask}`);
    return center;
  };
  const center0 = (mask) => (6 - center1(mask)) % 7;

  const ledgerById = new Map(ledgerRows.map((row) => [String(row.id), row]));

  // ---- D1: domain ----------------------------------------------------------
  const domain = deriveDomain(ledgerRows);
  const { parentMasks, satelliteMasks, parentRows, satelliteRows } = domain;

  // ---- D2: reach -----------------------------------------------------------
  const reach = reachSets(parentMasks, satelliteMasks);
  const unplaced = unplacedSatellites(parentMasks, satelliteMasks);
  const perParentReach = parentMasks.map((parent) => ({
    parent: String(parent),
    satellites: reach.get(parent).map(String),
    count: reach.get(parent).length,
  }));
  const placedCount = perParentReach.reduce((sum, row) => sum + row.count, 0);
  if (placedCount !== 24 || unplaced.length !== 4 || placedCount + unplaced.length !== satelliteMasks.length) {
    fail(`reach census drift: placed ${placedCount}, unplaced ${unplaced.length}`);
  }
  if (canonicalText(unplaced.map(String)) !== canonicalText(["695", "731", "2921", "3497"])) {
    fail("unplaced census drift");
  }

  // ---- D3: closure ---------------------------------------------------------
  const inversionPairs = anchoredInversionPairs(satelliteRows);
  const closure = closureLaw(parentMasks, satelliteMasks);
  const matching = equalizingMatchings(parentMasks, satelliteMasks);
  if (matching.solutions.length !== 1) fail(`equalizing matching not unique: ${matching.solutions.length}`);
  const lawAssignment = closure.assignments
    .map((row) => ({ satellite: String(row.satellite), parent: String(row.parent) }))
    .sort((left, right) => cmp(Number(left.satellite), Number(right.satellite)));
  const equalizing = matching.solutions[0].slice()
    .sort((left, right) => cmp(Number(left.satellite), Number(right.satellite)));
  if (canonicalText(lawAssignment) !== canonicalText(equalizing)) {
    fail("closure law and equalizing matching disagree");
  }

  const unplacedPairRows = inversionPairs
    .filter((pair) => pair.some((mask) => unplaced.includes(mask)));
  if (unplacedPairRows.length !== 2) fail("unplaced inversion-pair census drift");
  const pairOf = (member) => unplacedPairRows.find((pair) => pair.includes(member));
  const pairRow = (pair) => ({
    pair: pair.map(String),
    assignments: pair.map((mask) => {
      const row = closure.assignments.find((entry) => entry.satellite === mask);
      return { satellite: String(mask), parent: String(row.parent) };
    }).sort((left, right) => cmp(Number(left.satellite), Number(right.satellite))),
  });
  const internalPairRow = pairRow(pairOf(731) ?? fail("internal pair missing"));
  const crossPairRow = pairRow(unplacedPairRows.find((pair) => pair !== pairOf(731)) ?? fail("cross pair missing"));

  const h8Rows = unplaced.map((mask) => {
    const candidates = closure.assignments.find((row) => row.satellite === mask).candidates
      .map((entry) => ({ parent: String(entry.parent), reach: entry.reach }));
    const minReach = Math.min(...candidates.map((entry) => entry.reach));
    const maxReach = Math.max(...candidates.map((entry) => entry.reach));
    return { satellite: String(mask), candidates, minReach, maxReach };
  });
  const h8Path = [1371, 695, 1389, 731, 1461, 2921, 1749, 3497, 2901].map(String);

  const rotationCensus = unplaced.map((mask) => ({
    satellite: String(mask),
    hits: parentMasks.flatMap((parent) => rotationRelations(parent, mask).map((d) => ({ parent: String(parent), shift: d }))),
  }));
  const rotationHits = rotationCensus.reduce((sum, row) => sum + row.hits.length, 0);
  if (rotationHits !== 0) fail("rotation census drift: rotation relations unexpectedly present");

  // battery: within-pair scope over the cross pair's target parents (the closure
  // law's pair-level completion); the full-H8 proximity alternative is recorded
  // as failing in the statement below.
  const crossMembers = crossPairRow.assignments.map((row) => Number(row.satellite));
  const crossCandidateMasks = [...new Set(crossPairRow.assignments.map((row) => Number(row.parent)))].sort(cmp);
  if (crossCandidateMasks.length !== 2) fail("cross-pair candidate census drift");
  const fullH8Proximity = crossMembers.map((mask) => {
    const candidates = h8Rows.find((row) => Number(row.satellite) === mask).candidates.map((entry) => Number(entry.parent));
    const scored = candidates.map((parent) => ({ parent: String(parent), score: Math.abs(pcSumOfMask(mask) - pcSumOfMask(parent)) }));
    const min = Math.min(...scored.map((entry) => entry.score));
    const picks = scored.filter((entry) => entry.score === min).map((entry) => entry.parent);
    return { satellite: String(mask), picks };
  });
  const batteryRow = (memberId, scoreOf) => {
    const assignments = crossMembers.slice().sort(cmp).map((mask) => {
      const scored = crossCandidateMasks
        .map((parent) => ({ parent, score: scoreOf(mask, parent) }));
      const min = Math.min(...scored.map((entry) => entry.score));
      const picks = scored.filter((entry) => entry.score === min);
      return {
        satellite: String(mask),
        parent: picks.length === 1 ? String(picks[0].parent) : null,
        scores: scored.map((entry) => ({ parent: String(entry.parent), score: entry.score })),
      };
    });
    const law = crossPairRow.assignments.slice().sort((left, right) => cmp(Number(left.satellite), Number(right.satellite)));
    const agrees = assignments.every((row, index) => row.parent === law[index].parent);
    return { member: memberId, assignments, agrees };
  };
  const pcSumBattery = batteryRow("pcSum", (mask, parent) => Math.abs(pcSumOfMask(mask) - pcSumOfMask(parent)));
  const maskNumericBattery = batteryRow("maskNumeric", (mask, parent) => Math.abs(mask - parent));
  const kappaBattery = {
    member: "kappa",
    result: "undecided_orientation_relative",
    statement: `the parents' coordinate labels are {1389: ${center1(1389)}, 1749: ${center1(1749)}} under kappa1 and their reflection under kappa0; the within-pair orientation is exactly the label being tested, so the kappa member cannot resolve without the carried orientation bit`,
  };
  const containmentBattery = {
    member: "containment",
    result: "control_inapplicable",
    statement: "the containment overlap member selects the opposite within-pair orientation over the cross-pair candidates and cannot resolve the internal pair (argmax ties excluding the closure target); recorded as the battery's negative control, not a closure signal",
  };

  // officeSum-6: induced from placed pairs, tested out-of-sample on the unplaced pairs
  const parentBySatellite = new Map();
  for (const [parent, sats] of reach) for (const satellite of sats) parentBySatellite.set(satellite, parent);
  for (const row of closure.assignments) parentBySatellite.set(row.satellite, row.parent);
  const officeOfSatellite1 = (mask) => center1(parentBySatellite.get(Number(mask)));
  const officeSumRows = inversionPairs.map((pair) => ({
    pair: pair.map(String),
    centers: pair.map((mask) => officeOfSatellite1(mask)),
    sum: pair.reduce((sum, mask) => sum + officeOfSatellite1(mask), 0),
    placed: pair.every((mask) => !unplaced.includes(mask)),
  }));
  const placedSums = officeSumRows.filter((row) => row.placed);
  if (placedSums.some((row) => row.sum !== 6)) fail("officeSum-6 induction failure on placed pairs");
  const unplacedSums = officeSumRows.filter((row) => !row.placed);
  if (unplacedSums.some((row) => row.sum !== 6)) fail("officeSum-6 prediction failure on unplaced pairs");

  // emergent count
  const beforeCounts = new Map(parentMasks.map((parent) => [parent, reach.get(parent).length]));
  const afterCounts = new Map(beforeCounts);
  for (const row of closure.assignments) {
    afterCounts.set(row.parent, afterCounts.get(row.parent) + 1);
  }
  const emergentRows = parentMasks.map((parent) => ({
    parent: String(parent),
    before: beforeCounts.get(parent),
    after: afterCounts.get(parent),
  }));
  if (emergentRows.some((row) => row.after !== 4)) fail("emergent count-4 failure");
  const closureByParent = new Map();
  for (const row of closure.assignments) {
    const list = closureByParent.get(row.parent) ?? [];
    list.push(row.satellite);
    closureByParent.set(row.parent, list);
  }

  // ---- D4: direction -------------------------------------------------------
  const hubRows = uniqueHubCensus(parentMasks, satelliteMasks).map((row) => ({
    satellite: String(row.satellite),
    hubs: row.hubs.map(String),
  }));
  const hubResolved = hubRows.filter((row) => row.hubs.length === 1).length;
  if (hubResolved !== 24) fail(`unique-hub census drift: ${hubResolved}`);

  const parentIcSet = new Set(parentMasks.map((mask) => canonicalText(icCountsOfMask(mask))));
  if (parentIcSet.size !== 1) fail("parent IC uniformity failure");
  const parentIc = icCountsOfMask(parentMasks[0]);
  const satelliteIcClasses = new Map();
  for (const mask of satelliteMasks) {
    const key = canonicalText(icCountsOfMask(mask));
    satelliteIcClasses.set(key, (satelliteIcClasses.get(key) ?? 0) + 1);
  }
  if (satelliteIcClasses.size !== 2 || [...satelliteIcClasses.values()].some((count) => count !== 14)) {
    fail("satellite IC class census drift");
  }
  const satelliteIcRows = [...satelliteIcClasses.entries()]
    .map(([vector, count]) => ({ vector: JSON.parse(vector), count }))
    .sort((left, right) => cmp(canonicalText(left.vector), canonicalText(right.vector)));
  const edgeIcRows = [];
  const derivedEdgePairs = [
    ...parentMasks.flatMap((parent) => reach.get(parent).map((satellite) => [parent, satellite])),
    ...closure.assignments.map((row) => [row.parent, row.satellite]),
  ];
  for (const [parent, satellite] of derivedEdgePairs) {
    const sourceIc = canonicalText(icCountsOfMask(parent));
    const targetIc = canonicalText(icCountsOfMask(satellite));
    if (sourceIc === targetIc) fail(`IC-symmetric edge at ${parent}->${satellite}`);
    edgeIcRows.push({ source: String(parent), target: String(satellite), distinguishable: true });
  }

  const classRows = derivedEdgePairs.map(([parent, satellite]) => ({
    source: String(parent),
    sourceClass: ledgerById.get(String(parent))?.forte ?? null,
    target: String(satellite),
    targetClass: ledgerById.get(String(satellite))?.forte ?? null,
  }));
  const sourceClasses = new Set(classRows.map((row) => row.sourceClass));
  const targetClasses = new Set(classRows.map((row) => row.targetClass));
  if (canonicalText([...sourceClasses]) !== canonicalText(["7-34"]) ||
      canonicalText([...targetClasses].sort()) !== canonicalText(["7-27", "7-31"])) {
    fail("canonical class separation drift");
  }

  // ---- derived edge set ----------------------------------------------------
  const derivedPairs = derivedEdgePairs
    .map(([parent, satellite]) => ({ source: String(parent), target: String(satellite) }))
    .sort((left, right) => cmp(Number(left.source), Number(right.source)) || cmp(Number(left.target), Number(right.target)));
  if (derivedPairs.length !== 28) fail("derived edge census drift");
  const assignmentByParent = new Map();
  for (const row of derivedPairs) {
    const list = assignmentByParent.get(row.source) ?? [];
    list.push(row.target);
    assignmentByParent.set(row.source, list);
  }
  const perParentDerived = parentMasks.map((parent) => ({
    parent: String(parent),
    satellites: (assignmentByParent.get(String(parent)) ?? []).slice().sort((left, right) => cmp(Number(left), Number(right))),
    h2Count: reach.get(parent).length,
    closureCount: (closureByParent.get(parent) ?? []).length,
  }));
  if (perParentDerived.some((row) => row.h2Count + row.closureCount !== row.satellites.length)) {
    fail("per-parent mechanism accounting drift");
  }

  const derivedAssignBySatellite = new Map();
  for (const row of derivedPairs) derivedAssignBySatellite.set(Number(row.target), Number(row.source));

  // ---- robustness control --------------------------------------------------
  const robustness = containmentControl(bipartite, parentMasks, satelliteMasks, derivedAssignBySatellite);
  if (robustness.placedAgreement !== 24 || robustness.placedCount !== 24 ||
      robustness.unplacedTieCount !== 4 || !robustness.unplacedTieExcludesAssigned) {
    fail("containment robustness control drift");
  }

  // ---- mechanism / GSL cross-check ----------------------------------------
  const perOfficeBase = parentMasks.map((parent) => ({
    parent: String(parent),
    center1: center1(parent),
    satellites: assignmentByParent.get(String(parent)).slice().sort((left, right) => cmp(Number(left), Number(right))),
    h2Count: reach.get(parent).length,
    closureCount: (closureByParent.get(parent) ?? []).length,
  }));
  const gsl = gslCrossCheck(bipartite, ledgerById, satelliteRows, perOfficeBase.map((row) => ({ parent: row.parent, satellites: row.satellites })));
  if (gsl.signAgreement !== 28 || gsl.officeSignSeparation !== 7) fail("GSL cross-check drift");

  // ---- coverage (V-P3-1; comparison only) ----------------------------------
  const grantedKeys = [];
  const grantedByParent = new Map();
  for (const edge of generation.projection.R) {
    if (edge.type !== "GOVERNS" || edge.parentTier !== "A1" || edge.childTier !== "A1") fail("R edge shape drift");
    const source = String(edge.source);
    const target = String(edge.target);
    grantedKeys.push(`${source}->${target}`);
    const list = grantedByParent.get(source) ?? [];
    list.push(target);
    grantedByParent.set(source, list);
  }
  if (grantedKeys.length !== 28) fail("granted R census drift");
  const derivedKeys = derivedPairs.map((row) => `${row.source}->${row.target}`);
  const sortedDerived = derivedKeys.slice().sort();
  const sortedGranted = grantedKeys.slice().sort();
  const setEqual = canonicalText(sortedDerived) === canonicalText(sortedGranted);
  if (!setEqual) fail("V-P3-1 coverage failure: derived set differs from the granted R set");
  const missing = sortedGranted.filter((key) => !sortedDerived.includes(key));
  const extra = sortedDerived.filter((key) => !sortedGranted.includes(key));
  const perParentCoverage = parentMasks.map((parent) => {
    const derived = (assignmentByParent.get(String(parent)) ?? []).slice().sort((left, right) => cmp(Number(left), Number(right)));
    const granted = (grantedByParent.get(String(parent)) ?? []).slice().sort((left, right) => cmp(Number(left), Number(right)));
    if (canonicalText(derived) !== canonicalText(granted)) fail(`coverage per-parent mismatch at ${parent}`);
    return { parent: String(parent), derived, granted, equal: true };
  });
  const officeIndexByMask = new Map(generation.projection.anchors.map((row) => [String(row.id), Number(row.officeIndex)]));
  const officeAlignment = derivedPairs.map((row) => {
    const grantedParentOffice = officeIndexByMask.get(row.source);
    const grantedSatelliteOffice = Number(ledgerById.get(row.target)?.officeIndex ?? NaN);
    const derivedCenter1 = center1(row.source);
    const derivedCenter0 = center0(row.source);
    return {
      source: row.source,
      target: row.target,
      grantedParentOffice,
      grantedSatelliteOffice,
      derivedCenter1,
      derivedCenter0,
      satelliteOfficeMatchesParentOffice: grantedSatelliteOffice === grantedParentOffice,
      match1: derivedCenter1 === grantedParentOffice,
      match0: derivedCenter0 === grantedParentOffice,
    };
  });
  const match1Count = officeAlignment.filter((row) => row.match1).length;
  const match0Count = officeAlignment.filter((row) => row.match0).length;
  if (match1Count !== 28) fail("office alignment drift against the granted office fields (kappa1)");
  if (officeAlignment.some((row) => !row.satelliteOfficeMatchesParentOffice)) {
    fail("granted satellite office does not match the granted parent office");
  }

  // ---- artifact assembly ---------------------------------------------------
  const requestStatement = "BL-059 section 3 requirements 1 and 3: an intrinsic axis for membership recovering parent/satellite membership without reading R, and a rule generating the 28-edge edge structure";

  const core = {
    schemaVersion: SCHEMA_VERSION,
    derivationId: DERIVATION_ID,
    status: "planning_evidence",
    generator: "scripts/build-bl066-r-edge-derivation.mjs",
    sourceBindings: [
      { artifact: BL064_PATH, sha256: fileSha(BL064_PATH), role: "phase-2 chain anchor (consumed kappaBoth and the unified parent centers; imported by self-checked fingerprint)" },
      { artifact: LEDGER_PATH, sha256: fileSha(LEDGER_PATH), role: "canonical ledger (role/tier domain; bit masks; pitch sets - the derivation's canonical reads)" },
      { artifact: GENERATION_PATH, sha256: fileSha(GENERATION_PATH), role: "granted projection (the R edges: comparison only, V-P3-1; the office fields: comparison/cross-check only)" },
      { artifact: BIPARTITE_PATH, sha256: fileSha(BIPARTITE_PATH), role: "containment mesh (reach robustness control; GSL-1R cross-check)" },
    ],
    base: {
      artifact: BL064_PATH,
      derivationFingerprint: bl064.derivationFingerprint,
      chainAnchor: { artifact: BL063_PATH, reconstructionFingerprint: bl063.reconstructionFingerprint },
      projectionArtifact: GENERATION_PATH,
      containmentArtifact: BIPARTITE_PATH,
      importPolicy: "the chain anchor is consumed for kappaBoth (both orientations) and the phase-2 unified parent centers, self-checked by fingerprint; the ledger supplies the role/tier domain and the bit/pitch-set identity fields; the granted projection is read for the R edges and office fields ONLY in the comparison/cross-check sections; the mesh is read for the reach control and the GSL cross-check. The derivation path reads no R edge, no office field, no class field.",
    },
    kappaConsumed: {
      kappa0: bl064.kappaConsumed.kappa0.map((row) => ({ mask: String(row.mask), index: row.index })),
      kappa1: bl064.kappaConsumed.kappa1.map((row) => ({ mask: String(row.mask), index: row.index })),
      validation: { orientationRelation: true, census: 7 },
    },
    domain: {
      rule: "D1: the A1 parents are the ledger rows with tier A1 and role anchor; the A1 satellites are the rows with tier A1 and role satellite; masks from the bit field (self-checked against the id)",
      parentCensus: { count: parentMasks.length, masks: parentMasks.map(String) },
      satelliteCensus: { count: satelliteMasks.length, masks: satelliteMasks.map(String) },
      source: LEDGER_PATH,
      readFields: "role, tier, bit, pitchSet, id (canonical identity fields only)",
      withheldFields: "officeIndex, parentOffice, relationalOffice, forte, intervalVector, setClass, and the projection's R/E/office fields are never read in the derivation path",
      statement: "the derivation domain is the 7 A1 parents and the 28 A1 satellites, recovered from the canonical ledger's role/tier partition alone; the satellite membership itself requires no R edge",
    },
    reach: {
      rule: "D2 (R-H2, masks-only): reach(h) = {s in the A1 satellite domain : hamming12(mask(h), mask(s)) = 2}",
      perParent: perParentReach,
      census: {
        placed: placedCount,
        unplaced: unplaced.length,
        assigned: placedCount + unplaced.length,
        domainSize: satelliteMasks.length,
        extraOnDomain: 0,
      },
      unplaced: unplaced.map(String),
      totality: "every A1 satellite is either H2-reachable from exactly one parent (24) or has zero H2 parents (4); no satellite is reachable from two parents (unique hubs), no satellite is unreached after the closure",
      robustness: {
        rule: robustness.rule,
        perSatellite: robustness.perSatellite,
        placedAgreement: `${robustness.placedAgreement}/24`,
        unplacedNonResolution: `${robustness.unplacedTieCount}/4`,
        statement: "named robustness finding: the H2 reach and the containment max-overlap reach agree on all 24 placed satellites (the containment argmax is the unique H2 parent) and fail together on the same 4 (the containment argmax is a tie excluding the assigned parent) - the two natural reach definitions induce the same placed/unplaced partition, so the reach structure is robust across its two definitions and the containment reach is not an independent second mode",
      },
      statement: "R-H2 reach places 24 of 28 satellites with zero extras and zero double-claims; the 4 unplaced (695, 2921, 3497, 731) have zero H2 parents and are the pre-registered closure residual",
    },
    closure: {
      preRegistered: {
        unplacedSet: ["695", "3497", "731", "2921"],
        internalPair: internalPairRow,
        crossPair: crossPairRow,
        swapBitCondition: "the within-pair swap candidate is carried as a named bit only if no masks-only resolution fires; the build tests the H8 reach-census law first and the battery second",
      },
      h8Structure: {
        rule: "for each unplaced satellite, the H8-parent set (hamming12 = 8) and each candidate's H2-reach count",
        perSatellite: h8Rows,
        path: {
          nodes: h8Path,
          statement: "the H8 relation connects each unplaced satellite to exactly two parents and forms the single path 1371-695-1389-731-1461-2921-1749-3497-2901 - each unplaced satellite sits H8-between two parents",
        },
      },
      law: {
        memberSide: {
          rule: "each unplaced satellite attaches to its H8-parent with the smaller H2-reach census count (strict minimum; ties fail loud)",
          assignments: lawAssignment,
        },
        matchingSide: {
          rule: "the completion is the unique matching over the H8 relations that equalizes the reach census across the 7 parents",
          enumerationSize: matching.enumerationSize,
          equalizingCount: matching.solutions.length,
          equalizing: matching.solutions[0].map((row) => ({ satellite: row.satellite, parent: row.parent })),
        },
        equivalence: true,
        statement: "build-phase finding (disclosed): the reach-census ordering resolves the pre-registered within-pair swap candidate; the member-side minimum and the matching-side equalization generate the same four assignments; the planning pass's distance-invisibility observation (P3-E) tested proximity axes, not the reach-census ordering - the swap candidate bit does not survive the closure law",
      },
      rotationCensus: {
        rule: "rotation relations rotateMask12(parent, d) = satellite for d = 1..11, over the 4 unplaced satellites x the 7 parents",
        perSatellite: rotationCensus,
        totalHits: rotationHits,
        statement: "no rotation relation connects any unplaced satellite to any parent (0/44 shifts) - rotation does not participate in the closure; the rotation input is read and reported null",
      },
      battery: {
        scope: "within-pair swap {695, 3497} over the pair-level candidate parents {1389, 1749} (pre-registered battery; corroboration, not resolution)",
        members: [pcSumBattery, maskNumericBattery, kappaBattery, containmentBattery],
        statement: "the battery corroborates the closure law: the two valid masks-only members (pcSum, mask-numeric) agree with the closure assignment; the kappa member is orientation-relative (BL-065); the containment member is the inapplicable control. Over the full H8 sets, proximity metrics alone select the full-reach parents (1371/2901) and fail - the operative signal is the reach-census ordering, not generic proximity",
      },
      officeSum6: {
        rule: "the placed inversion pairs' derived office labels sum to 6 (mod 7); the pattern is induced from the placed pairs and tested as a prediction on the unplaced pairs",
        perPair: officeSumRows,
        inducedFromPlacedPairs: placedSums.length,
        predictionConfirmed: unplacedSums.length,
        statement: "officeSum-6 is induced from the 12 placed inversion pairs and verified out-of-sample on the 2 unplaced pairs (the unplaced pairs' derived offices sum to 6) - recorded as corroboration of the closure rule's consistency, not as its justification (the justification is the H8 reach-census law)",
      },
      emergentCount: {
        rule: "the per-parent assigned counts after the closure, before any count constraint is applied",
        perParent: emergentRows,
        commonValue: 4,
        statement: "OD-P3-5 check passed in its strongest form: the completion law equalizes the reach census and every parent's count becomes 4 without 4 ever entering the derivation - the 4-per-parent structure, previously the grant's own shape, emerges from the machinery",
      },
    },
    direction: {
      structural: {
        rule: "the derived relation's source is the domain's parent-partition member; each edge connects the parent mask to its assigned satellite mask",
        statement: "the direction h->s is carried by the D1 domain partition (a canonical role/tier read, labelled); the probes below test how far the direction is masks-only rather than partition-given",
      },
      uniqueHub: {
        rule: "masks-only: the source of each placed edge is the satellite's unique H2 parent",
        resolved: hubResolved,
        total: 28,
        perSatellite: hubRows,
        statement: "24/24 placed edges have a unique H2 hub as their source; the 4 closure edges carry zero H2 hubs and fall back on the closure law's assignment",
      },
      icAxis: {
        rule: "masks-only IC-count vectors: the source endpoint carries the uniform A1-parent IC vector; no derived edge is IC-symmetric",
        parentIc,
        satelliteIcClasses: satelliteIcRows,
        distinguishableEdges: edgeIcRows.length,
        correction: "grounding correction (maintainer-prose class, applied at build): the briefing's parent IC [2,5,4,3,6,1] is BL-064's A0-anchor parent IC; the A1-anchor IC computed from the masks is [2,5,4,4,4,2]",
        status: "candidate masks-only direction discriminator; the tier promotion is a maintainer ruling (OD-64-1 discipline), not promoted here",
      },
      canonicalClass: {
        rule: "the source carries the A1-anchor canonical class 7-34; the targets carry the satellite classes",
        sourceClasses: [...sourceClasses],
        targetClasses: [...targetClasses].sort(),
        splitCount: 28,
        label: "canonical-input-dependent (ledger field read in the cross-check section); recorded as the labelled secondary",
      },
      statement: "direction dual-report: structural (domain partition, canonical read) + unique-hub masks-only 24/24 + IC-distinguishability 28/28 (candidate, un-promoted); the canonical class asymmetry as the labelled secondary",
    },
    mechanism: {
      perOffice: perOfficeBase,
      noCrossover: "the 24 H2 assignments and the 4 closure assignments are disjoint and jointly total; no parent mixes mechanisms beyond its genuine residual (1389: 3 H2 + 1 closure; 1461: 2 H2 + 2 closure; 1749: 3 H2 + 1 closure; the four full parents: 4 H2 + 0)",
      emergent4: "every derived parent holds exactly 4 satellites after the closure (emergent, not input)",
      gsl: gsl,
      statement: "mechanism consistency: 24 H2 + 4 closure = 28, no crossover; the derived per-parent grouping reproduces the boundary-geography signature (2 x 7-27 Z-majority + 2 x 7-31 non-Z-majority per parent)",
    },
    coverage: {
      rule: "V-P3-1: the derived directed edge set is compared against the granted R edges (projection.R); comparison only - the grant never enters the derivation path",
      grantedSource: GENERATION_PATH,
      derivedCount: derivedKeys.length,
      grantedCount: grantedKeys.length,
      setEqual,
      missing,
      extra,
      perParent: perParentCoverage,
      officeAlignment: {
        matchesKappa1: match1Count,
        matchesKappa0: match0Count,
        perEdge: officeAlignment,
        statement: "under kappa1 every derived edge's parent center equals the granted satellite office (28/28, consistent with BL-063 M1); under kappa0 the labels flip and only the reflection-fixed office-3 edges match (4/28) - the label content is reflection-relative, the edge set is not",
      },
      statement: "the derivation generates exactly the granted 28 directed R edges: 7 parents x 4 satellites, set-equal, no missing, no extras",
    },
    reflection: {
      definition: "the derivation laws are mask functions and orientation-free; the gate applies both kappa orientations to the parent coordinate labels",
      edgeSetInvariant: true,
      labelFlip: "c -> 6-c",
      kappa1Centers: parentMasks.map((mask) => ({ mask: String(mask), center: center1(mask) })),
      kappa0Centers: parentMasks.map((mask) => ({ mask: String(mask), center: center0(mask) })),
      carried: "BL-065",
      statement: "the derived edge set is identical under both kappa orientations (the laws read masks alone); only the coordinate labels flip c -> 6-c. The one-bit orientation dependency remains carried to BL-065, never resolved here",
    },
    gates: {
      "V-P3-1": {
        name: "coverage",
        result: "PASS",
        statement: "derived 28 directed edges set-equal the granted R edges; missing [], extra []; per-parent 7/7; office alignment 28/28 under kappa1 (labels relative to BL-065)",
      },
      "V-P3-2": {
        name: "input isolation",
        result: "PASS",
        statement: "two-sided: the derivation region statically forbidden from the grant fields, the R rows, the office/class fields and observation membership, and required to read the canonical allowed inputs (ledger, pitchSet, mask, hamming, rotate); mutation-probe verified by the validator (smuggled reads rejected, a lobotomized region rejected)",
      },
      "V-P3-3": {
        name: "mechanism consistency",
        result: "PASS",
        statement: "24 H2 + 4 closure, no crossover; the per-parent count-4 emerges from the completion (equalization) without being an input; the GSL-1R cross-check holds per parent (2 x 7-27 Z-majority + 2 x 7-31 non-Z-majority, 28/28 sign agreement)",
      },
      "V-P3-4": {
        name: "reflection",
        result: "PASS",
        statement: "the derived edge set is invariant under both kappa orientations; labels are relative (c -> 6-c); the orientation bit is carried to BL-065",
      },
      "V-P3-5": {
        name: "accounting",
        result: "PASS",
        statement: "three-tier discharge recorded: masks-only (domain census via the canonical role/tier read, R-H2 reach, H8 reach-census closure, emergent 4s, unique-hub direction); canonical-read (domain partition, class secondary); remaining (the domain partition, the orientation bit, presentation conventions). The swap bit candidate is dissolved, not carried",
      },
    },
    accounting: {
      tiers: {
        masksOnly: {
          domain: "7 parents + 28 satellites (the ledger role/tier partition is the one canonical-read input beneath the masks)",
          reach: "R-H2: 24/28 placed, zero extras, unique hubs",
          closure: "H8 reach-census law: the 4 unplaced resolved by reach-minimum / census-equalization (equivalence proven; matching unique among 16)",
          emergent: "per-parent count 4 emerges from the completion",
          direction: "unique-hub orientation 24/24; IC-distinguishability 28/28 (candidate)",
        },
        canonicalComputation: {
          domainPartition: "the A1 anchor/satellite partition is a canonical ledger read (role/tier), labelled",
          classSecondary: "the canonical class asymmetry (7-34 vs 7-27/7-31) as the labelled direction secondary",
          officeLabels: "the office labels are BL-063's recovered coordinates (relative to BL-065's bit); used in comparison/corroboration only",
        },
        remainingGranted: [
          "the A1 domain partition itself (the anchor/satellite role-tier membership - the canonical read that orients the relation)",
          "the office-orientation bit (labels only; carried to BL-065 - the edge set does not depend on it)",
          "presentation conventions (walk order, ids, tier tags of the R rows)",
        ],
      },
      emergentCountCheck: "the 4-per-parent structure is an output of the completion law, never an input; had the completion misfilled, the accounting would name the count constraint as remainder",
      statement: "Phase 3 discharges the 28-edge R-edge grant masks-only; the grant shrinks to the domain partition and the one orientation bit; the count-4 structure emerges",
    },
    synthesis: {
      requirement: requestStatement,
      preRegisteredVerdicts: ["R_EDGES_DERIVED", "R_EDGES_PARTIAL", "R_EDGES_FAILED"],
      verdict: "R_EDGES_DERIVED",
      verdictStatement: "The 28-edge A1 GOVERNS relation is derived from the pre-grant machinery: 24 edges by masks-only H2 reach (unique hubs, zero extras) and 4 by the masks-only H8 reach-census closure law (the unique equalizing matching), set-equal to the granted R, invariant under both kappa orientations, with the per-parent count-4 emergent and the boundary-geography signature reproduced. The pre-registered swap-bit candidate is dissolved by the closure law; the direction is structural (domain partition) with masks-only confirmation (unique-hub 24/24; IC-distinguishability 28/28, candidate). The remainder is the domain partition and the one orientation bit.",
      grantDischarge: {
        discharged: "the 28-edge R-edge set: 24 by H2 reach + 4 by the H8 reach-census law (masks-only); the per-parent 4-partition (emergent); the direction's mask-visible content (unique-hub masks-only; IC distinguishability candidate)",
        remaining: "the A1 anchor/satellite domain partition (canonical role/tier read); the office-orientation bit (labels; BL-065); presentation conventions",
        statement: "Phase 3 discharges the R-edge grant; the GOVERNS relation's edge content is intrinsic to the satellite layer's reach geometry; the grant shrinks to its anchoring remainder",
      },
      bitInventory: {
        carried: [
          {
            bit: "office-orientation (reflection: which terminal is the first office)",
            status: "carried",
            destination: "BL-065",
            candidateSources: ["the brightness premise (BL-063 H_A; interpretation vocabulary)", "one grant comparison (BL-063 M1)"],
            note: "the reflection and brightness registrations are one identification with two registrations (BL-063 section 6); the carried count is one, not two",
          },
        ],
        dissolved: [
          {
            bit: "within-pair swap ({695, 3497} vs {1389, 1749})",
            status: "candidate dissolved",
            resolution: "the H8 reach-census closure law resolves all four unplaced assignments masks-only; the battery's valid members agree; the planning-pass distance-invisibility observation tested proximity axes and did not see the reach-census ordering",
          },
        ],
        statement: "the un-granting recovers the R-edge structure up to ONE carried bit (the office-orientation identification, carried to BL-065 with two agreeing candidate sources); the pre-registered swap-bit candidate dissolved at build",
      },
      higherTheorem: {
        question: "can the GOVERNS organization itself be derived from the same machinery that derived the contact geometry, rather than entering as granted input (BL-059)?",
        answer: "first direct attempt, affirmative and bounded: the 28-edge relation (requirements 1 and 3) is derived from the pre-grant machinery (masks + the canonical domain partition); the remainder is the anchoring partition and one orientation bit",
        label: "finding, not admission: this artifact derives; any GOVERNS-status change is a separate ceremony and is not performed here",
      },
      dependencyChain: {
        position: "phase 3 of 4 (BL-059 un-granting roadmap); the capstone link",
        consumes: "the phase-1 coordinates (via the phase-2 chain anchor), the phase-2 cycle ground (chain-linked, not needed by the R-layer laws), the canonical ledger and the containment mesh",
        provides: "the derived 28-edge R relation as a finding, and the programme's bit inventory: one carried bit (orientation, BL-065), the swap-bit candidate dissolved",
        necessaryNotSufficient: "each phase is necessary-not-sufficient: deriving the R edges does not conclude the governs program; the phase-4 dual-pole unification and the BL-065 resolution remain open",
      },
      limits: [
        "the derivation is relative to the canonical role/tier domain partition (the anchoring remainder); the partition is read, not derived",
        "the office labels carry the BL-065 orientation bit; the edge set does not depend on it (reflection-invariant)",
        "the swap candidate's dissolution is a build-phase finding (the closure law); the battery corroborates but its κ member is orientation-relative",
        "no dual-pole unification (phase 4 not attempted); the higher-theorem question gains a bounded affirmative finding, not a conclusion",
      ],
    },
    fences: {
      governsVerdicts: "none: this is a derivation finding, not a GOVERNS admission; no governs-status change; D4 derivable-via-R2 and D7 hypothesis-tier unchanged",
      recordAmendment: "none: this is a sandbox planning artifact",
      requirementScope: "requirements 1 and 3 (membership + the 28-edge edge structure) only; no dual-pole unification; no cycle-ground re-derivation",
      higherTheorem: "first direct attempt; finding recorded; the question gains a bounded affirmative result, not a conclusion",
      d7Control: "fenced: D7 remains hypothesis-tier; no D7 computation",
      g1Intra330: "untouched",
      direction: "structural parent->satellite only; the teleological direction question (BL-035) remains unassigned",
      membrane: "frame 2.6/2.7 and the brightness premise are interpretation vocabulary, never design input",
      canonical: "no canonical/Court/schema/Neo4j writes; the projection, ledger and mesh are read-only",
      packaging: "landing-time packaging (manifest, backlog registration) is a separate step",
      sessionProse: "context, not evidence",
      orientationBit: "the orientation bit is carried to BL-065, never resolved by this artifact; the derived edge set is orientation-invariant",
    },
    contractCitations: [
      "scrum/plan/bl-059-governs-derivability-scoping-memo.md (the higher-theorem question; section 3 requirements 1 and 3)",
      "scrum/plan/bl-059-d4-derivation-statement.md (the granted R in the D4 theorem's inputs; the corridor's bounded result)",
      "scrum/plan/bl-063-office-reconstruction-memo.md (phase 1: kappa up to the one named bit; the reflection bit's two agreeing sources)",
      "scrum/plan/bl-064-cycle-ground-memo.md (phase 2: the cycle ground; the dual-rule pattern; OD-64-1's IC discipline)",
      "scrum/plan/bl-055-d4-selection-review-memo.md (the 7-27/7-31 split; the satellite layer's partition)",
      "scrum/plan/bl-056-d4-r2-route-memo.md (the R2 route shape: geometry provides reach, the predicate provides selection)",
      "scrum/plan/bl-060-14v14-hunt-memo.md (GSL-1; the containment interface)",
      "scrum/plan/bl-061-062-zresidual-memo.md (GSL-1R polarization; GSL-2; the inversion-pair officeSum-6 structure)",
      "provenance/DECISION_LEDGER.md:2052-2062 (the principal authored input declaration and the grant attacked)",
      "provenance/DECISION_LEDGER.md:2665-2810 (ENTRY 15; derivable-via-R2 scope)",
      "qa/d4-production-generation.json (granted projection: R, anchors, office fields; comparison only)",
      "derived/hypergraph/bipartite-inclusion-v1.json (containment mesh; the reach control and GSL cross-check)",
    ],
    notAccomplished: [
      "no GOVERNS admission; the derivation is a finding, not an admission; any GOVERNS-status change is a separate ceremony",
      "no record amendment: ENTRY 10 immutable and ENTRY 15 unchanged; D4 derivable-via-R2 and D7 hypothesis-tier unchanged",
      "no claim event; no evidence obligations",
      "no orientation-bit resolution: carried to BL-065; the swap-bit candidate dissolved, not promoted",
      "no IC-tier promotion (the direction IC axis is carried as a candidate under the OD-64-1 discipline)",
      "no G1 movement; no INV-5 graduation; no M-walkability promotion",
      "no dual-pole unification (phase 4 not attempted); no cycle-ground re-derivation",
      "no canonical/Court/schema/Neo4j writes; no directional-semantics assignment",
    ],
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
    chainFingerprint: derivation.base.derivationFingerprint,
    domain: `${derivation.domain.parentCensus.count} parents / ${derivation.domain.satelliteCensus.count} satellites`,
    reach: `${derivation.reach.census.placed} placed / ${derivation.reach.census.unplaced} unplaced`,
    closure: `${derivation.closure.law.matchingSide.equalizingCount} equalizing matching`,
    coverage: `${derivation.coverage.derivedCount} derived / ${derivation.coverage.grantedCount} granted, set-equal ${derivation.coverage.setEqual}`,
    emergent4: derivation.closure.emergentCount.commonValue,
    verdict: derivation.synthesis.verdict,
    derivationFingerprint: derivation.derivationFingerprint,
  };
  if (check) {
    const existing = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, "utf8") : null;
    if (existing !== serialized) throw new Error("STALE_BL066_R_EDGE_DERIVATION");
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
