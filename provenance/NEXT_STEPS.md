# Recommended Next Steps

Current release: `seven-governors-integrated-1.1.0`, validated. The release
now includes the audited topology, the mutation algebra audit, the canonical
feature-profile registry and compiler, and the companion authoring toolkit.

## 1. Establish the full database

Import in the order recorded in `provenance/release.json`:

1. topology: `neo4j/schema.cypher`, `neo4j/import.cypher`;
2. provenance: `neo4j/provenance.cypher`;
3. mutation algebra: the audit's `algebra-schema.cypher`,
   `algebra-import.cypher` (15 operators, 3,402 applications);
4. semantic registry: `01_semantic_schema.cypher`,
   `02_semantic_import.cypher` (7 profiles, 4 compiled forms, 15 semantic
   shells).

Run both validation suites (`neo4j/validation.cypher`,
`neo4j/provenance-validation.cypher`, plus the audit and registry validation
files). Preserve the reports with the release.

## 2. Use explanation-first queries

Begin with queries that answer:

- Why does this state occupy its office?
- Which selected parent governs this satellite?
- Which contacts support this convergence?
- Why is this boundary state categorically withheld?
- Which operator applied to which state, and does its inverse witness pass?
- Which release and document define the applicable rule?

Examples are available in `neo4j/example-queries.cypher`,
`neo4j/integrated-example-queries.cypher`, the mutation audit's
`algebra-validation.cypher`, and the companion's query cookbook.

## 3. Serve the API and check parity

`npm run check:neo4j` inspects topology, mutation, and semantic counts;
`npm start` serves the graph and `GET /api/creation-packet`. `GET /ready.json`
returns `503` unless all parity groups pass.

## 4. Prove round-trip reproducibility

Export the Neo4j projection into a normalized JSON form and compare it with
the canonical release and the registry's compiled packets. No role, office,
family, state, relationship, profile, or operator should be lost or invented.

## 5. Admit the candidate extensions when ready

The Fivefold Engine and natural-phenomenon models are explicit candidates.
Admission requires a new versioned release that:

- moves or references schemas from the root authority namespace;
- updates source-authority records and adds release provenance;
- versions Neo4j node identities and adds imports and validation;
- includes them in readiness checks, explorer presets, and creation packets
  where appropriate; and
- records the decision in this ledger.

## 6. Version every protocol change

Create a new `AuditRelease` and a new integrated release whenever a
qualification rule, precedence rule, operator, or canonical assignment
changes. Presentation-only changes can retain the same topology release.
