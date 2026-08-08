# NET-101 — Office-lane layout engine (`networkLayout.ts` rewrite)

**Status:** Done · **Priority:** High · **Points:** 8 · **Epic:** [EPIC-001](EPIC-001-network-replica.md)
**Depends on:** — · **Blocks:** NET-102, NET-103, NET-104

## Story

As a visitor to the dashboard Network view, I want the 462 scale states laid
out in the deterministic office-lane / tier-row chart of the standalone
Seven Governors network, so the topology reads the same way it does in
`graph/index.html`.

## Context

`lib/networkLayout.ts` currently runs a fixed-seed force simulation
(mulberry32 + 200 iterations). It is deterministic but produces an organic
clump that does not resemble the standalone chart. The standalone's
`officeLayout("office")` (in `graph/src/seven-governors-network.fragment.html`)
places states purely by data: 7 office lanes, fixed row y-coordinates per
family group, anchors at lane+row centers, satellites in small grids
(`placeCluster`), boundaries in their own band. Port that scheme.

## Technical notes

- Reference geometry from the fragment: width 1500, left 190, step 194;
  row y-coords 110/185/260/335/410/485/575/650/740/825/910/990/1075/1155/
  1240/1320/1405/1485/1585 (satellite rows vs anchor rows interleaved);
  cluster offsets like `[-34, 0, 34] × [-17, 17]`.
- Data mapping (from `bestiary-data.json`): satellites = `role ===
  "satellite"` grouped by `office` + `tier`; anchors = `role === "anchor"`
  per `office` + `tier`; boundaries = `role === "boundary"`.
- Remove `mulberry32`, `LAYOUT_SEED`, `ITERATIONS` — pure placement, zero
  RNG. Jitter is neither needed nor allowed (ARCH-SPEC §1.3).
- Keep the exported shape: `computeNetworkLayout(archetypes, relationships)`
  → `{ positions, edges }` (edges unchanged from current implementation).
- SSR only: the client island must never compute positions.

## Tasks

- [ ] Port the lane/row/`placeCluster` geometry into `networkLayout.ts`
- [ ] Place anchors (per office+tier), satellites (clusters), boundaries (band)
- [ ] Remove all RNG/force code; verify zero `Math.random`/seeded calls
- [ ] Keep structural-edge construction (588) unchanged

## Acceptance criteria

- **AC-1**: positions derive purely from data fields (office/tier/role/forte);
  no RNG anywhere in the layout module.
- **AC-2**: every scaleState placed exactly once; anchors at lane+row centers;
  satellites within their tier row band; boundaries in the boundary band.
- **AC-3**: spot checks pass — `state:1001` (Mars, D5, satellite) in the Mars
  lane's D5 satellite row; `state:1453` (Jupiter A0 anchor) at Jupiter lane,
  A0 anchor row; a boundary state in the boundary band.
- **AC-4**: two consecutive site builds emit identical coordinates (no drift).
- **AC-5**: `computeNetworkLayout` signature preserved; edges output still
  exactly 588.

## Verification

```bash
npm run bestiary:build:site        # clean build
# extract a sample of state coordinates from dist/index.html twice; md5 match
npm run validate
```

## Definition of done

Code merged, site builds, manifest refreshed, validate green, ARCH-SPEC §9
note updated.
