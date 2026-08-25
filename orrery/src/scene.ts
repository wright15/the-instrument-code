import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import {
  sceneRenderBudget,
  type SceneParameters,
  type SceneQuality,
  type SceneRenderBudget,
} from "./scene-composer";
import { layoutAnchors, type LayoutAnchor } from "./layout";
import { GOVERNOR_META, type OrreryNode } from "./types";

interface SceneMesh {
  anchor: LayoutAnchor;
  mesh: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;
  label: HTMLSpanElement;
}

interface SelectedPresentation {
  sceneMesh: SceneMesh;
  parameters: SceneParameters;
}

export interface OrreryScene {
  select(node: OrreryNode, parameters: SceneParameters): void;
  clearSelection(): void;
  setQuality(quality: SceneQuality): void;
  dispose(): void;
}

interface CreateSceneOptions {
  canvas: HTMLCanvasElement;
  labelRoot: HTMLElement;
  nodes: OrreryNode[];
  initialQuality?: SceneQuality;
  onSelect: (node: OrreryNode) => void;
}

function geometryForTier(tier: OrreryNode["state"]["tier"]): THREE.BufferGeometry {
  if (tier === "A0") {
    return new THREE.IcosahedronGeometry(0.42, 1);
  }
  if (tier === "A1") {
    return new THREE.OctahedronGeometry(0.46, 0);
  }
  return new THREE.TetrahedronGeometry(0.5, 0);
}

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

function makeStarField(): THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial> {
  const random = seededRandom(0x0aa3e7);
  const positions = new Float32Array(1100 * 3);
  const colors = new Float32Array(1100 * 3);
  const cold = new THREE.Color("#76a7ff");
  const warm = new THREE.Color("#e8b878");

  for (let index = 0; index < 1100; index += 1) {
    const radius = 17 + random() * 30;
    const theta = random() * Math.PI * 2;
    const phi = Math.acos(2 * random() - 1);
    const cursor = index * 3;
    positions[cursor] = radius * Math.sin(phi) * Math.cos(theta);
    positions[cursor + 1] = radius * Math.cos(phi);
    positions[cursor + 2] = radius * Math.sin(phi) * Math.sin(theta);

    const color = random() > 0.76 ? warm : cold;
    const brightness = 0.35 + random() * 0.65;
    colors[cursor] = color.r * brightness;
    colors[cursor + 1] = color.g * brightness;
    colors[cursor + 2] = color.b * brightness;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  return new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      size: 0.055,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.72,
      vertexColors: true,
      depthWrite: false,
    }),
  );
}

function makeTierOrbit(radius: number, height: number): THREE.LineLoop<THREE.BufferGeometry, THREE.LineBasicMaterial> {
  const curve = new THREE.EllipseCurve(0, 0, radius, radius, 0, Math.PI * 2, false, 0);
  const points = curve.getPoints(160).map((point) => new THREE.Vector3(point.x, height, point.y));
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color: "#47607d",
    transparent: true,
    opacity: 0.36,
  });

  return new THREE.LineLoop(geometry, material);
}

function disposeObject(object: THREE.Object3D): void {
  object.traverse((child) => {
    const mesh = child as THREE.Mesh<THREE.BufferGeometry, THREE.Material | THREE.Material[]>;
    mesh.geometry?.dispose();
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    materials.filter(Boolean).forEach((material) => material.dispose());
  });
}

function clearGroup(group: THREE.Group): void {
  for (const child of [...group.children]) {
    group.remove(child);
    disposeObject(child);
  }
}

