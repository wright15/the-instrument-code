#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const SCHEMA_VERSION = "harmonic-orrery.taxonomy-read-model.v1";
export const BUNDLE_ID = "TAXONOMY_READ_MODEL_v1";
export const LEDGER_PATH = "canonical/universal-heptatonic-ledger.json";
export const AUTHORITY_PATH = "provenance/SOURCE_AUTHORITY.md";
export const OUTPUT_PATH = "orrery/src/generated/taxonomy-read-model.v1.json";

const rootOf = (url) => path.resolve(path.dirname(fileURLToPath(url)), "..");
const bytes = (value) => fs.readFileSync(value);
const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");
const readJson = (root, relativePath) => JSON.parse(bytes(path.join(root, relativePath)).toString("utf8"));

function canonical(value) {
  if (value === null) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
}

function recordOf(source) {
  if (Array.isArray(source)) return source;
  for (const key of ["records", "states", "ledger"]) {
    if (Array.isArray(source?.[key])) return source[key];
  }
  throw new Error("CANONICAL_LEDGER_RECORDS_UNAVAILABLE");
}

function sourceField(record, name) {
  return Object.hasOwn(record, name) ? record[name] : null;
}

export function buildBundle(root) {
  const ledger = readJson(root, LEDGER_PATH);
  const records = recordOf(ledger).map((source, index) => {
    if (!Number.isSafeInteger(source.id)) throw new Error(`INVALID_STATE_ID:${index}`);
    const office = sourceField(source, "office");
    if (office !== null && typeof office !== "string") throw new Error(`INVALID_OFFICE:${source.id}`);
    const tier = sourceField(source, "tier");
    if (tier !== null && typeof tier !== "string") throw new Error(`INVALID_TIER:${source.id}`);
    return {
      stateId: source.id,
      sourceOrder: source.id,
      name: String(source.name),
      forte: String(source.forte),
      chirality: String(source.chirality),
      role: String(source.role),
      fineRole: sourceField(source, "fineRole"),
      tier,
      office,
      officeIndex: sourceField(source, "officeIndex"),
      officeStatus: office === null ? "withheld" : "available",
      authority: "canonical_release",
      provenancePath: LEDGER_PATH,
    };
  }).sort((left, right) => left.sourceOrder - right.sourceOrder);
  if (records.length !== 462 || new Set(records.map((record) => record.stateId)).size !== 462) {
    throw new Error("CANONICAL_TAXONOMY_SCOPE_MISMATCH");
  }
  const roleCounts = Object.fromEntries(records.reduce((counts, record) => {
    counts.set(record.role, (counts.get(record.role) ?? 0) + 1);
    return counts;
  }, new Map()).entries());
  const core = {
    schemaVersion: SCHEMA_VERSION,
    bundleId: BUNDLE_ID,
    authorityBoundary: "canonical_release",
    authorityNote: "Canonical taxonomy data is read-only. Filtering and inspection do not infer office, tier, topology, admission, or a relationship.",
    sources: [
      { artifact: LEDGER_PATH, sha256: sha256(bytes(path.join(root, LEDGER_PATH))) },
      { artifact: AUTHORITY_PATH, sha256: sha256(bytes(path.join(root, AUTHORITY_PATH))) },
    ],
    recordCount: records.length,
    roleCounts,
    records,
  };
  return { ...core, bundleFingerprint: sha256(Buffer.from(canonical(core), "utf8")) };
}

export function serializeBundle(root) {
  return `${JSON.stringify(buildBundle(root))}\n`;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const root = rootOf(import.meta.url);
  const output = path.join(root, OUTPUT_PATH);
  const serialized = serializeBundle(root);
  if (process.argv.includes("--check")) {
    if (!fs.existsSync(output) || fs.readFileSync(output, "utf8") !== serialized) throw new Error("STALE_TAXONOMY_READ_MODEL");
  } else {
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, serialized);
  }
  const bundle = buildBundle(root);
  console.log(JSON.stringify({ bundleId: bundle.bundleId, recordCount: bundle.recordCount, stale: false }));
}
