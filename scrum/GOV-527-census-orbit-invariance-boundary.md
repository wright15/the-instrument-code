# GOV-527 - Census-orbit invariance boundary (freeze-shell)

**Status:** Review · **Priority:** High · **Points:** TBD · **Track:** Track 2 (aggregate program; per the gate entry's "the Track 2 successor ticket may now open") · **Sprint:** unassigned

**Depends on:** the gate entry — `provenance/DECISION_LEDGER.md`, "Track 2 gate answer — aggregate design question registered — 2026-10-15" (line 3925) — and the premise set it registers · **Blocks:** the Track 2 execution successor and any aggregate synthesis

**Mapping:** The gate entry registered the governed open question over the 462-record fifth-space census and its recorded falsification shape, two prongs, both machine-checkable — prong (a) orbit-constancy; prong (b) inheritance consistency — cited here, not restated. This ticket is a freeze-shell only: it registers boundary_declaration_cells (R1–R8), acceptance criteria, and stop-point mechanics. It proposes no aggregate formula, no orbit/fiber enumeration, no witness, no verdict, and no execution authority.

**Completion receipt:** `provenance/DECISION_LEDGER.md`, "GOV-527 registration and freeze" (ledger to scrum with citation; receipts are state, ticket status is not). No aggregate computation, candidate artifact, QA receipt, or invariance disposition is emitted here.

## Pinned artifacts and environment (derived at the drafting sitting's open; three-way re-verification at acceptance)

| Pin | Path | Bytes | Raw-byte SHA-256 | Recorded fingerprint |
|---|---|---|---|---|
| Census | `canonical/fivefold-incubator/fifth-space-census-v0.json` | 194194 | `2f862c89…42b68` | `446e0cfa…c55149b` |
| BL-089 artifact | `orrery/src/generated/bl089-anchoring-remainder-interaction.v1.json` | 50336 | `26a4b196…70715` | `eb1526be…27e2fb0` |
| Census validation receipt | `qa/fifth-space-census-validation.json` | 16323 | `b3b5bede…080bba6e` | — |
| GOV-518 boundary ticket (B₃) | `scrum/GOV-518-ring-constraint-forcing-enumeration.md` | 23642 | `bee5f2a1…cba382` | — |
| Typology doc (DOC_HASH) | `docs/THREE_PART_CONTINUOUS_TYPOLOGY.md` | 6664 | `11a7f70f…68d6c` | — |
| Decision ledger (L⁷) | `provenance/DECISION_LEDGER.md` | 257286 | `f84f31e7…62fe` | — |
| GOV-520 production receipt | `qa/gov-520-production-receipt.json` | 8740 | `47535583…2434b` | — |
| MANIFEST.json (as-of-open) | `MANIFEST.json` | 257937 | `bc520adc…b2b7c682` | file count 1389 |

- **As-of commit at open:** `192e2739` (non-shallow clone; worktree clean; `origin/main` equal).
- **Interpreter pin (pre-flight rule):** Node.js v22.22.0; repo `.venv` Python 3.12.3. The interpreter is pinned at pre-flight because an unpinned sitting is a recorded failure class.
- **GOV-number census at open (the R17 discipline, applied prospectively):** `scrum/` holds GOV-201…213, GOV-227…228, GOV-501…520 (GOV-517 twice: definition and implementation-spec draft); the ledger consumes GOV-521/GOV-522/GOV-523/GOV-524/GOV-525/GOV-526 (ENTRY 12/13/14/16/17/20). GOV-527 confirmed free.
- These pins were derived in this sitting from the tree, never copied from prior prose. The acceptance entry re-verifies each three-way (computed ↔ `MANIFEST.json` ↔ acceptance entry) before binding, and binds this ticket's own bytes from `MANIFEST.json`.

## Story

As a research maintainer, I want the Track 2 census-orbit invariance boundary pre-registered and frozen so that the registered question — whether the pcSum-derived aggregate is invariant on the orbit/fiber organization recorded across the pinned census and BL-089 artifacts — cannot absorb evidence after the fact, and the executor retains zero discretion.

## Scope

### Is

- A demand that the maintainer register, in a single ledger entry, the complete boundary: census space and aggregate domain, the two-stage predictor citation, the orbit/fiber enumeration procedure (with its registration-sitting reproduction), ordering and order-invariance, the census verification gate, two-level non-vacuity witnesses, the excluded-input screen, completion and single-pass obligations, the outcome categories with the prong-differentiated mapping, and stop-point mechanics.
- A freeze-shell: boundary_declaration_cells R1–R8 carry slots plus binding acceptance criteria. Every mathematical instantiation is maintainer registration; this shell supplies no instantiation.
- Evidence class: planning_evidence only — frame-level. Rule 1 applies to all outputs: arithmetic result wins over planning assumptions, including any assumption embedded here.

### Is not

- Not an aggregate design, not an orbit/fiber enumeration, not an execution authorization, not a disposition of the registered question, not an outcome prediction.
- Not a resolution of any open item recorded elsewhere (e.g. BL-094; the mid-block ledger line-order finding; GOV-516/GOV-517 status items); this shell is Track 2 boundary mechanics only.
- Execution remains forbidden until the D1–D10 acceptance entry is complete and the fresh `MANIFEST.json` binding is accepted at the stop point. This shell grants no execution authority by existing.

## Boundary declaration cells (maintainer MUST register; acceptance binding)

**R1 — Census space and aggregate domain.** Let `C` be the 462-record fifth-space census (pinned above): records ordered by `stateId` ascending, unique; each record carries its mask content (`pitchMask`, `fifthMask`, `fifthPositions`) and its role/tier partition fields; the role reconciliation 70 anchors / 238 satellites / 154 boundaries is machine-checked. The pcSum-derived aggregate is computed over the census from the mask content via the two-stage predictor; it is derived, never assigned. Boundary-role handling — the withheld records' treatment in the aggregate's domain — is registered at D1. Provenance: the gate entry; the census artifact and its validation receipt (cited).
Acceptance: (a) the space is finite with the stated count (462) and the role reconciliation machine-checked; (b) the aggregate is derived from mask content, never assigned; no census field coincides with, or is a bijective re-encoding of, an aggregate coordinate; (c) all coordinate names use registered vocabulary; no census record is approximated, sampled, or silently dropped.

**R2 — Two-stage predictor (cited-not-restated).** The registered predictor is the two-stage predictor recorded in the BL-089 artifact (pinned above): stage 1, the anchor rule `office(anchor) = (C − pcSum(mask)) mod 7` with `C = 4` the κ orientation constant; stage 2, the satellite rule `office(satellite) = office(governing anchor)`. The artifact's recorded calibration — anchor rule 70/70, satellite rule 238/238, attachment delta histogram, midpoint extension 7/7 — is expectation content read from the record, not authority restated here. The predictor's input class and its office-path fence (the prediction path reads zero office bytes; the office field enters only as the comparison target) are cited from the artifact's recorded accounting.
Acceptance: (a) the predictor is read from the pinned artifact; no stage, constant, or rule is restated, retuned, or extended; (b) the aggregate computation path reads zero office bytes — the office field enters only at the separate comparison entry point, verified across the input_reach_boundary; (c) the recorded calibration figures appear only as live-recomputed checks, never as asserted results.

**R3 — Orbit/fiber handling (cite-by-path; frozen reproducible procedure).** The orbit/fiber organization is the census-native structure recorded across the pinned census and BL-089 artifacts — cited-not-restated. This boundary declares no new group action, and any pitch-class-level symmetry claim is a successor registration if wanted (per the gate entry). The recorded structures this boundary points at include: the satellite attachment structure (`officeField.satelliteRule`; delta histogram per acceptance (c)); the block structure (`opAR1.blocks`, 57 blocks / 1128 instances recorded); and the orbit content (`officeField.orbitStepLaw`: the +2 governor-successor step along the ten landed orbit orders, per-tier length 7, recorded exact on both the landed and the predicted field). The boundary freezes the enumeration procedure: the decomposition is derived deterministically from (i) the census masks and (ii) the two-stage predictor structure in the BL-089 artifact, by the procedure stated in the ledger acceptance entry; the procedure's complete read set is recorded there — no silent third inputs. Stop conditions: any orbit/fiber whose membership cannot be derived from the pinned artifacts alone is anomalous, stop-and-capture; if the procedure cannot be stated without declaring a new group action, the sitting stops and maintainer registration is required — a drafter's or executor's inference may not supply it.
Acceptance: (a) the procedure is stated such that a third party could reproduce the decomposition from the pinned artifacts alone; (b) the reproduction is demonstrated once at the registration sitting: decomposition output = the predictor's own block structure (57 blocks), agreeing with the pinned artifact; (c) the delta histogram {−1:102, +1:102, −6:17, +6:17} reproduces from the pinned artifacts; (d) no group action is declared; orbit/fiber content is cited only — no orbit roster, order, or membership is transcribed into this ticket; (e) the stop conditions are fail-closed: an underivable membership halts the run rather than being repaired by inference.

**R4 — Deterministic ordering; order-invariant verdict.** The census's registered ordering (`stateId` ascending) is the consumption order; the procedure consumes the full verified record set. The reported per-orbit aggregate values, the per-record inheritance flags, and the verdict are functions of the complete verified set — order-invariance; the ordering resolves representative emission and receipt reproducibility only. No pruning, filtering, or symmetry-breaking step may consult the ordering or any observed value.
Acceptance: (a) neutral justification with no reference to observed values; (b) the verdict is a function of the whole set (every verified record, every declared orbit/fiber) with order-invariance stated; (c) the reporting order is fixed and a replay reproduces the receipt under it.

**R5 — Census verification gate (first; per-mask; fail-closed).** The first execution step is the census verification gate: a per-mask machine check of the pinned census against its recorded derivation, before any aggregate computation exists to select from. The gate re-executes the census's registered check list — the census validation receipt (24/0 PASS, cited) — against the pinned bytes: schema, fingerprint, freshness, cardinality-462, ordering-unique, role-reconciliation, binary-field-equivalence, and the span/gap/binding checks. Any red = gate failure = the frozen invalid category; no aggregate output exists; no retry-with-changes.
Acceptance: (a) gate ordering is structural — no aggregate output path exists until the gate is green; (b) the gate covers every record the per-mask checks are over — no sampling; (c) gate failure semantics are fail-closed, with the failure reason recorded.

**R6 — Non-vacuity demonstration (two-level; binding on this boundary).** Per the two-level extension registered in "GOV-518 degeneracy ruling and boundary amendment — 2026-09-07" (cited, not restated): (1) constraint-level — the verification gate has reject power: a tamper witness (a record set violating the census's recorded derivation or the inheritance rule) is rejected by the gate; (2) statistic-level — the aggregate is non-constant on the verified set: two verified records carrying different aggregate values demonstrate that orbit-constancy is a substantive claim, not a constant-everywhere degeneracy; additionally, the inconstancy branch is reachable — a witness pair in the same declared orbit with differing aggregate values, constructed outside the real input path, is flagged by the machinery. Witnesses are registered at acceptance (D6) and pass the excluded-input screen.
Acceptance: (a) both levels are demonstrated with registered witnesses at acceptance, not assumed; (b) witnesses are fixtures — they never enter the real input path, are fingerprinted, and invalidate any production run they appear in; (c) if the aggregate proves constant across all declared orbits, the mapping yields the underpowered category — never an invariance claim.

**R7 — Excluded-input screen (circularity guard).** The aggregate computation MUST NOT include, in any encoding: the office field (index or relational) — it enters only as the comparison target at the separate comparison entry point (the BL-089 office-path fence, cited); any cross-census reconciliation content (the Track 1 count-reconciliation fence stands unamended — this boundary attempts no cross-census reconciliation); any orbit/fiber content not derivable from the pinned artifacts; any observed-verdict or successor-prose content; any post-hoc orbit adjustment. The orbit/fiber decomposition is frozen before aggregate computation: no orbit merging, splitting, or relabeling after values are seen.
Acceptance: (a) a static dependency check verifies the aggregate program's read and import surface reaches no excluded artifact — the comparison step is a separate entry point, verified across the input_reach_boundary; (b) tamper fixtures containing semantic re-encodings of excluded content (office-valued masks, reconciliation counts, adjusted orbit rosters) placed into the input path are rejected by that check; (c) fixtures live outside the real input path, are themselves fingerprinted, and their presence in a production run invalidates the run.

**R8 — Completion and single-pass obligations.** One production pass under the frozen binding (the standing single-pass discipline; the GOV-520 pattern cited). A `completion_certificate` records: the verified record count (462), the role reconciliation (70/238/154), the inheritance recomputation (238 live checks), the declared orbit/fiber count as derived by the frozen procedure, the count of distinct aggregate values at the orbit level, and the environment fingerprint (the D8 interpreter pin). The aggregate result artifact, the comparison artifact (separate entry point), and the receipt complete the artifact set. The recorded fallback branch remains dormant: the option-2 discriminant is not specified here; activation, if taken, is recorded in the spec receipt with the underpowered finding, and any activation requires a successor ledger entry — never a spec-level note (per the gate entry).
Acceptance: (a) the certificate is mandatory for any reported category other than incomplete/invalid; (b) a declared-vs-computed mismatch at any certificate field is anomalous per rule 1; (c) no retry-with-changes exists; re-runs are permitted only under the unchanged binding.

## Outcome categories and verdict mapping (frozen pre-execution)

| Category | Condition (after valid completion) | Disposition |
|---|---|---|
| orbit_invariant | each declared orbit/fiber carries exactly one aggregate value; at least two distinct values across the declared set; inheritance recomputed live 238/238; gate green | answers the registered question affirmatively within the frozen boundary only; the aggregate program's next successor may draw on this result within this boundary; no further disposition; no claim beyond the boundary |
| orbit_inconstancy_finding | valid completion; at least one declared orbit/fiber carries two or more distinct aggregate values | answers the registered question negatively; reported as-is with the affected orbits/fibers, values, and records; domain content, not execution failure; no frame adjustment; a re-test requires a new boundary registration and a new ticket, with this result preserved as state (rule 8) |
| inheritance_inconsistency | valid completion; at least one satellite's recomputed office differs from its governing anchor's office (records named) | the falsification's discriminating prong fired; reported as-is with the named records; the inheritance premise's disposition is maintainer scope; no aggregate-wide verdict beyond the named records; no retry-with-changes |
| underpowered | valid completion; the invariance census lacks discriminating power — fewer than two distinct aggregate values across the declared set, or a degenerate declared set | records the underpowered finding; the registered fallback branch (the option-2 discriminant) may be activated only by successor ledger entry, recorded with this finding (per the gate entry) |
| incomplete_or_anomalous / invalid | 0 records verified; missing or invalid completion_certificate; stale binding; timeout; verification-gate failure; excluded-input breach | recorded as incomplete or invalid with reason; no answer disposition; any re-test requires a new boundary registration and a new ticket, with the original preserved as state (rule 8) |

**Binding notes.** (i) Category precedence is mechanical: incomplete_or_anomalous/invalid > inheritance_inconsistency > orbit_inconstancy_finding > underpowered > orbit_invariant; a report may carry subordinate findings, but exactly one category is primary. (ii) All categories close the story per rule 5 semantics; no category is preferred and no signal favors a positive outcome. (iii) The report MUST contain the full declared orbit/fiber list with per-orbit aggregate values and the per-record inheritance flags in the registered order — verdict-only reporting is prohibited. (iv) orbit_inconstancy_finding and inheritance_inconsistency complete validly; they are findings, not execution failures.

## Stop point and execution protocol

1. Maintainer accepts (or amends by **new ledger entry only** — append-only; rejection recorded with reason). Silence authorizes nothing. Acceptance registers D1–D10, including the R3 procedure and the D6 witnesses.
2. The GOV-527 ticket bytes are bound from the current `MANIFEST.json`; the binding fingerprint enters the ledger via the manifest receipt; the maintainer accepts the unchanged boundary.
3. Execution authority: none in this shell. The execution successor is a separate instrument; it requires the acceptance entry landed, the frozen binding valid, and its own gate per the standing pattern (the GOV-520 activation precedent cited). This shell grants nothing by existing.
4. At execution start: binding check (mismatch → invalid, no disposition) → census verification gate → orbit/fiber procedure execution → single-pass aggregate computation → separate comparison entry point → receipt per the frozen reporting template, hashed into CHECKSUMS and MANIFEST per the sprint fixed-point discipline (rule 9); commits at green fixed points, maintainer-only, announced with SHA.
5. Failed or invalid runs are recorded, not retried-with-changes. Re-running is permitted only under the unchanged binding.

## Standing guard rails carried forward

- Pins are derived at open, never copied from prior prose; expectations are only from enumerated models conditioned on the current tree state.
- Pre-flight pins the interpreter (repo `.venv`); an unpinned interpreter is a recorded sitting-failure class.
- No directive-relative pointers in landed text: paths, entry titles, and absolute anchors only.
- Two-level non-vacuity (constraint-level AND statistic-level) at any boundary acceptance.
- Commit cadence: maintainer-only, at green fixed points, announced with SHA.
- `npm run validate` rewrites tracked qa/ reports — never run read-only; the full validate runs at the maintainer's fixed point.
- Settling expectation: one cycle; a mismatch surfaces the three QA reports; the pentatonic byte-identical settling precedent (five consecutive validations, including across a 100-commit era boundary) is the model.
- Canon guards: premises are checked before arithmetic (the withdrawn `C_H = 76` was computed from impossible premises); semantic-fidelity review against landed text precedes any run (the GOV-518 degeneracy — a registered constraint universalized its own measurement predicate and the statistic was removed constant on the admissible set; two-level non-vacuity is the binding repair); no undeclared actions — the only declared action is on assignment positions (`provenance/DECISION_LEDGER.md:1530,1533`); pcSum is not invariant under pitch-class rotation; the form-2 census-native orbit structure is the registered object (the D₇ ruling); self-orientation (HEAD, shallowness, as-of commit) precedes any claim judgment (the R16 class); board state is verified at open from the tree, never recalled from prior prose (the R17 class).
- Registered-vocabulary-only (rule 11); ledger-to-scrum sync with citation, never reverse (rule 8); receipts are state, ticket status is not; no model prose as mathematical source (rule 6); session prose is context, not evidence.

## Maintainer decision table

| Slot | What the maintainer registers | Acceptance | Status |
|---|---|---|---|
| D1 | Census space and aggregate domain: the 462-record census, the role reconciliation, boundary-role handling, the derived-never-assigned statement | finite/stateCount; roles machine-checked; aggregate derived | Registered; see `DECISION_LEDGER.md`, 'GOV-527 registration and freeze — 2026-10-16' |
| D2 | Two-stage predictor citation: anchor rule with C = 4; satellite inheritance; input class; office-path fence | cited-not-restated; zero office reads in the prediction path | Registered; see `DECISION_LEDGER.md`, 'GOV-527 registration and freeze — 2026-10-16' |
| D3 | Orbit/fiber procedure: the stated procedure and its complete read set; the third-party reproducibility statement | R3 acceptance (a)–(e), including the 57-block reproduction and the delta-histogram reproduction at the sitting | Registered; see `DECISION_LEDGER.md`, 'GOV-527 registration and freeze — 2026-10-16' |
| D4 | Ordering and order-invariance statement | neutral; verdict a set-function; replay-stable receipt | Registered; see `DECISION_LEDGER.md`, 'GOV-527 registration and freeze — 2026-10-16' |
| D5 | Census verification gate: the check list, per-mask coverage, fail-closed order | gate green before any aggregate output exists | Registered; see `DECISION_LEDGER.md`, 'GOV-527 registration and freeze — 2026-10-16' |
| D6 | Non-vacuity witnesses, two levels, including the reachable inconstancy branch | both levels demonstrated with registered fixtures | Registered; see `DECISION_LEDGER.md`, 'GOV-527 registration and freeze — 2026-10-16' |
| D7 | Outcome categories incl. orbit_inconstancy_finding and inheritance_inconsistency; verdict mapping; precedence; reporting template | all branches mapped; no discretion left; token names confirmed or renamed at acceptance — the branches must exist frozen | Registered; see `DECISION_LEDGER.md`, 'GOV-527 registration and freeze — 2026-10-16' |
| D8 | `completion_certificate` fields and the environment pin | certificate mandatory for reported categories; interpreter pinned (`.venv`) | Registered; see `DECISION_LEDGER.md`, 'GOV-527 registration and freeze — 2026-10-16' |
| D9 | Lineage and queue: the gate entry; L⁷ context; fallback dormancy; no cross-census reconciliation; no execution authority here | recorded in the acceptance entry | Registered; see `DECISION_LEDGER.md`, 'GOV-527 registration and freeze — 2026-10-16' |
| D10 | Vocabulary disposition for `orbit_invariant`, `orbit_inconstancy_finding`, `inheritance_inconsistency` | exists-or-ticketed at acceptance; prose guard arbiter | Registered; see `DECISION_LEDGER.md`, 'GOV-527 registration and freeze — 2026-10-16' |

Any empty cell at review time means the shell is not ready to execute. TBD cells block execution, not freezing of the shell.

## Executor discretion inventory (all resolve to frozen)

Which files the program may read (D3's recorded read set, verified across the input_reach_boundary) · when it stops (R5 gate; R8 completion; R3 stop conditions) · how ordering and ties are handled (R4, order-invariance) · what the receipt contains (the D7 reporting template — verdict-only reporting prohibited) · what happens on binding mismatch (step 4 — invalid, no disposition) · whether a failed run may be retried with changes (step 5 — no) · whether any post-execution input change is possible (R3/R7 — no; new boundary only).

## Vocabulary disposition (Rule 11)

New structural tokens named by this shell: `orbit_invariant`, `orbit_inconstancy_finding`, `inheritance_inconsistency`. Disposition: exists-or-ticketed at acceptance (D10); the prose guard is the arbiter at the sprint fixed point. All other terms are registered vocabulary cited from the gate entry or the pinned records (orbit/fiber, two-stage predictor, delta histogram, block structure, office-path fence).

## Verification

- Review this shell against the exists-or-ticketed guard and record it as definition-only: no executable suite is due from the shell itself.
- The acceptance sitting must demonstrate (a) the R3 reproduction — the block structure (57 blocks) and the delta histogram — from the pinned artifacts; (b) the two-level non-vacuity witnesses; (c) three-way binding on the pins.
- The execution successor must run source-binding, schema, exhaustive-completion, determinism/build-twice, reordered-input, negative-control, adversarial-tamper, and office-path-fence suites; each appears as `ran` or `skipped` with reason; skip-with-reason is permitted except the adversarial self-test, which is unconditional (the GOV-519 pattern, cited).
- Re-audit any mismatch through the maintainer review channel before execution; do not silently revise the frozen boundary.

## Definition of done

This ticket is complete as a queued, non-executing freeze-shell: R1–R8 carry slots plus binding acceptance criteria; the outcome mapping is frozen; the stop point is registered. An accepted `MANIFEST.json` binding and the acceptance entry are required before any aggregate artifact, QA receipt, or invariance disposition; the execution successor remains gated behind that acceptance.

## References

- `provenance/DECISION_LEDGER.md`, "Track 2 gate answer — aggregate design question registered — 2026-10-15" (line 3925) — mandate, question, falsification shape, premise set, fallback rule.
- `docs/THREE_PART_CONTINUOUS_TYPOLOGY.md` (DOC_HASH `11a7f70f…68d6c`) — the registration carrying the governed open question.
- `canonical/fivefold-incubator/fifth-space-census-v0.json` (pinned) and `qa/fifth-space-census-validation.json` (24/0 PASS).
- `orrery/src/generated/bl089-anchoring-remainder-interaction.v1.json` (pinned) — the two-stage predictor record, the block structure, and the orbit step law; `scrum/plan/bl-089-anchoring-remainder-interaction-memo.md`.
- `scrum/GOV-518-ring-constraint-forcing-enumeration.md` (freeze-shell precedent; B₃ `bee5f2a1…cba382`); `provenance/DECISION_LEDGER.md`, "GOV-518 degeneracy ruling and boundary amendment — 2026-09-07" (two-level non-vacuity extension).
- `scrum/GOV-519-ring-forcing-scaffolding.md` (fail-closed patterns); `scrum/GOV-520-ring-constraint-forcing-execution.md` and `qa/gov-520-production-receipt.json` (single-pass production precedent).
- `MANIFEST.json` (the current generated byte binding for this shell).
- `provenance/OBSERVATION_LEDGER.md` (observation side; read-only context).
