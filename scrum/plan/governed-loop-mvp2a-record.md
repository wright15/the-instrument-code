# MVP-2a — The Licensed Loop: Build Summary

**Status:** Scratch-realm build record, landed planning-side — see ledger entry "Governed-loop MVP-2a record — 2026-10-18."

| Field | Value |
|---|---|
| Status | Executed in scratch realm; no repository writes (repo worktree clean) |
| Sitting HEAD | `3fb68575…` |
| Initial state | fixed `1387@0` (A0 anchor, family size 7); human/scripted sessions deterministic |
| Result | Gate v2 green: oracle 420/420 + 924/924 + 168/168; v0-regression exact; Tier-2 firing demonstrated (12 FamilyB at 10k); smoke deterministic; dispute tool validated |

## 1. Phase 0-extension freeze (`freeze_report_v2.json`, `frozen_seam_substrate.json`)

Nine sources extracted via `git show 3fb6857:<path>` (hashes recorded in the substrate).
Cross-checks all green, fail-closed:

- Applications 3,402 = 462 M + 14×210; R1+L1 = 420 rows over **336 distinct sources**
  (126 R1-only, 126 L1-only, 84 both).
- Carries: R1 +1, L1 −1, all others 0; equivariance 40,824 checks (probe oracle).
- Family B derived from `derived/hypergraph/bipartite-inclusion-v1.json`:
  **42 pairs / 90 crossings / histogram {1:30, 5:12}** — exact match to the probe;
  Andalusian share `7-35:3 ↔ 7-32:0` = 5 shared, 2 admitted (5-23, 5-27) — exact.
- **Lineage (required):** MVP-1 inputs from `482a1bfb`; MVP-2 inputs from sitting-HEAD;
  census `records[462]` payload-identical; `phase-a-probe.v1.json` byte-stable
  (`48f51367…`). Fingerprints drift, payloads hold (A2 lesson).
- **Pre-registered widths from 1387@0:** Family A reachable = **0** (images at phase 11/1);
  Family B partners = **6 total, 4 new** (859, 1435, 1459, 1645 outside the family) —
  the exact phase-0 Tier-2 a-priori surface.

## 2. Gate v2 — findings the build surfaced (both flagged for review)

- **v2-P2 boundary licensing (recorded):** R1/L1 algebra includes boundary records —
  104 distinct boundary masks / 128 rows as sources and as targets. Per the adjudicated
  ordering (Tier 2 before the boundary rule), those seams are licensed. If boundary
  access is not intended, the fix is an ordering/policy amendment (one line).
- **v2-P4 Tier-1 same-phase interpretation (recorded):** the adjudicated Tier 1 text
  (root equality alone) would license same-mask phase jumps, contradicting the
  load-bearing "no free phase steps" clause. Implemented as **same root AND same phase**;
  a same-mask phase shift with no operator image is vetoed. This is the spec-gap
  closure the directive's own clause requires; flagged R24-style.

## 3. Oracle test (`oracle_report_mvp2.json`) — all pass

| Check | Result |
|---|---|
| R1/L1 rows accepted | **420/420**, all with `FamilyA:` citations (the 2 intra-family rows also carry a phase change, so Tier 2A fires, not Tier 1) |
| Free phase steps (`m@0→m@1`, `m@0→m@11`, all 462 masks) | **924/924 REJECT** (office-supported → `unlicensed-transition`; boundary → `ungoverned-transition`) |
| Family B bridges (42 pairs × both directions × phases 0/7) | **168/168 ACCEPT** with `FamilyB:bridge` or Tier 1 |
| Wrong-phase bridge | no Tier-2B licensing |

## 4. Regression (`run_report_mvp2_regression_*.json`)

- **v0-emulation ≡ MVP-1 decision sequence: exact identity at 1k and 10k**
  (the true semantics regression: Tier 2 off reproduces MVP-1 line-for-line).
- **1,000 steps (seed 42):** v2 identical to MVP-1; **zero Tier-2 hits** on this
  deterministic stream (the four licensed phase-0 targets were never drawn — the
  pre-registered width is a real but small surface).
- **10,000 steps (seed 42):** veto 0.4920 vs expected 0.4924 (z = −0.08);
  **12 Tier-2 accepts, all `FamilyB:bridge`**; first divergence at index **1277**
  (`875→1451`, v0 REJECT → v2 ACCEPT, citation FamilyB); per-line attribution
  invariant **0 violations / 10,000**; chain PASS; re-run byte-identical
  (`168fed52…`).

