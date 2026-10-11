# BL-061/BL-062 — The boundary geography's Z-structure and residual anatomy: findings memo

**Status:** sprint artifact. Planning evidence only. No ledger entry, no evidence obligations, no claims admitted, no verdicts. Sandbox/analysis only. D4's `derivable-via-R2` (ENTRY 15) and ENTRY 10's immutable `not_derived` are unchanged; D7 remains hypothesis-tier and is fenced out (OD-60-D7, ENTRY 15 D7 clause). No governs admission, no G1 movement, no directional assignment. The frame (§§2.6/2.7) was not used as design input. The higher-theorem question (BL-059) is not attempted. **Twelfth-catch rule applied throughout: every profile in this memo is computed from landed bytes by the artifact generator, never transcribed from prose.**

## 1. What was built

| Artifact | Path | Role |
|---|---|---|
| Generator | `scripts/build-d4-zresidual-hunt.mjs` | deterministic builder (fingerprint `e1b3f655b7d79c67e2002ef2bf6da5db298bcd846306db6878896b3f24c4cd8a`) |
| Artifact | `orrery/src/generated/d4-zresidual-hunt.v1.json` | `status: planning_evidence` (raw-byte SHA-256 `f1484ce450a6ebd397078903cef77d4c295aec976aca26302b988988c5109a1f`) |
| Validator | `orrery/scripts/validate-d4-zresidual-hunt.mjs` | independent re-derivation from the five pinned sources; fail-loud; mutation-verified (a flipped shape result, a corrupted residual count, a dropped cornerstone anchor, and a promoted dual-degeneracy flag were each rejected) |
| Pins | `orrery/src/d4-zresidual-hunt.test.ts` | 9 vitest pins (header/chain, tiers, pairs, anatomy, mechanisms, residual, refinement, synthesis, fences) |
| Wiring | `package.json` `orrery:d4-zresidual-hunt:check`; `orrery/package.json` `check`/`build` | runs after `d4-14v14-hunt:check`, before `derived-path-graph:check` |

Verification: `npm run orrery:d4-zresidual-hunt:check` PASS; 9 pins pass; full `orrery:check` exit 0; orrery suite 308 green (31 files). `validate:ledger-pins` unchanged at the BL-058 13-violation inventory — zero added. **Base import (OD-60-4 chain):** BL-060 imported by fingerprint `8a1295ca9639fab7e16b980576954a1f12824d839e6743abebe176e3df23cac9` (transitively BL-055 `6d11fd93…`); both base artifacts untouched.

## 2. Grounding receipt

Ten planning claims verified against bytes (two independent subagent passes plus direct reads). Four corrections were ratified before the build, and two new structural facts surfaced during grounding:

- **Thirteenth catch (`7-Z22` phantom).** The brief's D-tier list substituted a non-existent class; the landed census is 7-1/7-8/7-15/7-22 (non-Z) + 7-Z12/7-Z17/7-Z37 (Z). The build derives the census from bytes.
- **Chiral-hypothesis reframing.** The D-tier Z-families are **achiral Z-partners** (7-Z17↔7-Z37, 7-Z12↔7-Z36; single orientation, 7 states); chirality belongs to the satellite classes 7-27/7-31 (14 states, 2 orientations). The tested cleavage is Z-paired vs IV-unique.
- **Malformed refinement target.** `16/0/0/12` is impossible (tp ≤ 14); the bar is exact 14/0/0/14.
- **Fifteenth catch (inference-direction, ratified earlier).** Both members of every inversion pair share observed status; orientation-sensitivity within pairs cannot explain the residual; the selection is inversion-invariant.
- **New fact 1 — tier↔family bijection.** Each D-tier carries exactly one family: D1=7-22, D2=7-15, D3=7-Z37, D4=7-Z17, D5=7-Z12, D6=7-8, D7=7-1 (49 anchors, 7 per tier). The BL-060 "per-family" axis is per-tier; "Z family" = tiers D3/D4/D5.
- **New fact 2 — anchored enumeration rule.** The mesh's 15 subnodes per heptatonic node are exactly the 5-subsets containing pc 0 (verified 462/462). Composition statistics are therefore state-level (root/anchoring-dependent), not class-determined — which is why they carry independent information.

## 3. The Z-anatomy (BL-062, part 1)

