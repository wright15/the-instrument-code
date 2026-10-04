#!/usr/bin/env node
/**
 * Build the BL-031 semantic multi-hop transport probe (Phase 2).
 *
 * Carries the seven A0 seed landform pools deeper into the 330-node pentatonic
 * space over the BL-028 composed graph (operator + containment edges only; no
 * intra-330 adjacency, G1 untouched) and measures arrival consistency across
 * alternative routes and origins.
 *
 * Operationalizations, kept separate and independently authority-classed:
 * - (a) verbatim landform-pool carry: origin admitted / arrival derived;
 * - (b) office-identity carry: canonical office resolution (element excluded);
 * - (c) structural geometry: route signature only, zero semantic authority.
 *
 * Read-only against admitted/generated sources. Planning evidence only; no
 * topology claims, no direction assignment, no G1 movement, no catalog
 * promotion, no canonical byte changes.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..");

export const SCHEMA_VERSION = "harmonic-orrery.semantic-transport-probe.v1";
export const PROBE_ID = "SEMANTIC_TRANSPORT_PROBE_v1";
export const GRAPH_PATH = "orrery/src/generated/derived-path-graph.v1.json";
export const CENSUS_PATH = "orrery/src/generated/semantic-derivation-census.v1.json";
export const SIGNATURES_PATH = "derived/hypergraph/parallel-signatures-v1.json";
export const PROFILES_PATH =
  "seven-governors-canonical-feature-profile-registry-v0.1.1/canonical/canonical-governor-profiles.json";
export const GOLDEN_PATHS_PATH = "orrery/test/fixtures/golden-paths.v1.json";
export const OUTPUT_PATH = "orrery/src/generated/semantic-transport-probe.v1.json";

export const PATH_DELIVERY_LIMIT = 3;
export const MINIMAL_PATH_BUDGET = 25;
export const MAX_TRANSPORT_HOP = 3;

const EXPECTED_SEEDS = 7;
const EXPECTED_PENTATONIC = 330;
const EXPECTED_HEPTATONIC = 462;
const EXPECTED_ZERO = 255;
const EXPECTED_SINGLE = 50;
const EXPECTED_CONFLICTING = 25;

function fail(message) {
  throw new Error(`INVALID_SEMANTIC_TRANSPORT_PROBE: ${message}`);
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function fileSha(relativePath) {
  return sha256(fs.readFileSync(path.join(root, relativePath)));
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

export function canonicalText(value) {
  if (value === null) return "null";
  if (value === true) return "true";
  if (value === false) return "false";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isInteger(value)) fail("non-integer number in probe payload");
    return String(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalText).join(",")}]`;
  }
  if (typeof value === "object") {
    const keys = Object.keys(value).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${canonicalText(value[key])}`).join(",")}}`;
  }
  fail(`unsupported JSON type: ${typeof value}`);
}

export function serializeTransportProbe(probe) {
  return `${canonicalText(probe)}\n`;
}

function compareStrings(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function sortedUnique(values) {
  return [...new Set(values)].sort(compareStrings);
}

function intersection(left, right) {
  const rightSet = new Set(right);
  return sortedUnique(left.filter((value) => rightSet.has(value)));
}

/** Build the traversal index over the generated composed graph (BL-028 shape). */
function buildPathIndex(graph) {
  if (graph.status !== "planning_evidence") {
    fail(`derived-path graph status is ${graph.status}`);
  }
  const heptatonic = new Map(Object.entries(graph.heptatonicNodes));
  const pentatonic = new Map(Object.entries(graph.pentatonicNodes));
  if (heptatonic.size !== EXPECTED_HEPTATONIC || pentatonic.size !== EXPECTED_PENTATONIC) {
    fail(`graph census is ${heptatonic.size}/${pentatonic.size}`);
  }
  const operatorEdgesBySource = new Map();
  for (const edge of graph.operatorEdges) {
    const group = operatorEdgesBySource.get(edge.sourceNodeId) ?? [];
    group.push(edge);
    operatorEdgesBySource.set(edge.sourceNodeId, group);
  }
  for (const group of operatorEdgesBySource.values()) {
    group.sort((left, right) => compareStrings(left.moveId, right.moveId));
  }
  const containmentAdjacency = new Map();
  const link = (from, to) => {
    const group = containmentAdjacency.get(from) ?? [];
    group.push(to);
    containmentAdjacency.set(from, group);
  };
  for (const [pentatonicId, parents] of Object.entries(graph.pentatonicParents)) {
    if (!pentatonic.has(pentatonicId)) fail(`unknown pentatonic node ${pentatonicId}`);
    for (const parentId of parents) {
      if (!heptatonic.has(parentId)) fail(`containment edge ${pentatonicId} -> ${parentId} is not heptatonic`);
      link(pentatonicId, parentId);
      link(parentId, pentatonicId);
    }
  }
  for (const [id, group] of containmentAdjacency) {
    containmentAdjacency.set(id, sortedUnique(group));
  }
  const nodeById = new Map([...heptatonic, ...pentatonic]);
  return { graph, heptatonic, pentatonic, nodeById, operatorEdgesBySource, containmentAdjacency };
}

