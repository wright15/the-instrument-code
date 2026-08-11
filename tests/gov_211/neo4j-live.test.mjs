import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import neo4j from "neo4j-driver";

import { Neo4jHarness } from "../../graph/runtime/neo4j-harness.mjs";
import { canonicalJsonBytes } from "../../graph/runtime/canonical.mjs";


const root = path.resolve(fileURLToPath(import.meta.url), "..", "..", "..");
const queryIds = new Set([
  "skills_for_topology_target",
  "skills_for_court_position",
]);

function statements(source) {
  return source.split(/;\s*(?:\n|$)/).map((value) => value.trim()).filter(Boolean);
}

function normalize(value) {
  if (neo4j.isInt(value)) return value.toNumber();
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, normalize(child)]),
    );
  }
  return value;
}

function parameters(value) {
  if (Number.isInteger(value)) return neo4j.int(value);
  if (Array.isArray(value)) return value.map(parameters);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, parameters(child)]),
    );
  }
  return value;
}

function records(result) {
  return result.records.map((record) => normalize(record.toObject()));
}

function sha256(value) {
  return createHash("sha256").update(canonicalJsonBytes(value)).digest("hex");
}

function seal(query, rows, projectionFingerprint) {
  const core = {
    parameterFingerprint: sha256(query.parameters),
    parameters: query.parameters,
    projectionFingerprint,
    queryId: query.queryId,
    rows,
    schemaVersion: "gov-211.assignment-query-result.v1",
  };
  return { ...core, resultFingerprint: sha256(core) };
}

async function runBatches(session, batches) {
  for (const batch of batches) {
    await session.executeWrite((tx) => tx.run(
      batch.cypher,
      parameters(batch.parameters),
    ));
  }
}

test("GOV-211 seals byte-identical file and live Neo4j assignment rows", async () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "gov211-live-"));
  const snapshotPath = path.join(temp, "snapshot.json");
  const batchesPath = path.join(temp, "batches.json");
  const queriesPath = path.join(temp, "queries.json");
  execFileSync("python3", [
    path.join(root, "scripts/generate-availability-housing.py"),
    "--output", snapshotPath,
    "--batches", batchesPath,
    "--query-results", queriesPath,
    "--batch-size", "100",
  ], { cwd: root });
  const snapshot = JSON.parse(fs.readFileSync(snapshotPath, "utf8"));
  const batches = JSON.parse(fs.readFileSync(batchesPath, "utf8"));
  const expectedQueries = JSON.parse(fs.readFileSync(queriesPath, "utf8"))
    .filter((query) => queryIds.has(query.queryId));
  assert.equal(expectedQueries.length, 2);
  const harness = new Neo4jHarness();

  try {
    await harness.start();
    const driver = neo4j.driver(harness.uri, neo4j.auth.basic("", ""));
    const writeSession = driver.session({
      database: "neo4j",
      defaultAccessMode: neo4j.session.WRITE,
    });
    const readSession = driver.session({
      database: "neo4j",
      defaultAccessMode: neo4j.session.READ,
    });
    try {
      for (const statement of statements(
        fs.readFileSync(path.join(root, "neo4j/gov-210/schema.cypher"), "utf8"),
      )) {
        await writeSession.run(statement);
      }
      await runBatches(writeSession, batches);

      for (const expected of expectedQueries) {
        const liveRows = records(await readSession.executeRead((tx) => tx.run(
          expected.cypher,
          parameters(expected.parameters),
          { timeout: expected.timeoutMs },
        )));
        assert.deepEqual(liveRows, expected.rows);
        const fileResult = seal(
          expected,
          expected.rows,
          snapshot.projectionFingerprint,
        );
        const liveResult = seal(
          expected,
          liveRows,
          snapshot.projectionFingerprint,
        );
        assert.deepEqual(canonicalJsonBytes(liveResult), canonicalJsonBytes(fileResult));
        assert.deepEqual(seal(
          expected,
          liveRows,
          snapshot.projectionFingerprint,
        ), liveResult);
        assert.equal(liveResult.rows.every(
          (row) => row.informationalOnly === true && row.runtimeAuthority === false,
        ), true);
      }

      for (const statement of statements(
        fs.readFileSync(path.join(root, "neo4j/gov-210/reset.cypher"), "utf8"),
      )) {
        await writeSession.run(statement);
      }
      const remaining = records(await readSession.run(`
        MATCH (n)
        WHERE any(label IN labels(n) WHERE label STARTS WITH 'Gov210')
        RETURN count(n) AS count
      `))[0];
      assert.equal(remaining.count, 0);
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
