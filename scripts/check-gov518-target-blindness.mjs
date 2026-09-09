// GOV-519 pre-flight harness — ordered wrapper for the GOV-518 execution
// path. Stage order: (1) checker incl. unconditional adversarial self-test →
// (2) decoy/tamper suite → (3) in-memory live suite → (4) target-blindness
// control (enumeration-stage output with comparison artifacts present vs
// absent/unreadable; digest equality; digests only, never content) → (5)
// handoff state. Any detector red = pre-flight red = enumeration never
// starts (CR-7).
//
// Read surface (deny-by-default): this harness reads only the enumerator
// source (to stage temp copies under os.tmpdir), the committed decoy corpus
// and structural allowlist (via the checker/live-suite subprocesses), and
// subprocess pipes. It never reads canonical observation artifacts itself;
// canonical bytes are touched only inside the live-suite module (suite-scoped
// per CR-6), and only in memory. No RNG is used anywhere (temp names derive
// from the process id plus a counter). Captures the D8 environment pin.

import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { loadLiveNeedles, scanSurface } from "../tests/gov_518/gov518-live-suite.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..");
const CHECKER = "scripts/verify-gov518-boundary.mjs";
const LIVE_SUITE = "tests/gov_518/gov518-live-suite.mjs";
const RUNNER = "scripts/run-gov518-enumeration.mjs";
const TAMPER_REFS = [
  "qa/fixtures/gov-518/tamper-01-observation-sequence.json",
  "qa/fixtures/gov-518/tamper-02-contact-signature.json",
  "qa/fixtures/gov-518/tamper-03-position-masks.json",
  "qa/fixtures/gov-518/tamper-04-scalar-reordering.json",
];

function sha256Hex(text) {
  return crypto.createHash("sha256").update(text, "utf8").digest("hex");
}

function spawnNode(args, extraEnv = {}) {
  return spawnSync("node", args, {
    encoding: "utf8",
    maxBuffer: 256 * 1024 * 1024,
    env: { ...process.env, ...extraEnv },
  });
}

function tryParseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function environmentPin() {
  const python = spawnSync("python3", ["--version"], { encoding: "utf8" });
  return {
    node: process.version,
    platform: process.platform,
    arch: process.arch,
    python: (python.stdout ?? python.stderr ?? "").trim(),
    timeoutSeconds: 60,
    orbitBound: 60028,
    boundary: "GOV-518",
  };
}

let tempCounter = 0;
function tempPath(prefix) {
  tempCounter += 1;
  return path.join(os.tmpdir(), `${prefix}-${process.pid}-${tempCounter}.mjs`);
}

// Stage 1 — checker (self-test unconditional inside the checker).
function stageChecker() {
  const child = spawnNode([CHECKER]);
  const report = tryParseJson(child.stdout ?? "");
  const passed = child.status === 0 && report?.verdict === "PASS";
  return {
    stage: "checker",
    passed,
    status: child.status,
    verdict: report?.verdict ?? null,
    selfTest: report?.production?.[0]?.selfTest ?? null,
    stderr: passed ? "" : (child.stderr ?? "").slice(0, 500),
  };
}

