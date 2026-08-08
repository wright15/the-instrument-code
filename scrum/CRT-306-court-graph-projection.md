# CRT-306 — Court Neo4j projection and bounded named queries

**Status:** Ready · **Priority:** High · **Points:** 5 · **Epic:** [EPIC-003](EPIC-003-pentatonic-court-admission.md)
**Depends on:** CRT-302, CRT-303, GOV-206 · **Blocks:** CRT-307, CRT-309

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
raising a non-commutation record returns both the route semantics and the
ledger pointer.

## Definition of done

Court schema, deterministic export/import, named-query catalog/API, provider
implementations, live-Neo4j Court parity evidence, syntax/invariant checks,
and offline-core proof are complete; raw-query isolation is tested; court
graph docs, QA report, manifest/checksums, and root validation are green;
the GOV-206 projection contract remains the authoritative read-projection
reference and is not rewritten.