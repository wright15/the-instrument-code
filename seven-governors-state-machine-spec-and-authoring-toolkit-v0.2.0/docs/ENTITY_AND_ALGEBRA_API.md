# Entity and Algebra Companion Reference

This document explains the installed public graph and the algebra audited by
the mutation companion. It is not a normative schema. Exact topology identity
comes from `../../canonical/`, exact operator behavior comes from
`../../seven-governors-mutation-algebra-audit/`, and profile/runtime names come
from the installed registry and Neo4j imports.

## Core entities

### `GovernorOffice`

**Purpose:** One of seven canonical offices in the declared order
Sun → Moon → Mars → Mercury → Jupiter → Venus → Saturn.

**Identity:** Stable `name`; `officeIndex` records the declared order.

**Owns:** canonical profile, representative photonic anchor, authored process
and directionality in the active profile registry.

**Does not own:** every scale-degree mutation carrying the same Governor name.
It also has no active natural-phenomenon relationship in the installed release.

**Graph:** `(:GovernorOffice {name, officeIndex, canonicalScaleId, canonicalMode})`

**Example:** Jupiter's active `CanonicalFeatureProfile` carries the authored
distribution process. Aeolian is its canonical A0 scale state. The
Rayleigh-scattering mapping elsewhere in this package is a candidate, not an
active office relationship.

### `ScaleState`

**Purpose:** A rooted seven-note pitch-class state.

**Identity:** Graph key `id`, rooted pitch mask, pitch set, Forte family, and
orientation. The packet API renders the graph key as `state.stateId`.

**Owns:** intrinsic role, fine role, and categorical office when seated. Packet
normal-form identity is derived from this destination state plus the active
profile release and domain.

**Graph:** `(:ScaleState {id, bit, pitchSet, forte, role, fineRole, tier, office, officeIndex})`

**Example:** Acoustic `1749` is an A1 anchor in the Moon office.

### `ScaleFamily`

**Purpose:** A Forte set class shared by transpositions, inversions, and rooted
modal states according to the declared equivalence policy.

**Identity:** Forte identifier.

**Graph:** `(:ScaleFamily {forte, nodeId})`

**Owns:** active family-level topology summaries such as state counts,
chirality, topology role, and role counts. Harmonic measure definitions are
separate `HarmonicMeasureDefinition` nodes; the installed `ScaleFamily` nodes
do not expose `CQ` or `SQ` properties.

**Does not own:** a unique Governor office. The seven rooted modes of an anchor
family occupy different offices.

### `CanonicalFeatureProfile`

**Purpose:** Versioned semantic and physical record for one Governor office.

**Identity:** Graph key `profile_id`, profile version, office, and `fingerprint`.
The compiler maps these to `canonicalProfile.profileId` and the nested profile
`intrinsicFingerprint` in packet JSON.

**Owns:** canonical archetype, directionality, process correspondence,
photonic record reference, and domain reference pools.

**Usage:** Resolve from the destination state's State Governor, never from the
Degree Governor on the incoming edge.

**Graph:** `(:GovernorOffice)-[:ACTIVE_PROFILE]->(:CanonicalFeatureProfile)`;
historical membership uses `HAS_CANONICAL_PROFILE` and release identity uses
`PART_OF_RELEASE`.

### `CompiledFeatureProfile`

**Purpose:** A materialized destination/domain normal form in the active
profile-registry projection.

**Identity:** Graph key `normal_form_id` and cache key
`intrinsic_fingerprint`. Packet JSON maps these to `normalFormId` and the
top-level `intrinsicFingerprint`.

**Owns:** stored JSON projections of required, soft-prior, reference-pool,
promoted, suppressed, prohibited, unresolved, and creative-affordance fields.

**Graph:** `(:ScaleState)-[:HAS_NORMAL_FORM]->(:CompiledFeatureProfile)`.
Only four normal forms are materialized in registry `0.1.1`; the HTTP compiler
can produce packets for other known states without first creating graph nodes.

### `MutationOperator`

**Purpose:** A structural function on states. `M` is total over all 462 states;
`R1`-`R7` and `L1`-`L7` are partial.

**Identity:** Graph key `id`, such as `R4`, `L7`, or `M`, within the named
mutation-audit snapshot.

**Owns:** structural domain, action, image, inverse/conjugate declarations,
support counts, and normalization policy.

**Does not automatically own:** semantic effects. These remain empty or
unresolved until admitted.

**Graph:** `(:MutationOperator {id})`. Applications are state-to-state
`MODAL_MUTATES_TO` or `LOCAL_MUTATES_TO` relationships carrying `operatorId`;
there is no `BINDS_OPERATOR` relationship.

## Candidate entities not active in the installed runtime

### Candidate `PhenomenonModel`

**Purpose:** A scientific process used as a framework-authored descriptive
model for one office.

