# Phase-Extended Topology — Candidate Record

| Field | Value |
|---|---|
| Artifact ID | `SPEC-PHASE-EXTENDED-TOPOLOGY-001` `[DEFINED]` |
| Version | 0.1.1 `[DEFINED]` |
| Status | Admitted; the authority for that status is the admission ledger entry (ENTRY 14) and compliance receipt (`qa/specs/bl-032-phase-topology-admission.json`), not this header. `[DEFINED]` |
| Claim Class | Canonical admission, TIERING claim-catalog class 2 (`docs/TIERING.md:18-20`) `[DERIVED - docs/TIERING.md:11-24]` |
| Work Item | `GOV-523` (verified next-free at execution). Artifact ID `SPEC-PHASE-EXTENDED-TOPOLOGY-001` is distinct from the ticket ID. `[DEFINED]` |
| Authority | None by this text; this candidate grants nothing. `[DEFINED]` |
| Release Status | No gate is cleared and no green integrated release is claimed. `[DEFINED]` |
| Provenance | Phase A findings memo `scrum/plan/bl-031-phaseA-findings-memo.md`; probe artifact `orrery/src/generated/phase-a-probe.v1.json`; independent validator `orrery/scripts/validate-phase-a-probe.mjs`; test pins `orrery/src/phase-a-probe.test.ts`; motivation memos BL-029, BL-035, and BL-031 Phase 2. `[DERIVED - cited sprint records]` |
| Charter | SPEC-001 fence #5 (`docs/specs/fivefold_constructs_engine_spec.md:33-40`; `docs/TIERING.md:48-49`); BACKLOG BL-031–BL-033 (`scrum/BACKLOG.md:338-446`). This record does not amend SPEC-001. `[DERIVED - cited records]` |
| Fencing Class | Candidate record only. No GOVERNS, runtime, topology-effect, Court-runtime, graph, policy, or promotion authority. `[DEFINED]` |
| Content Digest | External-only; no in-document self-hash. `[DEFINED]` |

## Revision History

`[DEFINED]` Version labels identify candidate text, not an assertion of completed admission.

| Version | Change |
|---|---|
| 0.1.0 | Initial candidate for maintainer §6 review. Any admission-time correction bumps the version with a row; the reviewed-baseline digest and the authorized delta are recorded in the receipt (ENTRY 12 precedent). |
| 0.1.1 | Admission-time corrections: header Version resolved to 0.1.1; header Status resolved to admitted-by-ledger-reference; header Work Item resolved to verified-next-free; §1.1 tag annotated (admitted per ENTRY 14); §5 converted from prospective to causal form and ENTRY 14 named; evidence-table locator precision corrected against staged bytes (`docs/TIERING.md`, `harmonic-comprehension-map.md` §2.6, `scrum/BACKLOG.md`, and three phase-A memo ranges); this row added. Claim text unchanged from reviewed v0.1.0. |

## 0. Scope, Fencing, and Evidence Discipline

### 0.1 Claim boundary

`[DEFINED]` This record proposes the admission of one bounded object: the phase-extended
topology machinery as a candidate record. It does not restate, amend, or re-derive the
anchored universes; it asserts that the landed Phase A probe evidence supports the
machinery's candidacy and nothing further.

### 0.2 Evidence-class tags

`[DEFINED]` The convention tags apply: `[DERIVED - citation]` for facts supported at the
cited record's scope, `[DEFINED]` for constructs and rules with no prior admission, and
`[GATED - condition]` for the unresolved admission itself. An untagged claim is void.

### 0.3 Non-effects

`[DEFINED]` Admission of this claim would not change runtime behavior, canonical topology,
schemas, Court runtime, Neo4j projection, graph, or policy, and would not move G1. It would
not derive any govern, would not dissolve the boundary wall, and would not assign
directional semantics. It would not amend SPEC-001, clear a release gate, or refresh any
shared artifact; D4-bound evidence preservation remains untouched.

## 1. The Claim

### 1.1 Claim statement

`[DEFINED — admission proposed]` (admitted per ENTRY 14) The claim, verbatim: that the phase-extended topology
machinery — the covering-pair lift of the anchored universes (5,544 heptatonic + 3,960
pentatonic pairs over 792+792 concrete sets, uniform multiplicity 7/5), with
phase-equivariant operator semantics (40,824/40,824 commutation, zero rooting-dependent
witnesses, R1/L1 phase-carry ±1) and a completed seam census (two edge families, radius-1
confirmed, mirror relation confirmed) — is admitted as a candidate record: available for
dependent work (Phase C governs probes), explicitly not canon, explicitly not a claim that
boundary governs now derive.

