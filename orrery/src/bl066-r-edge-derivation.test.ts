import { describe, expect, it } from "vitest";

import derivation from "./generated/bl066-r-edge-derivation.v1.json";

describe("BL-066 R-edge derivation (reach / H8 closure law / direction / coverage) — pinned", () => {
  it("pins schema, status, fingerprint, source bindings and the chain anchors", () => {
    expect(derivation.schemaVersion).toBe("harmonic-orrery.bl066-r-edge-derivation.v1");
    expect(derivation.derivationId).toBe("BL066_R_EDGE_DERIVATION_V1");
    expect(derivation.status).toBe("planning_evidence");
    expect(derivation.generator).toBe("scripts/build-bl066-r-edge-derivation.mjs");
    expect(derivation.derivationFingerprint).toMatch(/^[0-9a-f]{64}$/);
    expect(derivation.sourceBindings).toHaveLength(4);
    expect(derivation.sourceBindings.every((binding) => /^[0-9a-f]{64}$/.test(binding.sha256))).toBe(true);
    expect(derivation.base.artifact).toBe("orrery/src/generated/bl064-cycle-ground.v1.json");
    expect(derivation.base.derivationFingerprint).toBe("aa975820136658dd2fb3c84d98b34bf7a1901d39edd6548a300f458858305918");
    expect(derivation.base.chainAnchor.reconstructionFingerprint).toBe("6d33c67be7b8f87b8ad2f964cd3560ebcbc1ec0dc6b2088ad1f223c35caff8c3");
    expect(derivation.base.projectionArtifact).toBe("qa/d4-production-generation.json");
    expect(derivation.base.containmentArtifact).toBe("derived/hypergraph/bipartite-inclusion-v1.json");
  });

  it("pins the domain census: 7 A1 parents and 28 A1 satellites from the ledger role/tier partition", () => {
    expect(derivation.domain.parentCensus.count).toBe(7);
    expect(derivation.domain.parentCensus.masks).toEqual([
      "1371", "1389", "1461", "1707", "1749", "2733", "2901",
    ]);
    expect(derivation.domain.satelliteCensus.count).toBe(28);
    expect(derivation.domain.readFields).toContain("role, tier, bit, pitchSet");
    expect(derivation.domain.statement).toContain("no R edge");
  });

  it("pins the R-H2 reach: 24 placed / 4 unplaced / zero extras, per-parent sets", () => {
    expect(derivation.reach.census).toMatchObject({ placed: 24, unplaced: 4, assigned: 28, domainSize: 28, extraOnDomain: 0 });
    expect(derivation.reach.unplaced).toEqual(["695", "731", "2921", "3497"]);
    const byParent = new Map(derivation.reach.perParent.map((row) => [row.parent, row]));
    expect(byParent.get("1371")?.satellites).toEqual(["1243", "1339", "1627", "2395"]);
    expect(byParent.get("1389")).toMatchObject({ satellites: ["877", "1261", "2413"], count: 3 });
    expect(byParent.get("1461")).toMatchObject({ satellites: ["949", "1465"], count: 2 });
    expect(byParent.get("1749")).toMatchObject({ satellites: ["1747", "1753", "1765"], count: 3 });
    expect(byParent.get("1707")?.satellites).toEqual(["1691", "1703", "1739", "1835"]);
    expect(byParent.get("2733")?.satellites).toEqual(["2669", "2717", "2861", "3245"]);
    expect(byParent.get("2901")?.satellites).toEqual(["2893", "2899", "2917", "2965"]);
  });

  it("pins the named robustness finding: H2 reach and containment reach agree on 24, tie on the same 4", () => {
    expect(derivation.reach.robustness.placedAgreement).toBe("24/24");
    expect(derivation.reach.robustness.unplacedNonResolution).toBe("4/4");
    const ties = derivation.reach.robustness.perSatellite.filter((row) => !row.uniqueBest);
    expect(ties).toHaveLength(4);
    for (const row of ties) {
      expect(row.bestParents).not.toContain(row.assignedParent);
    }
    expect(derivation.reach.robustness.statement).toContain("robust");
  });

  it("pins the H8 closure law: the path, the reach-minimum assignments and the unique equalizing matching", () => {
    expect(derivation.closure.h8Structure.path.nodes).toEqual([
      "1371", "695", "1389", "731", "1461", "2921", "1749", "3497", "2901",
    ]);
    expect(derivation.closure.law.memberSide.assignments).toEqual([
      { satellite: "695", parent: "1389" },
      { satellite: "731", parent: "1461" },
      { satellite: "2921", parent: "1461" },
      { satellite: "3497", parent: "1749" },
    ]);
    expect(derivation.closure.law.matchingSide).toMatchObject({ enumerationSize: 16, equalizingCount: 1 });
    expect(derivation.closure.law.matchingSide.equalizing).toEqual([
      { satellite: "695", parent: "1389" },
      { satellite: "731", parent: "1461" },
      { satellite: "2921", parent: "1461" },
      { satellite: "3497", parent: "1749" },
    ]);
    expect(derivation.closure.law.equivalence).toBe(true);
    expect(derivation.closure.preRegistered.internalPair).toMatchObject({ pair: ["731", "2921"] });
    expect(derivation.closure.preRegistered.crossPair).toMatchObject({
      pair: ["695", "3497"],
      assignments: [
        { satellite: "695", parent: "1389" },
        { satellite: "3497", parent: "1749" },
      ],
    });
  });

  it("pins the rotation null census, the battery results and the officeSum-6 out-of-sample corroboration", () => {
    expect(derivation.closure.rotationCensus.totalHits).toBe(0);
    const members = new Map(derivation.closure.battery.members.map((member) => [member.member, member]));
    expect(members.get("pcSum")?.agrees).toBe(true);
    expect(members.get("maskNumeric")?.agrees).toBe(true);
    expect(members.get("kappa")?.result).toBe("undecided_orientation_relative");
    expect(members.get("containment")?.result).toBe("control_inapplicable");
    expect(derivation.closure.officeSum6.inducedFromPlacedPairs).toBe(12);
    expect(derivation.closure.officeSum6.predictionConfirmed).toBe(2);
    expect(derivation.closure.officeSum6.perPair.every((row) => row.sum === 6)).toBe(true);
    expect(derivation.closure.officeSum6.statement).toContain("not as its justification");
  });

  it("pins the emergent count-4 (OD-P3-5 strongest form) and the direction probes", () => {
    expect(derivation.closure.emergentCount.commonValue).toBe(4);
    expect(derivation.closure.emergentCount.perParent.every((row) => row.after === 4)).toBe(true);
    expect(derivation.closure.emergentCount.statement).toContain("emerges from the machinery");
    expect(derivation.direction.uniqueHub.resolved).toBe(24);
    expect(derivation.direction.icAxis.parentIc).toEqual([2, 5, 4, 4, 4, 2]);
    expect(derivation.direction.icAxis.satelliteIcClasses).toEqual([
      { vector: [3, 3, 6, 3, 3, 3], count: 14 },
      { vector: [3, 4, 4, 4, 5, 1], count: 14 },
    ]);
    expect(derivation.direction.icAxis.distinguishableEdges).toBe(28);
    expect(derivation.direction.icAxis.correction).toContain("[2,5,4,4,4,2]");
    expect(derivation.direction.icAxis.status).toContain("not promoted here");
    expect(derivation.direction.canonicalClass).toMatchObject({ sourceClasses: ["7-34"], splitCount: 28 });
  });

  it("pins the mechanism consistency: per-office 4s, no crossover, GSL 2+2 per parent", () => {
    expect(derivation.mechanism.perOffice).toHaveLength(7);
    expect(derivation.mechanism.perOffice.every((row) => row.satellites.length === 4)).toBe(true);
    expect(derivation.mechanism.perOffice.every((row) => row.h2Count + row.closureCount === 4)).toBe(true);
    expect(derivation.mechanism.gsl.signAgreement).toBe(28);
    expect(derivation.mechanism.gsl.officeSignSeparation).toBe(7);
    for (const row of derivation.mechanism.gsl.perOffice) {
      expect(row.seven27).toHaveLength(2);
      expect(row.seven31).toHaveLength(2);
      expect(row.signSeparates).toBe(true);
    }
  });

  it("pins the coverage gate: 28/28 set-equal, no missing/extra, office alignment 28/28 under kappa1", () => {
    expect(derivation.coverage.setEqual).toBe(true);
    expect(derivation.coverage.derivedCount).toBe(28);
    expect(derivation.coverage.grantedCount).toBe(28);
    expect(derivation.coverage.missing).toEqual([]);
    expect(derivation.coverage.extra).toEqual([]);
    expect(derivation.coverage.perParent).toHaveLength(7);
    expect(derivation.coverage.perParent.every((row) => row.equal)).toBe(true);
    const byParent = new Map(derivation.coverage.perParent.map((row) => [row.parent, row]));
    expect(byParent.get("1389")?.granted).toEqual(["695", "877", "1261", "2413"]);
    expect(byParent.get("1461")?.granted).toEqual(["731", "949", "1465", "2921"]);
    expect(byParent.get("1749")?.granted).toEqual(["1747", "1753", "1765", "3497"]);
    expect(derivation.coverage.officeAlignment.matchesKappa1).toBe(28);
    expect(derivation.coverage.officeAlignment.matchesKappa0).toBe(4);
    expect(derivation.coverage.officeAlignment.perEdge.every((row) => row.satelliteOfficeMatchesParentOffice)).toBe(true);
  });

  it("pins the reflection handling: edge set invariant, labels relative, bit carried to BL-065", () => {
    expect(derivation.reflection.edgeSetInvariant).toBe(true);
    expect(derivation.reflection.labelFlip).toBe("c -> 6-c");
    expect(derivation.reflection.carried).toBe("BL-065");
    for (const row of derivation.reflection.kappa1Centers) {
      const mirrored = derivation.reflection.kappa0Centers.find((entry) => entry.mask === row.mask);
      expect(mirrored?.center).toBe((6 - row.center) % 7);
    }
    expect(derivation.reflection.statement).toContain("BL-065");
  });

  it("pins the gates, the synthesis verdict and the grant discharge", () => {
    for (const key of ["V-P3-1", "V-P3-2", "V-P3-3", "V-P3-4", "V-P3-5"] as const) {
      expect(derivation.gates[key].result).toBe("PASS");
    }
    expect(derivation.synthesis.verdict).toBe("R_EDGES_DERIVED");
    expect(derivation.synthesis.preRegisteredVerdicts).toEqual([
      "R_EDGES_DERIVED", "R_EDGES_PARTIAL", "R_EDGES_FAILED",
    ]);
    expect(derivation.synthesis.grantDischarge.discharged).toContain("28-edge");
    expect(derivation.synthesis.grantDischarge.remaining).toContain("orientation");
    expect(derivation.synthesis.dependencyChain.position).toContain("phase 3 of 4");
    expect(derivation.synthesis.dependencyChain.necessaryNotSufficient).toContain("necessary-not-sufficient");
    expect(derivation.synthesis.limits).toHaveLength(4);
  });

  it("pins the bit inventory: one carried bit (orientation, BL-065), the swap-bit candidate dissolved", () => {
    expect(derivation.synthesis.bitInventory.carried).toHaveLength(1);
    expect(derivation.synthesis.bitInventory.carried[0].bit).toContain("office-orientation");
    expect(derivation.synthesis.bitInventory.carried[0].destination).toBe("BL-065");
    expect(derivation.synthesis.bitInventory.carried[0].candidateSources).toHaveLength(2);
    expect(derivation.synthesis.bitInventory.dissolved).toHaveLength(1);
    expect(derivation.synthesis.bitInventory.dissolved[0].status).toBe("candidate dissolved");
    expect(derivation.synthesis.bitInventory.statement).toContain("ONE carried bit");
    expect(derivation.synthesis.higherTheorem.answer).toContain("affirmative");
    expect(derivation.synthesis.higherTheorem.label).toContain("finding, not admission");
  });

  it("carries the binding fences and the bounded non-accomplishments", () => {
    expect(derivation.fences.higherTheorem).toContain("finding");
    expect(derivation.fences.governsVerdicts).toContain("not a GOVERNS admission");
    expect(derivation.fences.requirementScope).toContain("requirements 1 and 3");
    expect(derivation.fences.g1Intra330).toBe("untouched");
    expect(derivation.fences.direction).toContain("unassigned");
    expect(derivation.fences.membrane).toContain("never design input");
    expect(derivation.fences.orientationBit).toContain("BL-065");
    expect(derivation.contractCitations.some((citation) => citation.includes("bl-059-governs-derivability"))).toBe(true);
    expect(derivation.contractCitations.some((citation) => citation.includes("bl-063-office-reconstruction-memo"))).toBe(true);
    expect(derivation.contractCitations.some((citation) => citation.includes("bl-064-cycle-ground-memo"))).toBe(true);
    expect(derivation.notAccomplished).toHaveLength(8);
  });
});
