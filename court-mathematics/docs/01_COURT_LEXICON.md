---
title: Court Mathematics Lexicon
---

# Court Mathematics Lexicon

## 1. Scope and authority

This document is the normative vocabulary contract inside the candidate
`court-mathematics` package. It defines what each formal term means, why the
term exists, how it is represented mathematically, and whether Phase 1 has an
executable runtime type for it. It is not yet an integrated-release authority
or admission record.

A definition in this lexicon does not by itself admit a concept into the
integrated release. Mathematical derivation, validation evidence, semantic
admission, runtime policy admission, and release admission are independent
axes. The status attached to each entry must therefore travel with the term.

The controlling authority order is:

```text
framework intent and release decisions
  -> canonical topology, mutation audit, and profile registry
  -> reviewed court-mathematics release, after admission
  -> runtime policy and ledger, after policy admission
  -> Neo4j read projection
```

No `court-mathematics` type may assign a Governor office, rewrite topology,
admit a semantic effect, or treat a graph projection as source authority.

## 2. Status vocabulary

| Status | Meaning |
|---|---|
| `admitted` | Accepted by the current integrated-release authority for its declared scope. |
| `candidate` | Named measure or concept retained for evaluation but not admitted for policy use. |
| `derived` | Deterministically computed from admitted inputs, without implying a separate release-admission act. |
| `provisional` | Precisely represented but awaiting method, policy, evidence, or release admission. |
| `proposed` | Framework vocabulary that is intentionally non-executable in Phase 1. |
| `unresolved` | No canonical value or totalizing formula exists; the value must remain `null`. |

## 3. Representation conventions

| Convention | Canonical rule |
|---|---|
| Pitch field | `Z_12`, represented by integers `0..11` |
| Pitch mask | Integer `0..4095`; bit `i` means pitch class `i` is present |
| Tuning | `12-TET` only in Phase 1 |
| Transposition | `T_n(p) = p + n (mod 12)` |
| Inversion | `I_n(p) = n - p (mod 12)` |
| Prime form | Forte-compatible, left-packed, TnI-equivalent algorithm `forte-left-packed-tni-v1` |
| Scale degrees | One-based integers ordered upward from an explicit root |
| Exact ratios | Objects with integer `numerator` and positive integer `denominator`; never binary floats |
| Intrinsic identity | Float-free canonical JSON hashed with SHA-256 |

---

## 4. Pitch Class

**Status:** `admitted` mathematical primitive.

### Definition & Purpose

A pitch class is an octave-equivalence class in twelve-tone equal temperament.
It supplies the atomic coordinate used by every set, scale, interval, and
operator in this package.

### Mathematical Expression

```math
p \in \mathbb{Z}_{12}, \qquad p \equiv p + 12k.
```

### Schema / Runtime Type

`int` validated to the closed range `0..11`. Booleans are rejected even though
Python treats `bool` as an integer subtype.

### Concrete Example

Pitch classes `0`, `4`, and `7` form the C-major pitch-class triad. Pitch `12`
is not a valid stored value; it normalizes mathematically to pitch class `0`.

---

## 5. Pitch-Class Set

**Status:** `derived` from a valid 12-bit mask.

### Definition & Purpose

A pitch-class set is an unordered subset of `Z_12`. It is the fundamental
harmonic object from which cardinality, prime form, interval vector, symmetry,
and subset relations are derived.

### Mathematical Expression

```math
S \subseteq \mathbb{Z}_{12}, \qquad
m(S)=\sum_{p\in S}2^p.
```

### Schema / Runtime Type

`court_mathematics.PitchClassSet`. Intrinsic fields are `mask` and `tuning`;
`pitch_classes`, `cardinality`, `prime_form`, `interval_vector`, and `symmetry`
are recomputed and cannot be independently authored.

### Concrete Example

`PitchClassSet.from_pitch_classes((0, 2, 4, 7, 9))` has mask `661`,
cardinality `5`, prime form `(0, 2, 4, 7, 9)`, and interval vector
`(0, 3, 2, 1, 4, 0)`.

---

## 6. Rooted Scale and ScaleState

**Status:** `RootedScale` is `derived`; canonical `ScaleState` identity is
`admitted` and externally owned.

### Definition & Purpose

A rooted scale combines a pitch-class set with an explicit tonic and therefore
supplies deterministic degree order. A canonical `ScaleState` is the external
topology record that additionally owns state ID, Forte family, role, tier, and
office. `RootedScale` describes harmony; it does not duplicate topology
authority.

### Mathematical Expression

For root `r in S`, degree order is the ascending order of:

```math
((p-r) \bmod 12)_{p\in S}.
```

### Schema / Runtime Type

`court_mathematics.RootedScale`. A topology state is referenced by
`HarmonicProfile.subject_id`; no local `ScaleState` class is introduced.

### Concrete Example

The set `{0,2,4,5,7,9,11}` rooted at `0` orders as C Ionian. The same absolute
set rooted at `9` orders from A and produces an Aeolian modal orientation,
without changing its TnI set class.

---

## 7. Forte Set Class and Prime Form

**Status:** Prime-form derivation is `derived`; Forte labels remain owned by a
versioned catalog.

### Definition & Purpose

A Forte set class is an equivalence class under transposition and inversion.
Prime form is the canonical tuple used to look up that class. An interval
vector cannot substitute for prime form because Z-related classes share an
interval vector.

### Mathematical Expression

```math
[S]_{T_n/I_n}=\{T_n(S), I_n(S)\mid n\in\mathbb{Z}_{12}\}.
```

The Phase 1 algorithm chooses the minimum left-packed candidate after minimum
span.

### Schema / Runtime Type

`PitchClassSet.prime_form: tuple[int, ...]`. A future registry adapter may
resolve that tuple to a Forte number; `PitchClassSet` does not guess one.

### Concrete Example

Ionian `{0,2,4,5,7,9,11}` has prime form
`(0,1,3,5,6,8,10)`, corresponding to Forte `7-35` in the admitted catalog.

---

## 8. Interval Vector

