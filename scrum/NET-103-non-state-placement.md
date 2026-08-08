# NET-103 — Non-state archetype placement (all-598 contract)

**Status:** Done · **Priority:** Medium · **Points:** 3 · **Epic:** [EPIC-001](EPIC-001-network-replica.md)
**Depends on:** [NET-101](NET-101-office-lane-layout.md) · **Blocks:** —

## Story

As a dashboard user, I want the Network view to still show all 598
archetypes — not just the 462 states — with families, cycles, offices,
profiles, operators, and candidates anchored deterministically to their
related state clusters, so the replica preserves the dashboard's all-598
contract.

## Context

The standalone chart is states-only. Our dashboard promises all 598
archetypes in both views (dashboard stat cards, facets, and the network
toggle must stay consistent). Non-states have no edges, so they must be
placed by rule, deterministically:

- `governorOffice` (7): lane headers (their lane is their own).
- `canonicalProfile` (7): beside its office lane header (fixed offset).
- `scaleFamily` (38): at its forte's row, per-office offset.
- `modalCycle` (66): at its representative forte's row (offset cluster).
- `mutationOperator` (15): bottom strip; ring around its
  `degreeGovernor` office position (`M` at strip center).
- `candidateExtension` (3): corner grid, deterministic by `extensionId`.

## Tasks

- [x] Extend the layout module's non-state branch (replacing the current
      force-anchor logic)
- [x] Ensure zero overlap with state lane grids (fixed offsets)
- [x] Keep shapes: offices/profiles as their existing dashboard markers
      (hollow ring / filled circle), families as hollow rings, cycles as
      small rings, operators as squares, candidates as amber diamonds

## Acceptance criteria

- **AC-1**: all 598 archetypes have a position in the layout output (no
  undefined positions).
- **AC-2**: no non-state position falls inside a state's lane grid cell
  (deterministic offset check by construction).
- **AC-3**: `operator:M` at strip center; each R/L operator within a fixed
  radius of its degree-governor office position (Saturn/Jupiter/Mars/Sun/
  Venus/Mercury/Moon).
- **AC-4**: candidates occupy the corner grid, deterministic across builds.
- **AC-5**: hover/tooltip/click work for non-state nodes (no special-casing
  regressions in the island).

## Verification

Extract all 598 `data-point-id` anchors from dist HTML in Network view —
all present, all within the viewBox; spot-check operator ring positions.

Verified 2026-07-31: generated HTML contains all 598 Network anchors in the
1780×2120 viewBox (462 states + 136 non-states), with no duplicate or
out-of-bounds coordinates. The nearest state/non-state pair is 29.5px apart;
family rows have a 32px minimum gap. `operator:M` is at (772, 2040); every
R/L marker is ±16px from its degree-governor lane projection. Candidates are
sorted court/phenomena/thermodynamic at x=1568/1626/1684. Browser checks prove
operator hover + tooltip, candidate click-through, Network/Grid round-trip,
390px rendering without overflow, and zero console messages. Consecutive site
builds produced identical `dist/index.html` SHA-256
`434e0d3f1c2fea2c3c382c69076161465fc6f6702f994cdcb65d1aa7fde534f9`.

## Definition of done

All-598 placement verified in browser, determinism intact, manifest
refreshed, validate green.
