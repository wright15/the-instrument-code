import { describe, expect, it } from "vitest";

import {
  LEGAL_MOVE_CATALOG,
  LegalMoveCatalogCompatibilityError,
  createLegalMoveCatalogIndex,
  parseLegalMoveCatalog,
  type LegalMoveCatalogAnchor,
} from "./moves";
import type { NodesResponse, OrreryNode } from "./types";

function node(anchor: LegalMoveCatalogAnchor): OrreryNode {
  const { stateId, office } = anchor;
  const pitchClasses = Array.from({ length: 12 }, (_value, pitchClass) => pitchClass).filter(
    (pitchClass) => (stateId & (1 << pitchClass)) !== 0,
  );
  return {
    state: {
      stateId,
      pitchMask: stateId,
      pitchClasses,
      intervalVector: [0, 0, 0, 0, 0, 0],
      chirality: "achiral",
      nodeId: `scale:${stateId}`,
      name: `Anchor ${stateId}`,
      forteFamily: anchor.forteFamily,
      tier: anchor.tier,
      role: "anchor",
    },
    resolution: { office, officeBearing: true },
    photonic: {
      photonicId: `photonic:${office.toLowerCase()}`,
      office,
      representativeWavelengthNm: 500,
      photonicCompression: 1,
    },
    canonicalProfile: {
      profileId: `profile:${office.toLowerCase()}`,
      profileVersion: "0.1.1",
      office,
      domainReferences: { landforms: ["ridge"] },
    },
    scopedHarmonicDescriptor: {
      coordinateId: "harmonic.CH_A012_q_v1",
      status: "admitted_scoped_A012",
      stateGovernor: office,
      weightedProjection: { numerator: 1, denominator: 407 },
    },
  };
}

function responseFixture(): NodesResponse {
  return {
    schemaVersion: "harmonic-orrery.nodes.v2",
    profileRegistryReleaseId: "canonical-feature-profile-registry:0.1.1",
    harmonicDescriptor: {
      candidateId: "CH_A012_q_v1",
      coordinateId: "harmonic.CH_A012_q_v1",
      releaseId: "harmonic-compression-candidate:CH_A012_q_v1:1.0.0",
      status: "admitted_scoped_A012",
      candidateFingerprint: LEGAL_MOVE_CATALOG.scope.harmonicDescriptorFingerprint,
    },
    nodeCount: 21,
    nodes: LEGAL_MOVE_CATALOG.scope.anchors.map(node),
  };
}

describe("Harmonic Orrery legal-move catalog", () => {
  it("contains exactly the 21 source-backed canonical modal moves", () => {
    expect(LEGAL_MOVE_CATALOG.schemaVersion).toBe("harmonic-orrery.legal-moves.v2");
    expect(LEGAL_MOVE_CATALOG.moves).toHaveLength(21);
    expect(new Set(LEGAL_MOVE_CATALOG.moves.map((move) => move.sourceId))).toHaveLength(21);
    expect(new Set(LEGAL_MOVE_CATALOG.moves.map((move) => move.targetId))).toHaveLength(21);
    expect(LEGAL_MOVE_CATALOG.moves).toContainEqual(
      expect.objectContaining({
        id: "M:2773:1717",
        sourceId: 2773,
        targetId: 1717,
        operatorId: "M",
        availability: "available",
        provenance: expect.objectContaining({
          projectionStatus: "canonical_modal_edge_projected",
          structuralEvidence: true,
          structuralEdgeTypes: "MODAL_SUCCESSOR",
          structuralEdgeIds: ["modal:A0:2773:1717"],
        }),
      }),
    );

    for (const tier of ["A0", "A1", "A2"] as const) {
      const anchors = LEGAL_MOVE_CATALOG.scope.anchors.filter((anchor) => anchor.tier === tier);
      const startId = anchors[0].stateId;
      const visited = new Set<number>();
      let currentId = startId;
      for (let step = 0; step < 7; step += 1) {
        visited.add(currentId);
        currentId = LEGAL_MOVE_CATALOG.moves.find((move) => move.sourceId === currentId)?.targetId ?? -1;
      }
      expect(visited.size).toBe(7);
      expect(currentId).toBe(startId);
    }
  });

  it("indexes exactly one offered move for each compatible live anchor", () => {
    const index = createLegalMoveCatalogIndex(responseFixture());

    expect(index.movesById.get("M:1387:2741")?.targetId).toBe(2741);
    expect(index.movesBySourceId.get(2773)).toEqual([index.movesById.get("M:2773:1717")]);
    expect(index.movesBySourceId.size).toBe(21);
  });

  it("rejects malformed catalog records and a projection with different source identity", () => {
    const malformed = JSON.parse(JSON.stringify(LEGAL_MOVE_CATALOG)) as Record<string, unknown>;
    const moves = malformed.moves as Array<Record<string, unknown>>;
    moves[0].targetId = 999;
    expect(() => parseLegalMoveCatalog(malformed)).toThrow("available scoped modal move");

    const incompatible = responseFixture();
    incompatible.harmonicDescriptor.candidateFingerprint = "f".repeat(64);
    expect(() => createLegalMoveCatalogIndex(incompatible)).toThrow(LegalMoveCatalogCompatibilityError);

    const mismatchedAnchor = responseFixture();
    mismatchedAnchor.nodes[0].state.forteFamily =
      mismatchedAnchor.nodes[0].state.forteFamily === "7-35" ? "7-34" : "7-35";
    expect(() => createLegalMoveCatalogIndex(mismatchedAnchor)).toThrow(LegalMoveCatalogCompatibilityError);
  });

  it("rejects a one-to-one mapping that does not preserve the three seven-step cycles", () => {
    const malformed = JSON.parse(JSON.stringify(LEGAL_MOVE_CATALOG)) as Record<string, unknown>;
    const moves = malformed.moves as Array<Record<string, unknown>>;
    const first = moves.find((move) => move.id === "M:1387:2741");
    const second = moves.find((move) => move.id === "M:1709:1451");
    if (!first || !second) {
      throw new Error("Missing A0 test moves");
    }
    const firstTargetId = first.targetId as number;
    const secondTargetId = second.targetId as number;
    first.targetId = secondTargetId;
    first.id = `M:${first.sourceId}:${secondTargetId}`;
    (first.provenance as Record<string, unknown>).applicationId = first.id;
    second.targetId = firstTargetId;
    second.id = `M:${second.sourceId}:${firstTargetId}`;
    (second.provenance as Record<string, unknown>).applicationId = second.id;

    expect(() => parseLegalMoveCatalog(malformed)).toThrow("three seven-step modal cycles");

    const malformedScope = JSON.parse(JSON.stringify(LEGAL_MOVE_CATALOG)) as Record<string, unknown>;
    const anchors = ((malformedScope.scope as Record<string, unknown>).anchors as Array<Record<string, unknown>>);
    const a0Anchor = anchors.find((anchor) => anchor.tier === "A0");
    if (!a0Anchor) {
      throw new Error("Missing A0 test anchor");
    }
    a0Anchor.tier = "A1";
    expect(() => parseLegalMoveCatalog(malformedScope)).toThrow("seven anchors in every tier");
  });
});
