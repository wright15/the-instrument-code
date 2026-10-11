#!/usr/bin/env node
/**
 * Build the BL-064 cycle-ground derivation (Phase 2 of the BL-059 un-granting
 * roadmap: requirement 4, deriving the A0->A1 CONSTRUCTS pairs from the
 * recovered office coordinates kappa rather than reading the granted E edges).
 *
 * Consumed inputs: kappa (BL-063, both orientations, self-checked by
 * fingerprint) and the A0/A1 pitch masks (granted projection, masks only).
 * The granted E edges and the office fields are read only in the comparison
 * sections; the canonical class field only in the direction-secondary section.
 *
 * Rules (dual formulation, pre-registered equivalence):
 *   S-int  child-side (masks): an A1 mask with exactly two Hamming-2 A0
 *          neighbours takes those neighbours as its constructor pair (the
 *          containment sandwich holds on that unique pair)
 *   T-bdy  child-side (masks): an A1 mask with exactly one Hamming-2 A0
 *          neighbour is closed by its unique T+/-1 rotation twin
 *   K-int  coordinate-side (kappa): for each internal position c = 1..5, the
 *          unordered pair {kappa^-1(c-1), kappa^-1(c+1)}
 *   K-bdy  coordinate-side (masks + rotation): the two unordered A0 pairs in
 *          T+/-1 rotation relation (the seam pairs)
 *   unified: the seven pairs are exactly the seven cyclic distance-2 pairs in
 *          kappa ({c-1, c+1} mod 7, c = 0..6); midZ7 of every pair's positions
 *          equals c - the coordinate rule and the frozen midpoint law are one
 *          relation read in opposite directions
 *   equivalence (pre-registered): K-int set-equal S-int; K-bdy set-equal T-bdy
 *
 * Direction probes:
 *   D-mid  masks-only: the child is the unique envelope-middle of its
 *          construction triple (resolves 5/5 internal triples; the two
 *          boundary triples carry no envelope-middle)
 *   canonical class: the child carries the A1-anchor canonical class, the
 *          parents the A0 class (7/7; canonical read, labelled
 *          canonical-input-dependent)
 *   IC counts: interval-class counts computed from the mask alone partition
 *          the triples identically (candidate mask-only discriminator; the
 *          tier assignment is a maintainer ruling, not promoted here)
 *
 * Reflection: the derivation runs under both kappa orientations; the pair
 * sets are identical, the coordinate labels flip (c -> 6-c). The orientation
 * bit is carried to BL-065; it is never resolved here.
 *
 * Gates: V-P2-1 coverage (set-equal against the granted pairs); V-P2-2
 * mechanism consistency (no crossover); V-P2-3 reflection invariance;
 * V-P2-4 grant accounting (masks-only / canonical-computation / remaining).
 *
 * Fences: planning_evidence only. No claim event, no record amendment, no
 * GOVERNS derivation, no admission, no G1 movement, no directional-semantics
 * assignment, no canonical/Court/schema/Neo4j writes. The frame 2.6/2.7 is
 * interpretation vocabulary, never design input.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { midZ7 } from "./d4-derivation-engine.mjs";
import { canonicalText, fail, fileSha, readJson, sha256 } from "./verify-phase-a-proposals.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..");

export const SCHEMA_VERSION = "harmonic-orrery.bl064-cycle-ground.v1";
export const DERIVATION_ID = "BL064_CYCLE_GROUND_V1";
export const OUTPUT_PATH = "orrery/src/generated/bl064-cycle-ground.v1.json";
export const BL063_PATH = "orrery/src/generated/bl063-office-reconstruction.v1.json";
export const GENERATION_PATH = "qa/d4-production-generation.json";
export const LEDGER_PATH = "canonical/universal-heptatonic-ledger.json";

// ==== INTRINSIC-DERIVATION-BEGIN (masks + consumed kappa only) ====

function cmp(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
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

function sandwichHolds(p, q, child) {
  const inter = p & q;
  const union = p | q;
  return ((inter & child) === inter) && ((child & union) === child);
}

function pairKey(sortedPair) {
  return `${sortedPair[0]}-${sortedPair[1]}`;
}

function sortPairs(pairs) {
  return pairs
    .map((pair) => [pair[0], pair[1]].sort(cmp))
    .sort((left, right) => cmp(left[0], right[0]) || cmp(left[1], right[1]));
}

export function validateConsumedKappa(kappa0, kappa1, a0Masks) {
  const sorted = a0Masks.slice().sort(cmp);
  if (kappa0.size !== sorted.length || kappa1.size !== sorted.length) {
    fail("consumed kappa census drift");
  }
  const positions0 = new Set();
  for (const mask of sorted) {
    const p0 = kappa0.get(mask);
    const p1 = kappa1.get(mask);
    if (p0 === undefined || p1 === undefined) fail(`consumed kappa hole at ${mask}`);
    positions0.add(p0);
    if (p1 !== 6 - p0) fail(`consumed kappa orientation relation failure at ${mask}`);
  }
  for (let c = 0; c < 7; c += 1) {
    if (!positions0.has(c)) fail(`consumed kappa not a bijection: position ${c} missing`);
  }
  const inverse0 = new Map(sorted.map((mask) => [kappa0.get(mask), mask]));
  const inverse1 = new Map(sorted.map((mask) => [kappa1.get(mask), mask]));
  for (const [inverse, label] of [[inverse0, "kappa0"], [inverse1, "kappa1"]]) {
    for (let c = 0; c < 6; c += 1) {
      if (hamming12(inverse.get(c), inverse.get(c + 1)) !== 2) fail(`${label} line property failure at ${c}`);
    }
  }
  const degrees = new Map(sorted.map((mask) => [mask, 0]));
  for (let i = 0; i < sorted.length; i += 1) {
    for (let j = i + 1; j < sorted.length; j += 1) {
      if (hamming12(sorted[i], sorted[j]) === 2) {
        degrees.set(sorted[i], degrees.get(sorted[i]) + 1);
        degrees.set(sorted[j], degrees.get(sorted[j]) + 1);
      }
    }
  }
  const degreeSequence = [...degrees.values()].sort(cmp);
  if (canonicalText(degreeSequence) !== canonicalText([1, 1, 2, 2, 2, 2, 2])) {
    fail("P7 degree sequence re-derivation failure");
  }
  for (const [inverse, label] of [[inverse0, "kappa0"], [inverse1, "kappa1"]]) {
    if (degrees.get(inverse.get(0)) !== 1 || degrees.get(inverse.get(6)) !== 1) {
      fail(`${label} terminal positions are not the line endpoints`);
    }
  }
  return {
    bijection: true,
    orientationRelation: true,
    lineProperty: true,
    reDerivedDegreeSequence: degreeSequence,
    statement: "the consumed kappa is re-validated against the masks: both orientations are bijections onto 0..6, kappa1 = 6 - kappa0, consecutive positions are Hamming-2 adjacent (the P7 line), and positions 0 and 6 are the two line endpoints (degree 1 in the re-derived Hamming-2 graph)",
  };
}

export function deriveChildSide(a0Masks, a1Masks) {
  return a1Masks.slice().sort(cmp).map((child) => {
    const neighbors = a0Masks.filter((mask) => hamming12(mask, child) === 2).sort(cmp);
    if (neighbors.length === 2) {
      const [p, q] = neighbors;
      if (!sandwichHolds(p, q, child)) fail(`sandwich fails on the unique Hamming-2 pair at ${child}`);
      return { child, mode: "sandwich", neighbors, constructors: [p, q].sort(cmp), twin: null };
    }
    if (neighbors.length === 1) {
      const [pStar] = neighbors;
      const twins = a0Masks.filter((mask) => mask !== pStar && (
        rotateMask12(pStar, 1) === mask || rotateMask12(pStar, 11) === mask ||
        rotateMask12(mask, 1) === pStar || rotateMask12(mask, 11) === pStar)).sort(cmp);
      if (twins.length !== 1) fail(`twin-closure: ${twins.length} rotation partners at ${child}`);
      const [twin] = twins;
      if (sandwichHolds(pStar, twin, child)) fail(`boundary sandwich unexpectedly holds at ${child}`);
      return { child, mode: "twin-closure", neighbors, constructors: [pStar, twin].sort(cmp), twin };
    }
    fail(`Hamming-2 neighbour count ${neighbors.length} outside {1,2} at ${child}`);
  });
}

export function deriveCoordinateSide(kappa) {
  const inverse = new Map([...kappa.entries()].map(([mask, index]) => [index, mask]));
  const pairs = [];
  for (let c = 1; c <= 5; c += 1) {
    const left = inverse.get(c - 1);
    const right = inverse.get(c + 1);
    if (left === undefined || right === undefined) fail(`kappa inverse hole at internal position ${c}`);
    pairs.push({ center: c, pair: [left, right].sort(cmp) });
  }
  return pairs;
}

export function deriveBoundaryPairs(a0Masks) {
  const sorted = a0Masks.slice().sort(cmp);
  const pairs = [];
  for (let i = 0; i < sorted.length; i += 1) {
    for (let j = i + 1; j < sorted.length; j += 1) {
      const a = sorted[i];
      const b = sorted[j];
      if (rotateMask12(a, 1) === b || rotateMask12(a, 11) === b ||
          rotateMask12(b, 1) === a || rotateMask12(b, 11) === a) {
        pairs.push([a, b].sort(cmp));
      }
    }
  }
  if (pairs.length !== 2) fail(`boundary pair census: expected 2 rot+/-1 A0 pairs, got ${pairs.length}`);
  return pairs;
}

export function deriveCyclicPairs(kappa) {
  const inverse = new Map([...kappa.entries()].map(([mask, index]) => [index, mask]));
  const pairs = [];
  for (let c = 0; c < 7; c += 1) {
    const left = inverse.get((c + 6) % 7);
    const right = inverse.get((c + 1) % 7);
    if (left === undefined || right === undefined) fail(`kappa inverse hole at cyclic position ${c}`);
    pairs.push({ center: c, pair: [left, right].sort(cmp) });
  }
  return pairs;
}

export function midpointConsistency(kappa) {
  return deriveCyclicPairs(kappa).map(({ center, pair }) => {
    const mid = Number(midZ7(BigInt(kappa.get(pair[0])), BigInt(kappa.get(pair[1]))));
    if (mid !== center) fail(`midpoint consistency fails at center ${center}: got ${mid}`);
    return { center, pair, mid };
  });
}

export function envelopeDirection(entry) {
  const [p, q] = entry.constructors;
  const members = [
    { mask: entry.child, middle: sandwichHolds(p, q, entry.child) },
    { mask: p, middle: sandwichHolds(q, entry.child, p) },
    { mask: q, middle: sandwichHolds(p, entry.child, q) },
  ].sort((left, right) => cmp(left.mask, right.mask));
  const middles = members.filter((member) => member.middle);
  return {
    members,
    resolved: middles.length === 1,
    middle: middles.length === 1 ? middles[0].mask : null,
    middleIsChild: middles.length === 1 && middles[0].mask === entry.child,
  };
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

// ==== INTRINSIC-DERIVATION-END ====

// ---- comparison sections (the grant and the canonical ledger are read here) ----

export function buildDerivation() {
  const generation = readJson(GENERATION_PATH);
  const ledgerRows = readJson(LEDGER_PATH);
  const bl063 = readJson(BL063_PATH);
  const { reconstructionFingerprint, ...bl063Core } = bl063;
  if (sha256(canonicalText(bl063Core)) !== reconstructionFingerprint) fail("chain anchor fingerprint self-check failed");
  if (bl063.status !== "planning_evidence") fail("chain anchor status drift");

  const anchorRows = generation.projection.anchors.map((row) => ({
    id: Number(row.id), tier: row.tier, officeIndex: Number(row.officeIndex),
  }));
  if (anchorRows.length !== 14) fail("anchor census drift");
  const a0Masks = anchorRows.filter((row) => row.tier === "A0").map((row) => row.id).sort(cmp);
  const a1Masks = anchorRows.filter((row) => row.tier === "A1").map((row) => row.id).sort(cmp);
  if (a0Masks.length !== 7 || a1Masks.length !== 7) fail("mask census drift");
  const officeById = new Map(anchorRows.map((row) => [row.id, row.officeIndex]));

  const kappa0 = new Map(bl063.kappaBoth.kappa0.map((row) => [Number(row.mask), row.index]));
  const kappa1 = new Map(bl063.kappaBoth.kappa1.map((row) => [Number(row.mask), row.index]));
  const kappaValidation = validateConsumedKappa(kappa0, kappa1, a0Masks);

  // ---- intrinsic derivation ------------------------------------------------
  const childSide = deriveChildSide(a0Masks, a1Masks);
  const sandwichEntries = childSide.filter((entry) => entry.mode === "sandwich");
  const twinEntries = childSide.filter((entry) => entry.mode === "twin-closure");
  if (sandwichEntries.length !== 5 || twinEntries.length !== 2) fail("mechanism census drift");

  const kInt = deriveCoordinateSide(kappa1);
  const kBdyPairs = deriveBoundaryPairs(a0Masks);
  const unifiedRows = midpointConsistency(kappa1);
  const unified0Rows = midpointConsistency(kappa0);

  // pre-registered equivalence
  const sandwichPairs = sortPairs(sandwichEntries.map((entry) => entry.constructors));
  const twinPairs = sortPairs(twinEntries.map((entry) => entry.constructors));
  const kIntPairs = sortPairs(kInt.map((row) => row.pair));
  const kBdySorted = sortPairs(kBdyPairs);
  if (canonicalText(kIntPairs) !== canonicalText(sandwichPairs)) fail("equivalence failure: K-int vs S-int");
  if (canonicalText(kBdySorted) !== canonicalText(twinPairs)) fail("equivalence failure: K-bdy vs T-bdy");
  const unifiedPairs = sortPairs(unifiedRows.map((row) => row.pair));
  if (canonicalText(unifiedPairs) !== canonicalText(sortPairs([...kIntPairs, ...kBdySorted]))) fail("unified cyclic rule failure");
  if (new Set(unifiedPairs.map(pairKey)).size !== 7) fail("pair distinctness failure");

  // unified child attachment + mechanism crossover check (V-P2-2)
  const entryByPair = new Map(childSide.map((entry) => [pairKey([...entry.constructors].sort(cmp)), entry]));
  const unified = unifiedRows.map((row) => {
    const entry = entryByPair.get(pairKey(row.pair));
    if (!entry) fail(`unified pair without a child-side match at center ${row.center}`);
    const expectedMode = row.center === 0 || row.center === 6 ? "twin-closure" : "sandwich";
    if (entry.mode !== expectedMode) fail(`mechanism crossover at center ${row.center}`);
    return { center: row.center, pair: row.pair.map(String), mid: row.mid, child: String(entry.child), mode: entry.mode };
  });

  // V-P2-3 reflection: pair sets identical, labels flip c -> 6-c
  const unified0Pairs = sortPairs(unified0Rows.map((row) => row.pair));
  if (canonicalText(unified0Pairs) !== canonicalText(unifiedPairs)) fail("reflection invariance failure");
  const center0ByPair = new Map(unified0Rows.map((row) => [pairKey(row.pair), row.center]));
  const labelMap = unifiedRows.map((row) => {
    const center0 = center0ByPair.get(pairKey(row.pair));
    if (center0 === undefined) fail(`reflection pair missing under kappa0: ${pairKey(row.pair)}`);
    if (center0 !== (6 - row.center) % 7) fail(`reflection label flip failure at pair ${pairKey(row.pair)}`);
    return { pair: row.pair.map(String), center1: row.center, center0 };
  });

  // ---- direction probes ----------------------------------------------------
  const directionRows = childSide.map((entry) => ({ entry, envelope: envelopeDirection(entry) }));
  const dMidPerTriple = directionRows.map(({ entry, envelope }) => ({
    child: String(entry.child),
    constructors: entry.constructors.map(String),
    members: envelope.members.map((member) => ({ mask: String(member.mask), middle: member.middle })),
    resolved: envelope.resolved,
    middleIsChild: envelope.middleIsChild,
  }));
  if (dMidPerTriple.some((row) => row.resolved && !row.middleIsChild)) fail("D-mid resolved middle is not the child");
  const dMidInternal = directionRows.filter(({ entry, envelope }) => entry.mode === "sandwich" && envelope.middleIsChild).length;
  const dMidBoundary = directionRows.filter(({ entry, envelope }) => entry.mode === "twin-closure" && envelope.resolved).length;
  if (dMidInternal !== 5) fail(`D-mid internal resolution drift: ${dMidInternal}/5`);
  if (dMidBoundary !== 0) fail(`D-mid boundary resolution drift: ${dMidBoundary}/2`);

  const ledgerById = new Map(ledgerRows.map((row) => [Number(row.id), row]));
  const classPerTriple = childSide.map((entry) => ({
    child: String(entry.child),
    childClass: ledgerById.get(entry.child)?.forte ?? null,
    parentClasses: entry.constructors.map((mask) => ledgerById.get(mask)?.forte ?? null),
  }));
  for (const row of classPerTriple) {
    if (row.childClass === null || row.parentClasses.some((value) => value === null)) fail("canonical class field missing");
  }
  const childClasses = new Set(classPerTriple.map((row) => row.childClass));
  const parentClasses = new Set(classPerTriple.flatMap((row) => row.parentClasses));
  if (childClasses.size !== 1 || parentClasses.size !== 1) fail("canonical class split drift");
  const [childClass] = [...childClasses];
  const [parentClass] = [...parentClasses];
  if (childClass === parentClass) fail("canonical class does not separate the tiers");
  const classSplit = classPerTriple.filter((row) => row.childClass === childClass && row.parentClasses.every((value) => value === parentClass)).length;
  if (classSplit !== 7) fail("canonical class split count drift");

  const icRows = childSide.map((entry) => ({
    child: String(entry.child),
    childIc: icCountsOfMask(entry.child),
    parentIcs: entry.constructors.map((mask) => icCountsOfMask(mask)),
  }));
  const icChildSet = new Set(icRows.map((row) => canonicalText(row.childIc)));
  const icParentSet = new Set(icRows.flatMap((row) => row.parentIcs.map((ic) => canonicalText(ic))));
  if (icChildSet.size !== 1 || icParentSet.size !== 1) fail("IC-count split drift");
  const childIc = icRows[0].childIc;
  const parentIc = icRows[0].parentIcs[0];
  if (canonicalText(childIc) === canonicalText(parentIc)) fail("IC counts do not separate the tiers");
  const icMatchesClassSplit = icRows.every((row) => canonicalText(row.childIc) === canonicalText(childIc) &&
    row.parentIcs.every((ic) => canonicalText(ic) === canonicalText(parentIc)));

  // ---- coverage against the granted E edges (comparison only) --------------
  const eByChild = new Map();
  const grantedKeys = [];
  for (const edge of generation.projection.E) {
    if (edge.type !== "CONSTRUCTS" || edge.parentTier !== "A0" || edge.childTier !== "A1") fail("E edge shape drift");
    const child = Number(edge.target);
    const parent = Number(edge.source);
    const list = eByChild.get(child) ?? [];
    list.push(parent);
    eByChild.set(child, list);
    grantedKeys.push(`${parent}->${child}`);
  }
  if (eByChild.size !== 7) fail("E child census drift");
  const derivedKeys = childSide.flatMap((entry) => entry.constructors.map((parent) => `${parent}->${entry.child}`));
  const sortedDerived = derivedKeys.slice().sort();
  const sortedGranted = grantedKeys.slice().sort();
  if (canonicalText(sortedDerived) !== canonicalText(sortedGranted)) fail("V-P2-1 coverage failure: derived set differs from the granted E set");
  const missing = sortedGranted.filter((key) => !sortedDerived.includes(key));
  const extra = sortedDerived.filter((key) => !sortedGranted.includes(key));
  const perChild = childSide.map((entry) => {
    const derived = entry.constructors.map(String);
    const granted = (eByChild.get(entry.child) ?? []).slice().sort(cmp).map(String);
    if (canonicalText(derived) !== canonicalText(granted)) fail(`coverage per-child mismatch at ${entry.child}`);
    return { child: String(entry.child), derived, granted, equal: true };
  });
  const officeAlignment = unified.map((row) => {
    const grantedOffice = officeById.get(Number(row.child));
    return { child: row.child, center: row.center, grantedOffice, match: row.center === grantedOffice };
  });
  const officeAlignmentMatches = officeAlignment.filter((row) => row.match).length;
  if (officeAlignmentMatches !== 7) fail("office alignment drift: derived centers do not reproduce the granted offices under kappa1");

  // ---- artifact assembly ---------------------------------------------------
  const rules = {
    sInt: {
      definition: "child-side (masks): for each A1 mask h, N(h) = {a in A0 : hamming12(a, h) = 2}; if |N(h)| = 2 then constructors = N(h); the containment sandwich holds on that unique pair",
      perAnchor: sandwichEntries.map((entry) => ({
        child: String(entry.child),
        hamming2Neighbors: entry.neighbors.map(String),
        constructors: entry.constructors.map(String),
        sandwichHolds: true,
      })).sort((left, right) => cmp(Number(left.child), Number(right.child))),
      count: sandwichEntries.length,
    },
    tBdy: {
      definition: "child-side (masks): for each A1 mask h with |N(h)| = 1, constructors = the sole Hamming-2 neighbour plus its unique T+/-1 rotation twin; the sandwich fails on this pair",
      perAnchor: twinEntries.map((entry) => ({
        child: String(entry.child),
        hamming2Neighbor: String(entry.neighbors[0]),
        twin: String(entry.twin),
        constructors: entry.constructors.map(String),
        sandwichHolds: false,
      })).sort((left, right) => cmp(Number(left.child), Number(right.child))),
      count: twinEntries.length,
    },
    kInt: {
      definition: "coordinate-side (kappa): for each internal position c = 1..5, the unordered pair {kappa^-1(c-1), kappa^-1(c+1)}",
      perCenter: kInt.map((row) => ({ center: row.center, pair: row.pair.map(String) })),
      count: kInt.length,
    },
    kBdy: {
      definition: "coordinate-side (masks + rotation): the two unordered A0 pairs in T+/-1 rotation relation (the seam pairs); equivalently the wrap pairs of the cyclic rule at centers 0 and 6",
      pairs: kBdySorted.map((pair) => pair.map(String)),
      count: kBdySorted.length,
    },
    unified: {
      definition: "the seven constructor pairs are exactly the seven cyclic distance-2 pairs in kappa: for c = 0..6, {kappa^-1((c+6) mod 7), kappa^-1((c+1) mod 7)}; midZ7 of each pair's positions equals c",
      perCenter: unified,
      count: unified.length,
      midpointStatement: "midZ7(c-1, c+1) = (4*(2c)) mod 7 = c: the coordinate rule and the frozen midpoint law are one relation read in opposite directions; the two boundary centers (0, 6) realize the two observation-exact T1 seam relations, the five internal centers (1..5) realize the five confirmation-marked T2 midpoint predictions (BL-056 G5)",
    },
    equivalence: {
      kIntEqualsSInt: true,
      kBdyEqualsTBdy: true,
      statement: "pre-registered equivalence holds: the coordinate-side rule (kappa only) and the child-side rule (masks only) generate the same pair sets. The pairs exist because kappa exists, and kappa exists because the masks' Hamming geometry exists; the grant is reachable from the geometry in two provably-equivalent formulations.",
    },
  };

  const coverage = {
    rule: "V-P2-1: the derived directed edge set (constructor -> child, child-side rules) is compared against the granted E edges",
    grantedSource: GENERATION_PATH,
    derivedDirectedCount: derivedKeys.length,
    grantedDirectedCount: grantedKeys.length,
    setEqual: true,
    missing,
    extra,
    perChild,
    officeAlignment: {
      matches: officeAlignmentMatches,
      perChild: officeAlignment,
      statement: "under the kappa1 orientation the derived center of each pair equals the granted child office (7/7), consistent with BL-063's outcome M1; comparison only",
    },
    statement: "the derivation generates exactly the granted 14 directed CONSTRUCTS edges: 7 unordered pairs, 2 parents per A1 anchor, no extras, no missing",
  };

  const reflection = {
    definition: "the derivation is run under both kappa orientations (kappa0 = the claim-free BFS scaffold, kappa1 = its reflection)",
    pairsIdentical: true,
    unifiedPairsKappa1: unifiedRows.map((row) => ({ center: row.center, pair: row.pair.map(String) })),
    unifiedPairsKappa0: unified0Rows.map((row) => ({ center: row.center, pair: row.pair.map(String) })),
    labelMap,
    directionOrientationIndependent: true,
    statement: "the seven pair sets are identical under both orientations; only the coordinate labels flip (c -> 6-c). The pair structure is reflection-invariant; the orientation labelling is reflection-relative and the one-bit dependency is carried to BL-065, never resolved here. The direction probes are mask functions and orientation-independent.",
  };

  const direction = {
    dMid: {
      rule: "masks-only: within a construction triple, the child is the member m for which sandwichHolds(other1, other2, m) holds (the envelope-middle)",
      perTriple: dMidPerTriple,
      resolvedCount: dMidInternal + dMidBoundary,
      internalResolved: `${dMidInternal}/5`,
      boundaryResolved: `${dMidBoundary}/2`,
      statement: "the child is uniquely the envelope-middle of all five internal triples (5/5); the two boundary triples carry no envelope-middle (the sandwich fails on every choice). The internal direction is mask-derivable; the boundary is where the envelope geometry runs out",
    },
    canonicalClass: {
      rule: "the child carries the A1-anchor canonical class; the parents carry the A0 class",
      field: "forte",
      source: LEDGER_PATH,
      perTriple: classPerTriple,
      parentClass,
      childClass,
      splitCount: classSplit,
      label: "canonical-input-dependent (the field is read from the canonical ledger); recorded as the OD-P2-2 secondary probe result, not mask-intrinsic",
    },
    icCounts: {
      rule: "interval-class counts computed from the mask alone (IC1..IC6 pair-distance census)",
      parentIc,
      childIc,
      matchesCanonicalClassSplit: icMatchesClassSplit,
      perTriple: icRows,
      status: "candidate mask-only discriminator found by the probe hunt; carried as an observation. The tier assignment of the boundary/full direction (masks-only vs canonical-computation) is a maintainer ruling (open decision), not silently promoted.",
    },
    accounting: {
      tiers: {
        masksOnly: {
          pairStructure: "7/7 unordered pairs (K rules) and the child attachment (S/T rules), from masks plus the consumed kappa alone",
          internalDirection: "5/7 (D-mid: the child is the unique envelope-middle of its triple)",
        },
        canonicalComputation: {
          fullDirection: "7/7 via the canonical class asymmetry (A0 class vs A1 class, canonical ledger field)",
          label: "canonical-input-dependent; the OD-P2-2 secondary probe result",
        },
        remainingGranted: [
          "the A0/A1 anchor set and its tier membership (projection anchors; the pair content is discharged, the anchor partition is not this phase's target)",
          "the E edge bookkeeping (edge ids, tier tags); the edge existence, endpoints and direction are discharged",
          "the R2 walk direction (presentation convention per the BL-059 statement; not claimed)",
          "the satellite layer and the GOVERNS relation (phase 3+ scope)",
        ],
      },
      openDecision: "the interval-class counts computed from the mask alone partition the triples identically (candidate mask-only discriminator); whether the boundary/full direction is re-tiered masks-only is a maintainer ruling, not promoted here",
      statement: "Phase 2 discharges the CONSTRUCTS pair structure masks-only and the internal direction masks-only (5/7); the full direction is discharged at the canonical-computation tier via the class asymmetry; the anchor tier membership, the walk direction and the satellite layer remain granted",
    },
  };

  const gates = {
    "V-P2-1": {
      name: "coverage",
      result: "PASS",
      statement: "derived 7 unordered pairs / 14 directed edges set-equal the granted E pairs; missing [], extra []",
    },
    "V-P2-2": {
      name: "mechanism consistency",
      result: "PASS",
      statement: "S-int generates the 5 internal pairs, T-bdy the 2 boundary pairs; K-int/K-bdy set-equal per mechanism; no crossover (unified mode matches the center class)",
    },
    "V-P2-3": {
      name: "reflection handling",
      result: "PASS",
      statement: "pair sets identical under kappa0 and kappa1; coordinate labels flip c -> 6-c; the orientation bit is carried to BL-065, not resolved",
    },
    "V-P2-4": {
      name: "grant accounting",
      result: "PASS",
      statement: "three tiers recorded: masks-only (pair structure 7/7; internal direction 5/7), canonical-computation (full direction 7/7 via the class asymmetry), remaining-granted (anchor tier membership; E bookkeeping; walk direction; satellite layer)",
    },
  };

  const synthesis = {
    requirement: "BL-059 section 3 requirement 4: a replacement for the granted CONSTRUCTS pairs as the cycle's ground - a derivation of the pairs themselves",
    preRegisteredVerdicts: ["CYCLE_GROUND_DERIVED", "CYCLE_GROUND_CONSTRAINED", "FAILED"],
    verdict: "CYCLE_GROUND_DERIVED",
    verdictStatement: "The A0->A1 CONSTRUCTS pair structure is derived from the recovered coordinates: seven unordered pairs generated by the coordinate-side kappa rule, their children attached by the child-side sandwich/twin-closure rules, the two formulations proven set-equal and set-equal to the granted 14 directed edges, reflection-invariant in pair content. The direction is discharged masks-only for the five internal triples (the child is the envelope-middle) and at the canonical-computation tier for the full seven via the canonical class asymmetry; the boundary remainder is honestly accounted.",
    grantDischarge: {
      discharged: "the CONSTRUCTS pair structure (7 unordered pairs, 14 directed edges given the A0/A1 tier membership) masks-only; the internal direction (5/7) masks-only; the full direction (7/7) at the canonical-computation tier",
      remaining: "the A0/A1 anchor set and tier membership (granted projection input); the E edge bookkeeping fields; the walk direction (presentation convention); the satellite layer and the GOVERNS relation (phase 3+)",
      statement: "Phase 2 discharges the CONSTRUCTS pair-structure grant and, at two tiers, the direction; nothing beyond the CONSTRUCTS pairs is discharged",
    },
    dependencyChain: {
      position: "phase 2 of 4 (BL-059 un-granting roadmap); the second recovered link",
      consumes: "BL-063's kappa (both orientations) and the A0/A1 pitch masks; the frozen midZ7 rotation forms",
      provides: "the cycle ground - the seven derived constructor pairs and their kappa geometry - as the input to phase 3 (the 28-edge GOVERNS derivation)",
      necessaryNotSufficient: "deriving the cycle ground does not derive the GOVERNS relation; each phase is necessary-not-sufficient and the chain's next link remains open",
    },
    limits: [
      "the derivation is reflection-relative: the pair content is invariant, the orientation labelling carries the one-bit dependency (BL-065)",
      "the boundary direction tier (canonical-computation vs the mask-only IC candidate) is a maintainer ruling; not promoted here",
      "no GOVERNS derivation, no 28-edge generator, no dual-pole unification (phases 3 and 4 not attempted)",
      "the higher-theorem question (BL-059) remains open",
    ],
  };

  const fences = {
    governsVerdicts: "none: no GOVERNS derivation is claimed; D4 derivable-via-R2 and D7 hypothesis-tier unchanged",
    recordAmendment: "none: this is a sandbox planning artifact",
    requirementScope: "requirement 4 only (the CONSTRUCTS cycle ground); no 28-edge generator, no dual-pole unification",
    higherTheorem: "not answered: the scoping memo's question remains open; this sprint is the second recovered link of the un-granting roadmap",
    d7Control: "fenced: D7 remains hypothesis-tier; no D7 computation",
    g1Intra330: "untouched",
    direction: "directional-semantics unassigned (BL-035 carried); the edge direction discharged here is structural (parent/child identity), not the teleological direction question",
    membrane: "frame 2.6/2.7 and the brightness premise are interpretation vocabulary, never design input",
    canonical: "no canonical/Court/schema/Neo4j writes; the projection and ledgers are read-only",
    packaging: "landing-time packaging (manifest, backlog registration) is a separate step",
    sessionProse: "context, not evidence",
    reflectionBit: "the orientation bit is carried to BL-065, never resolved by this artifact",
  };

  const core = {
    schemaVersion: SCHEMA_VERSION,
    derivationId: DERIVATION_ID,
    status: "planning_evidence",
    generator: "scripts/build-bl064-cycle-ground.mjs",
    sourceBindings: [
      { artifact: BL063_PATH, sha256: fileSha(BL063_PATH), role: "phase-1 chain anchor (office coordinates kappa, both orientations; consumed by fingerprint self-check)" },
      { artifact: GENERATION_PATH, sha256: fileSha(GENERATION_PATH), role: "granted projection (anchor masks; E construct edges and office fields: comparison only)" },
      { artifact: LEDGER_PATH, sha256: fileSha(LEDGER_PATH), role: "canonical ledger (canonical class field for the direction-secondary probe)" },
    ],
    base: {
      artifact: BL063_PATH,
      reconstructionFingerprint: bl063.reconstructionFingerprint,
      projectionArtifact: GENERATION_PATH,
      importPolicy: "the chain anchor is consumed for kappaBoth only (both orientations), self-checked by fingerprint; the granted projection is read for anchor masks in the intrinsic region, and for the E edges and office fields only in the comparison sections; the canonical ledger is read for the class field only in the direction-secondary section (canonical-computation tier, labelled)",
    },
    kappaConsumed: {
      kappa0: bl063.kappaBoth.kappa0.map((row) => ({ mask: String(row.mask), index: row.index })),
      kappa1: bl063.kappaBoth.kappa1.map((row) => ({ mask: String(row.mask), index: row.index })),
      validation: kappaValidation,
    },
    rules,
    coverage,
    reflection,
    direction,
    gates,
    synthesis,
    fences,
    contractCitations: [
      "scrum/plan/bl-059-governs-derivability-scoping-memo.md (higher-theorem question; section 3 requirement 4 - replacement for the granted CONSTRUCTS pairs; section 5.2 the cycle ground is itself granted)",
      "scrum/plan/bl-063-office-reconstruction-memo.md (phase 1: kappa up to one named bit; the 5 sandwich + 2 twin-closure construction mechanisms; reflection-equivariance)",
      "orrery/src/generated/bl063-office-reconstruction.v1.json (consumed kappa; chain anchor by fingerprint)",
      "provenance/DECISION_LEDGER.md:2052-2062 (the principal authored input declaration and the grant being attacked)",
      "scrum/plan/bl-059-d4-derivation-statement.md (the cycle ground in the theorem's inputs; walk direction as presentation convention)",
      "scrum/plan/bl-056-d4-r2-route-memo.md (G5 midpoint census; the 2 exact T1 seam relations and the 5 T2 predictions)",
      "scrum/BACKLOG.md:886-893 (BL-064 capture: the E-pair set-equality pre-registration)",
      "qa/d4-production-generation.json (granted projection: E, anchors, office fields; comparison only)",
    ],
    notAccomplished: [
      "no R-edge derivation; phase 3 (the 28-edge GOVERNS relation) not attempted",
      "no GOVERNS admission; no higher-theorem answer",
      "no record amendment: ENTRY 10 immutable and ENTRY 15 unchanged; D4 derivable-via-R2 and D7 hypothesis-tier unchanged",
      "no G1 movement; no INV-5 graduation; no M-walkability promotion",
      "no orientation-bit resolution: the reflection dependency is carried to BL-065",
      "no canonical/Court/schema/Neo4j writes; no claim event; no admission of any kind",
      "no dual-pole unification (phase 4 not attempted)",
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
    chainFingerprint: derivation.base.reconstructionFingerprint,
    pairCount: derivation.rules.unified.count,
    coverage: `${derivation.coverage.derivedDirectedCount} derived / ${derivation.coverage.grantedDirectedCount} granted, set-equal ${derivation.coverage.setEqual}`,
    reflection: `pairs identical ${derivation.reflection.pairsIdentical}, labels flip c->6-c`,
    dMid: `${derivation.direction.dMid.internalResolved} internal, ${derivation.direction.dMid.boundaryResolved} boundary`,
    canonicalClass: `${derivation.direction.canonicalClass.splitCount}/7 (${derivation.direction.canonicalClass.parentClass} vs ${derivation.direction.canonicalClass.childClass})`,
    icCandidate: `matches canonical split ${derivation.direction.icCounts.matchesCanonicalClassSplit}`,
    verdict: derivation.synthesis.verdict,
    derivationFingerprint: derivation.derivationFingerprint,
  };
  if (check) {
    const existing = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, "utf8") : null;
    if (existing !== serialized) throw new Error("STALE_BL064_CYCLE_GROUND");
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
