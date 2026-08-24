# ORR-407 - Procedural scene composer

**Status:** Backlog · **Priority:** Medium · **Points:** 5 · **Epic:** [EPIC-009](EPIC-009-harmonic-orrery-mvp.md)
**Depends on:** ORR-402, ORR-405 · **Blocks:** ORR-408

## Story

As a player, I want each selected anchor and Court position to produce a
coherent procedural scene so the Orrery feels like a generative art experience
without representing rendered output as canon or physics.

## Scope

- Build scene parameters from declared presentation-safe fields: office color,
  tier, chirality, pitch mask, interval vector, Court mask, wavelength, and
  canonical landform reference nouns.
- Use deterministic local seeds derived from the selected state ID, Court
  position, and frontend renderer version.
- Render meshes, particles, light, surface pattern, and camera framing in
  Three.js.
- Label the output as an authored presentation interpretation, not a canonical
  landform assertion, scientific simulation, or generated asset registry.

## Acceptance criteria

1. Identical state, Court position, and renderer version produce the same local
   scene parameters.
2. The renderer does not infer a physical law, numeric thermodynamic value, or
   new canonical feature from source data.
3. Landform nouns remain reference-pool prompts and are never upgraded to a
   factual generated-world claim.
4. Quality controls scale particle/post-processing cost for mobile devices.
5. Scene changes are readable alongside the audio and Court controls.

## Verification

- Unit-test deterministic seed and parameter generation.
- Snapshot-test selected representative A0, A1, and A2 scene parameter packets.
- Browser-profile desktop and mobile frame time with the 21-node scene.
