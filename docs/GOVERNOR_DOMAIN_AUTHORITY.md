# Governor and Domain Authority Contracts

## 1. Status and scope

This document is the namespace and authority contract for the Governor-domain
runtime planned by EPIC-002. It resolves naming collisions already present in
the integrated release without changing canonical topology, mutation algebra,
profile data, semantic admission, or package admission.

The contract applies to every later `TypedAspect`, classification, transition,
agent, graph-projection, and context-bundle artifact. It is normative for
namespace boundaries and forbidden writes. It does not itself admit a new
runtime package or any candidate ontology.

## 2. Claim-specific authority flow

Authority is resolved by claim class, then projected downstream:

```text
framework intent + integrated-release decisions
                         |
                         v
  canonical topology | mutation audit | profile registry
                         |
                         v
       versioned Governor runtime policy
                         |
                         v
 deterministic classifier / transition engine / ledger
                         |
                         v
            generated Neo4j read projection
                         |
                         v
             named reads and renderers

optional vault/model context -> evidence or proposal only
```

| Claim class | Authoritative owner | Allowed authoritative writers | Read-only consumers and projections |
|---|---|---|---|
| Framework meaning and declared correspondences | `framework/` and `schemas/governors.yaml`, constrained by later release decisions | Reviewed framework release process | Registries, policy builders, documentation |
| Rooted scale identity, role, tier, and office | `canonical/universal-network-data.json` | Audited topology release builders only | Neo4j, compiler providers, classifiers, renderers |
| Structural mutation and Degree Governor | `seven-governors-mutation-algebra-audit/audit/` | Mutation-audit builder and reviewed package release | Neo4j, compilers, runtime policy |
| Feature definitions, profiles, semantic admission, and executable domain projections | `seven-governors-canonical-feature-profile-registry-v0.1.1/canonical/` | Profile-registry builder for a new reviewed package version | Neo4j, compilers, future runtime policy |
| Typed-aspect and bridge-rule admission | Versioned `governor-runtime` policy | Deterministic policy builder and reviewed policy release | Classifier, Neo4j projection, agent skills |
| Classification results | Fingerprinted runtime policy plus normalized request | Deterministic classifier only | Transition engine, ledger, named graph projection |
| Agent task state and verification | Append-only runtime ledger under a fingerprinted transition policy | Transition engine and registered verifiers only | Model, skills, optional graph projection |
| Graph records | Rebuild from the owners above | Generated Neo4j import only | Named Cypher reads and API provider |
| Presentation state | Renderer | Renderer only | User interface |
| Context and proposed action | User, bounded vault bundle, or model | Context-bundle builder or model may propose only | Classifier and transition validator |

No downstream writer may promote its output upstream. A manual Neo4j edit,
renderer coordinate, model response, vault note, task classification, or
runtime verification result cannot become topology, mutation, profile, or
admission truth.

When prose and installed machine data conflict, the accepted integrated-release
machine data and the latest decision-ledger ruling control runtime behavior.
For example, the unbundled `CONSTITUTION.md` reference in
`schemas/governors.yaml` has `runtimeAuthority = false` in the profile
registry's `canonical/source-authority-registry.json`. It cannot override the
installed release.

## 3. Formal separation model

Let `G` be the closed set of seven Governor labels:

```text
G = {Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn}
```

Let `A` be the set of aspects admitted by one versioned Governor-runtime policy.
Each admitted aspect has exactly one primary Governor:

```text
primaryGovernor: A -> G
forall a in A: exists exactly one g in G such that primaryGovernor(a) = g
```

A `TypedAspect` is a versioned, source-backed facet contract. It identifies a
facet path and owner scope; references an existing `featureId` or an explicit
unresolved slot; declares its epistemic class, admission, provenance, and
primary Governor; and is accepted only through a deterministic policy build.
An unreviewed phrase or model label is not a `TypedAspect`.

Let `E` be the set of entities classified under that policy:

```text
entityAspects: E -> P(A)
governorAssociation: (E union A) -> P(G)
```

An entity may compose zero or more admitted aspects. Those aspects may have
different primary Governors. `governorAssociation` records supporting,
contextual, evidentiary, or authored associations and is non-categorical. It
does not satisfy `primaryGovernor`, select an office, or imply physical
causation.

Let `S` be the canonical 462 rooted heptatonic `ScaleState` values and `O` the
seven canonical `GovernorOffice` values:

