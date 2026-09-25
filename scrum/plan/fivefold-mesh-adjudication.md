# Fivefold Mesh Spec v2.2.0 — Read-Only Adjudication Report

**Status:** sprint artifact (findings memo). No ledger entry, no evidence obligations.
Read-only adjudication performed 2026-09-25 against the repository snapshot at
`6962a60` (post-`a0be8c1`). Domain: the brainstorm document
"ARCHITECTURAL SPECIFICATION: FIVEFOLD ENGINE & HYPERGRAPH MESH" v2.2.0, which was never
written, registered, or cited. The corrected spec v3 is
`scrum/plan/fivefold-mesh-spec-v3.md`. This report is the registered evidentiary basis for
the proposed BL-011 claim event.

**Method.** Every verdict below resolves against committed repository evidence only.
Arithmetic claims were recomputed mechanically during the pass. Nothing in this report
creates, amends, or cites authority; it records findings for disposition.

---

## A1 Polarity — PASS for spec polarity; session opposite FAILS as registry claim

**Verdict:** the spec's §1.1/§1.3 polarity is **SUPPORTED** by the admitted registry. The
session's frozen opposite reading (internal = keep the stack degree, so 1111 = pure stack =
Major Pentatonic; external = sharpen, so 0000 = minor pentatonic) **FAILS as a registry
claim** and is demoted to hypothesis-layer only.

Verbatim registry dump
(`seven-governors-court-substrate-v0.1.0/canonical/court-rooted-positions.json`):

- C0 `pitchClasses [0,2,4,7,9]`, `poleRegister.vector "0000"`, `internalPoles []` (lines 11-29, vector at :28)
- C1 `[0,2,5,7,9]`, `"1000"`, `["Mars"]` (46-66, vector at :65)
- C2 `[0,2,5,7,10]`, `"1100"`, `["Mars","Jupiter"]` (86-107, vector at :106)
- C3 `[0,3,5,7,10]`, `"1110"`, `["Mars","Jupiter","Venus"]` (127-149, vector at :148)
- C4 `[0,3,5,8,10]`, `"1111"`, `["Mars","Jupiter","Venus","Saturn"]` (169-192, vector at :191)

Internal count ascends 0 -> 4 with the record order. Certified field-for-field against
`orrery/src/court.ts:31-107` in `scrum/plan/bl-044-court-voicing-audit.md:15-21`
(all five `admissionStatus: "admitted"`, `setClassId: "pentatonic:5-35"`,
`complementFamilyId: "7-35"`).

Scale identities (display only): 661 Major Pentatonic = C0, 677 Scottish = C1,
1189 Qing Yu = C2, 1193 Minor Pentatonic = C3, 1321 Man Gong = C4
(`schemas/elemental_pentatonic_scale_map_v1.0.0.yaml:33-34` and per-record lines
`:113,143,206`; CRT-350 **proposed**, `physical_quantity_claim: false`, zero authority
effect). C0's mask `{0,2,4,7,9}` is exactly the Q completion window `{t_0..t_4} = {0,7,2,9,4}`
(SPEC-001 §2.1, `docs/specs/fivefold_constructs_engine_spec.md:130-149`;
`src/fivefold/quintessence.py:37-41`).

Character evidence:

- No admitted record pairs 1111 with pure stack / Major Pentatonic. Zero hits.
- The only bright/dark source is the **proposed** map's `semantic_fit` glosses: C0 "fully
  open anhemitonic consonance, all four poles External. Pure outward activation — the
  broadcast seed" (`:97-100`), `brightness: 22`, `emblem_role: electric_seed`; C4 "darkest
  anhemitonic mode (blues-minor / phrygian pentatonic weight): all four poles Internal,
  full magnetic retention, the absolute boundary of the cycle" (`:220-223`),
  `brightness: 26`, `emblem_role: magnetic_terminus`; monotone invariant
  `brightness_kappa_monotonic` (`:237-238`).
- Framework directionality: External = outward projective, Internal = inward centripetal
  that "densifies" (`framework/AGENTS.md:478-482`); `framework/TOPOLOGICAL_ANCHORING.md:567-571`
  reads C0 as "project outward" and C3->C4 as "internalize Saturn: accept and persist the
  actual physical constraint". Compression ascends 0/4 -> 4/4 over C0->C4
  (`framework/AGENTS.md:279-283`; `framework/TOPOLOGICAL_ANCHORING.md:154-160`).
- The framework's brightest-to-darkest ordering
  (`framework/NATURAL_ORGANIZATION_THESIS.md:85-99`) is about the seven 7-35 modes
  (Lydian -> Locrian), not about Court pitch color. It does not support the session flip.

**Brightness disclosure `[OPEN]`.** The `brightness` integer runs 22 (C0) -> 26 (C4):
higher value on the darker end. What the field measures and whether its name matches its
direction are **unconfirmed**; it must be cited only as a proposed monotonic ordinal
tracking `kappa_court`. The A1 verdict does not rest on it. The registry pairing, the
disjoint XOR supports, `kappa_court` monotonicity, and the BL-044 field-for-field
certification carry A1 alone.

