import { describe, expect, it } from "vitest";

import investigation from "./generated/bl071-interval-6-structure.v1.json";

describe("BL-071 interval-6 structure (census / baselines / role verdict) — pinned", () => {
  it("pins schema, status, fingerprint, source bindings, the chain anchors and the pre-registration", () => {
    expect(investigation.schemaVersion).toBe("harmonic-orrery.bl071-interval-6-structure.v1");
    expect(investigation.investigationId).toBe("BL071_INTERVAL_6_STRUCTURE_V1");
    expect(investigation.status).toBe("planning_evidence");
    expect(investigation.generator).toBe("scripts/build-bl071-interval-6-structure.mjs");
    expect(investigation.investigationFingerprint).toMatch(/^[0-9a-f]{64}$/);
    expect(investigation.sourceBindings).toHaveLength(8);
    expect(investigation.sourceBindings.every((binding) => /^[0-9a-f]{64}$/.test(binding.sha256))).toBe(true);
    expect(investigation.base.bl070.derivationFingerprint).toBe("9db10a088a05664a5cf60f6fad14514a4fc9aab278dcf0359d684bce70607731");
    expect(investigation.base.bl068.derivationFingerprint).toBe("b0d65bd6149978de4f5ef3f1a0b281d0f6324a81114e8aa9da07eda8ef5ef849");
    expect(investigation.base.d4Hunt.huntFingerprint).toMatch(/^[0-9a-f]{64}$/);
    expect(investigation.preRegistration.rulings.map((ruling) => ruling.id)).toEqual([
      "OD-71-1", "OD-71-2", "OD-71-3", "OD-71-4", "OD-71-5", "OD-71-6",
    ]);
    expect(investigation.preRegistration.baselineLock.roleVocabulary).toEqual([
      "separation", "exclusion", "transition", "mixed", "none",
    ]);
    expect(investigation.preRegistration.baselineLock.fisher.preRegistered).toBe(true);
  });

  it("pins the triangulation: two landed findings re-verified, T-3 framed and excluded", () => {
    const triangulation = investigation.triangulation;
    expect(triangulation.statement).toContain("two landed + one framed");
    expect(triangulation.t1.perEdge.map((edge) => edge.rotateInterval)).toEqual([11, 11, 11, 11, 11, 11, 6]);
    expect(triangulation.t1.perEdge.map((edge) => edge.hamming)).toEqual([2, 2, 2, 2, 2, 2, 10]);
    expect(triangulation.t1.perEdge[6]).toMatchObject({ a: "4033", b: "127", rotateInterval: 6, landedRotateInterval: 6 });
    expect(triangulation.t1.reVerified).toBe(true);
    expect(triangulation.t1.parallelFinding).toContain("both boundary seven-cycles close at interval 6");
    expect(triangulation.t2.missedKeys).toEqual(["127:253", "4033:2017"]);
    expect(triangulation.t2.recordedDisplacement6).toEqual(["127:253", "4033:2017"]);
    expect(triangulation.t2.selectedKeys).toHaveLength(12);
    expect(triangulation.t3.status).toBe("HYPOTHESIS_FRAMING");
    expect(triangulation.t3.excludedFromVerdict).toBe(true);
    expect(triangulation.t3.reVerified).toBe(false);
  });

  it("pins the D7-36 and D6-tier universes: the ti-local displacement-6 concentration", () => {
    const byId = new Map(investigation.census.universes.map((universe) => [universe.id, universe]));
    const d7 = byId.get("D7-36")!;
    expect(d7.instanceCount).toBe(36);
    expect(d7.hamming2Count).toBe(36);
    expect(d7.displacement6Count).toBe(12);
    expect(d7.displacementHistogram).toEqual({ "1": 6, "-1": 6, "4": 6, "-4": 6, "6": 12 });
    expect(d7.rotation6Count).toBe(0);
    expect(d7.ic6Content).toEqual({ "1": 21 });
    const d6 = byId.get("D6-tier")!;
    expect(d6.instanceCount).toBe(98);
    expect(d6.hamming2Count).toBe(12);
    expect(d6.displacement6Count).toBe(0);
    expect(d6.rotation6Count).toBe(0);
  });

  it("pins the A1-28 (D4/fa-pole) universe: zero displacement-6, zero rotation-6", () => {
    const a1 = investigation.census.universes.find((universe) => universe.id === "A1-28")!;
    expect(a1.instanceCount).toBe(28);
    expect(a1.hamming2Count).toBe(24);
    expect(a1.nonSwapCount).toBe(4);
    expect(a1.displacementHistogram).toEqual({ "1": 12, "-1": 12 });
    expect(a1.displacement6Count).toBe(0);
    expect(a1.rotation6Count).toBe(0);
    expect(a1.ic6Content).toEqual({ "1": 14, "2": 7, "3": 14 });
  });

  it("pins the A0-P7 ring and the D-anchor-49 space: both boundary cycles close at rotation 6", () => {
    const byId = new Map(investigation.census.universes.map((universe) => [universe.id, universe]));
    const a0 = byId.get("A0-P7")!;
    expect(a0.instanceCount).toBe(7);
    expect(a0.hamming2Count).toBe(6);
    expect(a0.displacementHistogram).toEqual({ "1": 6 });
    expect(a0.displacement6Count).toBe(0);
    expect(a0.rotation6Witnesses).toEqual(["1387:2773"]);
    const u5 = byId.get("D-anchor-49")!;
    expect(u5.pairSpaceCount).toBe(1176);
    expect(u5.hamming2Count).toBe(69);
    expect(u5.displacement6Count).toBe(15);
    expect(u5.rotation6Count).toBe(12);
    expect(u5.rotation6Witnesses).toContain("127:4033");
    expect(u5.rotation6Witnesses).toContain("631:3529");
  });

  it("pins the boundary IC6 aggregate: the boundary layer is IC6-poor", () => {
    const aggregate = investigation.census.boundaryAggregate;
    expect(aggregate.stateCount).toBe(70);
    expect(aggregate.ic6Content).toEqual({ "1": 42, "2": 14, "3": 14 });
    expect(aggregate.ledgerComparison).toEqual({ "1": 112, "2": 280, "3": 70 });
    expect(aggregate.statement).toContain("IC6-poor");
  });

  it("pins the baselines: B1 structural reach and B2 D4 control with the grounding correction", () => {
    expect(investigation.baseline.b1.pairSpaceCount).toBe(106491);
    expect(investigation.baseline.b1.hamming2Count).toBe(6930);
    expect(investigation.baseline.b1.displacement6Count).toBe(630);
    expect(investigation.baseline.b1.rotation6Count).toBe(126);
    expect(investigation.baseline.b1.hamming2AndRotation6Count).toBe(30);
    expect(investigation.baseline.b2.instanceCount).toBe(28);
    expect(investigation.baseline.b2.hamming2Count).toBe(24);
    expect(investigation.baseline.b2.displacement6Count).toBe(0);
    expect(investigation.baseline.b2.groundingCorrection).toContain("0/28");
    expect(investigation.baseline.b2.groundingCorrection).toContain("maintainer-prose");
    expect(investigation.baseline.noPostHocAdjustment).toContain("halt");
  });

  it("pins the Fisher tests: five pre-registered tables with exact and decimal p-values", () => {
    const tests = investigation.baseline.tests;
    expect(tests.map((test) => test.id)).toEqual(["TEST-1", "TEST-2", "TEST-2b", "TEST-3", "TEST-4"]);
    expect(tests[0].table).toEqual({ a: 12, b: 24, c: 630, d: 6300 });
    expect(tests[0].pDecimal).toBe("0.000053222786200381060072");
    expect(tests[1].table).toEqual({ a: 12, b: 24, c: 0, d: 28 });
    expect(tests[1].pExact).toBe("5525/14496772");
    expect(tests[2].pExact).toBe("372/415891");
    expect(tests[3].table).toEqual({ a: 12, b: 1164, c: 126, d: 106365 });
    expect(tests[4].pDecimal).toBe("0.000000000002235849946042");
    expect(tests.every((test) => test.side === "greater")).toBe(true);
  });

  it("pins the 7-27/7-31 split: not tritone-structured (no swap, no rotation, no complement)", () => {
    const split = investigation.splitSevenTwentySeven;
    expect(split.familySizes).toEqual({ "7-27": 14, "7-31": 14 });
    expect(split.ic6ContentByFamily).toEqual({ "7-27": ["1"], "7-31": ["3"] });
    expect(split.crossPairCount).toBe(196);
    expect(split.crossHammingHistogram).toEqual({ "4": 60, "6": 112, "8": 24 });
    expect(split.crossHamming2Count).toBe(0);
    expect(split.crossRotation6Count).toBe(0);
    expect(split.crossComplementCount).toBe(0);
    expect(split.characterization.startsWith("SPLIT_NOT_TRITONE_STRUCTURED")).toBe(true);
  });

  it("pins the lifted space: the endpoints' relation is phase-shift-6 stable, root-coherent everywhere", () => {
    const lifted = investigation.liftedSpace;
    expect(lifted.status).toBe("COMPUTABLE_EXACT_ROOTED_CONGRUENCE");
    expect(lifted.endpointPair.a).toBe("1387");
    expect(lifted.endpointPair.b).toBe("2773");
    expect(lifted.endpointPair.rootRelation).toContain("+ 6");
    expect(lifted.endpointPair.congruence).toContain("phase-shift-6");
    expect(lifted.universalCheck.rotation6Pairs).toBe(126);
    expect(lifted.universalCheck.rootCoherent).toBe(126);
    expect(lifted.universalCheck.mismatches).toEqual([]);
    expect(lifted.d7ClosurePair.a).toBe("4033");
    expect(lifted.note).toContain("not a claim that T_6 is an admitted operator edge");
  });

  it("pins the role verdict, the GSL-4 candidate draft, the gates and the fences", () => {
    const role = investigation.roleVerdict;
    expect(role.verdict).toBe("mixed");
    expect(role.perMeasure["M-DISP"].role).toBe("separation");
    expect(role.perMeasure["M-ROT"].role).toBe("transition");
    expect(role.perMeasure["M-IC6"].role).toBe("none");
    expect(role.statement).toContain("No mechanism claim");
    expect(investigation.gsl.id).toBe("GSL-4");
    expect(investigation.gsl.status).toBe("CANDIDATE_UNPROMOTED");
    expect(investigation.gsl.statement).toContain("measure-dependent");
    expect(investigation.gates["V-BL-071-1"].result).toBe("PASS");
    expect(investigation.gates["V-BL-071-4"].statement).toContain("no mechanism claim");
    expect(investigation.fences.d7HypothesisTier).toContain("2703-2712");
    expect(investigation.fences.noMechanismClaim).toContain("no mechanism claim");
    expect(investigation.fences.directionalSemantics).toContain("no directional-semantics assignment");
    expect(investigation.notAccomplished.some((item) => item.includes("no mechanism claim"))).toBe(true);
    expect(investigation.notAccomplished.some((item) => item.includes("no governs admission"))).toBe(true);
  });
});
