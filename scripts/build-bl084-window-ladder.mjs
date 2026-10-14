#!/usr/bin/env node
/**
 * Build the BL-084 window-ladder investigation: is the D7 orbit's
 * consecutive-window reach geometry (BL-072: each satellite reached by a
 * consecutive interval of orbit anchors; per-anchor counts = window-overlap
 * counts; 4/5/6/6/6/5/4; interior/terminal regimes) unique to the D7 orbit,
 * or does it generalize to other cycles in the topology?
 *
 * The question (approved planning pass 2026-10-13, rulings OD-84-1..OD-84-4,
 * plus the calibration-as-reference-implementation addition OD-84-5):
 *   Scope A  the A0 P7 ring x the full 28 A1 satellites (OD-84-3);
 *            D4 labels comparison-only overlay
 *   Scope B  the D-tier family cycles D1..D7 x their satellite layers,
 *            the test layer found empirically per cycle (B1: all-ledger
 *            Hamming-2 reach per anchor; B2: dominant satellite tier by
 *            total reach; ties all-tested); the A-tier M-cycles A1/A2 and
 *            the A0 ring's own empirical layers as supplementary census
 *   Scope C  the composed graph's operator layer: all simple directed
 *            cycles over the 60 catalog edges of derived-path-graph.v1
 *   Scope D  the theoretical conditions (a) length-7, (b) satellite:anchor
 *            ratio, (c) uniform all-ledger reach, (d) Hamming-2 order,
 *            each tested against the A/B/C outcomes
 *
 * The tiered verdict (OD-84-4): FULL = the D7 shape reproduced (consecutive
 * windows, overlap = reach, the two regimes [terminal + interior],
 * inversion-symmetric for seven-element cycles); PARTIAL = consecutive +
 * overlap with a different shape (a ladder exists but isn't the D7 ladder);
 * ABSENT = non-consecutive (no ladder). A shapeClass sub-field records the
 * structural grain (TWO_REGIME / SLIDING_ONE_REGIME / SINGLETON_PARTITION /
 * NON_CONSECUTIVE).
 *
 * The calibration gate (fail-loud): the D7 orbit x the D6 satellite layer
 * must reproduce BL-072's geometricMapping exactly (windows, overlap counts,
 * terminals, mirroring, closure). OD-84-5: the calibration runs through the
 * same window-detection function as every generalization test, so verdict
 * differences are data differences, not code differences.
 *
 * Two-region static discipline (validator-enforced): the INTRINSIC region
 * reads the ledger's pitch sets, masks, and tier/role partition only, and
 * builds the generic window machinery; the comparison region reads the
 * landed orders (network modal rows, the probe's M-cycle stateIds, BL-073's
 * A0 order), the BL-055 labels, the BL-072 calibration target, the
 * derived-path-graph edges, and the chain fingerprints.
 *
 * Fences: planning_evidence only. No new measurement beyond masks-only
 * Hamming-2 reach arithmetic over landed bytes (the BL-070 precedent). D7
 * hypothesis-tier throughout. No claim event; no record amendment; no
 * GOVERNS admission (the GSL-4 generalization refinement is inline,
 * unapplied); no G1 movement; no INV-5 graduation; no M-walkability
 * promotion; no canonical/Court/schema/Neo4j writes. The frame
 * (scrum/plan/harmonic-comprehension-map.md sections 2.6/2.7) is
 * interpretation vocabulary, never design input. Session prose is context,
 * not evidence.
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

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..");

export const SCHEMA_VERSION = "harmonic-orrery.bl084-window-ladder.v1";
export const INVESTIGATION_ID = "BL084_WINDOW_LADDER_V1";
export const OUTPUT_PATH = "orrery/src/generated/bl084-window-ladder.v1.json";
export const NETWORK_PATH = "canonical/universal-network-data.json";
export const LEDGER_PATH = HEPTATONIC_LEDGER_PATH;
export const BL072_PATH = "orrery/src/generated/bl072-composite-mechanism.v1.json";
export const BL073_PATH = "orrery/src/generated/bl073-isometry-probe.v1.json";
export const BL055_PATH = "orrery/src/generated/d4-selection-review.v1.json";
export const BL066_PATH = "orrery/src/generated/bl066-r-edge-derivation.v1.json";
export const PROBE_PATH = "orrery/src/generated/d-tier-operator-probe.v1.json";
export const DPG_PATH = "orrery/src/generated/derived-path-graph.v1.json";

export const D_TIER_ORDER = ["D1", "D2", "D3", "D4", "D5", "D6", "D7"];
export const A_TIER_ORDER = ["A0", "A1", "A2"];
export const SATELLITE_TIERS = ["A0", "A1", "A2", "D1", "D2", "D3", "D4", "D5", "D6"];

// ==== INTRINSIC-WINDOW-BEGIN (ledger masks + tier/role partition + window machinery only) ====
// This region derives masks from pitch sets, partitions satellites by tier,
// and builds the generic consecutive-window reach analysis and the tiered
// verdict rules. It never reads the office field, the class label, the
// recorded/unrecorded status, the network records, any landed cycle order,
// or any landed verdict. The comparison region (after the marker) reads
// those as labelled targets and passes cycle orders into these functions.

function cmp(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

export function maskOfRow(row) {
  let mask = 0;
  for (const pitch of parsePitchSet(row.pitchSet)) mask |= 1 << pitch;
  if (mask !== Number(row.id)) {
    fail(`ledger row ${row.id}: mask derived from the pitch set disagrees with the identity field`);
  }
  return mask;
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

export function invertMask12(mask) {
  let result = 0;
  for (let pitch = 0; pitch < 12; pitch += 1) {
    if ((mask >> pitch) & 1) result |= 1 << ((12 - pitch) % 12);
  }
  return result;
}

export function satelliteLayers(ledgerRows) {
  const layers = new Map();
  for (const row of ledgerRows) {
    if (row.role !== "satellite") continue;
    const tier = row.tier;
    if (!layers.has(tier)) layers.set(tier, []);
    layers.get(tier).push(String(row.id));
  }
  for (const ids of layers.values()) ids.sort((left, right) => cmp(Number(left), Number(right)));
  return layers;
}

export function windowAnalysis(order, satelliteIds, masks, allIds) {
  const perAnchor = order.map((anchor) => ({
    anchor,
    instances: satelliteIds
      .filter((satellite) => hamming12(masks.get(anchor), masks.get(satellite)) === 2)
      .sort((left, right) => cmp(Number(left), Number(right))),
  }));
  const perAnchorCounts = perAnchor.map((entry) => entry.instances.length);
  const reached = [...new Set(perAnchor.flatMap((entry) => entry.instances))]
    .sort((left, right) => cmp(Number(left), Number(right)));
  const windows = reached.map((state) => {
    const parentEntries = perAnchor.filter((entry) => entry.instances.includes(state));
    const parents = parentEntries.map((entry) => entry.anchor);
    const indices = parents.map((anchor) => order.indexOf(anchor)).sort((left, right) => left - right);
    const start = indices[0];
    const end = indices[indices.length - 1];
    return {
      state,
      parents,
      indices,
      start,
      end,
      size: indices.length,
      consecutive: end - start + 1 === indices.length,
      terminal: indices.length === 1,
    };
  }).sort((left, right) => left.start - right.start || left.size - right.size || cmp(left.state, right.state));
  const allConsecutive = windows.every((window) => window.consecutive);
  const overlapCounts = order.map((anchor, index) => windows.filter((window) => window.indices.includes(index)).length);
  const overlapMatch = canonicalText(overlapCounts) === canonicalText(perAnchorCounts);
  const hasTerminal = windows.some((window) => window.size === 1);
  const hasInterior = windows.some((window) => window.size >= 2);
  const sizeHistogram = {};
  for (const window of windows) sizeHistogram[String(window.size)] = (sizeHistogram[String(window.size)] ?? 0) + 1;
  const fullRangeWindowCount = windows.filter((window) => window.size === order.length).length;
  let mirror = null;
  if (order.length === 7) {
    mirror = windows.every((window) => {
      const partner = allIds.find((id) => masks.get(id) === invertMask12(masks.get(window.state))) ?? null;
      const partnerWindow = partner ? windows.find((entry) => entry.state === partner) : null;
      return partnerWindow ? partnerWindow.start === 6 - window.end && partnerWindow.end === 6 - window.start : false;
    });
  }
  return {
    perAnchor: perAnchor.map((entry) => ({ anchor: entry.anchor, instances: entry.instances, count: entry.count ?? entry.instances.length })),
    perAnchorCounts,
    reached,
    reachedCount: reached.length,
    satelliteCount: satelliteIds.length,
    totalInstances: perAnchorCounts.reduce((sum, value) => sum + value, 0),
    windows,
    allConsecutive,
    overlapCounts,
    overlapMatch,
    hasTerminal,
    hasInterior,
    sizeHistogram,
    fullRangeWindowCount,
    mirror,
  };
}

export function shapeClassOf(analysis) {
  if (!analysis.allConsecutive || !analysis.overlapMatch) return "NON_CONSECUTIVE";
  if (analysis.hasTerminal && analysis.hasInterior) return "TWO_REGIME";
  if (analysis.hasInterior) return "SLIDING_ONE_REGIME";
  return "SINGLETON_PARTITION";
}

export function verdictOf(analysis) {
  const shape = shapeClassOf(analysis);
  if (shape === "NON_CONSECUTIVE") return "ABSENT";
  if (shape !== "TWO_REGIME") return "PARTIAL";
  return analysis.mirror === false ? "PARTIAL" : "FULL";
}

export function compactAnalysis(order, analysis) {
  void order;
  return {
    perAnchorCounts: analysis.perAnchorCounts,
    reachedCount: analysis.reachedCount,
    satelliteCount: analysis.satelliteCount,
    totalInstances: analysis.totalInstances,
    allConsecutive: analysis.allConsecutive,
    overlapMatch: analysis.overlapMatch,
    hasTerminal: analysis.hasTerminal,
    hasInterior: analysis.hasInterior,
    sizeHistogram: analysis.sizeHistogram,
    fullRangeWindowCount: analysis.fullRangeWindowCount,
    mirror: analysis.mirror,
    shapeClass: shapeClassOf(analysis),
    verdict: verdictOf(analysis),
  };
}

// ==== INTRINSIC-WINDOW-END ====

// ---- comparison and evaluation region (landed orders, labels, chain
// ---- artifacts, and the derived-path-graph edges are read here as labelled
// ---- inputs; the window machinery above receives them as arguments) --------

function sortInstanceKey(left, right) {
  const [la, ls] = left.split(":").map(Number);
  const [ra, rs] = right.split(":").map(Number);
  return la - ra || ls - rs;
}

function topLayerRecords(cycleOrder, layers, masks, allIds) {
  const records = [];
  for (const [tier, ids] of layers.entries()) {
    const analysis = windowAnalysis(cycleOrder, ids, masks, allIds);
    if (analysis.totalInstances === 0) continue;
    records.push({ tier, analysis });
  }
  records.sort((left, right) => right.analysis.totalInstances - left.analysis.totalInstances || cmp(left.tier, right.tier));
  return records;
}

function bestVerdict(verdicts) {
  if (verdicts.includes("FULL")) return "FULL";
  if (verdicts.includes("PARTIAL")) return "PARTIAL";
  return "ABSENT";
}

function cycleLayerRecords(cycleOrder, layers, masks, allIds) {
  const records = topLayerRecords(cycleOrder, layers, masks, allIds);
  return records.map((record) => ({
    tier: record.tier,
    ...compactAnalysis(cycleOrder, record.analysis),
  }));
}

function edgeStructure(order, masks) {
  const edgeHammings = order.map((anchor, index) => hamming12(masks.get(anchor), masks.get(order[(index + 1) % order.length])));
  const edgeRotations = order.map((anchor, index) => rotationRelations(masks.get(anchor), masks.get(order[(index + 1) % order.length])));
  const pathHammings = edgeHammings.slice(0, order.length - 1);
  const pathRotations = edgeRotations.slice(0, order.length - 1);
  const closureHammings = [edgeHammings[order.length - 1]];
  const closureRotations = [edgeRotations[order.length - 1]];
  const uniformPathHamming = pathHammings.every((value) => value === pathHammings[0]);
  const uniformPathRotation = pathRotations.every((value) => canonicalText(value) === canonicalText(pathRotations[0]));
  const pathInterval = uniformPathRotation && pathRotations[0].length > 0 ? pathRotations[0][0] : null;
  const closureInterval = closureRotations[0].length > 0 ? closureRotations[0][0] : null;
  return {
    edgeHammings,
    edgeRotations,
    closureEdge: {
      a: order[order.length - 1],
      b: order[0],
      rotateInterval: closureInterval,
      hamming: closureHammings[0],
    },
    uniformPathHamming,
    uniformPathRotation,
    pathInterval,
    closureInterval,
    twoIntervalOrder: uniformPathRotation && pathInterval !== null && closureInterval !== null && closureInterval !== pathInterval,
  };
}

function allLedgerReachPerAnchor(order, ledgerRows, masks) {
  return order.map((anchor) => ({
    anchor,
    count: ledgerRows.filter((row) => String(row.id) !== anchor && hamming12(masks.get(anchor), masks.get(String(row.id))) === 2).length,
  }));
}

function enumerateDirectedCycles(edges) {
  const adjacency = new Map();
  for (const edge of edges) {
    if (!adjacency.has(edge.from)) adjacency.set(edge.from, []);
    adjacency.get(edge.from).push(edge.to);
  }
  for (const targets of adjacency.values()) targets.sort((left, right) => cmp(Number(left), Number(right)));
  const nodes = [...adjacency.keys()].sort((left, right) => cmp(Number(left), Number(right)));
  const cycles = [];
  const visit = (start, current, visited, pathNodes) => {
    for (const next of adjacency.get(current) ?? []) {
      if (next === start && pathNodes.length >= 3) {
        cycles.push([...pathNodes]);
        continue;
      }
      if (visited.has(next)) continue;
      if (Number(next) < Number(start)) continue;
      visited.add(next);
      pathNodes.push(next);
      visit(start, next, visited, pathNodes);
      pathNodes.pop();
      visited.delete(next);
    }
  };
  for (const start of nodes) {
    const visited = new Set([start]);
    visit(start, start, visited, [start]);
  }
  return cycles;
}

function rotations(sequence) {
  const result = [];
  for (let index = 0; index < sequence.length; index += 1) {
    result.push([...sequence.slice(index), ...sequence.slice(0, index)]);
  }
  return result;
}

function canonicalCycleKey(sequence) {
  const candidates = [...rotations(sequence), ...rotations([...sequence].reverse())]
    .map((rotation) => rotation.join(","));
  candidates.sort(cmp);
  return candidates[0];
}

function buildInvestigation() {
  const ledgerRows = parseCsv(read(LEDGER_PATH));
  const network = readJson(NETWORK_PATH);
  const bl072 = readJson(BL072_PATH);
  const bl073 = readJson(BL073_PATH);
  const bl055 = readJson(BL055_PATH);
  const bl066 = readJson(BL066_PATH);
  const probe = readJson(PROBE_PATH);
  const dpg = readJson(DPG_PATH);
  if (ledgerRows.length !== 462) fail(`heptatonic ledger census is ${ledgerRows.length}`);

  // ---- chain self-checks (fingerprints; no literals in this generator) ----
  const { investigationFingerprint: bl072Fingerprint, ...bl072Core } = bl072;
  if (bl072.investigationId !== "BL072_COMPOSITE_MECHANISM_V1" || bl072.status !== "planning_evidence") fail("BL-072 artifact header drift");
  if (sha256(canonicalText(bl072Core)) !== bl072Fingerprint) fail("BL-072 fingerprint self-check failed");
  const { investigationFingerprint: bl073Fingerprint, ...bl073Core } = bl073;
  if (bl073.investigationId !== "BL073_ISOMETRY_PROBE_V1" || bl073.status !== "planning_evidence") fail("BL-073 artifact header drift");
  if (sha256(canonicalText(bl073Core)) !== bl073Fingerprint) fail("BL-073 fingerprint self-check failed");
  const { reviewFingerprint: bl055Fingerprint, ...bl055Core } = bl055;
  if (bl055.reviewId !== "BL055_D4_SELECTION_REVIEW_v1" || bl055.status !== "planning_evidence") fail("BL-055 artifact header drift");
  if (sha256(canonicalText(bl055Core)) !== bl055Fingerprint) fail("BL-055 fingerprint self-check failed");
  const { derivationFingerprint: bl066Fingerprint, ...bl066Core } = bl066;
  if (bl066.derivationId !== "BL066_R_EDGE_DERIVATION_V1" || bl066.status !== "planning_evidence") fail("BL-066 artifact header drift");
  if (sha256(canonicalText(bl066Core)) !== bl066Fingerprint) fail("BL-066 fingerprint self-check failed");
  const { probeFingerprint, ...probeCore } = probe;
  if (probe.probeId !== "D_TIER_OPERATOR_PROBE_v1" || probe.status !== "planning_evidence") fail("d-tier operator probe header drift");
  if (sha256(canonicalText(probeCore)) !== probeFingerprint) fail("d-tier operator probe fingerprint self-check failed");
  const { graphFingerprint, ...dpgCore } = dpg;
  if (dpg.status !== "planning_evidence") fail("derived-path-graph header drift");
  if (sha256(canonicalText(dpgCore)) !== graphFingerprint) fail("derived-path-graph fingerprint self-check failed");

  // ---- masks and partitions (masks-only) ----------------------------------
  const masks = new Map(ledgerRows.map((row) => [String(row.id), maskOfRow(row)]));
  const allIds = ledgerRows.map((row) => String(row.id));
  const layers = satelliteLayers(ledgerRows);
  const rowById = new Map(ledgerRows.map((row) => [String(row.id), row]));

  // ---- the D7 orbit order (the network's recorded modal edges) ------------
  const successor = new Map(network.d7ModalRows.map((row) => [String(row.source), String(row.target)]));
  const orbitOrder = [];
  let orbitCursor = "127";
  for (let step = 0; step < 7; step += 1) {
    orbitOrder.push(orbitCursor);
    const next = successor.get(orbitCursor);
    if (!next) fail(`modal orbit dead-end at ${orbitCursor}`);
    orbitCursor = next;
  }
  if (orbitCursor !== "127") fail("modal orbit does not close");
  if (canonicalText(orbitOrder) !== canonicalText(bl072.geometricMapping.orbitOrder)) fail("network orbit order disagrees with the landed BL-072 orbit order");

  // ---- the calibration gate: D7 orbit x D6 satellites ==== BL-072 exactly --
  const d6Layer = layers.get("D6") ?? [];
  if (d6Layer.length !== 14) fail(`D6 satellite layer census drift: ${d6Layer.length}`);
  const calibrationAnalysis = windowAnalysis(orbitOrder, d6Layer, masks, allIds);
  if (canonicalText(calibrationAnalysis.windows) !== canonicalText(bl072.geometricMapping.windows)) {
    fail("calibration: derived windows disagree with the landed BL-072 geometric mapping");
  }
  if (canonicalText(calibrationAnalysis.perAnchorCounts) !== canonicalText([4, 5, 6, 6, 6, 5, 4])) fail("calibration per-anchor drift");
  if (canonicalText(calibrationAnalysis.sizeHistogram) !== canonicalText({ "1": 2, "2": 2, "3": 10 })) fail("calibration size histogram drift");
  if (canonicalText(calibrationAnalysis.perAnchorCounts) !== canonicalText(bl072.geometricMapping.perAnchorOverlapCounts)) fail("calibration overlap counts disagree with BL-072");
  if (calibrationAnalysis.mirror !== bl072.geometricMapping.inversionSymmetry.allMirrored) fail("calibration mirroring disagrees with BL-072");
  const calibrationSingletonKeys = calibrationAnalysis.windows
    .filter((window) => window.terminal)
    .flatMap((window) => window.parents.map((anchor) => `${anchor}:${window.state}`))
    .sort(sortInstanceKey);
  if (canonicalText(calibrationSingletonKeys) !== canonicalText(bl072.geometricMapping.singletonKeys)) fail("calibration singleton keys disagree with BL-072");
  const calibrationTerminalWindows = calibrationAnalysis.windows.filter((window) => window.terminal).map((window) => window.state);
  const calibrationSizeTwoWindows = calibrationAnalysis.windows.filter((window) => window.size === 2).map((window) => window.state);
  if (canonicalText(calibrationTerminalWindows) !== canonicalText(bl072.geometricMapping.terminalWindows)) fail("calibration terminal windows disagree with BL-072");
  if (canonicalText(calibrationSizeTwoWindows) !== canonicalText(bl072.geometricMapping.sizeTwoWindows)) fail("calibration size-two windows disagree with BL-072");
  const calibrationVerdict = verdictOf(calibrationAnalysis);
  if (calibrationVerdict !== "FULL") fail(`calibration verdict drift: ${calibrationVerdict}`);
  const calibrationStructure = edgeStructure(orbitOrder, masks);
  if (calibrationStructure.closureEdge.rotateInterval !== bl072.geometricMapping.closureEdge.rotateInterval) fail("calibration closure interval drift");

  // ---- Scope A: the A0 P7 ring x the full 28 A1 satellites (OD-84-3) ------
  const a0Order = bl073.cycles.A0.order.slice();
  if (a0Order.length !== 7 || a0Order[0] !== "1387" || a0Order[6] !== "2773") fail("BL-073 A0 order drift");
  const a0Closure = bl073.cycles.A0.closureEdge;
  if (a0Closure.a !== "2773" || a0Closure.b !== "1387" || a0Closure.rotateInterval !== 6 || a0Closure.hamming !== 10) fail("BL-073 A0 closure drift");
  const a1Layer = layers.get("A1") ?? [];
  if (a1Layer.length !== 28) fail(`A1 satellite layer census drift: ${a1Layer.length}`);
  if (canonicalText(a1Layer) !== canonicalText(bl066.domain.satelliteCensus.masks.map(String).sort((left, right) => cmp(Number(left), Number(right))))) {
    fail("A1 satellite layer is not set-equal to the landed BL-066 satellite census");
  }
  const scopeAAnalysis = windowAnalysis(a0Order, a1Layer, masks, allIds);
  const scopeAVerdict = verdictOf(scopeAAnalysis);
  if (scopeAVerdict !== "PARTIAL") fail(`scope A verdict drift: ${scopeAVerdict}`);
  if (canonicalText(scopeAAnalysis.perAnchorCounts) !== canonicalText([2, 4, 4, 4, 4, 4, 2])) fail("scope A per-anchor drift");
  if (canonicalText(scopeAAnalysis.sizeHistogram) !== canonicalText({ "2": 12 })) fail("scope A size histogram drift");
  const a0Structure = edgeStructure(a0Order, masks);
  if (a0Structure.closureEdge.rotateInterval !== 6) fail("A0 ring closure interval drift");

  // D4 labels overlay (comparison-only; the pure overlay cannot alter the verdict)
  const table28 = bl055.table28;
  if (table28.length !== 28) fail(`BL-055 table28 census drift: ${table28.length}`);
  const observedSatellites = new Set(table28.filter((row) => row.observed === true).map((row) => String(row.satellite)));
  if (observedSatellites.size !== 14) fail(`BL-055 observed census drift: ${observedSatellites.size}`);
  const reachedSet = new Set(scopeAAnalysis.reached);
  const reachedObserved = [...reachedSet].filter((state) => observedSatellites.has(state)).sort((left, right) => cmp(Number(left), Number(right)));
  const missedObserved = [...observedSatellites].filter((state) => !reachedSet.has(state)).sort((left, right) => cmp(Number(left), Number(right)));
  const falsePositives = [...reachedSet].filter((state) => !observedSatellites.has(state)).sort((left, right) => cmp(Number(left), Number(right)));
  if (canonicalText(missedObserved) !== canonicalText(["2395", "2899"])) fail("scope A: the missed observed keys drift from the BL-055 zero-seam pair");
  if (falsePositives.length !== 0) fail("scope A: reach selects an unobserved satellite");
  const cornerstoneSelected = table28
    .filter((row) => Number(row.cornerstoneSubnodes) >= 1)
    .map((row) => String(row.satellite))
    .sort((left, right) => cmp(Number(left), Number(right)));
  const cornerstoneMissed = [...observedSatellites]
    .filter((state) => !cornerstoneSelected.includes(state))
    .sort((left, right) => cmp(Number(left), Number(right)));
  const cornerstoneNearMissSetEqual = canonicalText(cornerstoneSelected) === canonicalText(scopeAAnalysis.reached);
  if (!cornerstoneNearMissSetEqual) fail("scope A: the A0-ring reach is not set-equal to the BL-055 cornerstone near-miss selection");
  if (canonicalText(cornerstoneMissed) !== canonicalText(["2395", "2899"])) fail("scope A: the BL-055 cornerstone near-miss misses drift");

  // ---- Scope B: the M-cycles x their satellite layers ----------------------
  const cycleSources = {
    dToD: probe.modalClosure.dToD.cycles,
    aToA: probe.modalClosure.aToA.cycles,
  };
  const buildCycleRecord = (tier, cycle) => {
    const order = tier === "A0" ? a0Order : cycle.stateIds.map(String);
    const structure = edgeStructure(order, masks);
    const reachPerAnchor = allLedgerReachPerAnchor(order, ledgerRows, masks);
    const uniformReach = reachPerAnchor.every((entry) => entry.count === reachPerAnchor[0].count);
    if (!uniformReach || reachPerAnchor[0].count !== 30) fail(`${tier}: all-ledger reach is not uniform 30`);
    const layerRecords = cycleLayerRecords(order, layers, masks, allIds);
    if (layerRecords.length === 0) fail(`${tier}: no satellite layer has nonzero reach`);
    const topTotal = layerRecords[0].totalInstances;
    const topLayers = layerRecords.filter((record) => record.totalInstances === topTotal);
    const topVerdict = bestVerdict(topLayers.map((record) => record.verdict));
    const bestLayerVerdict = bestVerdict(layerRecords.map((record) => record.verdict));
    const slidingLayers = layerRecords.filter((record) => record.shapeClass === "TWO_REGIME" || record.shapeClass === "SLIDING_ONE_REGIME");
    return {
      tier,
      forte: cycle.forte,
      order,
      orderSource: tier === "A0"
        ? "BL-073 A0-P7 derivation order (Hamming-2 path from the lower-pcSum endpoint, closed by the ^6 return)"
        : `d-tier operator probe ${cycle.tier === tier && cycleSources.aToA.includes(cycle) ? "aToA" : "dToD"} M-cycle walk order`,
      edgeStructure: structure,
      allLedgerReachPerAnchor: reachPerAnchor,
      allLedgerReachUniform: uniformReach,
      topLayers: topLayers.map((record) => record.tier),
      topLayersAgree: new Set(topLayers.map((record) => record.verdict)).size === 1,
      topVerdict,
      bestLayerVerdict,
      slidingLayers: slidingLayers.map((record) => record.tier),
      layers: layerRecords,
    };
  };
  const dRecords = D_TIER_ORDER.map((tier) => buildCycleRecord(tier, cycleSources.dToD.find((cycle) => cycle.tier === tier)));
  const aRecords = A_TIER_ORDER.map((tier) => buildCycleRecord(tier, cycleSources.aToA.find((cycle) => cycle.tier === tier)));
  if (dRecords.some((record) => !record)) fail("D-tier cycle missing from the probe artifact");
  const d7Record = dRecords.find((record) => record.tier === "D7");
  if (d7Record.topVerdict !== "FULL" || canonicalText(d7Record.topLayers) !== canonicalText(["D6"])) fail("scope B: the D7 orbit's top layer/verdict drift");
  const d2Record = dRecords.find((record) => record.tier === "D2");
  if (d2Record.topVerdict !== "ABSENT") fail("scope B: the D2 cycle's top-layer verdict drift");
  const a2Record = aRecords.find((record) => record.tier === "A2");
  if (a2Record.bestLayerVerdict !== "ABSENT") fail("scope B: the A2 cycle's best-layer verdict drift");
  const dSlidingCycles = dRecords.filter((record) => record.slidingLayers.length > 0).map((record) => record.tier);
  if (canonicalText(dSlidingCycles) !== canonicalText(["D7"])) fail(`scope B: the D-tier sliding-cycle census drift: ${dSlidingCycles.join(",")}`);

  // ---- Scope C: the composed graph's operator layer ------------------------
  const heptByKey = new Map(Object.entries(dpg.heptatonicNodes).map(([key, node]) => [key, String(node.pitchMask)]));
  const catalogEdges = dpg.operatorEdges.map((edge) => ({
    moveId: edge.moveId,
    operatorId: edge.operatorId,
    from: heptByKey.get(edge.sourceNodeId),
    to: heptByKey.get(edge.targetNodeId),
  }));
  if (catalogEdges.length !== 60) fail(`catalog edge census drift: ${catalogEdges.length}`);
  if (catalogEdges.some((edge) => !edge.from || !edge.to)) fail("catalog edge node resolution failed");
  const edgeKey = new Set(catalogEdges.map((edge) => `${edge.from}->${edge.to}`));
  const reverseMissing = catalogEdges.filter((edge) => !edgeKey.has(`${edge.to}->${edge.from}`));
  if (reverseMissing.length !== 0) fail(`catalog edges are not inverse-paired: ${reverseMissing.length} missing reverses`);
  if (catalogEdges.some((edge) => hamming12(masks.get(edge.from), masks.get(edge.to)) !== 2)) fail("catalog edge is not Hamming-2");
  const catalogAnchors = [...new Set(catalogEdges.flatMap((edge) => [edge.from, edge.to]))];
  if (catalogAnchors.length !== 21) fail(`catalog anchor census drift: ${catalogAnchors.length}`);
  const directedCycles = enumerateDirectedCycles(catalogEdges);
  const cycleLengthHistogram = {};
  for (const cycle of directedCycles) cycleLengthHistogram[String(cycle.length)] = (cycleLengthHistogram[String(cycle.length)] ?? 0) + 1;
  if (directedCycles.length !== 476) fail(`directed cycle census drift: ${directedCycles.length}`);
  if (cycleLengthHistogram["7"] !== undefined) fail("unexpected length-7 cycle in the operator graph");
  const pairGroups = new Map();
  for (const cycle of directedCycles) {
    const key = canonicalCycleKey(cycle);
    if (!pairGroups.has(key)) pairGroups.set(key, []);
    pairGroups.get(key).push(cycle);
  }
  if ([...pairGroups.values()].some((group) => group.length !== 2)) fail("directed cycle pairing is not two-per-unordered-cycle");
  const scopeCRows = [];
  for (const [key, group] of pairGroups.entries()) {
    const orientations = group
      .map((cycle) => ({ cycle, analysis: topLayerRecords(cycle, layers, masks, allIds) }))
      .sort((left, right) => cmp(left.cycle.join(","), right.cycle.join(",")));
    orientations.forEach((orientation, orientationIndex) => {
      const cycle = orientation.cycle;
      const structure = edgeStructure(cycle, masks);
      const topTotal = orientation.analysis[0].analysis.totalInstances;
      const topLayers = orientation.analysis.filter((record) => record.analysis.totalInstances === topTotal);
      const layerRows = topLayers.map((record) => ({
        tier: record.tier,
        ...compactAnalysis(cycle, record.analysis),
      }));
      scopeCRows.push({
        pairKey: key,
        orientationIndex,
        length: cycle.length,
        order: cycle,
        rotationEdges: structure.edgeRotations.filter((hits) => hits.length > 0).length,
        topLayers: layerRows,
        verdict: bestVerdict(layerRows.map((row) => row.verdict)),
      });
    });
  }
  scopeCRows.sort((left, right) => left.length - right.length
    || cmp(left.pairKey, right.pairKey)
    || left.orientationIndex - right.orientationIndex);
  const directedVerdictHistogram = {};
  for (const row of scopeCRows) {
    const key = `L${row.length}:${row.verdict}`;
    directedVerdictHistogram[key] = (directedVerdictHistogram[key] ?? 0) + 1;
  }
  const slidingDirected = scopeCRows.filter((row) => row.verdict !== "ABSENT");
  if (slidingDirected.length !== 14) fail(`scope C: directed sliding-cycle count drift: ${slidingDirected.length}`);
  const slidingByLength = {};
  for (const row of slidingDirected) slidingByLength[String(row.length)] = (slidingByLength[String(row.length)] ?? 0) + 1;
  if (canonicalText(slidingByLength) !== canonicalText({ "4": 5, "10": 4, "12": 5 })) fail("scope C: sliding-cycle length distribution drift");
  const unorderedCensus = { oneOrientationSliding: 0, bothOrientationsSliding: 0, neitherSliding: 0 };
  for (const group of pairGroups.values()) {
    const rows = scopeCRows.filter((row) => row.pairKey === canonicalCycleKey(group[0]));
    const sliding = rows.filter((row) => row.verdict !== "ABSENT").length;
    if (sliding === 2) unorderedCensus.bothOrientationsSliding += 1;
    else if (sliding === 1) unorderedCensus.oneOrientationSliding += 1;
    else unorderedCensus.neitherSliding += 1;
  }
  const slidingUnordered = unorderedCensus.oneOrientationSliding + unorderedCensus.bothOrientationsSliding;

  // ---- Scope D: the theoretical conditions ---------------------------------
  const slidingDirectedLengths = [...new Set(slidingDirected.map((row) => row.length))].sort((left, right) => left - right);
  const absentDTiers = dRecords.filter((record) => record.slidingLayers.length === 0).map((record) => record.tier);
  const mSlidingTiers = [...dRecords, ...aRecords].filter((record) => record.slidingLayers.length > 0).map((record) => record.tier);
  const twoIntervalM = [...dRecords, ...aRecords].filter((record) => record.edgeStructure.twoIntervalOrder).map((record) => record.tier);
  const ratioVerdicts = new Map();
  for (const record of [...dRecords, ...aRecords]) {
    for (const layer of record.layers) {
      const ratio = layer.satelliteCount / record.order.length;
      const key = String(ratio);
      if (!ratioVerdicts.has(key)) ratioVerdicts.set(key, new Set());
      ratioVerdicts.get(key).add(layer.verdict);
    }
    for (const row of scopeCRows) {
      for (const layer of row.topLayers) {
        const ratio = layer.satelliteCount / row.length;
        const key = String(ratio);
        if (!ratioVerdicts.has(key)) ratioVerdicts.set(key, new Set());
        ratioVerdicts.get(key).add(layer.verdict);
      }
    }
  }
  const ratioConflicts = [...ratioVerdicts.entries()]
    .filter(([, verdicts]) => verdicts.size > 1)
    .map(([ratio, verdicts]) => ({ ratio, verdicts: [...verdicts].sort(cmp) }))
    .sort((left, right) => cmp(Number(left.ratio), Number(right.ratio)));
  const allUniformReach = [...dRecords, ...aRecords].every((record) => record.allLedgerReachUniform);
  const scopeD = {
    conditions: [
      {
        id: "D-a",
        statement: "the ladder requires cycle length 7",
        verdict: "REFUTED",
        evidence: `sliding ladders occur on operator cycles of length ${slidingDirectedLengths.join(", ")} (${slidingDirected.length} directed cycles); among the ten M-cycles only ${mSlidingTiers.join(", ")} carry a sliding layer while ${absentDTiers.join(", ")} (D-tier) carry none — length 7 is neither necessary nor sufficient`,
      },
      {
        id: "D-b",
        statement: "the ladder requires a specific satellite:anchor cardinality ratio",
        verdict: "REFUTED",
        evidence: `same-ratio layers carry different verdicts (${ratioConflicts.map((entry) => `ratio ${entry.ratio}: ${entry.verdicts.join("/")}`).join("; ")}); the FULL M-cycle layers sit at ratios ${[...new Set([...dRecords, ...aRecords].filter((record) => record.topVerdict === "FULL").map((record) => String(record.layers.find((layer) => layer.tier === record.topLayers[0]).satelliteCount / 7)))].sort(cmp).join(" and ")} — cardinality alone does not determine the shape`,
      },
      {
        id: "D-c",
        statement: "the ladder requires uniform all-ledger Hamming-2 reach (the BL-070 calibration analogue)",
        verdict: "SUPPORTED_PROPERTY_NON_DISCRIMINATING",
        evidence: `all ten M-cycles carry uniform all-ledger reach 30 per anchor (${allUniformReach ? "verified" : "unverified"}); the property is shared by FULL, PARTIAL, and ABSENT cycles alike — necessary in the data, not sufficient`,
      },
      {
        id: "D-d",
        statement: "the ladder is a general property of Hamming-2 reach on any cycle",
        verdict: "REFUTED_AS_STATED",
        evidence: `all 60 catalog edges are Hamming-2, hence every one of the ${directedCycles.length} directed operator cycles is a Hamming-2 closed order, yet only ${slidingDirected.length} exhibit sliding windows; conversely every sliding case in the tested populations has Hamming-2 edges (necessary in the data, not sufficient). The two-interval orders (uniform path interval + distinguished closure interval) are ${twoIntervalM.join(", ")} — they coincide with the boundary layer's dual-closure pair, not with sliding incidence as such`,
      },
    ],
    summary: "the ladder is a reach-order alignment property: contiguous windows hold exactly when the order follows the layer's reach geography; it is not implied by cycle length, layer cardinality, uniform all-ledger reach, or Hamming-2 order alone",
  };

  // ---- synthesis -----------------------------------------------------------
  const fullMCycles = [...dRecords, ...aRecords].filter((record) => record.bestLayerVerdict === "FULL").map((record) => record.tier);
  const synthesis = {
    verdict: "BOUNDARY_LAYER_CONDITIONAL",
    scope: "not universal and not D7-specific within the tested topology: the consecutive-window ladder is a boundary-geography phenomenon, recurring on reach-aligned orders of the boundary layer's own structures and absent from the majority of general operator cycles",
    universal: `REFUTED: ${directedCycles.length - slidingDirected.length} of ${directedCycles.length} directed operator cycles are ABSENT; six of the seven D-tier cycles carry no sliding layer`,
    universalEvidence: `${directedCycles.length} directed operator cycles (${pairGroups.size} unordered): ${slidingDirected.length} directed (${slidingUnordered} unordered) exhibit consecutive sliding windows; the rest are non-consecutive`,
    d7Specific: `REFUTED: the A0 ring carries the ladder too (Scope A: sliding one-regime on the designated A1 layer; supplementary: TWO_REGIME on its own-tier layer — FULL), and ${slidingUnordered} unordered operator cycles slide as well`,
    d7SpecificEvidence: `FULL M-cycle layers: ${fullMCycles.join(", ")} — the dual-closure pair (the two two-interval orders, both closing at rotation 6 Hamming 10; BL-071/BL-073)`,
    principle: "the window-ladder is a reach-order alignment property: every satellite's reaching anchors form a contiguous run exactly when the anchor order tracks the layer's reach geography (consecutive anchors' satellite sets advancing by at most one step); it is not determined by length, layer cardinality, uniform all-ledger reach, or Hamming-2 order alone",
    d7SpecialProperty: "the D7 orbit's special property: its dedicated satellite layer (D6, class-pure 7-2; BL-068) is dense relative to the orbit (36 instances over 14 satellites), so its two-interval order (^11 path + ^6 closure) yields the FULL two-regime ladder whose terminals are exactly the recorded tritone contacts (BL-072 calibration, reproduced here field-for-field)",
    a0Context: "the A0 ring — the D7 orbit's coordinate image (BL-075) and the dual closure partner (BL-071/BL-073) — carries the same geometry in different layers: the designated A1 population (OD-84-3) gives the sliding one-regime ladder (size-2 windows; PARTIAL), its own-tier layer gives the two-regime ladder (FULL); both orders are two-interval (uniform path interval + ^6 closure)",
    higherTheoremNote: "evidence accretion only: the generalization verdict bounds the window-ladder's scope (boundary-layer-conditional); the governs question stays open; no claim event, no admission",
  };

  // ---- GSL treatment -------------------------------------------------------
  const gslTreatment = {
    rule: "the BL-072/BL-074 precedent: generalization findings land as an annotated, inline, unapplied refinement of GSL-4; no new GSL number; no registration is performed by this artifact",
    gsl4GeneralizationRefinement: {
      status: "inline, unapplied (no status change, no new GSL number)",
      text: "GSL-4 annotated refinement (BL-084): the D7 orbit's window ladder is not unique to the orbit and not universal — it is boundary-layer-conditional, a reach-order alignment recurring on the boundary layer's reach-aligned orders (the dual-closure pair: D7 FULL via the D6 layer; A0 FULL via its own-tier layer, sliding via the A1 layer) and on a minority of the composed graph's operator cycles (7 of 238 unordered), absent elsewhere in the tested topology",
    },
    newEntry: "none: no GSL-7 status change; the generalization verdict is recorded here and in the memo only",
  };

  // ---- accounting, fences, citations ----------------------------------------
  const accounting = {
    masksOnly: [
      "the satellite tier/role partition and the Hamming-2 reach arithmetic (the BL-070 D1/D2 derivation pattern)",
      "every window analysis, overlap-count check, size histogram, mirroring check, and tiered verdict (pure arithmetic over masks and orders)",
      "the calibration gate (the same window machinery applied to the D7 orbit x D6 layer; field-for-field equality with the landed BL-072 mapping)",
      "the Scope C cycle enumeration (DFS over the derived-path-graph's 60 catalog edges; pure graph arithmetic)",
      "the Scope D condition tests and the synthesis counts (arithmetic over the above)",
    ],
    canonicalComputation: [
      "the landed cycle orders: the network's recorded modal rows (D7), BL-073's A0 order, the d-tier operator probe's M-cycle stateIds (labelled)",
      "the D4 observed/unobserved labels and cornerstone flags (BL-055 table28; comparison-only overlay; never a window-test input)",
      "the BL-072 calibration target (the landed geometric mapping; comparison/verification only)",
      "the forte labels carried on the probe cycles (labels)",
      "the chain fingerprints (self-checked; comparison)",
    ],
    remainingGranted: [
      "the tier/role partition membership itself (the ledger's marking)",
      "the recorded cycle orders (the network's modal edges; the probe's M-walks; BL-073's derivation order)",
      "presentation conventions and the frame vocabulary (never a design input)",
    ],
    statement: "the analysis is masks-only reach arithmetic plus labelled comparison reads over landed orders; no new measurement occurs beyond the arithmetic the BL-070 domain-derivation precedent licenses; the calibration gate is a verification read, not a new measurement",
  };

  const fences = {
    noNewMeasurement: "no new measurement beyond masks-only Hamming-2 reach arithmetic over landed bytes and landed orders; the BL-070 D1/D2 precedent; any mismatch with a landed artifact is a halt",
    calibrationGate: "the D7 x D6 calibration must equal BL-072's geometricMapping field-for-field; OD-84-5: the calibration and every generalization test run through the same window-detection code path, so verdict differences are data differences",
    d7HypothesisTier: "D7 remains hypothesis-tier throughout: no D7 claim event, no D7 record amendment, no D7 derivation admission; ENTRY 15's D7 clause carries forward verbatim (provenance/DECISION_LEDGER.md:2703-2712)",
    governsAdmission: "none; the GSL-4 generalization refinement is inline, unapplied; no new GSL entry",
    canonical: "no canonical/Court/schema/Neo4j writes; all sources read-only",
    d4Record: "no movement: ENTRY 10/15/16/17/18/19/20/21 byte-untouched",
    g1Intra330: "untouched",
    inv5: "no INV-5 graduation",
    mWalkability: "no M-walkability promotion",
    membrane: "the frame (scrum/plan/harmonic-comprehension-map.md sections 2.6/2.7) is interpretation vocabulary only; never a probe input, design input, or admitted canon claim",
    sessionProse: "context, not evidence",
  };

  const contractCitations = [
    "orrery/src/generated/bl072-composite-mechanism.v1.json (the calibration target: the orbit-window ladder, 4/5/6/6/6/5/4, the terminals, the closure alignment; fingerprint self-checked)",
    "orrery/src/generated/bl073-isometry-probe.v1.json (the A0 order and the dual closure: both cycles close at rotation 6, Hamming 10; fingerprint self-checked)",
    "orrery/src/generated/d4-selection-review.v1.json (the 7-27/7-31 split; table28; the cornerstone near-miss with its two missed observed keys; fingerprint self-checked)",
    "orrery/src/generated/bl066-r-edge-derivation.v1.json (the A1 parent/satellite census; fingerprint self-checked)",
    "orrery/src/generated/d-tier-operator-probe.v1.json (the seven D-tier M-closed cycles and the three A-tier cycles; fingerprint self-checked)",
    "orrery/src/generated/derived-path-graph.v1.json (the composed graph's 60 catalog edges; fingerprint self-checked)",
    "canonical/universal-heptatonic-ledger.csv (the 462-record universe: pitch sets, masks, tier/role partition)",
    "canonical/universal-network-data.json (the recorded D7 modal rows and seat contacts)",
    "scrum/plan/bl-072-composite-mechanism-memo.md (the ladder's formal characterization; the terminal/interior regimes)",
    "scrum/BACKLOG.md (the BL-084 capture; the approved planning pass 2026-10-13, rulings OD-84-1..OD-84-5)",
  ];

  const notAccomplished = [
    "no new measurement beyond masks-only Hamming-2 reach arithmetic over landed bytes (the BL-070 precedent); no claim event; no record amendment",
    "no mechanism (causal) claim: the reach-order alignment is characterized descriptively; production questions stay open",
    "no governs admission; no new GSL entry; the GSL-4 generalization refinement is inline, unapplied",
    "no D7 movement (hypothesis-tier throughout); no D4 record movement; no G1 movement; no INV-5 graduation; no M-walkability promotion",
    "no higher-theorem answer: the verdict bounds the window-ladder's scope; it does not conclude the governs program",
    "no canonical/Court/schema/Neo4j writes; all sources read-only",
    "session prose is context, not evidence",
  ];

  const preRegistration = {
    rulings: [
      { id: "OD-84-1", ruling: "scope breadth: the full sweep A+B+C+D (the A0 ring; the D-tier cycles; the composed graph's operator cycles; the theoretical conditions)" },
      { id: "OD-84-2", ruling: "landing form: machine-checkable artifact + independent validator + pins, per the BL-070/071/072 pattern" },
      { id: "OD-84-3", ruling: "Scope A population: the full 28 A1 satellites from the ledger (not restricted to the 28-key contact domain); the D4 labels are a comparison-only overlay" },
      { id: "OD-84-4", ruling: "tiered verdict: FULL = the D7 shape reproduced (consecutive windows, overlap = reach, the two regimes, inversion-symmetric terminals for seven-element cycles); PARTIAL = consecutive + overlap with a different shape; ABSENT = non-consecutive" },
      { id: "OD-84-5", ruling: "calibration-as-reference-implementation: the D7 calibration and every generalization test run through the same window-detection code path; verdict differences are data differences, not code differences (the BL-066 dual-engine discipline)" },
    ],
    decisionRules: {
      full: "FULL iff all windows consecutive, overlap counts = per-anchor reach counts, and both terminal (size 1) and interior (size >= 2) windows exist; for seven-element cycles additionally all windows inversion-mirrored",
      partial: "PARTIAL iff consecutive and overlap-consistent but the two-regime shape is not reproduced (SLIDING_ONE_REGIME or SINGLETON_PARTITION)",
      absent: "ABSENT iff any window is non-consecutive (no ladder)",
      calibration: "EXACT or halt: the D7 x D6 analysis must equal BL-072's landed mapping field-for-field",
    },
    buildNotes: [
      "B1: all-ledger Hamming-2 reach per anchor, asserted uniform 30 for every M-cycle (the BL-070 calibration analogue)",
      "B2: the test layer per cycle is the satellite tier with the largest total reach; ties are all-tested; the cycle's top verdict is the best of its tied top layers",
      "Scope C population: all simple directed cycles of the composed graph's operator layer (the 60 catalog edges); the containment-mixed cycles are outside the bounded population",
      "the analysis plan was approved 2026-10-13; the build executes it; any mismatch with a landed artifact is a halt",
    ],
  };

  const method = {
    reachDefinition: "p is reached by a if hamming12(mask(a), mask(p)) = 2 (the BL-070 D2 definition)",
    windowDefinition: "for an ordered anchor list and a satellite layer, every reached satellite's reaching-anchor index set is a window [start, end]; the window is consecutive iff end - start + 1 = size",
    layerRule: "B1 all-ledger reach (uniformity asserted); B2 dominant satellite tier by total reach; ties all-tested",
    referenceImplementation: "the calibration and every generalization test run through one windowAnalysis code path (OD-84-5); the calibration gate asserts field-for-field equality with BL-072",
    shapeClasses: "TWO_REGIME / SLIDING_ONE_REGIME / SINGLETON_PARTITION / NON_CONSECUTIVE",
    mirrorRule: "inversion mirroring is defined for seven-element orders only (window k maps to 6 - k); for other lengths mirror is null and not part of the verdict",
  };

  const sourceBindings = [
    { artifact: LEDGER_PATH, role: "the 462-record canonical universe: pitch sets, masks, tier/role partition" },
    { artifact: NETWORK_PATH, role: "the recorded D7 modal rows (the orbit order) and seat contacts" },
    { artifact: BL072_PATH, role: "the calibration target artifact (chain anchor; fingerprint self-check)" },
    { artifact: BL073_PATH, role: "the A0 ring order and the dual closure (chain anchor; fingerprint self-check)" },
    { artifact: BL055_PATH, role: "the D4 labels and the cornerstone near-miss (comparison-only overlay; fingerprint self-check)" },
    { artifact: BL066_PATH, role: "the A1 satellite census (set-equality gate; fingerprint self-check)" },
    { artifact: PROBE_PATH, role: "the M-cycle orders for the seven D-tier cycles and the three A-tier cycles (fingerprint self-check)" },
    { artifact: DPG_PATH, role: "the composed graph's 60 catalog edges (the Scope C population; fingerprint self-check)" },
  ].map((binding) => ({ ...binding, sha256: fileSha(binding.artifact) }));

  const grounding = {
    calibration: {
      status: "EXACT",
      matchedFields: ["windows", "perAnchorOverlapCounts", "sizeHistogram", "singletonKeys", "terminalWindows", "sizeTwoWindows", "inversionSymmetry.allMirrored", "closureEdge.rotateInterval"],
      bl072InvestigationFingerprint: bl072Fingerprint,
      note: "the calibration gate re-derived the D7 x D6 analysis and matched BL-072's geometricMapping field-for-field; no mismatch occurred",
    },
    partitions: {
      satelliteLayers: [...layers.entries()].map(([tier, ids]) => ({ tier, count: ids.length })),
      a1SetEqualBl066: true,
      orbitOrderSource: "network.d7ModalRows (successor walk from 127, closed)",
      a0OrderSource: "BL-073 cycles.A0.order",
    },
    chainAnchors: {
      bl072: bl072Fingerprint,
      bl073: bl073Fingerprint,
      bl055: bl055Fingerprint,
      bl066: bl066Fingerprint,
      probe: probeFingerprint,
      dpg: graphFingerprint,
    },
  };

  const calibration = {
    order: orbitOrder,
    layerTier: "D6",
    satelliteCount: d6Layer.length,
    edgeStructure: calibrationStructure,
    ...compactAnalysis(orbitOrder, calibrationAnalysis),
    singletonKeys: calibrationSingletonKeys,
    terminalWindows: calibrationTerminalWindows,
    sizeTwoWindows: calibrationSizeTwoWindows,
    windows: calibrationAnalysis.windows,
    verdict: calibrationVerdict,
    bl072Matched: true,
  };

  const scopeA = {
    cycle: "A0-P7 ring",
    order: a0Order,
    orderSource: "BL-073 cycles.A0.order (the Hamming-2 path from the lower-pcSum endpoint, closed by the ^6 return)",
    layerTier: "A1",
    population: "the full 28 A1 satellites (OD-84-3; set-equal the BL-066 satellite census)",
    edgeStructure: a0Structure,
    ...compactAnalysis(a0Order, scopeAAnalysis),
    windows: scopeAAnalysis.windows,
    overlay: {
      rule: "comparison-only: the D4 labels (BL-055 table28) are overlaid after the masks-only verdict; they never enter the window test",
      observedCount: observedSatellites.size,
      reachedObserved,
      missedObserved,
      falsePositives,
      cornerstoneNearMissSetEqual,
      note: "the A0 ring's Hamming-2 reach on the A1 layer is set-equal to the BL-055 cornerstone near-miss selection (12 keys); the two missed observed keys (2395, 2899) are the two zero-seam-incidence keys of BL-055 — a descriptive coincidence recorded as comparison, not a new predicate",
    },
  };

  const scopeB = {
    cycles: dRecords,
    supplementaryCycles: aRecords,
    supplementaryNote: "the A-tier M-cycles are carried as supplementary census (the A0 ring's designated population is Scope A; its own-tier and other layers appear here; A1/A2 complete the ten-cycle census)",
    summary: {
      topVerdicts: Object.fromEntries(dRecords.map((record) => [record.tier, record.topVerdict])),
      slidingCycles: dSlidingCycles,
      singletonOnlyCycles: dRecords.filter((record) => record.slidingLayers.length === 0 && record.topVerdict === "PARTIAL").map((record) => record.tier),
      absentCycles: dRecords.filter((record) => record.topVerdict === "ABSENT").map((record) => record.tier),
      fullCycles: [...dRecords, ...aRecords].filter((record) => record.bestLayerVerdict === "FULL").map((record) => record.tier),
      note: "the D7 orbit is the only D-tier cycle with a sliding layer; its top layer (D6) is FULL; the other D-tier cycles are singleton partitions (PARTIAL) except D2 (top layers non-consecutive, ABSENT; a lower A0 layer is a singleton partition)",
    },
  };

  const scopeC = {
    population: "all simple directed cycles of the composed graph's operator layer (the 60 catalog edges of derived-path-graph.v1; 21 A-tier anchors)",
    census: {
      edges: catalogEdges.length,
      anchors: catalogAnchors.length,
      allEdgesHamming2: true,
      reversePairsComplete: true,
      directedCount: directedCycles.length,
      unorderedCount: pairGroups.size,
      lengthHistogram: cycleLengthHistogram,
      noLengthSevenCycles: cycleLengthHistogram["7"] === undefined,
    },
    rows: scopeCRows.map((row) => ({
      pairKey: row.pairKey,
      orientationIndex: row.orientationIndex,
      length: row.length,
      order: row.order,
      rotationEdges: row.rotationEdges,
      topLayers: row.topLayers,
      verdict: row.verdict,
    })),
    aggregate: {
      directedVerdictHistogram,
      slidingDirectedCount: slidingDirected.length,
      slidingByLength,
      unorderedCensus,
      slidingUnorderedCount: slidingUnordered,
      orientationSensitivity: unorderedCensus.bothOrientationsSliding === 0
        ? "every sliding operator cycle slides in exactly one orientation; its reverse is non-consecutive (recorded per pair via orientationIndex)"
        : `orientation pairs with both directions sliding: ${unorderedCensus.bothOrientationsSliding}`,
    },
    note: "the operator layer is the composed graph's non-containment edge structure; containment-mixed cycles are outside this bounded population",
  };

  const scopeDBlock = {
    conditions: scopeD.conditions,
    summary: scopeD.summary,
  };

  const core = {
    schemaVersion: SCHEMA_VERSION,
    investigationId: INVESTIGATION_ID,
    status: "planning_evidence",
    generator: "scripts/build-bl084-window-ladder.mjs",
    role: "the window-ladder generalization investigation: whether the D7 orbit's consecutive-window reach geometry is unique to the orbit or a general property of boundary-layer cycles; planning evidence, hypothesis-tier",
    preRegistration,
    method,
    sourceBindings,
    base: {
      bl072: { artifact: BL072_PATH, investigationFingerprint: bl072Fingerprint },
      bl073: { artifact: BL073_PATH, investigationFingerprint: bl073Fingerprint },
      bl055: { artifact: BL055_PATH, reviewFingerprint: bl055Fingerprint },
      bl066: { artifact: BL066_PATH, derivationFingerprint: bl066Fingerprint },
      probe: { artifact: PROBE_PATH, probeFingerprint },
      dpg: { artifact: DPG_PATH, graphFingerprint },
      importPolicy: "the chain artifacts and the derived-path-graph are consumed by fingerprint self-check (no literals in this generator); the calibration target is matched field-for-field fail-loud; no landed artifact is rewritten",
    },
    grounding,
    calibration,
    scopeA,
    scopeB,
    scopeC,
    scopeD: scopeDBlock,
    synthesis,
    gslTreatment,
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
    calibration: `${investigation.calibration.verdict} (BL-072 matched: ${investigation.calibration.bl072Matched})`,
    scopeA: `${investigation.scopeA.verdict}; per-anchor ${investigation.scopeA.perAnchorCounts.join("/")}; sizes ${JSON.stringify(investigation.scopeA.sizeHistogram)}`,
    scopeB: investigation.scopeB.summary.topVerdicts,
    scopeC: `${investigation.scopeC.aggregate.slidingDirectedCount} sliding of ${investigation.scopeC.census.directedCount} directed cycles; unordered ${investigation.scopeC.census.unorderedCount}; sliding unordered ${investigation.scopeC.aggregate.slidingUnorderedCount}`,
    scopeD: Object.fromEntries(investigation.scopeD.conditions.map((condition) => [condition.id, condition.verdict])),
    synthesis: investigation.synthesis.verdict,
    investigationFingerprint: investigation.investigationFingerprint,
  };
  if (check) {
    const existing = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, "utf8") : null;
    if (existing !== serialized) throw new Error("STALE_BL084_WINDOW_LADDER");
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
