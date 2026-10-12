import { describe, expect, it } from "vitest";

import receipt from "../../qa/bl080-governs-derivation-receipt.json";
import schema from "../../schemas/bl080-governs-derivation-receipt.schema.json";
import derivation from "./generated/bl080-governs-derivation.v1.json";

const FROZEN_GENERATION_DIGEST = "c4a7f48dd982c6d96f594ca8c03e045092b9a00b9615e05ef2d14648f04f83d7";
const COMPARISON_DIGEST = "1f66764bf441d3a7b4c18dc65a64955f82570813648286fbcf3ef806c0c8850b";
const ROUTE_DIGESTS = {
  "T-A": "544022a73d9037102589e706e1cb997512fd24b6993ef891783f8fd20fa192d4",
  "T-B": "a6e5db4423913e24b3cb311de16aedb7e49d62f766a504bcab222524edbd226d",
  "T-C": "fbe396f128f157ef6bf02398edfffa12c9987696b46c7082601562e08a9f0426",
};

describe("BL-080 GOVERNS derivation execution receipt (Gate 3) — DERIVED_FROM_DERIVED_INPUTS", () => {
  it("pins the header, the derived provenance class and the execution fingerprint", () => {
    expect(receipt.schemaVersion).toBe("harmonic-orrery.bl080-governs-derivation-receipt.v1");
    expect(receipt.derivationId).toBe("BL080_GOVERNS_DERIVATION_EXECUTION_V1");
    expect(receipt.status).toBe("execution_verified");
    expect(receipt.generator).toBe("scripts/build-bl080-governs-derivation-execution.mjs");
    expect(receipt.inputProvenance).toBe("derived");
    expect(receipt.gate2DerivationFingerprint).toBe(derivation.derivationFingerprint);
    expect(receipt.executionFingerprint).toMatch(/^[0-9a-f]{64}$/);
    expect(Object.keys(receipt.gates)).toHaveLength(5);
  });

  it("pins the bindings: the frozen sealing context, the derived implementation digest and the frozen closure recorded separately", () => {
    expect(receipt.bindings.ledgerSha256).toBe("e6570972260fdae5c4ca878272dc89a9ff353d48762eefbe019707d229cd242d");
    expect(receipt.bindings.networkSha256).toBe("21e2a632837ecf40fe9229e9eb4ec0a5cceb9e2043fe89cb8e1d320518d7bdbc");
    expect(receipt.bindings.twinHubReceiptSha256).toBe("b7f924ca53859b832334200245f690196433e8c8eb213e2ce26afa5e62e230d2");
    expect(receipt.bindings.boundarySha256).toBe("751d56d4f01ea1a0d054c8119d178a64b20787aa9fb095a02c99f3ba3b135de2");
    expect(receipt.bindings.specSha256).toBe("9d8357cb05b73b4a25aeea3074ebe49d89a27dbf83f039d5698c4f77afc3a24c");
    expect(receipt.bindings.implementationDigest).toBe("2d53cee4b5f92f22cafadf2fd654351e0688b49f1b8861094fb2c52de9a6642a");
    expect(receipt.bindings.frozenClosureDigest).toBe("7ab950fac561016afc816e8b6947f7ce0b5f25573f1472321054ddbc9c1e097f");
    expect(receipt.bindings.projectionDigests).toEqual(derivation.projection.validation.digests);
  });

  it("pins the implementation file set (the Gate 2 closure plus the execution builder)", () => {
    expect(receipt.implementationFiles).toHaveLength(5);
    expect(receipt.implementationFiles.map((file) => file.path)).toEqual([
      "orrery/scripts/validate-bl080-governs-derivation.mjs",
      "orrery/src/bl080-governs-derivation.test.ts",
      "orrery/src/generated/bl080-governs-derivation.v1.json",
      "scripts/build-bl080-governs-derivation-execution.mjs",
      "scripts/build-bl080-governs-derivation.mjs",
    ]);
    expect(receipt.implementationFiles.every((file) => /^[0-9a-f]{64}$/.test(file.sha256))).toBe(true);
    expect(receipt.implementationFiles[2].sha256).toBe("50735819917ae36d59e49ef352d2867af377bff9a8186f720b28494e8010b398");
  });

  it("pins the seal: the frozen sealing context applied to the derived-input run reproduces the frozen digest", () => {
    expect(receipt.seal.generationDigest).toBe(FROZEN_GENERATION_DIGEST);
    expect(receipt.seal.frozenGenerationDigest).toBe(FROZEN_GENERATION_DIGEST);
    expect(receipt.seal.matchesFrozen).toBe(true);
    expect(receipt.seal.complete).toBe(true);
    expect(receipt.seal.inputIdentities).toEqual({
      ledgerSha256: receipt.bindings.ledgerSha256,
      networkSha256: receipt.bindings.networkSha256,
      implementationDigest: receipt.bindings.frozenClosureDigest,
    });
  });

  it("pins the generation: completion counts, digests and witness censuses (T-A 8 / T-B 56 / T-C 4)", () => {
    expect(receipt.generation.routes["T-A"].witnesses).toHaveLength(8);
    expect(receipt.generation.routes["T-B"].witnesses).toHaveLength(56);
    expect(receipt.generation.tC.relations).toHaveLength(4);
    const perRoute = receipt.generation.completion.perRoute;
    expect(perRoute["T-A"]).toMatchObject({ expected: "9604", visited: "9604", outputs: "8", digest: ROUTE_DIGESTS["T-A"] });
    expect(perRoute["T-B"]).toMatchObject({ expected: "5488", visited: "5488", outputs: "56", digest: ROUTE_DIGESTS["T-B"] });
    expect(perRoute["T-C"]).toMatchObject({ expected: "84", visited: "84", outputs: "4", digest: ROUTE_DIGESTS["T-C"] });
    expect(receipt.generation.completion.status).toBe("complete");
  });

  it("pins the comparison block: rows 14, T-A partial, T-B = U, cells 0/10/4/0, tC 2/2 exact", () => {
    expect(receipt.comparison.rows).toHaveLength(14);
    expect(receipt.comparison.observedKeyCount).toBe("14");
    expect(receipt.comparison.fourCellCounts).toEqual({ aOnly: "0", bOnly: "10", both: "4", neither: "0" });
    expect(receipt.comparison.uKeys).toHaveLength(28);
    expect(receipt.comparison.routes.A).toMatchObject({
      generated_key_count: "8", R_missed_count: "20", extra_beyond_R_count: "0",
      in_R_but_unmatched_count: "4", restatement_signature: false,
    });
    expect(receipt.comparison.routes.A.missedObservedKeys).toHaveLength(10);
    expect(receipt.comparison.routes.B).toMatchObject({
      generated_key_count: "28", R_missed_count: "0", extra_beyond_R_count: "0",
      in_R_but_unmatched_count: "14", restatement_signature: true,
    });
    expect(receipt.comparison.tC.matches).toEqual(["A0:1387:2741:0", "A0:1451:2773:6"]);
    expect(receipt.comparison.tC.missing).toEqual([]);
    expect(receipt.comparison.tC.extra).toEqual([]);
    expect(receipt.comparison.tC.midpoint_exact).toBe(true);
    expect(receipt.category).toBe("not_derived");
  });

  it("pins the baseline: the frozen receipt (sha 2057a757...), the full routeAccounting including R-missed 20", () => {
    expect(receipt.baseline.source).toBe("qa/d4-production-receipt.json");
    expect(receipt.baseline.sha256).toBe("2057a75702ddb4952151d962fb680474ab6543387b604b3b5c37758b8e9c49d0");
    expect(receipt.baseline.category).toBe("not_derived");
    expect(receipt.baseline.observedKeyCount).toBe("14");
    expect(receipt.baseline.routeA).toMatchObject({
      generated: "8", matched: 4, inRButUnmatched: "4", missed: 10, rMissed: "20", extra: "0", restatement: false,
    });
    expect(receipt.baseline.routeB).toMatchObject({
      generated: "28", matched: 14, inRButUnmatched: "14", missed: 0, rMissed: "0", extra: "0", restatement: true,
    });
    expect(receipt.baseline.comparisonDigest).toBe(COMPARISON_DIGEST);
  });

  it("pins the baseline comparison: field-for-field canonical equality and digest equality", () => {
    expect(receipt.baselineComparison.fields).toEqual({
      "rows": true,
      "routes": true,
      "routes.A": true,
      "routes.B": true,
      "observedKeyCount": true,
      "fourCellCounts": true,
      "uKeys": true,
      "tC": true,
      "category": true,
    });
    expect(receipt.baselineComparison.canonicallyEqual).toBe(true);
    expect(receipt.baselineComparison.digestEqual).toBe(true);
    expect(receipt.baselineComparison.runComparisonDigest).toBe(COMPARISON_DIGEST);
    expect(receipt.baselineComparison.frozenComparisonDigest).toBe(COMPARISON_DIGEST);
  });

  it("pins the branch classification: DERIVED_FROM_DERIVED_INPUTS, no deviation, status determined by the run", () => {
    expect(receipt.branchClassification.classification).toBe("DERIVED_FROM_DERIVED_INPUTS");
    expect(receipt.branchClassification.preRegistered).toBe(true);
    expect(receipt.branchClassification.sealMatches).toBe(true);
    expect(receipt.branchClassification.generationDigestsMatch).toBe(true);
    expect(receipt.branchClassification.deviation).toBeNull();
    expect(receipt.status).toBe("execution_verified");
    expect(receipt.preRegistration.branches.DERIVED_FROM_DERIVED_INPUTS).toContain("capstone");
  });

  it("pins the gates G3-1…G3-5 all PASS and the single-observation-read assertion", () => {
    for (const key of ["G3-1", "G3-2", "G3-3", "G3-4", "G3-5"] as const) {
      expect(receipt.gates[key].result).toBe("PASS");
    }
    expect(receipt.gates["G3-4"].statement).toContain("9/9");
    expect(receipt.observation.readCount).toBe(1);
    expect(receipt.observation.asserted).toBe(true);
    expect(receipt.observation.records).toEqual([
      "canonical/universal-heptatonic-ledger.json",
      "canonical/universal-network-data.json",
    ]);
  });

  it("pins the isolation, the documented-absent controls and the fences", () => {
    expect(receipt.isolation.regime).toBe("region-scoped");
    expect(receipt.isolation.grantedBytesInDerivationPath).toBe(0);
    expect(receipt.isolation.observationReads).toBe(1);
    expect(receipt.isolation.statements).toHaveLength(3);
    expect(receipt.controls.status).toBe("ABSENT");
    expect(receipt.controls.reason).toContain("not re-run");
    expect(receipt.fences.receiptRole).toContain("not an amendment");
    expect(receipt.fences.recordAmendment).toContain("byte-untouched");
    expect(receipt.fences.frozenStack).toContain("byte-untouched");
    expect(receipt.fences.g1Intra330).toBe("untouched");
    expect(receipt.fences.branchDetermination).toContain("determined by the run");
    expect(receipt.notAccomplished).toHaveLength(8);
    expect(receipt.contractCitations).toHaveLength(8);
  });

  it("pins the source bindings and the schema conformance of the receipt shape", () => {
    expect(receipt.sourceBindings.map((binding) => binding.artifact)).toEqual([
      "orrery/src/generated/bl080-governs-derivation.v1.json",
      "qa/d4-production-generation.json",
      "qa/d4-production-receipt.json",
      "canonical/universal-heptatonic-ledger.json",
      "canonical/universal-network-data.json",
      "qa/twin-hub-convergence-validation.json",
    ]);
    expect(receipt.sourceBindings.every((binding) => /^[0-9a-f]{64}$/.test(binding.sha256))).toBe(true);
    expect(schema.$id).toBe("harmonic-orrery.bl080-governs-derivation-receipt.v1");
    for (const required of schema.required) {
      expect(Object.hasOwn(receipt, required)).toBe(true);
    }
  });
});
