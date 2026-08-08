# Canonical Feature Profiles and Mutation Algebra

## A Formalization Roadmap for the Seven Governors Framework

**Status:** Proposed development specification  
**Version:** 0.1  
**Date:** 2026-07-24

---

## 1. Purpose

The Seven Governors Framework already defines a canonical harmonic field, a set
of Governor identities, Chaldean degree addresses, a Pentatonic Court, and a
Mercurial mechanism for moving between states. The next stage is to give that
architecture a sufficiently structured semantic substrate that alternative
Governor states can be derived from canonical states rather than described
independently or improvised by a language model.

The intended system should be able to:

1. Store rich canonical profiles for the seven Governors.
2. Include harmonic, binary, photonic, operational, symbolic, and empirical
   domain data without confusing their epistemic status.
3. Represent real entities—such as landforms, organisms, materials,
   architectures, characters, or narrative processes—through typed relations
   to canonical Governor features.
4. Represent a Chaldean degree alteration as a declared transformation
   operator.
5. Compile an alternative state into a deterministic intrinsic feature
   profile.
6. Produce the same intrinsic result when multiple valid derivation paths
   reach the same harmonic state.
7. Preserve the path by which the state was reached without allowing that path
   to overwrite the state’s identity.
8. Project the resulting feature profile into specific domains such as
   landforms, flora, fauna, geology, ecology, architecture, character
   psychology, or narrative.
9. Give every derived feature an inspectable provenance trace.
10. Allow a probabilistic language model to render, explain, or elaborate a
    result without permitting the model to invent the deterministic substrate.

The resulting artifact is not intended to be merely a larger catalog of
correspondences. It is intended to become a **canonical semantic ontology plus
a harmonic transformation algebra**.

---

## 2. Relationship to the Existing Documents

This specification is intended to complement, not replace, the three core
documents:

- `AGENTS.md` defines how an agent should operate inside the framework.
- `natural-organization-thesis.md` provides the philosophical and natural
  organization thesis.
- `TOPOLOGICAL_ANCHORING.md` defines the harmonic and topological constraints.

This document concentrates on the missing implementation bridge between those
layers:

> How canonical Governor knowledge becomes structured data, how degree
> mutations transform that data, and how alternative states compile into
> reproducible domain-specific profiles.

---

## 3. Governing Design Principles

### 3.1 State Governor and Degree Governor remain separate

The **State Governor** identifies the office occupied by the complete state.
The **Degree Governor** identifies the Chaldean address altered along a
transition.

Governor identity belongs to the node. Degree mutation belongs to the edge.

For example:

- Harmonic minor is an **alternative Jupiter state** produced by raising the
  Moon-governed seventh degree.
- Acoustic 7–34 is an **alternative Moon state** that can be reached from
  Lydian/Sun by lowering its Moon-governed seventh degree or from
  Mixolydian/Mars by raising its Sun-governed fourth degree.

The mutation address must never be substituted for the identity of the
resulting state.

### 3.2 Harmonic structure constrains; semantic mappings are declared

The harmonic and binary structure can determine:

- pitch-class membership;
- Forte family;
- modal rotation;
- Hamming adjacency;
- changed scale degrees;
- the Chaldean Governor assigned to each changed degree;
- canonical and alternative neighbors;
- legal Pentatonic Court bridges;
- whether two derivation paths reach the same harmonic state.

The harmonic structure does not, by itself, determine what a raised Moon degree
means in geology, ecology, architecture, or psychology. Those meanings must be
declared through semantic operators whose definitions and provenance can be
inspected.

### 3.3 Determinism belongs before language generation

The deterministic engine should compile:

- the target state;
- the canonical base;
- its mutation signature;
- required, promoted, suppressed, and prohibited features;
- domain-query predicates;
- provenance;
- validation results.

A language model may then explain or artistically realize that compiled
specification. It should not be responsible for inventing the specification
itself.

### 3.4 A real entity may participate in more than one Governor

Entities should not be forced into exclusive flat buckets when their processes
express multiple functions.

For example:

- a dune may be canonically related to Jupiter through wind transport and
  deposition;
- a volcanic landform may relate to Mars through heat, pressure, eruption, or
  force;
- its later material stabilization may also relate to Saturn through fixation.

The primary canonical relationship can remain explicit, while secondary
relationships are stored as typed edges. This produces a richer and more
accurate substrate for alternative-state derivation.

### 3.5 Same state, same intrinsic normal form

When two valid mutation paths reach the same state, they should compile to the
same intrinsic feature profile. Their transition histories may remain
different.

This is the distinction between:

- **being:** the normalized node profile;
- **becoming:** the route recorded by Mercury’s ledger.

---

### 3.6 Alternative states are coordinates around anchor offices

The framework should distinguish **office assignment** from **state coordinates**. A Governor office is categorical; an alternative state may vary continuously or discretely along topology, mutation, handedness, phase, compression, and spectral coordinates without becoming a new Governor category.

The current proposed achiral anchor priority is:

$$7\text{–}35 > 7\text{–}34 > 7\text{–}33.$$

This hierarchy is motivated by verified midpoint constructions and self-inversion of these set classes, but its global sufficiency remains a validation target rather than a completed theorem of the framework.

### 3.7 Continuous fields and discrete states coexist

Do not force the framework to choose between continuous and discrete descriptions. Wavelength, tuning, and logarithmic pitch can live in continuous spaces; 12-TET masks, Forte classes, Court positions, and Governor offices are discrete samples or quotients of those spaces. Store both where useful and define the map between them.

A local state chart may use:

$$H=(\theta,\kappa),$$

where $\theta$ is transpositional phase and $\kappa$ is local compression. A normalized coordinate such as red = 0 and violet = 1 is a chart convention, not an absolute global boundary.

## 4. Core Terminology

