# Seven Governors Topology Identity and Invariants

## 1. Purpose

This document defines the properties that make a rooted heptatonic state an
anchor, satellite, convergence, junction, leaf, or boundary state. These are
identity rules, not visual labels. A renderer may display the identities, but
it may not create them.

The classification universe contains exactly 462 rooted seven-note states:

| Role | States |
|---|---:|
| A-series anchors | 21 |
| D-series anchors | 49 |
| Direct satellites | 238 |
| Typed boundary states | 154 |
| **Total** | **462** |

Every scale state has exactly one primary role: `anchor`, `satellite`, or
`boundary`. An anchor additionally belongs to the A or D category.

## 2. Governor-seat vocabulary

### Categorical Governor office

A categorical office is an authorized state identity. It is represented by:

- a non-null `office` value on the scale state; and
- exactly one `OCCUPIES_OFFICE` relationship to a `GovernorOffice`.

All 70 anchors and all 238 satellites have categorical offices. None of the
154 boundary states does.

### Relational-office evidence

Relational-office evidence records how a state is positioned relative to
already seated states without asserting that the state occupies that office.
It consists of:

- `relationalOffice`, when all qualifying contacts agree;
- `pluralityContactOffice`, when a mixed vector has a largest component;
- `contactOfficeCounts`;
- `contactTierCounts`;
- `contactCount`; and
- the underlying typed contact relationships.

In Neo4j, this evidence is also projected as
`RELATIONAL_OFFICE_EVIDENCE`. That relationship is explicitly
`categorical = false` and can coexist only with the absence of
`OCCUPIES_OFFICE` for a boundary state.

> Relational similarity, attraction, plurality, or convergence toward an
> office is not categorical membership in that office.

### Degree Governor

The Degree Governor labels the altered scale-degree address on a relationship.
It does not assign the State Governor of the destination.

Example: Aeolian is a Jupiter state. Raising its Moon-governed Degree 7
produces Harmonic Minor, which remains an alternate Jupiter state.

## 3. Anchor identity

An anchor is an office-bearing member of an accepted seven-mode family that
defines a tier seat rather than inheriting it from one selected parent.

Every accepted anchor family must satisfy:

1. seven distinct rooted modes;
2. exactly one anchor in each Governor office;
3. one incoming and one outgoing anchor `MODAL_SUCCESSOR` per mode;
4. closure after seven successors;
5. the established `+2 mod 7` Governor permutation;
6. no valid earlier-tier claim;
7. an explicitly declared office-authorizing mechanism; and
8. a passing family-level audit.

### A category: direct achiral anchor strata

The A category contains orientation-free, office-defining achiral frames in
the direct precedence chain:

| Tier | Family | Identity mechanism |
|---|---|---|
| A0 | 7-35 | Canonical Governor identity |
| A1 | 7-34 | Declared exact midpoint construction from A0 |
| A2 | 7-33 | Declared exact midpoint construction from A1 |

An A-series state is therefore an anchor because its office is established by
canonical identity or direct midpoint geometry in the achiral precedence
chain.

For a fixed-tonic midpoint `m` between endpoints `a` and `b`:

```text
dH(m,a) = 2
dH(m,b) = 2
dH(a,b) = 4
```

Familiar fixtures:

- Acoustic / 7-34 is the A1 Moon anchor between Lydian/Sun and
  Mixolydian/Mars.
- Lydian Minor / 7-33 is the A2 Mars anchor between Acoustic/Moon and
  Mixolydian flat 6/Mercury.

The framework tests bridge construction before direct-satellite inheritance.

### D category: declared second-order anchor strata

The D category contains anchor rings outside the direct A0-A2 construction
chain. Their offices are established by a declared, family-wide contact
signature mediated through states that already have categorical offices.

A D-series state must satisfy all general anchor invariants plus:

1. no eligible direct A0, A1, or A2 anchor claim;
2. the tier's declared number and source tiers of seat contacts;
3. a uniform contact signature across all seven modes;
4. a deterministic office result from that signature;
5. fixed-tonic and root-phase closure where required;
6. the tier's declared symmetry, partner, or orientation condition; and
7. explicit admission as a new protocol tier.

The D-series signatures are:

| Tier | Anchor family | Office-authorizing contact signature | Satellites |
|---|---|---|---|
| D1 | 7-22 | Four A0-satellite contacts split `2+2` across offices `g-2` and `g+2`; diagonal office is declared by modular position | 14 of 7-20 |
| D2 | 7-15 | Two same-office A0-satellite contacts | 28 of 7-7 and 7-Z38 |
| D3 | 7-Z37 | Four same-office contacts: two A2 satellites and two D2 satellites | 14 of 7-11 |
| D4 | 7-Z17 | Two same-office A1-satellite contacts | 28 of 7-13 and 7-16 |
| D5 | 7-Z12 | Two same-office A2-satellite contacts | 28 of 7-6 and 7-10 |
| D6 | 7-8 | Four same-office contacts: two D3 satellites and two D5 satellites | 14 of 7-2 |
| D7 | 7-1 | Two same-office D6/7-2 contacts, one from each chiral orientation, plus no residual children | None |

`D` therefore denotes a separately declared second-order/derived anchor
series, not merely "a state with convergence." D1 uses a cross-office diagonal
signature, while D2-D7 use forms of same-office convergence.

