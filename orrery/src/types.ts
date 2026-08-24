export const GOVERNORS = [
  "Sun",
  "Moon",
  "Mars",
  "Mercury",
  "Jupiter",
  "Venus",
  "Saturn",
] as const;

export type Governor = (typeof GOVERNORS)[number];

export const TIERS = ["A0", "A1", "A2"] as const;
export type AnchorTier = (typeof TIERS)[number];

export const GOVERNOR_META: Record<Governor, { color: string; shortLabel: string }> = {
  Sun: { color: "#ff4444", shortLabel: "SOL" },
  Moon: { color: "#ff8c00", shortLabel: "LUN" },
  Mars: { color: "#ffd700", shortLabel: "MAR" },
  Mercury: { color: "#44bb44", shortLabel: "MER" },
  Jupiter: { color: "#4488ff", shortLabel: "JUP" },
  Venus: { color: "#8b008b", shortLabel: "VEN" },
  Saturn: { color: "#9400d3", shortLabel: "SAT" },
};

export const TIER_META: Record<AnchorTier, { label: string; shape: string }> = {
  A0: { label: "Core", shape: "icosahedron" },
  A1: { label: "Middle", shape: "octahedron" },
  A2: { label: "Perimeter", shape: "tetrahedron" },
};

export interface ExactRatio {
  numerator: number;
  denominator: 407;
}

export interface OrreryNode {
  state: {
    stateId: number;
    nodeId: string;
    name: string;
    forteFamily: "7-35" | "7-34" | "7-33";
    tier: AnchorTier;
    role: "anchor";
  };
  resolution: {
    office: Governor;
    officeBearing: true;
  };
  photonic: {
    photonicId: string;
    office: Governor;
    representativeWavelengthNm: number;
    photonicCompression: number;
  };
  canonicalProfile: {
    profileId: string;
    profileVersion: string;
    office: Governor;
    domainReferences: {
      landforms: string[];
    };
  };
  scopedHarmonicDescriptor: {
    coordinateId: "harmonic.CH_A012_q_v1";
    status: "admitted_scoped_A012";
    stateGovernor: Governor;
    weightedProjection: ExactRatio;
  };
}

export interface NodesResponse {
  schemaVersion: "harmonic-orrery.nodes.v1";
  profileRegistryReleaseId: string;
  harmonicDescriptor: {
    candidateId: "CH_A012_q_v1";
    coordinateId: "harmonic.CH_A012_q_v1";
    releaseId: "harmonic-compression-candidate:CH_A012_q_v1:1.0.0";
    status: "admitted_scoped_A012";
    candidateFingerprint: string;
  };
  nodeCount: 21;
  nodes: OrreryNode[];
}

export const TIER_INDEX: Record<AnchorTier, number> = { A0: 0, A1: 1, A2: 2 };

export const OFFICE_INDEX: Record<Governor, number> = Object.fromEntries(
  GOVERNORS.map((office, index) => [office, index]),
) as Record<Governor, number>;

export function formatRatio(ratio: ExactRatio): string {
  return `${ratio.numerator} / ${ratio.denominator}`;
}
