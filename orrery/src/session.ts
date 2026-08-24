import type { NodesResponse } from "./types";

export const SESSION_STORAGE_KEY = "seven-governors.harmonic-orrery.session";
export const SESSION_SCHEMA_VERSION = "harmonic-orrery.session.v1";

const MAX_SESSION_BYTES = 4096;

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface OrrerySourceIdentity {
  nodesSchemaVersion: NodesResponse["schemaVersion"];
  profileRegistryReleaseId: string;
  harmonicDescriptorReleaseId: NodesResponse["harmonicDescriptor"]["releaseId"];
  harmonicDescriptorFingerprint: string;
}

export interface OrrerySession {
  schemaVersion: typeof SESSION_SCHEMA_VERSION;
  source: OrrerySourceIdentity;
  selectedAnchorId: number | null;
  visitedAnchorIds: number[];
  courtPresentationPosition: null;
}

export type UrlAnchorSelection =
  | { kind: "absent" }
  | { kind: "selected"; anchorId: number }
  | { kind: "invalid"; message: string };

export interface LoadedSession {
  session: OrrerySession | null;
  notice?: string;
}

type JsonRecord = Record<string, unknown>;

function record(value: unknown, context: string): JsonRecord {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${context} must be an object`);
  }

  return value as JsonRecord;
}

function exactKeys(value: JsonRecord, expected: string[], context: string): void {
  const actual = Object.keys(value).sort();
  const sortedExpected = [...expected].sort();
  if (actual.length !== sortedExpected.length || actual.some((key, index) => key !== sortedExpected[index])) {
    throw new Error(`${context} has unexpected fields`);
  }
}

function safeAnchorId(value: unknown, context: string, validAnchorIds: ReadonlySet<number>): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || !validAnchorIds.has(value)) {
    throw new Error(`${context} must reference an anchor in the current projection`);
  }

  return value;
}

function sourceIdentity(value: unknown): OrrerySourceIdentity {
  const source = record(value, "session.source");
  exactKeys(
    source,
    [
      "nodesSchemaVersion",
      "profileRegistryReleaseId",
      "harmonicDescriptorReleaseId",
      "harmonicDescriptorFingerprint",
    ],
    "session.source",
  );

  const nodesSchemaVersion = source.nodesSchemaVersion;
  const profileRegistryReleaseId = source.profileRegistryReleaseId;
  const harmonicDescriptorReleaseId = source.harmonicDescriptorReleaseId;
  const harmonicDescriptorFingerprint = source.harmonicDescriptorFingerprint;
  if (
    nodesSchemaVersion !== "harmonic-orrery.nodes.v1" ||
    typeof profileRegistryReleaseId !== "string" ||
    profileRegistryReleaseId.length === 0 ||
    typeof harmonicDescriptorReleaseId !== "string" ||
    harmonicDescriptorReleaseId !== "harmonic-compression-candidate:CH_A012_q_v1:1.0.0" ||
    typeof harmonicDescriptorFingerprint !== "string" ||
    !/^[a-f0-9]{64}$/.test(harmonicDescriptorFingerprint)
  ) {
    throw new Error("session.source is invalid");
  }

  return {
    nodesSchemaVersion,
    profileRegistryReleaseId,
    harmonicDescriptorReleaseId,
    harmonicDescriptorFingerprint,
  };
}

function parseSession(value: unknown, validAnchorIds: ReadonlySet<number>): OrrerySession {
  const session = record(value, "session");
  exactKeys(
    session,
    ["schemaVersion", "source", "selectedAnchorId", "visitedAnchorIds", "courtPresentationPosition"],
    "session",
  );
  if (session.schemaVersion !== SESSION_SCHEMA_VERSION) {
    throw new Error("session schema version is unsupported");
  }
  if (session.courtPresentationPosition !== null) {
    throw new Error("session Court presentation must remain unset");
  }
  if (!Array.isArray(session.visitedAnchorIds)) {
    throw new Error("session.visitedAnchorIds must be an array");
  }

  const visited = session.visitedAnchorIds.map((id, index) =>
    safeAnchorId(id, `session.visitedAnchorIds[${index}]`, validAnchorIds),
  );
  if (new Set(visited).size !== visited.length) {
    throw new Error("session.visitedAnchorIds must not contain duplicates");
  }

  const selectedAnchorId =
    session.selectedAnchorId === null
      ? null
      : safeAnchorId(session.selectedAnchorId, "session.selectedAnchorId", validAnchorIds);
  if (selectedAnchorId !== null && !visited.includes(selectedAnchorId)) {
    throw new Error("session.selectedAnchorId must be visited");
  }

  return {
    schemaVersion: SESSION_SCHEMA_VERSION,
    source: sourceIdentity(session.source),
    selectedAnchorId,
    visitedAnchorIds: visited.sort((left, right) => left - right),
    courtPresentationPosition: null,
  };
}

function sourceMatches(left: OrrerySourceIdentity, right: OrrerySourceIdentity): boolean {
  return (
    left.nodesSchemaVersion === right.nodesSchemaVersion &&
    left.profileRegistryReleaseId === right.profileRegistryReleaseId &&
    left.harmonicDescriptorReleaseId === right.harmonicDescriptorReleaseId &&
    left.harmonicDescriptorFingerprint === right.harmonicDescriptorFingerprint
  );
}

function discardSession(storage: StorageLike, notice: string): LoadedSession {
  try {
    storage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    return { session: null, notice: "Local progress could not be reset in this browser." };
  }

  return { session: null, notice };
}

export function sourceFromResponse(response: NodesResponse): OrrerySourceIdentity {
  return {
    nodesSchemaVersion: response.schemaVersion,
    profileRegistryReleaseId: response.profileRegistryReleaseId,
    harmonicDescriptorReleaseId: response.harmonicDescriptor.releaseId,
    harmonicDescriptorFingerprint: response.harmonicDescriptor.candidateFingerprint,
  };
}

export function createSession(source: OrrerySourceIdentity): OrrerySession {
  return {
    schemaVersion: SESSION_SCHEMA_VERSION,
    source,
    selectedAnchorId: null,
    visitedAnchorIds: [],
    courtPresentationPosition: null,
  };
}

export function parseUrlAnchorSelection(
  search: string,
  validAnchorIds: ReadonlySet<number>,
): UrlAnchorSelection {
  const values = new URLSearchParams(search).getAll("anchor");
  if (values.length === 0) {
    return { kind: "absent" };
  }
  if (values.length !== 1) {
    return { kind: "invalid", message: "The shared anchor link contains more than one anchor ID." };
  }

  const [value] = values;
  if (!/^(?:0|[1-9]\d*)$/.test(value)) {
    return { kind: "invalid", message: "The shared anchor ID is not a canonical whole number." };
  }

  const anchorId = Number(value);
  if (!Number.isSafeInteger(anchorId) || !validAnchorIds.has(anchorId)) {
    return { kind: "invalid", message: "The shared anchor is not present in this live projection." };
  }

  return { kind: "selected", anchorId };
}

export function selectSessionAnchor(session: OrrerySession, anchorId: number): OrrerySession {
  return {
    ...session,
    selectedAnchorId: anchorId,
    visitedAnchorIds: [...new Set([...session.visitedAnchorIds, anchorId])].sort((left, right) => left - right),
  };
}

export function clearSessionSelection(session: OrrerySession): OrrerySession {
  return { ...session, selectedAnchorId: null };
}

export function loadSession(
  storage: StorageLike | undefined,
  source: OrrerySourceIdentity,
  validAnchorIds: ReadonlySet<number>,
): LoadedSession {
  if (!storage) {
    return { session: null, notice: "Local progress is unavailable in this browser." };
  }

  let raw: string | null;
  try {
    raw = storage.getItem(SESSION_STORAGE_KEY);
  } catch {
    return { session: null, notice: "Local progress is unavailable in this browser." };
  }

  if (raw === null) {
    return { session: null };
  }
  if (raw.length > MAX_SESSION_BYTES) {
    return discardSession(storage, "Saved local progress was too large and has been reset.");
  }

  let parsed: OrrerySession;
  try {
    parsed = parseSession(JSON.parse(raw), validAnchorIds);
  } catch {
    return discardSession(storage, "Saved local progress was invalid and has been reset.");
  }

  if (!sourceMatches(parsed.source, source)) {
    return discardSession(storage, "Saved local progress belonged to a different projection release and has been reset.");
  }

  return { session: parsed };
}

export function saveSession(storage: StorageLike | undefined, session: OrrerySession): string | undefined {
  if (!storage) {
    return "Local progress is unavailable in this browser.";
  }

  try {
    storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {
    return "Local progress could not be saved in this browser.";
  }

  return undefined;
}
