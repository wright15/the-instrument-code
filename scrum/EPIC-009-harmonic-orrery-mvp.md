# EPIC-009 - Harmonic Orrery MVP

**Status:** In Progress · **Priority:** High · **Owner:** Harmonic Orrery application workstream
**Epic ID:** EPIC-009 · **Target:** A read-only generative strategy, art, and music prototype
**Stories:** [ORR-401](ORR-401-orrery-api-foundation.md),
[ORR-402](ORR-402-three-dimensional-anchor-orrery.md),
[ORR-403](ORR-403-anchor-interaction-and-session-state.md),
[ORR-404](ORR-404-hybrid-audio-engine.md),
[ORR-405](ORR-405-court-control-surface.md),
[ORR-406](ORR-406-legal-move-game-loop.md),
[ORR-407](ORR-407-procedural-scene-composer.md), and
[ORR-408](ORR-408-mvp-goals-polish-and-release.md)

## Problem statement

The release has a verified harmonic topology, a 21-anchor scoped harmonic
descriptor, canonical Governor profiles, Court runtime, Neo4j projection, and
reference visualizations. It does not yet offer a focused experience that lets a
player see, hear, and navigate the system without first learning its internal
vocabulary or using graph tooling directly.

The Harmonic Orrery is an application-layer MVP. It makes the admitted,
read-only data legible through a 3D anchor map, authored audio and visual
rendering rules, a local player session, and constrained game objectives. It
does not promote new canon, execute physics, mutate the Governor graph, or turn
proposed semantic mappings into authority.

## Goal

Ship a desktop and mobile-friendly web experience in which a player can:

1. enter a 3D view of the 21 A0-A2 anchors;
2. inspect each anchor's Governor, wavelength, landform reference pool, and
   exact `W_A012` ratio;
3. hear an authored hybrid musical response based on the current Governor and
   Court position;
4. explore only explicitly catalogued legal moves in a local session; and
5. complete small strategy, discovery, and learning goals without changing the
   canonical graph or runtime authority.

## Current foundation

[ORR-401](ORR-401-orrery-api-foundation.md) provides the current foundation:

```text
Canonical sources and scoped harmonic sidecar
                    |
                    v
              Neo4j read projection
                    |
                    v
       FastAPI GET /nodes (21 A0-A2 anchors)
                    |
                    v
       Orrery frontend and local-only session state
```

`GET /nodes` returns only verified read data. Its harmonic number is the scoped
`harmonic.CH_A012_q_v1.weightedProjection`, represented as an exact ratio. It
is not global `harmonic.C_H`, which remains unresolved and null.

## Court contract for the experience layer

The frontend must replay the Court exactly and must not invent a fifth binary
pole.

| Position | Emblem / Governor | 5-35 identity | Mask | Local experience role |
|---|---|---|---:|---|
| C0 | Fire / Mars | Major Pentatonic | 661 | electric seed; open entry state |
| C1 | Air / Jupiter | Scottish Pentatonic | 677 | suspended horizon; expansion |
| C2 | Quintessence / Mercury | Qing Yu | 1189 | engine hinge; transductive pivot |
| C3 | Water / Venus | Minor Pentatonic | 1193 | inward cohesion; coupling |
| C4 | Earth / Saturn | Man Gong | 1321 | magnetic terminus; fixation |

Mars, Jupiter, Venus, and Saturn are the four binary Court poles. Mercury is
the engine and ledger interface: `is_binary_court_pole: false`, no pole index,
and no fifth toggle. C2 is a canonical Court position and an authored Mercury
emblem, not an additional register bit.

## Scope

**In:**

- A standalone Three.js frontend under a new `orrery/` application boundary.
- The existing FastAPI service and exact read-only endpoint contract.
- Local-only player/session state using URL state and localStorage.
- Web Audio API synthesis plus licensed or self-authored loop assets.
- Read-only Court presentation, constrained move exploration, visual scene
  composition, small goals, and subtle theory explanations.
- Accessibility, performance, mobile layout, browser tests, and deployment
  documentation for the MVP.

**Out:**

- Admission or alteration of canonical topology, Court policy, Governor
  profiles, feature registry records, or frozen package data.
- A global `C_H`, physical quantity claim, or equivalence among `C_P`, `C_H`,
  `C_S`, and `kappa_court`.
- Numeric evaluation of proposed thermodynamic or teleological registries.
- Direct frontend Cypher, Neo4j writes, raw query input, accounts, multiplayer,
  or server-persisted game state in the MVP.
- Generated assets presented as canonical domain facts or evidence.

## Success criteria

- **SC-1 - Data fidelity:** the 3D view consumes the versioned `/nodes`
  response, renders exactly 21 anchors, and fails visibly rather than silently
  substituting invented data.
- **SC-2 - Authority safety:** player activity stays in a local experience
  session. It never writes Neo4j, `ScaleState`, office assignments, Court
  runtime state, policy, or ledger entries.
- **SC-3 - Harmonic clarity:** every heard pitch set and displayed Court label
  replays an admitted source mask and keeps `W_A012` distinct from global
  `C_H`.
- **SC-4 - Court fidelity:** C0-C4 are rendered in canonical order, with only
  four toggleable elemental poles and Mercury visibly treated as the engine.
- **SC-5 - Playability:** a first-time player can select an anchor, understand
  a legal next action, make a local move, and receive visual/audio feedback in
  one short session.
- **SC-6 - Presentation:** desktop and mobile renders are responsive, keyboard
  reachable, reduced-motion aware, and start audio only after a user gesture.
- **SC-7 - Verification:** API contract tests, frontend unit tests, browser
  checks, and relevant root validation pass before an MVP release claim.

## Sequencing

```text
ORR-401
   |
   v
ORR-402 -> ORR-403 -> ORR-406 -> ORR-408
   |            |         ^
   v            v         |
ORR-404 ------> ORR-405 --+
   |
   v
ORR-407 ------------------> ORR-408
```

The 3D, local-session, audio, Court presentation, and legal-move contracts are
stable. The immediate next story is
[ORR-407](ORR-407-procedural-scene-composer.md).

## Definition of done

All eight stories meet their acceptance criteria. The project has a repeatable
local startup path, a release-pinned data contract, an accessible browser
experience, deterministic local-session serialization, and evidence that the
application cannot mutate upstream authority. Packaging work refreshes the
manifest/checksums only when the application is intentionally included in a
release artifact.
