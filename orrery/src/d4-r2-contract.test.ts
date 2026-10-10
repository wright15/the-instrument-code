import { describe, expect, it } from "vitest";

import review from "./generated/d4-r2-contract.v1.json";
import {
  calibrateIdentityPhase,
  predicateHolds,
  selectSatellites,
} from "../../scripts/d4-r2-contract.mjs";

const OBSERVED_KEYS = [
  "0:1339", "0:2395", "1:1765", "1:3497", "2:2717", "2:3245", "3:1465", "3:949",
  "4:1703", "4:1835", "5:1261", "5:695", "6:2899", "6:2965",
];

const SATELLITE_IDS = [
  "1243", "1339", "1627", "2395", "1747", "1753", "1765", "3497",
  "2669", "2717", "2861", "3245", "731", "949", "1465", "2921",
  "1691", "1703", "1739", "1835", "695", "877", "1261", "2413",
  "2893", "2899", "2917", "2965",
];

const A0_FIXTURE = [
  { id: "2773", officeIndex: "0" },
  { id: "2741", officeIndex: "1" },
  { id: "1717", officeIndex: "2" },
  { id: "1709", officeIndex: "3" },
  { id: "1453", officeIndex: "4" },
  { id: "1451", officeIndex: "5" },
  { id: "1387", officeIndex: "6" },
];

const R_FIXTURE = [
  { source: "1371", target: "1243", parentOffice: "0" },
  { source: "1371", target: "1339", parentOffice: "0" },
  { source: "1371", target: "1627", parentOffice: "0" },
  { source: "1371", target: "2395", parentOffice: "0" },
  { source: "2901", target: "2893", parentOffice: "6" },
  { source: "2901", target: "2899", parentOffice: "6" },
  { source: "2901", target: "2917", parentOffice: "6" },
  { source: "2901", target: "2965", parentOffice: "6" },
];

const MINIMAL_FIXTURE_KEYS = [
  "0:1243", "0:1339", "0:1627", "0:2395",
  "6:2893", "6:2899", "6:2917", "6:2965",
];

