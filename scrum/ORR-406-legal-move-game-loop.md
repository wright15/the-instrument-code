# ORR-406 - Legal-move game loop and local objectives

**Status:** Backlog · **Priority:** High · **Points:** 8 · **Epic:** [EPIC-009](EPIC-009-harmonic-orrery-mvp.md)
**Depends on:** ORR-403, ORR-404, ORR-405 · **Blocks:** ORR-408

## Story

As a player, I want a small strategy and puzzle loop based on explicit harmonic
transitions so I can explore goals without treating arbitrary graph edges as
legal actions.

## Scope

- Define a new read-only, versioned legal-move catalog for the Orrery. It must
  derive from audited structural operators and declared transition records, not
  from generic graph reachability or raw `GOVERNS` edges.
- Add local session reducers for inspected state, selected legal move, Court
  presentation position, visited anchors, and objective progress.
- Start with small local objectives: complete a modal orbit, visit one anchor in
  each office, reach a target by a bounded route, and traverse C0-C4.
- Record route history as client-side experience data only; it is not Mercury's
  authoritative ledger.
- Surface invalid, unavailable, and unresolved move states rather than inventing
  a result.

## Acceptance criteria

1. The move catalog exposes only source-backed operations with source/target,
   operator identity, degree-governor metadata where declared, and provenance.
2. Every offered move is reproducibly valid for its source state; unavailable or
   out-of-scope moves are absent or explicitly unavailable.
3. Local objectives are scored from local route history and never alter canonical
   state, office, Court runtime, or Neo4j.
4. Route-dependent presentation is visibly distinct from intrinsic target identity.
5. A player can finish at least one short puzzle/discovery objective in a fresh
   browser session.

## Verification

- Add positive/negative move fixtures from the canonical mutation audit.
- Unit-test reducers, objective scoring, inverse/route rejection, and local-only
  persistence.
- Browser-test a complete short objective and invalid-move feedback.
