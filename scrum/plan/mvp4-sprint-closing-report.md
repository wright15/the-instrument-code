# MVP4-DIR-1 — CLOSING REPORT

**Directive:** `MVP4-DIR-1` rev 1
**Sprint:** MVP-4 dynamic domain cards, tool-using symbolic proposer, intra-node Q overlay, B1 calibration diagnostic
**Execution posture:** scratch-first subrealm `/home/erick/workspace/scratch-governed-loop-run/mvp4/`; zero repository writes.

## Fixed point

| Surface | Value |
|---|---|
| Repository HEAD | `148a96f8c5ce5bcd83fad832170bc76c7075a943` |
| Working tree | clean (`e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`) |
| `provenance/DECISION_LEDGER.md` | `037424774910287b29a9101569127d4a7850d4f86376540e350bbe14f0c6663b` / `330,954` B / `4,073` lines |
| `MANIFEST.json` | `93fb9c836f1fa108a607b74d50d3bc3adcc3dcd9311e0edb994685241f4b8a05` / `1,488` files / `95,403,413` B |
| `CHECKSUMS.sha256` | `fd918c280c9f0789102bc09b0fd041c5875a73cb9ae7f1754d5740b2ecd0daeb` |
| `qa/integrated-release-validation.json` | `seven-governors-integrated-1.9.0` / `418` PASS / `0` FAIL |
| Task 0 boundary census | `38c271898ecfcbb8731239dbde38d58bf8e686aa1d31b648f22418c78eb40faf` |
| Staging manifest | `32c2c468265c4bbd124152565e734412b7471b00e040832d47893746aee20a35` / `23/23` hash-verified |

## Task 0 — L19 harness re-pin, boundary census, L20 staging

- Synced the three stale harness files to pinned L19 bytes: `mvp2.py 79c0cf70…`, `orrery_nav_bridge.py 9f2b3da6…`, `mvp2_orrery_nav_smoke.py 851c9bf2…`. Pre-sync copies preserved under `task-0/pre_sync_harness/`.
- Bridge positive check exit `0`; bogus ledger prefix check exit `1` with `FAIL-CLOSED: ledger prefix 03742477 != 00000000`.
- Boundary partition confirmed: `154` boundary masks (`1,848` lifted states) = `104` escapable (`1,248` lifted; `80` single-exit + `24` dual-exit) + `50` isolated (`600` lifted); `256` side-rows (`128` entry + `128` exit); `288` dual-exit tie-break rows.
- MVP-3 runners staged with physical copies in `mvp4/l20-staged/`; Task 0 staging `12/12`.
- Receipt: `906ba0b196755eafe41ee8abf2d70a03040a0bc995502856984cec1d798e079e`.

## Task A — Dynamic context-aware domain cards

- Dynamic integer card `MVP4_DYNAMIC_CHALDEAN_CONTEXT_CARD_v1`: static Chaldean numerators plus `W=8`, `alpha=40`, `N_threshold=3`, `beta=70`, `W_seam_base=50`; tie-break `(-score, category_rank, target_mask, target_phase, operator)`; zero floats.
- Parameter note: `beta` was raised from the initially planned `50` to `70` because `50+50=100` is below the maximum Tier-1 weight `116`; at `70` the seam score at threshold is `120`, guaranteeing seam promotion to `presented_index 0`. This is recorded in the card's `parameter_justification`.
- Formal run: 3 arms × 20 steps from `1387@0`, model `opencode-go/claude-haiku-5-5`, 60 LLM calls, 0 repairs.
  - Arm 1 unranked: `2` distinct states / `1` family, 2-state cycle.
  - Arm 2 static: `4` distinct states / `1` family, 0 seams; reproduced the 4-state state set but the model chose a different visitation order than the MVP-3 exact cycle. Recorded as measured, not retuned.
  - Arm 3 dynamic: `21` distinct states / `3` families / `5` seams; `20/20` LLM gate ACCEPT; `19/20` index-0; `21` total states including 1 auto-transit.
