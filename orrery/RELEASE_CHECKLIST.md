# Harmonic Orrery Release Checklist — 1.7.0 MVP

Applicable to `seven-governors-integrated-release` 1.7.0. Verify at a no-tracked-change fixed point before claiming MVP release.

## 1. Data / API version compatibility

- [ ] `GET /nodes` returns `harmonic-orrery.nodes.v2` with exactly 21 A0-A2 anchors (`main.py:107,327`).
- [ ] `pitchMask === stateId`, `intervalVector` derived from 7 pitch classes, `chirality` ∈ {achiral,chiral} (`main.py:281`).
- [ ] `profileRegistryReleaseId === canonical-feature-profile-registry:0.1.1` (`orrery/src/api.ts`, `main.py:329`).
- [ ] `harmonicDescriptor.releaseId === harmonic-compression-candidate:CH_A012_q_v1:1.0.0` and `candidateFingerprint` matches `canonical/harmonic-compression-candidates/CH_A012_q_v1.json`.
- [ ] Legal-move catalog `harmonic-orrery.legal-moves.v2` (`orrery/src/generated/legal-moves.v2.json`) exposes 21 `M` moves in 3×7 cycles; `npm run orrery:catalog:check` passes.
- [ ] Incompatible projection (wrong `schemaVersion` or descriptor release) shows “Projection update required” and does not hydrate local progress (`orrery/src/main.ts:213`, `scripts/test-harmonic-orrery-browser.sh:608`).
- [ ] Unavailable projection (503) shows “Projection unavailable” and preserves saved session (`orrery/src/main.ts:201`, `scripts/test-harmonic-orrery-browser.sh:121`).

## 2. Frontend build / run

- [ ] `npm run orrery:check` (catalog + tsc) passes.
- [ ] `npm run orrery:build` produces `orrery/dist`.
- [ ] Local run: `npm run orrery:start -- --reload` (FastAPI `127.0.0.1:8000`) + `npm install --prefix orrery && npm run orrery:dev` (Vite `127.0.0.1:5173` proxy `/api`→`8000` via `orrery/vite.config.ts:8`). Set `VITE_ORRERY_API_BASE` for deployed API.
- [ ] `GET /nodes` is the only API surface; no frontend Neo4j or ledger writes.

## 3. First-session critical path (browser)

- [ ] First visit shows onboarding (`#onboarding` `orrery/index.html`) with dismiss persistence via `seven-governors.harmonic-orrery.tutorial-dismissed` (`orrery/src/session.ts:6`).
- [ ] Start → select anchor → enable audio → change Court → legal local move → complete one objective without external docs (`scrum/ORR-408:25`).
- [ ] Tutorial/help text describes theory as optional context and does not imply authored mappings are canonical/physical (`orrery/index.html` intro note + onboarding disclosure).

## 4. Local save / reset / share + visual-only fallback

- [ ] Local exploration state persists under `seven-governors.harmonic-orrery.session` v3 (`orrery/src/session.ts:5`); includes selected/visited/Court history/route/objectives + source identity.
- [ ] `Reset local Orrery` (`#reset-orrery`) clears only that key, recreates `createSession(source)` (`orrery/src/session.ts:440`), clears `?anchor`, scene, route, objectives, Court to `C0`, preserves unrelated storage; never touches Neo4j/source data (`scrum/ORR-408:29`).
- [ ] `Copy anchor link` / `Share anchor` share only `?anchor=<id>` (`orrery/src/session.ts:buildAnchorShareUrl`), never Court/route/objectives/audio. Fallback via `prompt` if clipboard unavailable; Web Share API when available.
- [ ] Visual-only mode (`#audio-visual-only`) suppresses all audio, no `AudioContext` before explicit `Enable & play sound` (`orrery/src/audio.ts:423,506`), and never auto-resumes after reload.

## 5. Accessibility, mobile, performance, error, privacy

