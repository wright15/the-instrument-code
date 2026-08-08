# EPIC-001 — Deterministic Seven Governors network replica (dashboard Network view)

**Status:** Done · **Priority:** High · **Owner:** bestiary workstream
**Epic ID:** EPIC-001 · **Stories:** [NET-101](NET-101-office-lane-layout.md),
[NET-102](NET-102-tier-shapes-palette-guides.md),
[NET-103](NET-103-non-state-placement.md),
[NET-104](NET-104-edges-interaction.md),
[NET-105](NET-105-toggle-defaults.md),
[NET-106](NET-106-docs-closure.md)

## Problem statement

The dashboard's "Topology view" toggle (Network ⇄ Grid) does not deliver the
Seven Governors network the user expects. Two verified root causes:

1. **Perceptual no-op**: Network is the default view, so clicking the
   already-active Network button changes nothing.
2. **Not a network yet**: the current Network view renders 598 small dots
   plus structural edges at 0.28 opacity — it reads as "scatter with faint
   lines," not as the network chart at `graph/index.html`.

Investigation of `graph/src/seven-governors-network.fragment.html` established
that the standalone network is **not** a physics simulation: it is a
deterministic **office-lane / tier-row organizational chart** (7 office lanes,
family row bands, anchors as tier-shaped polygons, satellites in small
clusters, boundaries as dots, type-colored edges at 0.42 opacity). Grid
placement — no RNG, no physics — so a faithful replica is fully compatible
with the release's byte-determinism policy (ARCH-SPEC §1.3, §4.3).

## Goal

Replace the dashboard Network view's force layout with a faithful,
deterministic replica of the Seven Governors network chart that renders all
**598 archetypes**, draws the **588 structural edges** color-coded by type,
keeps every existing interaction (hover-neighbor highlight, tooltip,
click-through, filter-aware edge hiding), and remains byte-deterministic
across builds. Network remains the default view with a clear segmented
toggle to the semantic Grid.

## Scope

**In:**
- `lib/networkLayout.ts` rewritten as the office-lane placement engine (SSR).
- Network group rendering in `Scatterplot.astro`: lane/row guides, tier-shaped
  nodes, edges, interaction.
- Toggle UX (unmistakable active state, Network default).
- Non-state archetypes placed deterministically (all-598 contract).
- ARCH-SPEC §4.3.1 / §4.2 / §9 updates.

**Out:**
- Physics animation, 3D, live zoom/pan physics (the standalone keeps that).
- Embedding or iframing `graph/index.html` itself.
- Any change to `bestiary-data.json` (layout stays site-side, SSR-derived).
- Non-deterministic layouts of any kind.

## Success criteria (measurable)

- **SC-1 · Completeness**: Network view renders all 598 archetypes — 462
  states placed in the office-lane chart (anchors centered per lane+row,
  satellites clustered, boundaries in the boundary band) plus the 136
  non-state archetypes at their deterministic anchors.
- **SC-2 · Edges**: exactly 588 structural edges drawn, color-coded by type
  with per-type counts CONSTRUCTS 28 / GOVERNS 238 / MODAL_SUCCESSOR 182 /
  SEAT_CONTACT 140.
- **SC-3 · Determinism**: two consecutive `npm run bestiary:build:site` runs
  emit byte-identical network coordinates (sampled edge md5 matches); no RNG
  in the layout code.
- **SC-4 · Fidelity**: node shapes follow the standalone mapping (A0 circle,
  A1 diamond, A2 hexagon, D1–D7 heptagon→tridecagon; satellite kind shapes;
  boundary dots); row guides labeled with the canonical family order
  (A0 / 7-35 → D7 / 7-1 terminal); lanes labeled with office + derived count.
- **SC-5 · Interaction**: hover on `state:1001` highlights exactly its 4
  incident structural edges and neighbors 997/637/3913/2001; filtering to
  `scaleFamily` hides all edges (0 visible) and clearing restores 588;
  click-through and tooltip unchanged.
- **SC-6 · Toggle**: Network is the default; Grid is reachable with one
  click; the active view is visually unmistakable; aria-label reflects the
  active view; no-JS renders the network.
- **SC-7 · Release integrity**: `npm run validate` passes 119/119 twice;
  MANIFEST/CHECKSUMS parity green; offline-closure green.
- **SC-8 · Docs**: ARCH-SPEC §4.3.1 documents the replica (layout scheme,
  palette, guide labels, determinism), §9 records the change, and the
  `networkLayout.ts` required-file check passes.

## Definition of done (epic)

All eight success criteria verified and recorded; all six stories closed with
their acceptance criteria; board moved to Done.

## Dependencies / sequencing

NET-101 → NET-102 → NET-103 → NET-104 → NET-105 → NET-106 (NET-103/105 can
run in parallel with NET-104 once NET-101/102 land).
