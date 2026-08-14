# A-Tier Triadic Anchor and Compression Theorem

## Status and authority

| Field | Value |
|---|---|
| Candidate ID | `CH_A012_q_v1` |
| Scope | Canonical records with `role=anchor` and `tier in {A0,A1,A2}` |
| Families | A0 / 7-35, A1 / 7-34, A2 / 7-33 |
| States audited | 21 |
| Structural status | Independently reproduced finite result |
| Encoding | `q_v1` authored ordinal triadic classes |
| Scalar method | Positive normalized Chaldean-ordered weighted projection |
| Scoped admission | `Q(S)` and `W_A012(S)` admitted by GOV-213 for the 21 selected anchors |
| Aggregate namespace | Global `harmonic.C_H` remains `unresolved` with `value=null` |
| Global status | Untested outside the 21 A0-A2 anchors |

This document is part of the project as a scoped theorem admitted by GOV-213.
It records mathematics independently reproduced from the current canonical
ledger. The admission record is the root-owned sidecar at
`canonical/harmonic-compression-candidates/CH_A012_q_v1.json`; this document
does not modify a Governor office or promote its weighted score to the global
aggregate `harmonic.C_H` namespace.

The distinction is intentional:

- the finite statements about the 21 selected records are reproducible;
- `q_v1` is a framework-authored ordinal encoding;
- the Chaldean weight hierarchy is an authored constraint;
- the displayed weights are one feasible witness, not a unique natural law;
- extension to the rest of the 462-state topology remains separate follow-on
  work.

## 1. Source binding and selection rule

The theorem was reproduced against:

```text
path: canonical/universal-heptatonic-ledger.json
sha256: e6570972260fdae5c4ca878272dc89a9ff353d48762eefbe019707d229cd242d
```

Triads are derived by the existing `DegreeTriad` implementation in
`court-mathematics/src/court_mathematics/triads.py`.

The selection predicate is:

```text
role = anchor
tier in {A0, A1, A2}
```

Both clauses are required. Tier labels also occur on satellites and other
states, so selecting by `tier` alone does not identify the theorem's domain.

## 2. Rooted phase and triadic structure

Let

```math
S=(s_1,s_2,\ldots,s_7)
```

be a rooted heptatonic pitch-class state ordered by ascending scale degree. The
declared root is normalized to pitch class 0. This is equivalent to comparing
all states at a common tonic phase, such as C, without claiming that absolute C
is privileged. Jointly transposing the pitch set and its root must preserve the
relative rooted profile.

For each degree `i` in `{1,...,7}`, define the scale-degree tertian triad:

```math
\tau_i(S)=(i,i+2,i+4),
```

with degree indices interpreted cyclically modulo 7. The implementation stores
the resulting root-relative interval signature as `(0, third, fifth)`.

An unrooted interval-class vector alone cannot distinguish modal rotations of
one Forte family. For example, all seven 7-35 modes have interval vector:

```text
(2,5,4,3,6,1)
```

That does not create a problem for this theorem. Rooting preserves where each
triadic quality occurs among the seven scale degrees, and the theorem operates
on that degree-sensitive placement.

## 3. The `q_v1` triadic encoding

Define the authored ordinal map:

```math
q(4,7)=0,\qquad q(3,7)=1,
```

```math
q(3,6)=q(4,8)=2,
```

```math
q(2,6)=q(4,6)=3.
```

| Abbreviated signature | Runtime quality | `q_v1` class |
|---|---|---:|
| `(4,7)` | Major | 0 |
| `(3,7)` | Minor | 1 |
| `(3,6)` | Diminished | 2 |
| `(4,8)` | Augmented | 2 |
| `(2,6)` | Other | 3 |
| `(4,6)` | Other | 3 |

The leading root coordinate 0 is omitted in the table. Diminished and augmented
triads remain different harmonic objects even though this quotient assigns both
to class 2. The two `other` signatures remain distinct even though both map to
class 3.

The values `0,1,2,3` are framework-authored ordinal compression classes. They
are not physical energy, psychoacoustic roughness, thermodynamic quantities, or
empirical semantic measurements.

