import { describe, expect, it } from "vitest";

import probe from "./generated/bl076-bijection-probe.v1.json";

describe("BL-076 coordinate-covariant bijection probe — pinned", () => {
  it("pins schema, status, fingerprint, source bindings, the chain anchors and the pre-registration", () => {
    expect(probe.schemaVersion).toBe("harmonic-orrery.bl076-bijection-probe.v1");
    expect(probe.investigationId).toBe("BL076_BIJECTION_PROBE_V1");
    expect(probe.status).toBe("planning_evidence");
    expect(probe.generator).toBe("scripts/build-bl076-bijection-probe.mjs");
    expect(probe.investigationFingerprint).toMatch(/^[0-9a-f]{64}$/);
    expect(probe.sourceBindings).toHaveLength(4);
    expect(probe.sourceBindings.every((binding) => /^[0-9a-f]{64}$/.test(binding.sha256))).toBe(true);
    expect(probe.base.bl075.investigationFingerprint).toBe(
      "88838e225276432427f2a7c765d8e1f9105c5c6bd87d4db04ef5e1bb2e93704e",
    );
    expect(probe.base.bl068.derivationFingerprint).toBe(
      "b0d65bd6149978de4f5ef3f1a0b281d0f6324a81114e8aa9da07eda8ef5ef849",
    );
    expect(probe.base.bl061_062.huntFingerprint).toBe(
      "e1b3f655b7d79c67e2002ef2bf6da5db298bcd846306db6878896b3f24c4cd8a",
    );
    expect(probe.preRegistration.rulings.map((ruling) => ruling.id)).toEqual([
      "OD-76-1", "OD-76-2", "OD-76-3", "OD-76-4",
    ]);
    expect(probe.preRegistration.reframing).toContain("family-level");
    expect(probe.preRegistration.expectation.familyInvolution.pairs).toEqual([
      ["7-1", "7-35"], ["7-8", "7-34"], ["7-Z37", "7-Z17"],
    ]);
    expect(probe.preRegistration.expectation.familyInvolution.fixed).toEqual(["7-22", "7-15", "7-Z12", "7-33"]);
    expect(probe.preRegistration.expectation.zStructure.zPartnerPair).toEqual(["7-Z37", "7-Z17"]);
    expect(probe.preRegistration.expectation.zStructure.prediction).toContain("Z-partners map to Z-partners");
    expect(Object.keys(probe.preRegistration.gates).sort()).toEqual(["V-BC-1", "V-BC-2", "V-BC-3", "V-BC-4"]);
    expect(probe.preRegistration.branchTable.predicted).toContain("COVARIANT_CONFIRMED");
  });

  it("pins the family-level permutation tables: the involution for T1/T2, trivial for RHO/ID", () => {
    const expectedInvolution = [
      { tier: "A0", sourceFamily: "7-35", imageFamily: "7-1", imageTier: "D7" },
      { tier: "A1", sourceFamily: "7-34", imageFamily: "7-8", imageTier: "D6" },
      { tier: "A2", sourceFamily: "7-33", imageFamily: "7-33", imageTier: "A2" },
      { tier: "D1", sourceFamily: "7-22", imageFamily: "7-22", imageTier: "D1" },
      { tier: "D2", sourceFamily: "7-15", imageFamily: "7-15", imageTier: "D2" },
      { tier: "D3", sourceFamily: "7-Z37", imageFamily: "7-Z17", imageTier: "D4" },
      { tier: "D4", sourceFamily: "7-Z17", imageFamily: "7-Z37", imageTier: "D3" },
      { tier: "D5", sourceFamily: "7-Z12", imageFamily: "7-Z12", imageTier: "D5" },
      { tier: "D6", sourceFamily: "7-8", imageFamily: "7-34", imageTier: "A1" },
      { tier: "D7", sourceFamily: "7-1", imageFamily: "7-35", imageTier: "A0" },
    ];
    expect(probe.probe.familyPermutation.T1).toEqual(expectedInvolution);
    expect(probe.probe.familyPermutation.T2).toEqual(expectedInvolution);
    const identity = expectedInvolution.map((row) => ({ ...row, imageFamily: row.sourceFamily, imageTier: row.tier }));
    expect(probe.probe.familyPermutation.RHO).toEqual(identity);
    expect(probe.probe.familyPermutation.ID).toEqual(identity);
    expect(probe.probe.expectationCheck).toEqual({ exact: true, mismatches: [] });
  });

  it("pins the office permutation tables: T1/T2 move offices, RHO is the pc-reflection office permutation, ID is identity", () => {
    const officeTables = probe.probe.officePermutation as unknown as Record<
      string,
      Record<string, Array<{ office: string; imageOffice: string | null }>>
    >;
    const officesOf = (mapId: string, tier: string) => officeTables[mapId][tier].map(
      (entry) => `${entry.office}->${entry.imageOffice}`,
    );
    expect(officesOf("T1", "A0")).toEqual([
      "Sun->Mars", "Moon->Sun", "Mars->Venus", "Mercury->Mercury",
      "Jupiter->Moon", "Venus->Saturn", "Saturn->Jupiter",
    ]);
    expect(officesOf("T1", "A1")).toEqual([
      "Sun->Jupiter", "Moon->Sun", "Mars->Venus", "Mercury->Mercury",
      "Jupiter->Moon", "Venus->Saturn", "Saturn->Mars",
    ]);
    expect(officesOf("T2", "A0")).toEqual([
      "Sun->Jupiter", "Moon->Saturn", "Mars->Moon", "Mercury->Mercury",
      "Jupiter->Venus", "Venus->Sun", "Saturn->Mars",
    ]);
    expect(officesOf("RHO", "A0")).toEqual([
      "Sun->Saturn", "Moon->Venus", "Mars->Jupiter", "Mercury->Mercury",
      "Jupiter->Mars", "Venus->Moon", "Saturn->Sun",
    ]);
    expect(officesOf("ID", "A0")).toEqual([
      "Sun->Sun", "Moon->Moon", "Mars->Mars", "Mercury->Mercury",
      "Jupiter->Jupiter", "Venus->Venus", "Saturn->Saturn",
    ]);
    for (const mapId of ["T1", "T2", "RHO", "ID"]) {
      for (const tier of probe.probe.anchorTiers) {
        const imageOffices = officeTables[mapId][tier]
          .map((entry) => entry.imageOffice).filter((office) => office !== null);
        expect(new Set(imageOffices).size).toBe(7);
      }
    }
    expect(probe.probe.officeFaithfulness.movedCounts).toEqual({ T1: 56, T2: 52, RHO: 60, ID: 0 });
    expect(probe.probe.officeFaithfulness.faithful).toBe(true);
  });

  it("pins the anchor census, the anchor images and the zero-fragment audit", () => {
    expect(probe.probe.anchorCensus).toEqual({ anchors: 70, perTier: 7, dAnchors: 49, aAnchors: 21 });
    const anchorImages = probe.probe.anchorImages as unknown as Record<string, unknown[]>;
    for (const mapId of ["T1", "T2", "RHO", "ID"]) {
      expect(anchorImages[mapId]).toHaveLength(70);
    }
    const audit = probe.probe.fragmentAudit;
    expect(audit.familyFragments).toEqual([]);
    expect(audit.absentMasks).toEqual([]);
    expect(audit.officeFragments).toEqual([]);
    expect(audit.fragmentCount).toBe(0);
    expect(audit.absentCount).toBe(0);
    expect(audit.wholeFamilyBlocks).toBe(40);
    expect(audit.familyBlockCount).toBe(40);
    expect(audit.wholeOfficeTiers).toBe(40);
    expect(audit.officeTierCount).toBe(40);
  });

  it("pins the Klein-4 composition consistency at both table levels", () => {
    const composition = probe.probe.compositionConsistency;
    expect(composition.familyLevel).toEqual({ pairCount: 16, checkCount: 160, mismatchCount: 0, consistent: true, failures: [] });
    expect(composition.officeLevel).toEqual({ pairCount: 16, checkCount: 1120, mismatchCount: 0, consistent: true, failures: [] });
    expect(composition.verified).toBe(true);
    expect(composition.involutions).toEqual([
      { expression: "T1 o T1", result: "ID" },
      { expression: "T2 o T2", result: "ID" },
      { expression: "RHO o RHO", result: "ID" },
      { expression: "T1 o T2 = T2 o T1", result: "RHO" },
    ]);
  });

  it("pins the interval structure of the pairing: the Z-pair maps within its class, the other pairs cross classes", () => {
    const z = probe.probe.zStructure;
    expect(z.familyCount).toBe(38);
    expect(z.pairs).toEqual([
      { pair: ["7-1", "7-35"], sameIv: false, classification: "IV-unique to IV-unique", predicted: "IV-unique to IV-unique", matches: true },
      { pair: ["7-8", "7-34"], sameIv: false, classification: "IV-unique to IV-unique", predicted: "IV-unique to IV-unique", matches: true },
      { pair: ["7-Z37", "7-Z17"], sameIv: true, classification: "Z-partner (IV-shared)", predicted: "Z-partner (IV-shared)", matches: true },
    ]);
    expect(z.sharedIvClasses).toEqual([
      { iv: [4, 4, 4, 3, 4, 2], families: ["7-Z12", "7-Z36"] },
      { iv: [4, 3, 4, 5, 4, 1], families: ["7-Z17", "7-Z37"] },
      { iv: [4, 3, 4, 4, 4, 2], families: ["7-Z18", "7-Z38"] },
    ]);
    expect(z.ivUniqueChecks).toEqual([
      { family: "7-1", iv: [6, 5, 4, 3, 2, 1], ivUnique: true },
      { family: "7-35", iv: [2, 5, 4, 3, 6, 1], ivUnique: true },
      { family: "7-8", iv: [4, 5, 4, 4, 2, 2], ivUnique: true },
      { family: "7-34", iv: [2, 5, 4, 4, 4, 2], ivUnique: true },
    ]);
    expect(z.zPairSameIv).toBe(true);
    expect(z.zPairExclusive).toBe(true);
    expect(z.verified).toBe(true);
    expect(z.statement).toContain("IV-shared");
  });

  it("pins the fa/ti crossing: D7<->A0 and D6<->A1 present in both directions, the D3<->D4 interior swap", () => {
    const crossing = probe.probe.crossing;
    expect(crossing.pairs).toEqual([
      { from: "D7", to: "A0", family: "7-1", imageFamily: "7-35", imageTier: "A0", reverseFamily: "7-35", reverseImageFamily: "7-1", matches: true },
      { from: "D6", to: "A1", family: "7-8", imageFamily: "7-34", imageTier: "A1", reverseFamily: "7-34", reverseImageFamily: "7-8", matches: true },
    ]);
    expect(crossing.interiorSwap).toEqual({ pair: ["D3", "D4"], forward: "7-Z17", reverse: "7-Z37" });
    expect(crossing.verified).toBe(true);
    expect(crossing.statement).toContain("fa/ti");
  });

  it("pins the branch verdict: COVARIANT_CONFIRMED, probe-verified, the claim scope conditionally set", () => {
    expect(probe.branch.preRegisteredLabels).toEqual([
      "COVARIANT_CONFIRMED", "COVARIANT_PARTIAL", "COVARIANT_REFUTED",
    ]);
    expect(probe.branch.fired).toEqual(["COVARIANT_CONFIRMED"]);
    expect(probe.branch.label).toBe("COVARIANT_CONFIRMED");
    expect(probe.branch.predicted).toBe("COVARIANT_CONFIRMED");
    expect(probe.branch.matchesPrediction).toBe(true);
    expect(probe.branch.statement).toContain("COVARIANT_CONFIRMED");
    expect(probe.branch.statement).toContain("separately gated");
    expect(probe.finding.tier).toBe("probe-verified");
    expect(probe.finding.statement).toContain("coordinate-covariant");
    expect(probe.finding.claimScope).toContain("may include the tier-to-family correspondence's derivability");
    expect(probe.finding.claimScope).toContain("does not fire in this probe build");
  });

  it("pins the four gates: V-BC-1..V-BC-4 all PASS", () => {
    const gates = probe.gates as Record<string, { result: string; statement: string }>;
    for (const gate of ["V-BC-1", "V-BC-2", "V-BC-3", "V-BC-4"]) {
      expect(gates[gate].result).toBe("PASS");
    }
    expect(gates["V-BC-1"].statement).toContain("49 D-tier anchors");
    expect(gates["V-BC-1"].statement).toContain("28 D-tier blocks whole");
    expect(gates["V-BC-2"].statement).toContain("21 A-tier anchors");
    expect(gates["V-BC-3"].statement).toContain("16 map pairs");
    expect(gates["V-BC-4"].statement).toContain("both directions");
  });

  it("pins the cross-checks, the map catalog and the chain key-for-key", () => {
    const cross = probe.crossChecks;
    expect(cross.bl075Anchor.matchesDerived).toBe(true);
    expect(cross.bl068Anchor.matchesDerived).toBe(true);
    expect(cross.bl061062Anchor.matchesDerived).toBe(true);
    expect(cross.bl061062Anchor.tiers.map((entry) => `${entry.tier}:${entry.family}`)).toEqual([
      "D1:7-22", "D2:7-15", "D3:7-Z37", "D4:7-Z17", "D5:7-Z12", "D6:7-8", "D7:7-1",
    ]);
    expect(cross.chainFingerprints.bl075).toBe(
      "88838e225276432427f2a7c765d8e1f9105c5c6bd87d4db04ef5e1bb2e93704e",
    );
    expect(cross.chainFingerprints.bl068).toBe(
      "b0d65bd6149978de4f5ef3f1a0b281d0f6324a81114e8aa9da07eda8ef5ef849",
    );
    expect(cross.chainFingerprints.bl061_062).toBe(
      "e1b3f655b7d79c67e2002ef2bf6da5db298bcd846306db6878896b3f24c4cd8a",
    );
    expect(probe.probe.mapCatalog.map((map) => `${map.id}:${map.unit}:${map.translation}`)).toEqual([
      "T1:5:0", "T2:7:0", "RHO:11:0", "ID:1:0",
    ]);
    expect(probe.probe.mapCatalog.every((map) => typeof map.role === "string" && map.role.length > 0)).toBe(true);
  });

  it("pins the accounting tiers, the binding gate, the fences and the bounded non-accomplishments", () => {
    expect(probe.accounting.masksOnly.length).toBeGreaterThanOrEqual(3);
    expect(probe.accounting.canonicalComputation.length).toBeGreaterThanOrEqual(3);
    expect(probe.accounting.remainingGranted.length).toBeGreaterThanOrEqual(3);
    expect(probe.bindingGate.status).toBe("SEPARATELY_GATED");
    expect(probe.bindingGate.statement).toContain("OD-76-4");
    expect(probe.fences.d7HypothesisTier).toContain("2703-2712");
    expect(probe.fences.measurementOnly).toContain("bijection probe is measurement");
    expect(probe.fences.governsAdmission).toContain("separately gated");
    expect(probe.fences.membrane).toContain("never a probe input");
    expect(probe.fences.claimEvent).toContain("conditionally pre-authorized");
    expect(probe.notAccomplished.some((item) => item.includes("no claim event"))).toBe(true);
    expect(probe.notAccomplished.some((item) => item.includes("no GOVERNS admission"))).toBe(true);
    expect(probe.notAccomplished.some((item) => item.includes("OD-76-4"))).toBe(true);
    expect(probe.contractCitations.length).toBeGreaterThanOrEqual(10);
  });
});
