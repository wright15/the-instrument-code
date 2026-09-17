# Five-Fold CONSTRUCTS Engine Specification

| Field | Value |
|---|---|
| Spec ID | SPEC-FIVEFOLD-CONSTRUCTS-001 `[DEFINED]` |
| Version | 0.2.1; document-only admission with deferrals, subject to the attempt-3 receipt `[DEFINED]` |
| Derivation Status | Historical D5 contact geometry is `derived` under GOV-517; this does not derive the design overlay below. `[DERIVED - provenance/DECISION_LEDGER.md:1686-1692]` |
| Authority | GOV-517 verdict at `provenance/DECISION_LEDGER.md:1686-1692`, with grant-pattern context only at `provenance/DECISION_LEDGER.md:1349`; Maintainer Generative Semantics Registration G1-G5 directive at `qa/gov-517-generative-semantics-registration.json:3-6`, `live_derivation_authorized: true`. `[DERIVED - cited records]` |
| Grant Limitation | No separate numbered GOV-517 instrument was identified in the inspected records; its existence remains an open question, not a global nonexistence claim. Grant 2 is D4-only, not this engine's authority. `[GATED - separate instrument identification]` `[DERIVED - provenance/DECISION_LEDGER.md:2195-2217]` |
| Release Status | Remains gated; no clearance of `STALE_FIVEFOLD_ENGINE_PROMOTION_EVIDENCE` or claim of a green integrated release. `[DEFINED - admission fence]` |
| Provenance - Decisions | `provenance/DECISION_LEDGER.md:1635-1641` (definition freeze), `provenance/DECISION_LEDGER.md:1686-1692` (verdict), and `provenance/DECISION_LEDGER.md:2298-2426` (ENTRY 11 incident and admission boundary). `[DERIVED - cited records]` |
| Provenance - Observations | `provenance/OBSERVATION_LEDGER.md:454-463` (witness counts, coverage and seven-office convergence). `[DERIVED - cited record]` |
| Provenance - Report | `qa/gov-517-canonical-derivation-report.json:338-429` (C_both semantics). `[DERIVED - cited record]` |
| Fencing Class | ENTRY 8 scope, CONSTRUCTS-only; no GOVERNS, topology or runtime authority. `[DEFINED]` |
| Content Digest | External-only; see section 5. No in-document hash. `[DEFINED]` |

## Revision History

`[DEFINED]` Document revision labels below identify this authoring history; the
attempt receipts and ENTRY 11 are the evidence for admission outcomes.

| Version | Change |
|---|---|
| 0.1.0 | Initial draft. Not committed. |
| 0.1.1 | RECALLED, never admitted. Unverified Grant 2, T3 matrix and C_both attributions; invalid self-referential hash. See `qa/specs/fivefold-constructs-001-admission-attempt-1.json`. |
| 0.2.0 | Evidence-class restructure; C_both corrected to dual-route coverage; T3 strong form gated; Q table reopened; external-only digest convention. |
| 0.2.1 | Resolved section 6 gate dispositions per admission-attempt-2 findings: authority citation filled, Q table deferred as authoring-or-extraction debt, T3 strong form demoted. Attempt 3 records admission under ENTRY 11 with historical census-binding limitations disclosed. Current. |

## 0. Scope, Fencing, and Evidence Discipline

### 0.1 Isolation Fences

`[DEFINED]` These six isolation requirements are normative for this document.

1. **CONSTRUCTS-only.** Generative synthesis semantics exclusively. No authority over GOVERNS.
2. **No D4 implication.** Nothing here reopens or bootstraps D4. Its registered `not_derived` outcome is unchanged; it is not a universal non-derivability claim.
3. **No unified operator coverage.** CONSTRUCTS and GOVERNS operator namespaces remain disjoint. No coverage, reduction, or subsumption claim is admitted.
4. **No topology mutation.** No Neo4j data, canonical topology, Court runtime, or schema changes. This is a document-level sidecar, not an executable admission contract.
5. **Phase topology out of scope.** Multi-phase or toroidal work is a separate future candidate and is not admitted here.
6. **No promotion claim.** Presence, registration, or validation of this document does not clear `STALE_FIVEFOLD_ENGINE_PROMOTION_EVIDENCE`. Only a separately authorized refresh, with fresh evidence and the required authorization/sign-off, can establish clearance. Document admission does not imply a green release.

