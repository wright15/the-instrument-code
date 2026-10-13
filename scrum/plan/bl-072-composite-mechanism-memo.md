# BL-072 — The composite's mechanism: min-|Δ| + reach-census, characterized (the verdict set) — findings memo

**Status:** sprint artifact. Planning evidence only. No ledger entry, no evidence obligations, no claims admitted, no verdicts of record, no admission of any kind. **No new measurement** (the census artifact is the grounding base; the analysis reads it and the landed BL-055 table — OD-72-1's descriptive-read boundary; any mismatch with the landed census was a halt, none occurred). **No mechanism (causal) claim beyond the verdict set:** the geometric localization is descriptive (production NOT ESTABLISHED); the recording remains granted (R_NONE carried). **C-TB-1's status is unchanged (`UNPROMOTED_DISCOVERY`):** separation ≠ derivation (the OD-66-2 / OD-70-5 bar); promotion is a maintainer ruling. D7 remains hypothesis-tier throughout (no D7 claim event, no D7 record amendment, no D7 derivation admission; ENTRY 15's D7 clause carries forward verbatim, `provenance/DECISION_LEDGER.md:2703-2712`). No GOVERNS admission (the GSL-7 draft is un-promoted; the GSL-4 refinement is inline, unapplied); no G1 movement; no INV-5 graduation; no M-walkability promotion; no canonical/Court/schema/Neo4j writes; no claim event; no record amendment. The frame (`scrum/plan/harmonic-comprehension-map.md` §§2.6/2.7) is interpretation vocabulary, never design input. Session prose is context, not evidence.

**Artifact:** `orrery/src/generated/bl072-composite-mechanism.v1.json` — status `planning_evidence` (raw-byte SHA-256 `8a06eaee…`; `investigationFingerprint` `45d0afd1…`). Generator `scripts/build-bl072-composite-mechanism.mjs`; independent validator `orrery/scripts/validate-bl072-composite-mechanism.mjs` (**64 mutation probes rejected** — 50 artifact-drift + 6 smuggled-read + 7 presence-strip + 1 proof-strip; 1 permissive probe passing; the two-sided static region check); pins `orrery/src/bl072-composite-mechanism.test.ts` (11 tests). Wired `orrery:bl072-composite-mechanism:check` (after `bl078-d7-retest:check`, before `bl080-governs-derivation:check`); full `orrery:check` exit 0; suite green; `validate:ledger-pins` PASS; manifest regen.

**Chain anchors (self-checked by fingerprint):** BL-068 `b0d65bd6…`; BL-070 `9db10a08…` (the grounding base, frozen); BL-071 `8b2a1f6c…`; BL-055 `6d11fd93…` (the cross-domain source). The literal pins live in the validator and pins only; the generator carries no 64-hex literal.

**Rulings executed (OD-72-1…OD-72-6, approved 2026-10-13).** OD-72-1: cross-domain scope — descriptive-read over the landed BL-055 table28; Term-B reported `NOT-APPLICABLE`, never constructed. OD-72-2: the permutation pre-registered (N=1000, seed 72072, fixed margins, the disclosure verbatim). OD-72-3: machine-checkable artifact + memo. OD-72-4: the minimality language closed (nine canonical landed singles + the 36 pairwise disjunctions; post-run expansion forbidden). OD-72-5: geometric scope confined to landed orders and witness lists. OD-72-6: the GSL treatment rule (minimality is language-relative and carries no admission weight; a new GSL entry requires a supported mechanism).

## 1. What was built

| Artifact | Path | Role |
|---|---|---|
| Generator | `scripts/build-bl072-composite-mechanism.mjs` | deterministic builder; two-region static discipline (the intrinsic region reads masks + mesh only; the comparison region reads the labelled targets); the property table, the per-term decomposition, the permutation, the geometry, the cross-domain read, the minimality enumeration, the verdict set |
| Artifact | `orrery/src/generated/bl072-composite-mechanism.v1.json` | the investigation: 36-row property table, the full 9 + 36 minimality tables, the permutation histogram, the verdict set, the GSL treatment |
| Validator | `orrery/scripts/validate-bl072-composite-mechanism.mjs` | independent re-derivation from the seven pinned sources; the two-sided static region check; 64 mutation probes rejected (artifact-drift, smuggled-read, presence-strip, proof-strip) + region-scoping probes (permissive pass, proof strip rejected) |
| Pins | `orrery/src/bl072-composite-mechanism.test.ts` | 11 vitest pins (header/chain/pre-registration, grounding, property table, per-term, permutation, geometry, cross-domain, minimality, verdict set, GSL treatment, accounting/fences) |
| Wiring | root `package.json` `orrery:bl072-composite-mechanism:check`; `orrery/package.json` `check`/`build` | runs after `bl078-d7-retest:check`, before `bl080-governs-derivation:check` |

## 2. Grounding receipt (verified at build; fail-loud, no mismatch halted)

| # | Claim (the brief's load-bearing fact) | Verification | Verdict |
|---|---|---|---|
| G-1 | The 36-instance domain; per-anchor 4/5/6/6/6/5/4; set-equal the landed BL-070 domain | re-derived masks-only; key-by-key set-equality vs the fingerprint-checked BL-070 artifact; per-anchor exact | **GROUNDED** |
| G-2 | 14 recorded / 22 unrecorded; deltas ±2 mod 7 (11+11) | the network seat-contact rows; the same-office subset equality; delta census `{2:11, 5:11}` | **GROUNDED** |
| G-3 | The composite `[|ΔpcSum| = 1] ∨ [reach-singleton]` → 14/0/0/22 | re-computed; equal to the landed `tieBreakCandidate.confusion`; landed status `UNPROMOTED_DISCOVERY` | **GROUNDED** |
| G-4 | The near-miss 12/0/2/22; misses exactly `127:253`, `4033:2017` | re-computed; equal to the landed `nearMiss`; both misses reach-singletons (parentCount 1) | **GROUNDED** |
| G-5 | The nine single-axis candidates all fail (cleanSplitCount 0) | the landed BL-070 summary `cleanSplitCount 0`; the analysis re-singles all nine (clean 0) | **GROUNDED** |
| G-6 | The BL-068 base (class-pure D6; office sole separator; GSL-3) | consumed by fingerprint self-check `b0d65bd6…` | **GROUNDED** |
| G-7 | The BL-074 structural facts (fa ±1-only; the D2 trio; the trichotomy) | cited from the landed memo; the fa histogram re-read `{1:24, 6:4}` on the BL-055 table | **GROUNDED** |
| G-8 | The 7-27/7-31 split is NOT tritone-structured | cited (BL-071/BL-074); no new pairs enumerated | **GROUNDED** |
| G-9 | The BL-055 table28 source, fingerprint `6d11fd93…` | self-checked; 28 rows; 14 observed; all parentH/satellite ids present in the ledger | **GROUNDED** |
| G-10 | The permutation methodology pre-registered before the run | N=1000, seed 72072, the statistic and the disclosure are in the artifact's `preRegistration` and in §5 below, verbatim | **GROUNDED** |

## 3. The property table (36 instances; the artifact carries the full row set)

Columns: mask, pcSum, ΔpcSum, single-pitch displacement, Hamming (2 throughout), reach count, multiplicity, inversion partner, class, chirality, orientation, office Δ, containment sign, Z-majority, shared-subnode count, rotation hits, IC equality, inversion-image, recorded status, per-term selection. The compact form (the composite's two terms and the recorded status marked):

| key | ΔpcSum | disp | reach | class | officeΔ | sign | Z-maj | status | term | composite |
|---|---|---|---|---|---|---|---|---|---|---|
| `127:191` | 1 | 1 | 2 | 7-2 | 0 | -6 | yes | recorded | A | selected |
| `127:253` | 6 | 6 | 1 | 7-2 | 0 | -1 | yes | recorded | B | selected |
| `127:1087` | 4 | 4 | 3 | 7-2 | 2 | 6 | no | — | — | — |
| `127:2143` | 6 | 6 | 3 | 7-2 | 2 | 5 | no | — | — | — |
| `2111:191` | 4 | -4 | 2 | 7-2 | 5 | -6 | yes | — | — | — |
| `2111:1087` | 1 | -1 | 3 | 7-2 | 0 | 6 | no | recorded | A | selected |
| `2111:2143` | 1 | 1 | 3 | 7-2 | 0 | 5 | no | recorded | A | selected |
| `2111:2591` | 4 | 4 | 3 | 7-2 | 2 | 1 | no | — | — | — |
| `2111:3119` | 6 | 6 | 3 | 7-2 | 2 | 7 | no | — | — | — |
| `3103:1087` | 6 | 6 | 3 | 7-2 | 5 | 6 | no | — | — | — |
| `3103:2143` | 4 | -4 | 3 | 7-2 | 5 | 5 | no | — | — | — |
| `3103:2591` | 1 | -1 | 3 | 7-2 | 0 | 1 | no | recorded | A | selected |
| `3103:3119` | 1 | 1 | 3 | 7-2 | 0 | 7 | no | recorded | A | selected |
| `3103:3343` | 4 | 4 | 3 | 7-2 | 2 | 3 | no | — | — | — |
| `3103:3607` | 6 | 6 | 3 | 7-2 | 2 | 3 | no | — | — | — |
| `3599:2591` | 6 | 6 | 3 | 7-2 | 5 | 1 | no | — | — | — |
| `3599:3119` | 4 | -4 | 3 | 7-2 | 5 | 7 | no | — | — | — |
| `3599:3343` | 1 | -1 | 3 | 7-2 | 0 | 3 | no | recorded | A | selected |
| `3599:3607` | 1 | 1 | 3 | 7-2 | 0 | 3 | no | recorded | A | selected |
| `3599:3719` | 4 | 4 | 3 | 7-2 | 2 | 7 | no | — | — | — |
| `3599:3851` | 6 | 6 | 3 | 7-2 | 2 | 1 | no | — | — | — |
| `3847:3343` | 6 | 6 | 3 | 7-2 | 5 | 3 | no | — | — | — |
| `3847:3607` | 4 | -4 | 3 | 7-2 | 5 | 3 | no | — | — | — |
| `3847:3719` | 1 | -1 | 3 | 7-2 | 0 | 7 | no | recorded | A | selected |
| `3847:3851` | 1 | 1 | 3 | 7-2 | 0 | 1 | no | recorded | A | selected |
| `3847:3907` | 4 | 4 | 3 | 7-2 | 2 | 5 | no | — | — | — |
| `3847:3973` | 6 | 6 | 3 | 7-2 | 2 | 6 | no | — | — | — |
| `3971:3719` | 6 | 6 | 3 | 7-2 | 5 | 7 | no | — | — | — |
| `3971:3851` | 4 | -4 | 3 | 7-2 | 5 | 1 | no | — | — | — |
| `3971:3907` | 1 | -1 | 3 | 7-2 | 0 | 5 | no | recorded | A | selected |
| `3971:3973` | 1 | 1 | 3 | 7-2 | 0 | 6 | no | recorded | A | selected |
| `3971:4001` | 4 | 4 | 2 | 7-2 | 2 | -6 | yes | — | — | — |
| `4033:2017` | 6 | 6 | 1 | 7-2 | 0 | -1 | yes | recorded | B | selected |
| `4033:3907` | 6 | 6 | 3 | 7-2 | 5 | 5 | no | — | — | — |
| `4033:3973` | 4 | -4 | 3 | 7-2 | 5 | 6 | no | — | — | — |
| `4033:4001` | 1 | -1 | 2 | 7-2 | 0 | -6 | yes | recorded | A | selected |

**Reading.** Every recorded instance sits at office Δ = 0 (the office rule's defining shape, comparison-only). The composite's Term-A rows are exactly the twelve |ΔpcSum| = 1 recorded instances; Term-B's two rows are the reach-singletons `127:253`/`4033:2017` at |ΔpcSum| = 6. No unrecorded instance falls under either term; the 22 unrecorded rows sit at |Δ| ∈ {4, 6} with reach 2–3.

## 4. The per-term decomposition (artifact `perTerm`)

| term | rule | confusion | selected |
|---|---|---|---|
| Term-A | `[|pcSum(anchor) − pcSum(satellite)| = 1]` | 12/0/2/22 (`NEAR_MISS_BOUNDARY`) | the 12 single-semitone substitutions |
| Term-B | `[reach-singleton: parentCount(satellite) = 1]` | 2/0/12/22 | `127:253`, `4033:2017` |
| joint | `Term-A ∨ Term-B` (C-TB-1) | **14/0/0/22** (`CLEAN_SPLIT`) | the 14 recorded contacts |

**Disjointness verified mechanically:** the overlap is empty (`12 + 2 = 14`); the residual is exact in both directions (no recorded instance outside the union, no selected non-recorded). **Whole-pair respect:** each term selects whole inversion pairs (Term-A: 6 pairs; Term-B: the pair 253↔2017); the joint selects all 7 pairs. The two terms are not competing descriptions — they partition the contact relation into its interior and terminal regimes.

## 5. The permutation baseline (H-Artifact; OD-72-2, pre-registered)

**Method (locked before the run):** the fixed 36-instance domain; labels = the recorded/unrecorded status with fixed margins 14/22; the composite's fixed 14-key selection S; 1000 iterations; mulberry32 PRNG seeded 72072; Fisher-Yates (descending) over the label vector; statistic = clean-split count (tp = 14, equivalently fp = fn = 0) + the TP histogram.

**Results:** **0/1000 shuffles reproduce the separation**; TP histogram (2: 9, 3: 57, 4: 174, 5: 263, 6: 270, 7: 170, 8: 49, 9: 8), sum 5474, mean 49/9, max 9; the empirical central 95% interval is [3, 8] — the observed TP = 14 lies far outside it. **Exact supplementary value:** exactly 1 of the C(36,14) = 3,796,297,200 uniform labelings reproduces it (pure arithmetic).

> **Selection-effect disclosure (verbatim, carried):** C-TB-1 was discovered by searching the composite space, not pre-registered — the permutation p-value is conditional on C-TB-1's selection from the search and should be interpreted as a lower bound, not as an independent confirmation.

**H-Artifact verdict: REFUTED.** The separation is not within random variation of the labeling. The pre-registered decision rule fired: cleanSplitCount = 0 **and** TP = 14 outside the central 95% interval. Scope note: this refutes the *label-randomness* reading; the *loose-coverage* reading is addressed separately by §8's minimality enumeration (the composite covers exactly 14 — zero slack, minimal in-language).

## 6. The geometric mapping (H-Geometric; OD-72-5, landed orders only)

**The orbit-window ladder (the finding's center).** The D7 modal orbit `127→2111→3103→3599→3847→3971→4033→127` induces a **consecutive-window structure** on the satellite reach census — every satellite is reached (Hamming-2) by a consecutive interval of orbit anchors:

| window | satellites | size |
|---|---|---|
| `[0]` | 253 | 1 (terminal) |
| `[0–1]` | 191 | 2 |
| `[0–2]` | 1087, 2143 | 3 |
| `[1–3]` | 2591, 3119 | 3 |
| `[2–4]` | 3343, 3607 | 3 |
| `[3–5]` | 3719, 3851 | 3 |
| `[4–6]` | 3907, 3973 | 3 |
| `[5–6]` | 4001 | 2 |
| `[6]` | 2017 | 1 (terminal) |

All 14 windows are consecutive (no gaps); the size histogram is `{1:2, 2:2, 3:10}`; the per-anchor counts 4/5/6/6/6/5/4 are exactly the window-overlap counts — the reach asymmetry is the ladder's overlap structure (the BL-070 calibration's geometric form, now derived). **Term-B = the ladder's endpoints:** the reach-singletons are exactly the size-1 terminals 253 (index 0) and 2017 (index 6). **Inversion symmetry:** pitch-inversion mirrors every window `k → 6−k`; the anchor pairing sums to index 6 (`127↔4033`, `2111↔3971`, `3103↔3847`; `3599` self-paired); the singleton pair (253, 2017) is an inversion pair; 191/4001 mirror likewise. **Closure alignment:** the two terminals' displacement is exactly 6 — the orbit's own closure interval (the unique `^6` rotation edge `4033→127`) — and the anchors of the singleton contacts are the orbit's inversion poles. **Office step (context):** the orbit's ledger office indices are `4,6,1,3,5,0,2` — a uniform `+2 mod 7` step (the recorded successor step; the same ±2 structure as the unrecorded remainder).

**The regime split (the mechanism's shape).** The contact relation decomposes into the ladder's two regimes: **interior** (window size ≥ 2) single-semitone substitutions — 12/14 contacts at |ΔpcSum| = 1; **terminal** (window size 1) tritone contacts — 2/14 at |ΔpcSum| = 6. The composite is exactly the interior rule ∨ the terminal rule.

**A0-P7 context (cited, no measurement):** the D7 orbit and the A0 P7 ring are one structure in two canonically related coordinate systems (T1 = x→5x; BL-075); the A0 closure pair `{2773,1387}` is the coordinate image of the D7 closure pair `{4033,127}`; the family-level action pairs 7-1↔7-35 (BL-076). No A0 computation occurs here.

**H-Geometric verdict: SUPPORTED (descriptive localization).** All three pre-registered structural checks pass and the mapping is non-vacuous. **Production clause: NOT ESTABLISHED** — the geometry localizes the composite's two terms; it does not derive the recorded relation (R_NONE carried: the recording remains granted).

## 7. The cross-domain check (H-Informational; OD-72-1)

**Source:** the landed BL-055 table28 (`6d11fd93…`), 28 keys, 14 observed — a **class-mixed** domain (14 × 7-27 observed + 14 × 7-31 unobserved), office-flat.

**Term-A on the fa table:** |ΔpcSum| histogram `{1: 24, 6: 4}`; selection = 24 keys; confusion **12/12/2/2** (`NON_SEPARATING`): the term selects **both classes in equal number (7-27: 12, 7-31: 12)** and reproduces neither the class split nor the observed set; the two missed observed keys are `1:3497`, `5:695` — the fa-pole's own two tritone-displaced contacts (a mirror of the D7 terminal structure, recorded as characterization, not overclaimed). **Term-B: `NOT_APPLICABLE`** — the fa table is a granted enumeration with no landed Hamming-2 reach census (no `parentCount` counterpart); per OD-72-1 no counterpart is constructed — the language-relative limit is itself the finding. The composite on fa therefore degenerates to Term-A.

**H-Informational verdict: SUPPORTED (scope-limited).** The composite's separation does not survive on the class-mixed domain: it is a D7-domain property. **Attribution: INDETERMINATE within the supported finding** — the check cannot separate class-purity dependence from reach-geometry dependence (Term-B's inapplicability is itself the confound).

## 8. The minimality enumeration (H-Primitive; OD-72-4, exhaustive)

**The language (closed before the run):** the nine canonical landed single-axis predicates (C-M1…C-M9's primary expressions) + all 36 unordered pairwise disjunctions; no conjunctions, no 3+-term rules, no new thresholds. The excluded landed sub-rules are recorded in the artifact's appendix table (C-M1.r2 10/16/4/6; C-M2.r2 0/0/14/22; C-M3.r2 7/0/7/22; C-M3.r3 8/3/6/19; C-M5.r2 2/10/12/12; C-M8.r2 14/22/0/0; C-M9.r2 2/2/12/20; C-M9.r3 10/20/4/2).

**Singles (9; clean = 0):**

| id | candidate | expression | confusion | verdict |
|---|---|---|---|---|
| P1 | C-M1 | `[shared subnode count >= 6]` | 0/0/14/22 | NON_SEPARATING |
| P2 | C-M2 | `[rotation hit >= 1]` | 0/0/14/22 | NON_SEPARATING |
| P3 | C-M3 | `[|pcSum(anchor) − pcSum(satellite)| = 1]` | 12/0/2/22 | NEAR_MISS_BOUNDARY |
| P4 | C-M4 | `[nonZ < Z]` | 4/2/10/20 | NON_SEPARATING |
| P5 | C-M5 | `[|single-pitch displacement| = 1]` | 12/0/2/22 | NEAR_MISS_BOUNDARY |
| P6 | C-M6 | `[IC(anchor) = IC(satellite)]` | 0/0/14/22 | NON_SEPARATING |
| P7 | C-M7 | `[satellite orientation = A]` (labelled) | 7/11/7/11 | NON_SEPARATING |
| P8 | C-M8 | `[invertMask12(anchor) = satellite]` | 0/0/14/22 | NON_SEPARATING |
| P9 | C-M9 | `[reach-singleton: parentCount = 1]` | 2/0/12/22 | NON_SEPARATING |

**Pairs (36; the full table with confusion matrices is the artifact's `minimality.pairs` — the proof by inspection):** exactly two pairs clean-split: **`P3+P9`** and **`P5+P9`** (both 14/0/0/22). They are one equivalence class: P3 ≡ P5 as selections on this domain (identical selection sets — the two near-miss lenses). **Unique minimal description (up to degeneracy):** `{P3∨P9}` = `{min-|Δ| ∨ reach-singleton}` = C-TB-1. The nearest non-clean pairs: `P3+P4` and `P4+P5` at 14/2/0/20 (the Z-majority term adds two non-contacts); `P7+P9` at 8/11/6/11. Degeneracy classes: `{P1,P2,P6,P8}` (empty), `{P3,P5}`, `{P4}`, `{P7}`, `{P9}`.

**H-Primitive verdict: SUPPORTED (language-relative).** No single predicate clean-splits; the minimal clean-split cardinality is 2; the composite is in the minimal set (uniquely, up to the P3 ≡ P5 degeneracy). **Scope:** minimality holds within the OD-72-4 language only; it does not establish the absence of a simpler rule elsewhere; the "no deeper mechanism" clause is not testable by this enumeration and is not claimed; carries no admission weight (OD-72-6).

## 9. The verdict set (non-exclusive; the GSL treatment per OD-72-6)

> **OD-72-6's distinction (stated explicitly, per the precision note):** minimality is a *language-relative description* ("no simpler rule in the tested language achieves this"); mechanism is a *language-independent cause* ("the boundary layer's structure produces this selection because [reason]"). A minimality finding supports H-Primitive but does **not**, by itself, justify a new GSL entry — a different language might find a simpler rule. A mechanism finding (H-Geometric or H-Informational supported) justifies a new GSL entry because the geometric or informational basis exists regardless of the rule language.

| hypothesis | verdict | evidence | scope notes |
|---|---|---|---|
| **H-Geometric** | **SUPPORTED** | the orbit-window ladder; the terminal localization; the inversion mirroring; the closure alignment (§6) | descriptive localization; **production NOT ESTABLISHED** (R_NONE carried) |
| **H-Informational** | **SUPPORTED** | Term-A 12/12/2/2 on the class-mixed fa table; Term-B `NOT-APPLICABLE` (§7) | attribution **INDETERMINATE** (class purity vs reach geometry) |
| **H-Artifact** | **REFUTED** | 0/1000 clean splits; TP = 14 above the [3, 8] central interval; exact 1/C(36,14) (§5) | conditional on the composite's selection from the search (the verbatim disclosure) |
| **H-Primitive** | **SUPPORTED** | no clean single; minimal cardinality 2; the unique minimal pair (§8) | language-relative; no admission weight |

**The synthesis.** The composite's mechanism is characterized as its **geometric regime split**: the ti-pole's reach geography is an orbit-window ladder; the contact relation is semitone-exclusive on the ladder's interior (12/14) and tritone-terminal at the ladder's collapsing endpoints (2/14); the composite is the interior rule ∨ the terminal rule. The separation is not an artifact of chance labeling; it is minimal within the tested language; it does not transfer to a class-mixed domain. The recording itself remains granted — the causal question stays open, recorded not closed.

## 10. GSL treatment (per OD-72-6)

- **GSL-4 annotated refinement (inline, unapplied; no status change, no new GSL number):** the interval-6 structure's terminal face — the two recorded displacement-6 contacts (`127:253`, `4033:2017`) are exactly the reach-singleton terminals of the D7 orbit (window size 1, at the inversion poles); their displacement equals the orbit's closure interval (6; the unique `^6` rotation edge `4033→127`); the near-miss's misses are the terminal regime; the interior regime is semitone-exclusive.
- **GSL-7 candidate draft (un-promoted; for maintainer ruling):** *the composite's separation is the ti-pole reach-geography's two-regime rule.* The D7 orbit induces the consecutive-window ladder on the satellite reach census; the interior windows carry the semitone-exclusive substitutions; the size-1 terminals are exactly the orbit's tritone contacts (an inversion pair, displacement = the closure interval); the composite `[|ΔpcSum| = 1] ∨ [reach-singleton]` is the interior regime ∨ the terminal regime, and its clean separation is language-independent (any language expressing the two regimes reproduces it). **Condition:** OD-72-6's promotion condition is met at the characterization level (H-Geometric supported — the orbit-window structure is language-independent; H-Informational supported — the separation does not transfer cross-domain). **Caveat:** the recording remains granted (R_NONE carried); production NOT ESTABLISHED; the entry is a draft, never an admission. **Registration:** none performed by this artifact; registration into the synthesis/map is a separate disposition.

## 11. Verification record (this landing)

| Check | Result |
|---|---|
| `npm run orrery:bl072-composite-mechanism:check` | PASS (generator `--check` fresh; validator PASS; 64 mutation probes rejected; permissive probe passed; proof strip rejected) |
| `npm run orrery:check` | exit 0 (full chain incl. `tsc --noEmit`) |
| `npm run orrery:test` | suite green (11 new BL-072 pins) |
| `validate:ledger-pins` | PASS (zero violations; the new generator scanned as a ledger consumer, clean) |
| `validate:prose-consistency` | PASS (zero violations; no new full-length fingerprint literals in prose) |
| `validate:manifest` | PASS; manifest/checksums regen |
| Static isolation | forbidden tokens absent from the intrinsic region (two-sided, region-scoped); required masks-only tokens present; 6 smuggled-read + 7 presence-strip probes rejected; the comparison-region proof holds |

## 12. Bounded non-accomplishments

No new measurement (the census artifact is the grounding base; the BL-055 table is read, not extended; no fa-pole reach census is constructed). No mechanism (causal) claim beyond the verdict set: the geometric localization is descriptive; production NOT ESTABLISHED; the causal question stays open. No claim event; no record amendment; no GOVERNS admission (the GSL-7 draft is un-promoted; the GSL-4 refinement is inline, unapplied). No C-TB-1 promotion — the composite's status is unchanged (`UNPROMOTED_DISCOVERY`). No G1 movement; no INV-5 graduation; no M-walkability promotion; no directional-semantics assignment. No canonical/Court/schema/Neo4j writes; no ledger writes; no D4/D7 record movement. No new universe enumeration or pair discovery beyond the landed witness lists (OD-72-5). Session prose is context, not evidence.

## 13. Result in one paragraph

The composite's separation is not a chance artifact and not a mystery of shape: it is the D7 orbit's two-regime contact geometry. The reach census of the seven modal-orbit anchors is a consecutive-window ladder (sizes 1/2/3; the per-anchor 4/5/6/6/6/5/4 is its overlap structure); the ladder's size-1 terminals are exactly the two tritone contacts `127:253` and `4033:2017` (an inversion pair at the orbit's poles, displacement equal to the closure interval 6); the ladder's interior carries the twelve single-semitone contacts. The composite `[|ΔpcSum| = 1] ∨ [reach-singleton]` is the interior regime ∨ the terminal regime — disjoint, jointly exact, whole-pair-preserving. The pre-registered permutation refutes the label-randomness reading (0/1000; exact 1/C(36,14)), with the selection-effect disclosure carried verbatim. The class-mixed cross-domain read (Term-A 12/12/2/2 on the fa table; Term-B NOT-APPLICABLE) shows the separation is a D7 property, with the attribution honestly indeterminate between class purity and reach geometry. The minimality enumeration (9 singles, 36 pairs, exhaustive) finds the composite the unique minimal description within the tested language — language-relative, no admission weight. The verdict set is: H-Geometric SUPPORTED (production NOT ESTABLISHED), H-Informational SUPPORTED (attribution INDETERMINATE), H-Artifact REFUTED (disclosure carried), H-Primitive SUPPORTED (language-relative). No claim, no amendment, no admission — the mechanism characterized, the causal question open, is the deliverable.

## 14. Post-landing disposition register (maintainer disposition 2026-10-13)

The disposition ratifies the landed reading — **no artifact bytes change** (`investigationFingerprint` `45d0afd1…` unchanged; no re-pin, no validator change, no pins change) and no record amendment occurs.

- **The GSL treatment — ruled: the GSL-4 annotated refinement stands; no new GSL entry.** The governs semantic layer's next entry is the **GSL-4 annotated refinement** (the terminal-face observation, the displacement-closure connection, the window-ladder structure) — **inline, unapplied, cited to the BL-072 artifact** (no status change, no new GSL number). **No new GSL entry:** the GSL-7 candidate stands recorded, un-promoted; minimality alone carries no admission weight (OD-72-6), and the geometric/informational basis is supported but the mechanism is un-established (production NOT ESTABLISHED), so the promotion condition is not met at ruling time. The BL-074 precedent is followed exactly (memo-level annotation, not a synthesis registration).
- **The verdict-set decode recognized.** Three of four hypotheses supported, non-exclusive: geometric (the orbit's window ladder localizes the separation), informational (the terms transfer across domains; the separation does not — the composite's mechanism is the interaction with the domain's composition), not-artifact (permutation-refuted, 0/1000; exact 1/C(36,14)), and minimal (the unique shortest description in the tested language, up to the P3 ≡ P5 degeneracy). The composite's mechanism is **characterized**; the domain-conditional interaction is the open thread; the causal question stays open.
- **Follow-on capture:** `BL-084` — the window-ladder structure (is it unique to the D₇ orbit, or does it generalize to other cycles?). Registered in `scrum/BACKLOG.md`; no new work performed here.
- **Push:** held per "push when batching" (the landing commit `2f61fa2` is local; the batch push is a separate discipline).
