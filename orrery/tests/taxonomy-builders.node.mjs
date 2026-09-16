import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { buildBundle } from "../../scripts/build-orrery-taxonomy-read-model.mjs";
import { buildDataset } from "../../scripts/build-orrery-d-tier-taxonomy-dataset.mjs";

const root = fileURLToPath(new URL("../../", import.meta.url));
const read = (relative) => JSON.parse(fs.readFileSync(path.join(root, relative), "utf8"));

test("taxonomy relationships exactly project declared structural and boundary rows", () => {
  const bundle = buildBundle(root);
  const network = read("canonical/universal-network-data.json");
  const source = new Map([...network.structuralEdges, ...network.boundaryRelationRows].map((edge) => [edge.id, edge]));
  const emitted = new Set();
  for (const record of bundle.records) {
    assert.ok(record.declaredRelationships.length <= 100);
    assert.deepEqual(record.declaredRelationships.map((edge) => edge.id), [...source.values()].filter((edge) => edge.source === record.stateId || edge.target === record.stateId).map((edge) => edge.id).sort());
    for (const edge of record.declaredRelationships) {
      emitted.add(edge.id);
      for (const [key, value] of Object.entries(edge)) assert.deepEqual(value, source.get(edge.id)[key]);
    }
  }
  assert.equal(emitted.size, source.size);
  assert.deepEqual(bundle, buildBundle(root));
});

test("D-tier identity and measurements preserve the census without outcome changes", () => {
  const census = read("canonical/fivefold-incubator/fifth-space-census-v0.json");
  const dataset = buildDataset(root);
  const source = census.records.filter((record) => record.tier?.startsWith("D")).sort((a, b) => a.stateId - b.stateId);
  assert.deepEqual(dataset.censusBinding.researchVerdict, census.researchVerdict);
  for (const [index, record] of dataset.records.entries()) {
    for (const field of ["stateId", "name", "forte", "role", "tier", "office", "fifthMask", "fifthPositions", "fifthSpan", "fifthArc", "holes", "gapMultiset", "provenancePath"]) assert.deepEqual(record[field], source[index][field]);
  }
});

test("absent or malformed optional evidence cannot prevent canonical taxonomy build", () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "orrery-taxonomy-"));
  try {
    for (const file of ["canonical/universal-heptatonic-ledger.json", "canonical/universal-network-data.json", "provenance/SOURCE_AUTHORITY.md"]) {
      fs.mkdirSync(path.dirname(path.join(temporary, file)), { recursive: true });
      fs.copyFileSync(path.join(root, file), path.join(temporary, file));
    }
    const absent = buildBundle(temporary);
    assert.equal(absent.recordCount, 462);
    assert.deepEqual(absent.evidenceBindings, { census: null, gov510: null });
    fs.mkdirSync(path.join(temporary, "canonical/fivefold-incubator"));
    fs.writeFileSync(path.join(temporary, "canonical/fivefold-incubator/twin-hub-convergence-v0.json"), "{");
    assert.deepEqual(buildBundle(temporary), absent);
  } finally { fs.rmSync(temporary, { recursive: true, force: true }); }
});
