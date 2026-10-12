import { describe, expect, it } from "vitest";

import investigation from "./generated/bl073-isometry-probe.v1.json";

describe("BL-073 isometry probe (the dual seven-cycle geometry) — pinned", () => {
  it("pins schema, status, fingerprint, source bindings, the chain anchors and the pre-registration", () => {
    expect(investigation.schemaVersion).toBe("harmonic-orrery.bl073-isometry-probe.v1");
    expect(investigation.investigationId).toBe("BL073_ISOMETRY_PROBE_V1");
    expect(investigation.status).toBe("planning_evidence");
    expect(investigation.generator).toBe("scripts/build-bl073-isometry-probe.mjs");
    expect(investigation.investigationFingerprint).toMatch(/^[0-9a-f]{64}$/);
    expect(investigation.sourceBindings).toHaveLength(5);
    expect(investigation.sourceBindings.every((binding) => /^[0-9a-f]{64}$/.test(binding.sha256))).toBe(true);
    expect(investigation.base.bl071.investigationFingerprint).toBe(
      "8b2a1f6ca1776851f721eb6bc6ee6532059d81d150ce3f7c9fda1febfe84c3fe",
    );
    expect(investigation.base.bl070.derivationFingerprint).toBe(
      "9db10a088a05664a5cf60f6fad14514a4fc9aab278dcf0359d684bce70607731",
    );
    expect(investigation.preRegistration.rulings.map((ruling) => ruling.id)).toEqual([
      "OD-73-1", "OD-73-2", "OD-73-3", "OD-73-4", "OD-73-5", "OD-73-6",
    ]);
    expect(investigation.preRegistration.refinements.map((refinement) => refinement.id)).toEqual([
      "R1", "N1", "N2",
    ]);
    expect(investigation.preRegistration.properties.map((property) => property.id)).toEqual([
      "P1", "P2", "P3", "P4",
    ]);
    expect(investigation.preRegistration.searchSpaces.dihedral.size).toBe(14);
    expect(investigation.preRegistration.searchSpaces.symmetric.size).toBe(5040);
    expect(investigation.preRegistration.branchTable.full).toContain("FULL_ISOMETRY");
    expect(investigation.preRegistration.branchTable.partial).toContain("PARTIAL_ISOMETRY");
    expect(investigation.preRegistration.branchTable.no).toContain("NO_ISOMETRY");
  });

  it("pins the two cycles: the derived orders, the directed intervals, the closures and the pcSum ladders", () => {
    const d7 = investigation.cycles.D7;
    const a0 = investigation.cycles.A0;
    expect(d7.order).toEqual(["127", "2111", "3103", "3599", "3847", "3971", "4033"]);
    expect(a0.order).toEqual(["1387", "1451", "1453", "1709", "1717", "2741", "2773"]);
    expect(d7.edges.map((edge) => edge.rotateInterval)).toEqual([11, 11, 11, 11, 11, 11, 6]);
    expect(a0.edges.map((edge) => edge.rotateInterval)).toEqual([7, 7, 7, 7, 7, 7, 6]);
    expect(d7.edges.map((edge) => edge.hamming)).toEqual([2, 2, 2, 2, 2, 2, 10]);
    expect(a0.edges.map((edge) => edge.hamming)).toEqual([2, 2, 2, 2, 2, 2, 10]);
    expect(d7.closureEdge).toMatchObject({ a: "4033", b: "127", hamming: 10, rotateInterval: 6, closure: true });
    expect(a0.closureEdge).toMatchObject({ a: "2773", b: "1387", hamming: 10, rotateInterval: 6, closure: true });
    expect(d7.pcSumLadder).toEqual([21, 26, 31, 36, 41, 46, 51]);
    expect(a0.pcSumLadder).toEqual([33, 34, 35, 36, 37, 38, 39]);
    expect(d7.pcSumStep).toBe(5);
    expect(a0.pcSumStep).toBe(1);
    expect(d7.degreeSequence).toEqual([2, 2, 2, 2, 2, 2, 2]);
    expect(a0.degreeSequence).toEqual([2, 2, 2, 2, 2, 2, 2]);
  });

  it("pins P1: the two cycles carry identical 21-pair Hamming histograms", () => {
    const p1 = investigation.perProperty.P1;
    expect(p1.d7HammingHistogram).toEqual({ "2": 6, "4": 5, "6": 4, "8": 3, "10": 3 });
    expect(p1.a0HammingHistogram).toEqual({ "2": 6, "4": 5, "6": 4, "8": 3, "10": 3 });
    expect(p1.multisetsEqual).toBe(true);
    expect(p1.witnesses).toContain("phi-invariant");
    expect(p1.verdict).toBe("PASS");
  });

  it("pins P2: the interval signature fails strictly; the two-interval structure is the shared secondary observation", () => {
    const p2 = investigation.perProperty.P2;
    expect(p2.primaryStrict.d7DirectedIntervalHistogram).toEqual({ "11": 6, "6": 1 });
    expect(p2.primaryStrict.a0DirectedIntervalHistogram).toEqual({ "7": 6, "6": 1 });
    expect(p2.primaryStrict.equal).toBe(false);
    expect(p2.primaryStrict.passingWitnesses).toEqual({ dihedral: 0, symmetric: 0 });
    expect(p2.primaryStrict.failureMode).toContain("interval 11");
    expect(p2.primaryStrict.verdict).toBe("FAIL");
    const secondary = p2.secondaryStructural;
    expect(secondary.d7.pathInterval).toBe(11);
    expect(secondary.a0.pathInterval).toBe(7);
    expect(secondary.d7.pathCount).toBe(6);
    expect(secondary.a0.pathCount).toBe(6);
    expect(secondary.d7.closureInterval).toBe(6);
    expect(secondary.a0.closureInterval).toBe(6);
    expect(secondary.d7.closureHamming).toBe(10);
    expect(secondary.a0.closureHamming).toBe(10);
    expect(secondary.shared).toContain("two-interval shape");
    expect(secondary.nonVerdictBearing).toBe(true);
    expect(secondary.statement).toContain("two-interval structure shared");
    expect(p2.verdict).toBe("FAIL");
  });

  it("pins P3: exactly two distance-matrix isomorphisms, both dihedral (r0 and refl6)", () => {
    const p3 = investigation.perProperty.P3;
    expect(p3.witnessesBySpace.dihedral).toEqual(["r0", "refl6"]);
    expect(p3.witnessesBySpace.symmetric).toBe(2);
    expect(p3.witnessesBySpace.beyondDihedral).toBe(0);
    expect(p3.automorphismGroups.order).toBe(2);
    expect(p3.d7DistanceMatrix).toHaveLength(7);
    expect(p3.d7DistanceMatrix[0][0]).toBe(0);
    expect(p3.d7DistanceMatrix[0][1]).toBe(2);
    expect(p3.a0DistanceMatrix[0][0]).toBe(0);
    expect(p3.verdict).toBe("PASS");
  });

  it("pins P4: every node in both cycles carries exactly one tritone", () => {
    const p4 = investigation.perProperty.P4;
    expect(p4.d7TritoneSlotPerNode).toEqual([1, 1, 1, 1, 1, 1, 1]);
    expect(p4.a0TritoneSlotPerNode).toEqual([1, 1, 1, 1, 1, 1, 1]);
    expect(p4.fullVectorObservation.d7IntervalVectors[0]).toEqual([6, 5, 4, 3, 2, 1]);
    expect(p4.fullVectorObservation.a0IntervalVectors[0]).toEqual([2, 5, 4, 3, 6, 1]);
    expect(p4.fullVectorObservation.note).toContain("not a verdict input");
    expect(p4.verdict).toBe("PASS");
  });

  it("pins the phi witnesses: both explicit maps with dihedral names and parity", () => {
    const witnesses = investigation.phiWitnesses.witnesses;
    expect(witnesses).toHaveLength(2);
    expect(witnesses[0]).toMatchObject({
      id: "phi-1", dihedralElement: "r0", kind: "rotation", parity: "even", inversions: 0,
    });
    expect(witnesses[1]).toMatchObject({
      id: "phi-2", dihedralElement: "refl6", kind: "reflection", parity: "odd", inversions: 21,
    });
    expect(witnesses[0].map[0]).toEqual({ d7: "127", a0: "1387" });
    expect(witnesses[0].map[6]).toEqual({ d7: "4033", a0: "2773" });
    expect(witnesses[1].map[0]).toEqual({ d7: "127", a0: "2773" });
    expect(witnesses[1].map[6]).toEqual({ d7: "4033", a0: "1387" });
    expect(witnesses.every((witness) => witness.classification.includes("N2 fork"))).toBe(true);
    expect(investigation.phiWitnesses.combinedPreservation.properties).toEqual(["P1", "P3", "P4"]);
    expect(investigation.phiWitnesses.combinedPreservation.witnessIds).toEqual(["phi-1", "phi-2"]);
    expect(investigation.phiWitnesses.fullIsometry.witnessIds).toEqual([]);
    expect(investigation.phiWitnesses.fullIsometry.reason).toContain("P2-strict");
    expect(investigation.phiWitnesses.parityNote).toContain("both N2-fork readings");
  });

  it("pins the dual search spaces: dihedral 14 and symmetric 5040 reported separately", () => {
    const spaces = investigation.searchSpaceResults;
    expect(spaces.dihedral.size).toBe(14);
    expect(spaces.dihedral.P1).toContain("14/14");
    expect(spaces.dihedral.P2).toBe("0/14");
    expect(spaces.dihedral.P3).toContain("2/14");
    expect(spaces.symmetric.size).toBe(5040);
    expect(spaces.symmetric.P2).toBe("0/5040");
    expect(spaces.symmetric.P3).toContain("2/5040");
    expect(spaces.symmetric.beyondDihedral).toBe(0);
  });

  it("pins the phase relation: closure-pair coherence, no rotation induction, the lifted citation", () => {
    const phase = investigation.phaseRelation;
    expect(phase.status).toBe("RECORDED_SECONDARY");
    expect(phase.closurePairCoherence.statement).toContain("{4033, 127}");
    expect(phase.closurePairCoherence.phi1).toBe("4033->2773 and 127->1387 (aligned orientation)");
    expect(phase.closurePairCoherence.phi2).toBe("4033->1387 and 127->2773 (reversed orientation)");
    expect(phase.rotationInduction.perWitness).toEqual([
      { witness: "phi-1", rotationRelatedPairs: 0, pairCount: 7 },
      { witness: "phi-2", rotationRelatedPairs: 0, pairCount: 7 },
    ]);
    expect(phase.liftedReuse).toContain("lifted(2773@(p+6)) = T_6(lifted(1387@p))");
    expect(phase.nonVerdictBearing).toBe(true);
  });

  it("pins the branch verdict: PARTIAL_ISOMETRY with P1/P3/P4 passing and P2 failing", () => {
    const branch = investigation.branch;
    expect(branch.preRegisteredLabels).toEqual(["FULL_ISOMETRY", "PARTIAL_ISOMETRY", "NO_ISOMETRY"]);
    expect(branch.propertyResults).toEqual({ P1: "PASS", P2: "FAIL", P3: "PASS", P4: "PASS" });
    expect(branch.passingSubset).toEqual(["P1", "P3", "P4"]);
    expect(branch.failingSubset).toEqual(["P2"]);
    expect(branch.label).toBe("PARTIAL_ISOMETRY");
    expect(branch.statement).toContain("interval-signature asymmetry");
    expect(branch.statement).toContain("separately gated");
  });

  it("pins the binding gate, the cross-checks, the gates and the fences", () => {
    expect(investigation.bindingGate.status).toBe("SEPARATELY_GATED");
    expect(investigation.bindingGate.statement).toContain("gated separately on its own evidence");
    expect(investigation.bindingGate.statement).toContain("No mechanism claim");
    expect(investigation.crossChecks.d7RecordedOrder.matchesDerived).toBe(true);
    expect(investigation.crossChecks.d7LandedIntervals.matchesDerived).toBe(true);
    expect(investigation.crossChecks.a0LandedUniverse.matchesDerived).toBe(true);
    expect(investigation.gates["V-BL-073-1"].result).toBe("PASS");
    expect(investigation.gates["V-BL-073-4"].statement).toContain("no mechanism sentence");
    expect(investigation.fences.d7HypothesisTier).toContain("2703-2712");
    expect(investigation.fences.measurementOnly).toContain("measurement");
    expect(investigation.fences.governsAdmission).toContain("separately gated");
    expect(investigation.notAccomplished.some((item) => item.includes("no GOVERNS admission"))).toBe(true);
    expect(investigation.notAccomplished.some((item) => item.includes("no claim event"))).toBe(true);
    expect(investigation.notAccomplished.some((item) => item.includes("the scoping memo defines"))).toBe(true);
  });
});
