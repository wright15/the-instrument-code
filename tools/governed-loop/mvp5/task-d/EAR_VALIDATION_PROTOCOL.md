# MVP-5 Ear Validation Protocol & Scorecard

Directive `MVP5-DIR-1` rev 1 · execution realm `/home/erick/workspace/scratch-governed-loop-run/mvp5/` · scratch-only.

Layer: `SPEC-001 §1.3 overlay dynamics` · `gov517_correspondence_claimed: false` · `still_set_label: still_set` · `still_set = (12, 13, 14, 15)`.

No canonical or physical causation claim is made. Session prose is context, not evidence.

## 1. Fixed point

- Repository `HEAD`: `ba6ae1fe2c8b31ab739c91593701177678bff18b`
- Working tree: clean (`e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`)
- `provenance/DECISION_LEDGER.md`: `8d0a04732370167e84b439a1a019ff6475c951ab86c258b84c79304534f2102d` (340531 B / 4112 lines)
- `MANIFEST.json`: `933ae6027145e8f636857b169bd3dac323f90fe8c707d045fdac5237db5ce355` (1516 files / 96848773 B)
- Release closure: `seven-governors-integrated-1.9.0` / 418 PASS / 0 FAIL

## 2. Listening sources

| Track | Duration | Bars | Micro notes | WAV | MIDI |
|---|---:|---:|---:|---|---|
| `track1_arm1_unranked_2cycle` | 30000 ms | 20 | 100 | `task-b/renders/track1_arm1_unranked_2cycle.wav` | `task-b/renders/track1_arm1_unranked_2cycle.mid` |
| `track2_arm2_static_4state` | 30000 ms | 20 | 100 | `task-b/renders/track2_arm2_static_4state.wav` | `task-b/renders/track2_arm2_static_4state.mid` |
| `track3_arm3a_dynamic_q_reset` | 30300 ms | 20 | 100 | `task-b/renders/track3_arm3a_dynamic_q_reset.wav` | `task-b/renders/track3_arm3a_dynamic_q_reset.mid` |
| `track4_arm3b_dynamic_q_carried` | 30300 ms | 20 | 100 | `task-b/renders/track4_arm3b_dynamic_q_carried.wav` | `task-b/renders/track4_arm3b_dynamic_q_carried.mid` |
| `track5_equiv_base_p0` | 4500 ms | 3 | 15 | `task-b/renders/track5_equiv_base_p0.wav` | `task-b/renders/track5_equiv_base_p0.mid` |
| `track6_equiv_lifted_p7` | 4500 ms | 3 | 15 | `task-b/renders/track6_equiv_lifted_p7.wav` | `task-b/renders/track6_equiv_lifted_p7.mid` |

All timings are deterministic: `MICRO_STEP_MS = 300`, `MACRO_DWELL_MS = 1500`, `K = 5`, boundary transit rest `300` ms, veto rest `1500` ms.

## 3. Playback commands

Offline WAV (available here with `ffplay`):

```bash
cd /home/erick/workspace/scratch-governed-loop-run/mvp5/task-b/renders
ffplay -nodisp -autoexit -loglevel error track1_arm1_unranked_2cycle.wav
ffplay -nodisp -autoexit -loglevel error track2_arm2_static_4state.wav
ffplay -nodisp -autoexit -loglevel error track3_arm3a_dynamic_q_reset.wav
ffplay -nodisp -autoexit -loglevel error track4_arm3b_dynamic_q_carried.wav
ffplay -nodisp -autoexit -loglevel error track5_equiv_base_p0.wav
ffplay -nodisp -autoexit -loglevel error track6_equiv_lifted_p7.wav
```

Standard MIDI (use `timidity` or `fluidsynth` if installed; otherwise open in a DAW):

```bash
cd /home/erick/workspace/scratch-governed-loop-run/mvp5/task-b/renders
timidity track1_arm1_unranked_2cycle.mid
fluidsynth -ni /usr/share/sounds/sf2/TimGM6mb.sf2 track4_arm3b_dynamic_q_carried.mid
```

Headed live two-tier bridge (real WebAudio scheduling; requires an audio device):

```bash
cd /home/erick/projects/integrated-release
ORRERY_BRIDGE_MODE=live python3 /home/erick/workspace/scratch-governed-loop-run/mvp5/task-d/mvp5_live_listen.py
```

Headless certification replay (frequency capture, no listening):

```bash
python3 /home/erick/workspace/scratch-governed-loop-run/mvp5/task-c/mvp5_task_c.py
```

## 4. Quantitative contrast matrix

| Arm | Macro states | Offices | Phases | Seams | Q states | Pitch classes | 5-gram repeats | Direct:degree |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Arm 1 | 2 | 1 | 1 | 0 | 12 | 8 | 8/20 | 57:43 |
| Arm 2 | 4 | 1 | 1 | 0 | 12 | 10 | 4/20 | 52:48 |
| Arm 3a | 21 | 3 | 3 | 5 | 5 | 11 | 4/20 | 70:30 |
| Arm 3b | 21 | 3 | 3 | 5 | 12 | 12 | 0/20 | 54:46 |

Equivariant pair (`track5` vs `track6`): 15/15 pitch classes shifted by `+7 mod 12`; 14/14 melodic intervals identical.

## 5. Pre-registered questions and timestamped markers

### Q1 — Confinement vs. modulation

Listen to `track1`, `track2`, and `track4`. `track1` is a 2-state Saturn confinement loop; `track2` is a 4-state static Chaldean loop; `track4` breaks out of Saturn into Sun and Mercury across phases 0, 11, and 0.

