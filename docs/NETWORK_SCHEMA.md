# Universal Network Schema

The canonical machine-readable object is:

`data/seven-governors-a0-a2-d1-d7-universal-network-data.json`

## Core registries

| Key | Meaning |
|---|---|
| `nodes` | Scale nodes plus family and office projection nodes |
| `universalLedgerRows` | Exactly one row for each of the 462 rooted states |
| `familyRegistry` | The 38 Forte-class summaries |
| `orientationRegistry` | The 66 seven-mode orientation orbits |
| `governorRows` | Office registry through D6 |
| `d7AnchorRows` | Seven validated 7-1 / D7 office rows |
| `d7SeatContactRows` | Fourteen D6-to-D7 evidentiary contacts |
| `boundaryFamilyAuditRows` | Eleven typed chiral-family summaries |
| `boundaryRelationRows` | 476 non-governing boundary contacts |
| `structuralEdges` | Governing, construction, seat-contact, and modal edges |
| `fieldEdges` | Historical fixed/phase audit field |
| `summary` | Reconciled network counts |
| `validation` | Build-time invariant booleans |

## Universal ledger fields

| Field | Meaning |
|---|---|
| `id` | Rooted twelve-bit scale integer |
| `bit` | Forward pitch-class occupancy string |
| `bitReverse` | Reversed occupancy string |
| `forte` | Forte Tn/I set class |
| `orientation` | Modal-orientation orbit label |
| `chirality` | `achiral` or `chiral` |
| `role` | `anchor`, `satellite`, or `boundary` |
| `fineRole` | Tier-specific or boundary-specific refinement |
| `tier` | Governor tier when office-bearing |
| `office` | Categorical Governor office; null for boundary states |
| `universalClassification` | Terminal anchor, office network, or typed boundary role |
| `relationalOffice` | Office implied by contact geometry; not an assignment |
| `pluralityContactOffice` | Plurality office for mixed-office evidence |
| `registeredBeforeCompletion` | Present in the frozen 399-state source |
| `addedByCompletion` | Added by the universal enumeration |

## Edge interpretation

`governing: true` means the edge participates in categorical office inheritance.
Seat contacts, convergence contacts, phase evidence, and most audit edges are
non-governing even when their endpoints carry offices.

`mode` distinguishes:

- `single_degree` — fixed-tonic Hamming-2 mutation;
- `root_phase` — adjacent-root displacement and renormalization.

`phaseDelta` is `0`, `-1`, or `+1`.

## Boundary invariants

For all 154 typed boundary rows:

- `role = "boundary"`;
- `office = null`;
- `relationalOffice` may be populated;
- boundary contacts must have `governing = false`.

This separation prevents relational evidence from silently becoming a Governor
assignment.

## Neo4j projection

The normalized Neo4j projection and its additional identity properties are
defined in `NEO4J_PROPERTY_GRAPH_MODEL.md`.

The projection adds one derived relationship type:

- `RELATIONAL_OFFICE_EVIDENCE` aggregates a boundary state's canonical contact
  vector by Governor office.

It is always non-governing and non-categorical. It never substitutes for
`OCCUPIES_OFFICE`.
