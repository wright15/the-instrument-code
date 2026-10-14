# BL-085 Phase 2 — The alignment principle's first prediction: does reach-order alignment predict Term-B's inapplicability? — findings memo

**Status:** sprint artifact. Planning evidence only. No ledger entry, no evidence obligations, no claims admitted, no verdicts of record, no admission of any kind. **No new measurement** — the analysis reads landed artifacts only (`orrery/src/generated/bl084-window-ladder.v1.json`, `orrery/src/generated/bl072-composite-mechanism.v1.json`, the BL-055 source `d4-selection-review.v1.json`, chain context); recomputation from landed data is analysis, not measurement (the BL-072 precedent); any mismatch with a landed artifact is a halt — none occurred (0 re-derivation mismatches; the calibration and Term-B bytes matched). **Term-B is never constructed on a domain where it was NOT-APPLICABLE** — its inapplicability is the datum, not a gap to fill; the landed checks read census fields (applicability preconditions), never a new term construction. **No mechanism (causal) claim beyond the verdict:** the prediction test is a prediction/consistency test; the production question stays open. D7 remains hypothesis-tier throughout (no D7 claim event, no D7 record amendment, no D7 derivation admission; ENTRY 15's D7 clause carries forward verbatim). No GOVERNS admission; no new GSL number (the GSL-4 annotated refinement stays inline, unapplied). No G1 movement; no INV-5 graduation; no M-walkability promotion; no directional-semantics assignment; no canonical/Court/schema/Neo4j writes; no claim event; no record amendment (ENTRY 10/15/16/17/18/19/20/21 byte-untouched). The frame (`scrum/plan/harmonic-comprehension-map.md` §§2.6/2.7) is interpretation vocabulary, never design input. Session prose is context, not evidence.

**Rulings executed (OD-P2-1…OD-P2-6, approved 2026-10-14).** OD-P2-1: the prediction table is the core 7 (postdiction fa, predictions D1/D3/D4/D5/D6, control D7) plus Tier-4 appendix rows, reported separately. OD-P2-2: D2's grain is its top-layer verdict (ABSENT), the lower-layer singleton-PARTIAL footnoted. OD-P2-3: the Phase-1 registration includes the comprehension map (the triple stays in sync). OD-P2-4: memo-only (the BL-074 precedent); artifact-on-surprise — a failed prediction or a contradictory Term-B status may warrant a machine-checkable artifact for reproducibility; no surprise occurred, so this memo is the landing. OD-P2-5: the G-9 discrepancy resolved — 14 unordered sliding cycles authoritative (`scopeC.aggregate.slidingUnorderedCount`), the artifact's `gslTreatment` one-liner "7 of 238" a prose slip (footnoted in the Phase-1 registration; artifact bytes unchanged). OD-P2-6: FULL-with-terminals is the sole Term-B applicability trigger; the prediction is NOT-APPLICABLE for all five D-tier PARTIAL domains (not "NOT-APPLICABLE-or-degenerate"); the sliding-PARTIAL (too smooth) vs. singleton-PARTIAL (too fragmented) distinction is named.

## 0. Pre-registration (binding; fixed before any computation)

**The prediction, stated before any computation:** **Term-B's inapplicability on the fa domain is a consequence of the reach-order alignment principle, not a confound.** The fa domain (A₀ ring × A1 layer) scores PARTIAL alignment, sliding one-regime, with no terminal windows (BL-084 Scope A); the terminal-regime term requires FULL two-regime alignment *with terminals*; therefore the principle predicts Term-B's NOT-APPLICABLE verdict on the fa domain. If the prediction table holds, the BL-072 attribution moves from INDETERMINATE to **alignment-conditional**; if it does not, the principle's boundary is mapped. Either outcome is a finding, receipted.

**Scoring method (pre-registered).** For each domain, the alignment verdict is **re-derived from the landed census fields only**, by the BL-084 OD-84-4 rule: a layer scores **FULL** iff `allConsecutive ∧ overlapMatch ∧ hasInterior ∧ hasTerminal`; **PARTIAL** iff `allConsecutive ∧ overlapMatch ∧ ¬(hasInterior ∧ hasTerminal)`; **ABSENT** iff `¬allConsecutive`. The domain's alignment = the best layer's verdict per BL-084's B2 rule (the recorded dominant-tier layer selection; the D2 grain per OD-P2-2). The re-derived verdicts are checked field-by-field against the artifact's recorded verdicts; any mismatch is a halt. Re-derivation is analysis over landed bytes, not measurement (the BL-072 precedent).

**Term-B applicability rule (OD-P2-6, ruled): applicable iff the domain's alignment is FULL-with-terminals.** Otherwise NOT-APPLICABLE, with the mechanistic sub-reason read from the landed census:
- **NO_SIZE1_WINDOWS** (`¬hasTerminal`): the reach has no terminals at all — the term has no purchase (the too-smooth case);
- **WHOLE_LAYER_RESTATEMENT** (`hasTerminal ∧ ¬hasInterior`): every window size 1, so `parentCount(satellite) = 1` is true on the whole reached layer — a restatement, not a selection (the BL-068/C2 house standard: a predicate true on the whole layer carries no selection content); no regime distinction exists (the too-fragmented case);
- **FRAGMENTED_NO_LADDER** (`¬allConsecutive`): size-1 windows may exist but no consecutive ladder — no terminal regime to select.

**The operationalization of "Term-B selecting" (stated before computation).** The term "selects" iff it plays its D7-defined role: selecting the terminal regime of a consecutive ladder as a proper subset of the reached layer. Mechanical predicate outcomes (`parentCount = 1` selecting zero / the whole layer / a fragmented subset) are reported in the landed-check column for transparency; whole-layer firing is restatement under the house standard (BL-068's 36/36 restatement; the C2 guard), never a selection. Sensitivity (pre-registered): the core-7 verdict is invariant under the restatement-standard reading (fa selects zero; singleton partitions are whole-layer restatements; D7 selects a proper terminal subset); only fragmented appendix rows could read differently under a blunt nonempty-subset reading, and they carry no ladder regime — reported per row.

**Sources (landed only):** `orrery/src/generated/bl084-window-ladder.v1.json` (`investigationFingerprint` `6865b076…`) — `scopeA`, `scopeB` (core + supplementary), `scopeC`, `calibration`; `orrery/src/generated/bl072-composite-mechanism.v1.json` (fingerprint `45d0afd1…`) — `perTerm`, `crossDomain`; BL-055 source `orrery/src/generated/d4-selection-review.v1.json` (fingerprint `6d11fd93…`) — the fa-table context; chain context `d-tier-operator-probe.v1.json` (`068f9007…`), `derived-path-graph.v1.json` (`4c7abcb1…`). Reads only; no re-measurement.

**The prediction table (pre-registered; three tiers per OD-P2-1; result cells computed after registration — see §3 for the scored table).**

| Tier | Domain | Alignment (predicted from BL-084) | Predicted Term-B | Landed check (applicability preconditions) | Observed |
|---|---|---|---|---|---|
| **Postdiction** (consistency check, necessary-not-sufficient) | fa (A₀ ring × A1 layer) | PARTIAL / SLIDING_ONE_REGIME, no terminals | NOT-APPLICABLE | computed (§3) | NOT-APPLICABLE (BL-072 `crossDomain`) |
| **Prediction** (the test) | D1 (top layers) | PARTIAL / SINGLETON_PARTITION | NOT-APPLICABLE | computed (§3) | unobserved (no construction) |
| **Prediction** | D3 (top layer) | PARTIAL / SINGLETON_PARTITION | NOT-APPLICABLE | computed (§3) | unobserved |
| **Prediction** | D4 (top layers) | PARTIAL / SINGLETON_PARTITION | NOT-APPLICABLE | computed (§3) | unobserved |
| **Prediction** | D5 (top layers) | PARTIAL / SINGLETON_PARTITION | NOT-APPLICABLE | computed (§3) | unobserved |
| **Prediction** | D6 (top layer) | PARTIAL / SINGLETON_PARTITION | NOT-APPLICABLE | computed (§3) | unobserved |
| **Control** | D7 × D6 | FULL / TWO_REGIME (with terminals) | applicable (selects) | constructed (the calibration) | applicable: 2/0/12/22 (`127:253`, `4033:2017`) |
| Appendix (Tier 4) | D2 (top layers, per OD-P2-2) | ABSENT (lower A0 layer singleton-PARTIAL, footnote) | NOT-APPLICABLE | computed (§3) | unobserved |
| Appendix | A₀ ring × own-tier layer | FULL / TWO_REGIME | applicable | computed (§3) | unobserved — **the highest-risk row** |
| Appendix | A1 cycle (top layer A2) | ABSENT | NOT-APPLICABLE | computed (§3) | unobserved |
| Appendix | A2 cycle | ABSENT (all layers) | NOT-APPLICABLE | computed (§3) | unobserved |
| Appendix | Scope-C sliders (14 directed) | FULL-with-terminals | applicable (alignment half only) | computed (§3) | not constructible (no contact domain) |

**Refutation conditions (pre-registered, mechanically checkable):**
(a) any domain scoring FULL-with-terminals shows Term-B inapplicable;
(b) any domain scoring PARTIAL/ABSENT shows the terminal-regime term selecting (per the operationalization);
(c) the fa domain re-scores FULL under the scoring method (scoring inconsistency);
(d) the D-tier PARTIAL domains' Term-B statuses, checked against the landed data (the applicability preconditions), contradict the predictions.

## 1. Grounding receipt (verified at registration; fail-loud, no mismatch halted)

| # | Claim (the brief's load-bearing fact) | Verification | Verdict |
|---|---|---|---|
| G-1 | BL-084's principle + scoring: BOUNDARY_LAYER_CONDITIONAL; reach-order alignment with the descriptive-not-production qualification; the OD-84-4 verdict rule over `allConsecutive`/`overlapMatch`/`hasInterior`/`hasTerminal` | artifact read: `synthesis.principle` ("the window-ladder is a reach-order alignment property…"); `scopeD`; per-layer fields as listed | GROUNDED |
| G-2 | The fa domain's landed reach data: PARTIAL / SLIDING_ONE_REGIME; 12 windows, all size 2; no terminals; per-anchor `2/4/4/4/4/4/2`; mirror true | `scopeA` read directly: `verdict` PARTIAL, `shapeClass` SLIDING_ONE_REGIME, `sizeHistogram {2:12}`, `hasInterior true`, `hasTerminal false`, `windows` all size 2 (`parents` = the edge's two anchors), `perAnchorCounts [2,4,4,4,4,4,2]`, `mirror true` | **GROUNDED (EXACT)** |
| G-3 | BL-072's Term-B confound: Term-B 2/0/12/22 on D7 (selecting the terminals `127:253`/`4033:2017`); fa `NOT_APPLICABLE` (never constructed, OD-72-1); attribution INDETERMINATE verbatim; Term-A on fa 12/12/2/2 | `perTerm.termB.confusion` `{tp:2, fp:0, fn:12, tn:22}`, `selectedKeys` `['127:253','4033:2017']`; `crossDomain.termB.applicability` `NOT_APPLICABLE`; `crossDomain.attribution` read verbatim; `crossDomain.termA.confusion` `{tp:12, fp:12, fn:2, tn:2}` | **GROUNDED (EXACT)** |
| G-4 | The D-tier / supplementary census fields (the prediction rows' landed checks) | `scopeB` read directly: D7/D6 `{1:2, 2:2, 3:10}` `int=T term=T`; D1 top A0/D2/D4 `{1:24}`; D3 A0 `{1:24}`; D4 A0/D4 `{1:24}`; D5 A1/A2/D5 `{1:24}`; D6 A2 `{1:36}`; D2 top A2 `{1:16, 2:10}` / D2 `{1:12, 2:12}` non-consecutive; A0 own-tier `{1:28, 2:10}` `int=T term=T`; A1 top A2 `{1:28, 2:10}` non-consecutive; A2 top A2 `{1:12, 2:30}` non-consecutive | **GROUNDED (EXACT)** |
| G-5 | The operator-layer census (Scope C): 476 directed / 238 unordered; 14 sliding (`slidingUnorderedCount` 14 — OD-P2-5); each sliding row's deciding top layer FULL/TWO_REGIME (one row carries a tied non-best NON_CONSECUTIVE A0 layer alongside its deciding A2 layer); no length-7 | `scopeC.census`/`scopeC.aggregate` read directly; the 14 FULL rows' fields read | **GROUNDED (EXACT)** |
| G-6 | The D7 calibration gate (the control's construction): `bl072Matched true`; terminals `253`/`2017`; singleton keys `127:253`/`4033:2017` = BL-072's Term-B `selectedKeys` | `calibration` read directly | **GROUNDED (EXACT)** |

## 2. The scoring re-derivation (analysis, not measurement)

**Method applied mechanically** (the pre-registered rule) to **all 546 stored layer verdicts** in the landed artifacts: `scopeA` (1), the Scope B core cycles' and supplementary cycles' stored layers (57), and the Scope C rows' top layers (488 entries over 476 rows — 12 rows carry two tied top-layer entries). **Result: 0 mismatches** — every re-derived verdict equals the artifact's recorded verdict (the OD-84-4 rule reproduces the recorded census exactly). The fa instance of this check (refutation condition (c)) re-scores **PARTIAL** (fields `cons=T ovl=T int=T term=F`), consistent with the recorded verdict.

**The shape census (the re-derivation's by-product, read from the same fields).** Across the 546 stored layers, the consecutive-layer shapes are exactly three and exhaust the field combinations: **FULL** (`int ∧ term`), **sliding one-regime PARTIAL** (`int ∧ ¬term`; the fa shape), **singleton PARTIAL** (`¬int ∧ term`; the size-1-only shape); no layer is `¬int ∧ ¬term`; every non-consecutive layer is **ABSENT** (`¬cons`). Term-B applicability under the ruled rule therefore coincides with the FULL/two-regime shape.

**The landed checks per prediction row** (the mechanical predicate outcomes, for the §3 table; counts are `parentCount = 1` selections over the reached layer, read from the landed size histograms):
- **fa**: `{2:12}` — 0 size-1 windows; predicate selects **0/12** reached (of 28 layer satellites) → **NO_SIZE1_WINDOWS**; the recorded NOT-APPLICABLE is now structurally explained against the landed census (not only the OD-72-1 data-availability reason).
- **D1** (top A0/D2/D4): `{1:24}` each — predicate selects **24/24** on each top layer → **WHOLE_LAYER_RESTATEMENT**.
- **D3** (A0): `{1:24}` — **24/24** → **WHOLE_LAYER_RESTATEMENT**.
- **D4** (A0/D4): `{1:24}` — **24/24** → **WHOLE_LAYER_RESTATEMENT**.
- **D5** (A1/A2/D5): `{1:24}` — **24/24** → **WHOLE_LAYER_RESTATEMENT**.
- **D6** (A2): `{1:36}` — **36/36** → **WHOLE_LAYER_RESTATEMENT**.
- **D7 × D6** (the control): `{1:2, 2:2, 3:10}` — predicate selects **2/14**, the two size-1 terminals — a proper subset, the D7 role realized (BL-072: 2/0/12/22, `127:253`/`4033:2017`).
- **D2** (top A2 `{1:16, 2:10}`; D2 `{1:12, 2:12}`): non-consecutive; predicate would select **16/26** and **12/24** — proper subsets, but no ladder (sensitivity note in §4).
- **A0 own-tier** (`{1:28, 2:10}`, FULL/TWO_REGIME): predicate would select **28/38** — a proper subset of a two-regime layer (Term-B predicted applicable; unobserved).
- **A1 cycle top A2** (`{1:28, 2:10}`, non-consecutive): predicate would select **28/38** — no ladder.
- **A2 cycle top A2** (`{1:12, 2:30}`, non-consecutive): predicate would select **12/42** — no ladder.
- **Operator sliders** (14 directed; sizes vary, e.g. `{1:10, 2:5, 4:2}`): the deciding top layers are `int=T term=T` FULL/TWO_REGIME (one sliding row carries a tied but non-deciding non-consecutive A0 layer); the predicate would select proper subsets (e.g. 10/17) — but the operator layer carries no contact domain (no recorded-contact relation), so the composite's terms are out of scope there (alignment half only).

## 3. The prediction table, scored

| Tier | Domain | Alignment (re-derived; matches recorded) | Predicted Term-B | Landed check (census preconditions) | Outcome |
|---|---|---|---|---|---|
| **Postdiction** | fa (A₀ ring × A1 layer) | PARTIAL / SLIDING_ONE_REGIME (`cons=T ovl=T int=T term=F`) | NOT-APPLICABLE (NO_SIZE1_WINDOWS) | 0 size-1 windows; predicate 0/12; **observed NOT-APPLICABLE** (BL-072) | **HOLDS** (recorded + structurally grounded) |
| **Prediction** | D1 | PARTIAL / SINGLETON_PARTITION | NOT-APPLICABLE (WHOLE_LAYER_RESTATEMENT) | `{1:24}`; predicate 24/24 (whole layer) | **HOLDS** (no contradiction) |
| **Prediction** | D3 | PARTIAL / SINGLETON_PARTITION | NOT-APPLICABLE (WHOLE_LAYER_RESTATEMENT) | `{1:24}`; predicate 24/24 | **HOLDS** |
| **Prediction** | D4 | PARTIAL / SINGLETON_PARTITION | NOT-APPLICABLE (WHOLE_LAYER_RESTATEMENT) | `{1:24}`; predicate 24/24 | **HOLDS** |
| **Prediction** | D5 | PARTIAL / SINGLETON_PARTITION | NOT-APPLICABLE (WHOLE_LAYER_RESTATEMENT) | `{1:24}`; predicate 24/24 | **HOLDS** |
| **Prediction** | D6 | PARTIAL / SINGLETON_PARTITION | NOT-APPLICABLE (WHOLE_LAYER_RESTATEMENT) | `{1:36}`; predicate 36/36 | **HOLDS** |
| **Control** | D7 × D6 | FULL / TWO_REGIME (`int=T term=T`) | applicable (selects) | constructed; predicate 2/14 proper subset | **HOLDS** (observed 2/0/12/22) |
| Appendix | D2 (top layers; footnote: lower A0 layer singleton-PARTIAL `{1:24}`) | ABSENT / NON_CONSECUTIVE | NOT-APPLICABLE (FRAGMENTED_NO_LADDER) | predicate 16/26, 12/24 — fragmented subsets, no ladder | **HOLDS** (sensitivity noted) |
| Appendix | A₀ own-tier layer | FULL / TWO_REGIME | applicable | predicate would select 28/38 — proper subset of a two-regime layer | **LIVE, unobserved** (the highest-value follow-up) |
| Appendix | A1 cycle (top A2) | ABSENT / NON_CONSECUTIVE | NOT-APPLICABLE (FRAGMENTED_NO_LADDER) | predicate 28/38 — fragmented, no ladder | **HOLDS** |
| Appendix | A2 cycle | ABSENT / NON_CONSECUTIVE (all layers) | NOT-APPLICABLE (FRAGMENTED_NO_LADDER) | predicate 12/42 — fragmented, no ladder | **HOLDS** |
| Appendix | Scope-C sliders (14 directed) | FULL-with-terminals | applicable (alignment half only) | no contact domain; terms out of scope | alignment half consistent; **not checkable** for Term-B |

**Core 7:** postdiction holds, all five predictions hold, control holds — **7/7**. **Appendix:** 3 rows hold (D2, A1, A2 — D2 with the sensitivity note), 1 row live-unobserved (A0 own-tier — the principle predicts applicable; a concrete, checkable future prediction), 1 row half-checkable (operator sliders — alignment half only).

## 4. Refutation audit (all four conditions, mechanically checked)

- **(a) FULL-with-terminals ⇒ applicable:** all FULL-with-terminals domains in the landed data are D7×D6 (Term-B constructed and selecting — no firing), the A0 own-tier layer (Term-B **unobserved** — not inapplicable; no firing; the prediction is live), and the 14 operator FULL cycles (no contact domain — the composite's terms are out of scope, so "inapplicable" is not attributed; no firing). **No firing.**
- **(b) PARTIAL/ABSENT ⇒ no terminal-regime selection:** fa selects zero (vacuous); the five singleton partitions are whole-layer restatements (excluded by the BL-068/C2 house standard — a predicate true on the whole layer carries no selection content; no regime exists); the fragmented appendix rows (D2, A1, A2) carry proper size-1 subsets but **no ladder** — no terminal regime exists to select. **No firing** under the pre-registered operationalization. *Sensitivity (as pre-registered):* under a blunt nonempty-subset reading, the fragmented rows would count as "term firing" — recorded here explicitly (16/26, 12/24, 28/38, 12/42) so the divergence is visible; these are appendix rows; the core-7 verdict is invariant under both readings.
- **(c) fa re-scores FULL:** the fa layer re-derives **PARTIAL** (`int=T term=F`); **no scoring inconsistency**; **no firing.**
- **(d) D-tier statuses contradict predictions:** all five D-tier PARTIAL domains' landed checks yield **NOT-APPLICABLE** (whole-layer restatement) — exactly the predicted status, for the predicted structural reason (the singleton-PARTIAL shape's lack of a regime distinction). **No firing.**

**No refutation condition fires; no surprise — the memo-only landing stands (OD-P2-4's artifact escalation is not triggered).**

## 5. Findings

**1. The core test: the alignment principle is confirmed as predictive. 7/7.** The principle predicted Term-B's applicability status across the postdiction (fa), the five D-tier predictions, and the D₇ control — with the predictions' *reasons* (no terminals / too fragmented) also landing as read from the census. This is the project's first genuine predictive use of the principle: it **predicts, it does not merely describe**. Status: **descriptive characterization → predictive principle within the tested topology.** The causal/production question remains open (no mechanism claim beyond the verdict; the fences carry).

**2. The confound dissolves as stated — the attribution moves to alignment-conditional.** BL-072's H-Informational attribution was INDETERMINATE — "the check cannot separate class-purity dependence from reach-geometry dependence (**Term-B's inapplicability is itself the confound**)." The prediction test resolves the named confound: the fa domain's Term-B inapplicability is **entailed by the fa layer's one-regime geometry** (zero size-1 windows — confirmed against the landed census, independent of class composition). The attribution for the Term-B component refines from INDETERMINATE to **alignment-conditional** — the reach-geometry side *suffices*, with no class-purity input required. Residual honesty: what remains open is (i) the production/causal direction (why the boundary geometry governs — untouched, fenced), and (ii) the Term-A component's own domain behavior (12/12/2/2 — recorded, not re-explained here).

**3. The two PARTIAL shapes predict differently but both land NOT-APPLICABLE — the mechanism's two-condition requirement.** The sliding one-regime PARTIAL (fa) is *too smooth* — the reach slides but has no endpoints, so the terminal regime is absent; the singleton PARTIALs (D1/D3/D4/D5/D6) are *too fragmented* — every window is size 1, so no regime distinction exists and the predicate is a whole-layer restatement. Both shapes yield NOT-APPLICABLE, for structurally different reasons; jointly they establish (within the tested topology) that Term-B applicability requires **both** window structure **and** terminal structure — the two-condition requirement the shaped ruling named.

**4. Test-power notes (recorded honestly).** (i) The five prediction rows share one shape (singleton partition) — five instances of one structural case, not five independent shapes; the confirmatory weight is real but concentrated. A maximal test row would have been a PARTIAL layer with mixed window sizes carrying a proper size-1 subset *and* a ladder — no such layer exists in the landed populations, so the sharpest falsification branch (refutation (b) on a PARTIAL row) is not instantiable by the data; the fragmentation case is the closest analogue and it lands correctly. (ii) The strongest *live* appendix value is the A0 own-tier row: the principle predicts Term-B applicability there; no Term-B construction exists for that layer (its contact domain is not the recorded D7 relation), so the prediction stands as a checkable follow-up. (iii) The operator sliders test only the alignment half.

**5. What this does not do.** No new measurement; no construction of Term-B anywhere it was NOT-APPLICABLE (the datum, never the gap); no mechanism/production claim; no C-TB-1 or GSL status change; no G1 movement; D7 hypothesis-tier.

## 6. The G1 scoping sketch (scoping only — no G1 movement)

*The corridor's pattern applied to the next program: characterize the territory before entering it. Questions only; no edge-rule proposal; no directional semantics; no measurement on the 330 side (the intra-330 adjacency is unformalized — `docs/ARCHITECTURE_MAP.md` §4 G1: "No speculative edges").*

**The vocabulary to map:** cycle + layer → reach census → alignment score → verdict (FULL/PARTIAL/ABSENT) → the applicability rule (FULL-with-terminals ⇔ the terminal-regime term constructible). The alignment principle is a **scorer of reach geography given an order** — it cannot select an edge rule directly; its role for BL-024 is *downstream evaluation of candidate rules' consequences*, not rule generation.

**Scoping question 1 — the candidate addressing cycles on the 330 side.** The vocabulary needs a closed order over pentatonic states. Candidates (questions, none endorsed): (i) containment-derived orders — e.g., orders induced by the 330 nodes' relation to the 21 A0 anchors (the BL-035 claimant structure gives each node its parent-anchor set); (ii) coordinate images — does the BL-075 coordinate algebra (T1 = x→5x) act on pentatonic 5-subsets in a way that carries a landed heptatonic cycle onto a 330-side structure, or does it leave the 330 (the 330's closure under the coordinate action is itself an open question); (iii) the cornerstones' office/coordinate orders (the five 5-35 cornerstones carry unique 3-claimant structure); (iv) candidate voice-leading cycles under each BL-024 edge-rule hypothesis.

**Scoping question 2 — the candidate satellite layers.** On the heptatonic side a layer = a tier's states Hamming-2-reachable from the cycle's anchors. On the 330 side the analogues (questions): the containment strata (which anchor's satellites a node belongs to — the claimant census), distance strata under a candidate reach measure, or the 70-bridge switchboard as a distinguished stratum.

**Scoping question 3 — what "reach" means for intra-family hops.** The heptatonic reach is Hamming-2 on 7-subsets (one-for-one pitch substitution). For pentatonic 5-subsets, candidate reach measures (each inducing a different geography, and each corresponding to a BL-024 edge-rule family): Hamming-2 on 5-subsets (single substitutions); symmetric-difference/voice-leading distances; complement-mediated adjacencies. **The reach measure and the edge rule are the same choice viewed twice** — this is the sketch's central observation: the alignment vocabulary presupposes a reach; on the 330 side the reach *is* the missing edge rule.

**Scoping question 4 — what each verdict would predict about edge-rule candidates.** For each candidate rule: instantiate its induced operator layer on the 330, score its cycles for alignment. **FULL-aligned cycles** ⇒ the rule's reach geography admits reach-aligned orders — an alignment-privileged edge rule exists, and the aligned cycles are its privileged addressing orders. **Only PARTIAL/ABSENT** ⇒ the rule's geography admits no alignment-privileged order — the decision returns to BL-024's design space (semitone adjacency / complement / voice-leading) with the alignment test recorded as performed-and-negative for the tested rules. Either outcome is a finding *for* BL-024's decision record; neither moves G1.

**Fences (binding):** no G1 movement; no edge-rule proposal; no directional-semantics assignment; no 330-side measurement (the reach is undefined until an order exists); the sketch's function is to state what BL-024 would need to instantiate for the alignment vocabulary to apply, and what each outcome would imply.

## 7. Fences and bounded non-accomplishments

No new measurement; no claim event; no record amendment (ENTRY 10/15/16/17/18/19/20/21 byte-untouched); no GOVERNS admission; no new GSL number; no C-TB-1 promotion; no G1 movement; no INV-5 graduation; no M-walkability promotion; no directional-semantics assignment; no canonical/Court/schema/Neo4j writes; Term-B never constructed where NOT-APPLICABLE; the fa reach census read from the landed BL-084 artifact, never re-measured; no machine-checkable artifact (OD-P2-4's escalation not triggered — no failed prediction, no contradictory status); D7 hypothesis-tier throughout; the frame is interpretation vocabulary; session prose is context, not evidence. The production/mechanism question stays open — the sprint tests the principle's predictive power only.

## 8. Result in one paragraph

The alignment principle's first prediction holds. Stated before computation — Term-B's inapplicability on the fa domain is a consequence of reach-order alignment — the prediction was tested against a pre-registered table of the core 7 (the fa postdiction, the five D-tier PARTIAL predictions, the D₇ control) plus appendix rows, with four pre-registered refutation conditions. The scoring method re-derived all 546 stored layer verdicts from landed census fields with zero mismatches; the fa domain's census (12 windows, all size 2, zero terminals) shows the predicate selecting 0/12 — the recorded NOT-APPLICABLE now structurally explained rather than merely data-limited; the five D-tier PARTIAL domains' landed checks all yield the predicted NOT-APPLICABLE (whole-layer restatement — the too-fragmented shape); the D₇ control's 2/14 proper-subset selection is the realized D7 role; the appendix lands 3 consistent rows (fragmented, no ladder), one live prediction (the A0 own-tier layer — FULL-with-terminals predicts applicability; unobserved), and one alignment-half row (the operator sliders). **No refutation condition fires.** The confound dissolves as stated: the BL-072 attribution refines from INDETERMINATE to **alignment-conditional** — the reach-geometry side suffices to explain Term-B's inapplicability, with no class-purity input required; the production direction stays open. The principle's status moves from **descriptive characterization to predictive** within the tested topology — the first time it has predicted rather than described — and the G1 scoping sketch maps the vocabulary onto BL-024 as questions only (the central observation: on the 330 side the reach measure and the edge rule are the same choice viewed twice). No claim, no amendment, no admission, no artifact — the prediction tested, the principle promoted, is the deliverable.

## 9. Verification record (this landing)

| Check | Result |
|---|---|
| Re-derivation audit (all 546 stored layer verdicts vs the pre-registered rule) | 0 mismatches |
| Chain values (BL-084 artifact fp `6865b076…`; BL-072 fp `45d0afd1…`; calibration `bl072Matched true`; Term-B bytes 2/0/12/22, selectedKeys matched) | EXACT |
| Refutation audit (a)–(d) | no firing |
| `validate:manifest` | PASS; manifest/checksums regen |
| `validate:prose-consistency` | PASS (0 violations) |
| `validate:ledger-pins` | PASS (0 violations; no new pins) |
| Machine-checkable artifact | none (memo-only landing per OD-P2-4; escalation not triggered) |
