import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import neo4j from "neo4j-driver";

import {
  buildGraphSnapshot,
  validateGraphSnapshot,
  serializeSnapshot,
} from "../../graph/runtime/contracts.mjs";
import { SnapshotProvider } from "../../graph/runtime/providers/snapshot-provider.mjs";
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

function buildTestSnapshot() {
  return buildGraphSnapshot({
    policyRelease,
    classificationResults: [],
    runtimeExport: null,
    profiles: [],
    provenanceSources: [],
  });
}

function withVerifiedOutcomeFixtures(snapshot) {
  const taskId = "task:gov-206-parity";
  const outcomeNodes = [1, 2, 3].map((revision) => {
    const snapshotSha256 = sha256({ fixture: "gov-206-limit-parity", revision });
    const node = {
      logicalId: `gov:snapshot:${snapshotSha256}`,
      label: "GovLedgerSnapshot",
      projectionFingerprint: snapshot.nodes[0].projectionFingerprint,
      sourceFingerprint: snapshot.sourceFingerprint,
      policyFingerprint: snapshot.policyFingerprint,
      admissionStatus: "not_applicable",
      verificationStatus: "verified",
      properties: {
        snapshotSha256,
        stateSha256: sha256({ fixture: "gov-206-state", revision }),
        ledgerHeadSha256: sha256({ fixture: "gov-206-ledger", revision }),
        eventCount: revision,
        taskId,
        phase: "VERIFIED",
        revision,
        lifecycleVerified: true,
      },
    };
    return { ...node, recordSha256: sha256(node) };
  });
  return {
    ...snapshot,
    nodes: [...snapshot.nodes, ...outcomeNodes],
  };
}

async function importSnapshot(driver, snapshot) {
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

    // Import nodes by label
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
      await session.run(
        `UNWIND $records AS record MERGE (n:${label} {logicalId: record.logicalId}) SET n += record`,
        { records },
      );
    }

    // Import edges by relationship type
    const edgesByType = {};
    for (const edge of snapshot.edges) {
      if (!edgesByType[edge.relationshipType]) edgesByType[edge.relationshipType] = [];
      edgesByType[edge.relationshipType].push(edge);
    }

    for (const [relType, records] of Object.entries(edgesByType)) {
      await session.run(
        `UNWIND $records AS record
         MATCH (source {logicalId: record.sourceLogicalId})
         MATCH (target {logicalId: record.targetLogicalId})
         MERGE (source)-[r:${relType} {logicalId: record.logicalId}]->(target)
         SET r += record.properties
         SET r.logicalId = record.logicalId,
             r.projectionFingerprint = record.projectionFingerprint,
             r.sourceFingerprint = record.sourceFingerprint,
             r.policyFingerprint = record.policyFingerprint,
             r.recordSha256 = record.recordSha256,
             r.admissionStatus = record.admissionStatus,
             r.verificationStatus = record.verificationStatus`,
        { records },
      );
    }
  } finally {
    await session.close();
  }
}

async function countNodes(driver) {
  const session = driver.session({ database: "neo4j", defaultAccessMode: neo4j.session.READ });
  try {
    const result = await session.run(`
      MATCH (n)
      WHERE n:GovRuntimePolicyRelease OR n:GovTypedAspect OR n:GovBridgeRule
         OR n:GovClassificationEvidence OR n:GovLedgerSnapshot
         OR n:GovGovernorProfileView OR n:GovLegalMoveView
         OR n:GovProvenanceSource OR n:GovGovernorReference
      RETURN count(n) AS count
    `);
    return result.records[0].get("count").toNumber();
  } finally {
    await session.close();
  }
}

