# GOV-515 - Ring-force enumeration definition gate

**Status:** Done · **Priority:** High · **Points:** TBD · **Epic:** [EPIC-520](EPIC-520-unified-operator.md) · **Sprint:** Sprint 4
**Depends on:** [EPIC-520-1](EPIC-520-1-unified-operator-planning.md) · **Blocks:** H2 execution and any EPIC-520 synthesis

**Mapping:** EPIC-520-1 §4 check (iii) ring-force enumeration -> GOV-515. This
is definition-only by the Sprint 4 research-track policy recorded in
`provenance/DECISION_LEDGER.md`; execution requires a separate follow-on ticket.

**Completion receipt:** `provenance/DECISION_LEDGER.md`, "Sprint 4 research
receipts - 2026-09-05". Stage 1 is defined and frozen below; no Stage 2
enumeration, candidate artifact, QA receipt, outcome, or H2 verdict was emitted.

## Story

As a research maintainer, I want the exact input boundary for H2's ring-force
enumeration pre-registered before it is run so the claim that "the frame
forces it" cannot absorb evidence after the fact.

## Scope

### Stage 1 - define and freeze

- Define the run-space inputs that may be admitted to test whether the D5
  target is derivable from the complete D-tier frame: the source-derived tier
  order, the recomputed maxrun sequence, and the unique-max candidate set.
- Define the source inputs, immutable constraints, candidate derivability
  space, permitted output categories, exact result statistic, deterministic
  ordering, and negative controls. Declared D4/D5 contact signatures, office
  assignments, and their outcomes are excluded from the run-space input set.
- State the successor's verdict semantics before execution: `confirmed` only if
  the D5 target is uniquely frame-derivable in the complete run-space candidate
  set; `refuted` if more than one candidate remains or an observed result needs
  an excluded input; `partial` only if a named pre-registered subset is forced
  while another named subset remains open.

### Frozen Stage 1 boundary

The Stage 2 successor receives exactly one mathematical source:
`canonical/fivefold-incubator/d-shadow-complement-span-v0.json` `runSpace`,
after its generator and validator have bound it to the canonical pitch-class
masks. It may derive only the following run-space frame, with coordinates `1`
through `7` assigned to the ordered labels `D1` through `D7`:

| Allowed input | Frozen derivation |
|---|---|
| D-tier frame | The ordered `runSpace.tierSummaries` rows, one for each D1-D7 coordinate. |
| Maxrun sequence | `runSpace.dRunSequence`, recomputed from the anchor fifth-position masks rather than transcribed from prose. |
| Candidate set | `V = {i in 1..7 | r_i = max(r_1,...,r_7)}` over the complete run sequence. |
| D5 target | Coordinate `5`, tested only for membership and uniqueness in `V`; it imports no contact or office condition. |

The artifact's source bindings and QA receipt are required freshness evidence,
not additional inputs. No office-ring token, anchor name, family, raw mask,
construction edge, satellite, declared contact signature, office assignment,
observed D4/D5 result, or result from GOV-514 may enter the input set.
`docs/TOPOLOGY_IDENTITY_AND_INVARIANTS.md:119-149` remains exclusion authority
for declared D signatures, not a derivability source.

The frozen candidate derivability space is the complete set `V`, emitted in
ascending coordinate order. A successor may compute only `max(r_1,...,r_7)`,
membership in `V`, its cardinality, and whether coordinate `5` is its sole
member. It must process the seven source coordinates in ascending order and
emit all members of `V`; it cannot select an observed D4/D5 result as a target
or add a constraint after inspecting the sequence.

The exact result statistic is `|V|` together with the Boolean condition
`V = {5}`. The permitted output categories are `one_target`,
`multiple_targets`, and `incomplete_or_anomalous`. `one_target` maps to
`confirmed` only for this frozen run-space D5-derivability check;
`multiple_targets` maps to `refuted`; `incomplete_or_anomalous` maps to
`partial` only when a named pre-registered subset has completed and another
named subset remains open. An unavailable source, stale receipt, timeout, or
result requiring an excluded input is invalid execution evidence, not a result
category that can confirm H2.

