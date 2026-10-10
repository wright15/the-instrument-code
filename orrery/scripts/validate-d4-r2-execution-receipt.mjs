#!/usr/bin/env node
/**
 * Validate the BL-057 Gate 3 D4 R2 derivation execution receipt
 * (qa/d4-r2-execution-receipt.json) against its sources.
 *
 * Independent of the execution runner and of the contract engine: re-reads the
 * six pinned primaries, the frozen receipt and generation, the canonical
 * ledger and network, the BL-055 selection review, the Phase C probe and the
 * Gate 2 contract artifact; re-extracts R/E from the canonical network with
 * its own predicate read; re-derives the cycle edges, the seam pairs, the
 * identity-phase calibration, the registered R2 execution, the seam-phase
 * contexts and the criteria C1-C4, the D7 analogue, the hashes, the ledger
 * fence and the two-fingerprint convention; re-checks the receipt against its
 * authored schema shape; and asserts the no-collapse semantics (evidence, not
 * amendment). Fail-loud.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..", "..");

const RECEIPT_PATH = "qa/d4-r2-execution-receipt.json";
const SCHEMA_PATH = "schemas/d4-r2-execution-receipt.schema.json";
const CONTRACT_ARTIFACT_PATH = "orrery/src/generated/d4-r2-contract.v1.json";
const BL057_MEMO_PATH = "scrum/plan/bl-057-d4-amendment-spec.md";
const FROZEN_RECEIPT_PATH = "qa/d4-production-receipt.json";
const FROZEN_GENERATION_PATH = "qa/d4-production-generation.json";
const HEPTATONIC_LEDGER_PATH = "canonical/universal-heptatonic-ledger.csv";
const HEPTATONIC_NETWORK_PATH = "canonical/universal-network-data.json";
const SELECTION_REVIEW_PATH = "orrery/src/generated/d4-selection-review.v1.json";
const PHASE_C_PROBE_PATH = "orrery/src/generated/phase-c-probe.v1.json";
const DECISION_LEDGER_PATH = "provenance/DECISION_LEDGER.md";
const ENGINE_PATH = "scripts/d4-r2-contract.mjs";
const CONTRACT_GENERATOR_PATH = "scripts/build-d4-r2-contract.mjs";
const CONTRACT_VALIDATOR_PATH = "orrery/scripts/validate-d4-r2-contract.mjs";
const CONTRACT_PINS_PATH = "orrery/src/d4-r2-contract.test.ts";
const CONTRACT_FINGERPRINT = "5528510b495f12fa11ab713d8ee357e3798f728204eacd83ad491aafb8fdc7d5";
const SELECTION_REVIEW_FINGERPRINT = "6d11fd932efbe96892b3cf2e6a6cdad6f54e69cd2a8f284ebb72232c59d8b745";
const PHASE_C_FINGERPRINT = "5085e27404de2e591b146d38f289da660c6bc49041a54f073acafcbfe10f2f49";
const FROZEN_IMPLEMENTATION_DIGEST = "7ab950fac561016afc816e8b6947f7ce0b5f25573f1472321054ddbc9c1e097f";
const DECISION_LEDGER_SHA256 = "8b7084bc7c55bd53a060434fbcaef1d0c7f4eb572079a01d3c1f3f05db4f2362";
const ENTRY10_SHA256 = "201efe8193e1967cb91bb07b4876c906be5ba71a23bf4735be6d18a7df69f7a7";
const PATCH = [11, 0, 1];
const STATUS_TOKENS = ["execution_verified", "attribution_incomplete"];

function fail(message) {
  throw new Error(`INVALID_D4_R2_EXECUTION_RECEIPT: ${message}`);
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
    if (!Number.isInteger(value)) fail("non-integer number in receipt payload");
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
const midZ7 = (a, b) => (4n * (BigInt(a) + BigInt(b))) % 7n;
function canonicalMidpointKey(a, b, mid) {
  const low = cmp(a, b) <= 0 ? a : b;
  const high = cmp(a, b) <= 0 ? b : a;
  return `A0:${low}:${high}:${mid}`;
}
const translateSet = (pitches, offset) => pitches.map((pitch) => (pitch + offset) % 12);
const sortedKey = (pitches) => [...pitches].sort((left, right) => left - right).join(",");
const setKey = (pitches, phase) => sortedKey(translateSet(pitches, phase));
const liftKey = (key, phase) => key.split(":").map((part) => `${part}@${phase}`).join(":");

function accounting(generatedKeys, uKeys, observedKeys) {
  const G = unique(generatedKeys);
  const U = unique(uKeys);
  const O = unique(observedKeys);
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

function fourCells(keysA, keysB, observedKeys) {
  const aSet = new Set(keysA);
  const bSet = new Set(keysB);
  const cells = { aOnly: 0, bOnly: 0, both: 0, neither: 0 };
  for (const key of unique(observedKeys)) {
    if (aSet.has(key)) cells[bSet.has(key) ? "both" : "aOnly"] += 1;
    else cells[bSet.has(key) ? "bOnly" : "neither"] += 1;
  }
  return cells;
}

function compareAccounting(actual, expected, label) {
  for (const field of ["generatedKeyCount", "inRCount", "extraBeyondRCount", "rMissedCount",
    "inRButUnmatchedCount", "matchedObservedCount", "missedObservedCount", "restatementSignature"]) {
    if (actual[field] !== expected[field]) fail(`${label}: ${field} ${actual[field]} != recomputed ${expected[field]}`);
  }
}

function validate() {
  const receiptBytes = read(RECEIPT_PATH);
  const receipt = JSON.parse(receiptBytes);
  if (receiptBytes !== `${canonicalText(receipt)}\n`) fail("receipt is not byte-stable canonical serialization");

  // ---- schema-shape conformance (authored at Gate 3) -----------------------
  const schema = readJson(SCHEMA_PATH);
  for (const required of schema.required) {
    if (!(required in receipt)) fail(`schema-required field missing: ${required}`);
  }
  if (receipt.schemaVersion !== "d4-r2-execution-receipt.v1" || receipt.routeId !== "R2" ||
      receipt.workItem !== "BL-057") fail("receipt header drift");
  if (!STATUS_TOKENS.includes(receipt.status)) fail(`illegal status token ${receipt.status}`);
  if (receipt.naming.workItem !== "BL-057" || !receipt.naming.note.includes("BL-031 is the topology/lattice track")) {
    fail("naming-drift note drift");
  }

  // ---- two-fingerprint convention ------------------------------------------
  const { executionFingerprint, ...core } = receipt;
  if (sha256(canonicalText(core)) !== executionFingerprint) fail("executionFingerprint drift");
  if (!/^[0-9a-f]{64}$/.test(receipt.implementationDigest) ||
      !/^[0-9a-f]{64}$/.test(receipt.gate2ContractFingerprint)) fail("fingerprint format drift");
  if (receipt.gate2ContractFingerprint !== CONTRACT_FINGERPRINT) fail("Gate 2 contract fingerprint drift");

  // ---- Gate 2 preconditions and no-collapse ---------------------------------
  const contractArtifact = readJson(CONTRACT_ARTIFACT_PATH);
  if (contractArtifact.status !== "implementation_evidence") fail("Gate 2 artifact status drift");
  const { contractFingerprint, ...contractCore } = contractArtifact;
  if (sha256(canonicalText(contractCore)) !== contractFingerprint ||
      contractFingerprint !== CONTRACT_FINGERPRINT) fail("Gate 2 artifact fingerprint drift");
  if (!read(BL057_MEMO_PATH).includes("**Status:** `claim_admitted`")) fail("BL-057 memo precondition drift");

  // ---- implementation file set ---------------------------------------------
  const implementationDigest = sha256(canonicalText(receipt.implementationFiles));
  if (implementationDigest !== receipt.implementationDigest) fail("implementationDigest drift");
  const implementationPaths = receipt.implementationFiles.map((file) => file.path);
  if (canonicalText(implementationPaths) !== canonicalText([
    CONTRACT_VALIDATOR_PATH, CONTRACT_PINS_PATH, CONTRACT_ARTIFACT_PATH,
    CONTRACT_GENERATOR_PATH, ENGINE_PATH,
  ].sort(cmp))) fail("implementation file set drift");
  for (const file of receipt.implementationFiles) {
    if (fileSha(file.path) !== file.sha256) fail(`implementation file drift: ${file.path}`);
  }

  // ---- input primaries ------------------------------------------------------
  if (receipt.inputHashes.length !== 6 || contractArtifact.sourceBindings.length !== 6) fail("input census drift");
  for (let index = 0; index < 6; index += 1) {
    const input = receipt.inputHashes[index];
    const binding = contractArtifact.sourceBindings[index];
    if (input.artifact !== binding.artifact || input.role !== binding.role || input.sha256 !== binding.sha256) {
      fail(`input binding mismatch at ${input.artifact}`);
    }
    if (fileSha(input.artifact) !== input.sha256) fail(`input drift: ${input.artifact}`);
  }

  // ---- frozen record sources -------------------------------------------------
  const frozen = readJson(FROZEN_RECEIPT_PATH);
  const generation = readJson(FROZEN_GENERATION_PATH);
  const ledgerRows = parseCsv(read(HEPTATONIC_LEDGER_PATH));
  const network = readJson(HEPTATONIC_NETWORK_PATH);
  const selectionReview = readJson(SELECTION_REVIEW_PATH);
  const phaseC = readJson(PHASE_C_PROBE_PATH);
  if (ledgerRows.length !== 462) fail("ledger census drift");
  if (frozen.category !== "not_derived") fail("frozen category drift");
  if (frozen.bindings.implementationDigest !== FROZEN_IMPLEMENTATION_DIGEST) fail("frozen closure digest drift");
  if (selectionReview.reviewFingerprint !== SELECTION_REVIEW_FINGERPRINT) fail("BL-055 fingerprint drift");
  if (phaseC.probeFingerprint !== PHASE_C_FINGERPRINT) fail("Phase C fingerprint drift");
  const ledgerById = new Map(ledgerRows.map((row) => [row.id, row]));
  const records = ledgerRows.map((row) => ({
    id: Number(row.id),
    forte: row.forte,
    role: row.role,
    tier: row.tier,
    officeIndex: row.officeIndex === "" ? null : Number(row.officeIndex),
    pitches: row.pitchSet.replace(/[{}]/g, "").split(",").map((value) => Number(value)),
  }));
  const recordById = new Map(records.map((record) => [String(record.id), record]));

  // independent R/E re-extraction from the canonical network
  const R = [];
  const E = [];
  for (const edge of network.structuralEdges) {
    const parent = recordById.get(String(edge.source));
    const child = recordById.get(String(edge.target));
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
  if (R.length !== 28 || E.length !== 14) fail("R/E re-extraction census drift");
  const U = unique(frozen.comparison.uKeys);
  const O = unique(frozen.comparison.rows.map((row) => keyOf(String(row.parentOffice), String(row.s))));
  if (U.length !== 28 || O.length !== 14) fail("frozen domain census drift");
  if (canonicalText(unique(R.map((edge) => keyOf(edge.parentOffice, edge.target)))) !==
      canonicalText(unique(generation.projection.R.map((edge) => keyOf(String(edge.parentOffice), String(edge.target)))))) {
    fail("canonical R re-extraction disagrees with the frozen projection");
  }

  // ---- calibration re-derivation ---------------------------------------------
  const a0Anchors = records.filter((record) => record.tier === "A0" && record.role === "anchor")
    .map((record) => ({ id: String(record.id), officeIndex: Number(record.officeIndex) }))
    .sort((left, right) => cmp(left.id, right.id));
  if (a0Anchors.length !== 7) fail("A0 anchor census drift");
  const calibrationKeys = [];
  for (const a of a0Anchors) {
    for (const b of a0Anchors) {
      if (a.id === b.id) continue;
      if (rotateMaskZ12(Number(a.id)) !== Number(b.id)) continue;
      for (let office = 0; office < 7; office += 1) {
        if (a.officeIndex !== (office + 1) % 7) continue;
        if (b.officeIndex !== (office + 6) % 7) continue;
        for (const r of R) {
          if (Number(r.parentOffice) !== office) continue;
          calibrationKeys.push(keyOf(String(office), r.target));
        }
      }
    }
  }
  const calibrationKeysUnique = unique(calibrationKeys);
  if (canonicalText(calibrationKeysUnique) !== canonicalText(receipt.calibration.routeA.keys)) {
    fail("calibration routeA keys do not re-derive");
  }
  const calibrationA = accounting(calibrationKeysUnique, U, O);
  const calibrationB = accounting(unique(R.map((edge) => keyOf(edge.parentOffice, edge.target))), U, O);
  compareAccounting(receipt.calibration.routeA.accounting, calibrationA, "calibration routeA");
  compareAccounting(receipt.calibration.routeB.accounting, calibrationB, "calibration routeB");
  const calibrationCells = fourCells(calibrationKeysUnique, unique(R.map((edge) => keyOf(edge.parentOffice, edge.target))), O);
  if (canonicalText(receipt.calibration.fourCellCounts) !== canonicalText(calibrationCells)) {
    fail("calibration four cells do not re-derive");
  }
  if (calibrationA.generatedKeyCount !== 8 || calibrationA.matchedObservedCount !== 4 ||
      calibrationA.inRButUnmatchedCount !== 4 || calibrationA.missedObservedCount !== 10 ||
      calibrationCells.aOnly !== 0 || calibrationCells.bOnly !== 10 || calibrationCells.both !== 4 || calibrationCells.neither !== 0) {
    fail("calibration does not reproduce the frozen pattern");
  }
  const anchoredRelations = [];
  for (const a of a0Anchors) {
    for (const b of a0Anchors) {
      if (a.id === b.id) continue;
      if (rotateMaskZ12(Number(a.id)) !== Number(b.id)) continue;
      anchoredRelations.push(canonicalMidpointKey(a.id, b.id, String(midZ7(a.officeIndex, b.officeIndex))));
    }
  }
  const observedRelations = unique(frozen.comparison.tC.observedRelations.map(
    (relation) => canonicalMidpointKey(String(relation.a), String(relation.b), String(relation.mid))));
  if (canonicalText(unique(anchoredRelations)) !== canonicalText(unique(frozen.comparison.tC.matches))) {
    fail("calibration T-C relations do not reproduce the frozen matches");
  }
  if (!receipt.calibration.pass || receipt.calibration.verdict !== "EXACT") fail("calibration verdict drift");
  for (const entry of receipt.calibration.perPhase) {
    if (entry.identicalToFrozen !== true) fail(`calibration perPhase ${entry.phase} not identical to frozen`);
    const liftedA = calibrationKeysUnique.map((key) => liftKey(key, entry.phase));
    const liftedO = O.map((key) => liftKey(key, entry.phase));
    const liftedU = U.map((key) => liftKey(key, entry.phase));
    compareAccounting(entry.routeA, accounting(liftedA, liftedU, liftedO), `calibration phase ${entry.phase} routeA`);
    if (entry.fourCellCounts.aOnly !== 0 || entry.fourCellCounts.bOnly !== 10 ||
        entry.fourCellCounts.both !== 4 || entry.fourCellCounts.neither !== 0) {
      fail(`calibration phase ${entry.phase} cells drift`);
    }
  }

  // ---- cycle edges and seam pairs (independent re-derivation) ----------------
  const pitchById = new Map(records.map((record) => [String(record.id), record.pitches]));
  const a0WithPitches = a0Anchors.map((anchor) => ({ ...anchor, pitches: pitchById.get(anchor.id) }));
  const derivedPairs = [];
  for (const a of a0WithPitches) {
    for (const c of a0WithPitches) {
      if (a.id === c.id) continue;
      const k = (a.officeIndex + 6) % 7;
      if (((c.officeIndex + 0) % 7) !== (k + 6) % 7) continue;
      for (const qa of PATCH) {
        for (const qc of PATCH) {
          if (setKey(a.pitches, qa) !== setKey(c.pitches, qc)) continue;
          derivedPairs.push({ office: String(k), a: a.id, aPhase: String(qa), c: c.id, cPhase: String(qc) });
        }
      }
    }
  }
  if (derivedPairs.length !== 9) fail(`seam pair re-derivation census ${derivedPairs.length}`);
  const cycleEdgesByOffice = new Map();
  for (const pair of derivedPairs) {
    const d = (Number(pair.aPhase) - Number(pair.cPhase) + 12) % 12;
    const edge = { office: pair.office, a: pair.a, b: pair.c, d, aPhase: pair.aPhase, bPhase: pair.cPhase };
    const existing = cycleEdgesByOffice.get(edge.office);
    if (existing && (existing.a !== edge.a || existing.b !== edge.b || existing.d !== edge.d)) {
      fail(`non-uniform edge at office ${edge.office}`);
    }
    if (!existing) cycleEdgesByOffice.set(edge.office, edge);
  }
  if (cycleEdgesByOffice.size !== 7) fail("cycle edge re-derivation census drift");
  const cycleEdges = [...cycleEdgesByOffice.values()].sort((left, right) => cmp(left.office, right.office));

  // ---- registered R2 execution re-derivation ---------------------------------
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
  const generatedWitnesses = [];
  const gate1 = { holds: true, perOfficeCounts: [], totalSelected: 0 };
  for (const office of unique(R.map((edge) => edge.parentOffice))) {
    const h = a1AnchorOfOffice.get(office);
    const edge = cycleEdges.find((row) => row.office === office);
    const parents = unique(eParentsOf.get(h) ?? []);
    if (canonicalText(unique([edge.a, edge.b])) !== canonicalText(parents)) fail(`E-parent/cycle mismatch at office ${office}`);
    const holds = rotatePow(Number(edge.a), edge.d) === Number(edge.b);
    if (!holds) gate1.holds = false;
    const satellites = unique(satellitesOfAnchor.get(h) ?? []);
    const selected = satellites.filter((satellite) => ledgerById.get(satellite).forte === "7-27");
    gate1.perOfficeCounts.push({ office, count: selected.length });
    gate1.totalSelected += selected.length;
    for (const satellite of selected) {
      generatedWitnesses.push({
        tag: "r2_filtered_cycle_walk", a: edge.a, b: edge.b, d: edge.d,
        h, s: satellite, parentOffice: office,
      });
    }
  }
  generatedWitnesses.sort((left, right) => cmp(left.parentOffice, right.parentOffice) || cmp(left.s, right.s));
  const generatedKeys = unique(generatedWitnesses.map((witness) => keyOf(witness.parentOffice, witness.s)));
  if (canonicalText(generatedKeys) !== canonicalText(receipt.routeExecution.contacts.generatedKeys) ||
      canonicalText(generatedKeys) !== canonicalText(O)) fail("R2 execution output drift");
  if (receipt.routeExecution.contacts.witnessCount !== 14) fail("witness census drift");
  if (sha256(canonicalText(generatedWitnesses)) !== receipt.outputHashes.witnessesDigest) fail("witnessesDigest drift");
  if (sha256(canonicalText(generatedKeys)) !== receipt.outputHashes.generatedKeysDigest) fail("generatedKeysDigest drift");
  if (sha256(canonicalText(calibrationKeysUnique)) !== receipt.outputHashes.calibrationKeysDigest) fail("calibrationKeysDigest drift");

  const midpointEntries = cycleEdges.map((edge) => {
    const officeA = a0Anchors.find((anchor) => anchor.id === edge.a).officeIndex;
    const officeB = a0Anchors.find((anchor) => anchor.id === edge.b).officeIndex;
    const mid = String(midZ7(officeA, officeB));
    if (mid !== edge.office) fail(`midpoint invariant violation at office ${edge.office}`);
    return canonicalMidpointKey(edge.a, edge.b, mid);
  });
  const realizedRelations = unique(midpointEntries);
  if (sha256(canonicalText(realizedRelations)) !== receipt.outputHashes.realizedRelationKeysDigest) {
    fail("realizedRelationKeysDigest drift");
  }
  const frozenMatchSet = new Set(unique(frozen.comparison.tC.matches));
  const exactCount = realizedRelations.filter((key) => frozenMatchSet.has(key)).length;
  const gates = {
    G1: gate1.holds,
    G2: gate1.perOfficeCounts.every((row) => row.count === 2) && gate1.totalSelected === 14,
    G3: generatedKeys.length === O.length && O.every((key) => generatedKeys.includes(key)) &&
      generatedKeys.every((key) => O.includes(key)),
    G4: generatedKeys.every((key) => U.includes(key)) && generatedKeys.length === 14 && U.length === 28,
    G5: realizedRelations.length === 7 && exactCount === 2 && realizedRelations.length - exactCount === 5,
  };
  for (const gate of ["G1", "G2", "G3", "G4", "G5"]) {
    if (receipt.gates[gate] !== gates[gate]) fail(`${gate} drift`);
    if (gates[gate] !== true) fail(`${gate} not green in the re-derivation`);
  }
  if (receipt.gateDetail.G3.generatedCount !== 14 || receipt.gateDetail.G4.generatedCount !== 14 ||
      receipt.gateDetail.G4.uKeyCount !== 28 || receipt.gateDetail.G5.realized !== 7 ||
      receipt.gateDetail.G5.exact !== 2 || receipt.gateDetail.G5.unverified !== 5) {
    fail("gate detail drift");
  }

  // ---- seam-phase derivation re-evaluation ------------------------------------
  const tCBase = {
    realized: 7, observationExact: 2, seamDerivedPredictions: 5,
    generatedRelations: realizedRelations,
    observedRelations,
    missing: observedRelations.filter((key) => !realizedRelations.includes(key)),
    extra: realizedRelations.filter((key) => !observedRelations.includes(key)),
    strictEquality: false,
    realizationOfObserved: phaseC.e2Retry.routeC.seam.realizationOfObserved === true,
    holds: phaseC.e2Retry.routeC.seam.realizationOfObserved === true && observedRelations.every((key) => realizedRelations.includes(key)),
    cStrict: false,
  };
  const selectedByOffice = new Map();
  for (const witness of generatedWitnesses) {
    selectedByOffice.set(witness.parentOffice, [...(selectedByOffice.get(witness.parentOffice) ?? []), keyOf(witness.parentOffice, witness.s)]);
  }
  const allSelected = unique([...selectedByOffice.values()].flat());
  const contexts = receipt.seamDerivation.contexts;
  if (contexts.length !== 5) fail("context census drift");
  const contextById = new Map(contexts.map((context) => [context.id, context]));
  for (const phase of PATCH) {
    const context = contextById.get(`phase-${phase}`);
    if (!context || !context.licensed || context.kind !== "same-phase") fail(`missing phase-${phase} context`);
    const liftedA = allSelected.map((key) => liftKey(key, phase));
    const liftedB = U.map((key) => liftKey(key, phase));
    compareAccounting(context.routeA, accounting(liftedA, U.map((key) => liftKey(key, phase)), O.map((key) => liftKey(key, phase))), `phase-${phase} routeA`);
    compareAccounting(context.routeB, accounting(liftedB, U.map((key) => liftKey(key, phase)), O.map((key) => liftKey(key, phase))), `phase-${phase} routeB`);
    if (context.routeA.inRButUnmatchedCount !== 0 || context.routeA.restatementSignature !== false) {
      fail(`phase-${phase}: R2 must be selective with zero unmatched`);
    }
    if (context.fourCellCounts.aOnly !== 0 || context.fourCellCounts.bOnly !== 0 ||
        context.fourCellCounts.both !== 14 || context.fourCellCounts.neither !== 0) fail(`phase-${phase} cells drift`);
    if (context.criteria.C1.holds !== true || context.disposition !== `derived@phase-${phase}`) {
      fail(`phase-${phase} C1/disposition drift`);
    }
  }
  const seamContext = contextById.get("seam-familyA");
  if (!seamContext || !seamContext.licensed || seamContext.kind !== "seam") fail("missing seam context");
  if (seamContext.criteria.C1.holds !== true || seamContext.disposition !== "derived@seam-familyA") {
    fail("seam context C1/disposition drift");
  }
  if (seamContext.carriedEndpointRealizations.length !== 0) fail("seam carried E-endpoint realizations not absent");
  const seamProvenanceOffices = unique(seamContext.phaseProvenance.map((entry) => entry.office));
  if (canonicalText(seamProvenanceOffices) !== canonicalText(["0", "1", "2", "3", "4", "5", "6"])) {
    fail("seam phase provenance office census drift");
  }
  const strictContext = contextById.get("strict-degree-control");
  if (!strictContext || strictContext.licensed || strictContext.control !== true) fail("missing strict control context");
  if (strictContext.routeA.generatedKeyCount !== 4 || strictContext.routeA.missedObservedCount !== 10 ||
      strictContext.disposition !== "not_derived@strict-degree-control") fail("strict control drift");
  if (strictContext.fourCellCounts.aOnly !== 0 || strictContext.fourCellCounts.bOnly !== 10 ||
      strictContext.fourCellCounts.both !== 4 || strictContext.fourCellCounts.neither !== 0) {
    fail("strict control does not reproduce the frozen cells");
  }
  for (const context of contexts.filter((entry) => entry.licensed)) {
    if (context.routeB.restatementSignature !== true) fail(`construction join must restate U at ${context.id}`);
    if (context.criteria.C2.R2_restates !== false) fail(`C2 R2 guard drift at ${context.id}`);
    if (context.criteria.C4.valid !== true || context.criteria.C4.cross_phase_containment_used !== false ||
        context.criteria.C4.beyond_lifted_R_keys !== 0) fail(`C4 drift at ${context.id}`);
  }

  const classification = receipt.seamDerivation.branchClassification;
  if (classification.branch !== "DERIVED@X" || classification.gate4.opens !== true ||
      canonicalText(classification.derivedContexts) !== canonicalText(["phase-11", "phase-0", "phase-1", "seam-familyA"])) {
    fail("branch classification drift");
  }
  if (receipt.status !== (classification.branch === "DERIVED@X" ? "execution_verified" : "attribution_incomplete")) {
    fail("status/branch inconsistency");
  }
  if (receipt.passFail !== (receipt.status === "execution_verified")) fail("passFail/status inconsistency");

  // ---- D7 analogue re-derivation ---------------------------------------------
  const d7Anchors = network.d7AnchorRows.map((row) => ({
    id: String(row.scaleId), office: String(row.officeIndex),
    pitches: row.pitchSet.replace(/[{}]/g, "").split(",").map((value) => Number(value)),
  }));
  const d7Contacts = network.d7SeatContactRows.map((row) => ({ s: String(row.source), d: String(row.target) }));
  const d7Modal = network.d7ModalRows.map((row) => ({ source: String(row.source), target: String(row.target) }));
  const d7AnchorById = new Map(d7Anchors.map((anchor) => [anchor.id, anchor]));
  const analogueR = d7Contacts.map((contact) => ({
    parent: contact.d, target: contact.s, parentOffice: d7AnchorById.get(contact.d).office,
  }));
  const d7U = unique(analogueR.map((edge) => keyOf(edge.parentOffice, edge.target)));
  const d7O = unique(d7Contacts.map((contact) => keyOf(d7AnchorById.get(contact.d).office, contact.s)));
  if (canonicalText(d7U) !== canonicalText(d7O) || d7U.length !== 14) fail("D7 analogue U/O drift");
  const d7Successor = new Map(d7Modal.map((row) => [row.source, row.target]));
  let currentD7 = "127";
  let orbitCloses = false;
  for (let step = 0; step < 7; step += 1) {
    const next = d7Successor.get(currentD7);
    if (!next) fail(`D7 orbit dead-ends at ${currentD7}`);
    currentD7 = next;
  }
  orbitCloses = currentD7 === "127";
  if (!orbitCloses) fail("D7 orbit does not close");
  const d7TwinVerified = d7Anchors.filter((anchor) => {
    const successor = d7Successor.get(anchor.id);
    if (!successor) return false;
    const maskA = anchor.pitches.reduce((mask, pitch) => mask | (1 << pitch), 0);
    const maskB = d7AnchorById.get(successor).pitches.reduce((mask, pitch) => mask | (1 << pitch), 0);
    let value = maskA;
    for (let d = 1; d <= 12; d += 1) {
      value = rotateMaskZ12(value);
      if (value === maskB) return d === 1 || d === 2;
    }
    return false;
  }).length;
  const d7Literal = analogueR.filter((edge) => recordById.get(edge.target).forte === "7-27");
  const d7Class = analogueR.filter((edge) => recordById.get(edge.target).forte === "7-2");
  if (receipt.d7Analogue.label !== "hypothesis-analogue") fail("D7 label drift");
  if (!receipt.d7Analogue.claimEvent.startsWith("none")) fail("D7 claim-event drift");
  if (receipt.d7Analogue.literalPredicate.selectedKeyCount !== d7Literal.length ||
      receipt.d7Analogue.domainClassPredicate.selectedKeyCount !== d7Class.length) fail("D7 selection drift");
  if (receipt.d7Analogue.cycleTwinVerification.verified !== d7TwinVerified) fail("D7 cycle-twin drift");
  if (receipt.d7Analogue.domainClassPredicate.accounting.restatementSignature !== true) {
    fail("D7 class-predicate restatement drift");
  }
  if (receipt.d7Analogue.construction.selectionGap !== 0) fail("D7 selection gap drift");

  // ---- ledger fence -----------------------------------------------------------
  const ledgerText = read(DECISION_LEDGER_PATH);
  const liveLedgerSha = sha256(ledgerText);
  const liveEntry10 = sha256(ledgerText.split("\n").slice(2194, 2252).join("\n"));
  if (receipt.recordFence.decisionLedgerSha256 !== DECISION_LEDGER_SHA256) fail("recorded ledger sha drift");
  if (receipt.recordFence.entry10Sha256 !== ENTRY10_SHA256) fail("recorded ENTRY 10 sha drift");
  if (liveEntry10 !== ENTRY10_SHA256) fail("live ENTRY 10 region drift: the frozen D4 record changed");
  if (receipt.recordFence.entry10Span !== "2195-2252") fail("ENTRY 10 span drift");
  if (!receipt.recordFence.d4RegisteredCategory.includes("not_derived")) fail("D4 category fence drift");
  const ledgerNote = liveLedgerSha === DECISION_LEDGER_SHA256
    ? "ledger byte-identical to the execution-time state"
    : "ledger differs from execution-time state (additive post-execution amendment; ENTRY 10 region unchanged)";

  // ---- interface conformance ---------------------------------------------------
  for (const field of ["schemaVersion", "routeId", "status", "executionTimestamp", "implementationDigest",
    "inputHashes", "outputHashes", "gates", "passFail"]) {
    if (!(field in receipt)) fail(`documented interface field missing: ${field}`);
  }
  if (!receipt.executionTimestamp.endsWith("Z") || !receipt.runCompletedAt.endsWith("Z")) {
    fail("timestamp format drift");
  }

  console.log(JSON.stringify({
    receipt: RECEIPT_PATH,
    status: "PASS",
    executionStatus: receipt.status,
    branch: classification.branch,
    executionFingerprint,
    implementationDigest,
    calibration: receipt.calibration.verdict,
    gates,
    derivedContexts: classification.derivedContexts,
    d7: {
      label: receipt.d7Analogue.label,
      literalSelected: receipt.d7Analogue.literalPredicate.selectedKeyCount,
      classSelected: receipt.d7Analogue.domainClassPredicate.selectedKeyCount,
      cycleTwinVerified: receipt.d7Analogue.cycleTwinVerification.verified,
    },
    ledgerNote,
  }, null, 2));
}

validate();
