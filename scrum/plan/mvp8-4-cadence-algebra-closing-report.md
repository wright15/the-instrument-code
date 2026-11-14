# MVP8.4-CADENCE-ALGEBRA-CLOSING-REPORT

- **Directive:** `MVP8.4-CADENCE-ALGEBRA-DIR-1` rev 1 (scratch execution)
- **Opening fixed point:** L31 `508f1f5` / ledger `14ebc6f4...` (440,222 B / 4,517 lines) / MANIFEST 1,997 files / closure 418/0
- **Adjudicated outcome:** `ADOPT_CADENCE_ALGEBRA`

## Measured verdict

```text
MVP8.4-CADENCE-ALGEBRA-CLOSING
FIXED-POINT: 508f1f5... / TREE CLEAN / L31 LEDGER 14ebc6f4... / 440222 B / MANIFEST 1997 files
TASKS: T0 COMPLETE | TA COMPLETE | TB COMPLETE | TC COMPLETE | TD COMPLETE
BETS: BET-A1 PASS | BET-A2 PASS | BET-B1 PASS | BET-B2 PASS | BET-C 13860/13860
AUDITIONS-D: SIBLINGS-6 PASS | MIXO-CTRL PASS | VOICE-LED-2 PASS | OUT-OF-MASK 0 | MIDI-TRUE 9/9
EAR-GATE: SIGNED_HUMAN
FENCES: Q-SUBSTRATE-UNTOUCHED / ARCH-MAP-PINNED / C-H-NULL / LLM-CALLS 0 / REPO-WRITES 0
STATUS: ADOPT_CADENCE_ALGEBRA
```

## Task 0 - fixed point and predeclaration

- HEAD `508f1f510602f97e0cc74b15ee99ed6b683f7fd9`; tree clean; `origin/main` in sync.
- 13/13 pinned landed modules verified; 11/11 `mvp2.py` anchors verified.
- Strong core exact: 5,544 nodes / 3,204 reachable / 2,928 S000 / 2,388 governed / 540 boundary / 276 one-way.
- Predeclaration locked before evaluation (`task-0/mvp8_4_predeclared_bets.json`,
  SHA-256 `1ec65ae3…`); ear scorecard initialized
  `PENDING_HUMAN` (SHA-256 `fb0c6ebd…`).

## Task A - pattern query, census, cover numbers, bridges

`task-a/pattern_query.py` generalizes the single-chord query to sequences over
all 5,544 lifted nodes (462 phase-0 masks). `--verify` reproduces the landed M1
census on all six contiguous families (match: True).

- Bet A1: no-bass constraint **41,580**
  instances / **3,141** shape
  sequences; descending-bass rule **24,111**
  / **2,053**; governed
  **1,532**, all same-office
  (True), shape sequences
  256; anchor-to-satellite governed
  546 (Jupiter
  67); d=1 siblings
  91; tier-preserving
  4,962; exact Andalusian shape
  sequence 17; exact shapes + bass
  **6**.
- Six siblings: `1387->1643` (d7, roots [10, 8, 6, 5]), `1451->1459` (d4, roots [5, 3, 1, 0]), `1453->2477` (d1, roots [0, 10, 8, 7]), `1709->1741` (d5, roots [7, 5, 3, 2]), `2741->2869` (d6, roots [9, 7, 5, 4]), `2773->2777` (d3, roots [4, 2, 0, 11]).
- Mixolydian near-miss: `1717->949` d2, bass `(-2, -2, -2)` (present:
  True).
- Bet A2: Andalusian cover number **2** with **0**
  single-container readings; Pachelbel/Axis/Fifties uniquely `2741`;
  Neapolitan uniquely `2475`; the Andalusian is the unique cover-2 cadence.
- Bet C: shared anchored-subnode count **5** on **13,860 /
  13,860** single-pc ordered pairs (zero variance); the
  derivation is C(5,4)=5 from the shared six pitch classes including pc 0.
  Multi-pc measured distribution: size 2 -> 1 shared subnode; sizes 3-5 -> 0.

## Task B - voice-led rotations and standalone cleanup

