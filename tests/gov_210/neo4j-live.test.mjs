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

function parameters(value) {
  if (Number.isInteger(value)) return neo4j.int(value);
  if (Array.isArray(value)) return value.map(parameters);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, parameters(child)]));
  }
  return value;
}

async function runBatches(session, batches) {
  for (const batch of batches) {
    await session.executeWrite((tx) => tx.run(batch.cypher, parameters(batch.parameters)));
  }
}

test("GOV-210 import converges and all named queries have live Neo4j parity", async () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "gov210-live-"));
  const snapshotPath = path.join(temp, "snapshot.json");
  const batchesPath = path.join(temp, "batches.json");
  const queriesPath = path.join(temp, "queries.json");
  execFileSync("python3", [
    path.join(root, "scripts/generate-availability-housing.py"),
    "--output", snapshotPath,
    "--batches", batchesPath,
    "--query-results", queriesPath,
    "--context", path.join(root, "tests/gov_210/context-fixture.json"),
    "--lifecycle", path.join(root, "tests/gov_210/lifecycle-fixture.json"),
    "--batch-size", "100",
  ], { cwd: root });
  const snapshot = JSON.parse(fs.readFileSync(snapshotPath, "utf8"));
  const batches = JSON.parse(fs.readFileSync(batchesPath, "utf8"));
  const expectedQueries = JSON.parse(fs.readFileSync(queriesPath, "utf8"));
  const harness = new Neo4jHarness();

  try {
    await harness.start();
    const driver = neo4j.driver(harness.uri, neo4j.auth.basic("", ""));
    const writeSession = driver.session({ database: "neo4j", defaultAccessMode: neo4j.session.WRITE });
    const readSession = driver.session({ database: "neo4j", defaultAccessMode: neo4j.session.READ });
    try {
      for (const statement of statements(
        fs.readFileSync(path.join(root, "neo4j/gov-210/schema.cypher"), "utf8"),
      )) {
        await writeSession.run(statement);
      }
      await writeSession.run("CREATE (:GovRuntimePolicyRelease {logicalId: 'gov206-sentinel'})");
      await writeSession.run("CREATE (:CourtState {logicalId: 'crt306-sentinel'})");

      await runBatches(writeSession, batches);
      await writeSession.run(`
        CREATE (:Gov210ContextHousing {
          logicalId: 'gov210-stale-context', housingId: 'stale',
          projectionFingerprint: 'stale'
        })
      `);
      await runBatches(writeSession, batches);

      const counts = records(await readSession.run(`
        CALL {
          MATCH (n)
          WHERE any(label IN labels(n) WHERE label STARTS WITH 'Gov210')
          RETURN count(n) AS nodeCount
        }
        CALL {
          MATCH ()-[r]->()
          WHERE type(r) STARTS WITH 'GOV210_'
          RETURN count(r) AS relationshipCount
        }
        RETURN nodeCount, relationshipCount
      `))[0];
      assert.deepEqual(counts, {
        nodeCount: snapshot.counts.nodeCount,
        relationshipCount: snapshot.counts.relationshipCount,
      });
      const stale = records(await readSession.run(
        "MATCH (n {logicalId: 'gov210-stale-context'}) RETURN count(n) AS count",
      ))[0];
      assert.equal(stale.count, 0);
      const sentinels = records(await readSession.run(`
        MATCH (n) WHERE n.logicalId IN ['gov206-sentinel', 'crt306-sentinel']
        RETURN count(n) AS count
      `))[0];
      assert.equal(sentinels.count, 2);
      const housing = records(await readSession.run(`
        MATCH (record:Gov210ContextHousing)
        RETURN properties(record) AS properties
      `));
      assert.equal(housing.length, 1);
      assert.ok(!JSON.stringify(housing).includes("private"));

      for (const expected of expectedQueries) {
        const actual = records(await readSession.executeRead((tx) => tx.run(
          expected.cypher,
          parameters(expected.parameters),
          { timeout: expected.timeoutMs },
        )));
        assert.deepEqual(actual, expected.rows, `provider parity failed: ${expected.queryId}`);
        assert.deepEqual(canonicalJsonBytes(actual), canonicalJsonBytes(expected.rows));
      }
      assert.ok(expectedQueries.find((query) => query.queryId === "context_housing_for_note").rows.length > 0);
      assert.ok(expectedQueries.find((query) => query.queryId === "skill_lifecycle_history").rows.length > 0);

      const validation = statements(
        fs.readFileSync(path.join(root, "neo4j/gov-210/validation.cypher"), "utf8"),
      );
      for (const statement of validation) {
        const rows = records(await readSession.run(statement));
        assert.ok(rows.every((row) => row.passed === true || row.violations === 0), JSON.stringify(rows));
      }

      await writeSession.run(`
        MATCH (assignment:Gov210SkillAssignment)
        WITH assignment ORDER BY assignment.logicalId LIMIT 1
        REMOVE assignment.runtimeAuthority
      `);
      const authorityStatement = validation.find((statement) =>
        statement.includes("assignment_authority_guard"));
      const tampered = records(await readSession.run(authorityStatement));
      assert.equal(tampered[0].violations, 1);

      await runBatches(writeSession, batches);
      const restored = records(await readSession.run(authorityStatement));
      assert.equal(restored[0].violations, 0);

      await writeSession.run(`
        MATCH (first:Gov210SkillAvailability {skillId: 'classify_governor'})-[r1:GOV210_HAS_ELIGIBILITY]->(e1)
        MATCH (second:Gov210SkillAvailability {skillId: 'inspect_context'})-[r2:GOV210_HAS_ELIGIBILITY]->(e2)
        WITH first, second, e1, e2, properties(r1) AS p1, properties(r2) AS p2, r1, r2
        DELETE r1, r2
        CREATE (first)-[swapped1:GOV210_HAS_ELIGIBILITY]->(e2)
        CREATE (second)-[swapped2:GOV210_HAS_ELIGIBILITY]->(e1)
        SET swapped1 = p1, swapped2 = p2
      `);
      const semanticStatement = validation.find((statement) =>
        statement.includes("availability_eligibility_semantic_closure"));
      const semanticTamper = records(await readSession.run(semanticStatement));
      assert.equal(semanticTamper[0].violations, 2);
      await runBatches(writeSession, batches);

      for (const statement of statements(
        fs.readFileSync(path.join(root, "neo4j/gov-210/reset.cypher"), "utf8"),
      )) {
        await writeSession.run(statement);
      }
      const afterReset = records(await readSession.run(`
        MATCH (n)
        WHERE any(label IN labels(n) WHERE label STARTS WITH 'Gov210')
        RETURN count(n) AS count
      `))[0];
      assert.equal(afterReset.count, 0);
      const preserved = records(await readSession.run(`
        MATCH (n) WHERE n.logicalId IN ['gov206-sentinel', 'crt306-sentinel']
        RETURN count(n) AS count
      `))[0];
      assert.equal(preserved.count, 2);
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
