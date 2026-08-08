# Deterministic Build

## Intrinsic inputs

The builder reads only the explicit source list in `scripts/policy-builder.mjs`.
It hashes exact source bytes, validates release and fixture identities, then
normalizes set-like arrays by stable identifiers using code-point ordering.
Source-file enumeration, locale, provider, wall clock, process ID, temporary
path, and output directory are excluded from intrinsic identity.

Ordered mathematical inputs such as operation signatures retain declared
order. Unordered records are normalized:

- source records by `sourceId`;
- crosswalk entries by `featureId`;
- operations by `operationId`;
- constants by `name`;
- aspects by `aspectId`;
- rules by `ruleId`;
- antecedents by `antecedentId`;
- provenance by `sourceId` then pointer; and
- active IDs and assumptions by code point.

Object keys are recursively sorted before UTF-8 JSON serialization. Every
generated file has one final LF.

## Fingerprints

```text
sourceFingerprint = SHA256(canonical JSON of sorted source records and hashes)
policyFingerprint = SHA256(canonical JSON of normalized policy without policyFingerprint)
```

The crosswalk and example artifacts repeat both fingerprints. This binds them
to the exact authority inputs and policy release.

## Modes

`node scripts/build-policy.mjs --check` builds in memory and byte-compares all
installed canonical outputs without writing.

`node scripts/build-policy.mjs --emit` builds in memory and atomically replaces
the canonical outputs.

Unknown arguments, missing mode, or both modes are errors. `--output-dir` and
`--test-reverse-input-order` exist only to support isolated deterministic QA.

## Proof

`scripts/validate-determinism.mjs` launches separate Node processes for:

1. clean A emit and check;
2. clean B emit and check; and
3. reordered-input emit and check.

It compares every canonical byte and both fingerprints with each other and the
installed canonical outputs. The report records only stable output hashes and
fixture IDs; temporary absolute paths and timestamps are excluded.
