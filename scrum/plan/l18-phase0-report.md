# L18-PHASE0 — Read-Only Diagnostics and Declarations

## Fixed point (opened, verified)

### SHA-256 pins

| Item | Value |
|---|---|
| Repo HEAD | `65c72478d83ce3982e51e24d9422191510e89962` (prefix `65c7247`) |
| Tree | clean (`git status --porcelain` empty) |
| Ledger L17 | `8901b4a33fadf1f8…`, 307,304 bytes, 3,967 lines |
| `MANIFEST.json` | fileCount 1,402; totalBytes 90,516,292 |
| Drift | none; no STOP fired |

Post-diagnostics re-check: same HEAD, clean tree, same ledger prefix/bytes/lines, same fileCount. This phase performed no repo writes and no realm mutations.

## 1. Pipeline cost, itemized

### 1a. What `npm run validate` actually validates

`npm run validate` is a 14-stage chain, not a whole-tree parser:

`validate:ledger-pins` → `build:graph` (writes graph output) → `validate:graph` → `validate:semantic-operators` → `validate:mechanics-thermodynamics-registry` → `…-v2` → `validate:tiered-photonic` → `validate:twin-hub` → `validate:fifth-space-census` → `validate:d-shadow` → `validate:gov514` → `validate:release` → `validate:prose-consistency` → `validate:cypher`.

Scope facts, read from the scripts:

- It does **not** parse all in-tree JSON. `build-manifest.mjs` walks and hashes every file but parses only `package.json` and `provenance/release.json`. `validate-release.mjs` parses a named release-artifact set and runs named sub-validators. `validate-prose-consistency` scans Markdown only in `docs/**`, `orrery/*.md`, `scrum/**/*.md`, `README.md`. `validate-ledger-pins` scans `scripts/` only (Python AST + JS/TS lexical). `validate-cypher` parses Cypher. The domain validators parse their own artifacts.
- `validate:manifest` is not a direct chain entry but is invoked inside `validate:release` (and is separately available as a root script). `validate:release` writes `qa/integrated-release-validation.json` (currently 418/0; no duration field).
- `validate:evidence` is outside the chain (advisory, 43 checks in the BL-092 record) and is not part of `npm run validate`.
- If the frozen substrate (`frozen_seam_substrate_v3.json`, 47,207 B) and seam catalog (`seam_legal_moves_v3.json`, 551,287 B) land under `tools/`, they are **in scope for the manifest hash walk and the file-count-dependent release-closure digest**, but **not parsed by the semantic validators** and not in the `validate:release` required-file list. They add hash cost only. The `qa/integrated-release-validation.json` and `qa/validation-prose-consistency.json` are excluded from the manifest.
- `npm run validate` is not read-only: `build:graph`, `validate:release`, and `validate:prose-consistency` write. This phase did not run it.

### 1b. Manifest rebind for a new directory

- `build-manifest.mjs` walks the whole tree; the excluded set contains only `CHECKSUMS.sha256`, `MANIFEST.json`, `.env`, selected generated QA receipts, `.git`, caches, `.venv`, `.playwright-cli`, `orrery/dist`, `orrery/.vite`, and `node_modules` (skipped). It has **no size or count limit**; it reads each file and records `path`, `bytes`, `sha256`; `fileCount`/`totalBytes` update; `MANIFEST.json` and `CHECKSUMS.sha256` are excluded from themselves.
- A new `tools/governed-loop/` directory is included automatically. The rebind entails: one full hash pass; updating `fileCount`/`totalBytes`; `validate:manifest` exact comparison (invoked by `validate:release`); re-emission of the 418-check release closure; the R19 manifest-count-dependent release-closure digest re-emits; then the settling pass.
- The full load-bearing set is roughly 30 files / ~6.3 MB (the largest: `seam_operator_applications.csv` 1.04 MB, `seam_legal_moves_v3.json` 551 KB, `seam_bipartite_inclusion.json` 321 KB, `census_462.json`/`seam_census_head.json` 194 KB each, ground truth 91 KB). The manifest currently binds 90.5 MB / 1,402 files; the addition is within the same scale, with no cap.

### 1c. Settling pass