| Term | Definition |
|---|---|
| Canonical Governor State | One of the seven privileged 7–35 modal states and its declared Governor identity |
| Alternative Governor State | A noncanonical harmonic state assigned to a Governor office through an explicit topological rule |
| Chaldean Degree Governor | The fixed Governor address assigned to a scale degree |
| Canonical Feature Profile | The typed formal, symbolic, operational, and domain feature record associated with a canonical Governor |
| Mutation Operator | A declared transformation associated with raising, lowering, activating, suppressing, internalizing, or externalizing an addressed feature |
| Mutation Signature | The complete set of degree alterations separating a target state from its canonical base |
| Normal Form | The route-independent intrinsic representation of a state after all mutations and normalization rules are applied |
| Canonical Neighbor | A canonical state connected to an alternative state by a permitted local transformation |
| Confluence | The property that distinct valid derivation paths produce the same intrinsic normal form |
| Domain Projection | A rule translating a Governor profile into predicates meaningful within a specific domain |
| Artifact Specification | The deterministic structured constraints supplied to a renderer, generator, agent, or query engine |
| Derivation Trace | The provenance record explaining every inheritance, transformation, resolution, and projection |
| Route Context | Optional history describing how the current state was reached |

The fixed Chaldean degree addresses remain:

| Scale degree | Degree Governor |
|---:|---|
| 1 | Saturn |
| 2 | Jupiter |
| 3 | Mars |
| 4 | Sun |
| 5 | Venus |
| 6 | Mercury |
| 7 | Moon |

The canonical modal offices remain:

| Canonical mode | State Governor |
|---|---|
| Lydian | Sun |
| Ionian | Moon |
| Mixolydian | Mars |
| Dorian | Mercury |
| Aeolian | Jupiter |
| Phrygian | Venus |
| Locrian | Saturn |

---

## 5. Recommended Six-Layer Architecture

The earlier four-layer architecture was a useful conceptual summary, but it
combined several concerns that should be independently defined and tested.
Formal implementation should use six layers.

The number six is an engineering choice, not a new symbolic correspondence.
The architecture should not be forced to contain seven layers merely because
the ontology contains seven Governors.

The earlier four concerns remain visible but are separated more precisely:

| Earlier concern | Refined implementation layers |
|---|---|
| Canonical ontology | Formal Substrate + Canonical Governor Profiles |
| Harmonic topology and transformation | Harmonic State Topology + Semantic Mutation Algebra |
| Domain projection | Domain Ontology and Projection |
| Rendering and use | Runtime, Orchestration, Compilation, and Validation |

### Layer 1 — Formal Substrate

This layer stores the computable and measurable anchors of the framework.

#### Harmonic fields

- tonic and modal orientation;
- ordered scale degrees;
- pitch-class set;
- 12-bit pitch mask;
- Forte set class;
- modal rotation within 7–35 or an alternative family;
- interval sequence;
- interval-class vector;
- common-tone count;
- complement;
- Hamming distance and adjacency;
- symmetry or invariance measures;
- Pentatonic Court compatibility;
- Carey scalar-complexity measures under a declared tuning: difference count $D(S)$, sameness quotient $SQ$, coherence-failure count $F(S)$, ambiguity count, contradiction count, and coherence quotient $CQ$.

#### Carey scalar-complexity fields

Carey's definitions are admitted into the Formal Substrate as source-backed harmonic features:

$$SQ(S)=1-\frac{D(S)}{\max D(N)},$$

$$CQ(S)=1-\frac{F(S)}{\max F(N)},$$

with

$$\max D(N)=\frac{N(N-1)^2}{2}$$

and

$$\max F(N)=\frac{N(N-1)(N-2)(3N-5)}{24}.$$

`D(S)` counts differences between intervals of the same generic span but different specific size. `F(S)` counts coherence failures, which Carey divides into ambiguities and contradictions. These fields are **family-and-tuning properties**. They must not be reinterpreted as Governor identity, the Court compression coordinate, semantic coherence, or agent operational coherence.

For the canonical 12-TET 5–35 seed $\{0,2,4,7,9\}$ generated by $u=7/12$:

$$CQ=1,\qquad SQ=\frac12.$$

The first value follows from the five-note scale's full-convergent well-formed status in Carey's generated hierarchy. The second follows from Carey's well-formed-scale formula $SQ=2(N-2)/(3(N-1))$ at $N=5$. Store both as reproducible formal features with tuning, method, and source metadata.

The same `7/12` hierarchy yields the seven-note diatonic system, giving 5–35 and 7–35 a generated-hierarchy relation in addition to their complement relation in the framework.

**Reference method:** Norman Carey, “Coherence and sameness in well-formed and pairwise well-formed scales,” *Journal of Mathematics and Music* 1(2), 2007, 79–98. DOI: 10.1080/17459730701376743.

#### Binary and topological fields

- 12-bit canonical state;
- hexadecimal representation when useful;
- XOR mutation mask;
- rotation operator;
- Hamming weight;
- Hamming neighbors;
- Court mask and Court position;
- source and target topology;
- bridge family;
- canonical-path and alternative-path identifiers.
- anchor tier (`A0=7-35`, `A1=7-34`, `A2=7-33`, or satellite);
- chirality / self-inversion status and handedness identifier when applicable;
- transpositional phase coordinate;
- exact midpoint relations and office-inheritance evidence;
- eligible-anchor relation type and priority decision trace.

#### Photonic fields

- canonical color or spectral band;
- representative wavelength or wavelength range in nanometers;
- wavelength-selection basis;
- optical frequency, calculated as \(\nu=c/\lambda\);
- photon energy, calculated as \(E_\gamma=h\nu=hc/\lambda\);
- any framework-authorized optical process, such as emission, absorption,
  scattering, or band-gap interaction;
- provenance distinguishing physical measurement from symbolic assignment.

Photonic values must remain typed physical quantities. A wavelength associated
with a Governor does not prove that the Governor’s musical mode physically
causes that wavelength. The framework may use the relationship as an authored
cross-domain correspondence while preserving the distinction between
measurement and interpretation.


