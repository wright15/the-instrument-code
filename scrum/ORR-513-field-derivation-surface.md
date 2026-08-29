# ORR-513 - Field derivation surface

**Status:** Backlog · **Priority:** High · **Points:** TBD · **Epic:** [EPIC-511](EPIC-511-orrery-evidence-surfaces.md) · **Sprint:** Sprint 3
**Depends on:** ORR-512 · **Blocks:** ORR-521

## Story

As an Orrery user, I want research-derived field relationships presented with
their verdict and authority boundary so I can inspect evidence without mistaking
a planned result for an admitted graph fact.

## Scope

- Present source-bound GOV-510 and GOV-511 outputs when available, including
  `confirmed`, `refuted`, or `partial` status and the inputs that produced it.
- Keep the presentation outcome-agnostic: a refuted or partial result remains
  inspectable and does not disappear behind a success-only interface.
- Preserve the ORR-511 bundle and ORR-512 provenance contract.

## Acceptance criteria

1. Every research visualization displays its evidence status and authority
   boundary adjacent to the value or relation it depicts.
2. Confirmed, refuted, partial, unavailable, and incompatible result states are
   visually distinct and carry no implied admission effect.
3. The surface links each rendered relation to its registered source inputs and
   validator receipt.
4. Deterministic tests prove the same result produces the same labels, order,
   and non-admission warning.
5. Negative action tests prove the surface cannot create a legal move, graph
   edge, office assignment, admission record, or mutation request.

## Non-goals and guards

- This story does not decide GOV-512 or open EPIC-520.
- A confirmed visualization is still planning evidence until a separately
  authorized release decision says otherwise.
- Arithmetic output wins over planning assumptions. Any displayed relationship
  total must be read from the result artifact and accompanied by its derivation.

## Verification

- Unit and browser coverage for every verdict state and source link.
- Negative-action tests for UI events and network requests.
- `npm run orrery:check`, `npm run orrery:test`, and relevant browser tests.

## Definition of done

All verdict states are outcome-honest, source-bound, and incapable of changing
upstream authority through the interface.

## References

- `provenance/OBSERVATION_LEDGER.md`
- `provenance/NEXT_STEPS.md`
- `provenance/SOURCE_AUTHORITY.md`
