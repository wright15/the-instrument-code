#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import neo4j from "neo4j-driver";

import { bootstrapFullDatabase } from "../graph/runtime/neo4j-bootstrap.mjs";
import { buildGraphSnapshot } from "../graph/runtime/contracts.mjs";
import { exportNormalizedNeo4jSnapshot } from "../graph/runtime/neo4j-roundtrip.mjs";


export const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function sha256File(relativePath) {
  return crypto.createHash("sha256")
    .update(fs.readFileSync(path.join(packageRoot, relativePath)))
    .digest("hex");
}

export function releaseSourceBindings() {
  return [
    ["topology", "canonical/universal-network-data.json"],
    ["provenance", "provenance/release.json"],
    ["mutation", "seven-governors-mutation-algebra-audit/audit/operator-applications.csv"],
    ["semantic", "seven-governors-canonical-feature-profile-registry-v0.1.1/canonical/registry-release.json"],
    ["governorRuntime", "seven-governors-governor-runtime-v0.1.0/canonical/policy-release.json"],
    ["court", "tests/court_graph/fixture-input.json"],
    ["gov210", "canonical/gov-210-availability-housing.json"],
  ].map(([namespace, sourcePath]) => ({
    namespace,
    path: sourcePath,
    sha256: sha256File(sourcePath),
  }));
}

export function firstColumnIds(relativePath) {
  return fs.readFileSync(path.join(packageRoot, relativePath), "utf8")
    .trim().split(/\r?\n/).slice(1)
    .map((line) => line.slice(0, line.indexOf(",")).replace(/^"|"$/g, ""));
}

export function semanticNodeIds() {
  const directory = "seven-governors-canonical-feature-profile-registry-v0.1.1/neo4j/csv";
  const files = {
    RegistryRelease: "registry-releases.csv",
    CanonicalFeatureProfile: "canonical-profiles.csv",
    PhotonicRecord: "photonic-records.csv",
    FeatureDefinition: "feature-definitions.csv",
    HarmonicMeasureDefinition: "harmonic-measure-definitions.csv",
    SemanticOperator: "semantic-operators.csv",
    SemanticUnresolvedScope: "semantic-unresolved-scopes.csv",
    DomainProjection: "domain-projections.csv",
    LandformReference: "landform-references.csv",
    CompiledFeatureProfile: "compiled-profiles.csv",
    DerivationRoute: "derivation-routes.csv",
    DerivationStep: "derivation-steps.csv",
    ValidationFixture: "validation-fixtures.csv",
  };
  return Object.fromEntries(Object.entries(files).map(([label, name]) => [
    label,
    firstColumnIds(`${directory}/${name}`),
  ]));
}

export function releaseRoundtripVerificationInputs(inputs) {
  const baseline = JSON.parse(fs.readFileSync(
    path.join(packageRoot, "provenance/neo4j-full-database-baseline.json"),
    "utf8",
  ));
  return {
    releaseId: inputs.release.releaseId,
    canonicalTopology: JSON.parse(fs.readFileSync(path.join(
      packageRoot,
      "canonical/universal-network-data.json",
    ), "utf8")),
    mutationOperatorIds: firstColumnIds(
      "seven-governors-mutation-algebra-audit/audit/operator-registry.csv",
    ),
    mutationApplicationIds: firstColumnIds(
      "seven-governors-mutation-algebra-audit/audit/operator-applications.csv",
    ),
    semanticNodeIds: semanticNodeIds(),
    governorProjectionFingerprint: inputs.governorSnapshot.nodes[0].projectionFingerprint,
    courtProjectionFingerprint: inputs.courtSnapshot.projectionFingerprint,
    gov210ProjectionFingerprint: inputs.gov210Snapshot.projectionFingerprint,
    sourceBindings: releaseSourceBindings(),
    expectedCounts: {
      nodeCount: inputs.release.databaseBootstrap.expectedNodeCount,
      relationshipCount: inputs.release.databaseBootstrap.expectedRelationshipCount,
    },
    expectedNamespaceFingerprints: baseline.namespaceFingerprints,
  };
}

