#!/usr/bin/env node
/**
 * BL-080 Gate 3 — the GOVERNS derivation execution run (BL-079 design spec
 * Gate 3): the re-specified pipeline's S1'-S5' execution on the Gate 2
 * derived projection, sealed under the frozen sealing context, compared once
 * against the canonical observation surface, and classified against the
 * pre-registered baseline pattern.
 *
 * Run order: Gate 2 artifact self-check (fingerprint 63699437...) and the
 * chain-anchor self-checks (BL-063/064/066/078, BL-055) plus the frozen byte
 * pins -> S0' reload of the derived projection (frozen validateProjection +
 * digests vs the frozen bindings) -> S1'-S3' generate() (the frozen pure
 * modules imported verbatim) -> S4' sealGeneration() under the frozen sealing
 * context -> S5' compareSealed() with exactly one licensed canonical
 * observation read (asserted) -> buildReceipt() (the frozen wire assembly and
 * its compareSynthetic recomputation) -> the frozen outcome selection -> the
 * baseline comparison (the run's comparison block vs the frozen receipt's,
 * field-for-field canonically, with digest equality recorded) -> the branch
 * classification (determined by the run) -> the receipt.
 *
 * Two fixed regions: the execution path (derived inputs plus the frozen
 * binding context only; no frozen comparison bytes) and the comparison region
 * (the frozen pattern baseline, read there only). The validator enforces the
 * two-sided static check and re-derives the receipt from the pinned primaries.
 *
 * Fences: evidence, not an amendment. No ledger writes, no claim event, no
 * record amendment (ENTRY 10/15/16/17 byte-untouched), no GOVERNS admission,
 * no D4/D7 status change, no G1 movement, no INV-5 graduation, no
 * M-walkability promotion; the frozen stack (scripts/d4-*.mjs) is imported
 * verbatim, byte-untouched, never re-executed under its old freeze; the
 * official controls of the frozen production run are not re-run (documented
 * absent); the frame 2.6/2.7 is interpretation vocabulary, never design
 * input; session prose is context, not evidence; the branch classification is
 * determined by the run, never written toward an expected outcome.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { generate, sealGeneration } from "./d4-generation.mjs";
import { buildReceipt, compareSealed, selectCategory, verifySeal } from "./d4-downstream-comparison.mjs";
import { projectionDigests, validateProjection } from "./d4-inputs.mjs";
import { canonicalJSON, digestObject, implementationDigest } from "./d4-wire.mjs";
import { canonicalText, fail, fileSha, readJson, sha256 } from "./verify-phase-a-proposals.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..");

export const SCHEMA_VERSION = "harmonic-orrery.bl080-governs-derivation-receipt.v1";
export const DERIVATION_ID = "BL080_GOVERNS_DERIVATION_EXECUTION_V1";
export const OUTPUT_PATH = "qa/bl080-governs-derivation-receipt.json";
export const SCHEMA_PATH = "schemas/bl080-governs-derivation-receipt.schema.json";
export const GENERATOR_PATH = "scripts/build-bl080-governs-derivation-execution.mjs";
export const GATE2_PATH = "orrery/src/generated/bl080-governs-derivation.v1.json";
export const GENERATION_PATH = "qa/d4-production-generation.json";
export const RECEIPT_PATH = "qa/d4-production-receipt.json";
export const LEDGER_PATH = "canonical/universal-heptatonic-ledger.json";
export const NETWORK_PATH = "canonical/universal-network-data.json";
export const TWIN_HUB_PATH = "qa/twin-hub-convergence-validation.json";
export const WIRE_SCHEMA_PATH = "schemas/d4-derivation-wire.schema.json";
export const BL063_PATH = "orrery/src/generated/bl063-office-reconstruction.v1.json";
export const BL064_PATH = "orrery/src/generated/bl064-cycle-ground.v1.json";
export const BL066_PATH = "orrery/src/generated/bl066-r-edge-derivation.v1.json";
export const BL078_PATH = "orrery/src/generated/bl078-d7-retest.v1.json";
export const BL055_PATH = "orrery/src/generated/d4-selection-review.v1.json";
export const GATE2_FINGERPRINT = "63699437ed2a38713ea947edd3a9978cdc54a02cac5ebee38b286bb7370ed8af";
export const GATE2_SHA256 = "50735819917ae36d59e49ef352d2867af377bff9a8186f720b28494e8010b398";
export const GENERATION_SHA256 = "f9ab736eb14a31ab68d0b1424e7e20dffc42768f7a8ccbf358e6f0ce107496ae";
export const RECEIPT_SHA256 = "2057a75702ddb4952151d962fb680474ab6543387b604b3b5c37758b8e9c49d0";
export const FROZEN_CLOSURE_DIGEST = "7ab950fac561016afc816e8b6947f7ce0b5f25573f1472321054ddbc9c1e097f";
export const FROZEN_GENERATION_DIGEST = "c4a7f48dd982c6d96f594ca8c03e045092b9a00b9615e05ef2d14648f04f83d7";
export const FROZEN_CATEGORY = "not_derived";
export const IMPLEMENTATION_FILES = [
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

function chainSelfCheck(artifact, fingerprintField, expectedFingerprint, label) {
  const core = { ...artifact };
  delete core[fingerprintField];
  if (artifact.status !== "planning_evidence") fail(`${label}: chain anchor status drift`);
  if (artifact[fingerprintField] !== expectedFingerprint) fail(`${label}: chain anchor fingerprint drift`);
  if (sha256(canonicalText(core)) !== expectedFingerprint) fail(`${label}: chain anchor fingerprint self-check failed`);
}

export function loadPinnedSources() {
  const gate2 = readJson(GATE2_PATH);
  const { derivationFingerprint, ...gate2Core } = gate2;
  void derivationFingerprint;
  if (gate2.derivationFingerprint !== GATE2_FINGERPRINT) fail("Gate 2 derivation fingerprint drift");
  if (sha256(canonicalText(gate2Core)) !== GATE2_FINGERPRINT) fail("Gate 2 fingerprint self-check failed");
  if (fileSha(GATE2_PATH) !== GATE2_SHA256) fail("Gate 2 artifact byte drift");
  if (gate2.status !== "planning_evidence" || gate2.pipeline?.status !== "landed_unexecuted") {
    fail("Gate 2 status drift");
  }
  if (gate2.projection.anchors.length !== 14 || gate2.projection.R.length !== 28 ||
      gate2.projection.E.length !== 14) fail("Gate 2 projection census drift");

  for (const [artifactPath, field, expected, label] of CHAIN_ANCHORS) {
    chainSelfCheck(readJson(artifactPath), field, expected, label);
  }

  const frozenGeneration = readJson(GENERATION_PATH);
  if (fileSha(GENERATION_PATH) !== GENERATION_SHA256) fail("frozen generation byte drift");
  if (frozenGeneration.bindings.implementationDigest !== FROZEN_CLOSURE_DIGEST) {
    fail("frozen closure digest drift");
  }
  if (fileSha(RECEIPT_PATH) !== RECEIPT_SHA256) fail("frozen receipt byte drift");

  const wireSchema = readJson(WIRE_SCHEMA_PATH);
  return { gate2, frozenGeneration, wireSchema };
}

// ==== EXECUTION-PATH-BEGIN (the run: derived inputs plus the frozen binding context; no frozen comparison bytes) ====

export function runDerivedPipeline(projection) {
  return generate(projection);
}

export function executeRun(pinned) {
  const { gate2, frozenGeneration, wireSchema } = pinned;

  // S0' reload: the Gate 2 derived projection, revalidated at the interface.
  const projection = {
    anchors: gate2.projection.anchors,
    R: gate2.projection.R,
    E: gate2.projection.E,
  };
  validateProjection(projection);
  const digests = projectionDigests(projection);
  if (canonicalJSON(digests) !== canonicalJSON(frozenGeneration.bindings.projectionDigests)) {
    fail("S0' derived projection digests diverge from the frozen bindings");
  }

  // S1'-S3': the frozen pure routes on the derived projection.
  const generation = runDerivedPipeline(projection);

  // S4' seal: the frozen sealing context applied to the derived-input run.
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

  // S5' comparison: exactly one licensed canonical observation read.
  let observationReads = 0;
  const readReference = () => {
    observationReads += 1;
    return {
      ledgerBytes: fs.readFileSync(path.join(root, LEDGER_PATH)),
      networkBytes: fs.readFileSync(path.join(root, NETWORK_PATH)),
    };
  };
  const comparison = compareSealed(packet, readReference);
  if (observationReads !== 1) {
    fail(`canonical observation read count ${observationReads}: exactly one is required`);
  }

  // S5' receipt: the frozen wire assembly recomputes the comparison
  // (compareSynthetic over the run's own rows) before the outcome selection.
  buildReceipt(packet, comparison, wireSchema);
  const category = selectCategory(comparison);

  return { projection, generation, seal, comparison, category, observationReads };
}

// ==== EXECUTION-PATH-END ====

const FIELD_STAGE = {
  "rows": "S4' (the canonical observation read: contact rows)",
  "routes": "S5' (route accounting)",
  "routes.A": "S1' (T-A kernel-twin) / S5' (accounting)",
  "routes.B": "S2' (T-B construction-join) / S5' (accounting)",
  "observedKeyCount": "S5' (route accounting)",
  "fourCellCounts": "S5' (route accounting)",
  "uKeys": "S0' (derived domain) / S5' (accounting)",
  "tC": "S3' (T-C relations) / S4' (seam observation)",
  "category": "S5' (the frozen outcome selection)",
};

function comparisonFields(run, frozenReceipt) {
  const frozenComparison = frozenReceipt.comparison;
  return {
    "rows": canonicalJSON(run.comparison.rows) === canonicalJSON(frozenComparison.rows),
    "routes": canonicalJSON(run.comparison.routes) === canonicalJSON(frozenComparison.routes),
    "routes.A": canonicalJSON(run.comparison.routes.A) === canonicalJSON(frozenComparison.routes.A),
    "routes.B": canonicalJSON(run.comparison.routes.B) === canonicalJSON(frozenComparison.routes.B),
    "observedKeyCount": canonicalJSON(run.comparison.observedKeyCount) === canonicalJSON(frozenComparison.observedKeyCount),
    "fourCellCounts": canonicalJSON(run.comparison.fourCellCounts) === canonicalJSON(frozenComparison.fourCellCounts),
    "uKeys": canonicalJSON(run.comparison.uKeys) === canonicalJSON(frozenComparison.uKeys),
    "tC": canonicalJSON(run.comparison.tC) === canonicalJSON(frozenComparison.tC),
    "category": run.category === frozenReceipt.category,
  };
}

function baselineSummary(frozenReceipt) {
  const routeA = frozenReceipt.comparison.routes.A;
  const routeB = frozenReceipt.comparison.routes.B;
  const tC = frozenReceipt.comparison.tC;
  return {
    source: RECEIPT_PATH,
    sha256: fileSha(RECEIPT_PATH),
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

export function compareToBaseline(run) {
  const frozenReceipt = readJson(RECEIPT_PATH);
  if (frozenReceipt.category !== FROZEN_CATEGORY) fail("frozen baseline category drift");
  if (fileSha(RECEIPT_PATH) !== RECEIPT_SHA256) fail("frozen receipt byte drift at the comparison read");
  const fields = comparisonFields(run, frozenReceipt);
  const runComparisonDigest = digestObject(run.comparison);
  const frozenComparisonDigest = digestObject(frozenReceipt.comparison);
  const canonicallyEqual = Object.values(fields).every((value) => value === true);
  const digestEqual = runComparisonDigest === frozenComparisonDigest;
  if (canonicallyEqual !== digestEqual) fail("baseline comparison levels disagree");
  return {
    frozenReceipt,
    fields,
    canonicallyEqual,
    digestEqual,
    runComparisonDigest,
    frozenComparisonDigest,
    baseline: baselineSummary(frozenReceipt),
  };
}

function deviationEntries(run, pinned, baselineResult, sealMatches, generationDigestsMatch) {
  const entries = [];
  for (const [field, equal] of Object.entries(baselineResult.fields)) {
    if (equal) continue;
    const runValue = field === "category" ? run.category
      : field.startsWith("routes.") ? run.comparison.routes[field.slice(7)]
      : run.comparison[field];
    const frozenValue = field === "category" ? baselineResult.frozenReceipt.category
      : field.startsWith("routes.") ? baselineResult.frozenReceipt.comparison.routes[field.slice(7)]
      : baselineResult.frozenReceipt.comparison[field];
    entries.push({
      stage: FIELD_STAGE[field] ?? "unclassified",
      field,
      runDigest: digestObject(runValue),
      frozenDigest: digestObject(frozenValue),
    });
  }
  if (!generationDigestsMatch) {
    entries.push({
      stage: "S1'-S3' (generation)",
      field: "generation.completion.perRoute",
      runDigest: digestObject(run.generation.completion),
      frozenDigest: digestObject(pinned.frozenGeneration.generation.completion),
    });
  }
  if (!sealMatches) {
    entries.push({
      stage: "S3' (seal)",
      field: "seal.generationDigest",
      runDigest: run.seal.generationDigest,
      frozenDigest: FROZEN_GENERATION_DIGEST,
    });
  }
  return entries;
}

export function classifyBranch(run, pinned, baselineResult) {
  const sealMatches = run.seal.generationDigest === FROZEN_GENERATION_DIGEST;
  const frozenCompletion = pinned.frozenGeneration.generation.completion.perRoute;
  const generationDigestsMatch = ["T-A", "T-B", "T-C"].every((route) => {
    const live = run.generation.completion.perRoute[route];
    const frozen = frozenCompletion[route];
    return live.digest === frozen.digest && live.outputs === frozen.outputs &&
      live.expected === frozen.expected && live.visited === frozen.visited;
  });
  const classification = baselineResult.canonicallyEqual
    ? "DERIVED_FROM_DERIVED_INPUTS"
    : "DERIVED_WITH_DEVIATION";
  const clean = baselineResult.canonicallyEqual && sealMatches && generationDigestsMatch;
  const deviation = clean ? null : {
    scope: baselineResult.canonicallyEqual
      ? "post-comparison integrity (generation digest or seal divergence while the comparison block matches)"
      : "comparison block",
    entries: deviationEntries(run, pinned, baselineResult, sealMatches, generationDigestsMatch),
    designSpecFalsifiability: {
      a: "a derived input is wrong: the un-granting program's verification missed something - the row-localized stage names the phase to repair (a finding, not a failure)",
      b: "a hidden granted dependency: the derivation's scope is deeper than recorded - the anchoring-remainder inventory extends",
      c: "provenance-dependence: the pipeline's semantics depend on the granted inputs' provenance, not just their values - the deepest finding",
    },
  };
  return {
    classification,
    sealMatches,
    generationDigestsMatch,
    reading: classification === "DERIVED_FROM_DERIVED_INPUTS"
      ? "the derived-input pipeline produces the identical result: the run's comparison block is canonically equal to the frozen receipt's comparison block, field-for-field, with equal digests and the frozen seal digest reproduced - the pipeline's semantics are independent of the inputs' provenance; the un-granting program's proof is complete"
      : "the run's comparison block differs from the frozen baseline: the finding - the interface-identity claim is falsified at the row-localized stage; the deviation's content is diagnostic (which stage, which field, what diverged)",
    deviation,
  };
}

export function assembleReceipt(pinned, run, baselineResult, branchClassification) {
  const { frozenGeneration } = pinned;
  const bindings = frozenGeneration.bindings;
  const implementationFiles = IMPLEMENTATION_FILES.map((filePath) => ({ path: filePath, sha256: fileSha(filePath) }));
  const implDigest = implementationDigest(implementationFiles);
  const fieldsPassed = Object.values(baselineResult.fields).filter((value) => value === true).length;
  const gates = {
    "G3-1": {
      name: "seal",
      result: "PASS",
      statement: `the derived-input generation seals under the frozen sealing context; generationDigest ${run.seal.generationDigest}; frozen baseline ${FROZEN_GENERATION_DIGEST}; matchesFrozen ${branchClassification.sealMatches}`,
    },
    "G3-2": {
      name: "single observation read",
      result: "PASS",
      statement: `exactly ${run.observationReads} canonical observation read (ledger + network bytes) in the comparison stage, asserted at compareSealed (no double-read, no selective read)`,
    },
    "G3-3": {
      name: "comparison reproducibility",
      result: "PASS",
      statement: "the frozen buildReceipt recomputation (compareSynthetic over the run's own contact/seam rows) reproduces the comparison block canonically before the outcome selection",
    },
    "G3-4": {
      name: "baseline match",
      result: baselineResult.canonicallyEqual ? "PASS" : "DEVIATION",
      statement: `canonical field equality ${fieldsPassed}/9 (every comparison field, including the full routeAccounting objects); whole-block digest equality ${baselineResult.digestEqual}`,
    },
    "G3-5": {
      name: "deviation classification",
      result: "PASS",
      statement: branchClassification.deviation
        ? `deviation classified: ${branchClassification.deviation.entries.length} entries (stage, field, run digest, frozen digest)`
        : "no deviation detected; the branch classification is determined by the run (DERIVED_FROM_DERIVED_INPUTS)",
    },
  };
  const sourceBindings = [
    { artifact: GATE2_PATH, sha256: fileSha(GATE2_PATH), role: "Gate 2 derivation artifact (the S0' derived projection; fingerprint 63699437... self-checked)" },
    { artifact: GENERATION_PATH, sha256: fileSha(GENERATION_PATH), role: "frozen generation (the sealing context: bindings, boundary, spec; the generation-digest baseline)" },
    { artifact: RECEIPT_PATH, sha256: fileSha(RECEIPT_PATH), role: "frozen pattern baseline and observed contact set (read in the comparison region only)" },
    { artifact: LEDGER_PATH, sha256: bindings.ledgerSha256, role: "canonical ledger (read once, in the comparison stage; sha asserted at the read)" },
    { artifact: NETWORK_PATH, sha256: bindings.networkSha256, role: "canonical network (read once, in the comparison stage; contacts and seams)" },
    { artifact: TWIN_HUB_PATH, sha256: bindings.twinHubReceiptSha256, role: "twin-hub convergence validation (the frozen twinHubReceiptSha256 binding)" },
  ];
  const core = {
    schemaVersion: SCHEMA_VERSION,
    derivationId: DERIVATION_ID,
    status: branchClassification.classification === "DERIVED_FROM_DERIVED_INPUTS" ? "execution_verified" : "execution_deviation",
    statusRationale: branchClassification.classification === "DERIVED_FROM_DERIVED_INPUTS"
      ? "the derived-input run reproduces the frozen pattern field-for-field with the frozen seal digest; gates G3-1 through G3-5 green; status determined by the run"
      : "the derived-input run deviates from the frozen pattern; the deviation is the finding; status determined by the run",
    generator: GENERATOR_PATH,
    inputProvenance: "derived",
    gate2DerivationFingerprint: GATE2_FINGERPRINT,
    bindings: {
      ledgerSha256: bindings.ledgerSha256,
      networkSha256: bindings.networkSha256,
      twinHubReceiptSha256: bindings.twinHubReceiptSha256,
      boundarySha256: frozenGeneration.boundarySha256,
      specSha256: frozenGeneration.specSha256,
      implementationDigest: implDigest,
      frozenClosureDigest: FROZEN_CLOSURE_DIGEST,
      projectionDigests: bindings.projectionDigests,
    },
    implementationFiles,
    seal: {
      generationDigest: run.seal.generationDigest,
      frozenGenerationDigest: FROZEN_GENERATION_DIGEST,
      matchesFrozen: branchClassification.sealMatches,
      inputIdentities: run.seal.inputIdentities,
      complete: run.seal.complete,
      statement: "the frozen sealing context (the frozen implementationDigest as the seal's input identity) applied to the derived-input run; the run's own implementation digest is recorded separately at bindings.implementationDigest",
    },
    generation: run.generation,
    comparison: run.comparison,
    baseline: baselineResult.baseline,
    baselineComparison: {
      canonicallyEqual: baselineResult.canonicallyEqual,
      digestEqual: baselineResult.digestEqual,
      runComparisonDigest: baselineResult.runComparisonDigest,
      frozenComparisonDigest: baselineResult.frozenComparisonDigest,
      fields: baselineResult.fields,
      statement: "field-for-field canonical equality (every comparison field, including the full routeAccounting objects with generated/matched/inRButUnmatched/missed/rMissed/extra/restatement) plus whole-block digest equality; the pre-registered baseline is the frozen receipt's comparison block",
    },
    preRegistration: {
      source: "scrum/plan/bl-079-governs-derivation-design-spec.md (Tasks 3-4)",
      branches: {
        DERIVED_FROM_DERIVED_INPUTS: "the run's comparison block is canonically equal to the frozen receipt's comparison block (rows 14; T-A 8 generated / 4 matched / 4 in-R-but-unmatched / 10 missed / 20 R-missed / 0 extra, restatement false; T-B 28 = U, restatement true; cells 0/10/4/0; tC two seam relations exact; category not_derived): the derived-input pipeline produces the identical result - the capstone's success",
        DERIVED_WITH_DEVIATION: "the comparison block differs: the finding - the interface-identity claim is falsified at some stage; the deviation's source is diagnostic (which stage, which field, what diverged)",
      },
    },
    branchClassification: {
      classification: branchClassification.classification,
      preRegistered: true,
      reading: branchClassification.reading,
      sealMatches: branchClassification.sealMatches,
      generationDigestsMatch: branchClassification.generationDigestsMatch,
      deviation: branchClassification.deviation,
    },
    gates,
    observation: {
      readCount: run.observationReads,
      asserted: true,
      reader: "d4-downstream-comparison.mjs compareSealed readReference",
      records: [LEDGER_PATH, NETWORK_PATH],
    },
    category: run.category,
    isolation: {
      regime: "region-scoped",
      grantedBytesInDerivationPath: 0,
      observationReads: run.observationReads,
      statements: [
        "the execution path (pin/self-check, S0' reload, S1'-S3' generate, the seal, S5' compareSealed) consumes the derived projection and the frozen binding context only; the frozen projection's semantic fields are never read",
        "the frozen pattern baseline (the receipt's comparison block) is read in the comparison region only, after the run completes",
        "the two-sided static check is enforced by the validator: forbidden tokens absent from the execution path; the comparison region carries the granted-read proof tokens",
      ],
    },
    controls: {
      status: "ABSENT",
      reason: "the 18 pre-flight controls belong to the frozen D4 production run (Grant 2) and are not re-run; no control evidence is fabricated or carried as this run's own",
    },
    sourceBindings,
    fences: {
      execution: "the S1'-S5' pipeline executed exactly once on the derived projection (the single licensed run); no second execution, no reseal, no rebind",
      observationRead: "exactly one licensed canonical observation read in the comparison stage, asserted (no double-read, no selective read)",
      receiptRole: "evidence, not an amendment: this receipt performs no record amendment; Gate 4 is a separate, later ceremony",
      recordAmendment: "none: ENTRY 10/15/16/17 byte-untouched",
      governsAdmission: "none",
      d4Record: "unchanged: D4 derivable-via-R2 (ENTRY 15) stands",
      d7Control: "fenced: D7 remains hypothesis-tier",
      anchoringRemainder: "unchanged and carried: the A0/A1 anchor sets + tier/role partition, the orientation bit, the presentation conventions",
      g1Intra330: "untouched",
      inv5: "no INV-5 graduation",
      mWalkability: "no M-walkability promotion",
      membrane: "frame 2.6/2.7 is interpretation vocabulary, never design input",
      canonical: "no canonical/Court/schema/Neo4j writes; the ledger, network, projection, receipt and generation are read-only",
      frozenStack: "scripts/d4-*.mjs byte-untouched (imported verbatim; never modified, never re-executed under its old freeze)",
      ledgerWrites: "none; Gate 4's amendment is a separate later event",
      sessionProse: "context, not evidence",
      branchDetermination: "the branch classification is determined by the run, never written toward an expected outcome",
    },
    notAccomplished: [
      "no Gate 4 amendment: this receipt records the run; the record amendment is a separate, later ceremony",
      "no record mutation: ENTRY 10/15/16/17 byte-untouched; D4 derivable-via-R2 (ENTRY 15) and D7 hypothesis-tier unchanged",
      "no GOVERNS admission; no claim event; no higher-theorem answer",
      "no anchoring-remainder resolution (partition, orientation bit, presentation conventions carried)",
      "no G1 movement; no INV-5 graduation; no M-walkability promotion",
      "no canonical/Court/schema/Neo4j writes beyond the landing's own artifacts",
      "the pipeline's semantics are not re-litigated: the run tests reproducibility from derived inputs, not the derivation's mathematical validity (the phases' proven result)",
      "the 18 frozen pre-flight controls were not re-run (controls absent, documented); no control evidence is claimed",
    ],
    contractCitations: [
      "scrum/plan/bl-079-governs-derivation-design-spec.md (the design specification: Tasks 3-5 - pre-registered criteria, the falsifiability structure, the Gate 3 output contract)",
      "scrum/plan/bl-080-governs-derivation-memo.md (Gate 2: the S0' set-equality; the conditional green light)",
      "orrery/src/generated/bl080-governs-derivation.v1.json (the derived projection; fingerprint 63699437...)",
      "orrery/src/generated/bl063-office-reconstruction.v1.json; orrery/src/generated/bl064-cycle-ground.v1.json; orrery/src/generated/bl066-r-edge-derivation.v1.json (the un-granting program's chain anchors)",
      "qa/d4-production-generation.json (the frozen sealing context and the generation-digest baseline)",
      "qa/d4-production-receipt.json (the frozen pattern baseline; the comparison target)",
      "qa/d4-r2-execution-receipt.json (the corridor's Gate 3 receipt-shape precedent)",
      "scripts/d4-production.mjs; scripts/d4-generation.mjs; scripts/d4-downstream-comparison.mjs; scripts/d4-inputs.mjs; scripts/d4-wire.mjs; scripts/d4-derivation-engine.mjs (the frozen stack, imported verbatim)",
    ],
  };
  const executionFingerprint = sha256(canonicalText(core));
  return { ...core, executionFingerprint };
}

export function buildGovernsDerivationReceipt() {
  const pinned = loadPinnedSources();
  const run = executeRun(pinned);
  const baselineResult = compareToBaseline(run);
  const branchClassification = classifyBranch(run, pinned, baselineResult);
  return assembleReceipt(pinned, run, baselineResult, branchClassification);
}

export function serializeReceipt(receipt) {
  return `${canonicalText(receipt)}\n`;
}

function main() {
  const check = process.argv.includes("--check");
  const receipt = buildGovernsDerivationReceipt();
  const serialized = serializeReceipt(receipt);
  const outputPath = path.join(root, OUTPUT_PATH);
  const summary = {
    output: OUTPUT_PATH,
    check,
    status: receipt.status,
    classification: receipt.branchClassification.classification,
    sealGenerationDigest: receipt.seal.generationDigest,
    sealMatchesFrozen: receipt.seal.matchesFrozen,
    baselineEqual: receipt.baselineComparison.canonicallyEqual,
    fieldsPassed: Object.values(receipt.baselineComparison.fields).filter((value) => value === true).length,
    category: receipt.category,
    observationReads: receipt.observation.readCount,
    gates: Object.fromEntries(Object.entries(receipt.gates).map(([key, gate]) => [key, gate.result])),
    executionFingerprint: receipt.executionFingerprint,
  };
  if (check) {
    const existing = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, "utf8") : null;
    if (existing !== serialized) throw new Error("STALE_BL080_GOVERNS_DERIVATION_RECEIPT");
    console.log(JSON.stringify({ ...summary, stale: false }, null, 2));
    return;
  }
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, serialized);
  console.log(JSON.stringify({ ...summary, sha256: sha256(serialized) }, null, 2));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}
