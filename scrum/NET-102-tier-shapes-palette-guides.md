# NET-102 — Tier shapes, fixed palette, lane/row guides

**Status:** Done · **Priority:** High · **Points:** 5 · **Epic:** [EPIC-001](EPIC-001-network-replica.md)
**Depends on:** [NET-101](NET-101-office-lane-layout.md) · **Blocks:** NET-104

## Story

As a viewer, I want the replica to look like the standalone network — nodes
shaped by tier, colored by a fixed tier palette, with office lane headers and
family row guides — so the chart is recognizable at a glance.

## Context

The standalone renders anchors as per-tier polygons (A0 circle, A1 diamond,
A2 hexagon, D1–D7 heptagon→tridecagon), satellites as kind-specific small
shapes, boundaries as tiny circles; nodes are colored by tier via CSS
variables composed with `color-mix`. Our dashboard is pure SSR inline SVG, so
the palette must be resolved to concrete hex values at build time.

## Technical notes

- Port shape helpers from the fragment: `diamond`, `triangle`,
  `lateralTriangle`, `pentagon`, `hexagon`, `heptagon`, `octagon`, `nonagon`,
  `decagon`, `hendecagon`, `dodecagon`, `tridecagon`; and the satellite shape
  mapping (rect for a1-satellite, triangle for a2-satellite, pentagon for
  7-Z38 d2-satellite, lateral triangle for d1-satellite, etc.) — document the
  final mapping in ARCH-SPEC §4.3.1.
- Resolve the standalone palette (`--sg-a0` … `--sg-d7` plus a boundary
  color) into 10 fixed hex values; keep hues consistent with the standalone
  (primary + viz-series mixes). Record the hex table in ARCH-SPEC §4.3.1.
- Lane headers: office name + derived state count per lane (count from data,
  not hardcoded). Row guides: the canonical family labels in order
  (A0 / 7-35, A1 / 7-34, A2 / 7-33, D1 / 7-22, D2 / 7-15, D3 / 7-Z37,
  D4 / 7-Z17, D5 / 7-Z12, D6 / 7-8, D7 / 7-1 terminal, plus the satellite
  band labels and boundary band).
- Guides render in their own SVG group under the nodes group.

## Tasks

- [x] Port polygon shape helpers into sibling `lib/nodeShapes.ts`
- [x] Define the fixed 10-color tier palette; resolve `color-mix` composition
- [x] Emit lane backgrounds (office + count) and row guide labels
- [x] Document shape mapping + palette in ARCH-SPEC §4.3.1

## Acceptance criteria

- **AC-1**: shape mapping matches the standalone: A0 circle, A1 diamond,
  A2 hexagon, D1–D7 heptagon…tridecagon; satellite/boundary shapes ported
  with a documented mapping.
- **AC-2**: palette is 10 fixed hexes, no CSS `color-mix`/vars required at
  render time; identical across builds.
- **AC-3**: lane headers show office name + derived count (e.g. Mars 44);
  row guide labels match the canonical family order exactly.
- **AC-4**: guides render beneath nodes; no label overlaps the lane grids.

## Verification

Browser check on `/` (Network view): guides visible, headers correct,
shape classes present per tier; `grep` dist HTML for palette hexes.

Verified 2026-07-31: all ten anchor shape/color pairs; A0/A1/A2 and all
D1–D6 satellite variants; all three typed boundary shapes; 7 lane panels +
boundary panel; 19 canonical row labels; hover scaling for paths/polygons/
rects/circles; zero console errors. Element totals: 269 circles, 154 paths,
133 polygons, 42 rects. Full `dist/index.html` byte-identical across two
builds (md5 `65c6744c5c785acd97161e546032ce27`).

## Definition of done

Shapes/palette/guides render correctly, determinism preserved, manifest
refreshed, validate green, ARCH-SPEC updated.
