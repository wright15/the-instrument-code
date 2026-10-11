# BL-060 — D4 14-vs-14 structural hunt: findings memo

**Status:** sprint artifact. Planning evidence only. No ledger entry, no evidence obligations, no claims admitted, no verdicts. Sandbox/analysis only. D4's amended `derivable-via-R2` (ENTRY 15) and ENTRY 10's immutable `not_derived` are unchanged; D7 remains hypothesis-tier and is fenced out of this hunt entirely (OD-60-D7; ENTRY 15 D7 clause). No route admission, no record amendment, no governs admission, no G1 movement. The frame (`scrum/plan/harmonic-comprehension-map.md` §§2.6/2.7) was not used as design input; it is available as interpretation vocabulary only. The higher-theorem question (scoping memo BL-059) is not attempted; this hunt feeds its evidence base.

## 1. What was built

| Artifact | Path | Role |
|---|---|---|
| Generator | `scripts/build-d4-14v14-hunt.mjs` | deterministic builder (canonical serialization + fingerprint `8a1295ca9639fab7e16b980576954a1f12824d839e6743abebe176e3df23cac9`) |
| Artifact | `orrery/src/generated/d4-14v14-hunt.v1.json` | `status: planning_evidence` (raw-byte SHA-256 `3e31a6535ce9e5f913db27b252c66aff0504d38f57a9fe8769cbae8612588b8b`) |
| Validator | `orrery/scripts/validate-d4-14v14-hunt.mjs` | independent re-derivation from the eight pinned sources; fail-loud; mutation-verified |
| Pins | `orrery/src/d4-14v14-hunt.test.ts` | 9 vitest pins (base import, IV-delta, extended table, axes, per-family, office lemma, bridge guard, synthesis, fences) |
| Wiring | `package.json` `orrery:d4-14v14-hunt:check`; `orrery/package.json` `check`/`build` | gate runs after `d4-r2-execution-receipt:check`, before `derived-path-graph:check` |

Verification: `npm run orrery:d4-14v14-hunt:check` PASS (generator `--check` fresh, validator PASS); the 9 pins pass; full `orrery:check` exit 0; orrery suite 299 green (30 files). Mutation probes: a flipped non-Z composite confusion, a promoted axis class, a corrupted BL-055 import fingerprint, and a flipped bridge classification were each rejected by the validator (`INVALID_D4_14V14_HUNT`). The pre-existing `validate:ledger-pins` inventory is byte-for-byte the BL-058 13-violation state — this hunt's generator adds zero violations. Landing-time packaging (manifest regen) is in this landing.

**Base import (OD-60-4).** The BL-055 28-key table is imported by fingerprint — `6d11fd932efbe96892b3cf2e6a6cdad6f54e69cd2a8f284ebb72232c59d8b745` — never edited. The chain is bipartite → BL-055 → BL-060, each link independently validated by its own pinned validator in the same check chain.

## 2. Grounding receipt

Fifteen planning-pass claims were verified against landed artifacts (two independent subagent passes plus direct byte reads), and two were corrected before the build:

- **G-6 (partial, scope correction).** The Gate 2 mutation-probe rejections are the BL-056 design-level probes (spec §Gate 2 line 78-81; BL-056 memo §1), attested secondarily at the Gate 3 receipt; there is no Gate-2-native probe log. The corridor claim stands at that scope.
- **G-13 (failed, OD-60-1).** The brief's hand-derived IV-difference string `<010120>` matches neither the signed delta `<01-212-2>` nor the absolute `<012122>` computed from the canonical IVs. The string is dropped; the artifact recomputes the delta from ledger bytes.
- **Build-phase self-catch (recorded).** The planning prose said "IC1 and IC4 are equal"; the build's computed delta shows only IC1 is equal (IC4 differs by +1). The generated `ivDelta.equalICs` is `["IC1"]` and the reading string was corrected before landing. The per-family threshold scan likewise reports 7-Z17/7-Z37 best at `>= 5` (no value 4 occurs in the data; the planning and memo language ">= 4" described the same selection, and the artifact carries the computed threshold).

