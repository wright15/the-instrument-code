# GOV-202 — Typed aspects, quantities, and bridge-rule contracts

**Status:** Done · **Priority:** High · **Points:** 8 · **Epic:** [EPIC-002](EPIC-002-governor-domain-agent-runtime.md)
**Depends on:** GOV-201 · **Blocks:** GOV-203

## Story

As a domain author, I want strict machine-readable contracts for aspects,
measurements, and physical-to-symbolic bridge rules, so Governor mappings can
be validated and reproduced instead of inferred from prose.

## Context

The active profile registry has 31 FeatureDefinitions and seven photonic
records, but assertion values and many scopes are intentionally broad. The
seven wavelengths are framework-declared physical anchors; frequency and
photon energy are derived with fixed SI constants. Only landforms is currently
an admitted executable DomainProjection.

## Tasks

- [x] Create a new versioned `governor-runtime` package rather than editing
      the frozen profile registry `v0.1.1` in place.
- [x] Add strict schemas for `TypedAspect`, `Quantity`, `BridgeRule`,
      `ClassificationRequest`, `ClassificationResult`, and policy release.
- [x] Reference existing `featureId` values and publish a deterministic
      FeatureDefinition-to-TypedAspect crosswalk.
- [x] Define closed enums for dimension, unit, epistemic class, admission,
      owner scope, rule scope, and missing/conflict policy.
- [x] Separate physical derivation, observed measurement, framework-declared
      anchor, semantic association, and causal claim.
- [x] Add canonical bridge examples for Jupiter’s 470 nm anchor, scoped
      Rayleigh behavior, atmospheric/aeolian process, and symbolic profile
      association.
- [x] Add deterministic `--check` and `--emit` build modes with source hashes.

## Acceptance criteria

- **AC-1**: all schemas reject unknown properties, invalid enum values,
  incompatible units, missing provenance, and dangling feature/rule IDs.
- **AC-2**: quantities cannot be added, compared, or converted across
  incompatible dimensions without an explicit registered operation.
- **AC-3**: a BridgeRule identifies its antecedent facts, output Governor,
  scope, authority, admission, provenance, priority, and conflict behavior.
- **AC-4**: “470 nm is Jupiter’s declared photonic anchor” is representable
  without asserting that Jupiter was empirically measured or that a musical
  state physically causes optical radiation.
- **AC-5**: every existing FeatureDefinition is referenced exactly once in the
  crosswalk or appears in a machine-readable unresolved list.
- **AC-6**: two clean builds from identical inputs produce byte-identical
  canonical JSON and the same policy/source fingerprints.

## Verification

Validate positive fixtures plus unknown-field, wrong-unit, dimensional
mismatch, missing-source, dangling-ID, causal-overclaim, and reordered-input
negative fixtures. Run check/emit/check in separate processes and compare
bytes and hashes.

Implementation evidence recorded 2026-08-01:

- `seven-governors-governor-runtime-v0.1.0` publishes policy release
  `governor-runtime:0.1.0` with integrated admission still `proposed`;
- seven schemas (six public contracts plus common closed definitions) compile
  under strict AJV and reject unknown nested properties;
- the deterministic crosswalk closes all 31 upstream FeatureDefinitions at
  15 reusable, 15 extended, and one unresolved, with four compiler strings
  isolated as constraint/prohibition markers;
- six named operations bind full dimensional signatures, constants with units,
  assumptions, and output epistemic classes;
- four canonical examples distinguish Jupiter's declared 470 nm anchor,
  registered SI derivations, scoped Rayleigh physics, proposed atmospheric/
  aeolian association, and canonical profile-owned symbolism;
- 4 positive and 21 expected-failure fixtures pass with exact error-code sets;
- contract validation passes 54/54 and determinism validation passes 4/4,
  including separate-process check/emit/check, two clean builds, and reordered
  inputs;
- source fingerprint is
  `609be20d0ee5d2f400b42b09d16842d7bfa3fee42f6bed24dbc1b4bbf4bc6947`
  and policy fingerprint is
  `460e6c40bf96f58a0be36936a91939b930701dfee5875d5e5d0cd6311402f819`;
- the package manifest contains 30 payload files; and
- all three pre-existing versioned package directories remain unchanged.

Full root validation passed 136/136 with root manifest/checksum parity at 977
files. The final status/evidence edit was followed by a fresh root manifest and
final full validation.

## Definition of done

The new package, strict schemas, crosswalk, canonical examples, builder, and
fixture suite are committed; all negative fixtures fail for the expected
reason; deterministic output is proven twice; existing frozen packages remain
unchanged; package and root validation pass; documentation, manifest, and
checksums include the new contracts. **Done 2026-08-01.**
