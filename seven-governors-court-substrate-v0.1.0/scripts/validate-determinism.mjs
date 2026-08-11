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
import { OUTPUT_NAMES } from "./substrate-builder.mjs";

const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "court-substrate-"));
const directories = {
  cleanA: path.join(temporaryRoot, "clean-a"),
  cleanB: path.join(temporaryRoot, "clean-b"),
  reordered: path.join(temporaryRoot, "reordered"),
};
for (const directory of Object.values(directories)) fs.mkdirSync(directory);

function run(args) {
  return spawnSync(
    process.execPath,
    [path.join(PACKAGE_ROOT, "scripts/build-substrate.mjs"), ...args],
    { cwd: PACKAGE_ROOT, encoding: "utf8" },
  );
}

const runs = [
  ["emit-clean-a", ["--emit", "--output-dir", directories.cleanA]],
  ["check-clean-a", ["--check", "--output-dir", directories.cleanA]],
  ["emit-clean-b", ["--emit", "--output-dir", directories.cleanB]],
  ["check-clean-b", ["--check", "--output-dir", directories.cleanB]],
  ["emit-reordered", ["--emit", "--output-dir", directories.reordered, "--test-reverse-input-order"]],
  ["check-reordered", ["--check", "--output-dir", directories.reordered, "--test-reverse-input-order"]],
].map(([name, args]) => {
  const result = run(args);
  return { name, exitCode: result.status, passed: result.status === 0 };
});
const hashes = Object.fromEntries(
  Object.entries(directories).map(([label, directory]) => [
    label,
    Object.fromEntries(
      OUTPUT_NAMES.map((name) => [name, sha256(fs.readFileSync(path.join(directory, name)))]),
    ),
  ]),
);
const installedHashes = Object.fromEntries(
  OUTPUT_NAMES.map((name) => [
    name,
    sha256(fs.readFileSync(path.join(PACKAGE_ROOT, "canonical", name))),
  ]),
);
const byteIdentical = OUTPUT_NAMES.every(
  (name) =>
    hashes.cleanA[name] === hashes.cleanB[name] &&
    hashes.cleanA[name] === hashes.reordered[name] &&
    hashes.cleanA[name] === installedHashes[name],
);
const releaseA = readJson(path.join(directories.cleanA, "substrate-registry-release.json"));
const releaseB = readJson(path.join(directories.cleanB, "substrate-registry-release.json"));
const releaseReordered = readJson(
  path.join(directories.reordered, "substrate-registry-release.json"),
);
const fingerprintsIdentical =
  releaseA.sourceFingerprint === releaseB.sourceFingerprint &&
  releaseA.sourceFingerprint === releaseReordered.sourceFingerprint &&
  releaseA.substrateFingerprint === releaseB.substrateFingerprint &&
  releaseA.substrateFingerprint === releaseReordered.substrateFingerprint;
const reorderFixture = readJson(path.join(PACKAGE_ROOT, "fixtures/reordered-input-plan.json"));
const checks = [
  {
    name: "separate-process-check-emit-check",
    status: runs.every((item) => item.passed) ? "PASS" : "FAIL",
    detail: runs,
  },
  {
    name: "two-clean-builds-byte-identical",
    status: byteIdentical ? "PASS" : "FAIL",
    detail: { outputCount: OUTPUT_NAMES.length, installedHashes },
  },
  {
    name: "reordered-input-byte-identical",
    status:
      byteIdentical && reorderFixture.expectedResult === "byte_identical_canonical_outputs"
        ? "PASS"
        : "FAIL",
    detail: {
      fixtureId: reorderFixture.fixtureId,
      reversedArrays: [...reorderFixture.reverseArrays].sort(compareCodePoint),
    },
  },
  {
    name: "source-substrate-fingerprints-identical",
    status: fingerprintsIdentical ? "PASS" : "FAIL",
    detail: {
      sourceFingerprint: releaseA.sourceFingerprint,
      substrateFingerprint: releaseA.substrateFingerprint,
    },
  },
];
const failed = checks.filter((item) => item.status === "FAIL");
const report = {
  schemaVersion: "1.0.0",
  packageVersion: "0.1.0",
  releaseId: "court-substrate:0.1.0",
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
