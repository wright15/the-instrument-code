# MVP-5 Architecture & Design — Coupled Two-Tier Symbolic-Acoustic Engine

| Field | Value |
|---|---|
| Directive | `MVP5-DIR-1` rev 1 |
| Increment | MVP-5 / L21 |
| Release line | `seven-governors-integrated-1.9.0` |
| Layer | `SPEC-001 §1.3 overlay dynamics` |
| Status | Landed in the working tree; uncommitted |
| Canonical evidence | `qa/mvp5_landing_receipt.json`, `provenance/DECISION_LEDGER.md` |

## 1. Design thesis

The engine is built on a deliberate separation of **what is allowed** from
**what is chosen** and from **what is heard**.

- The **gate** decides whether a transition is licensed. It is frozen, integer,
  and read-only.
- The **card and planner** rank legal moves and produce a trajectory. They may
  be replaced or reweighted without touching the gate.
- The **Q overlay** projects the trajectory into a melodic line. It is a
  separate symbolic layer with its own cycle and container discipline.
- The **renderer and bridge** turn symbols into sound. They are downstream
  surfaces; they do not feed back into the gate or the card.

This separation is the reason the engine can be both expressive and auditable.
A listener hears harmony and melody; a reviewer sees the exact legal move, the
gate verdict, the card score, the Q state, and the emitted pitch class. The
acoustic surface never becomes the authority.

## 2. System context and lineage

```text
L19  governed-loop harness, Policy-v3 registration, reconciled projections
 |
L20  dynamic Chaldean card, native BFS planner, intra-node Q overlay
 |
L21  coupled macro x micro engine, deterministic audio, bridge replay,
     ear-validation protocol, Policy-v3 sweep staging
```

The L21 increment uses the L20 fixed point without altering the gate, the
frozen census, the ground truth, or the seam substrate. It adds a coupling layer
and downstream acoustic surfaces. The Policy-v3 sweep artifacts are staged in
the same landing because the L20 freeze report had scheduled them but had not
landed them.

## 3. Architectural principles

1. **Gate authority is absolute.** No card, planner, renderer, or bridge code
   changes gate logic, priority, vocabulary, or census content.
2. **Symbolic arithmetic is integer.** Card scoring and Q projection contain no
   floating-point values. Floating point is confined to PCM sample generation in
   the audio renderer.
3. **Frozen inputs are read-only.** The census, ground truth, seam substrate,
   and gate are imported, not copied into a mutable working set.
4. **Boundary states are transit-only.** A boundary cannot govern and cannot be
   camped on. Micro-step dwell inside a boundary is zero.
5. **Every emitted pitch belongs to the active container.** The micro projector,
   the MIDI encoder, and the browser bridge each enforce the seven-note
   container of the active `mask@phase`.
6. **Evidence is hash-bound.** Receipts, traces, renders, logs, and the landing
   receipt are chained by SHA-256. The ledger records the landing event.
7. **Non-claims are explicit.** The overlay is not a canonical claim, a physical
   causation claim, or a GOV-517 correspondence claim.

## 4. Component map

```text
+-----------------------------------------------------------------------+
|                         Evidence and governance                       |
|  task receipts | staging manifest | landing receipt | DECISION_LEDGER  |
+-----------------------------------------------------------------------+
                                  ^
                                  |
+-----------------------------------------------------------------------+
|                         Acoustic surfaces                             |
|  offline WAV/MIDI renderer          read-only Orrery bridge + WebAudio |
+-----------------------------------------------------------------------+
                                  ^
                                  |
+-----------------------------------------------------------------------+
|                       Coupled engine (Task A)                         |
|  macro trajectory  --->  micro Q overlay  --->  timed bars/rests      |
+-----------------------------------------------------------------------+
             ^                    ^                      ^
             |                    |                      |
+---------------------+  +---------------------+  +---------------------+
| Macro tier          |  | Micro tier          |  | Gate tier           |
| dynamic card        |  | quintessence Q1/Qz  |  | mvp2.World.gate     |
| native BFS planner  |  | q_intra_node        |  | frozen census       |
| legal move catalog  |  | traversal cycle     |  | seam substrate      |
+---------------------+  +---------------------+  +---------------------+
```

### 4.1 Component responsibilities

