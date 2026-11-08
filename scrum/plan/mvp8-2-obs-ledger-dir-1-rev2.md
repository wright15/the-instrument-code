# DIRECTIVE MVP8.2-OBS-LEDGER-DIR-1 (rev 2) — T0-Locked with R1–R10 Riders

- **Title:** Formal Ledger Specification (`L1–L5`) + Node Observatory Instrument (Voicings, Dyads, Score-True MIDI, Presets 1–3)
- **Directive ID:** `MVP8.2-OBS-LEDGER-DIR-1` rev 2 (rev 1 + T0 Lock Pack R1–R10, adjudicated 2026-11-08)
- **Authority:** Planning Seat (Erick)
- **Status:** EXECUTING IN SCRATCH. Zero repository writes until a separate `L29` landing authorization.
- **Execution Realm:** `/home/erick/workspace/scratch-governed-loop-run/mvp8_2_observatory_ledger/`
- **Placement:** this directive lives in the scratch realm for execution. It lands in `scrum/plan/` only as part of `L29` packaging, never before T0.
- **Granularity:** any landing = `L29`, single commit, audio excluded per L4. No tag, no push.

## §0. Decisions D1–D5 (with riders locked)

| ID | Locked rule |
|---|---|
| **D1 — Fallback (R1)** | Dual policy. **Corrected expected sets on `2677@0` strict study:** SKIP `bare, triad, triad_9, seventh` with `missingPc:[7]`; RENDER `full, shell, ninth_drop5, rootless_13th`. Narrative stands: 9th-drop-5 / rootless-13th pass because they omit the fifth. |
| **D2 — MIDI/Bass** | Track 1 = voiced pad + inversion-following bass only (`padVoicedMatch==true`); container mask retained in audit fields. Bass = lowest voiced pc at `pitch_class_to_midi(bass,offset)-12` in WAV and MIDI. |
| **D3 — Lead (R3)** | Six modes: `off, naked_q, governed, governed_dyads_downbeat, governed_dyads_structural, governed_dyads_alternating`. Named predicates: structural = `sub==0 OR orbitIndex in {0,2,4}`; downbeat = `sub==0`; alternating = `sub%2==0`. Counts are reported, not targeted. |
| **D4 — Presets** | P1 `2677@0` → P2 major triangle → P3 `2363@0→2365@0`, all three. |
| **D5 — Posture** | Ledger memo PROPOSED (`admissionEffect:none_until_entered`); observatory scratch-only; `mvp2.py` / `quintessence.py` / `audio.ts` / landed `mvp5..mvp8_1b` untouched. |

- **R2 restructure (D2 bet):** primary bet `rubs(P2b) < rubs(P2c)` (identical single-note lead; cycle voicings vs full container pad). P2a rubs reported separately over primary + partner notes; no inequality bet.
- **R4 shell rule:** shell affords iff a 3rd in `{3,4}` is in Δ and (`10` in Δ or `11` in Δ). Interval reading is the only reading in rev 1.
- **R5:** membership is the T0.2 claim; distances are read from `strong_core` BFS `outDist/inDist` seeded at `1387@0`. No degree parentheticals.
- **R6:** the B3 12-mask sample is enumerated in the predeclaration.
- **R7 voice_led:** bar 1 inversion 0; each subsequent bar picks `inv in {0,1,2,3}` minimizing the voice-motion cost against the previous bar's sorted chord MIDI notes; tie-break smallest `inv`. Cost for unequal lengths = `12*abs(len1-len2) + sum(abs over min length)`.
- **R8:** §5 strings are measured slots filled from receipts at closing; a failed bet prints measured values and the sprint DEFERs on that line.
- **R9:** `mvp5_audio_renderer.py` hash is pinned in the predeclaration.
- **R10:** A1 reconstructs each historical ledger state via `git show <commit>:provenance/DECISION_LEDGER.md`; scope = every commit in git history that touched the ledger, enumerated by hash; cross-checked against before/after SHA-256 and byte lengths in `qa/` landing receipts.

## §1. Fixed point L28

- HEAD `6bde6a267fe3256d6f5ca52938b00b1d4b38a623`, tree clean.
- `provenance/DECISION_LEDGER.md` `f1446e81…` 417,658 B / 4,436 lines.
- `provenance/OBSERVATION_LEDGER.md` `8e0be9f5…` 33,153 B / 561 lines.
- `MANIFEST.json` `6e56d327…` 1,894 files / 299,622,436 B.
- `CHECKSUMS.sha256` `a116900c…` 225,338 B.
- `qa/completion-validation-report.json` `6b8cbf29…` 418/0 PASS.
- `qa/mvp8_1b_landing_receipt.json` `ebea2cf3…`.
- `docs/ARCHITECTURE_MAP.md` `865ab785…` 34,880 B.
- Strong core seeded `1387@0`: 3,204 reachable / 2,928 S000 / 2,388 governed / 540 boundary / 276 one-way.

Pinned inputs: `mvp8_common.py 6027380c…`; lookup `7d4b0548…`; Q-engine `e9ec9804…`; `mvp8_task_c.py 8ff0630a…`; `mvp5_audio_renderer.py 0c917aab…` (24,696 B); `mvp6_2_legato_renderer.py e91c6e74…`; `mvp6_3_fade_renderer.py 673ac708…`; `mvp7_log_spectral_lens.py 6d3b971a…`.

