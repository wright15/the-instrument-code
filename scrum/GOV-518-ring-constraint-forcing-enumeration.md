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

**R1 — Assignment space and derived statistic.** Let `X = (x_0,...,x_6) in Z_7^7`, indexed modulo 7, with every primitive `x_i in Z_7`; `mathcal X = Z_7^7` and `N = 7^7 = 823543`. Set `b_i(X) = 1` when `x_{i-1} != x_{i+1}`, otherwise `0`; `S_i(X)` is the largest `ell in {0,...,7}` for which `b_i(X),...,b_{i+ell-1}(X)` are all 1; and `f(X) = (S_0(X),...,S_6(X))`. This is a total K-neighbor projection run-length map `f: mathcal X -> {0,...,7}^7`; the statistic is derived, never assigned. Under `X -> X+c`, every `x_i` changes while f(X) is unchanged, so no primitive is a direct or bijective re-encoding of any statistic coordinate; the primitive domain has seven values and each statistic coordinate has the declared eight-value codomain. This proves `primitive_variable_independence`. Provenance: `provenance/DECISION_LEDGER.md`, "GOV-518 maintainer mathematical registration — 2026-09-07"; EPIC-520-1 addendum.
Acceptance: (a) space finite with stated bound; (b) primitive_variable_independence — no primitive variable coincides with, or is a bijective re-encoding of, a coordinate of the compared statistic; the statistic is derived, never assigned; (c) all coordinate names use registered vocabulary. No primitive domains or predicates are approximated in this shell.

**R2 — Constraint set.** `C_adj(X): for every i in Z_7, x_i != x_{i+1}` (registered office-ring adjacency axiom). `C_step2(X): for every i in Z_7, x_{i-1} != x_{i+1}` (distance-2 K construction-step structure; OBS-008 only owns K exhaustivity). `C_close(X): sum_{i in Z_7} x_i = 0 in Z_7` (7-cycle closure and coordinate consistency). `C(X) = C_adj(X) and C_step2(X) and C_close(X)`. Each predicate is invariant under cyclic shift and reflection. **Selection attestation:** no constraint was selected by effect on the outcome space or by reference to any R7-excluded input; selection uses only the registered adjacency, OBS-008 distance-2 construction-step, and 7-cycle closure sources. OBS-004/005/009 and the D-signature exclusion authority are not K-exhaustivity sources. Provenance: `provenance/DECISION_LEDGER.md`, "GOV-518 maintainer mathematical registration — 2026-09-07".
Acceptance: (a) every constraint carries a provenance line naming the axiom or token it derives from; (b) selection attestation that no constraint was chosen by reference to any R7-excluded input or by its effect on the outcome space (selection-by-effect is circularity); (c) sources are axioms or registrations only — `docs/TOPOLOGY_IDENTITY_AND_INVARIANTS.md:119-149` is exclusion authority for declared D signatures, not a source.

**R3 — Outcome equivalence.** `(sigma X)_i = x_{i-1}` and `(tau X)_i = x_{-i}` generate the registered dihedral action `D_7 = <sigma,tau>`. Define `X ~ X'` exactly when `X' = gX` for some `g in D_7`; enumerate `mathcal X / ~` and filter representatives by C. The predicates and f are equivariant under these ring symmetries. The quotient is fine enough to preserve every non-dihedral coordinate/run structure and therefore cannot artificially force a match by merging unrelated configurations; it is coarse enough to collapse only trivial rotations and reflections and therefore does not weaken the test by recounting one ring configuration in multiple orientations. Frozen: no post-execution retuning. Provenance: `provenance/DECISION_LEDGER.md`, "GOV-518 maintainer mathematical registration — 2026-09-07".
Acceptance: (a) stated as explicit quotient or predicate with structural justification (e.g. registered ring symmetries); (b) recorded granularity rationale acknowledging both failure modes — quotienting too coarse rigs toward forced, quotienting too fine rigs toward weakened — and the chosen position between them; (c) relation references no R7-excluded content. Frozen; no post-execution retuning under any verdict.

**R4 — Deterministic ordering, order-invariant verdict.** With `0 < 1 < ... < 6` as the Z_7 representative order, `X prec X'` iff the first coordinate at which they differ has `x_i < x'_i`. Classes are ordered by their lexicographically least representative, then by its f(X) tuple in the same order. This ordering depends only on the fixed coordinate order, not on canonical observation records or their artifacts. The verdict uses the complete admissible-class set, its count, and every per-class statistic; the order is only for representative selection and reproducible artifact emission. This proves `order_invariance`. Provenance: `provenance/DECISION_LEDGER.md`, "GOV-518 maintainer mathematical registration — 2026-09-07"; EPIC-520-1 addendum.
Acceptance: (a) neutral justification with no reference to observed values; search order is not shaped by the canonical_observation_record; (b) verdict statistic is a function of the whole class set (counts and per-class statistics) with order_invariance — ordering resolves representative selection and artifact reproducibility only. Exactly one class means counted over the whole space, never found-first.

**R5 — Canonical observation record handling.** `P(S) = argmax_i(S_i) = {i in Z_7 : S_i = max_j S_j}` is the only registered shape form: the coordinate(s) attaining the maximal run value. It names no run length, coordinate index, sequence, signature, or 5-35 content. The `canonical_observation_record` is read or recomputed only at the separate verdict-time comparison entry point from fingerprint-verified canonical artifacts, never hardcoded. Provenance: `provenance/DECISION_LEDGER.md`, "GOV-518 maintainer mathematical registration — 2026-09-07"; EPIC-520-1 addendum.
Acceptance: observed values (OBS-018 sequence, OBS-020 maximum-candidate record, GOV-516 receipt content) appear in exactly one pipeline role — the post-enumeration comparison step. Absent from R1–R4 content, from all code input paths, from ordering, and from any pruning, filtering, or symmetry-breaking step.

