import { fetchNodes, ProjectionCompatibilityError } from "./api";
import {
  OrreryAudioEngine,
  formatPitchClasses,
  isAudioSourceCompatible,
  type AudioEngineState,
  type AudioSelection,
} from "./audio";
import {
  COURT_POLE_ORDER,
  COURT_POSITIONS,
  courtPositionById,
  formatCourtRatio,
  isAdjacentCourtPosition,
  type CourtPosition,
} from "./court";
import { createOrreryScene, type OrreryScene } from "./scene";
import {
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
  sourceFromResponse,
  type OrrerySession,
  type StorageLike,
} from "./session";
import {
  LEGAL_MOVE_CATALOG,
  catalogIdentity,
  createLegalMoveCatalogIndex,
  legalMovesForSource,
  type LegalMove,
  type LegalMoveCatalogIndex,
} from "./moves";
import { LOCAL_OBJECTIVE_IDS, newlyCompletedObjectiveIds, scoreObjectives } from "./objectives";
import { GOVERNOR_META, TIERS, TIER_META, formatRatio, type OrreryNode } from "./types";
import "./style.css";

function requiredElement<Element extends HTMLElement>(selector: string): Element {
  const element = document.querySelector<Element>(selector);
  if (!element) {
    throw new Error(`The Harmonic Orrery document is missing ${selector}`);
  }
  return element;
}

const canvas = requiredElement<HTMLCanvasElement>("#orrery-canvas");
const labelRoot = requiredElement<HTMLElement>("#anchor-labels");
const apiStatus = requiredElement<HTMLElement>("#api-status");
const sceneMessage = requiredElement<HTMLElement>("#scene-message");
const sceneCount = requiredElement<HTMLElement>("#scene-count");
const indexCount = requiredElement<HTMLElement>("#index-count");
const anchorList = requiredElement<HTMLElement>("#anchor-list");
const inspectorHeading = requiredElement<HTMLElement>("#inspector-heading");
const selectedIdentity = requiredElement<HTMLElement>("#selected-identity");
const selectedGovernor = requiredElement<HTMLElement>("#selected-governor");
const selectedTier = requiredElement<HTMLElement>("#selected-tier");
const selectedWavelength = requiredElement<HTMLElement>("#selected-wavelength");
const selectedPhotonicCompression = requiredElement<HTMLElement>("#selected-photonic-compression");
const selectedWeight = requiredElement<HTMLElement>("#selected-weight");
const selectedProfile = requiredElement<HTMLElement>("#selected-profile");
const selectedLandforms = requiredElement<HTMLUListElement>("#selected-landforms");
const selectedAudioPalette = requiredElement<HTMLElement>("#selected-audio-palette");
const selectedAudioNote = requiredElement<HTMLElement>("#selected-audio-note");
const selectedCourtFilter = requiredElement<HTMLElement>("#selected-court-filter");
const sessionSelected = requiredElement<HTMLElement>("#session-selected");
const sessionVisited = requiredElement<HTMLElement>("#session-visited");
const sessionCourt = requiredElement<HTMLElement>("#session-court");
const sessionApiHealth = requiredElement<HTMLElement>("#session-api-health");
const sessionMessage = requiredElement<HTMLElement>("#session-message");
const clearLinkSelectionButton = requiredElement<HTMLButtonElement>("#clear-link-selection");
const reloadProjectionButton = requiredElement<HTMLButtonElement>("#reload-projection");
const moveStatus = requiredElement<HTMLElement>("#move-status");
const moveRoutePosition = requiredElement<HTMLElement>("#move-route-position");
const moveInspectedAnchor = requiredElement<HTMLElement>("#move-inspected-anchor");
const moveProvenance = requiredElement<HTMLElement>("#move-provenance");
const legalMoveList = requiredElement<HTMLElement>("#legal-move-list");
const routeHistory = requiredElement<HTMLOListElement>("#route-history");
const objectiveList = requiredElement<HTMLElement>("#objective-list");
const startRouteButton = requiredElement<HTMLButtonElement>("#start-route");
const resumeRouteButton = requiredElement<HTMLButtonElement>("#resume-route");
const clearRouteButton = requiredElement<HTMLButtonElement>("#clear-route");
const applyLegalMoveButton = requiredElement<HTMLButtonElement>("#apply-legal-move");
const audioEnableButton = requiredElement<HTMLButtonElement>("#audio-enable");
const audioPauseButton = requiredElement<HTMLButtonElement>("#audio-pause");
const audioMuteButton = requiredElement<HTMLButtonElement>("#audio-mute");
const audioVolume = requiredElement<HTMLInputElement>("#audio-volume");
const audioVolumeValue = requiredElement<HTMLOutputElement>("#audio-volume-value");
const audioVisualOnly = requiredElement<HTMLInputElement>("#audio-visual-only");
const audioPalette = requiredElement<HTMLElement>("#audio-palette");
const audioStatus = requiredElement<HTMLElement>("#audio-status");
const courtControls = requiredElement<HTMLElement>("#court-controls");
const courtRouteStatus = requiredElement<HTMLElement>("#court-route-status");
const courtCurrent = requiredElement<HTMLElement>("#court-current");
const courtStrategy = requiredElement<HTMLElement>("#court-strategy");
const courtMask = requiredElement<HTMLElement>("#court-mask");
const courtPitchClasses = requiredElement<HTMLElement>("#court-pitch-classes");
const courtRatio = requiredElement<HTMLElement>("#court-ratio");
const courtPoles = requiredElement<HTMLElement>("#court-poles");
const courtMercury = requiredElement<HTMLElement>("#court-mercury");