The D4 outcome and its limits are recorded in
`provenance/DECISION_LEDGER.md:2246-2266`.
`[DERIVED - cited record]`

### 0.2 Evidence-Class Tags

`[DEFINED]` The following evidence discipline binds every claim in this document.
A tag on an introductory paragraph applies to its immediately following table
or list unless an item supplies a more specific tag. A claim without an explicit
or enclosing tag is void. A derived tag requires a resolving citation, not an
assertion supplied by a feedback loop.

| Tag | Meaning |
|---|---|
| `[DERIVED - citation]` | A historical ledger/report-backed fact at the scope of that citation; not automatically a fresh execution claim. |
| `[DEFINED]` | Specification-level construct or rule. Confers no derivation status and does not amend registered historical semantics. |
| `[GATED - condition]` | Proposed or unresolved claim. Not admissible as fact until the named evidence gate resolves. |

`[DEFINED]` Deferral is admissible only for `[GATED]` claims. Count drift or a
coverage contradiction in INV-1 through INV-4 is a halt, never a deferral.
The known historical binding incident is disclosed in section 4; accepting a
document with that limitation does not repair or rebind the historical evidence.

## 1. System Overview and Substrate Definition

### 1.1 Substrate

**CONSTRUCTS** is the proposed generative synthesis substrate. The design
consumes elemental inputs and emits witnessed constructions; it does not
occupy offices or execute govern-level transitions. `[DEFINED]`

### 1.2 State Space Input

`[DEFINED]` The proposed elemental overlay is a 4-bit state space:

```text
b = (b3, b2, b1, b0)     |state space| = 2^4 = 16
```

`[DEFINED]` The labels in this table belong to the design overlay, not a claim
that the historical GOV-517 input registration contains these elemental bits.

| Bit | Overlay Input | Element |
|---|---|---|
| b3 | I1 | Fire |
| b2 | I2 | Air |
| b1 | I3 | Water |
| b0 | I4 | Earth |

Historically, GOV-517 I1 registers distance-2 pair structures, I2 registers
A-tier CONSTRUCTS transitions, I3 is empty and consumed by no target, and I4
uses the A-tier anchor slice of ledger/census sources. These meanings are not
redefined by the overlay.
`[DERIVED - qa/gov-517-input-boundary-registration.json:31-61]`

An evidence-backed mapping between the elemental overlay and those registered
inputs is not established here. `[GATED - separately evidenced mapping]`

### 1.3 Dynamic Operator - Quintessence

**Quintessence (Q)** is the proposed five-fold kinetic operator: the fifth
element as dynamics, not an additional state bit. Its type contract is
`Q : Z12 -> (16 states -> 16 states)`, closed on the defined substrate.
`[DEFINED]`

The concrete Z12-indexed transition table is **authoring-or-extraction debt**.
The inspected GOV-517 report does not establish that table; its registered
coordinates are Z7 offices and its Z12 use is mask-bit traversal. No existing
Court-state artifact is treated as a GOV-517 mapping by analogy.
`[GATED - locate and bind an admissible table, or authorize new authoring]`

The coordinate and mask-traversal registration is at
`qa/gov-517-generative-semantics-registration.json:39-59`.
`[DERIVED - cited record]`

`[DEFINED]` INV-5 remains deferred. If an existing admissible table can be
extracted, its provenance and closure checks must be recorded. If it must be
authored, that is new design/derivation work with its own authorization and
evidence trail, not mere reproducibility work. This affects the timeline for
claiming an executable Q-based engine; this document does not claim one exists.

## 2. Mathematical Mechanics

### 2.1 Harmonic Alignment

`[DEFINED]` This section specifies an internally checkable mathematical
construction, not a claim that GOV-517 derived the elemental overlay.

