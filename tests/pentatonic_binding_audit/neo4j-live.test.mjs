import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import neo4j from "neo4j-driver";

import { canonicalJsonBytes, sha256 } from "../../graph/runtime/canonical.mjs";
import { Neo4jHarness } from "../../graph/runtime/neo4j-harness.mjs";

const root = path.resolve(fileURLToPath(import.meta.url), "..", "..", "..");
const auditRoot = path.join(root, "neo4j/pentatonic-binding-audit");
const candidatePath = path.join(
  root,
  "canonical/pentatonic-binding-candidates/pentatonic-7-35-parent-audit-v1.json",
);
const qaPath = path.join(root, "qa/pentatonic-binding-audit-neo4j-validation.json");
const activeSourceHashes = {
  "graph/runtime/neo4j-bootstrap.mjs": "fbe48b913c6fefd9aaca642132138b45e5838bcd851a9575b6059debd91ed821",
  "graph/runtime/neo4j-roundtrip.mjs": "60e8ce3609a3d36b3c8053ee796eb8ab9b87a8b896d41ac7be00c8f54a3cfe2b",
  "graph/runtime/query-catalog.mjs": "c6e7f5a4bb87f0fb190e54bc5879271408d38c83fd58dbc2f6953f0523fd5e94",
  "src/governor/court_graph_projection.py": "4a5e13ebe69aa96f4a3319bdd5f3ea19bec745b3aa024532297acc885c85bb10",
  "src/governor/court_graph_queries.py": "3442e4cd03a3885a5cd7706d8146974eba20fc564edf08acb4bb2db0479ddcc8",
};

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

function endpoint(uri) {
  const parsed = new URL(uri);
  const hostname = parsed.hostname.toLowerCase() === "localhost" ? "127.0.0.1" : parsed.hostname.toLowerCase();
  return `${hostname}:${parsed.port || "7687"}`;
}

function dedicatedAuditUri(environment = process.env) {
  if (environment.PENTATONIC_BINDING_AUDIT_EPHEMERAL !== "1") {
    throw new Error("pentatonic_binding_audit_ephemeral_guard_required");
  }
  const dedicated = environment.PENTATONIC_BINDING_AUDIT_NEO4J_URI;
  if (!dedicated) throw new Error("pentatonic_binding_audit_uri_required");
  if (environment.NEO4J_URI && endpoint(dedicated) === endpoint(environment.NEO4J_URI)) {
    throw new Error("pentatonic_binding_audit_uri_must_differ_from_application_uri");
  }
  return dedicated;
}

function sha256File(relativePath) {
  return createHash("sha256").update(fs.readFileSync(path.join(root, relativePath))).digest("hex");
}

function assertActiveSourcesUnchanged() {
  const actual = Object.fromEntries(
    Object.keys(activeSourceHashes).map((relativePath) => [relativePath, sha256File(relativePath)]),
  );
  assert.deepEqual(actual, activeSourceHashes);
  return actual;
}

async function runStatements(session, relativePath) {
  const source = fs.readFileSync(path.join(auditRoot, relativePath), "utf8");
  for (const statement of statements(source)) await session.run(statement);
}

async function importAudit(session, importStatement, candidate) {
  const realizations = candidate.reviewedRootedWitnesses;
  const expectedEdges = realizations.reduce((total, item) => total + item.parentScaleStates.length, 0);
  return session.executeWrite(async (transaction) => {
    const result = await transaction.run(importStatement, parameters({
      candidateFingerprint: candidate.candidateFingerprint,
      realizations,
    }));
    const row = records(result)[0] ?? { importedRealizations: 0, importedEdges: 0 };
    if (row.importedRealizations !== realizations.length || row.importedEdges !== expectedEdges) {
      throw new Error(
        `pentatonic_binding_audit_endpoint_resolution_failed:${row.importedRealizations}:${row.importedEdges}`,
      );
    }
    return row;
  });
}

