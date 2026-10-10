import { describe, expect, it } from "vitest";

import receipt from "../../qa/d4-r2-execution-receipt.json";
import contract from "./generated/d4-r2-contract.v1.json";
import schema from "../../schemas/d4-r2-execution-receipt.schema.json";

const OBSERVED_KEYS = [
  "0:1339", "0:2395", "1:1765", "1:3497", "2:2717", "2:3245", "3:1465", "3:949",
  "4:1703", "4:1835", "5:1261", "5:695", "6:2899", "6:2965",
];

describe("D4 R2 execution receipt (BL-057 Gate 3) — derivation execution validation", () => {
  it("pins the receipt header, work item, naming correction and the two-fingerprint convention", () => {
    expect(receipt.schemaVersion).toBe("d4-r2-execution-receipt.v1");
    expect(receipt.routeId).toBe("R2");
    expect(receipt.workItem).toBe("BL-057");
    expect(receipt.naming.note).toContain("BL-031 is the topology/lattice track");
    expect(["execution_verified", "attribution_incomplete"]).toContain(receipt.status);
    expect(receipt.executionTimestamp).toMatch(/Z$/);
    expect(receipt.implementationDigest).toMatch(/^[0-9a-f]{64}$/);
    expect(receipt.executionFingerprint).toMatch(/^[0-9a-f]{64}$/);
    expect(receipt.gate2ContractFingerprint).toBe(contract.contractFingerprint);
    expect(receipt.fingerprintConvention.executionFingerprint).toContain("no collapse");
    expect(receipt.fingerprintConvention.implementationDigest).toContain("Gate 2");
  });

  it("pins the calibration as EXACT with the frozen pattern reproduced at every patch phase", () => {
    expect(receipt.calibration.verdict).toBe("EXACT");
    expect(receipt.calibration.pass).toBe(true);
    expect(receipt.calibration.routeA.accounting).toMatchObject({
      generatedKeyCount: 8, matchedObservedCount: 4, inRButUnmatchedCount: 4,
      missedObservedCount: 10, restatementSignature: false,
    });
    expect(receipt.calibration.routeB.accounting).toMatchObject({
      generatedKeyCount: 28, restatementSignature: true, inRButUnmatchedCount: 14,
    });
    expect(receipt.calibration.fourCellCounts).toEqual({ aOnly: 0, bOnly: 10, both: 4, neither: 0 });
    expect(receipt.calibration.tC.midpointExact).toBe(true);
    expect(receipt.calibration.tC.generatedRelations).toEqual(["A0:1387:2741:0", "A0:1451:2773:6"]);
    expect(receipt.calibration.perPhase).toHaveLength(3);
    for (const phase of receipt.calibration.perPhase) {
      expect(phase.identicalToFrozen).toBe(true);
      expect(phase.fourCellCounts).toEqual({ aOnly: 0, bOnly: 10, both: 4, neither: 0 });
    }
    expect(receipt.calibration.note).toContain("license");
  });

  it("pins the registered R2 execution: G_R2 = O exactly with gates G1-G5 green", () => {
    expect(receipt.routeExecution.contacts.generatedKeys).toEqual(OBSERVED_KEYS);
    expect(receipt.routeExecution.contacts.witnessCount).toBe(14);
    expect(receipt.gates).toEqual({ G1: true, G2: true, G3: true, G4: true, G5: true });
    expect(receipt.gateDetail.G1.verified).toBe(7);
    expect(receipt.gateDetail.G1.t1Edges).toEqual(["0", "6"]);
    expect(receipt.gateDetail.G1.t2Edges).toEqual(["1", "2", "3", "4", "5"]);
    expect(receipt.gateDetail.G3).toMatchObject({ generatedCount: 14, observedCount: 14, missing: [], extra: [] });
    expect(receipt.gateDetail.G4).toMatchObject({ generatedCount: 14, uKeyCount: 28, strictSubset: true, nonCollapse: true });
    expect(receipt.gateDetail.G5).toMatchObject({ realized: 7, exact: 2, unverified: 5 });
    expect(receipt.routeExecution.outputComparison).toMatchObject({
      observedKeyCount: 14, r2KeyCount: 14, tAKeyCount: 8, tBKeyCount: 28, uKeyCount: 28,
    });
    expect(receipt.routeExecution.perOffice).toHaveLength(7);
    for (const office of receipt.routeExecution.perOffice) expect(office.selectedCount).toBe(2);
  });

  it("pins the output hashes: generated keys, calibration keys and relation digests recorded", () => {
    expect(receipt.outputHashes.generatedKeys).toEqual(OBSERVED_KEYS);
    expect(receipt.outputHashes.generatedKeysDigest).toMatch(/^[0-9a-f]{64}$/);
    expect(receipt.outputHashes.calibrationKeysDigest).toMatch(/^[0-9a-f]{64}$/);
    expect(receipt.outputHashes.witnessesDigest).toMatch(/^[0-9a-f]{64}$/);
    expect(receipt.outputHashes.realizedRelationKeysDigest).toMatch(/^[0-9a-f]{64}$/);
  });

  it("pins the six input primaries to the Gate 2 source bindings", () => {
    expect(receipt.inputHashes).toHaveLength(6);
    for (let index = 0; index < 6; index += 1) {
      expect(receipt.inputHashes[index].artifact).toBe(contract.sourceBindings[index].artifact);
      expect(receipt.inputHashes[index].sha256).toBe(contract.sourceBindings[index].sha256);
      expect(receipt.inputHashes[index].role).toBe(contract.sourceBindings[index].role);
    }
  });

  it("pins the implementation file set and its manifest digest", () => {
    expect(receipt.implementationFiles.map((file) => file.path)).toEqual([
      "orrery/scripts/validate-d4-r2-contract.mjs",
      "orrery/src/d4-r2-contract.test.ts",
      "orrery/src/generated/d4-r2-contract.v1.json",
      "scripts/build-d4-r2-contract.mjs",
      "scripts/d4-r2-contract.mjs",
    ]);
    expect(receipt.implementationDigest).toMatch(/^[0-9a-f]{64}$/);
    expect(receipt.implementationFiles.every((file) => /^[0-9a-f]{64}$/.test(file.sha256))).toBe(true);
  });

  it("pins the seam-phase contexts: R2 derived@X at every licensed context with the construction join as contrast", () => {
    expect(receipt.seamDerivation.contexts).toHaveLength(5);
    const contexts = new Map(receipt.seamDerivation.contexts.map((context) => [context.id, context]));
    for (const id of ["phase-11", "phase-0", "phase-1", "seam-familyA"]) {
      const context = contexts.get(id);
      expect(context).toBeDefined();
      expect(context?.licensed).toBe(true);
      expect(context?.disposition).toBe(`derived@${id}`);
      expect(context?.criteria.C1).toMatchObject({
        covered_lifted: true, G_A_not_U_lifted: true, in_R_but_unmatched_zero: true,
        G_A_equals_O_proper_subset_U: true, construction_join_restates_U: true, holds: true,
      });
      expect(context?.routeA).toMatchObject({
        generatedKeyCount: 14, inRButUnmatchedCount: 0, missedObservedCount: 0, restatementSignature: false,
      });
      expect(context?.routeB.restatementSignature).toBe(true);
      expect(context?.fourCellCounts).toEqual({ aOnly: 0, bOnly: 0, both: 14, neither: 0 });
    }
    const seam = contexts.get("seam-familyA");
    expect(seam?.carriedEndpointRealizations).toEqual([]);
    expect(seam?.phaseProvenance).toHaveLength(7);
    expect(receipt.seamDerivation.preRegistration.literalFormNote).toContain("2163-2164");
    expect(receipt.seamDerivation.stageProvenance).toContain("bl-033-phaseC-lifted-keying-spec.md");
  });

  it("pins the strict-degree control: the frozen failure shape reproduced (cells 0/10/4/0)", () => {
    const control = receipt.seamDerivation.contexts.find((context) => context.id === "strict-degree-control");
    expect(control).toMatchObject({ licensed: false, control: true, disposition: "not_derived@strict-degree-control" });
    expect(control?.routeA).toMatchObject({ generatedKeyCount: 4, missedObservedCount: 10, restatementSignature: false });
    expect(control?.fourCellCounts).toEqual({ aOnly: 0, bOnly: 10, both: 4, neither: 0 });
    expect(receipt.seamDerivation.branchClassification.controlContexts[0].note).toContain("OD-C1");
  });

  it("pins the T-C scope: 7 realized / 2 observation-exact / 5 predictions, strict equality recorded false", () => {
    for (const context of receipt.seamDerivation.contexts.filter((entry) => entry.licensed)) {
      expect(context.tC.realized).toBe(7);
      expect(context.tC.observationExact).toBe(2);
      expect(context.tC.seamDerivedPredictions).toBe(5);
      expect(context.tC.missing).toEqual([]);
      expect(context.tC.extra).toHaveLength(5);
      expect(context.tC.cStrict).toBe(false);
      expect(context.tC.holds).toBe(true);
      expect(context.tC.realizationOfObserved).toBe(true);
    }
    expect(receipt.gateDetail.G5.seamCrossCheck).toEqual({
      generatedRelations: 7, equalsRealizedSet: true, observedRelations: 2,
      equalsExactSubset: true, realizationOfObserved: true,
    });
  });

  it("pins the C2/C3/C4 guards: R2 never restates, no cross-phase containment, no beyond-R keys", () => {
    for (const context of receipt.seamDerivation.contexts.filter((entry) => entry.licensed)) {
      expect(context.criteria.C2.R2_restates).toBe(false);
      expect(context.criteria.C2.construction_join_restates).toBe(true);
      expect(context.criteria.C3.O_subset_G_A).toBe(true);
      expect(context.criteria.C4).toMatchObject({
        beyond_lifted_R_keys: 0, phase_bindings_resolved: true,
        cross_phase_containment_used: false, valid: true,
      });
    }
  });

  it("pins the D7 analogue as hypothesis-tier: literal 0/14, class 14 = U = O restatement, cycle-twin 0/7", () => {
    expect(receipt.d7Analogue.label).toBe("hypothesis-analogue");
    expect(receipt.d7Analogue.construction).toMatchObject({
      anchors: 7, analogueR: 14, contacts: 14, selectionGap: 0, uKeyCount: 14, observedKeyCount: 14,
    });
    expect(receipt.d7Analogue.modalCycleWalk.closes).toBe(true);
    expect(receipt.d7Analogue.cycleTwinVerification.verified).toBe(0);
    expect(receipt.d7Analogue.literalPredicate.selectedKeyCount).toBe(0);
    expect(receipt.d7Analogue.literalPredicate.accounting.missedObservedCount).toBe(14);
    expect(receipt.d7Analogue.domainClassPredicate.selectedKeyCount).toBe(14);
    expect(receipt.d7Analogue.domainClassPredicate.accounting.restatementSignature).toBe(true);
    expect(receipt.d7Analogue.asymmetry).toHaveLength(3);
    expect(receipt.d7Analogue.claimEvent).toContain("none");
  });

  it("pins the branch classification, status determination and Gate 4 readiness", () => {
    expect(receipt.seamDerivation.branchClassification.branch).toBe("DERIVED@X");
    expect(receipt.seamDerivation.branchClassification.derivedContexts).toEqual([
      "phase-11", "phase-0", "phase-1", "seam-familyA",
    ]);
    expect(receipt.seamDerivation.branchClassification.gate4.opens).toBe(true);
    expect(receipt.status).toBe("execution_verified");
    expect(receipt.passFail).toBe(true);
    expect(receipt.statusRationale).toContain("derives O");
  });

  it("pins the fences and the record state: no-collapse, ENTRY 10 untouched, no amendment", () => {
    expect(receipt.fences.noCollapse).toContain("evidence, not an amendment");
    expect(receipt.fences.ledger).toContain("no ledger writes");
    expect(receipt.fences.d7).toContain("hypothesis-tier");
    expect(receipt.recordFence.entry10Sha256).toBe("201efe8193e1967cb91bb07b4876c906be5ba71a23bf4735be6d18a7df69f7a7");
    expect(receipt.recordFence.d4RegisteredCategory).toContain("not_derived");
    expect(receipt.notAccomplished).toHaveLength(6);
    expect(contract.status).toBe("implementation_evidence");
    expect(contract.contractFingerprint).toBe("5528510b495f12fa11ab713d8ee357e3798f728204eacd83ad491aafb8fdc7d5");
  });

  it("conforms to the authored receipt schema shape", () => {
    for (const required of schema.required) expect(receipt).toHaveProperty(required);
    expect(schema.$id).toBe("d4-r2-execution-receipt.v1");
    expect(schema.properties.schemaVersion.const).toBe(receipt.schemaVersion);
    expect(schema.properties.routeId.const).toBe(receipt.routeId);
    expect(schema.properties.workItem.const).toBe(receipt.workItem);
    expect(schema.properties.status.enum).toContain(receipt.status);
  });
});
