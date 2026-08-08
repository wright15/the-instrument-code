import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import neo4j from "neo4j-driver";
import { compileProfileWithProvider } from "./seven-governors-canonical-feature-profile-registry-v0.1.1/scripts/compiler.mjs";
import { Neo4jRegistryProvider } from "./seven-governors-canonical-feature-profile-registry-v0.1.1/scripts/providers/neo4j-registry-provider.mjs";

const packageRoot = path.dirname(fileURLToPath(import.meta.url));
const checkOnly = process.argv.includes("--check");
const registryReleaseId = "canonical-profile-registry:0.1.1";
const registryName = "seven-governors-canonical-feature-profile-registry";

async function loadDotEnv() {
  try {
    const text = await fs.readFile(path.join(packageRoot, ".env"), "utf8");
    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const separator = line.indexOf("=");
      if (separator < 1) continue;
      const key = line.slice(0, separator).trim();
      const value = line.slice(separator + 1).trim();
      if (process.env[key] === undefined) process.env[key] = value;
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

await loadDotEnv();

const expectedNodes = {
  ScaleState: 462,
  ScaleFamily: 38,
  GovernorOffice: 7,
};
const expectedRelationships = {
  GOVERNS: 238,
  CONSTRUCTS: 28,
  SEAT_CONTACT: 140,
  MODAL_SUCCESSOR: 182,
  AUDITED_HAMMING2: 585,
  PHASE_SHIFT: 175,
  CONVERGENCE_CONTACT: 210,
  JUNCTION_CONTACT: 252,
  LEAF_CONTACT: 14,
  BELONGS_TO_FAMILY: 462,
  OCCUPIES_OFFICE: 308,
  RELATIONAL_OFFICE_EVIDENCE: 224,
};
const expectedMutation = {
  MutationOperator: 15,
  MODAL_MUTATES_TO: 462,
  LOCAL_MUTATES_TO: 2940,
};
const expectedSemantic = {
  activeRelease: 1,
  canonicalProfiles: 7,
  activeProfiles: 7,
  photonicRecords: 7,
  landformReferences: 40,
  domainProjections: 1,
  semanticOperators: 15,
  realizesBindings: 15,
  activeSemanticOperators: 15,
  unresolvedScopeBindings: 60,
  compiledProfiles: 4,
};

function nativeInteger(value) {
  return neo4j.isInt(value) ? value.toNumber() : Number(value);
}

function compareCounts(actual, expected) {
  return Object.entries(expected).map(([name, count]) => ({
    name,
    expected: count,
    actual: actual[name] ?? 0,
    status: actual[name] === count ? "PASS" : "FAIL",
  }));
}

async function inspectNeo4j() {
  const uri = process.env.NEO4J_URI;
  const username = process.env.NEO4J_USERNAME;
  const password = process.env.NEO4J_PASSWORD;
  const database = process.env.NEO4J_DATABASE || "neo4j";

  if (!uri || !username || !password) {
    return {
      mode: "snapshot-only",
      connected: false,
      parity: null,
      message:
        "Neo4j variables are not configured. The embedded canonical snapshot remains available.",
    };
  }

  const driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
  try {
    await driver.verifyConnectivity();
    const session = driver.session({ database });
    try {
      const nodeResult = await session.run(`
          MATCH (node)
          WHERE node:ScaleState OR node:ScaleFamily OR node:GovernorOffice
          UNWIND labels(node) AS label
          WITH label, count(*) AS count
          WHERE label IN ['ScaleState', 'ScaleFamily', 'GovernorOffice']
          RETURN label, count
          ORDER BY label
        `);
      const relationshipResult = await session.run(
        `
          MATCH ()-[relation]->()
          WHERE type(relation) IN $types
          RETURN type(relation) AS type, count(*) AS count
          ORDER BY type
        `,
        { types: Object.keys(expectedRelationships) },
      );
      const mutationResult = await session.run(`
          CALL {
            MATCH (operator:MutationOperator)
            RETURN 'MutationOperator' AS name, count(operator) AS count
            UNION ALL
            MATCH ()-[relation:MODAL_MUTATES_TO]->()
            RETURN 'MODAL_MUTATES_TO' AS name, count(relation) AS count
            UNION ALL
            MATCH ()-[relation:LOCAL_MUTATES_TO]->()
            RETURN 'LOCAL_MUTATES_TO' AS name, count(relation) AS count
          }
          RETURN name, count
        `);
      const semanticResult = await session.run(
        `
          OPTIONAL MATCH (release:RegistryRelease {
            registry_name: $registryName,
            release_id: $releaseId,
            active: true
          })
          WITH release
          CALL {
            WITH release
            OPTIONAL MATCH (profile:CanonicalFeatureProfile)-[:PART_OF_RELEASE]->(release)
            RETURN count(DISTINCT profile) AS canonicalProfiles
          }
          CALL {
            WITH release
            OPTIONAL MATCH (:GovernorOffice)-[binding:ACTIVE_PROFILE]->
              (:CanonicalFeatureProfile)-[:PART_OF_RELEASE]->(release)
            RETURN count(DISTINCT binding) AS activeProfiles
          }
          CALL {
            WITH release
            OPTIONAL MATCH (profile:CanonicalFeatureProfile)-[:PART_OF_RELEASE]->(release)
            OPTIONAL MATCH (profile)-[:HAS_PHOTONIC_RECORD]->(record:PhotonicRecord)
            RETURN count(DISTINCT record) AS photonicRecords
          }
          CALL {
            WITH release
            OPTIONAL MATCH (profile:CanonicalFeatureProfile)-[:PART_OF_RELEASE]->(release)
            OPTIONAL MATCH (profile)-[reference:REFERENCES_LANDFORM]->()
            RETURN count(DISTINCT reference) AS landformReferences
          }
          CALL {
            WITH release
            OPTIONAL MATCH (projection:DomainProjection)-[:PART_OF_RELEASE]->(release)
            RETURN count(DISTINCT projection) AS domainProjections
          }
          CALL {
            WITH release
            OPTIONAL MATCH (operator:SemanticOperator)-[:PART_OF_RELEASE]->(release)
            RETURN count(DISTINCT operator) AS semanticOperators
          }
          CALL {
            WITH release
            OPTIONAL MATCH (operator:SemanticOperator)-[:PART_OF_RELEASE]->(release)
            OPTIONAL MATCH (operator)-[binding:REALIZES]->(:MutationOperator)
            RETURN count(DISTINCT binding) AS realizesBindings
          }
          CALL {
            WITH release
            OPTIONAL MATCH (:MutationOperator)-[binding:ACTIVE_SEMANTIC_OPERATOR]->
              (:SemanticOperator)-[:PART_OF_RELEASE]->(release)
            RETURN count(DISTINCT binding) AS activeSemanticOperators
          }
          CALL {
            WITH release
            OPTIONAL MATCH (operator:SemanticOperator)-[:PART_OF_RELEASE]->(release)
            OPTIONAL MATCH (operator)-[binding:HAS_UNRESOLVED_SCOPE]->()
            RETURN count(DISTINCT binding) AS unresolvedScopeBindings
          }
          CALL {
            WITH release
            OPTIONAL MATCH (profile:CompiledFeatureProfile)-[:PART_OF_RELEASE]->(release)
            RETURN count(DISTINCT profile) AS compiledProfiles
          }
          RETURN CASE WHEN release IS NULL THEN 0 ELSE 1 END AS activeRelease,
                 canonicalProfiles, activeProfiles, photonicRecords,
                 landformReferences, domainProjections, semanticOperators,
                 realizesBindings, activeSemanticOperators,
                 unresolvedScopeBindings, compiledProfiles
        `,
        { registryName, releaseId: registryReleaseId },
      );

      const nodeCounts = Object.fromEntries(
        nodeResult.records.map((record) => [
          record.get("label"),
          nativeInteger(record.get("count")),
        ]),
      );
      const relationshipCounts = Object.fromEntries(
        relationshipResult.records.map((record) => [
          record.get("type"),
          nativeInteger(record.get("count")),
        ]),
      );
      const mutationCounts = Object.fromEntries(
        mutationResult.records.map((record) => [
          record.get("name"),
          nativeInteger(record.get("count")),
        ]),
      );
      const semanticRecord = semanticResult.records[0];
      const semanticCounts = Object.fromEntries(
        Object.keys(expectedSemantic).map((name) => [
          name,
          semanticRecord ? nativeInteger(semanticRecord.get(name)) : 0,
        ]),
      );
      const checks = [
        ...compareCounts(nodeCounts, expectedNodes),
        ...compareCounts(relationshipCounts, expectedRelationships),
      ];
      const parity = checks.every((item) => item.status === "PASS");
      const mutationChecks = compareCounts(mutationCounts, expectedMutation);
      const semanticChecks = compareCounts(semanticCounts, expectedSemantic);
      const mutationReady = mutationChecks.every(
        (item) => item.status === "PASS",
      );
      const semanticReady = semanticChecks.every(
        (item) => item.status === "PASS",
      );
      return {
        mode: "neo4j-parity",
        connected: true,
        database,
        parity,
        ready: parity && mutationReady && semanticReady,
        nodeCounts,
        relationshipCounts,
        checks,
        mutation: {
          ready: mutationReady,
          counts: mutationCounts,
          checks: mutationChecks,
        },
        semantic: {
          releaseId: registryReleaseId,
          ready: semanticReady,
          counts: semanticCounts,
          checks: semanticChecks,
        },
      };
    } finally {
      await session.close();
    }
  } catch (error) {
    return {
      mode: "neo4j-error",
      connected: false,
      parity: false,
      message: error.message,
    };
  } finally {
    await driver.close();
  }
}

let databaseStatus = await inspectNeo4j();
let globalGovernorProvider = null;
let globalGovernorFingerprint = null;

if (checkOnly) {
  console.log(JSON.stringify(databaseStatus, null, 2));
  if (databaseStatus.mode === "neo4j-error" || databaseStatus.parity === false) {
    process.exitCode = 1;
  }
} else {
  function convertValue(v) {
    if (v == null) return v;
    if (neo4j.isInt(v)) return v.toNumber();
    if (Array.isArray(v)) return v.map(convertValue);
    if (typeof v === "object" && v.constructor === Object) {
      const out = {};
      for (const k of Object.keys(v)) out[k] = convertValue(v[k]);
      return out;
    }
    return v;
  }

  function recordToGraph(records) {
    const nodes = [];
    const edges = [];
    const seenNodes = new Map();
    const seenEdges = new Set();

    for (const record of records) {
      for (const key of record.keys) {
        const value = record.get(key);
        if (value && typeof value === "object" && value.constructor && value.constructor.name) {
          const ctor = value.constructor.name;
          if (ctor === "Node") {
            const nodeId = nativeInteger(value.identity);
            if (!seenNodes.has(nodeId)) {
              seenNodes.set(nodeId, {
                id: nodeId,
                labels: value.labels,
                properties: convertValue(value.properties),
                role: value.properties?.role || null,
              });
            }
          } else if (ctor === "Relationship") {
            const eid = nativeInteger(value.identity);
            const from = nativeInteger(value.start);
            const to = nativeInteger(value.end);
            const ekey = `${from}-${to}-${value.type}-${eid}`;
            if (!seenEdges.has(ekey)) {
              seenEdges.add(ekey);
              edges.push({
                id: eid,
                from,
                to,
                type: value.type,
                properties: convertValue(value.properties),
              });
            }
          } else if (ctor === "Path") {
            for (const segment of value.segments) {
              const start = segment.start;
              const startId = nativeInteger(start.identity);
              if (!seenNodes.has(startId)) {
                seenNodes.set(startId, {
                  id: startId,
                  labels: start.labels,
                  properties: convertValue(start.properties),
                  role: start.properties?.role || null,
                });
              }
              const end = segment.end;
              const endId = nativeInteger(end.identity);
              if (!seenNodes.has(endId)) {
                seenNodes.set(endId, {
                  id: endId,
                  labels: end.labels,
                  properties: convertValue(end.properties),
                  role: end.properties?.role || null,
                });
              }
              const rel = segment.relationship;
              if (rel) {
                const from = nativeInteger(rel.start);
                const to = nativeInteger(rel.end);
                const ekey = `${from}-${to}-${rel.type}-${nativeInteger(rel.identity)}`;
                if (!seenEdges.has(ekey)) {
                  seenEdges.add(ekey);
                  edges.push({
                    id: nativeInteger(rel.identity),
                    from,
                    to,
                    type: rel.type,
                    properties: convertValue(rel.properties),
                  });
                }
              }
            }
          }
        }
      }
    }

    return {
      nodes: [...seenNodes.values()],
      edges,
    };
  }

  function sendJson(response, status, value) {
    const payload = Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
    response.writeHead(status, {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "content-length": payload.length,
    });
    response.end(payload);
  }

  const host = process.env.GRAPH_HOST || "127.0.0.1";
  const port = Number(process.env.GRAPH_PORT || 4177);
  const indexPath = path.join(packageRoot, "graph/index.html");
  const indexHtml = await fs.readFile(indexPath);
  const explorePath = path.join(packageRoot, "graph/explore.html");

  process.on("unhandledRejection", (err) => { console.error("UNHANDLED:", err); });
  process.on("uncaughtException", (err) => { console.error("UNCAUGHT:", err); });

  const server = http.createServer(async (request, response) => {
    const url = new URL(request.url || "/", "http://localhost");
    if (url.pathname === "/" || url.pathname === "/index.html") {
      response.writeHead(200, {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
        "content-length": indexHtml.length,
      });
      response.end(indexHtml);
      return;
    }
    if (url.pathname === "/explore" || url.pathname === "/explore.html") {
      const exploreHtml = await fs.readFile(explorePath);
      response.writeHead(200, {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
        "content-length": exploreHtml.length,
      });
      response.end(exploreHtml);
      return;
    }
    if (url.pathname === "/api/creation-packet") {
      if (request.method !== "GET") {
        response.setHeader("allow", "GET");
        sendJson(response, 405, { error: "Method not allowed" });
        return;
      }
      const allowedParameters = new Set(["stateId", "domain"]);
      const unknownParameter = [...url.searchParams.keys()].find(
        (name) => !allowedParameters.has(name),
      );
      const stateValues = url.searchParams.getAll("stateId");
      const domainValues = url.searchParams.getAll("domain");
      if (
        unknownParameter ||
        stateValues.length !== 1 ||
        domainValues.length > 1 ||
        !/^\d+$/.test(stateValues[0])
      ) {
        sendJson(response, 400, {
          error:
            "Expected one decimal stateId and an optional domain parameter",
        });
        return;
      }
      const stateId = Number(stateValues[0]);
      const domain = domainValues[0] || "landforms";
      if (!Number.isSafeInteger(stateId) || domain !== "landforms") {
        sendJson(response, 400, {
          error: "stateId must be a safe integer and domain must be landforms",
        });
        return;
      }
      const uri = process.env.NEO4J_URI;
      const username = process.env.NEO4J_USERNAME;
      const password = process.env.NEO4J_PASSWORD;
      const database = process.env.NEO4J_DATABASE || "neo4j";
      if (!uri || !username || !password) {
        sendJson(response, 503, { error: "Neo4j is not configured" });
        return;
      }
      const driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
      try {
        const session = driver.session({
          database,
          defaultAccessMode: neo4j.session.READ,
        });
        try {
          const provider = new Neo4jRegistryProvider({
            session,
            releaseId: registryReleaseId,
          });
          const packet = await compileProfileWithProvider({
            provider,
            stateId,
            domain,
          });
          sendJson(response, 200, packet);
        } finally {
          await session.close();
        }
      } catch (error) {
        if (error.message.startsWith("Unknown ScaleState id in Neo4j")) {
          sendJson(response, 404, { error: "ScaleState not found" });
        } else if (
          error.code?.startsWith("Neo.") ||
          error.message.startsWith("No active")
        ) {
          sendJson(response, 503, { error: "Semantic registry unavailable" });
        } else {
          console.error("Creation packet error:", error);
          sendJson(response, 500, { error: "Creation packet failed" });
        }
      } finally {
        await driver.close();
      }
      return;
    }
    if (url.pathname === "/api/governor-query") {
        const { handleGovernorQueryRoute } = await import("./graph/runtime/query-api.mjs");
        const { SnapshotProvider } = await import("./graph/runtime/providers/snapshot-provider.mjs");
        const { buildGraphSnapshot } = await import("./graph/runtime/contracts.mjs");
        let provider = globalGovernorProvider;
        if (!provider) {
          globalGovernorProvider = "pending";
          const policyPath = path.join(packageRoot, "seven-governors-governor-runtime-v0.1.0/canonical/policy-release.json");
          try {
            const policyRelease = JSON.parse(await fs.readFile(policyPath, "utf8"));
            const snapshot = buildGraphSnapshot({ policyRelease, classificationResults: [], runtimeExport: null, profiles: [], provenanceSources: [] });
            provider = new SnapshotProvider(snapshot);
            globalGovernorProvider = provider;
            globalGovernorFingerprint = snapshot.projectionFingerprint;
          } catch (error) {
            console.error("Governor projection build failed:", error.message);
            sendJson(response, 503, { error: "Governor projection unavailable" });
            return;
          }
        } else if (provider === "pending") {
          sendJson(response, 503, { error: "Governor projection initializing" });
          return;
        }
        await handleGovernorQueryRoute(request, response, provider, globalGovernorFingerprint);
        return;
    }
    if (url.pathname === "/api/query") {
      const rawQueryEnabled = process.env.GRAPH_ENABLE_RAW_QUERY === "1";
      const bindHost = process.env.GRAPH_HOST || host;
      const isLoopback = bindHost === "127.0.0.1" || bindHost === "localhost" || bindHost === "0.0.0.0";
      if (!rawQueryEnabled || !isLoopback) {
        sendJson(response, 404, { error: "Raw query endpoint disabled" });
        return;
      }
      if (request.method !== "POST") {
        response.setHeader("allow", "POST");
        sendJson(response, 405, { error: "Method not allowed" });
        return;
      }
      if (!databaseStatus.connected) {
        const payload = JSON.stringify({ error: "Neo4j not connected" });
        response.writeHead(503, { "content-type": "application/json" });
        response.end(payload);
        return;
      }
      let body = "";
      request.on("data", (chunk) => (body += chunk));
      request.on("end", async () => {
        try {
          const { cypher } = JSON.parse(body);
          if (!cypher || typeof cypher !== "string") {
            response.writeHead(400, { "content-type": "application/json" });
            response.end(JSON.stringify({ error: "Missing cypher field" }));
            return;
          }
          const uri = process.env.NEO4J_URI;
          const username = process.env.NEO4J_USERNAME;
          const password = process.env.NEO4J_PASSWORD;
          const database = process.env.NEO4J_DATABASE || "neo4j";
          const driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
          try {
            const session = driver.session({
              database,
              defaultAccessMode: neo4j.session.READ,
            });
            try {
              const result = await session.executeRead((transaction) =>
                transaction.run(cypher),
              );
              const graph = recordToGraph(result.records);
              response.writeHead(200, {
                "content-type": "application/json",
                "cache-control": "no-store",
              });
              response.end(JSON.stringify(graph));
            } finally {
              await session.close();
            }
          } finally {
            await driver.close();
          }
        } catch (error) {
          response.writeHead(400, { "content-type": "application/json" });
          response.end(JSON.stringify({ error: error.message }));
        }
      });
      return;
    }
    if (url.pathname === "/health.json" || url.pathname === "/ready.json") {
      if (url.searchParams.get("refresh") === "1") {
        databaseStatus = await inspectNeo4j();
      }
      const health = {
        application: "seven-governors-integrated-release",
        snapshot: {
          scaleStates: 462,
          seatedStates: 308,
          boundaryStates: 154,
          visibleUniversalRelationships: 1824,
        },
        neo4j: databaseStatus,
      };
      const status =
        url.pathname === "/ready.json" && !databaseStatus.ready ? 503 : 200;
      sendJson(response, status, health);
      return;
    }
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found\n");
  });

  server.listen(port, host, () => {
    console.log(`Seven Governors Network: http://${host}:${port}/`);
    console.log(
      `Neo4j mode: ${databaseStatus.mode}${
        databaseStatus.parity === true ? " (parity PASS)" : ""
      }`,
    );
  });
}
