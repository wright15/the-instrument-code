# Sprint 4 EPIC-520 Research Handoff

**Status:** Reviewed; standing rules durably recorded in
`provenance/DECISION_LEDGER.md` "Standing rules recorded - 2026-09-05". This is
a review handoff, not an execution receipt or a research conclusion. **Release:**
`1.9.0-dev`
**Policy receipt:** `provenance/DECISION_LEDGER.md`, "Sprint 4 research-track
shape - 2026-09-05". **Execution plan:** `scrum/plan/sprint-4-intake.md`.

## Orientation

EPIC-520 remains **Backlog**. It was opened by Research Gate 3 as a research
question, not a claim that a unified operator exists, has a form, or is unique.
EPIC-520-1 is **Done** because it completed the bounded planning work. GOV-513,
GOV-514, and GOV-515 are **Backlog**; no EPIC-520 hypothesis check has run.

Read in this order:

1. `provenance/DECISION_LEDGER.md:65-88` for Gate 3 authority and its limits.
2. `provenance/DECISION_LEDGER.md:29-57` for received Sprint 4 policy.
3. `scrum/EPIC-520-1-unified-operator-planning.md` for symmetric hypotheses,
   language guards, and negative controls.
4. `scrum/GOV-513-d-shadow-complement-span-audit.md`,
   `scrum/GOV-514-d-tier-compression-interleaving-check.md`, and
   `scrum/GOV-515-ring-force-enumeration-definition.md` for executable scope.
5. `docs/verification/VERIFICATION_REPORT_GATE_STATUS.md` before closing any
   ticket.

## Receipts Are State

Gate-time inputs are historical decision evidence, not live artifact values:

| Receipt | Gate-time candidate | Current checked-in candidate | Current result |
|---|---|---|---|
| Twin-hub convergence | `38dc4131...` | `d7405100...` | PASS 30/0 |
| Fifth-space census | `570679df...` | `6878c7fd...` | PASS 24/0 |

The gate-time values are fixed in `provenance/DECISION_LEDGER.md:73-78`. Current
values are in `qa/twin-hub-convergence-validation.json` and
`qa/fifth-space-census-validation.json`. Never collapse historical and current
fingerprints. Existing GOV-227 evidence is PASS 17/0; its D1-D7 scalar scope
does not establish global `harmonic.C_H`.

The checked-in integrated release receipt is PASS 418/0. Treat it as a checked
in receipt until a new fixed-point run is explicitly recorded; arithmetic output
wins over plans or expected totals.

## Received Assignment

The policy is received, not argued during execution:

| EPIC-520-1 section 4 check | Ticket | Action |
|---|---|---|
| (i) D-shadow | GOV-513 | Execute |
| (ii) GOV-227 interleaving | GOV-514 | Execute |
| (iii) Ring-force enumeration | GOV-515 | Define Stage 1 only; do not execute |
| (iv) One D4-or-D5 signature derivation | Unopened successor | Deferred |

GOV-515 must not enumerate, emit a candidate, generate a result receipt, or
assign H2. Stage 2 requires a separately scoped, maintainer-reviewed successor
carrying the frozen Stage 1 fingerprint. This boundary prevents H2's frame from
absorbing observed evidence after the fact.

## Hypotheses And Ticket Boundaries

| Hypothesis | Bounded question | Ticket disposition |
|---|---|---|
| H1 | Can an authorized common construction account for A-tier K and D4/D5 contacts without a new declared signature? | GOV-513 can only test one D-shadow route; even confirmation is not an operator result. GOV-514 can only bound scalar evidence. |
| H2 | Does ring-alone geometry force one admissible D4/D5 outcome class? | GOV-515 freezes inputs and result semantics only. More than one class weakens H2 as frozen; do not enlarge the frame. |
| H3 | Are D4/D5 irreducibly declared second-order contact signatures? | No Sprint 4 ticket may claim H3 confirmation or refutation from an isolated result. |

Do not call D signatures protocol-versioned. Their source status is declared
signature plus explicit new-protocol-tier admission. `K` exhaustivity belongs to
OBS-008. The rational LP witness is not a Z12 value. Qualify both distinct
"28" counts by their nouns.

## Verification And Re-audit

- Every ticket-named suite must appear exactly once in its completion receipt as
  `ran` or `skipped`; every skipped suite requires a non-empty reason.
- GOV-513 needs source binding, schema, scope, arithmetic, build-twice,
  reordered-input, negative-control, and adversarial-tamper evidence. No
  Neo4j, browser, or external service is expected; an unexpected dependency is
  a fail-closed environment gap.
- GOV-514 must run `npm run validate:gov227 --silent` and separately record
  fresh-source, validator, and focused-test outcomes. No remote, browser, or
  Neo4j dependency is expected.
- GOV-515 has no executable Stage 1 suite. Its receipt must state the
  definition-only non-execution guard rather than silently omitting it.
- A source/spec/output mismatch fails the phase. Route it through maintainer
  review before adoption; no worker interpretation or post-hoc normalization is
  permitted.

Known environment history is not proof of a current gap: Sprint 3 skipped
`test:neo4j:full` because `NEO4J_URI` was unset, and skipped
`orrery:browser:test` after a fresh-session modal timeout under eight concurrent
`software-GL` sessions. Re-test or record an explicit current skip reason when
those suites are named.

## Standing Rules