Bet B1 (12 progressions): rotation legality, stack-root bass, score-true MIDI,
and deterministic two-pass renders all pass; total voice-leading displacement
under `voice_lead` is minimal and never exceeds the all-m=0 path (e.g. `2677@0`
47 -> 9; Andalusian 46 -> 16; Neapolitan 28 -> 10).

Bet B2 (standalone): the promoted modules contain zero hardcoded user paths and
zero scratch imports; a repository-root import probe runs clean; multi-node
`observe()` honors per-node bar lists `[2, 5]` exactly.

## Task C - auditions

| Session | Bars | Rotations | Displacement | Out-of-mask pad/lead | Unison | Bass=root | Root lowest | MIDI pad |
|---|---|---|---|---|---|---|---|---|
| `D1` | 4 | [0, 0, 0, 0] | 20 | 0/0 | 0 | True | True | True |
| `D2` | 4 | [0, 0, 0, 0] | 20 | 0/0 | 0 | True | True | True |
| `D3` | 4 | [0, 0, 0, 0] | 46 | 0/0 | 0 | True | True | True |
| `D4` | 4 | [0, 0, 0, 0] | 20 | 0/0 | 0 | True | True | True |
| `D5` | 4 | [0, 0, 0, 0] | 20 | 0/0 | 0 | True | True | True |
| `D6` | 4 | [0, 0, 0, 0] | 38 | 0/0 | 0 | True | True | True |
| `D7` | 4 | [0, 0, 0, 0] | 83 | 0/0 | 0 | True | True | True |
| `D8` | 4 | [0, 2, 1, 2] | 9 | 0/0 | 0 | True | True | True |
| `D8b` | 4 | [0, 0, 0, 0] | 47 | 0/0 | 0 | True | True | True |
| `D9` | 3 | [1, 0, 0] | 27 | 0/0 | 0 | True | True | True |

All nine auditions are score-true SMF-1 MIDI with 0 out-of-mask notes and 0
unison leaks. The six sibling roots match the locked predeclaration exactly; the
D7 control descends `(-2, -2, -2)`. Session sheets are template-free and record
degree, Chaldean index, stride, depth, rotation, root pc, bass MIDI, chord pcs,
shape, and seam variables.

## Listening guide (D1-D9 + D8b reference)

### D1

- WAV: `/home/erick/workspace/scratch-governed-loop-run/mvp8_4_cadence_algebra/task-c/sessions/d1.wav`
- Play: `ffplay -autoexit -nodisp -loglevel error "/home/erick/workspace/scratch-governed-loop-run/mvp8_4_cadence_algebra/task-c/sessions/d1.wav"` or `paplay "/home/erick/workspace/scratch-governed-loop-run/mvp8_4_cadence_algebra/task-c/sessions/d1.wav"`
- Duration: 14400 ms / rotation path `[0, 0, 0, 0]`

| Bar | Node | Degree | Chaldean | Stride | Depth | Rotation | Shape | Bass pc |
|---|---|---|---|---|---|---|---|---|
| 1 | 1387@0 | 7 | 7 | 2 | 3 | 0 | [0, 3, 7] | 10 |
| 2 | 1387@0 | 6 | 6 | 2 | 3 | 0 | [0, 4, 7] | 8 |
| 3 | 1387@0 | 5 | 5 | 2 | 3 | 0 | [0, 4, 7] | 6 |
| 4 | 1643@0 | 4 | 4 | 1 | 3 | 0 | [0, 1, 4] | 5 |

### D2

- WAV: `/home/erick/workspace/scratch-governed-loop-run/mvp8_4_cadence_algebra/task-c/sessions/d2.wav`
- Play: `ffplay -autoexit -nodisp -loglevel error "/home/erick/workspace/scratch-governed-loop-run/mvp8_4_cadence_algebra/task-c/sessions/d2.wav"` or `paplay "/home/erick/workspace/scratch-governed-loop-run/mvp8_4_cadence_algebra/task-c/sessions/d2.wav"`
- Duration: 14400 ms / rotation path `[0, 0, 0, 0]`

