# Court Mathematics Neo4j Projection Plan

Status: Phase 3 implemented

## Goal

Project immutable `court-mathematics` outputs and fingerprinted Governor
`CourtState` records into a disposable Neo4j read model. A full wipe followed by
the same canonical input must reproduce identical node, relationship, record,
and projection fingerprints.

This phase does not admit proposed Court substrate or filter records. Admission
status is an explicit input property and is preserved byte-exactly.

## Authority Boundary

The projection modules are:

- `governor.court_graph_projection`
- `governor.court_graph_queries`

Neither module imports `governor.transitions`, an executor, a token type, or a
mutable runtime store. Inputs are immutable `HarmonicProfile` and `CourtState`
objects plus typed, fingerprinted projection records for concepts not yet owned
by `court-mathematics`.

Neo4j output is contextual only. Deleting it cannot change profile construction,
Court-state identity, validation, execution, or ledger replay.

## Narrow Triad Schema

Each verified heptatonic `HarmonicProfile` yields exactly seven relationships:

```text
(:ScaleState)-[:HAS_TRIAD {
  logicalId,
  degree,
  derivationMethod,
  harmonicProfileSha256,
  scaleIntervalVector,
  recordSha256,
  admissionStatus,
  projectionFingerprint
}]->(:Triad)
```

Only `profile.coordinates.h_c.degree_triads` is accepted. The exporter does not
project all 35 trichords from the subset lattice as `HAS_TRIAD`.

`Triad` contains:

```text
logicalId, triadId, pitchMask, pitchClasses, rootPc,
intervalSignature, quality, recordSha256, sourceSha256,
admissionStatus, projectionFingerprint
```

The stable logical identity is `triad:<rootPc>:<pitchMask>`. Relationship
identity includes the harmonic-profile fingerprint and degree, so modal uses of
the same triad remain distinct and reproducible.

## Filter Schema

Every `CourtFilterApplication` has exactly one `FILTERS`, one `USES_FILTER`, and
one `YIELDS_ADMITTED_SET` edge. It may have zero or more sorted commutation
results:

```text
(:CourtFilterApplication)-[:FILTERS]->(:ScaleState)
(:CourtFilterApplication)-[:USES_FILTER]->(:CourtFilterOperator)
(:CourtFilterApplication)-[:YIELDS_ADMITTED_SET]->(:PentatonicSetClass)
(:CourtFilterApplication)-[:HAS_COMMUTATION_RESULT]->(:CourtCommutationRecord)
```

The only admitted operator representation in this phase is
`linear_diagonal`. The generator recomputes:

```text
resultMask = harmonicProfile.rootedScale.pitchMask AND operator.courtMask
```

The result must equal the referenced cardinality-five
`PentatonicSetClass.pitchMask`; authored mismatches fail before snapshot or batch
generation.

Commutation results use the bounded result space:

- `commutes`
- `does_not_commute`
- `left_undefined`
- `right_undefined`
- `both_undefined`

Route semantics and optional ledger pointers are retained on first-class
commutation nodes.

## Pole Ownership

`PoleRegisterProjection.owner_label` accepts only:

- `CourtRootedPosition`
- `CourtState`

The generated graph can therefore contain only:

```text
(:CourtRootedPosition)-[:HAS_POLE_REGISTER]->(:PoleRegister)
(:CourtState)-[:HAS_POLE_REGISTER]->(:PoleRegister)
```

Constructors reject `ScaleState`, `Triad`, or any other owner. Neo4j cannot
express endpoint labels in a property constraint, so `validation.cypher`
independently checks the same invariant after ingestion.

## Canonical Snapshot

`build_court_graph_projection()` performs these deterministic steps:

1. Verify every `HarmonicProfile` fingerprint.
2. Resolve `scale-state:<mask>` subject identity.
3. Sort profiles, Court states, filters, applications, commutations, positions,
   and pole registers by stable identity.
4. Recompute triads, pitch sets, interval vectors, filter results, and pole
   vectors from intrinsic inputs.
5. Hash each node and relationship envelope without `recordSha256`.
6. Sort all records by Unicode code-point `logicalId`.
7. Hash the complete projection core without `projectionFingerprint`.
8. Serialize compact UTF-8 canonical JSON with sorted object keys.

`verify_court_graph_projection()` rejects bad hashes, bad counts, duplicates,
reordered records, unknown labels/types, dangling endpoints, invalid pole
owners, or a profile with anything other than degrees 1 through 7.

## Ingestion

`iter_cypher_ingestion_batches()` emits immutable `CypherIngestionBatch`
records in this order:

1. Minimal `ScaleState {id}` references.
2. Nodes grouped by an immutable label allow-list.
3. Relationships grouped by an immutable type allow-list.

Every query is parameterized and uses `MERGE`, making repeated ingestion of the
same snapshot idempotent. Groups are split into caller-selected batches from 1
through 1,000 records. Endpoint matches always name both label and logical key.

The CLI writes the canonical snapshot and a canonical JSON list of batches:

```bash
python3 scripts/generate-court-graph.py \
  --input <projection-input.json> \
  --snapshot <court-snapshot.json> \
  --batches <court-batches.json> \
  --batch-size 100
```

## Constraints And Validation

`neo4j/court-mathematics/schema.cypher` declares:

- unique logical and business IDs for every new node label
- required record hashes and required Triad properties
- unique logical IDs and required record hashes for every relationship type
- required `degree`, `derivationMethod`, and `harmonicProfileSha256` on
  `HAS_TRIAD`
- lookup indexes for quality, roots, masks, positions, commutation result,
  profile fingerprint, degree, and projection fingerprint

`validation.cypher` checks the invariants not expressible as constraints:

- exactly seven distinct degree triads per scale/profile
- relationship endpoint labels
- Triad cardinality and quality domain
- required filter application edges
- pole-register owner restrictions
- projection identity closure

## Named Queries

The bounded catalog exposes four fixed templates:

| Query ID | Purpose | Rows | Depth |
|---|---|---:|---:|
| `degree_triads_for_scale` | Retrieve seven degree triads | 7 | 1 |
| `modal_scale_states_by_triad_quality` | Find modal states by triad quality | 100 | 1 |
| `modal_scale_states_by_interval_vector` | Find modal states by exact interval vector | 100 | 1 |
| `court_filter_commutation_outputs` | Inspect filter, pentatonic, and commutation outputs | 100 | 2 |

All templates are parameterized, read-only, stable-order, limited to depth 3 or
less, limited to 100 rows or less, and assigned a 1,000 ms Neo4j timeout. The
normalizer rejects unknown parameters, raw Cypher, invalid domains, and
over-limit requests.

`execute_court_snapshot_query()` is the reference file/snapshot provider. The
live Neo4j test compares its contract expectations with real Neo4j query output.

## Rebuild Verification

Unit coverage verifies record shape, fingerprint recomputation, input-order
independence, typed filter algebra, pole ownership, bounded query contracts,
snapshot query parity, and deterministic CLI bytes.

The native Neo4j integration test:

1. Starts isolated Neo4j 5.26.28 on loopback-only random ports.
2. Generates a snapshot and bounded batches from canonical fixture input.
3. Imports every batch twice and confirms unchanged counts.
4. Executes all four named queries.
5. Deletes only Court-owned projection nodes.
6. Reimports and compares every Court node and relationship logical ID.
7. Stops Neo4j and removes all temporary files.

Run:

```bash
python3 -m pytest tests/test_court_graph_projection.py
node --test tests/court_graph/neo4j-live.test.mjs
```
