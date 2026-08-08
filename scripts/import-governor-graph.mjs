#!/usr/bin/env node
/**
 * GOV-206 Governor Graph Importer.
 *
 * Imports a canonical graph snapshot into Neo4j using parameterized UNWIND
 * queries in bounded write transactions. Only Gov* labels and GOV_ relationship
 * types are created. The importer is owned by the rebuild tool, never by the
 * query API.
 */

import fs from "node:fs";
import path from "node:path";
import neo4j from "neo4j-driver";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(scriptDir, "..");

const schemaPath = path.join(packageRoot, "neo4j", "governor-runtime", "schema.cypher");
const resetPath = path.join(packageRoot, "neo4j", "governor-runtime", "reset.cypher");
const validationPath = path.join(packageRoot, "neo4j", "governor-runtime", "validation.cypher");

async function main() {
  const args = process.argv.slice(2);
  const snapshotPath = args[args.indexOf("--snapshot") + 1];
  if (!snapshotPath) {
    console.error("Usage: import-governor-graph.mjs --snapshot <path> [--uri] [--username] [--password] [--database] [--reset-only] [--validate-only]");
    process.exit(1);
  }

  const uri = args[args.indexOf("--uri") + 1] || process.env.NEO4J_URI;
  const username = args[args.indexOf("--username") + 1] || process.env.NEO4J_USERNAME;
  const password = args[args.indexOf("--password") + 1] || process.env.NEO4J_PASSWORD;
  const database = args[args.indexOf("--database") + 1] || process.env.NEO4J_DATABASE || "neo4j";
  const resetOnly = args.includes("--reset-only");
  const validateOnly = args.includes("--validate-only");

  if (!uri || !username || !password) {
    console.error("Neo4j connection parameters required (URI, username, password)");
    process.exit(1);
  }

  const snapshot = JSON.parse(fs.readFileSync(snapshotPath, "utf8"));
  const driver = neo4j.driver(uri, neo4j.auth.basic(username, password));

  try {
    await driver.verifyConnectivity();
    const session = driver.session({ database, defaultAccessMode: neo4j.session.WRITE });

    try {
      if (!validateOnly) {
        // Reset: delete only Gov* nodes
        const resetCypher = fs.readFileSync(resetPath, "utf8");
        await session.run(resetCypher);

        if (!resetOnly) {
          // Schema: create constraints and indexes
          const schemaCypher = fs.readFileSync(schemaPath, "utf8");
          for (const stmt of schemaCypher.split(/;\s*\n/).filter((s) => s.trim())) {
            await session.run(stmt);
          }

          // Import nodes by label using UNWIND
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
            const importCypher = `
              UNWIND $records AS record
              MERGE (n:${label} {logicalId: record.logicalId})
              SET n += record
            `;
            await session.run(importCypher, { records });
          }

          // Import edges by relationship type
          const edgesByType = {};
          for (const edge of snapshot.edges) {
            if (!edgesByType[edge.relationshipType]) edgesByType[edge.relationshipType] = [];
            edgesByType[edge.relationshipType].push(edge);
          }

          for (const [relType, records] of Object.entries(edgesByType)) {
            const importCypher = `
              UNWIND $records AS record
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
                  r.verificationStatus = record.verificationStatus
            `;
            await session.run(importCypher, { records });
          }
        }
      }

      // Validation
      const validationCypher = fs.readFileSync(validationPath, "utf8");
      const statements = validationCypher.split(/;\s*\n/).filter((s) => s.trim());
      let allPass = true;
      for (const stmt of statements) {
        const result = await session.run(stmt);
        for (const record of result.records) {
          const check = record.get("check");
          const status = record.get("status");
          const diagnostic = record.get("diagnostic");
          const safeDiag = neo4j.isInt(diagnostic) ? diagnostic.toNumber() : diagnostic;
          console.log(`${status} ${check} ${JSON.stringify(safeDiag)}`);
          if (status !== "PASS") allPass = false;
        }
      }

      if (!allPass) process.exitCode = 1;
    } finally {
      await session.close();
    }
  } finally {
    await driver.close();
  }
}

main().catch((error) => {
  console.error("Import failed:", error.message);
  process.exit(1);
});