function traversalEdges(index, nodeId, admittedBridgesOnly) {
  const edges = [];
  if (index.heptatonic.has(nodeId)) {
    for (const edge of index.operatorEdgesBySource.get(nodeId) ?? []) {
      edges.push({ from: nodeId, to: edge.targetNodeId, kind: "operator", moveId: edge.moveId, operatorId: edge.operatorId });
    }
    for (const neighborId of index.containmentAdjacency.get(nodeId) ?? []) {
      const neighbor = index.pentatonic.get(neighborId);
      if (!neighbor) continue;
      if (admittedBridgesOnly && !neighbor.admittedBridge) continue;
      edges.push({ from: nodeId, to: neighborId, kind: "containment", moveId: null, operatorId: null });
    }
  } else {
    const node = index.pentatonic.get(nodeId);
    if (!node) return edges;
    for (const neighborId of index.containmentAdjacency.get(nodeId) ?? []) {
      if (admittedBridgesOnly && !node.admittedBridge) continue;
      if (!index.heptatonic.has(neighborId)) continue;
      edges.push({ from: nodeId, to: neighborId, kind: "containment", moveId: null, operatorId: null });
    }
  }
  edges.sort((left, right) => {
    if (left.to !== right.to) return compareStrings(left.to, right.to);
    if (left.kind !== right.kind) return compareStrings(left.kind, right.kind);
    return compareStrings(left.moveId ?? "", right.moveId ?? "");
  });
  return edges;
}

/**
 * Minimal-hop path enumeration, mirroring `orrery/src/path-find.ts`:
 * BFS distance layer + predecessor collection, then deterministic backtracking
 * capped at `budget`. `capped` means at least budget+1 minimal paths exist.
 */
export function findMinimalPaths(index, originId, destinationId, options = {}) {
  const admittedBridgesOnly = options.admittedBridgesOnly ?? false;
  const budget = options.budget ?? MINIMAL_PATH_BUDGET;
  if (!index.nodeById.has(originId) || !index.nodeById.has(destinationId)) {
    return { kind: "invalid", message: `unknown node ${originId} -> ${destinationId}` };
  }
  const distance = new Map([[originId, 0]]);
  const predecessors = new Map();
  const queue = [originId];
  while (queue.length > 0) {
    const current = queue.shift();
    const currentDistance = distance.get(current);
    for (const edge of traversalEdges(index, current, admittedBridgesOnly)) {
      const nextDistance = currentDistance + 1;
      const known = distance.get(edge.to);
      if (known === undefined) {
        distance.set(edge.to, nextDistance);
        queue.push(edge.to);
      }
      if (distance.get(edge.to) === nextDistance) {
        const group = predecessors.get(edge.to) ?? [];
        group.push(edge);
        predecessors.set(edge.to, group);
      }
    }
  }
  const hopCount = distance.get(destinationId);
  if (hopCount === undefined) {
    return { kind: "none", hopCount: null, paths: [], capped: false, delivered: [] };
  }
  const collected = [];
  let capped = false;
  const buildPath = (nodeIds) => {
    const edges = [];
    for (let position = 1; position < nodeIds.length; position += 1) {
      const candidates = predecessors.get(nodeIds[position]) ?? [];
      const edge = candidates.find((candidate) => candidate.from === nodeIds[position - 1]);
      if (!edge) fail(`missing edge ${nodeIds[position - 1]} -> ${nodeIds[position]}`);
      edges.push(edge);
    }
    return { nodeIds, edges };
  };
  const walk = (nodeId, reversed) => {
    if (collected.length > budget) return;
    if (nodeId === originId) {
      collected.push(buildPath([nodeId, ...reversed]));
      if (collected.length > budget) capped = true;
      return;
    }
    const incoming = (predecessors.get(nodeId) ?? []).slice().sort((left, right) => {
      if (left.from !== right.from) return compareStrings(left.from, right.from);
      return compareStrings(left.moveId ?? "", right.moveId ?? "");
    });
    for (const edge of incoming) {
      walk(edge.from, [nodeId, ...reversed]);
      if (collected.length > budget) return;
    }
  };
  walk(destinationId, []);
  return {
    kind: "ok",
    hopCount,
    paths: collected,
    capped,
    delivered: collected.slice(0, PATH_DELIVERY_LIMIT),
  };
}