**Status:** `admitted` descriptor and `derived` runtime value.

### Definition & Purpose

The interval vector counts unordered pitch pairs in interval classes IC1
through IC6. It describes global pair content without assigning a tonic,
function, or dissonance weight.

### Mathematical Expression

```math
v_k(S)=\#\{\{a,b\}\subseteq S:\min((b-a)\bmod12,(a-b)\bmod12)=k\}.
```

```math
\sum_{k=1}^{6}v_k(S)=\binom{|S|}{2}.
```

### Schema / Runtime Type

`IntervalVector = tuple[int, int, int, int, int, int]`, exposed as
`PitchClassSet.interval_vector`.

### Concrete Example

Every rooted mode of Forte `7-35` has interval vector
`(2,5,4,3,6,1)`. This equality does not make the modes functionally identical.

---

## 9. Symmetry, Achirality, and Chirality

**Status:** `derived` exact descriptors.

### Definition & Purpose

Symmetry records the transpositions and inversions that stabilize one concrete
pitch-set realization. A set is achiral when at least one `I_n` stabilizes it;
otherwise it is chiral. This is independent of Governor office and satellite
status.

### Mathematical Expression

```math
\operatorname{Stab}_T(S)=\{n:T_n(S)=S\},
```

```math
\operatorname{Stab}_I(S)=\{n:I_n(S)=S\}.
```

### Schema / Runtime Type

`court_mathematics.PitchClassSymmetry`, stored on
`PitchClassSet.symmetry` with ordered stabilizer tuples and derived chirality
booleans.

### Concrete Example

The `7-33` prime realization `{0,1,2,4,6,8,10}` has
`Stab_T=(0,)` and `Stab_I=(2,)`. The complete seven-note set does not inherit
the sixfold transpositional symmetry of its embedded whole-tone subset.

---

## 10. Court

**Status:** `proposed` package vocabulary; not admitted in integrated release
`1.2.0`.

### Definition & Purpose

The Court is the privileged five-position, rooted Forte `5-35` controller used
to expose and modulate four ordered Internal/External registers. It is a
pentatonic harmonic/controller context, not a heptatonic `ScaleState`, Governor
office, runtime task phase, or free choice among all sixteen pole vectors.

### Mathematical Expression

```math
\mathcal{C}=\{C_0,C_1,C_2,C_3,C_4\},
```

where every `C_i` is a weight-five subset of `Z_12` and the ordinary graph is
a path.

### Schema / Runtime Type

No Phase 1 runtime class. Planned canonical type: `CourtRootedPosition` in the
versioned `court-substrate` artifact. Harmonic masks are represented now by
`PitchClassSet`.

### Concrete Example

`C0={0,2,4,7,9}` is the all-External Court seed. `C4={0,3,5,8,10}` is the
all-Internal endpoint. Neither is a new Governor office.

---

## 11. Court Position

**Status:** `proposed`.

### Definition & Purpose

A Court position is one of the five canonical pairings of a rooted 5-35 pitch
mask, a four-pole register, a path index, and exact Court compression. Position
identity includes all four components.

### Mathematical Expression

```math
C_i=T_{5i}(C_0),\quad i\in\{0,1,2,3,4\},
```

as a relation among pitch masks, restricted to the segment with offsets
`0,5,10,3,8`. Root pitch class `0` is assigned separately and happens to
remain a member of each selected mask; ordinary transposition alone does not
preserve rooted-tonic identity.

### Schema / Runtime Type

Planned `CourtRootedPosition`. In Phase 1, examples use `PitchClassSet`; no
position may claim release admission.

### Concrete Example

`C2={0,2,5,7,10}` has pole register `(Internal, Internal, External, External)`
and exact `kappa_court=2/4`.

---

## 12. Court Geometry

**Status:** `proposed`; the stated values are reproducible derivations from
proposed C0-C4 masks pending CRT-301 through CRT-303.

### Definition & Purpose

Court geometry is the exact 12-bit path geometry induced by four disjoint
single-pitch exchanges. It proves adjacency, path distance, and independence
without invoking semantic or physical interpretations.

### Mathematical Expression

For signed edge vectors `e_1,...,e_4`:

```math
G_{ij}=e_i\cdot e_j=2\delta_{ij},\qquad G=2I_4,
```

```math
d_H(C_i,C_j)=2|i-j|.
```

### Schema / Runtime Type

No dedicated Phase 1 type. `PitchClassSet.hamming_distance` supplies the exact
mask metric. A later `CourtInvariant` record will carry proof method,
provenance, and release status.

### Concrete Example

`C1 XOR C2` has support `{9,10}` and Hamming distance `2`. `C0` to `C4`
crosses four disjoint exchanges and has Hamming distance `8`.

---

## 13. Pole Register

**Status:** `proposed`.

### Definition & Purpose

The pole register is the ordered four-bit Internal/External controller state
for Mars, Jupiter, Venus, and Saturn. Mercury moves and records the register;
Mercury is not a fifth pole.

### Mathematical Expression

```math
q=(m,j,v,s)\in\{0,1\}^4,
```

with `0=External`, `1=Internal`, in Mars/Jupiter/Venus/Saturn display order.

### Schema / Runtime Type

Planned immutable `PoleRegister`. Integer bit endianness is not admitted in
Phase 1; canonical interchange must use the named ordered fields or tuple.

### Concrete Example

`C3` uses `(1,1,1,0)`: Mars, Jupiter, and Venus are Internal while Saturn is
External.

---

## 14. Court Compression (`kappa_court`)

**Status:** `proposed`; explicitly distinct from `C_P`, `C_h`, aggregate
`C_H`, and `C_S`.

### Definition & Purpose

`kappa_court` is the exact fraction of the four ordered Court poles that have
internalized along the privileged C0-C4 path. It is a Court coordinate, not a
temperature, entropy, enthalpy, free energy, or generic harmonic score.

### Mathematical Expression

```math
\kappa_{court}(C_i)=\frac{i}{4},\qquad i=0,\ldots,4.
```