| Component | Responsibility | Key artifact |
|---|---|---|
| Gate | Classify a lifted transition as `ACCEPT` or `REJECT` with reasons and citation | `tools/governed-loop/mvp2.py` |
| Census and ground truth | Define the four hundred sixty-two heptatonic records, roles, families, and orbits | `tools/governed-loop/census_462.json`, `frozen_ground_truth.json` |
| Seam catalog | Enumerate the licensed Family A operator images and Family B same-phase bridges | `tools/governed-loop/seam_legal_moves_v3.json` |
| Planner | Build the lifted graph and answer legal-move and path queries | `tools/governed-loop/mvp4/task-b/mvp4_symbolic_planner.py` |
| Dynamic card | Score legal moves with exact integer arithmetic | `tools/governed-loop/mvp4/task-a/mvp4_dynamic_chaldean_card.json` |
| Q projector | Map a Q state and z-step to a container pitch class | `tools/governed-loop/mvp4/task-c/mvp4_q_intra_node.py` |
| Coupled engine | Join macro choices to timed micro bars and boundary rests | `tools/governed-loop/mvp5/task-a/mvp5_coupled_engine.py` |
| Offline renderer | Produce deterministic WAV and MIDI from a trace | `tools/governed-loop/mvp5/task-b/mvp5_audio_renderer.py` |
| Bridge | Drive the read-only Orrery overlay and schedule WebAudio | `tools/governed-loop/mvp5/task-c/mvp5_two_tier_bridge.py`, `mvp5_two_tier_scheduler.js` |
| Ear protocol | Pre-register listening questions and scorecard | `tools/governed-loop/mvp5/task-d/EAR_VALIDATION_PROTOCOL.md` |

## 5. Macro tier

### 5.1 Graph

The lifted graph has one node per census record per phase: four hundred
sixty-two records times twelve phases, or five thousand five hundred forty-four
nodes. The planner builds twenty thousand seven hundred sixty deduplicated
edges from legal Tier-1, Family A, Family B, and boundary-transit moves. The
graph has nine hundred forty-three weak components and one thousand one hundred
two strong components. The boundary layer contains one hundred fifty-four
boundary masks: one hundred four escapable and fifty isolated, with two hundred
fifty-six boundary side-rows.

### 5.2 Gate rules

The gate applies the following order:

1. Membership: the candidate must be a census state.
2. Self-transition: a governed self-loop is accepted; a boundary self-loop is
   rejected as ungoverned.
3. Tier-1: same governing root and same phase.
4. Family A: a lifted R1 or L1 operator image with the operator's phase carry.
5. Family B: a same-phase bridge between the two sides of a frozen pair.
6. Boundary veto: a boundary endpoint is rejected unless a previous rule licensed
   it.
7. Otherwise: unlicensed transition.

A boundary can be entered through a licensed Family A row and then auto-transits
to a governed target. It cannot be camped on.

### 5.3 Dynamic card

The card score is:

```text
score(c) = W_base(c)
           - alpha * visits_W(c, H_t)
           + beta * is_seam(c) * max(0, N_in_family(H_t) - N_threshold + 1)
```

The adopted parameters are `W = 8`, `alpha = 40`, `N_threshold = 3`, `beta = 70`,
and `W_seam_base = 50`. The Tier-1 degree weights are `116, 56, 41, 35, 77, 44,
38` over the seven Chaldean degrees.

Two Tier-1 base-weight conventions are disclosed:

- **Variant U** returns the office string and falls back to `W_seam_base` for all
  Tier-1 candidates; the card then relies on `category_rank` until the family
  dwell reaches the threshold.
- **Variant D** maps the target office to degree `1..7` and uses the
  corresponding numerator.

The tie-break order is `-score`, category rank (Tier-1 before seam operators),
target mask, target phase, then operator. The card never alters a gate verdict.

### 5.4 Boundary transit

Boundary auto-transit chooses the smallest licensed seam exit by target mask,
target phase, and operator. The transit is a rest, not a melodic container. The
Q state is held across the transit so the destination container continues the
cycle.

## 6. Micro tier

### 6.1 Quintessence substrate

The Q layer uses the frozen twelve-state traversal cycle:

```text
0 -> 7 -> 2 -> 9 -> 4 -> 11 -> 6 -> 1 -> 8 -> 3 -> 10 -> 5 -> 0
```

The still set is `(12, 13, 14, 15)` and is labeled `still_set`. The generative
window used by the reset baseline is the first five traversal states,
`(0, 7, 2, 9, 4)`. The action law is `Q_z = Q_1^z`.

### 6.2 Emission law

For a micro step, the projector computes the next Q state, its orbit index, and
the fifth-stack pitch `(7 * orbit_index + phase) mod 12`. If that pitch is in the
active seven-note container, the emission is `direct_orbit_pc`. Otherwise the
emission is `degree_modulo_7`, a container-snapped fallback.

The MVP-5 coupling evaluates the fallback on the canonical, untransposed mask
container plus phase. This is what makes the overlay exactly phase-equivariant:
a `+7` phase lift transposes every emitted pitch class by `+7 mod 12` while the
projection mode remains stable.

### 6.3 Bar law and timing

