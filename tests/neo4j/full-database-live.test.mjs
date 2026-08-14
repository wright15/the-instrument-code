import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import neo4j from "neo4j-driver";
import Ajv2020 from "ajv/dist/2020.js";

import { canonicalJsonBytes, sha256 } from "../../graph/runtime/canonical.mjs";
import {
  bootstrapFullDatabase,
  resetOwnedDatabase,
  runTrustedBatches,
} from "../../graph/runtime/neo4j-bootstrap.mjs";
import { Neo4jHarness } from "../../graph/runtime/neo4j-harness.mjs";
import {
  exportNormalizedNeo4jSnapshot,
  verifyNormalizedNeo4jSnapshot,
} from "../../graph/runtime/neo4j-roundtrip.mjs";
import {
  buildReleaseDatabaseInputs,
  packageRoot, releaseRoundtripVerificationInputs,
  releaseSourceBindings,
} from "../../scripts/bootstrap-neo4j.mjs";


const root = path.resolve(fileURLToPath(import.meta.url), "..", "..", "..");
const ingestionTemplateBaseline = JSON.parse(fs.readFileSync(
  path.join(root, "provenance/neo4j-ingestion-template-baseline.json"),
  "utf8",
));

test("trusted ingestion rejects destructive batches before execution", async () => {
  let executed = false;
  const session = { executeWrite: async () => { executed = true; } };
  await assert.rejects(
    runTrustedBatches(session, [{
      kind: "nodes:Triad",
      cypher: "UNWIND $records AS record MATCH (n) DETACH DELETE n MERGE (created:Triad {logicalId: record.logicalId})",
      parameters: { records: [{ logicalId: "triad:hostile" }] },
    }], "court", ingestionTemplateBaseline.namespaces.court),
    /untrusted_ingestion_batch/,
  );
  await assert.rejects(
    runTrustedBatches(session, [{
      kind: "nodes:Triad",
      cypher: "UNWIND $records AS record MATCH (victim) SET victim = {} MERGE (created:Triad {logicalId: record.logicalId})",
      parameters: { records: [{ logicalId: "triad:hostile" }] },
    }], "court", ingestionTemplateBaseline.namespaces.court),
    /ingestion_batch_node_match_not_allowed/,
  );
  await assert.rejects(
    runTrustedBatches(session, [{
      kind: "nodes:Triad",
      cypher: "UNWIND $records AS record MATCH (decoy:ScaleState), (victim {id: record.victimId}) SET victim = {} MERGE (created:Triad {logicalId: record.logicalId})",
      parameters: { records: [{ logicalId: "triad:hostile", victimId: "external" }] },
    }], "court", ingestionTemplateBaseline.namespaces.court),
    /untrusted_ingestion_batch/,
  );
  await assert.rejects(
    runTrustedBatches(session, [{
      kind: "nodes:Triad",
      cypher: "UNWIND $records AS record MATCH (victim {id: record.victimId}) SET victim = {} MERGE (created:Triad {logicalId: record.logicalId})",
      parameters: { records: [{ logicalId: "triad:hostile", victimId: "external" }] },
    }], "court", ingestionTemplateBaseline.namespaces.court),
    /ingestion_batch_node_match_not_allowed/,
  );
  assert.equal(executed, false);
});

