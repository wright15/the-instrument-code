#!/usr/bin/env node
/**
 * Build the deterministic photonic overlay bundle (ORR-514).
 *
 * Consumes the pinned GOV-2XX sidecar
 * `canonical/tiered-photonic-candidates/tiered-photonic-v1.json` and emits a
 * presentation bundle that carries every photonic value verbatim — no value is
 * derived or interpolated in the renderer. The channel plan is derived from
 * variant identity at build time, enforcing the spec's channel discipline:
 *
 *   Variant A (sum_mixing): luminance, grain, pulse only — hue forbidden.
 *   Variant B (geometric_mean): may modulate hue (in-hull).
 *
 * Variant A's wavelengths are UV/vacuum-UV and invisible by construction; its
 * photonicCompression is null and the band metadata carries the rendering hint.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

export const SCHEMA_VERSION = "harmonic-orrery.photonic-overlay.v1";
export const BUNDLE_ID = "PHOTONIC_OVERLAY_CH_TIERED_v1";

export const SOURCE_PATH = "canonical/tiered-photonic-candidates/tiered-photonic-v1.json";
export const OUTPUT_PATH = "orrery/src/generated/photonic-overlay.v1.json";

const VARIANT_A = "sum_mixing";
const VARIANT_B = "geometric_mean";
const CHANNELS_A = ["luminance", "grain", "pulse"];
const CHANNELS_B = ["luminance", "grain", "pulse", "hue"];

export function packageRootOf(scriptUrl) {
  return path.resolve(path.dirname(fileURLToPath(scriptUrl)), "..");
}

function readJson(packageRoot, relativePath) {
  return JSON.parse(fs.readFileSync(path.join(packageRoot, relativePath), "utf8"));
}

export function sha256Bytes(payload) {
  return crypto.createHash("sha256").update(payload).digest("hex");
}

export function fileSha(packageRoot, relativePath) {
  return sha256Bytes(fs.readFileSync(path.join(packageRoot, relativePath)));
}

export function canonicalText(value) {
  if (value === null) return "null";
  if (value === true) return "true";
  if (value === false) return "false";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new TypeError("non_finite_number_in_bundle");
    }
    return Number.isInteger(value) ? String(value) : value.toPrecision(15);
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalText).join(",")}]`;
  }
  if (typeof value === "object") {
    const keys = Object.keys(value).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${canonicalText(value[key])}`).join(",")}}`;
  }
  throw new TypeError(`unsupported_json_type:${typeof value}`);
}

export function canonicalJsonBytes(value) {
  return Buffer.from(canonicalText(value), "utf8");
}

export function sha256Payload(value) {
  return sha256Bytes(canonicalJsonBytes(value));
}

function requireKey(object, key, context) {
  if (!(key in object)) {
    throw new Error(`${context} is missing ${key}`);
  }
  return object[key];
}

function authoredHue(wavelengthNm) {
  // Authored presentation mapping for the visible in-hull band only. Pinned at
  // build time so the renderer never interpolates. 400 nm -> 300 deg, 700 nm -> 0 deg.
  const hue = Number((((700 - wavelengthNm) / 300) * 300).toFixed(4));
  return Math.min(300, Math.max(0, hue));
}

export function buildBundle(packageRoot) {
  const source = readJson(packageRoot, SOURCE_PATH);
  const records = requireKey(source, "records", SOURCE_PATH);
  const invariants = requireKey(source, "invariants", SOURCE_PATH);

  if (!Array.isArray(records) || records.length !== 28) {
    throw new Error(`${SOURCE_PATH} must contain exactly 28 records`);
  }
  if (invariants.anchorCount !== 14 || invariants.recordCount !== 28 || invariants.variantsPerAnchor !== 2) {
    throw new Error(`${SOURCE_PATH}.invariants must be 14 anchors / 28 records / 2 variants`);
  }

  const variantA = records.filter((record) => record.variant === VARIANT_A);
  const variantB = records.filter((record) => record.variant === VARIANT_B);
  if (variantA.length !== 14 || variantB.length !== 14) {
    throw new Error(`${SOURCE_PATH} must have 14 sum_mixing and 14 geometric_mean records`);
  }
  const anchorIds = new Set(variantA.map((record) => record.stateId));
  if (anchorIds.size !== 14 || variantB.some((record) => !anchorIds.has(record.stateId))) {
    throw new Error(`${SOURCE_PATH} variants must cover the same 14 anchors`);
  }

  for (const record of variantA) {
    if (record.photonicCompression !== null) {
      throw new Error(`Variant A record ${record.stateId} must keep photonicCompression null`);
    }
    if (record.bandMetadata?.beyondVisible !== true) {
      throw new Error(`Variant A record ${record.stateId} must be beyond visible`);
    }
    const hint = record.bandMetadata?.renderingHint ?? "";
    if (!/luminance.*grain.*pulse/.test(hint)) {
      throw new Error(`Variant A record ${record.stateId} must carry the luminance/grain/pulse rendering hint`);
    }
  }
  for (const record of variantB) {
    if (typeof record.photonicCompression !== "number") {
      throw new Error(`Variant B record ${record.stateId} must have a numeric photonicCompression`);
    }
    if (record.bandMetadata?.hullPreserved !== true) {
      throw new Error(`Variant B record ${record.stateId} must be hull-preserved`);
    }
  }

  const present = (record) => ({
    stateId: record.stateId,
    tier: record.tier,
    office: record.office,
    name: record.name,
    forte: record.forte,
    variant: record.variant,
    derivedWavelengthNm: record.derivedWavelengthNm,
    photonicCompression: record.photonicCompression,
    bandMetadata: {
      numericBandNm: record.bandMetadata.numericBandNm,
      renderingHint: record.bandMetadata.renderingHint,
      beyondVisible: record.bandMetadata.beyondVisible === true,
      hullPreserved: record.bandMetadata.hullPreserved === true,
    },
    constructionEdgeIds: record.constructionEdgeIds,
    parentStateIds: record.parentStateIds,
    recordFingerprint: record.recordFingerprint,
  });

  const core = {
    schemaVersion: SCHEMA_VERSION,
    bundleId: BUNDLE_ID,
    candidateId: source.candidateId,
    candidateFingerprint: source.candidateFingerprint,
    source: {
      artifact: SOURCE_PATH,
      sha256: fileSha(packageRoot, SOURCE_PATH),
    },
    authority: source.authority,
    interpretationPolicy: {
      causationClaim: false,
      physicalQuantityClaim: false,
      tierClassifier: false,
      channelDiscipline:
        "Variant A (sum_mixing) modulates luminance, grain, and pulse only — hue is forbidden. Variant B (geometric_mean) may modulate hue within its in-hull band.",
    },
    bands: {
      variantA: { A1: invariants.strictBands.sum_A1, A2: invariants.strictBands.sum_A2 },
      variantB: { A1: invariants.strictBands.geom_A1, A2: invariants.strictBands.geom_A2 },
    },
    records: records.map((record) => {
      const isVariantA = record.variant === VARIANT_A;
      const base = present(record);
      return {
        ...base,
        channels: isVariantA ? CHANNELS_A : CHANNELS_B,
        hue: isVariantA ? null : authoredHue(record.derivedWavelengthNm),
      };
    }),
  };

  const bundleFingerprint = sha256Payload(core);
  return { ...core, bundleFingerprint };
}

export function buildSerializedBundle(packageRoot) {
  const bundle = buildBundle(packageRoot);
  return `${JSON.stringify(bundle)}\n`;
}

function main() {
  const check = process.argv.includes("--check");
  const packageRoot = packageRootOf(import.meta.url);
  const bundle = buildBundle(packageRoot);
  const serialized = buildSerializedBundle(packageRoot);
  const outputPath = path.join(packageRoot, OUTPUT_PATH);
  if (check) {
    const existing = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, "utf8") : null;
    if (existing !== serialized) {
      throw new Error("STALE_PHOTONIC_OVERLAY");
    }
    console.log(JSON.stringify({ bundleId: bundle.bundleId, bundleFingerprint: bundle.bundleFingerprint, records: bundle.records.length, stale: false }));
  } else {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, serialized);
    console.log(JSON.stringify({ bundleId: bundle.bundleId, bundleFingerprint: bundle.bundleFingerprint, records: bundle.records.length }));
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}
