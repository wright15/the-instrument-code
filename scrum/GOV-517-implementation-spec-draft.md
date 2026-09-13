# GOV-517 Implementation Specification Draft — D5 Signature Derivation

**Status:** Completed — Maintainer re-audit closed the authorized run as `derived`; see OBS-022 and DECISION_LEDGER ENTRY 8
**Ticket:** `scrum/GOV-517-d5-signature-derivation-definition.md` · **Epic:** EPIC-520
**Frozen body:** `### Derivation Targets (T1–T3)` through end-of-file, frozen per `provenance/DECISION_LEDGER.md` ENTRY 7 ("GOV-517 derivation boundary freeze — 2026-09-12")
**Scope:** Phase 2 specification only. This file creates no derivation artifact, QA receipt, result, or H disposition. Internal algorithm implementation is deferred to Phase 2 code review.

## Lineage and binding authority

1. The sole specification authority is the frozen body in `scrum/GOV-517-d5-signature-derivation-definition.md` beginning exactly at `### Derivation Targets (T1–T3)`, frozen by ENTRY 7.
2. `MANIFEST.json` is the sole input-binding authority. All input paths named in §6 bind by SHA-256 at pre-flight; prose literals in this draft bind nothing.
3. `provenance/OBSERVATION_LEDGER.md` OBS-008 and OBS-009 are structural provenance citations only (registered $I_1$ distance-2/$K$ relation and window geometry respectively); they are not observed $D_5$ inputs (ENTRY 7).
4. `qa/twin-hub-convergence-validation.json` + `canonical/fivefold-incubator/twin-hub-convergence-v0.json` are OBS-014 receipt references only. Observed $D_5$ contact conclusions, seat rows, and midpoint conclusions are excluded from runtime and admissible only as downstream comparison evidence (ENTRY 7).
5. `qa/fifth-space-census-validation.json` + `canonical/fivefold-incubator/fifth-space-census-v0.json` may cite source-bound A-tier fifth-position-mask provenance for $I_4$ only. No D-tier row, $D_5$ observation, or outcome conclusion is authorized as runtime input (ENTRY 7).
6. `qa/shadow-ladder-validation.json`, `qa/pentatonic-binding-audit-closure.json`, `qa/orrery-field-derivation-bundle-validation.json` are dependent-suite freshness receipts only with no runtime-input authority (ENTRY 7).
7. This draft grants no topology, admission, runtime, office-assignment, graph, or global `harmonic.C_H` authority and emits no H1/H2/H3 disposition. Result categories and disposition mapping are carried verbatim from the frozen body (§2 of this draft restates the comparison gate; §6 restates the category table without amendment).
8. Any revision or re-test requires a new boundary registration and new ticket; this frozen state remains preserved (ENTRY 7 guard; frozen-body rule 8).

## Non-goals and guards (carried, not amended)

- D5-specific only. No generalization to D4, all D signatures, an operator, or hypothesis-level conclusion beyond the frozen `derived / not_derived / incomplete_or_anomalous / invalid` table.
- Any H1/H2/H3 disposition must use the registered language in EPIC-520-1 and be emitted by generator case logic, not asserted in prose (frozen body).
- A declared D5 contact-signature condition must be stated as required input or removed as counterfactual before execution; that distinction cannot be blurred after inspecting output (frozen body).
- Missing source, environment gap, or timeout is `invalid`/`partial` with recorded `skipped` reason, never confirmation (frozen body).

---

## Section 1: Primary vs. Secondary Contact Distinction Criteria

### 1.1 Frozen boundary passages relied on (verbatim quotes)

This section relies exclusively on the following frozen-body passages. No other passage authorizes the T1/T2 distinction.

**Q1 — Target envelope:**

> "Targets are defined strictly as algebraic/structural generation claims produced solely from first-principles inputs ($I_1–I_4$). The derivation engine must be capable of disagreeing with observed canonical state; match determination against canonical observations is decoupled and executed strictly downstream."

**Q2 — T1 definition (full table row):**

> "| **T1** | Primary $A_2$-Satellite Contact Alignment | Generation of primary same-office contact states for $A_2$-satellites via $K$-convolution ($K = \\delta_{-1} + \\delta_{+1}$) over $\\mathbb{Z}_7$ office-space vectors dual-mapped to $\\text{window}(k) = [-k, 6-k]$ geometry. |"