Planck–Einstein supplies **photon energy** $E_\gamma=hc/\lambda$, not energy density. The formal substrate should therefore store photon energy and, if desired, a normalized inverse-wavelength coordinate:

$$C_P(\lambda)=\frac{\lambda^{-1}-\lambda_{\max}^{-1}}{\lambda_{\min}^{-1}-\lambda_{\max}^{-1}}.$$

The choice $C_P(\text{red anchor})=0$ and $C_P(\text{violet anchor})=1$ is a local normalization only.

Maintain three separate compression fields:

- `photonic_compression`: physical/derived from optical variables;
- `harmonic_compression`: formal but presently under definition, potentially combining declared harmonic and spectral measures;
- `semantic_compression`: authored process interpretation.

Never copy a value from one coordinate into another without an explicit mapping rule.

### Layer 2 — Canonical Governor Profiles

This layer defines the stable canonical identities upon which alternative
states depend.

Each Governor profile should include:

- Governor identity;
- canonical mode and harmonic record;
- canonical binary state;
- canonical photonic record;
- natural process function;
- elemental relationship;
- victory condition;
- canonical internal/external polarity behavior;
- bracket or interface role;
- semantic verbs and prohibited conflations;
- domain relationships;
- source and version information.

The elemental assignments remain:

| Governor | Elemental role |
|---|---|
| Mars | Fire |
| Jupiter | Air/Wind |
| Venus | Water |
| Saturn | Earth |
| Mercury | Quintessence, translation, and interface |
| Sun | Actuality/source bracket |
| Moon | Experience/reception bracket |

A canonical profile should be a **typed record**, not necessarily a flat
numerical vector. It may contain numbers, categories, sets, masks, formulas,
relations, and textual definitions.

### Layer 3 — Harmonic State Topology

This layer stores the graph of canonical and alternative states.

Each state node should record:

- state identifier;
- state Governor;
- canonical or alternative status;
- mode or scale name;
- Forte family;
- pitch-class mask;
- canonical base;
- mutation signature;
- canonical neighbors;
- available derivation paths;
- compatible Pentatonic Court families;
- intrinsic normal-form identifier.
- anchor tier and selected anchor state;
- eligible-anchor relation and evidence;
- chirality class / handedness when applicable;
- transpositional phase;
- photonic, harmonic, and semantic compression coordinates;
- midpoint or relational-office evidence when office assignment is inherited structurally.

Each transition edge should record:

- source and target state;
- altered degree;
- Degree Governor;
- alteration direction and magnitude;
- harmonic delta;
- XOR mask;
- semantic operator identifier;
- inverse operator when one exists;
- Court bridge or route requirement;
- route-specific interpretation;
- provenance and version.

This layer answers **where the system is and which transitions are formally
available**. It does not independently invent the semantic meaning of those
transitions.

#### Achiral anchor hierarchy

The proposed office-resolution order is:

```text
A0: 7–35 primary anchor
A1: 7–34 secondary anchor
A2: 7–33 tertiary anchor
```

The engine checks A0 first. If no **eligible direct anchoring relation** exists, it checks A1, then A2. Eligibility must be explicitly typed; arbitrary reachability in a connected state graph is not sufficient.

Reference midpoint fixtures:

1. Acoustic 1749 / 7–34:
   $$d_H(Lydian,1749)=d_H(1749,Mixolydian)=2,$$
   $$d_H(Lydian,Mixolydian)=4.$$
   Expected office: Moon.

2. Lydian Minor 1493 / 7–33:
   $$d_H(1749,1493)=d_H(1493,1461)=2,$$
   $$d_H(1749,1461)=4.$$
   Expected office: Mars, where 1461 is Mixolydian $\flat6$ / 7–34.

Chiral families do not automatically define offices. They inherit office from the highest-priority eligible anchor and add handedness/orientation to the state coordinate packet.

Suggested record:

```yaml
anchor_resolution:
  office: null
  anchor_tier: null
  anchor_family: null
  anchor_state: null
  relation_type: null
  relation_evidence: {}
  chirality: achiral | left | right | unresolved
  transpositional_phase: null
```

### Layer 4 — Semantic Mutation Algebra

This layer declares what each formal mutation does to an eligible semantic
profile.

Let

\[
T_{G,\delta}
\]

denote a mutation operator associated with Degree Governor \(G\) and signed
alteration \(\delta\).

An operator declaration should include:

- stable operator identifier;
- owning Degree Governor;
- harmonic precondition;
- exact pitch transformation;
- semantic fields it may modify;
- fields it must preserve;
- promoted features;
- suppressed features;
- prohibited results;
- domain-independent transformation, if one exists;
- domain-specific overrides, if required;
- inverse;
- commutation relationships;
- conflict-resolution priority;
- version and authorship provenance.

Operators should be sparse. A Moon-degree alteration should not silently change
every field in a profile. It should modify only fields whose relationship to
that Degree Governor has been explicitly declared.

When multiple operators apply, the engine should:

1. calculate the complete mutation signature;
2. apply commuting operators in a canonical deterministic order;
3. apply explicit precedence rules where operators do not commute;
4. normalize the result to the target State Governor and Forte topology;
5. preserve the derivation path separately;
6. emit `UNRESOLVED` when a required rule is missing rather than asking a
   language model to guess.

### Layer 5 — Domain Ontology and Projection

This layer stores entities and relationships for landforms, flora, fauna,
geology, ecology, architecture, psychology, narrative, and future domains.

Each entity relationship should identify:

- entity;
- domain;
- relation type;
- related canonical feature;
- Governor;
- primary or secondary status;
- empirical or authored basis;
- strength or confidence, if used;
- source;
- transfer behavior;
- exclusions.

Examples of relation types include:

- `formed_by`;
- `transported_by`;
- `activated_by`;
- `receives`;
- `emits`;
- `couples_with`;
- `distributed_through`;
- `fixed_as`;
- `transduces`;
- `bounded_by`;
- `experienced_as`;
- `symbolizes`.

