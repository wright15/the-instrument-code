# GOV-516 - Run-space max-run uniqueness check

**Status:** Done · **Priority:** High · **Points:** TBD · **Epic:** [EPIC-520](EPIC-520-unified-operator.md) · **Sprint:** Sprint 4
**Depends on:** [GOV-515](GOV-515-ring-force-enumeration-definition.md) Stage 1 definition and maintainer review · **Blocks:** H2 execution and any EPIC-520 synthesis

**Mapping:** This is the separately scoped Stage 2 successor for EPIC-520-1
§4 check (iii). It carries GOV-515's frozen boundary without amendment to
record the unique max-run tier, if any, as a target fact rather than evidence
that the frame forces it. It is submitted to the maintainer relay for review;
no enumeration may begin until the review accepts the fresh `MANIFEST.json`
binding for GOV-515 and this ticket.

## Story

As a research maintainer, I want to enumerate the frozen run-space candidate set
so the max-run uniqueness check can record whether D5 is the unique target
coordinate or the frame has multiple targets, without treating that observation
as evidence of forcing or importing a declared signature or observed contact
result.

## Frozen inputs and boundary

The only mathematical input is
`canonical/fivefold-incubator/d-shadow-complement-span-v0.json` `runSpace`,
whose generator and validator bind it to canonical pitch-class masks. Process
the seven ordered `runSpace.tierSummaries` rows as D1 through D7; recompute the
ordered maxrun sequence; form `V = {i in 1..7 | r_i = max(r_1,...,r_7)}`; emit
every member of `V` in ascending order; and evaluate only `|V|` and `V = {5}`.

The Stage 1 fingerprint is not carried as a prose literal. The pre-evaluation
review must obtain its byte binding from the current generated `MANIFEST.json`,
then confirm that it matches the reviewed GOV-515 definition. A stale or
unavailable binding is invalid execution evidence and stops this ticket.

No office-ring token, anchor name, family, raw mask, construction edge,
satellite, declared D4/D5 contact signature, office assignment, observed D4/D5
result, GOV-514 result, or any source other than the frozen `runSpace` may enter
the enumeration.

## Registered vocabulary additions

| Term | Meaning in this ticket | Receipt |
|---|---|---|
| `maxrun` | Largest cyclic consecutive run in an anchor's fifth-position mask, recomputed from the source-bound run-space artifact. | OBS-017 |
| D-channel run sequence | Ordered D1-D7 maxrun values `(3, 3, 3, 3, 5, 2, 2)` from the complete run-space summary. | OBS-018 |
| D5 5-run | D5's office-uniform maximal five-run, contained in Court class `5-35`; this is an observation and not an input to the candidate set. | OBS-019 |

`span(complement(C)) = 11 - maxrun(C)` is a source-bound combinatorial identity
from OBS-017. It supplies no hypothesis disposition and does not add any
derivability input beyond the frozen `runSpace` rows.

## Admissible outcomes and dispositions

| Candidate-set result | Category | Ticket verdict | H1 | H2 | H3 |
|---|---|---|---|---|---|
| `V = {5}` | `one_target` | `confirmed` for uniqueness observation only | No disposition | No disposition | No disposition |
| `|V| > 1` | `multiple_targets` | `refuted` for uniqueness observation | No disposition | No disposition | No disposition |
| A named pre-registered subset completes and another named subset remains open | `incomplete_or_anomalous` | `partial` | No disposition | No disposition | No disposition |

An unavailable source, stale binding, timeout, incomplete search, or result
requiring an excluded input is invalid execution evidence, not a result that can
confirm H2. A result outside the frozen space is anomalous and cannot revise the
inputs, statistic, category, or verdict mapping.

## Negative controls and verification

- Reject any added declared D4/D5 signature, office result, observed result, or
  non-run-space source.
- Reject changed D-tier order, maxrun sequence, candidate-set definition,
  ascending candidate ordering, result category, verdict mapping, or Stage 1
  manifest binding.
- Reject a selected-only output; the complete ascending set `V` is required.
- Prove rehashed semantic tampering fails.
- Record source-binding, schema, exhaustive-completion, build-twice,
  reordered-input, negative-control, and adversarial-tamper suites exactly once
  each as `ran` or `skipped` with a non-empty reason.

## Maintainer review stop point

Before evaluating `V`, submit this ticket and the fresh GOV-515 manifest binding
through the maintainer relay. The reviewer must accept the unchanged input table,
candidate space, ordering, statistic, output categories, verdict mapping, and
negative controls. Review acceptance is an execution prerequisite, not a result
receipt. Until it is recorded, this ticket remains Review and does not execute.

## Non-goals and guards

- No unified operator, topology, office, admission, runtime, graph, release, or
  global `harmonic.C_H` authority is created.
- This does not alter the recorded GOV-513 or GOV-514 dispositions, rank H1/H2/H3,
  or synthesize their results.
- D5 Court-class containment and the `{2383, 3667}` intersection from OBS-019
  are not derivability inputs and cannot be selected as an outcome.

## Definition of done

After maintainer approval, a source-bound complete enumeration emits the full
candidate set and a generator-derived category/verdict, proves its controls,
records every named suite, and records only the disposition in the table above.
Without maintainer approval, completion is limited to this review-pending spec.

## References

- [GOV-515](GOV-515-ring-force-enumeration-definition.md)
- [EPIC-520-1](EPIC-520-1-unified-operator-planning.md)
- `provenance/OBSERVATION_LEDGER.md` (OBS-017, OBS-018, OBS-019)
- `provenance/DECISION_LEDGER.md` (Sprint 4 research-track shape and receipts)
- `canonical/fivefold-incubator/d-shadow-complement-span-v0.json`
- `qa/d-shadow-complement-span-validation.json`
- `MANIFEST.json`

## Closure receipt — 2026-09-12

Banked outcomes executed: uniqueness check `one_target` with `V = {5}` per OBS-020; candidate `canonical/fivefold-incubator/d-shadow-uniqueness-check-v0.json` file SHA-256 `389f98e01e54e7e0f88c7b36fad0b321662904db15c936815a82630461eb4d02` with candidate fingerprint `1aaf77169c7558cb927e2bb3dc8526b8bafb8b275529d989c59db70eb3705f51`; QA receipt `qa/d-shadow-uniqueness-validation.json` file SHA-256 `cf7c7519328192a870bd48506b044ab07fa99bda588b2c00c82d722e7bcc9f8f` with report fingerprint `abc1a72bf127d965e617c3261dbee14d26ee9fd2b665aeea692515e64a5df8c0`. Recorded in `provenance/DECISION_LEDGER.md:1309-1314` (GOV-516 Stage 2 review) and `provenance/DECISION_LEDGER.md:1347-1349` (parallel-capacity grant, banked outcomes); observation side in `provenance/OBSERVATION_LEDGER.md` OBS-020.

Reconciliation note: banking ≠ closure; closure requires the ticket to say so (rule 8 sharpened, retroactive audit 2026-09-12).
