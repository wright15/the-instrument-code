# NET-106 — Docs (ARCH-SPEC) + release closure

**Status:** Done · **Priority:** High · **Points:** 5 · **Epic:** [EPIC-001](EPIC-001-network-replica.md)
**Depends on:** [NET-101](NET-101-office-lane-layout.md) → [NET-105](NET-105-toggle-defaults.md) (last story)

## Story

As the release owner, I want ARCH-SPEC to describe the replica accurately
and the full validation chain to pass twice, so the change is documented,
deterministic, and releasable.

## Context

ARCH-SPEC §4.3.1 currently describes the force-layout approach. It must be
rewritten for the office-lane replica (layout scheme, palette hex table,
shape mapping, guide labels, determinism), §4.2 tree entry for
`networkLayout.ts` updated, and a §9 implementation note added. The
`networkLayout.ts` required-file check already exists; the scrum folder
itself must not break manifest parity.

## Tasks

- [x] Rewrite ARCH-SPEC §4.3.1: replica layout (lanes, rows, anchor/satellite/
      boundary placement), fixed tier palette table, shape mapping, guide
      labels, determinism statement, toggle behavior
- [x] Update §4.2 tree + §5 lib list if wording changed
- [x] Add §9 implementation record entry (replica replaces force layout;
      diagnosis: default-view no-op + faint edges)
- [x] Rebuild site; `npm run package:manifest`; `npm run validate` twice
- [x] Determinism proof: md5 of sampled network edge coordinates across two
      consecutive builds
- [x] Full browser sweep: lanes/guides, 588 edges, toggle, filter scenarios,
      hover highlight, no console errors
- [x] Cleanup: remove `.playwright-cli`, stop throwaway http server

## Acceptance criteria

- **AC-1**: ARCH-SPEC §4.3.1 contains no reference to the force layout; it
  documents the replica, the palette hexes, the shape mapping, and the guide
  label order.
- **AC-2**: §9 records the change (diagnosis + replacement).
- **AC-3**: `npm run validate` passes **119/119 twice**; MANIFEST/CHECKSUMS
  parity green; offline-closure green.
- **AC-4**: determinism diff: sampled edge coordinate md5 identical across
  two consecutive site builds.
- **AC-5**: browser verification recorded for every story's AC (lanes,
  edges 588, toggle, filters, hover, click, tooltip); zero console errors.
- **AC-6**: no stray `.playwright-cli` dir or running throwaway server left
  behind; scrum ticket statuses updated to Done.

## Verification

```bash
npm run bestiary:build:site
npm run package:manifest
npm run validate      # ×2
```

Verified 2026-07-31: two consecutive final site builds emitted identical
`dist/index.html` SHA-256
`2034cc9eb6fa422c4c41695b63d89236efdb38d04bba2961c8b7a645f5466d27`.
The browser sweep covers all 598 nodes, reserved zones/guides, exact 588 edge
counts and filter behavior, four-neighbor hover, non-state tooltip/navigation,
segmented toggle semantics, JavaScript-disabled SSR default, 390px rendering,
and zero console messages. Manifest/checksums were refreshed and full release
validation passed 119/119 twice. Browser artifacts and the throwaway server
were removed.

## Definition of done

Docs accurate, validation 119/119 ×2, determinism proven, browser sweep
clean, board closed.
