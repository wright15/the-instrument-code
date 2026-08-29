# ORR-521 - Taxonomy Explorer read model

**Status:** Backlog · **Priority:** High · **Points:** TBD · **Epic:** [EPIC-512](EPIC-512-taxonomy-explorer.md) · **Sprint:** Sprint 4
**Depends on:** ORR-513 · **Blocks:** ORR-522, ORR-523, ORR-524

## Story

As a user, I want a read-only explorer model for the complete 462-state taxonomy
so I can filter and inspect canonical records without treating the existing
21-anchor `/nodes` endpoint as a hidden full-field contract.

## Scope

- Define a versioned, schema-checked read model for 462 source-backed records.
- Support deterministic filtering and inspection by role, tier, Forte, office
  status, and source authority where those properties are defined.
- Preserve visible unavailable, withheld, proposed, and non-admitted states.

## Acceptance criteria

1. The read model reconciles exactly 462 records with the canonical role
   partition and preserves stable identity/order for the same source release.
2. Filter and inspector results expose source identity and authority status;
   unknown or withheld values are explicit.
3. The model does not change `/nodes`, create a raw query surface, or write to
   Neo4j, canonical sources, local session, or a ledger.
4. Schema, source-drift, deterministic-order, invalid-filter, and unavailable
   response tests pass.
5. The explorer does not substitute a nearby node when an ID is invalid or a
   record is unavailable.

## Non-goals and guards

- This story is not a taxonomy admission decision or a replacement for the
  existing 21-anchor Orrery contract.
- Rendering cannot infer office membership, tier authority, or a new relationship
  from a filter match.
- Arithmetic output wins over planning assumptions. Taxonomy counts are emitted
  from the read model and reconciled against canonical source data.

## Verification

- Unit tests for schema validation, stable ordering, filters, and absent states.
- Browser tests for a 462-record response, invalid IDs, unavailable data, and
  keyboard-accessible filtering.
- `npm run orrery:check`, `npm run orrery:test`, and relevant browser tests.

## Definition of done

The read model provides deterministic, source-identified exploration of all 462
records without expanding API, graph, or runtime authority.

## References

- `docs/TOPOLOGY_IDENTITY_AND_INVARIANTS.md`
- `qa/completion-validation-report.json`
- `provenance/SOURCE_AUTHORITY.md`
