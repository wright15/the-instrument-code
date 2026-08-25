# Harmonic Orrery

The Orrery is a standalone Vite and Three.js application. It consumes the
read-only FastAPI `GET /nodes` contract and does not connect to Neo4j directly.

## Local development

Start the API from the repository root in one terminal:

```bash
npm run orrery:start -- --reload
```

Install and start the frontend from the repository root in another terminal:

```bash
npm install --prefix orrery
npm run orrery:dev
```

Vite proxies `/api/nodes` to `http://127.0.0.1:8000/nodes` (`orrery/vite.config.ts`). Set
`VITE_ORRERY_API_BASE` for a deployed same-origin route or a separately hosted
read-only API.

API availability: the frontend checks `GET /nodes` (`harmonic-orrery.nodes.v2`, 21 A0-A2 anchors) with
visible states for `Projection unavailable` (503) vs `Projection update required` (schema/release
mismatch) vs invalid `?anchor` vs stale local session. See `RELEASE_CHECKLIST.md` for the pinned
compatibility matrix and rollback path.

Known non-goals: no canonical topology/Court policy mutation, no global `C_H` calculation, no
`C_P`/`C_S`/`kappa_court` equivalence, no thermodynamic/teleological numeric evaluation, no direct
frontend Cypher/Neo4j writes, no accounts/multiplayer/server game state, and no generated assets
presented as canonical facts.

## Checks

```bash
npm run orrery:check
npm run orrery:catalog:check
npm run orrery:test
npm run orrery:audio:check
npm run orrery:browser:test
npm run orrery:build
npm run orrery:api:test
```

`orrery:browser:test` starts an isolated Vite server and mocks `/api/nodes`.
It covers unavailable and incompatible projection responses, shared URLs, local
progress recovery, WebGL fallback, keyboard navigation, a source-faithful modal
route/objective flow, authored scene disclosure, Court/quality scene updates,
desktop and mobile frame-time samples, mocked Web Audio controls with
keyboard and touch-emulated interactions, plus first-session onboarding, local
reset/share (anchor-only), reduced-motion, and mobile viewport checks, without
FastAPI credentials or a live Neo4j instance.

`orrery:catalog:check` verifies the bundled legal-move artifact against its
audited source inputs and validates its strict schema.

## Nodes v2 and scene presentation

`GET /nodes` currently returns `harmonic-orrery.nodes.v2`. Each anchor includes
its source-backed `pitchMask`, seven `pitchClasses`, six-entry `intervalVector`,
and `chirality`. `pitchMask` must equal the rooted `stateId`; the API derives
the pitch fields from the verified harmonic sidecar and reads chirality from the
Neo4j projection. The frontend strictly validates this versioned contract and
does not infer topology from a state ID.

Selecting an anchor composes a local scene packet with
`SCENE_RENDERER_VERSION`, state ID, and Court position as its only seed inputs.
It uses declared office color, tier, chirality, topology, Court mask, wavelength,
and a canonical landform reference noun as bounded presentation inputs. Meshes,
particles, lighting, surface patterns, and camera framing are deterministic
authored render choices, not canonical landforms, generated-world facts,
scientific simulations, or thermodynamic calculations.

The `Auto` scene-quality control selects reduced cost on coarse/mobile devices;
`Reduced` can also be selected explicitly. Quality changes only pixel-ratio,
particle-count, and surface-segment budgets, never the semantic scene packet.
Court selection remains local presentation state and is intentionally absent from
shared URLs and the API contract.

## Audio rendering

Audio is an optional, authored presentation layer. It does not create an
`AudioContext`, oscillator, sample, or audio asset request until the player
uses **Enable & play sound**. A shared URL or restored local selection remains
silent until that explicit action.

The source-bound `harmonic-orrery.audio.v1` manifest uses the current
`canonical-feature-profile-registry:0.1.1` projection release and replays the seven canonical A0
office palettes: Sun/Lydian, Moon/Ionian, Mars/Mixolydian, Mercury/Dorian,
Jupiter/Aeolian, Venus/Phrygian, and Saturn/Locrian. It uses authored C4/MIDI
60, 12-TET, A4=440 Hz register conventions. A1 and A2 anchors retain their
own displayed state identity while using their office's A0 palette.

