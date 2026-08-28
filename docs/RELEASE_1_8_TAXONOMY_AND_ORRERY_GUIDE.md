# Release 1.8.0 Taxonomy and Orrery Guide

## Status and purpose

This is an explanatory guide for release `seven-governors-integrated-1.8.0`.
It describes the canonical heptatonic taxonomy, the evidence added or
revalidated by the release, and the current relationship between that material
and the Harmonic Orrery. It does not itself assign offices, admit a new
coordinate, change topology, or authorize a renderer to infer canonical facts.

For authoritative topology, use
[`TOPOLOGY_IDENTITY_AND_INVARIANTS.md`](TOPOLOGY_IDENTITY_AND_INVARIANTS.md),
the canonical ledger, and canonical network data. For release status, use
`provenance/release.json` and the integrated validation receipt.

## Executive view

Release 1.8.0 makes the project more reproducible and more explicit about the
meaning of A-tier evidence. It does not redraw the canonical topology or
promote planning evidence into runtime authority.

- GOV-213 adds an executable exact-rational max-margin certificate for the
  existing 21 A0-A2 anchor descriptors.
- GOV-2XX adds a source-derived photonic sidecar for A1/A2 anchors only.
- Shadow-ladder evidence makes A1/A2 fifth-window cores, holes, seams, and the
  no-A3 termination result inspectable while remaining `planning_evidence`.
- GOV-227 D-tier artifacts were regenerated because their A-tier source pin
  changed; D-tier records, `Q`, `W`, and tier summaries did not change.
- The release adds deterministic manifest checks and release gates for the
  Orrery catalog, tiered photonics, and shadow-ladder validation.

The Harmonic Orrery is therefore current as a guarded A-series explorer, but
it is not yet a complete visual explorer for all 462 states or every 1.8.0
sidecar. That separation is deliberate: a frontend may present canonical and
evidence data, but it must not manufacture topology, Court behavior, or
admission authority.

## Canonical taxonomy at a glance

The rooted heptatonic universe contains exactly 462 seven-note states. Every
state has exactly one primary role.

| Primary role | State count | Meaning |
|---|---:|---|
| A-series anchor | 21 | Direct achiral anchor strata: A0, A1, A2 |
| D-series anchor | 49 | Declared second-order anchor strata: D1 through D7 |
| Direct satellite | 238 | Office-bearing state inheriting from one selected parent |
| Typed boundary | 154 | Valid state without a currently authorized categorical office |
| Total | 462 | Complete rooted seven-note state universe |

There are 38 Forte Tn/I families. Ten achiral seven-mode families supply the
70 anchors. The other 28 chiral families supply 392 states, partitioned into
satellites and boundaries. An accepted anchor tier always has seven modes: one
per Governor office, linked by a closed modal-successor orbit.

### Identity dimensions

| Dimension | Meaning |
|---|---|
| Rooted state | A normalized seven-note pitch-class mask with pitch class 0 present |
| Forte family | The Tn/I family, not a separate state or office assignment |
| Chirality and orientation | Family geometry retained independently of role and office |
| Primary role | Exactly one of `anchor`, `satellite`, or `boundary` |
| Tier | A0-A2 or D1-D7 for anchors; inherited tier for satellites; `null` for boundaries |
| Categorical office | Authorized State Governor membership for anchors and satellites only |
| Degree Governor | Degree address on a relation; never the categorical office of its target |

The State Governor office and Degree Governor must remain separate. For
example, an altered Moon-governed degree can produce a state that remains in
the Jupiter office. A relation's degree label is not an office assignment.

## The ten anchor tiers

Each tier has seven anchors and one anchor in every Governor office.

| Tier | Anchor family | Office-authorizing mechanism | Direct satellite families | Satellite states |
|---|---|---|---|---:|
| A0 | `7-35` | Canonical Governor identity | `7-29`, `7-30`, `7-32` | 42 |
| A1 | `7-34` | Declared exact midpoint construction from A0 | `7-27`, `7-31` | 28 |
| A2 | `7-33` | Declared exact midpoint construction from A1 | `7-24`, `7-26`, `7-28` | 42 |
| D1 | `7-22` | Four A0-satellite contacts split 2+2 across diagonal offices | `7-20` | 14 |
| D2 | `7-15` | Two same-office A0-satellite contacts | `7-7`, `7-Z38` | 28 |
| D3 | `7-Z37` | Two A2-satellite and two D2-satellite contacts at one office | `7-11` | 14 |
| D4 | `7-Z17` | Two same-office A1-satellite contacts | `7-13`, `7-16` | 28 |
| D5 | `7-Z12` | Two same-office A2-satellite contacts | `7-6`, `7-10` | 28 |
| D6 | `7-8` | Two D3-satellite and two D5-satellite contacts at one office | `7-2` | 14 |
| D7 | `7-1` | Two same-office D6 contacts, one from each `7-2` orientation, plus terminality | none | 0 |

