import { describe, expect, it } from "vitest";

import fixture from "../../tests/fixtures/fivefold_q_table.v1.json";
import { OFFICE_PALETTES } from "./audio";
import { LEGAL_MOVE_CATALOG, type LegalMoveCatalogAnchor, type LegalMoveCatalogIndex } from "./moves";
import {
  ANDALUSIAN_AEOLIAN_COLLECTION,
  ANDALUSIAN_HARMONIC_MINOR_COLLECTION,
  FIVEFOLD_GENERATIVE_WINDOW,
  FIVEFOLD_REST_STATE,
  FIVEFOLD_STILL_SET,
  FIVEFOLD_TRAVERSAL_CYCLE,
  planAndalusianCadenceReplay,
  planFivefoldOrbitReplay,
  planOrreryRouteReplay,
  toReplayVoices,
} from "./path-replay";
import type { OrreryNode } from "./types";

function node(anchor: LegalMoveCatalogAnchor): OrreryNode {
  const { stateId, office } = anchor;
  const pitchClasses = Array.from({ length: 12 }, (_value, pitchClass) => pitchClass).filter(
    (pitchClass) => (stateId & (1 << pitchClass)) !== 0,
  );
  return {
    state: {
      stateId,
      pitchMask: stateId,
      pitchClasses,
      intervalVector: [0, 0, 0, 0, 0, 0],
      chirality: "achiral",
      nodeId: `scale:${stateId}`,
      name: `Anchor ${stateId}`,
      forteFamily: anchor.forteFamily,
      tier: anchor.tier,
      role: "anchor",
    },
    resolution: { office, officeBearing: true },
    photonic: {
      photonicId: `photonic:${office.toLowerCase()}`,
      office,
      representativeWavelengthNm: 500,
      photonicCompression: 1,
    },
    canonicalProfile: {
      profileId: `profile:${office.toLowerCase()}`,
      profileVersion: "0.1.1",
      office,
      domainReferences: { landforms: ["ridge"] },
    },
    scopedHarmonicDescriptor: {
      coordinateId: "harmonic.CH_A012_q_v1",
      status: "admitted_scoped_A012",
      stateGovernor: office,
      weightedProjection: { numerator: 1, denominator: 407 },
    },
  };
}

function fixtureNodes(): ReadonlyMap<number, OrreryNode> {
  return new Map(LEGAL_MOVE_CATALOG.scope.anchors.map((anchor) => [anchor.stateId, node(anchor)]));
}

function fixtureCatalog(): LegalMoveCatalogIndex {
  return {
    catalog: LEGAL_MOVE_CATALOG,
    movesById: new Map(LEGAL_MOVE_CATALOG.moves.map((move) => [move.id, move])),
    movesBySourceId: new Map(),
  };
}

describe("Fivefold mirror constants", () => {
  it("matches the committed Python module via the shared fixture", () => {
    expect(fixture.traversalCycle).toEqual([...FIVEFOLD_TRAVERSAL_CYCLE]);
    expect(fixture.stillSet).toEqual([...FIVEFOLD_STILL_SET]);
    expect(fixture.generativeWindow).toEqual([...FIVEFOLD_GENERATIVE_WINDOW]);
  });
});

describe("Orrery route replay planner", () => {
  it("plans a contiguous catalog-backed route with destination voicings", () => {
    const catalog = fixtureCatalog();
    const nodesById = fixtureNodes();
    const first = LEGAL_MOVE_CATALOG.moves[0];
    const second = LEGAL_MOVE_CATALOG.moves.find((move) => move.sourceId === first.targetId);
    expect(second).toBeDefined();
    if (!second) {
      return;
    }

    const plan = planOrreryRouteReplay({
      startAnchorId: first.sourceId,
      moveIds: [first.id, second.id],
      catalog,
      nodesById,
      courtPosition: "C0",
    });

    expect(plan.kind).toBe("ok");
    if (plan.kind !== "ok") {
      return;
    }
    expect(plan.hops).toHaveLength(2);
    const firstTarget = nodesById.get(first.targetId);
    expect(plan.hops[0].selection.retainedPitchClasses).toEqual(firstTarget?.state.pitchClasses);
    expect(plan.hops[0].operatorId).toBe(first.operatorId);
    expect(plan.hops[1].targetId).toBe(second.targetId);
    expect(plan.hops[1].selection.retainedPitchClasses).toEqual(
      nodesById.get(second.targetId)?.state.pitchClasses,
    );

    const voices = toReplayVoices(plan);
    expect(voices).toHaveLength(2);
    expect(voices[0].preset).toBe(OFFICE_PALETTES[firstTarget?.resolution.office ?? "Sun"].preset);
  });

  it("rejects unrecorded, non-contiguous, and missing-target routes", () => {
    const catalog = fixtureCatalog();
    const nodesById = fixtureNodes();
    const first = LEGAL_MOVE_CATALOG.moves[0];

    expect(
      planOrreryRouteReplay({
        startAnchorId: null,
        moveIds: [],
        catalog,
        nodesById,
        courtPosition: "C0",
      }).kind,
    ).toBe("invalid");

    const unknown = planOrreryRouteReplay({
      startAnchorId: first.sourceId,
      moveIds: ["NOPE:1:2"],
      catalog,
      nodesById,
      courtPosition: "C0",
    });
    expect(unknown.kind).toBe("invalid");
    expect(unknown.kind === "invalid" ? unknown.message : "").toContain("not in the committed legal-move catalog");

    const gap = planOrreryRouteReplay({
      startAnchorId: first.sourceId + 1,
      moveIds: [first.id],
      catalog,
      nodesById,
      courtPosition: "C0",
    });
    expect(gap.kind).toBe("invalid");
    expect(gap.kind === "invalid" ? gap.message : "").toContain("not contiguous");

    const withoutTarget = new Map(nodesById);
    withoutTarget.delete(first.targetId);
    const missing = planOrreryRouteReplay({
      startAnchorId: first.sourceId,
      moveIds: [first.id],
      catalog,
      nodesById: withoutTarget,
      courtPosition: "C0",
    });
    expect(missing.kind).toBe("invalid");
    expect(missing.kind === "invalid" ? missing.message : "").toContain("unavailable in the live projection");
  });
});