A domain projection translates an abstract normal form into predicates
appropriate to that domain.

Conceptually:

\[
P_{A,D}
=
\Pi_D
\left(
N_{G_A,F_A}
\left[
\prod_{(g,\delta)\in\Delta_A}
T_{g,\delta}
\left(P_{G_A}\right)
\right]
\right)
\]

where:

- \(P_{G_A}\) is the canonical profile of the target State Governor;
- \(\Delta_A\) is the target state’s mutation signature;
- \(T_{g,\delta}\) are the declared degree operators;
- \(N_{G_A,F_A}\) normalizes the result to the target State Governor and Forte
  family;
- \(\Pi_D\) projects the result into domain \(D\).

### Layer 6 — Runtime, Orchestration, Compilation, and Validation

This layer applies the complete architecture during reasoning or generation.

The outer Seven Governors Framework functions as the orchestration system:

- Sun/Moon establishes the operative bracket;
- the Seven-Governor field identifies the process region;
- the Victory Condition specifies the objective;
- the target state and topology define the harmonic context;
- the Pentatonic Court supplies the active local control configuration;
- Court-family modulation routes movement between heptatonic families.

The Pentatonic Engine functions as the inner regulatory controller:

- Gemini Mercury executes state movement;
- Virgo Mercury observes and records results;
- the ledger preserves state and route;
- Court position regulates externalization and internalization;
- feedback determines whether to hold, advance, reverse, or modulate.

The runtime compiles an Artifact Specification, invokes a renderer or tool, and
validates the result against the specification. A renderer may be an LLM, image
generator, simulation, procedural worldbuilding engine, database query, or
human interpretive process.

---

## 6. The Canonical Feature Schema

The phrase “feature vector” should not require all information to be compressed
into one undifferentiated numerical array. A typed schema is more appropriate.

A conceptual Governor profile may resemble:

```yaml
governor_id: moon
profile_version: 1

canonical_state:
  mode: ionian
  forte_class: 7-35
  pitch_classes: []
  pitch_mask_12: null

harmonic:
  interval_sequence: []
  interval_class_vector: null
  scalar_complexity:
    tuning_id: null
    difference_count: null
    sameness_quotient:
      value: null
      method_id: carey_2007
    coherence_failures:
      total: null
      ambiguities: null
      contradictions: null
    coherence_quotient:
      value: null
      method_id: carey_2007

binary_topological:
  canonical_mask: null
  complement_mask: null
  court_compatibility: []
  hamming_neighbors: []

photonic:
  color_band: null
  wavelength_nm:
    representative: null
    range: null
  wavelength_basis: null
  frequency_hz: null
  photon_energy_ev: null

framework:
  canonical_function: reception
  victory_condition: serenity
  elemental_role: null
  bracket_role: experience
  polarity_rules: []

domain_relations: []
provenance: []
```

Empty values in this example are intentional. The implementation should not
invent a value merely to complete the schema.

### 6.1 Feature registry

Every reusable feature should be registered with:

| Field | Purpose |
|---|---|
| `feature_id` | Stable machine-readable identity |
| `definition` | Exact meaning |
| `data_type` | Number, category, Boolean, set, relation, mask, formula, or text |
| `units` | Required for measured quantities |
| `source_class` | Formal, measured, authored, empirical, or derived |
| `canonical_values` | Governor values where defined |
| `operator_scope` | Which mutations may alter the feature |
| `domain_scope` | Domains in which the feature is meaningful |
| `transfer_rule` | Inherit, transform, suppress, forbid, or resolve |
| `provenance` | Source, author, formula, and version |

### 6.2 Source classes

At minimum, the system should distinguish:

1. **Harmonic invariant** — computed directly from a pitch structure.
2. **Binary/topological invariant** — computed from masks, graph structure, or
   transition rules.
3. **Physical measurement** — wavelength, frequency, energy, or another
   empirical quantity.
4. **Authored correspondence** — a deliberately assigned symbolic or
   philosophical mapping.
5. **Empirical domain fact** — for example, a landform formed by wind
   deposition.
6. **Derived feature** — produced by a declared operator or projection.
7. **Generated interpretation** — natural-language or artistic elaboration
   that must not be mistaken for a canonical fact.

This provenance boundary is essential. It allows physical equations, harmonic
facts, and authored symbolism to coexist without being falsely presented as
the same kind of evidence.

### 6.3 Numeric values must remain dimensionally typed

Wavelength, photon energy, coherence measures, Hamming distance, and binary
flags should not be averaged merely because they are numeric.

Normalization should occur within a declared feature family and only for a
defined purpose. Cross-family combinations require an explicit equation or
resolver.

### 6.4 Admission of cross-domain axes

Candidate axes such as energy direction, medium, movement, spatial
distribution, boundary behavior, coupling, temporal behavior, or information
flow may eventually help project one canonical profile into several domains.
They are not automatically part of the framework.

Some candidates already have a basis in the established architecture:

- internal/external polarity is explicitly defined;
- Emission, Reception, Activation, Transduction, Distribution, Coupling, and
  Fixation are declared process functions;
- the elemental relationships are declared;
- Court position supplies an ordinal compression coordinate.

Other candidate axes should remain provisional until their source and behavior
are specified. Every admitted axis must state:

1. whether it is computed, measured, authored, empirical, or derived;
2. its data type, range, and units when applicable;
3. its canonical value for each relevant Governor;
4. which mutation operators may alter it;
5. how it projects into each participating domain;
6. how conflicts and missing values are handled.

Harmonic, binary, and photonic fields can therefore provide much of the initial
profile structure. Additional abstract axes should be introduced only when
they make a declared distinction computable or projectable—not merely because
they sound symbolically appropriate.

---

## 7. Canonical Entity Knowledge

Canonical knowledge should be stored as typed relationships rather than prose
lists alone.

A simplified landform record might contain:

