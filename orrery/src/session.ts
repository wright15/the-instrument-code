import { isAdjacentCourtPosition, isCourtPosition, type CourtPosition } from "./court";
import type { LegalMoveCatalogIdentity } from "./moves";
import type { NodesResponse } from "./types";

export const SESSION_STORAGE_KEY = "seven-governors.harmonic-orrery.session";
export const SESSION_SCHEMA_VERSION = "harmonic-orrery.session.v3";
const LEGACY_SESSION_SCHEMA_VERSION = "harmonic-orrery.session.v1";
const PREVIOUS_SESSION_SCHEMA_VERSION = "harmonic-orrery.session.v2";

const MAX_SESSION_BYTES = 4096;
const MAX_MODAL_ROUTE_STEPS = 32;
const MAX_COURT_ROUTE_POSITIONS = 33;
const MAX_COMPLETED_OBJECTIVES = 8;

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface OrrerySourceIdentity extends LegalMoveCatalogIdentity {
  nodesSchemaVersion: NodesResponse["schemaVersion"];
  profileRegistryReleaseId: string;
  harmonicDescriptorReleaseId: NodesResponse["harmonicDescriptor"]["releaseId"];
  harmonicDescriptorFingerprint: string;
}

export interface SessionLegalMove {
  id: string;
  sourceId: number;
  targetId: number;
}

export interface ModalRoute {
  startAnchorId: number | null;
  currentAnchorId: number | null;
  moveIds: string[];
}

export interface OrrerySession {
  schemaVersion: typeof SESSION_SCHEMA_VERSION;
  source: OrrerySourceIdentity;
  selectedAnchorId: number | null;
  visitedAnchorIds: number[];
  courtPresentationPosition: CourtPosition;
  modalRoute: ModalRoute;
  selectedLegalMoveId: string | null;
  courtRouteHistory: CourtPosition[];
  completedObjectiveIds: string[];
}

export type UrlAnchorSelection =
  | { kind: "absent" }
  | { kind: "selected"; anchorId: number }
  | { kind: "invalid"; message: string };

export interface LoadedSession {
  session: OrrerySession | null;
  notice?: string;
}

export type LegalMoveSelectionResult =
  | { kind: "selected"; session: OrrerySession }
  | { kind: "invalid"; message: string };

export type LegalMoveApplicationResult =
  | { kind: "applied"; session: OrrerySession; move: SessionLegalMove }
  | { kind: "invalid"; message: string };

type JsonRecord = Record<string, unknown>;

