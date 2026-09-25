# Fivefold Court Engagement Correspondence — Candidate Record

| Field | Value |
|---|---|
| Artifact ID | `SPEC-FIVEFOLD-COURT-CORRESPONDENCE-001` `[DEFINED]` |
| Version | 0.1.1 `[DEFINED]` |
| Status | Admitted; the authority for that status is the admission ledger entry (ENTRY 13) and compliance receipt (`qa/specs/bl-011-correspondence-admission.json`), not this header. `[DEFINED]` |
| Claim Class | Canonical admission, TIERING claim-catalog class 2 (`docs/TIERING.md:18-20`) `[DERIVED - docs/TIERING.md:12-25]` |
| Work Item | `GOV-522` (verified next-free at execution). Artifact ID `SPEC-FIVEFOLD-COURT-CORRESPONDENCE-001` is distinct from the ticket ID. `[DEFINED]` |
| Authority | Authority flows from the admission ledger entry (ENTRY 13) and the compliance receipt; this document grants nothing by its own text. `[DEFINED]` |
| Release Status | No gate is cleared and no green integrated release is claimed. `[DEFINED]` |
| Provenance | Adjudication `scrum/plan/fivefold-mesh-adjudication.md` (A1, A2); ceremony plan `scrum/plan/bl-011-ceremony-plan.md`; spec context `scrum/plan/fivefold-mesh-spec-v3.md` §1b `[DERIVED - cited sprint records]` |
| Fencing Class | Document-only. No GOVERNS, runtime, topology, Court-runtime, graph, policy, or promotion authority. `[DEFINED]` |
| Content Digest | External-only; no in-document self-hash. `[DEFINED]` |

## Revision History

`[DEFINED]` Version labels identify candidate text, not an assertion of completed admission.

| Version | Change |
|---|---|
| 0.1.0 | Initial candidate for maintainer §6 review. Any admission-time correction bumps the version with a row; the reviewed-baseline digest and the authorized delta are recorded in the receipt (ENTRY 12 precedent). |
| 0.1.1 | Admission-time status propagation: header rows resolved to admitted-by-ledger-reference; §1.1 tag annotated; §5 converted from status to causal form. Claim text unchanged from reviewed v0.1.0. |

## 0. Scope, Fencing, and Evidence Discipline

### 0.1 Claim boundary

`[DEFINED]` This record proposes a single canonical identification between two admitted
structures: the Quintessence (Q) overlay substrate's engagement configurations and the
admitted Court registry positions. It does not restate, amend, or re-derive either
structure; it asserts that they are the same object family at the levels named in §1.

### 0.2 Evidence-class tags

`[DEFINED]` The convention tags apply: `[DERIVED - citation]` for facts supported at the
cited record's scope, `[DEFINED]` for constructs and rules with no prior admission, and
`[GATED - condition]` for the unresolved admission itself. An untagged claim is void.

### 0.3 Non-effects

`[DEFINED]` Admission of this claim would not change runtime behavior, canonical topology,
schemas, Court runtime, Neo4j projection, policy, or any file's admission status other than
this record and its declared consequence updates. No `poleDisposition` field is written;
no GOV-517 re-registration occurs; no shared artifact is refreshed.

## 1. The Claim

### 1.1 Identification

`[DEFINED — admission proposed]` (admitted per ENTRY 13) The Q substrate's engagement
states and the admitted Court registry positions are the same object family,
**engagement-Cn = position-Cn**, exact at three levels:

1. **Vector equality.** The ascending registry vectors `0000`, `1000`, `1100`, `1110`,
   `1111` with `internalPoles` lists of cardinality 0 through 4 equal the Q substrate's
   engagement configurations built from `src/fivefold/quintessence.py:47-55` under the
   canon MSB-first bit order (b3 Mars/Fire, b2 Jupiter/Air, b1 Venus/Water, b0
   Saturn/Earth). `[DERIVED - registry lines and canon bit-order citations in §3.1]`
2. **Mask equality.** Each position's pitch-class mask is the keep-or-sharpen chain at that
   engagement: External keeps the fifth-stack degree; Internal sharpens it to the
   semitone-raised neighbor. The chain runs `{0,2,4,7,9}` -> `{0,3,5,8,10}` across C0-C4.
   `[DERIVED - registry lines and canon citations in §3.1]`
3. **Derived element-to-degree mapping, zero free choices.** Fire/Mars <-> 4->5 (C0->C1),
   Air/Jupiter <-> 9->10 (C1->C2), Water/Venus <-> 2->3 (C2->C3), Earth/Saturn <-> 7->8
   (C3->C4), forced by the canon internalization order and the disjoint Court-transition
   supports. `[DERIVED - canon citations in §3.1]`

### 1.2 Machine check

`[DERIVED - cited sprint record]` The claim's core is pinned by
`tests/test_court_engagement_correspondence.py`: registry order, vector equality against
independently built substrate configurations, internal-pole vectors, the five masks, the
forced degree mappings, support disjointness and union, the rejected-polarity negative, and
the origin-window equality. The verifying run is recorded in the receipt at admission.

### 1.3 Rejected alternative, recorded with reason

`[HYPOTHESIS — rejected as a registry claim]` Internal = keep the stack degree (1111 =
pure stack = Major Pentatonic; 0000 = sharpened minor pentatonic). Reason: it contradicts
the admitted registry pairing and the disjoint supports `{4,5}`, `{9,10}`, `{2,3}`,
`{7,8}`, and was adjudicated as a layer confusion in
`scrum/plan/bl-044-court-voicing-audit.md:59-72`. It survives only as the Orrery bucket
overlay's labeled counterfactual experiment, which this claim does not assert.
`[DERIVED - scrum/plan/fivefold-mesh-adjudication.md A1]`

