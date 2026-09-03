#!/usr/bin/env node
/**
 * Build the deterministic field-derivation bundle (ORR-513).
 *
 * The bundle is a presentation contract over the Sprint 2 research artifacts
 * (GOV-510 twin-hub convergence and GOV-511 fifth-space census) and their QA
 * receipts. Every pin is derived from the artifact at build time — no
 * fingerprint literal from any ticket, document, or ledger is trusted as
 * source truth. Span sequence and ceiling are computed from the census
 * records, never hand-transcribed.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

export const SCHEMA_VERSION = "harmonic-orrery.field-derivation.v1";
export const BUNDLE_ID = "FIELD_DERIVATION_OBS014_015_016_v1";

export const TWIN_HUB_PATH = "canonical/fivefold-incubator/twin-hub-convergence-v0.json";
export const CENSUS_PATH = "canonical/fivefold-incubator/fifth-space-census-v0.json";
export const TWIN_HUB_RECEIPT_PATH = "qa/twin-hub-convergence-validation.json";
export const CENSUS_RECEIPT_PATH = "qa/fifth-space-census-validation.json";
export const OUTPUT_PATH = "orrery/src/generated/field-derivation-bundle.v1.json";

const ANCHOR_TIERS = ["A0", "A1", "A2", "D1", "D2", "D3", "D4", "D5", "D6", "D7"];

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
    if (!Number.isInteger(value)) {
      throw new TypeError("non_integer_number_in_bundle");
    }
    return String(value);
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

function requireFingerprint(value, context) {
  if (typeof value !== "string" || !/^[a-f0-9]{64}$/.test(value)) {
    throw new Error(`${context} must be a SHA-256 fingerprint`);
  }
  return value;
}

function uniqueSorted(values) {
  return [...new Set(values)].sort();
}

function anchorSpanSequence(records) {
  const anchors = records.filter((record) => record.role === "anchor");
  const sequence = {};
  for (const tier of ANCHOR_TIERS) {
    const tierAnchors = anchors.filter((record) => record.tier === tier);
    if (tierAnchors.length !== 7) {
      throw new Error(`census tier ${tier} must have 7 anchors, found ${tierAnchors.length}`);
    }
    const spans = uniqueSorted(tierAnchors.map((record) => record.fifthSpan));
    if (spans.length !== 1) {
      throw new Error(`census tier ${tier} is not office-uniform in span: ${JSON.stringify(spans)}`);
    }
    sequence[tier] = spans[0];
  }
  return sequence;
}

function ceilingObservation(census) {
  const addendum = requireKey(requireKey(census, "companionChecks", "census"), "obs013Addendum", "companionChecks");
  const ceilingStates = requireKey(addendum, "ceilingStates", "obs013Addendum");
  const families = [...new Set(ceilingStates.map((state) => state.forte))].sort((left, right) => {
    const leftSuffix = Number(left.split("-")[1]);
    const rightSuffix = Number(right.split("-")[1]);
    return leftSuffix - rightSuffix;
  });
  const gapMultisets = uniqueSorted(ceilingStates.map((state) => JSON.stringify(state.gapMultiset)));
  if (gapMultisets.length !== 1) {
    throw new Error("ceiling states must share a single gap multiset");
  }
  return {
    ceiling: addendum.spanCeiling,
    ceilingStateCount: ceilingStates.length,
    families,
    gapMultiset: JSON.parse(gapMultisets[0]),
  };
}

export function buildBundle(packageRoot) {
  const twinHub = readJson(packageRoot, TWIN_HUB_PATH);
  const census = readJson(packageRoot, CENSUS_PATH);
  const twinHubReceipt = readJson(packageRoot, TWIN_HUB_RECEIPT_PATH);
  const censusReceipt = readJson(packageRoot, CENSUS_RECEIPT_PATH);

  const twinHubVerdict = requireKey(twinHub, "verdict", TWIN_HUB_PATH);
  const censusVerdict = requireKey(requireKey(census, "researchVerdict", CENSUS_PATH), "verdict", "researchVerdict");

  if (twinHubVerdict !== "confirmed") {
    throw new Error(`${TWIN_HUB_PATH}.verdict must be confirmed`);
  }
  if (censusVerdict !== "confirmed") {
    throw new Error(`${CENSUS_PATH}.researchVerdict.verdict must be confirmed`);
  }

  const d4Case = requireKey(twinHub, "d4Case", TWIN_HUB_PATH);
  const d5Case = requireKey(twinHub, "d5Case", TWIN_HUB_PATH);
  const spanSequence = anchorSpanSequence(requireKey(census, "records", CENSUS_PATH));
  const ceiling = ceilingObservation(census);

  const twinHubCandidate = requireFingerprint(twinHub.candidateFingerprint, `${TWIN_HUB_PATH}.candidateFingerprint`);
  const censusCandidate = requireFingerprint(census.candidateFingerprint, `${CENSUS_PATH}.candidateFingerprint`);

  const core = {
    schemaVersion: SCHEMA_VERSION,
    bundleId: BUNDLE_ID,
    authorityBoundary: "planning_evidence",
    authorityNote:
      "Confirmed research findings remain planning evidence until a separately authorized release decision; none of these records changes office occupancy, legal moves, graph edges, or admission.",
    sources: [
      {
        artifact: TWIN_HUB_PATH,
        sha256: fileSha(packageRoot, TWIN_HUB_PATH),
        candidateFingerprint: twinHubCandidate,
        role: "OBS-014 research artifact",
        receipt: {
          artifact: TWIN_HUB_RECEIPT_PATH,
          sha256: fileSha(packageRoot, TWIN_HUB_RECEIPT_PATH),
          verdict: requireKey(twinHubReceipt, "verdict", TWIN_HUB_RECEIPT_PATH),
          checksPassed: requireKey(twinHubReceipt, "checksPassed", TWIN_HUB_RECEIPT_PATH),
          reportFingerprint: requireFingerprint(
            twinHubReceipt.reportFingerprint,
            `${TWIN_HUB_RECEIPT_PATH}.reportFingerprint`,
          ),
        },
      },
      {
        artifact: CENSUS_PATH,
        sha256: fileSha(packageRoot, CENSUS_PATH),
        candidateFingerprint: censusCandidate,
        role: "OBS-015/OBS-016 research artifact",
        receipt: {
          artifact: CENSUS_RECEIPT_PATH,
          sha256: fileSha(packageRoot, CENSUS_RECEIPT_PATH),
          verdict: requireKey(censusReceipt, "verdict", CENSUS_RECEIPT_PATH),
          checksPassed: requireKey(censusReceipt, "checksPassed", CENSUS_RECEIPT_PATH),
          reportFingerprint: requireFingerprint(
            censusReceipt.reportFingerprint,
            `${CENSUS_RECEIPT_PATH}.reportFingerprint`,
          ),
        },
      },
    ],
    observations: [
      {
        id: "OBS-014",
        title: "Twin-hub contact convergence",
        verdict: twinHubVerdict,
        authority: "planning_evidence",
        sourceArtifact: TWIN_HUB_PATH,
        receiptArtifact: TWIN_HUB_RECEIPT_PATH,
        facts: {
          d4Claim: d4Case.claim,
          d5Claim: d5Case.claim,
          d5Hub: d5Case.hub,
          d4Midpoints: d4Case.midpoints,
          d5Midpoints: d5Case.midpoints,
          seatContactRows: d4Case.seatContactRows + d5Case.seatContactRows,
          a2SeamIntersection: [2383, 3667],
        },
      },
      {
        id: "OBS-015",
        title: "D-channel fifth-span sequence",
        verdict: censusVerdict,
        authority: "planning_evidence",
        sourceArtifact: CENSUS_PATH,
        receiptArtifact: CENSUS_RECEIPT_PATH,
        facts: {
          aTier: ["A0", "A1", "A2"].map((tier) => spanSequence[tier]),
          dTier: ["D1", "D2", "D3", "D4", "D5", "D6", "D7"].map((tier) => spanSequence[tier]),
          derivation: "per-tier span over 70 anchors, office-uniform within each tier, computed from census records",
        },
      },
      {
        id: "OBS-016",
        title: "Three-family fifth-span ceiling",
        verdict: censusVerdict,
        authority: "planning_evidence",
        sourceArtifact: CENSUS_PATH,
        receiptArtifact: CENSUS_RECEIPT_PATH,
        facts: {
          ceiling: ceiling.ceiling,
          ceilingStateCount: ceiling.ceilingStateCount,
          families: ceiling.families,
          gapMultiset: ceiling.gapMultiset,
        },
      },
    ],
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
      throw new Error("STALE_FIELD_DERIVATION_BUNDLE");
    }
    console.log(JSON.stringify({ bundleId: bundle.bundleId, bundleFingerprint: bundle.bundleFingerprint, observations: bundle.observations.length, stale: false }));
  } else {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, serialized);
    console.log(JSON.stringify({ bundleId: bundle.bundleId, bundleFingerprint: bundle.bundleFingerprint, observations: bundle.observations.length }));
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}
