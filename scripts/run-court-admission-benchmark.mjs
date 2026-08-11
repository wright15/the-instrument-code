#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function canonical(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
}

const sha = (value) => crypto.createHash("sha256").update(canonical(value)).digest("hex");
const corpus = JSON.parse(await fs.readFile(path.join(root, "tests/crt_309/benchmark-corpus.json"), "utf8"));
const configurations = ["model-only", "retrieval-only", "deterministic-court-tools"];
const metrics = ["success", "offChainRejection", "nonAdjacentRejection", "filterNonCommutation", "repeatedActionStop", "recovery"];

const results = configurations.map((configurationId) => {
  const rates = {};
  for (const metric of metrics) {
    const cases = corpus.cases.filter((item) => item.metric === metric);
    rates[metric] = cases.filter((item) => item.outcomes[configurationId] === true).length / cases.length;
  }
  return {configurationId, caseCount: corpus.cases.length, rates};
});

const core = {
  schemaVersion: "crt-309.court-benchmark-report.v1",
  corpusFingerprint: sha(corpus),
  authorityRuling: "machine-verifiable-outcomes-only; model prose scores no success",
  configurations: results,
};
const report = {...core, reportFingerprint: sha(core)};
await fs.writeFile(path.join(root, "qa/court-admission-benchmark.json"), `${JSON.stringify(report, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
