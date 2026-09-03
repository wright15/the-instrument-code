import { fetchNodes, ProjectionCompatibilityError } from "./api";
import {
  EVIDENCE_BUNDLE,
  EvidenceBundleCompatibilityError,
  createEvidenceBundleIndex,
  type EvidenceBundleRecord,
} from "./evidence-bundle";
import {
  OrreryAudioEngine,
  formatPitchClasses,
  isAudioSourceCompatible,
  isAudioVoicingMode,
  loadVoicingMode,
  saveVoicingMode,
  type AudioEngineState,
  type AudioSelection,
  type ProgressionStepView,
} from "./audio";
import { DEGREE_GOVERNORS, isChordSize, type ChordSize } from "./harmony";
import {
  COURT_POLE_ORDER,
  COURT_POSITIONS,
  courtPositionById,
  formatCourtRatio,
  isAdjacentCourtPosition,
  type CourtPosition,
} from "./court";
import { composeSceneParameters, type SceneQuality } from "./scene-composer";
import {
  OVERLAY_DISCLAIMER,
  PHOTONIC_OVERLAY_BUNDLE,
  VARIANT_A,
  VARIANT_B,
  type PhotonicOverlayRecord,
} from "./photonic-overlay";
import {
  FIELD_DERIVATION_BUNDLE,
  observationViews,
  type ObservationView,
} from "./field-derivation";
import {
  ProvenanceCompatibilityError,
  ProvenanceExplainError,
  fetchNamedQuery,
  isProvenanceQueryId,
  provenancePathSteps,
  type LegalMoveContext,
  type NamedQueryResponse,
  type ProvenancePathRow,
  type ProvenanceQueryId,
  type RuleExplanation,
} from "./provenance-explain";
import { createOrreryScene, type OrreryScene } from "./scene";
import {
  applySessionLegalMove,
  buildAnchorShareUrl,
  clearSessionSelection,
  clearSessionRoute,
  createSession,
  dismissTutorial,
  isTutorialDismissed,
  loadSession,
  markSessionObjectivesCompleted,
  parseUrlAnchorSelection,
  resetOrrerySession,
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
const sceneFrame = requiredElement<HTMLElement>("#scene-frame");
const labelRoot = requiredElement<HTMLElement>("#anchor-labels");
const apiStatus = requiredElement<HTMLElement>("#api-status");
const sceneMessage = requiredElement<HTMLElement>("#scene-message");
const sceneCount = requiredElement<HTMLElement>("#scene-count");
const sceneQualityMode = requiredElement<HTMLSelectElement>("#scene-quality");
const sceneQualityStatus = requiredElement<HTMLElement>("#scene-quality-status");
const scenePresentationStatus = requiredElement<HTMLElement>("#scene-presentation-status");
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
const selectedQs = requiredElement<HTMLOListElement>("#selected-qs");
const selectedWWording = requiredElement<HTMLElement>("#selected-w-wording");
const selectedCertificateStatus = requiredElement<HTMLElement>("#selected-certificate-status");
const selectedCertificateMargin = requiredElement<HTMLElement>("#selected-certificate-margin");
const selectedCertificateSlack = requiredElement<HTMLElement>("#selected-certificate-slack");
const selectedCertificateTightSet = requiredElement<HTMLElement>("#selected-certificate-tightset");
const selectedCHGuard = requiredElement<HTMLElement>("#selected-c-h-guard");
const selectedAudioPalette = requiredElement<HTMLElement>("#selected-audio-palette");
const selectedAudioNote = requiredElement<HTMLElement>("#selected-audio-note");
const selectedCourtFilter = requiredElement<HTMLElement>("#selected-court-filter");
const sessionSelected = requiredElement<HTMLElement>("#session-selected");
const sessionVisited = requiredElement<HTMLElement>("#session-visited");
const sessionCourt = requiredElement<HTMLElement>("#session-court");
const sessionApiHealth = requiredElement<HTMLElement>("#session-api-health");
const sessionMessage = requiredElement<HTMLElement>("#session-message");
const sessionAnnounce = requiredElement<HTMLElement>("#session-announce");
const clearLinkSelectionButton = requiredElement<HTMLButtonElement>("#clear-link-selection");
const reloadProjectionButton = requiredElement<HTMLButtonElement>("#reload-projection");
const copyAnchorLinkButton = requiredElement<HTMLButtonElement>("#copy-anchor-link");
const shareAnchorLinkButton = requiredElement<HTMLButtonElement>("#share-anchor-link");
const resetOrreryButton = requiredElement<HTMLButtonElement>("#reset-orrery");
const onboarding = requiredElement<HTMLElement>("#onboarding");
const onboardingDismissButton = requiredElement<HTMLButtonElement>("#onboarding-dismiss");
const onboardingStartLydianButton = requiredElement<HTMLButtonElement>("#onboarding-start-lydian");
const objectiveAnnounce = requiredElement<HTMLElement>("#objective-announce");
const moveStatus = requiredElement<HTMLElement>("#move-status");
const moveRoutePosition = requiredElement<HTMLElement>("#move-route-position");
const moveInspectedAnchor = requiredElement<HTMLElement>("#move-inspected-anchor");
const moveProvenance = requiredElement<HTMLElement>("#move-provenance");
const moveTargetPreview = requiredElement<HTMLElement>("#move-target-preview");
const moveTargetPitchClasses = requiredElement<HTMLElement>("#move-target-pitch-classes");
const moveTargetCh = requiredElement<HTMLElement>("#move-target-ch");
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
const audioVoicingSelect = requiredElement<HTMLSelectElement>("#audio-voicing");
const audioVisualOnly = requiredElement<HTMLInputElement>("#audio-visual-only");
const harmonySize = requiredElement<HTMLSelectElement>("#harmony-size");
const harmonyToggle = requiredElement<HTMLButtonElement>("#harmony-toggle");
const harmonyReseed = requiredElement<HTMLButtonElement>("#harmony-reseed");
const harmonyReadout = requiredElement<HTMLOListElement>("#harmony-readout");
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
const provenanceQuery = requiredElement<HTMLSelectElement>("#provenance-query");
const provenanceIdentifier = requiredElement<HTMLInputElement>("#provenance-identifier");
const provenanceRun = requiredElement<HTMLButtonElement>("#provenance-run");
const provenanceStatus = requiredElement<HTMLElement>("#provenance-status");
const provenanceResults = requiredElement<HTMLOListElement>("#provenance-results");
const fieldDerivationAuthorityNote = requiredElement<HTMLElement>("#field-derivation-authority-note");
const fieldDerivationList = requiredElement<HTMLElement>("#field-derivation-list");
const photonicDisclaimer = requiredElement<HTMLElement>("#photonic-disclaimer");
const photonicVariant = requiredElement<HTMLSelectElement>("#photonic-variant");
const photonicChannelStatus = requiredElement<HTMLElement>("#photonic-channel-status");
const photonicList = requiredElement<HTMLElement>("#photonic-list");

let scene: OrreryScene | undefined;
let session: OrrerySession | undefined;
let progressStorage: StorageLike | undefined;
let nodesById = new Map<number, OrreryNode>();
let profileRegistryReleaseId: string | undefined;
let legalMoveCatalog: LegalMoveCatalogIndex | undefined;
let legalMoveCatalogNotice: string | undefined;
let evidenceRecords: Map<number, EvidenceBundleRecord> | undefined;
let evidenceBundleNotice: string | undefined;
const anchorButtons = new Map<number, HTMLButtonElement>();
const courtButtons = new Map<CourtPosition, HTMLButtonElement>();
const audioEngine = new OrreryAudioEngine();
const localObjectiveIds = new Set<string>(LOCAL_OBJECTIVE_IDS);

const HARMONY_SIZE_STORAGE_KEY = "seven-governors.harmonic-orrery.harmony-size";
let harmonyEnabled = false;

function loadHarmonySize(storage: StorageLike | undefined): ChordSize {
  if (!storage) {
    return 3;
  }
  try {
    const value = Number(storage.getItem(HARMONY_SIZE_STORAGE_KEY));
    return isChordSize(value) ? value : 3;
  } catch {
    return 3;
  }
}

function saveHarmonySize(storage: StorageLike | undefined, size: ChordSize): void {
  if (!storage) {
    return;
  }
  try {
    storage.setItem(HARMONY_SIZE_STORAGE_KEY, String(size));
  } catch {
    // Harmony preference is non-critical; ignore write failures.
  }
}

function renderHarmonyReadout(plan: readonly ProgressionStepView[]): void {
  if (plan.length === 0) {
    const item = document.createElement("li");
    item.textContent = "Select an anchor and enable sound to generate a progression.";
    harmonyReadout.replaceChildren(item);
    return;
  }

  harmonyReadout.replaceChildren(
    ...plan.map((step) => {
      const item = document.createElement("li");
      const degreeGovernor = DEGREE_GOVERNORS[step.rootDegree - 1];
      item.textContent = `Step ${step.index + 1} · d${step.rootDegree} ${degreeGovernor} · ${step.weightLabel} gravity · ${step.qualityLabel} · ${formatPitchClasses(step.voicedPitchClasses)}`;
      return item;
    }),
  );
}

function syncHarmonyControls(state: AudioEngineState): void {
  const prepared =
    (state.readiness === "ready" || state.readiness === "degraded") &&
    !state.visualOnly &&
    state.transport !== "stopped" &&
    legalMoveCatalog !== undefined;
  harmonyToggle.disabled = !prepared;
  harmonyReseed.disabled = !prepared;
  harmonyToggle.setAttribute("aria-pressed", String(state.progression));
  harmonyToggle.textContent = state.progression ? "Stop progression" : "Play progression";
}

function selectedHarmonySize(): ChordSize {
  const value = Number(harmonySize.value);
  return isChordSize(value) ? value : 3;
}

function startHarmonyProgression(seed?: number): void {
  const plan = audioEngine.startProgression({ steps: 8, chordSize: selectedHarmonySize(), seed });
  harmonyEnabled = plan.length > 0;
  renderHarmonyReadout(plan);
}

function stopHarmonyProgression(notice: string): void {
  audioEngine.stopProgression();
  harmonyEnabled = false;
  renderHarmonyReadout([]);
  announceSession(notice);
}

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

function announceSession(message: string): void {
  sessionAnnounce.textContent = message;
  // Force re-announcement for identical consecutive messages.
  void sessionAnnounce.offsetHeight;
}

function updateShareButtons(): void {
  const anchorId = session?.selectedAnchorId ?? null;
  const hasSelection = anchorId !== null && nodesById.has(anchorId);
  copyAnchorLinkButton.disabled = !hasSelection;
  shareAnchorLinkButton.disabled = !hasSelection;
  copyAnchorLinkButton.setAttribute("aria-disabled", String(!hasSelection));
  shareAnchorLinkButton.setAttribute("aria-disabled", String(!hasSelection));
  const shareSupported = typeof navigator !== "undefined" && typeof (navigator as { share?: unknown }).share === "function";
  shareAnchorLinkButton.hidden = !shareSupported;
}

function shareUrlForAnchor(anchorId: number | null): string {
  return new URL(buildAnchorShareUrl(anchorId, window.location.href), window.location.origin).toString();
}

async function copyAnchorLink(): Promise<void> {
  const anchorId = session?.selectedAnchorId ?? null;
  if (anchorId === null || !nodesById.has(anchorId)) {
    setSessionNotice("Select an anchor before copying its link.");
    return;
  }
  const url = shareUrlForAnchor(anchorId);
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      setSessionNotice(`Copied ${url} — Court, route, and objectives stay local-only.`);
      announceSession(`Copied anchor link ${anchorId}`);
      return;
    }
    throw new Error("Clipboard unavailable");
  } catch {
    window.prompt("Copy this anchor link (Court and route stay local-only):", url);
    setSessionNotice("Anchor link ready to copy — Court, route, and objectives stay local-only.");
  }
}

