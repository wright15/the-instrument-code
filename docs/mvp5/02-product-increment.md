# MVP-5 / L21 Product Increment — Coupled Two-Tier Acoustic Engine

| Field | Value |
|---|---|
| Increment | MVP-5 / L21 |
| Release line | `seven-governors-integrated-1.9.0` |
| Landing state | Working tree; uncommitted |
| Fixed point | `ba6ae1fe2c8b31ab739c91593701177678bff18b` |
| Post-append ledger | `e74cf6a2d79e9170c6686f2fb5287043ab1dd2c41d4f9a56d62b97f766c8f1c4` |
| Manifest after payload landing | 1,581 files / 110,455,405 bytes |
| Release closure | `418` passing checks, zero failures |
| Landing receipt | `qa/mvp5_landing_receipt.json` |

## 1. Increment summary

This increment makes the governed-loop engine audible and reproducible. It
delivers a coupled macro/micro trajectory engine, a deterministic offline audio
pipeline, a read-only browser replay bridge, and a pre-registered listening
protocol. The increment is not a new release of the Orrery application; it is a
governed-loop evidence and capability increment that uses the Orrery's audio
parameters and read-only navigation surface.

The user-facing value is straightforward: a listener can now hear the difference
between confinement, static recurrence, reset-Q still-life, and through-composed
carried-Q modulation; a reviewer can reproduce every pitch, every transition,
and every rendered file from the landed evidence.

## 2. Capabilities delivered

### 2.1 Macro-harmonic trajectory control

The engine can rank legal outgoing moves with exact integer card arithmetic,
walk the lifted graph, accept or reject through the frozen gate, and transit
boundary states without camping. It exposes both the LLM-style trajectory and
deterministic index-zero controls under two disclosed weighting variants.

### 2.2 Continuous micro-melodic overlay

The engine can carry the Quintessence fifth-cycle across macro chord changes,
project the current orbit state into the active seven-note container, and keep
the melody aligned at node boundaries. It supports a reset baseline and a
carried mode, both with zero out-of-mask pitches.

### 2.3 Deterministic acoustic rendering

The engine can render the coupled traces as 16-bit PCM WAV and Standard MIDI
Format 1. The audio parameters are extracted from `orrery/src/audio.ts` and
verified at runtime. The renderer is standard-library only and deterministic.

### 2.4 Browser replay and WebAudio verification

The engine can drive the read-only Orrery navigation overlay through Playwright,
schedule micro oscillators at the exact twelve-tone frequencies, and capture the
scheduled frequencies in headless mode. The same scheduler supports a headed live
path with a real audio context.

### 2.5 Ear-validation protocol

The increment includes a pre-registered listening guide with timestamped markers,
four questions, and a scorecard. The questions cover confinement versus
modulation, reset versus carried melody, seam and boundary cadence, and
transpositional equivariance.

### 2.6 Evidence and landing

Every task receipt, trace, render, log, and protocol is hash-bound in the
staging manifest and the landing receipt. The L21 ledger entry records the
landing event; the manifest and checksum file bind the current working tree.

## 3. Delivered artifact inventory

| Category | Count | Location |
|---|---:|---|
| Executable modules and runners | twelve | `tools/governed-loop/mvp5/task-0` through `task-d` |
| Coupled traces | twenty-eight | `tools/governed-loop/mvp5/task-a/traces/` |
| WAV renders | six | `tools/governed-loop/mvp5/task-b/renders/` |
| MIDI renders | six | `tools/governed-loop/mvp5/task-b/renders/` |
| Task receipts | five | `qa/mvp5_task_0_receipt.json` through `qa/mvp5_task_d_receipt.json` |
| Landing receipt | one | `qa/mvp5_landing_receipt.json` |
| Bridge logs and probe output | two | `tools/governed-loop/mvp5/task-c/` |
| Closing report | one | `scrum/plan/mvp5-sprint-closing-report.md` |
| Ear protocol | one | `tools/governed-loop/mvp5/task-d/EAR_VALIDATION_PROTOCOL.md` |
| Policy-v3 sweep artifacts | three | `tools/governed-loop/plv3_sweep*` |
| Documentation set | four | `docs/mvp5/` |

The sixty-four payload files landed byte-for-byte from the MVP-5 scratch realm.
The five task receipts were canonicalized to `qa/` by identical SHA-256. The
landing receipt is the sixty-fifth new file from the landing event; the
documentation set is a post-landing explanatory layer and is not part of the
sixty-four-payload set.

## 4. Acceptance evidence

| Claim | Evidence |
|---|---|
| Fixed point preserved | L20 prefix byte-identical; opening and closing HEAD unchanged; release closure `418` passing checks |
| Policy-v3 sweep staged and verified | three artifacts hash-verified; ten of ten orbits exact at `41`; total `12,628 = 41 × 308`; wrap identity `5,544/5,544` |
| Four coupled arms generated | two, four, twenty-one, twenty-one distinct macro states; one hundred micro steps each |
| Carried Q reaches the full cycle | twelve of twelve Q states; zero still-set entries; zero out-of-mask pitches |
| Boundary rule holds | zero boundary dwell; zero micro steps inside the boundary; `300` ms transit rest |
| Archipelago generalizes | nine of nine seeds accept; `377/377` gate transitions; W007 seven states and zero seams |
| Steering is arithmetic, not taste | deterministic U and D both reach twenty-one states with zero LLM calls; LLM index-zero rate `19/20` |
| Audio is deterministic | six tracks, twelve files, twelve of twelve re-render identical; zero MIDI leaks; zero clipped samples |
| Bridge is faithful | overlay inspect `84/12/5,544/5,130/256`; arm 3b `100/100`; equivariant pair `15/15` each; zero console or page errors |
| Transposition is exact | `15/15` pitch classes and `14/14` intervals on the base/lift pair |
| Landing is hash-bound | sixty-four payloads byte-identical; L21 ledger appended; manifest and checksums regenerated; landing receipt records post-append ledger hash |