```text
occupiesOffice: S -> O?
```

`occupiesOffice` is the existing partial topology relation represented by
`ScaleState.office` plus exactly one `OCCUPIES_OFFICE` edge when defined. It is
defined for 308 seated states and undefined for 154 office-withheld boundary
states. Aspect classification and non-categorical association do not totalize
this relation.

Let `T` be runtime agent tasks:

```text
operationalGovernor: T -> G?
```

`operationalGovernor` is an optional, task-local classification accepted by a
versioned runtime policy. A model may propose it; only the deterministic
runtime may accept or change it. It may guide legal skill selection but cannot
write harmonic identity, `ScaleState.office`, `OCCUPIES_OFFICE`, topology
evidence, mutation metadata, a profile, or `primaryGovernor`.

Raw classification is deliberately partial:

```text
classificationOutcome = classified | ambiguous | unresolved | invalid
```

Exactly-one completeness applies to each admitted `TypedAspect` definition,
not to every raw phrase and not to an entity as a whole. `ambiguous`,
`unresolved`, and `invalid` are valid abstention outcomes; office order is not
a fallback classifier.

## 4. Governor namespace crosswalk

| Namespace | Existing names or symbols | Meaning and owner | Allowed writes and forbidden promotion |
|---|---|---|---|
| `governor.office` | `officeOrder`, `GovernorOffice.name`, `canonicalScaleId`, `canonicalMode` | Seven-office roster owned by the canonical topology release | Topology release only; never an agent or Court register |
| `topology.stateOffice` | State Governor, `ScaleState.office`, `officeIndex`, `hasGovernorSeat`, `OCCUPIES_OFFICE` | Categorical rooted-state office owned by canonical topology | Topology release only; aspect/runtime classifications cannot write it |
| `topology.officeEvidence` | `relationalOffice`, `pluralityContactOffice`, contact vectors, `RELATIONAL_OFFICE_EVIDENCE` | Non-categorical boundary evidence owned by canonical topology | Topology audit only; cannot be promoted to a seat without a new admitted topology rule |
| `mutation.degreeGovernor` | Degree Governor, `degreeGovernor`, `degree_governor` | Altered scale-degree address on a mutation edge/operator, owned by mutation audit | Mutation audit only; cannot assign destination State Governor |
| `topology.governingParent` | `GOVERNS`, selected governing parent | Categorical office inheritance relation between two scale states | Topology release only; "governs" here is not a Governor identity or agent role |
| `profile.governor` | `governors.<office>`, `CanonicalFeatureProfile.office` | Versioned office correspondences and canonical profile owned by framework/profile registry | New profile release only; cannot choose an arbitrary state's office |
| `aspect.primaryGovernor` | `TypedAspect.primaryGovernor` | Exactly-one mapping for each admitted facet, owned by the versioned runtime policy | Policy builder only; candidate phenomenon `primary` fields do not populate it |
| `entity.governorAssociation` | supporting or contextual `governor` references | Zero-or-more non-categorical entity/aspect links owned by a source-backed domain registry | Registry/policy release only; cannot imply exclusivity, office occupancy, or causation |
| `court.registerGovernor` | candidate `controller.governor`, pole Governor | Proposed Fivefold/Court controller role | No active writer; cannot alter any active Governor namespace |
| `runtime.operationalGovernor` | `AgentTask.operationalGovernor`, operational profile language | Optional task-local execution classification owned by runtime policy and ledger | Transition engine only after validation; cannot mutate harmonic or semantic canon |

## 5. Domain namespace crosswalk

