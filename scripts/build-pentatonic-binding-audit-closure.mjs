import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";

import { canonicalJsonBytes, sha256, sha256Bytes } from "../graph/runtime/canonical.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = path.join(root, "qa/pentatonic-binding-audit-closure.json");
const checkMode = process.argv.length === 3 && process.argv[2] === "--check";
if (process.argv.length > 2 && !checkMode) {
  throw new Error(`unsupported_arguments:${process.argv.slice(2).join(",")}`);
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath));
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath).toString("utf8"));
}

function fileSha256(relativePath) {
  return sha256Bytes(read(relativePath));
}

function withoutFingerprint(document, key) {
  const core = { ...document };
  delete core[key];
  return core;
}

function hasForbiddenIdentityKey(value) {
  if (Array.isArray(value)) return value.some(hasForbiddenIdentityKey);
  if (!value || typeof value !== "object") return false;
  const forbidden = new Set([
    "generatedAt", "timestamp", "provider", "locale", "hostname", "pid",
    "port", "tempDir",
  ]);
  return Object.entries(value).some(
    ([key, child]) => forbidden.has(key) || hasForbiddenIdentityKey(child),
  );
}

function buildReport() {
  const candidate = readJson(
    "canonical/pentatonic-binding-candidates/pentatonic-7-35-parent-audit-v1.json",
  );
  const phase1 = readJson("qa/pentatonic-7-35-parent-audit-validation.json");
  const phase2 = readJson("qa/pentatonic-binding-audit-neo4j-validation.json");
  const cypher = readJson("qa/neo4j-cypher-syntax-report.json");
  const crt310 = readJson("provenance/pentatonic-set-class-admission-backlog.json");
  const packageJson = readJson("package.json");
  const phase3Text = read(
    "docs/verification/PENTATONIC_GRAPH_BINDING_AUDIT_REPORT.md",
  ).toString("utf8");
  const authorityText = read("provenance/SOURCE_AUTHORITY.md").toString("utf8");
  const crt310Workflow = read("docs/CRT_310_ADMISSION_WORKFLOW.md").toString("utf8");

  const checks = [];
  const record = (checkId, passed, diagnostic) => checks.push({
    checkId,
    diagnostic,
    status: passed ? "PASS" : "FAIL",
  });

  record(
    "candidate-fingerprint-integrity",
    sha256(withoutFingerprint(candidate, "candidateFingerprint")) === candidate.candidateFingerprint
      && candidate.status === "planning_evidence"
      && candidate.admissionEffect === "none",
    candidate.candidateFingerprint,
  );
  record(
    "phase1-independent-validation",
    sha256(withoutFingerprint(phase1, "reportFingerprint")) === phase1.reportFingerprint
      && phase1.candidateFingerprint === candidate.candidateFingerprint
      && phase1.verdict === "PASS"
      && phase1.checksPassed === 19
      && phase1.checksFailed === 0,
    phase1.reportFingerprint,
  );
  const distribution = candidate.universeSummary?.parentCountDistribution;
  const distributionByCount = Object.fromEntries(
    (distribution ?? []).map((item) => [String(item.parentCount), item.pitchSetCount]),
  );
  record(
    "phase1-mathematical-closure",
    candidate.scope?.fiveNoteSetCount === 792
      && candidate.universeSummary?.pitchSetCount === 792
      && candidate.universeSummary?.incidenceCount === 252
      && candidate.classSummaries?.length === 38
      && candidate.reviewedRootedWitnesses?.length === 7
      && distributionByCount["0"] === 612
      && distributionByCount["1"] === 120
      && distributionByCount["2"] === 48
      && distributionByCount["3"] === 12,
    { distribution, incidenceCount: candidate.universeSummary?.incidenceCount },
  );
  const exactProjection = phase2.checks?.find((check) => check.checkId === "exact-projection");
  record(
    "phase2-detached-neo4j-closure",
    sha256(withoutFingerprint(phase2, "reportFingerprint")) === phase2.reportFingerprint
      && phase2.candidateFingerprint === candidate.candidateFingerprint
      && phase2.verdict === "PASS"
      && phase2.checksPassed === 11
      && phase2.checksFailed === 0
      && phase2.graphScope === "detached_audit_only"
      && exactProjection?.diagnostic?.realizationCount === 7
      && exactProjection?.diagnostic?.edgeCount === 19,
    phase2.reportFingerprint,
  );
  const activeHashCheck = phase2.checks?.find(
    (check) => check.checkId === "active-source-hash-parity",
  );
  const activeHashesCurrent = activeHashCheck
    && Object.entries(activeHashCheck.diagnostic).every(
      ([relativePath, expected]) => fileSha256(relativePath) === expected,
    );
  record(
    "active-source-and-decision-ledger-isolation",
    activeHashesCurrent
      && fileSha256("provenance/DECISION_LEDGER.md")
        === "32f08a16eeb4c13187939281621b4085fe377778539cc1268913e3cb285b9bc6",
    {
      activeSourceCount: Object.keys(activeHashCheck?.diagnostic ?? {}).length,
      decisionLedgerSha256: fileSha256("provenance/DECISION_LEDGER.md"),
    },
  );
  const phase3Boundaries = [
    "prose context, not admitted",
    "There is no sign-to-pitch-class assignment",
    "cardinality alone does not establish a 12-TET isomorphism",
    "does not prove luminary status",
    "physical identity or equivalence",
    "No zodiac record is admitted",
    "decision-ledger effect",
  ];
  const normalizedPhase3 = phase3Text.replace(/\s+/g, " ");
  record(
    "phase3-prose-tier-boundary",
    fileSha256("docs/verification/PENTATONIC_GRAPH_BINDING_AUDIT_REPORT.md")
      === "814512d4f4360dc7e9ab77b8190043a155ae8253d2729dbb21f33db91e37f1df"
      && (phase3Text.match(/^\| (?:[1-9]|1[0-2]) \|/gm) ?? []).length === 12
      && phase3Boundaries.every((phrase) => normalizedPhase3.includes(phrase)),
    fileSha256("docs/verification/PENTATONIC_GRAPH_BINDING_AUDIT_REPORT.md"),
  );
  const cypherDeterministic = {
    verdict: cypher.verdict,
    validator: cypher.validator,
    files: cypher.files,
  };
  record(
    "cypher-syntax-deterministic-closure",
    cypher.verdict === "PASS"
      && cypher.validator === "@neo4j-cypher/language-support"
      && cypher.files?.length === 23
      && cypher.files.every((file) => file.pass === true && file.diagnostics.length === 0),
    sha256(cypherDeterministic),
  );
  const crt310Core = withoutFingerprint(crt310, "backlogFingerprint");
  record(
    "crt310-zero-admission-boundary",
    sha256(crt310Core) === crt310.backlogFingerprint
      && crt310.status === "backlog"
      && crt310.admissionEffect === "none"
      && crt310.bulkPromotionAllowed === false
      && crt310.summary?.itemCount === 35
      && crt310.summary?.proposedCount === 35
      && crt310.summary?.eligibleForAdmissionReviewCount === 0
      && crt310.summary?.admittedCount === 0,
    crt310.summary,
  );
  record(
    "planning-evidence-cross-references",
    authorityText.includes("pentatonic-7-35-parent-audit-v1.json")
      && authorityText.includes("pentatonic-binding-audit-closure.json")
      && authorityText.includes("`planning_evidence`")
      && crt310Workflow.includes("`planning_evidence`")
      && !authorityText.includes("pentatonic binding audit admission authority"),
    "authority and CRT-310 workflow references remain planning_evidence only",
  );
  const scripts = packageJson.scripts ?? {};
  record(
    "package-entrypoint-closure",
    scripts["build:pentatonic-binding-audit"]
      === "python3 scripts/generate-pentatonic-7-35-parent-audit.py"
      && scripts["test:pentatonic-binding-audit"]?.includes(
        "tests/pentatonic_binding_audit/neo4j-live.test.mjs",
      )
      && scripts["validate:pentatonic-binding-audit"]?.includes(
        "scripts/validate-pentatonic-7-35-parent-audit.py",
      )
      && scripts["build:cypher"] === "node scripts/validate-cypher-syntax.mjs"
      && scripts["validate:cypher"] === "node scripts/validate-cypher-syntax.mjs --check",
    {
      build: scripts["build:pentatonic-binding-audit"],
      test: scripts["test:pentatonic-binding-audit"],
      validate: scripts["validate:pentatonic-binding-audit"],
    },
  );
  record(
    "intrinsic-environment-independence",
    !hasForbiddenIdentityKey({ candidate, phase1, phase2, crt310, checks }),
    "closure core excludes time, provider, host, process, port, and temporary-path identity",
  );

  const checksFailed = checks.filter((check) => check.status === "FAIL").length;
  const core = {
    schemaVersion: "pre-epic-400.pentatonic-binding-audit-closure.v1",
    reportId: "pentatonic-binding-audit-closure-v1",
    status: "planning_evidence",
    admissionEffect: "none",
    graphScope: "detached_audit_only",
    crt310Execution: false,
    verdict: checksFailed === 0 ? "PASS" : "FAIL",
    evidenceBindings: {
      candidateFingerprint: candidate.candidateFingerprint,
      phase1ValidationReportFingerprint: phase1.reportFingerprint,
      phase2Neo4jReportFingerprint: phase2.reportFingerprint,
      phase3ReportSha256: fileSha256(
        "docs/verification/PENTATONIC_GRAPH_BINDING_AUDIT_REPORT.md",
      ),
      cypherDeterministicFingerprint: sha256(cypherDeterministic),
      crt310BacklogFingerprint: crt310.backlogFingerprint,
      sourceAuthoritySha256: fileSha256("provenance/SOURCE_AUTHORITY.md"),
      decisionLedgerSha256: fileSha256("provenance/DECISION_LEDGER.md"),
    },
    counts: {
      pitchSetCount: candidate.universeSummary.pitchSetCount,
      incidenceCount: candidate.universeSummary.incidenceCount,
      classCount: candidate.classSummaries.length,
      reviewedRootedWitnessCount: candidate.reviewedRootedWitnesses.length,
      detachedRealizationCount: exactProjection?.diagnostic?.realizationCount ?? 0,
      subsetEdgeCount: exactProjection?.diagnostic?.edgeCount ?? 0,
      zodiacRecordCount: 12,
      proposedClassCount: crt310.summary.proposedCount,
    },
    checksPassed: checks.length - checksFailed,
    checksFailed,
    checks,
  };
  return { ...core, reportFingerprint: sha256(core) };
}

const report = buildReport();
const schema = readJson(
  "schemas/pentatonic-binding/pentatonic-binding-audit-closure-v1.schema.json",
);
const validate = new Ajv2020({ strict: true, allErrors: true }).compile(schema);
if (!validate(report)) {
  throw new Error(`closure_schema_invalid:${JSON.stringify(validate.errors)}`);
}
const serialized = Buffer.from(`${JSON.stringify(report, null, 2)}\n`, "utf8");
if (checkMode) {
  if (!fs.existsSync(outputPath) || !canonicalJsonBytes(readJson(
    "qa/pentatonic-binding-audit-closure.json",
  )).equals(canonicalJsonBytes(report))) {
    throw new Error("STALE_PENTATONIC_BINDING_AUDIT_CLOSURE");
  }
} else {
  fs.writeFileSync(outputPath, serialized);
}
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (report.verdict !== "PASS") process.exitCode = 1;
