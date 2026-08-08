# ARCH-SPEC — Bestiary of Archetypes

Blueprint for a data-driven visual web portal over the Seven Governors
integrated release (`seven-governors-integrated-1.1.0`). Every page is
generated from a single strict JSON artifact (`bestiary-data.json`) produced
by the release build pipeline. No web page is hand-authored beyond the
component layer; no entity is described twice.

---

## 1. Purpose and position in the release

### 1.1 What it is

An interactive "Bestiary of Archetypes": every node, family, office, profile,
operator, and modal cycle of the composite system becomes a **character card**
with stats, identity, algebraic laws, relationships, and live visualizers.
Two views:

1. **Archetype Detail View** — one dedicated page per archetype (identity
   header, pitch-set dial, topology node graph, laws, narrative).
2. **Multi-Dimensional Index** — the dashboard: search, multi-facet filter,
   side-by-side comparison, and a structural scatterplot.

### 1.2 Position

The bestiary is a **derived presentation layer**, exactly like the interactive
graph (`graph/`): it may project authoritative facts, never invent them. It
sits one step downstream of the mutation algebra audit, the canonical feature
profile registry, and the companion toolkit catalogs.

```text
canonical/universal-network-data.json ─┐
canonical/topology-identity-definitions.json ─┤
seven-governors-mutation-algebra-audit/audit/*.csv ─┼─► scripts/build-bestiary.mjs
seven-governors-canonical-feature-profile-registry-v0.1.1/canonical/*.json ─┤      │
seven-governors-canonical-feature-profile-registry-v0.1.1/schemas/*.schema.json ─┘    ▼
                                                             bestiary/data/bestiary-data.json
                                                                      │
                                                                      ▼
                                              bestiary/site (Astro + Tailwind v4)
                                                                      │
                                                                      ▼
                                              bestiary/site/dist/ (self-contained, offline)
```

### 1.3 Determinism policy

`bestiary-data.json` is a **deterministic artifact**:

- Object keys are emitted in sorted order at every nesting level.
- No timestamps inside the data payload. The build envelope's `generatedAt`
  is stripped for parity comparisons (same convention as the toolkit's
  `build-catalogs.mjs`).
- Arrays are sorted by a stable natural key (numeric ids numerically,
  strings lexicographically).
- The builder supports two modes:
  - `--emit`: write `bestiary/data/bestiary-data.json` (and nothing else).
  - no-arg: build into memory and exit `0` if byte-identical to the file on
    disk, `1` otherwise. This is the freshness check used by
    `validate-release.mjs`.

### 1.4 Scope of entities

| Category | kind | count | Source |
|---|---|---|---|
| Scale states | `scaleState` | 462 | `canonical/universal-network-data.json` → `nodes[]` |
| Scale families | `scaleFamily` | 38 | same file → `familyRegistry` |
| Governor offices | `governorOffice` | 7 | same file → `officeOrder` + registry profiles |
| Canonical profiles | `canonicalProfile` | 7 | registry `canonical/canonical-governor-profiles.json` |
| Mutation operators | `mutationOperator` | 15 | audit `audit/operator-registry.csv` |
| Modal cycles | `modalCycle` | 66 | audit `audit/cycle-identities.csv` |
| Candidate extensions | `candidateExtension` | 0–n | toolkit candidate schemas, `admission: "proposed"` |
| **Total archetypes** | | **595** (+ candidates) | |

---

## 2. Strict JSON schema — `bestiary-data.schema.json`

JSON Schema **draft 2020-12** (house standard; `ajv` is already a dependency
of the profile registry and becomes a root devDependency for validation).

### 2.1 Envelope

```jsonc
{
  "schemaVersion": "1.0.0",                       // bestiary schema version, const
  "releaseId": "seven-governors-integrated-1.1.0",// from provenance/release.json
  "build": {
    "tool": "build-bestiary.mjs",                 // const
    "toolVersion": "1.0.0"                        // const
  },
  "sources": [                                    // provenance pins, min 5
    { "path": "canonical/universal-network-data.json", "sha256": "<hex>" },
    // one entry per authoritative input file; sha256 recomputed at build time
  ],
  "summary": {
    "archetypeCount": 595,                        // int, = sum of byCategory
    "byCategory": { "scaleState": 462, "scaleFamily": 38, "governorOffice": 7,
                    "canonicalProfile": 7, "mutationOperator": 15,
                    "modalCycle": 66, "candidateExtension": 0 }
  },
  "archetypes": [ /* §2.2 discriminated union, min 595 */ ],
  "relationships": [ /* §2.3, min 0 */ ],
  "commutationPairs": [ /* §2.4, exactly 91 */ ],
  "projectionGaps": [ /* §2.5, exactly 15 */ ]
}
```

Rules:

- `releaseId` must equal the value in `provenance/release.json`.
- `sources[].sha256` is verified by the release validator against the live
  files (the same hash function as `scripts/validate-release.mjs`).
- No additional top-level keys are permitted (`additionalProperties: false`
  everywhere).

### 2.2 Archetype discriminated union

Every archetype object carries the cross-cutting fields, then a `oneOf`
branch selected by `kind`. **No field is ever omitted; missing data is
explicit `null`** (§3.1).

Cross-cutting (present on every archetype):

| Field | Type | Notes |
|---|---|---|
| `kind` | enum §2.2.1–2.2.7 | discriminator |
| `id` | string | stable canonical id: e.g. `state:127`, `family:7-1`, `office:jupiter`, `profile:sun:v0.1.1`, `operator:M`, `cycle:modal-cycle:127`, `extension:court:0.1` |
| `name` | string | human title |
| `admission` | enum `"admitted" \| "proposed"` | orthogonal to kind, §3.2 |
| `summary` | object §2.6 | narrative contract |
| `sourcePath` | string | authoritative file it was derived from |

#### 2.2.1 `kind: "scaleState"` (462)