- [ ] Keyboard: Tab reaches onboarding dismiss, anchor index (21 buttons in tier order), Court 5 controls, audio controls, reset/share/help; `Enter` activates Court and anchor selection (`scripts/test-harmonic-orrery-browser.sh:468`).
- [ ] Focus-visible ring on `button,a` and skip-link (`orrery/src/style.css:32`). Buttons ≥44 px (`orrery/src/style.css:1164` anchor, `529` Court, `330` session actions).
- [ ] `prefers-reduced-motion: reduce` disables `OrbitControls` damping (`orrery/src/scene.ts:265`) and CSS transitions (`orrery/src/style.css:1422`).
- [ ] Viewports: 320, 390, 680, 960, 1580 px; footer/header wrap at 680 px (`orrery/src/style.css:1265`).
- [ ] Performance (ORR-407 baselines): desktop reduced 33.2 ms median / 33.4 ms p95; iPhone 15 auto-reduced 16.7 ms median / 33.4 ms p95 (120-frame samples `scripts/test-harmonic-orrery-browser.sh:95`).
- [ ] Error states: 503 vs incompatible vs invalid `?anchor` vs stale session each show distinct message and recovery action (`orrery/src/main.ts:201,213,875`, `scripts/test-harmonic-orrery-browser.sh:121,602,521,551`).
- [ ] Privacy: only read-only `GET /nodes` network request; localStorage only for non-secret exploration state; no accounts/multiplayer/server-persisted game state; no raw Cypher from frontend.

## 6. Asset licenses

- [ ] Three audio loops MIT self-authored, SHA-256 documented (`orrery/public/AUDIO_ASSETS.md`), `npm run orrery:audio:check` passes.
- [ ] `three` `0.183.2` etc. MIT via `orrery/package.json`.

## 7. Test evidence

- [ ] `npm run orrery:catalog:check` — 21 moves + strict schema.
- [ ] `npm run orrery:check` — tsc noEmit.
- [ ] `npm run orrery:test` — session/objectives/moves/api/scene-composer.
- [ ] `npm run orrery:build` — vite build.
- [ ] `npm run orrery:api:test` — 6 API contract tests (`tests/test_harmonic_orrery_api.py:88`).
- [ ] `npm run orrery:browser:test` — unavailable/incompatible projection, shared URL, reload recovery, WebGL fallback, keyboard nav, modal route + invalid feedback, Court traversal, scene disclosure, frame profiles, audio controls (mocked), plus ORR-408: onboarding/reset/share/a11y/mobile.
- [ ] `npm run validate:cypher --check` and `npm run validate` (full root) pass at fixed point.

## 8. Rollback path

- [ ] Tag `seven-governors-integrated-1.7.0` on green commit; previous is `1.6.0` (`git tag`).
- [ ] To rollback: `git checkout 1.6.0 -- package.json provenance/release.json MANIFEST.json CHECKSUMS.sha256 orrery/` or `git revert` merge commit; `npm run package:manifest` to regenerate if needed.
- [ ] No Neo4j migration: release is app-layer only; Neo4j remains rebuildable projection (`scripts/bootstrap-neo4j.mjs`). No canonical package edits.

## 9. Known non-goals (not in MVP)

- Admission/alteration of canonical topology, Court policy, Governor profiles, feature registry, or frozen package data.
- Global `C_H` display/calculation or equivalence among `C_P`, `C_H`, `C_S`, `kappa_court`.
- Numeric thermodynamic/teleological registry evaluation in the Orrery.
- Direct frontend Cypher, Neo4j writes, raw query input, accounts, multiplayer, server-persisted game state.
- Generated assets presented as canonical domain facts.

## Sign-off

- Date: 2026-08-24
- Commit: `68e747f` + ORR-408
- Validated by: `npm run validate` PASS / `MANIFEST.json` + `CHECKSUMS.sha256` refreshed via `npm run package:manifest`