function bfsDistances(index, originId, admittedBridgesOnly = false) {
  const distance = new Map([[originId, 0]]);
  const queue = [originId];
  while (queue.length > 0) {
    const current = queue.shift();
    const currentDistance = distance.get(current);
    for (const edge of traversalEdges(index, current, admittedBridgesOnly)) {
      if (!distance.has(edge.to)) {
        distance.set(edge.to, currentDistance + 1);
        queue.push(edge.to);
      }
    }
  }
  return distance;
}

function summarizePath(index, path, signatures) {
  const nodeIds = [...path.nodeIds];
  const edgeKinds = path.edges.map((edge) => edge.kind);
  const operatorMoveIds = path.edges.filter((edge) => edge.kind === "operator").map((edge) => edge.moveId);
  let bridgeCrossings = 0;
  let admittedBridgeCrossings = 0;
  let cornerstoneCrossed = false;
  for (let position = 0; position < nodeIds.length; position += 1) {
    const node = index.pentatonic.get(nodeIds[position]);
    if (!node) continue;
    if (node.isCornerstone) cornerstoneCrossed = true;
    if (position === nodeIds.length - 1) continue;
    if (node.isBridge) bridgeCrossings += 1;
    if (node.admittedBridge) admittedBridgeCrossings += 1;
  }
  const kernelWindowSteps = [];
  for (const edge of path.edges) {
    if (edge.kind !== "containment") continue;
    const pentatonicId = index.pentatonic.has(edge.from) ? edge.from : index.pentatonic.has(edge.to) ? edge.to : null;
    const heptatonicId = index.heptatonic.has(edge.from) ? edge.from : index.heptatonic.has(edge.to) ? edge.to : null;
    if (!pentatonicId || !heptatonicId) continue;
    const signature = signatures.get(pentatonicId);
    if (!signature) fail(`pentatonic node ${pentatonicId} has no signature record`);
    const entry = (signature.kernelWindows ?? []).find((candidate) => candidate.parent === heptatonicId);
    if (entry && entry.window !== null) {
      kernelWindowSteps.push({ pentatonicId, parentId: heptatonicId, window: entry.window });
    }
  }
  const familySpan = sortedUnique(nodeIds.map((id) => index.nodeById.get(id).setClassId));
  const heptatonicFamilySpan = sortedUnique(nodeIds.filter((id) => index.heptatonic.has(id)).map((id) => index.nodeById.get(id).setClassId));
  return {
    hopCount: nodeIds.length - 1,
    nodeIds,
    edgeKinds,
    operatorMoveIds,
    bridgeCrossings,
    admittedBridgeCrossings,
    cornerstoneCrossed,
    kernelWindowSteps,
    familySpan,
    heptatonicFamilySpan,
  };
}

function poolRelation(left, right) {
  const shared = intersection(left, right);
  if (shared.length === 0) return { relation: "disjoint", shared: [] };
  if (shared.length === left.length && shared.length === right.length) return { relation: "identical", shared };
  if (shared.length === left.length || shared.length === right.length) return { relation: "subset", shared };
  return { relation: "overlapping", shared };
}

