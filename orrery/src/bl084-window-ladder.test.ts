import { describe, expect, it } from "vitest";

import investigation from "./generated/bl084-window-ladder.v1.json";

describe("BL-084 window-ladder investigation — pinned", () => {
  it("pins the header, status, chain anchors, source bindings, and the pre-registration (rulings, decision rules, method)", () => {
    expect(investigation.schemaVersion).toBe("harmonic-orrery.bl084-window-ladder.v1");
    expect(investigation.investigationId).toBe("BL084_WINDOW_LADDER_V1");
    expect(investigation.status).toBe("planning_evidence");
    expect(investigation.generator).toBe("scripts/build-bl084-window-ladder.mjs");
    expect(investigation.investigationFingerprint).toMatch(/^[0-9a-f]{64}$/);
    expect(investigation.sourceBindings).toHaveLength(8);
    expect(investigation.sourceBindings.every((binding) => /^[0-9a-f]{64}$/.test(binding.sha256))).toBe(true);
    expect(investigation.base.bl072.investigationFingerprint).toBe("45d0afd1f7e8a8af88c3357bc4c9a2b513e6fcb9ab597d4764047862ca4ddb85");
    expect(investigation.base.bl073.investigationFingerprint).toBe("811fa786f3a03b03b0c334fe797c85b9b4aeed93332a183be43f86fa1133a65c");
    expect(investigation.base.bl055.reviewFingerprint).toBe("6d11fd932efbe96892b3cf2e6a6cdad6f54e69cd2a8f284ebb72232c59d8b745");
    expect(investigation.base.bl066.derivationFingerprint).toBe("94f0661ff6e76b0dea69fbe9f09ead24da7901393fb735495f3a25c3d9a1a886");
    expect(investigation.base.probe.probeFingerprint).toBe("068f9007c7330f84b9654547da7d0be0593276053df98c3b9f7893426f03ab22");
    expect(investigation.base.dpg.graphFingerprint).toBe("4c7abcb1d82cc5b7d1fea0227dce1bb8a88f7fd6624469f55f0d1bb26edf254f");
    expect(investigation.preRegistration.rulings.map((ruling) => ruling.id)).toEqual([
      "OD-84-1", "OD-84-2", "OD-84-3", "OD-84-4", "OD-84-5",
    ]);
    expect(investigation.preRegistration.decisionRules.full).toContain("terminal");
    expect(investigation.preRegistration.decisionRules.partial).toContain("SLIDING_ONE_REGIME");
    expect(investigation.preRegistration.decisionRules.absent).toContain("non-consecutive");
    expect(investigation.preRegistration.decisionRules.calibration).toContain("EXACT or halt");
    expect(investigation.method.referenceImplementation).toContain("one windowAnalysis code path");
    expect(investigation.method.mirrorRule).toContain("seven-element orders only");
    expect(investigation.method.layerRule).toContain("ties all-tested");
  });

  it("pins the calibration gate: the D7 orbit x the D6 layer reproduces BL-072's ladder field-for-field (FULL)", () => {
    const calibration = investigation.calibration;
    expect(calibration.order).toEqual(["127", "2111", "3103", "3599", "3847", "3971", "4033"]);
    expect(calibration.layerTier).toBe("D6");
    expect(calibration.satelliteCount).toBe(14);
    expect(calibration.verdict).toBe("FULL");
    expect(calibration.bl072Matched).toBe(true);
    expect(calibration.perAnchorCounts).toEqual([4, 5, 6, 6, 6, 5, 4]);
    expect(calibration.sizeHistogram).toEqual({ "1": 2, "2": 2, "3": 10 });
    expect(calibration.windows).toHaveLength(14);
    expect(calibration.singletonKeys).toEqual(["127:253", "4033:2017"]);
    expect(calibration.terminalWindows).toEqual(["253", "2017"]);
    expect(calibration.sizeTwoWindows).toEqual(["191", "4001"]);
    expect(calibration.mirror).toBe(true);
    expect(calibration.edgeStructure.closureEdge).toEqual({ a: "4033", b: "127", rotateInterval: 6, hamming: 10 });
    expect(calibration.edgeStructure.pathInterval).toBe(11);
    expect(calibration.edgeStructure.twoIntervalOrder).toBe(true);
    expect(investigation.grounding.calibration.status).toBe("EXACT");
    expect(investigation.grounding.calibration.bl072InvestigationFingerprint).toBe(
      "45d0afd1f7e8a8af88c3357bc4c9a2b513e6fcb9ab597d4764047862ca4ddb85",
    );
  });

  it("pins Scope A: the A0 ring x the full 28 A1 satellites is a sliding one-regime ladder (PARTIAL; size-2 windows; mirror-symmetric)", () => {
    const scopeA = investigation.scopeA;
    expect(scopeA.order).toEqual(["1387", "1451", "1453", "1709", "1717", "2741", "2773"]);
    expect(scopeA.layerTier).toBe("A1");
    expect(scopeA.satelliteCount).toBe(28);
    expect(scopeA.verdict).toBe("PARTIAL");
    expect(scopeA.shapeClass).toBe("SLIDING_ONE_REGIME");
    expect(scopeA.perAnchorCounts).toEqual([2, 4, 4, 4, 4, 4, 2]);
    expect(scopeA.sizeHistogram).toEqual({ "2": 12 });
    expect(scopeA.hasTerminal).toBe(false);
    expect(scopeA.hasInterior).toBe(true);
    expect(scopeA.mirror).toBe(true);
    expect(scopeA.overlapMatch).toBe(true);
    expect(scopeA.windows).toHaveLength(12);
    expect(scopeA.windows.every((window) => window.size === 2 && window.consecutive)).toBe(true);
    expect(scopeA.windows[0]).toMatchObject({ state: "1339", indices: [0, 1], start: 0, end: 1 });
    expect(scopeA.edgeStructure.closureEdge).toEqual({ a: "2773", b: "1387", rotateInterval: 6, hamming: 10 });
    expect(scopeA.edgeStructure.pathInterval).toBe(7);
  });

  it("pins the Scope A overlay (comparison-only): the reach is set-equal to the BL-055 cornerstone near-miss selection; misses {2395, 2899}", () => {
    const overlay = investigation.scopeA.overlay;
    expect(overlay.observedCount).toBe(14);
    expect(overlay.reachedObserved).toHaveLength(12);
    expect(overlay.missedObserved).toEqual(["2395", "2899"]);
    expect(overlay.falsePositives).toEqual([]);
    expect(overlay.cornerstoneNearMissSetEqual).toBe(true);
    expect(overlay.note).toContain("zero-seam-incidence");
  });

  it("pins the Scope B D-tier verdicts: D7 FULL; D1/D3/D4/D5/D6 PARTIAL (singleton partitions); D2 ABSENT at the top layers", () => {
    const summary = investigation.scopeB.summary;
    expect(summary.topVerdicts).toEqual({
      D1: "PARTIAL", D2: "ABSENT", D3: "PARTIAL", D4: "PARTIAL", D5: "PARTIAL", D6: "PARTIAL", D7: "FULL",
    });
    expect(summary.slidingCycles).toEqual(["D7"]);
    expect(summary.singletonOnlyCycles).toEqual(["D1", "D3", "D4", "D5", "D6"]);
    expect(summary.absentCycles).toEqual(["D2"]);
    expect(summary.fullCycles).toEqual(["D7", "A0"]);
    const cycles = new Map(investigation.scopeB.cycles.map((record) => [record.tier, record]));
    expect(cycles.get("D7")).toMatchObject({ topLayers: ["D6"], topVerdict: "FULL", slidingLayers: ["D6"], bestLayerVerdict: "FULL" });
    expect(cycles.get("D2")).toMatchObject({ topLayers: ["A2", "D2"], topVerdict: "ABSENT", slidingLayers: [], bestLayerVerdict: "PARTIAL" });
    expect(cycles.get("D6")).toMatchObject({ topLayers: ["A2"], topVerdict: "PARTIAL" });
    expect(cycles.get("D7")!.layers.map((layer) => [layer.tier, layer.verdict, layer.shapeClass])).toEqual([
      ["D6", "FULL", "TWO_REGIME"],
      ["D4", "PARTIAL", "SINGLETON_PARTITION"],
      ["D3", "PARTIAL", "SINGLETON_PARTITION"],
      ["D5", "PARTIAL", "SINGLETON_PARTITION"],
    ]);
    expect(cycles.get("D2")!.layers.filter((layer) => layer.verdict === "ABSENT").map((layer) => layer.tier)).toEqual(["A2", "D2"]);
    for (const record of investigation.scopeB.cycles) {
      expect(record.allLedgerReachUniform).toBe(true);
      expect(record.allLedgerReachPerAnchor.every((entry) => entry.count === 30)).toBe(true);
    }
  });

  it("pins the Scope B supplementary A-tier census: A0 FULL on its own-tier layer; A1 top ABSENT; A2 all-ABSENT", () => {
    const records = new Map(investigation.scopeB.supplementaryCycles.map((record) => [record.tier, record]));
    const a0 = records.get("A0")!;
    expect(a0).toMatchObject({ topLayers: ["A0"], topVerdict: "FULL", bestLayerVerdict: "FULL", slidingLayers: ["A0", "A1"] });
    expect(a0.layers.map((layer) => [layer.tier, layer.verdict, layer.shapeClass])).toEqual([
      ["A0", "FULL", "TWO_REGIME"],
      ["A1", "PARTIAL", "SLIDING_ONE_REGIME"],
      ["A2", "PARTIAL", "SINGLETON_PARTITION"],
      ["D3", "PARTIAL", "SINGLETON_PARTITION"],
    ]);
    expect(a0.layers[0]!.sizeHistogram).toEqual({ "1": 28, "2": 10 });
    const a1 = records.get("A1")!;
    expect(a1.topVerdict).toBe("ABSENT");
    expect(a1.bestLayerVerdict).toBe("PARTIAL");
    const a2 = records.get("A2")!;
    expect(a2.bestLayerVerdict).toBe("ABSENT");
    expect(a2.layers.every((layer) => layer.verdict === "ABSENT")).toBe(true);
  });

  it("pins the Scope C census: 476 directed / 238 unordered operator cycles; all edges Hamming-2 and inverse-paired; no length-7 cycles", () => {
    const census = investigation.scopeC.census;
    expect(census.edges).toBe(60);
    expect(census.anchors).toBe(21);
    expect(census.allEdgesHamming2).toBe(true);
    expect(census.reversePairsComplete).toBe(true);
    expect(census.directedCount).toBe(476);
    expect(census.unorderedCount).toBe(238);
    expect(census.noLengthSevenCycles).toBe(true);
    expect(census.lengthHistogram).toEqual({
      "4": 20, "6": 24, "8": 48, "10": 88, "12": 120, "14": 108, "16": 56, "18": 12,
    });
    expect(investigation.scopeC.rows).toHaveLength(476);
  });

  it("pins the Scope C aggregate: 14 directed (14 unordered) sliding cycles at lengths 4/10/12; every sliding orientation's reverse is ABSENT", () => {
    const aggregate = investigation.scopeC.aggregate;
    expect(aggregate.slidingDirectedCount).toBe(14);
    expect(aggregate.slidingByLength).toEqual({ "4": 5, "10": 4, "12": 5 });
    expect(aggregate.unorderedCensus).toEqual({ oneOrientationSliding: 14, bothOrientationsSliding: 0, neitherSliding: 224 });
    expect(aggregate.slidingUnorderedCount).toBe(14);
    expect(aggregate.directedVerdictHistogram).toEqual({
      "L4:FULL": 5, "L4:ABSENT": 15,
      "L6:ABSENT": 24, "L8:ABSENT": 48,
      "L10:FULL": 4, "L10:ABSENT": 84,
      "L12:FULL": 5, "L12:ABSENT": 115,
      "L14:ABSENT": 108, "L16:ABSENT": 56, "L18:ABSENT": 12,
    });
    expect(aggregate.orientationSensitivity).toContain("exactly one orientation");
    const first = investigation.scopeC.rows[0]!;
    expect(first.order).toEqual(["1371", "1373", "1389", "1387"]);
    expect(first.verdict).toBe("FULL");
    expect(first.topLayers[0]).toMatchObject({
      tier: "A2", verdict: "FULL", shapeClass: "TWO_REGIME",
      sizeHistogram: { "1": 10, "2": 5, "4": 2 }, fullRangeWindowCount: 2,
    });
  });

  it("pins the Scope D conditions: (a) length REFUTED; (b) ratio REFUTED; (c) uniform reach SUPPORTED/non-discriminating; (d) Hamming-2 generality REFUTED as stated", () => {
    const conditions = new Map(investigation.scopeD.conditions.map((condition) => [condition.id, condition]));
    expect(conditions.get("D-a")!.verdict).toBe("REFUTED");
    expect(conditions.get("D-a")!.evidence).toContain("14 directed cycles");
    expect(conditions.get("D-b")!.verdict).toBe("REFUTED");
    expect(conditions.get("D-b")!.evidence).toContain("same-ratio layers carry different verdicts");
    expect(conditions.get("D-c")!.verdict).toBe("SUPPORTED_PROPERTY_NON_DISCRIMINATING");
    expect(conditions.get("D-c")!.evidence).toContain("30 per anchor");
    expect(conditions.get("D-d")!.verdict).toBe("REFUTED_AS_STATED");
    expect(conditions.get("D-d")!.evidence).toContain("476");
    expect(investigation.scopeD.summary).toContain("reach-order alignment");
  });

  it("pins the synthesis: BOUNDARY_LAYER_CONDITIONAL — not universal, not D7-specific; the principle and the D7 special property", () => {
    const synthesis = investigation.synthesis;
    expect(synthesis.verdict).toBe("BOUNDARY_LAYER_CONDITIONAL");
    expect(synthesis.universal).toContain("462 of 476");
    expect(synthesis.d7Specific).toContain("REFUTED");
    expect(synthesis.d7Specific).toContain("14 unordered operator cycles");
    expect(synthesis.d7SpecificEvidence).toContain("D7, A0");
    expect(synthesis.d7SpecificEvidence).toContain("dual-closure pair");
    expect(synthesis.principle).toContain("reach-order alignment");
    expect(synthesis.d7SpecialProperty).toContain("class-pure 7-2");
    expect(synthesis.a0Context).toContain("coordinate image");
    expect(synthesis.higherTheoremNote).toContain("no claim event");
  });

  it("pins the GSL treatment: the inline, unapplied GSL-4 generalization refinement; no new entry", () => {
    const gsl = investigation.gslTreatment;
    expect(gsl.gsl4GeneralizationRefinement.status).toBe("inline, unapplied (no status change, no new GSL number)");
    expect(gsl.gsl4GeneralizationRefinement.text).toContain("boundary-layer-conditional");
    expect(gsl.newEntry).toContain("none");
  });

  it("pins the accounting, fences, citations, and bounded non-accomplishments", () => {
    expect(investigation.accounting.masksOnly.length).toBeGreaterThanOrEqual(4);
    expect(investigation.accounting.canonicalComputation.length).toBeGreaterThanOrEqual(4);
    expect(investigation.accounting.remainingGranted.length).toBeGreaterThanOrEqual(3);
    expect(investigation.accounting.statement).toContain("no new measurement");
    expect(investigation.fences.noNewMeasurement).toContain("BL-070");
    expect(investigation.fences.calibrationGate).toContain("OD-84-5");
    expect(investigation.fences.d7HypothesisTier).toContain("2703-2712");
    expect(investigation.fences.membrane).toContain("never a probe input");
    expect(investigation.fences.sessionProse).toContain("context, not evidence");
    expect(investigation.contractCitations.some((citation) => citation.includes("bl072-composite-mechanism.v1.json"))).toBe(true);
    expect(investigation.contractCitations.some((citation) => citation.includes("bl073-isometry-probe.v1.json"))).toBe(true);
    expect(investigation.contractCitations.some((citation) => citation.includes("derived-path-graph.v1.json"))).toBe(true);
    expect(investigation.notAccomplished).toHaveLength(7);
    expect(investigation.notAccomplished.some((item) => item.includes("no higher-theorem answer"))).toBe(true);
    expect(investigation.notAccomplished.some((item) => item.includes("no new measurement"))).toBe(true);
    expect(investigation.notAccomplished.some((item) => item.includes("no claim event"))).toBe(true);
  });
});
