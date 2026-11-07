# DIRECTIVE MVP8.1-DIR-1 (rev 1) — B4′ Stem-Isolated Acoustic Recalibration

- **Title:** Stem-Isolated Lead Measurement and Directional Register Diagnostic
- **Directive ID:** `MVP8.1-DIR-1` (rev 1; narrow recalibration of `MVP8-DIR-1` rev 2 Bet B4)
- **Authority:** Planning Seat (Erick), locked 2026-11-07
- **Status:** AUTHORIZED FOR SCRATCH EXECUTION (Tasks 0–E). Repository remains read-only; no `L28` landing without separate authorization.
- **Execution Realm:** `/home/erick/workspace/scratch-governed-loop-run/mvp8_1_stem/`
- **Granularity Rule:** Any repository landing under this directive is **`L28`**, a single dedicated commit. No tag, no push.

---

## §0. Scope and Carry-Forward

`MVP8-DIR-1` rev 2 completed with `DEFER`: B1/B2/B3, C1/C2/C3a/C3b and Task D integrity passed; **B4 failed** because the log-spectral lens on the full mix reported governed Far Shore lead `0.200836` < container `0.673879`, and the ungoverned control also failed (`0.330663` < `0.719081`). The ear manifest was signed by the Planning Seat (`SIGNED_HUMAN`, 2026-11-07) with the null-contrast caveat that D1 and D3 are byte-identical.

This directive changes **measurement only**. It does not change the engine, the lookup table, the connector planner, the Q1–Q5 locks, the corrected B2/C3a/C3b definitions, or the meter/duration law (still deferred to MVP-9). It uses the existing 12 traces and renders stems from them.

### §0.1 Adjudicated Decisions (carried)

| Question | Locked Decision |
|---|---|
| Q1 | `MVP8.1-DIR-1`; meter law deferred to MVP-9. |
| Q2 | Borrowed connector on transit; native class on zero-5-35 dwell; naked arm as labelled contrast. |
| Q3 | Phase-root, traversal-head, canonical-index total order. |
| Q4 | Initiation + structural-window snap; tail modal color permitted. |
| Q5 | Bipartite inputs remain `planning_evidence`; no admission; no `SPEC-001` amendment unless Task E selects `ADOPT_RUNTIME_READING`. |

---

## §1. Fixed Point and Inputs

### §1.1 Opening Fixed Point (`L27`)
- HEAD `d1b2286a5b6f3783af24094eb78e40ab511bb8e5`; decision ledger `da9c79410cf2f3429509ca07f4a82effe49932d061ca96a4d36d28a401668149` (`407,293 B` / `4,383 lines`); manifest `6632ab6a…` (`1,834 files` / `263,181,122 B`); release closure `418/0`.
- Declared working-tree exception: `scrum/plan/mvp8-dir-1-rev2.md` and `scrum/plan/mvp8-1-dir-1-rev1.md` are the only untracked paths; no pinned or tracked byte changed.

### §1.2 MVP8 Evidence Pins (hashed at Task 0)
- `task-0/mvp8_task_0_receipt.json`, `task-0/mvp8_predeclared_bets.json`
- `task-a/mvp8_task_a_receipt.json`, `task-a/mvp8_pentatonic_lookup_v1.json`
- `task-b/mvp8_task_b_receipt.json`, `task-b/mvp8_pentatonic_q_engine.py`
- `task-c/mvp8_task_c_receipt.json`
- `task-d/mvp8_task_d_receipt.json`, `task-d/mvp8_ear_manifest.json` (signed)
- `task-e/mvp8_task_e_receipt.json`, `task-e/MVP8-PENTATONIC-Q-CLOSING-REPORT.md`
- The 12 trace JSONLs under `task-b/traces/`, `task-c/traces/`, `task-d/traces/`.

### §1.3 Ear Gate
`task-d/mvp8_ear_manifest.json` reports `status: SIGNED_HUMAN`, `signedBy: Erick`. The `q9Question` field retains the framework placeholder; the signed Q9 verdict is the human entry. No agent may amend the signed verdict.

---

## §2. Guard Block (every artifact)

```json
{
  "layer": "SPEC-001 §1.3 overlay dynamics",
  "causationClaim": false,
  "physicalQuantityClaim": false,
  "tierClassifier": false,
  "globalCHNull": true,
  "gov517_correspondence_claimed": false,
  "still_set_label": "still_set",
  "bipartiteEvidenceStatus": "planning_evidence",
  "bipartiteAdmissionEffect": "none",
  "bipartiteGraphScope": "detached_audit_only",
  "llmCalls": 0
}
```

---

## §3. Tasks and Predeclared Bets

