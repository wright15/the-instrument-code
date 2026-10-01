#!/usr/bin/env node
/**
 * Validate the generated derived-path graph (BL-028) against its sources.
 *
 * Independent of the builder: re-reads the bipartite containment matrix, the
 * legal-move catalog, the universal network data, and the court substrate
 * registry, then checks the artifact's node census, containment symmetry,
 * operator inventory, anchor classification, admitted-bridge vocabulary, and
 * fingerprint. Fail-loud; no inference beyond the enumerated sources.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..", "..");

const ARTIFACT_PATH = "orrery/src/generated/derived-path-graph.v1.json";
const SCHEMA_VERSION = "harmonic-orrery.derived-path-graph.v1";

function fail(message) {
  throw new Error(`INVALID_DERIVED_PATH_GRAPH: ${message}`);
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
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
    if (!Number.isInteger(value)) fail("non-integer number in graph payload");
    return String(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalText).join(",")}]`;
  if (typeof value === "object") {
    const keys = Object.keys(value).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${canonicalText(value[key])}`).join(",")}}`;
  }
  fail(`unsupported JSON type: ${typeof value}`);
}

function popcount(mask) {
  let bits = 0;
  for (let bit = 0; bit < 12; bit += 1) {
    if ((mask & (1 << bit)) !== 0) bits += 1;
  }
  return bits;
}

function isSubset(childMask, parentMask) {
  return (childMask & parentMask) === childMask;
}

function main() {
  const artifactPath = path.join(root, ARTIFACT_PATH);
  if (!fs.existsSync(artifactPath)) {
    fail(`missing artifact ${ARTIFACT_PATH}`);
  }
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  const bipartite = readJson("derived/hypergraph/bipartite-inclusion-v1.json");
  const legalMoves = readJson("orrery/src/generated/legal-moves.v2.json");
  const network = readJson("canonical/universal-network-data.json");
  const substrate = readJson("seven-governors-court-substrate-v0.1.0/canonical/substrate-registry-release.json");

  if (artifact.schemaVersion !== SCHEMA_VERSION) {
    fail(`schemaVersion is ${artifact.schemaVersion}`);
  }
  if (artifact.status !== "planning_evidence") {
    fail(`status is ${artifact.status}`);
  }

  const { graphFingerprint, ...core } = artifact;
  if (sha256(canonicalText(core)) !== graphFingerprint) {
    fail("graphFingerprint does not match the payload");
  }

  const heptatonicIds = Object.keys(artifact.heptatonicNodes);
  const pentatonicIds = Object.keys(artifact.pentatonicNodes);
  if (heptatonicIds.length !== 462) fail(`heptatonic census ${heptatonicIds.length}`);
  if (pentatonicIds.length !== 330) fail(`pentatonic census ${pentatonicIds.length}`);
  if (artifact.counts.heptatonicNodes !== 462 || artifact.counts.pentatonicNodes !== 330) {
    fail("declared counts disagree with the node maps");
  }
  if (artifact.counts.operatorEdges !== 60 || artifact.counts.containmentEdges !== 6930) {
    fail("declared edge counts are not 60 / 6930");
  }

  const networkByMask = new Map(network.nodes.map((node) => [node.id, node]));
  const seenMasks = new Set();
  for (const [id, node] of Object.entries(artifact.heptatonicNodes)) {
    const source = bipartite.heptatonicNodes[id];
    if (!source) fail(`heptatonic node ${id} not in the bipartite source`);
    if (node.pitchMask !== source.pitchMask || popcount(node.pitchMask) !== 7) {
      fail(`heptatonic node ${id} mask mismatch or weight`);
    }
    if (seenMasks.has(node.pitchMask)) fail(`duplicate heptatonic mask ${node.pitchMask}`);
    seenMasks.add(node.pitchMask);
    const info = networkByMask.get(node.pitchMask);
    if (!info || info.tier !== node.tier || info.role !== node.role) {
      fail(`heptatonic node ${id} classification mismatch`);
    }
  }

  const admittedBridgeClasses = new Set(
    substrate.pentatonicSetClasses
      .filter((entry) => entry.admissionStatus === "admitted-bridge")
      .map((entry) => entry.forteNumber),
  );
  if (JSON.stringify(artifact.admittedBridgeClasses) !== JSON.stringify([...admittedBridgeClasses].sort())) {
    fail("admittedBridgeClasses disagree with the substrate registry");
  }

  const parentEdgeCount = Object.values(artifact.pentatonicParents).reduce(
    (total, parents) => total + parents.length,
    0,
  );
  if (parentEdgeCount !== 6930) fail(`containment edge census ${parentEdgeCount}`);

  for (const [id, node] of Object.entries(artifact.pentatonicNodes)) {
    const source = bipartite.pentatonicSubnodes[id];
    if (!source) fail(`pentatonic node ${id} not in the bipartite source`);
    if (node.pitchMask !== source.pitchMask || popcount(node.pitchMask) !== 5) {
      fail(`pentatonic node ${id} mask mismatch or weight`);
    }
    if (
      node.isBridge !== source.isBridge ||
      node.isCornerstone !== source.isCornerstone ||
      node.setClassId !== source.setClassId
    ) {
      fail(`pentatonic node ${id} flags disagree with the bipartite source`);
    }
    if (node.admittedBridge !== admittedBridgeClasses.has(node.setClassId)) {
      fail(`pentatonic node ${id} admitted-bridge flag disagrees with the registry`);
    }
    const parents = artifact.pentatonicParents[id];
    if (!parents || parents.length !== 21) {
      fail(`pentatonic node ${id} parents length ${parents ? parents.length : 0}`);
    }
    if (!parents.every((parent) => artifact.heptatonicNodes[parent])) {
      fail(`pentatonic node ${id} parents must all be heptatonic nodes (no 330-330 adjacency)`);
    }
    for (const parent of parents) {
      if (!isSubset(node.pitchMask, artifact.heptatonicNodes[parent].pitchMask)) {
        fail(`containment ${id} subset-of ${parent} fails`);
      }
      if (!source.parentsRooted.includes(parent)) {
        fail(`containment ${id} subset-of ${parent} not in the bipartite source`);
      }
      if (!bipartite.heptatonicNodes[parent].subnodes.includes(id)) {
        fail(`containment ${id} subset-of ${parent} is not symmetric in the bipartite source`);
      }
    }
  }

  const maskToHeptatonicId = new Map(
    Object.entries(artifact.heptatonicNodes).map(([id, node]) => [node.pitchMask, id]),
  );
  const expectedEdges = legalMoves.moves
    .map((move) => `${move.id}|${maskToHeptatonicId.get(move.sourceId)}|${maskToHeptatonicId.get(move.targetId)}|${move.operatorId}`)
    .sort();
  const actualEdges = artifact.operatorEdges
    .map((edge) => `${edge.moveId}|${edge.sourceNodeId}|${edge.targetNodeId}|${edge.operatorId}`)
    .sort();
  if (JSON.stringify(actualEdges) !== JSON.stringify(expectedEdges)) {
    fail("operator edges disagree with the committed legal-move catalog");
  }
  if (actualEdges.some((edge) => /^M/.test(edge))) {
    fail("operator edges must not include M applications");
  }

  const expectedOperatorCovered = [...legalMoves.scope.anchorIds].sort((a, b) => a - b);
  if (JSON.stringify(artifact.anchors.operatorCovered) !== JSON.stringify(expectedOperatorCovered)) {
    fail("operatorCovered anchors disagree with the catalog scope");
  }
  const expectedBoundary = network.nodes
    .filter((node) => node.role === "anchor" && typeof node.tier === "string" && node.tier.startsWith("D"))
    .map((node) => node.id)
    .sort((a, b) => a - b);
  if (JSON.stringify(artifact.anchors.boundaryAnchors) !== JSON.stringify(expectedBoundary)) {
    fail("boundaryAnchors disagree with the network data");
  }
  if (expectedBoundary.length !== 49) {
    fail(`D-anchor census ${expectedBoundary.length}`);
  }

  console.log(
    JSON.stringify({
      verdict: "PASS",
      schemaVersion: artifact.schemaVersion,
      counts: artifact.counts,
      admittedBridgeClasses: artifact.admittedBridgeClasses,
      graphFingerprint: artifact.graphFingerprint,
    }),
  );
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
