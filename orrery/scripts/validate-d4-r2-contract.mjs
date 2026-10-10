#!/usr/bin/env node
/**
 * Validate the generated BL-057 Gate 2 D4 R2 contract implementation artifact
 * against its sources.
 *
 * Independent of the generator and of the contract engine: re-reads the frozen
 * receipt, the canonical heptatonic ledger, the network data, the BL-055
 * selection review and the Phase C probe; re-extracts R/E from the canonical
 * network; re-derives the cycle edges from the seam pairs; re-evaluates the R2
 * route per office with its own predicate read; re-checks gates G1-G5, the
 * constraint table, the calibration mechanism fixture, the documented Gate 3
 * receipt interface and the fences; re-checks the fingerprint and the
 * byte-stable canonical serialization; verifies the registered nine-file
 * closure digest (frozen stack untouched); and asserts the engine and
 * generator sources contain no hardcoded satellite IDs and read the canonical
 * forte field. Fail-loud.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..", "..");

const ARTIFACT_PATH = "orrery/src/generated/d4-r2-contract.v1.json";
const SCHEMA_VERSION = "harmonic-orrery.d4-r2-contract.v1";
const CONTRACT_ID = "BL057_D4_R2_CONTRACT_v1";
const CONTRACT_STATUS = "implementation_evidence";
const GENERATOR_PATH = "scripts/build-d4-r2-contract.mjs";
const ENGINE_PATH = "scripts/d4-r2-contract.mjs";
const BL057_MEMO_PATH = "scrum/plan/bl-057-d4-amendment-spec.md";
const FROZEN_RECEIPT_PATH = "qa/d4-production-receipt.json";
const FROZEN_GENERATION_PATH = "qa/d4-production-generation.json";
const HEPTATONIC_LEDGER_PATH = "canonical/universal-heptatonic-ledger.csv";
const HEPTATONIC_NETWORK_PATH = "canonical/universal-network-data.json";
const SELECTION_REVIEW_PATH = "orrery/src/generated/d4-selection-review.v1.json";
const PHASE_C_PROBE_PATH = "orrery/src/generated/phase-c-probe.v1.json";
const GRANT1_REVISION_PATH = "qa/d4-grant1-revision.json";
const EXECUTION_RECEIPT_PATH = "qa/d4-r2-execution-receipt.json";
const SELECTION_REVIEW_FINGERPRINT = "6d11fd932efbe96892b3cf2e6a6cdad6f54e69cd2a8f284ebb72232c59d8b745";
const PHASE_C_FINGERPRINT = "5085e27404de2e591b146d38f289da660c6bc49041a54f073acafcbfe10f2f49";
const FROZEN_IMPLEMENTATION_DIGEST = "7ab950fac561016afc816e8b6947f7ce0b5f25573f1472321054ddbc9c1e097f";

function fail(message) {
  throw new Error(`INVALID_D4_R2_CONTRACT: ${message}`);
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

function canonicalText(value) {
  if (value === null) return "null";
  if (value === true) return "true";
  if (value === false) return "false";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isInteger(value)) fail("non-integer number in contract payload");
    return String(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalText).join(",")}]`;
  if (typeof value === "object") {
    const keys = Object.keys(value).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${canonicalText(value[key])}`).join(",")}}`;
  }
  fail(`unsupported JSON type: ${typeof value}`);
}

const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const unique = (values) => [...new Set(values)].sort(cmp);
const keyOf = (office, satellite) => `${office}:${satellite}`;
const rotateMaskZ12 = (mask) => ((mask << 1) & 4095) | (mask >> 11);
const rotatePow = (mask, d) => {
  let value = mask;
  for (let step = 0; step < d; step += 1) value = rotateMaskZ12(value);
  return value;
};
const midpointOf = (officeA, officeB) => String((4 * (officeA + officeB)) % 7);
const canonicalMidpointKey = (a, b, mid) => {
  const low = cmp(a, b) <= 0 ? a : b;
  const high = cmp(a, b) <= 0 ? b : a;
  return `A0:${low}:${high}:${mid}`;
};

function validate() {
  // ---- byte-stable canonical serialization --------------------------------
  const artifactBytes = read(ARTIFACT_PATH);
  const artifact = JSON.parse(artifactBytes);
  if (artifactBytes !== `${canonicalText(artifact)}\n`) {
    fail("artifact is not byte-stable canonical serialization");
  }

  const receipt = readJson(FROZEN_RECEIPT_PATH);
  const frozenGeneration = readJson(FROZEN_GENERATION_PATH);
  const ledger = parseCsv(read(HEPTATONIC_LEDGER_PATH));
  const network = readJson(HEPTATONIC_NETWORK_PATH);
  const selectionReview = readJson(SELECTION_REVIEW_PATH);
  const phaseC = readJson(PHASE_C_PROBE_PATH);
  const revision = readJson(GRANT1_REVISION_PATH);

  // ---- header, status, fingerprint ----------------------------------------
  if (artifact.schemaVersion !== SCHEMA_VERSION || artifact.contractId !== CONTRACT_ID ||
      artifact.status !== CONTRACT_STATUS) fail("header drift");
  if (artifact.generator !== GENERATOR_PATH || artifact.engine !== ENGINE_PATH) fail("generator/engine drift");
  const { contractFingerprint, ...core } = artifact;
  if (typeof contractFingerprint !== "string" || !/^[0-9a-f]{64}$/.test(contractFingerprint) ||
      sha256(canonicalText(core)) !== contractFingerprint) fail("contractFingerprint drift");
  if (artifact.sourceBindings.length !== 6) fail("source binding census drift");
  for (const binding of artifact.sourceBindings) {
    if (sha256(fs.readFileSync(path.join(root, binding.artifact))) !== binding.sha256) {
      fail(`source binding drift: ${binding.artifact}`);
    }
  }
  if (ledger.length !== 462) fail("ledger census drift");
  if (receipt.category !== "not_derived") fail("frozen category drift");
  if (selectionReview.reviewFingerprint !== SELECTION_REVIEW_FINGERPRINT) fail("BL-055 fingerprint drift");
  if (phaseC.probeFingerprint !== PHASE_C_FINGERPRINT) fail("Phase C fingerprint drift");

  // ---- Gate 2 entry precondition: Gate 1 ruling landed --------------------
  if (artifact.admission.gate !== "Gate 1" || artifact.admission.state !== "claim_admitted" ||
      artifact.admission.memo !== BL057_MEMO_PATH) fail("admission block drift");
  if (!read(BL057_MEMO_PATH).includes("**Status:** `claim_admitted`")) {
    fail("Gate 2 entry precondition not met: BL-057 memo header is not claim_admitted");
  }

  // ---- no-collapse: the Gate 3 execution receipt must not exist -----------
  if (fs.existsSync(path.join(root, EXECUTION_RECEIPT_PATH))) {
    fail("Gate 3 execution receipt exists; the no-collapse rule is violated");
  }

  // ---- frozen nine-file closure untouched ---------------------------------
  const closureRecords = revision.inventory.map(({ path: filePath, sha256: digest }) => ({ path: filePath, sha256: digest }))
    .sort((left, right) => cmp(left.path, right.path));
  if (sha256(canonicalText(closureRecords)) !== revision.implementationDigest ||
      revision.implementationDigest !== FROZEN_IMPLEMENTATION_DIGEST ||
      receipt.bindings.implementationDigest !== FROZEN_IMPLEMENTATION_DIGEST) {
    fail("registered nine-file closure digest drift");
  }
  for (const { path: filePath, sha256: digest } of revision.inventory) {
    if (sha256(fs.readFileSync(path.join(root, filePath))) !== digest) {
      fail(`frozen stack file drift: ${filePath}`);
    }
  }

  // ---- re-extraction from canonical sources -------------------------------
  const ledgerById = new Map(ledger.map((row) => [row.id, row]));
  const identity = (id) => {
    const row = ledgerById.get(id);
    if (!row) fail(`ledger identity missing for ${id}`);
    return row;
  };
  const R = [];
  const E = [];
  for (const edge of network.structuralEdges) {
    const parent = ledgerById.get(String(edge.source));
    const child = ledgerById.get(String(edge.target));
    if (!parent || !child) continue;
    if (edge.type === "GOVERNS" && parent.tier === "A1" && parent.role === "anchor" &&
        child.tier === "A1" && child.role === "satellite") {
      R.push({ source: String(edge.source), target: String(edge.target), parentOffice: String(parent.officeIndex) });
    }
    if (edge.type === "CONSTRUCTS" && parent.tier === "A0" && parent.role === "anchor" &&
        child.tier === "A1" && child.role === "anchor") {
      E.push({ source: String(edge.source), target: String(edge.target) });
    }
  }
  if (R.length !== 28 || E.length !== 14) fail("projection re-extraction census drift");
  const rByKey = new Map(R.map((row) => [keyOf(row.parentOffice, row.target), row]));
  const eParentsOf = new Map();
  for (const edge of E) {
    eParentsOf.set(edge.target, [...(eParentsOf.get(edge.target) ?? []), edge.source]);
  }

  // cross-check the frozen generation projection against the canonical re-extraction
  const frozenR = frozenGeneration.projection.R.map((row) => keyOf(String(row.parentOffice), String(row.target)));
  const frozenE = frozenGeneration.projection.E.map((row) => `${row.source}:${row.target}`);
  if (canonicalText(unique(frozenR)) !== canonicalText(unique(R.map((row) => keyOf(row.parentOffice, row.target)))) ||
      canonicalText(unique(frozenE)) !== canonicalText(unique(E.map((edge) => `${edge.source}:${edge.target}`)))) {
    fail("canonical R/E re-extraction disagrees with the frozen projection");
  }

  // ---- engine/generator source assertions (non-circularity hardening) -----
  const engineSource = read(ENGINE_PATH);
  const generatorSource = read(GENERATOR_PATH);
  const uSatelliteIds = unique(receipt.comparison.uKeys.map((key) => key.split(":")[1]));
  const a1AnchorIds = unique(R.map((row) => row.source));
  const a0AnchorIds = unique(ledger.filter((row) => row.tier === "A0" && row.role === "anchor").map((row) => row.id));
  for (const id of uSatelliteIds) {
    if (engineSource.includes(id)) fail(`engine source embeds satellite id ${id}`);
    if (generatorSource.includes(id)) fail(`generator source embeds satellite id ${id}`);
  }
  for (const id of [...a1AnchorIds, ...a0AnchorIds]) {
    if (engineSource.includes(id)) fail(`engine source embeds anchor id ${id}`);
  }
  if (!engineSource.includes("forteOf") || !engineSource.includes("PREDICATE_FORTE")) {
    fail("engine source does not expose the forte-field predicate path");
  }
  if (!generatorSource.includes(".forte") || !generatorSource.includes("evaluateRouteOffice")) {
    fail("generator source does not read the canonical forte field through the engine");
  }

  // ---- frozen domain ------------------------------------------------------
  const comparison = receipt.comparison;
  const uKeys = unique(comparison.uKeys);
  const observedKeys = unique(comparison.rows.map((row) => keyOf(String(row.parentOffice), String(row.s))));
  const observedSet = new Set(observedKeys);
  const uSet = new Set(uKeys);
  if (uKeys.length !== 28 || observedKeys.length !== 14) fail("domain census drift");
  if (canonicalText(artifact.route.outputComparison) !== canonicalText({
    observedKeyCount: 14,
    r2KeyCount: 14,
    tAKeyCount: unique(comparison.routes.A.generatedKeys).length,
    tBKeyCount: unique(comparison.routes.B.generatedKeys).length,
    uKeyCount: 28,
  })) fail("output comparison drift");

  // ---- cycle edges re-derived from the seam pairs -------------------------
  const seamPairs = phaseC.e2Retry.routeASeam.seamPairs;
  if (seamPairs.length !== 9) fail("seam pair census drift");
  const cycleEdgesByOffice = new Map();
  for (const pair of seamPairs) {
    const edge = { office: String(pair.office), a: String(pair.a), b: String(pair.c),
      aPhase: String(pair.aPhase), bPhase: String(pair.cPhase),
      d: ((Number(pair.aPhase) - Number(pair.cPhase)) + 12) % 12 };
    const existing = cycleEdgesByOffice.get(edge.office);
    if (existing && (existing.a !== edge.a || existing.b !== edge.b || existing.d !== edge.d)) {
      fail(`non-uniform edge at office ${edge.office}`);
    }
    cycleEdgesByOffice.set(edge.office, edge);
  }
  if (cycleEdgesByOffice.size !== 7) fail("cycle edge census drift");
  const cycleEdges = [...cycleEdgesByOffice.values()].sort((left, right) => cmp(left.office, right.office));
  for (const edge of cycleEdges) {
    if (edge.d !== 1 && edge.d !== 2) fail(`cycle interval drift at ${edge.office}`);
    const recorded = selectionReview.taGeometry.cycle.edges.find((row) => String(row.office) === edge.office);
    if (!recorded || String(recorded.a) !== edge.a || String(recorded.c) !== edge.b ||
        Number(recorded.interval) !== edge.d) fail(`cycle disagrees with BL-055 at ${edge.office}`);
  }
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
  const intervalSum = walk.reduce((sum, edge) => sum + edge.d, 0);
  if (intervalSum !== 12) fail("cycle interval sum drift");
  if (canonicalText(artifact.route.cycleWalk.edges) !== canonicalText(
    walk.map((edge) => ({ office: edge.office, a: edge.a, b: edge.b, d: edge.d }))) ||
      artifact.route.cycleWalk.closes !== true || artifact.route.cycleWalk.intervalSum !== 12 ||
      artifact.route.cycleWalk.t1Count !== 2 || artifact.route.cycleWalk.t2Count !== 5) {
    fail("cycle walk artifact drift");
  }

  // ---- per-office route re-evaluation -------------------------------------
  const a0Office = new Map(ledger.filter((row) => row.tier === "A0" && row.role === "anchor")
    .map((row) => [row.id, String(row.officeIndex)]));
  const expectedPerOffice = unique(uKeys.map((key) => key.split(":")[0])).map((office) => {
    const keys = uKeys.filter((key) => key.startsWith(`${office}:`));
    if (keys.length !== 4) fail(`office ${office} key census drift`);
    const r = rByKey.get(keys[0]);
    if (!r) fail(`R row missing for ${keys[0]}`);
    const h = r.source;
    const parents = unique(eParentsOf.get(h) ?? []);
    if (parents.length !== 2) fail(`parent distinctness drift at ${h}`);
    const edge = cycleEdges.find((row) => row.office === office);
    if (canonicalText(unique([edge.a, edge.b])) !== canonicalText(parents)) {
      fail(`E-parent pair is not the cycle edge at office ${office}`);
    }
    const holds = rotatePow(Number(edge.a), edge.d) === Number(edge.b);
    const satellites = keys.map((key) => key.split(":")[1]).sort(cmp);
    const selected = satellites.filter((satellite) => identity(satellite).forte === "7-27");
    return {
      office,
      parentH: h,
      eParents: parents,
      cycleEdge: { a: edge.a, b: edge.b, d: edge.d, aPhase: edge.aPhase, bPhase: edge.bPhase },
      cycleTwin: { checked: `rotateMaskZ12^${edge.d}(${edge.a}) = ${edge.b}`, holds },
      justification: holds ? "cycle-twin-verified" : "predicate-only",
      satellites,
      selected,
      selectedCount: selected.length,
    };
  });
  const artifactPerOffice = artifact.perOffice;
  if (artifactPerOffice.length !== 7) fail("perOffice census drift");
  for (let index = 0; index < expectedPerOffice.length; index += 1) {
    const expected = expectedPerOffice[index];
    const actual = artifactPerOffice[index];
    for (const field of ["office", "parentH", "eParents", "satellites", "selected", "selectedCount", "justification"]) {
      if (canonicalText(actual[field]) !== canonicalText(expected[field])) {
        fail(`perOffice drift at ${expected.office}: ${field}`);
      }
    }
    if (canonicalText(actual.cycleEdge) !== canonicalText(expected.cycleEdge)) {
      fail(`cycleEdge drift at ${expected.office}`);
    }
    if (canonicalText(actual.cycleTwin) !== canonicalText(expected.cycleTwin)) {
      fail(`cycleTwin drift at ${expected.office}`);
    }
  }

  // ---- G1 ----------------------------------------------------------------
  const expectedG1PerEdge = expectedPerOffice.map((row) => ({ office: row.office, a: row.cycleEdge.a,
    b: row.cycleEdge.b, d: row.cycleEdge.d, holds: row.cycleTwin.holds }));
  const fallbackOffices = expectedPerOffice.filter((row) => !row.cycleTwin.holds).map((row) => row.office);
  if (canonicalText(artifact.gates.G1.perEdge) !== canonicalText(expectedG1PerEdge) ||
      artifact.gates.G1.allPass !== (fallbackOffices.length === 0) ||
      canonicalText(artifact.gates.G1.fallbackOffices) !== canonicalText(fallbackOffices) ||
      canonicalText(artifact.gates.G1.t1Edges) !== canonicalText(["0", "6"]) ||
      canonicalText(artifact.gates.G1.t2Edges) !== canonicalText(["1", "2", "3", "4", "5"])) {
    fail("G1 drift");
  }

  // ---- G2 ----------------------------------------------------------------
  const expectedCounts = expectedPerOffice.map((row) => ({ office: row.office, count: row.selectedCount }));
  if (canonicalText(artifact.gates.G2.perOfficeCounts) !== canonicalText(expectedCounts) ||
      artifact.gates.G2.totalSelected !== 14 || artifact.gates.G2.officesAtTwo !== 7 ||
      artifact.gates.G2.allTwo !== true || artifact.gates.G2.pass !== expectedCounts.every((row) => row.count === 2)) {
    fail("G2 drift");
  }

  // ---- G3 ----------------------------------------------------------------
  const generatedKeys = unique(expectedPerOffice.flatMap((row) =>
    row.selected.map((satellite) => keyOf(row.office, satellite))));
  const generatedSet = new Set(generatedKeys);
  const matched = generatedKeys.filter((key) => observedSet.has(key));
  const missing = observedKeys.filter((key) => !generatedSet.has(key));
  const extra = generatedKeys.filter((key) => !observedSet.has(key));
  if (artifact.gates.G3.generatedCount !== 14 || artifact.gates.G3.observedCount !== 14 ||
      canonicalText(artifact.gates.G3.generatedKeys) !== canonicalText(generatedKeys) ||
      canonicalText(artifact.gates.G3.matched) !== canonicalText(matched) ||
      canonicalText(artifact.gates.G3.missing) !== canonicalText(missing) ||
      canonicalText(artifact.gates.G3.extra) !== canonicalText(extra) ||
      artifact.gates.G3.equalsObserved !== (missing.length === 0 && extra.length === 0) ||
      artifact.gates.G3.pass !== true) {
    fail("G3 drift");
  }

  // ---- contacts emission re-check -----------------------------------------
  const contactKeys = artifact.contacts.generatedKeys;
  if (canonicalText(contactKeys) !== canonicalText(generatedKeys) ||
      artifact.contacts.witnessCount !== 14 || artifact.contacts.witnesses.length !== 14 ||
      artifact.contacts.witnesses.some((witness) => witness.tag !== "r2_filtered_cycle_walk" ||
        !generatedSet.has(keyOf(witness.parentOffice, witness.s)))) {
    fail("contacts emission drift");
  }

  // ---- G4 ----------------------------------------------------------------
  const strictSubset = generatedKeys.every((key) => uSet.has(key)) && generatedKeys.length < uKeys.length;
  if (artifact.gates.G4.generatedCount !== 14 || artifact.gates.G4.uKeyCount !== 28 ||
      artifact.gates.G4.tBOutputCount !== 28 ||
      artifact.gates.G4.strictSubset !== strictSubset || artifact.gates.G4.nonCollapse !== true ||
      artifact.gates.G4.pass !== true || !artifact.gates.G4.statement.includes("satellite-reading")) {
    fail("G4 drift");
  }

  // ---- G5 ----------------------------------------------------------------
  const frozenMatches = new Set(comparison.tC.matches.map((entry) => {
    const [tier, a, b, mid] = entry.split(":");
    if (tier !== "A0") fail("unexpected frozen tC tier");
    return canonicalMidpointKey(a, b, mid);
  }));
  const expectedMidpoints = cycleEdges.map((edge) => {
    const mid = midpointOf(Number(a0Office.get(edge.a)), Number(a0Office.get(edge.b)));
    if (mid !== edge.office) fail(`midpoint invariant violation at office ${edge.office}`);
    const relationKey = canonicalMidpointKey(edge.a, edge.b, mid);
    const exact = frozenMatches.has(relationKey);
    return { office: edge.office, a: edge.a, b: edge.b, d: edge.d, midpoint: mid,
      realized: true, exact: exact ? true : "unverified", relationKey };
  });
  if (canonicalText(artifact.gates.G5.entries.map((entry) => ({
    office: entry.office, a: entry.a, b: entry.b, d: entry.d, midpoint: entry.midpoint,
    realized: entry.realized, exact: entry.exact, relationKey: entry.relationKey,
  }))) !== canonicalText(expectedMidpoints)) fail("G5 entries drift");
  const unverified = artifact.gates.G5.entries.filter((entry) => entry.exact !== true);
  if (artifact.gates.G5.realized !== 7 || artifact.gates.G5.exact !== 2 ||
      artifact.gates.G5.unverified !== 5 ||
      unverified.some((entry) => typeof entry.prediction !== "string" ||
        !entry.prediction.startsWith("predicted:") ||
        !entry.prediction.includes("comparison.tC.observedRelations")) ||
      artifact.gates.G5.entries.filter((entry) => entry.exact === true)
        .some((entry) => entry.prediction !== null) ||
      artifact.gates.G5.pass !== true) fail("G5 drift");
  const seamGenerated = unique(phaseC.e2Retry.routeC.seam.generatedRelations.map((entry) => {
    const [tier, a, b, mid] = entry.split(":");
    if (tier !== "A0") fail("unexpected seam tC tier");
    return canonicalMidpointKey(a, b, mid);
  }));
  const realizedSet = new Set(expectedMidpoints.map((entry) => entry.relationKey));
  const seamObserved = unique(phaseC.e2Retry.routeC.seam.observedRelations.map((entry) => {
    const [tier, a, b, mid] = entry.split(":");
    if (tier !== "A0") fail("unexpected seam tC observed tier");
    return canonicalMidpointKey(a, b, mid);
  }));
  const exactSet = new Set(expectedMidpoints.filter((entry) => entry.exact === true).map((entry) => entry.relationKey));
  const cross = artifact.gates.G5.seamCrossCheck;
  if (cross.generatedRelations !== 7 || cross.equalsRealizedSet !== true ||
      cross.observedRelations !== 2 || cross.equalsExactSubset !== true ||
      cross.realizationOfObserved !== true ||
      seamGenerated.length !== 7 || seamGenerated.some((key) => !realizedSet.has(key)) ||
      seamObserved.length !== 2 || seamObserved.some((key) => !exactSet.has(key))) fail("G5 seam cross-check drift");

  // ---- constraint table ---------------------------------------------------
  const expectedSatisfaction = [
    artifact.gates.G2.pass && artifact.gates.G3.pass,
    artifact.gates.G1.allPass,
    artifact.gates.G4.pass,
    artifact.gates.G5.pass,
  ];
  if (artifact.constraintTable.length !== 4) fail("constraint table census drift");
  if (canonicalText(artifact.constraintTable.map((row) => row.satisfied)) !== canonicalText(expectedSatisfaction)) {
    fail("constraint table satisfaction drift");
  }
  const constraints = artifact.constraintTable.map((row) => row.constraint);
  if (canonicalText(constraints) !== canonicalText([
    "Predicate P incorporated",
    "Full cycle-edge traversal (T1 + T2)",
    "Break the cycle-edge <-> construction-pair identity",
    "T-C midpoint scope adjudicated",
  ])) fail("constraint inventory drift");

  // ---- justification summary ---------------------------------------------
  const expectedJustification = {
    cycleTwinVerified: expectedPerOffice.filter((row) => row.justification === "cycle-twin-verified").length,
    predicateOnly: expectedPerOffice.filter((row) => row.justification === "predicate-only").length,
  };
  if (artifact.route.justificationSummary.cycleTwinVerified !== expectedJustification.cycleTwinVerified ||
      artifact.route.justificationSummary.predicateOnly !== expectedJustification.predicateOnly) {
    fail("justification summary drift");
  }

  // ---- calibration mechanism (independent re-derivation) ------------------
  const a0Anchors = ledger.filter((row) => row.tier === "A0" && row.role === "anchor")
    .map((row) => ({ id: row.id, officeIndex: String(row.officeIndex) }));
  const calibrationWitnesses = [];
  for (const a of a0Anchors) {
    for (const b of a0Anchors) {
      if (a.id === b.id) continue;
      if (rotateMaskZ12(Number(a.id)) !== Number(b.id)) continue;
      for (let office = 0; office < 7; office += 1) {
        if (Number(a.officeIndex) !== (office + 1) % 7) continue;
        if (Number(b.officeIndex) !== (office + 6) % 7) continue;
        for (const r of R) {
          if (Number(r.parentOffice) !== office) continue;
          calibrationWitnesses.push(keyOf(String(office), String(r.target)));
        }
      }
    }
  }
  const expectedCalibrationKeys = unique(calibrationWitnesses);
  const frozenCalibrationKeys = unique(comparison.routes.A.generatedKeys);
  const calibration = artifact.calibration;
  if (canonicalText(calibration.fixtureKeys) !== canonicalText(expectedCalibrationKeys) ||
      canonicalText(calibration.fixtureKeys) !== canonicalText(frozenCalibrationKeys)) {
    fail("calibration fixture does not reproduce the minimal frozen keying");
  }
  if (calibration.fixtureKeys.length !== 8 || canonicalText(calibration.fixtureOffices) !== canonicalText(["0", "6"]) ||
      calibration.fixtureOffices.length !== 2 ||
      calibration.fixtureKeys.some((key) => !uSet.has(key)) ||
      calibration.fixtureKeys.length === uKeys.length) {
    fail("calibration fixture scope drift");
  }
  if (calibration.verdict !== "mechanism_only" ||
      !calibration.fixtureScope.includes("Gate 3") ||
      /identicalToFrozen|OBS-023/.test(canonicalText(calibration))) {
    fail("calibration verdict scope drift (no-collapse)");
  }

  // ---- documented Gate 3 receipt interface --------------------------------
  const ci = artifact.contractInterface;
  if (ci.schemaVersion !== "d4-r2-execution-receipt.v1" || ci.path !== EXECUTION_RECEIPT_PATH ||
      ci.routeId !== "R2" ||
      canonicalText(ci.statusTokens) !== canonicalText(["execution_verified", "attribution_incomplete"]) ||
      Object.keys(ci.fields).sort().join(",") !==
        "executionTimestamp,gates,implementationDigest,inputHashes,outputHashes,passFail,routeId,schemaVersion,status" ||
      !ci.failureBranch.includes("attribution_incomplete") ||
      !ci.note.includes("Gate 3") || !ci.schemaFile.includes("Gate 3")) {
    fail("contract interface drift");
  }
  const fp = artifact.fingerprintConvention;
  if (!fp.contractFingerprint.includes("Gate 2") || !fp.executionFingerprint.includes("Gate 3") ||
      !fp.executionFingerprint.includes("no collapse")) fail("fingerprint convention drift");

  // ---- route block, fences, bounded non-accomplishments -------------------
  if (artifact.route.id !== "R2" || artifact.route.name !== "Filtered Cycle-Walk" ||
      artifact.route.predicate !== "P(s) = [forte(s) = '7-27']" ||
      !artifact.route.definition.includes("satellites(h)") ||
      !artifact.route.predicateForm.includes("single-hop")) fail("route block drift");
  if (artifact.fences.governsVerdicts.includes("none") === false ||
      artifact.fences.recordAmendment.includes("claim event") === false ||
      artifact.fences.routeAdmission.includes("claim_admitted") === false ||
      artifact.fences.derivationExecution.includes("none") === false ||
      artifact.fences.calibration.includes("mechanism only") === false ||
      artifact.fences.wall.includes("untouched") === false ||
      artifact.fences.g1Intra330 !== "untouched" ||
      artifact.fences.direction.includes("unassigned") === false ||
      artifact.fences.membrane.includes("never design input") === false ||
      artifact.fences.frozenStack.includes("read-only") === false) fail("fence drift");
  if (artifact.notAccomplished.length !== 6) fail("notAccomplished inventory drift");

  console.log(JSON.stringify({
    artifact: ARTIFACT_PATH,
    status: "PASS",
    contractFingerprint,
    engine: ENGINE_PATH,
    g1AllPass: artifact.gates.G1.allPass,
    g2Pass: artifact.gates.G2.pass,
    g3Generated: artifact.gates.G3.generatedCount,
    g4Pass: artifact.gates.G4.pass,
    g5: { realized: artifact.gates.G5.realized, exact: artifact.gates.G5.exact, unverified: artifact.gates.G5.unverified },
    calibration: { verdict: calibration.verdict, fixtureKeys: calibration.fixtureKeys.length },
    frozenClosureDigest: FROZEN_IMPLEMENTATION_DIGEST,
    noHardcodedSatelliteIds: true,
    constraintSatisfaction: expectedSatisfaction,
  }, null, 2));
}

validate();
