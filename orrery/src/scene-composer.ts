import type { CourtPresentation } from "./court";
import { GOVERNOR_META, type OrreryNode } from "./types";

export const SCENE_RENDERER_VERSION = "orrery-scene.v1";

export type SceneQuality = "full" | "reduced";

export interface SceneRenderBudget {
  pixelRatioCap: number;
  particleCount: number;
  surfaceSegments: number;
}

export interface SceneParameters {
  rendererVersion: string;
  seed: number;
  stateId: number;
  courtPositionId: CourtPresentation["positionId"];
  source: {
    officeColor: string;
    tier: OrreryNode["state"]["tier"];
    chirality: OrreryNode["state"]["chirality"];
    pitchMask: number;
    pitchClasses: number[];
    intervalVector: number[];
    courtMask: number;
    courtPitchClasses: number[];
    retainedPitchClasses: number[];
    representativeWavelengthNm: number;
    landformReference: string;
  };
  composition: {
    mesh: {
      radius: number;
      detail: number;
      radialProfile: number[];
    };
    particles: {
      phase: number;
      spread: number;
      pointSize: number;
    };
    lighting: {
      keyIntensity: number;
      accentIntensity: number;
      accentOffset: [number, number, number];
      wavelengthAccent: number;
    };
    surface: {
      intervalBands: number[];
      twist: number;
      rotation: number;
    };
    camera: {
      distance: number;
      elevation: number;
      azimuth: number;
    };
  };
}

function hashSceneSeed(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

function tierValue<T>(tier: OrreryNode["state"]["tier"], values: Record<OrreryNode["state"]["tier"], T>): T {
  return values[tier];
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

export function sceneSeed(
  stateId: number,
  courtPositionId: CourtPresentation["positionId"],
  rendererVersion = SCENE_RENDERER_VERSION,
): number {
  return hashSceneSeed(`${rendererVersion}|${stateId}|${courtPositionId}`);
}

export function sceneRenderBudget(quality: SceneQuality): SceneRenderBudget {
  return quality === "reduced"
    ? { pixelRatioCap: 1.25, particleCount: 160, surfaceSegments: 24 }
    : { pixelRatioCap: 2, particleCount: 480, surfaceSegments: 48 };
}

export function composeSceneParameters(
  node: OrreryNode,
  court: CourtPresentation,
  rendererVersion = SCENE_RENDERER_VERSION,
): SceneParameters {
  const seed = sceneSeed(node.state.stateId, court.positionId, rendererVersion);
  const random = seededRandom(seed);
  const pitchClasses = [...node.state.pitchClasses];
  const retainedPitchClasses = pitchClasses.filter((pitchClass) => (court.pitchMask & (1 << pitchClass)) !== 0);
  const radialProfile = Array.from({ length: 12 }, (_value, pitchClass) => {
    const inState = pitchClasses.includes(pitchClass);
    const retainedByCourt = retainedPitchClasses.includes(pitchClass);
    const base = inState ? 0.88 + random() * 0.28 : 0.34 + random() * 0.16;
    return Number((retainedByCourt ? base + 0.2 : base).toFixed(4));
  });
  const landforms = node.canonicalProfile.domainReferences.landforms;
  const landformReference = landforms[Math.floor(random() * landforms.length)] ?? landforms[0];
  const wavelengthAccent = Number(
    clamp((node.photonic.representativeWavelengthNm - 400) / 300, 0, 1).toFixed(4),
  );
  const tier = node.state.tier;

  return {
    rendererVersion,
    seed,
    stateId: node.state.stateId,
    courtPositionId: court.positionId,
    source: {
      officeColor: GOVERNOR_META[node.resolution.office].color,
      tier,
      chirality: node.state.chirality,
      pitchMask: node.state.pitchMask,
      pitchClasses,
      intervalVector: [...node.state.intervalVector],
      courtMask: court.pitchMask,
      courtPitchClasses: [...court.pitchClasses],
      retainedPitchClasses,
      representativeWavelengthNm: node.photonic.representativeWavelengthNm,
      landformReference,
    },
    composition: {
      mesh: {
        radius: tierValue(tier, { A0: 1.3, A1: 1.1, A2: 0.94 }),
        detail: tierValue(tier, { A0: 3, A1: 2, A2: 1 }),
        radialProfile,
      },
      particles: {
        phase: Number((random() * Math.PI * 2).toFixed(4)),
        spread: Number((tierValue(tier, { A0: 2.35, A1: 2.05, A2: 1.8 }) + random() * 0.35).toFixed(4)),
        pointSize: Number((0.042 + random() * 0.028).toFixed(4)),
      },
      lighting: {
        keyIntensity: Number((7 + tierValue(tier, { A0: 3, A1: 2, A2: 1 }) + random() * 2).toFixed(4)),
        accentIntensity: Number((3 + wavelengthAccent * 5 + random() * 1.5).toFixed(4)),
        accentOffset: [
          Number((random() * 3 - 1.5).toFixed(4)),
          Number((1.6 + random() * 2.4).toFixed(4)),
          Number((random() * 3 - 1.5).toFixed(4)),
        ],
        wavelengthAccent,
      },
      surface: {
        intervalBands: node.state.intervalVector.map((interval, index) =>
          Number((0.28 + interval * 0.075 + index * 0.018).toFixed(4)),
        ),
        twist: node.state.chirality === "chiral" ? (random() < 0.5 ? -1 : 1) : 0,
        rotation: Number((random() * Math.PI * 2).toFixed(4)),
      },
      camera: {
        distance: Number((tierValue(tier, { A0: 12.4, A1: 13.2, A2: 14 }) + random() * 0.7).toFixed(4)),
        elevation: Number((0.5 + random() * 0.34).toFixed(4)),
        azimuth: Number((random() * Math.PI * 2).toFixed(4)),
      },
    },
  };
}
