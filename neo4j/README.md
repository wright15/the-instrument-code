# Neo4j Import and Validation

## Requirements

- Neo4j 5.x or later;
- access to `cypher-shell`; and
- file imports enabled for the database.

APOC is not required.

## Import

1. Copy this package's `neo4j/csv/` directory into the Neo4j import directory
   as `seven-governors/csv/`.
2. Run the schema and import:

```bash
cypher-shell -f neo4j/schema.cypher
cypher-shell -f neo4j/import.cypher
```

3. Run the executable invariant suite:

```bash
cypher-shell --format plain -f neo4j/validation.cypher
```

Every query returns a named check, a `PASS` or `FAIL` result, and a diagnostic
value. A release is accepted only when every row is `PASS`.

## Rebuild

From the package root:

```bash
node scripts/export_neo4j.mjs
node scripts/validate_neo4j_export.mjs
```

The first command regenerates every CSV from the canonical universal JSON. The
second performs the same core invariant checks without requiring a running
Neo4j instance.

## Destructive reset

`reset.cypher` deletes only nodes carrying this package's labels. Run it only
when intentionally rebuilding the database projection.

