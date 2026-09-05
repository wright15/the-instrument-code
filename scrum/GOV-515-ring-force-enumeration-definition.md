# GOV-515 - Ring-force enumeration definition gate

**Status:** Backlog · **Priority:** High · **Points:** TBD · **Epic:** [EPIC-520](EPIC-520-unified-operator.md) · **Sprint:** Sprint 4
**Depends on:** [EPIC-520-1](EPIC-520-1-unified-operator-planning.md) · **Blocks:** H2 execution and any EPIC-520 synthesis

**Mapping:** EPIC-520-1 §4 check (iii) ring-force enumeration -> GOV-515. This
is definition-only by the Sprint 4 research-track policy recorded in
`provenance/DECISION_LEDGER.md`; execution requires a separate follow-on ticket.

## Story

As a research maintainer, I want the exact input boundary for H2's ring-force
enumeration pre-registered before it is run so the claim that "the frame
forces it" cannot absorb evidence after the fact.

## Scope

### Stage 1 - define and freeze

- Enumerate the ring-alone structures that may be admitted as H2 inputs:
  office-ring adjacency, midpoint, distance-2 neighborhoods, and the `+2`
  permutation over the seven-office ring.
- Define the source inputs, immutable constraints, candidate construction
  space, permitted output categories, exact result statistic, deterministic
  ordering, and negative controls. Declared D4/D5 contact signatures, office
  assignments, and their outcomes are excluded from the ring-alone input set.
- State the successor's verdict semantics before execution: `confirmed` only if
  one admissible D4/D5 outcome class is forced; `refuted` if more than one
  admissible class remains or an observed result needs an excluded input;
  `partial` only if a named pre-registered subset is forced while another named
  subset remains open.

### Stage 2 - explicitly not executed here

- Do not run an enumeration, emit a candidate artifact, generate a QA receipt,
  select an outcome, or assign any H2 verdict in this ticket.
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
   including why declared D signatures cannot enter a ring-alone enumeration.
2. Stage 1 names the full candidate construction space, deterministic ordering,
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
  observed D4/D5 outcome, or any non-ring source after Stage 1 is sealed.
- Reject removed midpoint, adjacency, distance-2, or `+2` constraints; changed
  candidate ordering; changed result category; changed verdict mapping; altered
  Stage 1 fingerprint; and rehashed semantic tampering.
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
- `docs/verification/VERIFICATION_REPORT_GATE_STATUS.md`
