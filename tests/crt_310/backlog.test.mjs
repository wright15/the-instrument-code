import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { validatePentatonicAdmissionBacklog } from "../../scripts/validate-pentatonic-admission-backlog.mjs";


const root = path.resolve(fileURLToPath(import.meta.url), "..", "..", "..");
const canonical = JSON.parse(fs.readFileSync(
  path.join(root, "provenance/pentatonic-set-class-admission-backlog.json"),
  "utf8",
));

function clone(value) {
  return structuredClone(value);
}

test("CRT-310 canonical backlog is planning-only and fully validated", async () => {
  const report = await validatePentatonicAdmissionBacklog(canonical);
  assert.equal(report.verdict, "PASS");
  assert.equal(report.checksFailed, 0);
  assert.equal(canonical.items.length, 35);
  assert.equal(canonical.summary.admittedCount, 0);
});

test("CRT-310 rejects missing, admitted, and bulk-promoted classes", async () => {
  const missing = clone(canonical);
  missing.items.pop();
  assert.equal((await validatePentatonicAdmissionBacklog(missing)).verdict, "FAIL");

  const admitted = clone(canonical);
  admitted.items[0].effectiveAdmissionStatus = "admitted";
  admitted.items[0].eligibleForAdmissionReview = true;
  assert.equal((await validatePentatonicAdmissionBacklog(admitted)).verdict, "FAIL");

  const bulk = clone(canonical);
  bulk.bulkPromotionAllowed = true;
  bulk.maxClassesPerAdmissionDecision = 35;
  assert.equal((await validatePentatonicAdmissionBacklog(bulk)).verdict, "FAIL");
});

test("CRT-310 rejects complement and gate-evidence tampering", async () => {
  const complement = clone(canonical);
  complement.items[0].candidateIdentity.representativeMask ^= 1;
  assert.equal((await validatePentatonicAdmissionBacklog(complement)).verdict, "FAIL");

  const gate = clone(canonical);
  gate.items[0].gateResults[0].evidenceRefs = [];
  assert.equal((await validatePentatonicAdmissionBacklog(gate)).verdict, "FAIL");
});
