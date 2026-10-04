#!/usr/bin/env node
/**
 * Validate the generated BL-031 semantic transport probe against its sources.
 *
 * Independent of the builder: re-reads the composed path graph, the BL-035
 * census, the parallel signatures, the canonical seed profiles, and the
 * golden-path fixture, then re-derives the reachability frame, the 1,750-query
 * transport population, every delivered route, the target-level consistency
 * analysis, the pre-registered overlap inventory, the BL-028 ground-truth
 * checks, and the boundary-layer records. Fail-loud; no inference beyond the
 * enumerated sources.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..", "..");

const ARTIFACT_PATH = "orrery/src/generated/semantic-transport-probe.v1.json";
const SCHEMA_VERSION = "harmonic-orrery.semantic-transport-probe.v1";
const PROBE_ID = "SEMANTIC_TRANSPORT_PROBE_v1";
const GRAPH_PATH = "orrery/src/generated/derived-path-graph.v1.json";
const CENSUS_PATH = "orrery/src/generated/semantic-derivation-census.v1.json";
const SIGNATURES_PATH = "derived/hypergraph/parallel-signatures-v1.json";
const PROFILES_PATH =
  "seven-governors-canonical-feature-profile-registry-v0.1.1/canonical/canonical-governor-profiles.json";
const GOLDEN_PATHS_PATH = "orrery/test/fixtures/golden-paths.v1.json";

const PATH_DELIVERY_LIMIT = 3;
const MINIMAL_PATH_BUDGET = 25;

function fail(message) {
  throw new Error(`INVALID_SEMANTIC_TRANSPORT_PROBE: ${message}`);
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function fileSha(relativePath) {
  return sha256(fs.readFileSync(path.join(root, relativePath)));
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
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

function same(left, right) {
  return canonicalText(left) === canonicalText(right);
}

function buildIndex(graph) {
  const heptatonic = new Map(Object.entries(graph.heptatonicNodes));
  const pentatonic = new Map(Object.entries(graph.pentatonicNodes));
  const nodeById = new Map([...heptatonic, ...pentatonic]);
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
    for (const parentId of parents) {
      link(pentatonicId, parentId);
      link(parentId, pentatonicId);
    }
  }
  for (const [id, group] of containmentAdjacency) {
    containmentAdjacency.set(id, sortedUnique(group));
  }
  return { heptatonic, pentatonic, nodeById, operatorEdgesBySource, containmentAdjacency };
}

function edgesFrom(index, nodeId, admittedBridgesOnly) {
  const edges = [];
  if (index.heptatonic.has(nodeId)) {
    for (const edge of index.operatorEdgesBySource.get(nodeId) ?? []) {
      edges.push({ from: nodeId, to: edge.targetNodeId, kind: "operator", moveId: edge.moveId });
    }
    for (const neighborId of index.containmentAdjacency.get(nodeId) ?? []) {
      const neighbor = index.pentatonic.get(neighborId);
      if (!neighbor) continue;
      if (admittedBridgesOnly && !neighbor.admittedBridge) continue;
      edges.push({ from: nodeId, to: neighborId, kind: "containment", moveId: null });
    }
  } else {
    const node = index.pentatonic.get(nodeId);
    if (!node) return edges;
    for (const neighborId of index.containmentAdjacency.get(nodeId) ?? []) {
      if (admittedBridgesOnly && !node.admittedBridge) continue;
      if (!index.heptatonic.has(neighborId)) continue;
      edges.push({ from: nodeId, to: neighborId, kind: "containment", moveId: null });
    }
  }
  edges.sort((left, right) => {
    if (left.to !== right.to) return compareStrings(left.to, right.to);
    if (left.kind !== right.kind) return compareStrings(left.kind, right.kind);
    return compareStrings(left.moveId ?? "", right.moveId ?? "");
  });
  return edges;
}

function distanceMap(index, originId, admittedBridgesOnly = false) {
  const distance = new Map([[originId, 0]]);
  const queue = [originId];
  while (queue.length > 0) {
    const current = queue.shift();
    const currentDistance = distance.get(current);
    for (const edge of edgesFrom(index, current, admittedBridgesOnly)) {
      if (!distance.has(edge.to)) {
        distance.set(edge.to, currentDistance + 1);
        queue.push(edge.to);
      }
    }
  }
  return distance;
}

/** Deterministic minimal-hop enumeration; must match the builder's tie-breaking. */
function enumerateMinimalPaths(index, originId, destinationId, admittedBridgesOnly, budget) {
  const distance = new Map([[originId, 0]]);
  const predecessors = new Map();
  const queue = [originId];
  while (queue.length > 0) {
    const current = queue.shift();
    const currentDistance = distance.get(current);
    for (const edge of edgesFrom(index, current, admittedBridgesOnly)) {
      const nextDistance = currentDistance + 1;
      if (!distance.has(edge.to)) {
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
  if (hopCount === undefined) return { hopCount: null, paths: [], capped: false };
  const collected = [];
  let capped = false;
  const build = (nodeIds) => {
    const edges = [];
    for (let position = 1; position < nodeIds.length; position += 1) {
      const edge = (predecessors.get(nodeIds[position]) ?? []).find(
        (candidate) => candidate.from === nodeIds[position - 1],
      );
      if (!edge) fail(`predecessor lookup failed for ${nodeIds[position - 1]} -> ${nodeIds[position]}`);
      edges.push(edge);
    }
    return { nodeIds, edges };
  };
  const walk = (nodeId, reversed) => {
    if (collected.length > budget) return;
    if (nodeId === originId) {
      collected.push(build([nodeId, ...reversed]));
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
  return { hopCount, paths: collected, capped };
}

function summarize(index, signatures, pathValue) {
  const nodeIds = [...pathValue.nodeIds];
  const edgeKinds = pathValue.edges.map((edge) => edge.kind);
  const operatorMoveIds = pathValue.edges.filter((edge) => edge.kind === "operator").map((edge) => edge.moveId);
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
  for (const edge of pathValue.edges) {
    if (edge.kind !== "containment") continue;
    const pentatonicId = index.pentatonic.has(edge.from) ? edge.from : edge.to;
    const heptatonicId = index.heptatonic.has(edge.from) ? edge.from : edge.to;
    const signature = signatures.get(pentatonicId);
    const entry = (signature.kernelWindows ?? []).find((candidate) => candidate.parent === heptatonicId);
    if (entry && entry.window !== null) {
      kernelWindowSteps.push({ pentatonicId, parentId: heptatonicId, window: entry.window });
    }
  }
  return {
    hopCount: nodeIds.length - 1,
    nodeIds,
    edgeKinds,
    operatorMoveIds,
    bridgeCrossings,
    admittedBridgeCrossings,
    cornerstoneCrossed,
    kernelWindowSteps,
    familySpan: sortedUnique(nodeIds.map((id) => index.nodeById.get(id).setClassId)),
    heptatonicFamilySpan: sortedUnique(nodeIds.filter((id) => index.heptatonic.has(id)).map((id) => index.nodeById.get(id).setClassId)),
  };
}

function poolRelation(left, right) {
  const shared = intersection(left, right);
  if (shared.length === 0) return { relation: "disjoint", shared: [] };
  if (shared.length === left.length && shared.length === right.length) return { relation: "identical", shared };
  if (shared.length === left.length || shared.length === right.length) return { relation: "subset", shared };
  return { relation: "overlapping", shared };
}

function validate() {
  const probe = readJson(ARTIFACT_PATH);
  const graph = readJson(GRAPH_PATH);
  const census = readJson(CENSUS_PATH);
  const signatures = new Map(Object.entries(readJson(SIGNATURES_PATH).pentatonicSignatures));
  const profiles = readJson(PROFILES_PATH).profiles;
  const goldenPaths = readJson(GOLDEN_PATHS_PATH);
  const index = buildIndex(graph);

  if (probe.schemaVersion !== SCHEMA_VERSION) fail(`schemaVersion is ${probe.schemaVersion}`);
  if (probe.probeId !== PROBE_ID) fail(`probeId is ${probe.probeId}`);
  if (probe.status !== "planning_evidence") fail(`status is ${probe.status}`);
  if (probe.generator !== "scripts/build-semantic-transport-probe.mjs") fail(`generator is ${probe.generator}`);

  const expectedBindings = [
    GRAPH_PATH,
    CENSUS_PATH,
    SIGNATURES_PATH,
    PROFILES_PATH,
    GOLDEN_PATHS_PATH,
  ];
  if (probe.sourceBindings.length !== expectedBindings.length) fail("source binding census drifted");
  for (const artifactPath of expectedBindings) {
    const binding = probe.sourceBindings.find((entry) => entry.artifact === artifactPath);
    if (!binding) fail(`missing source binding ${artifactPath}`);
    if (binding.sha256 !== fileSha(artifactPath)) fail(`source binding drifted for ${artifactPath}`);
  }

  const seeds = profiles
    .map((profile) => {
      const identity = profile.canonicalIdentity;
      const matches = [...index.heptatonic.entries()].filter(([, record]) => record.pitchMask === identity.stateId);
      if (matches.length !== 1) fail(`seed ${profile.office} resolves to ${matches.length} nodes`);
      return { office: profile.office, stateId: identity.stateId, nodeId: matches[0][0], pool: [...profile.domainReferences.landforms] };
    })
    .sort((left, right) => compareStrings(left.office, right.office));
  if (probe.seeds.length !== 7) fail("seed census drifted");
  for (const seed of seeds) {
    const recorded = probe.seeds.find((entry) => entry.office === seed.office);
    if (!recorded) fail(`seed ${seed.office} missing from artifact`);
    if (recorded.nodeId !== seed.nodeId || recorded.stateId !== seed.stateId) fail(`seed identity drifted for ${seed.office}`);
    if (!same(recorded.pool, seed.pool)) fail(`seed pool drifted for ${seed.office}`);
  }

  const censusById = new Map(census.pentatonicCensus.records.map((record) => [record.id, record]));
  const poolByOffice = new Map(seeds.map((seed) => [seed.office, seed.pool]));
  const expectedOverlaps = [];
  for (let left = 0; left < seeds.length; left += 1) {
    for (let right = left + 1; right < seeds.length; right += 1) {
      const shared = intersection(seeds[left].pool, seeds[right].pool);
      if (shared.length > 0) expectedOverlaps.push({ officeA: seeds[left].office, officeB: seeds[right].office, shared });
    }
  }
  expectedOverlaps.sort((left, right) => compareStrings(left.officeA, right.officeA) || compareStrings(left.officeB, right.officeB));
  if (!same(probe.preRegistration.expectedPoolOverlaps, expectedOverlaps)) {
    fail("pre-registered pool-overlap inventory drifted");
  }

  const distanceByOffice = new Map(seeds.map((seed) => [seed.office, distanceMap(index, seed.nodeId)]));
  for (const seed of seeds) {
    const recorded = probe.reachability.perSeed.find((entry) => entry.office === seed.office);
    if (!recorded) fail(`reachability row missing for ${seed.office}`);
    const histogram = { d1: 0, d2: 0, d3: 0, deeper: 0, unreached: 0 };
    for (const id of index.pentatonic.keys()) {
      const hop = distanceByOffice.get(seed.office).get(id);
      if (hop === undefined) histogram.unreached += 1;
      else if (hop === 1) histogram.d1 += 1;
      else if (hop === 2) histogram.d2 += 1;
      else if (hop === 3) histogram.d3 += 1;
      else histogram.deeper += 1;
    }
    for (const key of Object.keys(histogram)) {
      if (recorded[key] !== histogram[key]) fail(`reachability ${key} drifted for ${seed.office}`);
    }
  }

  const expectedQueries = new Map();
  const originsByTarget = new Map();
  for (const id of index.pentatonic.keys()) originsByTarget.set(id, []);
  for (const seed of seeds) {
    const distance = distanceByOffice.get(seed.office);
    for (const [targetId, record] of censusById) {
      const hop = distance.get(targetId);
      if (hop !== 2 && hop !== 3) continue;
      const stratum = record.classification === "zero-claimant" ? "S1" : record.classification === "multi-claimant-conflicting" ? "S2" : "S2b";
      expectedQueries.set(`transport:${targetId}:${seed.nodeId}`, { targetId, seed, hop, stratum, record });
      originsByTarget.get(targetId).push({ office: seed.office, stateId: seed.stateId, nodeId: seed.nodeId, distance: hop });
    }
  }
  for (const arrivals of originsByTarget.values()) {
    arrivals.sort((left, right) => compareStrings(left.office, right.office));
  }
  if (probe.queries.length !== expectedQueries.size) fail(`query census is ${probe.queries.length}, expected ${expectedQueries.size}`);
  const seenQueries = new Set();
  for (const query of probe.queries) {
    const expected = expectedQueries.get(query.queryId);
    if (!expected) fail(`unexpected query ${query.queryId}`);
    if (seenQueries.has(query.queryId)) fail(`duplicate query ${query.queryId}`);
    seenQueries.add(query.queryId);
    if (query.origin.office !== expected.seed.office || query.origin.nodeId !== expected.seed.nodeId) fail(`query origin drifted ${query.queryId}`);
    if (query.targetId !== expected.targetId) fail(`query target drifted ${query.queryId}`);
    if (query.stratum !== expected.stratum) fail(`query stratum drifted ${query.queryId}`);
    if (query.distance !== expected.hop) fail(`query distance drifted ${query.queryId}`);
    if (query.targetClass !== expected.record.classification) fail(`query target class drifted ${query.queryId}`);
    const expectedStratum = {
      isBridge: expected.record.isCensusBridge === true,
      diatonicParentCount: expected.record.diatonicParentCount,
      hasKernelWindow: expected.record.hasKernelWindow === true,
    };
    if (!same(query.targetStratum, expectedStratum)) fail(`query target stratum drifted ${query.queryId}`);
    if (query.sameOriginPoolIdentical !== true) fail(`same-origin control missing ${query.queryId}`);

    const enumerated = enumerateMinimalPaths(index, expected.seed.nodeId, expected.targetId, false, MINIMAL_PATH_BUDGET);
    if (enumerated.hopCount !== expected.hop) fail(`re-derived distance drifted ${query.queryId}`);
    const expectedCount = enumerated.capped ? null : enumerated.paths.length;
    if (query.minimalPathCount !== expectedCount) fail(`minimalPathCount drifted ${query.queryId}`);
    if (query.pathCountCapped !== enumerated.capped) fail(`pathCountCapped drifted ${query.queryId}`);
    const delivered = enumerated.paths.slice(0, PATH_DELIVERY_LIMIT).map((pathValue) => summarize(index, signatures, pathValue));
    if (query.deliveredPathCount !== delivered.length) fail(`delivered count drifted ${query.queryId}`);
    if (query.truncatedDelivery !== (enumerated.capped || enumerated.paths.length > PATH_DELIVERY_LIMIT)) fail(`truncation flag drifted ${query.queryId}`);
    const expectedDivergence = new Set(delivered.map((pathValue) => pathValue.nodeIds.join(">"))).size > 1;
    if (query.deliveredRouteDivergence !== expectedDivergence) fail(`route divergence drifted ${query.queryId}`);
    for (let position = 0; position < delivered.length; position += 1) {
      const recordedPath = query.paths[position];
      const expectedPath = delivered[position];
      if (!recordedPath) fail(`missing delivered path ${query.queryId}#${position}`);
      for (const key of ["hopCount", "nodeIds", "edgeKinds", "operatorMoveIds", "bridgeCrossings", "admittedBridgeCrossings", "cornerstoneCrossed", "kernelWindowSteps", "familySpan", "heptatonicFamilySpan"]) {
        if (!same(recordedPath[key], expectedPath[key])) {
          fail(`path ${key} drifted ${query.queryId}#${position}`);
        }
      }
      for (let hop = 1; hop < expectedPath.nodeIds.length; hop += 1) {
        const from = expectedPath.nodeIds[hop - 1];
        const to = expectedPath.nodeIds[hop];
        if (!edgesFrom(index, from, false).some((edge) => edge.to === to)) {
          fail(`illegal traversal step ${from} -> ${to} in ${query.queryId}`);
        }
      }
    }
  }

  const queriesByTarget = new Map();
  for (const query of probe.queries) {
    const group = queriesByTarget.get(query.targetId) ?? [];
    group.push(query);
    queriesByTarget.set(query.targetId, group);
  }
  if (probe.targetAnalysis.length !== 330) fail(`target analysis census is ${probe.targetAnalysis.length}`);
  for (const entry of probe.targetAnalysis) {
    const record = censusById.get(entry.targetId);
    if (!record) fail(`unknown target ${entry.targetId}`);
    if (entry.targetClass !== record.classification) fail(`target class drifted ${entry.targetId}`);
    if (entry.isBridge !== (record.isCensusBridge === true)) fail(`target bridge flag drifted ${entry.targetId}`);
    if (entry.isCornerstone !== (graph.pentatonicNodes[entry.targetId].isCornerstone === true)) fail(`target cornerstone flag drifted ${entry.targetId}`);
    if (entry.diatonicParentCount !== record.diatonicParentCount) fail(`target diatonic count drifted ${entry.targetId}`);
    if (entry.hasKernelWindow !== (record.hasKernelWindow === true)) fail(`target window flag drifted ${entry.targetId}`);
    const transportOrigins = originsByTarget.get(entry.targetId);
    const claimantOffices = sortedUnique((record.claimants ?? []).map((claimant) => claimant.office));
    const combinedOffices = sortedUnique([...claimantOffices, ...transportOrigins.map((origin) => origin.office)]);
    if (!same(entry.transportOrigins, transportOrigins)) fail(`transport origins drifted ${entry.targetId}`);
    if (entry.transportOriginCount !== transportOrigins.length) fail(`transport origin count drifted ${entry.targetId}`);
    if (!same(entry.censusClaimantOffices, claimantOffices)) fail(`claimant offices drifted ${entry.targetId}`);
    if (!same(entry.combinedOffices, combinedOffices)) fail(`combined offices drifted ${entry.targetId}`);
    if (entry.combinedOriginCount !== combinedOffices.length) fail(`combined origin count drifted ${entry.targetId}`);
    const relationCounts = { identical: 0, subset: 0, overlapping: 0, disjoint: 0 };
    const overlappingPairs = [];
    for (let left = 0; left < combinedOffices.length; left += 1) {
      for (let right = left + 1; right < combinedOffices.length; right += 1) {
        const comparison = poolRelation(poolByOffice.get(combinedOffices[left]), poolByOffice.get(combinedOffices[right]));
        relationCounts[comparison.relation] += 1;
        if (comparison.relation === "overlapping") {
          const kind =
            claimantOffices.includes(combinedOffices[left]) && claimantOffices.includes(combinedOffices[right])
              ? "claimant-claimant"
              : claimantOffices.includes(combinedOffices[left]) || claimantOffices.includes(combinedOffices[right])
                ? "claimant-transport"
                : "transport-transport";
          overlappingPairs.push({ officeA: combinedOffices[left], officeB: combinedOffices[right], shared: comparison.shared, kind });
        }
      }
    }
    if (!same(entry.poolRelationCounts, relationCounts)) fail(`pool relation counts drifted ${entry.targetId}`);
    if (!same(entry.overlappingPairs, overlappingPairs)) fail(`overlapping pairs drifted ${entry.targetId}`);
    const expectedReach = transportOrigins.length === 0 ? "none" : transportOrigins.length === 1 ? "single-origin" : "multi-origin";
    if (entry.transportReach !== expectedReach) fail(`transport reach drifted ${entry.targetId}`);
    if (entry.secondOriginAdded !== (claimantOffices.length > 0 && transportOrigins.length > 0)) fail(`second origin flag drifted ${entry.targetId}`);
    const divergentOrigins = sortedUnique(
      (queriesByTarget.get(entry.targetId) ?? []).filter((query) => query.deliveredRouteDivergence).map((query) => query.origin.office),
    );
    if (!same(entry.routeDivergenceOrigins, divergentOrigins)) fail(`route divergence origins drifted ${entry.targetId}`);
    if (entry.deviations.length !== 0) fail(`unexpected deviation recorded at ${entry.targetId}`);
  }

  const multiOrigin = [...originsByTarget.values()].filter((arrivals) => arrivals.length >= 2).length;
  if (probe.reachability.targets.multiOriginAt23 !== multiOrigin) fail("multi-origin target count drifted");
  if (probe.reachability.targets.unreachableWithin3 !== 0) fail("unreachable-within-3 claim drifted");
  if (probe.findings.transportCoverage.zeroClaimantMultiOrigin !== 255) fail("zero-claimant multi-origin count drifted");
  if (probe.findings.transportCoverage.conflictTargetsDeepened !== 25) fail("conflict deepening count drifted");
  if (probe.findings.transportCoverage.singleClaimantTargetsWithSecondOrigin !== 50) fail("second-origin count drifted");

  const groundTruth = probe.groundTruth;
  const seam = enumerateMinimalPaths(index, "7-35:3", "7-32:0", false, MINIMAL_PATH_BUDGET);
  if (groundTruth.seamCrossing.minimalPathCount !== seam.paths.length || seam.paths.length !== 5) fail("seam ground truth drifted");
  if (!same(groundTruth.seamCrossing.crossingNodes, seam.paths.map((pathValue) => pathValue.nodeIds[1]))) fail("seam crossings drifted");
  const seamAdmitted = enumerateMinimalPaths(index, "7-35:3", "7-32:0", true, MINIMAL_PATH_BUDGET);
  if (groundTruth.seamCrossingAdmitted.minimalPathCount !== seamAdmitted.paths.length || seamAdmitted.paths.length !== 2) fail("admitted seam ground truth drifted");
  const modeAxis = enumerateMinimalPaths(index, "7-35:0", "7-35:3", false, MINIMAL_PATH_BUDGET);
  if (groundTruth.modeAxis.minimalPathCount !== modeAxis.paths.length || modeAxis.paths.length !== 7) fail("mode-axis ground truth drifted");
  const chain = "L7:2741:1717,L3:1717:1709,L6:1709:1453";
  if (!modeAxis.paths.some((pathValue) => pathValue.edges.filter((edge) => edge.kind === "operator").map((edge) => edge.moveId).join(",") === chain)) {
    fail("mode-axis L-chain missing");
  }
  if (groundTruth.modeAxisDelivered.deliveredPathCount !== PATH_DELIVERY_LIMIT || groundTruth.modeAxisDelivered.truncated !== true) {
    fail("delivery-cap ground truth drifted");
  }

  const dCycle = goldenPaths.paths.filter((pathValue) => typeof pathValue.pathId === "string" && pathValue.pathId.startsWith("d-cycle:"));
  if (probe.boundaryLayer.routes.length !== dCycle.length || dCycle.length !== 7) fail("boundary route census drifted");
  for (const route of probe.boundaryLayer.routes) {
    const fixtureRoute = dCycle.find((pathValue) => pathValue.pathId === route.pathId);
    if (!fixtureRoute) fail(`boundary route ${route.pathId} missing from fixture`);
    const fixtureNodes = fixtureRoute.hops.map((hop) => hop.nodeId);
    if (!same(route.routeNodeIds, fixtureNodes)) fail(`boundary route nodes drifted ${route.pathId}`);
    if (route.mEdgeCount !== fixtureRoute.hops.filter((hop) => typeof hop.mShortcut === "string" && hop.mShortcut.startsWith("M:")).length) {
      fail(`boundary M-edge count drifted ${route.pathId}`);
    }
    if (route.closure !== (fixtureNodes[0] === fixtureNodes[fixtureNodes.length - 1])) fail(`boundary closure drifted ${route.pathId}`);
    for (const node of route.nodes) {
      const subnodeIds = index.containmentAdjacency.get(node.nodeId) ?? [];
      if (node.subnodeCount !== subnodeIds.length) fail(`boundary subnode count drifted ${route.pathId}/${node.nodeId}`);
      let bridgeSubnodes = 0;
      let cornerstoneSubnodes = 0;
      const histogram = { zero: 0, single: 0, conflicting: 0 };
      for (const subnodeId of subnodeIds) {
        const graphNode = graph.pentatonicNodes[subnodeId];
        if (graphNode.isBridge) bridgeSubnodes += 1;
        if (graphNode.isCornerstone) cornerstoneSubnodes += 1;
        const classification = censusById.get(subnodeId).classification;
        if (classification === "zero-claimant") histogram.zero += 1;
        else if (classification === "single-claimant") histogram.single += 1;
        else histogram.conflicting += 1;
      }
      if (node.bridgeSubnodes !== bridgeSubnodes || node.cornerstoneSubnodes !== cornerstoneSubnodes) fail(`boundary bridge census drifted ${route.pathId}/${node.nodeId}`);
      if (!same(node.subnodeClassHistogram, histogram)) fail(`boundary subnode histogram drifted ${route.pathId}/${node.nodeId}`);
    }
  }
  if (probe.boundaryLayer.alternativesEnumerated !== 0 || probe.boundaryLayer.traversable !== false) fail("boundary traversal claim drifted");

  if (probe.directionFields.directionAssigned !== false) fail("direction must remain unassigned");
  if (probe.scope.operationalizations.length !== 3) fail("operationalization census drifted");
  if (probe.scope.pathDeliveryLimit !== PATH_DELIVERY_LIMIT || probe.scope.minimalPathBudget !== MINIMAL_PATH_BUDGET) fail("budget declarations drifted");

  const { probeFingerprint, ...core } = probe;
  const recomputed = sha256(canonicalText(core));
  if (probeFingerprint !== recomputed) fail("probe fingerprint drifted");

  console.log(
    JSON.stringify({
      artifact: ARTIFACT_PATH,
      status: probe.status,
      queries: probe.queries.length,
      targets: probe.targetAnalysis.length,
      multiOriginTargets: probe.reachability.targets.multiOriginAt23,
      expectedPoolOverlaps: probe.preRegistration.expectedPoolOverlaps.length,
      probeFingerprint: probe.probeFingerprint,
    }),
  );
}

validate();
