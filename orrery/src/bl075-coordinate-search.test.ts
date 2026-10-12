import { describe, expect, it } from "vitest";

import investigation from "./generated/bl075-coordinate-search.v1.json";

describe("BL-075 coordinate transformation search (the affine carrier census) — pinned", () => {
  it("pins schema, status, fingerprint, source bindings, the chain anchors and the pre-registration", () => {
    expect(investigation.schemaVersion).toBe("harmonic-orrery.bl075-coordinate-search.v1");
    expect(investigation.investigationId).toBe("BL075_COORDINATE_SEARCH_V1");
    expect(investigation.status).toBe("planning_evidence");
    expect(investigation.generator).toBe("scripts/build-bl075-coordinate-search.mjs");
    expect(investigation.investigationFingerprint).toMatch(/^[0-9a-f]{64}$/);
    expect(investigation.sourceBindings).toHaveLength(5);
    expect(investigation.sourceBindings.every((binding) => /^[0-9a-f]{64}$/.test(binding.sha256))).toBe(true);
    expect(investigation.base.bl073.investigationFingerprint).toBe(
      "811fa786f3a03b03b0c334fe797c85b9b4aeed93332a183be43f86fa1133a65c",
    );
    expect(investigation.base.bl071.investigationFingerprint).toBe(
      "8b2a1f6ca1776851f721eb6bc6ee6532059d81d150ce3f7c9fda1febfe84c3fe",
    );
    expect(investigation.base.bl070.derivationFingerprint).toBe(
      "9db10a088a05664a5cf60f6fad14514a4fc9aab278dcf0359d684bce70607731",
    );
    expect(investigation.preRegistration.rulings.map((ruling) => ruling.id)).toEqual([
      "OD-CT-1", "OD-CT-2", "OD-CT-3", "OD-CT-4", "OD-CT-5", "OD-CT-6", "OD-CT-7",
    ]);
    expect(investigation.preRegistration.hypothesis.predictedBranch).toBe("CHIRAL_PAIR");
    expect(investigation.preRegistration.hypothesis.primary).toContain("u=5");
    expect(investigation.preRegistration.hypothesis.chiralPartner).toContain("u=7");
    expect(investigation.preRegistration.hypothesis.necessity).toContain("11u = 7");
    expect(Object.keys(investigation.preRegistration.levels).sort()).toEqual(["D", "S", "U"]);
    expect(investigation.preRegistration.branchTable.coordinateMapFound).toContain("COORDINATE_MAP_FOUND");
    expect(investigation.preRegistration.branchTable.chiralPair).toContain("CHIRAL_PAIR");
    expect(investigation.preRegistration.branchTable.partialMap).toContain("PARTIAL_MAP");
    expect(investigation.preRegistration.branchTable.noMap).toContain("NO_MAP");
    expect(investigation.preRegistration.reindexingClassDisposition).toContain("0/5040");
  });

  it("pins the two cycles: the derived orders, the directed intervals, the closures and the pcSum ladders", () => {
    const d7 = investigation.cycles.D7;
    const a0 = investigation.cycles.A0;
    expect(d7.order).toEqual(["127", "2111", "3103", "3599", "3847", "3971", "4033"]);
    expect(a0.order).toEqual(["1387", "1451", "1453", "1709", "1717", "2741", "2773"]);
    expect(d7.edges.map((edge) => edge.rotateInterval)).toEqual([11, 11, 11, 11, 11, 11, 6]);
    expect(a0.edges.map((edge) => edge.rotateInterval)).toEqual([7, 7, 7, 7, 7, 7, 6]);
    expect(d7.edges.map((edge) => edge.hamming)).toEqual([2, 2, 2, 2, 2, 2, 10]);
    expect(a0.edges.map((edge) => edge.hamming)).toEqual([2, 2, 2, 2, 2, 2, 10]);
    expect(d7.closureEdge).toMatchObject({ a: "4033", b: "127", hamming: 10, rotateInterval: 6, closure: true });
    expect(a0.closureEdge).toMatchObject({ a: "2773", b: "1387", hamming: 10, rotateInterval: 6, closure: true });
    expect(d7.pcSumLadder).toEqual([21, 26, 31, 36, 41, 46, 51]);
    expect(a0.pcSumLadder).toEqual([33, 34, 35, 36, 37, 38, 39]);
    expect(d7.pcSumStep).toBe(5);
    expect(a0.pcSumStep).toBe(1);
  });

  it("pins the L0 rotation class: the brief's candidates (a)/(b) falsified, 0/12", () => {
    const l0 = investigation.search.classL0;
    expect(l0.size).toBe(12);
    expect(l0.setwise).toBe(0);
    expect(l0.directed).toBe(0);
    expect(l0.reversed).toBe(0);
    expect(l0.statement).toContain("(0/12)");
    expect(l0.statement).toContain("falsified");
    expect(investigation.search.units).toEqual([1, 5, 7, 11]);
    expect(investigation.search.mapCount).toBe(48);
  });

  it("pins the L1 affine census: 48 searched, 2 setwise, 1 directed, 1 reversed", () => {
    const l1 = investigation.search.classL1;
    expect(l1.size).toBe(48);
    expect(l1.setwise).toBe(2);
    expect(l1.directed).toBe(1);
    expect(l1.reversed).toBe(1);
    expect(l1.statement).toContain("exactly two setwise maps");
    expect(investigation.search.tCensus).toEqual({ "1": [], "5": [0], "7": [0], "11": [] });
    expect(investigation.search.census).toHaveLength(48);
    expect(investigation.search.census.filter((row) => row.setwise)).toHaveLength(2);
  });

  it("pins the necessity table: 11u = 7 selects u = 5 uniquely; the closure is auto-preserved", () => {
    const necessity = investigation.necessity;
    expect(necessity.table).toEqual([
      { unit: 1, transportedPath: 11, transportedClosure: 6, carriesPathAddress: false },
      { unit: 5, transportedPath: 7, transportedClosure: 6, carriesPathAddress: true },
      { unit: 7, transportedPath: 5, transportedClosure: 6, carriesPathAddress: false },
      { unit: 11, transportedPath: 1, transportedClosure: 6, carriesPathAddress: false },
    ]);
    expect(necessity.uniqueUnit).toBe(5);
    expect(necessity.requirement).toContain("11u = 7");
    expect(necessity.conjugacyIdentity).toContain("rot^{u*d}");
    expect(necessity.closureInvariance).toContain("6u = 6");
    expect(necessity.statement).toContain("uniquely");
  });

  it("pins the T1 carrier: u = 5, level D — the forward coordinate map onto the A0 order", () => {
    const t1 = investigation.search.carriers.find((carrier) => carrier.id === "T1")!;
    expect(t1).toMatchObject({ unit: 5, translation: 0, level: "D", setwise: true, directed: true, reversed: false });
    expect(t1.imageOrder).toEqual(["1387", "1451", "1453", "1709", "1717", "2741", "2773"]);
    expect(t1.imageIntervals).toEqual([7, 7, 7, 7, 7, 7, 6]);
    expect(t1.imageHamming).toEqual([2, 2, 2, 2, 2, 2, 10]);
    expect(t1.imagePcSums).toEqual([33, 34, 35, 36, 37, 38, 39]);
    expect(t1.map).toContain("5x");
    expect(t1.role).toContain("directed carrier");
  });

  it("pins the T2 carrier: u = 7, level U — the chiral partner onto the reversed A0 order", () => {
    const t2 = investigation.search.carriers.find((carrier) => carrier.id === "T2")!;
    expect(t2).toMatchObject({ unit: 7, translation: 0, level: "U", setwise: true, directed: false, reversed: true });
    expect(t2.imageOrder).toEqual(["2773", "2741", "1717", "1709", "1453", "1451", "1387"]);
    expect(t2.imageIntervals).toEqual([5, 5, 5, 5, 5, 5, 6]);
    expect(t2.imageHamming).toEqual([2, 2, 2, 2, 2, 2, 10]);
    expect(t2.imagePcSums).toEqual([39, 38, 37, 36, 35, 34, 33]);
    expect(t2.role).toContain("chiral partner");
  });

  it("pins the group structure: the closure is the Klein-4 unit subgroup {M1, M5, M7, M11}", () => {
    const group = investigation.group;
    expect(group.order).toBe(4);
    expect(group.closed).toBe(true);
    expect(group.commutative).toBe(true);
    expect(group.allInvolutions).toBe(true);
    expect(group.identityPresent).toBe(true);
    expect(group.isomorphicTo).toContain("Klein-4");
    expect(group.elements.map((element) => element.id)).toEqual(["M1", "M5", "M7", "M11"]);
    expect(group.elements.filter((element) => element.setwise).map((element) => element.id)).toEqual(["M5", "M7"]);
    expect(group.relations).toEqual([
      { expression: "M5 o M5", result: "M1" },
      { expression: "M7 o M7", result: "M1" },
      { expression: "M5 o M7", result: "M11" },
      { expression: "M7 o M5", result: "M11" },
      { expression: "M11 o M5", result: "M7" },
      { expression: "M11 o M7", result: "M5" },
    ]);
    expect(group.products).toHaveLength(16);
    expect(group.products.every((entry) => entry.inside)).toBe(true);
    expect(group.workingSet.compositionClosed).toBe(false);
    expect(group.workingSet.closure).toEqual(["M1", "M5", "M7", "M11"]);
  });

  it("pins the reflection constraint: pc-level (T2 = rho o T1) and index-level (T1 <-> phi-1, T2 <-> phi-2)", () => {
    expect(investigation.reflection.status).toBe("VERIFIED");
    expect(investigation.reflection.pcLevel.verified).toBe(true);
    expect(investigation.reflection.pcLevel.relations.map((entry) => entry.value)).toEqual([
      "rho o T1", "rho o T2", "T1 o T2 = T2 o T1",
    ]);
    expect(investigation.reflection.indexLevel.verified).toBe(true);
    expect(investigation.reflection.indexLevel.alignment).toEqual([
      { carrier: "T1", witness: "phi-1", element: "r0", kind: "rotation", parity: "even", orientation: "forward" },
      { carrier: "T2", witness: "phi-2", element: "refl6", kind: "reflection", parity: "odd", orientation: "reversed" },
    ]);
  });

  it("pins the branch verdict: CHIRAL_PAIR fired, Reading 1 confirmed", () => {
    const branch = investigation.branch;
    expect(branch.preRegisteredLabels).toEqual(["COORDINATE_MAP_FOUND", "CHIRAL_PAIR", "PARTIAL_MAP", "NO_MAP"]);
    expect(branch.fired).toEqual(["COORDINATE_MAP_FOUND", "CHIRAL_PAIR"]);
    expect(branch.label).toBe("CHIRAL_PAIR");
    expect(branch.coordinateMapFound).toBe(true);
    expect(branch.reading).toBe("READING_1_CONFIRMED");
    expect(branch.statement).toContain("canonically determined");
    expect(branch.statement).toContain("separately gated");
  });

  it("pins the scoping accretion, the binding gate, the gates, the accounting and the fences", () => {
    expect(investigation.scopingAccretion.canonicity).toContain("u = 5");
    expect(investigation.scopingAccretion.klein4).toContain("Klein-4");
    expect(investigation.scopingAccretion.c2Note).toContain("without endorsing");
    expect(investigation.bindingGate.status).toBe("SEPARATELY_GATED");
    expect(investigation.bindingGate.statement).toContain("gated separately on its own evidence");
    expect(investigation.gates["V-CT-1"].result).toBe("PASS");
    expect(investigation.gates["V-CT-2"].result).toBe("PASS");
    expect(investigation.gates["V-CT-3"].result).toBe("PASS");
    expect(investigation.gates["V-CT-1"].statement).toContain("48 candidate maps");
    expect(investigation.accounting.masksOnly.length).toBeGreaterThanOrEqual(3);
    expect(investigation.accounting.canonicalComputation.length).toBeGreaterThanOrEqual(3);
    expect(investigation.accounting.remainingGranted.length).toBeGreaterThanOrEqual(3);
    expect(investigation.crossChecks.bl073Anchor.matchesDerived).toBe(true);
    expect(investigation.crossChecks.d7LandedIntervals.matchesDerived).toBe(true);
    expect(investigation.crossChecks.a0LandedUniverse.matchesDerived).toBe(true);
    expect(investigation.crossChecks.chainFingerprints.bl073).toBe(
      "811fa786f3a03b03b0c334fe797c85b9b4aeed93332a183be43f86fa1133a65c",
    );
    expect(investigation.fences.d7HypothesisTier).toContain("2703-2712");
    expect(investigation.fences.measurementOnly).toContain("coordinate search is measurement");
    expect(investigation.fences.governsAdmission).toContain("separately gated");
    expect(investigation.notAccomplished.some((item) => item.includes("no claim event"))).toBe(true);
    expect(investigation.notAccomplished.some((item) => item.includes("no GOVERNS admission"))).toBe(true);
    expect(investigation.notAccomplished.some((item) => item.includes("no C2 endorsement"))).toBe(true);
    expect(investigation.notAccomplished.some((item) => item.includes("does not amend records"))).toBe(true);
  });
});
