# CRT-351 - Mechanics Thermodynamics Registry

**Status:** Done | **Priority:** Medium | **Points:** 5 | **Epic:** pre-EPIC-400 follow-on (planned; no epic activated)
**Depends on:** CRT-347, CRT-349, CRT-350 | **Blocks:** -

## Story

As the release owner, I want the Teleological layer's heat and energy action
vocabulary mapped to the five elemental capability schools, so authored game
mechanics can distinguish Electric/External and Magnetic/Internal poles
without claiming or executing physical laws.

## Context

The dual-core architecture separates passive Ontological geography from active
Teleological capabilities. This registry supplies the Teleological "Nouns of
Action" for thermodynamic vocabulary. It replays CRT-350 scale identities,
CRT-347 zodiac facets, and CRT-349 transition anchors without acquiring their
authority.

The registry carries both the authored `status: proposed_canonization` and the
repository admission boundary `admission_status: proposed`. Its
`physical_quantity_claim` remains false; heat, temperature, energy, and state
change are game semantics rather than executable physics quantities.

## Tasks

- [x] Author `schemas/mechanics_thermodynamics_registry.yaml` with five
      elemental records, eight polar capabilities, the Mercury engine
      interface, and nine explicit guards.
- [x] Author strict registry and validation-report JSON Schemas.
- [x] Build the independent validator with 15 named checks and 15 adversarial
      mutations; emit `qa/mechanics-thermodynamics-registry-validation.json`.
- [x] Add `tests/test_mechanics_thermodynamics_registry.py` (10 tests).
- [x] Add one proposed row to `provenance/SOURCE_AUTHORITY.md`.
- [x] Refresh manifest/checksums and run root validation to a fixed point.

## Acceptance Criteria

- **AC-1**: schema-valid; `status: proposed_canonization`;
  `admission_status: proposed`; `physical_quantity_claim: false`.
- **AC-2**: Fire, Air, Water, and Earth each expose Electric/External bit 0 and
  Magnetic/Internal bit 1 with the authored capability definitions.
- **AC-3**: scale IDs replay CRT-350 exactly: Fire 661, Air 677, Mercury 1189,
  Water 1193, and Earth 1321.
- **AC-4**: zodiac facets replay CRT-347 and transition references resolve
  against CRT-349.
- **AC-5**: Mercury is engine-only with no polarity bit or zodiac facet and
  remains excluded from the binary Court register.
- **AC-6**: no executable Court relation or state write is introduced;
  `kappa_court` remains read-only and global `harmonic.C_H` remains untouched.
- **AC-7**: validator 15/15 PASS; pytest 10/10; root validation PASS.

## Verification

```bash
npm run validate:mechanics-thermodynamics-registry
npm run validate
```

**Results (2026-08-20):** validator 15/15 PASS; pytest 10/10; root validation
PASS; manifest and checksums refreshed.

## Definition of Done

All acceptance criteria pass; the registry remains proposed with zero
authority effect. No runtime, graph, policy, ledger, CRT-310, decision-ledger,
or frozen-toolkit content changed.