Canonical list received through the maintainer relay review channel, 2026-09.
Durable home: `provenance/DECISION_LEDGER.md` "Standing rules recorded -
2026-09-05"; this handoff cites it and is not the source of authority.

1. Arithmetic output wins over planning assumptions; artifacts outrank hand
   tables, which outrank prose. Every derived cardinality records its source
   path.
2. Report tables are derived from `git diff`, never composed.
3. Out-of-directive changes go to a recommendations list, not applied, even when
   correct.
4. Fix the class, not the count: incidents get generalized guards, not patches.
5. Verdict closes story: `confirmed`, `refuted`, and `partial` all close research
   stories; no signal forces a positive outcome.
6. No model prose is a mathematical or admission source; planning documents are
   evidence of intent, not state.
7. Fingerprint literals in prose are stale until proven live by build-time
   derivation; carried fingerprints are hypotheses. GOV-510/511 receipts now
   have three generations, which must never be collapsed.
8. Ticket status is not state; receipts are state; sync direction is ledger to
   scrum with citation.
9. Sprint exit is a fixed point:
   `package:manifest -> --check -> validate`, with a full pass that makes no
   tracked change.
10. Verification receipts enumerate each suite as `ran` or `skipped` plus a
    reason; "passed" never silently means "all that could run."
11. EPIC-520-family specs use registered vocabulary only; unregistered terms
    fail the language guard (`exists-or-ticketed`, prose-consistency pattern).

## Correction History

These five incidents motivate evidence discipline; do not describe the list as a
complete incident register. Items 1-2 are thread-sourced with no repo receipt;
items 3-5 are the repo-receipted subset:

1. **Z-twin engine-flip (thread-sourced; no repo receipt).** A generated
   field-analysis presented four correct structural findings alongside one
   invented mechanism: a "Z-Twin Space (Engine Flip)" claimed to "swap internal
   geometry while preserving interval vectors, allowing state momentum to invert
   from fifth-expansion to chromatic contraction without logical disruption."
   The mechanism conflated two real, distinct structures — T₁-twin pairs (same
   Forte family, root-phase-related; later receipted as the seam mechanism) and
   Forte Z-pairs (same interval vector, different set class; recorded only as
   GOV-227 comparison evidence, where they support the no-linear-separator
   result, the opposite of a mechanism). Neither is an operator; "state
   momentum" is not a quantity the field defines. Intercepted at review before
   entering any artifact. Failure mode: real vocabulary recombined into a
   mechanism indistinguishable from findings at prose resolution. Live risk:
   prose about hypotheses recombining registered terms into new mechanism claims.
2. **Refresher-prompt status corruption (thread-sourced; no repo receipt).** A
   drafted context-pinning directive restated project results with two status
   corruptions: it presented OBS-014 — then a queued, untested hypothesis — as
   demonstrated mechanics ("D5 routes SEAT_CONTACT edges directly onto {Mars,
   Jupiter}… demonstrating how the D-series closes A-series structural seams"),
   and it replaced the real OBS-015 candidate (spectral-order observation,
   conditional, authored-binding-dependent) with an invented dynamical mechanism
   ("1-bit Hamming shift creating a phase shear/torque vector driving decay from
   A2→A1"), mislabeling the 7-33↔5-34 complement-conjugation as that shear. The
   draft arrived wearing directive authority and would have pre-judged GOV-510's
   verdict before the audit ran. Intercepted at review. Failure mode:
   status-flattening — verified theorems, conditional observations, and untested
   hypotheses compressed into one undifferentiated list of "invariants." Live
   risk: flattened status consumed as state by a fresh executor writing audit
   prose.
3. Review intercepted an EPIC-520 `99.36%` scalar-mass claim before it entered
   project records (`docs/verification/SPRINT_3_RETROSPECTIVE.md:19-21`, a
   non-canonical process record).
4. The Mercury mask-681 claim of a single `{10}` hole was corrected to `{10,2}`
   (`provenance/OBSERVATION_LEDGER.md:162-182`).
5. A C2/L7 graph fixture and invented ledger pointers were corrected; the graph
   result is `right_undefined`, not `does_not_commute`
   (`provenance/DECISION_LEDGER.md:724-737`).

## Out Of Scope

No implementation, unified operator, graph edge, office assignment, tier
classifier, admission, runtime behavior, Neo4j projection, release pin, global
`harmonic.C_H`, or cross-ticket synthesis is authorized. A D4-only or D5-only
result cannot be generalized across both signatures. A shuffled pairing,
scalar-only gap, selected enumeration outcome, or missing D-shadow queue item
is not substitute evidence.

## Review And Close Protocol

1. User reviewer checks this draft against the ledger and all ticket receipts,
   especially the policy boundary, fingerprints, guard inventory, and correction
   history.
2. The drafting agent incorporates approved deltas in this file and the relevant
   source records, then re-runs the fixed point.
3. Any source/spec/output conflict goes to the maintainer re-audit channel before
   adoption. Do not use a review comment to silently revise an observed result.
4. Ticket closure records the actual suites, source bindings, verdict semantics,
   and limited H1/H2/H3 disposition. Only then may the board status change.

## Durable Record

- Standing rules are durably recorded in `provenance/DECISION_LEDGER.md`
  "Standing rules recorded - 2026-09-05"; retain their review-channel provenance.
- The five documented incidents above (two provenance classes) are the minimum
  fabrication-history examples for this handoff, not a claim of a complete
  incident register.