function makeParticleCloud(
  parameters: SceneParameters,
  budget: SceneRenderBudget,
  color: THREE.Color,
): THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial> {
  const random = seededRandom(parameters.seed ^ 0x9e3779b9);
  const positions = new Float32Array(budget.particleCount * 3);
  const colors = new Float32Array(budget.particleCount * 3);
  const pale = new THREE.Color("#dceaff");

  for (let index = 0; index < budget.particleCount; index += 1) {
    const radius = parameters.composition.mesh.radius + random() * parameters.composition.particles.spread;
    const theta = parameters.composition.particles.phase + random() * Math.PI * 2;
    const elevation = (random() - 0.5) * Math.PI * 0.72;
    const cursor = index * 3;
    positions[cursor] = Math.cos(theta) * Math.cos(elevation) * radius;
    positions[cursor + 1] = Math.sin(elevation) * radius * 0.7;
    positions[cursor + 2] = Math.sin(theta) * Math.cos(elevation) * radius;

    const blend = 0.2 + random() * 0.58;
    const particleColor = color.clone().lerp(pale, blend);
    colors[cursor] = particleColor.r;
    colors[cursor + 1] = particleColor.g;
    colors[cursor + 2] = particleColor.b;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      size: parameters.composition.particles.pointSize,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.8,
      vertexColors: true,
      depthWrite: false,
    }),
  );
}

function makeSurfacePattern(
  parameters: SceneParameters,
  budget: SceneRenderBudget,
  color: THREE.Color,
): THREE.Group {
  const pattern = new THREE.Group();
  const retainedPitchClasses = new Set(parameters.source.retainedPitchClasses);
  const spokeOrigin = new THREE.Vector3(0, 0, 0);

  parameters.composition.mesh.radialProfile.forEach((profile, pitchClass) => {
    const angle = (pitchClass / 12) * Math.PI * 2;
    const radius = profile * parameters.composition.mesh.radius * 1.12;
    const endpoint = new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
    const geometry = new THREE.BufferGeometry().setFromPoints([spokeOrigin, endpoint]);
    const material = new THREE.LineBasicMaterial({
      color: retainedPitchClasses.has(pitchClass) ? color : "#55708f",
      transparent: true,
      opacity: retainedPitchClasses.has(pitchClass) ? 0.88 : 0.28,
    });
    pattern.add(new THREE.Line(geometry, material));
  });

  parameters.composition.surface.intervalBands.forEach((band, index) => {
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.09 + index * 0.025,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(band * parameters.composition.mesh.radius, 0.012, 4, budget.surfaceSegments),
      material,
    );
    ring.rotation.x = Math.PI / 2;
    ring.rotation.z = parameters.composition.surface.rotation + index * 0.24;
    pattern.add(ring);
  });

  return pattern;
}

function addPresentation(
  group: THREE.Group,
  parameters: SceneParameters,
  budget: SceneRenderBudget,
): void {
  const color = new THREE.Color(parameters.source.officeColor);
  const accentColor = color.clone().lerp(new THREE.Color("#e7f1ff"), 0.2 + parameters.composition.lighting.wavelengthAccent * 0.25);
  const mesh = new THREE.Mesh(
    new THREE.IcosahedronGeometry(parameters.composition.mesh.radius, parameters.composition.mesh.detail),
    new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.44,
      metalness: 0.42,
      roughness: 0.3,
      transparent: true,
      opacity: 0.78,
    }),
  );
  mesh.rotation.y = parameters.composition.surface.rotation;
  mesh.rotation.z = parameters.composition.surface.twist * 0.18;
  group.add(mesh);
  group.add(makeSurfacePattern(parameters, budget, accentColor));
  group.add(makeParticleCloud(parameters, budget, accentColor));

  const keyLight = new THREE.PointLight(color, parameters.composition.lighting.keyIntensity, 10, 2);
  keyLight.position.set(1.5, 2.5, 1.5);
  const accentLight = new THREE.PointLight(accentColor, parameters.composition.lighting.accentIntensity, 8, 2);
  accentLight.position.fromArray(parameters.composition.lighting.accentOffset);
  group.add(keyLight, accentLight);
}