- Pre-registered success criterion met. Boundary probes: `1001@0→501@1→251@2` dual tie-break verified; `1087@0→2173@11` single-exit verified; `2017@0→1009@1→505@2` dual tie-break verified; boundary LLM calls `0`.
- An earlier prompt-development run is archived as `transcripts_run1_promptdev/`; the formal run corrected the static prompt to include `chaldean_m5` and `target_degree`, matching MVP-3 Task A.
- Receipt: `d4e63cb51f6339edf7dcdb721d9753ea6c6cac580f35cf9397201803cd8fdbc1`; card `6486599187687edb1e28481b2bbc79d9a11a06001e4a237505c5e44c1c1a1469`.

## Task B — Tool-using symbolic proposer and native BFS planner

- Planner: `5,544` nodes, `20,760` deduped edges, `21,048` gate-verified edge attempts, `0` failures. Raw construction: Tier-1 `15,288`, Family A active `3,504`, Family B `1,008`, boundary auto-transit `1,248`.
- Component census: `943` weak components, `1,102` strong components; `600` isolated boundary lifted nodes; governed phase reachability `266` masks at 12 phases and `42` at 1 phase; seed `1387@0` reaches `3,204` nodes.
- Four read-only tools implemented: `get_neighborhood`, `explain_veto`, `query_path`, `step_intra_node_q`.
- B.1: `1387@0 → 2773@11 → 2905@11` (Saturn→Sun→Jupiter), `2/2` gate ACCEPT; LLM used `query_path` and `get_neighborhood` correctly.
- B.2: `5/5` exact symbolic field matches (`reason`, `governingRoot`, `candidateGoverningRoot`, `phaseDelta`, `candidateMembership`).
- B.3: `EQUIVARIANT`; planner and executed paths are exact `+7 mod 12` lifts (`1387@7 → 2773@6 → 2905@6`).
- Receipt: `ffab52b696aeda84204c463abd700e7be86d2e430d6dc8d43d72587381aa7d12`; planner `9ff511f14282cbe6ee48010d67092c70c25da0bf5fa6dbd1e50382afeb85f5c0`; tools `1d74b401cea788edf237458e8c8844c987c77c94814f8b533c766aaa147701ab`; census `165fb6b33a1ced983b45189738541bba3e206d5655a729c8deeff5cd72627d12`.

## Task C — Intra-node Q-engine melodic overlay

- Read-only `src/fivefold/quintessence.py` (`eefd7e1e…`) imported under `SPEC-001 §1.3 overlay dynamics`; `gov517_correspondence_claimed: false`; label `still_set`; no `kernel` string; gate bytes untouched.
- Q table regenerated and matched the fixture: `192/192` rows; `Q1^4 != id` (`4`); `Q1^12 == id` on all 16 states.
- Deterministic 8-hop macro walk (`1387@0 → 859@0 → 1717@11 → 3433@10 → 1721@10 → 861@11 → 1245@11 → 623@0 → 1143@0`): `8/8` gate ACCEPT; 5 seam hops; dynamic-card audit recorded (`3/8` presented index 0).
- Micro walk: fresh `q_state=0` per macro node, `z=0..4`, `40/40` steps; `out_of_mask_pitches: 0`; modes `direct_orbit_pc 25`, `degree_modulo_7 15`.
- Exhaustive still-set check: `243,936` evaluations, `0` leaks, `PASS`.
- Task B integration: `step_intra_node_q` now returns `next_q=7`, no longer `OVERLAY_NOT_STAGED`.
- Receipt: `834e3a64c22fba07fa0179b95d8ee26d152c038f67a0a387ae3a2b1796cf4295`; module `8b39ffe4be4d1f801cf1065cd8928c681002249de8ebad1d5246f277e94f815f`; trace `75d52c0ced56af403b4e4e6379474bf3add7138716d192fb7401a3b90c86bc9d`.

## Task D — B1 calibration diagnostic

