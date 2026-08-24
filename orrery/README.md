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

Vite proxies `/api/nodes` to `http://127.0.0.1:8000/nodes`. Set
`VITE_ORRERY_API_BASE` for a deployed same-origin route or a separately hosted
read-only API.

## Checks

```bash
npm run orrery:check
npm run orrery:test
npm run orrery:audio:check
npm run orrery:browser:test
npm run orrery:build
npm run orrery:api:test
```

`orrery:browser:test` starts an isolated Vite server and mocks `/api/nodes`.
It covers unavailable and incompatible projection responses, shared URLs, local
progress recovery, WebGL fallback, keyboard navigation, and mocked Web Audio
controls with keyboard and touch-emulated interactions, without FastAPI
credentials or a live Neo4j instance.

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
`seven-governors.harmonic-orrery.session`. The versioned document contains only
the selected anchor ID, visited anchor IDs, a local C0-C4 Court presentation
position, and the source identity needed to validate it against the current
projection. Valid v1 anchor-only sessions migrate to C0.

Use `?anchor=<state-id>` to share one selected anchor. Visited history and the
local Court position are intentionally not included in URLs. Invalid links
select nothing and offer a clear-link action rather than falling back to an
arbitrary anchor.

Saved progress is discarded with an explanation when the nodes schema,
profile-registry release, harmonic descriptor release, or descriptor fingerprint
does not match the live response. Unavailable and incompatible API responses
never hydrate or overwrite saved progress.

The app intentionally presents scoped `W_A012` only. It does not display or
calculate unresolved global `harmonic.C_H`, Court runtime state, or game state.
The Court surface starts at C0 Major Pentatonic and permits adjacent local
presentation moves only. It renders four binary pole dispositions in Mars,
Jupiter, Venus, Saturn order; Mercury remains a C2 engine/ledger emblem, never
a fifth pole, toggle, or runtime input.
