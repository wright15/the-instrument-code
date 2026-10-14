#!/usr/bin/env node
/**
 * Validate the generated BL-084 window-ladder investigation against its
 * sources.
 *
 * Independent of the generator: re-reads the 462-record ledger, the network,
 * the landed BL-072/BL-073/BL-055/BL-066 artifacts, the d-tier operator probe
 * and the derived-path-graph; re-derives the D7 x D6 calibration, the A0 ring
 * analysis, the ten M-cycles' layer censuses, the operator-cycle enumeration,
 * the Scope D conditions and the synthesis counts; re-checks the artifact
 * fingerprint; statically verifies the generator's two-region isolation
 * (forbidden reads absent from the intrinsic region; the comparison region's
 * labelled reads present - the region-scoping proof; a permissive probe
 * passes; a proof-strip probe is rejected); and runs mutation probes
 * (artifact drift, smuggled reads, presence-strip). Fail-loud.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..", "..");

const ARTIFACT_PATH = "orrery/src/generated/bl084-window-ladder.v1.json";
const GENERATOR_PATH = "scripts/build-bl084-window-ladder.mjs";
const SCHEMA_VERSION = "harmonic-orrery.bl084-window-ladder.v1";
const INVESTIGATION_ID = "BL084_WINDOW_LADDER_V1";
const LEDGER_PATH = "canonical/universal-heptatonic-ledger.csv";
const NETWORK_PATH = "canonical/universal-network-data.json";
const BL072_PATH = "orrery/src/generated/bl072-composite-mechanism.v1.json";
const BL073_PATH = "orrery/src/generated/bl073-isometry-probe.v1.json";
const BL055_PATH = "orrery/src/generated/d4-selection-review.v1.json";
const BL066_PATH = "orrery/src/generated/bl066-r-edge-derivation.v1.json";
const PROBE_PATH = "orrery/src/generated/d-tier-operator-probe.v1.json";
const DPG_PATH = "orrery/src/generated/derived-path-graph.v1.json";

const BL072_FINGERPRINT = "45d0afd1f7e8a8af88c3357bc4c9a2b513e6fcb9ab597d4764047862ca4ddb85";
const BL073_FINGERPRINT = "811fa786f3a03b03b0c334fe797c85b9b4aeed93332a183be43f86fa1133a65c";
const BL055_FINGERPRINT = "6d11fd932efbe96892b3cf2e6a6cdad6f54e69cd2a8f284ebb72232c59d8b745";
const BL066_FINGERPRINT = "94f0661ff6e76b0dea69fbe9f09ead24da7901393fb735495f3a25c3d9a1a886";
const PROBE_FINGERPRINT = "068f9007c7330f84b9654547da7d0be0593276053df98c3b9f7893426f03ab22";
const DPG_FINGERPRINT = "4c7abcb1d82cc5b7d1fea0227dce1bb8a88f7fd6624469f55f0d1bb26edf254f";

const D_TIER_ORDER = ["D1", "D2", "D3", "D4", "D5", "D6", "D7"];
const A_TIER_ORDER = ["A0", "A1", "A2"];

function fail(message) {
  throw new Error(`INVALID_BL084_WINDOW_LADDER: ${message}`);
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

function canonicalText(value) {
  if (value === null) return "null";
  if (value === true) return "true";
  if (value === false) return "false";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isInteger(value)) fail("non-integer number in payload");
    return String(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalText).join(",")}]`;
  if (typeof value === "object") {
    const keys = Object.keys(value).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${canonicalText(value[key])}`).join(",")}}`;
  }
  fail(`unsupported JSON type: ${typeof value}`);
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

function parsePitchSet(text) {
  const trimmed = text.replace(/[{}]/g, "");
  if (trimmed.length === 0) return [];
  return trimmed.split(",").map((value) => Number(value));
}

const cmp = (left, right) => (left < right ? -1 : left > right ? 1 : 0);

function pixelsOf(mask) {
  const pitches = [];
  for (let pitch = 0; pitch < 12; pitch += 1) if ((mask >> pitch) & 1) pitches.push(pitch);
  return pitches;
}

function maskFromPitches(pitches) {
  let mask = 0;
  for (const pitch of pitches) mask |= 1 << pitch;
  return mask;
}

function hamming(a, b) {
  let x = a ^ b;
  let count = 0;
  while (x) { count += x & 1; x >>>= 1; }
  return count;
}

function rotate(mask, distance) {
  const shift = ((distance % 12) + 12) % 12;
  if (shift === 0) return mask & 4095;
  return (((mask << shift) & 4095) | (mask >> (12 - shift))) & 4095;
}

function rotationsBetween(a, b) {
  const hits = [];
  for (let distance = 1; distance < 12; distance += 1) if (rotate(a, distance) === b) hits.push(distance);
  return hits;
}

function inversion(mask) {
  let result = 0;
  for (const pitch of pixelsOf(mask)) result |= 1 << ((12 - pitch) % 12);
  return result;
}

// ---------------------------------------------------------------------------
// Independent re-derivation (different data flow: satellite-to-anchor maps)
// ---------------------------------------------------------------------------

function analyzeOrder(order, satelliteIds, masks) {
  const indexOfAnchor = new Map();
  order.forEach((anchor, index) => indexOfAnchor.set(anchor, index));
  const reachByAnchor = order.map(() => 0);
  const anchorsBySatellite = new Map();
  for (let index = 0; index < order.length; index += 1) {
    for (const satellite of satelliteIds) {
      if (hamming(masks.get(order[index]), masks.get(satellite)) === 2) {
        reachByAnchor[index] += 1;
        if (!anchorsBySatellite.has(satellite)) anchorsBySatellite.set(satellite, []);
        anchorsBySatellite.get(satellite).push(index);
      }
    }
  }
  const windows = [...anchorsBySatellite.entries()].map(([state, indices]) => {
    const parents = indices.map((index) => order[index]);
    const start = indices[0];
    const end = indices[indices.length - 1];
    return {
      state,
      parents,
      indices: [...indices],
      start,
      end,
      size: indices.length,
      consecutive: end - start + 1 === indices.length,
      terminal: indices.length === 1,
    };
  });
  windows.sort((left, right) => (left.start - right.start) || (left.size - right.size) || (left.state < right.state ? -1 : left.state > right.state ? 1 : 0));
  const allConsecutive = windows.every((window) => window.consecutive);
  const overlapCounts = order.map((anchor, index) => windows.reduce((sum, window) => sum + (window.indices.includes(index) ? 1 : 0), 0));
  const hasTerminal = windows.some((window) => window.size === 1);
  const hasInterior = windows.some((window) => window.size >= 2);
  const sizeHistogram = {};
  for (const window of windows) sizeHistogram[String(window.size)] = (sizeHistogram[String(window.size)] ?? 0) + 1;
  let mirror = null;
  if (order.length === 7) {
    mirror = windows.every((window) => {
      const inverted = inversion(masks.get(window.state));
      const partnerWindow = windows.find((entry) => masks.get(entry.state) === inverted);
      if (!partnerWindow) return false;
      return partnerWindow.start === 6 - window.end && partnerWindow.end === 6 - window.start;
    });
  }
  return {
    perAnchorCounts: reachByAnchor,
    reached: [...anchorsBySatellite.keys()].sort((left, right) => Number(left) - Number(right)),
    reachedCount: anchorsBySatellite.size,
    totalInstances: reachByAnchor.reduce((sum, value) => sum + value, 0),
    windows,
    allConsecutive,
    overlapCounts,
    overlapMatch: canonicalText(overlapCounts) === canonicalText(reachByAnchor),
    hasTerminal,
    hasInterior,
    sizeHistogram,
    fullRangeWindowCount: windows.filter((window) => window.size === order.length).length,
    mirror,
  };
}

function shapeOf(analysis) {
  if (!analysis.allConsecutive || !analysis.overlapMatch) return "NON_CONSECUTIVE";
  if (analysis.hasTerminal && analysis.hasInterior) return "TWO_REGIME";
  if (analysis.hasInterior) return "SLIDING_ONE_REGIME";
  return "SINGLETON_PARTITION";
}

function verdictFor(analysis) {
  const shape = shapeOf(analysis);
  if (shape === "NON_CONSECUTIVE") return "ABSENT";
  if (shape !== "TWO_REGIME") return "PARTIAL";
  return analysis.mirror === false ? "PARTIAL" : "FULL";
}

function compactOf(order, analysis, satelliteCount) {
  return {
    perAnchorCounts: analysis.perAnchorCounts,
    reachedCount: analysis.reachedCount,
    satelliteCount,
    totalInstances: analysis.totalInstances,
    allConsecutive: analysis.allConsecutive,
    overlapMatch: analysis.overlapMatch,
    hasTerminal: analysis.hasTerminal,
    hasInterior: analysis.hasInterior,
    sizeHistogram: analysis.sizeHistogram,
    fullRangeWindowCount: analysis.fullRangeWindowCount,
    mirror: analysis.mirror,
    shapeClass: shapeOf(analysis),
    verdict: verdictFor(analysis),
  };
}

function bestOf(verdicts) {
  if (verdicts.includes("FULL")) return "FULL";
  if (verdicts.includes("PARTIAL")) return "PARTIAL";
  return "ABSENT";
}

function structureOf(order, masks) {
  const edgeHammings = order.map((anchor, index) => hamming(masks.get(anchor), masks.get(order[(index + 1) % order.length])));
  const edgeRotations = order.map((anchor, index) => rotationsBetween(masks.get(anchor), masks.get(order[(index + 1) % order.length])));
  const pathRotations = edgeRotations.slice(0, -1);
  const uniformPathRotation = pathRotations.every((value) => canonicalText(value) === canonicalText(pathRotations[0]));
  const pathInterval = uniformPathRotation && pathRotations[0].length > 0 ? pathRotations[0][0] : null;
  const closureInterval = edgeRotations[edgeRotations.length - 1].length > 0 ? edgeRotations[edgeRotations.length - 1][0] : null;
  return {
    edgeHammings,
    edgeRotations,
    closureEdge: {
      a: order[order.length - 1],
      b: order[0],
      rotateInterval: closureInterval,
      hamming: edgeHammings[edgeHammings.length - 1],
    },
    uniformPathHamming: edgeHammings.slice(0, -1).every((value) => value === edgeHammings[0]),
    uniformPathRotation,
    pathInterval,
    closureInterval,
    twoIntervalOrder: uniformPathRotation && pathInterval !== null && closureInterval !== null && closureInterval !== pathInterval,
  };
}

function enumerateCycles(catalogEdges) {
  const adjacency = new Map();
  for (const edge of catalogEdges) {
    if (!adjacency.has(edge.from)) adjacency.set(edge.from, []);
    adjacency.get(edge.from).push(edge.to);
  }
  const starts = [...adjacency.keys()].sort((left, right) => Number(left) - Number(right));
  for (const targets of adjacency.values()) targets.sort((left, right) => Number(left) - Number(right));
  const found = [];
  const stack = [];
  const inPath = new Set();
  const walk = (start) => {
    const current = stack[stack.length - 1];
    for (const next of adjacency.get(current) ?? []) {
      if (next === start && stack.length >= 3) {
        found.push([...stack]);
      } else if (!inPath.has(next) && Number(next) >= Number(start)) {
        stack.push(next);
        inPath.add(next);
        walk(start);
        inPath.delete(next);
        stack.pop();
      }
    }
  };
  for (const start of starts) {
    stack.length = 0;
    inPath.clear();
    stack.push(start);
    inPath.add(start);
    walk(start);
  }
  return found;
}

function canonicalKey(sequence) {
  const forms = [];
  const reversed = [...sequence].reverse();
  for (let index = 0; index < sequence.length; index += 1) {
    forms.push([...sequence.slice(index), ...sequence.slice(0, index)].join(","));
    forms.push([...reversed.slice(index), ...reversed.slice(0, index)].join(","));
  }
  return forms.reduce((best, candidate) => (candidate < best ? candidate : best), forms[0]);
}

function reDerive(sources) {
  const { ledgerRows, network, bl072, bl073, bl055, bl066, probe, dpg } = sources;
  if (ledgerRows.length !== 462) fail(`ledger census ${ledgerRows.length}`);
  const masks = new Map();
  for (const row of ledgerRows) {
    const mask = maskFromPitches(parsePitchSet(row.pitchSet));
    if (mask !== Number(row.id)) fail(`ledger mask/id disagreement at ${row.id}`);
    masks.set(String(row.id), mask);
  }
  const allIds = ledgerRows.map((row) => String(row.id));
  const layerIds = new Map();
  for (const row of ledgerRows) {
    if (row.role !== "satellite") continue;
    if (!layerIds.has(row.tier)) layerIds.set(row.tier, []);
    layerIds.get(row.tier).push(String(row.id));
  }
  for (const ids of layerIds.values()) ids.sort((left, right) => Number(left) - Number(right));

  const successor = new Map(network.d7ModalRows.map((row) => [String(row.source), String(row.target)]));
  const orbitOrder = [];
  let cursor = "127";
  while (orbitOrder.length < 7) {
    orbitOrder.push(cursor);
    const next = successor.get(cursor);
    if (!next) fail(`modal orbit dead-end at ${cursor}`);
    cursor = next;
  }
  if (cursor !== "127") fail("modal orbit does not close");
  if (canonicalText(orbitOrder) !== canonicalText(bl072.geometricMapping.orbitOrder)) fail("orbit order disagrees with BL-072");

  const d6Layer = layerIds.get("D6") ?? [];
  if (d6Layer.length !== 14) fail("D6 layer census drift");
  const calibration = analyzeOrder(orbitOrder, d6Layer, masks);
  if (canonicalText(calibration.windows) !== canonicalText(bl072.geometricMapping.windows)) fail("calibration windows disagree with BL-072");
  if (canonicalText(calibration.perAnchorCounts) !== canonicalText(bl072.geometricMapping.perAnchorOverlapCounts)) fail("calibration counts disagree with BL-072");
  if (verdictFor(calibration) !== "FULL") fail("calibration verdict drift");

  const a0Order = bl073.cycles.A0.order.slice();
  const a1Layer = layerIds.get("A1") ?? [];
  if (a1Layer.length !== 28) fail("A1 layer census drift");
  const bl066Masks = bl066.domain.satelliteCensus.masks.map(String).sort((left, right) => Number(left) - Number(right));
  if (canonicalText(a1Layer) !== canonicalText(bl066Masks)) fail("A1 layer is not set-equal to BL-066");
  const scopeAAnalysis = analyzeOrder(a0Order, a1Layer, masks);
  const scopeAVerdict = verdictFor(scopeAAnalysis);
  const table28 = bl055.table28;
  const observedSatellites = new Set(table28.filter((row) => row.observed === true).map((row) => String(row.satellite)));
  const reachedSet = new Set(scopeAAnalysis.reached);
  const reachedObserved = [...reachedSet].filter((state) => observedSatellites.has(state)).sort((left, right) => Number(left) - Number(right));
  const missedObserved = [...observedSatellites].filter((state) => !reachedSet.has(state)).sort((left, right) => Number(left) - Number(right));
  const falsePositives = [...reachedSet].filter((state) => !observedSatellites.has(state)).sort((left, right) => Number(left) - Number(right));
  const cornerstoneSelected = table28.filter((row) => Number(row.cornerstoneSubnodes) >= 1).map((row) => String(row.satellite)).sort((left, right) => Number(left) - Number(right));
  const cornerstoneMissed = [...observedSatellites].filter((state) => !cornerstoneSelected.includes(state)).sort((left, right) => Number(left) - Number(right));
  const cornerstoneNearMissSetEqual = canonicalText(cornerstoneSelected) === canonicalText(scopeAAnalysis.reached);

  const cycleByTier = new Map([
    ...probe.modalClosure.dToD.cycles.map((cycle) => [cycle.tier, cycle]),
    ...probe.modalClosure.aToA.cycles.map((cycle) => [cycle.tier, cycle]),
  ]);
  const buildRecord = (tier) => {
    const cycle = cycleByTier.get(tier);
    if (!cycle) fail(`cycle missing for tier ${tier}`);
    const order = tier === "A0" ? a0Order : cycle.stateIds.map(String);
    const structure = structureOf(order, masks);
    const reach = order.map((anchor) => ({
      anchor,
      count: ledgerRows.filter((row) => String(row.id) !== anchor && hamming(masks.get(anchor), masks.get(String(row.id))) === 2).length,
    }));
    const layerRecords = [];
    for (const [layerTier, ids] of layerIds.entries()) {
      const analysis = analyzeOrder(order, ids, masks);
      if (analysis.totalInstances === 0) continue;
      layerRecords.push({ tier: layerTier, analysis, satelliteCount: ids.length });
    }
    layerRecords.sort((left, right) => (right.analysis.totalInstances - left.analysis.totalInstances) || cmp(left.tier, right.tier));
    const layers = layerRecords.map((record) => ({ tier: record.tier, ...compactOf(order, record.analysis, record.satelliteCount) }));
    const topTotal = layers[0].totalInstances;
    const top = layers.filter((layer) => layer.totalInstances === topTotal);
    return {
      tier,
      order,
      forte: cycle.forte,
      edgeStructure: structure,
      allLedgerReachPerAnchor: reach,
      allLedgerReachUniform: reach.every((entry) => entry.count === reach[0].count),
      layers,
      topLayers: top.map((layer) => layer.tier),
      topVerdict: bestOf(top.map((layer) => layer.verdict)),
      bestLayerVerdict: bestOf(layers.map((layer) => layer.verdict)),
      slidingLayers: layers.filter((layer) => layer.shapeClass === "TWO_REGIME" || layer.shapeClass === "SLIDING_ONE_REGIME").map((layer) => layer.tier),
    };
  };
  const dRecords = D_TIER_ORDER.map(buildRecord);
  const aRecords = A_TIER_ORDER.map(buildRecord);

  const heptByKey = new Map(Object.entries(dpg.heptatonicNodes).map(([key, node]) => [key, String(node.pitchMask)]));
  const catalogEdges = dpg.operatorEdges.map((edge) => ({
    from: heptByKey.get(edge.sourceNodeId),
    to: heptByKey.get(edge.targetNodeId),
  }));
  if (catalogEdges.length !== 60) fail("catalog edge census drift");
  const edgeKeys = new Set(catalogEdges.map((edge) => `${edge.from}->${edge.to}`));
  if (catalogEdges.some((edge) => !edgeKeys.has(`${edge.to}->${edge.from}`))) fail("catalog edges not inverse-paired");
  if (catalogEdges.some((edge) => hamming(masks.get(edge.from), masks.get(edge.to)) !== 2)) fail("catalog edge not Hamming-2");
  const directedCycles = enumerateCycles(catalogEdges);
  if (directedCycles.length !== 476) fail(`directed cycle census drift ${directedCycles.length}`);
  const cycleLengthHistogram = {};
  for (const cycle of directedCycles) cycleLengthHistogram[String(cycle.length)] = (cycleLengthHistogram[String(cycle.length)] ?? 0) + 1;
  const groups = new Map();
  for (const cycle of directedCycles) {
    const key = canonicalKey(cycle);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(cycle);
  }
  const scopeCRows = [];
  for (const [key, group] of groups.entries()) {
    const orientations = group.map((cycle) => {
      const layerTotals = [];
      for (const [layerTier, ids] of layerIds.entries()) {
        const analysis = analyzeOrder(cycle, ids, masks);
        if (analysis.totalInstances === 0) continue;
        layerTotals.push({ tier: layerTier, analysis, satelliteCount: ids.length });
      }
      layerTotals.sort((left, right) => (right.analysis.totalInstances - left.analysis.totalInstances) || cmp(left.tier, right.tier));
      return { cycle, layerTotals };
    }).sort((left, right) => cmp(left.cycle.join(","), right.cycle.join(",")));
    orientations.forEach((orientation, orientationIndex) => {
      const topTotal = orientation.layerTotals[0].analysis.totalInstances;
      const topLayers = orientation.layerTotals.filter((record) => record.analysis.totalInstances === topTotal).map((record) => ({
        tier: record.tier,
        ...compactOf(orientation.cycle, record.analysis, record.satelliteCount),
      }));
      scopeCRows.push({
        pairKey: key,
        orientationIndex,
        length: orientation.cycle.length,
        order: orientation.cycle,
        rotationEdges: structureOf(orientation.cycle, masks).edgeRotations.filter((hits) => hits.length > 0).length,
        topLayers,
        verdict: bestOf(topLayers.map((layer) => layer.verdict)),
      });
    });
  }
  scopeCRows.sort((left, right) => (left.length - right.length) || cmp(left.pairKey, right.pairKey) || (left.orientationIndex - right.orientationIndex));
  const directedVerdictHistogram = {};
  for (const row of scopeCRows) {
    const key = `L${row.length}:${row.verdict}`;
    directedVerdictHistogram[key] = (directedVerdictHistogram[key] ?? 0) + 1;
  }
  const slidingDirected = scopeCRows.filter((row) => row.verdict !== "ABSENT");
  const slidingByLength = {};
  for (const row of slidingDirected) slidingByLength[String(row.length)] = (slidingByLength[String(row.length)] ?? 0) + 1;
  const unorderedCensus = { oneOrientationSliding: 0, bothOrientationsSliding: 0, neitherSliding: 0 };
  for (const key of groups.keys()) {
    const rows = scopeCRows.filter((row) => row.pairKey === key);
    const sliding = rows.filter((row) => row.verdict !== "ABSENT").length;
    if (sliding === 2) unorderedCensus.bothOrientationsSliding += 1;
    else if (sliding === 1) unorderedCensus.oneOrientationSliding += 1;
    else unorderedCensus.neitherSliding += 1;
  }

  return {
    masks, allIds, layerIds, orbitOrder, calibration, a0Order, scopeAAnalysis, scopeAVerdict,
    reachedObserved, missedObserved, falsePositives, cornerstoneSelected, cornerstoneMissed, cornerstoneNearMissSetEqual,
    dRecords, aRecords, catalogEdges, directedCycles, cycleLengthHistogram, groups, scopeCRows,
    directedVerdictHistogram, slidingDirected, slidingByLength, unorderedCensus,
  };
}

// ---------------------------------------------------------------------------
// Artifact checks
// ---------------------------------------------------------------------------

function stripText(value) {
  return value === null ? null : value;
}

function checkAgainstArtifact(artifact, derived) {
  if (artifact.schemaVersion !== SCHEMA_VERSION || artifact.investigationId !== INVESTIGATION_ID) fail("artifact header drift");
  if (artifact.status !== "planning_evidence") fail("status drift");
  if (artifact.generator !== GENERATOR_PATH) fail("generator path drift");

  const bindingPaths = artifact.sourceBindings.map((binding) => binding.artifact).sort();
  const expectedPaths = [LEDGER_PATH, NETWORK_PATH, BL072_PATH, BL073_PATH, BL055_PATH, BL066_PATH, PROBE_PATH, DPG_PATH].sort();
  if (canonicalText(bindingPaths) !== canonicalText(expectedPaths)) fail("source binding set drift");
  for (const binding of artifact.sourceBindings) {
    if (binding.sha256 !== fileSha(binding.artifact)) fail(`source binding sha drift: ${binding.artifact}`);
  }
  if (artifact.base.bl072.investigationFingerprint !== BL072_FINGERPRINT) fail("BL-072 pin drift");
  if (artifact.base.bl073.investigationFingerprint !== BL073_FINGERPRINT) fail("BL-073 pin drift");
  if (artifact.base.bl055.reviewFingerprint !== BL055_FINGERPRINT) fail("BL-055 pin drift");
  if (artifact.base.bl066.derivationFingerprint !== BL066_FINGERPRINT) fail("BL-066 pin drift");
  if (artifact.base.probe.probeFingerprint !== PROBE_FINGERPRINT) fail("probe pin drift");
  if (artifact.base.dpg.graphFingerprint !== DPG_FINGERPRINT) fail("dpg pin drift");
  const chainChecks = [
    [BL072_PATH, "investigationFingerprint", BL072_FINGERPRINT],
    [BL073_PATH, "investigationFingerprint", BL073_FINGERPRINT],
    [BL055_PATH, "reviewFingerprint", BL055_FINGERPRINT],
    [BL066_PATH, "derivationFingerprint", BL066_FINGERPRINT],
    [PROBE_PATH, "probeFingerprint", PROBE_FINGERPRINT],
    [DPG_PATH, "graphFingerprint", DPG_FINGERPRINT],
  ];
  for (const [sourcePath, field, expected] of chainChecks) {
    const source = readJson(sourcePath);
    const { [field]: fingerprint, ...core } = source;
    if (sha256(canonicalText(core)) !== fingerprint || fingerprint !== expected) fail(`chain drift: ${sourcePath}`);
  }

  const rulings = artifact.preRegistration.rulings.map((ruling) => ruling.id);
  if (canonicalText(rulings) !== canonicalText(["OD-84-1", "OD-84-2", "OD-84-3", "OD-84-4", "OD-84-5"])) fail("ruling inventory drift");
  if (!artifact.preRegistration.decisionRules.calibration.includes("EXACT or halt")) fail("calibration decision rule drift");
  if (!artifact.method.referenceImplementation.includes("one windowAnalysis code path")) fail("reference-implementation note drift");
  if (!artifact.method.mirrorRule.includes("seven-element orders only")) fail("mirror rule drift");

  const grounding = artifact.grounding;
  if (grounding.calibration.status !== "EXACT" || grounding.calibration.bl072InvestigationFingerprint !== BL072_FINGERPRINT) fail("grounding calibration drift");
  if (canonicalText(grounding.calibration.matchedFields) !== canonicalText([
    "windows", "perAnchorOverlapCounts", "sizeHistogram", "singletonKeys", "terminalWindows",
    "sizeTwoWindows", "inversionSymmetry.allMirrored", "closureEdge.rotateInterval",
  ])) fail("grounding matched-fields drift");
  const expectedLayers = [...derived.layerIds.entries()].map(([tier, ids]) => ({ tier, count: ids.length }));
  if (canonicalText(grounding.partitions.satelliteLayers) !== canonicalText(expectedLayers)) fail("grounding satellite-layer census drift");
  if (grounding.partitions.a1SetEqualBl066 !== true) fail("grounding A1 set-equality flag drift");
  if (canonicalText(grounding.chainAnchors) !== canonicalText({
    bl072: BL072_FINGERPRINT, bl073: BL073_FINGERPRINT, bl055: BL055_FINGERPRINT,
    bl066: BL066_FINGERPRINT, probe: PROBE_FINGERPRINT, dpg: DPG_FINGERPRINT,
  })) fail("grounding chain-anchor table drift");

  const calibration = artifact.calibration;
  if (canonicalText(calibration.order) !== canonicalText(derived.orbitOrder)) fail("calibration order drift");
  if (calibration.layerTier !== "D6" || calibration.satelliteCount !== 14) fail("calibration layer drift");
  if (canonicalText(calibration.windows) !== canonicalText(derived.calibration.windows)) fail("calibration windows drift");
  if (canonicalText(calibration.perAnchorCounts) !== canonicalText([4, 5, 6, 6, 6, 5, 4])) fail("calibration per-anchor drift");
  if (canonicalText(calibration.sizeHistogram) !== canonicalText({ "1": 2, "2": 2, "3": 10 })) fail("calibration histogram drift");
  if (calibration.verdict !== "FULL" || calibration.bl072Matched !== true) fail("calibration verdict/matched drift");
  if (canonicalText(calibration.singletonKeys) !== canonicalText(derived.calibration.windows.filter((window) => window.terminal).flatMap((window) => window.parents.map((anchor) => `${anchor}:${window.state}`)).sort((left, right) => Number(left.split(":")[0]) - Number(right.split(":")[0]) || Number(left.split(":")[1]) - Number(right.split(":")[1])))) fail("calibration singleton keys drift");
  if (calibration.edgeStructure.closureEdge.rotateInterval !== 6 || calibration.edgeStructure.twoIntervalOrder !== true) fail("calibration edge structure drift");

  const scopeA = artifact.scopeA;
  if (canonicalText(scopeA.order) !== canonicalText(derived.a0Order)) fail("scope A order drift");
  if (scopeA.layerTier !== "A1" || scopeA.satelliteCount !== 28) fail("scope A layer drift");
  if (canonicalText(scopeA.perAnchorCounts) !== canonicalText([2, 4, 4, 4, 4, 4, 2])) fail("scope A per-anchor drift");
  if (canonicalText(scopeA.sizeHistogram) !== canonicalText({ "2": 12 })) fail("scope A histogram drift");
  if (scopeA.verdict !== derived.scopeAVerdict || scopeA.verdict !== "PARTIAL") fail("scope A verdict drift");
  if (scopeA.shapeClass !== "SLIDING_ONE_REGIME") fail("scope A shape class drift");
  if (canonicalText(scopeA.windows) !== canonicalText(derived.scopeAAnalysis.windows)) fail("scope A windows drift");
  const overlay = scopeA.overlay;
  if (canonicalText(overlay.reachedObserved) !== canonicalText(derived.reachedObserved)) fail("scope A overlay reached drift");
  if (canonicalText(overlay.missedObserved) !== canonicalText(derived.missedObserved)) fail("scope A overlay missed drift");
  if (canonicalText(overlay.falsePositives) !== canonicalText(derived.falsePositives)) fail("scope A overlay false-positive drift");
  if (overlay.cornerstoneNearMissSetEqual !== derived.cornerstoneNearMissSetEqual || derived.cornerstoneNearMissSetEqual !== true) fail("scope A cornerstone equality drift");
  if (!overlay.note.includes("zero-seam-incidence")) fail("scope A overlay note drift");

  const scopeB = artifact.scopeB;
  const checkRecord = (artifactRecord, derivedRecord) => {
    if (artifactRecord.tier !== derivedRecord.tier) fail(`scope B tier drift ${artifactRecord.tier}`);
    if (canonicalText(artifactRecord.order) !== canonicalText(derivedRecord.order)) fail(`scope B order drift ${artifactRecord.tier}`);
    if (canonicalText(artifactRecord.edgeStructure) !== canonicalText(derivedRecord.edgeStructure)) fail(`scope B edge structure drift ${artifactRecord.tier}`);
    if (canonicalText(artifactRecord.allLedgerReachPerAnchor) !== canonicalText(derivedRecord.allLedgerReachPerAnchor)) fail(`scope B reach drift ${artifactRecord.tier}`);
    if (artifactRecord.allLedgerReachUniform !== true || derivedRecord.allLedgerReachUniform !== true) fail(`scope B uniform-reach drift ${artifactRecord.tier}`);
    if (canonicalText(artifactRecord.layers) !== canonicalText(derivedRecord.layers)) fail(`scope B layers drift ${artifactRecord.tier}`);
    if (canonicalText(artifactRecord.topLayers) !== canonicalText(derivedRecord.topLayers)) fail(`scope B top layers drift ${artifactRecord.tier}`);
    if (artifactRecord.topVerdict !== derivedRecord.topVerdict) fail(`scope B top verdict drift ${artifactRecord.tier}`);
    if (artifactRecord.bestLayerVerdict !== derivedRecord.bestLayerVerdict) fail(`scope B best verdict drift ${artifactRecord.tier}`);
    if (canonicalText(artifactRecord.slidingLayers) !== canonicalText(derivedRecord.slidingLayers)) fail(`scope B sliding layers drift ${artifactRecord.tier}`);
  };
  if (scopeB.cycles.length !== 7) fail("scope B cycle census drift");
  D_TIER_ORDER.forEach((tier, index) => checkRecord(scopeB.cycles[index], derived.dRecords[index]));
  if (scopeB.supplementaryCycles.length !== 3) fail("scope B supplementary census drift");
  A_TIER_ORDER.forEach((tier, index) => checkRecord(scopeB.supplementaryCycles[index], derived.aRecords[index]));
  const dSliding = derived.dRecords.filter((record) => record.slidingLayers.length > 0).map((record) => record.tier);
  if (canonicalText(scopeB.summary.topVerdicts) !== canonicalText(Object.fromEntries(derived.dRecords.map((record) => [record.tier, record.topVerdict])))) fail("scope B summary verdicts drift");
  if (canonicalText(scopeB.summary.slidingCycles) !== canonicalText(dSliding)) fail("scope B summary sliding drift");
  if (canonicalText(scopeB.summary.singletonOnlyCycles) !== canonicalText(derived.dRecords.filter((record) => record.slidingLayers.length === 0 && record.topVerdict === "PARTIAL").map((record) => record.tier))) fail("scope B summary singleton drift");
  if (canonicalText(scopeB.summary.absentCycles) !== canonicalText(derived.dRecords.filter((record) => record.topVerdict === "ABSENT").map((record) => record.tier))) fail("scope B summary absent drift");
  if (canonicalText(scopeB.summary.fullCycles) !== canonicalText([...derived.dRecords, ...derived.aRecords].filter((record) => record.bestLayerVerdict === "FULL").map((record) => record.tier))) fail("scope B summary full drift");

  const scopeC = artifact.scopeC;
  const census = scopeC.census;
  if (census.edges !== 60 || census.anchors !== 21) fail("scope C census drift");
  if (census.allEdgesHamming2 !== true || census.reversePairsComplete !== true) fail("scope C edge-structure flags drift");
  if (census.directedCount !== derived.directedCycles.length || census.unorderedCount !== derived.groups.size) fail("scope C counts drift");
  if (canonicalText(census.lengthHistogram) !== canonicalText(derived.cycleLengthHistogram)) fail("scope C length histogram drift");
  if (census.noLengthSevenCycles !== true) fail("scope C length-7 flag drift");
  if (scopeC.rows.length !== derived.scopeCRows.length) fail("scope C row census drift");
  for (let index = 0; index < derived.scopeCRows.length; index += 1) {
    const artifactRow = scopeC.rows[index];
    const derivedRow = derived.scopeCRows[index];
    if (artifactRow.pairKey !== derivedRow.pairKey || artifactRow.orientationIndex !== derivedRow.orientationIndex) fail(`scope C row identity drift at ${index}`);
    if (artifactRow.length !== derivedRow.length || canonicalText(artifactRow.order) !== canonicalText(derivedRow.order)) fail(`scope C row order drift at ${index}`);
    if (artifactRow.rotationEdges !== derivedRow.rotationEdges) fail(`scope C rotation-edge drift at ${index}`);
    if (canonicalText(artifactRow.topLayers) !== canonicalText(derivedRow.topLayers)) fail(`scope C top layers drift at ${index}`);
    if (artifactRow.verdict !== derivedRow.verdict) fail(`scope C row verdict drift at ${index}`);
  }
  const aggregate = scopeC.aggregate;
  if (canonicalText(aggregate.directedVerdictHistogram) !== canonicalText(derived.directedVerdictHistogram)) fail("scope C verdict histogram drift");
  if (aggregate.slidingDirectedCount !== derived.slidingDirected.length) fail("scope C sliding count drift");
  if (canonicalText(aggregate.slidingByLength) !== canonicalText(derived.slidingByLength)) fail("scope C sliding-by-length drift");
  if (canonicalText(aggregate.unorderedCensus) !== canonicalText(derived.unorderedCensus)) fail("scope C unordered census drift");
  if (aggregate.slidingUnorderedCount !== derived.unorderedCensus.oneOrientationSliding + derived.unorderedCensus.bothOrientationsSliding) fail("scope C sliding-unordered drift");

  const conditions = artifact.scopeD.conditions;
  if (conditions.length !== 4) fail("scope D condition census drift");
  const byId = new Map(conditions.map((condition) => [condition.id, condition]));
  if (byId.get("D-a").verdict !== "REFUTED") fail("D-a verdict drift");
  if (byId.get("D-b").verdict !== "REFUTED") fail("D-b verdict drift");
  if (byId.get("D-c").verdict !== "SUPPORTED_PROPERTY_NON_DISCRIMINATING") fail("D-c verdict drift");
  if (byId.get("D-d").verdict !== "REFUTED_AS_STATED") fail("D-d verdict drift");
  if (!byId.get("D-a").evidence.includes(String(derived.slidingDirected.length))) fail("D-a evidence count drift");
  if (!byId.get("D-c").evidence.includes("30 per anchor")) fail("D-c evidence drift");
  if (!byId.get("D-d").evidence.includes(String(derived.directedCycles.length))) fail("D-d evidence count drift");
  if (!artifact.scopeD.summary.includes("reach-order alignment")) fail("scope D summary drift");

  const synthesis = artifact.synthesis;
  if (synthesis.verdict !== "BOUNDARY_LAYER_CONDITIONAL") fail("synthesis verdict drift");
  if (!synthesis.universal.includes(String(derived.directedCycles.length - derived.slidingDirected.length))) fail("synthesis universal count drift");
  if (!synthesis.d7Specific.includes(String(derived.unorderedCensus.oneOrientationSliding + derived.unorderedCensus.bothOrientationsSliding))) fail("synthesis d7-specific count drift");
  if (!synthesis.principle.includes("reach-order alignment")) fail("synthesis principle drift");
  if (!synthesis.d7SpecialProperty.includes("class-pure 7-2")) fail("synthesis d7 special-property drift");
  if (!synthesis.a0Context.includes("coordinate image")) fail("synthesis A0 context drift");
  if (!synthesis.higherTheoremNote.includes("no claim event")) fail("synthesis higher-theorem note drift");

  const gsl = artifact.gslTreatment;
  if (gsl.gsl4GeneralizationRefinement.status !== "inline, unapplied (no status change, no new GSL number)") fail("GSL-4 refinement status drift");
  if (!gsl.gsl4GeneralizationRefinement.text.includes("boundary-layer-conditional")) fail("GSL-4 refinement text drift");
  if (!gsl.newEntry.includes("none")) fail("GSL new-entry drift");

  if (artifact.accounting.masksOnly.length < 4 || artifact.accounting.canonicalComputation.length < 4
    || artifact.accounting.remainingGranted.length < 3) fail("accounting tier inventory drift");
  if (!artifact.accounting.statement.includes("no new measurement")) fail("accounting statement drift");

  if (!artifact.fences.noNewMeasurement.includes("BL-070")) fail("no-new-measurement fence drift");
  if (!artifact.fences.calibrationGate.includes("OD-84-5")) fail("calibration-gate fence drift");
  if (!artifact.fences.d7HypothesisTier.includes("2703-2712")) fail("D7 fence drift");
  if (!artifact.fences.membrane.includes("never a probe input")) fail("membrane fence drift");
  if (artifact.notAccomplished.length !== 7) fail("notAccomplished inventory drift");
  if (!artifact.notAccomplished.some((item) => item.includes("no higher-theorem answer"))) fail("higher-theorem non-accomplishment drift");
  if (artifact.contractCitations.length < 10) fail("contract citation inventory drift");
}

// ---------------------------------------------------------------------------
// Static generator checks (two-region)
// ---------------------------------------------------------------------------

function staticIntrinsicCheck(sourceText) {
  const begin = sourceText.indexOf("INTRINSIC-WINDOW-BEGIN");
  const end = sourceText.indexOf("INTRINSIC-WINDOW-END");
  if (begin < 0 || end < 0 || end <= begin) fail("generator intrinsic-region markers missing");
  const before = sourceText.slice(0, begin);
  const region = sourceText.slice(begin, end);
  const comparison = sourceText.slice(end);
  const forbidden = [
    /\bforte\b/, /\bobserved\b/, /cornerstone/, /\bofficeIndex\b/, /\.office\b/, /relationalOffice/,
    /d7SeatContactRows/, /d7ModalRows/,
  ];
  for (const pattern of forbidden) {
    if (pattern.test(region)) fail(`generator intrinsic region reads a forbidden input: ${pattern}`);
    if (pattern.test(before)) fail(`forbidden token before the intrinsic region: ${pattern}`);
  }
  const forbiddenRegion = [
    /BL055_PATH/, /BL072_PATH/, /BL073_PATH/, /BL066_PATH/, /PROBE_PATH/, /DPG_PATH/, /NETWORK_PATH/,
    /bl072/, /bl073/, /bl055/, /bl066/, /probe\./, /dpg\./, /table28/, /heptatonicNodes/,
  ];
  for (const pattern of forbiddenRegion) {
    if (pattern.test(region)) fail(`generator intrinsic region reads a forbidden input: ${pattern}`);
  }
  // region-scoping proof: the comparison region must carry the labelled reads,
  // so a file-scoped scan (over-banning the whole file) is rejected.
  if (!/table28/.test(comparison)) fail("region-scoping proof failed: the comparison region does not read the BL-055 table");
  if (!/d7ModalRows/.test(comparison)) fail("region-scoping proof failed: the comparison region does not read the network records");
  if (!/heptatonicNodes/.test(comparison)) fail("region-scoping proof failed: the comparison region does not read the derived-path-graph nodes");
  if (!/bl073\.cycles\.A0\.order/.test(comparison)) fail("region-scoping proof failed: the comparison region does not read the BL-073 A0 order");
  const required = ["maskOfRow", "hamming12", "rotateMask12", "rotationRelations", "invertMask12", "satelliteLayers", "windowAnalysis", "shapeClassOf", "verdictOf", "compactAnalysis"];
  for (const token of required) {
    if (!region.includes(token)) fail(`generator intrinsic region is missing a required masks-only token: ${token}`);
  }
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validate() {
  const artifact = readJson(ARTIFACT_PATH);
  const sources = {
    ledgerRows: parseCsv(read(LEDGER_PATH)),
    network: readJson(NETWORK_PATH),
    bl072: readJson(BL072_PATH),
    bl073: readJson(BL073_PATH),
    bl055: readJson(BL055_PATH),
    bl066: readJson(BL066_PATH),
    probe: readJson(PROBE_PATH),
    dpg: readJson(DPG_PATH),
  };
  const derived = reDerive(sources);
  checkAgainstArtifact(artifact, derived);

  const { investigationFingerprint, ...artifactCore } = artifact;
  if (sha256(canonicalText(artifactCore)) !== investigationFingerprint) fail("artifact fingerprint self-check failed");

  const generatorSource = read(GENERATOR_PATH);
  staticIntrinsicCheck(generatorSource);

  const repin = (candidate) => {
    const { investigationFingerprint: ignored, ...probeCore } = candidate;
    void ignored;
    return { ...probeCore, investigationFingerprint: sha256(canonicalText(probeCore)) };
  };
  const clone = (value) => JSON.parse(JSON.stringify(value));
  let probeCount = 0;
  const expectRejection = (label, mutated) => {
    let rejected = false;
    try {
      checkAgainstArtifact(repin(mutated), derived);
    } catch {
      rejected = true;
    }
    if (!rejected) fail(`mutation probe not rejected: ${label}`);
    probeCount += 1;
  };

  const calibrationCountDrift = clone(artifact);
  calibrationCountDrift.calibration.perAnchorCounts = [4, 5, 6, 6, 6, 5, 5];
  expectRejection("calibration per-anchor drift", calibrationCountDrift);
  const calibrationWindowDrift = clone(artifact);
  calibrationWindowDrift.calibration.windows[0].state = "191";
  expectRejection("calibration window drift", calibrationWindowDrift);
  const calibrationWindowStrip = clone(artifact);
  calibrationWindowStrip.calibration.windows.pop();
  expectRejection("calibration window strip", calibrationWindowStrip);
  const calibrationKeyDrift = clone(artifact);
  calibrationKeyDrift.calibration.singletonKeys = ["127:191", "4033:2017"];
  expectRejection("calibration singleton-key swap", calibrationKeyDrift);
  const calibrationMatchedFlip = clone(artifact);
  calibrationMatchedFlip.calibration.bl072Matched = false;
  expectRejection("calibration matched flip", calibrationMatchedFlip);
  const calibrationClosureDrift = clone(artifact);
  calibrationClosureDrift.calibration.edgeStructure.closureEdge.rotateInterval = 11;
  expectRejection("calibration closure drift", calibrationClosureDrift);
  const scopeACountDrift = clone(artifact);
  scopeACountDrift.scopeA.perAnchorCounts = [2, 4, 4, 4, 4, 4, 4];
  expectRejection("scope A per-anchor drift", scopeACountDrift);
  const scopeAVerdictFlip = clone(artifact);
  scopeAVerdictFlip.scopeA.verdict = "FULL";
  expectRejection("scope A verdict flip", scopeAVerdictFlip);
  const scopeAShapeDrift = clone(artifact);
  scopeAShapeDrift.scopeA.shapeClass = "TWO_REGIME";
  expectRejection("scope A shape drift", scopeAShapeDrift);
  const scopeAMissedDrift = clone(artifact);
  scopeAMissedDrift.scopeA.overlay.missedObserved = ["2395", "2965"];
  expectRejection("scope A overlay missed drift", scopeAMissedDrift);
  const scopeAFalsePositive = clone(artifact);
  scopeAFalsePositive.scopeA.overlay.falsePositives = ["1243"];
  expectRejection("scope A overlay false positive", scopeAFalsePositive);
  const scopeAEqualityFlip = clone(artifact);
  scopeAEqualityFlip.scopeA.overlay.cornerstoneNearMissSetEqual = false;
  expectRejection("scope A cornerstone equality flip", scopeAEqualityFlip);
  const scopeAWindowStrip = clone(artifact);
  scopeAWindowStrip.scopeA.windows.pop();
  expectRejection("scope A window strip", scopeAWindowStrip);
  const d7VerdictFlip = clone(artifact);
  d7VerdictFlip.scopeB.cycles[6].topVerdict = "PARTIAL";
  expectRejection("D7 top verdict flip", d7VerdictFlip);
  const d2VerdictFlip = clone(artifact);
  d2VerdictFlip.scopeB.cycles[1].topVerdict = "PARTIAL";
  expectRejection("D2 top verdict flip", d2VerdictFlip);
  const d7TopLayerDrift = clone(artifact);
  d7TopLayerDrift.scopeB.cycles[6].topLayers = ["D4"];
  expectRejection("D7 top layer drift", d7TopLayerDrift);
  const layerStrip = clone(artifact);
  layerStrip.scopeB.cycles[6].layers.pop();
  expectRejection("scope B layer strip", layerStrip);
  const layerVerdictDrift = clone(artifact);
  layerVerdictDrift.scopeB.cycles[0].layers[0].verdict = "FULL";
  expectRejection("scope B layer verdict drift", layerVerdictDrift);
  const reachDrift = clone(artifact);
  reachDrift.scopeB.cycles[3].allLedgerReachPerAnchor[0].count = 29;
  expectRejection("scope B reach drift", reachDrift);
  const slidingInject = clone(artifact);
  slidingInject.scopeB.cycles[0].slidingLayers = ["A0"];
  expectRejection("scope B sliding-layer injection", slidingInject);
  const edgeStructureDrift = clone(artifact);
  edgeStructureDrift.scopeB.cycles[6].edgeStructure.twoIntervalOrder = false;
  expectRejection("scope B edge-structure drift", edgeStructureDrift);
  const summaryDrift = clone(artifact);
  summaryDrift.scopeB.summary.topVerdicts.D7 = "PARTIAL";
  expectRejection("scope B summary drift", summaryDrift);
  const a2BestDrift = clone(artifact);
  a2BestDrift.scopeB.supplementaryCycles[2].bestLayerVerdict = "PARTIAL";
  expectRejection("A2 best-layer drift", a2BestDrift);
  const cCountDrift = clone(artifact);
  cCountDrift.scopeC.census.directedCount = 475;
  expectRejection("scope C directed count drift", cCountDrift);
  const cHistogramDrift = clone(artifact);
  cHistogramDrift.scopeC.census.lengthHistogram["7"] = 1;
  expectRejection("scope C length histogram drift", cHistogramDrift);
  const cRowVerdictDrift = clone(artifact);
  cRowVerdictDrift.scopeC.rows[0].verdict = "ABSENT";
  expectRejection("scope C row verdict drift", cRowVerdictDrift);
  const cRowOrderDrift = clone(artifact);
  cRowOrderDrift.scopeC.rows[0].order = [...cRowOrderDrift.scopeC.rows[0].order].reverse();
  expectRejection("scope C row order drift", cRowOrderDrift);
  const cRowStrip = clone(artifact);
  cRowStrip.scopeC.rows.pop();
  expectRejection("scope C row strip", cRowStrip);
  const cSlidingDrift = clone(artifact);
  cSlidingDrift.scopeC.aggregate.slidingDirectedCount = 13;
  expectRejection("scope C sliding count drift", cSlidingDrift);
  const cUnorderedDrift = clone(artifact);
  cUnorderedDrift.scopeC.aggregate.unorderedCensus.neitherSliding = 223;
  expectRejection("scope C unordered census drift", cUnorderedDrift);
  const cLengthDrift = clone(artifact);
  cLengthDrift.scopeC.aggregate.slidingByLength["10"] = 5;
  expectRejection("scope C sliding-by-length drift", cLengthDrift);
  const daFlip = clone(artifact);
  daFlip.scopeD.conditions[0].verdict = "SUPPORTED";
  expectRejection("D-a verdict flip", daFlip);
  const dcFlip = clone(artifact);
  dcFlip.scopeD.conditions[2].verdict = "SUPPORTED";
  expectRejection("D-c verdict flip", dcFlip);
  const ddFlip = clone(artifact);
  ddFlip.scopeD.conditions[3].verdict = "SUPPORTED";
  expectRejection("D-d verdict flip", ddFlip);
  const synthesisFlip = clone(artifact);
  synthesisFlip.synthesis.verdict = "UNIVERSAL";
  expectRejection("synthesis verdict flip", synthesisFlip);
  const synthesisPrincipleDrift = clone(artifact);
  synthesisPrincipleDrift.synthesis.principle = "the ladder is universal";
  expectRejection("synthesis principle drift", synthesisPrincipleDrift);
  const gslStatusDrift = clone(artifact);
  gslStatusDrift.gslTreatment.gsl4GeneralizationRefinement.status = "applied";
  expectRejection("GSL-4 refinement status drift", gslStatusDrift);
  const gslNewEntryDrift = clone(artifact);
  gslNewEntryDrift.gslTreatment.newEntry = "GSL-8 registered";
  expectRejection("GSL new-entry drift", gslNewEntryDrift);
  const fenceDrift = clone(artifact);
  fenceDrift.fences.noNewMeasurement = "no constraint";
  expectRejection("no-new-measurement fence drift", fenceDrift);
  const calibrationFenceDrift = clone(artifact);
  calibrationFenceDrift.fences.calibrationGate = "n/a";
  expectRejection("calibration-gate fence drift", calibrationFenceDrift);
  const d7FenceDrift = clone(artifact);
  d7FenceDrift.fences.d7HypothesisTier = "D7 promoted";
  expectRejection("D7 fence drift", d7FenceDrift);
  const basePinDrift = clone(artifact);
  basePinDrift.base.bl072.investigationFingerprint = "0".repeat(64);
  expectRejection("BL-072 base pin drift", basePinDrift);
  const probePinDrift = clone(artifact);
  probePinDrift.base.probe.probeFingerprint = "0".repeat(64);
  expectRejection("probe base pin drift", probePinDrift);
  const bindingDrift = clone(artifact);
  bindingDrift.sourceBindings[0].sha256 = "0".repeat(64);
  expectRejection("source binding sha drift", bindingDrift);
  const rulingStrip = clone(artifact);
  rulingStrip.preRegistration.rulings.pop();
  expectRejection("ruling inventory strip", rulingStrip);
  const accountingStrip = clone(artifact);
  accountingStrip.accounting.masksOnly = [];
  expectRejection("accounting tier emptying", accountingStrip);
  const notAccomplishedStrip = clone(artifact);
  notAccomplishedStrip.notAccomplished.pop();
  expectRejection("notAccomplished strip", notAccomplishedStrip);
  const citationStrip = clone(artifact);
  citationStrip.contractCitations = [];
  expectRejection("contract citation emptying", citationStrip);
  const headerDrift = clone(artifact);
  headerDrift.status = "admitted";
  expectRejection("status drift", headerDrift);
  const methodDrift = clone(artifact);
  methodDrift.method.mirrorRule = "mirroring applies everywhere";
  expectRejection("mirror rule drift", methodDrift);

  const staticProbes = [
    ["smuggled office-index read", "const drawn = ledgerRows[0].officeIndex; void drawn;"],
    ["smuggled office-field read", "const drawn = ledgerRows[0].office; void drawn;"],
    ["smuggled class-label read", "const drawn = ledgerRows[0].forte; void drawn;"],
    ["smuggled observed-flag read", "const drawn = ledgerRows[0].observed; void drawn;"],
    ["smuggled network modal read", "const drawn = network.d7ModalRows; void drawn;"],
    ["smuggled BL-055 table read", "const drawn = bl055.table28; void drawn;"],
    ["smuggled BL-072 mapping read", "const drawn = bl072.geometricMapping; void drawn;"],
    ["smuggled BL-073 order read", "const drawn = bl073.cycles.A0.order; void drawn;"],
    ["smuggled probe read", "const drawn = probe.modalClosure; void drawn;"],
    ["smuggled dpg read", "const drawn = dpg.heptatonicNodes; void drawn;"],
  ];
  let staticRejections = 0;
  for (const [label, smuggled] of staticProbes) {
    let rejected = false;
    try {
      staticIntrinsicCheck(generatorSource.replace(
        "export function satelliteLayers(ledgerRows) {",
        `export function satelliteLayers(ledgerRows) { ${smuggled}`,
      ));
    } catch {
      rejected = true;
    }
    if (!rejected) fail(`mutation probe not rejected: ${label}`);
    staticRejections += 1;
  }
  const stripProbes = ["maskOfRow", "hamming12", "rotateMask12", "rotationRelations", "invertMask12", "satelliteLayers", "windowAnalysis", "shapeClassOf", "verdictOf", "compactAnalysis"];
  for (const token of stripProbes) {
    let rejected = false;
    try {
      staticIntrinsicCheck(generatorSource.split(token).join("STRIPPED"));
    } catch {
      rejected = true;
    }
    if (!rejected) fail(`presence-strip probe not rejected: ${token}`);
    staticRejections += 1;
  }
  const permissiveSource = generatorSource.replace(
    "// ==== INTRINSIC-WINDOW-END ====",
    "// ==== INTRINSIC-WINDOW-END ==== const allowedLabelRead = ledgerRows[0].forte; void allowedLabelRead;",
  );
  staticIntrinsicCheck(permissiveSource);
  let proofStripRejected = false;
  try {
    staticIntrinsicCheck(generatorSource.split("table28").join("table_28"));
  } catch {
    proofStripRejected = true;
  }
  if (!proofStripRejected) fail("mutation probe not rejected: region-scoping proof strip");

  console.log(JSON.stringify({
    artifact: ARTIFACT_PATH,
    status: "PASS",
    investigationFingerprint: artifact.investigationFingerprint,
    chainFingerprints: {
      bl072: BL072_FINGERPRINT,
      bl073: BL073_FINGERPRINT,
      bl055: BL055_FINGERPRINT,
      bl066: BL066_FINGERPRINT,
      probe: PROBE_FINGERPRINT,
      dpg: DPG_FINGERPRINT,
    },
    calibration: `EXACT (BL-072 matched field-for-field); per-anchor ${artifact.calibration.perAnchorCounts.join("/")}`,
    scopeA: `${artifact.scopeA.verdict} (sizes ${JSON.stringify(artifact.scopeA.sizeHistogram)}; cornerstone near-miss set-equal)`,
    scopeB: artifact.scopeB.summary.topVerdicts,
    scopeC: `${artifact.scopeC.aggregate.slidingDirectedCount} sliding of ${artifact.scopeC.census.directedCount} directed cycles; unordered ${artifact.scopeC.census.unorderedCount}; sliding unordered ${artifact.scopeC.aggregate.slidingUnorderedCount}`,
    scopeD: Object.fromEntries(artifact.scopeD.conditions.map((condition) => [condition.id, condition.verdict])),
    synthesis: artifact.synthesis.verdict,
    mutationProbes: probeCount,
    staticRejections,
    regionScoping: "permissive pass + proof strip rejected",
  }, null, 2));
}

validate();
