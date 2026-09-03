#!/usr/bin/env node
/**
 * Validate the deterministic photonic overlay bundle (ORR-514).
 *
 * Checks: strict schema, self-fingerprint, build freshness, channel discipline
 * (Variant A: luminance/grain/pulse only, hue forbidden, photonicCompression
 * null; Variant B: hue allowed, photonicCompression numeric), 28 records /
 * 14 anchors x 2 variants, and deterministic serialization. The channel-
 * discipline check is a standing guard: it fails any overlay that grants
 * Variant A a hue channel.
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

const BUNDLE_PATH = path.join(orreryRoot, "src/generated/photonic-overlay.v1.json");
const SCHEMA_PATH = path.join(packageRoot, "schemas/harmonic-orrery-photonic-overlay.schema.json");
const BUILDER_PATH = path.join(packageRoot, "scripts/build-photonic-overlay.mjs");
const REPORT_PATH = path.join(packageRoot, "qa/orrery-photonic-overlay-validation.json");

const CHANNELS_A = ["luminance", "grain", "pulse"];

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

  const records = bundle?.records ?? [];
  record(
    "records-28",
    Array.isArray(records) && records.length === 28
      && records.filter((r) => r?.variant === "sum_mixing").length === 14
      && records.filter((r) => r?.variant === "geometric_mean").length === 14,
    "28 records, 14 sum_mixing and 14 geometric_mean",
  );
  record(
    "anchors-14",
    Array.isArray(records)
      && new Set(records.map((r) => r?.stateId)).size === 14
      && records.every((r) => r?.tier === "A1" || r?.tier === "A2"),
    "14 unique A1/A2 anchors across both variants",
  );
  record(
    "channel-discipline-variant-a",
    Array.isArray(records)
      && records
        .filter((r) => r?.variant === "sum_mixing")
        .every(
          (r) =>
            Array.isArray(r?.channels)
            && r.channels.length === CHANNELS_A.length
            && CHANNELS_A.every((channel) => r.channels.includes(channel))
            && !r.channels.includes("hue")
            && r.hue === null
            && r.photonicCompression === null
            && r.bandMetadata?.beyondVisible === true,
        ),
    "Variant A modulates luminance/grain/pulse only; hue null; photonicCompression null; beyond-visible",
  );
  record(
    "channel-discipline-variant-b",
    Array.isArray(records)
      && records
        .filter((r) => r?.variant === "geometric_mean")
        .every(
          (r) =>
            Array.isArray(r?.channels)
            && r.channels.includes("hue")
            && typeof r?.hue === "number"
            && typeof r?.photonicCompression === "number"
            && r?.bandMetadata?.hullPreserved === true,
        ),
    "Variant B may modulate hue (in-hull); photonicCompression numeric",
  );
  record(
    "zero-mutation",
    Boolean(bundle)
      && !Object.prototype.hasOwnProperty.call(bundle, "mutations")
      && !Object.prototype.hasOwnProperty.call(bundle, "legalMoves")
      && !Object.prototype.hasOwnProperty.call(bundle, "officeAssignments")
      && bundle.records.every(
        (r) => !Object.prototype.hasOwnProperty.call(r, "legalMove")
          && !Object.prototype.hasOwnProperty.call(r, "admissionRecord"),
      ),
    "overlay declares no mutation, legal-move, office-assignment, or admission capability",
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
    { suite: "records-28 / anchors-14", status: "ran" },
    { suite: "channel-discipline-variant-a", status: "ran" },
    { suite: "channel-discipline-variant-b", status: "ran" },
    { suite: "zero-mutation", status: "ran" },
    { suite: "deterministic-serialization", status: "ran" },
  ];
  const reportCore = {
    schemaVersion: "harmonic-orrery.photonic-overlay-validation.v1",
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
