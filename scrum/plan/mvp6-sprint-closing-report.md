# MVP6 Closing Report — Planned Form: “The Far Shore”

**Directive:** `MVP6-DIR-1` rev 1  
**Execution realm:** `/home/erick/workspace/scratch-governed-loop-run/mvp6/`  
**Status:** SCRATCH COMPLETE; L23 working-tree landing pending

## Fixed point and pins

- Opening HEAD: `154db019711570ade5558a78eb5abb0b63b3c884` (L22)
- Tree clean at opening: true
- Decision ledger before: `ab141615...d2c28` / 364,225 B / 4,216 lines
- Manifest before: `1a07456c...a5f93` / 1,600 files / 110,846,414 B
- Release closure before: PASS / 418 / 0
- Pins verified: 28/28 SHA-256 and byte counts; `mvp2.py` anchors 11/11

## Task outcomes

| Task | Receipt | SHA-256 (first 8) | Outcome |
|---|---|---|---|
| T0 | `qa/mvp6_task_0_receipt.json` | `(self)` | fixed point, predeclaration lock, strong-core audit |
| TA | `qa/mvp6_task_a_receipt.json` | `(self)` | SCC form compiler, 55/55 gate ACCEPT, negative tests |
| TB | `qa/mvp6_task_b_receipt.json` | `(self)` | voiced terminal vs unvoiced control |
| TC | `qa/mvp6_task_c_receipt.json` | `(self)` | full coupled trace, dwell-phrase law, lead diagnostics |
| TD | `qa/mvp6_task_d_receipt.json` | `(self)` | deterministic WAV/MIDI and FFT centroid bridge |
| TE | `qa/mvp6_task_e_receipt.json` | `(self)` | protocol, staging manifest, closing report |

## Form result

- Destination A (Far Shore, `757@6`), return form, inside the 2,928-node strong core.
- Itinerary: 55 bars (36 transit + 19 dwell), 408 micro steps, 122700 ms.
- Macro transitions: 55 (46 non-self + 9 dwell self-loops); all gate ACCEPT; zero LLM calls.
- Coverage: 7 offices, 12 phases, 42 distinct lifted states; return leg threads
  15 new interior nodes out of 18.
- Negative tests: `1831@6` → `OUTSIDE_STRONG_CORE`; an isolated boundary →
  `ISOLATED_BOUNDARY`.
- Variant D and Variant U produce the identical trajectory.

## Audio result

- WAV: `piece_a_far_shore.wav`, `e5c8bf2b`, 5411070 samples.
- MIDI: `piece_a_far_shore.mid`, `d44f543b`.
- Two-pass render byte-identical; 0 clipped samples; 0 non-finite samples;
  0 MIDI container leaks; 408 lead note-ons; 440 pad note-ons.
- FFT bridge: 55 bars; correlation 0.996629; median relative error 0.016631.
- Office-deconfounded contour: container r = 0.272628, lead r = 0.425925.
- Section centroids (Hz): quiet 498.498, climax 847.338, homecoming 779.513.
- Boundary rest: 0 scheduled oscillators; measured RMS ratio 0.179186 (14.934 dB below the mean voiced bar) and the
  final-50 ms tail ratio 0.000000.

## Law verification

| Law | Verification |
|---|---|
| 1. Planner composes; card steers; LLM waits | deterministic BFS + card; 0 LLM calls |
| 2. Form space is the strong core | 2,928 nodes; every node inside; negative tests reject |
| 3. If it is not in the lead line, it is not heard | lead pcSum and register bands carry the form; deconfounded lead r > container r |
| 4. Phase is terrain, not a dial | dwell placement at p6 (quiet) and p8 (climax); 12-step Q phrases |
| 5. Arrival must be voiced | terminal bar adds 12 micro steps; voiced vs unvoiced control |

## Fences

- No gate, census, ground-truth, seam-substrate, Q-engine, encoder, or `audio.ts`
  byte change; the Orrery application is read-only.
- Photonic layer overlay-only; `causationClaim: false`, `physicalQuantityClaim: false`,
  `tierClassifier: false`, `globalCHNull: true`; `C_H` unresolved.
- Policy-v3 key-change seams untouched; no recalibration.
- Scratch tasks made zero repository writes. The L23 landing is a separate
  authorized working-tree action; no tag or push.

## Terminal verdict

```text
MVP6-SPRINT-CLOSING
FIXED-POINT: 154db01...c884 / TREE CLEAN / L22 ab141615...d2c28 / 364225 B / 4216 lines
PINS-VERIFIED: 28/28 MATCH / ANCHORS 11/11 MATCH / PREDECLARATION-LOCKED TRUE
TASKS: T0 COMPLETE | TA COMPLETE | TB COMPLETE | TC COMPLETE | TD COMPLETE | TE COMPLETE
ITINERARY: 55 TRANSITIONS / 55 BARS / 408 CELLS / 122700 MS
STRONG-CORE: 2928 NODES / 276 ONE-WAY EXCLUDED / NEGATIVE TESTS REJECTED
COVERAGE: 7 OFFICES / 12 PHASES / 42 DISTINCT STATES / RETURN-NEW-INTERIOR 15/18
AUDIO: TWO-PASS IDENTICAL / CLIPPED 0 / NON-FINITE 0 / MIDI-LEAKS 0
FFT-BRIDGE: MODEL-CORR 0.996629 / MEDIAN-REL-ERR 0.016631
FENCES: GATE-UNTOUCHED / ORRERY-READ-ONLY / C-H-NULL / LLM-CALLS 0
REPO-WRITES: 0 (scratch) / STATUS: COMPLETE
```