describe("D4 R2 contract implementation (BL-057 Gate 2) — contract validation", () => {
  it("pins schema, status, namespace and contractFingerprint", () => {
    expect(review.schemaVersion).toBe("harmonic-orrery.d4-r2-contract.v1");
    expect(review.contractId).toBe("BL057_D4_R2_CONTRACT_v1");
    expect(review.status).toBe("implementation_evidence");
    expect(review.generator).toBe("scripts/build-d4-r2-contract.mjs");
    expect(review.engine).toBe("scripts/d4-r2-contract.mjs");
    expect(review.contractFingerprint).toMatch(/^[0-9a-f]{64}$/);
    expect(review.sourceBindings).toHaveLength(6);
    expect(review.sourceBindings.every((binding) => /^[0-9a-f]{64}$/.test(binding.sha256))).toBe(true);
    expect(review.admission).toMatchObject({
      gate: "Gate 1",
      state: "claim_admitted",
      memo: "scrum/plan/bl-057-d4-amendment-spec.md",
    });
  });

  it("pins the route statement, output comparison, contacts and cycle walk", () => {
    expect(review.route.id).toBe("R2");
    expect(review.route.name).toBe("Filtered Cycle-Walk");
    expect(review.route.definition).toBe("R2(h) = {(o(h), s) : s in satellites(h) and P(s)}");
    expect(review.route.predicate).toBe("P(s) = [forte(s) = '7-27']");
    expect(review.route.predicateForm).toContain("single-hop");
    expect(review.route.outputStatement).toBe("G_R2 = O (14 keys; 2 per office; G_R2 strictly inside U)");
    expect(review.route.outputComparison).toEqual({
      observedKeyCount: 14, r2KeyCount: 14, tAKeyCount: 8, tBKeyCount: 28, uKeyCount: 28,
    });
    expect(review.route.cycleWalk).toMatchObject({
      closes: true, intervalSum: 12, t1Count: 2, t2Count: 5,
    });
    expect(review.route.cycleWalk.edges).toHaveLength(7);
    expect(review.contacts.witnessCount).toBe(14);
    expect(review.contacts.witnesses.every((witness) => witness.tag === "r2_filtered_cycle_walk")).toBe(true);
  });

  it("pins the per-office route evaluation: 2 selected per office, all cycle-twin-verified", () => {
    expect(review.perOffice).toHaveLength(7);
    for (const office of review.perOffice) {
      expect(office.eParents).toHaveLength(2);
      expect(office.satellites).toHaveLength(4);
      expect(office.selectedCount).toBe(2);
      expect(office.justification).toBe("cycle-twin-verified");
      expect(office.cycleTwin.holds).toBe(true);
    }
    expect(review.route.justificationSummary).toMatchObject({ cycleTwinVerified: 7, predicateOnly: 0 });
  });

  it("pins G1: the generalized cycle-twin relation holds at all 7 edges (2 T1 + 5 T2)", () => {
    expect(review.gates.G1.allPass).toBe(true);
    expect(review.gates.G1.fallbackOffices).toEqual([]);
    expect(review.gates.G1.perEdge).toHaveLength(7);
    expect(review.gates.G1.perEdge.every((edge) => edge.holds)).toBe(true);
    expect(review.gates.G1.t1Edges).toEqual(["0", "6"]);
    expect(review.gates.G1.t2Edges).toEqual(["1", "2", "3", "4", "5"]);
    expect(review.gates.G1.perEdge.filter((edge) => edge.d === 2)).toHaveLength(5);
  });

  it("pins G2: predicate selects exactly 2 satellites per office across all 7 offices", () => {
    expect(review.gates.G2.allTwo).toBe(true);
    expect(review.gates.G2.officesAtTwo).toBe(7);
    expect(review.gates.G2.totalSelected).toBe(14);
    expect(review.gates.G2.pass).toBe(true);
    for (const row of review.gates.G2.perOfficeCounts) expect(row.count).toBe(2);
  });

  it("pins G3: G_R2 equals O exactly (14 generated keys, no missing, no extra)", () => {
    expect(review.gates.G3.generatedCount).toBe(14);
    expect(review.gates.G3.observedCount).toBe(14);
    expect(review.gates.G3.equalsObserved).toBe(true);
    expect(review.gates.G3.pass).toBe(true);
    expect(review.gates.G3.matched).toHaveLength(14);
    expect(review.gates.G3.missing).toEqual([]);
    expect(review.gates.G3.extra).toEqual([]);
  });

  it("pins G4: non-collapse — 14 generated vs 28 granted, T-B output is U", () => {
    expect(review.gates.G4.generatedCount).toBe(14);
    expect(review.gates.G4.uKeyCount).toBe(28);
    expect(review.gates.G4.tBOutputCount).toBe(28);
    expect(review.gates.G4.strictSubset).toBe(true);
    expect(review.gates.G4.nonCollapse).toBe(true);
    expect(review.gates.G4.pass).toBe(true);
    expect(review.gates.G4.statement).toContain("satellite-reading");
  });

  it("pins G5: 7 realized midpoints, 2 observation-exact, 5 unverified predictions", () => {
    expect(review.gates.G5.realized).toBe(7);
    expect(review.gates.G5.exact).toBe(2);
    expect(review.gates.G5.unverified).toBe(5);
    expect(review.gates.G5.entries).toHaveLength(7);
    const exact = review.gates.G5.entries.filter((entry) => entry.exact === true);
    const unverified = review.gates.G5.entries.filter((entry) => entry.exact === "unverified");
    expect(exact.map((entry) => entry.office).sort()).toEqual(["0", "6"]);
    expect(exact.every((entry) => entry.prediction === null)).toBe(true);
    expect(unverified).toHaveLength(5);
    for (const entry of unverified) {
      expect(entry.realized).toBe(true);
      expect(entry.prediction).toContain("comparison.tC.observedRelations");
    }
    expect(review.gates.G5.seamCrossCheck).toEqual({
      generatedRelations: 7,
      equalsRealizedSet: true,
      observedRelations: 2,
      equalsExactSubset: true,
      realizationOfObserved: true,
    });
    expect(review.gates.G5.pass).toBe(true);
  });

  it("pins the constraint-satisfaction table: four constraints, all satisfied", () => {
    expect(review.constraintTable).toHaveLength(4);
    expect(review.constraintTable.map((row) => row.constraint)).toEqual([
      "Predicate P incorporated",
      "Full cycle-edge traversal (T1 + T2)",
      "Break the cycle-edge <-> construction-pair identity",
      "T-C midpoint scope adjudicated",
    ]);
    expect(review.constraintTable.every((row) => row.satisfied === true)).toBe(true);
    expect(review.constraintTable[2].mechanism).toContain("satellite-reading");
  });

  it("carries the binding fences and bounded non-accomplishments", () => {
    expect(review.fences.governsVerdicts).toContain("none");
    expect(review.fences.recordAmendment).toContain("claim event");
    expect(review.fences.routeAdmission).toContain("claim_admitted");
    expect(review.fences.derivationExecution).toContain("none");
    expect(review.fences.calibration).toContain("mechanism only");
    expect(review.fences.wall).toContain("untouched");
    expect(review.fences.g1Intra330).toBe("untouched");
    expect(review.fences.direction).toContain("unassigned");
    expect(review.fences.membrane).toContain("never design input");
    expect(review.fences.frozenStack).toContain("read-only");
    expect(review.notAccomplished).toHaveLength(6);
    expect(review.contractInterface.statusTokens).toEqual(["execution_verified", "attribution_incomplete"]);
    expect(review.contractInterface.path).toBe("qa/d4-r2-execution-receipt.json");
    expect(review.fingerprintConvention.contractFingerprint).toContain("Gate 2");
    expect(review.fingerprintConvention.executionFingerprint).toContain("Gate 3");
  });

  it("pins predicate non-circularity: selection reads the forte field and embeds no satellite IDs", async () => {
    expect(predicateHolds("7-27")).toBe(true);
    expect(predicateHolds("7-31")).toBe(false);
    const forteById = new Map<string, string>([["1111", "7-27"], ["2222", "7-31"], ["3333", "7-27"]]);
    const forteOf = (satellite: string) => forteById.get(satellite);
    expect(selectSatellites(["1111", "2222", "3333"], forteOf)).toEqual(["1111", "3333"]);
    forteById.set("1111", "7-31");
    forteById.set("2222", "7-27");
    expect(selectSatellites(["1111", "2222", "3333"], forteOf)).toEqual(["2222", "3333"]);
    expect(review.gates.G3.generatedKeys).toEqual(OBSERVED_KEYS);
    const engineSource = (await import("../../scripts/d4-r2-contract.mjs?raw")).default;
    for (const id of SATELLITE_IDS) expect(engineSource).not.toContain(id);
  });

  it("exercises the identity-phase mechanism on the minimal frozen keying fixture", () => {
    const result = calibrateIdentityPhase({ a0Anchors: A0_FIXTURE, R: R_FIXTURE });
    expect(result.keys).toEqual(MINIMAL_FIXTURE_KEYS);
    expect(result.offices).toEqual(["0", "6"]);
    expect(result.verdict).toBe("mechanism_only");
    expect(result.scope).toContain("Gate 3");
    expect(result.keys).not.toHaveLength(28);
    expect(review.calibration.fixtureKeys).toEqual(MINIMAL_FIXTURE_KEYS);
    expect(review.calibration.fixtureOffices).toEqual(["0", "6"]);
    expect(review.calibration.fixtureWitnessCount).toBe(8);
    expect(review.calibration.verdict).toBe("mechanism_only");
    expect(review.calibration.fixtureScope).toContain("Gate 3");
  });
});