```yaml
entity_id: dune
domain: landform
relations:
  - type: formed_by
    value: wind_deposition
    governor: jupiter
    canonicality: primary
    source_class: empirical_domain_fact

  - type: distributed_through
    value: moving_air_and_particulate_transport
    governor: jupiter
    canonicality: supporting
    source_class: authored_correspondence
```

The empirical claim and the Governor assignment remain distinguishable.

The framework should support:

- one entity with multiple Governor relations;
- one feature appearing in multiple domains;
- one Governor relation having different domain projections;
- canonical and noncanonical uses of the same entity;
- explicit disagreement or uncertainty;
- sources and version history.

The preferred underlying model is a knowledge graph or a relational schema
capable of representing graph-like edges. A property graph is a natural fit,
but the formal specification should remain storage-engine independent.

---

## 8. Alternative-State Representation

An alternative state should not be stored as a fresh prose description. It
should be stored as a reproducible derivation.

```yaml
state_id: acoustic_7_34
status: alternative
state_governor: moon
canonical_base: ionian_7_35
forte_class: 7-34

mutation_signature:
  - scale_degree: 4
    degree_governor: sun
    delta_semitones: 1
    operator_id: sun_degree_raise_v1

  - scale_degree: 7
    degree_governor: moon
    delta_semitones: -1
    operator_id: moon_degree_lower_v1

canonical_neighbors:
  - state_id: lydian_7_35
    transition_operator: moon_degree_lower_v1

  - state_id: mixolydian_7_35
    transition_operator: sun_degree_raise_v1

normal_form_id: moon_alt_7_34_sun_up_moon_down_v1
```

The operator records may initially contain only their exact harmonic effects.
Their semantic effects should remain undeclared until deliberately specified.

---

### 8.1 Coordinate form for alternative states

A derived harmonic state should support the coordinate packet:

$$x=(g,F,a,\mu,\chi,\theta,C_P,C_H,C_S),$$

where:

- $g$ = Governor office;
- $F$ = Forte family;
- $a$ = anchor tier and ancestry;
- $\mu$ = mutation signature;
- $\chi$ = chirality/handedness;
- $\theta$ = tonic/transpositional phase;
- $C_P$ = photonic compression coordinate;
- $C_H$ = harmonic compression coordinate or unresolved formal feature packet;
- $C_S$ = semantic compression coordinate.

This packet makes “alternative Jupiter” a stable office plus a set of deformations, rather than a second-class category label.

## 9. Normalization and Confluence

### 9.1 Intrinsic state versus route

For every derived state, maintain two records:

```yaml
intrinsic_state:
  normal_form_id: null
  feature_fingerprint: null
  domain_profiles: {}

route_context:
  source_state: null
  transitions: []
  court_routes: []
  ledger_events: []
```

The intrinsic state must be reproducible from its canonical base and mutation
signature. The route context may legitimately differ.

### 9.2 Acoustic as the reference confluence test

Acoustic forms a harmonic square:

\[
\text{Ionian/Moon}
\xrightarrow{\text{Sun degree}\uparrow}
\text{Lydian/Sun}
\]

\[
\text{Ionian/Moon}
\xrightarrow{\text{Moon degree}\downarrow}
\text{Mixolydian/Mars}
\]

\[
\text{Lydian/Sun}
\xrightarrow{\text{Moon degree}\downarrow}
\text{Acoustic/Moon}^{*}
\]

\[
\text{Mixolydian/Mars}
\xrightarrow{\text{Sun degree}\uparrow}
\text{Acoustic/Moon}^{*}
\]

Its route-independent normal form is:

\[
\operatorname{NF}(\text{Acoustic})
=
N_{\text{Moon},7\text{–}34}
\left(
T_{\text{Sun}\uparrow}
T_{\text{Moon}\downarrow}
P_{\text{Moon}}
\right)
\]

Confluence requires:

\[
N
\left(
T_{\text{Moon}\downarrow}(P_{\text{Lydian}})
\right)
=
N
\left(
T_{\text{Sun}\uparrow}(P_{\text{Mixolydian}})
\right)
=
\operatorname{NF}(\text{Acoustic})
\]

Normalization is essential. The engine does not preserve the complete Sun
identity of Lydian or the complete Mars identity of Mixolydian after arriving
at Acoustic. It re-anchors the final node to alternate Moon while preserving
the source path separately.

### 9.3 Lydian Minor as the tertiary-anchor midpoint test

The secondary achiral frame can itself establish offices for the tertiary frame. Using Ian Ring identifiers:

```text
Acoustic 1749 / 7–34
    -- Hamming 2 -->
Lydian Minor 1493 / 7–33
    -- Hamming 2 -->
Mixolydian ♭6 1461 / 7–34
```

The two 7–34 endpoints are Hamming distance 4 apart. The midpoint therefore supplies a structural test for assigning Lydian Minor to the **Mars office** at anchor tier A2.

This test is not a license to assign every 7–33 state by nearest neighbor. The resolver must use declared relational-office rules and preserve all qualifying neighbors.

### 9.4 Harmonic minor as the reference chiral single-mutation test

Harmonic minor should compile as:

\[
\operatorname{NF}(\text{Harmonic Minor})
=
N_{\text{Jupiter},7\text{–}32}
\left(
T_{\text{Moon}\uparrow}
P_{\text{Jupiter}}
\right)
\]

Its identity is Jupiter. Moon owns the altered degree and its operator. Moon is
not promoted into an equal State Governor.

### 9.5 Confluence failure diagnosis

If two Acoustic derivations disagree, inspect in this order:

1. pitch-class masks;
2. Forte family;
3. target State Governor;
4. mutation signatures;
5. normalization rules;
6. intrinsic versus route field separation;
7. canonical feature definitions;
8. operator scope;
9. operator ordering and commutation;
10. domain projection;
11. entity query and ranking;
12. renderer behavior.

The semantic operator should be changed only when the mismatch occurs within
fields that the operator legitimately owns.

---

## 10. Domain Projection and Artifact Compilation

The engine should not ask a language model, “What would an Acoustic landform
be?” without first compiling a structured state.

