# MVP-6.3 Ear Validation Protocol — “The Far Shore” (clean ending)

Directive `MVP6.3-DIR-1` rev 1 · execution realm `/home/erick/workspace/scratch-governed-loop-run/mvp6_3/` · scratch-only until the L26 landing.

Layer: `SPEC-001 §1.3 overlay dynamics` · `gov517_correspondence_claimed: false` · `still_set_label: still_set`.
This document is a pre-registered listening protocol. It makes no canonical or
physical causation claim; the acoustic centroids, seam depths, and end-of-file
measurements below are Modality 2 boundary measurements carrying
`causationClaim: false`, `physicalQuantityClaim: false`, `tierClassifier: false`,
`globalCHNull: true`.

## 1. Predeclared shape

| Property | Value |
|---|---|
| Piece | `piece_a_far_shore_faded` (Destination A, return form) |
| Seed | `1387@0` (Saturn, ORBIT-A0) |
| Shore | `757@6` (boundary, escapable dual) |
| Strong core | 2,928 nodes; every itinerary node inside |
| Macro transitions | 55 (46 non-self + 9 dwell self-loops) |
| Bars | 55 (36 transit at K=5 + 19 dwell at K=12) |
| Micro steps | 408 at 300 ms |
| Duration | 122700 ms (2 min 02.7 s) |
| Render law | legato pad tails + 50 ms raised-cosine master fade-out |
| MIDI | byte-identical to the L25 control |

## 2. A/B control (listen in this order)

| Render | File | SHA-256 (first 8) |
|---|---|---|
| L25 control (mid-note cut) | `tools/governed-loop/mvp6_2/task-d/renders/piece_a_far_shore_legato.wav` | `defd2721` |
| L25 control MIDI | `tools/governed-loop/mvp6_2/task-d/renders/piece_a_far_shore_legato.mid` | `8a8c545f` |
| MVP-6.3 faded | `piece_a_far_shore_faded.wav` | `330abb9c` |
| MVP-6.3 faded MIDI | `piece_a_far_shore_faded.mid` | `8a8c545f` |

Measured end-of-file metric (`max|sample|` over the final 32 samples):
- L25 control: 215 (mid-note cut).
- MVP-6.3 faded: 0 (threshold 10). PASS.

The fade is 2205 samples (50 ms), window `0.5 * (1 + cos(pi * i / 2204))`. The WAV is byte-identical to L25 outside that window
(prefix identical: true); only bar 55 differs; the MIDI is byte-identical.

Stem isolation (the standing diagnostic for this defect):
- Pad-only stem ends at 3 (clean).
- Lead-only stem ends at 212 (the cut).
- Pad + lead = control within 1 LSB.

## 3. Listening sources

| Source | Track |
|---|---|
| WAV | `task-d/renders/piece_a_far_shore_faded.wav` (`330abb9c`) |
| MIDI | `task-d/renders/piece_a_far_shore_faded.mid` (`8a8c545f`) |
| Pad stem | `task-b/renders/stem_pad_only.wav` (`3bd92782`) |
| Lead stem | `task-b/renders/stem_lead_only.wav` (`43502acb`) |
| Trace | `tools/governed-loop/mvp6_1/task-c/traces/piece_a_far_shore_delooped.jsonl` (`38ab32e5`) |

Playback:

```bash
cd /home/erick/workspace/scratch-governed-loop-run/mvp6_3/task-d/renders
ffplay -nodisp -autoexit -loglevel error piece_a_far_shore_faded.wav
# stems
ffplay -nodisp -autoexit -loglevel error ../task-b/renders/stem_pad_only.wav
ffplay -nodisp -autoexit -loglevel error ../task-b/renders/stem_lead_only.wav
```

## 4. Section map and measured centroids

| Section | Span | Bars | Measured centroid (Hz) |
|---|---|---:|---:|
| Home and Mirror | 0 – 13800 ms | 5 | 601.855 |
| Departure | 13800 – 27300 ms | 9 | 709.031 |
| First Dwell (Quiet Zone) | 27300 – 38100 ms | 3 | 489.712 |
| Climax Transit and Dwell | 38100 – 58500 ms | 8 | 793.337 |
| The Shore | 58500 – 78600 ms | 9 | 548.909 |
| Return | 78600 – 108300 ms | 17 | 686.284 |
| Homecoming | 108300 – 122700 ms | 4 | 750.684 |

## 5. Phase 1 — blind structural listen

Listen once, end to end, without reading the timestamps. Mark where you hear a
section boundary, where the peak is, where the quiet still point is, where the
piece arrives, and whether the final second ends cleanly. Do not pause or rewind.
Record the raw times before reading §6.

