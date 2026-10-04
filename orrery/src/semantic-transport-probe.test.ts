import { describe, expect, it } from "vitest";

import probe from "./generated/semantic-transport-probe.v1.json";

const CORNERSTONE_IDS = ["5-35:0", "5-35:10", "5-35:3", "5-35:5", "5-35:8"];

describe("Semantic transport probe (BL-031)", () => {
  it("pins scope, status and the three separately-classed operationalizations", () => {
    expect(probe.schemaVersion).toBe("harmonic-orrery.semantic-transport-probe.v1");
    expect(probe.probeId).toBe("SEMANTIC_TRANSPORT_PROBE_v1");
    expect(probe.status).toBe("planning_evidence");
    expect(probe.scope.seeds.count).toBe(7);
    expect(probe.scope.seeds.stateIds).toEqual([1387, 1451, 1453, 1709, 1717, 2741, 2773]);
    expect(probe.scope.seeds.nodeIds).toEqual([
      "7-35:0",
      "7-35:1",
      "7-35:10",
      "7-35:3",
      "7-35:5",
      "7-35:7",
      "7-35:8",
    ]);
    expect(probe.scope.pentatonicTargets).toEqual({
      count: 330,
      byClass: { zero: 255, single: 50, conflicting: 25 },
    });
    expect(probe.scope.distances).toEqual([2, 3]);
    expect(probe.scope.pathDeliveryLimit).toBe(3);
    expect(probe.scope.minimalPathBudget).toBe(25);
    expect(probe.scope.operationalizations.map((entry) => entry.id)).toEqual(["a", "b", "c"]);
  });

  it("pins the reachability frame: every target is multi-origin within three hops", () => {
    expect(probe.reachability.perSeed.every((seed) => seed.d1 === 15 && seed.deeper === 65 && seed.unreached === 0)).toBe(true);
    expect(probe.reachability.targets).toEqual({
      reachableWithin3: 330,
      unreachableWithin3: 0,
      multiOriginAt23: 330,
      singleOriginAt23: 0,
      byClass: { zero: 255, single: 50, conflicting: 25 },
    });
    expect(probe.findings.originCountDistribution).toEqual([
      { originCount: 1, count: 0 },
      { originCount: 2, count: 12 },
      { originCount: 3, count: 36 },
      { originCount: 4, count: 50 },
      { originCount: 5, count: 63 },
      { originCount: 6, count: 80 },
      { originCount: 7, count: 89 },
    ]);
    expect(probe.targetAnalysis.every((target) => target.transportReach === "multi-origin")).toBe(true);
    expect(probe.targetAnalysis.every((target) => target.combinedOriginCount >= 2)).toBe(true);
  });

  it("pins gap penetration and the collision-deepening result", () => {
    expect(probe.findings.transportCoverage).toEqual({
      targets: 330,
      multiOriginAt23: 330,
      singleOriginAt23: 0,
      zeroClaimantMultiOrigin: 255,
      conflictTargets: 25,
      conflictTargetsDeepened: 25,
      singleClaimantTargetsWithSecondOrigin: 50,
    });
    const strata = new Map<string, number>();
    for (const query of probe.queries) {
      strata.set(query.stratum, (strata.get(query.stratum) ?? 0) + 1);
    }
    expect([...strata.entries()].sort()).toEqual([
      ["S1", 1456],
      ["S2", 84],
      ["S2b", 210],
    ]);
    expect(probe.queries).toHaveLength(1750);
    const cornerstones = probe.targetAnalysis.filter((target) => target.isCornerstone).map((target) => target.targetId).sort();
    expect(cornerstones).toEqual(CORNERSTONE_IDS);
    const deepest = probe.targetAnalysis.find((target) => target.targetId === "5-35:10");
    expect(deepest?.combinedOriginCount).toBe(7);
    expect(deepest?.censusClaimantOffices).toEqual(["Jupiter", "Mars", "Mercury"]);
  });

  it("pins the pre-registered pool-overlap inventory and the disjoint baseline", () => {
    expect(probe.preRegistration.expectedPoolOverlaps).toEqual([
      { officeA: "Jupiter", officeB: "Sun", shared: ["plains"] },
      { officeA: "Mars", officeB: "Saturn", shared: ["cliffs"] },
      { officeA: "Mercury", officeB: "Moon", shared: ["estuaries"] },
    ]);
    const relations = { identical: 0, subset: 0, overlapping: 0, disjoint: 0 };
    for (const target of probe.targetAnalysis) {
      for (const [relation, count] of Object.entries(target.poolRelationCounts)) {
        relations[relation as keyof typeof relations] += count;
      }
      expect(target.deviations).toEqual([]);
    }
    expect(relations.identical).toBe(0);
    expect(relations.subset).toBe(0);
    expect(relations.overlapping).toBe(620);
    expect(relations.disjoint).toBe(3926);
    expect(probe.findings.overlapInventory.targetsTouchedByOverlap).toBe(287);
  });

  it("keeps same-origin carry a control and records route divergence", () => {
    expect(probe.queries.every((query) => query.sameOriginPoolIdentical === true)).toBe(true);
    expect(probe.findings.routeGeometry).toEqual({
      deliveredPaths: 4770,
      deliveredPathsCrossingBridge: 3786,
      deliveredPathsCrossingHeptatonicFamily: 4650,
      deliveredPathsTouchingKernelWindow: 737,
      queriesWithRouteDivergence: 1510,
    });
    expect(probe.queries.every((query) => query.deliveredPathCount >= 1 && query.deliveredPathCount <= 3)).toBe(true);
  });

  it("pins the BL-028 ground truth through the transport machinery", () => {
    expect(probe.groundTruth.seamCrossing).toEqual({
      originId: "7-35:3",
      destinationId: "7-32:0",
      admittedBridgesOnly: false,
      hopCount: 2,
      minimalPathCount: 5,
      crossingNodes: ["5-20:0B", "5-23:0", "5-25:0", "5-27:0", "5-29:0B"],
    });
    expect(probe.groundTruth.seamCrossingAdmitted).toEqual({
      originId: "7-35:3",
      destinationId: "7-32:0",
      admittedBridgesOnly: true,
      hopCount: 2,
      minimalPathCount: 2,
      crossingNodes: ["5-23:0", "5-27:0"],
    });
    expect(probe.groundTruth.modeAxis.minimalPathCount).toBe(7);
    expect(probe.groundTruth.modeAxis.lChainPresent).toBe(true);
    expect(probe.groundTruth.modeAxisDelivered.deliveredPathCount).toBe(3);
    expect(probe.groundTruth.modeAxisDelivered.truncated).toBe(true);
  });

  it("records the boundary layer as non-traversable geometry only", () => {
    expect(probe.boundaryLayer.traversable).toBe(false);
    expect(probe.boundaryLayer.alternativesEnumerated).toBe(0);
    expect(probe.boundaryLayer.routes).toHaveLength(7);
    expect(probe.boundaryLayer.routes.map((route) => route.pathId)).toEqual([
      "d-cycle:D1",
      "d-cycle:D2",
      "d-cycle:D3",
      "d-cycle:D4",
      "d-cycle:D5",
      "d-cycle:D6",
      "d-cycle:D7",
    ]);
    for (const route of probe.boundaryLayer.routes) {
      expect(route.closure).toBe(true);
      expect(route.mEdgeCount).toBe(7);
      expect(route.nodes.every((node) => node.subnodeCount === 15)).toBe(true);
    }
  });

  it("leaves direction unassigned and carries a source-bound fingerprint", () => {
    expect(probe.directionFields.directionAssigned).toBe(false);
    expect(probe.directionFields.kernelWindowRecorded).toBe(true);
    expect(probe.probeFingerprint).toBe("9138a7ab2988382a9a1012b0c0a07bd661ce61f8f6d9b40a5054a9d67e58a6d4");
    expect(probe.sourceBindings).toHaveLength(5);
    expect(probe.sourceBindings.every((binding) => /^[a-f0-9]{64}$/.test(binding.sha256))).toBe(true);
  });
});