**Q3 — T2 definition (full table row):**

> "| **T2** | Secondary $A_2$-Satellite Contact Alignment | Generation of secondary same-office contact states produced by mapping distance-2 step structures ($I_1$) across $A$-tier construction-edge transitions ($I_2$). |"

**Q4 — T3 downstream-deferral note (isolation corroboration, not a T1/T2 input):**

> "*Note: Mercury-hub midpoints must emerge as generated output; match evaluation against observed $D_5$ canonical state is deferred strictly to the downstream comparison layer.*"

**Q5 — Negative-control separation (corroborates independent checks):**

> "1. **NC-1 (Kernel Perturbation Control):** Substitute symmetric kernel $K = \\delta_{-1} + \\delta_{+1}$ with an asymmetric variant ($K = \\delta_{-2} + \\delta_{+1}$). **Expected result:** Engine fails T1 generation check."

### 1.2 Authorized input reading for T1/T2 (no new inputs)

- $I_1$: distance-2 step / $K$-relation structures. Structural provenance citation only: OBS-008 ("Every anchor is generated by its office-ring distance-2 pair `{k−1,k+1}`", "`K=δ₋₁+δ₊₁` over `Z7` is **exhaustive**"). $I_1$ is not an observed $D_5$ input (ENTRY 7).
- $I_2$: $A$-tier construction-edge transitions (`CONSTRUCTS`-class edges; selected D4/D5 `SEAT_CONTACT` chain-audit rows are never $I_2$).
- Window geometry `window(k) = [-k, 6-k]` and the intersection rule `window(j) ∩ window(j+d) = 7-d`: structural provenance citation OBS-009 only; not an observed $D_5$ input (ENTRY 7).
- $I_4$: $A$-tier fifth-position masks (A-tier slice provenance only per ENTRY 7; no D-tier row authorized).
- $I_3$ is a member of the authorized $I_1$–$I_4$ envelope. The frozen body names $I_1$, $I_2$, $I_4$ explicitly in the T1/T2/T3 rows; this specification invents no $I_3$ content. The harness SHALL accept the $I_3$ binding as envelope input, prove by import-closure + AST scan that no excluded $D_5$ content enters through it, and SHALL NOT consult it in the T1/T2 classifiers except as explicitly registered at code review. Envelope membership is not a generative input.

### 1.3 Explicit operational criterion (route-membership, generation-time only)

Let `G_T1` be the output set of the T1 generation route and `G_T2` the output set of the T2 generation route, both computed solely from authorized $I_1$–$I_4$ inputs during the single generation pass and before any downstream comparison executes.

**Primary-contact criterion (T1-PASS):**

> A generated state `s` is classified PRIMARY iff `s ∈ G_T1`, where `G_T1` is produced by BOTH of the following conjunctive checks passing:
>
> - (T1-a) **K-convolution reachability:** `s` is reachable by applying the symmetric kernel `K = δ_{-1} + δ_{+1}` as a convolution operator over `Z_7` office-space vectors from authorized inputs. Any substitution of `K` (including the NC-1 asymmetric `K = δ_{-2} + δ_{+1}`) SHALL NOT count toward `G_T1`.
> - (T1-b) **Window-dual well-formedness:** the producing `Z_7` vector satisfies the dual-map consistency check against `window(k) = [-k, 6-k]` geometry. A state reachable by `K` but failing the window-dual check is NOT primary.
>
> `T1-PASS ≡ (T1-a ∧ T1-b)`. The T1 check function SHALL NOT read any observed $D_5$ state, seat assignment, office assignment, run mask, run sequence, containment conclusion, intersection set, or twin-hub conclusion.

**Secondary-contact criterion (T2-PASS):**

> A generated state `s` is classified SECONDARY iff `s ∈ G_T2`, where `G_T2` is produced by BOTH of the following conjunctive checks passing:
>
> - (T2-a) **Distance-2 step provenance:** `s` derives from a registered distance-2 step structure ($I_1$) as its step primitive.
> - (T2-b) **Construction-edge traversal validity:** that $I_1$ structure is mapped across a valid $A$-tier construction-edge transition ($I_2$). A distance-2 structure not carried across a valid $I_2$ edge is NOT secondary.
>
> `T2-PASS ≡ (T2-a ∧ T2-b)`. The T2 check function SHALL NOT invoke the `K`-convolution operator as a generative step, SHALL NOT consult `window(k)` dual-mapping as a generative step (shared `Z_7` indexing as background arithmetic is not a generative step), and SHALL NOT read any observed $D_5$ state, seat assignment, or twin-hub conclusion.

