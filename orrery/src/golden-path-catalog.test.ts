import { describe, expect, it } from "vitest";

import Ajv2020 from "ajv/dist/2020.js";

import catalogSchema from "../../schemas/harmonic-orrery-golden-path-catalog.schema.json";
import { DERIVED_PATH_GRAPH, findDerivedPaths } from "./path-find";
import { derivedPathRecord, planDerivedPathReplay } from "./path-replay";
import goldenPathFixture from "../test/fixtures/golden-paths.v1.json";

function compileCatalogSchema() {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  return ajv.compile(catalogSchema as object);
}

function collectDeclaredLegalityValues(node: unknown, values: Set<string | null>): void {
  if (node === null || typeof node !== "object") {
    return;
  }
  if (Array.isArray(node)) {
    for (const entry of node) {
      collectDeclaredLegalityValues(entry, values);
    }
    return;
  }
  for (const [key, value] of Object.entries(node)) {
    if (key === "legality" && value && typeof value === "object") {
      const legality = value as { enum?: unknown[]; const?: unknown };
      for (const entry of legality.enum ?? []) {
        if (typeof entry === "string" || entry === null) {
          values.add(entry);
        }
      }
      if (typeof legality.const === "string") {
        values.add(legality.const);
      }
    }
    collectDeclaredLegalityValues(value, values);
  }
}

function collectFixtureLegalityValues(node: unknown, values: Set<string | null>): void {
  if (node === null || typeof node !== "object") {
    return;
  }
  if (Array.isArray(node)) {
    for (const entry of node) {
      collectFixtureLegalityValues(entry, values);
    }
    return;
  }
  for (const [key, value] of Object.entries(node)) {
    if (key === "legality") {
      if (typeof value === "string" || value === null) {
        values.add(value);
      }
      continue;
    }
    collectFixtureLegalityValues(value, values);
  }
}

describe("Golden-path catalog schema (BL-023)", () => {
  it("validates both registered paths against the formal schema", () => {
    const validate = compileCatalogSchema();
    expect(validate(goldenPathFixture)).toBe(true);
    expect(validate.errors ?? []).toEqual([]);
  });

  it("keeps every registered legality value inside the schema's closed enum", () => {
    const declared = new Set<string | null>();
    collectDeclaredLegalityValues(catalogSchema, declared);
    expect(declared).toEqual(
      new Set([
        "collection-membership",
        "both-collections-containment",
        "set-class-preserved",
        "catalog-membership",
        "containment-membership",
        "demonstration",
        null,
      ]),
    );

    const used = new Set<string | null>();
    collectFixtureLegalityValues(goldenPathFixture, used);
    for (const value of used) {
      expect(declared.has(value)).toBe(true);
    }
    expect(used.has("set-class-preserved")).toBe(true);
    expect(used.has("both-collections-containment")).toBe(true);
    expect(used.has("demonstration")).toBe(true);
  });

  it("accepts a finder-exported derived path through the same schema", () => {
    const result = findDerivedPaths(DERIVED_PATH_GRAPH, "7-35:3", "7-32:0", { maxPaths: 5 });
    expect(result.kind).toBe("ok");
    if (result.kind !== "ok") {
      return;
    }
    const path = result.paths.find((candidate) => candidate.nodes[1].id === "5-27:0");
    expect(path).toBeDefined();
    if (!path) {
      return;
    }
    const plan = planDerivedPathReplay(path);
    expect(plan.kind).toBe("ok");
    if (plan.kind !== "ok") {
      return;
    }
    const record = derivedPathRecord(plan);
    expect(record).not.toBeNull();
    if (!record) {
      return;
    }

    const validate = compileCatalogSchema();
    const promoted = {
      schemaVersion: "golden-path.v1",
      status: "planning_evidence",
      paths: [record],
    };
    expect(validate(promoted)).toBe(true);
    expect(validate.errors ?? []).toEqual([]);
  });

  it("enforces the verdict contract (recorded needs date; pending needs recipe)", () => {
    const validate = compileCatalogSchema();
    const base = {
      schemaVersion: "golden-path.v1",
      status: "planning_evidence",
    };
    const recordedMissingDate = {
      ...base,
      paths: [
        {
          pathId: "x",
          substrate: "derived-path",
          origin: { nodeId: "a", pitchClasses: [0] },
          destination: { nodeId: "b", pitchClasses: [1] },
          hops: [{ index: 0, kind: "derived-node", nodeId: "a", nodeKind: "heptatonic", setClassId: "7-35", arrivedBy: "origin", moveId: null, legality: null, bridge: false, admittedBridge: false, mShortcut: null, label: "a", pitchClasses: [0] }],
          verdicts: [
            {
              verdictId: "v",
              status: "recorded",
              subject: "x",
              statement: "s",
              source: "m",
            },
          ],
        },
      ],
    };
    expect(validate(recordedMissingDate)).toBe(false);

    const pendingMissingRecipe = {
      ...base,
      paths: [
        {
          ...recordedMissingDate.paths[0],
          verdicts: [
            {
              verdictId: "v",
              status: "pending",
              subject: "x",
              statement: null,
              source: "m",
            },
          ],
        },
      ],
    };
    expect(validate(pendingMissingRecipe)).toBe(false);
  });
});
