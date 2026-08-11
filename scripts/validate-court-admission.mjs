#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import Ajv2020 from "ajv/dist/2020.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function canonical(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
}

const sha = (value) => crypto.createHash("sha256").update(canonical(value)).digest("hex");
const fileSha = async (relativePath) => crypto.createHash("sha256").update(await fs.readFile(path.join(root, relativePath))).digest("hex");
const readJson = async (relativePath) => JSON.parse(await fs.readFile(path.join(root, relativePath), "utf8"));

function run(command, args) {
  const result = spawnSync(command, args, {cwd: root, encoding: "utf8"});
  if (result.status !== 0) {
    process.stderr.write(result.stdout ?? "");
    process.stderr.write(result.stderr ?? "");
  }
  return result.status === 0;
}

const suiteResults = {
  substrate: run("npm", ["run", "validate:court-substrate", "--silent"]),
  invariants: run("npm", ["run", "validate:harmonic-invariants", "--silent"]),
  filters: run("npm", ["run", "validate:court-filter-algebra", "--silent"]),
  runtime: run("npm", ["run", "validate:court-runtime", "--silent"]),
  graph: run("npm", ["run", "test:court-graph", "--silent"]),
  skills: run("npm", ["run", "validate:court-skills", "--silent"]),
  vault: run("npm", ["run", "validate:vault-context", "--silent"]),
  phase4: run("python3", ["scripts/run-phase4-verification.py", "--output", "qa/phase4-verification.json", "--run-integration"]),
  benchmark: run("npm", ["run", "benchmark:court-admission", "--silent"]),
};
suiteResults.admissionBuild = Object.values(suiteResults).every(Boolean)
  ? run("npm", ["run", "build:court-admission", "--silent"])
  : false;

let admissionRecordValid = false;
let artifactBindingsValid = false;
let evidenceBindingsValid = false;
let scopeValid = false;
let privacyValid = false;
if (suiteResults.admissionBuild) {
  const schema = await readJson("schemas/court-admission/court-admission-release.schema.json");
  const admission = await readJson("provenance/court-admission-release.json");
  const validate = new Ajv2020({strict: true, allErrors: true}).compile(schema);
  const core = Object.fromEntries(Object.entries(admission).filter(([key]) => key !== "admissionFingerprint"));
  admissionRecordValid = validate(admission) && admission.admissionFingerprint === sha(core);
  const bindingResults = await Promise.all(
    admission.artifactBindings.map(async (binding) => (await fileSha(binding.path)) === binding.sha256),
  );
  artifactBindingsValid = bindingResults.every(Boolean);
  const evidenceResults = await Promise.all(
    admission.evidenceBindings.map(async (binding) => {
      const report = await readJson(binding.path);
      return report.reportFingerprint === binding.reportFingerprint;
    }),
  );
  evidenceBindingsValid = evidenceResults.every(Boolean);
  scopeValid =
    admission.admittedScope.canonicalRootedPositions.length === 5 &&
    admission.admittedScope.bridgeSetClasses.join(",") === "5-23,5-27" &&
    admission.admittedScope.minimalAdditionalBridgeSetClasses.length === 0 &&
    admission.admittedScope.linearDiagonalFilters.length === 7 &&
    admission.proposedScope.pentatonicSetClassCount === 35 &&
    admission.proposedScope.pentatonicSetClasses.length === 35;
  const privacyText = JSON.stringify({
    admission,
    gov208: await readJson("qa/gov-208-vault-context-validation.json"),
    crt308: await readJson("qa/crt-308-court-vault-context-validation.json"),
    benchmark: await readJson("qa/court-admission-benchmark.json"),
  });
  privacyValid = !["/home/", "/Users/", ".obsidian", ".session.json", "private note", "secret marker"].some((marker) => privacyText.includes(marker));
}

const all = (...keys) => keys.every((key) => suiteResults[key] === true);
const checkSpecs = [
  ["CRT-301-AC", scopeValid, ["schemas/court-admission-contract.json"], "namespace and narrow-scope admission contract"],
  ["CRT-302-AC", suiteResults.substrate, ["court-substrate fixtures"], "38-class registry with C0-C4 and bridge closure"],
  ["CRT-303-AC", suiteResults.invariants, ["Carey 5-35", "Court Gram/Hamming invariants"], "exact invariant reproduction"],
  ["CRT-304-AC", suiteResults.filters, ["commutation-table", "bridge-route-comparison"], "linear diagonal filter algebra"],
  ["CRT-305-AC", suiteResults.runtime, ["adjacency", "translocation", "tamper", "kappa namespace"], "runtime replay and transition gates"],
  ["CRT-306-AC", all("graph", "phase4"), ["projection-v2", "native-live-neo4j"], "rebuildable bounded read projection"],
  ["CRT-307-AC", suiteResults.skills, ["eight Court traces", "explicit-target installer"], "five replay-bound Court skills"],
  ["CRT-308-AC", suiteResults.vault, ["synthetic-vault", "false-admission", "context-free parity"], "read-only private-data-safe Court context"],
  ["CRT-309-AC-1", all("admissionBuild", "phase4"), ["one-command validator"], "deterministic validator cascade"],
  ["CRT-309-AC-2", all("substrate", "invariants", "filters", "runtime", "graph", "skills", "vault"), ["integrated Court corpus"], "end-to-end Court evidence"],
  ["CRT-309-AC-3", suiteResults.benchmark, ["ten-case shared benchmark"], "machine-scored model/retrieval/tool rates"],
  ["CRT-309-AC-4", suiteResults.phase4, ["native-live-neo4j", "neo4j-unavailable"], "live parity and provider independence"],
  ["CRT-309-AC-5", privacyValid, ["admission-output privacy scan"], "no live state, private path, or raw vault content"],
  ["CRT-309-AC-6", scopeValid, ["court-admission-release.json"], "admitted and proposed scope explicit"],
  ["CRT-309-AC-7", admissionRecordValid, ["court-admission-release.json"], "separate admission gate preserves historical candidates"],
  ["EPIC-003-SC-1..6", all("substrate", "invariants", "filters", "runtime", "skills"), ["package and runtime suites"], "namespace, substrate, invariant, filter, transition, and loop safety"],
  ["EPIC-003-SC-7..9", all("graph", "skills", "vault", "phase4"), ["projection", "skills", "vault"], "projection, agent, and context safety"],
  ["EPIC-003-SC-10", artifactBindingsValid && evidenceBindingsValid, ["artifact and evidence bindings"], "release identity closure"],
];
const checks = checkSpecs.map(([criterionId, passed, fixtureIds, evidence]) => ({
  criterionId,
  status: passed ? "PASS" : "FAIL",
  fixtureIds,
  evidence,
}));
const checksPassed = checks.filter((check) => check.status === "PASS").length;
const checksFailed = checks.length - checksPassed;
const core = {
  schemaVersion: "crt-309.court-admission-validation.v1",
  verdict: checksFailed === 0 ? "PASS" : "FAIL",
  admissionId: "court-admission:crt-309:1.0.0",
  checksPassed,
  checksFailed,
  checks,
};
const report = {...core, reportFingerprint: sha(core)};
await fs.writeFile(path.join(root, "qa/court-admission-validation.json"), `${JSON.stringify(report, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (checksFailed > 0) process.exitCode = 1;