| Namespace | Existing names or symbols | Meaning and owner | Non-equivalence rule |
|---|---|---|---|
| `mutation.functionDomain` | operator `domain_rule`, `domain_size`, partial-function domain | Valid `ScaleState` inputs owned by mutation audit | Not a semantic or application topic |
| `semantic.effectDomain` | semantic claim `domain`, domain restriction | Scope for a proposed/admitted semantic operator effect, owned by semantic admission policy | Cannot be inferred from structural operator domain or Degree Governor |
| `feature.domainScope` | `FeatureDefinition.domainScope`, graph `domain_scope` | Feature applicability metadata owned by feature registry | `all`, `cross_domain`, and `landforms` are scope markers, not interchangeable projection IDs |
| `profile.domainReferences` | `domain.*`, `domainReferences`, Governor `reference_library` | Authored selectable reference pools owned by framework/profile registry | References are candidates, not entity facts or exhaustive requirements |
| `projection.domain` | `DomainProjection.domain`, API `domain`, normal-form domain component | Executable compilation contract owned by domain-projection registry | Only `landforms` is admitted in v0.1.1; provider and API select but do not author it |
| `zodiac.topicDomain` | `governors.*.zodiacal_systems.*.domain` | Twelve authored topic-tag lists owned by structured Governor sources | Not an operator domain, feature scope, or executable `DomainProjection` |
| `physical.modelScope` | physical scope, variables, units, assumptions, formula domain | Validity scope of a scientific calculation, owned by its scientific/model source | Physical validity does not make a Governor association empirical or causal |
| `entity.domain` | landform, architecture, botany, material, symbolic, and future entity ontologies | Application ontology owned by a future versioned domain registry | Only an admitted policy may define `TypedAspect` mappings; prose similarity is insufficient |

## 6. State and disposition namespace crosswalk

| Namespace | Meaning and owner | Required separation |
|---|---|---|
| `topology.scaleState` | Rooted weight-seven harmonic identity in canonical topology | Not Court, UI, or agent state |
| `compiler.stateView` | Derived packet/normal-form view of a canonical scale state | Cache/projection only; never a second topology authority |
| `court.state` | Proposed C0-C4 Fivefold controller context | Candidate only; not `ScaleState` or agent transition phase |
| `runtime.zodiacContext` | Framework twelve-node/bracket execution language | Prose context until separately admitted; not Court or topology state |
| `runtime.agentState` | Prior/current task state and ledger snapshot | Transition engine and ledger only; model, graph, renderer, and vault are non-writers |
| `presentation.uiState` | Selection, filter, hover, view, and dial state | Ephemeral renderer state only |
| `topology.officeDisposition` | `validated`, `inherited`, `unassigned`, office-bearing/withheld topology result | Independent of semantic and release admission |
| `semantic.admission` | `unresolved`, `proposed`, `fixture_supported`, `provisionally_admitted`, `canonical` | Structural validation does not advance this axis |
| `evidence.validation` | Evidence result under a named method and verifier | Valid evidence supports a claim but is not admission or office occupancy |
| `policy.admission` | Aspect/bridge policy membership, including admitted versus unresolved | Versioned policy release only; classifier output cannot self-admit |
| `release.admission` | Integrated package/extension state such as `proposed` or `admitted` | Decision-ledger release act only |
| `classification.outcome` | `classified`, `ambiguous`, `unresolved`, `invalid` | Per-request/facet result, not a topology role or admission stage |
| `runtime.transitionPhase` | Inspect/propose/validate/execute/evidence/verify lifecycle | Operational progress only; not semantic maturity or harmonic state |

The word "validated" is never sufficient by itself. A record must name its
axis, policy/method, verifier, and provenance. In particular, validated
topology, validated evidence, canonical semantic admission, admitted policy
membership, office-withheld topology, and verified runtime execution remain
independent facts.

## 7. Existing FeatureDefinition crosswalk

The active registry contains exactly 31 definitions: five physical, five
harmonic, seven semantic, six domain, and eight generative. The disposition
terms below mean:

| Disposition | Contract |
|---|---|
| `reusable` | Preserve the existing ID and meaning; a future runtime wrapper may add typed provenance, quantities, or bridge references without changing the definition. |
| `extended` | Preserve the existing ID, but define strict item shape, aspect/entity binding, cardinality, writer, and provenance in the new runtime package. |
| `unresolved` | Preserve the existing ID and explicit absence; no heuristic value is allowed. |