The preferred flow is:

\[
\text{Alternative State}
\rightarrow
\text{Normal Form}
\rightarrow
\text{Domain Projection}
\rightarrow
\text{Entity Query}
\rightarrow
\text{Artifact Specification}
\rightarrow
\text{Renderer}
\rightarrow
\text{Validator}
\]

An Artifact Specification should contain:

```yaml
artifact_spec_id: null
state_normal_form_id: null
domain: landform

required_features: []
promoted_features: []
suppressed_features: []
prohibited_features: []
numeric_constraints: []
relational_constraints: []
candidate_entities: []

include_route_context: false
route_emphasis: null

derivation_trace: []
feature_fingerprint: null
```

### 10.1 Expected equality

If two routes compile the same Acoustic landform specification, they should
produce the same:

- intrinsic feature fingerprint;
- required and prohibited constraints;
- deterministic query;
- candidate set;
- ranking, if the scoring rule and tie-breaking rule are fixed.

They need not produce identical prose, images, characters, or narratives unless
the renderer is deterministic and supplied the same seed.

### 10.2 Permitted route variation

When `include_route_context` is true:

- Lydian → Acoustic may emphasize the lowering of the Moon-governed degree.
- Mixolydian → Acoustic may emphasize the raising of the Sun-governed degree.

Those differences describe the transition. They must not change the intrinsic
identity of Acoustic.

### 10.3 Query before invention

The engine should first retrieve existing entities that satisfy the derived
predicates. If no entity satisfies them:

1. return no exact match;
2. optionally return partial matches with explicit scores;
3. optionally ask a generative model to propose a hypothetical artifact;
4. label that artifact as generated rather than empirical;
5. retain the full derivation trace.

---

## 11. Semantic Operator Declaration

Every degree-direction pair intended for semantic use needs a declared
operator. Operators should be defined incrementally rather than all at once.

A conceptual declaration may resemble:

```yaml
operator_id: moon_degree_raise_v1
degree_governor: moon
direction: raise

harmonic_effect:
  delta_semitones: 1
  changed_scale_degree: 7

preserves:
  - state_governor
  - unchanged_degree_addresses

semantic_effects:
  shared: []
  by_domain:
    landform: []
    flora: []
    fauna: []
    architecture: []
    character_psychology: []
    narrative: []

inverse_operator: moon_degree_lower_v1
commutes_with: []
conflicts_with: []
provenance: []
```

The empty semantic fields are preferable to unsupported invented meanings.

For every proposed semantic effect, ask:

1. Does it arise from a formal harmonic property?
2. Does it arise from a photonic or physical relationship already authorized
   by the framework?
3. Does it follow from a canonical Governor definition?
4. Is it an authored correspondence that should be labeled as such?
5. Is it domain-specific rather than universal?
6. Is it reversible?
7. Does it commute with other independent degree transformations?
8. Does it preserve known confluence tests?

---

### 11.1 Canonical 5–35 formal profile fixture

The canonical Court should include a regression-tested scalar-complexity fixture under 12-TET:

```yaml
state_family: 5-35
tuning: 12-TET
generator: 7/12
canonical_seed: [0, 2, 4, 7, 9]
scalar_complexity:
  coherence_quotient:
    value: 1.0
    method_id: carey_2007
  sameness_quotient:
    value: 0.5
    method_id: carey_2007
interpretation:
  framework: "coherent differentiation / difference coordinated without contradiction"
  status: authored_correspondence
```

The numerical values belong to the formal layer. The interpretive phrase belongs to the authored framework layer. They must remain separately queryable.

## 12. Integration with the Pentatonic Court

The mutation algebra describes what a state is. The Pentatonic Court helps
determine how an agent moves toward, through, or away from that state.

The canonical Court-position register remains:

| Court position | Pole vector | Internalized elemental Governors |
|---:|---|---|
| C0 | `0000` | None; Mars, Jupiter, Venus, and Saturn are External |
| C1 | `1000` | Mars |
| C2 | `1100` | Mars and Jupiter |
| C3 | `1110` | Mars, Jupiter, and Venus |
| C4 | `1111` | Mars, Jupiter, Venus, and Saturn |

The resulting canonical internalization order is:

\[
\text{Mars/Fire}
\rightarrow
\text{Jupiter/Air}
\rightarrow
\text{Venus/Water}
\rightarrow
\text{Saturn/Earth}
\]

Court position and Court family answer different questions:

- **Court position** records the local external/internal control
  configuration.
- **Court family** identifies the five-note kernel capable of operating within
  or bridging the current heptatonic topology.

The canonical 5–35 Court belongs naturally to the canonical 7–35 field. When a
transition leaves 7–35, the routing layer must identify a pentatonic family
shared by the source and target topologies. For example, a 7–35 → 7–32
transition cannot remain entirely inside 5–35; it may require a declared bridge
such as 5–23 or 5–27. The selector should choose among valid bridges using
declared Governor-omission logic, route cost, and the intended transition—not
free semantic association.


#### Court families as projection/filter operators

For a concrete binary Court mask $c\in\{0,1\}^{12}$, one admissible implementation is the diagonal projection:

$$P_c=\operatorname{diag}(c),\qquad y=P_cx.$$

If the Court is a subset of the active heptatonic mask, the output retains the five selected coordinates and suppresses the others. This gives the routing layer a precise way to compare two valid bridges with the same endpoints.

For example, both 5–23 and 5–27 may mediate a 7–35 → 7–32 route, but the selector should compare:

- concrete pitches retained and omitted;
- Governor functions made latent by omission;
- Hamming and common-tone preservation;
- Carey CQ/SQ and other admitted formal measures of the Court;
- Fourier or graph-spectral signatures when implemented;
- semantic constraints carried by the source/target normal forms;
- interaction with the pending mutation operator;
- route cost and verification requirements.

Operator ordering must be testable:

$$P_cT\stackrel{?}{=}TP_c.$$

