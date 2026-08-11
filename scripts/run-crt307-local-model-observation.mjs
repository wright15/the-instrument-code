#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const traceRoot = path.join(root, "tests", "crt_307", "traces");

function parseArgs(argv) {
  const options = {endpoint: process.env.CRT307_LOCAL_MODEL_ENDPOINT, model: null, output: null};
  for (let index = 0; index < argv.length; index += 1) {
    const option = argv[index];
    if (option === "--endpoint") options.endpoint = argv[++index];
    else if (option === "--model") options.model = argv[++index];
    else if (option === "--output") options.output = argv[++index];
    else throw new Error(`unknown_argument:${option}`);
  }
  if (!options.endpoint) throw new Error("local_model_endpoint_required");
  const endpoint = new URL(options.endpoint);
  if (!["localhost", "127.0.0.1", "::1"].includes(endpoint.hostname)) {
    throw new Error("local_model_endpoint_must_be_loopback");
  }
  return {...options, endpoint: endpoint.toString().replace(/\/$/, "")};
}

async function loadTraces() {
  const names = (await fs.readdir(traceRoot)).filter((name) => name.endsWith(".json")).sort();
  const traces = [];
  for (const name of names) {
    const trace = JSON.parse(await fs.readFile(path.join(traceRoot, name), "utf8"));
    traces.push({
      traceId: trace.traceId,
      setup: trace.setup,
      steps: trace.steps,
      expectedFinal: trace.expectedFinal,
    });
  }
  return traces;
}

function expectedDecisions(traces) {
  return Object.fromEntries(
    traces.map((trace) => [
      trace.traceId,
      trace.steps.map((step) => step.expect),
    ]),
  );
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`local_model_http_${response.status}`);
  return response.json();
}

const options = parseArgs(process.argv.slice(2));
const models = await requestJson(`${options.endpoint}/v1/models`);
const model = options.model ?? models.data?.[0]?.id;
if (typeof model !== "string" || model.length === 0) throw new Error("local_model_not_found");
const traces = await loadTraces();
const expected = expectedDecisions(traces);
const completion = await requestJson(`${options.endpoint}/v1/chat/completions`, {
  method: "POST",
  headers: {"content-type": "application/json"},
  body: JSON.stringify({
    model,
    temperature: 0,
    max_tokens: 1200,
    chat_template_kwargs: {enable_thinking: false},
    messages: [
      {
        role: "system",
        content: "You are evaluating deterministic Court agent traces. Use only supplied machine records. Never invent state, evidence, tokens, routes, or success. Return compact JSON only.",
      },
      {
        role: "user",
        content: `For each trace, return an array containing exactly each step.expect object, preserving values and adding nothing. Key the result by traceId. Records: ${JSON.stringify(traces)}`,
      },
    ],
  }),
});
const content = completion.choices?.[0]?.message?.content;
let actual;
try {
  actual = JSON.parse(content);
} catch {
  actual = null;
}
const checks = Object.keys(expected).sort().map((traceId) => ({
  traceId,
  pass: JSON.stringify(actual?.[traceId]) === JSON.stringify(expected[traceId]),
}));
const report = {
  schemaVersion: "crt-307.local-model-observation.v1",
  verdict: checks.every((check) => check.pass) ? "PASS" : "FAIL",
  endpointClass: "loopback-openai-compatible",
  model,
  thinkingDisabled: true,
  temperature: 0,
  traceCount: traces.length,
  checks,
  canonicalFingerprintExcluded: true,
};
const serialized = `${JSON.stringify(report, null, 2)}\n`;
if (options.output) await fs.writeFile(path.resolve(options.output), serialized);
process.stdout.write(serialized);
if (report.verdict !== "PASS") process.exitCode = 1;