## 2. Scope Exclusions (binding)

`[DEFINED]`

- **Not SPEC-001 §6(4).** The overlay-to-GOV-517 input-lane correspondence (I1 distance-2
  pairs, I2 A-tier CONSTRUCTS transitions, I3 empty, I4 A-tier masks,
  `docs/specs/fivefold_constructs_engine_spec.md:287-296`) remains entirely unevidenced and
  separately open. This claim resolves nothing about it.
- **Configuration identification only.** The sequence of engagement states under Q₁
  (orbit order `0000 -> 0111 -> 0010 -> ...`) bears no asserted relationship to the Court's
  register moves (`C0 -> C1 -> C2 -> C3 -> C4` as a progression): the orbit is a
  fifth-stack circuit, the register an accumulation ladder — shared states, not
  trajectories.
- **Five canonical positions only.** The eleven off-chain 4-bit configurations remain
  unlabeled and out of scope; canon requires an explicit modal-mixture or mutation rule for
  them (`framework/AGENTS.md:310`).
- **No per-domain element semantics** beyond the derived degree mapping.
- **No INV-5 graduation, no D4/D7 implication, no promotion or green-release claim.**
- **Document-only.** No runtime, schema, Court runtime, canonical topology, graph, or
  policy effect; no `poleDisposition` writes; no GOV-517 re-registration; no shared-artifact
  refresh (D4-bound evidence preservation remains untouched).

## 3. Evidence

### 3.1 Constituent facts

| Fact | Citation | Class |
|---|---|---|
| Registry pairing and masks | `seven-governors-court-substrate-v0.1.0/canonical/court-rooted-positions.json` (records C0-C4, lines 3-203; vectors :28, :65, :106, :148, :191) (field-level citations: the §3.2 JSON Pointers are canonical; line ranges are human locators) | admitted |
| Field-for-field certification | `scrum/plan/bl-044-court-voicing-audit.md:15-21` | sprint certificate |
| Canon bit order and degree skeleton | `framework/AGENTS.md:279-283,285-298`; `framework/TOPOLOGICAL_ANCHORING.md:90-96,162-184`; `src/fivefold/quintessence.py:47-55`; `tests/test_fivefold_q_table.py::test_bit_order_pinned_to_canon` | admitted |
| Disjoint supports and `2I_4` geometry | `framework/AGENTS.md:293-302`; `framework/TOPOLOGICAL_ANCHORING.md:162-184`; registry `xorSupportFromPrevious` | admitted |
| Q completion window | `docs/specs/fivefold_constructs_engine_spec.md:130-149`; `src/fivefold/quintessence.py:37-41` | admitted |
| Display names and brightness ordinal (proposed map; ordinal semantics OPEN) | `schemas/elemental_pentatonic_scale_map_v1.0.0.yaml:95-218` | proposed |
| Adjudication findings A1/A2 | `scrum/plan/fivefold-mesh-adjudication.md` | sprint record |
| Machine check | `tests/test_court_engagement_correspondence.py` | sprint record |

### 3.2 Pointer citations (first live use of the convention JSON-Pointer rule)

`[DEFINED]` Per `provenance/EVIDENCE_BINDING_CONVENTION.md` §1.1, field-level citations use
RFC 6901 JSON Pointers against the registry, for claim resolution rather than byte identity:

- Vectors: `/courtRootedPositions/0/poleRegister/vector` through
  `/courtRootedPositions/4/poleRegister/vector`
- Masks: `/courtRootedPositions/0/pitchClasses` through `/courtRootedPositions/4/pitchClasses`

`[DEFINED]` The pointers are verified against the staged bytes pre-commit, in the same
admission step that verifies line-range citations, so the admission claim covers pointer
resolution as well as line-range resolution. Byte identity is carried separately by an R1
whole-file binding (recipe, digest, byte length, subject blob OID) over
`court-rooted-positions.json`; no span binding is instantiated, and the decision ledger is
cited by entry identity (ENTRY 12 pattern).

### 3.3 Binding and registration plan (R1/R2/R6)

`[DEFINED]` At admission: R1-bind the candidate, receipt, and machine-check records with
`recipe`, `digest`, and `byteLength`; record blob OIDs pre-commit; cite the decision ledger
by entry identity. R6 note: this candidate's declared consequence updates — comprehension
map §1.5 and `scrum/plan/fivefold-mesh-spec-v3.md` §1b retags — land in the same atomic
commit, and their pre-admission states are recoverable from the parent commit. Historical
evidence and prior line anchors are untouched.

## 4. Admission Checklist (later execution; not completed here)

`[DEFINED]` Modeled on ENTRY 12 and the convention's admission discipline:

1. Maintainer end-to-end review of this candidate; any correction bumps the version and is
   recorded in the receipt as a reviewed-baseline delta.
2. Allocate the next free GOV-52X as work item; keep it distinct from the artifact ID.
3. Compute R1 bindings and blob OIDs on staged bytes; verify every line range and JSON
   Pointer against those bytes.
4. Create the compliance receipt under `qa/specs/` with per-rule R1-R6 status and the
   observed-versus-declared split.
5. Append ENTRY 13 (append-only); land the candidate status, the receipt, the inventories,
   and the declared status-propagation edits in one atomic commit.
6. Run full validation; record the observed first stop and the predeclared allowed stale
   gates; do not refresh to force green; claim no release promotion.
7. Verify post-commit R1 reproducibility of the bound bytes.

## 5. Review Boundary

`[DEFINED]` This document becomes admitted, registered evidence only through the §4
execution — the atomic landing that creates its compliance receipt and appends ENTRY 13.
Nothing else admits it. Before that landing it is a candidate with no effect.