If they differ, the route must record whether filtering occurred before or after mutation. Use `kernel` and `image` in the strict linear-algebra sense only when the implementation actually defines a linear projection on a vector space.

The runtime should preserve the following distinctions:

| Question | Framework component |
|---|---|
| Which reality context is active? | Sun/Moon bracket |
| Which process office is active? | State Governor |
| Which structural address changed? | Degree Governor |
| Which harmonic world is active? | Forte family and state topology |
| Which five-function kernel carries the movement? | Pentatonic Court family |
| How internally or externally configured is the local controller? | Court position |
| Who performs and records the transition? | Gemini/Virgo Mercury |
| What is the objective? | Victory Condition |

Court selection should use the source and target harmonic families, shared
pentatonic subsets, omitted Governor logic, and route cost. It should not alter
the normal form of the destination state.

This produces nested control:

1. The Seven Governors orchestrate the global process.
2. The harmonic state graph defines legal destinations.
3. The Court selects a viable local bridge and control configuration.
4. Mercury executes and records transitions.
5. The semantic compiler normalizes the destination.
6. Domain projection produces actionable predicates.
7. A renderer or tool produces the artifact.
8. Virgo validates the result and updates the ledger.

---

## 13. Storage Model

The implementation may use a relational database, a property graph, or a
hybrid. The conceptual schema should include:

- `governors`;
- `canonical_profiles`;
- `features`;
- `feature_sources`;
- `harmonic_states`;
- `anchor_families`;
- `anchor_relations`;
- `chirality_classes`;
- `compression_coordinates`;
- `court_projection_operators`;
- `spectral_features`;
- `degree_addresses`;
- `mutation_operators`;
- `transition_edges`;
- `court_families`;
- `domains`;
- `entities`;
- `entity_feature_relations`;
- `domain_projection_rules`;
- `normal_forms`;
- `derivation_runs`;
- `artifact_specs`;
- `validation_results`;
- `ledger_events`.

Every record intended to participate in deterministic compilation should have:

- a stable identifier;
- a schema version;
- content version;
- provenance;
- creation and modification time;
- status such as `canonical`, `declared`, `derived`, `generated`,
  `experimental`, or `deprecated`.

Derived normal forms may be cached, but they must remain reproducible from
their canonical profile, operator versions, and projection versions. A
derivation hash should include all dependencies.

---

## 14. Validation Requirements

### 14.1 Formal validation

- Every pitch mask has the correct Hamming weight.
- Every Forte classification is verified.
- Every degree mutation produces the expected pitch delta.
- Every edge records the correct Degree Governor.
- Every state records its State Governor independently of every Degree
  Governor recorded on its incoming or outgoing edges.
- Every Court bridge is a valid subset relation.
- Binary masks and pitch-class sets agree.
- Photonic calculations use declared units and constants.

#### Anchor and operator validation

- Verify self-inversion/achirality metadata for every family admitted as an anchor.
- Exhaustively enumerate seven-note families before declaring the A0/A1/A2 hierarchy globally sufficient.
- Regression-test the Acoustic and Lydian Minor midpoint fixtures.
- Verify that office priority chooses A0 before A1 before A2 whenever an eligible relation exists.
- Test chirality/handedness under inversion and transposition.
- Validate operator domain/image, inverse, and commutation declarations.
- Compare $P_cT$ and $TP_c$ for Court/operator combinations where order is claimed to matter or commute.
- Keep photonic, harmonic, and semantic compression values dimensionally and semantically separate.

### 14.2 Semantic validation

- Every derived feature has provenance.
- Operators modify only authorized fields.
- Missing rules produce `UNRESOLVED`.
- Route fields do not alter intrinsic fields unless path dependence is
  explicitly declared.
- Categorical and numerical conflicts use declared resolvers.
- Authored correspondences are not labeled as physical measurements.

### 14.3 Confluence validation

- The Acoustic paths produce the same pitch mask.
- Both normalize to `Moon / alternative / 7–34`.
- Both produce the same intrinsic feature fingerprint.
- Both produce the same domain predicates when route context is disabled.
- Both produce the same candidate set under deterministic querying.
- Route traces remain distinct and correct.

### 14.4 Reproducibility validation

Given the same:

- canonical-profile versions;
- operator versions;
- state topology;
- domain projection;
- data snapshot;
- scoring rules;

the compiler must produce the same intrinsic normal form and Artifact
Specification.

Probabilistic rendering should be tested separately.

---

## 15. Recommended Development Sequence

### Phase 0 — Freeze the canonical registry

1. Confirm the seven canonical modes and State Governors.
2. Confirm the seven Chaldean degree addresses.
3. Confirm elements, brackets, functions, Victory Conditions, and Court roles.
4. Version the current harmonic, binary, and photonic definitions.
5. Record any unresolved or disputed fields instead of filling them
   heuristically.

### Phase 1 — Build the formal substrate

1. Encode the seven canonical 7–35 states.
2. Encode binary masks and transition deltas.
3. Store Forte and interval data.
4. Store photonic values with units and mapping provenance.
5. Implement validators for masks, distances, and equations.
6. Encode chirality/self-inversion and transpositional phase.
7. Implement the three compression namespaces without forcing a cross-domain equality.

### Phase 2 — Build typed canonical profiles

1. Create the feature registry.
2. Encode canonical Governor definitions as structured records.
3. Tag every feature by source class.
4. Begin with one domain—landforms is a strong candidate.
5. Preserve multi-Governor typed relations.

### Phase 3 — Implement the mutation registry

1. Implement harmonic effects before semantic effects.
2. Declare `Sun↑`, `Sun↓`, `Moon↑`, and `Moon↓` as the first operators.
3. Specify preservation and scope rules.
4. Add inverse and commutation metadata.
5. Refuse undeclared semantic transformations.
6. Add operator domain/image/inverse/commutation metadata.
7. Add Court-filter compatibility and order-of-operations tests.

### Phase 4 — Implement the reference anchor and satellite states