test("release 1.5 full database bootstraps and round-trips byte-identically", async () => {
  const captureBaseline = process.env.NEO4J_FULL_CAPTURE_BASELINE === "1";
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "full-database-live-"));
  const inputs = buildReleaseDatabaseInputs(temp);
  const verificationInputs = releaseRoundtripVerificationInputs(inputs);
  const schema = JSON.parse(fs.readFileSync(
    path.join(root, "schemas/neo4j-normalized-snapshot.schema.json"),
    "utf8",
  ));
  const schemaValidator = new Ajv2020({ strict: true, allErrors: true }).compile(schema);
  const harness = new Neo4jHarness();
  try {
    await harness.start();
    const driver = neo4j.driver(harness.uri, neo4j.auth.basic("", ""));
    try {
      const sentinelSession = driver.session({
        database: "neo4j",
        defaultAccessMode: neo4j.session.WRITE,
      });
      const collidingLogicalId = inputs.governorSnapshot.nodes[0].logicalId;
      try {
        await sentinelSession.run(
          `CREATE (:ExternalSentinel {id: 'preserve-me'})
           CREATE (:ExternalSentinel:ScaleState {
             id: 999999, logicalId: $collidingLogicalId, externalValue: 'preserve-mixed'
           })`,
          { collidingLogicalId },
        );
      } finally {
        await sentinelSession.close();
      }
      const firstBootstrap = await bootstrapFullDatabase({
        driver,
        importDir: harness.importDir,
        packageRoot,
        ...inputs,
      });
      assert.equal(firstBootstrap.ready, true);
      assert.deepEqual(firstBootstrap.readiness.totals, {
        nodeCount: 3061,
        relationshipCount: 10506,
        expected: { nodeCount: 3061, relationshipCount: 10506 },
      });
      const readSession = driver.session({
        database: "neo4j",
        defaultAccessMode: neo4j.session.READ,
      });
      let firstSnapshot;
      try {
        firstSnapshot = await exportNormalizedNeo4jSnapshot(readSession, {
          releaseId: inputs.release.releaseId,
          sourceBindings: releaseSourceBindings(),
        });
      } finally {
        await readSession.close();
      }
      assert.equal(schemaValidator(firstSnapshot), true, JSON.stringify(schemaValidator.errors));
      if (!captureBaseline) {
        assert.equal(verifyNormalizedNeo4jSnapshot(firstSnapshot, verificationInputs), true);
      }
      const expectedNamespaceFingerprints = Object.fromEntries(
        Object.entries(firstSnapshot.namespaces).map(([namespace, value]) => [
          namespace, value.namespaceFingerprint,
        ]),
      );
      if (!captureBaseline) {
        assert.deepEqual(
          expectedNamespaceFingerprints,
          verificationInputs.expectedNamespaceFingerprints,
        );
      }

      const secondBootstrap = await bootstrapFullDatabase({
        driver,
        importDir: harness.importDir,
        packageRoot,
        ...inputs,
      });
      assert.equal(secondBootstrap.ready, true);
      const secondRead = driver.session({
        database: "neo4j",
        defaultAccessMode: neo4j.session.READ,
      });
      let secondSnapshot;
      try {
        secondSnapshot = await exportNormalizedNeo4jSnapshot(secondRead, {
          releaseId: inputs.release.releaseId,
          sourceBindings: releaseSourceBindings(),
        });
      } finally {
        await secondRead.close();
      }
      assert.deepEqual(canonicalJsonBytes(secondSnapshot), canonicalJsonBytes(firstSnapshot));
      if (!captureBaseline) {
        assert.equal(verifyNormalizedNeo4jSnapshot(secondSnapshot, verificationInputs), true);
      }

      const tampered = structuredClone(secondSnapshot);
      tampered.namespaces.topology.relationships[0].properties.reviewTamper = true;
      const tamperedNamespace = tampered.namespaces.topology;
      tamperedNamespace.namespaceFingerprint = sha256({
        nodes: tamperedNamespace.nodes,
        relationships: tamperedNamespace.relationships,
        counts: tamperedNamespace.counts,
      });
      const tamperedCore = { ...tampered };
      delete tamperedCore.snapshotFingerprint;
      tampered.snapshotFingerprint = sha256(tamperedCore);
      assert.equal(verifyNormalizedNeo4jSnapshot(tampered, verificationInputs), false);

      const writeSession = driver.session({
        database: "neo4j",
        defaultAccessMode: neo4j.session.WRITE,
      });
      try {
        await writeSession.run(
          `MATCH (mixed:ExternalSentinel {externalValue: 'preserve-mixed'})
           MATCH (external:ExternalSentinel {id: 'preserve-me'})
           CREATE (mixed)-[:EXTERNAL_LINK {externalValue: true}]->(external)`,
        );
        const externalBeforeReset = await writeSession.run(
          `MATCH (mixed:ExternalSentinel {externalValue: 'preserve-mixed'})
           OPTIONAL MATCH (mixed)-[external:EXTERNAL_LINK]->(:ExternalSentinel {id: 'preserve-me'})
           RETURN labels(mixed) AS labels, count(external) AS externalLinks`,
        );
        assert.deepEqual(externalBeforeReset.records[0].get("labels"), ["ExternalSentinel"]);
        assert.equal(externalBeforeReset.records[0].get("externalLinks").toNumber(), 1);
        const collidingOwned = await writeSession.run(
          `MATCH (external:ExternalSentinel {logicalId: $collidingLogicalId})
           RETURN any(label IN labels(external) WHERE label STARTS WITH 'Gov') AS polluted`,
          { collidingLogicalId },
        );
        assert.equal(collidingOwned.records[0].get("polluted"), false);
        await resetOwnedDatabase(writeSession);
        const preserved = await writeSession.run(
          `MATCH (n:ExternalSentinel)
           OPTIONAL MATCH (n)-[external:EXTERNAL_LINK]-(:ExternalSentinel)
           RETURN count(DISTINCT n) AS count, count(DISTINCT external) AS externalLinks`,
        );
        assert.equal(preserved.records[0].get("count").toNumber(), 2);
        assert.equal(preserved.records[0].get("externalLinks").toNumber(), 1);
        await writeSession.run("MATCH (n:ExternalSentinel) DETACH DELETE n");
      } finally {
        await writeSession.close();
      }
      const summaryOutput = process.env.NEO4J_FULL_SNAPSHOT_SUMMARY_OUTPUT;
      if (summaryOutput) {
        fs.writeFileSync(summaryOutput, `${JSON.stringify({
          snapshotFingerprint: firstSnapshot.snapshotFingerprint,
          namespaceFingerprints: expectedNamespaceFingerprints,
          sourceBindings: firstSnapshot.sourceBindings,
          counts: firstSnapshot.counts,
        }, null, 2)}\n`);
      }
    } finally {
      await driver.close();
    }
  } finally {
    await harness.stop();
    await harness.assertNoResidualFiles();
    await harness.assertNoResidualPorts();
    fs.rmSync(temp, { recursive: true, force: true });
  }
});
