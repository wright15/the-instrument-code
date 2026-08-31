# EPIC-500 - State Honesty and Baseline Parity

**Status:** Done · **Priority:** High · **Owner:** Integrated release governance
**Epic ID:** EPIC-500 · **Release:** `1.9.0-dev`
**Stories:** [GOV-501](GOV-501-neo4j-baseline-parity.md) and [GOV-502](GOV-502-documentation-validation-census.md)

## Problem statement

The release must distinguish a closed, reproducible Neo4j baseline from a
development identity that merely retains that baseline. Documentation and
validation counts must describe the emitted artifacts rather than stale release
assumptions.

## Goal

Close the narrow `1.8.1` provenance refresh with separate reproducibility and
deployment receipts, then make the retained-baseline and validation-census
contracts explicit for `1.9.0-dev` work.

## Scope

**In:** release identity, native and configured deployment evidence, baseline
provenance, compatibility documentation, and a derived validation census.

**Out:** topology, graph payload, admission, Court policy, runtime authority,
new `/nodes` data, and global `harmonic.C_H` changes.

## Success criteria

1. `1.8.1` records separate native clean-import and configured bootstrap/roundtrip
   evidence for the 3,061-node, 10,506-relationship projection.
2. `1.9.0-dev` explicitly retains the closed `1.8.1` baseline rather than
   claiming new deployment evidence.
3. Compatibility prose and validation totals are generated or derived from
   current artifacts, with a written derivation for every changed count.

## Sequencing

```text
GOV-501 -> GOV-502
```

GOV-501 is complete in Sprint 1. GOV-502 keeps the user-facing compatibility
and census wording synchronized with the closed evidence before later research
and interface work relies on it.

## Definition of done

Both stories have executable evidence, no stale baseline claim remains in their
declared scope, and the release manifest/checksum fixed point passes.
