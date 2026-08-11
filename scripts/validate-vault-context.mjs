#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import Ajv2020 from "ajv/dist/2020.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function canonical(value) {
  if (value === null || typeof value === "boolean" || typeof value === "number" || typeof value === "string") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
}

const hashBytes = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");

async function readJson(relativePath) {
  return JSON.parse(await fs.readFile(path.join(root, relativePath), "utf8"));
}

async function fileHash(relativePath) {
  return hashBytes(await fs.readFile(path.join(root, relativePath)));
}

function record(checks, name, passed, diagnostic) {
  checks.push({name, status: passed ? "PASS" : "FAIL", diagnostic});
}

async function validateSchemas(schemaPaths) {
  const ajv = new Ajv2020({allErrors: true, strict: true});
  const loaded = [];
  for (const relativePath of schemaPaths) loaded.push([relativePath, await readJson(relativePath)]);
  for (const [relativePath, schema] of loaded) ajv.addSchema(schema, path.basename(relativePath));
  for (const [, schema] of loaded) ajv.getSchema(schema.$id) ?? ajv.compile(schema);
  return loaded.length;
}

async function validateBindings(relativePath) {
  const document = await readJson(relativePath);
  const results = [];
  for (const binding of document.bindings) {
    const actual = await fileHash(binding.path);
    results.push({path: binding.path, expected: binding.sha256, actual, pass: actual === binding.sha256});
  }
  return results;
}

function runPytest(testFile) {
  const result = spawnSync(
    "python3",
    ["-m", "pytest", "-p", "no:cacheprovider", "-q", testFile],
    {cwd: root, encoding: "utf8"},
  );
  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  const match = output.match(/(\d+) passed/);
  return {
    pass: result.status === 0,
    passed: match ? Number(match[1]) : 0,
  };
}

async function writeReport(schemaVersion, checks, outputPath) {
  const checksPassed = checks.filter((check) => check.status === "PASS").length;
  const checksFailed = checks.length - checksPassed;
  const core = {
    schemaVersion,
    verdict: checksFailed === 0 ? "PASS" : "FAIL",
    checksPassed,
    checksFailed,
    checks,
  };
  const report = {...core, reportFingerprint: hashBytes(Buffer.from(canonical(core)))};
  await fs.writeFile(path.join(root, outputPath), `${JSON.stringify(report, null, 2)}\n`);
  return report;
}

const govChecks = [];
try {
  const count = await validateSchemas([
    "schemas/governor-context/vault-note-frontmatter.schema.json",
    "schemas/governor-context/context-request.schema.json",
    "schemas/governor-context/context-bundle.schema.json",
    "schemas/governor-context/contextual-classification-result.schema.json",
    "schemas/governor-context/validation-report.schema.json",
  ]);
  record(govChecks, "GOV-208 schema closure", true, {schemaCount: count});
} catch (error) {
  record(govChecks, "GOV-208 schema closure", false, String(error));
}
const govBindings = await validateBindings("schemas/governor-context/dependency-bindings.json");
record(govChecks, "GOV-207 closed-contract byte parity", govBindings.every((item) => item.pass), govBindings);
const govTests = runPytest("tests/test_gov_208_vault_context.py");
record(govChecks, "GOV-208 provider, privacy, determinism, and parity tests", govTests.pass, {passed: govTests.passed});
const govReport = await writeReport("gov-208.validation-report.v1", govChecks, "qa/gov-208-vault-context-validation.json");

const courtChecks = [];
try {
  const count = await validateSchemas([
    "schemas/court-context/court-vault-frontmatter.schema.json",
    "schemas/court-context/court-context-bundle.schema.json",
    "schemas/governor-context/validation-report.schema.json",
  ]);
  record(courtChecks, "CRT-308 schema closure", true, {schemaCount: count});
} catch (error) {
  record(courtChecks, "CRT-308 schema closure", false, String(error));
}
const courtBindings = await validateBindings("schemas/court-context/dependency-bindings.json");
record(courtChecks, "CRT-302 through CRT-306 byte parity", courtBindings.every((item) => item.pass), courtBindings);
const courtTests = runPytest("tests/test_crt_308_court_vault_context.py");
record(courtChecks, "CRT-308 Court authority, privacy, and parity tests", courtTests.pass, {passed: courtTests.passed});
const courtReport = await writeReport("crt-308.validation-report.v1", courtChecks, "qa/crt-308-court-vault-context-validation.json");

process.stdout.write(`${JSON.stringify({gov208: govReport, crt308: courtReport}, null, 2)}\n`);
if (govReport.verdict !== "PASS" || courtReport.verdict !== "PASS") process.exitCode = 1;
