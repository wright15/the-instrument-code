# ORR-402 - Three-dimensional anchor Orrery

**Status:** Done · **Priority:** High · **Points:** 8 · **Epic:** [EPIC-009](EPIC-009-harmonic-orrery-mvp.md)
**Depends on:** ORR-401 · **Blocks:** ORR-403, ORR-404, ORR-407

## Story

As a player, I want to enter a legible 3D map of the 21 A0-A2 anchors so I can
see the Governor offices, tier structure, and harmonic positions before making
any game decision.

## Scope

- Create the standalone `orrery/` frontend boundary using TypeScript, Vite, and
  Three.js.
- Fetch and schema-check `/nodes` before creating scene objects.
- Render all 21 anchors with office color, tier shape, orbit position, labels,
  camera controls, and a selected-node highlight.
- Use a deterministic layout derived only from returned tier, office index, and
  exact local layout constants; no force simulation or random placement.
- Provide a non-WebGL status/fallback view and responsive controls.

## Implementation record

- [x] Create the standalone `orrery/` Vite, TypeScript, and Three.js package.
- [x] Proxy local `/api/nodes` requests through Vite so browser code never holds
      Neo4j credentials or requires a direct cross-origin request.
- [x] Validate and normalize `harmonic-orrery.nodes.v1` before rendering the
      21-node scene.
- [x] Render deterministic A0/A1/A2 radial depth bands with icosahedron,
      octahedron, and tetrahedron anchors, canonical office colors, pointer
      camera controls, and direct 3D selection.
- [x] Add keyboard-reachable anchor controls, an inspector, live API/error
      states, reduced-motion-safe camera behavior, and a non-WebGL fallback.
- [x] Add unit coverage for response validation and deterministic layout.
- [x] Verify the live projection, 21 rendered anchors, selection update, and a
      390px viewport with `playwright-cli`.
- [x] Add automated browser coverage for API-unavailable and non-WebGL fallback
      states before moving this story to Done.

## Acceptance criteria

1. The scene renders exactly 7 anchors per tier and exactly 21 total.
2. A0, A1, and A2 have visually distinct, accessible shapes and depth bands;
   each office uses the canonical profile color.
3. Node selection exposes state ID, name, tier, office, `W_A012`, wavelength,
   and canonical landform references without inventing semantic effects.
4. The scene has no dependency on raw Cypher, a browser-held Neo4j credential,
   or static copied canonical data.
5. A reduced-motion path removes continuous spin/camera movement, and keyboard
   selection reaches every anchor.

## Verification

- Unit-test data normalization and deterministic layout coordinates.
- Browser-test 21 rendered anchors, one selected anchor, fetch failure state,
  keyboard navigation, and narrow viewport behavior.
- Validate the application build twice for deterministic generated layout data.
- `npm run orrery:browser:test` mocks a 503 response and a renderer-unavailable
  WebGL context, then verifies visible failure/fallback states and keyboard
  selection without FastAPI credentials or Neo4j.