The required stop point is after the successor binds the Stage 1 ticket bytes
from the current package manifest and before it evaluates `V`. Maintainer review
must accept that binding and confirm that the allowed input table, candidate
space, ordering, statistic, categories, and verdict mapping are unchanged. A
result outside this frozen space is anomalous; it cannot revise the input set.

**Non-execution rationale:** the option-2 decision in
`provenance/DECISION_LEDGER.md`, "Sprint 4 research-track shape - 2026-09-05",
keeps GOV-515 definition-only so the run-space frame cannot be adjusted around
an observed result. Stage 1 freezes this boundary; it does not execute it.

### Stage 2 - explicitly not executed here

- Do not run an enumeration, emit a candidate artifact, generate a QA receipt,
  select an outcome, or assign any H2 verdict in this ticket.
- Stage 2 remains strictly forbidden in GOV-515.
- A separately scoped successor may execute Stage 2 only after maintainer review
  accepts the frozen Stage 1 boundary. It must carry the Stage 1 byte/fingerprint
  receipt and cannot revise inputs after observing results.

## Hypothesis dispositions for the Stage 2 successor

| Stage 2 outcome | H1 common construction | H2 ring force | H3 declared D signatures |
|---|---|---|---|
| Confirmed | No disposition; a ring result does not derive A-tier-only D4/D5 conditions. | Supports H2 within the frozen boundary only. | Does not refute H3. |
| Partial | No disposition. | Retain only the named forced subset; no generalization. | No disposition. |
| Refuted | No disposition. | Weakens H2 as frozen; do not enlarge the frame to save it. | Compatible but not confirmation. |

## Acceptance criteria

1. Stage 1 identifies every allowed and excluded input with source references,
   including why declared D signatures cannot enter a run-space derivability
   check.
2. Stage 1 names the full candidate derivability space, deterministic ordering,
   output categories, verdict mapping, and the exact point at which a successor
   must stop for maintainer review.
3. The policy-driven non-execution guard is visible in the header, scope, DoD,
   and references; no Stage 2 result is implied by planning prose.
4. The definition prevents H2 from selecting a post-hoc outcome by prose: a
   result outside the frozen space is anomalous, not a reason to revise H2.
5. No operator, graph, office, tier, admission, runtime, release, or
   `harmonic.C_H` authority is created.

## Negative controls and tamper fixtures for the Stage 2 successor

- Reject an input set expanded with a declared D4/D5 signature, office result,
  observed D4/D5 outcome, or any non-run-space source after Stage 1 is sealed.
- Reject a changed D-tier order, maxrun sequence, candidate-set definition,
  candidate ordering, result category, verdict mapping, Stage 1 fingerprint, or
  rehashed semantic tampering.
- Reject a solver or enumerator that reports only a selected outcome rather than
  the complete admissible outcome set.
- Treat an incomplete search, environment gap, timeout, or unavailable source
  as invalid/partial execution evidence with `skipped` reason, never as H2
  confirmation.

## Verification

- Review Stage 1 against the exists-or-ticketed guard and record it as
  definition-only. No executable suite is due from GOV-515 itself; the QA
  receipt must state this non-execution guard rather than omit the suite.
- The Stage 2 successor must run source-binding, schema, exhaustive-completion,
  determinism/build-twice, reordered-input, negative-control, and tamper suites;
  each appears as `ran` or `skipped` with reason.
- Re-audit any mismatch through the maintainer review channel before a successor
  is opened; do not silently revise the frozen boundary.

## Definition of done

Stage 1 is a complete, reviewable, non-executing enumeration specification. The
Stage 2 non-execution guard remains intact, and any result awaits a separate
maintainer-reviewed successor.

## References

- [EPIC-520-1](EPIC-520-1-unified-operator-planning.md)
- `provenance/OBSERVATION_LEDGER.md:108-119,217-279`
- `docs/TOPOLOGY_IDENTITY_AND_INVARIANTS.md:119-149`
- `provenance/DECISION_LEDGER.md` (Sprint 4 research-track shape)
- `MANIFEST.json` (current generated byte binding for this Stage 1 definition)
- `docs/verification/VERIFICATION_REPORT_GATE_STATUS.md`
