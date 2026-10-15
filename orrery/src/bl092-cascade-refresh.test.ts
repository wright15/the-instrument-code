import { describe, expect, it } from "vitest";

import record from "./generated/bl092-cascade-refresh.v1.json";

describe("BL-092 cascade refresh — pinned", () => {
  it("pins the header, the preservation directory, and the ledger window", () => {
    expect(record.schemaVersion).toBe("harmonic-orrery.bl092-cascade-refresh.v1");
    expect(record.artifactId).toBe("BL092_CASCADE_REFRESH_V1");
    expect(record.status).toBe("hygiene_record");
    expect(record.admissionEffect).toBe("none");
    expect(record.ticket).toBe("BL-092");
    expect(record.generator).toBe("scripts/build-bl092-cascade-refresh.mjs");
    expect(record.artifactFingerprint).toMatch(/^[0-9a-f]{64}$/);
    expect(record.preservation.directory).toBe("qa/halt-evidence/twin-hub-convergence-pre-refresh-entry22");
    expect(record.preservation.files).toHaveLength(17);
    expect(record.ledger.preAppendSha256).toBe("6d043fc168ba7e09f82fe7d71df38801aa4b6d41fdfd0bf0495060ea3d7df793");
    expect(record.ledger.preAppendByteLength).toBe(244527);
    expect(record.ledger.postAppendSha256).toBe("f58b8440ed109a455151569f8c33cfb1f2b70782f081e997e5ad5f65701fd50b");
    expect(record.ledger.postAppendByteLength).toBe(251837);
    expect(record.ledger.entry23.span).toBe("3810-3921");
  });

  it("pins the cascade inventory: pre/post fingerprints, bindings, and byte-identical projections", () => {
    expect(record.cascade.map((entry) => entry.artifact)).toEqual([
      "canonical/fivefold-incubator/twin-hub-convergence-v0.json",
      "canonical/fivefold-incubator/fifth-space-census-v0.json",
      "canonical/fivefold-incubator/shadow-ladder-v0.json",
      "qa/pentatonic-binding-audit-closure.json",
      "qa/fivefold-engine-promotion-evidence.json",
    ]);
    const [twinHub, census, shadowLadder, closure, promotion] = record.cascade;
    expect(twinHub.preFingerprint).toBe("5d0c5eef06e1f3590fcee2244def86079976789aba9f2a53e880ba14bc3a7efb");
    expect(twinHub.postFingerprint).toBe("b42b2d13a01842ce406dd812ddf8e1c0145e386424cf204a805f28a1d490cfeb");
    expect(twinHub.projectionSha256).toBe("cf7969713099bf1ebe4ca2c99c338f83d1ac881de46ae254c9b5b10fc8ec9e81");
    expect(twinHub.validator).toEqual({ path: "qa/twin-hub-convergence-validation.json", verdict: "PASS", checksPassed: 30, checksFailed: 0 });
    expect(census.preFingerprint).toBe("3234257c2f73335bc46df876a6e3c0d5a1871bec52d851b634a910b50f270048");
    expect(census.postFingerprint).toBe("9fb5d860f73cc8958fd425f751770a8bc018cf8a3ef9beff4ec590e08e909e18");
    expect(census.projectionSha256).toBe("099528b8bf1eee8efa747b6145e02e49d14b5552b30bda43e3b18f1078c955e0");
    expect(census.validator.checksPassed).toBe(24);
    expect(shadowLadder.preFingerprint).toBe("315bc72ff17630ccab617272585bba9815aab1735a201d595341da56794f5ccc");
    expect(shadowLadder.postFingerprint).toBe("bedfe62c56a76df5673409f7db14d88f46d7ce0715f249d8f35bf1223f76555a");
    expect(shadowLadder.projectionSha256).toBe("25f7c68cbf2db22f0f2223067d68f4aa4b3978c325ad2c1b8e127b17c246d985");
    expect(shadowLadder.validator.checksPassed).toBe(37);
    expect(closure.postFingerprint).toBe("010db6420bf766eae067925097f88ec98800ed2373ae990381ecead28a5c196c");
    expect(closure.validator.checksPassed).toBe(11);
    expect(promotion.postFingerprint).toBe("7092913e78b187d8cf317cdc29b5467550c349b5f327cb0ccdc48bfa29f87987");
    expect(promotion.validator.itemEvidenceGroups).toBe(10);
    expect(promotion.validator.exclusionEvidenceGroups).toBe(11);
    expect(record.cascade.every((entry) => entry.projectionUnchanged === true)).toBe(true);
    expect(record.cascade.every((entry) => entry.bindingPre === "45653693ea4b5471412ad60e518ffd8333e3d87091ff007a7b5c9eee026d8139")).toBe(true);
    expect(record.cascade.every((entry) => entry.bindingPost === record.ledger.postAppendSha256)).toBe(true);
  });

  it("pins the geometry-drift block: not triggered, every projection unchanged", () => {
    expect(record.geometryDrift.status).toBe("not_triggered");
    expect(record.geometryDrift.artifactsChecked).toBe(8);
    expect(record.geometryDrift.projectionsUnchanged).toBe(8);
    expect(record.geometryDrift.halt).toContain("halt");
  });

  it("pins the verified-fresh d-shadow finding (OD-92-1)", () => {
    expect(record.refreshInventory.verifiedFresh.artifact).toBe("canonical/fivefold-incubator/d-shadow-complement-span-v0.json");
    expect(record.refreshInventory.verifiedFresh.notRefreshed).toBe(true);
    expect(record.refreshInventory.refreshed).toHaveLength(8);
    expect(record.refreshInventory.refreshed).not.toContain("canonical/fivefold-incubator/d-shadow-complement-span-v0.json");
    expect(record.refreshInventory.observedStale).toHaveLength(5);
  });

  it("pins the release closure and the downstream projections", () => {
    expect(record.releaseClosure.path).toBe("qa/integrated-release-validation.json");
    expect(record.releaseClosure.pre.verdict).toBe("PASS");
    expect(record.releaseClosure.post.verdict).toBe("PASS");
    expect(record.releaseClosure.post.releaseId).toBe("seven-governors-integrated-1.9.0");
    expect(record.releaseClosure.post.checksPassed).toBe(418);
    expect(record.releaseClosure.post.checksFailed).toBe(0);
    expect(record.releaseClosure.verdictInvariant).toBe(true);
    expect(record.downstreamProjections.map((entry) => entry.artifact)).toEqual([
      "orrery/src/generated/field-derivation-bundle.v1.json",
      "orrery/src/generated/taxonomy-read-model.v1.json",
      "orrery/src/generated/d-tier-taxonomy-dataset.v1.json",
    ]);
    expect(record.downstreamProjections.every((entry) => entry.projectionUnchanged === true)).toBe(true);
  });

  it("pins the fences and the prefix chain", () => {
    expect(record.fences.entry10.sha256LineJoin).toBe("201efe8193e1967cb91bb07b4876c906be5ba71a23bf4735be6d18a7df69f7a7");
    expect(record.fences.entry10.sha256Keepends).toBe("50b8b73f75497082e6d2a38052a62da4f5374ee94fc08f8ff0312fc7746fbb00");
    expect(record.fences.entry22.sha256LineJoin).toBe("218a89cdf8d5658a4820b5b8801da1dd7aca204b8a1688ef9969d243933cd857");
    expect(record.fences.entry22.sha256Keepends).toBe("47cbf3e2a57f9023e98df10315b8d9d7ebeb7e6905d7d87b68feecbb0c86b8cb");
    expect(Object.keys(record.fences).sort()).toEqual([
      "entry10", "entry15", "entry16", "entry17", "entry18", "entry19", "entry20", "entry21", "entry22",
    ]);
    expect(record.prefixPreservation["233926"]).toBe("45653693ea4b5471412ad60e518ffd8333e3d87091ff007a7b5c9eee026d8139");
    expect(record.prefixPreservation["244527"]).toBe("6d043fc168ba7e09f82fe7d71df38801aa4b6d41fdfd0bf0495060ea3d7df793");
  });

  it("pins the recursion termination note (OD-92-4)", () => {
    expect(record.recursionTermination).toContain("born current");
    expect(record.recursionTermination).toContain("OD-92-4");
  });
});