### Task 0 — Fixed point, evidence pins, ear gate, predeclaration lock (`task-0/mvp8_1_task_0.py`)
- Verify L27 fixed point, 28/28 pins, 11/11 `mvp2.py` anchors, strong core `3,204/2,928/276/2,388/540`.
- Verify all MVP8 evidence pins from §1.2.
- Verify `mvp8_ear_manifest.json` is `SIGNED_HUMAN`; record the signed verdict verbatim. **S-7:** if unsigned, halt before Task A (not selected here).
- Lock `task-0/mvp8_1_predeclared_bets.json` with:
  - **B4′a (hard, stem sanity):** for each of the 12 lead stems, office-deconfounded correlation between lead-stem log-centroid and lead pcSum is `>= 0.90`.
  - **B4′b (hard, primary):** Far Shore governed lead stem has `r_lead - r_container > 0` **and** the margin is `>=` the ungoverned-control margin. The ungoverned margin is reported; it is expected to be positive for a stem.
  - **B4′c (diagnostic, report-only):** across adjacent sections of the full mix, the sign of `Δ log-centroid` matches the sign of `Δ office registerOffset`; recorded, never used to force DEFER.
  - **B4′d (hard, stem integrity):** all stems are mono 16-bit 44.1 kHz, two-pass deterministic, 0 clipped, 0 non-finite.
  - Carried bets A1–A3, B1–B3, C1–C2, C3a–C3b, Task D integrity remain PASS from the MVP8 receipts; B1/B2/B3 are symbolically re-run for chain continuity.

### Task A — Stem rendering (`task-a/mvp8_1_stems.py`)
- Use the frozen `mvp6_3_fade_renderer.render_stems` on the existing 12 traces; write `<label>-lead.wav` and `<label>-pad.wav` under `task-a/stems/`.
- No new traces, no engine changes, no new probes. The D1==D3 null contrast is recorded, not re-litigated.
- Verify format, determinism, hashes, and `exempt_bars = {barCount}` per trace.
- Output `task-a/mvp8_1_task_a_receipt.json`.

### Task B — B4′ measurement (`task-b/mvp8_1_bets.py`)
- Run the frozen `mvp7_log_spectral_lens` on lead stems and pad stems.
- **B4′a:** 12-stem self-tracking table; pass iff every stem `>= 0.90`.
- **B4′b:** Far Shore governed vs ungoverned lead-stem `r_lead`, `r_container`, margins; pass per the locked rule.
- **B4′c:** full-mix section-boundary directional agreement; report-only.
- Re-run B1 (1,064,448 evaluations), B2, B3 symbolically; compare to the MVP8 receipt.
- Output `task-b/mvp8_1_task_b_receipt.json` (acoustic floats only under `acoustic`).

### Task E — Adjudication and landing preparation (`task-e/mvp8_1_task_e.py`)
- Carried PASS checks + B4′a/b/d:
  - all pass and ear signed → **`ADOPT_RUNTIME_READING`**; propose the `SPEC-001` §1.3 amendment and prepare `L28` (landing itself remains a separate authorization).
  - all pass and ear unsigned → **`CONDITIONAL_ADOPT_RUNTIME_READING_PENDING_EAR`**.
  - B4′a/b/d fail → **`DEFER`**, naming the failing check and the measured values.
  - B1/B3 re-verification fail → **`KEEP_EVIDENCE_ONLY`**.
- Output the closing report and a guarded `task-e/mvp8_1_land.py` that refuses to execute unless `--authorize-l28` and the outcome is `ADOPT_RUNTIME_READING`.

---

## §4. Stop Rules

- **S-1:** fixed-point or pin drift; unexpected working-tree path.
- **S-2:** MVP8 evidence pin mismatch.
- **S-3:** `mvp2.py` anchor or `src/fivefold/quintessence.py` byte drift.
- **S-4:** strong-core count drift.
- **S-5:** stem format/determinism failure (B4′d).
- **S-6:** any float in a symbolic receipt field; any LLM call; any repository write during scratch execution; any agent-authored ear verdict.
- **S-7:** ear manifest unsigned before Task A (not selected; signed).

---

## §5. Terminal Verdict Format

```text
MVP8.1-STEM-CALIBRATION-CLOSING
FIXED-POINT: d1b2286... / L27 da9c7941... / 407293 B / 4383 lines
EVIDENCE-PINS: <n>/<n> MATCH / EAR-GATE SIGNED_HUMAN
TASKS: T0 COMPLETE | TA COMPLETE | TB COMPLETE | TE COMPLETE
STEMS: 12 LEAD / 12 PAD / FORMAT PASS / DETERMINISTIC PASS
B4-PRIME: B4a <PASS/FAIL> | B4b <PASS/FAIL> (GOVERNED MARGIN <x> VS UNGOVERNED <y>) | B4c <diagnostic> | B4d <PASS/FAIL>
CARRIED: A PASS | B1 PASS | B2 PASS | B3 PASS | C1-C3b PASS | D PASS
OUTCOME: <ADOPT_RUNTIME_READING | CONDITIONAL_ADOPT_RUNTIME_READING_PENDING_EAR | DEFER | KEEP_EVIDENCE_ONLY>
FENCES: GATE-UNTOUCHED / Q-SUBSTRATE-UNTOUCHED / C-H-NULL / BIPARTITE-PLANNING-EVIDENCE / LLM-CALLS 0 / REPO-WRITES 0
STATUS: COMPLETE
```
