import { describe, expect, it, vi } from "vitest";
import { TAXONOMY_READ_MODEL, taxonomyReadModelView } from "./taxonomy-read-model";
import { D_TIER_DATASET, dTierDatasetView } from "./d-tier-taxonomy-dataset";
import { explainTaxonomyRecord, taxonomySourceLink } from "./taxonomy-explain";

describe("bounded taxonomy explanations", () => {
  const id = TAXONOMY_READ_MODEL.records[0].stateId;
  it("does not validate malformed bundled documents during module import", async () => {
    vi.resetModules();
    vi.doMock("./generated/taxonomy-read-model.v1.json", () => ({ default: {} }));
    vi.doMock("./generated/d-tier-taxonomy-dataset.v1.json", () => ({ default: {} }));
    try {
      const taxonomy = await import("./taxonomy-read-model");
      const dataset = await import("./d-tier-taxonomy-dataset");
      expect(taxonomy.taxonomyReadModelView(taxonomy.TAXONOMY_READ_MODEL).state).toBe("incompatible");
      expect(dataset.dTierDatasetView(dataset.D_TIER_DATASET).state).toBe("unavailable");
    } finally {
      vi.doUnmock("./generated/taxonomy-read-model.v1.json");
      vi.doUnmock("./generated/d-tier-taxonomy-dataset.v1.json");
      vi.resetModules();
    }
  });
  it("explains all 462 declared identities without substituting missing records", () => {
    for (const record of TAXONOMY_READ_MODEL.records) {
      const explanation = explainTaxonomyRecord(record.stateId);
      expect(explanation.state).toBe("ready");
      expect(explanation.record).toEqual(record);
      expect(explanation.relationships[0].value).toBe(record.sourceProvenance);
      expect(explanation.relationships[2].state).toBe(record.officeStatus);
    }
    expect(explainTaxonomyRecord(-1).record).toBeNull();
    expect(explainTaxonomyRecord(id, null).relationships).toEqual([]);
  });

  it.each(["confirmed", "refuted", "partial", "absent", "stale", "malformed"])("keeps base explanations unchanged under %s GOV-510 context", (verdict) => {
    const context = verdict === "absent" ? null : {
      candidateId: "TWIN_HUB_CONVERGENCE_v0",
      candidateFingerprint: verdict === "stale" ? "0".repeat(64) : TAXONOMY_READ_MODEL.evidenceBindings.gov510!.candidateFingerprint,
      evidenceBindings: { canonicalLedgerSha256: TAXONOMY_READ_MODEL.sources[0].sha256 },
      verdict,
    };
    const base = explainTaxonomyRecord(id, TAXONOMY_READ_MODEL, D_TIER_DATASET);
    const result = explainTaxonomyRecord(id, TAXONOMY_READ_MODEL, D_TIER_DATASET, context);
    expect(result.record).toEqual(base.record);
    expect(result.relationships).toEqual(base.relationships);
    expect(result.context.state).toBe(verdict === "absent" ? "unavailable" : ["stale", "malformed"].includes(verdict) ? "incompatible" : "available");
    expect(result.context.verdict).toBe(["confirmed", "refuted", "partial"].includes(verdict) ? verdict : null);
  });

  it("bounds loading, missing, malformed, and unavailable identity states", () => {
    for (const [input, state] of [[null, "unavailable"], ["loading", "loading"], [{}, "incompatible"], [[], "incompatible"]]) {
      expect(taxonomyReadModelView(input).state).toBe(state);
      expect(taxonomyReadModelView(input).model).toBeNull();
    }
    expect(dTierDatasetView(D_TIER_DATASET, null as never).records).toEqual([]);
  });

  it.each(["chirality", "source", "counts", "extra", "officeIndex"])("rejects invalid taxonomy %s", (field) => {
    const model = structuredClone(TAXONOMY_READ_MODEL);
    if (field === "chirality") model.records[0].chirality = "invented";
    if (field === "source") model.sources[0].artifact = "https://example.org";
    if (field === "counts") model.roleCounts.anchor++;
    if (field === "extra") Object.assign(model.records[0], { write: true });
    if (field === "officeIndex") model.records[0].officeIndex = 7;
    expect(taxonomyReadModelView(model).state).toBe("incompatible");
  });

  it.each(["mask", "positions", "span", "holes", "gaps", "arc", "fingerprint", "sha256"])("falls back without invented values for invalid D-tier %s", (field) => {
    const dataset = structuredClone(D_TIER_DATASET);
    if (field === "mask") dataset.records[0].fifthMask = 0;
    if (field === "positions") dataset.records[0].fifthPositions = [1];
    if (field === "span") dataset.records[0].fifthSpan = 99;
    if (field === "holes") dataset.records[0].holes = -1;
    if (field === "gaps") dataset.records[0].gapMultiset = [];
    if (field === "arc") dataset.records[0].fifthArc = "invented";
    if (field === "fingerprint") Object.assign(dataset.censusBinding, { candidateFingerprint: "0".repeat(64) });
    if (field === "sha256") Object.assign(dataset.censusBinding, { sha256: "0".repeat(64) });
    const view = dTierDatasetView(dataset);
    expect(view.state).toBe("incompatible");
    expect(view.records).toHaveLength(175);
    expect(view.records.every((record) => record.fifthSpace === null)).toBe(true);
  });

  it("has deterministic allowlisted links, bounded output, and no action side effects", () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const before = JSON.stringify([TAXONOMY_READ_MODEL, D_TIER_DATASET]);
    try {
      const explanation = explainTaxonomyRecord(id, TAXONOMY_READ_MODEL, D_TIER_DATASET);
      expect(explanation).toEqual(explainTaxonomyRecord(id, TAXONOMY_READ_MODEL, D_TIER_DATASET));
      expect(explanation.relationships.length).toBeLessThanOrEqual(100);
      expect(explanation.relationships.filter((relation) => relation.artifact.endsWith("universal-network-data.json")).map((relation) => relation.type)).toEqual(TAXONOMY_READ_MODEL.records[0].declaredRelationships.map((edge) => edge.type));
      for (const relation of explanation.relationships) expect(taxonomySourceLink(relation.artifact)).toBe(taxonomySourceLink(relation.artifact));
      for (const path of ["javascript:alert(1)", "//evil.test", "../ledger", "toString", "/api/mutate"]) expect(taxonomySourceLink(path)).toBeNull();
      expect(fetch).not.toHaveBeenCalled();
      expect(JSON.stringify([TAXONOMY_READ_MODEL, D_TIER_DATASET])).toBe(before);
    } finally { vi.unstubAllGlobals(); }
  });
});
