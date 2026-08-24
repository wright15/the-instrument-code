import { fetchNodes, ProjectionCompatibilityError } from "./api";
import { createOrreryScene, type OrreryScene } from "./scene";
import {
  clearSessionSelection,
  createSession,
  loadSession,
  parseUrlAnchorSelection,
  saveSession,
  selectSessionAnchor,
  sourceFromResponse,
  type OrrerySession,
  type StorageLike,
} from "./session";
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
const sessionSelected = requiredElement<HTMLElement>("#session-selected");
const sessionVisited = requiredElement<HTMLElement>("#session-visited");
const sessionCourt = requiredElement<HTMLElement>("#session-court");
const sessionApiHealth = requiredElement<HTMLElement>("#session-api-health");
const sessionMessage = requiredElement<HTMLElement>("#session-message");
const clearLinkSelectionButton = requiredElement<HTMLButtonElement>("#clear-link-selection");
const reloadProjectionButton = requiredElement<HTMLButtonElement>("#reload-projection");

let scene: OrreryScene | undefined;
let session: OrrerySession | undefined;
let progressStorage: StorageLike | undefined;
let nodesById = new Map<number, OrreryNode>();
const anchorButtons = new Map<number, HTMLButtonElement>();

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

function showProjectionUnavailable(error: unknown): void {
  const detail = error instanceof Error ? error.message : "Unknown projection error";
  setApiHealth("Projection unavailable", "error");
  sceneMessage.hidden = false;
  sceneMessage.textContent = `The live anchor projection could not be loaded: ${detail}`;
  sceneMessage.dataset.state = "error";
  canvas.hidden = true;
  setSessionNotice("The live anchor projection is unavailable. Reload to try again.", "reload");
}

function showProjectionIncompatible(error: unknown): void {
  const detail = error instanceof Error ? error.message : "Unknown projection contract error";
  setApiHealth("Projection update required", "error");
  sceneMessage.hidden = false;
  sceneMessage.textContent = `This browser cannot safely read the live anchor projection: ${detail}`;
  sceneMessage.dataset.state = "error";
  canvas.hidden = true;
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
  sessionCourt.textContent = "Not set / local-only";
}

function updateAnchorUrl(anchorId: number | null): void {
  const url = new URL(window.location.href);
  if (anchorId === null) {
    url.searchParams.delete("anchor");
  } else {
    url.searchParams.set("anchor", String(anchorId));
  }
  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
}

function selectAnchor(node: OrreryNode): void {
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
  renderSessionHud();
  updateAnchorUrl(node.state.stateId);
  setSessionNotice(saveSession(progressStorage, session));
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
      button.addEventListener("click", () => selectAnchor(node));
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
  nodesById = new Map(nodes.map((node) => [node.state.stateId, node]));
  const validAnchorIds = new Set(nodesById.keys());
  progressStorage = browserStorage();
  const loadedSession = loadSession(progressStorage, sourceFromResponse(response), validAnchorIds);
  session = loadedSession.session ?? createSession(sourceFromResponse(response));
  const urlSelection = parseUrlAnchorSelection(window.location.search, validAnchorIds);

  renderAnchorIndex(nodes);

  sceneCount.textContent = `${nodes.length} / ${response.nodeCount} anchors`;
  indexCount.textContent = String(nodes.length).padStart(2, "0");
  setApiHealth(`Live projection / ${response.schemaVersion}`, "ready");
  clearInspector();
  renderSessionHud();

  if (supportsWebGl()) {
    try {
      scene = createOrreryScene({
        canvas,
        labelRoot,
        nodes,
        onSelect: selectAnchor,
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
  updateAnchorUrl(null);
  clearInspector();
  renderSessionHud();
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

void start();
