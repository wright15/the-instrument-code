// Derived-path finder (BL-028) — a search over the composed graph.
//
// The graph is the union of source-backed edges only:
// - operator edges: the 60 committed legal-move catalog moves over the 21
//   A anchors (the performable layer);
// - containment edges: the 6,930 pentatonic-subset-of-heptatonic pairs
//   (planning evidence, `derived/hypergraph/bipartite-inclusion-v1.json`).
//
// There is no intra-pentatonic adjacency: the pentatonic edge rule is the open
// structural gap G1 (`docs/ARCHITECTURE_MAP.md` §4) and must not be assumed,
// rendered, or consumed. The finder derives routes; it does not render them.
// Rendering belongs to `path-replay.ts`, which asserts each hop's legality.
//
// M (modal successor) applications are not traversable here: M is audit-real
// but not in the committed legal-move catalog. Where a derived route's
// consecutive operator hops match an M application's compressed pair, the
// replay planner annotates the route (BL-022 demonstration typing), never
// walks it.

import graphDocument from "./generated/derived-path-graph.v1.json";

export const DERIVED_PATH_GRAPH_SCHEMA_VERSION = "harmonic-orrery.derived-path-graph.v1";

export interface HeptatonicGraphNode {
  id: string;
  kind: "heptatonic";
  pitchMask: number;
  pitchClasses: readonly number[];
  setClassId: string;
  tier: string | null;
  role: string | null;
  operatorCovered: boolean;
  boundaryAnchor: boolean;
}

export interface PentatonicGraphNode {
  id: string;
  kind: "pentatonic";
  pitchMask: number;
  pitchClasses: readonly number[];
  setClassId: string;
  isBridge: boolean;
  isCornerstone: boolean;
  admittedBridge: boolean;
}

export type DerivedGraphNode = HeptatonicGraphNode | PentatonicGraphNode;

export interface DerivedOperatorEdge {
  moveId: string;
  sourceNodeId: string;
  targetNodeId: string;
  operatorId: string;
}

export interface DerivedPathGraphCounts {
  heptatonicNodes: number;
  pentatonicNodes: number;
  operatorEdges: number;
  containmentEdges: number;
}

export interface DerivedPathGraph {
  nodes: ReadonlyMap<string, DerivedGraphNode>;
  heptatonicNodes: ReadonlyMap<string, HeptatonicGraphNode>;
  pentatonicNodes: ReadonlyMap<string, PentatonicGraphNode>;
  operatorEdgesBySource: ReadonlyMap<string, readonly DerivedOperatorEdge[]>;
  containmentAdjacency: ReadonlyMap<string, readonly string[]>;
  operatorCoveredAnchors: ReadonlySet<number>;
  boundaryAnchors: ReadonlySet<number>;
  counts: DerivedPathGraphCounts;
}

interface RawGraphDocument {
  schemaVersion: string;
  status: string;
  counts: DerivedPathGraphCounts;
  anchors: { operatorCovered: number[]; boundaryAnchors: number[] };
  heptatonicNodes: Record<
    string,
    { pitchMask: number; setClassId: string; tier: string | null; role: string | null }
  >;
  pentatonicNodes: Record<
    string,
    {
      pitchMask: number;
      setClassId: string;
      isBridge: boolean;
      isCornerstone: boolean;
      admittedBridge: boolean;
    }
  >;
  operatorEdges: DerivedOperatorEdge[];
  pentatonicParents: Record<string, string[]>;
  graphFingerprint: string;
}

function pitchClassesOf(pitchMask: number): number[] {
  const pitchClasses: number[] = [];
  for (let pitchClass = 0; pitchClass < 12; pitchClass += 1) {
    if ((pitchMask & (1 << pitchClass)) !== 0) {
      pitchClasses.push(pitchClass);
    }
  }
  return pitchClasses;
}

function parseFail(message: string): never {
  throw new Error(`INVALID_DERIVED_PATH_GRAPH: ${message}`);
}

/**
 * Parse and index the generated derived-path graph. Fail-loud on any shape or
 * reference error; the build gate (`orrery:derived-path-graph:check`) pins the
 * bytes, the planner and finder fail closed on top.
 */
