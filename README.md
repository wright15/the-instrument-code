# Seven Governors Integrated Release

This is the complete working distribution of the Seven Governors universal
network. It combines the conceptual framework, audited canonical release,
Neo4j projection, provenance layer, executable invariant checks, semantic
profile registry and compiler, admitted Governor and bounded Court runtimes,
optional read-only vault context, companion authoring toolkit, and repaired
interactive graph.

The package is intentionally layered:

```text
Framework definitions
    ↓
Audited canonical release
    ↓
Mutation algebra audit + semantic profile registry
    ↓
Admitted Governor runtime + bounded Pentatonic Court
    ↓
Neo4j projection
    ↓
Interactive renderer
```

Downstream layers may project upstream facts, but they may not invent or
overwrite them.

## Composite sub-packages

This release records admitted and companion sub-packages in
`provenance/release.json`:

- `seven-governors-mutation-algebra-audit` 1.0.0 — authoritative mutation
  operator registry, applications, modal cycles, and inverse witnesses.
- `seven-governors-canonical-feature-profile-registry` 0.1.1 — canonical
  feature profiles, photonic records, compiler, and creation packets.
- `seven-governors-state-machine-spec-and-authoring-toolkit` 0.2.0 —
  companion guide, candidate extensions (Fivefold and natural-phenomenon
  material, not admitted), and safe authoring.

The Governor runtime and bounded Court packages below retain their original
candidate bytes, while `provenance/court-admission-release.json` and integrated
release 1.3.0 admit the exact referenced identities. Package-internal historical
status fields are not rewritten by the later admission ceremony.

The post-1.2.0 candidate
`seven-governors-governor-runtime-v0.1.0` adds strict typed-aspect, quantity,
bridge-rule, classification, and policy-release contracts. It is validated by
the root suite and is admitted by GOV-209 in release 1.3.0.

The post-1.2.0 candidate
`seven-governors-court-substrate-v0.1.0` adds the strict 38-class pentatonic
registry, five C0-C4 rooted positions, 5-23/5-27 bridge rootings, full T5 root
cycle, and complement maps. CRT-309 admits only C0-C4, 5-23, and 5-27.

The dependent post-1.2.0 candidate
`seven-governors-harmonic-invariants-v0.1.0` computes exact Court geometry,
`kappa_court`, and scoped Carey 5-35 CQ/SQ through an independent enumerator.
It preserves aggregate `C_H` as unresolved; CRT-309 admits its bounded exact
invariant surface.

The dependent post-1.2.0 candidate
`seven-governors-court-filter-algebra-v0.1.0` admits only fixed-root
`P_c(x) = x AND c`, publishes strict operator-theory records, and evaluates
seven Court masks against every admitted mutation and canonical operand.
CRT-309 admits those seven linear diagonal filters only.

The root-owned post-1.2.0 `court-runtime-policy:0.1.0` binds those candidate
packages to a verified Court lifecycle: exact pole/`kappa_court` state,
capability-scoped moves, single-use tokens, evidence-gated ledger events,
compound translocations, semantic replay, and external atomic sessions. Its
exact fingerprinted policy is admitted by the external CRT-309 record.

The CRT-306 Neo4j compatibility projection consumes only replay-verified
CRT-305 sessions, projects terminal state/snapshot/event/translocation evidence,
and exposes six bounded read-only queries. Neo4j remains disposable and cannot
authorize or replay a Court transition. CRT-309 admits only this actual v2
surface and explicitly quarantines broader historical projection claims.

The parallel CRT-307 bundle under `skills/court/` adds five Court-aware local
agent workflows over that runtime/projection boundary. Skills may select and
explain trusted operations, but only CRT-305 replay, typed verifier evidence,
and CAS persistence can commit or verify a transition. Installation is explicit
target, adapter-portable, and non-destructive to GOV-207. CRT-309 admits the
exact registry identity.

GOV-208 and CRT-308 add optional read-only vault context. With no provider,
classifier/runtime output is byte-identical to the context-free path; with a
provider, context remains separately fingerprinted evidence and cannot alter
policy, legality, admission, graph-query identity, or office occupancy.

Start with `docs/START_HERE.md` for the navigation map,
`docs/GOVERNOR_DOMAIN_AUTHORITY.md` and
`docs/COURT_ADMISSION_AND_AUTHORITY.md` for namespace boundaries, and
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
and clean-build determinism, Court substrate, harmonic-invariant, and
filter-algebra candidate packages, the Court runtime policy/lifecycle, the
replay-bound Court graph and agent skill bundle, the companion toolkit
(candidate-scoped), the API contract, the offline explorer, cross-package
fingerprints, manifest freshness, and all Cypher files.

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

## License

This repository is dual-licensed by content type:

- **Code** — all source, tooling, and tests (`src/`, `court-mathematics/`,
  `tests/`, `scripts/`, `graph/`, `bestiary/site/`, and build configuration):
  **MIT** — see `LICENSE`.
- **Curated data** — the curated and audited datasets (`canonical/`, the
  dataset/fixture files under `seven-governors-*`, and `graph/data/`):
  **Creative Commons Attribution 4.0** (CC BY 4.0) — see `DATA_LICENSE.md`.

Attribution for the data: *Erick Wright. Seven Governors / the-instrument.
CC BY 4.0.* This is a summary, not legal advice — review both license texts
before redistributing or remixing.

## Archiving

A permanent, versioned snapshot of this repository is archived on Zenodo:

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.21845819.svg)](https://doi.org/10.5281/zenodo.21845819)

That version is immutable and independently preserved on Zenodo, so the
project remains available even if this repository is ever removed or changed.
New snapshots should be uploaded as new versions of the same Zenodo record so
the concept DOI stays stable.

## Change policy

- Mathematical or office-rule changes begin in the audit/framework layer.
- A new accepted rule requires a new canonical release and full validation.
- Neo4j can be rebuilt from canonical data at any time.
- Renderer-only changes may not alter roles, offices, identities, or evidence.
- Manual Neo4j edits are not canonical until reproduced by the audit and
  release process.

See `provenance/SOURCE_AUTHORITY.md` and `provenance/NEXT_STEPS.md`.
