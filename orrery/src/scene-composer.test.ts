import { describe, expect, it } from "vitest";

import { courtPositionById } from "./court";
import {
  SCENE_RENDERER_VERSION,
  composeSceneParameters,
  sceneRenderBudget,
  sceneSeed,
} from "./scene-composer";
import type { OrreryNode } from "./types";

function node(
  stateId: number,
  name: string,
  tier: OrreryNode["state"]["tier"],
  office: OrreryNode["resolution"]["office"],
  pitchClasses: number[],
  intervalVector: number[],
): OrreryNode {
  return {
    state: {
      stateId,
      pitchMask: stateId,
      pitchClasses,
      intervalVector,
      chirality: "achiral",
      nodeId: `scale:${stateId}`,
      name,
      forteFamily: tier === "A0" ? "7-35" : tier === "A1" ? "7-34" : "7-33",
      tier,
      role: "anchor",
    },
    resolution: { office, officeBearing: true },
    photonic: {
      photonicId: `photonic:${office.toLowerCase()}`,
      office,
      representativeWavelengthNm: 500,
      photonicCompression: 0.5,
    },
    canonicalProfile: {
      profileId: `profile:${office.toLowerCase()}`,
      profileVersion: "0.1.1",
      office,
      domainReferences: { landforms: ["ridge", "basin", "scree"] },
    },
    scopedHarmonicDescriptor: {
      coordinateId: "harmonic.CH_A012_q_v1",
      status: "admitted_scoped_A012",
      stateGovernor: office,
      weightedProjection: { numerator: 1, denominator: 407 },
    },
  };
}

const lydian = node(2773, "Lydian", "A0", "Sun", [0, 2, 4, 6, 7, 9, 11], [2, 5, 4, 3, 6, 1]);
const acoustic = node(1749, "Acoustic", "A1", "Moon", [0, 2, 4, 6, 7, 9, 10], [2, 5, 4, 4, 4, 2]);
const lydianMinor = node(1493, "Lydian Minor", "A2", "Mars", [0, 2, 4, 6, 7, 8, 10], [2, 6, 2, 6, 2, 3]);