Preset premises: P3 hop `2363@0→2365@0` is planner-adjacent, `kind:tier-1`, `ACCEPT`, shared subnode `5-32:11`. P2 core = exact four-way intersection `2741∩1717∩2773∩2485 = {0,2,4,7}`; P2 legs traverse `2485@0` (satellite, zero `5-35`), all hops `ACCEPT`.

## §2. Guard block (every artifact)

```json
{"layer":"SPEC-001 §1.3 overlay dynamics + governance ledger specification","causationClaim":false,"physicalQuantityClaim":false,"tierClassifier":false,"globalCHNull":true,"gov517_correspondence_claimed":false,"still_set_label":"still_set","bipartiteEvidenceStatus":"planning_evidence","bipartiteAdmissionEffect":"none","bipartiteGraphScope":"detached_audit_only","ledgerDefinitionStatus":"proposed","observatoryArtifactClass":"observation_only","llmCalls":0}
```

## §3. Tasks and bets

### Task 0 — pins, reachability, predeclaration lock
Verify §1 pins, 11 `mvp2.py` anchors, strong core, membership of all preset/census nodes in governed S000 (`substitutionsRequired == 0`), the A2 premise (5/5 artifacts carry `decisionLedgerSha256 = f1446e81…`), B3 census reproduction, and the preset premises. Lock `task-0/mvp8_2_predeclared_bets.json` before Tasks A–D execute. Initialize the ear scorecard `PENDING_HUMAN`.

### Task A — ledger specification and audit (R10)
Emit `task-a/PROPOSED_SPEC_THE_LEDGER_V0_1_0.md` (witnesses; L1–L5; fivefold placement as correspondence; epistemic status table).
- **A1:** pairwise byte-prefix identity along every git commit state of the ledger, cross-checked against `qa/` receipts.
- **A2:** recompute the L28 triple; verify the 5 cascade artifacts bind to the current ledger.
- **A3:** regenerate a representative sample of excluded audio directly from landed traces with the pinned renderer; 100% SHA-256 identity against `qa/` receipts (4 mix artifacts + 1 stem pair).

### Task B — voicing catalog, dyad layer, affordance census
Catalog `full, bare, shell, triad, triad_9, seventh, ninth_drop5, rootless_13th, cycle` with the locked strict rules; inversions 0–3 plus `voice_led` (R7); six lead modes (R3); dyad partner = skip-one in the ordered focal pentatonic, else minimal consonant in F; hard invariant both pcs in container and `p2 != p1`.
- **B1:** legality sweep over the 16 enumerated masks × 8 treatments × 4 inversions × 6 lead modes: `outOfMaskPadNotes==0`, `outOfMaskLeadNotes==0`, `dyadUnisonLeaks==0`.
- **B2:** measured on every rendered session: MIDI Track 1 == voiced WAV pad (+bass); Track 2 count == singles + 2×dyads.
- **B3:** A0 Moon census: shell 7/7; triad/bare 5/7 failing only `2677, 2869` with `missingPc:[7]`.

### Task C — `observe()` and session sheet
`observe(nodes, voicing, inversion, lead, bars, focal_set, mode, out_dir)`; node resolver (`mask@phase`, mode names, families); auto-transit via connector BFS between dwell pillars; one-page session sheet per session.

### Task D — presets
- **P1 (`2677@0`, study, 8 treatments × 2 bars):** Bet D1 = the R1 split with `[7]` skips and 0 out-of-mask on renders.
- **P2 (triangle `2741→1717→2773→2741` via `2485@0`, 7 bars, focal `5-35:0`):** P2a cycle+voice_led+structural dyads, P2b cycle+single, P2c full+single. Bet D2 = `rubs(P2b) < rubs(P2c)`; P2a reported; 0 dwell focal switches; all hops ACCEPT.
- **P3 (`2363@0→2365@0`, 3 bars, focal `5-32:11`):** governed vs naked. Bet D3 = ≥8 of 24 destination steps differ; 0 focal switches; 0 out-of-mask.

### Task E — closing
Verify all bets against the predeclaration; emit the ear manifest (`PENDING_HUMAN`), the closing report with measured §5 slots, and a guarded `mvp8_2_land.py` that refuses any write without `--authorize-l29`.

## §4. Stop rules
S-1 fixed-point drift; S-2 pin/gate drift; S-3 ledger A1/A3 mismatch; S-4 mask/dyad/MIDI-leak; S-5 float/LLM/repo-write/ear-verdict violation.

## §5. Verdict template (measured slots, R8)
```text
MVP8.2-OBS-LEDGER-SPRINT-CLOSING
FIXED-POINT: 6bde6a26... / TREE CLEAN / L28 f1446e81... / 417658 B / 4436 lines
TASKS: T0 COMPLETE | TA COMPLETE | TB COMPLETE | TC COMPLETE | TD COMPLETE | TE COMPLETE
LEDGER-AUDIT: A1 <PASS/FAIL> | A2 <PASS/FAIL> | A3 <PASS/FAIL> | SPEC-MEMO PROPOSED
OBSERVATORY: B1 <PASS/FAIL> | B2 <PASS/FAIL> | B3 <PASS/FAIL + measured>
PRESETS: D1 <PASS/FAIL + measured> | D2 <PASS/FAIL P2b vs P2c + P2a reported> | D3 <PASS/FAIL + measured>
EAR-GATE: PENDING_HUMAN
FENCES: GATE-UNTOUCHED / Q-SUBSTRATE-UNTOUCHED / C-H-NULL / LLM-CALLS 0 / REPO-WRITES 0
STATUS: <COMPLETE | DEFER>
```
