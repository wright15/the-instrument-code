# ORR-401 - Orrery API foundation and local developer runtime

**Status:** Done · **Priority:** High · **Points:** 5 · **Epic:** [EPIC-009](EPIC-009-harmonic-orrery-mvp.md)
**Depends on:** GOV-206, GOV-213, active Neo4j projection · **Blocks:** ORR-402

## Story

As an Orrery frontend, I need a small, strict, read-only API that exposes the
21 A0-A2 anchors with their office-scoped visual and landform data, so the
experience can render live canonical data without treating Neo4j as an authoring
surface.

## Completed implementation

- [x] Add `main.py` with FastAPI `GET /nodes`.
- [x] Query A0-A2 anchors through office, profile, photonic, and landform
      relationships only.
- [x] Load and verify `CH_A012_q_v1`; emit exact `weightedProjection` ratios
      under `harmonic.CH_A012_q_v1`.
- [x] Add `schemas/harmonic-orrery-nodes.schema.json` and focused API tests.
- [x] Add a project-local virtualenv launcher at
      `scripts/run-harmonic-orrery.sh` and `npm run orrery:start`.
- [x] Add a reproducible development-test launcher at
      `scripts/test-harmonic-orrery.sh` and `npm run orrery:api:test`.
- [x] Verify live `/nodes` data against the active WSL Neo4j projection.

## Release boundary

`orrery/README.md` records the local frontend/API contract. Refreshing the root
manifest and checksums is intentionally deferred until the application is part
of an integrated release; this story does not change the current 1.6.0 release
identity.

## Acceptance criteria

1. `/nodes` returns exactly 21 anchors in tiers A0, A1, and A2, or returns a
   structured availability failure.
2. Every record has state identity, office, photonic wavelength and `C_P`, the
   canonical profile landform array, and exact `W_A012` ratio data.
3. The response does not expose global `C_H` as numeric, raw Cypher, server
   credentials, validation tokens, or Court pole/toggle data.
4. The endpoint rejects a projection whose 21 IDs, tier, office, or profile
   relationships do not agree with the verified sidecar.
5. The service uses a project-local virtual environment and does not require
   `pip --break-system-packages`.

## Verification

```bash
npm run check:neo4j
npm run orrery:start -- --reload
npm run orrery:api:test
```

## Boundary

This story is a read-only application adapter. It neither imports nor rebuilds
Neo4j data, and it does not add a game write path.
