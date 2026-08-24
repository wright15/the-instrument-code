# ORR-406 - Legal-move game loop and local objectives

**Status:** Done · **Priority:** High · **Points:** 8 · **Epic:** [EPIC-009](EPIC-009-harmonic-orrery-mvp.md)
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

## Implementation record

- [x] Generate and validate the versioned
      `harmonic-orrery.modal-anchor-cycles.v1` catalog from audited operator,
      application, modal-completion, and cycle-identity sources. The catalog
      contains exactly 21 projected A0-A2 modal-successor (`M`) moves in three
      verified seven-step cycles.
- [x] Parse the bundled catalog strictly, require compatibility with the live
      `/nodes` source and anchor identities (tier, Forte family, and office),
      and fail closed for an incompatible projection, unavailable target, raw
      graph edge, inverse, or non-modal operation.
- [x] Store bounded local route/Court histories, selected catalog moves, and
      completed objectives in `harmonic-orrery.session.v3`; migrate valid v1/v2
      sessions without fabricating route history.
- [x] Add the Move Desk with explicit start, select, apply, resume, clear, and
      reset controls. It keeps free inspection visibly separate from an active
      route and discloses operator, provenance, and undeclared Degree Governor
      metadata.
- [x] Score the modal orbit, seven-office exploration, two-step
      Lydian-to-Aeolian route, and C0-C4 traversal locally. No API, Neo4j,
      canonical identity, Court runtime, or Mercury ledger mutation is added.

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

Implemented verification:

- `npm run orrery:catalog:check` (21 source-backed moves; schema and closure)
- `npm run orrery:check`
- `npm run orrery:test` (33 tests)
- `npm run orrery:build`
- `npm run orrery:api:test` (6 tests)
- `npm run orrery:browser:test` (complete Lydian-to-Aeolian route, invalid-route
  feedback, C0-C4 objective, and reload recovery)