| Field | Type | Nullable | Source |
|---|---|---|---|
| `nodeId` | int | no | node.id |
| `forte` | string | **yes** | node.forte (null ⇒ no allocated set class) |
| `pitchSetMask` | int (0–4095) | **yes** | derived: 12-bit mask, pc0 = bit 0; null iff forte null |
| `pitchSetPcs` | int[] (≤7, ascending) | **yes** | parsed node.pitchSet |
| `bitLabel` | string (`^b[01]{12}$`) | yes | node.bit |
| `bitReverseLabel` | string | yes | node.bitReverse |
| `role` | enum `anchor \| satellite \| boundary` | no | node.role |
| `fineRole` | string | yes | node.fineRole |
| `tier` | string | yes | node.tier (A0…D7) |
| `office` | string | **yes** | node.office (null ⇒ boundary) |
| `officeIndex` | int (0–6) | **yes** | node.officeIndex (null iff office null) |
| `officeBearing` | boolean | no | derived: office ≠ null |
| `chirality` | enum `achiral \| chiral` | yes | node.chirality (orientation carries A/B detail) |
| `orientation` | string | yes | node.orientation |
| `assignmentStatus` | string | no | node.assignmentStatus |
| `resolutionClass` | string | yes | node.resolutionClass |
| `parents` | int[] | no | node.parents (empty array = none) |
| `incomingCount` / `outgoingCount` | int | no | derived from relationships §2.3 |
| `canonicalProfileId` | string | yes | join via registry `canonicalIdentity.stateId` |
| `compiledProfileId` | string | **yes** | compiled packet `normalFormId` joined by state id; only 4 states compile today (1493, 1643, 1749, 2477) |

#### 2.2.2 `kind: "scaleFamily"` (38)

| Field | Type | Nullable | Source |
|---|---|---|---|
| `forte` | string (`^\d+-[A-Z]?\d+$`) | no | familyRegistry.forte |
| `stateCount` | int (1–7) | no | familyRegistry.stateCount |
| `modalOrientationCount` | int | no | familyRegistry.modalOrientationCount |
| `chirality` | enum | yes | familyRegistry.chirality |
| `registeredBeforeCompletion` / `missingBeforeCompletion` | int | no | familyRegistry |
| `zPartner` | string | **yes** | familyRegistry.zPartner (null = no Z relation) |
| `memberStateIds` | int[] | no | derived: states with this forte |

#### 2.2.3 `kind: "governorOffice"` (7)

| Field | Type | Nullable | Source |
|---|---|---|---|
| `office` | string | no | officeOrder (Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn) |
| `officeIndex` | int (0–6) | no | position in officeOrder |
| `color` | string (`#RRGGBB`) | yes | registry profile `physical.color` |
| `profileId` | string | yes | registry `profiles[].profileId` |
| `stateCount` | int | no | derived: states with officeIndex |
| `symbol` | string | yes | registry `profiles[].symbol` (e.g. `☉`) |

#### 2.2.4 `kind: "canonicalProfile"` (7)

| Field | Type | Nullable | Source |
|---|---|---|---|
| `profileId` | string (`^profile:[a-z]+:v`) | no | profiles[].profileId |
| `profileVersion` | string | no | profiles[].profileVersion |
| `office` / `officeIndex` | string / int | no | profiles[].office, .officeIndex |
| `type` | string | no | profiles[].type (e.g. `monopolar_luminary`) |
| `canonicalIdentity` | object | no | profiles[].canonicalIdentity: `{ stateId, stateName, mode, forteFamily, pitchMask, pitchSet, anchorTier, chirality, assignmentStatus }` |
| `photonic` | object \| null | **yes** | profiles[].physical (`{ photonicId, wavelengthNm, color, … }`); null = no photonic record |
| `intrinsicFingerprint` | string | no | profiles[].intrinsicFingerprint |
| `landformReferences` | int | no | count from domainProjection (`domainReferences.landforms` per profile; sums to 40) |
| `unresolvedScopeBindings` | int | no | count from semantic registry |

#### 2.2.5 `kind: "mutationOperator"` (15)

| Field | Type | Nullable | Source |
|---|---|---|---|
| `operatorId` | enum M, R1–R7, L1–L7 | no | operator-registry.csv operator_id |
| `notation` | string | no | .notation |
| `operatorClass` | enum `modal_re_rooting \| …` | no | .operator_class |
| `degree` | int (0–7) | **yes** | .degree (null for M) |
| `degreeGovernor` | string | yes | .degree_governor (null for M) |
| `direction` | enum `successor \| predecessor \| …` | no | .direction |
| `deltaSemitones` | int | yes | .delta_semitones (null for M) |
| `domainRule` | string | no | .domain_rule |
| `action` | string | no | .action |
| `inverseOperatorId` | string | no | .inverse_operator_id |
| `conjugateOperatorId` | string | no | .conjugate_operator_id |
| `partial` | boolean | no | .partial (M = false, R/L 1–7 = true) |
| `status` | string | no | .status (structurally_validated) |
| `applicationCount` | int | no | .application_count (462 modal, 3402 total across ops) |
| `domainSize` / `imageSize` | int | no | .domain_size / .image_size |
| `structuralSupportCount` / `fieldSupportCount` | int | no | .structural_support_count / .field_support_count |
| `projectionGapId` | string | no | reference into `projectionGaps[]` (§2.5) |
| `semanticOperatorId` | string | **yes** | registry semantic-operator-registry.json join by structuralOperatorId |

#### 2.2.6 `kind: "modalCycle"` (66)

| Field | Type | Nullable | Source |
|---|---|---|---|
| `cycleId` | string (`^modal-cycle:\d+$`) | no | cycle-identities.csv cycle_id |
| `representativeStateId` | int | no | .representative_id |
| `cycleLength` | int (7) | no | .cycle_length |
| `forte` | string | no | .forte |
| `role` / `fineRole` / `tier` | string | no | .role / .fine_role / .tier |
| `orientation` / `chirality` | string | yes | .orientation / .chirality |
| `officeBearing` | boolean | no | .office_bearing |
| `officeSequence` | string[] (7) | yes | parsed .office_sequence |
| `officeDeltaSequence` | int[] (7) | yes | parsed .office_delta_sequence |
| `memberStateIds` | int[] (7) | no | parsed .member_ids — all must resolve (§3.4) |

#### 2.2.7 `kind: "candidateExtension"` (0–n)

| Field | Type | Nullable | Source |
|---|---|---|---|
| `extensionId` | string | no | toolkit candidate id |
| `category` | enum `court \| phenomena \| thermodynamic` | no | candidate schema |
| `roadmapRef` | string | no | path into toolkit docs/roadmap |
| `proposedInvariants` | string[] | no | INV-COURT-001/2/3, INV-PHEN-001/2/3 |

