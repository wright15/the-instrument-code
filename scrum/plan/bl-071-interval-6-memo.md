# BL-071 — The interval-6 characterization: the tritone's role in the boundary geography (census / baselines / GSL-4 candidate) — findings memo

**Status:** sprint artifact. Planning evidence only. No ledger entry, no evidence obligations, no claims admitted, no verdicts, no admission of any kind. **No mechanism claim (V-BL-071-4): the characterization measures the tritone's role; why the tritone plays that role stays open (BL-072).** D7 remains hypothesis-tier throughout (no D7 claim event, no D7 record amendment, no D7 derivation admission; ENTRY 15's D7 clause carries forward verbatim, `provenance/DECISION_LEDGER.md:2703-2712`). No GOVERNS admission (GSL-4 is an un-promoted candidate draft); no G1 movement; no INV-5 graduation; no M-walkability promotion; no directional-semantics assignment; no canonical/Court/schema/Neo4j writes. The frame (`scrum/plan/harmonic-comprehension-map.md` §§2.6/2.7) is interpretation vocabulary, never design input. Session prose is context, not evidence.

**Artifact:** `orrery/src/generated/bl071-interval-6-structure.v1.json` — status `planning_evidence` (raw-byte SHA-256 `80a98540ed282299ebdb8028fc4fdc2280b5b9e12d33dca213afc5d676f6382f`; `investigationFingerprint` `8b2a1f6ca1776851f721eb6bc6ee6532059d81d150ce3f7c9fda1febfe84c3fe`). Generator `scripts/build-bl071-interval-6-structure.mjs` (raw-byte SHA-256 `93024c8681a51fd5b4f07b51ae4f7b30796ea0637ada930befae7977193acb1d`); independent validator `orrery/scripts/validate-bl071-interval-6-structure.mjs` (raw-byte `46bcbdc5f20e0f436026a070b6d079b5ccd53b0966b3a259bbcd0e3ce43c7639`; 34 artifact-drift + 5 smuggled-read + 5 presence-strip probes rejected; two-sided census-core static check); pins `orrery/src/bl071-interval-6-structure.test.ts` (raw-byte `1542cb025996f6fd6ad4de4d546e42c3281465bdc8d5563034fa7b058bc2ddb0`; 11 tests). Wired `orrery:bl071-interval-6-structure:check` (after `bl070-d7-derivation:check`, before `derived-path-graph:check`); full `orrery:check` exit 0 (`tsc --noEmit` clean); suite 373 green (37 files); `validate:ledger-pins` unchanged (pre-existing 13-violation BL-058 inventory, zero added); manifest regen (1,279 files); `validate:manifest` PASS.

**Chain anchors (self-checked by fingerprint):** BL-070 `9db10a08…`; BL-068 `b0d65bd6…`; D4 hunt `8a1295ca…`; Phase A probe `c8271c20…`. The Gate 3 receipt (`qa/d4-r2-execution-receipt.json`) is bound by raw sha256 and re-read interval-by-interval.

## 1. What was built

| Artifact | Path | Role |
|---|---|---|
| Generator | `scripts/build-bl071-interval-6-structure.mjs` | deterministic builder; census-core region statically fenced two-sided (label/status tokens absent; masks-only tokens present); five universes x three measures |
| Artifact | `orrery/src/generated/bl071-interval-6-structure.v1.json` | the characterization: triangulation, census, baselines B1/B2, Fisher tests, split geometry, lifted congruence, role verdict, GSL-4 draft, gates, fences |
| Validator | `orrery/scripts/validate-bl071-interval-6-structure.mjs` | independent re-derivation from the eight bound sources; **44 mutation probes** (34 artifact-drift + 5 smuggled-read + 5 presence-strip) each rejected |
| Pins | `orrery/src/bl071-interval-6-structure.test.ts` | 11 vitest pins (header/chain/pre-registration, triangulation, four universe pins, IC6 aggregate, baselines, Fisher, split, lifted, role/GSL/gates/fences) |
| Wiring | root `package.json` `orrery:bl071-interval-6-structure:check`; `orrery/package.json` `check`/`build` | runs after `bl070-d7-derivation:check`, before `derived-path-graph:check` |

**Rulings executed (OD-71-1…OD-71-6, approved 2026-10-11).** Full five-universe scope (OD-71-1); T-3 carried as labelled framing, excluded from the verdict — the triangulation is stated exactly as "two landed + one framed" (OD-71-2); B1/B2 Fisher-exact baselines pre-registered before the comparison, no post-hoc adjustment (OD-71-3); lifted-space attempt executed, bounded (OD-71-4); GSL-4 drafted as a candidate (OD-71-5); the role verdict drawn from the closed vocabulary {separation, exclusion, transition, mixed, none} (OD-71-6). Both planning-pass precision additions executed: the three measures kept distinct by construction and reported side by side (displacement 6, rotation 6, IC6 content); the B2 control's predicted value pre-registered and then **corrected against the bytes** (§5 below, the grounding catch).

