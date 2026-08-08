import type { Archetype, Relationship } from "./bestiary";
import { relationKind } from "./bestiary";

export const EDGE_COLORS: Record<string, string> = {
  GOVERNS: "#8CF",
  MODAL_SUCCESSOR: "#34D399",
  CONSTRUCTS: "#FBBF24",
  SEAT_CONTACT: "#C084FC",
};

export interface NetworkPosition {
  x: number;
  y: number;
}

export interface NetworkEdge {
  sourceId: string;
  targetId: string;
  type: string;
  color: string;
  dash: string | null;
}

export interface LaneGuide {
  office: string;
  index: number;
  x: number;
  count: number;
}

export interface RowGuide {
  y: number;
  label: string;
}

export interface BoundaryColumn {
  forte: string;
  x: number;
  y: number;
}

export interface NetworkGuides {
  lanes: LaneGuide[];
  rows: RowGuide[];
  boundary: { titleY: number; endY: number; columns: BoundaryColumn[] };
  sideRail: { x: number; y: number; width: number; height: number; label: string };
  operatorStrip: { y: number; label: string };
}

export interface NetworkLayout {
  positions: Map<string, NetworkPosition>;
  edges: NetworkEdge[];
  guides: NetworkGuides;
  width: number;
  height: number;
}

// ---------------------------------------------------------------------------
// Geometry — ported from graph/src/seven-governors-network.fragment.html
// (officeLayout "office" mode). Pure placement; no RNG, no physics.
// ---------------------------------------------------------------------------

export const NETWORK_W = 1780;
export const NETWORK_H = 2120;
const LANE_LEFT = 190;
const LANE_STEP = 194;

const OFFICE_ORDER = [
  "Sun",
  "Moon",
  "Mars",
  "Mercury",
  "Jupiter",
  "Venus",
  "Saturn",
];

const TIERS = ["A0", "A1", "A2", "D1", "D2", "D3", "D4", "D5", "D6", "D7"];

const ANCHOR_Y: Record<string, number> = {
  A0: 185,
  A1: 335,
  A2: 410,
  D1: 575,
  D2: 740,
  D3: 910,
  D4: 1075,
  D5: 1240,
  D6: 1405,
  D7: 1585,
};

const SATELLITE_ROWS: Record<
  string,
  { y: number; xOffsets: number[]; yOffsets: number[] }
> = {
  A0: { y: 110, xOffsets: [-34, 0, 34], yOffsets: [-17, 17] },
  A1: { y: 260, xOffsets: [-24, 24], yOffsets: [-17, 17] },
  A2: { y: 485, xOffsets: [-34, 0, 34], yOffsets: [-17, 17] },
  D1: { y: 650, xOffsets: [-25, 25], yOffsets: [0] },
  D2: { y: 825, xOffsets: [-25, 25], yOffsets: [-15, 15] },
  D3: { y: 990, xOffsets: [-25, 25], yOffsets: [0] },
  D4: { y: 1155, xOffsets: [-25, 25], yOffsets: [-15, 15] },
  D5: { y: 1320, xOffsets: [-25, 25], yOffsets: [-15, 15] },
  D6: { y: 1485, xOffsets: [-25, 25], yOffsets: [0] },
};

const ROW_LABELS: RowGuide[] = [
  { y: 110, label: "A0 satellites" },
  { y: 185, label: "A0 / 7-35" },
  { y: 260, label: "A1 satellites" },
  { y: 335, label: "A1 / 7-34" },
  { y: 410, label: "A2 / 7-33" },
  { y: 485, label: "A2 satellites" },
  { y: 575, label: "D1 / 7-22" },
  { y: 650, label: "7-20 satellites" },
  { y: 740, label: "D2 / 7-15" },
  { y: 825, label: "7-Z38 + 7-7 satellites" },
  { y: 910, label: "D3 / 7-Z37" },
  { y: 990, label: "7-11 satellites" },
  { y: 1075, label: "D4 / 7-Z17" },
  { y: 1155, label: "7-13 + 7-16 satellites" },
  { y: 1240, label: "D5 / 7-Z12" },
  { y: 1320, label: "7-6 + 7-10 satellites" },
  { y: 1405, label: "D6 / 7-8" },
  { y: 1485, label: "7-2 satellites · orientations A + B" },
  { y: 1585, label: "D7 / 7-1 terminal" },
];

