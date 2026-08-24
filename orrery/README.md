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
It covers a 503 projection failure and a WebGL-disabled fallback without FastAPI
credentials or a live Neo4j instance.

The app intentionally presents scoped `W_A012` only. It does not display or
calculate unresolved global `harmonic.C_H`, Court state, or game state.