Standing rule 9 (`provenance/DECISION_LEDGER.md:49-51`): “Sprint exit is a fixed point: `package:manifest -> --check -> validate`, with a full pass that makes no tracked change.” The settling pass is that post-write loop: write the manifest/checksums, validate the manifest, run the chain (which writes the release receipt, prose receipt, and graph output), and repeat until a pass makes no tracked change. Prior records cite zero or one settling cycle; GOV-527’s tree statement expects one cycle. No duration is recorded in any receipt (`qa/integrated-release-validation.json` has no duration field), so this is an **estimate**: ~2–5 minutes per full validate cycle on this tree, dominated by the 418-check release closure and its graph/sub-validators; the ~90 MB manifest hash pass is seconds; the cascade scripts are seconds each. One to two cycles. The sprint closeout’s planning estimate for a whole landing is ~1 hour of agent work plus maintainer review. Not measured in this phase because a pipeline run is forbidden here.

### 1d. Deferred ledger full-regen (PV3-DIR-4 / SS7.6)

The carried obligation is: the full-regen deferral stands only because the Policy-v3 and ORRERY-NAV sessions wrote no repo bytes; any future repo-writing session derives the full L-state at opening. The full-regen to catch up the two realm arcs requires:

1. **Opening L-state:** derive L17 (`8901b4a3…`; 307,304 B; 3,967 lines), prove the append position (prefix/tail-anchor; R23, not numstat-blind), and record the post-append L18 state.
2. **Append the two arcs** (one combined L18 entry or two entries): Policy-v3 registration (the realm entry, `48290a2f…`, the E1–E10 evidence, the 501 closure, the 41-at-T11 sweep, α–δ, the receipt inventory) and ORRERY-NAV-1 acceptance (PASS, the four endpoints, two-leg conformance, overlay, phase-connectivity finding, F3). Follow ledger rules 7/8 and the established non-claim form.
3. **Append-first cascade** (BL-092 model): re-bind the ledger-bound artifacts — twin-hub convergence, fifth-space census, shadow-ladder, pentatonic binding audit closure, fivefold engine promotion evidence — plus the downstream orrery projections. The d-shadow complement-span has no ledger digest and should verify fresh, not be refreshed (BL-092 OD-92-1). BL-092 §1 also performs a P0 preservation of the pre-refresh artifacts (17 files + receipt) before the append; the same discipline applies.
4. **Release closure and packaging:** re-emit `qa/integrated-release-validation.json` (418/0, verdict invariant), rebind `MANIFEST.json`/`CHECKSUMS.sha256`, and run the focused suites/validators (BL-092: 40 pytest + 1 node + 35 mutation probes; ledger pins; evidence advisory; `orrery:check`; full `npm run validate`; manifest).
5. **Settling pass:** the 1c fixed point.

Estimated cost: the BL-092 cascade is the closest precedent; the two arc entries add the authoring/pins. Estimate ~30–60 minutes of agent work plus maintainer review, 1–2 settle cycles (2–5 min each), and the BL-092-sized verification set. The two entries are ~2–4 KB each; the cascade/closure/manifest dominates. This is an estimate, not a measured duration; the phase0 pipeline ban prevents measuring it.

### 1e. Does any repo write void the zero-write posture?

Per the carried obligation as stated in the PLV3 build dispatch and the acceptance record: the full-regen deferral stands **only because the session writes no repo bytes**; “any future repo-writing session derives full L-state at its opening.” The condition is any repo bytes, not only ledger-regenerating writes. The first repo write — an incubator copy, a manifest rebind, or a ledger append — ends the zero-write posture and triggers the full L-state at that session’s opening. A non-ledger write does not escape it. This phase writes nothing, so the posture remains intact for L18-PHASE0; the L18 landing is the first repo-writing session and must open with the full L-state.

## 2. Incubator path — DECLARATION

**Declared home: `tools/governed-loop/`** (one directory, flat load-bearing set; the four prose records remain in `scrum/plan/` per the task’s own list, not scattered copies of the incubator).

Reasoning, grounded in the repo’s actual conventions:

