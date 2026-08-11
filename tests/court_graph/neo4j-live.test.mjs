import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import neo4j from "neo4j-driver";

import { Neo4jHarness } from "../../graph/runtime/neo4j-harness.mjs";
import { canonicalJsonBytes } from "../../graph/runtime/canonical.mjs";

const root = path.resolve(fileURLToPath(import.meta.url), "..", "..", "..");
const fixture = path.join(root, "tests/court_graph/fixture-input.json");

function statements(source) {
  return source.split(/;\s*(?:\n|$)/).map((value) => value.trim()).filter(Boolean);
}

function normalize(value) {
  if (neo4j.isInt(value)) return value.toNumber();
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, normalize(child)]));
  }
  return value;
}

function records(result) {
  return result.records.map((record) => normalize(record.toObject()));
}

function asNeo4jParameters(value) {
  if (Number.isInteger(value)) return neo4j.int(value);
  if (Array.isArray(value)) return value.map(asNeo4jParameters);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, asNeo4jParameters(child)]),
    );
  }
  return value;
}

function withoutNullProperties(value) {
  return Object.fromEntries(Object.entries(value).filter(([, child]) => child !== null));
}

async function runBatches(session, batches) {
  for (const batch of batches) {
    await session.executeWrite((tx) => tx.run(batch.cypher, asNeo4jParameters(batch.parameters)));
  }
}

