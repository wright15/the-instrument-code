# MVP-5 Closing Report — Acoustic & Ear Validation of the Coupled Two-Tier Engine

Directive `MVP5-DIR-1` rev 1 · execution realm `/home/erick/workspace/scratch-governed-loop-run/mvp5/` · scratch-only (`REPO_WRITES: 0`, `ORRERY_CHANGES: 0`).

## 1. Verified L20 fixed point

| Surface | Verified value |
|---|---|
| Repository HEAD | `ba6ae1fe2c8b31ab739c91593701177678bff18b` |
| Working tree | clean (`e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`) |
| Decision ledger | `8d0a04732370167e84b439a1a019ff6475c951ab86c258b84c79304534f2102d` / 340531 B / 4112 lines |
| Manifest | `933ae6027145e8f636857b169bd3dac323f90fe8c707d045fdac5237db5ce355` / 1516 files / 96848773 B |
| Release closure | `seven-governors-integrated-1.9.0` / 418 PASS / 0 FAIL |
| MVP-4 landing receipt | `311e10ad155d1046f6c2b0800759552f2b8de5fe84cf3a1bab60a1a7268572db` |

## 2. Task summaries

### Task 0 — fixed point and Policy-v3 sweep staging

- In-tree pins verified: `25/25`; Policy-v3 source pins: `3/3`.
- Locked bridge `--check`: positive exit `0`; negative `00000000` rejected with `FAIL-CLOSED: ledger prefix 8d0a0473 != 00000000`.
- Sweep artifacts staged byte-for-byte: `3/3`.
- Independent recompute: `462/462` anchored masks carry exactly one `pc0`; wrap-count identity `5544` checks / `0` failures; T11 orbits exact `41` `10/10`; total `12628` = `41 × 308`; edge-set digest `7c428a86e6fa60b632eab448a4946c42d79949c4010981dad81e455b081d6b39`.

### Task A — coupled macro × micro engine and archipelago audit

- `arm1_unranked_q_carried`: states `2`, micro steps `100`, Q states `12`, seams `0`, 5-gram repeats `8/20`.
- `arm2_static_q_carried`: states `4`, micro steps `100`, Q states `12`, seams `0`, 5-gram repeats `4/20`.
- `arm3a_dynamic_q_reset`: states `21`, micro steps `100`, Q states `5`, seams `5`, 5-gram repeats `4/20`.
- `arm3b_dynamic_q_carried`: states `21`, micro steps `100`, Q states `12`, seams `5`, 5-gram repeats `0/20`.
- Steering audit: LLM Arm 3 index-0 `19/20`; deterministic greedy U/D `21` / `21` distinct states with `0` LLM calls; both variants disclosed.
- Nine-seed archipelago: `9/9` seeds accept; gate `377/377`; out-of-mask pitches `0`; W007 `7` states / `0` seams.
- Equivariant +7 lift: `15/15` exact pitch-class transpositions.

### Task B — deterministic WAV/MIDI synthesis

- Six tracks, twelve files: `12/12` checks pass.
- Re-render determinism `12/12`; MIDI container leaks `0`; clipped samples `0`; non-finite samples `0`.

### Task C — two-tier Orrery bridge replay

- Overlay inspect: `84` cells / `12` boundary chips / `5544` nodes / `5130` seam moves / `256` boundary rows.
- `track4_arm3b_dynamic_q_carried`: bars `20`, hops `21`, micro `100`, frequency matches `100/100`, out-of-mask `0`.
- `track5_equiv_base_p0`: bars `3`, hops `2`, micro `15`, frequency matches `15/15`, out-of-mask `0`.
- `track6_equiv_lifted_p7`: bars `3`, hops `2`, micro `15`, frequency matches `15/15`, out-of-mask `0`.
- Boundary auto-transit `847@0 -> 1693@11`: micro scheduled `0`, boundary chip active `True`; console errors `0`, page errors `0`.

### Task D — acoustic diagnostics and ear protocol

- Pitch-class cardinality across the four arms: `8/10/11/12`.
- 5-gram repeats: `8/4/4/0` (reset still-life vs. through-composed carried line).
- Equivariance: `15/15` pitch classes and `14/14` intervals.
- Ear-validation protocol: `task-d/EAR_VALIDATION_PROTOCOL.md` (Q1–Q4, timestamped markers, scorecard).

## 3. L21 staging manifest