## 4. Triadic Compression Signature

For a rooted state `S`, define:

```math
Q(S)=\left(q(\tau_1(S)),q(\tau_2(S)),\ldots,q(\tau_7(S))\right).
```

Thus:

```math
Q(S)\in\{0,1,2,3\}^7.
```

`Q(S)` is mode-sensitive because modal rotation changes the degree placement of
triadic qualities even when the family-level interval vector remains fixed.

## 5. Chaldean degree map

The admitted Degree Governor map is:

| Degree | Degree Governor |
|---:|---|
| 1 | Saturn |
| 2 | Jupiter |
| 3 | Mars |
| 4 | Sun |
| 5 | Venus |
| 6 | Mercury |
| 7 | Moon |

Let `d(G)` be the inverse map from Governor to its Chaldean degree:

```math
d(\mathrm{Saturn})=1,\quad d(\mathrm{Jupiter})=2,
\quad d(\mathrm{Mars})=3,\quad d(\mathrm{Sun})=4,
```

```math
d(\mathrm{Venus})=5,\quad d(\mathrm{Mercury})=6,
\quad d(\mathrm{Moon})=7.
```

This Degree Governor address remains separate from the State Governor office of
the complete rooted state.

## 6. Theorem 1: A-tier Governor-seat consistency

Let `S_(G,t)` denote the canonical rooted anchor occupying State Governor office
`G` at tier `t` in `{A0,A1,A2}`. For all 21 selected anchors:

```math
\boxed{q\!\left(\tau_{d(G)}(S_{G,t})\right)=2}.
```

The triadic coordinate at the Chaldean degree associated with the already
resolved Governor office stays in compression class 2 across all three anchor
families.

| State Governor | Degree | A0 / 7-35 | A1 / 7-34 | A2 / 7-33 |
|---|---:|---|---|---|
| Saturn | 1 | `1387` Locrian: diminished | `2901` Lydian Augmented: augmented | `1373` Storian: diminished |
| Venus | 5 | `1451` Phrygian: diminished | `1389` Half-Diminished: augmented | `3413` Leading Whole-Tone: diminished |
| Jupiter | 2 | `1453` Aeolian: diminished | `1707` Dorian flat 2: augmented | `1397` Major Locrian: diminished |
| Mercury | 6 | `1709` Dorian: diminished | `1461` Mixolydian flat 6: augmented | `2731` Neapolitan Major: diminished |
| Mars | 3 | `1717` Mixolydian: diminished | `2733` Melodic Minor: augmented | `1493` Lydian Minor: diminished |
| Moon | 7 | `2741` Ionian: diminished | `1749` Acoustic: augmented | `1367` Leading Whole-Tone Inverse: diminished |
| Sun | 4 | `2773` Lydian: diminished | `1371` Superlocrian: augmented | `1877` Aeroptian: diminished |

### Proof

The claim is finite. For each of the 21 selected records:

1. construct the canonical rooted pitch-class state;
2. derive all seven degree-stacked triads;
3. classify each signature under `q_v1`;
4. read the canonical State Governor office;
5. evaluate the coordinate at `d(G)`.

All 21 evaluations equal 2. The theorem therefore holds over the stated finite
domain.

This is a consistency result. It checks existing office assignments and must
not be reversed into an office classifier. In particular:

```math
G(S)\ne\operatorname*{argmax}_i w_iq_i
```

in general.

## 7. Theorem 2: anchor-family triadic multisets

Within each selected anchor family, every modal state has the same multiset of
`q_v1` classes:

```math
\boxed{M_{A0}=\{0,0,0,1,1,1,2\}},
```

```math
\boxed{M_{A1}=\{0,0,1,1,2,2,2\}},
```

```math
\boxed{M_{A2}=\{0,1,2,2,2,3,3\}}.
```

The modes differ only in degree placement. Their unweighted sums are:

```math
\sum M_{A0}=5,\qquad \sum M_{A1}=8,\qquad \sum M_{A2}=13,
```

so:

```math
5<8<13.
```

