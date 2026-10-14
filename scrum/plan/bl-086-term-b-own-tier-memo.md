# BL-086 — The A₀ own-tier Term-B test: the alignment principle's live prediction (the A1-top-A2 discriminating experiment) — findings memo

**Status:** sprint artifact. Planning evidence only. No ledger entry, no evidence obligations, no claims admitted, no verdicts of record, no admission of any kind. **No new measurement** — the analysis reads landed artifacts only (`orrery/src/generated/bl084-window-ladder.v1.json` — the grounding base; `orrery/src/generated/bl072-composite-mechanism.v1.json` — the fixed predicate; `orrery/src/generated/bl073-isometry-probe.v1.json` — the A0 order; `orrery/src/generated/d-tier-operator-probe.v1.json` — the A1 order; `canonical/universal-heptatonic-ledger.csv` — masks and the tier/role partition); the window re-derivation is a **descriptive-read over landed bytes** by ruling OD-1 (properties of already-landed data re-derived through the landed code path — not new measurement, not a new universe, not pair discovery); any mismatch with a landed artifact is a halt — none occurred (the re-derivation matched both supplementary layer records field-for-field). **The predicate is fixed by prior art (BL-072 Term-B, verbatim): no redefinition, no tuning, no parameter search.** **No mechanism (causal) claim beyond the verdict:** the production question stays open. D7 remains hypothesis-tier throughout (no D7 claim event, no D7 record amendment, no D7 derivation admission; ENTRY 15's D7 clause carries forward verbatim). No GOVERNS admission; no new GSL number (the GSL-4 annotated refinement stays inline, unapplied); no GSL-7 status change. No G1 movement; no INV-5 graduation; no M-walkability promotion; no directional-semantics assignment; no canonical/Court/schema/Neo4j writes; no claim event; no record amendment (ENTRY 10/15/16/17/18/19/20/21 byte-untouched). The frame (`scrum/plan/harmonic-comprehension-map.md` §§2.6/2.7) is interpretation vocabulary, never design input. Session prose is context, not evidence.

**What this is.** BL-085's one live prediction (memo §3, appendix row 9; backlog v1.65): the A₀ own-tier layer — FULL / TWO_REGIME, window-size histogram {1:28, 2:10} — where the alignment principle predicts Term-B **applicable** and the predicate would select **28/38**, a proper subset of the layer. Unobserved at BL-085's landing. This sprint computes the predicate on the landed census, with the A1-top-A2 case (same histogram, no ladder) as the pre-registered **discriminating experiment** between the histogram-tracking and ladder-tracking readings of the principle. The ruling set (OD-1…OD-4, maintainer-approved 2026-10-14) is recorded in §1.7.

**Rulings executed (OD-1…OD-4, approved 2026-10-14).** OD-1: the window re-derivation is **analysis, not re-measurement** (descriptive-read over landed bytes; criterion (b) proceeds un-weakened; the fence prohibits new universes, new pair discovery, new witness discovery — not property re-derivation of landed data). OD-2: **memo-first; artifact-on-Branch-X-or-refutation** (a Branch H or L result is prose-grade — the interpretation is the finding; Branch X or a core refutation is diagnostic and escalates to a machine-checkable artifact). OD-3: **the A1-top-A2 predicate is computed in-sprint** (the three-branch classification is complete at landing, not deferred). OD-4: the terminal operationalization is fixed (below, §1.3) with the maintainer's correction — the {1:28} singletons are the singleton **windows**; the terminals are the **endpoints** of the consecutive sequence (the P₇ line's degree-1 nodes 1387/2773); the question is whether the two coincide again on A₀.

## 0. Grounding receipt (verified at registration, read-only; fail-loud, no mismatch halted)