### 1.2 Machine checks

`[DERIVED - cited sprint records]` The claim's numbers are pinned by
`orrery/src/phase-a-probe.test.ts` (12 pins: scope, P0 receipt, sweep, strata, families A/B,
mirror verdict, specs, fences) and independently re-derived by
`orrery/scripts/validate-phase-a-probe.mjs`; the artifact is emitted by
`scripts/build-phase-a-probe.mjs` and gated by `scripts/verify-phase-a-proposals.mjs`. The
verifying run is recorded in the admission receipt. The artifact is `status:
planning_evidence`, byte-stable, fingerprint
`c8271c20a7aaf23c8f25fbe12d849854eb02ffbfd6fa24fb3f091b15970b87ac`.

### 1.3 Rejected alternatives, recorded with reason

`[HYPOTHESIS — rejected]` Five alternatives were weighed; each is rejected with its reason:

- **(a) Bare-pc-set quotient (792 collapse).** Read the lift as the 792 concrete sets,
  discarding phase. Rejected: the lift is 7-fold redundant in concrete pc-set terms and
  exactly non-redundant in (anchored-form, phase) terms; the redundancy is the phase
  information. `[DERIVED - orrery/src/generated/phase-a-probe.v1.json#/p0Verification/claims/0]`
- **(b) Single-phase seam closure.** Read the seam set as closable without the lift.
  Rejected: mode-tonic representatives sit at phase distance ±1; the minimum 0 is carried
  by same-phase common-tone representatives, which do not connect the tonics.
  `[DERIVED - orrery/src/generated/phase-a-probe.v1.json#/p3SeamCensus/modalSeamCensus]`
- **(c) Mirror-denial (canonical only).** Read the mirror relation as absent. Rejected:
  12/12 mirror readings measured, with the L-ring realization inventoried.
  `[DERIVED - orrery/src/generated/phase-a-probe.v1.json#/p3SeamCensus/modalSeamCensus]`
- **(d) Wall-dissolved reading.** Read the phase machinery as dissolving the BL-029
  boundary wall. Rejected: zero D–D fixed-degree applications at every phase; the wall
  stands and dissolution is Phase C's question.
  `[DERIVED - orrery/src/generated/phase-a-probe.v1.json#/p5BoundaryLayer]`
- **(e) Phase-as-annotation.** Carry phase as metadata on the 462 anchored nodes rather
  than as distinct lifted nodes. Rejected: it collapses 5,544 back to 462 and destroys
  exactly the structure the seam census measured — the 5,040 lifted Family-A edges, the
  per-phase D-cycle families, and the patch's 2,376 nodes do not exist in an annotation
  reading; the alternative field would reduce the lift to a comment.
  `[DERIVED - orrery/src/generated/phase-a-probe.v1.json#/p1PhaseCoordinate, #/p3SeamCensus/familyA, #/p5BoundaryLayer, #/p6MinimalPatch]`

## 2. Scope Exclusions (binding)

`[DEFINED]`

- **No governs verdicts.** D4's registered `not_derived` outcome is unchanged
  (`provenance/DECISION_LEDGER.md:2195-2252`); D7 has no derivation record beyond
  transition labels (`neo4j/csv/governs.csv`). The governs retry is Phase C, gated on this
  admission.
- **The wall stands.** The boundary wall is not dissolved and no boundary-traversal claim
  is made: zero D–D fixed-degree applications exist at every phase.
- **No G1 movement.** No intra-330 edge is assumed, emitted, or consumed; G1 remains
  BL-024's decision.
- **No directional-semantics assignment.** The BL-035 negative result is carried; no
  Earth-ward/Fire-ward or pole value is assigned. The eleven off-chain 4-bit
  configurations remain unlabeled.
- **Candidate status only.** This record never claims admitted topology, runtime, or
  canonical effect. It is not canon.
- **Membrane.** The being/becoming frame (`scrum/plan/harmonic-comprehension-map.md:138-245`)
  and the polarity synthesis (`:247-343`) are interpretation vocabulary, cited here as
  motivation; they are never design inputs and confer no authority.
- **Session prose is context, not evidence.** Every load-bearing claim cites a landed
  artifact.

## 3. Evidence

### 3.1 Constituent facts