**R6 — Completion and feasibility obligations.** Symmetry reduction is by the R3 D_7 action. Burnside gives `N_orbit = (7^7 + 6*7 + 7*7^4)/14 = 60028`: identity fixes `7^7`, each nonidentity rotation fixes 7 constant assignments, and each reflection fixes `7^4`; the admissible orbit count is at most this bound. The timeout is 60 seconds. Execution is CPU-only under Node.js v22.22.0 and Python 3.12.3, with no RNG, wall-clock, or locale input. A `completion_certificate` records `N_orbit`, visited orbit representatives equal to `N_orbit`, the admissible-class count, and the environment fingerprint. Provenance: `provenance/DECISION_LEDGER.md`, "GOV-518 maintainer mathematical registration — 2026-09-07"; EPIC-520-1 addendum.
Acceptance: a valid run MUST produce a completion_certificate: declared bound, visited count equal to the bound (or registered orbit count), and environment fingerprint. Exactly one admissible class is reportable only under a valid certificate; otherwise the run is incomplete (see §2).

**R7 — Excluded-input screen (circularity guard).** The enumeration inputs MUST NOT include, in any encoding: any D-series output (observed maxrun sequence, tier summaries, complement spans, V, |V|, or derivatives — differences, argmax lists, re-orderings, dual encodings); any observed bitmask (anchor masks, fifth-position masks, the five court masks, D5 run masks, intersection state sets); any 5-35 or declared-contact signature or office result; the GOV-514 scalar result.
Acceptance: (a) a static dependency check verifies the enumeration program's read and import surface reaches no artifact carrying the above — the comparison step is a separate entry point, verified across the input_reach_boundary; (b) tamper fixtures containing semantic re-encodings of excluded values (complement spans, per-tier differences, mask complements, reversed orderings) placed into the enumeration input path are rejected by that check, including under target_blindness conditions; (c) fixtures live outside the real input path, are themselves fingerprinted, and their presence in a production run invalidates the run.

**R8 — Non-vacuity demonstration (strength guard).** The R7-screened witness is `X_wit = (0,0,0,0,0,0,0)`: a generic Z_7 tuple, not a target edit or encoding of excluded content. It fails `C_adj` and `C_step2`, so C excludes an R1 assignment. Strictness is demonstrated for every constraint: without `C_adj`, `(0,0,1,1,2,2,1)` satisfies `C_step2` and `C_close`; without `C_step2`, `(0,1,0,1,0,1,4)` satisfies `C_adj` and `C_close`; without `C_close`, `(0,1,2,3,4,5,3)` satisfies `C_adj` and `C_step2` but has sum `4 in Z_7`. Each removal strictly enlarges the admissible space. Provenance: `provenance/DECISION_LEDGER.md`, "GOV-518 maintainer mathematical registration — 2026-09-07".

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
| D1 | `X in Z_7^7`, `N = 7^7 = 823543`, total K-neighbor projection f, and translation-invariance `primitive_variable_independence` proof | finite; statistic derived, never assigned | Registered; see `DECISION_LEDGER.md`, "GOV-518 maintainer mathematical registration — 2026-09-07" |
| D2 | `P(S) = argmax_i(S_i)` only | no lengths, coordinates, or signatures named | Registered; see `DECISION_LEDGER.md`, "GOV-518 maintainer mathematical registration — 2026-09-07" |
| D3 | `C_adj`, `C_step2` (OBS-008 only), `C_close`, and target-blind selection attestation | source classes only; no selection-by-effect | Registered; see `DECISION_LEDGER.md`, "GOV-518 maintainer mathematical registration — 2026-09-07" |
| D4 | D_7 quotient with dihedral-only granularity rationale | both failure modes addressed | Registered; see `DECISION_LEDGER.md`, "GOV-518 maintainer mathematical registration — 2026-09-07" |
| D5 | Lexicographic assignment/class order with neutral `order_invariance` statement | neutral; verdict order-invariant | Registered; see `DECISION_LEDGER.md`, "GOV-518 maintainer mathematical registration — 2026-09-07" |
| D6 | `X_wit = (0,0,0,0,0,0,0)` and strictness witnesses for all three constraints | witness passes R7 screen | Registered; see `DECISION_LEDGER.md`, "GOV-518 maintainer mathematical registration — 2026-09-07" |
| D7 | Outcome categories incl. forced_nonmatching ratification; verdict mapping (§2) | all branches mapped; no discretion left | ☑ Ratified 2026-09-07 as written |
| D8 | `N_orbit = 60028` by Burnside, 60-second timeout, Node.js v22.22.0/Python 3.12.3 CPU pin, and `completion_certificate` | completion_certificate achievable | Registered; see `DECISION_LEDGER.md`, "GOV-518 maintainer mathematical registration — 2026-09-07" |
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

This ticket is complete as a queued, non-executing freeze-shell. D1-D8 are registered or ratified; D9/D10 remain recorded. An accepted manifest binding is required for any derivation artifact, QA receipt, result, or hypothesis disposition.

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
