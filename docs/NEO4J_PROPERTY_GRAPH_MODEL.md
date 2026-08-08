# Neo4j Property-Graph Model

## 1. Node labels

### `ScaleState`

One node for each of the 462 rooted heptatonic states.

Identity properties include:

- `id`, `nodeId`, `bit`, `pitchSet`, and `forte`;
- `orientation` and `chirality`;
- `role`, `fineRole`, `identityCategory`, and `identityType`;
- `tier`, `office`, and `hasGovernorSeat`;
- `officeAuthority` and `anchorMechanism`;
- `relationalOffice`, `pluralityContactOffice`, and contact evidence;
- `assignmentStatus`, `resolutionClass`, and `officeBasis`.

### `ScaleFamily`

One projection node for each of the 38 Forte Tn/I classes. A family is not an
additional harmonic state.

### `GovernorOffice`

Seven projection nodes in the declared order:

```text
Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn
```

## 2. Harmonic and structural relationships

| Type | Meaning | Governing? |
|---|---|---:|
| `GOVERNS` | Selected anchor-to-satellite office inheritance | Yes |
| `CONSTRUCTS` | Direct A-series anchor construction evidence | No |
| `SEAT_CONTACT` | D-series office-authorizing evidence | No |
| `MODAL_SUCCESSOR` | Directed orbit successor | No |
| `AUDITED_HAMMING2` | Historical fixed-tonic field relation | No |
| `PHASE_SHIFT` | Adjacent-root displacement relation | No |
| `CONVERGENCE_CONTACT` | Boundary same-office contact | No |
| `JUNCTION_CONTACT` | Boundary multi-office contact | No |
| `LEAF_CONTACT` | Boundary single contact | No |

The relationship property `governing` is true only for `GOVERNS`.
Anchor construction and seat evidence authorize offices through declared
family rules, not through recursive edge inheritance.

## 3. Projection relationships

| Type | Meaning |
|---|---|
| `BELONGS_TO_FAMILY` | Scale-state membership in one Forte family |
| `OCCUPIES_OFFICE` | One categorical Governor seat |
| `RELATIONAL_OFFICE_EVIDENCE` | Aggregated non-categorical office evidence |

Every scale has exactly one `BELONGS_TO_FAMILY`.

Every office-bearing scale has exactly one `OCCUPIES_OFFICE`.

Every boundary state has zero `OCCUPIES_OFFICE` relationships and one or more
`RELATIONAL_OFFICE_EVIDENCE` relationships derived from its contact vector.

## 4. Relational-office evidence

The evidence projection records:

- `count`: number of underlying contacts supporting that office;
- `evidenceRole`: convergence, junction, or leaf;
- `unanimous`: whether no other office appears in the vector;
- `plurality`: whether the office is the vector's largest component;
- `categorical = false`;
- `contactTierCountsJson`; and
- provenance.

Examples:

- an oriented 7-Z36 state with `{Venus: 2}` receives one evidence
  relationship to Venus with `unanimous = true`;
- a junction with `{Mercury: 3, Saturn: 2}` receives evidence relationships to
  both offices, with Mercury marked `plurality = true`;
- a 7-5 leaf with `{Mercury: 1}` receives one evidence relationship with
  `count = 1`, but no office seat.

## 5. Import files

`neo4j/csv/` contains:

- three node tables;
- one master relationship table;
- one typed CSV per relationship type; and
- the identity ledger used for independent inspection.

Run:

```text
neo4j/schema.cypher
neo4j/import.cypher
neo4j/validation.cypher
```

The importer uses only standard Cypher and `LOAD CSV`; APOC is not required.

## 6. Expected projection counts

| Projection | Count |
|---|---:|
| `ScaleState` | 462 |
| `ScaleFamily` | 38 |
| `GovernorOffice` | 7 |
| Canonical harmonic/evidence relationships | 1,824 |
| `BELONGS_TO_FAMILY` | 462 |
| `OCCUPIES_OFFICE` | 308 |
| Canonical relationships including projections | 2,594 |
| Derived `RELATIONAL_OFFICE_EVIDENCE` | 224 |
| Neo4j relationships in this projection | 2,818 |

The final 224 relationships are a query convenience derived from the canonical
boundary contact vectors. They do not add new harmonic claims.
