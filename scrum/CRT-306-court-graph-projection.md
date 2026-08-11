# CRT-306 — Court Neo4j projection and bounded named queries

**Status:** Done · **Priority:** High · **Points:** 5 · **Epic:** [EPIC-003](EPIC-003-pentatonic-court-admission.md)

> **Closure evidence (2026-08-07):** deterministic projection in
> `src/governor/court_graph_projection.py`, bounded read-only catalog in
> `src/governor/court_graph_queries.py`, CLI generator in
> `scripts/generate-court-graph.py`, and schema/validation assets in
> `neo4j/court-mathematics/`. Verified by `tests/test_court_graph_projection.py`
> (23 tests), native Neo4j live parity in `tests/court_graph/neo4j-live.test.mjs`,
> and byte determinism across hash seeds/time zones in
> `tests/verification/test_graph_topology_locks.py`.
**Depends on:** CRT-302, CRT-303, GOV-206 · **Blocks:** CRT-307, CRT-309

## CRT-305 compatibility amendment (2026-08-10)

CRT-306 remains Done for its original 2026-08-07 scope. This bounded amendment
replaces the former caller-authored runtime `CourtState` input with the
fingerprinted CRT-305 runtime contract before CRT-307 consumes the graph.

- [x] Accept only typed CRT-305 genesis, generic ledger events, and a trusted
      anchor; independently call `replay_court_runtime_ledger()` before
      projecting any runtime record.
- [x] Project one replay-derived terminal `CourtState`, one terminal
      `CourtLedgerSnapshot`, ordered `CourtTransitionEvent` records, and exact
      `TopologicalTranslocationRecord` evidence. Runtime mask, poles, normalized
      `kappa_court`, event count, and ledger head are never caller-authored.
- [x] Keep static CRT-304 `ledgerPointer` values null. Bind a verified
      translocation event back to its exact immutable commutation row through
      `USES_ROUTE_RECORD`, with route ID, operator, classification, semantics,
      and CRT-304 fingerprint closure.
- [x] Add bounded `court_runtime_state_for_session` and
      `court_verified_events_for_session` queries while retaining the four
      original query IDs. All six queries are stable-order, read-only, depth at
      most two, and limited to at most 100 rows.
- [x] Extend schema, reset, ingestion, validation, syntax allow-lists, snapshot
      parity, topology locks, and live Neo4j reset/rebuild coverage. Missing
      verification evidence and malformed route closure fail closed.

The deterministic release fixture contains one replay-verified
`crt-306-runtime-fixture` session with C0 -> C1 ordinary evidence followed by
C1 -> C4 compound R7/5-23 translocation evidence. Projection schema v2 emits 21
Court-owned nodes, 19 relationships, and one ID-only `ScaleState` reference.
The fixture generator is deliberately restricted to that recipe; production
projection code remains generic over any valid CRT-305 replay.

This amendment does not project `T5CycleEntry`, `ComplementMap`, or
`CourtInvariant`, does not create a canonical Forte-to-Court mapping, and does
not change the `proposed_pending_crt_309` admission state. Frozen package
artifacts and integrated release 1.2.0 remain unchanged.

Final closure evidence: 261 root Python tests passed; Phase-4 passed 45
verification tests plus native live Neo4j parity; root release validation passed
220/220 checks; the refreshed root manifest contains 608 files and no live
Court session artifacts.

## Story

As a local-agent orchestrator, I want fast named graph queries over
admitted pentatonic substrate, Court harmonic invariants, Court
transitions, and Court filter applications, so the model can retrieve exact
Court context without making Neo4j an authority or writing raw Cypher.

## Context

Neo4j is already a rebuildable projection of canonical topology, mutation
algebra, semantic profiles, and (after GOV-206) typed aspects, rules, and
runtime snapshots. The Court projection extends that pattern to the
CRT-302 admitted set classes, the CRT-303 harmonic invariants, the CRT-304
filter algebra and commutation table, and the CRT-305 Court-ledger
snapshots. Runtime classification, Court-ledger replay, and invariant
computation must remain identical when Neo4j is offline or deleted,
matching GOV-206's "deleting the runtime graph projection does not change
classifier, transition, ledger replay, or intrinsic fingerprints".

## Tasks

- [ ] Add constraints/indexes and projection records for
      `PentatonicSetClass`, `CourtRootedPosition`, `T5CycleEntry`,
      `ComplementMap`, `CourtInvariant`, `CourtFilterOperator`,
      `CourtCommutationRecord`, `CourtTransitionEvent`, and verified
      `CourtLedgerSnapshot` using stable logical IDs (never Neo4j internal
      IDs).
- [ ] Generate imports only from canonical CRT-302/303/304/305 data and
      verified ledger snapshots; never project live mutable Court
      authority directly.
- [ ] Add parameterized named queries for: Court state lookup, Court
      legal-move context, Court filter application explanation, Court
      non-commutation path, Court invariant reproducibility, Court
      provenance path, and prior verified Court outcomes.
- [ ] Expose an allow-listed query-catalog API with strict request
      schemas, parameter types, row/byte/depth/time limits, and
      scalar/tabular support; raw `/api/query` development access is kept
      isolated from installed agent skills per GOV-206.
- [ ] Implement file/snapshot/Neo4j provider parity and rebuild validation
      for Court records; the Court projection rebuild must restore the
      exact projected logical graph from canonical data.

## Acceptance criteria

- **AC-1**: deleting the Court graph projection does not change Court
  classifier, Court-ledger replay, invariant computation, filter-algebra
  results, or intrinsic fingerprints; reimport restores the exact
  projected logical graph.
- **AC-2**: named Court queries are parameterized, bounded, stable-order,
  read-only, and return provenance and logical IDs rather than Neo4j
  internal IDs.
- **AC-3**: no named Court query can create, update, delete, or authorize
  a Court transition; skills have no route to raw `/api/query`.
- **AC-4**: file, embedded snapshot, and live Neo4j providers return the
  same canonical Court records/fingerprints for the shared fixture corpus.
- **AC-5**: Cypher syntax, constraints, counts, dangling references,
  duplicate Court IDs, provenance closure, and projection freshness have
  executable checks; missing CRT-302 admission status, missing complement
  pointer, or dangling Court invariant source all fail.
- **AC-6**: the Court projection layer never writes `ScaleState.office`,
  `OCCUPIES_OFFICE`, or Degree-Governor metadata; queries returning
  provenance paths terminate at canonical source records.

## Verification

Build and import an ephemeral live Neo4j Court projection; run the named-
query contract corpus against all providers; test every query limit and
every rejected write/raw-query attempt; delete and rebuild the Court
projection; confirm the core runtime, native EPIC-002 projection, and
Court-ledger replay all remain functional throughout; verify a Court query
raising a non-commutation record returns route semantics and that a verified
runtime event resolves to the exact static row while its ledger pointer remains
null.

## Definition of done

Court schema, deterministic export/import, named-query catalog/API, provider
implementations, live-Neo4j Court parity evidence, syntax/invariant checks,
and offline-core proof are complete; raw-query isolation is tested; court
graph docs, QA report, manifest/checksums, and root validation are green;
the GOV-206 projection contract remains the authoritative read-projection
reference and is not rewritten.