| Fact | Citation | Class |
|---|---|---|
| Lift arithmetic 5,544 / 3,960 / 9,504; covering multiplicity 7/5 over 792+792 concrete sets; C(12,7) = C(12,5) = 792 | `orrery/src/generated/phase-a-probe.v1.json#/p0Verification/claims/0`, `#/p1PhaseCoordinate/covering`; `scripts/verify-phase-a-proposals.mjs`; `scrum/plan/bl-031-phaseA-findings-memo.md:27-39` | planning evidence (P0 PASS) |
| Freeness: 8,712 anchored + 17,424 distinct-set checks, zero counterexamples | `...phase-a-probe.v1.json#/p0Verification/claims/1`; memo `:27-35` | planning evidence (P0 PASS) |
| Rooting: 792 rooted records, no ambiguity, root unique in set | `...phase-a-probe.v1.json#/p0Verification/claims/2`; memo `:41-50` | planning evidence (P0 PASS) |
| Equivariance: 3,402 applications × 12 phases = 40,824 checks, zero failures; calibration EXACT; strata 1,145/1,990/267; carries R1 +1, L1 −1, other 13 = 0; zero rooting-dependent witnesses | `...phase-a-probe.v1.json#/p2Equivariance/sweep`, `#/p2Equivariance/calibration`, `#/p2Equivariance/perOperator`, `#/p2Equivariance/strata`; memo `:52-65`; pins `orrery/src/phase-a-probe.test.ts:51-86` | planning evidence (P2 PASS) |
| Seam Family A: 420 R1/L1 applications → 5,040 lifted edges, raised 2,520 / lowered 2,520; intra-family 2; cross-family 418; canonical edge `R1:2773:1387` + inverse | `...phase-a-probe.v1.json#/p3SeamCensus/familyA`, `#/p3SeamCensus/histogram`; memo `:69-72`; pins `:88-99` | planning evidence (P3 PASS) |
| Seam Family B: 42 shared-subnode pairs / 90 crossings (30×1 + 12×5), phase distance 0; Andalusian ground truth reproduced (`5-20:0B`, `5-23:0`, `5-25:0`, `5-27:0`, `5-29:0B`; admitted bridges `5-23:0`/`5-27:0`) | `...phase-a-probe.v1.json#/p3SeamCensus/familyB`; memo `:74-80`; pins `:101-109` | planning evidence (P3 PASS) |
| Modal census: 12 collections × 7 representatives; 12 canonical + 12 mirror readings; mirror CONFIRMED; mode-tonic representatives at ±1; minimum representative phase distance 0; radius-1 verdict PASS | `...phase-a-probe.v1.json#/p3SeamCensus/modalSeamCensus`, `#/p3SeamCensus/radiusOneVerdict`; memo `:82-103`; pins `:111-137` | planning evidence (P3 PASS) |
| Pre-registration refinement (carried explicitly): the planning pass pre-registered the minimum representative phase distance as ±1; the build measured the true minimum as 0 (same-phase common-tone representatives) with ±1 at the mode-tonic representatives — a strengthening discovered in flight, recorded rather than silently substituted | `...phase-a-probe.v1.json#/p3SeamCensus/modalSeamCensus/readingRefinement`; memo `:166-170` | planning evidence (refinement note) |
| Lift architecture P4: node identity `{anchoredId}@{phase}`; fiberwise same-phase containment (6,930 anchored → 83,160 lifted pairs per direction); operator edges lift by equivariance; no cross-phase containment; G1 untouched | `...phase-a-probe.v1.json#/p4LiftArchitecture`; memo `:107-110`; pins `:139-145` | design spec (conditional on PASS) |
| Boundary layer P5: 66 anchored modal cycles → 66 phase-indexed families (5,544 = 66×7×12); 49 D-anchors M-closed; zero D–D fixed-degree at every phase; wall stands; dissolution not attempted | `...phase-a-probe.v1.json#/p5BoundaryLayer`; memo `:111-116`; pins `:147-158` | design spec (conditional on PASS) |
| Minimal patch P6: phases {11, 0, 1}; 1,386 heptatonic + 990 pentatonic = 2,376 lifted nodes; fixtures canonical `C Lydian ↔ C# Locrian`, `B Lydian ↔ C Locrian`, mirror `B Lydian ↔ A# Locrian`, `C Lydian ↔ B Locrian`; sufficiency PASS, no fourth phase | `...phase-a-probe.v1.json#/p6MinimalPatch`; memo `:117-121`; pins `:160-170` | design spec (conditional on PASS) |
| Source bindings (five pinned inputs) | `...phase-a-probe.v1.json#/sourceBindings`: `canonical/universal-network-data.json` `21e2a632…`, `canonical/universal-heptatonic-ledger.csv` `6d2603a2…`, `derived/hypergraph/bipartite-inclusion-v1.json` `903eebf0…`, `seven-governors-mutation-algebra-audit/audit/operator-registry.csv` `e5a9e692…`, `.../operator-applications.csv` `1f7b2abb…` | planning evidence (pinned) |
| Phase B supportability statement | `scrum/plan/bl-031-phaseA-findings-memo.md:142-150` | sprint finding (not admission) |
| Motivation leg 1 — boundary isolation: D–D fixed-degree closure absent (0), M-closed seven tier cycles, 228 satellite-only touches each way; no row-2 D extension | `scrum/plan/bl-029-d-tier-operator-probe-memo.md:40-44`, `:66-70`, `:104-106`; reproduced per-phase by P5 | admitted probe context |
| Motivation leg 2 — directional non-derivability: direction recorded unassigned; third finding row-class | `scrum/plan/bl-035-semantic-derivation-census-memo.md:77-86`, `:88-95` | negative result carried |
| Motivation leg 3 — transport layering: depth 2–3 origins disjoint from d1 claimants (deepen, never resolve); boundary geometry non-traversable | `scrum/plan/bl-031-semantic-transport-probe-memo.md:65-76`, `:96-100` | planning evidence |
| Charter and fences: SPEC-001 fence #5 defers multi-phase work to a separate future candidate; this program is that candidate; G1/G2 fences | `docs/specs/fivefold_constructs_engine_spec.md:33-40`; `docs/TIERING.md:48-49`; `scrum/BACKLOG.md:338-447`; `docs/ARCHITECTURE_MAP.md:167-176` | charter / fences |
| Machine checks | `orrery/src/phase-a-probe.test.ts` (12 pins); `orrery/scripts/validate-phase-a-probe.mjs` (independent re-derivation); `scripts/build-phase-a-probe.mjs` (emitter); `scripts/verify-phase-a-proposals.mjs` (P0 gate) | sprint pins |
| Cross-session independent re-derivation: all load-bearing quantities (5,544/3,960/9,504; multiplicity 7/5; 40,824; seam histograms) re-verified by two separate planning passes — Phase A's P0 gate grounding and Phase B's admission-planning spot-checks — against landed artifacts | `orrery/src/generated/phase-a-probe.v1.json` (all sections above); `scrum/plan/bl-031-phaseA-findings-memo.md:27-39` | dual-agent verification |

