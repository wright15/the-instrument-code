# ORR-404 - Hybrid audio engine for Governor anchors

**Status:** Backlog · **Priority:** High · **Points:** 8 · **Epic:** [EPIC-009](EPIC-009-harmonic-orrery-mvp.md)
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

- Unit-test pitch-set conversion, voice allocation, and no-audio-before-gesture.
- Browser-test controls and audio-engine state with a mocked AudioContext.
- Manually review all seven A0 palettes against declared pitch sets.
