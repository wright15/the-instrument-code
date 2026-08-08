# Neo4j Assets

## Query cookbook

`query-cookbook.cypher` is read-only. Run individual statements in Neo4j
Browser, Workspace, cypher-shell, or through the driver.

The mutation questions require the mutation-algebra audit projection:

- `MutationOperator` nodes;
- `LOCAL_MUTATES_TO`; and
- `MODAL_MUTATES_TO`.

The semantic questions require canonical profile registry `0.1.1`.

## Optional context projection

`context-projection.cypher` adds:

- 7 `PhenomenonModel` nodes;
- 7 `PRIMARY_PHENOMENON` relationships;
- 5 `CourtState` nodes; and
- 4 forward `COURT_TRANSITION` relationships.

It is idempotent and does not alter topology nodes or relationships.

Run it only after reviewing the registry YAML:

```bash
cypher-shell -f neo4j/context-projection.cypher
```

Then run questions 20–22 from the cookbook.

## Driver discipline

Use read transactions for the cookbook. Use a write transaction only for the
explicit projection file or a versioned import. Do not let explorer queries
promote hypotheses or change canonical properties.