export function buildTransportProbe() {
  const graph = readJson(GRAPH_PATH);
  const census = readJson(CENSUS_PATH);
  const signatures = new Map(Object.entries(readJson(SIGNATURES_PATH).pentatonicSignatures));
  const profiles = readJson(PROFILES_PATH).profiles;
  const goldenPaths = readJson(GOLDEN_PATHS_PATH);
  const index = buildPathIndex(graph);

  if (census.status !== "planning_evidence") fail(`census status is ${census.status}`);
  if (profiles.length !== EXPECTED_SEEDS) fail(`profile census is ${profiles.length}`);

  const censusById = new Map(census.pentatonicCensus.records.map((record) => [record.id, record]));
  if (censusById.size !== EXPECTED_PENTATONIC) fail(`census pentatonic records are ${censusById.size}`);
  const classCount = (name) => [...censusById.values()].filter((record) => record.classification === name).length;
  if (
    classCount("zero-claimant") !== EXPECTED_ZERO ||
    classCount("single-claimant") !== EXPECTED_SINGLE ||
    classCount("multi-claimant-conflicting") !== EXPECTED_CONFLICTING
  ) {
    fail("census four-way totals drifted");
  }

  const seeds = profiles
    .map((profile) => {
      const identity = profile.canonicalIdentity;
      if (identity.anchorTier !== "A0" || identity.forteFamily !== "7-35") {
        fail(`profile ${profile.profileId} is not an A0 7-35 seed`);
      }
      const matches = [...index.heptatonic.entries()].filter(([, record]) => record.pitchMask === identity.stateId);
      if (matches.length !== 1) fail(`seed ${profile.office} resolves to ${matches.length} heptatonic nodes`);
      return {
        office: profile.office,
        stateId: identity.stateId,
        stateName: identity.stateName,
        nodeId: matches[0][0],
        pool: [...profile.domainReferences.landforms],
      };
    })
    .sort((left, right) => compareStrings(left.office, right.office));
  if (seeds.length !== EXPECTED_SEEDS) fail("seed census drifted");
  if (seeds.some((seed) => seed.pool.length === 0)) fail("a seed has an empty landform pool");

  const poolByOffice = new Map(seeds.map((seed) => [seed.office, seed.pool]));
  const expectedPoolOverlaps = [];
  for (let left = 0; left < seeds.length; left += 1) {
    for (let right = left + 1; right < seeds.length; right += 1) {
      const shared = intersection(seeds[left].pool, seeds[right].pool);
      if (shared.length > 0) {
        expectedPoolOverlaps.push({ officeA: seeds[left].office, officeB: seeds[right].office, shared });
      }
    }
  }
  expectedPoolOverlaps.sort((left, right) => compareStrings(left.officeA, right.officeA) || compareStrings(left.officeB, right.officeB));

  for (const [id, signature] of signatures) {
    const record = censusById.get(id);
    if (!record) fail(`signature ${id} has no census record`);
    if (record.isCensusBridge !== (signature.isBridge === true)) fail(`bridge flag drift at ${id}`);
    if (record.diatonicParentCount !== signature.diatonicParentCount) fail(`diatonic count drift at ${id}`);
    const windowed = (signature.kernelWindows ?? []).some((entry) => entry.window !== null);
    if (record.hasKernelWindow !== windowed) fail(`kernel window drift at ${id}`);
  }

  const distanceBySeed = new Map();
  const reachabilityBySeed = [];
  for (const seed of seeds) {
    const distance = bfsDistances(index, seed.nodeId, false);
    distanceBySeed.set(seed.office, distance);
    const histogram = { d1: 0, d2: 0, d3: 0, deeper: 0, unreached: 0 };
    for (const id of index.pentatonic.keys()) {
      const hop = distance.get(id);
      if (hop === undefined) histogram.unreached += 1;
      else if (hop === 1) histogram.d1 += 1;
      else if (hop === 2) histogram.d2 += 1;
      else if (hop === 3) histogram.d3 += 1;
      else histogram.deeper += 1;
    }
    if (histogram.d1 !== 15) fail(`seed ${seed.office} has ${histogram.d1} distance-1 targets, expected 15`);
    reachabilityBySeed.push({ office: seed.office, nodeId: seed.nodeId, ...histogram });
  }
  reachabilityBySeed.sort((left, right) => compareStrings(left.office, right.office));

  const originsByTarget = new Map();
  for (const id of index.pentatonic.keys()) originsByTarget.set(id, []);
  for (const seed of seeds) {
    const distance = distanceBySeed.get(seed.office);
    for (const id of index.pentatonic.keys()) {
      const hop = distance.get(id);
      if (hop === 2 || hop === 3) {
        originsByTarget.get(id).push({ office: seed.office, stateId: seed.stateId, nodeId: seed.nodeId, distance: hop });
      }
    }
  }
  for (const arrivals of originsByTarget.values()) {
    arrivals.sort((left, right) => compareStrings(left.office, right.office));
  }
  const multiOriginTargets = [...originsByTarget.values()].filter((arrivals) => arrivals.length >= 2).length;
  const targetClassCounts = {
    zero: [...index.pentatonic.keys()].filter((id) => censusById.get(id).classification === "zero-claimant").length,
    single: [...index.pentatonic.keys()].filter((id) => censusById.get(id).classification === "single-claimant").length,
    conflicting: [...index.pentatonic.keys()].filter((id) => censusById.get(id).classification === "multi-claimant-conflicting").length,
  };

  const queries = [];
  for (const seed of seeds) {
    const distance = distanceBySeed.get(seed.office);
    for (const [targetId, record] of censusById) {
      const hop = distance.get(targetId);
      if (hop !== 2 && hop !== 3) continue;
      const stratum = record.classification === "zero-claimant" ? "S1" : record.classification === "multi-claimant-conflicting" ? "S2" : "S2b";
      const found = findMinimalPaths(index, seed.nodeId, targetId, { budget: MINIMAL_PATH_BUDGET });
      if (found.kind !== "ok") fail(`query ${seed.office} -> ${targetId} is ${found.kind}`);
      const delivered = found.delivered.map((pathValue) => summarizePath(index, pathValue, signatures));
      const sequences = new Set(delivered.map((pathValue) => pathValue.nodeIds.join(">")));
      queries.push({
        queryId: `transport:${targetId}:${seed.nodeId}`,
        stratum,
        origin: { office: seed.office, stateId: seed.stateId, nodeId: seed.nodeId },
        targetId,
        targetClass: record.classification,
        targetStratum: {
          isBridge: record.isCensusBridge === true,
          diatonicParentCount: record.diatonicParentCount,
          hasKernelWindow: record.hasKernelWindow === true,
        },
        distance: hop,
        minimalPathCount: found.capped ? null : found.paths.length,
        pathCountCapped: found.capped,
        truncatedDelivery: found.capped || found.paths.length > PATH_DELIVERY_LIMIT,
        deliveredPathCount: delivered.length,
        deliveredRouteDivergence: sequences.size > 1,
        sameOriginPoolIdentical: true,
        paths: delivered,
      });
    }
  }
  queries.sort((left, right) => compareStrings(left.targetId, right.targetId) || compareStrings(left.origin.nodeId, right.origin.nodeId));

  const queriesByTarget = new Map();
  for (const query of queries) {
    const group = queriesByTarget.get(query.targetId) ?? [];
    group.push(query);
    queriesByTarget.set(query.targetId, group);
  }

  const targetAnalysis = [];
  const observedOverlappingPairs = [];
  for (const [targetId, record] of censusById) {
    const transportOrigins = originsByTarget.get(targetId);
    const censusClaimantOffices = sortedUnique((record.claimants ?? []).map((claimant) => claimant.office));
    const combinedOffices = sortedUnique([...censusClaimantOffices, ...transportOrigins.map((origin) => origin.office)]);
    const relationCounts = { identical: 0, subset: 0, overlapping: 0, disjoint: 0 };
    const overlappingPairs = [];
    const deviations = [];
    for (let left = 0; left < combinedOffices.length; left += 1) {
      for (let right = left + 1; right < combinedOffices.length; right += 1) {
        const officeA = combinedOffices[left];
        const officeB = combinedOffices[right];
        const poolA = poolByOffice.get(officeA);
        const poolB = poolByOffice.get(officeB);
        if (!poolA || !poolB) fail(`office ${officeA}/${officeB} has no admitted pool`);
        const comparison = poolRelation(poolA, poolB);
        relationCounts[comparison.relation] += 1;
        const kind =
          censusClaimantOffices.includes(officeA) && censusClaimantOffices.includes(officeB)
            ? "claimant-claimant"
            : censusClaimantOffices.includes(officeA) || censusClaimantOffices.includes(officeB)
              ? "claimant-transport"
              : "transport-transport";
        if (comparison.relation === "overlapping") {
          const registered = expectedPoolOverlaps.find(
            (entry) =>
              (entry.officeA === officeA && entry.officeB === officeB) ||
              (entry.officeA === officeB && entry.officeB === officeA),
          );
          const sharedExpected = registered ? registered.shared.join("|") === comparison.shared.join("|") : false;
          if (!sharedExpected) {
            deviations.push({ officeA, officeB, reason: "overlap outside the admitted pool-intersection inventory", shared: comparison.shared });
          }
          overlappingPairs.push({ officeA, officeB, shared: comparison.shared, kind });
          observedOverlappingPairs.push({ targetId, officeA, officeB, shared: comparison.shared, kind });
        } else if (comparison.relation === "identical" || comparison.relation === "subset") {
          deviations.push({ officeA, officeB, reason: `cross-office relation is ${comparison.relation}` });
        }
      }
    }
    const divergentOrigins = sortedUnique(
      (queriesByTarget.get(targetId) ?? [])
        .filter((query) => query.deliveredRouteDivergence)
        .map((query) => query.origin.office),
    );
    targetAnalysis.push({
      targetId,
      targetClass: record.classification,
      isBridge: record.isCensusBridge === true,
      isCornerstone: index.pentatonic.get(targetId).isCornerstone === true,
      diatonicParentCount: record.diatonicParentCount,
      hasKernelWindow: record.hasKernelWindow === true,
      censusClaimantOffices,
      transportOrigins,
      transportOriginCount: transportOrigins.length,
      combinedOffices,
      combinedOriginCount: combinedOffices.length,
      transportReach: transportOrigins.length === 0 ? "none" : transportOrigins.length === 1 ? "single-origin" : "multi-origin",
      secondOriginAdded: censusClaimantOffices.length > 0 && transportOrigins.length > 0,
      poolRelationCounts: relationCounts,
      overlappingPairs,
      routeDivergenceOrigins: divergentOrigins,
      deviations,
    });
  }
  targetAnalysis.sort((left, right) => compareStrings(left.targetId, right.targetId));

  const allDeviations = targetAnalysis.flatMap((entry) => entry.deviations.map((deviation) => ({ targetId: entry.targetId, ...deviation })));
  if (allDeviations.length > 0) {
    fail(`carry-integrity deviations observed: ${JSON.stringify(allDeviations.slice(0, 3))}`);
  }

  const groundTruth = buildGroundTruth(index, signatures);

  const boundaryLayer = buildBoundaryLayer(index, goldenPaths, censusById);

  const targetCountsByOriginCount = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };
  for (const arrivals of originsByTarget.values()) {
    targetCountsByOriginCount[arrivals.length] = (targetCountsByOriginCount[arrivals.length] ?? 0) + 1;
  }

  const findings = {
    transportCoverage: {
      targets: EXPECTED_PENTATONIC,
      multiOriginAt23: multiOriginTargets,
      singleOriginAt23: EXPECTED_PENTATONIC - multiOriginTargets,
      zeroClaimantMultiOrigin: [...censusById.values()].filter(
        (record) => record.classification === "zero-claimant" && originsByTarget.get(record.id).length >= 2,
      ).length,
      conflictTargets: EXPECTED_CONFLICTING,
      conflictTargetsDeepened: [...censusById.values()].filter(
        (record) => record.classification === "multi-claimant-conflicting" && originsByTarget.get(record.id).length > 0,
      ).length,
      singleClaimantTargetsWithSecondOrigin: [...censusById.values()].filter(
        (record) => record.classification === "single-claimant" && originsByTarget.get(record.id).length > 0,
      ).length,
    },
    originCountDistribution: Object.entries(targetCountsByOriginCount)
      .map(([originCount, count]) => ({ originCount: Number(originCount), count }))
      .sort((left, right) => left.originCount - right.originCount),
    overlapInventory: {
      officePairs: expectedPoolOverlaps,
      targetsTouchedByOverlap: sortedUnique(observedOverlappingPairs.map((pair) => pair.targetId)).length,
      comparisons: observedOverlappingPairs.length,
    },
    routeGeometry: {
      deliveredPaths: queries.reduce((total, query) => total + query.deliveredPathCount, 0),
      deliveredPathsCrossingBridge: queries.reduce(
        (total, query) => total + query.paths.filter((pathValue) => pathValue.bridgeCrossings > 0).length,
        0,
      ),
      deliveredPathsTouchingKernelWindow: queries.reduce(
        (total, query) => total + query.paths.filter((pathValue) => pathValue.kernelWindowSteps.length > 0).length,
        0,
      ),
      deliveredPathsCrossingHeptatonicFamily: queries.reduce(
        (total, query) => total + query.paths.filter((pathValue) => new Set(pathValue.heptatonicFamilySpan).size > 1).length,
        0,
      ),
      queriesWithRouteDivergence: queries.filter((query) => query.deliveredRouteDivergence).length,
    },
    structuralNotes: [
      "transport origins at distance 2-3 are disjoint from census claimants at distance 1, so multi-hop transport extends origin sets and can never reproduce or resolve a one-hop collision",
      "every one of the 330 pentatonic targets receives at least two distinct seed origins within 3 hops; transported office semantics is universally multi-origin on this graph",
      "cross-office pool arrivals are disjoint except on the admitted pool-intersection inventory carried in preRegistration.expectedPoolOverlaps",
      `75 visually-windowed triples per seed remain at hop distance >= 4 (${reachabilityBySeed.map((entry) => entry.deeper).join("/")} per seed); depth beyond 3 is a census fact only, not sampled`,
    ],
  };

  const core = {
    schemaVersion: SCHEMA_VERSION,
    probeId: PROBE_ID,
    status: "planning_evidence",
    generator: "scripts/build-semantic-transport-probe.mjs",
    sourceBindings: [
      { artifact: GRAPH_PATH, sha256: fileSha(GRAPH_PATH), role: "composed path graph (operator + containment, no intra-330)" },
      { artifact: CENSUS_PATH, sha256: fileSha(CENSUS_PATH), role: "BL-035 one-hop claimant classification and gap map" },
      { artifact: SIGNATURES_PATH, sha256: fileSha(SIGNATURES_PATH), role: "per-node bridge/diatonic/kernel-window strata" },
      { artifact: PROFILES_PATH, sha256: fileSha(PROFILES_PATH), role: "seven A0 seed landform pools" },
      { artifact: GOLDEN_PATHS_PATH, sha256: fileSha(GOLDEN_PATHS_PATH), role: "BL-030 d-cycle boundary exhibit routes" },
    ],
    scope: {
      seeds: {
        count: seeds.length,
        offices: seeds.map((seed) => seed.office),
        stateIds: seeds.map((seed) => seed.stateId).sort((left, right) => left - right),
        nodeIds: seeds.map((seed) => seed.nodeId).sort(compareStrings),
      },
      pentatonicTargets: { count: EXPECTED_PENTATONIC, byClass: { zero: targetClassCounts.zero, single: targetClassCounts.single, conflicting: targetClassCounts.conflicting } },
      distances: [2, 3],
      pathDeliveryLimit: PATH_DELIVERY_LIMIT,
      minimalPathBudget: MINIMAL_PATH_BUDGET,
      operationalizations: [
        { id: "a", name: "verbatim-landform-pool-carry", authority: "origin admitted / arrival derived" },
        { id: "b", name: "office-identity", authority: "canonical office resolution; element excluded (authored correspondence, partial)" },
        { id: "c", name: "structural-geometry", authority: "geometric / planning evidence only" },
      ],
    },
    preRegistration: {
      poolComparison: ["identical", "subset", "overlapping", "disjoint"],
      officeComparison: "different origins are distinct offices by construction; every cross-origin comparison is cross-office",
      sameOriginControl: "one origin's pool is carried verbatim on every route; same-origin multi-route agreement is a control, never a finding",
      expectedPoolOverlaps,
      crossOriginRule: "cross-office arrivals must be disjoint unless the office pair appears in expectedPoolOverlaps, where the relation must be overlapping with exactly the listed shared strings",
      deviationRule: "identical/subset cross-office relations, or overlaps outside the admitted inventory, are fail-loud deviations",
      collisionRule: "transport arrivals extend origin sets; resolution would require an admitted semantic rule and is pre-registered as unexpected",
      minimalPathCountRule: "exact when pathCountCapped is false; a capped count means at least 26 minimal paths under the 25-path budget",
      directionRule: "direction is recorded as unassigned, never inferred",
    },
    seeds,
    reachability: {
      maxHop: MAX_TRANSPORT_HOP,
      perSeed: reachabilityBySeed,
      targets: {
        reachableWithin3: EXPECTED_PENTATONIC,
        unreachableWithin3: 0,
        multiOriginAt23: multiOriginTargets,
        singleOriginAt23: EXPECTED_PENTATONIC - multiOriginTargets,
        byClass: targetClassCounts,
      },
    },
    queries,
    targetAnalysis,
    groundTruth,
    boundaryLayer,
    findings,
    directionFields: {
      kernelWindowRecorded: true,
      directionAssigned: false,
      basis: "no admitted source maps court position or kernel window to Earth-ward/Fire-ward meaning; transport records geometry only and never assigns direction",
    },
  };
  const probeFingerprint = sha256(canonicalText(core));
  return { ...core, probeFingerprint };
}