The satellite counts include both chiral orientations where a family has two
seven-mode orbits.

### A-series: direct achiral anchor strata

The A series is the direct precedence chain:

```text
A0 (7-35) -> A1 (7-34) -> A2 (7-33)
```

A0 establishes the canonical Governor frame. A1 and A2 use declared exact
fixed-tonic midpoint construction. For midpoint `m` and endpoints `a`, `b`:

```text
dH(m, a) = 2
dH(m, b) = 2
dH(a, b) = 4
```

An A-series state is an anchor because its office is established by canonical
identity or direct midpoint geometry, not because a score, scene position, or
visual proximity suggests an office.

### D-series: declared second-order anchor strata

The D series is outside the direct A0-A2 construction chain. A D-tier office
is authorized by a declared, family-wide contact signature mediated through
already seated states.

A D-tier family must satisfy all normal anchor requirements plus:

1. no eligible direct A0, A1, or A2 anchor claim;
2. the declared number and source tiers of its seat contacts;
3. one uniform contact signature over all seven modes;
4. deterministic office resolution from that signature;
5. fixed-tonic and root-phase closure where required;
6. the tier's declared symmetry or orientation condition; and
7. explicit admission as a new protocol tier.

D1 uses a cross-office diagonal signature. D2 through D7 use same-office
convergence forms. Convergence alone is not enough to create a D anchor.

D7 is the strictest example. Its two D6 contacts must agree on office, arrive
from the two `7-2` chiral orientations, cover all seven offices exactly once,
close correctly, avoid an earlier tier claim, and have no eligible residual
child. This is why `7-1` is a terminal D7 anchor rather than merely a state
with two agreeing contacts.

### Tier order is not a numeric ranking

The canonical precedence is:

```text
A0 -> A1 -> A2 -> D1 -> D2 -> D3 -> D4 -> D5 -> D6 -> D7
```

This order is a topological and protocol order. It cannot be replaced by
sorting a harmonic score, a Forte family, an interval vector, a wavelength, or
a visual coordinate.

The GOV-227 audit demonstrates this explicitly: D2 and D5 share a `q_v2`
multiset, D3 and D4 share an interval vector, and the fixed score bands
interleave. Tested hierarchy-conforming linear scalar models cannot separate
the full declared tier order. Topology, construction, contact, closure,
symmetry, and precedence remain the authority.

## Satellites, boundaries, and relation evidence

### Satellites

A satellite is office-bearing but does not define an anchor seat. It must have
one selected eligible incoming `GOVERNS` relation. Its office matches the
parent's office, while its own family, chirality, orientation, and degree
mutation remain distinct.

Satellite evidence may later support a D-tier audit, but that evidence is a
non-governing `SEAT_CONTACT`. It does not create a second governing parent or
recursively propagate office membership.

### Boundaries

A boundary is a valid rooted state for which no declared rule authorizes a
categorical office after the full precedence sequence has run.

| Boundary type | State count | Meaning |
|---|---:|---|
| Oriented convergence | 84 | Contacts agree relationally, but chiral orientation is unresolved |
| Mixed-office junction | 56 | Contacts point to several offices; a plurality is recorded but not promoted |
| Peripheral leaf | 14 | One office-bearing contact is insufficient for office inheritance |

A boundary has `role=boundary`, `tier=null`, and `office=null`. It may retain
relational-office evidence, but never a categorical `OCCUPIES_OFFICE` relation.
Boundary means "outside the current office-assignment algebra," not invalid,
disconnected, or musically irrelevant.

### Important relation distinctions

| Relation or evidence | Purpose | Must not be confused with |
|---|---|---|
| `MODAL_SUCCESSOR` | Closes an anchor's seven-mode office orbit | Generic graph adjacency |
| `CONSTRUCTS` | Records direct A-series midpoint provenance | Satellite inheritance |
| `GOVERNS` | One selected parent for a satellite | Every audit contact |
| `SEAT_CONTACT` | Non-governing evidence used by D-tier qualification | An office assignment by itself |
| Fixed-tonic relation | Compares masks at a common tonic | Root-phase movement |
| Root-phase relation | Shifts root by plus or minus one, then normalizes | Fixed-tonic Hamming relation |
| Relational-office evidence | Describes contact patterns without a seat | Categorical office membership |