**Layer ruling (already recorded).** `scrum/plan/bl-044-court-voicing-audit.md:59-72`
adjudicated the same flip earlier: the report that "Major Pentatonic should be all-internal"
came from the bucket layer's pitch-color reading, not from a data error; the canon reading
(C0 = 0000 = all elements External) is the engagement layer and was always the rule. The
bucket layer remains `[HYPOTHESIS]`, explicitly not repo-recorded, and does not touch
`src/fivefold/quintessence.py` (`scrum/plan/harmonic-comprehension-map.md:60-71`). In the
Orrery it exists only as a labeled, off-by-default toggle
(`scrum/plan/bl-020-debugger-foundation-memo.md`; `orrery/src/path-replay.ts:15-19,208-245`).

**Internal-inconsistency charge reversed.** The spec's §1.1 glosses (0 = External
Dispersion/Fluid, 1 = Internal Cohesion/Fixed Anchor) are consistent with the registry:
External keeps the stack degree and projects outward; Internal sharpens the degree and
retains/darkens. The session's entailment "cohesion should hold the stack tone" is
hypothesis intuition, refuted by the admitted XOR supports.

## A2 Correspondence derivability — CONDITIONAL PASS (forced for all four elements)

Canon pins C1 = 1000 = Mars internal (`framework/AGENTS.md:280`;
`framework/TOPOLOGICAL_ANCHORING.md:93`; `framework/NATURAL_ORGANIZATION_THESIS.md:306`;
`src/fivefold/quintessence.py:47`; freeze memo §3;
`tests/test_fivefold_q_table.py::test_bit_order_pinned_to_canon`).

Registry pins C1's mask = `[0,2,5,7,9]`, i.e. the C0->C1 transition is the 4->5
sharpening (`xorSupportFromPrevious: [4,5]`, registry lines 73-76; canon table
`framework/AGENTS.md:293-298`; `framework/TOPOLOGICAL_ANCHORING.md:164-169`).

The four Court transitions have disjoint supports and Gram matrix `2I_4`
(`framework/AGENTS.md:300-302`; `framework/TOPOLOGICAL_ANCHORING.md:171-184`), so:

- Fire/Mars <-> degree 4 -> 5 (C0 -> C1)
- Air/Jupiter <-> degree 9 -> 10 (C1 -> C2)
- Water/Venus <-> degree 2 -> 3 (C2 -> C3)
- Earth/Saturn <-> degree 7 -> 8 (C3 -> C4)

No element's mapping requires a free choice **given** the identification
engagement-Cn = registry-position-Cn. That identification is the claim; it is not admitted
and no record asserts or denies it. This is the BL-011/§6(4) candidate material, retagged
per below.

## A3 Incidence structure — PASS except one precision correction in (c)

Mechanically recomputed during the pass (12-TET, Z12; no repo writes):

- (a) PASS: `C(11,4) = 330`, `C(11,6) = 462` rooted counts.
- (b) PASS: no nontrivial transpositional symmetry in any 5- or 7-note set
  (0 symmetric sets; orbit size 12; 792/12 = 66). Each universe spans exactly **66
  Tn-classes**; rooted members per Tn-class are exactly 5 / 7. (These are Tn-classes;
  Forte TnI classes number 38 each. The spec must say Tn.)
- (c) SPLIT: "every rooted 5-35 sits in exactly 3 rooted diatonics" TRUE
  (C0 Lyd/Ion/Mix, C1 Ion/Mix/Dor, C2 Mix/Dor/Aeo, C3 Dor/Aeo/Phr, C4 Aeo/Phr/Loc).
  "The rooted 7-35 (C major) contains exactly 3 anhemitonic pentatonics" FALSE under the
  rooted reading: C Ionian rooted contains **2** (`[0,2,4,7,9]`, `[0,2,5,7,9]`); the third,
  `[2,4,7,9,11]`, lacks pitch 0. Under the unrooted reading it is TRUE (3). Every rooted
  diatonic has exactly 3 unrooted 5-35 subsets. **Precision correction recorded; v3
  carries the corrected statement.**
- (d) PASS: per-mode kernel table exactly `Lydian {C0}, Ionian {C0,C1},
  Mixolydian {C0,C1,C2}, Dorian {C1,C2,C3}, Aeolian {C2,C3,C4}, Phrygian {C3,C4},
  Locrian {C4}`; sliding window, 15 edges = 5 x 3.
- (e) PASS: `{0,1,4,5,7,8,11}` is class `(0,1,2,5,6,8,9)` (not 7-35) and contains **zero**
  anhemitonic pentatonics, rooted or unrooted.