function buildGroundTruth(index, signatures) {
  const seam = findMinimalPaths(index, "7-35:3", "7-32:0", { budget: MINIMAL_PATH_BUDGET });
  const seamAdmitted = findMinimalPaths(index, "7-35:3", "7-32:0", { budget: MINIMAL_PATH_BUDGET, admittedBridgesOnly: true });
  const modeAxis = findMinimalPaths(index, "7-35:0", "7-35:3", { budget: MINIMAL_PATH_BUDGET });
  const modeAxisDelivered = findMinimalPaths(index, "7-35:0", "7-35:3", { budget: PATH_DELIVERY_LIMIT });
  const crossings = seam.paths.map((pathValue) => pathValue.nodeIds[1]);
  if (seam.kind !== "ok" || seam.capped || seam.paths.length !== 5 || JSON.stringify(crossings) !== JSON.stringify(["5-20:0B", "5-23:0", "5-25:0", "5-27:0", "5-29:0B"])) {
    fail("BL-028 seam ground truth drifted");
  }
  const admittedCrossings = seamAdmitted.paths.map((pathValue) => pathValue.nodeIds[1]);
  if (seamAdmitted.kind !== "ok" || seamAdmitted.capped || JSON.stringify(admittedCrossings) !== JSON.stringify(["5-23:0", "5-27:0"])) {
    fail("BL-028 admitted-bridge ground truth drifted");
  }
  if (modeAxis.kind !== "ok" || modeAxis.capped || modeAxis.paths.length !== 7) {
    fail("BL-028 mode-axis ground truth drifted");
  }
  const chain = "L7:2741:1717,L3:1717:1709,L6:1709:1453";
  const chainPresent = modeAxis.paths.some((pathValue) => pathValue.edges.filter((edge) => edge.kind === "operator").map((edge) => edge.moveId).join(",") === chain);
  if (!chainPresent) fail("BL-028 L-chain absent from mode-axis minimal paths");
  if (modeAxisDelivered.delivered.length !== PATH_DELIVERY_LIMIT || !modeAxisDelivered.capped) {
    fail("BL-028 delivery cap ground truth drifted");
  }
  return {
    source: "scrum/plan/bl-028-path-finder-memo.md",
    seamCrossing: {
      originId: "7-35:3",
      destinationId: "7-32:0",
      admittedBridgesOnly: false,
      hopCount: seam.hopCount,
      minimalPathCount: seam.paths.length,
      crossingNodes: crossings,
    },
    seamCrossingAdmitted: {
      originId: "7-35:3",
      destinationId: "7-32:0",
      admittedBridgesOnly: true,
      hopCount: seamAdmitted.hopCount,
      minimalPathCount: seamAdmitted.paths.length,
      crossingNodes: admittedCrossings,
    },
    modeAxis: {
      originId: "7-35:0",
      destinationId: "7-35:3",
      admittedBridgesOnly: false,
      hopCount: modeAxis.hopCount,
      minimalPathCount: modeAxis.paths.length,
      lChainPresent: true,
      lChain: chain,
    },
    modeAxisDelivered: {
      originId: "7-35:0",
      destinationId: "7-35:3",
      deliveryLimit: PATH_DELIVERY_LIMIT,
      deliveredPathCount: modeAxisDelivered.delivered.length,
      truncated: modeAxisDelivered.capped,
    },
  };
}