export function buildDerivedPathGraph(value: unknown): DerivedPathGraph {
  const document = value as RawGraphDocument;
  if (document.schemaVersion !== DERIVED_PATH_GRAPH_SCHEMA_VERSION) {
    parseFail(`unexpected schemaVersion ${String(document.schemaVersion)}`);
  }
  if (document.status !== "planning_evidence") {
    parseFail(`unexpected status ${String(document.status)}`);
  }

  const nodes = new Map<string, DerivedGraphNode>();
  const heptatonicNodes = new Map<string, HeptatonicGraphNode>();
  const pentatonicNodes = new Map<string, PentatonicGraphNode>();
  const operatorCovered = new Set(document.anchors.operatorCovered);

  for (const [id, raw] of Object.entries(document.heptatonicNodes)) {
    if (nodes.has(id)) parseFail(`duplicate node id ${id}`);
    const node: HeptatonicGraphNode = {
      id,
      kind: "heptatonic",
      pitchMask: raw.pitchMask,
      pitchClasses: pitchClassesOf(raw.pitchMask),
      setClassId: raw.setClassId,
      tier: raw.tier,
      role: raw.role,
      operatorCovered: operatorCovered.has(raw.pitchMask),
      boundaryAnchor: document.anchors.boundaryAnchors.includes(raw.pitchMask),
    };
    if (node.pitchClasses.length !== 7) parseFail(`heptatonic node ${id} is not weight-7`);
    heptatonicNodes.set(id, node);
    nodes.set(id, node);
  }

  for (const [id, raw] of Object.entries(document.pentatonicNodes)) {
    if (nodes.has(id)) parseFail(`duplicate node id ${id}`);
    const node: PentatonicGraphNode = {
      id,
      kind: "pentatonic",
      pitchMask: raw.pitchMask,
      pitchClasses: pitchClassesOf(raw.pitchMask),
      setClassId: raw.setClassId,
      isBridge: raw.isBridge,
      isCornerstone: raw.isCornerstone,
      admittedBridge: raw.admittedBridge,
    };
    if (node.pitchClasses.length !== 5) parseFail(`pentatonic node ${id} is not weight-5`);
    pentatonicNodes.set(id, node);
    nodes.set(id, node);
  }

  const operatorEdgesBySource = new Map<string, DerivedOperatorEdge[]>();
  for (const edge of document.operatorEdges) {
    const source = heptatonicNodes.get(edge.sourceNodeId);
    const target = heptatonicNodes.get(edge.targetNodeId);
    if (!source || !target) {
      parseFail(`operator edge ${edge.moveId} does not connect heptatonic nodes`);
    }
    if (edge.moveId !== `${edge.operatorId}:${source.pitchMask}:${target.pitchMask}`) {
      parseFail(`operator edge ${edge.moveId} does not match its endpoints`);
    }
    const group = operatorEdgesBySource.get(edge.sourceNodeId);
    if (group) {
      group.push(edge);
    } else {
      operatorEdgesBySource.set(edge.sourceNodeId, [edge]);
    }
  }
  for (const group of operatorEdgesBySource.values()) {
    group.sort((a, b) => (a.moveId < b.moveId ? -1 : a.moveId > b.moveId ? 1 : 0));
  }

  const containmentAdjacency = new Map<string, string[]>();
  const link = (from: string, to: string) => {
    const group = containmentAdjacency.get(from);
    if (group) {
      group.push(to);
    } else {
      containmentAdjacency.set(from, [to]);
    }
  };
  let containmentEdgeCount = 0;
  for (const [pentatonicId, parents] of Object.entries(document.pentatonicParents)) {
    if (!pentatonicNodes.has(pentatonicId)) {
      parseFail(`containment parent list references unknown pentatonic node ${pentatonicId}`);
    }
    for (const parentId of parents) {
      if (!heptatonicNodes.has(parentId)) {
        parseFail(`containment edge ${pentatonicId} -> ${parentId} is not heptatonic`);
      }
      link(pentatonicId, parentId);
      link(parentId, pentatonicId);
      containmentEdgeCount += 1;
    }
  }
  for (const [id, group] of containmentAdjacency) {
    containmentAdjacency.set(id, [...new Set(group)].sort());
  }

  const counts = document.counts;
  if (counts.heptatonicNodes !== heptatonicNodes.size || counts.pentatonicNodes !== pentatonicNodes.size) {
    parseFail("node counts disagree with the node maps");
  }
  if (counts.containmentEdges !== containmentEdgeCount) {
    parseFail("containment count disagrees with the parent lists");
  }

  return {
    nodes,
    heptatonicNodes,
    pentatonicNodes,
    operatorEdgesBySource,
    containmentAdjacency,
    operatorCoveredAnchors: new Set(document.anchors.operatorCovered),
    boundaryAnchors: new Set(document.anchors.boundaryAnchors),
    counts,
  };
}

export const DERIVED_PATH_GRAPH: DerivedPathGraph = buildDerivedPathGraph(graphDocument as unknown);