- The repo has no `tools/` and no `packages/`, and the root `package.json` declares no workspaces. The existing release packages are top-level `seven-governors-*`; `orrery/` is the app; `scripts/` is the pipeline. A new `packages/` wrapper would invent a monorepo convention the repo does not use. `tools/` is the conventional non-published tooling home and follows the repo’s function-named top-level layout.
- `validate:ledger-pins` scans `scripts/` only. The pinned bridge contains 24 artifact 64-hex literals; under `scripts/` they would be unreviewed literal-pin findings. `tools/` keeps them in the manifest but out of that scan.
- `validate:prose-consistency` scans `docs/**`, `orrery/*.md`, `scrum/**/*.md`, `README.md`; `tools/` is outside it. `validate:release`’s required-file list and sub-validators are specific; `tools/` adds no semantic gate there, while `validate:manifest` binds it first-class.
- The `canonical/fivefold-incubator/` directory is a data namespace; `tools/governed-loop/` is code/evidence and does not collide with it.
- The path is not in `.gitignore`; the manifest walk includes it. Record the path in L18.

## 3. Manifest binding scope — DECLARATION

**Declared: first-class bind.** The reasoning is in 1a/1b:

- `build-manifest.mjs` walks every file and has no ignore entry for `tools/`; the incubator would be included automatically on the next `package:manifest`. “Plain-tracked” is not a builder mode: to keep the files out would require editing the excluded set (a repo write and a divergence) and would make the incubator invisible to the manifest, contrary to the recommendation.
- The manifest has no size/count limit; the ~6.3 MB load-bearing set is within the existing 90.5 MB scale. The frozen substrate/catalog add hash/file-count cost, not semantic validation.
- First-class binding triggers the expected R19 class: the file-count-dependent release-closure digest re-emits, `validate:manifest`/`validate:release` re-run, and the settling pass applies. That is the correct landing behavior, not a reason to exclude the files.
- Bind the full load-bearing set, not a subset: the bridge’s runtime pin check requires all 24 of its `EXPECTED` inputs (see 4/7), and a partial bind would make the manifest truthful while the incubator is non-instantiable.

## 4. V2 lineage inventory — READ-ONLY + DECLARATION

### SHA-256 pins

Pins below are derived this phase. “IN” means land; “OUT” means exclude.

