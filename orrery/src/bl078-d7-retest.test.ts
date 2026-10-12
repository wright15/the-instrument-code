import { describe, expect, it } from "vitest";

import retest from "./generated/bl078-d7-retest.v1.json";

describe("BL-078 D7 re-test (office-purity route, region-scoped isolation) — pinned", () => {
  it("pins schema, status, fingerprint, source bindings, the chain anchors and the pre-registration", () => {
    expect(retest.schemaVersion).toBe("harmonic-orrery.bl078-d7-retest.v1");
    expect(retest.retestId).toBe("BL078_D7_RETEST_V1");
    expect(retest.status).toBe("planning_evidence");
    expect(retest.generator).toBe("scripts/build-bl078-d7-retest.mjs");
    expect(retest.derivationFingerprint).toMatch(/^[0-9a-f]{64}$/);
    expect(retest.sourceBindings).toHaveLength(6);
    expect(retest.sourceBindings.every((binding) => /^[0-9a-f]{64}$/.test(binding.sha256))).toBe(true);
    expect(retest.base.bl068.derivationFingerprint).toBe("b0d65bd6149978de4f5ef3f1a0b281d0f6324a81114e8aa9da07eda8ef5ef849");
    expect(retest.base.bl070.derivationFingerprint).toBe("9db10a088a05664a5cf60f6fad14514a4fc9aab278dcf0359d684bce70607731");
    expect(retest.preRegistration.rulings.map((ruling) => ruling.id)).toEqual(["OD-N0", "OD-N1", "OD-N2", "OD-N3"]);
    expect(retest.preRegistration.branchCriteria.partial).toContain("V-D7D-3 FAIL");
    expect(retest.preRegistration.comparisonCriteria.diverged).toContain("the mismatch is the finding");
    expect(retest.preRegistration.buildNotes.some((note) => note.includes("region-scoped"))).toBe(true);
  });

  it("pins the domain verification and the calibration: 36 instances, set-equal BL-068 + BL-070, R-OFF EXACT", () => {
    const domain = retest.domainVerification;
    expect(domain.partition.anchors).toEqual(["127", "2111", "3103", "3599", "3847", "3971", "4033"]);
    expect(domain.partition.anchorCount).toBe(7);
    expect(domain.partition.satelliteCount).toBe(14);
    expect(domain.partition.classPurity).toContain("class-pure");
    expect(domain.perAnchor.map((entry) => `${entry.anchor}:${entry.count}`)).toEqual([
      "127:4", "2111:5", "3103:6", "3599:6", "3847:6", "3971:5", "4033:4",
    ]);
    expect(domain.perAnchor[0].instances).toEqual(["191", "253", "1087", "2143"]);
    expect(domain.domainSize).toBe(36);
    expect(domain.distinctStates).toBe(14);
    expect(domain.multiplicity).toEqual({ "1": 2, "2": 2, "3": 10 });
    expect(domain.calibration.allLedgerReachUniform).toBe(true);
    expect(domain.calibration.allLedgerReachPerAnchor.map((entry) => entry.count)).toEqual([30, 30, 30, 30, 30, 30, 30]);
    expect(domain.calibration.d6TierReachPerAnchor.map((entry) => entry.count)).toEqual([6, 6, 8, 8, 8, 6, 6]);
    expect(domain.calibration.note).toContain("emergent");
    expect(domain.setEquality.bl068SetEqual).toBe(true);
    expect(domain.setEquality.bl070SetEqual).toBe(true);
    expect(domain.setEquality.contactsSubsetOfDerivedDomain).toBe(true);
    expect(domain.recordedRelation.recordedCount).toBe(14);
    expect(domain.recordedRelation.unrecordedCount).toBe(22);
    expect(domain.recordedRelation.deltaCounts).toEqual({ "2": 11, "5": 11 });
    expect(retest.calibration.rule.id).toBe("R-OFF");
    expect(retest.calibration.confusion).toEqual({ tp: 14, fp: 0, fn: 0, tn: 22 });
    expect(retest.calibration.verdict).toBe("CLEAN_SPLIT");
    expect(retest.calibration.exact).toBe(true);
    expect(retest.calibration.licence).toContain("domain would be wrong, not the rule");
  });

  it("pins the domain non-circularity: the verification block carries no office or class fields", () => {
    const text = JSON.stringify(retest.domainVerification);
    expect(text).not.toMatch(/"office/i);
    expect(text).not.toMatch(/"forte/i);
    expect(text).not.toContain("Jupiter");
    expect(text).not.toContain("Saturn");
    expect(text).not.toContain("Moon");
    expect(retest.domainVerification.definition).toContain("The office field is not read here");
  });

  it("pins the battery: nine pre-registered candidates, no clean split, the two near-miss rules, all replication expectations held", () => {
    expect(retest.battery.preRegisteredIds).toEqual(["C-M1", "C-M2", "C-M3", "C-M4", "C-M5", "C-M6", "C-M7", "C-M8", "C-M9"]);
    expect(retest.battery.candidates).toHaveLength(9);
    expect(retest.battery.summary.cleanSplitCount).toBe(0);
    expect(retest.battery.summary.nearMissCandidates).toEqual(["C-M3", "C-M5"]);
    expect(retest.battery.summary.expectationsHeld).toBe(9);
    expect(retest.battery.summary.verdict).toBe("NO_PRE_REGISTERED_CLEAN_SPLIT");
    const byId = new Map(retest.battery.candidates.map((candidate) => [candidate.id, candidate]));
    expect(byId.get("C-M1")!.observedVerdict).toBe("NON_SEPARATING");
    expect(byId.get("C-M1")!.subRules[0].confusion).toEqual({ tp: 0, fp: 0, fn: 14, tn: 22 });
    expect(byId.get("C-M2")!.subRules.map((rule) => rule.confusion)).toEqual([
      { tp: 0, fp: 0, fn: 14, tn: 22 }, { tp: 0, fp: 0, fn: 14, tn: 22 },
    ]);
    expect(byId.get("C-M4")!.subRules[0].confusion).toEqual({ tp: 4, fp: 2, fn: 10, tn: 20 });
    expect(byId.get("C-M7")!.tier).toContain("canonical-read");
    expect(byId.get("C-M7")!.subRules[0].confusion).toEqual({ tp: 7, fp: 11, fn: 7, tn: 11 });
    expect(byId.get("C-M8")!.subRules[1].confusion).toEqual({ tp: 14, fp: 22, fn: 0, tn: 0 });
    expect(byId.get("C-M9")!.subRules.map((rule) => rule.confusion)).toEqual([
      { tp: 2, fp: 0, fn: 12, tn: 22 }, { tp: 2, fp: 2, fn: 12, tn: 20 }, { tp: 10, fp: 20, fn: 4, tn: 2 },
    ]);
    expect(byId.get("C-M6")!.anchorIcVectors).toEqual(["[6,5,4,3,2,1]"]);
    expect(byId.get("C-M6")!.satelliteIcVectors).toEqual(["[5,5,4,3,3,1]"]);
    expect(byId.get("C-M3")!.distributions.dPcSum).toEqual({ recorded: { "1": 12, "6": 2 }, unrecorded: { "4": 12, "6": 10 } });
    expect(retest.battery.candidates.every((candidate) => candidate.expectationHeld)).toBe(true);
  });

  it("pins the near-miss anatomy: 12 selected = all |dPc| = 1; the two misses are the |dPc| = 6 terminals", () => {
    const nearMiss = retest.nearMiss;
    expect(nearMiss.candidates).toEqual(["C-M3.r1 (absPcSumDeltaOne)", "C-M5.r1 (absLinearDisplacementOne)"]);
    expect(nearMiss.named).toBe("NEAR_MISS_BOUNDARY");
    expect(nearMiss.confusion).toEqual({ tp: 12, fp: 0, fn: 2, tn: 22 });
    expect(nearMiss.selectedKeys).toEqual([
      "127:191", "2111:1087", "2111:2143", "3103:2591", "3103:3119", "3599:3343",
      "3599:3607", "3847:3719", "3847:3851", "3971:3907", "3971:3973", "4033:4001",
    ]);
    expect(nearMiss.selectedAnatomy).toContain("single-semitone");
    expect(nearMiss.missedKeys).toEqual([
      { key: "127:253", dPcSum: 6, displacementLinear: 6, parentCount: 1 },
      { key: "4033:2017", dPcSum: 6, displacementLinear: 6, parentCount: 1 },
    ]);
    expect(nearMiss.missIdentity).toContain("terminal tritone");
    expect(nearMiss.nonContactShape).toContain("{4,6}");
    expect(nearMiss.rulingNote).toContain("no tie-break promotion");
  });

  it("pins the combination candidate: C-TB-R1 clean 14/0/0/22, recorded un-promoted, no branch effect", () => {
    const combination = retest.combination;
    expect(combination.id).toBe("C-TB-R1");
    expect(combination.expression).toContain("reach-singleton");
    expect(combination.expression).toContain("min-|delta| + reach-census");
    expect(combination.confusion).toEqual({ tp: 14, fp: 0, fn: 0, tn: 22 });
    expect(combination.status).toBe("UNPROMOTED_DISCOVERY");
    expect(combination.ruling).toContain("never promoted");
    expect(combination.branchEffect.startsWith("none")).toBe(true);
    expect(combination.mechanism).toContain("separation is not derivation");
  });

  it("pins the side-by-side comparison: all nine candidates match the landed battery; verdict REPLICATED", () => {
    const comparison = retest.comparison;
    expect(comparison.baseline.bl070.derivationFingerprint).toBe("9db10a088a05664a5cf60f6fad14514a4fc9aab278dcf0359d684bce70607731");
    expect(comparison.baseline.bl070.branch).toBe("PARTIAL_DERIVATION");
    expect(comparison.baseline.bl070.cleanSplitCount).toBe(0);
    expect(comparison.baseline.bl068.synthesisVerdict).toBe("DIFFERENT_PREDICATES");
    expect(comparison.sideBySide.map((entry) => entry.id)).toEqual(["C-M1", "C-M2", "C-M3", "C-M4", "C-M5", "C-M6", "C-M7", "C-M8", "C-M9"]);
    expect(comparison.sideBySide.every((entry) => entry.match)).toBe(true);
    expect(comparison.sideBySide.every((entry) => entry.verdictMatch && entry.distributionMatch)).toBe(true);
    expect(comparison.sideBySide.every((entry) => entry.subRuleMatches.every((rule) => rule.match))).toBe(true);
    const cM3 = comparison.sideBySide.find((entry) => entry.id === "C-M3")!;
    expect(cM3.subRuleMatches[0].originalConfusion).toEqual({ tp: 12, fp: 0, fn: 2, tn: 22 });
    expect(cM3.subRuleMatches[0].retestConfusion).toEqual({ tp: 12, fp: 0, fn: 2, tn: 22 });
    expect(comparison.domainComparison.bl068SetEqual).toBe(true);
    expect(comparison.domainComparison.bl070SetEqual).toBe(true);
    expect(comparison.domainComparison.perAnchorMatch).toBe(true);
    expect(comparison.nearMissComparison.confusionMatch).toBe(true);
    expect(comparison.combinationComparison.confusionMatch).toBe(true);
    expect(comparison.landedAxesCheck.zInterface.match).toBe(true);
    expect(comparison.landedAxesCheck.zInterface.bl068Confusion).toEqual({ tp: 4, fp: 2, fn: 10, tn: 20 });
    expect(comparison.allMatch).toBe(true);
    expect(comparison.verdict).toBe("REPLICATED");
    expect(comparison.interpretation.startsWith("REPLICATED:")).toBe(true);
    expect(comparison.replicationDiscipline).toContain("a different result means the candidates changed");
  });

  it("pins the region-scoped isolation: zero office bytes in the derivation path, the two-sided discipline", () => {
    const isolation = retest.isolation;
    expect(isolation.regime).toBe("region-scoped");
    expect(isolation.officeBytesInDerivationPath).toBe(0);
    expect(isolation.intrinsicRegion).toContain("mask-geometric candidate predicate definitions");
    expect(isolation.comparisonRegion).toContain("R-OFF calibration");
    expect(isolation.statements.some((statement) => statement.includes("zero granted-office bytes"))).toBe(true);
    expect(isolation.statements.some((statement) => statement.includes("region-scoping proof"))).toBe(true);
    expect(isolation.validatorDiscipline).toContain("permissive probe");
    expect(isolation.validatorDiscipline).toContain("region-scoping proof fails");
    expect(retest.fences.officeIsolation).toContain("target, never an input");
    expect(retest.fences.officeIsolation).toContain("halt");
  });

  it("pins the invariants, the orbital rotation, and the direction", () => {
    const invariants = retest.invariants;
    expect(invariants.pairCount).toBe(7);
    expect(invariants.allInClass).toBe(true);
    expect(invariants.allSumsSix).toBe(true);
    expect(invariants.allStatusShared).toBe(true);
    expect(invariants.allOrientationComplementary).toBe(true);
    expect(invariants.verdict).toBe("INVARIANTS_OBEYED");
    expect(invariants.pairs.every((pair) => pair.officeSum === "6")).toBe(true);
    expect(invariants.pairs.find((pair) => pair.a === "2017")).toMatchObject({ b: "253", officeSum: "6" });
    expect(invariants.derivationRespect.mechanicallyVerified).toBe(true);
    const orbital = retest.orbitalRotation;
    expect(orbital.perEdge.map((edge) => edge.rotateInterval)).toEqual([11, 11, 11, 11, 11, 11, 6]);
    expect(orbital.perEdge.map((edge) => edge.landedRotateInterval)).toEqual([11, 11, 11, 11, 11, 11, 6]);
    expect(orbital.exactRotationCount).toBe(7);
    expect(orbital.intervalHistogram).toEqual({ "11": 6, "6": 1 });
    expect(orbital.landedVerifiedAtD4Intervals).toBe(0);
    expect(orbital.refinement).toContain("interval-transport failure");
    expect(retest.direction.uniqueHub.resolved).toBe(2);
    expect(retest.direction.uniqueHub.keys).toEqual(["127:253", "4033:2017"]);
    expect(retest.direction.total).toBe(14);
  });

  it("pins the branch classification and the interpretation: PARTIAL_DERIVATION, R-NONE under REPLICATED", () => {
    const branch = retest.branch;
    expect(branch.preRegisteredLabels).toEqual(["FULL_DERIVATION", "PARTIAL_DERIVATION", "NO_DERIVATION"]);
    expect(branch.label).toBe("PARTIAL_DERIVATION");
    expect(branch.gateResults).toEqual({
      "V-D7D-1": "PASS", "V-D7D-2": "PASS", "V-D7D-3": "FAIL", "V-D7D-4": "PASS", "V-D7D-5": "PASS",
    });
    expect(retest.gates["V-D7D-1"].statement).toContain("set-equal");
    expect(retest.gates["V-D7D-2"].statement).toContain("R-OFF");
    expect(retest.gates["V-D7D-3"].statement).toContain("near-miss 12/0/2/22");
    expect(retest.gates["V-D7D-4"].statement).toContain("region-scoped");
    expect(retest.gates["V-D7D-5"].statement).toContain("three tiers");
    expect(branch.statement).toContain("office-field-dependent");
    expect(branch.statement).toContain("REPLICATED");
    expect(branch.classificationDiscipline).toContain("no unregistered hunting");
    expect(retest.interpretation.branch).toBe("R_NONE");
    expect(retest.interpretation.statement).toContain("joins the anchoring remainder");
    expect(retest.interpretation.framing).toContain("not a governs-admission claim");
  });

  it("pins the accounting tiers and the binding fences", () => {
    expect(retest.accounting.masksOnly.length).toBeGreaterThanOrEqual(4);
    expect(retest.accounting.canonicalComputation.length).toBeGreaterThanOrEqual(6);
    expect(retest.accounting.remainingGranted.length).toBeGreaterThanOrEqual(3);
    expect(retest.accounting.remainingGranted.some((item) => item.includes("office field as the selection's ground"))).toBe(true);
    expect(retest.accounting.statement).toContain("office field remains the selection's ground");
    expect(retest.fences.d7HypothesisTier).toContain("2703-2712");
    expect(retest.fences.officeIsolation).toContain("target, never an input");
    expect(retest.fences.membrane).toContain("never a probe input");
    expect(retest.fences.retestScope).toContain("BL-070's bytes are frozen");
    expect(retest.contractCitations.some((citation) => citation.includes("bl070-d7-derivation.v1.json"))).toBe(true);
    expect(retest.contractCitations.some((citation) => citation.includes("bl-068-d7-asymmetry"))).toBe(true);
    expect(retest.notAccomplished).toHaveLength(7);
    expect(retest.notAccomplished.some((item) => item.includes("no D7 claim event"))).toBe(true);
    expect(retest.notAccomplished.some((item) => item.includes("no BL-070 bytes changed"))).toBe(true);
  });
});
