import { OFFICE_INDEX, TIER_INDEX, type OrreryNode } from "./types";

export interface LayoutAnchor {
  node: OrreryNode;
  x: number;
  y: number;
  z: number;
  radius: number;
  angle: number;
}

const TIER_RADII = [4.6, 7.6, 11.2] as const;
const TIER_HEIGHTS = [1.55, 0, -1.55] as const;
const OFFICE_STEP = (Math.PI * 2) / 7;

export function layoutAnchors(nodes: OrreryNode[]): LayoutAnchor[] {
  return nodes.map((node) => {
    const tierIndex = TIER_INDEX[node.state.tier];
    const officeIndex = OFFICE_INDEX[node.resolution.office];
    const angle = -Math.PI / 2 + officeIndex * OFFICE_STEP + tierIndex * (OFFICE_STEP / 2);
    const radius = TIER_RADII[tierIndex];

    return {
      node,
      x: Math.cos(angle) * radius,
      y: TIER_HEIGHTS[tierIndex],
      z: Math.sin(angle) * radius,
      radius,
      angle,
    };
  });
}