let scene: OrreryScene | undefined;
let session: OrrerySession | undefined;
let progressStorage: StorageLike | undefined;
let nodesById = new Map<number, OrreryNode>();
let profileRegistryReleaseId: string | undefined;
let legalMoveCatalog: LegalMoveCatalogIndex | undefined;
let legalMoveCatalogNotice: string | undefined;
const anchorButtons = new Map<number, HTMLButtonElement>();
const courtButtons = new Map<CourtPosition, HTMLButtonElement>();
const audioEngine = new OrreryAudioEngine();
const localObjectiveIds = new Set<string>(LOCAL_OBJECTIVE_IDS);

function supportsWebGl(): boolean {
  try {
    const testCanvas = document.createElement("canvas");
    return Boolean(testCanvas.getContext("webgl2") || testCanvas.getContext("webgl"));
  } catch {
    return false;
  }
}

function showWebGlFallback(): void {
  canvas.hidden = true;
  sceneMessage.hidden = false;
  sceneMessage.textContent = "WebGL is unavailable. Use the keyboard-accessible anchor index to inspect the live projection.";
  sceneMessage.dataset.state = "notice";
}

function setApiHealth(text: string, state: "ready" | "error"): void {
  apiStatus.textContent = text;
  apiStatus.dataset.state = state;
  sessionApiHealth.textContent = text;
  sessionApiHealth.dataset.state = state;
}

function setSessionNotice(message?: string, action?: "clear-link" | "reload"): void {
  sessionMessage.hidden = message === undefined;
  sessionMessage.textContent = message ?? "";
  clearLinkSelectionButton.hidden = action !== "clear-link";
  reloadProjectionButton.hidden = action !== "reload";
}

function renderAudioState(state: AudioEngineState): void {
  const sourceCompatible =
    profileRegistryReleaseId !== undefined && isAudioSourceCompatible(profileRegistryReleaseId);
  const prepared = state.readiness === "ready" || state.readiness === "degraded";
  const enableUnavailable =
    !sourceCompatible ||
    state.visualOnly ||
    state.readiness === "loading" ||
    state.readiness === "unsupported" ||
    state.transport === "playing";

  audioEnableButton.disabled = enableUnavailable;
  audioEnableButton.textContent =
    state.readiness === "loading"
      ? "Preparing sound"
      : state.readiness === "degraded"
        ? "Retry loops & play"
        : "Enable & play sound";
  audioPauseButton.disabled = !prepared || state.visualOnly || state.transport === "stopped";
  audioPauseButton.textContent = state.transport === "playing" ? "Pause sound" : "Resume sound";
  audioMuteButton.disabled = !prepared || state.visualOnly;
  audioMuteButton.textContent = state.muted ? "Unmute sound" : "Mute sound";
  audioMuteButton.setAttribute("aria-pressed", String(state.muted));
  audioVolume.disabled = !prepared || state.visualOnly;
  audioVolume.value = String(state.volume);
  audioVolumeValue.value = `${Math.round(state.volume * 100)}%`;
  audioVisualOnly.checked = state.visualOnly;
  audioStatus.textContent = state.detail;
  audioStatus.dataset.state = state.readiness;
}

