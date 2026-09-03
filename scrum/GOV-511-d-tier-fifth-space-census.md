# GOV-511 - D-tier fifth-space census

**Status:** Done · **Priority:** High · **Points:** TBD · **Epic:** [EPIC-510](EPIC-510-full-field-derivation.md) · **Sprint:** Sprint 2
**Depends on:** GOV-501 · **Blocks:** GOV-512, ORR-522, ORR-524

**Receipt:** `qa/fifth-space-census-validation.json` 24/24. Gate-time candidate
fingerprint `570679df…` (decision input); artifact refreshed post-entry to
`556d3f65…`, verdict `confirmed` unchanged. 462 records `records[]` ungated by
verdict (ORR-522 consumes regardless). Consumed by GOV-512 at
`provenance/DECISION_LEDGER.md:35`.

## Story

As a research maintainer, I want a schema-closed fifth-space census over all 462
canonical state records so interface work can use a complete dataset without
treating a descriptive span measurement itself as a D-tier verdict.

## Scope

- Emit a versioned 462-record census, strict schema, deterministic validator,
  and source-bound QA receipt.
- Use the existing `fifth_span` definition rather than reimplementing an
  incompatible span calculation.
- Emit a canonical binary representation for fifth-space — `fifthMask` integer `0..4095` and `fifthPositions` derived deterministically from `pitchClasses` via `FIFTH_ORDER`/`FIFTH_POS` in `src/governor/shadow_ladder.py` — alongside `fifthSpan`/`fifthArc` so downstream ingestion can read the census as an integer without inferring geometry from prose.
- Add companion checks for 17-family office uniformity, the `GOVERNS`
  out-degree table, and the OBS-013 geometric termination addendum.
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
2. Each record has explicit source identity, role/tier status, fifth-span data
   with its canonical binary `fifthMask`/`fifthPositions` representation, and a
   provenance path; unknown or inapplicable values are explicit rather than
   inferred.
3. The validator uses the existing `fifth_span` definition, proves the binary
   field is byte-identical to `FIFTH_POS` deterministically derived from
   `pitchClasses`, and proves C0 against `court-rooted-positions.json`,
   including its admitted mask `661`.
4. Schema, source-drift, cardinality, ordering, binary-field equivalence, and
   tampering fixtures fail deterministically.
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

- Build twice and reorder the source input without changing the intrinsic bytes,
  including byte-identical `fifthMask`/`fifthPositions`.
- Run schema, source-binding, C0, cardinality, binary-equivalence, and
  adversarial-tamper tests.
- Verify the delivered dataset can be consumed by an ORR-522 fixture without a
  truth-value gate.

## Definition of done

A strict, source-bound 462-record census and its QA receipt pass independently;
its separate research verdict is outcome-honest and exposes no authority beyond
descriptive planning evidence.

Execute `npm run build:shadow-ladder`, re-verify `qa/shadow-ladder-validation.json`, and record the refreshed ledger SHA before closing Sprint 2. Note: The shadow-ladder rebuild is owned by whichever research story (`GOV-510` or `GOV-511`) closes last. If `GOV-510` is still open when `GOV-511` finishes, transfer this closing step to `GOV-510`'s DoD.

**Ownership (Sprint 2 kickoff directive):** this story is the primary owner of
the S2→S3 shadow-ladder rebuild and fixed-point loop. The OBS-013 geometric
termination addendum lands in `provenance/OBSERVATION_LEDGER.md` **before** the
census is generated — the census binds both `decisionLedgerSha256` and
`observationLedgerSha256`, so the ledger entry must precede artifact emission
(ledger → sidecar DAG, never sidecar → ledger).

## References

- `src/governor/shadow_ladder.py`
- `seven-governors-court-substrate-v0.1.0/canonical/court-rooted-positions.json`
- `canonical/fivefold-incubator/shadow-ladder-v0.json`
- `qa/shadow-ladder-validation.json`
