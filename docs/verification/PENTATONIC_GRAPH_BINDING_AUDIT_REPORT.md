# Pentatonic Graph Binding Audit Report

**Status:** Phase 3 planning evidence; prose context, not admitted  
**Specification:** `pre-epic-400.pentatonic-7-35-binding.v1`  
**Admission effect:** None

## Scope

This report records the prose-tier zodiac appendix for the pentatonic-to-7-35
binding audit. It reads the authored records in `schemas/governors.yaml` and
the functional tier ordering in `framework/AGENTS.md`; it does not extend the
Phase 2 graph projection.

The twelve records below remain authored `semantic.zodiacal_systems` facets
with structured-source provenance. Their operational interpretation within
`runtime.zodiacContext` is **prose context, not admitted**. They are not
topology, Court state, graph topology, runtime state, or an admission decision.
This report creates no Zodiac node, relationship, runtime implementation,
Cypher implementation, API behavior, or decision-ledger entry.

## Verified Harmonic Context

Phase 1 established five reviewed Court witnesses with these canonical 7-35
parent windows:

| Court realization | Pentatonic mask | Canonical 7-35 parent window |
|---|---:|---|
| C0 | 661 | Sun, Moon, Mars |
| C1 | 677 | Moon, Mars, Mercury |
| C2 | 1189 | Mars, Mercury, Jupiter |
| C3 | 1193 | Mercury, Jupiter, Venus |
| C4 | 1321 | Jupiter, Venus, Saturn |

These are subset-parent witnesses for exact pentatonic realizations. They do
not assign signs to pitch classes, identify zodiac records with `ScaleState`
nodes, or turn a Governor window into a zodiac graph relation. Phase 2 projects
only the reviewed exact realizations and their 19 `SUBSET_OF_7_35` incidences;
it contains no Zodiac node or edge.

## Source-Vector Contract

The structured source declares `binary_12bit` as the constructive string in
semitone-index order 0 through 11. For the five bipolar Governors, the legacy
field name `binary_12bit_lsb` supplies the internal-pole source vector. Phase 1
verified that each internal vector equals `T1` of its Governor's constructive
vector. `binary_12bit_lsb` is not a general serialization rule, and the pair is
not an exact complement pair.

Each table value is the complete 12-bit source vector referenced by one
authored zodiac record. It is not one pitch-class value assigned to that sign.
The `derives_from` field is provenance within `schemas/governors.yaml`, not a
runtime derivation or graph edge.

## Twelve-Record Zodiac Appendix

| Node | Sign | Governor | Authored zodiac pole | Source-vector field | Source vector | `T1` relation | Coincident inversion witness |
|---:|---|---|---|---|---|---|---|
| 1 | Leo | Sun | Monopolar | `canonical_expression.binary_12bit` | `101010110101` | Not applicable; no paired pole | Not applicable |
| 2 | Cancer | Moon | Monopolar | `canonical_expression.binary_12bit` | `101011010101` | Not applicable; no paired pole | Not applicable |
| 3 | Gemini | Mercury | External | `canonical_expression.binary_12bit` | `101101010110` | Node 3 -> 4 is `T1` | The same output also satisfies `I1` |
| 4 | Virgo | Mercury | Internal | `canonical_expression.binary_12bit_lsb` | `010110101011` | Node 3 -> 4 is `T1` | The same output also satisfies `I1` |
| 5 | Aries | Mars | External | `canonical_expression.binary_12bit` | `101011010110` | Node 5 -> 6 is `T1` | The same output also satisfies `I3` |
| 6 | Scorpio | Mars | Internal | `canonical_expression.binary_12bit_lsb` | `010101101011` | Node 5 -> 6 is `T1` | The same output also satisfies `I3` |
| 7 | Sagittarius | Jupiter | External | `canonical_expression.binary_12bit` | `101101011010` | Node 7 -> 8 is `T1` | The same output also satisfies `I11` |
| 8 | Pisces | Jupiter | Internal | `canonical_expression.binary_12bit_lsb` | `010110101101` | Node 7 -> 8 is `T1` | The same output also satisfies `I11` |
| 9 | Libra | Venus | External | `canonical_expression.binary_12bit` | `110101011010` | Node 9 -> 10 is `T1` | The same output also satisfies `I9` |
| 10 | Taurus | Venus | Internal | `canonical_expression.binary_12bit_lsb` | `011010101101` | Node 9 -> 10 is `T1` | The same output also satisfies `I9` |
| 11 | Aquarius | Saturn | External | `canonical_expression.binary_12bit` | `110101101010` | Node 11 -> 12 is `T1` | The same output also satisfies `I7` |
| 12 | Capricorn | Saturn | Internal | `canonical_expression.binary_12bit_lsb` | `011010110101` | Node 11 -> 12 is `T1` | The same output also satisfies `I7` |

