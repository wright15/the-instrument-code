# ORR-522 - D-tier taxonomy dataset

**Status:** Backlog · **Priority:** High · **Points:** TBD · **Epic:** [EPIC-512](EPIC-512-taxonomy-explorer.md) · **Sprint:** Sprint 4
**Depends on:** GOV-511, ORR-521 · **Blocks:** ORR-523, ORR-524

## Story

As a user, I want a source-bound D-tier dataset in the Taxonomy Explorer so I
can inspect the available records and fifth-space fields without being told that
the dataset itself proves a research conclusion.

## Scope

- Consume GOV-511's schema-closed census as data, including source identity,
  fifth-span fields, explicit unavailable values, and authority status.
- Provide a stable fallback only when the census is absent, stale, or
  incompatible; a non-confirming research outcome remains a visible verdict,
  not a reason to withhold valid data.
- Keep research verdict presentation separate from the dataset contract.

## Acceptance criteria

1. The D-tier dataset identifies all source-backed D-tier records available in
   the GOV-511 census and preserves their exact source and ordering fields.
2. The explorer can render the dataset when GOV-511 is confirmed, refuted, or
   partial; only schema validity and source compatibility govern data use.
3. Missing, stale, or incompatible census data displays a bounded fallback with
   no invented values, inferred verdict, or substitute record.
4. Dataset schema, source-drift, result-state, fallback, and deterministic-order
   fixtures pass.
5. The presentation labels the data as descriptive/planning evidence where
   appropriate and never promotes it to admission or topology authority.

## Non-goals and guards

- The dataset is not a D-tier theorem, unified-operator proof, or EPIC-520 gate.
- Do not block the dataset solely because a hypothesis is refuted or partial.
- Arithmetic output wins over planning assumptions. Displayed D-tier and
  fifth-space totals come from the loaded census and retain their derivation.

## Verification

- Contract tests for confirmed, refuted, partial, absent, stale, and incompatible
  GOV-511 inputs.
- Browser tests for fallback visibility and source labels.
- Relevant GOV-511 and Orrery validation suites.

## Definition of done

The Taxonomy Explorer consumes the GOV-511 dataset faithfully under every valid
research outcome and exposes a safe fallback for invalid data.

## References

- [GOV-511](GOV-511-d-tier-fifth-space-census.md)
- `src/governor/shadow_ladder.py`
- `provenance/OBSERVATION_LEDGER.md`
