#!/usr/bin/env node
/**
 * Build the BL-087 Klein-4 <-> ladder probe: does the Klein-4's action
 * explain the ladder-consecutiveness pattern?
 *
 * The unlanded interpretation under test (from the agents' session summaries;
 * zero "Klein" mentions in the BL-086 memo - verified mechanically here):
 *   rho (x -> 11x, the pitch-circle reflection) maps cycle endpoints to each
 *   other, creating the spanning windows that destroy ladder consecutiveness
 *   on the A1-top-A2 layer; T1 (x -> 5x) preserves consecutiveness.
 *
 * Pre-registered predictions (frozen in the preRegistration block below,
 * approved 2026-10-14 before any computation):
 *   H1  the rho-image of a FULL-ladder addressing order loses
 *       consecutiveness - spanning [0,6] windows at the image's endpoints
 *       (base: the A0 own-tier order).
 *   H2  the A1 addressing order is the rho-image of a consecutive landed
 *       addressing order (dihedral matching primary; set-equality a
 *       component fact).
 *   H3  the T1-image of a consecutive addressing order preserves
 *       consecutiveness (TWO_REGIME, mirror as landed).
 *   H4  T2 = rho o T1 (11*5 = 55 = 7 mod 12) destroys; the specific pin:
 *       the image of the A0 order is the reversed order with the [0,6]
 *       spanning pattern. ID trivially preserves (method sanity).
 *
 * Refutation conditions (mechanical): (a) the rho-image stays consecutive;
 * (b) the A1 order is not the rho-image of any consecutive landed order
 * under the criterion; (c) the T1-image breaks contiguity. Partial: rho
 * explains some spanning cases but not all -> scoped, not refuted outright.
 *
 * Operationalizations (frozen): OP-1 image order = the sequence of
 * bit-permuted states (pc-affine maps x -> u*x, t = 0; the BL-075 canonically
 * determined carriers), with the sanity gate against BL-075/BL-076 first;
 * OP-2 the window recomputation through the BL-084 windowAnalysis code path
 * (OD-84-5 same-code-path discipline); the corresponding landed layer of an
 * image order = the BL-084-recorded top layer of the image anchors' tier
 * (A0 -> A0, A1 -> A2, D7 -> D6, D6 -> A2); OP-3 the H2 matching criterion
 * (dihedral, set-equality reported); OP-4 ledger-absent/unresolvable images
 * are fail-loud fragment facts (BL-076 OD-76-2), never silently substituted.
 *
 * Two-region static discipline (validator-enforced): the INTRINSIC region
 * reads the ledger's pitch sets, masks, and tier/role partition only, and
 * carries the affine arithmetic, the order imaging, the permutation
 * classification, and the window machinery wrappers; the comparison region
 * reads the landed orders, layers, tables, and fingerprint chain artifacts.
 *
 * Fences: planning_evidence only. No new measurement (the probe re-images
 * landed orders over landed layers; masks-only arithmetic, the BL-070
 * precedent). No claim event; no record amendment; no GOVERNS admission; no
 * G1 movement; no INV-5 graduation; no M-walkability promotion; no
 * canonical/Court/schema/Neo4j writes. D7 hypothesis-tier throughout. The
 * no-leaning fence (the D7 derivation route may not cite the Klein-4 role
 * until this probe lands) is adjudicated by the verdict: confirmed lifts it,
 * refuted maintains it. The frame (scrum/plan/harmonic-comprehension-map.md
 * sections 2.6/2.7) is interpretation vocabulary, never design input.
 * Session prose is context, not evidence.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
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

import {
  windowAnalysis,
  shapeClassOf,
  verdictOf,
  compactAnalysis,
} from "./build-bl084-window-ladder.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..");

export const SCHEMA_VERSION = "harmonic-orrery.bl087-klein-ladder-probe.v1";
export const INVESTIGATION_ID = "BL087_KLEIN_LADDER_PROBE_V1";
export const OUTPUT_PATH = "orrery/src/generated/bl087-klein-ladder-probe.v1.json";
export const NETWORK_PATH = "canonical/universal-network-data.json";
export const LEDGER_PATH = HEPTATONIC_LEDGER_PATH;
export const BL075_PATH = "orrery/src/generated/bl075-coordinate-search.v1.json";
export const BL076_PATH = "orrery/src/generated/bl076-bijection-probe.v1.json";
export const BL084_PATH = "orrery/src/generated/bl084-window-ladder.v1.json";
export const BL073_PATH = "orrery/src/generated/bl073-isometry-probe.v1.json";
export const BL072_PATH = "orrery/src/generated/bl072-composite-mechanism.v1.json";
export const PROBE_PATH = "orrery/src/generated/d-tier-operator-probe.v1.json";
export const BL086_MEMO_PATH = "scrum/plan/bl-086-term-b-own-tier-memo.md";
export const MAP_CATALOG = [
  { id: "T1", unit: 5 },
  { id: "T2", unit: 7 },
  { id: "RHO", unit: 11 },
  { id: "ID", unit: 1 },
];
export const ANCHOR_TIERS = ["A0", "A1", "A2", "D1", "D2", "D3", "D4", "D5", "D6", "D7"];

// ==== INTRINSIC-KLEIN-BEGIN (ledger masks + affine order imaging + window machinery) ====
// This region derives masks from pitch sets, applies the pc-affine maps to
// states, images orders, classifies the induced position permutations, and
// recomputes window censuses through the shared windowAnalysis code path. It
// reads no landed artifact, no order, and no label beyond the ledger's masks
// and tier/role partition.

function cmp(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

export function maskOfRow(row) {
  let mask = 0;
  for (const pitch of parsePitchSet(row.pitchSet)) mask |= 1 << pitch;
  if (mask !== Number(row.id)) {
    fail(`ledger row ${row.id}: mask derived from the pitch set disagrees with the id field`);
  }
  return mask;
}

export function affineMapOfMask(mask, unit, translation) {
  let image = 0;
  for (let pitch = 0; pitch < 12; pitch += 1) {
    if ((mask >> pitch) & 1) image |= 1 << ((((unit * pitch + translation) % 12) + 12) % 12);
  }
  return image & 4095;
}

export function hamming12(left, right) {
  let value = left ^ right;
  let count = 0;
  while (value !== 0) {
    count += value & 1;
    value >>= 1;
  }
  return count;
}

export function pcSumOfMask(mask) {
  let sum = 0;
  for (let pitch = 0; pitch < 12; pitch += 1) if ((mask >> pitch) & 1) sum += pitch;
  return sum;
}

export function tierSatelliteLayer(ledgerRows, tier) {
  return ledgerRows
    .filter((row) => row.tier === tier && row.role === "satellite")
    .map((row) => String(row.id))
    .sort((left, right) => Number(left) - Number(right));
}

export function mapOrder(orderStates, masks, rowByMask, unit) {
  const image = [];
  const absent = [];
  for (const state of orderStates) {
    const imageMask = affineMapOfMask(masks.get(state), unit, 0);
    const row = rowByMask.get(imageMask);
    if (row === undefined) {
      absent.push({ state, mask: masks.get(state), imageMask });
      image.push(null);
      continue;
    }
    image.push(String(row.id));
  }
  return { image, absent };
}

export function familyOfOrder(orderStates, rowById) {
  const families = [...new Set(orderStates.map((state) => rowById.get(state).forte))];
  return families.length === 1 ? families[0] : null;
}

export function tierOfOrder(orderStates, rowById) {
  const tiers = [...new Set(orderStates.map((state) => rowById.get(state).tier))];
  return tiers.length === 1 ? tiers[0] : null;
}

export function sourcePositionSequence(imageOrder, baseOrder) {
  const baseIndex = new Map(baseOrder.map((state, index) => [state, index]));
  if (!imageOrder.every((state) => baseIndex.has(state))) return null;
  return imageOrder.map((state) => baseIndex.get(state));
}

export function inversionsOf(sequence) {
  let inversions = 0;
  for (let left = 0; left < sequence.length; left += 1) {
    for (let right = left + 1; right < sequence.length; right += 1) {
      if (sequence[left] > sequence[right]) inversions += 1;
    }
  }
  return inversions;
}

export function permutationForm(sequence) {
  const n = sequence.length;
  const identity = [...Array(n).keys()];
  if (canonicalText(sequence) === canonicalText(identity)) return { form: "identity", fixedIndex: null };
  for (let shift = 1; shift < n; shift += 1) {
    const rotation = identity.map((index) => (index + shift) % n);
    if (canonicalText(sequence) === canonicalText(rotation)) return { form: "rotation", fixedIndex: null };
  }
  for (let center = 0; center < n; center += 1) {
    const reflection = identity.map((index) => (((2 * center - index) % n) + n) % n);
    if (canonicalText(sequence) === canonicalText(reflection)) return { form: "reflection", fixedIndex: center };
  }
  return { form: "non-dihedral", fixedIndex: null };
}

export function wrapPairFixed(sequence) {
  const n = sequence.length;
  const positionOf = (sourcePosition) => sequence.indexOf(sourcePosition);
  const first = positionOf(0);
  const last = positionOf(n - 1);
  return (first === 0 && last === n - 1) || (first === n - 1 && last === 0);
}

export function permutationReport(imageOrder, baseOrder) {
  const sequence = sourcePositionSequence(imageOrder, baseOrder);
  if (sequence === null) return null;
  const inversions = inversionsOf(sequence);
  const { form, fixedIndex } = permutationForm(sequence);
  return {
    sourcePositionSequence: sequence,
    inversions,
    parity: inversions % 2 === 0 ? "even" : "odd",
    form,
    fixedIndex,
    phiClass: form === "identity" || form === "rotation"
      ? "phi-1-aligned (forward orientation)"
      : form === "reflection"
        ? "phi-2-aligned (chiral orientation)"
        : "non-dihedral",
    wrapPairFixed: wrapPairFixed(sequence),
  };
}

export function windowReport(orderStates, layerStates, masks, allIds) {
  const analysis = windowAnalysis(orderStates, layerStates, masks, allIds);
  const spanning = analysis.windows
    .filter((window) => !window.consecutive)
    .map((window) => ({
      state: window.state,
      parents: window.parents,
      indices: window.indices,
      span: [window.start, window.end],
      size: window.size,
    }));
  return {
    compact: compactAnalysis(orderStates, analysis),
    spanningWindows: spanning,
    windows: analysis.windows.map((window) => ({
      state: window.state,
      parents: window.parents,
      indices: window.indices,
      start: window.start,
      end: window.end,
      size: window.size,
      consecutive: window.consecutive,
      terminal: window.terminal,
    })),
  };
}

export function cutSensitivity(orderStates, layerStates, masks, allIds) {
  const cuts = [];
  for (let shift = 0; shift < orderStates.length; shift += 1) {
    const rotated = [...orderStates.slice(shift), ...orderStates.slice(0, shift)];
    const analysis = windowAnalysis(rotated, layerStates, masks, allIds);
    cuts.push({
      shift,
      first: rotated[0],
      allConsecutive: analysis.allConsecutive,
      verdict: verdictOf(analysis),
      shapeClass: shapeClassOf(analysis),
      sizeHistogram: analysis.sizeHistogram,
    });
  }
  return cuts;
}

export function windowsAreCyclicIntervals(orderStates, layerStates, masks, allIds) {
  const size = orderStates.length;
  const analysis = windowAnalysis(orderStates, layerStates, masks, allIds);
  return analysis.windows.every((window) => {
    if (window.indices.length === 1) return true;
    for (let start = 0; start < size; start += 1) {
      const run = new Set();
      for (let step = 0; step < window.indices.length; step += 1) run.add((start + step) % size);
      if (run.size === window.indices.length && window.indices.every((index) => run.has(index))) return true;
    }
    return false;
  });
}
// ==== INTRINSIC-KLEIN-END ====

// ---- comparison region: the landed orders, layers, tables, and chain
// ---- fingerprint artifacts are read and self-checked here ------------------

export const PRE_REGISTRATION = {
  approved: "2026-10-14 (planning pass; read-only design; probe phase separately authorized)",
  rulings: [
    {
      id: "H2-criterion",
      decision: "dihedral matching primary (sequence equality up to rotation and/or reversal); set-equality reported as a component fact; dihedral-fail with set-pass is a partial identification, recorded not promoted",
    },
    {
      id: "H1-H3-base",
      decision: "the A0 own-tier order x its own-tier layer is the single manipulation base (the only FULL case with the Branch-L ladder + Term-B correspondence, tied to BL-086); one FULL case suffices for the manipulation test; D7 rows are recorded as extension diagnostics of the same frozen predictions",
    },
    {
      id: "ledger-absent-images",
      decision: "an image mask outside the 462-record universe, or an image order that does not resolve to a single family/tier, is a fail-loud fragment fact (the BL-076 OD-76-2 precedent); no silent layer substitution, no empirical re-targeting",
    },
    {
      id: "landing-form",
      decision: "machine-checkable artifact + independent validator + pins (the directive's deliverable 3; the result is mechanical: window-structure recomputation produces checkable counts and patterns)",
    },
  ],
  operationalizations: [
    {
      id: "OP-1",
      text: "apply K to an addressing order = image the sequence elementwise: [K(s) for s in order], where the state encoding is the 12-bit pc mask (pc p set => bit p) and K is the pc-affine map x -> u*x (mod 12), t = 0, for u in {1,5,7,11} (the BL-075 canonically determined carriers); the image order is resolved back to ledger state ids",
    },
    {
      id: "OP-1-sanity-gate",
      text: "before any hypothesis test: T1(D7 order) must equal the landed A0 order exactly; T2(D7 order) must equal the A0 reversed order exactly; the full induced family action table for all four maps must reproduce BL-076's landed familyPermutation key-for-key; any mismatch is a halt",
    },
    {
      id: "OP-2",
      text: "the window structure is recomputed through the BL-084 windowAnalysis code path (masks-only Hamming-2 reach arithmetic; the OD-84-5 same-code-path discipline); the corresponding landed layer of an image order = the BL-084-recorded top layer of the image anchors' tier (A0 -> A0; A1 -> A2; D7 -> D6; D6 -> A2); an image order whose tier has no landed top layer is recorded as a fail-loud fragment, not computed",
    },
    {
      id: "OP-3",
      text: "the H2 comparison is applied before comparing: dihedral first (all rotations and reversals), set-equality second as component evidence",
    },
    {
      id: "OP-4",
      text: "an elementwise map preserves Hamming distance, so parent sets are invariant as anchor sets; the re-imaging only permutes the parent indices (positions); this is the mechanism space the probe tests",
    },
  ],
  predictions: [
    {
      id: "H1",
      text: "the RHO-image of the A0 own-tier order loses consecutiveness: allConsecutive false, with spanning [0,6] windows at the image's endpoints",
      refutation: "(a) the RHO-image stays consecutive (RHO does not destroy)",
    },
    {
      id: "H2",
      text: "the landed A1 order is the RHO-image of a consecutive landed addressing order (candidates: the A0 order, the D7 order - the landed consecutive orders) under the dihedral criterion",
      refutation: "(b) the A1 order is not the RHO-image of any consecutive landed order under the pre-registered criterion (the spanning is not RHO's signature)",
    },
    {
      id: "H3",
      text: "the T1-image of the A0 order preserves consecutiveness: TWO_REGIME with mirror as landed (the D7 ladder profile read from the A0 side)",
      refutation: "(c) the T1-image breaks contiguity (T1 does not preserve)",
    },
    {
      id: "H4",
      text: "T2 = RHO o T1 (11*5 = 55 = 7 mod 12; abelian) destroys; the pin: T2(A0 order) equals the A0 reversed order and its window structure shows the [0,6] spanning pattern (not some other non-consecutive pattern); ID trivially preserves (method sanity)",
      refutation: "the destruction claim or the identity pin fails; ID breaks (method failure)",
    },
  ],
  refutationConditions: [
    { id: "a", text: "the RHO-image of a FULL-ladder order stays consecutive (RHO does not destroy)" },
    { id: "b", text: "the A1 order is not the RHO-image of any consecutive landed order under the pre-registered matching criterion" },
    { id: "c", text: "the T1-image of a consecutive order breaks contiguity (T1 does not preserve)" },
    { id: "partial", text: "RHO explains some spanning cases but not all -> the interpretation is scoped to the cases it explains, not refuted outright" },
  ],
  fenceNote: "no leaning until this probe lands: the D7 derivation route may not cite the Klein-4 role; the verdict adjudicates the fence (confirmed lifts it / refuted maintains it) and the adjudication is stated in the synthesis",
};

function fingerprintSelfCheck(artifact, label, idKey, idValue, fingerprintKey) {
  const { [fingerprintKey]: fingerprint, ...core } = artifact;
  if (artifact[idKey] !== idValue || artifact.status !== "planning_evidence") fail(`${label} artifact header drift`);
  if (sha256(canonicalText(core)) !== fingerprint) fail(`${label} fingerprint self-check failed`);
  return fingerprint;
}

function orderFromNetwork(network) {
  const successor = new Map(network.d7ModalRows.map((row) => [String(row.source), String(row.target)]));
  const order = [];
  let cursor = "127";
  for (let step = 0; step < 7; step += 1) {
    order.push(cursor);
    const next = successor.get(cursor);
    if (!next) fail(`modal orbit dead-end at ${cursor}`);
    cursor = next;
  }
  if (cursor !== "127") fail("modal orbit does not close");
  return order;
}

function dihedralVariants(sequence) {
  const variants = [];
  for (let shift = 0; shift < sequence.length; shift += 1) {
    const forward = [...sequence.slice(shift), ...sequence.slice(0, shift)];
    variants.push(forward);
    variants.push([...forward].reverse());
  }
  return variants;
}

function dihedralMatch(candidate, target) {
  return dihedralVariants(candidate).some((variant) => canonicalText(variant) === canonicalText(target));
}

function setEqual(left, right) {
  return canonicalText([...left].sort(cmp)) === canonicalText([...right].sort(cmp));
}

function buildInvestigation() {
  const ledgerRows = parseCsv(read(LEDGER_PATH));
  const network = readJson(NETWORK_PATH);
  const bl075 = readJson(BL075_PATH);
  const bl076 = readJson(BL076_PATH);
  const bl084 = readJson(BL084_PATH);
  const bl073 = readJson(BL073_PATH);
  const bl072 = readJson(BL072_PATH);
  const probe = readJson(PROBE_PATH);
  if (ledgerRows.length !== 462) fail(`heptatonic ledger census is ${ledgerRows.length}`);

  // ---- chain self-checks (fingerprints; no literals in this generator) ----
  const bl075Fingerprint = fingerprintSelfCheck(bl075, "BL-075", "investigationId", "BL075_COORDINATE_SEARCH_V1", "investigationFingerprint");
  const bl076Fingerprint = fingerprintSelfCheck(bl076, "BL-076", "investigationId", "BL076_BIJECTION_PROBE_V1", "investigationFingerprint");
  const bl084Fingerprint = fingerprintSelfCheck(bl084, "BL-084", "investigationId", "BL084_WINDOW_LADDER_V1", "investigationFingerprint");
  const bl073Fingerprint = fingerprintSelfCheck(bl073, "BL-073", "investigationId", "BL073_ISOMETRY_PROBE_V1", "investigationFingerprint");
  const bl072Fingerprint = fingerprintSelfCheck(bl072, "BL-072", "investigationId", "BL072_COMPOSITE_MECHANISM_V1", "investigationFingerprint");
  const probeFingerprint = fingerprintSelfCheck(probe, "d-tier operator probe", "probeId", "D_TIER_OPERATOR_PROBE_v1", "probeFingerprint");

  // ---- masks, layers, and lookup maps (masks-only) ------------------------
  const masks = new Map(ledgerRows.map((row) => [String(row.id), maskOfRow(row)]));
  const allIds = ledgerRows.map((row) => String(row.id));
  const rowById = new Map(ledgerRows.map((row) => [String(row.id), row]));
  const rowByMask = new Map(ledgerRows.map((row) => [maskOfRow(row), row]));

  // ---- the landed orders (comparison inputs) ------------------------------
  const d7Order = orderFromNetwork(network);
  const a0Order = bl073.cycles.A0.order.slice();
  if (a0Order.length !== 7 || a0Order[0] !== "1387" || a0Order[6] !== "2773") fail("BL-073 A0 order drift");
  const a0Closure = bl073.cycles.A0.closureEdge;
  if (a0Closure.a !== "2773" || a0Closure.b !== "1387" || a0Closure.rotateInterval !== 6 || a0Closure.hamming !== 10) fail("BL-073 A0 closure drift");
  const a1Cycle = probe.modalClosure.aToA.cycles.find((cycle) => cycle.tier === "A1");
  if (!a1Cycle) fail("d-tier operator probe: A1 cycle missing");
  const a1Order = a1Cycle.stateIds.map(String);
  const a1Supp = bl084.scopeB.supplementaryCycles.find((record) => record.tier === "A1");
  if (!a1Supp || canonicalText(a1Supp.order) !== canonicalText(a1Order)) fail("A1 order disagrees with the BL-084 supplementary order");
  const a0Supp = bl084.scopeB.supplementaryCycles.find((record) => record.tier === "A0");
  if (!a0Supp || canonicalText(a0Supp.order) !== canonicalText(a0Order)) fail("A0 order disagrees with the BL-084 supplementary order");

  // ---- the corresponding-layer rule (from the BL-084 landed top layers) ----
  const correspondingLayerRule = {
    source: "the BL-084-recorded top layer of the image anchors' tier",
    map: {
      A0: a0Supp.topLayers[0],
      A1: a1Supp.topLayers[0],
      D7: bl084.scopeB.cycles.find((record) => record.tier === "D7").topLayers[0],
      D6: bl084.scopeB.cycles.find((record) => record.tier === "D6").topLayers[0],
    },
  };
  if (canonicalText(correspondingLayerRule.map) !== canonicalText({ A0: "A0", A1: "A2", D7: "D6", D6: "A2" })) {
    fail("the corresponding-layer rule drifted from the landed top layers");
  }

  // ---- the sanity gate (OP-1) ---------------------------------------------
  const t1OnD7 = mapOrder(d7Order, masks, rowByMask, 5);
  const t2OnD7 = mapOrder(d7Order, masks, rowByMask, 7);
  if (t1OnD7.absent.length !== 0 || t2OnD7.absent.length !== 0) fail("sanity gate: a carrier image is ledger-absent");
  const gateT1 = canonicalText(t1OnD7.image) === canonicalText(a0Order);
  const gateT2 = canonicalText(t2OnD7.image) === canonicalText([...a0Order].reverse());
  if (!gateT1) fail("sanity gate failed: T1(D7 order) does not equal the landed A0 order");
  if (!gateT2) fail("sanity gate failed: T2(D7 order) does not equal the A0 reversed order");

  const familyActionReproduction = [];
  let familyTableMismatches = 0;
  for (const map of MAP_CATALOG) {
    const recorded = bl076.probe.familyPermutation[map.id];
    if (!Array.isArray(recorded) || recorded.length !== ANCHOR_TIERS.length) fail(`BL-076 family table missing for ${map.id}`);
    for (const entry of recorded) {
      const rows = ledgerRows
        .filter((row) => row.tier === entry.tier && row.role === "anchor")
        .sort((left, right) => Number(left.id) - Number(right.id));
      if (rows.length !== 7) fail(`tier ${entry.tier}: anchor census drift`);
      const imageFamilies = rows.map((row) => {
        const imageRow = rowByMask.get(affineMapOfMask(maskOfRow(row), map.unit, 0));
        return imageRow ? { family: imageRow.forte, tier: imageRow.tier } : null;
      });
      if (imageFamilies.some((image) => image === null)) fail(`sanity gate: ${map.id} on ${entry.tier} produced a ledger-absent anchor image`);
      const families = [...new Set(imageFamilies.map((image) => image.family))];
      const tiers = [...new Set(imageFamilies.map((image) => image.tier))];
      const matches = families.length === 1 && tiers.length === 1
        && families[0] === entry.imageFamily && tiers[0] === entry.imageTier;
      if (!matches) familyTableMismatches += 1;
      familyActionReproduction.push({
        map: map.id,
        tier: entry.tier,
        sourceFamily: entry.sourceFamily,
        recordedImageFamily: entry.imageFamily,
        computedImageFamily: families.length === 1 ? families[0] : families,
        recordedImageTier: entry.imageTier,
        computedImageTier: tiers.length === 1 ? tiers[0] : tiers,
        matches,
      });
    }
  }
  if (familyTableMismatches !== 0) fail(`sanity gate failed: ${familyTableMismatches} family-table mismatches against BL-076`);
  const sanityGate = {
    checks: [
      { id: "SG-1", text: "T1(D7 order) equals the landed A0 order exactly", pass: gateT1 },
      { id: "SG-2", text: "T2(D7 order) equals the A0 reversed order exactly", pass: gateT2 },
      { id: "SG-3", text: "the induced family action of all four maps reproduces BL-076's familyPermutation key-for-key (40/40 rows)", pass: familyTableMismatches === 0 },
    ],
    verdict: "PASS",
    note: "the operationalization is verified against three landed sources (the BL-076 action table, the BL-075/BL-073 orders, the BL-076 mask catalog) before any hypothesis is tested",
  };

  // ---- the test matrix: maps x landed orders ------------------------------
  const orders = { A0: a0Order, D7: d7Order, A1: a1Order };
  const layerForTier = (tier) => correspondingLayerRule.map[tier] ?? null;
  const matrixRows = [];
  for (const orderId of ["A0", "D7", "A1"]) {
    const baseOrder = orders[orderId];
    for (const map of MAP_CATALOG) {
      const { image, absent } = mapOrder(baseOrder, masks, rowByMask, map.unit);
      const imageFamily = absent.length === 0 ? familyOfOrder(image, rowById) : null;
      const imageTier = absent.length === 0 ? tierOfOrder(image, rowById) : null;
      const layerTier = imageTier !== null ? layerForTier(imageTier) : null;
      const report = layerTier !== null && absent.length === 0
        ? windowReport(image, tierSatelliteLayer(ledgerRows, layerTier), masks, allIds)
        : null;
      matrixRows.push({
        id: `${map.id}-on-${orderId}`,
        map: map.id,
        unit: map.unit,
        sourceOrder: orderId,
        baseOrder,
        imageOrder: image,
        absent,
        imageFamily,
        imageTier,
        correspondingLayer: layerTier,
        permutation: permutationReport(image, baseOrder),
        windowReport: report,
        scope: orderId === "A0" ? "primary (the ruled manipulation base)" : "extension diagnostic (same frozen prediction class)",
      });
    }
  }
  const rowFor = (mapId, orderId) => matrixRows.find((row) => row.id === `${mapId}-on-${orderId}`);
  const railSafe = (row) => {
    if (row.absent.length !== 0) fail(`${row.id}: ledger-absent image (fail-loud fragment)`);
    if (row.windowReport === null) fail(`${row.id}: no corresponding landed layer`);
    return row;
  };

  const idOnA0 = railSafe(rowFor("ID", "A0"));
  const rhoOnA0 = railSafe(rowFor("RHO", "A0"));
  const t1OnA0 = railSafe(rowFor("T1", "A0"));
  const t2OnA0 = railSafe(rowFor("T2", "A0"));
  const rhoOnD7 = railSafe(rowFor("RHO", "D7"));
  const idOnA1 = railSafe(rowFor("ID", "A1"));
  const rhoOnA1 = railSafe(rowFor("RHO", "A1"));
  const t1OnA1 = railSafe(rowFor("T1", "A1"));
  const t2OnA1 = railSafe(rowFor("T2", "A1"));

  // ---- H1: RHO on the A0 own-tier order ------------------------------------
  const h1Predicted = "allConsecutive false; spanning [0,6] windows at the image endpoints";
  const h1Observed = {
    imageEqualsReversal: canonicalText(rhoOnA0.imageOrder) === canonicalText([...a0Order].reverse()),
    allConsecutive: rhoOnA0.windowReport.compact.allConsecutive,
    spanningCount: rhoOnA0.windowReport.spanningWindows.length,
    permutation: rhoOnA0.permutation,
  };
  const h1Refuted = h1Observed.allConsecutive === true && h1Observed.spanningCount === 0;
  const h1 = {
    id: "H1",
    prediction: h1Predicted,
    observed: h1Observed,
    refutationConditionFired: h1Refuted ? "a" : null,
    verdict: h1Refuted ? "REFUTED" : "CONFIRMED",
    reading: h1Refuted
      ? "the RHO-image of the A0 order is the exact reversal; the reversal reverses each window's index set, and reversal preserves linear consecutiveness - the A0 own-tier census is unchanged (FULL); RHO does not destroy"
      : "unexpected: reconcile before promoting",
  };

  // ---- H3: T1 on the A0 own-tier order -------------------------------------
  const h3Observed = {
    imageEqualsD7Order: canonicalText(t1OnA0.imageOrder) === canonicalText(d7Order),
    census: t1OnA0.windowReport.compact,
    permutation: t1OnA0.permutation,
  };
  const h3SubChecks = {
    allConsecutive: h3Observed.census.allConsecutive === true,
    twoRegime: h3Observed.census.shapeClass === "TWO_REGIME",
    mirror: h3Observed.census.mirror === true,
    profileExact: canonicalText(h3Observed.census.sizeHistogram) === canonicalText({ "1": 2, "2": 2, "3": 10 })
      && canonicalText(h3Observed.census.perAnchorCounts) === canonicalText([4, 5, 6, 6, 6, 5, 4]),
  };
  const h3Confirmed = Object.values(h3SubChecks).every(Boolean);
  const h3 = {
    id: "H3",
    prediction: "the T1-image of the A0 order preserves consecutiveness: TWO_REGIME with mirror as landed (the D7 ladder profile read from the A0 side)",
    observed: h3Observed,
    subChecks: h3SubChecks,
    refutationConditionFired: h3Confirmed ? null : "c",
    verdict: h3Confirmed ? "CONFIRMED" : "REFUTED",
    reading: h3Confirmed
      ? "T1 transports the A0 order onto the landed D7 order exactly (T1 is an involution); the D6 census is the FULL two-regime ladder, mirror-symmetric; T1 preserves and the H3 leg of the group-theoretic picture holds"
      : "unexpected: reconcile before promoting",
  };

  // ---- H4: T2 and ID controls ----------------------------------------------
  const t2PredictedReversal = canonicalText(t2OnA0.imageOrder) === canonicalText([...a0Order].reverse());
  const t2Observed = {
    identityPinHolds: t2PredictedReversal,
    actualImageIsD7Reversal: canonicalText(t2OnA0.imageOrder) === canonicalText([...d7Order].reverse()),
    census: t2OnA0.windowReport.compact,
    spanningCount: t2OnA0.windowReport.spanningWindows.length,
  };
  const t2DestructionRefuted = t2Observed.census.allConsecutive === true && t2Observed.spanningCount === 0;
  const idObserved = {
    imageEqualsBase: canonicalText(idOnA0.imageOrder) === canonicalText(a0Order),
    censusEqualsLanded: canonicalText(idOnA0.windowReport.compact.sizeHistogram) === canonicalText({ "1": 28, "2": 10 })
      && idOnA0.windowReport.compact.allConsecutive === true,
  };
  const idSanityPass = idObserved.imageEqualsBase && idObserved.censusEqualsLanded;
  const h4Refuted = !t2PredictedReversal || t2DestructionRefuted;
  const h4 = {
    id: "H4",
    prediction: "T2 = RHO o T1 destroys; the pin: T2(A0 order) equals the A0 reversed order with the [0,6] spanning pattern; ID trivially preserves",
    derivedOnPaper: "T2 = RHO o T1 because 11*5 = 55 = 7 (mod 12); the composition is abelian; the destroying factor was predicted to dominate",
    observed: {
      t2IdentityPin: t2PredictedReversal,
      t2Actual: t2Observed.actualImageIsD7Reversal ? "the D7 reversed order" : "other (record below)",
      t2Image: t2OnA0.imageOrder,
      t2Census: t2Observed.census,
      t2SpanningCount: t2Observed.spanningCount,
      id: idObserved,
    },
    subChecks: {
      identityPin: t2PredictedReversal,
      destructionClaim: !t2DestructionRefuted,
      idPreserves: idSanityPass,
    },
    refutationConditionFired: h4Refuted ? "destruction claim and/or identity pin failed" : null,
    verdict: h4Refuted ? "REFUTED" : "CONFIRMED",
    reading: h4Refuted
      ? "the group-theoretic derivation T2 = RHO o T1 is arithmetically true, but the inheritance step fails: RHO's effect is pairing-dependent (it is the reversal on the A0/D7 orders, and reversal preserves consecutiveness); T2(A0) is the D7 reversed order, whose D6 census is the FULL ladder; no destruction occurs and the identity pin (A0 reversal) is false"
      : "unexpected: reconcile before promoting",
  };

  // ---- H2: is the A1 order the RHO-image of a consecutive landed order? ----
  const h2Candidates = ["A0", "D7"].map((orderId) => {
    const row = railSafe(rowFor("RHO", orderId));
    return {
      source: orderId,
      sourceIsConsecutive: orderId === "A0" ? idOnA0.windowReport.compact.allConsecutive : railSafe(rowFor("ID", "D7")).windowReport.compact.allConsecutive,
      imageOrder: row.imageOrder,
      imageFamily: row.imageFamily,
      setEqual: setEqual(row.imageOrder, a1Order),
      dihedralMatch: dihedralMatch(row.imageOrder, a1Order),
    };
  });
  const h2ContextRows = [];
  for (const orderId of ["A0", "D7"]) {
    for (const map of MAP_CATALOG) {
      const row = railSafe(rowFor(map.id, orderId));
      h2ContextRows.push({
        map: map.id,
        source: orderId,
        setEqual: setEqual(row.imageOrder, a1Order),
        dihedralMatch: dihedralMatch(row.imageOrder, a1Order),
      });
    }
  }
  const h2AnyMatch = h2Candidates.some((candidate) => candidate.dihedralMatch);
  const h2Partial = !h2AnyMatch && h2Candidates.some((candidate) => candidate.setEqual);
  const h2 = {
    id: "H2",
    prediction: "the landed A1 order is the RHO-image of a consecutive landed addressing order (candidates: the A0 order, the D7 order) under the dihedral criterion",
    candidates: h2Candidates,
    contextTable: h2ContextRows,
    refutationConditionFired: h2AnyMatch ? null : "b",
    verdict: h2AnyMatch ? "CONFIRMED" : h2Partial ? "PARTIAL" : "REFUTED",
    reading: h2AnyMatch
      ? "unexpected: reconcile before promoting"
      : h2Partial
        ? "partial identification: states are RHO-related as sets but not cycle-preservingly; recorded, not promoted"
        : "no consecutive landed order maps to the A1 order under RHO in either direction: RHO fixes each anchor family, so a RHO-image stays on its source family - the A0 and D7 orders image to themselves (reversed) and can never equal the A1 order; the spanning is not RHO's signature",
  };

  // ---- diagnostics (post-registration, descriptive, non-verdict-bearing) ----
  const rhoA1Relocation = {
    note: "post-registration diagnostic: the RHO-image of the A1 order is itself non-consecutive with the same profile - the spanning relocates; it is neither created nor removed by RHO",
    imageOrder: rhoOnA1.imageOrder,
    permutation: rhoOnA1.permutation,
    census: rhoOnA1.windowReport.compact,
    spanningWindows: rhoOnA1.windowReport.spanningWindows,
    baseSpanningWindows: idOnA1.windowReport.spanningWindows,
    baseCensus: idOnA1.windowReport.compact,
    closureEdge: a1Supp.edgeStructure.closureEdge,
    reading: "the landed A1 spanning pair (1359/1401) is co-parented by the cycle endpoints (the closure edge 1389 -> 1371): both states are Hamming-2 from both endpoints. RHO acts on the A1 order as the reflection fixing index 5 (the source position sequence [3,2,1,0,6,5,4]), which moves the closure-endpoint pair from the wrap to the interior {3,4} and moves the pair {2901,1749} to the wrap; the spanning relocates to the states co-parented by {2901,1749} (3669/981). RHO changes no parent sets (affine maps preserve Hamming distance); it only permutes positions.",
  };
  const cutSensitivityDiagnostic = {
    note: "post-registration diagnostic: consecutiveness is cut-relative (the window span is read on the linear order); rotating each landed order through its seven cuts shows which cuts are consecutive",
    allWindowsCyclicIntervals: {
      A0: windowsAreCyclicIntervals(a0Order, tierSatelliteLayer(ledgerRows, "A0"), masks, allIds),
      D7: windowsAreCyclicIntervals(d7Order, tierSatelliteLayer(ledgerRows, "D6"), masks, allIds),
      A1: windowsAreCyclicIntervals(a1Order, tierSatelliteLayer(ledgerRows, "A2"), masks, allIds),
    },
    A0: cutSensitivity(a0Order, tierSatelliteLayer(ledgerRows, "A0"), masks, allIds),
    D7: cutSensitivity(d7Order, tierSatelliteLayer(ledgerRows, "D6"), masks, allIds),
    A1: cutSensitivity(a1Order, tierSatelliteLayer(ledgerRows, "A2"), masks, allIds),
    reading: "every window in all three censuses is a cyclic interval (verified); hence a cut is non-consecutive exactly when the two anchors adjacent across the cut are jointly co-parented by a layer window; the A1 landed cut sits at the closure edge, whose endpoints are co-parented (the [0,6] spanning pair); the A0 landed cut sits at its closure edge, whose endpoints are not co-parented",
  };
  const extensionRows = {
    note: "post-registration extension diagnostics: the T1/T2 images of the A1 order (the same frozen prediction class applied off-base)",
    T1onA1: { imageOrder: t1OnA1.imageOrder, imageFamily: t1OnA1.imageFamily, imageTier: t1OnA1.imageTier, correspondingLayer: t1OnA1.correspondingLayer, census: t1OnA1.windowReport.compact, spanningCount: t1OnA1.windowReport.spanningWindows.length },
    T2onA1: { imageOrder: t2OnA1.imageOrder, imageFamily: t2OnA1.imageFamily, imageTier: t2OnA1.imageTier, correspondingLayer: t2OnA1.correspondingLayer, census: t2OnA1.windowReport.compact, spanningCount: t2OnA1.windowReport.spanningWindows.length },
  };
  const d2TrioPairs = [["471", "1479"], ["2283", "2787"], ["3189", "3441"]];
  const d2Trio = {
    note: "comparison-only re-verification of the BL-074 dual-phenomenon trio (rotation-6 and displacement-6 coincide on these three D2 anchor pairs)",
    pairs: d2TrioPairs.map(([left, right]) => {
      const leftMask = masks.get(left);
      const rightMask = masks.get(right);
      const rot6Relation = affineMapOfMask(leftMask, 1, 6) === rightMask || affineMapOfMask(rightMask, 1, 6) === leftMask;
      const displacement = Math.abs(pcSumOfMask(leftMask) - pcSumOfMask(rightMask));
      return {
        pair: [left, right],
        tiers: [rowById.get(left).tier, rowById.get(right).tier],
        rotation6: rot6Relation,
        pcSumDisplacement: displacement,
        displacement6: displacement === 6,
        dualPhenomenon: rot6Relation && displacement === 6,
      };
    }),
    allDual: d2TrioPairs.every(([left, right]) => {
      const leftMask = masks.get(left);
      const rightMask = masks.get(right);
      return (affineMapOfMask(leftMask, 1, 6) === rightMask || affineMapOfMask(rightMask, 1, 6) === leftMask)
        && Math.abs(pcSumOfMask(leftMask) - pcSumOfMask(rightMask)) === 6;
    }),
  };

  // ---- the unlanded flag (the grounding receipt's explicit note) -----------
  const bl086MemoText = read(BL086_MEMO_PATH);
  const kleinMentionCount = (bl086MemoText.match(/Klein/g) ?? []).length;
  if (kleinMentionCount !== 0) fail(`BL-086 memo gained ${kleinMentionCount} Klein mention(s); the zero-Klein grounding must be reconciled`);
  const unlandedFlag = {
    memo: BL086_MEMO_PATH,
    memoSha256: sha256(bl086MemoText),
    kleinMentionCount,
    statement: "the RHO/T1 interpretation is unlanded session prose: the BL-086 memo carries zero Klein mentions (verified mechanically); the interpretation enters this probe only as the hypothesis under test",
  };

  // ---- synthesis -----------------------------------------------------------
  const refutationFired = { a: h1Refuted, b: h2.verdict === "REFUTED", c: h3.verdict === "REFUTED" };
  const synthesis = {
    verdict: "INTERPRETATION_REFUTED_GEOMETRIC_FACT_STANDS",
    perHypothesis: { H1: h1.verdict, H2: h2.verdict, H3: h3.verdict, H4: h4.verdict },
    refutationConditionsFired: refutationFired,
    disposition: "the Klein-4's structural role in the ladder-consecutiveness pattern does not graduate to a measured finding: the RHO-destruction mechanism is refuted at both scales (H1 manipulation and H2 identification); what is measured is a characterization - RHO is the reversal on the A0/D7 orders (consecutiveness-preserving) and the reflection-fixing-5 on the A1 order (spanning-relocating) - and the A1 spanning stands on its own geometry: the closure-edge endpoints are co-parented, and the landed cut places that pair at the wrap",
    fenceStatus: "MAINTAINED: the no-leaning fence stays - the D7 derivation route may not cite the Klein-4 role as the ladder-consecutiveness explanation; the PARTIAL_DERIVATION stands without it (the refutation branch of the fence adjudication)",
    higherTheoremNote: "no higher-theorem answer; the mechanism inventory question is left with the geometric fact; no claim event; D7 hypothesis-tier throughout",
  };

  const sourceBindings = [
    { artifact: LEDGER_PATH, sha256: fileSha(LEDGER_PATH), role: "462-record pitch sets, masks, tiers, roles (masks-only)" },
    { artifact: NETWORK_PATH, sha256: fileSha(NETWORK_PATH), role: "the D7 modal orbit order (comparison input)" },
    { artifact: BL075_PATH, sha256: fileSha(BL075_PATH), role: "the Klein-4 carriers and the landed image orders (comparison/self-check)" },
    { artifact: BL076_PATH, sha256: fileSha(BL076_PATH), role: "the landed family action table (sanity-gate reproduction)" },
    { artifact: BL084_PATH, sha256: fileSha(BL084_PATH), role: "the landed layer censuses and the corresponding-layer rule (comparison)" },
    { artifact: BL073_PATH, sha256: fileSha(BL073_PATH), role: "the landed A0 order and closure (comparison)" },
    { artifact: BL072_PATH, sha256: fileSha(BL072_PATH), role: "the predicate artifact (context; the mechanical firing counts)" },
    { artifact: PROBE_PATH, sha256: fileSha(PROBE_PATH), role: "the landed A1 cycle order (comparison)" },
    { artifact: BL086_MEMO_PATH, sha256: fileSha(BL086_MEMO_PATH), role: "the zero-Klein unlanded flag (grounding receipt)" },
  ];

  const grounding = {
    kleinDefinition: "the Klein-4 = the units {1,5,7,11} of Z12; 11u = 7 (mod 12) forces u = 5 uniquely; 6u = 6 for every unit (BL-075)",
    naming: "T1 = x -> 5x (directed carrier); T2 = x -> 7x (reversed); RHO = x -> 11x (the pitch-circle reflection); ID = x -> x; T1 o T1 = T2 o T2 = RHO o RHO = ID; T1 o T2 = RHO; T2 = RHO o T1 (11*5 = 55 = 7 mod 12)",
    familyAction: "BL-076: the family-level involution 7-35 <-> 7-1, 7-34 <-> 7-8, 7-Z37 <-> 7-Z17; fixed 7-33/7-22/7-15/7-Z12; identical for T1/T2, trivial for {ID, RHO}; reproduced key-for-key by the sanity gate (40/40)",
    landedOrders: {
      D7: d7Order,
      A0: { order: a0Order, closureEdge: a0Closure },
      A1: { order: a1Order, closureEdge: a1Supp.edgeStructure.closureEdge },
    },
    landedCensuses: {
      A0ownTier: a0Supp.layers.find((layer) => layer.tier === "A0"),
      A1topA2: a1Supp.layers.find((layer) => layer.tier === "A2"),
    },
    chainFingerprints: { bl075Fingerprint, bl076Fingerprint, bl084Fingerprint, bl073Fingerprint, bl072Fingerprint, probeFingerprint },
    unlandedFlag,
    subject: "session prose is context, not evidence; every load-bearing claim cites landed artifacts",
  };

  const method = {
    windowMachinery: "imported verbatim from scripts/build-bl084-window-ladder.mjs (windowAnalysis, shapeClassOf, verdictOf, compactAnalysis) - the OD-84-5 same-code-path discipline: differences are data differences",
    imaging: "elementwise pc-affine map application over 12-bit masks; the image order is resolved back to ledger state ids; fail-loud on absent images",
    correspondingLayerRule: correspondingLayerRule.source,
    correspondenceTable: correspondingLayerRule.map,
    descriptiveRead: "the re-imaging and the window recomputation are analysis over landed bytes (the OD-74-1 descriptive-read class); no new measurement, no new universe, no new witness discovery",
  };

  const accounting = {
    masksOnly: [
      "the ledger's pitch sets, masks, and tier/role partition",
      "the pc-affine map application (x -> u*x, t = 0) and the order imaging",
      "the position-permutation classification (inversions, parity, dihedral form, wrap-fix)",
      "the window recomputation through the BL-084 windowAnalysis code path",
      "the cut-sensitivity rotation sweep and the D2-trio arithmetic",
    ],
    canonicalComputation: [
      "the landed orders: the network's D7 modal rows, BL-073's A0 order, the d-tier operator probe's A1 stateIds",
      "the BL-084 landed censuses and top layers (the corresponding-layer rule)",
      "the BL-076 family action table (the sanity-gate target)",
      "the BL-075 carrier definitions (grounding) and the chain fingerprints (self-checked)",
      "the BL-086 memo (the zero-Klein unlanded flag)",
    ],
    remainingGranted: [
      "the tier/role partition membership itself (the ledger's marking)",
      "the recorded cycle orders and their cuts (the landed presentation)",
      "presentation conventions and the frame vocabulary (never a design input)",
    ],
    statement: "the analysis is masks-only affine arithmetic plus re-imaging over landed orders and recomputation through the landed window code path; no new measurement occurs beyond the arithmetic the BL-070/precedent class licenses",
  };

  const fences = {
    noNewMeasurement: "the probe re-images landed orders over landed layers; masks-only arithmetic (the BL-070 precedent); a re-derivation of landed properties is analysis, not measurement",
    noLeaning: "the D7 derivation route may not cite the Klein-4 role until this probe lands; the verdict adjudicates (confirmed lifts / refuted maintains)",
    noClaimEvent: "no claim event; no record amendment (ENTRY 10/15/16/17/18/19/20/21 byte-untouched)",
    noGovernsAdmission: "no GOVERNS admission; no new GSL number; no GSL-7 status change; the mechanism finding is not registered",
    d7HypothesisTier: "D7 hypothesis-tier throughout (ENTRY 15's D7 clause carries forward verbatim, provenance/DECISION_LEDGER.md:2703-2712)",
    noG1: "no G1 movement; no INV-5 graduation; no M-walkability promotion; no directional-semantics assignment",
    noWrites: "no canonical/Court/schema/Neo4j writes",
    membrane: "the frame (harmonic-comprehension-map sections 2.6/2.7) is interpretation vocabulary, never a probe input",
    sessionProse: "session prose is context, not evidence",
  };

  const contractCitations = [
    "orrery/src/generated/bl075-coordinate-search.v1.json (the Klein-4 carriers, necessity, image orders)",
    "orrery/src/generated/bl076-bijection-probe.v1.json (the family action table; the OD-76-2 absent-image class)",
    "orrery/src/generated/bl084-window-ladder.v1.json (the windowAnalysis code path, the landed censuses, the top layers)",
    "orrery/src/generated/bl073-isometry-probe.v1.json (the A0 order and closure; the phi-1/phi-2 orientation classes)",
    "orrery/src/generated/bl072-composite-mechanism.v1.json (the predicate context; the mechanical firing)",
    "orrery/src/generated/d-tier-operator-probe.v1.json (the A1 cycle order)",
    "canonical/universal-heptatonic-ledger.csv (masks and the tier/role partition)",
    "canonical/universal-network-data.json (the D7 modal rows)",
    "scrum/plan/bl-086-term-b-own-tier-memo.md (the A1 spanning pair; the zero-Klein flag)",
    "scrum/plan/bl-074-tritone-anatomy-memo.md (the D2 dual-phenomenon trio; comparison-only)",
    "scrum/plan/bl-067-governs-semantic-synthesis.md (the governs semantic layer; no registration here)",
  ];

  const notAccomplished = [
    "no new measurement (re-imaging + recomputation over landed bytes; the OD-74-1/OD-1 descriptive-read class)",
    "no production/mechanism claim beyond the verdict (the why stays with the geometric fact)",
    "no claim event; no record amendment (ENTRY 10/15/16/17/18/19/20/21 byte-untouched)",
    "no GOVERNS admission; no new GSL number; no GSL-7 status change; no registration",
    "no G1 movement; no INV-5 graduation; no M-walkability promotion",
    "no leaning: the D7 derivation route may not cite the Klein-4 role (fence MAINTAINED on the refutation branch)",
    "no canonical/Court/schema/Neo4j writes; no directional-semantics assignment; D7 hypothesis-tier throughout",
  ];

  const core = {
    schemaVersion: SCHEMA_VERSION,
    investigationId: INVESTIGATION_ID,
    status: "planning_evidence",
    generator: "scripts/build-bl087-klein-ladder-probe.mjs",
    role: "the Klein-4 <-> ladder probe: does the Klein-4's action explain the ladder-consecutiveness pattern? The unlanded RHO-destruction interpretation tested with pre-registered predictions H1-H4; planning evidence, hypothesis-tier",
    preRegistration: PRE_REGISTRATION,
    method,
    sourceBindings,
    base: {
      bl075: { artifact: BL075_PATH, investigationFingerprint: bl075Fingerprint },
      bl076: { artifact: BL076_PATH, investigationFingerprint: bl076Fingerprint },
      bl084: { artifact: BL084_PATH, investigationFingerprint: bl084Fingerprint },
      bl073: { artifact: BL073_PATH, investigationFingerprint: bl073Fingerprint },
      bl072: { artifact: BL072_PATH, investigationFingerprint: bl072Fingerprint },
      probe: { artifact: PROBE_PATH, probeFingerprint },
      importPolicy: "the chain artifacts are consumed by fingerprint self-check (no literals in this generator); the sanity gate reproduces the BL-076 family table fail-loud; no landed artifact is rewritten",
    },
    grounding,
    sanityGate,
    matrix: {
      orders: { A0: a0Order, D7: d7Order, A1: a1Order },
      maps: MAP_CATALOG,
      rows: matrixRows,
    },
    hypotheses: { H1: h1, H2: h2, H3: h3, H4: h4 },
    diagnostics: {
      rhoA1Relocation,
      cutSensitivity: cutSensitivityDiagnostic,
      extensionRows,
      d2Trio,
    },
    synthesis,
    accounting,
    fences,
    contractCitations,
    notAccomplished,
  };
  const investigationFingerprint = sha256(canonicalText(core));
  return { ...core, investigationFingerprint };
}

export function serializeInvestigation(investigation) {
  return `${canonicalText(investigation)}\n`;
}

function main() {
  const check = process.argv.includes("--check");
  const investigation = buildInvestigation();
  const serialized = serializeInvestigation(investigation);
  const outputPath = path.join(root, OUTPUT_PATH);
  const summary = {
    output: OUTPUT_PATH,
    check,
    sanityGate: investigation.sanityGate.verdict,
    hypotheses: {
      H1: investigation.hypotheses.H1.verdict,
      H2: investigation.hypotheses.H2.verdict,
      H3: investigation.hypotheses.H3.verdict,
      H4: investigation.hypotheses.H4.verdict,
    },
    h1RhoImageConsecutive: investigation.hypotheses.H1.observed.allConsecutive,
    h4T2Image: investigation.hypotheses.H4.observed.t2Actual,
    synthesis: investigation.synthesis.verdict,
    fenceStatus: investigation.synthesis.fenceStatus.slice(0, 40),
    investigationFingerprint: investigation.investigationFingerprint,
  };
  if (check) {
    const existing = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, "utf8") : null;
    if (existing !== serialized) throw new Error("STALE_BL087_KLEIN_LADDER_PROBE");
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
