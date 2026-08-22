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
Energy States, Transformations, Structural Forms, and Transfer Modes. Fire's
Electric/External pole carries the authored High-Enthalpy glossary, and Air's
Electric/External pole carries the authored High-Entropy glossary. The v1 registry
reserves Water Low-Enthalpy, Earth Low-Entropy, and Quintessence Equilibrium;
the v2 registry subsequently populates the Water, Earth, and Quintessence
categories. Mercury's Equilibrium glossary occupies its outward-facing
Electric/External capability path while Mercury remains excluded from the binary
Court register. Air High-Entropy excludes a Magnetic/Internal base glossary,
reserving any later modifier or delta for the Teleological Physics Registry.
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
      states, 12 transformations, 12 structural forms, and 3 transfer modes;
      retain no High-Entropy glossary in Air/Magnetic.
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
- **AC-5**: Mercury retains its engine interface and exposes only an
  Electric/External Equilibrium glossary, with no binary Court polarity bit,
  zodiac facet, or Magnetic/Internal capability channel; it remains excluded
  from the binary Court register.
- **AC-6**: no executable Court relation or state write is introduced;
  `kappa_court` remains read-only and global `harmonic.C_H` remains untouched.
- **AC-7**: validator 19/19 PASS; pytest 14/14; root validation PASS.
- **AC-8**: every Element owns exactly one four-part thermodynamic scaffold:
  Fire High-Enthalpy, Air High-Entropy, Water Low-Enthalpy, Earth Low-Entropy,
  and Quintessence Equilibrium. Fire/Electric replays the complete 83-entry
  High-Enthalpy glossary, and Air/Electric replays the complete 44-entry
  High-Entropy glossary through the strict Rich Schema with no Air/Magnetic
  High-Entropy glossary.
- **AC-9**: facilities and computational simulation/modeling vocabulary remains
  out of this registry and points only to the future separate registry boundary;
  supplied two-temperature and multi-temperature structural descriptors remain
  authored phenomena rather than tooling.

## Verification

```bash
npm run validate:mechanics-thermodynamics-registry
npm run validate
```

**Results (2026-08-21):** validator 19/19 PASS; pytest 14/14; root validation
PASS; manifest and checksums refreshed.

## v2.0.0 Direct Capability Array Migration

v2 preserves the v1 registry as historical planning evidence and introduces a
parallel, breaking schema version. The rich glossary contract is now uniform:
every `electric_external`, `magnetic_internal`, and Mercury `engine_interface`
channel is a direct array of six required fields, with a controlled optional
`semantic_transition` field. Mercury additionally has an outward-facing
`electric_external` array for Equilibrium entries, but it retains no binary
Court polarity metadata. The former pole metadata moves to sibling
`polarity_bindings` for the four binary elements.

The four-part scaffold remains enforced through the authored relation types:
`characterizes`, `transforms`, `structures`, and `transfers`. It is no longer a
per-element wrapper. All leaf entries carry `phenomenon_class`; base pole
mechanics use `capability_action`, while glossary entries use their relevant
thermodynamic class.

Water/Venus v2 adds 44 Low-Enthalpy electrochemical glossary entries to
`capabilities.electric_external`: 13 energy states, 12 transformations, 10
structural forms, and 9 transfer modes. All use
`phenomenon_class: low_enthalpy`. No supplied electrochemical term is placed in
Water/Magnetic; its existing `latent_heat_storage` action remains distinct.

Earth/Saturn v2 adds 46 Low-Entropy electro-thermodynamic glossary entries to
`capabilities.electric_external`: 10 energy states, 12 transformations, 12
structural forms, and 12 transfer modes. All use
`phenomenon_class: low_entropy`; no supplied Low-Entropy term is placed in
Earth/Magnetic, whose `crystallization_lock` action remains distinct. The
`dielectric_breakdown`, `electrical_tree`, and `breakdown_conduction` entries carry
the controlled `semantic_transition: failure_or_crossover` marker because they
begin with insulation or order and terminate in a discharge crossover.

Mercury/Quintessence v2 adds 50 Equilibrium glossary entries to
`capabilities.electric_external`: 11 energy states, 12 transformations, 14
structural forms, and 13 transfer modes. All use
`phenomenon_class: equilibrium`; no supplied equilibrium term is placed in
Mercury's engine interface or a Magnetic/Internal channel. This outward-facing
path supports authored balance, conversion, sensing, and heat rejection without
granting Mercury a binary Court polarity bit or zodiac facet.

### v2 Acceptance Criteria

- Direct capability arrays contain 276 unique rich entries across all five
  elements, each with required `mechanic_id`, `definition`, `relation_type`,
  `value`, `phenomenon_class`, and `source_class` fields, plus the controlled
  optional `semantic_transition` field where applicable.
- Fire's 83 High-Enthalpy entries, Air's 44 High-Entropy entries, Water's 44
  Low-Enthalpy entries, Earth's 46 Low-Entropy entries, and Mercury's 50
  Equilibrium entries remain Electric/External only.
- The v2 schema rejects legacy category wrappers, incomplete or unbounded rich
  entries, and mismatched element polarity bindings.
- The v2 validator has 21 PASS checks and 31 adversarial rejection cases,
  including Mercury Equilibrium contamination of its engine interface or a
  Magnetic/Internal channel, Water and Earth glossary contamination of
  Magnetic/Internal, and invalid Earth transition tags.
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
