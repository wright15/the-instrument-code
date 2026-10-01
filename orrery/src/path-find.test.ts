import { describe, expect, it } from "vitest";

import {
  DERIVED_PATH_GRAPH,
  buildDerivedPathGraph,
  findDerivedPaths,
  reachableNodeIds,
} from "./path-find";

const SEVEN_DIATONIC_MODES = [
  "7-35:0",
  "7-35:5",
  "7-35:10",
  "7-35:3",
  "7-35:1",
  "7-35:7",
  "7-35:8",
];

describe("Derived-path graph (BL-028)", () => {
  it("indexes the composed graph with source-backed counts and classifications", () => {
    expect(DERIVED_PATH_GRAPH.counts).toEqual({
      heptatonicNodes: 462,
      pentatonicNodes: 330,
      operatorEdges: 60,
      containmentEdges: 6930,
    });
    expect(DERIVED_PATH_GRAPH.nodes.size).toBe(792);

    const ionian = DERIVED_PATH_GRAPH.heptatonicNodes.get("7-35:0");
    expect(ionian?.operatorCovered).toBe(true);
    expect(ionian?.boundaryAnchor).toBe(false);
    expect(ionian?.setClassId).toBe("7-35");

    const boundaryAnchors = [...DERIVED_PATH_GRAPH.heptatonicNodes.values()].filter(
      (node) => node.boundaryAnchor,
    );
    expect(boundaryAnchors).toHaveLength(49);
    expect(boundaryAnchors.every((node) => node.operatorCovered === false)).toBe(true);

    const admittedBridges = [...DERIVED_PATH_GRAPH.pentatonicNodes.values()].filter(
      (node) => node.admittedBridge,
    );
    expect(admittedBridges).toHaveLength(20);
    expect(new Set(admittedBridges.map((node) => node.setClassId))).toEqual(
      new Set(["5-23", "5-27"]),
    );
    expect(DERIVED_PATH_GRAPH.pentatonicNodes.get("5-27:0")?.admittedBridge).toBe(true);
    expect(DERIVED_PATH_GRAPH.pentatonicNodes.get("5-20:0B")?.admittedBridge).toBe(false);
  });

  it("fails closed on a malformed payload", () => {
    expect(() => buildDerivedPathGraph({ schemaVersion: "not-the-schema" })).toThrow(
      /INVALID_DERIVED_PATH_GRAPH/,
    );
  });
});

describe("Derived-path finder (BL-028)", () => {
  it("derives the golden-path seam crossing through the registered bridge", () => {
    const result = findDerivedPaths(DERIVED_PATH_GRAPH, "7-35:3", "7-32:0", { maxPaths: 5 });
    expect(result.kind).toBe("ok");
    if (result.kind !== "ok") {
      return;
    }
    expect(result.hopCount).toBe(2);
    expect(result.paths).toHaveLength(5);
    expect(result.truncated).toBe(false);
    const crossings = result.paths.map((path) => path.nodes[1].id);
    expect(crossings).toEqual(["5-20:0B", "5-23:0", "5-25:0", "5-27:0", "5-29:0B"]);
    expect(crossings).toContain("5-27:0");

    const origin = DERIVED_PATH_GRAPH.heptatonicNodes.get("7-35:3");
    const destination = DERIVED_PATH_GRAPH.heptatonicNodes.get("7-32:0");
    expect(origin).toBeDefined();
    expect(destination).toBeDefined();
    if (!origin || !destination) {
      return;
    }
    for (const path of result.paths) {
      expect(path.nodes.map((node) => node.id)).toEqual(["7-35:3", path.nodes[1].id, "7-32:0"]);
      expect(path.edges.map((edge) => edge.kind)).toEqual(["containment", "containment"]);
      expect(path.hopCount).toBe(2);
      const crossing = path.nodes[1];
      expect(crossing.kind).toBe("pentatonic");
      expect(crossing.pitchClasses.every((pc) => origin.pitchClasses.includes(pc))).toBe(true);
      expect(crossing.pitchClasses.every((pc) => destination.pitchClasses.includes(pc))).toBe(true);
    }
  });

  it("returns the mode-axis L-chain among the minimal Ionian to Aeolian paths", () => {
    const result = findDerivedPaths(DERIVED_PATH_GRAPH, "7-35:0", "7-35:3", { maxPaths: 8 });
    expect(result.kind).toBe("ok");
    if (result.kind !== "ok") {
      return;
    }
    expect(result.hopCount).toBe(3);
    expect(result.paths).toHaveLength(7);
    expect(result.truncated).toBe(false);
    const chain = "L7:2741:1717,L3:1717:1709,L6:1709:1453";
    expect(result.paths.some((path) => path.operatorMoveIds.join(",") === chain)).toBe(true);

    const capped = findDerivedPaths(DERIVED_PATH_GRAPH, "7-35:0", "7-35:3");
    expect(capped.kind).toBe("ok");
    if (capped.kind !== "ok") {
      return;
    }
    expect(capped.paths).toHaveLength(3);
    expect(capped.truncated).toBe(true);
  });

  it("filters to the admitted-bridge vocabulary", () => {
    const result = findDerivedPaths(DERIVED_PATH_GRAPH, "7-35:3", "7-32:0", {
      admittedBridgesOnly: true,
      maxPaths: 3,
    });
    expect(result.kind).toBe("ok");
    if (result.kind !== "ok") {
      return;
    }
    expect(result.admittedBridgesOnly).toBe(true);
    expect(result.paths.map((path) => path.nodes[1].id)).toEqual(["5-23:0", "5-27:0"]);
    expect(result.truncated).toBe(false);

    const blocked = findDerivedPaths(DERIVED_PATH_GRAPH, "5-20:0B", "7-32:0", {
      admittedBridgesOnly: true,
    });
    expect(blocked.kind).toBe("none");
    const unfiltered = findDerivedPaths(DERIVED_PATH_GRAPH, "5-20:0B", "7-32:0");
    expect(unfiltered.kind).toBe("ok");
  });

  it("reaches the whole composed graph and keeps the seven diatonic modes operator-connected", () => {
    expect(reachableNodeIds(DERIVED_PATH_GRAPH, "7-35:0").size).toBe(792);
    expect(reachableNodeIds(DERIVED_PATH_GRAPH, "5-1:0").size).toBe(792);

    for (const origin of SEVEN_DIATONIC_MODES) {
      const operatorReachable = reachableNodeIds(DERIVED_PATH_GRAPH, origin, { operatorOnly: true });
      for (const target of SEVEN_DIATONIC_MODES) {
        expect(operatorReachable.has(target)).toBe(true);
      }
    }

    const anchorReach = reachableNodeIds(DERIVED_PATH_GRAPH, "7-35:0", { operatorOnly: true });
    expect(anchorReach.size).toBe(21);
  });

  it("fails closed on unknown nodes and returns deterministic results", () => {
    const unknown = findDerivedPaths(DERIVED_PATH_GRAPH, "not-a-node", "7-35:0");
    expect(unknown.kind).toBe("invalid");
    expect(findDerivedPaths(DERIVED_PATH_GRAPH, "7-35:0", "7-35:0", { maxPaths: 1 }).kind).toBe("ok");

    const first = findDerivedPaths(DERIVED_PATH_GRAPH, "7-35:0", "7-35:3", { maxPaths: 8 });
    const second = findDerivedPaths(DERIVED_PATH_GRAPH, "7-35:0", "7-35:3", { maxPaths: 8 });
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
  });
});