| Marker | Time | Track 4 event |
|---|---:|---|
| Bar 1 | 0 ms | Saturn · phase 0 |
| Bar 5 | 6000 ms | Sun · phase 11 |
| Bar 9 | 12000 ms | Mercury · phase 11 |
| Bar 17 | 24300 ms | Mercury · phase 0 |

**Adjudication:** rate the audible contrast `1` (none) to `5` (unmistakable). A pass requires `>= 3` and a positive answer to: does `track4` audibly leave the single-office orbit heard in `track1` and `track2`?

### Q2 — Still-life reset vs. continuous Q melody

Compare the downbeats of `track3` (reset Q) and `track4` (carried Q). `track3` restarts every bar on `q_state = 0`; `track4` carries the Q1 fifths-cycle across chord changes.

| Bar | Time | Node | Reset Q | Carried Q |
|---|---:|---|---:|---:|
| 1 | 0 ms | 1387@0 | 0 | 0 |
| 2 | 1500 ms | 1383@0 | 0 | 11 |
| 3 | 3000 ms | 875@0 | 0 | 10 |
| 4 | 4500 ms | 1259@0 | 0 | 9 |
| 5 | 6000 ms | 2517@11 | 0 | 8 |
| 6 | 7500 ms | 2765@11 | 0 | 7 |
| 7 | 9000 ms | 2771@11 | 0 | 6 |
| 8 | 10500 ms | 2773@11 | 0 | 5 |
| 9 | 12000 ms | 1741@11 | 0 | 4 |
| 10 | 13500 ms | 855@11 | 0 | 3 |
| 11 | 15000 ms | 1645@11 | 0 | 2 |
| 12 | 16500 ms | 1693@11 | 0 | 1 |
| 13 | 18300 ms | 1693@11 | 0 | 0 |
| 14 | 19800 ms | 1709@11 | 0 | 11 |
| 15 | 21300 ms | 1837@11 | 0 | 10 |
| 16 | 22800 ms | 3417@11 | 0 | 9 |
| 17 | 24300 ms | 1709@0 | 0 | 8 |
| 18 | 25800 ms | 855@0 | 0 | 7 |
| 19 | 27300 ms | 1645@0 | 0 | 6 |
| 20 | 28800 ms | 1693@0 | 0 | 5 |

**Adjudication:** a pass requires hearing the repeated downbeat figure in `track3` (5-gram repeats `4/20`) against the through-composed line in `track4` (`0/20` repeats).

### Q3 — Seam and boundary cadence

| Time | Transition | License |
|---|---|---|
| 6000 ms | `1259@0 -> 2517@11` | `FamilyA:L1` |
| 12000 ms | `2773@11 -> 1741@11` | `FamilyB:bridge` |
| 18000 ms | `1693@11 -> 847@0` | `FamilyA:R1` |
| 18000 ms | `847@0 -> 1693@11` | `FamilyA:L1` |
| 24300 ms | `3417@11 -> 1709@0` | `FamilyA:R1` |
| 30300 ms | `1693@0 -> 847@1` | `FamilyA:R1` |

The boundary entry `1693@11 -> 847@0` is followed by the auto-transit `847@0 -> 1693@11` as a `300` ms unweighted rest (`0` oscillators) beginning at `18000` ms. The destination Mercury container re-attacks at `18300` ms. No micro melody is emitted inside the boundary.

**Adjudication:** a pass requires the five seam transitions to be perceptibly articulated (`FamilyA:L1`, `FamilyB:bridge`, `FamilyA:R1`) and the `18.0–18.3 s` rest to read as a cadence rather than a dropout.

### Q4 — Transpositional equivariance

Listen to `track5` and `track6` back to back. `track5` is `1387@0 -> 2773@11 -> 2905@11`; `track6` is the exact `+7 mod 12` lift `1387@7 -> 2773@6 -> 2905@6`.

| Marker | Time | Base node | Lifted node |
|---|---:|---|---|
| Bar 1 | 0 ms | `1387@0` | `1387@7` |
| Bar 2 | 1500 ms | `2773@11` | `2773@6` |
| Bar 3 | 3000 ms | `2905@11` | `2905@6` |

**Adjudication:** a pass requires the same melodic contour and a uniform fifth-up shift; the measured interval sequence is `14/14` identical and the pitch-class shift is `15/15` exact.

## 6. Scorecard

Adjudication follows the MVP-2c `mac1..mac3` discipline: pre-register the question, listen once without pausing, record the verdict, and do not re-describe the result after the fact.

| Question | Expected contrast | Heard (Y/N) | Rating 1–5 | Notes |
|---|---|---|---:|---|
| Q1 | Confinement vs. modulation |  |  |  |
| Q2 | Reset still-life vs. carried melody |  |  |  |
| Q3 | Seam articulation and boundary cadence |  |  |  |
| Q4 | Fifth-transposition identity |  |  |  |

Adjudicator: ____________________  Date: ____________  Session: ____________

Overall verdict (circle one): `PASS` / `PASS WITH NOTES` / `FAIL`

## 7. Non-claims and fences

- Overlay dynamics only (`SPEC-001 §1.3`); no GOV-517 correspondence is claimed.
- `still_set` is preserved as `(12, 13, 14, 15)`; still-set entries are `0` in every rendered melody.
- No canonical or physical causation claim; no GSL assignment; no `C_H` value.
- Boundary states are transit-only: `K_boundary = 0`, `cannot-be-camped-on`, `can-never-govern`.