### Schema / Runtime Type

No canonical runtime type is admitted. The candidate YAML currently uses JSON
numbers; the package's float-free identity rule requires any future runtime
contract to choose an exact representation such as a normalized
`{numerator, denominator}` object before implementation.

### Concrete Example

An exact Phase 1-compatible proposal for C2 is
`{numerator: 1, denominator: 2}`. The current candidate YAML's `0.5` is source
evidence, not an admitted intrinsic representation.

---

## 15. Court Modulation

**Status:** `proposed` runtime operation.

### Definition & Purpose

Court modulation is an ordinary move between adjacent Court positions. It
changes one pitch, flips one named pole, and preserves the 5-35 Court path.

### Mathematical Expression

```math
C_i\leftrightarrow C_j,\qquad |i-j|=1,
```

```math
d_H(C_i,C_{i+1})=2,
\qquad d_H(q_i,q_{i+1})=1.
```

### Schema / Runtime Type

Planned `CourtLegalMove`, `CourtValidatedMove`, and `CourtTransitionEvent`.
Phase 1 does not mutate runtime state.

### Concrete Example

`C1 -> C2` replaces pitch `9` with `10` and flips only Jupiter from External
to Internal.

---

## 16. Court Filter

**Status:** `proposed`; linear diagonal form is the sole target for later
admission.

### Definition & Purpose

A Court filter is a selective observation of a larger pitch-class vector
through a binary Court mask. It exposes retained coordinates without changing
the authoritative source state or its Governor office.

### Mathematical Expression

```math
P_c=\operatorname{diag}(c),\qquad P_c(x)=c\odot x,
```

which is bitwise `mask(c) AND mask(x)`, with:

```math
P_c^2=P_c,\qquad P_c^{-1}\text{ does not exist}.
```

### Schema / Runtime Type

Planned `CourtFilterOperator` and `CourtFilterApplication`. Phase 1 may use
`PitchClassSet` intersection externally but defines no admitted filter class.

### Concrete Example

Filtering Aeolian `{0,2,3,5,7,8,10}` through
`c={0,2,3,5,7}` retains five pitches. A different mask may retain fewer than
five; output weight is an application result, not always the filter weight.

---

## 17. Mercury Engine

**Status:** Modular arithmetic is `derived` exactly; the Court runtime role is
`proposed`.

### Definition & Purpose

The Mercury Engine names two inverse mod-12 orientations: constructive `+5`
for forward generation and observational `+7` for reverse readback. The labels
describe framework roles; the arithmetic is exact.

### Mathematical Expression

```math
T_5(p)=p+5\pmod{12},\qquad T_7(p)=p+7\pmod{12},
```

```math
T_7\circ T_5=T_{12}=\operatorname{id}.
```

### Schema / Runtime Type

Phase 1 uses `PitchClassSet.transpose(5)` and `.transpose(7)`. A separate
stateful Mercury service is out of scope.

### Concrete Example

The constructive offsets begin `0,5,10,3,8`. Continuing `+5` produces `1`, so
the five Court masks are a selected reference-tonic-containing segment, not
the full order-12 orbit and not a root-preserving transposition operation.

---

## 18. Anchor

**Status:** `admitted` topology role.

### Definition & Purpose

An anchor is an office-bearing canonical topology state that defines a tier
seat rather than inheriting one selected governing parent. Anchors belong to
the external topology authority; harmonic calculations may describe them but
may not assign them.

### Mathematical Expression

One admitted A-series midpoint relation uses:

```math
d_H(m,a)=d_H(m,b)=2,\qquad d_H(a,b)=4.
```

The full admitted hierarchy includes A0-A2 and D1-D7.

### Schema / Runtime Type

External `ScaleState.role="anchor"` plus tier metadata. A
`HarmonicProfile.subject_id` may reference the state; no local `Anchor` writer
exists.

### Concrete Example

Aeolian state `1453` is an admitted A0 anchor in family `7-35` with Jupiter
office. Computing its triads cannot alter that office.

---

## 19. Satellite

**Status:** `admitted` topology role.

### Definition & Purpose

A satellite is an office-bearing non-anchor that inherits exactly one
categorical office through the admitted topology precedence rules. Satellite
status is independent of chirality, harmonic tension, and Court position.

### Mathematical Expression

For selected governing parent `a` and satellite `s`:

```math
\operatorname{office}(s)=\operatorname{office}(a),
```

only when the canonical resolver admits the relation.

### Schema / Runtime Type

External `ScaleState.role="satellite"` and one selected `GOVERNS` parent.
`court-mathematics` treats these as read-only provenance.

### Concrete Example

Harmonic Minor state `2477` is a `7-32` satellite of Aeolian `1453` and retains
Jupiter office even though the incoming `R7` edge carries Moon as Degree
Governor.

---

## 20. Boundary

**Status:** `admitted` topology role.

### Definition & Purpose

A boundary is a valid rooted heptatonic state for which no admitted rule grants
a categorical office after complete precedence evaluation. Boundary means
office-withheld, not invalid, disconnected, or harmonically unusable.

### Mathematical Expression

```math
\operatorname{office}(s)=\varnothing
```

while non-categorical contact evidence may remain nonempty.

### Schema / Runtime Type

External `ScaleState` with `role="boundary"`, `tier=null`, `office=null`, and
no `OCCUPIES_OFFICE` relationship.

### Concrete Example

State `223` remains office-withheld even if its harmonic profile contains
standard triads or nearby voice-leading moves.

---

## 21. Chaldean Degree and Degree Governor

**Status:** `admitted` mutation-edge address.

### Definition & Purpose

A Chaldean degree is one of seven fixed scale-degree addresses. Its Degree
Governor labels the structural function altered by a mutation; it never names
the Governor office of the whole destination state.

### Mathematical Expression

```math
\big(\gamma(1),\ldots,\gamma(7)\big)=
(Saturn,Jupiter,Mars,Sun,Venus,Mercury,Moon).
```

### Schema / Runtime Type

