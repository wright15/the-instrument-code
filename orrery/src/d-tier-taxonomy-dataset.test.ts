import { describe, expect, it, vi } from "vitest";
import { D_TIER_DATASET, dTierDatasetView } from "./d-tier-taxonomy-dataset";

describe("D-tier taxonomy dataset", () => {
  it("preserves all source-bound D-tier records in deterministic order", () => {
    expect(D_TIER_DATASET.recordCount).toBe(175);
    expect(D_TIER_DATASET.records).toHaveLength(175);
    expect(D_TIER_DATASET.records.every((record) => record.tier?.startsWith("D"))).toBe(true);
    expect(D_TIER_DATASET.records.every((record, index) => index === 0 || record.sourceOrder > D_TIER_DATASET.records[index - 1].sourceOrder)).toBe(true);
  });

  it.each(["confirmed", "refuted", "partial"] as const)("loads valid data when the census verdict is %s", (verdict) => {
    const dataset = structuredClone(D_TIER_DATASET);
    dataset.censusBinding.researchVerdict.verdict = verdict;
    const view = dTierDatasetView(dataset);
    expect(view.state).toBe("ready");
    expect(view.verdict).toBe(verdict);
    expect(view.records).toHaveLength(175);
    expect(view.records.every((record) => record.fifthSpace !== null)).toBe(true);
  });

  it("uses source-identified ordinal fallback without inventing fifth-space values", () => {
    for (const input of [undefined, "loading", { schemaVersion: "stale" }] as const) {
      const view = dTierDatasetView(input);
      expect(["loading", "unavailable", "incompatible"]).toContain(view.state);
      expect(view.records).toHaveLength(175);
      expect(view.records.every((record, index) => record.ordinal === (index === 0 || view.records[index - 1].identity.tier !== record.identity.tier ? 1 : view.records[index - 1].ordinal + 1) && record.fifthSpace === null)).toBe(true);
      expect(view.verdict).toBeNull();
    }
  });

  it("performs no network or mutation action", () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    try {
      expect(dTierDatasetView(D_TIER_DATASET).state).toBe("ready");
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it.each(["unknown", "duplicate", "source-drift"])("rejects %s record identity without substituting data", (kind) => {
    const dataset = structuredClone(D_TIER_DATASET);
    if (kind === "unknown") dataset.records[0].stateId = -1;
    if (kind === "duplicate") dataset.records[1].stateId = dataset.records[0].stateId;
    if (kind === "source-drift") dataset.records[0].name = "invented";
    const view = dTierDatasetView(dataset);
    expect(view.state).toBe("incompatible");
    expect(view.verdict).toBeNull();
    expect(view.records.every((record) => record.identity && record.fifthSpace === null)).toBe(true);
  });
});
