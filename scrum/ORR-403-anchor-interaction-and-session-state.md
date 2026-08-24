# ORR-403 - Anchor interaction and local session state

**Status:** Backlog · **Priority:** High · **Points:** 5 · **Epic:** [EPIC-009](EPIC-009-harmonic-orrery-mvp.md)
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

- Unit-test URL parsing, persistence migration/rejection, and release mismatch.
- Browser-test reload, shared URL, unavailable API, and keyboard focus order.
