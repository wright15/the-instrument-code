# Court Admission and Authority Contract

## 1. Status and scope

This document is the CRT-301 authority contract for EPIC-003. It extends, but
does not modify, `docs/GOVERNOR_DOMAIN_AUTHORITY.md`. Its machine-readable
counterpart is `schemas/court-admission-contract.json`, validated by
`schemas/court-admission-contract.schema.json`.

The contract defines the ownership boundaries required to admit a bounded
Pentatonic Court subsystem. It does **not** complete that admission. Court and
Fivefold runtime material remains `proposed_pending_crt_309`; CRT-302 through
CRT-308 must provide the substrate, invariant, filter, transition, projection,
skill, and context evidence before CRT-309 can make an admission decision.

This contract changes no canonical heptatonic state, office, relationship,
mutation record, profile, or frozen package. The existing GOV-201 contract
remains authoritative for all Governor-domain namespaces.

## 2. Claim-specific authority flow

```text
GOV-201 Governor/domain authority contract
                    |
                    v
CRT-301 Court admission and authority contract
                    |
                    v
CRT-302 substrate + CRT-303 invariants + CRT-304 filter algebra
                    |
                    v
CRT-305 transition policy and hash-chained Court ledger
                    |
                    v
CRT-306 generated Neo4j Court read projection
                    |
                    v
CRT-307 skills + CRT-308 optional bounded context
                    |
                    v
CRT-309 admission decision and versioned release
```

No downstream layer can promote itself. Neo4j, a renderer, an agent, a vault,
or an authored explanation may read Court facts or propose a move, but none can
author Court state, change admission, or write upstream Governor/topology facts.

## 3. Namespace crosswalk

Authority namespaces use dotted lower-camel names. JSON may use camelCase,
Python may use snake_case, and Neo4j may use PascalCase labels, but those
serialization choices do not create separate authorities.

| Namespace | Existing names | Owner and allowed writers | Required separation |
|---|---|---|---|
| `court.state` | Court State, `CourtState`, C0-C4 | Versioned Court runtime policy and hash-chained Court ledger; only the validated transition engine and deterministic replay may write | Not `topology.scaleState`, `runtime.agentState`, or UI state |
| `court.poleRegister` | Court pole register, four-bit register | Versioned substrate for canonical values; validated transition engine for derived runtime values | Cannot write a Governor office, state office, or Degree Governor |
| `court.poleDisposition` | Internal/External, `bit_semantics` | Versioned substrate and transition policy | Internal/External is a bit disposition, not physical interior/exterior, zodiac context, or office occupancy |
| `court.compression` | `kappa_court`, fourth compression coordinate | Versioned substrate with deterministic `i/4` runtime derivation | Not `C_P`, `C_H`, `C_S`, or any physical quantity |
| `court.filter` | Court filter, `P_c`, `diag(c)` | Versioned filter registry and `court-mathematics`; only the deterministic registry builder writes definitions | Projection of a declared mask, not topology mutation, office assignment, or semantic operator effect |
| `court.transition` | Court Modulation, adjacent move, Master's Flip | Versioned transition policy and ledger; only the validated transition engine writes | Not a mutation operator, State-Governor change, or Degree-Governor assignment |
| `court.translocation` | Topological Translocation, non-adjacent jump | Versioned transition policy and ledger; only the validated engine with an evidence-backed record writes | Not ordinary modulation and never an unrecorded jump |
| `court.fivefoldEngine` | Fivefold Engine, controller model | Reviewed Court release process; a new package builder may write only after acceptance evidence | Frozen companion material is proposed, not active authority or a physical system |
| `court.registerGovernor` | pole Governor, `controller.governor` | Versioned substrate and transition policy | Not `governor.office`, `topology.stateOffice`, `aspect.primaryGovernor`, or `runtime.operationalGovernor` |

### Court

"Court" means the bounded C0-C4 controller context and its admitted harmonic
substrate. It does not mean a second `ScaleState`, a Governor office, a task
phase, or arbitrary graph state.

### Fivefold

"Fivefold" names the wider candidate controller model in the frozen companion
package. Only the fields enumerated in section 7 are eligible for EPIC-003
promotion. The term does not admit the complete candidate file.

### Pole and Internal/External

A Court pole is one position in the Mars/Jupiter/Venus/Saturn register. A pole's
Internal/External value is a binary Court disposition. It cannot assign a
State Governor, change a Degree Governor, assert physical interior/exterior, or
overwrite zodiacal interpretation.

## 4. Fourth compression coordinate

The Court coordinate is exact and typed:

```text
kappa(C_i) = i/4
kappa_court in {0/1, 1/4, 1/2, 3/4, 1/1}
```

Intrinsic records use normalized numerator/denominator pairs rather than
floating-point identity. Decimal values in the frozen candidate YAML remain
source evidence only.

The required machine-readable guard is:

> `kappa_court is not C_P, C_H, C_S, temperature, entropy, enthalpy, or free energy.`

Specifically, `court.compression` cannot be written into or treated as equal to
`physical.C_P`, `harmonic.C_H`, `semantic.C_S`, temperature, entropy, enthalpy,
or free energy. It is not a thermodynamic quantity.