**Joint classification rule (four-cell outcome, recorded per state):**

| `s ∈ G_T1` | `s ∈ G_T2` | Classification |
|---|---|---|
| true | false | primary-only |
| false | true | secondary-only |
| true | true | both (independently generated by both routes; routes do not collapse) |
| false | false | neither |

Both-ness is convergence of two independent generative proofs, not a label conflict. Neither-ness contributes to `not_derived` pressure under the frozen category table. The harness SHALL emit the per-state `(in_T1, in_T2)` pair; prose SHALL NOT re-label a `both` state as one route or the other.

### 1.4 Proof that T1 and T2 are operationally independent generation checks (not dual names)

The frozen body defines two distinct generation claims (Q2 vs Q3 under the Q1 envelope). Independence is operational, demonstrated by all five of the following, each verifiable at code review by the named check-function separation:

1. **Distinct operators.** T1's generator is a convolution operator (`K = δ_{-1} + δ_{+1}` over `Z_7` vectors); T2's generator is a graph-structural map (distance-2 step structures across construction-edge transitions). No shared generative subroutine beyond deterministic integer utilities is permitted; `check_T1` SHALL NOT call `check_T2`'s traversal and `check_T2` SHALL NOT call `check_T1`'s convolution.
2. **Distinct input channels.** T1 consumes `Z_7` office-space vectors + window-geometry duality; T2 consumes $I_1$ step structures + $I_2$ edge transitions. Corrupting one channel does not entail corrupting the other (see 3).
3. **Distinct failure signatures (control dissociation).** Per Q5, NC-1 asymmetric-kernel substitution fails the T1 generation check by construction while leaving the T2 traversal logic untouched; conversely, corrupting $I_2$ (supplying a non-`CONSTRUCTS` edge set, cf. NC-4 family) fails the T2 check while leaving `K`-convolution well-formedness intact. A single computation under two names cannot dissociate under perturbation; T1/T2 do, so they are two checks.
4. **Distinct well-formedness predicates.** (T1-b) window-dual consistency has no counterpart in T2; (T2-b) edge-traversal validity has no counterpart in T1. Each predicate can fail while the other passes, yielding the primary-only and secondary-only cells of the §1.3 table. Dual names for one computation admit only `both-or-neither`; the specified four-cell outcome space is realizable only by two checks.
5. **Zero observed-state dependence on both sides.** By Q1, both claims are "produced solely from first-principles inputs ($I_1$–$I_4$)" and the engine "must be capable of disagreeing with observed canonical state." Neither classifier takes observed $D_5$ state, seat assignments, office assignments, run masks, the `(3,3,3,3,5,2,2)` sequence, `5-35` containment, the `{2383,3667}` intersection, the `{5}` candidate set, or Mercury/Mars/Jupiter midpoint conclusions as input. Independence therefore cannot be an artifact of fitting a shared observation: there is no shared observation in either check's input closure.

### 1.5 Explicit prohibitions (T1/T2 isolation)

- No T1/T2 classifier, helper, constant table, or default argument SHALL contain, import, read, or reconstruct: observed $D_5$ seat rows (any of the 14 $D_5$ `SEAT_CONTACT` rows or the 28-row D4/D5 audit selection), $D_5$ run masks or fifth-position D-tier rows, the D-channel maxrun sequence, $D_5$ Court-class `5-35` containment, the twin-outer-office intersection `{2383,3667}`, the `V = {5}` candidate fact, or any twin-hub $D_5$ convergence-onto-unseated-midpoints conclusion (OBS-014 $D_5$ reading, OBS-018, OBS-019).
- OBS-008 and OBS-009 window/`K` statements are usable only as structural provenance for the $I_1$/geometry form (per ENTRY 7), never as carriers of $D_5$ outcome content.
- Match against canonical $D_5$ observations occurs strictly downstream (§2) after derivation completion. Generation-time agreement with observation is coincidence, not a pass condition; generation-time disagreement is a real output (`not_derived` pressure), not an error.

---

## Section 2: Downstream Comparison Layer Mini-Specification (GOV-520 pattern)

### 2.1 Decoupling principle