A macro decision owns one bar of five micro steps at its source node:

- macro dwell: `1,500` ms;
- micro step: `300` ms;
- micro steps per governed bar: five;
- boundary dwell: zero;
- boundary transit rest: `300` ms;
- veto rest: `1,500` ms.

The source-node bar law yields exactly one hundred micro steps for each of the
twenty-decision arms. It also avoids emitting melody inside a boundary. The
terminal destination of a walk is not voiced as a bar; the walk ends after the
last decision's bar.

### 6.4 Reset and carried modes

- **Reset.** The Q state restarts at zero at every bar. The melody visits the
  five-state generative window and repeats its five-note figure.
- **Carried.** The Q state advances five times per bar: four micro steps inside
  the bar plus one transition advance. The melody visits the full twelve-state
  cycle and is through-composed.

The carried mode is the primary MVP-5 behavior. The reset mode is the
comparative still-life baseline.

## 7. Acoustic tier

### 7.1 Parameter authority

All pitch-to-frequency conversions and office timbres inherit from
`orrery/src/audio.ts`:

- root MIDI note: `60` (C4);
- A4: `440` Hz;
- twelve-tone equal temperament:
  `f = 440 * 2^((midi - 69) / 12)`;
- seven office palettes with waveform, register offset, attack, release, detune,
  and gain.

The offline renderer extracts these values at runtime and verifies them against
the repository file. The bridge uses the same palette values in the browser.

### 7.2 Offline renderer

The renderer is standard-library only. It synthesizes:

- **Macro pad.** Seven container pitch classes plus the phase tonic one octave
  below, at pad gain scale `0.35`.
- **Micro lead.** One note per micro step, one octave above the container, with
  articulated attack and release and velocity emphasis `1.0` for direct orbit
  pitches and `0.8` for fallback pitches.
- **Rests.** Boundary transit is a short unweighted rest; a gate veto would be a
  full `1,500` ms rest.

The WAV surface is 16-bit PCM, mono, at a sample rate of `44,100` Hz. The MIDI
surface is Standard MIDI Format 1 with 480 ticks per quarter note at 100 beats
per minute. The conductor track carries tempo, meter, markers, and gate
citations; the pad and lead tracks carry the musical events.

### 7.3 Browser bridge

The bridge starts the read-only navigation server and a local Vite server, opens
the Orrery page, injects the overlay, and injects a scratch-side scheduler. The
scheduler calls `select(source)` and `applyMove(target, verdict, citation)` on
each macro hop, then schedules one oscillator per micro step at the exact
twelve-tone frequency.

The headless mode installs a deterministic fake audio context and records
scheduled frequencies. The live mode uses a real audio context and real timing.
The bridge never edits `orrery/` or the gate.

## 8. Evidence and verification architecture

```text
predeclaration -> sweep receipt
task runner -> task receipt -> staging manifest
staging manifest -> landing receipt -> ledger entry
ledger entry -> ledger-bound artifacts -> manifest -> checksums -> release closure
```

The evidence chain is designed so that each layer can be checked without
re-running the layer above:

- The sweep receipt is checked against the predeclaration and the in-tree census.
- Each task receipt records the inputs, outputs, checks, and stop-rule state.
- The staging manifest binds every payload hash.
- The landing receipt records the copy map, the post-append ledger hash, the
  cascade hashes, the manifest count, and the release closure.
- The ledger entry records the landing event and the artifact table.
- The manifest and checksum file bind the working tree.

The verification suite covers:

- fixed-point and pin checks;
- gate interpretation and negative bridge checks;
- Policy-v3 orbit totals and wrap identity;
- coupled-arm invariants and the nine-seed battery;
- audio parameter extraction, MIDI container membership, sample integrity, and
  re-render identity;
- browser frequency capture and console/page cleanliness;
- ledger bindings, manifest completeness, and release closure.

## 9. Invariants and failure modes

| Invariant | Enforcement | Failure mode |
|---|---|---|
| No gate-byte change | Pinned hashes and review | Stop rule |
| No out-of-mask pitch | Projector, MIDI parser, bridge conversion | Stop rule |
| No boundary camping | Boundary role check and zero dwell | Stop rule |
| No still-set melody | Traversal cycle and reset/carried checks | Stop rule |
| Deterministic audio | Two-pass render and hash identity | Stop rule |
| Exact transposition | Canonical-container fallback and interval check | Stop rule |
| Hash-bound evidence | Staging and landing manifests | Stop rule |
| No unauthorized Orrery change | Read-only bridge and source diff | Stop rule |

Known failure modes and their handling:

- **Stale validation report.** The release closure and manifest checks detect a
  stale report; the cascade regenerates it.
