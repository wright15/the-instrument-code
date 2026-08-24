import { afterEach, describe, expect, it, vi } from "vitest";

import {
  fetchNodes,
  parseNodesResponse,
  ProjectionCompatibilityError,
  ProjectionUnavailableError,
} from "./api";
import { layoutAnchors } from "./layout";
import { GOVERNORS, TIERS } from "./types";

type FixtureNode = {
  state: {
    stateId: number;
    nodeId: string;
    name: string;
    forteFamily: string;
    tier: string;
    role: string;
  };
  resolution: { office: string; officeBearing: boolean };
  photonic: {
    photonicId: string;
    office: string;
    representativeWavelengthNm: number;
    photonicCompression: number;
  };
  canonicalProfile: {
    profileId: string;
    profileVersion: string;
    office: string;
    domainReferences: { landforms: string[] };
  };
  scopedHarmonicDescriptor: {
    coordinateId: string;
    status: string;
    stateGovernor: string;
    weightedProjection: { numerator: number; denominator: number };
  };
};

function fixtureNode(tier: string, office: string, stateId: number): FixtureNode {
  return {
    state: {
      stateId,
      nodeId: `scale:${stateId}`,
      name: `${office} ${tier}`,
      forteFamily: "7-35",
      tier,
      role: "anchor",
    },
    resolution: { office, officeBearing: true },
    photonic: {
      photonicId: `photonic:${office.toLowerCase()}`,
      office,
      representativeWavelengthNm: 500 + stateId,
      photonicCompression: stateId / 100,
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
      weightedProjection: { numerator: stateId, denominator: 407 },
    },
  };
}

function responseFixture(): {
  schemaVersion: string;
  profileRegistryReleaseId: string;
  harmonicDescriptor: Record<string, string>;
  nodeCount: number;
  nodes: FixtureNode[];
} {
  return {
    schemaVersion: "harmonic-orrery.nodes.v1",
    profileRegistryReleaseId: "canonical-feature-profile-registry:0.1.1",
    harmonicDescriptor: {
      candidateId: "CH_A012_q_v1",
      coordinateId: "harmonic.CH_A012_q_v1",
      releaseId: "harmonic-compression-candidate:CH_A012_q_v1:1.0.0",
      status: "admitted_scoped_A012",
      candidateFingerprint: "a".repeat(64),
    },
    nodeCount: 21,
    nodes: TIERS.flatMap((tier, tierIndex) =>
      GOVERNORS.map((office, officeIndex) => fixtureNode(tier, office, tierIndex * 100 + officeIndex + 1)),
    ).reverse(),
  };
}

describe("Harmonic Orrery nodes contract", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("normalizes the 21 anchors into deterministic tier and office order", () => {
    const response = parseNodesResponse(responseFixture());

    expect(response.nodes).toHaveLength(21);
    expect(response.nodes.map((node) => node.state.tier)).toEqual([
      ...Array(7).fill("A0"),
      ...Array(7).fill("A1"),
      ...Array(7).fill("A2"),
    ]);
    expect(response.nodes.slice(0, 7).map((node) => node.resolution.office)).toEqual(GOVERNORS);
  });

  it("rejects a response that changes the exact scoped-ratio denominator", () => {
    const response = responseFixture();
    response.nodes[0].scopedHarmonicDescriptor.weightedProjection.denominator = 408;

    expect(() => parseNodesResponse(response)).toThrow("denominator must be 407");
    expect(() => parseNodesResponse(response)).toThrow(ProjectionCompatibilityError);
  });

  it("classifies schema, descriptor release, invalid fields, and invalid anchor IDs as incompatible", () => {
    const schemaChanged = responseFixture();
    schemaChanged.schemaVersion = "harmonic-orrery.nodes.v2";
    expect(() => parseNodesResponse(schemaChanged)).toThrow(ProjectionCompatibilityError);

    const releaseChanged = responseFixture();
    releaseChanged.harmonicDescriptor.releaseId = "harmonic-compression-candidate:CH_A012_q_v1:2.0.0";
    expect(() => parseNodesResponse(releaseChanged)).toThrow(ProjectionCompatibilityError);

    const invalidId = responseFixture();
    invalidId.nodes[0].state.stateId = -1;
    expect(() => parseNodesResponse(invalidId)).toThrow("must be between 0 and 4095");

    const unknownField = responseFixture();
    Object.assign(unknownField.nodes[0].state, { unexpected: true });
    expect(() => parseNodesResponse(unknownField)).toThrow("has unexpected fields");
  });

  it("classifies unavailable network and HTTP projection responses", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    await expect(fetchNodes()).rejects.toBeInstanceOf(ProjectionUnavailableError);

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 503 })));
    await expect(fetchNodes()).rejects.toBeInstanceOf(ProjectionUnavailableError);

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{", { status: 200 })));
    await expect(fetchNodes()).rejects.toBeInstanceOf(ProjectionCompatibilityError);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockRejectedValue(new TypeError("connection closed")),
      }),
    );
    await expect(fetchNodes()).rejects.toBeInstanceOf(ProjectionUnavailableError);

    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_input: RequestInfo | URL, init?: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener("abort", () => reject(new Error("aborted")));
          }),
      ),
    );
    const stalledRequest = expect(fetchNodes()).rejects.toThrow("timed out");
    await vi.runAllTimersAsync();
    await stalledRequest;
  });

  it("creates stable, separated tier-orbit positions", () => {
    const nodes = parseNodesResponse(responseFixture()).nodes;
    const firstLayout = layoutAnchors(nodes);
    const secondLayout = layoutAnchors(nodes);
    const positions = new Set(firstLayout.map((anchor) => `${anchor.x}:${anchor.y}:${anchor.z}`));

    expect(firstLayout).toEqual(secondLayout);
    expect(positions).toHaveLength(21);
    expect(new Set(firstLayout.filter((anchor) => anchor.node.state.tier === "A0").map((anchor) => anchor.radius))).toEqual(new Set([4.6]));
    expect(new Set(firstLayout.filter((anchor) => anchor.node.state.tier === "A1").map((anchor) => anchor.radius))).toEqual(new Set([7.6]));
    expect(new Set(firstLayout.filter((anchor) => anchor.node.state.tier === "A2").map((anchor) => anchor.radius))).toEqual(new Set([11.2]));
  });
});