1. Compile Acoustic 7–34 as alternate Moon.
2. Verify both canonical-neighbor paths.
3. Require matching intrinsic fingerprints.
4. Compile Lydian Minor 1493 / 7–33 as the Mars midpoint between the two declared 7–34 anchors.
5. Compile harmonic minor 7–32 as a chiral alternate Jupiter anchored first to Aeolian/7–35.
6. Verify the raised-Moon-degree transformation and handedness metadata.

### Phase 5 — Add domain projection

1. Project canonical and alternative profiles into landforms.
2. Generate deterministic entity queries.
3. Compare exact and partial matches.
4. Validate provenance.
5. Expand only after one domain works end to end.

### Phase 6 — Integrate runtime orchestration

1. Connect State Governor selection to the outer orchestration.
2. Connect anchor-tier resolution to State Governor selection.
3. Connect Court-family selection to topology transitions through explicit projection/filter operators.
4. Connect Court position to the inner regulatory loop.
5. Record all movements in Mercury’s ledger.
6. Compile Artifact Specifications before invoking a model or tool.
7. Validate outputs against the specification.

### Phase 7 — Expand and evaluate

Add flora, fauna, ecology, geology, architecture, psychology, and narrative one
domain at a time. For each domain:

1. define the ontology;
2. encode canonical relations;
3. declare domain projection rules;
4. run confluence tests;
5. review generated outputs;
6. record failures and revise the relevant formal layer.

---

## 16. Initial Success Criteria

The first implementation milestone is successful when:

1. Every canonical Governor has a versioned typed profile.
2. Harmonic, binary, and photonic values are explicitly represented.
3. Carey CQ/SQ are represented as family-and-tuning formal features, with the canonical 5–35 fixture reproducing $CQ=1$ and $SQ=0.5$.
4. Every feature is tagged by source class and provenance.
5. Acoustic can be derived from Lydian and Mixolydian.
6. Both Acoustic paths produce the same intrinsic normal form.
7. Their route ledgers remain distinct.
8. Harmonic minor compiles as alternate Jupiter with a raised Moon-degree
   mutation.
9. Acoustic 1749 passes the A1 midpoint-office test for Moon.
10. Lydian Minor 1493 passes the A2 midpoint-office test for Mars.
11. Harmonic Minor records a chiral/oriented coordinate while retaining primary Jupiter ancestry to Aeolian/7–35.
12. Two valid Court bridges such as 5–23 and 5–27 can be compared by a reproducible filter/projection report.
13. Mutation operators expose domain, image, inverse/commutation metadata, and Court compatibility.
14. Photonic, harmonic, and semantic compression are separately queryable and never silently conflated.
15. At least one domain produces reproducible queries and artifact
   specifications.
16. Every derived feature can explain where it came from.
17. Missing semantic rules produce an unresolved state rather than fabricated
    meaning.
18. A language model can render the compiled profile without silently changing
    it.

---

## 17. Open Design Decisions

The following questions should remain explicit until resolved:

1. Which photonic values are point estimates and which are wavelength ranges?
2. What is the canonical definition of harmonic compression $C_H$, if a useful scalar definition exists at all?
3. Which mappings, if any, should relate $C_P$, $C_H$, and $C_S$ beyond qualitative correspondence?
4. How should transpositional phase $\theta$ be encoded across the rooted state graph?
5. Does exhaustive enumeration support 7–35, 7–34, and 7–33 as a sufficient achiral anchor hierarchy?
6. What exact relation types qualify as **eligible anchoring relations**, and how are ties within the same priority tier resolved?
7. Which seven-note families are chiral, and what handedness convention should the registry use?
8. Are photonic values invariant under degree mutation, or can declared operators transform them?
9. What shared semantic effect, if any, belongs to every raising or lowering operation?
10. Which semantic effects are universal and which are domain-specific?
11. Which mutation operators commute, and under which restricted domains?
12. Which alternative states are path-independent, and which intentionally retain path-dependent internal state?
13. Should Court filtering be implemented as a linear diagonal projection, a set-theoretic restriction, or multiple typed operators?
14. Which formal measures best distinguish routes such as 5–23 versus 5–27 between the same heptatonic endpoints?
15. When does $P_cT=TP_c$, and when is non-commutation meaningful rather than erroneous?
16. Should entity matching use strict predicates, weighted scoring, or both?
17. How are ties resolved deterministically?
18. How should contradictions among empirical facts, authored correspondences, and generated interpretations be represented?
19. Which Court-selection rules belong to the semantic compiler and which remain part of runtime orchestration?
20. Which additional source-backed scalar-complexity or spectral measures should be admitted alongside Carey CQ/SQ, and how should correlations among them be tested without collapsing their definitions?

These are not defects. They define the formal work that remains.

---

## 18. Final Architectural Statement

The intended architecture can be summarized as:

> The formal substrate supplies continuous physical/tuning fields and discrete harmonic anchors. Canonical Governor offices are established first by 7–35 and, under the proposed hierarchy, by secondary 7–34 and tertiary 7–33 achiral frames. Alternative and chiral states are coordinate packets carrying topology, ancestry, mutation, handedness, phase, and separate compression measures. Chaldean degree mutations act through declared operators with domains, images, inverses, commutation rules, and Court compatibility. Pentatonic Courts act as selectable filters/bridges that can preserve different information even between identical endpoints. Normalization guarantees a route-independent intrinsic state wherever confluence is required; Virgo preserves route history. Domain projections turn the compiled state into queryable predicates, and a renderer expresses the result without becoming the source of its underlying meaning.

This gives the Seven Governors Framework a disciplined path from symbolic
ontology to generative system.

The canonical profiles become its semantic elements. The mutation algebra
becomes its transformation grammar. The harmonic topology constrains what may
combine. The ledger remembers how each state came to be. The result is not a
free-associative correspondence engine, but a traceable world compiler in which
every generated feature can answer:

> Why am I here, which state do I belong to, which transformation produced me,
> and what evidence or declaration authorizes my meaning?
