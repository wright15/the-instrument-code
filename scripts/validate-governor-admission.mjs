#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
function canonical(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
}
const sha = (value) => crypto.createHash("sha256").update(canonical(value)).digest("hex");
function run(cwd, command, args) {
  const result = spawnSync(command, args, {cwd: path.join(root, cwd), encoding: "utf8"});
  if (result.status !== 0) process.stderr.write(`${result.stdout ?? ""}${result.stderr ?? ""}`);
  return result.status === 0;
}

const pythonFiles = [
  "tests/test_gov_203_classifier.py",
  "tests/test_gov_204_projections.py",
  "tests/test_gov_204_transitions.py",
  "tests/test_gov_205_evidence.py",
  "tests/test_gov_205_lifecycle.py",
  "tests/test_gov_205_loop_guards.py",
  "tests/test_gov_205_start_site.py",
  "tests/test_gov_206_runtime_export.py",
  "tests/test_gov_207_agent_api.py",
  "tests/test_gov_207_dynamic_menu.py",
  "tests/test_gov_207_outcomes.py",
  "tests/test_gov_208_vault_context.py",
];
const results = {
  package: run("seven-governors-governor-runtime-v0.1.0", "npm", ["run", "validate", "--silent"]),
  runtime: run(".", "python3", ["-m", "pytest", "-p", "no:cacheprovider", "-q", ...pythonFiles]),
  graphSnapshot: run(".", "npm", ["run", "test:gov206", "--silent"]),
  graphLive: run(".", "npm", ["run", "test:gov206:neo4j", "--silent"]),
  vault: run(".", "npm", ["run", "validate:vault-context", "--silent"]),
  benchmark: run(".", "node", ["scripts/run-governor-admission-benchmark.mjs"]),
};
const specs = [
  ["GOV-201..203", results.package && results.runtime, ["typed contracts", "classification fixtures"], "namespace and deterministic classification"],
  ["GOV-204", results.runtime, ["transition and ledger fixtures"], "validated transition and tamper closure"],
  ["GOV-205", results.runtime, ["evidence, cleanup, loop fixtures"], "evidence-backed success and deterministic stopping"],
  ["GOV-206", results.graphSnapshot && results.graphLive, ["snapshot/file/native Neo4j"], "bounded read projection parity"],
  ["GOV-207", results.runtime, ["five-skill traces"], "closed agent API behavior"],
  ["GOV-208", results.vault, ["synthetic vault and privacy"], "optional context-free parity"],
  ["GOV-209-AC-3", results.benchmark, ["eight-case shared corpus"], "machine-scored four-configuration benchmark"],
];
const checks = specs.map(([criterionId, passed, fixtureIds, evidence]) => ({criterionId, status: passed ? "PASS" : "FAIL", fixtureIds, evidence}));
const checksPassed = checks.filter((item) => item.status === "PASS").length;
const checksFailed = checks.length - checksPassed;
const core = {
  schemaVersion: "gov-209.runtime-validation.v1",
  verdict: checksFailed === 0 ? "PASS" : "FAIL",
  integratedReleaseId: "seven-governors-integrated-1.3.0",
  checksPassed,
  checksFailed,
  checks,
};
const report = {...core, reportFingerprint: sha(core)};
await fs.writeFile(path.join(root, "qa/governor-runtime-validation.json"), `${JSON.stringify(report, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (checksFailed > 0) process.exitCode = 1;
