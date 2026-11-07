# DIRECTIVE MVP8.1b-DIR-1 (rev 1) — B4′a Metric Correction and Green Closure

- **Title:** Mean-Emitted-Pitch Stem Sanity Correction
- **Directive ID:** `MVP8.1b-DIR-1` (rev 1; narrow correction of `MVP8.1-DIR-1` rev 1 Bet B4′a)
- **Authority:** Planning Seat (Erick), locked 2026-11-07
- **Status:** AUTHORIZED FOR SCRATCH EXECUTION (Tasks 0–E). Repository remains read-only; `L28` landing remains a separate authorization and is **not** executed here.
- **Execution Realm:** `/home/erick/workspace/scratch-governed-loop-run/mvp8_1b_metric_fix/`
- **Granularity Rule:** Any repository landing is **`L28`**, one dedicated commit. No tag, no push.

---

## §0. Scope and Pre-Execution Correction

`MVP8.1-DIR-1` rev 1 concluded `DEFER`: B4′b (stem Law 3), B4′c (directional diagnostic), B4′d (stem integrity) and all carried bets passed; B4′a failed `3/12` because its locked proxy correlated the lead-stem log-centroid with bar `pcSum`, and office deconfounding has zero residual variance on single-office or two-bar stems. The non-bet mean-emitted-pc diagnostic passed `8/8` defined stems at `>= 0.90`.

This directive changes **one metric definition only** and records it as a new-sprint pre-execution correction; the MVP8.1 result is not amended retroactively.

| Field | MVP8.1 (locked) | MVP8.1b (pre-execution correction) |
|---|---|---|
| B4′a metric | lead-stem log-centroid vs bar `pcSum` | lead-stem log-centroid vs **mean emitted pc** |
| Scored set | all 12 stems | stems with **≥2 offices and ≥3 bars** |
| Threshold | `0.90` | `0.90` (unchanged) |
| Stems | 12 | 5 scored; 7 undefined, explicitly excluded |

No new renders, no engine/table/lookup changes, no new traces, no new listening. The ear gate is already `SIGNED_HUMAN`.

---

## §1. Fixed Point and Inputs

- HEAD `d1b2286a5b6f3783af24094eb78e40ab511bb8e5`; ledger `da9c7941…` (`407,293 B` / `4,383 lines`); manifest `6632ab6a…` (`1,834 files` / `263,181,122 B`); release closure `418/0`.
- Declared working-tree exception: `scrum/plan/mvp8-dir-1-rev2.md`, `scrum/plan/mvp8-1-dir-1-rev1.md`, and `scrum/plan/mvp8-1b-dir-1-rev1.md` are the only untracked paths; no pinned or tracked byte changed.
- MVP8.1 evidence pins: T0/TA/TB/TE receipts, closing report, 24 stem WAVs, 12 MVP8 traces, and the inherited MVP8 receipts/lookup/engine.
- Ear gate: `SIGNED_HUMAN`, `signedBy: Erick`; verdict recorded verbatim; no agent amendment.

---

## §2. Tasks and Bets

### Task 0 — Fixed point, evidence pins, predeclaration lock (`task-0/mvp8_1b_task_0.py`)
- Verify L27, 28/28 pins, 11/11 anchors, strong core `3,204/2,928/276/2,388/540`.
- Verify all MVP8.1 evidence pins (receipts, stems, traces) against the MVP8.1 receipts.
- Verify the ear manifest is `SIGNED_HUMAN`.
- Lock `task-0/mvp8_1b_predeclared_bets.json` with the correction table above and:
  - **B4′a′ (hard):** every scored stem has office-deconfounded `r(log-centroid, mean emitted pc) >= 0.90`.
  - **B4′b/c/d:** carried from MVP8.1 (B4′b PASS, B4′c 6/6 diagnostic, B4′d PASS).
  - **Carried A/B1/B2/B3/C1–C3b/D:** PASS from the MVP8 receipts.

### Task A — Stem verification, no re-render (`task-a/mvp8_1b_verify_stems.py`)
- Verify the 24 stem WAVs by SHA-256 against the MVP8.1 Task A receipt; verify format (mono 16-bit 44.1 kHz).
- Derive office count and bar count per trace; classify the 5 scored stems and the 7 excluded stems with reasons.
- Output `task-a/mvp8_1b_task_a_receipt.json`.

### Task B — Recompute B4′a′ from stem bytes (`task-b/mvp8_1b_bets.py`)
- Re-run the frozen log-spectral lens on the 12 lead stems.
- Compute office-deconfounded `r(centroid, mean emitted pc)` per stem.
- B4′a′ pass iff all 5 scored stems `>= 0.90`.
- Recompute B4′b margins from the stems; carry B4′c, B4′d, and B1/B2/B3.
- Output `task-b/mvp8_1b_task_b_receipt.json` (floats only under `acoustic`).

### Task E — Adjudication, proposal, guarded landing (`task-e/mvp8_1b_task_e.py`)
- If B4′a′ and all carried checks pass and the ear is signed → **`ADOPT_RUNTIME_READING`**.
- Emit the closing report, the draft `PROPOSED_AMENDMENT_SPEC_001_S1_3_PENTATONIC_CONTEXT.md`, and a guarded `mvp8_1b_land.py`.
- The landing script refuses unless `--authorize-l28` is passed; under ADOPT it prints the authorized landing plan but performs no repository write.

---

## §3. Stop Rules

- **S-1:** fixed-point or pin drift; unexpected working-tree path.
- **S-2:** MVP8.1 evidence pin mismatch.
- **S-3:** `mvp2.py` anchor or `src/fivefold/quintessence.py` byte drift.
- **S-4:** strong-core drift.
- **S-5:** stem hash/format mismatch.
- **S-6:** symbolic float, LLM call, repository write, or agent-authored ear verdict.
- **S-7:** ear manifest unsigned (not selected; signed).

---

## §4. Terminal Verdict Format

```text
MVP8.1b-METRIC-FIX-CLOSING
FIXED-POINT: d1b2286... / L27 da9c7941... / 407293 B / 4383 lines
EVIDENCE-PINS: <n>/<n> MATCH / EAR-GATE SIGNED_HUMAN
TASKS: T0 COMPLETE | TA COMPLETE | TB COMPLETE | TE COMPLETE
STEMS: 24 VERIFIED / 5 SCORED / 7 EXCLUDED
B4-PRIME: B4a' <PASS/FAIL> | B4b PASS | B4c 6/6 | B4d PASS
CARRIED: A PASS | B1 PASS | B2 PASS | B3 PASS | C1-C3b PASS | D PASS
OUTCOME: <ADOPT_RUNTIME_READING | DEFER | KEEP_EVIDENCE_ONLY>
LANDING: NOT EXECUTED / AWAITING SEPARATE AUTHORIZATION
FENCES: GATE-UNTOUCHED / Q-SUBSTRATE-UNTOUCHED / C-H-NULL / BIPARTITE-PLANNING-EVIDENCE / LLM-CALLS 0 / REPO-WRITES 0
STATUS: COMPLETE
```
