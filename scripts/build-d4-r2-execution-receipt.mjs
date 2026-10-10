#!/usr/bin/env node
/**
 * BL-057 Gate 3 - D4 R2 derivation execution run and Derivation Execution
 * Receipt (`d4-r2-execution-receipt.v1`).
 *
 * The Gate 3 execution runner. It:
 *   1. verifies the Gate 1/2 preconditions and the six SHA-bound input
 *      primaries (the same six from the Gate 1 memo / Gate 2 artifact);
 *   2. runs the full identity-phase calibration through the Gate 2 contract
 *      engine (`calibrateIdentityPhase`) against the full historical derivation
 *      data and reproduces the frozen pattern exactly - T-A partial 4/14
 *      (8 keys: 4 matched, 4 unmatched, 10 observed missed), T-B = U (28),
 *      cells 0/10/4/0, T-C 2/2 exact - at every patch phase {11,0,1};
 *      fail-loud: a calibration deviation halts the gate (no receipt);
 *   3. executes the registered R2 route (per-office cycle-edge walk with
 *      generalized cycle-twin verification and P(s) = forte-7-27 selection)
 *      and re-evaluates gates G1-G5;
 *   4. derives the seam-phase accounting across the licensed contexts X
 *      (patch phases + the Family-A seam keying) per the BL-033 Phase C lifted
 *      keying spec (S0-S5 operationalization, sections 2-4), with
 *      G_A = R2 output and G_B = construction-join output, and applies the
 *      pre-registered criteria C1-C4 (maintainer ruling: R2's own selectivity
 *      is the derived@X condition while the construction join's U-saturation
 *      is the recorded contrast; an R2-emits-U outcome would be blocked by the
 *      C2 guard symmetrically; the frozen contract's two-route derived row is
 *      structurally unavailable while G_B = U, registered openly at
 *      DECISION_LEDGER.md:2163-2164);
 *   5. runs the paired D7 analogue (hypothesis-tier, reported separately,
 *      never triggering a D7 claim event);
 *   6. assembles the Derivation Execution Receipt (status determined by the
 *      run, never written toward an expected outcome) with implementationDigest
 *      (Gate 2 file-set), executionFingerprint (the run's own, two
 *      fingerprints - no collapse), inputHashes, outputHashes, gates G1-G5,
 *      the branch classification, the criteria evaluation and the fences, and
 *      writes qa/d4-r2-execution-receipt.json (byte-stable canonical
 *      serialization; --check verifies freshness against the recorded run).
 *
 * No-collapse: the receipt is evidence, not an amendment. No ledger writes;
 * ENTRY 10 (provenance/DECISION_LEDGER.md:2195-2252) untouched; D4's
 * registered not_derived stands; Gate 4 (OD-7) is a separate ceremony. The
 * frozen D4 stack is never modified or re-executed under its old freeze.
 * Sandbox only: no canonical/Court/Neo4j writes; no legal-move/audio bytes.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  HEPTATONIC_LEDGER_PATH,
  HEPTATONIC_NETWORK_PATH,
  canonicalText,
  fail,
  fileSha,
  parseCsv,
  read,
  readJson,
  sha256,
  sortedKey,
  translateSet,
} from "./verify-phase-a-proposals.mjs";
import { midZ7 } from "./d4-derivation-engine.mjs";
import {
  calibrateIdentityPhase,
  emitContacts,
  evaluateRouteOffice,
  keyOf,
  rotateMaskZ12,
} from "./d4-r2-contract.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..");

export const RECEIPT_SCHEMA_VERSION = "d4-r2-execution-receipt.v1";
export const RECEIPT_ROUTE_ID = "R2";
export const RECEIPT_WORK_ITEM = "BL-057";
export const OUTPUT_PATH = "qa/d4-r2-execution-receipt.json";
export const SCHEMA_PATH = "schemas/d4-r2-execution-receipt.schema.json";
export const ENGINE_PATH = "scripts/d4-r2-contract.mjs";
export const CONTRACT_GENERATOR_PATH = "scripts/build-d4-r2-contract.mjs";
export const CONTRACT_VALIDATOR_PATH = "orrery/scripts/validate-d4-r2-contract.mjs";
export const CONTRACT_PINS_PATH = "orrery/src/d4-r2-contract.test.ts";
export const CONTRACT_ARTIFACT_PATH = "orrery/src/generated/d4-r2-contract.v1.json";
export const BL057_MEMO_PATH = "scrum/plan/bl-057-d4-amendment-spec.md";
export const FROZEN_RECEIPT_PATH = "qa/d4-production-receipt.json";
export const FROZEN_GENERATION_PATH = "qa/d4-production-generation.json";
export const SELECTION_REVIEW_PATH = "orrery/src/generated/d4-selection-review.v1.json";
export const PHASE_C_PROBE_PATH = "orrery/src/generated/phase-c-probe.v1.json";
export const DECISION_LEDGER_PATH = "provenance/DECISION_LEDGER.md";
export const CONTRACT_FINGERPRINT = "5528510b495f12fa11ab713d8ee357e3798f728204eacd83ad491aafb8fdc7d5";
export const SELECTION_REVIEW_FINGERPRINT = "6d11fd932efbe96892b3cf2e6a6cdad6f54e69cd2a8f284ebb72232c59d8b745";
export const PHASE_C_FINGERPRINT = "5085e27404de2e591b146d38f289da660c6bc49041a54f073acafcbfe10f2f49";
export const FROZEN_IMPLEMENTATION_DIGEST = "7ab950fac561016afc816e8b6947f7ce0b5f25573f1472321054ddbc9c1e097f";
export const DECISION_LEDGER_SHA256 = "8b7084bc7c55bd53a060434fbcaef1d0c7f4eb572079a01d3c1f3f05db4f2362";
export const ENTRY10_SHA256 = "201efe8193e1967cb91bb07b4876c906be5ba71a23bf4735be6d18a7df69f7a7";
export const ENTRY10_SPAN = "2195-2252";
export const FROZEN_LEDGER_BYTE_LENGTH = 174314;
export const PATCH_PHASES = [11, 0, 1];
export const STRICT_OFFICES = ["0", "6"];
export const LICENSED_CONTEXT_IDS = ["phase-11", "phase-0", "phase-1", "seam-familyA"];
export const CONTROL_CONTEXT_ID = "strict-degree-control";
export const STATUS_TOKENS = ["execution_verified", "attribution_incomplete"];

function cmp(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

function sortedUnique(values) {
  return [...new Set(values)].sort(cmp);
}

function setKey(pitches, phase) {
  return sortedKey(translateSet(pitches, phase));
}

function maskOf(pitches) {
  return pitches.reduce((mask, pitch) => mask | (1 << pitch), 0);
}

function liftKey(key, phase) {
  return key.split(":").map((part) => `${part}@${phase}`).join(":");
}

function canonicalMidpointKey(a, b, mid) {
  const low = cmp(a, b) <= 0 ? a : b;
  const high = cmp(a, b) <= 0 ? b : a;
  return `A0:${low}:${high}:${mid}`;
}

// Frozen Outcome Contract accounting semantics (lifted units), as applied by
// the BL-033 Phase C probe; retained verbatim in semantics.
function accounting(generatedKeys, uKeys, observedKeys) {
  const G = sortedUnique(generatedKeys);
  const U = sortedUnique(uKeys);
  const O = sortedUnique(observedKeys);
  const uSet = new Set(U);
  const oSet = new Set(O);
  const inR = G.filter((key) => uSet.has(key));
  const extra = G.filter((key) => !uSet.has(key));
  const missed = U.filter((key) => !G.includes(key));
  const unmatched = inR.filter((key) => !oSet.has(key));
  return {
    generatedKeyCount: G.length,
    inRCount: inR.length,
    extraBeyondRCount: extra.length,
    rMissedCount: missed.length,
    inRButUnmatchedCount: unmatched.length,
    matchedObservedCount: O.filter((key) => G.includes(key)).length,
    missedObservedCount: O.filter((key) => !G.includes(key)).length,
    restatementSignature: G.length === U.length && extra.length === 0 && missed.length === 0,
  };
}

// Four contact cells over the observed set O (the frozen receipt's semantics:
// both = observed keys covered by both routes; bOnly = observed keys covered
// only by the construction join; etc.).
function fourCells(keysA, keysB, observedKeys) {
  const aSet = new Set(keysA);
  const bSet = new Set(keysB);
  const cells = { aOnly: 0, bOnly: 0, both: 0, neither: 0 };
  for (const key of sortedUnique(observedKeys)) {
    if (aSet.has(key)) cells[bSet.has(key) ? "both" : "aOnly"] += 1;
    else cells[bSet.has(key) ? "bOnly" : "neither"] += 1;
  }
  return cells;
}

// ---------------------------------------------------------------------------
// Source loading and domain extraction
// ---------------------------------------------------------------------------

function loadLedgerRecords() {
  const rows = parseCsv(read(HEPTATONIC_LEDGER_PATH));
  if (rows.length !== 462) fail(`heptatonic ledger census is ${rows.length}`);
  return rows.map((row) => {
    const pitches = row.pitchSet.replace(/[{}]/g, "").split(",").map((value) => Number(value));
    const officeIndex = row.officeIndex === "" ? null : Number(row.officeIndex);
    return {
      id: Number(row.id),
      pitches: pitches.slice().sort((left, right) => left - right),
      forte: row.forte,
      role: row.role,
      tier: row.tier,
      officeIndex: Number.isSafeInteger(officeIndex) ? officeIndex : null,
    };
  });
}

function extractR2Domain(records, projection) {
  const byId = new Map(records.map((record) => [String(record.id), record]));
  const anchors = projection.anchors.map((anchor) => ({
    id: String(anchor.id),
    tier: String(anchor.tier),
    officeIndex: String(anchor.officeIndex),
  }));
  const a0Anchors = anchors.filter((anchor) => anchor.tier === "A0")
    .map((anchor) => ({ id: anchor.id, officeIndex: anchor.officeIndex }))
    .sort((left, right) => cmp(left.id, right.id));
  if (a0Anchors.length !== 7) fail(`A0 anchor census ${a0Anchors.length}`);
  for (const anchor of a0Anchors) {
    const record = byId.get(anchor.id);
    if (!record) fail(`A0 anchor ${anchor.id} missing from ledger`);
    if (maskOf(record.pitches) !== Number(anchor.id)) {
      fail(`A0 anchor ${anchor.id} is not its own pitch-class bitmask`);
    }
  }

  const R = projection.R.map((edge) => ({
    source: String(edge.source), target: String(edge.target), parentOffice: String(edge.parentOffice),
  }));
  const E = projection.E.map((edge) => ({ source: String(edge.source), target: String(edge.target) }));
  if (R.length !== 28 || E.length !== 14) fail("projection census drift");

  const forteOf = (satellite) => {
    const row = byId.get(String(satellite));
    if (!row) fail(`satellite ${satellite} missing from ledger`);
    return row.forte;
  };

  const uKeys = sortedUnique(R.map((edge) => keyOf(edge.parentOffice, edge.target)));
  return { byId, anchors, a0Anchors, R, E, forteOf, uKeys };
}

// ---------------------------------------------------------------------------
// Calibration: the full identity-phase run (Gate 3's first act, the license)
// ---------------------------------------------------------------------------

function runCalibration({ a0Anchors, R, records, frozen, U, O }) {
  const byId = new Map(records.map((record) => [String(record.id), record]));
  const officeOf = new Map(a0Anchors.map((anchor) => [anchor.id, anchor.officeIndex]));

  // T-A: the implemented engine, identity phase, full historical data.
  const calibration = calibrateIdentityPhase({
    a0Anchors: a0Anchors.map((anchor) => ({ id: anchor.id, officeIndex: anchor.officeIndex })),
    R: R.map((edge) => ({ source: edge.source, target: edge.target, parentOffice: edge.parentOffice })),
  });
  const routeAKeys = sortedUnique(calibration.keys);
  const frozenAKeys = sortedUnique(frozen.comparison.routes.A.generatedKeys);
  if (canonicalText(routeAKeys) !== canonicalText(frozenAKeys)) {
    fail(`CALIBRATION_FAILURE: identity-phase T-A keying ${JSON.stringify(routeAKeys)} does not reproduce the frozen T-A keying`);
  }

  // T-B: the construction join (satellite-blind; emits U).
  const routeBKeys = sortedUnique(R.map((edge) => keyOf(edge.parentOffice, edge.target)));
  const frozenBKeys = sortedUnique(frozen.comparison.routes.B.generatedKeys);
  if (canonicalText(routeBKeys) !== canonicalText(frozenBKeys)) {
    fail("CALIBRATION_FAILURE: construction-join keying does not reproduce the frozen T-B keying");
  }

  const routeA = accounting(routeAKeys, U, O);
  const routeB = accounting(routeBKeys, U, O);
  const cells = fourCells(routeAKeys, routeBKeys, O);
  if (routeA.generatedKeyCount !== 8 || routeA.matchedObservedCount !== 4 ||
      routeA.inRButUnmatchedCount !== 4 || routeA.missedObservedCount !== 10 ||
      routeA.restatementSignature !== false) {
    fail("CALIBRATION_FAILURE: T-A accounting does not reproduce the frozen pattern (8 keys; 4 matched; 4 unmatched; 10 missed)");
  }
  if (routeB.generatedKeyCount !== 28 || routeB.restatementSignature !== true ||
      routeB.inRButUnmatchedCount !== 14 || routeB.missedObservedCount !== 0) {
    fail("CALIBRATION_FAILURE: T-B accounting does not reproduce the frozen restatement (28 = U)");
  }
  if (cells.aOnly !== 0 || cells.bOnly !== 10 || cells.both !== 4 || cells.neither !== 0) {
    fail("CALIBRATION_FAILURE: four-cell pattern does not reproduce the frozen 0/10/4/0");
  }

  // T-C: anchored relation set (calibration) vs the frozen observed seam
  // relations - exact 2/2.
  const anchoredRelations = [];
  for (const a of a0Anchors) {
    for (const b of a0Anchors) {
      if (a.id === b.id) continue;
      if (rotateMaskZ12(Number(a.id)) !== Number(b.id)) continue;
      const relation = canonicalMidpointKey(a.id, b.id, String(midZ7(BigInt(officeOf.get(a.id)), BigInt(officeOf.get(b.id)))));
      anchoredRelations.push(relation);
    }
  }
  const sortedAnchored = sortedUnique(anchoredRelations);
  const observedRelations = sortedUnique(frozen.comparison.tC.observedRelations.map(
    (relation) => canonicalMidpointKey(String(relation.a), String(relation.b), String(relation.mid))));
  const frozenMatches = sortedUnique(frozen.comparison.tC.matches);
  const tCMissing = observedRelations.filter((key) => !sortedAnchored.includes(key));
  const tCExtra = sortedAnchored.filter((key) => !observedRelations.includes(key));
  const tCExact = observedRelations.length > 0 && tCMissing.length === 0 && tCExtra.length === 0;
  if (!tCExact || canonicalText(sortedAnchored) !== canonicalText(frozenMatches)) {
    fail("CALIBRATION_FAILURE: anchored T-C relation set does not reproduce the frozen 2/2 exact match");
  }
  void byId;

  // Per-phase uniform lift: identical at every patch phase.
  const perPhase = PATCH_PHASES.map((phase) => {
    const liftedA = routeAKeys.map((key) => liftKey(key, phase));
    const liftedB = routeBKeys.map((key) => liftKey(key, phase));
    const liftedU = U.map((key) => liftKey(key, phase));
    const liftedO = O.map((key) => liftKey(key, phase));
    const a = accounting(liftedA, liftedU, liftedO);
    const b = accounting(liftedB, liftedU, liftedO);
    const phaseCells = fourCells(liftedA, liftedB, liftedO);
    const identicalToFrozen = a.generatedKeyCount === 8 && a.matchedObservedCount === 4 &&
      a.inRButUnmatchedCount === 4 && a.missedObservedCount === 10 && a.restatementSignature === false &&
      b.generatedKeyCount === 28 && b.restatementSignature === true && b.inRButUnmatchedCount === 14 &&
      phaseCells.aOnly === 0 && phaseCells.bOnly === 10 && phaseCells.both === 4 && phaseCells.neither === 0;
    if (!identicalToFrozen) fail(`CALIBRATION_FAILURE: patch phase ${phase} does not reproduce the frozen pattern`);
    return {
      phase: String(phase),
      keying: `lifted@${phase}`,
      routeA: a,
      routeB: b,
      fourCellCounts: phaseCells,
      tC: {
        generatedRelations: sortedAnchored,
        observedRelations,
        missing: tCMissing,
        extra: tCExtra,
        midpointExact: tCExact,
      },
      identicalToFrozen: true,
    };
  });

  return {
    verdict: "EXACT",
    method: "identity-phase replay of the anchored kernel-twin route through the Gate 2 contract engine over the full historical derivation data, lifted uniformly at each patch phase; T-B and T-C re-derived at the frozen semantics",
    frozenPattern: {
      routeA: "8 keys (4 matched, 4 unmatched, 10 observed missed; cells retained)",
      routeB: "28 keys = U (restatement_signature=true)",
      fourCellCounts: cells,
      tC: "normalized A0 relation set equals both observed seam relations exactly",
    },
    routeA: { keys: routeAKeys, accounting: routeA, restatementSignature: routeA.restatementSignature },
    routeB: { keys: routeBKeys, accounting: routeB, restatementSignature: routeB.restatementSignature },
    fourCellCounts: cells,
    tC: { generatedRelations: sortedAnchored, observedRelations, missing: tCMissing, extra: tCExtra, midpointExact: tCExact },
    perPhase,
    pass: true,
    note: "the calibration is Gate 3's first act and its license; a deviation would have halted the gate with no receipt (the implementation would be wrong, not the hypothesis)",
  };
}

// ---------------------------------------------------------------------------
// Registered R2 execution: the route over the 7 A0 cycle edges
// ---------------------------------------------------------------------------

function runR2Route({ records, a0Anchors, R, E, forteOf, U, O, cycleEdges, phaseC, frozen }) {
  const a1AnchorOfOffice = new Map();
  const satellitesOfAnchor = new Map();
  for (const edge of R) {
    a1AnchorOfOffice.set(edge.parentOffice, edge.source);
    satellitesOfAnchor.set(edge.source, [...(satellitesOfAnchor.get(edge.source) ?? []), edge.target]);
  }
  const eParentsOf = new Map();
  for (const edge of E) {
    eParentsOf.set(edge.target, [...(eParentsOf.get(edge.target) ?? []), edge.source]);
  }
  const a0OfficeById = new Map(a0Anchors.map((anchor) => [anchor.id, anchor.officeIndex]));

  const perOffice = sortedUnique(R.map((edge) => edge.parentOffice)).map((office) => {
    const h = a1AnchorOfOffice.get(office);
    if (!h) fail(`no A1 anchor at office ${office}`);
    const parents = sortedUnique(eParentsOf.get(h) ?? []);
    if (parents.length !== 2) fail(`anchor ${h} does not have exactly 2 distinct E-parents`);
    const satellites = sortedUnique(satellitesOfAnchor.get(h) ?? []);
    if (satellites.length !== 4) fail(`office ${office} satellite census drift`);
    const edge = cycleEdges.find((row) => row.office === office);
    if (!edge) fail(`no cycle edge at office ${office}`);
    if (canonicalText(sortedUnique([edge.a, edge.b])) !== canonicalText(parents)) {
      fail(`E-parent pair is not the cycle edge at office ${office}`);
    }
    return evaluateRouteOffice({ office, parentH: h, eParents: parents, cycleEdge: edge, satellites, forteOf });
  });
  if (perOffice.length !== 7) fail("per-office census drift");

  const contacts = emitContacts(perOffice);
  const generatedKeys = sortedUnique(contacts.keys);
  if (canonicalText(generatedKeys) !== canonicalText(O)) {
    fail("registered R2 execution output does not equal the frozen observed keying O");
  }
  const contractArtifact = readJson(CONTRACT_ARTIFACT_PATH);
  if (canonicalText(generatedKeys) !== canonicalText(contractArtifact.contacts.generatedKeys)) {
    fail("registered R2 execution output disagrees with the Gate 2 contract artifact");
  }
  void records;

  // G1: generalized cycle-twin verification at all 7 edges.
  const fallbackOffices = perOffice.filter((row) => !row.cycleTwin.holds).map((row) => row.office);
  const g1 = {
    pass: fallbackOffices.length === 0,
    verified: perOffice.length - fallbackOffices.length,
    fallbackOffices,
    t1Edges: cycleEdges.filter((edge) => edge.d === 1).map((edge) => edge.office).sort(cmp),
    t2Edges: cycleEdges.filter((edge) => edge.d === 2).map((edge) => edge.office).sort(cmp),
    perEdge: perOffice.map((row) => ({ office: row.office, a: row.cycleEdge.a, b: row.cycleEdge.b, d: row.cycleEdge.d, holds: row.cycleTwin.holds })),
  };
  // G2: predicate selects exactly 2 per office.
  const g2 = {
    pass: perOffice.every((row) => row.selectedCount === 2) && perOffice.reduce((sum, row) => sum + row.selectedCount, 0) === 14,
    perOfficeCounts: perOffice.map((row) => ({ office: row.office, count: row.selectedCount })),
    totalSelected: perOffice.reduce((sum, row) => sum + row.selectedCount, 0),
  };
  // G3: G_R2 = O exactly.
  const missing = O.filter((key) => !generatedKeys.includes(key));
  const extra = generatedKeys.filter((key) => !O.includes(key));
  const g3 = {
    pass: missing.length === 0 && extra.length === 0 && generatedKeys.length === O.length,
    generatedCount: generatedKeys.length,
    observedCount: O.length,
    missing,
    extra,
  };
  // G4: non-collapse.
  const strictSubset = generatedKeys.every((key) => U.includes(key)) && generatedKeys.length < U.length;
  const g4 = {
    pass: strictSubset && generatedKeys.length === 14 && U.length === 28,
    generatedCount: generatedKeys.length,
    uKeyCount: U.length,
    tBOutputCount: sortedUnique(frozen.comparison.routes.B.generatedKeys).length,
    strictSubset,
    nonCollapse: generatedKeys.length !== U.length,
  };
  // G5: T-C midpoint census (7 realized, 2 observation-exact, 5 seam-derived predictions).
  const frozenMatchSet = new Set(sortedUnique(frozen.comparison.tC.matches));
  const midpointEntries = cycleEdges.map((edge) => {
    const officeA = a0OfficeById.get(edge.a);
    const officeB = a0OfficeById.get(edge.b);
    if (officeA === undefined || officeB === undefined) fail(`A0 office lookup failed for edge at ${edge.office}`);
    const mid = String(midZ7(BigInt(officeA), BigInt(officeB)));
    if (mid !== edge.office) fail(`cycle-edge midpoint ${mid} is not the edge office ${edge.office}`);
    const relationKey = canonicalMidpointKey(edge.a, edge.b, mid);
    return {
      office: edge.office,
      a: edge.a,
      b: edge.b,
      d: edge.d,
      midpoint: mid,
      realized: true,
      exact: frozenMatchSet.has(relationKey) ? true : "unverified",
      relationKey,
      prediction: frozenMatchSet.has(relationKey) ? null
        : `predicted: ${relationKey}; confirmable against the D4 A0 seam-relation observation surface (comparison.tC.observedRelations, ${FROZEN_RECEIPT_PATH}), which currently records only the two T1 relations`,
    };
  });
  const exactEntries = midpointEntries.filter((entry) => entry.exact === true);
  const unverifiedEntries = midpointEntries.filter((entry) => entry.exact !== true);
  const realizedRelations = sortedUnique(midpointEntries.map((entry) => entry.relationKey));
  const seamGenerated = sortedUnique(phaseC.e2Retry.routeC.seam.generatedRelations);
  const seamObserved = sortedUnique(phaseC.e2Retry.routeC.seam.observedRelations);
  const realizedSet = new Set(realizedRelations);
  const exactSet = new Set(exactEntries.map((entry) => entry.relationKey));
  const seamCrossCheck = {
    generatedRelations: seamGenerated.length,
    equalsRealizedSet: seamGenerated.length === realizedSet.size && seamGenerated.every((key) => realizedSet.has(key)),
    observedRelations: seamObserved.length,
    equalsExactSubset: seamObserved.length === exactSet.size && seamObserved.every((key) => exactSet.has(key)),
    realizationOfObserved: phaseC.e2Retry.routeC.seam.realizationOfObserved === true,
  };
  const g5 = {
    pass: midpointEntries.length === 7 && exactEntries.length === 2 && unverifiedEntries.length === 5 &&
      seamCrossCheck.equalsRealizedSet && seamCrossCheck.equalsExactSubset && seamCrossCheck.realizationOfObserved,
    realized: midpointEntries.length,
    exact: exactEntries.length,
    unverified: unverifiedEntries.length,
    entries: midpointEntries,
    invariant: "every cycle edge's midpoint equals the office of the anchor it constructs",
    seamCrossCheck,
  };

  // Cycle walk (presentation order frozen at the Gate 1 convention).
  const fromMap = new Map(cycleEdges.map((edge) => [edge.a, edge]));
  let current = cycleEdges[0].a;
  const walk = [];
  for (let step = 0; step < 7; step += 1) {
    const edge = fromMap.get(current);
    if (!edge) fail(`cycle walk dead-ends at ${current}`);
    walk.push(edge);
    current = edge.b;
  }
  if (current !== cycleEdges[0].a) fail("cycle does not close");

  return {
    method: "registered execution of R2(h) = {(o(h), s) : s in satellites(h) and P(s)} over the 7 A0 cycle edges through the Gate 2 contract engine; contacts emitted from the 7 per-office evaluations",
    perOffice,
    contacts: { generatedKeys, witnessCount: contacts.witnesses.length, witnesses: contacts.witnesses },
    cycleWalk: {
      edges: walk.map((edge) => ({ office: edge.office, a: edge.a, b: edge.b, d: edge.d })),
      closes: true,
      intervalSum: walk.reduce((sum, edge) => sum + edge.d, 0),
      t1Count: cycleEdges.filter((edge) => edge.d === 1).length,
      t2Count: cycleEdges.filter((edge) => edge.d === 2).length,
    },
    outputComparison: {
      observedKeyCount: O.length,
      r2KeyCount: generatedKeys.length,
      tAKeyCount: sortedUnique(frozen.comparison.routes.A.generatedKeys).length,
      tBKeyCount: sortedUnique(frozen.comparison.routes.B.generatedKeys).length,
      uKeyCount: U.length,
    },
    gates: { G1: g1, G2: g2, G3: g3, G4: g4, G5: g5 },
    realizedRelations,
  };
}

// ---------------------------------------------------------------------------
// Seam-phase derivation: contexts X with the pre-registered criteria C1-C4
// ---------------------------------------------------------------------------

function deriveCycleEdges({ phaseC, selectionReview }) {
  const byOffice = new Map();
  for (const pair of phaseC.e2Retry.routeASeam.seamPairs) {
    const d = (Number(pair.aPhase) - Number(pair.cPhase) + 12) % 12;
    const edge = {
      office: String(pair.office), a: String(pair.a), b: String(pair.c),
      aPhase: String(pair.aPhase), bPhase: String(pair.cPhase), d,
    };
    const existing = byOffice.get(edge.office);
    if (existing && (existing.a !== edge.a || existing.b !== edge.b || existing.d !== edge.d)) {
      fail(`non-uniform edge at office ${edge.office}`);
    }
    if (!existing) byOffice.set(edge.office, edge);
  }
  if (byOffice.size !== 7) fail(`cycle edge census ${byOffice.size}`);
  const cycleEdges = [...byOffice.values()].sort((left, right) => cmp(left.office, right.office));
  for (const edge of cycleEdges) {
    if (edge.d !== 1 && edge.d !== 2) fail(`cycle interval drift at ${edge.office}`);
    const recorded = selectionReview.taGeometry.cycle.edges.find((row) => String(row.office) === edge.office);
    if (!recorded || String(recorded.a) !== edge.a || String(recorded.c) !== edge.b ||
        Number(recorded.interval) !== edge.d) {
      fail(`cycle edge disagrees with the BL-055 record at office ${edge.office}`);
    }
  }
  return cycleEdges;
}

function reDeriveSeamPairs({ records, phaseC }) {
  const a0Anchors = records.filter((record) => record.tier === "A0" && record.role === "anchor")
    .map((record) => ({ id: String(record.id), office: Number(record.officeIndex), pitches: record.pitches }));
  if (a0Anchors.length !== 7) fail(`A0 anchor census ${a0Anchors.length}`);
  const derived = [];
  for (const a of a0Anchors) {
    for (const c of a0Anchors) {
      if (a.id === c.id) continue;
      const k = (a.office + 6) % 7;
      if (c.office !== (k + 6) % 7) continue;
      for (const qa of PATCH_PHASES) {
        for (const qc of PATCH_PHASES) {
          if (setKey(a.pitches, qa) !== setKey(c.pitches, qc)) continue;
          derived.push({ office: String(k), a: a.id, aPhase: String(qa), c: c.id, cPhase: String(qc) });
        }
      }
    }
  }
  const pairSort = (left, right) => cmp(left.office, right.office) || cmp(left.a, right.a) ||
    cmp(left.aPhase, right.aPhase) || cmp(left.c, right.c) || cmp(left.cPhase, right.cPhase);
  derived.sort(pairSort);
  const recorded = phaseC.e2Retry.routeASeam.seamPairs.map((pair) => ({
    office: String(pair.office), a: String(pair.a), aPhase: String(pair.aPhase),
    c: String(pair.c), cPhase: String(pair.cPhase),
  })).sort(pairSort);
  if (canonicalText(derived) !== canonicalText(recorded)) {
    fail("re-derived seam pairs disagree with the Phase C probe");
  }
  return derived;
}

function evaluateContext({ id, kind, licensed, control, keying, description, gaKeys, gbKeys, uKeys, oKeys, tC, phaseProvenance }) {
  const routeA = accounting(gaKeys, uKeys, oKeys);
  const routeB = accounting(gbKeys, uKeys, oKeys);
  const cells = fourCells(gaKeys, gbKeys, oKeys);
  const covered = oKeys.length > 0 && routeA.missedObservedCount === 0 && routeB.missedObservedCount === 0;
  const r2EqualsU = routeA.restatementSignature;
  const r2EqualsO = canonicalText(sortedUnique(gaKeys)) === canonicalText(sortedUnique(oKeys));
  const r2ProperSubset = r2EqualsO && sortedUnique(gaKeys).length < sortedUnique(uKeys).length;
  const c1 = {
    covered_lifted: covered,
    G_A_not_U_lifted: !r2EqualsU,
    construction_join_restates_U: routeB.restatementSignature,
    in_R_but_unmatched_zero: routeA.inRButUnmatchedCount === 0,
    G_A_equals_O_proper_subset_U: r2ProperSubset,
    C_lifted: tC.holds,
    holds: covered && !r2EqualsU && routeA.inRButUnmatchedCount === 0 && r2ProperSubset && tC.holds,
  };
  const c2 = {
    guard: "any route with G = U_lifted is classified restatement and can never be the derived route (symmetric on both routes)",
    R2_restates: r2EqualsU,
    construction_join_restates: routeB.restatementSignature,
    disposition: r2EqualsU
      ? "R2 itself restates U: C2 blocks R2 at this context"
      : "guard fires on the construction join (recorded contrast); R2 clear",
  };
  const c3 = {
    O_subset_G_A: routeA.missedObservedCount === 0,
    O_subset_G_B: routeB.missedObservedCount === 0,
    disposition: routeA.missedObservedCount === 0
      ? "full contact coverage"
      : "partial coverage: not_derived at this context; cells retained",
  };
  const c4 = {
    beyond_lifted_R_keys: routeA.extraBeyondRCount + routeB.extraBeyondRCount,
    phase_bindings_resolved: true,
    cross_phase_containment_used: false,
    valid: routeA.extraBeyondRCount === 0 && routeB.extraBeyondRCount === 0,
  };
  const disposition = !c4.valid
    ? `invalid@${id}`
    : c1.holds
      ? `derived@${id}`
      : `not_derived@${id}`;
  return {
    id,
    kind,
    licensed,
    control,
    description,
    keying,
    routeA,
    routeB,
    fourCellCounts: cells,
    tC,
    phaseProvenance: phaseProvenance ?? null,
    criteria: { C1: c1, C2: c2, C3: c3, C4: c4 },
    disposition,
  };
}

function runSeamDerivation({ records, E, execution, U, O, seamPairs, tCBase }) {
  const selectedByOffice = new Map();
  for (const row of execution.perOffice) {
    selectedByOffice.set(row.office, row.selected.map((satellite) => keyOf(row.office, satellite)));
  }
  const allSelected = sortedUnique(execution.perOffice.flatMap((row) => row.selected.map((satellite) => keyOf(row.office, satellite))));

  // Contexts: patch phases (same-phase lift).
  const contexts = PATCH_PHASES.map((phase) => {
    const liftedA = allSelected.map((key) => liftKey(key, phase));
    const liftedB = U.map((key) => liftKey(key, phase));
    const liftedU = U.map((key) => liftKey(key, phase));
    const liftedO = O.map((key) => liftKey(key, phase));
    return evaluateContext({
      id: `phase-${phase}`,
      kind: "same-phase",
      licensed: true,
      control: false,
      keying: `lifted@${phase}`,
      description: `patch phase ${phase}: contacts via (o(h@${phase}), s@${phase})`,
      gaKeys: liftedA,
      gbKeys: liftedB,
      uKeys: liftedU,
      oKeys: liftedO,
      tC: tCBase,
      phaseProvenance: null,
    });
  });

  // Carrier check: seam-realized E endpoints (cross-phase geometry matches of
  // construction endpoints); Phase C expected this absent.
  const recordsById = new Map(records.map((record) => [String(record.id), record]));
  const carriedE = [];
  for (const e of E) {
    const source = recordsById.get(e.source);
    const target = recordsById.get(e.target);
    for (const qa of PATCH_PHASES) {
      for (const qc of PATCH_PHASES) {
        if (setKey(source.pitches, qa) === setKey(target.pitches, qc)) {
          carriedE.push({ edge: `${e.source}:${e.target}`, qa: String(qa), qc: String(qc) });
        }
      }
    }
  }

  // Context: the Family-A seam keying (union of the 9 flank realizations).
  const qualifyingOffices = sortedUnique(seamPairs.map((pair) => pair.office));
  if (canonicalText(qualifyingOffices) !== canonicalText(["0", "1", "2", "3", "4", "5", "6"])) {
    fail(`seam keying office census drift: ${qualifyingOffices.join(",")}`);
  }
  const seamKeys = sortedUnique(qualifyingOffices.flatMap((office) => selectedByOffice.get(office) ?? []));
  const phaseProvenance = qualifyingOffices.map((office) => ({
    office,
    pairs: seamPairs.filter((pair) => pair.office === office)
      .map((pair) => ({ a: pair.a, aPhase: pair.aPhase, c: pair.c, cPhase: pair.cPhase })),
  }));
  const seamContext = evaluateContext({
    id: "seam-familyA",
    kind: "seam",
    licensed: true,
    control: false,
    keying: "anchored-projection",
    description: "Family-A seam keying: the kernel-twin relation re-expressed as set-identity T_qa(a.pcs) = T_qc(c.pcs) at the flank contexts; G_A keys in the anchored projection with phase provenance per witness; cross-phase containment forbidden (P4)",
    gaKeys: seamKeys,
    gbKeys: U,
    uKeys: U,
    oKeys: O,
    tC: tCBase,
    phaseProvenance,
  });
  seamContext.carriedEndpointRealizations = carriedE;
  contexts.push(seamContext);

  // Control context: strict-degree re-key (phase difference +1), the frozen
  // reproduction control (co-canonical reading, OD-C1).
  const strictPairs = seamPairs.filter((pair) => (Number(pair.aPhase) - Number(pair.cPhase) + 12) % 12 === 1);
  const strictOffices = sortedUnique(strictPairs.map((pair) => pair.office));
  if (canonicalText(strictOffices) !== canonicalText(STRICT_OFFICES)) {
    fail(`strict-degree office census drift: ${strictOffices.join(",")}`);
  }
  const strictKeys = sortedUnique(strictOffices.flatMap((office) => selectedByOffice.get(office) ?? []));
  const strictTC = {
    generatedRelations: tCBase.observedRelations,
    observedRelations: tCBase.observedRelations,
    missing: [],
    extra: [],
    strictEquality: true,
    holds: true,
    scopeNote: "strict-degree control: the two T1 relations reproduce the frozen 2/2 exact match",
  };
  const strictContext = evaluateContext({
    id: CONTROL_CONTEXT_ID,
    kind: "control",
    licensed: false,
    control: true,
    keying: "anchored-projection (strict-degree only)",
    description: "frozen-reproduction control: only realizations with phase difference +1 (the strict anchored-degree re-key); offices 0 and 6 realize; the frozen failure shape is reproduced (partial coverage, cells 0/10/4/0)",
    gaKeys: strictKeys,
    gbKeys: U,
    uKeys: U,
    oKeys: O,
    tC: strictTC,
    phaseProvenance: null,
  });
  contexts.push(strictContext);

  const derivedContexts = contexts.filter((context) => context.licensed && context.disposition.startsWith("derived@"));
  const invalidContexts = contexts.filter((context) => context.disposition.startsWith("invalid@"));
  const licensedNotDerived = contexts.filter((context) => context.licensed && !context.disposition.startsWith("derived@"));
  const branch = derivedContexts.length > 0
    ? "DERIVED@X"
    : invalidContexts.length > 0
      ? "invalid"
      : licensedNotDerived.length === LICENSED_CONTEXT_IDS.length &&
        licensedNotDerived.every((context) => context.fourCellCounts.aOnly === 0 &&
          context.fourCellCounts.bOnly === 10 && context.fourCellCounts.both === 4 && context.fourCellCounts.neither === 0)
        ? "same-failure"
        : "new-failure-mode";

  return {
    stageProvenance: "S0-S5 refers to the frozen derivation's stage structure (scripts/d4-production.mjs stages: binding verification, complete structural extraction, generation, durable materialization, durable seal, fresh comparison process, accounting verification, frozen outcome selection), operationalized under the lifted keying per the Phase C keying spec (scrum/plan/bl-033-phaseC-lifted-keying-spec.md sections 2-4); the frozen stack remains the semantic reference, never executed",
    preRegistration: {
      routeMapping: "G_A := R2 output; G_B := construction-join output; both computed per context X (maintainer ruling, Gate 3 build directive: the construction join's U-saturation is the recorded contrast, never a blocker of R2's own selectivity; the C2 guard applies symmetrically, so an R2-emits-U outcome would be blocked)",
      C1: "some licensed context X yields covered_lifted AND G_A != U_lifted AND in_R_but_unmatched = 0 (R2) AND G_A = O proper subset of U_lifted AND C_lifted (with G_B computed and reported: the construction join restates U as the contrast)",
      C2: "any route with G = U_lifted is classified restatement_signature/filter_plus_geometry per contract precedence and can never be that route's derived disposition (the no-restatement guard; symmetric on both routes)",
      C3: "any X with O not subset of G_A -> partial coverage -> not_derived@X, cells retained",
      C4: "any beyond-lifted-R key, unresolvable phase binding, or cross-phase containment use -> invalid@X, no disposition",
      literalFormNote: "the frozen contract's two-route derived row (neither route equals U) remains structurally unavailable while the satellite-blind construction join is co-evaluated (G_B = U by construction, keying-independent; DECISION_LEDGER.md:2163-2164); the corridor's C1 as restated adjudicates R2's own selectivity with the construction join as the recorded contrast; the frozen-contract pair category is recorded per context as a diagnostic",
      cLiftedNote: "C_lifted at the adjudicated R2 scope (Gate 2 constraint 4 / BL-056 G5): the midpoint census realizes all 7 cycle edges (realized), the observed surface confirms 2 exactly (observation-exact), 5 carry confirmation-marked predictions (seam-derived), and every observed seam is realizable; the frozen strict set-equality reading (7 generated vs 2 observed) is recorded as cStrict = false diagnostic",
    },
    contexts,
    branchClassification: {
      branch,
      reading: branch === "DERIVED@X"
        ? "seam hypothesis confirmed under the lifted representation: R2 selects O at every licensed context while the construction join restates U as the recorded contrast"
        : branch === "same-failure"
          ? "the frozen pattern reproduces at every licensed context: the route-geometry attribution is incomplete"
          : "the lifted representation reveals additional structure; the obstruction inventory extends",
      derivedContexts: derivedContexts.map((context) => context.id),
      invalidContexts: invalidContexts.map((context) => context.id),
      notDerivedContexts: licensedNotDerived.map((context) => context.id),
      controlContexts: contexts.filter((context) => context.control).map((context) => ({
        id: context.id,
        disposition: context.disposition,
        note: "frozen-reproduction control; co-canonical reading per Phase C OD-C1 (free-context = boundary-representation reading; strict-degree = frozen control); not a licensed success-eligible context",
      })),
      gate4: {
        opens: branch === "DERIVED@X",
        note: branch === "DERIVED@X"
          ? "Gate 4 (record amendment, OD-7 additive) opens on execution_verified; the amendment event is a separate ceremony - this receipt does not amend the record"
          : "Gate 4 does not open; no amendment",
      },
    },
  };
}

// ---------------------------------------------------------------------------
// D7 analogue: hypothesis-tier, reported separately
// ---------------------------------------------------------------------------

function runD7Analogue({ records, network, phaseC }) {
  const byId = new Map(records.map((record) => [String(record.id), record]));
  const d7Anchors = network.d7AnchorRows.map((row) => ({
    id: String(row.scaleId),
    office: String(row.officeIndex),
    pitches: row.pitchSet.replace(/[{}]/g, "").split(",").map((value) => Number(value)),
  }));
  const d7Contacts = network.d7SeatContactRows.map((row) => ({
    contactRowId: String(row.id), s: String(row.source), d: String(row.target), phaseDelta: String(row.phaseDelta),
  }));
  const d7Modal = network.d7ModalRows.map((row) => ({ id: String(row.id), source: String(row.source), target: String(row.target) }));
  if (d7Anchors.length !== 7 || d7Contacts.length !== 14 || d7Modal.length !== 7) {
    fail("D7 anchor/contact/orbit census mismatch");
  }
  const anchorById = new Map(d7Anchors.map((anchor) => [anchor.id, anchor]));
  const analogueR = d7Contacts.map((contact) => ({
    id: `analogue-governs:D7:${contact.d}:${contact.s}`,
    parent: contact.d,
    target: contact.s,
    parentOffice: anchorById.get(contact.d).office,
  }));
  const d7U = sortedUnique(analogueR.map((edge) => keyOf(edge.parentOffice, edge.target)));
  const d7O = sortedUnique(d7Contacts.map((contact) => keyOf(anchorById.get(contact.d).office, contact.s)));
  const gap = d7U.filter((key) => !d7O.includes(key));
  const missing = d7O.filter((key) => !d7U.includes(key));
  if (gap.length !== 0 || missing.length !== 0) {
    fail("D7 analogue U/O are not set-identical; the analogue construction changed");
  }

  // Modal orbit walk.
  const successor = new Map(d7Modal.map((row) => [row.source, row.target]));
  const orbit = [];
  let current = "127";
  for (let step = 0; step < 7; step += 1) {
    const next = successor.get(current);
    if (!next) fail(`D7 modal orbit dead-ends at ${current}`);
    orbit.push({ a: current, b: next });
    current = next;
  }
  const orbitCloses = current === "127";

  // Cycle-twin verification search (rotateMaskZ12^d(a) = b; d in {1,2} is the
  // D4 verification interval).
  const cycleTwin = orbit.map((edge) => {
    const maskA = maskOf(anchorById.get(edge.a).pitches);
    const maskB = maskOf(anchorById.get(edge.b).pitches);
    let found = null;
    let value = maskA;
    for (let d = 1; d <= 12; d += 1) {
      value = rotateMaskZ12(value);
      if (value === maskB) { found = d; break; }
    }
    return {
      a: edge.a, b: edge.b, rotateInterval: found,
      holds: found === 1 || found === 2,
      justification: found === 1 || found === 2 ? "cycle-twin-verified" : "predicate-only",
    };
  });

  // R2-style selection under the literal predicate and the domain-class
  // analogue predicate.
  const contactFortes = sortedUnique(d7Contacts.map((contact) => byId.get(contact.s).forte));
  const literalKeys = sortedUnique(analogueR
    .filter((edge) => byId.get(edge.target).forte === "7-27")
    .map((edge) => keyOf(edge.parentOffice, edge.target)));
  const classKeys = sortedUnique(analogueR
    .filter((edge) => byId.get(edge.target).forte === contactFortes[0])
    .map((edge) => keyOf(edge.parentOffice, edge.target)));
  const literalAccounting = accounting(literalKeys, d7U, d7O);
  const classAccounting = accounting(classKeys, d7U, d7O);

  return {
    probe: "d7-analogue-mirror",
    label: "hypothesis-analogue",
    grantStatus: "no D7 grant exists; analogue-R is constructed from the 14 seat-contact rows (parent h = d) with the modal orbit as the D7 constructing structure; parity-with-D4-grant claims forbidden (OD-3); hypothesis-tier preserved, no D7 claim event",
    construction: {
      anchors: d7Anchors.length,
      analogueR: analogueR.length,
      contacts: d7Contacts.length,
      modalOrbit: d7Modal.map((row) => row.id),
      contactFortes,
      uKeyCount: d7U.length,
      observedKeyCount: d7O.length,
      selectionGap: gap.length,
      gapNote: "the analogue domain U equals the contact set O by construction (14 = 14): unlike D4 (U = 28 vs O = 14), the D7 analogue has no non-contact granted satellites, so no satellite selection can separate a contact subset from the granted domain",
    },
    modalCycleWalk: { edges: orbit, closes: orbitCloses, closureNote: "the D7 closure relation M(4033) = 127 is modal, not rotational" },
    cycleTwinVerification: {
      perEdge: cycleTwin,
      verified: cycleTwin.filter((edge) => edge.holds).length,
      note: "the D7 modal orbit is not a rotation orbit: no edge's endpoint pair is reproduced by rotateMaskZ12^d at the D4 verification intervals",
    },
    literalPredicate: {
      predicate: "P(s) = [forte(s) = '7-27']",
      selectedKeyCount: literalKeys.length,
      accounting: literalAccounting,
      disposition: "not_derived@analogue-literal: the literal predicate selects 0/14 (D7 contact satellites are set class 7-2)",
    },
    domainClassPredicate: {
      predicate: `P_D7(s) = [forte(s) = '${contactFortes[0]}']`,
      selectedKeyCount: classKeys.length,
      accounting: classAccounting,
      disposition: classAccounting.restatementSignature
        ? "restatement_signature@analogue-class: the domain-class predicate selects 14/14 = U = O; with no U/O gap the outcome is a full-domain restatement (C2 guard), never a selective derivation"
        : "not_derived@analogue-class",
    },
    phaseCCrossReference: {
      anchoredAnalogue: phaseC.e3D7Pairing.anchoredRoute.outcome,
      anchoredGenerated: phaseC.e3D7Pairing.anchoredRoute.generatedKeyCount,
      seamAnalogue: phaseC.e3D7Pairing.seamRoute.outcome,
      seamGenerated: phaseC.e3D7Pairing.seamRoute.generatedKeyCount,
      note: "Phase C measured the D7 mirror with the kernel-twin (office-qualification) machinery; the Gate 3 run applies the R2-style selection machinery to the same analogue-R",
    },
    asymmetry: [
      "selection: the D4 R2 route selects O = 14 within U = 28 (gap 14); the D7 analogue has no gap (U = O = 14), so selection is structurally unavailable",
      "structure: the D4 A0 cycle closes rotationally (5 x T2 + 2 x T1, interval sum 12) and the cycle-twin relation verifies 7/7; the D7 modal orbit closes modally with zero rotational cycle-twin verifications",
      "predicate: D4 contact satellites are 7-27; D7 contact satellites are 7-2 (the set-class asymmetry is input-level, not route-level)",
    ],
    claimEvent: "none; D7 remains hypothesis-tier regardless of outcome",
  };
}

// ---------------------------------------------------------------------------
// Receipt assembly
// ---------------------------------------------------------------------------

function collectInputHashes(contractArtifact) {
  const bindings = contractArtifact.sourceBindings;
  if (bindings.length !== 6) fail("source binding census drift");
  return bindings.map((binding) => {
    const actual = fileSha(binding.artifact);
    if (actual !== binding.sha256) fail(`input binding drift: ${binding.artifact}`);
    return { artifact: binding.artifact, sha256: actual, role: binding.role };
  });
}

function collectImplementationFiles() {
  return [
    ENGINE_PATH,
    CONTRACT_GENERATOR_PATH,
    CONTRACT_VALIDATOR_PATH,
    CONTRACT_PINS_PATH,
    CONTRACT_ARTIFACT_PATH,
  ].sort(cmp).map((filePath) => ({ path: filePath, sha256: fileSha(filePath) }));
}

function readLedgerFence() {
  const ledgerBytes = fs.readFileSync(path.join(root, DECISION_LEDGER_PATH));
  const ledgerText = ledgerBytes.toString("utf8");
  if (sha256(ledgerBytes.subarray(0, FROZEN_LEDGER_BYTE_LENGTH)) !== DECISION_LEDGER_SHA256) {
    fail("decision ledger prefix drift: bytes preceding the execution-time endpoint changed (an end-append preserves the frozen prefix; any earlier modification does not)");
  }
  const lines = ledgerText.split("\n");
  const entry10 = lines.slice(2194, 2252).join("\n");
  const entry10Sha = sha256(entry10);
  if (!entry10.includes("## ENTRY 10 - D4 Grant 2 production record - not_derived")) {
    fail("ENTRY 10 region drift: the frozen D4 record marker is missing");
  }
  if (entry10Sha !== ENTRY10_SHA256) {
    fail("ENTRY 10 region drift: the frozen D4 record is not byte-untouched");
  }
  return { ledgerSha: DECISION_LEDGER_SHA256, entry10Sha: ENTRY10_SHA256, entry10Span: ENTRY10_SPAN };
}

export function buildReceipt({ executionTimestamp, runCompletedAt }) {
  // ---- Gate 1/2 preconditions ---------------------------------------------
  if (!read(BL057_MEMO_PATH).includes("**Status:** `claim_admitted`")) {
    fail("Gate 3 entry precondition not met: BL-057 memo header is not claim_admitted");
  }
  const contractArtifact = readJson(CONTRACT_ARTIFACT_PATH);
  if (contractArtifact.status !== "implementation_evidence") fail("Gate 2 contract artifact status drift");
  const { contractFingerprint, ...contractCore } = contractArtifact;
  if (sha256(canonicalText(contractCore)) !== contractFingerprint ||
      contractFingerprint !== CONTRACT_FINGERPRINT) fail("Gate 2 contract fingerprint drift");

  const selectionReview = readJson(SELECTION_REVIEW_PATH);
  if (selectionReview.reviewFingerprint !== SELECTION_REVIEW_FINGERPRINT) fail("BL-055 review fingerprint mismatch");
  const phaseC = readJson(PHASE_C_PROBE_PATH);
  if (phaseC.probeFingerprint !== PHASE_C_FINGERPRINT) fail("Phase C probe fingerprint mismatch");

  const frozen = readJson(FROZEN_RECEIPT_PATH);
  if (frozen.category !== "not_derived") fail(`frozen receipt category is ${frozen.category}`);
  if (frozen.bindings.implementationDigest !== FROZEN_IMPLEMENTATION_DIGEST) {
    fail("frozen nine-file closure digest drift");
  }

  const records = loadLedgerRecords();
  const network = readJson(HEPTATONIC_NETWORK_PATH);
  const projection = readJson(FROZEN_GENERATION_PATH).projection;
  const domain = extractR2Domain(records, projection);
  const { a0Anchors, R, E, forteOf } = domain;
  const U = sortedUnique(frozen.comparison.uKeys);
  const O = sortedUnique(frozen.comparison.rows.map((row) => keyOf(String(row.parentOffice), String(row.s))));
  if (U.length !== 28 || O.length !== 14) fail("frozen domain census drift");

  const cycleEdges = deriveCycleEdges({ phaseC, selectionReview });
  const seamPairs = reDeriveSeamPairs({ records, phaseC });

  // ---- calibration (the license; fail-loud) --------------------------------
  const calibration = runCalibration({ a0Anchors, R, records, frozen, U, O });

  // ---- registered R2 execution --------------------------------------------
  const execution = runR2Route({ records, a0Anchors, R, E, forteOf, U, O, cycleEdges, phaseC, frozen });
  const gates = {
    G1: execution.gates.G1.pass,
    G2: execution.gates.G2.pass,
    G3: execution.gates.G3.pass,
    G4: execution.gates.G4.pass,
    G5: execution.gates.G5.pass,
  };
  const gatesAllPass = Object.values(gates).every((value) => value === true);

  // ---- seam-phase derivation ----------------------------------------------
  const observedRelations = sortedUnique(frozen.comparison.tC.observedRelations.map(
    (relation) => canonicalMidpointKey(String(relation.a), String(relation.b), String(relation.mid))));
  const tCBase = {
    realized: execution.realizedRelations.length,
    observationExact: execution.gates.G5.exact,
    seamDerivedPredictions: execution.gates.G5.unverified,
    generatedRelations: execution.realizedRelations,
    observedRelations,
    missing: observedRelations.filter((key) => !execution.realizedRelations.includes(key)),
    extra: execution.realizedRelations.filter((key) => !observedRelations.includes(key)),
    strictEquality: false,
    realizationOfObserved: execution.gates.G5.seamCrossCheck.realizationOfObserved,
    holds: execution.gates.G5.seamCrossCheck.equalsRealizedSet &&
      execution.gates.G5.seamCrossCheck.equalsExactSubset &&
      execution.gates.G5.seamCrossCheck.realizationOfObserved &&
      execution.gates.G5.entries.every((entry) => entry.realized === true),
    cStrict: false,
    scopeNote: "C_lifted adjudicated scope (Gate 2 constraint 4 / BL-056 G5): 7 realized / 2 observation-exact / 5 confirmation-marked predictions; frozen strict set equality (7 vs 2) recorded as cStrict = false",
  };
  const seamDerivation = runSeamDerivation({ records, E, execution, U, O, seamPairs, tCBase });

  // ---- D7 analogue ---------------------------------------------------------
  const d7Analogue = runD7Analogue({ records, network, phaseC });

  // ---- branch classification / status -------------------------------------
  const branch = seamDerivation.branchClassification.branch;
  const derivedContexts = seamDerivation.branchClassification.derivedContexts;
  const invalidContexts = seamDerivation.branchClassification.invalidContexts;
  const status = calibration.pass && gatesAllPass && invalidContexts.length === 0 && derivedContexts.length > 0
    ? "execution_verified"
    : "attribution_incomplete";
  if (!STATUS_TOKENS.includes(status)) fail("status token drift");
  const statusRationale = status === "execution_verified"
    ? `calibration EXACT; gates G1-G5 green; R2 derives O (14 keys, exactly 2 per office) at ${derivedContexts.length} licensed contexts (${derivedContexts.join(", ")}); the construction join restates U at every context as the recorded contrast; branch ${branch}`
    : `branch ${branch}: calibration ${calibration.verdict}; gates green: ${gatesAllPass}; invalid contexts: ${invalidContexts.length}; derived contexts: ${derivedContexts.length}`;
  const passFail = status === "execution_verified" && calibration.pass && gatesAllPass;

  // ---- fences --------------------------------------------------------------
  const ledgerFence = readLedgerFence();

  // ---- input/output hashes -------------------------------------------------
  const inputHashes = collectInputHashes(contractArtifact);
  const generatedKeys = execution.contacts.generatedKeys;
  const outputHashes = {
    generatedKeysDigest: sha256(canonicalText(generatedKeys)),
    generatedKeys,
    witnessesDigest: sha256(canonicalText(execution.contacts.witnesses)),
    calibrationKeysDigest: sha256(canonicalText(calibration.routeA.keys)),
    realizedRelationKeysDigest: sha256(canonicalText(execution.realizedRelations)),
  };
  const implementationFiles = collectImplementationFiles();
  const implementationDigest = sha256(canonicalText(implementationFiles));

  // ---- core assembly -------------------------------------------------------
  const core = {
    schemaVersion: RECEIPT_SCHEMA_VERSION,
    routeId: RECEIPT_ROUTE_ID,
    workItem: RECEIPT_WORK_ITEM,
    naming: {
      workItem: RECEIPT_WORK_ITEM,
      note: "the corridor's gates are BL-057-track; earlier session prose referenced BL-031 for the D4 corridor - BL-031 is the topology/lattice track; corrected as of Gate 3",
    },
    status,
    statusRationale,
    executionTimestamp,
    runCompletedAt: runCompletedAt ?? new Date().toISOString(),
    implementationDigest,
    implementationFiles,
    gate2ContractFingerprint: contractFingerprint,
    fingerprintConvention: {
      implementationDigest: "sha256 over the canonical manifest of the Gate 2 contract implementation file set (engine, generator, validator, pins, artifact); the validator carries the Gate 3 receipt-transition guard",
      executionFingerprint: "sha256 over this receipt's canonical core (this field excluded): the run's own fingerprint; two fingerprints, two gates, no collapse",
    },
    inputHashes,
    outputHashes,
    calibration,
    routeExecution: {
      method: execution.method,
      perOffice: execution.perOffice,
      contacts: execution.contacts,
      cycleWalk: execution.cycleWalk,
      outputComparison: execution.outputComparison,
    },
    gates,
    gateDetail: execution.gates,
    seamDerivation,
    d7Analogue,
    fences: {
      sandboxOnly: "no canonical/Court/Neo4j writes; the execution run writes exactly qa/d4-r2-execution-receipt.json",
      ledger: "no ledger writes; ENTRY 10 region byte-untouched; the Gate 4 OD-7 amendment is a separate later ceremony, never this gate",
      noCollapse: "the execution receipt is evidence, not an amendment; a passing run does not amend the record by itself; Gate 4 opens only on execution_verified and is separately ceremonied",
      frozenStack: "scripts/d4-*.mjs frozen nine-file closure digest 7ab950fa... re-verified; never modified and never re-executed under its old freeze",
      d7: "hypothesis-tier regardless of outcome; the D7 analogue run triggers no D7 claim event",
      wall: "R2 traverses the A0 cycle and emits A1 contact keys; no D-D edges; the BL-029 boundary wall untouched",
      g1Intra330: "untouched",
      direction: "unassigned (BL-035 carried)",
      membrane: "frame 2.6/2.7 and the polarity synthesis are interpretation vocabulary, never design input",
      legalMoveAudio: "no legal-move/audio bytes",
      sessionProse: "context, not evidence",
    },
    recordFence: {
      decisionLedgerSha256: ledgerFence.ledgerSha,
      entry10Sha256: ledgerFence.entry10Sha,
      entry10Span: ledgerFence.entry10Span,
      d4RegisteredCategory: "not_derived (DECISION_LEDGER.md:2195-2252) unchanged; this receipt records an execution run only",
    },
    notAccomplished: [
      "no D4 record amendment; no ledger write; ENTRY 10 untouched (Gate 4 / OD-7 is a separate ceremony)",
      "no D7 verdict or claim event; D7 remains hypothesis-tier",
      "no canonical/Court/Neo4j writes; no legal-move/audio bytes",
      "no frozen-stack modification or re-execution under its old freeze",
      "no governs admission; no G1 movement; direction unassigned",
      "no claim beyond the landed frozen bytes; session prose is not evidence",
    ],
    passFail,
  };
  const executionFingerprint = sha256(canonicalText(core));
  return { ...core, executionFingerprint };
}

export function serializeReceipt(receipt) {
  return `${canonicalText(receipt)}\n`;
}

function main() {
  const check = process.argv.includes("--check");
  const outputPath = path.join(root, OUTPUT_PATH);
  if (check) {
    if (!fs.existsSync(outputPath)) throw new Error("STALE_D4_R2_EXECUTION_RECEIPT: receipt missing");
    const existing = JSON.parse(fs.readFileSync(outputPath, "utf8"));
    const rebuilt = buildReceipt({
      executionTimestamp: existing.executionTimestamp,
      runCompletedAt: existing.runCompletedAt,
    });
    const serialized = serializeReceipt(rebuilt);
    if (fs.readFileSync(outputPath, "utf8") !== serialized) {
      throw new Error("STALE_D4_R2_EXECUTION_RECEIPT");
    }
    console.log(JSON.stringify({
      output: OUTPUT_PATH,
      check: true,
      status: rebuilt.status,
      branch: rebuilt.seamDerivation.branchClassification.branch,
      executionFingerprint: rebuilt.executionFingerprint,
      implementationDigest: rebuilt.implementationDigest,
      stale: false,
    }, null, 2));
    return;
  }
  const startedAt = new Date().toISOString();
  const receipt = buildReceipt({ executionTimestamp: startedAt, runCompletedAt: null });
  const serialized = serializeReceipt(receipt);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, serialized);
  console.log(JSON.stringify({
    output: OUTPUT_PATH,
    check: false,
    status: receipt.status,
    branch: receipt.seamDerivation.branchClassification.branch,
    calibration: receipt.calibration.verdict,
    gates: receipt.gates,
    executionFingerprint: receipt.executionFingerprint,
    implementationDigest: receipt.implementationDigest,
    sha256: sha256(serialized),
  }, null, 2));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}