### Why D7 is D7

The 7-1 family is not D7 merely because two contacts converge on one office.
It qualifies because:

1. 7-1 is an achiral seven-mode orbit;
2. every mode has exactly two D6/7-2 contacts;
3. both contacts agree on the same office;
4. one contact comes from 7-2 orientation A and one from orientation B;
5. all seven offices occur exactly once;
6. fixed and phase seams close correctly;
7. no earlier tier claims a mode; and
8. no eligible residual child remains.

Convergence supplies the office evidence. Orbit completeness, orientation
resolution, precedence, and terminality authorize the D7 identity.

## 4. Satellite identity

A direct satellite is an office-bearing state whose office is inherited from
one selected governing parent.

Necessary properties:

1. it is not an anchor at the current or any earlier tier;
2. bridge construction has already been tested and rejected;
3. it has exactly one selected incoming `GOVERNS` relationship;
4. that relationship is an eligible fixed-tonic or root-phase relation;
5. the parent and satellite have the same categorical office;
6. the satellite records the parent's tier;
7. incidental audit contacts do not become additional parents; and
8. chirality and orientation remain independent properties.

Harmonic Minor is the familiar example. It is a 7-32 chiral state, but its
unique selected A0 parent is Aeolian. It therefore inherits Jupiter while
retaining its own family, handedness, and Moon-degree mutation.

A satellite can later provide evidence in a D-tier audit, but that use is
explicitly represented by a non-governing `SEAT_CONTACT`. Satellite status
alone does not authorize recursive office propagation.

## 5. Convergence identity

Convergence is first a relationship pattern, not automatically a node role.
It occurs when two or more independent contacts from already seated states
agree on one office.

Convergence can lead to two different outcomes:

### Promoted convergence anchor

The state belongs to a complete, office-complete family whose chirality or
orientation has been resolved by a declared tier rule. The family passes every
anchor invariant and receives a D-tier categorical office.

Example: a D7/7-1 mode receives two agreeing D6 contacts from the two 7-2
orientations and passes the terminal family proof.

### Oriented convergence boundary

The contact evidence is strong and unanimous, but the family remains chiral
and orientation-dependent. Without a declared orientation-resolution
operator, the contact office is stored only as `relationalOffice`.

Example: a 7-Z36 state may converge relationally on Venus while remaining
categorically office-neutral.

Thus:

```text
convergence evidence
    + complete orbit
    + deterministic family rule
    + resolved orientation
    + precedence clearance
    = possible D-anchor promotion
```

Convergence evidence without those additional proofs remains boundary
evidence.

## 6. Boundary identity

A boundary state is a valid rooted heptatonic state for which no currently
declared rule authorizes a categorical office after the complete precedence
sequence has run.

A boundary state therefore has:

- `role = boundary`;
- `tier = null`;
- `office = null`;
- no `OCCUPIES_OFFICE`;
- no selected governing parent;
- one typed boundary classification; and
- zero or more non-governing relational contacts.

Boundary does not mean disconnected, defective, or musically irrelevant. It
means that the state lies outside the current office-assignment algebra.

### Oriented convergence ring

Properties:

- chiral family with two retained orientations;
- at least two independent same-office contacts per state;
- each orientation traverses all seven relational offices;
- `relationalOffice` is recorded;
- categorical office remains withheld.

Families: 7-Z36, 7-23, 7-Z18, 7-9, 7-4, and 7-3.

### Mixed-office junction

Properties:

- contacts resolve to at least two different offices;
- the office-count vector is stable and recorded;
- a plurality office may be recorded;
- no declared operator converts the vector into one categorical seat.

Families: 7-25, 7-21, 7-19, and 7-14.

### Peripheral leaf

Properties:

- exactly one established office-bearing contact;
- the contact and its office are recorded;
- one contact is insufficient for recursive office inheritance.

Family: 7-5.

## 7. Decision procedure

For every unresolved state or candidate family:

1. validate state identity and rooted representation;
2. apply tier precedence;
3. evaluate fixed-tonic relations;
4. evaluate root-phase relations separately;
5. test declared A-series midpoint construction;
6. test direct-satellite inheritance;
7. test the next declared D-series family signature;
8. verify complete orbit, office permutation, and chirality conditions;
9. if no office-authorizing rule passes, assign a typed boundary role; and
10. record all relational-office evidence without converting it into a seat.

## 8. Global invariants

Every release must preserve:

- 462 unique rooted seven-note masks;
- agreement among ID, bitmask, and pitch set;
- unique relationship IDs and valid endpoints;
- fixed-tonic Hamming-2 relations;
- reproducible directed `phaseDelta = -1` or `+1` operations, or an explicitly
  stored undirected inverse pair `[-1,+1]` in the historical field;
- separate fixed and root-phase channels;
- A0 before A1 before A2 before D1 through D7;
- no overwrite of an earlier valid role or office;
- seven-state closure for every accepted anchor orbit;
- exactly one anchor mode per Governor office per tier;
- exactly one selected governing parent per satellite;
- no categorical office for a boundary state;
- non-governing boundary contacts;
- preserved chiral orientations; and
- presentation derived from semantics, never semantics inferred from position.