| Realm file | Bytes | SHA-256 | Disposition |
|---|---:|---|---|
| `seam_legal_moves_v2.json` | 44,269 | `c017c3c66e10b803eccb82342d030575c8069434063657fb89b5d56169db4d4b` | **IN** — E9 referent / alias target; bridge pin. |
| `frozen_seam_substrate.json` | 42,668 | `8a5e82ac5f3b596720db2b62f2ba82484bab5250d168035e4c84cf9870c90bac` | **IN** — `mvp2.py` gate input (`SUB_PATH`); not just lineage. |
| `freeze_report_v2.json` | 1,317 | `da14de46d36aa8f183655bbc56605d7d785dd531f898a25e99805666cbbaefeb` | **IN** — v2 freeze lineage; bridge pin. |
| `freeze_report.json` | 2,731 | `4e76c1396cf7be8e45619b38bce7b051f75f2c3e9adebd142b07fa9f2de5c7d0` | **IN** — v1 freeze lineage; bridge pin. |
| `seam_census_head.json` | 194,194 | `f7e56b2b180c456fd4abc96069796d6737f77d13ba66c751604fe95cd19e6d5a` | **IN** — v2 freeze input; bridge pin. |
| `seam_phase_a_probe.json` | 42,551 | `48f513679d505087277d5670952fb860b755832775f5fb5980aa3f71c73330bb` | **IN** — E1/E2/E5 evidence; bridge pin. |
| `phase_a_probe.json` | 42,551 | `48f513679d505087277d5670952fb860b755832775f5fb5980aa3f71c73330bb` | **IN if** `spike01.py` is landed; byte-identical duplicate under the generator’s expected name. |
| `seam_operator_applications.csv` | 1,042,979 | `1f7b2abb047132fa957f761a73e7c76038766f617bed9c916f971a8c0072f53e` | **IN** — E8; bridge pin; v2 freeze input. |
| `seam_operator_registry.csv` | 4,434 | `e5a9e6929fca048078e0db6ff044facc7137a6ef61e994d74f1d526e27b6482e` | **IN** — bridge pin; freeze input. |
| `seam_bipartite_inclusion.json` | 320,972 | `903eebf0e1122d8ba81971abcd7efc8ac934d3bfd7885b98b49e58ab0bbe3e41` | **IN** — Family B lineage; bridge pin. |
| `seam_build_phase_a_probe.mjs` | 46,053 | `59deb0e42a9806c8136ec70349f4707c025cd5d2ab97fb7e723b490a14c3c0c8` | **IN (optional lineage)** — v2 probe generator; cheap. |
| `seam_validate_phase_a_probe.mjs` | 21,564 | `8177b23d20446e377318af36d5303b1c7dbc38d6a80ba5f1cab15a50a8c7d9ee` | **IN (optional lineage)**. |
| `seam_rl_operator_math.md` | 13,265 | `ab5746357090e8e314b019f41107664e9c701f08f266b00a34784623e00c4f4b` | **IN (optional lineage)**. |
| `freeze_v2.py` | 11,715 | `53ff56c385ca1bcf36ef827e90629aab7831a3bd7a3ed5a06057800d79675e12` | **IN (optional lineage)** — v2 freeze generator. |
| `freeze.py` | 14,591 | `78c939ea1d9bbf710c56647f641b624854338c2f4328368d785686da2bd0a50f` | **IN (optional lineage)** — v1 freeze generator. |
| `spike01.py` | 8,206 | `1e7bbbc318aac79b02911f74d3635328cbcd17b2f2083ca7fa76a3167186878b` | **IN (optional lineage)** — 41 prediction generator. |
| `spike-01-phase-policy.md` | 9,176 | `015d0b4332edc676df4df3f0849ae05287fa324e6c3f275487fb9b56da0465e2` | **IN (optional lineage)**. |
| `analyze_disputes.py` | 3,929 | `8328798ad20bc2eb03b5e9dddc4de7f98269663133e11a79f06b1e61d354217d` | **IN (optional lineage)** — E6 dispute analysis generator. |
| `census_exec.json` | 194,194 | `88c4accccb0d10098379c5dd38e1eab467c716e39a16882d323ac31b839c2046` | **OUT** — v1 execution receipt; freeze report pins it. |
| `census_val.json` | 16,323 | `bebb7afd2c0a208bc8e992ba709139b0e4068122187efe37ca2775b1d539a948` | **OUT** — v1 validation receipt. |
| `census_val_exec.json` | 16,323 | `ff336d464f0351feb2d8c60503a1cfada24bd31549a6fd2f8a2cc2f4b8789483` | **OUT** — v1 execution receipt. |
| `network_data.json` | 2,765,575 | `21e2a632837ecf40fe9229e9eb4ec0a5cceb9e2043fe89cb8e1d320518d7bdbc` | **OUT** — v1 freeze input; ground truth is the frozen output; freeze report pins it. |
| `gov528_aggregate.json` | 47,976 | `b16d4cf39b0a855005acdf3bd6917587d870aed43756375cf15f6e05b1b59b21` | **OUT** — realm copy of the repo `qa/gov-528-production-aggregate.json`; the repo original is the correspondence anchor. |
| `mvp2_bridge.sh` | 3,161 | `7574d1ca29ee97b43effd9848a674222a2cb9e65d789e93392214f314b0f48be` | **OUT** — MVP-2b bridge runner; superseded by the ORRERY-NAV runner. |
| `bridge_replay.js` | 5,295 | `4875dc3827aab60631ae1bb1e358b05fc40e70607f0475a1db69651bcc8b4f86` | **OUT** — MVP-2b replay. |
| `bridge_replay_live.js` | 5,004 | `2d414ae343e11b04a06386ae4147c14db3454a64c91dc5f0e07267581ade55b6` | **OUT** — MVP-2b live replay. |
| `bridge_init.js` | 2,521 | `aef2b7429e939dd1cf3e71f96ba8d9790e782b1fc8fc73bf0c59d8ee7336406a` | **IN** — ORRERY-NAV instrumentation harness (used by `orrery_nav_run.sh`); not v2 lineage but load-bearing. |
| `orrery_nav_run.sh` | 2,518 | `2678f719345defd83200a66802f1bcd5faac4e8c6ed22095c752e465eb6082fc` | **IN** — harness; not in the task’s staging list. |
| `orrery_nav_opening.py` | 3,766 | `2461ac90fe63f9db0ea721124a60133f31f1cacbe0c543f6be426b3799f907a2` | **IN** — opening-record generator; not in the task’s list. |
| `orrery_nav_opening_probe.js` | 2,901 | `597563ec22a030c9a8965f800056acbcd232aef5f97c3bd7bd81c590998aedfd` | **IN** — opening expressibility probe; not in the task’s list. |
| `orrery_nav_browser_log.json` | 12,957 | `bf42f87801d7e0c4a5be878414cd98a151982c2ee919e2113594575563444d8f` | **OUT** — browser artifact; the report embeds it. |
| `orrery_nav_probe.js` | 10,492 | `811bda70f3a1e66adb6ad84b3c272350a75dc5589038330a8b74054f172467d6` | **OUT** — generated by the smoke each run. |
| `orrery_nav_opening_probe.json` | 203 | `9960f36b1db943d29446a5de0bf5d97cd96723b2baef4967818a960c3a484868` | **OUT** — raw probe output; the opening record carries the result. |

