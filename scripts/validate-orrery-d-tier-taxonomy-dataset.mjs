#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import { buildDataset, OUTPUT_PATH } from "./build-orrery-d-tier-taxonomy-dataset.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataset = JSON.parse(fs.readFileSync(path.join(root, OUTPUT_PATH), "utf8"));
const schema = JSON.parse(fs.readFileSync(path.join(root, "schemas/harmonic-orrery-d-tier-taxonomy-dataset.schema.json"), "utf8"));
const validate = new Ajv2020({ strict: false }).compile(schema);
if (!validate(dataset)) throw new Error(`INVALID_D_TIER_TAXONOMY_SCHEMA:${JSON.stringify(validate.errors)}`);
if (JSON.stringify(dataset) !== JSON.stringify(buildDataset(root))) throw new Error("D_TIER_TAXONOMY_SOURCE_DRIFT");
if (dataset.records.some((record, index) => !String(record.tier).startsWith("D") || (index && record.sourceOrder <= dataset.records[index - 1].sourceOrder))) throw new Error("D_TIER_TAXONOMY_ORDER_OR_SCOPE");
console.log(JSON.stringify({ verdict: "PASS", recordCount: dataset.recordCount, researchVerdict: dataset.censusBinding.researchVerdict.verdict }));
