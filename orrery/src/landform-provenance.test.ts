import { describe, expect, it } from "vitest";

import {
  OFFICE_SEED_STATE_IDS,
  landformPoolLabel,
  landformPoolNote,
  landformProvenance,
} from "./landform-provenance";
import type { Governor, OrreryNode } from "./types";

function node(office: Governor, tier: OrreryNode["state"]["tier"] = "A0"): OrreryNode {
  return {
    state: {
      stateId: 100,
      pitchMask: 100,
      pitchClasses: [0, 2, 4, 5, 7, 9, 11],
      intervalVector: [2, 5, 4, 3, 6, 1],
      chirality: "achiral",
      nodeId: `scale:${office.toLowerCase()}-${tier}`,
      name: `${office} ${tier}`,
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
      domainReferences: { landforms: ["ridge", "basin"] },
    },
    scopedHarmonicDescriptor: {
      coordinateId: "harmonic.CH_A012_q_v1",
      status: "admitted_scoped_A012",
      stateGovernor: office,
      weightedProjection: { numerator: 1, denominator: 407 },
    },
  };
}

describe("Landform provenance (BL-034)", () => {
  it("pins the seven office A0 seed state ids", () => {
    expect(OFFICE_SEED_STATE_IDS).toEqual({
      Sun: 2773,
      Moon: 2741,
      Mars: 1717,
      Mercury: 1709,
      Jupiter: 1453,
      Venus: 1451,
      Saturn: 1387,
    });
  });

  it("marks A0 pools native and cites the seed", () => {
    const provenance = landformProvenance(node("Mars", "A0"));
    expect(provenance.native).toBe(true);
    expect(provenance.seedStateId).toBe(1717);
    expect(landformPoolLabel(provenance)).toBe(
      "Baseline A0 landform reference pool — Mars seed 1717 (native)",
    );
    expect(landformPoolNote(provenance, "A0")).toContain("natively");
  });

  it("marks A1/A2 pools as explicitly derived, never native", () => {
    for (const tier of ["A1", "A2"] as const) {
      const provenance = landformProvenance(node("Mars", tier));
      expect(provenance.native).toBe(false);
      expect(provenance.seedStateId).toBe(1717);
      expect(landformPoolLabel(provenance)).toBe(
        "Derived landform reference pool — inherits the Mars A0 pool (seed 1717)",
      );
      expect(landformPoolNote(provenance, tier)).toContain(`${tier} carries no native pool`);
      expect(landformPoolNote(provenance, tier)).toContain("presentation, not a new semantic payload");
    }
  });

  it("copies the pool without mutating the node payload", () => {
    const source = node("Venus", "A1");
    const provenance = landformProvenance(source);
    provenance.landforms.push("invented");
    expect(source.canonicalProfile.domainReferences.landforms).toEqual(["ridge", "basin"]);
  });
});
