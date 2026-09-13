# GOV-517 - D5 signature derivation definition

**Status:** Backlog · **Priority:** High · **Points:** TBD · **Epic:** [EPIC-520](EPIC-520-unified-operator.md) · **Sprint:** Sprint 4
**Depends on:** GOV-516 completion or maintainer-approved parallel capacity · **Blocks:** None

**Mapping:** EPIC-520-1 §4 check (iv), re-scoped to the D5 run-space target. This
is a queued definition ticket only. It must not execute until GOV-516 completes
or the maintainer records approved parallel capacity.

## Story

As a research maintainer, I want a bounded D5 signature-derivation check defined
from the independently receipted D5 observations so a later execution can test a
declared-signature route without treating the data as a unified-operator result.

## Evidence boundary

The draft may use only the cited, source-bound observations as directions for a
later specification:

- OBS-018 records the D5 maxrun spike in the D-channel run sequence.
- OBS-019 records D5's Court-class `5-35` five-run containment and the
  twin-outer-office intersection `{2383, 3667}`.
- OBS-014 records the A2 twin-hub and D5 convergence-onto-unseated-midpoints
  finding under its declared `SEAT_CONTACT` audit scope.

These receipts are planning evidence. They neither create an office assignment,
admission, topology, runtime behavior, global `harmonic.C_H`, nor a result for
H1, H2, or H3. The D5 5-run and intersection are not inputs to GOV-516's
run-space candidate set.

## Required later definition

Before execution, a successor must pre-register its source inputs, immutable
boundary, deterministic derivation, complete output space, result categories,
verdict mapping, and negative controls. It must state whether a declared D5
contact-signature condition is tested as a required input or removed as a
counterfactual; it cannot blur that distinction after inspecting an output.

The successor must keep its result D5-specific. It cannot generalize to D4, all
D signatures, an operator, or a hypothesis-level conclusion. Any H1/H2/H3
disposition must use the registered language in EPIC-520-1 and be emitted by
generator case logic, not asserted in prose.

## Negative controls

- Reject a D4-only, D5-only, or selected intersection result as evidence about
  both D4 and D5 signatures.
- Reject added office, contact, topology, or observed-result constraints that
  are absent from the approved later input table.
- Reject missing source bindings, altered ordering, selected-only output,
  rehashed semantic tampering, and stale receipts.
- Treat a missing source, environment gap, or timeout as invalid/partial
  evidence with a recorded `skipped` reason, never a confirmation.

## Verification and queue guard

The later successor must record source-binding, schema, scope, arithmetic,
build-twice, reordered-input, negative-control, and adversarial-tamper suites
as `ran` or `skipped` with a non-empty reason. It must undergo maintainer review
before execution. This ticket remains Backlog until GOV-516 completes or the
maintainer approves parallel capacity.

## Definition of done

This ticket is complete only as a queued, non-executing D5 definition. A later
approved successor is required for any derivation artifact, QA receipt, result,
or hypothesis disposition.

## References

- [EPIC-520-1](EPIC-520-1-unified-operator-planning.md)
- [GOV-516](GOV-516-run-space-d5-derivability-enumeration.md)
- `provenance/OBSERVATION_LEDGER.md` (OBS-014, OBS-018, OBS-019)
- `canonical/fivefold-incubator/d-shadow-complement-span-v0.json`
- `qa/d-shadow-complement-span-validation.json`

### Derivation Targets (T1–T3)

Targets are defined strictly as algebraic/structural generation claims produced solely from first-principles inputs ($I_1–I_4$). The derivation engine must be capable of disagreeing with observed canonical state; match determination against canonical observations is decoupled and executed strictly downstream.