| Path | SHA-256 (8) | Bytes | Origin | Role |
|---|---|---:|---|---|
| `l21-staged/policy-v3-sweep/plv3_sweep.json` | `6a943e44` | 10181 | task-0 | policy-v3-sweep |
| `l21-staged/policy-v3-sweep/plv3_sweep.py` | `22e6b1e5` | 9318 | task-0 | policy-v3-sweep |
| `l21-staged/policy-v3-sweep/plv3_sweep_predeclared.json` | `14117c94` | 1712 | task-0 | policy-v3-sweep |
| `task-0/mvp5_task_0.py` | `56191ead` | 24300 | task-0 | runner |
| `task-0/mvp5_task_0_receipt.json` | `7c139a30` | 18059 | task-0 | receipt |
| `task-a/mvp5_coupled_engine.py` | `c07940cc` | 20663 | task-a | module |
| `task-a/mvp5_task_a.py` | `470397b9` | 25320 | task-a | runner |
| `task-a/mvp5_task_a_receipt.json` | `74373b3c` | 85478 | task-a | receipt |
| `task-a/traces/arm1_unranked_q_carried.jsonl` | `bf20119c` | 63047 | task-a | trace |
| `task-a/traces/arm2_static_q_carried.jsonl` | `52f3b513` | 62729 | task-a | trace |
| `task-a/traces/arm3a_dynamic_q_reset.jsonl` | `dc941c1c` | 65011 | task-a | trace |
| `task-a/traces/arm3b_dynamic_q_carried.jsonl` | `4ea86bb1` | 65530 | task-a | trace |
| `task-a/traces/arm_tb_equiv_p0.jsonl` | `58c4ad8a` | 9115 | task-a | trace |
| `task-a/traces/arm_tb_equiv_p7.jsonl` | `786f99cc` | 9080 | task-a | trace |
| `task-a/traces/arm_tc_8hop_carried.jsonl` | `9651a98d` | 24767 | task-a | trace |
| `task-a/traces/arm_tc_8hop_reset.jsonl` | `7d5c5029` | 24671 | task-a | trace |
| `task-a/traces/battery/127_0_D.jsonl` | `0a814ed5` | 62013 | task-a | trace |
| `task-a/traces/battery/127_0_U.jsonl` | `6daa2582` | 62013 | task-a | trace |
| `task-a/traces/battery/1387_0_D.jsonl` | `97ff8e43` | 63412 | task-a | trace |
| `task-a/traces/battery/1387_0_U.jsonl` | `d7c96157` | 62945 | task-a | trace |
| `task-a/traces/battery/1451_0_D.jsonl` | `70e334a4` | 62547 | task-a | trace |
| `task-a/traces/battery/1451_0_U.jsonl` | `e7524f0d` | 62522 | task-a | trace |
| `task-a/traces/battery/1453_0_D.jsonl` | `d417d2fb` | 63086 | task-a | trace |
| `task-a/traces/battery/1453_0_U.jsonl` | `4c8950f3` | 63086 | task-a | trace |
| `task-a/traces/battery/1709_0_D.jsonl` | `b2a6942d` | 63225 | task-a | trace |
| `task-a/traces/battery/1709_0_U.jsonl` | `872a34aa` | 63175 | task-a | trace |
| `task-a/traces/battery/1717_0_D.jsonl` | `c593cde5` | 63143 | task-a | trace |
| `task-a/traces/battery/1717_0_U.jsonl` | `e365fc0d` | 62420 | task-a | trace |
| `task-a/traces/battery/2667_0_D.jsonl` | `2f1442bc` | 62333 | task-a | trace |
| `task-a/traces/battery/2667_0_U.jsonl` | `ae5749ef` | 62341 | task-a | trace |
| `task-a/traces/battery/2741_0_D.jsonl` | `43dfe1e2` | 63117 | task-a | trace |
| `task-a/traces/battery/2741_0_U.jsonl` | `55b76796` | 62226 | task-a | trace |
| `task-a/traces/battery/2773_0_D.jsonl` | `7883fc3f` | 63184 | task-a | trace |
| `task-a/traces/battery/2773_0_U.jsonl` | `14e6f157` | 62252 | task-a | trace |
| `task-a/traces/steering/greedy_d_1387.jsonl` | `354431c4` | 64032 | task-a | trace |
| `task-a/traces/steering/greedy_u_1387.jsonl` | `e5462977` | 63555 | task-a | trace |
| `task-b/mvp5_audio_renderer.py` | `0c917aab` | 24696 | task-b | module |
| `task-b/mvp5_task_b.py` | `52f15933` | 12733 | task-b | runner |
| `task-b/mvp5_task_b_receipt.json` | `1d77bd7d` | 15615 | task-b | receipt |
| `task-b/renders/track1_arm1_unranked_2cycle.mid` | `342be2ca` | 3391 | task-b | midi-render |
| `task-b/renders/track1_arm1_unranked_2cycle.wav` | `dcca3792` | 2646044 | task-b | wav-render |
| `task-b/renders/track2_arm2_static_4state.mid` | `f6cc2f4f` | 3381 | task-b | midi-render |
| `task-b/renders/track2_arm2_static_4state.wav` | `04dd46fa` | 2646044 | task-b | wav-render |
| `task-b/renders/track3_arm3a_dynamic_q_reset.mid` | `92a84da7` | 3555 | task-b | midi-render |
| `task-b/renders/track3_arm3a_dynamic_q_reset.wav` | `b4e9b167` | 2672504 | task-b | wav-render |
| `task-b/renders/track4_arm3b_dynamic_q_carried.mid` | `6b5cb199` | 3557 | task-b | midi-render |
| `task-b/renders/track4_arm3b_dynamic_q_carried.wav` | `d0fe3d27` | 2672504 | task-b | wav-render |
| `task-b/renders/track5_equiv_base_p0.mid` | `d5447176` | 599 | task-b | midi-render |
| `task-b/renders/track5_equiv_base_p0.wav` | `82a69919` | 396944 | task-b | wav-render |
| `task-b/renders/track6_equiv_lifted_p7.mid` | `1546c7e4` | 597 | task-b | midi-render |
| `task-b/renders/track6_equiv_lifted_p7.wav` | `2fa02243` | 396944 | task-b | wav-render |
| `task-c/mvp5_task_c.py` | `1df91c53` | 15223 | task-c | runner |
| `task-c/mvp5_task_c_receipt.json` | `4c332547` | 9734 | task-c | receipt |
| `task-c/mvp5_two_tier_bridge.py` | `69670d3e` | 12551 | task-c | module |
| `task-c/mvp5_two_tier_probe.js` | `65d19922` | 50278 | task-c | probe |
| `task-c/mvp5_two_tier_scheduler.js` | `8f3fd154` | 4467 | task-c | scheduler |
| `task-c/two_tier_bridge_log.json` | `ef08e3e3` | 7851 | task-c | log |
| `task-c/two_tier_probe_out.json` | `b3696a0d` | 38279 | task-c | log |
| `task-d/EAR_VALIDATION_PROTOCOL.md` | `f4cd7055` | 8246 | task-d | protocol |
| `task-d/mvp5_ear_validation.py` | `7a3ed133` | 20010 | task-d | module |
| `task-d/mvp5_live_listen.py` | `88d2c942` | 3917 | task-d | module |
| `task-d/mvp5_task_d.py` | `e8114047` | 28345 | task-d | runner |
| `task-d/mvp5_task_d_receipt.json` | `cf26a6a8` | 16819 | task-d | receipt |
| `MVP5-CLOSING-REPORT.md` | self | — | mvp5 | closing-report |

