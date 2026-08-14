#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";

import { canonicalJsonBytes } from "../graph/runtime/canonical.mjs";
import { buildPentatonicAdmissionBacklog } from "./build-pentatonic-admission-backlog.mjs";


const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const backlogPath = "provenance/pentatonic-set-class-admission-backlog.json";
const schemaPath = "schemas/court-admission/pentatonic-set-class-admission-backlog.schema.json";
const reportPath = "qa/pentatonic-set-class-admission-backlog-validation.json";
const registryPath = "seven-governors-court-substrate-v0.1.0/canonical/pentatonic-set-class-registry.json";
const complementPath = "seven-governors-court-substrate-v0.1.0/canonical/complement-map.json";

function sha256Bytes(bytes) {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

function sha256Payload(value) {
  return sha256Bytes(canonicalJsonBytes(value));
}

async function readJson(relativePath) {
  return JSON.parse(await fs.readFile(path.join(root, relativePath), "utf8"));
}

async function fileSha256(relativePath) {
  return sha256Bytes(await fs.readFile(path.join(root, relativePath)));
}

function coreWithout(value, field) {
  return Object.fromEntries(Object.entries(value).filter(([key]) => key !== field));
}

export async function validatePentatonicAdmissionBacklog(document) {
  const [schema, registry, complementMap, admission] = await Promise.all([
    readJson(schemaPath),
    readJson(registryPath),
    readJson(complementPath),
    readJson("provenance/court-admission-release.json"),
  ]);
  const validator = new Ajv2020({ strict: true, allErrors: true }).compile(schema);
  const checks = [];
  const record = (checkId, passed, diagnostic) => checks.push({
    checkId,
    status: passed ? "PASS" : "FAIL",
    diagnostic,
  });
  const schemaValid = validator(document);
  record("schema", schemaValid, schemaValid ? "valid" : validator.errors);
  record(
    "backlog-fingerprint",
    document.backlogFingerprint === sha256Payload(coreWithout(document, "backlogFingerprint")),
    document.backlogFingerprint,
  );

  const expectedClasses = new Set(admission.proposedScope.pentatonicSetClasses);
  const actualClasses = new Set(document.items?.map((item) => item.forteNumber));
  record(
    "authoritative-35-closure",
    expectedClasses.size === 35
      && actualClasses.size === 35
      && [...expectedClasses].every((item) => actualClasses.has(item)),
    { expected: expectedClasses.size, actual: actualClasses.size },
  );
  record(
    "admitted-class-exclusion",
    ["5-23", "5-27", "5-35"].every((item) => !actualClasses.has(item)),
    [...actualClasses].filter((item) => ["5-23", "5-27", "5-35"].includes(item)),
  );

  const sourceByForte = new Map(
    registry.pentatonicSetClasses.map((item) => [item.forteNumber, item]),
  );
  const complementById = new Map(
    complementMap.complementMaps.map((item) => [item.complementMapId, item]),
  );
  const itemFailures = [];
  const complementFailures = [];
  const gateFailures = [];
  for (const item of document.items ?? []) {
    const source = sourceByForte.get(item.forteNumber);
    const complement = complementById.get(item.complementRecordBinding?.complementMapId);
    if (
      !source
      || source.setClassId !== item.setClassId
      || source.forteOrdinal !== item.forteOrdinal
      || source.representativeMask !== item.candidateIdentity?.representativeMask
      || source.sourceScaleStateId !== item.candidateIdentity?.sourceScaleStateId
      || item.itemFingerprint !== sha256Payload(coreWithout(item, "itemFingerprint"))
    ) itemFailures.push(item.forteNumber);
    if (
      !complement
      || complement.pentatonicSetClassId !== item.setClassId
      || complement.representativePentatonicMask !== item.candidateIdentity?.representativeMask
      || (4095 ^ complement.representativePentatonicMask)
        !== complement.representativeHeptatonicMask
      || complement.heptatonicFamilyId !== `7-${item.forteNumber.slice(2)}`
    ) complementFailures.push(item.forteNumber);
    const gateById = new Map(item.gateResults?.map((gate) => [gate.gateId, gate]));
    const satisfied = ["source_identity", "complement_closure"].every((gateId) => {
      const gate = gateById.get(gateId);
      return gate?.status === "satisfied"
        && gate.evidenceRefs.length > 0
        && gate.fixtureIds.length > 0;
    });
    const pending = [
      "harmonic_characterization", "transition_semantics", "application_necessity",
      "authority_safety", "deterministic_candidate_release",
    ].every((gateId) => gateById.get(gateId)?.status === "pending");
    if (!satisfied || !pending) gateFailures.push(item.forteNumber);
  }
  record("source-record-parity", itemFailures.length === 0, itemFailures);
  record("complement-xor-closure", complementFailures.length === 0, complementFailures);
  record("per-class-gate-state", gateFailures.length === 0, gateFailures);
  record(
    "zero-admission-effect",
    document.summary?.admittedCount === 0
      && document.summary?.eligibleForAdmissionReviewCount === 0
      && document.admissionEffect === "none"
      && document.bulkPromotionAllowed === false
      && (document.items ?? []).every((item) => (
        item.currentAdmissionStatus === "proposed"
        && item.effectiveAdmissionStatus === "proposed"
        && item.eligibleForAdmissionReview === false
        && item.admissionDecision === "not_made"
      )),
    document.summary,
  );

  const bindingFailures = [];
  for (const binding of document.sourceBindings ?? []) {
    try {
      if (await fileSha256(binding.path) !== binding.sha256) bindingFailures.push(binding.bindingId);
    } catch {
      bindingFailures.push(binding.bindingId);
    }
  }
  record("frozen-source-closure", bindingFailures.length === 0, bindingFailures);

  const [firstBuild, secondBuild, reversedBuild] = await Promise.all([
    buildPentatonicAdmissionBacklog(),
    buildPentatonicAdmissionBacklog(),
    buildPentatonicAdmissionBacklog({ reverseInput: true }),
  ]);
  const expectedBytes = canonicalJsonBytes(firstBuild);
  record(
    "build-twice-identity",
    expectedBytes.equals(canonicalJsonBytes(secondBuild)),
    firstBuild.backlogFingerprint,
  );
  record(
    "reordered-input-identity",
    expectedBytes.equals(canonicalJsonBytes(reversedBuild)),
    reversedBuild.backlogFingerprint,
  );
  record(
    "checked-artifact-freshness",
    expectedBytes.equals(canonicalJsonBytes(document)),
    { expected: firstBuild.backlogFingerprint, actual: document.backlogFingerprint },
  );

  const checksFailed = checks.filter((check) => check.status === "FAIL").length;
  const core = {
    schemaVersion: "crt-310.pentatonic-set-class-admission-backlog-validation.v1",
    verdict: checksFailed === 0 ? "PASS" : "FAIL",
    backlogId: "court-admission-backlog:crt-310:1",
    backlogFingerprint: document.backlogFingerprint,
    checksPassed: checks.length - checksFailed,
    checksFailed,
    checks,
  };
  return { ...core, reportFingerprint: sha256Payload(core) };
}

async function main() {
  const document = await readJson(backlogPath);
  const report = await validatePentatonicAdmissionBacklog(document);
  await fs.writeFile(path.join(root, reportPath), `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (report.verdict !== "PASS") process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
