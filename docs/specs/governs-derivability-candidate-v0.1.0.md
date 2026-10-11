# GOVERNS Edge-Content Derivability — Candidate Record

| Field | Value |
|---|---|
| Artifact ID | `SPEC-GOVERNS-DERIVABILITY-001` `[DEFINED]` |
| Version | 0.1.1 `[DEFINED]` |
| Status | Admitted; the authority for that status is the admission ledger entry (ENTRY 16) and compliance receipt (`qa/specs/gov-524-governs-derivability-admission.json`), not this header. `[DEFINED]` |
| Claim Class | Canonical admission, TIERING claim-catalog class 2 (`docs/TIERING.md:18-20`) `[DERIVED - docs/TIERING.md:11-24]` |
| Work Item | `GOV-524` (verified next-free at execution). Artifact ID `SPEC-GOVERNS-DERIVABILITY-001` is distinct from the ticket ID. `[DEFINED]` |
| Authority | None by this text; authority flows from the admission ledger entry (ENTRY 16) and the compliance receipt (`qa/specs/gov-524-governs-derivability-admission.json`). `[DEFINED]` |
| Release Status | No gate is cleared and no green integrated release is claimed. `[DEFINED]` |
| Provenance | Un-granting program BL-063 (Phase 1) / BL-064 (Phase 2) / BL-066 (Phase 3); D4 corridor BL-055 → BL-057 (ENTRY 15); BL-059 statement and higher-theorem scoping memo; motivation legs BL-029, BL-035, BL-031 Phase 2. `[DERIVED - cited sprint records]` |
| Charter | TIERING claim-catalog class 2 (`docs/TIERING.md:11-24`); the BL-059 scoping memo's formally stated question (`scrum/plan/bl-059-governs-derivability-scoping-memo.md` §1). This record does not amend SPEC-001, ENTRY 10, or ENTRY 15. `[DERIVED - cited records]` |
| Fencing Class | Candidate record only. No GOVERNS authority, runtime, topology-effect, Court-runtime, graph, policy, or promotion authority. `[DEFINED]` |
| Content Digest | External-only; no in-document self-hash. `[DEFINED]` |

## Revision History

`[DEFINED]` Version labels identify candidate text, not an assertion of completed admission.

| Version | Change |
|---|---|
| 0.1.0 | Initial candidate for maintainer §6 review. Any admission-time correction bumps the version with a row; the reviewed-baseline digest and the authorized delta are recorded in the receipt (ENTRY 12 precedent). |
| 0.1.1 | Admission-time corrections: header Version resolved to 0.1.1; header Status resolved to admitted-by-ledger-reference; §1.1 tag annotated (admitted per ENTRY 16); §5 converted from prospective to causal form and ENTRY 16 named; this row added. Claim text unchanged from reviewed v0.1.0. |

## 0. Scope, Fencing, and Evidence Discipline

### 0.1 Claim boundary

`[DEFINED]` This record proposes the admission of one bounded object: the derivability of
the A1 GOVERNS relation's **edge content** from pre-grant machinery, up to one named bit
and the anchoring remainder. It does not restate, amend, or re-derive the relation's
semantics, its role, its authority, or the status of any other record. The historical
`not_derived` (ENTRY 10) and the additive `derivable-via-R2` amendment (ENTRY 15) are
untouched; this record links forward from them.

### 0.2 Evidence-class tags

`[DEFINED]` The convention tags apply: `[DERIVED - citation]` for facts supported at the
cited record's scope, `[DEFINED]` for constructs and rules with no prior admission, and
`[GATED - condition]` for the unresolved admission itself. An untagged claim is void.

### 0.3 Non-effects

`[DEFINED]` Admission of this claim would not change runtime behavior, canonical
topology, schemas, Court runtime, Neo4j projection, graph, or policy. It would not change
the GOVERNS relation's formal status in the machinery (the claim is about derivability,
not authority), would not amend D4's `derivable-via-R2` or D7's hypothesis-tier, would
not dissolve the boundary wall, would not move G1, would not graduate INV-5, would not
promote M-walkability, and would not assign directional semantics. It would not amend
SPEC-001, clear a release gate, or refresh any shared artifact beyond the landing's own
inventories.

## 1. The Claim

### 1.1 Claim statement

`[DEFINED — admission proposed]` (admitted per ENTRY 16) The claim, verbatim:

> **Claimed:** the A1 GOVERNS relation's **edge content** — which parent–satellite pairs
> exist (28 edges, 7 offices × 4 satellites; `provenance/DECISION_LEDGER.md:2052-2062`) —
> is derivable from pre-grant machinery: the recovered coordinates (κ;
> `orrery/src/generated/bl063-office-reconstruction.v1.json`), the mask geometry
> (Hamming/containment reach; `orrery/src/generated/bl066-r-edge-derivation.v1.json`), and
> the closure law (the H8 reach-census equalization; `bl066-r-edge-derivation.v1.json`) —
> **up to one named bit** (office-orientation, the Lydian/Locrian reflection; carried to
> BL-065) **and the anchoring remainder** (the A0/A1 anchor sets + the tier/role partition
> remain granted; the presentation/bookkeeping conventions remain granted).

**Precision note (not a widening).** The derived edge set is invariant under both κ
orientations (`bl066` `reflection.edgeSetInvariant: true`); the carried bit binds the
office labels, not the edges. The bound "up to one named bit" is the programme's
remainder statement, carried exactly (BL-066 §6 bit inventory; OD-66-3 ruling).

### 1.2 Machine checks

`[DERIVED - cited sprint records]` The claim's numbers are pinned by the three phase
artifacts' vitest pins (9 + 10 + 13) and independently re-derived by their validators
(self-checked chain anchors; static grant-isolation checks; 5 + 10 + 25 mutation probes
rejected, including smuggled `officeIndex`/R/`forte` reads and a lobotomized derivation
region at Phase 3):

- **Phase 1 (offices).** κ₁ reproduces all 7 canonical A0 offices (κ₀: 1/7, the
  reflection-fixed center); the seven A0 masks carry the Hamming-2 line graph P₇
  (endpoints 1387/2773); two construction mechanisms (5 interior sandwich + 2 boundary
  twin-closure); reflection-equivariance 49/49 (`midZ7(6−a,6−b) = (6 − midZ7(a,b)) % 7`);
  H_B null; verdict `CONSTRAINED_TO_REFLECTION`; one bit carried
  (`bl063` `kappaBoth.alignment`, `p7.endpoints`, `reflection`, `synthesis`).
- **Phase 2 (cycle ground).** Derived 7 unordered / 14 directed pairs set-equal the
  granted E pairs (`missing: []`, `extra: []`, per-child 7/7, office alignment 7/7 under
  κ₁); S-int 5 + T-bdy 2, K-int 5 + K-bdy 2, unified 7; the coordinate rule and the frozen
  midpoint law are one relation read in opposite directions
  (`midZ7(c−1, c+1) = c`); direction masks-only 5/5 internal + canonical class 7/7; verdict
  `CYCLE_GROUND_DERIVED` (`bl064` `coverage`, `rules`, `direction`, `synthesis`).
- **Phase 3 (R-edges).** R-H2 reach 24/28 placed with zero extras and unique hubs; the 4
  unplaced resolved by the H8 reach-census closure law (16 matchings enumerated, exactly
  one equalizes — the granted assignment); the derived 28 set-equal the granted R
  (`missing: []`, `extra: []`); per-parent count 4 emergent, never input; GSL-1R signature
  reproduced 2×7-27 + 2×7-31 per parent; verdict `R_EDGES_DERIVED`; gates V-P3-1…5 all
  PASS (`bl066` `reach`, `closure`, `coverage`, `mechanism`, `gates`, `synthesis`).

Corridor numbers carried as context (each at its own record): predicate 14/14 (BL-055);
cycle-twin 7/7 and midpoint census 7/2/5 (BL-056); calibration EXACT and R2 = O at four
licensed contexts, construction join = U contrast (Gate 3 receipt); 40,824/40,824
equivariance and multiplicity 7/5 (Phase A probe, ENTRY 14).

### 1.3 Rejected alternatives, recorded with reason

`[HYPOTHESIS — rejected]` Three alternative readings were weighed; each is rejected with
its reason, grounded in the ruling or artifact that rejected it:

- **(a) The bare-pc-set quotient (the restatement reading).** Read the derived edge
  content as a restatement/collapse of the granted domain partition rather than an
  independent derivation. Rejected: the derivation region never reads R, the office
  fields, or the class fields — the two-sided static input-isolation fence proves
  forbidden-token absence AND required-input presence, and 25 mutation probes (including
  smuggled reads and each presence token stripped individually) were rejected
  (`bl066` `gates/V-P3-2`, `mechanism`); the comparison gate is the only R read
  (validation-only) and it passes fail-loud (`missing: []`, `extra: []`); the count-4
  structure is emergent, never input (`bl066` `closure.emergentCount`; OD-P3-5's strongest
  form). The house restatement-vs-explanation line (OD-60-2) is the class guard under
  which a restatement-grade reading could not have been admitted. The analogous quotient
  reading was itself ruled out at the Phase A pass (the OD-1 multiplicity pin:
  `orrery/src/generated/phase-a-probe.v1.json#/p0Verification/claims/0`,
  `#/p1PhaseCoordinate/covering`; ENTRY 14 record §1.3(a)).
- **(b) The phase-as-annotation reading.** Carry κ and the phase structure as metadata or
  labels on granted records rather than as derived structure. Rejected: the phase
  machinery's equivariance (40,824/40,824 commutation checks, zero rooting-dependent
  witnesses, R1/L1 phase-carry ±1) and uniform multiplicity 7/5 make the lifted structure
  load-bearing — an annotation reading collapses the quantities the seam census measured
  (`phase-a-probe.v1.json#/p2Equivariance/sweep`, `#/p1PhaseCoordinate/covering`;
  ENTRY 14 record §1.3(e)); and in this chain κ is not an annotation: it is recovered from
  masks alone (`bl063` `kappaBoth`) and it *drives* the pair construction (`bl064`
  `rules.kInt`/`kBdy`) and the comparison alignment (`bl066` `coverage.officeAlignment`).
- **(c) The no-derivation verdict.** Read the edge content as resisting masks-only
  derivation (the historical difficulty class, plus each phase's pre-registered failure
  branch). Rejected: every phase's rejection branch was pre-registered and did not fire —
  `bl063` `synthesis.preRegisteredVerdicts` (`FORMALLY_DISCHARGED`/`FAILED` did not fire);
  `bl064` (`CYCLE_GROUND_DERIVED`); `bl066` gates V-P3-1…5 all PASS, set-equality 28/28
  with `missing: []`, `extra: []`, and the closure equivalence proven (16 → 1). The
  historical negative is carried intact and un-erased (ENTRY 10 immutable; the D4
  qualifier `:2260-2266`); this claim links forward from it as ENTRY 15 did, and the
  Gate-3 pre-registered `attribution_incomplete` branch, established as the corridor's
  falsifiability shape, did not trigger (`qa/specs/bl-057-d4-record-amendment.json`
  `claim.falsifiability`).

### 1.4 Falsifiability structure

`[DEFINED]` The claim is precise enough to be wrong, and the shapes that would falsify it
are recorded:

- **Derivation-level.** A masks-only re-run that emits any edge beyond the domain, misses
  an edge (`missing` non-empty), or requires reading R/`officeIndex`/`forte` in the
  derivation region breaks the claim; the landed validators fail loud on exactly these
  (two-sided fence + 25 probes at Phase 3; 5 + 10 probes at Phases 1–2).
- **Closure-level.** A second equalizing matching among the 16 enumerated H8 matchings, a
  rotation relation participating in the closure (landed: 0/44 shifts), or a failure of
  the member-side/matching-side equivalence reopens the swap; none is exhibited
  (`bl066` `closure`).
- **Bit-level.** The carried orientation bit's resolution conditions are recorded: a
  mechanical office-independent discriminator (searched; none found), one grant comparison
  (M1; κ₁ 7/7), or future discovery (BL-065). A resolution does not widen this claim; it
  would close the remaining bit.
- **Scope-level.** A challenge to the claim must exhibit derivation of the anchoring
  remainder (the domain partition) to widen it; the anchoring remainder is carried, not
  claimed.

### 1.5 Significance — the modeling-assumption revision

`[DEFINED]` The original D4 contract declared the complete A1 GOVERNS relation "the
principal authored inheritance input. It gives parent/satellite membership, not a derived
inheritance theorem" (`provenance/DECISION_LEDGER.md:2052-2062`, with the required
interpretation at `:2058`). This claim's admission **revises that modeling assumption by
evidence**: the relation's edge content is intrinsic to the satellite layer's reach
geometry — H2 Hamming reach plus the H8 reach-census closure law, with the count-4
structure emerging from the completion (`bl066` `synthesis.verdictStatement`,
`mechanism.emergent4`). The revision is recorded here as the claim's significance: the
framework's own modeling assumption, tested and revised. The D4 ledger record itself is
**not amended** — the declaration stands as the historical modeling assumption this claim
revises (contrast, not erasure); the revision concerns edge content only, and the
anchoring remainder remains granted.