`candidateExtension` archetypes are **always** `admission: "proposed"` (const
in the schema). They carry no pitch-set, profile, or relationship data —
every field beyond the cross-cutting ones is `null` by policy. This is the
designed showcase of the proposed-vs-admitted UI (§3.2).

### 2.3 `relationships[]`

Projected graph edges for the topology visualizer. Mirrors the canonical
edge objects with typed nulls:

| Field | Type | Notes |
|---|---|---|
| `id` | string | original edge id |
| `source` / `target` | int | node ids (must resolve, §3.4) |
| `type` | string | e.g. `CONSTRUCTS`, `AUDITED_HAMMING2` |
| `governing` / `directed` | boolean | no |
| `mode` | string | e.g. `single_degree`, `fixed` |
| `mutation` | string \| null | operator annotation `D3 3→2 (-1)` |
| `degree` | int \| null | no |
| `hamming` | int | no |
| `selected` / `eligible` | boolean | no |
| `provenance` | string | no |

### 2.4 `commutationPairs[]` — exactly 91

| Field | Type | Source |
|---|---|---|
| `operatorA` / `operatorB` | string | commutation-summary.csv |
| `sourceStatesTested` | int | .source_states_tested (462) |
| `aThenBDefined` / `bThenADefined` | int | .a_then_b_defined / .b_then_a_defined |
| `bothDefined` / `equalWhenBothDefined` / `unequalWhenBothDefined` | int | |
| `domainAsymmetry` / `neitherDefined` | int | |
| `classification` | enum `weak_common_domain_commutation \| strong_partial_commutation` | (21 weak / 70 strong) |

### 2.5 `projectionGaps[]` — exactly 15

| Field | Type | Source |
|---|---|---|
| `operatorId` | string | projection-coverage.csv |
| `formalApplications` | int | .formal_applications |
| `structuralProjection` / `fieldProjection` / `unionProjection` | int | |
| `unprojectedApplications` | int | .unprojected_applications (M = 280) |
| `unionCoverageRate` | number (0–1, 6dp) | .union_coverage_rate (M = 0.393939) |
| `interpretation` | string | .interpretation |

### 2.6 Narrative contract (`summary`)

```jsonc
{
  "narrativeKind": "deterministic_template",   // or "ai_generated"
  "text": "…",                                 // non-empty, ≤ 2048 chars
  "model": null,                               // non-null iff ai_generated
  "sha256": "<hex or null>"                    // non-null iff ai_generated
}
```

- `deterministic_template`: composed at build time from role, tier, office,
  coverage, chirality, and cycle position using fixed sentence templates.
- `ai_generated`: produced in a **one-off offline pass** (DeepSeek-V4-Flash or
  equivalent), reviewed, then **pinned** verbatim in
  `bestiary/data/pinned-narratives.json`; `build-bestiary.mjs` merges the pin
  at build time (pinned text is never regenerated by the builder, and the
  fresh-check byte determinism is preserved). The emitted `sha256` binds the
  pinned text to the data file; the freshness check (§1.3) compares only the
  `deterministic_template` output. Any re-pin is a deliberate, reviewed event
  recorded in `provenance/DECISION_LEDGER.md` (§8).

---

## 3. Edge cases and invariant rules

### 3.1 Explicit-null policy

- **Missing data is `null`, never an absent key.** Every schema object sets
  `required` to the full field list and `additionalProperties: false`.
- UI components branch on `kind` + `null`-checks; they never branch on key
  presence. This is what keeps 595 (and future) pages crash-free.
- Booleans are never null; a boolean field that does not apply is expressed
  as a sibling nullable field instead (e.g. `officeBearing: false` plus
  `office: null`).

### 3.2 Proposed vs admitted

- `admission` is **orthogonal to kind**: a `scaleState`, `mutationOperator`,
  or `candidateExtension` may all be `proposed` (only candidates are today).
- UI contract:
  - `admitted` → green badge, full stats, included in dashboard stats and
    comparison matrix.
  - `proposed` → amber badge, "Proposed Candidate Extension" ribbon, stats
    hidden unless explicitly toggled, excluded from `summary.byCategory`
    totals, excluded from comparison defaults.
- `summary.byCategory` counts only `admitted` archetypes (595 constant);
  `candidateExtension` appears with its own count (3 as of 1.1.0).

### 3.3 Boundary states and missing offices

- 154 boundary states: `office: null`, `officeIndex: null`,
  `officeBearing: false`. The identity header renders a "Categorically
  Withheld" badge instead of an office chip; the pitch-set dial still
  renders; the topology graph renders their incoming `AUDITED_HAMMING2`
  field edges.
- `forte: null` (only possible on proposed material) hides the pitch dial
  entirely and shows a "No set class allocated" placeholder.

### 3.4 Closed references (build-time enforcement)

Every cross-reference must resolve to a real archetype or the build **fails**
with a strict-mode error listing the dangling refs:

- `scaleState.parents` → existing `scaleState` node ids.
- `scaleFamily.memberStateIds` → existing states with matching forte.
- `modalCycle.memberStateIds` → existing states (audit member ids are real
  node ids; verified above: `127;2111;3103;3599;3847;3971;4033` all resolve).
- `relationships[].source/target` → existing state ids.
- `mutationOperator.projectionGapId` / `semanticOperatorId` → existing
  entries.
- `canonicalProfile.compiledProfileId` → existing compiled packet (null when
  the profile is one of the 3 not compiled — 4 of 7 compile today).
- `governorOffice.profileId` → existing profile.

### 3.5 Numbers that must hold (validated in `validate-release.mjs`)

- `archetypes` counts per kind: 462 / 38 / 7 / 7 / 15 / 66 (+ candidates).
- `commutationPairs` length **exactly 91**; 21 weak / 70 strong.
- `projectionGaps` length **exactly 15**, one per operator; M row must be
  `formalApplications 462, unprojectedApplications 280, unionCoverageRate
  0.393939`.
- `relationships` structural + field edges: totals equal the canonical file's
  `structuralEdges` + `fieldEdges` lengths (1348 = 588 structural + 760 field).
