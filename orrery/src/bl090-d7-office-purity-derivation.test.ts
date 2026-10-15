import { describe, expect, it } from "vitest";

import derivation from "./generated/bl090-d7-office-purity-derivation.v1.json";

describe("BL-090 D7 office-purity derivation — pinned", () => {
  it("pins the header, the chain anchors, and the pre-registration", () => {
    expect(derivation.schemaVersion).toBe("harmonic-orrery.bl090-d7-office-purity-derivation.v1");
    expect(derivation.derivationId).toBe("BL090_D7_OFFICE_PURITY_DERIVATION_V1");
    expect(derivation.status).toBe("planning_evidence");
    expect(derivation.generator).toBe("scripts/build-bl090-d7-office-purity-derivation.mjs");
    expect(derivation.derivationFingerprint).toMatch(/^[0-9a-f]{64}$/);
    expect(derivation.base.chainFingerprints).toEqual({
      bl063: "6d33c67be7b8f87b8ad2f964cd3560ebcbc1ec0dc6b2088ad1f223c35caff8c3",
      bl064: "aa975820136658dd2fb3c84d98b34bf7a1901d39edd6548a300f458858305918",
      bl066: "94f0661ff6e76b0dea69fbe9f09ead24da7901393fb735495f3a25c3d9a1a886",
      bl068: "b0d65bd6149978de4f5ef3f1a0b281d0f6324a81114e8aa9da07eda8ef5ef849",
      bl070: "9db10a088a05664a5cf60f6fad14514a4fc9aab278dcf0359d684bce70607731",
      bl078: "11644d401eff5ef951a2173f390041531743df682ad9c502f98a048c0f76e1b1",
      bl089: "eb1526bed7f333f83ce6f610b59e0d4ced933d2b8ad91579a63da2d7277e2fb0",
    });
    expect(derivation.preRegistration.rulings.map((ruling) => ruling.id)).toEqual([
      "OD-90-1", "OD-90-2", "OD-90-3",
    ]);
    expect(derivation.preRegistration.rule.id).toBe("R-kappa");
    expect(derivation.preRegistration.rule.expression).toContain("o_kappa(s) = o_kappa(h)");
    expect(derivation.preRegistration.refutationConditions.map((entry) => entry.id)).toEqual([
      "R-90-1", "R-90-2", "R-90-3", "R-90-4",
    ]);
    expect(derivation.preRegistration.kappaVerdictTable.both).toContain("over-determined");
    expect(Object.keys(derivation.preRegistration.kappaVerdictTable).sort()).toEqual(["both", "neither", "one"]);
  });

  it("pins the domain (V-D7D-1): 36 instances, per-anchor 4/5/6/6/6/5/4, the governing census, set-equal BL-068 + BL-070", () => {
    const domain = derivation.domainVerification;
    expect(domain.partition.anchors).toEqual(["127", "2111", "3103", "3599", "3847", "3971", "4033"]);
    expect(domain.partition.satellites).toHaveLength(14);
    expect(domain.partition.governingCensus).toHaveLength(7);
    expect(domain.partition.governingCensus.every((entry) => entry.satellites.length === 2)).toBe(true);
    expect(domain.partition.governingCensus.find((entry) => entry.parent === "381")!.satellites).toEqual(["191", "253"]);
    expect(domain.perAnchor.map((entry) => entry.count)).toEqual([4, 5, 6, 6, 6, 5, 4]);
    expect(domain.domainSize).toBe(36);
    expect(domain.distinctStates).toBe(14);
    expect(domain.multiplicity).toEqual({ "1": 2, "2": 2, "3": 10 });
    expect(domain.calibration.allLedgerReachUniform).toBe(true);
    expect(domain.calibration.allLedgerReachPerAnchor.every((entry) => entry.count === 30)).toBe(true);
    expect(domain.setEquality.bl068SetEqual).toBe(true);
    expect(domain.setEquality.bl070SetEqual).toBe(true);
    expect(domain.setEquality.contactsSubsetOfDerivedDomain).toBe(true);
  });

  it("pins the calibration (V-D7D-2): R-OFF 14/0/0/22 CLEAN_SPLIT on the granted labels", () => {
    expect(derivation.calibration.rule.id).toBe("R-OFF");
    expect(derivation.calibration.confusion).toEqual({ tp: 14, fp: 0, fn: 0, tn: 22 });
    expect(derivation.calibration.verdict).toBe("CLEAN_SPLIT");
    expect(derivation.calibration.exact).toBe(true);
    expect(derivation.calibration.licence).toContain("domain would be wrong, not the rule");
  });

  it("pins the kappa recovery: C = 4, kappa1 7/7, the A1 midpoints 7/7, the block field 28/28", () => {
    const recovery = derivation.kappaGrounding.kappaRecovery;
    expect(recovery.orientationConstant.C).toBe(4);
    expect(recovery.kappa1MatchesCanonical).toBe(7);
    expect(recovery.midpointMatchesCanonical).toBe(7);
    expect(recovery.p7Endpoints).toEqual([1387, 2773]);
    expect(recovery.a0Recovered.find((entry) => entry.id === "1387")!.kappa1).toBe(6);
    expect(recovery.a1Recovered).toEqual([
      { canonical: 0, g1: 0, id: "1371", match: true },
      { canonical: 5, g1: 5, id: "1389", match: true },
      { canonical: 3, g1: 3, id: "1461", match: true },
      { canonical: 4, g1: 4, id: "1707", match: true },
      { canonical: 1, g1: 1, id: "1749", match: true },
      { canonical: 2, g1: 2, id: "2733", match: true },
      { canonical: 6, g1: 6, id: "2901", match: true },
    ]);
    expect(derivation.kappaGrounding.blockField.nodes).toBe(28);
    expect(derivation.kappaGrounding.blockField.matches).toBe(28);
    expect(derivation.kappaGrounding.blockField.checks.every((entry) => entry.match)).toBe(true);
  });

  it("pins M1 (the anchor rule): 14/0/0/22 set-equal, the 14 contact keys, the 2-per-anchor census", () => {
    const m1 = derivation.kappaGrounding.mappings.M1;
    expect(m1.satelliteRule).toContain("governing anchor");
    expect(m1.orientationConstant).toBe(4);
    expect(m1.anchorRuleRows.find((entry) => entry.id === "127")).toEqual({ id: "127", pcSum: 21, derived: 4 });
    expect(m1.anchorRuleRows.find((entry) => entry.id === "381")).toEqual({ id: "381", pcSum: 28, derived: 4 });
    expect(m1.selection.keys).toEqual([
      "127:191", "127:253", "2111:1087", "2111:2143", "3103:2591", "3103:3119",
      "3599:3343", "3599:3607", "3847:3719", "3847:3851", "3971:3907", "3971:3973",
      "4033:2017", "4033:4001",
    ]);
    expect(m1.selection.confusion).toEqual({ tp: 14, fp: 0, fn: 0, tn: 22 });
    expect(m1.selection.setEqual).toBe(true);
    expect(derivation.kappaGrounding.perAnchorContacts.every((entry) => entry.contacts.length === 2)).toBe(true);
  });

  it("pins M2 (the affine cross-check): the T1/T2 partners, the D7-pole 7/7 agreements, the D6 transport defect", () => {
    const m2 = derivation.kappaGrounding.mappings.M2;
    expect(m2.T1.d7Pole.agreementCount).toBe(7);
    expect(m2.T2.d7Pole.agreementCount).toBe(7);
    expect(m2.T1.d7Pole.agreements.find((entry) => entry.id === "127")).toMatchObject({ partner: "1387", m1: 4, transported: 4, match: true });
    expect(m2.T2.d7Pole.agreements.find((entry) => entry.id === "127")).toMatchObject({ partner: "2773", m1: 4, transported: 4, match: true });
    const t1Rows = m2.T1.d6Pole.rows;
    expect(t1Rows).toHaveLength(7);
    expect(t1Rows.find((row) => row.d6Anchor === "381")).toEqual({ a1Partner: "1371", d6Anchor: "381", source: 0, target: 4 });
    expect(t1Rows.find((row) => row.d6Anchor === "2001")).toEqual({ a1Partner: "2901", d6Anchor: "2001", source: 6, target: 2 });
    expect(m2.T1.d6Pole.affineFits).toEqual([]);
    expect(m2.T1.d6Pole.affineMismatches).toEqual(["2001", "381"]);
    expect(m2.T1.d6Pole.swapResolutionMismatches).toEqual([]);
    expect(m2.T2.d6Pole.affineFits).toEqual([]);
    expect(m2.T2.d6Pole.affineMismatches).toEqual(["2001", "381"]);
    expect(m2.T2.d6Pole.swapResolutionMismatches).toEqual([]);
    expect(m2.selection.T1.confusion).toEqual({ tp: 14, fp: 0, fn: 0, tn: 22 });
    expect(m2.selection.T2.confusion).toEqual({ tp: 14, fp: 0, fn: 0, tn: 22 });
    expect(m2.selection.T1.setEqual).toBe(true);
    expect(m2.selection.T2.setEqual).toBe(true);
    expect(derivation.kappaGrounding.verdict).toBe("BOTH");
    expect(derivation.kappaGrounding.verdictStatement).toContain("over-determined");
    expect(derivation.kappaGrounding.verdictStatement).toContain("terminal-office source swap");
  });

  it("pins the controls: the Z-interface guard 4/2/10/20 (BL-068 match) and the midpoint infrastructure note", () => {
    expect(derivation.controls.zInterface.confusion).toEqual({ tp: 4, fp: 2, fn: 10, tn: 20 });
    expect(derivation.controls.zInterface.verdict).toBe("NON_SEPARATING");
    expect(derivation.controls.zInterface.zMajorityStates).toEqual(["191", "253", "2017", "4001"]);
    expect(derivation.controls.midpoint.statement).toContain("does not select");
    expect(derivation.controls.zInterface.landedMatch).toContain("BL-068");
  });

  it("pins the discovery (D-90-1): the orbit alignment, identical office cycles, 14/0/0/22, un-promoted", () => {
    const discovery = derivation.discovery;
    expect(discovery.id).toBe("D-90-1");
    expect(discovery.status).toBe("UNPROMOTED_DISCOVERY");
    expect(discovery.branchEffect).toContain("none");
    expect(discovery.orbitAlignment.d7Orbit).toEqual(["127", "2111", "3103", "3599", "3847", "3971", "4033"]);
    expect(discovery.orbitAlignment.d6AnchorOrbit).toEqual(["381", "1119", "2607", "3351", "3723", "3909", "2001"]);
    expect(discovery.orbitAlignment.d7Offices).toEqual([4, 6, 1, 3, 5, 0, 2]);
    expect(discovery.orbitAlignment.d6AnchorOffices).toEqual([4, 6, 1, 3, 5, 0, 2]);
    expect(discovery.orbitAlignment.officeSequencesEqual).toBe(true);
    expect(discovery.orbitAlignment.d7OrbitStepHolds).toBe(true);
    expect(discovery.orbitAlignment.d6OrbitStepHolds).toBe(true);
    expect(discovery.orbitAlignment.orbitPredicateConfusion).toEqual({ tp: 14, fp: 0, fn: 0, tn: 22 });
  });

  it("pins the gates and the FULL_DERIVATION branch classification", () => {
    expect(derivation.branch.preRegisteredLabels).toEqual(["FULL_DERIVATION", "PARTIAL_DERIVATION", "NO_DERIVATION"]);
    expect(derivation.branch.gateResults).toEqual({
      "V-D7D-1": "PASS", "V-D7D-2": "PASS", "V-D7D-3": "PASS", "V-D7D-4": "PASS", "V-D7D-5": "PASS",
    });
    expect(derivation.gates["V-D7D-3"].statement).toContain("BOTH");
    expect(derivation.branch.label).toBe("FULL_DERIVATION");
    expect(derivation.branch.statement).toContain("set-equal to the 14 landed contacts");
    expect(derivation.branch.statement).toContain("amendment question is noted as open");
    const fired = derivation.interpretation.branches.filter((entry) => entry.fired).map((entry) => entry.label);
    expect(fired).toEqual(["FULL_DERIVATION"]);
    expect(derivation.interpretation.fired).toBe("FULL_DERIVATION");
    expect(derivation.interpretation.partialFramingCarried).toContain("did not fire");
  });

  it("pins the synthesis: the verdict, the kappa verdict, the fa/ti note, the D7 tier", () => {
    expect(derivation.synthesis.verdict).toBe("FULL_DERIVATION");
    expect(derivation.synthesis.kappaGroundingVerdict).toBe("BOTH");
    expect(derivation.synthesis.findings).toHaveLength(5);
    expect(derivation.synthesis.findings[3]).toContain("fa/ti derivation-status pair");
    expect(derivation.synthesis.d7Tier).toContain("hypothesis-tier");
  });

  it("pins the isolation (V-D7D-4): region-scoped, zero office bytes in the derivation path", () => {
    expect(derivation.isolation.regime).toBe("region-scoped");
    expect(derivation.isolation.officeBytesInDerivationPath).toBe(0);
    expect(derivation.isolation.statements.some((statement) => statement.includes("zero granted-office bytes"))).toBe(true);
    expect(derivation.isolation.validatorDiscipline).toContain("permissive probe");
  });

  it("pins the three-tier accounting and the fences", () => {
    expect(derivation.accounting.masksOnly).toHaveLength(6);
    expect(derivation.accounting.canonicalComputation).toHaveLength(6);
    expect(derivation.accounting.remainingGranted).toHaveLength(3);
    expect(derivation.accounting.remainingGranted[1]).toContain("C = 4");
    expect(derivation.accounting.statement).toContain("comparison target + control");
    expect(derivation.accounting.officePathFence).toContain("zero granted office bytes");
    expect(derivation.fences.d7HypothesisTier).toContain("ENTRY 15");
    expect(derivation.fences.officeFieldDiscipline).toContain("halt");
    expect(derivation.fences.noGovernsAdmission).toContain("no GOVERNS admission");
    expect(derivation.fences.membrane).toContain("never a derivation input");
    expect(derivation.fences.sessionProse).toContain("context, not evidence");
    expect(derivation.fences.failLoud).toContain("did not fire");
    expect(derivation.notAccomplished).toHaveLength(7);
    expect(derivation.contractCitations.length).toBeGreaterThanOrEqual(15);
  });

  it("pins the grounding and the source bindings", () => {
    expect(derivation.grounding.receipt).toHaveLength(13);
    expect(derivation.grounding.calibration.kappaRecovery).toContain("C = 4");
    expect(derivation.sourceBindings).toHaveLength(10);
    expect(derivation.sourceBindings.every((binding) => /^[0-9a-f]{64}$/.test(binding.sha256))).toBe(true);
    expect(derivation.method.rule).toContain("R-kappa(h)");
  });
});