async function scaleStateFingerprint(session) {
  const rows = records(await session.run(`
    MATCH (state:ScaleState)
    RETURN state.id AS id, labels(state) AS labels, properties(state) AS properties
    ORDER BY state.id
  `)).map((row) => ({ ...row, labels: [...row.labels].sort() }));
  return sha256(rows);
}

async function auditSchemaObjects(session) {
  const constraints = records(await session.run(`
    SHOW CONSTRAINTS YIELD name
    WHERE toLower(name) CONTAINS 'pentatonic_audit'
    RETURN name ORDER BY name
  `));
  const indexes = records(await session.run(`
    SHOW INDEXES YIELD name
    WHERE toLower(name) CONTAINS 'pentatonic_audit'
    RETURN name ORDER BY name
  `));
  return { constraints, indexes };
}

async function portCanBind(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.listen(port, "127.0.0.1", () => server.close(() => resolve(true)));
  });
}

function processIsAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    if (error.code === "ESRCH") return false;
    throw error;
  }
}

async function assertHarnessResidueRemoved(identity) {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    const clean = !fs.existsSync(identity.tempDir)
      && !processIsAlive(identity.pid)
      && await portCanBind(identity.boltPort)
      && await portCanBind(identity.httpPort);
    if (clean) return;
    await sleep(100);
  }
  assert.equal(fs.existsSync(identity.tempDir), false, `residual directory: ${identity.tempDir}`);
  assert.equal(processIsAlive(identity.pid), false, `residual process: ${identity.pid}`);
  assert.equal(await portCanBind(identity.boltPort), true, `residual Bolt port: ${identity.boltPort}`);
  assert.equal(await portCanBind(identity.httpPort), true, `residual HTTP port: ${identity.httpPort}`);
}

function expectedProjection(candidate) {
  const nodes = candidate.reviewedRootedWitnesses.map((item) => ({
    witnessId: item.witnessId,
    properties: {
      admissionEffect: "none",
      candidateFingerprint: candidate.candidateFingerprint,
      evidenceStatus: "planning_evidence",
      forteNumber: item.forteNumber,
      pitchMask: item.pitchMask,
      pitchMask12: item.pitchMask12,
      rootPc: item.rootPc,
      setClassId: item.setClassId,
      witnessId: item.witnessId,
      witnessType: item.witnessType,
    },
  })).sort((left, right) => left.witnessId.localeCompare(right.witnessId));
  const edges = candidate.reviewedRootedWitnesses.flatMap((item) =>
    item.parentScaleStates.map((parent) => ({
      logicalId: `pentatonic-audit:${item.witnessId}->${parent.scaleStateId}`,
      properties: {
        admissionEffect: "none",
        candidateFingerprint: candidate.candidateFingerprint,
        evidenceStatus: "planning_evidence",
        logicalId: `pentatonic-audit:${item.witnessId}->${parent.scaleStateId}`,
        pentatonicMask: item.pitchMask,
        scaleStateId: parent.scaleStateId,
      },
      scaleStateId: parent.scaleStateId,
      witnessId: item.witnessId,
    })),
  ).sort((left, right) => left.logicalId.localeCompare(right.logicalId));
  return { nodes, edges };
}

