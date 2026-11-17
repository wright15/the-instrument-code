# DIRECTIVE MVP8.7-KERNEL-MELODY-DIR-1 (rev 1 — ENDORSED)

**Status: ENDORSED.** Drafted by Muse at Erick's direction and endorsed by the
Planning Seat (Erick), 2026-11-16. All decisions D1–D8 (§9), predeclared bet
bars K1–K5 (§5), and ear-gate arms (i)–(iii) (§5) are confirmed and locked.
The designation `MVP8.7` is adopted.

**Base:** L35 `d724de62c1675cb0062f199f0bf80d6fb823a047` / ledger
`70a14ff39640127ca1306be86f37dd6e89d23db8bf4116354dd6d9537fd5e7ba` /
MANIFEST 2,071 files / 304,062,543 B. Fetch/pull and verify these pins
at T0 before any other work.

## §1 Designation and granularity

MVP8.7 (Kernel-Only Melody — Strict Focal Snap). Single-commit branch
landing off L35, preserving the 1-to-1 granularity rule: one sprint,
one landing commit. The sprint changes ONE conditional in the landed
Q engine and lands the tests, sweeps, receipts, and ear package that
prove it. No other behavioral change rides this landing.

## §2 The change (exact)

**File:** `tools/governed-loop/mvp8/task-b/mvp8_pentatonic_q_engine.py`,
method `PentatonicEngine.project()`.

**Current behavior (L35, verified by reading the landed code):** on
orbit steps with a resolved focal set, an emission outside the focal
set is snapped to the focal set ONLY when `0 <= orbit_index <= 4`
(the structural window). Emissions at orbit indices 5–11 pass through
unchanged under governance action `modal_color_pass`. The Q row is a
12-station fifth-stack cycle; the pentatonic 5-35 is its first five
stations, and the tail is the same cycle continuing past the window.

**The change:** widen the snap condition from

```python
elif orbit_index is not None and 0 <= orbit_index <= 4:
```

to

```python
elif orbit_index is not None:
```

so every non-focal orbit emission is snapped to the focal set via the
landed `_snap_pc`. Under the MVP8.7 engine, the `modal_color_pass`
branch must produce zero occurrences (bet K5). Whether the
now-unreachable `else` stays as dead code or is removed is the
implementer's call; the diff must touch only this conditional (plus
tests, receipts, and docs).

**Untouched, by fence (§6):** the snap function `_snap_pc` itself
(forward in station order, tie-break low — byte-identical
before/after); the Q row (`q_table`, `quintessence`, `nextQ`,
`orbitIndex`, `fifthStackPc`, `moduleEmittedPc`, the degree-modulo-7
fallback); focal resolution (`resolve_focal`, the lookup); the
initiation branches; the still-set branch (`still_set_hold_focal` /
`still_set_hold_nonfocal`, kept strictly observational per D4); the
dyad partner rule; the pad/bass/chord rendering; the card, F-term, and
P-term; the gate, the census, the encoder, and the planner. The melody
(lead) emissions are the only thing that changes, and only at tail
positions.