This is an ordinal tier result under the authored `q_v1` encoding.

The sequence `5,8,13` is recorded as `CH-OBS-001`, status
`observed_noncausal`. Its occurrence does not establish golden-ratio dynamics,
natural-growth laws, physical causality, or universal scaling.

## 8. Weighted A-tier score

Let:

```math
w=(w_1,\ldots,w_7)\in\mathbb R_{>0}^7
```

be a positive normalized degree-weight vector. Define the theorem-local score:

```math
W_{A012}(S)=w\cdot Q(S)=\sum_{i=1}^{7}w_iq(\tau_i(S)).
```

The graph should retain the richer `Q(S)` if this scalar projection is later
implemented.

The authored Chaldean ordering constraint is:

```math
\boxed{w_1>w_5>w_2>w_6>w_3>w_7>w_4>0},
```

with:

```math
\boxed{\sum_{i=1}^{7}w_i=1}.
```

The ordering is a framework constraint, not a result inferred from the 21
states.

## 9. Theorem 3: feasible A-tier separation

There exists at least one positive normalized vector satisfying the Chaldean
ordering for which the A0 modes obey:

```text
Lydian < Ionian < Mixolydian < Dorian < Aeolian < Phrygian < Locrian
```

and the three anchor families occupy disjoint score bands.

One exact feasible witness in degree order `(1,...,7)` is:

```math
\boxed{w=\frac1{407}(116,56,41,35,77,44,38)}.
```

It satisfies:

```math
116>77>56>44>41>38>35>0.
```

### Exact signatures and values

| Tier | Office | State | `Q(S)` | `W_A012(S)` |
|---|---|---|---|---:|
| A0 | Sun | `2773` Lydian | `(0,0,1,2,0,1,1)` | `193/407` |
| A0 | Moon | `2741` Ionian | `(0,1,1,0,0,1,2)` | `217/407` |
| A0 | Mars | `1717` Mixolydian | `(0,1,2,0,1,1,0)` | `259/407` |
| A0 | Mercury | `1709` Dorian | `(1,1,0,0,1,2,0)` | `337/407` |
| A0 | Jupiter | `1453` Aeolian | `(1,2,0,1,1,0,0)` | `340/407` |
| A0 | Venus | `1451` Phrygian | `(1,0,0,1,2,0,1)` | `343/407` |
| A0 | Saturn | `1387` Locrian | `(2,0,1,1,0,0,1)` | `346/407` |
| A1 | Sun | `1371` Superlocrian | `(2,1,1,2,0,0,2)` | `475/407` |
| A1 | Moon | `1749` Acoustic | `(0,0,2,2,1,1,2)` | `349/407` |
| A1 | Mars | `2733` Melodic Minor | `(1,1,2,0,0,2,2)` | `418/407` |
| A1 | Mercury | `1461` Mixolydian flat 6 | `(0,2,2,1,1,2,0)` | `394/407` |
| A1 | Jupiter | `1707` Dorian flat 2 | `(1,2,0,0,2,2,1)` | `508/407` |
| A1 | Venus | `1389` Half-Diminished | `(2,2,1,1,2,0,0)` | `574/407` |
| A1 | Saturn | `2901` Lydian Augmented | `(2,0,0,2,2,1,1)` | `538/407` |
| A2 | Sun | `1877` Aeroptian | `(2,0,3,2,3,1,2)` | `776/407` |
| A2 | Moon | `1367` Leading Whole-Tone Inverse | `(3,1,2,2,0,3,2)` | `764/407` |
| A2 | Mars | `1493` Lydian Minor | `(0,3,2,3,1,2,2)` | `596/407` |
| A2 | Mercury | `2731` Neapolitan Major | `(1,2,2,0,3,2,3)` | `743/407` |
| A2 | Jupiter | `1397` Major Locrian | `(3,2,3,1,2,2,0)` | `860/407` |
| A2 | Venus | `3413` Leading Whole-Tone | `(2,2,0,3,2,3,1)` | `773/407` |
| A2 | Saturn | `1373` Storian | `(2,3,1,2,2,0,3)` | `779/407` |