| Target ID | Name | First-Principles Condition Definition (Pure Generation Claim) |
|---|---|---|
| **T1** | Primary $A_2$-Satellite Contact Alignment | Generation of primary same-office contact states for $A_2$-satellites via $K$-convolution ($K = \delta_{-1} + \delta_{+1}$) over $\mathbb{Z}_7$ office-space vectors dual-mapped to $\text{window}(k) = [-k, 6-k]$ geometry. |
| **T2** | Secondary $A_2$-Satellite Contact Alignment | Generation of secondary same-office contact states produced by mapping distance-2 step structures ($I_1$) across $A$-tier construction-edge transitions ($I_2$). |
| **T3** | Office Convergence & Emerging Hub Geometry | Generation of an unambiguous office-convergence assignment and emergent midpoint geometry derived from $A$-tier fifth-position masks ($I_4$) under the window intersection rule $\text{window}(j) \cap \text{window}(j+d) = 7-d$. *Note: Mercury-hub midpoints must emerge as generated output; match evaluation against observed $D_5$ canonical state is deferred strictly to the downstream comparison layer.* |

---

### Negative Controls (NC-1 – NC-4)

Negative controls prove non-vacuity by asserting target-level or check-level rejections prior to running the live derivation engine:

1. **NC-1 (Kernel Perturbation Control):** Substitute symmetric kernel $K = \delta_{-1} + \delta_{+1}$ with an asymmetric variant ($K = \delta_{-2} + \delta_{+1}$). **Expected result:** Engine fails T1 generation check.
2. **NC-2 (Excluded-Input Circularity Intercept):** Inject observed $D_5$ seat rows, $D_5$ run masks, or twin-hub $D_5$ conclusions into runtime input channels. **Expected result:** AST/runtime scanner intercepts circular input; halts with status `invalid` (circularity breach).
3. **NC-3 (Window Invariant Violation):** Shift window geometry definition from $\text{window}(k) = [-k, 6-k]$ to a non-conforming offset. **Expected result:** Engine fails window intersection rule check under T3.
4. **NC-4 (Decoy Mask Injection):** Supply non-$A$-tier anchor or fifth-position masks. **Expected result:** Engine fails T3 office-convergence check.

---

### Result Categories & Disposition Mapping

| Category | Condition (after valid completion) | Disposition |
|---|---|---|
| **derived** | T1 + T2 + T3 all reproduced from authorized inputs $I_1–I_4$ with zero excluded inputs and all controls green. | Supports H1-mechanism route for $D_5$; weakens H3-authorship for $D_5$; H2: no disposition; D4: no disposition (sequence-level only unless covered by a separate ticket). |
| **not_derived** | Valid completion reproduces none or only a proper subset of T1–T3. | Weakens H1-mechanism route for $D_5$; compatible-with-but-not-confirming H3 (*Qualifier: under this strict boundary, failure to derive from first principles reflects derivation difficulty and does not constitute strong positive proof of H3 authorship*); H2: no disposition; no frame enlargement. |
| **incomplete_or_anomalous / invalid** | Missing or stale binding; excluded-input breach; control/fixture failure; timeout; selected-only output. | Recorded as incomplete or invalid with reason; no H disposition; any re-test requires a new boundary registration and new ticket, original preserved as state (rule 8). |

---

### Stop-Points & Halting Conditions

Execution MUST stop immediately with no disposition assigned if:
* Any input file SHA-256 fails to match its registered binding in `MANIFEST.json` (the sole binding authority).
* Any excluded $D_5$ outcome artifact is detected by the import-closure or AST literal scanner (GOV-519 pattern).
* Any negative control fails to reject its target condition (false-positive pass).
* Any floating-point dependency, non-integer arithmetic, or RNG construct is detected.

---

### Definition of Done (DoD)

1. **Boundary & Input Screening:** AST literal scanner and import-closure validator confirm runtime inputs are strictly bounded to $I_1–I_4$ with zero observed $D_5$ data leakage.
2. **Pre-Flight Control Rejection:** All four negative controls (NC-1 through NC-4) pass target-level rejection suite.
3. **Deterministic Single-Pass Execution:** Execution completes using zero-FPU integer logic without heuristic search drift.
4. **Receipt & Report Landing:** Emits `qa/gov-517-d5-derivation-report.json` detailing target match flags (T1, T2, T3), input digest citations, and per-suite ran/skipped status.
5. **Fixed-Point Convergence:** Manifest update and `npm run validate` complete with zero settling cycles and full 418/0 validation pass.