- Operator application totals match the audit's `application_count` column
  (M 462; R/L partial counts per audit).
- `releaseId` matches `provenance/release.json`.
- Every `sources[].sha256` matches the live file hash.

### 3.6 Floats

`unionCoverageRate` is the only float in the artifact. It is emitted with
exactly 6 decimal places (parse+re-emit, never string-format arithmetic), so
the byte-level freshness check is stable.

### 3.7 Empty collections

Empty arrays are emitted as `[]`, never null (e.g. a state with no parents,
a cycle list that is empty for candidates). The distinction "no data" (null)
vs "empty collection" (`[]`) is part of the UI contract.

---

## 4. Component hierarchy — Astro + Tailwind v4

Framework: **Astro (static output)** + Tailwind v4 (`@tailwindcss/vite`).
The scatterplot is a vanilla SVG + inline script (no D3). KaTeX is deferred —
laws render as plain text. The topology graph uses vendored vis-network
(loaded via `?raw` + `eval` from `graph/vendor/`, same offline pattern as
`graph/`).

### 4.1 Pages

| Route | Purpose |
|---|---|
| `/` | **Dashboard** (Multi-Dimensional Index): search, facets, scatterplot, counts |
| `/archetypes/[id]` | **Detail view** for every archetype kind (one route, kind-routed components) |
| `/operators/[id]` | alias → `/archetypes/[id]` |
| `/profiles/[id]` | alias → `/archetypes/[id]` |
| `/compare?a=&b=` | side-by-side comparison matrix (client-side, reads query params) |

`getStaticPaths` derives all routes from `bestiary-data.json` at build time.

### 4.2 Component tree

```text
Layouts
├── BaseLayout.astro            dark shell, header/nav, Tailwind theme tokens
└── ArchetypeLayout.astro       detail-page chrome (identity header +
│                               narrative + sections)

Pages
├── index.astro                 Dashboard
├── archetypes/[id].astro       Detail (dispatches on kind)
├── compare.astro               comparison (inline island; panels are
│                               functions in the island, not separate files)
├── operators/[id].astro        15 alias redirects → /archetypes/[id]
└── profiles/[id].astro         7 alias redirects → /archetypes/[id]

Cards
├── ArchetypeCard.astro         grid/list tile with glyph, mini pitch dial,
│                               badges; kind glyphs are inline (no
│                               CategoryIcon.astro)
├── AdmissionBadge.astro        tri-state: admitted / proposed / withheld
└── StatBar.astro               labeled stat rows (degree, coverage, counts)

Filters
├── FilterBar.astro             multi-facet: kind, role, tier, office,
│                               forte set size, coverage gap bucket, admission
└── SearchBox.astro             id / name / forte / notation fuzzy match

Detail (kind-routed, under components/detail/)
├── DetailSection.astro         titled panel wrapper
├── EdgeChip.astro              relationship type chip
├── StateSections.astro / FamilySections.astro / OfficeSections.astro /
├── ProfileSections.astro / OperatorSections.astro / CycleSections.astro /
└── CandidateSections.astro

Visualizers
├── PitchSetDial.astro          SVG 12-slot rotary dial: mask, offset,
│                               interval-vector bands, complement ghost (SSR)
├── PitchSetDialMini.astro      64px SSR dial on state cards
├── TopologyNodeGraph.astro     vendored vis-network ego graph (inline island,
│                               `?raw` + eval from graph/vendor/)
├── Scatterplot.astro           semantic grid ⇄ deterministic network toggle
│                               (inline island, §4.3 + §4.3.1)
└── StatComparisonMatrix.astro  14×14 commutation grid + partners table (SSR)

Narrative
└── ArchetypeNarrative.astro    summary.text + model attribution chip
                                 (hidden for deterministic narratives)

lib
├── bestiary.ts                 typed loader: getArchetype(id), byKind(),
│                               counts, facet indexes (build-time + runtime)
├── pitchSet.ts                 mask ↔ pcs, complement, inversion, interval
│                               vector, Forte id formatting
├── dialGeometry.ts             single source of dial geometry (shared by
│                               PitchSetDial + dialClient)
├── dialClient.ts               interactive dial island (rotate, transpose,
│                               complement, interval hover)
├── networkLayout.ts            deterministic office-lane + reserved-zone
│                               network layout (§4.3.1), computed during SSR
└── nodeShapes.ts               fixed network palette and SVG glyph mapping
```

Client islands are used only where interactivity requires it (dial, graph,
scatterplot, compare); cards, headers, filters, and narratives are static SSR
HTML for instant render and full offline closure.

### 4.3 Deterministic scatterplot embedding

No t-SNE/PCA (non-deterministic). Two axes derived per archetype:

- **x**: `officeIndex` + `forte` set-size bucket (0 for no forte) + tiny
  fixed-seed jitter (seeded PRNG with archetype id; seed fixed in the spec
  so the same data always yields the same layout).
- **y**: `tier` rank (A0…D7) or cycle `role` rank for operators/cycles.

`Scatterplot` reads precomputed `scatterX`/`scatterY` fields the builder
embeds into each archetype — the client never computes the embedding.

#### 4.3.1 Deterministic network layout (dashboard toggle)

The dashboard offers **Network** as its default view alongside the semantic
Grid. `lib/networkLayout.ts` computes an explicit office-lane layout during
SSR; there is no RNG, force simulation, physics pass, or client-side layout.
The Network and Grid views are separate SVGs (1780×2120 and 960×620), so each
has its own coordinate system while sharing the same filter/hover/navigation
island. Consecutive builds emit byte-identical dashboard HTML.

- The 462 states follow the standalone Seven Governors chart: 70 anchors at
  seven office-lane × ten tier-row intersections, 238 satellites in fixed
  tier clusters, and 154 boundary states in eleven Forte columns.
- The 136 non-state archetypes occupy reserved zones that cannot intersect a
  state cell. Seven offices and seven profiles flank their lane header at
  y=66. Thirty-eight families are ordered by their member-state centroid and
  packed into a right rail with a 32px minimum row gap; 66 modal cycles sit
  beside their family. Fifteen operators occupy a post-boundary strip, with
  `M` centered and each R/L pair ±16px from its degree-governor lane. Three
  candidates form an `extensionId`-sorted top-right row.