async function shareAnchorLink(): Promise<void> {
  const anchorId = session?.selectedAnchorId ?? null;
  if (anchorId === null || !nodesById.has(anchorId)) {
    setSessionNotice("Select an anchor before sharing.");
    return;
  }
  const url = shareUrlForAnchor(anchorId);
  const nav = navigator as unknown as { share?: (data: { title?: string; text?: string; url?: string }) => Promise<void> };
  if (typeof nav.share === "function") {
    try {
      await nav.share({ title: "Harmonic Orrery", text: `Harmonic Orrery anchor ${anchorId}`, url });
      setSessionNotice(`Shared ${url} — Court, route, and objectives stay local-only.`);
      return;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
    }
  }
  await copyAnchorLink();
}

function resetLocalOrrery(): void {
  if (!session) {
    return;
  }
  const source = session.source;
  const result = resetOrrerySession(progressStorage, source);
  session = result.session;
  audioEngine.clearSelection();
  harmonyEnabled = false;
  renderHarmonyReadout([]);
  updateAnchorUrl(null);
  clearInspector();
  clearScenePresentation();
  renderSessionHud();
  renderMoveConsole();
  renderCourtSurface();
  updateShareButtons();
  for (const button of anchorButtons.values()) {
    button.classList.remove("is-selected");
    button.setAttribute("aria-pressed", "false");
  }
  const storageNotice = saveSession(progressStorage, session);
  const baseNotice = "Local Orrery state reset. Neo4j and canonical data were not affected.";
  const combinedNotice = [baseNotice, result.notice, storageNotice].filter(Boolean).join(" ");
  setSessionNotice(combinedNotice || baseNotice);
  announceSession("Local Orrery state reset");
  anchorList.querySelector<HTMLButtonElement>(".anchor-button")?.focus();
}

