# Pentatonic Binding Audit Projection

This directory is a detached, disposable Neo4j projection of the seven
reviewed root-0 realizations in
`canonical/pentatonic-binding-candidates/pentatonic-7-35-parent-audit-v1.json`.
It is planning evidence only. It is not part of the active bootstrap, query
catalog, runtime, CRT-306 projection, or admission surface.

## Graph Boundary

- `PentatonicAuditRealization` is the only audit node label.
- `SUBSET_OF_7_35` is the only audit relationship type.
- Relationship sources are exact reviewed realizations, never TnI class
  summaries.
- Relationship targets are read-only `ScaleState {id}` fixtures resolved with
  `MATCH`; the import never creates or modifies a `ScaleState`.
- Complement, transposition, inversion, filter projection, zodiac, office,
  pole, and runtime relationships are outside this projection.

The live test derives all records from the Phase 1 candidate, starts a native
Neo4j 5 instance through `graph/runtime/neo4j-harness.mjs`, and requires both:

```text
PENTATONIC_BINDING_AUDIT_NEO4J_URI=<ephemeral harness URI>
PENTATONIC_BINDING_AUDIT_EPHEMERAL=1
```

The dedicated endpoint must differ from `NEO4J_URI`. There is no fallback to
the application connection.

## Execution Order

The test performs the following sequence in the disposable database:

1. Assert an empty database and no audit-named schema objects.
2. Install `schema.cypher`.
3. Seed ID-only `ScaleState` fixtures in test setup.
4. Execute `import.cypher` twice and validate all 19 edges.
5. Execute `reset.cypher` and confirm that fixtures are unchanged.
6. Execute `teardown.cypher` and confirm that audit schema is absent.
7. Stop Neo4j and verify process, port, and temporary-directory cleanup.

Run the focused checks from the repository root:

```sh
node --test tests/pentatonic_binding_audit/neo4j-live.test.mjs
node scripts/validate-cypher-syntax.mjs
```

The live test refreshes
`qa/pentatonic-binding-audit-neo4j-validation.json` only after every graph and
cleanup assertion passes.
