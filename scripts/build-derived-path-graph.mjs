#!/usr/bin/env node
/**
 * Build the deterministic derived-path graph for the Orrery harmonic debugger
 * (BL-028).
 *
 * The finder graph is the union of source-backed edges only:
 * - operator edges: the 60 committed legal-move catalog moves over the 21 A
 *   anchors (`harmonic-orrery.parallel-anchor-edges.v1`);
 * - containment edges: the 6,930 pentatonic-subset-of-heptatonic pairs from
 *   `derived/hypergraph/bipartite-inclusion-v1.json` (stored once, pentatonic
 *   to parents; inverted at load).
 *
 * No intra-pentatonic (330-330) adjacency is emitted: the pentatonic edge rule
 * is the open structural gap G1 (`docs/ARCHITECTURE_MAP.md` §4) and must not be
 * assumed, rendered, or consumed. Node classification (A-anchor operator
 * coverage, D-anchors, bridge census, admitted-bridge vocabulary) is read from
 * `canonical/universal-network-data.json` and the court substrate registry;
 * nothing is inferred.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..");

export const SCHEMA_VERSION = "harmonic-orrery.derived-path-graph.v1";
export const BIPARTITE_PATH = "derived/hypergraph/bipartite-inclusion-v1.json";
export const LEGAL_MOVES_PATH = "orrery/src/generated/legal-moves.v2.json";
export const NETWORK_PATH = "canonical/universal-network-data.json";
export const SUBSTRATE_PATH = "seven-governors-court-substrate-v0.1.0/canonical/substrate-registry-release.json";
export const OUTPUT_PATH = "orrery/src/generated/derived-path-graph.v1.json";

const EXPECTED_HEPTATONIC_NODES = 462;
const EXPECTED_PENTATONIC_NODES = 330;
const EXPECTED_OPERATOR_EDGES = 60;
const EXPECTED_CONTAINMENT_EDGES = 6930;

function fail(message) {
  throw new Error(`INVALID_DERIVED_PATH_GRAPH: ${message}`);
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

export function canonicalText(value) {
  if (value === null) return "null";
  if (value === true) return "true";
  if (value === false) return "false";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isInteger(value)) fail("non-integer number in graph payload");
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

export function buildGraph() {
  const bipartite = readJson(BIPARTITE_PATH);
  const legalMoves = readJson(LEGAL_MOVES_PATH);
  const network = readJson(NETWORK_PATH);
  const substrate = readJson(SUBSTRATE_PATH);

  if (bipartite.status !== "planning_evidence") {
    fail(`bipartite status is ${bipartite.status}, expected planning_evidence`);
  }
  if (legalMoves.schemaVersion !== "harmonic-orrery.legal-moves.v2") {
    fail(`legal-move schema is ${legalMoves.schemaVersion}`);
  }

  const admittedBridgeClasses = new Set(
    substrate.pentatonicSetClasses
      .filter((entry) => entry.admissionStatus === "admitted-bridge")
      .map((entry) => entry.forteNumber),
  );
  if (admittedBridgeClasses.size !== 2) {
    fail(`admitted-bridge class census is ${admittedBridgeClasses.size}, expected 2`);
  }

  const networkByMask = new Map(network.nodes.map((node) => [node.id, node]));

  const heptatonicNodes = {};
  const maskToHeptatonicId = new Map();
  for (const [id, record] of Object.entries(bipartite.heptatonicNodes)) {
    const node = networkByMask.get(record.pitchMask);
    if (!node) {
      fail(`heptatonic node ${id} (mask ${record.pitchMask}) has no network-data record`);
    }
    if (popcount(record.pitchMask) !== 7) {
      fail(`heptatonic node ${id} is not weight-7`);
    }
    if (maskToHeptatonicId.has(record.pitchMask)) {
      fail(`duplicate heptatonic mask ${record.pitchMask}`);
    }
    maskToHeptatonicId.set(record.pitchMask, id);
    heptatonicNodes[id] = {
      pitchMask: record.pitchMask,
      setClassId: record.setClassId,
      tier: node.tier,
      role: node.role,
    };
  }

  const pentatonicNodes = {};
  const pentatonicParents = {};
  let containmentEdges = 0;
  for (const [id, record] of Object.entries(bipartite.pentatonicSubnodes)) {
    if (popcount(record.pitchMask) !== 5) {
      fail(`pentatonic node ${id} is not weight-5`);
    }
    const parents = [...record.parentsRooted].sort();
    if (parents.length !== 21) {
      fail(`pentatonic node ${id} has ${parents.length} parents, expected 21`);
    }
    for (const parent of parents) {
      if (!heptatonicNodes[parent]) {
        fail(`pentatonic node ${id} references unknown parent ${parent}`);
      }
      if (!isSubset(record.pitchMask, heptatonicNodes[parent].pitchMask)) {
        fail(`containment ${id} subset-of ${parent} fails the mask subset test`);
      }
      if (!bipartite.heptatonicNodes[parent].subnodes.includes(id)) {
        fail(`containment ${id} subset-of ${parent} is not symmetric in the source`);
      }
      containmentEdges += 1;
    }
    pentatonicNodes[id] = {
      pitchMask: record.pitchMask,
      setClassId: record.setClassId,
      isBridge: record.isBridge,
      isCornerstone: record.isCornerstone,
      admittedBridge: admittedBridgeClasses.has(record.setClassId),
    };
    pentatonicParents[id] = parents;
  }

  const heptatonicCount = Object.keys(heptatonicNodes).length;
  const pentatonicCount = Object.keys(pentatonicNodes).length;
  if (heptatonicCount !== EXPECTED_HEPTATONIC_NODES) {
    fail(`heptatonic census is ${heptatonicCount}, expected ${EXPECTED_HEPTATONIC_NODES}`);
  }
  if (pentatonicCount !== EXPECTED_PENTATONIC_NODES) {
    fail(`pentatonic census is ${pentatonicCount}, expected ${EXPECTED_PENTATONIC_NODES}`);
  }
  if (containmentEdges !== EXPECTED_CONTAINMENT_EDGES) {
    fail(`containment census is ${containmentEdges}, expected ${EXPECTED_CONTAINMENT_EDGES}`);
  }

  const operatorCovered = [...legalMoves.scope.anchorIds].sort((a, b) => a - b);
  for (const anchorId of operatorCovered) {
    if (!maskToHeptatonicId.has(anchorId)) {
      fail(`catalog anchor ${anchorId} has no heptatonic node`);
    }
  }
  const boundaryAnchors = network.nodes
    .filter((node) => node.role === "anchor" && typeof node.tier === "string" && node.tier.startsWith("D"))
    .map((node) => node.id)
    .sort((a, b) => a - b);
  if (boundaryAnchors.length !== 49) {
    fail(`D-anchor census is ${boundaryAnchors.length}, expected 49`);
  }

  const operatorEdges = legalMoves.moves
    .map((move) => {
      const sourceNodeId = maskToHeptatonicId.get(move.sourceId);
      const targetNodeId = maskToHeptatonicId.get(move.targetId);
      if (!sourceNodeId || !targetNodeId) {
        fail(`catalog move ${move.id} does not resolve to heptatonic nodes`);
      }
      return { moveId: move.id, sourceNodeId, targetNodeId, operatorId: move.operatorId };
    })
    .sort((a, b) => (a.moveId < b.moveId ? -1 : a.moveId > b.moveId ? 1 : 0));
  if (operatorEdges.length !== EXPECTED_OPERATOR_EDGES) {
    fail(`operator edge census is ${operatorEdges.length}, expected ${EXPECTED_OPERATOR_EDGES}`);
  }
  const operatorIds = new Set(operatorEdges.map((edge) => edge.operatorId));
  if (operatorIds.size !== 12 || operatorIds.has("M")) {
    fail(`operator inventory is ${[...operatorIds].sort().join(",")}`);
  }

  const core = {
    schemaVersion: SCHEMA_VERSION,
    status: "planning_evidence",
    generator: "scripts/build-derived-path-graph.mjs",
    sourceBindings: [
      { artifact: BIPARTITE_PATH, sha256: fileSha(BIPARTITE_PATH) },
      { artifact: LEGAL_MOVES_PATH, sha256: fileSha(LEGAL_MOVES_PATH) },
      { artifact: NETWORK_PATH, sha256: fileSha(NETWORK_PATH) },
      { artifact: SUBSTRATE_PATH, sha256: fileSha(SUBSTRATE_PATH) },
    ],
    counts: {
      heptatonicNodes: heptatonicCount,
      pentatonicNodes: pentatonicCount,
      operatorEdges: operatorEdges.length,
      containmentEdges,
    },
    admittedBridgeClasses: [...admittedBridgeClasses].sort(),
    anchors: { operatorCovered, boundaryAnchors },
    heptatonicNodes,
    pentatonicNodes,
    operatorEdges,
    pentatonicParents,
  };
  const graphFingerprint = sha256(canonicalText(core));
  return { ...core, graphFingerprint };
}

export function serializeGraph(graph) {
  return `${canonicalText(graph)}\n`;
}

function main() {
  const check = process.argv.includes("--check");
  const graph = buildGraph();
  const serialized = serializeGraph(graph);
  const outputPath = path.join(root, OUTPUT_PATH);
  if (check) {
    const existing = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, "utf8") : null;
    if (existing !== serialized) {
      throw new Error("STALE_DERIVED_PATH_GRAPH");
    }
    console.log(
      JSON.stringify({
        output: OUTPUT_PATH,
        check: true,
        stale: false,
        counts: graph.counts,
        graphFingerprint: graph.graphFingerprint,
      }),
    );
    return;
  }
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, serialized);
  console.log(
    JSON.stringify({
      output: OUTPUT_PATH,
      check: false,
      counts: graph.counts,
      graphFingerprint: graph.graphFingerprint,
      sha256: sha256(serialized),
    }),
  );
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}
