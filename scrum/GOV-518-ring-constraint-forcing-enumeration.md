# GOV-518 - Ring-constraint forcing-enumeration boundary (freeze-shell)

**Status:** Review · **Priority:** High · **Points:** TBD · **Epic:** [EPIC-520](EPIC-520-unified-operator.md) · **Sprint:** Sprint 4
**Depends on:** [GOV-515](GOV-515-ring-force-enumeration-definition.md) Stage 1 definition; [GOV-516](GOV-516-run-space-d5-derivability-enumeration.md) banked receipts with parallel-capacity grant in the GOV-518 ledger acceptance entry · **Blocks:** H2 execution and any EPIC-520 synthesis

**Mapping:** EPIC-520-1 §4 H2 ring-force gate. Successor to the GOV-516 Stage 2 review framing in `provenance/DECISION_LEDGER.md:1309-1314`, which struck H2 dispositions from the uniqueness observation and named a ring-constraint forcing enumeration as the remaining H2 test. This ticket is a freeze-shell only: it registers boundary_declaration_cells, acceptance criteria, and stop-point mechanics. It proposes no primitive domains, predicates, orderings, or enumeration content.

**Completion receipt:** `provenance/DECISION_LEDGER.md`, "GOV-518 registration and freeze — 2026-09-07" (ledger to scrum with citation; receipts are state, ticket status is not). No enumeration, candidate artifact, QA receipt, outcome selection, or H2 verdict is emitted here.

## Story

As a research maintainer, I want the complete GOV-518 ring-constraint forcing-enumeration boundary pre-registered and frozen so the claim that "the constrained ring forces the observed pattern" cannot absorb evidence after the fact and the executor retains zero discretion.

## Scope

### Is

- A demand that the maintainer register, in a single ledger entry, the complete boundary: assignment space, constraint set, outcome equivalence, ordering, canonical_observation_record handling, completion obligations, input_reach_boundary screen, non-vacuity demonstration, outcome categories, verdict-to-H-disposition mapping, and stop-point mechanics.
- A freeze-shell: boundary_declaration_cells R1–R8 below carry slots plus binding acceptance criteria. Every mathematical instantiation is maintainer registration; this shell supplies no instantiation.
- Evidence class: planning_evidence only — frame-level combinatorics. No topology, admission, runtime, or global `harmonic.C_H` authority. Rule 1 applies to all outputs: arithmetic result wins over planning assumptions, including any assumption embedded here.

### Is not

- Not an enumeration design, not an execution authorization, not a hypothesis disposition, not an outcome prediction.
- Stage 2 execution remains forbidden in this ticket until the D1–D10 acceptance entry is complete and the fresh `MANIFEST.json` binding is accepted at the stop point.

## Boundary declaration cells (maintainer MUST register; acceptance binding)

**R1 — Assignment space and derived statistic.** ☐ TBD — maintainer must register a finite primitive-variable list and domains, a total cardinality bound, and a total deterministic derivation map from assignment to the per-coordinate run statistic. `primitive_variable_independence` requires proof that the statistic is derived, never assigned, and no primitive is a bijective re-encoding of a compared coordinate. No basis, domain, bound, map, or proof is registered here. Provenance: `provenance/DECISION_LEDGER.md`, "GOV-518 D1-D6/D8 registration proposal — 2026-09-07"; EPIC-520-1 addendum.
Acceptance: (a) space finite with stated bound; (b) primitive_variable_independence — no primitive variable coincides with, or is a bijective re-encoding of, a coordinate of the compared statistic; the statistic is derived, never assigned; (c) all coordinate names use registered vocabulary. No primitive domains or predicates are approximated in this shell.

**R2 — Constraint set.** ☐ TBD — maintainer must register each constraint as `(name, formal predicate, source)`. Permissible source classes are registered office-ring adjacency axioms; distance-2 construction-step structure with OBS-008 provenance (OBS-004/005/009 are not citable for K exhaustivity); ring-closure and consistency predicates over the 7-cycle; further immutables each with a ledger citation. No constraint row is registered here. Selection attestation must state that no constraint was chosen by reference to R7-excluded input or by effect on the outcome space. Provenance: `provenance/DECISION_LEDGER.md`, "GOV-518 D1-D6/D8 registration proposal — 2026-09-07".
Acceptance: (a) every constraint carries a provenance line naming the axiom or token it derives from; (b) selection attestation that no constraint was chosen by reference to any R7-excluded input or by its effect on the outcome space (selection-by-effect is circularity); (c) sources are axioms or registrations only — `docs/TOPOLOGY_IDENTITY_AND_INVARIANTS.md:119-149` is exclusion authority for declared D signatures, not a source.

