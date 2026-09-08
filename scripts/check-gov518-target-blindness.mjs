// GOV-519 Phase 1 — target_blindness harness for the GOV-518 enumerator.
// Runs the production entry point with comparison artifacts replaced by
// null and garbage bytes and requires byte-identical class outputs, plus a
// build-twice identity run. Any mismatch fails closed and blocks Phase 2.
//
// This is a test entry point: it may stage material under qa/fixtures/ and
// drive the runner via argv/env. It never feeds file bytes into the
// enumeration; it only compares the runner's deterministic stdout.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..");
const RUNNER = "scripts/run-gov518-enumeration.mjs";

function runEnumerator(extraEnv = {}) {
  return spawnSync("node", [RUNNER, "--enumerate"], {
    encoding: "utf8",
    maxBuffer: 256 * 1024 * 1024,
    env: { ...process.env, ...extraEnv },
  });
}

const clean = runEnumerator();
if (clean.status !== 0 || !clean.stdout) {
  fs.writeFileSync(1, `${JSON.stringify({
    verdict: "FAIL",
    stage: "clean-run",
    status: clean.status,
    stderr: (clean.stderr ?? "").slice(0, 2000),
  }, null, 2)}\n`);
  process.exitCode = 1;
} else {

const blindDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "gov518-blind-"));
fs.writeFileSync(path.join(blindDirectory, "comparison-record.json"), "AAAAgarbage-bytes\0\0null\n");
fs.writeFileSync(path.join(blindDirectory, "comparison-record-copy.json"), "ZZZZdifferent-garbage\n");

const blind = runEnumerator({
  GOV518_COMPARISON_DIR: blindDirectory,
  GOV518_BLIND: "1",
});
const blindIdentical = blind.status === 0 && blind.stdout === clean.stdout;

const twice = runEnumerator();
const twiceIdentical = twice.status === 0 && twice.stdout === clean.stdout;

fs.rmSync(blindDirectory, { recursive: true, force: true });

const report = {
  verdict: blindIdentical && twiceIdentical ? "PASS" : "FAIL",
  bytes: Buffer.byteLength(clean.stdout, "utf8"),
  blindIdentical,
  twiceIdentical,
  blindStatus: blind.status,
  twiceStatus: twice.status,
  blindStderr: blindIdentical ? "" : (blind.stderr ?? "").slice(0, 1000),
};

fs.writeFileSync(1, `${JSON.stringify(report, null, 2)}\n`);
process.exitCode = report.verdict !== "PASS" ? 1 : 0;
}
