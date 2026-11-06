# MVP6.1 Closing Report — De-looped Dwell Phrases: “The Far Shore”

**Directive:** `MVP6.1-DIR-1` rev 1  
**Execution realm:** `/home/erick/workspace/scratch-governed-loop-run/mvp6_1/`  
**Status:** SCRATCH COMPLETE; L24 working-tree landing pending

## Opening fixed point and pins

- Opening HEAD: `154db019711570ade5558a78eb5abb0b63b3c884` (L23 working-tree landing on the L22 commit)
- Tree clean at opening: false (L23 working-tree landing (uncommitted) on HEAD 154db01)
- Decision ledger before: `f174d947...` / 372,516 B / 4,249 lines
- Manifest before: `438a4cdf...` / 1,621 files / 122,194,085 B
- Release closure before: PASS / 418 / 0
- Pins verified: 37/37 SHA-256 and byte counts; `mvp2.py` anchors 11/11

## Task outcomes

| Task | Receipt | SHA-256 (first 8) | Outcome |
|---|---|---|---|
| T0 | `qa/mvp6_1_task_0_receipt.json` | `4389da0a` | L23 control fixed point, loop evidence, predeclaration lock |
| TA | `qa/mvp6_1_task_a_receipt.json` | `bb6d3ae9` | macro re-derivation; identical to the L23 control |
| TB | `qa/mvp6_1_task_b_receipt.json` | `da1b1592` | terminal control; de-loop is a no-op without repeats |
| TC | `qa/mvp6_1_task_c_receipt.json` | `ba342849` | de-looped trace; novelty law; A/B changed-set |
| TD | `qa/mvp6_1_task_d_receipt.json` | `6866b91f` | deterministic render; FFT bridge; A/B windows |
| TE | `qa/mvp6_1_task_e_receipt.json` | `(self)` | A/B protocol, staging manifest, closing report |

## De-loop result

- Root cause: after a 12-step bar starting at `s`, `advance(Q1^11(s)) = Q1^12(s) = s`, so every dwell repeat restarted identically.
- Rule: run-local Q1 rotation. Within each maximal same-node run the voice carry gains one extra Q1 advance between consecutive repeat bars; a parallel canonical carry keeps all non-repeat bars identical to the L23 control.
- Changed bars: [16, 17, 23, 24, 25, 33, 34, 53, 54, 55] (exactly the 10 predeclared repeat bars).
- `1453@6`: 3 bars, 3/3 distinct phrases, minimum step delta 12/12.
- `623@8`: 4 bars, 4/4 distinct phrases, minimum step delta 9/12.
- `379@7`: 3 bars, 3/3 distinct phrases, minimum step delta 10/12.
- `1387@0`: 4 bars, 4/4 distinct phrases, minimum step delta 12/12.
- Unchanged bars: 45 of 55 are byte-identical to the L23 control in emitted pitch content.

## Form result

- Destination A (Far Shore, `757@6`), return form, inside the 2,928-node strong core.
- Itinerary: 55 bars (36 transit + 19 dwell), 408 micro steps, 122700 ms.
- Macro transitions: 55 (46 non-self + 9 dwell self-loops); all gate ACCEPT; zero LLM calls; structurally identical to L23.
- Coverage: 7 offices, 12 phases, 42 distinct lifted states; return leg threads
  15 new interior nodes out of 18; negative tests reject `1831@6` and an isolated boundary.

## Audio result

- WAV: `piece_a_far_shore_delooped.wav`, `b2ce0b3f`, 5411070 samples.
- MIDI: `piece_a_far_shore_delooped.mid`, `8a8c545f`.
- Two-pass render byte-identical; 0 clipped samples; 0 non-finite samples;
  0 MIDI container leaks; 408 lead note-ons; 440 pad note-ons.
- FFT bridge: 55 bars; correlation 0.996728; median relative error 0.011654.
- Office-deconfounded contour: container r = 0.268562, lead r = 0.408392.
- Section centroids (Hz): quiet 506.865, climax 838.942, homecoming 777.965.
- Boundary rest: 0 scheduled oscillators; measured RMS ratio 0.179521 (14.918 dB below the mean voiced bar); final-50 ms tail ratio 0.000000.

## A/B against the L23 control

- Control WAV `e5c8bf2b`; de-looped WAV `b2ce0b3f`; control MIDI `d44f543b`; de-looped MIDI `8a8c545f`.
- Different bar windows: [16, 17, 18, 23, 24, 25, 26, 33, 34, 35, 53, 54, 55].
- Identical bar windows: 42 of 55.
- Bar 18: only the first 500 ms differs (release tail of the preceding phrase); after 500 ms identical = True.
- Bar 26: only the first 500 ms differs (release tail of the preceding phrase); after 500 ms identical = True.
- Bar 35: only the first 500 ms differs (release tail of the preceding phrase); after 500 ms identical = True.
- The macro, timings, sections, and all non-repeat bars are unchanged.

## Law verification

| Law | Verification |
|---|---|
| 1. Planner composes; card steers; LLM waits | deterministic BFS + card; 0 LLM calls |
| 2. Form space is the strong core | 2,928 nodes; every node inside; negative tests reject |
| 3. If it is not in the lead line, it is not heard | lead pcSum and register bands carry the form; deconfounded lead r > container r |
| 4. Phase is terrain, not a dial | dwell placement at p6 and p8; full 12-step Q phrases |
| 5. Arrival must be voiced | terminal bar adds 12 micro steps; voiced vs unvoiced control |
| 6. Repeats are varied phrases | 3/3, 4/4, 3/3, 4/4 distinct; minimum delta 9/12 |

## Fences

- No gate, census, ground-truth, seam-substrate, Q-engine, encoder, renderer, or `audio.ts` byte change; the Orrery application is read-only.
- Photonic layer overlay-only; `causationClaim: false`, `physicalQuantityClaim: false`, `tierClassifier: false`, `globalCHNull: true`; `C_H` unresolved.
- The L23 control render and receipts are frozen and remain the A/B reference.
- Scratch tasks made zero repository writes. The L24 landing is a separate authorized working-tree action; no tag or push.

## Terminal verdict

```text
MVP6.1-SPRINT-CLOSING
FIXED-POINT: 154db01... / L23 WORKING TREE / L23 f174d947... / 372516 B / 4249 lines
PINS-VERIFIED: 37/37 MATCH / ANCHORS 11/11 MATCH / PREDECLARATION-LOCKED TRUE
TASKS: T0 COMPLETE | TA COMPLETE | TB COMPLETE | TC COMPLETE | TD COMPLETE | TE COMPLETE
DE-LOOP: CHANGED 10 BARS / RUNS 3-4-3-4 DISTINCT / MIN-DELTA 9/12
A/B: DIFFERENT WINDOWS 13 / IDENTICAL WINDOWS 42 / MACRO FROZEN
AUDIO: TWO-PASS IDENTICAL / CLIPPED 0 / NON-FINITE 0 / MIDI-LEAKS 0
FFT-BRIDGE: MODEL-CORR 0.996728 / MEDIAN-REL-ERR 0.011654
FENCES: GATE-UNTOUCHED / CONTROL-FROZEN / C-H-NULL / LLM-CALLS 0
REPO-WRITES: 0 (scratch) / STATUS: COMPLETE
```

