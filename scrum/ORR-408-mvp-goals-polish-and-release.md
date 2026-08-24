# ORR-408 - MVP goals, polish, and release closure

**Status:** Backlog · **Priority:** High · **Points:** 5 · **Epic:** [EPIC-009](EPIC-009-harmonic-orrery-mvp.md)
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

## Verification

- Browser-test the first-session critical path and local reset.
- Run accessibility checks, mobile viewport checks, and a manual audio review.
- Run API, frontend, and relevant root validation at a no-tracked-change fixed
  point before an MVP release claim.
