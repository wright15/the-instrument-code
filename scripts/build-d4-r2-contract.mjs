#!/usr/bin/env node
/**
 * Build the BL-057 Gate 2 D4 R2 contract implementation validation.
 *
 * The contract implementation of the admitted R2 route (Gate 1,
 * scrum/plan/bl-057-d4-amendment-spec.md):
 *
 *   R2(h) = {(o(h), s) : s in satellites(h) and P(s)},  P(s) = [forte(s) = '7-27']
 *
 * Pipeline: read the six pinned sources -> evaluate the route through the
 * contract engine (scripts/d4-r2-contract.mjs) -> re-check the G1-G5 gate
 * conditions -> exercise the identity-phase calibration mechanism on the
 * minimal frozen keying fixture -> assemble the implementation-validation
 * artifact with a canonical serialization and contractFingerprint.
 *
 * No-collapse: this artifact is the Gate 2 implementation self-validation. It
 * is NOT the Gate 3 execution run; no execution receipt is created, and the
 * full calibration verdict is reserved to Gate 3. The sandbox route evaluation
 * over pinned sources is not a registered derivation execution.
 *
 * Fences: sandbox only. No canonical/Court/schema/Neo4j writes; no ledger
 * writes; the frozen D4 stack (scripts/d4-*.mjs) is read-only specification
 * reference, never modified, never re-executed under its old freeze. Fail-loud;
 * byte-stable. Frame 2.6/2.7 is interpretation vocabulary, never design input.
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
} from "./verify-phase-a-proposals.mjs";
import { midZ7 } from "./d4-derivation-engine.mjs";
import {
  CONTRACT_ID,
  CONTRACT_SCHEMA_VERSION,
  CONTRACT_STATUS,
  EXECUTION_RECEIPT_INTERFACE,
  PREDICATE_STATEMENT,
  ROUTE_ID,
  ROUTE_NAME,
  calibrateIdentityPhase,
  emitContacts,
  evaluateRouteOffice,
} from "./d4-r2-contract.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..");

export const OUTPUT_PATH = "orrery/src/generated/d4-r2-contract.v1.json";
export const ENGINE_PATH = "scripts/d4-r2-contract.mjs";
export const BL057_MEMO_PATH = "scrum/plan/bl-057-d4-amendment-spec.md";
export const FROZEN_RECEIPT_PATH = "qa/d4-production-receipt.json";
export const FROZEN_GENERATION_PATH = "qa/d4-production-generation.json";
export const SELECTION_REVIEW_PATH = "orrery/src/generated/d4-selection-review.v1.json";
export const PHASE_C_PROBE_PATH = "orrery/src/generated/phase-c-probe.v1.json";
export const SELECTION_REVIEW_FINGERPRINT = "6d11fd932efbe96892b3cf2e6a6cdad6f54e69cd2a8f284ebb72232c59d8b745";
export const PHASE_C_FINGERPRINT = "5085e27404de2e591b146d38f289da660c6bc49041a54f073acafcbfe10f2f49";

function cmp(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

function sortedUnique(values) {
  return [...new Set(values)].sort(cmp);
}

function keyOf(office, satellite) {
  return `${office}:${satellite}`;
}

function canonicalMidpointKey(a, b, mid) {
  const low = cmp(a, b) <= 0 ? a : b;
  const high = cmp(a, b) <= 0 ? b : a;
  return `A0:${low}:${high}:${mid}`;
}

// ---------------------------------------------------------------------------
// Main build
// ---------------------------------------------------------------------------

export function buildR2Contract() {
  // ---- Gate 2 entry precondition: the Gate 1 ruling must be landed -------
  const memo = read(BL057_MEMO_PATH);
  if (!memo.includes("**Status:** `claim_admitted`")) {
    fail("Gate 2 entry precondition not met: BL-057 memo header is not claim_admitted (land the Gate 1 ruling first)");
  }

  const receipt = readJson(FROZEN_RECEIPT_PATH);
  const frozenGeneration = readJson(FROZEN_GENERATION_PATH);
  const ledgerRows = parseCsv(read(HEPTATONIC_LEDGER_PATH));
  const selectionReview = readJson(SELECTION_REVIEW_PATH);
  const phaseC = readJson(PHASE_C_PROBE_PATH);

  if (ledgerRows.length !== 462) fail(`heptatonic ledger census is ${ledgerRows.length}`);
  if (selectionReview.reviewFingerprint !== SELECTION_REVIEW_FINGERPRINT) fail("BL-055 review fingerprint mismatch");
  if (phaseC.probeFingerprint !== PHASE_C_FINGERPRINT) fail("Phase C probe fingerprint mismatch");
  if (receipt.category !== "not_derived") fail(`frozen receipt category is ${receipt.category}`);

  // ---- frozen domain ------------------------------------------------------
  const comparison = receipt.comparison;
  const uKeys = sortedUnique(comparison.uKeys);
  const observedKeys = sortedUnique(comparison.rows.map((row) => keyOf(String(row.parentOffice), String(row.s))));
  if (uKeys.length !== 28 || observedKeys.length !== 14) fail("frozen domain census mismatch");
  const cells = comparison.fourCellCounts;
  if (cells.aOnly !== "0" || cells.bOnly !== "10" || cells.both !== "4" || cells.neither !== "0") {
    fail("frozen four-cell counts mismatch");
  }
  const observedSet = new Set(observedKeys);
  const uSet = new Set(uKeys);
  const officeOfKey = (key) => key.split(":")[0];
  const satelliteOfKey = (key) => key.split(":")[1];

  // ---- projection R/E -----------------------------------------------------
  const projection = frozenGeneration.projection;
  const R = projection.R;
  const E = projection.E;
  if (R.length !== 28 || E.length !== 14) fail("projection census drift");
  const rByKey = new Map(R.map((row) => [keyOf(String(row.parentOffice), String(row.target)), row]));
  if (rByKey.size !== 28) fail("R key collisions");
  const eParentsOf = new Map();
  for (const edge of E) {
    eParentsOf.set(edge.target, [...(eParentsOf.get(edge.target) ?? []), edge.source]);
  }
  const a1Anchors = sortedUnique([...eParentsOf.keys()]);
  if (a1Anchors.length !== 7) fail(`A1 anchor census ${a1Anchors.length}`);
  const anchorOffice = new Map(projection.anchors.map((anchor) => [String(anchor.id), String(anchor.officeIndex)]));
  const a0Office = new Map(projection.anchors.filter((anchor) => anchor.tier === "A0")
    .map((anchor) => [String(anchor.id), String(anchor.officeIndex)]));
  if (a0Office.size !== 7) fail("A0 anchor census drift");

  // ---- ledger -------------------------------------------------------------
  const ledgerById = new Map(ledgerRows.map((row) => [row.id, row]));
  const forteOf = (satellite) => {
    const row = ledgerById.get(satellite);
    if (!row) fail(`satellite ${satellite} missing from ledger`);
    return row.forte;
  };

  // ---- cycle edges (re-derived from the Phase C seam pairs) ---------------
  const seamPairs = phaseC.e2Retry.routeASeam.seamPairs;
  if (seamPairs.length !== 9) fail(`seam pair census ${seamPairs.length}`);
  const cycleEdgesByOffice = new Map();
  for (const pair of seamPairs) {
    const interval = ((Number(pair.aPhase) - Number(pair.cPhase)) + 12) % 12;
    const edge = { office: String(pair.office), a: String(pair.a), b: String(pair.c),
      aPhase: String(pair.aPhase), bPhase: String(pair.cPhase), d: interval };
    const existing = cycleEdgesByOffice.get(edge.office);
    if (existing && (existing.a !== edge.a || existing.b !== edge.b || existing.d !== edge.d)) {
      fail(`non-uniform edge at office ${edge.office}`);
    }
    cycleEdgesByOffice.set(edge.office, edge);
  }
  if (cycleEdgesByOffice.size !== 7) fail(`cycle edge census ${cycleEdgesByOffice.size}`);
  const cycleEdges = [...cycleEdgesByOffice.values()].sort((left, right) => cmp(left.office, right.office));
  for (const edge of cycleEdges) {
    if (edge.d !== 1 && edge.d !== 2) fail(`cycle edge interval ${edge.d} at office ${edge.office}`);
  }
  // cross-check against the BL-055 recorded cycle geometry
  const recordedCycle = selectionReview.taGeometry.cycle.edges;
  if (recordedCycle.length !== 7) fail("BL-055 cycle census drift");
  for (const edge of cycleEdges) {
    const recorded = recordedCycle.find((row) => String(row.office) === edge.office);
    if (!recorded || String(recorded.a) !== edge.a || String(recorded.c) !== edge.b ||
        Number(recorded.interval) !== edge.d) {
      fail(`cycle edge disagrees with the BL-055 record at office ${edge.office}`);
    }
  }
  // cycle closure walk (must close over all 7 edges with interval sum 12)
  const fromMap = new Map(cycleEdges.map((edge) => [edge.a, edge]));
  let current = cycleEdges[0].a;
  const walk = [];
  for (let step = 0; step < 7; step += 1) {
    const edge = fromMap.get(current);
    if (!edge) fail(`cycle walk dead-ends at ${current}`);
    walk.push(edge);
    current = edge.b;
  }
  const cycleCloses = current === cycleEdges[0].a;
  const intervalSum = walk.reduce((sum, edge) => sum + edge.d, 0);
  if (!cycleCloses || intervalSum !== 12) fail("cycle closure/interval-sum failure");
  const t1Offices = cycleEdges.filter((edge) => edge.d === 1).map((edge) => edge.office).sort(cmp);
  const t2Offices = cycleEdges.filter((edge) => edge.d === 2).map((edge) => edge.office).sort(cmp);
  if (canonicalText(t1Offices) !== canonicalText(["0", "6"]) || t2Offices.length !== 5) {
    fail("T1/T2 edge split drift");
  }

  // ---- per-office route evaluation through the contract engine ------------
  const perOffice = sortedUnique(uKeys.map((key) => officeOfKey(key))).map((office) => {
    const keys = uKeys.filter((key) => officeOfKey(key) === office);
    if (keys.length !== 4) fail(`office ${office} key census ${keys.length}`);
    const first = rByKey.get(keys[0]);
    if (!first) fail(`R row missing for ${keys[0]}`);
    const h = String(first.source);
    if (!a1Anchors.includes(h)) fail(`parent ${h} is not an A1 anchor`);
    if (anchorOffice.get(h) !== office) fail(`anchor office drift at ${office}`);
    const parents = sortedUnique(eParentsOf.get(h));
    if (parents.length !== 2) fail(`anchor ${h} does not have exactly 2 distinct E-parents`);
    const satellites = keys.map(satelliteOfKey).sort(cmp);
    const edge = cycleEdges.find((row) => row.office === office);
    if (!edge) fail(`no cycle edge at office ${office}`);
    // W3 hard-constraint context: the E-parent pair is the cycle edge (unordered)
    const edgePair = sortedUnique([edge.a, edge.b]);
    if (canonicalText(edgePair) !== canonicalText(parents)) {
      fail(`E-parent pair is not the cycle edge at office ${office}`);
    }
    return evaluateRouteOffice({ office, parentH: h, eParents: parents, cycleEdge: edge, satellites, forteOf });
  });

  // ---- G1: cycle-twin verification ----------------------------------------
  const fallbackOffices = perOffice.filter((row) => !row.cycleTwin.holds).map((row) => row.office);
  const g1 = {
    relation: "cycle_twin(a, b, d) <=> rotateMaskZ12^d(a) = b",
    definition: "d is the cycle edge's transposition interval (1 for the two T1 edges, 2 for the five T2 edges); rotateMaskZ12 is +1 semitone on the pitch mask",
    perEdge: perOffice.map((row) => ({ office: row.office, a: row.cycleEdge.a, b: row.cycleEdge.b,
      d: row.cycleEdge.d, holds: row.cycleTwin.holds })),
    allPass: fallbackOffices.length === 0,
    fallbackOffices,
    t1Edges: t1Offices,
    t2Edges: t2Offices,
    verdict: fallbackOffices.length === 0
      ? "the generalized cycle-twin relation holds at all 7 cycle edges (2 T1 + 5 T2); the +2 mask rotation maps each T2 edge's parent pair onto itself in the walk direction; derivation justification is cycle-twin-verified at every office"
      : `cycle-twin verification failed at offices ${fallbackOffices.join(", ")}; those offices carry predicate-only justification while the route output is unchanged`,
  };

  // ---- G2: predicate -------------------------------------------------------
  const perOfficeCounts = perOffice.map((row) => ({ office: row.office, count: row.selectedCount }));
  const g2 = {
    rule: "|{s in satellites(h) : forte(s) = '7-27'}| = 2",
    perOfficeCounts,
    totalSelected: perOffice.reduce((sum, row) => sum + row.selectedCount, 0),
    officesAtTwo: perOffice.filter((row) => row.selectedCount === 2).length,
    allTwo: perOffice.every((row) => row.selectedCount === 2),
  };
  g2.pass = g2.allTwo && g2.totalSelected === 14;

  // ---- G3: coverage --------------------------------------------------------
  const contacts = emitContacts(perOffice);
  const generatedKeys = contacts.keys;
  const generatedSet = new Set(generatedKeys);
  const matched = generatedKeys.filter((key) => observedSet.has(key));
  const missing = observedKeys.filter((key) => !generatedSet.has(key));
  const extra = generatedKeys.filter((key) => !observedSet.has(key));
  const g3 = {
    generatedKeys,
    generatedCount: generatedKeys.length,
    observedCount: observedKeys.length,
    matched,
    missing,
    extra,
    equalsObserved: missing.length === 0 && extra.length === 0 && generatedKeys.length === observedKeys.length,
  };
  g3.pass = g3.equalsObserved;

  // ---- G4: non-collapse ----------------------------------------------------
  const tAOutputCount = sortedUnique(comparison.routes.A.generatedKeys).length;
  const tBOutputCount = sortedUnique(comparison.routes.B.generatedKeys).length;
  const strictSubset = generatedKeys.every((key) => uSet.has(key)) &&
    generatedKeys.length < uKeys.length;
  const g4 = {
    generatedCount: generatedKeys.length,
    uKeyCount: uKeys.length,
    tAOutputCount,
    tBOutputCount,
    strictSubset,
    nonCollapse: generatedKeys.length !== uKeys.length,
    statement: "R2 traverses the same 7 A0 cycle-edge pairs as T-B; the identity is broken by satellite-reading (P conjunction) and output selection, not by edge substitution: T-B is satellite-blind and emits U (28), R2 selects within and emits 14",
  };
  g4.pass = g4.nonCollapse && g4.strictSubset && tBOutputCount === uKeys.length;

  // ---- G5: T-C midpoint census --------------------------------------------
  const frozenMatches = new Set(comparison.tC.matches.map((entry) => {
    const [tier, a, b, mid] = entry.split(":");
    if (tier !== "A0") fail(`unexpected frozen tC match tier ${tier}`);
    return canonicalMidpointKey(a, b, mid);
  }));
  if (frozenMatches.size !== 2) fail(`frozen T-C match census ${frozenMatches.size}`);
  const midpointEntries = cycleEdges.map((edge) => {
    const officeA = a0Office.get(edge.a);
    const officeB = a0Office.get(edge.b);
    if (officeA === undefined || officeB === undefined) fail(`A0 office lookup failed for edge at ${edge.office}`);
    const mid = String(midZ7(BigInt(officeA), BigInt(officeB)));
    if (mid !== edge.office) fail(`cycle-edge midpoint ${mid} is not the edge office ${edge.office}`);
    const relationKey = canonicalMidpointKey(edge.a, edge.b, mid);
    const exact = frozenMatches.has(relationKey);
    return {
      office: edge.office,
      a: edge.a,
      b: edge.b,
      d: edge.d,
      midpoint: mid,
      realized: true,
      exact: exact ? true : "unverified",
      relationKey,
      prediction: exact ? null
        : `predicted: ${relationKey}; confirmable against the D4 A0 seam-relation observation surface (comparison.tC.observedRelations, qa/d4-production-receipt.json), which currently records only the two T1 relations`,
    };
  });
  const exactEntries = midpointEntries.filter((entry) => entry.exact === true);
  const unverifiedEntries = midpointEntries.filter((entry) => entry.exact !== true);
  const seamGenerated = sortedUnique(phaseC.e2Retry.routeC.seam.generatedRelations.map((entry) => {
    const [tier, a, b, mid] = entry.split(":");
    if (tier !== "A0") fail(`unexpected seam tC tier ${tier}`);
    return canonicalMidpointKey(a, b, mid);
  }));
  const realizedSet = new Set(midpointEntries.map((entry) => entry.relationKey));
  const seamObserved = sortedUnique(phaseC.e2Retry.routeC.seam.observedRelations.map((entry) => {
    const [tier, a, b, mid] = entry.split(":");
    if (tier !== "A0") fail(`unexpected seam tC observed tier ${tier}`);
    return canonicalMidpointKey(a, b, mid);
  }));
  const exactSet = new Set(exactEntries.map((entry) => entry.relationKey));
  const g5 = {
    realized: midpointEntries.length,
    exact: exactEntries.length,
    unverified: unverifiedEntries.length,
    entries: midpointEntries,
    invariant: "every cycle edge's midpoint equals the office of the anchor it constructs",
    seamCrossCheck: {
      generatedRelations: seamGenerated.length,
      equalsRealizedSet: seamGenerated.length === realizedSet.size &&
        seamGenerated.every((key) => realizedSet.has(key)),
      observedRelations: seamObserved.length,
      equalsExactSubset: seamObserved.length === exactSet.size &&
        seamObserved.every((key) => exactSet.has(key)),
      realizationOfObserved: phaseC.e2Retry.routeC.seam.realizationOfObserved === true,
    },
  };
  g5.pass = g5.realized === 7 && g5.exact === 2 && g5.unverified === 5 &&
    unverifiedEntries.every((entry) => typeof entry.prediction === "string" && entry.prediction.length > 0) &&
    g5.seamCrossCheck.equalsRealizedSet && g5.seamCrossCheck.equalsExactSubset &&
    g5.seamCrossCheck.realizationOfObserved;

  // ---- constraint-satisfaction table --------------------------------------
  const constraintTable = [
    {
      constraint: "Predicate P incorporated",
      requirement: "the implemented route expresses P(s) = [forte(s) = '7-27'] as its selection mechanism",
      mechanism: "engine step 3: selectSatellites applies the single-hop forte-field predicate per anchor satellite set",
      evidence: "G2 (2 selected per office, all 7 offices) and G3 (generated keys = O exactly)",
      satisfied: g2.pass && g3.pass,
    },
    {
      constraint: "Full cycle-edge traversal (T1 + T2)",
      requirement: "all 7 cycle edges traversed; both transposition intervals covered",
      mechanism: "engine step 2: per-office cycle-twin verification over d in {1,2}",
      evidence: `G1 (${g1.perEdge.filter((edge) => edge.holds).length}/7 edges verified; T1 offices ${t1Offices.join(", ")}; T2 offices ${t2Offices.join(", ")})`,
      satisfied: g1.allPass,
    },
    {
      constraint: "Break the cycle-edge <-> construction-pair identity",
      requirement: "traversing the same A0 cycle-edge pairs as T-B must not restate U",
      mechanism: "satellite-reading selection: R2 conjoins P where the T-B join never reads s except as payload",
      evidence: "G4 (|R2| = 14 != 28 = |U|; T-B output = U)",
      satisfied: g4.pass,
    },
    {
      constraint: "T-C midpoint scope adjudicated",
      requirement: "7 realized, 2 observation-exact, 5 seam-derived predictions",
      mechanism: "midpoint census per cycle edge; exactness sourced only from frozen observed seam relations",
      evidence: "G5 (7 realized; 2 exact; 5 unverified with prediction markers; seam cross-check 7 = 7)",
      satisfied: g5.pass,
    },
  ];

  // ---- identity-phase calibration mechanism (minimal fixture) -------------
  const a0Anchors = projection.anchors.filter((anchor) => anchor.tier === "A0")
    .map((anchor) => ({ id: String(anchor.id), officeIndex: String(anchor.officeIndex) }))
    .sort((left, right) => cmp(left.id, right.id));
  const calibration = calibrateIdentityPhase({ a0Anchors, R });
  const frozenCalibrationKeys = sortedUnique(comparison.routes.A.generatedKeys);
  if (canonicalText(calibration.keys) !== canonicalText(frozenCalibrationKeys)) {
    fail("identity-phase calibration mechanism does not reproduce the minimal frozen keying fixture");
  }
  if (calibration.keys.length !== 8 || canonicalText(calibration.offices) !== canonicalText(["0", "6"])) {
    fail(`identity-phase fixture scope drift: ${calibration.keys.length} keys over offices ${calibration.offices.join(", ")}`);
  }

  // ---- core assembly ------------------------------------------------------
  const core = {
    schemaVersion: CONTRACT_SCHEMA_VERSION,
    contractId: CONTRACT_ID,
    status: CONTRACT_STATUS,
    generator: "scripts/build-d4-r2-contract.mjs",
    engine: ENGINE_PATH,
    admission: {
      gate: "Gate 1",
      state: "claim_admitted",
      memo: BL057_MEMO_PATH,
      note: "route admitted as a D4 contract-amendment claim event; this artifact is the Gate 2 contract implementation",
    },
    sourceBindings: [
      { artifact: FROZEN_RECEIPT_PATH, sha256: fileSha(FROZEN_RECEIPT_PATH), role: "frozen D4 comparison (U/O keyings, cells, route accounting, observed seam relations)" },
      { artifact: FROZEN_GENERATION_PATH, sha256: fileSha(FROZEN_GENERATION_PATH), role: "frozen projection (R/E/anchors) consumed by the route" },
      { artifact: HEPTATONIC_LEDGER_PATH, sha256: fileSha(HEPTATONIC_LEDGER_PATH), role: "462-record canonical ledger (forte field, the predicate's single-hop source)" },
      { artifact: HEPTATONIC_NETWORK_PATH, sha256: fileSha(HEPTATONIC_NETWORK_PATH), role: "structural edges (independent R/E re-extraction in the validator)" },
      { artifact: SELECTION_REVIEW_PATH, sha256: fileSha(SELECTION_REVIEW_PATH), role: "BL-055 findings (predicate, cycle geometry, per-anchor E-parents)" },
      { artifact: PHASE_C_PROBE_PATH, sha256: fileSha(PHASE_C_PROBE_PATH), role: "Phase C seam pairs, T-C relation inventory, strict-degree control" },
    ],
    route: {
      id: ROUTE_ID,
      name: ROUTE_NAME,
      definition: "R2(h) = {(o(h), s) : s in satellites(h) and P(s)}",
      predicate: PREDICATE_STATEMENT,
      predicateForm: "code: single-hop canonical-field read (forteOf(satellite) === '7-27' in the contract engine); the generator supplies the ledger-field reader and the validator re-reads the canonical ledger independently",
      derivation: [
        "1. EXTRACT parents (a, b) from the anchor's two A0 CONSTRUCTS seeds",
        "2. VERIFY cycle-edge: rotateMaskZ12^d(a) = b with d the edge's transposition interval [gated: cycle_twin verification]",
        "3. SELECT satellites: S_P = {s in satellites(h) : forte(s) = '7-27'}",
        "4. EMIT contacts: {(o(h), s) : s in S_P}",
      ],
      output: "G_R2 = {(o(h), s) : h in A1, s in satellites(h), P(s)}",
      outputStatement: "G_R2 = O (14 keys; 2 per office; G_R2 strictly inside U)",
      justificationSummary: {
        cycleTwinVerified: perOffice.filter((row) => row.justification === "cycle-twin-verified").length,
        predicateOnly: perOffice.filter((row) => row.justification === "predicate-only").length,
        tierNote: "the justification tier is the route's explanatory ground, not its correctness: output correctness is proven by G2/G3 independently, and predicate-only offices may be upgraded without touching the route output",
      },
      cycleWalk: {
        edges: walk.map((edge) => ({ office: edge.office, a: edge.a, b: edge.b, d: edge.d })),
        closes: cycleCloses,
        intervalSum,
        t1Count: t1Offices.length,
        t2Count: t2Offices.length,
        statement: "the 7 A0 anchors form one closed transposition cycle (5 x T2 + 2 x T1, summing to 12); R2 traverses all 7 edges; presentation order frozen at the Gate 1 kickoff convention",
      },
      outputComparison: {
        observedKeyCount: 14,
        r2KeyCount: generatedKeys.length,
        tAKeyCount: tAOutputCount,
        tBKeyCount: tBOutputCount,
        uKeyCount: uKeys.length,
      },
    },
    perOffice,
    contacts: {
      generatedKeys,
      witnesses: contacts.witnesses,
      witnessCount: contacts.witnesses.length,
      statement: "deterministic emission: one witness per generated contact key, deduped and sorted by (office, satellite)",
    },
    gates: { G1: g1, G2: g2, G3: g3, G4: g4, G5: g5 },
    constraintTable,
    calibration: {
      gate: "Gate 2 mechanism only; full calibration verdict reserved to the Gate 3 execution run (no-collapse)",
      method: calibration.method,
      fixtureScope: calibration.scope,
      fixtureKeys: calibration.keys,
      fixtureOffices: calibration.offices,
      fixtureWitnessCount: calibration.witnesses.length,
      verdict: calibration.verdict,
      note: "the fixture is the minimal frozen keying (8 keys, offices 0 and 6; strict subset of U) — the identity-phase path is proven to route correctly without executing the historical calibration run",
    },
    contractInterface: {
      ...EXECUTION_RECEIPT_INTERFACE,
      schemaFile: "schemas/d4-r2-execution-receipt.schema.json (authored at Gate 3; schemas/ is fence-protected at Gate 2)",
      note: "Gate 2 defines this interface only; the receipt file qa/d4-r2-execution-receipt.json is created by the Gate 3 execution run",
    },
    fingerprintConvention: {
      contractFingerprint: "pins the Gate 2 implementation-validation state (this artifact); recomputed by the generator and re-checked by the validator",
      executionFingerprint: "the Gate 3 execution receipt carries its own execution fingerprint over its run record; two fingerprints, two gates, no collapse",
    },
    fences: {
      governsVerdicts: "none: D4 not_derived (DECISION_LEDGER.md:2195-2252) unchanged; no verdict is claimed from this sandbox",
      recordAmendment: "none: any D4 amendment is its own claim event with its own ceremony (Gate 4, OD-7 additive)",
      routeAdmission: "Gate 1: R2 admitted as a claim event (scrum/plan/bl-057-d4-amendment-spec.md, claim_admitted); this artifact is the Gate 2 contract implementation, not a new admission",
      derivationExecution: "none: the route evaluation over pinned sources is implementation self-validation inside the sandbox; it is not the Gate 3 registered execution run and creates no receipt",
      calibration: "mechanism only: the identity-phase replay is exercised against the minimal 8-key fixture; the full calibration verdict is reserved to the Gate 3 execution run",
      topology: "none: no topology/canon/runtime/schema/Court/Neo4j writes",
      wall: "untouched: R2 traverses the A0 cycle and emits A1 contact keys; no D-D edges, BL-029 boundary untouched",
      g1Intra330: "untouched",
      direction: "unassigned (BL-035 carried)",
      membrane: "frame 2.6/2.7 and the polarity synthesis are interpretation vocabulary, never design input",
      frozenStack: "read-only specification reference: scripts/d4-*.mjs never modified and never re-executed under the old freeze; the registered nine-file closure digest is re-verified by the validator",
      packaging: "landing-time packaging (manifest/checksums regen) is a separate step",
      sessionProse: "context, not evidence",
    },
    notAccomplished: [
      "no registered derivation execution; no qa/d4-r2-execution-receipt.json created",
      "no full calibration run or verdict: the identity-phase mechanism is exercised on the minimal 8-key fixture only",
      "no D4 record amendment, no ledger write, no governs admission (Gate 4 is a separate event)",
      "no canonical/Court/schema/Neo4j writes; no legal-move/audio bytes",
      "no frozen-stack modification or re-execution under its old freeze",
      "no claim beyond the landed frozen bytes; session prose is not evidence",
    ],
  };
  const contractFingerprint = sha256(canonicalText(core));
  return { ...core, contractFingerprint };
}

// ---------------------------------------------------------------------------

export function serializeContract(contract) {
  return `${canonicalText(contract)}\n`;
}

function main() {
  const check = process.argv.includes("--check");
  const contract = buildR2Contract();
  const serialized = serializeContract(contract);
  const outputPath = path.join(root, OUTPUT_PATH);
  const summary = {
    output: OUTPUT_PATH,
    check,
    contractId: contract.contractId,
    g1AllPass: contract.gates.G1.allPass,
    g1FallbackOffices: contract.gates.G1.fallbackOffices,
    g2Pass: contract.gates.G2.pass,
    g3Generated: contract.gates.G3.generatedCount,
    g3EqualsObserved: contract.gates.G3.equalsObserved,
    g4Pass: contract.gates.G4.pass,
    g5Realized: contract.gates.G5.realized,
    g5Exact: contract.gates.G5.exact,
    g5Unverified: contract.gates.G5.unverified,
    justificationSummary: contract.route.justificationSummary,
    calibration: {
      verdict: contract.calibration.verdict,
      fixtureKeyCount: contract.calibration.fixtureKeys.length,
      fixtureOffices: contract.calibration.fixtureOffices,
    },
    contractFingerprint: contract.contractFingerprint,
  };
  if (check) {
    const existing = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, "utf8") : null;
    if (existing !== serialized) throw new Error("STALE_D4_R2_CONTRACT");
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