| Existing feature ID | Disposition | Typed-aspect/runtime crosswalk |
|---|---|---|
| `physical.wavelength_nm` | reusable | Office-scoped framework-declared anchor; wrap as a length quantity, never an entity observation |
| `physical.frequency_hz` | reusable | Office-scoped SI derivation from wavelength; wrap as frequency quantity |
| `physical.photon_energy_j` | reusable | Office-scoped SI derivation; wrap as energy quantity in joules |
| `physical.photon_energy_ev` | reusable | Same energy in electron-volts; conversion must be registered |
| `physical.C_P` | reusable | Dimensionless registry coordinate derived from anchors; not an absolute endpoint or classifier |
| `harmonic.canonical_scale_state` | reusable | Canonical A0 office anchor only; not an arbitrary destination state |
| `harmonic.pitch_mask` | reusable | Rooted 12-bit harmonic identity |
| `harmonic.forte_family` | reusable | Audited family identity |
| `harmonic.anchor_tier` | reusable | Validated topology stratum for a state |
| `harmonic.C_H` | unresolved | No aggregate formula, method, or admitted value in v0.1.1; remain null/unresolved |
| `semantic.thermodynamic_function` | reusable | Authored office correspondence, explicitly non-causal |
| `semantic.optical_function` | reusable | Authored office metaphor distinct from measured wavelength |
| `semantic.directionality` | reusable | Authored office orientation |
| `semantic.archetypal_role` | reusable | Authored office role statement |
| `semantic.element` | reusable | Nullable authored correspondence |
| `semantic.zodiacal_systems` | extended | Retain source object; expose each of twelve systems as typed facets with provenance |
| `semantic.C_S` | reusable | Ordered, non-metric semantic coordinate; never substitute for `C_P` or `C_H` |
| `domain.landforms` | extended | Office reference library plus the sole active executable domain projection |
| `domain.architecture` | extended | Office reference library; no active executable projection |
| `domain.botany` | extended | Office reference library; no active executable projection |
| `domain.material` | extended | Office reference library; no active executable projection |
| `domain.color_associations` | extended | Office reference library; authored association rather than measurement |
| `domain.symbolic_references` | extended | Office reference library; symbolic association only |
| `generative.required_features` | extended | Strict compiler-owned output-container item schema |
| `generative.soft_priors` | extended | Strict compiler-owned advisory item schema |
| `generative.reference_pool` | extended | Strict compiler-owned selectable-pool item schema |
| `generative.promoted_features` | extended | Strict item schema; only admitted semantic effects may populate it |
| `generative.suppressed_features` | extended | Strict item schema; only admitted semantic effects may populate it |
| `generative.prohibited_features` | extended | Strict compiler-owned rejection/repair item schema |
| `generative.unresolved_features` | extended | Strict unresolved-scope item schema; absence is not "no effect" |
| `generative.creative_affordances` | extended | Strict renderer-controlled-variable item schema, not factual assertions |

Totals: 15 reusable, 15 extended, and one unresolved, for 31 exactly. No
replacement vocabulary is introduced.

The current compiler also emits four constraint `featureId` strings that are
not members of this 31-definition registry:

| Compiler string | GOV-201 disposition |
|---|---|
| `harmonic.scale_state` | Compatibility gap. It means an arbitrary compiled destination and must not be aliased to A0-only `harmonic.canonical_scale_state`. |
| `semantic.governor_office` | Compatibility gap. It is a derived copy of canonical topology office resolution, not a new office authority. |
| `physical.musical_to_optical_causation` | Prohibition marker, not a registered positive physical feature. |
| `semantic.unproven_operator_effect` | Prohibition marker, not an admitted semantic feature. |

GOV-202 must resolve these through a versioned schema/registry extension or a
strictly typed constraint-marker contract. Until then they cannot be treated
as admitted `FeatureDefinition` IDs. The frozen v0.1.1 package must not be
edited in place.

## 8. Admission boundaries

Semantic effects continue to follow
`seven-governors-canonical-feature-profile-registry-v0.1.1/docs/SEMANTIC_ADMISSION_POLICY.md`.
`unresolved`, `proposed`, `fixture_supported`, `provisionally_admitted`, and
`canonical` remain distinct. Only the last two stages may populate executable
semantic effect lists.

The following remain unchanged and outside the active runtime:

| Candidate material | Current status | Forbidden side effect |
|---|---|---|
| Fivefold Engine and Court C0-C4 | Proposed companion material | Cannot become operational state, topology, or Governor authority |
| Natural-phenomenon mappings | Proposed companion material | Cannot populate admitted aspects or assert empirical/causal ownership |
| Pentatonic topology, including all 38 weight-five families | Not admitted | Cannot enter active topology or mutation domains |

Fixture-supported structural or normalization examples have
`semanticEffectEvidence = false`; they do not admit a semantic mapping. A
boundary's validated relational evidence remains `categorical = false` and
does not admit office occupancy.

## 9. Topology lock fixtures

These fixtures are regression locks for every future aspect classifier,
operational classifier, graph projection, and context bundle. Their canonical
source is `canonical/universal-network-data.json`; the CSV rows demonstrate the
current Neo4j projection.

