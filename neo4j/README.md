# Neo4j Import and Validation

## Requirements

- Neo4j 5.x or later;
- access to the configured server-side import directory; and
- Node.js 20 and Python 3 for deterministic projection generation.

APOC is not required.

## Full Release Import

From the package root, configure the target instance:

```bash
export NEO4J_URI=neo4j://127.0.0.1:7687
export NEO4J_USERNAME=neo4j
export NEO4J_PASSWORD=change-me
export NEO4J_IMPORT_DIR=/var/lib/neo4j/import
export NEO4J_DATABASE=neo4j
npm run bootstrap:neo4j -- --roundtrip-output /tmp/seven-governors-roundtrip.json
```

`scripts/bootstrap-neo4j.mjs` stages all required checked-in CSVs and imports,
in order, topology, provenance, mutation algebra, semantic registry, GOV-206,
CRT-306, and GOV-210. Generated Court and GOV-210 batches are parameterized and
checked against fixed label/relationship allow-lists. Existing release-owned
labels are rebuilt; unrelated labels are preserved. Generated Court/GOV-210
queries must also match the release-pinned template hashes in
`provenance/neo4j-ingestion-template-baseline.json`.

The command fails unless the full projection contains exactly 3,061 nodes and
10,506 relationships and all seven projection groups pass readiness.

## Round Trip

Verify an already bootstrapped database against the source-bound exact
namespace fingerprints pinned in
`provenance/neo4j-full-database-baseline.json` and reproduced by native release
evidence:

```bash
npm run verify:neo4j:roundtrip -- --output /tmp/seven-governors-roundtrip.json
npm run test:neo4j:full
```

The normalized export contains no Neo4j internal IDs, transaction metadata,
connection details, or generated timestamps. The native test performs two clean
imports and requires byte-identical normalized snapshots.

## Destructive Scope

The bootstrap deletes release-owned relationships and release-only nodes. If a
node also carries an unrelated label or relationship, reset removes only its
release labels and preserves the external node and edge. Run it only when
intentionally rebuilding the integrated projection. Neo4j is not an authority
for topology, runtime legality, Court transitions, or admission.
