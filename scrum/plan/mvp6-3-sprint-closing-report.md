# MVP6.3 Closing Report — Clean Ending: Master Fade-Out and Stem Isolation

**Directive:** `MVP6.3-DIR-1` rev 1  
**Execution realm:** `/home/erick/workspace/scratch-governed-loop-run/mvp6_3/`  
**Status:** SCRATCH COMPLETE; L26 working-tree landing pending

## Opening fixed point and pins

- Opening HEAD: `154db019711570ade5558a78eb5abb0b63b3c884` (stacked L23+L24+L25 working-tree landing)
- Tree clean at opening: false (stacked L23+L24+L25 working-tree landing (uncommitted) on HEAD 154db01)
- Decision ledger before: `567157e8...` / 389,529 B / 4,315 lines
- Manifest before: `76c33d82...` / 1,663 files / 145,020,217 B
- Release closure before: PASS / 418 / 0
- Pins verified: 31/31 SHA-256 and byte counts; `mvp2.py` anchors 11/11
- End-cut evidence: L25 `max|last32|` = 215, ends at zero = false

## Task outcomes

| Task | Receipt | SHA-256 (first 8) | Outcome |
|---|---|---|---|
| T0 | `qa/mvp6_3_task_0_receipt.json` | `f8bedb13` | L25 fixed point, end-cut evidence, predeclaration lock |
| TA | `qa/mvp6_3_task_a_receipt.json` | `9804e7af` | macro re-verification; identical to L25 |
| TB | `qa/mvp6_3_task_b_receipt.json` | `ed0fa97e` | pad/lead stem isolation of the end cut |
| TC | `qa/mvp6_3_task_c_receipt.json` | `7351d91f` | symbolic trace re-verification (byte-identical to L25) |
| TD | `qa/mvp6_3_task_d_receipt.json` | `541bbe77` | faded render, end-of-file, seam/rest/FFT, A/B |
| TE | `qa/mvp6_3_task_e_receipt.json` | `(self)` | protocol, staging manifest, closing report |

## End-cut result

- Root cause: the final lead note (onset 122.4 s, Saturn release) still rings at
  ~12% envelope when the 5,411,070-sample buffer ends; the renderer never fades
  the master bus.
- Stem isolation: pad-only stem ends at 3 (clean); lead-only stem ends at 212 (the cut); their sum matches the control within 1 LSB.
- Fix: 2205 samples (50 ms) raised-cosine master
  fade-out, window `0.5 * (1 + cos(pi * i / 2204))`.
- End-of-file metric: control 215 -> faded 0 (threshold 10); last eight samples [0, 0, 0, 0, 0, 0, 0, 0].
- The faded WAV is byte-identical to L25 outside the fade window (prefix identical = true); only bar 55 differs.

## Form result

- Destination A (Far Shore, `757@6`), return form, inside the 2,928-node strong core.
- Itinerary: 55 bars (36 transit + 19 dwell), 408 micro steps, 122700 ms.
- Macro transitions: 55 (46 non-self + 9 dwell self-loops); all gate ACCEPT; zero LLM calls; structurally identical to L25.
- Coverage: 7 offices, 12 phases, 42 distinct states; negative tests reject.

## Audio result

- WAV: `piece_a_far_shore_faded.wav`, `330abb9c`, 5411070 samples.
- MIDI: `piece_a_far_shore_faded.mid`, `8a8c545f`, byte-identical to L25.
- Two-pass render byte-identical; 0 clipped samples; 0 non-finite samples;
  0 MIDI container leaks; 408 lead note-ons; 440 pad note-ons.
- FFT bridge: 55 bars; correlation 0.997037; median relative error 0.015124.
- Office-deconfounded contour: container r = 0.225100, lead r = 0.460811.
- Seam metric: median 3.470 dB, max 4.968 dB (unchanged from L25).
- Boundary rest: RMS ratio 0.166133; tail ratio 0.000000; no pad tail crossed.
- Section centroids (Hz): quiet 489.712, climax 793.337, homecoming 750.684.

## A/B against the L25 control

- Control WAV `defd2721`; faded WAV `330abb9c`; MIDI identical to L25.
- Prefix identical outside the fade window: true; differing bar windows: [55].
- The macro, timings, trace, sections, and markers are unchanged.

## Law verification

| Law | Verification |
|---|---|
| 1. Planner composes; card steers; LLM waits | deterministic BFS + card; 0 LLM calls |
| 2. Form space is the strong core | 2,928 nodes; every node inside; negative tests reject |
| 3. Lead line carries the form | deconfounded lead r > container r |
| 4. Phase is terrain | dwell placement at p6 and p8; full 12-step Q phrases |
| 5. Arrival voiced | terminal bar adds 12 micro steps |
| 6. Repeats are varied | 3/3, 4/4, 3/3, 4/4 distinct phrases |
| 7. Boundaries flow | seam median and max under the predeclared gates |
| 8. The file ends cleanly | final 32 samples at 0; pad stem clean; lead stem carries the cut |

## Fences

- No gate, census, ground-truth, seam-substrate, Q-engine, encoder, pinned renderer,
  landed legato renderer, or `audio.ts` byte change; the Orrery application is read-only.
- Photonic layer overlay-only; `causationClaim: false`, `physicalQuantityClaim: false`, `tierClassifier: false`, `globalCHNull: true`; `C_H` unresolved.
- The L23, L24, and L25 renders and receipts remain frozen as controls.
- Scratch tasks made zero repository writes. The L26 landing is a separate
  authorized working-tree action; no tag or push.

## Terminal verdict

```text
MVP6.3-SPRINT-CLOSING
FIXED-POINT: 154db01... / L23+L24+L25 WORKING TREE / L25 567157e8... / 389529 B / 4315 lines
PINS-VERIFIED: 31/31 MATCH / ANCHORS 11/11 MATCH / PREDECLARATION-LOCKED TRUE
TASKS: T0 COMPLETE | TA COMPLETE | TB COMPLETE | TC COMPLETE | TD COMPLETE | TE COMPLETE
END-CUT: CONTROL 215 -> FADED 0 / PAD 3 / LEAD 212 / SUM 1 LSB
FADE: 2205 SAMPLES / 50 MS / PREFIX-IDENTICAL TRUE / ONLY BAR 55 DIFFERS
AUDIO: TWO-PASS IDENTICAL / CLIPPED 0 / NON-FINITE 0 / MIDI-LEAKS 0 / MIDI-IDENTICAL
SEAMS: MEDIAN 3.470 DB / MAX 4.968 DB
FFT-BRIDGE: MODEL-CORR 0.997037 / MEDIAN-REL-ERR 0.015124
FENCES: GATE-UNTOUCHED / CONTROLS-FROZEN / C-H-NULL / LLM-CALLS 0
REPO-WRITES: 0 (scratch) / STATUS: COMPLETE
```