Per-family anchored pentatonic vocabularies (computed from the mesh; contained = union of the family's seven anchors' subnode lists):

| Family | Tier | Band | Contained penta nodes | Z-class nodes | Achiral nodes |
|---|---|---|---|---|---|
| 7-22 | D1 | non-Z | 100 | 30 | 20 |
| 7-15 | D2 | non-Z | 90 | 15 | 20 |
| 7-Z37 | D3 | Z | 100 | 20 | 20 |
| 7-Z17 | D4 | Z | 100 | 20 | 20 |
| 7-Z12 | D5 | Z | 105 | 10 | 15 |
| 7-8 | D6 | non-Z | 100 | 5 | 20 |
| 7-1 | D7 | non-Z | 75 | 5 | 15 |

- Pairwise vocabulary Jaccard (milli) ranges 0.05-0.40 (the closest pair is 7-Z17↔7-Z37 at 0.38, with 7-22↔7-Z17 and 7-22↔7-Z37 also 0.38; 7-1↔7-8 at 0.40).
- **The five 5-35 cornerstones are confined to D5/7-Z12 anchors**: anchors 671 (Saturn), 997 (Mars), 1273 (Jupiter), 3239 (Mercury), 3881 (Sun) each contain exactly one 5-35 window.
- Anchor-level band profiles (mechanism a): Z-band anchors carry 1-5 Z-class subnode slots, non-Z-band anchors 0-6 — ranges overlap; no clean band dichotomy. **Verdict: PARTIAL** — distinct vocabularies confirmed; the Z/non-Z asymmetry is not an anchor-profile dichotomy.

## 4. Mechanisms (BL-062, part 2)

- **(a) Z-paired vs IV-unique anchor profiles — PARTIAL.** The bands differ in shape (cornerstones only in Z anchors; vocabulary Jaccard low) but not in a separating way.
- **(b) Satellite Z-content — SUPPORTED.** Every observed satellite carries Z-class pentatonic subnodes (2-4 rooted entries, 2-4 distinct classes); every unobserved carries zero. `distinctZClasses >= 1` is clean 14/0/0/14.
- **(c) Orientation-resolved composition — SUPPORTED for achiral content; NOT SUPPORTED for A/B counts.** Every observed satellite carries achiral (single-orientation) subnodes (2-4 entries); every unobserved carries zero. Pure A/B counts overlap between the classes. The Z-class orientation split is not a discriminator: the residual pair's members carry the same two Z classes in opposed orientations (5-Z18/5-Z36 as A on 1765, B on 1261).

**The Z/non-Z verdict: STRUCTURAL.** The Z-structure participates in the selection geography through two channels: (i) the interface polarization (refinement S3: observed satellites are Z-majority in D-tier containment, `nonZSum < zSum`, gap 4); (ii) the composition channel (Z-class and achiral pentatonic content). The per-family Z failures of BL-060 are distribution effects — the Z-interface is spread across three families and the Z-content across two types — not inertness. The threshold-artifact reading is refuted: differently-shaped predicates expose the Z-structure cleanly.

## 5. The residual pair (BL-061)

Byte-verified profiles (identical for both members, inversion siblings):

| Field | 1:1765 (A) | 5:1261 (B) |
|---|---|---|
| Z-family interface (Z12/Z17/Z37) | 7/2/2 | 7/2/2 |
| zSum / nonZSum / sign | 11 / 8 / −3 | 11 / 8 / −3 |
| Z-class content | 5-Z18, 5-Z36 (chiral-only) | 5-Z18, 5-Z36 (chiral-only) |
| Achiral classes | 5-35 only | 5-35 only |
| Sibling | 5:1261 | 1:1765 |

- The pair is the **Z12-only interface extreme**: maximum Z12 (7) with minimum Z17/Z37 (=2), and the **minimum zSum among observed** (11; observed range 11-21, unobserved 5-13).
- The pair is the **unique observed pair with chiral-Z-only composition** (no 5-Z17/5-Z37 achiral Z class; every other observed carries one).
- **Verdict: EXPLAINED_NOT_PRIMITIVE.** The pair defeats per-family Z thresholds (7-Z17/7-Z37 `>= 5`) and per-content-type thresholds (achiral-Z only, chiral-Z only) **by construction**; it sits inside the canonical sign rule at margin 3 (threshold 0; unobserved minimum +1). Its exception structure across the three Z-side scans is the signature of one property: the Z-interface carried entirely by the Z12 family.