External mutation fields `degree` and `degreeGovernor`. Phase 1
`DegreeTriad.degree` uses the same one-based address but does not infer a
Governor.

### Concrete Example

Raising Aeolian Degree 7 is a Moon-degree mutation. Harmonic Minor nevertheless
remains a Jupiter state through its admitted ancestry.

---

## 22. Mutation Operator

**Status:** Structural algebra `admitted`; semantic effects and Court-filter
compatibility remain unresolved.

### Definition & Purpose

A mutation operator is a declared total or partial transformation of rooted
scale states with a domain, image, inverse information, and exact structural
delta. Operators describe edges; they do not author semantic consequences.

### Mathematical Expression

The admitted registry contains:

```math
M^7=\operatorname{id},\qquad L_k=R_k^{-1}
```

on declared domains, and modal covariance relations such as:

```math
MR_kM^{-1}=R_{\langle k-1\rangle_7},
```

where angle brackets denote one-based cyclic degree indexing.

### Schema / Runtime Type

External mutation-audit records. A future `MutationOperator` adapter will load
those records; Phase 1 does not duplicate the static table.

### Concrete Example

`R7(1453)=2477` raises Aeolian Degree 7 by one semitone. `M` is modal
rerooting and must not be used as the name for this degree raise.

---

## 23. Nodal Shift

**Status:** Framework term over admitted modal topology.

### Definition & Purpose

A nodal shift changes the rooted center within the same Forte family. It
changes modal phase and degree function while preserving the unrooted pitch
inventory and Forte class.

### Mathematical Expression

For the seven 7-35 modes:

```math
M:S_i\mapsto S_{i+1},\qquad M^7=\operatorname{id}.
```

### Schema / Runtime Type

External `MODAL_SUCCESSOR` or `MODAL_MUTATES_TO` relation. No separate
`NodalShift` Phase 1 class.

### Concrete Example

Ionian to Aeolian within `7-35` is a nodal shift. Aeolian to Harmonic Minor is
not, because that move changes Forte family.

---

## 24. Topological Translocation

**Status:** Framework-defined family change; dedicated runtime record
`proposed`.

### Definition & Purpose

A topological translocation changes Forte family through one or more explicitly
addressed mutations while preserving immutable Degree-Governor assignments.
Planning documents also propose requiring such a record for non-adjacent Court
jumps; those two cases must remain distinguishable by reason.

### Mathematical Expression

```math
[S]_{T_n/I_n}\ne[\mu(S)]_{T_n/I_n}.
```

The record carries source, target, changed degrees, signed deltas, operators,
and evidence.

### Schema / Runtime Type

Planned `TopologicalTranslocationRecord`; absent from Phase 1 runtime.

### Concrete Example

Aeolian `7-35` to Harmonic Minor `7-32` via `R7` is a family-change
translocation with `d_H=2` and `d_VL=1`.

---

## 25. Phase Transition

**Status:** `proposed`; no canonical executable predicate.

### Definition & Purpose

Phase transition is reserved for a future, explicitly typed change between
declared harmonic regimes. It must not be used as a synonym for modal phase,
the admitted `PHASE_SHIFT` graph relation, Court adjacency, or a thermodynamic
phase transition.

### Mathematical Expression

No admitted expression. A future definition must specify a state space,
order parameter, threshold, invariants, and failure cases.

### Schema / Runtime Type

None. Any payload claiming `PhaseTransition` must be rejected until a versioned
contract is admitted.

### Concrete Example

`C3 -> C4` is Court modulation, not a phase transition. Calling a `7-34` to
`7-33` fusion a phase transition remains a proposed interpretation.

---

## 26. Dyad, Trichord, and Subset Lattice

**Status:** `derived` exact structure.

### Definition & Purpose

A dyad is a two-degree subset. A trichord is any three-degree subset. The full
Boolean subset lattice contains every subset and inclusion edge; Phase 1
materializes its rank-2/rank-3 incidence slice. The term `triad` is reserved
for rooted degree-stacked harmony.

### Mathematical Expression

For a seven-note scale:

```math
\binom{7}{2}=21,\qquad \binom{7}{3}=35.
```

There are `35 * 3 = 105` dyad-to-trichord cover incidences.

### Schema / Runtime Type

`SubsetLattice`, `ScaleSubset`, and `SubsetIncidence`. The compatibility
property `SubsetLattice.subtriads` returns the 35 trichords but does not change
their unrooted meaning.

### Concrete Example

In Ionian, degrees `(1,3,5)` form trichord pitches `(0,4,7)`. Dyads `(1,3)`,
`(1,5)`, and `(3,5)` are its three immediate rank-2 predecessors.

---

## 27. Degree Triad

**Status:** `derived` exact structure.

### Definition & Purpose

A Degree Triad is one of the seven rooted stacks formed by taking a scale
degree, the degree two steps above it, and the degree four steps above it. Root
and stack order distinguish it from an arbitrary trichord.

### Mathematical Expression

For degree index `i` modulo seven:

```math
\tau_i=(s_i,s_{i+2},s_{i+4}).
```

Quality is classified from root-relative `(third,fifth)` as major `(4,7)`,
minor `(3,7)`, diminished `(3,6)`, augmented `(4,8)`, or `other`.

### Schema / Runtime Type

`court_mathematics.DegreeTriad` and `TriadQuality`. Chord inversion is not
stored because a pitch-class set has no bass or register.

### Concrete Example

Ionian produces qualities `(major, minor, minor, major, major, minor,
diminished)`. Harmonic Minor produces an augmented triad on Degree 3.

---

## 28. Harmonic Profile and Structured `C_h`

**Status:** `derived` Phase 1 record; not an aggregate compression score.

### Definition & Purpose

A Harmonic Profile is an immutable, provenance-bearing description of the
musical possibilities of one rooted heptatonic scale. Its structured
coordinate product separates tension descriptors, voice-leading affordances,
chordal inventory, and symmetry. Phase 1 profiles reject other cardinalities.

### Mathematical Expression

```math
C_h=(H_t,H_v,H_c,H_s).
```

