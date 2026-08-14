# D-Tier Triadic Compression Theorem and 70-Anchor Audit

## Status and authority

| Field | Value |
|---|---|
| Candidate | `CH_D17_q_v2` |
| Coordinate | `harmonic.CH_D17_q_v2` |
| D scope | `role=anchor` and `tier in {D1,D2,D3,D4,D5,D6,D7}` |
| D records | 49 |
| Comparison universe | All 70 canonical A0-D7 anchors |
| Status | `admitted_scoped_D17` by GOV-227 |
| Admission effect | `Q(S)` and `W_D17(S)` only in the selected D scope |
| GOV-213 baseline | `CH_A012_q_v1`, admitted for 21 A0-A2 anchors |
| Neo4j data integration | Prohibited; no q_v2 graph properties or relations |
| Global aggregate | `harmonic.C_H` remains `unresolved` with `value=null` |

This document records the finite theorem admitted by GOV-227. Admission of the
scoped D-tier coordinate is independent of topology authority, runtime writes,
Neo4j projection, semantic admission, and global harmonic aggregation.

## 1. Scope and source binding

The finite comparison uses the exact predicates:

```text
A baseline: role=anchor and tier in {A0,A1,A2}
D scope:    role=anchor and tier in {D1,D2,D3,D4,D5,D6,D7}
```

The candidate binds the canonical heptatonic ledger, the interval-class
dissonance specification, the byte-pinned GOV-213 candidate, the global `C_H`
namespace guard, and the GOV-227 execution record by SHA-256. Satellites and
boundaries are not included.

## 2. Derived q_v2 encoding

For rooted degree triad signature `(a,b)`, the three unordered pairwise
intervals are `a`, `b-a`, and `b`. With framework-authored weights

```text
delta(1)=3, delta(2)=2, delta(3)=1/2,
delta(4)=1/2, delta(5)=0, delta(6)=5/2,
```

define

```math
D(a,b)=\delta(a)+\delta(b-a)+\delta(b).
```

The authored structural ordinal `q_v2` is:

1. perfect-fifth tertian major/minor: `0` and `1`;
2. equal-stacked non-perfect signatures: `2`, including `(2,4)`, `(3,6)`,
   and `(4,8)`;
3. every other signature: `3` plus its descending unique `D(a,b)` rank in the
   21-signature domain observed across the 70 anchors.

It exactly preserves q_v1:

```text
(4,7) (3,7) (3,6) (4,8) (2,6) (4,6)
   0     1     2     2     3     3
```

Exact q_v1 preservation fixes dissonance-5 exotic signatures at class `3`, so
classes `4` through `7` enumerate descending lower dissonance levels. q_v2 is
a structural ordinal, not a monotone acoustic-energy magnitude, physical
measurement, psychoacoustic law, or semantic coordinate.

## 3. Universal finite Governor Seat Invariant

Let `S_(G,t)` be the unique canonical anchor in Governor office `G` and tier
`t`, and let `d(G)` be the admitted Governor-degree map. Then, over the closed
70-anchor domain,

```math
\boxed{\forall t\in\{A0,A1,A2,D1,\ldots,D7\},\ \forall G,\quad
q_2\!\left(\tau_{d(G)}(S_{G,t})\right)=2.}
```

| Tiers | Governor-seat signature | q_v2 |
|---|---|---:|
| A0, A2, D2, D3 | `(3,6)` | 2 |
| A1, D1, D4 | `(4,8)` | 2 |
| D5, D6, D7 | `(2,4)` | 2 |

GOV-213 establishes the 21 A-anchor cases under q_v1. q_v2 reproduces those
six signature classes exactly, and GOV-227 enumerates the remaining 49
D-anchor cases. Therefore the invariant holds for exactly all 70 canonical
A0-D7 anchors.

"Universal" here means universal over this closed finite anchor domain. It does
not include the 238 satellites, 154 boundaries, arbitrary heptatonic sets, or a
physical universe. The invariant verifies existing Governor seats and cannot
be inverted to infer an office.

## 4. Tier multisets and rooted discrimination

| Tier | q_v2 multiset | Sum |
|---|---|---:|
| A0 | `{0,0,0,1,1,1,2}` | 5 |
| A1 | `{0,0,1,1,2,2,2}` | 8 |
| A2 | `{0,1,2,2,2,3,3}` | 13 |
| D1 | `{0,0,1,1,2,3,3}` | 10 |
| D2 | `{2,3,3,6,6,7,7}` | 34 |
| D3 | `{2,5,5,7,7,7,7}` | 40 |
| D4 | `{0,1,2,3,3,5,5}` | 19 |
| D5 | `{2,3,3,6,6,7,7}` | 34 |
| D6 | `{2,3,3,4,4,5,5}` | 26 |
| D7 | `{2,2,2,5,5,5,5}` | 26 |