**Identity:** stable model ID plus scientific scope and assumptions.

**Would own:** physical summary, optional formula, source, assignment type,
exclusivity scope, semantic affordances, and nonclaims.

**Candidate example:** `phenomenon:rayleigh_scattering` describes a physical
elastic small-particle scattering regime and is proposed as Jupiter's
namespace-scoped primary descriptive model.

**Runtime status:** Not admitted. The active graph and creation-packet response
do not contain `PhenomenonModel` or `PRIMARY_PHENOMENON`.

### Candidate `CourtState`

**Purpose:** One of five bounded operational states `C0`–`C4`.

**Identity:** four-pole vector in the order Mars, Jupiter, Venus, Saturn.

**Owns:** compression index $\kappa=i/4$, legal adjacent transitions, and an
interpretive operational posture.

**Does not own:** a Governor office or heptatonic scale identity.

**Runtime status:** Not admitted. `CourtState` and `COURT_TRANSITION` appear
only in this package's optional candidate context projection.

### Candidate `LedgerEvent`

**Purpose:** An append-only record of runtime evidence, Court movement, route,
and outcome.

**Identity:** event ID, timestamp, release IDs, input and output fingerprints.

**Owns:** observation and provenance.

**Does not own:** canonical promotion. A ledger pattern can motivate a
hypothesis; promotion requires the semantic admission protocol.

**Runtime status:** No Mercury/Virgo ledger service or `LedgerEvent` graph
label is exposed by the installed integrated release.

## Compiler output

### `CreationPacket`

**Purpose:** Deterministic contract given to a renderer or generative model.

**Identity:** `normalFormId` and top-level `intrinsicFingerprint`.

**Contains:** intrinsic destination state, canonical profile, physical record,
`required`, `softPriors`, `referencePool`, `promoted`, `suppressed`,
`prohibited`, `unresolved`, and `creativeAffordances` arrays.

**Public HTTP status:** `GET /api/creation-packet` accepts only `stateId` and
optional `domain`. It returns `routeContext: null`; route-aware compilation is
available only through the profile registry's direct compiler/CLI, not this
HTTP route.

**Guard:** a renderer may realize listed creative affordances but may not
invent a missing semantic operator rule.

## Structural roles

### `anchor`

An office-bearing state that defines a tier seat rather than inheriting it
from one selected parent.

Required properties:

- accepted seven-mode family;
- one mode in each office;
- closed modal successor orbit;
- no earlier-tier claim;
- declared office-authorizing mechanism; and
- passing family-level invariants.

`A` anchors use canonical or direct achiral midpoint geometry. `D` anchors use
a separately declared, family-wide second-order contact signature. A
convergence alone does not make a D anchor.

### `satellite`

An office-bearing state that inherits its office from exactly one selected
governing parent after bridge tests and tier precedence are applied.

Harmonic Minor is the reference example: it inherits Jupiter from Aeolian even
though its incoming mutation alters the Moon-governed Degree 7.

### `boundary`

A state that remains outside categorical office assignment under the current
eligible-relation protocol.

Boundary is not synonymous with isolated. A boundary can carry rich
relational-office evidence:

- `oriented`: a coherent directional contact vector;
- `convergence_ring`: repeated same-office convergence without admission as an
  anchor tier;
- `mixed_office_junction`: meaningful contacts disagree across offices; or
- `peripheral_leaf`: terminal or sparsely connected residual state.

Relational evidence must never be projected as `OCCUPIES_OFFICE`.

### `convergence`

A relationship pattern in which independently qualified contacts agree on an
office or destination.

Convergence may:

- authorize a declared D-tier office;
- support a boundary subtype; or
- provide a regression fixture.

It is evidence, not a universal role.

### `leaf`

A state with terminal or near-terminal eligible structure under the selected
relation channel. Leafhood is graph-local and must name the channel and
release. It does not imply insignificance.

### `junction`

A state where multiple meaningful paths or office vectors meet. A
mixed-office junction explicitly lacks a single categorical result.

## Relationship API

