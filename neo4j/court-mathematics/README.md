# Court Mathematics Neo4j Projection

This directory defines the CRT-306 rebuildable read projection. Neo4j is not a
Court runtime authority. The projection does not issue validation tokens,
authorize transitions, or import `governor.transitions`.

## Assets

- `schema.cypher`: Neo4j 5 uniqueness, property-existence, and index declarations.
- `reset.cypher`: deletes only Court-owned nodes and attached relationships.
- `validation.cypher`: endpoint, cardinality, identity, and required-edge checks.
- `named-queries.cypher`: reference copies of the bounded read-only catalog.

Property-existence (`IS NOT NULL`) constraints require a Neo4j edition that
supports property-existence constraints. The files remain valid Neo4j 5 Cypher;
the live Community integration suite verifies ingestion, queries, and rebuilds
without weakening the declared production schema.

## Generate

```bash
python3 scripts/generate-court-graph.py \
  --input tests/court_graph/fixture-input.json \
  --snapshot /tmp/court-graph.json \
  --batches /tmp/court-graph-batches.json
```

The input order does not affect either output. Every batch is parameterized,
bounded, dependency-ordered, and uses `MERGE`. Integer values must be sent to
Neo4j as integer driver values; the live Node test demonstrates the required
`neo4j.int(...)` conversion when consuming batch JSON from JavaScript.

## Rebuild

1. Run `reset.cypher` if preserving the canonical `ScaleState` graph.
2. Apply `schema.cypher` using a schema-capable administrative connection.
3. Execute generated batches in ascending `sequence` order.
4. Run each statement in `validation.cypher` and require `PASS`.
5. Expose only the allow-listed catalog in `governor.court_graph_queries`.

A completely empty graph is also supported: ingestion first `MERGE`s stable
minimal `ScaleState {id}` references before creating Court records. Importing
the canonical topology before or after the Court projection enriches those same
nodes by the existing unique `ScaleState.id` identity.

## Verification

```bash
python3 -m pytest tests/test_court_graph_projection.py
node --test tests/court_graph/neo4j-live.test.mjs
```