The exact bands are:

```math
\frac{193}{407}\le W(A0)\le\frac{346}{407}
<\frac{349}{407}\le W(A1)\le\frac{574}{407}
<\frac{596}{407}\le W(A2)\le\frac{860}{407}.
```

The strict A0/A1 gap is `3/407`; the strict A1/A2 gap is `22/407`.

### Feasibility formulation

A linear program may maximize a positive margin `epsilon` subject to:

1. the six strict Chaldean-order differences represented as inequalities with
   margin `epsilon`;
2. `w_4 >= epsilon`;
3. `sum(w)=1`;
4. successive A0 ordering differences at least `epsilon`;
5. every A1 score exceeding every A0 score by at least `epsilon`;
6. every A2 score exceeding every A1 score by at least `epsilon`.

The displayed vector proves feasibility. Without a separately declared and
validated optimization objective, it must not be described as the unique
mathematically necessary weight vector.

## 10. Governor identity and score remain separate

Governor office is categorical:

```math
G(S)\in\mathcal G.
```

The theorem-local score is numerical:

```math
W_{A012}(S)\in\mathbb Q_{>0}.
```

The score can test consistency with already admitted offices. It cannot replace
the topology's office-resolution procedure without a separate theorem and
admission decision.

The score also remains separate from:

- physical photonic coordinate `C_P`;
- authored semantic coordinate `C_S`;
- Court coordinate `kappa_court`;
- temperature, entropy, enthalpy, or free energy;
- physical or psychoacoustic energy.

Any correspondence among these coordinates requires a separate comparison
artifact and empirical or formally declared evidence.

## 11. A2 structural observation

Under `q_v1`, A2 introduces the signatures `(2,6)` and `(4,6)`, which do not
belong to the runtime's major, minor, diminished, or augmented quality classes.
A2 therefore has a larger observed triadic-signature vocabulary than A0 or A1
under this audit.

That fact does not prove descriptions such as wormhole, isotropic saddle, phase
portal, or maximal-symmetry transition layer. Those remain separate hypotheses
requiring graph-theoretic or dynamical evidence.

## 12. Scope and falsification

The finite theorems above apply only to the 21 selected A0-A2 anchors. They do
not establish equivalent behavior for:

- D1-D7 anchors;
- direct satellites;
- convergence states;
- mixed-office junctions;
- peripheral leaves;
- unresolved boundary states.

Global extension must be rejected, revised, or bounded if later audits show any
of the following:

1. the `q_v1` vocabulary cannot represent additional triadic signatures;
2. an intended seated-state invariant fails outside the current domain;
3. no positive Chaldean-ordered vector satisfies an extended constraint set;
4. structurally important states collapse under the score where distinction is
   required;
5. the weighted projection ceases to be a useful compression coordinate;
6. a revised `q` model breaks an admitted invariant without a versioned
   migration.

Failure of a global extension would bound the result. It would not erase the
reproduced 21-state theorem.

## 13. GOV-213 scoped admission

GOV-213 admits the machine-readable disposition:

```text
candidateId: CH_A012_q_v1
scope: role=anchor and tier in {A0,A1,A2}
structuralStatus: admitted_scoped_A012
aggregateNamespaceStatus: unresolved_global
globalStatus: untested_outside_A012_anchors
```

The executable evidence consists of:

1. strict schemas under `schemas/harmonic-compression-candidates/`;
2. root-owned derivation in `src/governor/harmonic_compression.py` using the
   existing `DegreeTriad` implementation;
3. deterministic build and validation commands in `package.json`;
4. exact records for all 21 anchors and six adversarial cases;
5. source, algorithm, record, candidate, and validation fingerprints;
6. joint-transposition invariance and modal `M^7` covariance evidence;
7. release and decision-ledger bindings that preserve the global null guard.

The collision and extension audits over D1-D7, satellites, convergence states,
junctions, leaves, and boundaries remain separate work. Canonical global
aggregate `harmonic.C_H` therefore remains null. The scoped admission makes
`Q(S)` and `W_A012(S)` available only where their finite theorem applies.