`H_t` contains policy-free tension inputs, `H_v` exact parsimonious moves and a
named pair metric, `H_c` subset/chord inventory, and `H_s` set symmetry.

### Schema / Runtime Type

`HarmonicProfile`, `HarmonicCoordinates`, `TensionCoordinate`,
`VoiceLeadingCoordinate`, `ChordalCoordinate`, and `SymmetryCoordinate`.
The profile is identified by a SHA-256 digest of its float-free canonical body.

### Concrete Example

The profile for Aeolian state `1453` contains 21 dyads, 35 trichords, seven
Degree Triads, the one-semitone move `10 -> 11`, and a distinct rooted profile
fingerprint.

---

## 29. Aggregate Harmonic Compression (`C_H`)

**Status:** `unresolved`.

### Definition & Purpose

Aggregate `C_H` is the reserved name for a future total harmonic-compression
formula. Computing component measures does not define that formula and must not
silently produce a scalar.

### Mathematical Expression

```math
C_H(S)=\text{undefined}.
```

The only canonical Phase 1 value is `null`.

### Schema / Runtime Type

`AggregateHarmonicCompression(symbol="C_H", status="unresolved", value=None)`.
Construction of any other state is rejected.

### Concrete Example

A profile may contain interval vector `(2,5,4,3,6,1)` and ten one-semitone
moves while still serializing
`{"status":"unresolved","symbol":"C_H","value":null}`.

---

## 30. Compression Gradient

**Status:** `unresolved` as a unified scalar; component namespaces retain their
independent statuses.

### Definition & Purpose

Compression Gradient is an umbrella phrase for separately typed coordinates.
It exists to compare ordered structures without asserting numerical or causal
identity among physical, harmonic, semantic, and Court domains.

### Mathematical Expression

```math
C_P\sim C_H\sim C_S,
```

where `~` means hypothesized structural correspondence, not equality. Local
harmonic phase may be represented separately as `H=(theta,kappa_local)`.

### Schema / Runtime Type

No common numeric type. `C_P` belongs to physical runtime policy, structured
`C_h` belongs to `HarmonicProfile`, aggregate `C_H` is null, `C_S` belongs to
semantic profiles, and `kappa_court` belongs to future Court state.

### Concrete Example

A higher authored semantic position must not increase a dissonance score or
photon energy unless an independently admitted rule calculates each value.

---

## 31. Harmonic Gravity

**Status:** `provisional` configuration model; absent from Phase 1 code.

### Definition & Purpose

Harmonic Gravity is the proposed weighted aggregation of interval-class content
used to rank authored tension or attraction. The interval vector is objective;
the weights and interpretation are framework configuration rather than law.

### Mathematical Expression

```math
E_\delta(S)=\sum_{k=1}^{6}\delta_k v_k(S).
```

### Schema / Runtime Type

No Phase 1 runtime type. A future `DissonanceWeightConfiguration` must carry
`version`, `status="provisional"`, exact rational/decimal weights, method ID,
and configuration fingerprint.

### Concrete Example

Assigning IC1 weight `3` and IC5 weight `0` produces one authored energy model.
Changing those weights creates a different configuration fingerprint, not a
revision of the interval vector.

---

## 32. Mask Hamming and Rooted Hamming Distance (`d_H`)

**Status:** `admitted` measure and `derived` runtime value.

### Definition & Purpose

Mask Hamming distance counts differing coordinates between any two concrete
12-bit pitch sets. It is rooted Hamming distance only when both masks are
root-normalized `ScaleState` or `RootedScale` values under the same declared
root convention. It measures set exchange, not semitone travel or voice
assignment.

### Mathematical Expression

```math
d_H(X,Y)=\operatorname{popcount}(m(X)\oplus m(Y)).
```

For equal-cardinality sets, replacing one pitch produces `d_H=2` because one
bit leaves and one enters.

### Schema / Runtime Type

`PitchClassSet.hamming_distance(other) -> int` implements the general raw mask
measure. A topology/runtime adapter is responsible for proving aligned rooted
scope before labeling the result `rooted_hamming_distance`.

### Concrete Example

Root-normalized Aeolian `{0,2,3,5,7,8,10}` and Harmonic Minor
`{0,2,3,5,7,8,11}` have rooted `d_H=2`. The same method applied to arbitrary
unrooted sets reports raw exchange Hamming instead.

---

## 33. Voice-Leading Distance (`d_VL`)

**Status:** `provisional` Phase 1 metric.

### Definition & Purpose

Voice-leading distance measures minimal pitch displacement under a declared
matching policy. Phase 1 uses equal-cardinality pitch-class sets, octave
equivalence, circular semitone cost, no register, and a minimum-cost bijection.
It must never be aliased to Hamming distance or mutation operator `L1`.
Equal-cost witnesses maximize fixed common-tone assignments and then use
lexicographic order. A tritone displacement is represented as `+6` in either
direction because no shorter signed orientation exists.

### Mathematical Expression

```math
d_{VL}(X,Y)=\min_{\pi\in S_n}
\sum_{i=1}^{n}\min(|x_i-y_{\pi(i)}|,12-|x_i-y_{\pi(i)}|).
```

### Schema / Runtime Type

`minimum_voice_leading()`, `VoiceLeadingResult`, and
`VoiceLeadingAssignment`, with method ID `pc-taxicab-bijection-v1`.

### Concrete Example

For Aeolian to Harmonic Minor, six voices remain fixed and `10 -> 11`, so
`d_VL=1` while `d_H=2`.

---

## 34. Carey Coherence Quotient (`CQ`)

**Status:** Formal measure retained; current registry status
`reserved_external_measure`; executable Court admission pending.

### Definition & Purpose

Carey CQ measures failures of coherence between generic interval ordering and
specific interval size under a declared tuning and scale construction. It is a
family-and-tuning property, not operational reliability or semantic coherence.

### Mathematical Expression

```math
CQ(S)=1-\frac{F(S)}{\max F(N)},
```

where `F(S)` counts coherence failures and:

