import { describe, expect, it } from "vitest";

import investigation from "./generated/bl068-d7-asymmetry.v1.json";

describe("BL-068 D7 asymmetry investigation (census / axes / invariants / GSL-3) — pinned", () => {
  it("pins schema, status, fingerprint, source bindings and the chain anchors", () => {
    expect(investigation.schemaVersion).toBe("harmonic-orrery.bl068-d7-asymmetry.v1");
    expect(investigation.investigationId).toBe("BL068_D7_ASYMMETRY_V1");
    expect(investigation.status).toBe("planning_evidence");
    expect(investigation.generator).toBe("scripts/build-bl068-d7-asymmetry.mjs");
    expect(investigation.derivationFingerprint).toMatch(/^[0-9a-f]{64}$/);
    expect(investigation.sourceBindings).toHaveLength(8);
    expect(investigation.sourceBindings.every((binding) => /^[0-9a-f]{64}$/.test(binding.sha256))).toBe(true);
    expect(investigation.base.d4Hunt.huntFingerprint).toBe("8a1295ca9639fab7e16b980576954a1f12824d839e6743abebe176e3df23cac9");
    expect(investigation.base.zresidual.huntFingerprint).toBe("e1b3f655b7d79c67e2002ef2bf6da5db298bcd846306db6878896b3f24c4cd8a");
    expect(investigation.base.phaseC.probeFingerprint).toBe("5085e27404de2e591b146d38f289da660c6bc49041a54f073acafcbfe10f2f49");
  });

  it("pins the D7 census: 7 anchors, 14 contacts, the closed modal orbit, the 7-2 class", () => {
    expect(investigation.census.anchors.map((anchor) => `${anchor.anchor}:${anchor.office}`)).toEqual([
      "127:Jupiter", "2111:Saturn", "3103:Moon", "3599:Mercury", "3847:Venus", "3971:Sun", "4033:Mars",
    ]);
    expect(investigation.census.contacts).toHaveLength(14);
    expect(investigation.census.contacts.every((contact) => /^seat-contact:D7:/.test(contact.id))).toBe(true);
    expect(investigation.census.orbit.edges).toEqual([
      "127->2111", "2111->3103", "3103->3599", "3599->3847", "3847->3971", "3971->4033", "4033->127",
    ]);
    expect(investigation.census.orbit.closure).toContain("M(4033) = 127");
    expect(investigation.census.class72Census.count).toBe(14);
    expect(investigation.census.class72Census.allD6Satellites).toBe(true);
    expect(investigation.census.class72Census.setEqualToContacts).toBe(true);
    expect(investigation.census.class72Census.briefCorrection).toContain("59");
    expect(investigation.census.class72Census.briefCorrection).toContain("14");
  });

  it("pins Gate-0: the recorded layer collapses (14/0), the availability domain restores 36 = 14 + 22", () => {
    expect(investigation.census.recordedLayer.total).toBe(14);
    expect(investigation.census.recordedLayer.recorded).toBe(14);
    expect(investigation.census.recordedLayer.unrecorded).toBe(0);
    expect(investigation.census.recordedLayer.perAnchor).toHaveLength(7);
    expect(investigation.census.recordedLayer.perAnchor.every((entry) => entry.recordedCount === 2 && entry.unrecordedCount === 0)).toBe(true);
    expect(investigation.census.recordedLayer.perAnchor[0]).toMatchObject({ anchor: "127", office: "Jupiter", recorded: ["191", "253"] });
    const availability = investigation.census.availabilityDomain;
    expect(availability.domainSize).toBe(36);
    expect(availability.recordedCount).toBe(14);
    expect(availability.unrecordedCount).toBe(22);
    expect(availability.perAnchorRange).toBe("4..6");
    expect(availability.perAnchor.map((entry) => `${entry.anchor}:${entry.totalInstances}`)).toEqual([
      "127:4", "2111:5", "3103:6", "3599:6", "3847:6", "3971:5", "4033:4",
    ]);
    expect(availability.deltaCounts).toEqual({ "2": 11, "5": 11 });
    expect(availability.multiplicity).toEqual({ "1": 2, "2": 2, "3": 10 });
    expect(availability.distinctStates).toBe(14);
    expect(availability.perAnchor[0].instances).toEqual([
      { key: "127:191", officeDelta: "0", orientation: "A", satellite: "191", satelliteOffice: "Jupiter", status: "recorded" },
      { key: "127:253", officeDelta: "0", orientation: "B", satellite: "253", satelliteOffice: "Jupiter", status: "recorded" },
      { key: "127:1087", officeDelta: "2", orientation: "B", satellite: "1087", satelliteOffice: "Saturn", status: "unrecorded" },
      { key: "127:2143", officeDelta: "2", orientation: "A", satellite: "2143", satelliteOffice: "Saturn", status: "unrecorded" },
    ]);
    expect(investigation.census.gate0).toMatchObject({
      contactsEqualToRecordedRelations: true,
      contactsSubsetOfAvailability: true,
      domainSize: 36,
      unrecordedCount: 22,
    });
    expect(investigation.census.gate0.perAnchorUnrecorded).toEqual(["127:2", "2111:3", "3103:4", "3599:4", "3847:4", "3971:3", "4033:2"]);
    expect(investigation.census.gate0.firstFinding).toContain("governed-but-unreached");
    expect(investigation.census.gate0.firstFinding).toContain("reached-but-office-excluded");
  });

  it("pins the D4 comparison: two-class A1 vs single-class D6, office-flat grant, mirror-reversed remainders", () => {
    const comparison = investigation.d4Comparison;
    expect(comparison.grantLayer).toMatchObject({ uKeyCount: 28, observedKeyCount: 14, unobservedKeyCount: 14 });
    expect(comparison.grantLayer.classes).toEqual({ "7-27": 14, "7-31": 14 });
    expect(comparison.targetTiers.d4TargetTier).toMatchObject({ tier: "A1", population: 28, classMultiplicity: 2 });
    expect(comparison.targetTiers.d7TargetTier).toMatchObject({ tier: "D6", population: 14, classMultiplicity: 1 });
    expect(comparison.targetTiers.d4OwnTier.classes).toEqual({ "7-13": 14, "7-16": 14 });
    expect(comparison.anchorResiduals.d4ResidualPerAnchor.every((entry) => entry.unassigned === 4)).toBe(true);
    expect(comparison.anchorResiduals.d7ResidualPerAnchor.every((entry) => entry.unassigned === 0)).toBe(true);
    expect(comparison.availabilityMirror.d4Reach27Total).toBe(12);
    expect(comparison.availabilityMirror.d4Reach31Total).toBe(0);
    expect(comparison.availabilityMirror.d4Reach.find((entry) => entry.anchor === "2363")?.reach27).toEqual(["1339", "2395"]);
    expect(comparison.availabilityMirror.d4Reach.find((entry) => entry.anchor === "631")?.reach27).toEqual(["695"]);
    expect(comparison.invariantsRecomputed.d4Pairs).toHaveLength(7);
    expect(comparison.invariantsRecomputed.officeSums).toEqual(["6"]);
    expect(comparison.landedD7Measurements.literalPredicate).toContain("0/14");
    expect(comparison.landedD7Measurements.cycleTwinVerification).toContain("0/7");
    expect(comparison.landedD7Measurements.gapNote).toContain("U equals the contact set O by construction");
  });

  it("pins axis 1 (native set-class hunt): RESTATEMENT_UNIFORM over the single-class domain", () => {
    const axis = investigation.axes[0];
    expect(axis.axis).toBe("nativeSetClassHunt");
    expect(axis.verdict).toBe("RESTATEMENT_UNIFORM");
    expect(axis.confusion).toEqual({ tp: 14, fp: 22, fn: 0, tn: 0 });
    expect(axis.hit).toBe(14);
    expect(axis.split).toBe(false);
    expect(axis.values).toEqual({ observed: { "7-2": 14 }, unobserved: { "7-2": 22 } });
    expect(axis.intervalVectorSet).toEqual(["5,5,4,3,3,1"]);
    expect(axis.subFinding).toContain("the class is the domain");
  });

  it("pins axis 2 (office-linking / modal remainder): CLEAN_SPLIT with the modal-bounded complement", () => {
    const axis = investigation.axes[1];
    expect(axis.axis).toBe("officeLinkingModalRemainder");
    expect(axis.verdict).toBe("CLEAN_SPLIT");
    expect(axis.confusion).toEqual({ tp: 14, fp: 0, fn: 0, tn: 22 });
    expect(axis.hit).toBe(36);
    expect(axis.split).toBe(true);
    expect(axis.values).toEqual({ observed: { "0": 14 }, unobserved: { "2": 11, "5": 11 } });
    expect(axis.remainder!.deltaCounts).toEqual({ "2": 11, "5": 11 });
    expect(axis.remainder!.modalStep).toContain("+2 mod 7");
    expect(axis.remainder!.statement).toContain("modal-adjacent office");
  });

  it("pins axis 3 (Z-interface): NON_SEPARATING — the D4 polarization does not extend", () => {
    const axis = investigation.axes[2];
    expect(axis.axis).toBe("zInterface");
    expect(axis.verdict).toBe("NON_SEPARATING");
    expect(axis.confusion).toEqual({ tp: 4, fp: 2, fn: 10, tn: 20 });
    expect(axis.hit).toBe(24);
    expect(axis.split).toBe(false);
    const zMajority = axis.stateCensus!.filter((entry) => entry.sign < 0).map((entry) => entry.state);
    expect(zMajority).toEqual(["191", "2017", "253", "4001"]);
    expect(axis.stateCensus!).toHaveLength(14);
    expect(axis.stateCensus!.find((entry) => entry.state === "1087")).toMatchObject({ office: "Saturn", nonZSum: 19, zSum: 13, sign: 6 });
    expect(axis.subFinding).toContain("fa-specific");
  });

  it("pins the invariant geography: 7/7 in-class pairs, all office sums 6, status shared, orientation-complementary", () => {
    const invariants = investigation.invariants;
    expect(invariants.pairCount).toBe(7);
    expect(invariants.allInClass).toBe(true);
    expect(invariants.allSumsSix).toBe(true);
    expect(invariants.allStatusShared).toBe(true);
    expect(invariants.allOrientationComplementary).toBe(true);
    expect(invariants.verdict).toBe("INVARIANTS_OBEYED");
    expect(invariants.pairs.every((pair) => pair.officeSum === "6")).toBe(true);
    expect(invariants.pairs.every((pair) => pair.orientations.length === 2)).toBe(true);
    expect(invariants.pairs.find((pair) => pair.a === "191")).toMatchObject({ b: "4001", aOffice: "Jupiter", bOffice: "Mars", officeSum: "6" });
    expect(invariants.pairs.find((pair) => pair.a === "3343" || pair.b === "3343")).toMatchObject({ aOffice: "Mercury", bOffice: "Mercury", officeSum: "6" });
    expect(invariants.subFinding).toContain("pole-universal");
  });

  it("pins the 7-2 control: 14 records, the class is the contact set, internal structure recorded", () => {
    expect(investigation.control.id).toBe("7-2-class-census");
    expect(investigation.control.ledgerCount).toBe(14);
    expect(investigation.control.satellites).toHaveLength(14);
    expect(investigation.control.satellites[0]).toMatchObject({ state: "1087", office: "Saturn", orientation: "7-2 orientation B", inversionPartner: "3973", sign: 6, appearances: 3 });
    expect(investigation.control.result).toContain("the class IS the contact set");
  });

  it("pins the synthesis: DIFFERENT_PREDICATES and the GSL-3 explanatory entry", () => {
    expect(investigation.synthesis.verdict).toBe("DIFFERENT_PREDICATES");
    expect(investigation.synthesis.preRegisteredVerdicts).toEqual(["DIFFERENT_PREDICATES", "SCOPED_NULL", "DOMAIN_MISMATCH"]);
    expect(investigation.synthesis.gsl3.id).toBe("GSL-3");
    expect(investigation.synthesis.gsl3.statement).toContain("predicate-axis divergence");
    expect(investigation.synthesis.gsl3.statement).toContain("two-class governed domain");
    expect(investigation.synthesis.gsl3.statement).toContain("single-class tier");
    expect(investigation.synthesis.gsl3.statement).toContain("pole-universal");
    expect(investigation.synthesis.gsl3.statement).toContain("fa-specific");
    expect(investigation.synthesis.gsl3.evidence).toHaveLength(6);
    expect(investigation.synthesis.asymmetry.fa).toContain("two-class");
    expect(investigation.synthesis.asymmetry.ti).toContain("single-class");
    expect(investigation.synthesis.premiseCarried).toContain("OD-68-0");
  });

  it("carries the binding fences and the bounded non-accomplishments", () => {
    expect(investigation.fences.d7HypothesisTier).toContain("2703-2712");
    expect(investigation.fences.governsAdmission).toContain("none");
    expect(investigation.fences.g1Intra330).toContain("untouched");
    expect(investigation.fences.membrane).toContain("never a probe input");
    expect(investigation.fences.domainLabel).toContain("constructed-comparison");
    for (const key of ["V-B68-1", "V-B68-2", "V-B68-3", "V-B68-4"] as const) {
      expect(investigation.gates[key].result).toBe("PASS");
    }
    expect(investigation.contractCitations.some((citation) => citation.includes("2703-2712"))).toBe(true);
    expect(investigation.contractCitations.some((citation) => citation.includes("bl-067-governs-semantic-synthesis"))).toBe(true);
    expect(investigation.notAccomplished).toHaveLength(7);
    expect(investigation.notAccomplished.some((item) => item.includes("no D7 claim event"))).toBe(true);
  });
});
