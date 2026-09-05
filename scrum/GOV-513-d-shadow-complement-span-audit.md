# GOV-513 - D-shadow complement-span audit

**Status:** Backlog · **Priority:** High · **Points:** TBD · **Epic:** [EPIC-520](EPIC-520-unified-operator.md) · **Sprint:** Sprint 4
**Depends on:** [EPIC-520-1](EPIC-520-1-unified-operator-planning.md) · **Blocks:** H1's D-shadow route assessment

**Mapping:** EPIC-520-1 §4 check (i) D-shadow -> GOV-513. This is newly
specified research work, not a queued or executed D-shadow result.

## Story

As a research maintainer, I want the direct-complement span relation for D-tier
anchors pre-registered and tested so a possible D-channel shadow relation can
be retained or rejected without treating a result as an operator or authority.

## Scope

- Read exactly the 49 canonical records with `role=anchor` and `tier in
  {D1,...,D7}` from `canonical/universal-heptatonic-ledger.json`; seven anchors
  per D tier. Exclude A anchors, satellites, boundaries, and graph projection.
- For each rooted 12-bit anchor mask `m`, derive its five-note complement
  `c = 4095 ^ m`. Derive anchor and complement spans from fifth positions and
  cyclic gaps: `span = 12 - largest cyclic gap`; complement holes are
  `span + 1 - 5`.
- Test the pre-registered direct-complement claim
  `span(complement(m)) = span(m) - 2` for every in-scope anchor. If a
  `T+/-1(complement(m))` form is recorded, report it separately: transposition
  does not alter span and cannot create a passing result.
- Emit deterministic, source-bound planning evidence with `confirmed`,
  `refuted`, or `partial` verdict semantics. The verdict applies only to this
  span relation, not to a unified operator.

## Hypothesis dispositions

| Check outcome | H1 common construction | H2 ring force | H3 declared D signatures |
|---|---|---|---|
| Confirmed for all 49 anchors | Supports one possible common-shadow route only; H1 still requires an authorized derivation of every D4/D5 contact, office, and orientation condition. | No disposition; H2 requires GOV-515's exhaustive ring-force enumeration. | Does not refute H3; declared-signature removal/variation remains its discriminating test. |
| Partial for a pre-registered strict subset | Retain only tier-named, non-generalized support for the passing subset. | No disposition. | Compatible but not probative. |
| Refuted on complete valid scope | Weakens this D-shadow route to H1, not H1 as a whole. | No disposition. | Compatible but not confirmation. |

Partial means at least one named D tier passes and at least one named D tier
fails after complete scope and arithmetic validation. Scope, source-binding, or
integrity failure is invalid evidence, not a `partial` research result.

## Acceptance criteria

1. The artifact records the exact D-anchor scope, source SHA-256 bindings,
   canonical identity pairings, complement masks, fifth positions, spans,
   `span-2` expectation, per-tier counts, total count, and computed verdict.
2. `confirmed` requires all 49 canonical identity pairings to satisfy the
   relation; `refuted` requires complete valid scope with no D-wide relation;
   `partial` names every passing and failing tier without extrapolation.
3. A deterministic shuffled-baseline control retains anchor and complement
   records but deranges their pairings by declared algorithm, seed, and
   permutation. The canonical pairing and shuffled statistic are reported
   separately; the shuffle is a null control, not operator evidence.
4. The check never derives an office, changes a D contact signature, writes
   topology, adds graph edges, admits a record, ranks a tier, or writes
   `harmonic.C_H`.
5. A rerun over the same authoritative bytes is deterministic under build twice
   and reordered source input.

## Negative controls and tamper fixtures

- Reject any A anchor, satellite, boundary, duplicate, missing D anchor, or
  altered scope count.
- Reject a changed source mask, complement mask, fifth position, span,
  `span-2` expectation, identity pairing, shuffle seed/permutation, tier count,
  total, verdict, source binding, or candidate fingerprint, including a
  rehashed semantic tamper.
- Reject a record that adds an authority field such as office assignment, graph
  edge, admission effect, runtime action, or global `harmonic.C_H` value.
- Do not let a shuffled pairing, D4-only result, D5-only result, or transposed
  form substitute for the canonical all-tier direct-complement claim.

## Verification

- Use `src/governor/shadow_ladder.py`'s fifth-order/span definitions rather
  than a competing span calculation; verify canonical source bindings before
  execution.
- Run schema, freshness, scope, arithmetic, deterministic build-twice,
  reordered-input, negative-control, and adversarial-tamper checks.
- Record every ticket-named suite in the QA completion receipt as `ran` or
  `skipped` with a non-empty reason. No Neo4j, browser, or external service is
  required; an unexpected requirement is a fail-closed environment gap.
- Re-audit any source/spec/output mismatch through the maintainer review channel
  before adoption; it fails this phase and is never silently normalized.

## Definition of done

A source-bound D-shadow receipt records one outcome-honest verdict and its
limited H1/H2/H3 dispositions, with all controls and tamper fixtures passing.
No unified-operator, topology, admission, runtime, or global-compression claim
is made.

## References

- [EPIC-520-1](EPIC-520-1-unified-operator-planning.md)
- `canonical/universal-heptatonic-ledger.json`
- `src/governor/shadow_ladder.py:90-119`
- `provenance/OBSERVATION_LEDGER.md:51-74,247-279`
- `docs/TOPOLOGY_IDENTITY_AND_INVARIANTS.md:119-149`
- `docs/verification/VERIFICATION_REPORT_GATE_STATUS.md`
