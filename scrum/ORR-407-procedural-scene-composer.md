# ORR-407 - Procedural scene composer

**Status:** Done · **Priority:** Medium · **Points:** 5 · **Epic:** [EPIC-009](EPIC-009-harmonic-orrery-mvp.md)
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

## Implementation record

- [x] Version `GET /nodes` as `harmonic-orrery.nodes.v2` with source-backed
      pitch mask/classes, interval vector, and Neo4j chirality; regenerate the
      legal-move binding as `harmonic-orrery.legal-moves.v2`.
- [x] Add the pure `scene-composer.ts` packet builder with a deterministic seed
      limited to renderer version, state ID, and Court position.
- [x] Render disposable selected-anchor meshes, particles, lighting, surface
      patterns, and camera framing from that packet in Three.js.
- [x] Add explicit authored-presentation disclosure, Court-linked scene updates,
      and Auto/Reduced quality controls that alter only render budgets.
- [x] Preserve only source-compatible pre-v2 local sessions; reject unknown
      projection or catalog identities without hydrating local progress.

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

- `npm run orrery:catalog:check`, `npm run orrery:check`, `npm run orrery:test`,
  `npm run orrery:build`, `npm run orrery:api:test`,
  `npm run orrery:browser:test`, and `npm run validate:cypher` pass.
- Unit tests cover deterministic seed/packet generation, exact v2 topology
  validation, source-compatible session migration, and representative A0/A1/A2
  packet snapshots for `2773`, `1749`, and `1493`.
- Browser coverage verifies disclosure, Court-linked composition, Auto/Reduced
  quality behavior, and 120-frame samples: desktop reduced quality measured
  33.2 ms median / 33.4 ms p95; iPhone 15 auto-reduced measured 16.7 ms median
  / 33.4 ms p95.