Pentatonic generation stacks four fifths, yielding five distinct tones in Z12.
The generator is `g = 7` semitones; `t_k = (7k) mod 12`, for `k = 0..4`, gives
`{0, 7, 2, 9, 4}` (C, G, D, A, E).

**Lemma (collision-freeness).** `gcd(7, 12) = 1`, so the generator has full
order 12 in Z12. Any five-element window of its orbit is collision-free.

**Completion versus closure.** These are different events:

| Event | Generator Step | Statement |
|---|---|---|
| Generative completion | k = 4 | Five distinct tones are present. |
| Generator closure | k = 12 | `12 * 7 = 84 = 0 (mod 12)`; the orbit returns to origin. |
| Pythagorean comma | k = 12 | `(3/2)^12 / 2^7`, approximately 1.01364 or 23.46 cents. |

A pure fifth is approximately 701.955 cents, versus 700 cents in 12-TET:
approximately 1.955 cents drift per step. At k = 4 the accumulated drift is
approximately 7.82 cents, below the full-comma horizon at k = 12. The five-tone
window completes before that horizon; drift does not first start at k = 12.
Pure-ratio drift and modular 12-TET closure must not be conflated.

### 2.2 Generative Operators (G1-G5)

`[DEFINED]` The proposed construct-level role overlay is retained below.
These are design roles, not the registered GOV-517 G1-G5 implementation
contracts. Shared labels confer no evidence that the overlays are equivalent.

| Overlay Operator | Role | Proposed Contract |
|---|---|---|
| G1 | Edge synthesis | Consumes overlay I1 (Fire); emits witness pairs. |
| G2 | Edge synthesis | Consumes overlay I2 (Air); emits witness pairs. |
| G3 | Office pairing | With G4, proposes ten generative channels for T1. |
| G4 | Office pairing | With G3, proposes ten generative channels for T1. |
| G5 | Seam integration | Combines T1 and T2 witness pools into a coverage surface. |

`[DEFINED]` Witnessed pairs are the proposed atomic evidence unit. The
correspondence of this overlay to the registered engine, including input
bindings, is `[GATED - explicit correspondence evidence at a future authorized
registration]`; this table must not be used to rewrite historical execution.

For the historical result, G1 defines ordered candidate enumeration; G2 is the
T1 symmetric office-pair/mask predicate; G3 is T2 construction-edge traversal;
G4 is convergence of the two routes; G5 classifies canonical rows strictly
after sealing. Those registered meanings govern section 3's evidence.
`[DERIVED - qa/gov-517-generative-semantics-registration.json:7-37]`

## 3. Coverage Mechanics and Verification Invariants

### 3.1 Coverage Table

`[DERIVED - provenance/OBSERVATION_LEDGER.md:454-463]` The following are
historical GOV-517 results at canonical D5 contact office-coordinate resolution.
The rows T1 and T2 are two witness routes, not D4 and D5 coverage tiers.

| Target | Witness Class | Witness Count | Observed Coverage |
|---|---|---|---|
| T1 | Office-pair witnesses | 10 | 14/14 canonical D5 contacts |
| T2 | Construction-edge witnesses | 28 | 14/14 canonical D5 contacts |
| T3 | Office-convergence assignment | Seven office keys | Convergence at seven offices |

`C(5,2) = 10` and `28 = 2 * 14` are arithmetic identities. They do not prove
that T1 enumerates pairs of five voices or that each canonical contact owns
exactly two distinct T2 witnesses. `[DEFINED - arithmetic interpretation limit]`

**C_both semantics (corrected).** `C_both = 14` means every observed contact
is reached by both T1 and T2 at office-coordinate resolution. It is not a
both-direction census. The 0.1.1 `2 * 7` explanation is retracted.
`[DERIVED - qa/gov-517-canonical-derivation-report.json:338-429]`

T3 is materialized as an office-to-pair-structures assignment and midpoint
list, not the proposed purity matrix.
`[DERIVED - qa/gov-517-canonical-derivation-report.json:74-113]`

`[DEFINED]` The stronger T3 claims are demoted to section 6. Neither a
seven-offices/seven-governors numerical analogy nor a display matrix upgrades
them to historical derivation facts.

