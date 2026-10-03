import { describe, expect, it } from "vitest";

import probe from "./generated/d-tier-operator-probe.v1.json";

const A_FAMILIES = ["7-35", "7-34", "7-33"];

describe("D-tier operator probe (BL-029)", () => {
  it("pins the D-anchor scope and the 21-anchor A-control", () => {
    expect(probe.schemaVersion).toBe("harmonic-orrery.d-tier-operator-probe.v1");
    expect(probe.probeId).toBe("D_TIER_OPERATOR_PROBE_v1");
    expect(probe.status).toBe("planning_evidence");
    expect(probe.scope.dAnchors.count).toBe(49);
    expect(probe.scope.aControlAnchors.count).toBe(21);
    expect(probe.scope.overlap).toBe(0);
  });

  it("reproduces the A-control exactly (60 moves / 12 operators / 21x21 coverage)", () => {
    expect(probe.fixedDegreeShift.aControl.total).toBe(60);
    expect(probe.fixedDegreeShift.aControl.operatorCount).toBe(12);
    expect(probe.fixedDegreeShift.aControl.sourceCoverage).toBe(21);
    expect(probe.fixedDegreeShift.aControl.targetCoverage).toBe(21);
    expect(probe.fixedDegreeShift.aControl.catalogMatch).toBe(true);
    expect(probe.fixedDegreeShift.aControl.byOperator).toHaveLength(12);
    expect(probe.fixedDegreeShift.aControl.byOperator.every((entry) => entry.count === 5)).toBe(true);
  });

  it("records zero fixed-degree anchor-to-anchor D applications", () => {
    expect(probe.fixedDegreeShift.dToD.total).toBe(0);
    expect(probe.fixedDegreeShift.dToD.byTierPair).toEqual([]);
    expect(probe.fixedDegreeShift.dToD.byOperator).toHaveLength(12);
    expect(probe.fixedDegreeShift.dToD.byOperator.every((entry) => entry.count === 0)).toBe(true);
    expect(probe.fixedDegreeShift.dToA.total).toBe(0);
    expect(probe.fixedDegreeShift.aToD.total).toBe(0);
  });

  it("records satellite-only D-anchor fixed-degree touches", () => {
    expect(probe.fixedDegreeShift.dTouches.outTotal).toBe(228);
    expect(probe.fixedDegreeShift.dTouches.outToAnchor).toBe(0);
    expect(probe.fixedDegreeShift.dTouches.outToSatellite).toBe(228);
    expect(probe.fixedDegreeShift.dTouches.outToBoundary).toBe(0);
    expect(probe.fixedDegreeShift.dTouches.inFromSatellite).toBe(228);
    expect(probe.fixedDegreeShift.dTouches.outTargetSetClasses.every((entry) => !A_FAMILIES.includes(entry.name))).toBe(true);
    expect(probe.perAnchor).toHaveLength(49);
    expect(
      probe.perAnchor.every(
        (record) =>
          record.fixedDegreeOutToAnchor === 0 &&
          record.fixedDegreeInFromAnchor === 0 &&
          record.modalSuccessorOut === 1 &&
          record.modalSuccessorIn === 1,
      ),
    ).toBe(true);
  });

  it("records the tier-preserving modal closure", () => {
    expect(probe.modalClosure.dToD.total).toBe(49);
    expect(probe.modalClosure.dToD.cycleCount).toBe(7);
    expect(probe.modalClosure.dToD.cycles).toHaveLength(7);
    expect(probe.modalClosure.dToD.cycles.every((cycle) => cycle.length === 7)).toBe(true);
    expect(probe.modalClosure.dToD.tierPreserved).toBe(true);
    expect(probe.modalClosure.dToD.fortePreserved).toBe(true);
    expect(probe.modalClosure.dToD.qMultisetPreserved).toBe(true);
    expect(probe.modalClosure.aToA.cycleCount).toBe(3);
    expect(probe.modalClosure.intoDAnchorsFromNonAnchors).toBe(0);
  });

  it("passes every pre-registered discriminant assertion", () => {
    expect(probe.discriminantCheck.verdict).toBe("PASS");
    expect(probe.discriminantCheck.evaluatedEdges).toBe(49);
    expect(probe.discriminantCheck.assertions.map((entry) => entry.id)).toEqual([
      "tier-preservation",
      "family-preservation",
      "twin-separation",
      "zpartner-separation",
      "q-multiset-preservation",
    ]);
    expect(
      probe.discriminantCheck.assertions.every(
        (entry) => entry.verdict === "PASS" && entry.failures.length === 0,
      ),
    ).toBe(true);
  });

  it("records satellite-mediated boundary adjacency and the single-phase verdict", () => {
    expect(probe.boundaryMediation.dToSatelliteToD.pairCount).toBe(40);
    expect(probe.boundaryMediation.dToSatelliteToA.pairCount).toBe(40);
    expect(probe.boundaryMediation.aToSatelliteToD.pairCount).toBe(40);
    expect(probe.phaseEntanglement.detected).toBe(false);
    expect(probe.phaseEntanglement.topologyMotivation).toBeNull();
  });

  it("keeps the row-2 projection decision evidence-based", () => {
    expect(probe.classificationInputs.row2Projection.aControlEdges).toBe(60);
    expect(probe.classificationInputs.row2Projection.dAnchorEdges).toBe(0);
    expect(probe.classificationInputs.row2Projection.dAnchorProjectionAvailable).toBe(false);
    expect(probe.classificationInputs.anchorClosure.fixedDegree).toEqual({ a: true, d: false });
    expect(probe.classificationInputs.anchorClosure.modal).toEqual({ a: true, d: true });
  });

  it("carries a 64-hex source-bound fingerprint", () => {
    expect(probe.probeFingerprint).toMatch(/^[a-f0-9]{64}$/);
    expect(probe.sourceBindings).toHaveLength(6);
    expect(probe.sourceBindings.every((binding) => /^[a-f0-9]{64}$/.test(binding.sha256))).toBe(true);
  });
});