| State | Canonical topology facts | Projection evidence | Required result after contextual/operational classification |
|---|---|---|---|
| `1749` Acoustic | `role = anchor`, `fineRole = anchor_A1`, `tier = A1`, `office = Moon`, `assignmentStatus = validated` | `occupies:1749:Moon` is categorical | Office remains Moon; exactly one `OCCUPIES_OFFICE -> Moon` |
| `2477` Harmonic Minor | `role = satellite`, `fineRole = satellite_A0`, `tier = A0`, `office = Jupiter`, `assignmentStatus = inherited`; parent `1453` Aeolian; incoming edge Degree Governor is Moon | `governs:A0:1453:2477:0` plus `occupies:2477:Jupiter` | Office remains Jupiter; Moon remains edge metadata only |
| `223` Scale 223 | `role = boundary`, `fineRole = oriented_convergence`, `tier = null`, `office = null`, `assignmentStatus = unassigned`; relational office Jupiter from two contacts | `office-evidence:223:Jupiter` has `categorical = false`; no `occupies:223:*` row | Office and tier remain null; no `OCCUPIES_OFFICE`; relational evidence may remain |

An entity aspect may classify context around any fixture, and an agent task may
receive an operational Governor, but neither operation may modify the listed
facts. Neo4j validation must continue to enforce one categorical office for a
seated state and none for a boundary state.

## 10. Frozen-package extension strategy

The installed mutation-audit v1.0.0, profile-registry v0.1.1, and companion
toolkit v0.2.0 directories are frozen release inputs. GOV-201 changes none of
their files.

GOV-202 created `seven-governors-governor-runtime-v0.1.0` with policy release
`governor-runtime:0.1.0`. Its machine contracts reference existing feature IDs
and exact source hashes, carry the crosswalk above, and publish runtime-only
constraint markers under explicit namespaces. The package is validated but
its integrated release admission remains `proposed`; classification execution
belongs to GOV-203. It does not patch copied source snapshots, redefine
`OCCUPIES_OFFICE`, infer Degree Governor, or convert candidate companion data
into active policy.

Later graph support must be generated from canonical and verified runtime
records. Deleting Neo4j must not change classification, replay, or admission;
rebuilding Neo4j must reproduce the same projection. Obsidian and model inputs
remain bounded evidence/proposals and are never package, graph, or execution
authority.

## 11. Required invariants

1. Every admitted `TypedAspect` has exactly one `primaryGovernor`.
2. An entity may compose multiple aspects with different primary Governors.
3. Non-categorical associations never imply `primaryGovernor` or office occupancy.
4. `occupiesOffice` remains partial at 308 seated and 154 office-withheld states.
5. Degree Governor remains mutation-edge/address metadata.
6. `operationalGovernor` remains optional, task-local, and replayable.
7. Classification abstains on ambiguity, unresolved input, or invalid input.
8. Admission, evidence validation, topology disposition, classification outcome, and runtime verification remain separate axes.
9. Only admitted `DomainProjection` records are executable application domains.
10. Physical quantities, authored correspondences, reference pools, and causal claims retain distinct epistemic classes.
11. Frozen package sources are extended by a new versioned package, never edited in place.
12. Court/Fivefold, phenomena, and pentatonic admission remain unchanged.

## 12. Primary references

- `provenance/SOURCE_AUTHORITY.md`
- `provenance/DECISION_LEDGER.md`
- `canonical/universal-network-data.json`
- `docs/TOPOLOGY_IDENTITY_AND_INVARIANTS.md`
- `docs/GRAPH_AND_COMPILER_API.md`
- `schemas/governors.yaml`
- `seven-governors-mutation-algebra-audit/audit/operator-candidates.json`
- `seven-governors-canonical-feature-profile-registry-v0.1.1/canonical/feature-registry.json`
- `seven-governors-canonical-feature-profile-registry-v0.1.1/canonical/domain-projection-registry.json`
- `seven-governors-canonical-feature-profile-registry-v0.1.1/canonical/source-authority-registry.json`
- `seven-governors-canonical-feature-profile-registry-v0.1.1/docs/SEMANTIC_ADMISSION_POLICY.md`
- `scrum/EPIC-002-governor-domain-agent-runtime.md`
- `scrum/GOV-202-typed-aspects-quantities-bridges.md`