The selected local Court position filters an office palette with its admitted
Court mask before it is voiced. The control surface exposes the source,
retained, and suppressed pitch classes so that this authored presentation
filter is visible. It never replaces an anchor's intrinsic identity.

Timbres, register choices, and percussion loops are authored choices. They do
not derive from wavelength, `C_P`, `W_A012`, or unresolved `C_H`, and make no
canonical or physical causal claim. The engine blocks playback when the live
profile-registry release does not match its manifest source.

The three self-authored, unpitched WAV loops and their MIT provenance, hashes,
and generation method are documented at `/AUDIO_ASSETS.md`. Regenerate them
with `node scripts/generate-orrery-audio-loops.mjs`; verify the checked-in
bytes with `npm run orrery:audio:check`.

Mute, pause, volume, and visual-only settings are runtime controls only. They
are intentionally not stored in the local exploration session, so no browser
reload can implicitly resume sound.

## Local exploration state

The Orrery automatically saves non-secret local exploration state under
`seven-governors.harmonic-orrery.session`. The v3 document contains the
selected and visited anchor IDs, local C0-C4 presentation history, a bounded
modal-route history, selected catalog move, completed local objectives (with
Discovery/Strategy/Learning categories), and the projection/catalog identities
needed to validate it. The known compatible pre-v2 source remains a controlled
exception: every migration must match the current projection identity, and a v3
document must also carry the published pre-v2 catalog fingerprint. Migration
never invents route history. First-session onboarding dismissal is tracked
separately under `seven-governors.harmonic-orrery.tutorial-dismissed` via
`sessionStorage` semantics (localStorage key).

Use `?anchor=<state-id>` to share one selected anchor. Visited history and the
local Court position are intentionally not included in URLs. `Copy anchor link`
and `Share anchor` produce an anchor-only URL (Web Share API when available,
otherwise clipboard `writeText` with `prompt` fallback). `Reset local Orrery`
clears only that local key and recreates a fresh session — it never touches
Neo4j, canonical data, or audio `volume`/`muted` runtime controls. Invalid links
select nothing and offer a clear-link action rather than falling back to an
arbitrary anchor.

Saved progress is discarded with an explanation when its source cannot pass that
compatibility check, or when the profile-registry release, harmonic descriptor
release/fingerprint, or bundled catalog fingerprint does not match. Unavailable
and incompatible API responses never hydrate or overwrite saved progress.

## Legal modal routes

The stable `harmonic-orrery.modal-anchor-cycles.v1` catalog is generated and
strictly bound as `harmonic-orrery.legal-moves.v2` from the mutation audit's
operator registry, application ledger, modal completion ledger, and cycle
identities. It binds every scope ID to its canonical tier, Forte family, and
office, and exposes exactly the 21 canonically projected `M` (modal-successor)
moves whose source and target are both A0-A2 anchors. These form three verified
seven-step cycles, one per tier; no generic graph edge, raw `GOVERNS`
relationship, synthesized `M^6` inverse, or `R`/`L` operation is offered by this
MVP catalog.

Move cards disclose their application and structural-edge provenance. `M` has
no declared Degree Governor, which is displayed explicitly rather than inferred.
Catalog/projection identity mismatch, an unavailable target, or a route that no
longer matches the inspected anchor fails visibly without inventing a target.

Selecting an anchor remains free inspection. A player must explicitly start a
local route, select an offered `M` move, and apply it before the route history
or objectives change. The local objectives are a seven-step modal orbit
(Strategy), one anchor in every office (Discovery), Lydian-to-Aeolian in two
modal steps (Strategy), and C0-C4 Court traversal (Learning) — each with an
explicit category badge. Objective completion is announced via `aria-live` and
persists in local history. Route history is client-side experience data only: it
never changes canonical anchor identity, office, profile, Court runtime, Neo4j,
or Mercury's authoritative ledger.

The app intentionally presents scoped `W_A012` only. It does not display or
calculate unresolved global `harmonic.C_H`, Court runtime state, or an
authoritative game ledger. The Court surface starts at C0 Major Pentatonic and
permits adjacent local presentation moves only. It renders four binary pole
dispositions in Mars, Jupiter, Venus, Saturn order; Mercury remains a C2
engine/ledger emblem, never a fifth pole, toggle, or runtime input.