function renderAudioPalette(selection: AudioSelection): void {
  const sourcePitchClasses = formatPitchClasses(selection.palette.pitchClasses);
  const retainedPitchClasses = formatPitchClasses(selection.retainedPitchClasses);
  const suppressedPitchClasses = formatPitchClasses(selection.suppressedPitchClasses);
  const paletteLabel = `${selection.office} A0 / ${selection.palette.mode} / source ${sourcePitchClasses}`;
  selectedAudioPalette.textContent = paletteLabel;
  selectedAudioNote.textContent = selection.inheritedOfficePalette
    ? `${selection.selectedStateName} remains an ${selection.selectedTier} state; its authored sound inherits the ${selection.office} A0 palette.`
    : `${selection.selectedStateName} is the canonical A0 state for this authored palette.`;
  selectedCourtFilter.textContent = `Court ${selection.court.positionId} / ${selection.court.scaleName} / mask ${selection.court.pitchMask} retains ${retainedPitchClasses} and suppresses ${suppressedPitchClasses}.`;
  audioPalette.textContent = `Current voiced palette: ${selection.office} A0 / ${selection.palette.mode} / Court ${selection.court.positionId} ${retainedPitchClasses}`;
}

function showProjectionUnavailable(error: unknown): void {
  const detail = error instanceof Error ? error.message : "Unknown projection error";
  setApiHealth("Projection unavailable", "error");
  sceneMessage.hidden = false;
  sceneMessage.textContent = `The live anchor projection could not be loaded: ${detail}`;
  sceneMessage.dataset.state = "error";
  canvas.hidden = true;
  profileRegistryReleaseId = undefined;
  renderAudioState(audioEngine.snapshot());
  setSessionNotice("The live anchor projection is unavailable. Reload to try again.", "reload");
}

function showProjectionIncompatible(error: unknown): void {
  const detail = error instanceof Error ? error.message : "Unknown projection contract error";
  setApiHealth("Projection update required", "error");
  sceneMessage.hidden = false;
  sceneMessage.textContent = `This browser cannot safely read the live anchor projection: ${detail}`;
  sceneMessage.dataset.state = "error";
  canvas.hidden = true;
  profileRegistryReleaseId = undefined;
  renderAudioState(audioEngine.snapshot());
  setSessionNotice("The local app and projection releases are incompatible. Reload after they are updated together.", "reload");
}

function browserStorage(): StorageLike | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

function renderLandforms(landforms: string[]): void {
  selectedLandforms.replaceChildren(
    ...landforms.map((landform) => {
      const item = document.createElement("li");
      item.textContent = landform;
      return item;
    }),
  );
}

function clearInspector(): void {
  inspectorHeading.textContent = "Choose an anchor";
  selectedIdentity.textContent = "Select an anchor from the index or three-dimensional view.";
  selectedGovernor.textContent = "-";
  selectedGovernor.style.color = "";
  selectedTier.textContent = "-";
  selectedWavelength.textContent = "-";
  selectedPhotonicCompression.textContent = "-";
  selectedWeight.textContent = "-";
  selectedProfile.textContent = "-";

  const item = document.createElement("li");
  item.textContent = "Select an anchor to view its reference pool.";
  selectedLandforms.replaceChildren(item);
  selectedAudioPalette.textContent = "Select an anchor to inspect its office A0 palette.";
  selectedAudioNote.textContent = "Audio is an optional presentation layer.";
  selectedCourtFilter.textContent = "Select an anchor to inspect its local Court filter.";
  audioPalette.textContent = "Select an anchor to inspect its A0 office palette.";
}

function renderSessionHud(): void {
  const selectedNode =
    session?.selectedAnchorId === null || session?.selectedAnchorId === undefined
      ? undefined
      : nodesById.get(session.selectedAnchorId);
  sessionSelected.textContent = selectedNode
    ? `${selectedNode.state.name} / ${selectedNode.state.nodeId}`
    : "No anchor selected";
  sessionVisited.textContent = `${session?.visitedAnchorIds.length ?? 0} / ${nodesById.size} visited`;
  const court = session ? courtPositionById(session.courtPresentationPosition) : undefined;
  sessionCourt.textContent = court
    ? `${court.positionId} / ${court.scaleName} / local-only`
    : "Awaiting local session";
}

function setMoveStatus(message: string, state: "ready" | "notice" | "error" | "unavailable"): void {
  moveStatus.textContent = message;
  moveStatus.dataset.state = state;
}

function nodeLabel(node: OrreryNode | undefined): string {
  return node ? `${node.state.name} / ${node.state.nodeId}` : "No anchor";
}

