import { describe, expect, it } from "vitest";

import census from "./generated/semantic-derivation-census.v1.json";

const CORNERSTONE_IDS = ["5-35:0", "5-35:10", "5-35:3", "5-35:5", "5-35:8"];

describe("Semantic-derivation census (BL-035)", () => {
  it("pins the two-mechanism scope", () => {
    expect(census.schemaVersion).toBe("harmonic-orrery.semantic-derivation-census.v1");
    expect(census.censusId).toBe("SEMANTIC_DERIVATION_CENSUS_v1");
    expect(census.status).toBe("planning_evidence");
    expect(census.scope.seeds.count).toBe(7);
    expect(census.scope.seeds.stateIds).toEqual([1387, 1451, 1453, 1709, 1717, 2741, 2773]);
    expect(census.scope.pentatonic.count).toBe(330);
    expect(census.scope.heptatonicBaseline.count).toBe(455);
    expect(census.heptatonicBaseline.officeCoverage).toEqual({ withOffice: 301, withoutOffice: 154 });
  });

  it("records the pre-registered four-way pentatonic distribution", () => {
    expect(census.pentatonicCensus.classTotals).toEqual([
      { classification: "single-claimant", count: 50 },
      { classification: "multi-claimant-agreeing", count: 0 },
      { classification: "multi-claimant-conflicting", count: 25 },
      { classification: "zero-claimant", count: 255 },
    ]);
    expect(census.pentatonicCensus.claimantHistogram).toEqual([
      { claimantCount: 0, count: 255 },
      { claimantCount: 1, count: 50 },
      { claimantCount: 2, count: 20 },
      { claimantCount: 3, count: 5 },
    ]);
  });

  it("characterizes the 25 conflicts as distinct-pool collisions with the cornerstone five at depth three", () => {
    const conflicts = census.pentatonicCensus.conflictInventory;
    expect(conflicts).toHaveLength(25);
    expect(conflicts.every((conflict) => conflict.distinctLandforms)).toBe(true);
    expect(conflicts.every((conflict) => new Set(conflict.claimants.map((claimant) => claimant.office)).size === conflict.claimants.length)).toBe(true);
    const deep = conflicts.filter((conflict) => conflict.claimants.length === 3).map((conflict) => conflict.id);
    expect(deep.sort()).toEqual(CORNERSTONE_IDS);
  });

  it("stratifies boundary-proximity: all census bridges are claimed; windowed nodes are exactly the cornerstone five", () => {
    expect(census.pentatonicCensus.strata.byCensusBridge).toEqual([
      { stratum: "bridge", classification: "multi-claimant-conflicting", count: 20 },
      { stratum: "bridge", classification: "single-claimant", count: 50 },
      { stratum: "interior", classification: "multi-claimant-conflicting", count: 5 },
      { stratum: "interior", classification: "zero-claimant", count: 255 },
    ]);
    expect(census.pentatonicCensus.strata.byKernelWindow).toEqual([
      { stratum: "unwindowed", classification: "multi-claimant-conflicting", count: 20 },
      { stratum: "unwindowed", classification: "single-claimant", count: 50 },
      { stratum: "unwindowed", classification: "zero-claimant", count: 255 },
      { stratum: "windowed", classification: "multi-claimant-conflicting", count: 5 },
    ]);
  });

  it("pins the seven seed pools", () => {
    expect(census.seedPools.map((seed) => seed.office)).toEqual([
      "Jupiter",
      "Mars",
      "Mercury",
      "Moon",
      "Saturn",
      "Sun",
      "Venus",
    ]);
    expect(census.seedPools.every((seed) => seed.landforms.length > 0)).toBe(true);
    expect(census.seedPools.find((seed) => seed.office === "Mars")?.landforms).toContain("volcanoes");
  });

  it("leaves direction unassigned while recording the admitted directional fields", () => {
    expect(census.directionFields).toEqual({
      kernelWindowRecorded: true,
      courtContentRecorded: true,
      directionAssigned: false,
      basis: "no admitted source maps court position or kernel window to Earth-ward/Fire-ward meaning; direction is recorded as unassigned, never inferred",
    });
    expect(census.pentatonicCensus.records.every((record) => record.claimants.every((claimant) => Array.isArray(claimant.courtContent)))).toBe(true);
  });

  it("carries a source-bound fingerprint", () => {
    expect(census.censusFingerprint).toMatch(/^[a-f0-9]{64}$/);
    expect(census.sourceBindings).toHaveLength(6);
    expect(census.sourceBindings.every((binding) => /^[a-f0-9]{64}$/.test(binding.sha256))).toBe(true);
  });
});
