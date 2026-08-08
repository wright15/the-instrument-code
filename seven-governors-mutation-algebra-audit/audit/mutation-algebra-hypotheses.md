# Graph-Derived Mutation Algebra Audit

## Result

The current canonical graph supports a compact structural mutation system with
**15 generator candidates**:

- one total modal successor operator, `M`;
- fourteen partial local operators, `R1…R7` and `L1…L7`;
- `R1/L1` are the root-phase seam pair; and
- `R2…R7/L2…L7` are fixed-degree semitone shifts.

This is a structural algebra audit. It does not yet declare semantic feature
effects, Court compatibility, a harmonic-compression formula, or asset behavior.

## Source and scope

- canonical rooted states: **462**
- source SHA-256: `21e2a632837ecf40fe9229e9eb4ec0a5cceb9e2043fe89cb8e1d320518d7bdbc`
- complete rooted weight-seven universe: **PASS**
- operator applications enumerated: **3402**
- current canonical structural edges validated: **588 / 588**
- current canonical field edges validated: **760 / 760**

## Structurally validated laws

### 1. The modal operator has order seven

`M` is total on all 462 states. It partitions the universe into **66
disjoint seven-cycles**:

```text
M^7(s) = s
```

No tested state has a smaller positive modal period.

The orbit partition is:

- 10 anchor cycles = 70 states;
- 34 satellite cycles = 238 states; and
- 22 boundary cycles = 154 states.

### 2. Modal transport preserves structural identity

Across all 462 applications, `M` preserves Forte family, orientation,
chirality, primary role, fine role, tier, and office-bearing status.

For all **308 office-bearing states**, it transports the State Governor by:

```text
office(M(s)) = office(s) + 2 mod 7
```

Boundary states remain boundary; this law does not assign them offices.

### 3. The phase seam completes the seven degree addresses

The root-phase pair is not an unrelated extra edge type. `R1/L1` completes
the same cyclic family as the six fixed degree addresses:

| Degree | Degree Governor | Raise | Lower |
|---:|---|---|---|
| 1 | Saturn | R1 | L1 |
| 2 | Jupiter | R2 | L2 |
| 3 | Mars | R3 | L3 |
| 4 | Sun | R4 | L4 |
| 5 | Venus | R5 | L5 |
| 6 | Mercury | R6 | L6 |
| 7 | Moon | R7 | L7 |

Every local operator has a domain and image of **210 states**.

### 4. Local raises and lowers are partial inverses

For every degree `k`:

```text
Lk(Rk(s)) = s  on Dom(Rk)
Rk(Lk(s)) = s  on Dom(Lk)
```

All **2940** local inverse
applications pass. The modal inverse is `M^6`; its 462 witnesses also pass.

### 5. Modal covariance is stronger than naive commutation

The exhaustively validated transport law is:

```text
M Rk M^-1 = R(k-1 mod 7)
M Lk M^-1 = L(k-1 mod 7)
```

Equivalently, using left-to-right path notation:

```text
Rk ; M = M ; R(k-1 mod 7)
Lk ; M = M ; L(k-1 mod 7)
```

All **6468** domain-and-target cases pass, including
**2940** defined applications on each side.

The Degree-Governor label transported from `k` to `k-1` also advances by
`+2 mod 7`. This is the same permutation observed for State Governors under
modal succession. That shared action is the audit's most important new
invariant.

### 6. Local operators commute only in the qualified partial sense

For all 91 unordered pairs of local generators:

- whenever both two-step composites are defined, their values agree;
- there are **0** common-domain value mismatches;
- but **3528** source/pair cases have only one
  composite order defined.

Pair classifications:

```json
{
  "weak_common_domain_commutation": 21,
  "strong_partial_commutation": 70
}
```

Therefore the safe claim is **equality on the common composite domain**, not
unqualified global commutation of partial functions.

### 7. True diamonds and multi-source cospans are different evidence

- same-source direct confluence diamonds: **7644**
- A1/A2 multi-source construction cospans: **14**

The Acoustic fixture is a cospan:

```text
Lydian --L7--> Acoustic <--R4-- Mixolydian
```

The two paths begin at different sources. They prove convergence on one
intrinsic state, but they are not an equation of the form `AB = BA`.

## Important negative results

### Hamming distance 2 is adjacency, not automatically a primitive

The canonical field contains **585** audited
Hamming-2 edges. Of those, **150** are primitive adjacent
semitone pairs and **435** exchange a note across more than
one semitone. The latter may become macro operators or composite paths, but the
distance alone does not authorize either interpretation.

### Root-phase adjacency does not authorize an office

The complete formal phase domain contains 210 inverse pairs. The current field
records 175. Another 5 pairs appear
only on selected structural root-phase edges, leaving **30
formally valid phase pairs that are not currently projected by either
channel**. The gap ledger identifies them without altering the canonical
release.

Phase adjacency may connect different categorical offices or office-bearing
and boundary states. It is a structural operation; office resolution still
belongs to the declared precedence audit.

### The canonical graph is a selective projection of the full operator action

The formal operator action contains all 462 modal applications, while the
canonical `MODAL_SUCCESSOR` relation currently projects 182.
The remaining **280** applications are mathematically valid but
not present as canonical modal edges.

This is not an identity failure: all 462 applications preserve family,
orientation, chirality, role, fine role, and tier. It is a projection-coverage
distinction. The optional Neo4j algebra import adds the complete action under
the separate relationship types `MODAL_MUTATES_TO` and
`LOCAL_MUTATES_TO`, leaving canonical relationships untouched.

### The whole network is not yet proven to be a lattice

Modal cycles prevent the raw directed graph from being a partial order. A
lattice claim would require a declared quotient, an order relation on that
quotient, and verified unique meets and joins. D-tier contact signatures remain
office-authorizing evidence under their declared rules; this audit does not
relabel them as universal lattice operations.

## Best formal model at this stage

The evidence supports treating the structural system as a category generated
by partial arrows:

```text
FreeCategory(M, R1…R7, L1…L7) / validated path equations
```

The validated quotient relations presently include:

- `M^7 = I`;
- `Rk^-1 = Lk` on their declared partial domains;
- modal covariance of the fourteen local operators; and
- qualified local diamond equalities.

This may later admit a path-algebra or groupoid presentation, but those are
next hypotheses rather than current facts.

## Status boundary

| Claim | Current status |
|---|---|
| 15 structural generator candidates | Structurally validated |
| Local inverse laws | Structurally validated |
| Modal order seven | Structurally validated |
| Modal covariance | Structurally validated |
| State-office +2 transport under M | Structurally validated |
| Semantic feature action | Not declared |
| Court-filter compatibility | Not audited |
| Harmonic compression action | Unresolved |
| Global lattice / meet / join structure | Not proven |
| Asset-generation authorization | Not approved |

## Recommended next declaration

Promote the 15 structural operators into a versioned operator registry, while
leaving their semantic action fields null. Then author and test one semantic
vertical slice—Aeolian/Jupiter to Harmonic Minor via `R7`—against canonical
feature-profile confluence before using the operators in an asset compiler.