// Stage 2 — decoy/tamper suite. Each decoy planted into a temp enumerator
// copy must be rejected by the checker; each archived tamper fixture (read
// from git history into memory only, never written to disk) must match the
// in-memory live scan when spliced into the enumerator surface.
function stageDecoyTamper() {
  const enumeratorText = fs.readFileSync(path.join(root, RUNNER), "utf8");
  const decoyNames = fs.readdirSync(path.join(root, "tests/gov_518"))
    .filter((name) => name.startsWith("decoy-") && name.endsWith(".json"))
    .sort();
  const decoyResults = [];
  for (const name of decoyNames) {
    const decoy = JSON.parse(fs.readFileSync(path.join(root, "tests/gov_518", name), "utf8"));
    const plant = `${enumeratorText}\n// harness decoy plant ${decoy.needles[0]}\nconst __gov519HarnessPlant = ${decoy.numericNeedles[0]};\n`;
    const staged = tempPath("gov519-harness-decoy");
    let rejected = false;
    try {
      fs.writeFileSync(staged, plant, "utf8");
      const child = spawnNode([CHECKER, "--target", staged]);
      rejected = child.status !== 0;
    } finally {
      fs.rmSync(staged, { force: true });
    }
    decoyResults.push({ fixture: `tests/gov_518/${name}`, family: decoy.family, rejected });
  }
  let liveNeedles = null;
  try {
    liveNeedles = loadLiveNeedles();
  } catch {
    liveNeedles = null;
  }
  const tamperResults = [];
  for (const ref of TAMPER_REFS) {
    const shown = spawnSync("git", ["show", `HEAD:${ref}`], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
    const archived = shown.status === 0 ? shown.stdout : "";
    let matchedKinds = [];
    if (liveNeedles && archived.length > 0) {
      const spliced = `${enumeratorText}\n${archived}\n`;
      matchedKinds = [...new Set(scanSurface(spliced, liveNeedles.needles).map((m) => m.kind))].sort();
    }
    tamperResults.push({ fixture: ref, archivedBytes: archived.length, rejected: matchedKinds.length > 0, kinds: matchedKinds });
  }
  const passed = decoyResults.every((r) => r.rejected)
    && tamperResults.every((r) => r.rejected)
    && liveNeedles !== null;
  return { stage: "decoy-tamper-suite", passed, decoys: decoyResults, tampers: tamperResults };
}

// Stage 3 — in-memory live suite (subprocess; persists nothing).
function stageLiveSuite() {
  const before = spawnSync("git", ["status", "--short"], { encoding: "utf8" }).stdout ?? "";
  const child = spawnNode([LIVE_SUITE]);
  const report = tryParseJson(child.stdout ?? "");
  const after = spawnSync("git", ["status", "--short"], { encoding: "utf8" }).stdout ?? "";
  const passed = child.status === 0 && report?.verdict === "PASS";
  return {
    stage: "live-suite",
    passed,
    status: child.status,
    verdict: report?.verdict ?? null,
    persistedFiles: report?.persistedFiles ?? null,
    worktreeUnchanged: before === after,
  };
}

// Stage 4 — target-blindness control. Enumeration-stage output under three
// comparison-artifact conditions (present garbage / absent / unreadable);
// digest equality over the outputs; digests only, never content. When the
// pre-flight gate is red the entry point must block identically in every
// condition (fail-closed, content-free); when green the outputs must be
// byte-identical. Either way the digests must agree.
function stageBlindness() {
  const runOnce = (extraEnv) => {
    const child = spawnNode([RUNNER, "--enumerate"], extraEnv);
    return {
      status: child.status,
      stdoutDigest: sha256Hex(child.stdout ?? ""),
      stderrDigest: sha256Hex(child.stderr ?? ""),
      stdoutBytes: Buffer.byteLength(child.stdout ?? "", "utf8"),
    };
  };
  const clean = runOnce({});
  const stagedDir = fs.mkdtempSync(path.join(os.tmpdir(), "gov519-blind-"));
  fs.writeFileSync(path.join(stagedDir, "comparison-record.json"), "AAAAgarbage-bytes\0\0null\n");
  const present = runOnce({ GOV518_COMPARISON_DIR: stagedDir, GOV518_BLIND: "1" });
  const absent = runOnce({ GOV518_COMPARISON_DIR: path.join(stagedDir, "does-not-exist"), GOV518_BLIND: "1" });
  const unreadablePath = path.join(stagedDir, "comparison-unreadable.json");
  fs.writeFileSync(unreadablePath, "ZZZZdifferent-garbage\n");
  try {
    fs.chmodSync(unreadablePath, 0o000);
  } catch {
    // Best effort; the absent condition already covers unreadability.
  }
  const unreadable = runOnce({ GOV518_COMPARISON_DIR: unreadablePath, GOV518_BLIND: "1" });
  fs.rmSync(stagedDir, { recursive: true, force: true });
  const digests = [clean, present, absent, unreadable].map((r) => `${r.status}:${r.stdoutDigest}:${r.stderrDigest}`);
  const identical = digests.every((d) => d === digests[0]);
  return {
    stage: "target-blindness",
    passed: identical,
    identical,
    conditions: { clean, present, absent, unreadable },
  };
}

const checker = stageChecker();
const decoyTamper = stageDecoyTamper();
const live = stageLiveSuite();
const blindness = stageBlindness();
const pin = environmentPin();

const blocked = !checker.passed || !decoyTamper.passed || !live.passed || !blindness.passed;
const report = {
  verdict: blocked ? "FAIL" : "PASS",
  boundary: "GOV-518 R7",
  handoff: blocked ? "BLOCKED" : "READY",
  handoffReason: blocked
    ? "pre-flight red: enumeration never starts (CR-7 fail-closed)"
    : "pre-flight green: single production run authorized at GOV-520 only",
  stages: { checker, decoyTamper, live, blindness },
  environment: pin,
  readSurface: [
    "scripts/run-gov518-enumeration.mjs",
    "tests/gov_518/decoy-*.json",
    "tests/gov_518/structural-allowlist.json",
    "subprocess pipes only (checker, live suite, runner digests)",
    "archived tamper bytes via git-show pipe (memory only, never disk)",
  ],
  rng: "none",
};

fs.writeFileSync(1, `${JSON.stringify(report, null, 2)}\n`);
process.exitCode = blocked ? 1 : 0;
