import { describe, expect, it } from "vitest";

import probe from "./generated/phase-c-probe.v1.json";

describe("Phase C probe (BL-033) — boundary-govern derivation retry", () => {
  it("pins schema, status and governance class", () => {
    expect(probe.schemaVersion).toBe("harmonic-orrery.phase-c-probe.v1");
    expect(probe.probeId).toBe("BL033_PHASE_C_PROBE_v1");
    expect(probe.status).toBe("planning_evidence");
    expect(probe.probeFingerprint).toMatch(/^[0-9a-f]{64}$/);
    expect(probe.generator).toBe("scripts/build-phase-c-probe.mjs");
  });

  it("passes the E1 boundary-representation gate", () => {
    expect(probe.e1Presence.verdict).toBe("PRESENT");
    expect(probe.e1Presence.gatesE2).toBe(true);
    expect(probe.e1Presence.anchors).toHaveLength(7);
    for (const anchor of probe.e1Presence.anchors) {
      expect(anchor.phases["11"]).toBeTruthy();
      expect(anchor.phases["0"]).toBeTruthy();
      expect(anchor.phases["1"]).toBeTruthy();
      expect(anchor.seamIncidenceTotal).toBeGreaterThanOrEqual(1);
    }
  });

  it("calibrates: the same-phase lift reproduces OBS-023 exactly at every patch phase", () => {
    expect(probe.e2Retry.calibration.verdict).toBe("EXACT");
    expect(probe.e2Retry.calibration.perPhase).toHaveLength(3);
    for (const entry of probe.e2Retry.calibration.perPhase) {
      expect(entry.identicalToFrozen).toBe(true);
      expect(entry.routeA).toMatchObject({ generatedKeyCount: 8, inRButUnmatchedCount: 4, restatementSignature: false });
      expect(entry.routeB).toMatchObject({ generatedKeyCount: 28, inRButUnmatchedCount: 14, restatementSignature: true });
      expect(entry.fourCellCounts).toEqual({ aOnly: 0, bOnly: 10, both: 4, neither: 0 });
    }
  });

  it("derives the seam keying: all seven offices qualify and G_A collapses to U", () => {
    const seam = probe.e2Retry.routeASeam;
    expect(seam.qualifyingOffices).toEqual(["0", "1", "2", "3", "4", "5", "6"]);
    expect(seam.seamPairs).toHaveLength(9);
    expect(seam.accounting).toMatchObject({
      generatedKeyCount: 28,
      restatementSignature: true,
      matchedObservedCount: 14,
      missedObservedCount: 0,
      inRButUnmatchedCount: 14,
      extraBeyondRCount: 0,
    });
    expect(seam.generatedKeys).toEqual(probe.e2Retry.domain.uKeys);
  });

  it("applies the frozen contract: restatement_signature, expectation not held", () => {
    const { contract, preRegisteredExpectation } = probe.e2Retry;
    expect(contract.category).toBe("restatement_signature");
    expect(contract.covered).toBe(true);
    expect(contract.restatementSignature).toBe(true);
    expect(contract.midpointExact).toBe(false);
    expect(contract.fourCellCounts).toEqual({ aOnly: 0, bOnly: 0, both: 14, neither: 0 });
    expect(preRegisteredExpectation.held).toBe(false);
    expect(preRegisteredExpectation.measured).toMatchObject({ inRButUnmatchedA: 14, bOnlyCell: 0, gAEqualsU: true });
  });

  it("reports the strict-degree control as the frozen failure exactly", () => {
    const control = probe.e2Retry.routeASeam.strictDegreeControl;
    expect(control.qualifyingOffices).toEqual(["0", "6"]);
    expect(control.generatedKeys).toEqual([
      "0:1243", "0:1339", "0:1627", "0:2395", "6:2893", "6:2899", "6:2917", "6:2965",
    ]);
    expect(control.accounting).toMatchObject({ generatedKeyCount: 8, inRButUnmatchedCount: 4, missedObservedCount: 10 });
    expect(control.category).toBe("not_derived");
  });

  it("censes T-C at the seam: strict exact at anchored degree, overshoot under the free-context keying", () => {
    const seam = probe.e2Retry.routeC.seam;
    expect(seam.observedRelations).toEqual(["A0:1387:2741:0", "A0:1451:2773:6"]);
    expect(seam.generatedRelations).toHaveLength(7);
    expect(seam.extra).toEqual([
      "A0:1387:1453:5", "A0:1451:1709:4", "A0:1453:1717:3", "A0:1709:2741:2", "A0:1717:2773:1",
    ]);
    expect(seam.missing).toEqual([]);
    expect(seam.midpointExactStrict).toBe(false);
    expect(seam.realizationOfObserved).toBe(true);
    expect(seam.strictDegree.midpointExact).toBe(true);
  });

  it("mirrors D4 for D7 with an audited hypothesis-analogue grant", () => {
    const e3 = probe.e3D7Pairing;
    expect(e3.label).toBe("hypothesis-analogue");
    expect(e3.construction.rEdges).toBe(14);
    expect(e3.construction.modalOrbit).toHaveLength(7);
    expect(e3.construction.eEdges).toBe(0);
    expect(e3.construction.seamProvenance).toBe(0);
    expect(e3.anchoredRoute).toMatchObject({ kernelPairs: 6, generatedKeyCount: 12, missedObservedCount: 2 });
    expect(e3.seamRoute.qualifyingOffices).toEqual(["0", "1", "2", "4", "5", "6"]);
    expect(e3.seamRoute.outcome).toBe("not_derived@seam-analogue");
    expect(e3.tC.observedSeamDomain).toBe(0);
    expect(e3.tC.contractClause).toBe("incomplete_or_anomalous");
    expect(e3.symmetry.d7Tier).toContain("no D7 verdict");
  });

  it("re-tests the wall at all twelve phases with no change", () => {
    const e4 = probe.e4WallCensus;
    expect(e4.phases).toHaveLength(12);
    expect(e4.fixedDegreeDD.verdict).toBe("NO_CHANGE");
    expect(e4.fixedDegreeDD.failLoud).toBe(false);
    expect(e4.fixedDegreeDD.perPhase.every((row) => row.fixedDegreeDD === 0)).toBe(true);
    expect(e4.modalDD).toMatchObject({ anchored: 49, lifted: 588 });
    expect(e4.familyAIncidence).toMatchObject({ anchored: 76, lifted: 912 });
    expect(e4.dissolutionDetected).toBe(false);
  });

  it("carries the binding fences and the bounded non-accomplishments", () => {
    expect(probe.fences.governsVerdicts).toContain("none");
    expect(probe.fences.recordAmendment).toContain("claim event");
    expect(probe.fences.direction).toContain("unassigned");
    expect(probe.fences.membrane).toContain("never design input");
    expect(probe.notAccomplished).toHaveLength(6);
  });
});