| Relationship | Direction | Meaning | Categorical? |
|---|---|---|---|
| `BELONGS_TO_FAMILY` | state → family | Forte family membership | No office claim |
| `OCCUPIES_OFFICE` | state → office | Authorized State Governor | Yes |
| `RELATIONAL_OFFICE_EVIDENCE` | state → office | Contact evidence only | No |
| `GOVERNS` | parent → satellite | Selected office inheritance | Yes for destination |
| `CONSTRUCTS` | endpoint → anchor | Declared midpoint/convergence evidence | No; the family rule authorizes the anchor |
| `SEAT_CONTACT` | state → anchor | D-series family-rule evidence | Not by edge alone |
| `MODAL_SUCCESSOR` | state → state | Next rooted mode in an orbit | No automatic office inheritance |
| `AUDITED_HAMMING2` | state → state | Projected fixed-tonic one-tone exchange | No |
| `PHASE_SHIFT` | state → state | Projected adjacent-root seam relation | No |
| `CONVERGENCE_CONTACT` | state → boundary | Same-office boundary contact | No |
| `JUNCTION_CONTACT` | state → boundary | Mixed-office boundary contact | No |
| `LEAF_CONTACT` | state → boundary | Single boundary contact | No |
| `MODAL_MUTATES_TO` | state → state | Formal `M` application | No automatic office inheritance |
| `LOCAL_MUTATES_TO` | state → state | Formal partial raise/lower application | No automatic office inheritance |
| `ACTIVE_PROFILE` | office → canonical profile | Runtime-selected office profile | N/A |
| `HAS_CANONICAL_PROFILE` | office → canonical profile | Historical profile association | N/A |
| `CANONICALIZED_BY` | canonical profile → state | Canonical profile state | N/A |
| `HAS_PHOTONIC_RECORD` | canonical profile → photonic record | Physical anchor record | N/A |
| `ACTIVE_SEMANTIC_OPERATOR` | mutation operator → semantic operator | Active unresolved semantic shell | No |
| `REALIZES` | semantic operator → mutation operator | Structural binding provenance | No |
| `HAS_UNRESOLVED_SCOPE` | semantic operator → unresolved scope | Explicit non-admission | No |
| `HAS_NORMAL_FORM` | state → compiled profile | Materialized packet normal form | N/A |
| `PART_OF_RELEASE` | registry entity → registry release | Version membership | N/A |

Other active profile-projection relationships, including route and fixture
provenance, are enumerated in `GRAPH_AND_COMPILER_API.md`. There is no active
`PRIMARY_PHENOMENON`, `COURT_TRANSITION`, `BINDS_OPERATOR`, `HAS_PROFILE`, or
`SUPPORTED_BY` relationship.

## Algebraic vocabulary

### Partial operator

An operator $T$ is partial when not every state is in its domain. Raising a
degree is undefined when it would collide with the next pitch or cross the
rooted boundary.

Use:

$$
T : \operatorname{Dom}(T) \subseteq S \rightarrow S.
$$

Never convert an undefined application into a boundary edge or semantic
effect.

### Composition

For operators $T_a$ and $T_b$, composition $T_b\circ T_a$ is defined only when
the first result lies in the second domain.

Store:

- ordered operator IDs;
- intermediate states;
- destination state;
- normalization points; and
- release/version.

### Normal form

`NF(s)` is the route-independent intrinsic representation of a resolved
destination state. Route context is stored separately.

### Confluence

Two derivations are confluent when they normalize to the same intrinsic
destination:

$$
\operatorname{NF}(p(s))=\operatorname{NF}(q(t)).
$$

Acoustic is the canonical example.

### Commutation

Two operators commute on a declared domain $D$ when both compositions exist
and:

$$
\operatorname{NF}(T_a(T_b(s)))
=
\operatorname{NF}(T_b(T_a(s)))
\quad \forall s\in D.
$$

One commuting square is a fixture, not a global theorem. Report domain size,
success count, counterexamples, and normalization policy.

### Covariance

A relation is covariant under modal rerooting when applying the modal action
transports a structural relation to the corresponding relation elsewhere in
the orbit. The Aeolian modal fixture is the familiar example.

Covariance concerns symmetry of a relation under an action. It should not be
renamed commutation unless the relevant operator square is explicitly tested.

### Inverse

$T^{-1}$ is an inverse only on the supported image/domain where both
compositions return the original normal form. A declared paired label is not
enough.

### Closure

A set is closed under an operator when every defined application stays inside
the set. Modal anchor rings must close after seven successors.

### Precedence

Classification is not raw nearest-neighbor search. The current protocol checks:

1. earlier accepted identity;
2. bridge/anchor construction in the current tier;
3. direct satellite inheritance;
4. the next eligible tier; and
5. typed boundary classification.

### Meet and join

Do not label D tiers as lattice meets or joins merely because paths converge.
Use `meet` or `join` only after a partial order is declared and the formal
greatest-lower-bound or least-upper-bound property is checked across the
relevant domain. Current D-tier contact signatures are valid without that
stronger theorem.

## State Governor versus Degree Governor

| Question | State Governor | Degree Governor |
|---|---|---|
| What does it label? | Whole destination node/profile | Altered degree on an edge |
| Stored on | `ScaleState.office` / `OCCUPIES_OFFICE` | Structural mutation/contact relationship and `MutationOperator` metadata |
| Cardinality | At most one categorical office | One label per degree mutation |
| Can it assign destination identity? | Yes, under office rules | No |
| Example | Harmonic Minor = Jupiter | Raised Degree 7 = Moon-governed address |

This distinction is a hard invariant.
