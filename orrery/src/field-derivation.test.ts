import { describe, expect, it, vi } from "vitest";

import {
  AUTHORITY_BOUNDARY,
  AUTHORITY_LABEL,
  FIELD_DERIVATION_BUNDLE,
  FIELD_DERIVATION_BUNDLE_ID,
  FIELD_DERIVATION_SCHEMA_VERSION,
  FieldDerivationCompatibilityError,
  VERDICT_LABELS,
  observationViews,
  parseFieldDerivationBundle,
} from "./field-derivation";

describe("field derivation bundle", () => {
  it("parses the bundled artifact strictly", () => {
    expect(FIELD_DERIVATION_BUNDLE.schemaVersion).toBe(FIELD_DERIVATION_SCHEMA_VERSION);
    expect(FIELD_DERIVATION_BUNDLE.bundleId).toBe(FIELD_DERIVATION_BUNDLE_ID);
    expect(FIELD_DERIVATION_BUNDLE.observations.map((o) => o.id)).toEqual(["OBS-014", "OBS-015", "OBS-016"]);
    expect(FIELD_DERIVATION_BUNDLE.sources).toHaveLength(2);
  });

  it("binds every observation to a source artifact and a QA receipt", () => {
    for (const observation of FIELD_DERIVATION_BUNDLE.observations) {
      expect(observation.authority).toBe(AUTHORITY_BOUNDARY);
      expect(observation.sourceArtifact).toMatch(/^canonical\/fivefold-incubator\//);
      expect(observation.receiptArtifact).toMatch(/^qa\//);
    }
    for (const source of FIELD_DERIVATION_BUNDLE.sources) {
      expect(source.receipt.checksPassed).toBeGreaterThan(0);
      expect(source.receipt.verdict).toBe("PASS");
    }
  });

  it("carries the twin-hub, span-sequence, and three-family facts verbatim", () => {
    const views = observationViews();
    const twinHub = views.find((v) => v.id === "OBS-014");
    const span = views.find((v) => v.id === "OBS-015");
    const ceiling = views.find((v) => v.id === "OBS-016");
    expect(twinHub?.facts.seatContactRows).toBe(28);
    expect(twinHub?.facts.d5Hub).toBe("Mercury");
    expect(twinHub?.facts.a2SeamIntersection).toEqual([2383, 3667]);
    expect(span?.facts.aTier).toEqual([6, 8, 10]);
    expect(span?.facts.dTier).toEqual([9, 8, 9, 8, 9, 10, 10]);
    expect(ceiling?.facts.ceiling).toBe(10);
    expect(ceiling?.facts.ceilingStateCount).toBe(21);
    expect(ceiling?.facts.families).toEqual(["7-1", "7-8", "7-33"]);
    expect(ceiling?.facts.gapMultiset).toEqual([1, 1, 2, 2, 2, 2, 2]);
  });

  it("labels every verdict outcome identically for rendering", () => {
    expect(VERDICT_LABELS.confirmed).toBe("Confirmed");
    expect(VERDICT_LABELS.refuted).toBe("Refuted");
    expect(VERDICT_LABELS.partial).toBe("Partial");
    expect(AUTHORITY_LABEL).toContain("planning evidence");
    expect(AUTHORITY_LABEL).toContain("not admitted");
  });

  it("keeps refuted and partial observations inspectable (outcome-agnostic)", () => {
    const bundle = JSON.parse(JSON.stringify(FIELD_DERIVATION_BUNDLE)) as Record<string, unknown>;
    const observations = bundle.observations as Array<Record<string, unknown>>;
    observations[0] = { ...observations[0], verdict: "refuted" };
    const parsed = parseFieldDerivationBundle(bundle);
    expect(parsed.observations[0].verdict).toBe("refuted");
    expect(parsed.observations).toHaveLength(3);

    observations[1] = { ...observations[1], verdict: "partial" };
    const parsedPartial = parseFieldDerivationBundle(bundle);
    expect(parsedPartial.observations[1].verdict).toBe("partial");
    expect(parsedPartial.observations).toHaveLength(3);
  });

  it("rejects invalid, missing, and incompatible bundle data", () => {
    const bundle = JSON.parse(JSON.stringify(FIELD_DERIVATION_BUNDLE)) as Record<string, unknown>;

    const missing = { ...bundle } as Record<string, unknown>;
    delete missing.authorityNote;
    expect(() => parseFieldDerivationBundle(missing)).toThrow(FieldDerivationCompatibilityError);

    const incompatible = { ...bundle } as Record<string, unknown>;
    incompatible.schemaVersion = "harmonic-orrery.field-derivation.v2";
    expect(() => parseFieldDerivationBundle(incompatible)).toThrow(FieldDerivationCompatibilityError);

    const badVerdict = { ...bundle } as Record<string, unknown>;
    (badVerdict.observations as Array<Record<string, unknown>>)[0] = {
      ...(badVerdict.observations as Array<Record<string, unknown>>)[0],
      verdict: "proven",
    };
    expect(() => parseFieldDerivationBundle(badVerdict)).toThrow(FieldDerivationCompatibilityError);
  });

  it("performs no network or mutation action (negative-action contract)", () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    try {
      const views = observationViews();
      expect(views).toHaveLength(3);
      expect(fetchSpy).not.toHaveBeenCalled();
      expect(FIELD_DERIVATION_BUNDLE.observations.every((o) => o.authority === AUTHORITY_BOUNDARY)).toBe(true);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
