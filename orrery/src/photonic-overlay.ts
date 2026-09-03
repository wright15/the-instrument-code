import bundleDocument from "./generated/photonic-overlay.v1.json";

export const PHOTONIC_OVERLAY_SCHEMA_VERSION = "harmonic-orrery.photonic-overlay.v1";
export const PHOTONIC_OVERLAY_BUNDLE_ID = "PHOTONIC_OVERLAY_CH_TIERED_v1";

export const VARIANT_A = "sum_mixing";
export const VARIANT_B = "geometric_mean";

const CHANNELS_A = ["luminance", "grain", "pulse"] as const;

type JsonRecord = Record<string, unknown>;

export class PhotonicOverlayCompatibilityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PhotonicOverlayCompatibilityError";
  }
}

export interface PhotonicOverlayRecord {
  stateId: number;
  tier: "A1" | "A2";
  office: string;
  name: string;
  forte: string;
  variant: typeof VARIANT_A | typeof VARIANT_B;
  derivedWavelengthNm: number;
  photonicCompression: number | null;
  bandMetadata: {
    numericBandNm: [number, number];
    renderingHint: string;
    beyondVisible: boolean;
    hullPreserved: boolean;
  };
  constructionEdgeIds: string[];
  parentStateIds: number[];
  recordFingerprint: string;
  channels: string[];
  hue: number | null;
}

export interface PhotonicOverlayBundle {
  schemaVersion: typeof PHOTONIC_OVERLAY_SCHEMA_VERSION;
  bundleId: typeof PHOTONIC_OVERLAY_BUNDLE_ID;
  candidateId: "CH_TIERED_v1";
  candidateFingerprint: string;
  source: { artifact: string; sha256: string };
  authority: string;
  interpretationPolicy: Record<string, unknown>;
  bands: {
    variantA: { A1: [number, number]; A2: [number, number] };
    variantB: { A1: [number, number]; A2: [number, number] };
  };
  records: PhotonicOverlayRecord[];
  bundleFingerprint: string;
}

export interface PhotonicChannel {
  luminance: number;
  grain: number;
  pulse: number;
  hue: number | null;
}

function record(value: unknown, context: string): JsonRecord {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new PhotonicOverlayCompatibilityError(`${context} must be an object`);
  }
  return value as JsonRecord;
}

function string(value: unknown, context: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new PhotonicOverlayCompatibilityError(`${context} must be a non-empty string`);
  }
  return value;
}

function fingerprint(value: unknown, context: string): string {
  const parsed = string(value, context);
  if (!/^[a-f0-9]{64}$/.test(parsed)) {
    throw new PhotonicOverlayCompatibilityError(`${context} must be a SHA-256 fingerprint`);
  }
  return parsed;
}

function number(value: unknown, context: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new PhotonicOverlayCompatibilityError(`${context} must be a finite number`);
  }
  return value;
}

function parseRecord(value: unknown, index: number): PhotonicOverlayRecord {
  const item = record(value, `bundle.records[${index}]`);
  const variant = string(item.variant, `bundle.records[${index}].variant`);
  if (variant !== VARIANT_A && variant !== VARIANT_B) {
    throw new PhotonicOverlayCompatibilityError(`bundle.records[${index}].variant is not sum_mixing or geometric_mean`);
  }
  const bandMetadata = record(item.bandMetadata, `bundle.records[${index}].bandMetadata`);
  const channels = (item.channels as unknown[]).map((channel, channelIndex) =>
    string(channel, `bundle.records[${index}].channels[${channelIndex}]`),
  );
  if (variant === VARIANT_A) {
    if (channels.includes("hue") || item.hue !== null || item.photonicCompression !== null) {
      throw new PhotonicOverlayCompatibilityError(
        `bundle.records[${index}] Variant A must forbid hue and keep photonicCompression null`,
      );
    }
  } else if (!channels.includes("hue") || typeof item.hue !== "number" || typeof item.photonicCompression !== "number") {
    throw new PhotonicOverlayCompatibilityError(
      `bundle.records[${index}] Variant B must allow hue and carry a numeric photonicCompression`,
    );
  }
  const numericBandNm = (bandMetadata.numericBandNm as unknown[]).map((value, bandIndex) =>
    number(value, `bundle.records[${index}].bandMetadata.numericBandNm[${bandIndex}]`),
  ) as [number, number];
  return {
    stateId: number(item.stateId, `bundle.records[${index}].stateId`),
    tier: string(item.tier, `bundle.records[${index}].tier`) as "A1" | "A2",
    office: string(item.office, `bundle.records[${index}].office`),
    name: string(item.name, `bundle.records[${index}].name`),
    forte: string(item.forte, `bundle.records[${index}].forte`),
    variant: variant as PhotonicOverlayRecord["variant"],
    derivedWavelengthNm: number(item.derivedWavelengthNm, `bundle.records[${index}].derivedWavelengthNm`),
    photonicCompression: item.photonicCompression === null ? null : number(
      item.photonicCompression,
      `bundle.records[${index}].photonicCompression`,
    ),
    bandMetadata: {
      numericBandNm,
      renderingHint: string(bandMetadata.renderingHint, `bundle.records[${index}].bandMetadata.renderingHint`),
      beyondVisible: bandMetadata.beyondVisible === true,
      hullPreserved: bandMetadata.hullPreserved === true,
    },
    constructionEdgeIds: (item.constructionEdgeIds as unknown[]).map((edgeId, edgeIndex) =>
      string(edgeId, `bundle.records[${index}].constructionEdgeIds[${edgeIndex}]`),
    ),
    parentStateIds: (item.parentStateIds as unknown[]).map((parentId, parentIndex) =>
      number(parentId, `bundle.records[${index}].parentStateIds[${parentIndex}]`),
    ),
    recordFingerprint: fingerprint(item.recordFingerprint, `bundle.records[${index}].recordFingerprint`),
    channels,
    hue: item.hue === null ? null : number(item.hue, `bundle.records[${index}].hue`),
  };
}

