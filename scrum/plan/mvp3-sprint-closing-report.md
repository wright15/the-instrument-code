# MVP-3 SPRINT CLOSING REPORT

**Directive authority:** `MVP3-CLOSE-AUTH-1` (planning seat)
**Generated (UTC):** `2026-10-27T18:22:46.548384+00:00`
**Report window open snapshot:** `2026-10-27T18:21:16.507948+00:00` (measured)
**Scope:** scratch artifact only; zero repository writes; zero gate/encoder byte changes; Task-0 base realm read-only.
**Report path:** `/home/erick/workspace/scratch-governed-loop-run/task-close/MVP3-CLOSING-REPORT.md`

**Source legend (receipt hashes are restated in §2):**

| Tag | Source | SHA-256 |
|---|---|---|
| `[T0]` | `mvp3_harness_repin_report.json` | `db891a446c9ab3bcf49d439db70967ad2677eeb48a64887cebf19ebcc59d4292` |
| `[TA]` | `task-a/task_a_receipt.json` | `cb9083f435a41b17a009d5fb249661c1998d107556bf6a6ee97fa5293f1461a0` |
| `[B0]` | `task-b0/task_b0_receipt.json` | `ae50fd2b9b7c6b68157ae2a745d85be213e2d2afcf1db66d42766c5a61f7801e` |
| `[B1]` | `task-b1/task_b1_receipt.json` | `c658a5885c5fb989eec6eab1a3a3964ae3e2228606cb806f0867c6c1d829e5d4` |
| `[C]` | `task-c/task_c_receipt.json` | `022856bb9a2bb88162f77e04ca4dd60b0b93f68c62d2bb1404f14334d0729bfc` |
| `[L18]` | `scrum/plan/l18-landing-closing-report.md` (repo, read-only) | L18 baseline record |
| `[RPT]` | this report-window measurement | method noted at each use |

---

## 1. FIXED-POINT OPENING

**Repository fixed point.** HEAD `8c66cf16a9a364b3b4096e9aab31e4ba6f24d3c2`; working tree clean. `[T0]` fixed_point / repo_untouched; `[B1]` / `[C]` repo_untouched. The report window re-measured the same values: `[RPT]` `git rev-parse HEAD` and `git status --porcelain` (empty; empty-input digest `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`).

**Ledger / manifest / release.** L18 ledger `6d4ab925748a72865a3e7ee60ac1becb6d39380eb3f5270f6f9dc21b5e944923`; `323,099` bytes / `4,059` lines; MANIFEST `1,480` files / `95,207,429` bytes; release closure `418/0`. `[T0]` fixed_point; `[L18]`.

**Base realm.** Task-0 realm digest `15d521ea5d9fd38394ff0a580819f13970072812c619daf60274fd43d2b140da`, `62` files, before == after for the report window. `[TA]` lineage.base_realm_before/after; `[B1]` / `[C]` base_realm_untouched; `[RPT]` re-measured immediately before the final scratch write.

**Sprint scratch root.** `/home/erick/workspace/scratch-governed-loop-run` (`[RPT]`, report-window inventory).

| Subdir | Role | Top-level files (`[RPT]`, `find -maxdepth 1 -type f`) |
|---|---|---:|
| `task-a/` | Performer proposer, Chaldean card, 20 transcripts, receipt | 5 |
| `task-b0/` | Frozen spec + encoder, DCMLab ABC corpus, smoke, manifest, receipt | 9 |
| `task-b1/` | Five-corpus calibration runner, manifests, corpus results, receipt (plus venv/corpora payloads) | 9 |
| `task-c/` | Probe runner, latency samples, 20 transcripts, postprocess, receipt | 6 |
| `task-close/` | This closing report | 0 before write; 1 after |
| root | Task-0 harness + Task-0 receipt; **59** top-level files | 59 |