const BOUNDARY_TITLE_Y = 1630;
const BOUNDARY_START_Y = 1700;
const BOUNDARY_COL_LEFT = 90;
const BOUNDARY_COL_STEP = 132;
const BOUNDARY_END_Y = 1900;
const SIDE_RAIL_X = 1488;
const SIDE_RAIL_W = 270;
const FAMILY_X = 1525;
const CYCLE_X = 1580;
const HEADER_NODE_Y = 66;
const OPERATOR_STRIP_Y = 2040;

function laneX(index: number): number {
  return LANE_LEFT + LANE_STEP * index;
}

function placeCluster(
  nodes: { id: string }[],
  positions: Map<string, NetworkPosition>,
  x: number,
  y: number,
  xOffsets: number[],
  yOffsets: number[],
): void {
  nodes.forEach((node, index) => {
    const column = index % xOffsets.length;
    const row = Math.floor(index / xOffsets.length);
    positions.set(node.id, {
      x: x + xOffsets[column],
      y: y + yOffsets[row],
    });
  });
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function computeNetworkLayout(
  archetypes: Archetype[],
  relationships: Relationship[],
): NetworkLayout {
  const positions = new Map<string, NetworkPosition>();

  const states = archetypes.filter((a) => a.kind === "scaleState");
  const anchors = states.filter((s) => s.role === "anchor");
  const satellites = states.filter((s) => s.role === "satellite");
  const boundaries = states.filter((s) => s.role === "boundary");

  // --- States: office lanes ---
  for (const state of anchors) {
    if (!state.office || !state.tier) continue;
    const laneIndex = OFFICE_ORDER.indexOf(state.office);
    if (laneIndex === -1) continue;
    positions.set(state.id, {
      x: laneX(laneIndex),
      y: ANCHOR_Y[state.tier] ?? ANCHOR_Y.D7,
    });
  }

  for (const office of OFFICE_ORDER) {
    for (const tier of TIERS) {
      const row = SATELLITE_ROWS[tier];
      if (!row) continue;
      const cluster = satellites
        .filter((s) => s.office === office && s.tier === tier)
        .sort((a, b) => a.nodeId - b.nodeId);
      placeCluster(
        cluster,
        positions,
        laneX(OFFICE_ORDER.indexOf(office)),
        row.y,
        row.xOffsets,
        row.yOffsets,
      );
    }
  }

  // --- Boundary states: bottom band, one column per forte ---
  const boundaryByForte = new Map<string, Archetype[]>();
  for (const state of boundaries) {
    const key = state.forte ?? "?";
    const list = boundaryByForte.get(key) ?? [];
    list.push(state);
    boundaryByForte.set(key, list);
  }
  const boundaryFortes = [...boundaryByForte.keys()].sort((a, b) =>
    a.localeCompare(b),
  );
  const boundaryColumns: BoundaryColumn[] = [];
  boundaryFortes.forEach((forte, index) => {
    const cx = BOUNDARY_COL_LEFT + BOUNDARY_COL_STEP * index;
    const nodes = boundaryByForte
      .get(forte)!
      .sort((a, b) =>
        a.kind === "scaleState" && b.kind === "scaleState"
          ? a.nodeId - b.nodeId
          : 0,
      );
    nodes.forEach((node, nodeIndex) => {
      const column = nodeIndex % 2;
      const row = Math.floor(nodeIndex / 2);
      positions.set(node.id, {
        x: cx + (column === 0 ? -15 : 15),
        y: BOUNDARY_START_Y + row * 26,
      });
    });
    boundaryColumns.push({ forte, x: cx, y: BOUNDARY_START_Y - 16 });
  });

  // --- Edges (structural only) ---
  const edges: NetworkEdge[] = relationships
    .filter((r) => relationKind(r) === "structural")
    .map((r) => ({
      sourceId: `state:${r.source}`,
      targetId: `state:${r.target}`,
      type: r.type,
      color: EDGE_COLORS[r.type] ?? "#888888",
      dash: r.type === "SEAT_CONTACT" ? "4 3" : null,
    }));

  // --- Non-state archetypes: deterministic anchors to related clusters ---
  const centroid = (ids: number[]): NetworkPosition | null => {
    let sx = 0;
    let sy = 0;
    let count = 0;
    for (const id of ids) {
      const p = positions.get(`state:${id}`);
      if (!p) continue;
      sx += p.x;
      sy += p.y;
      count++;
    }
    return count === 0 ? null : { x: sx / count, y: sy / count };
  };

  const stateIdsByOffice = new Map<string, number[]>();
  for (const s of states) {
    if (s.office) {
      const list = stateIdsByOffice.get(s.office) ?? [];
      list.push(s.nodeId);
      stateIdsByOffice.set(s.office, list);
    }
  }

  // Families occupy a reserved right rail, ordered by the vertical centroid
  // of their member states and packed far enough apart to remain legible.
  const familyYByForte = new Map<string, number>();
  const familyRows: {
    family: Extract<Archetype, { kind: "scaleFamily" }>;
    desiredY: number;
    y: number;
  }[] = [];
  for (const family of archetypes.filter(
    (a): a is Extract<Archetype, { kind: "scaleFamily" }> =>
      a.kind === "scaleFamily",
  )) {
    const c = centroid(family.memberStateIds);
    if (!c) continue;
    familyRows.push({ family, desiredY: c.y, y: c.y });
  }
  familyRows.sort(
    (a, b) =>
      a.desiredY - b.desiredY || a.family.forte.localeCompare(b.family.forte),
  );
  const familyTop = 112;
  const familyBottom = BOUNDARY_END_Y - 20;
  const familyGap = 32;
  let previousY = familyTop - familyGap;
  for (const row of familyRows) {
    row.y = Math.max(
      clamp(row.desiredY, familyTop, familyBottom),
      previousY + familyGap,
    );
    previousY = row.y;
  }
  for (let index = familyRows.length - 1; index >= 0; index--) {
    const nextY = familyRows[index + 1]?.y ?? familyBottom + familyGap;
    familyRows[index].y = Math.min(familyRows[index].y, nextY - familyGap);
  }
  for (const { family, y } of familyRows) {
    positions.set(family.id, { x: FAMILY_X, y });
    familyYByForte.set(family.forte, y);
  }

  // Cycles cluster beside their family marker in the same right rail.
  const cyclesByForte = new Map<
    string,
    Extract<Archetype, { kind: "modalCycle" }>[]
  >();
  for (const cycle of archetypes.filter(
    (a): a is Extract<Archetype, { kind: "modalCycle" }> =>
      a.kind === "modalCycle",
  )) {
    const list = cyclesByForte.get(cycle.forte) ?? [];
    list.push(cycle);
    cyclesByForte.set(cycle.forte, list);
  }
  for (const [forte, cycles] of cyclesByForte) {
    cycles.sort((a, b) => a.id.localeCompare(b.id));
    const baseY =
      familyYByForte.get(forte) ??
      centroid(cycles[0]?.memberStateIds ?? [])?.y ??
      NETWORK_H / 2;
    const columns = 6;
    const rowCount = Math.ceil(cycles.length / columns);
    cycles.forEach((cycle, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      positions.set(cycle.id, {
        x: CYCLE_X + column * 34,
        y: clamp(
          baseY + (row - (rowCount - 1) / 2) * 16,
          82,
          BOUNDARY_END_Y - 20,
        ),
      });
    });
  }

  // Office/profile markers live below each lane header and above A0 states.
  for (const office of archetypes.filter(
    (a): a is Extract<Archetype, { kind: "governorOffice" }> =>
      a.kind === "governorOffice",
  )) {
    const index = OFFICE_ORDER.indexOf(office.office);
    positions.set(office.id, { x: laneX(index) - 12, y: HEADER_NODE_Y });
  }
  for (const profile of archetypes.filter(
    (a): a is Extract<Archetype, { kind: "canonicalProfile" }> =>
      a.kind === "canonicalProfile",
  )) {
    const index = OFFICE_ORDER.indexOf(profile.office);
    positions.set(profile.id, { x: laneX(index) + 12, y: HEADER_NODE_Y });
  }

  // Operators occupy a post-boundary strip. R/L pairs flank their degree
  // governor's lane; M is at the state-field center.
  const stateFieldCenterX =
    (laneX(0) + laneX(OFFICE_ORDER.length - 1)) / 2;
  for (const operator of archetypes.filter(
    (a): a is Extract<Archetype, { kind: "mutationOperator" }> =>
      a.kind === "mutationOperator",
  )) {
    if (operator.operatorId === "M") {
      positions.set(operator.id, {
        x: stateFieldCenterX,
        y: OPERATOR_STRIP_Y,
      });
      continue;
    }
    const index = OFFICE_ORDER.indexOf(operator.degreeGovernor ?? "");
    positions.set(operator.id, {
      x: laneX(index) + (operator.direction === "raise" ? -16 : 16),
      y: OPERATOR_STRIP_Y,
    });
  }

  // Candidate extensions occupy a deterministic top-right corner grid.
  const candidates = archetypes
    .filter(
      (a): a is Extract<Archetype, { kind: "candidateExtension" }> =>
        a.kind === "candidateExtension",
    )
    .sort((a, b) => a.extensionId.localeCompare(b.extensionId));
  candidates.forEach((candidate, index) => {
    positions.set(candidate.id, {
      x: SIDE_RAIL_X + 80 + index * 58,
      y: 42,
    });
  });

  const missing = archetypes.filter((archetype) => !positions.has(archetype.id));
  if (missing.length > 0) {
    throw new Error(
      `network layout missing ${missing.length} archetype positions: ${missing
        .map((archetype) => archetype.id)
        .join(", ")}`,
    );
  }
  const invalid = archetypes.filter((archetype) => {
    const p = positions.get(archetype.id)!;
    return (
      !Number.isFinite(p.x) ||
      !Number.isFinite(p.y) ||
      p.x < 0 ||
      p.x > NETWORK_W ||
      p.y < 0 ||
      p.y > NETWORK_H
    );
  });
  if (invalid.length > 0) {
    throw new Error(
      `network layout has ${invalid.length} invalid archetype positions: ${invalid
        .map((archetype) => archetype.id)
        .join(", ")}`,
    );
  }

  const lanes: LaneGuide[] = OFFICE_ORDER.map((office, index) => ({
    office,
    index,
    x: laneX(index),
    count: stateIdsByOffice.get(office)?.length ?? 0,
  }));

  return {
    positions,
    edges,
    guides: {
      lanes,
      rows: ROW_LABELS,
      boundary: {
        titleY: BOUNDARY_TITLE_Y,
        endY: BOUNDARY_END_Y,
        columns: boundaryColumns,
      },
      sideRail: {
        x: SIDE_RAIL_X,
        y: 58,
        width: SIDE_RAIL_W,
        height: BOUNDARY_END_Y - 76,
        label: "Families / modal cycles",
      },
      operatorStrip: { y: OPERATOR_STRIP_Y, label: "Mutation operators" },
    },
    width: NETWORK_W,
    height: NETWORK_H,
  };
}
