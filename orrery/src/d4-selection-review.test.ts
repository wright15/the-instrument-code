import { describe, expect, it } from "vitest";

import review from "./generated/d4-selection-review.v1.json";

describe("D4 selection-mechanism review (BL-055) — predicate, geometry, contract", () => {
  it("pins schema, status, governance class and fingerprint", () => {
    expect(review.schemaVersion).toBe("harmonic-orrery.d4-selection-review.v1");
    expect(review.reviewId).toBe("BL055_D4_SELECTION_REVIEW_v1");
    expect(review.status).toBe("planning_evidence");
    expect(review.generator).toBe("scripts/build-d4-selection-review.mjs");
    expect(review.reviewFingerprint).toMatch(/^[0-9a-f]{64}$/);
    expect(review.sourceBindings).toHaveLength(8);
    expect(review.sourceBindings.every((binding) => /^[0-9a-f]{64}$/.test(binding.sha256))).toBe(true);
  });

  it("pins Step 0: patch-only execution scope and the hypothesis-B verdict", () => {
    expect(review.step0.s0_1.finding).toBe("PATCH_ONLY");
    expect(review.step0.s0_1.evidence.calibrationPerPhase).toBe("11, 0, 1");
    expect(review.step0.s0_1.verdict).toContain("pre-falsified");
    expect(review.step0.s0_2.verdict).toContain("phase-independent");
    expect(review.step0.scopeLanguage).toContain("free-context = keying mode; patch = phase scope");
  });

  it("pins the frozen domain: 28 granted keys, 14 observed, 2 per office, cells 0/10/4/0", () => {
    expect(review.domain.uKeys).toHaveLength(28);
    expect(review.domain.observedKeys).toHaveLength(14);
    expect(review.domain.fourCellCounts).toEqual({ aOnly: "0", bOnly: "10", both: "4", neither: "0" });
    expect(review.domain.perOffice).toHaveLength(7);
    for (const office of review.domain.perOffice) {
      expect(office.keys).toHaveLength(4);
      expect(office.observed).toHaveLength(2);
      expect(office.observedCount).toBe(2);
    }
    expect(review.domain.perOffice.map((office) => office.parentH)).toEqual(
      ["1371", "1749", "2733", "1461", "1707", "1389", "2901"],
    );
    expect(review.table28).toHaveLength(28);
  });

  it("finds the clean 14/14 set-class split and the recorded near-miss", () => {
    const observed = review.table28.filter((row) => row.observed);
    const unobserved = review.table28.filter((row) => !row.observed);
    expect(observed.map((row) => row.forte)).toEqual(Array(14).fill("7-27"));
    expect(unobserved.map((row) => row.forte)).toEqual(Array(14).fill("7-31"));
    expect(new Set(observed.map((row) => row.intervalVector))).toEqual(new Set(["3,4,4,4,5,1"]));
    expect(new Set(unobserved.map((row) => row.intervalVector))).toEqual(new Set(["3,3,6,3,3,3"]));
    const split = review.axes.find((axis) => axis.axis === "setClassFamily");
    expect(split).toMatchObject({ split: true, nearMiss: false, verdict: "CLEAN_SPLIT_14_14" });
    expect(split?.confusion).toEqual({ tp: 14, fp: 0, fn: 0, tn: 14 });
    const nearMiss = review.axes.find((axis) => axis.axis === "cornerstoneContainment");
    expect(nearMiss).toMatchObject({ split: false, nearMiss: true, verdict: "FAIL_NEAR_MISS" });
    expect(nearMiss?.confusion).toEqual({ tp: 12, fp: 0, fn: 2, tn: 14 });
  });

  it("records the failed and constant axes with their evidence classes", () => {
    expect(review.axisSummary.tested).toBe(9);
    expect(review.axisSummary.cleanSplits).toEqual(["setClassFamily"]);
    expect(review.axisSummary.nearMisses).toEqual(["cornerstoneContainment"]);
    const byAxis = new Map(review.axes.map((axis) => [axis.axis, axis]));
    expect(byAxis.get("containmentDegree")?.verdict).toBe("CONSTANT_UNIFORM_MESH");
    expect(byAxis.get("bridgeSubnodes")?.confusion).toEqual({ tp: 10, fp: 0, fn: 4, tn: 14 });
    expect(byAxis.get("kernelWindowMembership")?.verdict).toBe("NON_APPLICABLE_CONSTANT");
    expect(byAxis.get("officeElementPairing")?.verdict).toBe("CONSTANT");
    expect(byAxis.get("phaseContextMultiplicity")?.verdict).toBe("UNIFORM");
    expect(byAxis.get("seamIncidence")?.confusion).toEqual({ tp: 4, fp: 2, fn: 10, tn: 12 });
    expect(byAxis.get("satelliteRoleComposite")?.verdict).toBe("FORTE_ONLY");
    for (const row of review.table28) expect(row.admittedSubnodes).toBe(15);
  });

  it("proves T-B definitional: every A1 anchor has exactly two distinct E-parents", () => {
    expect(review.tbProof.definitional).toBe(true);
    expect(review.tbProof.perAnchor).toHaveLength(7);
    for (const anchor of review.tbProof.perAnchor) {
      expect(new Set(anchor.parents).size).toBe(2);
      expect(anchor.satellites).toHaveLength(4);
      expect(anchor.witnesses).toBe(8);
      expect(anchor.keys).toHaveLength(4);
    }
    expect(review.tbProof.totalWitnesses).toBe(56);
    expect(review.tbProof.joinReadsSatelliteOnlyAsPayload).toBe(true);
    expect(review.tbProof.generatedKeys).toEqual(review.domain.uKeys);
  });

  it("pins the T-A under-coverage: two in-A0 rotation images, T1-only pairs", () => {
    expect(review.taGeometry.inA0RotationImages).toBe(2);
    expect(review.taGeometry.frozenPairs).toEqual([
      { a: "2741", b: "1387", k: "0" },
      { a: "2773", b: "1451", k: "6" },
    ]);
    expect(review.taGeometry.generatedKeys).toEqual([
      "0:1243", "0:1339", "0:1627", "0:2395", "6:2893", "6:2899", "6:2917", "6:2965",
    ]);
    expect(review.taGeometry.missedObservedKeys).toHaveLength(10);
    const images = review.taGeometry.rotTable.filter((row) => row.inA0);
    expect(images.map((row) => row.rotateImage)).toEqual(["1387", "1451"]);
    expect(images.every((row) => row.officeDelta === "2")).toBe(true);
  });

  it("pins the closed A0 transposition cycle: 7 edges, intervals summing to 12", () => {
    expect(review.taGeometry.cycle.closes).toBe(true);
    expect(review.taGeometry.cycle.edges).toHaveLength(7);
    expect(review.taGeometry.cycle.intervalSum).toBe(12);
    expect(review.taGeometry.cycle.t1Edges).toEqual(["0", "6"]);
    expect(review.taGeometry.cycle.t2Edges).toEqual(["1", "2", "3", "4", "5"]);
    expect(review.taGeometry.seamEdges).toHaveLength(9);
  });

  it("pins the OD-3 per-phase diagnostic: flanks reach U, the center phase reproduces the frozen set", () => {
    const perPhase = new Map(review.od3Diagnostic.perPhase.map((row) => [row.phase, row]));
    expect(perPhase.get("11")?.touchingOffices).toEqual(["0", "1", "2", "3", "4", "5", "6"]);
    expect(perPhase.get("1")?.touchingOffices).toEqual(["0", "1", "2", "3", "4", "5", "6"]);
    expect(perPhase.get("0")?.touchingOffices).toEqual(["0", "6"]);
    expect(perPhase.get("11")?.touchingKeys).toBe(28);
    expect(perPhase.get("0")?.touchingKeys).toBe(8);
    expect(review.od3Diagnostic.verdict).toContain("not an observed-set discriminator");
  });

  it("pins the synthesis: predicate, three blockers, BL-056 design item and the ROE observation", () => {
    expect(review.synthesis.predicate.definition).toBe("P(s) = [forte(s) = 7-27]");
    expect(review.synthesis.predicate.confusion).toEqual({ tp: 14, fp: 0, fn: 0, tn: 14 });
    expect(review.synthesis.underKeyings.frozenTA.predicateIntersection).toBe(4);
    expect(review.synthesis.underKeyings.seamTA.predicateIntersection).toBe(14);
    expect(review.synthesis.underKeyings.seamTA.equalsObserved).toBe(true);
    expect(review.synthesis.blockers.map((blocker) => blocker.name)).toEqual([
      "frozen-geometry", "tb-definitional", "tc-overshoot",
    ]);
    expect(review.synthesis.designItem.id).toBe("BL-056");
    expect(review.synthesis.designItem.hardConstraint).toContain("cycle-edge <-> construction-pair identity");
    expect(review.synthesis.noPredicateBranch.fired).toBe(false);
    expect(review.synthesis.observationROE).toBe(
      "O's predicate class 7-27 is the same-number complement sibling of admitted bridge class 5-27 (landed binding concept; observation only, not evidence).",
    );
    expect(review.synthesis.standing).toContain("stands entirely on its own merits");
  });

  it("carries the binding fences and bounded non-accomplishments", () => {
    expect(review.fences.governsVerdicts).toContain("none");
    expect(review.fences.recordAmendment).toContain("claim event");
    expect(review.fences.g1Intra330).toBe("untouched");
    expect(review.fences.direction).toContain("unassigned");
    expect(review.fences.membrane).toContain("never design input");
    expect(review.fences.routeExecution).toContain("none");
    expect(review.notAccomplished).toHaveLength(6);
  });
});