### 3.2 Machine-Checkable Invariants

- **INV-1 (exact witness counts):** `|T1| = 10`, `|T2| = 28`. `[DERIVED - qa/gov-517-canonical-derivation-report.json:309-318]`
- **INV-2 (per-route coverage):** T1 covers 14/14 contacts and T2 covers 14/14. `[DERIVED - provenance/OBSERVATION_LEDGER.md:454-463]`
- **INV-3 (convergence):** convergence at seven offices. `[DERIVED - qa/gov-517-canonical-derivation-report.json:74-113]`
- **INV-3b (strong form):** a 7-by-7 diagonal matrix with zero off-cell leakage is not admitted as fact. `[GATED - matrix artifact and scope-specific verification]`
- **INV-4 (target yield):** `C_both = 14`, dual-route coverage of all observed contacts. `[DERIVED - qa/gov-517-canonical-derivation-report.json:338-429]`
- **INV-5 (Q closure):** every Q transition maps the 16-state substrate into itself, indexed by Z12. `[DEFINED - type contract]` `[GATED - concrete table and closure evidence]`

`[DEFINED]` INV-1, INV-2, INV-3 and INV-4 are the historical admission surface.
Exact agreement with the sealed report is required; receipt inspection is not
a fresh G1-G5 run. INV-3b and INV-5 join an evidence-backed surface only after
their gates resolve. Count drift or a coverage gap is a finding and a halt,
not a reason to relax values or reinterpret the result.

## 4. Technical Debt and Release Gating

### 4.1 Current Gate and Historical Binding Incident

`[DEFINED]` The release gate remains:

```text
STALE_FIVEFOLD_ENGINE_PROMOTION_EVIDENCE
```

The GOV-517 input registration and sealed report carry the same census pin,
but the corresponding committed census bytes do not reproduce it. ENTRY 11
records the local recovery limits, provenance-only changes in the inspected
snapshots, four unsuccessful serialization probes, and the load-bearing nature
of that historical input registration.
`[DERIVED - provenance/DECISION_LEDGER.md:2320-2390]`

`[DEFINED]` The historical `derived` result is cited with that limitation, not
relabeled as current execution evidence. The known mismatch is not silently
repaired, and document admission does not waive the later registration and
refresh obligations. The expected `STALE_TWIN_HUB_CONVERGENCE` validation stop
is recorded release state, not an admission blocker under ENTRY 11. New
unexplained binding or derived-surface mismatches still halt admission.

The document-only admission rule is recorded in
`provenance/DECISION_LEDGER.md:2408-2426`.
`[DERIVED - cited record]`

### 4.2 Later Refresh Procedure

`[DEFINED]` This section describes a later, separately authorized work item.
It is not an execution grant and does not authorize changes during R2.
Re-registration and Q authoring, if required, are not mere reproducibility;
they must be distinguished from re-execution of an unchanged admitted recipe.

1. Resolve the refresh's execution context, new boundary/ticket and forward input-registration record. GOV-517 re-registration is mandatory and folded into this ceremony, not a standalone R2 execution. Preserve all historical registrations and receipts.
2. Before any shared-artifact refresh, preserve D4-bound twin-hub evidence under ENTRY 10's deferral authority. Establish resolvable historical bindings rather than rewriting old evidence to match new live paths.
3. Resolve Q's authoring-or-extraction debt under its own appropriate evidence trail before claiming an executable Q-based engine. T3's strong form remains an open question unless explicitly evidenced.
4. Under fresh authorization, execute the registered G1-G5 semantics against reconciled inputs. Seal generation before downstream canonical comparison. Do not substitute the section 2.2 design overlay for historical registered semantics.
5. Recompute counts and assert INV-1 through INV-4 exactly; assert INV-3b/INV-5 only if their evidence gates have resolved. Count drift requires a new observation-ledger finding, never a silent fix or favorable reclassification.
6. Re-execute applicable preflight checks without modifying controls or tests; generate new evidence receipts under the authorized procedure. Complete the permitted ledger-to-sidecar freshness cascade only after historical preservation requirements are met.
7. Append the refresh record and register its evidence in MANIFEST and CHECKSUMS. Clear a promotion gate only through its actual checks and required sign-off; open a green release only if all applicable release gates pass.

