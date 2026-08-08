# Seven Governors Graph-Derived Mutation Algebra Audit

This package derives a structural mutation algebra from the canonical Seven
Governors universal network without promoting graph adjacency into semantic
authority.

## Headline result

The rooted heptatonic universe supports 15 structural generator candidates:

- `M`: total modal successor;
- `R1…R7`: partial one-semitone raises; and
- `L1…L7`: partial one-semitone lowers.

`R1/L1` are the root-phase seam operations. They complete the same cyclic
seven-address system as the six fixed-degree pairs.

The audit exhaustively validates:

```text
M^7 = I
Lk = Rk^-1 on their partial domains
M Rk M^-1 = R(k-1 mod 7)
M Lk M^-1 = L(k-1 mod 7)
```

For all 308 office-bearing states:

```text
office(M(s)) = office(s) + 2 mod 7
```

The Degree-Governor label follows that same `+2 mod 7` transport.

The coverage audit also identifies 30 formally valid phase pairs and 280
formal modal applications that are not currently projected by the canonical
relationship set. They are recorded as projection gaps, not silently added to
canon.

## What is included

### Principal reading

- `audit/mutation-algebra-hypotheses.md` — interpretation, validated laws,
  negative results, and next declarations.
- `qa/mutation-algebra-validation.json` — machine-readable PASS/FAIL report.

### Operator ledgers

- `audit/operator-candidates.json`
- `audit/operator-registry.csv`
- `audit/operator-applications.csv`
- `audit/inverse-witnesses.csv`
- `audit/modal-covariance-witnesses.csv`
- `audit/cycle-identities.csv`
- `audit/projection-coverage.csv`
- `audit/phase-completion-ledger.csv`
- `audit/modal-completion-ledger.csv`

### Confluence and commutation

- `audit/commutation-summary.csv`
- `audit/commutative-squares.csv`
- `audit/confluence-witnesses.csv`
- `audit/counterexamples.csv`

### Identity and source validation

- `audit/stabilizer-results.csv`
- `audit/structural-edge-validation.csv`
- `audit/field-edge-validation.csv`
- `source/universal-network-data.json`
- `source/topology-identity-definitions.json`
- `SOURCE_AUTHORITY.md`

### Neo4j integration

- `neo4j/algebra-schema.cypher`
- `neo4j/algebra-import.cypher`
- `neo4j/algebra-validation.cypher`

The Neo4j layer is optional and adds 15 `MutationOperator` nodes, 462
`MODAL_MUTATES_TO` relationships, and 2,940 `LOCAL_MUTATES_TO`
relationships. It does not replace or rewrite the canonical topology.

## Run the audit

Requires Node.js 20 or newer.

```bash
npm run audit
```

The script is deterministic for a fixed source snapshot and exits nonzero if
any required assertion fails.

## Validate the Cypher files

```bash
npm install
npm run validate:cypher
```

## Load the optional Neo4j algebra projection

Copy these two generated CSV files to the Neo4j import directory:

```text
audit/operator-registry.csv
audit/operator-applications.csv
```

Then execute, in order:

```text
neo4j/algebra-schema.cypher
neo4j/algebra-import.cypher
neo4j/algebra-validation.cypher
```

Every statement in `algebra-validation.cypher` is designed to return `PASS`.

## Authority boundary

This package validates structural operations and path equations. It does not
yet define:

- semantic feature-profile effects;
- Court-filter compatibility;
- harmonic compression `C_H`;
- global lattice meet/join operations; or
- asset-generation authorization.

Those require separate declarations and validation.
