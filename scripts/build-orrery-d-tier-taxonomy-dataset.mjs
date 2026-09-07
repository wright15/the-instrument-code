#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { OUTPUT_PATH as TAXONOMY_OUTPUT_PATH } from "./build-orrery-taxonomy-read-model.mjs";

export const SCHEMA_VERSION = "harmonic-orrery.d-tier-taxonomy-dataset.v1";
export const DATASET_ID = "D_TIER_TAXONOMY_DATASET_v1";
export const CENSUS_PATH = "canonical/fivefold-incubator/fifth-space-census-v0.json";
export const OUTPUT_PATH = "orrery/src/generated/d-tier-taxonomy-dataset.v1.json";

const rootOf = (url) => path.resolve(path.dirname(fileURLToPath(url)), "..");
const read = (root, relativePath) => fs.readFileSync(path.join(root, relativePath));
const readJson = (root, relativePath) => JSON.parse(read(root, relativePath).toString("utf8"));
const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");
function canonical(value) {
  if (value === null) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
}

export function buildDataset(root) {
  const taxonomy = readJson(root, TAXONOMY_OUTPUT_PATH);
  const census = readJson(root, CENSUS_PATH);
  const taxonomyLedgerSha = taxonomy.sources?.find((source) => source.artifact === "canonical/universal-heptatonic-ledger.json")?.sha256;
  if (typeof taxonomyLedgerSha !== "string" || census.evidenceBindings?.canonicalLedgerSha256 !== taxonomyLedgerSha) throw new Error("D_TIER_TAXONOMY_SOURCE_INCOMPATIBLE");
  if (!Array.isArray(census.records) || !["confirmed", "refuted", "partial"].includes(census.researchVerdict?.verdict)) throw new Error("D_TIER_CENSUS_INVALID");
  const taxonomyById = new Map(taxonomy.records.map((record) => [record.stateId, record]));
  const records = census.records
    .filter((record) => typeof record.tier === "string" && record.tier.startsWith("D"))
    .map((record) => {
      const identity = taxonomyById.get(record.stateId);
      if (!identity || identity.sourceOrder !== record.stateId) throw new Error(`D_TIER_TAXONOMY_IDENTITY_MISMATCH:${record.stateId}`);
      return {
        stateId: identity.stateId,
        sourceOrder: identity.sourceOrder,
        name: identity.name,
        forte: identity.forte,
        role: identity.role,
        tier: identity.tier,
        office: identity.office,
        officeStatus: identity.officeStatus,
        authority: "planning_evidence",
        fifthMask: record.fifthMask,
        fifthPositions: record.fifthPositions,
        fifthSpan: record.fifthSpan,
        fifthArc: record.fifthArc,
        holes: record.holes,
        gapMultiset: record.gapMultiset,
        provenancePath: record.provenancePath,
      };
    })
    .sort((left, right) => left.sourceOrder - right.sourceOrder);
  if (records.length !== 175 || new Set(records.map((record) => record.stateId)).size !== 175) throw new Error("D_TIER_TAXONOMY_SCOPE_MISMATCH");
  const core = {
    schemaVersion: SCHEMA_VERSION,
    datasetId: DATASET_ID,
    authorityBoundary: "planning_evidence",
    authorityNote: "D-tier fifth-space values are descriptive planning evidence. The census verdict does not govern whether valid data is available.",
    taxonomyBinding: { artifact: TAXONOMY_OUTPUT_PATH, bundleFingerprint: taxonomy.bundleFingerprint, canonicalLedgerSha256: taxonomyLedgerSha },
    censusBinding: { artifact: CENSUS_PATH, sha256: sha256(read(root, CENSUS_PATH)), candidateId: census.candidateId, candidateFingerprint: census.candidateFingerprint, status: census.status, researchVerdict: census.researchVerdict },
    recordCount: records.length,
    records,
  };
  return { ...core, datasetFingerprint: sha256(Buffer.from(canonical(core), "utf8")) };
}

export function serializeDataset(root) { return `${JSON.stringify(buildDataset(root))}\n`; }

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const root = rootOf(import.meta.url);
  const output = path.join(root, OUTPUT_PATH);
  const serialized = serializeDataset(root);
  if (process.argv.includes("--check")) {
    if (!fs.existsSync(output) || fs.readFileSync(output, "utf8") !== serialized) throw new Error("STALE_D_TIER_TAXONOMY_DATASET");
  } else {
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, serialized);
  }
  const dataset = buildDataset(root);
  console.log(JSON.stringify({ datasetId: dataset.datasetId, recordCount: dataset.recordCount, stale: false }));
}
