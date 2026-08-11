#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import { sha256Bytes } from "../graph/runtime/canonical.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BUNDLE_ROOT = path.join(ROOT, "skills", "court");
const OPERATIONS = [
  "inspect_court_state",
  "list_legal_court_moves",
  "validate_and_execute_court_transition",
  "project_through_court",
  "verify_court_postcondition",
];
const QUERY_CATALOG = [
  "degree_triads_for_scale",
  "modal_scale_states_by_triad_quality",
  "modal_scale_states_by_interval_vector",
  "court_filter_commutation_outputs",
  "court_runtime_state_for_session",
  "court_verified_events_for_session",
];
const SCHEMA_FILES = [
  "schemas/common.schema.json",
  "schemas/inspect-court-state.schema.json",
  "schemas/list-legal-court-moves.schema.json",
  "schemas/validate-execute-court-transition.schema.json",
  "schemas/project-through-court.schema.json",
  "schemas/verify-court-postcondition.schema.json",
  "schemas/registry.schema.json",
  "schemas/capabilities.schema.json",
  "schemas/adapter.schema.json",
  "schemas/install-manifest.schema.json",
];
const OPERATION_SCHEMAS = SCHEMA_FILES.slice(1, 6);
const results = [];

function record(name, ok, detail = "") {
  results.push({name, ok, detail});
  process.stdout.write(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` - ${detail}` : ""}\n`);
}

function bundlePath(relative) {
  return path.join(BUNDLE_ROOT, relative);
}

function readJson(relative) {
  return JSON.parse(fs.readFileSync(bundlePath(relative), "utf8"));
}

function sorted(values) {
  return [...values].sort();
}

function equalSet(left, right) {
  return JSON.stringify(sorted(left)) === JSON.stringify(sorted(right));
}

function objectSchemasAreClosed(value, location = "$") {
  const failures = [];
  if (!value || typeof value !== "object") return failures;
  if (value.type === "object" && value.additionalProperties !== false) failures.push(location);
  for (const [key, child] of Object.entries(value)) {
    if (child && typeof child === "object") {
      failures.push(...objectSchemasAreClosed(child, `${location}/${key}`));
    }
  }
  return failures;
}

function propertyNames(value, names = []) {
  if (!value || typeof value !== "object") return names;
  if (value.properties && typeof value.properties === "object") names.push(...Object.keys(value.properties));
  for (const child of Object.values(value)) {
    if (child && typeof child === "object") propertyNames(child, names);
  }
  return names;
}

let registry;
let capabilities;
const schemas = new Map();
try {
  registry = readJson("registry.json");
  capabilities = readJson("capabilities.json");
  for (const relative of SCHEMA_FILES) schemas.set(relative, readJson(relative));
  record("bundle:json-load", true, `${SCHEMA_FILES.length + 2} files`);
} catch (error) {
  record("bundle:json-load", false, error.message);
}

const ajv = new Ajv2020({allErrors: true, strict: true});
let schemasCompiled = Boolean(registry && capabilities);
if (schemasCompiled) {
  for (const [relative, schema] of schemas) {
    try {
      ajv.addSchema(schema);
    } catch (error) {
      schemasCompiled = false;
      record("schemas:compile", false, `${relative}: ${error.message}`);
    }
  }
}
if (schemasCompiled) {
  for (const [relative, schema] of schemas) {
    try {
      if (!ajv.getSchema(schema.$id)) throw new Error("compiled validator missing");
    } catch (error) {
      schemasCompiled = false;
      record("schemas:compile", false, `${relative}: ${error.message}`);
    }
  }
}
if (schemasCompiled) record("schemas:compile", true, `${schemas.size} schemas`);

const closureFailures = [];
for (const [relative, schema] of schemas) {
  for (const location of objectSchemasAreClosed(schema)) closureFailures.push(`${relative}${location}`);
}
record("schemas:recursive-closure", closureFailures.length === 0, closureFailures.slice(0, 3).join(", "));

const forbiddenInputNames = new Set([
  "token", "tokenId", "consumedToken", "consumedTokenCount", "provider", "path",
  "rawCypher", "rawQuery", "shell", "evidence", "verdict", "evidenceDecision",
]);
const forbiddenSchemaFields = [];
for (const relative of OPERATION_SCHEMAS) {
  const input = schemas.get(relative)?.$defs?.input;
  for (const name of propertyNames(input, [])) {
    if (forbiddenInputNames.has(name)) forbiddenSchemaFields.push(`${relative}:${name}`);
  }
}
for (const relative of ["schemas/common.schema.json", ...OPERATION_SCHEMAS]) {
  for (const name of propertyNames(schemas.get(relative), [])) {
    if (/token/i.test(name)) forbiddenSchemaFields.push(`${relative}:${name}`);
  }
}
record("schemas:no-authority-input-fields", forbiddenSchemaFields.length === 0, forbiddenSchemaFields.join(", "));

if (schemasCompiled) {
  const registryValidator = ajv.getSchema(schemas.get("schemas/registry.schema.json").$id);
  const capabilitiesValidator = ajv.getSchema(schemas.get("schemas/capabilities.schema.json").$id);
  const registryOk = registryValidator(registry);
  const capabilitiesOk = capabilitiesValidator(capabilities);
  record("registry:schema-valid", registryOk, registryOk ? "" : ajv.errorsText(registryValidator.errors));
  record("capabilities:schema-valid", capabilitiesOk, capabilitiesOk ? "" : ajv.errorsText(capabilitiesValidator.errors));
}

if (registry && capabilities) {
  const registryOps = registry.skills.map((skill) => skill.operationId);
  const skillIds = registry.skills.map((skill) => skill.skillId);
  const grantIds = capabilities.grants.map((grant) => grant.skillId);
  const grantOps = capabilities.grants.flatMap((grant) => grant.operations);
  const exactClosure = registry.skills.length === 5
    && new Set(registryOps).size === 5
    && equalSet(registryOps, OPERATIONS)
    && equalSet(skillIds, OPERATIONS)
    && equalSet(grantIds, OPERATIONS)
    && equalSet(grantOps, OPERATIONS);
  record("operations:exact-five-closure", exactClosure, sorted(registryOps).join(", "));

  const expectedBudgets = new Map([
    ["inspect_court_state", [2, ["court_runtime_state_for_session", "court_verified_events_for_session"]]],
    ["list_legal_court_moves", [0, []]],
    ["validate_and_execute_court_transition", [0, []]],
    ["project_through_court", [1, ["court_filter_commutation_outputs"]]],
    ["verify_court_postcondition", [2, ["court_runtime_state_for_session", "court_verified_events_for_session"]]],
  ]);
  let budgetsOk = true;
  let scopesOk = true;
  for (const skill of registry.skills) {
    const [maxQueries, queryIds] = expectedBudgets.get(skill.skillId) || [-1, []];
    const actualIds = skill.queryBudget.namedQueries.map((query) => query.queryId);
    budgetsOk &&= skill.queryBudget.maxQueries === maxQueries
      && skill.queryBudget.namedQueries.every((query) => query.maxCalls === 1)
      && equalSet(actualIds, queryIds);
    const expectedScope = skill.skillId === "validate_and_execute_court_transition"
      ? "internal-single-use-created-and-consumed-one-invocation-never-emitted"
      : "none";
    scopesOk &&= skill.tokenScope === expectedScope;
  }
  record("registry:query-budgets", budgetsOk);
  record("registry:token-scopes", scopesOk);

  const forbidden = new Set([
    ...(capabilities.forbidden.tools || []),
    ...(capabilities.forbidden.operations || []),
    ...(capabilities.forbidden.claims || []),
  ]);
  const expectedCapabilities = new Map([
    ["inspect_court_state", ["court.context.read", "court.ledger.replay"]],
    ["list_legal_court_moves", ["court.ledger.replay", "court.moves.read"]],
    ["validate_and_execute_court_transition", ["court.ledger.replay", "court.move.validate", "court.move.execute", "court.postcondition.verify"]],
    ["project_through_court", ["court.ledger.replay", "court.filter.project"]],
    ["verify_court_postcondition", ["court.ledger.replay", "court.outcome.read", "court.postcondition.verify"]],
  ]);
  let grantsOk = capabilities.defaultPolicy === "deny";
  for (const grant of capabilities.grants) {
    grantsOk &&= !grant.tools.some((value) => forbidden.has(value));
    grantsOk &&= !grant.operations.some((value) => forbidden.has(value));
    grantsOk &&= !grant.capabilities.some((value) => forbidden.has(value));
    grantsOk &&= !grant.optionalCapabilities.some((value) => forbidden.has(value));
    grantsOk &&= equalSet(grant.capabilities, expectedCapabilities.get(grant.skillId));
    const graphOptional = new Set(["inspect_court_state", "project_through_court", "verify_court_postcondition"]).has(grant.skillId);
    grantsOk &&= equalSet(grant.optionalCapabilities, graphOptional ? ["court.graph.read.named"] : []);
    grantsOk &&= equalSet(grant.namedQueries, registry.skills.find((skill) => skill.skillId === grant.skillId).queryBudget.namedQueries.map((query) => query.queryId));
  }
  const executeGrant = capabilities.grants.find((grant) => grant.skillId === "validate_and_execute_court_transition");
  grantsOk &&= equalSet(executeGrant.dynamicBindings[0].allowedCapabilities, ["court.transition", "court.translocate"]);
  grantsOk &&= executeGrant.dynamicBindings[0].sourceField === "selectedMove.operationId";
  record("capabilities:closed-default-deny", grantsOk);
}

let referencesOk = Boolean(registry);
let workflowsOk = Boolean(registry);
if (registry) {
  for (const skill of registry.skills) {
    for (const reference of [skill.workflowPath, skill.inputSchema.split("#")[0], skill.outputSchema.split("#")[0]]) {
      if (!fs.existsSync(bundlePath(reference))) referencesOk = false;
    }
    const schema = readJson(skill.inputSchema.split("#")[0]);
    if (schema.$defs.input.$id !== skill.inputSchemaId || schema.$defs.output.$id !== skill.outputSchemaId) referencesOk = false;
    const workflow = fs.readFileSync(bundlePath(skill.workflowPath), "utf8");
    const frontmatter = workflow.match(/^---\nname: ([^\n]+)\ndescription: ([^\n]+)\n---\n/);
    if (!frontmatter || frontmatter[1] !== skill.name || frontmatter[2] !== skill.description) workflowsOk = false;
    for (const required of [
      "governor.court_agent_api.invoke", skill.operationId, skill.inputSchemaId, skill.outputSchemaId,
      "non_adjacent_without_translocation", "court_position_not_canonical", "kappa_cross_namespace_write",
      "repetition_limit_reached", "stale_state", "stale_ledger", "policy_fingerprint_mismatch",
      "context_fingerprint_mismatch", "capability_denied",
    ]) {
      if (!workflow.includes(required)) workflowsOk = false;
    }
    const forbiddenGrantPatterns = [
      /graph (?:is|as) (?:the )?authority/i,
      /prose (?:is|as) evidence/i,
      /model (?:may|can) invent/i,
      /invoke (?:raw_cypher|raw_shell)/i,
      /(?:may|can) (?:write|modify) (?:the )?(?:court|graph|ledger|topology|governor)/i,
    ];
    if (forbiddenGrantPatterns.some((pattern) => pattern.test(workflow))) workflowsOk = false;
  }
}
record("registry:references", referencesOk);
record("workflows:frontmatter-authority-reasons", workflowsOk);

let adaptersOk = Boolean(registry && schemasCompiled);
const adapters = [];
if (registry && schemasCompiled) {
  const validator = ajv.getSchema(schemas.get("schemas/adapter.schema.json").$id);
  for (const adapterRef of registry.adapters) {
    const adapter = readJson(adapterRef.configPath);
    adapters.push(adapter);
    adaptersOk &&= validator(adapter);
    adaptersOk &&= equalSet(adapter.semanticApi.operations, OPERATIONS);
    adaptersOk &&= adapter.installation.explicitTargetRequired === true;
    adaptersOk &&= adapter.rendering.editHostConfiguration === false;
  }
  const stripped = adapters.map(({adapterId, discovery, rendering, ...semantic}) => semantic);
  adaptersOk &&= JSON.stringify(stripped[0]) === JSON.stringify(stripped[1]);
  adaptersOk &&= JSON.stringify(adapters[0].semanticApi) === JSON.stringify(adapters[1].semanticApi);
}
record("adapters:semantic-parity", adaptersOk);

let dependenciesOk = Boolean(registry);
if (registry) {
  const dependencies = registry.dependencies;
  const policy = JSON.parse(fs.readFileSync(path.join(ROOT, dependencies.crt305RuntimePolicy.path), "utf8"));
  const filter = JSON.parse(fs.readFileSync(path.join(ROOT, dependencies.crt304FilterAlgebra.path), "utf8"));
  const invariants = JSON.parse(fs.readFileSync(path.join(ROOT, dependencies.crt303HarmonicInvariants.path), "utf8"));
  const queryBytes = fs.readFileSync(path.join(ROOT, dependencies.crt306GraphProjection.queryCatalogPath));
  const querySource = queryBytes.toString("utf8");
  const projectionSource = fs.readFileSync(path.join(ROOT, "src/governor/court_graph_projection.py"), "utf8");
  const sourceQueries = [...querySource.matchAll(/^        "([a-z0-9_]+)": CourtNamedQuery\($/gm)].map((match) => match[1]);
  dependenciesOk &&= policy.schemaVersion === dependencies.crt305RuntimePolicy.schemaVersion;
  dependenciesOk &&= policy.policyFingerprint === dependencies.crt305RuntimePolicy.policyFingerprint;
  dependenciesOk &&= policy.integratedAdmission === registry.integratedAdmission;
  dependenciesOk &&= sha256Bytes(fs.readFileSync(path.join(ROOT, dependencies.crt305RuntimePolicy.path))) === dependencies.crt305RuntimePolicy.sourceSha256;
  dependenciesOk &&= filter.filterAlgebraFingerprint === dependencies.crt304FilterAlgebra.filterAlgebraFingerprint;
  dependenciesOk &&= sha256Bytes(fs.readFileSync(path.join(ROOT, dependencies.crt304FilterAlgebra.path))) === dependencies.crt304FilterAlgebra.sourceSha256;
  dependenciesOk &&= invariants.invariantFingerprint === dependencies.crt303HarmonicInvariants.invariantFingerprint;
  dependenciesOk &&= sha256Bytes(fs.readFileSync(path.join(ROOT, dependencies.crt303HarmonicInvariants.path))) === dependencies.crt303HarmonicInvariants.sourceSha256;
  dependenciesOk &&= sha256Bytes(queryBytes) === dependencies.crt306GraphProjection.queryCatalogSha256;
  dependenciesOk &&= equalSet(sourceQueries, QUERY_CATALOG) && equalSet(dependencies.crt306GraphProjection.namedQueries, QUERY_CATALOG);
  dependenciesOk &&= projectionSource.includes(`COURT_GRAPH_SCHEMA_VERSION = "${dependencies.crt306GraphProjection.schemaVersion}"`);
}
record("dependencies:checked-source-contracts", dependenciesOk);

let bytesOk = true;
for (const relative of ["registry.json", "capabilities.json", ...SCHEMA_FILES, ...registry.skills.map((skill) => skill.workflowPath), ...registry.adapters.map((adapter) => adapter.configPath)]) {
  const bytes = fs.readFileSync(bundlePath(relative));
  bytesOk &&= bytes.length > 0 && bytes[bytes.length - 1] === 0x0a && !bytes.includes(0x0d);
}
record("bundle:lf-exact-bytes", bytesOk);

const failures = results.filter((result) => !result.ok);
process.stdout.write(failures.length === 0
  ? `OK crt-307 Court skill bundle: ${results.length} checks passed\n`
  : `FAILED crt-307 Court skill bundle: ${failures.length} check(s) failed\n`);
process.exit(failures.length === 0 ? 0 : 1);
