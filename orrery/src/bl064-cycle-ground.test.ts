import { describe, expect, it } from "vitest";

import derivation from "./generated/bl064-cycle-ground.v1.json";

describe("BL-064 cycle-ground derivation (dual rules / direction / reflection / coverage) — pinned", () => {
  it("pins schema, status, fingerprint, source bindings and the chain anchor", () => {
    expect(derivation.schemaVersion).toBe("harmonic-orrery.bl064-cycle-ground.v1");
    expect(derivation.derivationId).toBe("BL064_CYCLE_GROUND_V1");
    expect(derivation.status).toBe("planning_evidence");
    expect(derivation.generator).toBe("scripts/build-bl064-cycle-ground.mjs");
    expect(derivation.derivationFingerprint).toMatch(/^[0-9a-f]{64}$/);
    expect(derivation.sourceBindings).toHaveLength(3);
    expect(derivation.sourceBindings.every((binding) => /^[0-9a-f]{64}$/.test(binding.sha256))).toBe(true);
    expect(derivation.base.artifact).toBe("orrery/src/generated/bl063-office-reconstruction.v1.json");
    expect(derivation.base.reconstructionFingerprint).toBe("6d33c67be7b8f87b8ad2f964cd3560ebcbc1ec0dc6b2088ad1f223c35caff8c3");
    expect(derivation.base.projectionArtifact).toBe("qa/d4-production-generation.json");
  });

  it("pins the consumed kappa and its re-validation against the masks", () => {
    expect(derivation.kappaConsumed.kappa0).toEqual([
      { mask: "1387", index: 0 },
      { mask: "1451", index: 1 },
      { mask: "1453", index: 2 },
      { mask: "1709", index: 3 },
      { mask: "1717", index: 4 },
      { mask: "2741", index: 5 },
      { mask: "2773", index: 6 },
    ]);
    expect(derivation.kappaConsumed.kappa1[0]).toEqual({ mask: "1387", index: 6 });
    expect(derivation.kappaConsumed.kappa1[6]).toEqual({ mask: "2773", index: 0 });
    expect(derivation.kappaConsumed.validation).toMatchObject({
      bijection: true,
      orientationRelation: true,
      lineProperty: true,
    });
    expect(derivation.kappaConsumed.validation.reDerivedDegreeSequence).toEqual([1, 1, 2, 2, 2, 2, 2]);
  });

  it("pins the child-side rules: 5 sandwich + 2 twin-closure with the constructor pairs", () => {
    expect(derivation.rules.sInt.count).toBe(5);
    expect(derivation.rules.tBdy.count).toBe(2);
    const sInt = new Map(derivation.rules.sInt.perAnchor.map((entry) => [entry.child, entry]));
    expect(sInt.get("1389")).toMatchObject({ hamming2Neighbors: ["1387", "1453"], constructors: ["1387", "1453"], sandwichHolds: true });
    expect(sInt.get("1461")).toMatchObject({ hamming2Neighbors: ["1453", "1717"], constructors: ["1453", "1717"] });
    expect(sInt.get("1707")).toMatchObject({ hamming2Neighbors: ["1451", "1709"], constructors: ["1451", "1709"] });
    expect(sInt.get("1749")).toMatchObject({ hamming2Neighbors: ["1717", "2773"], constructors: ["1717", "2773"] });
    expect(sInt.get("2733")).toMatchObject({ hamming2Neighbors: ["1709", "2741"], constructors: ["1709", "2741"] });
    const tBdy = new Map(derivation.rules.tBdy.perAnchor.map((entry) => [entry.child, entry]));
    expect(tBdy.get("1371")).toMatchObject({ hamming2Neighbor: "1387", twin: "2741", constructors: ["1387", "2741"], sandwichHolds: false });
    expect(tBdy.get("2901")).toMatchObject({ hamming2Neighbor: "2773", twin: "1451", constructors: ["1451", "2773"], sandwichHolds: false });
  });

  it("pins the coordinate-side rules: K-int centers 1..5 and the two K-bdy seam pairs", () => {
    expect(derivation.rules.kInt.count).toBe(5);
    expect(derivation.rules.kInt.perCenter).toEqual([
      { center: 1, pair: ["1717", "2773"] },
      { center: 2, pair: ["1709", "2741"] },
      { center: 3, pair: ["1453", "1717"] },
      { center: 4, pair: ["1451", "1709"] },
      { center: 5, pair: ["1387", "1453"] },
    ]);
    expect(derivation.rules.kBdy.pairs).toEqual([["1387", "2741"], ["1451", "2773"]]);
  });

  it("pins the unified cyclic rule with midpoint consistency and the dual-rule equivalence", () => {
    expect(derivation.rules.unified.count).toBe(7);
    expect(derivation.rules.unified.perCenter.map((row) => row.center)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(derivation.rules.unified.perCenter.map((row) => row.mid)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    const byCenter = new Map(derivation.rules.unified.perCenter.map((row) => [row.center, row]));
    expect(byCenter.get(0)).toMatchObject({ child: "1371", mode: "twin-closure", pair: ["1387", "2741"] });
    expect(byCenter.get(1)).toMatchObject({ child: "1749", mode: "sandwich", pair: ["1717", "2773"] });
    expect(byCenter.get(5)).toMatchObject({ child: "1389", mode: "sandwich", pair: ["1387", "1453"] });
    expect(byCenter.get(6)).toMatchObject({ child: "2901", mode: "twin-closure", pair: ["1451", "2773"] });
    for (const center of [2, 3, 4]) expect(byCenter.get(center)?.mode).toBe("sandwich");
    expect(derivation.rules.equivalence).toMatchObject({ kIntEqualsSInt: true, kBdyEqualsTBdy: true });
    expect(derivation.rules.equivalence.statement).toContain("provably-equivalent");
  });

  it("pins the coverage gate: 14/14 set-equal, no missing/extra, office alignment 7/7", () => {
    expect(derivation.coverage.setEqual).toBe(true);
    expect(derivation.coverage.derivedDirectedCount).toBe(14);
    expect(derivation.coverage.grantedDirectedCount).toBe(14);
    expect(derivation.coverage.missing).toEqual([]);
    expect(derivation.coverage.extra).toEqual([]);
    expect(derivation.coverage.perChild).toHaveLength(7);
    expect(derivation.coverage.perChild.every((row) => row.equal)).toBe(true);
    const byChild = new Map(derivation.coverage.perChild.map((row) => [row.child, row]));
    expect(byChild.get("1371")?.granted).toEqual(["1387", "2741"]);
    expect(byChild.get("1389")?.granted).toEqual(["1387", "1453"]);
    expect(byChild.get("2901")?.granted).toEqual(["1451", "2773"]);
    expect(derivation.coverage.officeAlignment.matches).toBe(7);
    expect(derivation.coverage.officeAlignment.perChild.every((row) => row.match)).toBe(true);
  });

  it("pins the reflection handling: identical pair sets, labels flip c -> 6-c, bit carried", () => {
    expect(derivation.reflection.pairsIdentical).toBe(true);
    expect(derivation.reflection.directionOrientationIndependent).toBe(true);
    expect(derivation.reflection.labelMap).toHaveLength(7);
    for (const row of derivation.reflection.labelMap) {
      expect(row.center0).toBe((6 - row.center1) % 7);
    }
    expect(derivation.reflection.labelMap.find((row) => row.center1 === 0)).toMatchObject({ pair: ["1387", "2741"], center0: 6 });
    expect(derivation.reflection.labelMap.find((row) => row.center1 === 6)).toMatchObject({ pair: ["1451", "2773"], center0: 0 });
    expect(derivation.reflection.statement).toContain("BL-065");
  });

  it("pins the direction probes: D-mid 5/5 internal, class split 7/7, IC candidate, tiers", () => {
    expect(derivation.direction.dMid.internalResolved).toBe("5/5");
    expect(derivation.direction.dMid.boundaryResolved).toBe("0/2");
    expect(derivation.direction.dMid.resolvedCount).toBe(5);
    for (const row of derivation.direction.dMid.perTriple) {
      if (row.resolved) expect(row.middleIsChild).toBe(true);
      if (row.child === "1371" || row.child === "2901") expect(row.resolved).toBe(false);
    }
    expect(derivation.direction.canonicalClass).toMatchObject({ parentClass: "7-35", childClass: "7-34", splitCount: 7 });
    expect(derivation.direction.canonicalClass.label).toContain("canonical-input-dependent");
    expect(derivation.direction.icCounts.parentIc).toEqual([2, 5, 4, 3, 6, 1]);
    expect(derivation.direction.icCounts.childIc).toEqual([2, 5, 4, 4, 4, 2]);
    expect(derivation.direction.icCounts.matchesCanonicalClassSplit).toBe(true);
    expect(derivation.direction.accounting.tiers.masksOnly.pairStructure).toContain("7/7");
    expect(derivation.direction.accounting.tiers.masksOnly.internalDirection).toContain("5/7");
    expect(derivation.direction.accounting.tiers.canonicalComputation.fullDirection).toContain("7/7");
    expect(derivation.direction.accounting.tiers.remainingGranted).toHaveLength(4);
  });

  it("pins the gates and the synthesis: CYCLE_GROUND_DERIVED with the grant discharge", () => {
    for (const key of ["V-P2-1", "V-P2-2", "V-P2-3", "V-P2-4"] as const) {
      expect(derivation.gates[key].result).toBe("PASS");
    }
    expect(derivation.synthesis.verdict).toBe("CYCLE_GROUND_DERIVED");
    expect(derivation.synthesis.preRegisteredVerdicts).toEqual([
      "CYCLE_GROUND_DERIVED", "CYCLE_GROUND_CONSTRAINED", "FAILED",
    ]);
    expect(derivation.synthesis.grantDischarge.discharged).toContain("pair structure");
    expect(derivation.synthesis.grantDischarge.remaining).toContain("anchor set");
    expect(derivation.synthesis.dependencyChain.position).toContain("phase 2 of 4");
    expect(derivation.synthesis.dependencyChain.necessaryNotSufficient).toContain("necessary-not-sufficient");
    expect(derivation.synthesis.limits).toHaveLength(4);
  });

  it("carries the binding fences and the bounded non-accomplishments", () => {
    expect(derivation.fences.higherTheorem).toContain("remains open");
    expect(derivation.fences.requirementScope).toContain("requirement 4 only");
    expect(derivation.fences.g1Intra330).toBe("untouched");
    expect(derivation.fences.direction).toContain("unassigned");
    expect(derivation.fences.membrane).toContain("never design input");
    expect(derivation.fences.reflectionBit).toContain("BL-065");
    expect(derivation.contractCitations.some((citation) => citation.includes("bl-059-governs-derivability"))).toBe(true);
    expect(derivation.contractCitations.some((citation) => citation.includes("bl-063-office-reconstruction-memo"))).toBe(true);
    expect(derivation.notAccomplished).toHaveLength(7);
  });
});
