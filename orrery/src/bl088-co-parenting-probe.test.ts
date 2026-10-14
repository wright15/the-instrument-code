import { describe, expect, it } from "vitest";

import investigation from "./generated/bl088-co-parenting-probe.v1.json";

describe("BL-088 co-parenting generalization probe — pinned", () => {
  it("pins the header, chain anchors, the pre-registration, and the calibration gates", () => {
    expect(investigation.schemaVersion).toBe("harmonic-orrery.bl088-co-parenting-probe.v1");
    expect(investigation.investigationId).toBe("BL088_CO_PARENTING_PROBE_V1");
    expect(investigation.status).toBe("planning_evidence");
    expect(investigation.generator).toBe("scripts/build-bl088-co-parenting-probe.mjs");
    expect(investigation.investigationFingerprint).toMatch(/^[0-9a-f]{64}$/);
    expect(investigation.base.bipartite.sha256).toBe(
      "903eebf0e1122d8ba81971abcd7efc8ac934d3bfd7885b98b49e58ab0bbe3e41",
    );
    expect(investigation.base.chainFingerprints.bl084).toBe(
      "6865b0760c398dff857e3234b46cd8845647411f53bca3b502c6fbceb36d1a53",
    );
    expect(investigation.base.chainFingerprints.bl087).toBe(
      "ad74a7e61769b777d5ba52835d3d95c1aeb0427b442f68397a4fe60de6eb2bb1",
    );
    expect(investigation.preRegistration.rulings.map((ruling) => ruling.id)).toEqual([
      "OD-CP-1", "OD-CP-2", "OD-CP-3", "OD-CP-4",
    ]);
    expect(investigation.preRegistration.gates.map((gate) => gate.id)).toEqual(["V-CP-1", "V-CP-2", "V-CP-3"]);
    expect(investigation.preRegistration.groundingCorrections.map((entry) => entry.id)).toEqual(["GC-1", "GC-2", "GC-3"]);
    expect(investigation.preRegistration.decisionRule.exactRow).toContain("reductionExact");
    expect(investigation.grounding.calibration.scopeB).toEqual({ cycles: 10, layers: 57, status: "EXACT" });
    expect(investigation.grounding.calibration.scopeC).toEqual({ rows: 476, status: "EXACT" });
    expect(investigation.grounding.calibration.d1Anchor).toBe("EXACT");
    expect(investigation.grounding.receipt).toHaveLength(6);
  });

  it("pins the containment censuses: both directions, >=2 primary, >=1/>=3 sensitivity, the overlap-only histograms", () => {
    const p = investigation.containment.pSide;
    const h = investigation.containment.hSide;
    expect(p.universe).toBe(330);
    expect(p.arity).toBe(21);
    expect(p.pairCount).toBe(54285);
    expect(p.thresholds).toEqual({ ge1: 25410, ge2: 4620, ge3: 4620 });
    expect(p.overlapHistogram).toEqual({ "0": 28875, "1": 20790, "6": 4620 });
    expect(p.pairs).toHaveLength(4620);
    expect(p.pairs.every(([, , overlap]) => overlap === 6)).toBe(true);
    expect(h.universe).toBe(462);
    expect(h.arity).toBe(15);
    expect(h.pairCount).toBe(106491);
    expect(h.thresholds).toEqual({ ge1: 41580, ge2: 6930, ge3: 6930 });
    expect(h.overlapHistogram).toEqual({ "0": 64911, "1": 34650, "5": 6930 });
    expect(h.pairs).toHaveLength(6930);
    expect(h.pairs.every(([, , overlap]) => overlap === 5)).toBe(true);
    expect(h.identity).toContain("Hamming-2");
  });

  it("pins V-CP-1: the D1 anchor — 1359/1401 co-parented by 1371/1389, the wrap cut pair-witnessed, rho relocates to 3669/981", () => {
    const d1 = investigation.correspondence.eB.d1Anchor;
    expect(d1.cycle).toBe("A1");
    expect(d1.layer).toBe("A2");
    expect(d1.pair).toEqual(["1359", "1401"]);
    expect(d1.shared).toEqual(["1371", "1389"]);
    expect(d1.strict).toBe(true);
    expect(d1.fertile).toBe(true);
    expect(d1.wrapCut).toEqual({ k: 6, pair: ["1389", "1371"], exactStates: ["1359", "1401"] });
    const a1 = investigation.spanning.scopeB.find((row) => row.cycleTier === "A1" && row.layerTier === "A2")!;
    const spanning = a1.windows.filter((window) => !window.consecutive);
    expect(spanning.map((window) => window.state)).toEqual(["1359", "1401"]);
    expect(spanning.every((window) => window.parents.join(",") === "1371,1389")).toBe(true);
    expect(spanning.every((window) => window.indices.join(",") === "0,6")).toBe(true);
    const d1Pair = a1.pairs.list.find((pair) => pair.a === "1359" && pair.b === "1401")!;
    expect(d1Pair.shared).toEqual(["1371", "1389"]);
    expect(d1Pair.adjacentCuts).toEqual([6]);
    expect(investigation.grounding.receipt.some((entry) => entry.claim.includes("3669/981"))).toBe(true);
  });

  it("pins GC-1: the D1 pair is reach-co-parented, not containment-co-parented (exactly one shared subnode)", () => {
    expect(investigation.preRegistration.groundingCorrections[0].text).toContain("5-34:6");
    expect(investigation.preRegistration.groundingCorrections[0].text).toContain("reach-co-parented");
  });

  it("pins the D2 dual-phenomenon trio context: all three pairs dual; the D2 cycle is the non-cyclic fault locus", () => {
    const trio = investigation.context.d2Trio;
    expect(trio.pairs.map((entry) => entry.dual)).toEqual([true, true, true]);
    expect(trio.pairs.map((entry) => entry.pcSumDisplacement)).toEqual([6, 6, 6]);
    expect(trio.pairs.every((entry) => entry.tiers.join(",") === "D2,D2")).toBe(true);
    expect(trio.d2FaultRows).toEqual({ d2xD2NonCyclic: 12, d2xA2NonCyclic: 10 });
  });

  it("pins the Scope B exact censuses: D7xD6, A0xA1, A1xA2 are exact; A0xA0 carries the two single-witness cuts", () => {
    const d7 = investigation.spanning.scopeB.find((row) => row.cycleTier === "D7" && row.layerTier === "D6")!;
    expect(d7.classification).toMatchObject({ primary: "EXACT", spanning: 6, pairProduced: 6, reductionExact: true });
    expect(d7.pairs).toMatchObject({ count: 25, fertile: 25, infertile: 0, strict: 20 });
    const a0a1 = investigation.spanning.scopeB.find((row) => row.cycleTier === "A0" && row.layerTier === "A1")!;
    expect(a0a1.classification.primary).toBe("EXACT");
    expect(a0a1.classification.spanning).toBe(6);
    expect(a0a1.pairs.count).toBe(6);
    const a1 = investigation.spanning.scopeB.find((row) => row.cycleTier === "A1" && row.layerTier === "A2")!;
    expect(a1.classification).toMatchObject({ primary: "EXACT", spanning: 5, pairProduced: 5 });
    expect(a1.pairs.count).toBe(5);
    expect(a1.pairs.strict).toBe(5);
    const a0a0 = investigation.spanning.scopeB.find((row) => row.cycleTier === "A0" && row.layerTier === "A0")!;
    expect(a0a0.classification.primary).toBe("PARTIAL_SINGLE_WITNESS");
    expect(a0a0.classification.singleWitnessCuts).toEqual([1, 4]);
    expect(a0a0.classification.spanning).toBe(6);
    expect(a0a0.classification.pairProduced).toBe(4);
  });

  it("pins the Scope B fault censuses: D2xD2 and A2xA2 carry non-cyclic windows; the non-cyclic rows span every cut", () => {
    const d2 = investigation.spanning.scopeB.find((row) => row.cycleTier === "D2" && row.layerTier === "D2")!;
    expect(d2.classification.primary).toBe("FAULT_NON_CYCLIC");
    expect(d2.classification.spanning).toBe(7);
    expect(d2.classification.reductionExact).toBe(false);
    expect(d2.nonCyclicWindows).toHaveLength(12);
    expect(d2.pairs).toMatchObject({ count: 18, fertile: 0, infertile: 18 });
    const a2a2 = investigation.spanning.scopeB.find((row) => row.cycleTier === "A2" && row.layerTier === "A2")!;
    expect(a2a2.classification.primary).toBe("FAULT_NON_CYCLIC");
    expect(a2a2.nonCyclicWindows).toHaveLength(22);
    expect(a2a2.pairs).toMatchObject({ count: 20, fertile: 3, infertile: 17 });
  });

  it("pins the pentatonic-layer boundary censuses: D7/A0/A2 exact with 60/60/10 strict pairs; A1 single-witness; D2 non-cyclic", () => {
    const pentB = investigation.spanning.pentatonic.scopeB;
    const d7 = pentB.find((row) => row.cycleTier === "D7")!;
    expect(d7.classification).toMatchObject({ primary: "EXACT", spanning: 6, pairProduced: 6 });
    expect(d7.pairs).toMatchObject({ count: 60, fertile: 60, strict: 60 });
    const a0 = pentB.find((row) => row.cycleTier === "A0")!;
    expect(a0.classification.primary).toBe("EXACT");
    expect(a0.pairs.count).toBe(60);
    const a2 = pentB.find((row) => row.cycleTier === "A2")!;
    expect(a2.classification).toMatchObject({ primary: "EXACT", spanning: 5, pairProduced: 5 });
    expect(a2.pairs.count).toBe(10);
    const a1 = pentB.find((row) => row.cycleTier === "A1")!;
    expect(a1.classification.primary).toBe("PARTIAL_SINGLE_WITNESS");
    expect(a1.classification.singleWitnessCuts).toHaveLength(5);
    expect(a1.pairs.count).toBe(0);
    const d2 = pentB.find((row) => row.cycleTier === "D2")!;
    expect(d2.classification.primary).toBe("FAULT_NON_CYCLIC");
    expect(d2.nonCyclicWindows).toHaveLength(15);
  });

  it("pins the Scope C census scale and the correspondence aggregates", () => {
    expect(investigation.spanning.scopeC).toHaveLength(488);
    expect(investigation.spanning.pentatonic.scopeC).toHaveLength(476);
    const eA = investigation.correspondence.eA.populations;
    expect(eA.scopeB_H).toMatchObject({ spanningRows: 9, reductionExact: 4, faults: 5, nonCyclicRows: 5, fullRangeRows: 0 });
    expect(eA.scopeC_H).toMatchObject({ spanningRows: 488, reductionExact: 72, faults: 416, nonCyclicRows: 406, fullRangeRows: 10 });
    expect(eA.scopeB_PENT).toMatchObject({ spanningRows: 9, reductionExact: 4, faults: 5 });
    expect(eA.scopeC_PENT).toMatchObject({ spanningRows: 476, reductionExact: 0, faults: 476, nonCyclicRows: 456, fullRangeRows: 20 });
    const eB = investigation.correspondence.eB.populations;
    expect(eB.scopeB_H).toMatchObject({ pairBijectionRows: 8, singleWitnessRows: 1, allFertileRows: 4, infertilePairRows: 5 });
    expect(eB.scopeC_H).toMatchObject({ pairBijectionRows: 424, singleWitnessRows: 64, allFertileRows: 82, infertilePairRows: 406 });
    expect(eB.scopeB_PENT).toMatchObject({ pairBijectionRows: 8, singleWitnessRows: 1, allFertileRows: 8, infertilePairRows: 1 });
    expect(eB.scopeC_PENT).toMatchObject({ pairBijectionRows: 476, singleWitnessRows: 0, allFertileRows: 30, infertilePairRows: 446 });
  });

  it("pins the E-C heptatonic containment cross-reference and the E-D pentatonic binding", () => {
    const eC = investigation.correspondence.eC.rows;
    expect(eC).toHaveLength(57);
    const d7 = eC.find((row) => row.cycle === "D7" && row.layer === "D6")!;
    expect(d7).toMatchObject({ reached: 14, reachPairs: 25, containmentPairs: 12, coincidence: 10 });
    const a1 = eC.find((row) => row.cycle === "A1" && row.layer === "A2")!;
    expect(a1).toMatchObject({ reached: 38, reachPairs: 5, containmentPairs: 69, coincidence: 0 });
    const eD = investigation.correspondence.eD;
    expect(eD.scopeB.find((row) => row.cycle === "D7")!.pairs).toBe(60);
    expect(eD.scopeB.find((row) => row.cycle === "A0")!.pairs).toBe(60);
    expect(eD.scopeB.find((row) => row.cycle === "A2")!.pairs).toBe(10);
    expect(eD.scopeB.find((row) => row.cycle === "D2")!.pairs).toBe(30);
    expect(eD.scopeB.find((row) => row.cycle === "A1")!.pairs).toBe(0);
    expect(eD.scopeC).toEqual({ rows: 476, totalPairs: 72840, maxPairs: 270 });
  });

  it("pins the per-family breakdown: the exact rows sit on the boundary families; the satellite-class witness census", () => {
    const families = investigation.perFamily.cycleFamilies;
    const exactFamilies = families.filter((row) => row.exact > 0).map((row) => row.family);
    expect(exactFamilies).toEqual(["7-1", "7-33", "7-34", "7-35"]);
    expect(families.find((row) => row.family === "7-35")).toMatchObject({ rows: 5, exact: 2, partial: 1, fault: 0, spanningCuts: 18 });
    expect(families.find((row) => row.family === "7-15")).toMatchObject({ exact: 0, fault: 3 });
    const classes = investigation.perFamily.satelliteClasses;
    expect(classes.find((row) => row.forte === "7-2")).toMatchObject({ witnessIncidences: 72, nonConsecutiveWindows: 0 });
    expect(classes.find((row) => row.forte === "7-24")).toMatchObject({ witnessIncidences: 96, nonConsecutiveWindows: 5 });
    expect(investigation.perFamily.containment.pSide.length).toBeGreaterThan(0);
    expect(investigation.perFamily.containment.hSide.length).toBeGreaterThan(0);
  });

  it("pins the synthesis: BOUNDARY_LAYER_CONDITIONAL, 14 exact rows, the exact loci, the fault census", () => {
    const synthesis = investigation.synthesis;
    expect(synthesis.verdict).toBe("BOUNDARY_LAYER_CONDITIONAL");
    expect(synthesis.exactRowCensus.total).toBe(14);
    expect(synthesis.exactRowCensus.spanningRows).toBe(982);
    expect(synthesis.exactRowCensus.exactRate).toBe("14/982");
    const loci = synthesis.exactRowCensus.loci.map((row) => `${row.cycle}|${row.layer}`);
    expect(loci).toContain("D7|D6");
    expect(loci).toContain("A0|A1");
    expect(loci).toContain("A1|A2");
    expect(loci).toContain("D7|PENT");
    expect(loci).toContain("A0|PENT");
    expect(loci).toContain("A2|PENT");
    expect(synthesis.faultCensus.total).toBe(902);
    expect(synthesis.faultCensus.nonCyclicFaults).toBe(872);
    expect(synthesis.faultCensus.fullRangeFaults).toBe(30);
    expect(synthesis.d1AnchorStatement).toContain("closure-edge co-parenting");
    expect(synthesis.higherTheoremNote).toContain("no claim event");
  });

  it("pins the GSL treatment, fences, citations, and bounded non-accomplishments", () => {
    expect(investigation.gslTreatment.candidateDraft.status).toContain("un-promoted");
    expect(investigation.gslTreatment.newEntry).toContain("none");
    expect(investigation.fences.noClaimEvent).toContain("no claim event");
    expect(investigation.fences.noGovernsAdmission).toContain("GSL-8 candidate draft is inline, unapplied");
    expect(investigation.fences.d7HypothesisTier).toContain("hypothesis-tier");
    expect(investigation.fences.sessionProse).toContain("context, not evidence");
    expect(investigation.contractCitations.some((citation) => citation.includes("bl087-klein-ladder-probe.v1.json"))).toBe(true);
    expect(investigation.contractCitations.some((citation) => citation.includes("bipartite-inclusion-v1.json"))).toBe(true);
    expect(investigation.notAccomplished).toHaveLength(6);
    expect(investigation.notAccomplished.some((item) => item.includes("no new measurement"))).toBe(true);
    expect(investigation.notAccomplished.some((item) => item.includes("no claim event"))).toBe(true);
  });
});
