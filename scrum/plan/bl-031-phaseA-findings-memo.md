# BL-031 Phase A Sprint Memo: Phase-Extended State Machinery Probes

**Status:** sprint artifact (generated artifact + independent validator + findings).
Planning evidence only. No ledger entry, no evidence obligations, no claims admitted.
Related: `scrum/BACKLOG.md:343-395` (BL-031 Phase A scope), `plan/harmonic-comprehension-map.md`
§2.5 (fa-distance lens, prediction only), `plan/bl-029-d-tier-operator-probe-memo.md`,
`plan/bl-031-semantic-transport-probe-memo.md` (Phase 2), `docs/ARCHITECTURE_MAP.md` §4
(G1/G2 fences).

**Landed:**

| Artifact | Role |
|---|---|
| `scripts/verify-phase-a-proposals.mjs` | P0 verification gate: M1 lift arithmetic + OD-1 covering multiplicities, M2 freeness sweep, P1 rooting check. Standalone-runnable; fail-loud |
| `scripts/build-phase-a-probe.mjs` | Deterministic Phase A probe: P2 equivariance (calibration + 3,402 x 12 sweep, three strata), P3 seam census (two families), P4/P5/P6 design specs, canonical serialization + fingerprint |
| `orrery/src/generated/phase-a-probe.v1.json` | Generated artifact (`status: planning_evidence`; fingerprint `c8271c20…`; file sha256 `48f51367…`) |
| `orrery/scripts/validate-phase-a-probe.mjs` | Independent validator: re-derives P0 arithmetic, re-implements the 15 generators, re-runs the 40,824-check sweep, re-derives the seam census and patch counts, re-checks the fingerprint |
| `orrery/src/phase-a-probe.test.ts` | 12 vitest pins: scope, P0 receipt, sweep, strata, families A/B, mirror verdict, specs, fences |
| Wiring | `phase-a-probe:check` in `orrery:check` / `orrery:build`; root `orrery:phase-a-probe:check` |

Read-only against the landed sources (bindings: `canonical/universal-network-data.json`
`21e2a632…` — identical to the audit's source hash; ledger `6d2603a2…`; bipartite
`903eebf0…`; operator registry `e5a9e692…`; applications `1f7b2abb…`). No canonical,
catalog, audio, Court, schema, or Neo4j bytes changed; no edges emitted; no intra-330
adjacency assumed; G1 untouched.

## 1. P0 grounding receipt (all four session-derived math items grounded)

| Claim | Verdict | Evidence |
|---|---|---|
| M1 lift arithmetic 5,544 / 3,960 / 9,504 | **PASS**, plus the OD-1 covering pin | 462 and 330 anchored records all contain pc 0; pair counts exact; the pair-space covers 792 distinct concrete 7-sets at uniform multiplicity 7 and 792 concrete 5-sets at uniform multiplicity 5; C(12,7) = C(12,5) = 792 |
| M2 freeness | **PASS** | 8,712 anchored checks (792 records x 11 shifts) and 17,424 distinct-set checks (1,584 sets x 11): zero counterexamples. Proof sketch recorded: orbit sizes in {2,3,4,6,12} divide neither 7 nor 5. `stabilizer-results.csv` is explicitly excluded as evidence (operator-property stabilization, not transpositional stabilizers) |
| P1 rooting check | **PASS** | All 792 anchored records carry exactly one root inside their own pc-set; concrete sets unique per cardinality; no rooting ambiguity. Phase coordinate is well-defined |
| M3 seam relation | **PASS** via P3 | 12 canonical readings (Lydian(p) ↔ Locrian(p+1), tonic exchange, 6/7 common tones) and 12 mirror readings (Lydian(p) ↔ Locrian(p−1), tritone-degree trade, tonics as common tones) |
| M4 minimal patch | **PASS** via P3 | Every seam reading is covered within phase distance ±1; the mode-tonic representative pair sits at exactly ±1; same-phase representative pairs exist at 0 |

The OD-1 covering statement is pinned in M1's `redundancyReading`: *the lift is 7-fold
redundant in concrete pc-set terms and exactly non-redundant in (anchored-form, phase)
terms; the redundancy is the phase information.*

## 2. P1 phase coordinate (as built)