The `legal-moves.v2` alias is not a file: the referent is `seam_legal_moves_v2.json`; the alias record lives in `policy-v3-registration.md` and `plv3_receipt_beta_supersession.json`, both IN. The v2 catalog is IN per the E9 default; the v2 substrate is not merely “cheap” — it is the gate’s runtime input and is the critical omission from the task’s staging list.

## 5. Ground-truth anchor — DECLARATION

### SHA-256 pins

**Declared: land `frozen_ground_truth.json` (007b0ffe…) as load-bearing.** Reasons:

- `mvp2.py` loads it as `GT_PATH`; `orrery_nav_bridge.py` loads it in `Model`; the bridge’s `EXPECTED` pins it. A realm-only ground truth would make the gate and bridge non-instantiable in the incubator unless the code is re-pinned.
- The repo `qa/gov-528-production-aggregate.json` is not a substitute: it carries the 308 member records/orbits/partition and `withheldBoundary = 154`, but not the 462 masks, roles, pcSum, families, governing roots, or orbit membership needed by the gate or the Policy-v3 E7 evidence. It remains the **correspondence anchor**, not the primary.
- The Policy-v3 registration’s E7 evidence and the E3↔E7 correspondence already treat the realm ground truth as primary and the repo aggregate as correspondence-only. Landing the ground truth preserves that hierarchy.
- The byte pin is `007b0ffe65015bd2c5f1a6fe0df8969961ce8cfb3d499677b143d971e1fc5744`; it is 91,360 B.

## 6. Staging plan on paper — READ-ONLY

**Pre-stage (before any copy):** compute the full sha256 of every source in the realm and compare to the registered pins. Any mismatch is a STOP; no partial landing, no “fix the pin to fit.” Record the source list and pins in a staging receipt (new artifact; the landing directive can pin it).

**Destination:** `tools/governed-loop/` flat load-bearing set (original filenames preserved so the pinned code’s expected names resolve), plus the prose records in `scrum/plan/` per the task’s list.

**Copy order (groups; verify after each file):**

1. **Immutable data / ground truth:** `census_462.json` (`242bce74…`) → `frozen_ground_truth.json` (`007b0ffe…`) → `frozen_seam_substrate.json` (`8a5e82ac…`) → `frozen_seam_substrate_v3.json` (`9f9818ef…`) → `seam_legal_moves_v3.json` (`e6cf62a8…`) → `seam_legal_moves_v2.json` (`c017c3c6…`) → `seam_operator_applications.csv` (`1f7b2abb…`) → `seam_operator_registry.csv` (`e5a9e692…`) → `seam_phase_a_probe.json` (`48f51367…`) → `phase_a_probe.json` (`48f51367…`, if `spike01.py` is in) → `seam_bipartite_inclusion.json` (`903eebf0…`) → `seam_census_head.json` (`f7e56b2b…`).
2. **Freeze/evidence/receipts:** `freeze_report.json` (`4e76c139…`) → `freeze_report_v2.json` (`da14de46…`) → `freeze_report_v3.json` (`1c65a07c…`) → `plv3_receipts_manifest.json` (`461a16b0…`) → the eleven Policy-v3 receipts (`pcsum_23` `f9666daf…`, `pcsum_24` `0128748a…`, `pcsum_48` `6bd2e4e7…`, `pcsum_49` `8a06b211…`, `boundary_exits` `ea20bc95…`, `boundary_entries` `12ca0625…`, `crossphase` `806dfa06…`, `familyb` `cb2180bd…`, `beta` `53a12654…`, `nonvacuity` `cb9fa9e6…`, `case501` `0fab6bc4…`) → `gate_log_mvp2_live_mac1.jsonl` (`de90eb47…`) → `dispute_analysis_mvp2c.json` (`df90f405…`) → `spike01_evidence.json` (`cb170c0d…`) → `degenerate_boundary.jsonl` (`f728f8ee…`) → `degenerate_boundary_report.json` (`339dc893…`).
3. **Code/harness:** `mvp2.py` (`fb9db3cd…`) → `orrery_nav_bridge.py` (`ae6502b9…`) → `orrery_nav_overlay.js` (`ad558dec…`) → `orrery_nav_run.sh` (`2678f719…`) → `bridge_init.js` (`aef2b742…`) → `mvp2_orrery_nav_smoke.py` (`fe81ee3a…`) → `orrery_nav_opening.py` (`2461ac90…`) → `orrery_nav_opening_probe.js` (`597563ec…`).
4. **Reports/registration:** `orrery_nav_opening.json` (`a29ba9a3…`) → `orrery_nav_report.json` (`8c95483e…`) → `policy-v3-registration.md` (`48290a2f…`).
5. **Records (new writes, no pre-existing byte pins):** ORRERY-NAV-1 directive rev 2.1 text, the closing report, the Planning-Seat acceptance record, the F3 erratum → `scrum/plan/`. These are thread texts, not realm files; pin them at first use. The F3 erratum canonical text is **not present** in the realm or the thread; the Planning Seat must supply it before staging. The `download/orrery-nav-1-directive-rev2.1.md` path does not resolve on this disk; the thread-pasted rev 2.1 is the authoritative text.
6. **Optional lineage (cheap):** the v2/v1 freeze generators, `seam_build_phase_a_probe.mjs`, `seam_validate_phase_a_probe.mjs`, `seam_rl_operator_math.md`, `spike01.py`, `spike-01-phase-policy.md`, `analyze_disputes.py`. Include for reproducibility or declare out in the landing directive.