| Bar | Node | Degree | Chaldean | Stride | Depth | Rotation | Shape | Bass pc |
|---|---|---|---|---|---|---|---|---|
| 1 | 1451@0 | 4 | 4 | 2 | 3 | 0 | [0, 3, 7] | 5 |
| 2 | 1451@0 | 3 | 3 | 2 | 3 | 0 | [0, 4, 7] | 3 |
| 3 | 1451@0 | 2 | 2 | 2 | 3 | 0 | [0, 4, 7] | 1 |
| 4 | 1459@0 | 1 | 1 | 1 | 3 | 0 | [0, 1, 4] | 0 |

### D3

- WAV: `/home/erick/workspace/scratch-governed-loop-run/mvp8_4_cadence_algebra/task-c/sessions/d3.wav`
- Play: `ffplay -autoexit -nodisp -loglevel error "/home/erick/workspace/scratch-governed-loop-run/mvp8_4_cadence_algebra/task-c/sessions/d3.wav"` or `paplay "/home/erick/workspace/scratch-governed-loop-run/mvp8_4_cadence_algebra/task-c/sessions/d3.wav"`
- Duration: 14400 ms / rotation path `[0, 0, 0, 0]`

| Bar | Node | Degree | Chaldean | Stride | Depth | Rotation | Shape | Bass pc |
|---|---|---|---|---|---|---|---|---|
| 1 | 1453@0 | 1 | 1 | 2 | 3 | 0 | [0, 3, 7] | 0 |
| 2 | 1453@0 | 7 | 7 | 2 | 3 | 0 | [0, 4, 7] | 10 |
| 3 | 1453@0 | 6 | 6 | 2 | 3 | 0 | [0, 4, 7] | 8 |
| 4 | 2477@0 | 5 | 5 | 1 | 3 | 0 | [0, 1, 4] | 7 |

### D4

- WAV: `/home/erick/workspace/scratch-governed-loop-run/mvp8_4_cadence_algebra/task-c/sessions/d4.wav`
- Play: `ffplay -autoexit -nodisp -loglevel error "/home/erick/workspace/scratch-governed-loop-run/mvp8_4_cadence_algebra/task-c/sessions/d4.wav"` or `paplay "/home/erick/workspace/scratch-governed-loop-run/mvp8_4_cadence_algebra/task-c/sessions/d4.wav"`
- Duration: 14400 ms / rotation path `[0, 0, 0, 0]`

| Bar | Node | Degree | Chaldean | Stride | Depth | Rotation | Shape | Bass pc |
|---|---|---|---|---|---|---|---|---|
| 1 | 1709@0 | 5 | 5 | 2 | 3 | 0 | [0, 3, 7] | 7 |
| 2 | 1709@0 | 4 | 4 | 2 | 3 | 0 | [0, 4, 7] | 5 |
| 3 | 1709@0 | 3 | 3 | 2 | 3 | 0 | [0, 4, 7] | 3 |
| 4 | 1741@0 | 2 | 2 | 1 | 3 | 0 | [0, 1, 4] | 2 |

### D5

- WAV: `/home/erick/workspace/scratch-governed-loop-run/mvp8_4_cadence_algebra/task-c/sessions/d5.wav`
- Play: `ffplay -autoexit -nodisp -loglevel error "/home/erick/workspace/scratch-governed-loop-run/mvp8_4_cadence_algebra/task-c/sessions/d5.wav"` or `paplay "/home/erick/workspace/scratch-governed-loop-run/mvp8_4_cadence_algebra/task-c/sessions/d5.wav"`
- Duration: 14400 ms / rotation path `[0, 0, 0, 0]`

| Bar | Node | Degree | Chaldean | Stride | Depth | Rotation | Shape | Bass pc |
|---|---|---|---|---|---|---|---|---|
| 1 | 2741@0 | 6 | 6 | 2 | 3 | 0 | [0, 3, 7] | 9 |
| 2 | 2741@0 | 5 | 5 | 2 | 3 | 0 | [0, 4, 7] | 7 |
| 3 | 2741@0 | 4 | 4 | 2 | 3 | 0 | [0, 4, 7] | 5 |
| 4 | 2869@0 | 3 | 3 | 1 | 3 | 0 | [0, 1, 4] | 4 |

### D6

