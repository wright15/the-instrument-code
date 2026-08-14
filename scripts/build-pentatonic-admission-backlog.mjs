#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { canonicalJsonBytes, compareCodePoint } from "../graph/runtime/canonical.mjs";


const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const defaultOutput = "provenance/pentatonic-set-class-admission-backlog.json";
const registryPath = "seven-governors-court-substrate-v0.1.0/canonical/pentatonic-set-class-registry.json";
const complementPath = "seven-governors-court-substrate-v0.1.0/canonical/complement-map.json";

const sourceSpecs = [
  ["crt-301-contract", "schemas/court-admission-contract.json", null, "admission_authority"],
  ["crt-302-package", "seven-governors-court-substrate-v0.1.0/PACKAGE_MANIFEST.json", null, "frozen_package_identity"],
  ["crt-302-release", "seven-governors-court-substrate-v0.1.0/canonical/substrate-registry-release.json", "fda4707f63b08ca02a155f8d5d8c738534f17e0ab2a234d79f83bf30f16a2fc2", "substrate_release"],
  ["crt-302-class-registry", registryPath, null, "candidate_identity"],
  ["crt-302-complement-map", complementPath, null, "complement_closure"],
  ["crt-303-package", "seven-governors-harmonic-invariants-v0.1.0/PACKAGE_MANIFEST.json", null, "frozen_package_identity"],
  ["crt-303-invariants", "seven-governors-harmonic-invariants-v0.1.0/canonical/harmonic-invariant-registry.json", "ad604fdb42144882d38433e734759fcd5c160dfe628139ce0ede1ff093481323", "harmonic_scope_boundary"],
  ["crt-304-package", "seven-governors-court-filter-algebra-v0.1.0/PACKAGE_MANIFEST.json", null, "frozen_package_identity"],
  ["crt-304-release", "seven-governors-court-filter-algebra-v0.1.0/canonical/filter-algebra-release.json", "40bd74397ff9f4c8c0f0b845630e008cea66c9495413195c1e1c92ff02968589", "filter_scope_boundary"],
  ["crt-309-admission", "provenance/court-admission-release.json", "df7e4c52131705b168efa14072d7fed14735fd073e9f8b4679d85a9c05ca0d26", "baseline_admission"],
];

const gateDefinitions = [
  ["source_identity", "Exact frozen Forte identity, mask, pitch classes, source state, and substrate binding."],
  ["complement_closure", "Exact XOR complement and same-numbered heptatonic family binding."],
  ["harmonic_characterization", "Class-specific exact harmonic method without reusing 5-35-only Carey or kappa claims."],
  ["transition_semantics", "Explicit rooted role, transition/filter domain, image, and translocation semantics."],
  ["application_necessity", "Bounded use case with canonical endpoints, measurable acceptance, and minimality evidence."],
  ["authority_safety", "Forbidden-write, namespace, replay, graph, model, and vault non-authority fixtures."],
  ["deterministic_candidate_release", "New versioned per-class package with source closure and build-twice identity."],
].map(([gateId, criterion]) => ({ gateId, criterion }));

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

function gateResult(gateId, satisfied, forteNumber, evidence) {
  return {
    gateId,
    status: satisfied ? "satisfied" : "pending",
    evidenceRefs: satisfied ? evidence : [],
    fixtureIds: satisfied ? [`crt-310:${gateId}:${forteNumber}`] : [],
    criterionIds: satisfied ? [`CRT-310-${gateId}`] : [],
    diagnosticCodes: satisfied ? [] : [`${gateId}_evidence_pending`],
  };
}

