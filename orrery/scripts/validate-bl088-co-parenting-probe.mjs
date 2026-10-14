#!/usr/bin/env node
/**
 * Validate the generated BL-088 co-parenting probe against its sources.
 *
 * Independent of the generator: re-reads the 462-record ledger, the network,
 * the bipartite containment graph, and the landed BL-084/BL-087/BL-073/
 * d-tier-probe/derived-path-graph artifacts; re-derives the containment
 * censuses (both directions), the window structures and cut classifications
 * through an independently written satellite-to-anchor data flow, the reach
 * pair machinery, the correspondence aggregates, the D1 anchor and the rho
 * relocation; re-applies the synthesis decision rule; re-checks the artifact
 * fingerprint and the chain pins; statically verifies the generator's
 * two-region isolation; and runs mutation probes (artifact drift, smuggled
 * reads, presence strips). Fail-loud.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..", "..");

const ARTIFACT_PATH = "orrery/src/generated/bl088-co-parenting-probe.v1.json";
const GENERATOR_PATH = "scripts/build-bl088-co-parenting-probe.mjs";
const SCHEMA_VERSION = "harmonic-orrery.bl088-co-parenting-probe.v1";
const INVESTIGATION_ID = "BL088_CO_PARENTING_PROBE_V1";
const BIPARTITE_PATH = "derived/hypergraph/bipartite-inclusion-v1.json";
const LEDGER_PATH = "canonical/universal-heptatonic-ledger.csv";
const NETWORK_PATH = "canonical/universal-network-data.json";
const BL084_PATH = "orrery/src/generated/bl084-window-ladder.v1.json";
const BL087_PATH = "orrery/src/generated/bl087-klein-ladder-probe.v1.json";
const BL073_PATH = "orrery/src/generated/bl073-isometry-probe.v1.json";
const PROBE_PATH = "orrery/src/generated/d-tier-operator-probe.v1.json";
const DPG_PATH = "orrery/src/generated/derived-path-graph.v1.json";

const BIPARTITE_SHA256 = "903eebf0e1122d8ba81971abcd7efc8ac934d3bfd7885b98b49e58ab0bbe3e41";
const BL084_FINGERPRINT = "6865b0760c398dff857e3234b46cd8845647411f53bca3b502c6fbceb36d1a53";
const BL087_FINGERPRINT = "ad74a7e61769b777d5ba52835d3d95c1aeb0427b442f68397a4fe60de6eb2bb1";
const BL073_FINGERPRINT = "811fa786f3a03b03b0c334fe797c85b9b4aeed93332a183be43f86fa1133a65c";
const PROBE_FINGERPRINT = "068f9007c7330f84b9654547da7d0be0593276053df98c3b9f7893426f03ab22";
const DPG_FINGERPRINT = "4c7abcb1d82cc5b7d1fea0227dce1bb8a88f7fd6624469f55f0d1bb26edf254f";

const A_TIER_ORDER = ["A0", "A1", "A2"];
const D_TIER_ORDER = ["D1", "D2", "D3", "D4", "D5", "D6", "D7"];

function fail(message) {
  throw new Error(`INVALID_BL088_CO_PARENTING_PROBE: ${message}`);
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

function canonicalText(value) {
  if (value === null) return "null";
  if (value === true) return "true";
  if (value === false) return "false";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isInteger(value)) fail("non-integer number in verification payload");
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
  return text.replace(/[{}]/g, "").split(",").filter((value) => value.length > 0).map(Number);
}

const cmp = (left, right) => (left < right ? -1 : left > right ? 1 : 0);

function maskFromPitches(pitches) {
  let mask = 0;
  for (const pitch of pitches) mask |= 1 << pitch;
  return mask;
}

function affineApply(mask, unit) {
  let image = 0;
  for (let pitch = 0; pitch < 12; pitch += 1) if ((mask >> pitch) & 1) image |= 1 << ((unit * pitch) % 12);
  return image & 4095;
}

function invertMask(mask) {
  let result = 0;
  for (let pitch = 0; pitch < 12; pitch += 1) {
    if ((mask >> pitch) & 1) result |= 1 << ((12 - pitch) % 12);
  }
  return result;
}

function hamming(left, right) {
  let value = left ^ right;
  let count = 0;
  while (value !== 0) { count += value & 1; value >>= 1; }
  return count;
}

function containmentOverlap(leftList, rightList) {
  const right = new Set(rightList);
  return leftList.filter((entry) => right.has(entry));
}

// ---------------------------------------------------------------------------
// Independent re-derivation (satellite-to-anchor data flow)
// ---------------------------------------------------------------------------

function independentWindow(order, layerIds, masks, allIds) {
  const size = order.length;
  const reaches = [];
  for (const satellite of layerIds) {
    const indices = [];
    order.forEach((anchor, index) => {
      if (hamming(masks.get(anchor), masks.get(satellite)) === 2) indices.push(index);
    });
    if (indices.length === 0) continue;
    reaches.push({ state: satellite, indices });
  }
  reaches.sort((left, right) => Math.min(...left.indices) - Math.min(...right.indices)
    || left.indices.length - right.indices.length || cmp(left.state, right.state));
  const windows = reaches.map((entry) => {
    const start = Math.min(...entry.indices);
    const end = Math.max(...entry.indices);
    let cyclic = true;
    if (entry.indices.length > 1) {
      cyclic = false;
      for (let anchor = 0; anchor < size; anchor += 1) {
        const run = new Set();
        for (let step = 0; step < entry.indices.length; step += 1) run.add((anchor + step) % size);
        if (run.size === entry.indices.length && entry.indices.every((index) => run.has(index))) { cyclic = true; break; }
      }
    }
    return {
      state: entry.state,
      parents: entry.indices.map((index) => order[index]),
      indices: [...entry.indices].sort((left, right) => left - right),
      size: entry.indices.length,
      consecutive: end - start + 1 === entry.indices.length,
      cyclic,
      fullRange: entry.indices.length === size,
    };
  });
  const perAnchorCounts = order.map((anchor, index) => reaches.filter((entry) => entry.indices.includes(index)).length);
  const allConsecutive = windows.every((window) => window.consecutive);
  const sizeHistogram = {};
  for (const window of windows) sizeHistogram[String(window.size)] = (sizeHistogram[String(window.size)] ?? 0) + 1;
  const hasTerminal = windows.some((window) => window.size === 1);
  const hasInterior = windows.some((window) => window.size >= 2);
  let mirror = null;
  if (size === 7) {
    const byReflection = new Map(allIds.map((state) => [affineApply(masks.get(state), 11), state]));
    mirror = windows.every((window) => {
      const partner = byReflection.get(masks.get(window.state));
      if (partner === undefined) return false;
      const partnerWindow = windows.find((entry) => entry.state === partner);
      return partnerWindow ? partnerWindow.indices[0] === 6 - window.indices[window.indices.length - 1]
        && partnerWindow.indices[partnerWindow.indices.length - 1] === 6 - window.indices[0] : false;
    });
  }
  const shapeClass = !allConsecutive ? "NON_CONSECUTIVE"
    : hasTerminal && hasInterior ? "TWO_REGIME"
      : hasInterior ? "SLIDING_ONE_REGIME" : "SINGLETON_PARTITION";
  const verdict = shapeClass === "NON_CONSECUTIVE" ? "ABSENT" : shapeClass === "TWO_REGIME" && mirror !== false ? "FULL" : "PARTIAL";
  const totalInstances = perAnchorCounts.reduce((sum, value) => sum + value, 0);
  return { windows, perAnchorCounts, allConsecutive, sizeHistogram, mirror, shapeClass, verdict, reachedCount: windows.length, totalInstances };
}

function independentCuts(order, windows) {
  const size = order.length;
  const nonCyclic = windows.filter((window) => !window.cyclic);
  const cuts = [];
  for (let k = 0; k < size; k += 1) {
    const a = order[k];
    const b = order[(k + 1) % size];
    const naive = windows.filter((window) => window.parents.includes(a) && window.parents.includes(b) && !window.fullRange);
    const exactStates = [...new Set([...naive.map((window) => window.state), ...nonCyclic.map((window) => window.state)])].sort(cmp);
    cuts.push({
      k,
      pair: [a, b],
      naiveCount: naive.length,
      exactCount: exactStates.length,
      exactStates,
      spanning: exactStates.length >= 1,
      pairProduced: exactStates.length >= 2,
      singleWitness: exactStates.length === 1,
    });
  }
  return cuts;
}

function independentPairs(order, windows) {
  const size = order.length;
  const list = [];
  for (let i = 0; i < windows.length; i += 1) {
    for (let j = i + 1; j < windows.length; j += 1) {
      const shared = windows[i].parents.filter((parent) => windows[j].parents.includes(parent));
      if (shared.length < 2) continue;
      const indices = shared.map((parent) => order.indexOf(parent)).sort((left, right) => left - right);
      const adjacentCuts = [];
      for (let x = 0; x < indices.length; x += 1) {
        for (let y = x + 1; y < indices.length; y += 1) {
          const distance = Math.abs(indices[x] - indices[y]);
          if (distance === 1 || distance === size - 1) {
            const cutIndex = distance === 1 ? Math.min(indices[x], indices[y]) : size - 1;
            if (!adjacentCuts.includes(cutIndex)) adjacentCuts.push(cutIndex);
          }
        }
      }
      adjacentCuts.sort((left, right) => left - right);
      const members = [windows[i].state, windows[j].state].sort(cmp);
      list.push({ a: members[0], b: members[1], shared: [...shared].sort(cmp), adjacentCuts, fertile: adjacentCuts.length > 0, strict: shared.length === 2 });
    }
  }
  list.sort((left, right) => cmp(left.a, right.a) || cmp(left.b, right.b));
  const fertile = list.filter((pair) => pair.fertile).length;
  return { count: list.length, fertile, infertile: list.length - fertile, strict: list.filter((pair) => pair.strict).length, list };
}

function independentClassification(cuts, pairs, windows) {
  const nonCyclic = windows.filter((window) => !window.cyclic);
  const fullRange = windows.filter((window) => window.fullRange);
  const spanning = cuts.filter((cut) => cut.spanning).length;
  const pairProduced = cuts.filter((cut) => cut.pairProduced).length;
  const singleWitnessCuts = cuts.filter((cut) => cut.singleWitness).map((cut) => cut.k);
  const reductionExact = nonCyclic.length === 0 && fullRange.length === 0;
  const noSpanning = spanning === 0;
  const fault = !reductionExact && spanning > 0;
  const partial = spanning > 0 && singleWitnessCuts.length > 0;
  const exact = spanning > 0 && reductionExact && singleWitnessCuts.length === 0 && pairs.fertile === pairs.count;
  const primary = fault
    ? (nonCyclic.length > 0 && fullRange.length > 0 ? "FAULT_MIXED" : nonCyclic.length > 0 ? "FAULT_NON_CYCLIC" : "FAULT_FULL_RANGE")
    : partial
      ? "PARTIAL_SINGLE_WITNESS"
      : exact
        ? "EXACT"
        : noSpanning
          ? "NO_SPANNING"
          : "PARTIAL_INFERTILE";
  return { spanning, pairProduced, singleWitnessCuts, reductionExact, exact, partial, fault, noSpanning, primary };
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
      if (next === start && pathNodes.length >= 3) { cycles.push([...pathNodes]); continue; }
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
  const candidates = [...rotations(sequence), ...rotations([...sequence].reverse())].map((rotation) => rotation.join(","));
  candidates.sort(cmp);
  return candidates[0];
}

function topLayerRecords(cycleOrder, layers, masks, allIds) {
  const records = [];
  for (const [tier, ids] of layers.entries()) {
    const analysis = independentWindow(cycleOrder, ids, masks, allIds);
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

// ---------------------------------------------------------------------------
// Sources
// ---------------------------------------------------------------------------

function buildSources() {
  const ledgerRows = parseCsv(read(LEDGER_PATH));
  const network = readJson(NETWORK_PATH);
  const bipartite = readJson(BIPARTITE_PATH);
  const bl084 = readJson(BL084_PATH);
  const bl087 = readJson(BL087_PATH);
  const bl073 = readJson(BL073_PATH);
  const probe = readJson(PROBE_PATH);
  const dpg = readJson(DPG_PATH);
  const masks = new Map(ledgerRows.map((row) => [String(row.id), maskFromPitches(parsePitchSet(row.pitchSet))]));
  const allIds = ledgerRows.map((row) => String(row.id));
  const rowById = new Map(ledgerRows.map((row) => [String(row.id), row]));
  const pentNodes = Object.values(bipartite.pentatonicSubnodes);
  const heptNodes = Object.values(bipartite.heptatonicNodes);
  for (const node of pentNodes) masks.set(node.id, node.pitchMask);
  const mergedIds = [...allIds, ...pentNodes.map((node) => node.id).sort(cmp)];
  const pentIds = pentNodes.map((node) => node.id).sort(cmp);
  const layers = new Map();
  for (const row of ledgerRows) {
    if (row.role !== "satellite") continue;
    if (!layers.has(row.tier)) layers.set(row.tier, []);
    layers.get(row.tier).push(String(row.id));
  }
  for (const ids of layers.values()) ids.sort((left, right) => cmp(Number(left), Number(right)));

  const successor = new Map(network.d7ModalRows.map((row) => [String(row.source), String(row.target)]));
  const orbitOrder = [];
  let cursor = "127";
  for (let step = 0; step < 7; step += 1) { orbitOrder.push(cursor); cursor = successor.get(cursor); }
  if (cursor !== "127") fail("modal orbit does not close");
  const a0Order = bl073.cycles.A0.order.slice();
  const cycleSources = { dToD: probe.modalClosure.dToD.cycles, aToA: probe.modalClosure.aToA.cycles };
  const scopeBCycles = [
    ...D_TIER_ORDER.map((tier) => ({ tier, order: cycleSources.dToD.find((cycle) => cycle.tier === tier).stateIds.map(String) })),
    ...A_TIER_ORDER.map((tier) => ({ tier, order: tier === "A0" ? a0Order : cycleSources.aToA.find((cycle) => cycle.tier === tier).stateIds.map(String) })),
  ];
  const heptByKey = new Map(Object.entries(dpg.heptatonicNodes).map(([key, node]) => [key, String(node.pitchMask)]));
  const catalogEdges = dpg.operatorEdges.map((edge) => ({ from: heptByKey.get(edge.sourceNodeId), to: heptByKey.get(edge.targetNodeId) }));
  const directedCycles = enumerateDirectedCycles(catalogEdges);
  const pairGroups = new Map();
  for (const cycle of directedCycles) {
    const key = canonicalCycleKey(cycle);
    if (!pairGroups.has(key)) pairGroups.set(key, []);
    pairGroups.get(key).push(cycle);
  }
  return {
    ledgerRows, network, bipartite, bl084, bl087, bl073, probe, dpg,
    masks, allIds, mergedIds, pentIds, pentNodes, heptNodes, rowById, layers,
    orbitOrder, a0Order, scopeBCycles, pairGroups,
  };
}

// ---------------------------------------------------------------------------
// Independent census over the artifact populations
// ---------------------------------------------------------------------------

function reDerive(sources) {
  const {
    ledgerRows, masks, allIds, mergedIds, pentIds, pentNodes, heptNodes, layers,
    orbitOrder, a0Order, scopeBCycles, pairGroups,
  } = sources;
  const rowOf = (state) => sources.rowById.get(state);
  const rowFor = (order, layerIds, allIdsForMirror) => {
    const analysis = independentWindow(order, layerIds, masks, allIdsForMirror);
    const cuts = independentCuts(order, analysis.windows);
    const pairs = independentPairs(order, analysis.windows);
    const classification = independentClassification(cuts, pairs, analysis.windows);
    return { analysis, cuts, pairs, classification };
  };

  const scopeB = [];
  for (const cycle of scopeBCycles) {
    for (const [tier, ids] of layers.entries()) {
      const derived = rowFor(cycle.order, ids, allIds);
      if (derived.analysis.reachedCount === 0) continue;
      scopeB.push({ cycleTier: cycle.tier, layerTier: tier, order: cycle.order, derived });
    }
  }
  const scopeC = [];
  for (const [key, group] of pairGroups.entries()) {
    const orientations = group.map((cycle) => ({ cycle, records: topLayerRecords(cycle, layers, masks, allIds) }))
      .sort((left, right) => cmp(left.cycle.join(","), right.cycle.join(",")));
    orientations.forEach((orientation, orientationIndex) => {
      const topTotal = orientation.records[0].analysis.totalInstances;
      for (const record of orientation.records.filter((entry) => entry.analysis.totalInstances === topTotal)) {
        const derived = rowFor(orientation.cycle, layers.get(record.tier), allIds);
        scopeC.push({ pairKey: key, orientationIndex, order: orientation.cycle, layerTier: record.tier, derived });
      }
    });
  }
  const pentScopeB = scopeBCycles.map((cycle) => ({ cycleTier: cycle.tier, layerTier: "PENT", order: cycle.order, derived: rowFor(cycle.order, pentIds, mergedIds) }));
  const pentScopeC = [];
  for (const [key, group] of pairGroups.entries()) {
    const orientations = group.map((cycle) => ({ cycle })).sort((left, right) => cmp(left.cycle.join(","), right.cycle.join(",")));
    orientations.forEach((orientation, orientationIndex) => {
      pentScopeC.push({ pairKey: key, orientationIndex, order: orientation.cycle, layerTier: "PENT", derived: rowFor(orientation.cycle, pentIds, mergedIds) });
    });
  }
  scopeC.sort((left, right) => left.order.length - right.order.length
    || cmp(left.pairKey, right.pairKey)
    || left.orientationIndex - right.orientationIndex
    || cmp(left.layerTier, right.layerTier));
  pentScopeC.sort((left, right) => left.order.length - right.order.length
    || cmp(left.pairKey, right.pairKey)
    || left.orientationIndex - right.orientationIndex);

  const d1Census = rowFor(sources.bl087.diagnostics.rhoA1Relocation.imageOrder.slice(), layers.get("A2"), allIds);
  void d1Census;
  const a1Order = sources.probe.modalClosure.aToA.cycles.find((cycle) => cycle.tier === "A1").stateIds.map(String);
  const a1Derived = rowFor(a1Order, layers.get("A2"), allIds);
  const d1Windows = a1Derived.analysis.windows.filter((window) => ["1359", "1401"].includes(window.state));
  const rhoImage = a1Order.map((state) => {
    const imageMask = affineApply(masks.get(state), 11);
    const row = ledgerRows.find((candidate) => maskFromPitches(parsePitchSet(candidate.pitchSet)) === imageMask);
    if (!row) fail("rho image is ledger-absent");
    return String(row.id);
  });
  const rhoDerived = rowFor(rhoImage, layers.get("A2"), allIds);
  const rhoSpanning = rhoDerived.analysis.windows.filter((window) => !window.consecutive);

  const rotationCuts = (order, layerIds) => {
    const cuts = [];
    for (let shift = 0; shift < order.length; shift += 1) {
      const rotated = [...order.slice(shift), ...order.slice(0, shift)];
      const analysis = independentWindow(rotated, layerIds, masks, allIds);
      cuts.push({ shift, allConsecutive: analysis.allConsecutive, verdict: analysis.verdict });
    }
    return cuts;
  };
  const bl087Cuts = {
    A0: rotationCuts(a0Order, layers.get("A0")),
    D7: rotationCuts(orbitOrder, layers.get("D6")),
    A1: rotationCuts(a1Order, layers.get("A2")),
  };

  const containmentCensus = (nodes, listKey) => {
    let ge1 = 0;
    let ge2 = 0;
    let ge3 = 0;
    const histogram = {};
    const pairSet = new Set();
    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        const overlap = containmentOverlap(nodes[i][listKey], nodes[j][listKey]).length;
        histogram[String(overlap)] = (histogram[String(overlap)] ?? 0) + 1;
        if (overlap >= 1) ge1 += 1;
        if (overlap >= 2) {
          ge2 += 1;
          const members = [nodes[i].id, nodes[j].id].sort(cmp);
          pairSet.add(`${members[0]}|${members[1]}`);
        }
        if (overlap >= 3) ge3 += 1;
      }
    }
    return { ge1, ge2, ge3, histogram, pairSet };
  };
  const pCensus = containmentCensus(pentNodes, "parentsRooted");
  const hCensus = containmentCensus(heptNodes, "subnodes");
  let hamming2Count = 0;
  for (let i = 0; i < heptNodes.length; i += 1) {
    for (let j = i + 1; j < heptNodes.length; j += 1) {
      if (hamming(heptNodes[i].pitchMask, heptNodes[j].pitchMask) === 2) hamming2Count += 1;
    }
  }

  const aTierAnchorMasks = new Set(ledgerRows.filter((row) => A_TIER_ORDER.includes(row.tier) && row.role === "anchor").map((row) => maskFromPitches(parsePitchSet(row.pitchSet))));
  const allRows = [
    ...scopeB.map((row) => ({ ...row, shape: "B" })),
    ...scopeC.map((row) => ({ ...row, shape: "C" })),
    ...pentScopeB.map((row) => ({ ...row, shape: "B" })),
    ...pentScopeC.map((row) => ({ ...row, shape: "C" })),
  ];
  const spanningRows = allRows.filter((row) => row.derived.classification.spanning > 0);
  const exactRows = spanningRows.filter((row) => row.derived.classification.exact);
  const faultRows = spanningRows.filter((row) => row.derived.classification.fault);
  const exactIsBoundary = exactRows.length > 0 && exactRows.every((row) => {
    if (row.shape === "B") return true;
    return row.order.every((state) => aTierAnchorMasks.has(masks.get(state)));
  });
  const exactIsA1Only = exactRows.length <= 3 && exactRows.every((row) => row.cycleTier === "A1" && row.layerTier === "A2");
  const exactRate = spanningRows.length > 0 ? exactRows.length / spanningRows.length : 0;
  const verdict = exactRate >= 0.9 ? "GENERAL" : exactIsA1Only ? "A1_SPECIFIC" : exactIsBoundary ? "BOUNDARY_LAYER_CONDITIONAL" : "PARTIAL_GENERAL";

  return {
    scopeB, scopeC, pentScopeB, pentScopeC,
    d1: {
      windows: d1Windows,
      wrapCut: a1Derived.cuts.find((cut) => cut.k === 6),
      pair: a1Derived.pairs.list.find((pair) => pair.a === "1359" && pair.b === "1401"),
    },
    rho: { image: rhoImage, spanning: rhoSpanning },
    bl087Cuts,
    pCensus, hCensus, hamming2Count,
    exactRows: exactRows.map((row) => ({ cycle: row.cycleTier ?? row.pairKey, layer: row.layerTier, shape: row.shape })),
    faultRows,
    spanningCount: spanningRows.length,
    verdict,
    sources,
  };
}

// ---------------------------------------------------------------------------
// Artifact comparison
// ---------------------------------------------------------------------------

function deepEqual(left, right) {
  return canonicalText(left) === canonicalText(right);
}

function expectedCompact(analysis) {
  return {
    perAnchorCounts: analysis.perAnchorCounts,
    reachedCount: analysis.reachedCount,
    allConsecutive: analysis.allConsecutive,
    sizeHistogram: analysis.sizeHistogram,
    mirror: analysis.mirror,
    shapeClass: analysis.shapeClass,
    verdict: analysis.verdict,
  };
}

function checkAgainstArtifact(artifact, derived) {
  const { investigationFingerprint, ...artifactCore } = artifact;
  if (sha256(canonicalText(artifactCore)) !== investigationFingerprint) fail("artifact fingerprint self-check failed");
  if (artifact.schemaVersion !== SCHEMA_VERSION) fail("schema version drift");
  if (artifact.investigationId !== INVESTIGATION_ID) fail("investigation id drift");
  if (artifact.status !== "planning_evidence") fail("status drift");
  if (artifact.generator !== GENERATOR_PATH) fail("generator path drift");
  if (!artifact.role.startsWith("the co-parenting generalization probe") || !artifact.role.includes("planning evidence")) fail("role drift");
  if (artifact.preRegistration.rulings.map((ruling) => ruling.id).join(",") !== "OD-CP-1,OD-CP-2,OD-CP-3,OD-CP-4") fail("pre-registration rulings drift");
  if (artifact.preRegistration.gates.map((gate) => gate.id).join(",") !== "V-CP-1,V-CP-2,V-CP-3") fail("pre-registration gates drift");
  if (artifact.preRegistration.groundingCorrections.map((entry) => entry.id).join(",") !== "GC-1,GC-2,GC-3") fail("grounding corrections drift");
  if (!artifact.preRegistration.operationalizations.some((entry) => entry.id === "OP-CP-3")) fail("OP-CP-3 missing");

  // chain pins
  if (artifact.base.bipartite.sha256 !== BIPARTITE_SHA256) fail("bipartite sha drift");
  if (artifact.base.chainFingerprints.bl084 !== BL084_FINGERPRINT) fail("BL-084 fingerprint drift");
  if (artifact.base.chainFingerprints.bl087 !== BL087_FINGERPRINT) fail("BL-087 fingerprint drift");
  if (artifact.base.chainFingerprints.bl073 !== BL073_FINGERPRINT) fail("BL-073 fingerprint drift");
  if (artifact.base.chainFingerprints.probe !== PROBE_FINGERPRINT) fail("probe fingerprint drift");
  if (artifact.base.chainFingerprints.dpg !== DPG_FINGERPRINT) fail("dpg fingerprint drift");

  // containment censuses
  const p = artifact.containment.pSide;
  const h = artifact.containment.hSide;
  if (p.universe !== 330 || h.universe !== 462) fail("containment universe drift");
  if (p.pairCount !== 54285 || h.pairCount !== 106491) fail("containment pair denominator drift");
  if (p.thresholds.ge1 !== derived.pCensus.ge1 || p.thresholds.ge2 !== derived.pCensus.ge2 || p.thresholds.ge3 !== derived.pCensus.ge3) fail("pSide thresholds drift");
  if (h.thresholds.ge1 !== derived.hCensus.ge1 || h.thresholds.ge2 !== derived.hCensus.ge2 || h.thresholds.ge3 !== derived.hCensus.ge3) fail("hSide thresholds drift");
  if (!deepEqual(p.overlapHistogram, derived.pCensus.histogram)) fail("pSide histogram drift");
  if (!deepEqual(h.overlapHistogram, derived.hCensus.histogram)) fail("hSide histogram drift");
  if (p.pairs.length !== derived.pCensus.pairSet.size) fail("pSide pair count drift");
  if (h.pairs.length !== derived.hCensus.pairSet.size) fail("hSide pair count drift");
  for (const [idA, idB] of p.pairs) {
    if (!derived.pCensus.pairSet.has(`${idA}|${idB}`)) fail(`pSide pair ${idA}|${idB} is not in the independent census`);
  }
  for (const [idA, idB] of h.pairs) {
    if (!derived.hCensus.pairSet.has(`${idA}|${idB}`)) fail(`hSide pair ${idA}|${idB} is not in the independent census`);
  }
  if (derived.hamming2Count !== h.pairs.length) fail("hamming-2 coincidence drift");

  // V-CP-1: the D1 anchor
  if (derived.d1.windows.length !== 2) fail("V-CP-1: D1 windows missing");
  for (const window of derived.d1.windows) {
    if (canonicalText(window.parents) !== canonicalText(["1371", "1389"])) fail("V-CP-1: D1 parents drift");
    if (canonicalText(window.indices) !== canonicalText([0, 6])) fail("V-CP-1: D1 indices drift");
    if (window.consecutive !== false) fail("V-CP-1: D1 consecutiveness drift");
  }
  if (!derived.d1.wrapCut || !derived.d1.wrapCut.pairProduced) fail("V-CP-1: wrap cut is not pair-witnessed");
  if (!deepEqual(derived.d1.wrapCut.exactStates, ["1359", "1401"])) fail("V-CP-1: wrap cut witnesses drift");
  if (!derived.d1.pair || !deepEqual(derived.d1.pair.shared, ["1371", "1389"]) || !derived.d1.pair.strict || !derived.d1.pair.fertile) {
    fail("V-CP-1: D1 pair record drift");
  }
  if (!deepEqual(derived.rho.spanning.map((window) => window.state).sort(cmp), ["3669", "981"])) fail("V-CP-1: rho relocation drift");
  if (derived.rho.spanning.some((window) => canonicalText(window.parents) !== canonicalText(["2901", "1749"]))) fail("V-CP-1: rho parents drift");
  const d1AnchorRecord = artifact.correspondence.eB.d1Anchor;
  if (d1AnchorRecord.pair.join(",") !== "1359,1401" || d1AnchorRecord.shared.join(",") !== "1371,1389" || !d1AnchorRecord.strict || !d1AnchorRecord.fertile) {
    fail("V-CP-1: artifact D1 anchor record drift");
  }
  if (d1AnchorRecord.wrapCut.k !== 6 || !deepEqual(d1AnchorRecord.wrapCut.exactStates, ["1359", "1401"])) fail("V-CP-1: artifact wrap cut record drift");

  // D2 trio context
  const rotate6 = (mask) => { let image = 0; for (let pitch = 0; pitch < 12; pitch += 1) if ((mask >> pitch) & 1) image |= 1 << ((pitch + 6) % 12); return image & 4095; };
  const pcSum = (mask) => { let sum = 0; for (let pitch = 0; pitch < 12; pitch += 1) if ((mask >> pitch) & 1) sum += pitch; return sum; };
  const d2TrioExpected = [["471", "1479"], ["2283", "2787"], ["3189", "3441"]].map(([left, right]) => {
    const leftMask = derived.sources.masks.get(left);
    const rightMask = derived.sources.masks.get(right);
    const rotation = rotate6(leftMask) === rightMask || rotate6(rightMask) === leftMask;
    const displacement = Math.abs(pcSum(leftMask) - pcSum(rightMask));
    return { pair: [left, right], rotation6: rotation, displacement6: displacement === 6, dual: rotation && displacement === 6 };
  });
  const d2Recorded = artifact.context.d2Trio.pairs;
  if (d2Recorded.length !== 3) fail("D2 trio census drift");
  d2Recorded.forEach((entry, index) => {
    if (!entry.dual || !d2TrioExpected[index].dual) fail(`D2 trio pair ${index} drift`);
    if (!deepEqual(entry.pair, d2TrioExpected[index].pair)) fail(`D2 trio pair ${index} identity drift`);
    if (entry.pcSumDisplacement !== 6) fail(`D2 trio pair ${index} displacement drift`);
  });
  if (!artifact.context.d2Trio.pairs.every((entry) => entry.tiers.join(",") === "D2,D2")) fail("D2 trio tier drift");
  if (!deepEqual(artifact.context.d2Trio.d2FaultRows, { d2xD2NonCyclic: 12, d2xA2NonCyclic: 10 })) fail("D2 fault-row record drift");
  const gc1 = derived.sources.heptNodes.find((node) => node.pitchMask === derived.sources.masks.get("1359"));
  const gc1b = derived.sources.heptNodes.find((node) => node.pitchMask === derived.sources.masks.get("1401"));
  if (containmentOverlap(gc1.subnodes, gc1b.subnodes).length !== 1) fail("GC-1: D1 containment overlap is not 1");

  // BL-087 cut calibration
  for (const [label, expected] of [["A0", derived.bl087Cuts.A0], ["D7", derived.bl087Cuts.D7], ["A1", derived.bl087Cuts.A1]]) {
    const landed = derived.sources.bl087.diagnostics.cutSensitivity[label];
    expected.forEach((entry, index) => {
      if (entry.allConsecutive !== landed[index].allConsecutive || entry.verdict !== landed[index].verdict) fail(`BL-087 ${label} cut ${index} drift`);
    });
  }

  // spanning rows: Scope B (H)
  const artifactScopeB = artifact.spanning.scopeB;
  if (artifactScopeB.length !== derived.scopeB.length) fail("scope B row census drift");
  derived.scopeB.forEach((expected, index) => {
    const row = artifactScopeB[index];
    if (row.cycleTier !== expected.cycleTier || row.layerTier !== expected.layerTier) fail(`scope B row ${index}: identity drift`);
    if (!deepEqual(row.order, expected.order)) fail(`scope B row ${index}: order drift`);
    if (!deepEqual(row.windows.map((window) => [window.state, window.parents, window.indices, window.consecutive, window.cyclic, window.fullRange]),
      expected.derived.analysis.windows.map((window) => [window.state, window.parents, window.indices, window.consecutive, window.cyclic, window.fullRange]))) {
      fail(`scope B row ${index}: window drift`);
    }
    if (!deepEqual(row.cuts, expected.derived.cuts)) fail(`scope B row ${index}: cut drift`);
    if (row.pairs.count !== expected.derived.pairs.count || row.pairs.fertile !== expected.derived.pairs.fertile || row.pairs.infertile !== expected.derived.pairs.infertile || row.pairs.strict !== expected.derived.pairs.strict) {
      fail(`scope B row ${index}: pair count drift`);
    }
    if (!deepEqual(row.pairs.list, expected.derived.pairs.list)) fail(`scope B row ${index}: pair list drift`);
    if (!deepEqual(row.classification, expected.derived.classification)) fail(`scope B row ${index}: classification drift`);
    const compact = expectedCompact(expected.derived.analysis);
    for (const [key, value] of Object.entries(compact)) {
      if (!deepEqual(row.compact[key], value)) fail(`scope B row ${index}: compact ${key} drift`);
    }
    if (row.rotationAgrees !== true) fail(`scope B row ${index}: rotation agreement drift`);
    // BL-084 landed layer calibration
    const landedCycle = expected.cycleTier === "A0" || expected.cycleTier === "A1" || expected.cycleTier === "A2"
      ? derived.sources.bl084.scopeB.supplementaryCycles.find((record) => record.tier === expected.cycleTier)
      : derived.sources.bl084.scopeB.cycles.find((record) => record.tier === expected.cycleTier);
    const landedLayer = landedCycle.layers.find((layer) => layer.tier === expected.layerTier);
    if (!landedLayer) fail(`BL-084 landed layer missing: ${expected.cycleTier} x ${expected.layerTier}`);
    for (const [key, value] of Object.entries(compact)) {
      if (key === "reachedCount") continue;
      if (!deepEqual(landedLayer[key], value)) fail(`BL-084 calibration drift: ${expected.cycleTier} x ${expected.layerTier} ${key}`);
    }
    if (landedLayer.reachedCount !== compact.reachedCount) fail(`BL-084 calibration drift: ${expected.cycleTier} x ${expected.layerTier} reachedCount`);
  });

  // spanning rows: Scope C (H)
  const artifactScopeC = artifact.spanning.scopeC;
  if (artifactScopeC.length !== derived.scopeC.length) fail("scope C row census drift");
  derived.scopeC.forEach((expected, index) => {
    const row = artifactScopeC[index];
    if (row.pairKey !== expected.pairKey || row.orientationIndex !== expected.orientationIndex || row.layerTier !== expected.layerTier) fail(`scope C row ${index}: identity drift`);
    if (!deepEqual(row.order, expected.order)) fail(`scope C row ${index}: order drift`);
    if (!deepEqual(row.cutsExact, expected.derived.cuts.map((cut) => cut.exactCount))) fail(`scope C row ${index}: cutsExact drift`);
    if (!deepEqual(row.cutsNaive, expected.derived.cuts.map((cut) => cut.naiveCount))) fail(`scope C row ${index}: cutsNaive drift`);
    if (!deepEqual(row.singleWitnessCuts, expected.derived.classification.singleWitnessCuts)) fail(`scope C row ${index}: single-witness cuts drift`);
    if (!deepEqual(row.nonCyclicWindows, expected.derived.analysis.windows.filter((window) => !window.cyclic).map((window) => window.state))) fail(`scope C row ${index}: non-cyclic windows drift`);
    if (!deepEqual(row.fullRangeWindows, expected.derived.analysis.windows.filter((window) => window.fullRange).map((window) => window.state))) fail(`scope C row ${index}: full-range windows drift`);
    if (!deepEqual(row.pairs, { count: expected.derived.pairs.count, fertile: expected.derived.pairs.fertile, infertile: expected.derived.pairs.infertile, strict: expected.derived.pairs.strict })) fail(`scope C row ${index}: pairs drift`);
    if (!deepEqual(row.classification, expected.derived.classification)) fail(`scope C row ${index}: classification drift`);
    const compact = expectedCompact(expected.derived.analysis);
    for (const [key, value] of Object.entries(compact)) {
      if (!deepEqual(row.compact[key], value)) fail(`scope C row ${index}: compact ${key} drift`);
    }
    // BL-084 landed row calibration
    const landed = derived.sources.bl084.scopeC.rows.find((entry) => entry.pairKey === expected.pairKey && entry.orientationIndex === expected.orientationIndex);
    if (!landed) fail(`BL-084 landed scope C row missing: ${expected.pairKey}`);
    const landedLayer = landed.topLayers.find((layer) => layer.tier === expected.layerTier);
    if (!landedLayer) fail(`BL-084 landed scope C layer missing: ${expected.pairKey} x ${expected.layerTier}`);
    if (landedLayer.verdict !== compact.verdict) fail(`BL-084 scope C calibration drift: ${expected.pairKey} verdict`);
  });

  // spanning rows: pentatonic
  const artifactPentB = artifact.spanning.pentatonic.scopeB;
  if (artifactPentB.length !== derived.pentScopeB.length) fail("pent scope B row census drift");
  derived.pentScopeB.forEach((expected, index) => {
    const row = artifactPentB[index];
    if (row.cycleTier !== expected.cycleTier) fail(`pent scope B row ${index}: identity drift`);
    if (!deepEqual(row.cuts, expected.derived.cuts)) fail(`pent scope B row ${index}: cut drift`);
    if (!deepEqual(row.classification, expected.derived.classification)) fail(`pent scope B row ${index}: classification drift`);
    if (!deepEqual(row.pairs.list, expected.derived.pairs.list)) fail(`pent scope B row ${index}: pair list drift`);
  });
  const artifactPentC = artifact.spanning.pentatonic.scopeC;
  if (artifactPentC.length !== derived.pentScopeC.length) fail("pent scope C row census drift");
  derived.pentScopeC.forEach((expected, index) => {
    const row = artifactPentC[index];
    if (row.pairKey !== expected.pairKey || row.orientationIndex !== expected.orientationIndex) fail(`pent scope C row ${index}: identity drift`);
    if (!deepEqual(row.cutsExact, expected.derived.cuts.map((cut) => cut.exactCount))) fail(`pent scope C row ${index}: cutsExact drift`);
    if (!deepEqual(row.classification, expected.derived.classification)) fail(`pent scope C row ${index}: classification drift`);
  });

  // correspondence aggregates
  const eA = artifact.correspondence.eA.populations;
  const eAExpected = (rows, label) => {
    const spanning = rows.filter((row) => row.derived.classification.spanning > 0);
    return {
      population: label,
      spanningRows: spanning.length,
      reductionExact: spanning.filter((row) => row.derived.classification.reductionExact).length,
      faults: spanning.filter((row) => row.derived.classification.fault).length,
      nonCyclicRows: spanning.filter((row) => row.derived.analysis.windows.some((window) => !window.cyclic)).length,
      fullRangeRows: spanning.filter((row) => row.derived.analysis.windows.some((window) => window.fullRange)).length,
      nonCyclicStatesTotal: spanning.reduce((sum, row) => sum + row.derived.analysis.windows.filter((window) => !window.cyclic).length, 0),
      fullRangeStatesTotal: spanning.reduce((sum, row) => sum + row.derived.analysis.windows.filter((window) => window.fullRange).length, 0),
    };
  };
  const eACompare = [
    ["scopeB_H", derived.scopeB],
    ["scopeC_H", derived.scopeC],
    ["scopeB_PENT", derived.pentScopeB],
    ["scopeC_PENT", derived.pentScopeC],
  ];
  for (const [label, rows] of eACompare) {
    const expected = eAExpected(rows, label);
    const recorded = eA[label];
    for (const key of ["spanningRows", "reductionExact", "faults", "nonCyclicRows", "fullRangeRows", "nonCyclicStatesTotal", "fullRangeStatesTotal"]) {
      if (recorded[key] !== expected[key]) fail(`eA ${label}: ${key} drift`);
    }
    if (recorded.faultSample.length > 8) fail(`eA ${label}: fault sample oversized`);
  }
  const eB = artifact.correspondence.eB.populations;
  for (const [label, rows] of eACompare) {
    const spanning = rows.filter((row) => row.derived.classification.spanning > 0);
    const expected = {
      spanningRows: spanning.length,
      pairBijectionRows: spanning.filter((row) => row.derived.classification.singleWitnessCuts.length === 0).length,
      singleWitnessRows: spanning.filter((row) => row.derived.classification.singleWitnessCuts.length > 0).length,
      allFertileRows: spanning.filter((row) => row.derived.pairs.fertile === row.derived.pairs.count).length,
      infertilePairRows: spanning.filter((row) => row.derived.pairs.infertile > 0).length,
    };
    for (const [key, value] of Object.entries(expected)) {
      if (eB[label][key] !== value) fail(`eB ${label}: ${key} drift`);
    }
  }
  const eDScopeB = artifact.correspondence.eD.scopeB;
  if (eDScopeB.length !== derived.pentScopeB.length) fail("eD scope B census drift");
  derived.pentScopeB.forEach((expected, index) => {
    if (eDScopeB[index].pairs !== expected.derived.pairs.count) fail(`eD scope B row ${index}: pair count drift`);
  });
  const eDScopeC = artifact.correspondence.eD.scopeC;
  const pentCStats = derived.pentScopeC.reduce((acc, row) => {
    acc.rows += 1;
    acc.totalPairs += row.derived.pairs.count;
    acc.maxPairs = Math.max(acc.maxPairs, row.derived.pairs.count);
    return acc;
  }, { rows: 0, totalPairs: 0, maxPairs: 0 });
  if (!deepEqual(eDScopeC, pentCStats)) fail("eD scope C aggregate drift");

  // synthesis
  if (artifact.synthesis.verdict !== derived.verdict) fail(`synthesis verdict drift: artifact ${artifact.synthesis.verdict} vs re-derived ${derived.verdict}`);
  if (artifact.synthesis.exactRowCensus.total !== derived.exactRows.length) fail("exact row census drift");
  if (artifact.synthesis.exactRowCensus.spanningRows !== derived.spanningCount) fail("spanning row census drift");
  const faultRows = derived.faultRows;
  if (artifact.synthesis.faultCensus.total !== faultRows.length) fail("fault census drift");
  if (artifact.synthesis.faultCensus.nonCyclicFaults !== faultRows.filter((row) => row.derived.analysis.windows.some((window) => !window.cyclic)).length) fail("fault census non-cyclic drift");
  if (artifact.synthesis.faultCensus.fullRangeFaults !== faultRows.filter((row) => row.derived.analysis.windows.some((window) => window.fullRange)).length) fail("fault census full-range drift");
  const artifactExactLoci = artifact.synthesis.exactRowCensus.loci.map((row) => `${row.cycle}|${row.layer}`).sort(cmp);
  const derivedExactLoci = derived.exactRows.map((row) => `${row.cycle}|${row.layer}`).sort(cmp);
  if (!deepEqual(artifactExactLoci, derivedExactLoci)) fail("exact loci drift");
  if (!artifact.gslTreatment.candidateDraft.status.includes("un-promoted")) fail("gsl candidate status drift");
  if (!artifact.gslTreatment.newEntry.includes("none")) fail("gsl new-entry drift");
  if (artifact.notAccomplished.length !== 6) fail("not-accomplished inventory drift");
  if (!artifact.fences.noClaimEvent.includes("no claim event")) fail("fence text drift");
  if (artifact.grounding.calibration.scopeB.status !== "EXACT" || artifact.grounding.calibration.scopeC.status !== "EXACT") fail("calibration status drift");
  if (artifact.grounding.calibration.containmentIntegrity.hamming2 !== derived.hamming2Count) fail("grounding containment integrity drift");
  if (artifact.grounding.receipt.length !== 6) fail("grounding receipt census drift");
  if (!artifact.grounding.receipt.every((entry) => entry.verdict.startsWith("GROUNDED"))) fail("grounding receipt verdict drift");
  if (artifact.sourceBindings.length !== 8) fail("source binding census drift");
}

// ---------------------------------------------------------------------------
// Static generator checks (two-region)
// ---------------------------------------------------------------------------

function staticIntrinsicCheck(sourceText) {
  const begin = sourceText.indexOf("INTRINSIC-CP-BEGIN");
  const end = sourceText.indexOf("INTRINSIC-CP-END");
  if (begin < 0 || end < 0 || end <= begin) fail("generator intrinsic-region markers missing");
  const before = sourceText.slice(0, begin);
  const region = sourceText.slice(begin, end);
  const comparison = sourceText.slice(end);
  const forbidden = [
    /\breadJson\b/, /\bfileSha\b/, /\bread\(/, /canonical\/universal/,
    /BIPARTITE_PATH/, /BL084_PATH/, /BL087_PATH/, /BL073_PATH/, /PROBE_PATH/, /DPG_PATH/, /NETWORK_PATH/,
    /bl084/i, /bl087/i, /bl073/i, /dpg/i, /bipartite/i, /d7ModalRows/, /\bforte\b/, /pentatonicSubnodes/, /heptatonicNodes/,
  ];
  for (const pattern of forbidden) {
    if (pattern.test(region)) fail(`generator intrinsic region reads a forbidden input: ${pattern}`);
  }
  const forbiddenBefore = [/officeIndex/, /table28/, /pentatonicSubnodes/, /heptatonicNodes/];
  for (const pattern of forbiddenBefore) {
    if (pattern.test(before)) fail(`forbidden token before the intrinsic region: ${pattern}`);
  }
  if (!/pentatonicSubnodes/.test(comparison)) fail("region-scoping proof failed: the comparison region does not read the bipartite pentatonic graph");
  if (!/bl084\.scopeB/.test(comparison)) fail("region-scoping proof failed: the comparison region does not read the BL-084 scope B records");
  if (!/bl087\.diagnostics/.test(comparison)) fail("region-scoping proof failed: the comparison region does not read the BL-087 diagnostics");
  if (!/d7ModalRows/.test(comparison)) fail("region-scoping proof failed: the comparison region does not read the network records");
  if (!/BIPARTITE_PATH/.test(comparison)) fail("region-scoping proof failed: the comparison region does not carry the bipartite path binding");
  const required = [
    "maskOfRow", "hamming12", "affineMapOfMask", "windowFlags", "cutCensus", "reachPairs",
    "containmentOverlap", "enumerateDirectedCycles", "canonicalCycleKey", "edgeStructure",
    "topLayerRecords", "bestVerdict", "censusClassification", "windowAnalysis",
  ];
  for (const token of required) {
    if (!region.includes(token)) fail(`generator intrinsic region is missing a required masks-only token: ${token}`);
  }
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validate() {
  const artifact = readJson(ARTIFACT_PATH);
  const sources = buildSources();
  if (sources.bipartite.status !== "planning_evidence") fail("bipartite status drift");
  const derived = reDerive(sources);
  checkAgainstArtifact(artifact, derived);

  const generatorSource = read(GENERATOR_PATH);
  staticIntrinsicCheck(generatorSource);

  const repin = (candidate) => {
    const { investigationFingerprint: ignored, ...core } = candidate;
    void ignored;
    return { ...core, investigationFingerprint: sha256(canonicalText(core)) };
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

  const thresholdFlip = clone(artifact);
  thresholdFlip.containment.pSide.thresholds.ge2 = 4619;
  expectRejection("pSide threshold flip", thresholdFlip);
  const pHistogramFlip = clone(artifact);
  pHistogramFlip.containment.pSide.overlapHistogram["6"] = 4619;
  expectRejection("pSide histogram flip", pHistogramFlip);
  const pPairStrip = clone(artifact);
  pPairStrip.containment.pSide.pairs.pop();
  expectRejection("pSide pair strip", pPairStrip);
  const pPairSwap = clone(artifact);
  pPairSwap.containment.pSide.pairs[0] = ["5-10:0", "5-10:1", 6];
  expectRejection("pSide pair smuggle", pPairSwap);
  const hPairSwap = clone(artifact);
  hPairSwap.containment.hSide.pairs[0] = ["7-10:0", "7-10:1", 5];
  expectRejection("hSide pair smuggle", hPairSwap);
  const universeFlip = clone(artifact);
  universeFlip.containment.hSide.universe = 461;
  expectRejection("containment universe flip", universeFlip);
  const scopeBStrip = clone(artifact);
  scopeBStrip.spanning.scopeB.pop();
  expectRejection("scope B row strip", scopeBStrip);
  const scopeBWindowFlip = clone(artifact);
  scopeBWindowFlip.spanning.scopeB[0].windows[0].consecutive = !scopeBWindowFlip.spanning.scopeB[0].windows[0].consecutive;
  expectRejection("scope B window flag flip", scopeBWindowFlip);
  const scopeBCutFlip = clone(artifact);
  scopeBCutFlip.spanning.scopeB[0].cuts[0].exactCount += 1;
  expectRejection("scope B cut count flip", scopeBCutFlip);
  const scopeBClassFlip = clone(artifact);
  scopeBClassFlip.spanning.scopeB[0].classification.exact = !scopeBClassFlip.spanning.scopeB[0].classification.exact;
  expectRejection("scope B classification flip", scopeBClassFlip);
  const scopeBPairFlip = clone(artifact);
  scopeBPairFlip.spanning.scopeB[0].pairs.fertile -= 1;
  expectRejection("scope B pair count flip", scopeBPairFlip);
  const scopeBCompactFlip = clone(artifact);
  scopeBCompactFlip.spanning.scopeB[0].compact.verdict = "ABSENT";
  expectRejection("scope B compact verdict flip", scopeBCompactFlip);
  const scopeCRowStrip = clone(artifact);
  scopeCRowStrip.spanning.scopeC.pop();
  expectRejection("scope C row strip", scopeCRowStrip);
  const scopeCCutFlip = clone(artifact);
  scopeCCutFlip.spanning.scopeC[0].cutsExact[0] += 1;
  expectRejection("scope C cutsExact flip", scopeCCutFlip);
  const scopeCNonCyclicFlip = clone(artifact);
  scopeCNonCyclicFlip.spanning.scopeC.find((row) => row.nonCyclicWindows.length > 0).nonCyclicWindows.pop();
  expectRejection("scope C non-cyclic strip", scopeCNonCyclicFlip);
  const scopeCSingleFlip = clone(artifact);
  const singleRow = scopeCSingleFlip.spanning.scopeC.find((row) => row.singleWitnessCuts.length > 0);
  singleRow.singleWitnessCuts = [];
  expectRejection("scope C single-witness strip", scopeCSingleFlip);
  const scopeCOrderFlip = clone(artifact);
  scopeCOrderFlip.spanning.scopeC[0].order = [...scopeCOrderFlip.spanning.scopeC[0].order].reverse();
  expectRejection("scope C order flip", scopeCOrderFlip);
  const pentBClassFlip = clone(artifact);
  pentBClassFlip.spanning.pentatonic.scopeB[0].classification.exact = !pentBClassFlip.spanning.pentatonic.scopeB[0].classification.exact;
  expectRejection("pent scope B classification flip", pentBClassFlip);
  const pentCCutFlip = clone(artifact);
  pentCCutFlip.spanning.pentatonic.scopeC[0].cutsExact[0] += 1;
  expectRejection("pent scope C cutsExact flip", pentCCutFlip);
  const eASpanningFlip = clone(artifact);
  eASpanningFlip.correspondence.eA.populations.scopeC_H.spanningRows -= 1;
  expectRejection("eA spanning row flip", eASpanningFlip);
  const eAExactFlip = clone(artifact);
  eAExactFlip.correspondence.eA.populations.scopeB_H.reductionExact -= 1;
  expectRejection("eA reduction flip", eAExactFlip);
  const eBPopFlip = clone(artifact);
  eBPopFlip.correspondence.eB.populations.scopeC_PENT.allFertileRows += 1;
  expectRejection("eB population flip", eBPopFlip);
  const d1SharedFlip = clone(artifact);
  d1SharedFlip.correspondence.eB.d1Anchor.shared = ["1371", "1461"];
  expectRejection("D1 shared-parent flip", d1SharedFlip);
  const d1WrapFlip = clone(artifact);
  d1WrapFlip.correspondence.eB.d1Anchor.wrapCut.exactStates = ["1359"];
  expectRejection("D1 wrap-cut flip", d1WrapFlip);
  const d1FertileFlip = clone(artifact);
  d1FertileFlip.correspondence.eB.d1Anchor.fertile = false;
  expectRejection("D1 fertility flip", d1FertileFlip);
  const d2TrioFlip = clone(artifact);
  d2TrioFlip.context.d2Trio.pairs[0].dual = false;
  expectRejection("D2 trio flip", d2TrioFlip);
  const eDRowFlip = clone(artifact);
  eDRowFlip.correspondence.eD.scopeB[0].pairs += 1;
  expectRejection("eD scope B flip", eDRowFlip);
  const eDCAggFlip = clone(artifact);
  eDCAggFlip.correspondence.eD.scopeC.rows -= 1;
  expectRejection("eD scope C aggregate flip", eDCAggFlip);
  const synthesisFlip = clone(artifact);
  synthesisFlip.synthesis.verdict = "GENERAL";
  expectRejection("synthesis verdict flip", synthesisFlip);
  const synthesisTotalFlip = clone(artifact);
  synthesisTotalFlip.synthesis.exactRowCensus.total += 1;
  expectRejection("synthesis exact total flip", synthesisTotalFlip);
  const synthesisLociFlip = clone(artifact);
  synthesisLociFlip.synthesis.exactRowCensus.loci.pop();
  expectRejection("synthesis loci strip", synthesisLociFlip);
  const faultCensusFlip = clone(artifact);
  faultCensusFlip.synthesis.faultCensus.total -= 1;
  expectRejection("fault census flip", faultCensusFlip);
  const gslFlip = clone(artifact);
  gslFlip.gslTreatment.candidateDraft.status = "promoted";
  expectRejection("gsl candidate status flip", gslFlip);
  const chainFlip = clone(artifact);
  chainFlip.base.chainFingerprints.bl084 = "0".repeat(64);
  expectRejection("chain fingerprint flip", chainFlip);
  const bipartiteShaFlip = clone(artifact);
  bipartiteShaFlip.base.bipartite.sha256 = "0".repeat(64);
  expectRejection("bipartite sha flip", bipartiteShaFlip);
  const calibrationFlip = clone(artifact);
  calibrationFlip.grounding.calibration.scopeC.status = "DRIFT";
  expectRejection("calibration status flip", calibrationFlip);
  const receiptStrip = clone(artifact);
  receiptStrip.grounding.receipt.pop();
  expectRejection("grounding receipt strip", receiptStrip);
  const rulingStrip = clone(artifact);
  rulingStrip.preRegistration.rulings.pop();
  expectRejection("pre-registration ruling strip", rulingStrip);
  const gateStrip = clone(artifact);
  gateStrip.preRegistration.gates.pop();
  expectRejection("pre-registration gate strip", gateStrip);
  const correctionStrip = clone(artifact);
  correctionStrip.preRegistration.groundingCorrections.pop();
  expectRejection("grounding correction strip", correctionStrip);
  const notAccomplishedStrip = clone(artifact);
  notAccomplishedStrip.notAccomplished = ["no measurement"];
  expectRejection("not-accomplished inventory strip", notAccomplishedStrip);
  const fenceStrip = clone(artifact);
  fenceStrip.fences.noClaimEvent = "claims admitted";
  expectRejection("fence strip", fenceStrip);
  const roleFlip = clone(artifact);
  roleFlip.role = "admitted record";
  expectRejection("role flip", roleFlip);
  let fingerprintRejected = false;
  try {
    checkAgainstArtifact({ ...artifact, investigationFingerprint: "0".repeat(64) }, derived);
  } catch {
    fingerprintRejected = true;
  }
  if (!fingerprintRejected) fail("mutation probe not rejected: fingerprint zero");
  probeCount += 1;

  const smuggled = generatorSource.replace(
    "// ==== INTRINSIC-CP-BEGIN (ledger masks + tier/role partition + generic window/cut/pair machinery) ====",
    "// ==== INTRINSIC-CP-BEGIN (ledger masks + tier/role partition + generic window/cut/pair machinery) ====\nconst leaked = readJson(BIPARTITE_PATH);",
  );
  let smuggledRejected = false;
  try { staticIntrinsicCheck(smuggled); } catch { smuggledRejected = true; }
  if (!smuggledRejected) fail("mutation probe not rejected: smuggled read");
  probeCount += 1;
  const forteSmuggle = generatorSource.replace(
    "// ==== INTRINSIC-CP-BEGIN (ledger masks + tier/role partition + generic window/cut/pair machinery) ====",
    "// ==== INTRINSIC-CP-BEGIN (ledger masks + tier/role partition + generic window/cut/pair machinery) ====\nconst leaked = row.forte;",
  );
  let forteRejected = false;
  try { staticIntrinsicCheck(forteSmuggle); } catch { forteRejected = true; }
  if (!forteRejected) fail("mutation probe not rejected: forte smuggle");
  probeCount += 1;
  const presenceStrip = generatorSource.replace(/cutCensus/g, "cutCens");
  let strippedRejected = false;
  try { staticIntrinsicCheck(presenceStrip); } catch { strippedRejected = true; }
  if (!strippedRejected) fail("mutation probe not rejected: presence strip");
  probeCount += 1;
  const proofStrip = generatorSource.replace(/pentatonicSubnodes/g, "pent");
  let proofRejected = false;
  try { staticIntrinsicCheck(proofStrip); } catch { proofRejected = true; }
  if (!proofRejected) fail("mutation probe not rejected: region-scoping proof strip");
  probeCount += 1;

  const summary = {
    artifact: ARTIFACT_PATH,
    schemaVersion: artifact.schemaVersion,
    calibration: artifact.grounding.calibration,
    correspondence: {
      eA: artifact.correspondence.eA.populations,
      eB: artifact.correspondence.eB.populations,
    },
    synthesis: artifact.synthesis.verdict,
    exactRows: artifact.synthesis.exactRowCensus.total,
    faultRows: artifact.synthesis.faultCensus.total,
    investigationFingerprint: artifact.investigationFingerprint,
    mutationProbesRejected: probeCount,
    staticCheck: "PASS",
  };
  console.log(JSON.stringify(summary, null, 2));
}

validate();
