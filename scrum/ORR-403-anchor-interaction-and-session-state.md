# ORR-403 - Anchor interaction and local session state

**Status:** Done · **Priority:** High · **Points:** 5 · **Epic:** [EPIC-009](EPIC-009-harmonic-orrery-mvp.md)
**Depends on:** ORR-402 · **Blocks:** ORR-406, ORR-408

## Story

As a player, I want selection, inspection, and discovery state to persist in my
browser so exploration feels continuous without creating accounts or server-side
game state.

## Scope

- Add an Orrery HUD with selected anchor, visited anchors, current local Court
  position placeholder, and clear API health state.
- Encode shareable, non-secret selection/session fields in the URL.
- Store optional local progress in a versioned localStorage document.
- Add a concise inspector that uses plain musical and structural language before
  advanced terminology.
- Treat API release/schema mismatch, unavailable network data, and invalid URL
  state as visible reset/reload conditions.

## Implementation record

- [x] Add a versioned, source-identified local session document for selected and
      visited anchors with an unset local Court presentation placeholder.
- [x] Restore only a valid `?anchor=<state-id>` selection; invalid links select
      nothing, preserve no arbitrary fallback, and offer a clear-link action.
- [x] Hydrate compatible saved progress automatically and safely discard stale,
      malformed, oversized, or incompatible local documents without touching
      unrelated browser storage.
- [x] Add selected-anchor, visited-count, Court placeholder, API-health, and
      recovery controls to the HUD.
- [x] Keep State Governor, tier band, representative wavelength, photonic
      compression, scoped `W_A012`, and profile release visibly distinct in the
      inspector.
- [x] Classify unavailable projection responses separately from schema or release
      incompatibility, without hydrating or overwriting local progress.
- [x] Add unit and browser coverage for URL/session validation, persistence,
      reload recovery, invalid links, stale storage, unavailable projection,
      incompatible projection, WebGL fallback, and keyboard navigation.

## Acceptance criteria

1. A URL can restore a selected valid anchor and rejects an unknown ID without
   replacing it with an arbitrary node.
2. Local storage includes schema version and source release identity; incompatible
   saved state is discarded with an explanation.
3. Visiting, selecting, and inspecting nodes change only local session state.
4. The inspector distinguishes State Governor, tier, scoped `W_A012`, and
   photonic data rather than presenting them as one score.
5. A first visit has clear controls without requiring a theory tutorial.

## Verification

- `npm run orrery:check`
- `npm run orrery:test` (10 tests)
- `npm run orrery:build`
- `npm run orrery:api:test` (6 tests)
- `npm run orrery:browser:test`
