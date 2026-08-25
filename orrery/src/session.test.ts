import { describe, expect, it } from "vitest";

import {
  SESSION_SCHEMA_VERSION,
  SESSION_STORAGE_KEY,
  applySessionLegalMove,
  clearSessionSelection,
  clearSessionRoute,
  createSession,
  loadSession,
  markSessionObjectivesCompleted,
  parseUrlAnchorSelection,
  saveSession,
  selectSessionAnchor,
  selectSessionCourtPosition,
  selectSessionLegalMove,
  startSessionRoute,
  type OrrerySourceIdentity,
  type SessionLegalMove,
  type StorageLike,
} from "./session";

const source: OrrerySourceIdentity = {
  nodesSchemaVersion: "harmonic-orrery.nodes.v2",
  profileRegistryReleaseId: "canonical-feature-profile-registry:0.1.1",
  harmonicDescriptorReleaseId: "harmonic-compression-candidate:CH_A012_q_v1:1.0.0",
  harmonicDescriptorFingerprint: "a".repeat(64),
  legalMoveCatalogSchemaVersion: "harmonic-orrery.legal-moves.v2",
  legalMoveCatalogFingerprint: "b".repeat(64),
};
const anchors = new Set([1387, 2741, 1709, 1451, 2773, 1717, 1453]);
const objectives = new Set(["modal-orbit", "all-offices", "lydian-to-aeolian", "court-c0-c4"]);
const moves = new Map<string, SessionLegalMove>([
  ["M:1387:2741", { id: "M:1387:2741", sourceId: 1387, targetId: 2741 }],
  ["M:2741:1709", { id: "M:2741:1709", sourceId: 2741, targetId: 1709 }],
  ["M:1709:1451", { id: "M:1709:1451", sourceId: 1709, targetId: 1451 }],
  ["M:1451:2773", { id: "M:1451:2773", sourceId: 1451, targetId: 2773 }],
  ["M:2773:1717", { id: "M:2773:1717", sourceId: 2773, targetId: 1717 }],
  ["M:1717:1453", { id: "M:1717:1453", sourceId: 1717, targetId: 1453 }],
  ["M:1453:1387", { id: "M:1453:1387", sourceId: 1453, targetId: 1387 }],
]);