## 2. Scope Exclusions (binding)

`[DEFINED]`

- **No GOVERNS semantics.** What the relation *means* in the framework is not claimed.
- **No role.** The office structure's meaning is not claimed.
- **No anchor-set derivability.** The A0/A1 anchor sets are the anchoring remainder —
  carried, not claimed.
- **No tier/role partition derivability.** The domain partition (role/tier membership) is
  the one canonical read beneath the masks — carried, not claimed.
- **No GOVERNS authority.** The relation's formal status in the machinery is unchanged;
  this claim is about derivability, not about the relation's runtime/canonical status.
  No GOVERNS admission is made.
- **No D7 implication.** The ti-pole's measured asymmetry stands; D7 remains
  hypothesis-tier, preserved.
- **No INV-5 graduation; no §6(4) movement; no M-walkability promotion.**
- **No G1 movement.** No intra-330 edge is assumed, emitted, or consumed.
- **No record amendments.** D4's `derivable-via-R2` and D7's hypothesis-tier are
  unchanged; ENTRY 10 and ENTRY 15 are byte-untouched by this claim.
- **No canonical/Court/schema/Neo4j writes beyond the ceremony's own.**
- **No release promotion or green-release claim.**
- **Membrane.** The frame (`scrum/plan/harmonic-comprehension-map.md` §§2.6–2.7) and the
  brightness premise are interpretation vocabulary, never design inputs; they confer no
  authority.
- **Session prose is context, not evidence.** Every load-bearing claim cites a landed
  artifact.

## 3. Evidence

### 3.1 Constituent facts