The canonical network records 238 governing edges, 28 construction edges,
140 D-seat-contact edges, and 182 modal-successor edges. Boundary contacts and
audit relations are retained separately so explanatory evidence is not mistaken
for authority.

## What release 1.8.0 made clearer

### GOV-213: A-tier triadic compression certificate

`CH_A012_q_v1` remains scoped to the 21 A0-A2 anchors. It derives:

- `Q(S)`: a seven-position, degree-sensitive triadic compression signature;
- `W_A012(S)`: a positive normalized weighted projection of `Q(S)`; and
- a finite Governor-seat consistency result at the Chaldean degree associated
  with each already resolved State Governor office.

Release 1.8.0 adds an executable exact-rational Theorem 3 prime certificate.
Under the stated 111 constraints and the authored Chaldean weight hierarchy,
the maximum feasible separation margin is `3/407`, achieved by the unique
optimum:

```text
w* = (116, 56, 41, 35, 77, 44, 38) / 407
```

This makes the A-tier score more reproducible and tamper-resistant. It does
not turn `W_A012` into a tier classifier, office classifier, physical quantity,
or global `harmonic.C_H` value. The current theorem remains bounded to the 21
selected A anchors.

### GOV-2XX: tiered photonic sidecar

`CH_TIERED_v1` adds 28 records for the 14 A1/A2 anchors: two records per anchor
for `sum_mixing` and `geometric_mean` variants.

- A0 wavelengths remain source inputs rather than newly derived identities.
- The method derives values from office-ring adjacency and construction
  provenance.
- Numeric bands, parent identities, and construction edges are auditable.
- `harmonic.C_H` remains unresolved with `value=null`.
- The sidecar makes no physical-causation, physical-law, or tier-classification
  claim.

This is a clearer informational view of A1/A2 structure. It does not modify an
anchor, office, topology edge, or the global harmonic namespace.

### Shadow ladder: source-derived planning evidence

`SHADOW_LADDER_v0` makes the following A1/A2 observations inspectable:

- A1 cores are five-note intersections of neighboring A0 fifth windows.
- A2 cores are parent-arc intersections with one internal hole punched from
  each side.
- Phase seams are explicit and march inward across tiers.
- Mercury mask `681` is corrected to fifth arc `[9,3]` with punched holes
  `{10,2}`.
- The audited A2 relation census has no constructible A3 continuation.

This artifact remains `planning_evidence`. It emits no `court.*` authority,
does not alter topology, and does not create runtime behavior or legal moves.

### GOV-227: D-tier descriptor closure

The D-tier candidate `CH_D17_q_v2` was regenerated because its byte-pinned
A-tier source changed. The release documents that its 49 D records, `Q`, `W`,
and tier summaries are unchanged.

`q_v2` establishes a finite 70-anchor Governor-seat invariant across A0-D7,
but this remains a consistency check of existing seats. It cannot infer an
office, rewrite topology, or impose a scalar order on all ten tiers. Its Neo4j
data integration remains prohibited.

### Reproducibility and release closure

The release adds deterministic manifest generation and non-writing fixed-point
checks. The integrated receipt records 414 passing checks, including:

- manifest fixed point;
- Orrery legal-move catalog freshness;
- GOV-213 certificate validation;
- GOV-2XX tiered-photonic validation;
- GOV-227 D-tier validation; and
- source-derived shadow-ladder validation.

## What remains open or needs deeper evidence

| Area | Current boundary or open work |
|---|---|
| Satellite and boundary descriptors | GOV-213 and GOV-227 do not extend their compression theorems to the 238 satellites or 154 boundaries |
| D-tier photonics | GOV-2XX intentionally covers only A1/A2 anchors |
| A3 and later structure | No constructible A3 is evidenced; that is not a new tier or a complete general negative theory |
| OBS-014 | Twin-hub convergence remains queued and untested |
| `shadow.*` authority | Whether it can ever be admitted is a policy decision, not an audit result |
| q_v2 successor design | Known domain cracks require a future versioned design rather than in-place expansion |
| Cross-coordinate claims | No equivalence is established among `C_P`, `C_H`, `C_S`, `kappa_court`, or physical quantities |
| Global aggregate | `harmonic.C_H` remains unresolved and null |
| Live Neo4j parity | The retained full-database baseline is release 1.5.0 and must be refreshed before claiming 1.8.0 live parity |

## Current Orrery position

### What the Orrery does reflect

The current Orrery is a strict, read-only A-series application.

