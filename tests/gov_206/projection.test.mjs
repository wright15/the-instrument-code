import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildGraphSnapshot,
  validateGraphSnapshot,
  serializeSnapshot,
  ProjectionError,
} from "../../graph/runtime/contracts.mjs";
import {
  sha256,
  canonicalJsonBytes,
  canonicalize,
  compareCodePoint,
  GOV_206_SCHEMA_VERSION,
  PROHIBITED_FIELDS,
  LIMITS,
} from "../../graph/runtime/canonical.mjs";
import { SnapshotProvider } from "../../graph/runtime/providers/snapshot-provider.mjs";
import { QUERY_CATALOG, getQuerySpec, normalizeParams } from "../../graph/runtime/query-catalog.mjs";
import { handleNamedQueryRequest, QueryError } from "../../graph/runtime/query-api.mjs";

const root = path.resolve(fileURLToPath(import.meta.url), "..", "..", "..");
const policyRelease = JSON.parse(
  await import("node:fs").then((fs) => fs.readFileSync(
    path.join(root, "seven-governors-governor-runtime-v0.1.0/canonical/policy-release.json"),
    "utf8",
  )),
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

test("buildGraphSnapshot produces a valid snapshot with correct schema version", () => {
  const snapshot = buildTestSnapshot();
  assert.equal(snapshot.schemaVersion, GOV_206_SCHEMA_VERSION);
  assert.ok(snapshot.projectionFingerprint);
  assert.match(snapshot.projectionFingerprint, /^[a-f0-9]{64}$/);
  assert.equal(snapshot.sourceFingerprint, policyRelease.sourceFingerprint);
  assert.equal(snapshot.policyFingerprint, policyRelease.policyFingerprint);
  assert.ok(snapshot.nodes.length > 0);
  assert.ok(snapshot.edges.length > 0);
  assert.equal(snapshot.counts.nodeCount, snapshot.nodes.length);
  assert.equal(snapshot.counts.edgeCount, snapshot.edges.length);
});

test("snapshot contains no prohibited namespace fields", () => {
  const snapshot = buildTestSnapshot();
  const serialized = JSON.stringify(snapshot);
  for (const field of PROHIBITED_FIELDS) {
    assert.ok(!serialized.includes(`"${field}"`), `prohibited field "${field}" found in snapshot`);
  }
  const labels = new Set(snapshot.nodes.map((n) => n.label));
  assert.ok(!labels.has("ScaleState"));
  assert.ok(!labels.has("GovernorOffice"));
  assert.ok(!labels.has("MutationOperator"));
  const relTypes = new Set(snapshot.edges.map((e) => e.relationshipType));
  assert.ok(!relTypes.has("OCCUPIES_OFFICE"));
});

test("snapshot only uses Gov* labels and GOV_* relationship types", () => {
  const snapshot = buildTestSnapshot();
  for (const node of snapshot.nodes) {
    assert.ok(node.label.startsWith("Gov"), `non-Gov label: ${node.label}`);
  }
  for (const edge of snapshot.edges) {
    assert.ok(edge.relationshipType.startsWith("GOV_"), `non-GOV relationship: ${edge.relationshipType}`);
  }
});

test("snapshot has unique logical IDs for nodes and edges", () => {
  const snapshot = buildTestSnapshot();
  const nodeIds = new Set(snapshot.nodes.map((n) => n.logicalId));
  assert.equal(nodeIds.size, snapshot.nodes.length);
  const edgeIds = new Set(snapshot.edges.map((e) => e.logicalId));
  assert.equal(edgeIds.size, snapshot.edges.length);
});

test("snapshot nodes and edges are sorted by logicalId", () => {
  const snapshot = buildTestSnapshot();
  for (let i = 1; i < snapshot.nodes.length; i++) {
    assert.ok(compareCodePoint(snapshot.nodes[i - 1].logicalId, snapshot.nodes[i].logicalId) <= 0,
      "nodes not sorted");
  }
  for (let i = 1; i < snapshot.edges.length; i++) {
    assert.ok(compareCodePoint(snapshot.edges[i - 1].logicalId, snapshot.edges[i].logicalId) <= 0,
      "edges not sorted");
  }
});

test("snapshot fingerprint recomputes exactly (determinism)", () => {
  const first = buildTestSnapshot();
  const second = buildTestSnapshot();
  assert.equal(first.projectionFingerprint, second.projectionFingerprint);
  assert.equal(serializeSnapshot(first).toString("hex"), serializeSnapshot(second).toString("hex"));
});

test("all edge endpoints resolve to existing nodes", () => {
  const snapshot = buildTestSnapshot();
  const nodeIdSet = new Set(snapshot.nodes.map((n) => n.logicalId));
  for (const edge of snapshot.edges) {
    assert.ok(nodeIdSet.has(edge.sourceLogicalId), `dangling source: ${edge.sourceLogicalId}`);
    assert.ok(nodeIdSet.has(edge.targetLogicalId), `dangling target: ${edge.targetLogicalId}`);
  }
});

test("record hashes recompute after excluding recordSha256", () => {
  const snapshot = buildTestSnapshot();
  for (const node of snapshot.nodes) {
    const { recordSha256, ...rest } = node;
    assert.equal(sha256(rest), recordSha256, `node hash mismatch: ${node.logicalId}`);
  }
  for (const edge of snapshot.edges) {
    const { recordSha256, ...rest } = edge;
    assert.equal(sha256(rest), recordSha256, `edge hash mismatch: ${edge.logicalId}`);
  }
});

test("projection fingerprint excludes itself from hash input", () => {
  const snapshot = buildTestSnapshot();
  const { projectionFingerprint, ...core } = snapshot;
  assert.equal(sha256(core), projectionFingerprint);
});

test("validateGraphSnapshot returns no errors for a valid snapshot", () => {
  const snapshot = buildTestSnapshot();
  const errors = validateGraphSnapshot(snapshot);
  assert.deepEqual(errors, []);
});

test("validateGraphSnapshot detects duplicate node logical IDs", () => {
  const snapshot = buildTestSnapshot();
  const tampered = {
    ...snapshot,
    nodes: [...snapshot.nodes, { ...snapshot.nodes[0] }],
  };
  const errors = validateGraphSnapshot(tampered);
  assert.ok(errors.includes("duplicate_node_logical_id"));
});

test("validateGraphSnapshot detects dangling edge endpoints", () => {
  const snapshot = buildTestSnapshot();
  const tampered = {
    ...snapshot,
    edges: [...snapshot.edges, {
      ...snapshot.edges[0],
      logicalId: "gov:e:phantom-edge",
      targetLogicalId: "gov:does-not-exist",
    }],
  };
  const errors = validateGraphSnapshot(tampered);
  assert.ok(errors.some((e) => e.includes("dangling")));
});

test("validateGraphSnapshot detects fingerprint mismatch", () => {
  const snapshot = buildTestSnapshot();
  const tampered = {
    ...snapshot,
    projectionFingerprint: "0".repeat(64),
  };
  const errors = validateGraphSnapshot(tampered);
  assert.ok(errors.includes("projection_fingerprint_mismatch"));
});

test("SnapshotProvider executes aspect_context query", async () => {
  const snapshot = buildTestSnapshot();
  const provider = new SnapshotProvider(snapshot);
  const aspectId = policyRelease.typedAspects[0].aspectId;
  const result = await provider.executeNamedQuery("aspect_context", { aspectId });
  assert.equal(result.queryId, "aspect_context");
  assert.equal(result.data.mode, "scalar");
  assert.ok(result.data.value);
  assert.equal(result.data.value.aspectId, aspectId);
  assert.ok(result.resultFingerprint);
  assert.match(result.resultFingerprint, /^[a-f0-9]{64}$/);
});

test("SnapshotProvider returns null for unknown aspect", async () => {
  const snapshot = buildTestSnapshot();
  const provider = new SnapshotProvider(snapshot);
  const result = await provider.executeNamedQuery("aspect_context", { aspectId: "aspect:nonexistent:v1" });
  assert.equal(result.data.mode, "scalar");
  assert.equal(result.data.value, null);
});

test("SnapshotProvider executes rule_explanation query", async () => {
  const snapshot = buildTestSnapshot();
  const provider = new SnapshotProvider(snapshot);
  const ruleId = policyRelease.bridgeRules[0].ruleId;
  assert.equal(policyRelease.activeRuleIds.includes(ruleId), false);
  const result = await provider.executeNamedQuery("rule_explanation", { ruleId });
  assert.equal(result.data.mode, "scalar");
  assert.ok(result.data.value);
  assert.equal(result.data.value.ruleId, ruleId);
  assert.equal(result.data.value.active, false);
  assert.equal(result.data.value.causalClaim, false);
});

test("SnapshotProvider returns sorted legal moves for legal_move_context with empty snapshot has no results", async () => {
  const snapshot = buildTestSnapshot();
  const provider = new SnapshotProvider(snapshot);
  // No runtime snapshot in this test variant, so no legal moves
  const result = await provider.executeNamedQuery("legal_move_context", { snapshotId: "nonexistent" });
  assert.equal(result.data.mode, "tabular");
  assert.equal(result.data.rowCount, 0);
});

test("query response fingerprints are deterministic and recomputable", async () => {
  const snapshot = buildTestSnapshot();
  const provider = new SnapshotProvider(snapshot);
  const aspectId = policyRelease.typedAspects[0].aspectId;
  const first = await provider.executeNamedQuery("aspect_context", { aspectId });
  const second = await provider.executeNamedQuery("aspect_context", { aspectId });
  assert.equal(first.requestFingerprint, second.requestFingerprint);
  assert.equal(first.resultFingerprint, second.resultFingerprint);
  // Recompute result fingerprint
  const { resultFingerprint, ...core } = first;
  const expected = sha256({ ...core, data: canonicalize(core.data) });
  assert.equal(expected, resultFingerprint);
});

test("query catalog rejects unknown query IDs", () => {
  assert.equal(getQuerySpec("unknown_query"), null);
});

test("query catalog has exactly six allowed queries", () => {
  const ids = Object.keys(QUERY_CATALOG);
  assert.equal(ids.length, 6);
  assert.ok(ids.includes("aspect_context"));
  assert.ok(ids.includes("governor_profile"));
  assert.ok(ids.includes("rule_explanation"));
  assert.ok(ids.includes("legal_move_context"));
  assert.ok(ids.includes("provenance_path"));
  assert.ok(ids.includes("prior_verified_outcomes"));
});

test("query API rejects raw cypher parameter", async () => {
  const snapshot = buildTestSnapshot();
  const provider = new SnapshotProvider(snapshot);
  await assert.rejects(
    () => handleNamedQueryRequest(
      { schemaVersion: "gov-206.named-query-request.v1", queryId: "aspect_context", parameters: { aspectId: "test" }, cypher: "MATCH (n) RETURN n" },
      provider,
      snapshot.projectionFingerprint,
    ),
    (err) => err instanceof QueryError && err.code === "raw_cypher_rejected",
  );
});

test("query API rejects unknown request properties", async () => {
  const snapshot = buildTestSnapshot();
  const provider = new SnapshotProvider(snapshot);
  const aspectId = policyRelease.typedAspects[0].aspectId;
  await assert.rejects(
    () => handleNamedQueryRequest(
      { schemaVersion: "gov-206.named-query-request.v1", queryId: "aspect_context", parameters: { aspectId }, extraField: true },
      provider,
      snapshot.projectionFingerprint,
    ),
    (err) => err instanceof QueryError && err.code === "unknown_request_property",
  );
});

test("query API rejects provider selection", async () => {
  const snapshot = buildTestSnapshot();
  const provider = new SnapshotProvider(snapshot);
  const aspectId = policyRelease.typedAspects[0].aspectId;
  await assert.rejects(
    () => handleNamedQueryRequest(
      { schemaVersion: "gov-206.named-query-request.v1", queryId: "aspect_context", parameters: { aspectId }, provider: "neo4j" },
      provider,
      snapshot.projectionFingerprint,
    ),
    (err) => err instanceof QueryError && err.code === "provider_selection_rejected",
  );
});

test("query API rejects missing required parameters", async () => {
  const snapshot = buildTestSnapshot();
  const provider = new SnapshotProvider(snapshot);
  await assert.rejects(
    () => handleNamedQueryRequest(
      { schemaVersion: "gov-206.named-query-request.v1", queryId: "aspect_context", parameters: {} },
      provider,
      snapshot.projectionFingerprint,
    ),
    (err) => err instanceof QueryError,
  );
});

test("query API rejects unknown query ID", async () => {
  const snapshot = buildTestSnapshot();
  const provider = new SnapshotProvider(snapshot);
  await assert.rejects(
    () => handleNamedQueryRequest(
      { schemaVersion: "gov-206.named-query-request.v1", queryId: "raw_shell_exec", parameters: {} },
      provider,
      snapshot.projectionFingerprint,
    ),
    (err) => err instanceof QueryError && err.code === "unknown_query_id",
  );
});

test("query API rejects invalid governor parameter", async () => {
  const snapshot = buildTestSnapshot();
  const provider = new SnapshotProvider(snapshot);
  await assert.rejects(
    () => handleNamedQueryRequest(
      { schemaVersion: "gov-206.named-query-request.v1", queryId: "governor_profile", parameters: { governor: "Pluto" } },
      provider,
      snapshot.projectionFingerprint,
    ),
    (err) => err instanceof QueryError && err.code === "invalid_governor",
  );
});

test("query API rejects oversize request body", async () => {
  const snapshot = buildTestSnapshot();
  const provider = new SnapshotProvider(snapshot);
  const huge = Buffer.alloc(LIMITS.MAX_REQUEST_BYTES + 1, 0x20);
  await assert.rejects(
    () => handleNamedQueryRequest(huge, provider, snapshot.projectionFingerprint),
    (err) => err instanceof QueryError && err.code === "request_too_large",
  );
});

test("query API enforces max depth parameter boundary", async () => {
  const snapshot = buildTestSnapshot();
  const provider = new SnapshotProvider(snapshot);
  const nodeId = snapshot.nodes[0].logicalId;
  await assert.rejects(
    () => handleNamedQueryRequest(
      { schemaVersion: "gov-206.named-query-request.v1", queryId: "provenance_path", parameters: { logicalId: nodeId, maxDepth: 4 } },
      provider,
      snapshot.projectionFingerprint,
    ),
    (err) => err instanceof QueryError && err.code === "invalid_max_depth",
  );
});

test("query API enforces max limit boundary", async () => {
  const snapshot = buildTestSnapshot();
  const provider = new SnapshotProvider(snapshot);
  await assert.rejects(
    () => handleNamedQueryRequest(
      { schemaVersion: "gov-206.named-query-request.v1", queryId: "prior_verified_outcomes", parameters: { taskId: "task:test", limit: 101 } },
      provider,
      snapshot.projectionFingerprint,
    ),
    (err) => err instanceof QueryError && err.code === "invalid_limit",
  );
});

test("provenance_path honors requested depth with non-empty results", async () => {
  const snapshot = buildTestSnapshot();
  const provider = new SnapshotProvider(snapshot);
  const release = snapshot.nodes.find((n) => n.label === "GovRuntimePolicyRelease");
  const shallow = await provider.executeNamedQuery("provenance_path", { logicalId: release.logicalId, maxDepth: 1 });
  const deeper = await provider.executeNamedQuery("provenance_path", { logicalId: release.logicalId, maxDepth: 2 });
  assert.equal(shallow.data.mode, "tabular");
  assert.ok(shallow.data.rowCount > 0);
  assert.ok(shallow.data.rows.every((row) => row.depth === 1));
  assert.ok(deeper.data.rows.some((row) => row.depth === 2));
});

test("prior_verified_outcomes honors requested limit with non-empty results", async () => {
  const taskId = "task:gov-206-limit";
  const snapshot = buildTestSnapshot();
  const outcomeNodes = [1, 2, 3].map((revision) => ({
    logicalId: `gov:snapshot:${String(revision).repeat(64)}`,
    label: "GovLedgerSnapshot",
    verificationStatus: "verified",
    properties: {
      snapshotSha256: String(revision).repeat(64),
      taskId,
      phase: "VERIFIED",
      revision,
      eventCount: revision,
      stateSha256: "a".repeat(64),
      ledgerHeadSha256: "b".repeat(64),
      lifecycleVerified: true,
    },
  }));
  const provider = new SnapshotProvider({
    ...snapshot,
    nodes: [...snapshot.nodes, ...outcomeNodes],
  });
  const result = await provider.executeNamedQuery("prior_verified_outcomes", { taskId, limit: 2 });
  assert.equal(result.data.rowCount, 2);
  assert.deepEqual(result.data.rows.map((row) => row.revision), [1, 2]);
});

test("graph snapshot with runtime export produces legal moves with contextual-only metadata", () => {
  const runtimeExport = {
    schemaVersion: "gov-206.runtime-export.v1",
    runtimeSnapshot: {
      snapshotSha256: "a".repeat(64),
      stateSha256: "b".repeat(64),
      ledgerHeadSha256: "c".repeat(64),
      eventCount: 1,
      taskId: "task:gov-206-test",
      phase: "VERIFIED",
      revision: 1,
      capabilities: ["runtime.inspect"],
      ledgerVerified: true,
      lifecycleVerified: true,
    },
    policyFingerprint: policyRelease.policyFingerprint,
    contextFingerprint: "d".repeat(64),
    legalMoves: [{
      operationId: "operation:inspect",
      capability: "runtime.inspect",
      moveSha256: "e".repeat(64),
      priorStateSha256: "f".repeat(64),
      policyFingerprint: policyRelease.policyFingerprint,
      contextualOnly: true,
      executionAuthority: "none",
      requiresFreshValidation: true,
    }],
    projectionInputFingerprint: sha256({
      schemaVersion: "gov-206.runtime-export.v1",
      runtimeSnapshot: {
        snapshotSha256: "a".repeat(64),
        stateSha256: "b".repeat(64),
        ledgerHeadSha256: "c".repeat(64),
        eventCount: 1,
        taskId: "task:gov-206-test",
        phase: "VERIFIED",
        revision: 1,
        capabilities: ["runtime.inspect"],
        ledgerVerified: true,
        lifecycleVerified: true,
      },
      policyFingerprint: policyRelease.policyFingerprint,
      contextFingerprint: "d".repeat(64),
      legalMoves: [{
        operationId: "operation:inspect",
        capability: "runtime.inspect",
        moveSha256: "e".repeat(64),
        priorStateSha256: "f".repeat(64),
        policyFingerprint: policyRelease.policyFingerprint,
        contextualOnly: true,
        executionAuthority: "none",
        requiresFreshValidation: true,
      }],
    }),
  };
  const snapshot = buildGraphSnapshot({
    policyRelease,
    classificationResults: [],
    runtimeExport,
    profiles: [],
    provenanceSources: [],
  });
  const moveNodes = snapshot.nodes.filter((n) => n.label === "GovLegalMoveView");
  assert.equal(moveNodes.length, 1);
  const move = moveNodes[0];
  assert.equal(move.properties.contextualOnly, true);
  assert.equal(move.properties.executionAuthority, "none");
  assert.equal(move.properties.requiresFreshValidation, true);
  // No token or parameters in the move
  assert.ok(!("parameters" in move.properties));
  assert.ok(!("token" in move.properties));

  // Verify legal_move_context query works
  const provider = new SnapshotProvider(snapshot);
  const snapNode = snapshot.nodes.find((n) => n.label === "GovLedgerSnapshot");
  const result = provider._queryInMemory("legal_move_context", QUERY_CATALOG.legal_move_context, { snapshotId: snapNode.properties.snapshotSha256 });
  assert.equal(result.length, 1);
  assert.equal(result[0].contextualOnly, true);
  assert.equal(result[0].executionAuthority, "none");
});

test("prior_verified_outcomes query returns only VERIFIED snapshots", async () => {
  const runtimeExport = {
    schemaVersion: "gov-206.runtime-export.v1",
    runtimeSnapshot: {
      snapshotSha256: "a".repeat(64),
      stateSha256: "b".repeat(64),
      ledgerHeadSha256: "c".repeat(64),
      eventCount: 1,
      taskId: "task:gov-206-verified",
      phase: "VERIFIED",
      revision: 1,
      capabilities: ["runtime.inspect"],
      ledgerVerified: true,
      lifecycleVerified: true,
    },
    policyFingerprint: policyRelease.policyFingerprint,
    contextFingerprint: "d".repeat(64),
    legalMoves: [],
    projectionInputFingerprint: sha256({
      schemaVersion: "gov-206.runtime-export.v1",
      runtimeSnapshot: {
        snapshotSha256: "a".repeat(64), stateSha256: "b".repeat(64), ledgerHeadSha256: "c".repeat(64),
        eventCount: 1, taskId: "task:gov-206-verified", phase: "VERIFIED", revision: 1,
        capabilities: ["runtime.inspect"], ledgerVerified: true, lifecycleVerified: true,
      },
      policyFingerprint: policyRelease.policyFingerprint, contextFingerprint: "d".repeat(64), legalMoves: [],
    }),
  };
  const snapshot = buildGraphSnapshot({
    policyRelease,
    classificationResults: [],
    runtimeExport,
    profiles: [],
    provenanceSources: [],
  });
  const provider = new SnapshotProvider(snapshot);
  const result = await provider.executeNamedQuery("prior_verified_outcomes", { taskId: "task:gov-206-verified" });
  assert.equal(result.data.mode, "tabular");
  assert.equal(result.data.rowCount, 1);
  assert.equal(result.data.rows[0].phase, "VERIFIED");
  assert.equal(result.data.rows[0].verificationStatus, "verified");
});