Generation and observation are separate pipeline stages. The derivation engine completes its single generation pass over $I_1$–$I_4$ and seals its output (generation completion marker + digests) BEFORE the comparison layer reads any canonical $D_5$ observation artifact. No comparison result, observed value, or similarity gradient flows back into generation. This follows the GOV-520 pattern: single production run, then a separate comparison entry point reading fingerprint-verified canonical artifacts with SHA-256 recomputed against CHECKSUMS/MANIFEST at run time.

### 2.2 Stage gates

1. **Generation seal.** Harness emits `generated_T1_set`, `generated_T2_set`, `generated_T3_assignment` + `generated_midpoints`, with per-state route-membership pairs (§1.3), input digests ($I_1$–$I_4$ SHA-256 + MANIFEST binding id), and a generation completion marker. The marker is a precondition for comparison startup; absence or digest mismatch halts with `invalid` and no disposition.
2. **Comparison startup (separate entry point).** Comparison process re-verifies: (a) generation digests match sealed values; (b) each canonical observation artifact SHA-256 matches MANIFEST.json/CHECKSUMS at comparison time. Any mismatch → `incomplete_or_anomalous / invalid` with reason; no H disposition.
3. **Comparison execution.** Read-only reads of the fingerprint-verified canonical observation record; exact checks per §2.3; emit match flags + comparison receipt. Verdict-ineligible fixture/control runs expose digests only and are discarded (GOV-520 single-pass reconciliation).

### 2.3 Exact equality / isomorphism checks (no fuzzy matching)

Default is exact set equality under the registered coordinate labeling. No normalization, rounding, reordering-tolerance, threshold, or similarity score is permitted unless pre-registered as an isomorphism below — none is registered in this draft. Any future isomorphism requires a new boundary registration; the code SHALL implement exact equality only.

- **T1-MATCH:** `true` iff `generated_T1_set == canonical_D5_primary_reference_set` as exact sets (same elements, same encoding, same $Z_7$/office labeling). Otherwise `false`. Canonical reference is derived at comparison time from fingerprint-verified artifacts; it is never hardcoded and never visible to generation.
- **T2-MATCH:** `true` iff `generated_T2_set == canonical_D5_secondary_reference_set` as exact sets. Otherwise `false`. Same provenance rule as T1-MATCH.
- **T3-MATCH:** conjunction of two exact checks: (T3-a) `generated_office_convergence_assignment == canonical_D5_convergence_assignment` (exact mapping equality, office-by-office); (T3-b) `generated_midpoint_geometry == canonical_D5_midpoint_set` (exact set equality over midpoint identifiers as encoded at comparison time). `T3-MATCH ≡ (T3-a ∧ T3-b)`.
- Type discipline (GOV-518 A3 analogue): the comparison target type must match the generated-operand type. A value-set (e.g., candidate set `{5}`) is not a substitute for a contact-state set or an argmax/coordinate set; cross-type equality is `false` by construction and recorded as a type-mismatch note, not coerced.

### 2.4 Match result schema (comparison receipt fragment)

```json
{
  "comparison_layer": "gov-517-downstream-v0",
  "generation_binding": { "manifest_id": "<MANIFEST binding>", "i1_sha256": "<hex>", "i2_sha256": "<hex>", "i3_sha256": "<hex>", "i4_sha256": "<hex>", "generation_digest": "<hex>" },
  "canonical_binding": { "artifact": "<path>", "sha256_recomputed": "<hex>", "manifest_expected": "<hex>", "match": true },
  "checks": {
    "t1_match": { "result": true, "mode": "exact_set_equality", "generated_count": 0, "reference_count": 0 },
    "t2_match": { "result": true, "mode": "exact_set_equality", "generated_count": 0, "reference_count": 0 },
    "t3_match": { "result": true, "mode": "exact_conjunction", "t3a_assignment_equal": true, "t3b_midpoints_equal": true }
  },
  "category_proposal": "derived | not_derived | incomplete_or_anomalous | invalid",
  "notes": "generator case-logic output; no prose disposition"
}
```

`category_proposal` is computed by generator case logic from the frozen Result Categories table (T1+T2+T3 reproduced with zero excluded inputs and all controls green → `derived`; valid completion with none-or-proper-subset → `not_derived`; missing/stale binding, breach, control/fixture failure, timeout, selected-only output → `incomplete_or_anomalous / invalid`). Comparison proposes; the receipt records; prose asserts nothing. Final H-language disposition uses EPIC-520-1 registered language only (supports-H1-mechanism-route for $D_5$ / weakens-H3-authorship for $D_5$ / H2 no disposition / D4 no disposition, with the `not_derived` qualifier that failure reflects derivation difficulty, not strong positive proof of H3).