**Byte-identity procedure:** copy raw bytes (`cp`; no JSON re-serialization, no newline normalization, no “pretty” rewrite); preserve executable bits on `.sh`/`.py` separately (content pins do not cover mode); compute `sha256sum` on both source and destination and compare to the registered pin; record source path, destination path, bytes, sha256, and match status in the staging receipt; any mismatch = STOP, full stop. Do not repair, re-generate, or “normalize” a mismatched file.

**Landing sequence (outside the copy):** stage the files → append the L18 ledger entry first (BL-092 append-first) → cascade/rebind → release closure → `MANIFEST.json`/`CHECKSUMS.sha256` → settling pass → final pin table. The staging copy precedes the manifest; the ledger append precedes the cascade.

**Critical staging caveats found this phase:**

- **The bridge’s runtime pin set is larger than the task’s list.** `orrery_nav_bridge.py` `EXPECTED` has 24 entries; the task’s staging list covers only 9 of them. The 15 missing entries are listed in section 7 with pins. The bridge will fail its pin check at startup if any is absent. The v2 substrate (`frozen_seam_substrate.json`) is the most consequential: `mvp2.py` loads it, not the v3 substrate.
- **The pinned code is realm-path-bound.** `mvp2.py`, `orrery_nav_bridge.py`, `mvp2_orrery_nav_smoke.py`, and `orrery_nav_opening.py` hardcode `SCRATCH = /home/erick/workspace/governed-loop`; the bridge also hardcodes `REPO_HEAD` (`65c7247…`), `fileCount` 1,402, and ledger prefix `8901b4a3`. `orrery_nav_run.sh` uses its own directory for `scratch` but hardcodes the repo root. A byte-identical archival landing preserves all pins but will not run from `tools/governed-loop/` after the landing changes the repo HEAD/fileCount/ledger. Two legitimate landing modes must be chosen by the Planning Seat: **(a) archival-first** (byte-identical copies; the realm remains the runtime; the repo is the record), or **(b) runnable** (a landing-time path/context parameterization in a new wrapper or code variant, producing new hashes and a new registration). Do not silently edit the pinned files to make them run; that would break the byte-identity procedure and the ORRERY-NAV-1 pins.

## 7. Exclusions — CONFIRM + load-bearing flags

**Confirmed out:** `.playwright-cli/`, `__pycache__/`, `.pytest_cache/`, Vite logs; `orrery_nav_browser_log.json`, `orrery_nav_probe.js` (generated), `orrery_nav_opening_probe.json` (raw browser output); MVP-2b bridge plans/heards/raw logs/smoke/live logs and `bridge_replay*`/`mvp2_bridge.sh`; MVP-2c session logs/run reports/walk scripts/drafts/summaries/runbook/margin notes; the v1 execution/validation receipts (`census_exec.json`, `census_val.json`, `census_val_exec.json`), `network_data.json`, and the realm `gov528_aggregate.json`; the `phase_a_probe.json` duplicate unless `spike01.py` is landed; generated/manifest-excluded receipts.

