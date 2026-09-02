#!/usr/bin/env node
/**
 * Build the deterministic A-series evidence inspector bundle.
 *
 * The bundle is a presentation contract backed by the pinned GOV-213 sidecar
 * `canonical/harmonic-compression-candidates/CH_A012_q_v1.json`. Every pin is
 * derived from the artifact at build time — no fingerprint literal from any
 * ticket or document is trusted as source truth.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

export const SCHEMA_VERSION = "harmonic-orrery.evidence-bundle.v1";
export const BUNDLE_ID = "EVIDENCE_BUNDLE_A012_v1";
export const ACTIVE_SET_LABEL = "active-set rank 8 (7 binding + normalization)";
export const WA012_WORDING = "unique max-margin optimum under the declared objective";

export const SIDECAR_PATH = "canonical/harmonic-compression-candidates/CH_A012_q_v1.json";
export const LEGAL_MOVES_PATH = "orrery/src/generated/legal-moves.v2.json";
export const THEOREM_PATH = "docs/A_TIER_TRIADIC_COMPRESSION_THEOREM.md";
export const GOVERNORS_PATH = "schemas/governors.yaml";
export const OUTPUT_PATH = "orrery/src/generated/evidence-bundle.v1.json";

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

export function buildBundle(packageRoot) {
  const sidecar = readJson(packageRoot, SIDECAR_PATH);
  const legalMoves = readJson(packageRoot, LEGAL_MOVES_PATH);

  const candidateFingerprint = requireKey(sidecar, "candidateFingerprint", SIDECAR_PATH);
  const method = requireKey(sidecar, "method", SIDECAR_PATH);
  const certificate = requireKey(sidecar, "certificate", SIDECAR_PATH);
  const invariants = requireKey(sidecar, "invariants", SIDECAR_PATH);
  const records = requireKey(sidecar, "records", SIDECAR_PATH);
  const globalAggregate = requireKey(sidecar, "globalAggregate", SIDECAR_PATH);

  if (!/^[a-f0-9]{64}$/.test(String(candidateFingerprint))) {
    throw new Error(`${SIDECAR_PATH} has a malformed candidateFingerprint`);
  }
  if (method.uniquenessClaim !== false) {
    throw new Error(`${SIDECAR_PATH}.method.uniquenessClaim must remain false`);
  }
  if (!Array.isArray(records) || records.length !== 21) {
    throw new Error(`${SIDECAR_PATH} must contain 21 A0-A2 anchor records`);
  }
  for (const record of records) {
    if (record.weightedProjection?.denominator !== 407) {
      throw new Error(`${SIDECAR_PATH} weightedProjection must stay exact over 407`);
    }
  }
  const epsilon = certificate.epsilonStar;
  const slack = certificate.nextTightestSlack;
  if (epsilon?.numerator !== 3 || epsilon?.denominator !== 407) {
    throw new Error(`${SIDECAR_PATH} certificate margin must be the source 3/407 value`);
  }
  if (slack?.numerator !== 6 || slack?.denominator !== 407 || slack?.pair !== "Acoustic-Phrygian") {
    throw new Error(`${SIDECAR_PATH} certificate slack must be the source 6/407 value`);
  }
  if (!Array.isArray(certificate.tightSet) || certificate.tightSet.length !== 7) {
    throw new Error(`${SIDECAR_PATH} certificate tight set must have 7 binding members`);
  }
  if (globalAggregate?.value !== null || globalAggregate?.status !== "unresolved") {
    throw new Error(`${SIDECAR_PATH} global C_H guard must stay unresolved null`);
  }

  const labelMap = {
    stateGovernor: {
      label: "State Governor",
      source: `${SIDECAR_PATH}:records[i].stateGovernor`,
      note: "categorical office; never inferred from W_A012",
      absentValue: "unavailable",
    },
    tier: {
      label: "Tier band",
      source: `${SIDECAR_PATH}:records[i].tier`,
      note: "topology precedence, not a score",
      absentValue: "unavailable",
    },
    forteFamily: {
      label: "Forte family",
      source: `${SIDECAR_PATH}:records[i].forte`,
      absentValue: "unavailable",
    },
    pitchClasses: {
      label: "Pitch-class mask",
      source: `${SIDECAR_PATH}:records[i].pitchClasses`,
      note: "rooted to pitch class 0; mask equals stateId",
      absentValue: "unavailable",
    },
    stateGovernorDegree: {
      label: "Degree Governor address",
      source: `${SIDECAR_PATH}:records[i].stateGovernorDegree`,
      note: "Chaldean degree address; separate from the State Governor office",
      absentValue: "unavailable",
    },
    triadicCompressionSignature: {
      label: "Q(S) triadic-compression signature",
      source: `${SIDECAR_PATH}:records[i].triadicCompressionSignature`,
      note: "seven positions, q_v1 classes 0..3",
      absentValue: "unavailable",
    },
    weightedProjection: {
      label: "W_A012 scoped anchor weight",
      source: `${SIDECAR_PATH}:records[i].weightedProjection`,
      note: "exact rational numerator/407; never a float",
      wording: WA012_WORDING,
      wordingNote: "method.uniquenessClaim=false remains true outside the declared max-margin objective",
      absentValue: "unavailable",
    },
    certificate: {
      label: "Certificate status",
      source: `${SIDECAR_PATH}:certificate`,
      note: "unique max-margin optimum under the declared LP objective",
      activeSetLabel: ACTIVE_SET_LABEL,
      absentValue: "unavailable",
    },
    wavelength: {
      label: "Representative wavelength",
      source: "schemas/harmonic-orrery-nodes.schema.json:photonic.representativeWavelengthNm",
      note: "photonic layer, not the harmonic coordinate",
      absentValue: "unavailable",
    },
    photonicCompression: {
      label: "Photonic compression (C_P)",
      source: "schemas/harmonic-orrery-nodes.schema.json:photonic.photonicCompression",
      note: "photonic layer; not W_A012 and not C_H",
      absentValue: "unavailable",
    },
    admissionStatus: {
      label: "Admission status",
      source: `${SIDECAR_PATH}:status`,
      absentValue: "unavailable",
    },
    globalAggregate: {
      label: "Global harmonic aggregate",
      source: `${SIDECAR_PATH}:globalAggregate`,
      note: "C_H stays unresolved null; the guard literal is displayed, never a number",
      absentValue: "unresolved",
    },
    provenance: {
      label: "Provenance",
      source: `${SIDECAR_PATH}:sourceBindings`,
      note: "source SHA-256 bindings from the pinned sidecar",
      absentValue: "unavailable",
    },
  };

  const core = {
    schemaVersion: SCHEMA_VERSION,
    bundleId: BUNDLE_ID,
    harmonicDescriptorBinding: {
      candidateId: sidecar.candidateId,
      coordinateId: sidecar.coordinateId,
      releaseId: sidecar.releaseId,
      status: sidecar.status,
      candidateFingerprint,
    },
    legalMoveCatalogBinding: {
      schemaVersion: legalMoves.schemaVersion,
      catalogId: legalMoves.catalogId,
      catalogFingerprint: legalMoves.catalogFingerprint,
    },
    sources: [
      { artifact: SIDECAR_PATH, sha256: fileSha(packageRoot, SIDECAR_PATH), role: "A0-A2 anchor harmonic descriptor" },
      { artifact: LEGAL_MOVES_PATH, sha256: fileSha(packageRoot, LEGAL_MOVES_PATH), role: "legal-move catalog bytes" },
      { artifact: THEOREM_PATH, sha256: fileSha(packageRoot, THEOREM_PATH), role: "scoped research theorem" },
      { artifact: GOVERNORS_PATH, sha256: fileSha(packageRoot, GOVERNORS_PATH), role: "machine governor registry" },
    ],
    labelMap,
    method: {
      algorithmVersion: method.algorithmVersion,
      qClasses: method.qClasses,
      governorDegreeMap: method.governorDegreeMap,
      degreeOrder: method.degreeOrder,
      weightDenominator: method.weightDenominator,
      weightNumerators: method.weightNumerators,
      weightOrdering: method.weightOrdering,
      weightSum: method.weightSum,
      uniquenessClaim: method.uniquenessClaim,
    },
    certificate: {
      epsilonStar: epsilon,
      nextTightestSlack: slack,
      tightSet: certificate.tightSet,
      activeSetLabel: ACTIVE_SET_LABEL,
      optimalityClaim: certificate.optimalityClaim,
      witness: certificate.witness,
      dualCertificate: certificate.dualCertificate,
      verifier: certificate.verifier,
    },
    invariants: {
      a0A1Gap: invariants.a0A1Gap,
      a1A2Gap: invariants.a1A2Gap,
      tierSumOrder: invariants.tierSumOrder,
      strictBandSeparation: invariants.strictBandSeparation,
    },
    globalAggregate: {
      namespace: globalAggregate.namespace,
      status: globalAggregate.status,
      value: globalAggregate.value,
      guardLiteral: globalAggregate.guardLiteral,
    },
    records: records.map((record) => ({
      stateId: record.stateId,
      name: record.name,
      tier: record.tier,
      forteFamily: record.forte,
      stateGovernor: record.stateGovernor,
      stateGovernorDegree: record.stateGovernorDegree,
      pitchClasses: record.pitchClasses,
      intervalVector: record.intervalVector,
      governorSeatCompressionClass: record.governorSeatCompressionClass,
      triadicCompressionSignature: record.triadicCompressionSignature,
      weightedProjection: {
        numerator: record.weightedProjection.numerator,
        denominator: record.weightedProjection.denominator,
      },
      wA012Wording: WA012_WORDING,
      recordFingerprint: record.recordFingerprint,
    })),
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
      throw new Error("STALE_EVIDENCE_BUNDLE");
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