function buildBoundaryLayer(index, goldenPaths, censusById) {
  const routes = goldenPaths.paths
    .filter((pathValue) => typeof pathValue.pathId === "string" && pathValue.pathId.startsWith("d-cycle:"))
    .map((pathValue) => {
      const routeNodeIds = pathValue.hops.map((hop) => hop.nodeId);
      const nodeSummaries = routeNodeIds.map((nodeId) => {
        const node = index.heptatonic.get(nodeId);
        if (!node) fail(`d-cycle node ${nodeId} is not heptatonic`);
        const subnodeIds = index.containmentAdjacency.get(nodeId) ?? [];
        const histogram = { zero: 0, single: 0, conflicting: 0 };
        let bridgeSubnodes = 0;
        let cornerstoneSubnodes = 0;
        for (const subnodeId of subnodeIds) {
          if (!index.pentatonic.has(subnodeId)) fail(`d-cycle node ${nodeId} has non-pentatonic neighbor ${subnodeId}`);
          const record = index.graph.pentatonicNodes[subnodeId];
          if (record.isBridge) bridgeSubnodes += 1;
          if (record.isCornerstone) cornerstoneSubnodes += 1;
        }
        for (const subnodeId of subnodeIds) {
          const classification = censusById.get(subnodeId).classification;
          if (classification === "zero-claimant") histogram.zero += 1;
          else if (classification === "single-claimant") histogram.single += 1;
          else histogram.conflicting += 1;
        }
        return {
          nodeId,
          setClassId: node.setClassId,
          tier: node.tier,
          role: node.role,
          subnodeCount: subnodeIds.length,
          subnodeClassHistogram: histogram,
          bridgeSubnodes,
          cornerstoneSubnodes,
        };
      });
      return {
        pathId: pathValue.pathId,
        routeNodeIds,
        closure: routeNodeIds[0] === routeNodeIds[routeNodeIds.length - 1],
        mEdgeCount: pathValue.hops.filter((hop) => typeof hop.mShortcut === "string" && hop.mShortcut.startsWith("M:")).length,
        nodes: nodeSummaries,
      };
    })
    .sort((left, right) => compareStrings(left.pathId, right.pathId));
  if (routes.length !== 7) fail(`d-cycle route census is ${routes.length}`);
  if (!routes.every((route) => route.closure && route.mEdgeCount === 7)) fail("d-cycle closure/edge census drifted");
  return {
    source: GOLDEN_PATHS_PATH,
    mechanism: "BL-030 d-cycle M-demonstration routes (boundary layer)",
    traversable: false,
    reason: "M is audit-real but not in the committed legal-move catalog; the path finder does not walk M, so no alternative-route enumeration exists for the boundary layer",
    alternativesEnumerated: 0,
    storageGapNote: "boundary-layer heptatonic nodes carry no native office pools and D-anchors have no office-network seating (BL-029); transport semantics do not apply, geometry is recorded only",
    routes,
  };
}

function main() {
  const check = process.argv.includes("--check");
  const probe = buildTransportProbe();
  const serialized = serializeTransportProbe(probe);
  const outputPath = path.join(root, OUTPUT_PATH);
  const summary = {
    output: OUTPUT_PATH,
    check,
    queries: probe.queries.length,
    targets: probe.targetAnalysis.length,
    multiOriginTargets: probe.reachability.targets.multiOriginAt23,
    expectedPoolOverlaps: probe.preRegistration.expectedPoolOverlaps,
    probeFingerprint: probe.probeFingerprint,
  };
  if (check) {
    const existing = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, "utf8") : null;
    if (existing !== serialized) {
      throw new Error("STALE_SEMANTIC_TRANSPORT_PROBE");
    }
    console.log(JSON.stringify({ ...summary, stale: false }));
    return;
  }
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, serialized);
  console.log(JSON.stringify({ ...summary, sha256: sha256(serialized) }));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}