| Fact | Citation | Class |
|---|---|---|
| The grant being addressed: the complete A1 GOVERNS relation R as "the principal authored inheritance input", with the required interpretation (derivation relative to granted inheritance structure) | `provenance/DECISION_LEDGER.md:2052-2062` (:2058 verbatim); `qa/d4-production-generation.json` (frozen projection); `qa/d4-production-receipt.json` (U = 28, O = 14) | record read |
| Predicate (corridor): P(s) = forte-7-27, clean 14/14, Tn-invariant, representation-stable | `orrery/src/generated/d4-selection-review.v1.json` (raw-byte SHA-256 `40a1d7586c8643bac351a1b70c09fce35a977ce200888d08a40d2cc0022649d8`; `reviewFingerprint` `6d11fd932efbe96892b3cf2e6a6cdad6f54e69cd2a8f284ebb72232c59d8b745`); memo `scrum/plan/bl-055-d4-selection-review-memo.md` | planning evidence (pinned) |
| Route (corridor): R2 filtered cycle-walk; constraint table 4/4; cycle-twin 7/7 (T1 + T2); midpoint-office invariant | `orrery/src/generated/d4-r2-route-review.v1.json` (raw-byte `5a1a787eb47a939d8f1ba727689a9cc2db0adb21fe716d5e1600d7a19406c4b3`; `reviewFingerprint` `e25851f975a84a290bc4794916dd16ead7d99c7f3694bae21b7c6bb6f13e91b3`); memo `scrum/plan/bl-056-d4-r2-route-memo.md` | planning evidence (pinned) |
| Gate 1 admission of the corridor (claim_admitted) | `scrum/plan/bl-057-d4-amendment-spec.md`; commits `6908e7b` (spec), `ead2eec` (ruling) | governance |
| Gate 2 implementation (contract) | `orrery/src/generated/d4-r2-contract.v1.json` (`contractFingerprint` `5528510b495f12fa11ab713d8ee357e3798f728204eacd83ad491aafb8fdc7d5`); commit `59fa59a` | implementation |
| Gate 3 execution | `qa/d4-r2-execution-receipt.json` (raw-byte `7e14cbbc680d4827a0d82eb04f3c8c25c187b73d9435fdbade143f014a406fe2`; `executionFingerprint` `3ed80e6fef3b1a5a8211d046facaf2f2d15daf7eb34a398ccfd1fded1c783634`; `implementationDigest` `2789c46cb542cc4d1771110b0cfe113fb44baabf40e478bb94e0dfe55cff70bd`; `generatedKeysDigest` `e075eb63604b7d9d5d484e574fcdd313f6e86f7e66e828ed6b527671df247c56`) | execution |
| Gate 4 amendment | ENTRY 15 `provenance/DECISION_LEDGER.md:2665-2810`; landing commit `880c346` (report-vs-log note: the Gate-4 execution report recorded `5c84aee`; verification found `5c84aee` a present-but-unreachable sibling commit — same parent `85a62a6`, byte-identical tree `1f935ca6…` — of the reachable landing commit `880c346`; the log is the authority) | amendment |
| BL-059 derivation statement (bounded D4 theorem; citation-stable) | `scrum/plan/bl-059-d4-derivation-statement.md` | formal statement |
| BL-059 scoping memo (the question, formally stated) | `scrum/plan/bl-059-governs-derivability-scoping-memo.md` (§1; §4.6; §4.7 accretion at admission) | scoping |
| Phase 1 — κ recovery: P₇ Hamming-2 line (endpoints 1387/2773); κ₁ 7/7 vs κ₀ 1/7; 5 sandwich + 2 twin-closure mechanisms; reflection-equivariance 49/49; H_B null; verdict `CONSTRAINED_TO_REFLECTION`; residual 1 bit | `orrery/src/generated/bl063-office-reconstruction.v1.json` (raw-byte `57932f37d3acc867bf8c44d00d2ced44d4b2d8ccf39b871c2241e685b6e32b18`; `reconstructionFingerprint` `6d33c67be7b8f87b8ad2f964cd3560ebcbc1ec0dc6b2088ad1f223c35caff8c3`; chain anchor BL-060 `8a1295ca…`); memo `scrum/plan/bl-063-office-reconstruction-memo.md`; commit `f5e8c78` | κ recovery |
| Phase 2 — cycle ground: 14/14 directed set-equal (missing/extra empty; per-child 7/7; office alignment 7/7 under κ₁); rules S-int 5 + T-bdy 2, K-int 5 + K-bdy 2, unified 7; `midZ7(c−1,c+1) = c` (coordinate rule ≡ frozen midpoint law read backward; boundary centers = the 2 observation-exact T1 seam relations; internal = the 5 confirmation-marked predictions); D-mid 5/5 masks-only; class 7/7; verdict `CYCLE_GROUND_DERIVED` | `orrery/src/generated/bl064-cycle-ground.v1.json` (raw-byte `9432aa764a57823a06a4d36db3209507ed85af0f7675d3708ef388e369da6f24`; `derivationFingerprint` `aa975820136658dd2fb3c84d98b34bf7a1901d39edd6548a300f458858305918`; chain anchor BL-063 by self-checked fingerprint); memo `scrum/plan/bl-064-cycle-ground-memo.md`; commit `341aada` | cycle ground |
| Phase 3 — R-edges: R-H2 reach 24/28 placed, zero extras, unique hubs; 4 unplaced `{695, 3497, 731, 2921}`; H8 reach-census closure law (member side: attach to the H8-parent with the smaller H2-reach count ≡ matching side: the unique equalizing matching; 16 enumerated, exactly one — the granted assignment); rotation census 0/44; battery corroborates (pcSum + mask-numeric agree; κ orientation-relative; containment the inapplicable control); count-4 emergent; derived 28 set-equal granted R (`missing: []`, `extra: []`); verdict `R_EDGES_DERIVED`; gates V-P3-1…5 PASS | `orrery/src/generated/bl066-r-edge-derivation.v1.json` (raw-byte `ac2db3d92df89f9ae2e5f19dfc7c0489a56f55dfa8bd154a22ad74c875e7a8ab`; `derivationFingerprint` `94f0661ff6e76b0dea69fbe9f09ead24da7901393fb735495f3a25c3d9a1a886`; chain anchor BL-064 by self-checked fingerprint); memo `scrum/plan/bl-066-r-edge-derivation-memo.md`; commit `582af2c` | the capstone |
| Reach-robustness finding: H2-reach ≡ containment-reach (max-overlap) — the same partition under two independent definitions (24 placed agreed; the same 4 ties/misses) | `bl066` `reach.robustness`; memo §4.1 | robustness |
| Bit inventory: carried = ONE bit (office-orientation; two registrations — brightness premise H_A, one grant comparison M1; one identification); dissolved = the swap-bit candidate (resolved by the closure law; pre-registered "carry only if nothing fires" condition not met) | `bl066` `synthesis.bitInventory`; `bl063` `synthesis.residualDependency`; OD-66-3 ruling (`scrum/plan/bl-066-r-edge-derivation-memo.md` §10) | bit inventory |
| Anchoring remainder (granted): the A1 anchor/satellite domain partition (role/tier); the office-orientation bit (labels only — the edge set does not depend on it); presentation conventions (walk order, ids, tier tags) | `bl066` `accounting.tiers.remainingGranted`, `synthesis.grantDischarge` | grant ledger |
| Motivation legs: boundary interrogation (D-tier closure absent; M-closed tier cycles); directional non-derivability (direction recorded unassigned); transport layering (deep collisions, boundary geometry-only) | `scrum/plan/bl-029-d-tier-operator-probe-memo.md`; `scrum/plan/bl-035-semantic-derivation-census-memo.md`; `scrum/plan/bl-031-semantic-transport-probe-memo.md` | planning evidence |
| Machine checks: Phase 1 (`scripts/build-bl063-office-reconstruction.mjs`; `orrery/scripts/validate-bl063-office-reconstruction.mjs`; `orrery/src/bl063-office-reconstruction.test.ts`, 9 pins); Phase 2 (`scripts/build-bl064-cycle-ground.mjs`; `orrery/scripts/validate-bl064-cycle-ground.mjs`; `orrery/src/bl064-cycle-ground.test.ts`, 10 pins); Phase 3 (`scripts/build-bl066-r-edge-derivation.mjs`; `orrery/scripts/validate-bl066-r-edge-derivation.mjs`; `orrery/src/bl066-r-edge-derivation.test.ts`, 13 pins); corridor (BL-055/056 validators + pins; Gate 2 contract validator + 12 pins; Gate 3 receipt validator + 14 pins) | `package.json` `orrery:*:check` wiring; per-artifact `generator` fields | sprint pins |
| Cross-session independent re-derivation: each phase's validator re-derives its successor numbers from the pinned sources (no generator import), re-checks chain fingerprints, and rejects its mutation-probe battery (5 + 10 + 25) | phase validators; `bl066` `base.chainAnchor`; `bl064` `base.reconstructionFingerprint` | dual-layer verification |