All other claims verified: ENTRY 15 additive / ENTRY 10 immutable; predicate `P(s) = [forte(s) = 7-27]` clean 14/14; global 14×7-27 (all observed) + 14×7-31 (all unobserved), all A1 satellites; the failed axes at their recorded numbers; Gate 3 DERIVED@X ×4; D-tier anchor families `7-1/7-8/7-Z12/7-15/7-Z17/7-22/7-Z37` (49 anchors, 7 each, computed from ledger role=`anchor` tier∈D); admitted bridges `5-23/5-27`; complement map 7-27↔5-27, 7-31↔5-31; A0 cycle 5×T2+2×T1; office order Sun/Moon/Mars/Mercury/Jupiter/Venus/Saturn; ENTRY 13 fates present in the admission receipt with the D4/D7 scope exclusion.

## 3. The extended 28-key table

The artifact carries one row per granted key with the BL-055 base columns (`observed`, `forte`, `intervalVector`, `cell`, `bridgeSubnodes`, `cornerstoneSubnodes`, `seamIncidence`) plus the new axis columns: complement `{setClass, admitted, rootedPairs, rootedRecord, representativeMask, representativeKey, representativeObserved}`, symmetry `{chirality, zPartner, inversionSymmetric, inversionSibling}`, D-tier `{counts[7], nonZSum, zSum}`, cycle `{edgeInterval, edgeType}`, and `{governor, element, entry13Fate}`. Every office block is exactly 2 observed (7-27) + 2 unobserved (7-31).

## 4. Axis results — seven verdicts

Format: confusion tp/fp/fn/tn against O.

| Axis | Class | Rule | Confusion | Hit | Verdict |
|---|---|---|---|---|---|
| ivDelta | RESTATEMENT | `IV(s) = 3,4,4,4,5,1` | 14/0/0/14 | 28 | CLEAN_RESTATEMENT |
| complementSymmetry | NON_SEPARATING | symmetry properties separate | 0/0/14/14 | 14 | NON_SEPARATING |
| **dTierContainmentComposite** | **INDEPENDENT_STRUCTURAL_SIGNATURE** | `nonZSum(s) <= 13` | **14/0/0/14** | 28 | **CLEAN_SPLIT_14_14** |
| cyclePosition | NON_SEPARATING | office edge is T1 | 4/4/10/10 | 14 | NON_SEPARATING |
| bridgeAdmissionLink | RESTATEMENT | `complement(s) admitted` | 14/0/0/14 | 28 | CLEAN_RESTATEMENT |
| governorElement | NON_SEPARATING | element-bearing office | 8/8/6/6 | 14 | NON_SEPARATING |
| entry13Interaction | NON_SEPARATING | fate-bearing office | 8/8/6/6 | 14 | NON_SEPARATING |

**1 — IV-delta (recomputed, OD-60-1).** Observed `<344451>`, unobserved `<336333>`; signed delta `[0,1,-2,1,2,-2]`, absolute `[0,1,2,1,2,2]`; IC1 equal; observed carries +1 IC2, +1 IC4, +2 IC5; unobserved +2 IC3, +2 IC6. The predicate is extensionally the set-class predicate — Forte class and interval vector are a canonical bijection on the domain — so the axis is recorded **restatement-grade** per OD-60-2. Its content is the one-sentence intervallic reading, cited to ledger bytes.

**2 — Complement/symmetry.** Complement classes are 5-27 (observed) / 5-31 (unobserved), but the symmetry structure does not separate: all 28 states chiral, 0/28 inversionally symmetric, zPartner null in 28/28. The complement-class partition itself is the split relabeled by the canonical complement-map bijection (restatement-grade); the complements' admission and rooted-record differences are carried to axis 5.

**3 — D-tier containment composite.** `nonZSum` = shared pentatonic subnodes with the four non-Z D-tier anchor families (7-1, 7-8, 7-15, 7-22). Observed states range 8..13; unobserved 14..19; the boundary gap is exactly **1** (13/14) and the split is clean 14/14. This is **not** a restatement of the class label: the statistic varies across rooted states within each class, is read from an independent landed artifact (bipartite containment mesh against the 49 D-tier anchors), and is inversion-invariant (28/28 inversion pairs in-mesh with equal nonZSum). Per OD-60-2 this is an independent structural basis — the observed class is the class whose rooted states interface minimally with the non-Z boundary families.