---

## Section 3: Negative Controls (NC-1 – NC-4) Implementation Mapping

All controls execute as pre-flight target-level / check-level rejection suites PRIOR to the live derivation engine. Live derivation starts only on all-green. Any control failing to reject its target (false-positive pass) halts with `invalid` and no disposition (frozen stop-point).

### NC-1 — Kernel Perturbation Control

- **Fixture location (draft):** `tests/gov_517/fixtures/nc1_asymmetric_kernel.json` — staged asymmetric kernel descriptor `K = δ_{-2} + δ_{+1}` plus minimal $I_1$–$I_4$-shaped harness inputs referencing only authorized channels. Fixture is fingerprinted; its presence in the production input path invalidates the run.
- **Procedure:** harness loads the NC-1 fixture through the same `check_T1` code path as production (no alternate implementation). No other input changes.
- **Target-failure assertion:** `T1-PASS == false` (specifically `T1-a` fails; `G_T1` empty or window-dual inconsistent). Assertion recorded as `nc1_t1_rejected: true`. T2/T3 outcomes are recorded but not asserted (dissociation note: T2 check SHALL remain executable and its output recorded to evidence independence, but NC-1 passes on T1 rejection alone).
- **Pass criterion:** suite reports `rejected` only if T1 fails as above AND the production symmetric `K = δ_{-1} + δ_{+1}` still passes its specificity counterpart on clean inputs in the same sitting.

### NC-2 — Excluded-Input Circularity Intercept

- **Staging fixtures (draft, never in production path):** `tests/gov_517/fixtures/nc2a_d5_seat_rows.json` (observed $D_5$ seat-row encodings + transform-family images: complements, per-tier differences, reversals, reorderings, dual encodings), `nc2b_d5_run_masks.json` ($D_5$ run/fifth-position masks + complements), `nc2c_twinhub_d5_conclusions.json` (twin-hub $D_5$ convergence/midpoint conclusions + paraphrases). Each tagged with family and fingerprinted (GOV-519 CR-3 analogue).
- **Injection tests:** (a) static: AST literal scan + import-closure check over harness sources with each NC-2 fixture staged into the input-reach surface → must flag; (b) runtime: in-memory live-value suite reads fingerprint-verified canonical artifacts, computes true-value set + transform-family images in memory only (never persisted), scans harness input surfaces → must flag; (c) adversarial self-test: temp harness copy containing a decoy forbidden literal (never a true value) → must reject → deleted, never committed (GOV-519 CR-4 analogue, unconditional in every pre-flight).
- **Runtime scanner halt semantics:** on any intercept, halt immediately with status `invalid` (circularity breach), reason `excluded_input_detected`, no partial generation output, no disposition, no retry-with-changes. Detector-red in pre-flight means the production stage never starts (GOV-519 CR-7 analogue).

### NC-3 — Window Invariant Violation

- **Offset mutation fixture (draft):** `tests/gov_517/fixtures/nc3_window_offset.json` — window definition shifted from `window(k) = [-k, 6-k]` to a non-conforming offset (e.g., `[-k+1, 7-k]` or parameterized `c ≠ 0` offset; exact mutant registered at code review, one mutant minimum, additional mutants permitted as separate cases).
- **Procedure:** run T3 generation path with the mutant geometry; authorized $I_4$ otherwise unchanged.
- **Expected T3 rule failure flag:** window intersection rule check `window(j) ∩ window(j+d) = 7-d` fails (`window_invariant_hold == false`), therefore `T3-PASS == false`. Recorded as `nc3_t3_rejected: true`. Suite also asserts the clean-geometry specificity counterpart passes in the same sitting.

### NC-4 — Decoy Mask Injection

