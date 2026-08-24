import { fetchNodes } from "./api";
import { createOrreryScene, type OrreryScene } from "./scene";
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
const selectedWavelength = requiredElement<HTMLElement>("#selected-wavelength");
const selectedWeight = requiredElement<HTMLElement>("#selected-weight");
const selectedProfile = requiredElement<HTMLElement>("#selected-profile");
const selectedLandforms = requiredElement<HTMLUListElement>("#selected-landforms");

let scene: OrreryScene | undefined;
let selectedId: number | undefined;
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

function showProjectionError(error: unknown): void {
  const detail = error instanceof Error ? error.message : "Unknown projection error";
  apiStatus.textContent = "Projection unavailable";
  apiStatus.dataset.state = "error";
  sceneMessage.hidden = false;
  sceneMessage.textContent = `The live anchor projection could not be loaded: ${detail}`;
  sceneMessage.dataset.state = "error";
  canvas.hidden = true;
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

function selectAnchor(node: OrreryNode): void {
  selectedId = node.state.stateId;
  scene?.select(node);

  for (const [stateId, button] of anchorButtons) {
    const isSelected = stateId === selectedId;
    button.classList.toggle("is-selected", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
  }

  const office = node.resolution.office;
  inspectorHeading.textContent = node.state.name;
  selectedIdentity.textContent = `${node.state.nodeId} / ${node.state.tier} / ${node.state.forteFamily}`;
  selectedGovernor.textContent = office;
  selectedGovernor.style.color = GOVERNOR_META[office].color;
  selectedWavelength.textContent = `${node.photonic.representativeWavelengthNm.toFixed(1)} nm`;
  selectedWeight.textContent = formatRatio(node.scopedHarmonicDescriptor.weightedProjection);
  selectedProfile.textContent = node.canonicalProfile.profileVersion;
  renderLandforms(node.canonicalProfile.domainReferences.landforms);
}

function renderAnchorIndex(nodes: OrreryNode[]): void {
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
    showProjectionError(error);
    return;
  }

  const { nodes } = response;
  renderAnchorIndex(nodes);

  sceneCount.textContent = `${nodes.length} / ${response.nodeCount} anchors`;
  indexCount.textContent = String(nodes.length).padStart(2, "0");
  apiStatus.textContent = `Live projection / ${response.schemaVersion}`;
  apiStatus.dataset.state = "ready";

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

  selectAnchor(nodes[0]);
}

void start();
