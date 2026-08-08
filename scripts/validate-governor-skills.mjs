#!/usr/bin/env node
// GOV-207 skill bundle validator.
//
// Validates the first-party skill registry, capability manifest, schemas,
// workflow documents, and host adapters without writing anything. Exits
// nonzero on the first failed check class after printing every check.

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import { sha256Bytes } from "../graph/runtime/canonical.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");
const BUNDLE_ROOT = path.join(ROOT, "skills", "governor");

const results = [];
function record(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`);
}

function readJson(relative) {
  return JSON.parse(fs.readFileSync(path.join(BUNDLE_ROOT, relative), "utf8"));
}

function fileExists(relative) {
  return fs.existsSync(path.join(BUNDLE_ROOT, relative));
}

const ajv = new Ajv2020({ allErrors: true, strict: false });

const registry = readJson("registry.json");
const capabilities = readJson("capabilities.json");

// 1. Schema loading and compilation.
const schemaFiles = [
  "schemas/common.schema.json",
  "schemas/inspect-context.schema.json",
  "schemas/classify-governor.schema.json",
  "schemas/list-legal-moves.schema.json",
  "schemas/validate-execute.schema.json",
  "schemas/verify-outcome.schema.json",
  "schemas/registry.schema.json",
  "schemas/capabilities.schema.json",
  "schemas/install-manifest.schema.json",
  "schemas/upstream/classification-request.schema.json",
  "schemas/upstream/classification-result.schema.json",
];
const validators = new Map();
let compileOk = true;
for (const relative of schemaFiles) {
  try {
    ajv.addSchema(readJson(relative));
  } catch (error) {
    compileOk = false;
    record("schema:compile", false, `${relative}: ${error.message}`);
  }
}
for (const relative of schemaFiles) {
  try {
    const schemaId = readJson(relative).$id;
    const validator = ajv.getSchema(schemaId);
    if (!validator) throw new Error(`missing compiled schema ${schemaId}`);
    validators.set(relative, validator);
  } catch (error) {
    compileOk = false;
    record("schema:compile", false, `${relative}: ${error.message}`);
  }
}
if (compileOk) record("schema:compile", true, `${schemaFiles.length} schemas`);

// 2. Registry and capability manifest validate against their schemas.
const registryValidator = validators.get("schemas/registry.schema.json");
const capabilitiesValidator = validators.get("schemas/capabilities.schema.json");
record(
  "registry:schema-valid",
  Boolean(registryValidator && registryValidator(registry)),
  registryValidator ? ajv.errorsText(registryValidator.errors) : "validator missing",
);
record(
  "capabilities:schema-valid",
  Boolean(capabilitiesValidator && capabilitiesValidator(capabilities)),
  capabilitiesValidator
    ? ajv.errorsText(capabilitiesValidator.errors)
    : "validator missing",
);

// 3. Referenced files exist and skill metadata is coherent.
const skillIds = new Set();
let referencesOk = true;
for (const skill of registry.skills || []) {
  skillIds.add(skill.skillId);
  for (const relative of [skill.workflowPath]) {
    if (!fileExists(relative)) {
      referencesOk = false;
      record("registry:references", false, `${skill.skillId} missing ${relative}`);
    }
  }
  for (const schemaRef of [skill.inputSchema, skill.outputSchema]) {
    const [schemaPath] = schemaRef.split("#");
    if (!fileExists(schemaPath)) {
      referencesOk = false;
      record("registry:references", false, `${skill.skillId} missing ${schemaPath}`);
    }
  }
  const workflow = fs.readFileSync(
    path.join(BUNDLE_ROOT, skill.workflowPath),
    "utf8",
  );
  const frontmatter = workflow.match(/^---\nname: (.+)\ndescription: (.+)\n---/);
  if (!frontmatter) {
    referencesOk = false;
    record("workflow:frontmatter", false, skill.workflowPath);
  } else if (frontmatter[1] !== skill.name) {
    referencesOk = false;
    record(
      "workflow:frontmatter",
      false,
      `${skill.workflowPath} name ${frontmatter[1]} != ${skill.name}`,
    );
  }
}
if (referencesOk) {
  record("registry:references", true, `${skillIds.size} skills`);
  record("workflow:frontmatter", true, "name/description present and matching");
}

// 4. Upstream schema hashes match the recorded contracts.
const upstream = registry.contracts.upstreamClassifier;
const requestHash = sha256(
  fs.readFileSync(path.join(BUNDLE_ROOT, upstream.requestPath)),
);
const resultHash = sha256(
  fs.readFileSync(path.join(BUNDLE_ROOT, upstream.resultPath)),
);
record(
  "upstream:request-hash",
  requestHash === upstream.requestSha256,
  requestHash,
);
record(
  "upstream:result-hash",
  resultHash === upstream.resultSha256,
  resultHash,
);

// 5. Capability closure: grants reference real skills, and nothing forbidden
// is granted.
const forbiddenOperations = new Set(capabilities.forbidden?.operations || []);
const forbiddenTools = new Set(capabilities.forbidden?.tools || []);
let capabilityOk = true;
for (const grant of capabilities.grants || []) {
  if (!skillIds.has(grant.skillId)) {
    capabilityOk = false;
    record("capabilities:closure", false, `unknown skill ${grant.skillId}`);
  }
  for (const operation of grant.operations || []) {
    if (forbiddenOperations.has(operation)) {
      capabilityOk = false;
      record(
        "capabilities:closure",
        false,
        `${grant.skillId} grants forbidden ${operation}`,
      );
    }
  }
  for (const tool of grant.tools || []) {
    if (forbiddenTools.has(tool)) {
      capabilityOk = false;
      record(
        "capabilities:closure",
        false,
        `${grant.skillId} grants forbidden tool ${tool}`,
      );
    }
  }
}
if (capabilityOk) {
  record("capabilities:closure", true, "grants closed over registry; no forbidden grants");
}

// 6. Adapters parse, reference the same operations, and install config is
// explicit-target only.
const adapterIds = new Set();
let adapterOk = true;
for (const adapterRef of registry.adapters || []) {
  const adapter = readJson(adapterRef.configPath);
  adapterIds.add(adapter.adapterId);
  const operations = adapter.semanticApi?.operations || [];
  const registryOperations = (registry.skills || [])
    .map((skill) => skill.operationId)
    .sort();
  if (JSON.stringify([...operations].sort()) !== JSON.stringify(registryOperations)) {
    adapterOk = false;
    record("adapters:operations", false, adapterRef.configPath);
  }
  if (adapter.installation?.explicitTargetRequired !== true) {
    adapterOk = false;
    record("adapters:explicit-target", false, adapterRef.configPath);
  }
  if (adapter.rendering?.editHostConfiguration !== false) {
    adapterOk = false;
    record("adapters:no-host-config-edit", false, adapterRef.configPath);
  }
}
if (adapterOk) {
  record("adapters:operations", true, [...adapterIds].sort().join(", "));
  record("adapters:explicit-target", true, "both adapters require explicit targets");
}

const failed = results.filter((result) => !result.ok);
console.log(
  failed.length === 0
    ? `OK gov-207 skill bundle: ${results.length} checks passed`
    : `FAILED gov-207 skill bundle: ${failed.length} check(s) failed`,
);
process.exit(failed.length === 0 ? 0 : 1);