## 5. How to use the increment

### 5.1 Listen to the rendered tracks

```bash
cd /home/erick/projects/integrated-release/tools/governed-loop/mvp5/task-b/renders
ffplay -nodisp -autoexit -loglevel error track1_arm1_unranked_2cycle.wav
ffplay -nodisp -autoexit -loglevel error track2_arm2_static_4state.wav
ffplay -nodisp -autoexit -loglevel error track3_arm3a_dynamic_q_reset.wav
ffplay -nodisp -autoexit -loglevel error track4_arm3b_dynamic_q_carried.wav
ffplay -nodisp -autoexit -loglevel error track5_equiv_base_p0.wav
ffplay -nodisp -autoexit -loglevel error track6_equiv_lifted_p7.wav
```

The MIDI files accept a DAW or a compatible synthesizer. The authoritative
listening guide is `tools/governed-loop/mvp5/task-d/EAR_VALIDATION_PROTOCOL.md`.

### 5.2 Re-run the headless bridge verification

```bash
python3 tools/governed-loop/mvp5/task-c/mvp5_task_c.py
```

This starts the read-only bridge and a local Vite server, replays the carried arm
and the equivariant pair, and writes the bridge log and task receipt. It is
headless and deterministic in frequency capture.

### 5.3 Inspect the coupled traces

```bash
sed -n '1,20p' tools/governed-loop/mvp5/task-a/traces/arm3b_dynamic_q_carried.jsonl
```

Each line is a macro or micro record. The macro records carry the legal move,
citation, gate verdict, and card score. The micro records carry the Q input,
the z-step, the next Q state, the emitted pitch class, and the projection mode.

### 5.4 Re-derive the Policy-v3 sweep

```bash
python3 tools/governed-loop/plv3_sweep.py --run
```

The predeclaration is locked before the run; the receipt records orbit totals and
the edge-set digest. The sweep uses exact integer arithmetic.

## 6. Interfaces and contracts

| Interface | Contract |
|---|---|
| Gate | `mvp2.World.gate(source, target)` returns `ACCEPT` or `REJECT` with reasons and citation; the engine never edits gate bytes |
| Planner | Native BFS over lifted `mask@phase` nodes; legal moves carry a kind, operator, and citation |
| Dynamic card | Exact integer score `W_base - alpha * visits + beta * seam_boost`; deterministic tie-breaks |
| Q overlay | `Q_z = Q_1^z` over the twelve-state traversal cycle; container membership is enforced |
| Audio | Orrery palette names, waveform, register offset, attack, release, detune, and gain are extracted and verified |
| Bridge | `window.__orreryNav` select/applyMove plus a scratch scheduler; no Orrery source edits |
| Evidence | Every artifact is SHA-256 bound in a task receipt, the staging manifest, and the landing receipt |

## 7. Quality attributes

- **Determinism.** Symbolic scoring is integer-only; audio renders re-render
  byte-identically; the headless bridge captures exact frequencies.
- **Auditability.** The chain from predeclaration to task receipt to staging
  manifest to landing receipt to ledger entry is hash-bound at every step.
- **Separation of concerns.** The gate, card, planner, Q projector, renderer, and
  bridge are independent modules with narrow interfaces.
- **Portability.** The renderer uses only the Python standard library; the
  bridge uses the existing Playwright toolchain.
- **Non-invasiveness.** The Orrery application is read-only; only generated
  projections and the manifest/checksum metadata changed during landing.

## 8. Limitations and non-claims

- The increment is overlay dynamics, not a canonical claim and not a physical
  causation claim.
- The human ear check is supporting evidence; the formal scorecard is the
  protocol artifact.
- The browser replay is hash-verified during landing rather than re-executed.
- The terminal destination of a walk is not voiced as a bar under the
  source-node micro-bar convention.
- The auxiliary prose-consistency check was red at landing for pre-existing
  closing-report fingerprint literals; it is now `PASS` under
  `ADJ-PLANNING-SEAT-20261101-PROSE-M4M5`, with both reports byte-frozen. The
  release closure is unaffected.
- The WAV renders are large binaries and should be managed deliberately in
  future releases.

## 9. Landing and release record

| Surface | Value |
|---|---|
| Opening HEAD | `ba6ae1fe2c8b31ab739c91593701177678bff18b` |
| L20 ledger | `8d0a04732370167e84b439a1a019ff6475c951ab86c258b84c79304534f2102d` |
| L21 ledger | `e74cf6a2d79e9170c6686f2fb5287043ab1dd2c41d4f9a56d62b97f766c8f1c4` |
| Ledger size | 356,466 bytes / 4,189 lines |
| Manifest after payload landing | 1,581 files / 110,455,405 bytes |
| Release closure | `418` passing checks, zero failures |
| Landing mode | Working tree; uncommitted; no tag or push |
| Prose clearance | `ADJ-PLANNING-SEAT-20261101-PROSE-M4M5`: `PASS`, three sanctioned records, twenty-seven bound fingerprints; both closing reports byte-frozen |

## 10. Next increments

1. Closed: the closing-report fingerprints are sanctioned under
   `ADJ-PLANNING-SEAT-20261101-PROSE-M4M5`; neither report was edited.
2. Record a formal Q1–Q4 adjudication if a signed listening verdict is required.
3. Decide the long-term storage policy for WAV renders.
4. Build the next macro-card or micro-overlay increment on the landed L21
   baseline without re-deriving the gate or graph.