These sums are finite observations, not a monotone tier order.

### D2/D5 multiset twin

D2 / `7-15` and D5 / `7-Z12` share q_v2 multiset
`{2,3,3,6,6,7,7}` and sum `34`. Their raw triad-signature multisets differ,
and no exact rooted Q tuple collides across their seven modes. They are twins
only after the multiset quotient; rooted `Q(S)` is required for discrimination.

### D3/D4 Z-partner

D3 / `7-Z37` and D4 / `7-Z17` share interval vector
`(4,3,4,5,4,1)`, while their raw triad-signature multisets and q_v2 multisets
differ and no exact rooted Q tuple collides. Rooted triadic evidence separates
their audited structures, but topology remains the authority that assigns
tiers.

## 5. Fixed witness and interleaving

The descriptive projection is

```math
W_2(S)=\frac{1}{407}(116,56,41,35,77,44,38)\cdot Q_2(S),
```

under the fixed framework hierarchy

```text
116 > 77 > 56 > 44 > 41 > 38 > 35 > 0.
```

The numeric witness retains `uniquenessClaim=false`: it is one feasible
witness, not a natural law or unique solution.

| Tier | Fixed-witness band |
|---|---|
| A0 | `[193,346]/407` |
| A1 | `[349,574]/407` |
| A2 | `[596,860]/407` |
| D1 | `[488,668]/407` |
| D2 | `[1781,2198]/407` |
| D3 | `[2081,2462]/407` |
| D4 | `[881,1292]/407` |
| D5 | `[1808,2102]/407` |
| D6 | `[1405,1600]/407` |
| D7 | `[1396,1639]/407` |

Declared-adjacent gaps are:

```text
A0-A1    +3/407      D1-D2  +1113/407      D4-D5  +516/407
A1-A2   +22/407      D2-D3   -117/407      D5-D6  -697/407
A2-D1  -372/407      D3-D4  -1581/407      D6-D7  -204/407
```

Positive values are disjoint gaps; negative values are overlaps. The witness
preserves A-tier separation but exhibits substantial A/D and D/D
interleaving. It is not a scalar realization of tier precedence.

## 6. Exact LP result

The audit uses exact rational arithmetic, two-phase simplex, Bland pivoting,
normalization `sum(w_i)=407`, a common nonnegative margin, the fixed Chaldean
hierarchy, and complete all-pairs separation constraints.

| Model | Constraints | Result |
|---|---:|---|
| GOV-213 A-tier calibration | 111 | `OPTIMAL_STRICT`; margin `3`; recovers the declared witness |
| A0 through D7 declared order | 448 | `WEAK_SYSTEM_INFEASIBLE` |
| D1 through D7 declared order | 301 | `WEAK_SYSTEM_INFEASIBLE` |
| Every A before every D | 1036 | `WEAK_SYSTEM_INFEASIBLE` |

`WEAK_SYSTEM_INFEASIBLE` means no normalized nonnegative weight vector
satisfying even the non-strict form of the fixed hierarchy satisfies that
model's complete separation constraints. Exact phase-one infeasibility was
reported rather than a solver limit or floating-point failure.

This rules out only the tested linear q_v2 projections under the declared
hierarchy. It does not rule out every scalar, nonlinear model, encoding, or
unconstrained weight order.

## 7. Why topology resolves tiers

The evidence establishes all of the following:

- D2 and D5 collapse to the same q_v2 multiset;
- D3 and D4 collapse to the same interval vector;
- fixed-witness bands interleave;
- no hierarchy-conforming linear separator exists for the tested tier models;
- rooted Q can distinguish structures but has no topology-writing authority.

Tier resolution is therefore a graph-topological decision over declared
construction, contact, closure, symmetry, and precedence relations. It is not
a sort by q_v2, multiset sum, or W. Neo4j may project an admitted topology but
does not create its authority; this release emits no q_v2 graph data.

## 8. Global C_H remains unresolved

```text
namespace: harmonic.C_H
status: unresolved
value: null
```

Neither Q nor W totalizes global `harmonic.C_H`. Full 462-state collision
analysis, satellites, boundaries, all 15 mutation-operator deltas, and
`C_P`/`C_H`/`C_S` correspondence remain deferred. The scoped coordinate is not
`C_P`, `C_S`, `kappa_court`, photon energy, temperature, entropy, enthalpy, or
free energy.