The inversion entries are independent set-theoretic witnesses. Because these
7-35 realizations are inversionally symmetric, a `T1` destination can coincide
with an `In` destination. Equality of outputs does not identify the intended
operator: the authored internal source field records the `T1` relation, while
the inversion is reported only as a coincident mathematical witness. Neither
relation is exact complement.

## Functional Tier Boundary

The authored twelve-node partition is:

```text
2 monopolar luminaries + (5 bipolar Governors * 2 poles) = 12 records
```

Its operational prose roles remain distinct:

- Sun and Moon form the macro-context bracket.
- Gemini/Mercury External is the engine interface; Virgo/Mercury Internal is
  the observational story-ledger. Mercury is the engine/ledger hinge and is
  not a fifth elemental Court register.
- Mars, Jupiter, Venus, and Saturn are the four Court registers, ordered Fire,
  Air/Wind, Water, and Earth.
- The zodiac External/Internal terms do not populate or define
  `court.poleDisposition`. The Court contract explicitly makes physical
  interior/exterior, zodiac Internal/External, and topology office occupancy
  non-equivalent.

## Non-Claims And Admission Boundary

This appendix makes the following boundaries explicit:

1. There is no sign-to-pitch-class assignment. Twelve authored records and
   twelve pitch classes have equal cardinality, but cardinality alone does not
   establish a 12-TET isomorphism. Any future bijection would require an
   explicit origin, orientation, mapping function, and structure-preservation
   test under separate review.
2. Sun and Moon are monopolar luminaries because the authored Governor source
   declares them so. Lydian/Ionian spacing, membership in 7-35, or maximal
   evenness does not prove luminary status.
3. Electric, magnetic, and photonic language remains authored context unless
   supported by a separately declared physical model. Even a valid physical
   model would not by itself make a Governor association empirical or causal.
   This report claims no physical identity or equivalence among electric,
   magnetic, photonic, or `physical.C_P`; it also does not equate any of them
   with Court compression.
4. Zodiac topic domains are authored semantic tag lists, not operator domains,
   feature scopes, executable `DomainProjection` records, physical model
   scopes, or topology offices.
5. No zodiac record is admitted as a graph node, runtime state, Court pole,
   canonical `ScaleState`, office assignment, or pentatonic class endpoint.
6. This report does not execute CRT-310, promote any proposed class, activate
   an epic, alter an admission record, or create a decision-ledger effect.

## Source Basis

- `schemas/governors.yaml`: bit-order policy, seven Governor records, twelve
  `zodiacal_systems` records, source-vector fields, and authored provenance.
- `framework/AGENTS.md`: "The 12-Node State Machine (Chromatic Field)" and
  "The Canonical 5-35 Pentatonic Court" functional boundaries.
- `docs/GOVERNOR_DOMAIN_AUTHORITY.md`: zodiac topic-domain ownership,
  `runtime.zodiacContext`, and physical/semantic namespace separation.
- `schemas/court-admission-contract.json`: separation of zodiac pole language
  from `court.poleDisposition`.
- `canonical/pentatonic-binding-candidates/pentatonic-7-35-parent-audit-v1.json`:
  Phase 1 representation checks and reviewed Court parent windows.