All `64/64` staged entries hash-verified (this report is the final entry).

## 4. Terminal verdict

```text
MVP5-SPRINT-CLOSING
FIXED-POINT: ba6ae1fe2c8b31ab739c91593701177678bff18b / TREE CLEAN / L20 8d0a0473...34f2102d / 340531 B / 4112 lines
MANIFEST-PIN: 1516 FILES / 96848773 B / RELEASE-CLOSURE 418/0 PASS
PLV3-SWEEP-STAGED: 3/3 HASH-VERIFIED / T11-ORBITS-EXACT-41 10/10 / TOTAL-12628 TRUE / WRAP-IDENTITY 5544/5544
TASKS: T0 COMPLETE | TA COMPLETE | TB COMPLETE | TC COMPLETE | TD COMPLETE
RECEIPTS: T0 7c139a30 | TA 74373b3c | TB 1d77bd7d | TC 4c332547 | TD cf26a6a8
COUPLED-ENGINE: ARMS-4-GENERATED TRUE / Q-RESET-STATES 5 / Q-CARRIED-STATES 12/12 / BOUNDARY-DWELL-0 TRUE / OUT-OF-MASK-PITCHES 0
ARCHIPELAGO-AUDIT: GREEDY-INDEX0-VERIFIED TRUE / SEEDS-9-ACCEPT 9/9 / VARIANT-U-D-DISCLOSED TRUE
AUDIO-SYNTH: TRACKS-6-WAV-MID 12/12 DETERMINISTIC / MIDI-CONTAINER-LEAKS 0 / WAV-CLIPPED-SAMPLES 0
TWO-TIER-BRIDGE: OVERLAY-5544-VERIFIED TRUE / WEBAUDIO-FREQ-MATCH 100/100 / EQUIV-P0-P7-MATCH 15/15 / CONSOLE-ERRORS 0
L21-STAGING-MANIFEST: 64/64 HASH-VERIFIED
REPO-WRITES: 0
ORRERY-CHANGES: 0
STOP-RULES: 0
STATUS: COMPLETE
```