- `computeNetworkLayout` fails the build if any archetype lacks a finite,
  in-viewBox position. There is no center-point fallback in layout output.
- `lib/nodeShapes.ts` maps A0 to a circle, A1 to a diamond, A2 to a hexagon,
  and D1–D7 to heptagon through tridecagon. Satellite variants are keyed by
  tier/Forte/orientation; boundary variants are convergence circles, junction
  diamonds, and leaf triangles. Families/cycles use hollow rings, offices and
  profiles use their filled markers, operators are squares, and candidates
  are amber diamonds. Tier colors are fixed concrete hex values: A0 `#82BFF5`,
  A1 `#EF9B57`, A2 `#E58BB7`, D1 `#5BC5C0`, D2 `#7CB7EE`, D3 `#6DBDD9`,
  D4 `#D19491`, D5 `#ABA3BB`, D6 `#8FA1EB`, and D7 `#67C5A5`.
- Guides render beneath edges/nodes: seven office panels with derived counts;
  the ordered rows A0 satellites, A0/7-35, A1 satellites, A1/7-34, A2/7-33,
  A2 satellites, D1/7-22, 7-20 satellites, D2/7-15, 7-Z38+7-7 satellites,
  D3/7-Z37, 7-11 satellites, D4/7-Z17, 7-13+7-16 satellites, D5/7-Z12,
  7-6+7-10 satellites, D6/7-8, 7-2 satellites orientations A+B, and D7/7-1
  terminal; plus the boundary panel, family/cycle rail, and operator strip.
- Edges are the **588 structural relationships only** (CONSTRUCTS, GOVERNS,
  MODAL_SUCCESSOR, SEAT_CONTACT), color-coded per type at 0.42 opacity and
  dashed for SEAT_CONTACT. Filters apply actual `hidden` attributes to SVG
  anchors and incident edges; hovering a node highlights its neighbors and
  incident edges. Default view is Network with a segmented Grid toggle; the
  active button has accent fill/border and `aria-pressed=true`, while the
  section label tracks the visible SVG. Network is also the no-JS SSR default.
  Both views share one island and respond to `bestiary:filter-change` + search.

### 4.4 Formulas

KaTeX-rendered laws per archetype (deterministic strings in the data):

- states: `T_n(X)`, `I(X)` masks and the governing office's law.
- operators: `M: P(x) → P'(x)` with `x ↦ x+1 mod 12`; `R_k/L_k` with their
  delta semitone steps; inverse pair rendering `(R_k)^{-1} = L_k`.
- profiles: fingerprint canonical-form law with the `intrinsicFingerprint`.

---

## 5. Folder structure

```text
integrated-release/
├── bestiary/
│   ├── ARCH-SPEC.md                  this document
│   ├── data/
│   │   ├── bestiary-data.json        generated artifact (deterministic)
│   │   ├── bestiary-data.schema.json authored strict schema (draft 2020-12)
│   │   └── pinned-narratives.json    pinned AI narratives (§2.6, milestone 6)
│   ├── site/
│   │   ├── astro.config.mjs          static output, outDir = ../dist
│   │   ├── package.json              astro, @tailwindcss/vite (Tailwind v4),
│   │   │                             typescript — no d3, no katex
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── components/           §4.2 tree
│   │       ├── layouts/
│   │       ├── lib/                  bestiary.ts, pitchSet.ts,
│   │       │                         dialGeometry.ts, dialClient.ts,
│   │       │                         networkLayout.ts, nodeShapes.ts
│   │       └── pages/                §4.1 routes
│   └── dist/                         built site, committed with the release
└── scripts/
    ├── build-bestiary.mjs            builder + fresh-check (§1.3)
    ├── validate-release.mjs          root validator (all bestiary:* checks)
    └── build-manifest.mjs            MANIFEST.json + CHECKSUMS.sha256
```

`bestiary/site/node_modules` is excluded from the manifest by the existing
global walker rule.

## 6. Release integration

### 6.1 Root scripts

```text
"build:bestiary": "node scripts/build-bestiary.mjs --emit",
"bestiary:build:site": "npm run build --prefix bestiary/site"
```

### 6.2 New checks in `scripts/validate-release.mjs`

| Check | Pass condition |
|---|---|
| `bestiary:schema-valid` | `bestiary-data.json` validates against `bestiary-data.schema.json` via ajv (draft 2020-12) |
| `bestiary:fresh` | fresh-check mode exit 0 (§1.3) |
| `bestiary:refs-closed` | §3.4 (re-run by validator, not only at build) |
| `bestiary:counts` | §3.5 constants |
| `bestiary:narrative-pins` | §2.6 — 22 pinned `ai_generated`, pin↔data closure, sha256 bound, templates clean |
| `bestiary:site-built` | `bestiary/dist/index.html` exists and is newer than the newest `src` file |
| `bestiary:offline-closure` | no `http(s)://` in src or dist markup/scripts (same rule as `graph/`) |
| `bestiary:detail-routes` | `bestiary/dist/archetypes` contains exactly 598 detail routes |
| `bestiary:compare-route` | `bestiary/dist/compare/index.html` has selects + differential/overlap/path sections |
| `bestiary:alias-routes` | 15 operator + 7 profile alias dirs each redirect to `/archetypes/…` |

### 6.3 Manifest

`bestiary/data/bestiary-data.json`, `bestiary/data/bestiary-data.schema.json`,
`bestiary/data/pinned-narratives.json`, and `bestiary/dist/**` are recorded in
`MANIFEST.json` + `CHECKSUMS.sha256` (data payload is deterministic, so the
checksum is stable across identical releases; `generatedAt` lives only in the
build envelope excluded from the payload).

### 6.4 QA evidence

`qa/bestiary-validation.json` is emitted by the `bestiary` checks with the
same report shape as `integrated-release-validation.json` and is part of the
release QA bundle.

---

## 7. Milestones

