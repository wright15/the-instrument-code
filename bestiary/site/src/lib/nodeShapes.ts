import type { Archetype, ScaleState } from "./bestiary";

// Palette resolved from graph/src/standalone-base.css (dark theme) and the
// fragment's --sg-* tier mapping. Concrete hexes; no CSS color-mix at render.
const SG_BACKGROUND = "#11151b";

export const TIER_COLORS: Record<string, string> = {
  A0: "#82BFF5",
  A1: "#EF9B57",
  A2: "#E58BB7",
  D1: "#5BC5C0",
  D2: "#7CB7EE",
  D3: "#6DBDD9",
  D4: "#D19491",
  D5: "#ABA3BB",
  D6: "#8FA1EB",
  D7: "#67C5A5",
};

export const BOUNDARY_COLORS: Record<string, { fill: string; stroke: string }> =
  {
    oriented_convergence: { fill: "#40303E", stroke: "#E58BB7" },
    office_junction: { fill: "#312F47", stroke: "#A48AE7" },
    peripheral_leaf: { fill: "#213C3F", stroke: "#5BC5C0" },
  };

export function mixHex(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const mix = (sa: number, sb: number) =>
    Math.round(sa + (sb - sa) * t);
  const r = mix((pa >> 16) & 255, (pb >> 16) & 255);
  const g = mix((pa >> 8) & 255, (pb >> 8) & 255);
  const bch = mix(pa & 255, pb & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | bch)
    .toString(16)
    .slice(1)
    .toUpperCase()}`;
}

export interface NodeShape {
  name?: string;
  r: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  circle?: number;
  rect?: { w: number; h: number; rx?: number };
  path?: string;
  polygon?: string;
}

export function regularPolygonPoints(r: number, sides: number): string {
  const points: string[] = [];
  for (let i = 0; i < sides; i++) {
    const angle = (2 * Math.PI * i) / sides - Math.PI / 2;
    points.push(
      `${(r * Math.cos(angle)).toFixed(2)},${(r * Math.sin(angle)).toFixed(2)}`,
    );
  }
  return points.join(" ");
}

export function diamondPath(r: number): string {
  return `M0,${-r} L${r},0 L0,${r} L${-r},0 Z`;
}

export function trianglePath(r: number): string {
  return `M0,${-r} L${(r * 0.9).toFixed(2)},${(r * 0.7).toFixed(2)} L${(
    -r * 0.9
  ).toFixed(2)},${(r * 0.7).toFixed(2)} Z`;
}

export function lateralTrianglePath(
  r: number,
  direction: "left" | "right",
): string {
  const sign = direction === "left" ? -1 : 1;
  const tipX = sign * r;
  const baseX = -sign * r * 0.8;
  return `M${tipX.toFixed(2)},0 L${baseX.toFixed(2)},${(-r * 0.8).toFixed(2)} L${baseX.toFixed(2)},${(r * 0.8).toFixed(2)} Z`;
}

const ANCHOR_R = 9;
const SATELLITE_R = 5;
const BOUNDARY_R = 3.3;

function anchorShape(tier: string): NodeShape {
  const fill = TIER_COLORS[tier] ?? "#8CF";
  const base: NodeShape = { r: ANCHOR_R + 2, fill, stroke: SG_BACKGROUND, strokeWidth: 1.8 };
  switch (tier) {
    case "A0":
      return { ...base, name: "circle", circle: ANCHOR_R };
    case "A1":
      return { ...base, name: "diamond", path: diamondPath(ANCHOR_R + 1) };
    case "A2":
      return { ...base, name: "hexagon", polygon: regularPolygonPoints(ANCHOR_R + 1, 6) };
    case "D1":
      return { ...base, name: "heptagon", polygon: regularPolygonPoints(ANCHOR_R + 1, 7) };
    case "D2":
      return { ...base, name: "octagon", polygon: regularPolygonPoints(ANCHOR_R + 1, 8) };
    case "D3":
      return { ...base, name: "nonagon", polygon: regularPolygonPoints(ANCHOR_R + 1, 9) };
    case "D4":
      return { ...base, name: "decagon", polygon: regularPolygonPoints(ANCHOR_R + 1, 10) };
    case "D5":
      return { ...base, name: "hendecagon", polygon: regularPolygonPoints(ANCHOR_R + 1, 11) };
    case "D6":
      return { ...base, name: "dodecagon", polygon: regularPolygonPoints(ANCHOR_R + 1, 12) };
    case "D7":
      return { ...base, name: "tridecagon", polygon: regularPolygonPoints(ANCHOR_R + 2, 13) };
    default:
      return { ...base, name: "circle", circle: ANCHOR_R };
  }
}

function satelliteShape(state: ScaleState): NodeShape {
  const tier = state.tier ?? "A0";
  const tierColor = TIER_COLORS[tier] ?? "#8CF";
  const fill = mixHex(tierColor, SG_BACKGROUND, 0.32);
  const base: NodeShape = {
    r: SATELLITE_R + 2,
    fill,
    stroke: tierColor,
    strokeWidth: 1,
  };
  const forte = state.forte ?? "";
  const orientation = state.orientation ?? "";
  switch (tier) {
    case "A0":
      return { ...base, name: "circle", circle: SATELLITE_R };
    case "A1":
      return { ...base, name: "square", rect: { w: SATELLITE_R * 2, h: SATELLITE_R * 2 } };
    case "A2":
      return { ...base, name: "triangle", path: trianglePath(SATELLITE_R + 0.5) };
    case "D1":
      return {
        ...base,
        name: orientation === "7-20 orientation B" ? "lateral-triangle-left" : "lateral-triangle-right",
        path: lateralTrianglePath(
          SATELLITE_R + 0.8,
          orientation === "7-20 orientation B" ? "left" : "right",
        ),
      };
    case "D2":
      return forte === "7-Z38"
        ? { ...base, name: "pentagon", polygon: regularPolygonPoints(SATELLITE_R + 0.8, 5) }
        : { ...base, name: "rounded-square", rect: { w: SATELLITE_R * 2, h: SATELLITE_R * 2, rx: 1.2 } };
    case "D3":
      return orientation === "7-11 orientation A"
        ? { ...base, name: "hexagon", polygon: regularPolygonPoints(SATELLITE_R + 0.8, 6) }
        : { ...base, name: "diamond", path: diamondPath(SATELLITE_R + 0.8) };
    case "D4":
      return {
        ...base,
        name: forte === "7-13" ? "pentagon" : "hexagon",
        polygon: regularPolygonPoints(SATELLITE_R + 0.8, forte === "7-13" ? 5 : 6),
      };
    case "D5":
      return {
        ...base,
        name: forte === "7-6" ? "heptagon" : "octagon",
        polygon: regularPolygonPoints(SATELLITE_R + 0.8, forte === "7-6" ? 7 : 8),
      };
    case "D6":
      return {
        ...base,
        name: orientation === "7-2 orientation B" ? "lateral-triangle-left" : "lateral-triangle-right",
        path: lateralTrianglePath(
          SATELLITE_R + 0.8,
          orientation === "7-2 orientation B" ? "left" : "right",
        ),
      };
    default:
      return { ...base, name: "circle", circle: SATELLITE_R };
  }
}

function boundaryShape(state: ScaleState): NodeShape {
  const colors = BOUNDARY_COLORS[state.fineRole ?? ""] ?? {
    fill: SG_BACKGROUND,
    stroke: "#5b6778",
  };
  const base: NodeShape = {
    r: BOUNDARY_R + 2,
    fill: colors.fill,
    stroke: colors.stroke,
    strokeWidth: 1.4,
  };
  switch (state.fineRole) {
    case "office_junction":
      return { ...base, name: "office-junction-diamond", path: diamondPath(BOUNDARY_R + 0.5) };
    case "peripheral_leaf":
      return { ...base, name: "peripheral-leaf-triangle", path: trianglePath(BOUNDARY_R + 0.5) };
    case "oriented_convergence":
    default:
      return { ...base, name: "oriented-convergence-circle", circle: BOUNDARY_R };
  }
}

export function nodeShapeFor(archetype: Archetype): NodeShape | null {
  if (archetype.kind === "scaleState") {
    const state = archetype as ScaleState;
    if (state.role === "anchor") return anchorShape(state.tier ?? "A0");
    if (state.role === "satellite") return satelliteShape(state);
    return boundaryShape(state);
  }
  switch (archetype.kind) {
    case "scaleFamily":
      return {
        name: "family-ring",
        r: 7.5,
        circle: 5.5,
        fill: SG_BACKGROUND,
        stroke: "#E0E0E0",
        strokeWidth: 1.4,
      };
    case "governorOffice":
      return {
        name: "office-marker",
        r: 9,
        circle: 7,
        fill: "#88CCFF",
        stroke: "#E0E0E0",
        strokeWidth: 0.8,
      };
    case "canonicalProfile":
      return {
        name: "profile-marker",
        r: 7.5,
        circle: 5.5,
        fill: "#FFFFFF",
        stroke: "#E0E0E0",
        strokeWidth: 0.8,
      };
    case "mutationOperator":
      return {
        name: "operator-square",
        r: 6.5,
        rect: { w: 9, h: 9, rx: 1 },
        fill: "#555555",
        stroke: "#888888",
        strokeWidth: 1,
      };
    case "modalCycle":
      return {
        name: "cycle-ring",
        r: 5.2,
        circle: 3.2,
        fill: SG_BACKGROUND,
        stroke: "#777777",
        strokeWidth: 1.2,
      };
    case "candidateExtension":
      return {
        name: "candidate-diamond",
        r: 7,
        path: diamondPath(5.5),
        fill: "#FBBF24",
        stroke: "#FBBF24",
        strokeWidth: 1,
      };
    default:
      return null;
  }
}