| Area | Current support |
|---|---|
| A0-A2 anchors | Yes: exactly 21 nodes, seven per A tier |
| GOV-213 descriptor identity and catalog pin | API requires `CH_A012_q_v1`; the generated catalog pins its artifact fingerprint |
| `W_A012` projection | Yes: exposed for selected A anchors |
| Release catalog freshness | Yes: enforced by release validation |
| Topology mutation or Court writes | No: intentionally forbidden |

The `harmonic-orrery.nodes.v2` contract accepts only A0, A1, and A2 anchors.
It requires exactly 21 nodes and validates the GOV-213 candidate identity,
release identity, status, and fingerprint shape. The bundled legal-move catalog
then compares its pinned descriptor fingerprint with the response. A mismatch
disables legal moves and reports a "Legal moves are unavailable" notice while
allowing inspection and rendering of an otherwise valid response.

### What the Orrery does not yet reflect

| Release or taxonomy area | Current support |
|---|---|
| GOV-213 exact certificate and full `Q(S)` | Not exposed in the UI |
| GOV-2XX A1/A2 photonic variants, bands, and provenance | Not integrated |
| GOV-227 D1-D7 anchors and `W_D17` | Not integrated |
| Satellites and boundaries | Not integrated |
| Full 462-state taxonomy | Not integrated |
| Shadow-ladder cores, holes, seams, and termination evidence | Not integrated |

The Orrery's existing wavelength and lighting treatment must not be confused
with GOV-2XX. Scene lighting uses the older representative `PhotonicRecord`
wavelength as a bounded presentation input. The inspector displays the legacy
`photonicCompression` (`C_P`) value, but the scene renderer does not use it.
The scene renderer does not currently consume tiered-photonic derived
wavelengths, energies, variants, bands, or construction provenance. Default
heptatonic audio voices the selected anchor's own pitch classes; Court-pentatonic
audio instead filters the office A0 palette through the selected Court mask.
Intra-node progression builds chords from the selected anchor's pitch classes
before Court filtering. No audio mode is derived from `W_A012`, tiered
photonics, or `harmonic.C_H`.

### Catalog and documentation state

The generated catalog is fresh and binds the current GOV-213 fingerprint. Its
legal moves are unchanged by the certificate addition. The current catalog
contains 60 parallel R/L moves, while portions of `orrery/README.md` and the
release checklist still describe the historical 21-modal-Move MVP. That is a
documentation reconciliation task, not evidence that the current catalog is
stale.

## Recommended Orrery evolution

The existing A-series Orrery should remain stable while new scope is added in
separate versioned layers.

1. Reconcile the Orrery README and release checklist with the current R/L
   catalog and 1.8.0 release identity.
2. Add an A-series evidence inspector that shows `Q(S)`, exact `W_A012`,
   certificate status, and explicit non-classifier/non-physical boundaries.
3. Add an optional A1/A2 photonic overlay that distinguishes GOV-2XX values
   from the existing representative wavelength and lets users inspect variant,
   band, parents, and construction provenance.
4. Create a separate, versioned taxonomy-explorer contract for D anchors,
   satellites, and boundaries instead of expanding `nodes.v2` ad hoc. D-seat
   contacts must remain evidence, not automatically offered legal moves.
5. Present shadow-ladder material only as visibly labeled planning evidence.
   It must not generate Court actions, mutate topology, or expand move
   availability.
6. Refresh the live Neo4j baseline before claiming that the deployed read
   projection has complete 1.8.0 parity.

This sequence preserves the one-way authority model: canonical data and
admitted sidecars may inform the Orrery, but the Orrery never becomes the
source of topology, tier identity, Court authority, or global harmonic claims.

## Source map

| Topic | Primary source |
|---|---|
| Canonical role, tier, office, satellite, and boundary rules | `docs/TOPOLOGY_IDENTITY_AND_INVARIANTS.md` |
| A-tier descriptor and certificate | `docs/A_TIER_TRIADIC_COMPRESSION_THEOREM.md` |
| D-tier descriptor and scalar-order boundary | `docs/D_TIER_TRIADIC_COMPRESSION_THEOREM.md` |
| A1/A2 photonic derivation | `docs/TIERED_PHOTONIC_THEOREM.md` |
| Shadow-ladder planning evidence | `docs/verification/SHADOW_LADDER_THEOREM.md` |
| Deferred work | `provenance/NEXT_STEPS.md` |
| Release identity and sidecar pins | `provenance/release.json` |
| Integrated release receipt | `qa/integrated-release-validation.json` |
| Orrery read contract | `orrery/src/types.ts` and `orrery/src/api.ts` |
| Orrery rendering inputs | `orrery/src/scene-composer.ts` |
