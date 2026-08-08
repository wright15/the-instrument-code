# Seven Governors Governor Runtime 0.1.0

This package publishes strict machine contracts for Governor typed aspects,
quantities, bridge rules, classification requests/results, and policy releases.
It implements GOV-202 without changing the frozen mutation audit, canonical
profile registry v0.1.1, companion toolkit v0.2.0, topology, or Neo4j.

Package policy release: `governor-runtime:0.1.0`.

Integrated release admission remains `proposed`. The package validates
contracts and policy inputs; it does not yet execute classification (GOV-203),
project runtime records to Neo4j (GOV-206), or admit Court/Fivefold,
natural-phenomenon mappings, or pentatonic topology.

## Guarantees

- All six public schemas close every object with `additionalProperties: false`.
- The policy references all 31 existing FeatureDefinitions exactly once:
  15 reusable, 15 extended, and one unresolved (`harmonic.C_H`).
- Four legacy compiler strings are typed as constraint/prohibition markers,
  not silently promoted to FeatureDefinitions.
- Quantities carry dimensions, units, epistemic class, basis, assumptions, and
  provenance.
- Cross-dimension operations require an explicit registered operation.
- Every `BridgeRule` declares antecedents, output Governor/aspect, scope,
  authority, admission, priority, missing/conflict policy, provenance, and
  causal-claim status.
- Jupiter's 470 nm value is represented as a framework-declared office anchor,
  not an empirical observation or musical-causation claim.
- Rayleigh and atmospheric/aeolian associations remain proposed and inactive.
- Exact source bytes, normalized policy content, and generated outputs are
  SHA-256 bound.

## Commands

```bash
npm run build:check
npm run build:emit
npm run validate:contracts
npm run validate:determinism
npm run manifest:emit
npm run validate
```

`build:check` never writes. `build:emit` writes the three deterministic files
under `canonical/`. `validate:determinism` runs separate-process clean builds
and a reordered-input build in temporary directories, then compares exact
bytes and source/policy fingerprints.

## Layout

```text
source/       Authored crosswalk and policy inputs
schemas/      Six public strict schemas plus shared closed definitions
canonical/    Generated policy, crosswalk, and bridge examples
fixtures/     Positive, negative, and reordered-input fixtures
scripts/      Deterministic builder, validators, and package manifest
qa/           Deterministic validation and build evidence
docs/         Authority, contract, determinism, and release documentation
```

The package hashes authoritative files directly from the containing integrated
release rather than copying frozen package sources. See
`docs/SOURCE_AUTHORITY.md` for exact bindings.
