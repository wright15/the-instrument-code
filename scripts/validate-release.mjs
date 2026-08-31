import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { canonicalJsonBytes } from "../graph/runtime/canonical.mjs";
import { recordFile, walkFiles } from "./manifest-utils.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(scriptDirectory, "..");
const checks = [];

function record(name, passed, diagnostic) {
  checks.push({
    name,
    status: passed ? "PASS" : "FAIL",
    diagnostic,
  });
}

async function read(relativePath) {
  return fs.readFile(path.join(packageRoot, relativePath));
}

async function hash(relativePath) {
  const bytes = await read(relativePath);
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

function payloadHash(value) {
  return crypto.createHash("sha256").update(canonicalJsonBytes(value)).digest("hex");
}

async function rowCount(relativePath) {
  const text = (await read(relativePath)).toString("utf8").trim();
  return text ? text.split(/\r?\n/).length - 1 : 0;
}

function runIn(relativeDirectory, command, args) {
  return spawnSync(command, args, {
    cwd: path.join(packageRoot, relativeDirectory),
    encoding: "utf8",
  });
}

function runNpmScript(relativeDirectory, script) {
  const result = runIn(relativeDirectory, "npm", ["run", script, "--silent"]);
  const tail =
    (result.stdout ?? "").trim().split(/\r?\n/).slice(-5).join("\n") ||
    (result.stderr ?? "").trim().split(/\r?\n/).slice(-5).join("\n");
  return { passed: result.status === 0, tail };
}

// ---------------------------------------------------------------------------
// 1. Topology release facts (existing core checks)
// ---------------------------------------------------------------------------

const release = JSON.parse((await read("provenance/release.json")).toString());
const developmentCycle = release.version.endsWith("-dev");
const declaredBaselineReleaseId = release.neo4jBaselineStatus?.retainedReleaseId;
const declaredBaselineStatus = developmentCycle
  ? "retained_previous_release_baseline"
  : "current_release_baseline";
const gov213Validate = runNpmScript(".", "validate:gov213");
// Tiered artifacts carry decimal-derived floats; validate their fingerprints with
// the native Python serializer rather than a cross-runtime JSON rehash.
const tieredValidate = runNpmScript(".", "validate:tiered-photonic");
const shadowLadderValidate = runNpmScript(".", "validate:shadow-ladder");
const gov227Validate = runNpmScript(".", "validate:gov227");
const orreryCatalogValidate = runNpmScript(".", "orrery:catalog:check");
const manifestValidate = runNpmScript(".", "validate:manifest");
const gov213Candidate = JSON.parse(
  (await read("canonical/harmonic-compression-candidates/CH_A012_q_v1.json")).toString(),
);
const gov213Report = JSON.parse(
  (await read("qa/harmonic-compression-candidates-validation.json")).toString(),
);
const tieredCandidate = JSON.parse(
  (await read("canonical/tiered-photonic-candidates/tiered-photonic-v1.json")).toString(),
);
const tieredReport = JSON.parse(
  (await read("qa/tiered-photonic-candidates-validation.json")).toString(),
);
const shadowLadderCandidate = JSON.parse(
  (await read("canonical/fivefold-incubator/shadow-ladder-v0.json")).toString(),
);
const shadowLadderReport = JSON.parse(
  (await read("qa/shadow-ladder-validation.json")).toString(),
);
const gov227Candidate = JSON.parse(
  (await read("canonical/harmonic-compression-candidates/CH_D17_q_v2.json")).toString(),
);
const gov227Report = JSON.parse(
  (await read("qa/d-tier-harmonic-compression-validation.json")).toString(),
);
const expectedImportOrder = [
  "neo4j/schema.cypher",
  "neo4j/import.cypher",
  "neo4j/provenance.cypher",
  "seven-governors-mutation-algebra-audit/neo4j/algebra-schema.cypher",
  "seven-governors-mutation-algebra-audit/neo4j/algebra-import.cypher",
  "seven-governors-canonical-feature-profile-registry-v0.1.1/neo4j/01_semantic_schema.cypher",
  "seven-governors-canonical-feature-profile-registry-v0.1.1/neo4j/02_semantic_import.cypher",
  "neo4j/governor-runtime/schema.cypher",
  "generated:GOV-206-policy-snapshot",
  "neo4j/court-mathematics/schema.cypher",
  "generated:CRT-306-verified-fixture-batches",
  "neo4j/gov-210/schema.cypher",
  "generated:GOV-210-canonical-batches",
];
record(
  "release manifest fixed point",
  manifestValidate.passed,
  manifestValidate.passed ? "passed" : manifestValidate.tail,
);
record(
  "Orrery legal-move catalog freshness",
  orreryCatalogValidate.passed,
  orreryCatalogValidate.passed ? "passed" : orreryCatalogValidate.tail,
);
record(
  "shadow-ladder source-derived planning-evidence validation",
  shadowLadderValidate.passed &&
    shadowLadderCandidate.status === "planning_evidence" &&
    shadowLadderReport.verdict === "PASS" &&
    shadowLadderReport.checksPassed === 37 &&
    shadowLadderReport.checksFailed === 0 &&
    shadowLadderReport.candidateFingerprint === shadowLadderCandidate.candidateFingerprint,
  shadowLadderValidate.passed ? "passed" : shadowLadderValidate.tail,
);
record(
  "release id",
  /^seven-governors-integrated-\d+\.\d+\.\d+(?:-dev)?$/.test(release.releaseId) &&
    release.releaseId === `seven-governors-integrated-${release.version}` &&
    release.status === (developmentCycle ? "development" : "validated_admitted"),
  { releaseId: release.releaseId, version: release.version },
);
record(
  "release root extension and declared database baseline",
  payloadHash(release.rootExtensions) === payloadHash([
    {
      storyId: "GOV-210",
      releaseId: "gov-210-availability-housing:1.0.0",
      fingerprint: "2b87a0ed677e4e75286ac2d6833d840fa674a051ffca1d3de5d92a8e979916df",
      authority: "informational_catalog_only",
    },
    {
      storyId: "GOV-211",
      releaseId: "gov-211-menu-organization:1.0.0",
      fingerprint: "798336db2b977d40d819b6b64282b88eda5191f44954a87a5bb2386a6b0ab98a",
      authority: "presentation_order_only",
    },
    {
      storyId: "GOV-213",
      releaseId: "harmonic-compression-candidate:CH_A012_q_v1:1.0.0",
      fingerprint: gov213Candidate.candidateFingerprint,
      authority: "scoped_A012_harmonic_descriptor_only",
    },
    {
      storyId: "GOV-2XX",
      releaseId: "tiered-photonic-candidate:CH_TIERED_v1:1.0.0",
      fingerprint: tieredCandidate.candidateFingerprint,
      authority: "informational_sidecar_only",
    },
    {
      storyId: "GOV-227",
      releaseId: "harmonic-compression-candidate:CH_D17_q_v2:1.0.0",
      fingerprint: gov227Candidate.candidateFingerprint,
      authority: "scoped_D17_harmonic_descriptor_only",
    },
    {
      storyId: "CRT-310",
      releaseId: "court-admission-backlog:crt-310:1",
      fingerprint: "ac8b31e31ad0fca8b5bcee9e7dee816a3e4e6c8095b429afdb23f8525ba9c19c",
      authority: "admission_planning_only",
    },
  ]) &&
    release.databaseBootstrap?.script === "scripts/bootstrap-neo4j.mjs" &&
    release.databaseBootstrap?.expectedNodeCount === 3061 &&
    release.databaseBootstrap?.expectedRelationshipCount === 10506 &&
    release.databaseBootstrap?.neo4jAuthority === false &&
    release.canonicalCounts?.gov227ScopedStates === 49 &&
    release.canonicalCounts?.gov227ScopedCoordinates === 2 &&
    release.neo4jBaselineStatus?.status === declaredBaselineStatus &&
    declaredBaselineReleaseId === (developmentCycle
      ? "seven-governors-integrated-1.8.1"
      : release.releaseId) &&
    release.neo4jBaselineStatus?.reproducibilityReceipt ===
      "qa/neo4j-full-database-validation.json" &&
    release.neo4jBaselineStatus?.deploymentReceipt ===
      "qa/neo4j-deployment-roundtrip-validation.json" &&
    release.databaseBootstrap?.normalizedSnapshotSchema ===
      "schemas/neo4j-normalized-snapshot.schema.json" &&
    release.databaseBootstrap?.readinessSchemaVersion ===
      "seven-governors.neo4j-full-readiness.v1" &&
    canonicalJsonBytes(release.importOrder).equals(canonicalJsonBytes(expectedImportOrder)) &&
    gov213Report.candidateFingerprint === gov213Candidate.candidateFingerprint &&
    tieredCandidate.candidateId === "CH_TIERED_v1" &&
    tieredCandidate.releaseId === "tiered-photonic-candidate:CH_TIERED_v1:1.0.0" &&
    tieredCandidate.records?.length === 28 &&
    tieredCandidate.invariants?.anchorCount === 14 &&
    tieredCandidate.invariants?.variantsPerAnchor === 2 &&
    tieredValidate.passed &&
    tieredReport.verdict === "PASS" &&
    tieredReport.checksPassed === 15 &&
    tieredReport.checksFailed === 0 &&
    tieredReport.candidateFingerprint === tieredCandidate.candidateFingerprint &&
    gov227Report.candidateFingerprint === gov227Candidate.candidateFingerprint,
  {
    rootExtensions: release.rootExtensions,
    databaseBootstrap: release.databaseBootstrap,
    importStages: release.importOrder?.length,
    tieredValidation: tieredValidate.passed ? "passed" : tieredValidate.tail,
  },
);
const frozenPackageManifests = await Promise.all(release.compositePackages.map(
  async (compositePackage) => ({
    packageId: compositePackage.packageId,
    expected: compositePackage.manifestSha256,
    actual: await hash(compositePackage.manifestPath),
    path: compositePackage.manifestPath,
  }),
));
record(
  "frozen composite package manifest identities",
  frozenPackageManifests.length === 7
    && frozenPackageManifests.every((item) => item.expected === item.actual),
  frozenPackageManifests,
);
const frozenPackagePayloadSpecs = [
  ["seven-governors-mutation-algebra-audit", "902619fce7f45dc52c30d4f245cb1ffee2caebc91f4504552acd26a489f28479"],
  ["seven-governors-canonical-feature-profile-registry-v0.1.1", "b80b16f1a4a11ea877e47f37350a9e7a289bd10394501f97a8557e220cd943c6"],
  ["seven-governors-state-machine-spec-and-authoring-toolkit-v0.2.0", "b7ebc16633e9694b72fdaeec5c6b3039a758d30019d5091fcca4829f12e23514"],
  ["seven-governors-governor-runtime-v0.1.0", "78234a5aea4d3d882e59cc70fe0b7bfd719704f10acf34160e455551a471f135"],
  ["seven-governors-court-substrate-v0.1.0", "bf0324074be036c4b939c2c2794a997c5c1f73808d8cf444c58395e4a6bc5f09"],
  ["seven-governors-harmonic-invariants-v0.1.0", "3bf5f1815369dba2b9ca918a743d18cf1aa388b12f9ba7915ee87e8d8c8363f1"],
  ["seven-governors-court-filter-algebra-v0.1.0", "a2ca514125ca5d0531c8a3c888f1f9f5bb3a152e858a308709fa4c4b9a973a59"],
];
const frozenPackagePayloads = await Promise.all(frozenPackagePayloadSpecs.map(
  async ([directory, expected]) => {
    const absoluteRoot = path.join(packageRoot, directory);
    const files = await walkFiles(absoluteRoot, {
      excluded: new Set([
        ".git", "MANIFEST.json", "PACKAGE_MANIFEST.json", "CHECKSUMS.sha256",
      ]),
    });
    const records = await Promise.all(
      files.map((absolutePath) => recordFile(absolutePath, absoluteRoot)),
    );
    return { directory, fileCount: records.length, expected, actual: payloadHash(records) };
  },
));
record(
  "frozen composite package payload identities",
  frozenPackagePayloads.every((item) => item.actual === item.expected),
  frozenPackagePayloads,
);
for (const source of release.frameworkSources) {
  const actual = await hash(source.path);
  record(
    `framework source hash: ${source.documentId}`,
    actual === source.sha256,
    { expected: source.sha256, actual, path: source.path },
  );
}

const canonical = JSON.parse(
  (await read("canonical/universal-network-data.json")).toString(),
);
const roleCounts = canonical.nodes.reduce((counts, node) => {
  counts[node.role] = (counts[node.role] ?? 0) + 1;
  return counts;
}, {});
record("canonical rooted states", canonical.nodes.length === 462, canonical.nodes.length);
record("canonical anchors", roleCounts.anchor === 70, roleCounts.anchor);
record("canonical satellites", roleCounts.satellite === 238, roleCounts.satellite);
record("canonical boundaries", roleCounts.boundary === 154, roleCounts.boundary);
record(
  "office-bearing states",
  canonical.nodes.filter((node) => node.office != null).length === 308,
  canonical.nodes.filter((node) => node.office != null).length,
);
record(
  "boundary office withheld",
  canonical.nodes
    .filter((node) => node.role === "boundary")
    .every((node) => node.office == null),
  "all boundary offices must be null",
);
record(
  "unique rooted state ids",
  new Set(canonical.nodes.map((node) => node.id)).size === 462,
  new Set(canonical.nodes.map((node) => node.id)).size,
);
record(
  "canonical relationship total",
  canonical.summary.graphEdges === 2594,
  canonical.summary.graphEdges,
);
record(
  "universal rendered relationship total",
  canonical.views.universal.edgeIds.length === 1824,
  canonical.views.universal.edgeIds.length,
);
record(
  "family registry",
  canonical.familyRegistry.length === 38,
  canonical.familyRegistry.length,
);

const csvExpectations = {
  "neo4j/csv/scale-states.csv": 462,
  "neo4j/csv/scale-families.csv": 38,
  "neo4j/csv/governor-offices.csv": 7,
  "neo4j/csv/governs.csv": 238,
  "neo4j/csv/constructs.csv": 28,
  "neo4j/csv/seat-contact.csv": 140,
  "neo4j/csv/modal-successor.csv": 182,
  "neo4j/csv/audited-hamming2.csv": 585,
  "neo4j/csv/phase-shift.csv": 175,
  "neo4j/csv/convergence-contact.csv": 210,
  "neo4j/csv/junction-contact.csv": 252,
  "neo4j/csv/leaf-contact.csv": 14,
  "neo4j/csv/belongs-to-family.csv": 462,
  "neo4j/csv/occupies-office.csv": 308,
  "neo4j/csv/relational-office-evidence.csv": 224,
  "neo4j/csv/relationships.csv": 2818
};
for (const [relativePath, expected] of Object.entries(csvExpectations)) {
  const actual = await rowCount(relativePath);
  record(`CSV rows: ${path.basename(relativePath)}`, actual === expected, {
    expected,
    actual,
  });
}

// ---------------------------------------------------------------------------
// 2. Mutation algebra audit
// ---------------------------------------------------------------------------

const auditRows = {
  "seven-governors-mutation-algebra-audit/audit/operator-registry.csv": 15,
  "seven-governors-mutation-algebra-audit/audit/operator-applications.csv": 3402,
  "seven-governors-mutation-algebra-audit/audit/cycle-identities.csv": 66,
  "seven-governors-mutation-algebra-audit/audit/commutation-summary.csv": 91,
  "seven-governors-mutation-algebra-audit/audit/inverse-witnesses.csv": 3402,
};
for (const [relativePath, expected] of Object.entries(auditRows)) {
  const actual = await rowCount(relativePath);
  record(`audit rows: ${path.basename(relativePath)}`, actual === expected, {
    expected,
    actual,
  });
}
const auditReport = JSON.parse(
  (
    await read(
      "seven-governors-mutation-algebra-audit/qa/mutation-algebra-validation.json",
    )
  ).toString(),
);
record(
  "audit validation report",
  auditReport.allPass === true,
  {
    allPass: auditReport.allPass,
    assertions: auditReport.assertions?.length ?? null,
    counts: auditReport.counts ?? null,
  },
);
const auditSchemaCheck = runNpmScript(
  "seven-governors-mutation-algebra-audit",
  "validate:schema",
);
record(
  "audit operator-registry schema",
  auditSchemaCheck.passed,
  auditSchemaCheck.passed ? "passed" : auditSchemaCheck.tail,
);
const auditCypherCheck = runNpmScript(
  "seven-governors-mutation-algebra-audit",
  "validate:cypher",
);
record(
  "audit cypher syntax",
  auditCypherCheck.passed,
  auditCypherCheck.passed ? "passed" : auditCypherCheck.tail,
);

// ---------------------------------------------------------------------------
// 3. Canonical feature profile registry (semantic registry)
// ---------------------------------------------------------------------------

const registryValidate = runNpmScript(
  "seven-governors-canonical-feature-profile-registry-v0.1.1",
  "validate",
);
record(
  "profile registry full validation",
  registryValidate.passed,
  registryValidate.passed ? "passed" : registryValidate.tail,
);
const registryReport = JSON.parse(
  (
    await read(
      "seven-governors-canonical-feature-profile-registry-v0.1.1/qa/validation-report.json",
    )
  ).toString(),
);
record(
  "profile registry report",
  registryReport.status === "passed" && registryReport.failedCount === 0,
  {
    status: registryReport.status,
    failedCount: registryReport.failedCount,
  },
);

// ---------------------------------------------------------------------------
// 4. Governor runtime policy contracts (post-1.2.0 candidate package)
// ---------------------------------------------------------------------------

const governorRuntimeValidate = runNpmScript(
  "seven-governors-governor-runtime-v0.1.0",
  "validate",
);
record(
  "governor runtime validation",
  governorRuntimeValidate.passed,
  governorRuntimeValidate.passed ? "passed" : governorRuntimeValidate.tail,
);
const governorRuntimeReport = JSON.parse(
  (
    await read(
      "seven-governors-governor-runtime-v0.1.0/qa/validation-report.json",
    )
  ).toString(),
);
record(
  "governor runtime report",
  governorRuntimeReport.status === "passed" &&
    governorRuntimeReport.summary?.failed === 0 &&
    governorRuntimeReport.packageVersion === "0.1.0" &&
    governorRuntimeReport.releaseId === "governor-runtime:0.1.0",
  {
    status: governorRuntimeReport.status,
    failed: governorRuntimeReport.summary?.failed,
    packageVersion: governorRuntimeReport.packageVersion,
    releaseId: governorRuntimeReport.releaseId,
    policyFingerprint: governorRuntimeReport.policyFingerprint,
  },
);
const governorRuntimeDeterminism = JSON.parse(
  (
    await read(
      "seven-governors-governor-runtime-v0.1.0/qa/determinism-report.json",
    )
  ).toString(),
);
record(
  "governor runtime determinism",
  governorRuntimeDeterminism.status === "passed" &&
    governorRuntimeDeterminism.summary?.failed === 0 &&
    governorRuntimeDeterminism.summary?.checks === 4,
  {
    status: governorRuntimeDeterminism.status,
    failed: governorRuntimeDeterminism.summary?.failed,
    checks: governorRuntimeDeterminism.summary?.checks,
  },
);

// ---------------------------------------------------------------------------
// 5. Court substrate registry (post-1.2.0 candidate package)
// ---------------------------------------------------------------------------

const courtSubstrateValidate = runNpmScript(
  "seven-governors-court-substrate-v0.1.0",
  "validate",
);
record(
  "court substrate validation",
  courtSubstrateValidate.passed,
  courtSubstrateValidate.passed ? "passed" : courtSubstrateValidate.tail,
);
const courtSubstrateReport = JSON.parse(
  (
    await read(
      "seven-governors-court-substrate-v0.1.0/qa/validation-report.json",
    )
  ).toString(),
);
record(
  "court substrate report",
  courtSubstrateReport.status === "passed" &&
    courtSubstrateReport.summary?.failed === 0 &&
    courtSubstrateReport.packageVersion === "0.1.0" &&
    courtSubstrateReport.releaseId === "court-substrate:0.1.0",
  {
    status: courtSubstrateReport.status,
    failed: courtSubstrateReport.summary?.failed,
    packageVersion: courtSubstrateReport.packageVersion,
    releaseId: courtSubstrateReport.releaseId,
    substrateFingerprint: courtSubstrateReport.substrateFingerprint,
  },
);
const courtSubstrateDeterminism = JSON.parse(
  (
    await read(
      "seven-governors-court-substrate-v0.1.0/qa/determinism-report.json",
    )
  ).toString(),
);
record(
  "court substrate determinism",
  courtSubstrateDeterminism.status === "passed" &&
    courtSubstrateDeterminism.summary?.failed === 0 &&
    courtSubstrateDeterminism.summary?.checks === 4,
  {
    status: courtSubstrateDeterminism.status,
    failed: courtSubstrateDeterminism.summary?.failed,
    checks: courtSubstrateDeterminism.summary?.checks,
  },
);

// ---------------------------------------------------------------------------
// 6. Harmonic invariant registry (post-1.2.0 candidate package)
// ---------------------------------------------------------------------------

const harmonicInvariantValidate = runNpmScript(
  "seven-governors-harmonic-invariants-v0.1.0",
  "validate",
);
record(
  "harmonic invariant validation",
  harmonicInvariantValidate.passed,
  harmonicInvariantValidate.passed ? "passed" : harmonicInvariantValidate.tail,
);
const harmonicInvariantReport = JSON.parse(
  (
    await read(
      "seven-governors-harmonic-invariants-v0.1.0/qa/validation-report.json",
    )
  ).toString(),
);
record(
  "harmonic invariant report",
  harmonicInvariantReport.status === "passed" &&
    harmonicInvariantReport.summary?.failed === 0 &&
    harmonicInvariantReport.summary?.checks === 11 &&
    harmonicInvariantReport.packageVersion === "0.1.0" &&
    harmonicInvariantReport.releaseId === "harmonic-invariants:0.1.0",
  {
    status: harmonicInvariantReport.status,
    failed: harmonicInvariantReport.summary?.failed,
    checks: harmonicInvariantReport.summary?.checks,
    packageVersion: harmonicInvariantReport.packageVersion,
    releaseId: harmonicInvariantReport.releaseId,
    invariantFingerprint: harmonicInvariantReport.invariantFingerprint,
  },
);
const harmonicInvariantDeterminism = JSON.parse(
  (
    await read(
      "seven-governors-harmonic-invariants-v0.1.0/qa/determinism-report.json",
    )
  ).toString(),
);
record(
  "harmonic invariant determinism",
  harmonicInvariantDeterminism.status === "passed" &&
    harmonicInvariantDeterminism.summary?.failed === 0 &&
    harmonicInvariantDeterminism.summary?.checks === 4,
  {
    status: harmonicInvariantDeterminism.status,
    failed: harmonicInvariantDeterminism.summary?.failed,
    checks: harmonicInvariantDeterminism.summary?.checks,
  },
);

// ---------------------------------------------------------------------------
// 7. Court filter algebra (post-1.2.0 candidate package)
// ---------------------------------------------------------------------------

const courtFilterValidate = runNpmScript(
  "seven-governors-court-filter-algebra-v0.1.0",
  "validate",
);
record(
  "court filter algebra validation",
  courtFilterValidate.passed,
  courtFilterValidate.passed ? "passed" : courtFilterValidate.tail,
);
const courtFilterReport = JSON.parse(
  (
    await read(
      "seven-governors-court-filter-algebra-v0.1.0/qa/validation-report.json",
    )
  ).toString(),
);
record(
  "court filter algebra report",
  courtFilterReport.status === "passed" &&
    courtFilterReport.summary?.failed === 0 &&
    courtFilterReport.summary?.checks === 8 &&
    courtFilterReport.packageVersion === "0.1.0" &&
    courtFilterReport.releaseId === "court-filter-algebra:0.1.0",
  {
    status: courtFilterReport.status,
    failed: courtFilterReport.summary?.failed,
    checks: courtFilterReport.summary?.checks,
    packageVersion: courtFilterReport.packageVersion,
    releaseId: courtFilterReport.releaseId,
    filterAlgebraFingerprint: courtFilterReport.filterAlgebraFingerprint,
  },
);
const courtFilterDeterminism = JSON.parse(
  (
    await read(
      "seven-governors-court-filter-algebra-v0.1.0/qa/determinism-report.json",
    )
  ).toString(),
);
record(
  "court filter algebra determinism",
  courtFilterDeterminism.status === "passed" &&
    courtFilterDeterminism.summary?.failed === 0 &&
    courtFilterDeterminism.summary?.checks === 4,
  {
    status: courtFilterDeterminism.status,
    failed: courtFilterDeterminism.summary?.failed,
    checks: courtFilterDeterminism.summary?.checks,
  },
);

// ---------------------------------------------------------------------------
// 8. Court runtime policy and lifecycle (post-1.2.0 candidate surface)
// ---------------------------------------------------------------------------

const courtRuntimeValidate = runNpmScript(".", "validate:court-runtime");
record(
  "court runtime lifecycle validation",
  courtRuntimeValidate.passed,
  courtRuntimeValidate.passed ? "passed" : courtRuntimeValidate.tail,
);
const courtRuntimePolicy = JSON.parse(
  (await read("schemas/court-runtime-policy.json")).toString(),
);
record(
  "court runtime policy contract",
  courtRuntimePolicy.schemaVersion === "crt-305.court-runtime-policy.v1" &&
    courtRuntimePolicy.policyId === "court-runtime-policy:0.1.0" &&
    courtRuntimePolicy.integratedAdmission === "proposed_pending_crt_309" &&
    courtRuntimePolicy.policyFingerprint ===
      "90431c79b8bc06da7e6f5cb5ce207cb6cbfd86519bdb91df5aacc137065ec456" &&
    courtRuntimePolicy.positions?.length === 5 &&
    courtRuntimePolicy.ordinaryMoves?.length === 8 &&
    courtRuntimePolicy.dependencies?.length === 8 &&
    courtRuntimePolicy.forbiddenKappaNamespaces?.length === 7 &&
    courtRuntimePolicy.translocationEvidence?.directions?.length === 2 &&
    courtRuntimePolicy.translocationEvidence?.routes?.length === 4,
  {
    policyId: courtRuntimePolicy.policyId,
    policyFingerprint: courtRuntimePolicy.policyFingerprint,
    positionCount: courtRuntimePolicy.positions?.length,
    ordinaryMoveCount: courtRuntimePolicy.ordinaryMoves?.length,
    dependencyCount: courtRuntimePolicy.dependencies?.length,
  },
);
const courtRuntimeDependencyChecks = await Promise.all(
  courtRuntimePolicy.dependencies.map(async (dependency) => ({
    dependencyId: dependency.dependencyId,
    expected: dependency.sha256,
    actual: await hash(dependency.path),
  })),
);
record(
  "court runtime dependency closure",
  courtRuntimeDependencyChecks.every(
    (dependency) => dependency.actual === dependency.expected,
  ),
  courtRuntimeDependencyChecks,
);

const courtGraphValidate = runNpmScript(".", "test:court-graph");
record(
  "court graph replay projection validation",
  courtGraphValidate.passed,
  courtGraphValidate.passed ? "passed" : courtGraphValidate.tail,
);
const gov210Validate = runNpmScript(".", "validate:gov210");
record(
  "GOV-210 availability and housing projection validation",
  gov210Validate.passed,
  gov210Validate.passed ? "passed" : gov210Validate.tail,
);
const gov210Projection = JSON.parse(
  (await read("canonical/gov-210-availability-housing.json")).toString(),
);
record(
  "GOV-210 canonical coverage and non-authority contract",
  gov210Projection.schemaVersion === "gov-210.graph-projection.v1" &&
    gov210Projection.releaseId === "gov-210-availability-housing:1.0.0" &&
    gov210Projection.authority === "informational_catalog_only" &&
    gov210Projection.runtimeAuthority === false &&
    gov210Projection.counts?.availabilityCount === 10 &&
    gov210Projection.counts?.eligibilityCount === 10 &&
    gov210Projection.counts?.assignmentCount === 1873 &&
    gov210Projection.counts?.topologyTargetCount === 462 &&
    gov210Projection.counts?.courtTargetCount === 5 &&
    gov210Projection.coverage?.mutationApplicationCount === 3402 &&
    gov210Projection.coverage?.mutationOperatorCount === 15 &&
    gov210Projection.coverage?.courtOrdinaryMoveCount === 8,
  {
    projectionFingerprint: gov210Projection.projectionFingerprint,
    counts: gov210Projection.counts,
    coverage: gov210Projection.coverage,
  },
);
const gov210SourceChecks = await Promise.all(
  gov210Projection.sourceBindings.map(async (binding) => ({
    path: binding.path,
    expected: binding.sha256,
    actual: await hash(binding.path),
  })),
);
record(
  "GOV-210 source fingerprint closure",
  gov210SourceChecks.length === 8 &&
    gov210SourceChecks.every((binding) => binding.actual === binding.expected),
  gov210SourceChecks,
);
record(
  "GOV-210 legacy projection fingerprint isolation",
  (await hash("graph/runtime/query-catalog.mjs")) ===
      "c6e7f5a4bb87f0fb190e54bc5879271408d38c83fd58dbc2f6953f0523fd5e94" &&
    (await hash("src/governor/court_graph_queries.py")) ===
      "3442e4cd03a3885a5cd7706d8146974eba20fc564edf08acb4bb2db0479ddcc8",
  "GOV-206 and CRT-306 query catalogs retain their release 1.3.0 bytes",
);
const gov211Validate = runNpmScript(".", "validate:gov211");
record(
  "GOV-211 assignment-aware menu validation",
  gov211Validate.passed,
  gov211Validate.passed ? "passed" : gov211Validate.tail,
);
const gov211Policy = JSON.parse(
  (await read("schemas/gov-211/menu-organization-policy.json")).toString(),
);
const gov211PolicyCore = { ...gov211Policy };
delete gov211PolicyCore.policyFingerprint;
record(
  "GOV-211 presentation-only policy closure",
  gov211Policy.schemaVersion === "gov-211.menu-organization-policy.v1" &&
    gov211Policy.authority === "presentation_order_only" &&
    gov211Policy.runtimeAuthority === false &&
    gov211Policy.policyFingerprint ===
      "798336db2b977d40d819b6b64282b88eda5191f44954a87a5bb2386a6b0ab98a" &&
    payloadHash(gov211PolicyCore) === gov211Policy.policyFingerprint &&
    gov211Policy.fallback?.preserveOriginalOrder === true &&
    gov211Policy.fallback?.preserveOriginalMembership === true &&
    gov211Policy.fallback?.preserveMoves === true &&
    gov211Policy.fallback?.preserveExecutorExposure === true,
  {
    policyFingerprint: gov211Policy.policyFingerprint,
    authority: gov211Policy.authority,
    runtimeAuthority: gov211Policy.runtimeAuthority,
  },
);
record(
  "GOV-211 closed-runtime and GOV-210 identity isolation",
  gov210Projection.projectionFingerprint ===
      "2b87a0ed677e4e75286ac2d6833d840fa674a051ffca1d3de5d92a8e979916df" &&
    (await hash("canonical/gov-210-availability-housing.json")) ===
      "7382b8ca818682a95b9f6f8d75e3130762ae992f761c1e25de7e31905d214858" &&
    (await hash("skills/governor/registry.json")) ===
      "f326aabe01c4be4d80589c84c7b8e9591e283c50d63d4b40b140bab11fbf64ae" &&
    (await hash("skills/court/registry.json")) ===
      "9eb2f62a6c30f6e608c37d9c9c383917f26475ec9d33c4a4b471bddd67803ca3" &&
    (await hash("src/governor/agent_api.py")) ===
      "75dc3baf00209697e61218338e52363c6a6b23563e7426039c7f5e25ba833804" &&
    (await hash("src/governor/court_agent_api.py")) ===
      "9b842b3b09580e17bf6b6169b7ea6a8d9d22462c36c3ca6762c2de8e38d90e39",
  "GOV-207, CRT-307, and GOV-210 release identities retain their 1.3.0 bytes",
);
const crt310Validate = runNpmScript(".", "validate:crt310");
record(
  "CRT-310 per-class admission backlog validation",
  crt310Validate.passed,
  crt310Validate.passed ? "passed" : crt310Validate.tail,
);
const crt310Backlog = JSON.parse(
  (await read("provenance/pentatonic-set-class-admission-backlog.json")).toString(),
);
const crt310Report = JSON.parse(
  (await read("qa/pentatonic-set-class-admission-backlog-validation.json")).toString(),
);
const crt310BacklogCore = { ...crt310Backlog };
delete crt310BacklogCore.backlogFingerprint;
const crt310ReportCore = { ...crt310Report };
delete crt310ReportCore.reportFingerprint;
record(
  "CRT-310 zero-admission and fingerprint closure",
  crt310Backlog.backlogFingerprint ===
      "ac8b31e31ad0fca8b5bcee9e7dee816a3e4e6c8095b429afdb23f8525ba9c19c" &&
    payloadHash(crt310BacklogCore) === crt310Backlog.backlogFingerprint &&
    crt310Backlog.items?.length === 35 &&
    crt310Backlog.summary?.admittedCount === 0 &&
    crt310Backlog.summary?.eligibleForAdmissionReviewCount === 0 &&
    crt310Backlog.bulkPromotionAllowed === false &&
    crt310Report.verdict === "PASS" &&
    crt310Report.checksPassed === 12 &&
    crt310Report.checksFailed === 0 &&
    crt310Report.checks?.length === 12 &&
    new Set(crt310Report.checks.map((check) => check.checkId)).size === 12 &&
    crt310Report.checks.every((check) => check.status === "PASS") &&
    payloadHash(crt310ReportCore) === crt310Report.reportFingerprint,
  {
    backlogFingerprint: crt310Backlog.backlogFingerprint,
    summary: crt310Backlog.summary,
    reportFingerprint: crt310Report.reportFingerprint,
  },
);
const pentatonicBindingValidate = runNpmScript(".", "validate:pentatonic-binding-audit");
record(
  "pentatonic binding planning-evidence validation",
  pentatonicBindingValidate.passed,
  pentatonicBindingValidate.passed ? "passed" : pentatonicBindingValidate.tail,
);
const pentatonicClosureCheck = runIn(
  ".",
  "node",
  ["scripts/build-pentatonic-binding-audit-closure.mjs", "--check"],
);
record(
  "pentatonic binding closure freshness",
  pentatonicClosureCheck.status === 0,
  pentatonicClosureCheck.status === 0
    ? "passed"
    : (pentatonicClosureCheck.stderr || pentatonicClosureCheck.stdout).trim().split(/\r?\n/).slice(-5).join("\n"),
);
const pentatonicCandidate = JSON.parse(
  (await read(
    "canonical/pentatonic-binding-candidates/pentatonic-7-35-parent-audit-v1.json",
  )).toString(),
);
const pentatonicPhase1Report = JSON.parse(
  (await read("qa/pentatonic-7-35-parent-audit-validation.json")).toString(),
);
const pentatonicPhase2Report = JSON.parse(
  (await read("qa/pentatonic-binding-audit-neo4j-validation.json")).toString(),
);
const pentatonicClosure = JSON.parse(
  (await read("qa/pentatonic-binding-audit-closure.json")).toString(),
);
const cypherSyntaxReport = JSON.parse(
  (await read("qa/neo4j-cypher-syntax-report.json")).toString(),
);
const pentatonicCandidateCore = { ...pentatonicCandidate };
delete pentatonicCandidateCore.candidateFingerprint;
const pentatonicPhase1Core = { ...pentatonicPhase1Report };
delete pentatonicPhase1Core.reportFingerprint;
const pentatonicPhase2Core = { ...pentatonicPhase2Report };
delete pentatonicPhase2Core.reportFingerprint;
const pentatonicClosureCore = { ...pentatonicClosure };
delete pentatonicClosureCore.reportFingerprint;
const cypherSyntaxCore = {
  verdict: cypherSyntaxReport.verdict,
  validator: cypherSyntaxReport.validator,
  files: cypherSyntaxReport.files,
};
record(
  "pentatonic binding evidence fingerprint closure",
  payloadHash(pentatonicCandidateCore) === pentatonicCandidate.candidateFingerprint &&
    payloadHash(pentatonicPhase1Core) === pentatonicPhase1Report.reportFingerprint &&
    payloadHash(pentatonicPhase2Core) === pentatonicPhase2Report.reportFingerprint &&
    payloadHash(pentatonicClosureCore) === pentatonicClosure.reportFingerprint &&
    pentatonicClosure.evidenceBindings?.candidateFingerprint ===
      pentatonicCandidate.candidateFingerprint &&
    pentatonicClosure.evidenceBindings?.phase1ValidationReportFingerprint ===
      pentatonicPhase1Report.reportFingerprint &&
    pentatonicClosure.evidenceBindings?.phase2Neo4jReportFingerprint ===
      pentatonicPhase2Report.reportFingerprint &&
    pentatonicClosure.evidenceBindings?.phase3ReportSha256 ===
      await hash("docs/verification/PENTATONIC_GRAPH_BINDING_AUDIT_REPORT.md") &&
    pentatonicClosure.evidenceBindings?.cypherDeterministicFingerprint ===
      payloadHash(cypherSyntaxCore) &&
    pentatonicClosure.evidenceBindings?.crt310BacklogFingerprint ===
      crt310Backlog.backlogFingerprint &&
    pentatonicClosure.evidenceBindings?.sourceAuthoritySha256 ===
      await hash("provenance/SOURCE_AUTHORITY.md") &&
    pentatonicClosure.evidenceBindings?.decisionLedgerSha256 ===
      await hash("provenance/DECISION_LEDGER.md"),
  pentatonicClosure.evidenceBindings,
);
const pentatonicDistribution = Object.fromEntries(
  pentatonicCandidate.universeSummary.parentCountDistribution.map(
    (item) => [String(item.parentCount), item.pitchSetCount],
  ),
);
record(
  "pentatonic binding finite result closure",
  pentatonicCandidate.status === "planning_evidence" &&
    pentatonicCandidate.admissionEffect === "none" &&
    pentatonicCandidate.universeSummary.pitchSetCount === 792 &&
    pentatonicCandidate.universeSummary.incidenceCount === 252 &&
    pentatonicCandidate.classSummaries.length === 38 &&
    pentatonicCandidate.reviewedRootedWitnesses.length === 7 &&
    pentatonicDistribution["0"] === 612 &&
    pentatonicDistribution["1"] === 120 &&
    pentatonicDistribution["2"] === 48 &&
    pentatonicDistribution["3"] === 12 &&
    pentatonicPhase1Report.verdict === "PASS" &&
    pentatonicPhase1Report.checksPassed === 19 &&
    pentatonicPhase1Report.checksFailed === 0 &&
    pentatonicPhase2Report.verdict === "PASS" &&
    pentatonicPhase2Report.checksPassed === 11 &&
    pentatonicPhase2Report.checksFailed === 0 &&
    pentatonicPhase2Report.graphScope === "detached_audit_only" &&
    pentatonicClosure.status === "planning_evidence" &&
    pentatonicClosure.admissionEffect === "none" &&
    pentatonicClosure.crt310Execution === false &&
    pentatonicClosure.verdict === "PASS" &&
    pentatonicClosure.checksPassed === 11 &&
    pentatonicClosure.checksFailed === 0 &&
    pentatonicClosure.checks.length === 11 &&
    new Set(pentatonicClosure.checks.map((check) => check.checkId)).size === 11 &&
    pentatonicClosure.checks.every((check) => check.status === "PASS"),
  {
    candidateFingerprint: pentatonicCandidate.candidateFingerprint,
    distribution: pentatonicDistribution,
    closureFingerprint: pentatonicClosure.reportFingerprint,
  },
);
const sourceAuthorityText = (await read("provenance/SOURCE_AUTHORITY.md")).toString();
const pentatonicScrumText = (await read(
  "scrum/pre-epic-400-pentatonic-graph-binding-audit.md",
)).toString();
const crt310WorkflowText = (await read("docs/CRT_310_ADMISSION_WORKFLOW.md")).toString();
record(
  "pentatonic binding planning-evidence wording boundary",
  sourceAuthorityText.includes("pentatonic-7-35-parent-audit-v1.json") &&
    sourceAuthorityText.includes("pentatonic-binding-audit-closure.json") &&
    sourceAuthorityText.includes("`planning_evidence`") &&
    pentatonicScrumText.includes("planning evidence") &&
    crt310WorkflowText.includes("`planning_evidence`") &&
    crt310Backlog.summary.admittedCount === 0 &&
    crt310Backlog.summary.eligibleForAdmissionReviewCount === 0,
  "planning_evidence only; CRT-310 remains zero-eligible and zero-admission",
);
record(
  "GOV-213 scoped harmonic-compression validation",
  gov213Validate.passed,
  gov213Validate.passed ? "passed" : gov213Validate.tail,
);
const gov213CandidateCore = { ...gov213Candidate };
delete gov213CandidateCore.candidateFingerprint;
const gov213ReportCore = { ...gov213Report };
delete gov213ReportCore.reportFingerprint;
record(
  "GOV-213 scoped admission and global C_H guard — Theorem 3′ certificate",
  payloadHash(gov213CandidateCore) === gov213Candidate.candidateFingerprint &&
    gov213Candidate.status === "admitted_scoped_A012" &&
    gov213Candidate.coordinateId === "harmonic.CH_A012_q_v1" &&
    gov213Candidate.records?.length === 21 &&
    gov213Candidate.certificate?.epsilonStar?.numerator === 3 &&
    gov213Candidate.certificate?.epsilonStar?.denominator === 407 &&
    gov213Candidate.certificate?.dualCertificate?.lambdaNumerators?.length === 7 &&
    gov213Candidate.certificate?.tightSet?.length === 7 &&
    gov213Candidate.certificate?.nextTightestSlack?.numerator === 6 &&
    gov213Candidate.records.every((item) => (
      item.role === "anchor" && ["A0", "A1", "A2"].includes(item.tier)
    )) &&
    gov213Candidate.globalAggregate?.namespace === "harmonic.C_H" &&
    gov213Candidate.globalAggregate?.status === "unresolved" &&
    gov213Candidate.globalAggregate?.value === null &&
    gov213Report.verdict === "PASS" &&
    gov213Report.checksPassed === 14 &&
    gov213Report.checksFailed === 0 &&
    payloadHash(gov213ReportCore) === gov213Report.reportFingerprint,
  {
    candidateFingerprint: gov213Candidate.candidateFingerprint,
    recordCount: gov213Candidate.records?.length,
    globalAggregate: gov213Candidate.globalAggregate,
    reportFingerprint: gov213Report.reportFingerprint,
  },
);
record(
  "GOV-227 scoped D-tier harmonic-compression validation",
  gov227Validate.passed,
  gov227Validate.passed ? "passed" : gov227Validate.tail,
);
const gov227CandidateCore = { ...gov227Candidate };
delete gov227CandidateCore.candidateFingerprint;
const gov227ReportCore = { ...gov227Report };
delete gov227ReportCore.reportFingerprint;
record(
  "GOV-227 scoped admission, topology boundary, and global C_H guard",
  payloadHash(gov227CandidateCore) === gov227Candidate.candidateFingerprint &&
    gov227Candidate.releaseId ===
      "harmonic-compression-candidate:CH_D17_q_v2:1.0.0" &&
    gov227Candidate.status === "admitted_scoped_D17" &&
    gov227Candidate.admissionEffect === "Q_and_W_D17_only" &&
    gov227Candidate.coordinateId === "harmonic.CH_D17_q_v2" &&
    gov227Candidate.records?.length === 49 &&
    gov227Candidate.records.every((item) => (
      item.role === "anchor" && ["D1", "D2", "D3", "D4", "D5", "D6", "D7"].includes(item.tier)
    )) &&
    gov227Candidate.comparisonEvidence?.d2D5MultisetTwins?.crossTierQTupleCollisionCount === 0 &&
    gov227Candidate.comparisonEvidence?.zPartnerD3D4?.crossTierQTupleCollisionCount === 0 &&
    gov227Candidate.tierSummaries?.every((summary) => (
      summary.governorSeatClassMultiset?.every((value) => value === 2)
    )) &&
    gov227Candidate.reviewGate?.neo4jIntegration === "prohibited" &&
    gov227Candidate.globalAggregate?.namespace === "harmonic.C_H" &&
    gov227Candidate.globalAggregate?.status === "unresolved" &&
    gov227Candidate.globalAggregate?.value === null &&
    gov227Report.verdict === "PASS" &&
    gov227Report.checksPassed === 17 &&
    gov227Report.checksFailed === 0 &&
    payloadHash(gov227ReportCore) === gov227Report.reportFingerprint,
  {
    candidateFingerprint: gov227Candidate.candidateFingerprint,
    recordCount: gov227Candidate.records?.length,
    lpStatuses: gov227Candidate.linearProgrammingAudit?.models?.map((item) => item.status),
    globalAggregate: gov227Candidate.globalAggregate,
    reportFingerprint: gov227Report.reportFingerprint,
  },
);
const fullDatabaseReport = JSON.parse(
  (await read("qa/neo4j-full-database-validation.json")).toString(),
);
const deploymentRoundtripReport = JSON.parse(
  (await read("qa/neo4j-deployment-roundtrip-validation.json")).toString(),
);
const fullDatabaseBaseline = JSON.parse(
  (await read("provenance/neo4j-full-database-baseline.json")).toString(),
);
const ingestionTemplateBaseline = JSON.parse(
  (await read("provenance/neo4j-ingestion-template-baseline.json")).toString(),
);
const fullDatabaseReportCore = { ...fullDatabaseReport };
delete fullDatabaseReportCore.reportFingerprint;
const deploymentRoundtripReportCore = { ...deploymentRoundtripReport };
delete deploymentRoundtripReportCore.reportFingerprint;
const fullDatabaseCheckIds = [
  "native-harness",
  "full-bootstrap",
  "projection-readiness",
  "normalized-source-parity",
  "import-twice-byte-identity",
  "namespace-reset-isolation",
];
const fullDatabaseNamespaces = [
  "topology", "provenance", "mutation", "semantic", "governorRuntime", "court", "gov210",
];
record(
  "declared full-database reproducibility and deployment evidence",
  fullDatabaseReport.schemaVersion ===
      "seven-governors.neo4j-full-database-validation.v1" &&
    fullDatabaseReport.releaseId === declaredBaselineReleaseId &&
    fullDatabaseReport.verdict === "PASS" &&
    fullDatabaseReport.checksPassed === 6 &&
    fullDatabaseReport.checksFailed === 0 &&
    payloadHash(fullDatabaseReport.checks.map((check) => check.checkId)) ===
      payloadHash(fullDatabaseCheckIds) &&
    fullDatabaseReport.checks.every((check) => check.status === "PASS") &&
    fullDatabaseReport.normalizedSnapshot?.counts?.nodeCount === 3061 &&
    fullDatabaseReport.normalizedSnapshot?.counts?.relationshipCount === 10506 &&
    fullDatabaseBaseline.schemaVersion ===
      "seven-governors.neo4j-full-database-baseline.v1" &&
    fullDatabaseBaseline.releaseId === declaredBaselineReleaseId &&
    ingestionTemplateBaseline.schemaVersion ===
      "seven-governors.neo4j-ingestion-template-baseline.v1" &&
    ingestionTemplateBaseline.releaseId === "seven-governors-integrated-1.5.0" &&
    Object.keys(ingestionTemplateBaseline.namespaces?.court ?? {}).length === 24 &&
    Object.keys(ingestionTemplateBaseline.namespaces?.gov210 ?? {}).length === 10 &&
    Object.values(ingestionTemplateBaseline.namespaces ?? {}).every((templates) => (
      Object.values(templates).every((value) => /^[0-9a-f]{64}$/.test(value))
    )) &&
    canonicalJsonBytes(fullDatabaseReport.normalizedSnapshot).equals(canonicalJsonBytes({
      snapshotFingerprint: fullDatabaseBaseline.snapshotFingerprint,
      namespaceFingerprints: fullDatabaseBaseline.namespaceFingerprints,
      sourceBindings: fullDatabaseBaseline.sourceBindings,
      counts: fullDatabaseBaseline.counts,
    })) &&
    payloadHash(Object.keys(fullDatabaseReport.normalizedSnapshot?.namespaceFingerprints ?? {})) ===
      payloadHash(fullDatabaseNamespaces) &&
    new Set(fullDatabaseReport.normalizedSnapshot?.sourceBindings?.map(
      (binding) => binding.namespace,
    )).size === fullDatabaseNamespaces.length &&
    fullDatabaseNamespaces.every((namespace) => (
      fullDatabaseReport.normalizedSnapshot.sourceBindings.some(
        (binding) => binding.namespace === namespace,
      )
    )) &&
    payloadHash(fullDatabaseReportCore) === fullDatabaseReport.reportFingerprint &&
    deploymentRoundtripReport.schemaVersion ===
      "seven-governors.neo4j-deployment-roundtrip-validation.v1" &&
    deploymentRoundtripReport.releaseId === declaredBaselineReleaseId &&
    deploymentRoundtripReport.verdict === "PASS" &&
    deploymentRoundtripReport.credentialsExcluded === true &&
    ["configured_deployment", "disposable_local"].includes(deploymentRoundtripReport.targetClass) &&
    deploymentRoundtripReport.checksPassed === 3 &&
    deploymentRoundtripReport.checksFailed === 0 &&
    payloadHash(deploymentRoundtripReport.checks.map((check) => check.checkId)) ===
      payloadHash([
        "configured-bootstrap",
        "configured-roundtrip",
        "bootstrap-roundtrip-byte-identity",
      ]) &&
    deploymentRoundtripReport.checks.every((check) => check.status === "PASS") &&
    canonicalJsonBytes(deploymentRoundtripReport.normalizedSnapshot).equals(canonicalJsonBytes({
      snapshotFingerprint: fullDatabaseBaseline.snapshotFingerprint,
      namespaceFingerprints: fullDatabaseBaseline.namespaceFingerprints,
      sourceBindings: fullDatabaseBaseline.sourceBindings,
      counts: fullDatabaseBaseline.counts,
    })) &&
    payloadHash(deploymentRoundtripReportCore) === deploymentRoundtripReport.reportFingerprint &&
    payloadHash(deploymentRoundtripReport.evidenceBindings) ===
      payloadHash(fullDatabaseReport.evidenceBindings) &&
    release.neo4jBaselineStatus?.status === declaredBaselineStatus &&
    release.neo4jBaselineStatus?.retainedReleaseId === fullDatabaseReport.releaseId,
  {
    reportFingerprint: fullDatabaseReport.reportFingerprint,
    retainedReleaseId: fullDatabaseReport.releaseId,
    baselineStatus: release.neo4jBaselineStatus,
    deploymentTargetClass: deploymentRoundtripReport.targetClass,
  },
);
const courtSkillsValidate = runNpmScript(".", "validate:court-skills");
record(
  "court agent skill bundle validation",
  courtSkillsValidate.passed,
  courtSkillsValidate.passed ? "passed" : courtSkillsValidate.tail,
);
const courtLocalModelObservation = JSON.parse(
  (await read("qa/crt-307-local-model-observation.json")).toString(),
);
record(
  "court local model observational traces",
  courtLocalModelObservation.schemaVersion ===
      "crt-307.local-model-observation.v1" &&
    courtLocalModelObservation.verdict === "PASS" &&
    courtLocalModelObservation.endpointClass ===
      "loopback-openai-compatible" &&
    courtLocalModelObservation.traceCount === 8 &&
    courtLocalModelObservation.checks?.length === 8 &&
    courtLocalModelObservation.checks.every((check) => check.pass === true) &&
    courtLocalModelObservation.canonicalFingerprintExcluded === true,
  {
    verdict: courtLocalModelObservation.verdict,
    model: courtLocalModelObservation.model,
    traceCount: courtLocalModelObservation.traceCount,
    canonicalFingerprintExcluded:
      courtLocalModelObservation.canonicalFingerprintExcluded,
  },
);
const vaultContextValidate = runNpmScript(".", "validate:vault-context");
record(
  "GOV-208 and CRT-308 vault context validation",
  vaultContextValidate.passed,
  vaultContextValidate.passed ? "passed" : vaultContextValidate.tail,
);
const gov208VaultReport = JSON.parse(
  (await read("qa/gov-208-vault-context-validation.json")).toString(),
);
const crt308VaultReport = JSON.parse(
  (await read("qa/crt-308-court-vault-context-validation.json")).toString(),
);
const governorAdmissionReport = JSON.parse(
  (await read("qa/governor-runtime-validation.json")).toString(),
);
const governorBenchmark = JSON.parse(
  (await read("qa/governor-runtime-benchmark.json")).toString(),
);
record(
  "GOV-208 optional vault provider report",
  gov208VaultReport.verdict === "PASS" &&
    gov208VaultReport.checksFailed === 0 &&
    gov208VaultReport.checksPassed === 3,
  {
    verdict: gov208VaultReport.verdict,
    checksPassed: gov208VaultReport.checksPassed,
    reportFingerprint: gov208VaultReport.reportFingerprint,
  },
);
record(
  "CRT-308 Court vault provider report",
  crt308VaultReport.verdict === "PASS" &&
    crt308VaultReport.checksFailed === 0 &&
    crt308VaultReport.checksPassed === 3,
  {
    verdict: crt308VaultReport.verdict,
    checksPassed: crt308VaultReport.checksPassed,
    reportFingerprint: crt308VaultReport.reportFingerprint,
  },
);
record(
  "GOV-209 Governor runtime admission report",
  governorAdmissionReport.schemaVersion === "gov-209.runtime-validation.v1" &&
    governorAdmissionReport.integratedReleaseId ===
      "seven-governors-integrated-1.3.0" &&
    governorAdmissionReport.verdict === "PASS" &&
    governorAdmissionReport.checksPassed === 7 &&
    governorAdmissionReport.checksFailed === 0 &&
    governorBenchmark.schemaVersion === "gov-209.runtime-benchmark.v1" &&
    governorBenchmark.configurations?.length === 4,
  {
    verdict: governorAdmissionReport.verdict,
    checksPassed: governorAdmissionReport.checksPassed,
    reportFingerprint: governorAdmissionReport.reportFingerprint,
    benchmarkFingerprint: governorBenchmark.reportFingerprint,
  },
);
const courtAdmission = JSON.parse(
  (await read("provenance/court-admission-release.json")).toString(),
);
const courtAdmissionReport = JSON.parse(
  (await read("qa/court-admission-validation.json")).toString(),
);
const courtBenchmark = JSON.parse(
  (await read("qa/court-admission-benchmark.json")).toString(),
);
const courtAdmissionArtifactChecks = await Promise.all(
  courtAdmission.artifactBindings.map(async (binding) => ({
    artifactId: binding.artifactId,
    expected: binding.sha256,
    actual: await hash(binding.path),
  })),
);
record(
  "CRT-309 admission release record",
  courtAdmission.schemaVersion === "crt-309.court-admission-release.v1" &&
    courtAdmission.integratedReleaseId === "seven-governors-integrated-1.3.0" &&
    courtAdmission.status === "admitted" &&
    courtAdmission.admissionGate === "CRT-309" &&
    courtAdmission.historicalCandidateStatusesPreserved === true &&
    courtAdmission.admittedScope?.canonicalRootedPositions?.length === 5 &&
    courtAdmission.admittedScope?.bridgeSetClasses?.length === 2 &&
    courtAdmission.admittedScope?.linearDiagonalFilters?.length === 7 &&
    courtAdmission.proposedScope?.pentatonicSetClassCount === 35 &&
    courtAdmissionArtifactChecks.every((item) => item.expected === item.actual),
  {
    admissionId: courtAdmission.admissionId,
    admissionFingerprint: courtAdmission.admissionFingerprint,
    artifactBindings: courtAdmissionArtifactChecks,
  },
);
record(
  "CRT-309 admission validator report",
  courtAdmissionReport.schemaVersion ===
      "crt-309.court-admission-validation.v1" &&
    courtAdmissionReport.verdict === "PASS" &&
    courtAdmissionReport.checksPassed === 18 &&
    courtAdmissionReport.checksFailed === 0,
  {
    verdict: courtAdmissionReport.verdict,
    checksPassed: courtAdmissionReport.checksPassed,
    reportFingerprint: courtAdmissionReport.reportFingerprint,
  },
);
const deterministicToolBenchmark = courtBenchmark.configurations?.find(
  (item) => item.configurationId === "deterministic-court-tools",
);
record(
  "CRT-309 machine-scored Court benchmark",
  courtBenchmark.schemaVersion === "crt-309.court-benchmark-report.v1" &&
    courtBenchmark.configurations?.length === 3 &&
    deterministicToolBenchmark != null &&
    Object.values(deterministicToolBenchmark.rates).every((rate) => rate === 1),
  {
    corpusFingerprint: courtBenchmark.corpusFingerprint,
    reportFingerprint: courtBenchmark.reportFingerprint,
    deterministicToolRates: deterministicToolBenchmark?.rates,
  },
);

// ---------------------------------------------------------------------------
// 9. Optional context registries (companion/candidate package)
// ---------------------------------------------------------------------------

const toolkitValidate = runNpmScript(
  "seven-governors-state-machine-spec-and-authoring-toolkit-v0.2.0",
  "validate",
);
record(
  "companion toolkit validation",
  toolkitValidate.passed,
  toolkitValidate.passed ? "passed" : toolkitValidate.tail,
);
const toolkitReport = JSON.parse(
  (
    await read(
      "seven-governors-state-machine-spec-and-authoring-toolkit-v0.2.0/qa/validation-report.json",
    )
  ).toString(),
);
record(
  "companion toolkit report",
  toolkitReport.status === "passed" &&
    toolkitReport.summary?.failed === 0,
  {
    status: toolkitReport.status,
    failed: toolkitReport.summary?.failed,
  },
);

// ---------------------------------------------------------------------------
// 10. API contract (static)
// ---------------------------------------------------------------------------

for (const relativePath of [
  "server.mjs",
  "scripts/validate-release.mjs",
  "scripts/build-manifest.mjs",
  "scripts/validate-cypher-syntax.mjs",
  "scripts/build-pentatonic-admission-backlog.mjs",
  "scripts/validate-pentatonic-admission-backlog.mjs",
  "scripts/bootstrap-neo4j.mjs",
  "scripts/verify-neo4j-roundtrip.mjs",
  "scripts/validate-full-database.mjs",
]) {
  const syntaxCheck = spawnSync(
    process.execPath,
    ["--check", path.join(packageRoot, relativePath)],
    { encoding: "utf8" },
  );
  record(
    `syntax: ${relativePath}`,
    syntaxCheck.status === 0,
    syntaxCheck.stderr || "ok",
  );
}

const serverSource = (await read("server.mjs")).toString("utf8");
record(
  "server release id binding",
  serverSource.includes('"canonical-profile-registry:0.1.1"'),
  "server must target registry release 0.1.1",
);
record(
  "server expected topology counts",
  serverSource.includes("ScaleState: 462") &&
    serverSource.includes("ScaleFamily: 38") &&
    serverSource.includes("GovernorOffice: 7"),
  "server parity expectations must match canonical counts",
);
record(
  "server expected mutation counts",
  serverSource.includes("MutationOperator: 15") &&
    serverSource.includes("MODAL_MUTATES_TO: 462") &&
    serverSource.includes("LOCAL_MUTATES_TO: 2940"),
  "server parity expectations must match audit counts",
);
record(
  "server expected semantic counts",
  serverSource.includes("canonicalProfiles: 7") &&
    serverSource.includes("compiledProfiles: 4") &&
    serverSource.includes("landformReferences: 40") &&
    serverSource.includes("unresolvedScopeBindings: 60"),
  "server parity expectations must match registry 0.1.1",
);
record(
  "creation packet schema bound",
  serverSource.includes(
    "seven-governors-canonical-feature-profile-registry-v0.1.1/scripts/compiler.mjs",
  ) &&
    serverSource.includes("compileProfileWithProvider") &&
    serverSource.includes("Neo4jRegistryProvider") &&
    serverSource.includes("stateId") &&
    serverSource.includes("domain"),
  "server must compile packets through the registry compiler",
);

const compiledSchema = JSON.parse(
  (
    await read(
      "seven-governors-canonical-feature-profile-registry-v0.1.1/schemas/compiled-profile.schema.json",
    )
  ).toString(),
);
const expectedPacketFields = [
  "schemaVersion",
  "compilerVersion",
  "releaseId",
  "normalFormId",
  "state",
  "resolution",
  "canonicalProfile",
  "photonic",
  "harmonic",
  "semantic",
  "domainProjection",
  "creationConstraints",
  "provenance",
  "intrinsicFingerprint",
  "fingerprintInputCanonicalJson",
  "routeContext",
];
record(
  "compiled-profile.schema.json contract",
  expectedPacketFields.every((field) =>
    compiledSchema.required?.includes(field),
  ),
  expectedPacketFields.filter(
    (field) => !compiledSchema.required?.includes(field),
  ),
);

// ---------------------------------------------------------------------------
// 6. Explorer
// ---------------------------------------------------------------------------

const graphHtml = (await read("graph/index.html")).toString("utf8");
record(
  "standalone graph document",
  /^<!doctype html>/i.test(graphHtml) &&
    graphHtml.includes("</html>") &&
    graphHtml.includes('"registeredStates":462'),
  { bytes: Buffer.byteLength(graphHtml) },
);
record(
  "standalone graph offline closure",
  !/\b(?:src|href)=["']https?:/i.test(graphHtml),
  "no remote runtime assets",
);
for (const explorerPath of ["graph/explore.html"]) {
  try {
    const exploreHtml = (await read(explorerPath)).toString("utf8");
    record(
      `explorer: ${explorerPath}`,
      /^<!doctype html>/i.test(exploreHtml) &&
        exploreHtml.includes('src="vendor/') &&
        !/\b(?:src|href)=["']https?:/i.test(exploreHtml),
      { bytes: Buffer.byteLength(exploreHtml) },
    );
  } catch {
    record(`explorer: ${explorerPath}`, false, "missing");
  }
}
for (const vendorPath of [
  "graph/vendor/vis-network.min.js",
  "graph/vendor/3d-force-graph.min.js",
]) {
  try {
    const stat = await fs.stat(path.join(packageRoot, vendorPath));
    record(`explorer vendor: ${vendorPath}`, stat.isFile(), stat.size);
  } catch {
    record(`explorer vendor: ${vendorPath}`, false, "missing");
  }
}

// ---------------------------------------------------------------------------
// 8. Cross-package fingerprints
// ---------------------------------------------------------------------------

const fingerprintGroups = {
  "universal-network-data.json": [
    "canonical/universal-network-data.json",
    "seven-governors-canonical-feature-profile-registry-v0.1.1/source/universal-network-data.json",
    "seven-governors-mutation-algebra-audit/source/universal-network-data.json",
  ],
  "topology-identity-definitions.json": [
    "canonical/topology-identity-definitions.json",
    "seven-governors-canonical-feature-profile-registry-v0.1.1/source/topology-identity-definitions.json",
    "seven-governors-mutation-algebra-audit/source/topology-identity-definitions.json",
  ],
  "governors.yaml": [
    "schemas/governors.yaml",
    "seven-governors-canonical-feature-profile-registry-v0.1.1/source/governors.yaml",
    "seven-governors-state-machine-spec-and-authoring-toolkit-v0.2.0/source/governors.yaml",
  ],
  "framework/AGENTS.md": [
    "framework/AGENTS.md",
    "seven-governors-canonical-feature-profile-registry-v0.1.1/source/framework/AGENTS.md",
    "seven-governors-state-machine-spec-and-authoring-toolkit-v0.2.0/source/canon/AGENTS.md",
  ],
  "framework/CANONICAL_FEATURE_PROFILES_AND_MUTATION_ALGEBRA.md": [
    "framework/CANONICAL_FEATURE_PROFILES_AND_MUTATION_ALGEBRA.md",
    "seven-governors-canonical-feature-profile-registry-v0.1.1/source/framework/CANONICAL_FEATURE_PROFILES_AND_MUTATION_ALGEBRA.md",
    "seven-governors-state-machine-spec-and-authoring-toolkit-v0.2.0/source/canon/CANONICAL_FEATURE_PROFILES_AND_MUTATION_ALGEBRA.md",
  ],
  "framework/NATURAL_ORGANIZATION_THESIS.md": [
    "framework/NATURAL_ORGANIZATION_THESIS.md",
    "seven-governors-canonical-feature-profile-registry-v0.1.1/source/framework/NATURAL_ORGANIZATION_THESIS.md",
    "seven-governors-state-machine-spec-and-authoring-toolkit-v0.2.0/source/canon/NATURAL_ORGANIZATION_THESIS.md",
  ],
  "framework/TOPOLOGICAL_ANCHORING.md": [
    "framework/TOPOLOGICAL_ANCHORING.md",
    "seven-governors-canonical-feature-profile-registry-v0.1.1/source/framework/TOPOLOGICAL_ANCHORING.md",
    "seven-governors-state-machine-spec-and-authoring-toolkit-v0.2.0/source/canon/TOPOLOGICAL_ANCHORING.md",
  ],
  "docs/START_HERE.md": [
    "docs/START_HERE.md",
    "seven-governors-state-machine-spec-and-authoring-toolkit-v0.2.0/docs/START_HERE.md",
  ],
  "docs/GRAPH_AND_COMPILER_API.md": [
    "docs/GRAPH_AND_COMPILER_API.md",
    "seven-governors-state-machine-spec-and-authoring-toolkit-v0.2.0/docs/GRAPH_AND_COMPILER_API.md",
  ],
};
for (const [label, paths] of Object.entries(fingerprintGroups)) {
  const digests = [];
  for (const relativePath of paths) {
    try {
      digests.push(await hash(relativePath));
    } catch {
      digests.push(null);
    }
  }
  record(
    `cross-package fingerprint: ${label}`,
    digests.every((digest) => digest !== null && digest === digests[0]),
    { paths, digests },
  );
}

// ---------------------------------------------------------------------------
// 9. Manifest and checksums freshness
// ---------------------------------------------------------------------------

const manifest = JSON.parse((await read("MANIFEST.json")).toString());
const checksumsText = (await read("CHECKSUMS.sha256")).toString("utf8").trim();
const computedRecords = [];
for (const absolutePath of await walkFiles(packageRoot, {
  excluded: new Set([
    "CHECKSUMS.sha256",
    "MANIFEST.json",
    ".env",
    "qa/integrated-release-validation.json",
    "qa/validation-prose-consistency.json",
    "qa/bestiary-validation.json",
    "qa/neo4j-cypher-syntax-report.json",
    "qa/crt-307-local-model-observation.json",
    "qa/server-startup.log",
    "graph/qa/server-startup.log",
    ".git",
    ".pytest_cache",
    "__pycache__",
    "bestiary/dist",
    ".astro",
    ".vite",
    ".venv",
    ".playwright-cli",
    "orrery/dist",
    "orrery/.vite",
  ]),
})) {
  computedRecords.push(await recordFile(absolutePath, packageRoot));
}
const computedPaths = new Set(computedRecords.map((item) => item.path));
const manifestByPath = new Map(manifest.files.map((item) => [item.path, item]));
const missingFromManifest = [...computedPaths].filter(
  (item) => !manifestByPath.has(item),
);
const missingFromDisk = manifest.files
  .map((item) => item.path)
  .filter((item) => !computedPaths.has(item));
const mismatchedHashes = computedRecords.filter(
  (item) =>
    manifestByPath.has(item.path) &&
    manifestByPath.get(item.path).sha256 !== item.sha256,
);
record(
  "manifest completeness",
    manifest.version === release.version &&
    missingFromManifest.length === 0 &&
    missingFromDisk.length === 0,
  {
    version: manifest.version,
    missingFromManifest,
    missingFromDisk,
  },
);
record("manifest hash parity", mismatchedHashes.length === 0, {
  mismatched: mismatchedHashes.map((item) => item.path),
});
const liveCourtStatePaths = manifest.files
  .map((item) => item.path)
  .filter(
    (relativePath) =>
      relativePath.endsWith(".session.json") ||
      relativePath.endsWith(".session.lock") ||
      relativePath.includes("/.court-state/"),
  );
record(
  "court runtime live state excluded",
  liveCourtStatePaths.length === 0,
  liveCourtStatePaths,
);
record(
  "court local model observation excluded from canonical manifest",
  !manifestByPath.has("qa/crt-307-local-model-observation.json"),
  "observational model output is QA evidence, not canonical identity",
);
const liveVaultArtifactPaths = manifest.files
  .map((item) => item.path)
  .filter(
    (relativePath) =>
      relativePath.includes("/.obsidian/") ||
      relativePath.endsWith(".vault-session.json") ||
      relativePath.endsWith(".vault.lock") ||
      relativePath.includes("/.vault-state/"),
  );
record(
  "live vault artifacts excluded from canonical manifest",
  liveVaultArtifactPaths.length === 0,
  liveVaultArtifactPaths,
);
const checksumLines = checksumsText
  .split(/\r?\n/)
  .filter((line) => line.trim() !== "");
const checksumParity = checksumLines.every((line) => {
  const match = line.match(/^([0-9a-f]{64})\s{2}(.+)$/);
  if (!match) return false;
  const [, digest, relativePath] = match;
  const record = manifestByPath.get(relativePath);
  return record?.sha256 === digest;
});
const checksumPaths = checksumLines.map((line) => line.match(/^([0-9a-f]{64})\s{2}(.+)$/)?.[2]);
record(
  "checksums sha256 parity",
  checksumLines.length === manifest.files.length &&
    new Set(checksumPaths).size === checksumPaths.length &&
    checksumParity &&
    [...manifestByPath.keys()].every((relativePath) => checksumPaths.includes(relativePath)),
  {
    checksumLines: checksumLines.length,
    manifestFiles: manifest.files.length,
  },
);

// ---------------------------------------------------------------------------
// 9. Bestiary of Archetypes
// ---------------------------------------------------------------------------

const bestiaryChecks = [];
function bestiaryRecord(name, passed, diagnostic) {
  bestiaryChecks.push({ name, status: passed ? "PASS" : "FAIL", diagnostic });
  record(name, passed, diagnostic);
}

const bestiarySchema = JSON.parse(
  (await read("bestiary/data/bestiary-data.schema.json")).toString(),
);
const bestiary = JSON.parse(
  (await read("bestiary/data/bestiary-data.json")).toString(),
);
const createRequire = (await import("node:module")).createRequire;
const rootRequire = createRequire(path.join(packageRoot, "package.json"));
const Ajv2020 = rootRequire("ajv/dist/2020");
const ajv = new Ajv2020({ strict: false });
const bestiaryValidate = ajv.compile(bestiarySchema);
bestiaryRecord(
  "bestiary:schema-valid",
  bestiaryValidate(bestiary) === true,
  bestiaryValidate(bestiary) ? "valid" : bestiaryValidate.errors,
);

const courtContractSchema = JSON.parse(
  (await read("schemas/court-admission-contract.schema.json")).toString(),
);
const courtContract = JSON.parse(
  (await read("schemas/court-admission-contract.json")).toString(),
);
const courtContractValidate = ajv.compile(courtContractSchema);
const courtContractValid = courtContractValidate(courtContract);
record(
  "court admission contract: schema valid",
  courtContractValid === true,
  courtContractValid ? "valid" : courtContractValidate.errors,
);
for (const [label, schemaPath, document] of [
  [
    "CRT-309 admission release",
    "schemas/court-admission/court-admission-release.schema.json",
    courtAdmission,
  ],
  [
    "CRT-309 admission validation",
    "schemas/court-admission/court-admission-validation.schema.json",
    courtAdmissionReport,
  ],
  [
    "CRT-309 Court benchmark",
    "schemas/court-admission/court-benchmark-report.schema.json",
    courtBenchmark,
  ],
  [
    "CRT-310 admission backlog",
    "schemas/court-admission/pentatonic-set-class-admission-backlog.schema.json",
    crt310Backlog,
  ],
  [
    "CRT-310 admission backlog validation",
    "schemas/court-admission/pentatonic-set-class-admission-backlog-validation.schema.json",
    crt310Report,
  ],
  [
    "pentatonic 7-35 parent audit candidate",
    "schemas/pentatonic-binding/pentatonic-7-35-parent-audit-v1.schema.json",
    pentatonicCandidate,
  ],
  [
    "pentatonic 7-35 parent audit validation",
    "schemas/pentatonic-binding/pentatonic-7-35-validation-report-v1.schema.json",
    pentatonicPhase1Report,
  ],
  [
    "pentatonic binding audit closure",
    "schemas/pentatonic-binding/pentatonic-binding-audit-closure-v1.schema.json",
    pentatonicClosure,
  ],
  [
    "GOV-227 D-tier candidate",
    "schemas/harmonic-compression-candidates/d-tier-candidate-release.schema.json",
    gov227Candidate,
  ],
  [
    "GOV-227 D-tier validation",
    "schemas/harmonic-compression-candidates/d-tier-validation-report.schema.json",
    gov227Report,
  ],
  [
    "declared full-database reproducibility validation",
    "schemas/neo4j-full-database-validation.schema.json",
    fullDatabaseReport,
  ],
  [
    "declared full-database deployment validation",
    "schemas/neo4j-deployment-roundtrip-validation.schema.json",
    deploymentRoundtripReport,
  ],
]) {
  const schema = JSON.parse((await read(schemaPath)).toString());
  const validate = ajv.compile(schema);
  const valid = validate(document);
  record(
    `${label}: schema valid`,
    valid === true,
    valid ? "valid" : validate.errors,
  );
}
const expectedCourtNamespaces = new Set([
  "court.compression",
  "court.filter",
  "court.fivefoldEngine",
  "court.poleDisposition",
  "court.poleRegister",
  "court.registerGovernor",
  "court.state",
  "court.transition",
  "court.translocation",
]);
const actualCourtNamespaces = new Set(
  courtContract.namespaceRules.map((item) => item.namespace),
);
record(
  "court admission contract: namespace closure",
  actualCourtNamespaces.size === expectedCourtNamespaces.size &&
    [...expectedCourtNamespaces].every((item) => actualCourtNamespaces.has(item)) &&
    courtContract.namespaceRules.every(
      (item) => item.owner && item.allowedWriters.length > 0,
    ),
  [...actualCourtNamespaces].sort(),
);
const courtSourcePaths = courtContract.sourceReferences;
const missingCourtSources = [];
for (const sourcePath of courtSourcePaths) {
  try {
    const stat = await fs.stat(path.join(packageRoot, sourcePath));
    if (!stat.isFile()) missingCourtSources.push(sourcePath);
  } catch {
    missingCourtSources.push(sourcePath);
  }
}
record(
  "court admission contract: source closure",
  missingCourtSources.length === 0,
  { checked: courtSourcePaths.length, missing: missingCourtSources },
);
const topologyLocks = new Map(
  courtContract.topologyLocks.map((item) => [item.scaleStateId, item]),
);
const canonicalById = new Map(canonical.nodes.map((node) => [node.id, node]));
record(
  "court admission contract: topology locks",
  topologyLocks.get(1749)?.office === canonicalById.get(1749)?.office &&
    topologyLocks.get(1749)?.officeDisposition ===
      canonicalById.get(1749)?.assignmentStatus &&
    topologyLocks.get(2477)?.office === canonicalById.get(2477)?.office &&
    topologyLocks.get(2477)?.incomingDegreeGovernor ===
      canonicalById.get(2477)?.parents?.[0]?.degreeGovernor &&
    topologyLocks.get(223)?.office === canonicalById.get(223)?.office &&
    topologyLocks.get(223)?.relationalOffice ===
      canonicalById.get(223)?.relationalOffice,
  [...topologyLocks.values()],
);

const bestiaryFreshRun = runIn(".", "node", [
  "scripts/build-bestiary.mjs",
]);
bestiaryRecord(
  "bestiary:fresh",
  bestiaryFreshRun.status === 0,
  (bestiaryFreshRun.stdout ?? bestiaryFreshRun.stderr ?? "").trim().slice(-200),
);

const bestiaryStateIds = new Set(
  bestiary.archetypes
    .filter((archetype) => archetype.kind === "scaleState")
    .map((archetype) => archetype.nodeId),
);
const bestiaryOperatorIds = new Set(
  bestiary.archetypes
    .filter((archetype) => archetype.kind === "mutationOperator")
    .map((archetype) => archetype.operatorId),
);
const bestiaryGapIds = new Set(
  bestiary.projectionGaps.map((gap) => gap.operatorId),
);
const bestiaryRefViolations = [];
for (const archetype of bestiary.archetypes) {
  if (archetype.kind === "scaleState") {
    for (const parent of archetype.parents) {
      if (!bestiaryStateIds.has(parent)) {
        bestiaryRefViolations.push(`state ${archetype.nodeId} parent ${parent}`);
      }
    }
  }
  if (archetype.kind === "scaleFamily") {
    for (const memberId of archetype.memberStateIds) {
      if (!bestiaryStateIds.has(memberId)) {
        bestiaryRefViolations.push(`family ${archetype.forte} member ${memberId}`);
      }
    }
  }
  if (archetype.kind === "modalCycle") {
    for (const memberId of archetype.memberStateIds) {
      if (!bestiaryStateIds.has(memberId)) {
        bestiaryRefViolations.push(`cycle ${archetype.cycleId} member ${memberId}`);
      }
    }
  }
  if (archetype.kind === "mutationOperator") {
    if (
      !bestiaryOperatorIds.has(archetype.inverseOperatorId) &&
      archetype.inverseOperatorId !== "M^6"
    ) {
      bestiaryRefViolations.push(`operator ${archetype.operatorId} inverse`);
    }
    if (!bestiaryOperatorIds.has(archetype.conjugateOperatorId)) {
      bestiaryRefViolations.push(`operator ${archetype.operatorId} conjugate`);
    }
    if (!bestiaryGapIds.has(archetype.projectionGapId)) {
      bestiaryRefViolations.push(`operator ${archetype.operatorId} gap`);
    }
  }
}
for (const edge of bestiary.relationships) {
  if (!bestiaryStateIds.has(edge.source) || !bestiaryStateIds.has(edge.target)) {
    bestiaryRefViolations.push(`relationship ${edge.id}`);
  }
}
bestiaryRecord(
  "bestiary:refs-closed",
  bestiaryRefViolations.length === 0,
  { violations: bestiaryRefViolations },
);

const canonicalNetwork = JSON.parse(
  (await read("canonical/universal-network-data.json")).toString(),
);
const bestiaryByKind = {};
for (const archetype of bestiary.archetypes) {
  bestiaryByKind[archetype.kind] = (bestiaryByKind[archetype.kind] ?? 0) + 1;
}
const expectedBestiaryCounts = {
  scaleState: 462,
  scaleFamily: 38,
  governorOffice: 7,
  canonicalProfile: 7,
  mutationOperator: 15,
  modalCycle: 66,
};
const bestiaryCountViolations = [];
for (const [kind, expected] of Object.entries(expectedBestiaryCounts)) {
  if (bestiaryByKind[kind] !== expected) {
    bestiaryCountViolations.push(`${kind}: expected ${expected}, got ${bestiaryByKind[kind]}`);
  }
}
const bestiaryEdgeCount =
  canonicalNetwork.structuralEdges.length + canonicalNetwork.fieldEdges.length;
if (bestiary.relationships.length !== bestiaryEdgeCount) {
  bestiaryCountViolations.push(
    `relationships: expected ${bestiaryEdgeCount}, got ${bestiary.relationships.length}`,
  );
}
if (bestiary.commutationPairs.length !== 91) {
  bestiaryCountViolations.push(`commutationPairs: expected 91, got ${bestiary.commutationPairs.length}`);
}
if (bestiary.projectionGaps.length !== 15) {
  bestiaryCountViolations.push(`projectionGaps: expected 15, got ${bestiary.projectionGaps.length}`);
}
if (bestiary.summary.archetypeCount !== bestiary.archetypes.length) {
  bestiaryCountViolations.push("summary.archetypeCount mismatch");
}
bestiaryRecord(
  "bestiary:counts",
  bestiaryCountViolations.length === 0,
  { violations: bestiaryCountViolations },
);

const narrativePinViolations = [];
let narrativePinDetail = "missing bestiary/data/pinned-narratives.json";
try {
  const pinned = JSON.parse(
    (await read("bestiary/data/pinned-narratives.json")).toString(),
  );
  const pinById = new Map(
    pinned.narratives.map((entry) => [entry.id, entry.text]),
  );
  if (!pinned.model || typeof pinned.model !== "string") {
    narrativePinViolations.push("pin file: model missing or not a string");
  }
  if (pinned.narratives.length !== 22) {
    narrativePinViolations.push(
      `pin file: expected 22 narratives, got ${pinned.narratives.length}`,
    );
  }
  const dataIds = new Set(bestiary.archetypes.map((archetype) => archetype.id));
  for (const entry of pinned.narratives) {
    if (!dataIds.has(entry.id)) {
      narrativePinViolations.push(`pin id not in data: ${entry.id}`);
    }
    if (typeof entry.text !== "string" || entry.text.length === 0) {
      narrativePinViolations.push(`pin entry empty text: ${entry.id}`);
    } else if (entry.text.length > 2048) {
      narrativePinViolations.push(
        `pin entry over 2048 chars: ${entry.id} (${entry.text.length})`,
      );
    }
  }
  const aiGenerated = bestiary.archetypes.filter(
    (archetype) => archetype.summary.narrativeKind === "ai_generated",
  );
  if (aiGenerated.length !== 22) {
    narrativePinViolations.push(
      `data: expected 22 ai_generated summaries, got ${aiGenerated.length}`,
    );
  }
  for (const archetype of aiGenerated) {
    const { summary } = archetype;
    if (summary.model !== pinned.model) {
      narrativePinViolations.push(
        `model mismatch: ${archetype.id} (${summary.model} != ${pinned.model})`,
      );
    }
    if (summary.text !== pinById.get(archetype.id)) {
      narrativePinViolations.push(
        `text not verbatim from pin: ${archetype.id}`,
      );
    }
    if (
      typeof summary.sha256 !== "string" ||
      summary.sha256 !==
        crypto.createHash("sha256").update(summary.text, "utf8").digest("hex")
    ) {
      narrativePinViolations.push(`sha256 not bound to text: ${archetype.id}`);
    }
  }
  for (const archetype of bestiary.archetypes) {
    if (archetype.summary.narrativeKind === "deterministic_template") {
      if (archetype.summary.model !== null || archetype.summary.sha256 !== null) {
        narrativePinViolations.push(
          `template narrative has model/sha256 set: ${archetype.id}`,
        );
      }
    } else if (!pinById.has(archetype.id)) {
      narrativePinViolations.push(
        `ai_generated id absent from pin file: ${archetype.id}`,
      );
    }
  }
  narrativePinDetail =
    narrativePinViolations.length === 0
      ? `${aiGenerated.length} pinned narratives, sha256 bound, template narratives clean`
      : narrativePinViolations.join("; ");
} catch (error) {
  narrativePinDetail = String(error.message ?? error);
}
bestiaryRecord(
  "bestiary:narrative-pins",
  narrativePinViolations.length === 0,
  { violations: narrativePinViolations, detail: narrativePinDetail },
);

await fs.writeFile(
  path.join(packageRoot, "qa/bestiary-validation.json"),
  `${JSON.stringify(
    {
      verdict: bestiaryChecks.some((item) => item.status === "FAIL")
        ? "FAIL"
        : "PASS",
      releaseId: release.releaseId,
      checksPassed: bestiaryChecks.filter((item) => item.status === "PASS").length,
      checksFailed: bestiaryChecks.filter((item) => item.status === "FAIL").length,
      checks: bestiaryChecks,
    },
    null,
    2,
  )}\n`,
);

const siteDistIndex = path.join(packageRoot, "bestiary/dist/index.html");
let siteBuiltDiagnostic = "missing bestiary/dist/index.html";
let siteBuilt = false;
try {
  const distStat = await fs.stat(siteDistIndex);
  const sourceStats = [];
  for (const sourcePath of await walkFiles(
    path.join(packageRoot, "bestiary/site/src"),
    { excluded: new Set() },
  )) {
    sourceStats.push((await fs.stat(sourcePath)).mtimeMs);
  }
  const staticDir = path.join(packageRoot, "bestiary/site/static");
  try {
    for (const staticPath of await walkFiles(staticDir, { excluded: new Set() })) {
      sourceStats.push((await fs.stat(staticPath)).mtimeMs);
    }
  } catch {
    // static/ is optional
  }
  const newestSource = Math.max(0, ...sourceStats);
  siteBuilt = distStat.isFile() && distStat.mtimeMs >= newestSource;
  siteBuiltDiagnostic = siteBuilt
    ? `index.html ${distStat.mtimeMs} >= newest source ${newestSource}`
    : `stale: index.html ${distStat.mtimeMs} < newest source ${newestSource}`;
} catch (error) {
  siteBuiltDiagnostic = String(error.message ?? error);
}
record("bestiary:site-built", siteBuilt, siteBuiltDiagnostic);

const offlineViolations = [];
let siteDistFiles = [];
try {
  siteDistFiles = await walkFiles(path.join(packageRoot, "bestiary/dist"), {
    excluded: new Set(),
  });
} catch {
  siteDistFiles = [];
}
for (const absolutePath of siteDistFiles) {
  const relativeDistPath = path.relative(packageRoot, absolutePath);
  const content = (await read(relativeDistPath)).toString();
  const withoutComments = content.replace(/\/\*[\s\S]*?\*\//g, "");
  const patterns = [
    /src\s*=\s*["']https?:\/\//g,
    /href\s*=\s*["']https?:\/\//g,
    /url\(\s*["']?https?:\/\//g,
    /@import\s+["']https?:\/\//g,
  ];
  for (const pattern of patterns) {
    const matches = withoutComments.match(pattern);
    if (matches) {
      for (const match of matches) {
        offlineViolations.push(
          `${path.relative(packageRoot, absolutePath)}: ${match}`,
        );
      }
    }
  }
}
record(
  "bestiary:offline-closure",
  offlineViolations.length === 0,
  { violations: offlineViolations, files: siteDistFiles.length },
);

let detailRouteCount = 0;
let detailRouteDiagnostic = "missing bestiary/dist/archetypes";
try {
  const archetypesDir = path.join(packageRoot, "bestiary/dist/archetypes");
  const entries = await fs.readdir(archetypesDir, { withFileTypes: true });
  detailRouteCount = entries.filter((entry) => entry.isDirectory()).length;
  detailRouteDiagnostic = `${detailRouteCount} detail routes (expected 598)`;
} catch (error) {
  detailRouteDiagnostic = String(error.message ?? error);
}
record("bestiary:detail-routes", detailRouteCount === 598, detailRouteDiagnostic);

let compareRouteDiagnostic = "missing bestiary/dist/compare/index.html";
let compareRoute = false;
try {
  const compareHtml = (
    await read("bestiary/dist/compare/index.html")
  ).toString();
  const hasSelects =
    compareHtml.includes('id="compare-a"') && compareHtml.includes('id="compare-b"');
  const hasSections =
    compareHtml.includes('id="compare-differential"') &&
    compareHtml.includes('id="compare-overlap"') &&
    compareHtml.includes('id="compare-path"');
  compareRoute = hasSelects && hasSections;
  compareRouteDiagnostic = `compare page: selects=${hasSelects}, sections=${hasSections}`;
} catch (error) {
  compareRouteDiagnostic = String(error.message ?? error);
}
record("bestiary:compare-route", compareRoute, compareRouteDiagnostic);

let aliasRouteDiagnostic = "missing bestiary/dist/operators or profiles";
let aliasRoutes = false;
try {
  const operators = await fs.readdir(
    path.join(packageRoot, "bestiary/dist/operators"),
    { withFileTypes: true },
  );
  const profiles = await fs.readdir(
    path.join(packageRoot, "bestiary/dist/profiles"),
    { withFileTypes: true },
  );
  const operatorDirs = operators.filter((entry) => entry.isDirectory());
  const profileDirs = profiles.filter((entry) => entry.isDirectory());
  let allRedirect = true;
  let checked = 0;
  for (const [baseDir, entries] of [
    ["bestiary/dist/operators", operatorDirs],
    ["bestiary/dist/profiles", profileDirs],
  ]) {
    for (const entry of entries) {
      const html = (
        await read(`${baseDir}/${entry.name}/index.html`)
      ).toString();
      if (
        !html.includes('http-equiv="refresh"') ||
        !html.includes("/archetypes/")
      ) {
        allRedirect = false;
      }
      checked += 1;
    }
  }
  aliasRoutes = operatorDirs.length === 15 && profileDirs.length === 7 && allRedirect;
  aliasRouteDiagnostic = `operator aliases=${operatorDirs.length} (expected 15), profile aliases=${profileDirs.length} (expected 7), redirects=${checked}${allRedirect ? "" : " (broken)"}`;
} catch (error) {
  aliasRouteDiagnostic = String(error.message ?? error);
}
record("bestiary:alias-routes", aliasRoutes, aliasRouteDiagnostic);

// ---------------------------------------------------------------------------
// 11. Required files
// ---------------------------------------------------------------------------

for (const requiredPath of [
  "framework/AGENTS.md",
  "framework/TOPOLOGICAL_ANCHORING.md",
  "framework/CANONICAL_FEATURE_PROFILES_AND_MUTATION_ALGEBRA.md",
  "framework/NATURAL_ORGANIZATION_THESIS.md",
  "schemas/governors.yaml",
  "schemas/court-admission-contract.schema.json",
  "schemas/court-admission-contract.json",
  "docs/COURT_ADMISSION_AND_AUTHORITY.md",
  "docs/TOPOLOGY_IDENTITY_AND_INVARIANTS.md",
  "docs/A_TIER_TRIADIC_COMPRESSION_THEOREM.md",
  "docs/FOUR_LAYER_FORMALIZATION.md",
  "docs/START_HERE.md",
  "docs/GRAPH_AND_COMPILER_API.md",
  "neo4j/schema.cypher",
  "neo4j/import.cypher",
  "neo4j/validation.cypher",
  "neo4j/provenance.cypher",
  "neo4j/provenance-validation.cypher",
  "seven-governors-mutation-algebra-audit/audit/operator-registry.csv",
  "seven-governors-canonical-feature-profile-registry-v0.1.1/schemas/compiled-profile.schema.json",
  "seven-governors-governor-runtime-v0.1.0/package.json",
  "seven-governors-governor-runtime-v0.1.0/PACKAGE_MANIFEST.json",
  "seven-governors-governor-runtime-v0.1.0/canonical/policy-release.json",
  "seven-governors-governor-runtime-v0.1.0/canonical/feature-typed-aspect-crosswalk.json",
  "seven-governors-governor-runtime-v0.1.0/canonical/canonical-bridge-examples.json",
  "seven-governors-governor-runtime-v0.1.0/schemas/typed-aspect.schema.json",
  "seven-governors-governor-runtime-v0.1.0/schemas/quantity.schema.json",
  "seven-governors-governor-runtime-v0.1.0/schemas/bridge-rule.schema.json",
  "seven-governors-governor-runtime-v0.1.0/schemas/classification-request.schema.json",
  "seven-governors-governor-runtime-v0.1.0/schemas/classification-result.schema.json",
  "seven-governors-governor-runtime-v0.1.0/schemas/policy-release.schema.json",
  "seven-governors-governor-runtime-v0.1.0/fixtures/negative-cases.json",
  "seven-governors-governor-runtime-v0.1.0/qa/validation-report.json",
  "seven-governors-governor-runtime-v0.1.0/qa/determinism-report.json",
  "seven-governors-court-substrate-v0.1.0/package.json",
  "seven-governors-court-substrate-v0.1.0/PACKAGE_MANIFEST.json",
  "seven-governors-court-substrate-v0.1.0/canonical/substrate-registry-release.json",
  "seven-governors-court-substrate-v0.1.0/canonical/pentatonic-set-class-registry.json",
  "seven-governors-court-substrate-v0.1.0/canonical/court-rooted-positions.json",
  "seven-governors-court-substrate-v0.1.0/canonical/bridge-rootings.json",
  "seven-governors-court-substrate-v0.1.0/canonical/t5-cycle.json",
  "seven-governors-court-substrate-v0.1.0/canonical/complement-map.json",
  "seven-governors-court-substrate-v0.1.0/canonical/admission-status-ledger.json",
  "seven-governors-court-substrate-v0.1.0/schemas/common.schema.json",
  "seven-governors-court-substrate-v0.1.0/schemas/admission-status.schema.json",
  "seven-governors-court-substrate-v0.1.0/schemas/pentatonic-set-class.schema.json",
  "seven-governors-court-substrate-v0.1.0/schemas/court-rooted-position.schema.json",
  "seven-governors-court-substrate-v0.1.0/schemas/bridge-rooting.schema.json",
  "seven-governors-court-substrate-v0.1.0/schemas/t5-cycle-entry.schema.json",
  "seven-governors-court-substrate-v0.1.0/schemas/complement-map.schema.json",
  "seven-governors-court-substrate-v0.1.0/schemas/substrate-registry-release.schema.json",
  "seven-governors-court-substrate-v0.1.0/fixtures/negative-cases.json",
  "seven-governors-court-substrate-v0.1.0/qa/validation-report.json",
  "seven-governors-court-substrate-v0.1.0/qa/determinism-report.json",
  "seven-governors-harmonic-invariants-v0.1.0/package.json",
  "seven-governors-harmonic-invariants-v0.1.0/PACKAGE_MANIFEST.json",
  "seven-governors-harmonic-invariants-v0.1.0/canonical/harmonic-invariant-registry.json",
  "seven-governors-harmonic-invariants-v0.1.0/canonical/court-geometry.json",
  "seven-governors-harmonic-invariants-v0.1.0/canonical/carey-5-35.json",
  "seven-governors-harmonic-invariants-v0.1.0/canonical/compression-namespace-guard.json",
  "seven-governors-harmonic-invariants-v0.1.0/schemas/common.schema.json",
  "seven-governors-harmonic-invariants-v0.1.0/schemas/invariant-record.schema.json",
  "seven-governors-harmonic-invariants-v0.1.0/schemas/harmonic-invariant-release.schema.json",
  "seven-governors-harmonic-invariants-v0.1.0/fixtures/negative-cases.json",
  "seven-governors-harmonic-invariants-v0.1.0/qa/validation-report.json",
  "seven-governors-harmonic-invariants-v0.1.0/qa/determinism-report.json",
  "seven-governors-court-filter-algebra-v0.1.0/package.json",
  "seven-governors-court-filter-algebra-v0.1.0/PACKAGE_MANIFEST.json",
  "seven-governors-court-filter-algebra-v0.1.0/canonical/filter-algebra-release.json",
  "seven-governors-court-filter-algebra-v0.1.0/canonical/filter-operator-registry.json",
  "seven-governors-court-filter-algebra-v0.1.0/canonical/bridge-route-comparison.json",
  "seven-governors-court-filter-algebra-v0.1.0/canonical/commutation-table.json",
  "seven-governors-court-filter-algebra-v0.1.0/canonical/non-commutation-records.json",
  "seven-governors-court-filter-algebra-v0.1.0/schemas/filter-operator.schema.json",
  "seven-governors-court-filter-algebra-v0.1.0/schemas/filter-algebra-release.schema.json",
  "seven-governors-court-filter-algebra-v0.1.0/schemas/commutation-table.schema.json",
  "seven-governors-court-filter-algebra-v0.1.0/schemas/non-commutation-records.schema.json",
  "seven-governors-court-filter-algebra-v0.1.0/fixtures/negative-cases.json",
  "seven-governors-court-filter-algebra-v0.1.0/qa/validation-report.json",
  "seven-governors-court-filter-algebra-v0.1.0/qa/determinism-report.json",
  "schemas/court-runtime-policy.json",
  "schemas/court-runtime-policy.schema.json",
  "schemas/court-runtime/court-runtime-types.schema.json",
  "schemas/court-runtime/court-runtime-state.schema.json",
  "schemas/court-runtime/court-legal-move.schema.json",
  "schemas/court-runtime/court-validation-token.schema.json",
  "schemas/court-runtime/court-validated-move.schema.json",
  "schemas/court-runtime/court-transition-event.schema.json",
  "schemas/court-runtime/topological-translocation-record.schema.json",
  "schemas/court-runtime/court-runtime-snapshot.schema.json",
  "schemas/court-runtime/court-runtime-replay-result.schema.json",
  "schemas/court-runtime/court-runtime-session.schema.json",
  "src/governor/court_runtime.py",
  "src/governor/court_session_store.py",
  "src/governor/court_agent_api.py",
  "tests/test_court_runtime_transitions.py",
  "tests/test_court_runtime_store.py",
  "tests/test_crt_307_court_agent_api.py",
  "tests/verification/test_court_runtime_security.py",
  "skills/court/registry.json",
  "skills/court/capabilities.json",
  "skills/court/workflows/inspect_court_state/SKILL.md",
  "skills/court/workflows/list_legal_court_moves/SKILL.md",
  "skills/court/workflows/validate_and_execute_court_transition/SKILL.md",
  "skills/court/workflows/project_through_court/SKILL.md",
  "skills/court/workflows/verify_court_postcondition/SKILL.md",
  "scripts/install-court-skills.mjs",
  "scripts/validate-court-skills.mjs",
  "scripts/run-crt307-local-model-observation.mjs",
  "qa/crt-307-local-model-observation.json",
  "docs/GOVERNOR_VAULT_CONTEXT.md",
  "docs/COURT_VAULT_CONTEXT.md",
  "docs/COURT_ADMISSION_RELEASE_1_3.md",
  "src/governor/vault_context.py",
  "src/governor/court_vault_context.py",
  "schemas/governor-context/vault-note-frontmatter.schema.json",
  "schemas/governor-context/context-request.schema.json",
  "schemas/governor-context/context-bundle.schema.json",
  "schemas/governor-context/contextual-classification-result.schema.json",
  "schemas/governor-context/dependency-bindings.json",
  "schemas/governor-context/validation-report.schema.json",
  "schemas/court-context/court-vault-frontmatter.schema.json",
  "schemas/court-context/court-context-bundle.schema.json",
  "schemas/court-context/dependency-bindings.json",
  "schemas/court-admission/court-admission-release.schema.json",
  "schemas/court-admission/court-admission-validation.schema.json",
  "schemas/court-admission/court-benchmark-report.schema.json",
  "scripts/validate-vault-context.mjs",
  "scripts/run-court-admission-benchmark.mjs",
  "scripts/build-court-admission.mjs",
  "scripts/validate-court-admission.mjs",
  "tests/test_gov_208_vault_context.py",
  "tests/test_crt_308_court_vault_context.py",
  "tests/crt_309/benchmark-corpus.json",
  "qa/gov-208-vault-context-validation.json",
  "qa/crt-308-court-vault-context-validation.json",
  "qa/court-admission-benchmark.json",
  "qa/court-admission-validation.json",
  "qa/governor-runtime-benchmark.json",
  "qa/governor-runtime-validation.json",
  "provenance/court-admission-release.json",
  "scripts/run-governor-admission-benchmark.mjs",
  "scripts/validate-governor-admission.mjs",
  "tests/gov_209/benchmark-corpus.json",
  "canonical/gov-210-availability-housing.json",
  "schemas/gov-210/skill-eligibility-policy.json",
  "schemas/gov-210/skill-availability.schema.json",
  "schemas/gov-210/skill-eligibility.schema.json",
  "schemas/gov-210/skill-assignment.schema.json",
  "schemas/gov-210/context-housing.schema.json",
  "schemas/gov-210/skill-lifecycle.schema.json",
  "schemas/gov-210/graph-projection.schema.json",
  "src/governor/availability_housing.py",
  "src/governor/availability_housing_queries.py",
  "scripts/generate-availability-housing.py",
  "tests/test_gov_210_availability_housing.py",
  "tests/gov_210/neo4j-live.test.mjs",
  "tests/gov_210/context-fixture.json",
  "tests/gov_210/lifecycle-fixture.json",
  "neo4j/gov-210/schema.cypher",
  "neo4j/gov-210/validation.cypher",
  "neo4j/gov-210/reset.cypher",
  "docs/GOV_210_AVAILABILITY_AND_HOUSING.md",
  "schemas/gov-211/menu-organization-policy.json",
  "schemas/gov-211/assignment-query-result.schema.json",
  "schemas/gov-211/menu-organization.schema.json",
  "schemas/gov-211/assignment-aware-response.schema.json",
  "src/governor/assignment_menu.py",
  "tests/test_gov_211_assignment_menu.py",
  "tests/gov_211/neo4j-live.test.mjs",
  "docs/GOV_211_ASSIGNMENT_AWARE_MENU.md",
  "scrum/GOV-211-assignment-aware-menu-integration.md",
  "provenance/pentatonic-set-class-admission-backlog.json",
  "schemas/court-admission/pentatonic-set-class-admission-backlog.schema.json",
  "schemas/court-admission/pentatonic-set-class-admission-backlog-validation.schema.json",
  "scripts/build-pentatonic-admission-backlog.mjs",
  "scripts/validate-pentatonic-admission-backlog.mjs",
  "tests/crt_310/backlog.test.mjs",
  "qa/pentatonic-set-class-admission-backlog-validation.json",
  "docs/CRT_310_ADMISSION_WORKFLOW.md",
  "docs/PENTATONIC_GRAPH_BINDING_AUDIT_SPEC.md",
  "docs/verification/PENTATONIC_GRAPH_BINDING_AUDIT_REPORT.md",
  "canonical/pentatonic-binding-candidates/pentatonic-7-35-parent-audit-v1.json",
  "canonical/pentatonic-binding-candidates/negative-cases-v1.json",
  "schemas/pentatonic-binding/pentatonic-7-35-parent-audit-v1.schema.json",
  "schemas/pentatonic-binding/pentatonic-7-35-negative-cases-v1.schema.json",
  "schemas/pentatonic-binding/pentatonic-7-35-validation-report-v1.schema.json",
  "schemas/pentatonic-binding/pentatonic-binding-audit-closure-v1.schema.json",
  "scripts/generate-pentatonic-7-35-parent-audit.py",
  "scripts/validate-pentatonic-7-35-parent-audit.py",
  "scripts/build-pentatonic-binding-audit-closure.mjs",
  "tests/test_pentatonic_7_35_parent_audit.py",
  "tests/pentatonic_binding_audit/neo4j-live.test.mjs",
  "neo4j/pentatonic-binding-audit/README.md",
  "neo4j/pentatonic-binding-audit/schema.cypher",
  "neo4j/pentatonic-binding-audit/import.cypher",
  "neo4j/pentatonic-binding-audit/validation.cypher",
  "neo4j/pentatonic-binding-audit/reset.cypher",
  "neo4j/pentatonic-binding-audit/teardown.cypher",
  "qa/pentatonic-7-35-parent-audit-validation.json",
  "qa/pentatonic-binding-audit-neo4j-validation.json",
  "qa/pentatonic-binding-audit-closure.json",
  "scrum/pre-epic-400-pentatonic-graph-binding-audit.md",
  "scrum/pre-epic-400-pentatonic-graph-binding-phase-2-4-handoff.md",
  "graph/runtime/neo4j-bootstrap.mjs",
  "graph/runtime/neo4j-roundtrip.mjs",
  "scripts/bootstrap-neo4j.mjs",
  "scripts/verify-neo4j-roundtrip.mjs",
  "scripts/validate-full-database.mjs",
  "scripts/validate-neo4j-deployment-roundtrip.mjs",
  "schemas/neo4j-normalized-snapshot.schema.json",
  "schemas/neo4j-full-database-validation.schema.json",
  "schemas/neo4j-deployment-roundtrip-validation.schema.json",
  "tests/neo4j/full-database-live.test.mjs",
  "qa/neo4j-full-database-validation.json",
  "qa/neo4j-deployment-roundtrip-validation.json",
  "provenance/neo4j-full-database-baseline.json",
  "provenance/neo4j-ingestion-template-baseline.json",
  "scrum/GOV-212-integrated-release-1.4-closure.md",
  "canonical/harmonic-compression-candidates/CH_A012_q_v1.json",
  "canonical/harmonic-compression-candidates/negative-cases.json",
  "schemas/harmonic-compression-candidates/candidate-release.schema.json",
  "schemas/harmonic-compression-candidates/validation-report.schema.json",
  "src/governor/harmonic_compression.py",
  "scripts/generate-harmonic-compression-candidates.py",
  "scripts/validate-harmonic-compression-candidates.py",
  "tests/test_gov_213_harmonic_compression.py",
  "qa/harmonic-compression-candidates-validation.json",
  "scrum/GOV-213-harmonic-compression-formalization.md",
  "canonical/harmonic-compression-candidates/CH_D17_q_v2.json",
  "canonical/harmonic-compression-candidates/d-tier-negative-cases.json",
  "schemas/harmonic-compression-candidates/d-tier-candidate-release.schema.json",
  "schemas/harmonic-compression-candidates/d-tier-validation-report.schema.json",
  "src/governor/exact_lp.py",
  "src/governor/harmonic_compression_d_tier.py",
  "scripts/generate-d-tier-harmonic-compression.py",
  "scripts/validate-d-tier-harmonic-compression.py",
  "tests/test_gov_227_d_tier_harmonic_compression.py",
  "qa/d-tier-harmonic-compression-validation.json",
  "docs/D_TIER_TRIADIC_COMPRESSION_THEOREM.md",
  "scrum/GOV-227-d-tier-harmonic-compression-audit.md",
  "seven-governors-state-machine-spec-and-authoring-toolkit-v0.2.0/docs/START_HERE.md",
  "bestiary/ARCH-SPEC.md",
  "bestiary/data/bestiary-data.json",
  "bestiary/data/bestiary-data.schema.json",
  "bestiary/data/pinned-narratives.json",
  "bestiary/site/astro.config.mjs",
  "bestiary/site/package.json",
  "bestiary/site/src/lib/bestiary.ts",
  "bestiary/site/src/pages/index.astro",
  "bestiary/site/src/pages/archetypes/[id].astro",
  "bestiary/site/src/layouts/ArchetypeLayout.astro",
  "bestiary/site/src/components/StatComparisonMatrix.astro",
  "bestiary/site/src/components/ArchetypeNarrative.astro",
  "bestiary/site/src/components/Scatterplot.astro",
  "bestiary/site/src/components/TopologyNodeGraph.astro",
  "bestiary/site/src/components/PitchSetDialMini.astro",
  "bestiary/site/src/lib/dialGeometry.ts",
  "bestiary/site/src/lib/dialClient.ts",
  "bestiary/site/src/lib/networkLayout.ts",
  "bestiary/site/src/lib/nodeShapes.ts",
  "bestiary/site/src/pages/compare.astro",
  "scripts/build-bestiary.mjs",
]) {
  try {
    const stat = await fs.stat(path.join(packageRoot, requiredPath));
    record(`required file: ${requiredPath}`, stat.isFile(), stat.size);
  } catch {
    record(`required file: ${requiredPath}`, false, "missing");
  }
}

const failed = checks.filter((item) => item.status === "FAIL");
const report = {
  verdict: failed.length ? "FAIL" : "PASS",
  releaseId: release.releaseId,
  checksPassed: checks.length - failed.length,
  checksFailed: failed.length,
  checks,
};
await fs.writeFile(
  path.join(packageRoot, "qa/integrated-release-validation.json"),
  `${JSON.stringify(report, null, 2)}\n`,
);
console.log(JSON.stringify(report, null, 2));
if (failed.length) process.exitCode = 1;