export interface DerivedPathNode {
  id: string;
  kind: "heptatonic" | "pentatonic";
  pitchMask: number;
  pitchClasses: readonly number[];
  setClassId: string;
  isBridge: boolean;
  admittedBridge: boolean;
}

export interface DerivedPathEdge {
  kind: "operator" | "containment";
  moveId: string | null;
  operatorId: string | null;
}

export interface DerivedPath {
  originId: string;
  destinationId: string;
  nodes: readonly DerivedPathNode[];
  edges: readonly DerivedPathEdge[];
  hopCount: number;
  operatorMoveIds: readonly string[];
}

export interface DerivedPathSearchOptions {
  admittedBridgesOnly?: boolean;
  maxPaths?: number;
}

export type DerivedPathSearchResult =
  | {
      kind: "ok";
      originId: string;
      destinationId: string;
      hopCount: number;
      admittedBridgesOnly: boolean;
      truncated: boolean;
      paths: readonly DerivedPath[];
    }
  | { kind: "none"; originId: string; destinationId: string; message: string }
  | { kind: "invalid"; message: string };

interface TraversalEdge {
  from: string;
  to: string;
  kind: "operator" | "containment";
  moveId: string | null;
  operatorId: string | null;
}

const MAX_PATH_BUDGET = 25;

function traversalEdges(
  graph: DerivedPathGraph,
  nodeId: string,
  admittedBridgesOnly: boolean,
): TraversalEdge[] {
  const edges: TraversalEdge[] = [];
  const node = graph.nodes.get(nodeId);
  if (!node) {
    return edges;
  }
  if (node.kind === "heptatonic") {
    for (const edge of graph.operatorEdgesBySource.get(nodeId) ?? []) {
      edges.push({
        from: nodeId,
        to: edge.targetNodeId,
        kind: "operator",
        moveId: edge.moveId,
        operatorId: edge.operatorId,
      });
    }
    for (const neighborId of graph.containmentAdjacency.get(nodeId) ?? []) {
      const neighbor = graph.pentatonicNodes.get(neighborId);
      if (!neighbor) continue;
      if (admittedBridgesOnly && !neighbor.admittedBridge) continue;
      edges.push({ from: nodeId, to: neighborId, kind: "containment", moveId: null, operatorId: null });
    }
  } else {
    for (const neighborId of graph.containmentAdjacency.get(nodeId) ?? []) {
      if (admittedBridgesOnly && !node.admittedBridge) continue;
      if (!graph.heptatonicNodes.has(neighborId)) continue;
      edges.push({ from: nodeId, to: neighborId, kind: "containment", moveId: null, operatorId: null });
    }
  }
  edges.sort((a, b) => {
    if (a.to !== b.to) return a.to < b.to ? -1 : 1;
    if (a.kind !== b.kind) return a.kind < b.kind ? -1 : 1;
    return (a.moveId ?? "") < (b.moveId ?? "") ? -1 : (a.moveId ?? "") > (b.moveId ?? "") ? 1 : 0;
  });
  return edges;
}

function toPathNode(graph: DerivedPathGraph, nodeId: string): DerivedPathNode {
  const node = graph.nodes.get(nodeId);
  if (!node) {
    parseFail(`path node ${nodeId} is unavailable`);
  }
  return {
    id: node.id,
    kind: node.kind,
    pitchMask: node.pitchMask,
    pitchClasses: [...node.pitchClasses],
    setClassId: node.setClassId,
    isBridge: node.kind === "pentatonic" ? node.isBridge : false,
    admittedBridge: node.kind === "pentatonic" ? node.admittedBridge : false,
  };
}

/**
 * Find up to `maxPaths` minimal-hop paths between two graph nodes. The search
 * respects edge direction for operator moves and treats containment as
 * bidirectional. `admittedBridgesOnly` restricts every pentatonic traversal to
 * the admitted-bridge vocabulary (set classes 5-23 / 5-27); under that filter a
 * non-admitted pentatonic endpoint is reachable only as the origin itself.
 */