| # | Milestone | Acceptance |
|---|---|---|
| 1 | Author `bestiary-data.schema.json` + `scripts/build-bestiary.mjs` | Fresh-check passes; counts and refs closed; deterministic bytes stable across two runs |
| 2 | Wire `bestiary:*` checks into `validate-release.mjs` + ajv devDependency | All four data checks green in the full suite |
| 3 | Astro shell + `bestiary.ts` loader + Dashboard | `/` renders 598 cards with facets (states 462, families 38, offices 7, profiles 7, operators 15, cycles 66, candidates 3); offline-closure green |
| 4 | Detail view: identity header, dial, laws, narrative | `/archetypes/[id]` renders for all 7 kinds + candidates |
| 5 | Topology graph + scatterplot + compare | interactive islands pass offline-closure (shipped; see §9) |
| 6 | Pinned AI narratives pass | `narrativeKind:"ai_generated"` present, sha256 bound, freshness intact (shipped; see §9) |
| 7 | Release 1.2.0 | full `npm run validate` green; dist + data + schema in MANIFEST/CHECKSUMS (shipped; see §9) |

---

## 8. Change control

- Any change to canonical data, audit CSVs, or registry canonical JSONs that
  alters counts, fields, or refs **must** regenerate `bestiary-data.json`
  (fresh-check enforces this) and bump the bestiary `schemaVersion` if the
  shape changed.
- Adding a new archetype kind requires: schema `oneOf` addition, builder
  mapping, detail-view component branch, facet entry, and a milestone-7-style
  validation pass.
- AI narrative text is pinned; regenerating it is a deliberate, reviewed
  event recorded in `provenance/DECISION_LEDGER.md`, never a side effect of a
  build.

---

## 9. Implementation record — corrections from verified reality

The extraction script (`scripts/build-bestiary.mjs`, v1.0.0) was implemented
against the live release. The following corrections to this spec were
verified against the authoritative files and are authoritative going
forward:

| # | Spec statement | Verified reality |
|---|---|---|
| 1 | chirality enum `achiral \| levo \| dextro` | `achiral \| chiral`; the A/B detail lives in `orientation` |
| 2 | candidate category enum includes `process` | `court \| phenomena \| thermodynamic`, one per toolkit candidate schema |
| 3 | edges: "2818 projected" | 1348 (588 `structuralEdges` + 760 `fieldEdges`) |
| 4 | `canonicalProfile.compiledProfileId` joined by profile root state | The 4 compiled packets belong to **route states** (1493, 1643, 1749, 2477), not the 7 profile roots; field moved to `scaleState` |
| 5 | family `stateCount` 1–7 | up to 14 (dual-orientation families, e.g. 7-2) |
| 6 | forte pattern with letter after dash | letter optional (`7-1` and `7-Z37` both valid) |
| 7 | relationship `mode`/`hamming` non-null | nullable (modal edges carry `mode: null`; 357 edges carry `hamming: null`) |
| 8 | operator inverse within `M\|R[1-7]\|L[1-7]` | M's inverse is the documented self-inverse `M^6`; schema permits `M^6` |
| 9 | `parents` as plain ids in source | source parents are objects `{ parentId, tier, … }`; builder maps to `parentId` ints |
| 10 | per-profile `unresolvedScopeBindings` | registry tracks 60 at release level with **no per-profile attribution**; field emits honest `0` |
| 11 | `incomingCount`/`outgoingCount` | incoming = structural edges targeting the node + field edges touching it (undirected); outgoing = structural edges sourcing from it |
| 12 | total archetypes 595 | 598 emitted: 595 admitted + 3 candidate extensions (court, phenomena, thermodynamic) |
| 13 | landformReferences source | `domainReferences.landforms` per profile (Sun 4, Moon 6, Mars 7, Mercury 5, Jupiter 6, Venus 6, Saturn 6; sums to the release's 40) |

Implementation notes:

- `scatterX`/`scatterY` are embedded per archetype per §4.3 (tier rank from
  `directAnchorPrecedence` + `secondOrderAnchors`; fixed-seed jitter).
- The builder uses a hand-rolled RFC4180 parser (quoted fields with commas
  exist in `operator-registry.csv`, e.g. the R1/L1 action texts) and validates
  its own output with ajv (draft 2020-12 entry `ajv/dist/2020`) against
  `bestiary-data.schema.json` before writing.
- `bestiary:fresh` runs the builder's no-arg mode; determinism is verified
  byte-for-byte (sha256-identical across runs).
- Validation wiring: `bestiary:schema-valid`, `bestiary:fresh`,
  `bestiary:refs-closed`, `bestiary:counts` in `scripts/validate-release.mjs`,
  with `qa/bestiary-validation.json` as QA evidence (excluded from
  MANIFEST/CHECKSUMS parity like the integrated report).
- Milestone 3 (Astro shell) shipped as `bestiary/site/` (Astro 7 static,
  Tailwind v4 `@theme` tokens, vanilla-TS islands; no React, no CDN) with
  root scripts `bestiary:dev` / `bestiary:build:site` / `bestiary:preview` and
  two new validation checks `bestiary:site-built` (dist fresher than sources)
  and `bestiary:offline-closure` (no remote `src`/`href`/`url()`/`@import`
  references in `bestiary/dist/`, comments stripped).
- Milestone 4 step A (detail-view skeleton) shipped: `archetypes/[id].astro`
  derives 598 static routes via `getStaticPaths`; `ArchetypeLayout.astro`
  provides breadcrumb + identity header; per-kind sections live in
  `components/detail/` (`StateSections`, `FamilySections`, `OfficeSections`,
  `ProfileSections`, `OperatorSections`, `CycleSections`, `CandidateSections`,
  plus `DetailSection` wrapper and `EdgeChip`). Cross-links: state ↔ family
  (by forte), state ↔ office, parents, cycles membership, profile root state,
  operator inverse/conjugate with the documented self-inverse `M^6` resolving
  to `operator:M`, Z-partner, compiled profile chips. Relationships are split
  structural vs field by type set (structural = CONSTRUCTS, GOVERNS,
  MODAL_SUCCESSOR, SEAT_CONTACT; field = AUDITED_HAMMING2, PHASE_SHIFT) and
  reproduce the stored `incomingCount`/`outgoingCount` for all 462 states.
  KaTeX and the dial are deferred: laws render as plain text (milestone 4
  completes with the dial in step B).
- Milestone 4 step B (pitch dial) shipped: `PitchSetDial.astro` is a pure SSR
  SVG dial (zero JS, offline-closure safe) — 12-slot clock face with pc
  labels, selected pcs filled in the office tint, interval-vector bands
  (ic1–6) with per-ic counts, optional dashed complement ghost ring
  (`showComplement`), aria-label, and a mono legend
  (`{pcs}` / mask · size / iv / complement). Mounted on scaleState (withheld
  badge when `pitchSetMask` is null), canonicalProfile (root state), and
  scaleFamily/modalCycle (representative state). Verified against
  `intervalVector()` in `lib/pitchSet.ts` (e.g. state 1001 →
  {0,3,5,6,7,8,9}, iv [4,4,5,3,3,2]; Mars profile root 1717). Milestone 4 is
  complete; the interactive dial island (`PitchSetDialClient.ts`) and the
  stat comparison matrix remain for milestone 5 scope.
- Milestone 5 step C (stat comparison matrix) shipped ahead of the visualizer
  scope: `StatComparisonMatrix.astro` is a pure SSR 14×14 grid over the
  **audited order** `R1, L1, R2, L2, …, R7, L7` — the pair topology derived
  from the data is ordered-only (`(A,B)` exists iff A precedes B in this
  order; 91 pairs = 70 strong + 21 weak, no self/reverse pairs, `M` absent).
  Cells show the `bothDefined` count tinted by classification (emerald =
  strong_partial_commutation, amber = weak_common_domain_commutation) with a
  full tooltip; the current operator's row and column carry an accent ring;
  below the grid a per-operator partners table (both `A × B` and `B × A`
  sides, coverage bar over `sourceStatesTested`). The `M` page renders an
  explanatory note (self-inverse root class excluded from commutation
  auditing) instead of the grid. lib gained `commutationOrder`,
  `commutationPairFor`, `commutationPartners`. Milestone-5 scope now shrinks
  to the interactive visualizers (`TopologyNodeGraph`, `Scatterplot`,
  `compare.astro` + `DifferentialMatrix`).
- Milestone 5 (interactive visualizers) shipped:
  - 5a `Scatterplot.astro` (vanilla SVG island) on `/` between the stat cards
    and the filter bar — 598 points keyed by kind, hover tooltip
    (`id · name · kind`), click-through anchors to detail pages, and full
    filter-awareness: `FilterBar.refresh()` now dispatches a
    `bestiary:filter-change` window event that the scatter listens to and
    re-renders from `data-kind`/`data-admission`/`data-office`/`data-search`
    card attributes. Verified: 598 points; chip-filtering to 462 states
    re-renders; tooltip reads `modal-cycle:127 · Modal cycle`; zero console
    errors.
  - 5b `TopologyNodeGraph.astro` (vis-network 10.1.0 vendored at
    `graph/vendor/vis-network.min.js`) on state detail after Relationships —
    the island imports the vendor source via `?raw` + `(0, eval)(source)` and
    renders the state's structural ego graph (office-tinted nodes, dashed
    weak edges, arrowheads, physics layout), clicking a node navigates to its
    detail page. Note: from `src/components/` the vendor path is
    `../../../../graph/…` (four levels); the shallower `../../../` fails with
    UNRESOLVED_IMPORT. Verified on state:1001: container/canvas/vis global
    present, payload 6 nodes + 6 edges, canvas painted, zero console errors.
  - 5c `compare.astro` (+ inline island importing the lib directly, single
    data source) at `/compare` with URL-shareable `?a=&b=` selection, two
    kind-grouped selects + swap button, and three panels: **Differential
    matrix** (per-kind field specs, rows where values differ; "no differing
    fields" for identical comparisons; explanatory note for cross-kind
    pairs), **Overlap** (shared governing parents, shared modal cycles,
    shared office/forte, family/cycle shared members), **Transformation
    path** (BFS over undirected structural edges with per-edge type/direction
    chips and exploration stats). Alias routes `/operators/:id` (15) and
    `/profiles/:id` (7) are static redirect pages (301 meta-refresh) mapping
    to `/archetypes/…`. New checks `bestiary:compare-route` and
    `bestiary:alias-routes`; 622 total pages. Verified: default pair
    127↔1001 shows 8 differing rows, BFS path of 4 structural edges with 52
    states explored; same-family pair shows shared cycle + forte; swap and
    cross-kind note behave.
  - 5d interactive dial island: `lib/dialGeometry.ts` extracted as the single
    source of dial geometry (PitchSetDial now imports from it); `dialClient.ts`
    re-renders the state-page dial with rotation, ±1 semitone transposition,
    complement ring toggle, reset, and interval-class hover captions
    (verified: +1 transpose of 1001 → {1,4,6,7,8,9,10}, ic3 hover shows
    "5 unordered pairs", complement renders 5 ghosts). `PitchSetDialMini.astro`
    (64px SSR SVG, office-tinted dots + ticks) appears on all 462 state cards.
  - 5e closure: required-file list extended (Scatterplot, TopologyNodeGraph,
    PitchSetDialMini, dialGeometry, dialClient, compare.astro); full
    validation re-run; milestone 5 complete.
- Milestone 6 (pinned AI narratives) shipped: one-off offline authoring pass
  (model `deepseek-v4-flash`, recorded in `provenance/DECISION_LEDGER.md`)
  pinned 22 narratives — the 7 canonical profiles and 15 mutation operators —
  in `bestiary/data/pinned-narratives.json`; `build-bestiary.mjs` merges the
  pin after archetype assembly (before schema self-validation), setting
  `narrativeKind:"ai_generated"`, `model`, and `sha256` = sha256 of the exact
  UTF-8 text bytes; the 576 other summaries remain `deterministic_template`
  with null model/sha256. New check `bestiary:narrative-pins` verifies: 22
  pinned, pin↔data closure both directions, text verbatim from the pin,
  recomputed sha256 matches, template summaries clean. `ArchetypeNarrative.astro`
  renders the full narrative on every detail page (closing the §4 milestone-4
  "narrative" gap): plain prose for deterministic, model + sha256 + pin-status
  chips for ai_generated. Fresh-check determinism preserved (two consecutive
  builds byte-identical).
