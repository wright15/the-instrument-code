# Invariant Catalog

This guide summarizes active invariants and candidate consistency conditions.
`catalog/invariants.yaml` is a package-local checklist, not the authoritative
integrated-release invariant catalog.

Use `../../canonical/topology-identity-definitions.json` and the integrated
release QA ledgers for topology, the mutation audit's registry and
`../../seven-governors-mutation-algebra-audit/qa/mutation-algebra-validation.json`
for operators, and profile registry `0.1.1` schemas/validation for profiles and
packets. Candidate Fivefold and phenomenon checks in this package prove only
internal proposal consistency.

## Identity invariants

| ID | Rule | Familiar example | Failure indicates |
|---|---|---|---|
| `INV-IDENTITY-001` | Every `ScaleState.id` and rooted bit mask is unique | `1749` identifies Acoustic | Corrupt import or conflicting encoding |
| `INV-IDENTITY-002` | Every weight-seven state has seven set bits | Lydian has seven pitch classes | Malformed heptatonic state |
| `INV-OFFICE-001` | A seated state has exactly one categorical office | Harmonic Minor has Jupiter only | State/Degree Governor collapse |
| `INV-OFFICE-002` | Boundary states have no `OCCUPIES_OFFICE` | A mixed junction stays unseated | Evidence promoted without authority |
| `INV-OFFICE-003` | Relational evidence does not imply occupation | A boundary may point toward Sun | Projection semantic leak |

## Anchor invariants

| ID | Rule | Example |
|---|---|---|
| `INV-ANCHOR-001` | Each admitted anchor family contains seven rooted modes | A0 / 7-35 |
| `INV-ANCHOR-002` | Each family occupies all seven offices exactly once | Lydian through Locrian |
| `INV-ANCHOR-003` | Each anchor has one modal predecessor and successor within its ring | Aeolian's modal orbit |
| `INV-ANCHOR-004` | The ring closes after seven successors | $M^7(s)=s$ |
| `INV-ANCHOR-005` | No anchor has a valid earlier-tier claim | A1 cannot override A0 |
| `INV-ANCHOR-006` | The declared family contact signature is uniform | All D2 modes show the same type of same-office convergence |

The family-wide requirements are why an isolated convergence cannot promote a
new D tier.

## Bridge and satellite invariants

For a direct midpoint $m$:

$$
d_H(a,m)=2,\qquad d_H(m,b)=2,\qquad d_H(a,b)=4.
$$

Bridge tests run before satellite inheritance.

For a satellite:

- exactly one selected incoming `GOVERNS`;
- parent and child share the State Governor;
- relation is eligible under the tier protocol;
- incidental Hamming-2 contacts remain audit evidence; and
- chirality does not change office inheritance.

Harmonic Minor illustrates the last two points: it is chiral and can have
other structural contacts, but its selected parent is Aeolian/Jupiter.

## Phase-closure invariants

Fixed-tonic and adjacent-root relations are different channels.

- `AUDITED_HAMMING2` changes one pitch while retaining the tonic.
- `PHASE_SHIFT` moves the root seam by one semitone and renormalizes.
- every phase edge records direction/phase delta and an inverse check;
- phase evidence may reveal cross-key relations such as
  C Lydian ↔ C-sharp Locrian;
- a phase relation alone does not assign an office; and
- the same precedence rules apply when phase-inclusive evidence is eligible.

The dedicated phase ledger prevents fixed-tonic audits from silently missing
root-seam structure.

## Algebra invariants

| ID | Rule |
|---|---|
| `INV-ALG-001` | Operator application is admitted only inside its declared domain |
| `INV-ALG-002` | Structural destination agrees with the audited target mask |
| `INV-ALG-003` | Declared inverse succeeds on its supported image |
| `INV-ALG-004` | Route history is excluded from intrinsic normal-form identity |
| `INV-ALG-005` | Confluence compares normalized intrinsic outputs |
| `INV-ALG-006` | Commutation claims report the exact tested domain and counterexamples |
| `INV-ALG-007` | Semantic effects default to unresolved, not inferred from the edge label |
| `INV-ALG-008` | Musical operators never mutate physical wavelength |

## Compression invariants

There are three independent coordinates:

### Photonic compression $C_P$

Derived from representative optical wavelength with the registry's declared
local normalization. It has physical input and a conventional normalization.

### Harmonic compression $C_H$

Reserved and unresolved. Graph centrality, anchor depth, Hamming distance,
Carey coherence, and spectral features may become inputs, but none is
silently substituted for the aggregate coordinate.

### Semantic compression $C_S$

The ordered process
Emission → Reception → Activation → Transduction → Distribution → Coupling →
Fixation. Its normalized ordinal is non-metric.

The invariant is separation: a change in one coordinate cannot be reported as
a measured change in another without a separately admitted bridge.

## Candidate Fivefold consistency conditions

These conditions describe this companion's model. They are not active
integrated-release invariants or readiness checks. In
`catalog/invariants.yaml` they carry `admission: proposed` under the IDs
`INV-COURT-001`, `INV-COURT-002`, and `INV-COURT-003`.

- The Court has four binary poles in order Mars, Jupiter, Venus, Saturn.
- Mercury is the controller/ledger, not a fifth binary pole.
- Sun/Moon establish the bracket and are not Court poles.
- `C0=0000`, `C1=1000`, `C2=1100`, `C3=1110`, `C4=1111`.
- Legal ordinary moves change exactly one adjacent pole.
- Pole-flip order is Mars → Jupiter → Venus → Saturn.
- $\kappa(C_i)=i/4$.
- $d_H(C_i,C_j)=2|i-j|$ under the paired-pole mask representation.
- The full 16-state field may be analyzed, but it is not this candidate's
  declared five-position path.

## Candidate natural-phenomenon consistency conditions

These conditions are `admission: proposed` in `catalog/invariants.yaml` under
the IDs `INV-PHEN-001`, `INV-PHEN-002`, and `INV-PHEN-003`:

- exactly seven proposed primary models in the candidate registry;
- exactly one proposed primary model per office;
- each primary model is exclusive only within the framework namespace;
- physical definition and authored assignment are separately sourced;
- assumptions and nonclaims are required;
- Rayleigh scattering has Jupiter as its only proposed primary assignee;
- semantic affordances cannot be passed off as scientific predictions; and
- a physical model does not mutate office wavelength or harmonic topology.

## Compiler invariants

- destination state supplies intrinsic identity;
- State Governor resolves the canonical profile;
- Degree Governor remains route metadata;
- same destination/domain/release produces the same intrinsic fingerprint;
- provider name and database connection are excluded from the fingerprint;
- `required`, `softPriors`, `referencePool`, `promoted`, `suppressed`,
  `prohibited`, `unresolved`, and `creativeAffordances` remain distinct arrays;
- the HTTP endpoint accepts no route parameters and returns
  `routeContext: null`; and
- unresolved effects remain explicit rather than being invented by a compiler
  or renderer.

## What to do when an invariant fails

1. Stop the affected build or promotion in the owning package.
2. Identify the owning layer.
3. Preserve the failing input and query result.
4. Distinguish data corruption from a genuine counterexample.
5. Amend an authoritative audit rule or canon only through a versioned
   upstream decision; amend a candidate checklist without claiming admission.
6. Rebuild all downstream projections.

An invariant failure is useful evidence. It is not permission for a local
database edit.
