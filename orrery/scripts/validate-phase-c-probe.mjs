#!/usr/bin/env node
/**
 * Validate the generated BL-033 Phase C probe against its sources.
 *
 * Independent of the builder: re-reads the canonical heptatonic ledger, the
 * network data, the mutation-algebra application audit, the Phase A probe and
 * the frozen D4 receipt; re-extracts the D4 projection and observations;
 * re-runs the anchored routes and the calibration; re-derives the seam keying
 * (free-context and strict-degree controls); re-checks the frozen Outcome
 * Contract application; re-derives the D7 analogue mirror and the 12-phase
 * wall census; and re-checks the fingerprint. Fail-loud.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..", "..");

const ARTIFACT_PATH = "orrery/src/generated/phase-c-probe.v1.json";
const SCHEMA_VERSION = "harmonic-orrery.phase-c-probe.v1";
const PROBE_ID = "BL033_PHASE_C_PROBE_v1";
const HEPTATONIC_NETWORK_PATH = "canonical/universal-network-data.json";
const HEPTATONIC_LEDGER_PATH = "canonical/universal-heptatonic-ledger.csv";
const APPLICATIONS_PATH = "seven-governors-mutation-algebra-audit/audit/operator-applications.csv";
const PHASE_A_PROBE_PATH = "orrery/src/generated/phase-a-probe.v1.json";
const FROZEN_RECEIPT_PATH = "qa/d4-production-receipt.json";
const PHASE_A_FINGERPRINT = "c8271c20a7aaf23c8f25fbe12d849854eb02ffbfd6fa24fb3f091b15970b87ac";
const PATCH = [11, 0, 1];
const ALL_PHASES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

function fail(message) {
  throw new Error(`INVALID_PHASE_C_PROBE: ${message}`);
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
    if (!Number.isInteger(value)) fail("non-integer number in probe payload");
    return String(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalText).join(",")}]`;
  if (typeof value === "object") {
    const keys = Object.keys(value).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${canonicalText(value[key])}`).join(",")}}`;
  }
  fail(`unsupported JSON type: ${typeof value}`);
}

const sortedKey = (pitches) => [...pitches].sort((left, right) => left - right).join(",");
const translate = (pitches, offset) => pitches.map((pitch) => (pitch + offset) % 12);
const keyOf = (office, satellite) => `${office}:${satellite}`;
const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const unique = (values) => [...new Set(values)].sort(cmp);
const maskOf = (pitches) => pitches.reduce((mask, pitch) => mask | (1 << pitch), 0);
const rotate = (mask) => ((mask << 1) & 4095) | (mask >> 11);
const officeOf = (record) => (record.officeIndex === "" ? null : Number(record.officeIndex));

function setKey(pitches, phase) {
  return sortedKey(translate(pitches, phase));
}

function loadLedger() {
  return parseCsv(read(HEPTATONIC_LEDGER_PATH)).map((row) => ({
    id: Number(row.id),
    pitches: row.pitchSet.replace(/[{}]/g, "").split(",").map(Number).sort((a, b) => a - b),
    role: row.role,
    tier: row.tier,
    officeIndex: officeOf(row),
  }));
}

function accounting(generatedKeys, uKeys, observedKeys) {
  const G = unique(generatedKeys);
  const U = unique(uKeys);
  const O = unique(observedKeys);
  const inR = G.filter((key) => U.includes(key));
  const extra = G.filter((key) => !U.includes(key));
  const missed = U.filter((key) => !G.includes(key));
  const unmatched = inR.filter((key) => !O.includes(key));
  return {
    generatedKeyCount: G.length,
    inRCount: inR.length,
    extraBeyondRCount: extra.length,
    rMissedCount: missed.length,
    inRButUnmatchedCount: unmatched.length,
    matchedObservedCount: O.filter((key) => G.includes(key)).length,
    missedObservedCount: O.filter((key) => !G.includes(key)).length,
    restatementSignature: G.length === U.length && extra.length === 0 && missed.length === 0,
    generatedKeys: G,
  };
}

function validate() {
  const artifact = readJson(ARTIFACT_PATH);
  const records = loadLedger();
  const network = readJson(HEPTATONIC_NETWORK_PATH);
  const applications = parseCsv(read(APPLICATIONS_PATH));
  const phaseA = readJson(PHASE_A_PROBE_PATH);
  const frozen = readJson(FROZEN_RECEIPT_PATH);

  // ---- header, status, fingerprint ----------------------------------------
  if (artifact.schemaVersion !== SCHEMA_VERSION || artifact.probeId !== PROBE_ID ||
      artifact.status !== "planning_evidence") fail("header drift");
  const { probeFingerprint, ...core } = artifact;
  if (typeof probeFingerprint !== "string" || !/^[0-9a-f]{64}$/.test(probeFingerprint) ||
      sha256(canonicalText(core)) !== probeFingerprint) fail("fingerprint drift");
  if (phaseA.probeFingerprint !== PHASE_A_FINGERPRINT) fail("Phase A fingerprint drift");
  if (frozen.category !== "not_derived") fail("frozen receipt category drift");
  if (applications.length !== 3402) fail("application universe drift");

  // ---- bindings ------------------------------------------------------------
  for (const binding of artifact.sourceBindings) {
    if (sha256(fs.readFileSync(path.join(root, binding.artifact))) !== binding.sha256) {
      fail(`source binding drift: ${binding.artifact}`);
    }
  }

  // ---- projection re-extraction -------------------------------------------
  const byId = new Map(records.map((record) => [String(record.id), record]));
  const anchors = records
    .filter((record) => record.role === "anchor" && ["A0", "A1"].includes(record.tier))
    .map((record) => ({ id: String(record.id), tier: record.tier, officeIndex: String(record.officeIndex) }));
  const R = [];
  const E = [];
  for (const edge of network.structuralEdges) {
    const parent = byId.get(String(edge.source));
    const child = byId.get(String(edge.target));
    if (!parent || !child) continue;
    if (edge.type === "GOVERNS" && parent.tier === "A1" && parent.role === "anchor" &&
        child.tier === "A1" && child.role === "satellite") {
      R.push({ id: edge.id, source: String(edge.source), target: String(edge.target),
        parentOffice: String(parent.officeIndex) });
    }
    if (edge.type === "CONSTRUCTS" && parent.tier === "A0" && child.tier === "A1") {
      E.push({ id: edge.id, source: String(edge.source), target: String(edge.target) });
    }
  }
  if (anchors.length !== 14 || R.length !== 28 || E.length !== 14) fail("projection census drift");
  const parents = new Map();
  for (const r of R) parents.set(r.target, [...(parents.get(r.target) ?? []), r]);
  const contacts = [];
  for (const edge of network.structuralEdges) {
    if (edge.type !== "SEAT_CONTACT") continue;
    const source = byId.get(String(edge.source));
    const target = byId.get(String(edge.target));
    if (!source || !target || target.tier !== "D4") continue;
    const group = parents.get(String(edge.source));
    if (!group || group.length !== 1) fail("contact parent drift");
    contacts.push({ d: String(edge.target), s: String(edge.source), h: group[0].source,
      parentOffice: group[0].parentOffice });
  }
  if (contacts.length !== 14) fail("contact census drift");
  const seams = [];
  const seamGroups = new Map();
  for (const edge of network.structuralEdges) {
    if (edge.type !== "CONSTRUCTS" || edge.provenance !== "phase-seam construction") continue;
    const source = byId.get(String(edge.source));
    const target = byId.get(String(edge.target));
    if (!source || !target || source.tier !== "A0" || target.tier !== "A1") continue;
    seamGroups.set(String(edge.target), [...(seamGroups.get(String(edge.target)) ?? []), String(edge.source)]);
  }
  for (const [targetH, group] of seamGroups) {
    if (group.length !== 2) fail("seam group drift");
    group.sort(cmp);
    seams.push({ targetH, parentA: group[0], parentB: group[1], parentOffice: String(byId.get(targetH).officeIndex) });
  }
  if (seams.length !== 2) fail("seam census drift");
  const U = unique(R.map((r) => keyOf(r.parentOffice, r.target)));
  const O = unique(contacts.map((c) => keyOf(c.parentOffice, c.s)));
  if (canonicalText(U) !== canonicalText(artifact.e2Retry.domain.uKeys) ||
      canonicalText(O) !== canonicalText(artifact.e2Retry.domain.observedKeys)) fail("domain drift");

  // ---- anchored routes and calibration ------------------------------------
  const a0 = anchors.filter((anchor) => anchor.tier === "A0").map((anchor) => ({
    id: Number(anchor.id), office: Number(anchor.officeIndex),
  }));
  const taKeys = [];
  for (const a of a0) {
    for (const b of a0) {
      for (const r of R) {
        for (let k = 0; k < 7; k += 1) {
          if (a.id !== b.id && a.office === (k + 1) % 7 && b.office === (k - 1 + 7) % 7 &&
              rotate(maskOf(byId.get(String(a.id)).pitches)) === b.id && Number(r.parentOffice) === k) {
            taKeys.push(keyOf(k, r.target));
          }
        }
      }
    }
  }
  const tbKeys = [];
  for (const e1 of E) {
    for (const e2 of E) {
      for (const r of R) {
        if (e1.id !== e2.id && e1.source !== e2.source && e1.target === r.source && e2.target === r.source) {
          tbKeys.push(keyOf(r.parentOffice, r.target));
        }
      }
    }
  }
  const anchoredA = accounting(taKeys, U, O);
  const anchoredB = accounting(tbKeys, U, O);
  if (anchoredA.generatedKeyCount !== 8 || anchoredA.inRButUnmatchedCount !== 4 ||
      anchoredA.missedObservedCount !== 10 || anchoredA.restatementSignature) fail("anchored T-A drift");
  if (anchoredB.generatedKeyCount !== 28 || !anchoredB.restatementSignature ||
      anchoredB.inRButUnmatchedCount !== 14) fail("anchored T-B drift");
  const cal = artifact.e2Retry.calibration;
  if (cal.verdict !== "EXACT") fail("calibration verdict drift");
  for (const entry of cal.perPhase) {
    if (!entry.identicalToFrozen || entry.routeA.generatedKeyCount !== 8 ||
        entry.routeA.inRButUnmatchedCount !== 4 || entry.routeB.generatedKeyCount !== 28 ||
        !entry.routeB.restatementSignature || entry.fourCellCounts.aOnly !== 0 ||
        entry.fourCellCounts.bOnly !== 10 || entry.fourCellCounts.both !== 4 ||
        entry.fourCellCounts.neither !== 0) fail("calibration per-phase drift");
  }
  const frozenCells = frozen.comparison.fourCellCounts;
  if (frozenCells.aOnly !== "0" || frozenCells.bOnly !== "10" ||
      frozenCells.both !== "4" || frozenCells.neither !== "0") fail("frozen cell drift");

  // ---- seam keying ---------------------------------------------------------
  const a0Pitches = new Map(a0.map((a) => [a.id, byId.get(String(a.id)).pitches]));
  const seamPairs = [];
  for (const a of a0) {
    for (const c of a0) {
      if (a.id === c.id) continue;
      const k = (a.office + 6) % 7;
      if (c.office !== (k + 6) % 7) continue;
      for (const qa of PATCH) {
        for (const qc of PATCH) {
          if (setKey(a0Pitches.get(a.id), qa) === setKey(a0Pitches.get(c.id), qc)) {
            seamPairs.push({ office: String(k), a: String(a.id), aPhase: String(qa),
              c: String(c.id), cPhase: String(qc) });
          }
        }
      }
    }
  }
  const offices = unique(seamPairs.map((pair) => pair.office));
  if (offices.length !== 7) fail(`seam qualifying office drift: ${offices.length}`);
  const seamA = accounting(R.filter((r) => offices.includes(r.parentOffice)).map((r) => keyOf(r.parentOffice, r.target)), U, O);
  if (!seamA.restatementSignature || seamA.missedObservedCount !== 0 || seamA.inRButUnmatchedCount !== 14) {
    fail("seam route accounting drift");
  }
  const artifactSeam = artifact.e2Retry.routeASeam;
  if (canonicalText(artifactSeam.qualifyingOffices) !== canonicalText(offices) ||
      canonicalText(artifactSeam.generatedKeys) !== canonicalText(seamA.generatedKeys)) fail("seam artifact drift");

  const strictPairs = seamPairs.filter((pair) =>
    (Number(pair.aPhase) - Number(pair.cPhase) + 12) % 12 === 1);
  const strictOffices = unique(strictPairs.map((pair) => pair.office));
  const strictA = accounting(R.filter((r) => strictOffices.includes(r.parentOffice)).map((r) => keyOf(r.parentOffice, r.target)), U, O);
  if (strictA.generatedKeyCount !== 8 || strictA.missedObservedCount !== 10 ||
      artifactSeam.strictDegreeControl.category !== "not_derived") fail("strict-degree control drift");

  // ---- contract -------------------------------------------------------------
  const tC = artifact.e2Retry.routeC;
  const observedRelationKeys = unique(seams.map((seam) =>
    `A0:${[Number(seam.parentA), Number(seam.parentB)].sort((l, r) => l - r).join(":")}:${seam.parentOffice}`));
  if (canonicalText(tC.seam.observedRelations) !== canonicalText(observedRelationKeys)) fail("observed seam relations drift");
  if (tC.seam.generatedRelations.length !== 7 || tC.seam.extra.length !== 5 ||
      tC.seam.missing.length !== 0 || tC.seam.midpointExactStrict !== false ||
      tC.seam.realizationOfObserved !== true) fail("T-C seam drift");
  if (tC.seam.strictDegree.generatedRelations.length !== 2 ||
      tC.seam.strictDegree.midpointExact !== true) fail("T-C strict drift");
  const contract = artifact.e2Retry.contract;
  if (contract.category !== "restatement_signature" || contract.restatementSignature !== true ||
      contract.midpointExact !== false || contract.covered !== true) fail("contract drift");
  if (contract.fourCellCounts.aOnly !== 0 || contract.fourCellCounts.bOnly !== 0 ||
      contract.fourCellCounts.both !== 14 || contract.fourCellCounts.neither !== 0) fail("contract cell drift");
  if (artifact.e2Retry.preRegisteredExpectation.held !== false ||
      artifact.e2Retry.preRegisteredExpectation.measured.gAEqualsU !== true) fail("expectation drift");

  // ---- E1 -------------------------------------------------------------------
  const d4Anchors = records.filter((record) => record.tier === "D4" && record.role === "anchor");
  if (d4Anchors.length !== 7 || artifact.e1Presence.verdict !== "PRESENT" ||
      artifact.e1Presence.anchors.length !== 7) fail("E1 drift");
  for (const anchor of artifact.e1Presence.anchors) {
    if (!anchor.phases["11"] || !anchor.phases["0"] || !anchor.phases["1"] ||
        anchor.seamIncidenceTotal < 1) fail(`E1 anchor drift: ${anchor.id}`);
  }

  // ---- E3 D7 mirror ----------------------------------------------------------
  const d7Anchors = network.d7AnchorRows.map((row) => ({
    id: Number(row.scaleId), office: row.officeIndex,
    pitches: row.pitchSet.replace(/[{}]/g, "").split(",").map(Number),
  }));
  const d7Contacts = network.d7SeatContactRows.map((row) => ({
    s: String(row.source), d: String(row.target),
  }));
  if (d7Anchors.length !== 7 || d7Contacts.length !== 14 || network.d7ModalRows.length !== 7) fail("D7 census drift");
  const analogueR = d7Contacts.map((contact) => ({
    parent: contact.d, target: contact.s,
    parentOffice: String(d7Anchors.find((anchor) => String(anchor.id) === contact.d).office),
  }));
  const d7U = unique(analogueR.map((edge) => keyOf(edge.parentOffice, edge.target)));
  const d7O = unique(d7Contacts.map((contact) =>
    keyOf(String(d7Anchors.find((anchor) => String(anchor.id) === contact.d).office), contact.s)));
  const d7Kernel = [];
  for (const a of d7Anchors) {
    for (const c of d7Anchors) {
      if (a.id !== c.id && rotate(maskOf(a.pitches)) === maskOf(c.pitches) &&
          Number(a.office) === (Number(c.office) + 2) % 7) d7Kernel.push({ a, c });
    }
  }
  const d7Anchored = accounting(d7Kernel.flatMap((pair) =>
    analogueR.filter((edge) => edge.parent === String(pair.c.id)).map((edge) => keyOf(edge.parentOffice, edge.target))), d7U, d7O);
  if (d7Kernel.length !== 6 || d7Anchored.generatedKeyCount !== 12 ||
      d7Anchored.missedObservedCount !== 2) fail("D7 anchored analogue drift");
  const d7SeamPairs = [];
  for (const a of d7Anchors) {
    for (const c of d7Anchors) {
      if (a.id === c.id) continue;
      const k = (Number(a.office) + 6) % 7;
      if (Number(c.office) !== (k + 6) % 7) continue;
      for (const qa of PATCH) {
        for (const qc of PATCH) {
          if (setKey(a.pitches, qa) === setKey(c.pitches, qc)) {
            d7SeamPairs.push({ office: String(k), a: String(a.id), c: String(c.id) });
          }
        }
      }
    }
  }
  const d7Offices = unique(d7SeamPairs.map((pair) => pair.office));
  if (d7Offices.length !== 6 || d7Offices.includes("3")) fail("D7 seam asymmetry drift");
  const e3 = artifact.e3D7Pairing;
  if (e3.label !== "hypothesis-analogue" || e3.anchoredRoute.missedObservedCount !== 2 ||
      e3.seamRoute.outcome !== "not_derived@seam-analogue" ||
      canonicalText(e3.seamRoute.qualifyingOffices) !== canonicalText(d7Offices) ||
      e3.tC.observedSeamDomain !== 0 || e3.symmetry.d7Tier.includes("no D7 verdict") === false) fail("D7 artifact drift");

  // ---- E4 wall ---------------------------------------------------------------
  const dAnchors = new Set(records.filter((record) =>
    record.role === "anchor" && /^D[1-7]$/.test(record.tier)).map((record) => record.id));
  const ddFixed = applications.filter((application) =>
    application.operator_class === "fixed_degree_shift" &&
    dAnchors.has(Number(application.source_id)) && dAnchors.has(Number(application.target_id)));
  const ddModal = applications.filter((application) =>
    application.operator_id === "M" &&
    dAnchors.has(Number(application.source_id)) && dAnchors.has(Number(application.target_id)));
  const familyA = applications.filter((application) =>
    ["R1", "L1"].includes(application.operator_id) &&
    (dAnchors.has(Number(application.source_id)) || dAnchors.has(Number(application.target_id))));
  if (ddFixed.length !== 0 || ddModal.length !== 49 || familyA.length !== 76) fail("E4 census drift");
  const e4 = artifact.e4WallCensus;
  if (e4.fixedDegreeDD.verdict !== "NO_CHANGE" || e4.fixedDegreeDD.failLoud !== false ||
      e4.dissolutionDetected !== false || e4.modalDD.lifted !== 49 * 12 ||
      e4.familyAIncidence.lifted !== 76 * 12) fail("E4 artifact drift");
  for (const phase of ALL_PHASES) {
    const entry = e4.fixedDegreeDD.perPhase.find((row) => Number(row.phase) === phase);
    if (!entry || entry.fixedDegreeDD !== 0) fail(`E4 phase drift: ${phase}`);
  }

  // ---- fences ----------------------------------------------------------------
  if (artifact.notAccomplished.length !== 6) fail("notAccomplished inventory drift");
  if (!String(artifact.fences.recordAmendment).includes("claim event") ||
      !String(artifact.fences.direction).includes("unassigned") ||
      !String(artifact.fences.packaging).includes("MANIFEST")) fail("fence drift");

  console.log(JSON.stringify({
    artifact: ARTIFACT_PATH,
    status: "PASS",
    fingerprint: probeFingerprint,
    e1: artifact.e1Presence.verdict,
    calibration: cal.verdict,
    seamOffices: offices.length,
    contractCategory: contract.category,
    d7SeamOffices: d7Offices.length,
    wall: e4.fixedDegreeDD.verdict,
  }, null, 2));
}

validate();
