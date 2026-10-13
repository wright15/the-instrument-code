#!/usr/bin/env node
/**
 * Tests for the advisory evidence-binding validator
 * (scripts/validate-evidence-bindings.mjs, CONV-EVIDENCE-BINDING-001 section
 * 3.2). Pure selector/classifier checks plus an advisory CLI smoke test.
 */
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { canonicalText } from "./verify-phase-a-proposals.mjs";
import {
  classifyFirstAppearance,
  enforcementOf,
  strictExitCode,
  verifyGeneratorProvenance,
  verifyPayloadReference,
  verifyRecipe,
  verifySpanBinding,
} from "./validate-evidence-bindings.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..");
const sha256 = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");

const spanSource = Buffer.from("## ENTRY 1 - one\nbody one\n## ENTRY 2 - two\nbody two\n", "utf8");

function spanBindingFor(bytes, entryIds) {
  const firstHeading = `## ${entryIds[0]}`;
  const offset = bytes.indexOf(firstHeading);
  const length = bytes.length - offset;
  return {
    artifactPath: "provenance/DECISION_LEDGER.md",
    entryIds,
    spanByteOffset: offset,
    spanByteLength: length,
    spanPrefixSha256: sha256(bytes.subarray(0, offset + length)),
  };
}

test("verifySpanBinding accepts a faithful entry-scoped span", () => {
  const binding = spanBindingFor(spanSource, ["ENTRY 2"]);
  assert.deepEqual(verifySpanBinding(binding, spanSource), []);
  const full = { ...spanBindingFor(spanSource, ["ENTRY 1", "ENTRY 2"]), spanByteOffset: 0 };
  full.spanByteLength = spanSource.length;
  full.spanPrefixSha256 = sha256(spanSource.subarray(0, full.spanByteOffset + full.spanByteLength));
  assert.deepEqual(verifySpanBinding(full, spanSource), []);
});

test("verifySpanBinding fails loud on tampered prefix, bounds, and missing entries", () => {
  const binding = spanBindingFor(spanSource, ["ENTRY 2"]);
  assert.match(verifySpanBinding({ ...binding, spanPrefixSha256: "0".repeat(64) }, spanSource).join("; "), /spanPrefixSha256 mismatch/);
  assert.match(verifySpanBinding({ ...binding, spanByteLength: spanSource.length + 1 }, spanSource).join("; "), /exceeds the source/);
  assert.match(verifySpanBinding({ ...binding, spanByteOffset: -1 }, spanSource).join("; "), /spanByteOffset/);
  assert.match(verifySpanBinding({ ...binding, entryIds: ["ENTRY 1"] }, spanSource).join("; "), /ENTRY 1.*not found/);
  assert.match(verifySpanBinding({ ...binding, artifactPath: "/etc/passwd" }, spanSource).join("; "), /artifactPath/);
});

test("classifyFirstAppearance maps the content-located boundary", () => {
  assert.equal(classifyFirstAppearance("cut", "cut", () => false), "at-cut");
  assert.equal(classifyFirstAppearance("older", "cut", () => true), "pre-cut");
  assert.equal(classifyFirstAppearance("newer", "cut", () => false), "post-cut");
  assert.equal(classifyFirstAppearance(null, "cut", () => true), "unresolved");
  assert.equal(classifyFirstAppearance("older", null, () => true), "unresolved");
  assert.equal(enforcementOf("pre-cut"), "advisory");
  assert.equal(enforcementOf("at-cut"), "enforced");
  assert.equal(enforcementOf("post-cut"), "enforced");
  assert.equal(enforcementOf("unresolved"), "enforced");
});

test("strictExitCode enforces only at/post-cut and unresolved findings", () => {
  assert.equal(strictExitCode([{ enforcement: "advisory" }]), 0);
  assert.equal(strictExitCode([{ enforcement: "advisory" }, { enforcement: "enforced" }]), 1);
  assert.equal(strictExitCode([]), 0);
});

test("verifyGeneratorProvenance requires path, digest, arguments and timestamp", () => {
  assert.deepEqual(verifyGeneratorProvenance({}), [
    "no generator provenance record (expected generator path, script digest at emit time, invocation arguments, timestamp)",
  ]);
  const pathOnly = verifyGeneratorProvenance({ generator: "scripts/build-x.mjs" });
  assert.equal(pathOnly.length, 1);
  assert.match(pathOnly[0], /script digest at emit time, invocation arguments, timestamp/);
  assert.deepEqual(verifyGeneratorProvenance({
    generator: "scripts/build-x.mjs",
    generatorDigest: "a".repeat(64),
    invocationArgs: ["--check"],
    timestamp: "2026-10-12T00:00:00.000Z",
  }), []);
});