test("Court projection rebuild and all named queries have live Neo4j parity", async () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "court-graph-live-"));
  const snapshotPath = path.join(temp, "snapshot.json");
  const batchesPath = path.join(temp, "batches.json");
  const queryResultsPath = path.join(temp, "query-results.json");
  execFileSync("python3", [
    path.join(root, "scripts/generate-court-graph.py"),
    "--input", fixture,
    "--snapshot", snapshotPath,
    "--batches", batchesPath,
    "--query-results", queryResultsPath,
    "--batch-size", "2",
  ], { cwd: root });
  const snapshot = JSON.parse(fs.readFileSync(snapshotPath, "utf8"));
  const batches = JSON.parse(fs.readFileSync(batchesPath, "utf8"));
  const expectedQueries = JSON.parse(fs.readFileSync(queryResultsPath, "utf8"));
  const namedQueries = statements(
    fs.readFileSync(path.join(root, "neo4j/court-mathematics/named-queries.cypher"), "utf8"),
  );
  const reset = fs.readFileSync(path.join(root, "neo4j/court-mathematics/reset.cypher"), "utf8");
  const harness = new Neo4jHarness();

  try {
    await harness.start();
    const driver = neo4j.driver(harness.uri, neo4j.auth.basic("", ""));
    const writeSession = driver.session({ database: "neo4j", defaultAccessMode: neo4j.session.WRITE });
    const readSession = driver.session({ database: "neo4j", defaultAccessMode: neo4j.session.READ });
    try {
      const schemaStatements = statements(
        fs.readFileSync(path.join(root, "neo4j/court-mathematics/schema.cypher"), "utf8"),
      );
      for (const statement of schemaStatements) {
        try {
          await writeSession.run(statement);
        } catch (error) {
          const communityExistenceConstraint = statement.includes("IS NOT NULL")
            && /enterprise|property existence constraint/i.test(error.message);
          if (!communityExistenceConstraint) throw error;
        }
      }
      const installedConstraints = records(await readSession.run("SHOW CONSTRAINTS YIELD name RETURN name"));
      const installedIndexes = records(await readSession.run("SHOW INDEXES YIELD name RETURN name"));
      assert.ok(installedConstraints.length >= 8);
      assert.ok(installedIndexes.length >= 8);

      await runBatches(writeSession, batches);
      await runBatches(writeSession, batches);
      const counts = records(await readSession.run(`
        MATCH (n)
        OPTIONAL MATCH ()-[r]->()
        RETURN count(DISTINCT n) AS nodeCount, count(DISTINCT r) AS relationshipCount
      `))[0];
      assert.equal(counts.nodeCount, snapshot.counts.nodeCount + snapshot.counts.scaleStateReferenceCount);
      assert.equal(counts.relationshipCount, snapshot.counts.relationshipCount);
      const labelCounts = records(await readSession.run(`
        MATCH (n)
        UNWIND labels(n) AS label
        WITH label
        WHERE label IN [
          'Triad','CourtCommutationRecord','CourtTransitionEvent','CourtRuntimeSession',
          'CourtLedgerSnapshot','TopologicalTranslocationRecord','CourtFilterApplication',
          'CourtFilterOperator','CourtRootedPosition','CourtState','PentatonicSetClass','PoleRegister'
        ]
        RETURN label, count(*) AS count
        ORDER BY label
      `));
      assert.deepEqual(labelCounts, [
        { label: "CourtCommutationRecord", count: 3 },
        { label: "CourtFilterApplication", count: 1 },
        { label: "CourtFilterOperator", count: 1 },
        { label: "CourtLedgerSnapshot", count: 1 },
        { label: "CourtRootedPosition", count: 1 },
        { label: "CourtRuntimeSession", count: 1 },
        { label: "CourtState", count: 1 },
        { label: "CourtTransitionEvent", count: 2 },
        { label: "PentatonicSetClass", count: 1 },
        { label: "PoleRegister", count: 1 },
        { label: "TopologicalTranslocationRecord", count: 1 },
        { label: "Triad", count: 7 },
      ]);
      const relationshipCounts = records(await readSession.run(`
        MATCH ()-[r]->()
        RETURN type(r) AS relationshipType, count(*) AS count
        ORDER BY relationshipType
      `));
      assert.deepEqual(relationshipCounts, [
        { relationshipType: "FILTERS", count: 1 },
        { relationshipType: "HAS_COMMUTATION_RESULT", count: 2 },
        { relationshipType: "HAS_LEDGER_SNAPSHOT", count: 1 },
        { relationshipType: "HAS_POLE_REGISTER", count: 1 },
        { relationshipType: "HAS_TRANSITION_EVENT", count: 2 },
        { relationshipType: "HAS_TRANSLOCATION", count: 1 },
        { relationshipType: "HAS_TRIAD", count: 7 },
        { relationshipType: "SNAPSHOTS_STATE", count: 1 },
        { relationshipType: "USES_FILTER", count: 1 },
        { relationshipType: "USES_ROUTE_RECORD", count: 1 },
        { relationshipType: "YIELDS_ADMITTED_SET", count: 1 },
      ]);

      assert.equal(namedQueries.length, expectedQueries.length);
      for (let index = 0; index < expectedQueries.length; index += 1) {
        const expected = expectedQueries[index];
        const actual = records(await readSession.executeRead((tx) => tx.run(
          namedQueries[index], asNeo4jParameters(expected.parameters), { timeout: 1000 },
        )));
        assert.deepEqual(actual, expected.rows, `provider parity failed: ${expected.queryId}`);
        assert.deepEqual(
          canonicalJsonBytes(actual),
          canonicalJsonBytes(expected.rows),
          `provider byte parity failed: ${expected.queryId}`,
        );
      }

      const validationStatements = statements(
        fs.readFileSync(path.join(root, "neo4j/court-mathematics/validation.cypher"), "utf8"),
      );
      for (const statement of validationStatements) {
        const result = records(await readSession.run(statement));
        assert.ok(result.every((row) => row.status === "PASS"), JSON.stringify(result));
      }

      await writeSession.run(`
        MATCH (event:CourtTransitionEvent)
        WITH event ORDER BY event.sequence LIMIT 1
        REMOVE event.verificationStatus
      `);
      const tamperedValidation = [];
      for (const statement of validationStatements) {
        tamperedValidation.push(...records(await readSession.run(statement)));
      }
      assert.equal(
        tamperedValidation.find((row) => row.check === "runtime_event_chain_closure")?.status,
        "FAIL",
      );
      await runBatches(writeSession, batches);

      const beforeRebuild = records(await readSession.run(`
        MATCH (n)
        WHERE n.projectionFingerprint = $fingerprint
        RETURN n.logicalId AS logicalId, properties(n) AS properties
        ORDER BY logicalId
      `, { fingerprint: snapshot.projectionFingerprint }));
      const beforeRelationships = records(await readSession.run(`
        MATCH ()-[r]->()
        WHERE r.projectionFingerprint = $fingerprint
        RETURN r.logicalId AS logicalId, type(r) AS relationshipType,
               properties(r) AS properties
        ORDER BY logicalId
      `, { fingerprint: snapshot.projectionFingerprint }));
      const expectedNodes = snapshot.nodes.map((node) => ({
        logicalId: node.logicalId,
        properties: withoutNullProperties({
          ...node.properties,
          logicalId: node.logicalId,
          recordSha256: node.recordSha256,
          sourceSha256: node.sourceSha256,
          admissionStatus: node.admissionStatus,
          projectionFingerprint: snapshot.projectionFingerprint,
        }),
      })).sort((left, right) => left.logicalId < right.logicalId ? -1 : left.logicalId > right.logicalId ? 1 : 0);
      const expectedRelationships = snapshot.relationships.map((relationship) => ({
        logicalId: relationship.logicalId,
        relationshipType: relationship.relationshipType,
        properties: withoutNullProperties({
          ...relationship.properties,
          logicalId: relationship.logicalId,
          recordSha256: relationship.recordSha256,
          sourceSha256: relationship.sourceSha256,
          admissionStatus: relationship.admissionStatus,
          projectionFingerprint: snapshot.projectionFingerprint,
        }),
      })).sort((left, right) => left.logicalId < right.logicalId ? -1 : left.logicalId > right.logicalId ? 1 : 0);
      assert.deepEqual(canonicalJsonBytes(beforeRebuild), canonicalJsonBytes(expectedNodes));
      assert.deepEqual(
        canonicalJsonBytes(beforeRelationships),
        canonicalJsonBytes(expectedRelationships),
      );

      await writeSession.run(reset);
      await runBatches(writeSession, batches);
      const rebuilt = records(await readSession.run(`
        MATCH (n)
        WHERE n.projectionFingerprint = $fingerprint
        OPTIONAL MATCH ()-[r]->()
        WHERE r.projectionFingerprint = $fingerprint
        RETURN count(DISTINCT n) AS nodeCount, count(DISTINCT r) AS relationshipCount,
               collect(DISTINCT n.logicalId) AS nodeIds, collect(DISTINCT r.logicalId) AS relationshipIds
      `, { fingerprint: snapshot.projectionFingerprint }))[0];
      assert.equal(rebuilt.nodeCount, snapshot.counts.nodeCount);
      assert.equal(rebuilt.relationshipCount, snapshot.counts.relationshipCount);
      assert.deepEqual(rebuilt.nodeIds.sort(), snapshot.nodes.map((node) => node.logicalId).sort());
      assert.deepEqual(
        rebuilt.relationshipIds.sort(),
        snapshot.relationships.map((edge) => edge.logicalId).sort(),
      );
      const afterRebuild = records(await readSession.run(`
        MATCH (n)
        WHERE n.projectionFingerprint = $fingerprint
        RETURN n.logicalId AS logicalId, properties(n) AS properties
        ORDER BY logicalId
      `, { fingerprint: snapshot.projectionFingerprint }));
      const afterRelationships = records(await readSession.run(`
        MATCH ()-[r]->()
        WHERE r.projectionFingerprint = $fingerprint
        RETURN r.logicalId AS logicalId, type(r) AS relationshipType,
               properties(r) AS properties
        ORDER BY logicalId
      `, { fingerprint: snapshot.projectionFingerprint }));
      assert.deepEqual(afterRebuild, beforeRebuild);
      assert.deepEqual(afterRelationships, beforeRelationships);
    } finally {
      await readSession.close();
      await writeSession.close();
      await driver.close();
    }
  } finally {
    await harness.stop();
    fs.rmSync(temp, { recursive: true, force: true });
  }
});