**4 — Cycle position.** T1 edges sit at offices 0 and 6; the split is office-transverse (see §6) — every office contributes 2/2 — so no cycle-position predicate can separate. Confusion 4/4/10/10 at the T1 grouping.

**5 — Bridge admission link.** Clean by canonical bijection: complement(7-27) = 5-27 (admitted bridge), complement(7-31) = 5-31 (proposed, pending; not admitted). Adjudicated **RESTATEMENT** under the OD-60-2 guard (see §7); the canon-level asymmetry is recorded regardless of the verdict.

**6 — Governor-element (correlation-only, OD-60-3).** Office order Sun/Moon/Mars/Mercury/Jupiter/Venus/Saturn; element-bearing offices Mars/Jupiter/Venus/Saturn. Office-transverse by the lemma — k = 4 grouping gives 8/8/6/6, hit 14. The ENTRY 13 fence is cited in the artifact: configuration-level identification only; no per-domain element semantics; no D4/D7 implication.

**7 — ENTRY 13 interaction (correlation-only, OD-60-3).** The four element degree-fates (Fire 4->5, Air 9->10, Water 2->3, Earth 7->8) verified present in the correspondence admission receipt; same k = 4 grouping, 8/8/6/6, hit 14. No interaction with the split is possible at office resolution.

## 5. D-tier per-family breakdown (the maintainer's note 2)

Not just whether but *which*: the seven D-tier families are not interchangeable. All numbers recomputed from the containment mesh:

| Family | Band | Best split | Confusion | Hit | Verdict |
|---|---|---|---|---|---|
| 7-1 | non-Z | `<= 2` | 14/8/0/6 | 20 | FAIL |
| 7-15 | non-Z | `>= 2` | 12/8/2/6 | 18 | FAIL |
| 7-22 | non-Z | `<= 5` | 14/2/0/12 | 26 | NEAR_MISS (reverse) |
| 7-8 | non-Z | `<= 3` | 14/2/0/12 | 26 | NEAR_MISS (reverse) |
| 7-Z12 | Z | `<= 6` | 8/2/6/12 | 20 | FAIL |
| 7-Z17 | Z | `>= 5` | 12/0/2/14 | 26 | NEAR_MISS (one-sided) |
| 7-Z37 | Z | `>= 5` | 12/0/2/14 | 26 | NEAR_MISS (one-sided) |

The reverse near-misses (7-8, 7-22) share the same two false positives (731, 2921); the one-sided near-misses (7-Z17, 7-Z37) share the same two escapees (1765, 1261). The composite `nonZSum <= 13` resolves all stragglers. The Z-composite `zSum >= 14` is the mirror one-sided near-miss (12/0/2/14). No single family splits cleanly.

## 6. The office lemma (structural, provable)

Every office block contains exactly 2 observed (7-27) and 2 unobserved (7-31) keys. Therefore any predicate determined by the office alone attains `tp = 2k`, `fp = 2k`, `fn = 14-2k`, `tn = 14-2k` for k selected offices: `tp = fp`, `fn = tn`, and `hit = 14` identically. **No office-derived predicate can separate the split** — it lives strictly below the office level. The lemma covers cycle position (k = 2), governor-element and ENTRY 13 (k = 4) simultaneously; the artifact verifies the formula on all three.

## 7. Bridge adjudication under the OD-60-2 guard

The complement-admission axis splits 14/14, and the guard's question is whether that is explanation or restatement. **Verdict: RESTATEMENT.** The complement map is a canonical class-level bijection, so `[complement admitted]` is extensionally the set-class predicate on the domain and adds no structural information. An independent explanation would require the admitted bridge role (5-27's two-parent seam-crossing structure) to explain the split through the anchors' containment geometry; no such mechanism is exhibited in the landed machinery — the BL-055 bridge-subnode axis itself fails one-sided (10/14 vs 0/14). A representative-mask probe underscores the point: the complement map's own representative heptatonic masks land one on each side (695 observed, 731 unobserved) — 1/1/13/13, hit 14 — the complement apparatus alone does not locate the split.