## 2. Grounding receipt (verified at build; V-BL-071-1/2 PASS)

| # | Claim | Verification | Verdict |
|---|---|---|---|
| G-1 | The three-way triangulation's two landed findings | BL-070 artifact + Gate 3 receipt re-read: modal closure `4033→127` at rotateInterval 6 (six rot11 edges); near-miss misses `127:253`/`4033:2017` key-for-key; masks-only recounts reproduce both exactly | **GROUNDED** |
| G-2 | T-3 is framing, not measurement | `harmonic-comprehension-map.md:122-124`: the fa/ti poles are `[HYPOTHESIS]`; "zero framework hits — the terminology is novel to this map" | **GROUNDED (framed, excluded per OD-71-2)** |
| G-3 | The five universes' censuses | all counts/histograms/witness lists re-derived from ledger masks + tier/role partition + the landed D4 domain keys + mesh roots; validator independent | **GROUNDED** |
| G-4 | The baseline pair (B1/B2) and the Fisher tables | pre-registered in the artifact's `preRegistration.baselineLock`; computed once; B2 byte value corrected (0/28, not 2/28 — maintainer-prose class, §5) | **GROUNDED (with the §5 correction)** |
| G-5 | The lifted congruence | root-coherence re-verified over **all 126** ledger rotation-6 pairs; endpoint pair 1387/2773 mask- and root-coherent | **GROUNDED** |

## 3. The census (five universes x three measures) — V-BL-071-1 PASS

The three measures are **different operations** and are never merged: **(M-DISP)** single-pitch displacement 6 (a pair relation, defined on single-swap pairs); **(M-ROT)** mask rotation 6 (an exact transposition relation, defined on any pair); **(M-IC6)** interval-class-6 content (a per-state property, not a pair distance at all).

| Universe | Pairs/instances | Hamming-2 | M-DISP: displacement-6 | M-ROT: rotation-6 | M-IC6 (member states) |
|---|---|---|---|---|---|
| **D7-36** (D7 contact domain) | 36 | 36 | **12** (2 recorded + 10 unrecorded) | **0** | `{1: 21}` — all at one tritone |
| **D6-tier** (D6 anchors × D6 satellites) | 98 | 12 | 0 | 0 | `{1: 14, 2: 7}` |
| **A1-28** (the D4/fa-pole domain) | 28 | 24 (4 non-swap, Hamming 8) | **0** | **0** | `{1: 14, 2: 7, 3: 14}` |
| **A0-P7** (the A0 boundary ring, 7 edges) | 7 | 6 (six +1 swaps) | 0 | **1** (`2773:1387` — the ring closure) | `{1: 7}` |
| **D-anchor-49** (all D-tier anchor pairs) | 1176 | 69 | **15** | **12** (all seven tiers carry ≥1) | `{1: 21, 2: 21, 3: 7}` |

**The three measures disagree — and the disagreement is the finding.** M-DISP concentrates in the D7 domain (12/36 = 1/3) and is **absent** from the fa-pole domain (0/28) and the D6 tier (0/98); M-ROT is **absent from every contact domain** and lives only at the anchor-cycle scale; M-IC6 shows the boundary is **IC6-poor** (42 of 70 boundary states at IC6 = 1 vs 112 of 462 ledger-wide; 28/70 at IC6 ≥ 2 vs 322/392 non-boundary).

**The census's headline discovery (beyond the capture):** **both boundary seven-cycles close at rotation 6.** The D7 modal orbit's closure `4033→127` (h10, rot6 — the landed refinement) is mirrored by the A0 P7 ring's closure `2773→1387` (h10, rot6); each cycle's other six edges are uniform (rot11 ×6 for D7; +1 swaps ×6 for A0). Both closure pairs are Hamming-10 — the closure is not a swap but a whole-set tritone rotation. Additionally, **every one of the seven D-tier anchor families carries at least one rotation-6 anchor pair** (12/1176 total: D7 ×1, D6 ×2, D5 ×2, D4 ×1, D3 ×1, D2 ×3, D1 ×2), and the D-tier anchor space carries **15 displacement-6 pairs**, of which **6 are exactly fa↔ti (D4↔D7) pairs** (`127:631`, `1831:3847`, `2111:2363`, `2963:3971`, `3103:3229`, `3529:4033`) plus D1↔D5 ×6 and D2↔D2 ×3.

## 4. The baselines and the pre-registered Fisher tests — V-BL-071-3 PASS

**B1 (structural reach):** all 462-ledger unordered pairs — 106,491 pairs; 6,930 Hamming-2; displacement-6 = 630 (9.09% of the reach); rotation-6 = 126 pairs (30 of them Hamming-2). **B2 (D4/fa-pole domain control):** the 28-instance grant layer — 24 single-swap; **displacement-6 = 0**.