| # | Claim (the load-bearing fact) | Verification | Verdict |
|---|---|---|---|
| G-1 | **Gate 1 — the A₀ own-tier reach census is landed**, in BL-084's artifact (`scopeB.supplementaryCycles[0]`, tier A0, forte 7-35) | artifact read at `orrery/src/generated/bl084-window-ladder.v1.json`; `investigationFingerprint` recomputed from the core — `6865b076…` EXACT; raw-byte `88c1a92f…`; the layer record present with the full census fields | **GROUNDED (EXACT); Gate 1 PASS — proceed (no halt)** |
| G-2 | The A₀ own-tier layer's census: **FULL / TWO_REGIME**; histogram **{1:28, 2:10}**; reach 38/42; instances 48; per-anchor **8/7/6/6/6/7/8**; `allConsecutive` T, `overlapMatch` T, `hasInterior` T, `hasTerminal` T; mirror T | the `layers[0]` record read field-for-field (all fields as listed; `shapeClass` TWO_REGIME; `verdict` FULL) | **GROUNDED (EXACT)** |
| G-3 | The A1-top-A2 case (the discriminating experiment): tier A1 cycle, top layer A2 — **ABSENT / NON_CONSECUTIVE**; histogram **{1:28, 2:10}**; reach 38/42; instances 48; per-anchor 7/5/5/7/8/8/8; `allConsecutive` **F**, `overlapMatch` T; mirror F | the `supplementaryCycles[1].layers[0]` record read field-for-field | **GROUNDED (EXACT)** |
| G-4 | BL-085's live prediction row + the A1 appendix row | `scrum/plan/bl-085-alignment-prediction-memo.md` §3: "A₀ own-tier layer … predicate would select 28/38 — proper subset of a two-regime layer — **LIVE, unobserved**"; "A1 cycle (top A2) … predicate 28/38 — fragmented, no ladder"; backlog v1.65 | **GROUNDED** |
| G-5 | BL-072's Term-B definition (the fixed predicate) | `bl072-composite-mechanism.v1.json` (fp `45d0afd1…` EXACT; raw-byte `8a06eaee…`) `perTerm.termB`: C-M9/P9, expression `[reach-singleton: parentCount(satellite) = 1]`; D7 confusion 2/0/12/22; keys `127:253`/`4033:2017` | **GROUNDED (EXACT)** |
| G-6 | The A₀ order and its endpoints: `1387→1451→1453→1709→1717→2741→2773`; closure `2773→1387` `^6` Hamming-10; endpoints 1387 (index 0) / 2773 (index 6) | `bl073-isometry-probe.v1.json` `cycles.A0.order` + `closureEdge` read (fp `811fa786…` self-checked at BL-084); BL-063 grounding (the P₇ line's degree-1 nodes 1387/2773; `scrum/plan/bl-063-office-reconstruction-memo.md:106`); equals the BL-084 supplementary A0 order | **GROUNDED (EXACT)** |
| G-7 | The A1 cycle order: `1371→2733→1707→2901→1749→1461→1389` | `d-tier-operator-probe.v1.json` `modalClosure.aToA.cycles` tier A1 `stateIds` (fp `068f9007…` self-checked at BL-084); equals the BL-084 supplementary A1 order | **GROUNDED (EXACT)** |
| G-8 | The layer populations: tier-A0 satellites 42, tier-A2 satellites 42 (the census read from the canonical ledger's tier/role partition) | ledger row census 462; satellite counts by tier A0 42 / A1 28 / A2 42 — matching each record's `satelliteCount` | **GROUNDED (EXACT)** |

**Gate 1 verdict: PASS** — the A₀ own-tier reach census is landed (artifact + fingerprint), and the `{1:28, 2:10}` histogram is verified field-for-field against the artifact (not merely cited). The sprints proceeds to the pre-registration; no halt.

## 1. Pre-registration (binding; fixed before any computation)

### 1.1 The predicate (OD-2 of the directive — fixed by prior art)

**Term-B exactly as defined in BL-072:** `[reach-singleton: parentCount(satellite) = 1]`, where `parentCount(satellite)` = the number of cycle anchors Hamming-2-reachable to the satellite (a size-1 window). No redefinition, no tuning, no parameter search. The D7-defined role, restated for the test: the term **selects** iff it plays its D7-defined role — selecting the terminal regime of a consecutive ladder as a proper subset of the reached layer (the BL-085 §0 operationalization, inherited verbatim; a predicate true on the whole layer is a restatement under the BL-068/C2 house standard, never a selection).

### 1.2 The test layers and the scoring method

- **A₀ own-tier layer:** cycle = the A0 P₇ ring (order G-6), layer = the tier-A0 satellites (42; landed record G-2).
- **A1-top-A2 layer:** cycle = the A1 cycle (order G-7), layer = the tier-A2 satellites (42; landed record G-3).
- **Method (OD-1; the BL-084 OD-84-5 same-code-path discipline):** the windows are re-derived by importing the BL-084 generator's `windowAnalysis` (masks-only Hamming-2 reach arithmetic) and passing the landed orders and the ledger's tier/role partition. **The re-derived layer records must match the landed supplementary records field-for-field** (histogram, per-anchor counts, flags, reached/satellite/instance counts, mirror); **any mismatch is a halt and reconcile — no verdict on mismatched data.**
- The predicate's mechanical outcome = the count of size-1 windows over the reached layer; reported as `selected/reached`. The selection's positional census: `s_i` = size-1 windows at index `i`; `d_i` = size-2 windows at `[i, i+1]`.

### 1.3 Confirmation criteria (both required for full confirmation; the terminal operationalization ruled OD-4)

**(a) Selectivity.** The predicate selects exactly **28/38** on the A₀ own-tier layer — the 28 singletons, a proper subset of the two-regime layer.

**(b) Terminal correspondence — exact operationalization (fixed before computation).** The terminal positions are the P₇ line's **endpoints** — the degree-1 nodes 1387 (index 0) and 2773 (index 6) of the landed BL-073 order — *not* the singleton set; the {1:28} singletons are the singleton **windows**. The **terminal-adjacent windows** are the windows whose index set contains index 0 or index 6: the **pole windows** `[0]` and `[6]`, and the one-step windows `[0,1]` and `[5,6]`. The check has three parts:

- **(b1) Pole occupancy:** the pole windows `[0]` and `[6]` exist among the re-derived windows (size-1 by construction, hence in the selected 28). The D₇-exact analogue: D₇'s two terminals *were* its pole windows.
- **(b2) Regime adjacency:** where present, the one-step windows `[0,1]` and `[5,6]` are interior windows (size 2) — the second position carries the interior regime, as in D₇ (`[0,1]`/`[5,6]` were size 2 next to the size-1 poles). *Automatic when such windows exist (a consecutive window at `[0,1]` has size 2 by definition); recorded, non-discriminating.*
- **(b3) Terminal dominance:** the selected singletons are (tied-)maximally concentrated at the terminal positions: `s_0 = s_6 = max_i s_i`. The D₇ analogue: D₇'s singletons sat solely at its endpoints — trivially maximal. *This is the discriminating component: it fails if the singleton regime is central rather than terminal.*

**(b) passes iff b1 ∧ b2 ∧ b3.** Two pre-registered force notes: **(i)** b1 is entailed by the landed fields — `perAnchor[0] = 8`, mirror true, and 10 doubles ⟹ `s_0 = 8 − d_0 ≥ 8 − 5 = 3 > 0` (the pole window exists); the re-derivation verifies it. **(ii)** mirror=true entails `s_i = s_{6−i}` — the check is symmetric at both ends; the expected symmetry (OD-4) is verified in the re-derivation. A (b) failure is reported by sub-check (b1 vs b3) with the full positional census.

### 1.4 The pre-registered prediction

**The A₀ own-tier layer: the predicate selects exactly 28/38** — the 28 singletons, a proper subset of the two-regime layer — **and the selection corresponds to the ladder's terminal positions** (the maintainer's live prediction, tested for the first time; stated before any computation).

### 1.5 Refutation and partial-outcome modes (pre-registered)

- **(i)** The predicate selects empty or full (0/38 or 38/38) → **no selectivity: the prediction fails**; the principle's boundary is mapped at FULL-with-terminals.
- **(ii)** The predicate selects 28/38 but (b) fails (b1 or b3) → **selectivity without the terminal-regime correspondence: partial**; re-scope (the principle predicts selectivity but not the regime structure).
- **(iii)** The re-derived census does not match the landed `{1:28, 2:10}` histograms (either layer) → **grounding failure: halt and reconcile**; no verdict on mismatched data.

### 1.6 The A1-top-A2 discriminating experiment — three-branch pre-registration (fixed before computation; the OD-4 correction applied)

The pair {A0 own-tier (ladder present), A1-top-A2 (same histogram by landed census, no ladder)} separates "**the principle predicts selectivity**" (the count) from "**the principle predicts the ladder**" (the structure). The mechanical predicate's firing is knowable from the landed histograms — **28/38 on both** — and is recorded as the mechanical-level component under *every* branch (the predicate's firing is a function of the window-size histogram, hence blind to consecutiveness). **The branch classification is made at the selection level** (the §1.1 operationalization): A1 is non-consecutive by landed data — its firing is the pre-registered FRAGMENTED_NO_LADDER class, never a selection; A0's status depends on the terminal check (b).