test("verifyPayloadReference recomputes the canonical fingerprint", () => {
  const core = { alpha: 1, beta: ["x", "y"] };
  const fingerprint = sha256(Buffer.from(canonicalText(core), "utf8"));
  const payload = { ...core, payloadFingerprint: fingerprint };
  const reference = { path: "qa/fixture.json", fingerprintField: "payloadFingerprint" };
  assert.deepEqual(verifyPayloadReference(reference, () => payload), []);
  const drifted = { ...payload, alpha: 2 };
  assert.match(verifyPayloadReference(reference, () => drifted).join("; "), /fingerprint drift/);
  assert.match(verifyPayloadReference(reference, () => ({ beta: [] })).join("; "), /payload field payloadFingerprint missing/);
});

test("verifyRecipe validates declared shape without probing git", () => {
  const recipe = {
    algorithm: "SHA-256",
    input: "exact selected raw bytes",
    outputEncoding: "lowercase hexadecimal",
    implementation: { path: "scripts/manifest-utils.mjs", range: { startLine: 31, endLine: 37 }, blobOid: "6f761dbecc620e4679dccae3d4ef8ca82e3a4833" },
  };
  assert.deepEqual(verifyRecipe("raw-bytes-sha256", recipe, null), []);
  assert.match(verifyRecipe("raw-bytes-sha256", { ...recipe, implementation: { ...recipe.implementation, blobOid: "xyz" } }, null).join("; "), /blobOid/);
  assert.match(verifyRecipe("raw-bytes-sha256", { ...recipe, algorithm: "" }, null).join("; "), /algorithm/);
});

test("advisory CLI runs, reports, and exits 0", () => {
  const result = spawnSync(process.execPath, [path.join(scriptDirectory, "validate-evidence-bindings.mjs"), "--json"], {
    cwd: root,
    encoding: "utf8",
  });
  assert.equal(result.status, 0);
  const report = JSON.parse(result.stdout);
  assert.equal(report.conventionId, "CONV-EVIDENCE-BINDING-001");
  assert.equal(report.mode, "advisory");
  assert.equal(report.cutLine.resolved, true);
  assert.ok(report.recipes.includes("raw-bytes-sha256"));
  assert.ok(report.registry.all.includes("qa/d4-r2-execution-receipt-ledger-binding.json"));
  const r1 = report.checks.filter((check) => check.rule === "R1");
  assert.ok(r1.length >= 2);
  assert.ok(r1.every((check) => check.status === "PASS"));
  const r2 = report.checks.filter((check) => check.rule === "R2");
  assert.equal(r2.length, 1);
  assert.equal(r2[0].status, "PASS");
  const r3 = report.checks.filter((check) => check.rule === "R3");
  assert.equal(r3.length, 1);
  assert.equal(r3[0].status, "PASS");
  const r4 = report.checks.filter((check) => check.rule === "R4");
  assert.equal(r4.length, 1);
  assert.equal(r4[0].status, "PASS");
});

test("refreshed canonical planning evidence carries complete generator provenance and registration", () => {
  const result = spawnSync(process.execPath, [path.join(scriptDirectory, "validate-evidence-bindings.mjs"), "--json"], {
    cwd: root,
    encoding: "utf8",
  });
  assert.equal(result.status, 0);
  const report = JSON.parse(result.stdout);
  for (const artifactPath of [
    "canonical/fivefold-incubator/twin-hub-convergence-v0.json",
  ]) {
    assert.ok(report.registry.all.includes(artifactPath), `${artifactPath} is a registry member`);
    const r5 = report.checks.find((check) => check.rule === "R5" && check.subject === artifactPath);
    assert.ok(r5, `${artifactPath} has an R5 check`);
    assert.equal(r5.status, "PASS", `${artifactPath} R5 generator provenance`);
    const r6 = report.findings.filter((finding) => finding.rule === "R6" && finding.subject === artifactPath);
    assert.deepEqual(r6, [], `${artifactPath} R6 registration findings`);
  }
});

test("repository data files that the validator reads exist and parse", () => {
  for (const relativePath of ["provenance/digest-recipes.json", "qa/conventions/evidence-binding-001-admission.json", "qa/d4-r2-execution-receipt-ledger-binding.json"]) {
    const parsed = JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
    assert.equal(typeof parsed, "object");
  }
});
