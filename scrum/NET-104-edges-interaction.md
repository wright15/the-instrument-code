# NET-104 — Structural edges + filter/hover interaction

**Status:** Done · **Priority:** High · **Points:** 8 · **Epic:** [EPIC-001](EPIC-001-network-replica.md)
**Depends on:** [NET-101](NET-101-office-lane-layout.md), [NET-102](NET-102-tier-shapes-palette-guides.md) · **Blocks:** —

## Story

As a dashboard user, I want the Network view to draw the 588 structural
edges color-coded by type — visible enough to read the network (matching the
standalone's ~0.42 opacity), hiding when either endpoint is filtered out,
and highlighting a node's neighbors on hover — so the chart behaves like the
interactive network it replicates.

## Context

The current island already implements: `bestiary:filter-change` + search
`apply()` (hides non-matching anchors), edge hiding when an endpoint is
hidden, hover tooltip + radius bump, and neighbor highlighting. The Network
rebuild must preserve all of this against the new layout/guides, with two
changes: edge opacity raised from 0.28 to ~0.42 (standalone parity) and the
edge legend already present reused. Edge color map is already centralized in
`EDGE_COLORS` (GOVERNS #8CF, MODAL_SUCCESSOR #34D399, CONSTRUCTS #FBBF24,
SEAT_CONTACT #C084FC, dashed).

## Tasks

- [x] Re-emit edge lines from the new layout positions (SSR)
- [x] Set default stroke-opacity 0.42; dashed `4 3` for SEAT_CONTACT
- [x] Re-verify `apply()` edge-hiding + hover highlight against new groups
- [x] Ensure guides group does not intercept pointer events
      (`pointer-events: none`)
- [x] Keep tooltip/click-through identical

## Acceptance criteria

- **AC-1**: exactly 588 edge lines; per-type counts CONSTRUCTS 28 / GOVERNS
  238 / MODAL_SUCCESSOR 182 / SEAT_CONTACT 140.
- **AC-2**: default edge opacity 0.42; SEAT_CONTACT dashed.
- **AC-3**: filtering to `scaleFamily` hides all edges (0 visible); clearing
  restores 588; filtering to office `Mars` keeps only edges whose endpoints
  are both Mars states (~50 edges, exact count recorded).
- **AC-4**: hover on `state:1001` highlights exactly its 4 incident edges
  and bumps neighbors 997 / 637 / 3913 / 2001; leave restores state.
- **AC-5**: zero console errors; anchors navigate on click; tooltip shows
  name + `id · kind` (· office when present).

## Verification

Playwright DOM assertions on `/` (Network view): edge counts, opacity,
filter scenarios, hover highlight, console error sweep. Cleanup
`.playwright-cli` and the http server afterwards.

Verified 2026-07-31: 588 lines at opacity 0.42, with counts 28/238/182/140
and all 140 SEAT_CONTACT lines dashed `4 3`. A discovered SVG visibility bug
was fixed by replacing inert `.hidden` property writes with actual `hidden`
attributes. Family-only now yields 38 nodes / 0 edges; clear restores 598/588;
Mars yields 45 nodes / exactly 50 edges, all with Mars endpoints. Hovering
`state:1001` highlights its four exact edges and scales 997/637/3913/2001;
leave restores opacity/width/scale. Tooltip content, click-through, guide
pointer behavior, and the console are clean.

## Definition of done

All acceptance criteria verified in browser, determinism intact, manifest
refreshed, validate green.
