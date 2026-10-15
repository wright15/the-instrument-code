import { describe, expect, it } from "vitest";

import investigation from "./generated/bl089-anchoring-remainder-interaction.v1.json";

describe("BL-089 anchoring-remainder interaction probe — pinned", () => {
  it("pins the header, the chain anchors, the pre-registration, and the sanity gate", () => {
    expect(investigation.schemaVersion).toBe("harmonic-orrery.bl089-anchoring-remainder-interaction.v1");
    expect(investigation.investigationId).toBe("BL089_ANCHORING_REMAINDER_INTERACTION_V1");
    expect(investigation.status).toBe("planning_evidence");
    expect(investigation.generator).toBe("scripts/build-bl089-anchoring-remainder-interaction.mjs");
    expect(investigation.investigationFingerprint).toMatch(/^[0-9a-f]{64}$/);
    expect(investigation.base.bipartiteSha).toBe(
      "903eebf0e1122d8ba81971abcd7efc8ac934d3bfd7885b98b49e58ab0bbe3e41",
    );
    expect(investigation.base.chainFingerprints.bl063).toBe(
      "6d33c67be7b8f87b8ad2f964cd3560ebcbc1ec0dc6b2088ad1f223c35caff8c3",
    );
    expect(investigation.base.chainFingerprints.bl068).toBe(
      "b0d65bd6149978de4f5ef3f1a0b281d0f6324a81114e8aa9da07eda8ef5ef849",
    );
    expect(investigation.base.chainFingerprints.bl070).toBe(
      "9db10a088a05664a5cf60f6fad14514a4fc9aab278dcf0359d684bce70607731",
    );
    expect(investigation.base.chainFingerprints.bl078).toBe(
      "11644d401eff5ef951a2173f390041531743df682ad9c502f98a048c0f76e1b1",
    );
    expect(investigation.base.chainFingerprints.bl076).toBe(
      "81e6cf7211a94888c2adedeebc44674a6e4a78e5e8b3fc09bb7a8fd671569d1e",
    );
    expect(investigation.base.chainFingerprints.probe).toBe(
      "068f9007c7330f84b9654547da7d0be0593276053df98c3b9f7893426f03ab22",
    );
    expect(investigation.preRegistration.rulings.map((ruling) => ruling.id)).toEqual([
      "OD-89-1", "OD-89-2", "OD-89-3", "OD-89-4", "OD-89-5",
    ]);
    expect(investigation.preRegistration.operationalizations.map((op) => op.id)).toEqual([
      "OP-AR-1", "OP-AR-2", "OP-AR-3", "OP-AR-4",
    ]);
    expect(investigation.preRegistration.groundingCorrections.map((entry) => entry.id)).toEqual([
      "GC-1", "GC-2", "GC-3", "GC-4",
    ]);
    expect(investigation.preRegistration.decisionRule.tolerance).toContain("zero mismatches");
    expect(investigation.sanityGate).toMatchObject({
      id: "V-AR-0",
      block: "D7xD6",
      instances: 36,
      agreement: 14,
      confusion: { tp: 14, fp: 0, fn: 0, tn: 22 },
      verdict: "EXACT",
      seatContactSetEquality: true,
    });
    expect(investigation.grounding.receipt).toHaveLength(10);
  });

  it("pins the office field: support 308 = 70 + 238, the C = 4 mask rule, satellite = parent, the attachment histogram", () => {
    expect(investigation.officeField.support).toMatchObject({
      officeCarrying: 308,
      anchors: 70,
      satellites: 238,
      withheld: 154,
      withheldRoles: ["boundary"],
    });
    expect(investigation.officeField.orientationConstant.C).toBe(4);
    expect(investigation.officeField.anchorRule).toMatchObject({
      expression: "office(anchor) = (C - pcSum(mask)) mod 7",
      matches: 70,
      mismatches: 0,
    });
    expect(investigation.officeField.satelliteRule).toMatchObject({
      expression: "office(satellite) = office(governing anchor)",
      matches: 238,
      mismatches: 0,
    });
    expect(investigation.officeField.satelliteRule.pcSumDeltaHistogram).toEqual({
      "-6": 17, "-1": 102, "1": 102, "6": 17,
    });
    expect(investigation.officeField.midpointExtension.matches).toBe(7);
    expect(investigation.officeField.midpointExtension.A2).toContain("midZ7");
    expect(investigation.officeField.orbitStepLaw.tiers).toHaveLength(10);
    expect(investigation.officeField.orbitStepLaw.tiers.every((tier) => tier.landedHolds && tier.predictedHolds)).toBe(true);
    expect(investigation.officeField.orbitStepLaw.holds).toBe(true);
  });

  it("pins the census and OP-AR-1: 57 blocks / 1128 instances / 340 agreements; 11 exact, 33 degenerate, 13 partial, 0 near-exact", () => {
    expect(investigation.census.blocks).toBe(57);
    expect(investigation.census.instances).toBe(1128);
    expect(investigation.census.blockKeyOrder).toHaveLength(57);
    expect(investigation.opAR1.aggregate).toEqual({
      instances: 1128,
      agree: 340,
      blocks: 57,
      exact: 11,
      degenerate: 33,
      nearExact: 0,
      partial: 13,
    });
    expect(investigation.opAR1.blocks).toHaveLength(57);
    expect(investigation.opAR1.exactBlocks).toContain("A1xA1");
    expect(investigation.opAR1.exactBlocks).toContain("D6xD6");
    expect(investigation.opAR1.exactBlocks).not.toContain("D7xD6");
    expect(investigation.opAR1.sanityBlock).toBe("D7xD6 14/36 (PARTIAL; the landed BL-070/BL-078 domain)");
    expect(investigation.opAR1.nearExactBlocks).toEqual([]);
    const d7d6 = investigation.opAR1.blocks.find((block) => block.anchorTier === "D7" && block.satelliteTier === "D6")!;
    expect(d7d6.deltaHistogram).toEqual({ "0": 14, "2": 11, "5": 11 });
  });

  it("pins OP-AR-2: reconstruction exact on both sets (7/7), the A1 own-tier block exact, the A0 own-tier block partial", () => {
    const a0 = investigation.opAR2.sets.A0;
    const a1 = investigation.opAR2.sets.A1;
    expect(a0.reconstruction).toMatchObject({ matches: 7, mismatches: 0 });
    expect(a1.reconstruction).toMatchObject({ matches: 7, mismatches: 0 });
    expect(a0.census).toEqual({ instances: 96, agree: 42, rate: "42/96" });
    expect(a1.census).toEqual({ instances: 132, agree: 34, rate: "34/132" });
    expect(a0.ownTierBlock).toMatchObject({ n: 48, agree: 36, class: "PARTIAL" });
    expect(a1.ownTierBlock).toMatchObject({ n: 24, agree: 24, class: "EXACT" });
    expect(investigation.opAR2.dependence.reconstructionExactBoth).toBe(true);
    expect(investigation.opAR2.dependence.verdict).toBe("ANCHOR_SET_DEPENDENT");
    expect(investigation.opAR2.dependence.netRates).toEqual({ A0: "42/96", A1: "34/132" });
  });

  it("pins OP-AR-2's transport affinity: the D7<->A0 maps affine (5x+2 / 2x+4), the D6<->A1 maps non-affine", () => {
    const affinity = investigation.opAR2.dependence.transportAffinity;
    expect(affinity.T1["A0->7-1"]).toMatchObject({ affine: true, expression: "y = 5x + 2 (mod 7)" });
    expect(affinity.T1["A1->7-8"].affine).toBe(false);
    expect(affinity.T2["A0->7-1"]).toMatchObject({ affine: true, expression: "y = 2x + 4 (mod 7)" });
    expect(affinity.T2["A1->7-8"].affine).toBe(false);
    expect(affinity.T1["A0->7-1"].map).toEqual({ "0": 2, "1": 0, "2": 5, "3": 3, "4": 1, "5": 6, "6": 4 });
    expect(affinity.T1["A1->7-8"].map).toEqual({ "0": 4, "1": 0, "2": 5, "3": 3, "4": 1, "5": 6, "6": 2 });
  });

  it("pins OP-AR-3: block-constant on all 30 anchor-family checks; the involution pairs and fixed families well-defined", () => {
    expect(investigation.opAR3.verdict).toBe("BLOCK_CONSTANT_ON_ANCHOR_FAMILIES");
    expect(investigation.opAR3.anchorFamiliesConstant).toBe(true);
    expect(investigation.opAR3.anchorFamilyChecks).toHaveLength(30);
    expect(investigation.opAR3.anchorFamilyChecks.every((entry) => entry.wellDefined && entry.wholePermutation && entry.fixesOfficeThree)).toBe(true);
    expect(investigation.opAR3.involutionPairChecks).toHaveLength(3);
    expect(investigation.opAR3.involutionPairChecks.every((pair) =>
      pair.T1.left && pair.T1.right && pair.T2.left && pair.T2.right && pair.RHO.left && pair.RHO.right)).toBe(true);
    expect(investigation.opAR3.fixedFamilyChecks).toHaveLength(4);
    expect(investigation.opAR3.fixedFamilyChecks.every((entry) => entry.T1 && entry.T2 && entry.RHO)).toBe(true);
    expect(investigation.opAR3.klein4.pairs).toEqual([["7-35", "7-1"], ["7-34", "7-8"], ["7-Z37", "7-Z17"]]);
    expect(investigation.opAR3.klein4.fixed).toEqual(["7-33", "7-22", "7-15", "7-Z12"]);
  });

  it("pins OP-AR-3's satellite-side fragment loci: 14 coarse fragments (T1/T2 on seven families), RHO clean", () => {
    expect(investigation.opAR3.satelliteFragmentLoci).toEqual([
      "T1:7-11", "T1:7-16", "T1:7-20", "T1:7-26", "T1:7-28", "T1:7-32", "T1:7-6",
      "T2:7-11", "T2:7-16", "T2:7-20", "T2:7-26", "T2:7-28", "T2:7-32", "T2:7-6",
    ]);
    expect(investigation.opAR3.satelliteTransports.every((entry) => entry.mapId !== "RHO" || entry.wellDefined)).toBe(true);
  });

  it("pins OP-AR-4: INTERACTION_DERIVED — the field node-by-node, the agreement field instance-by-instance, every pattern", () => {
    expect(investigation.opAR4.verdict).toBe("INTERACTION_DERIVED");
    expect(investigation.opAR4.tolerance).toContain("zero mismatches");
    expect(investigation.opAR4.stageA.blockInventory).toEqual({ blocks: 57, instances: 1128, matched: true });
    expect(investigation.opAR4.stageA.fieldSupport).toEqual({ officeCarrying: 308, withheld: 154, matched: true });
    expect(investigation.opAR4.stageB.anchorsMatched).toBe(70);
    expect(investigation.opAR4.stageB.satellitesMatched).toBe(238);
    expect(investigation.opAR4.stageB.anchorMismatches).toEqual([]);
    expect(investigation.opAR4.stageB.satelliteMismatches).toEqual([]);
    expect(investigation.opAR4.comparisons).toEqual({
      officeField: { anchors: "70/70", satellites: "238/238", mismatches: 0 },
      agreementField: { instances: 1128, mismatches: 0 },
      opAR1Blocks: { blocks: 57, mismatches: [], aggregateMatch: true },
      opAR2: { match: true },
      opAR3: { match: true },
    });
  });

  it("pins the synthesis: the verdict, the remainder statement, the significance, and the D7 tier fence", () => {
    expect(investigation.synthesis.verdict).toBe("INTERACTION_DERIVED");
    expect(investigation.synthesis.findings).toHaveLength(9);
    expect(investigation.synthesis.remainderStatement).toContain("shrinks");
    expect(investigation.synthesis.remainderStatement).toContain("exactly zero");
    expect(investigation.synthesis.significance).toContain("provenance-independence");
    expect(investigation.synthesis.d7Tier).toContain("hypothesis-tier");
  });

  it("pins the grounding: the family-table cross-check 30/30 and the calibration block", () => {
    expect(investigation.grounding.familyTableCrossCheck).toMatchObject({ rows: 30, mismatches: 0 });
    expect(investigation.grounding.calibration).toEqual({
      sanityGate: "EXACT (V-AR-0)",
      anchorRule: "70/70",
      satelliteRule: "238/238",
      orbitStepLaw: "10/10 tiers",
      a2Midpoint: "7/7",
    });
  });

  it("pins the three-tier accounting and the fences", () => {
    expect(investigation.accounting.masksOnly).toHaveLength(4);
    expect(investigation.accounting.canonicalComputation).toHaveLength(5);
    expect(investigation.accounting.remainingGranted).toHaveLength(3);
    expect(investigation.accounting.remainingGranted[1]).toContain("C = 4");
    expect(investigation.accounting.officePathFence).toContain("zero office bytes");
    expect(investigation.fences.d7HypothesisTier).toContain("ENTRY 15");
    expect(investigation.fences.noGovernsAdmission).toContain("no GOVERNS admission");
    expect(investigation.fences.noClaimEvent).toContain("byte-untouched");
    expect(investigation.fences.noMechanism).toContain("characterized");
    expect(investigation.fences.noLeaning).toContain("no leaning");
    expect(investigation.fences.membrane).toContain("never a probe input");
    expect(investigation.fences.sessionProse).toContain("context, not evidence");
    expect(investigation.fences.sanityHalt).toContain("halt");
  });

  it("pins the GSL treatment: the inline un-promoted candidate draft, no new number", () => {
    expect(investigation.gslTreatment.candidateDraft.status).toBe("GSL-9 candidate draft (un-promoted, inline, unapplied)");
    expect(investigation.gslTreatment.candidateDraft.text).toContain("(C - pcSum) mod 7");
    expect(investigation.gslTreatment.newEntry).toContain("no new GSL number");
  });

  it("pins the refutation conditions and the verdict classes", () => {
    expect(investigation.preRegistration.refutationConditions.map((entry) => entry.id)).toEqual([
      "R-AR-1", "R-AR-2", "R-AR-3", "R-AR-4",
    ]);
    expect(investigation.preRegistration.decisionRule.verdictClasses).toEqual([
      "INTERACTION_DERIVED", "INTERACTION_REMAINDER", "INTERACTION_MIXED",
    ]);
    expect(investigation.preRegistration.decisionRule.exactnessPredicate).toContain("agree = n");
    expect(investigation.preRegistration.decisionRule.blockConstancy).toContain("well-defined function");
  });

  it("pins the source bindings and the method", () => {
    expect(investigation.sourceBindings).toHaveLength(10);
    expect(investigation.sourceBindings.every((binding) => /^[0-9a-f]{64}$/.test(binding.sha256))).toBe(true);
    expect(investigation.method.domain).toContain("1128 instances");
    expect(investigation.method.codeReuse).toContain("masks-only");
    expect(investigation.contractCitations.length).toBeGreaterThanOrEqual(10);
  });
});
