import { describe, expect, it, vi } from "vitest";
import {
  TAXONOMY_READ_MODEL,
  TaxonomyCompatibilityError,
  filterTaxonomyRecords,
  parseTaxonomyReadModel,
  taxonomyRecordById,
} from "./taxonomy-read-model";

describe("taxonomy read model", () => {
  it("reconciles the full canonical scope with stable source ordering", () => {
    expect(TAXONOMY_READ_MODEL.recordCount).toBe(462);
    expect(TAXONOMY_READ_MODEL.records).toHaveLength(462);
    expect(new Set(TAXONOMY_READ_MODEL.records.map((record) => record.stateId)).size).toBe(462);
    expect(TAXONOMY_READ_MODEL.records.every((record, index) => index === 0 || record.sourceOrder > TAXONOMY_READ_MODEL.records[index - 1].sourceOrder)).toBe(true);
    expect(Object.values(TAXONOMY_READ_MODEL.roleCounts).reduce((total, count) => total + count, 0)).toBe(462);
  });

  it("filters only explicit source fields and retains withheld offices", () => {
    const first = TAXONOMY_READ_MODEL.records[0];
    expect(filterTaxonomyRecords({ role: first.role }).every((record) => record.role === first.role)).toBe(true);
    expect(filterTaxonomyRecords({ tier: "D5" }).every((record) => record.tier === "D5")).toBe(true);
    expect(filterTaxonomyRecords({ forte: first.forte }).every((record) => record.forte === first.forte)).toBe(true);
    expect(filterTaxonomyRecords({ officeStatus: "withheld" }).every((record) => record.office === null)).toBe(true);
  });

  it("returns an explicit absent result instead of a nearby record", () => {
    expect(taxonomyRecordById(-1)).toBeNull();
    expect(taxonomyRecordById(4096)).toBeNull();
  });

  it("rejects source drift and invalid filters", () => {
    const invalid = structuredClone(TAXONOMY_READ_MODEL) as unknown as Record<string, unknown>;
    invalid.recordCount = 461;
    expect(() => parseTaxonomyReadModel(invalid)).toThrow(TaxonomyCompatibilityError);
    expect(() => filterTaxonomyRecords({ role: 1 } as unknown as { role: string })).toThrow(TaxonomyCompatibilityError);
  });

  it("performs no network or mutation action", () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    try {
      expect(filterTaxonomyRecords()).toHaveLength(462);
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
