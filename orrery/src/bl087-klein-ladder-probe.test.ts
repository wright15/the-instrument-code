import { describe, expect, it } from "vitest";

import investigation from "./generated/bl087-klein-ladder-probe.v1.json";

describe("BL-087 Klein-4 <-> ladder probe — pinned", () => {
  it("pins the header, chain anchors, the pre-registration, and the sanity gate", () => {
    expect(investigation.schemaVersion).toBe("harmonic-orrery.bl087-klein-ladder-probe.v1");
    expect(investigation.investigationId).toBe("BL087_KLEIN_LADDER_PROBE_V1");
    expect(investigation.status).toBe("planning_evidence");
    expect(investigation.generator).toBe("scripts/build-bl087-klein-ladder-probe.mjs");
    expect(investigation.investigationFingerprint).toMatch(/^[0-9a-f]{64}$/);
    expect(investigation.base.bl075.investigationFingerprint).toBe(
      "88838e225276432427f2a7c765d8e1f9105c5c6bd87d4db04ef5e1bb2e93704e",
    );
    expect(investigation.base.bl076.investigationFingerprint).toBe(
      "81e6cf7211a94888c2adedeebc44674a6e4a78e5e8b3fc09bb7a8fd671569d1e",
    );
    expect(investigation.base.bl084.investigationFingerprint).toBe(
      "6865b0760c398dff857e3234b46cd8845647411f53bca3b502c6fbceb36d1a53",
    );
    expect(investigation.preRegistration.rulings.map((ruling) => ruling.id)).toEqual([
      "H2-criterion", "H1-H3-base", "ledger-absent-images", "landing-form",
    ]);
    expect(investigation.preRegistration.predictions.map((prediction) => prediction.id)).toEqual(["H1", "H2", "H3", "H4"]);
    expect(investigation.preRegistration.refutationConditions.map((condition) => condition.id)).toEqual(["a", "b", "c", "partial"]);
    expect(investigation.preRegistration.fenceNote).toContain("no leaning");
    expect(investigation.sanityGate.verdict).toBe("PASS");
    expect(investigation.sanityGate.checks.map((check) => check.pass)).toEqual([true, true, true]);
    expect(investigation.grounding.unlandedFlag.kleinMentionCount).toBe(0);
    expect(investigation.grounding.unlandedFlag.statement).toContain("unlanded session prose");
  });

  it("pins H1 REFUTED: the RHO-image of the A0 order is the exact reversal; the census stays consecutive (condition (a) fires)", () => {
    const h1 = investigation.hypotheses.H1;
    expect(h1.verdict).toBe("REFUTED");
    expect(h1.observed.imageEqualsReversal).toBe(true);
    expect(h1.observed.allConsecutive).toBe(true);
    expect(h1.observed.spanningCount).toBe(0);
    expect(h1.observed.permutation.form).toBe("reflection");
    expect(h1.observed.permutation.inversions).toBe(21);
    expect(h1.observed.permutation.parity).toBe("odd");
    expect(h1.observed.permutation.phiClass).toContain("phi-2-aligned");
    expect(h1.observed.permutation.wrapPairFixed).toBe(true);
    expect(h1.refutationConditionFired).toBe("a");
    const rhoOnA0 = investigation.matrix.rows.find((row) => row.id === "RHO-on-A0")!;
    expect(rhoOnA0.imageOrder).toEqual(["2773", "2741", "1717", "1709", "1453", "1451", "1387"]);
    expect(rhoOnA0.windowReport.compact.sizeHistogram).toEqual({ "1": 28, "2": 10 });
    expect(rhoOnA0.windowReport.compact.verdict).toBe("FULL");
  });

  it("pins H3 CONFIRMED: the T1-image of the A0 order is the landed D7 order; the D6 census is the FULL two-regime ladder", () => {
    const h3 = investigation.hypotheses.H3;
    expect(h3.verdict).toBe("CONFIRMED");
    expect(h3.observed.imageEqualsD7Order).toBe(true);
    expect(h3.subChecks).toEqual({ allConsecutive: true, twoRegime: true, mirror: true, profileExact: true });
    expect(h3.observed.census.sizeHistogram).toEqual({ "1": 2, "2": 2, "3": 10 });
    expect(h3.observed.census.perAnchorCounts).toEqual([4, 5, 6, 6, 6, 5, 4]);
    expect(h3.observed.census.verdict).toBe("FULL");
    expect(h3.observed.permutation).toBeNull();
  });

  it("pins H4 REFUTED: T2(A0) is the D7 reversed order (not the A0 reversal); the census is consecutive; ID preserves", () => {
    const h4 = investigation.hypotheses.H4;
    expect(h4.verdict).toBe("REFUTED");
    expect(h4.observed.t2IdentityPin).toBe(false);
    expect(h4.observed.t2Actual).toBe("the D7 reversed order");
    expect(h4.observed.t2Image).toEqual(["4033", "3971", "3847", "3599", "3103", "2111", "127"]);
    expect(h4.observed.t2Census.allConsecutive).toBe(true);
    expect(h4.observed.t2Census.verdict).toBe("FULL");
    expect(h4.observed.t2Census.mirror).toBe(true);
    expect(h4.observed.t2SpanningCount).toBe(0);
    expect(h4.observed.id.imageEqualsBase).toBe(true);
    expect(h4.observed.id.censusEqualsLanded).toBe(true);
    expect(h4.derivedOnPaper).toContain("55");
  });

  it("pins H2 REFUTED: no dihedral match against the A1 order for the RHO-images of the consecutive landed orders (condition (b) fires)", () => {
    const h2 = investigation.hypotheses.H2;
    expect(h2.verdict).toBe("REFUTED");
    expect(h2.refutationConditionFired).toBe("b");
    expect(h2.candidates).toEqual([
      { source: "A0", sourceIsConsecutive: true, imageOrder: ["2773", "2741", "1717", "1709", "1453", "1451", "1387"], imageFamily: "7-35", setEqual: false, dihedralMatch: false },
      { source: "D7", sourceIsConsecutive: true, imageOrder: ["4033", "3971", "3847", "3599", "3103", "2111", "127"], imageFamily: "7-1", setEqual: false, dihedralMatch: false },
    ]);
    expect(h2.contextTable).toHaveLength(8);
    expect(h2.contextTable.every((row) => row.setEqual === false && row.dihedralMatch === false)).toBe(true);
  });

  it("pins the RHO(A1) relocation diagnostic: the spanning moves from the closure-endpoint co-parents to the {2901,1749} co-parents", () => {
    const relocation = investigation.diagnostics.rhoA1Relocation;
    expect(relocation.baseSpanningWindows.map((window) => window.state)).toEqual(["1359", "1401"]);
    expect(relocation.baseSpanningWindows.every((window) => window.parents.join(",") === "1371,1389")).toBe(true);
    expect(relocation.spanningWindows.map((window) => window.state)).toEqual(["3669", "981"]);
    expect(relocation.spanningWindows.every((window) => window.parents.join(",") === "2901,1749")).toBe(true);
    expect(relocation.permutation.sourcePositionSequence).toEqual([3, 2, 1, 0, 6, 5, 4]);
    expect(relocation.permutation.form).toBe("reflection");
    expect(relocation.permutation.fixedIndex).toBe(5);
    expect(relocation.permutation.wrapPairFixed).toBe(false);
    expect(relocation.census.verdict).toBe("ABSENT");
    expect(relocation.census.sizeHistogram).toEqual({ "1": 28, "2": 10 });
    expect(relocation.closureEdge).toMatchObject({ a: "1389", b: "1371", hamming: 4, rotateInterval: 10 });
  });

  it("pins the cut-sensitivity diagnostic: the A0/D7 landed cuts are the unique consecutive cuts; the A1 landed cut is non-consecutive with cuts 1 and 3 consecutive", () => {
    const cuts = investigation.diagnostics.cutSensitivity;
    expect(cuts.A0.map((cut) => cut.allConsecutive)).toEqual([true, false, false, false, false, false, false]);
    expect(cuts.D7.map((cut) => cut.allConsecutive)).toEqual([true, false, false, false, false, false, false]);
    expect(cuts.A1.map((cut) => cut.allConsecutive)).toEqual([false, true, false, true, false, false, false]);
    expect(cuts.A1[0].verdict).toBe("ABSENT");
    expect(cuts.A1[1].verdict).toBe("PARTIAL");
    expect(cuts.A1[3].verdict).toBe("PARTIAL");
    expect(cuts.allWindowsCyclicIntervals).toEqual({ A0: true, D7: true, A1: true });
    expect(cuts.reading).toContain("jointly co-parented");
  });

  it("pins the extension rows and the D2-trio re-verification", () => {
    const extension = investigation.diagnostics.extensionRows;
    expect(extension.T1onA1.imageFamily).toBe("7-8");
    expect(extension.T1onA1.correspondingLayer).toBe("A2");
    expect(extension.T1onA1.census.verdict).toBe("PARTIAL");
    expect(extension.T1onA1.census.shapeClass).toBe("SINGLETON_PARTITION");
    expect(extension.T2onA1.census.verdict).toBe("PARTIAL");
    expect(investigation.diagnostics.d2Trio.allDual).toBe(true);
    expect(investigation.diagnostics.d2Trio.pairs.map((entry) => entry.dualPhenomenon)).toEqual([true, true, true]);
    expect(investigation.diagnostics.d2Trio.pairs.map((entry) => entry.pcSumDisplacement)).toEqual([6, 6, 6]);
  });

  it("pins the synthesis: the interpretation is refuted, the geometric fact stands, the fence is MAINTAINED", () => {
    const synthesis = investigation.synthesis;
    expect(synthesis.verdict).toBe("INTERPRETATION_REFUTED_GEOMETRIC_FACT_STANDS");
    expect(synthesis.perHypothesis).toEqual({ H1: "REFUTED", H2: "REFUTED", H3: "CONFIRMED", H4: "REFUTED" });
    expect(synthesis.refutationConditionsFired).toEqual({ a: true, b: true, c: false });
    expect(synthesis.fenceStatus).toContain("MAINTAINED");
    expect(synthesis.fenceStatus).toContain("PARTIAL_DERIVATION stands without it");
    expect(synthesis.disposition).toContain("closure-edge endpoints are co-parented");
    expect(synthesis.higherTheoremNote).toContain("no claim event");
  });

  it("pins the accounting, fences, citations, and bounded non-accomplishments", () => {
    expect(investigation.accounting.masksOnly.length).toBeGreaterThanOrEqual(4);
    expect(investigation.accounting.canonicalComputation.length).toBeGreaterThanOrEqual(4);
    expect(investigation.accounting.statement).toContain("no new measurement");
    expect(investigation.fences.noLeaning).toContain("refuted maintains");
    expect(investigation.fences.d7HypothesisTier).toContain("2703-2712");
    expect(investigation.fences.membrane).toContain("never a probe input");
    expect(investigation.fences.sessionProse).toContain("context, not evidence");
    expect(investigation.contractCitations.some((citation) => citation.includes("bl075-coordinate-search.v1.json"))).toBe(true);
    expect(investigation.contractCitations.some((citation) => citation.includes("bl-086-term-b-own-tier-memo.md"))).toBe(true);
    expect(investigation.notAccomplished).toHaveLength(7);
    expect(investigation.notAccomplished.some((item) => item.includes("no leaning"))).toBe(true);
    expect(investigation.notAccomplished.some((item) => item.includes("no claim event"))).toBe(true);
  });
});