- **Boundary entry without exit.** The planner requires a licensed seam exit; an
  isolated boundary cannot be entered as a terminal choice.
- **Browser nondeterminism.** The landing hash-verifies the browser evidence
  instead of re-running it. A future re-run is an acceptance activity, not a
  landing activity.
- **Prose-consistency drift.** The auxiliary validator can fail on fingerprint
  literals in closing reports. The two historical closing reports are sanctioned
  as byte-frozen prose records under `ADJ-PLANNING-SEAT-20261101-PROSE-M4M5`;
  the check is `PASS` and the release closure is unaffected.

## 10. Artifact taxonomy

| Class | Examples | Role |
|---|---|---|
| Code | coupled engine, planner, Q projector, renderer, bridge | Executable design |
| Symbolic traces | macro and micro records, battery and steering traces | Reproducible trajectory evidence |
| Audio | WAV and MIDI renders | Listening and inspection surfaces |
| Receipts | task receipts, landing receipt | Hash-bound acceptance evidence |
| Manifests | staging manifest, package manifest, checksums | Integrity and completeness |
| Governance | ledger entry, closing report, sprint review | Decision record |
| Protocols | ear-validation protocol | Pre-registered human review |
| Documentation | this set | Design rationale and usage |

## 11. Security, governance, and fences

- The gate, census, ground truth, and seam substrate are imported read-only.
- The bridge serves a read-only HTTP surface and never exposes a write route.
- The audio layer uses no third-party audio or MIDI packages.
- The Q layer does not claim GOV-517 correspondence and does not use canonical
  or physical causation language.
- The still-set label is preserved; the overlay does not mutate the still set.
- The L21 landing is a working-tree change with no tag or push.
- The closing report and the landing receipt preserve the non-claim fences.

## 12. Known constraints and technical debt

1. **Source-node bar convention.** The one-hundred-step requirement is met by
   emitting bars at decision sources. A future design may render destination
   containers as well, but that changes the timing and evidence contract.
2. **Equivariant fallback.** The fallback differs from the frozen projector's
   sorted-container indexing at non-zero phase. The MVP-5 law is documented and
   tested; a future projector revision should formalize it.
3. **Browser evidence.** The bridge is read-only but depends on the Orrery page
   and Playwright toolchain. The landing treats it as hash-verified evidence.
4. **Binary weight.** The WAV renders are large; a release asset policy is
   advisable before the next audio increment.
5. **Prose hygiene (resolved).** The two historical closing reports are
   sanctioned under `ADJ-PLANNING-SEAT-20261101-PROSE-M4M5` as byte-frozen prose
   records; any byte change voids the sanction.

## 13. Extension points

- **New cards.** The dynamic card is a separate JSON contract; a new card can be
  scored without changing the gate or planner.
- **New offices or palettes.** The renderer reads the office palette table; a
  new office requires the Orrery parameter file and a palette verification.
- **New modes.** Reset and carried Q are modes of the same bar builder; a new
  mode can be added without changing the gate.
- **New acoustic surfaces.** The trace format is the boundary between symbolic
  and acoustic layers; a new renderer can consume the same traces.
- **New verification.** The receipt schema and staging manifest are designed for
  additional checks and artifact classes.

## 14. Glossary

| Term | Meaning |
|---|---|
| Lifted node | A census mask paired with a phase, written `mask@phase` |
| Governing root | The family root that governs a satellite or anchor |
| Tier-1 | Same governing root and same phase |
| Family A | Licensed R1 or L1 operator image with a phase carry |
| Family B | Same-phase bridge between two frozen pair sides |
| Boundary | Transit-only state that cannot govern or be camped on |
| Q state | A state in the twelve-state Quintessence traversal cycle |
| Direct orbit pitch | The fifth-stack pitch lies in the active container |
| Fallback pitch | The orbit pitch is snapped to the container by degree |
| Carried Q | The Q cycle continues across macro transitions |
| Reset Q | The Q state restarts at zero at every bar |
| Staging manifest | Hash-bound list of payloads prepared for landing |
| Landing receipt | Hash-bound record of the landing and post-append state |

## 15. References

| Reference | Path |
|---|---|
| Sprint review | `docs/mvp5/01-sprint-review.md` |
| Product increment | `docs/mvp5/02-product-increment.md` |
| Ear protocol | `tools/governed-loop/mvp5/task-d/EAR_VALIDATION_PROTOCOL.md` |
| Closing report | `scrum/plan/mvp5-sprint-closing-report.md` |
| Landing receipt | `qa/mvp5_landing_receipt.json` |
| Ledger | `provenance/DECISION_LEDGER.md` |
| Three-part typology fence | `docs/THREE_PART_CONTINUOUS_TYPOLOGY.md` |
