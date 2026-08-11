import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import Ajv2020 from "ajv/dist/2020.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const schemaRoot = path.join(root, "skills", "court", "schemas");
const schemaNames = [
  "common.schema.json",
  "inspect-court-state.schema.json",
  "list-legal-court-moves.schema.json",
  "validate-execute-court-transition.schema.json",
  "project-through-court.schema.json",
  "verify-court-postcondition.schema.json",
  "registry.schema.json",
  "capabilities.schema.json",
  "adapter.schema.json",
  "install-manifest.schema.json",
];
const ajv = new Ajv2020({allErrors: true, strict: true});
const contractRefs = new Map();
for (const name of schemaNames) {
  const schema = JSON.parse(fs.readFileSync(path.join(schemaRoot, name), "utf8"));
  ajv.addSchema(schema);
  for (const direction of ["input", "output"]) {
    if (schema.$defs?.[direction]?.$id) {
      contractRefs.set(schema.$defs[direction].$id, `${schema.$id}#/$defs/${direction}`);
    }
  }
}

function validator(schemaId) {
  const result = ajv.getSchema(contractRefs.get(schemaId) || schemaId);
  assert.ok(result, `missing ${schemaId}`);
  return result;
}

function assertValid(schemaId, value) {
  const validate = validator(schemaId);
  assert.equal(validate(value), true, `${schemaId}: ${ajv.errorsText(validate.errors)}`);
}

function actualFacadeRecords() {
  const pythonPath = [
    path.join(root, "src"),
    path.join(root, "court-mathematics", "src"),
    path.join(root, "seven-governors-harmonic-invariants-v0.1.0", "src"),
    path.join(root, "seven-governors-court-filter-algebra-v0.1.0", "src"),
    process.env.PYTHONPATH,
  ].filter(Boolean).join(path.delimiter);
  const result = spawnSync(
    "python3",
    [path.join(root, "tests", "crt_307", "facade_schema_samples.py")],
    {cwd: root, encoding: "utf8", env: {...process.env, PYTHONPATH: pythonPath}},
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return JSON.parse(result.stdout);
}

test("actual facade success, rejection, and unavailable records validate for every operation", () => {
  const records = actualFacadeRecords();
  const coverage = new Map();
  for (const record of records) {
    assertValid(record.schemaId, record.value);
    const values = coverage.get(record.schemaId) || new Set();
    values.add(record.kind);
    coverage.set(record.schemaId, values);
    if (record.schemaId.includes(".output.")) {
      assert.equal(record.value.toolReceipts[0].status, record.value.status);
      assert.equal(record.value.toolReceipts[0].operationId, record.value.skillId);
    }
  }
  for (const [schemaId, kinds] of coverage) {
    assert.deepEqual([...kinds].sort(), ["rejection", "success", "unavailable"], schemaId);
  }
  assert.equal(coverage.size, 10);
});

test("closed inputs reject authority fields and old state-object protocol recursively", () => {
  const hash = "a".repeat(64);
  const inspect = validator("crt-307.inspect-court-state.input.v1");
  const inspectBase = {schemaVersion: "crt-307.inspect-court-state.input.v1", requestId: "r1", sessionId: "session-1"};
  for (const field of ["token", "provider", "path", "rawCypher", "shell", "evidenceDecision", "includeGraphCorroboration"]) {
    assert.equal(inspect({...inspectBase, [field]: "not-allowed"}), false, field);
  }
  const list = validator("crt-307.list-legal-court-moves.input.v1");
  assert.equal(list({schemaVersion: "crt-307.list-legal-court-moves.input.v1", requestId: "r2", state: {stateSha256: hash}}), false);
  const execute = validator("crt-307.validate-execute-court-transition.input.v1");
  const executeBase = {
    schemaVersion: "crt-307.validate-execute-court-transition.input.v1",
    requestId: "r3",
    sessionId: "session-1",
    selectedMove: {operationId: "court:advance", targetPosition: "C1", moveHash: hash, translocationHash: null},
    expected: {revision: 0, stateSha256: hash, ledgerHeadSha256: hash, policyFingerprint: hash, contextFingerprint: hash},
  };
  assert.equal(execute({...executeBase, selectedMove: {...executeBase.selectedMove, capability: "court.transition"}}), false);
  assert.equal(execute({...executeBase, expected: {...executeBase.expected, token: hash}}), false);
});

test("request bounds and recursively closed actual output objects reject overflow and extras", () => {
  const hash = "a".repeat(64);
  const project = validator("crt-307.project-through-court.input.v1");
  const base = {
    schemaVersion: "crt-307.project-through-court.input.v1",
    requestId: "r4",
    sessionId: "session-1",
    expectedStateSha256: hash,
    expectedLedgerHeadSha256: hash,
    sourceMask: 4095,
    mutationOperatorId: "L7",
  };
  assert.equal(project(base), true, ajv.errorsText(project.errors));
  assert.equal(project({...base, sourceMask: 4096}), false);
  assert.equal(project({...base, sourceMask: true}), false);
  assert.equal(project({...base, mutationOperatorId: "R8"}), false);

  const output = actualFacadeRecords().find((record) => record.schemaId === "crt-307.inspect-court-state.output.v1" && record.kind === "success").value;
  const inspectOutput = validator("crt-307.inspect-court-state.output.v1");
  assert.equal(inspectOutput({...output, inventedAuthority: true}), false);
  const nested = structuredClone(output);
  nested.menu.moves[0].parameterSchema.properties.targetPosition.authority = true;
  assert.equal(inspectOutput(nested), false);
});
