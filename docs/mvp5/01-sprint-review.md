# MVP-5 Sprint Review — Acoustic & Ear Validation of the Coupled Two-Tier Engine

| Field | Value |
|---|---|
| Directive | `MVP5-DIR-1` rev 1 |
| Sprint | MVP-5 / L21 |
| Review date | 2026-11-01 |
| Status | Executed, verified, landed in the working tree; uncommitted |
| Audience | Planning Seat, engineering, QA, future L22 work |
| Landing receipt | `qa/mvp5_landing_receipt.json` |
| Ledger link | L21 entry in `provenance/DECISION_LEDGER.md` |

## 1. Executive summary

MVP-5 joined the two halves of the governed-loop engine that had previously only
been tested in isolation: the macro-harmonic trajectory controller and the
micro-melodic Quintessence overlay. The sprint produced a coupled engine, a
deterministic offline audio renderer, a read-only browser replay bridge, and an
ear-validation protocol. The landing packaged the result as a hash-bound L21
increment.

The central result is simple: the engine now produces **audible, deterministic,
auditable output** whose macro chord changes and micro melodic line are driven by
the same symbolic substrate that the gate already governs. The ear check
confirmed voice-leading at node dwells, distinct progressions across transitions,
and a melody that remains aligned when the walk moves between nodes. The
quantitative checks support the same conclusion: no out-of-mask pitches, no
boundary camping, no clipping, and exact transpositional behavior under a
fifth-up lift.

The sprint closed with no stop rules triggered. The release closure remains
`418` passing checks with zero failures. One auxiliary hygiene check
(`validate:prose-consistency`) was red at landing for a pre-existing reason. It
has since been cleared by Planning-Seat adjudication
`ADJ-PLANNING-SEAT-20261101-PROSE-M4M5`, which sanctions the two historical
closing reports as byte-frozen prose records. The reports were not edited.

## 2. What the directive asked for

`MVP5-DIR-1` resolved four open frontiers left by the L20 peer review:

1. **No ear evidence for the coupled engine.** The dynamic twenty-one-state walk
   and the intra-node Q overlay had never been rendered together.
2. **The micro walk was a staged still-life.** Resetting the Q state at every
   macro hop limited the melody to the five-state generative window.
3. **Steering arithmetic and single-seed scope were untested.** The language
   model selected the first presented candidate in most steps; the deterministic
   alternatives and the wider archipelago were not measured.
4. **The Policy-v3 `41-at-T11` sweep receipt was unlanded.** The receipt and its
   predeclaration existed outside the repository and needed verification and
   staging.

The directive defined six adopted decisions (`D-1` through `D-6`) covering
scratch-first execution, sweep staging, carried-Q continuity, the two-tier
synthesis contract, steering/generalization controls, and layer/non-claim fences.

## 3. Scope and posture

- **Execution realm.** `/home/erick/workspace/scratch-governed-loop-run/mvp5/`.
- **Sprint posture.** Scratch-only: no repository writes during the sprint, no
  Orrery changes, no gate-byte changes.
- **Landing posture.** A separate, authorized working-tree landing copied every
  staged payload byte-for-byte, appended the L21 ledger entry, rebound the
  ledger-dependent artifacts, regenerated the manifest and checksums, and
  re-ran the release closure.
- **Fences.** `SPEC-001 §1.3 overlay dynamics`; no GOV-517 correspondence claim;
  the still-set label is preserved; no canonical or physical causation claim.

## 4. Task-by-task review

### Task 0 — fixed point and Policy-v3 sweep staging

**Outcome.** Complete.

The task re-verified the L20 fixed point and all pinned in-tree inputs, exercised
the locked bridge check in positive and negative form, and staged the three
Policy-v3 sweep artifacts byte-for-byte. The independent sweep recompute matched
the receipt on every orbit total and on the edge-set digest
`7c428a86e6fa60b632eab448a4946c42d79949c4010981dad81e455b081d6b39`.

**Evidence.**

- Anchored masks with exactly one `pc0`: `462/462`.
- Wrap-count identity: `5,544` checks, zero failures.
- Phase-11 orbit sums exact at `41`: ten of ten orbits.
- Total: `12,628 = 41 × 308`.
- Sweep artifacts staged: three of three, hash-verified.

### Task A — coupled macro × micro engine

**Outcome.** Complete.

The task extracted the exact MVP-4 macro trajectories and coupled each with the
intra-node Q overlay. Four comparative arms were generated, each with one
hundred micro steps:

| Arm | Macro behavior | Distinct states | Q mode | Q states visited | Seams |
|---|---|---:|---|---:|---:|
| Arm 1 | unranked two-state Saturn cycle | 2 | carried | 12 | 0 |
| Arm 2 | static Chaldean four-state walk | 4 | carried | 12 | 0 |
| Arm 3a | dynamic twenty-one-state walk | 21 | reset | 5 | 5 |
| Arm 3b | dynamic twenty-one-state walk | 21 | carried | 12 | 5 |

The carried arm visited the full twelve-state quinta-cycle with zero still-set
entries and zero out-of-mask pitches. Boundary transit was transit-only: zero
micro steps inside the boundary and a `300` ms unweighted rest before the
destination container re-attacked. The Task C eight-hop reference path and the
Task B equivariant pair were also coupled; the `+7` lift matched every emitted
pitch class (`15/15`).

**Evidence.**

- All four arms: gate `ACCEPT` throughout, zero out-of-mask pitches.
- Nine-seed archipelago: nine of nine seeds accept; gate transitions
  `377/377`; out-of-mask pitches zero.
- W007 seam-free island: seven states, zero seams; the recency penalty prevents
  a two-state oscillation without any seam boost.
- Variant U and Variant D deterministic controls both reached twenty-one
  distinct states with zero language-model calls.

### Task B — deterministic offline audio

**Outcome.** Complete.

The task parsed the Orrery audio parameters at runtime, verified all seven office
palettes, and rendered six core tracks as 16-bit PCM WAV and Standard MIDI
Format 1. Each track was re-rendered in a fresh pass; every file was
byte-identical. The MIDI parser confirmed that every pad and lead note pitch
class belongs to the active mask container.

**Evidence.**

- Tracks: six; render files: twelve.
- Re-render determinism: twelve of twelve files.
- MIDI container leaks: zero.
- Clipped samples: zero.
- Non-finite samples: zero.
- Sample counts: exact on every track.

### Task C — two-tier Orrery bridge replay

**Outcome.** Complete.

The task injected the read-only navigation overlay and a scratch-side two-tier
scheduler, then replayed the carried dynamic arm and the equivariant pair through
Playwright. The headless path used a deterministic fake audio context to capture
scheduled frequencies; the same scheduler supports a headed live path with a
real audio context.

**Evidence.**

- Overlay inspect: eighty-four cells, twelve boundary chips, five thousand five
  hundred forty-four nodes, five thousand one hundred thirty seam moves, two
  hundred fifty-six boundary rows.
- Arm 3b: one hundred captured micro frequencies; all one hundred convert back
  to the exact emitted pitch class.
- Equivariant pair: fifteen of fifteen on each trace.
- Boundary auto-transit `847@0 -> 1693@11`: zero micro frequencies, boundary chip
  `b0` active.
- Console errors: zero. Page errors: zero.

### Task D — diagnostics, ear protocol, and staging

**Outcome.** Complete.

The task computed the contrast matrix, verified the transpositional identity on
the rendered MIDI surfaces, produced the pre-registered ear-validation protocol,
and finalized the staging manifest.

**Evidence.**

- Pitch-class cardinality across the four arms: `8/10/11/12`.
- Five-note window repeats: `8/4/4/0`; the reset arm repeats, the carried arm is
  through-composed.
- Direct-to-fallback ratios: `57:43`, `52:48`, `70:30`, `54:46`.
- Equivariance: `15/15` pitch classes and `14/14` melodic intervals.
- Staging manifest: every entry hash-verified.

## 5. Steering and generalization findings

The L20 peer review flagged that the language model selected the first presented
candidate in `19/20` dynamic steps. MVP-5 measured the deterministic alternative
directly:

- The deterministic index-zero greedy run made every choice at the first
  presented candidate and used zero language-model calls.
- Variant U (uniform Tier-1 base weight) and Variant D (card-spec degree-mapped
  base weight) both reached twenty-one distinct states, but they diverged in
  later modulation structure. Variant U stayed at three families; Variant D
  reached five families and more seams.
- The divergence at step one in the LLM arm is exactly the recorded one: the LLM
  chose presented index two (`1383@0`) while index zero was `875@0`.

This is a useful negative control. It shows that modulation is a property of the
card arithmetic and the legal move graph, not of LLM taste. It also shows that
the two weighting conventions are not behaviorally identical; the variant choice
must be disclosed in any future claim.

## 6. Listening review

The human ear check on Arm 3b reported:

- voice-leading is audible at node dwells;
- different progressions are audible across node transitions;
- the melody remains aligned when the walk moves from node to node.

That maps to the pre-registered questions:

- **Q1 (confinement vs. modulation).** The Saturn-confined tracks sound
  orbit-like; Arm 3b audibly leaves Saturn for Sun and Mercury.
- **Q2 (reset vs. carried).** The reset arm restarts its figure at every bar;
  the carried arm continues the fifth-cycle across chord changes.