function setupHelpTooltips(): void {
  const pairs: Array<[string, string]> = [
    ["#help-session", "#help-session-tip"],
    ["#help-moves", "#help-moves-tip"],
    ["#help-court", "#help-court-tip"],
    ["#help-audio", "#help-audio-tip"],
    ["#help-scene", "#help-scene-tip"],
  ];
  for (const [triggerSelector, tipSelector] of pairs) {
    const trigger = document.querySelector<HTMLButtonElement>(triggerSelector);
    const tip = document.querySelector<HTMLElement>(tipSelector);
    if (!trigger || !tip) continue;
    let pinned = false;
    const show = () => {
      tip.hidden = false;
      trigger.setAttribute("aria-expanded", "true");
    };
    const hide = () => {
      if (pinned) return;
      tip.hidden = true;
      trigger.setAttribute("aria-expanded", "false");
    };
    const togglePinned = () => {
      pinned = !pinned;
      tip.hidden = !pinned;
      trigger.setAttribute("aria-expanded", String(pinned));
    };
    trigger.setAttribute("aria-expanded", "false");
    trigger.addEventListener("mouseenter", () => {
      if (!pinned) show();
    });
    trigger.addEventListener("mouseleave", hide);
    trigger.addEventListener("focus", () => {
      if (!pinned) show();
    });
    trigger.addEventListener("blur", hide);
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      togglePinned();
    });
  }
}