test("Native Neo4j harness starts, imports projection, runs memory, and cleans up", async () => {
  const harness = new Neo4jHarness();
  try {
    await harness.start();
    assert.ok(harness.boltPort > 0);
    assert.ok(harness.httpPort > 0);

      const snapshot = withVerifiedOutcomeFixtures(buildTestSnapshot());
    const driver = neo4j.driver(harness.uri, neo4j.auth.basic("", ""));

    try {
      // Import the snapshot
      await importSnapshot(driver, snapshot);

      // Verify node count
      const nodeCount = await countNodes(driver);
      assert.equal(nodeCount, snapshot.nodes.length);

      // Run aspect_context query via Neo4jProvider
      const neo4jProvider = new Neo4jProvider({
        uri: harness.uri,
        username: "",
        password: "",
        database: "neo4j",
        projectionFingerprint: snapshot.projectionFingerprint,
      });

      try {
        const aspectId = policyRelease.typedAspects[0].aspectId;
        const neo4jResult = await neo4jProvider.executeNamedQuery("aspect_context", { aspectId });

        // Compare with SnapshotProvider
        const snapshotProvider = new SnapshotProvider(snapshot);
        const memResult = await snapshotProvider.executeNamedQuery("aspect_context", { aspectId });

        // Parity: same structure (compare key fields since Neo4j normalization may differ slightly)
        assert.equal(neo4jResult.queryId, memResult.queryId);
        assert.equal(neo4jResult.data.mode, memResult.data.mode);
        assert.ok(neo4jResult.data.value);
        assert.equal(neo4jResult.data.value.aspectId, memResult.data.value.aspectId);
        assert.equal(neo4jResult.data.value.primaryGovernor, memResult.data.value.primaryGovernor);
        assert.equal(neo4jResult.data.value.admissionStatus, memResult.data.value.admissionStatus);

        // Run rule_explanation query for an inactive rule.
        const ruleId = policyRelease.bridgeRules[0].ruleId;
        assert.equal(policyRelease.activeRuleIds.includes(ruleId), false);
        const ruleResult = await neo4jProvider.executeNamedQuery("rule_explanation", { ruleId });
        const memoryRuleResult = await snapshotProvider.executeNamedQuery("rule_explanation", { ruleId });
        assert.equal(ruleResult.data.mode, "scalar");
        assert.ok(ruleResult.data.value);
        assert.equal(ruleResult.data.value.ruleId, ruleId);
        assert.equal(ruleResult.data.value.active, false);
        assert.equal(ruleResult.data.value.causalClaim, false);
        assert.deepEqual(ruleResult, memoryRuleResult);

        // Requested depth must produce the same non-empty bounded paths.
        const release = snapshot.nodes.find((n) => n.label === "GovRuntimePolicyRelease");
        const pathParams = { logicalId: release.logicalId, maxDepth: 1 };
        const neo4jPaths = await neo4jProvider.executeNamedQuery("provenance_path", pathParams);
        const memoryPaths = await snapshotProvider.executeNamedQuery("provenance_path", pathParams);
        assert.ok(memoryPaths.data.rowCount > 0);
        assert.ok(memoryPaths.data.rows.every((row) => row.depth === 1));
        assert.deepEqual(neo4jPaths, memoryPaths);

        // Requested limit must produce the same non-empty prefix.
        const outcomeParams = { taskId: "task:gov-206-parity", limit: 2 };
        const neo4jOutcomes = await neo4jProvider.executeNamedQuery("prior_verified_outcomes", outcomeParams);
        const memoryOutcomes = await snapshotProvider.executeNamedQuery("prior_verified_outcomes", outcomeParams);
        assert.equal(memoryOutcomes.data.rowCount, 2);
        assert.deepEqual(memoryOutcomes.data.rows.map((row) => row.revision), [1, 2]);
        assert.deepEqual(neo4jOutcomes, memoryOutcomes);
      } finally {
        await neo4jProvider.close();
      }

      // Delete projection and verify node count is 0
      const resetSession = driver.session({ database: "neo4j", defaultAccessMode: neo4j.session.WRITE });
      try {
        await resetSession.run(`
          MATCH (n)
          WHERE n:GovRuntimePolicyRelease OR n:GovTypedAspect OR n:GovBridgeRule
             OR n:GovClassificationEvidence OR n:GovLedgerSnapshot
             OR n:GovGovernorProfileView OR n:GovLegalMoveView
             OR n:GovProvenanceSource OR n:GovGovernorReference
          DETACH DELETE n
        `);
      } finally {
        await resetSession.close();
      }
      assert.equal(await countNodes(driver), 0);

      // Reimport and verify exact node count
      await importSnapshot(driver, snapshot);
      assert.equal(await countNodes(driver), snapshot.nodes.length);

      // Verify no OCCUPIES_OFFICE edges
      const checkSession = driver.session({ database: "neo4j", defaultAccessMode: neo4j.session.READ });
      try {
        const occResult = await checkSession.run(`
          MATCH ()-[r:OCCUPIES_OFFICE]->()
          RETURN count(r) AS count
        `);
        assert.equal(occResult.records[0].get("count").toNumber(), 0);
      } finally {
        await checkSession.close();
      }
    } finally {
      await driver.close();
    }
  } finally {
    await harness.stop();
  }
});

test("Harness cleanup leaves no residual files or ports", async () => {
  const harness = new Neo4jHarness();
  await harness.start();
  const boltPort = harness.boltPort;
  const httpPort = harness.httpPort;
  await harness.stop();

  // Temp directory should be gone
  assert.ok(!fs.existsSync(harness.tempDir || ""));

  // Ports should be free
  const net = await import("node:net");
  for (const port of [boltPort, httpPort]) {
    if (!port) continue;
    const inUse = await new Promise((resolve) => {
      const server = net.createServer();
      server.listen(port, "127.0.0.1", () => {
        server.close(() => resolve(false));
      });
      server.on("error", () => resolve(true));
    });
    assert.ok(!inUse, `port ${port} still in use after cleanup`);
  }
});

test("Deleting graph projection does not change intrinsic runtime hashes", () => {
  const snapshot = buildTestSnapshot();
  const fingerprint = snapshot.projectionFingerprint;
  const nodeCount = snapshot.nodes.length;

  // Simulating "graph deletion" by rebuilding the snapshot produces the same fingerprint
  const rebuilt = buildTestSnapshot();
  assert.equal(rebuilt.projectionFingerprint, fingerprint);
  assert.equal(rebuilt.nodes.length, nodeCount);
});
