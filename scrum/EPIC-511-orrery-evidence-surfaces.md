# EPIC-511 - Orrery Evidence Surfaces

**Status:** Done · **Priority:** High · **Owner:** Harmonic Orrery application workstream
**Epic ID:** EPIC-511 · **Release:** `1.9.0-dev`
**Stories:** [ORR-511](ORR-511-evidence-inspector-bundle.md), [ORR-512](ORR-512-provenance-explain-surface.md), [ORR-513](ORR-513-field-derivation-surface.md), and [ORR-514](ORR-514-tiered-photonic-overlay.md)

## Problem statement

The Orrery exposes a useful 21-anchor experience, but evidence fields,
provenance paths, and research verdicts need a clear read-only presentation that
does not alter the existing `/nodes` contract or turn planning evidence into
canonical fact.

## Goal

Add evidence-first inspection and explanation surfaces that preserve exact source
labels, bounded queries, legal-move bytes, and authority distinctions.

## Scope

**In:** deterministic evidence bundles, bounded provenance explanation, and
verdict-labelled research presentation.

**Out:** `/nodes` schema changes, raw Cypher, Neo4j writes, legal move changes,
new admission, player-state authority, or physics claims.

## Success criteria

1. Users can inspect exact field labels and source identity without an invented
   aggregate score.
2. Explanations consume bounded named queries and make absent or incompatible
   evidence visible.
3. Planning-evidence results remain visibly non-admitted under all outcomes.

## Sequencing

```text
             +-> ORR-512
ORR-511 -----+-> ORR-513
             +-> ORR-514
```

ORR-511 starts in Sprint 2. ORR-512, ORR-513, and ORR-514 are parallel Sprint 3
work that each depend only on ORR-511 and remain read-only regardless of GOV-510
or GOV-511 findings.

## Definition of done

All surfaces have source-identity, unavailable-data, and negative-action tests;
the current legal-move catalog and `/nodes` contract remain byte-compatible.