| Test | Table | p (exact rational, 24-digit decimal) | Verdict |
|---|---|---|---|
| TEST-1 (D7-36 vs B1) | 12/24 vs 630/6300 | `1664628353.../3127661049...` · 0.0000532… | **over-represented vs the structural reach** |
| TEST-2 (D7-36 vs B2) | 12/24 vs 0/28 | `5525/14496772` · 0.0003811… | **ti-pole-specific** (fa carries none) |
| TEST-2b (single-swap denominators) | 12/24 vs 0/24 | `372/415891` · 0.0008944… | same verdict (robustness) |
| TEST-3 (D-anchor rot6 vs ledger pair space) | 12/1164 vs 126/106365 | `3972341924.../8430635334...` · 0.0000000471… | rotation-6 is an anchor-family relation |
| TEST-4 (IC6 ≥ 2: non-boundary vs boundary) | 322/70 vs 28/42 | `2384397193.../1066438826...` · 0.00000000000223… | boundary is IC6-**poor**, not IC6-rich |

Both one-sided (greater); exact rationals byte-stable in the artifact. The pre-registered interpretation branches were fixed before the counts; the outcome is unambiguous: the displacement signature is **ti-pole-specific and supra-baseline**, the rotation signature is at the anchor scale, and the IC6 content carries **no** boundary signature (it runs the other way).

## 5. The B2 grounding correction (maintainer-prose class — the planning pass's own catch)

The approved planning pass pre-registered B2 as *"the D4 domain (28 instances) contains 2 instances at displacement 6 (the terminal far contacts — T-2's finding); D4-side rate 2/28."* **The bytes disagree: the D4 domain contains zero displacement-6 instances (0/28; 24 single-swap, 4 at Hamming 8).** The two tritone-displaced instances are D7-domain facts (`127:253` and `4033:2017` — 2 of the 14 recorded D7 contacts; 12 of the 36 D7-domain instances overall). The correction is recorded in-artifact (`baseline.b2.groundingCorrection`) as prose-class: **the baseline slot (D4 domain, displacement-6 rate) and the Fisher tables are exactly as pre-registered and unchanged** — only the pre-registered prose value is corrected against the bytes, before the comparison block was assembled. No post-hoc baseline adjustment occurred (the definitions and tables were fixed in the planning pass; the correction changes no computed quantity). The correction *strengthens* the result: the fa-pole is not merely weaker-marked, it is **tritone-free at the contact scale**.

## 6. The 7-27/7-31 split's tritone relationship — the deeper hunt's answer: **no**

The two families' pair geometry is maximally separated: across all 196 cross pairs, **no pair is a single-swap (0 Hamming-2), none is a rotation-6 partner (0/196), none is a complement (0/196)**; the Hamming histogram is `{4: 60, 6: 112, 8: 24}` — minimum distance 4 (they share at most 3 of 7 notes, never 6). The split follows **set-class identity**; the tritone enters only as the classes' **IC6 content contrast** (`7-27` carries 1 tritone per state; `7-31` carries 3 — their interval vectors `<344451>` vs `<336333>`), which is a *composition* difference, not a *relation* between the families. **Verdict `SPLIT_NOT_TRITONE_STRUCTURED`:** the contact split does not follow the 7-27/7-31 line *because* of a tritone relationship between the families; it follows class identity, with the tritone present only inside one family's content signature.

## 7. The lifted-space representation — **COMPUTABLE** (OD-71-4)

The fa/ti endpoints (`1387` = 7-35:1, the Locrian terminal; `2773` = 7-35:7, the Lydian terminal) are **exact rotation-6 partners** (`rotateMaskZ12^6(1387) = 2773`), and their canonical roots shift with the tritone (`root 1 → 7 = (1+6) mod 12`). Therefore, in the Phase A lifted space (node identity `{anchoredId}@{phase}`, 5,544 heptatonic lifted nodes, 9,504 total — `phase-a-probe.v1.json`):

> **for every phase p: `lifted(2773 @ (p+6) mod 12) = T_6(lifted(1387 @ p))`** — pitch classes *and* root both shift by the tritone. The endpoints' relation is exactly **phase-shift-6-stable**; it does not dissolve at any phase.

This is not endpoint-specific: the congruence holds for **all 126 ledger rotation-6 pairs** (root-coherence 126/126, zero mismatches), including the D7 modal closure `4033→127` (root 6 → 0). The lifted space preserves the tritone as a phase-cylinder correspondence. **Bounded note (recorded in-artifact):** this is a relation between lifted nodes, not a claim that T₆ is an admitted operator edge of the phase-extended topology — operator admissibility is not measured here.

## 8. The role verdict — the closed vocabulary, measure-decomposed