## 5. Forbidden writes

No Court operation, pole transition, filter, translocation, projection, agent,
or context bundle may write or manufacture:

- `governor.office`;
- `ScaleState.office`, `ScaleState.officeIndex`, or
  `ScaleState.hasGovernorSeat`;
- an `OCCUPIES_OFFICE` relationship;
- `topology.officeEvidence`;
- `mutation.degreeGovernor`;
- `aspect.primaryGovernor` or `runtime.operationalGovernor`; or
- any state, edge, family, or identity in the canonical heptatonic topology.

Court graph references to a `ScaleState` are ID-only reads. Generated Court
imports may `MERGE` a reference by canonical ID but may not `SET` or `REMOVE`
its properties and may not create an office relationship.

## 6. Amended admission scope

This contract supersedes the integrated-release 1.2.0 pending scope of "all 38
pentatonic set classes." The EPIC-003 target is deliberately narrower:

1. The five rooted Court positions C0-C4 of Forte 5-35.
2. Forte 5-23 and Forte 5-27 as bridge set classes.
3. Only additional pentatonic set classes that CRT-302 proves minimally
   necessary to mediate the Aeolian 7-35 to Harmonic Minor 7-32 example.
4. Carey CQ/SQ evaluation for the 5-35 seed only.
5. `P_c = diag(c)` as the sole filter eligible for admission.

Every other pentatonic set class remains `proposed` with an explicit blocker.
No class becomes canonical because it appears in framework prose, a graph, a
model response, or an off-chain weight-five fixture.

## 7. Fivefold field disposition

The source
`seven-governors-state-machine-spec-and-authoring-toolkit-v0.2.0/schemas/fivefold_engine.yaml`
remains frozen and `admission: proposed`. EPIC-003 may reproduce the following
claims in a **new versioned package** and promote them only at CRT-309 after all
acceptance evidence passes:

- `physical_quantity_claim=false`;
- `pole_order` and `bit_semantics`;
- C0-C4 `canonical_states` with exact-ratio `kappa_court` values;
- adjacent `canonical_transitions`;
- the kappa, Hamming, Gram-matrix, and path-size geometry claims; and
- the guard list, strengthened by the strict machine contract.

The companion's `macro_bracket`, Mercury `controller`, and `runtime_cycle`
remain proposed. Fourier, graph-spectral, and semantic-scoped Court filters,
thermodynamic analogies, natural-phenomenon mappings, and pentatonic classes
outside section 6 also remain proposed.

A Master's Flip is an adjacent `court.transition`. It is not permission to
invent a Court state or bypass validation. A non-adjacent move requires a typed
`court.translocation` record under CRT-305.

## 8. Explicitly out of scope

`physical_phenomena.yaml`, `thermodynamic_processes.yaml`, natural-phenomenon
mappings, and new cultural, regional, or landform semantic enrichment remain
`admission: proposed`. Their admission belongs to EPIC-004 or a separate
semantic candidate release. This separation permits candidate authoring while
preventing semantic work from silently entering the Court admission.

## 9. Topology locks

The following fixtures are acceptance evidence inherited from GOV-201:

| State | Required invariant after every Court operation |
|---|---|
| `1749` Acoustic | Office Moon, disposition `validated`, exactly one `OCCUPIES_OFFICE` edge |
| `2477` Harmonic Minor | Office Jupiter, disposition `inherited`, exactly one `OCCUPIES_OFFICE` edge; incoming Degree Governor remains Moon edge metadata |
| `223` Scale 223 | Office null, disposition `unassigned`, no `OCCUPIES_OFFICE` edge; relational Jupiter evidence remains non-categorical |

`tests/verification/test_graph_topology_locks.py` executes the registered
adjacent Court operations and proves these source/projection fixtures do not
change. Court projection tests reject forbidden authority fields and
`OCCUPIES_OFFICE`, including hash-consistent tampering.

## 10. Admission consequences

CRT-301 accepts this authority contract, not the Court subsystem. CRT-302 has
built `seven-governors-court-substrate-v0.1.0` against this boundary, and
CRT-303 has built `seven-governors-harmonic-invariants-v0.1.0` over the
substrate fingerprint. Both are evidenced candidate packages with no
integrated-release effect. CRT-304 and later stories may consume their
fingerprinted records. CRT-309 is the only EPIC-003 story authorized to admit
evidenced Court artifacts, amend release provenance, and add them to integrated
import/readiness paths.

## 11. Primary references

- `docs/GOVERNOR_DOMAIN_AUTHORITY.md`
- `schemas/court-admission-contract.json`
- `schemas/court-admission-contract.schema.json`
- `framework/AGENTS.md`
- `framework/TOPOLOGICAL_ANCHORING.md`
- `canonical/universal-network-data.json`
- `canonical/topology-identity-definitions.json`
- `court-mathematics/docs/01_COURT_LEXICON.md`
- `scrum/EPIC-003-pentatonic-court-admission.md`
- `scrum/CRT-301-court-admission-contract.md`
- `seven-governors-harmonic-invariants-v0.1.0/README.md`
