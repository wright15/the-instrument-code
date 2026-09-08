# GOV-519 - Ring-forcing execution with pre-flight safety gate

**Status:** Backlog · **Priority:** High · **Points:** TBD · **Epic:** [EPIC-520](EPIC-520-unified-operator.md) · **Sprint:** Sprint 4
**Depends on:** [GOV-518](GOV-518-ring-constraint-forcing-enumeration.md) frozen boundary (D1–D6/D8 registered; D7/D9/D10 ratified) · **Blocks:** H2 execution verdict and any EPIC-520 synthesis

**Mapping:** EPIC-520-1 §4 H2 ring-force gate, execution side. GOV-518 is the
immutable constraint boundary; this ticket tracks implementation code, test
fixtures, and runtime receipts. It amends nothing in GOV-518.

**Completion receipt:** none yet — Phase 1 emits no enumeration, candidate
artifact, QA receipt, outcome selection, or H2 verdict. Receipts are state;
ticket status is not.

## Story

As a research maintainer, I want the GOV-518 enumeration to run only behind a
pre-flight gate that proves the execution path is blind to the comparison
side, so a dependency failure can never be mistaken for an H2 result and no
executor discretion leaks into the verdict.

## Frozen boundary (read-only from GOV-518)

GOV-518 supplies, and this ticket must not restate as new content: the
assignment space `X in Z_7^7` with bound `N = 7^7 = 823543`; the total
K-neighbor projection map from assignment to per-coordinate run statistic
with its `primitive_variable_independence` proof; the relational shape form
`P(S) = argmax_i(S_i)`; the three predicates `C_adj`, `C_step2` (K
exhaustivity owned by OBS-008 only), `C_close` with the target-blind
selection attestation; the `D_7` quotient with its two-sided granularity
rationale; the lexicographic order with `order_invariance`; the R7-screened
witness and per-constraint strictness demonstrations; and the orbit bound
`N_orbit = 60028`, 60-second timeout, and deterministic CPU environment pin
with `completion_certificate`. The `canonical_observation_record` is a
fingerprint-verified post-enumeration comparison input only.

## Phase 1 scope — safety gate only (this phase)

Phase 1 builds and proves the gate. It runs no forcing search for a verdict:

- Static dependency checker `scripts/verify-gov518-boundary.mjs`: scans the
  production execution path and fails closed on any static import or file
  read reaching R7-excluded material. The comparison step is a separate
  entry point, verified across the `input_reach_boundary`.
- Execution runner skeleton `scripts/run-gov518-enumeration.mjs`: pure
  Z_7 compute implementing the registered map, predicates, `D_7`
  canonicalization, and lexicographic order. Refuses to enumerate unless the
  checker subprocess passes. Emits deterministic bytes only: no RNG,
  wall-clock, or locale input reaches the output.
- Target-blindness harness `scripts/check-gov518-target-blindness.mjs`:
  runs the enumerator with comparison artifacts replaced by null and garbage
  bytes and requires byte-identical class outputs. Failure means the design
  is loaded, and blocks Phase 2.
- Tamper corpus `qa/fixtures/gov-518/tamper-*.json`: synthetic semantic
  re-encodings, reversed orderings, and complement forms, each marked
  `expectedVerdict: reject`. Fixtures live outside the real input path, are
  fingerprinted through the root manifest and checksum binding, and their
  presence in a production run invalidates the run.

## Pre-flight gate logic

1. Runner self-scan: its own bytes must carry no reference to the excluded
   surface.
2. Checker subprocess must exit zero: production path clean, every tamper
   fixture confirmed rejectable, fixtures confined outside the production
   read surface.
3. Only then may `--enumerate` proceed to the orbit loop under the
   60-second ceiling, emitting the `completion_certificate` fields
   (`N_orbit`, visited representatives equal to `N_orbit`,
   admissible-class count, environment fingerprint).
4. Any gate failure, timeout, or stale binding yields
   `incomplete_or_anomalous` / `invalid` handling with reason — never a
   verdict, never a retry with changes.

## Negative controls

- Reject any production read of the tamper corpus or the comparison
  artifacts from the enumeration entry point.
- Reject a tamper fixture that carries no excludable marker (it would prove
  nothing).
- Reject selected-only output; the full class list in registered order is
  required before any comparison step.
- Reject a run whose gate receipt is missing or stale.
- Treat a missing source, environment gap, or timeout as invalid or partial
  evidence with a recorded `skipped` reason, never an H2 confirmation.

## Verification (Phase 1)

| Suite | Status |
|---|---|
| source-binding (gate files bound via manifest) | ran at fixed point |
| schema (tamper fixture shape) | ran |
| exhaustive-completion | skipped with reason: no verdict search in Phase 1 |
| determinism and build-twice (blindness harness) | ran |
| reordered-input | skipped with reason: order is registered lexicographic; reorder suite lands with Phase 2 search |
| negative-control (tamper corpus) | ran |
| target_blindness | ran |
| adversarial-tamper | ran |

## Stop point and queue guard

Phase 2 (the verdict search, comparison step, and receipt) requires a fresh
`MANIFEST.json` binding covering this ticket plus all four gate files,
accepted through the maintainer relay with the GOV-518 boundary confirmed
unchanged. GOV-518 stays frozen; GOV-517 queue discipline is untouched;
GOV-516 remains Review with its parallel-capacity grant as recorded.

## Non-goals and guards

- No unified operator, topology, admission, runtime behavior, release pin,
  or global `harmonic.C_H` value is created or implied.
- No enumeration result, outcome-category assignment, or H1/H2/H3
  disposition is emitted in Phase 1.
- Arithmetic output wins over planning prose; all four frozen outcome
  categories close the story with no signal favoring a positive result;
  no model prose is a mathematical source; ledger-to-scrum sync with
  citation only; frozen wording only.

## Definition of done

Phase 1 is done when the checker, runner skeleton, blindness harness, and
tamper corpus exist at the paths above, the harness reports byte-identical
blind and build-twice outputs, the manifest fixed point is clean, and this
ticket remains Backlog pending maintainer acceptance of the binding.

## References

- [GOV-518](GOV-518-ring-constraint-forcing-enumeration.md) (frozen boundary)
- [EPIC-520-1](EPIC-520-1-unified-operator-planning.md) (hypotheses; 2026-09-07 addendum anchors)
- `provenance/DECISION_LEDGER.md` (GOV-518 maintainer mathematical registration — 2026-09-07)
- `provenance/OBSERVATION_LEDGER.md` (OBS-008 owns K exhaustivity)
- `scripts/verify-gov518-boundary.mjs`
- `scripts/run-gov518-enumeration.mjs`
- `scripts/check-gov518-target-blindness.mjs`
- `MANIFEST.json`
