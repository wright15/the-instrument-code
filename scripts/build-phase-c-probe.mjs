#!/usr/bin/env node
/**
 * Build the BL-033 Phase C probe: the boundary-govern derivation retry
 * (D4 fa-pole, with D7 as the paired hypothesis-analogue) inside the admitted
 * phase-extended topology sandbox.
 *
 * Sections:
 *   e1Presence   - boundary-representation check (D4 seat phase-contexts and
 *                  seam incidence; pre-condition gate for E2)
 *   e2Retry      - the derivation retry: calibration (A-same), the seam keying
 *                  (A-seam), the T-B routes, T-C per-phase and seam, and the
 *                  frozen Outcome Contract applied to the lifted run
 *   e3D7Pairing  - the D7 mirror with the audited hypothesis-analogue grant
 *   e4WallCensus - the BL-029 wall re-tested per phase (fixed-degree census;
 *                  Family-A incidence reported separately, never dissolution)
 *
 * Read-only against the landed sources (canonical ledger, network, audit
 * applications, Phase A probe, frozen D4 receipt). No canonical/Court/schema/
 * Neo4j/shared-sidecar writes. No verdicts: D4's registered not_derived is
 * untouched and D7 stays hypothesis-tier. Planning evidence, byte-stable,
 * independently validated. G1 untouched; direction unassigned; frame unused.
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

export const APPLICATIONS_PATH = "seven-governors-mutation-algebra-audit/audit/operator-applications.csv";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..");

export const SCHEMA_VERSION = "harmonic-orrery.phase-c-probe.v1";
export const PROBE_ID = "BL033_PHASE_C_PROBE_v1";
export const OUTPUT_PATH = "orrery/src/generated/phase-c-probe.v1.json";
export const PHASE_A_PROBE_PATH = "orrery/src/generated/phase-a-probe.v1.json";
export const FROZEN_RECEIPT_PATH = "qa/d4-production-receipt.json";
export const PHASE_A_FINGERPRINT = "c8271c20a7aaf23c8f25fbe12d849854eb02ffbfd6fa24fb3f091b15970b87ac";

export const PATCH_PHASES = [11, 0, 1];
export const ALL_PHASES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

// ---------------------------------------------------------------------------
// Helpers (level: set-level phase identity; freeness M2 makes it injective)
// ---------------------------------------------------------------------------

function maskOf(pitches) {
  return pitches.reduce((mask, pitch) => mask | (1 << pitch), 0);
}

function pcsOf(mask) {
  const result = [];
  for (let pitch = 0; pitch < 12; pitch += 1) if ((mask & (1 << pitch)) !== 0) result.push(pitch);
  return result;
}

export function rotateMaskZ12(mask) {
  return ((mask << 1) & 4095) | (mask >> 11);
}

function setKey(pitches, phase) {
  return sortedKey(translateSet(pitches, phase));
}

function keyOf(office, satellite) {
  return `${office}:${satellite}`;
}

function cmp(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

function sortedUnique(values) {
  return [...new Set(values)].sort(cmp);
}

// ---------------------------------------------------------------------------
// Independent extraction of the D4 domain from canonical sources
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

function extractProjection(records, network) {
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
    if (edge.type === "CONSTRUCTS" && parent.tier === "A0" && child.tier === "A1" &&
        parent.role === "anchor" && child.role === "anchor") {
      E.push({ id: edge.id, source: String(edge.source), target: String(edge.target) });
    }
  }
  anchors.sort((a, b) => cmp(a.id, b.id));
  R.sort((a, b) => cmp(a.id, b.id));
  E.sort((a, b) => cmp(a.id, b.id));
  return { anchors, R, E };
}

function extractContacts(records, network, projection) {
  const byId = new Map(records.map((record) => [String(record.id), record]));
  const parents = new Map();
  for (const r of projection.R) parents.set(r.target, [...(parents.get(r.target) ?? []), r]);
  const contacts = [];
  for (const edge of network.structuralEdges) {
    if (edge.type !== "SEAT_CONTACT") continue;
    const source = byId.get(String(edge.source));
    const target = byId.get(String(edge.target));
    if (!source || !target) continue;
    if (target.tier !== "D4") continue;
    if (source.tier !== "A1" || source.role !== "satellite" || target.role !== "anchor") {
      fail(`unexpected D4 contact endpoint on ${edge.id}`);
    }
    const group = parents.get(String(edge.source));
    if (!group || group.length !== 1) fail(`contact ${edge.id} has no unique R parent`);
    contacts.push({ contactRowId: edge.id, d: String(edge.target), s: String(edge.source),
      h: group[0].source, parentOffice: group[0].parentOffice });
  }
  contacts.sort((a, b) => cmp(a.contactRowId, b.contactRowId));
  return contacts;
}

function extractSeams(records, network) {
  const byId = new Map(records.map((record) => [String(record.id), record]));
  const groups = new Map();
  for (const edge of network.structuralEdges) {
    if (edge.type !== "CONSTRUCTS") continue;
    if (edge.provenance !== "phase-seam construction") continue;
    const source = byId.get(String(edge.source));
    const target = byId.get(String(edge.target));
    if (!source || !target || source.tier !== "A0" || target.tier !== "A1") continue;
    const group = groups.get(String(edge.target)) ?? [];
    group.push({ source: String(edge.source), edgeId: edge.id });
    groups.set(String(edge.target), group);
  }
  const seams = [];
  for (const [targetH, group] of groups) {
    if (group.length !== 2 || group[0].source === group[1].source) fail(`invalid seam group at ${targetH}`);
    group.sort((a, b) => cmp(a.source, b.source));
    const target = byId.get(targetH);
    seams.push({ targetH, parentA: group[0].source, parentB: group[1].source,
      parentOffice: String(target.officeIndex), edgeId1: group[0].edgeId, edgeId2: group[1].edgeId });
  }
  seams.sort((a, b) => cmp(a.targetH, b.targetH));
  return seams;
}

// ---------------------------------------------------------------------------
// Anchored route engines (independent re-implementation of the frozen logic)
// ---------------------------------------------------------------------------

function anchoredTA(anchors, R) {
  const a0 = anchors.filter((anchor) => anchor.tier === "A0")
    .map((anchor) => ({ id: Number(anchor.id), office: Number(anchor.officeIndex) }));
  const witnesses = [];
  for (const a of a0) {
    for (const b of a0) {
      for (const r of R) {
        for (let k = 0; k < 7; k += 1) {
          if (a.id !== b.id && a.office === (k + 1) % 7 && b.office === (k - 1 + 7) % 7 &&
              rotateMaskZ12(maskOf(pcsOf(a.id))) === b.id && Number(r.parentOffice) === k) {
            witnesses.push({ tag: "kernel_twin", a: String(a.id), b: String(b.id),
              h: r.source, s: r.target, k: String(k) });
          }
        }
      }
    }
  }
  return witnesses;
}

function anchoredTB(E, R) {
  const witnesses = [];
  for (const e1 of E) {
    for (const e2 of E) {
      for (const r of R) {
        if (e1.id !== e2.id && e1.source !== e2.source && e1.target === r.source && e2.target === r.source) {
          witnesses.push({ tag: "construction_join", e1source: e1.source, e2source: e2.source,
            h: r.source, s: r.target, parentOffice: r.parentOffice, e1id: e1.id, e2id: e2.id });
        }
      }
    }
  }
  return witnesses;
}

function anchoredTC(anchors) {
  const relations = [];
  for (const a of anchors) {
    for (const b of anchors) {
      if (a.tier === b.tier && a.id !== b.id &&
          rotateMaskZ12(maskOf(Number(a.id) ? pcsOf(Number(a.id)) : [])) === Number(b.id)) {
        const mid = (4 * (Number(a.officeIndex) + Number(b.officeIndex))) % 7;
        relations.push({ tier: a.tier, a: a.id, b: b.id, mid: String(mid) });
      }
    }
  }
  return relations;
}

// ---------------------------------------------------------------------------
// Contract accounting (frozen Outcome Contract semantics, lifted units)
// ---------------------------------------------------------------------------

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
    generatedKeys: G,
    inRButUnmatchedKeys: unmatched,
    missedObservedKeys: O.filter((key) => !G.includes(key)),
  };
}

function selectCategory({ valid, complete, covered, restatement, overshoot, midpointExact, observedKeyCount, observedSeamCount }) {
  if (!valid) return "invalid";
  if (!complete) return "incomplete_or_anomalous";
  if (observedKeyCount === 0 || observedSeamCount === 0) return "incomplete_or_anomalous";
  if (covered && restatement) return midpointExact ? "filter_plus_geometry" : "restatement_signature";
  if (covered && overshoot) return "overshoot";
  if (covered && midpointExact) return "derived";
  return "not_derived";
}

// ---------------------------------------------------------------------------
// Main build
// ---------------------------------------------------------------------------

export function buildProbe() {
  const records = loadLedgerRecords();
  const network = readJson(HEPTATONIC_NETWORK_PATH);
  const applications = parseCsv(read(APPLICATIONS_PATH));
  if (applications.length !== 3402) fail(`application universe is ${applications.length}`);

  const phaseAProbe = readJson(PHASE_A_PROBE_PATH);
  if (phaseAProbe.probeFingerprint !== PHASE_A_FINGERPRINT) fail("Phase A probe fingerprint mismatch");
  if (phaseAProbe.p5BoundaryLayer.dTier.fixedDegreeAnchorToAnchor !== 0) fail("Phase A wall census mismatch");

  const frozen = readJson(FROZEN_RECEIPT_PATH);
  if (frozen.category !== "not_derived") fail(`frozen receipt category is ${frozen.category}`);

  const projection = extractProjection(records, network);
  const contacts = extractContacts(records, network, projection);
  const seams = extractSeams(records, network);
  if (projection.anchors.length !== 14) fail(`projection anchor census is ${projection.anchors.length}`);
  if (projection.R.length !== 28) fail(`projection R census is ${projection.R.length}`);
  if (projection.E.length !== 14) fail(`projection E census is ${projection.E.length}`);
  if (contacts.length !== 14) fail(`contact census is ${contacts.length}`);
  if (seams.length !== 2) fail(`seam census is ${seams.length}`);

  const U = sortedUnique(projection.R.map((r) => keyOf(r.parentOffice, r.target)));
  const O = sortedUnique(contacts.map((contact) => keyOf(contact.parentOffice, contact.s)));
  const frozenU = sortedUnique(frozen.comparison.uKeys);
  const frozenO = sortedUnique(frozen.comparison.rows.map((row) => keyOf(row.parentOffice, row.s)));
  if (canonicalText(U) !== canonicalText(frozenU)) fail("U keying disagrees with the frozen receipt");
  if (canonicalText(O) !== canonicalText(frozenO)) fail("O keying disagrees with the frozen receipt");
  if (frozen.comparison.fourCellCounts.aOnly !== "0" || frozen.comparison.fourCellCounts.bOnly !== "10" ||
      frozen.comparison.fourCellCounts.both !== "4" || frozen.comparison.fourCellCounts.neither !== "0") {
    fail("frozen four-cell counts mismatch");
  }

  // ---- anchored routes (independent re-implementation) --------------------
  const taWitnesses = anchoredTA(projection.anchors, projection.R);
  const tbWitnesses = anchoredTB(projection.E, projection.R);
  const tcRelations = anchoredTC(projection.anchors);
  const anchoredA = accounting(taWitnesses.map((w) => keyOf(w.k, w.s)), U, O);
  const anchoredB = accounting(tbWitnesses.map((w) => keyOf(w.parentOffice, w.s)), U, O);
  if (anchoredA.generatedKeyCount !== 8 || anchoredA.inRButUnmatchedCount !== 4 ||
      anchoredA.missedObservedCount !== 10 || anchoredA.restatementSignature) fail("anchored T-A replay mismatch");
  if (anchoredB.generatedKeyCount !== 28 || !anchoredB.restatementSignature ||
      anchoredB.inRButUnmatchedCount !== 14) fail("anchored T-B replay mismatch");
  const anchoredA0tc = tcRelations.filter((relation) => relation.tier === "A0");
  const observedRelations = seams.map((seam) => ({ tier: "A0", a: seam.parentA, b: seam.parentB, mid: seam.parentOffice }));

  // ---- E1 boundary-representation check -----------------------------------
  const d4Anchors = records.filter((record) => record.tier === "D4" && record.role === "anchor");
  if (d4Anchors.length !== 7) fail(`D4 anchor census is ${d4Anchors.length}`);
  const modalSuccessor = new Map();
  for (const application of applications) {
    if (application.operator_id === "M") {
      modalSuccessor.set(Number(application.source_id), Number(application.target_id));
    }
  }
  const seamEdgesByState = new Map();
  for (const application of applications) {
    if (application.operator_id !== "R1" && application.operator_id !== "L1") continue;
    const source = Number(application.source_id);
    const target = Number(application.target_id);
    for (const endpoint of [source, target]) {
      seamEdgesByState.set(endpoint, [...(seamEdgesByState.get(endpoint) ?? []), application.application_id]);
    }
  }
  const contactsByAnchor = new Map();
  for (const contact of contacts) {
    contactsByAnchor.set(contact.d, [...(contactsByAnchor.get(contact.d) ?? []), contact.s]);
  }
  const e1Anchors = d4Anchors.map((anchor) => {
    const satellites = contactsByAnchor.get(String(anchor.id)) ?? [];
    const anchorSeams = sortedUnique(seamEdgesByState.get(anchor.id) ?? []);
    const satelliteSeams = sortedUnique(satellites.flatMap((satellite) => seamEdgesByState.get(Number(satellite)) ?? []));
    const successor = modalSuccessor.get(anchor.id);
    const predecessor = [...modalSuccessor.entries()].find(([, target]) => target === anchor.id)?.[0];
    return {
      id: String(anchor.id),
      office: String(anchor.officeIndex),
      phases: Object.fromEntries(PATCH_PHASES.map((phase) => [String(phase), setKey(anchor.pitches, phase)])),
      contactSatellites: satellites,
      anchorSeamEdges: anchorSeams,
      satelliteSeamEdges: satelliteSeams,
      seamIncidenceTotal: anchorSeams.length + satelliteSeams.length,
      modalSuccessor: successor === undefined ? null : String(successor),
      modalPredecessor: predecessor === undefined ? null : String(predecessor),
    };
  });
  const e1Ok = e1Anchors.every((anchor) => anchor.phases["11"] && anchor.phases["0"] && anchor.phases["1"] &&
    anchor.seamIncidenceTotal >= 1);
  if (!e1Ok) fail("E1 presence gate FAIL: the retry is premature");

  // ---- E2: calibration (A-same, per patch phase) --------------------------
  const calibrationPerPhase = PATCH_PHASES.map((phase) => {
    const GAsame = taWitnesses.map((w) => keyOf(w.k, w.s));
    const GBsame = tbWitnesses.map((w) => keyOf(w.parentOffice, w.s));
    const a = accounting(GAsame, U, O);
    const b = accounting(GBsame, U, O);
    const cells = { aOnly: 0, bOnly: 0, both: 0, neither: 0 };
    const aSet = new Set(a.generatedKeys);
    const bSet = new Set(b.generatedKeys);
    for (const contact of contacts) {
      const key = keyOf(contact.parentOffice, contact.s);
      if (aSet.has(key)) cells[bSet.has(key) ? "both" : "aOnly"] += 1;
      else cells[bSet.has(key) ? "bOnly" : "neither"] += 1;
    }
    return {
      phase: String(phase),
      identicalToFrozen: canonicalText(a.generatedKeys) === canonicalText(anchoredA.generatedKeys) &&
        canonicalText(b.generatedKeys) === canonicalText(anchoredB.generatedKeys),
      fourCellCounts: cells,
      routeA: withoutKeyLists(a),
      routeB: withoutKeyLists(b),
    };
  });
  const calibrationOk = calibrationPerPhase.every((entry) =>
    entry.identicalToFrozen && entry.routeA.generatedKeyCount === 8 &&
    entry.routeA.inRButUnmatchedCount === 4 && entry.routeB.generatedKeyCount === 28 &&
    entry.routeB.restatementSignature && entry.fourCellCounts.aOnly === 0 &&
    entry.fourCellCounts.bOnly === 10 && entry.fourCellCounts.both === 4 &&
    entry.fourCellCounts.neither === 0);

  // ---- E2: seam keying (A-seam) -------------------------------------------
  const recordsById = new Map(records.map((record) => [record.id, record]));
  const a0Anchors = projection.anchors.filter((anchor) => anchor.tier === "A0").map((anchor) => ({
    id: Number(anchor.id),
    office: Number(anchor.officeIndex),
    pitches: recordsById.get(Number(anchor.id)).pitches,
  }));
  const seamPairs = [];
  for (const a of a0Anchors) {
    for (const c of a0Anchors) {
      if (a.id === c.id) continue;
      const k = (a.office + 6) % 7;
      if (c.office !== (k + 6) % 7) continue;
      for (const qa of PATCH_PHASES) {
        for (const qc of PATCH_PHASES) {
          if (setKey(a.pitches, qa) !== setKey(c.pitches, qc)) continue;
          seamPairs.push({ office: String(k), a: String(a.id), aPhase: String(qa), c: String(c.id),
            cPhase: String(qc), geometry: setKey(a.pitches, qa),
            carries: `+1/-1 flank (patch ${Math.min(qa, qc)}/${Math.max(qa, qc)})` });
        }
      }
    }
  }
  seamPairs.sort((left, right) => cmp(left.office, right.office) || cmp(left.a, right.a) ||
    cmp(left.aPhase, right.aPhase) || cmp(left.c, right.c) || cmp(left.cPhase, right.cPhase));
  const qualifyingOffices = sortedUnique(seamPairs.map((pair) => pair.office));
  const GAsSeam = sortedUnique(projection.R
    .filter((r) => qualifyingOffices.includes(r.parentOffice))
    .map((r) => keyOf(r.parentOffice, r.target)));
  const seamA = accounting(GAsSeam, U, O);
  const generationComplete = qualifyingOffices.length === 7;
  // strict-degree control: only realizations with phase difference +1 (qa - qc = 1 mod 12)
  const strictPairs = seamPairs.filter((pair) =>
    (Number(pair.aPhase) - Number(pair.cPhase) + 12) % 12 === 1);
  const strictOffices = sortedUnique(strictPairs.map((pair) => pair.office));
  const GAsSeamStrict = sortedUnique(projection.R
    .filter((r) => strictOffices.includes(r.parentOffice))
    .map((r) => keyOf(r.parentOffice, r.target)));
  const seamAStrict = accounting(GAsSeamStrict, U, O);

  // ---- E2: T-B routes ------------------------------------------------------
  const bCarried = [];
  for (const e of projection.E) {
    const source = recordsById.get(Number(e.source));
    const target = recordsById.get(Number(e.target));
    for (const qa of PATCH_PHASES) {
      for (const qc of PATCH_PHASES) {
        if (setKey(source.pitches, qa) === setKey(target.pitches, qc)) {
          bCarried.push({ edge: e.id, qa: String(qa), qc: String(qc) });
        }
      }
    }
  }
  const bSeam = accounting(projection.R.map((r) => keyOf(r.parentOffice, r.target)), U, O);

  // ---- E2: T-C -------------------------------------------------------------
  const tCPerPhase = PATCH_PHASES.map((phase) => {
    const generated = anchoredA0tc;
    const generatedKeys = sortedUnique(generated.map((relation) => relationKey(relation)));
    const observedKeys = sortedUnique(observedRelations.map((relation) => relationKey(relation)));
    const missing = observedKeys.filter((key) => !generatedKeys.includes(key));
    const extra = generatedKeys.filter((key) => !observedKeys.includes(key));
    return { phase: String(phase), generated: generatedKeys, observed: observedKeys,
      missing, extra, midpointExact: observedKeys.length > 0 && missing.length === 0 && extra.length === 0 };
  });
  const seamGeneratedRelations = sortedUnique(seamPairs.map((pair) => {
    const a = recordsById.get(Number(pair.a));
    const c = recordsById.get(Number(pair.c));
    const mid = (4 * (a.officeIndex + c.officeIndex)) % 7;
    const [low, high] = [Number(pair.a), Number(pair.c)].sort((left, right) => left - right);
    return `A0:${low}:${high}:${mid}`;
  }));
  const seamObservedRelations = sortedUnique(observedRelations.map((relation) => relationKey(relation)));
  const seamMissing = seamObservedRelations.filter((key) => !seamGeneratedRelations.includes(key));
  const seamExtra = seamGeneratedRelations.filter((key) => !seamObservedRelations.includes(key));
  const seamMidpointExact = seamObservedRelations.length > 0 && seamMissing.length === 0 && seamExtra.length === 0;
  const seamStrictGenerated = sortedUnique(strictPairs.map((pair) => {
    const a = recordsById.get(Number(pair.a));
    const c = recordsById.get(Number(pair.c));
    const mid = (4 * (a.officeIndex + c.officeIndex)) % 7;
    const [low, high] = [Number(pair.a), Number(pair.c)].sort((left, right) => left - right);
    return `A0:${low}:${high}:${mid}`;
  }));
  const seamStrictMissing = seamObservedRelations.filter((key) => !seamStrictGenerated.includes(key));
  const seamStrictExtra = seamStrictGenerated.filter((key) => !seamObservedRelations.includes(key));
  const seamStrictMidpointExact = seamObservedRelations.length > 0 && seamStrictMissing.length === 0 &&
    seamStrictExtra.length === 0;

  // ---- E2: frozen contract on the lifted run -------------------------------
  const aCovered = seamA.missedObservedCount === 0;
  const bCovered = bSeam.missedObservedCount === 0;
  const covered = aCovered && bCovered;
  const restatement = seamA.restatementSignature || bSeam.restatementSignature;
  const overshoot = seamA.inRButUnmatchedCount > 0 || bSeam.inRButUnmatchedCount > 0;
  const category = selectCategory({
    valid: seamA.extraBeyondRCount === 0 && bSeam.extraBeyondRCount === 0,
    complete: generationComplete,
    covered,
    restatement,
    overshoot,
    midpointExact: seamMidpointExact,
    observedKeyCount: O.length,
    observedSeamCount: observedRelations.length,
  });
  const expectationHeld = seamA.inRButUnmatchedCount < 4 && seamA.missedObservedCount < 10 &&
    !seamA.restatementSignature;

  // ---- E3: D7 analogue mirror ----------------------------------------------
  const d7Anchors = network.d7AnchorRows.map((row) => ({
    id: Number(row.scaleId),
    office: row.officeIndex,
    pitches: row.pitchSet.replace(/[{}]/g, "").split(",").map((value) => Number(value)),
  }));
  if (d7Anchors.length !== 7) fail(`D7 anchor census is ${d7Anchors.length}`);
  const d7Contacts = network.d7SeatContactRows.map((row) => ({
    contactRowId: row.id, s: String(row.source), d: String(row.target), phaseDelta: String(row.phaseDelta),
  }));
  const d7Modal = network.d7ModalRows.map((row) => ({ id: row.id, source: String(row.source), target: String(row.target) }));
  if (d7Contacts.length !== 14 || d7Modal.length !== 7) fail("D7 contact/orbit census mismatch");
  const analogueR = d7Contacts.map((contact) => ({
    id: `analogue-governs:D7:${contact.d}:${contact.s}`,
    parent: contact.d,
    target: contact.s,
    parentOffice: String(d7Anchors.find((anchor) => String(anchor.id) === contact.d).office),
  }));
  const d7U = sortedUnique(analogueR.map((edge) => keyOf(edge.parentOffice, edge.target)));
  const d7O = sortedUnique(d7Contacts.map((contact) => {
    const anchor = d7Anchors.find((a) => String(a.id) === contact.d);
    return keyOf(String(anchor.office), contact.s);
  }));
  // anchored analogue: rotation-by-1 kernel pairs among D7 anchors (same phase)
  const d7KernelPairs = [];
  for (const a of d7Anchors) {
    for (const c of d7Anchors) {
      if (a.id === c.id) continue;
      if (rotateMaskZ12(maskOf(a.pitches)) === maskOf(c.pitches) &&
          a.office === (Number(c.office) + 2) % 7) {
        d7KernelPairs.push({ a: String(a.id), c: String(c.id) });
      }
    }
  }
  const d7AnchoredGenerated = sortedUnique(d7KernelPairs.flatMap((pair) => analogueR
    .filter((edge) => edge.parent === pair.c).map((edge) => keyOf(edge.parentOffice, edge.target))));
  const d7AnchoredAccounting = accounting(d7AnchoredGenerated, d7U, d7O);
  // seam analogue: same-geometry pairs among D7 anchors at patch contexts with office straddle
  const d7SeamPairs = [];
  for (const a of d7Anchors) {
    for (const c of d7Anchors) {
      if (a.id === c.id) continue;
      const k = (Number(a.office) + 6) % 7;
      if (Number(c.office) !== (k + 6) % 7) continue;
      for (const qa of PATCH_PHASES) {
        for (const qc of PATCH_PHASES) {
          if (setKey(a.pitches, qa) !== setKey(c.pitches, qc)) continue;
          d7SeamPairs.push({ office: String(k), a: String(a.id), aPhase: String(qa), c: String(c.id), cPhase: String(qc) });
        }
      }
    }
  }
  const d7QualifyingOffices = sortedUnique(d7SeamPairs.map((pair) => pair.office));
  const d7SeamGenerated = sortedUnique(analogueR
    .filter((edge) => d7QualifyingOffices.includes(edge.parentOffice))
    .map((edge) => keyOf(edge.parentOffice, edge.target)));
  const d7SeamAccounting = accounting(d7SeamGenerated, d7U, d7O);
  const e3 = {
    probe: "d7-analogue-mirror",
    label: "hypothesis-analogue",
    construction: {
      statement: "no D7 grant exists; analogue-R is constructed from seat-contact rows with parent h = d, audited here, labeled hypothesis-analogue; modal orbit recorded as the D7 constructing structure; parity-with-D4-grant claims forbidden (OD-3)",
      rEdges: analogueR.length,
      rEdgesAudited: analogueR,
      contacts: d7Contacts.length,
      modalOrbit: d7Modal.map((row) => row.id),
      eEdges: 0,
      seamProvenance: 0,
    },
    anchoredRoute: {
      kernelPairs: d7KernelPairs.length,
      generatedKeyCount: d7AnchoredAccounting.generatedKeyCount,
      covered: d7AnchoredAccounting.missedObservedCount === 0,
      missedObservedCount: d7AnchoredAccounting.missedObservedCount,
      outcome: d7AnchoredAccounting.missedObservedCount === 0 ? "covered@anchored-analogue" : "not_derived@anchored-analogue",
    },
    seamRoute: {
      qualifyingOffices: d7QualifyingOffices,
      pairs: d7SeamPairs,
      generatedKeyCount: d7SeamAccounting.generatedKeyCount,
      covered: d7SeamAccounting.missedObservedCount === 0,
      restatementSignature: d7SeamAccounting.restatementSignature,
      inRButUnmatchedCount: d7SeamAccounting.inRButUnmatchedCount,
      outcome: d7SeamAccounting.restatementSignature ? "restatement@seam-analogue" : "not_derived@seam-analogue",
    },
    tC: {
      observedSeamDomain: 0,
      contractClause: "incomplete_or_anomalous",
      note: "an empty expected observation/seam domain cannot pass vacuously (contract :2112); the D4 contract is inapplicable to D7 at the seam-observation layer",
    },
    symmetry: {
      routeLevel: "symmetric to D4: the seam keying collapses to the full granted/analogue domain (restatement), while the anchored keying under-covers",
      inputLevel: "asymmetric to D4: no D7 granted relation and no D7 seam provenance exist; the D4 contract's seam clause is inapplicable",
      d7Tier: "hypothesis-tier preserved; no D7 verdict is or can be produced by this probe",
    },
  };

  // ---- E4: wall census -----------------------------------------------------
  const dAnchorIds = new Set(records.filter((record) =>
    record.role === "anchor" && /^D[1-7]$/.test(record.tier)).map((record) => record.id));
  if (dAnchorIds.size !== 49) fail(`D anchor census is ${dAnchorIds.size}`);
  const fixedDegreeTouching = applications.filter((application) =>
    application.operator_class === "fixed_degree_shift" &&
    (dAnchorIds.has(Number(application.source_id)) !== dAnchorIds.has(Number(application.target_id))));
  const roleBreakdown = {};
  for (const application of fixedDegreeTouching) {
    const other = dAnchorIds.has(Number(application.source_id))
      ? Number(application.target_id) : Number(application.source_id);
    const role = recordsById.get(other).role;
    roleBreakdown[role] = (roleBreakdown[role] ?? 0) + 1;
  }
  const ddFixedDegree = applications.filter((application) =>
    application.operator_class === "fixed_degree_shift" &&
    dAnchorIds.has(Number(application.source_id)) && dAnchorIds.has(Number(application.target_id)));
  const ddModal = applications.filter((application) =>
    application.operator_id === "M" &&
    dAnchorIds.has(Number(application.source_id)) && dAnchorIds.has(Number(application.target_id)));
  const familyATouchingD = applications.filter((application) =>
    ["R1", "L1"].includes(application.operator_id) &&
    (dAnchorIds.has(Number(application.source_id)) || dAnchorIds.has(Number(application.target_id))));
  const fixedDegreePerPhase = ALL_PHASES.map((phase) => ({
    phase: String(phase),
    fixedDegreeDD: ddFixedDegree.length,
  }));
  const noChange = fixedDegreePerPhase.every((entry) => entry.fixedDegreeDD === 0);
  const e4 = {
    probe: "wall-dissolution-census",
    preRegistered: "no change: zero D-D fixed-degree applications at every phase (BL-029/P5); Family-A incidence reported separately and never called dissolution (OD-4)",
    phases: ALL_PHASES.map(String),
    fixedDegreeDD: {
      anchored: ddFixedDegree.length,
      perPhase: fixedDegreePerPhase,
      verdict: noChange ? "NO_CHANGE" : "WALL_CHANGE",
      failLoud: !noChange,
    },
    modalDD: { anchored: ddModal.length, lifted: ddModal.length * ALL_PHASES.length },
    familyAIncidence: {
      anchored: familyATouchingD.length,
      lifted: familyATouchingD.length * ALL_PHASES.length,
      statement: "the lift's own seam structure near D anchors; reported separately, never dissolution",
    },
    dAnchorFixedDegreeTouching: {
      total: fixedDegreeTouching.length,
      otherEndpointRoleBreakdown: roleBreakdown,
      statement: "context only: fixed-degree applications touching exactly one D anchor (none are D-D)",
    },
    dissolutionDetected: !noChange,
  };

  // ---- assembly ------------------------------------------------------------
  const core = {
    schemaVersion: SCHEMA_VERSION,
    probeId: PROBE_ID,
    status: "planning_evidence",
    generator: "scripts/build-phase-c-probe.mjs",
    sourceBindings: [
      { artifact: HEPTATONIC_LEDGER_PATH, sha256: fileSha(HEPTATONIC_LEDGER_PATH), role: "462-record anchored universe" },
      { artifact: HEPTATONIC_NETWORK_PATH, sha256: fileSha(HEPTATONIC_NETWORK_PATH), role: "structural edges, D4 projection, D7 rows" },
      { artifact: APPLICATIONS_PATH, sha256: fileSha(APPLICATIONS_PATH), role: "admitted operator applications (seam and wall censuses)" },
      { artifact: PHASE_A_PROBE_PATH, sha256: fileSha(PHASE_A_PROBE_PATH), role: "licensed lift machinery (fingerprint checked)" },
      { artifact: FROZEN_RECEIPT_PATH, sha256: fileSha(FROZEN_RECEIPT_PATH), role: "frozen OBS-023 comparison (read-only reference)" },
    ],
    e1Presence: {
      probe: "boundary-representation-check",
      gatesE2: true,
      criterion: "every D4 anchor present at patch phases {11,0,1} with >=1 R1/L1 seam edge in its seat neighbourhood (anchor or contact satellite)",
      anchors: e1Anchors,
      verdict: e1Ok ? "PRESENT" : "ABSENT",
    },
    e2Retry: {
      probe: "d4-derivation-retry",
      keying: {
        convention: "{anchoredId}@{phase}",
        identity: "set-level phase identity T_qa(x.pcs) = T_qc(y.pcs); roots carried, not part of the predicate",
        patchPhases: PATCH_PHASES.map(String),
        crossPhaseContainment: "forbidden (P4 holds): no containment join crosses phases",
      },
      domain: { anchors: projection.anchors.length, rEdges: projection.R.length, eEdges: projection.E.length,
        contacts: contacts.length, seams: seams.length, uKeys: U, observedKeys: O },
      calibration: {
        method: "A-same: anchored kernel-twin predicate lifted uniformly at each patch phase; must reproduce OBS-023 exactly",
        perPhase: calibrationPerPhase,
        anchoredRouteA: withoutKeyLists(anchoredA),
        anchoredRouteB: withoutKeyLists(anchoredB),
        verdict: calibrationOk ? "EXACT" : "FAIL",
      },
      routeASame: {
        definition: "same-phase lift of the anchored kernel-twin witnesses",
        generatedKeys: anchoredA.generatedKeys,
        accounting: withoutKeyLists(anchoredA),
      },
      routeASeam: {
        definition: "kernel-twin as set-identity with seam-carried patch contexts: office k qualifies iff A0 anchors a (office k+1) and c (office k-1) realize the same geometry at patch phases; keys (k, s) for all R satellites of parents with office k",
        qualifyingOffices,
        seamPairs,
        generatedKeys: GAsSeam,
        accounting: withoutKeyLists(seamA),
        matchedObservedKeys: seamA.generatedKeys.filter((key) => O.includes(key)),
        strictDegreeControl: {
          definition: "control route: only realizations with phase difference +1 (qa - qc = 1 mod 12), i.e. the strict anchored-degree re-key",
          qualifyingOffices: strictOffices,
          seamPairs: strictPairs,
          generatedKeys: GAsSeamStrict,
          accounting: withoutKeyLists(seamAStrict),
          category: selectCategory({
            valid: seamAStrict.extraBeyondRCount === 0,
            complete: strictOffices.length > 0,
            covered: seamAStrict.missedObservedCount === 0,
            restatement: seamAStrict.restatementSignature,
            overshoot: seamAStrict.inRButUnmatchedCount > 0,
            midpointExact: seamStrictMidpointExact,
            observedKeyCount: O.length,
            observedSeamCount: observedRelations.length,
          }),
        },
      },
      routeBSeam: {
        definition: "T-B construction join: same-phase E lift (restatement) plus a carried-endpoint check",
        carriedEndpointRealizations: bCarried.length,
        accounting: withoutKeyLists(bSeam),
      },
      routeC: {
        perPhase: tCPerPhase,
        seam: {
          generatedRelations: seamGeneratedRelations,
          observedRelations: seamObservedRelations,
          missing: seamMissing,
          extra: seamExtra,
          midpointExactStrict: seamMidpointExact,
          realizationOfObserved: seamMissing.length === 0,
          strictDegree: {
            generatedRelations: seamStrictGenerated,
            missing: seamStrictMissing,
            extra: seamStrictExtra,
            midpointExact: seamStrictMidpointExact,
          },
          note: "strict set equality at the seam keying overshoots (seam-generated flank relations beyond the observed seam groups); realization reports whether every observed seam group is patch-realizable",
        },
      },
      contract: {
        category,
        basis: "frozen Outcome Contract (:2104-2117) applied to (G_A@seam <= U, G_B = U, U, O, C_strict); first applicable row wins",
        valid: seamA.extraBeyondRCount === 0 && bSeam.extraBeyondRCount === 0,
        complete: generationComplete,
        covered,
        restatementSignature: restatement,
        midpointExact: seamMidpointExact,
        fourCellCounts: (() => {
          const aSet = new Set(seamA.generatedKeys);
          const bSet = new Set(bSeam.generatedKeys);
          const cells = { aOnly: 0, bOnly: 0, both: 0, neither: 0 };
          for (const contact of contacts) {
            const key = keyOf(contact.parentOffice, contact.s);
            if (aSet.has(key)) cells[bSet.has(key) ? "both" : "aOnly"] += 1;
            else cells[bSet.has(key) ? "bOnly" : "neither"] += 1;
          }
          return cells;
        })(),
      },
      preRegisteredExpectation: {
        source: "Phase C plan v1.1 (PM-approved) E2 pre-registration",
        expectation: "T-A@seam covers >4/14 (in_R_but_unmatched_A < 4 and B-only < 10) without collapsing to G=U",
        measured: { inRButUnmatchedA: seamA.inRButUnmatchedCount, bOnlyCell: (() => {
          const aSet = new Set(seamA.generatedKeys);
          const bSet = new Set(bSeam.generatedKeys);
          return contacts.filter((contact) => {
            const key = keyOf(contact.parentOffice, contact.s);
            return !aSet.has(key) && bSet.has(key);
          }).length;
        })(), gAEqualsU: seamA.restatementSignature },
        held: expectationHeld,
        violation: expectationHeld ? null : "coverage rose to 14/14 but only by collapsing to the full granted domain (G_A = U): the no-collapse clause failed; new outcome mode relative to the frozen not_derived",
      },
    },
    e3D7Pairing: e3,
    e4WallCensus: e4,
    fences: {
      governsVerdicts: "none: D4 not_derived (DECISION_LEDGER.md:2195-2252) unchanged; no verdict is claimed from this sandbox",
      d7Tier: "D7 stays hypothesis-tier; the analogue is labeled and audited",
      recordAmendment: "none: any D4 amendment is its own claim event with its own ceremony (OD-7)",
      topology: "candidate machinery only: no topology/canon/runtime/schema/Court/Neo4j writes",
      g1Intra330: "untouched",
      direction: "unassigned (BL-035 carried)",
      membrane: "frame 2.6/2.7 and the polarity synthesis are interpretation vocabulary, never design input",
      packaging: "no MANIFEST/CHECKSUMS edits; landing-time packaging is separate (SPEC-001 4.3)",
      sessionProse: "context, not evidence",
    },
    notAccomplished: [
      "no D4 record amendment and no governs admission",
      "no D7 verdict; D7 remains hypothesis-tier",
      "no wall-dissolution claim (census re-tests the wall; changes would be fail-loud findings)",
      "no G1 movement and no directional-semantics assignment",
      "no topology/canon/Court/Neo4j/schema claims",
      "no claim that the seam explanation is confirmed or falsified beyond the branch-table reading",
    ],
  };
  const probeFingerprint = sha256(canonicalText(core));
  return { ...core, probeFingerprint };
}

function withoutKeyLists(entry) {
  const { generatedKeys, inRButUnmatchedKeys, missedObservedKeys, ...rest } = entry;
  void generatedKeys; void inRButUnmatchedKeys; void missedObservedKeys;
  return rest;
}

function relationKey(relation) {
  const [low, high] = [Number(relation.a), Number(relation.b)].sort((left, right) => left - right);
  return `${relation.tier}:${low}:${high}:${relation.mid}`;
}

// ---------------------------------------------------------------------------

export function serializeProbe(probe) {
  return `${canonicalText(probe)}\n`;
}

function main() {
  const check = process.argv.includes("--check");
  const probe = buildProbe();
  const serialized = serializeProbe(probe);
  const outputPath = path.join(root, OUTPUT_PATH);
  const summary = {
    output: OUTPUT_PATH,
    check,
    e1: probe.e1Presence.verdict,
    calibration: probe.e2Retry.calibration.verdict,
    qualifyingOffices: probe.e2Retry.routeASeam.qualifyingOffices,
    contractCategory: probe.e2Retry.contract.category,
    expectationHeld: probe.e2Retry.preRegisteredExpectation.held,
    d7SeamOutcome: probe.e3D7Pairing.seamRoute.outcome,
    wallVerdict: probe.e4WallCensus.fixedDegreeDD.verdict,
    probeFingerprint: probe.probeFingerprint,
  };
  if (check) {
    const existing = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, "utf8") : null;
    if (existing !== serialized) throw new Error("STALE_PHASE_C_PROBE");
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
