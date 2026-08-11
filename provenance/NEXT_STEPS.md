# Recommended Next Steps

Current release: `seven-governors-integrated-1.3.0`, validated and admitted.
The release includes the audited topology, mutation algebra, canonical profile
registry/compiler, Governor runtime, bounded Pentatonic Court, read projection,
agent skills, optional read-only vault context, GOV-210 availability/housing,
and GOV-211 presentation-only assignment-aware menu organization.

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

## 5. Preserve bounded admission

The bounded Court is admitted by CRT-309 through
`provenance/court-admission-release.json`. The remaining 35 pentatonic classes,
broader Fivefold controller claims, natural-phenomenon, and thermodynamic models
remain proposed work. Any expansion still requires a new versioned release that:

- moves or references schemas from the root authority namespace;
- updates source-authority records and adds release provenance;
- versions Neo4j node identities and adds imports and validation;
- includes them in readiness checks, explorer presets, and creation packets
  where appropriate; and
- records the decision in this ledger.

CRT-302's versioned pentatonic substrate registry is complete at
`seven-governors-court-substrate-v0.1.0`. CRT-303's versioned invariant
registry and independent Carey enumerator are complete at
`seven-governors-harmonic-invariants-v0.1.0`. CRT-304's versioned filter
algebra and complete commutation evidence are complete at
`seven-governors-court-filter-algebra-v0.1.0`. CRT-305's runtime policy,
route-event/translocation lifecycle, semantic replay, and external session
store are complete under `schemas/court-runtime-policy.json` and
`src/governor/court_runtime.py`. CRT-306 projection schema v2 now independently
replays those sessions and exposes terminal state plus ordered verified events
through six bounded read-only queries. CRT-307 supplies five replay-bound Court
skills. GOV-208 and CRT-308 now supply bounded read-only context with exact
disabled parity, and CRT-309 records the narrow admission. Do not edit frozen
package or companion Fivefold bytes in place.

## 6. Preserve assignment-aware menu boundaries

GOV-210 and GOV-211 are complete. Consume assignments only through the two
bounded target queries and treat GOV-211 `presentationOrder` as guidance, never
as runtime legality. Keep host topology-binding keys outside requests and
responses; preserve full replay identity in every binding; and retain exact
fallback order whenever assignment evidence is absent or invalid. Any new skill,
assignment basis, target namespace, query, or ordering policy requires a
versioned policy and fresh admission evidence.

## 7. Version every protocol change

Create a new `AuditRelease` and a new integrated release whenever a
qualification rule, precedence rule, operator, or canonical assignment
changes. Presentation-only changes can retain the same topology release.
