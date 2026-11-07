# MVP8.1 Closing Report — Stem-Isolated B4 Recalibration

**Directive:** `MVP8.1-DIR-1` rev 1
**Execution realm:** `/home/erick/workspace/scratch-governed-loop-run/mvp8_1_stem/`
**Status:** SCRATCH COMPLETE; outcome **DEFER (instrument proxy)**; repository untouched; ear gate SIGNED_HUMAN

## Opening fixed point and pins

- Opening HEAD: `d1b2286a5b6f3783af24094eb78e40ab511bb8e5`
- Decision ledger: `da9c79410cf2f3429509ca07f4a82effe49932d061ca96a4d36d28a401668149` / `407,293 B` / `4,383 lines`
- Manifest: `6632ab6a3141e58519fe5846794eb9befd76d1cd3479f9d65934a2a30ce0bc27` / `1,834 files` / `263,181,122 B`
- Pins: `28/28`; anchors `11/11`; MVP8 evidence pins `23`
- Strong core: `3,204` reachable / `2,928` in S000 / `276` one-way / `2,388` governed / `540` boundary
- Ear gate: `SIGNED_HUMAN`; signed by `Erick`; signed verdict `not sure but they all sound good`
- Declared working-tree exception: `scrum/plan/mvp8-dir-1-rev2.md` and `scrum/plan/mvp8-1-dir-1-rev1.md` are the only untracked paths; no pinned or tracked byte changed.

## Task outcomes

| Task | Receipt | Outcome |
|---|---|---|
| T0 | `mvp8_1_task_0_receipt.json` | fixed point, 28/28 pins, 11/11 anchors, 23 MVP8 evidence pins, ear signed, predeclaration locked |
| TA | `mvp8_1_task_a_receipt.json` | 12 lead stems + 12 pad stems; format/determinism/integrity `True` |
| TB | `mvp8_1_task_b_receipt.json` | B4a FAIL (proxy), B4b PASS, B4c 6/6 diagnostic, B4d PASS, B1/B2/B3 re-verified |
| TE | `mvp8_1_task_e_receipt.json` | DEFER adjudication, closing report, guarded landing script |

## Stem-isolated measurements

- **B4b (primary, hard): PASS.** Far Shore lead-stem margins: governed `lead 0.351605 - container 0.206436 = 0.145169`; ungoverned control `0.533478 - 0.502360 = 0.031118`. The governed margin is positive and exceeds the control margin.
- **B4a (locked proxy, hard): FAIL.** `3/12` stems meet the `0.90` pcSum-based threshold.
- **B4a diagnostic (non-bet): `8/8` defined stems pass `>= 0.90` when measured against mean emitted pc; the four undefined stems are single-office or two-bar probes where office deconfounding has zero residual variance.
- **B4c (diagnostic, report-only):** full-mix section-boundary direction agrees `6/6` governed and `6/6` control.
- **B4d: PASS.** All 24 stems are mono 16-bit 44.1 kHz, two-pass deterministic, 0 clipped, 0 non-finite.

| Stem | rLead (pcSum) | rContainer | rMeanPc | Windows |
|---|---|---|---|---|
| b1-andalusian-pentatonic | 0.345813 | 0.740067 | 0.985864 | 45 |
| b2-borrowed-minor-pentatonic | 0.389244 | 0.560940 | 0.990836 | 22 |
| far-shore-pentatonic | 0.351605 | 0.206436 | 0.991192 | 55 |
| far-shore-ungoverned-control | 0.533478 | 0.502360 | 0.995975 | 55 |
| c1-aeolian-harmonic-minor | None | None | None | 2 |
| c3b-major-mode-triangle | 0.469270 | 0.134522 | 0.994500 | 7 |
| d-borrowed_connector-arc | 0.999034 | -0.999034 | 0.999034 | 8 |
| d-borrowed_connector-pure | None | None | None | 6 |
| d-naked_fifth_stack-arc | 0.999034 | -0.999034 | 0.999034 | 8 |
| d-naked_fifth_stack-pure | None | None | None | 6 |
| d-native_class_dwell-arc | 0.999964 | 0.999964 | 0.999964 | 8 |
| d-native_class_dwell-pure | None | None | None | 6 |

## Carried symbolic re-verification

- B1: `1,064,448` evaluations, `0` out-of-mask; `243,936` still-set evaluations, `0` leaks.
- B2: `144/192` baseline; `192/192` governed initiation; `80/80` structural; `4` modal passes.
- B3: `55,296` checks; bad focal `0`, orbit `0`, initiation `0`.

## Adjudication

- **Outcome: `DEFER` (instrument proxy).**
- **Primary stem Law-3 result: PASS.** B4b confirms the governed lead stem tracks its lead more than the container, with a margin larger than the ungoverned control. This is the substantive stem-isolation result the recalibration was designed to obtain.
- **Only blocker: B4a.** The locked sanity proxy used bar `pcSum`; office deconfounding is degenerate on single-office/two-bar stems and `pcSum` is a coarse lead-tracking signal. The non-bet mean-emitted-pc diagnostic passes `8/8` defined stems at `>=0.90`.
- **No SPEC-001 amendment and no L28 landing are proposed.** The guarded `task-e/mvp8_1_land.py` refuses to execute under DEFER.
- **Recommended next step:** `MVP8.1b-DIR-1` with a one-line B4a metric correction (mean emitted pc; require at least two offices and three bars) and no other change. The B4b result and the carried PASSes are banked.

## Fences

- No gate, census, ground-truth, seam-substrate, Q-engine, encoder, renderer, or `audio.ts` byte change; repository writes `0` (transient ignored bytecode caches, if any, removed).
- No LLM calls; `llmCalls: 0`.
- Bipartite inputs remain `planning_evidence` / `admissionEffect: none` / `graphScope: detached_audit_only`.
- `causationClaim: false`, `physicalQuantityClaim: false`, `tierClassifier: false`, `globalCHNull: true`; `C_H` unresolved.
- Ear gate `SIGNED_HUMAN`; the signed verdict is human-authored, not agent-authored.

## Terminal verdict

```text
MVP8.1-STEM-CALIBRATION-CLOSING
FIXED-POINT: d1b2286... / L27 da9c7941... / 407293 B / 4383 lines
EVIDENCE-PINS: 23/23 MATCH / EAR-GATE SIGNED_HUMAN
TASKS: T0 COMPLETE | TA COMPLETE | TB COMPLETE | TE COMPLETE
STEMS: 12 LEAD / 12 PAD / FORMAT PASS / DETERMINISTIC PASS
B4-PRIME: B4a FAIL (3/12 PROXY; DIAGNOSTIC 8/8 MEAN-PC) | B4b PASS (GOVERNED MARGIN 0.145169 VS UNGOVERNED 0.031118) | B4c 6/6 DIAGNOSTIC | B4d PASS
CARRIED: A PASS | B1 PASS | B2 PASS | B3 PASS | C1-C3b PASS | D PASS
OUTCOME: DEFER (B4a INSTRUMENT PROXY)
FENCES: GATE-UNTOUCHED / Q-SUBSTRATE-UNTOUCHED / C-H-NULL / BIPARTITE-PLANNING-EVIDENCE / LLM-CALLS 0 / REPO-WRITES 0
STATUS: COMPLETE
```
