#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import { buildBundle, OUTPUT_PATH } from "./build-orrery-taxonomy-read-model.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bundle = JSON.parse(fs.readFileSync(path.join(root, OUTPUT_PATH), "utf8"));
const schema = JSON.parse(fs.readFileSync(path.join(root, "schemas/harmonic-orrery-taxonomy-read-model.schema.json"), "utf8"));
const validate = new Ajv2020({ strict: false }).compile(schema);
if (!validate(bundle)) throw new Error(`INVALID_TAXONOMY_READ_MODEL_SCHEMA:${JSON.stringify(validate.errors)}`);
if (JSON.stringify(bundle) !== JSON.stringify(buildBundle(root))) throw new Error("TAXONOMY_READ_MODEL_SOURCE_DRIFT");
if (bundle.records.some((record, index) => index && record.sourceOrder <= bundle.records[index - 1].sourceOrder)) throw new Error("TAXONOMY_READ_MODEL_ORDER");
if (bundle.records.some((record) => record.office === null ? record.officeStatus !== "withheld" : record.officeStatus !== "available")) throw new Error("TAXONOMY_READ_MODEL_OFFICE_STATUS");
console.log(JSON.stringify({ verdict: "PASS", recordCount: bundle.recordCount }));