```math
\max F(N)=\frac{N(N-1)(N-2)(3N-5)}{24}.
```

### Schema / Runtime Type

No Phase 1 evaluator. Planned exact rational `CareyMeasureResult` with tuning,
generator, method version, provenance, numerator, and denominator.

### Concrete Example

For the 12-TET `7/12`-generated 5-35 seed, `F(S)=0`, so `CQ=1/1`.

---

## 35. Carey Sameness Quotient (`SQ`)

**Status:** Formal measure retained; current registry status
`reserved_external_measure`; executable Court admission pending.

### Definition & Purpose

Carey SQ measures differences among intervals with the same generic span but
unequal specific size. Carey's published term and the framework term are
Sameness Quotient. The active harmonic-measure registry currently says
"simplicity quotient"; that is a recorded terminology defect to resolve in a
new registry release, not a license to change the existing machine record in
place.

### Mathematical Expression

```math
SQ(S)=1-\frac{D(S)}{\max D(N)},
```

```math
\max D(N)=\frac{N(N-1)^2}{2}.
```

For a well-formed scale:

```math
SQ=\frac{2(N-2)}{3(N-1)}.
```

### Schema / Runtime Type

No Phase 1 evaluator. Planned exact rational `CareyMeasureResult`, distinct
from CQ and from all compression coordinates.

### Concrete Example

For `N=5`, `SQ=6/12=1/2`, serialized as `{numerator:1, denominator:2}`.

---

## 36. Acoustic Route

**Status:** Framework route label over admitted topology; no separate entity.

### Definition & Purpose

An Acoustic Route is the canonical alternate path through Forte `7-34`
Acoustic state `1749` between 7-35 anchors. It demonstrates that a state may
have one categorical office and multiple mutation entrances.

### Mathematical Expression

```math
\text{Lydian}\xrightarrow{L7}\text{Acoustic}
\xleftarrow{R4}\text{Mixolydian},
```

with both adjacent rooted exchanges at `d_H=2`.

### Schema / Runtime Type

Existing `ScaleState` and mutation relationships. No `AcousticRoute` Phase 1
class; route reconstruction belongs to canonical graph/registry consumers.

### Concrete Example

Acoustic `1749` retains Moon office while one incoming edge is Moon-degree and
the other is Sun-degree. Neither edge renames the state.

---

## 37. Confluence

**Status:** `admitted` structural witness category; no Phase 1 runtime type.

### Definition & Purpose

Confluence means two or more distinct valid derivation routes normalize to the
same intrinsic destination. It is an algebra/rewrite property, not the
topology evidence category named convergence and not chord consonance or
semantic consensus.

### Mathematical Expression

```math
r_1\ne r_2,\qquad
\operatorname{NF}(r_1(x))=\operatorname{NF}(r_2(x)).
```

### Schema / Runtime Type

No Phase 1 type. A future `ConfluenceWitness` must identify both routes, the
normal-form method, the common intrinsic destination, and source fingerprints.

### Concrete Example

From state `253`, routes `R1;L1` and `L1;R1` are distinct local paths that both
normalize back to state `253`. The Lydian/Mixolydian cospan at Acoustic `1749`
is instead a multi-source convergence witness.

---

## 38. Heterodyne and Heterodyning

**Status:** `proposed`; not ticketed and not executable.

### Definition & Purpose

Heterodyning is a proposed set-mask analogy for combining common and distinctive
pitch material from two states. It is not physical frequency mixing and must
not borrow empirical claims from signal heterodyning.

### Mathematical Expression

The only currently well-defined components are:

```math
I=A\cap B,\qquad U=A\cup B,\qquad
\Delta=A\triangle B=A\oplus B.
```

No canonical fusion-selection function is admitted.

### Schema / Runtime Type

None. A future type must declare deterministic pitch selection, output
cardinality, family resolution, commutativity, associativity, and failure
cases.

### Concrete Example

Combining two 7-34 masks by arbitrary set iteration is invalid because process
hash order could choose different distinctive pitches. Phase 1 rejects that as
an implementation strategy.

---

## 39. Wormhole

**Status:** `proposed` heuristic; not executable.

### Definition & Purpose

Wormhole is reserved for a future proven route-shortening property in which a
declared intermediate state provides a shorter valid harmonic path than the
comparison topology. It is not a synonym for symmetry, high energy,
non-commutation, or visual graph proximity.

### Mathematical Expression

A minimally meaningful future predicate would require:

```math
d_{route}(A,W)+d_{route}(W,B)<d_{baseline}(A,B),
```

plus a declared route metric, domains, operator witnesses, and evidence.

### Schema / Runtime Type

None. The admitted `7-33` A2 anchor may be analyzed by `PitchClassSet`, but no
`Wormhole` flag or detector is authorized.

### Concrete Example

The inversional symmetry of `7-33` does not prove that it shortens a Lydian to
Locrian path. Such a claim remains false unless a named route metric and valid
intermediate edges demonstrate the strict inequality.

---

## 40. Canonical distinction: `d_H` versus `d_VL`

**Status:** `provisional` because `d_VL` is provisional; the non-equivalence
rule is normative inside this package.

### Definition & Purpose

`d_H` counts changed occupancy coordinates. `d_VL` minimizes traveled
semitones under a matching policy. Both can describe the same transition, but
they answer different questions and have different units.

### Mathematical Expression

```math
d_H(X,Y)=|X\triangle Y|,
```

```math
d_{VL}(X,Y)=\min_{\pi}\sum_i c(x_i,y_{\pi(i)}).
```

For one non-colliding semitone replacement:

```math
d_H=2,\qquad d_{VL}=1.
```

### Schema / Runtime Type

Raw `PitchClassSet.hamming_distance` versus `minimum_voice_leading`. A caller
may label the first result rooted only after proving aligned rooted scope.
Neither function calls or substitutes for the other.

### Concrete Example

Aeolian to Harmonic Minor is one `R7` semitone displacement. Reporting only
`d_H=2` loses parsimony; reporting only `d_VL=1` loses the two changed mask
coordinates.