**R3 — Outcome equivalence.** ☐ TBD — maintainer must register an explicit quotient or predicate defining one admissible outcome class, structural justification, and frozen granularity rationale addressing both failure modes: too coarse can rig toward forced; too fine can rig toward weakened. No relation or symmetry choice is registered here. Provenance: `provenance/DECISION_LEDGER.md`, "GOV-518 D1-D6/D8 registration proposal — 2026-09-07".
Acceptance: (a) stated as explicit quotient or predicate with structural justification (e.g. registered ring symmetries); (b) recorded granularity rationale acknowledging both failure modes — quotienting too coarse rigs toward forced, quotienting too fine rigs toward weakened — and the chosen position between them; (c) relation references no R7-excluded content. Frozen; no post-execution retuning under any verdict.

**R4 — Deterministic ordering, order-invariant verdict.** ☐ TBD — maintainer must register a total order on assignments and classes plus neutral justification referencing no observed values. `order_invariance` requires the verdict to be a function of the whole class set; ordering is only for representative selection and artifact reproducibility. No order is registered here. Provenance: `provenance/DECISION_LEDGER.md`, "GOV-518 D1-D6/D8 registration proposal — 2026-09-07"; EPIC-520-1 addendum.
Acceptance: (a) neutral justification with no reference to observed values; search order is not shaped by the canonical_observation_record; (b) verdict statistic is a function of the whole class set (counts and per-class statistics) with order_invariance — ordering resolves representative selection and artifact reproducibility only. Exactly one class means counted over the whole space, never found-first.

**R5 — Canonical observation record handling.** ☐ TBD — the only registered shape form is "the coordinate(s) attaining the maximal run value" over the R1-derived statistic. It names no run length, coordinate index, signature, or 5-35 content. The `canonical_observation_record` is read or recomputed only at the separate verdict-time comparison entry point from fingerprint-verified canonical artifacts, never hardcoded. Further content is blocked on the R1 coordinate namespace. Provenance: `provenance/DECISION_LEDGER.md`, "GOV-518 D1-D6/D8 registration proposal — 2026-09-07"; EPIC-520-1 addendum.
Acceptance: observed values (OBS-018 sequence, OBS-020 maximum-candidate record, GOV-516 receipt content) appear in exactly one pipeline role — the post-enumeration comparison step. Absent from R1–R4 content, from all code input paths, from ordering, and from any pruning, filtering, or symmetry-breaking step.

**R6 — Completion and feasibility obligations.** ☐ TBD — the D1 bound must be paired with an orbit-counting argument if symmetry reduction is used, otherwise an explicit no-reduction statement. Maintainer must pin a timeout and deterministic execution environment with no RNG, wall-clock, or locale dependence. No bound, reduction choice, timeout, or environment pin is registered here. Provenance: `provenance/DECISION_LEDGER.md`, "GOV-518 D1-D6/D8 registration proposal — 2026-09-07"; EPIC-520-1 addendum.
Acceptance: a valid run MUST produce a completion_certificate: declared bound, visited count equal to the bound (or registered orbit count), and environment fingerprint. Exactly one admissible class is reportable only under a valid certificate; otherwise the run is incomplete (see §2).

**R7 — Excluded-input screen (circularity guard).** The enumeration inputs MUST NOT include, in any encoding: any D-series output (observed maxrun sequence, tier summaries, complement spans, V, |V|, or derivatives — differences, argmax lists, re-orderings, dual encodings); any observed bitmask (anchor masks, fifth-position masks, the five court masks, D5 run masks, intersection state sets); any 5-35 or declared-contact signature or office result; the GOV-514 scalar result.
Acceptance: (a) a static dependency check verifies the enumeration program's read and import surface reaches no artifact carrying the above — the comparison step is a separate entry point, verified across the input_reach_boundary; (b) tamper fixtures containing semantic re-encodings of excluded values (complement spans, per-tier differences, mask complements, reversed orderings) placed into the enumeration input path are rejected by that check, including under target_blindness conditions; (c) fixtures live outside the real input path, are themselves fingerprinted, and their presence in a production run invalidates the run.

