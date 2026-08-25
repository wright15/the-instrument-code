# ORR-408 - MVP goals, polish, and release closure

**Status:** Done · **Priority:** High · **Points:** 5 · **Epic:** [EPIC-009](EPIC-009-harmonic-orrery-mvp.md)
**Depends on:** ORR-403, ORR-404, ORR-406, ORR-407 · **Blocks:** -

## Story

As a first-time player, I want a coherent beginning, ending, and safe recovery
path so the Orrery can be shared as an MVP rather than only demonstrated by its
developers.

## Scope

- Add a short first-session introduction and contextual tooltips.
- Present discovery, strategy, and learning objectives with clear completion
  conditions.
- Add local save/reset/share behavior and a visual-only fallback.
- Complete accessibility, mobile, performance, error, privacy, and asset-license
  review.
- Document local setup, API availability checks, frontend build/run commands,
  and known non-goals.

## Acceptance criteria

1. A player can start, select an anchor, enable audio, change Court presentation,
   make a legal local move, and complete one objective without external docs.
2. Tutorial text describes theory as optional context and does not imply that
   authored audiovisual mappings are canonical or physical facts.
3. Reset clears only local Orrery state; it never affects Neo4j or source data.
4. Core flow works on supported mobile and desktop viewports with keyboard,
   pointer, and reduced-motion support.
5. The release checklist includes data/API version compatibility, asset licenses,
   test evidence, and a clear rollback path.

## Implementation record

- [x] Add first-session onboarding (`#onboarding`) with dismiss persistence via `seven-governors.harmonic-orrery.tutorial-dismissed` and optional-theory disclosure; add contextual `?` tooltips for session, moves, Court, audio, and scene.
- [x] Add discovery/strategy/learning categories to `LOCAL_OBJECTIVE_IDS` with badge rendering and `aria-live` completion announcements; preserve local-only scoring.
- [x] Add `Reset local Orrery` (clears only `seven-governors.harmonic-orrery.session`, recreates `createSession`, clears `?anchor`, scene/route/objectives/Court to `C0`; excludes audio `volume`/`muted`; never touches Neo4j) and anchor-only `Copy anchor link` / `Share anchor` (Web Share API → clipboard → prompt fallback).
- [x] Preserve visual-only fallback (`audio.ts:506`); onboarding and help text state that timbres/loops/meshes are authored presentation, not canon/physics/`C_H`.
- [x] Complete a11y/mobile/perf/error/privacy/asset-license polish: skip-link, 44 px targets, focus-visible, `prefers-reduced-motion` damping + CSS, responsive 320–1580 px, distinct 503/incompatible/invalid-anchor/stale-session states, local-only privacy, MIT loops via `AUDIO_ASSETS.md`.
- [x] Document local setup, `GET /nodes` availability, frontend build/run, and known non-goals in `orrery/README.md` and `orrery/RELEASE_CHECKLIST.md`; bump integrated release to `1.7.0` and refresh `MANIFEST.json`/`CHECKSUMS.sha256`.

## Verification

- Browser-test the first-session critical path and local reset.
- Run accessibility checks, mobile viewport checks, and a manual audio review.
- Run API, frontend, and relevant root validation at a no-tracked-change fixed
  point before an MVP release claim.

Implemented verification:

- `npm run orrery:catalog:check`, `npm run orrery:check`, `npm run orrery:test`, `npm run orrery:build`, `npm run orrery:api:test`
- `npm run orrery:browser:test` (first-session + onboarding, Court/audio/route path, anchor-only share, local reset preserves unrelated storage, axe/mobile/reduced-motion/visual-only, plus prior 503/incompatible/shared-URL/WebGL fallback suites)
- `npm run validate:cypher` and `npm run validate` at fixed point; `npm run package:manifest` for `1.7.0`