---

## 41. State Governor and Governor Office

**Status:** `admitted` topology identity.

### Definition & Purpose

A State Governor is the categorical Governor office occupied by a whole rooted
scale state under the admitted topology resolver. It is independent of Degree
Governor, semantic aspect classification, Court register, and runtime
operational Governor.

### Mathematical Expression

For canonical states `S` and seven offices `O`:

```math
\operatorname{occupiesOffice}:S\to O?
```

is a partial function. Office-bearing states map to exactly one office;
boundaries map to no office.

### Schema / Runtime Type

External `ScaleState.office` and categorical `OCCUPIES_OFFICE` relationship.
`court-mathematics` may carry the state ID as provenance but cannot write this
field.

### Concrete Example

Harmonic Minor `2477` occupies Jupiter office. Its incoming R7 edge has Moon as
Degree Governor, which does not change the State Governor.

---

## 42. CourtState

**Status:** `proposed` runtime state.

### Definition & Purpose

`CourtState` is the proposed replayable runtime reference to one Court position
whose admission is present in the bound substrate release. It may neither
replace `AgentState` nor rewrite harmonic topology. The approved architecture
recommends composition beside task `AgentState`, while older proposed prose
says "extends AgentState"; CRT-305 must record the superseding relationship
decision before either design becomes runtime authority.

### Mathematical Expression

```math
Q_t=(c_t,q_t,\kappa_{court}(c_t),u_t,\ell_t),
```

where `c_t` is position identity, `q_t` its pole register, `u_t` a future
Court-harmonic context fingerprint, and `ell_t` the Court-ledger anchor.

### Schema / Runtime Type

Planned `CourtState`, `CourtTransitionEvent`, and `CourtLedgerSnapshot` under
CRT-305. No Phase 1 class is provided.

### Concrete Example

A future C2 state references the C2 substrate record and a separately specified
pentatonic harmonic context. Phase 1 `HarmonicProfile` is heptatonic and cannot
supply that context. No C2 field is copied into `AgentState.data`, and no
`ScaleState` is created.

---

## 43. Commutation and Commutation Record

**Status:** `proposed`; the operator-domain contract is unresolved.

### Definition & Purpose

Commutation asks whether applying a Court filter and a mutation in opposite
orders produces the same defined output for one source. A result must preserve
undefined compositions rather than forcing a boolean answer.

### Mathematical Expression

```math
P_c\circ\mu\stackrel{?}{=}\mu\circ P_c.
```

Equality is evaluated only when both compositions are defined on the declared
domains.

### Schema / Runtime Type

The aligned candidate `CommutationRecord` result space is `commutes`,
`does_not_commute`, `left_undefined`, `right_undefined`, or `both_undefined`,
plus both witnesses, source, operator, filter, method version, and provenance.
This refines the older proposed boolean draft and requires explicit CRT-304
approval before implementation.

### Concrete Example

The admitted R7 operator requires an ordered weight-seven scale. After a Court
filter returns weight five, `R7(P_c(x))` is undefined unless a separately
admitted lifted operator supplies that domain.

---

## 44. Mutation Signature

**Status:** Structural fields `admitted`; packaged signature object not yet
implemented.

### Definition & Purpose

A Mutation Signature is the immutable structural summary of one operator
application. It identifies the operator, source, target, altered degree,
Degree Governor, direction, and exact pitch delta without adding semantic
effects.

### Mathematical Expression

```math
\sigma(\mu,x)=(\operatorname{id}(\mu),x,\mu(x),k,\gamma(k),\delta).
```

### Schema / Runtime Type

Existing mutation-audit application fields. A future adapter may expose a
frozen `MutationSignature` after verifying those fields against the registry.

### Concrete Example

The Aeolian-to-Harmonic-Minor signature is
`(R7,1453,2477,7,Moon,+1)`.

---

## 45. Normal Form

**Status:** `derived` under a named method; method identity is mandatory.

### Definition & Purpose

A normal form is the deterministic representative used to compare objects or
derivation destinations within a declared equivalence relation. Prime form is
one harmonic normal form; canonical profile JSON is an identity normal form.

### Mathematical Expression

```math
x\sim y\Rightarrow\operatorname{NF}(x)=\operatorname{NF}(y),
\qquad
\operatorname{NF}(\operatorname{NF}(x))=\operatorname{NF}(x).
```

### Schema / Runtime Type

`PitchClassSet.prime_form` uses method `forte-left-packed-tni-v1`.
`HarmonicProfile.identity_bytes()` uses the schema and algorithm versions in
the hashed body.

### Concrete Example

C-major and A-minor pitch-class triads share TnI prime form `(0,3,7)`, while
their rooted `DegreeTriad` qualities remain major and minor respectively.

---

## 46. Route Context

**Status:** `proposed` typed context.

### Definition & Purpose

Route Context is the immutable evidence needed to interpret how a destination
was reached without allowing route metadata to overwrite destination identity.
It separates source/target facts from operator order, Court filter, ledger, and
semantic claims.

### Mathematical Expression

```math
R=(x,y,\mu,c,o,e),
```

where `x,y` are source/target, `mu` is mutation, `c` is optional filter, `o`
is operation order, and `e` is evidence/provenance.

### Schema / Runtime Type

No Phase 1 class. Planned runtime context must be fingerprinted and bound by
validation tokens before execution.

### Concrete Example

Two filters may mediate the same Aeolian-to-Harmonic-Minor destination while
retaining different pitches; destination identity is equal but Route Context
is not.

---

## 47. Anchor Distance

**Status:** `admitted` harmonic-measure identifier; interpretation is restricted
to declared eligible relations.

### Definition & Purpose

Anchor Distance records the validated relation distance and tier-precedence
evidence from a state to an eligible canonical anchor. It is not unrestricted
graph shortest-path distance and does not itself assign an office.

### Mathematical Expression

For an eligible direct exchange relation:

```math
d_A(s,a)=d_H(s,a),
```

paired with relation kind and anchor tier. Other admitted relation kinds must
name their own method.

