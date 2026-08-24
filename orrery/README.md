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
npm run orrery:browser:test
npm run orrery:build
npm run orrery:api:test
```

`orrery:browser:test` starts an isolated Vite server and mocks `/api/nodes`.
It covers unavailable and incompatible projection responses, shared URLs, local
progress recovery, WebGL fallback, and keyboard navigation without FastAPI
credentials or a live Neo4j instance.

## Local exploration state

The Orrery automatically saves non-secret local exploration state under
`seven-governors.harmonic-orrery.session`. The versioned document contains only
the selected anchor ID, visited anchor IDs, an unset local Court placeholder,
and the source identity needed to validate it against the current projection.

Use `?anchor=<state-id>` to share one selected anchor. Visited history and the
local Court placeholder are intentionally not included in URLs. Invalid links
select nothing and offer a clear-link action rather than falling back to an
arbitrary anchor.

Saved progress is discarded with an explanation when the nodes schema,
profile-registry release, harmonic descriptor release, or descriptor fingerprint
does not match the live response. Unavailable and incompatible API responses
never hydrate or overwrite saved progress.

The app intentionally presents scoped `W_A012` only. It does not display or
calculate unresolved global `harmonic.C_H`, Court runtime state, or game state.
The HUD's Court entry is an unset local presentation placeholder; ORR-405 owns
actual C0-C4 controls.