**Principle (Erick's decision, §9 D1–D2):** the melody selects ONLY
from the node's focal 5-set (the mode-invariant kernel); the harmony
(pads/chords) provides the modal-color notes. The snap direction is
forward because it is the landed rule — widening the window changes
no snap machinery. The direction choice is reversible in one function.

## §3 Background and evidence (scratch, outside the repo)

1. **Arm B finding (2026-11-15).** The MVP8.6 Task D plagal render on
   2741@0 emits `[0,7,2,9,4,11,11,0,2,4,5,5]` per bar: 96 direct-focal
   steps, 48 `modal_color_pass` steps. Erick heard 11 and 5 and asked
   whether the Q engine was mis-mapped. It was not: the MVP-8
   directive rev 2 specifies the tail ("modal color degrees sit in
   the tail (positions 5–11)"). The gap opened at design time
   (pentatonic as focal window, not constraint), not in
   implementation.
2. **The Lydian/Mixolydian argument (Erick's).** The tail highlights
   exactly the two variable slots per mode — Lydian {6,11},
   Mixolydian {5,10}, Ionian {5,11} — while the shared 5-set
   {0,2,4,7,9} is the container minus those slots. Verified on the
   landed engine with zero out-of-container emissions on all three
   modes. The kernel transfers across modes; the residue bets on the
   mode.
3. **Strict variant built and auditioned.** Extending the snap window
   to all orbit positions (Q row untouched) yields 0 emissions
   outside the focal set on all four plagal modes. Erick: the forward
   renders "sound pleasant."
4. **Field-wide sweep.** 44,352 dwell steps over all 3,696 governed
   nodes (q_in=0, k=12): 0 outside the focal set; the still-set
   branch does not leak. Focal set-classes vary by node (5-35 on 708
   nodes; 5-27, 5-20, 5-23, 5-25, and others elsewhere) — the kernel
   follows the node. Boundary nodes (1,848) are excluded: the engine
   forbids boundary bars.
5. **Snap-space enumeration.** Rule = direction × metric × tie-break
   = 18 rules, all strict-window, swept field-wide: **10 equivalence
   classes**. Tie-breaks never matter under forward/backward;
   semitone ≡ degree under one-directional rules; all 6 nearest
   rules are distinct. Per node, 4–7 distinct melodies. The other 9
   classes are recorded as explored-and-not-chosen (§7), not landed.
6. **Ear comparison.** Forward, nearest, and backward renders were
   all liked by ear (forward "pleasant"; nearest/backward thumbs-up on
   2741). Nearest vs backward on 2741 differ on 2 of 12 steps. The
   ear cannot separate the directions on this material; the choice
   of forward is principle-based (§2), not an ear verdict.

**Evidence inventory (scratch, verify before use):**
`~/workspace/build-kernel-only-plagal.py`,
`~/workspace/sweep-strict-field.py`,
`~/workspace/snap-variation-space.py`,
`~/workspace/build-backward-snap.py`,
`~/workspace/observatory-sessions/kernel-only-plagal/` (report +
listening note), `~/workspace/observatory-sessions/nearest-snap-plagal/`,
`~/workspace/observatory-sessions/backward-snap-plagal/`,
`~/workspace/analyze-arm-b-melody.py`,
`~/workspace/probe-lydian-mixolydian.py`.

*T0 note: the named scratch evidence files were not present on disk at
execution time; the controls and the K3 render protocol were reconstructed
from the landed L35 pipeline and frozen in the T0 receipt before any strict
measurement.*

## §4 Tasks

**T0 — lock, before any code change.** Freeze: the §1 pins; the exact
`project()` branch text (before); the snap-rule specification
(forward/station/low, function unchanged); the four scratch strict
WAV shas (§5 K3); the L35 control traces (render the four plagal
specs + the F1 default-step node sequence under L35 code, hash them);
the sweep protocols (§5 K1–K2); the bet bars (§5). Receipt first.
No F-term evaluation exists in this sprint; the T0 discipline is the
same: no code change before the lock.

**Task A — implement.** Apply the §2 one-condition change in scratch.
Unit tests: tail positions snap (orbit 5–11, each); window behavior
unchanged (orbit 0–4, each); `_snap_pc` body byte-identical to L35;
initiation and still-set branches behave as at L35 on fixed specs.
Repo stays clean; zero repo writes until the guarded lander.

**Task B — sweeps and renders.** Run the K1 dwell + transit sweeps,
the K2 row-invariance comparison, and the K3 renders. All MVP8.7 build
receipts record governance-action censuses with zero `modal_color_pass`
steps. Per D4, the `still-set` branch is strictly observational during
the K1 transit sweep: if a chained transit ever hits `still-set`
outside the focal set, report the K1 measurement as-is and do NOT
widen the code diff to a second branch mid-sprint.

**Task C — fences and audits.** Diff-scope audit (only the one
conditional + tests/receipts/docs); `_snap_pc` byte check; float scan;
`harmonic.C_H` null check; Q-unadmitted posture check; 0-LLM-call
attestation; K4 dyad audit; K5 modal-color audit across every trace
and receipt census generated under the MVP8.7 build (explicitly
excluding L35 control baseline traces, Arm (i) L35 control renders,
and K2 `modal_color_pass` → `snapped_to_focal` diff metadata).

**Task D — ear package (PENDING_HUMAN).** Render the three §5 arms
from the landed code. The ear gate is human; the agent authors no
listener field. Scorecard prepared with zero pre-filled verdicts.

**Task E — close.** Closing report + receipt + guarded lander. The
lander takes `--authorize-mvp8-7` ONLY on Erick's explicit
authorization after the signed ear gate. This prompt does NOT pass
it. Landing is one commit on the review branch; no push, no tag.

## §5 Predeclared bets

| Bet | Bar | Measured |
|---|---|---|
| K1 kernel, dwell | All 3,696 governed nodes, q_in=0, k=12, role=dwell: 44,352 steps, **0** outside the resolved focal set | 44,352 steps, 0 outside |
| K1 kernel, transit | 2-bar chains (transit + dwell) over all 440 ordered phase-0 strong-core governed single-pc pairs, q carried via `build_trace` chaining: **0** outside the focal set (`still-set` branch untouched and strictly observational per D4; if any chained transit leaks via `still-set`, report the K1 failure rather than modifying a second branch) | 440 pairs, 7,480 steps, 0 outside; still-set rows 0 |
| K2 row invariance | On the four plagal specs + the frozen F1 default-step node sequence: `qStateIn`, `qStateUsed`, `nextQ`, `orbitIndex`, `fifthStackPc`, `moduleEmittedPc` byte-identical L35 vs new; `emittedPc` differs ONLY where L35 action was `modal_color_pass`; `governanceAction` differs ONLY `modal_color_pass` → `snapped_to_focal` | 0 identity mismatches; 202 changed rows (202 emitted/action diffs, all modal-color transitions) |
| K3 render reproduction | The four plagal renders from the landed code reproduce the scratch strict WAV shas byte-identically: 2741 `5b876c9e1147a10d9904fdfbadd882431bcf061220d7989dafda60fe40566ac1`; 1453 `fb259614dcd39463e6e255032d7c1d948a52c5951017aa60ec5026f68ea67129`; 2773 `b5865ce19c89c02b9816d14d08e26afc24a09011918b6aa8d7f5e960ec902e8b`; 1717 `afbe5670ed1c45e0f7187b8589879d682505126e544cefd7ba43434751f1b223` | 4/4 exact |
| K4 dyad invariants | On the four renders: `dyadSteps` 36, `partnerNotes` 36, 0 out-of-mask lead notes, 0 dyad unison leaks (same census shape as Arm B) | 36/36 on all four; 0 leaks; 0 out-of-mask |
| K5 zero modal color | **0** occurrences of `modal_color_pass` across all traces and receipt censuses generated under the MVP8.7 build (explicitly excluding T0/K2 L35 baseline control traces, Arm (i) L35 control artifacts, and K2 diff metadata recording `modal_color_pass` → `snapped_to_focal` transitions) | 0 |
| D ear gate | PENDING_HUMAN. Arms: (i) strict vs tail A/B on the 2741 plagal (landed build vs L35 control); (ii) strict 20-step default traversal from 1387@0 (transit behavior by ear); (iii) strict Lydian + Mixolydian plagal pair (modal identity in the harmony). Verdicts adopt/reject/revise per arm, in Erick's words. | PENDING_HUMAN |

**Outcome rule:** ADOPT iff K1–K5 pass and the ear gate signs. Any bet
failure is reported as a failure with its measurement; no bet bar
moves after T0, and no second branch is touched mid-sprint.

## §6 Fences

1. No Roman-numeral-led labels; progression language is
   degree/stride/shape.
2. No card, F-term, or P-term byte change; no weights in the ontology
   or the degree ladder.
3. Zero symbolic floats; integer-only throughout.
4. `harmonic.C_H` remains null; `causationClaim: false`,
   `physicalQuantityClaim: false`, `tierClassifier: false`,
   `globalCHNull: true`, `gov517_correspondence_claimed: false`.
5. The Q engine remains UNADMITTED; `SPEC-001 §1.3` untouched; no
   admission claim. This sprint changes runtime overlay behavior
   only, in the MVP-8 posture.
6. No gate, census-content, encoder, planner-law, Q-traversal-law
   (`q_table`, `quintessence`, lookup, focal resolution), or
   renderer-law byte change. The ONLY behavioral code change is the
   §2 conditional. `_snap_pc` body and the `still-set` branch remain
   byte-identical.
7. Menu order and position bias reported; 0 LLM calls.
8. Degrees 1–7 throughout; stride, not span. Lead emissions only;
   pads, bass, and chords untouched.

## §7 Consequences and non-goals (recorded, not in scope)

- **MVP-9 §5.1 must be re-authored.** The roadmap's duration table
  weights `modal_color_pass` tail positions (150/200 ms). Under the
  strict rule those emissions do not exist; the table's tail row
  must be rewritten for snapped tail positions (short by position
  vs long by content — Erick's call at MVP-9 authoring). This
  sprint records the consequence; it does not re-author MVP-9.
- **The other 9 snap classes** (backward, nearest, semitone/degree
  metrics, tie-break variants) were measured field-wide (§3.5) and
  are NOT landed. The record stands: the space was enumerated, the
  choice is forward on principle, and revisiting a class later is a
  one-function change plus re-render, not a re-architecture.
- **Motifs, counterpoint, and other melody techniques** come after
  MVP-9 (Erick's sequencing): they need the pitch vocabulary fixed
  (this sprint) and durations governed (MVP-9) first.
- **No admission.** Nothing here admits the Q engine, the bands, the
  weights, or the card. All results are observed patterns and
  demonstrated explanations under the five-proposition vocabulary.

## §8 Handoff

With D1–D8 endorsed, the handoff package (this endorsed directive +
§3 evidence inventory + the T0/execution prompt) is zipped and hashed
for T0 lock. The repo agent works in scratch at
`/home/erick/workspace/scratch-governed-loop-run/mvp8_7_kernel_melody/`,
repo clean until the guarded lander. Audio is excluded from the repo
as reproducible evidence hashed in the landed receipts.

## §9 Decisions (endorsed and locked)

| # | Decision | Status |
|---|---|---|
| D1 | Kernel-only melody: no tail; harmony provides the modal-color notes (Erick's words: "No tail needed the harmony will provide those notes") | DECIDED (Erick, 2026-11-15) |
| D2 | Snap direction forward, on principle (landed rule, minimal change); ear liked all three directions and cannot separate them (Erick: "That works for me," 2026-11-16) | DECIDED (Erick, 2026-11-16) |
| D3 | `_snap_pc` unchanged; only the window condition widens | DECIDED (Erick, 2026-11-16) |
| D4 | Still-set branch untouched and strictly observational in transit (verified non-leaking in the 44,352-step dwell sweep; if the 440-pair K1 transit sweep hits `still-set` outside the focal set, report the K1 result rather than widening the diff to a second branch mid-sprint) | DECIDED (Erick, 2026-11-16) |
| D5 | MVP-9 §5.1 re-authoring recorded as a consequence, not in scope | DECIDED (Erick, 2026-11-16) |
| D6 | Designation MVP8.7, single-commit landing off L35 | DECIDED (Erick, 2026-11-16) |
| D7 | Bet bars K1–K5 as §5, with K5 scoped to MVP8.7 build outputs (excluding L35 control baselines and K2 diff metadata) | DECIDED (Erick, 2026-11-16) |
| D8 | Ear-gate arms (i)/(ii)/(iii) as §5 | DECIDED (Erick, 2026-11-16) |

**Endorsement record:** Confirmed and endorsed by Erick (Planning Seat) on
2026-11-16 (D1–D8, bet bars K1–K5 with K5 scoped to MVP8.7 build outputs, and
ear-gate arms (i)–(iii)). The repo agent is authorized to proceed to T0 lock in
scratch. Repository landing still requires the signed human ear gate and
explicit `--authorize-mvp8-7` authorization to the guarded lander.
