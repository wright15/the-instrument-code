import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import {
  PACKAGE_ROOT,
  canonicalJson,
  compareCodePoint,
  readJson,
  sha256,
  writeAtomic,
} from "./lib.mjs";

const outputNames = [
  "canonical-bridge-examples.json",
  "feature-typed-aspect-crosswalk.json",
  "policy-release.json",
];
const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "governor-runtime-"));
const directories = {
  cleanA: path.join(temporaryRoot, "clean-a"),
  cleanB: path.join(temporaryRoot, "clean-b"),
  reordered: path.join(temporaryRoot, "reordered"),
};
for (const directory of Object.values(directories)) fs.mkdirSync(directory);

function run(args) {
  return spawnSync(process.execPath, [path.join(PACKAGE_ROOT, "scripts/build-policy.mjs"), ...args], {
    cwd: PACKAGE_ROOT,
    encoding: "utf8",
  });
}

const runs = [
  ["emit-clean-a", ["--emit", "--output-dir", directories.cleanA]],
  ["check-clean-a", ["--check", "--output-dir", directories.cleanA]],
  ["emit-clean-b", ["--emit", "--output-dir", directories.cleanB]],
  ["check-clean-b", ["--check", "--output-dir", directories.cleanB]],
  [
    "emit-reordered",
    ["--emit", "--output-dir", directories.reordered, "--test-reverse-input-order"],
  ],
  [
    "check-reordered",
    ["--check", "--output-dir", directories.reordered, "--test-reverse-input-order"],
  ],
].map(([name, args]) => {
  const result = run(args);
  return { name, exitCode: result.status, passed: result.status === 0 };
});

const hashes = Object.fromEntries(
  Object.entries(directories).map(([label, directory]) => [
    label,
    Object.fromEntries(
      outputNames.map((name) => [name, sha256(fs.readFileSync(path.join(directory, name)))]),
    ),
  ]),
);
const installedHashes = Object.fromEntries(
  outputNames.map((name) => [
    name,
    sha256(fs.readFileSync(path.join(PACKAGE_ROOT, "canonical", name))),
  ]),
);
const byteIdentical = outputNames.every(
  (name) =>
    hashes.cleanA[name] === hashes.cleanB[name] &&
    hashes.cleanA[name] === hashes.reordered[name] &&
    hashes.cleanA[name] === installedHashes[name],
);
const reorderFixture = readJson(
  path.join(PACKAGE_ROOT, "fixtures/reordered-input-plan.json"),
);
const policyA = readJson(path.join(directories.cleanA, "policy-release.json"));
const policyB = readJson(path.join(directories.cleanB, "policy-release.json"));
const policyReordered = readJson(path.join(directories.reordered, "policy-release.json"));
const fingerprintIdentical =
  policyA.sourceFingerprint === policyB.sourceFingerprint &&
  policyA.sourceFingerprint === policyReordered.sourceFingerprint &&
  policyA.policyFingerprint === policyB.policyFingerprint &&
  policyA.policyFingerprint === policyReordered.policyFingerprint;

const checks = [
  {
    name: "separate-process-check-emit-check",
    status: runs.every((item) => item.passed) ? "PASS" : "FAIL",
    detail: runs,
  },
  {
    name: "two-clean-builds-byte-identical",
    status: byteIdentical ? "PASS" : "FAIL",
    detail: { outputCount: outputNames.length, installedHashes },
  },
  {
    name: "reordered-input-byte-identical",
    status:
      byteIdentical &&
      reorderFixture.expectedResult === "byte_identical_canonical_outputs"
        ? "PASS"
        : "FAIL",
    detail: {
      fixtureId: reorderFixture.fixtureId,
      reversedArrays: [...reorderFixture.reverseArrays].sort(compareCodePoint),
    },
  },
  {
    name: "source-policy-fingerprints-identical",
    status: fingerprintIdentical ? "PASS" : "FAIL",
    detail: {
      sourceFingerprint: policyA.sourceFingerprint,
      policyFingerprint: policyA.policyFingerprint,
    },
  },
];
const failed = checks.filter((item) => item.status === "FAIL");
const report = {
  schemaVersion: "1.0.0",
  packageVersion: "0.1.0",
  releaseId: "governor-runtime:0.1.0",
  status: failed.length ? "failed" : "passed",
  summary: {
    checks: checks.length,
    passed: checks.length - failed.length,
    failed: failed.length,
  },
  checks,
};
writeAtomic(path.join(PACKAGE_ROOT, "qa/determinism-report.json"), canonicalJson(report));
fs.rmSync(temporaryRoot, { recursive: true, force: true });
console.log(JSON.stringify({ status: report.status, summary: report.summary }));
if (failed.length) process.exitCode = 1;