### SHA-256 pins

**Load-bearing but missing from the task’s staging list (pin-at-first-use; all pins derived this phase):**

The 15 bridge-`EXPECTED` inputs:

| File | Bytes | SHA-256 |
|---|---:|---|
| `freeze_report_v3.json` | 6,573 | `1c65a07c37740797b2a16048ddac4c17c9877465e7c03498d783291a4a433683` |
| `plv3_receipts_manifest.json` | 2,652 | `461a16b060e9ffc7c81e3cd8ea4d7f14e1d3e11022984dcb2eae9b36a67a8307` |
| `frozen_seam_substrate.json` | 42,668 | `8a5e82ac5f3b596720db2b62f2ba82484bab5250d168035e4c84cf9870c90bac` |
| `seam_phase_a_probe.json` | 42,551 | `48f513679d505087277d5670952fb860b755832775f5fb5980aa3f71c73330bb` |
| `seam_operator_applications.csv` | 1,042,979 | `1f7b2abb047132fa957f761a73e7c76038766f617bed9c916f971a8c0072f53e` |
| `seam_legal_moves_v2.json` | 44,269 | `c017c3c66e10b803eccb82342d030575c8069434063657fb89b5d56169db4d4b` |
| `freeze_report.json` | 2,731 | `4e76c1396cf7be8e45619b38bce7b051f75f2c3e9adebd142b07fa9f2de5c7d0` |
| `freeze_report_v2.json` | 1,317 | `da14de46d36aa8f183655bbc56605d7d785dd531f898a25e99805666cbbaefeb` |
| `gate_log_mvp2_live_mac1.jsonl` | 7,164 | `de90eb47d05cfe28646929123f3a01efe1cc156b413676473894c541f1620c29` |
| `dispute_analysis_mvp2c.json` | 583 | `df90f405e653e7d148f4bd60c405e47d87a7c7e8c2c893f3ecbbefa43d303d50` |
| `spike01_evidence.json` | 8,836 | `cb170c0d00cea3f2db2b69779dc339848befa60f5a78d257c8680f99f6e56fec` |
| `degenerate_boundary.jsonl` | 71,590 | `f728f8eedec6606a39f95fa41188126aec4447bc1907375fb3eb51395e1d48e1` |
| `degenerate_boundary_report.json` | 1,056 | `339dc8934bb0e5a1f3ec8438c9b2d0f9dd0efabc42bb732322ec3e60093e74d6` |
| `plv3_receipt_nonvacuity.json` | 5,046 | `cb9fa9e65b0ad5425d7c3f40b82d05a9d8b08f1b02f20812549cf4e306c12aae` |
| `plv3_receipt_case501.json` | 3,180 | `0fab6bc4b2710dabe02105d98fc16f4e546e367ac7f4773a44ab284c23fc38d7` |

Also missing from the staging list:

- The nine remaining Policy-v3 receipts (`pcsum_23/24/48/49`, `boundary_exits/entries`, `crossphase`, `familyb`, `beta`) — IN for the registration’s receipt inventory; pins in section 6.
- `bridge_init.js` (`aef2b742…`), `orrery_nav_run.sh` (`2678f719…`), `orrery_nav_opening.py` (`2461ac90…`), `orrery_nav_opening_probe.js` (`597563ec…`) — harness files needed by the smoke/opening; IN.
- `phase_a_probe.json` (`48f51367…`) — byte-identical to `seam_phase_a_probe.json`; IN if `spike01.py` is landed (the generator expects the bare name).
- The four records (`ORRERY-NAV-1` rev 2.1, closing report, acceptance record, F3 erratum) have no realm byte pins; pin-at-first-use. The F3 text is not present in the realm or thread; the Planning Seat must supply it. The `download/` transport does not resolve on this disk; the thread text is authoritative.
- The path/pin blocker is load-bearing: the byte-identical code set cannot run in-repo after the landing without an archival/runnable decision (section 6). This is not a file omission; it is the landing-mode decision the directive must make before execution.

```
PHASE: L18-PHASE0
REPO-WRITES: 0
REALM-MUTATIONS: 0
STATUS: COMPLETE
```