- Frozen inputs verified byte-for-byte: `mvp3_encoder.py dc237927…`, `mvp3_encoder_spec.json 918228d4…`, `qa/mvp3_task_b1_receipt.json c658a588…`; no bytes modified.
- Full five-corpus re-derivation reproduced the B1 receipt exactly: `146,712` transitions; per-corpus transitions `13,132 / 9,429 / 83,981 / 12,388 / 27,782`; both-key-used populations `231 / 0 / 37,184 / 6,662 / 5,022 = 49,099`; accepted overrides `2,998 / 4,285 / 546 / 127 / 216 = 8,172`.
- D1: both-key-used accepted `0/49,099`; surviving both-key-used transitions are phase/key changes, all rejected. `2741` and `1453` are anchors of their own families (`2741: R1→1371`; `1453: L1→2905`, `R1→727`) with `0/132` accepted phase-change pairs each.
- D2: `8,172/8,172` accepted overrides = `8,000` Tier-1, `93` FamilyA:R1, `37` FamilyA:L1, `24` FamilyB:bridge, `18` boundary_entry. Role endpoints: anchor→satellite `3,822`, satellite→anchor `3,740`, satellite→satellite `532`, anchor→anchor `60`, satellite→boundary `18`.
- D3: DCMLab P1 `2,998/13,132` vs P2 `182/22,461` (`-2,201 bp`); Bach P1 `4,285/9,429` vs P2 `75/24,142` (`-4,513 bp`). P2 ungoverned/unlicensed splits: DCMLab `7,453/14,800`; Bach `5,543/18,524`.
- Receipt: `8b15f274538cc093e358c306a276a72cc0ca9e04ad8bbec35074ab57289dfc02`.

## Receipts

| Task | Status | Stop rules | Receipt SHA-256 |
|---|---|---|---|
| T0 | COMPLETE | none | `906ba0b196755eafe41ee8abf2d70a03040a0bc995502856984cec1d798e079e` |
| TA | COMPLETE | none | `d4e63cb51f6339edf7dcdb721d9753ea6c6cac580f35cf9397201803cd8fdbc1` |
| TB | COMPLETE | none | `ffab52b696aeda84204c463abd700e7be86d2e430d6dc8d43d72587381aa7d12` |
| TC | COMPLETE | none | `834e3a64c22fba07fa0179b95d8ee26d152c038f67a0a387ae3a2b1796cf4295` |
| TD | COMPLETE | none | `8b15f274538cc093e358c306a276a72cc0ca9e04ad8bbec35074ab57289dfc02` |

## L20 runner staging manifest

Source fixed point: `148a96f8c5ce5bcd83fad832170bc76c7075a943`. Manifest: `mvp4/l20_runner_staging_manifest.json` (`32c2c468265c4bbd124152565e734412b7471b00e040832d47893746aee20a35`). Verified `23/23`.

