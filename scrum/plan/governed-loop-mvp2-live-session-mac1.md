# MVP-2a — Live session Mac-1: first human proposer

**Status:** Scratch-realm session record, landed planning-side — see ledger entry "Governed-loop MVP-2a record — 2026-10-18."

## 1. Trajectory (8 decisions, chain-verified)

| seq | move | rule |
|---|---|---|
| 0–2 | 1387→875→1395→1387 @0 | Tier 1 ×3 (Saturn wander) |
| 3 | 1387@0 → 2773@11 | Tier 2A, FamilyA:L1 — resolves to the single admitted L1 row from 1387 |
| 4 | 2773@11 → 2771@11 | Tier 1 |
| 5 | 2771@11 → 501 | veto ungoverned-transition, disputed |
| 6 | 2771@11 → 2777@11 | Tier 1 (state correctly held after the veto) |
| 7 | 2777@11 → 2741@11 | Tier 2B, FamilyB:bridge — resolves to derived pair 7-35:0 ↔ 7-32:4 (1 shared subnode) |

Ledger `gate_log_mvp2_live_mac1.jsonl`: 8 lines, chain verified; gate-log SHA-256 `de90eb47…`; final state `2741@11`. Offices traversed: Saturn → Sun → Moon (all A0). Two malformed free-entry inputs were rejected with usage text and logged nothing (zero phantom lines).

## 2. Run report (verbatim; hashes truncated per the zero-long-hex landing convention)

```json
{
  "accepts": 7,
  "chain": {
    "errors": [],
    "finalHash": "3f9cb7c8…",
    "lines": 8,
    "ok": true
  },
  "citations": {
    "FamilyA:L1": 1,
    "FamilyB:bridge": 1
  },
  "disputes": 1,
  "finalState": [
    2741,
    11
  ],
  "gateLog": "gate_log_mvp2_live_mac1.jsonl",
  "gateLogSha256": "de90eb47…",
  "reasons": {
    "ungoverned-transition": 1
  },
  "vetoes": 1
}
```

## 3. Dispute analysis (verbatim)

```json
{
  "accepts": 7,
  "band": "sparse",
  "clusters": {
    "ungoverned-transition | root=2773 | free": 1
  },
  "disputeLines": [
    {
      "candidate": [
        501,
        11
      ],
      "choice": "free:501:11",
      "reason": "ungoverned-transition",
      "seq": 5
    }
  ],
  "disputeRateOfVetoes": 1.0,
  "disputes": 1,
  "files": [
    "gate_log_mvp2_live_mac1.jsonl"
  ],
  "refinementTargets": [],
  "totalLines": 8,
  "vetoReasons": {
    "ungoverned-transition": 1
  },
  "vetoes": 1
}
```

## 4. Band classification (sparse)

> Single dispute targets the boundary veto on 501 (office None) — i.e. the unchanged V0-P3 rule, not the seam license. Band: sparse (1 dispute; the minimum-count gate correctly refuses a "global" reading of a 1/1 rate). No refinement targets named. Interpretation: nothing in this session argues against Tier 2; the one friction point questions boundary strictness — a candidate input for policy-v3, recorded without disposition.
