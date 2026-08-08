# GOV-206 Governor Runtime Graph Projection

## Overview

This directory contains the Neo4j schema, reset, and validation Cypher for the
GOV-206 Governor Runtime graph read projection. It is **separate** from and
**does not modify** the existing topology projection in `neo4j/`.

## Labels

Only `Gov*` prefixed labels are created:

- `GovRuntimePolicyRelease`
- `GovTypedAspect`
- `GovBridgeRule`
- `GovClassificationEvidence`
- `GovLedgerSnapshot`
- `GovGovernorProfileView`
- `GovLegalMoveView`
- `GovProvenanceSource`
- `GovGovernorReference`

## Relationship Types

Only `GOV_` prefixed relationship types are created:

- `GOV_DECLARES_ASPECT`
- `GOV_DECLARES_RULE`
- `GOV_RULE_OUTPUT`
- `GOV_SUPPORTED_BY`
- `GOV_DERIVED_FROM_SOURCE`
- `GOV_SNAPSHOT_HAS_MOVE`
- `GOV_REFERENCES_GOVERNOR`

## Negative Boundaries

The following are **strictly prohibited** in this projection:

- `ScaleState.office` or any `office` field
- `OCCUPIES_OFFICE` edges
- `Degree Governor` mutation metadata
- Neo4j internal IDs as logical identifiers
- Validation tokens or execution authority in legal moves

## Import

```bash
node scripts/import-governor-graph.mjs --snapshot <path-to-snapshot.json>
```

## Reset

```bash
cypher-shell -f neo4j/governor-runtime/reset.cypher
```

This deletes only `Gov*` labeled nodes and their relationships.

## Validation

```bash
cypher-shell --format plain -f neo4j/governor-runtime/validation.cypher
```

Every query returns a named check, `PASS` or `FAIL`, and a diagnostic value.