- **Q3 (seam and boundary cadence).** The seam transitions are articulated and
  the `18.0–18.3 s` transit rest reads as a cadence rather than a dropout.
- **Q4 (transpositional equivariance).** The base and lifted pair share a
  contour and differ by a uniform fifth.

The formal Q1–Q4 scorecard remains in
`tools/governed-loop/mvp5/task-d/EAR_VALIDATION_PROTOCOL.md`.

## 7. Deviations, decisions, and disclosures

1. **Micro-bar law.** The directive required one hundred micro steps per arm. The
   coupled engine emits one five-step bar at the source node of each of the
   twenty macro decisions. This yields exactly one hundred steps for every arm,
   avoids emitting melody inside a boundary, and keeps the boundary transit as a
   separate rest. The convention is recorded in the Task A receipt.
2. **Equivariant fallback.** The frozen projector's direct fifth-stack mode is
   unchanged. Its container-snapped fallback is evaluated on the canonical
   untransposed mask container plus phase, which makes the overlay exactly
   phase-equivariant. Without this, the `+7` lift is not a clean transposition
   on every micro step.
3. **Variant U vs. Variant D.** Both are reported. Neither is silently promoted.
4. **Auxiliary prose check.** The prose-consistency validator was already red at
   opening because the L20 closing report contains unsanctioned fingerprint
   literals. The landed MVP-5 closing report added three more. The authoritative
   release closure remained `418` passing checks with zero failures. After the
   landing, Planning-Seat adjudication `ADJ-PLANNING-SEAT-20261101-PROSE-M4M5`
   sanctioned both historical closing reports as byte-frozen prose records. The
   validator now reports `PASS` with three sanctioned records and twenty-seven
   bound fingerprints; neither report was edited.
5. **No commit, tag, or push.** The landing is a working-tree change, by design.

## 8. Stop rules and risk review

The sprint recorded zero stop-rule triggers. The landing verified the fixed
point, payload hashes, ledger prefix identity, ledger bindings, manifest
freshness, checksum parity, and release closure before stopping.

Residual risks:

- **Auxiliary hygiene red (resolved).** The prose-consistency check was cleared
  by `ADJ-PLANNING-SEAT-20261101-PROSE-M4M5`; both closing reports remain
  byte-frozen.
- **Source-node bar convention.** The convention is deliberate and documented,
  but it means the terminal destination of a walk is not voiced as a bar.
- **Browser nondeterminism.** The Playwright replay is hash-verified during
  landing, not re-executed. The in-tree code and probe are landed; the evidence
  is the archived probe output and bridge log.
- **Large binary renders.** The six WAV files are first-class landing artifacts.
  Future increments should decide whether to keep them in the main tree or move
  them to a release asset store.

## 9. Acceptance verdict

**Accepted for L21 landing.** The sprint delivered all five tasks with zero stop
rules, the landing is hash-bound and reproducible, and the release closure passes.
The listening review supports the intended acoustic behavior. The one auxiliary
hygiene warning was cleared by `ADJ-PLANNING-SEAT-20261101-PROSE-M4M5`; the
release closure remains unaffected.

## 10. Recommended next actions

1. Closed: the L20 and L21 closing-report fingerprints are sanctioned under
   `ADJ-PLANNING-SEAT-20261101-PROSE-M4M5`; neither report was edited.
2. Record a formal Q1–Q4 adjudication in the ear protocol if a signed listening
   verdict is required.
3. Review the L21 working-tree diff and authorize the commit.
4. Use the landed coupled engine as the baseline for the next macro-card or
   micro-overlay increment; do not re-derive the graph or gate bytes.

## Appendix — evidence index

| Evidence | Path |
|---|---|
| L21 ledger entry | `provenance/DECISION_LEDGER.md` |
| Landing receipt | `qa/mvp5_landing_receipt.json` |
| Task receipts | `qa/mvp5_task_0_receipt.json` through `qa/mvp5_task_d_receipt.json` |
| Sprint closing report | `scrum/plan/mvp5-sprint-closing-report.md` |
| Ear protocol | `tools/governed-loop/mvp5/task-d/EAR_VALIDATION_PROTOCOL.md` |
| Coupled engine | `tools/governed-loop/mvp5/task-a/mvp5_coupled_engine.py` |
| Audio renderer | `tools/governed-loop/mvp5/task-b/mvp5_audio_renderer.py` |
| Bridge and scheduler | `tools/governed-loop/mvp5/task-c/` |
| Renders | `tools/governed-loop/mvp5/task-b/renders/` |
| Policy-v3 sweep | `tools/governed-loop/plv3_sweep.json` |
