# BL-053 green release — memo

**Status:** landed 2026-10-13. The project's first green release:
`seven-governors-integrated-1.9.0`, `validated_admitted`, full
`npm run validate` at a fixed point (integrated receipt 418/0). ENTRY 21
records the landing; the closure receipt is
[`qa/specs/bl-053-green-release.json`](../../qa/specs/bl-053-green-release.json).

## 1. What the release gate was

`validate:release` had stood at 416/2 since its first observation (BL-070),
reproduced on clean worktrees across landings. The planning pass (BL-083)
grounded the stop mechanically —
[`qa/specs/bl-083-416-2-grounding.json`](../../qa/specs/bl-083-416-2-grounding.json):

- **Q1 — `frozen composite package payload identities`.** Spec drift, not
  payload drift: the exclusion-rule change at `67dcd14` added
  `__pycache__`/`.pytest_cache` to the frozen-payload walk without
  re-canonicalizing two expectations; the delta is exclusively `.pyc` bytecode
  (ephemeral caches baked into the old expectations, inherently
  unreproducible); zero tracked-file change in either package since `4ea389a`.
- **Q2 — `declared full-database reproducibility and deployment evidence`.**
  The retained 1.8.1 deployment receipt had been overwritten by a dev-cycle
  run (`67dcd14`); the retained baseline is release-stamped by design, so no
  development cycle can verify against it. The baseline lifecycle was a
  maintainer ruling.

## 2. The rulings and the resolution

OD-083-1 re-baseline to 1.9.0 (GOV-501 precedent); OD-083-2 superseded but
cited; OD-083-3 Q1 as housekeeping with the root cause in the commit message.

- **R1 (commit `1b19d2f`).** The two expectations recomputed under the landed
  rule (`3bf5f181…`/`a2ca5141…` → `1f5b656e…`/`3d4f3b65…`), walker-verified
  tracked-only, manifest-convention aligned.
- **R2.** Version flip to `1.9.0` (`validated_admitted`, 2026-10-13); fresh
  native reproducibility capture and disposable-local bootstrap/roundtrip on
  independent instances, both producing snapshot `5d26a803…`; baseline
  re-stamped (`current_release_baseline`, retained release id = own release
  id); receipts PASS (native 6/0; deployment 3/0; credentials excluded; the
  same 148-path evidence list); the 1.8.1 fingerprint `fd089ea9…` cited as
  lineage.
- **Payload byte-identity.** Against the retained 1.8.1 baseline, the six
  projected payload namespaces (`topology`, `mutation`, `semantic`,
  `governorRuntime`, `court`, `gov210`) are byte-identical; only `provenance`
  changes (it carries the release identity); counts unchanged at 3061/10506.
  The re-baseline is a release-state update, not a data change.
- **Cascade.** ENTRY 21 appended first, then the ledger-bound cascade
  regenerated (twin-hub 30/30 `5d0c5eef…`; census 24/24 `3234257c…`;
  shadow-ladder 37/37 `315bc72f…`; d-shadow 19/19 `021afb83…`; promotion
  evidence `5ae56d69…`; pentatonic audit + phase reports + closure `46f36a6c…`
  refreshed in dependency order after the SOURCE_AUTHORITY baseline-row
  update), plus the downstream field-derivation/taxonomy/D-tier projections;
  payload projections unchanged.

## 3. The prose gate

The release's remaining pre-existing stop was `validate:prose-consistency`
(20 violations, unchanged since BL-051/052). Resolution: 19 scrum fingerprint
literals re-bound by context (line reflows and section-heading SHA-256
markers; no semantic change) and 1 docs test-count claim historical-qualified
(`docs/ARCHITECTURE_MAP.md`). The validator is now PASS with 0 violations.

## 4. Ceremony

Atomic landing: version flip (`package.json`, `package-lock.json`,
`provenance/release.json`), regenerated receipts and inventories, release
notes (1.9.0), ENTRY 21 end-append (ENTRY 10 fence re-verified
`201efe81…`/`50b8b73f…`; prefix preservation proven: first 227,499 bytes =
`a53a7fa9…`), the maintenance re-verification addendum
(`docs/ARCHITECTURE_MAP.md` §7), the consumption-index row
(`scrum/plan/harmonic-comprehension-map.md` §4), backlog status + revision
row v1.60, closure receipt, and this memo. Point-(c): the landing's own bytes
are hash-attested by the root inventories in the same commit; the landing
commit hash is confirmed post-commit in the session record.

## 5. Verification

35 focused tests (twin-hub/census/shadow-ladder/promotion evidence) +
11 (shadow-ladder/d-shadow) + 12 (pentatonic parent audit); `orrery:check`
exit 0; `validate:ledger-pins` PASS; `validate:evidence` advisory run;
`validate:manifest` PASS; full `npm run validate` green with the integrated
receipt PASS 418/0. Environment note: the chain was run with the project venv
on PATH (the harmonic-invariant validator requires `referencing`), and the
deployment receipt on the repository's disposable-local Neo4j harness (the
configured server's import directory is not writable by the build user; the
governed path matches the GOV-501 precedent).

## 6. Fences

No claim event; no record amendment (ENTRY 10/15/16/17/18/19/20 byte-untouched);
no GOVERNS admission; no INV-5 graduation; no M-walkability promotion; no
directional-semantics assignment; no G1 movement; no semantic registration
beyond the release's own housekeeping; D4 `derivable-from-derived-inputs` and
the historical `not_derived` record unchanged; D7 hypothesis-tier unchanged.
The release ships the framework with the scoping memo's higher-theorem
question formally stated, not answered. The research continues after.
