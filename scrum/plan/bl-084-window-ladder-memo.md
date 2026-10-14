# BL-084 — The window-ladder generalization: unique to the D₇ orbit, or general to the topology? — findings memo

**Status:** sprint artifact. Planning evidence only. No ledger entry, no evidence obligations, no claims admitted, no verdicts of record, no admission of any kind. **No new measurement beyond masks-only Hamming-2 reach arithmetic over landed bytes** (the BL-070 D1/D2 domain-derivation precedent); the calibration gate is a verification read, not a measurement; any mismatch with a landed artifact was a halt — none occurred. **No mechanism (causal) claim:** the reach-order alignment is a descriptive characterization; production questions stay open. D7 remains hypothesis-tier throughout (no D7 claim event, no D7 record amendment, no D7 derivation admission; ENTRY 15's D7 clause carries forward verbatim, `provenance/DECISION_LEDGER.md:2703-2712`). D4's amended record is untouched (ENTRY 10/15/16/17/18/19/20/21 byte-untouched). **No GOVERNS admission:** the GSL-4 generalization refinement is inline, unapplied; no new GSL number; no registration performed. No G1 movement; no INV-5 graduation; no M-walkability promotion; no directional-semantics assignment; no canonical/Court/schema/Neo4j writes. The frame (`scrum/plan/harmonic-comprehension-map.md` §§2.6/2.7) is interpretation vocabulary, never design input. Session prose is context, not evidence.

**Artifact:** `orrery/src/generated/bl084-window-ladder.v1.json` — status `planning_evidence` (raw-byte SHA-256 `88c1a92f…`; `investigationFingerprint` `6865b076…`). Generator `scripts/build-bl084-window-ladder.mjs`; independent validator `orrery/scripts/validate-bl084-window-ladder.mjs` (**50 artifact-drift mutation probes rejected + 20 static/presence-strip rejections + 1 region-scoping proof-strip rejection**; 1 permissive region probe passing; the two-sided static region check); pins `orrery/src/bl084-window-ladder.test.ts` (12 tests). Wired `orrery:bl084-window-ladder:check` (after `bl072-composite-mechanism:check`, before `bl080-governs-derivation:check`); full `orrery:check` exit 0; suite 45 files / 464 tests green; `validate:ledger-pins` PASS; manifest regen.

**Chain anchors (self-checked by fingerprint):** BL-072 `45d0afd1…` (the calibration target, frozen); BL-073 `811fa786…` (the A0 order and the dual closure); BL-055 `6d11fd93…` (the D4 labels and the cornerstone near-miss); BL-066 `94f0661f…` (the A1 satellite census); the d-tier operator probe `068f9007…` (the M-cycle orders); the derived-path-graph `4c7abcb1…` (the operator layer). The literal pins live in the validator and pins only; the generator carries no 64-hex literal.

**Rulings executed (OD-84-1…OD-84-5, approved 2026-10-13).** OD-84-1: the full sweep A+B+C+D. OD-84-2: machine-checkable artifact + independent validator + pins. OD-84-3: Scope A = the A0 ring × the full 28 A1 satellites; the D4 labels comparison-only. OD-84-4: the tiered verdict FULL / PARTIAL / ABSENT (plus the recorded shapeClass grain). OD-84-5: the calibration-as-reference-implementation discipline — the D7 calibration and every generalization test run through the same window-detection code path, so verdict differences are data differences.

## 1. What was built

| Artifact | Path | Role |
|---|---|---|
| Generator | `scripts/build-bl084-window-ladder.mjs` | deterministic builder; two-region static discipline (the intrinsic region reads masks + the tier/role partition only and builds the generic window machinery; the comparison region reads the landed orders, labels, and chain artifacts); the calibration gate, the four scopes, the synthesis |
| Artifact | `orrery/src/generated/bl084-window-ladder.v1.json` | the investigation: the calibration block, Scope A (12 windows), Scope B (ten M-cycle layer censuses), Scope C (476 directed cycle rows), Scope D (four conditions), the synthesis, the GSL treatment |
| Validator | `orrery/scripts/validate-bl084-window-ladder.mjs` | independent re-derivation (different data flow: satellite-to-anchor maps); the two-sided static region check; 50 drift probes + 20 static rejections + region-scoping probes |
| Pins | `orrery/src/bl084-window-ladder.test.ts` | 12 vitest pins (header/chain/pre-registration, calibration, Scope A, overlay, D-tier verdicts, supplementary census, Scope C census, Scope C aggregate, Scope D, synthesis, GSL, accounting/fences) |
| Wiring | root + `orrery/package.json` `bl084-window-ladder:check` | runs after `bl072-composite-mechanism:check`, before `bl080-governs-derivation:check` |

## 2. Grounding receipt (verified at build; fail-loud, no mismatch halted)

| # | Claim (the brief's load-bearing fact) | Verification | Verdict |
|---|---|---|---|
| G-1 | The D₇ window ladder (BL-072): consecutive windows; per-anchor 4/5/6/6/6/5/4 = overlap counts; terminals `253`/`2017`; inversion `k → 6−k`; closure `4033→127` `^6` | the calibration gate re-derived the D7×D6 analysis and matched BL-072's `geometricMapping` **field-for-field** (windows, counts, histogram, singleton keys, terminals, size-two windows, mirroring, closure interval) | **GROUNDED (EXACT)** |
| G-2 | The A₀ P₇ ring: Hamming-2 path, closure `2773→1387` `^6` Hamming-10 | BL-073 `cycles.A0.order` read and pinned; the closure verified; the ring's edge structure recorded (path interval 7, closure 6 — two-interval) | **GROUNDED** |
| G-3 | The seven D-tier M-cycles (BL-029) | the d-tier operator probe's `modalClosure.dToD.stateIds` read per tier; all ten M-cycles' M-walk orders re-read from the probe | **GROUNDED** |
| G-4 | The D4 14-vs-14 predicate + the near-miss | BL-055 `table28` read; the observed set (14) and the cornerstone selection recomputed; the missed observed keys `{2395, 2899}` matched | **GROUNDED** |
| G-5 | The A1 satellite census | the ledger's A1/role-satellite partition (28) set-equal to BL-066's `satelliteCensus.masks` | **GROUNDED** |
| G-6 | The composed graph's operator layer | the derived-path-graph's 60 catalog edges: all Hamming-2, inverse-paired; 21 anchors | **GROUNDED** |
| G-7 | All ten M-cycles' all-ledger reach uniform 30 per anchor (the BL-070 calibration analogue) | recomputed for every cycle | **GROUNDED** |
| G-8 | The chain fingerprints | BL-072/BL-073/BL-055/BL-066/probe/dpg self-checked by canonical-fingerprint recomputation | **GROUNDED** |

## 3. The calibration gate (OD-84-5): EXACT

The D₇ orbit × the D6 satellite layer re-derived through the same window machinery every generalization test uses: 14 windows (sizes `{1:2, 2:2, 3:10}`), per-anchor `4/5/6/6/6/5/4` = the window-overlap counts, terminals `253`/`2017` at the inversion poles, singleton keys `127:253`/`4033:2017`, terms `191`/`4001` at size 2, inversion mirroring true, closure edge `4033→127` `^6`. **Field-for-field equality with BL-072's landed mapping; verdict FULL; no mismatch.** The calibration is the reference implementation (OD-84-5): the verdicts below differ from the calibration's only in data.

## 4. Scope A — the A₀ P₇ ring × the full 28 A1 satellites (OD-84-3): PARTIAL (sliding one-regime)

The A₀ ring's Hamming-2 reach on the A1 layer selects **12 satellites, each reached by exactly one ring edge** — 12 consecutive size-2 windows `[0,1]…[5,6]`, two per edge; per-anchor `2/4/4/4/4/4/2` = the window-overlap counts; **no terminal windows, no size-3 windows**; inversion mirroring true. The tiered verdict per OD-84-4: **PARTIAL** (consecutive + overlap-consistent, but not the D₇ two-regime shape); `shapeClass: SLIDING_ONE_REGIME`. The closure context matches: the ring closes `^6` Hamming-10 (the dual closure).

**The comparison-only overlay (never a window-test input):** the reached set is **sound** (0/14 unobserved selected) and **incomplete** (12/14 observed); the two missed observed keys are exactly `2395`/`2899` — and the reached set is **set-equal to the BL-055 cornerstone near-miss selection** (12 keys; `cornerstoneSubnodes ≥ 1`). The A₀ ring's masks-only reach and the D4 near-miss axis select the identical 12 keys; recorded as a descriptive coincidence of the comparison layer, not a new predicate.

## 5. Scope B — the seven D-tier cycles (B1 all-ledger reach; B2 the layer found empirically): one FULL, five PARTIAL, one ABSENT

Every cycle's all-ledger Hamming-2 reach is uniform **30 per anchor** (the asymmetry is emergent per layer — the BL-070 calibration analogue). The per-cycle verdict (the best of the tied top layers, B2):

| cycle | top layer(s) | per-anchor (top layer) | windows | verdict |
|---|---|---|---|---|
| D1 | A0 / D2 / D4 (tie 24) | 3/4/3/3/4/4/3 (A0, D2) | all singleton | **PARTIAL** (singleton partition) |
| D2 | A2 / D2 (tie 36) | 5/5/5/6/5/5/5; 6/6/5/2/5/6/6 | **non-consecutive** | **ABSENT** (best layer A0: singleton PARTIAL) |
| D3 | A0 (24) | 4/4/3/2/3/4/4 | all singleton | **PARTIAL** |
| D4 | A0 / D4 (tie 24) | 4/2/4/4/2/4/4; 4/4/3/3/4/4/2 | all singleton | **PARTIAL** |
| D5 | A1 / A2 / D5 (tie 24) | 4/3/2/3/4/4/4 etc. | all singleton | **PARTIAL** |
| D6 | A2 (36) | 6/5/4/6/4/5/6 | all singleton | **PARTIAL** |
| D7 | D6 (36) | 4/5/6/6/6/5/4 | sizes 1/2/3 | **FULL** (the calibration) |

**The D-tier finding: the D₇ orbit is the only D-tier cycle with a sliding layer; D₂ is the only D-tier cycle whose top layers are non-consecutive.** The other five cycles' dominant layers are **singleton partitions** — windows trivially consecutive, but every reached satellite reached by exactly one anchor (no overlap structure; the PARTIAL-by-the-letter / degenerate-by-shape cases the shapeClass field separates).

**Supplementary census (A-tier, non-verdict-bearing context):** the A0 ring's own empirical layers — own-tier A0 layer: **FULL** (`{1:28, 2:10}`; per-anchor `8/7/6/6/6/7/8`; mirror true), A1 layer: `SLIDING_ONE_REGIME` (the Scope A population), A2/D3 layers: singleton; the A1 cycle: top layer A2 **ABSENT** (all other layers singleton); the A2 cycle: **all layers ABSENT**. Among the ten M-cycles, exactly **two carry a sliding layer — D7 and A0**, the dual-closure pair. **Edge structure:** the two-interval order (uniform path interval + distinguished closure interval) holds for exactly D7 (`^11`×6 + `^6`) and A0 (`^7`×6 + `^6`); the other eight cycles' path intervals are mixed (D2 and D5 both all-Hamming-6 paths; D1/D3/D4/D6 mixed Hamming).

## 6. Scope C — the composed graph's operator layer: 476 directed cycles, 14 slide

**Population:** all simple directed cycles over the derived-path-graph's 60 catalog edges (21 A-tier anchors); the containment-mixed cycles are outside the bounded population. **Census:** 60 edges — **all Hamming-2**, all inverse-paired; 476 directed cycles / 238 unordered, lengths `{4:20, 6:24, 8:48, 10:88, 12:120, 14:108, 16:56, 18:12}` — **no length-7 cycles exist in the operator layer**. **Window verdicts:** **14 directed cycles (14 unordered) exhibit consecutive sliding windows** — at lengths 4 (5), 10 (4), 12 (5); the other 462 are non-consecutive. **Orientation sensitivity:** every sliding cycle slides in exactly **one orientation**; its reverse is non-consecutive (recorded per pair). Sample: `1371→1373→1389→1387` is FULL on the A2 layer (sizes `{1:10, 2:5, 4:2}`, two full-range windows); its reverse is ABSENT.

*(G-9 prose correction, 2026-10-14, ruled OD-P2-5: the artifact's `gslTreatment` generalization-refinement text reads "7 of 238 unordered"; the authoritative count is the artifact's `scopeC.aggregate.slidingUnorderedCount` = 14 — corroborated by `slidingDirectedCount` = 14, `slidingUnorderedCount` = 14, and the "14 directed cycles (14 unordered)" line above. Recorded as a memo-level prose correction; artifact bytes unchanged; the registration cites the aggregate field.)*

## 7. Scope D — the theoretical conditions (each tested, not theorized)

| id | condition | verdict | evidence in one line |
|---|---|---|---|
| D-a | the ladder requires cycle length 7 | **REFUTED** | sliding ladders occur at lengths 4/10/12 (14 directed operator cycles); six of the seven D-tier cycles carry none — length 7 is neither necessary nor sufficient |
| D-b | the ladder requires a specific satellite:anchor ratio | **REFUTED** | same-ratio layers carry different verdicts (ratio 2: FULL/PARTIAL; ratio 6: ABSENT/FULL/PARTIAL; ratio 4: ABSENT/PARTIAL; …); the FULL M-cycle layers sit at ratios 2 and 6 |
| D-c | the ladder requires uniform all-ledger reach | **SUPPORTED (property), non-discriminating** | all ten M-cycles carry uniform 30/anchor — shared by FULL, PARTIAL, and ABSENT cycles alike |
| D-d | the ladder is a general property of Hamming-2 reach on any cycle | **REFUTED as stated** | all 60 catalog edges are Hamming-2, so all 476 operator cycles are Hamming-2 closed orders, yet only 14 slide; every sliding case in the tested populations does have Hamming-2 edges (necessary in the data, not sufficient) |

**Summary:** the ladder is a **reach-order alignment** property — contiguous windows hold exactly when the anchor order tracks the layer's reach geography; it is not implied by length, layer cardinality, uniform all-ledger reach, or Hamming-2 order alone.

## 8. The synthesis: BOUNDARY_LAYER_CONDITIONAL

**Not universal.** 462 of 476 directed operator cycles are non-consecutive; six of the seven D-tier cycles carry no sliding layer.

**Not D₇-specific.** The A₀ ring carries the ladder too (sliding on the designated A1 layer; two-regime on its own-tier layer); 14 unordered operator cycles slide.

**The verdict — boundary-layer-conditional:** within the tested topology, the window-ladder recurs on the boundary layer's reach-aligned orders — the **dual-closure pair** (D7 via the D6 layer; A0 via its own-tier layer; both two-interval orders, both closing `^6` Hamming-10) and a minority of the composed graph's operator cycles (14/238 unordered) — and is absent from the majority of general cycles. **The principle:** reach-order alignment (above). **The D₇ orbit's special property:** its dedicated satellite layer (D6, class-pure 7-2 — BL-068) is dense relative to the orbit (36 instances over 14 satellites), so its two-interval order yields the FULL two-regime ladder whose terminals are exactly the recorded tritone contacts (the calibration, reproduced field-for-field). **The A₀ context:** the coordinate image carries the same geometry in different layers — its designated population gives the sliding one-regime ladder, its own-tier layer the two-regime ladder.

**Boundary-geography characterization, completed at the window-ladder scale:** the boundary layer's seven-element cycles divide cleanly — the two-interval pair (D7, A0) carries the ladder; the other eight M-cycles are singleton partitions (or, for D2 and A2, non-consecutive at the dominant layers). The governs semantic layer accrues the generalization verdict; the higher-theorem question stays open.

## 9. GSL treatment

- **GSL-4 annotated refinement (generalization verdict; inline, unapplied; no status change, no new GSL number):** the D₇ orbit's window ladder is not unique to the orbit and not universal — it is boundary-layer-conditional, a reach-order alignment recurring on the boundary layer's reach-aligned orders (the dual-closure pair; a minority of operator cycles) and absent elsewhere in the tested topology.
- **No new GSL entry:** the GSL-7 candidate's status is untouched; this artifact performs no registration. Registration into the synthesis/map is a separate disposition.

## 10. Verification record (this landing)

| Check | Result |
|---|---|
| `npm run orrery:bl084-window-ladder:check` | PASS (generator `--check` fresh; validator PASS; 50 artifact-drift probes rejected; 20 static/presence-strip rejections; region-scoping proof strip rejected; permissive probe passed) |
| `npm run orrery:check` | exit 0 (full chain incl. `tsc --noEmit`) |
| `npm run orrery:test` | suite green — 45 files / 464 tests (12 new BL-084 pins) |
| `validate:ledger-pins` | PASS (zero violations; the new generator scanned as a clean ledger consumer, no 64-hex literals) |
| `validate:prose-consistency` | PASS after this memo (no new violations) |
| `validate:manifest` | PASS; manifest/checksums regen |
| Static isolation | forbidden tokens absent from the intrinsic region (two-sided, region-scoped); required masks-only tokens present; smuggled-read and presence-strip probes rejected; the comparison-region proof holds |

## 11. Bounded non-accomplishments

No new measurement beyond masks-only Hamming-2 reach arithmetic over landed bytes (the BL-070 precedent); no claim event; no record amendment (ENTRY 10/15/16/17/18/19/20/21 byte-untouched). No mechanism (causal) claim: the reach-order alignment is characterized descriptively; production questions stay open. No GOVERNS admission; no new GSL entry (the GSL-4 generalization refinement is inline, unapplied); no registration. No D7 movement (hypothesis-tier throughout); no D4 record movement; no G1 movement; no INV-5 graduation; no M-walkability promotion; no directional-semantics assignment; no canonical/Court/schema/Neo4j writes. **No higher-theorem answer** — the verdict bounds the window-ladder's scope; it does not conclude the governs program. Session prose is context, not evidence.

## 12. Result in one paragraph

The D₇ orbit's window ladder is neither a general topological principle nor a D₇ peculiarity: it is **boundary-layer-conditional**. The calibration re-derived BL-072's ladder field-for-field (FULL; `4/5/6/6/6/5/4`; terminals at the inversion poles; `^6` closure). The A₀ ring — the orbit's coordinate image and dual-closure partner — carries the same geometry in different layers (the designated A1 population: a sliding one-regime ladder of size-2 windows, whose 12 reached keys are set-equal to the BL-055 cornerstone near-miss). Of the seven D-tier cycles, only the D₇ orbit slides; five are singleton partitions and D₂'s top layers are non-consecutive. Across the composed graph's operator layer (476 directed cycles, all Hamming-2), 14 slide — each in exactly one orientation. The four theoretical conditions resolve: length-7 REFUTED, ratio REFUTED, uniform all-ledger reach SUPPORTED-but-non-discriminating, Hamming-2 generality REFUTED-as-stated. The principle is **reach-order alignment**; the D₇ orbit's special property is the dense class-pure D6 layer that turns its two-interval order into the full two-regime ladder with tritone terminals. No claim, no amendment, no admission — the window-ladder's scope determined, is the deliverable.