export function buildReleaseDatabaseInputs(outputDirectory) {
  fs.mkdirSync(outputDirectory, { recursive: true });
  const policyRelease = JSON.parse(fs.readFileSync(path.join(
    packageRoot,
    "seven-governors-governor-runtime-v0.1.0/canonical/policy-release.json",
  ), "utf8"));
  const governorSnapshot = buildGraphSnapshot({
    policyRelease,
    classificationResults: [],
    runtimeExport: null,
    profiles: [],
    provenanceSources: [],
  });
  const courtSnapshotPath = path.join(outputDirectory, "court-snapshot.json");
  const courtBatchesPath = path.join(outputDirectory, "court-batches.json");
  execFileSync("python3", [
    path.join(packageRoot, "scripts/generate-court-graph.py"),
    "--input", path.join(packageRoot, "tests/court_graph/fixture-input.json"),
    "--snapshot", courtSnapshotPath,
    "--batches", courtBatchesPath,
    "--batch-size", "100",
  ], { cwd: packageRoot });
  const gov210SnapshotPath = path.join(outputDirectory, "gov210-snapshot.json");
  const gov210BatchesPath = path.join(outputDirectory, "gov210-batches.json");
  execFileSync("python3", [
    path.join(packageRoot, "scripts/generate-availability-housing.py"),
    "--output", gov210SnapshotPath,
    "--batches", gov210BatchesPath,
    "--batch-size", "500",
  ], { cwd: packageRoot });
  return {
    release: JSON.parse(fs.readFileSync(path.join(packageRoot, "provenance/release.json"), "utf8")),
    governorSnapshot,
    courtSnapshot: JSON.parse(fs.readFileSync(courtSnapshotPath, "utf8")),
    courtBatches: JSON.parse(fs.readFileSync(courtBatchesPath, "utf8")),
    gov210Snapshot: JSON.parse(fs.readFileSync(gov210SnapshotPath, "utf8")),
    gov210Batches: JSON.parse(fs.readFileSync(gov210BatchesPath, "utf8")),
    ingestionTemplateBaseline: JSON.parse(fs.readFileSync(path.join(
      packageRoot,
      "provenance/neo4j-ingestion-template-baseline.json",
    ), "utf8")),
  };
}

function argument(name, fallback = undefined) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

async function main() {
  const uri = argument("--uri", process.env.NEO4J_URI);
  const username = argument("--username", process.env.NEO4J_USERNAME ?? "neo4j");
  const password = argument("--password", process.env.NEO4J_PASSWORD);
  const importDir = argument("--import-dir", process.env.NEO4J_IMPORT_DIR);
  const database = argument("--database", process.env.NEO4J_DATABASE ?? "neo4j");
  const output = argument("--roundtrip-output");
  if (!uri || password === undefined || !importDir) {
    throw new Error(
      "usage: bootstrap-neo4j.mjs --uri URI --password PASSWORD --import-dir PATH [--username USER] [--database NAME] [--roundtrip-output PATH]",
    );
  }
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "seven-governors-bootstrap-"));
  const driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
  try {
    await driver.verifyConnectivity();
    const inputs = buildReleaseDatabaseInputs(temp);
    const result = await bootstrapFullDatabase({
      driver,
      importDir: path.resolve(importDir),
      packageRoot,
      database,
      ...inputs,
    });
    if (output) {
      const session = driver.session({ database, defaultAccessMode: neo4j.session.READ });
      try {
        const snapshot = await exportNormalizedNeo4jSnapshot(session, {
          releaseId: inputs.release.releaseId,
          sourceBindings: releaseSourceBindings(),
        });
        fs.writeFileSync(path.resolve(output), `${JSON.stringify(snapshot, null, 2)}\n`);
        result.normalizedSnapshotFingerprint = snapshot.snapshotFingerprint;
      } finally {
        await session.close();
      }
    }
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } finally {
    await driver.close();
    fs.rmSync(temp, { recursive: true, force: true });
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