test("detached pentatonic binding audit imports and tears down without residue", async () => {
  const candidate = JSON.parse(fs.readFileSync(candidatePath, "utf8"));
  const { candidateFingerprint, ...candidateCore } = candidate;
  assert.equal(sha256(candidateCore), candidateFingerprint);
  assert.equal(candidate.candidateFingerprint, "ce6702441e0d302480b2949304d76079c529b6b445fca7d1e9a58ea16678a43a");
  assert.equal(candidate.status, "planning_evidence");
  assert.equal(candidate.reviewedRootedWitnesses.length, 7);
  const expected = expectedProjection(candidate);
  assert.equal(expected.edges.length, 19);
  assertActiveSourcesUnchanged();

  assert.throws(() => dedicatedAuditUri({}), /ephemeral_guard_required/);
  assert.throws(
    () => dedicatedAuditUri({ PENTATONIC_BINDING_AUDIT_EPHEMERAL: "1" }),
    /uri_required/,
  );
  assert.throws(() => dedicatedAuditUri({
    PENTATONIC_BINDING_AUDIT_EPHEMERAL: "1",
    PENTATONIC_BINDING_AUDIT_NEO4J_URI: "neo4j://localhost:7687",
    NEO4J_URI: "bolt://127.0.0.1:7687",
  }), /must_differ/);

  const importSource = fs.readFileSync(path.join(auditRoot, "import.cypher"), "utf8");
  const importStatements = statements(importSource);
  assert.equal(importStatements.length, 1);
  assert.match(importSource, /MATCH \(state:ScaleState \{id: parent\.scaleStateId\}\)/);
  assert.doesNotMatch(importSource, /MERGE\s*\(state:ScaleState/i);
  assert.doesNotMatch(importSource, /\b(?:SET|REMOVE)\s+state\b/i);

  const originalEnvironment = {
    guard: process.env.PENTATONIC_BINDING_AUDIT_EPHEMERAL,
    uri: process.env.PENTATONIC_BINDING_AUDIT_NEO4J_URI,
  };
  const harness = new Neo4jHarness();
  let driver;
  let cleanupIdentity;
  let teardownComplete = false;
  let validationRows = [];
  let scaleFingerprint;

  try {
    await harness.start();
    cleanupIdentity = {
      tempDir: harness.tempDir,
      pid: harness.process.pid,
      boltPort: harness.boltPort,
      httpPort: harness.httpPort,
    };
    process.env.PENTATONIC_BINDING_AUDIT_NEO4J_URI = harness.uri;
    process.env.PENTATONIC_BINDING_AUDIT_EPHEMERAL = "1";
    const uri = dedicatedAuditUri();
    assert.equal(uri, harness.uri);

    driver = neo4j.driver(uri, neo4j.auth.basic("", ""));
    const writeSession = driver.session({ database: "neo4j", defaultAccessMode: neo4j.session.WRITE });
    const readSession = driver.session({ database: "neo4j", defaultAccessMode: neo4j.session.READ });
    try {
      const fresh = records(await readSession.run(`
        CALL { MATCH (node) RETURN count(node) AS nodeCount }
        CALL { MATCH ()-[edge]->() RETURN count(edge) AS relationshipCount }
        RETURN nodeCount, relationshipCount
      `))[0];
      assert.deepEqual(fresh, { nodeCount: 0, relationshipCount: 0 });
      assert.deepEqual(await auditSchemaObjects(readSession), { constraints: [], indexes: [] });

      await runStatements(writeSession, "schema.cypher");
      const installedSchema = await auditSchemaObjects(readSession);
      assert.deepEqual(installedSchema.constraints, [{ name: "pentatonic_audit_realization_witness_id" }]);
      assert.deepEqual(installedSchema.indexes.map((row) => row.name), [
        "pentatonic_audit_realization_mask",
        "pentatonic_audit_realization_witness_id",
      ]);

      const scaleStateIds = [...new Set(expected.edges.map((edge) => edge.scaleStateId))].sort((a, b) => a - b);
      await writeSession.run(
        "UNWIND $ids AS id CREATE (:ScaleState {id: id})",
        parameters({ ids: scaleStateIds }),
      );
      const missingId = scaleStateIds[0];
      await writeSession.run("MATCH (state:ScaleState {id: $id}) DELETE state", parameters({ id: missingId }));
      await assert.rejects(
        importAudit(writeSession, importStatements[0], candidate),
        /missing_scale_state_endpoint|constraint|already exists|endpoint_resolution_failed/i,
      );
      const failedImport = records(await readSession.run(`
        CALL { MATCH (audit:PentatonicAuditRealization) RETURN count(audit) AS nodes }
        CALL { MATCH ()-[edge:SUBSET_OF_7_35]->() RETURN count(edge) AS edges }
        CALL { MATCH (state:ScaleState {id: $id}) RETURN count(state) AS missingEndpoint }
        RETURN nodes, edges, missingEndpoint
      `, parameters({ id: missingId })))[0];
      assert.deepEqual(failedImport, { nodes: 0, edges: 0, missingEndpoint: 0 });
      await writeSession.run("CREATE (:ScaleState {id: $id})", parameters({ id: missingId }));
      scaleFingerprint = await scaleStateFingerprint(readSession);

      assert.deepEqual(await importAudit(writeSession, importStatements[0], candidate), {
        importedRealizations: 7,
        importedEdges: 19,
      });
      const firstProjection = {
        nodes: records(await readSession.run(`
          MATCH (audit:PentatonicAuditRealization)
          RETURN audit.witnessId AS witnessId, properties(audit) AS properties
          ORDER BY witnessId
        `)),
        edges: records(await readSession.run(`
          MATCH (audit:PentatonicAuditRealization)-[edge:SUBSET_OF_7_35]->(state:ScaleState)
          RETURN edge.logicalId AS logicalId, properties(edge) AS properties,
                 state.id AS scaleStateId, audit.witnessId AS witnessId
          ORDER BY logicalId
        `)),
      };
      assert.deepEqual(canonicalJsonBytes(firstProjection), canonicalJsonBytes(expected));
      assert.equal(await scaleStateFingerprint(readSession), scaleFingerprint);

      assert.deepEqual(await importAudit(writeSession, importStatements[0], candidate), {
        importedRealizations: 7,
        importedEdges: 19,
      });
      const idempotentCounts = records(await readSession.run(`
        CALL { MATCH (audit:PentatonicAuditRealization) RETURN count(audit) AS nodes }
        CALL { MATCH ()-[edge:SUBSET_OF_7_35]->() RETURN count(edge) AS edges }
        RETURN nodes, edges
      `))[0];
      assert.deepEqual(idempotentCounts, { nodes: 7, edges: 19 });
      assert.equal(await scaleStateFingerprint(readSession), scaleFingerprint);

      const validationStatements = statements(
        fs.readFileSync(path.join(auditRoot, "validation.cypher"), "utf8"),
      );
      const validationParameters = parameters({
        candidateFingerprint: candidate.candidateFingerprint,
        expectedEdgeIds: expected.edges.map((edge) => edge.logicalId),
        realizations: candidate.reviewedRootedWitnesses.map((item) => ({
          witnessId: item.witnessId,
          parentCount: item.parentCount,
        })),
      });
      for (const statement of validationStatements) {
        validationRows.push(...records(await readSession.run(statement, validationParameters)));
      }
      assert.equal(validationRows.length, 8);
      assert.ok(validationRows.every((row) => row.status === "PASS"), JSON.stringify(validationRows));
      assert.equal(await scaleStateFingerprint(readSession), scaleFingerprint);

      await writeSession.run(`
        MATCH (audit:PentatonicAuditRealization {witnessId: 'court-position:C0'})
        SET audit.pitchMask = 4095
      `);
      const subsetStatement = validationStatements.find((statement) => statement.includes("bitwise_subset_replay"));
      const tampered = records(await readSession.run(subsetStatement, validationParameters));
      assert.equal(tampered[0].status, "FAIL");
      await importAudit(writeSession, importStatements[0], candidate);
      assert.equal(await scaleStateFingerprint(readSession), scaleFingerprint);

      await runStatements(writeSession, "reset.cypher");
      const afterReset = records(await readSession.run(`
        CALL { MATCH (audit:PentatonicAuditRealization) RETURN count(audit) AS nodes }
        CALL { MATCH ()-[edge:SUBSET_OF_7_35]->() RETURN count(edge) AS edges }
        RETURN nodes, edges
      `))[0];
      assert.deepEqual(afterReset, { nodes: 0, edges: 0 });
      assert.equal(await scaleStateFingerprint(readSession), scaleFingerprint);

      await runStatements(writeSession, "teardown.cypher");
      assert.deepEqual(await auditSchemaObjects(readSession), { constraints: [], indexes: [] });
      assert.equal(await scaleStateFingerprint(readSession), scaleFingerprint);
      teardownComplete = true;
    } finally {
      await readSession.close();
      await writeSession.close();
    }
  } finally {
    let cleanupFailure;
    const captureCleanupFailure = (error) => {
      cleanupFailure ??= error;
    };
    if (driver) {
      if (!teardownComplete) {
        let cleanupSession;
        try {
          cleanupSession = driver.session({ database: "neo4j", defaultAccessMode: neo4j.session.WRITE });
          await runStatements(cleanupSession, "reset.cypher");
          await runStatements(cleanupSession, "teardown.cypher");
        } catch (error) {
          captureCleanupFailure(error);
        } finally {
          if (cleanupSession) {
            try {
              await cleanupSession.close();
            } catch (error) {
              captureCleanupFailure(error);
            }
          }
        }
      }
      try {
        await driver.close();
      } catch (error) {
        captureCleanupFailure(error);
      }
    }
    try {
      await harness.stop();
    } catch (error) {
      captureCleanupFailure(error);
    }
    if (cleanupIdentity) {
      try {
        await assertHarnessResidueRemoved(cleanupIdentity);
      } catch (error) {
        captureCleanupFailure(error);
      }
    }
    if (originalEnvironment.guard === undefined) delete process.env.PENTATONIC_BINDING_AUDIT_EPHEMERAL;
    else process.env.PENTATONIC_BINDING_AUDIT_EPHEMERAL = originalEnvironment.guard;
    if (originalEnvironment.uri === undefined) delete process.env.PENTATONIC_BINDING_AUDIT_NEO4J_URI;
    else process.env.PENTATONIC_BINDING_AUDIT_NEO4J_URI = originalEnvironment.uri;
    if (cleanupFailure) throw cleanupFailure;
  }

  const finalActiveHashes = assertActiveSourcesUnchanged();
  const checks = [
    ["candidate-fingerprint-integrity", candidate.candidateFingerprint],
    ["dedicated-connection-contract", "missing guard/URI and active-endpoint equality rejected"],
    ["fresh-ephemeral-instance", "zero initial nodes, relationships, and audit schema objects"],
    ["missing-endpoint-rollback", "missing ScaleState rejected without partial writes or manufacture"],
    ["exact-projection", { realizationCount: 7, edgeCount: 19 }],
    ["idempotent-reimport", { realizationCount: 7, edgeCount: 19 }],
    ["cypher-invariants", validationRows.map((row) => row.check)],
    ["scale-state-immutability", scaleFingerprint],
    ["reset-and-schema-teardown", "audit data and schema absent; ScaleState fingerprint preserved"],
    ["active-source-hash-parity", finalActiveHashes],
    ["native-harness-cleanup", "temporary directory, process, Bolt port, and HTTP port released"],
  ].map(([checkId, diagnostic]) => ({ checkId, diagnostic, status: "PASS" }));
  const reportCore = {
    admissionEffect: "none",
    candidateFingerprint: candidate.candidateFingerprint,
    checks,
    checksFailed: 0,
    checksPassed: checks.length,
    graphScope: "detached_audit_only",
    schemaVersion: "pre-epic-400.pentatonic-binding-audit-neo4j-validation.v1",
    verdict: "PASS",
  };
  const report = { ...reportCore, reportFingerprint: sha256(reportCore) };
  fs.writeFileSync(qaPath, `${JSON.stringify(report, null, 2)}\n`);
});
