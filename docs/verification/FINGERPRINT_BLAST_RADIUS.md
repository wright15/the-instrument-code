# Fingerprint Blast-Radius Map — planning artifact

This map predicts which pins regenerate when a source file changes. It is not a
validator; it is incident hygiene.

## Taxonomy Additions

| Artifact / Consumer | Inputs And Rebuild Path | Affected Evidence |
|---|---|---|
| `orrery/src/generated/taxonomy-read-model.v1.json` | `scripts/build-orrery-taxonomy-read-model.mjs`, canonical heptatonic ledger and network; optional twin-hub and fifth-space evidence bindings. Run the builder, then `npm run orrery:taxonomy:check`. | D-tier dataset, runtime source/identity checks, explanation source links, taxonomy builder/unit/browser tests |
| `orrery/src/generated/d-tier-taxonomy-dataset.v1.json` | Rebuild taxonomy first, then `scripts/build-orrery-d-tier-taxonomy-dataset.mjs` from taxonomy identities and fifth-space census. Run `npm run orrery:d-tier:check`. | D-tier fallback and measurement checks, taxonomy explanations, focused browser receipt |
| `orrery/src/taxonomy-explain.ts` and rendered source assets | Canonical ledger/network, fifth-space and optional twin-hub source assets via fixed URL allowlist; model evidence bindings. Rebuild with `npm run orrery:build`. | `qa/post-d5-taxonomy-browser-receipt.json` must be rerun/rebound on tested source changes; stored hashes are not self-refreshing |
| `orrery/src/generated/field-derivation-bundle.v1.json` | Existing field-derivation builder, twin-hub/census artifacts and QA bindings; `npm run orrery:field-derivation:build` then `npm run orrery:field-derivation:check`. | `qa/orrery-field-derivation-bundle-validation.json`; not the outcome-agnostic taxonomy explanation contract |

All changed files also affect `MANIFEST.json` and `CHECKSUMS.sha256`. Packaging
binds bytes, not story acceptance or research authority. Changed ledgers require
upstream sidecar freshness review before rebuilding these UI projections; no
consumer rebuild authorizes changing a research verdict. Run unit, type, builder,
and browser checks after the ordered rebuild, then the release fixed-point gates.

## Existing Map