export function createOrreryScene({
  canvas,
  labelRoot,
  nodes,
  initialQuality = "full",
  onSelect,
}: CreateSceneOptions): OrreryScene {
  let quality = initialQuality;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, sceneRenderBudget(quality).pixelRatioCap));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  canvas.dataset.sceneQuality = quality;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2("#050914", 0.043);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(14.5, 11, 17.5);

  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 0, 0);
  controls.enablePan = false;
  controls.minDistance = 10;
  controls.maxDistance = 31;
  controls.enableDamping = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  controls.dampingFactor = 0.08;
  const initialCameraPosition = camera.position.clone();
  const initialControlsTarget = controls.target.clone();

  const ambient = new THREE.HemisphereLight("#8ba8df", "#020307", 1.3);
  const keyLight = new THREE.PointLight("#d8e6ff", 18, 31, 2);
  keyLight.position.set(2, 9, 5);
  const coreLight = new THREE.PointLight("#b8d7ff", 10, 13, 2.5);
  scene.add(ambient, keyLight, coreLight, makeStarField());

  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.95, 36, 24),
    new THREE.MeshStandardMaterial({
      color: "#102039",
      emissive: "#234c88",
      emissiveIntensity: 0.72,
      metalness: 0.8,
      roughness: 0.22,
    }),
  );
  scene.add(core);

  const axis = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.045, 8.5, 12),
    new THREE.MeshBasicMaterial({ color: "#5b7ca7", transparent: true, opacity: 0.65 }),
  );
  scene.add(axis);

  const ringData = [
    [4.6, 1.55],
    [7.6, 0],
    [11.2, -1.55],
  ] as const;
  ringData.forEach(([radius, height]) => scene.add(makeTierOrbit(radius, height)));

  const group = new THREE.Group();
  const presentationGroup = new THREE.Group();
  scene.add(group, presentationGroup);

  const sceneMeshes: SceneMesh[] = layoutAnchors(nodes).map((anchor) => {
    const color = GOVERNOR_META[anchor.node.resolution.office].color;
    const material = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.28,
      metalness: 0.72,
      roughness: 0.24,
    });
    const mesh = new THREE.Mesh(geometryForTier(anchor.node.state.tier), material);
    mesh.position.set(anchor.x, anchor.y, anchor.z);
    mesh.userData.stateId = anchor.node.state.stateId;
    group.add(mesh);

    const label = document.createElement("span");
    label.className = `anchor-label anchor-label-${anchor.node.state.tier.toLowerCase()}`;
    label.textContent = `${GOVERNOR_META[anchor.node.resolution.office].shortLabel} ${anchor.node.state.tier}`;
    labelRoot.append(label);

    return { anchor, mesh, label };
  });

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let selectedId: number | undefined;
  let selectedPresentation: SelectedPresentation | undefined;
  let pointerDown: { x: number; y: number } | undefined;
  let frame = 0;

  const renderPresentation = (frameCamera = true): void => {
    clearGroup(presentationGroup);
    if (!selectedPresentation) {
      return;
    }

    const { sceneMesh, parameters } = selectedPresentation;
    presentationGroup.position.copy(sceneMesh.mesh.position);
    presentationGroup.rotation.set(0, parameters.composition.surface.rotation, parameters.composition.surface.twist * 0.18);
    addPresentation(presentationGroup, parameters, sceneRenderBudget(quality));

    if (frameCamera) {
      const direction = new THREE.Vector3(
        Math.cos(parameters.composition.camera.azimuth),
        parameters.composition.camera.elevation,
        Math.sin(parameters.composition.camera.azimuth),
      ).normalize();
      controls.target.copy(sceneMesh.mesh.position);
      camera.position.copy(sceneMesh.mesh.position).addScaledVector(direction, parameters.composition.camera.distance);
      controls.update();
    }
  };

  const select = (node: OrreryNode, parameters: SceneParameters): void => {
    const nextSceneMesh = sceneMeshes.find((item) => item.anchor.node.state.stateId === node.state.stateId);
    if (!nextSceneMesh || parameters.stateId !== node.state.stateId) {
      return;
    }

    selectedId = node.state.stateId;
    for (const sceneMesh of sceneMeshes) {
      const isSelected = sceneMesh.anchor.node.state.stateId === selectedId;
      sceneMesh.mesh.scale.setScalar(isSelected ? 1.48 : 1);
      sceneMesh.mesh.material.emissiveIntensity = isSelected ? 1.05 : 0.28;
      sceneMesh.label.classList.toggle("is-selected", isSelected);
    }
    selectedPresentation = { sceneMesh: nextSceneMesh, parameters };
    renderPresentation();
  };

  const clearSelection = (): void => {
    selectedId = undefined;
    selectedPresentation = undefined;
    for (const sceneMesh of sceneMeshes) {
      sceneMesh.mesh.scale.setScalar(1);
      sceneMesh.mesh.material.emissiveIntensity = 0.28;
      sceneMesh.label.classList.remove("is-selected");
    }
    clearGroup(presentationGroup);
    presentationGroup.position.set(0, 0, 0);
    presentationGroup.rotation.set(0, 0, 0);
    camera.position.copy(initialCameraPosition);
    controls.target.copy(initialControlsTarget);
    controls.update();
  };

  const setQuality = (nextQuality: SceneQuality): void => {
    if (quality === nextQuality) {
      return;
    }
    quality = nextQuality;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, sceneRenderBudget(quality).pixelRatioCap));
    canvas.dataset.sceneQuality = quality;
    renderPresentation(false);
  };

  const updateLabels = (): void => {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const position = new THREE.Vector3();

    for (const sceneMesh of sceneMeshes) {
      position.copy(sceneMesh.mesh.position).project(camera);
      const isVisible = position.z > -1 && position.z < 1;
      sceneMesh.label.hidden = !isVisible;
      if (isVisible) {
        const x = (position.x * 0.5 + 0.5) * width;
        const y = (-position.y * 0.5 + 0.5) * height;
        sceneMesh.label.style.transform = `translate(${x}px, ${y}px)`;
      }
    }
  };

  const render = (): void => {
    controls.update();
    updateLabels();
    renderer.render(scene, camera);
    frame = window.requestAnimationFrame(render);
  };

  const resize = (): void => {
    const { width, height } = canvas.getBoundingClientRect();
    if (width === 0 || height === 0) {
      return;
    }

    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };

  const pointerFromEvent = (event: PointerEvent): void => {
    const bounds = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
    pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
  };

  const onPointerDown = (event: PointerEvent): void => {
    pointerDown = { x: event.clientX, y: event.clientY };
  };

  const onPointerMove = (event: PointerEvent): void => {
    pointerFromEvent(event);
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(sceneMeshes.map((item) => item.mesh), false)[0];
    canvas.style.cursor = hit ? "pointer" : "grab";
  };

  const onPointerUp = (event: PointerEvent): void => {
    if (!pointerDown || Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y) > 5) {
      pointerDown = undefined;
      return;
    }

    pointerDown = undefined;
    pointerFromEvent(event);
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(sceneMeshes.map((item) => item.mesh), false)[0];
    const stateId = hit?.object.userData.stateId;
    const sceneMesh = sceneMeshes.find((item) => item.anchor.node.state.stateId === stateId);
    if (sceneMesh) {
      onSelect(sceneMesh.anchor.node);
    }
  };

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas.parentElement ?? canvas);
  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  controls.addEventListener("change", updateLabels);
  resize();
  render();

  return {
    select,
    clearSelection,
    setQuality,
    dispose(): void {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      controls.removeEventListener("change", updateLabels);
      controls.dispose();
      sceneMeshes.forEach(({ label }) => label.remove());
      disposeObject(scene);
      renderer.dispose();
    },
  };
}