> **verdict: `mixed`.** M-DISP → **separation** (ti-local; not boundary-wide, not exclusion: the fully excluded class is displacement 4, and 2 of the 12 tritone-displaced instances *are* contacts); M-ROT → **transition** (the boundary cycles' closure interval at the anchor scale); M-IC6 → **none** (no over-representation; the boundary is IC6-poor). No single role fits all three measures. **No mechanism claim** — why the tritone plays these roles is out of scope (V-BL-071-4; BL-072's question family).

The exclusion candidate is **refuted** as a general law: the near-miss's misses are excluded by the *min-|Δ| rule's shape*, but at the geography level `|d| = 4` is the fully excluded class (0/12 recorded) while `|d| = 6` splits 2 recorded / 10 unrecorded. The separation candidate is **partial** (the ti domain is tritone-rich; the contacts themselves are ±1-dominated with exactly the two terminal far contacts at tritone displacement). The transition candidate is **supported at the closure scale** (both boundary cycles; all seven D-tier families).

## 9. The GSL-4 candidate draft (OD-71-5; un-promoted)

> **GSL-4 (candidate).** The tritone's role in the boundary geography is measure-dependent. (a) Displacement six is a ti-pole-local concentration — 12 of the 36 D7 contact-domain instances (1/3 against the 630/6930 structural baseline; the fa-pole domain carries none, 0/28), the two recorded instances being exactly the terminal far contacts `127:253` and `4033:2017`, while the fully excluded class is displacement four. (b) Rotation six is the boundary cycles' closure interval — both seven-cycles close at rotation six, and all seven D-tier anchor families carry at least one rotation-six pair (12/1176 against 126/106491). (c) IC6 content shows no boundary over-representation. The three measures disagree, and the disagreement is the characterization.

Recorded as a **candidate** (a new interval-geometric finding class, continuing the GSL series); admission to the governs semantic layer is a separate ruling — none occurs here.

## 10. Verification record (this landing)

| Check | Result |
|---|---|
| `npm run orrery:bl071-interval-6-structure:check` | PASS (generator `--check` fresh; validator PASS; 44 mutation probes rejected; 10 static rejections) |
| `npm run orrery:check` | exit 0 (all gates; `tsc --noEmit` clean) |
| `npm run orrery:test` | 37 files / 373 tests passed (11 new BL-071 pins) |
| `validate:ledger-pins` | unchanged at the BL-058 13-violation inventory (all D4-corridor files; zero added) |
| Static isolation | census-core region: label/status/network tokens absent (region + head); required masks-only tokens present; 10 static probes rejected |
| Manifest | regen (1,279 files); `validate:manifest` PASS |

## 11. Bounded non-accomplishments

No mechanism claim (why the tritone plays its roles stays open — BL-072). No claim event; no record amendment; no D7 claim or amendment (hypothesis-tier preserved). No GOVERNS admission (GSL-4 un-promoted). No directional-semantics assignment. No G1 movement; no INV-5 graduation; no M-walkability promotion. No canonical/Court/schema/Neo4j writes; no ledger writes. No lens application as evidence; the frame is vocabulary, not input. Session prose is context, not evidence.

## 12. Result in one paragraph

The interval-6 question is answered — as planning evidence, with the mechanism honestly open. The census across five universes and three distinct measures shows the tritone's role is **measure-dependent**: single-pitch tritone displacement is a **ti-pole-local concentration** (12/36 of the D7 contact domain, 1/3 vs the 9.09% structural baseline, TEST-1 p = 5.3e-5; the fa-pole domain carries none, TEST-2 p = 3.8e-4 — the signature is ti-specific, not boundary-wide) whose two recorded instances are exactly the terminal far contacts `127:253`/`4033:2017`; mask rotation 6 is the **boundary cycles' closure interval** (the new census discovery: the A0 P7 ring closes at rot6 exactly as the D7 modal orbit does; every D-tier anchor family carries rot6 pairs; TEST-3 p = 4.7e-8); IC6 content carries **no** boundary signature (the boundary is IC6-poor; TEST-4). The 7-27/7-31 split is **not tritone-structured** (0 swap / 0 rotation / 0 complement across 196 cross pairs — the split is class-structured, the tritone appearing only as the classes' IC6 content contrast). The fa/ti endpoints' lifted representation is **exact**: a phase-shift-6 congruence, root-coherent across all 126 rotation-6 pairs. The role verdict is **mixed** (separation / transition / none per measure), and the B2 pre-registration's prose value was **corrected against the bytes** (0/28, not 2/28) without touching the baseline slots or test tables. The three-way triangulation stands as **two landed findings plus one labelled frame**; GSL-4 — the tritone's role, measured, baselines pre-registered, mechanism open — awaits the maintainer's ruling. No claim, no amendment, no admission: the characterization is the deliverable.