The ratified deferral and preservation boundary is recorded at
`provenance/DECISION_LEDGER.md:2392-2406` and
`qa/d4-production-landing.json:67-77`.
`[DERIVED - cited records]`

### 4.3 Do-Not-Touch Boundary

`[DEFINED]` R2 does not modify existing test suites, preflight controls, D4
evidence logs, canonical data, schemas, Court runtime, Neo4j projection, or
shared freshness artifacts. D4 preservation is a precondition recorded now,
not work executed now. A later refresh must obtain explicit scope for any
shared sidecar writes; this document is not that permission.

## 5. Content Digest Convention

`[DEFINED]` Integrity is external-only for this document:

- Root `CHECKSUMS.sha256` carries the SHA-256 of the exact file bytes.
- Root `MANIFEST.json` registers the path, byte length and digest through the existing inventory process.
- This document contains no self-referential hash. A future normalized-content policy must be defined once in the integrity layer under separate authorization, not improvised per artifact.
- The proposed evidence-binding convention is a separate work item. No six-rule candidate is drafted, adopted, or registered by this specification or R2.

## 6. Open Questions and Deferred Claims

1. **Separate numbered GOV-517 authority:** positive verdict and registration authority are cited in the header. A separate numbered grant was not identified in the inspected records; global absence is not asserted. `[GATED - instrument identification]`
2. **Q table:** the Z12-indexed 16-state table remains authoring-or-extraction debt, with INV-5 deferred and a real design task if no admissible artifact can be extracted. `[GATED - table and evidence trail]`
3. **T3 strong form:** the 7-by-7 matrix, zero leakage, exactly-once convergence per direction and governor-channel attribution are not established by seven-office convergence. They remain open, not part of the admitted derived surface. `[GATED - explicit scoped evidence]`
4. **Overlay correspondence:** elemental I1-I4 and section 2.2's design roles have no admitted identity mapping to registered GOV-517 semantics. `[GATED - independent correspondence evidence]`

`[DEFINED]` These deferrals permit admission of a bounded specification, not
promotion of the unresolved claims. Historical input re-registration remains
mandatory at the later refresh even though the document can be admitted now.

## 7. Agent Execution Checklist

`[DEFINED]` The attempt-3 receipt records actual results for these steps; this
checklist is not itself evidence that they ran.

- **7.1 Preserve failure and forensic evidence.** Retain attempt 1 byte-for-byte, retain attempt 2, and register the R1 memo and eleven annexes under `qa/specs/` before a new decision entry cites them.
- **7.2 Resolve gate dispositions and record findings.** Verify source authority; defer Q as authoring-or-extraction debt; demote the T3 strong form. Embed static generator findings, four hash-probe results, timeline and D4-preservation requirements in one self-contained incident entry before attempt 3.
- **7.3 Write the resolved document.** Use `docs/specs/fivefold_constructs_engine_spec.md`, version 0.2.1, without an embedded digest.
- **7.4 Register and cross-check.** Bind exact bytes in MANIFEST and CHECKSUMS; verify every cited range against its source and recheck the pre-existing ledger anchors after the append. Preserve and disclose historical pin mismatches rather than rebinding them.
- **7.5 Validate at the approved scope.** Require green manifest freshness, resolving citations and exact historical INV-1 through INV-4 checks. Run full `npm run validate`; record the expected `STALE_TWIN_HUB_CONVERGENCE` failure without refreshing shared artifacts or claiming a green release. Unexpected failures must be surfaced, not treated as the approved exception.
- **7.6 Confirm isolation.** Verify the do-not-touch boundary and preserve prior evidence. Register `qa/specs/fivefold-constructs-001-admission-attempt-3.json` with the actual admission disposition and final checks.

`[DEFINED]` The fail-loud rule is unchanged for new mismatches or contradictions
in the derived surface. The explicit historical incident and honestly tagged
deferred claims are not silently reinterpreted into fresh execution evidence.
