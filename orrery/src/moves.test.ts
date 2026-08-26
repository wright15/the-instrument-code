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
    profileRegistryReleaseId: "canonical-profile-registry:0.1.1",
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
  it("contains exactly the 60 source-backed parallel R/L moves (fixed_degree_shift)", () => {
    expect(LEGAL_MOVE_CATALOG.schemaVersion).toBe("harmonic-orrery.legal-moves.v2");
    expect(LEGAL_MOVE_CATALOG.catalogId).toBe("harmonic-orrery.parallel-anchor-edges.v1");
    expect(LEGAL_MOVE_CATALOG.moves).toHaveLength(60);
    expect(LEGAL_MOVE_CATALOG.operators).toHaveLength(12);
    // every operator is a fixed_degree_shift R/L degree 2..7
    for (const op of LEGAL_MOVE_CATALOG.operators) {
      expect(op.operatorClass).toBe("fixed_degree_shift");
      expect([2, 3, 4, 5, 6, 7]).toContain(op.degree);
      expect(["Jupiter", "Mars", "Sun", "Venus", "Mercury", "Moon"]).toContain(op.degreeGovernor);
      expect(["raise", "lower"]).toContain(op.direction);
      expect(op.partial).toBe(true);
    }
    // all 21 anchors appear as source and target at least once
    expect(new Set(LEGAL_MOVE_CATALOG.moves.map((move) => move.sourceId)).size).toBe(21);
    expect(new Set(LEGAL_MOVE_CATALOG.moves.map((move) => move.targetId)).size).toBe(21);
    // canonical parallel edge: R4 Ionian -> Lydian (Sun) xor 96 is present, and its inverse L4
    expect(LEGAL_MOVE_CATALOG.moves).toContainEqual(
      expect.objectContaining({
        id: "R4:2741:2773",
        sourceId: 2741,
        targetId: 2773,
        operatorId: "R4",
        availability: "available",
        provenance: expect.objectContaining({
          projectionStatus: "audited_parallel_edge_projected",
          structuralEdgeTypes: expect.any(String),
          structuralEdgeIds: expect.arrayContaining([expect.stringContaining("2741:2773")]),
        }),
      }),
    );
    expect(LEGAL_MOVE_CATALOG.moves).toContainEqual(
      expect.objectContaining({
        id: "L4:2773:2741",
        sourceId: 2773,
        targetId: 2741,
        operatorId: "L4",
      }),
    );
    // every operator has at least one move
    const opsInMoves = new Set(LEGAL_MOVE_CATALOG.moves.map((m) => m.operatorId));
    for (const op of LEGAL_MOVE_CATALOG.operators) {
      expect(opsInMoves.has(op.operatorId)).toBe(true);
    }
  });

  it("indexes multiple parallel moves for each live anchor", () => {
    const index = createLegalMoveCatalogIndex(responseFixture());

    // parallel catalog: Lydian (2773) has 3 outgoing R/L edges (L4->Ionian, R5->Lydian Augmented, L7->Acoustic)
    const lydianMoves = index.movesBySourceId.get(2773) ?? [];
    expect(lydianMoves.length).toBeGreaterThanOrEqual(2);
    expect(lydianMoves.map((m) => m.id)).toEqual(expect.arrayContaining(["L4:2773:2741"]));
    expect(index.movesById.get("R4:2741:2773")?.targetId).toBe(2773);
    expect(index.movesById.get("L4:2773:2741")?.targetId).toBe(2741);
    expect(index.movesBySourceId.size).toBe(21);
    expect(index.movesById.size).toBe(60);
  });

  it("rejects malformed catalog records and a projection with different source identity", () => {
    const malformed = JSON.parse(JSON.stringify(LEGAL_MOVE_CATALOG)) as Record<string, unknown>;
    const moves = malformed.moves as Array<Record<string, unknown>>;
    moves[0].targetId = 999;
    expect(() => parseLegalMoveCatalog(malformed)).toThrow("available scoped move");

    const incompatible = responseFixture();
    incompatible.harmonicDescriptor.candidateFingerprint = "f".repeat(64);
    expect(() => createLegalMoveCatalogIndex(incompatible)).toThrow(LegalMoveCatalogCompatibilityError);

    const mismatchedAnchor = responseFixture();
    mismatchedAnchor.nodes[0].state.forteFamily =
      mismatchedAnchor.nodes[0].state.forteFamily === "7-35" ? "7-34" : "7-35";
    expect(() => createLegalMoveCatalogIndex(mismatchedAnchor)).toThrow(LegalMoveCatalogCompatibilityError);
  });

  it("rejects a catalog with duplicate ids or that does not cover all anchors", () => {
    // duplicate id — clone entire move so id remains consistent with source/target/operator
    const malformed = JSON.parse(JSON.stringify(LEGAL_MOVE_CATALOG)) as Record<string, unknown>;
    const moves = malformed.moves as Array<Record<string, unknown>>;
    moves[1] = JSON.parse(JSON.stringify(moves[0]));
    expect(() => parseLegalMoveCatalog(malformed)).toThrow("unique ids");

    // missing coverage: change one move's source to duplicate another source and orphan an anchor
    const malformedCoverage = JSON.parse(JSON.stringify(LEGAL_MOVE_CATALOG)) as Record<string, unknown>;
    const moves2 = malformedCoverage.moves as Array<Record<string, unknown>>;
    // make catalog have 60 moves but one anchor never appears as source:
    //   find anchor that appears once as source and change that move's source to another value
    const anchorCounts = new Map<number, number>();
    for (const m of moves2) anchorCounts.set(m.sourceId as number, (anchorCounts.get(m.sourceId as number) ?? 0) + 1);
    let singleSource: number | undefined;
    for (const [anchor, count] of anchorCounts) if (count === 1) singleSource = anchor;
    // fallback: just corrupt moves length
    if (singleSource === undefined) {
      // force length error by removing a move
      moves2.pop();
      expect(() => parseLegalMoveCatalog(malformedCoverage)).toThrow("60 moves");
    } else {
      const duplicateSource = moves2.find((m) => m.sourceId !== singleSource)!.sourceId;
      const idx = moves2.findIndex((m) => m.sourceId === singleSource);
      moves2[idx].sourceId = duplicateSource;
      moves2[idx].id = `${moves2[idx].operatorId}:${duplicateSource}:${moves2[idx].targetId}`;
      (moves2[idx].provenance as Record<string, unknown>).applicationId = moves2[idx].id;
      expect(() => parseLegalMoveCatalog(malformedCoverage)).toThrow("cover all 21");
    }

    const malformedScope = JSON.parse(JSON.stringify(LEGAL_MOVE_CATALOG)) as Record<string, unknown>;
    const scope = malformedScope.scope as Record<string, unknown>;
    // corrupt anchorIds to be unsorted
    const anchorIds = scope.anchorIds as number[];
    const tmp = anchorIds[0];
    anchorIds[0] = anchorIds[1];
    anchorIds[1] = tmp;
    expect(() => parseLegalMoveCatalog(malformedScope)).toThrow("21 unique ascending");
  });
});