- **Branch L (ladder-tracking)** — fires iff A0 passes (a) ∧ (b): the A0 selection occupies the terminal positions (pole occupancy + terminal dominance) while A1's identical firing, no ladder, is no selection. *Reading:* the operative structure the principle tracks is the ladder's reach-order alignment; the count is histogram-forced and necessary-but-not-sufficient; "FULL-with-terminals" as the applicability condition means applicability is a property of the regime structure (consecutiveness + terminal correspondence) — the notes' branch 2, with the maintainer's coincidence reading (the singleton windows coincide again with the endpoints).
- **Branch H (histogram-tracking)** — fires iff A0's (a) holds but (b) fails: the 28/38 firing exists on a genuine ladder yet the selection does not occupy the terminal positions; A1's identical count without a ladder corroborates. *Reading:* the selection tracks the size histogram; the singleton windows are position-blind; "FULL-with-terminals" would need re-grounding (the terminals would play no role in the selection) — the notes' branch 1 content applied at the discriminating observation (the maintainer's correction: "if they don't [coincide], that's the finding about whether the singleton windows track the endpoints or the histogram").
- **Branch X (unmodeled)** — fires iff neither: any configuration not matching H or L (a re-derivation deviation from the landed census — halt/reconcile first; an undecidable terminal census; any other unmodeled outcome). *Reading:* the pair does not separate the readings; something unmodeled is operating; **artifact escalation triggers (OD-2)**.