- **Definition:** phase `p ∈ Z12` is the transposition offset applied to an anchored record:
  lifted node `(record, p)` denotes concrete configuration `(T_p(pitchClasses), T_p(root))`;
  the anchored cut (the record's pc 0) sits at absolute pc `p`.
- **Representation:** node ID `{anchoredId}@{phase}` (example `7-35:0@3`), phase field uint4,
  orientation suffix preserved (`7-10:0B@11`).
- **Counts:** 5,544 heptatonic + 3,960 pentatonic = 9,504 lifted nodes.
- **Rooting:** the bipartite canonical-root convention; each concrete anchored set has exactly
  one root assignment, so the lift's rooted identity is deterministic (P1 PASS).

## 3. P2 equivariance probe

- **Calibration:** the anchored reimplementation of the 15 admitted generators reproduces all
  3,402 admitted applications exactly (`EXACT`); an independent enumeration from the 462
  anchored masks (15 operators each) returns the same 3,402-row universe with zero missing rows.
- **Sweep:** all 3,402 applications x 12 phases = **40,824 checks, 0 failures**. No
  rooting-dependent operator found; no witnesses.
- **Per operator (all 15 PASS):** M (462 applications, carry 0); each R/L operator (210
  applications). Carries: `R1 = +1`, `L1 = −1`, all other 13 operators `0` — the OD-4
  pre-registration confirmed exactly.
- **Strata (per the BL-029/BL-030 boundary-stratification amendment):** cornerstone-touching
  1,145 applications (13,740 checks), boundary-adjacent 1,990 (23,880), interior 267 (3,204);
  zero failures in every stratum. D-anchor-touching applications: 581. Cornerstone parent
  union: 81 heptatonic nodes; admitted-bridge (5-23/5-27) parent union: 241.

## 4. P3 seam census

**Family A — operator-realized root-phase seams (R1/L1).** 420 admitted applications (210 R1,
210 L1) lift to **5,040 seam edges**. Intra-7-35: exactly 2 — the canonical edge
`R1:2773:1387` and its inverse `L1:1387:2773`. Cross-family: 418. Phase distance: R1 +1,
L1 −1, in every stratum.

**Family B — bridge-mediated cross-family seams (7-35 ↔ 7-32 containment).** 42 node pairs
with shared pentatonic subnodes, **90 crossings** (histogram: 30 pairs with 1 shared subnode,
12 with 5). Phase distance 0 everywhere — containment is fiberwise, so bridge crossings
preserve phase. The Andalusian ground truth reproduces the BL-028 / Phase 2 transport-probe
result exactly: `7-35:3 → 7-32:0` has 5 shared subnodes
(`5-20:0B`, `5-23:0`, `5-25:0`, `5-27:0`, `5-29:0B`), of which `5-23:0` and `5-27:0` are the
admitted bridge vocabulary.

**Modal seam census.** The 12 distinct diatonic collections each have exactly 7 lifted
representatives (the OD-1 redundancy, visible in place). All 12 adjacency pairs (6 common
tones) support two directed readings:

- **Canonical** (12/12): Lydian(p) → Locrian(p+1); the exchanged pair is the tonic pair; the
  mode-tonic representatives sit at phase distance **+1**; realized by the **R1** edge (+1)
  plus the six same-phase fixed-degree edges R2–R7 (0).
- **Mirror** (12/12, pre-registration confirmed): Lydian(p) → Locrian(p−1); the exchanged pair
  is the tritone-degree pair, tonics common; mode-tonic representatives at **−1**; realized
  by the **L1** edge (−1) plus the six same-phase edges L2–L7 (0).

**Structural refinement (measured):** the readings collapse to the anchored seven-operator
ring over the 7 7-35 anchors — `1387 →(R5) 1451 →(R2) 1453 →(R6) 1709 →(R3) 1717 →(R7) 2741
→(R4) 2773 →(R1) 1387` with the L-family as its inverse. The root-phase edges carry the
phase across the seam; the fixed-degree edges connect same-phase representatives. Every
reading also has a same-phase representative pair (Δ=0) because the collections share 6 tones,
so the minimum representative phase distance over all 49 representation pairs is 0 for all 24
readings — the planning pass's "radius-1 minimum" pre-registration is refined here: the
mode-tonic pair is at ±1, the minimum is 0, and the maximum needed excursion across every
enumerated seam is 1.

**Radius-one verdict: PASS.** No enumerated seam requires a phase excursion beyond 1.

## 5. P4/P5/P6 design (conditional on the probe verdicts — both PASS)

- **P4 lift architecture:** node identity `{anchoredId}@{phase}`; fiberwise same-phase
  containment only (6,930 anchored pairs per direction x 12 = 83,160 lifted pairs per
  direction); operator edges lift by equivariance with the R1/L1 carry; planning-evidence
  status, byte-stable, independently validated.
- **P5 boundary-layer integration:** the 66 anchored modal cycles lift to 66 phase-indexed
  cycle families (5,544 = 66 x 7 x 12); the D-tier's 49 anchors remain M-closed (49 modal
  edges) and fixed-degree-isolated (**0** D–D fixed-degree applications at every phase) —
  the BL-029 wall stands in the lifted space, reproduced per phase. Wall dissolution is not
  attempted; it is Phase C's governs question. `d-cycle:D1–D7` remain the boundary sampling
  paths, re-indexed by phase.