function showOnboardingIfNeeded(): void {
  if (!progressStorage || isTutorialDismissed(progressStorage)) {
    onboarding.hidden = true;
    return;
  }
  onboarding.hidden = false;
}

function dismissOnboarding(): void {
  onboarding.hidden = true;
  dismissTutorial(progressStorage);
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
  syncHarmonyControls(state);
}

function renderAudioPalette(selection: AudioSelection): void {
  const retainedPitchClasses = formatPitchClasses(selection.retainedPitchClasses);
  if (selection.voicingMode === "heptatonic") {
    selectedAudioPalette.textContent = `${selection.selectedStateName} / heptatonic voicing / ${retainedPitchClasses}`;
    selectedAudioNote.textContent = `Heptatonic voicing plays the inspected anchor's own seven-note scale; its timbre inherits the authored ${selection.office} A0 preset.`;
    selectedCourtFilter.textContent = `Court ${selection.court.positionId} / ${selection.court.scaleName} does not filter pitch content in heptatonic voicing.`;
    audioPalette.textContent = `Current voiced palette: Heptatonic / ${retainedPitchClasses}`;
    return;
  }

  const sourcePitchClasses = formatPitchClasses(selection.palette.pitchClasses);
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

function autoSceneQuality(): SceneQuality {
  return window.matchMedia("(max-width: 680px), (pointer: coarse)").matches ? "reduced" : "full";
}

function selectedSceneQuality(): SceneQuality {
  return sceneQualityMode.value === "reduced" ? "reduced" : autoSceneQuality();
}

function renderSceneQuality(): SceneQuality {
  const quality = selectedSceneQuality();
  scene?.setQuality(quality);
  sceneFrame.dataset.quality = quality;
  sceneQualityStatus.textContent =
    sceneQualityMode.value === "auto"
      ? `Auto quality / ${quality === "full" ? "full detail" : "reduced detail"}`
      : "Reduced quality / lower render cost";
  return quality;
}

function clearScenePresentation(): void {
  scene?.clearSelection();
  scenePresentationStatus.dataset.state = "idle";
  scenePresentationStatus.textContent = "Choose an anchor to compose a local authored presentation interpretation.";
}

function renderScenePresentation(node: OrreryNode): void {
  if (!session) {
    return;
  }

  const court = courtPositionById(session.courtPresentationPosition);
  const parameters = composeSceneParameters(node, court);
  scene?.select(node, parameters);
  scenePresentationStatus.dataset.state = "ready";
  scenePresentationStatus.textContent = `${node.state.name} / Court ${court.positionId} / reference prompt only: ${parameters.source.landformReference}. The local mesh, particles, light, surface pattern, and framing are authored presentation choices.`;
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
  const qsItem = document.createElement("li");
  qsItem.textContent = "Select an anchor to enumerate its Q(S) positions.";
  selectedQs.replaceChildren(qsItem);
  selectedWWording.textContent = evidenceBundleNotice
    ? `Evidence bundle unavailable: ${evidenceBundleNotice}`
    : "W_A012 wording: unique max-margin optimum under the declared objective; method.uniquenessClaim=false remains true outside it.";
  selectedCertificateStatus.textContent = "-";
  selectedCertificateMargin.textContent = "-";
  selectedCertificateSlack.textContent = "-";
  selectedCertificateTightSet.textContent = "-";
  selectedCHGuard.textContent = evidenceBundleNotice
    ? "Global harmonic.C_H guard is unavailable while the evidence bundle is incompatible."
    : EVIDENCE_BUNDLE.globalAggregate.guardLiteral;
  selectedAudioPalette.textContent = "Select an anchor to inspect its office A0 palette.";
  selectedAudioNote.textContent = "Audio is an optional presentation layer.";
  selectedCourtFilter.textContent = "Select an anchor to inspect its local Court filter.";
  audioPalette.textContent = "Select an anchor to inspect its A0 office palette.";
}

function renderEvidenceBlock(node: OrreryNode): void {
  const evidence = evidenceRecords?.get(node.state.stateId);
  if (!evidence) {
    const item = document.createElement("li");
    item.textContent = evidenceBundleNotice ?? "Evidence record unavailable for this anchor.";
    selectedQs.replaceChildren(item);
    selectedWWording.textContent = "W_A012 wording is unavailable while the evidence bundle is incompatible.";
    selectedCertificateStatus.textContent = "-";
    selectedCertificateMargin.textContent = "-";
    selectedCertificateSlack.textContent = "-";
    selectedCertificateTightSet.textContent = "-";
    selectedCHGuard.textContent = "Global harmonic.C_H guard is unavailable while the evidence bundle is incompatible.";
    return;
  }

  selectedQs.replaceChildren(
    ...evidence.triadicCompressionSignature.map((value, index) => {
      const cell = document.createElement("li");
      cell.dataset.position = String(index + 1);
      cell.dataset.qClass = String(value);
      const position = document.createElement("span");
      position.textContent = `d${index + 1}`;
      const qValue = document.createElement("strong");
      qValue.textContent = String(value);
      cell.append(position, qValue);
      return cell;
    }),
  );
  selectedWWording.textContent =
    `W_A012 ${evidence.weightedProjection.numerator}/${evidence.weightedProjection.denominator} is the ${evidence.wA012Wording}. ` +
    "method.uniquenessClaim=false remains true outside that objective.";
  selectedCertificateStatus.textContent =
    `${EVIDENCE_BUNDLE.certificate.optimalityClaim} / ${EVIDENCE_BUNDLE.certificate.activeSetLabel}`;
  selectedCertificateMargin.textContent =
    `${EVIDENCE_BUNDLE.certificate.epsilonStar.numerator}/${EVIDENCE_BUNDLE.certificate.epsilonStar.denominator}`;
  selectedCertificateSlack.textContent =
    `${EVIDENCE_BUNDLE.certificate.nextTightestSlack.numerator}/${EVIDENCE_BUNDLE.certificate.nextTightestSlack.denominator} / ${EVIDENCE_BUNDLE.certificate.nextTightestSlack.pair}`;
  selectedCertificateTightSet.textContent = EVIDENCE_BUNDLE.certificate.tightSet.join(" · ");
  selectedCHGuard.textContent = EVIDENCE_BUNDLE.globalAggregate.guardLiteral;
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
  updateShareButtons();
}

function setMoveStatus(message: string, state: "ready" | "notice" | "error" | "unavailable"): void {
  moveStatus.textContent = message;
  moveStatus.dataset.state = state;
}

function nodeLabel(node: OrreryNode | undefined): string {
  return node ? `${node.state.name} / ${node.state.nodeId}` : "No anchor";
}

function operatorLabel(operatorId: LegalMove["operatorId"]): { title: string; detail: string } {
  const operator = legalMoveCatalog?.catalog.operators.find((item) => item.operatorId === operatorId);
  if (operator && typeof operator.degree === "number") {
    return {
      title: `${operatorId} / ${operator.name}`,
      detail: `Degree ${operator.degree} / ${operator.degreeGovernor} / ${operator.direction}`,
    };
  }
  return { title: `${operatorId} / Parallel move`, detail: "Operator metadata unavailable" };
}

function renderMoveTargetPreview(selectedLegalMoveId: string | null | undefined): void {
  const selectedMove = selectedLegalMoveId
    ? legalMoveCatalog?.movesById.get(selectedLegalMoveId)
    : undefined;
  const targetNode = selectedMove ? nodesById.get(selectedMove.targetId) : undefined;
  if (!targetNode) {
    moveTargetPreview.hidden = true;
    moveTargetPitchClasses.textContent = "-";
    moveTargetCh.textContent = "-";
    return;
  }

  moveTargetPreview.hidden = false;
  moveTargetPitchClasses.textContent = `${formatPitchClasses(targetNode.state.pitchClasses)} / mask ${targetNode.state.pitchMask}`;
  moveTargetCh.textContent = formatRatio(targetNode.scopedHarmonicDescriptor.weightedProjection);
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
    const completedTitles = progress
      .filter((item) => newlyCompleted.includes(item.id))
      .map((item) => item.title)
      .join(", ");
    objectiveAnnounce.textContent = `Objective completed: ${completedTitles}.`;
    announceSession(`Objective completed: ${completedTitles}`);
  }
}