### 3.2 Pointer citations

`[DEFINED]` Per `provenance/EVIDENCE_BINDING_CONVENTION.md` §1.1, field-level citations use
RFC 6901 JSON Pointers against the probe artifact for claim resolution rather than byte
identity. The pointers are verified against the staged bytes pre-commit, in the same
admission step that verifies line-range citations. Byte identity is carried separately by
an R1 whole-file binding (recipe, digest, byte length, subject blob OID) over the artifact;
no span binding is instantiated, and the decision ledger is cited by entry identity
(ENTRY 12 pattern).

### 3.3 Binding and registration plan (R1/R2/R6)

`[DEFINED]` At admission: R1-bind the candidate, receipt, and machine-check records with
`recipe`, `digest`, and `byteLength`; record blob OIDs pre-commit; cite the decision ledger
by entry identity. R6 note: this candidate's declared consequence update — the
`scrum/BACKLOG.md` BL-032 status flip — lands in the same atomic commit, and its
pre-admission state is recoverable from the parent commit. Historical evidence and prior
line anchors are untouched.

## 4. Admission Checklist (later execution; not completed here)

`[DEFINED]` Modeled on ENTRY 12/13 and the convention's admission discipline:

1. Maintainer end-to-end review of this candidate; any admission-time correction bumps the
   version and is recorded in the receipt as a reviewed-baseline delta.
2. Allocate the next free GOV-52X as work item; keep it distinct from the artifact ID.
3. Compute R1 bindings and blob OIDs on staged bytes; verify every line range and JSON
   Pointer against those bytes.
4. Create the compliance receipt under `qa/specs/` with per-rule R1–R6 status and the
   observed-versus-declared split.
5. Append the admission entry (append-only); land the candidate status, the receipt, the
   inventories, and the declared status-propagation edits in one atomic commit.
6. Run full validation; record the observed first stop and the predeclared allowed stale
   gates; do not refresh to force green; claim no release promotion.
7. Verify post-commit R1 reproducibility of the bound bytes.

## 5. Review Boundary

`[DEFINED]` This document becomes admitted, registered evidence only through the §4
execution — the atomic landing that creates its compliance receipt and appends ENTRY 14.
Nothing else admits it. Before that landing it is a candidate with no effect.