- **P6 B/C/C# minimal patch:** phases {11, 0, 1}; 1,386 heptatonic / 990 pentatonic / 2,376
  total lifted nodes; R1/L1 cross the patch boundary at phases 11 and 1, so the patch is
  closed under root-phase seam traversal. Fixtures: canonical `C Lydian ↔ C# Locrian` and
  `B Lydian ↔ C Locrian`; mirror `C Lydian ↔ B Locrian` and `B Lydian ↔ A# Locrian` — all
  6-common-tone, all mode-tonic distance ±1. Sufficiency: PASS; no fourth phase needed.

## 6. Findings inventory

1. **The session-derived math is grounded, not assumed:** the lift arithmetic holds as pair
   counts, the action is free on both universes, and the OD-1 covering multiplicity is uniform
   (7 and 5) — the redundancy is the phase information.
2. **The 15 admitted operators are translation-equivariant.** The full 40,824-check sweep is
   clean, with zero rooting dependence; the pre-registered carries (R1 +1, L1 −1, others 0)
   hold exactly.
3. **The seam census is radius-1:** operator seams carry ±1; bridge seams preserve phase;
   modal readings sit at ±1 at mode-tonic representatives with same-phase representatives at 0.
4. **The mirror prediction is confirmed with a structural refinement:** canonical and mirror
   are the two directions of the same adjacency, realized by the R-ring and L-ring over the 7
   anchored 7-35 states; the root-phase edge carries the phase, the fixed-degree edges preserve it.
5. **The boundary wall stands in the lifted space:** D–D fixed-degree isolation is 0 at every
   phase; M-closure lifts fiberwise. The phase machinery adds representational structure without
   dissolving BL-029's asymmetry — exactly as designed.
6. **The B/C/C# patch suffices for C's seams:** all seam structure is covered within phase
   distance 1, so the minimal instance is closed.

## 7. Phase B supportability

On the evidence above, the Phase A probes run clean: the phase-extended state representation is
well-defined on the anchored universes, the action is free, every admitted operator is
equivariant, the seam set is fully censused and radius-1, and the boundary layer's fate is
stated as design. **The Phase B claim ("phase-extended topology resolves seam connections;
govern re-evaluation warranted") is supportable by this evidence.** This memo does not admit
anything: Phase B is the separate claim event under maintainer gate, and Phase C (the D4/D7
retry) remains gated on that admission.

## 8. Governance

Planning evidence only. G1 untouched (no intra-330 field emitted, rendered, or consumed).
No topology mutation: anchored universe, canonical records, Court runtime, Neo4j projection,
and schema contracts untouched. No governs verdicts; no admission; no directional-semantics
assignment (BL-035's negative result carried). The comprehension-map §2.5 fa-distance lens is
used as interpretation context only. Session-derived mathematics was grounded in the P0 gate
before any artifact cited it.

**What this build does NOT accomplish:** it does not retry D4/D7; does not admit a topology;
does not move G1; does not claim the boundary layer is traversable (it is not, at every phase);
does not assign Earth-ward/Fire-ward direction; does not promote M to walkability; does not
touch catalog, audio, or canonical bytes.

**Open item for maintainer:** the planning pass pre-registered P3's minimum representative
phase distance as ±1; the build measured the true minimum as 0 (same-phase common-tone
representatives), with ±1 at the mode-tonic representatives. The hypothesis is not weakened —
radius-1 coverage is confirmed and strengthened — but the refined statement is recorded here
for the Phase B record rather than silently substituted.
