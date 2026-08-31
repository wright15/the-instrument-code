# EPIC-512 - Taxonomy Explorer

**Status:** Backlog · **Priority:** High · **Owner:** Harmonic Orrery application workstream
**Epic ID:** EPIC-512 · **Release:** `1.9.0-dev`
**Stories:** [GOV-512](GOV-512-research-gate-3.md), [ORR-521](ORR-521-taxonomy-explorer-read-model.md), [ORR-522](ORR-522-d-tier-taxonomy-dataset.md), [ORR-523](ORR-523-taxonomy-derivation-explanations.md), and [ORR-524](ORR-524-taxonomy-explorer-release-closure.md)

## Problem statement

The 21-anchor Orrery does not expose the full 462-state taxonomy or the
source-bound D-tier and derivation evidence needed to explore it safely.

## Goal

Deliver a read-only Taxonomy Explorer that makes the complete canonical state
set and its evidence paths legible while preserving the difference between
descriptive datasets, planning evidence, and admitted authority.

## Scope

**In:** a source-bound 462-state read model, D-tier dataset, provenance and
derivation surfaces, release-gate validation, and fingerprint blast-radius
documentation.

**Out:** new topology, admission, runtime policy, global `harmonic.C_H`, a
decision inferred from visualization, or automatic EPIC-520 activation.

## Success criteria

1. The explorer presents source-backed taxonomy records with explicit role,
   tier, authority, and unavailable-data states.
2. ORR-522 remains usable as a dataset regardless of the research verdict.
3. Release closure promotes `1.9.0-dev` only after validator, census,
   provenance, manifest, and fingerprint-map requirements pass.

## Sequencing

```text
GOV-510 + GOV-511 -> GOV-512
ORR-511 -> ORR-512
ORR-511 -> ORR-513 -> ORR-521 -> ORR-522 -> ORR-523
ORR-511 -> ORR-514
GOV-511 dataset -> ORR-522
GOV-510 + GOV-511 + GOV-512 + ORR-521 + ORR-522 + ORR-523 + ORR-514 -> ORR-524
```

GOV-512, ORR-512, ORR-513, and ORR-514 are parallel Sprint 3 work. ORR-521 and
ORR-522 are Sprint 4 work; ORR-522 receives the GOV-511 dataset as Sprint 4's
only cross-track input and also depends on ORR-521. ORR-523 and ORR-524 are
Sprint 5 work. EPIC-520 remains conditional on GOV-512.

## Definition of done

The complete explorer is read-only, source-bound, outcome-honest, and released
only after all declared validators and artifact-to-pin blast-radius edges pass.