- **Corrupted mask fixtures (draft):** `tests/gov_517/fixtures/nc4a_non_a_tier_anchor.json` (non-$A$-tier anchor masks), `nc4b_non_a_tier_fifth_masks.json` (non-$A$-tier fifth-position masks). Each records its non-$A$-tier provenance tag; fingerprinted; outside the production path.
- **Procedure:** supply each as $I_4$ through the T3 office-convergence path.
- **Output schema assertions:** harness output validates against the §6 schema AND asserts `T3-PASS == false` with `convergence_unambiguous == false` (no unambiguous office-convergence assignment emerges from decoy masks). Any unambiguous assignment emitted from decoy input is a control failure → halt `invalid`. Clean-$I_4$ specificity counterpart must yield schema-valid output in the same sitting (pass/fail of T3 itself is generation outcome, not control outcome; control outcome is rejection-on-decoy).

---

## Section 4: Stop-Point Verification Mechanics

Execution MUST stop immediately with no disposition assigned if any halt condition fires (frozen Stop-Points). Mechanics below implement the GOV-520 pre-flight pattern: binding check → input-boundary screen → fixture/control runs (digests only, discarded, verdict-ineligible) → unconditional adversarial self-test → green or stop.

### 4.1 Pre-execution binding sweep (SHA-256 vs MANIFEST.json)

1. Compute SHA-256 of every registered runtime input file ($I_1$–$I_4$ bindings, harness sources in closure, fixture fingerprints for exclusion proof).
2. Compare byte-for-byte against `MANIFEST.json` (three-way: computed ↔ MANIFEST.json ↔ ENTRY 7 / manifest receipt entry, GOV-520 B₃ analogue). The binding id enters the receipt.
3. Mismatch, stale binding, missing source, or unavailable binding → halt `invalid` (`binding_mismatch`), no disposition, no retry-with-changes; re-test requires new boundary registration + new ticket with original preserved (frozen rule 8 analogue).
4. Environment pin recorded in receipt (language versions, CPU-only attestation); wall-clock/RNG/locale inputs prohibited (see §6).

### 4.2 AST literal scanner (strict $I_1$–$I_4$ isolation)

- Scan all harness sources in the import closure for integer literals, string literals, and structural constants. Every literal must appear on a pre-registered structure-derived allowlist with a one-line structural justification (GOV-519 CR-2b analogue). The allowlist is structure-derived, never harness-derived; it is finalized at the first gated step before live derivation.
- Unlisted literal → fail-closed finding; fix ownership is the gated pre-flight surface (boundary untouched).
- Numeric observed literals and observed-derivative tuples (run sequences, containment labels, intersection sets, candidate sets, midpoint conclusions, and their transform-family images) are prohibited outside the audit allowlist (§5). Identifier-class needles (OBS-*/GOV-5xx references, artifact paths/fields) are retained only with recorded justification; class-label strings require the same (GOV-519 CR-5 analogue).
- No needle may match vocabulary the boundary itself requires the harness to use (e.g., `window`, `maxrun`-adjacent structural terms where the boundary requires them); structural-vocabulary retention is permitted only with recorded justification.

### 4.3 Import-closure validation (input_reach_boundary analogue)

- Closure root: the single harness entry file(s) registered at code review. Allowed imports: deterministic integer/stdlib surface explicitly allowlisted (no `fs`-beyond-registered-reads, no `path`-taking argv, no `child_process`, no network, no dynamic import/require).
- Reachability guard: no reachable read/import path from the closure into excluded-observation carriers (`tests/gov_517/` decoy/NC-2 fixtures, canonical $D_5$ observation artifacts, QA receipts carrying $D_5$ conclusions) except through the suite-scoped canonical-read authority (§5, detection-only, in-memory, never persisted, never reachable from generation code).
- The comparison entry point is a separate module with its own closure; generation closure MUST NOT import it and it MUST NOT be reachable during generation. Cross-closure import → halt `invalid`.
- Tamper fixtures (semantic re-encodings: complement spans, per-tier differences, mask complements, reversed orderings) placed into the generation input path MUST be rejected by this check, including under target-blindness conditions (fixtures live outside the real input path, are fingerprinted, presence in production invalidates the run).

---

## Section 5: Decoy Corpus Requirements & AST/Import Screening (GOV-519 pattern)

### 5.1 Corpus structure

