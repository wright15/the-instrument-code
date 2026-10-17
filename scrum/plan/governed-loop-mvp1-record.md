# MVP-1 — The Governed Loop: Run Summary

| Field | Value |
|---|---|
| Status | Executed in scratch realm; no repository writes |
| Source checkpoint | `482a1bfb` (payload-equivalent to execution commit `a27bd3e`) |
| Initial state | fixed initial state 1387 (A0 anchor, family size 7); the seeded RNG governs proposal generation only; boundary records are proposed and vetoed by the random arm but can never become current. |
| Reference run | `mvp1.py --steps 1000 --proposer mixed-random --seed 42` |
| Result | Veto 49.8%, chain valid, deterministic, family-confined |

## 1. Freeze (Phase 0)

Extracted via `git show 482a1bfb:<path>`; no live-tree reads.

| File | Raw SHA-256 at checkpoint | E-CAL pin | Match |
|---|---|---|---|
| `census_462.json` | `242bce74…` | `88c4accc…` (at `a27bd3e`) | raw-byte false, payload true |
| `network_data.json` | `21e2a632…` | `21e2a632…` | true |
| `census_val.json` | `bebb7afd…` | `ff336d46…` (at `a27bd3e`) | raw-byte false, inventory true |

The closing commit `482a1bfb` rebound `candidateFingerprint` and
`evidenceBindings` (and the gate receipt fingerprints) to the L¹¹ ledger
state. `records[462]` is byte-for-byte identical to the execution commit; the
network artifact is byte-identical. Structural checks passed fail-closed:

- 462 census records; roles 70 anchor / 238 satellite / 154 boundary.
- 238 GOVERNS edges, one per satellite, 63 distinct sources.
- 70 families: 7 singletons (the seven D7 anchors, self-rooted) + 63 rooted;
  family sizes `{1:7, 3:21, 5:28, 7:14}`; Σ = 308.
- Anchor office rule 70/70; satellite inheritance 238/238.
- 10 orbits, 308-member union = the office-supported domain; every orbit mean
  exactly 36.
- Every one of the 462 anchored masks contains pitch class 0 exactly once
  (the wrap-count premise for the phase-11 result).

Artifacts: `frozen_ground_truth.json`, `freeze_report.json`.

## 2. Pre-registration — corrected

The plan's band (`49.1% ± 1.0%`, research-agent C3) assumed both draws uniform
over the 308 office-supported states. The implemented proposer's uniform arm
draws over all 462 census states, and the gate only accepts same-family
transitions, so the current state never leaves its initial family.

Exact expectation for the reference run (initial state 1387, family size 7):

P(same family | uniform arm) = 7/462
E[veto] = 0.5 * (1 - 7/462) = 0.492424…  (49.24%)

At n = 1000 the standard error is ~1.58 pp, so the ±1.0 pp plan band is only
~0.63σ — underpowered as a pass/fail gate. The valid test is the z-score
against the exact expectation; the plan band is retained as a coarse sanity
check. A 10,000-step confirmation run was added (SE ~0.5 pp).

## 3. Reference run (1,000 steps, seed 42)

| Metric | Value |
|---|---|
| Accepts / vetoes | 502 / 498 |
| Veto rate | **49.8%** (exact expectation 49.24%; z = 0.35) |
| 95% CI (normal approx.) | 46.1% – 52.3% |
| Reason histogram | `ungoverned-transition`: 498 (100%) |
| Arm counts | in-family 496 / uniform 504 |
| Arm accepts | in-family 496 / uniform 6 |
| Self-transitions | 69 (all accepts, logged) |
| Boundary candidates | 174 (all vetoed, `boundary_endpoint=true`) |
| Distinct states visited | 7 (the initial family) |
| Visited offices | 1/7 (Saturn) |
| Family-confined | true |
| Chain verification | PASS (1,000 lines, 0 errors) |
| `gate_log.jsonl` SHA-256 | `275b56ed…` |

Determinism: a second run with the same seed produced a byte-identical gate
log (`cmp` clean, same SHA-256). Tamper test: editing line 11 caused
verification to fail at line 12 (`prev_hash mismatch`, exit 1).

### 10,000-step confirmation

| Metric | Value |
|---|---|
| Veto rate | **49.41%** (z = 0.335) |
| 95% CI | 48.26% – 50.22% |
| Reasons | `ungoverned-transition`: 4,941 (100%) |
| Boundary candidates | 1,680 (all vetoed) |
| Distinct states / offices | 7 / 1 (Saturn) |
| Chain verification | PASS (10,000 lines) |
| `gate_log_10k.jsonl` SHA-256 | `77332c94…` |

## 4. Degenerate-proposer checks

| Proposer | Result |
|---|---|
| Constant 1387 from 1387 | 100 accepts, 100 self-transitions, chain PASS |
| Constant 1451 from 1387 | 100 vetoes, all `ungoverned-transition` (anchor of a different family) |
| Constant 501 (boundary) from 1387 | 100 vetoes, all `ungoverned-transition`, 100 `boundary_endpoint=true` |

## 5. Findings

1. **The gate has teeth.** Veto rate matches the exact combinatorial
   expectation, every veto carries an explicit reason, and the chain is
   tamper-evident.
2. **v0 is a single-family straitjacket.** Because the only accepted rule is
   `same governing root`, the loop can never leave the initial family. The
   accepted path visits 7 states and exactly one office (Saturn). This is the
   intended v0 policy, but it means v0 answers the mechanism question and says
   nothing about inter-family motion. The two-tier license designed in
   Spike-01 is required before MVP-2 can explore the topology.
3. **Boundary candidates are members, not family members.** All 154 boundary
   records pass the membership check and are vetoed as
   `ungoverned-transition` with `boundary_endpoint=true` (explicit V0-P3
   policy). The reason histogram stays 100% single-reason as pre-registered.
4. **Self-transitions are accepted and isolated.** 69/496 in-family proposals
   were the current state itself (~1/7 of family draws), logged separately.

## 6. Artifacts

- `freeze.py`, `frozen_ground_truth.json`, `freeze_report.json`
- `mvp1.py`, `gate_log.jsonl`, `run_report.json`
- `gate_log_run2.jsonl` (determinism), `gate_log_10k.jsonl`, `run_report_10k.json`
- `degenerate_*_report.json`, `gate_log_tampered.jsonl` (negative control)
- `spike01.py`, `spike01_evidence.json`, `spike-01-phase-policy.md`

## 7. Fences observed

No writes to `integrated-release`; no ledger/board/canonical writes; v0 policy
labelled a policy choice; no energy measurement (integer checks counted only);
no corpus; no LLM; `gate_log.jsonl` is not a decision ledger.
