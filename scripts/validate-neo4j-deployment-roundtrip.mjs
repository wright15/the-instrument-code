#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import Ajv2020 from "ajv/dist/2020.js";

import { canonicalJsonBytes } from "../graph/runtime/canonical.mjs";
import { fullDatabaseEvidencePaths } from "../graph/runtime/neo4j-evidence.mjs";


const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const release = JSON.parse(fs.readFileSync(path.join(root, "provenance/release.json"), "utf8"));
const requiredEnvironment = [
  "NEO4J_URI",
  "NEO4J_USERNAME",
  "NEO4J_PASSWORD",
  "NEO4J_IMPORT_DIR",
];

function sha256Bytes(bytes) {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

function fileSha256(relativePath) {
  return sha256Bytes(fs.readFileSync(path.join(root, relativePath)));
}

function parseJsonOutput(result) {
  if (result.status !== 0 || !(result.stdout ?? "").trim()) return null;
  try {
    return JSON.parse(result.stdout);
  } catch {
    return null;
  }
}

function targetClass() {
  return process.env.NEO4J_DEPLOYMENT_TARGET_CLASS === "configured_deployment"
    ? "configured_deployment"
    : "disposable_local";
}

function runNode(script, args) {
  return spawnSync(process.execPath, [script, ...args], {
    cwd: root,
    encoding: "utf8",
    env: process.env,
  });
}

const configurationPresent = requiredEnvironment.every((name) => Object.hasOwn(process.env, name));
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "seven-governors-deployment-roundtrip-"));
const bootstrapSnapshotPath = path.join(temp, "bootstrap-snapshot.json");
const verifySnapshotPath = path.join(temp, "verify-snapshot.json");
let bootstrapResult = null;
let roundtripResult = null;
let bootstrapSnapshot = null;
let verifySnapshot = null;

try {
  if (configurationPresent) {
    bootstrapResult = runNode("scripts/bootstrap-neo4j.mjs", [
      "--roundtrip-output",
      bootstrapSnapshotPath,
    ]);
    if (bootstrapResult.status === 0 && fs.existsSync(bootstrapSnapshotPath)) {
      bootstrapSnapshot = JSON.parse(fs.readFileSync(bootstrapSnapshotPath, "utf8"));
    }
    roundtripResult = runNode("scripts/verify-neo4j-roundtrip.mjs", [
      "--output",
      verifySnapshotPath,
    ]);
    if (roundtripResult.status === 0 && fs.existsSync(verifySnapshotPath)) {
      verifySnapshot = JSON.parse(fs.readFileSync(verifySnapshotPath, "utf8"));
    }
  }

  const bootstrapPayload = bootstrapResult ? parseJsonOutput(bootstrapResult) : null;
  const roundtripPayload = roundtripResult ? parseJsonOutput(roundtripResult) : null;
  const bootstrapPassed = configurationPresent
    && bootstrapResult?.status === 0
    && bootstrapPayload?.ready === true
    && bootstrapSnapshot?.counts?.nodeCount === 3061
    && bootstrapSnapshot?.counts?.relationshipCount === 10506;
  const roundtripPassed = configurationPresent
    && roundtripResult?.status === 0
    && roundtripPayload?.verdict === "PASS"
    && verifySnapshot?.counts?.nodeCount === 3061
    && verifySnapshot?.counts?.relationshipCount === 10506;
  const byteIdentityPassed = bootstrapPassed
    && roundtripPassed
    && canonicalJsonBytes(bootstrapSnapshot).equals(canonicalJsonBytes(verifySnapshot));
  const checks = [
    {
      checkId: "configured-bootstrap",
      status: bootstrapPassed ? "PASS" : "FAIL",
      diagnostic: bootstrapPassed
        ? { nodeCount: bootstrapSnapshot.counts.nodeCount, relationshipCount: bootstrapSnapshot.counts.relationshipCount }
        : configurationPresent
          ? "bootstrap_failed"
          : "missing_neo4j_deployment_configuration",
    },
    {
      checkId: "configured-roundtrip",
      status: roundtripPassed ? "PASS" : "FAIL",
      diagnostic: roundtripPassed
        ? { snapshotFingerprint: verifySnapshot.snapshotFingerprint }
        : configurationPresent
          ? "roundtrip_failed"
          : "missing_neo4j_deployment_configuration",
    },
    {
      checkId: "bootstrap-roundtrip-byte-identity",
      status: byteIdentityPassed ? "PASS" : "FAIL",
      diagnostic: byteIdentityPassed ? true : "normalized_snapshot_mismatch",
    },
  ];
  const checksFailed = checks.filter((check) => check.status === "FAIL").length;
  const normalizedSnapshot = byteIdentityPassed
    ? {
      snapshotFingerprint: bootstrapSnapshot.snapshotFingerprint,
      namespaceFingerprints: Object.fromEntries(
        Object.entries(bootstrapSnapshot.namespaces).map(([namespace, value]) => [
          namespace,
          value.namespaceFingerprint,
        ]),
      ),
      sourceBindings: bootstrapSnapshot.sourceBindings,
      counts: bootstrapSnapshot.counts,
    }
    : null;
  const core = {
    schemaVersion: "seven-governors.neo4j-deployment-roundtrip-validation.v1",
    verdict: checksFailed === 0 ? "PASS" : "FAIL",
    releaseId: release.releaseId,
    targetClass: targetClass(),
    credentialsExcluded: true,
    checksPassed: checks.length - checksFailed,
    checksFailed,
    checks,
    normalizedSnapshot,
    evidenceBindings: fullDatabaseEvidencePaths(
      root,
      normalizedSnapshot?.sourceBindings ?? [],
    ).map((sourcePath) => ({ path: sourcePath, sha256: fileSha256(sourcePath) })),
  };
  const report = {
    ...core,
    reportFingerprint: sha256Bytes(canonicalJsonBytes(core)),
  };
  const schema = JSON.parse(fs.readFileSync(
    path.join(root, "schemas/neo4j-deployment-roundtrip-validation.schema.json"),
    "utf8",
  ));
  const validate = new Ajv2020({ strict: true, allErrors: true }).compile(schema);
  if (!validate(report)) {
    throw new Error(`deployment_roundtrip_report_schema_invalid:${JSON.stringify(validate.errors)}`);
  }
  fs.writeFileSync(
    path.join(root, "qa/neo4j-deployment-roundtrip-validation.json"),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (checksFailed > 0) process.exitCode = 1;
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