function updateCompletedObjectives(): void {
  if (!session || !legalMoveCatalog) {
    return;
  }

  const progress = scoreObjectives(session, legalMoveCatalog, nodesById);
  const newlyCompleted = newlyCompletedObjectiveIds(progress).filter(
    (objectiveId) => !session?.completedObjectiveIds.includes(objectiveId),
  );
  if (newlyCompleted.length > 0) {
    session = markSessionObjectivesCompleted(session, newlyCompleted, localObjectiveIds);
  }
}

function renderRouteHistory(): void {
  if (!session || !legalMoveCatalog || session.modalRoute.moveIds.length === 0) {
    const item = document.createElement("li");
    item.textContent = "No local modal route recorded.";
    routeHistory.replaceChildren(item);
    return;
  }

  routeHistory.replaceChildren(
    ...session.modalRoute.moveIds.map((moveId) => {
      const move = legalMoveCatalog?.movesById.get(moveId);
      const item = document.createElement("li");
      if (!move) {
        item.textContent = `${moveId} is unavailable in this catalog.`;
        return item;
      }
      item.textContent = `${move.operatorId}: ${nodeLabel(nodesById.get(move.sourceId))} -> ${nodeLabel(nodesById.get(move.targetId))}`;
      return item;
    }),
  );
}

function renderObjectives(): void {
  if (!session || !legalMoveCatalog) {
    const item = document.createElement("p");
    item.textContent = "Local objectives are unavailable until the move catalog matches the live projection.";
    objectiveList.replaceChildren(item);
    return;
  }

  const objectives = scoreObjectives(session, legalMoveCatalog, nodesById);
  objectiveList.replaceChildren(
    ...objectives.map((objective) => {
      const item = document.createElement("article");
      item.className = "objective-card";
      item.dataset.objective = objective.id;
      item.dataset.state = objective.status;
      const title = document.createElement("strong");
      title.textContent = objective.title;
      const detail = document.createElement("p");
      detail.textContent = objective.detail;
      const progress = document.createElement("span");
      progress.textContent = objective.status === "completed" ? `Complete / ${objective.progress}` : objective.progress;
      item.append(title, detail, progress);
      return item;
    }),
  );
}

function renderLegalMoves(): void {
  if (!session || !legalMoveCatalog) {
    const message = document.createElement("p");
    message.textContent = "No source-backed modal move can be offered for this projection.";
    legalMoveList.replaceChildren(message);
    moveProvenance.textContent = "Catalog binding unavailable; no route result is inferred.";
    applyLegalMoveButton.disabled = true;
    return;
  }

  const routeAnchorId = session.modalRoute.currentAnchorId;
  if (routeAnchorId === null) {
    const message = document.createElement("p");
    message.textContent = "Start a local route at the inspected anchor to reveal its declared modal successor.";
    legalMoveList.replaceChildren(message);
    moveProvenance.textContent = "A route is local experience data. It does not alter the inspected anchor's canonical identity.";
    applyLegalMoveButton.disabled = true;
    return;
  }

  if (session.selectedAnchorId !== routeAnchorId) {
    const message = document.createElement("p");
    message.textContent = "The inspected anchor differs from the active route. Resume the route before selecting its next move.";
    legalMoveList.replaceChildren(message);
    moveProvenance.textContent = "Inspection is free exploration; only the active route can receive a local move.";
    applyLegalMoveButton.disabled = true;
    return;
  }

  const moves = legalMovesForSource(legalMoveCatalog, routeAnchorId);
  legalMoveList.replaceChildren(
    ...moves.map((move) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "legal-move-button";
      button.dataset.legalMoveId = move.id;
      const selected = session?.selectedLegalMoveId === move.id;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-pressed", String(selected));
      const operator = document.createElement("strong");
      operator.textContent = `${move.operatorId} / Modal successor`;
      const target = document.createElement("span");
      target.textContent = `Target: ${nodeLabel(nodesById.get(move.targetId))}`;
      const degree = document.createElement("small");
      degree.textContent = "Degree Governor: not declared for M";
      button.append(operator, target, degree);
      button.addEventListener("click", () => selectLegalMove(move));
      return button;
    }),
  );

  const selectedMove = session.selectedLegalMoveId
    ? legalMoveCatalog.movesById.get(session.selectedLegalMoveId)
    : undefined;
  const moveForProvenance = selectedMove ?? moves[0];
  moveProvenance.textContent = moveForProvenance
    ? `Provenance: ${moveForProvenance.provenance.applicationId} / ${moveForProvenance.provenance.structuralEdgeTypes} / ${moveForProvenance.provenance.structuralEdgeIds.join(", ")}. The route entry is local only.`
    : "No declared modal successor is available from this route position.";
  applyLegalMoveButton.disabled = selectedMove === undefined;
}

