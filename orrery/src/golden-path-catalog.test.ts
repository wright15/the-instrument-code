import { describe, expect, it } from "vitest";

import Ajv2020 from "ajv/dist/2020.js";

import catalogSchema from "../../schemas/harmonic-orrery-golden-path-catalog.schema.json";
import { DERIVED_PATH_GRAPH, findDerivedPaths } from "./path-find";
import { derivedPathRecord, planDerivedPathReplay } from "./path-replay";
import goldenPathFixture from "../test/fixtures/golden-paths.v1.json";

const FOUNDERS_PAYLOAD_SHA256 = "3b9d76b9afb72521efed5feaa0e6526755d37d7e23837cffe2a785d4d974bf14";
const D_CYCLE_IDS = ["d-cycle:D1", "d-cycle:D2", "d-cycle:D3", "d-cycle:D4", "d-cycle:D5", "d-cycle:D6", "d-cycle:D7"];

interface CatalogHop {
  index: number;
  kind: string;
  nodeId: string;
  arrivedBy?: string;
  moveId: string | null;
  legality: string | null;
  mShortcut: string | null;
}

interface CatalogCycleMove {
  operatorId: string;
  applicationId: string;
  cycleEdge?: boolean;
  legality: string;
}

interface CatalogAlternative {
  kind: string;
  variants?: { variantId: string; moves: CatalogCycleMove[] }[];
}

interface CatalogVerdict {
  status: string;
  statement?: string | null;
  source: string;
}

interface CatalogPath {
  pathId: string;
  substrate: string;
  origin: { nodeId: string; pitchClasses: number[] };
  destination: { nodeId: string; pitchClasses: number[] };
  hops: CatalogHop[];
  alternatives?: CatalogAlternative[];
  verdicts?: CatalogVerdict[];
}

const catalogPaths = goldenPathFixture.paths as unknown as CatalogPath[];

async function sha256Hex(value: string): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

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
  it("validates all registered paths (founders + boundary exhibits) against the formal schema", () => {
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

describe("Boundary-demonstration exhibit routes (BL-030)", () => {
  const exhibits = catalogPaths.filter((path) => path.substrate === "boundary-demonstration");

  it("registers seven d-cycle exhibits with closed eight-hop cycles", () => {
    expect(exhibits.map((path) => path.pathId)).toEqual(D_CYCLE_IDS);
    for (const exhibit of exhibits) {
      expect(exhibit.hops).toHaveLength(8);
      expect(exhibit.destination.nodeId).toBe(exhibit.origin.nodeId);
      expect(exhibit.hops[0].nodeId).toBe(exhibit.origin.nodeId);
      expect(exhibit.hops[7].nodeId).toBe(exhibit.destination.nodeId);
      expect(
        exhibit.hops
          .slice(1)
          .every(
            (hop) =>
              hop.arrivedBy === "operator" &&
              hop.moveId === null &&
              hop.legality === null &&
              typeof hop.mShortcut === "string",
          ),
      ).toBe(true);
    }
  });

  it("carries one cycle-demonstration alternative with seven audit-cited M edges per exhibit", () => {
    for (const exhibit of exhibits) {
      expect(exhibit.alternatives).toHaveLength(1);
      const alternative = exhibit.alternatives?.[0];
      expect(alternative?.kind).toBe("cycle-demonstration");
      const moves = alternative?.variants?.flatMap((variant) => variant.moves) ?? [];
      expect(moves).toHaveLength(7);
      expect(
        moves.every(
          (move) =>
            move.operatorId === "M" &&
            move.cycleEdge === true &&
            move.legality === "demonstration" &&
            /^M:\d+:\d+$/.test(move.applicationId),
        ),
      ).toBe(true);
      expect(moves.map((move) => move.applicationId)).toEqual(
        exhibit.hops.slice(1).map((hop) => hop.mShortcut),
      );
    }
  });

  it("carries a discriminant-citing exhibit verdict and no listening verdict", () => {
    for (const exhibit of exhibits) {
      const verdicts = exhibit.verdicts ?? [];
      expect(verdicts).toHaveLength(1);
      expect(verdicts[0].status).toBe("exhibit");
      expect(verdicts[0].statement).toMatch(/discriminant/i);
      expect(verdicts[0].source).toContain("bl-029-d-tier-operator-probe-memo.md");
    }
  });

  it("keeps the founders byte-identical under the additive contract", async () => {
    const founders = JSON.stringify(catalogPaths.slice(0, 2));
    expect(await sha256Hex(founders)).toBe(FOUNDERS_PAYLOAD_SHA256);
  });
});