| artifact (pinned) | source-file closure | affected pins (release/qa) |
|---|---|---|
| `CH_A012_q_v1.json` (`GOV-213`) `b2e57…` | `src/governor/harmonic_compression.py`, `src/governor/certificate_verifier.py`, `court-mathematics/src/court_mathematics/triads.py`, `canonical/universal-heptatonic-ledger.json`, `docs/A_TIER_TRIADIC_COMPRESSION_THEOREM.md`, `seven-governors-harmonic-invariants…/compression-namespace-guard.json` | `provenance/release.json:GOV-213`, `scripts/validate-release.mjs:GOV-213`, `qa/harmonic-compression-candidates-validation.json` |
| `CH_D17_q_v2.json` (`GOV-227`) `c0781…` | above `CH_A012` **plus** `src/governor/harmonic_compression_d_tier.py`, `docs/D_TIER…`, `docs/MATHEMATICAL_REALIZATION_SPECIFICATION.md`, `scrum/GOV-227-d-tier-harmonic-compression-audit.md` | `provenance/release.json:GOV-227`, `scripts/validate-release.mjs:GOV-227`, `qa/d-tier…`, `tests/test_gov_227` (A-tier pin) |
| `tiered-photonic-v1.json` (`GOV-2XX`) `a05b0…` | `src/governor/tiered_photonic.py`, `canonical/universal-network-data.json` (28 `constructionEdges`), `schemas/governors.yaml` (7 λ), `photonic-records.json` (c/h), `docs/TIERED_PHOTONIC_THEOREM.md` | `provenance/release.json:GOV-2XX`, `scripts/validate-release.mjs:GOV-2XX`, `qa/tiered-photonic…` |
| `pentatonic-7-35-parent-audit-v1.json` `2940…` | `docs/PENTATONIC_GRAPH_BINDING_AUDIT_SPEC.md`, `seven-governors-court-substrate…/pentatonic-registry.json`, `complement-map.json`, `court-rooted-positions.json`, `bridge-rootings.json`, `canonical/universal-network-data.json`, `schemas/governors.yaml`, `court-mathematics/docs/01_COURT_LEXICON.md`, `provenance/SOURCE_AUTHORITY.md` | `qa/pentatonic-7-35-parent-audit-validation.json`, `qa/pentatonic-binding-audit-closure.json`, `qa/pentatonic-binding-audit-neo4j-validation.json`, `tests/pentatonic_binding_audit/neo4j-live.test.mjs` (`ce670→2940`) |
| `pentatonic-binding-audit-closure.json` | above audit + `qa/pentatonic-7-35…`, `qa/pentatonic-binding-audit-neo4j…`, `qa/neo4j-cypher-syntax-report.json`, `provenance/pentatonic-set-class-admission-backlog.json`, `provenance/SOURCE_AUTHORITY.md`, `provenance/DECISION_LEDGER.md` (self-healing pin), `docs/verification/PENTATONIC_GRAPH_BINDING_AUDIT_REPORT.md` | `scripts/validate-release.mjs:pentatonic closure` |
| `shadow-ladder-v0.json` (Emission 2) | canonical heptatonic ledger, network `CONSTRUCTS` edges, pentatonic audit, Court rooted positions, `provenance/OBSERVATION_LEDGER.md`, `provenance/DECISION_LEDGER.md` | `qa/shadow-ladder-validation.json`, release shadow gate, `provenance/OBSERVATION_LEDGER.md` (but DAG: ledger entries fingerprint-free, sidecar pins ledger) |
| `twin-hub-convergence-v0.json` (`GOV-510`) | `src/governor/twin_hub_convergence.py` **plus** `src/governor/shadow_ladder.py` (`transpose_mask`), canonical heptatonic ledger, network `SEAT_CONTACT`/`GOVERNS`/`CONSTRUCTS` edges, `provenance/DECISION_LEDGER.md`, `provenance/OBSERVATION_LEDGER.md` | `qa/twin-hub-convergence-validation.json`, `tests/test_twin_hub_convergence.py` |
| `fifth-space-census-v0.json` (`GOV-511`) | `src/governor/fifth_space_census.py` **plus** `src/governor/shadow_ladder.py` (`FIFTH_POS`/`fifth_span`/`fifth_arc`), canonical heptatonic ledger, network `GOVERNS` edges, Court rooted positions, `provenance/DECISION_LEDGER.md`, `provenance/OBSERVATION_LEDGER.md` | `qa/fifth-space-census-validation.json`, `tests/test_fifth_space_census.py` |
| `evidence-bundle.v1.json` (`ORR-511`) | `scripts/build-orrery-evidence-bundle.mjs`, `canonical/harmonic-compression-candidates/CH_A012_q_v1.json`, `orrery/src/generated/legal-moves.v2.json`, `docs/A_TIER_TRIADIC_COMPRESSION_THEOREM.md`, `schemas/governors.yaml` | `qa/orrery-evidence-bundle-validation.json`, `orrery/src/evidence-bundle.test.ts` |
| `fivefold-engine-promotion-evidence.json` (`CRT-348`) | `provenance/DECISION_LEDGER.md` via generated top-level `decisionLedgerSha256`; builder snapshots the live bytes and rejects concurrent drift, validator compares the artifact pin and check record against live bytes | `npm run build:fivefold-engine-promotion-evidence` then `npm run validate:fivefold-engine-promotion-evidence`; historical admission-release pins are not silently refreshed; `tests/test_fivefold_engine_promotion_evidence.py` and `npm run validate:ledger-pins` |
| `fivefold-capability-teleology-v1.json` | `provenance/SOURCE_AUTHORITY.md` (known stale since the 1.9.0-dev cycle open; regeneration queued — see NEXT_STEPS) | `qa/fivefold-capability-teleology-validation.json`, `tests/test_fivefold_capability_teleology.py` |
| `DECISION_LEDGER.md` / `OBSERVATION_LEDGER.md` | none (append-only, fingerprint-free entries for Emission 2) | `qa/pentatonic-binding-audit-closure.json` (pins `DECISION_LEDGER` sha), `canonical/fivefold-incubator/shadow-ladder-v0.json`, `canonical/fivefold-incubator/twin-hub-convergence-v0.json`, `canonical/fivefold-incubator/fifth-space-census-v0.json` (each pins both ledgers) — **DAG: ledger → sidecar, never sidecar → ledger** |

**1.8.0 collateral:** editing the GOV-213 theorem and verifier regenerated `CH_A012` → `CH_D17` via shared A-tier pin `2c6ff…`/`16_008` — predicted by row 1→2 above. Future ledger edits regenerate the pentatonic closure through its self-healing pin, not a hard-coded constant.
