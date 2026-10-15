#!/usr/bin/env node
/**
 * Build the BL-092 ledger-bound cascade refresh hygiene record: the post-ENTRY 22
 * re-bind of the stale cascade against the amended ledger, with payload
 * projections required byte-identical to the P0-preserved pre-refresh bytes.
 *
 * The record is a provenance-only hygiene artifact: it creates no claim, admits
 * nothing, and moves no derivation status. It cites, per artifact: the
 * pre-refresh fingerprint (from the preservation directory), the post-refresh
 * fingerprint (live), the decision-ledger binding re-issued, and the payload
 * projection under a declared recipe - equal across the refresh by construction
 * or the build halts (the OD-2-class geometry-drift halt).
 *
 * Termination (OD-92-4): the refreshed bindings are born current against the
 * ENTRY 23 ledger; the record's ledger references are prefix- and
 * region-scoped so they remain verifiable as the ledger appends further
 * entries. The six refreshed artifacts are the live-enforced class; a future
 * ledger append stales them mechanically and begins its own refresh landing.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { canonicalCompact, sha256, sha256Bytes } from "../graph/runtime/canonical.mjs";

export const OUTPUT_PATH = "orrery/src/generated/bl092-cascade-refresh.v1.json";

const SCHEMA_VERSION = "harmonic-orrery.bl092-cascade-refresh.v1";
const ARTIFACT_ID = "BL092_CASCADE_REFRESH_V1";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LEDGER_PATH = "provenance/DECISION_LEDGER.md";
const PRESERVATION_DIR = "qa/halt-evidence/twin-hub-convergence-pre-refresh-entry22";
const PRESERVATION_RECEIPT = `${PRESERVATION_DIR}/preservation-receipt.json`;
const GEOMETRY_DRIFT_TOKEN = "GEOMETRY_DRIFT";

const R5_FIELDS = ["generator", "generatorDigest", "invocation", "generatedAt"];

const CASCADE = [
  {
    artifact: "canonical/fivefold-incubator/twin-hub-convergence-v0.json",
    preservedName: "twin-hub-convergence-v0.json",
    fingerprintField: "candidateFingerprint",
    bindingPath: ["evidenceBindings", "decisionLedgerSha256"],
    projection: "payload-minus-bindings-and-r5",
    report: { path: "qa/twin-hub-convergence-validation.json", fingerprintField: "candidateFingerprint" },
  },
  {
    artifact: "canonical/fivefold-incubator/fifth-space-census-v0.json",
    preservedName: "fifth-space-census-v0.json",
    fingerprintField: "candidateFingerprint",
    bindingPath: ["evidenceBindings", "decisionLedgerSha256"],
    projection: "payload-minus-bindings-and-r5",
    report: { path: "qa/fifth-space-census-validation.json", fingerprintField: "candidateFingerprint" },
  },
  {
    artifact: "canonical/fivefold-incubator/shadow-ladder-v0.json",
    preservedName: "shadow-ladder-v0.json",
    fingerprintField: "candidateFingerprint",
    bindingPath: ["evidenceBindings", "decisionLedgerSha256"],
    projection: "payload-minus-bindings-and-r5",
    report: { path: "qa/shadow-ladder-validation.json", fingerprintField: "candidateFingerprint" },
  },
  {
    artifact: "qa/pentatonic-binding-audit-closure.json",
    preservedName: "pentatonic-binding-audit-closure.json",
    fingerprintField: "reportFingerprint",
    bindingPath: ["evidenceBindings", "decisionLedgerSha256"],
    projection: "closure-payload",
    report: null,
  },
  {
    artifact: "qa/fivefold-engine-promotion-evidence.json",
    preservedName: "fivefold-engine-promotion-evidence.json",
    fingerprintField: "evidenceFingerprint",
    bindingPath: ["decisionLedgerSha256"],
    projection: "promotion-payload",
    report: null,
  },
];

const DOWNSTREAM = [
  {
    artifact: "orrery/src/generated/field-derivation-bundle.v1.json",
    preservedName: "field-derivation-bundle.v1.json",
    projection: "field-derivation-payload",
  },
  {
    artifact: "orrery/src/generated/taxonomy-read-model.v1.json",
    preservedName: "taxonomy-read-model.v1.json",
    projection: "taxonomy-payload",
  },
  {
    artifact: "orrery/src/generated/d-tier-taxonomy-dataset.v1.json",
    preservedName: "d-tier-taxonomy-dataset.v1.json",
    projection: "d-tier-payload",
  },
];

const VERIFIED_FRESH = {
  artifact: "canonical/fivefold-incubator/d-shadow-complement-span-v0.json",
  preservedName: "d-shadow-complement-span-v0.json",
  evidence: "no decision-ledger digest in its evidenceBindings chain; generator --check exit 0 at the pre-refresh tree; left byte-untouched (OD-92-1)",
};

const FENCE_SPANS = {
  entry10: [2195, 2252],
  entry15: [2665, 2810],
  entry16: [2814, 2964],
  entry17: [2968, 3126],
  entry18: [3130, 3330],
  entry19: [3333, 3450],
  entry20: [3453, 3543],
  entry21: [3545, 3649],
  entry22: [3651, 3806],
};

const PREFIX_COUNTS = [174314, 183663, 202266, 214223, 233926];

const RECEIPTS = {
  bl051: "qa/specs/bl-051-twin-hub-cascade-refresh.json",
  bl052: "qa/specs/bl-052-promotion-refresh.json",
  bl053: "qa/specs/bl-053-green-release.json",
  bl091: "qa/specs/bl-091-d7-derivation-admission.json",
  bl092: PRESERVATION_RECEIPT,
};

const INTEGRATED_RECEIPT = "qa/integrated-release-validation.json";

function fail(message) {
  throw new Error(message);
}

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath));
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath).toString("utf8"));
}

function getPath(object, keys) {
  let cursor = object;
  for (const key of keys) {
    if (cursor === null || typeof cursor !== "object") return undefined;
    cursor = cursor[key];
  }
  return cursor;
}

function without(keys, source) {
  const result = {};
  for (const [key, value] of Object.entries(source)) {
    if (!keys.includes(key)) result[key] = value;
  }
  return result;
}

function projectPlain(doc) {
  return sha256(without(["candidateFingerprint", "evidenceBindings", ...R5_FIELDS], doc));
}

function projectPromotion(doc) {
  const clone = structuredClone(doc);
  delete clone.evidenceFingerprint;
  delete clone.decisionLedgerSha256;
  for (const key of R5_FIELDS) delete clone[key];
  for (const group of clone.exclusionEvidence ?? []) {
    for (const check of group.checks ?? []) {
      if (check.checkId === "decision-ledger-digest") {
        check.expected = "";
        check.actual = "";
      }
    }
  }
  return sha256(clone);
}

function projectClosure(doc) {
  const clone = structuredClone(doc);
  delete clone.reportFingerprint;
  if (clone.evidenceBindings) clone.evidenceBindings.decisionLedgerSha256 = "";
  for (const check of clone.checks ?? []) {
    if (check.checkId === "active-source-and-decision-ledger-isolation") {
      check.diagnostic.decisionLedgerSha256 = "";
    }
  }
  return sha256(clone);
}

function projectFieldDerivation(doc) {
  return sha256({
    schemaVersion: doc.schemaVersion,
    bundleId: doc.bundleId,
    authorityBoundary: doc.authorityBoundary,
    authorityNote: doc.authorityNote,
    observations: doc.observations,
    sources: (doc.sources ?? []).map((entry) => ({ artifact: entry.artifact, role: entry.role })),
  });
}

function projectTaxonomy(doc) {
  return sha256({
    schemaVersion: doc.schemaVersion,
    bundleId: doc.bundleId,
    authorityBoundary: doc.authorityBoundary,
    authorityNote: doc.authorityNote,
    recordCount: doc.recordCount,
    roleCounts: doc.roleCounts,
    records: doc.records,
  });
}

function projectDTier(doc) {
  return sha256({
    schemaVersion: doc.schemaVersion,
    datasetId: doc.datasetId,
    authorityBoundary: doc.authorityBoundary,
    authorityNote: doc.authorityNote,
    recordCount: doc.recordCount,
    records: doc.records,
  });
}

const PROJECTIONS = {
  "payload-minus-bindings-and-r5": projectPlain,
  "promotion-payload": projectPromotion,
  "closure-payload": projectClosure,
  "field-derivation-payload": projectFieldDerivation,
  "taxonomy-payload": projectTaxonomy,
  "d-tier-payload": projectDTier,
};

function regionHashes(raw, [start, end]) {
  const lines = raw.toString("utf8").split("\n");
  const selected = lines.slice(start - 1, end);
  const lineJoin = selected.join("\n");
  const keepends = lineJoin === "" ? "" : `${lineJoin}\n`;
  return {
    span: `${start}-${end}`,
    sha256LineJoin: sha256Bytes(Buffer.from(lineJoin, "utf8")),
    byteLengthLineJoin: Buffer.byteLength(lineJoin, "utf8"),
    sha256Keepends: sha256Bytes(Buffer.from(keepends, "utf8")),
    byteLengthKeepends: Buffer.byteLength(keepends, "utf8"),
  };
}

function entry23Span(raw) {
  const lines = raw.toString("utf8").split("\n");
  const start = lines.findIndex((line) => line.startsWith("## ENTRY 23"));
  if (start === -1) fail("entry23_missing");
  const end = lines[lines.length - 1] === "" ? lines.length - 1 : lines.length;
  return [start + 1, end];
}

function expectedFences() {
  const bl051 = readJson(RECEIPTS.bl051);
  const bl052 = readJson(RECEIPTS.bl052);
  const bl053 = readJson(RECEIPTS.bl053);
  const bl091 = readJson(RECEIPTS.bl091);
  const ef = bl091.ledgerAppend.entryFences;
  return {
    entry10: { lineJoin: ef.entry10Region.regionSha256_lineJoinNoTrailingNewline, keepends: ef.entry10Region.regionSha256_keepends },
    entry15: { lineJoin: ef.entry15Region.regionSha256_lineJoinNoTrailingNewline, keepends: null },
    entry16: { lineJoin: ef.entry16Region.regionSha256_lineJoinNoTrailingNewline, keepends: null },
    entry17: { lineJoin: ef.entry17Region.regionSha256_lineJoinNoTrailingNewline, keepends: null },
    entry18: { lineJoin: ef.entry18Region.regionSha256_lineJoinNoTrailingNewline, keepends: ef.entry18Region.regionSha256_keepends },
    entry19: { lineJoin: bl051.ledger.entry19.regionSha256_lineJoinNoTrailingNewline, keepends: bl051.ledger.entry19.regionSha256_keepends },
    entry20: { lineJoin: bl052.ledger.entry20.regionSha256_lineJoinNoTrailingNewline, keepends: bl052.ledger.entry20.regionSha256_keepends },
    entry21: { lineJoin: bl053.ledger.entry21.regionSha256_lineJoinNoTrailingNewline, keepends: bl053.ledger.entry21.regionSha256_keepends },
    entry22: { lineJoin: bl091.ledgerAppend.entry22Attestation.sha256, keepends: bl091.ledgerAppend.entry22Attestation.keependsVariant.sha256 },
  };
}

function expectedPrefixes() {
  const bl091 = readJson(RECEIPTS.bl091);
  const pp = bl091.ledgerAppend.entryFences.prefixPreservation;
  return {
    174314: pp.preCorridor_174314,
    183663: pp.postEntry15_183663,
    202266: pp.postEntry17_202266,
    214223: pp.postEntry18_214223,
    233926: pp.preAdmission_233926,
  };
}

function projectionRegistry() {
  return PROJECTIONS;
}

function buildRecord() {
  const receipt = readJson(PRESERVATION_RECEIPT);
  const ledgerRaw = read(LEDGER_PATH);
  const preAppend = receipt.ledgerAtPreservation;
  if (sha256Bytes(ledgerRaw.subarray(0, preAppend.byteLength)) !== preAppend.sha256) {
    fail("pre_append_prefix_mismatch");
  }
  const postAppend = { sha256: sha256Bytes(ledgerRaw), byteLength: ledgerRaw.length };

  const preservedBySource = new Map(receipt.preserved.map((entry) => [entry.sourcePath, entry]));

  const preservation = {
    directory: PRESERVATION_DIR,
    receiptPath: PRESERVATION_RECEIPT,
    receiptSha256: sha256Bytes(read(PRESERVATION_RECEIPT)),
    files: receipt.preserved.map((entry) => {
      const bytes = read(entry.preservedPath);
      if (sha256Bytes(bytes) !== entry.sha256 || bytes.length !== entry.byteLength) {
        fail(`preserved_bytes_missing_or_drift:${entry.preservedPath}`);
      }
      return {
        sourcePath: entry.sourcePath,
        preservedPath: entry.preservedPath,
        sha256: entry.sha256,
        byteLength: entry.byteLength,
      };
    }),
  };

  const cascade = [];
  const observedStale = [];
  for (const spec of CASCADE) {
    const preserved = preservedBySource.get(spec.artifact);
    if (!preserved) fail(`preserved_entry_missing:${spec.artifact}`);
    const preDoc = readJson(preserved.preservedPath);
    const postDoc = readJson(spec.artifact);
    const preFingerprint = preDoc[spec.fingerprintField];
    const postFingerprint = postDoc[spec.fingerprintField];
    if (!preFingerprint || !postFingerprint) fail(`fingerprint_missing:${spec.artifact}`);
    const bindingPre = getPath(preDoc, spec.bindingPath);
    const bindingPost = getPath(postDoc, spec.bindingPath);
    if (bindingPre === postAppend.sha256) fail(`artifact_not_stale:${spec.artifact}`);
    if (bindingPost !== postAppend.sha256) fail(`binding_not_current:${spec.artifact}`);
    observedStale.push({ artifact: spec.artifact, bindingField: spec.bindingPath.join("."), preBinding: bindingPre, preAppendLedgerSha256: preAppend.sha256 });
    const project = projectionRegistry()[spec.projection];
    if (!project) fail(`projection_unknown:${spec.projection}`);
    const preProjection = project(preDoc);
    const postProjection = project(postDoc);
    if (preProjection !== postProjection) {
      fail(`${GEOMETRY_DRIFT_TOKEN}:${spec.artifact}`);
    }
    const entry = {
      artifact: spec.artifact,
      preFingerprint,
      postFingerprint,
      bindingField: spec.bindingPath.join("."),
      bindingPre,
      bindingPost,
      projectionRecipe: spec.projection,
      projectionSha256: preProjection,
      projectionUnchanged: true,
      validator: null,
    };
    if (spec.report) {
      const report = readJson(spec.report.path);
      if (report.verdict !== "PASS" || report.checksFailed !== 0) fail(`report_not_pass:${spec.report.path}`);
      entry.validator = {
        path: spec.report.path,
        verdict: report.verdict,
        checksPassed: report.checksPassed,
        checksFailed: report.checksFailed,
      };
    } else if (spec.artifact === "qa/pentatonic-binding-audit-closure.json") {
      if (postDoc.verdict !== "PASS" || postDoc.checksFailed !== 0) fail("closure_not_pass");
      entry.validator = { path: spec.artifact, verdict: postDoc.verdict, checksPassed: postDoc.checksPassed, checksFailed: postDoc.checksFailed };
    } else {
      if (postDoc.verdict !== "PASS") fail("promotion_not_pass");
      entry.validator = {
        path: spec.artifact,
        verdict: postDoc.verdict,
        itemEvidenceGroups: postDoc.itemEvidence.length,
        exclusionEvidenceGroups: postDoc.exclusionEvidence.length,
      };
    }
    cascade.push(entry);
  }

  const downstreamProjections = [];
  for (const spec of DOWNSTREAM) {
    const preserved = preservedBySource.get(spec.artifact);
    if (!preserved) fail(`preserved_entry_missing:${spec.artifact}`);
    const preDoc = readJson(preserved.preservedPath);
    const postDoc = readJson(spec.artifact);
    const project = projectionRegistry()[spec.projection];
    const preProjection = project(preDoc);
    const postProjection = project(postDoc);
    if (preProjection !== postProjection) fail(`${GEOMETRY_DRIFT_TOKEN}:${spec.artifact}`);
    downstreamProjections.push({
      artifact: spec.artifact,
      projectionRecipe: spec.projection,
      projectionSha256: preProjection,
      projectionUnchanged: true,
    });
  }

  const integratedPreserved = preservedBySource.get(INTEGRATED_RECEIPT);
  if (!integratedPreserved) fail("integrated_receipt_not_preserved");
  const integratedPre = readJson(integratedPreserved.preservedPath);
  const integratedPost = readJson(INTEGRATED_RECEIPT);
  const releaseClosure = {
    path: INTEGRATED_RECEIPT,
    pre: { sha256: integratedPreserved.sha256, verdict: integratedPre.verdict, releaseId: integratedPre.releaseId, checksPassed: integratedPre.checksPassed, checksFailed: integratedPre.checksFailed },
    post: { sha256: sha256Bytes(read(INTEGRATED_RECEIPT)), verdict: integratedPost.verdict, releaseId: integratedPost.releaseId, checksPassed: integratedPost.checksPassed, checksFailed: integratedPost.checksFailed },
    verdictInvariant:
      integratedPre.verdict === integratedPost.verdict &&
      integratedPre.releaseId === integratedPost.releaseId &&
      integratedPre.checksPassed === integratedPost.checksPassed &&
      integratedPre.checksFailed === integratedPost.checksFailed,
  };
  if (!releaseClosure.verdictInvariant) fail("release_closure_drift");

  const fencesExpected = expectedFences();
  const fences = {};
  for (const [name, span] of Object.entries(FENCE_SPANS)) {
    const live = regionHashes(ledgerRaw, span);
    if (live.sha256LineJoin !== fencesExpected[name].lineJoin) fail(`fence_linejoin_drift:${name}`);
    if (fencesExpected[name].keepends !== null && live.sha256Keepends !== fencesExpected[name].keepends) {
      fail(`fence_keepends_drift:${name}`);
    }
    fences[name] = { ...live, status: "byte-untouched" };
  }
  const prefixesExpected = expectedPrefixes();
  const prefixes = {};
  for (const count of PREFIX_COUNTS) {
    const live = sha256Bytes(ledgerRaw.subarray(0, count));
    if (live !== prefixesExpected[count]) fail(`prefix_drift:${count}`);
    prefixes[String(count)] = live;
  }
  prefixes[String(preAppend.byteLength)] = preAppend.sha256;
  const entry23 = { ...regionHashes(ledgerRaw, entry23Span(ledgerRaw)), status: "declared" };

  const dShadow = preservedBySource.get(VERIFIED_FRESH.artifact);
  if (!dShadow) fail("d_shadow_not_preserved");
  const dShadowDoc = readJson(dShadow.preservedPath);
  const dShadowBindings = JSON.stringify(dShadowDoc.evidenceBindings ?? {});
  if (/decisionLedger/i.test(dShadowBindings) || dShadowBindings.includes(preAppend.sha256)) {
    fail("d_shadow_carries_ledger_binding");
  }

  const refreshedPaths = [...CASCADE.map((spec) => spec.artifact), ...DOWNSTREAM.map((spec) => spec.artifact)];

  const ledger = {
    preAppendSha256: preAppend.sha256,
    preAppendByteLength: preAppend.byteLength,
    postAppendSha256: postAppend.sha256,
    postAppendByteLength: postAppend.byteLength,
    entry23,
  };

  const core = {
    schemaVersion: SCHEMA_VERSION,
    artifactId: ARTIFACT_ID,
    status: "hygiene_record",
    admissionEffect: "none",
    ticket: "BL-092",
    generator: "scripts/build-bl092-cascade-refresh.mjs",
    statement:
      "Provenance-only re-bind of the ledger-bound cascade against the ENTRY 23 amended ledger; payload projections byte-identical (the OD-2 geometry-drift halt pre-registered, not triggered); no claim event, no record amendment.",
    preservation,
    ledger,
    geometryDrift: {
      halt: "OD-2-class halt: any payload-projection byte difference is a halt, not a finding",
      status: "not_triggered",
      artifactsChecked: cascade.length + downstreamProjections.length,
      projectionsUnchanged: cascade.length + downstreamProjections.length,
    },
    refreshInventory: {
      observedStale,
      refreshed: refreshedPaths,
      verifiedFresh: {
        artifact: VERIFIED_FRESH.artifact,
        evidence: VERIFIED_FRESH.evidence,
        notRefreshed: true,
      },
    },
    cascade,
    releaseClosure,
    downstreamProjections,
    fences,
    prefixPreservation: prefixes,
    recursionTermination:
      "OD-92-4: the refreshed artifacts' bindings are born current against the ENTRY 23 ledger; the cascade converges at the BL-092 landing and re-opens only on the next ledger append, which begins its own refresh under the same discipline. The record's ledger references are prefix- and region-scoped so they remain verifiable as the ledger appends.",
  };
  const record = { ...core, artifactFingerprint: sha256(core) };
  return record;
}

function serialize(record) {
  return `${canonicalCompact(record)}\n`;
}

function main() {
  const check = process.argv.includes("--check");
  const record = buildRecord();
  const serialized = serialize(record);
  const outputPath = path.join(ROOT, OUTPUT_PATH);
  if (check) {
    const existing = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, "utf8") : null;
    if (existing !== serialized) throw new Error("STALE_BL092_CASCADE_REFRESH");
  } else {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, serialized);
  }
  console.log(JSON.stringify({
    output: OUTPUT_PATH,
    check,
    stale: false,
    ledger: { pre: record.ledger.preAppendSha256, post: record.ledger.postAppendSha256, bytes: record.ledger.postAppendByteLength },
    entry23: record.ledger.entry23.span,
    cascade: record.cascade.map((entry) => ({
      artifact: entry.artifact.split("/").pop(),
      pre: entry.preFingerprint.slice(0, 8),
      post: entry.postFingerprint.slice(0, 8),
      projection: entry.projectionSha256.slice(0, 8),
      unchanged: entry.projectionUnchanged,
    })),
    geometryDrift: record.geometryDrift.status,
    releaseClosure: record.releaseClosure.post,
    artifactFingerprint: record.artifactFingerprint,
  }, null, 2));
}

export { buildRecord, serialize, PROJECTIONS, GEOMETRY_DRIFT_TOKEN };

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}