**Pre-committed relation:** given (a) holds on A0 (entailed by the landed histogram, subject to re-derivation), {L, H} exhaust the (b) outcomes and X catches everything else — the classification is exhaustive and deterministic *before* any computation. Under **every** branch the mechanical-level fact (28/38 on both layers; A1's identical firing carries no ladder) is recorded.

### 1.7 The rulings (OD-1…OD-4, maintainer-approved 2026-10-14; recorded verbatim in substance)

- **OD-1 — window re-derivation is analysis, not re-measurement.** The masks-only Hamming-2 reach arithmetic through the BL-084 code path is a descriptive-read over landed bytes (the OD-74-1 Descriptive-Read class: reading the properties of listed witnesses from landed sources). The fence's no-new-measurement rule prohibits new universes, new pair discovery, and new witness discovery — it does not prohibit re-deriving properties of already-landed data. Criterion (b) proceeds un-weakened.
- **OD-2 — landing form: memo-first; artifact-on-Branch-X-or-refutation.** The three-branch structure makes the result interpretively significant regardless of branch — but a Branch H or L result is prose-grade (the interpretation is the finding); a Branch X result is diagnostic (something unmodeled is operating) and warrants a machine-checkable artifact for reproducibility; likewise any core refutation. No artifact landed this sprint unless X or refutation fires.
- **OD-3 — A1-top-A2 computed in-sprint** (the discriminating experiment needs the datum; the predicate is fixed, the census landed; the three-branch classification is complete at landing).
- **OD-4 — terminal operationalization** as §1.3 (pole windows, adjacency, dominance; the mirror structure as the expected symmetry; the correction that singletons ≠ terminals and the question is whether they coincide).

### 1.8 Process and fail-loud clauses

Grounding receipt (§0, Gate 1) → this pre-registration (fixed before any computation) → computation (the re-derivation and the predicate) → memo → fast-lane commit. **Fail-loud:** census not landed → halt (Gate 1 — PASSED); histogram mismatch on read → halt and reconcile; any prediction computed before registration → protocol violation (none — the computation follows this text). Everything inline; the pre-registration prefix (this file, through §1.8) is frozen at this point and the results are appended below without editing it.

## 2. The computation (executed after the §0/§1 prefix was frozen; method §1.2)

**The re-derivation gate: EXACT, both layers.** The windows were re-derived by importing the BL-084 generator's `windowAnalysis` (masks-only Hamming-2 reach arithmetic; the OD-84-5 same-code-path discipline) over the landed BL-073 A0 order, the probe's A1 order, and the ledger's tier/role partition. **The re-derived records match the landed supplementary layer records field-for-field** — the A₀ own-tier layer (FULL / TWO_REGIME / `{1:28, 2:10}` / reach 38/42 / per-anchor `8/7/6/6/6/7/8` / mirror T) and the A1-top-A2 layer (ABSENT / NON_CONSECUTIVE / `{1:28, 2:10}` / reach 38/42 / per-anchor `7/5/5/7/8/8/8` / mirror F). No mismatch occurred (refutation mode (iii) does not fire). The BL-084 generator's `--check` was re-run fresh (`stale: false`; fp `6865b076…` unchanged) — the census base is the landed one.

### 2.1 The A₀ own-tier window census (38 windows; re-derived, not measured)

| window | states | size | parents (reaching anchors) |
|---|---|---|---|
| `[0]` | 1383, 1395, 1643, 2411, 3433, 875 | 1 (×6) | `1387` |
| `[0,1]` | 1259, 1483 | 2 (×2) | `1387`, `1451` |
| `[1]` | 1435, 1459, 2475, 939 | 1 (×4) | `1451` |
| `[1,2]` | 1447 | 2 (×1) | `1451`, `1453` |
| `[2]` | 1437, 1485, 2477 | 1 (×3) | `1453` |
| `[2,3]` | 1837, 941 | 2 (×2) | `1453`, `1709` |
| `[3]` | 1645, 1741 | 1 (×2) | `1709` |
| `[3,4]` | 1693, 1721 | 2 (×2) | `1709`, `1717` |
| `[4]` | 1653, 1715, 1845 | 1 (×3) | `1717` |
| `[4,5]` | 3253 | 2 (×1) | `1717`, `2741` |
| `[5]` | 2485, 2739, 2745, 2869 | 1 (×4) | `2741` |
| `[5,6]` | 2677, 2789 | 2 (×2) | `2741`, `2773` |
| `[6]` | 2517, 2765, 2771, 2777, 3285, 727 | 1 (×6) | `2773` |

All 38 windows are consecutive intervals; 28 size-1 + 10 size-2; the positional census is `s = [6, 4, 3, 2, 3, 4, 6]` (size-1 windows at each index) and `d = [2, 1, 2, 2, 1, 2]` (size-2 windows starting at each index) — mirror-symmetric, matching the landed `mirror: true`. The singleton profile is **maximal at the endpoints and strictly decreasing inward** (6 → 4 → 3 → 2), the doubles spread one-step across the order.

### 2.2 The predicate on the A₀ own-tier layer

**The predicate (BL-072 Term-B, verbatim: `[reach-singleton: parentCount(satellite) = 1]`) selects exactly 28/38** — the 28 singleton windows — a proper subset of the two-regime layer (the 10 unselected are the size-2 interior windows). **(a) selectivity: PASS, exactly as pre-registered.**

**The terminal check (b), by sub-check:**
- **(b1) Pole occupancy: PASS.** The pole windows exist and are selected singletons: `[0]` → state **1383** (parent `1387`); `[6]` → state **2517** (parent `2773`). The D₇ analogue is exact: the terminal regime sits at the endpoints.
- **(b2) Regime adjacency: PASS.** The one-step windows `[0,1]` (states 1259, 1483; parents `1387`,`1451`) and `[5,6]` (states 2677, 2789; parents `2741`,`2773`) are interior windows (size 2) — the second position carries the interior regime, as in D₇.
- **(b3) Terminal dominance: PASS, in the strong form.** `s_0 = s_6 = 6 = max_i s_i`; the endpoints are the **unique** maxima (the central index carries 2). The selected singleton regime is terminally concentrated, not central.
- **Mirror symmetry (OD-4's expected symmetry): PASS** — the endpoints' occupancies are symmetric (poles at both ends; `s` and `d` mirror-symmetric), and the landed `mirror: true` was re-derived.

**(b) passes; the core outcome is CONFIRMED.** Refutation mode (i) does not fire (the selection is a proper subset: 28/38, neither empty nor full); mode (ii) does not fire ((b) holds); mode (iii) does not fire (the re-derivation matched EXACT).

### 2.3 The A1-top-A2 discriminating experiment

The predicate's **mechanical firing**: **28/38** — the same count as A₀, forced by the identical landed histogram `{1:28, 2:10}`. The layer's **window structure**: 38 windows, 28 singletons (positional census `[5, 3, 3, 5, 4, 4, 4]`) and 10 size-2 windows, of which **exactly two are non-consecutive — the endpoint-spanning pair `[0,6]`** (states 1359, 1401; reached by both cycle endpoints `1371`,`1389`) — hence `allConsecutive: false`, **no ladder**, the landed ABSENT record (re-derived EXACT). The A1 layer differs from the A₀ own-tier layer in exactly the window *geometry* (contiguity), not in the count.

## 3. The prediction, scored; the branch classified

| Pre-registered item | Predicted | Observed | Outcome |
|---|---|---|---|
| (a) Selectivity on the A₀ own-tier layer | exactly 28/38, proper subset | 28/38 (the 28 singletons; 10 interior unselected) | **HOLDS** |
| (b1) Pole occupancy | windows `[0]`/`[6]` (the D₇-exact analogue) | present and selected (1383/`1387`; 2517/`2773`) | **HOLDS** |
| (b2) Regime adjacency | steps are interior (size 2) | `[0,1]`, `[5,6]` size 2 | **HOLDS** (non-discriminating, as pre-registered) |
| (b3) Terminal dominance | `s_0 = s_6 = max s_i` | 6 = 6 = max (unique maxima; profile 6/4/3/2/3/4/6) | **HOLDS** (strong form) |
| Mirror symmetry (OD-4) | symmetric terminal structure | verified (landed `mirror: true`, re-derived) | **HOLDS** |
| Mode (i) — empty/full | not predicted | proper subset | **DOES NOT FIRE** |
| Mode (ii) — 28/38 without terminals | not predicted | terminals hold | **DOES NOT FIRE** |
| Mode (iii) — census mismatch | not predicted | re-derivation EXACT | **DOES NOT FIRE** |

**Core outcome: CONFIRMED (full — both criteria, un-weakened per OD-1).**

**The A1-top-A2 branch classification: Branch L (ladder-tracking)**, exactly as pre-registered:
- **The mechanical-level component (recorded under every branch):** the predicate's firing is **28/38 on both layers** — the firing is a function of the window-size histogram and is blind to consecutiveness (the notes' Branch-H observation, recorded as the component fact it is).
- **The selection-level classification:** A₀'s selection occupies the terminal positions (pole occupancy + terminal dominance, mirror-symmetric) — a D₇-role selection on a genuine ladder. A1's identical firing carries **no ladder** (the endpoint-spanning pair breaks contiguity) — under the §1.1 operationalization it is the pre-registered FRAGMENTED_NO_LADDER firing, **never a selection**, despite the identical count.
- **Branch X does not fire** (the configuration matches L's firing condition); artifact escalation (OD-2) is not triggered (a Branch L result is prose-grade).

## 4. Findings

**1. The live prediction is confirmed — the principle's predictive range extends to a genuinely new case.** BL-085's appendix row (the A₀ own-tier layer, "LIVE, unobserved — the highest-value follow-up") is now observed: the alignment principle predicted Term-B applicable with a 28/38 proper-subset selection, and the predicate on the landed census lands exactly that, with the terminal-regime correspondence holding by all three pre-registered sub-checks. This is not a retrodiction: the A₀ own-tier layer's Term-B status was unobserved at BL-085's landing, and the prediction was fixed before computation (the frozen prefix receipt, §5). The principle's status moves from "predictive within the tested topology" (BL-085) to **predictive across the boundary pair's cases** — D₇ × D6 (constructed, BL-072) and A₀ × its own-tier layer (now) — the two members of the dual-closure pair.

**2. The singleton-vs-endpoint question (the maintainer's OD-4 correction) resolves: they coincide.** The {1:28} singleton windows are not position-blind on A₀: the terminal regime is **terminal-dominant** — pole windows occupied (1383 at `[0]`, 2517 at `[6]`), singleton density maximal at the endpoints and strictly decreasing inward (6/4/3/2/3/4/6), mirror-symmetric. The A₀ ladder's grain differs from D₇'s (A₀ is terminal-dominated — 28 singletons on a 38-window ladder, the interior the minority; D₇ is interior-dominated — 2 terminals on 14), but the regime *orientation* is the same: the terminal regime sits at the terminals. The singleton windows track the endpoints, not the histogram (the maintainer's dichotomy resolves in favor of the endpoints).

**3. The A1-top-A2 experiment: the principle predicts the ladder.** The pair separates the two readings, and the classification is **L**: the predicate's *firing* is histogram-tracking (28/38 on both — a mechanical, position-blind count), but the predicate's *selection* — the object the alignment principle governs — is ladder-tracking (A₀ selects as a terminal regime; A1's identical firing, no ladder, is not a selection). **What "FULL-with-terminals" means as the applicability condition:** applicability is a property of the regime *structure* — consecutiveness (the ladder) plus both regimes with terminal correspondence — not of the count; the count is a necessary consequence (of the histogram) but not sufficient. The A1 case also shows *how* the ladder fails at the same histogram: exactly two endpoint-spanning windows `[0,6]` break index contiguity — the A₀/A1 difference is purely geometric, reinforcing that the ordered reach geography, not the cardinality, is the operative variable. This feeds the governs semantic layer's mechanism inventory: the principle's predictive content is the reach-order alignment (structure), with the histogram-level regularity recorded as a weaker, mechanical shadow.

**4. The FULL-with-terminals applicability condition now has all its constructible instances tested.** Within the landed M-cycle census the FULL-with-terminals domains are: D₇ × D6 (the BL-072 construction — selection 2/14, the D₇ terminals) and the A₀ own-tier layer (this sprint — 28/38, the A₀ terminals); the 14 operator FULL cycles carry no contact domain (non-checkable, BL-085). No domain of the applicability rule remains live-unobserved. The boundary geographies of the dual-closure pair are now both characterized at the Term-B scale.

**5. What this does not do.** No production/mechanism (causal) claim beyond the verdict — the why remains open (as at BL-072/BL-085); no new measurement (the re-derivation is the OD-1 descriptive-read; the census base is untouched); no C-TB-1 promotion, no GSL movement (the GSL-4 refinement stays inline, unapplied; the GSL-7 candidate untouched), no G1 movement. The A₀ own-tier row's confirmation is a predictive-range extension, not a causal finding.

## 5. Verification record (this landing)

| Check | Result |
|---|---|
| Pre-registration freeze (prefix through §1.8, fixed before any computation) | **16,830 bytes; sha256 `9021f925…`**; `head -c 16830` of this landed file reproduces it (the prefix is byte-unchanged) |
| Re-derivation vs the landed census (both layers, field-for-field) | **EXACT — 0 mismatches** (A₀ own-tier FULL record; A1-top-A2 ABSENT record) |
| Predicate bytes (A₀ / A1 mechanical) | **28/38 / 28/38** (the landed histograms reproduced) |
| Terminal sub-checks b1/b2/b3 + mirror | all **PASS** (strong-form b3: unique maxima at the endpoints) |
| Core outcome / branch | **CONFIRMED** / **Branch L**; modes (i)/(ii)/(iii) not fired |
| BL-084 generator `--check` (census-base freshness) | **fresh** (`stale: false`; fp `6865b076…`) |
| `validate:manifest` / `validate:prose-consistency` / `validate:ledger-pins` | PASS (run at landing; no new pins; 0 violations) |
| Machine-checkable artifact | **none — Branch L is prose-grade per OD-2; escalation not triggered** |

## 6. Bounded non-accomplishments

No new measurement (the window re-derivation is the OD-1 descriptive-read over landed bytes; the census, orders, and predicate are read-only inputs); no production/mechanism claim beyond the verdict (the causal direction stays open); no claim event; no record amendment (ENTRY 10/15/16/17/18/19/20/21 byte-untouched); no GOVERNS admission; no new GSL number; no GSL-7 status change; no C-TB-1 promotion; no G1 movement; no INV-5 graduation; no M-walkability promotion; no directional-semantics assignment; no canonical/Court/schema/Neo4j writes; no machine-checkable artifact (OD-2's Branch-X-or-refutation trigger did not fire); D7 hypothesis-tier throughout; the frame is interpretation vocabulary; session prose is context, not evidence. **The live prediction is tested and confirmed; the production question stays open unless the evidence closes it — it does not.**

## 7. Result in one paragraph

The alignment principle's one live prediction holds, and the discriminating experiment classifies the principle as ladder-tracking. Pre-registered before computation (the frozen 16,830-byte prefix, sha256 `9021f925…`): the A₀ own-tier layer (FULL / TWO_REGIME, `{1:28, 2:10}`) would show Term-B selecting exactly 28/38, a proper subset, with the selection corresponding to the ladder's terminal positions. The windows re-derived through the BL-084 code path matched the landed census field-for-field; the predicate (BL-072, verbatim) selects the 28 singletons; the pole windows are occupied (1383/`1387`, 2517/`2773`), the one-step windows are interior, and the singleton census `6/4/3/2/3/4/6` makes the endpoints the unique maxima — the terminal regime sits at the terminals, mirror-symmetric. **Core outcome: CONFIRMED (full).** The A1-top-A2 case — the same histogram, the same 28/38 mechanical firing, no ladder (exactly two endpoint-spanning windows `[0,6]` break contiguity) — classifies **Branch L: the principle predicts the ladder**; the predicate's firing is histogram-forced (recorded component), but its selection — the object the principle governs — is the ladder's terminal regime, so "FULL-with-terminals" as applicability means the regime structure, not the count; Branch X did not fire and no artifact escalation was triggered (OD-2). The principle's predictive range extends to a genuinely new case — the dual-closure pair's Term-B cases are now both characterized (D₇ × D6 constructed at BL-072; A₀ own-tier tested here), with no live-unobserved instance of the applicability rule remaining — while the production question stays open and every fence carries.