**R8 — Non-vacuity demonstration (strength guard).** ☐ TBD — maintainer must provide an R2-only argument and R7-screened witness excluding at least one R1 assignment; it cannot be a near-miss edit of observed values. For every R2 constraint, the ledger must record either a strictness demonstration or an explicit "strictness not demonstrated" note. No witness or strictness result is registered here; this cell is blocked on R1 and R2. Provenance: `provenance/DECISION_LEDGER.md`, "GOV-518 D1-D6/D8 registration proposal — 2026-09-07".

## Outcome categories and verdict mapping (frozen pre-execution; D7 ratified as written)

| Category | Condition (after valid completion) | Disposition |
|---|---|---|
| forced | exactly 1 outcome class **and** its statistic equals the canonical_observation_record | supports H2 within the frozen boundary only; H1: no disposition; H3: not refuted; sequence-level result — per-signature D4 or D5 readings require separate tickets and must not be treated as covering both |
| forced_nonmatching *(ratified 2026-09-07 — no wording change)* | exactly 1 class and its statistic differs from the canonical_observation_record | refutes H2-as-frozen within the boundary (the observed shape is inadmissible under the registered ring); records a frame–observation inconsistency flag per rule 1, reported as-is; H1/H3: no disposition; no input re-tuning |
| underdetermined | more than 1 outcome class, of any shapes | weakens H2-as-frozen; compatible-with-but-not-confirming H3; all classes reported; no prose selection among them; no frame enlargement |
| incomplete_or_anomalous / invalid | 0 admissible classes; missing or invalid completion_certificate; stale binding; timeout; dependency-check or fixture failure | recorded as incomplete or invalid execution evidence with reason; no H2 disposition; any re-test requires a new boundary registration and new ticket, with the original verdict preserved as state (rule 8) |

**Binding notes.** (i) Exactly one class matching the canonical_observation_record while non-matching classes also exist is **underdetermined**, not forced. "Forced" means total uniqueness. (ii) All four categories close the GOV-518 story per rule 5 semantics; no signal favors a positive outcome. (iii) The report MUST contain the full class list with representative statistics in the registered order — verdict-only reporting is prohibited.

## Stop point and execution protocol

1. Maintainer accepts (or amends by **new ledger entry only** — append-only; rejection recorded with reason). Silence authorizes nothing.
2. The GOV-518 ticket bytes are bound from the current `MANIFEST.json`; the binding fingerprint enters the ledger via the manifest receipt; the maintainer accepts the unchanged boundary (GOV-515 Stage 1 and GOV-516 stop-point mechanics).
3. Execution requires: frozen binding valid; parallel capacity granted in the GOV-518 ledger acceptance entry (GOV-516 remains Review; no administrative flip is awaited), mirroring the GOV-517 queue discipline which this ticket does not alter.
4. At execution start: binding check (mismatch → invalid, no disposition); dependency check and fixture suite including target_blindness; enumeration; completion_certificate; comparison step reading fingerprint-verified canonical artifacts; receipt per the §2 reporting template, hashed into CHECKSUMS and MANIFEST per the sprint fixed-point discipline (rule 9).
5. Failed or invalid runs are recorded, not retried-with-changes. Re-running is permitted only under the unchanged binding.

## Standing guard rails carried forward

Registered-vocabulary-only (rule 11, validated on frozen text against the EPIC-520-1 addendum anchors); ledger to scrum sync with citation, never reverse (rule 8); receipts are state, ticket status is not; no model prose as mathematical source (rule 6); no informal likelihood talk anywhere in artifacts this shell generates; no bare "28 rows" (qualify `CONSTRUCTS` edges versus selected D4/D5 `SEAT_CONTACT` chain-audit rows); H2 enumeration remains the non-bypassable DoD gate for any successor; GOV-517 queue discipline untouched.

## Maintainer decision table

