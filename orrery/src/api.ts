import {
  GOVERNORS,
  OFFICE_INDEX,
  TIERS,
  TIER_INDEX,
  type AnchorTier,
  type ExactRatio,
  type Governor,
  type NodesResponse,
  type OrreryNode,
} from "./types";

type JsonRecord = Record<string, unknown>;

function record(value: unknown, context: string): JsonRecord {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${context} must be an object`);
  }

  return value as JsonRecord;
}

function string(value: unknown, context: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${context} must be a non-empty string`);
  }

  return value;
}

function integer(value: unknown, context: string): number {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new Error(`${context} must be an integer`);
  }

  return value;
}

function number(value: unknown, context: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${context} must be a finite number`);
  }

  return value;
}

function governor(value: unknown, context: string): Governor {
  if (typeof value !== "string" || !GOVERNORS.includes(value as Governor)) {
    throw new Error(`${context} must be a recognized Governor`);
  }

  return value as Governor;
}

function tier(value: unknown, context: string): AnchorTier {
  if (typeof value !== "string" || !TIERS.includes(value as AnchorTier)) {
    throw new Error(`${context} must be A0, A1, or A2`);
  }

  return value as AnchorTier;
}

function ratio(value: unknown, context: string): ExactRatio {
  const source = record(value, context);
  const numerator = integer(source.numerator, `${context}.numerator`);
  const denominator = integer(source.denominator, `${context}.denominator`);

  if (denominator !== 407) {
    throw new Error(`${context}.denominator must be 407`);
  }

  return { numerator, denominator };
}

function landforms(value: unknown, context: string): string[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`${context} must be a non-empty array`);
  }

  return value.map((item, index) => string(item, `${context}[${index}]`));
}

function node(value: unknown, index: number): OrreryNode {
  const source = record(value, `nodes[${index}]`);
  const state = record(source.state, `nodes[${index}].state`);
  const resolution = record(source.resolution, `nodes[${index}].resolution`);
  const photonic = record(source.photonic, `nodes[${index}].photonic`);
  const canonicalProfile = record(source.canonicalProfile, `nodes[${index}].canonicalProfile`);
  const domainReferences = record(
    canonicalProfile.domainReferences,
    `nodes[${index}].canonicalProfile.domainReferences`,
  );
  const descriptor = record(
    source.scopedHarmonicDescriptor,
    `nodes[${index}].scopedHarmonicDescriptor`,
  );

  const stateId = integer(state.stateId, `nodes[${index}].state.stateId`);
  const nodeId = string(state.nodeId, `nodes[${index}].state.nodeId`);
  const forteFamily = string(state.forteFamily, `nodes[${index}].state.forteFamily`);
  const stateTier = tier(state.tier, `nodes[${index}].state.tier`);
  const office = governor(resolution.office, `nodes[${index}].resolution.office`);
  const profileOffice = governor(canonicalProfile.office, `nodes[${index}].canonicalProfile.office`);
  const photonicOffice = governor(photonic.office, `nodes[${index}].photonic.office`);
  const descriptorOffice = governor(
    descriptor.stateGovernor,
    `nodes[${index}].scopedHarmonicDescriptor.stateGovernor`,
  );

  if (!nodeId.startsWith("scale:")) {
    throw new Error(`nodes[${index}].state.nodeId must start with scale:`);
  }
  if (!(["7-35", "7-34", "7-33"] as const).includes(forteFamily as "7-35" | "7-34" | "7-33")) {
    throw new Error(`nodes[${index}].state.forteFamily is not an A-tier family`);
  }
  if (state.role !== "anchor" || resolution.officeBearing !== true) {
    throw new Error(`nodes[${index}] is not an office-bearing anchor`);
  }
  if (office !== profileOffice || office !== photonicOffice || office !== descriptorOffice) {
    throw new Error(`nodes[${index}] has inconsistent Governor data`);
  }
  if (
    descriptor.coordinateId !== "harmonic.CH_A012_q_v1" ||
    descriptor.status !== "admitted_scoped_A012"
  ) {
    throw new Error(`nodes[${index}] has an unexpected harmonic coordinate`);
  }

  return {
    state: {
      stateId,
      nodeId,
      name: string(state.name, `nodes[${index}].state.name`),
      forteFamily: forteFamily as "7-35" | "7-34" | "7-33",
      tier: stateTier,
      role: "anchor",
    },
    resolution: { office, officeBearing: true },
    photonic: {
      photonicId: string(photonic.photonicId, `nodes[${index}].photonic.photonicId`),
      office,
      representativeWavelengthNm: number(
        photonic.representativeWavelengthNm,
        `nodes[${index}].photonic.representativeWavelengthNm`,
      ),
      photonicCompression: number(
        photonic.photonicCompression,
        `nodes[${index}].photonic.photonicCompression`,
      ),
    },
    canonicalProfile: {
      profileId: string(canonicalProfile.profileId, `nodes[${index}].canonicalProfile.profileId`),
      profileVersion: string(
        canonicalProfile.profileVersion,
        `nodes[${index}].canonicalProfile.profileVersion`,
      ),
      office,
      domainReferences: {
        landforms: landforms(domainReferences.landforms, `nodes[${index}].canonicalProfile.domainReferences.landforms`),
      },
    },
    scopedHarmonicDescriptor: {
      coordinateId: "harmonic.CH_A012_q_v1",
      status: "admitted_scoped_A012",
      stateGovernor: office,
      weightedProjection: ratio(
        descriptor.weightedProjection,
        `nodes[${index}].scopedHarmonicDescriptor.weightedProjection`,
      ),
    },
  };
}

export function parseNodesResponse(value: unknown): NodesResponse {
  const source = record(value, "response");
  const rawNodes = source.nodes;

  if (source.schemaVersion !== "harmonic-orrery.nodes.v1") {
    throw new Error("Unsupported nodes schema version");
  }
  if (source.nodeCount !== 21 || !Array.isArray(rawNodes) || rawNodes.length !== 21) {
    throw new Error("The Orrery requires exactly 21 anchors");
  }

  const harmonicDescriptor = record(source.harmonicDescriptor, "harmonicDescriptor");
  if (
    harmonicDescriptor.candidateId !== "CH_A012_q_v1" ||
    harmonicDescriptor.coordinateId !== "harmonic.CH_A012_q_v1" ||
    harmonicDescriptor.releaseId !== "harmonic-compression-candidate:CH_A012_q_v1:1.0.0" ||
    harmonicDescriptor.status !== "admitted_scoped_A012" ||
    !/^[a-f0-9]{64}$/.test(string(harmonicDescriptor.candidateFingerprint, "harmonicDescriptor.candidateFingerprint"))
  ) {
    throw new Error("Unexpected harmonic descriptor release");
  }

  const nodes = rawNodes.map(node);
  const ids = new Set(nodes.map((item) => item.state.stateId));
  if (ids.size !== 21) {
    throw new Error("The anchor response contains duplicate state IDs");
  }

  for (const currentTier of TIERS) {
    if (nodes.filter((item) => item.state.tier === currentTier).length !== 7) {
      throw new Error(`The anchor response must contain seven ${currentTier} nodes`);
    }
  }

  return {
    schemaVersion: "harmonic-orrery.nodes.v1",
    profileRegistryReleaseId: string(source.profileRegistryReleaseId, "profileRegistryReleaseId"),
    harmonicDescriptor: {
      candidateId: "CH_A012_q_v1",
      coordinateId: "harmonic.CH_A012_q_v1",
      releaseId: "harmonic-compression-candidate:CH_A012_q_v1:1.0.0",
      status: "admitted_scoped_A012",
      candidateFingerprint: string(harmonicDescriptor.candidateFingerprint, "harmonicDescriptor.candidateFingerprint"),
    },
    nodeCount: 21,
    nodes: nodes.sort(
      (left, right) =>
        TIER_INDEX[left.state.tier] - TIER_INDEX[right.state.tier] ||
        OFFICE_INDEX[left.resolution.office] - OFFICE_INDEX[right.resolution.office],
    ),
  };
}

export function nodesEndpoint(): string {
  const baseUrl = (import.meta.env.VITE_ORRERY_API_BASE ?? "/api").replace(/\/$/, "");
  return `${baseUrl}/nodes`;
}

export async function fetchNodes(): Promise<NodesResponse> {
  const response = await fetch(nodesEndpoint(), {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Anchor projection request failed (${response.status})`);
  }

  return parseNodesResponse(await response.json());
}
