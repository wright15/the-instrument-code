import { describe, expect, it } from "vitest";

import hunt from "./generated/d4-zresidual-hunt.v1.json";

describe("D4 Z-structure and residual-pair hunt (BL-061/062) — anatomy, mechanisms, refinement", () => {
  it("pins schema, status, fingerprint and the BL-060 import chain", () => {
    expect(hunt.schemaVersion).toBe("harmonic-orrery.d4-zresidual-hunt.v1");
    expect(hunt.huntId).toBe("BL061_BL062_ZRESIDUAL_HUNT_v1");
    expect(hunt.status).toBe("planning_evidence");
    expect(hunt.generator).toBe("scripts/build-d4-zresidual-hunt.mjs");
    expect(hunt.huntFingerprint).toMatch(/^[0-9a-f]{64}$/);
    expect(hunt.sourceBindings).toHaveLength(5);
    expect(hunt.sourceBindings.every((binding) => /^[0-9a-f]{64}$/.test(binding.sha256))).toBe(true);
    expect(hunt.base.artifact).toBe("orrery/src/generated/d4-14v14-hunt.v1.json");
    expect(hunt.base.fingerprint).toBe("8a1295ca9639fab7e16b980576954a1f12824d839e6743abebe176e3df23cac9");
    expect(hunt.base.domainKeys).toBe(28);
    expect(hunt.base.observedKeys).toBe(14);
    expect(hunt.domain.uKeys).toHaveLength(28);
    expect(hunt.domain.observedKeys).toHaveLength(14);
  });

  it("pins the tier<->family bijection (D1=7-22 ... D7=7-1)", () => {
    expect(hunt.dTierTiers.map((entry) => `${entry.tier}:${entry.family}:${entry.band}`)).toEqual([
      "D1:7-22:non-Z",
      "D2:7-15:non-Z",
      "D3:7-Z37:Z",
      "D4:7-Z17:Z",
      "D5:7-Z12:Z",
      "D6:7-8:non-Z",
      "D7:7-1:non-Z",
    ]);
    for (const entry of hunt.dTierTiers) {
      expect(entry.anchorCount).toBe(7);
      expect(entry.anchors).toHaveLength(7);
    }
  });

  it("pins the 14 inversion pairs: status shared, office sum 6", () => {
    expect(hunt.domain.inversionPairs).toHaveLength(14);
    for (const pair of hunt.domain.inversionPairs) {
      expect(pair.officeSum).toBe("6");
    }
    const observedByStatus = hunt.domain.inversionPairs.filter((pair) => pair.observed);
    expect(observedByStatus).toHaveLength(7);
  });

  it("pins the Z-anatomy per-family vocabularies and cornerstone confinement", () => {
    const byFamily = new Map(hunt.zAnatomy.familyProfiles.map((entry) => [entry.family, entry]));
    expect(byFamily.get("7-1")?.containedPentaNodes).toBe(75);
    expect(byFamily.get("7-1")?.zClassNodes).toBe(5);
    expect(byFamily.get("7-22")?.containedPentaNodes).toBe(100);
    expect(byFamily.get("7-22")?.zClassNodes).toBe(30);
    expect(byFamily.get("7-Z12")?.containedPentaNodes).toBe(105);
    expect(byFamily.get("7-Z12")?.zClassNodes).toBe(10);
    expect(byFamily.get("7-Z17")?.zClassNodes).toBe(20);
    expect(byFamily.get("7-Z37")?.zClassNodes).toBe(20);
    expect(hunt.zAnatomy.cornerstoneAnchors).toHaveLength(5);
    expect(hunt.zAnatomy.cornerstoneAnchors.map((entry) => entry.anchor)).toEqual(["1273", "3239", "3881", "671", "997"]);
    expect(hunt.zAnatomy.cornerstoneAnchors.every((entry) => entry.family === "7-Z12" && entry.tier === "D5")).toBe(true);
  });

  it("pins the mechanism verdicts and the composition confusions", () => {
    expect(hunt.mechanisms.a.verdict).toContain("PARTIAL");
    expect(hunt.mechanisms.b.confusion).toEqual({ tp: 14, fp: 0, fn: 0, tn: 14 });
    expect(hunt.mechanisms.b.verdict).toContain("SUPPORTED");
    expect(hunt.mechanisms.c.singleOrientationConfusion).toEqual({ tp: 14, fp: 0, fn: 0, tn: 14 });
    expect(hunt.mechanisms.c.verdict).toContain("SUPPORTED for achiral content");
    expect(hunt.compositionSummary.observed.distinctClasses).toEqual({ min: 11, max: 13 });
    expect(hunt.compositionSummary.unobserved.distinctClasses).toEqual({ min: 7, max: 7 });
    expect(hunt.compositionSummary.unobserved.rootedZCount).toEqual({ min: 0, max: 0 });
  });

  it("pins the residual pair: chiral-Z-only content, Z12-only interface, margin 3", () => {
    expect(hunt.residualPair.perKey).toHaveLength(2);
    for (const entry of hunt.residualPair.perKey) {
      expect(entry.zFamilyCounts).toEqual({ "7-Z12": 7, "7-Z17": 2, "7-Z37": 2 });
      expect(entry.zSum).toBe(11);
      expect(entry.nonZSum).toBe(8);
      expect(entry.sign).toBe(-3);
      expect(entry.composition.zClasses).toEqual(["5-Z18", "5-Z36"]);
      expect(entry.composition.achiralZClasses).toEqual([]);
      expect(entry.composition.singleClasses).toEqual(["5-35"]);
      expect(entry.subnodes).toHaveLength(15);
    }
    expect(hunt.residualPair.perKey[0].key).toBe("1:1765");
    expect(hunt.residualPair.perKey[0].sibling).toBe("5:1261");
    expect(hunt.residualPair.perKey[1].sibling).toBe("1:1765");
    expect(hunt.residualPair.verdict).toContain("EXPLAINED_NOT_PRIMITIVE");
  });

  it("pins the refinement scan: hits, degenerate dual, near-misses, rejected splits", () => {
    const byId = new Map(hunt.refinementScan.shapes.map((entry) => [entry.id, entry]));
    for (const id of ["S1", "S2", "S3", "S6", "S9", "S10"]) {
      expect(byId.get(id)?.result).toBe("HIT");
      expect(byId.get(id)?.confusion).toEqual({ tp: 14, fp: 0, fn: 0, tn: 14 });
    }
    expect(byId.get("S4")?.result).toBe("HIT_DEGENERATE");
    for (const id of ["S5", "S7", "S8", "S11", "S12"]) {
      expect(byId.get(id)?.result).toBe("MISS_NEAR");
      expect(byId.get(id)?.confusion).toEqual({ tp: 12, fp: 0, fn: 2, tn: 14 });
    }
    for (const id of ["S13", "S14"]) {
      expect(byId.get(id)?.result).toBe("REJECTED_INVERSION_SPLIT");
      expect(byId.get(id)?.inversionSymmetric).toBe(false);
    }
    expect(hunt.refinementScan.shapeCounts).toEqual({ hits: 6, degenerateHits: 1, misses: 0, nearMisses: 5, rejectedInversionSplit: 2 });
    expect(hunt.refinementScan.dualThreshold.allDegenerate).toBe(true);
    expect(hunt.refinementScan.dualThreshold.separatingPairs).toEqual([{ a: "13", b: "5" }, { a: "13", b: "11" }]);
    expect(hunt.refinementScan.inversionSymmetry.allHitsSymmetric).toBe(true);
  });

  it("pins the synthesis: STRUCTURAL Z-verdict, explained residual, GSL-1R/GSL-2", () => {
    expect(hunt.synthesis.zVerdict).toBe("STRUCTURAL");
    expect(hunt.synthesis.residualVerdict).toBe("EXPLAINED_NOT_PRIMITIVE");
    expect(hunt.synthesis.governsSemanticLayer.refinement.id).toBe("GSL-1R");
    expect(hunt.synthesis.governsSemanticLayer.refinement.statement).toContain("Z-majority");
    expect(hunt.synthesis.governsSemanticLayer.anatomy.id).toBe("GSL-2");
    expect(hunt.synthesis.governsSemanticLayer.anatomy.statement).toContain("inversion-symmetric");
    expect(hunt.synthesis.completedGeography.thresholds.length).toBeGreaterThanOrEqual(4);
    expect(hunt.synthesis.limits).toHaveLength(3);
  });

  it("carries the binding fences and bounded non-accomplishments", () => {
    expect(hunt.fences.d7Control).toContain("OD-60-D7");
    expect(hunt.fences.higherTheorem).toContain("remains open");
    expect(hunt.fences.g1Intra330).toBe("untouched");
    expect(hunt.fences.direction).toContain("unassigned");
    expect(hunt.fences.twelfthCatch).toContain("computed from landed bytes");
    expect(hunt.contractCitations.some((citation) => citation.includes("BL-061/BL-062"))).toBe(true);
    expect(hunt.notAccomplished).toHaveLength(6);
  });
});
