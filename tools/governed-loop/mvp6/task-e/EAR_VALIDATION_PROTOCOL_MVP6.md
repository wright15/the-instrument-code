# MVP-6 Ear Validation Protocol — “The Far Shore”

Directive `MVP6-DIR-1` rev 1 · execution realm `/home/erick/workspace/scratch-governed-loop-run/mvp6/` · scratch-only until the L23 landing.

Layer: `SPEC-001 §1.3 overlay dynamics` · `gov517_correspondence_claimed: false` · `still_set_label: still_set`.
This document is a pre-registered listening protocol. It makes no canonical or
physical causation claim; the acoustic centroids below are Modality 2 boundary
measurements carrying `causationClaim: false`, `physicalQuantityClaim: false`,
`tierClassifier: false`, `globalCHNull: true`.

## 1. Predeclared shape

| Property | Value |
|---|---|
| Piece | `piece_a_far_shore` (Destination A, return form) |
| Seed | `1387@0` (Saturn, ORBIT-A0) |
| Shore | `757@6` (boundary, escapable dual) |
| Strong core | 2,928 nodes; every itinerary node inside |
| Macro transitions | 55 (46 non-self + 9 dwell self-loops) |
| Bars | 55 (36 transit at K=5 + 19 dwell at K=12) |
| Micro steps | 408 at 300 ms |
| Duration | 122700 ms (2 min 02.7 s) |
| Q mode | carried across the entire piece; zero resets; zero still-set entries |
| Offline render | 16-bit PCM WAV and SMF-1 MIDI, two-pass byte-identical |

## 2. Listening sources

| Source | Track |
|---|---|
| WAV | `task-d/renders/piece_a_far_shore.wav` (`e5c8bf2b`) |
| MIDI | `task-d/renders/piece_a_far_shore.mid` (`d44f543b`) |
| Trace | `task-c/traces/piece_a_far_shore.jsonl` (`fc0c7a09`) |

Playback:

```bash
cd /home/erick/workspace/scratch-governed-loop-run/mvp6/task-d/renders
ffplay -nodisp -autoexit -loglevel error piece_a_far_shore.wav
# or, after the L23 landing:
ffplay -nodisp -autoexit -loglevel error \
  /home/erick/projects/integrated-release/tools/governed-loop/mvp6/task-d/renders/piece_a_far_shore.wav
```

## 3. Section map and measured centroids

| Section | Span | Bars | Measured centroid (Hz) | Orchestration |
|---|---|---:|---:|---|
| Home and Mirror | 0 – 13800 ms | 5 | 634.285 | |
| Departure | 13800 – 27300 ms | 9 | 740.024 | |
| First Dwell (Quiet Zone) | 27300 – 38100 ms | 3 | 498.498 | |
| Climax Transit and Dwell | 38100 – 58500 ms | 8 | 847.338 | |
| The Shore | 58500 – 78600 ms | 9 | 574.162 | |
| Return | 78600 – 108300 ms | 17 | 728.201 | |
| Homecoming | 108300 – 122700 ms | 4 | 779.513 | |

## 4. Phase 1 — blind structural listen

Listen once, end to end, without reading the timestamps. Mark where you hear a
section boundary, where the peak is, where the quiet still point is, and where the
piece arrives. Do not pause or rewind. Record the raw times before reading §5.

| Perceived boundary | Time (mm:ss) | Confidence 1–5 |
|---|---|---:|
| Opening gesture closes |  |  |
| First section change |  |  |
| Quiet still point |  |  |
| Peak / climax |  |  |
| Arrival |  |  |

## 5. Phase 2 — timestamped adjudication

### Q1 — Opening mirror gesture (0.0 – 13.8 s)

| Marker | Time | Event |
|---|---:|---|
| Home | 0.0 s | `1387@0`, Saturn −12, phase 0 (achromatic coincidence, mean 36) |
| Mirror apex | 5.1 s | `1709@0`, Mercury 0, the A0 I₀-fixed self-mirror state |
| Return transit | 8.7 s | `1645@0` |
| Home again | 10.2 s | `1387@0` |

**Question.** Does the opening read as one self-contained gesture that leaves and
returns, distinct from the departure that follows?

**Pass.** Rating ≥ 3, and the mirror apex is audible as a change of colour
(Mercury middle band against the Saturn low band) rather than a restart.

### Q2 — Quiet dwell vs. climax dwell (27.3 – 58.5 s)

| Marker | Time | Event |
|---|---:|---|
| Quiet dwell in | 27.3 s | `1453@6`, Jupiter 0, phase 6 (interior spread minimum 96/35) |
| Quiet dwell out | 38.1 s | three full 12-step Q phrases |
| Climax dwell in | 44.1 s | `623@8`, Venus +12, phase 8 (global spread maximum 60/7) |
| Climax dwell out | 58.5 s | four full 12-step Q phrases |

**Question.** Does the climax dwell read as a registral and timbral lift above the
quiet dwell (measured means: quiet 498.5 Hz, climax 847.3 Hz)?

**Pass.** Rating ≥ 3, and the two dwells are identifiable without the written map.

### Q3 — The Shore (67.5 – 78.6 s)

| Marker | Time | Event |
|---|---:|---|
| Shore neighbour in | 67.5 s | `379@7`, Jupiter 0, governed edge of the world |
| Boundary rest | 74700 – 75000 ms | `757@6`; 0 oscillators scheduled; the measured window is the release tail of the last lead note |
| Lead resumes | 75.0 s | `379@7`, same governed node, Q carried through the rest |

**Question.** Does the 300 ms rest read as a held breath or cadence rather than an
audio dropout?

**Pass.** Rating ≥ 3, and the resumption is heard as continuation, not a new section.

### Q4 — Return as new territory (78.6 – 108.3 s)

**Question.** Does the return sound like a different road home rather than the
outbound path played backwards? (15 of the 18 return interior nodes are new.)

**Pass.** Rating ≥ 3, and the return is distinguishable from the departure.

### Q5 — Voiced homecoming (108.3 – 122.7 s)

| Marker | Time | Event |
|---|---:|---|
| Homecoming in | 108.3 s | `1387@0`, Saturn −12, phase 0 |
| End | 122.7 s | four full 12-step Q phrases; terminal node voiced |

**Question.** Does the ending read as an arrival on the home node rather than a stop?
The unvoiced control (`control_unvoiced_terminal`) ends after the `859@0` bar with the
terminal `1387@0` silent; the voiced form adds 12 terminal micro steps.

**Pass.** Rating ≥ 3, and the homecoming is heard as closure.

## 6. Dual scorecard

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

| Field | Listener 1 (Erick) | Listener 2 (external) |
|---|---|---|
| Name | Erick |  |
| Date |  |  |
| Session |  |  |
| Overall verdict (PASS / PASS WITH NOTES / FAIL) |  |  |

## 7. Non-claims and fences

- Overlay dynamics only (`SPEC-001 §1.3`); no GOV-517 correspondence is claimed.
- Boundary states are transit-only: `K_boundary = 0`, cannot be camped on.
- No canonical or physical causation claim; `C_H` remains unresolved (`null`).
- The acoustic centroids are external boundary measurements, not symbolic
  invariants, and the lead-line contour is carried by the micro pitch sums.
- The L21 ear protocol and scorecard are untouched; this protocol is scoped to
  this piece only.

