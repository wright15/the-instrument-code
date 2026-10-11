import { describe, expect, it } from "vitest";

import derivation from "./generated/bl070-d7-derivation.v1.json";

describe("BL-070 D7 derivation attempt (office-purity route) — pinned", () => {
  it("pins schema, status, fingerprint, source bindings, the chain anchor and the pre-registration", () => {
    expect(derivation.schemaVersion).toBe("harmonic-orrery.bl070-d7-derivation.v1");
    expect(derivation.derivationId).toBe("BL070_D7_DERIVATION_V1");
    expect(derivation.status).toBe("planning_evidence");
    expect(derivation.generator).toBe("scripts/build-bl070-d7-derivation.mjs");
    expect(derivation.derivationFingerprint).toMatch(/^[0-9a-f]{64}$/);
    expect(derivation.sourceBindings).toHaveLength(5);
    expect(derivation.sourceBindings.every((binding) => /^[0-9a-f]{64}$/.test(binding.sha256))).toBe(true);
    expect(derivation.base.bl068.derivationFingerprint).toBe("b0d65bd6149978de4f5ef3f1a0b281d0f6324a81114e8aa9da07eda8ef5ef849");
    expect(derivation.preRegistration.rulings.map((ruling) => ruling.id)).toEqual(["OD-70-1", "OD-70-2", "OD-70-3", "OD-70-4"]);
    expect(derivation.preRegistration.branchCriteria.partial).toContain("V-D7-2 FAIL");
    expect(derivation.preRegistration.buildNotes.some((note) => note.includes("127:253"))).toBe(true);
  });

  it("pins the domain derivation: 36 instances, per-anchor 4/5/6/6/6/5/4, distinct 14, the calibration control", () => {
    const domain = derivation.domainDerivation;
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
    expect(domain.comparison.bl068SetEqual).toBe(true);
    expect(domain.comparison.recordedCount).toBe(14);
    expect(domain.comparison.unrecordedCount).toBe(22);
    expect(domain.comparison.deltaCounts).toEqual({ "2": 11, "5": 11 });
  });

  it("pins the domain non-circularity: the derivation block carries no office or class fields", () => {
    const text = JSON.stringify(derivation.domainDerivation);
    expect(text).not.toMatch(/"office/i);
    expect(text).not.toMatch(/"forte/i);
    expect(text).not.toContain("Jupiter");
    expect(text).not.toContain("Saturn");
    expect(text).not.toContain("Moon");
    expect(derivation.domainDerivation.definition).toContain("The office field is not read here");
  });

  it("pins the battery: nine pre-registered candidates, no clean split, the two near-miss rules", () => {
    expect(derivation.battery.preRegisteredIds).toEqual(["C-M1", "C-M2", "C-M3", "C-M4", "C-M5", "C-M6", "C-M7", "C-M8", "C-M9"]);
    expect(derivation.battery.candidates).toHaveLength(9);
    expect(derivation.battery.summary.cleanSplitCount).toBe(0);
    expect(derivation.battery.summary.nearMissCandidates).toEqual(["C-M3", "C-M5"]);
    expect(derivation.battery.summary.verdict).toBe("NO_PRE_REGISTERED_CLEAN_SPLIT");
    const byId = new Map(derivation.battery.candidates.map((candidate) => [candidate.id, candidate]));
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
    expect(derivation.battery.candidates.every((candidate) => candidate.expectationHeld)).toBe(true);
  });

  it("pins the near-miss anatomy: 12 selected = all |dPc| = 1; the two misses are the |dPc| = 6 terminals", () => {
    const nearMiss = derivation.nearMiss;
    expect(nearMiss.named).toBe("NEAR_MISS_BOUNDARY");
    expect(nearMiss.candidates).toEqual(["C-M3.r1 (absPcSumDeltaOne)", "C-M5.r1 (absLinearDisplacementOne)"]);
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
    expect(nearMiss.rulingNote).toContain("OD-70-4");
  });

  it("pins the tie-break candidate: clean 14/0/0/22, recorded un-promoted, no branch effect", () => {
    const tieBreak = derivation.tieBreakCandidate;
    expect(tieBreak.id).toBe("C-TB-1");
    expect(tieBreak.expression).toContain("reach-singleton");
    expect(tieBreak.expression).toContain("min-|delta| + reach-census");
    expect(tieBreak.confusion).toEqual({ tp: 14, fp: 0, fn: 0, tn: 22 });
    expect(tieBreak.status).toBe("UNPROMOTED_DISCOVERY");
    expect(tieBreak.ruling).toContain("never promoted");
    expect(tieBreak.branchEffect.startsWith("none")).toBe(true);
    expect(tieBreak.mechanism).toContain("separation is not derivation");
  });

  it("pins the invariants: 7 whole pairs, sums 6, status shared, orientation-complementary, mechanically verified", () => {
    const invariants = derivation.invariants;
    expect(invariants.pairCount).toBe(7);
    expect(invariants.allInClass).toBe(true);
    expect(invariants.allSumsSix).toBe(true);
    expect(invariants.allStatusShared).toBe(true);
    expect(invariants.allOrientationComplementary).toBe(true);
    expect(invariants.verdict).toBe("INVARIANTS_OBEYED");
    expect(invariants.pairs.every((pair) => pair.officeSum === "6")).toBe(true);
    expect(invariants.pairs.find((pair) => pair.a === "2017")).toMatchObject({ b: "253", officeSum: "6" });
    expect(invariants.pairs.find((pair) => pair.a === "191")).toMatchObject({ b: "4001", aOffice: "Jupiter", bOffice: "Mars" });
    expect(invariants.derivationRespect.mechanicallyVerified).toBe(true);
    expect(invariants.derivationRespect.statement).toContain("whole pairs");
  });

  it("pins the orbital-rotation refinement: every edge an exact rotation (11×6, 6×1); the landed 0/7 is D4-interval-specific", () => {
    const orbital = derivation.orbitalRotation;
    expect(orbital.perEdge.map((edge) => edge.rotateInterval)).toEqual([11, 11, 11, 11, 11, 11, 6]);
    expect(orbital.perEdge.map((edge) => edge.landedRotateInterval)).toEqual([11, 11, 11, 11, 11, 11, 6]);
    expect(orbital.exactRotationCount).toBe(7);
    expect(orbital.intervalHistogram).toEqual({ "11": 6, "6": 1 });
    expect(orbital.d4VerificationIntervals).toEqual([1, 2]);
    expect(orbital.landedVerifiedAtD4Intervals).toBe(0);
    expect(orbital.refinement).toContain("root-normalization");
    expect(orbital.refinement).toContain("interval-transport failure");
  });

  it("pins the direction: unique-hub masks-only resolution 2/14, exactly the two near-miss misses", () => {
    expect(derivation.direction.uniqueHub.resolved).toBe(2);
    expect(derivation.direction.uniqueHub.keys).toEqual(["127:253", "4033:2017"]);
    expect(derivation.direction.uniqueHub.note).toContain("reach-singleton");
    expect(derivation.direction.total).toBe(14);
    expect(derivation.direction.tier).toContain("canonical-read");
  });

  it("pins the branch classification: PARTIAL_DERIVATION against the pre-registered gates", () => {
    const branch = derivation.branch;
    expect(branch.preRegisteredLabels).toEqual(["FULL_DERIVATION", "PARTIAL_DERIVATION", "NO_DERIVATION"]);
    expect(branch.label).toBe("PARTIAL_DERIVATION");
    expect(branch.gateResults).toEqual({
      "V-D7-1": "PASS", "V-D7-2": "FAIL", "V-D7-3": "PASS", "V-D7-4": "PASS", "V-D7-5": "PASS",
    });
    expect(derivation.gates["V-D7-1"].result).toBe("PASS");
    expect(derivation.gates["V-D7-2"].result).toBe("FAIL");
    expect(derivation.gates["V-D7-3"].statement).toContain("two-sided static check");
    expect(derivation.gates["V-D7-4"].statement).toContain("inversion-invariance");
    expect(derivation.gates["V-D7-5"].statement).toContain("three tiers");
    expect(branch.statement).toContain("office-field-dependent");
    expect(branch.classificationDiscipline).toContain("no unregistered hunting");
  });

  it("pins the accounting tiers and the binding fences", () => {
    expect(derivation.accounting.masksOnly.length).toBeGreaterThanOrEqual(4);
    expect(derivation.accounting.canonicalComputation.length).toBeGreaterThanOrEqual(4);
    expect(derivation.accounting.remainingGranted.length).toBeGreaterThanOrEqual(3);
    expect(derivation.accounting.remainingGranted.some((item) => item.includes("office field as the selection's ground"))).toBe(true);
    expect(derivation.fences.d7HypothesisTier).toContain("2703-2712");
    expect(derivation.fences.officeIsolation).toContain("target, never an input");
    expect(derivation.fences.membrane).toContain("never a probe input");
    expect(derivation.contractCitations.some((citation) => citation.includes("bl-068-d7-asymmetry"))).toBe(true);
    expect(derivation.notAccomplished).toHaveLength(7);
    expect(derivation.notAccomplished.some((item) => item.includes("no D7 claim event"))).toBe(true);
    expect(derivation.notAccomplished.some((item) => item.includes("no D7 record amendment"))).toBe(true);
  });
});
