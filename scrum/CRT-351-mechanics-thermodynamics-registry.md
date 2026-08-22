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

The master phenomenon framework gives every element one four-part child scaffold:
Energy States, Transformations, Structural Forms, and Transfer Modes. The existing
Electric/External catalogues carry the authored outward-facing terms, while v2 also
populates the corresponding Magnetic/Internal semantic catalogues for Fire,
Air, Water, Earth, and Quintessence. Mercury's Equilibrium glossaries occupy
outward-facing and semantic-internal capability paths while Mercury remains
excluded from the binary Court register; its Magnetic/Internal path grants no
Court polarity bit or zodiac facet.
Kinetics, Kinematics, and Weather Dynamics remain future parent categories.
Facilities and computational simulation/modeling vocabulary is explicitly excluded for the future
`mechanics_instrumentation_registry.yaml`; the supplied two-temperature and
multi-temperature entries remain authored structural regime descriptors, not
simulation tooling.

## Tasks

- [x] Author `schemas/mechanics_thermodynamics_registry.yaml` with five
      elemental records, eight polar capabilities, the Mercury engine
      interface, and nine explicit guards.
- [x] Author strict registry and validation-report JSON Schemas.
- [x] Build the independent validator with 19 named checks and 24 adversarial
      mutations; emit `qa/mechanics-thermodynamics-registry-validation.json`.
- [x] Add `tests/test_mechanics_thermodynamics_registry.py` (14 tests).
- [x] Add one proposed row to `provenance/SOURCE_AUTHORITY.md`.
- [x] Refresh manifest/checksums and run root validation to a fixed point.
- [x] Assign one four-part thermodynamic phenomenon scaffold to every elemental
      record: High-Enthalpy Fire, High-Entropy Air, Low-Enthalpy Water,
      Low-Entropy Earth, and Equilibrium Quintessence; reserve the unpopulated
      categories and sibling Kinetics, Kinematics, and Weather Dynamics for
      future population.
- [x] Populate Fire/Electric with 83 authored High-Enthalpy entries: 13 energy
      states, 17 transformations, 26 structural forms, and 27 transfer modes.
- [x] Populate Air/Electric with 44 authored High-Entropy entries: 17 energy
      states, 12 transformations, 12 structural forms, and 3 transfer modes.
- [x] Complete the v2 Magnetic/Internal catalogues: 32 entries each for Fire,
      Air, Water, and Earth, plus 36 Quintessence Equilibrium entries.
- [x] Reserve facilities and computational simulation/modeling entries for future
      `mechanics_instrumentation_registry.yaml`; reject instrumentation and
      Kinetics-only terms from this registry.

## Acceptance Criteria

- **AC-1**: schema-valid; `status: proposed_canonization`;
  `admission_status: proposed`; `physical_quantity_claim: false`.
- **AC-2**: Fire, Air, Water, and Earth each expose Electric/External bit 0 and
  Magnetic/Internal bit 1 with the authored capability definitions.
- **AC-3**: scale IDs replay CRT-350 exactly: Fire 661, Air 677, Mercury 1189,
  Water 1193, and Earth 1321.
- **AC-4**: zodiac facets replay CRT-347 and transition references resolve
  against CRT-349.
- **AC-5**: Mercury retains its engine interface and both semantic capability
  channels, with no binary Court polarity bit, zodiac facet, or transition
  metadata; it remains excluded from the binary Court register.
- **AC-6**: no executable Court relation or state write is introduced;
  `kappa_court` remains read-only and global `harmonic.C_H` remains untouched.
- **AC-7**: validator 19/19 PASS; pytest 14/14; root validation PASS.
- **AC-8**: every Element owns exactly one four-part thermodynamic scaffold:
  Fire High-Enthalpy, Air High-Entropy, Water Low-Enthalpy, Earth Low-Entropy,
  and Quintessence Equilibrium. Existing Electric/External catalogues remain
  intact, and each Magnetic/Internal catalogue uses the strict Rich Schema.