- WAV: `/home/erick/workspace/scratch-governed-loop-run/mvp8_4_cadence_algebra/task-c/sessions/d6.wav`
- Play: `ffplay -autoexit -nodisp -loglevel error "/home/erick/workspace/scratch-governed-loop-run/mvp8_4_cadence_algebra/task-c/sessions/d6.wav"` or `paplay "/home/erick/workspace/scratch-governed-loop-run/mvp8_4_cadence_algebra/task-c/sessions/d6.wav"`
- Duration: 14400 ms / rotation path `[0, 0, 0, 0]`

| Bar | Node | Degree | Chaldean | Stride | Depth | Rotation | Shape | Bass pc |
|---|---|---|---|---|---|---|---|---|
| 1 | 2773@0 | 3 | 3 | 2 | 3 | 0 | [0, 3, 7] | 4 |
| 2 | 2773@0 | 2 | 2 | 2 | 3 | 0 | [0, 4, 7] | 2 |
| 3 | 2773@0 | 1 | 1 | 2 | 3 | 0 | [0, 4, 7] | 0 |
| 4 | 2777@0 | 7 | 7 | 1 | 3 | 0 | [0, 1, 4] | 11 |

### D7

- WAV: `/home/erick/workspace/scratch-governed-loop-run/mvp8_4_cadence_algebra/task-c/sessions/d7.wav`
- Play: `ffplay -autoexit -nodisp -loglevel error "/home/erick/workspace/scratch-governed-loop-run/mvp8_4_cadence_algebra/task-c/sessions/d7.wav"` or `paplay "/home/erick/workspace/scratch-governed-loop-run/mvp8_4_cadence_algebra/task-c/sessions/d7.wav"`
- Duration: 14400 ms / rotation path `[0, 0, 0, 0]`

| Bar | Node | Degree | Chaldean | Stride | Depth | Rotation | Shape | Bass pc |
|---|---|---|---|---|---|---|---|---|
| 1 | 1717@0 | 2 | 2 | 2 | 3 | 0 | [0, 3, 7] | 2 |
| 2 | 1717@0 | 1 | 1 | 2 | 3 | 0 | [0, 4, 7] | 0 |
| 3 | 1717@0 | 7 | 7 | 2 | 3 | 0 | [0, 4, 7] | 10 |
| 4 | 949@0 | 6 | 6 | 1 | 3 | 0 | [0, 1, 4] | 8 |

### D8

- WAV: `/home/erick/workspace/scratch-governed-loop-run/mvp8_4_cadence_algebra/task-c/sessions/d8.wav`
- Play: `ffplay -autoexit -nodisp -loglevel error "/home/erick/workspace/scratch-governed-loop-run/mvp8_4_cadence_algebra/task-c/sessions/d8.wav"` or `paplay "/home/erick/workspace/scratch-governed-loop-run/mvp8_4_cadence_algebra/task-c/sessions/d8.wav"`
- Duration: 14400 ms / rotation path `[0, 2, 1, 2]`

| Bar | Node | Degree | Chaldean | Stride | Depth | Rotation | Shape | Bass pc |
|---|---|---|---|---|---|---|---|---|
| 1 | 2677@0 | 1 | 1 | 2 | 4 | 0 | [0, 4, 6, 11] | 0 |
| 2 | 2677@0 | 5 | 5 | 2 | 4 | 2 | [0, 3, 4, 9] | 2 |
| 3 | 2677@0 | 6 | 6 | 2 | 4 | 1 | [0, 4, 6, 9] | 0 |
| 4 | 2677@0 | 4 | 4 | 2 | 4 | 2 | [0, 4, 5, 9] | 0 |

### D9

- WAV: `/home/erick/workspace/scratch-governed-loop-run/mvp8_4_cadence_algebra/task-c/sessions/d9.wav`
- Play: `ffplay -autoexit -nodisp -loglevel error "/home/erick/workspace/scratch-governed-loop-run/mvp8_4_cadence_algebra/task-c/sessions/d9.wav"` or `paplay "/home/erick/workspace/scratch-governed-loop-run/mvp8_4_cadence_algebra/task-c/sessions/d9.wav"`
- Duration: 10800 ms / rotation path `[1, 0, 0]`

