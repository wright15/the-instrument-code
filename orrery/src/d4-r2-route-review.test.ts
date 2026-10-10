import { describe, expect, it } from "vitest";

import review from "./generated/d4-r2-route-review.v1.json";

describe("D4 R2 filtered-cycle-walk route review (BL-056) — design validation", () => {
  it("pins schema, status, governance class and fingerprint", () => {
    expect(review.schemaVersion).toBe("harmonic-orrery.d4-r2-route-review.v1");
    expect(review.reviewId).toBe("BL056_D4_R2_ROUTE_REVIEW_v1");
    expect(review.status).toBe("planning_evidence");
    expect(review.generator).toBe("scripts/build-d4-r2-route-review.mjs");
    expect(review.reviewFingerprint).toMatch(/^[0-9a-f]{64}$/);
    expect(review.sourceBindings).toHaveLength(6);
    expect(review.sourceBindings.every((binding) => /^[0-9a-f]{64}$/.test(binding.sha256))).toBe(true);
  });

  it("pins the route statement and the output comparison", () => {
    expect(review.route.id).toBe("R2");
    expect(review.route.name).toBe("Filtered Cycle-Walk");
    expect(review.route.definition).toBe("R2(h) = {(o(h), s) : s in satellites(h) and P(s)}");
    expect(review.route.predicate).toBe("P(s) = [forte(s) = '7-27']");
    expect(review.route.outputStatement).toBe("G_R2 = O (14 keys; 2 per office; G_R2 strictly inside U)");
    expect(review.route.outputComparison).toEqual({
      observedKeyCount: 14, r2KeyCount: 14, tAKeyCount: 8, tBKeyCount: 28, uKeyCount: 28,
    });
    expect(review.route.cycleWalk).toMatchObject({
      closes: true, intervalSum: 12, t1Count: 2, t2Count: 5,
    });
    expect(review.route.cycleWalk.edges).toHaveLength(7);
  });

  it("pins the per-office route evaluation: 2 selected per office, all cycle-twin-verified", () => {
    expect(review.perOffice).toHaveLength(7);
    for (const office of review.perOffice) {
      expect(office.eParents).toHaveLength(2);
      expect(office.satellites).toHaveLength(4);
      expect(office.selectedCount).toBe(2);
      expect(office.justification).toBe("cycle-twin-verified");
      expect(office.cycleTwin.holds).toBe(true);
    }
    expect(review.route.justificationSummary).toMatchObject({ cycleTwinVerified: 7, predicateOnly: 0 });
  });

  it("pins G1: the generalized cycle-twin relation holds at all 7 edges (2 T1 + 5 T2)", () => {
    expect(review.gates.G1.allPass).toBe(true);
    expect(review.gates.G1.fallbackOffices).toEqual([]);
    expect(review.gates.G1.perEdge).toHaveLength(7);
    expect(review.gates.G1.perEdge.every((edge) => edge.holds)).toBe(true);
    expect(review.gates.G1.t1Edges).toEqual(["0", "6"]);
    expect(review.gates.G1.t2Edges).toEqual(["1", "2", "3", "4", "5"]);
    expect(review.gates.G1.perEdge.filter((edge) => edge.d === 2)).toHaveLength(5);
  });

  it("pins G2: predicate selects exactly 2 satellites per office across all 7 offices", () => {
    expect(review.gates.G2.allTwo).toBe(true);
    expect(review.gates.G2.officesAtTwo).toBe(7);
    expect(review.gates.G2.totalSelected).toBe(14);
    expect(review.gates.G2.pass).toBe(true);
    for (const row of review.gates.G2.perOfficeCounts) expect(row.count).toBe(2);
  });

  it("pins G3: G_R2 equals O exactly (14 generated keys, no missing, no extra)", () => {
    expect(review.gates.G3.generatedCount).toBe(14);
    expect(review.gates.G3.observedCount).toBe(14);
    expect(review.gates.G3.equalsObserved).toBe(true);
    expect(review.gates.G3.pass).toBe(true);
    expect(review.gates.G3.matched).toHaveLength(14);
    expect(review.gates.G3.missing).toEqual([]);
    expect(review.gates.G3.extra).toEqual([]);
  });

  it("pins G4: non-collapse — 14 generated vs 28 granted, T-B output is U", () => {
    expect(review.gates.G4.generatedCount).toBe(14);
    expect(review.gates.G4.uKeyCount).toBe(28);
    expect(review.gates.G4.tBOutputCount).toBe(28);
    expect(review.gates.G4.strictSubset).toBe(true);
    expect(review.gates.G4.nonCollapse).toBe(true);
    expect(review.gates.G4.pass).toBe(true);
    expect(review.gates.G4.statement).toContain("satellite-reading");
  });

  it("pins G5: 7 realized midpoints, 2 observation-exact, 5 unverified predictions", () => {
    expect(review.gates.G5.realized).toBe(7);
    expect(review.gates.G5.exact).toBe(2);
    expect(review.gates.G5.unverified).toBe(5);
    expect(review.gates.G5.entries).toHaveLength(7);
    const exact = review.gates.G5.entries.filter((entry) => entry.exact === true);
    const unverified = review.gates.G5.entries.filter((entry) => entry.exact === "unverified");
    expect(exact.map((entry) => entry.office).sort()).toEqual(["0", "6"]);
    expect(exact.every((entry) => entry.prediction === null)).toBe(true);
    expect(unverified).toHaveLength(5);
    for (const entry of unverified) {
      expect(entry.realized).toBe(true);
      expect(entry.prediction).toContain("comparison.tC.observedRelations");
    }
    expect(review.gates.G5.seamCrossCheck).toEqual({
      generatedRelations: 7,
      equalsRealizedSet: true,
      observedRelations: 2,
      equalsExactSubset: true,
      realizationOfObserved: true,
    });
    expect(review.gates.G5.pass).toBe(true);
  });

  it("pins the constraint-satisfaction table: four constraints, all satisfied", () => {
    expect(review.constraintTable).toHaveLength(4);
    expect(review.constraintTable.map((row) => row.constraint)).toEqual([
      "Predicate P incorporated",
      "Full cycle-edge traversal (T1 + T2)",
      "Break the cycle-edge <-> construction-pair identity",
      "T-C midpoint scope adjudicated",
    ]);
    expect(review.constraintTable.every((row) => row.satisfied === true)).toBe(true);
    expect(review.constraintTable[2].mechanism).toContain("satellite-reading");
  });

  it("carries the binding fences and bounded non-accomplishments", () => {
    expect(review.fences.governsVerdicts).toContain("none");
    expect(review.fences.recordAmendment).toContain("claim event");
    expect(review.fences.routeAdmission).toContain("none");
    expect(review.fences.derivationExecution).toContain("none");
    expect(review.fences.wall).toContain("untouched");
    expect(review.fences.g1Intra330).toBe("untouched");
    expect(review.fences.direction).toContain("unassigned");
    expect(review.fences.membrane).toContain("never design input");
    expect(review.notAccomplished).toHaveLength(6);
  });
});
