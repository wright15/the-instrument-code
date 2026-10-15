#!/usr/bin/env node
/**
 * Validate the BL-092 ledger-bound cascade refresh hygiene record against its
 * sources, independently of the generator.
 *
 * Verification, in the fail-loud order:
 *   1. artifact fingerprint (canonical, self-consistent)
 *   2. identity envelope (hygiene record, no admission effect)
 *   3. preservation: receipt resolvable; receipt digest matches; the file set
 *      matches the receipt exactly; every preserved copy still hashes to its
 *      recorded raw-byte digest
 *   4. ledger: the recorded pre-append and post-append digests are byte-intact
 *      prefixes of the live ledger (append-only safe); the ENTRY 23 region
 *      recomputes from the live bytes
 *   5. cascade: pre values recomputed from the preserved copies; post values
 *      verified live while the live artifact still binds the recorded
 *      post-append ledger (era-scoped; superseded eras verify structurally)
 *   6. downstream projections: pre recomputed; live era verified by the
 *      recorded source fingerprints
 *   7. release closure: pre fields from the preserved copy; live verified
 *      while the era marker is present, else superseded
 *   8. fences: all nine entry regions recomputed from the live ledger and
 *      compared to the record AND to the historical pins in the BL-051,
 *      BL-052, BL-053 and BL-091 receipts
 *   9. prefix chain recomputed and compared
 *  10. geometry-drift block: not_triggered, all projections unchanged
 *  11. inventory closure: observed stale set, refreshed set, verified-fresh
 *      member
 *  12. static generator requirements (inventory literals, preservation path,
 *      the geometry-drift halt token) - proof-strip probes rejected
 * plus mutation probes (artifact-drift, fingerprint-zero, smuggled-read,
 * presence-strip) and a permissive probe (key order must not matter).
 * Fail-loud.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { canonicalJsonBytes, sha256, sha256Bytes } from "../../graph/runtime/canonical.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..", "..");

const ARTIFACT_PATH = "orrery/src/generated/bl092-cascade-refresh.v1.json";
const GENERATOR_PATH = "scripts/build-bl092-cascade-refresh.mjs";
const SCHEMA_VERSION = "harmonic-orrery.bl092-cascade-refresh.v1";
const ARTIFACT_ID = "BL092_CASCADE_REFRESH_V1";
const LEDGER_PATH = "provenance/DECISION_LEDGER.md";
const PRESERVATION_DIR = "qa/halt-evidence/twin-hub-convergence-pre-refresh-entry22";
const PRESERVATION_RECEIPT = `${PRESERVATION_DIR}/preservation-receipt.json`;
const INTEGRATED_RECEIPT = "qa/integrated-release-validation.json";
const D_SHADOW_ARTIFACT = "canonical/fivefold-incubator/d-shadow-complement-span-v0.json";

const R5_FIELDS = ["generator", "generatorDigest", "invocation", "generatedAt"];

const CASCADE_SPECS = new Map([
  ["canonical/fivefold-incubator/twin-hub-convergence-v0.json", {
    fingerprintField: "candidateFingerprint",
    bindingPath: ["evidenceBindings", "decisionLedgerSha256"],
    projection: "payload-minus-bindings-and-r5",
    report: "qa/twin-hub-convergence-validation.json",
  }],
  ["canonical/fivefold-incubator/fifth-space-census-v0.json", {
    fingerprintField: "candidateFingerprint",
    bindingPath: ["evidenceBindings", "decisionLedgerSha256"],
    projection: "payload-minus-bindings-and-r5",
    report: "qa/fifth-space-census-validation.json",
  }],
  ["canonical/fivefold-incubator/shadow-ladder-v0.json", {
    fingerprintField: "candidateFingerprint",
    bindingPath: ["evidenceBindings", "decisionLedgerSha256"],
    projection: "payload-minus-bindings-and-r5",
    report: "qa/shadow-ladder-validation.json",
  }],
  ["qa/pentatonic-binding-audit-closure.json", {
    fingerprintField: "reportFingerprint",
    bindingPath: ["evidenceBindings", "decisionLedgerSha256"],
    projection: "closure-payload",
    report: null,
  }],
  ["qa/fivefold-engine-promotion-evidence.json", {
    fingerprintField: "evidenceFingerprint",
    bindingPath: ["decisionLedgerSha256"],
    projection: "promotion-payload",
    report: null,
  }],
]);

const DOWNSTREAM_SPECS = new Map([
  ["orrery/src/generated/field-derivation-bundle.v1.json", {
    projection: "field-derivation-payload",
    eraMarker: (doc, post) =>
      (doc.sources ?? []).some((entry) =>
        entry.artifact === "canonical/fivefold-incubator/twin-hub-convergence-v0.json" &&
        entry.candidateFingerprint === post),
    eraFingerprint: (cascade) => cascade.get("canonical/fivefold-incubator/twin-hub-convergence-v0.json")?.postFingerprint ?? null,
  }],
  ["orrery/src/generated/taxonomy-read-model.v1.json", {
    projection: "taxonomy-payload",
    eraMarker: (doc, post) => doc.evidenceBindings?.census?.candidateFingerprint === post,
    eraFingerprint: (cascade) => cascade.get("canonical/fivefold-incubator/fifth-space-census-v0.json")?.postFingerprint ?? null,
  }],
  ["orrery/src/generated/d-tier-taxonomy-dataset.v1.json", {
    projection: "d-tier-payload",
    eraMarker: (doc, post) => doc.censusBinding?.candidateFingerprint === post,
    eraFingerprint: (cascade) => cascade.get("canonical/fivefold-incubator/fifth-space-census-v0.json")?.postFingerprint ?? null,
  }],
]);

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

function fail(message) {
  throw new Error(`INVALID_BL092_CASCADE_REFRESH: ${message}`);
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath));
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

function project(recipe, doc) {
  if (recipe === "payload-minus-bindings-and-r5") {
    const kept = Object.fromEntries(Object.entries(doc).filter(([key]) =>
      !["candidateFingerprint", "evidenceBindings", ...R5_FIELDS].includes(key)));
    return sha256(kept);
  }
  if (recipe === "promotion-payload") {
    const clone = structuredClone(doc);
    delete clone.evidenceFingerprint;
    delete clone.decisionLedgerSha256;
    for (const key of R5_FIELDS) delete clone[key];
    for (const group of clone.exclusionEvidence ?? []) {
      for (const check of group.checks ?? []) {
        if (check.checkId === "decision-ledger-digest") check.expected = check.actual = "";
      }
    }
    return sha256(clone);
  }
  if (recipe === "closure-payload") {
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
  if (recipe === "field-derivation-payload") {
    return sha256({
      schemaVersion: doc.schemaVersion,
      bundleId: doc.bundleId,
      authorityBoundary: doc.authorityBoundary,
      authorityNote: doc.authorityNote,
      observations: doc.observations,
      sources: (doc.sources ?? []).map((entry) => ({ artifact: entry.artifact, role: entry.role })),
    });
  }
  if (recipe === "taxonomy-payload") {
    const { schemaVersion, bundleId, authorityBoundary, authorityNote, recordCount, roleCounts, records } = doc;
    return sha256({ schemaVersion, bundleId, authorityBoundary, authorityNote, recordCount, roleCounts, records });
  }
  if (recipe === "d-tier-payload") {
    const { schemaVersion, datasetId, authorityBoundary, authorityNote, recordCount, records } = doc;
    return sha256({ schemaVersion, datasetId, authorityBoundary, authorityNote, recordCount, records });
  }
  fail(`projection_unknown:${recipe}`);
}

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

function parseSpan(span) {
  const match = /^(\d+)-(\d+)$/.exec(span ?? "");
  if (!match) fail("span_invalid");
  return [Number(match[1]), Number(match[2])];
}

function historicalFences() {
  const bl051 = readJson("qa/specs/bl-051-twin-hub-cascade-refresh.json");
  const bl052 = readJson("qa/specs/bl-052-promotion-refresh.json");
  const bl053 = readJson("qa/specs/bl-053-green-release.json");
  const bl091 = readJson("qa/specs/bl-091-d7-derivation-admission.json");
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

function historicalPrefixes() {
  const bl091 = readJson("qa/specs/bl-091-d7-derivation-admission.json");
  return {
    174314: bl091.ledgerAppend.entryFences.prefixPreservation.preCorridor_174314,
    183663: bl091.ledgerAppend.entryFences.prefixPreservation.postEntry15_183663,
    202266: bl091.ledgerAppend.entryFences.prefixPreservation.postEntry17_202266,
    214223: bl091.ledgerAppend.entryFences.prefixPreservation.postEntry18_214223,
    233926: bl091.ledgerAppend.entryFences.prefixPreservation.preAdmission_233926,
  };
}

function verifyRecord(record) {
  const { artifactFingerprint, ...core } = record;
  if (!/^[0-9a-f]{64}$/.test(artifactFingerprint ?? "")) fail("artifact_fingerprint_invalid");
  if (sha256(core) !== artifactFingerprint) fail("artifact_fingerprint_mismatch");
  if (record.schemaVersion !== SCHEMA_VERSION) fail("schema_version");
  if (record.artifactId !== ARTIFACT_ID) fail("artifact_id");
  if (record.status !== "hygiene_record" || record.admissionEffect !== "none") fail("envelope_status");
  if (record.ticket !== "BL-092" || record.generator !== GENERATOR_PATH) fail("envelope_ticket_generator");
  if (typeof record.statement !== "string" || record.statement.length < 80) fail("statement");

  const receiptBytes = read(record.preservation.receiptPath);
  if (record.preservation.directory !== PRESERVATION_DIR) fail("preservation_directory");
  if (record.preservation.receiptPath !== PRESERVATION_RECEIPT) fail("preservation_receipt_path");
  if (sha256Bytes(receiptBytes) !== record.preservation.receiptSha256) fail("preservation_receipt_digest");
  const receipt = JSON.parse(receiptBytes.toString("utf8"));
  const receiptFiles = receipt.preserved.map((entry) => ({
    sourcePath: entry.sourcePath,
    preservedPath: entry.preservedPath,
    sha256: entry.sha256,
    byteLength: entry.byteLength,
  }));
  if (!canonicalJsonBytes(receiptFiles).equals(canonicalJsonBytes(record.preservation.files))) {
    fail("preservation_file_set_mismatch");
  }
  for (const entry of record.preservation.files) {
    if (!entry.preservedPath.startsWith(`${PRESERVATION_DIR}/`)) fail(`preserved_path_out_of_scope:${entry.preservedPath}`);
    const bytes = read(entry.preservedPath);
    if (sha256Bytes(bytes) !== entry.sha256 || bytes.length !== entry.byteLength) {
      fail(`preserved_bytes_drift:${entry.preservedPath}`);
    }
  }
  const preservedBySource = new Map(record.preservation.files.map((entry) => [entry.sourcePath, entry]));

  const ledgerRaw = read(LEDGER_PATH);
  const { preAppendSha256, preAppendByteLength, postAppendSha256, postAppendByteLength } = record.ledger;
  if (preAppendSha256 !== receipt.ledgerAtPreservation.sha256) fail("pre_append_receipt_mismatch");
  if (preAppendByteLength !== receipt.ledgerAtPreservation.byteLength) fail("pre_append_length_receipt_mismatch");
  if (sha256Bytes(ledgerRaw.subarray(0, preAppendByteLength)) !== preAppendSha256) fail("pre_append_prefix_drift");
  if (sha256Bytes(ledgerRaw.subarray(0, postAppendByteLength)) !== postAppendSha256) fail("post_append_prefix_drift");
  if (ledgerRaw.length === postAppendByteLength && sha256Bytes(ledgerRaw) !== postAppendSha256) fail("post_append_digest");
  const liveEntry23 = regionHashes(ledgerRaw, parseSpan(record.ledger.entry23.span));
  if (liveEntry23.sha256LineJoin !== record.ledger.entry23.sha256LineJoin) fail("entry23_linejoin");
  if (liveEntry23.sha256Keepends !== record.ledger.entry23.sha256Keepends) fail("entry23_keepends");
  if (liveEntry23.byteLengthLineJoin !== record.ledger.entry23.byteLengthLineJoin) fail("entry23_length");

  const cascadeByArtifact = new Map();
  const cascadePaths = [];
  for (const entry of record.cascade) {
    const spec = CASCADE_SPECS.get(entry.artifact);
    if (!spec) fail(`cascade_artifact_unknown:${entry.artifact}`);
    cascadePaths.push(entry.artifact);
    cascadeByArtifact.set(entry.artifact, entry);
    const preserved = preservedBySource.get(entry.artifact);
    if (!preserved) fail(`cascade_not_preserved:${entry.artifact}`);
    const preDoc = JSON.parse(read(preserved.preservedPath).toString("utf8"));
    if (preDoc[spec.fingerprintField] !== entry.preFingerprint) fail(`pre_fingerprint:${entry.artifact}`);
    if (getPath(preDoc, spec.bindingPath) !== entry.bindingPre) fail(`pre_binding:${entry.artifact}`);
    if (project(entry.projectionRecipe, preDoc) !== entry.projectionSha256) fail(`pre_projection:${entry.artifact}`);
    if (entry.projectionRecipe !== spec.projection) fail(`projection_recipe:${entry.artifact}`);
    if (entry.projectionUnchanged !== true) fail(`projection_flag:${entry.artifact}`);
    if (entry.bindingPre === record.ledger.preAppendSha256) fail(`not_stale:${entry.artifact}`);
    if (entry.bindingPost !== record.ledger.postAppendSha256) fail(`binding_post:${entry.artifact}`);
    if (!/^[0-9a-f]{64}$/.test(entry.preFingerprint ?? "") || !/^[0-9a-f]{64}$/.test(entry.postFingerprint ?? "")) {
      fail(`fingerprint_shape:${entry.artifact}`);
    }
    const liveDoc = JSON.parse(read(entry.artifact).toString("utf8"));
    const liveBinding = getPath(liveDoc, spec.bindingPath);
    if (liveBinding === record.ledger.postAppendSha256) {
      if (liveDoc[spec.fingerprintField] !== entry.postFingerprint) fail(`live_fingerprint_drift:${entry.artifact}`);
      if (project(entry.projectionRecipe, liveDoc) !== entry.projectionSha256) fail(`live_projection_drift:${entry.artifact}`);
      if (spec.report) {
        const report = JSON.parse(read(spec.report).toString("utf8"));
        if (report.verdict !== entry.validator.verdict ||
            report.checksPassed !== entry.validator.checksPassed ||
            report.checksFailed !== entry.validator.checksFailed) {
          fail(`live_report_drift:${spec.report}`);
        }
      }
    }
    if (!entry.validator || entry.validator.verdict !== "PASS") fail(`validator_verdict:${entry.artifact}`);
  }

  for (const entry of record.downstreamProjections) {
    const spec = DOWNSTREAM_SPECS.get(entry.artifact);
    if (!spec) fail(`downstream_unknown:${entry.artifact}`);
    const preserved = preservedBySource.get(entry.artifact);
    if (!preserved) fail(`downstream_not_preserved:${entry.artifact}`);
    const preDoc = JSON.parse(read(preserved.preservedPath).toString("utf8"));
    if (entry.projectionRecipe !== spec.projection) fail(`downstream_recipe:${entry.artifact}`);
    if (project(entry.projectionRecipe, preDoc) !== entry.projectionSha256) fail(`downstream_pre_projection:${entry.artifact}`);
    if (entry.projectionUnchanged !== true) fail(`downstream_flag:${entry.artifact}`);
    const liveDoc = JSON.parse(read(entry.artifact).toString("utf8"));
    const eraFingerprint = spec.eraFingerprint(cascadeByArtifact);
    if (eraFingerprint && spec.eraMarker(liveDoc, eraFingerprint)) {
      if (project(entry.projectionRecipe, liveDoc) !== entry.projectionSha256) {
        fail(`downstream_live_projection_drift:${entry.artifact}`);
      }
    }
  }

  const integratedPreserved = preservedBySource.get(INTEGRATED_RECEIPT);
  if (!integratedPreserved) fail("integrated_receipt_not_preserved");
  if (record.releaseClosure.path !== INTEGRATED_RECEIPT) fail("release_closure_path");
  const integratedPre = JSON.parse(read(integratedPreserved.preservedPath).toString("utf8"));
  const pre = record.releaseClosure.pre;
  if (pre.sha256 !== integratedPreserved.sha256) fail("release_closure_pre_sha");
  for (const key of ["verdict", "releaseId", "checksPassed", "checksFailed"]) {
    if (pre[key] !== integratedPre[key]) fail(`release_closure_pre_${key}`);
  }
  const post = record.releaseClosure.post;
  if (record.releaseClosure.verdictInvariant !== true) fail("release_closure_invariant");
  for (const key of ["verdict", "releaseId", "checksPassed", "checksFailed"]) {
    if (post[key] !== pre[key]) fail(`release_closure_post_${key}`);
  }
  const integratedBytes = read(INTEGRATED_RECEIPT);
  if (sha256Bytes(integratedBytes) !== post.sha256) {
    if (integratedBytes.toString("utf8").includes(record.ledger.postAppendSha256)) {
      fail("release_closure_live_drift");
    }
  }

  const fencesExpected = historicalFences();
  for (const [name, span] of Object.entries(FENCE_SPANS)) {
    const recorded = record.fences[name];
    if (!recorded) fail(`fence_missing:${name}`);
    const live = regionHashes(ledgerRaw, span);
    if (recorded.sha256LineJoin !== live.sha256LineJoin) fail(`fence_live_linejoin:${name}`);
    if (recorded.sha256Keepends !== live.sha256Keepends) fail(`fence_live_keepends:${name}`);
    if (recorded.sha256LineJoin !== fencesExpected[name].lineJoin) fail(`fence_pin_linejoin:${name}`);
    if (fencesExpected[name].keepends !== null && recorded.sha256Keepends !== fencesExpected[name].keepends) {
      fail(`fence_pin_keepends:${name}`);
    }
    if (recorded.status !== "byte-untouched") fail(`fence_status:${name}`);
  }

  const prefixesExpected = historicalPrefixes();
  for (const count of PREFIX_COUNTS) {
    const live = sha256Bytes(ledgerRaw.subarray(0, count));
    if (record.prefixPreservation[String(count)] !== live) fail(`prefix_live:${count}`);
    if (record.prefixPreservation[String(count)] !== prefixesExpected[count]) fail(`prefix_pin:${count}`);
  }
  if (record.prefixPreservation[String(preAppendByteLength)] !== preAppendSha256) fail("prefix_preappend");

  const { geometryDrift } = record;
  if (!geometryDrift || geometryDrift.status !== "not_triggered") fail("geometry_drift_status");
  const expectedChecked = record.cascade.length + record.downstreamProjections.length;
  if (geometryDrift.artifactsChecked !== expectedChecked) fail("geometry_drift_checked");
  if (geometryDrift.projectionsUnchanged !== expectedChecked) fail("geometry_drift_unchanged");
  if (!geometryDrift.halt.includes("halt")) fail("geometry_drift_halt_statement");

  const observedStale = record.refreshInventory?.observedStale;
  if (!Array.isArray(observedStale) || observedStale.length !== record.cascade.length) fail("observed_stale_length");
  const stalePaths = observedStale.map((entry) => entry.artifact).sort();
  if (JSON.stringify(stalePaths) !== JSON.stringify([...cascadePaths].sort())) fail("observed_stale_paths");
  if (observedStale.some((entry) => entry.preBinding === record.ledger.preAppendSha256)) fail("observed_stale_pre_binding");
  const refreshed = record.refreshInventory?.refreshed;
  const expectedRefreshed = [...cascadePaths, ...record.downstreamProjections.map((entry) => entry.artifact)].sort();
  if (JSON.stringify([...(refreshed ?? [])].sort()) !== JSON.stringify(expectedRefreshed)) fail("refreshed_set");
  const fresh = record.refreshInventory?.verifiedFresh;
  if (!fresh || fresh.artifact !== D_SHADOW_ARTIFACT || fresh.notRefreshed !== true) fail("verified_fresh");
  const dShadowPreserved = preservedBySource.get(D_SHADOW_ARTIFACT);
  if (!dShadowPreserved) fail("verified_fresh_not_preserved");
  const dShadowDoc = JSON.parse(read(dShadowPreserved.preservedPath).toString("utf8"));
  if (/decisionLedger/i.test(JSON.stringify(dShadowDoc.evidenceBindings ?? {}))) fail("verified_fresh_carries_ledger_binding");
  if (cascadePaths.includes(D_SHADOW_ARTIFACT) || expectedRefreshed.includes(D_SHADOW_ARTIFACT)) fail("verified_fresh_refreshed");

  if (!record.recursionTermination || !record.recursionTermination.includes("born current")) fail("recursion_termination");
  return true;
}

function staticGeneratorRequirements(source) {
  const requirements = [
    ['const GEOMETRY_DRIFT_TOKEN = "GEOMETRY_DRIFT"', "geometry_drift_halt_token"],
    ["twin-hub-convergence-pre-refresh-entry22", "preservation_directory_literal"],
    ["not_triggered", "geometry_drift_status_literal"],
    ["canonical/fivefold-incubator/twin-hub-convergence-v0.json", "twin_hub_inventory_literal"],
    ["canonical/fivefold-incubator/fifth-space-census-v0.json", "census_inventory_literal"],
    ["canonical/fivefold-incubator/shadow-ladder-v0.json", "shadow_ladder_inventory_literal"],
    ["qa/pentatonic-binding-audit-closure.json", "closure_inventory_literal"],
    ["qa/fivefold-engine-promotion-evidence.json", "promotion_inventory_literal"],
    ["qa/integrated-release-validation.json", "release_closure_inventory_literal"],
  ];
  const missing = requirements.filter(([token]) => !source.includes(token)).map(([, name]) => name);
  if (missing.length) fail(`generator_static_missing:${missing.join(",")}`);
  return true;
}

function run() {
  const record = JSON.parse(read(ARTIFACT_PATH).toString("utf8"));
  verifyRecord(record);
  staticGeneratorRequirements(read(GENERATOR_PATH).toString("utf8"));

  let probesRejected = 0;
  let probesPassed = 0;
  const probeFailures = [];
  const reject = (name, mutate) => {
    const clone = structuredClone(record);
    try {
      mutate(clone);
      verifyRecord(clone);
    } catch {
      probesRejected += 1;
      return;
    }
    probeFailures.push(`${name}:expected-reject`);
  };

  reject("artifact-drift:post-fingerprint", (r) => { r.cascade[0].postFingerprint = "0".repeat(64); });
  reject("artifact-drift:pre-fingerprint", (r) => { r.cascade[1].preFingerprint = "1".repeat(64); });
  reject("artifact-drift:projection", (r) => { r.cascade[2].projectionSha256 = "2".repeat(64); });
  reject("artifact-drift:binding-pre", (r) => { r.cascade[3].bindingPre = "3".repeat(64); });
  reject("artifact-drift:binding-post", (r) => { r.cascade[4].bindingPost = "4".repeat(64); });
  reject("artifact-drift:checks-passed", (r) => { r.cascade[0].validator.checksPassed += 1; });
  reject("artifact-drift:checks-failed", (r) => { r.cascade[1].validator.checksFailed = 1; });
  reject("artifact-drift:projection-flag", (r) => { r.cascade[2].projectionUnchanged = false; });
  reject("artifact-drift:post-append-sha", (r) => { r.ledger.postAppendSha256 = "5".repeat(64); });
  reject("artifact-drift:entry23-region", (r) => { r.ledger.entry23.sha256LineJoin = "6".repeat(64); });
  reject("artifact-drift:fence-entry10", (r) => { r.fences.entry10.sha256LineJoin = "7".repeat(64); });
  reject("artifact-drift:fence-entry22-keepends", (r) => { r.fences.entry22.sha256Keepends = "8".repeat(64); });
  reject("artifact-drift:prefix", (r) => { r.prefixPreservation["233926"] = "9".repeat(64); });
  reject("artifact-drift:pre-append-sha", (r) => { r.ledger.preAppendSha256 = "a".repeat(64); });
  reject("artifact-drift:release-post-sha", (r) => { r.releaseClosure.post.sha256 = "b".repeat(64); });
  reject("artifact-drift:release-invariant", (r) => { r.releaseClosure.verdictInvariant = false; });
  reject("artifact-drift:release-counts", (r) => { r.releaseClosure.post.checksPassed = 417; });
  reject("artifact-drift:downstream-flag", (r) => { r.downstreamProjections[0].projectionUnchanged = false; });
  reject("artifact-drift:geometry-status", (r) => { r.geometryDrift.status = "triggered"; });
  reject("artifact-drift:geometry-count", (r) => { r.geometryDrift.artifactsChecked -= 1; });
  reject("artifact-drift:receipt-sha", (r) => { r.preservation.receiptSha256 = "c".repeat(64); });
  reject("artifact-drift:stale-list", (r) => { r.refreshInventory.observedStale.pop(); });
  reject("fingerprint-zero", (r) => { r.artifactFingerprint = "0".repeat(64); });
  reject("smuggled-read:cascade-extra", (r) => {
    r.cascade.push(structuredClone(r.cascade[0]));
    r.cascade[r.cascade.length - 1].artifact = D_SHADOW_ARTIFACT;
  });
  reject("smuggled-read:preserved-path", (r) => {
    r.preservation.files[0].preservedPath = "provenance/DECISION_LEDGER.md";
  });
  reject("smuggled-read:receipt-file-extra", (r) => {
    r.preservation.files.push({ sourcePath: "canonical/universal-network-data.json", preservedPath: `${PRESERVATION_DIR}/x.json`, sha256: "d".repeat(64), byteLength: 1 });
  });
  reject("smuggled-read:release-path", (r) => { r.releaseClosure.path = "qa/specs/bl-053-green-release.json"; });
  reject("presence-strip:cascade", (r) => { r.cascade.splice(0, 1); });
  reject("presence-strip:fence", (r) => { delete r.fences.entry15; });
  reject("presence-strip:geometry", (r) => { delete r.geometryDrift; });
  reject("presence-strip:release-pre", (r) => { delete r.releaseClosure.pre; });
  reject("presence-strip:downstream", (r) => { r.downstreamProjections.splice(0, 1); });
  reject("presence-strip:preservation-files", (r) => { r.preservation.files.splice(0, 1); });

  const generatorSource = read(GENERATOR_PATH).toString("utf8");
  const stripToken = generatorSource.replace('const GEOMETRY_DRIFT_TOKEN = "GEOMETRY_DRIFT"', 'const GEOMETRY_DRIFT_TOKEN = ""');
  let stripRejected = false;
  try {
    staticGeneratorRequirements(stripToken);
  } catch {
    stripRejected = true;
  }
  if (stripRejected) probesRejected += 1; else probeFailures.push("geometry-drift-proof-strip:halt-token:expected-reject");
  const stripPreservation = generatorSource.replace("twin-hub-convergence-pre-refresh-entry22", "other-directory");
  let preservationStripRejected = false;
  try {
    staticGeneratorRequirements(stripPreservation);
  } catch {
    preservationStripRejected = true;
  }
  if (preservationStripRejected) probesRejected += 1; else probeFailures.push("geometry-drift-proof-strip:preservation:expected-reject");

  const reorderKeys = (value) => {
    if (Array.isArray(value)) return value.map(reorderKeys);
    if (value && typeof value === "object") {
      const out = {};
      for (const key of Object.keys(value).sort().reverse()) out[key] = reorderKeys(value[key]);
      return out;
    }
    return value;
  };
  verifyRecord(reorderKeys(record));
  probesPassed += 1;

  if (probeFailures.length) fail(`probe_failures:${probeFailures.join(";")}`);

  return {
    verdict: "PASS",
    artifactFingerprint: record.artifactFingerprint,
    cascadeArtifacts: record.cascade.length,
    downstreamProjections: record.downstreamProjections.length,
    ledger: { preAppendSha256: record.ledger.preAppendSha256, postAppendSha256: record.ledger.postAppendSha256 },
    entry23: record.ledger.entry23.span,
    geometryDrift: record.geometryDrift.status,
    probesRejected,
    probesPassed,
    staticRequirements: "present",
  };
}

const result = run();
console.log(JSON.stringify(result, null, 2));
