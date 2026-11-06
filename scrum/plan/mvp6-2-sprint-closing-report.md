# MVP6.2 Closing Report — Legato Pad Tails: “The Far Shore”

**Directive:** `MVP6.2-DIR-1` rev 1  
**Execution realm:** `/home/erick/workspace/scratch-governed-loop-run/mvp6_2/`  
**Status:** SCRATCH COMPLETE; L25 working-tree landing pending

## Opening fixed point and pins

- Opening HEAD: `154db019711570ade5558a78eb5abb0b63b3c884` (stacked L23+L24 working-tree landing)
- Tree clean at opening: false (stacked L23+L24 working-tree landing (uncommitted) on HEAD 154db01)
- Decision ledger before: `8410ac25...` / 380,933 B / 4,282 lines
- Manifest before: `155c68b7...` / 1,642 files / 133,531,526 B
- Release closure before: PASS / 418 / 0
- Pins verified: 28/28 SHA-256 and byte counts; `mvp2.py` anchors 11/11
- Seam baseline: 53 direct boundaries, median 9.663 dB, max 35.413 dB

## Task outcomes

| Task | Receipt | SHA-256 (first 8) | Outcome |
|---|---|---|---|
| T0 | `qa/mvp6_2_task_0_receipt.json` | `7886bfd3` | L24 fixed point, seam baseline, predeclaration lock |
| TA | `qa/mvp6_2_task_a_receipt.json` | `32784dad` | macro re-verification; identical to L24 |
| TB | `qa/mvp6_2_task_b_receipt.json` | `d19dc37f` | terminal-arrival legato check |
| TC | `qa/mvp6_2_task_c_receipt.json` | `b16a96f8` | symbolic trace re-verification (byte-identical to L24) |
| TD | `qa/mvp6_2_task_d_receipt.json` | `870f55e7` | legato render, seam metric, FFT bridge, A/B |
| TE | `qa/mvp6_2_task_e_receipt.json` | `(self)` | protocol, staging manifest, closing report |

## Seam result

- Root cause: the pinned pad voice released all eight voices to zero at each bar end
  and attacked the next bar from zero, leaving a 6–35 dB boundary dip.
- Rule: legato pad tail. Each pad voice sustains through its bar end and decays over
  its release time into the next bar; the next bar's attack overlaps additively.
  Bar 33 (pre-rest) and bar 55 (final) release to zero at their own bar end.
- Direct boundaries measured: 53.
- Median depth: 9.663 dB → 3.470 dB (gate < 6.0).
- Maximum depth: 35.413 dB → 4.968 dB (gate < 12.0).
- Boundary rest: no pad tail crossed; rest RMS 348.669 vs control 348.669 (ratio 0.166133); tail ratio 0.000000.

## Form result

- Destination A (Far Shore, `757@6`), return form, inside the 2,928-node strong core.
- Itinerary: 55 bars (36 transit + 19 dwell), 408 micro steps, 122700 ms.
- Macro transitions: 55 (46 non-self + 9 dwell self-loops); all gate ACCEPT; zero LLM calls; structurally identical to L24.
- Coverage: 7 offices, 12 phases, 42 distinct states; negative tests reject.

## Audio result

- WAV: `piece_a_far_shore_legato.wav`, `defd2721`, 5411070 samples.
- MIDI: `piece_a_far_shore_legato.mid`, `8a8c545f`, byte-identical to L24.
- Two-pass render byte-identical; 0 clipped samples; 0 non-finite samples;
  0 MIDI container leaks; 408 lead note-ons; 440 pad note-ons.
- FFT bridge: 55 bars; correlation 0.997032; median relative error 0.015124.
- Office-deconfounded contour: container r = 0.224875, lead r = 0.460799.
- Section centroids (Hz): quiet 489.712, climax 793.337, homecoming 750.793.

## A/B against the L24 control

- Control WAV `b2ce0b3f`; legato WAV `defd2721`; control MIDI `8a8c545f`; legato MIDI `8a8c545f`.
- Different WAV bar windows: 55; identical MIDI: true.
- Every window changes because the pad now carries across the lines. The macro,
  timings, sections, trace, and MIDI are unchanged.

## Law verification

| Law | Verification |
|---|---|
| 1. Planner composes; card steers; LLM waits | deterministic BFS + card; 0 LLM calls |
| 2. Form space is the strong core | 2,928 nodes; every node inside; negative tests reject |
| 3. Lead line carries the form | deconfounded lead r > container r |
| 4. Phase is terrain | dwell placement at p6 and p8; full 12-step Q phrases |
| 5. Arrival voiced | terminal bar adds 12 micro steps |
| 6. Repeats are varied | 3/3, 4/4, 3/3, 4/4 distinct phrases |
| 7. Boundaries flow | median and max seam depth under the predeclared gates |

## Fences

- No gate, census, ground-truth, seam-substrate, Q-engine, encoder, pinned renderer,
  or `audio.ts` byte change; the Orrery application is read-only.
- Photonic layer overlay-only; `causationClaim: false`, `physicalQuantityClaim: false`, `tierClassifier: false`, `globalCHNull: true`; `C_H` unresolved.
- The L23 and L24 renders and receipts remain frozen as controls.
- Scratch tasks made zero repository writes. The L25 landing is a separate
  authorized working-tree action; no tag or push.

## Terminal verdict

```text
MVP6.2-SPRINT-CLOSING
FIXED-POINT: 154db01... / L23+L24 WORKING TREE / L24 8410ac25... / 380933 B / 4282 lines
PINS-VERIFIED: 28/28 MATCH / ANCHORS 11/11 MATCH / PREDECLARATION-LOCKED TRUE
TASKS: T0 COMPLETE | TA COMPLETE | TB COMPLETE | TC COMPLETE | TD COMPLETE | TE COMPLETE
SEAMS: CONTROL MEDIAN 9.663 DB / MAX 35.413 DB -> LEGATO MEDIAN 3.470 DB / MAX 4.968 DB
REST: RMS RATIO 0.166133 / NO PAD TAIL CROSSED
AUDIO: TWO-PASS IDENTICAL / CLIPPED 0 / NON-FINITE 0 / MIDI-LEAKS 0 / MIDI-IDENTICAL
FFT-BRIDGE: MODEL-CORR 0.997032 / MEDIAN-REL-ERR 0.015124
FENCES: GATE-UNTOUCHED / CONTROLS-FROZEN / C-H-NULL / LLM-CALLS 0
REPO-WRITES: 0 (scratch) / STATUS: COMPLETE
```