class MemoryStorage implements StorageLike {
  readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

function load(storage: StorageLike): ReturnType<typeof loadSession> {
  return loadSession(storage, source, anchors, moves, objectives);
}

function selectMove(session = startSessionRoute(selectSessionAnchor(createSession(source), 2773), 2773)) {
  const move = moves.get("M:2773:1717");
  if (!move) {
    throw new Error("Missing test move");
  }
  const selected = selectSessionLegalMove(session, move, moves);
  if (selected.kind !== "selected") {
    throw new Error(selected.message);
  }
  return selected.session;
}

function legacySource() {
  return {
    nodesSchemaVersion: "harmonic-orrery.nodes.v1",
    profileRegistryReleaseId: source.profileRegistryReleaseId,
    harmonicDescriptorReleaseId: source.harmonicDescriptorReleaseId,
    harmonicDescriptorFingerprint: source.harmonicDescriptorFingerprint,
  };
}

describe("Harmonic Orrery session", () => {
  it("accepts one valid shared anchor and rejects malformed, duplicate, and unknown IDs", () => {
    expect(parseUrlAnchorSelection("?anchor=1387", anchors)).toEqual({ kind: "selected", anchorId: 1387 });
    expect(parseUrlAnchorSelection("", anchors)).toEqual({ kind: "absent" });
    expect(parseUrlAnchorSelection("?anchor=01387", anchors).kind).toBe("invalid");
    expect(parseUrlAnchorSelection("?anchor=1387&anchor=2741", anchors).kind).toBe("invalid");
    expect(parseUrlAnchorSelection("?anchor=999", anchors).kind).toBe("invalid");
    expect(parseUrlAnchorSelection("?anchor=9007199254740992", anchors).kind).toBe("invalid");
  });

  it("persists deterministic local selection, modal route, objectives, and Court history", () => {
    const storage = new MemoryStorage();
    const firstMove = selectMove();
    const applied = applySessionLegalMove(firstMove, moves);
    if (applied.kind !== "applied") {
      throw new Error(applied.message);
    }
    const session = markSessionObjectivesCompleted(
      selectSessionCourtPosition(applied.session, "C1"),
      ["lydian-to-aeolian"],
      objectives,
    );

    expect(session.visitedAnchorIds).toEqual([1717, 2773]);
    expect(session.modalRoute).toEqual({
      startAnchorId: 2773,
      currentAnchorId: 1717,
      moveIds: ["M:2773:1717"],
    });
    expect(session.courtRouteHistory).toEqual(["C0", "C1"]);
    expect(saveSession(storage, session)).toBeUndefined();
    expect(load(storage)).toEqual({ session });

    const serialized = storage.getItem(SESSION_STORAGE_KEY);
    expect(serialized).toContain(`"schemaVersion":"${SESSION_SCHEMA_VERSION}"`);
    expect(serialized).toContain('"selectedLegalMoveId":null');
    expect(serialized).toContain('"moveIds":["M:2773:1717"]');
    expect(serialized).toContain('"courtRouteHistory":["C0","C1"]');
  });

  it("keeps free inspection separate from an active local route", () => {
    const session = applySessionLegalMove(selectMove(), moves);
    if (session.kind !== "applied") {
      throw new Error(session.message);
    }
    const inspected = selectSessionAnchor(session.session, 1387);

    expect(inspected.selectedAnchorId).toBe(1387);
    expect(inspected.modalRoute.currentAnchorId).toBe(1717);
    expect(inspected.selectedLegalMoveId).toBeNull();
    expect(clearSessionSelection(inspected).modalRoute.currentAnchorId).toBe(1717);
    expect(clearSessionRoute(inspected).modalRoute.currentAnchorId).toBeNull();
  });

  it("allows only cataloged contiguous modal moves and rejects invented reverse moves", () => {
    const selected = selectMove();
    const applied = applySessionLegalMove(selected, moves);
    if (applied.kind !== "applied") {
      throw new Error(applied.message);
    }
    const nextMove = moves.get("M:1717:1453");
    if (!nextMove) {
      throw new Error("Missing test move");
    }

    expect(selectSessionLegalMove(applied.session, nextMove, moves).kind).toBe("selected");
    expect(
      selectSessionLegalMove(
        applied.session,
        { id: "M:1717:2773", sourceId: 1717, targetId: 2773 },
        moves,
      ),
    ).toEqual({ kind: "invalid", message: "That move is not present in the current legal-move catalog." });
    expect(applySessionLegalMove(applied.session, moves).kind).toBe("invalid");
  });

  it("accepts only adjacent Court presentation changes and records their local route", () => {
    const c0 = createSession(source);
    const c1 = selectSessionCourtPosition(c0, "C1");
    const c2 = selectSessionCourtPosition(c1, "C2");

    expect(c0.courtRouteHistory).toEqual(["C0"]);
    expect(c1.courtRouteHistory).toEqual(["C0", "C1"]);
    expect(c2.courtRouteHistory).toEqual(["C0", "C1", "C2"]);
    expect(() => selectSessionCourtPosition(c0, "C0")).toThrow("adjacent");
    expect(() => selectSessionCourtPosition(c0, "C2")).toThrow("adjacent");

    let bounded = c0;
    for (let index = 0; index < 40; index += 1) {
      bounded = selectSessionCourtPosition(
        bounded,
        bounded.courtPresentationPosition === "C0" ? "C1" : "C0",
      );
    }
    bounded = selectSessionCourtPosition(bounded, "C1");
    bounded = selectSessionCourtPosition(bounded, "C2");
    bounded = selectSessionCourtPosition(bounded, "C3");
    bounded = selectSessionCourtPosition(bounded, "C4");
    expect(bounded.courtRouteHistory).toHaveLength(33);
    expect(bounded.courtRouteHistory.slice(-5)).toEqual(["C0", "C1", "C2", "C3", "C4"]);
  });

  it("migrates valid v1 and v2 local progress without inventing route history", () => {
    const v1Storage = new MemoryStorage();
    v1Storage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({
        schemaVersion: "harmonic-orrery.session.v1",
        source: legacySource(),
        selectedAnchorId: 1387,
        visitedAnchorIds: [1387],
        courtPresentationPosition: null,
      }),
    );
    expect(load(v1Storage)).toMatchObject({
      session: {
        schemaVersion: SESSION_SCHEMA_VERSION,
        selectedAnchorId: 1387,
        courtPresentationPosition: "C0",
        modalRoute: { startAnchorId: null, currentAnchorId: null, moveIds: [] },
        courtRouteHistory: ["C0"],
      },
    });

    const v2Storage = new MemoryStorage();
    v2Storage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({
        schemaVersion: "harmonic-orrery.session.v2",
        source: legacySource(),
        selectedAnchorId: 2741,
        visitedAnchorIds: [1387, 2741],
        courtPresentationPosition: "C2",
      }),
    );
    expect(load(v2Storage)).toMatchObject({
      session: {
        schemaVersion: SESSION_SCHEMA_VERSION,
        selectedAnchorId: 2741,
        courtPresentationPosition: "C2",
        modalRoute: { startAnchorId: null, currentAnchorId: null, moveIds: [] },
        courtRouteHistory: ["C2"],
      },
    });
  });