**Canon-level asymmetry (recorded regardless).** 5-27 is an admitted bridge class carrying a rooted bridge record (`bridge-rooting:5-27:aeolian-harmonic-minor`); 5-31 is proposed pending admission (crt-310 backlog) and carries no rooted record. The *asymmetry itself* is a canon-level fact; the *link* to D4 contact selection remains restatement-grade at this layer.

## 8. Synthesis — derived vs primitive

**Verdict: DERIVED.** The 7-27/7-31 split has an independent structural basis: the containment interface with the four non-Z D-tier anchor families separates the domain cleanly (`nonZSum <= 13` observed / `>= 14` unobserved, boundary gap 1), computed from an independent landed artifact and not class-constant. Clean-split inventory: `ivDelta` (restatement), `dTierContainmentComposite` (independent signature — the basis), `bridgeAdmissionLink` (restatement; asymmetry recorded). The pre-registered primitive branch (split axiomatic, a candidate axiom for the governs layer) did **not** fire; it is recorded as not-fired.

**Limits (recorded honestly).** Characterization, not mechanism: the signature describes the split; *why* the boundary geometry governs contact remains open. The signature is a rooted-state statistic read from the landed mesh; it is inversion-stable on the domain, but broader representation invariance is not tested. The GOVERNS relation remains granted input; the higher-theorem question remains open.

**Governs semantic layer — first substantive entry (GSL-1).** The D4 contact selection is boundary-geography-selective. In the complete 462-state mesh, every 7-27 satellite state has `nonZSum <= 13` and every 7-31 state `>= 14`; per-family appetites are one-sided (observed lean on 7-Z17/7-Z37 sharing `>= 5`; unobserved lean on 7-8/7-22 sharing `>= 7`); the canonical bridge asymmetry is recorded as observation. Any organization-derivation route toward the higher theorem can be tested against this signature: a route that does not recover the boundary-geography split is incomplete.

**Scoping-memo connection.** The finding feeds the higher-theorem question's evidence base (scoping memo BL-059 §4): the contact selection is not only set-class-selective but boundary-geography-selective — an independent structural signature available to any candidate organization-derivation route. The scoping memo accretes by its own mutation discipline and is not edited by this hunt; the accretion item is carried here for that future application.

## 9. Rulings applied

| # | Decision | Ruling applied |
|---|---|---|
| OD-60-1 | IV delta | Recomputed from ledger bytes; brief's `<010120>` dropped and recorded |
| OD-60-2 | Bridge circularity | Tested with the restatement-vs-explanation guard; verdict RESTATEMENT recorded with rationale; asymmetry kept |
| OD-60-3 | Axes 6–7 | Kept correlation-only; ENTRY 13 fence cited in axis subFinding and artifact fences |
| OD-60-4 | Artifact shape | New standalone `d4-14v14-hunt.v1.json` importing BL-055 by fingerprint; base artifact untouched |
| OD-60-D7 | D7 control | Fenced out entirely; ENTRY 15 D7 clause cited; no D7 computation performed |

## 10. Findings inventory

1. **The split is office-transverse** — every office contributes 2 observed + 2 unobserved; all office-level axes (cycle, governor-element, ENTRY 13) are provably non-separating (office lemma).
2. **The IV-delta** is +1 IC2 / +1 IC4 / +2 IC5 (observed side) vs +2 IC3 / +2 IC6 (unobserved side), IC1 equal; restatement-grade as a predicate, content recorded.
3. **Complement/symmetry does not separate**; both classes chiral, inversionally asymmetric, zPartner null; complement class partition is a canonical relabeling.
4. **The D-tier containment composite splits cleanly** (`nonZSum <= 13`, gap 13/14), independently of the class label, inversion-stable — the hunt's structural basis.
5. **Per-family one-sided appetites**: observed lean on Z-families (7-Z17/7-Z37 `>= 5` selects 12/14 with zero false positives); unobserved lean on 7-8/7-22; no single family is clean.
6. **The bridge axis is restatement-grade** (canonical complement bijection); the canon-level asymmetry (5-27 admitted + rooted record vs 5-31 proposed + none) is recorded as observation; representative-mask probe hit 14.
7. **Synthesis: DERIVED** — the first independent structural basis for the 7-27/7-31 split; the primitive branch did not fire.
8. **Governs semantic layer GSL-1** recorded; scoping-memo §4 accretion item carried.

