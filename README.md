# Seven Governors Integrated Release

This is the complete working distribution of the Seven Governors universal
network. It combines the conceptual framework, audited canonical release,
Neo4j projection, provenance layer, executable invariant checks, semantic
profile registry and compiler, proposed Governor-runtime policy contracts,
companion authoring toolkit, and repaired interactive graph.

The package is intentionally layered:

```text
Framework definitions
    ↓
Audited canonical release
    ↓
Mutation algebra audit + semantic profile registry
    ↓
Governor-runtime typed contracts (validated candidate)
    ↓
Neo4j projection
    ↓
Interactive renderer
```

Downstream layers may project upstream facts, but they may not invent or
overwrite them.

## Composite sub-packages

This release records three admitted/companion sub-packages in
`provenance/release.json`:

- `seven-governors-mutation-algebra-audit` 1.0.0 — authoritative mutation
  operator registry, applications, modal cycles, and inverse witnesses.
- `seven-governors-canonical-feature-profile-registry` 0.1.1 — canonical
  feature profiles, photonic records, compiler, and creation packets.
- `seven-governors-state-machine-spec-and-authoring-toolkit` 0.2.0 —
  companion guide, candidate extensions (Fivefold and natural-phenomenon
  material, not admitted), and safe authoring.

The post-1.2.0 candidate
`seven-governors-governor-runtime-v0.1.0` adds strict typed-aspect, quantity,
bridge-rule, classification, and policy-release contracts. It is validated by
the root suite but is not appended retroactively to the 1.2.0 release record;
integrated admission and classifier execution remain future decisions.

Start with `docs/START_HERE.md` for the navigation map and
`docs/GRAPH_AND_COMPILER_API.md` for the API contract.

## Package map

```text
framework/     Exact uploaded framework documents
schemas/       Machine-readable Governor and Court registry
canonical/     Frozen universal network and identity ledgers
docs/          Formal topology, identity, audit, four-layer, and API specs
neo4j/         CSV projection, schema, imports, provenance, and Cypher checks
graph/         Complete offline interactive network
provenance/    Authority map, release record, source hashes, and decision ledger
qa/            Independent release and Neo4j validation evidence
scripts/       Reproducibility and release-integrity checks
```

## Use the graph immediately

Open `graph/index.html` directly. It is a complete offline document and does
not require Neo4j, Node.js, or an internet connection. `graph/explore.html`
offers the mutation-algebra explorer with locally vendored runtime assets.

## Validate the release

Node.js 20 or later is required.

```bash
npm install
npm run validate
```

This validates the full composite system: topology facts, the mutation audit
(operators, applications, cycles, witnesses), the profile registry and
compiler (deterministic rebuild), provider parity, Governor-runtime contracts
and clean-build determinism, the companion toolkit (candidate-scoped), the API
contract, the offline explorer, cross-package fingerprints, manifest freshness,
and all Cypher files.

## Import into Neo4j

Neo4j 5.x or later and `cypher-shell` are expected.

1. Copy `neo4j/csv/` into the configured Neo4j import directory as
   `seven-governors/csv/`.
2. Run:

```bash
cypher-shell -f neo4j/schema.cypher
cypher-shell -f neo4j/import.cypher
cypher-shell -f neo4j/provenance.cypher
cypher-shell --format plain -f neo4j/validation.cypher
cypher-shell --format plain -f neo4j/provenance-validation.cypher
```

Then project the mutation algebra and semantic layers in the order recorded in
`provenance/release.json` using the audit's and registry's own import files.
The invariant queries should all return `PASS`.

## Run the companion server

The graph can be served beside Neo4j while the server checks that the database
projection matches the canonical release.

```bash
cp .env.example .env
```

Edit `.env`, then run:

```bash
npm run check:neo4j
npm start
```

Open `http://127.0.0.1:4177/`. Database credentials remain server-side. The
graph itself remains the immutable canonical snapshot; the server verifies
projection parity rather than treating screen position as topology.

## Change policy

- Mathematical or office-rule changes begin in the audit/framework layer.
- A new accepted rule requires a new canonical release and full validation.
- Neo4j can be rebuilt from canonical data at any time.
- Renderer-only changes may not alter roles, offices, identities, or evidence.
- Manual Neo4j edits are not canonical until reproduced by the audit and
  release process.

See `provenance/SOURCE_AUTHORITY.md` and `provenance/NEXT_STEPS.md`.