| Bar | Node | Degree | Chaldean | Stride | Depth | Rotation | Shape | Bass pc |
|---|---|---|---|---|---|---|---|---|
| 1 | 1453@0 | 4 | 4 | 2 | 3 | 1 | [0, 4, 9] | 8 |
| 2 | 2477@0 | 5 | 5 | 1 | 3 | 0 | [0, 1, 4] | 7 |
| 3 | 2477@0 | 1 | 1 | 2 | 3 | 0 | [0, 3, 7] | 0 |

### D8b

- WAV: `/home/erick/workspace/scratch-governed-loop-run/mvp8_4_cadence_algebra/task-c/sessions/d8b.wav`
- Play: `ffplay -autoexit -nodisp -loglevel error "/home/erick/workspace/scratch-governed-loop-run/mvp8_4_cadence_algebra/task-c/sessions/d8b.wav"` or `paplay "/home/erick/workspace/scratch-governed-loop-run/mvp8_4_cadence_algebra/task-c/sessions/d8b.wav"`
- Duration: 14400 ms / rotation path `[0, 0, 0, 0]`

| Bar | Node | Degree | Chaldean | Stride | Depth | Rotation | Shape | Bass pc |
|---|---|---|---|---|---|---|---|---|
| 1 | 2677@0 | 1 | 1 | 2 | 4 | 0 | [0, 4, 6, 11] | 0 |
| 2 | 2677@0 | 5 | 5 | 2 | 4 | 0 | [0, 5, 8, 11] | 6 |
| 3 | 2677@0 | 6 | 6 | 2 | 4 | 0 | [0, 3, 7, 9] | 9 |
| 4 | 2677@0 | 4 | 4 | 2 | 4 | 0 | [0, 4, 7, 11] | 5 |


## Ear gate and landing posture

The ear gate is **SIGNED_HUMAN** (Erick, 2026-11-14); the
verdict is `ADOPT_CADENCE_ALGEBRA`. The signed verdict is recorded verbatim in
both the ear manifest and the ear scorecard; the agent authored no listener
field. Outcome: `ADOPT_CADENCE_ALGEBRA`. The guarded lander `task-d/mvp8_4_land.py` requires
`--authorize-l32` plus the signed manifest and scorecard.

### Signed ear verdict (human-authored, verbatim)

> After auditioning, I'm listening to D9 and I like the way it sounds a lot. The melody lines sound like they belong with the chord progressions and it catches the ear. It leaves you wanting to hear more. For D8b, the last chord sounds like it belongs the most. And the melody line sounds like it belongs, but it's pretty repetitive and there's a lot of ambiguity. I'm unsure if this is because of the node types that the progression in melody lines are using or if it's for another reason. The chord progressions for D8 sound better. Even though the melody line sounds like it's the same from D8b, the melody line and the chord progressions go together better. It still wouldn't surprise me if there was something odd about the notes that are used for this because the progressions themselves don't sound too harmonious, but they sound like they belong at least. The seventh's chord progression and melody line sound okay. The last progression sounds like maybe there's something off about it. The six sounds strong. The chord progressions and the melody cohesion sounds great, and there's a bit of variation in the melody that makes it stand out. For D5, the melody sounds like it almost matches, but the progressions themselves sound like they work. Maybe it's just not a very melodic or harmonic set of notes that are being used for this progression, but overall they sound like they work, just maybe an off note on the melody. D4 sounds great all around. The chord progressions sound like they belong with the melody line. There's variation in the melody that works, and it sounds like a very nice melody and chord progression. D3 also sounds very good. The chord progressions and melody line sound great together. D2 also sounds very good. The melody line and the chord progressions sound like they get along well. The wind sounds great as well. The chord progressions and the melody work well together, and the melody line has a variation and change to sound interesting. [STT note: 'The seventh's' = D7; 'The six' = D6; 'The wind' = D1.] Verdict: I adopt the cadence stride algebra, voice-led stack rotations (D8 [0,2,1,2] displacement 9 over D8b m=0 displacement 47, D9 r1->r0->r0), and the six-sibling family (ADOPT_CADENCE_ALGEBRA).

## Fences

- Repository read-only; `git status --porcelain` empty at closing.
- Zero LLM calls; deterministic two-pass renders.
- Degrees indexed 1..7; shapes are integer interval vectors; no Roman-numeral
  or tonal-quality primitives in machine records.
- No pinned byte changed; `harmonic.C_H` null; `causationClaim: false`.
