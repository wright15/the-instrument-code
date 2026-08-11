import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const bundle = path.join(root, "skills", "court");
const read = (relative) => JSON.parse(fs.readFileSync(path.join(bundle, relative), "utf8"));
const operations = ["inspect_court_state", "list_legal_court_moves", "validate_and_execute_court_transition", "project_through_court", "verify_court_postcondition"].sort();

test("registry, capabilities, query budgets, and scopes have exact five-operation closure", () => {
  const registry = read("registry.json");
  const capabilities = read("capabilities.json");
  assert.equal(registry.schemaVersion, "crt-307.registry.v1");
  assert.equal(registry.apiVersion, "crt-307.court-agent-api.v1");
  assert.equal(registry.integratedAdmission, "proposed_pending_crt_309");
  assert.deepEqual(registry.skills.map((skill) => skill.skillId).sort(), operations);
  assert.deepEqual(registry.skills.map((skill) => skill.operationId).sort(), operations);
  assert.deepEqual(capabilities.grants.map((grant) => grant.skillId).sort(), operations);
  assert.equal(capabilities.defaultPolicy, "deny");

  const byId = new Map(registry.skills.map((skill) => [skill.skillId, skill]));
  assert.deepEqual([...byId.values()].map((skill) => skill.queryBudget.maxQueries), [2, 0, 0, 1, 2]);
  assert.equal(byId.get("validate_and_execute_court_transition").tokenScope, "internal-single-use-created-and-consumed-one-invocation-never-emitted");
  assert.ok([...byId.values()].filter((skill) => skill.skillId !== "validate_and_execute_court_transition").every((skill) => skill.tokenScope === "none"));

  const execute = capabilities.grants.find((grant) => grant.skillId === "validate_and_execute_court_transition");
  assert.deepEqual(execute.dynamicBindings[0].allowedCapabilities.sort(), ["court.transition", "court.translocate"]);
  assert.equal(execute.dynamicBindings[0].sourceField, "selectedMove.operationId");
  assert.deepEqual(execute.capabilities, ["court.ledger.replay", "court.move.validate", "court.move.execute", "court.postcondition.verify"]);
  const project = capabilities.grants.find((grant) => grant.skillId === "project_through_court");
  assert.deepEqual(project.capabilities, ["court.ledger.replay", "court.filter.project"]);
  assert.deepEqual(project.optionalCapabilities, ["court.graph.read.named"]);
  const forbidden = new Set([...capabilities.forbidden.tools, ...capabilities.forbidden.operations]);
  assert.ok(capabilities.grants.every((grant) => [...grant.tools, ...grant.operations, ...grant.capabilities].every((value) => !forbidden.has(value))));
});

test("Hermes and generic adapters preserve identical semantic contracts", () => {
  const hermes = read("adapters/hermes.json");
  const generic = read("adapters/generic-json.json");
  assert.deepEqual(hermes.semanticApi, generic.semanticApi);
  assert.deepEqual([...hermes.semanticApi.operations].sort(), operations);
  assert.equal(hermes.semanticApi.toolId, "governor.court_agent_api.invoke");
  assert.equal(hermes.rendering.editHostConfiguration, false);
  assert.equal(generic.rendering.editHostConfiguration, false);
  const strip = ({adapterId, discovery, rendering, ...rest}) => rest;
  assert.deepEqual(strip(hermes), strip(generic));
});

test("dedicated validator passes", () => {
  const output = execFileSync(process.execPath, [path.join(root, "scripts", "validate-court-skills.mjs")], {cwd: root, encoding: "utf8"});
  assert.match(output, /OK crt-307 Court skill bundle/);
});