  it("migrates the published v1 projection/catalog binding without losing local route progress", () => {
    const storage = new MemoryStorage();
    storage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({
        ...createSession(source),
        source: {
          ...source,
          nodesSchemaVersion: "harmonic-orrery.nodes.v1",
          legalMoveCatalogSchemaVersion: "harmonic-orrery.legal-moves.v1",
          legalMoveCatalogFingerprint: "ae99a609040af5554e8a154968913598416814a6735a4d1ec7658f92e537ac46",
        },
        selectedAnchorId: 2773,
        visitedAnchorIds: [2773],
        modalRoute: { startAnchorId: 2773, currentAnchorId: 2773, moveIds: [] },
      }),
    );

    expect(load(storage)).toMatchObject({
      session: {
        source,
        selectedAnchorId: 2773,
        modalRoute: { startAnchorId: 2773, currentAnchorId: 2773, moveIds: [] },
      },
    });
    expect(storage.getItem(SESSION_STORAGE_KEY)).toContain('"nodesSchemaVersion":"harmonic-orrery.nodes.v2"');
  });

  it("migrates only the published v1 legal-move catalog binding for a v2 projection", () => {
    const storage = new MemoryStorage();
    storage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({
        ...createSession(source),
        source: {
          ...source,
          legalMoveCatalogSchemaVersion: "harmonic-orrery.legal-moves.v1",
          legalMoveCatalogFingerprint: "ae99a609040af5554e8a154968913598416814a6735a4d1ec7658f92e537ac46",
        },
      }),
    );

    expect(load(storage)).toMatchObject({ session: { source } });
    expect(storage.getItem(SESSION_STORAGE_KEY)).toContain('"legalMoveCatalogSchemaVersion":"harmonic-orrery.legal-moves.v2"');
  });

  it("discards malformed, stale, and catalog-incompatible saved documents", () => {
    const storage = new MemoryStorage();
    storage.setItem(SESSION_STORAGE_KEY, "not json");
    expect(load(storage).notice).toContain("invalid");

    storage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({
        ...createSession(source),
        source: {
          ...source,
          profileRegistryReleaseId: "stale-projection-release",
          legalMoveCatalogSchemaVersion: "harmonic-orrery.legal-moves.v1",
          legalMoveCatalogFingerprint: "ae99a609040af5554e8a154968913598416814a6735a4d1ec7658f92e537ac46",
        },
      }),
    );
    expect(load(storage).notice).toContain("invalid");
    expect(storage.getItem(SESSION_STORAGE_KEY)).toBeNull();

    storage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ ...createSession(source), schemaVersion: "harmonic-orrery.session.v0" }),
    );
    expect(load(storage).notice).toContain("invalid");

    storage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ ...createSession({ ...source, legalMoveCatalogFingerprint: "c".repeat(64) }) }),
    );
    expect(load(storage).notice).toContain("different projection release");

    storage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({
        ...createSession(source),
        source: {
          ...source,
          legalMoveCatalogSchemaVersion: "harmonic-orrery.legal-moves.v1",
          legalMoveCatalogFingerprint: "c".repeat(64),
        },
      }),
    );
    expect(load(storage).notice).toContain("invalid");

    storage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({
        ...createSession(source),
        modalRoute: { startAnchorId: 2773, currentAnchorId: 1453, moveIds: ["M:2773:1717"] },
      }),
    );
    expect(load(storage).notice).toContain("invalid");

    storage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ ...createSession(source), completedObjectiveIds: ["unknown-objective"] }),
    );
    expect(load(storage).notice).toContain("invalid");
  });

  it("cannot persist objective IDs outside the current objective set", () => {
    expect(() => markSessionObjectivesCompleted(createSession(source), ["unknown-objective"], objectives)).toThrow(
      "unsupported",
    );
  });

  it("fails safely when browser storage is unavailable", () => {
    const unavailable: StorageLike = {
      getItem(): string | null {
        throw new Error("blocked");
      },
      setItem(): void {
        throw new Error("blocked");
      },
      removeItem(): void {
        throw new Error("blocked");
      },
    };

    expect(load(unavailable).notice).toContain("unavailable");
    expect(saveSession(unavailable, createSession(source))).toContain("could not be saved");
  });
});