- **Location (draft):** `tests/gov_517/` — committed decoy corpus only; no true observed $D_5$ values committed outside the audit allowlist (§5.3).
- **Families covered (minimum):** complements, per-tier differences, reversals, reorderings, dual encodings, paraphrased conclusions — applied to each intercepted artifact class in §5.2. Each decoy file carries `{family, source_class, synthetic_value}` tags and a fingerprint.
- **Proof obligations:** sensitivity — every decoy is rejected by the §4 screens (red on negative); specificity — the clean harness + registered structural constants pass (green on clean). Fail-closed matrix recorded in the pre-flight receipt (GOV-519 17/17 analogue; exact suite count registered at code review).
- **Handling discipline:** live true-value computation in memory only at test runtime from fingerprint-verified canonical artifacts; nothing persisted ever (GOV-519 CR-2c/CR-6 analogue). Control runs expose digests only — byte-identity proof without content disclosure; the production run remains the first content-bearing read (GOV-519 CR-7 analogue).

### 5.2 Explicit intercepted circular-artifact list (non-exhaustive minimum; transform-family images of each included)

1. Observed $D_5$ seat maps / seat rows: all 14 $D_5$ `SEAT_CONTACT` rows (and the 28-row D4/D5 audit selection as carrier).
2. $D_5$ run masks / fifth-position D-tier rows: any D-tier fifth-position mask, $D_5$ maximal-run mask, anchor mask claimed as $D_5$ evidence.
3. Twin-hub $D_5$ conclusions: Mercury-hub sharing claim, `{Mars,Jupiter}` unseated-midpoint convergence claim, "convergence-onto-unseated-midpoints" verdict language and paraphrases.
4. D-channel run sequence `(3,3,3,3,5,2,2)` (OBS-018) and any re-encoding (differences, argmax lists, reorderings, complements).
5. $D_5$ Court-class `5-35` five-run containment claim (OBS-019) and twin-outer-office intersection `{2383,3667}`.
6. Maximum-candidate record `V = {5}` / `{5}` value-set (OBS-020) and any coordinate/value-set conflation.
7. GOV-514 scalar result (frozen-body exclusion analogue) and any D-signature / declared-contact signature smuggling (declared D4/D5 contact-signature conditions as inputs unless pre-registered as required-input vs counterfactual-removed per frozen body).
8. Complement spans, per-tier differences, mask complements, reversed orderings derived from any of 1–7.

### 5.3 Audit allowlist (where true values may appear)

