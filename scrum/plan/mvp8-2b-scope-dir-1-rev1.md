# DIRECTIVE MVP8.2b-SCOPE-DIR-1 (rev 1) — A1 Scope Correction and L29 Preparation

- **Title:** Narrow the A1 prefix-closure scope to the formal L-numbered landing chain and adjudicate MVP8.2 on the corrected scope
- **Directive ID:** `MVP8.2b-SCOPE-DIR-1` (rev 1; narrow scope correction of `MVP8.2-OBS-LEDGER-DIR-1` rev 2 Bet A1)
- **Authority:** Planning Seat (Erick), locked 2026-11-08
- **Status:** AUTHORIZED FOR SCRATCH EXECUTION (Tasks 0, A, E). Repository remains read-only; `L29` landing is a separate authorization and is not executed here.
- **Execution Realm:** `/home/erick/workspace/scratch-governed-loop-run/mvp8_2b_scope_fix/`
- **Frozen evidence realm (read-only):** `/home/erick/workspace/scratch-governed-loop-run/mvp8_2_observatory_ledger/`
- **Granularity Rule:** any repository landing is **`L29`**, one dedicated commit. No tag, no push.

---

## §0. Scope and pre-execution correction

`MVP8.2-OBS-LEDGER-DIR-1` rev 2 concluded `DEFER`: A1 failed under its locked
scope — every commit in git history that touched `provenance/DECISION_LEDGER.md`
— because the pre-era ledger inserted entries mid-file (2026-08 closure passes
and the GOV-518 regeneration). The clean append-only era begins at commit
`9a0764b6` (2026-09-09); from there through L28 all landing pairs are
byte-prefix clean.

This directive changes **one audit scope only** and records it as a new-sprint
pre-execution correction; the MVP8.2 result is retained as historical evidence
and is not retroactively amended.

| Field | MVP8.2 (locked) | MVP8.2b (pre-execution correction) |
|---|---|---|
| A1 audit scope | every git commit that touched the ledger | the enumerated formal landing chain `23c15407` (L12 base) + the 13 ledger-touching landing commits through `7117d24` (L28) |
| Method | pairwise byte-prefix + receipt cross-check | unchanged |
| Threshold | 0 violations | 0 violations (unchanged) |
| MVP8.2 finding | A1 FAIL (15 pre-era violations) | retained verbatim as historical evidence |

The memo is not edited. Its own demonstration claim is already scoped to
L12–L28 and holds. No epoch-boundary language is added.

---

## §1. Fixed point and carried evidence

- **Fixed point:** HEAD `6bde6a267fe3256d6f5ca52938b00b1d4b38a623`, tree clean;
  ledger `f1446e81…` (417,658 B / 4,436 lines); manifest `6e56d327…`
  (1,894 files / 299,622,436 B); checksums `a116900c…`; completion
  `6b8cbf29…` 418/0; landing receipt `ebea2cf3…`; architecture map `865ab785…`.
- **Pinned inputs (8/8):** `mvp8_common.py`, the pentatonic lookup, the Q
  engine, `mvp8_task_c.py`, `mvp5_audio_renderer.py`, the MVP-6.2 legato
  renderer, the MVP-6.3 fade renderer, the MVP-7 lens.
- **Carried bets (hash-verified PASS from the frozen MVP8.2 receipts):**
  A2, A3, B1, B2, B3, D1, D2, D3. No re-render, no engine change, no new traces.
- **Frozen MVP8.2 artifacts:** Task 0/A/B/D/E receipts, closing report,
  ear manifest, ledger memo, predeclaration.
- **Ear gate:** signed by the Planning Seat before Task E. The verdict is
  recorded verbatim; the agent authors nothing.

---

## §2. Tasks

### Task 0 — fixed point, pins, carries, A1 scope lock
Re-verify the fixed point, the 8 pinned inputs, the 11 `mvp2.py` anchors, the
strong core (3,204 / 2,928 / 276 / 2,388 / 540), the frozen MVP8.2 artifact
hashes, and the carried bet booleans. Enumerate the formal landing chain from
git (`23c15407` plus `git log --reverse 23c15407..7117d24 -- provenance/DECISION_LEDGER.md`)
and lock the resolved full hashes in `task-0/mvp8_2b_predeclared_bets.json`
before Task A executes. Record the signed ear verdict verbatim in
`task-0/mvp8_2b_ear_scorecard.json` and `task-0/mvp8_2b_ear_manifest.json`.

### Task A — A1 re-audit on the corrected scope
Reconstruct each of the 14 enumerated ledger states via
`git show <commit>:provenance/DECISION_LEDGER.md`; verify pairwise byte-prefix
identity; verify the base state is `23c15407` and the head state is `f1446e81…`
(417,658 B); cross-check the `qa/` before/after pairs whose endpoints resolve
inside the chain; verify the receipt chain links; verify the git-derived commit
list equals the locked list. Output `task-a/mvp8_2b_task_a_receipt.json`.

### Task E — adjudication and L29 preparation
Verify Tasks 0/A, the carried bets, the fixed point, and the ear gate:
- all pass and ear `SIGNED_HUMAN` → **`ADOPT`** (A1 corrected scope PASS).
- any carried bet or A1 fails → **`DEFER`**, naming measured values.
- ear unsigned → **`ADOPT_PENDING_EAR`**, landing blocked.

Emit the closing report with measured §5 slots and a guarded
`task-e/mvp8_2b_land.py` (refuses without `--authorize-l29`; refuses unless the
outcome is `ADOPT`; performs no repository write — it prints the landing plan
only).

---

## §3. Stop rules

- **S-1** fixed-point, pin, anchor, or strong-core drift.
- **S-2** frozen MVP8.2 artifact hash mismatch.
- **S-3** A1 chain drift, prefix violation, or receipt-chain violation.
- **S-4** symbolic float in a symbolic receipt, LLM call, repository write, or
  agent-authored ear verdict.

---

## §4. Verdict template (measured slots)

```text
MVP8.2b-SCOPE-CLOSING
FIXED-POINT: 6bde6a26... / TREE CLEAN / L28 f1446e81... / 417658 B / 4436 lines
A1-SCOPE: 14 LANDING STATES (23c15407 base -> 7117d24 head) / METHOD PAIRWISE BYTE PREFIX + RECEIPT CROSS-CHECK
A1: <PASS/FAIL + measured>
CARRIED: A2 <PASS> | A3 <PASS> | B1 <PASS> | B2 <PASS> | B3 <PASS> | D1 <PASS> | D2 <PASS> | D3 <PASS>
EAR-GATE: <SIGNED_HUMAN | PENDING_HUMAN>
LANDING: NOT EXECUTED / AWAITING SEPARATE L29 AUTHORIZATION
FENCES: GATE-UNTOUCHED / Q-SUBSTRATE-UNTOUCHED / C-H-NULL / LLM-CALLS 0 / REPO-WRITES 0
STATUS: <ADOPT | DEFER | ADOPT_PENDING_EAR>
```
