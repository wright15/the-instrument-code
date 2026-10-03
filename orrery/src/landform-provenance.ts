import type { AnchorTier, Governor, OrreryNode } from "./types";

export const OFFICE_SEED_STATE_IDS: Record<Governor, number> = {
  Sun: 2773,
  Moon: 2741,
  Mars: 1717,
  Mercury: 1709,
  Jupiter: 1453,
  Venus: 1451,
  Saturn: 1387,
};

export interface LandformProvenance {
  office: Governor;
  native: boolean;
  seedStateId: number;
  landforms: string[];
}

export function landformProvenance(node: OrreryNode): LandformProvenance {
  const office = node.resolution.office;
  return {
    office,
    native: node.state.tier === "A0",
    seedStateId: OFFICE_SEED_STATE_IDS[office],
    landforms: [...node.canonicalProfile.domainReferences.landforms],
  };
}

export function landformPoolLabel(provenance: LandformProvenance): string {
  return provenance.native
    ? `Baseline A0 landform reference pool — ${provenance.office} seed ${provenance.seedStateId} (native)`
    : `Derived landform reference pool — inherits the ${provenance.office} A0 pool (seed ${provenance.seedStateId})`;
}

export function landformPoolNote(provenance: LandformProvenance, tier: AnchorTier): string {
  return provenance.native
    ? `${provenance.office} A0 carries this pool natively per the admitted canonical profile projection.`
    : `${tier} carries no native pool; this is the office-derived projection of the ${provenance.office} A0 seed (presentation, not a new semantic payload).`;
}