function renderMoveConsole(): void {
  if (!session) {
    return;
  }

  const inspected = session.selectedAnchorId === null ? undefined : nodesById.get(session.selectedAnchorId);
  const routePosition =
    session.modalRoute.currentAnchorId === null ? undefined : nodesById.get(session.modalRoute.currentAnchorId);
  moveInspectedAnchor.textContent = nodeLabel(inspected);
  moveRoutePosition.textContent = routePosition
    ? `${nodeLabel(routePosition)} / local route position`
    : "No active local route";
  startRouteButton.disabled = !legalMoveCatalog || !inspected;
  startRouteButton.textContent = routePosition ? "Start new route here" : "Start route here";
  resumeRouteButton.hidden = !routePosition || routePosition.state.stateId === session.selectedAnchorId;
  resumeRouteButton.disabled = !routePosition;
  clearRouteButton.disabled = !routePosition;

  renderLegalMoves();
  renderRouteHistory();
  renderObjectives();

  if (!legalMoveCatalog) {
    setMoveStatus(
      legalMoveCatalogNotice ?? "The legal-move catalog is unavailable for this projection.",
      "unavailable",
    );
  } else if (!routePosition) {
    setMoveStatus("Inspect an anchor, then start a local route to reveal its declared move.", "notice");
  } else if (session.selectedAnchorId !== routePosition.state.stateId) {
    setMoveStatus(
      "The inspected anchor cannot receive a move while the active local route is elsewhere. Resume or start a new route.",
      "error",
    );
  } else if (session.selectedLegalMoveId) {
    setMoveStatus("The selected modal move is ready to apply locally.", "ready");
  } else {
    setMoveStatus("One source-backed modal successor is available from this route position.", "ready");
  }
}

function initializeCourtControls(): void {
  courtControls.replaceChildren(
    ...COURT_POSITIONS.map((position) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "court-position-button";
      button.dataset.courtPosition = position.positionId;
      button.disabled = true;
      button.setAttribute("aria-pressed", "false");

      const id = document.createElement("span");
      id.textContent = position.positionId;
      const name = document.createElement("strong");
      name.textContent = position.scaleName;
      const mask = document.createElement("small");
      mask.textContent = String(position.pitchMask);
      button.append(id, name, mask);
      button.addEventListener("click", () => selectCourtPosition(position.positionId));
      courtButtons.set(position.positionId, button);
      return button;
    }),
  );
}

function renderCourtSurface(): void {
  if (!session) {
    return;
  }

  const court = courtPositionById(session.courtPresentationPosition);
  const adjacentPositions = COURT_POSITIONS.filter((position) =>
    isAdjacentCourtPosition(court.positionId, position.positionId),
  );
  courtRouteStatus.textContent = `${court.positionId} is active. Adjacent local presentation moves: ${adjacentPositions.map((position) => position.positionId).join(", ")}.`;
  courtCurrent.textContent = `${court.positionId} / ${court.scaleName} / ${court.emblem}`;
  courtStrategy.textContent = court.strategyEmphasis;
  courtMask.textContent = `${court.pitchMask} / ${court.maskStringMsb}`;
  courtPitchClasses.textContent = formatPitchClasses(court.pitchClasses);
  courtRatio.textContent = formatCourtRatio(court.kappaCourt);
  courtMercury.textContent = court.mercuryEngineEmblem
    ? "Mercury C2 engine and ledger emblem is active. It is not a binary Court pole or toggle."
    : "Mercury is the C2 engine and ledger emblem, not a binary Court pole or toggle.";
  courtMercury.dataset.active = String(court.mercuryEngineEmblem);

  for (const position of COURT_POSITIONS) {
    const button = courtButtons.get(position.positionId);
    if (!button) {
      continue;
    }
    const selected = position.positionId === court.positionId;
    const adjacent = isAdjacentCourtPosition(court.positionId, position.positionId);
    button.disabled = !selected && !adjacent;
    button.classList.toggle("is-selected", selected);
    button.dataset.state = selected ? "current" : adjacent ? "available" : "unavailable";
    button.setAttribute("aria-pressed", String(selected));
    if (selected) {
      button.setAttribute("aria-current", "step");
    } else {
      button.removeAttribute("aria-current");
    }
  }

  courtPoles.replaceChildren(
    ...COURT_POLE_ORDER.map((pole) => {
      const disposition = court.internalPoles.includes(pole) ? "Internal" : "External";
      const item = document.createElement("div");
      item.className = "court-pole";
      item.dataset.courtPole = pole;
      item.dataset.disposition = disposition.toLowerCase();
      const label = document.createElement("span");
      label.textContent = pole;
      const value = document.createElement("strong");
      value.textContent = disposition;
      item.append(label, value);
      return item;
    }),
  );
}