| Slot | What the maintainer registers | Acceptance | Status |
|---|---|---|---|
| D1 | Finite primitive-variable list and domains, bound, total derivation map, and `primitive_variable_independence` proof; no content registered by the skeleton | finite; statistic derived, never assigned | ☐ TBD — maintainer; see 2026-09-07 ledger proposal |
| D2 | R1-derived statistic plus positional shape form only: "the coordinate(s) attaining the maximal run value"; no further content before D1 | no lengths, coordinates, or signatures named | ☐ TBD — maintainer; see 2026-09-07 ledger proposal |
| D3 | `(name, formal predicate, source)` rows plus selection attestation; no rows registered by the skeleton | source classes only; no selection-by-effect | ☐ TBD — maintainer; see 2026-09-07 ledger proposal |
| D4 | Explicit quotient or predicate, structural justification, both-sided granularity rationale; no relation registered by the skeleton | both failure modes addressed | ☐ TBD — maintainer; see 2026-09-07 ledger proposal |
| D5 | Total order with neutral justification and `order_invariance`; no order registered by the skeleton | neutral; verdict order-invariant | ☐ TBD — maintainer; see 2026-09-07 ledger proposal |
| D6 | R2-only non-vacuity witness and per-constraint strictness notes; no witness registered by the skeleton | witness passes R7 screen | ☐ TBD — maintainer; see 2026-09-07 ledger proposal |
| D7 | Outcome categories incl. forced_nonmatching ratification; verdict mapping (§2) | all branches mapped; no discretion left | ☑ Ratified 2026-09-07 as written |
| D8 | Bound, orbit argument or no-reduction statement, timeout, deterministic environment pin, and `completion_certificate`; no values registered by the skeleton | completion_certificate achievable | ☐ TBD — maintainer; see 2026-09-07 ledger proposal |
| D9 | Lineage and queue: relation to GOV-515 binding and DECISION_LEDGER.md:1309-1314; GOV-516 parallel-capacity grant (§3) | recorded in acceptance entry | ☑ Granted in ledger acceptance entry 2026-09-07 |
| D10 | Vocabulary disposition for scaffolding terms | re-expressed or ticketed via EPIC-520-1 addendum | ☑ Disposition recorded 2026-09-07 (see below) |

Any empty cell at review time means the shell is not ready to execute. TBD cells block execution, not freezing of the shell.

## Executor discretion inventory (all resolve to frozen)

Which files the program may read (R7, verified across the input_reach_boundary) · when it stops (R6/D8) · how ties and ordering are handled (R3/R4 under order_invariance) · what the receipt contains (§2 template) · what happens on binding mismatch (§3 step 4) · whether a failed run may be retried with changes (§3 step 5 — no) · whether any post-execution input change is possible (R3/§2 — no; new boundary only).

## Vocabulary disposition (Rule 11)

Superseded scaffolding wordings are re-expressed in frozen wording: canonical record wording for the observation side, reach wording for the input-surface side, declaration-cell wording for the slot side. New structural invariants `completion_certificate`, `target_blindness`, `primitive_variable_independence`, `order_invariance`, and `forced_nonmatching` are defined in the consolidated EPIC-520-1 addendum table and cited here by anchor. Frozen text uses frozen wording only.

## Verification

- Review this shell against the exists-or-ticketed guard and record it as definition-only. No executable suite is due from the shell itself; any QA receipt states this non-execution guard rather than omitting the suite.
- The execution successor must run source-binding, schema, exhaustive-completion, determinism and build-twice, reordered-input, negative-control, target_blindness, and adversarial-tamper suites; each appears as `ran` or `skipped` with reason.
- Re-audit any mismatch through the maintainer review channel before execution; do not silently revise the frozen boundary.

## Definition of done

This ticket is complete as a queued, non-executing freeze-shell. D7/D9/D10 are decided; D1–D6/D8 are explicit maintainer TBD blockers. A maintainer-filled successor boundary plus accepted manifest binding is required for any derivation artifact, QA receipt, result, or hypothesis disposition.

## References

- [EPIC-520-1](EPIC-520-1-unified-operator-planning.md) (hypotheses H1/H2/H3; addendum anchors for the five structural invariants)
- [GOV-515](GOV-515-ring-force-enumeration-definition.md) (Stage 1 template; stop-point mechanics)
- [GOV-516](GOV-516-run-space-d5-derivability-enumeration.md) (banked receipts; Review state with parallel-capacity grant)
- [GOV-517](GOV-517-d5-signature-derivation-definition.md) (queue discipline, untouched)
- `provenance/DECISION_LEDGER.md:64-92` (Sprint-4 boundary policy)
- `provenance/DECISION_LEDGER.md:1309-1314` (GOV-516 review entry; GOV-518 named as successor H2 forcing test)
- `provenance/OBSERVATION_LEDGER.md` (OBS-008 K exhaustivity owner; OBS-014, OBS-018, OBS-019, OBS-020 observation side)
- `docs/TOPOLOGY_IDENTITY_AND_INVARIANTS.md:119-149` (exclusion authority for declared D signatures)
- `MANIFEST.json` (current generated byte binding for this shell)
- `docs/verification/VERIFICATION_REPORT_GATE_STATUS.md`