describe("Harmonic Orrery scene composer", () => {
  it("uses only state, Court position, and renderer version for the deterministic seed", () => {
    expect(sceneSeed(2773, "C0")).toBe(sceneSeed(2773, "C0"));
    expect(sceneSeed(2773, "C0")).not.toBe(sceneSeed(2773, "C1"));
    expect(sceneSeed(2773, "C0")).not.toBe(sceneSeed(2773, "C0", "orrery-scene.v2"));
  });

  it("builds a stable A0 parameter packet", () => {
    expect(composeSceneParameters(lydian, courtPositionById("C0"))).toMatchInlineSnapshot(`
      {
        "composition": {
          "camera": {
            "azimuth": 1.351,
            "distance": 12.7468,
            "elevation": 0.7428,
          },
          "lighting": {
            "accentIntensity": 5.7128,
            "accentOffset": [
              0.2618,
              2.8241,
              -1.2199,
            ],
            "keyIntensity": 11.5847,
            "wavelengthAccent": 0.3333,
          },
          "mesh": {
            "detail": 3,
            "radialProfile": [
              1.2596,
              0.3823,
              1.1614,
              0.4423,
              1.3493,
              0.3672,
              1.152,
              1.2818,
              0.4035,
              1.1845,
              0.3615,
              1.1549,
            ],
            "radius": 1.3,
          },
          "particles": {
            "phase": 0.2156,
            "pointSize": 0.0565,
            "spread": 2.4946,
          },
          "surface": {
            "intervalBands": [
              0.43,
              0.673,
              0.616,
              0.559,
              0.802,
              0.445,
            ],
            "rotation": 0.8242,
            "twist": 0,
          },
        },
        "courtPositionId": "C0",
        "rendererVersion": "orrery-scene.v1",
        "seed": 3582367980,
        "source": {
          "chirality": "achiral",
          "courtMask": 661,
          "courtPitchClasses": [
            0,
            2,
            4,
            7,
            9,
          ],
          "intervalVector": [
            2,
            5,
            4,
            3,
            6,
            1,
          ],
          "landformReference": "scree",
          "officeColor": "#ff4444",
          "pitchClasses": [
            0,
            2,
            4,
            6,
            7,
            9,
            11,
          ],
          "pitchMask": 2773,
          "representativeWavelengthNm": 500,
          "retainedPitchClasses": [
            0,
            2,
            4,
            7,
            9,
          ],
          "tier": "A0",
        },
        "stateId": 2773,
      }
    `);
  });

  it("builds stable representative A1 and A2 parameter packets", () => {
    expect(composeSceneParameters(acoustic, courtPositionById("C2"))).toMatchInlineSnapshot(`
      {
        "composition": {
          "camera": {
            "azimuth": 4.6492,
            "distance": 13.5348,
            "elevation": 0.7802,
          },
          "lighting": {
            "accentIntensity": 5.8861,
            "accentOffset": [
              -1.3884,
              3.4032,
              -1.4246,
            ],
            "keyIntensity": 10.8438,
            "wavelengthAccent": 0.3333,
          },
          "mesh": {
            "detail": 2,
            "radialProfile": [
              1.314,
              0.4562,
              1.0895,
              0.4747,
              0.9529,
              0.3685,
              1.0269,
              1.1007,
              0.3976,
              1.0269,
              1.2105,
              0.3838,
            ],
            "radius": 1.1,
          },
          "particles": {
            "phase": 1.4127,
            "pointSize": 0.0446,
            "spread": 2.3282,
          },
          "surface": {
            "intervalBands": [
              0.43,
              0.673,
              0.616,
              0.634,
              0.652,
              0.52,
            ],
            "rotation": 2.3622,
            "twist": 0,
          },
        },
        "courtPositionId": "C2",
        "rendererVersion": "orrery-scene.v1",
        "seed": 4247875860,
        "source": {
          "chirality": "achiral",
          "courtMask": 1189,
          "courtPitchClasses": [
            0,
            2,
            5,
            7,
            10,
          ],
          "intervalVector": [
            2,
            5,
            4,
            4,
            4,
            2,
          ],
          "landformReference": "ridge",
          "officeColor": "#ff8c00",
          "pitchClasses": [
            0,
            2,
            4,
            6,
            7,
            9,
            10,
          ],
          "pitchMask": 1749,
          "representativeWavelengthNm": 500,
          "retainedPitchClasses": [
            0,
            2,
            7,
            10,
          ],
          "tier": "A1",
        },
        "stateId": 1749,
      }
    `);
    expect(composeSceneParameters(lydianMinor, courtPositionById("C4"))).toMatchInlineSnapshot(`
      {
        "composition": {
          "camera": {
            "azimuth": 3.8957,
            "distance": 14.6354,
            "elevation": 0.585,
          },
          "lighting": {
            "accentIntensity": 5.7476,
            "accentOffset": [
              1.4824,
              2.401,
              -0.5609,
            ],
            "keyIntensity": 9.9615,
            "wavelengthAccent": 0.3333,
          },
          "mesh": {
            "detail": 1,
            "radialProfile": [
              1.2985,
              0.4292,
              1.1585,
              0.4309,
              1.0241,
              0.3677,
              1.1469,
              0.9832,
              1.087,
              0.354,
              1.0873,
              0.4193,
            ],
            "radius": 0.94,
          },
          "particles": {
            "phase": 5.4053,
            "pointSize": 0.0544,
            "spread": 1.8092,
          },
          "surface": {
            "intervalBands": [
              0.43,
              0.748,
              0.466,
              0.784,
              0.502,
              0.595,
            ],
            "rotation": 5.1374,
            "twist": 0,
          },
        },
        "courtPositionId": "C4",
        "rendererVersion": "orrery-scene.v1",
        "seed": 1246870128,
        "source": {
          "chirality": "achiral",
          "courtMask": 1321,
          "courtPitchClasses": [
            0,
            3,
            5,
            8,
            10,
          ],
          "intervalVector": [
            2,
            6,
            2,
            6,
            2,
            3,
          ],
          "landformReference": "ridge",
          "officeColor": "#ffd700",
          "pitchClasses": [
            0,
            2,
            4,
            6,
            7,
            8,
            10,
          ],
          "pitchMask": 1493,
          "representativeWavelengthNm": 500,
          "retainedPitchClasses": [
            0,
            8,
            10,
          ],
          "tier": "A2",
        },
        "stateId": 1493,
      }
    `);
  });

  it("keeps quality cost outside the semantic packet and landforms inside their reference pool", () => {
    const packet = composeSceneParameters(lydian, courtPositionById("C1"));

    expect(packet.rendererVersion).toBe(SCENE_RENDERER_VERSION);
    expect(lydian.canonicalProfile.domainReferences.landforms).toContain(packet.source.landformReference);
    expect(packet.source.chirality).toBe("achiral");
    expect(packet.composition.surface.twist).toBe(0);
    expect(sceneRenderBudget("full").particleCount).toBeGreaterThan(sceneRenderBudget("reduced").particleCount);
    expect(sceneRenderBudget("full").pixelRatioCap).toBeGreaterThan(sceneRenderBudget("reduced").pixelRatioCap);
  });
});
