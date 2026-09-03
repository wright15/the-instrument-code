import { describe, expect, it } from "vitest";

import {
  OVERLAY_DISCLAIMER,
  PHOTONIC_OVERLAY_BUNDLE,
  PHOTONIC_OVERLAY_BUNDLE_ID,
  PHOTONIC_OVERLAY_SCHEMA_VERSION,
  PhotonicOverlayCompatibilityError,
  VARIANT_A,
  VARIANT_B,
  VARIANT_LABELS,
  channelForRecord,
  channelsForVariant,
  parsePhotonicOverlayBundle,
} from "./photonic-overlay";

describe("photonic overlay bundle", () => {
  it("parses the bundled artifact strictly", () => {
    expect(PHOTONIC_OVERLAY_BUNDLE.schemaVersion).toBe(PHOTONIC_OVERLAY_SCHEMA_VERSION);
    expect(PHOTONIC_OVERLAY_BUNDLE.bundleId).toBe(PHOTONIC_OVERLAY_BUNDLE_ID);
    expect(PHOTONIC_OVERLAY_BUNDLE.records).toHaveLength(28);
    expect(PHOTONIC_OVERLAY_BUNDLE.candidateId).toBe("CH_TIERED_v1");
  });

  it("covers all 14 A1/A2 anchors across both variants", () => {
    const records = PHOTONIC_OVERLAY_BUNDLE.records;
    expect(new Set(records.map((r) => r.stateId)).size).toBe(14);
    expect(records.filter((r) => r.variant === VARIANT_A)).toHaveLength(14);
    expect(records.filter((r) => r.variant === VARIANT_B)).toHaveLength(14);
    expect(records.every((r) => r.tier === "A1" || r.tier === "A2")).toBe(true);
  });

  it("enforces channel discipline: Variant A never grants hue", () => {
    for (const record of PHOTONIC_OVERLAY_BUNDLE.records.filter((r) => r.variant === VARIANT_A)) {
      expect(channelsForVariant(record.variant)).toEqual(["luminance", "grain", "pulse"]);
      expect(record.channels).not.toContain("hue");
      expect(channelForRecord(record).hue).toBeNull();
      expect(record.photonicCompression).toBeNull();
      expect(record.bandMetadata.beyondVisible).toBe(true);
    }
  });

  it("permits hue only for Variant B (in-hull)", () => {
    for (const record of PHOTONIC_OVERLAY_BUNDLE.records.filter((r) => r.variant === VARIANT_B)) {
      expect(channelsForVariant(record.variant)).toContain("hue");
      expect(typeof channelForRecord(record).hue).toBe("number");
      expect(typeof record.photonicCompression).toBe("number");
      expect(record.bandMetadata.hullPreserved).toBe(true);
    }
  });

  it("displays every photonic value directly from the pinned bundle", () => {
    for (const record of PHOTONIC_OVERLAY_BUNDLE.records) {
      expect(typeof record.derivedWavelengthNm).toBe("number");
      expect(record.bandMetadata.numericBandNm).toHaveLength(2);
      expect(record.constructionEdgeIds.length).toBeGreaterThan(0);
      expect(record.recordFingerprint).toMatch(/^[0-9a-f]{64}$/);
    }
  });

  it("carries the standing non-admission disclaimer and variant labels", () => {
    expect(OVERLAY_DISCLAIMER).toContain("not canonical office colors");
    expect(VARIANT_LABELS[VARIANT_A]).toContain("luminance");
    expect(VARIANT_LABELS[VARIANT_B]).toContain("hue");
  });

  it("rejects invalid, missing, and incompatible bundle data", () => {
    const bundle = JSON.parse(JSON.stringify(PHOTONIC_OVERLAY_BUNDLE)) as Record<string, unknown>;

    const incompatible = { ...bundle } as Record<string, unknown>;
    incompatible.schemaVersion = "harmonic-orrery.photonic-overlay.v2";
    expect(() => parsePhotonicOverlayBundle(incompatible)).toThrow(PhotonicOverlayCompatibilityError);

    const missing = { ...bundle } as Record<string, unknown>;
    delete missing.records;
    expect(() => parsePhotonicOverlayBundle(missing)).toThrow(PhotonicOverlayCompatibilityError);

    const hueLeak = { ...bundle } as Record<string, unknown>;
    const records = (hueLeak.records as Array<Record<string, unknown>>).map((record) => ({ ...record }));
    records[0] = { ...records[0], hue: 42 };
    hueLeak.records = records;
    expect(() => parsePhotonicOverlayBundle(hueLeak)).toThrow(PhotonicOverlayCompatibilityError);
  });
});