describe("Fivefold orbit replay planner", () => {
  it("tracks the cursor through the fifth-stack and closes at z=12", () => {
    const plan = planFivefoldOrbitReplay({ mapping: "cursor" });
    expect(plan.kind).toBe("ok");
    if (plan.kind !== "ok") {
      return;
    }
    expect(plan.closureHopIndex).toBe(12);
    expect(plan.hops).toHaveLength(14);

    const orbitHops = plan.hops.filter((hop) => hop.kind === "orbit");
    expect(orbitHops).toHaveLength(13);
    expect(orbitHops.map((hop) => hop.pitchClasses)).toEqual(
      [...FIVEFOLD_TRAVERSAL_CYCLE, FIVEFOLD_TRAVERSAL_CYCLE[0]].map((pc) => [pc]),
    );
    expect(orbitHops.map((hop) => hop.stateBits)).toEqual([
      "0000",
      "0111",
      "0010",
      "1001",
      "0100",
      "1011",
      "0110",
      "0001",
      "1000",
      "0011",
      "1010",
      "0101",
      "0000",
    ]);
    expect(orbitHops[12].state).toBe(0);

    const rest = plan.hops[13];
    expect(rest.kind).toBe("rest");
    expect(rest.stillSet).toBe(true);
    expect(rest.state).toBe(FIVEFOLD_REST_STATE);
    expect(rest.pitchClasses).toEqual([]);
    expect(rest.cursorPitchClass).toBeUndefined();
  });

  it("completes the pentatonic window by hop five under the bucket overlay", () => {
    const plan = planFivefoldOrbitReplay({ mapping: "bucket-overlay" });
    expect(plan.kind).toBe("ok");
    if (plan.kind !== "ok") {
      return;
    }
    expect(plan.hops[4].pitchClasses).toEqual([...FIVEFOLD_GENERATIVE_WINDOW]);
    expect(plan.hops[12].pitchClasses).toHaveLength(12);
    expect(plan.hops[13].pitchClasses).toEqual([...FIVEFOLD_GENERATIVE_WINDOW]);
    expect(plan.hops[13].label).toContain("pure stack");

    const voices = toReplayVoices(plan);
    expect(voices[13].pitchClasses).toEqual([...FIVEFOLD_GENERATIVE_WINDOW]);
    expect(voices[0].preset).toBe(OFFICE_PALETTES.Mercury.preset);
  });

  it("rejects still-set starts because the still set has no orbit position", () => {
    const plan = planFivefoldOrbitReplay({ startState: 12 });
    expect(plan.kind).toBe("invalid");
    expect(plan.kind === "invalid" ? plan.message : "").toContain("no orbit position");
  });
});

describe("Andalusian cadence planner", () => {
  it("flags the seam-crossing hop and keeps every chord inside its admitted collection", () => {
    const plan = planAndalusianCadenceReplay();
    expect(plan.kind).toBe("ok");
    if (plan.kind !== "ok") {
      return;
    }

    expect(plan.hops.map((hop) => hop.chordLabel)).toEqual(["Am", "G", "F", "E"]);
    expect(plan.seamHopIndex).toBe(3);
    expect(plan.hops.slice(0, 3).every((hop) => !hop.seamCrossing)).toBe(true);
    expect(plan.hops[3].seamCrossing).toBe(true);

    for (const hop of plan.hops) {
      const collection =
        hop.collection === "aeolian" ? ANDALUSIAN_AEOLIAN_COLLECTION : ANDALUSIAN_HARMONIC_MINOR_COLLECTION;
      expect(hop.pitchClasses.every((pitchClass) => collection.includes(pitchClass))).toBe(true);
    }

    // The audible seam: the leading tone G# replaces G only on the final move.
    expect(plan.hops[3].pitchClasses).toContain(8);
    expect(plan.hops[3].pitchClasses).not.toContain(7);

    const voices = toReplayVoices(plan);
    expect(voices).toHaveLength(4);
    expect(voices[3].label).toContain("[seam crossing]");
    expect(voices[0].preset).toBe(OFFICE_PALETTES.Jupiter.preset);
  });
});
