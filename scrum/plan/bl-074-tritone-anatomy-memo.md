# BL-074 — The three-measure tritone characterization: the boundary layer's tritone anatomy (the relational–relational–internal trichotomy) — findings memo

**Status:** sprint artifact. Planning evidence only. No ledger entry, no evidence obligations, no claims admitted, no verdicts, no admission of any kind. **No new measurement (OD-74-5 memo-only; OD-74-1's Descriptive-Read boundary): the BL-071 census is the grounding base — this memo reads it. The census's own witness lists are the population; describing the listed witnesses is characterization, discovering new ones is measurement (none occurs here). No new universe enumeration, no new pair discovery, no new witness beyond the landed lists.** **No mechanism claim: the characterization states the three phenomena's structural roles; the causal question stays open (recorded, not closed — BL-072's family).** D7 remains hypothesis-tier throughout (no D7 claim event, no D7 record amendment, no D7 derivation admission; ENTRY 15's D7 clause carries forward verbatim, `provenance/DECISION_LEDGER.md:2703-2712`). GSL-4's promoted characterization is not status-changed: this memo refines it to an annotated sub-entry (no new GSL number, no re-promotion); the §7 refinement text is inline and unapplied. No directional-semantics assignment; no G1 movement; no INV-5 graduation; no M-walkability promotion; no canonical/Court/schema/Neo4j writes. The frame (`scrum/plan/harmonic-comprehension-map.md` §§2.6/2.7) is interpretation vocabulary, never design input; the lens coda (§8) is template-bound and non-load-bearing. Session prose is context, not evidence.

**Grounding base:** `orrery/src/generated/bl071-interval-6-structure.v1.json` — `investigationFingerprint` `8b2a1f6ca1776851f721eb6bc6ee6532059d81d150ce3f7c9fda1febfe84c3fe`; raw-byte SHA-256 `80a98540ed282299ebdb8028fc4fdc2280b5b9e12d33dca213afc5d676f6382f` (re-verified before this memo's assembly). Witness-property reads use the identical mask functions the census used (`hamming12`, `rotateMask12`, `pcSumOfMask`, `icVectorOfMask`, `singlePitchDisplacement`; `scripts/build-bl071-interval-6-structure.mjs:114-160`) applied as description of the **listed** witnesses, drawn from the landed ledger masks/pitch sets (`canonical/universal-heptatonic-ledger.json`). Chain anchors self-checked as in BL-071 (BL-070 `9db10a08…`; BL-068 `b0d65bd6…`; D4 hunt `8a1295ca…`; Phase A `c8271c20…`).

**Rulings executed (OD-74-1…OD-74-6, approved 2026-10-11).** Descriptive-Read boundary stated as a rule (OD-74-1: the census's witness lists are the population); the D-anchor disp-6 decomposition required and load-bearing (OD-74-2); labels as comparison targets only (OD-74-3); GSL-4 refined as an annotated sub-entry (OD-74-4); memo-only landing (OD-74-5); lens coda included, template-bound (OD-74-6). The approved W-2 addition executed: the D2 dual-phenomenon trio named (§3, §6) — the trichotomy's precise form is *distinct distributions, overlapping instances*.

## 1. Grounding receipt

| # | Claim | Verification (read-only, this sprint) | Verdict |
|---|---|---|---|
| G-1 | Grounding base bytes | artifact raw sha256 `80a98540…` + `investigationFingerprint` `8b2a1f6c…` re-hashed before assembly | **GROUNDED** |
| G-2 | Census artifact at commit `3364633`; chain | `git log`: `3364633` = BL-071 landing; chain anchors self-checked in-artifact; the brief's `8a1295ca…` is the D4-hunt chain anchor (precision note; no bytes change) | **GROUNDED** |
| G-3 | The five-universe × three-measure distributions | byte-read from `census.universes`; witness lists and histograms re-verified | **GROUNDED** |
| G-4 | W-1 witness properties | all 12 D7-36 disp-6 witnesses: single-swap, Ham-2, dPcSum 6, classes 7-1/7-2, tiers D7/D6 — recomputed from ledger bytes | **GROUNDED** |
| G-5 | W-2 / W-2b witness properties | all 12 rot-6 pairs (same-tier, same-class, T⁶ true) and all 15 disp-6 pairs (Ham-2, lin 6) recomputed; decomposition 6/6/3 exact | **GROUNDED** |
| G-6 | W-3 strata | IC6 per member state tracks Forte class exactly in every universe; boundary aggregate 70 states `{1:42,2:14,3:14}` re-derived | **GROUNDED** |
| G-7 | Fisher tables + role verdict + disposition | TEST-1…4 p-values match citations; `roleVerdict: mixed`; GSL-4 promotion = commit `3cb5c53` disposition (BL-071 memo §13) | **GROUNDED** |

**No mismatch halts.** (One shorthand repair stands, per OD-74-2: the "ti-local" reading is true at the contact-domain scale and incomplete at the anchor-pair scale — §4.)

## 2. W-1 — M-DISP anatomy: the substitution tritone

All 12 D7-36 displacement-6 witnesses (the census's landed list), recomputed properties:

| Witness | Removed→Added | dPcSum | Classes | Tiers | Offices |
|---|---|---|---|---|---|
| 127:253 | 1→7 | 6 | 7-1/7-2 | D7/D6 | 4/4 |
| 127:2143 | 5→11 | 6 | 7-1/7-2 | D7/D6 | 4/6 |
| 2111:3119 | 4→10 | 6 | 7-1/7-2 | D7/D6 | 6/1 |
| 3103:1087 | 11→5 | 6 | 7-1/7-2 | D7/D6 | 1/6 |
| 3103:3607 | 3→9 | 6 | 7-1/7-2 | D7/D6 | 1/3 |
| 3599:2591 | 10→4 | 6 | 7-1/7-2 | D7/D6 | 3/1 |
| 3599:3851 | 2→8 | 6 | 7-1/7-2 | D7/D6 | 3/5 |
| 3847:3343 | 9→3 | 6 | 7-1/7-2 | D7/D6 | 5/3 |
| 3847:3973 | 1→7 | 6 | 7-1/7-2 | D7/D6 | 5/0 |
| 3971:3719 | 8→2 | 6 | 7-1/7-2 | D7/D6 | 0/5 |
| 4033:2017 | 11→5 | 6 | 7-1/7-2 | D7/D6 | 2/2 |
| 4033:3907 | 7→1 | 6 | 7-1/7-2 | D7/D6 | 2/0 |

**Structural read (roles, not causes).** (a) Every D7-36 disp-6 pair is a **single-pc complement swap between a 7-1 anchor and a 7-2 satellite** — the class-pair is constant across all 12; the substitution moves one pitch by a tritone (a pitch-pair `{p, p+6}` exchange), which is exactly the pc-sum offset (`dPcSum = 6`; all 12, both signs by key order). (b) **Office-blind:** the office-index pairs spread over 4/4, 4/6, 6/1, 1/6, 1/3, 3/1, 3/5, 5/3, 5/0, 0/5, 2/2, 2/0 — no office condition marks the displacement class (a contrast with GSL-3's office-purity at the contact-selection level: the displacement layer is not office-structured). (c) **The fa-pole contrast:** A1-28's substitution histogram is `{−1: 12, +1: 12}` only — the fa-domain's single-swap relations are semitone-exclusive; D7-36's histogram is `{−1: 6, −4: 6, +1: 6, +4: 6, +6: 12}` — the ti-pole's contact geometry admits large-interval substitutions (±4, ±6) that the fa-pole's never takes. The displacement tritone is where the ti-pole's contact layer *substitutes at maximal distance*; the recorded instances (2 of 12) are exactly the terminal far contacts `127:253`/`4033:2017` (T-2).

## 3. W-2 — M-ROT anatomy: the rotation tritone

All 12 D-anchor rot-6 pairs (the census's landed list), recomputed:

| Tier | Pairs | Hamming | Classes |
|---|---|---|---|
| D7 ×1 | 127:4033 (the modal-orbital closure) | 10 | 7-1/7-1 |
| D6 ×2 | 381:3909, 1119:2001 | 6, 6 | 7-8/7-8 |
| D5 ×2 | 997:2383, 1273:3667 | 6, 6 | 7-Z12/7-Z12 |
| D4 ×1 | 631:3529 | 10 | 7-Z17/7-Z17 |
| D3 ×1 | 1891:2269 | 10 | 7-Z37/7-Z37 |
| D2 ×3 | 471:1479, 2283:2787, 3189:3441 | 2, 2, 2 | 7-15/7-15 |
| D1 ×2 | 871:2509, 1651:3289 | 6, 6 | 7-22/7-22 |

**Structural read.** (a) Every rot-6 pair is **same-tier and same-Forte** — rotation preserves the internal interval vector, so it is necessarily a within-class relation (the census's `distinctFrom` note: rotation is not a displacement and not a content statistic). (b) The two boundary **closures are both Hamming-10 rot-6**: `4033:127` (the D7 modal orbit) and `1387:2773` (the A0 P₇ ring; the artifact's canonical key order) — a whole-set T⁶ rotation, not a swap (T-1 + the census's headline). (c) **Absent from every contact domain** (D7-36 0/36, D6-tier 0/98, A1-28 0/28): a relation that preserves internal intervals cannot be a single-swap contact relation, so its presence at the anchor scale only is the expected signature of a **symmetry** phenomenon. (d) **The dual-phenomenon trio (the approved W-2 addition, named):** the three D2 rot-6 pairs at Hamming 2 — `471:1479`, `2283:2787`, `3189:3441` — are **also** in the disp-15 list (§4): for these three pairs the substitution tritone and the rotation tritone **coincide** — the same pair is simultaneously a displacement-6 substitution and a rotation-6 mapping. They are the boundary layer's **overlap zone**, and their existence proves the measures are **not mutually exclusive**.

## 4. W-2b — the D-anchor displacement decomposition (OD-74-2; required, load-bearing)

The 15 D-anchor disp-6 pairs decompose by tier-pair into exactly three families:

| Family | Count | Pairs | Classes | Note |
|---|---|---|---|---|
| **D4↔D7 (fa↔ti)** | 6 | 127:631, 1831:3847, 2111:2363, 2963:3971, 3103:3229, 3529:4033 | 7-1/7-Z17 | substitution bridges across the pole divide |
| **D1↔D5** | 6 | 671:923, 871:997, 1273:3289, 1651:3667, 2383:2509, 2873:3881 | 7-22/7-Z12 | lower-tier band |
| **D2↔D2** | 3 | 471:1479, 2283:2787, 3189:3441 | 7-15/7-15 | **the dual-phenomenon trio (also rot-6)** |

**The reconciliation (OD-74-2's content).** "Displacement-6 is ti-local" is **true at the contact-domain scale** (all 12 D7-36 disp-6 instances involve D7 anchors; the fa-pole contact domain carries 0/28) and **incomplete at the anchor-pair scale** — the anchor space also carries disp-6 bridges 6× fa↔ti, 6× D1↔D5, 3× D2↔D2. The correct statement: *the contact-layer substitution tritone is ti-pole-local; the anchor-layer substitution tritone is distributed (and includes the fa↔ti bridge family).* The layer distinction, not the pole label, carries the claim.

## 5. W-3 — M-IC6 stratification: the content tritone

IC6 content tracks **Forte class exactly** — every member state's IC6 is a function of its class, in every universe (labels as comparison targets only, OD-74-3; office carries no IC6 signal beyond class co-occurrence):

| IC6 | Forte classes | Where they sit |
|---|---|---|
| 1 | 7-1, 7-2, 7-27, 7-35, 7-Z17, 7-Z37 | D7-36 (7×7-1, 14×7-2); A0 ring (7×7-35); D-anchor (D7, D4, D3) |
| 2 | 7-8, 7-34, 7-22, 7-Z12 | D6-tier anchors (7×7-8); A1 anchors (7×7-34); D-anchor (D6, D1, D5) |
| 3 | 7-31, 7-15 | A1 satellites (14×7-31); D-anchor (D2) |

Universe reads (landed `ic6Content`; member-state tallies re-verified): D7-36 `{1:21}` (all classes IC6=1); D6-tier `{1:14, 2:7}` (7-2 satellites + 7-8 anchors); A1-28 `{1:14, 2:7, 3:14}` (7-27 + 7-34 + 7-31); A0-P7 `{1:7}` (7-35 only); D-anchor-49 `{1:21, 2:21, 3:7}` (all three bands, seven states each). Boundary aggregate (landed, TEST-4): 70 states `{1:42, 2:14, 3:14}` vs the 462-ledger `{1:112, 2:280, 3:70}` — IC6-poor.

**Structural read.** The fa-domain's IC6 richness is its **satellite composition**: 14 of its A1 satellite states are 7-31 (IC6=3) — the A1 satellite layer carries the IC6-rich class. The D7-domain's IC6 poverty is its **class composition**: both its classes (7-1, 7-2) carry IC6=1 — the ti-pole's availability domain cannot be IC6-rich. D-tier mixedness = its seven anchor families span all three IC6 values. The content tritone follows **set-class structure** (composition), not the contact relation and not the office (the only axis with no signal at any scale).

## 6. W-4 — the disagreement's mechanism: the relational–relational–internal trichotomy

**The three measures are three kinds of tritone phenomenon:**
1. **Substitution (M-DISP)** — *relational, between nodes:* the difference of two masks under one-pc replacement at displacement 6. Lives where the layer's **contact relationships** concentrate: the ti-pole contact layer (§2).
2. **Rotation (M-ROT)** — *relational, between nodes:* the T⁶ symmetry mapping one mask onto another (internal intervals preserved). Lives where the layer's **anchor/cycle relationships** concentrate: the D-tier anchor pairs and both seven-cycle closures (§3).
3. **Content (M-IC6)** — *internal, one node:* the count of tritone intervals inside a single mask. Lives where the layer's **compositions** concentrate: the fa-domain's 7-31 satellite density (§5).

**Trichotomy:** *relational–relational–internal* — two pairwise phenomena and one internal phenomenon; the pairwise measures concentrate where the layer's relationships concentrate (contacts vs anchors — different relationship layers), the internal measure where compositions concentrate. That is why their distributions differ.

**The disagreement is distributional, not logical.** The D2 trio (§3d) satisfies M-ROT and M-DISP **simultaneously** — the phenomena can co-occur pair-wise; they are not mutually exclusive. What differs is where each concentrates. Precisely: *distinct distributions, overlapping instances.*

**Role assignments (roles, not causes — V-BL-071-4 carries forward).** Substitution = the contact layer's maximal-distance substitution relation, ti-pole-local at that scale (fa↔ti bridges exist at the anchor scale — §4's reconciliation); rotation = the anchor layer's symmetry relation and both boundary cycles' closure interval; content = the composition layer's class-driven density, fa-rich/D7-poor. The GSL-4 role verdict (`mixed`) stands as the summary; this section records the anatomy beneath it.

## 7. W-5 — the GSL-4 refinement (annotated sub-entry; inline, unapplied)

*No status change to the promoted characterization; no new GSL number; the text is proposed for a later fast-lane registration (synthesis §5 interval-6 block + map §5.7 + scoping memo §4.9 style), executed in this memo as quote-block only.*

> **GSL-4 refinement (BL-074, 2026-10-11; annotated sub-entry).** The tritone's role in the boundary geography is measure-dependent because the three measures are three different kinds of tritone phenomenon — **substitution** (M-DISP: a pairwise pc-sum displacement between masks), **rotation** (M-ROT: a pairwise T⁶ symmetry between masks), and **content** (M-IC6: an internal interval count within one mask). The trichotomy is **relational–relational–internal**. Their distributions are distinct because each concentrates where a different structural layer's relationships or compositions concentrate: substitution at the ti-pole's contact layer (12/36 of the D7-36 domain, classes 7-1↔7-2, office-blind; the fa-pole contact domain carries only ±1 swaps, 0/28 at displacement 6), rotation at the anchor/cycle layer (12 of the 1176 D-tier anchor pairs are T⁶ pairs — all seven tiers carry at least one; both boundary seven-cycles close at rotation 6, both Hamming-10; absent from every contact domain), and content in the composition layer (IC6 tracks set-class exactly — 7-31/7-15 carry 3, 7-8/7-34/7-22/7-Z12 carry 2, the rest 1; the fa-domain is IC6-rich via its 7-31 satellite family, the D7-domain poor via its 7-1/7-2 classes; the boundary as a whole is IC6-poor, TEST-4). The measures' disagreement is **distributional, not logical**: the D2 dual-phenomenon trio (471:1479, 2283:2787, 3189:3441) satisfies M-ROT and M-DISP simultaneously — distinct distributions, overlapping instances. The mechanism question (why these roles) remains open (BL-072's family; recorded, not closed).

## 8. The lens coda (template-bound; non-load-bearing, per OD-74-6)

The synthesis §4's registered reading applied to the anatomy: the **Venus register's trajectory-bending physics** reads as the substitution tritone's lens-coloring (tritone displacements bending the contact trajectory at the ti-pole), the **Moon register's secondary-posture physics** reads as the rotation tritone's lens-coloring (the rotational closure as the secondary structure's own geometry), and the fa-domain's absorption-rich density reads through the same register as the content tritone's coloring. The lens colors, the measurements ground; the correspondence is recorded as design coherence, not mechanism; no derivation claimed; removing the coda leaves every finding intact.

## 9. Verification record (this landing)

| Check | Result |
|---|---|
| Grounding base re-hash | artifact raw-byte `80a98540…` + fingerprint `8b2a1f6c…` re-verified before assembly |
| Descriptive reads (fail-loud) | all 40 witness keys (12 D7-36 disp + 12 D-anchor rot + 15 D-anchor disp + 1 A0 rot) recomputed — single-swap/Ham-2/dPcSum-6/classes/tiers/offices/T⁶/tier decomposition/IC6 tallies: zero mismatches to the landed census |
| Boundary aggregate | 70 states `{1:42, 2:14, 3:14}` re-derived; TEST-1…4 p-value citations match the artifact |
| `npm run validate:manifest` | PASS |
| `npm run orrery:check` | exit 0 (no artifact bytes touched) |
| `validate:ledger-pins` | unchanged (pre-existing BL-058 inventory, zero added) |
| `validate:prose-consistency` | unchanged vs baseline (zero added in this memo) |
| Manifest/checksums | regen (1,281 files; +1 this memo) |

## 10. Bounded non-accomplishments

**No new measurement** (OD-74-1's boundary: no new universe enumeration, no new pair discovery, no witness beyond the census's landed lists). **No mechanism claim** — the characterization states roles, not causes; the mechanism question stays open (recorded, not closed). No claim event; no record amendment; no D7 claim or amendment (hypothesis-tier preserved). No status change to GSL-4 (annotated sub-entry only; no new GSL number; the §7 text is unapplied). No directional-semantics assignment; no G1 movement; no INV-5 graduation; no M-walkability promotion. No canonical/Court/schema/Neo4j writes; no ledger writes. No lens application as evidence; the frame is vocabulary, not input. Session prose is context, not evidence.

## 11. Result in one paragraph

The tritone's three phenomena are now anatomized — read, not re-measured, from BL-071's census. **M-DISP** is a substitution phenomenon: all 12 D7-36 instances are 7-1↔7-2 single-pc complement swaps (dPcSum 6), office-blind, and the fa-pole's substitutions never exceed ±1 — the contact-layer substitution tritone is ti-pole-local. **M-ROT** is a rotation phenomenon: all 12 D-anchor pairs are same-tier/same-class T⁶ mappings, both seven-cycles close at rot-6 Hamming-10, and rotation is absent from every contact domain by construction — and the D2 trio (`471:1479`, `2283:2787`, `3189:3441`) is **dual-phenomenon**, satisfying rotation and displacement simultaneously. **M-IC6** is a content phenomenon: IC6 tracks set-class exactly; the fa-domain is rich via its 7-31 satellites, the D7-domain poor via its 7-1/7-2 classes; office carries no signal. The decomposition of the 15 D-anchor disp-6 pairs (6 fa↔ti + 6 D1↔D5 + 3 D2↔D2) reconciles the "ti-local" shorthand: true at the contact scale, incomplete at the anchor scale. The disagreement's shape is the **relational–relational–internal trichotomy** — distinct distributions, overlapping instances; distributional, not logical. GSL-4 gains its annotated sub-entry (§7, unapplied), the lens coda is recorded template-bound, and the mechanism question remains honestly open. No measurement, no amendment, no admission: the anatomy is the deliverable.
