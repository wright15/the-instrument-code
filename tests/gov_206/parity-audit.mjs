/**
 * GOV-206 VENUS Audit: Three-Provider Fingerprint Parity Matrix.
 *
 * Builds a canonical graph snapshot, writes it to disk, starts an isolated
 * Neo4j instance, imports the snapshot, runs all 6 named queries through
 * SnapshotProvider, FileProvider, and Neo4jProvider, and prints the
 * fingerprint comparison matrix.
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import neo4j from "neo4j-driver";

import { buildGraphSnapshot } from "../../graph/runtime/contracts.mjs";
import { SnapshotProvider } from "../../graph/runtime/providers/snapshot-provider.mjs";
import { FileProvider } from "../../graph/runtime/providers/file-provider.mjs";
import { Neo4jProvider } from "../../graph/runtime/providers/neo4j-provider.mjs";
import { Neo4jHarness } from "../../graph/runtime/neo4j-harness.mjs";
import { sha256 } from "../../graph/runtime/canonical.mjs";

const root = path.resolve(fileURLToPath(import.meta.url), "..", "..", "..");
const policyRelease = JSON.parse(
  fs.readFileSync(
    path.join(root, "seven-governors-governor-runtime-v0.1.0/canonical/policy-release.json"),
    "utf8",
  ),
);

const snapshot = buildGraphSnapshot({
  policyRelease,
  classificationResults: [],
  runtimeExport: null,
  profiles: [],
  provenanceSources: [],
});

const queries = [
  { queryId: "aspect_context", params: { aspectId: policyRelease.typedAspects[0].aspectId } },
  { queryId: "governor_profile", params: { governor: "Jupiter" } },
  { queryId: "rule_explanation", params: { ruleId: policyRelease.bridgeRules[0].ruleId } },
  { queryId: "legal_move_context", params: { snapshotId: "nonexistent-placeholder" } },
  { queryId: "provenance_path", params: { logicalId: snapshot.nodes[0].logicalId, maxDepth: 3 } },
  { queryId: "prior_verified_outcomes", params: { taskId: "task:nonexistent", limit: 25 } },
];

async function importToNeo4j(driver, snapshot) {
  const session = driver.session({ database: "neo4j", defaultAccessMode: neo4j.session.WRITE });
  try {
    // Reset
    await session.run(`
      MATCH (n)
      WHERE n:GovRuntimePolicyRelease OR n:GovTypedAspect OR n:GovBridgeRule
         OR n:GovClassificationEvidence OR n:GovLedgerSnapshot
         OR n:GovGovernorProfileView OR n:GovLegalMoveView
         OR n:GovProvenanceSource OR n:GovGovernorReference
      DETACH DELETE n
    `);
    const nodesByLabel = {};
    for (const node of snapshot.nodes) {
      if (!nodesByLabel[node.label]) nodesByLabel[node.label] = [];
      nodesByLabel[node.label].push({
        logicalId: node.logicalId,
        ...node.properties,
        recordSha256: node.recordSha256,
        projectionFingerprint: node.projectionFingerprint,
        sourceFingerprint: node.sourceFingerprint,
        policyFingerprint: node.policyFingerprint,
        admissionStatus: node.admissionStatus,
        verificationStatus: node.verificationStatus,
      });
    }
    for (const [label, records] of Object.entries(nodesByLabel)) {
      await session.run(`UNWIND $records AS r MERGE (n:${label} {logicalId: r.logicalId}) SET n += r`, { records });
    }
    const edgesByType = {};
    for (const edge of snapshot.edges) {
      if (!edgesByType[edge.relationshipType]) edgesByType[edge.relationshipType] = [];
      edgesByType[edge.relationshipType].push(edge);
    }
    for (const [relType, records] of Object.entries(edgesByType)) {
      await session.run(
        `UNWIND $records AS record
         MATCH (s {logicalId: record.sourceLogicalId})
         MATCH (t {logicalId: record.targetLogicalId})
         MERGE (s)-[r:${relType} {logicalId: record.logicalId}]->(t)
         SET r += record.properties
         SET r.logicalId = record.logicalId, r.projectionFingerprint = record.projectionFingerprint,
             r.sourceFingerprint = record.sourceFingerprint, r.policyFingerprint = record.policyFingerprint,
             r.recordSha256 = record.recordSha256, r.admissionStatus = record.admissionStatus,
             r.verificationStatus = record.verificationStatus`,
        { records },
      );
    }
  } finally {
    await session.close();
  }
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "gov206-parity-"));
const snapshotPath = path.join(tempDir, "snapshot.json");
fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2));

const snapProvider = new SnapshotProvider(snapshot);
const fileProvider = new FileProvider(snapshotPath);

console.log("=== VENUS 3-Provider Fingerprint Parity Matrix ===");
console.log("");

const results = [];
const harness = new Neo4jHarness();

try {
  await harness.start();
  const driver = neo4j.driver(harness.uri, neo4j.auth.basic("", ""));
  try {
    await importToNeo4j(driver, snapshot);
  } finally {
    await driver.close();
  }

  const neo4jProvider = new Neo4jProvider({
    uri: harness.uri,
    username: "",
    password: "",
    database: "neo4j",
    projectionFingerprint: snapshot.projectionFingerprint,
  });

  for (const { queryId, params } of queries) {
    const snapResult = await snapProvider.executeNamedQuery(queryId, params);
    const fileResult = await fileProvider.executeNamedQuery(queryId, params);
    let neo4jResult = null;
    let neo4jError = null;
    try {
      neo4jResult = await neo4jProvider.executeNamedQuery(queryId, params);
    } catch (e) {
      neo4jError = e.message;
    }

    const snapFp = snapResult.resultFingerprint;
    const fileFp = fileResult.resultFingerprint;
    const neo4jFp = neo4jResult ? neo4jResult.resultFingerprint : "ERROR";

    const snapFileMatch = snapFp === fileFp;
    const snapNeo4jMatch = snapFp === neo4jFp;
    const allMatch = snapFileMatch && snapNeo4jMatch;

    results.push({
      queryId,
      snapFp,
      fileFp,
      neo4jFp,
      snapFileMatch,
      snapNeo4jMatch,
      allMatch,
      neo4jError,
    });
  }

  await neo4jProvider.close();
} finally {
  await harness.stop();
  fs.rmSync(tempDir, { recursive: true, force: true });
}

console.log("Query                | Snapshot FP                                              | File FP                                                  | Neo4j FP                                                | S=F | S=N | ALL");
console.log("---------------------|----------------------------------------------------------|----------------------------------------------------------|---------------------------------------------------------|-----|-----|----");
for (const r of results) {
  console.log(
    `${r.queryId.padEnd(20)} | ${r.snapFp.substring(0, 24)}... | ${r.fileFp.substring(0, 24)}... | ${r.neo4jFp.substring(0, 24)}... | ${r.snapFileMatch ? "Y" : "N"}  | ${r.snapNeo4jMatch ? "Y" : "N"}  | ${r.allMatch ? "Y" : "N"}${r.neo4jError ? " [" + r.neo4jError + "]" : ""}`,
  );
}

const allPass = results.every((r) => r.allMatch);
console.log("");
console.log(allPass ? "VERDICT: ALL 6 QUERIES MATCH ACROSS ALL 3 PROVIDERS" : "VERDICT: PARITY MISMATCH DETECTED");
if (!allPass) process.exit(1);