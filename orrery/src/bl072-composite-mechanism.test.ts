import { describe, expect, it } from "vitest";

import investigation from "./generated/bl072-composite-mechanism.v1.json";

describe("BL-072 composite-mechanism investigation — pinned", () => {
  it("pins the schema, status, chain anchors, and the pre-registration (rulings, language, permutation parameters, disclosure)", () => {
    expect(investigation.schemaVersion).toBe("harmonic-orrery.bl072-composite-mechanism.v1");
    expect(investigation.investigationId).toBe("BL072_COMPOSITE_MECHANISM_V1");
    expect(investigation.status).toBe("planning_evidence");
    expect(investigation.generator).toBe("scripts/build-bl072-composite-mechanism.mjs");
    expect(investigation.investigationFingerprint).toMatch(/^[0-9a-f]{64}$/);
    expect(investigation.sourceBindings).toHaveLength(7);
    expect(investigation.sourceBindings.every((binding) => /^[0-9a-f]{64}$/.test(binding.sha256))).toBe(true);
    expect(investigation.base.bl068.derivationFingerprint).toBe("b0d65bd6149978de4f5ef3f1a0b281d0f6324a81114e8aa9da07eda8ef5ef849");
    expect(investigation.base.bl070.derivationFingerprint).toBe("9db10a088a05664a5cf60f6fad14514a4fc9aab278dcf0359d684bce70607731");
    expect(investigation.base.bl071.investigationFingerprint).toBe("8b2a1f6ca1776851f721eb6bc6ee6532059d81d150ce3f7c9fda1febfe84c3fe");
    expect(investigation.base.bl055.reviewFingerprint).toBe("6d11fd932efbe96892b3cf2e6a6cdad6f54e69cd2a8f284ebb72232c59d8b745");
    expect(investigation.preRegistration.rulings.map((ruling) => ruling.id)).toEqual([
      "OD-72-1", "OD-72-2", "OD-72-3", "OD-72-4", "OD-72-5", "OD-72-6",
    ]);
    expect(investigation.preRegistration.permutationMethod.iterations).toBe(1000);
    expect(investigation.preRegistration.permutationMethod.seed).toBe(72072);
    expect(investigation.preRegistration.permutationMethod.prng).toBe("mulberry32");
    expect(investigation.preRegistration.permutationMethod.disclosure).toContain("lower bound");
    expect(investigation.preRegistration.permutationMethod.disclosure).toContain("not pre-registered");
    expect(Object.keys(investigation.preRegistration.decisionRules).sort()).toEqual([
      "hArtifact", "hGeometric", "hInformational", "hPrimitive",
    ]);
    expect(investigation.preRegistration.buildNotes.some((note) => note.includes("any mismatch"))).toBe(true);
  });

  it("pins the grounding receipt: 36-instance domain set-equal BL-070, 14 contacts, the landed composite confusion, the near-miss bytes", () => {
    const grounding = investigation.grounding;
    expect(grounding.domain.size).toBe(36);
    expect(grounding.domain.perAnchor).toEqual([4, 5, 6, 6, 6, 5, 4]);
    expect(grounding.domain.setEqualBl070).toBe(true);
    expect(grounding.domain.bl070DerivationFingerprint).toBe("9db10a088a05664a5cf60f6fad14514a4fc9aab278dcf0359d684bce70607731");
    expect(grounding.contacts.recorded).toBe(14);
    expect(grounding.contacts.unrecorded).toBe(22);
    expect(grounding.contacts.deltaCounts).toEqual({ "2": 11, "5": 11 });
    expect(grounding.contacts.setEqualSeatContactRows).toBe(true);
    expect(grounding.composite.confusion).toEqual({ tp: 14, fp: 0, fn: 0, tn: 22 });
    expect(grounding.composite.landedMatch).toBe(true);
    expect(grounding.composite.landedStatus).toBe("UNPROMOTED_DISCOVERY");
    expect(grounding.nearMiss.confusion).toEqual({ tp: 12, fp: 0, fn: 2, tn: 22 });
    expect(grounding.nearMiss.landedMatch).toBe(true);
    expect(grounding.nearMiss.missedKeys).toEqual(["127:253", "4033:2017"]);
    expect(grounding.battery).toEqual({ landedCleanSplitCount: 0, analysisCleanSplitCount: 0 });
  });

  it("pins the property table: 36 rows x 30 columns; the terminal rows carry the composite's Term-B; the semitone rows carry Term-A", () => {
    const table = investigation.propertyTable;
    expect(table.columns).toHaveLength(30);
    expect(table.columns).toContain("parentCount");
    expect(table.columns).toContain("compositeTerm");
    expect(table.rows).toHaveLength(36);
    const byKey = new Map(table.rows.map((row) => [row.key, row]));
    expect(byKey.get("127:253")).toMatchObject({
      recorded: true,
      termA: false,
      termB: true,
      composite: true,
      compositeTerm: "B",
      dPcSum: 6,
      displacementLinear: 6,
      parentCount: 1,
      multiplicity: 1,
      inversionPartner: "2017",
      zMajority: true,
    });
    expect(byKey.get("4033:2017")).toMatchObject({
      recorded: true,
      termB: true,
      compositeTerm: "B",
      dPcSum: 6,
      parentCount: 1,
      inversionPartner: "253",
    });
    expect(byKey.get("127:191")).toMatchObject({ recorded: true, termA: true, compositeTerm: "A", dPcSum: 1 });
    expect(byKey.get("2111:191")).toMatchObject({ recorded: false, composite: false, compositeTerm: null, officeDelta: 5 });
    expect(table.rows.filter((row) => row.composite)).toHaveLength(14);
    expect(table.rows.every((row) => row.hamming === 2)).toBe(true);
  });

  it("pins the per-term decomposition: 12/0/2/22 + 2/0/12/22 = 14/0/0/22; disjoint; residual exact; whole-pair respect", () => {
    const perTerm = investigation.perTerm;
    expect(perTerm.termA.confusion).toEqual({ tp: 12, fp: 0, fn: 2, tn: 22 });
    expect(perTerm.termA.verdict).toBe("NEAR_MISS_BOUNDARY");
    expect(perTerm.termA.selectedKeys).toHaveLength(12);
    expect(perTerm.termA.misses).toEqual(["127:253", "4033:2017"]);
    expect(perTerm.termA.selectedKeys).toContain("127:191");
    expect(perTerm.termA.selectedKeys).not.toContain("127:253");
    expect(perTerm.termB.confusion).toEqual({ tp: 2, fp: 0, fn: 12, tn: 22 });
    expect(perTerm.termB.selectedKeys).toEqual(["127:253", "4033:2017"]);
    expect(perTerm.joint.confusion).toEqual({ tp: 14, fp: 0, fn: 0, tn: 22 });
    expect(perTerm.joint.verdict).toBe("CLEAN_SPLIT");
    expect(perTerm.joint.expression).toContain("reach-singleton");
    expect(perTerm.overlap.count).toBe(0);
    expect(perTerm.overlap.disjoint).toBe(true);
    expect(perTerm.overlap.keys).toEqual([]);
    expect(perTerm.residual.recordedOutsideUnion).toEqual([]);
    expect(perTerm.residual.selectedNonRecorded).toEqual([]);
    expect(perTerm.residual.exact).toBe(true);
    expect(perTerm.wholePairRespect).toEqual({ termA: true, termB: true, joint: true, mechanicallyVerified: true });
    expect(perTerm.anatomy).toContain("12 + 2 = 14");
  });

  it("pins the permutation baseline: 0/1000 clean splits, the TP histogram, the central interval, the exact-match denominator, the verbatim disclosure, REFUTED", () => {
    const permutation = investigation.permutation;
    expect(permutation.method.iterations).toBe(1000);
    expect(permutation.method.seed).toBe(72072);
    expect(permutation.method.shuffle).toContain("Fisher-Yates");
    expect(permutation.results.cleanSplitCount).toBe(0);
    expect(permutation.results.cleanSplitRate).toBe("0/1000");
    expect(permutation.results.tpSum).toBe(5474);
    expect(permutation.results.maxTP).toBe(9);
    expect(permutation.results.central95).toEqual({ lower: 3, upper: 8 });
    expect(permutation.results.tpHistogram).toEqual({
      "0": 0, "1": 0, "2": 9, "3": 57, "4": 174, "5": 263, "6": 270, "7": 170, "8": 49, "9": 8,
      "10": 0, "11": 0, "12": 0, "13": 0, "14": 0,
    });
    expect(permutation.results.expectedMeanFraction).toBe("49/9");
    expect(permutation.exact.cleanMatchNumerator).toBe(1);
    expect(permutation.exact.cleanMatchDenominator).toBe("3796297200");
    expect(permutation.disclosure).toBe(
      "C-TB-1 was discovered by searching the composite space, not pre-registered — the permutation p-value is conditional on C-TB-1's selection from the search and should be interpreted as a lower bound, not as an independent confirmation.",
    );
    expect(permutation.verdict).toBe("REFUTED");
    expect(permutation.decisionRule).toContain("central 95%");
  });

  it("pins the geometric mapping: the orbit-window ladder, terminal localization, inversion mirroring, the office step, the closure alignment", () => {
    const geometric = investigation.geometricMapping;
    expect(geometric.orbitOrder).toEqual(["127", "2111", "3103", "3599", "3847", "3971", "4033"]);
    expect(geometric.windows).toHaveLength(14);
    expect(geometric.allConsecutive).toBe(true);
    expect(geometric.windows.every((window) => window.consecutive)).toBe(true);
    expect(geometric.terminalWindows).toEqual(["253", "2017"]);
    expect(geometric.sizeTwoWindows).toEqual(["191", "4001"]);
    expect(geometric.singletonKeys).toEqual(["127:253", "4033:2017"]);
    expect(geometric.termBLocalized).toBe(true);
    expect(geometric.singletonDisplacement).toEqual([6, 6]);
    expect(geometric.perAnchorOverlapCounts).toEqual([4, 5, 6, 6, 6, 5, 4]);
    expect(geometric.perAnchorCountsMatch).toBe(true);
    expect(geometric.windowSizeHistogram).toEqual({ "1": 2, "2": 2, "3": 10 });
    expect(geometric.inversionSymmetry.allMirrored).toBe(true);
    expect(geometric.inversionSymmetry.anchorPairs).toEqual([
      { a: "127", b: "4033", indices: [0, 6], indexSum: 6 },
      { a: "2111", b: "3971", indices: [1, 5], indexSum: 6 },
      { a: "3103", b: "3847", indices: [2, 4], indexSum: 6 },
      { a: "3599", b: "3599", indices: [3, 3], indexSum: 6 },
    ]);
    expect(geometric.inversionSymmetry.singletonPair).toEqual(["2017", "253"]);
    expect(geometric.orbitOfficeSequence).toEqual([4, 6, 1, 3, 5, 0, 2]);
    expect(geometric.officeSteps).toEqual([2, 2, 2, 2, 2, 2, 2]);
    expect(geometric.closureEdge).toEqual({ a: "4033", b: "127", rotateInterval: 6 });
    expect(geometric.closureAlignment.closureInterval).toBe(6);
    expect(geometric.structuralChecks).toEqual({
      consecutiveWindows: true,
      terminalLocalization: true,
      perAnchorFromWindows: true,
      nonVacuous: true,
    });
    expect(geometric.findings).toHaveLength(6);
    expect(geometric.findings.some((finding) => finding.includes("orbit-window ladder"))).toBe(true);
    expect(geometric.a0Context).toContain("No A0 measurement occurs here");
    expect(geometric.interpretation).toContain("NOT ESTABLISHED");
  });

  it("pins the cross-domain read: Term-A 12/12/2/2 on the class-mixed fa table (both classes selected 12+12), Term-B NOT_APPLICABLE, SUPPORTED", () => {
    const crossDomain = investigation.crossDomain;
    expect(crossDomain.source.artifact).toBe("orrery/src/generated/d4-selection-review.v1.json");
    expect(crossDomain.source.reviewFingerprint).toBe("6d11fd932efbe96892b3cf2e6a6cdad6f54e69cd2a8f284ebb72232c59d8b745");
    expect(crossDomain.source.table28Count).toBe(28);
    expect(crossDomain.source.observedCount).toBe(14);
    expect(crossDomain.termA.deltaHistogram).toEqual({ "1": 24, "6": 4 });
    expect(crossDomain.termA.confusion).toEqual({ tp: 12, fp: 12, fn: 2, tn: 2 });
    expect(crossDomain.termA.verdict).toBe("NON_SEPARATING");
    expect(crossDomain.termA.clean).toBe(false);
    expect(crossDomain.termA.selectedCount).toBe(24);
    expect(crossDomain.termA.classComposition).toEqual({ "7-27": 12, "7-31": 12 });
    expect(crossDomain.termA.missedObserved).toEqual(["1:3497", "5:695"]);
    expect(crossDomain.termA.falsePositiveCount).toBe(12);
    expect(crossDomain.termB.applicability).toBe("NOT_APPLICABLE");
    expect(crossDomain.termB.reason).toContain("no counterpart is constructed");
    expect(crossDomain.compositeOnFa.clean).toBe(false);
    expect(crossDomain.compositeOnFa.confusion).toEqual({ tp: 12, fp: 12, fn: 2, tn: 2 });
    expect(crossDomain.verdict).toBe("SUPPORTED");
    expect(crossDomain.attribution).toContain("INDETERMINATE");
  });

  it("pins the minimality enumeration: nine singles with no clean split; 36 pairs in full; the clean pairs are P3+P9 and P5+P9 (one equivalence class)", () => {
    const minimality = investigation.minimality;
    expect(minimality.language.canonicalOrder).toEqual(["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8", "P9"]);
    expect(minimality.language.singles).toHaveLength(9);
    expect(minimality.language.pairCount).toBe(36);
    expect(minimality.singles).toHaveLength(9);
    expect(minimality.pairs).toHaveLength(36);
    const singlesById = new Map(minimality.singles.map((single) => [single.id, single]));
    expect(singlesById.get("P3")!.confusion).toEqual({ tp: 12, fp: 0, fn: 2, tn: 22 });
    expect(singlesById.get("P7")!.confusion).toEqual({ tp: 7, fp: 11, fn: 7, tn: 11 });
    expect(singlesById.get("P9")!.confusion).toEqual({ tp: 2, fp: 0, fn: 12, tn: 22 });
    expect(minimality.singles.every((single) => single.clean === false)).toBe(true);
    expect(singlesById.get("P3")!.selectionHash).toBe(singlesById.get("P5")!.selectionHash);
    expect(minimality.summary.cleanSingles).toEqual([]);
    expect(minimality.summary.cleanPairs).toEqual(["P3+P9", "P5+P9"]);
    expect(minimality.summary.minimalCleanCardinality).toBe(2);
    expect(minimality.summary.compositeInMinimalSet).toBe(true);
    expect(minimality.summary.uniqueMinimalUpToDegeneracy).toBe(true);
    expect(minimality.degeneracyClasses).toHaveLength(5);
    expect(minimality.degeneracyClasses.find((group) => group.selectionSize === 0)!.ids).toEqual(["P1", "P2", "P6", "P8"]);
    expect(minimality.degeneracyClasses.find((group) => group.selectionSize === 12)!.ids).toEqual(["P3", "P5"]);
    expect(minimality.appendixVariants).toHaveLength(8);
    expect(minimality.appendixVariants.find((variant) => variant.id === "C-M3.r2")!.confusion).toEqual({ tp: 7, fp: 0, fn: 7, tn: 22 });
    expect(minimality.verdict).toBe("SUPPORTED");
    expect(minimality.scope).toContain("language-relative");
  });

  it("pins the verdict set: all four non-exclusive verdicts with the production/attribution/scope notes and the disclosure", () => {
    const verdictSet = investigation.verdictSet;
    expect(verdictSet.nonExclusive).toBe(true);
    expect(verdictSet["H-Geometric"].verdict).toBe("SUPPORTED");
    expect(verdictSet["H-Geometric"].production).toContain("NOT ESTABLISHED");
    expect(verdictSet["H-Informational"].verdict).toBe("SUPPORTED");
    expect(verdictSet["H-Informational"].attribution).toContain("INDETERMINATE");
    expect(verdictSet["H-Artifact"].verdict).toBe("REFUTED");
    expect(verdictSet["H-Artifact"].disclosure).toBe(investigation.permutation.disclosure);
    expect(verdictSet["H-Primitive"].verdict).toBe("SUPPORTED");
    expect(verdictSet["H-Primitive"].scope).toContain("no admission weight");
  });

  it("pins the GSL treatment per OD-72-6: the distinction, the inline GSL-4 refinement, the un-promoted GSL-7 draft", () => {
    const gsl = investigation.gslTreatment;
    expect(gsl.rule).toContain("OD-72-6");
    expect(gsl.distinction).toContain("language-relative");
    expect(gsl.gsl4Refinement.status).toBe("inline, unapplied (no status change, no new GSL number)");
    expect(gsl.gsl4Refinement.text).toContain("terminal face");
    expect(gsl.newEntryDraft.id).toBe("GSL-7");
    expect(gsl.newEntryDraft.status).toBe("candidate draft, un-promoted");
    expect(gsl.newEntryDraft.condition).toContain("characterization level");
    expect(gsl.newEntryDraft.caveat).toContain("NOT ESTABLISHED");
    expect(gsl.newEntryDraft.registration).toContain("none performed");
  });

  it("pins the accounting, fences, citations and bounded non-accomplishments", () => {
    expect(investigation.accounting.masksOnly.length).toBeGreaterThanOrEqual(4);
    expect(investigation.accounting.canonicalComputation.length).toBeGreaterThanOrEqual(4);
    expect(investigation.accounting.remainingGranted.length).toBeGreaterThanOrEqual(3);
    expect(investigation.accounting.statement).toContain("no new measurement");
    expect(investigation.fences.d7HypothesisTier).toContain("2703-2712");
    expect(investigation.fences.noNewMeasurement).toContain("halt");
    expect(investigation.fences.permutationDisclosure).toBe(investigation.permutation.disclosure);
    expect(investigation.fences.compositeStatusUnchanged).toContain("UNPROMOTED_DISCOVERY");
    expect(investigation.fences.crossDomainRule).toContain("OD-72-1");
    expect(investigation.fences.languageClosure).toContain("post-run expansion forbidden");
    expect(investigation.fences.membrane).toContain("never a probe input");
    expect(investigation.contractCitations.some((citation) => citation.includes("bl070-d7-derivation.v1.json"))).toBe(true);
    expect(investigation.contractCitations.some((citation) => citation.includes("d4-selection-review.v1.json"))).toBe(true);
    expect(investigation.notAccomplished).toHaveLength(7);
    expect(investigation.notAccomplished.some((item) => item.includes("no new measurement"))).toBe(true);
    expect(investigation.notAccomplished.some((item) => item.includes("no C-TB-1 promotion"))).toBe(true);
    expect(investigation.notAccomplished.some((item) => item.includes("no mechanism (causal) claim"))).toBe(true);
  });
});
