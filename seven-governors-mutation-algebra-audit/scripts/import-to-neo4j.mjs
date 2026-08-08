import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import neo4j from "neo4j-driver";

const root = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.resolve(root, "..");
const auditDir = path.join(pkgRoot, "audit");

const URI = process.env.NEO4J_URI || "bolt://localhost:7687";
const USER = process.env.NEO4J_USERNAME || "neo4j";
const PASS = process.env.NEO4J_PASSWORD || "replace-me";
const DB = process.env.NEO4J_DATABASE || "neo4j";

async function main() {
  const driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASS));
  await driver.verifyConnectivity();
  const session = driver.session({ database: DB });
  console.log("Connected to Neo4j");

  // Load operator registry
  const opData = fs.readFileSync(path.join(auditDir, "operator-registry.csv"), "utf8");
  const opLines = opData.trim().split("\n").slice(1);

  // Create schema constraints first
  console.log("Creating schema constraints...");
  await session.run("CREATE CONSTRAINT mutation_operator_id IF NOT EXISTS FOR (o:MutationOperator) REQUIRE o.id IS UNIQUE");
  await session.run("CREATE INDEX mutation_operator_class IF NOT EXISTS FOR (o:MutationOperator) ON (o.operatorClass)");
  await session.run("CREATE INDEX mutation_operator_degree IF NOT EXISTS FOR (o:MutationOperator) ON (o.degree)");
  await session.run("CREATE INDEX local_mutation_operator IF NOT EXISTS FOR ()-[a:LOCAL_MUTATES_TO]-() ON (a.operatorId)");
  await session.run("CREATE INDEX modal_mutation_operator IF NOT EXISTS FOR ()-[a:MODAL_MUTATES_TO]-() ON (a.operatorId)");

  // Import operators
  console.log("Importing operators...");
  for (const line of opLines) {
    const cols = parseCSVLine(line);
    const [id, notation, name, opClass, degree, degGov, dir, delta] = cols;
    await session.run(`
      MERGE (o:MutationOperator {id: $id})
      SET o.notation = $notation, o.name = $name, o.operatorClass = $opClass,
          o.degree = $degree, o.degreeGovernor = $degGov, o.direction = $dir,
          o.deltaSemitones = $delta, o.inverseOperatorId = $inv,
          o.conjugateOperatorId = $conj, o.partial = $partial,
          o.status = $status, o.applicationCount = $appCount,
          o.domainSize = $domSize, o.imageSize = $imgSize,
          o.structuralSupportCount = $structCount,
          o.fieldSupportCount = $fieldCount
    `, {
      id, notation, name, opClass,
      degree: degree === "" ? null : parseInt(degree),
      degGov: degGov === "" ? null : degGov,
      dir: dir === "" ? null : dir,
      delta: delta === "" ? null : parseInt(delta),
      inv: cols[10] === "" ? null : cols[10],
      conj: cols[11] === "" ? null : cols[11],
      partial: cols[12] === "true",
      status: cols[13],
      appCount: parseInt(cols[14]),
      domSize: parseInt(cols[15]),
      imgSize: parseInt(cols[16]),
      structCount: parseInt(cols[17] || "0"),
      fieldCount: parseInt(cols[18] || "0"),
    });
  }
  console.log(`Imported ${opLines.length} operators`);

  // Import applications
  console.log("Importing applications...");
  const appData = fs.readFileSync(path.join(auditDir, "operator-applications.csv"), "utf8");
  const appLines = appData.trim().split("\n").slice(1);
  let modalCount = 0, localCount = 0;

  for (const line of appLines) {
    const cols = parseCSVLine(line);
    const [appId, opId, , degree, degGov, direction, srcId] = cols;
    const tgtId = cols[14];
    const structural = cols[23];
    const field = cols[27];
    const status = cols[30];

    if (!srcId || !tgtId) {
      console.warn(`Skipping row with missing IDs: ${appId}`);
      continue;
    }

    if (opId === "M") {
      await session.run(`
        MATCH (s:ScaleState {id: toInteger($src)})
        MATCH (t:ScaleState {id: toInteger($tgt)})
        MERGE (s)-[a:MODAL_MUTATES_TO {operatorId: $opId}]->(t)
        SET a.applicationId = $appId, a.operatorClass = $opClass,
            a.applicationStatus = $status,
            a.structuralEvidence = $structural,
            a.fieldEvidence = $field
      `, {
        src: srcId, tgt: tgtId, opId, appId,
        opClass: cols[2],
        status,
        structural: structural === "true",
        field: field === "true",
      });
      modalCount++;
    } else {
      await session.run(`
        MATCH (s:ScaleState {id: toInteger($src)})
        MATCH (t:ScaleState {id: toInteger($tgt)})
        MERGE (s)-[a:LOCAL_MUTATES_TO {operatorId: $opId}]->(t)
        SET a.applicationId = $appId, a.operatorClass = $opClass,
            a.degree = $degree, a.degreeGovernor = $degGov,
            a.direction = $direction, a.deltaSemitones = $delta,
            a.applicationStatus = $status,
            a.rawExchangeHamming = 2,
            a.structuralEvidence = $structural,
            a.fieldEvidence = $field
      `, {
        src: srcId, tgt: tgtId, opId, appId,
        opClass: cols[2],
        degree: degree === "" ? null : parseInt(degree),
        degGov: degGov === "" ? null : degGov,
        direction: direction === "" ? null : direction,
        delta: direction === "raise" ? 1 : direction === "lower" ? -1 : null,
        status,
        structural: structural === "true",
        field: field === "true",
      });
      localCount++;
    }
  }
  console.log(`Imported ${modalCount} MODAL_MUTATES_TO, ${localCount} LOCAL_MUTATES_TO`);

  await session.close();
  await driver.close();
  console.log("Done");
}

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if (ch === "," && !inQuotes) { result.push(current); current = ""; continue; }
    current += ch;
  }
  result.push(current);
  return result;
}



main().catch((err) => {
  console.error("Import failed:", err.message);
  process.exit(1);
});
