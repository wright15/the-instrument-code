import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import Ajv2020 from "ajv/dist/2020.js";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const orreryRoot = path.resolve(scriptDirectory, "..");
const root = path.resolve(orreryRoot, "..");
const catalogPath = path.join(orreryRoot, "src", "generated", "legal-moves.v1.json");
const schemaPath = path.join(root, "schemas", "harmonic-orrery-legal-moves.schema.json");
const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
const ajv = new Ajv2020({ allErrors: true, strict: true });

if (!ajv.validate(schema, catalog)) {
  throw new Error(`INVALID_ORRERY_LEGAL_MOVE_CATALOG_SCHEMA: ${ajv.errorsText()}`);
}

const sourceIds = new Set(catalog.moves.map((move) => move.sourceId));
const targetIds = new Set(catalog.moves.map((move) => move.targetId));
const scopeIds = new Set(catalog.scope.anchorIds);
const anchorsById = new Map(catalog.scope.anchors.map((anchor) => [anchor.stateId, anchor]));
if (
  catalog.moves.length !== 21 ||
  sourceIds.size !== 21 ||
  targetIds.size !== 21 ||
  anchorsById.size !== 21 ||
  catalog.scope.anchors.some((anchor, index) => anchor.stateId !== catalog.scope.anchorIds[index]) ||
  catalog.moves.some(
    (move) =>
      !scopeIds.has(move.sourceId) ||
      !scopeIds.has(move.targetId) ||
      move.id !== move.provenance.applicationId,
  )
) {
  throw new Error("INVALID_ORRERY_LEGAL_MOVE_CATALOG_CLOSURE");
}

const targetsBySource = new Map(catalog.moves.map((move) => [move.sourceId, move.targetId]));
for (const tier of ["A0", "A1", "A2"]) {
  const anchors = catalog.scope.anchors.filter((anchor) => anchor.tier === tier);
  if (anchors.length !== 7) {
    throw new Error("INVALID_ORRERY_LEGAL_MOVE_CATALOG_CYCLES");
  }

  const startId = anchors[0].stateId;
  const visited = new Set();
  let currentId = startId;
  for (let step = 0; step < 7; step += 1) {
    const targetId = targetsBySource.get(currentId);
    if (visited.has(currentId) || targetId === undefined || anchorsById.get(targetId)?.tier !== tier) {
      throw new Error("INVALID_ORRERY_LEGAL_MOVE_CATALOG_CYCLES");
    }
    visited.add(currentId);
    currentId = targetId;
  }
  if (currentId !== startId || visited.size !== 7) {
    throw new Error("INVALID_ORRERY_LEGAL_MOVE_CATALOG_CYCLES");
  }
}

console.log(JSON.stringify({ catalogId: catalog.catalogId, moveCount: catalog.moves.length, verdict: "PASS" }));