| Role | Path | SHA-256 prefix | Verified |
|---|---|---|---|
| `mvp3_static_card` | `task-a/mvp3_chaldean_card.json` | `bff1cc4cb270e488…` | true |
| `mvp3_llm_proposer` | `task-a/mvp3_llm_proposer.py` | `69deb1e6d55ea37e…` | true |
| `mvp3_task_a_postprocess` | `task-a/mvp3_task_a_postprocess.py` | `adb884b0c6190efe…` | true |
| `mvp3_task_b0_runner` | `task-b0/mvp3_b0_run.py` | `eea1e4a8e877cc60…` | true |
| `mvp3_task_b1_runner` | `task-b1/mvp3_b1_run.py` | `796bac0a1be2d29f…` | true |
| `mvp3_task_c_probe` | `task-c/mvp3_task_c.py` | `aff45d9199aeb4c3…` | true |
| `mvp3_task_c_postprocess` | `task-c/mvp3_task_c_postprocess.py` | `5a769d9d0ac3f4dd…` | true |
| `mvp3_task0_census` | `mvp3_task0_census.py` | `b7c265ffb20ac5d9…` | true |
| `l19_harness_mvp2.py` | `mvp4/mvp2.py` | `79c0cf706fffc237…` | true |
| `l19_harness_orrery_nav_bridge.py` | `mvp4/orrery_nav_bridge.py` | `9f2b3da60f0aa369…` | true |
| `l19_harness_mvp2_orrery_nav_smoke.py` | `mvp4/mvp2_orrery_nav_smoke.py` | `851c9bf2a29c2c5a…` | true |
| `mvp4_task0_census_and_staging` | `mvp4/task-0/mvp4_task_0.py` | `5db1c5fe000822f2…` | true |
| `mvp4_dynamic_chaldean_card` | `mvp4/task-a/mvp4_dynamic_chaldean_card.json` | `6486599187687edb…` | true |
| `mvp4_task_a_runner` | `mvp4/task-a/mvp4_task_a.py` | `54210af9e303554b…` | true |
| `mvp4_task_a_postprocess` | `mvp4/task-a/mvp4_task_a_postprocess.py` | `702e992da0a5267c…` | true |
| `mvp4_symbolic_planner` | `mvp4/task-b/mvp4_symbolic_planner.py` | `9ff511f14282cbe6…` | true |
| `mvp4_symbolic_tools` | `mvp4/task-b/mvp4_symbolic_tools.py` | `1d74b401cea788ed…` | true |
| `mvp4_task_b_runner` | `mvp4/task-b/mvp4_task_b.py` | `7545139e8510ef42…` | true |
| `mvp4_task_b_census` | `mvp4/task-b/mvp4_graph_census.json` | `165fb6b33a1ced98…` | true |
| `mvp4_q_intra_node` | `mvp4/task-c/mvp4_q_intra_node.py` | `8b39ffe4be4d1f80…` | true |
| `mvp4_task_c_runner` | `mvp4/task-c/mvp4_task_c.py` | `e4499d5252fca508…` | true |
| `mvp4_task_c_trace` | `mvp4/task-c/coupled_trace.jsonl` | `75d52c0ced56af40…` | true |
| `mvp4_b1_diagnostic` | `mvp4/task-d/mvp4_b1_diagnostic.py` | `bfb310ac2b401fd9…` | true |

```text
MVP4-SPRINT-CLOSING
FIXED-POINT: 148a96f8c5ce5bcd83fad832170bc76c7075a943 / TREE CLEAN / L19 03742477...50bbe14f0c6663b / 330954 B / 4073 lines
MANIFEST-PIN: 1488 FILES / 95403413 B / RELEASE-CLOSURE 418/0 PASS
BOUNDARY-PARTITION: 154 TOTAL = 104 ESCAPABLE (80 SINGLE-EXIT + 24 DUAL-EXIT) + 50 ISOLATED / 256 SIDE-ROWS
TASKS: T0 COMPLETE | TA COMPLETE | TB COMPLETE | TC COMPLETE | TD COMPLETE
RECEIPTS: T0 906ba0b1 | TA d4e63cb5 | TB ffab52b6 | TC 834e3a64 | TD 8b15f274
DYNAMIC-CARD: INTEGER-EXACT TRUE / CARD-GATE-INPUTS 0 / ARMS-3-STATES 2/4/21 / SEAMS-TAKEN 5 / DUAL-EXIT-EXERCISED TRUE
TOOL-PROPOSER: PLANNER-BFS-VERIFIED TRUE / VETO-EXPLANATION 5/5 EXACT / PHASE-EQUIVARIANCE EQUIVARIANT
Q-OVERLAY: SPEC-001-1.3 TRUE / STILL-SET-GUARD TRUE / OUT-OF-MASK-PITCHES 0 / MACRO-ACCEPTS 8/8 / MICRO-STEPS 40/40
B1-DIAGNOSTIC: BOTH-KEY-USED-PROOF VERIFIED / OVERRIDE-ANATOMY 8172/8172 / PHASE-RULE-MATRIX COMPLETE
L20-RUNNERS-STAGED: 23/23 HASH-VERIFIED
REPO-WRITES: 0
STOP-RULES: 0
STATUS: COMPLETE
```
