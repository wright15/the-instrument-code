# BL-020 Sprint Memo — Harmonic Debugger Foundation

**Status:** sprint artifact. No ledger entry, no evidence obligations.
Related: `plan/harmonic-comprehension-map.md`, `plan/bl-010-q-table-freeze-memo.md`,
`scrum/BACKLOG.md` BL-020/BL-021.

## What landed

| Artifact | Role |
|---|---|
| `orrery/src/path-replay.ts` | Planner: renderer, never executor. Header guard: legality comes from the committed catalog or the admitted collections, never computed here. |
| `orrery/src/audio.ts` (`replayPath`, `stopReplay`, `isReplaying`) | Thin sequencer on the existing crossfade/voicing path; new `AUDIO_REPLAY_STEP_SECONDS = 1.2`. |
| `orrery/src/main.ts`, `orrery/index.html` | Trigger controls in the route desk: Replay route sound, Replay Q orbit, Replay Andalusian cadence, Bucket overlay toggle. |
| `orrery/src/path-replay.test.ts` (+ `audio.test.ts` additions) | 11 new tests; suite 155 passed; `tsc --noEmit` clean; all catalog/bundle/field/photonic/taxonomy/d-tier checks pass; `audio:check` pass. |

Inviolables preserved: no bytes changed in `legal-moves.v2.json`, the legal-move
validator, `OFFICE_PALETTES`, `AUDIO_LOOP_ASSETS`, or the `audio.v1` guard; fail-closed
behavior untouched; route/Court state remains local experience data.

## Sonification layers

- **Cursor (base, admitted):** orbit position z <-> pitch class t_z; Orrery route hops
  voice the destination selection exactly as the existing selection path does.
- **Bucket overlay (hypothesis, opt-in, off by default):** provisional formalization =
  orbit-prefix accumulation for traversal states; the still anchor sounds the generative
  window (the pure stack). **Labeled in code and UI as hypothesis, offered not asserted.**
  The exact session-level bucket mapping was not repo-recorded; if the maintainer's
  intended rule differs, this is a sprint-priced adjustment.
- **Adjudication note (2026-09-25):** `scrum/plan/fivefold-mesh-adjudication.md` A1
  resolves the polarity question against the overlay's current rest reading. The
  keep-or-sharpen form is registry-grounded; the overlay's still-anchor-sounds-the-window
  behavior embodies the rejected polarity and is retained as the
  **counterfactual-polarity experiment** — labeled, toggleable, unasserted. No code or
  behavior change; the cursor mapping remains the admitted base.
- **Q substrate timbre:** Mercury A0 preset (Quintessence engine emblem) — authored
  presentation choice, no correspondence claim.
- **Cadence timbre:** Jupiter A0 preset (Aeolian office) — authored presentation choice.

## Seam crossing (BL-021 acceptance, first report)

The Andalusian cadence now replays as four hops: Am -> G -> F (intra-Aeolian) then
E [seam crossing] (raised seventh G#, A harmonic minor). Every chord is membership-checked
against its admitted collection (`ANDALUSIAN_AEOLIAN_COLLECTION` 7-35 /
`ANDALUSIAN_HARMONIC_MINOR_COLLECTION` 7-32, bridge admitted by CRT-302/CRT-304); the
seam hop is flagged in the trace and in the UI status line.

**What to listen for:** three chords inside one collection, then the shutters opening on
the fourth — the E major chord's G# is the only pitch outside the starting collection.
That single semitone is the seam, by construction.

## Listening verdict (pending maintainer)

CI cannot hear; the ear is the maintainer's. Recipe: **Enable & play sound**, then

1. **Replay Q orbit** with bucket overlay **off** (cursor): single tone walking
   t_z; the five-state window is heard at hop five; hop 13 returns to 0000; hop 14 is
   silence (absence of the still anchor).
2. Same with bucket overlay **on**: color accumulates; hop five completes the pentatonic
   window; hop 14 rings the pure stack (arrival).
3. **Replay Andalusian cadence**: the seam crossing above.
4. **Replay route sound** on a recorded local route: per-hop destination palettes.

Record in this memo after listening: (a) do the still-set states feel like arrivals or
absences under each mapping; (b) does any bucket behavior survive contact with the ear;
(c) does the seam throw sound like a seam.

## Findings surfaced (not repaired)

- **Pre-existing browser-harness mismatch:** `scripts/test-harmonic-orrery-browser.sh`
  asserts `[data-objective="lydian-to-aeolian"]`, while `orrery/src/objectives.ts` defines
  `lydian-to-mixolydian` (both last touched by `def7b21 ORR-409`). That scenario cannot
  pass at HEAD and is unrelated to this sprint. Untouched here; flagged for a harness fix.
- **Bucket formalization provenance:** the comprehension map's §2.1 one-line test was
  maintainer-verified in session but never repo-recorded; the provisional accumulation
  rule is this sprint's formalization, explicitly provisional.

## Timing fix (maintainer ear report)

The first listening pass found hops cutting off the sequence. Root causes and fixes:

1. **Stagger leaked into replay.** The 0.5s per-voice arpeggio (a single-selection
   habit) spread multi-note hops across seconds. Replay is now **chordal**: all voices of a
   multi-note hop share one onset, and the octave double is reserved for single-tone cursor
   hops. A bucket color is a simultaneity, not a process; arpeggio stays exclusive to
   single-selection inspection, where hearing a voicing's contents is the point.
   (`AUDIO_VOICE_STAGGER_SECONDS` retired from the replay path.)
2. **Tail cancellation.** The next hop's crossfade faded the previous hop at a fixed step
   shorter than the release tail. Replay is now **sequential**: the next tick is
   `max(stepSeconds, releaseSeconds + 0.05)`, so every scheduled onset sounds.
3. **Voice-cap eviction.** The 8-voice cap evicted future-scheduled voices, silencing the
   first onsets of large bucket hops. Eviction now removes only already-sounding voices and
   allows temporary overflow when every slot is a future onset (the cap is a resource
   guard, not a musical rule).
4. **Reserved emphasis parameter.** `ReplayVoice.emphasis` (`"none" | "seam"`) rides
   planner → engine today; the cadence's seam hop carries `"seam"`. The engine ignores it
   for now — BL-021's golden-path registration decides any onset separation/emphasis.

Onset policy is now per-mode: chordal for multi-note bucket hops, tone+octave for cursor
hops, arpeggio only for single selections. Effect: the Q orbit compacts (~13 hops, ~1s
apart) and completion-at-5 / closure-at-12 become audible **events** rather than arpeggio
blur — a direct upgrade to the listening recipe above.

## Tetrachord observation (listening finding, deferred)

The report "it would be nice to hear the cadence in its tetrachord form instead of
arpeggiated" points at vertical structure. Two candidate readings, both deferred to the
audition-mode experiment (state selector + bucket voicing + optional cursor), neither built:

1. **Tetrachord-as-voicing:** the four still-set states might sound together as one
   composite sonority when the orbit reaches rest — the engine's resting configuration as one
   chord rather than four separate tones/silences. ("What does the boundary sound like?")
2. **Tetrachord-as-structure:** if bucket mapping extends to all 16 states, the four
   still-set members' pitch sets might share enough content to hear as a family; whether they
   do or don't is itself evidence about the still set's coherence as a boundary region.

## Exit

BL-020 implementation exit met: any two connected states can be heard as a move
(catalog-backed route replay); fixtures and legality checks in tests; Q-orbit and cadence
substrates behind the same contract. BL-021's structural reading is now playable with
per-hop verification and a flagged seam; its listening verdict feeds the next sprint and
the §6(4) correspondence discussion.