- **AC-9**: facilities and computational simulation/modeling vocabulary remains
  out of this registry and points only to the future separate registry boundary;
  supplied two-temperature and multi-temperature structural descriptors remain
  authored phenomena rather than tooling.

## Verification

```bash
npm run validate:mechanics-thermodynamics-registry
npm run validate
```

**Results (2026-08-22):** v1 validator 19/19 PASS; v2 validator 21/21 PASS;
pytest 15/15; root validation PASS; manifest and checksums refreshed.

## v2.0.0 Direct Capability Array Migration

v2 preserves the v1 registry as historical planning evidence and introduces a
parallel, breaking schema version. The rich glossary contract is now uniform:
every `electric_external`, `magnetic_internal`, and Mercury `engine_interface`
channel is a direct array of six required fields, with a controlled optional
`semantic_transition` field. Mercury has outward-facing and semantic-internal
Equilibrium arrays, but it retains no binary Court polarity metadata. The former pole metadata moves to sibling
`polarity_bindings` for the four binary elements.

The four-part scaffold remains enforced through the authored relation types:
`characterizes`, `transforms`, `structures`, and `transfers`. It is no longer a
per-element wrapper. All leaf entries carry `phenomenon_class`; base pole
mechanics use `capability_action`, while glossary entries use their relevant
thermodynamic class.

Water/Venus v2 retains 44 Low-Enthalpy electrochemical glossary entries in
`capabilities.electric_external`: 13 energy states, 12 transformations, 10
structural forms, and 9 transfer modes. Its semantic Magnetic/Internal channel
adds 32 cohesion, interface, osmotic, and latent-heat entries, all using
`phenomenon_class: low_enthalpy`; its `latent_heat_storage` action remains distinct.

Earth/Saturn v2 retains 46 Low-Entropy electro-thermodynamic glossary entries in
`capabilities.electric_external`: 10 energy states, 12 transformations, 12
structural forms, and 12 transfer modes. Its semantic Magnetic/Internal channel
adds 32 solid-order and immobilization entries, all using
`phenomenon_class: low_entropy`; `crystallization_lock` remains distinct. The
`dielectric_breakdown`, `electrical_tree`, and `breakdown_conduction` entries carry
the controlled `semantic_transition: failure_or_crossover` marker because they
begin with insulation or order and terminate in a discharge crossover.

Mercury/Quintessence v2 retains 50 Equilibrium glossary entries in
`capabilities.electric_external`: 11 energy states, 12 transformations, 14
structural forms, and 13 transfer modes. Its semantic Magnetic/Internal channel
adds 36 equilibrium, buffering, and reference-state entries, all using
`phenomenon_class: equilibrium`. Neither channel grants Mercury a binary Court
polarity bit or zodiac facet, and the engine interface remains action-only.

### v2 Acceptance Criteria

- Direct capability arrays contain 440 unique rich entries across all five
  elements, each with required `mechanic_id`, `definition`, `relation_type`,
  `value`, `phenomenon_class`, and `source_class` fields, plus the controlled
  optional `semantic_transition` field where applicable.
- Existing Electric/External catalogues remain intact. Magnetic/Internal adds
  32 entries each for Fire, Air, Water, and Earth, plus 36 Equilibrium entries
  for Quintessence.
- The v2 schema rejects legacy category wrappers, incomplete or unbounded rich
  entries, and mismatched element polarity bindings.
- The v2 validator has 21 PASS checks and adversarial rejection cases covering
  semantic channel ownership, namespacing, Mercury engine-interface isolation,
  nonbinary Mercury metadata, and invalid Earth transition tags.
- V1 source, schema, validator, test, and QA evidence remain available and are
  validated alongside v2.

### v2 Verification

```bash
npm run validate:mechanics-thermodynamics-registry-v2
npm run validate
```

## Definition of Done

All acceptance criteria pass; the registry remains proposed with zero
authority effect. No runtime, graph, policy, ledger, CRT-310, decision-ledger,
or frozen-toolkit content changed.

**Ticket closed:** 2026-08-22. Commit `6435c1d`.
