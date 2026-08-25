import { describe, expect, it } from "vitest";

import { selectSessionAnchor, selectSessionCourtPosition, startSessionRoute, createSession, applySessionLegalMove, selectSessionLegalMove, type OrrerySourceIdentity } from "./session";
import { LEGAL_MOVE_CATALOG, createLegalMoveCatalogIndex } from "./moves";
import { OBJECTIVE_CATEGORIES, OBJECTIVE_CATEGORY_LABELS, scoreObjectives } from "./objectives";
import type { NodesResponse, OrreryNode } from "./types";

function nodesResponse(): NodesResponse {
  const nodes = LEGAL_MOVE_CATALOG.scope.anchors.map((anchor) => {
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
        chirality: "achiral" as const,
        nodeId: `scale:${stateId}`,
        name: `Anchor ${stateId}`,
        forteFamily: anchor.forteFamily,
        tier: anchor.tier,
        role: "anchor" as const,
      },
      resolution: { office, officeBearing: true as const },
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
        coordinateId: "harmonic.CH_A012_q_v1" as const,
        status: "admitted_scoped_A012" as const,
        stateGovernor: office,
        weightedProjection: { numerator: 1, denominator: 407 as const },
      },
    } satisfies OrreryNode;
  });
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
    nodes,
  };
}

const response = nodesResponse();
const catalog = createLegalMoveCatalogIndex(response);
const nodesById = new Map(response.nodes.map((node) => [node.state.stateId, node]));
const source: OrrerySourceIdentity = {
  nodesSchemaVersion: response.schemaVersion,
  profileRegistryReleaseId: response.profileRegistryReleaseId,
  harmonicDescriptorReleaseId: response.harmonicDescriptor.releaseId,
  harmonicDescriptorFingerprint: response.harmonicDescriptor.candidateFingerprint,
  legalMoveCatalogSchemaVersion: LEGAL_MOVE_CATALOG.schemaVersion,
  legalMoveCatalogFingerprint: LEGAL_MOVE_CATALOG.catalogFingerprint,
};

function applyMove(session: ReturnType<typeof createSession>, moveId: string) {
  const move = catalog.movesById.get(moveId);
  if (!move) {
    throw new Error(`Missing catalog move ${moveId}`);
  }
  const selected = selectSessionLegalMove(session, move, catalog.movesById);
  if (selected.kind !== "selected") {
    throw new Error(selected.message);
  }
  const applied = applySessionLegalMove(selected.session, catalog.movesById);
  if (applied.kind !== "applied") {
    throw new Error(applied.message);
  }
  return applied.session;
}

function objectiveState(session: ReturnType<typeof createSession>, id: string) {
  return scoreObjectives(session, catalog, nodesById).find((objective) => objective.id === id)?.status;
}

describe("Harmonic Orrery local objectives", () => {
  it("completes the short Lydian-to-Aeolian discovery route only through declared moves", () => {
    let session = startSessionRoute(selectSessionAnchor(createSession(source), 2773), 2773);
    session = applyMove(session, "M:2773:1717");
    session = applyMove(session, "M:1717:1453");

    expect(session.modalRoute).toEqual({
      startAnchorId: 2773,
      currentAnchorId: 1453,
      moveIds: ["M:2773:1717", "M:1717:1453"],
    });
    expect(objectiveState(session, "lydian-to-aeolian")).toBe("completed");
    expect(objectiveState(session, "modal-orbit")).toBe("ready");
  });

  it("scores a seven-step modal orbit and all seven offices from route history", () => {
    let session = startSessionRoute(selectSessionAnchor(createSession(source), 1387), 1387);
    for (const moveId of [
      "M:1387:2741",
      "M:2741:1709",
      "M:1709:1451",
      "M:1451:2773",
      "M:2773:1717",
      "M:1717:1453",
      "M:1453:1387",
    ]) {
      session = applyMove(session, moveId);
    }

    expect(objectiveState(session, "modal-orbit")).toBe("completed");
    expect(objectiveState(session, "all-offices")).toBe("completed");
  });

  it("does not score direct inspection as a route and scores only the ordered Court traversal", () => {
    let inspected = createSession(source);
    for (const stateId of LEGAL_MOVE_CATALOG.scope.anchorIds) {
      inspected = selectSessionAnchor(inspected, stateId);
    }
    expect(objectiveState(inspected, "all-offices")).toBe("ready");

    let courtSession = createSession(source);
    courtSession = selectSessionCourtPosition(courtSession, "C1");
    courtSession = selectSessionCourtPosition(courtSession, "C2");
    courtSession = selectSessionCourtPosition(courtSession, "C3");
    courtSession = selectSessionCourtPosition(courtSession, "C4");
    expect(objectiveState(courtSession, "court-c0-c4")).toBe("completed");

    let boundedCourtSession = createSession(source);
    for (let index = 0; index < 40; index += 1) {
      boundedCourtSession = selectSessionCourtPosition(
        boundedCourtSession,
        boundedCourtSession.courtPresentationPosition === "C0" ? "C1" : "C0",
      );
    }
    for (const position of ["C1", "C2", "C3", "C4"] as const) {
      boundedCourtSession = selectSessionCourtPosition(boundedCourtSession, position);
    }
    expect(objectiveState(boundedCourtSession, "court-c0-c4")).toBe("completed");
  });

  it("assigns discovery/strategy/learning categories to each objective", () => {
    const session = createSession(source);
    const progress = scoreObjectives(session, catalog, nodesById);
    expect(progress.find((o) => o.id === "modal-orbit")?.category).toBe("strategy");
    expect(progress.find((o) => o.id === "all-offices")?.category).toBe("discovery");
    expect(progress.find((o) => o.id === "lydian-to-aeolian")?.category).toBe("strategy");
    expect(progress.find((o) => o.id === "court-c0-c4")?.category).toBe("learning");
    expect(OBJECTIVE_CATEGORIES["modal-orbit"]).toBe("strategy");
    expect(OBJECTIVE_CATEGORIES["all-offices"]).toBe("discovery");
    expect(OBJECTIVE_CATEGORIES["court-c0-c4"]).toBe("learning");
    expect(OBJECTIVE_CATEGORY_LABELS["discovery"]).toBe("Discovery");
    expect(OBJECTIVE_CATEGORY_LABELS["strategy"]).toBe("Strategy");
    expect(OBJECTIVE_CATEGORY_LABELS["learning"]).toBe("Learning");
    for (const item of progress) {
      expect(item.categoryLabel).toBe(OBJECTIVE_CATEGORY_LABELS[item.category]);
    }
  });
});