- (f) PASS: the spec's uniform "3-to-3 mesh over all 330/462" is FALSE. The true object is
  a bipartite containment graph with variable degrees. Rooted containment degrees (root
  fixed): 7-side `{0: 381, 1: 60, 2: 18, 3: 3}`; 5-side to rooted 7-35
  `{0: 255, 1: 50, 2: 20, 3: 5}`. The 3-3 regularity holds only in the
  diatonic<->anhemitonic subgraph, and there the rooted window is 1-2-3-3-3-2-1.

## A4 Terminology/corrections inventory — all four CONFIRMED

- (a) "462 = 7-35 family" and "330 = 5-35 family" are WRONG. Each universe spans all 66
  Tn-classes. 7-35 has exactly 7 rooted members (Lydian..Locrian); 5-35 has exactly 5
  (C0-C4).
- (b) "Each 330 node contains a native Q-engine running the z=0..4 window" is true only
  for the 5-35-class kernels. The Q substrate runs on every node, but the window/teleology
  marker fires only for the 12 five-windows of the fifth-stack orbit (all 5-35), of which
  exactly the five rooted windows are C0-C4; the other rooted 5-sets are scattered.
- (c) Mesh hops at non-7-35 seams leave the diatonic subgraph. Andalusian Aeolian -> HM is
  Hamming 2 (10 -> 11); source has 3 rooted 5-35 kernels, target has 0. The clean 3-3
  structure does not govern seams.
- (d) The nested diagram's "Q Engine window z=0..4 inside every 330 node" inherits (b).

## A5 The 7-32 seam question — session intuition REFUTED; admitted bridge vocabulary found

- (a) 5-32 is a **proposed** class (`seven-governors-court-substrate-v0.1.0/canonical/pentatonic-set-class-registry.json:647`
  record `pentatonic:5-32`, representative mask 3236 `001001010011` = `[2,5,7,10,11]`,
  `t5Reference: null`): not a constructive-engine reference class. Its root-anchored
  members are **scattered** relative to the fifth-stack circuit, with **zero** 7-35 parents
  (`docs/PENTATONIC_GRAPH_BINDING_AUDIT_SPEC.md:239-243`;
  `canonical/pentatonic-binding-candidates/pentatonic-7-35-parent-audit-v1.json#/universeSummary/parentCountDistribution`
  = 612 zero-parent sets; `scrum/pre-epic-400-pentatonic-graph-binding-audit.md:46-47,76,119-120`).
- (b) Every rooted 7-32 contains **zero** 5-35 kernels, rooted or unrooted (verified for
  all seven rooted 7-32 members). The admitted bridges across the seam are
  **5-23** (rooted `{0,2,3,5,7}`, 2 parents) and **5-27** (rooted `{0,3,5,7,8}`, 2 parents)
  (`docs/MATHEMATICAL_REALIZATION_SPECIFICATION.md:661-665`;
  `docs/PENTATONIC_GRAPH_BINDING_AUDIT_SPEC.md:261-266`;
  `framework/TOPOLOGICAL_ANCHORING.md:426-438`; `court-mathematics/docs/01_COURT_LEXICON.md:581,743`;
  Andalusian Moon-degree mutation `framework/AGENTS.md:80-96`). "5-35 and 5-32 both
  plausibly participate" is FALSE: neither participates on the 7-32 side.
- (c) No admitted record asserts Q-state handoff across a mesh hop. The admitted relations
  are subset incidence (`SUBSET_OF_7_35`, planning evidence only) and the Court filter
  `P_c = diag(c)` with the route-dependence test `P_c T ?= T P_c`. **Re-grounding**
  (departure state does not transfer; the arrival node instantiates its own engine) is
  repo-consistent proposal; **state handoff** is open design space. Transport consistency
  is testable via the BL-031 path-enumeration machinery and must not be assumed.

## Adjudication convergence

A1 resolves for the spec polarity; A2 holds for all four elements conditional on the
engagement<->position identification; A3 passes with one recorded precision correction;
A4 confirms all four items; A5 resolves against the session intuition and supplies the
admitted seam vocabulary. The only load-bearing session claims that failed are the A1
polarity and the A3(c) rooted/unrooted precision; both are recorded as corrections, not
smoothed.

## Pre-landing corrections adopted (maintainer review, 2026-09-25)

1. **Gate tag.** The forced correspondence is **not** a SPEC-001 §6(4) resolution. §6(4)
   gates the overlay<->GOV-517 **input-lane** correspondence (I1 distance-2 pairs, I2
   A-tier CONSTRUCTS transitions, I3 empty, I4 A-tier masks;
   `docs/specs/fivefold_constructs_engine_spec.md:287-296`;
   `qa/gov-517-input-boundary-registration.json:31-61`), which remains entirely
   unevidenced and separately open. The A1/A2 material is overlay<->**Court registry
   positions**, a new canonical admission with its own claim record (TIERING claim-catalog
   class 2, `docs/TIERING.md:18-20`).
2. **Brightness.** Cited only as a proposed monotonic ordinal; field semantics `[OPEN]`;
   not load-bearing for A1.
