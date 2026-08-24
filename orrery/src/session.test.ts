import { describe, expect, it } from "vitest";

import {
  SESSION_SCHEMA_VERSION,
  SESSION_STORAGE_KEY,
  clearSessionSelection,
  createSession,
  loadSession,
  parseUrlAnchorSelection,
  saveSession,
  selectSessionAnchor,
  type StorageLike,
} from "./session";
import type { OrrerySourceIdentity } from "./session";

const source: OrrerySourceIdentity = {
  nodesSchemaVersion: "harmonic-orrery.nodes.v1",
  profileRegistryReleaseId: "canonical-feature-profile-registry:0.1.1",
  harmonicDescriptorReleaseId: "harmonic-compression-candidate:CH_A012_q_v1:1.0.0",
  harmonicDescriptorFingerprint: "a".repeat(64),
};
const anchors = new Set([1, 2, 3]);

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

describe("Harmonic Orrery session", () => {
  it("accepts one valid shared anchor and rejects malformed, duplicate, and unknown IDs", () => {
    expect(parseUrlAnchorSelection("?anchor=3", anchors)).toEqual({ kind: "selected", anchorId: 3 });
    expect(parseUrlAnchorSelection("", anchors)).toEqual({ kind: "absent" });
    expect(parseUrlAnchorSelection("?anchor=03", anchors).kind).toBe("invalid");
    expect(parseUrlAnchorSelection("?anchor=3&anchor=2", anchors).kind).toBe("invalid");
    expect(parseUrlAnchorSelection("?anchor=999", anchors).kind).toBe("invalid");
    expect(parseUrlAnchorSelection("?anchor=9007199254740992", anchors).kind).toBe("invalid");
  });

  it("persists deterministic local selection and discovery state", () => {
    const storage = new MemoryStorage();
    const session = selectSessionAnchor(selectSessionAnchor(createSession(source), 3), 1);

    expect(session.visitedAnchorIds).toEqual([1, 3]);
    expect(saveSession(storage, session)).toBeUndefined();
    expect(loadSession(storage, source, anchors)).toEqual({ session });

    const serialized = storage.getItem(SESSION_STORAGE_KEY);
    expect(serialized).toContain(`"schemaVersion":"${SESSION_SCHEMA_VERSION}"`);
    expect(serialized).toContain('"visitedAnchorIds":[1,3]');
  });

  it("clears selection without losing visited local discovery state", () => {
    const session = selectSessionAnchor(createSession(source), 2);

    expect(clearSessionSelection(session)).toMatchObject({
      selectedAnchorId: null,
      visitedAnchorIds: [2],
      courtPresentationPosition: null,
    });
  });

  it("discards malformed, unsupported, and stale saved documents", () => {
    const storage = new MemoryStorage();
    storage.setItem(SESSION_STORAGE_KEY, "not json");
    expect(loadSession(storage, source, anchors).notice).toContain("invalid");
    expect(storage.getItem(SESSION_STORAGE_KEY)).toBeNull();

    storage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({
        ...createSession(source),
        schemaVersion: "harmonic-orrery.session.v0",
      }),
    );
    expect(loadSession(storage, source, anchors).notice).toContain("invalid");

    storage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({
        ...createSession({ ...source, profileRegistryReleaseId: "canonical-feature-profile-registry:0.1.0" }),
      }),
    );
    expect(loadSession(storage, source, anchors).notice).toContain("different projection release");

    storage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({
        ...createSession({ ...source, harmonicDescriptorFingerprint: "b".repeat(64) }),
      }),
    );
    expect(loadSession(storage, source, anchors).notice).toContain("different projection release");

    storage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({
        ...selectSessionAnchor(createSession(source), 3),
        visitedAnchorIds: [3, 3],
      }),
    );
    expect(loadSession(storage, source, anchors).notice).toContain("invalid");

    storage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ ...createSession(source), unexpected: true }),
    );
    expect(loadSession(storage, source, anchors).notice).toContain("invalid");
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

    expect(loadSession(unavailable, source, anchors).notice).toContain("unavailable");
    expect(saveSession(unavailable, createSession(source))).toContain("could not be saved");
  });
});
