# MVP-2c — Live Bridge Sessions: QA Phase Record

**Status:** Scratch-realm QA record, drafted for planning-side landing — see ledger entry "Governed-loop MVP-2c record — live bridge sessions (QA phase) — 2026-10-20."

## 1. Purpose and scope

Human-ear QA of the governed loop: the CLI proposes, the gate disposes, the
orrery sounds the verdicts (office timbres; vetoes are rests). Two questions:
does the seam license sound coherent, and should boundary records be reachable
(the 501 question)? Walks are A-tier-bounded (displayable anchors only);
disputes are the calibration data Policy-v3 consumes. Post-hoc loop: silent
walk, then headed replay; no real-time coupling.

## 2. Sessions

| Session | Mode | Decisions | Accepts / vetoes | Disputes | Log (sha) | Heard archive (sha) |
|---|---|---|---|---|---|---|
| mac1 | human walk | 8 | 7 / 1 | 1 (501) | `de90eb47…` | `c21c34aa…` (live) |
| mac2 | agent-driven, human listening | 13 | 10 / 3 | 0 | `284eeca4…` | `820a7dc3…` (cadence) |
| mac3 | agent-driven, human listening | 10 | 6 / 4 | 0 | `5be6276d…` | `275920cb…` (cadence) |

Ratification chain: mac1 walked and disputed; mac2 and mac3 walked by the
sitting agent with the maintainer listening; their rests were ratified only
after the cadence fix (fast-speed hearings were perceptual cut transitions and
are not treated as evidence).

## 3. Coverage

- All seven offices heard: Saturn, Sun, Moon, Mars, Venus, Mercury, Jupiter.
- Tier-2A: L1 ×2, R1 ×1 (phases 0↔11 both directions). Tier-2B: bridge
  crossings ×3.
- Boundary probes heard: 501 (mac1, disputed); 239/247/501 (mac2, ratified at
  cadence); 223/251/247/319 (mac3, ratified at cadence).

## 4. Findings

1. **Cadence finding (principal QA result):** at the bridge's default replay
   speed, rests were imperceptible — a veto was an instant cut, not a silence.
   The maintainer's first report ("indistinguishable because the movements
   happen so quickly") is recorded as the finding that produced the fix.
   Live mode gained `ORRERY_BRIDGE_DWELL_MS` (live default 1500 ms; smoke 0);
   smoke behavior re-verified byte-identical to the landed MVP-2b artifact.
2. **Tooling fixes discovered by use:** live mode (headed + real AudioContext;
   the deterministic instrumentation had silenced even headed runs); office
   palettes derived from the frozen census for all seven offices; heading and
   palette assertions use the display anchor's tier (A1 anchors display their
   own identity while voicing the A0 office palette).
3. **Dispute evidence:** aggregate band **sparse** — 8 boundary vetoes across
   four contexts, 1 dispute (501, raised from inside a licensed seam). No
   disputes on Tier-2A or Tier-2B accepts; every seam-licensed accept was
   accepted by ear.

## 5. Aggregate analysis

`dispute_analysis_mvp2c.json`: 31 decisions, 23 accepts, 8 vetoes; reasons all
`ungoverned-transition`; one cluster (`ungoverned-transition | root=2773 |
free`); band `sparse`.

## 6. Stopping rule

Fired on evidence: minimum 3 sessions met; mac2/mac3 added no new dispute
cluster; Tier-2A and Tier-2B each heard ≥2×; all seven offices heard; boundary
rests ratified at cadence except the single mac1 dispute.

## 7. Policy-v3 calibration input

- **Seam coherence:** no seam disputes; the two-tier license is accepted by ear.
- **Boundary reachability:** boundary strictness is largely ratified by ear (8
  rests across four contexts; 7 ratified at cadence, 1 disputed). The 501
  dispute is scoped to a licensed-seam context, so the open question for
  Policy-v3 is narrow: whether boundary records should be reachable *from*
  licensed seams, not whether boundary vetoes are coherent in general.

## 8. Fences and non-claims

Scratch-only until the landing sitting; `gate_log` is not the decision ledger;
disputes are calibration data, never appeals; no canon claims (the 12×7 grid,
Family A/B, office palettes, and the 41 remain candidate/authored structures —
use is not admission); no corpus, no LLM; energy out of scope; session prose
is context, not evidence.

## 9. Artifacts

Gate logs (`gate_log_mvp2_live_mac1/2/3.jsonl`) and heard archives
(`bridge_heard_mac1_live.json`, `bridge_heard_mac2_cadence.json`,
`bridge_heard_mac3_cadence.json`); `dispute_analysis_mvp2c.json`;
`qa_margin_notes.md`; `RUNBOOK_MVP2C.md`; walk drivers (`qa_walk_mac2.py`,
`qa_walk_mac3.py`).
