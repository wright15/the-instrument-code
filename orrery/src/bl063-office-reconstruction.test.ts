import { describe, expect, it } from "vitest";

import reconstruction from "./generated/bl063-office-reconstruction.v1.json";

describe("BL-063 intrinsic office reconstruction (P7 / kappa / midZ7 / reflection) — pinned", () => {
  it("pins schema, status, governance class, fingerprint and the chain anchor", () => {
    expect(reconstruction.schemaVersion).toBe("harmonic-orrery.bl063-office-reconstruction.v1");
    expect(reconstruction.reconstructionId).toBe("BL063_OFFICE_RECONSTRUCTION_v1");
    expect(reconstruction.status).toBe("planning_evidence");
    expect(reconstruction.generator).toBe("scripts/build-bl063-office-reconstruction.mjs");
    expect(reconstruction.reconstructionFingerprint).toMatch(/^[0-9a-f]{64}$/);
    expect(reconstruction.sourceBindings).toHaveLength(5);
    expect(reconstruction.sourceBindings.every((binding) => /^[0-9a-f]{64}$/.test(binding.sha256))).toBe(true);
    expect(reconstruction.base.artifact).toBe("orrery/src/generated/d4-14v14-hunt.v1.json");
    expect(reconstruction.base.huntFingerprint).toBe("8a1295ca9639fab7e16b980576954a1f12824d839e6743abebe176e3df23cac9");
    expect(reconstruction.base.projectionArtifact).toBe("qa/d4-production-generation.json");
  });

  it("pins the P7 line graph: endpoints, degrees, pcSum ladder", () => {
    expect(reconstruction.p7.endpoints).toEqual(["1387", "2773"]);
    expect(reconstruction.p7.edges).toEqual([
      ["1387", "1451"],
      ["1451", "1453"],
      ["1453", "1709"],
      ["1709", "1717"],
      ["1717", "2741"],
      ["2741", "2773"],
    ]);
    expect(reconstruction.p7.bfsOrder).toEqual(["1387", "1451", "1453", "1709", "1717", "2741", "2773"]);
    expect(reconstruction.p7.pcSumChain).toEqual([33, 34, 35, 36, 37, 38, 39]);
    const degrees = new Map(reconstruction.p7.nodes.map((node) => [node.mask, node.degree]));
    expect(degrees.get("1387")).toBe(1);
    expect(degrees.get("2773")).toBe(1);
    expect([...degrees.values()].filter((degree) => degree === 2)).toHaveLength(5);
    expect(reconstruction.p7.statement).toContain("path P7");
  });

  it("pins the kappa derivation and the canonical alignment (1/7 vs 7/7)", () => {
    expect(reconstruction.kappaBoth.kappa0).toEqual([
      { mask: "1387", index: 0 },
      { mask: "1451", index: 1 },
      { mask: "1453", index: 2 },
      { mask: "1709", index: 3 },
      { mask: "1717", index: 4 },
      { mask: "2741", index: 5 },
      { mask: "2773", index: 6 },
    ]);
    expect(reconstruction.kappaBoth.kappa1).toEqual([
      { mask: "1387", index: 6 },
      { mask: "1451", index: 5 },
      { mask: "1453", index: 4 },
      { mask: "1709", index: 3 },
      { mask: "1717", index: 2 },
      { mask: "2741", index: 1 },
      { mask: "2773", index: 0 },
    ]);
    expect(reconstruction.kappaBoth.alignment.kappa0MatchesCanonical).toBe(1);
    expect(reconstruction.kappaBoth.alignment.kappa1MatchesCanonical).toBe(7);
    expect(reconstruction.kappaBoth.alignment.statement).toContain("reflection-equivariant");
  });

  it("pins the constructor identification: 5 sandwich + 2 twin-closure", () => {
    expect(reconstruction.piTable.internalCount).toBe(5);
    expect(reconstruction.piTable.boundaryCount).toBe(2);
    const byChild = new Map(reconstruction.piTable.perAnchor.map((entry) => [entry.child, entry]));
    expect(byChild.get("1371")).toMatchObject({
      mode: "twin-closure",
      hamming2Neighbors: ["1387"],
      constructors: ["1387", "2741"],
      sandwichOnConstructors: false,
      twin: "2741",
      unrestrictedSandwichCount: 1,
      unrestrictedSandwichPairs: [["1387", "2773"]],
    });
    expect(byChild.get("2901")).toMatchObject({
      mode: "twin-closure",
      hamming2Neighbors: ["2773"],
      constructors: ["1451", "2773"],
      sandwichOnConstructors: false,
      twin: "1451",
      unrestrictedSandwichCount: 1,
      unrestrictedSandwichPairs: [["1387", "2773"]],
    });
    for (const child of ["1389", "1461", "1707", "1749", "2733"]) {
      expect(byChild.get(child)?.mode).toBe("sandwich");
      expect(byChild.get(child)?.sandwichOnConstructors).toBe(true);
      expect(byChild.get(child)?.hamming2Neighbors).toEqual(byChild.get(child)?.constructors);
    }
    expect(byChild.get("1371")?.hamming2Neighbors).not.toEqual(byChild.get("1371")?.constructors);
    expect(reconstruction.piTable.statement).toContain("Hamming-2 adjacency restriction is the identifying condition");
  });

  it("pins the midZ7 comparison: M1 at counts 1/7 with reflection complementarity", () => {
    expect(reconstruction.midComparison.definition.expression).toBe("midZ7(a,b) = (4*(a+b)) % 7");
    expect(reconstruction.midComparison.perAnchor).toHaveLength(7);
    const byChild = new Map(reconstruction.midComparison.perAnchor.map((row) => [row.child, row]));
    expect(byChild.get("1371")).toMatchObject({ g0: 6, g1: 0, canonical: 0, match0: false, match1: true, complementary: true });
    expect(byChild.get("1461")).toMatchObject({ g0: 3, g1: 3, canonical: 3, match0: true, match1: true, complementary: true });
    expect(byChild.get("2901")).toMatchObject({ g0: 0, g1: 6, canonical: 6, match0: false, match1: true, complementary: true });
    expect(reconstruction.midComparison.match0Count).toBe(1);
    expect(reconstruction.midComparison.match1Count).toBe(7);
    expect(reconstruction.midComparison.outcome).toBe("M1");
    expect(reconstruction.midComparison.outcomeStatement).toContain("exactly one orientation");
  });

  it("pins the reflection-equivariance proof (49/49) and the reflection block", () => {
    expect(reconstruction.reflection.formula).toBe("midZ7(6-a, 6-b) == (6 - midZ7(a,b)) % 7");
    expect(reconstruction.reflection.verifiedPairs).toBe(49);
    expect(reconstruction.reflection.holds).toBe(true);
    expect(reconstruction.reflection.statement).toContain("reflection-blind");
  });

  it("pins the orientation probes: H_A coincides; H_B returns the containment-twin null", () => {
    expect(reconstruction.orientation.hA.maxPcSum).toEqual({ mask: "2773", pcSum: 39 });
    expect(reconstruction.orientation.hA.minPcSum).toEqual({ mask: "1387", pcSum: 33 });
    expect(reconstruction.orientation.hA.orientation).toBe("kappa1");
    expect(reconstruction.orientation.hA.coincidesWithUniqueMatch).toBe(true);
    expect(reconstruction.orientation.hA.premise).toContain("interpretation vocabulary");
    expect(reconstruction.orientation.hB.distinguishable).toBe(false);
    expect(reconstruction.orientation.hB.profiles).toHaveLength(2);
    expect(reconstruction.orientation.hB.profiles[0].counts).toEqual(reconstruction.orientation.hB.profiles[1].counts);
    expect(reconstruction.orientation.hB.profiles[0]).toMatchObject({ nonZSum: 8, zSum: 12 });
    expect(reconstruction.orientation.hB.note).toContain("containment twins");
  });

  it("pins the synthesis: CONSTRAINED_TO_REFLECTION with the one-bit residual named", () => {
    expect(reconstruction.synthesis.verdict).toBe("CONSTRAINED_TO_REFLECTION");
    expect(reconstruction.synthesis.preRegisteredVerdicts).toEqual([
      "FORMALLY_DISCHARGED", "CONSTRAINED_TO_REFLECTION", "FAILED",
    ]);
    expect(reconstruction.synthesis.requirement).toContain("requirement 2");
    expect(reconstruction.synthesis.verdictStatement).toContain("reflection-equivariant");
    expect(reconstruction.synthesis.verdictStatement).toContain("Lydian/Locrian");
    expect(reconstruction.synthesis.recovery.a0Recovered).toHaveLength(7);
    expect(reconstruction.synthesis.recovery.a0Recovered.every((row) => row.matches)).toBe(true);
    expect(reconstruction.synthesis.recovery.a1Recovered).toHaveLength(7);
    expect(reconstruction.synthesis.recovery.a1Recovered.every((row) => row.matches)).toBe(true);
    expect(reconstruction.synthesis.residualDependency).toMatchObject({ bits: 1, alternativesAgree: true });
    expect(reconstruction.synthesis.residualDependency.namedAlternatives).toHaveLength(2);
    expect(reconstruction.synthesis.dependencyChain.position).toContain("phase 1 of 4");
    expect(reconstruction.synthesis.dependencyChain.necessaryNotSufficient).toContain("necessary-not-sufficient");
    expect(reconstruction.synthesis.limits).toHaveLength(4);
  });

  it("carries the binding fences and bounded non-accomplishments", () => {
    expect(reconstruction.fences.higherTheorem).toContain("remains open");
    expect(reconstruction.fences.requirementScope).toContain("requirement 2 only");
    expect(reconstruction.fences.g1Intra330).toBe("untouched");
    expect(reconstruction.fences.direction).toContain("unassigned");
    expect(reconstruction.fences.membrane).toContain("never design input");
    expect(reconstruction.fences.d7Control).toContain("hypothesis-tier");
    expect(reconstruction.contractCitations.some((citation) => citation.includes("ENTRY 15"))).toBe(true);
    expect(reconstruction.contractCitations.some((citation) => /bl-059/i.test(citation))).toBe(true);
    expect(reconstruction.notAccomplished).toHaveLength(6);
  });
});
