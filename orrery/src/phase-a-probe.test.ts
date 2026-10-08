import { describe, expect, it } from "vitest";

import probe from "./generated/phase-a-probe.v1.json";

describe("Phase A probe (BL-031)", () => {
  it("pins schema, status and governance class", () => {
    expect(probe.schemaVersion).toBe("harmonic-orrery.phase-a-probe.v1");
    expect(probe.probeId).toBe("BL031_PHASE_A_PROBE_v1");
    expect(probe.status).toBe("planning_evidence");
    expect(probe.probeFingerprint).toMatch(/^[0-9a-f]{64}$/);
  });

  it("passes the P0 verification gate with the grounded claims", () => {
    expect(probe.p0Verification.overall).toBe("PASS");
    const byId = new Map(probe.p0Verification.claims.map((claim) => [claim.id, claim]));
    expect([...byId.keys()]).toEqual([
      "M1-lift-arithmetic",
      "M2-freeness",
      "P1-rooting-check",
      "M3-seam-relation",
      "M4-minimal-patch",
    ]);
    for (const claim of probe.p0Verification.claims) {
      expect(claim.status).toBe("PASS");
    }
    const m1 = byId.get("M1-lift-arithmetic") as Record<string, unknown>;
    expect(m1.anchoredHeptatonic).toBe(462);
    expect(m1.anchoredPentatonic).toBe(330);
    expect(m1.heptatonicPairs).toBe(5544);
    expect(m1.pentatonicPairs).toBe(3960);
    expect(m1.totalPairs).toBe(9504);
    expect(m1.distinctConcreteSevenSets).toBe(792);
    expect(m1.distinctConcreteFiveSets).toBe(792);
    expect(m1.uniformMultiplicitySeven).toBe(7);
    expect(m1.uniformMultiplicityFive).toBe(5);
    const m2 = byId.get("M2-freeness") as Record<string, unknown>;
    expect(m2.counterexamples).toBe(0);
    const p1 = byId.get("P1-rooting-check") as Record<string, unknown>;
    expect(p1.rootingAmbiguity).toBe(false);
  });

  it("pins the phase coordinate spec", () => {
    expect(probe.p1PhaseCoordinate.representation.nodeIdConvention).toBe("{anchoredId}@{phase}");
    expect(probe.p1PhaseCoordinate.counts.liftedHeptatonic).toBe(5544);
    expect(probe.p1PhaseCoordinate.counts.liftedPentatonic).toBe(3960);
    expect(probe.p1PhaseCoordinate.counts.liftedTotal).toBe(9504);
    expect(probe.p1PhaseCoordinate.covering.multiplicitySeven).toBe(7);
    expect(probe.p1PhaseCoordinate.covering.multiplicityFive).toBe(5);
  });

  it("reproduces the admitted application universe exactly and passes the 40,824-check sweep", () => {
    expect(probe.p2Equivariance.calibration.verdict).toBe("EXACT");
    expect(probe.p2Equivariance.calibration.checked).toBe(3402);
    expect(probe.p2Equivariance.sweep.applicationUniverse).toEqual({ total: 3402, modal: 462, local: 2940 });
    expect(probe.p2Equivariance.sweep.checks).toBe(40824);
    expect(probe.p2Equivariance.sweep.failures).toBe(0);
    expect(probe.p2Equivariance.sweep.verdict).toBe("PASS");
    expect(probe.p2Equivariance.rootingDependenceFound).toBe(false);
    expect(probe.p2Equivariance.perOperator).toHaveLength(15);
    for (const row of probe.p2Equivariance.perOperator) {
      expect(row.verdict).toBe("PASS");
      expect(row.failures).toBe(0);
      expect(row.checks).toBe(row.applications * 12);
      expect(row.witnesses).toEqual([]);
    }
    const carryById = new Map(probe.p2Equivariance.perOperator.map((row) => [row.operatorId, row.phaseCarry]));
    expect(carryById.get("R1")).toBe(1);
    expect(carryById.get("L1")).toBe(-1);
    expect(carryById.get("M")).toBe(0);
    for (const operatorId of ["R2", "R3", "R4", "R5", "R6", "R7", "L2", "L3", "L4", "L5", "L6", "L7"]) {
      expect(carryById.get(operatorId)).toBe(0);
    }
  });

  it("reports the three strata with zero failures", () => {
    const strata = new Map(probe.p2Equivariance.strata.map((row) => [row.stratum, row]));
    expect([...strata.keys()].sort()).toEqual(["boundary-adjacent", "cornerstone", "interior"]);
    expect(strata.get("cornerstone")?.applications).toBe(1145);
    expect(strata.get("boundary-adjacent")?.applications).toBe(1990);
    expect(strata.get("interior")?.applications).toBe(267);
    for (const row of probe.p2Equivariance.strata) {
      expect(row.failures).toBe(0);
      expect(row.checks).toBe(row.applications * 12);
    }
    expect(probe.p2Equivariance.boundaryCase.cornerstoneParentUnion).toBe(81);
  });

  it("censes family A (operator-realized seams) with radius-one carries", () => {
    expect(probe.p3SeamCensus.familyA.applications).toBe(420);
    expect(probe.p3SeamCensus.familyA.intraFamily).toEqual({ total: 2, r1: 1, l1: 1 });
    expect(probe.p3SeamCensus.familyA.crossFamily.total).toBe(418);
    expect(probe.p3SeamCensus.familyA.liftedSeamEdges).toBe(5040);
    expect(probe.p3SeamCensus.familyA.anchoredCanonicalEdge.application).toBe("R1:2773:1387");
    expect(probe.p3SeamCensus.familyA.anchoredCanonicalEdge.inverse).toBe("L1:1387:2773");
    expect(probe.p3SeamCensus.histogram.familyALifted).toEqual({
      raised: { count: 2520, phaseDistance: 1 },
      lowered: { count: 2520, phaseDistance: -1 },
    });
  });

  it("censes family B (bridge-mediated seams) and reproduces the Andalusian ground truth", () => {
    expect(probe.p3SeamCensus.familyB.pairsWithSharedSubnodes).toBe(42);
    expect(probe.p3SeamCensus.familyB.crossings).toBe(90);
    expect(probe.p3SeamCensus.familyB.crossingHistogram).toEqual({ 1: 30, 5: 12 });
    expect(probe.p3SeamCensus.familyB.phaseDistance).toBe(0);
    const groundTruth = probe.p3SeamCensus.familyB.andalusianGroundTruth;
    expect(groundTruth.sharedSubnodes).toEqual(["5-20:0B", "5-23:0", "5-25:0", "5-27:0", "5-29:0B"]);
    expect(groundTruth.admittedBridges).toEqual(["5-23:0", "5-27:0"]);
  });

  it("confirms the mirror prediction and the phase distances of the modal readings", () => {
    const census = probe.p3SeamCensus.modalSeamCensus;
    expect(census.distinctDiatonicCollections).toBe(12);
    expect(census.representativesPerCollection).toBe(7);
    expect(census.adjacencyPairs).toBe(12);
    expect(census.canonicalReadings).toBe(12);
    expect(census.mirrorReadings).toBe(12);
    expect(census.mirrorPrediction).toBe("confirmed");
    expect(census.canonicalRealizationInventory).toContain("R1:2773:1387");
    expect(census.mirrorSamePhaseRealizationInventory.length).toBe(6);
    const canonical = census.readings.filter((reading) => reading.kind === "canonical");
    const mirror = census.readings.filter((reading) => reading.kind === "mirror");
    expect(canonical).toHaveLength(12);
    expect(mirror).toHaveLength(12);
    for (const reading of canonical) {
      expect(reading.modeTonicPhaseDistance).toBe(1);
      expect(reading.minimumRepresentativePhaseDistance).toBe(0);
      expect(reading.realizations.map((entry) => entry.operatorId).sort()).toEqual(["R1", "R2", "R3", "R4", "R5", "R6", "R7"]);
    }
    for (const reading of mirror) {
      expect(reading.modeTonicPhaseDistance).toBe(-1);
      expect(reading.minimumRepresentativePhaseDistance).toBe(0);
      expect(reading.realizations.map((entry) => entry.operatorId).sort()).toEqual(["L1", "L2", "L3", "L4", "L5", "L6", "L7"]);
    }
    expect(probe.p3SeamCensus.histogram.modalReadings).toEqual({ canonical: { 1: 12 }, mirror: { "-1": 12 } });
    expect(probe.p3SeamCensus.radiusOneVerdict).toBe("PASS");
  });

  it("pins the lift architecture spec", () => {
    expect(probe.p4LiftArchitecture.counts).toEqual({ liftedHeptatonic: 5544, liftedPentatonic: 3960, liftedTotal: 9504 });
    expect(probe.p4LiftArchitecture.containment.anchoredPairsPerDirection).toBe(6930);
    expect(probe.p4LiftArchitecture.containment.liftedPairsPerDirection).toBe(83160);
    expect(probe.p4LiftArchitecture.operatorEdges.verdict).toBe("PASS");
    expect(probe.p4LiftArchitecture.storage.status).toBe("planning_evidence");
  });

  it("states the boundary layer's fate per phase: the wall stands", () => {
    expect(probe.p5BoundaryLayer.modalClosure.anchoredCycles).toBe(66);
    expect(probe.p5BoundaryLayer.dTier).toMatchObject({
      anchors: 49,
      fixedDegreeAnchorToAnchor: 0,
      modalAnchorToAnchor: 49,
      dAnchorCycles: 7,
      liftedDAnchorCycles: 84,
      fixedDegreeIsolationPersists: true,
    });
    expect(probe.p5BoundaryLayer.dissolutionDisposition).toContain("Phase C");
  });

  it("pins the B/C/C# minimal patch and its fixtures", () => {
    expect(probe.p6MinimalPatch.phases).toEqual([11, 0, 1]);
    expect(probe.p6MinimalPatch.nodeCounts).toEqual({ heptatonic: 1386, pentatonic: 990, both: 2376 });
    expect(probe.p6MinimalPatch.sufficiency.verdict).toBe("PASS");
    expect(probe.p6MinimalPatch.sufficiency.noFourthPhaseNeeded).toBe(true);
    const relations = probe.p6MinimalPatch.fixtures.map((fixture) => `${fixture.kind}:${fixture.relation}`);
    expect(relations).toContain("canonical:C Lydian <-> C# Locrian");
    expect(relations).toContain("canonical:B Lydian <-> C Locrian");
    expect(probe.p6MinimalPatch.fixtures.every((fixture) => fixture.commonTones === 6)).toBe(true);
    expect(probe.p6MinimalPatch.fixtures.every((fixture) => Math.abs(fixture.modeTonicPhaseDistance) === 1)).toBe(true);
  });

  it("restates the fences and the explicit non-accomplishments", () => {
    expect(probe.fences.g1Intra330).toContain("no intra-330");
    expect(probe.fences.governsClaims).toContain("Phase C");
    expect(probe.fences.admission).toContain("planning evidence");
    expect(probe.notAccomplished).toHaveLength(5);
  });
});
