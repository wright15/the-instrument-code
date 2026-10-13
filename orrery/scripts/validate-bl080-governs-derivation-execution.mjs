#!/usr/bin/env node
/**
 * Validate the BL-080 Gate 3 GOVERNS derivation execution receipt
 * (qa/bl080-governs-derivation-receipt.json) against its sources.
 *
 * Independent of the execution builder: re-reads the pinned primaries (the
 * Gate 2 artifact, the chain anchors, the frozen generation and receipt, the
 * canonical ledger and network, the twin-hub validation, the decision
 * ledger), revalidates the derived projection, re-runs the frozen
 * generate/seal/compare paths from the Gate 2 projection, recomputes the
 * baseline comparison (field-for-field, full routeAccounting) and the branch
 * classification, re-checks the implementation digest and the source
 * bindings, verifies the schema shape, enforces the single-observation-read
 * instrumentation and the two-sided isolation check on the execution
 * builder's source statically, and runs mutation probes (artifact drift,
 * baseline drift, seal drift, comparison drift, smuggled reads, presence
 * strips, a proof strip, a double-read probe, a permissive probe). Fail-loud.
 *
 * The frozen `twinHubReceiptSha256` binding resolves against the live
 * twin-hub validation report, or, after the authorized BL-051 refresh
 * (ENTRY 19), against the preserved pre-refresh copy declared in
 * qa/halt-evidence/twin-hub-convergence-pre-refresh/preservation-receipt.json
 * (ENTRY 11: historical evidence preservation rather than production
 * rebinding; the frozen generation and the sealed receipt are byte-untouched).
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";

import { generate, sealGeneration } from "../../scripts/d4-generation.mjs";
import { compareSynthetic, extractObservations, selectCategory, verifySeal } from "../../scripts/d4-downstream-comparison.mjs";
import { extractBound, projectionDigests, validateProjection } from "../../scripts/d4-inputs.mjs";
import { canonicalJSON, digestObject, implementationDigest } from "../../scripts/d4-wire.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..", "..");

const RECEIPT_PATH = "qa/bl080-governs-derivation-receipt.json";
const SCHEMA_PATH = "schemas/bl080-governs-derivation-receipt.schema.json";
const GENERATOR_PATH = "scripts/build-bl080-governs-derivation-execution.mjs";
const GATE2_PATH = "orrery/src/generated/bl080-governs-derivation.v1.json";
const GENERATION_PATH = "qa/d4-production-generation.json";
const RECEIPT_BASELINE_PATH = "qa/d4-production-receipt.json";
const LEDGER_PATH = "canonical/universal-heptatonic-ledger.json";
const NETWORK_PATH = "canonical/universal-network-data.json";
const TWIN_HUB_PATH = "qa/twin-hub-convergence-validation.json";
const TWIN_HUB_PRESERVATION_RECEIPT_PATH =
  "qa/halt-evidence/twin-hub-convergence-pre-refresh/preservation-receipt.json";

// The frozen twin-hub binding resolves against the live report (pre-refresh),
// or, after the authorized BL-051 refresh (ENTRY 19), against the preserved
// pre-refresh copy declared in the preservation receipt (ENTRY 11: historical
// evidence preservation rather than production rebinding). Returns the
// resolving repository-relative path, or null when the pinned bytes resolve
// at neither location.
function resolveTwinHubBinding(pinnedSha256) {
  if (fileSha(TWIN_HUB_PATH) === pinnedSha256) return TWIN_HUB_PATH;
  const receiptPath = path.join(root, TWIN_HUB_PRESERVATION_RECEIPT_PATH);
  if (!fs.existsSync(receiptPath)) return null;
  const preserved = JSON.parse(fs.readFileSync(receiptPath, "utf8"))?.preserved?.validationReport;
  if (!preserved || typeof preserved.preservedPath !== "string" || preserved.sha256 !== pinnedSha256) {
    return null;
  }
  if (!fs.existsSync(path.join(root, preserved.preservedPath))) return null;
  if (fileSha(preserved.preservedPath) !== pinnedSha256) return null;
  return preserved.preservedPath;
}
const BL063_PATH = "orrery/src/generated/bl063-office-reconstruction.v1.json";
const BL064_PATH = "orrery/src/generated/bl064-cycle-ground.v1.json";
const BL066_PATH = "orrery/src/generated/bl066-r-edge-derivation.v1.json";
const BL078_PATH = "orrery/src/generated/bl078-d7-retest.v1.json";
const BL055_PATH = "orrery/src/generated/d4-selection-review.v1.json";
const DECISION_LEDGER_PATH = "provenance/DECISION_LEDGER.md";
const SCHEMA_VERSION = "harmonic-orrery.bl080-governs-derivation-receipt.v1";
const DERIVATION_ID = "BL080_GOVERNS_DERIVATION_EXECUTION_V1";
const GATE2_FINGERPRINT = "63699437ed2a38713ea947edd3a9978cdc54a02cac5ebee38b286bb7370ed8af";
const GATE2_SHA256 = "50735819917ae36d59e49ef352d2867af377bff9a8186f720b28494e8010b398";
const GENERATION_SHA256 = "f9ab736eb14a31ab68d0b1424e7e20dffc42768f7a8ccbf358e6f0ce107496ae";
const RECEIPT_SHA256 = "2057a75702ddb4952151d962fb680474ab6543387b604b3b5c37758b8e9c49d0";
const FROZEN_CLOSURE_DIGEST = "7ab950fac561016afc816e8b6947f7ce0b5f25573f1472321054ddbc9c1e097f";
const FROZEN_GENERATION_DIGEST = "c4a7f48dd982c6d96f594ca8c03e045092b9a00b9615e05ef2d14648f04f83d7";
const FROZEN_CATEGORY = "not_derived";
const DECISION_LEDGER_SHA256 = "8b7084bc7c55bd53a060434fbcaef1d0c7f4eb572079a01d3c1f3f05db4f2362";
const ENTRY10_SHA256 = "201efe8193e1967cb91bb07b4876c906be5ba71a23bf4735be6d18a7df69f7a7";
const FROZEN_LEDGER_BYTE_LENGTH = 174314;
const IMPLEMENTATION_FILES = [
  "orrery/scripts/validate-bl080-governs-derivation.mjs",
  "orrery/src/bl080-governs-derivation.test.ts",
  "orrery/src/generated/bl080-governs-derivation.v1.json",
  "scripts/build-bl080-governs-derivation-execution.mjs",
  "scripts/build-bl080-governs-derivation.mjs",
];
const CHAIN_ANCHORS = [
  [BL063_PATH, "reconstructionFingerprint", "6d33c67be7b8f87b8ad2f964cd3560ebcbc1ec0dc6b2088ad1f223c35caff8c3", "BL-063"],
  [BL064_PATH, "derivationFingerprint", "aa975820136658dd2fb3c84d98b34bf7a1901d39edd6548a300f458858305918", "BL-064"],
  [BL066_PATH, "derivationFingerprint", "94f0661ff6e76b0dea69fbe9f09ead24da7901393fb735495f3a25c3d9a1a886", "BL-066"],
  [BL078_PATH, "derivationFingerprint", "11644d401eff5ef951a2173f390041531743df682ad9c502f98a048c0f76e1b1", "BL-078"],
  [BL055_PATH, "reviewFingerprint", "6d11fd932efbe96892b3cf2e6a6cdad6f54e69cd2a8f284ebb72232c59d8b745", "BL-055"],
];
const EXPECTED_SOURCE_ARTIFACTS = [GATE2_PATH, GENERATION_PATH, RECEIPT_BASELINE_PATH, LEDGER_PATH, NETWORK_PATH, TWIN_HUB_PATH];

function fail(message) {
  throw new Error(`INVALID_BL080_GOVERNS_DERIVATION_EXECUTION: ${message}`);
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

function fileSha(relativePath) {
  return sha256(fs.readFileSync(path.join(root, relativePath)));
}

function canonicalText(value) {
  if (value === null) return "null";
  if (value === true) return "true";
  if (value === false) return "false";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isInteger(value)) fail("non-integer number in receipt payload");
    return String(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalText).join(",")}]`;
  if (typeof value === "object") {
    const keys = Object.keys(value).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${canonicalText(value[key])}`).join(",")}}`;
  }
  fail(`unsupported JSON type: ${typeof value}`);
}

function chainSelfCheck(artifact, fingerprintField, expectedFingerprint, label) {
  const core = { ...artifact };
  delete core[fingerprintField];
  if (artifact.status !== "planning_evidence") fail(`${label}: chain anchor status drift`);
  if (artifact[fingerprintField] !== expectedFingerprint) fail(`${label}: chain anchor fingerprint drift`);
  if (sha256(canonicalText(core)) !== expectedFingerprint) fail(`${label}: chain anchor fingerprint self-check failed`);
}

function comparisonFields(comparison, frozenComparison, category, frozenCategory) {
  return {
    "rows": canonicalJSON(comparison.rows) === canonicalJSON(frozenComparison.rows),
    "routes": canonicalJSON(comparison.routes) === canonicalJSON(frozenComparison.routes),
    "routes.A": canonicalJSON(comparison.routes.A) === canonicalJSON(frozenComparison.routes.A),
    "routes.B": canonicalJSON(comparison.routes.B) === canonicalJSON(frozenComparison.routes.B),
    "observedKeyCount": canonicalJSON(comparison.observedKeyCount) === canonicalJSON(frozenComparison.observedKeyCount),
    "fourCellCounts": canonicalJSON(comparison.fourCellCounts) === canonicalJSON(frozenComparison.fourCellCounts),
    "uKeys": canonicalJSON(comparison.uKeys) === canonicalJSON(frozenComparison.uKeys),
    "tC": canonicalJSON(comparison.tC) === canonicalJSON(frozenComparison.tC),
    "category": category === frozenCategory,
  };
}

function baselineSummary(frozenReceipt) {
  const routeA = frozenReceipt.comparison.routes.A;
  const routeB = frozenReceipt.comparison.routes.B;
  const tC = frozenReceipt.comparison.tC;
  return {
    source: RECEIPT_BASELINE_PATH,
    sha256: fileSha(RECEIPT_BASELINE_PATH),
    category: frozenReceipt.category,
    observedKeyCount: frozenReceipt.comparison.observedKeyCount,
    fourCellCounts: frozenReceipt.comparison.fourCellCounts,
    routeA: {
      generated: routeA.generated_key_count,
      matched: routeA.matchedObservedKeys.length,
      inRButUnmatched: routeA.in_R_but_unmatched_count,
      missed: routeA.missedObservedKeys.length,
      rMissed: routeA.R_missed_count,
      extra: routeA.extra_beyond_R_count,
      restatement: routeA.restatement_signature,
    },
    routeB: {
      generated: routeB.generated_key_count,
      matched: routeB.matchedObservedKeys.length,
      inRButUnmatched: routeB.in_R_but_unmatched_count,
      missed: routeB.missedObservedKeys.length,
      rMissed: routeB.R_missed_count,
      extra: routeB.extra_beyond_R_count,
      restatement: routeB.restatement_signature,
    },
    tC: { matches: tC.matches, missing: tC.missing, extra: tC.extra, midpointExact: tC.midpoint_exact },
    comparisonDigest: digestObject(frozenReceipt.comparison),
  };
}

function reDerive() {
  const gate2 = readJson(GATE2_PATH);
  const { derivationFingerprint, ...gate2Core } = gate2;
  void derivationFingerprint;
  if (gate2.derivationFingerprint !== GATE2_FINGERPRINT) fail("Gate 2 derivation fingerprint drift");
  if (sha256(canonicalText(gate2Core)) !== GATE2_FINGERPRINT) fail("Gate 2 fingerprint self-check failed");
  if (fileSha(GATE2_PATH) !== GATE2_SHA256) fail("Gate 2 artifact byte drift");
  for (const [artifactPath, field, expected, label] of CHAIN_ANCHORS) {
    chainSelfCheck(readJson(artifactPath), field, expected, label);
  }

  const frozenGeneration = readJson(GENERATION_PATH);
  if (fileSha(GENERATION_PATH) !== GENERATION_SHA256) fail("frozen generation byte drift");
  if (frozenGeneration.bindings.implementationDigest !== FROZEN_CLOSURE_DIGEST) fail("frozen closure digest drift");
  const frozenReceipt = readJson(RECEIPT_BASELINE_PATH);
  if (fileSha(RECEIPT_BASELINE_PATH) !== RECEIPT_SHA256) fail("frozen receipt byte drift");
  if (frozenReceipt.category !== FROZEN_CATEGORY) fail("frozen baseline category drift");

  const projection = { anchors: gate2.projection.anchors, R: gate2.projection.R, E: gate2.projection.E };
  validateProjection(projection);
  const digests = projectionDigests(projection);
  if (canonicalJSON(digests) !== canonicalJSON(frozenGeneration.bindings.projectionDigests)) {
    fail("derived projection digests diverge from the frozen bindings");
  }

  const generation = generate(projection);
  const seal = sealGeneration(generation, frozenGeneration.bindings,
    frozenGeneration.boundarySha256, frozenGeneration.specSha256, projection);
  const packet = {
    generation,
    bindings: frozenGeneration.bindings,
    seal,
    boundarySha256: frozenGeneration.boundarySha256,
    specSha256: frozenGeneration.specSha256,
    projection,
  };
  verifySeal(packet);

  const ledgerBytes = fs.readFileSync(path.join(root, LEDGER_PATH));
  const networkBytes = fs.readFileSync(path.join(root, NETWORK_PATH));
  if (sha256(ledgerBytes) !== frozenGeneration.bindings.ledgerSha256) fail("ledger binding drift");
  if (sha256(networkBytes) !== frozenGeneration.bindings.networkSha256) fail("network binding drift");
  if (resolveTwinHubBinding(frozenGeneration.bindings.twinHubReceiptSha256) === null) fail("twin-hub binding drift");
  const independent = extractBound(ledgerBytes, networkBytes, frozenGeneration.bindings);
  if (canonicalJSON(projectionDigests(independent)) !== canonicalJSON(frozenGeneration.bindings.projectionDigests)) {
    fail("independent projection extraction drift");
  }
  const observations = extractObservations(JSON.parse(ledgerBytes.toString("utf8")),
    JSON.parse(networkBytes.toString("utf8")), independent);
  const comparison = compareSynthetic(generation, independent, {
    contacts: observations.contacts,
    seams: observations.seams,
  });
  const category = selectCategory(comparison);

  const fields = comparisonFields(comparison, frozenReceipt.comparison, category, frozenReceipt.category);
  const runDigest = digestObject(comparison);
  const frozenDigest = digestObject(frozenReceipt.comparison);
  const canonicallyEqual = Object.values(fields).every((value) => value === true);
  const digestEqual = runDigest === frozenDigest;
  if (canonicallyEqual !== digestEqual) fail("baseline comparison levels disagree");

  const implementationFiles = IMPLEMENTATION_FILES.map((filePath) => ({ path: filePath, sha256: fileSha(filePath) }));

  const ledgerText = read(DECISION_LEDGER_PATH);
  const frozenPrefix = fs.readFileSync(path.join(root, DECISION_LEDGER_PATH)).subarray(0, FROZEN_LEDGER_BYTE_LENGTH);
  if (sha256(frozenPrefix) !== DECISION_LEDGER_SHA256) fail("decision-ledger prefix drift");
  const entry10 = ledgerText.split("\n").slice(2194, 2252).join("\n");
  if (!entry10.includes("## ENTRY 10")) fail("ENTRY 10 marker missing");
  if (sha256(entry10) !== ENTRY10_SHA256) fail("ENTRY 10 region drift");

  return {
    gate2,
    frozenGeneration,
    frozenReceipt,
    projection,
    digests,
    generation,
    seal,
    comparison,
    category,
    fields,
    canonicallyEqual,
    digestEqual,
    runDigest,
    frozenDigest,
    baseline: baselineSummary(frozenReceipt),
    implementationFiles,
    implementationDigest: implementationDigest(implementationFiles),
  };
}

function checkAgainstSources(receipt, derived) {
  const { executionFingerprint, ...core } = receipt;
  if (typeof executionFingerprint !== "string" || !/^[0-9a-f]{64}$/.test(executionFingerprint)) {
    fail("execution fingerprint format drift");
  }
  if (sha256(canonicalText(core)) !== executionFingerprint) fail("execution fingerprint drift");

  if (receipt.schemaVersion !== SCHEMA_VERSION) fail("schema version drift");
  if (receipt.derivationId !== DERIVATION_ID) fail("derivation id drift");
  if (receipt.generator !== GENERATOR_PATH) fail("generator path drift");
  if (receipt.inputProvenance !== "derived") fail("input provenance drift");
  if (receipt.gate2DerivationFingerprint !== GATE2_FINGERPRINT) fail("Gate 2 fingerprint field drift");

  const bindings = derived.frozenGeneration.bindings;
  if (receipt.bindings.ledgerSha256 !== bindings.ledgerSha256) fail("ledger binding drift");
  if (receipt.bindings.networkSha256 !== bindings.networkSha256) fail("network binding drift");
  if (receipt.bindings.twinHubReceiptSha256 !== bindings.twinHubReceiptSha256) fail("twin-hub binding drift");
  if (receipt.bindings.boundarySha256 !== derived.frozenGeneration.boundarySha256) fail("boundary binding drift");
  if (receipt.bindings.specSha256 !== derived.frozenGeneration.specSha256) fail("spec binding drift");
  if (receipt.bindings.implementationDigest !== derived.implementationDigest) fail("implementation digest drift");
  if (receipt.bindings.frozenClosureDigest !== FROZEN_CLOSURE_DIGEST) fail("frozen closure digest field drift");
  if (canonicalJSON(receipt.bindings.projectionDigests) !== canonicalJSON(bindings.projectionDigests)) {
    fail("projection digest binding drift");
  }

  if (canonicalJSON(receipt.implementationFiles) !== canonicalJSON(derived.implementationFiles)) {
    fail("implementation files drift");
  }

  if (receipt.seal.generationDigest !== derived.seal.generationDigest) fail("seal generation digest drift");
  if (receipt.seal.generationDigest !== FROZEN_GENERATION_DIGEST) fail("seal does not reproduce the frozen digest");
  if (receipt.seal.matchesFrozen !== true) fail("matchesFrozen drift");
  if (canonicalJSON(receipt.seal.inputIdentities) !== canonicalJSON(derived.seal.inputIdentities)) fail("seal input identities drift");
  if (receipt.seal.complete !== true) fail("seal completeness drift");

  if (canonicalJSON(receipt.generation) !== canonicalJSON(derived.generation)) fail("generation drift");
  if (canonicalJSON(receipt.comparison) !== canonicalJSON(derived.comparison)) fail("comparison drift");
  if (receipt.category !== derived.category) fail("category drift");

  if (canonicalText(receipt.baseline) !== canonicalText(derived.baseline)) fail("baseline summary drift");

  if (receipt.baselineComparison.canonicallyEqual !== derived.canonicallyEqual) fail("baseline equality flag drift");
  if (receipt.baselineComparison.digestEqual !== derived.digestEqual) fail("baseline digest flag drift");
  if (receipt.baselineComparison.runComparisonDigest !== derived.runDigest) fail("run comparison digest drift");
  if (receipt.baselineComparison.frozenComparisonDigest !== derived.frozenDigest) fail("frozen comparison digest drift");
  if (canonicalJSON(receipt.baselineComparison.fields) !== canonicalJSON(derived.fields)) fail("baseline field table drift");

  const sealMatches = derived.seal.generationDigest === FROZEN_GENERATION_DIGEST;
  const frozenCompletion = derived.frozenGeneration.generation.completion.perRoute;
  const generationDigestsMatch = ["T-A", "T-B", "T-C"].every((route) => {
    const live = derived.generation.completion.perRoute[route];
    const frozen = frozenCompletion[route];
    return live.digest === frozen.digest && live.outputs === frozen.outputs &&
      live.expected === frozen.expected && live.visited === frozen.visited;
  });
  const expectedClassification = derived.canonicallyEqual ? "DERIVED_FROM_DERIVED_INPUTS" : "DERIVED_WITH_DEVIATION";
  if (receipt.branchClassification.classification !== expectedClassification) fail("branch classification drift");
  if (receipt.branchClassification.preRegistered !== true) fail("pre-registration flag drift");
  if (receipt.branchClassification.sealMatches !== sealMatches) fail("branch seal flag drift");
  if (receipt.branchClassification.generationDigestsMatch !== generationDigestsMatch) fail("branch generation flag drift");
  if (derived.canonicallyEqual && sealMatches && generationDigestsMatch) {
    if (receipt.branchClassification.deviation !== null) fail("deviation must be null on the clean branch");
  } else if (!receipt.branchClassification.deviation) {
    fail("deviation missing outside the clean branch");
  }
  const expectedStatus = expectedClassification === "DERIVED_FROM_DERIVED_INPUTS" ? "execution_verified" : "execution_deviation";
  if (receipt.status !== expectedStatus) fail("status drift");
  if (typeof receipt.statusRationale !== "string" || receipt.statusRationale.trim().length === 0) fail("status rationale drift");

  if (receipt.gates["G3-1"].result !== "PASS") fail("G3-1 not PASS");
  if (receipt.gates["G3-2"].result !== "PASS") fail("G3-2 not PASS");
  if (!receipt.gates["G3-2"].statement.includes(String(receipt.observation.readCount))) fail("G3-2 statement drift");
  if (receipt.gates["G3-3"].result !== "PASS") fail("G3-3 not PASS");
  if (receipt.gates["G3-4"].result !== (derived.canonicallyEqual ? "PASS" : "DEVIATION")) fail("G3-4 result drift");
  const fieldsPassed = Object.values(derived.fields).filter((value) => value === true).length;
  if (!receipt.gates["G3-4"].statement.includes(`${fieldsPassed}/9`)) fail("G3-4 field count drift");
  if (receipt.gates["G3-5"].result !== "PASS") fail("G3-5 not PASS");

  if (receipt.observation.readCount !== 1 || receipt.observation.asserted !== true) fail("observation read drift");
  if (canonicalJSON(receipt.observation.records) !== canonicalJSON([LEDGER_PATH, NETWORK_PATH])) fail("observation records drift");
  if (receipt.isolation.regime !== "region-scoped" || receipt.isolation.grantedBytesInDerivationPath !== 0) {
    fail("isolation regime drift");
  }
  if (receipt.isolation.observationReads !== 1) fail("isolation read drift");
  if (receipt.controls.status !== "ABSENT" || !receipt.controls.reason.includes("not re-run")) fail("controls drift");

  if (receipt.sourceBindings.length !== EXPECTED_SOURCE_ARTIFACTS.length) fail("source binding census drift");
  for (const [index, expectedPath] of EXPECTED_SOURCE_ARTIFACTS.entries()) {
    const binding = receipt.sourceBindings[index];
    if (binding.artifact !== expectedPath) fail(`source binding path drift at ${expectedPath}`);
    if (expectedPath === TWIN_HUB_PATH) {
      if (resolveTwinHubBinding(binding.sha256) === null) fail(`source binding sha drift at ${expectedPath}`);
    } else {
      const expectedSha = fileSha(expectedPath);
      if (binding.sha256 !== expectedSha) fail(`source binding sha drift at ${expectedPath}`);
    }
    if (typeof binding.role !== "string" || binding.role.trim().length === 0) fail(`source binding role drift at ${expectedPath}`);
  }

  if (!receipt.fences.receiptRole.includes("not an amendment")) fail("receipt-role fence drift");
  if (receipt.fences.g1Intra330 !== "untouched") fail("G1 fence drift");
  if (!receipt.fences.frozenStack.includes("byte-untouched")) fail("frozen-stack fence drift");
  if (!receipt.fences.branchDetermination.includes("determined by the run")) fail("branch-determination fence drift");
  if (!receipt.fences.recordAmendment.includes("byte-untouched")) fail("record fence drift");
  if (receipt.notAccomplished.length !== 8) fail("notAccomplished census drift");
  if (receipt.contractCitations.length !== 8) fail("citation census drift");
}

function staticExecutionCheck(sourceText) {
  const begin = sourceText.indexOf("EXECUTION-PATH-BEGIN");
  const end = sourceText.indexOf("EXECUTION-PATH-END");
  if (begin < 0 || end < 0 || end <= begin) fail("execution-path markers missing");
  const head = sourceText.slice(0, end);
  const region = sourceText.slice(begin, end);
  const forbidden = [
    /frozenReceipt\.comparison/, /frozenReceipt\.category/, /frozenGeneration\.projection/,
    /baselineComparison/, /gate3Baseline/,
  ];
  for (const pattern of forbidden) {
    if (pattern.test(region)) fail(`execution path reads the frozen baseline: ${pattern}`);
    if (pattern.test(head)) fail(`forbidden token before the execution-path end: ${pattern}`);
  }
  const required = ["runDerivedPipeline", "sealGeneration", "compareSealed", "selectCategory", "observationReads"];
  for (const token of required) {
    if (!region.includes(token)) fail(`execution path missing required token: ${token}`);
  }
  const comparisonRegion = sourceText.slice(end);
  const proof = ["frozenReceipt.comparison", "baselineComparison", "branchClassification"];
  for (const token of proof) {
    if (!comparisonRegion.includes(token)) fail(`comparison region missing the granted-read proof token: ${token}`);
  }
  const ledgerReads = sourceText.split("readFileSync(path.join(root, LEDGER_PATH))").length - 1;
  const networkReads = sourceText.split("readFileSync(path.join(root, NETWORK_PATH))").length - 1;
  if (ledgerReads !== 1 || networkReads !== 1) {
    fail(`canonical record reads: ledger ${ledgerReads}, network ${networkReads} (exactly 1 each required)`);
  }
  const increments = sourceText.split("observationReads += 1").length - 1;
  const assertions = sourceText.split("observationReads !== 1").length - 1;
  if (increments !== 1 || assertions !== 1) fail("single-observation-read instrumentation drift");
}

function validate() {
  const receipt = readJson(RECEIPT_PATH);
  const schema = readJson(SCHEMA_PATH);
  const ajv = new Ajv2020({ strict: false, allErrors: true, coerceTypes: false, useDefaults: false, removeAdditional: false });
  if (!ajv.validateSchema(schema)) fail("receipt schema is not a valid schema");
  if (!ajv.validate(schema, receipt)) fail(`receipt schema shape: ${ajv.errorsText()}`);

  const derived = reDerive();
  checkAgainstSources(receipt, derived);

  const generatorSource = read(GENERATOR_PATH);
  staticExecutionCheck(generatorSource);

  const mutationProbes = [];
  const repin = (candidate) => {
    const { executionFingerprint, ...probeCore } = candidate;
    void executionFingerprint;
    return { ...probeCore, executionFingerprint: sha256(canonicalText(probeCore)) };
  };
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const expectRejection = (label, mutate) => {
    const mutated = clone(receipt);
    mutate(mutated);
    let rejected = false;
    try {
      checkAgainstSources(repin(mutated), derived);
    } catch {
      rejected = true;
    }
    if (!rejected) fail(`mutation probe not rejected: ${label}`);
    mutationProbes.push(label);
  };
  const expectStaticRejection = (label, mutatedSource) => {
    let rejected = false;
    try {
      staticExecutionCheck(mutatedSource);
    } catch {
      rejected = true;
    }
    if (!rejected) fail(`mutation probe not rejected: ${label}`);
    mutationProbes.push(label);
  };
  const expectStaticPass = (label, mutatedSource) => {
    try {
      staticExecutionCheck(mutatedSource);
    } catch {
      fail(`permissive probe rejected: ${label}`);
    }
    mutationProbes.push(label);
  };

  expectRejection("schema version drift", (a) => { a.schemaVersion = "harmonic-orrery.bl080-governs-derivation-receipt.v2"; });
  expectRejection("derivation id drift", (a) => { a.derivationId = "BL080_OTHER_V1"; });
  expectRejection("status drift", (a) => { a.status = "execution_deviation"; });
  expectRejection("input provenance drift", (a) => { a.inputProvenance = "granted"; });
  expectRejection("generator path drift", (a) => { a.generator = "scripts/build-other.mjs"; });
  const fingerprintProbe = clone(receipt);
  fingerprintProbe.executionFingerprint = "xyz";
  let fingerprintRejected = false;
  try {
    checkAgainstSources(fingerprintProbe, derived);
  } catch {
    fingerprintRejected = true;
  }
  if (!fingerprintRejected) fail("mutation probe not rejected: fingerprint format drift");
  mutationProbes.push("fingerprint format drift");
  const fingerprintZero = clone(receipt);
  fingerprintZero.executionFingerprint = "0".repeat(64);
  let fingerprintZeroRejected = false;
  try {
    checkAgainstSources(fingerprintZero, derived);
  } catch {
    fingerprintZeroRejected = true;
  }
  if (!fingerprintZeroRejected) fail("mutation probe not rejected: fingerprint-zero probe");
  mutationProbes.push("fingerprint-zero probe");
  expectRejection("Gate 2 fingerprint field drift", (a) => { a.gate2DerivationFingerprint = "0".repeat(64); });
  expectRejection("bindings ledger drift", (a) => { a.bindings.ledgerSha256 = "0".repeat(64); });
  expectRejection("bindings network drift", (a) => { a.bindings.networkSha256 = "0".repeat(64); });
  expectRejection("bindings twin-hub drift", (a) => { a.bindings.twinHubReceiptSha256 = "0".repeat(64); });
  expectRejection("bindings boundary drift", (a) => { a.bindings.boundarySha256 = "0".repeat(64); });
  expectRejection("bindings spec drift", (a) => { a.bindings.specSha256 = "0".repeat(64); });
  expectRejection("bindings implementation digest drift", (a) => { a.bindings.implementationDigest = "0".repeat(64); });
  expectRejection("bindings frozen closure drift", (a) => { a.bindings.frozenClosureDigest = "0".repeat(64); });
  expectRejection("bindings projection digest drift", (a) => { a.bindings.projectionDigests.R = "0".repeat(64); });
  expectRejection("implementation file count drift", (a) => { a.implementationFiles.pop(); });
  expectRejection("implementation file sha drift", (a) => { a.implementationFiles[0].sha256 = "0".repeat(64); });
  expectRejection("seal generation digest drift", (a) => { a.seal.generationDigest = "0".repeat(64); });
  expectRejection("seal matchesFrozen drift", (a) => { a.seal.matchesFrozen = false; });
  expectRejection("seal input identity drift", (a) => { a.seal.inputIdentities.ledgerSha256 = "0".repeat(64); });
  expectRejection("seal completeness drift", (a) => { a.seal.complete = false; });
  expectRejection("generation completion digest drift", (a) => { a.generation.completion.perRoute["T-A"].digest = "0".repeat(64); });
  expectRejection("generation witness drift", (a) => { a.generation.routes["T-B"].witnesses[0].s = "0"; });
  expectRejection("comparison row drop", (a) => { a.comparison.rows.pop(); });
  expectRejection("route A accounting drift", (a) => { a.comparison.routes.A.generated_key_count = "7"; });
  expectRejection("route B restatement drift", (a) => { a.comparison.routes.B.restatement_signature = false; });
  expectRejection("observed count drift", (a) => { a.comparison.observedKeyCount = "13"; });
  expectRejection("four-cell drift", (a) => { a.comparison.fourCellCounts.bOnly = "9"; });
  expectRejection("uKeys drop", (a) => { a.comparison.uKeys.pop(); });
  expectRejection("tC midpoint flag drift", (a) => { a.comparison.tC.midpoint_exact = false; });
  expectRejection("tC matches drop", (a) => { a.comparison.tC.matches.pop(); });
  expectRejection("baseline sha drift", (a) => { a.baseline.sha256 = "0".repeat(64); });
  expectRejection("baseline rMissed drift", (a) => { a.baseline.routeA.rMissed = "19"; });
  expectRejection("baseline observed count drift", (a) => { a.baseline.observedKeyCount = "13"; });
  expectRejection("baseline equality flag drift", (a) => { a.baselineComparison.canonicallyEqual = false; });
  expectRejection("baseline field table drift", (a) => { a.baselineComparison.fields.rows = false; });
  expectRejection("baseline run digest drift", (a) => { a.baselineComparison.runComparisonDigest = "0".repeat(64); });
  expectRejection("branch classification flip", (a) => { a.branchClassification.classification = "DERIVED_WITH_DEVIATION"; });
  expectRejection("spurious deviation", (a) => {
    a.branchClassification.deviation = {
      scope: "comparison block",
      entries: [{ stage: "S5'", field: "category", runDigest: "0".repeat(64), frozenDigest: "1".repeat(64) }],
      designSpecFalsifiability: { a: "a", b: "b", c: "c" },
    };
  });
  expectRejection("gate G3-4 result drift", (a) => { a.gates["G3-4"].result = "DEVIATION"; });
  expectRejection("observation read count drift", (a) => { a.observation.readCount = 2; });
  expectRejection("isolation byte drift", (a) => { a.isolation.grantedBytesInDerivationPath = 1; });
  expectRejection("controls drift", (a) => { a.controls.status = "ran"; });
  expectRejection("category drift", (a) => { a.category = "derived"; });
  expectRejection("source binding census drift", (a) => { a.sourceBindings.pop(); });
  expectRejection("source binding sha drift", (a) => { a.sourceBindings[3].sha256 = "0".repeat(64); });
  expectRejection("fence drift", (a) => { a.fences.g1Intra330 = "moved"; });
  expectRejection("notAccomplished census drift", (a) => { a.notAccomplished.pop(); });
  expectRejection("citation census drift", (a) => { a.contractCitations.pop(); });

  expectStaticRejection("smuggled frozen comparison read", generatorSource.replace(
    "export function runDerivedPipeline(projection) {",
    "export function runDerivedPipeline(projection) { const smuggled = frozenReceipt.comparison; void smuggled;",
  ));
  expectStaticRejection("smuggled frozen projection read", generatorSource.replace(
    "export function runDerivedPipeline(projection) {",
    "export function runDerivedPipeline(projection) { const smuggled = frozenGeneration.projection; void smuggled;",
  ));
  expectStaticRejection("smuggled baseline-table read", generatorSource.replace(
    "export function executeRun(pinned) {",
    "export function executeRun(pinned) { const smuggled = baselineComparison; void smuggled;",
  ));
  expectStaticRejection("double canonical read", generatorSource.replace(
    "  const comparison = compareSealed(packet, readReference);",
    "  const comparison = compareSealed(packet, readReference);\n  fs.readFileSync(path.join(root, LEDGER_PATH));",
  ));
  expectStaticRejection("presence strip runDerivedPipeline", generatorSource.replaceAll(
    "runDerivedPipeline", "executeDerivedPipeline",
  ));
  expectStaticRejection("presence strip compareSealed", generatorSource.replaceAll(
    "compareSealed", "sealedComparisonRun",
  ));
  expectStaticRejection("presence strip observationReads", generatorSource.replaceAll(
    "observationReads", "observationReadCounter",
  ));
  expectStaticRejection("proof strip", generatorSource.replaceAll("frozenReceipt.comparison", "receiptData"));
  expectStaticPass("permissive comparison-region read", generatorSource.replace(
    "// ==== EXECUTION-PATH-END ====",
    "// ==== EXECUTION-PATH-END ====\nconst permissiveProbe = frozenGeneration.projection?.anchors?.length ?? 0; void permissiveProbe;",
  ));

  console.log(JSON.stringify({
    receipt: RECEIPT_PATH,
    status: "PASS",
    executionStatus: receipt.status,
    classification: receipt.branchClassification.classification,
    executionFingerprint: receipt.executionFingerprint,
    implementationDigest: receipt.bindings.implementationDigest,
    sealGenerationDigest: receipt.seal.generationDigest,
    sealMatchesFrozen: receipt.seal.matchesFrozen,
    baseline: {
      canonicallyEqual: receipt.baselineComparison.canonicallyEqual,
      digestEqual: receipt.baselineComparison.digestEqual,
      fieldsPassed: Object.values(receipt.baselineComparison.fields).filter((value) => value === true).length,
    },
    observationReads: receipt.observation.readCount,
    category: receipt.category,
    gates: Object.fromEntries(Object.entries(receipt.gates).map(([key, gate]) => [key, gate.result])),
    mutationProbes: mutationProbes.length,
  }, null, 2));
}

validate();
