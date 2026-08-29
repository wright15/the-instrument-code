# GOV-512 - Research Gate 3

**Status:** Backlog · **Priority:** High · **Points:** TBD · **Epic:** [EPIC-512](EPIC-512-taxonomy-explorer.md) · **Sprint:** Sprint 3
**Depends on:** GOV-510, GOV-511 · **Blocks:** Conditional EPIC-520 activation

## Story

As a release maintainer, I want Research Gate 3 to decide only from completed
GOV-510 and GOV-511 evidence so a future unified-operator workstream can open
only under an explicit dual-confirmation record.

## Scope

- Consume completed, schema-valid GOV-510 and GOV-511 artifacts and their QA
  receipts, not planning tickets or visual interpretations.
- Record an outcome matrix and an explicit decision-ledger entry.
- Regenerate ledger-bound shadow-ladder planning evidence after the gate's ledger
  entry and before downstream release evidence is refreshed.
- Open EPIC-520 only when both completed results are positive; otherwise leave
  its conditional record unopened and create no subordinate implementation work.

## Acceptance criteria

1. The gate identifies exact artifact fingerprints, validator receipts, and
   verdicts for both prerequisite stories.
2. A positive decision requires both results to be explicitly confirmed; partial,
   refuted, unavailable, stale, or schema-invalid evidence is non-positive.
3. The gate records one of `open`, `do_not_open`, or `defer` with a written
   derivation that names the governing inputs.
4. The decision is called `Research Gate 3`; it does not overload the existing
   `R3` mutation-operator namespace.
5. The result closes the gate story regardless of outcome and preserves all
   source evidence for later review.
6. After the decision-ledger entry is recorded, the shadow-ladder artifact and
   its receipt are regenerated and validate against the new ledger binding.

## Non-goals and guards

- A planning document, demonstration, or visual resemblance is not a completed
  research input.
- The gate cannot synthesize an operator, alter topology, change admission, or
  claim global `harmonic.C_H` authority.
- Arithmetic output wins over planning assumptions. The decision matrix uses
  emitted verdicts and recorded counts, not expected totals.

## Verification

- Validate the two input schemas, fingerprints, freshness, and verdict fields.
- Exercise dual-confirmed, single-confirmed, refuted, partial, stale, and absent
  fixture matrices.
- Verify the resulting decision-ledger entry and conditional EPIC-520 status.
- `npm run build:shadow-ladder --silent && npm run validate:shadow-ladder --silent`

## Definition of done

Research Gate 3 has a reproducible, outcome-honest decision record based only
on completed GOV-510 and GOV-511 evidence.

## References

- `provenance/DECISION_LEDGER.md`
- `provenance/SOURCE_AUTHORITY.md`
- [GOV-510](GOV-510-twin-hub-contact-convergence-audit.md)
- [GOV-511](GOV-511-d-tier-fifth-space-census.md)