## 6. The refinement scan (BL-062, part 3)

Strict pre-registered shapes, canonical weights, key-list clauses forbidden; every hit must be inversion-symmetric and pass OD-60-2:

| # | Shape | Result | Confusion |
|---|---|---|---|
| S1 | `nonZSum <= 13` (w = 0; BL-060) | HIT | 14/0/0/14 |
| S2 | `2*nonZSum − zSum <= 14` (w = −1/2) | HIT | 14/0/0/14 |
| S3 | `nonZSum < zSum` (w = −1; canonical) | HIT | 14/0/0/14 |
| S4 | dual `nonZSum <= a ∧ zSum >= b` (all landed pairs) | HIT_DEGENERATE | 14/0/0/14 |
| S5 | `zSum >= 14` | MISS_NEAR | 12/0/2/14 |
| S6 | `distinctZClasses >= 1` | HIT | 14/0/0/14 |
| S7 | `achiralZClasses >= 1` | MISS_NEAR | 12/0/2/14 |
| S8 | `chiralZClasses >= 1` | MISS_NEAR | 12/0/2/14 |
| S9 | `singleEntryCount >= 1` (achiral subnodes) | HIT | 14/0/0/14 |
| S10 | `distinctClasses >= 11` (composition richness) | HIT | 14/0/0/14 |
| S11 | orientation-resolved Z (`zA + zB >= 1`) | MISS_NEAR | 12/0/2/14 |
| S12 | single-orientation Z (`zSingle >= 1`) | MISS_NEAR | 12/0/2/14 |
| S13 | `zA >= 1` alone | REJECTED_INVERSION_SPLIT | splits 1765/1261 |
| S14 | `zB >= 1` alone | REJECTED_INVERSION_SPLIT | splits 1765/1261 |

- **Dual-threshold scan:** 64 landed (a, b) pairs; exactly 2 separate — (13, 5) and (13, 11) — and both are **degenerate**: a = 13 excludes every unobserved key regardless of the z-clause. The dual hit is S1 extended, not a Z-separated classifier.
- **Inversion-symmetry:** 14 pairs; every HIT is symmetric; the two orientation-polarized shapes that split the residual pair are rejected at scan level (fail-closed). The observed selection selects whole inversion pairs.
- **Verdict: REFINED.** HIT shapes: 6 clean + 1 degenerate; near-misses: 5 (all one-sided 12/14, on complementary Z-content types); rejected splits: 2.

## 7. Synthesis — the completed boundary geography

**The canonical refined statement (GSL-1R):** the boundary geography is a **polarization**, not a non-Z-only threshold. Observed satellites are exactly those whose D-tier containment interface is Z-majority (`nonZSum < zSum`; observed −13..−3, unobserved +1..+11, gap 4) — equivalently the GSL-1 threshold `nonZSum <= 13` is the w = 0 projection of the same structure; complementarily, observed satellites' pentatonic composition carries Z-class subnodes and achiral subnodes, and unobserved carry none.

**The residual anatomy (GSL-2):** the 1765/1261 pair is the geography's explained extreme — the Z12-only interface pair with chiral-Z-only composition, defeating per-family and per-content-type thresholds by construction while sitting inside the sign rule at margin 3. **Inversion-invariance:** every one of the 14 inversion pairs shares status; pairs link offices summing to 6 (mod 7); the selection mechanism is inversion-symmetric by observation; the residual is not an orientation artifact.

**The geography, in one place:** *mechanism* — boundary-geography-selective contact selection with two channels (interface polarization + composition content); *thresholds* — `nonZSum <= 13` (w = 0), `2·nonZSum − zSum <= 14` (w = −1/2), `nonZSum < zSum` (w = −1, canonical; gap 4), composition (`distinctZClasses >= 1`, `singleEntryCount >= 1`, `distinctClasses >= 11`); *exceptions* — none primitive (residual pair explained; boundary pairs 2395/2899 at nonZ 13 and 731/2921 at nonZ 14 bracket the original threshold; no shape-scan survivor splits an inversion pair); *Z-structure* — tiers D3/D4/D5 carry the Z families, cornerstones confined to D5/7-Z12, the Z-interface distributed across families with the Z12-only extreme explained; *orientation structure* — 14 whole-pair selections, achiral content present in all observed and zero in all unobserved, A/B counts non-separating.