function renderRouteHistory(): void {
  if (!session || !legalMoveCatalog || session.modalRoute.moveIds.length === 0) {
    const item = document.createElement("li");
    item.textContent = "No local route recorded.";
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
      item.dataset.category = objective.category;
      const badge = document.createElement("span");
      badge.className = "objective-badge";
      badge.textContent = objective.categoryLabel;
      const title = document.createElement("strong");
      title.textContent = objective.title;
      const detail = document.createElement("p");
      detail.textContent = objective.detail;
      const progress = document.createElement("span");
      progress.className = "objective-progress";
      progress.textContent = objective.status === "completed" ? `Complete / ${objective.progress}` : objective.progress;
      item.append(badge, title, detail, progress);
      return item;
    }),
  );
}

function renderLegalMoves(): void {
  if (!session || !legalMoveCatalog) {
    const message = document.createElement("p");
    message.textContent = "No source-backed parallel move can be offered for this projection.";
    legalMoveList.replaceChildren(message);
    moveProvenance.textContent = "Catalog binding unavailable; no route result is inferred.";
    applyLegalMoveButton.disabled = true;
    return;
  }

  const routeAnchorId = session.modalRoute.currentAnchorId;
  if (routeAnchorId === null) {
    const message = document.createElement("p");
    message.textContent = "Start a local route at the inspected anchor to reveal its declared parallel moves.";
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
      const label = operatorLabel(move.operatorId);
      const operator = document.createElement("strong");
      operator.textContent = label.title;
      const target = document.createElement("span");
      target.textContent = `Target: ${nodeLabel(nodesById.get(move.targetId))}`;
      const degree = document.createElement("small");
      degree.textContent = label.detail;
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
    : "No declared parallel move is available from this route position.";
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
  renderMoveTargetPreview(session.selectedLegalMoveId);
  renderRouteHistory();
  renderObjectives();

  if (!legalMoveCatalog) {
    setMoveStatus(
      legalMoveCatalogNotice ?? "The legal-move catalog is unavailable for this projection.",
      "unavailable",
    );
  } else if (!routePosition) {
    setMoveStatus("Inspect an anchor, then start a local route to reveal its declared parallel moves.", "notice");
  } else if (session.selectedAnchorId !== routePosition.state.stateId) {
    setMoveStatus(
      "The inspected anchor cannot receive a move while the active local route is elsewhere. Resume or start a new route.",
      "error",
    );
  } else if (session.selectedLegalMoveId) {
    setMoveStatus("The selected parallel move is ready to apply locally.", "ready");
  } else {
    setMoveStatus("Source-backed parallel R/L moves are available from this route position.", "ready");
  }
}

function provenanceParameterName(queryId: ProvenanceQueryId): string {
  if (queryId === "rule_explanation") return "ruleId";
  if (queryId === "legal_move_context") return "snapshotId";
  return "logicalId";
}

function renderProvenanceItems(items: string[]): void {
  provenanceResults.replaceChildren(
    ...items.map((text) => {
      const item = document.createElement("li");
      item.textContent = text;
      return item;
    }),
  );
}

function formatProvenanceResponse(queryId: ProvenanceQueryId, response: NamedQueryResponse): string[] {
  if (queryId === "provenance_path") {
    const data = response.data as { mode: "tabular"; rows: ProvenancePathRow[] };
    const steps = provenancePathSteps(data.rows);
    return steps.map(
      (step) =>
        `${step.sourceIdentity} → ${step.targetIdentity} / ${step.relationship} / depth ${step.depth} / ${step.authorityStatus}`,
    );
  }
  if (queryId === "rule_explanation") {
    const data = response.data as RuleExplanation;
    const value = data.value;
    if (!value) return [];
    return [
      `Rule ${value.ruleId} / scope ${value.ruleScope}`,
      `Admission status: ${value.admissionStatus} / active: ${String(value.active)}`,
      `Output aspect: ${value.outputAspectLogicalId ?? "none"}`,
      `Provenance: ${value.provenanceLogicalIds.join(", ") || "none"}`,
    ];
  }
  const data = response.data as LegalMoveContext;
  return data.rows.map(
    (row) =>
      `${row.operationId} / ${row.executionAuthority} / contextualOnly ${String(row.contextualOnly)} / ${row.moveSha256.slice(0, 12)}…`,
  );
}

async function runProvenanceQuery(): Promise<void> {
  const queryId = provenanceQuery.value;
  if (!isProvenanceQueryId(queryId)) {
    renderProvenanceItems(["Only the three bounded named-query contracts are permitted."]);
    provenanceStatus.dataset.state = "invalid";
    provenanceStatus.textContent = `Unsupported query contract: ${queryId}`;
    return;
  }
  const identifier = provenanceIdentifier.value.trim();
  const parameters: Record<string, unknown> = { [provenanceParameterName(queryId)]: identifier };
  try {
    const response = await fetchNamedQuery(queryId, parameters);
    const items = formatProvenanceResponse(queryId, response);
    if (items.length === 0) {
      renderProvenanceItems(["No provenance path is available for this logical identifier."]);
      provenanceStatus.dataset.state = "empty";
      provenanceStatus.textContent = "No evidence path is available; nothing is inferred.";
      return;
    }
    renderProvenanceItems(items);
    provenanceStatus.dataset.state = "success";
    provenanceStatus.textContent =
      `Ordered evidence path / ${response.queryId} / projection ${response.projectionFingerprint.slice(0, 12)}…`;
  } catch (error) {
    renderProvenanceItems([]);
    const detail = error instanceof Error ? error.message : "Unknown provenance query error";
    provenanceStatus.dataset.state =
      error instanceof ProvenanceCompatibilityError
        ? "incompatible"
        : error instanceof ProvenanceExplainError
          ? "invalid"
          : "unavailable";
    provenanceStatus.textContent = `Provenance query failed: ${detail}`;
  }
}

function factLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (character) => character.toUpperCase());
}