### Schema / Runtime Type

External topology relation/evidence fields and active measure ID
`anchor_distance`. No Phase 1 resolver is implemented.

### Concrete Example

Harmonic Minor `2477` has a direct Hamming-2 relation to A0 Aeolian `1453`, but
office inheritance still follows the canonical topology record rather than a
new local nearest-anchor search.

---

## 48. Modal Phase

**Status:** `admitted` descriptor.

### Definition & Purpose

Modal Phase is the rooted position of a scale within its modal rerooting orbit.
It tracks tonic orientation without changing the underlying pitch inventory or
Forte family.

### Mathematical Expression

For an orbit of length `n`:

```math
\phi(M(s))=\phi(s)+1\pmod n.
```

### Schema / Runtime Type

External measure ID `modal_phase` and modal mutation records. Phase 1
`RootedScale.root` and ordered degrees supply the concrete rooted orientation
but do not assign an external phase index.

### Concrete Example

The seven modes of `7-35` share prime form and interval vector while occupying
seven different modal phases.

---

## 49. Convergence

**Status:** `admitted` topology evidence classification.

### Definition & Purpose

Convergence describes multiple independently qualified topology contacts that
agree on the same non-categorical office evidence. It must remain distinct from
algebraic confluence and from mixed-office junction evidence.

### Mathematical Expression

For qualified contacts `E(s)`:

```math
|E(s)|\ge2,\qquad
\left|\{\operatorname{office}(e):e\in E(s)\}\right|=1.
```

Categorical office assignment still requires an admitted resolver rule.

### Schema / Runtime Type

External convergence/contact relationships and relational-office evidence. No
local writer exists.

### Concrete Example

Boundary state `223` retains convergent Jupiter evidence from two contacts but
keeps categorical `office=null` and has no `OCCUPIES_OFFICE` edge.

---

## 50. Pitch-Class Complement

**Status:** `derived` exact set operation; Court admission remains independent.

### Definition & Purpose

The pitch-class complement of a set contains exactly the coordinates absent
from that set in the twelve-tone field. Complement relates set classes but does
not assign roots, modal phases, offices, or Court status.

### Mathematical Expression

```math
S^c=\mathbb{Z}_{12}\setminus S,
\qquad m(S^c)=4095\oplus m(S).
```

### Schema / Runtime Type

`PitchClassSet.complement() -> PitchClassSet`. A future `ComplementMap` in the
Court substrate will bind admitted set-class identities and provenance.

### Concrete Example

The complement of C0 `{0,2,4,7,9}` is `{1,3,5,6,8,10,11}`. Its set class is
7-35, but its root and Governor office cannot be inferred from complement alone.

---

## 51. Canonical Neighbor

**Status:** `admitted` when witnessed by the mutation audit; not synonymous
with every Hamming-2 contact.

### Definition & Purpose

A Canonical Neighbor is a source/target pair connected by a declared mutation
operator application in its admitted domain. It supplies executable structural
evidence rather than proximity alone.

### Mathematical Expression

```math
x\in\operatorname{Dom}(\mu),\qquad \mu(x)=y.
```

For local one-semitone operators, `d_H(x,y)=2`, but the converse does not hold
for all Hamming-2 contacts.

### Schema / Runtime Type

External mutation operator/application records. A future adapter may expose a
read-only `CanonicalNeighbor` view after checking operator and application
fingerprints.

### Concrete Example

Aeolian `1453` and Harmonic Minor `2477` are canonical neighbors through R7.
A Hamming-2 pair with no admitted operator witness is only a structural contact.

---

## 52. Common-Tone Count

**Status:** `candidate` harmonic measure; exact runtime descriptor.

### Definition & Purpose

Common-tone count records how many pitch classes two sets retain in common. It
is useful alongside voice-leading distance but does not determine the minimum
assignment, direction, or harmonic function.

### Mathematical Expression

```math
c(X,Y)=|X\cap Y|=\operatorname{popcount}(m(X)\land m(Y)).
```

### Schema / Runtime Type

`VoiceLeadingResult.common_tone_count: int`. The active harmonic-measure
registry still marks the measure as candidate.

### Concrete Example

Aeolian and Harmonic Minor retain six common pitch classes, so
`common_tone_count=6`, while their Phase 1 `d_VL=1`.

---

## 53. Source registry

The lexicon is synthesized from these controlling or evidentiary sources:

| Scope | Source |
|---|---|
| Authority and namespace separation | `docs/GOVERNOR_DOMAIN_AUTHORITY.md` |
| Admitted topology roles and invariants | `docs/TOPOLOGY_IDENTITY_AND_INVARIANTS.md` |
| Canonical topology records | `canonical/universal-network-data.json` and `canonical/universal-heptatonic-ledger.csv` |
| Court masks and framework behavior | `framework/AGENTS.md` |
| Core identity, operator, and route terminology | `framework/CANONICAL_FEATURE_PROFILES_AND_MUTATION_ALGEBRA.md` |
| Court filters and mutation requirements | `framework/TOPOLOGICAL_ANCHORING.md` |
| Mercury, Court geometry, and Carey exposition | `framework/NATURAL_ORGANIZATION_THESIS.md` |
| Structural mutation laws | `seven-governors-mutation-algebra-audit/audit/` |
| Current harmonic-measure status | `seven-governors-canonical-feature-profile-registry-v0.1.1/canonical/harmonic-measure-definitions.json` |
| Current release admission | `provenance/release.json` and `provenance/DECISION_LEDGER.md` |
| Candidate Fivefold machine record | `seven-governors-state-machine-spec-and-authoring-toolkit-v0.2.0/schemas/fivefold_engine.yaml` |
| Proposed realization notes | `docs/MATHEMATICAL_REALIZATION_SPECIFICATION.md` |
| Proposed implementation boundary | `scrum/CRT-301-*.md` through `scrum/CRT-306-*.md` |
| Phase 1 executable evidence | `court-mathematics/src/court_mathematics/` and `court-mathematics/tests/` |
