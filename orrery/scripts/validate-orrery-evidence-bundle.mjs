#!/usr/bin/env node
/**
 * Validate the deterministic A-series evidence inspector bundle.
 *
 * Checks: strict schema, self-fingerprint, build freshness (byte-identical
 * rebuild), legal-move catalog byte identity, pin derivation from the source
 * sidecar, exact-ratio integrity, uniqueness-claim wording discipline, and
 * deterministic serialization.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const Ajv2020 = require("ajv/dist/2020.js");
const ajv = new Ajv2020({ allErrors: false, strict: true });

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const orreryRoot = path.resolve(scriptDirectory, "..");
const packageRoot = path.resolve(orreryRoot, "..");

const BUNDLE_PATH = path.join(orreryRoot, "src/generated/evidence-bundle.v1.json");
const SCHEMA_PATH = path.join(packageRoot, "schemas/harmonic-orrery-evidence-bundle.schema.json");
const SIDECAR_PATH = path.join(packageRoot, "canonical/harmonic-compression-candidates/CH_A012_q_v1.json");
const LEGAL_MOVES_PATH = path.join(orreryRoot, "src/generated/legal-moves.v2.json");
const BUILDER_PATH = path.join(packageRoot, "scripts/build-orrery-evidence-bundle.mjs");
const REPORT_PATH = path.join(packageRoot, "qa/orrery-evidence-bundle-validation.json");

const WA012_WORDING = "unique max-margin optimum under the declared objective";
const ACTIVE_SET_LABEL = "active-set rank 8 (7 binding + normalization)";

function sha256Bytes(payload) {
  return crypto.createHash("sha256").update(payload).digest("hex");
}

function readJson(absolutePath) {
  return JSON.parse(fs.readFileSync(absolutePath, "utf8"));
}

async function validate() {
  const checks = [];
  const record = (checkId, passed, diagnostic) => {
    checks.push({ checkId, status: passed ? "PASS" : "FAIL", diagnostic });
  };

  let bundle = null;
  let schema = null;
  let sidecar = null;
  let legalMoves = null;
  let error = null;
  try {
    bundle = readJson(BUNDLE_PATH);
    schema = readJson(SCHEMA_PATH);
    sidecar = readJson(SIDECAR_PATH);
    legalMoves = readJson(LEGAL_MOVES_PATH);
  } catch (readError) {
    error = String(readError.message ?? readError);
  }

  if (error) {
    record("schema", false, error);
  } else {
    const validateSchema = ajv.compile(schema);
    record("schema", validateSchema(bundle), validateSchema.errors?.[0]?.message ?? "valid");
  }

  let core = {};
  let payloadHash = null;
  if (bundle) {
    core = Object.fromEntries(Object.entries(bundle).filter(([key]) => key !== "bundleFingerprint"));
    const { sha256Payload } = await import(BUILDER_PATH);
    payloadHash = sha256Payload(core);
  }
  record(
    "fingerprint",
    Boolean(bundle) && bundle.bundleFingerprint === payloadHash,
    bundle?.bundleFingerprint ?? error,
  );

  let fresh = false;
  let freshDiagnostic = "rebuild unavailable";
  if (!error) {
    try {
      const builder = await import(BUILDER_PATH);
      const serialized = builder.buildSerializedBundle(packageRoot);
      fresh = serialized === fs.readFileSync(BUNDLE_PATH, "utf8");
      freshDiagnostic = fresh ? "byte-identical rebuild" : "bundle differs from source-derived rebuild";
    } catch (rebuildError) {
      freshDiagnostic = String(rebuildError.message ?? rebuildError);
    }
  }
  record("freshness", fresh, freshDiagnostic);

  record(
    "legal-move-byte-identity",
    Boolean(legalMoves)
      && bundle?.legalMoveCatalogBinding?.catalogFingerprint === legalMoves.catalogFingerprint
      && bundle?.sources?.some(
        (source) => source.artifact === "orrery/src/generated/legal-moves.v2.json"
          && source.sha256 === sha256Bytes(fs.readFileSync(LEGAL_MOVES_PATH)),
      ),
    "legal-move catalog bytes unchanged and pinned",
  );

  record(
    "pin-derived-from-artifact",
    Boolean(sidecar)
      && bundle?.harmonicDescriptorBinding?.candidateFingerprint === sidecar.candidateFingerprint
      && bundle?.sources?.some(
        (source) => source.artifact === "canonical/harmonic-compression-candidates/CH_A012_q_v1.json"
          && source.sha256 === sha256Bytes(fs.readFileSync(SIDECAR_PATH)),
      ),
    "candidate pin derived from the live sidecar file, not a literal",
  );

  const records = bundle?.records ?? [];
  record(
    "records-21",
    Array.isArray(records) && records.length === 21
      && ["A0", "A1", "A2"].every(
        (tier) => records.filter((record) => record?.tier === tier).length === 7,
      ),
    "21 A0-A2 anchor records, seven per tier",
  );
  record(
    "exact-ratios",
    records.length === 21
      && records.every(
        (record) =>
          record.weightedProjection?.denominator === 407
          && Number.isInteger(record.weightedProjection?.numerator),
      ),
    "every W_A012 projection is an exact numerator/407 rational",
  );
  record(
    "qs-seven-positions",
    records.length === 21
      && records.every(
        (record) =>
          Array.isArray(record.triadicCompressionSignature)
          && record.triadicCompressionSignature.length === 7
          && record.triadicCompressionSignature.every(
            (value) => Number.isInteger(value) && value >= 0 && value <= 3,
          ),
      ),
    "all seven Q(S) positions enumerated per anchor",
  );
  record(
    "certificate-values",
    bundle?.certificate?.epsilonStar?.numerator === 3
      && bundle?.certificate?.epsilonStar?.denominator === 407
      && bundle?.certificate?.nextTightestSlack?.numerator === 6
      && bundle?.certificate?.nextTightestSlack?.denominator === 407
      && bundle?.certificate?.nextTightestSlack?.pair === "Acoustic-Phrygian"
      && Array.isArray(bundle?.certificate?.tightSet)
      && bundle?.certificate?.tightSet.length === 7,
    "3/407 margin, 6/407 next slack, 7-member tight set",
  );
  record(
    "active-set-label",
    bundle?.certificate?.activeSetLabel === ACTIVE_SET_LABEL,
    ACTIVE_SET_LABEL,
  );
  record(
    "wording-discipline",
    bundle?.method?.uniquenessClaim === false
      && records.length === 21
      && records.every((record) => record.wA012Wording === WA012_WORDING),
    "unique max-margin optimum under the declared objective; uniquenessClaim=false preserved",
  );
  record(
    "global-null-guard",
    bundle?.globalAggregate?.namespace === "harmonic.C_H"
      && bundle?.globalAggregate?.status === "unresolved"
      && bundle?.globalAggregate?.value === null
      && typeof bundle?.globalAggregate?.guardLiteral === "string"
      && bundle?.globalAggregate?.guardLiteral.length > 0,
    "global C_H stays unresolved null with its guard literal",
  );
  record(
    "label-map-complete",
    ["stateGovernor", "tier", "forteFamily", "pitchClasses", "stateGovernorDegree", "triadicCompressionSignature", "weightedProjection", "certificate", "wavelength", "photonicCompression", "admissionStatus", "globalAggregate", "provenance"].every(
      (key) => Boolean(bundle?.labelMap?.[key]?.label && bundle?.labelMap?.[key]?.source && bundle?.labelMap?.[key]?.absentValue),
    ),
    "every displayed field has a stable label, source path, and absent-value rule",
  );
  record(
    "deterministic-serialization",
    Boolean(bundle)
      && sha256Bytes(JSON.stringify(core)) === sha256Bytes(JSON.stringify(JSON.parse(JSON.stringify(core)))),
    "serialization is stable under round-trip",
  );

  const failed = checks.filter((check) => check.status === "FAIL");
  const reportCore = {
    schemaVersion: "harmonic-orrery.evidence-bundle-validation.v1",
    verdict: failed.length === 0 ? "PASS" : "FAIL",
    bundleId: bundle?.bundleId ?? null,
    bundleFingerprint: bundle?.bundleFingerprint ?? null,
    checksPassed: checks.length - failed.length,
    checksFailed: failed.length,
    checks,
  };
  const { sha256Payload } = await import(BUILDER_PATH);
  return { ...reportCore, reportFingerprint: sha256Payload(reportCore) };
}

async function main() {
  const report = await validate();
  const noWrite = process.argv.includes("--no-write");
  if (!noWrite) {
    fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
    fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
  }
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = report.verdict === "PASS" ? 0 : 1;
}

main();