## 5. Smoke sessions (canned, deterministic)

- `smoke_a` (6 lines): self accept; **Tier 2A accept `L1:1387→2773@11`**;
  free phase step veto (`unlicensed-transition`); boundary veto with **dispute**;
  Tier 1 accept; not-census veto. Chain PASS.
- `smoke_b` (3 lines): **Tier 2B accept `FamilyB:bridge → 859@0`**; Tier 1 accept;
  boundary veto. Chain PASS.
- Both byte-identical on re-run (`cmp` clean); `verify` clean.

## 6. Dispute analysis (`dispute_analysis_smoke.json`)

- Smoke corpus: 9 lines, 5 accepts, 4 vetoes, **1 dispute** (boundary veto on 501) →
  band **sparse**, no refinement targets.
- Tool validated against a synthetic clustered case → band **clustered**, target named
  (`ungoverned-transition | root=2773 | free`, count 3, candidates 501/505/575).
- 10k regression: 0 disputes → band **none**.
- Standing rule carried: disputes are calibration data, never appeals.

## 7. Live session — conducted (Mac-1), with post-session hardening

`python3 mvp2.py play` — CLI menus (family / `seamA:L1` / `seamB:bridge` / free entry),
veto reasons on screen, `dispute? [y/N]` prompt on every veto.

**Mac-1 session** (`gate_log_mvp2_live_mac1.jsonl`, `de90eb47…`, 8 lines, chain verified):
3× Tier 1 → **Tier 2A (`L1:1387→2773@11`)** → Tier 1 → boundary veto (disputed) →
Tier 1 → **Tier 2B (`2777@11→2741@11`, derived pair 7-35:0↔7-32:4)**. Offices traversed
Saturn → Sun → Moon. Dispute analysis: band **sparse** (1 dispute, on the unchanged
V0-P3 boundary rule; no refinement targets).

**Post-session hardening (R-class, cosmetic):** the interactive `free` parser split on
whitespace while the advertised syntax was colon-form — `free 2773:0` was rejected with
a usage line (nothing logged; zero ledger impact, per the 8-line audit). Fixed by a
shared `parse_free` used by both interactive and scripted paths, accepting
`free <mask>`, `free <mask>:<phase>`, and `free <mask> <phase>`, with phase range
validation 0..11. Permanent self-test: `python3 mvp2.py parsetest` (5/5 accepts,
7/7 rejections). Smoke A/B ledgers byte-identical post-fix (`c473e283…` / `9a51dbda…`);
piped replay of the exact failed forms now lands correctly (free-phase veto;
boundary vetoes; dispute prompt intact). No re-run of Mac-1 required — its bytes stand.

## 8. Success criteria (directive §11)

1. Phase 0-extension frozen, all cross-checks + lineage green — **PASS**
2. Regression exact + oracle 100% — **PASS**
3. Smoke byte-identical + verify clean — **PASS**
4. ≥1 live human session with disputes — **PENDING HUMAN** (tooling green; harness ready)
5. One-minute explanation intact — **PASS** (human proposes, the licensed gate disposes,
   disputes calibrate)

## 9. Artifacts

- `freeze_v2.py`, `freeze_report_v2.json`, `frozen_seam_substrate.json`
- `mvp2.py`, `oracle_report_mvp2.json`
- `run_report_mvp2_v0emul_{1000,10000}.json`, `run_report_mvp2_regression_{1000,10000}.json`
- `gate_log_mvp2_{v0emul,regression}_{1000,10000}.jsonl`
- `smoke_a.json`, `smoke_b.json`, `gate_log_mvp2_smoke_{a,b}.jsonl`, `run_report_mvp2_smoke_{a,b}.json`
- `analyze_disputes.py`, `dispute_analysis_smoke.json`, `dispute_analysis_regression_10k.json`

## 10. Fences observed

Scratch only; `integrated-release` worktree untouched (verified clean); v2 policy
details labeled (v2-P1 bidirectional Family B, v2-P2 boundary licensing, v2-P4 Tier-1
same-phase); no corpus, no LLM, no energy measurement; `gate_log_*` are not the
decision ledger; use is not admission.
