# GOV-206 — Neo4j read projection and bounded context queries

**Status:** Done · **Priority:** High · **Points:** 5 · **Epic:** [EPIC-002](EPIC-002-governor-domain-agent-runtime.md)
**Depends on:** GOV-203 · **Blocks:** GOV-207, GOV-209

## Story

As a local-agent orchestrator, I want fast named graph queries over typed
aspects, rules, evidence, and verified runtime snapshots, so the model can
retrieve exact context without making Neo4j an authority or writing raw Cypher.

## Context

Neo4j is already a rebuildable projection of canonical topology, mutation,
profiles, and provenance. The current local `/api/query` accepts raw read
Cypher and is suitable for development exploration, not for constrained agent
skills. Runtime classification and replay must remain identical when Neo4j is
offline or deleted.

## Tasks

- [x] Add constraints/indexes and projection records for TypedAspect,
      BridgeRule, ClassificationEvidence, RuntimePolicyRelease, and verified
      LedgerSnapshot using stable logical IDs.
- [x] Generate imports only from canonical policy/results and verified ledger
      snapshots; never project live mutable authority directly.
- [x] Add parameterized named queries for aspect context, Governor profile,
      rule explanation, legal-move context, provenance path, and prior verified
      outcomes.
- [x] Expose an allow-listed query-catalog API with strict request schemas,
      parameter types, row/byte/depth/time limits, and scalar/tabular support.
- [x] Keep raw `/api/query` development-only or otherwise inaccessible to
      installed agent skills.
- [x] Implement file/snapshot/Neo4j provider parity and rebuild validation.

## Acceptance criteria

- **AC-1**: deleting the runtime graph projection does not change classifier,
  transition, ledger replay, or intrinsic fingerprints; reimport restores the
  exact projected logical graph.
- **AC-2**: named queries are parameterized, bounded, stable-order, read-only,
  and return provenance plus logical IDs rather than Neo4j internal IDs.
- **AC-3**: no named query can create, update, delete, or authorize a runtime
  transition; skills have no route to raw `/api/query`.
- **AC-4**: file, embedded snapshot, and live Neo4j providers return the same
  canonical records/fingerprints for the shared fixture corpus.
- **AC-5**: Cypher syntax, constraints, counts, dangling references, duplicate
  IDs, provenance closure, and projection freshness have executable checks.

## Verification

Build and import an ephemeral live Neo4j projection, run the named-query
contract corpus against all providers, test every query limit and rejected
write/raw-query attempt, delete/rebuild the projection, and confirm the core
runtime remains functional throughout.

## Definition of done

Schema, deterministic export/import, named-query catalog/API, provider
implementations, live-Neo4j parity evidence, syntax/invariant checks, and
offline-core proof are complete; raw-query isolation is tested; graph docs,
QA report, manifest/checksums, and root validation are green.

Implementation evidence recorded 2026-08-01 (in-repo Python export + Node graph
runtime):

- Python runtime export (`src/governor/graph_export.py`): accepts only verified
  `RuntimeReplayResult`; rejects direct `StateStore`/unverified objects; omits
  `state.data`; legal moves tagged `contextualOnly` with `executionAuthority:
  "none"`.
- Node graph runtime (`graph/runtime/`): canonical JSON/SHA-256 helpers,
  projection builder with `Gov*` labels and `GOV_*` relationship types only,
  six named queries with hard limits (16 KiB request, 256 KiB response, 100
  rows, depth 3, 1s timeout), query API with raw-cypher rejection and
  provider-selection rejection.
- Three providers (`SnapshotProvider`, `FileProvider`, `Neo4jProvider`) with
  canonical normalization and fingerprint parity.
- Neo4j projection assets (`neo4j/governor-runtime/`): schema, reset, validation
  Cypher (only `Gov*` labels deleted on reset).
- Importer (`scripts/import-governor-graph.mjs`): parameterized `UNWIND` imports
  in bounded transactions; only `Gov*` namespace deleted on rebuild.
- Server refactor: `POST /api/governor-query` added; raw `POST /api/query`
  disabled (404) unless `GRAPH_ENABLE_RAW_QUERY=1` on loopback.
- Native Neo4j 5.26.28 test harness: temporary config/data/logs, random
  loopback ports, process tree reaping, zero residual file/port assertions.
- Test suite: **94/94 Python** PASS at `PYTHONHASHSEED={1,987}`×`TZ={UTC,
  Pacific/Honolulu}`; **32/32 Node contract** PASS; **3/3 Neo4j live** PASS
  (import, query parity, delete/reimport, cleanup); Cypher syntax validation
  PASS with all `Gov*` labels and `GOV_*` relationship types.

**Done 2026-08-01.**