function updateAnchorUrl(anchorId: number | null): void {
  const url = new URL(window.location.href);
  url.searchParams.delete("court");
  if (anchorId === null) {
    url.searchParams.delete("anchor");
  } else {
    url.searchParams.set("anchor", String(anchorId));
  }
  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
}

function clearCourtUrlState(): void {
  const url = new URL(window.location.href);
  if (!url.searchParams.has("court")) {
    return;
  }
  url.searchParams.delete("court");
  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
}

function selectAnchor(node: OrreryNode, selectionSource: "restore" | "user" = "restore"): void {
  if (!session) {
    return;
  }

  session = selectSessionAnchor(session, node.state.stateId);
  scene?.select(node);

  for (const [stateId, button] of anchorButtons) {
    const isSelected = stateId === session.selectedAnchorId;
    button.classList.toggle("is-selected", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
  }

  const office = node.resolution.office;
  inspectorHeading.textContent = node.state.name;
  selectedIdentity.textContent = `${node.state.nodeId} / ${node.state.tier} / ${node.state.forteFamily}`;
  selectedGovernor.textContent = office;
  selectedGovernor.style.color = GOVERNOR_META[office].color;
  selectedTier.textContent = `${node.state.tier} / ${TIER_META[node.state.tier].label}`;
  selectedWavelength.textContent = `${node.photonic.representativeWavelengthNm.toFixed(1)} nm`;
  selectedPhotonicCompression.textContent = node.photonic.photonicCompression.toFixed(3);
  selectedWeight.textContent = formatRatio(node.scopedHarmonicDescriptor.weightedProjection);
  selectedProfile.textContent = node.canonicalProfile.profileVersion;
  renderLandforms(node.canonicalProfile.domainReferences.landforms);
  renderAudioPalette(audioEngine.select(node, session.courtPresentationPosition, selectionSource === "user"));
  renderSessionHud();
  renderMoveConsole();
  updateAnchorUrl(node.state.stateId);
  setSessionNotice(saveSession(progressStorage, session));
}

function selectCourtPosition(courtPosition: CourtPosition): void {
  if (!session) {
    return;
  }
  if (session.courtPresentationPosition === courtPosition) {
    return;
  }

  try {
    session = selectSessionCourtPosition(session, courtPosition);
  } catch {
    courtRouteStatus.textContent = "That Court presentation move is unavailable. Use an adjacent position.";
    return;
  }
  updateCompletedObjectives();
  renderCourtSurface();
  renderSessionHud();
  renderMoveConsole();

  if (session.selectedAnchorId !== null) {
    const selectedNode = nodesById.get(session.selectedAnchorId);
    if (selectedNode) {
      renderAudioPalette(audioEngine.select(selectedNode, session.courtPresentationPosition, true));
    }
  }

  setSessionNotice(saveSession(progressStorage, session));
}

function startRouteAtInspectedAnchor(): void {
  if (!session || !legalMoveCatalog || session.selectedAnchorId === null) {
    return;
  }

  const source = nodesById.get(session.selectedAnchorId);
  if (!source) {
    setMoveStatus("The inspected anchor is unavailable in the live projection.", "error");
    return;
  }

  session = startSessionRoute(session, source.state.stateId);
  renderSessionHud();
  renderMoveConsole();
  const storageNotice = saveSession(progressStorage, session);
  setSessionNotice(storageNotice);
  setMoveStatus(
    storageNotice
      ? `Started a local route at ${source.state.name}. ${storageNotice}`
      : `Started a local route at ${source.state.name}. Select its declared modal successor.`,
    "ready",
  );
}

function resumeRouteInspection(): void {
  if (!session || session.modalRoute.currentAnchorId === null) {
    return;
  }

  const routeNode = nodesById.get(session.modalRoute.currentAnchorId);
  if (!routeNode) {
    setMoveStatus("The active local route position is unavailable in the live projection.", "error");
    return;
  }
  selectAnchor(routeNode);
  setMoveStatus("Resumed the active local route position.", "ready");
}

function clearRoute(): void {
  if (!session) {
    return;
  }

  session = clearSessionRoute(session);
  renderSessionHud();
  renderMoveConsole();
  const storageNotice = saveSession(progressStorage, session);
  setSessionNotice(storageNotice);
  setMoveStatus(
    storageNotice ? `The local modal route was cleared. ${storageNotice}` : "The local modal route was cleared.",
    "notice",
  );
}

function selectLegalMove(move: LegalMove): void {
  if (!session) {
    return;
  }

  const result = selectSessionLegalMove(session, move, legalMoveCatalog?.movesById ?? new Map());
  if (result.kind === "invalid") {
    setMoveStatus(result.message, "error");
    return;
  }

  session = result.session;
  renderMoveConsole();
  const storageNotice = saveSession(progressStorage, session);
  setSessionNotice(storageNotice);
  setMoveStatus(
    storageNotice ? `Selected ${move.operatorId}. ${storageNotice}` : `Selected ${move.operatorId}; apply it to record the local route step.`,
    "ready",
  );
}

function applySelectedLegalMove(): void {
  if (!session || !legalMoveCatalog) {
    return;
  }

  const result = applySessionLegalMove(session, legalMoveCatalog.movesById);
  if (result.kind === "invalid") {
    setMoveStatus(result.message, "error");
    return;
  }

  const target = nodesById.get(result.move.targetId);
  if (!target) {
    setMoveStatus("The declared move target is unavailable in the live projection.", "error");
    return;
  }

  session = result.session;
  updateCompletedObjectives();
  selectAnchor(target, "user");
  setMoveStatus(
    `Applied M locally: ${nodeLabel(nodesById.get(result.move.sourceId))} -> ${target.state.name}.`,
    "ready",
  );
}

function renderAnchorIndex(nodes: OrreryNode[]): void {
  anchorButtons.clear();
  anchorList.replaceChildren();

  for (const currentTier of TIERS) {
    const group = document.createElement("section");
    group.className = "tier-group";

    const heading = document.createElement("div");
    heading.className = "tier-heading";
    const title = document.createElement("h3");
    title.textContent = `${currentTier} / ${TIER_META[currentTier].label}`;
    const shape = document.createElement("span");
    shape.textContent = TIER_META[currentTier].shape;
    heading.append(title, shape);

    const entries = document.createElement("div");
    entries.className = "tier-entries";
    for (const node of nodes.filter((item) => item.state.tier === currentTier)) {
      const button = document.createElement("button");
      const office = node.resolution.office;
      button.type = "button";
      button.className = "anchor-button";
      button.dataset.stateId = String(node.state.stateId);
      button.style.setProperty("--office-color", GOVERNOR_META[office].color);
      button.setAttribute("aria-pressed", "false");
      const officeLabel = document.createElement("span");
      officeLabel.textContent = GOVERNOR_META[office].shortLabel;
      const name = document.createElement("strong");
      name.textContent = node.state.name;
      const stateId = document.createElement("small");
      stateId.textContent = String(node.state.stateId);
      button.append(officeLabel, name, stateId);
      button.addEventListener("click", () => selectAnchor(node, "user"));
      anchorButtons.set(node.state.stateId, button);
      entries.append(button);
    }

    group.append(heading, entries);
    anchorList.append(group);
  }
}

async function start(): Promise<void> {
  let response: Awaited<ReturnType<typeof fetchNodes>>;

  try {
    response = await fetchNodes();
  } catch (error) {
    if (error instanceof ProjectionCompatibilityError) {
      showProjectionIncompatible(error);
    } else {
      showProjectionUnavailable(error);
    }
    return;
  }

  const { nodes } = response;
  profileRegistryReleaseId = response.profileRegistryReleaseId;
  renderAudioState(audioEngine.snapshot());
  nodesById = new Map(nodes.map((node) => [node.state.stateId, node]));
  const validAnchorIds = new Set(nodesById.keys());
  try {
    legalMoveCatalog = createLegalMoveCatalogIndex(response);
    legalMoveCatalogNotice = undefined;
  } catch (error) {
    legalMoveCatalog = undefined;
    const detail = error instanceof Error ? error.message : "Unknown legal-move catalog compatibility error";
    legalMoveCatalogNotice = `Legal moves are unavailable: ${detail}`;
  }
  progressStorage = browserStorage();
  const sessionSource = sourceFromResponse(response, catalogIdentity(LEGAL_MOVE_CATALOG));
  const loadedSession = loadSession(
    progressStorage,
    sessionSource,
    validAnchorIds,
    legalMoveCatalog?.movesById ?? new Map(),
    localObjectiveIds,
  );
  session = loadedSession.session ?? createSession(sessionSource);
  const urlSelection = parseUrlAnchorSelection(window.location.search, validAnchorIds);
  clearCourtUrlState();

  renderAnchorIndex(nodes);

  sceneCount.textContent = `${nodes.length} / ${response.nodeCount} anchors`;
  indexCount.textContent = String(nodes.length).padStart(2, "0");
  setApiHealth(`Live projection / ${response.schemaVersion}`, "ready");
  clearInspector();
  renderSessionHud();
  renderMoveConsole();
  renderCourtSurface();

  if (supportsWebGl()) {
    try {
      scene = createOrreryScene({
        canvas,
        labelRoot,
        nodes,
        onSelect: (node) => selectAnchor(node, "user"),
      });
      sceneMessage.hidden = true;
    } catch {
      showWebGlFallback();
    }
  } else {
    showWebGlFallback();
  }

  if (urlSelection.kind === "selected") {
    const node = nodesById.get(urlSelection.anchorId);
    if (node) {
      selectAnchor(node);
    }
    if (loadedSession.notice) {
      setSessionNotice(loadedSession.notice);
    }
    return;
  }

  if (urlSelection.kind === "invalid") {
    session = clearSessionSelection(session);
    renderSessionHud();
    renderMoveConsole();
    const storageNotice = saveSession(progressStorage, session);
    const invalidLinkNotice = `${urlSelection.message} Clear the link selection to choose an anchor.`;
    const resetAndLinkNotice = loadedSession.notice
      ? `${loadedSession.notice} ${invalidLinkNotice}`
      : invalidLinkNotice;
    setSessionNotice(
      storageNotice ? `${resetAndLinkNotice} ${storageNotice}` : resetAndLinkNotice,
      "clear-link",
    );
    return;
  }

  if (session.selectedAnchorId !== null) {
    const node = nodesById.get(session.selectedAnchorId);
    if (node) {
      selectAnchor(node);
    }
  }

  if (loadedSession.notice) {
    setSessionNotice(loadedSession.notice);
  }
}

clearLinkSelectionButton.addEventListener("click", () => {
  if (!session) {
    return;
  }

  session = clearSessionSelection(session);
  audioEngine.clearSelection();
  updateAnchorUrl(null);
  clearInspector();
  renderSessionHud();
  renderMoveConsole();
  for (const button of anchorButtons.values()) {
    button.classList.remove("is-selected");
    button.setAttribute("aria-pressed", "false");
  }
  const storageNotice = saveSession(progressStorage, session);
  setSessionNotice(
    storageNotice ? `Link selection cleared. ${storageNotice}` : "Link selection cleared. Choose an anchor.",
  );
  anchorList.querySelector<HTMLButtonElement>(".anchor-button")?.focus();
});

reloadProjectionButton.addEventListener("click", () => window.location.reload());

startRouteButton.addEventListener("click", startRouteAtInspectedAnchor);
resumeRouteButton.addEventListener("click", resumeRouteInspection);
clearRouteButton.addEventListener("click", clearRoute);
applyLegalMoveButton.addEventListener("click", applySelectedLegalMove);

audioEnableButton.addEventListener("click", () => {
  if (profileRegistryReleaseId) {
    void audioEngine.enable(profileRegistryReleaseId);
  }
});

audioPauseButton.addEventListener("click", () => {
  if (audioEngine.snapshot().transport === "playing") {
    void audioEngine.pause();
  } else if (profileRegistryReleaseId) {
    void audioEngine.enable(profileRegistryReleaseId);
  }
});

audioMuteButton.addEventListener("click", () => {
  audioEngine.setMuted(!audioEngine.snapshot().muted);
});

audioVolume.addEventListener("input", () => {
  audioEngine.setVolume(Number(audioVolume.value));
});

audioVisualOnly.addEventListener("change", () => {
  audioEngine.setVisualOnly(audioVisualOnly.checked);
});

initializeCourtControls();
audioEngine.subscribe(renderAudioState);
window.addEventListener("pagehide", () => {
  scene?.dispose();
  audioEngine.dispose();
});

void start();