| Perceived boundary | Time (mm:ss) | Confidence 1–5 |
|---|---|---:|
| Opening gesture closes |  |  |
| First section change |  |  |
| Quiet still point |  |  |
| Peak / climax |  |  |
| Arrival |  |  |
| Clean ending |  |  |

## 6. Phase 2 — timestamped adjudication

### Q1 — Opening mirror gesture (0.0 – 13.8 s)

| Marker | Time | Event |
|---|---:|---|
| Home | 0.0 s | `1387@0`, Saturn −12, phase 0 (achromatic coincidence, mean 36) |
| Mirror apex | 5.1 s | `1709@0`, Mercury 0, the A0 I₀-fixed self-mirror state |
| Return transit | 8.7 s | `1645@0` |
| Home again | 10.2 s | `1387@0` |

**Question.** Does the opening read as one self-contained gesture that leaves and
returns, distinct from the departure that follows?

**Pass.** Rating ≥ 3, and the mirror apex is audible as a change of colour.

### Q2 — Quiet dwell vs. climax dwell (27.3 – 58.5 s)

**Question.** Does the climax dwell read as a registral and timbral lift above the
quiet dwell (measured means: quiet 489.7 Hz, climax 793.3 Hz)?

**Pass.** Rating ≥ 3, and the two dwells are identifiable without the written map.

### Q3 — The Shore (67.5 – 78.6 s)

**Question.** Does the 300 ms rest at 74700 ms read as a held breath or cadence rather than an
audio dropout?

**Pass.** Rating ≥ 3, and the resumption is heard as continuation.

### Q4 — Return as new territory (78.6 – 108.3 s)

**Question.** Does the return sound like a different road home rather than the
outbound path played backwards?

**Pass.** Rating ≥ 3, and the return is distinguishable from the departure.

### Q5 — Voiced homecoming (108.3 – 122.7 s)

**Question.** Does the ending read as an arrival on the home node rather than a stop?

**Pass.** Rating ≥ 3, and the homecoming is heard as closure.

### Q6 — De-loop A/B (L23 vs L24)

The four dwell runs are 3/3, 4/4, 3/3, and 4/4 distinct phrases. Listen for varied
repeats.

**Pass.** Rating ≥ 3, and at least three of the four dwell runs read as varied.

### Q7 — Legato boundaries (L24 vs L25)

The seam metric is median 3.5 dB / max 5.0 dB on L24 and median 3.5 dB / max 5.0 dB on L25.

**Question.** Do bar boundaries flow without dropouts?

**Pass.** Rating ≥ 3, and the former 106.8 s and 108.3 s gaps are not audible as dropouts.

### Q8 — Clean ending (L25 vs MVP-6.3)

| Marker | Time | Event |
|---|---:|---|
| Final lead onsets | 122.1 s, 122.4 s | the last two 300 ms lead steps |
| Fade begins | 122.65 s | final 2205 samples (50 ms) |
| Last sample | 122.7 s | 0 |

Listen to the L25 control and the faded render back to back. The control ends
mid-note (max|last32| = 215); the faded render ends at 0.

**Question.** Does the piece end cleanly, without a cut or stutter at the very end?

**Pass.** Rating ≥ 3, and the final second reads as a decay to silence.

## 7. Dual scorecard

Adjudication follows the MVP-2c `mac1..mac3` discipline: pre-register, listen once,
record the verdict, do not re-describe after the fact. Listener 2 is optional and
external; the blind pass is the same for both.

| Question | Listener 1 heard (Y/N) | 1 rating | Listener 1 notes | Listener 2 heard (Y/N) | 2 rating | Listener 2 notes |
|---|---|---:|---|---|---:|---|
| Q1 mirror gesture |  |  |  |  |  |  |
| Q2 quiet vs climax |  |  |  |  |  |  |
| Q3 shore breath |  |  |  |  |  |  |
| Q4 return as new territory |  |  |  |  |  |  |
| Q5 voiced homecoming |  |  |  |  |  |  |
| Q6 de-loop A/B |  |  |  |  |  |  |
| Q7 legato boundaries |  |  |  |  |  |  |
| Q8 clean ending |  |  |  |  |  |  |

| Field | Listener 1 (Erick) | Listener 2 (external) |
|---|---|---|
| Name | Erick |  |
| Date |  |  |
| Session |  |  |
| Overall verdict (PASS / PASS WITH NOTES / FAIL) |  |  |

## 8. Non-claims and fences

- Overlay dynamics only (`SPEC-001 §1.3`); no GOV-517 correspondence is claimed.
- Boundary states are transit-only: `K_boundary = 0`, cannot be camped on.
- No canonical or physical causation claim; `C_H` remains unresolved (`null`).
- The seam, centroid, and end-of-file measurements are external boundary
  measurements, not symbolic invariants.
- The L23, L24, and L25 renders remain frozen as controls.