export function findDerivedPaths(
  graph: DerivedPathGraph,
  originId: string,
  destinationId: string,
  options: DerivedPathSearchOptions = {},
): DerivedPathSearchResult {
  const admittedBridgesOnly = options.admittedBridgesOnly ?? false;
  const maxPaths = options.maxPaths ?? 3;
  if (!Number.isInteger(maxPaths) || maxPaths < 1 || maxPaths > MAX_PATH_BUDGET) {
    return { kind: "invalid", message: `maxPaths must be an integer in 1..${MAX_PATH_BUDGET}.` };
  }
  if (!graph.nodes.has(originId) || !graph.nodes.has(destinationId)) {
    const missing = !graph.nodes.has(originId) ? originId : destinationId;
    return { kind: "invalid", message: `Unknown graph node: ${missing}.` };
  }

  const distance = new Map<string, number>([[originId, 0]]);
  const predecessors = new Map<string, TraversalEdge[]>();
  const queue: string[] = [originId];
  while (queue.length > 0) {
    const current = queue.shift() as string;
    const currentDistance = distance.get(current) as number;
    for (const edge of traversalEdges(graph, current, admittedBridgesOnly)) {
      const nextDistance = currentDistance + 1;
      const knownDistance = distance.get(edge.to);
      if (knownDistance === undefined) {
        distance.set(edge.to, nextDistance);
        queue.push(edge.to);
      }
      if (distance.get(edge.to) === nextDistance) {
        const group = predecessors.get(edge.to);
        if (group) {
          group.push(edge);
        } else {
          predecessors.set(edge.to, [edge]);
        }
      }
    }
  }

  const hopCount = distance.get(destinationId);
  if (hopCount === undefined) {
    return {
      kind: "none",
      originId,
      destinationId,
      message: `No ${admittedBridgesOnly ? "admitted-bridge " : ""}path connects ${originId} to ${destinationId} in the composed graph.`,
    };
  }

  const collected: DerivedPath[] = [];
  let truncated = false;
  const buildPath = (nodeIds: readonly string[]): DerivedPath => {
    const edges: DerivedPathEdge[] = [];
    for (let index = 1; index < nodeIds.length; index += 1) {
      const candidates = predecessors.get(nodeIds[index]) ?? [];
      const edge = candidates.find((candidate) => candidate.from === nodeIds[index - 1]);
      if (!edge) {
        parseFail(`missing edge ${nodeIds[index - 1]} -> ${nodeIds[index]} during path assembly`);
      }
      edges.push({ kind: edge.kind, moveId: edge.moveId, operatorId: edge.operatorId });
    }
    return {
      originId,
      destinationId,
      nodes: nodeIds.map((nodeId) => toPathNode(graph, nodeId)),
      edges,
      hopCount: nodeIds.length - 1,
      operatorMoveIds: edges
        .filter((edge) => edge.moveId !== null)
        .map((edge) => edge.moveId as string),
    };
  };

  const walk = (nodeId: string, reversed: string[]): void => {
    if (collected.length > maxPaths) {
      return;
    }
    if (nodeId === originId) {
      collected.push(buildPath([nodeId, ...reversed]));
      if (collected.length > maxPaths) {
        truncated = true;
      }
      return;
    }
    const incoming = (predecessors.get(nodeId) ?? []).slice().sort((a, b) => {
      if (a.from !== b.from) return a.from < b.from ? -1 : 1;
      return (a.moveId ?? "") < (b.moveId ?? "") ? -1 : (a.moveId ?? "") > (b.moveId ?? "") ? 1 : 0;
    });
    for (const edge of incoming) {
      walk(edge.from, [nodeId, ...reversed]);
      if (collected.length > maxPaths) {
        return;
      }
    }
  };
  walk(destinationId, []);

  return {
    kind: "ok",
    originId,
    destinationId,
    hopCount,
    admittedBridgesOnly,
    truncated,
    paths: collected.slice(0, maxPaths),
  };
}

export interface DerivedPathReachabilityOptions {
  operatorOnly?: boolean;
  admittedBridgesOnly?: boolean;
}

/**
 * Breadth-first reachable node set from an origin. `operatorOnly` restricts
 * traversal to committed operator edges (the catalog subgraph); the default is
 * the full composed graph (operator + containment).
 */
export function reachableNodeIds(
  graph: DerivedPathGraph,
  originId: string,
  options: DerivedPathReachabilityOptions = {},
): ReadonlySet<string> {
  const operatorOnly = options.operatorOnly ?? false;
  const admittedBridgesOnly = options.admittedBridgesOnly ?? false;
  if (!graph.nodes.has(originId)) {
    return new Set();
  }
  const reachable = new Set<string>([originId]);
  const queue: string[] = [originId];
  while (queue.length > 0) {
    const current = queue.shift() as string;
    const node = graph.nodes.get(current) as DerivedGraphNode;
    for (const edge of traversalEdges(graph, current, admittedBridgesOnly)) {
      if (operatorOnly && (node.kind !== "heptatonic" || edge.kind !== "operator")) {
        continue;
      }
      if (!reachable.has(edge.to)) {
        reachable.add(edge.to);
        queue.push(edge.to);
      }
    }
  }
  return reachable;
}