function renderObservationFacts(container: HTMLElement, observation: ObservationView): void {
  const facts = document.createElement("dl");
  facts.className = "field-derivation-facts";
  for (const [key, value] of Object.entries(observation.facts)) {
    const row = document.createElement("div");
    const term = document.createElement("dt");
    term.textContent = factLabel(key);
    const description = document.createElement("dd");
    description.textContent = JSON.stringify(value).replace(/"/g, "");
    row.append(term, description);
    facts.append(row);
  }
  container.append(facts);
}

function renderFieldDerivation(): void {
  fieldDerivationAuthorityNote.textContent = FIELD_DERIVATION_BUNDLE.authorityNote;
  fieldDerivationList.replaceChildren(
    ...observationViews().map((observation) => {
      const card = document.createElement("article");
      card.className = "field-derivation-card";
      card.dataset.observation = observation.id;
      card.dataset.verdict = observation.verdict;

      const heading = document.createElement("div");
      heading.className = "field-derivation-card-heading";
      const title = document.createElement("h3");
      title.textContent = `${observation.id} / ${observation.title}`;
      const badge = document.createElement("span");
      badge.className = "verdict-badge";
      badge.dataset.verdict = observation.verdict;
      badge.textContent = observation.verdictLabel;
      const authority = document.createElement("span");
      authority.className = "authority-label";
      authority.textContent = observation.authorityLabel;
      heading.append(title, badge, authority);

      const provenance = document.createElement("p");
      provenance.className = "field-derivation-provenance";
      provenance.textContent =
        `Source: ${observation.sourceArtifact} / Receipt: ${observation.receiptArtifact} (${observation.receiptChecks} checks)`;

      card.append(heading, provenance);
      renderObservationFacts(card, observation);
      return card;
    }),
  );
}

function photonicRecordEntry(record: PhotonicOverlayRecord): HTMLElement {
  const entry = document.createElement("article");
  entry.className = "photonic-entry";
  entry.dataset.stateId = String(record.stateId);
  entry.dataset.variant = record.variant;

  const heading = document.createElement("div");
  heading.className = "photonic-entry-heading";
  const title = document.createElement("h3");
  title.textContent = `${record.name} / ${record.office} / ${record.tier}`;
  const band = document.createElement("span");
  band.className = "photonic-band";
  band.textContent = `${record.variant} / ${record.forte}`;
  heading.append(title, band);

  const measurements = document.createElement("dl");
  measurements.className = "photonic-measurements";
  const rows: Array<[string, string]> = [
    ["Derived wavelength", `${record.derivedWavelengthNm.toFixed(4)} nm`],
    ["Spectral band", `${record.bandMetadata.numericBandNm[0].toFixed(2)} – ${record.bandMetadata.numericBandNm[1].toFixed(2)} nm`],
    ["Photonic compression", record.photonicCompression === null ? "null (variant A)" : record.photonicCompression.toFixed(6)],
    ["Channels", record.channels.join(" / ")],
    ["Hue", record.hue === null ? "none (forbidden for Variant A)" : record.hue.toFixed(2)],
    ["Rendering hint", record.bandMetadata.renderingHint],
  ];
  for (const [term, description] of rows) {
    const row = document.createElement("div");
    const dt = document.createElement("dt");
    dt.textContent = term;
    const dd = document.createElement("dd");
    dd.textContent = description;
    row.append(dt, dd);
    measurements.append(row);
  }

  entry.append(heading, measurements);
  return entry;
}

function renderPhotonicOverlay(): void {
  const selected = photonicVariant.value;
  if (selected !== VARIANT_A && selected !== VARIANT_B) {
    photonicList.replaceChildren();
    photonicChannelStatus.dataset.state = "off";
    photonicChannelStatus.textContent = "Overlay off. Candidate evidence is never shown by default.";
    return;
  }
  const records = PHOTONIC_OVERLAY_BUNDLE.records
    .filter((record) => record.variant === selected)
    .slice()
    .sort((left, right) => left.tier.localeCompare(right.tier) || left.stateId - right.stateId);
  photonicList.replaceChildren(...records.map(photonicRecordEntry));
  const variantA = selected === VARIANT_A;
  photonicChannelStatus.dataset.state = variantA ? "variant-a" : "variant-b";
  photonicChannelStatus.textContent = variantA
    ? "Variant A active: luminance, grain, and pulse only — hue is forbidden and UV wavelengths stay invisible."
    : "Variant B active: in-hull wavelengths may modulate hue. Candidate evidence remains planning evidence.";
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
  const next = buildAnchorShareUrl(anchorId, window.location.href);
  window.history.replaceState(null, "", next);
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
  renderScenePresentation(node);

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
  renderEvidenceBlock(node);
  renderAudioPalette(audioEngine.select(node, session.courtPresentationPosition, selectionSource === "user"));
  // The engine stops any progression on node change; re-issue it for the new
  // anchor when the harmony toggle is still engaged.
  if (harmonyEnabled && audioEngine.snapshot().transport === "playing" && !audioEngine.snapshot().visualOnly) {
    startHarmonyProgression();
  }
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
      renderScenePresentation(selectedNode);
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
      : `Started a local route at ${source.state.name}. Select a declared parallel move.`,
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
    storageNotice ? `The local route was cleared. ${storageNotice}` : "The local route was cleared.",
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
  const appliedOperatorId = result.move.id.split(":")[0] ?? "move";
  setMoveStatus(
    `Applied ${appliedOperatorId} locally: ${nodeLabel(nodesById.get(result.move.sourceId))} -> ${target.state.name}.`,
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
  try {
    evidenceRecords = createEvidenceBundleIndex(
      response,
      EVIDENCE_BUNDLE,
      LEGAL_MOVE_CATALOG.catalogFingerprint,
    );
    evidenceBundleNotice = undefined;
  } catch (error) {
    evidenceRecords = undefined;
    if (error instanceof EvidenceBundleCompatibilityError) {
      evidenceBundleNotice = `Evidence bundle unavailable: ${error.message}`;
    } else {
      const detail = error instanceof Error ? error.message : "Unknown evidence-bundle compatibility error";
      evidenceBundleNotice = `Evidence bundle unavailable: ${detail}`;
    }
  }
  progressStorage = browserStorage();
  audioEngine.setVoicingMode(loadVoicingMode(progressStorage));
  audioVoicingSelect.value = audioEngine.currentVoicingMode();
  harmonySize.value = String(loadHarmonySize(progressStorage));
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
  setupHelpTooltips();

  sceneCount.textContent = `${nodes.length} / ${response.nodeCount} anchors`;
  indexCount.textContent = String(nodes.length).padStart(2, "0");
  setApiHealth(`Live projection / ${response.schemaVersion}`, "ready");
  clearInspector();
  clearScenePresentation();
  renderSceneQuality();
  renderSessionHud();
  renderMoveConsole();
  renderCourtSurface();
  renderFieldDerivation();
  photonicDisclaimer.textContent = OVERLAY_DISCLAIMER;
  renderPhotonicOverlay();
  showOnboardingIfNeeded();

  if (supportsWebGl()) {
    try {
      scene = createOrreryScene({
        canvas,
        labelRoot,
        nodes,
        initialQuality: selectedSceneQuality(),
        onSelect: (node) => selectAnchor(node, "user"),
      });
      renderSceneQuality();
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
  harmonyEnabled = false;
  renderHarmonyReadout([]);
  updateAnchorUrl(null);
  clearInspector();
  clearScenePresentation();
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
copyAnchorLinkButton.addEventListener("click", () => void copyAnchorLink());
shareAnchorLinkButton.addEventListener("click", () => void shareAnchorLink());
resetOrreryButton.addEventListener("click", resetLocalOrrery);
onboardingDismissButton.addEventListener("click", dismissOnboarding);
onboardingStartLydianButton.addEventListener("click", () => {
  dismissOnboarding();
  const lydian = nodesById.get(2773);
  if (lydian) {
    selectAnchor(lydian, "user");
    lydianEntryButton()?.focus();
  } else {
    anchorList.querySelector<HTMLButtonElement>(".anchor-button")?.focus();
  }
  announceSession("Started at Lydian. Enable sound, change Court, then start a local route.");
});

function lydianEntryButton(): HTMLButtonElement | null {
  return anchorButtons.get(2773) ?? null;
}

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

audioVoicingSelect.addEventListener("change", () => {
  const value = audioVoicingSelect.value;
  if (!isAudioVoicingMode(value)) {
    return;
  }
  const selection = audioEngine.setVoicingMode(value);
  saveVoicingMode(progressStorage, value);
  if (selection) {
    renderAudioPalette(selection);
  }
});

harmonySize.addEventListener("change", () => {
  const size = selectedHarmonySize();
  saveHarmonySize(progressStorage, size);
  if (harmonyEnabled && audioEngine.snapshot().progression) {
    startHarmonyProgression();
    announceSession(`Intra-node harmony switched to ${size === 2 ? "dyads" : size === 3 ? "trichords" : "tetrachords"}.`);
  }
});

harmonyToggle.addEventListener("click", () => {
  if (audioEngine.snapshot().progression || harmonyEnabled) {
    stopHarmonyProgression("Intra-node progression stopped.");
    return;
  }
  startHarmonyProgression();
  announceSession(
    audioEngine.snapshot().progression
      ? "Intra-node progression started. Chord amplitude follows Chaldean degree gravity."
      : "Progression unavailable — select an anchor with sound playing.",
  );
});

harmonyReseed.addEventListener("click", () => {
  if (!audioEngine.snapshot().progression) {
    return;
  }
  const seed = (Date.now() % 0x7fff_ffff) + 1;
  startHarmonyProgression(seed);
  announceSession("Intra-node progression reseeded.");
});

initializeCourtControls();
audioEngine.subscribe(renderAudioState);
provenanceRun.addEventListener("click", () => void runProvenanceQuery());
photonicVariant.addEventListener("change", renderPhotonicOverlay);
sceneQualityMode.addEventListener("change", () => {
  renderSceneQuality();
});
window.addEventListener("resize", () => {
  if (sceneQualityMode.value === "auto") {
    renderSceneQuality();
  }
});
window.addEventListener("pagehide", () => {
  scene?.dispose();
  audioEngine.dispose();
});

void start();
