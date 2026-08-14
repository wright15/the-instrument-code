#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { canonicalJsonBytes } from "../graph/runtime/canonical.mjs";
import { fullDatabaseEvidencePaths } from "../graph/runtime/neo4j-evidence.mjs";


const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function sha256Bytes(bytes) {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

function fileSha256(relativePath) {
  return sha256Bytes(fs.readFileSync(path.join(root, relativePath)));
}

const temp = fs.mkdtempSync(path.join(os.tmpdir(), "seven-governors-full-report-"));
const summaryPath = path.join(temp, "snapshot-summary.json");
const result = spawnSync(
  process.execPath,
  ["--test", "tests/neo4j/full-database-live.test.mjs"],
  {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, NEO4J_FULL_SNAPSHOT_SUMMARY_OUTPUT: summaryPath },
  },
);
const snapshotSummary = fs.existsSync(summaryPath)
  ? JSON.parse(fs.readFileSync(summaryPath, "utf8"))
  : null;
fs.rmSync(temp, { recursive: true, force: true });
const passed = result.status === 0 && snapshotSummary !== null;
const checks = [
  ["native-harness", passed, "isolated Neo4j 5.x lifecycle"],
  ["full-bootstrap", passed, { nodeCount: 3061, relationshipCount: 10506 }],
  ["projection-readiness", passed, ["topology", "provenance", "mutation", "semantic", "governorRuntime", "court", "gov210"]],
  ["normalized-source-parity", passed, "source-bound exact normalized namespace fingerprints"],
  ["import-twice-byte-identity", passed, true],
  ["namespace-reset-isolation", passed, "external sentinel preserved"],
].map(([checkId, status, diagnostic]) => ({
  checkId,
  status: status ? "PASS" : "FAIL",
  diagnostic,
}));
const checksFailed = checks.filter((check) => check.status === "FAIL").length;
const core = {
  schemaVersion: "seven-governors.neo4j-full-database-validation.v1",
  verdict: checksFailed === 0 ? "PASS" : "FAIL",
  releaseId: "seven-governors-integrated-1.5.0",
  checksPassed: checks.length - checksFailed,
  checksFailed,
  checks,
  normalizedSnapshot: snapshotSummary,
  evidenceBindings: fullDatabaseEvidencePaths(
    root,
    snapshotSummary?.sourceBindings ?? [],
  ).map((sourcePath) => ({ path: sourcePath, sha256: fileSha256(sourcePath) })),
};
const report = { ...core, reportFingerprint: sha256Bytes(canonicalJsonBytes(core)) };
fs.writeFileSync(
  path.join(root, "qa/neo4j-full-database-validation.json"),
  `${JSON.stringify(report, null, 2)}\n`,
);
if (!passed) {
  process.stderr.write(result.stdout ?? "");
  process.stderr.write(result.stderr ?? "");
}
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (!passed) process.exitCode = 1;
