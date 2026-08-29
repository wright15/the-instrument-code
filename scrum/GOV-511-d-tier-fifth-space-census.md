# GOV-511 - D-tier fifth-space census

**Status:** Backlog · **Priority:** High · **Points:** TBD · **Epic:** [EPIC-510](EPIC-510-full-field-derivation.md) · **Sprint:** Sprint 2
**Depends on:** GOV-501 · **Blocks:** GOV-512, ORR-522

## Story

As a research maintainer, I want a schema-closed fifth-space census over all 462
canonical state records so interface work can use a complete dataset without
treating a descriptive span measurement itself as a D-tier verdict.

## Scope

- Emit a versioned 462-record census, strict schema, deterministic validator,
  and source-bound QA receipt.
- Use the existing `fifth_span` definition rather than reimplementing an
  incompatible span calculation.
- Bind Court C0 from the admitted Court position source, retaining its canonical
  mask and coordinate identity rather than copying historical prose labels.
- Pre-register any fifth-space research question and emit its separate,
  schema-validated `confirmed`, `refuted`, or `partial` verdict without altering
  or suppressing the descriptive census.
- Make the dataset available to ORR-522 regardless of whether its research
  observations support a further hypothesis.

## Acceptance criteria

1. The census contains exactly 462 canonical state records and reconciles the
   21 A anchors, 49 D anchors, 238 satellites, and 154 boundaries.
2. Each record has explicit source identity, role/tier status, fifth-span data,
   and a provenance path; unknown or inapplicable values are explicit rather
   than inferred.
3. The validator uses the existing `fifth_span` definition and proves C0 against
   `court-rooted-positions.json`, including its admitted mask `661`.
4. Schema, source-drift, cardinality, ordering, and tampering fixtures fail
   deterministically.
5. The census remains descriptive and independently usable by ORR-522. A
   separate, pre-registered research verdict is schema-valid, names its question,
   and cannot remove, relabel, or gate valid census data when it is confirmed,
   refuted, or partial.

## Non-goals and guards

- This is a dataset, not a theorem, admission decision, operator definition, or
  D-tier ranking.
- Do not reproduce the historical C0 label discrepancy from planning prose as a
  canonical Court identity.
- Arithmetic output wins over planning assumptions. The emitted 462-record
  distribution and its derivation control all documentation.

## Verification

- Build twice and reorder the source input without changing the intrinsic bytes.
- Run schema, source-binding, C0, cardinality, and adversarial-tamper tests.
- Verify the delivered dataset can be consumed by an ORR-522 fixture without a
  truth-value gate.

## Definition of done

A strict, source-bound 462-record census and its QA receipt pass independently;
its separate research verdict is outcome-honest and exposes no authority beyond
descriptive planning evidence.

## References

- `src/governor/shadow_ladder.py`
- `seven-governors-court-substrate-v0.1.0/canonical/court-rooted-positions.json`
- `canonical/fivefold-incubator/shadow-ladder-v0.json`
- `qa/shadow-ladder-validation.json`
