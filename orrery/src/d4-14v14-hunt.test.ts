import { describe, expect, it } from "vitest";

import hunt from "./generated/d4-14v14-hunt.v1.json";

describe("D4 14-vs-14 structural hunt (BL-060) — axes, boundary signature, synthesis", () => {
  it("pins schema, status, governance class, fingerprint and the BL-055 import", () => {
    expect(hunt.schemaVersion).toBe("harmonic-orrery.d4-14v14-hunt.v1");
    expect(hunt.huntId).toBe("BL060_D4_14V14_HUNT_v1");
    expect(hunt.status).toBe("planning_evidence");
    expect(hunt.generator).toBe("scripts/build-d4-14v14-hunt.mjs");
    expect(hunt.huntFingerprint).toMatch(/^[0-9a-f]{64}$/);
    expect(hunt.sourceBindings).toHaveLength(8);
    expect(hunt.sourceBindings.every((binding) => /^[0-9a-f]{64}$/.test(binding.sha256))).toBe(true);
    expect(hunt.base.artifact).toBe("orrery/src/generated/d4-selection-review.v1.json");
    expect(hunt.base.fingerprint).toBe("6d11fd932efbe96892b3cf2e6a6cdad6f54e69cd2a8f284ebb72232c59d8b745");
    expect(hunt.base.domainKeys).toBe(28);
    expect(hunt.base.observedKeys).toBe(14);
    expect(hunt.base.predicate).toBe("P(s) = [forte(s) = 7-27]");
  });

  it("pins the IV-delta recomputation from ledger bytes (OD-60-1)", () => {
    expect(hunt.ivDelta.observedVector).toBe("3,4,4,4,5,1");
    expect(hunt.ivDelta.unobservedVector).toBe("3,3,6,3,3,3");
    expect(hunt.ivDelta.signedObservedMinusUnobserved).toEqual([0, 1, -2, 1, 2, -2]);
    expect(hunt.ivDelta.absolute).toEqual([0, 1, 2, 1, 2, 2]);
    expect(hunt.ivDelta.equalICs).toEqual(["IC1"]);
    expect(hunt.ivDelta.briefStringDropped).toBe("<010120>");
    expect(hunt.ivDelta.briefStringStatus).toContain("OD-60-1");
  });

  it("pins the extended 28-key table: new columns populated for every key", () => {
    expect(hunt.table28).toHaveLength(28);
    for (const row of hunt.table28) {
      expect(row.base.forte === "7-27" || row.base.forte === "7-31").toBe(true);
      expect(row.complement.setClass === "5-27" || row.complement.setClass === "5-31").toBe(true);
      expect(row.complement.admitted).toBe(row.base.forte === "7-27");
      expect(row.symmetry.chirality).toBe("chiral");
      expect(row.symmetry.zPartner).toBeNull();
      expect(row.symmetry.inversionSymmetric).toBe(false);
      expect(Object.keys(row.dTier.counts)).toHaveLength(7);
      expect(row.dTier.nonZSum).toBe(row.dTier.counts["7-1"] + row.dTier.counts["7-15"] + row.dTier.counts["7-22"] + row.dTier.counts["7-8"]);
      expect(["T1", "T2"]).toContain(row.cycle.edgeType);
      expect(typeof row.governor).toBe("string");
    }
    const observed = hunt.table28.filter((row) => row.observed);
    expect(observed.map((row) => row.dTier.nonZSum).every((value) => value <= 13)).toBe(true);
    const unobserved = hunt.table28.filter((row) => !row.observed);
    expect(unobserved.map((row) => row.dTier.nonZSum).every((value) => value >= 14)).toBe(true);
  });

  it("pins the seven axis verdicts with confusion matrices and split classes", () => {
    expect(hunt.axisSummary.tested).toBe(7);
    const byAxis = new Map(hunt.axes.map((axis) => [axis.axis, axis]));
    expect(byAxis.get("ivDelta")?.confusion).toEqual({ tp: 14, fp: 0, fn: 0, tn: 14 });
    expect(byAxis.get("ivDelta")?.axisClass).toBe("RESTATEMENT");
    expect(byAxis.get("dTierContainmentComposite")?.confusion).toEqual({ tp: 14, fp: 0, fn: 0, tn: 14 });
    expect(byAxis.get("dTierContainmentComposite")?.axisClass).toBe("INDEPENDENT_STRUCTURAL_SIGNATURE");
    expect(byAxis.get("dTierContainmentComposite")?.rule).toBe("nonZSum(s) <= 13");
    expect(byAxis.get("bridgeAdmissionLink")?.confusion).toEqual({ tp: 14, fp: 0, fn: 0, tn: 14 });
    expect(byAxis.get("bridgeAdmissionLink")?.axisClass).toBe("RESTATEMENT");
    expect(byAxis.get("complementSymmetry")?.axisClass).toBe("NON_SEPARATING");
    expect(byAxis.get("complementSymmetry")?.hit).toBe(14);
    expect(byAxis.get("cyclePosition")?.confusion).toEqual({ tp: 4, fp: 4, fn: 10, tn: 10 });
    expect(byAxis.get("governorElement")?.confusion).toEqual({ tp: 8, fp: 8, fn: 6, tn: 6 });
    expect(byAxis.get("entry13Interaction")?.confusion).toEqual({ tp: 8, fp: 8, fn: 6, tn: 6 });
  });

  it("pins the per-family D-tier breakdown and the composite boundary gap", () => {
    expect(hunt.dTier.perFamily).toHaveLength(7);
    const byFamily = new Map(hunt.dTier.perFamily.map((entry) => [entry.family, entry]));
    expect(byFamily.get("7-Z17")?.best.confusion).toEqual({ tp: 12, fp: 0, fn: 2, tn: 14 });
    expect(byFamily.get("7-Z37")?.best.confusion).toEqual({ tp: 12, fp: 0, fn: 2, tn: 14 });
    expect(byFamily.get("7-8")?.best.confusion).toEqual({ tp: 14, fp: 2, fn: 0, tn: 12 });
    expect(byFamily.get("7-22")?.best.confusion).toEqual({ tp: 14, fp: 2, fn: 0, tn: 12 });
    expect(byFamily.get("7-1")?.verdict).toBe("FAIL");
    expect(byFamily.get("7-Z12")?.verdict).toBe("FAIL");
    expect(hunt.dTier.nonZComposite.confusion).toEqual({ tp: 14, fp: 0, fn: 0, tn: 14 });
    expect(hunt.dTier.nonZComposite.boundaryGap).toEqual({ maxObserved: 13, minUnobserved: 14 });
    expect(hunt.dTier.zComposite.confusion).toEqual({ tp: 12, fp: 0, fn: 2, tn: 14 });
    expect(hunt.dTier.perFamily.filter((entry) => entry.nearMiss).map((entry) => entry.family)).toEqual(
      ["7-22", "7-8", "7-Z17", "7-Z37"],
    );
  });

  it("pins the office lemma: every office contributes 2 observed and 2 unobserved keys", () => {
    expect(hunt.officeLemma.perOffice).toHaveLength(7);
    for (const block of hunt.officeLemma.perOffice) {
      expect(block.observedClass).toBe(2);
      expect(block.unobservedClass).toBe(2);
    }
    expect(hunt.officeLemma.statement).toContain("office-transverse");
    for (const matrix of Object.values(hunt.officeLemma.matrices)) {
      expect(matrix.tp).toBe(matrix.fp);
      expect(matrix.fn).toBe(matrix.tn);
      expect(matrix.tp + matrix.tn).toBe(14);
    }
  });

  it("pins the bridge adjudication under the OD-60-2 restatement guard", () => {
    expect(hunt.bridgeAdjudication.complementClasses).toEqual({ observed: "5-27", unobserved: "5-31" });
    expect(hunt.bridgeAdjudication.admittedBridges).toEqual(["5-23", "5-27"]);
    expect(hunt.bridgeAdjudication.observedComplementAdmitted).toBe(true);
    expect(hunt.bridgeAdjudication.unobservedComplementAdmitted).toBe(false);
    expect(hunt.bridgeAdjudication.classification).toBe("RESTATEMENT");
    expect(hunt.bridgeAdjudication.guard).toBe("OD-60-2 (restatement-vs-explanation)");
    expect(hunt.bridgeAdjudication.canonAsymmetry.observedComplement.rootedPairs).toBe(1);
    expect(hunt.bridgeAdjudication.canonAsymmetry.unobservedComplement.rootedPairs).toBe(0);
    expect(hunt.bridgeAdjudication.representativeProbe.keys).toEqual(["3:731", "5:695"]);
    expect(hunt.bridgeAdjudication.representativeProbe.confusion).toEqual({ tp: 1, fp: 1, fn: 13, tn: 13 });
    expect(hunt.bridgeAdjudication.representativeProbe.hit).toBe(14);
  });

  it("pins the synthesis: DERIVED on the boundary-geography signature", () => {
    expect(hunt.synthesis.verdict).toBe("DERIVED");
    expect(hunt.synthesis.basis.axis).toBe("dTierContainmentComposite");
    expect(hunt.synthesis.basis.confusion).toEqual({ tp: 14, fp: 0, fn: 0, tn: 14 });
    expect(hunt.synthesis.basis.boundaryGap).toEqual({ maxObserved: 13, minUnobserved: 14 });
    expect(hunt.synthesis.cleanSplits.map((entry) => `${entry.axis}:${entry.class}`)).toEqual([
      "ivDelta:RESTATEMENT",
      "dTierContainmentComposite:INDEPENDENT_STRUCTURAL_SIGNATURE",
      "bridgeAdmissionLink:RESTATEMENT",
    ]);
    expect(hunt.synthesis.nearMisses).toHaveLength(4);
    expect(hunt.synthesis.primitiveAlternative.fired).toBe(false);
    expect(hunt.synthesis.governsSemanticLayerEntry.id).toBe("GSL-1");
    expect(hunt.synthesis.governsSemanticLayerEntry.statement).toContain("boundary-geography-selective");
    expect(hunt.synthesis.scopingMemoConnection).toContain("BL-059");
    expect(hunt.synthesis.limits).toHaveLength(3);
  });

  it("carries the binding fences and bounded non-accomplishments", () => {
    expect(hunt.fences.d7Control).toContain("OD-60-D7");
    expect(hunt.fences.higherTheorem).toContain("remains open");
    expect(hunt.fences.g1Intra330).toBe("untouched");
    expect(hunt.fences.direction).toContain("unassigned");
    expect(hunt.fences.membrane).toContain("never design input");
    expect(hunt.fences.entry13).toContain("OD-60-3");
    expect(hunt.contractCitations.some((citation) => citation.includes("ENTRY 15"))).toBe(true);
    expect(hunt.notAccomplished).toHaveLength(6);
  });
});
