import { describe, expect, it } from "vitest";

import derivation from "./generated/bl080-governs-derivation.v1.json";

const SELECTED_KEYS = [
  "0:1339", "0:2395", "1:1765", "1:3497", "2:2717", "2:3245", "3:1465",
  "3:949", "4:1703", "4:1835", "5:1261", "5:695", "6:2899", "6:2965",
];

describe("BL-080 GOVERNS derivation (S0' assembly / selection / orientation / isolation) — pinned", () => {
  it("pins schema, status, fingerprint, source bindings, chain anchors and the predicate source", () => {
    expect(derivation.schemaVersion).toBe("harmonic-orrery.bl080-governs-derivation.v1");
    expect(derivation.derivationId).toBe("BL080_GOVERNS_DERIVATION_V1");
    expect(derivation.status).toBe("planning_evidence");
    expect(derivation.generator).toBe("scripts/build-bl080-governs-derivation.mjs");
    expect(derivation.derivationFingerprint).toMatch(/^[0-9a-f]{64}$/);
    expect(derivation.sourceBindings).toHaveLength(8);
    expect(derivation.sourceBindings.every((binding) => /^[0-9a-f]{64}$/.test(binding.sha256))).toBe(true);
    expect(derivation.base.chainAnchors.map((anchor) => anchor.fingerprint)).toEqual([
      "6d33c67be7b8f87b8ad2f964cd3560ebcbc1ec0dc6b2088ad1f223c35caff8c3",
      "aa975820136658dd2fb3c84d98b34bf7a1901d39edd6548a300f458858305918",
      "94f0661ff6e76b0dea69fbe9f09ead24da7901393fb735495f3a25c3d9a1a886",
      "11644d401eff5ef951a2173f390041531743df682ad9c502f98a048c0f76e1b1",
    ]);
    expect(derivation.base.predicateSource.reviewFingerprint).toBe("6d11fd932efbe96892b3cf2e6a6cdad6f54e69cd2a8f284ebb72232c59d8b745");
  });

  it("pins the consumed inputs: kappa validation, 7 pairs with the masks-only cross-check, 7 R-edge parents", () => {
    expect(derivation.consumed.kappa.kappa1[0]).toEqual({ mask: "1387", index: 6 });
    expect(derivation.consumed.kappa.kappa1[6]).toEqual({ mask: "2773", index: 0 });
    expect(derivation.consumed.kappa.validation).toMatchObject({
      bijection: true,
      orientationRelation: true,
      lineProperty: true,
    });
    expect(derivation.consumed.pairs.count).toBe(7);
    expect(derivation.consumed.pairs.masksOnlyCrossCheck).toMatchObject({
      reproducesPairContent: true,
      reproducesChildAttachment: true,
    });
    expect(derivation.consumed.rEdges.count).toBe(7);
    expect(derivation.consumed.rEdges.satelliteCensus).toBe(28);
    expect(derivation.consumed.rEdges.perParent.every((row) => row.satellites.length === 4)).toBe(true);
  });

  it("pins the S0' projection assembly: 14/28/14, frozen validation PASS, digests match, 42 presentation ids carried", () => {
    expect(derivation.projection.anchors).toHaveLength(14);
    expect(derivation.projection.R).toHaveLength(28);
    expect(derivation.projection.E).toHaveLength(14);
    expect(derivation.projection.validation.frozenValidator).toBe("PASS");
    expect(derivation.projection.validation.digestsMatchFrozenBindings).toBe(true);
    expect(derivation.projection.validation.digests).toEqual(derivation.projection.validation.frozenBindings);
    expect(derivation.projection.setEquality.presentationCarried.edgeIds).toBe(42);
  });

  it("pins the S0' set-equality: semantic and full-row set-equal, missing [] / extra []", () => {
    for (const label of ["anchors", "R", "E"] as const) {
      expect(derivation.projection.setEquality[label].semanticSetEqual).toBe(true);
      expect(derivation.projection.setEquality[label].fullRowSetEqual).toBe(true);
      expect(derivation.projection.setEquality[label].missing).toEqual([]);
      expect(derivation.projection.setEquality[label].extra).toEqual([]);
    }
    expect(derivation.projection.setEquality.anchors.derivedCount).toBe(14);
    expect(derivation.projection.setEquality.R.grantedCount).toBe(28);
    expect(derivation.projection.setEquality.E.derivedCount).toBe(14);
  });

  it("pins the predicate selection: P(s) = [forte(s) = '7-27'], 14/14 exact, confusion 14/0/0/14", () => {
    expect(derivation.selection.predicate.definition).toContain("7-27");
    expect(derivation.selection.domain).toEqual({ uKeyCount: 28, selectedKeyCount: 14 });
    expect(derivation.selection.selectedKeys).toEqual(SELECTED_KEYS);
    expect(derivation.selection.selectedKeys).toEqual(derivation.selection.observedKeys);
    expect(derivation.selection.confusion).toEqual({ tp: 14, fp: 0, fn: 0, tn: 14 });
    expect(derivation.selection.setEqual).toBe(true);
    expect(derivation.selection.missing).toEqual([]);
    expect(derivation.selection.extra).toEqual([]);
    expect(derivation.selection.perOffice).toHaveLength(7);
    expect(derivation.selection.perOffice.every((row) => row.selected.length === 2)).toBe(true);
  });

  it("pins the office-flatness calibration: 28/28 satellites share their parent's ledger office", () => {
    expect(derivation.selection.calibration.officeFlatCount).toBe(28);
    expect(derivation.selection.calibration.officeFlatTotal).toBe(28);
    expect(derivation.selection.calibration.statement).toContain("office-flat");
  });

  it("pins the orientation handling: labels flip c -> 6-c, structures invariant, 28-row cross-check", () => {
    expect(derivation.orientation.labelMap).toHaveLength(14);
    for (const row of derivation.orientation.labelMap) {
      expect(row.office0).toBe((6 - row.office1) % 7);
    }
    expect(derivation.orientation.labelMap.find((row) => row.id === "1387")).toMatchObject({ office1: 6, office0: 0 });
    expect(derivation.orientation.labelMap.find((row) => row.id === "2773")).toMatchObject({ office1: 0, office0: 6 });
    expect(derivation.orientation.pairsIdentical).toBe(true);
    expect(derivation.orientation.edgesIdentical).toBe(true);
    expect(derivation.orientation.selectionIdentical).toBe(true);
    expect(derivation.orientation.crossCheck).toMatchObject({
      perEdgeRows: 28,
      derivedCenter1MatchesOffice1: true,
      derivedCenter0MatchesOffice0: true,
    });
  });

  it("pins the pipeline landing: S1'-S5' code landed and unexecuted, Gate 3 reserved", () => {
    expect(derivation.pipeline.status).toBe("landed_unexecuted");
    expect(derivation.pipeline.frozenModules).toHaveLength(4);
    expect(derivation.pipeline.entry).toBe("runDerivedPipeline(projection) -> generation");
    expect(derivation.pipeline.executionGate).toContain("Gate 3");
  });

  it("pins the pre-registration and the frozen baseline for Gate 3", () => {
    expect(derivation.preRegistration.criteria).toHaveLength(4);
    expect(derivation.preRegistration.criteria[2]).toContain("finding, not a failure");
    expect(derivation.gate3Baseline.observedKeyCount).toBe(14);
    expect(derivation.gate3Baseline.fourCellCounts).toEqual({ aOnly: "0", bOnly: "10", both: "4", neither: "0" });
    expect(derivation.gate3Baseline.routeA).toMatchObject({ generated: "8", matched: 4, inRButUnmatched: "4", missed: 10, restatement: false });
    expect(derivation.gate3Baseline.routeB).toMatchObject({ generated: "28", matched: 14, inRButUnmatched: "14", missed: 0, restatement: true });
    expect(derivation.gate3Baseline.tC).toMatchObject({ matches: ["A0:1387:2741:0", "A0:1451:2773:6"], midpointExact: true });
    expect(derivation.gate3Baseline.category).toBe("not_derived");
  });

  it("pins the isolation: region-scoped, zero granted bytes, the labelled reads, two-sided discipline", () => {
    expect(derivation.isolation.regime).toBe("region-scoped");
    expect(derivation.isolation.grantedBytesInDerivationPath).toBe(0);
    expect(derivation.isolation.licensedReads).toHaveLength(4);
    expect(derivation.isolation.forbiddenReads).toHaveLength(4);
    expect(derivation.isolation.validatorDiscipline).toContain("two-sided");
    expect(derivation.isolation.statements).toHaveLength(3);
  });

  it("pins the gates and the conditional-green readiness", () => {
    for (const key of ["V-G2-1", "V-G2-2", "V-G2-3", "V-G2-4", "V-G2-5"] as const) {
      expect(derivation.gates[key].result).toBe("PASS");
    }
    expect(derivation.readiness.conditionalGreen).toContain("anchoring remainder");
    expect(derivation.readiness.remainingGranted).toHaveLength(3);
    expect(derivation.readiness.statement).toContain("Gate 3");
  });

  it("carries the fences, the citations and the bounded non-accomplishments", () => {
    expect(derivation.fences.pipelineExecution).toContain("Gate 3");
    expect(derivation.fences.d4Record).toContain("derivable-via-R2");
    expect(derivation.fences.d7Control).toContain("hypothesis-tier");
    expect(derivation.fences.g1Intra330).toBe("untouched");
    expect(derivation.fences.membrane).toContain("never design input");
    expect(derivation.fences.frozenStack).toContain("byte-untouched");
    expect(derivation.contractCitations).toHaveLength(10);
    expect(derivation.contractCitations.some((citation) => citation.includes("bl-079-governs-derivation-design-spec"))).toBe(true);
    expect(derivation.notAccomplished).toHaveLength(8);
  });
});