export function parsePhotonicOverlayBundle(value: unknown): PhotonicOverlayBundle {
  const bundle = record(value, "photonic overlay bundle");
  if (bundle.schemaVersion !== PHOTONIC_OVERLAY_SCHEMA_VERSION || bundle.bundleId !== PHOTONIC_OVERLAY_BUNDLE_ID) {
    throw new PhotonicOverlayCompatibilityError("Unsupported photonic overlay bundle version");
  }
  if (bundle.candidateId !== "CH_TIERED_v1") {
    throw new PhotonicOverlayCompatibilityError("photonic overlay must pin the CH_TIERED_v1 sidecar");
  }
  const records = bundle.records as unknown[];
  if (!Array.isArray(records) || records.length !== 28) {
    throw new PhotonicOverlayCompatibilityError("photonic overlay must contain exactly 28 records");
  }
  return {
    schemaVersion: PHOTONIC_OVERLAY_SCHEMA_VERSION,
    bundleId: PHOTONIC_OVERLAY_BUNDLE_ID,
    candidateId: "CH_TIERED_v1",
    candidateFingerprint: fingerprint(bundle.candidateFingerprint, "bundle.candidateFingerprint"),
    source: {
      artifact: string((record(bundle.source, "bundle.source")).artifact, "bundle.source.artifact"),
      sha256: fingerprint((record(bundle.source, "bundle.source")).sha256, "bundle.source.sha256"),
    },
    authority: string(bundle.authority, "bundle.authority"),
    interpretationPolicy: bundle.interpretationPolicy as Record<string, unknown>,
    bands: bundle.bands as PhotonicOverlayBundle["bands"],
    records: records.map((item, index) => parseRecord(item, index)),
    bundleFingerprint: fingerprint(bundle.bundleFingerprint, "bundle.bundleFingerprint"),
  };
}

export const PHOTONIC_OVERLAY_BUNDLE = parsePhotonicOverlayBundle(bundleDocument as unknown);

function authoredLuminanceGrainPulse(record: PhotonicOverlayRecord): Omit<PhotonicChannel, "hue"> {
  // Authored, deterministic channel weights keyed by tier and office index.
  // These are presentation modulation strengths, not photonic values.
  const officeIndex = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"].indexOf(record.office);
  const tierOffset = record.tier === "A1" ? 0 : 1;
  return {
    luminance: Number((0.5 + ((officeIndex * 7 + tierOffset * 3) % 5) / 10).toFixed(4)),
    grain: Number((0.3 + ((officeIndex * 11 + tierOffset * 7) % 7) / 10).toFixed(4)),
    pulse: Number((0.4 + ((officeIndex * 5 + tierOffset * 13) % 6) / 10).toFixed(4)),
  };
}

export function channelForRecord(record: PhotonicOverlayRecord): PhotonicChannel {
  const base = authoredLuminanceGrainPulse(record);
  if (record.variant === VARIANT_A) {
    return { ...base, hue: null };
  }
  return { ...base, hue: record.hue };
}

export function channelsForVariant(variant: PhotonicOverlayRecord["variant"]): readonly string[] {
  return variant === VARIANT_A ? CHANNELS_A : [...CHANNELS_A, "hue"];
}

export const VARIANT_LABELS = {
  [VARIANT_A]: "Variant A — sum mixing (luminance / grain / pulse only)",
  [VARIANT_B]: "Variant B — geometric mean (in-hull, hue allowed)",
} as const;

export const OVERLAY_DISCLAIMER =
  "Tiered photonic candidates are an authored informational sidecar (planning evidence), not canonical office colors. Variant A wavelengths are UV and invisible by construction; they render as luminance, grain, and pulse only.";
