# ORR-404 - Hybrid audio engine for Governor anchors

**Status:** Done · **Priority:** High · **Points:** 8 · **Epic:** [EPIC-009](EPIC-009-harmonic-orrery-mvp.md)
**Depends on:** ORR-402 · **Blocks:** ORR-405, ORR-406, ORR-408

## Story

As a player, I want each Governor anchor to sound distinct through a controlled
mix of Web Audio synthesis and authored loop assets so the harmonic structure is
felt as well as seen.

## Scope

- Add an audio engine that starts only after an explicit user gesture.
- Use the seven canonical A0 modes as the source pitch palettes: Lydian, Ionian,
  Mixolydian, Dorian, Aeolian, Phrygian, and Locrian.
- Provide authored, versioned timbre presets for the seven offices and a small
  licensed/self-authored percussion-loop bank.
- Render exact pitch-class and mode changes as audio events; do not claim the
  resulting timbre is canonically implied by a Governor profile.
- Provide mute, volume, pause, and reduced-sensory controls.

## Implementation record

- [x] Add the source-bound `harmonic-orrery.audio.v1` presentation manifest with
      the seven declared A0 palettes, C4/MIDI 60 root, and 12-TET/A4=440 Hz
      register convention.
- [x] Create Web Audio only after explicit enablement; URL/local-session
      restoration records the selected palette without requesting or playing
      audio.
- [x] Preserve A1/A2 selected-state identity while inheriting the corresponding
      office A0 palette, with visible disclosure in the inspector.
- [x] Add versioned authored office timbre presets and three self-authored,
      deterministic MIT WAV loops with SHA-256 provenance documentation and a
      reproducibility check.
- [x] Provide source-release guarding, deterministic sequential preload,
      degraded-loop handling, bounded synthesis voices, mute, pause, gain, and
      visual-only controls without persisting audio preferences in local session
      data.
- [x] Add unit coverage for pitch conversion, source guarding, inheritance,
      voice allocation, pre-gesture silence, and degraded assets; add mocked
      browser coverage for every A0 palette plus keyboard and touch-emulated
      controls.

## Acceptance criteria

1. No audio context, oscillator, sample, or network audio request begins before
   an explicit play action.
2. Selecting each A0 anchor produces only pitches from its declared canonical
   pitch set under a documented root/register convention.
3. A1/A2 anchors inherit their office palette while retaining their own displayed
   state identity; they do not overwrite the canonical A0 mode identity.
4. All assets have provenance/licensing metadata and deterministic preload/error
   behavior.
5. Mute, pause, gain, and visual-only modes work with keyboard and touch input.

## Verification

- `npm run orrery:audio:check`
- `npm run orrery:check`
- `npm run orrery:test` (16 tests)
- `npm run orrery:build`
- `npm run orrery:api:test` (6 tests)
- `npm run orrery:browser:test` (mocked AudioContext, all A0 palettes, keyboard,
  and touch-emulated controls)