- Milestone 7 (release 1.2.0) shipped: pure version cut. Bumped
  `package.json` and `provenance/release.json` (releaseId
  `seven-governors-integrated-1.2.0`) plus the validator's two version
  bindings (release id, manifest version); canonical counts unchanged.
  Regeneration chain re-run (bestiary data determinism confirmed, 622 site
  pages, MANIFEST/CHECKSUMS refreshed); full validation 117/117 ×2 and all
  three sub-suites green; browser smoke on final dist clean. DECISION_LEDGER
  records the release and the machine-data-over-vocabulary ruling: the
  AGENTS.md "operational Court" (Forte 5–35) stays candidate until a
  deliberate 1.3.0+ admission of pentatonic data.
- Site debt cleanup (post-1.2.0): the dashboard kind-facet counts were
  hardcoded (462/38/7/7/15/66/3) and are now derived from the data; the
  scatterplot aria-label and the commutation descriptions now derive from
  data/`commutationOrder`. **Correction from verified reality:** the
  commutation matrix is 14×14, not 13×13 — `commutationOrder` contains 14
  operators (R1–R7, L1–L7), M is excluded (15−1), and the 91 ordered pairs =
  C(14,2). The earlier "13" misread the `asA` distinct count (13, since the
  final operator L7 never appears as `operatorA`); the two component
  descriptions and §4.2/§9 wording are corrected accordingly.
- Initial dashboard network prototype (post-1.2.0, superseded by NET-101):
  `lib/networkLayout.ts` used a fixed-seed, 200-iteration SSR force layout in
  a **Network ⇄ Grid** toggle inside `Scatterplot.astro`. It proved the
  deterministic toggle and interaction model but did not visually match the
  standalone Seven Governors office-lane chart.
  Edges are color-coded by type (GOVERNS #8CF, MODAL_SUCCESSOR #34D399,
  CONSTRUCTS #FBBF24, SEAT_CONTACT #C084FC dashed), hide when either endpoint
  is filtered out, and light up on hover with neighbor highlighting.
  Determinism verified: two consecutive site builds emit byte-identical edge
  coordinates. Default view is Network (grid toggle retains the §4.3 semantic
  reading).
- NET-101 (network replica layout) shipped: `lib/networkLayout.ts` rewritten
  from the force simulation to the deterministic **office-lane placement** of
  the standalone Seven Governors chart (geometry ported from
  `graph/src/seven-governors-network.fragment.html` `officeLayout` "office"
  mode). Zero RNG: anchors at lane+row centers (7 offices × 10 tiers), 238
  satellites in tier clusters (`placeCluster` offsets), 154 boundaries in an
  11-family bottom band. Guides emitted (lane headers, row labels, boundary
  columns). Two separate SVGs (network 1500×1920 with guides, grid 960×620)
  with the Network default and the same filter/hover/click island. Verified:
  spot checks `state:1001` (Mars D5), `state:1453` (Jupiter A0), `state:1009`
  (boundary band); 588 edges; 45 guide labels; 598 nodes; two consecutive
  builds emit a byte-identical 382 KB network group (md5 match). Tier shapes,
  the fixed palette, and the polished guides follow in NET-102.
- NET-102 (tier shapes, palette, guides) shipped: `lib/nodeShapes.ts` ports
  the standalone's anchor polygons (A0 circle → D7 tridecagon), all satellite
  variants keyed by tier/forte/orientation, and the three typed boundary
  shapes. Dark-theme `--sg-*` colors were resolved to ten fixed tier hexes
  plus fixed boundary fills/strokes (no runtime `color-mix`). Network nodes
  now render as shape-agnostic translated SVG glyph groups with transparent
  hit targets; the island scales paths/polygons/rects/circles uniformly and
  still highlights the exact incident neighborhood. Guides gained seven
  alternating lane backgrounds and a boundary-band panel; tier and boundary
  palette legends added. Browser proof: 269 circles, 154 paths, 133 polygons,
  42 rects; all ten anchor shape/color pairs, all satellite variants, and all
  boundary variants verified; state:1001 hover scales four neighbors and
  highlights four edges; zero console errors. Entire `dist/index.html` is
  byte-identical across consecutive builds (md5 `65c6744c5c785acd97161e546032ce27`
  at verification time).
- NET-103 (all-598 non-state placement) shipped: the network canvas expanded
  to 1780×2120 and reserves lane headers for 7 offices + 7 profiles, a right
  rail for 38 families + 66 cycles, a post-boundary strip for 15 operators,
  and an `extensionId`-sorted top-right row for 3 candidates. Family rows are
  centroid-ordered with a 32px minimum gap; cycles align beside their family;
  `operator:M` is centered at (772, 2040), while every R/L pair is ±16px from
  its degree-governor lane. The layout now throws on missing/non-finite/
  out-of-viewBox positions, and non-state glyphs use explicit rings, markers,
  squares, and amber diamonds. Generated-HTML audit: all 598 positions present,
  no duplicates or out-of-bounds coordinates, and the nearest state/non-state
  pair is 29.5px apart. Desktop + 390px browser proof covers non-state hover,
  tooltip, candidate navigation, Grid round-trip, no horizontal overflow, and
  zero console messages. Consecutive builds produced byte-identical
  `dist/index.html` (SHA-256
  `434e0d3f1c2fea2c3c382c69076161465fc6f6702f994cdcb65d1aa7fde534f9`).
- NET-104 (structural edges + interaction) shipped: all 588 structural lines
  now use the standalone's 0.42 baseline opacity while retaining the fixed
  type colors and `4 3` SEAT_CONTACT dash. Verification exposed and fixed a
  latent SVG bug: assigning `.hidden` created inert JavaScript properties on
  SVG anchors/lines. `apply()` now toggles real `hidden` attributes. Browser
  proof: family-only shows 38 nodes and 0 edges; clear restores 598/588; Mars
  shows 45 nodes and exactly 50 edges, all with Mars endpoints. Hovering
  `state:1001` raises exactly four incident edges and scales neighbors
  997/637/3913/2001; pointer leave restores the baseline.
- NET-105 (toggle UX + defaults) shipped: the two controls are a bordered
  segmented group with an accent-filled active button, synchronized
  `data-active` and `aria-pressed`, and an active-view label on the topology
  section. The toggle now uses real SVG `hidden` attributes rather than inert
  `.hidden` properties. Network is visible in SSR markup and Grid is hidden;
  a JavaScript-disabled browser confirms the same default. Grid/Network
  round-trips update computed display, labels, and button state on desktop and
  at 390px with no horizontal overflow.