Canonical artifacts (`canonical/fivefold-incubator/*` $D_5$-carrying records), validators bound to them, provenance ledgers, registered boundary documents quoting observations (including this draft's §1 quotes and the GOV-517 ticket), `tests/gov_517/` (decoys only, verified), and redesigned checker/suite sources post-verification. Assertion: no true $D_5$ values anywhere else in the working tree (GOV-519 CR-1/CR-8 analogue). Canonical-read authority is suite-scoped: the in-memory detection suite may read canonical artifacts for detection; generation code never does (enforced by §4.3 closure check).

---

## Section 6: Harness Architecture & Interface Contract

Internal algorithm implementation is deferred to Phase 2 code review. This section binds the contract only: inputs, outputs, schemas, and determinism constraints.

### 6.1 Input contract (explicit paths; bindings via MANIFEST.json)

| Channel | Draft path (binding by SHA-256 at pre-flight) | Content constraint |
|---|---|---|
| $I_1$ | `canonical/...` structural distance-2 / $K$-relation source + `...` step-structure table (exact paths + fingerprints registered at code review; OBS-008 is provenance, not the file) | Distance-2 step structures only; no D-tier row, no $D_5$ observation, no outcome conclusion |
| $I_2$ | `canonical/...` $A$-tier `CONSTRUCTS` edge set (exact path + fingerprint registered at code review) | $A$-tier edges only; selected D4/D5 `SEAT_CONTACT` rows excluded |
| $I_3$ | Envelope binding registered at code review (placeholder within $I_1$–$I_4$; exact path registered, may be empty/constant table) | No excluded content (proven by §4 scans); not consulted by T1/T2 classifiers except as registered |
| $I_4$ | A-tier slice of `canonical/fivefold-incubator/fifth-space-census-v0.json` (A-tier rows only; exact slice descriptor + artifact SHA-256 registered at code review) | $A$-tier fifth-position masks only; D-tier rows excluded (ENTRY 7) |

Zero-filesystem-violation rule: the harness reads exactly these bound inputs plus allowlisted argv constants (pathless allowlist, GOV-519 analogue). Any additional read path invalidates the run.

### 6.2 Output contract

- **Primary artifact:** `qa/gov-517-d5-derivation-report.json` — the sole derivation report (frozen DoD). It details target generation flags (T1, T2, T3), input digest citations, and per-suite `ran`/`skipped`-with-reason status.
- **Schema (draft, frozen at code review):**

```json
{
  "boundary": "GOV-517",
  "manifest_binding": "<hex>",
  "inputs": { "i1_sha256": "<hex>", "i2_sha256": "<hex>", "i3_sha256": "<hex>", "i4_sha256": "<hex>" },
  "generation": {
    "t1_pass": false, "t1_set": [],
    "t2_pass": false, "t2_set": [],
    "t3_pass": false, "t3_assignment": {}, "t3_midpoints": [],
    "per_state_routes": [{ "state": "<id>", "in_t1": false, "in_t2": false }],
    "window_invariant_hold": true, "convergence_unambiguous": true
  },
  "controls": { "nc1_t1_rejected": true, "nc2_intercepted": true, "nc3_t3_rejected": true, "nc4_t3_rejected": true },
  "comparison": { "t1_match": false, "t2_match": false, "t3_match": false, "canonical_binding": "<hex>" },
  "suites": [{ "name": "source-binding | schema | scope | arithmetic | build-twice | reordered-input | negative-control | adversarial-tamper", "status": "ran | skipped", "reason": "<non-empty if skipped>" }],
  "category": "derived | not_derived | incomplete_or_anomalous | invalid",
  "disposition_language": "EPIC-520-1 registered language, generator-emitted only"
}
```

- Full generated sets in registered order (lexicographic or code-review-registered neutral order); verdict-only reporting prohibited (selected-only output → `invalid`).
- `disposition_language` uses only the frozen category table + EPIC-520-1 H-language; no prose disposition.

### 6.3 Determinism constraints (exact)

- Single-pass generation: exactly one live derivation pass post-green; control/fixture runs are pre-flight, digest-only, discarded, verdict-ineligible.
- Zero-FPU integer logic: no floating-point operations, no float literals, no float library imports; integer arithmetic only (detected by AST scan; any float/RNG construct → halt `invalid` per frozen stop-point).
- Zero RNG constructs: no random module, no time/uuid/locale/entropy reads, no concurrency nondeterminism; single-threaded, CPU-only, pinned environment recorded in receipt.
- Reproducibility: build-twice byte-identity + reordered-input invariance suites required (each `ran` or `skipped` with non-empty reason; adversarial self-test unconditional).
- Fixed-point convergence analogue: manifest update + `npm run validate` complete with zero settling cycles where applicable to this ticket's wiring scope; otherwise recorded as scoped-skipped with reason (no silent omission).

### 6.4 Stop-point wiring

Any of: binding mismatch; excluded-artifact detection (§4–§5); control failure to reject (false-positive pass); float/RNG detection — halts immediately, records `incomplete_or_anomalous / invalid` with reason, assigns no disposition, permits re-test only under new boundary registration + new ticket.

---

## References

- `scrum/GOV-517-d5-signature-derivation-definition.md` (frozen body; sole authority)
- `provenance/DECISION_LEDGER.md` ENTRY 7 (freeze; scope citations; guard)
- `provenance/OBSERVATION_LEDGER.md` OBS-008, OBS-009 (structural provenance), OBS-014, OBS-018, OBS-019, OBS-020 (observation side; downstream-only)
- `scrum/EPIC-520-1-unified-operator-planning.md` (H1/H2/H3 registered language)
- `scrum/GOV-519-ring-forcing-scaffolding.md` (CR-1–CR-8, decoy corpus, fail-closed pattern)
- `scrum/GOV-520-ring-constraint-forcing-execution.md` (pre-flight order, single-pass, separate comparison entry point)
- `MANIFEST.json`, `CHECKSUMS.sha256` (binding authorities)

## Maintainer sign-off block (required before Phase 2 code generation)

- [ ] §1 criterion accepted (T1/T2 route-membership + independence proof + zero observed-state reliance)
- [ ] §2 comparison checks + schema accepted (exact equality; no isomorphism without re-registration)
- [ ] §3 NC fixtures + assertions accepted
- [ ] §4 stop-point mechanics accepted
- [ ] §5 decoy corpus + allowlist accepted
- [ ] §6 input paths + determinism constraints accepted
- [ ] Parallel-capacity / queue discipline confirmed (GOV-516 vs maintainer-approved parallel capacity; GOV-517 queue untouched by GOV-518/519/520)

*Halt: no code generation begins until all boxes are signed. This draft authorizes no execution.*
