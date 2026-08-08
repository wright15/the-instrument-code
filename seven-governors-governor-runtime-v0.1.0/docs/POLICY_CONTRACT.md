# Governor Runtime Policy Contract

## Public schemas

| Schema | Contract |
|---|---|
| `schemas/typed-aspect.schema.json` | One source-backed facet, existing feature binding, owner scope, epistemic/admission state, and exactly one primary Governor |
| `schemas/quantity.schema.json` | Numeric value with dimension, unit, epistemic basis, provenance, and assumptions |
| `schemas/bridge-rule.schema.json` | Antecedents and one aspect/Governor output under explicit authority, scope, admission, priority, and conflict behavior |
| `schemas/classification-request.schema.json` | Bounded subject, typed facts/quantities, and requested facet IDs; no entity-level Governor field |
| `schemas/classification-result.schema.json` | Per-facet classified, ambiguous, unresolved, or invalid result with policy/source/request/result fingerprints |
| `schemas/policy-release.schema.json` | Complete source-bound crosswalk, operations, aspects, rules, active IDs, and policy fingerprint |

All objects, including nested records, reject unknown properties. JSON Schema
validates local shape; `scripts/validate-package.mjs` additionally enforces
source, feature, aspect, rule, operation, and admission closure.

## Closed vocabularies

| Vocabulary | Values |
|---|---|
| Governor | `Sun`, `Moon`, `Mars`, `Mercury`, `Jupiter`, `Venus`, `Saturn` |
| Dimension | `length`, `frequency`, `energy`, `dimensionless` |
| Unit | `nm`, `m`, `Hz`, `J`, `eV`, `one`, `normalized_inverse_wavelength` |
| Admission | `unresolved`, `proposed`, `fixture_supported`, `provisionally_admitted`, `canonical` |
| Owner scope | `governor.office`, `topology.scaleState`, `topology.scaleFamily`, `topology.scaleStateOrFamily`, `profile.governor`, `entity.aspect`, `runtime.task`, `compiler.output`, `phenomenon.model` |
| Rule scope | `office.profile`, `office.anchor`, `physical.model`, `domain.process`, `entity.facet`, `compiler.output` |
| Missing policy | `rule_not_applicable`, `return_unresolved`, `reject_invalid` |
| Conflict policy | `prefer_higher_priority_then_ambiguous`, `return_ambiguous`, `reject_invalid` |
| Result | `classified`, `ambiguous`, `unresolved`, `invalid` |

The epistemic vocabulary distinguishes framework-declared physical anchors,
physical derivations, observed measurements, audited topology, authored
correspondences/descriptive models, empirical domain facts, reference pools,
compiled constraints, causal claims, and unresolved measures. These classes
cannot substitute for one another.

## Quantities and operations

| Unit | Dimension |
|---|---|
| `nm`, `m` | length |
| `Hz` | frequency |
| `J`, `eV` | energy |
| `one`, `normalized_inverse_wavelength` | dimensionless, but not interchangeable units |

Direct addition/comparison requires the same dimension and unit. Conversion or
cross-dimension derivation requires one registered operation:

| Operation | Signature |
|---|---|
| `operation:length-nm-to-m:v1` | length nm -> length m |
| `operation:energy-j-to-ev:v1` | energy J -> energy eV |
| `operation:vacuum-wavelength-frequency:v1` | length nm -> frequency Hz |
| `operation:photon-energy-frequency:v1` | frequency Hz -> energy J |
| `operation:photonic-compression:v1` | length nm -> registry dimensionless coordinate |
| `operation:relative-rayleigh:v1` | two length nm inputs -> fixed-condition relative ratio |

Formula strings are documentation, not a generic expression-evaluation API.
Only named operations may execute in later stories.

## Bridge rules

Every bridge rule records antecedent IDs/facts, output aspect and Governor,
scope, authority source IDs, epistemic class, admission, integer priority,
missing/conflict policies, provenance, and `causalClaim`.

Only `provisionally_admitted` and `canonical` rules/aspects may appear in active
ID lists. Equal-priority conflicting Governors must return `ambiguous`; office
order is not a tiebreaker. A rule with physical feature evidence must also bind
the exact authoritative owner so a numeric observation alone cannot classify a
Governor.

## Feature closure

`canonical/feature-typed-aspect-crosswalk.json` preserves exactly the 31
upstream FeatureDefinitions. `harmonic.C_H` remains unresolved. The four
unregistered compiler strings are represented separately as:

- `runtime.constraint.destination_scale_state`
- `runtime.constraint.resolved_governor_office`
- `runtime.prohibition.musical_to_optical_causation`
- `runtime.prohibition.unproven_operator_effect`

## Canonical examples

`canonical/canonical-bridge-examples.json` contains four non-equivalent cases:

1. Jupiter 470 nm: canonical framework-declared anchor plus registered SI
   frequency/energy derivations, explicitly not observation or causation.
2. Rayleigh: `(700/470)^4 = 4.920403608350627` under fixed regime assumptions;
   the Governor descriptive bridge remains proposed/inactive.
3. Atmospheric/aeolian process: proposed authored association, explicitly
   distinct from musical `mode:aeolian` and from physical causation.
4. Symbolic profile: canonical exact-profile reference-pool association;
   arbitrary eagle entities are not classified from the term alone.
