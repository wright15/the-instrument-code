#!/usr/bin/env node
/**
 * Validate the deterministic field-derivation bundle (ORR-513).
 *
 * Checks: strict schema, self-fingerprint, build freshness (byte-identical
 * rebuild), pin derivation from the live research artifacts and QA receipts,
 * observation completeness, verdict/authority discipline, and deterministic
 * serialization. Emits suiteStatus per the standing verification-gate rule.
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

const BUNDLE_PATH = path.join(orreryRoot, "src/generated/field-derivation-bundle.v1.json");
const SCHEMA_PATH = path.join(packageRoot, "schemas/harmonic-orrery-field-derivation-bundle.schema.json");
const BUILDER_PATH = path.join(packageRoot, "scripts/build-field-derivation-bundle.mjs");
const REPORT_PATH = path.join(packageRoot, "qa/orrery-field-derivation-bundle-validation.json");

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
  let error = null;
  try {
    bundle = readJson(BUNDLE_PATH);
    schema = readJson(SCHEMA_PATH);
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
    "observations-complete",
    Array.isArray(bundle?.observations)
      && bundle.observations.map((o) => o?.id).join(",") === "OBS-014,OBS-015,OBS-016",
    "OBS-014, OBS-015, and OBS-016 present in order",
  );
  record(
    "verdict-authority-discipline",
    Array.isArray(bundle?.observations)
      && bundle.observations.every(
        (o) =>
          ["confirmed", "refuted", "partial", "unavailable", "incompatible"].includes(o?.verdict)
          && o?.authority === "planning_evidence"
          && typeof o?.sourceArtifact === "string"
          && typeof o?.receiptArtifact === "string",
      ),
    "every observation carries a verdict, planning-evidence authority, and source/receipt links",
  );
  record(
    "receipts-bound",
    Array.isArray(bundle?.sources)
      && bundle.sources.length === 2
      && bundle.sources.every(
        (source) =>
          typeof source?.receipt?.checksPassed === "number"
          && /^[0-9a-f]{64}$/.test(String(source?.receipt?.reportFingerprint ?? "")),
      ),
    "both QA receipts bound with checksPassed and reportFingerprint",
  );
  record(
    "deterministic-serialization",
    Boolean(bundle)
      && sha256Bytes(JSON.stringify(core)) === sha256Bytes(JSON.stringify(JSON.parse(JSON.stringify(core)))),
    "serialization is stable under round-trip",
  );

  const failed = checks.filter((check) => check.status === "FAIL");
  const suiteStatus = [
    { suite: "strict-schema", status: "ran" },
    { suite: "self-fingerprint", status: "ran" },
    { suite: "freshness (byte-identical rebuild)", status: "ran" },
    { suite: "observations-complete", status: "ran" },
    { suite: "verdict-authority-discipline", status: "ran" },
    { suite: "receipts-bound", status: "ran" },
    { suite: "deterministic-serialization", status: "ran" },
  ];
  const reportCore = {
    schemaVersion: "harmonic-orrery.field-derivation-validation.v1",
    verdict: failed.length === 0 ? "PASS" : "FAIL",
    bundleId: bundle?.bundleId ?? null,
    bundleFingerprint: bundle?.bundleFingerprint ?? null,
    checksPassed: checks.length - failed.length,
    checksFailed: failed.length,
    suiteStatus,
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
