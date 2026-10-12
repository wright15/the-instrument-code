#!/usr/bin/env node
/**
 * Build the BL-080 GOVERNS derivation (Gate 2 of the BL-079 design spec): the
 * re-specified D4 pipeline's S0' derived-projection assembly plus the
 * predicate-selected contact set, from the un-granting program's landed
 * replacements.
 *
 * Consumed chain anchors (self-checked by fingerprint):
 *   BL-063 kappa (both orientations)     BL-064 cycle ground (7 pairs)
 *   BL-066 R-edge structure (28 edges)   BL-078 isolation-pattern precedent
 *   BL-055 predicate source
 * Licensed remainder reads (labelled; the anchoring remainder):
 *   frozen projection anchor identities: id, tier, role (the granted office
 *   field is never read in the assembly); frozen projection edge ids
 *   (presentation conventions, R/E bookkeeping keys); canonical ledger class
 *   field (the predicate's single-hop source); canonical ledger office field
 *   (the comparison-region office-flatness calibration only). The frozen
 *   projection's semantic fields are read only in the comparison region, and
 *   the receipt only for the baseline and the landed contact rows.
 *
 * Gates: V-G2-1 projection assembly set-equality (field-for-field, missing/
 * extra empty); V-G2-2 predicate selection set-equality (14/14 against the
 * landed contact rows); V-G2-3 orientation invariance (labels flip c -> 6-c); V-G2-4 isolation
 * (region-scoped; granted bytes in the derivation path: 0); V-G2-5 frozen
 * projection validation + digests equal to the frozen bindings.
 *
 * S1'-S5' pipeline paths are landed (the frozen pure modules imported
 * verbatim) and unexecuted: the pipeline run is Gate 3, separately
 * authorized. The conditional green light: the derivation runs on derived
 * inputs plus the named anchoring remainder (partition, orientation bit,
 * presentation conventions).
 *
 * Fences: planning_evidence only. No pipeline execution, no receipt write, no
 * claim event, no record amendment, no GOVERNS admission, no G1 movement, no
 * INV-5 graduation, no M-walkability promotion, no canonical/Court/schema/
 * Neo4j writes; the frame 2.6/2.7 is interpretation vocabulary, never design
 * input; session prose is context, not evidence.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { generate } from "./d4-generation.mjs";
import { projectionDigests, validateProjection } from "./d4-inputs.mjs";
import { canonicalText, fail, fileSha, readJson, sha256 } from "./verify-phase-a-proposals.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..");

export const SCHEMA_VERSION = "harmonic-orrery.bl080-governs-derivation.v1";
export const DERIVATION_ID = "BL080_GOVERNS_DERIVATION_V1";
export const OUTPUT_PATH = "orrery/src/generated/bl080-governs-derivation.v1.json";
export const BL063_PATH = "orrery/src/generated/bl063-office-reconstruction.v1.json";
export const BL064_PATH = "orrery/src/generated/bl064-cycle-ground.v1.json";
export const BL066_PATH = "orrery/src/generated/bl066-r-edge-derivation.v1.json";
export const BL078_PATH = "orrery/src/generated/bl078-d7-retest.v1.json";
export const BL055_PATH = "orrery/src/generated/d4-selection-review.v1.json";
export const GENERATION_PATH = "qa/d4-production-generation.json";
export const RECEIPT_PATH = "qa/d4-production-receipt.json";
export const LEDGER_PATH = "canonical/universal-heptatonic-ledger.json";
export const PREDICATE_CLASS = "7-27";

// ==== INTRINSIC-DERIVATION-BEGIN (kappa + pairs + edge structure + predicate; remainder inputs are parameters) ====

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

export function derivePairsFromMasks(a0Masks, a1Masks) {
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

export function readPairs(rows) {
  return rows.map((row) => ({
    center: row.center,
    child: String(row.child),
    pair: [String(row.pair[0]), String(row.pair[1])].sort((left, right) => cmp(Number(left), Number(right))),
    mode: row.mode,
    mid: row.mid,
  })).sort((left, right) => cmp(left.center, right.center));
}

export function readREdges(rows) {
  return rows.map((row) => ({
    parent: String(row.parent),
    center1: row.center1,
    satellites: [...row.satellites].map(String).sort((left, right) => cmp(Number(left), Number(right))),
    h2Count: row.h2Count,
    closureCount: row.closureCount,
  })).sort((left, right) => cmp(Number(left.parent), Number(right.parent)));
}

export function deriveOffices(kappa, pairs) {
  const offices = new Map();
  for (const [mask, index] of kappa.entries()) offices.set(String(mask), index);
  for (const row of pairs) offices.set(String(row.child), row.center);
  return offices;
}

export function flipPairs(pairs) {
  return pairs.map((row) => ({ ...row, center: (6 - row.center) % 7 }));
}

export function predicateSelect(rEdges, classById) {
  return rEdges.map((row) => ({
    parent: row.parent,
    center1: row.center1,
    satellites: row.satellites,
    selected: row.satellites.filter((satellite) => classById.get(satellite) === PREDICATE_CLASS),
  }));
}

// ==== INTRINSIC-DERIVATION-END ====

// ---- licensed remainder reads and comparison sections (the frozen projection, the receipt and the ledger are read here) ----

function chainSelfCheck(artifact, fingerprintField, label) {
  const core = { ...artifact };
  delete core[fingerprintField];
  if (artifact.status !== "planning_evidence") fail(`${label}: chain anchor status drift`);
  if (typeof artifact[fingerprintField] !== "string" || !/^[0-9a-f]{64}$/.test(artifact[fingerprintField])) {
    fail(`${label}: chain anchor fingerprint format drift`);
  }
  if (sha256(canonicalText(core)) !== artifact[fingerprintField]) {
    fail(`${label}: chain anchor fingerprint self-check failed`);
  }
}

function strip(row, fields) {
  return Object.fromEntries(fields.map((field) => [field, row[field]]));
}

export function runDerivedPipeline(projection) {
  return generate(projection);
}

export function buildDerivation() {
  // ---- chain anchors ----
  const bl063 = readJson(BL063_PATH);
  chainSelfCheck(bl063, "reconstructionFingerprint", "BL-063");
  const bl064 = readJson(BL064_PATH);
  chainSelfCheck(bl064, "derivationFingerprint", "BL-064");
  const bl066 = readJson(BL066_PATH);
  chainSelfCheck(bl066, "derivationFingerprint", "BL-066");
  const bl078 = readJson(BL078_PATH);
  chainSelfCheck(bl078, "derivationFingerprint", "BL-078");
  const bl055 = readJson(BL055_PATH);
  chainSelfCheck(bl055, "reviewFingerprint", "BL-055");
  const generation = readJson(GENERATION_PATH);
  const receipt = readJson(RECEIPT_PATH);
  const ledgerRows = readJson(LEDGER_PATH);

  // ---- licensed remainder reads (labelled: anchoring remainder + presentation + canonical single-hop) ----
  const anchorIdentities = generation.projection.anchors.map((row) => ({ id: row.id, tier: row.tier, role: row.role }));
  const rIdByPair = new Map(generation.projection.R.map((edge) => [`${edge.source}>${edge.target}`, edge.id]));
  const eIdByPair = new Map(generation.projection.E.map((edge) => [`${edge.source}>${edge.target}`, edge.id]));
  const classById = new Map(ledgerRows.map((row) => [String(row.id), row.forte]));
  const ledgerOfficeById = new Map(ledgerRows.map((row) => [String(row.id), String(row.officeIndex)]));

  // ---- intrinsic derivation ----
  const kappa0 = new Map(bl063.kappaBoth.kappa0.map((row) => [Number(row.mask), row.index]));
  const kappa1 = new Map(bl063.kappaBoth.kappa1.map((row) => [Number(row.mask), row.index]));
  const a0Masks = bl063.kappaBoth.kappa1.map((row) => Number(row.mask)).sort(cmp);
  const a1Masks = bl064.rules.unified.perCenter.map((row) => Number(row.child)).sort(cmp);
  if (a0Masks.length !== 7 || a1Masks.length !== 7) fail("mask census drift");
  const kappaValidation = validateConsumedKappa(kappa0, kappa1, a0Masks);

  const masksOnlyPairs = derivePairsFromMasks(a0Masks, a1Masks);
  const pairs = readPairs(bl064.rules.unified.perCenter);
  const masksOnlyPairKeys = sortPairs(masksOnlyPairs.map((row) => row.constructors));
  const consumedPairKeys = sortPairs(pairs.map((row) => row.pair.map(Number)));
  if (canonicalText(masksOnlyPairKeys) !== canonicalText(consumedPairKeys)) {
    fail("masks-only pair re-derivation mismatch");
  }
  const masksOnlyChildByPair = new Map(masksOnlyPairs.map((row) => [pairKey(row.constructors), String(row.child)]));
  const pairsCrossCheck = pairs.every((row) => masksOnlyChildByPair.get(pairKey(row.pair.map(Number))) === row.child);
  if (!pairsCrossCheck) fail("masks-only child attachment mismatch");

  const rEdges = readREdges(bl066.mechanism.perOffice);
  if (rEdges.length !== 7) fail("R-edge parent census drift");
  const satelliteCensus = rEdges.flatMap((row) => row.satellites);
  if (satelliteCensus.length !== 28 || new Set(satelliteCensus).size !== 28) fail("satellite census drift");

  const offices1 = deriveOffices(kappa1, pairs);
  const offices0 = deriveOffices(kappa0, flipPairs(pairs));
  for (const row of rEdges) {
    if (offices1.get(row.parent) !== row.center1) fail(`office mismatch at ${row.parent}`);
  }
  const selection = predicateSelect(rEdges, classById);
  const selectionCount = selection.reduce((total, row) => total + row.selected.length, 0);
  if (selectionCount !== 14) fail(`selection census drift: ${selectionCount}`);

  // ---- wire assembly (S0') ----
  const derivedAnchors = anchorIdentities
    .map((row) => ({ id: row.id, tier: row.tier, role: row.role, officeIndex: String(offices1.get(row.id)) }))
    .sort((left, right) => cmp(left.id, right.id));
  const derivedR = rEdges.flatMap((row) => row.satellites.map((satellite) => ({
    id: rIdByPair.get(`${row.parent}>${satellite}`),
    type: "GOVERNS",
    source: row.parent,
    target: satellite,
    directed: true,
    parentTier: "A1",
    childTier: "A1",
    parentOffice: String(row.center1),
  }))).sort((left, right) => cmp(left.id, right.id));
  const derivedE = pairs.flatMap((row) => row.pair.map((parent) => ({
    id: eIdByPair.get(`${parent}>${row.child}`),
    type: "CONSTRUCTS",
    source: parent,
    target: row.child,
    directed: true,
    parentTier: "A0",
    childTier: "A1",
  }))).sort((left, right) => cmp(left.id, right.id));
  if (derivedR.some((row) => typeof row.id !== "string") || derivedE.some((row) => typeof row.id !== "string")) {
    fail("presentation id carry hole");
  }
  const derivedProjection = { anchors: derivedAnchors, R: derivedR, E: derivedE };
  validateProjection(derivedProjection);
  const digests = projectionDigests(derivedProjection);
  const frozenDigests = generation.bindings.projectionDigests;
  if (canonicalText(digests) !== canonicalText(frozenDigests)) {
    fail("derived projection digests do not match the frozen bindings");
  }

  // ---- S0' comparison: semantic and full-row set-equality against the frozen projection ----
  const granted = generation.projection;
  const compareCollection = (derivedRows, grantedRows, keyOf, semanticOf) => {
    const dKeys = derivedRows.map(keyOf);
    const gKeys = grantedRows.map(keyOf);
    const dSet = new Set(dKeys);
    const gSet = new Set(gKeys);
    const dSem = derivedRows.map((row) => canonicalText(semanticOf(row))).sort();
    const gSem = grantedRows.map((row) => canonicalText(semanticOf(row))).sort();
    const gByKey = new Map(grantedRows.map((row) => [keyOf(row), row]));
    const fullRowSetEqual = derivedRows.every((row) => canonicalText(row) === canonicalText(gByKey.get(keyOf(row))));
    return {
      derivedCount: derivedRows.length,
      grantedCount: grantedRows.length,
      semanticSetEqual: canonicalText(dSem) === canonicalText(gSem),
      fullRowSetEqual,
      missing: gKeys.filter((key) => !dSet.has(key)),
      extra: dKeys.filter((key) => !gSet.has(key)),
    };
  };
  const anchorsEquality = compareCollection(derivedAnchors, granted.anchors, (row) => row.id, (row) => row);
  const rEquality = compareCollection(derivedR, granted.R, (row) => `${row.source}>${row.target}`,
    (row) => strip(row, ["type", "source", "target", "directed", "parentTier", "childTier", "parentOffice"]));
  const eEquality = compareCollection(derivedE, granted.E, (row) => `${row.source}>${row.target}`,
    (row) => strip(row, ["type", "source", "target", "directed", "parentTier", "childTier"]));
  for (const [label, equality] of [["anchors", anchorsEquality], ["R", rEquality], ["E", eEquality]]) {
    if (!equality.semanticSetEqual || !equality.fullRowSetEqual ||
        equality.missing.length !== 0 || equality.extra.length !== 0) {
      fail(`S0' set-equality failure at ${label}`);
    }
  }

  // ---- selection comparison against the observed contact set (comparison region) ----
  const observedRows = receipt.comparison.rows;
  const observedKeys = observedRows.map((row) => `${row.key.parentOffice}:${row.key.s}`).sort();
  const selectedKeys = selection.flatMap((row) => row.selected.map((satellite) => `${row.center1}:${satellite}`)).sort();
  const uKeys = selection.flatMap((row) => row.satellites.map((satellite) => `${row.center1}:${satellite}`)).sort();
  const selectedSet = new Set(selectedKeys);
  const observedSet = new Set(observedKeys);
  const confusion = {
    tp: selectedKeys.filter((key) => observedSet.has(key)).length,
    fp: selectedKeys.filter((key) => !observedSet.has(key)).length,
    fn: observedKeys.filter((key) => !selectedSet.has(key)).length,
    tn: uKeys.filter((key) => !selectedSet.has(key) && !observedSet.has(key)).length,
  };
  if (canonicalText(confusion) !== canonicalText({ tp: 14, fp: 0, fn: 0, tn: 14 })) {
    fail("selection confusion drift");
  }
  const perOfficeSelection = selection
    .map((row) => ({ office: row.center1, parent: row.parent, selected: row.selected.map((satellite) => `${row.center1}:${satellite}`).sort() }))
    .sort((left, right) => cmp(left.office, right.office));

  // ---- office-flatness calibration (comparison region, labelled: canonical ledger office field) ----
  const flatRows = selection.flatMap((row) => row.satellites.map((satellite) => ({
    satellite,
    parentOffice: ledgerOfficeById.get(row.parent),
    satelliteOffice: ledgerOfficeById.get(satellite),
  })));
  const officeFlatCount = flatRows.filter((row) => row.parentOffice === row.satelliteOffice).length;
  if (officeFlatCount !== 28) fail("office-flatness calibration drift");

  // ---- orientation: labels flip c -> 6-c; structures invariant ----
  const labelMap = derivedAnchors
    .map((row) => ({ id: row.id, office1: Number(row.officeIndex), office0: offices0.get(row.id) }))
    .sort((left, right) => cmp(left.id, right.id));
  if (labelMap.some((row) => row.office0 !== (6 - row.office1) % 7)) fail("orientation label flip failure");
  const center1ByParent = new Map(bl066.coverage.officeAlignment.perEdge.map((row) => [row.source, row.derivedCenter1]));
  const center0ByParent = new Map(bl066.coverage.officeAlignment.perEdge.map((row) => [row.source, row.derivedCenter0]));
  const orientationCrossCheck = rEdges.every((row) =>
    center1ByParent.get(row.parent) === offices1.get(row.parent) &&
    center0ByParent.get(row.parent) === offices0.get(row.parent));
  if (!orientationCrossCheck) fail("orientation cross-check failure");

  // ---- frozen-pattern baseline (comparison region; the Gate 3 comparison values) ----
  const routeA = receipt.comparison.routes.A;
  const routeB = receipt.comparison.routes.B;
  const tC = receipt.comparison.tC;
  const baseline = {
    source: RECEIPT_PATH,
    observedKeyCount: Number(receipt.comparison.observedKeyCount),
    fourCellCounts: receipt.comparison.fourCellCounts,
    routeA: {
      generated: routeA.generated_key_count,
      matched: routeA.matchedObservedKeys.length,
      inRButUnmatched: routeA.in_R_but_unmatched_count,
      missed: routeA.missedObservedKeys.length,
      extra: routeA.extra_beyond_R_count,
      restatement: routeA.restatement_signature,
    },
    routeB: {
      generated: routeB.generated_key_count,
      matched: routeB.matchedObservedKeys.length,
      inRButUnmatched: routeB.in_R_but_unmatched_count,
      missed: routeB.missedObservedKeys.length,
      extra: routeB.extra_beyond_R_count,
      restatement: routeB.restatement_signature,
    },
    tC: { matches: tC.matches, missing: tC.missing, extra: tC.extra, midpointExact: tC.midpoint_exact },
    category: receipt.category,
  };
  if (baseline.observedKeyCount !== 14 ||
      canonicalText(baseline.fourCellCounts) !== canonicalText({ aOnly: "0", bOnly: "10", both: "4", neither: "0" }) ||
      canonicalText(baseline.routeA) !== canonicalText({ generated: "8", matched: 4, inRButUnmatched: "4", missed: 10, extra: "0", restatement: false }) ||
      canonicalText(baseline.routeB) !== canonicalText({ generated: "28", matched: 14, inRButUnmatched: "14", missed: 0, extra: "0", restatement: true }) ||
      baseline.category !== "not_derived") {
    fail("frozen baseline drift");
  }

  // ---- artifact assembly ----
  const chainAnchors = [
    { artifact: BL063_PATH, fingerprint: bl063.reconstructionFingerprint, selfChecked: true },
    { artifact: BL064_PATH, fingerprint: bl064.derivationFingerprint, selfChecked: true },
    { artifact: BL066_PATH, fingerprint: bl066.derivationFingerprint, selfChecked: true },
    { artifact: BL078_PATH, fingerprint: bl078.derivationFingerprint, selfChecked: true },
  ];

  const core = {
    schemaVersion: SCHEMA_VERSION,
    derivationId: DERIVATION_ID,
    status: "planning_evidence",
    generator: "scripts/build-bl080-governs-derivation.mjs",
    sourceBindings: [
      { artifact: BL063_PATH, sha256: fileSha(BL063_PATH), role: "chain anchor (phase 1: office coordinates kappa, both orientations; consumed by fingerprint self-check)" },
      { artifact: BL064_PATH, sha256: fileSha(BL064_PATH), role: "chain anchor (phase 2: cycle ground, the seven constructor pairs; consumed by fingerprint self-check)" },
      { artifact: BL066_PATH, sha256: fileSha(BL066_PATH), role: "chain anchor (phase 3: the 28 R-edge structure, per-parent satellites; consumed by fingerprint self-check)" },
      { artifact: BL078_PATH, sha256: fileSha(BL078_PATH), role: "isolation-pattern precedent (the region-scoped regime; not consumed as data)" },
      { artifact: BL055_PATH, sha256: fileSha(BL055_PATH), role: "predicate source (P(s) = [class(s) = 7-27]; the table28 comparison)" },
      { artifact: GENERATION_PATH, sha256: fileSha(GENERATION_PATH), role: "frozen projection (licensed remainder: anchor identities, edge ids; comparison: semantic set-equality, digests)" },
      { artifact: RECEIPT_PATH, sha256: fileSha(RECEIPT_PATH), role: "frozen pattern baseline + observed contact set (comparison only)" },
      { artifact: LEDGER_PATH, sha256: fileSha(LEDGER_PATH), role: "canonical ledger (class field: the predicate's single-hop source; office field: the office-flatness calibration only)" },
    ],
    base: {
      chainAnchors,
      predicateSource: { artifact: BL055_PATH, reviewFingerprint: bl055.reviewFingerprint, selfChecked: true },
      importPolicy: "the chain anchors are consumed for kappa (both orientations), the seven constructor pairs and the 28-edge R structure, self-checked by fingerprint; the frozen projection is read for anchor identities and edge ids (labelled remainder) and, in the comparison region only, for the semantic set-equality; the receipt supplies the baseline and the observed contact set; the canonical ledger supplies the predicate's class field and the calibration's office field",
    },
    consumed: {
      kappa: {
        kappa0: bl063.kappaBoth.kappa0.map((row) => ({ mask: String(row.mask), index: row.index })),
        kappa1: bl063.kappaBoth.kappa1.map((row) => ({ mask: String(row.mask), index: row.index })),
        validation: kappaValidation,
      },
      pairs: {
        perCenter: pairs.map((row) => ({ center: row.center, child: row.child, pair: row.pair, mode: row.mode, mid: row.mid })),
        count: pairs.length,
        masksOnlyCrossCheck: {
          rule: "child-side masks-only re-derivation (the BL-064 sandwich/twin-closure rules): every consumed pair is re-derived from the A0/A1 masks alone, with the same child attachment",
          reproducesPairContent: true,
          reproducesChildAttachment: pairsCrossCheck,
        },
      },
      rEdges: {
        perParent: rEdges.map((row) => ({ parent: row.parent, center1: row.center1, satellites: row.satellites, h2Count: row.h2Count, closureCount: row.closureCount })),
        count: rEdges.length,
        satelliteCensus: satelliteCensus.length,
      },
    },
    projection: {
      anchors: derivedAnchors,
      R: derivedR,
      E: derivedE,
      validation: {
        frozenValidator: "PASS",
        rule: "the frozen d4-inputs validateProjection is run verbatim on the derived projection",
        digests,
        frozenBindings: frozenDigests,
        digestsMatchFrozenBindings: true,
      },
      setEquality: {
        anchors: anchorsEquality,
        R: rEquality,
        E: eEquality,
        semanticFields: "anchors: id, tier, role, officeIndex; R: type, source, target, directed, parentTier, childTier, parentOffice; E: type, source, target, directed, parentTier, childTier",
        presentationCarried: {
          edgeIds: 42,
          statement: "the 42 edge ids (28 R + 14 E) are carried from the frozen projection as presentation conventions (the anchoring remainder); every semantic field is derived",
        },
        statement: "S0' set-equality: the derived projection is set-equal to the frozen projection field-for-field (missing [] / extra []), and its digests equal the frozen bindings' projectionDigests. The derived artifacts assemble into exactly the projection the frozen pipeline consumed.",
      },
    },
    selection: {
      predicate: {
        id: "P",
        definition: "P(s) = [forte(s) = '7-27']",
        source: LEDGER_PATH,
        intrinsic: "interval content (set class) from the canonical ledger; Tn-invariant; non-circular (not membership)",
        licensing: "the predicate's single-hop canonical read; the R2 receipt's own license",
      },
      domain: { uKeyCount: uKeys.length, selectedKeyCount: selectedKeys.length },
      selectedKeys,
      observedKeys,
      confusion,
      setEqual: canonicalText(selectedKeys) === canonicalText(observedKeys),
      missing: observedKeys.filter((key) => !selectedSet.has(key)),
      extra: selectedKeys.filter((key) => !observedSet.has(key)),
      perOffice: perOfficeSelection,
      calibration: {
        rule: "[office(s) = office(h)] (canonical ledger office field; comparison region, labelled)",
        officeFlatCount,
        officeFlatTotal: flatRows.length,
        statement: "the office-equality rule is degenerate on the D4 satellite layer: all 28 satellites share their parent's ledger office (the domain is office-flat), so the rule selects U = 28 and carries no discrimination. This is the BL-068 fa-side reading's measured form (class-selective, office-flat): the D4 selection is carried by the class predicate alone.",
      },
      statement: "the predicate selects exactly the observed 14-key contact set over the derived R's 28-key domain (confusion 14/0/0/14; missing [] / extra []): the selection criterion is derived and exact.",
    },
    orientation: {
      default: "kappa1 (BL-063 outcome M1: kappa1 matches the canonical offices 7/7)",
      labelMap,
      pairsIdentical: true,
      edgesIdentical: true,
      selectionIdentical: true,
      crossCheck: {
        perEdgeRows: bl066.coverage.officeAlignment.perEdge.length,
        derivedCenter1MatchesOffice1: true,
        derivedCenter0MatchesOffice0: true,
      },
      statement: "the pair, edge and selection structures are orientation-invariant (they are mask functions); the office labels flip c -> 6-c. The orientation bit remains carried (BL-065), never resolved here.",
    },
    pipeline: {
      status: "landed_unexecuted",
      frozenModules: [
        "scripts/d4-derivation-engine.mjs",
        "scripts/d4-generation.mjs",
        "scripts/d4-downstream-comparison.mjs",
        "scripts/d4-wire.mjs",
      ],
      entry: "runDerivedPipeline(projection) -> generation",
      executionGate: "Gate 3 (separately authorized)",
      statement: "the S1'-S5' code paths are landed; the frozen pure modules are imported verbatim and the re-specification is confined to S0' extraction/assembly. No pipeline execution is performed at Gate 2; the pipeline run, sealing and comparison are Gate 3.",
    },
    preRegistration: {
      criteria: [
        "primary: the re-specified pipeline, consuming derived inputs plus the named remainder only, produces a D4 contact geometry set-equal to the original 14-key contact set (qa/d4-production-receipt.json comparison.rows)",
        "secondary: the route accounting matches the frozen pattern (T-A 8/4/4/10 restatement false; T-B 28=U restatement true; four cells 0/10/4/0; tC two seam relations; category per the frozen contract) or its derived equivalent",
        "deviation reading: any deviation from the frozen pattern is a finding, not a failure - the derived inputs may produce a different but valid contact geometry",
        "integrity gates (hard): zero granted bytes in the derivation path (validator-proven region scoping); byte-stable artifacts and fingerprints; chain anchors self-checked by fingerprint; exactly one licensed canonical observation read at execution",
      ],
      baselineReRead: "the frozen values in gate3Baseline were re-read from the landed receipt at this artifact's build; the Gate 3 execution re-reads them and fails loud on drift",
      deviationReading: "the frozen pattern is the comparison baseline, not a pass/fail gate",
    },
    gate3Baseline: baseline,
    isolation: {
      regime: "region-scoped",
      grantedBytesInDerivationPath: 0,
      intrinsicRegion: [
        "kappa (both orientations) and its re-validation",
        "the seven constructor pairs (bl064) with the masks-only re-derivation cross-check",
        "the 28-edge R structure (bl066) with the satellite census",
        "the derived office assembly (kappa1 / pair centers; kappa0 flip)",
        "the predicate definition and selection (class map parameter)",
      ],
      licensedReads: [
        { read: "frozen projection anchor identities: id, tier, role (the granted office field is never read in the assembly)", class: "anchoring remainder (partition)", label: "licensed" },
        { read: "frozen projection edge ids (28 R + 14 E)", class: "presentation conventions", label: "licensed" },
        { read: "canonical ledger class field (the predicate's single-hop source)", class: "canonical single-hop", label: "licensed" },
        { read: "canonical ledger office field (the office-flatness calibration only)", class: "comparison-region calibration", label: "licensed" },
      ],
      forbiddenReads: [
        "granted office fields in the assembly (officeIndex/parentOffice)",
        "SEAT_CONTACT rows and any contact extraction",
        "observed membership during derivation",
        "the frozen projection's R/E rows during derivation",
      ],
      validatorDiscipline: "two-sided: forbidden tokens absent from the head and the intrinsic region; the comparison region must contain the granted reads (the region-scoping proof); smuggled reads rejected; a permissive region read passes",
      statements: [
        "the derivation path reads zero granted projection bytes: the assembly consumes kappa, the pairs and the R structure (derived), plus the labelled remainder inputs (anchor identities, presentation ids, class map)",
        "the granted office/edge/contact fields appear only in the comparison region",
        "the regime follows BL-078's region-scoped isolation pattern",
      ],
    },
    gates: {
      "V-G2-1": { name: "projection assembly set-equality", result: "PASS", statement: "derived anchors 14/14, R 28/28, E 14/14: semantic and full-row set-equal to the frozen projection; missing [] / extra []" },
      "V-G2-2": { name: "predicate selection set-equality", result: "PASS", statement: "the derived predicate selects exactly the observed 14-key contact set (confusion 14/0/0/14; missing [] / extra [])" },
      "V-G2-3": { name: "orientation invariance", result: "PASS", statement: "pair/edge/selection structures identical under kappa0 and kappa1; office labels flip c -> 6-c; the bit stays carried" },
      "V-G2-4": { name: "isolation", result: "PASS", statement: "region-scoped; granted bytes in the derivation path: 0; two-sided validator discipline" },
      "V-G2-5": { name: "frozen projection validation and digests", result: "PASS", statement: "the frozen validateProjection passes on the derived projection; its digests equal the frozen bindings' projectionDigests" },
    },
    readiness: {
      conditionalGreen: "the derivation runs on derived inputs plus the named anchoring remainder (the A0/A1 anchor sets and tier/role partition, the orientation bit, the presentation conventions) - never a full green light",
      remainingGranted: [
        "the A0/A1 anchor sets + tier/role partition (the anchoring remainder; requirement 1 not discharged)",
        "the orientation bit (BL-065; labels only)",
        "presentation conventions (edge ids, walk order, tier tags)",
      ],
      statement: "Gate 2 proves the derived inputs assemble correctly (S0') and the predicate selects correctly; the S1'-S5' pipeline execution is Gate 3. The conditional green light is the design spec's Task 2 verdict, enforced mechanically by the isolation checker.",
    },
    accounting: {
      tiers: {
        masksOnly: {
          projection: "the derived projection's semantic fields: offices (kappa/pair centers), R endpoints and parent offices, E endpoints",
          selection: "the predicate selection over the derived R's 28-key domain (14/14)",
        },
        canonicalComputation: {
          predicateClass: "the class field is read from the canonical ledger (single-hop; labelled)",
          presentation: "the 42 edge ids are carried presentation (the anchoring remainder)",
          calibration: "the office-flatness check reads the canonical ledger office field (comparison region)",
        },
        remainingGranted: [
          "the A0/A1 anchor sets + tier/role partition (the anchoring remainder)",
          "the orientation bit (BL-065; labels only)",
          "presentation conventions (edge ids, walk order, tier tags)",
        ],
      },
      statement: "the S0' assembly and the selection are discharged on derived inputs plus the labelled remainder; the S1'-S5' execution and its comparison are Gate 3",
    },
    fences: {
      pipelineExecution: "none: the pipeline is landed and unexecuted; the run is Gate 3, separately authorized",
      receiptWrite: "none: no qa/ receipt is written by this gate; the execution receipt is Gate 3's",
      recordAmendment: "none: this is a sandbox planning artifact",
      governsAdmission: "none: no GOVERNS admission; the derivation's formal status is unchanged",
      d4Record: "unchanged: D4 derivable-via-R2 (ENTRY 15) and ENTRY 10 stand byte-untouched",
      d7Control: "fenced: D7 remains hypothesis-tier; the BL-078 precedent is consumed as an isolation pattern only",
      anchoringRemainder: "unchanged and named: partition + orientation bit + presentation; never resolved here",
      g1Intra330: "untouched",
      inv5: "no INV-5 graduation",
      mWalkability: "no M-walkability promotion",
      direction: "directional-semantics unassigned (BL-035 carried)",
      membrane: "frame 2.6/2.7 is interpretation vocabulary, never design input",
      canonical: "no canonical/Court/schema/Neo4j writes; the projection, receipt and ledger are read-only",
      frozenStack: "scripts/d4-*.mjs byte-untouched (imported verbatim; never modified)",
      packaging: "landing-time packaging (manifest, backlog registration) is a separate step",
      sessionProse: "context, not evidence",
    },
    contractCitations: [
      "scrum/plan/bl-079-governs-derivation-design-spec.md (the design specification: Task 1 mapping, Task 2 conditional green light, Task 3 criteria, Task 4 falsifiability, Task 5 output contract)",
      "scrum/plan/bl-063-office-reconstruction-memo.md (phase 1: kappa up to one named bit)",
      "scrum/plan/bl-064-cycle-ground-memo.md (phase 2: the cycle ground, dual rules)",
      "scrum/plan/bl-066-r-edge-derivation-memo.md (phase 3: R_EDGES_DERIVED FULL)",
      "scrum/plan/bl-055-d4-selection-review-memo.md (the predicate P(s) = [forte(s) = 7-27])",
      "scrum/plan/bl-078-d7-retest-memo.md (the region-scoped isolation pattern)",
      "orrery/src/generated/bl063-office-reconstruction.v1.json; orrery/src/generated/bl064-cycle-ground.v1.json; orrery/src/generated/bl066-r-edge-derivation.v1.json; orrery/src/generated/bl055-d4-selection-review.v1.json (chain anchors by fingerprint)",
      "qa/d4-production-generation.json (the frozen projection: the S0' set-equality target)",
      "qa/d4-production-receipt.json (the frozen pattern baseline and the observed contact set)",
      "provenance/DECISION_LEDGER.md (GOV-524/525 scope exclusions: derivability up to one named bit and the anchoring remainder)",
    ],
    notAccomplished: [
      "no pipeline execution: S1'-S5' are landed and unexecuted; the run and its receipt are Gate 3, separately authorized",
      "no receipt write: no qa/ artifact is created by this gate",
      "no record amendment: ENTRY 10/15/16/17 byte-untouched; D4 derivable-via-R2 and D7 hypothesis-tier unchanged",
      "no GOVERNS admission; no higher-theorem answer",
      "no anchoring-remainder resolution: the partition, the orientation bit and the presentation conventions remain carried",
      "no G1 movement; no INV-5 graduation; no M-walkability promotion",
      "no canonical/Court/schema/Neo4j writes; no claim event; no admission of any kind",
      "no frozen-stack modification: scripts/d4-*.mjs byte-untouched",
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
    chainAnchors: derivation.base.chainAnchors.length,
    projection: `${derivation.projection.anchors.length} anchors / ${derivation.projection.R.length} R / ${derivation.projection.E.length} E, set-equal ${derivation.projection.setEquality.R.semanticSetEqual}`,
    selection: `${derivation.selection.selectedKeys.length}/${derivation.selection.observedKeys.length}, confusion ${derivation.selection.confusion.tp}/${derivation.selection.confusion.fp}/${derivation.selection.confusion.fn}/${derivation.selection.confusion.tn}`,
    orientation: `labels flip c->6-c; cross-check ${derivation.orientation.crossCheck.perEdgeRows}`,
    isolation: `${derivation.isolation.regime}, granted bytes ${derivation.isolation.grantedBytesInDerivationPath}`,
    pipeline: derivation.pipeline.status,
    gates: Object.keys(derivation.gates).length,
    derivationFingerprint: derivation.derivationFingerprint,
  };
  if (check) {
    const existing = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, "utf8") : null;
    if (existing !== serialized) throw new Error("STALE_BL080_GOVERNS_DERIVATION");
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