## 11. Bounded non-accomplishments

No D4 record amendment; no governs admission; no higher-theorem answer (BL-059's question remains open); no D7 computation or control (OD-60-D7; D7 hypothesis-tier untouched); no G1 movement; no directional-semantics assignment; no INV-5 graduation; no M-walkability promotion; no canonical/Court/schema/Neo4j writes; no route admission or execution; frame (§§2.6/2.7) not used as design input; session prose is context, not evidence.

## 12. Result in one paragraph

Read-only, the hunt extended BL-055's 28-key table with seven new characterization axes and tested each for the 14/14 split. Three split cleanly: the interval-vector delta and the complement-bridge link — both canonical relabelings of the class predicate, restatement-grade under the OD-60-2 guard — and, decisively, a containment composite over the four non-Z D-tier anchor families: every 7-27 satellite shares ≤13 pentatonic subnodes with 7-1/7-8/7-15/7-22, every 7-31 shares ≥14, a 1-integer boundary gap computed from an independent landed artifact, varying across rooted states within each class, and inversion-stable. Every office-level axis (cycle position, governor-element, ENTRY 13 degree-fates) is provably non-separating by the office lemma — the split lives strictly below the office level. The synthesis is **DERIVED**: the contact selection is boundary-geography-selective, the governs semantic layer gains its first substantive entry (GSL-1), and the higher-theorem question gains a signature any future organization-derivation route must recover. The hunt characterizes; it does not conclude the governs program.

## 13. Post-landing register (additive; maintainer disposition 2026-10-10)

Three structural observations from the post-landing review are registered here; one carries a grounding correction (twelfth catch, maintainer-prose class), applied before capture.

**The exception pairs (corrected against artifact bytes).** Three distinct pairs carry the residual structure, and they must not be conflated:

| Pair | Status | Profile (from `table28`) | Role |
|---|---|---|---|
| 1765, 1261 | observed | seam 4, bridge 4, cornerstone 2; nonZ 8; zSum 11 (7-Z17 = 7-Z37 = 2) | the Z-family residual pair: the two observed keys the one-sided 7-Z17/7-Z37 (`>= 5`) and zSum (`>= 14`) scans miss |
| 2395, 2899 | observed | seam 0, bridge 1, cornerstone 0; nonZ 13 | the zero-seam pair (BL-055 record): the escapees of the bridge and cornerstone axes and the seam axis's zero-incidence keys; inside the clean split at its boundary value 13 |
| 731, 2921 | unobserved | seam 2, bridge 1, cornerstone 0; nonZ 14 | the reverse-scan false-positive pair of 7-8 (`<= 3`) and 7-22 (`<= 5`); at the clean split's other boundary value 14 |

The correction: the disposition's BL-061 parenthetical described the 1765/1261 pair with the 2395/2899 profile ("zero seam incidence, no bridge subnodes, no cornerstone containment"); the artifact bytes show 1765/1261 carry seam 4 / bridge 4 / cornerstone 2, and the zero-incidence profile belongs to 2395/2899. The ticket is captured with corrected facts (BL-061). Note the bracket structure the correction exposes: 2395/2899 and 731/2921 are exactly the pairs at the clean composite's boundary values (13 and 14) — the two pairs that bracket the 1-integer gap.

**Phase-independence and keying-invariance carry to the mechanism.** The selection's phase-independence and keying-invariance are landed facts (BL-055 Step 0 / OD-3: the seam structure is not an observed-set discriminator; BL-057 Gate 3: calibration EXACT, cells 0/10/4/0 at all three patch phases), and the hunt's new columns are computed from satellite identity, which re-keying does not touch. The boundary geography is therefore a property of the containment structure itself, not of how it is addressed — representation stability verified at the mechanism level, not only at the predicate level.

**The Z/non-Z follow-on question (BL-062).** The composite selects on the four non-Z D-tier families; the three Z-classes fail as single axes (7-Z12 outright; 7-Z17/7-Z37 one-sided 12/14) and are absorbed by the composite's threshold. Whether the non-Z selectivity is structural (the chiral Z-classes not participating in the selection geography) or an artifact of the composite's threshold form is captured as BL-062 and feeds the boundary-layer semantics.