### 3.2 Pointer citations

`[DEFINED]` Per `provenance/EVIDENCE_BINDING_CONVENTION.md` §1.1, field-level citations
may use RFC 6901 JSON Pointers against the three phase artifacts for claim resolution
rather than byte identity. Byte identity is carried separately by R1 whole-file bindings
(digests above); the decision ledger is cited by entry identity and line ranges as human
locators (ENTRY 12/15 pattern). No span binding is instantiated.

### 3.3 Binding and registration plan (R1/R2/R6)

`[DEFINED]` At admission: R1-bind the candidate, receipt, and any machine-check records
with `recipe`, `digest`, and `byteLength`; record blob OIDs pre-commit; cite the decision
ledger by entry identity. R6 note: this candidate's declared consequence updates — the
BL-059 scoping-memo accretion (§4.7 + status line), the comprehension-map consumption
row, the BL-064 backlog registration, and the backlog claim-event registration with
revision row — land in the same atomic commit, and their pre-admission state is
recoverable from the parent commit. Historical evidence and prior line anchors are
untouched.

## 4. Admission Checklist (later execution; not completed here)

`[DEFINED]` Modeled on ENTRY 12/13/14 and the convention's admission discipline:

1. Maintainer end-to-end review of this candidate; any admission-time correction bumps the
   version and is recorded in the receipt as a reviewed-baseline delta.
2. Allocate the next free GOV-52X as work item; keep it distinct from the artifact ID.
3. Compute R1 bindings and blob OIDs on staged bytes; verify every line range and JSON
   Pointer against those bytes.
4. Create the compliance receipt under `qa/specs/` with per-rule R1–R6 status and the
   observed-versus-declared split.
5. Append the admission entry (append-only); land the candidate status, the receipt, the
   inventories, and the declared consequence updates in one atomic commit.
6. Run full validation; record the observed first stop and the predeclared allowed stale
   gates; do not refresh to force green; claim no release promotion.
7. Verify post-commit R1 reproducibility of the bound bytes.

## 5. Review Boundary

`[DEFINED]` This document was admitted as registered evidence through its §4 execution —
the atomic landing that created the compliance receipt
(`qa/specs/gov-524-governs-derivability-admission.json`) and appended ENTRY 16. Nothing
else admits it. Before that landing it was a candidate with no effect.