function record(value: unknown, context: string): JsonRecord {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${context} must be an object`);
  }

  return value as JsonRecord;
}

function exactKeys(value: JsonRecord, expected: readonly string[], context: string): void {
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

function fingerprint(value: unknown, context: string): string {
  if (typeof value !== "string" || !/^[a-f0-9]{64}$/.test(value)) {
    throw new Error(`${context} must be a SHA-256 fingerprint`);
  }

  return value;
}

function baseSourceIdentity(value: unknown, version: string): Omit<OrrerySourceIdentity, keyof LegalMoveCatalogIdentity> {
  const source = record(value, "session.source");
  const expected = [
    "nodesSchemaVersion",
    "profileRegistryReleaseId",
    "harmonicDescriptorReleaseId",
    "harmonicDescriptorFingerprint",
  ];
  if (version === SESSION_SCHEMA_VERSION) {
    expected.push("legalMoveCatalogSchemaVersion", "legalMoveCatalogFingerprint");
  }
  exactKeys(source, expected, "session.source");

  const nodesSchemaVersion = source.nodesSchemaVersion;
  const profileRegistryReleaseId = source.profileRegistryReleaseId;
  const harmonicDescriptorReleaseId = source.harmonicDescriptorReleaseId;
  if (
    nodesSchemaVersion !== "harmonic-orrery.nodes.v1" ||
    typeof profileRegistryReleaseId !== "string" ||
    profileRegistryReleaseId.length === 0 ||
    harmonicDescriptorReleaseId !== "harmonic-compression-candidate:CH_A012_q_v1:1.0.0"
  ) {
    throw new Error("session.source is invalid");
  }

  return {
    nodesSchemaVersion,
    profileRegistryReleaseId,
    harmonicDescriptorReleaseId,
    harmonicDescriptorFingerprint: fingerprint(source.harmonicDescriptorFingerprint, "session.source.harmonicDescriptorFingerprint"),
  };
}

function sourceIdentity(value: unknown, version: string, currentSource: OrrerySourceIdentity): OrrerySourceIdentity {
  const base = baseSourceIdentity(value, version);
  if (version !== SESSION_SCHEMA_VERSION) {
    return {
      ...base,
      legalMoveCatalogSchemaVersion: currentSource.legalMoveCatalogSchemaVersion,
      legalMoveCatalogFingerprint: currentSource.legalMoveCatalogFingerprint,
    };
  }

  const source = record(value, "session.source");
  if (
    source.legalMoveCatalogSchemaVersion !== "harmonic-orrery.legal-moves.v1" ||
    typeof source.legalMoveCatalogFingerprint !== "string"
  ) {
    throw new Error("session.source legal-move catalog identity is invalid");
  }

  return {
    ...base,
    legalMoveCatalogSchemaVersion: "harmonic-orrery.legal-moves.v1",
    legalMoveCatalogFingerprint: fingerprint(source.legalMoveCatalogFingerprint, "session.source.legalMoveCatalogFingerprint"),
  };
}

function currentCourtPresentationPosition(value: unknown): CourtPosition {
  if (!isCourtPosition(value)) {
    throw new Error("session Court presentation must be a canonical Court position");
  }
  return value;
}

function legacyCourtPresentationPosition(value: unknown): CourtPosition {
  if (value !== null) {
    throw new Error("legacy session Court presentation must remain unset");
  }
  return "C0";
}

function modalRoute(
  value: unknown,
  validAnchorIds: ReadonlySet<number>,
  legalMoves: ReadonlyMap<string, SessionLegalMove>,
): ModalRoute {
  const route = record(value, "session.modalRoute");
  exactKeys(route, ["startAnchorId", "currentAnchorId", "moveIds"], "session.modalRoute");
  if (!Array.isArray(route.moveIds) || route.moveIds.length > MAX_MODAL_ROUTE_STEPS) {
    throw new Error("session.modalRoute.moveIds exceeds the local route limit");
  }

  const startAnchorId =
    route.startAnchorId === null
      ? null
      : safeAnchorId(route.startAnchorId, "session.modalRoute.startAnchorId", validAnchorIds);
  const currentAnchorId =
    route.currentAnchorId === null
      ? null
      : safeAnchorId(route.currentAnchorId, "session.modalRoute.currentAnchorId", validAnchorIds);
  const moveIds = route.moveIds.map((moveId, index) => {
    if (typeof moveId !== "string" || !legalMoves.has(moveId)) {
      throw new Error(`session.modalRoute.moveIds[${index}] is not in the current legal-move catalog`);
    }
    return moveId;
  });

  if (startAnchorId === null || currentAnchorId === null) {
    if (startAnchorId !== null || currentAnchorId !== null || moveIds.length !== 0) {
      throw new Error("session.modalRoute must be fully unset before a route starts");
    }
    return { startAnchorId: null, currentAnchorId: null, moveIds: [] };
  }

  let expectedSourceId = startAnchorId;
  for (const moveId of moveIds) {
    const move = legalMoves.get(moveId);
    if (!move || move.sourceId !== expectedSourceId) {
      throw new Error("session.modalRoute is not a contiguous sequence of legal moves");
    }
    expectedSourceId = move.targetId;
  }
  if (currentAnchorId !== expectedSourceId) {
    throw new Error("session.modalRoute current anchor does not match its recorded route");
  }

  return { startAnchorId, currentAnchorId, moveIds };
}

function courtRouteHistory(value: unknown, courtPresentationPosition: CourtPosition): CourtPosition[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_COURT_ROUTE_POSITIONS) {
    throw new Error("session.courtRouteHistory exceeds the local route limit");
  }
  const history = value.map((position, index) => {
    if (!isCourtPosition(position)) {
      throw new Error(`session.courtRouteHistory[${index}] must be a canonical Court position`);
    }
    return position;
  });
  if (history[history.length - 1] !== courtPresentationPosition) {
    throw new Error("session.courtRouteHistory must end at the current Court position");
  }
  for (let index = 1; index < history.length; index += 1) {
    if (!isAdjacentCourtPosition(history[index - 1], history[index])) {
      throw new Error("session.courtRouteHistory must contain only adjacent Court steps");
    }
  }
  return history;
}

function completedObjectiveIds(value: unknown, validObjectiveIds: ReadonlySet<string>): string[] {
  if (!Array.isArray(value) || value.length > MAX_COMPLETED_OBJECTIVES) {
    throw new Error("session.completedObjectiveIds exceeds the local objective limit");
  }
  const objectiveIds = value.map((objectiveId, index) => {
    if (typeof objectiveId !== "string" || !validObjectiveIds.has(objectiveId)) {
      throw new Error(`session.completedObjectiveIds[${index}] is not a supported local objective`);
    }
    return objectiveId;
  });
  if (new Set(objectiveIds).size !== objectiveIds.length) {
    throw new Error("session.completedObjectiveIds must not contain duplicates");
  }
  return objectiveIds.sort();
}

function parseSession(
  value: unknown,
  validAnchorIds: ReadonlySet<number>,
  legalMoves: ReadonlyMap<string, SessionLegalMove>,
  validObjectiveIds: ReadonlySet<string>,
  currentSource: OrrerySourceIdentity,
): OrrerySession {
  const session = record(value, "session");
  const schemaVersion = session.schemaVersion;
  if (
    schemaVersion !== SESSION_SCHEMA_VERSION &&
    schemaVersion !== PREVIOUS_SESSION_SCHEMA_VERSION &&
    schemaVersion !== LEGACY_SESSION_SCHEMA_VERSION
  ) {
    throw new Error("session schema version is unsupported");
  }
  const isCurrent = schemaVersion === SESSION_SCHEMA_VERSION;
  exactKeys(
    session,
    isCurrent
      ? [
          "schemaVersion",
          "source",
          "selectedAnchorId",
          "visitedAnchorIds",
          "courtPresentationPosition",
          "modalRoute",
          "selectedLegalMoveId",
          "courtRouteHistory",
          "completedObjectiveIds",
        ]
      : ["schemaVersion", "source", "selectedAnchorId", "visitedAnchorIds", "courtPresentationPosition"],
    "session",
  );

  if (!Array.isArray(session.visitedAnchorIds)) {
    throw new Error("session.visitedAnchorIds must be an array");
  }
  const visitedAnchorIds = session.visitedAnchorIds.map((anchorId, index) =>
    safeAnchorId(anchorId, `session.visitedAnchorIds[${index}]`, validAnchorIds),
  );
  if (new Set(visitedAnchorIds).size !== visitedAnchorIds.length) {
    throw new Error("session.visitedAnchorIds must not contain duplicates");
  }

  const selectedAnchorId =
    session.selectedAnchorId === null
      ? null
      : safeAnchorId(session.selectedAnchorId, "session.selectedAnchorId", validAnchorIds);
  if (selectedAnchorId !== null && !visitedAnchorIds.includes(selectedAnchorId)) {
    throw new Error("session.selectedAnchorId must be visited");
  }

  const courtPresentationPosition =
    schemaVersion === LEGACY_SESSION_SCHEMA_VERSION
      ? legacyCourtPresentationPosition(session.courtPresentationPosition)
      : currentCourtPresentationPosition(session.courtPresentationPosition);
  const parsedRoute = isCurrent
    ? modalRoute(session.modalRoute, validAnchorIds, legalMoves)
    : { startAnchorId: null, currentAnchorId: null, moveIds: [] };
  const selectedLegalMoveId = isCurrent ? session.selectedLegalMoveId : null;
  if (selectedLegalMoveId !== null && typeof selectedLegalMoveId !== "string") {
    throw new Error("session.selectedLegalMoveId must be a legal move ID or null");
  }
  if (selectedLegalMoveId !== null) {
    const selectedMove = legalMoves.get(selectedLegalMoveId);
    if (
      !selectedMove ||
      parsedRoute.currentAnchorId === null ||
      selectedMove.sourceId !== parsedRoute.currentAnchorId ||
      selectedAnchorId !== parsedRoute.currentAnchorId
    ) {
      throw new Error("session.selectedLegalMoveId does not apply to the active local route");
    }
  }

  return {
    schemaVersion: SESSION_SCHEMA_VERSION,
    source: sourceIdentity(session.source, schemaVersion, currentSource),
    selectedAnchorId,
    visitedAnchorIds: [...visitedAnchorIds].sort((left, right) => left - right),
    courtPresentationPosition,
    modalRoute: parsedRoute,
    selectedLegalMoveId,
    courtRouteHistory: isCurrent ? courtRouteHistory(session.courtRouteHistory, courtPresentationPosition) : [courtPresentationPosition],
    completedObjectiveIds: isCurrent ? completedObjectiveIds(session.completedObjectiveIds, validObjectiveIds) : [],
  };
}

function sourceMatches(left: OrrerySourceIdentity, right: OrrerySourceIdentity): boolean {
  return (
    left.nodesSchemaVersion === right.nodesSchemaVersion &&
    left.profileRegistryReleaseId === right.profileRegistryReleaseId &&
    left.harmonicDescriptorReleaseId === right.harmonicDescriptorReleaseId &&
    left.harmonicDescriptorFingerprint === right.harmonicDescriptorFingerprint &&
    left.legalMoveCatalogSchemaVersion === right.legalMoveCatalogSchemaVersion &&
    left.legalMoveCatalogFingerprint === right.legalMoveCatalogFingerprint
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

export function sourceFromResponse(
  response: NodesResponse,
  catalog: LegalMoveCatalogIdentity,
): OrrerySourceIdentity {
  return {
    nodesSchemaVersion: response.schemaVersion,
    profileRegistryReleaseId: response.profileRegistryReleaseId,
    harmonicDescriptorReleaseId: response.harmonicDescriptor.releaseId,
    harmonicDescriptorFingerprint: response.harmonicDescriptor.candidateFingerprint,
    legalMoveCatalogSchemaVersion: catalog.legalMoveCatalogSchemaVersion,
    legalMoveCatalogFingerprint: catalog.legalMoveCatalogFingerprint,
  };
}

export function createSession(source: OrrerySourceIdentity): OrrerySession {
  return {
    schemaVersion: SESSION_SCHEMA_VERSION,
    source,
    selectedAnchorId: null,
    visitedAnchorIds: [],
    courtPresentationPosition: "C0",
    modalRoute: { startAnchorId: null, currentAnchorId: null, moveIds: [] },
    selectedLegalMoveId: null,
    courtRouteHistory: ["C0"],
    completedObjectiveIds: [],
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
    selectedLegalMoveId: null,
    visitedAnchorIds: [...new Set([...session.visitedAnchorIds, anchorId])].sort((left, right) => left - right),
  };
}

export function clearSessionSelection(session: OrrerySession): OrrerySession {
  return { ...session, selectedAnchorId: null, selectedLegalMoveId: null };
}

export function startSessionRoute(session: OrrerySession, anchorId: number): OrrerySession {
  return {
    ...session,
    selectedAnchorId: anchorId,
    selectedLegalMoveId: null,
    visitedAnchorIds: [...new Set([...session.visitedAnchorIds, anchorId])].sort((left, right) => left - right),
    modalRoute: { startAnchorId: anchorId, currentAnchorId: anchorId, moveIds: [] },
  };
}

export function clearSessionRoute(session: OrrerySession): OrrerySession {
  return {
    ...session,
    selectedLegalMoveId: null,
    modalRoute: { startAnchorId: null, currentAnchorId: null, moveIds: [] },
  };
}

export function selectSessionLegalMove(
  session: OrrerySession,
  move: SessionLegalMove,
  legalMoves: ReadonlyMap<string, SessionLegalMove>,
): LegalMoveSelectionResult {
  if (session.modalRoute.currentAnchorId === null) {
    return { kind: "invalid", message: "Start a local route before selecting a legal move." };
  }
  if (session.selectedAnchorId !== session.modalRoute.currentAnchorId) {
    return {
      kind: "invalid",
      message: "The inspected anchor is not the active local route position. Resume or restart the route first.",
    };
  }
  if (move.sourceId !== session.modalRoute.currentAnchorId) {
    return { kind: "invalid", message: "That modal move is not offered from the active local route position." };
  }
  const catalogMove = legalMoves.get(move.id);
  if (
    !catalogMove ||
    catalogMove.sourceId !== move.sourceId ||
    catalogMove.targetId !== move.targetId
  ) {
    return { kind: "invalid", message: "That move is not present in the current legal-move catalog." };
  }

  return { kind: "selected", session: { ...session, selectedLegalMoveId: move.id } };
}

export function applySessionLegalMove(
  session: OrrerySession,
  legalMoves: ReadonlyMap<string, SessionLegalMove>,
): LegalMoveApplicationResult {
  if (session.selectedLegalMoveId === null) {
    return { kind: "invalid", message: "Select an offered legal move before applying it." };
  }
  if (session.modalRoute.currentAnchorId === null || session.selectedAnchorId !== session.modalRoute.currentAnchorId) {
    return { kind: "invalid", message: "The selected move no longer matches the active local route." };
  }
  if (session.modalRoute.moveIds.length >= MAX_MODAL_ROUTE_STEPS) {
    return { kind: "invalid", message: "The local route history is full. Start a new route to continue." };
  }

  const move = legalMoves.get(session.selectedLegalMoveId);
  if (!move || move.sourceId !== session.modalRoute.currentAnchorId) {
    return { kind: "invalid", message: "The selected move is unavailable from the active local route position." };
  }

  return {
    kind: "applied",
    move,
    session: {
      ...session,
      selectedAnchorId: move.targetId,
      selectedLegalMoveId: null,
      visitedAnchorIds: [...new Set([...session.visitedAnchorIds, move.targetId])].sort((left, right) => left - right),
      modalRoute: {
        startAnchorId: session.modalRoute.startAnchorId,
        currentAnchorId: move.targetId,
        moveIds: [...session.modalRoute.moveIds, move.id],
      },
    },
  };
}

export function selectSessionCourtPosition(
  session: OrrerySession,
  courtPresentationPosition: CourtPosition,
): OrrerySession {
  if (!isAdjacentCourtPosition(session.courtPresentationPosition, courtPresentationPosition)) {
    throw new Error("Court presentation positions must be adjacent.");
  }
  return {
    ...session,
    courtPresentationPosition,
    courtRouteHistory: [...session.courtRouteHistory, courtPresentationPosition].slice(-MAX_COURT_ROUTE_POSITIONS),
  };
}

export function markSessionObjectivesCompleted(
  session: OrrerySession,
  objectiveIds: readonly string[],
  validObjectiveIds: ReadonlySet<string>,
): OrrerySession {
  const completed = new Set(session.completedObjectiveIds);
  for (const objectiveId of completed) {
    if (!validObjectiveIds.has(objectiveId)) {
      throw new Error("Saved local objective completion is unsupported.");
    }
  }
  for (const objectiveId of objectiveIds) {
    if (!validObjectiveIds.has(objectiveId)) {
      throw new Error("Local objective completion is unsupported.");
    }
    completed.add(objectiveId);
  }
  if (completed.size > Math.min(MAX_COMPLETED_OBJECTIVES, validObjectiveIds.size)) {
    throw new Error("Local objective completion limit exceeded.");
  }
  return { ...session, completedObjectiveIds: [...completed].sort() };
}

export function loadSession(
  storage: StorageLike | undefined,
  source: OrrerySourceIdentity,
  validAnchorIds: ReadonlySet<number>,
  legalMoves: ReadonlyMap<string, SessionLegalMove>,
  validObjectiveIds: ReadonlySet<string>,
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
  let migratedLegacySession = false;
  try {
    const document = JSON.parse(raw);
    const documentVersion = record(document, "session").schemaVersion;
    migratedLegacySession = documentVersion !== SESSION_SCHEMA_VERSION;
    parsed = parseSession(document, validAnchorIds, legalMoves, validObjectiveIds, source);
  } catch {
    return discardSession(storage, "Saved local progress was invalid and has been reset.");
  }

  if (!sourceMatches(parsed.source, source)) {
    return discardSession(storage, "Saved local progress belonged to a different projection release and has been reset.");
  }

  if (migratedLegacySession) {
    const notice = saveSession(storage, parsed);
    return notice ? { session: parsed, notice } : { session: parsed };
  }

  return { session: parsed };
}

export function saveSession(storage: StorageLike | undefined, session: OrrerySession): string | undefined {
  if (!storage) {
    return "Local progress is unavailable in this browser.";
  }

  const serialized = JSON.stringify(session);
  if (serialized.length > MAX_SESSION_BYTES) {
    return "Local progress was too large to save in this browser.";
  }

  try {
    storage.setItem(SESSION_STORAGE_KEY, serialized);
  } catch {
    return "Local progress could not be saved in this browser.";
  }

  return undefined;
}
