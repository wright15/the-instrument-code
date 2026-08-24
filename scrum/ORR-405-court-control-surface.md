# ORR-405 - Court control surface and pentatonic voicing

**Status:** Backlog · **Priority:** High · **Points:** 5 · **Epic:** [EPIC-009](EPIC-009-harmonic-orrery-mvp.md)
**Depends on:** ORR-403, ORR-404 · **Blocks:** ORR-406, ORR-407

## Story

As a player, I want a visible C0-C4 control surface that changes local voice,
visual, and strategy emphasis while preserving the Court's four-pole and Mercury
engine boundaries.

## Scope

- Render C0 Major Pentatonic (661), C1 Scottish (677), C2 Qing Yu (1189), C3
  Minor Pentatonic (1193), and C4 Man Gong (1321) in canonical order.
- Model ordinary local movement as adjacent C0<->C1<->C2<->C3<->C4 navigation.
- Expose Mars, Jupiter, Venus, and Saturn as the four pole dispositions.
- Render Mercury at C2 as the transductive engine/ledger emblem, with no fifth
  binary input or pole index.
- Apply Court position only to local presentation and audio voicing until a
  separate game move contract is complete.

## Acceptance criteria

1. The displayed masks and scale names exactly match
   `schemas/elemental_pentatonic_scale_map_v1.0.0.yaml`.
2. C0-C4 local movement is adjacent-only by default; any future non-adjacent
   visual transition is labelled as presentation-only until ORR-406 adds a
   verified move contract.
3. The UI has four binary elemental-pole indicators, not five; Mercury has no
   toggle, bit, or pole index.
4. Court changes are local-session events and cannot write Neo4j or Court runtime
   state.
5. Audio and visual filters use the selected Court mask transparently and expose
   the retained pitch classes to the player.

## Verification

- Unit-test all five masks, names, ratios, adjacent routes, and Mercury negative
  cases.
- Browser-test the five controls, four-pole display, and no-fifth-toggle guard.