**Limits (recorded honestly):** characterization, not mechanism — why boundary containment governs contact remains open; anchored-representation statistics (inversion-stability verified, broader representation invariance untested, carried from GSL-1); GOVERNS remains granted input; the higher-theorem question remains open.

**Scoping-memo connection:** the finding feeds BL-059 §4 as a second independent signature (Z-participation + residual anatomy); the scoping memo accretes by its own discipline and is not edited here.

## 8. Rulings applied

| # | Decision | Ruling applied |
|---|---|---|
| OD-61-1 | 7-Z22 phantom | Landed census derived from bytes; brief list not carried |
| OD-61-2 | Chiral reframing | Z-paired vs IV-unique tested; achiral D-families confirmed from registry |
| OD-61-3 | Refinement target | Exact 14/0/0/14; failure branch unused (the scan produced hits) |
| OD-61-4 | Artifact shape | Standalone `d4-zresidual-hunt.v1.json` importing BL-060 by fingerprint |
| OD-61-5 | Semantic-layer rule | Hit branch: GSL-1R (refinement) + GSL-2 (residual anatomy) recorded |
| OD-61-6 | Search strictness | Pre-registered shapes, canonical weights, no key-list clauses, OD-60-2 on hits, inversion-symmetry asserted per shape |
| OD-61-7 | Ticket closure | One artifact + one memo closes BL-061 and BL-062 jointly |
| R1 | Mechanism pre-registration | (a)/(b)/(c) separately verdict'd: PARTIAL / SUPPORTED / SUPPORTED-for-achiral |
| R2 | Corrected framing | Status-sharing pairs; profile asymmetry tested; inversion-invariance pre-registered and verified; the orientation-sensitive mechanism is falsified |

## 9. Findings inventory

1. **Tier↔family bijection** (D1=7-22 … D7=7-1); the D-tier "families" are tiers.
2. **The mesh's 15 subnodes are the pc-0-anchored 5-subsets** (462/462) — composition statistics are state-level.
3. **Mechanism (a) PARTIAL; (b) SUPPORTED; (c) SUPPORTED for achiral content.**
4. **Z-verdict STRUCTURAL** — the Z-structure participates in both channels; the threshold-artifact reading is refuted.
5. **The residual pair is explained**: Z12-only interface (7/2/2), chiral-Z-only content (5-Z18/5-Z36), minimal zSum (11), margin 3 inside the sign rule — not primitive.
6. **The refinement scan**: 6 clean canonical hits, the sign rule canonical; dual thresholds hit only degenerately; orientation-polarized shapes rejected as inversion-splitting.
7. **Inversion-invariance**: all 14 pairs share status; selection selects whole pairs; pairs link offices summing to 6 (mod 7).
8. **GSL-1R + GSL-2** recorded; completed geography assembled.

## 10. Bounded non-accomplishments

No claim event; no record amendment; no governs admission; no higher-theorem answer; no G1 movement; no directional-semantics assignment; no D7 computation (fenced, OD-60-D7); no INV-5 graduation; no M-walkability promotion; no canonical/Court/schema/Neo4j writes; frame not used as design input; session prose is context, not evidence.

## 11. Result in one paragraph

The combined sprint characterized the boundary geography's two open edges. The Z/non-Z asymmetry is **structural**: the observed satellites are Z-majority in their D-tier containment interface (`nonZSum < zSum`, gap 4) and carry Z-class plus achiral pentatonic content (unobserved carry none), while the seven families carry individually distinct vocabularies and the cornerstones live exclusively in D5/7-Z12. The residual pair 1765/1261 is **explained, not primitive**: the Z12-only interface extreme with chiral-Z-only composition, defeating per-family and per-content-type thresholds by construction and sitting inside the sign rule at margin 3. The strict refinement scan produced six clean canonical shapes (the sign rule is canonical), one degenerate dual-threshold hit, five one-sided near-misses, and two orientation-polarized shapes rejected as inversion-splitting — and every hit is inversion-symmetric, matching the observed whole-pair selection across all 14 inversion pairs. The geography is now complete in one place: mechanism, thresholds, exceptions, Z-structure, and orientation structure — GSL-1 refined, GSL-2 laid. The hunt characterizes; it does not conclude the governs program.