**Report-window close snapshot.** `2026-10-27T18:22:46.548384+00:00` — HEAD `8c66cf16a9a364b3b4096e9aab31e4ba6f24d3c2`; tree clean (`porcelain` SHA-256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`); base realm `15d521ea5d9fd38394ff0a580819f13970072812c619daf60274fd43d2b140da` / `62` files; unchanged.

---

## 2. SPRINT ARTIFACT MANIFEST

Every row is a restatement of a pinned value; the source receipt is named. One row per artifact.

| Artifact | SHA-256 | Pinned in |
|---|---|---|
| Task 0 receipt | `db891a446c9ab3bcf49d439db70967ad2677eeb48a64887cebf19ebcc59d4292` | returned Task 0 receipt |
| Task A receipt | `cb9083f435a41b17a009d5fb249661c1998d107556bf6a6ee97fa5293f1461a0` | `[TA]` (file) |
| Task B0 receipt | `ae50fd2b9b7c6b68157ae2a745d85be213e2d2afcf1db66d42766c5a61f7801e` | `[B0]` (file) |
| Task B1 receipt | `c658a5885c5fb989eec6eab1a3a3964ae3e2228606cb806f0867c6c1d829e5d4` | `[B1]` (file) |
| Task C receipt | `022856bb9a2bb88162f77e04ca4dd60b0b93f68c62d2bb1404f14334d0729bfc` | `[C]` (file) |
| Frozen encoder spec | `918228d497fc57e7c63b79ebd33c554ac4e52cb58760a9b68d86c52f6daae17c` | `[B0]` encoder_spec.spec_digest; `[B1]` / `[C]` input pins |
| Frozen encoder | `dc2379277afb1a9bf92a26cd3a83ea3f16a33a12ca331a9742f7d5861422f745` | `[B0]` encoder_spec.encoder_sha256; `[B1]` / `[C]` |
| Gate post-patch `mvp2.py` | `5957a290d3d23e458fb4ddf641868719ac940514eb3aee5aa0df417112ca04e2` | `[T0]` lineage.patched_files; `[B1]` / `[C]` input pins |
| Chaldean card spec | `bff1cc4cb270e4883125c6ca431dd8440d8f73be3e33be51fc54c580ad7dc289` | `[TA]` artifacts.card_spec_sha256; `[C]` input pins |
| Proposer script | `69deb1e6d55ea37eafd97ad2ea868faef3e55e0520bbca05afda9a3a44898936` | `[TA]` artifacts.proposer_script_sha256; `[C]` input pins |
| LLM work config | `9cb555deeef3db0bdbf9f30b1daddd8cc95bdbd029202a0008aa5ee3043c642f` | `[TA]` artifact; `[C]` artifacts.llm_work_config_sha256 |
| Task A postprocess script | `adb884b0c6190efe10f612f190bcd2821b1d724e119540961696c1b1251a0f25` | `[TA]` artifacts.postprocess_script_sha256 |
| Task A transcripts manifest | `0777e737cd7c2f378c03ac3ccf5cca29fdb4b1340beb31bae386a837238ccc47` | `[TA]` artifacts.transcripts_manifest_sha256 |
| Task C probe script | `aff45d9199aeb4c3eeec59d757c4d16c64a6fa3a328fa5bfedfe1bba775398ac` | `[C]` artifacts.probe_script_sha256 |
| Task C postprocess script | `5a769d9d0ac3f4dd600a1e05a1c519512727bc8f627f85d29983482f5d28bd37` | `[C]` artifacts.postprocess_script_sha256 |
| Task C latency samples | `53f0ddc0523935a202507c88d25cdd6e8ac1a007925564c395b961a905ed3088` | `[C]` gate_latency_profile.samples_sha256; artifacts |
| Task C transcripts manifest | `552f0aa82b39767ac451644fc7335b6e670352717ac9da4b7eb396ac3dd7cb42` | `[C]` artifacts.transcripts_manifest_sha256 |
| Bridge post-patch | `77d87207d721af47210d9bfc446089e48e32bad2cca66463307a808e89a0c997` | `[T0]` lineage.patched_files.orrery_nav_bridge.py |
| Smoke post-patch | `7718193bfd793c75c5fc5e871225e73a42c089bce49732050edb615c11ba0398` | `[T0]` lineage.patched_files.mvp2_orrery_nav_smoke.py |
| Bridge `--check` output | `f796cbee2e2af7a028ca911f3d663202fcd5f11a76b3b207f649a88e0bb8c2f4` | `[T0]` bridge_check.output_sha256; artifacts |
| Task 0 census measurements | `576ddbd86581104214df60fa1538d0a60e81a515f3c0bd4839a2549a13ed697c` | `[T0]` artifacts.census_measurements_sha256 |
| Task 0 census script | `b7c265ffb20ac5d914953bf9aed218f07727ddb6cd352c31ccc3bb378ae82fb7` | `[T0]` artifacts.census_script_sha256 |
| Task 0 smoke output | `757108986ee8806982d1d92cadd1c7fd6ece009424a1164acd9fbebca1482a54` | `[T0]` artifacts.smoke_out_sha256 |
| Task 0 smoke report | `951bec1283430422783443c9144ea8cb80f1c63d1251df0449239d55331b8285` | `[T0]` smoke.report_sha256 |
| Task B0 runner | `eea1e4a8e877cc60dc6228fada95560150e8724b659fc5c28b95f3c5fe182c85` | `[B0]` artifacts.runner_sha256 |
| Task B0 smoke | `940d049c5f55b82b1196c797c9f0ed1f7659b964fdde56841f038e095f0bfeb5` | `[B0]` encoder_spec.smoke_sha256 |
| DCMLab manifest | `dcb265cc80727ae3b0e6b070b0e298a996404b5ca846d4c36eca4f3bdf64bcd9` | `[B0]` corpus_provenance; `[B1]` input pins |
| DCMLab LICENSE | `8529d8cd7747e8bf310a7950d189cd2ebfe771d32f8d1e988649b98cde404949` | `[B0]` license_sha256; `[B1]` license note |
| Task B1 runner | `796bac0a1be2d29f5af318577595f1a0925a3ba0006fd4cda13c7bab144ab2d8` | `[B1]` artifacts.runner_sha256 |
| Bach manifest | `cf201f438767477e787482d18be9a02fb1650a9e35382ad787b98297137302f1` | `[B1]` input pins; artifacts |
| Billboard manifest | `aab530a2824cd7937ffd0d0adcc9f489c143f754f477ebce346ef0b92c78a29a` | `[B1]` input pins; artifacts |
| Isophonics manifest | `bb73801088e3a70c020915f37b313d2b0cedba71751cc6c3e3370ffeb14980f7` | `[B1]` input pins; artifacts |
| Weimar DB | `af6a0d9debf042c3581565bd75baad591d32e166cd2ec7298519883de614bf12` | `[B1]` input pins; artifacts |
| DCMLab corpus result | `21c72a8febe02a5847bddfff094b0184e73e9a90520ccec5691977a612034920` | `[B1]` artifacts.corpus_result_sha256 |
| Bach corpus result | `21233e1757d98901a8bc37de21d19be0c96864868e29975a50fa282fc785066d` | `[B1]` artifacts.corpus_result_sha256 |
| Billboard corpus result | `0296c1fce7b964c8472057a11501457ad5ce88db3813a6a7b58dd4a4a4edb58f` | `[B1]` artifacts.corpus_result_sha256 |
| Isophonics corpus result | `c799c3670f14b6c5b74663a8b9382a9297f2f7e2c87a1df1150882c99584e3ff` | `[B1]` artifacts.corpus_result_sha256 |
| Weimar corpus result | `d811a688bcb1a4c114a19f87bb61a621be56fba42f963bfbdac1a7869a8d10d6` | `[B1]` artifacts.corpus_result_sha256 |

---

## 3. CENSUS + VOCABULARY PIN

**Census population.** `3,696` governed lifted states = `308` masks × `12` phases. Source: `[T0]` `census_population` (`governed_masks: 308`, `covered_nodes: 3696`); `[B1]` calibration consumed the same census through the pinned gate/harness. The Task 0 candidate census over that population: min `1`, mean `6.279220779220779`, max `14` (fence `15`), zero census rejects. `[T0]`.

**Gate vocabulary observed (sprint summary).** `{ACCEPT}` and `{REJECT: not-census-state | ungoverned-transition | unlicensed-transition}` only. `observed_subset_of_pinned = true` in `[T0]`, `[TA]`, `[B1]`, and `[C]`. Task B0 is encoder-only and has no gate interaction. `[T0]` gate_vocabulary_observed; `[TA]` gate_interaction; `[B1]` gate_interaction; `[C]` gate_interaction.

**Canonical negative probes (each REJECT reason exercised).**

| Expected reason | Probe | Verdict | Sources |
|---|---|---|---|
| `not-census-state` | `127@0 -> 0@0` | `REJECT` | `[T0]`, `[TA]`, `[B1]`, `[C]` |
| `ungoverned-transition` | `223@0 -> 223@0` | `REJECT` | `[T0]`, `[TA]`, `[B1]`, `[C]` |
| `unlicensed-transition` | `127@0 -> 191@0` | `REJECT` | `[T0]`, `[TA]`, `[B1]`, `[C]` |

**A-10 disposition.** The Task C A-10 carry-forward (census coverage + observed vocabulary) is discharged by the Task 0 census population and the four gate receipts above; the observed pairs are a subset of the pinned vocabulary in every gate task.

---

## 4. SPRINT TALLY

**Corpus side.** `5/5` corpora retrieved, `0` unavailable; `146,712` transitions; `8,172` accepted; `138,540` teleport-labeled rejections = `52,810` ungoverned + `85,730` unlicensed; `accepted_not_adjacent = 0` on all five. `[B1]` calibration.aggregate and per-corpus.

| Corpus | Transitions | Accepted | Raw acceptance | Teleport labels | Boundary transit |
|---|---:|---:|---:|---:|---|
| DCMLab/ABC (beethoven_quartets) | 13,132 | 2,998 | 0.22829728906487967 | 10,134 | 0 |
| Bach chorales | 9,429 | 4,285 | 0.45444904019514265 | 5,144 | 0 |
| Billboard pop | 83,981 | 546 | 0.00650147057072433 | 83,435 | 0 |
| Isophonics | 12,388 | 127 | 0.010251856635453666 | 12,261 | 0 |
| Weimar jazz | 27,782 | 216 | 0.007774818227629401 | 27,566 | 18 entries / 1 app ID |
| **Aggregate** | **146,712** | **8,172** | **0.05570096515622444** | **138,540** | **18 entries / 1 app ID** |

`[B1]` calibration.aggregate and per-corpus. The per-corpus state-transition mapping note is carried in §6. Boundary exits are `0`; boundary entries are `18`, all Weimar, one distinct application ID.

**Gate side.** `20,024` calls cross-footed = `20,000` latency benchmark + `20` probe + `3` negative probes + `1` witness search; verdict decomposition `19 ACCEPT + 21 not-census + 11,032 ungoverned + 8,952 unlicensed = 20,024`. `[C]` gate_interaction. Gate determinism `100%` at both scales: `22`/`22` and `146,712`/`146,712` repeats with `0` mismatches in Task A/B1; Task C `1,000` repeats / `0` mismatches. `[TA]`, `[B1]`, `[C]`. Latency: median `1.838 µs`, p99 `3.665 µs`, mean `1.9329933 µs`, sd `1.0291682667353819 µs`, n=`20,000`; the review-machine baseline (`3.95 / 8.52 / 4.08 µs`) is labeled comparison-only, not a target. `[C]` gate_latency_profile.

**Two mode-scoped ratios (no single CAR).**

| Mode | Counterfactual baseline | Operations saved | Ratio |
|---|---|---|---|
| Performer | B1 corpus veto rate `0.9442990348437755`; Task A 22 accepted transitions | `16.953010279001457` decodes/step; `372.9662261380321` total (corpus-scale projection: `138,540` decodes saved from `146,712` baseline) | `8,770,340.94168948` decodes/s (gate seconds estimated from measured mean) |
| Probe | `k_rollout_tokens = 64`; 20/20 vetoes | `1,280` rollout tokens avoided (corpus-scale projection: `8,866,560` tokens from `138,540` vetoes) | `23,527,249.33370095` tokens/s (measured probe gate seconds) |

`single_compute_avoidance_ratio = null` by design (A-6/R-4). `[C]` performer/probe blocks. Joules are not reported; energy is operations-primary (A-5). `[C]` energy.

---

## 5. LICENSE REGISTER

Restated from `[B1]` `input_pins.corpora_retrieved` (license notes) and `[B0]` provenance.

| Corpus | License | Attribution / citation | Provenance |
|---|---|---|---|
| DCMLab/ABC (beethoven_quartets) | CC BY-NC-SA 4.0 | Neuwirth, Harasim, Moss & Rohrmeier (2018), DOI `10.3389/fdigh.2018.00016` | GitHub `DCMLab/ABC` @ `b6b7d38500bacb30c81db7e09d8790df1a2edd46` (v2.6); 989 tracked files; manifest `dcb265cc...`; LICENSE `8529d8cd...` |
| Bach chorales | music21 BSD-3-Clause; Bach compositions public domain | music21 9.1.0 | music21 corpus, 371 chorales; manifest `cf201f43...` |
| Billboard pop | CC0 | Burgoyne, Wild & Fujinaga (2011) | McGill Billboard 2.0.1 LAB, official DDMAL Dropbox; 890 LAB files; manifest `aab530a2...` |
| Isophonics | Public research annotations | Harte (2010) | The Beatles Annotations v1.2, official tar.gz; 180 TTL files; manifest `bb738010...` |
| Weimar jazz | **ODbL 1.0** | Pfleiderer et al. | WJazzD v2.1, official `wjazzd.db`; DB SHA-256 `af6a0d9d...`; `db_info.license` is ODbL 1.0 |

**WJazzD supersession (binding note for L19).** B0 declared WJazzD cautiously as “research license requiring registration/acceptance; no redistribution.” B1 retrieved the official `wjazzd.db` and read `db_info.license`: **ODbL 1.0**. This register **supersedes** the B0 cautious note; cite the B1 finding (`[B1]` Weimar license note) at L19. The DB is a single-file corpus with no separate manifest; its SHA-256 is the integrity pin.

---

## 6. CARRY-FORWARD REGISTER

| Item | Status | Source / note |
|---|---|---|
| H-CLEAN(i) `STALE_FIELD_DERIVATION_BUNDLE` | OUT of MVP-3; open | `[L18]` expected-reds; post-C path; no MVP-3 fix attempted |
| F1 | Deferred | `[L18]`; post-C path |
| Evidence advisory | Shelved | `[L18]` expected-reds; advisory only |
| Bach phase-1 absence | Recorded; uncorrected | `[B1]` Bach phase_coverage `11/12`; phases `0,2..11` |
| Weimar-only boundary transits | Recorded | `[B1]` aggregate `18` entries / `1` distinct app ID / `0` exits |
| Probe-mode single-reason coverage | Recorded | `[C]` 20/20 probes `not-census-state`; ungoverned/unlicensed exercised by the 20k random-pair benchmark and the three negative probes |
| Review-machine latency baseline | Comparison-only | `[C]` `3.95 / 8.52 / 4.08 µs`; not a target |
| Task A model substitution | Disclosed | `[TA]` `opencode-go/claude-haiku-5-5` selected after timing tests; deepseek-v4.1-flash available but 10–146 s calls; temperature/top_p null with transport note |
| B1 state mapping / key-split | Recorded | `[B1]` `state_mapping_note` and `split_note`: same-key chords collapse to one heptatonic state; `both_key_used` small/zero where measured |
| B1 Weimar rows→events reduction | Recorded | `[B1]` `rows_total 132,329` → `events_encoded 28,505` (beat-grid vs chord-labeled events); all events received mask-key assignment |
| B1 tie_broken vs override deltas | Recorded; no pinned equality | `[B1]` Bach `2`, Billboard `36` |
| Task C probe all-not-census | Recorded | `[C]` `notes.probe_transitions`: 20/20 `not-census-state`; firewall stopped at the census boundary |

---

## 7. TWO-MASTERS RECONCILE PRE-PACKAGE

**The two masters.** (a) The repository archival incubator `tools/governed-loop/` at `8c66cf16...`, pinned by L18; (b) the scratch working realm `/home/erick/workspace/scratch-governed-loop-run/`, re-pinned by Task 0 and extended by Tasks A/B0/B1/C. **No reconcile action is performed in this report.**

| Divergence | Repo master (L18) | Scratch master | Note |
|---|---|---|---|
| `mvp2.py` | `fb9db3cd69234d41417582e0ffae27bbb15c52c777fe3856cf598b2664ca736a` | `5957a290d3d23e458fb4ddf641868719ac940514eb3aee5aa0df417112ca04e2` | Path/fixed-point patch only; gate logic, priorities, vocabulary untouched (`[T0]`) |
| `orrery_nav_bridge.py` | `ae6502b960924b7c94b663ef9ccac67558533833e04500f0722f9c4fd2edc98e` | `77d87207d721af47210d9bfc446089e48e32bad2cca66463307a808e89a0c997` | Paths, repo fixed point, and `mvp2.py` knock-on pin (`[T0]`) |
| `mvp2_orrery_nav_smoke.py` | `fe81ee3adb3228e788302530471a93f95797cf98c33806ff820b150fb1bce6ec` | `7718193bfd793c75c5fc5e871225e73a42c089bce49732050edb615c11ba0398` | SCRATCH path only (`[T0]`) |
| `orrery_nav_report.json` | `8c95483ebb745e85969eb555060f8f3dca1995ee0f59e46a8638e0b23bd9477b` | `951bec1283430422783443c9144ea8cb80f1c63d1251df0449239d55331b8285` | Regenerated by the full smoke (`[T0]`) |
| Task artifacts | absent | `task-a/`, `task-b0/`, `task-b1/`, `task-c/`, `task-close/` | New MVP-3 scratch set; receipts + probes + corpora |
| Corpus payloads | absent | DCMLab ABC; music21 corpus; Billboard LAB; Isophonics TTL; WJazzD DB | Licenses in §5; not repo payloads |

**Retained spec bytes.** `task-b0/mvp3_encoder_spec.json`, SHA-256 `918228d497fc57e7c63b79ebd33c554ac4e52cb58760a9b68d86c52f6daae17c` (`[B0]`, `[B1]`, `[C]`). B1 consumed these frozen bytes; any spec change requires a new B0 cycle and A-8 re-review.

**Lands vs reconciles at L19 (proposal only).**
- **Lands:** the L19 combined ledger entry; the five MVP-3 receipts; the frozen spec and encoder bytes; this closing report; the license/citation register; the Task 0 harness re-pin record; the L19 landing receipt.
- **Reconciles:** the two masters’ divergent harness files (path/context parameterization decision), the gate byte question (`mvp2.py` archival vs scratch-patched), and the YAML/JSON projection bindings required by the landing discipline.
- **Does not land in MVP-3:** H-CLEAN(i) fix, F1 disposition, evidence-advisory work (all carried in §6).

---

## 8. L19 PRECONDITIONS CHECKLIST

No L19 action is taken in this report. Checklist for the L19 session:

- [ ] **Maintainer stability confirmation** — RE-CONFIRMED at L19 session open (the scratch-only exemption ends at landing).
- [ ] **Repo write-window protocol** — open snapshot (HEAD + `git status --porcelain` digest) at session start; per-step open/close snapshots during landing; close snapshot at session end.
- [ ] **Ledger baseline** — L18 `6d4ab925...` / `323,099 B` / `4,059 lines`; append-only L19 entry.
- [ ] **Land gate `mvp2.py`** — reconcile archival `fb9db3cd...` with scratch-patched `5957a290...` (path/context decision) before binding.
- [ ] **Land encoder `mvp3_encoder.py`** — pin `dc237927...`.
- [ ] **Land spec bytes `mvp3_encoder_spec.json`** — pin `918228d4...`; retain the freeze boundary.
- [ ] **Census pin** — `census_462.json` SHA-256 `242bce7423bc2eb0ae61ee431c27901d6a87401b8b3ffd6725a04d0e1ed0685a`; manifest `1,480 / 95,207,429` re-verified.
- [ ] **Full pin re-verification** — 51/51 Task-0 lineage pins; all receipt/artifact pins in §2.
- [ ] **Two-masters reconcile** — merge entry per D-4 combined-entry discipline; no auto-sync.
- [ ] **Licenses/citations** — §5 into the landing record (including WJazzD ODbL supersession).
- [ ] **Release closure** — authoritative gate re-run; `418/0` invariant checked at landing.
- [ ] **H-CLEAN(i) / F1 / evidence advisory** — remain out of MVP-3; recorded in §6.

---

## 9. SPRINT GOVERNANCE AUDIT

**Task × verdict.**

| Task | Verdict | Evidence |
|---|---|---|
| Task 0 — harness re-pin | **ACCEPT / CLOSED** | 51/51 pins; bridge `--check` PASS; full smoke PASS; 13/13 E-series; zero STOPs (`[T0]`) |
| Task A — proposer + Chaldean card | **ACCEPT** | A-7 block complete; 20/20 valid calls; boundary exercised; card zero-veto; null effect recorded (`[TA]`) |
| Task B0 — frozen encoder spec | **ACCEPT** | DCMLab provenance pinned; spec digest `918228d4...`; A-8 PASS (`[B0]`) |
| Task B1 — five-corpus calibration | **ACCEPT / CLOSED** | 5/5 corpora; 146,712 transitions; arithmetic exact; teleport verified; determinism 100% (`[B1]`) |
| Task C — compute avoidance | **PASS (receipt)** | n=20,000; two mode ratios; single CAR null; A-5/A-6 honored (`[C]`); planning-seat adjudication pending |

**Amendment map.**

| Amendment | Scope | Disposition |
|---|---|---|
| A-1 | Failure-receipt variant | Standing; no STOP receipt issued |
| A-2 | Census extension | Task 0; discharged (`[T0]`) |
| A-3 | Offline `--check` | Task 0; discharged (`[T0]`) |
| A-4 | Full ledger digest | Task 0; discharged (`[T0]`) |
| A-5 | Energy optional / coefficient source | Task C; discharged; no Joules, `coefficient_source: null` (`[C]`) |
| A-6 | `k_rollout_tokens` declared | Task C; `64` recorded (`[C]`) |
| A-7 | Proposer-execution block | Task A; discharged; Task C Probe block added (`[TA]`, `[C]`) |
| A-8 | B0→B1 checkpoint | PASS (`[B0]`/`[B1]`) |
| A-9 | Verdict template | Task 0; used (`[T0]`) |
| A-10 | Census + vocabulary | Task 0; discharged in §3 (`[T0]`, `[TA]`, `[B1]`, `[C]`) |

**Stop-rule audit.** Formal receipts: **0 STOPs** across Task 0, A, B0, B1, C. `stop_rules_triggered = []` in all five receipts. S-1..S-7 not triggered. Pre-formal harness iterations (Task A setup path bug; Task C quick-mode smoke) were executor-side setup runs, not sprint receipts; they are disclosed by the Task A model-selection note and transcript numbering and did not issue a STOP receipt. No rule was waived.

---

## 10. CLOSING VERDICT LINES

```text
MVP3-SPRINT-CLOSING
FIXED-POINT: 8c66cf16a9a364b3b4096e9aab31e4ba6f24d3c2 / TREE CLEAN / L18 6d4ab925...c21b5e944923 / 323099 B / 4059 lines
BASE-REALM: 15d521ea5d9fd38394ff0a580819f13970072812c619daf60274fd43d2b140da / 62 FILES / UNCHANGED
TASKS: 0 ACCEPT-CLOSED | A ACCEPT | B0 ACCEPT | B1 ACCEPT-CLOSED | C PASS (adjudication pending)
RECEIPTS: T0 db891a44... | TA cb9083f4... | B0 ae50fd2b... | B1 c658a588... | C 022856bb...
CORPUS: 5/5 RETRIEVED / 146712 TRANSITIONS / 8172 ACCEPTED / 138540 TELEPORT-REJECTS (52810 UNGOVERNED + 85730 UNLICENSED)
GATE: 20024 CALLS CROSS-FOOTED / DETERMINISM 100% / LATENCY 1.838 us MEDIAN / 3.665 us P99 @ n=20000
AVOIDANCE: PERFORMER 8770340.94168948 DECODES/S | PROBE 23527249.33370095 TOKENS/S | SINGLE-CAR NULL
REPO-WRITES: 0
STOP-RULES: 0
STATUS: COMPLETE
```
