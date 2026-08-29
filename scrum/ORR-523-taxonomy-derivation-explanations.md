# ORR-523 - Taxonomy derivation explanations

**Status:** Backlog · **Priority:** High · **Points:** TBD · **Epic:** [EPIC-512](EPIC-512-taxonomy-explorer.md) · **Sprint:** Sprint 5
**Depends on:** ORR-521, ORR-522 · **Blocks:** ORR-524

## Story

As a user, I want the Taxonomy Explorer to explain a record's declared source
and derivation path so I can inspect relationships without mistaking a UI path
for a new canonical edge or a research verdict.

## Scope

- Reuse the ORR-512 bounded provenance contract for full-taxonomy records.
- Explain only declared source, derivation, role, and evidence relationships.
- Treat GOV-510 output as optional context: its result may be shown when
  compatible, but ORR-523 must work and remain outcome-agnostic without it.

## Acceptance criteria

1. Each explanation identifies its source artifacts, declared relationship type,
   authority status, and unavailable/withheld state.
2. D-tier and fifth-space paths remain descriptive; the UI does not infer a
   theorem, operator, office assignment, or admission effect.
3. Optional GOV-510 context is clearly labelled and does not change a record's
   source-backed explanation when confirmed, refuted, partial, or absent.
4. Ordering, source links, and labels are deterministic for identical inputs.
5. Negative action tests prove no explanation control can create a graph edge,
   legal move, mutation request, office assignment, or admission decision.

## Non-goals and guards

- This story does not require a positive GOV-510 result and does not open
  EPIC-520.
- A visual derivation chain must never be written back into canonical or Neo4j
  data merely because it is rendered.
- Arithmetic output wins over planning assumptions. Any path or relation count
  is generated from cited artifacts and is accompanied by its derivation.

## Verification

- Contract, unit, and browser tests for source paths, withheld data, optional
  GOV-510 context, and deterministic ordering.
- Negative action tests for every interactive explanation affordance.
- `npm run orrery:check`, `npm run orrery:test`, and relevant browser tests.

## Definition of done

Full-taxonomy explanations are source-bound, outcome-agnostic, and proven unable
to mutate authority through user interaction.

## References

- [ORR-512](ORR-512-provenance-explain-surface.md)
- [GOV-510](GOV-510-twin-hub-contact-convergence-audit.md)
- `docs/GOVERNOR_GRAPH_READ_API.md`
