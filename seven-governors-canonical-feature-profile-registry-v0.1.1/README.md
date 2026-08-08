# Seven Governors Canonical Feature Profile + Semantic Operator Registry

Version 0.1.1 is an executable semantic companion to the universal topology and
mutation-algebra packages. It hydrates the seven canonical Governor offices into
typed profiles, binds the existing fifteen structural operators to semantic
operator shells, compiles deterministic landform creation packets, and imports
the result into Neo4j.

The package makes one deliberate distinction:

- the harmonic action of `M`, `R1–R7`, and `L1–L7` is structurally known;
- their canonical semantic feature deltas are not yet known.

Accordingly, no promote, suppress, transform, preserve, or prohibit effect has
been invented. Every semantic operator has explicit unresolved scopes and a
policy for admitting future evidence.

## What is included

| Artifact | Count | Status |
|---|---:|---|
| Canonical Governor profiles | 7 | hydrated from framework sources |
| Feature definitions | 31 | typed by epistemic layer |
| Photonic records | 7 | wavelength declared; frequency/energy calculated |
| Harmonic measure definitions | 9 | aggregate `C_H` unresolved |
| Semantic operator shells | 15 | bound to structural operators |
| Domain projections | 1 | landforms reference projection |
| Structural/normalization fixtures | 4 | passed; not semantic-effect evidence |
| Compiled route packets | 7 | deterministic |
| Distinct compiled normal forms | 4 | route-independent |
| Neo4j CSV files | 16 | ready for `LOAD CSV` |
| Cypher files | 5 | syntax-validated |
| Registry providers | 3 | file, snapshot, and Neo4j |

## Layer contract

| Layer | Stores | Does not claim |
|---|---|---|
| Physical | wavelength, frequency, photon energy, `C_P` | musical mutation causes optical change |
| Harmonic | rooted state, family, tier, structural operator | a semantic meaning follows automatically |
| Semantic | canonical office correspondences, non-metric `C_S`, unresolved deltas | authored correspondence is laboratory physics |
| Domain / generative | landform reference pools and creation constraints | every reference must appear, or an unresolved operator effect is canon |

`State Governor` belongs to a state/profile. `Degree Governor` belongs to a
mutation step. The compiler and the Neo4j model keep those fields separate.

## Validate the package

```bash
npm ci
npm run validate
```

The validation command rebuilds the registries, recompiles the reference
fixtures, exports Neo4j CSV, validates four JSON Schemas, checks the topology
and release invariants against six JSON Schemas, compares file and snapshot
providers, recomputes fingerprints, and parses every Cypher statement.

## Compile a creation packet

Compile Acoustic as an intrinsic landform packet:

```bash
node scripts/compile-profile.mjs \
  --state-id 1749 \
  --domain landforms \
  --output acoustic.json
```

Compile the Lydian-to-Acoustic route while keeping that history separate:

```bash
node scripts/compile-profile.mjs \
  --state-id 1749 \
  --domain landforms \
  --source-id 2773 \
  --operator L7 \
  --route-id route:my-acoustic-study \
  --output acoustic-via-lydian.json
```

The intrinsic fingerprint is identical to Acoustic compiled through
Mixolydian `--source-id 1717 --operator R4`. The route record differs; the
normal form does not.

The bundled CLI uses the frozen file provider. An integrated application should
use `Neo4jRegistryProvider` with an open `neo4j-driver` session so compilation
reads the active release already loaded in the graph. The provider contract is
documented in `scripts/providers/README.md`.

## Load into Neo4j

This release augments the existing Seven Governors topology and mutation
algebra. Copy the files in `neo4j/csv/` into the configured Neo4j import
directory, then run:

```bash
cypher-shell -f neo4j/01_semantic_schema.cypher
cypher-shell -f neo4j/02_semantic_import.cypher
cypher-shell -f neo4j/03_semantic_validation.cypher
```

Run the explorations in `neo4j/04_semantic_queries.cypher` individually in
Neo4j Browser, Workspace, or through the driver.

If v0.1.0 is already loaded, run
`neo4j/00_v0.1.0_to_v0.1.1_migration.cypher` before the import. The migration
preserves existing nodes and corrects the old fixture label.

The import is idempotent, keeps historical profile links, and moves
`ACTIVE_PROFILE` / `ACTIVE_SEMANTIC_OPERATOR` to v0.1.1. Logical route,
derivation-step, and fixture records are upgraded in place so they cannot retain
stale links to v0.1.0 normal forms or semantic shells. It does not require APOC.
If the base
`GovernorOffice`, `ScaleState`, or `MutationOperator` nodes are absent, the
semantic nodes still load, but the validation ledger reports missing bindings.

See:

- `docs/NEO4J_INSTALL.md` for the graph model and import order;
- `docs/SEMANTIC_ADMISSION_POLICY.md` for promotion rules;
- `docs/CREATION_PACKET_CONTRACT.md` for compiler behavior;
- `docs/OPERATOR_HYPOTHESIS_GUIDE.md` for the first experiments;
- `docs/SOURCE_AUTHORITY.md` for source and epistemic boundaries.

## Reference fixtures

| Fixture | Structural statement | Semantic result |
|---|---|---|
| Acoustic | `Lydian --L7--> Acoustic <--R4-- Mixolydian` | one Moon-office normal form |
| Harmonic Minor | `Aeolian --R7--> Harmonic Minor` | Jupiter state; Moon-degree edge |
| Lydian Minor | `Acoustic --L6--> Lydian Minor <--R4-- Mixolydian ♭6` | one Mars-office normal form |
| Aeolian square | `M∘R7(Aeolian) = R6∘M(Aeolian)` | one Locrian ♮6 / Saturn normal form |

These fixtures authorize structural and normalization claims. They do not, by
themselves, authorize a specific semantic effect for any operator.

## v0.1.1 compatibility correction

- `C_S` retains the canonical Sun-to-Saturn process order, but its numeric
  display coordinate is explicitly non-metric.
- Landforms are emitted as a selectable `referencePool`; canonical process and
  directionality remain hard requirements.
- Structural fixtures are labeled `ValidationFixture` and explicitly carry
  `semantic_effect_evidence=false`.
- `RegistryRelease` and active-profile relationships preserve historical
  profile nodes while making runtime resolution unambiguous.
- `source/governors.yaml` remains a frozen authoring input. Legacy references
  it names but this package does not contain are quarantined as unresolved,
  non-runtime authorities.