export async function buildPentatonicAdmissionBacklog({ reverseInput = false } = {}) {
  const [registry, complementMap, admission] = await Promise.all([
    readJson(registryPath),
    readJson(complementPath),
    readJson("provenance/court-admission-release.json"),
  ]);
  const proposed = new Set(admission.proposedScope.pentatonicSetClasses);
  let records = registry.pentatonicSetClasses.filter((record) => proposed.has(record.forteNumber));
  if (reverseInput) records = [...records].reverse();
  records.sort((left, right) => left.forteOrdinal - right.forteOrdinal);
  const complements = new Map(
    complementMap.complementMaps.map((record) => [record.pentatonicSetClassId, record]),
  );
  const [registrySha256, complementSha256] = await Promise.all([
    fileSha256(registryPath),
    fileSha256(complementPath),
  ]);
  const sourceBindings = [];
  for (const [bindingId, sourcePath, intrinsicFingerprint, role] of sourceSpecs) {
    sourceBindings.push({
      bindingId,
      path: sourcePath,
      sha256: await fileSha256(sourcePath),
      intrinsicFingerprint,
      role,
      frozen: true,
    });
  }
  sourceBindings.sort((left, right) => compareCodePoint(left.bindingId, right.bindingId));

  const items = records.map((record) => {
    const complement = complements.get(record.setClassId);
    if (!complement) throw new Error(`crt310_complement_missing:${record.setClassId}`);
    const sourceEvidence = [{
      evidenceId: `crt-302-source:${record.forteNumber}`,
      path: registryPath,
      sha256: registrySha256,
      recordSelector: { setClassId: record.setClassId },
      claim: "exact_proposed_set_class_identity",
    }];
    const complementEvidence = [{
      evidenceId: `crt-302-complement:${record.forteNumber}`,
      path: complementPath,
      sha256: complementSha256,
      recordSelector: { complementMapId: complement.complementMapId },
      claim: "exact_xor_complement_closure",
    }];
    const gateResults = gateDefinitions.map(({ gateId }) => gateResult(
      gateId,
      gateId === "source_identity" || gateId === "complement_closure",
      record.forteNumber,
      gateId === "source_identity" ? sourceEvidence : complementEvidence,
    ));
    const core = {
      itemId: `crt-310:${record.forteNumber}`,
      setClassId: record.setClassId,
      forteNumber: record.forteNumber,
      forteOrdinal: record.forteOrdinal,
      candidateIdentity: {
        representativePitchClasses: record.representativePitchClasses,
        representativeMask: record.representativeMask,
        representativeMask12: record.representativeMask12,
        weight: record.weight,
        sourceScaleStateId: record.sourceScaleStateId,
      },
      sourceRecordBinding: {
        path: registryPath,
        artifactSha256: registrySha256,
        recordSelector: { setClassId: record.setClassId },
      },
      complementRecordBinding: {
        path: complementPath,
        artifactSha256: complementSha256,
        recordSelector: { complementMapId: complement.complementMapId },
        complementMapId: complement.complementMapId,
        heptatonicFamilyId: complement.heptatonicFamilyId,
      },
      currentAdmissionStatus: "proposed",
      effectiveAdmissionStatus: "proposed",
      requestedAdmissionRole: null,
      workflowStatus: "evidence_pending",
      eligibleForAdmissionReview: false,
      admissionDecision: "not_made",
      promotionReleaseId: null,
      decisionLedgerRef: null,
      gateResults,
    };
    return { ...core, itemFingerprint: sha256Payload(core) };
  });
  const core = {
    schemaVersion: "crt-310.pentatonic-set-class-admission-backlog.v1",
    backlogId: "court-admission-backlog:crt-310:1",
    storyId: "CRT-310",
    baselineIntegratedReleaseId: "seven-governors-integrated-1.3.0",
    baselineAdmissionId: "court-admission:crt-309:1.0.0",
    status: "backlog",
    authority: "admission_planning_only",
    admissionEffect: "none",
    historicalCandidateBytesPreserved: true,
    reviewUnit: "one_pentatonic_set_class",
    bulkPromotionAllowed: false,
    maxClassesPerAdmissionDecision: 1,
    sourceBindings,
    requiredGateIds: gateDefinitions.map((gate) => gate.gateId),
    gateDefinitions,
    items,
    summary: {
      itemCount: 35,
      proposedCount: 35,
      eligibleForAdmissionReviewCount: 0,
      admittedCount: 0,
      gateDefinitionCount: 7,
      satisfiedGateResultCount: 70,
      pendingGateResultCount: 175,
      failedGateResultCount: 0,
    },
  };
  return { ...core, backlogFingerprint: sha256Payload(core) };
}

async function main() {
  const args = process.argv.slice(2);
  const outputFlag = args.indexOf("--output");
  const output = outputFlag >= 0 ? args[outputFlag + 1] : defaultOutput;
  if (!output) throw new Error("crt310_output_path_missing");
  const backlog = await buildPentatonicAdmissionBacklog({
    reverseInput: args.includes("--reverse-input"),
  });
  const bytes = `${JSON.stringify(backlog, null, 2)}\n`;
  const absoluteOutput = path.resolve(root, output);
  if (args.includes("--check")) {
    const existing = await fs.readFile(absoluteOutput, "utf8");
    if (existing !== bytes) throw new Error("crt310_backlog_not_fresh");
  } else {
    await fs.mkdir(path.dirname(absoluteOutput), { recursive: true });
    await fs.writeFile(absoluteOutput, bytes);
  }
  process.stdout.write(`${JSON.stringify({
    output: path.relative(root, absoluteOutput),
    itemCount: backlog.summary.itemCount,
    admittedCount: backlog.summary.admittedCount,
    backlogFingerprint: backlog.backlogFingerprint,
  }, null, 2)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
