# Graph and Compiler API

This is a descriptive guide to the installed integrated-release runtime. The
installed Neo4j import/schema files, profile registry, compiler, and
`../../server.mjs` are the executable contract; this companion is not a second
graph specification.

## Public graph vocabulary

Graph property names and creation-packet JSON names are different contracts.
Use the exact graph names in Cypher:

| Active label | Identity / key properties | Notes |
|---|---|---|
| `ScaleState` | `id`, `nodeId` | `forte`, `bit`, `pitchSet`, `role`, `fineRole`, `tier`, `office`, and `officeIndex` are projected topology properties |
| `ScaleFamily` | `forte` | One projection node for each Forte Tn/I family |
| `GovernorOffice` | `name` | Ordered by `officeIndex`; also has `canonicalScaleId` and `canonicalMode` |
| `MutationOperator` | `id` | Structural audit node; applications use `MODAL_MUTATES_TO` or `LOCAL_MUTATES_TO` |
| `RegistryRelease` | `release_id` | Active profile-registry release and source fingerprint |
| `CanonicalFeatureProfile` | `profile_id` | Active office profile; graph properties are snake_case, including `office_index`, `canonical_state_id`, and `fingerprint` |
| `CompiledFeatureProfile` | `normal_form_id` | Materialized destination/domain normal form; uses `state_id` and `intrinsic_fingerprint` |
| `AuditRelease` | `releaseId` | Integrated topology release provenance |
| `FrameworkDocument` | `documentId` | Hashed installed framework/machine-registry source |
| `InvariantDefinition` | `invariantId` | Provenance projection of declared topology invariants |

The HTTP packet intentionally uses camelCase, for example
`state.stateId`, `state.forteFamily`, `resolution.officeIndex`,
`canonicalProfile.profileId`, `normalFormId`, and `intrinsicFingerprint`.
`ScaleState.stateId`, `ScaleState.forteFamily`, `ScaleFamily.forteFamily`, and
`GovernorOffice.officeOrder` are not installed graph properties.

The active semantic projection also contains `PhotonicRecord`,
`FeatureDefinition`, `HarmonicMeasureDefinition`, `SemanticOperator`,
`SemanticUnresolvedScope`, `DomainProjection`, `LandformReference`,
`DerivationRoute`, `DerivationStep`, and `ValidationFixture`.

## Active relationships

### Topology projection

| Relationship | Direction | Meaning |
|---|---|---|
| `GOVERNS` | parent state -> satellite state | Selected categorical office inheritance |
| `CONSTRUCTS` | endpoint state -> anchor state | A-series construction evidence; not recursive inheritance |
| `SEAT_CONTACT` | state -> state | D-series office-authorizing evidence under the declared family rule |
| `MODAL_SUCCESSOR` | state -> state | Canonically projected modal-orbit successor |
| `AUDITED_HAMMING2` | state -> state | Historical fixed-tonic Hamming-2 relation |
| `PHASE_SHIFT` | state -> state | Adjacent-root displacement relation |
| `CONVERGENCE_CONTACT` | state -> boundary state | Non-categorical same-office boundary evidence |
| `JUNCTION_CONTACT` | state -> boundary state | Non-categorical mixed-office boundary evidence |
| `LEAF_CONTACT` | state -> boundary state | Non-categorical single-contact evidence |
| `BELONGS_TO_FAMILY` | state -> family | Forte-family projection |
| `OCCUPIES_OFFICE` | state -> office | Categorical office projection |
| `RELATIONAL_OFFICE_EVIDENCE` | boundary state -> office | Aggregated evidence only; never a seat |

### Mutation and profile projections

| Relationship | Direction | Meaning |
|---|---|---|
| `MODAL_MUTATES_TO` | state -> state | Total formal `M` application from the mutation audit |
| `LOCAL_MUTATES_TO` | state -> state | Partial formal `R1`-`R7` or `L1`-`L7` application |
| `HAS_CANONICAL_PROFILE` | office -> canonical profile | Historical profile association |
| `ACTIVE_PROFILE` | office -> canonical profile | Runtime profile selected for the active release |
| `CANONICALIZED_BY` | canonical profile -> state | Profile's canonical scale state |
| `HAS_PHOTONIC_RECORD` | canonical profile -> photonic record | Versioned physical anchor and derived quantities |
| `HAS_FEATURE` | canonical profile -> feature definition | Typed profile assertion |
| `REFERENCES_LANDFORM` | canonical profile -> landform reference | Selectable reference-pool entries for the admitted landform projection |
| `ACTIVE_SEMANTIC_OPERATOR` | mutation operator -> semantic operator | Runtime semantic shell selected for a structural operator |
| `REALIZES` | semantic operator -> mutation operator | Historical structural binding |
| `HAS_UNRESOLVED_SCOPE` | semantic operator -> unresolved scope | Explicitly unresolved semantic effect category |
| `PROJECTS_FEATURE` | domain projection -> feature definition | Domain contract binding |
| `HAS_NORMAL_FORM` | state -> compiled profile | Materialized destination/domain packet normal form |
| `PART_OF_RELEASE` | semantic/profile node -> registry release | Release membership |
| `PRODUCES` | derivation route -> compiled profile | Route resolves to a route-independent normal form |
| `HAS_STEP` | derivation route -> derivation step | Ordered route provenance |
| `STARTS_AT` / `ENDS_AT` | derivation step -> state | Step endpoints |
| `APPLIES` | derivation step -> semantic operator | Semantic shell associated with the structural step |
| `TESTS_ROUTE` | validation fixture -> derivation route | Structural or normalization fixture evidence |

### Provenance projection

| Relationship | Direction | Meaning |
|---|---|---|
| `INCLUDES_DOCUMENT` | audit release -> framework document | Source included by the integrated release |
| `DECLARES_INVARIANT` | audit release -> invariant definition | Invariant declared by the release |
| `DEFINED_BY` | invariant definition -> framework document | Upstream definition provenance |

`PhenomenonModel`, `CourtState`, `PRIMARY_PHENOMENON`, and
`COURT_TRANSITION` belong only to this companion's optional candidate context
projection. They are not admitted active labels or relationships and are not
part of runtime readiness.

## Public creation-packet request

The installed server exposes exactly:

```http
GET /api/creation-packet?stateId=1749&domain=landforms
```

Request rules:

- `stateId` is required exactly once and must be decimal digits representing a
  JavaScript safe integer.
- `domain` is optional at most once; omission or an empty value defaults to
  `landforms`.
- `landforms` is the only supported domain in the installed release.
- every other query parameter is rejected.
- only `GET` is accepted.

The endpoint requires a configured Neo4j connection. It does not compile from
the embedded graph snapshot when Neo4j is unavailable.

## Response contract

The response is the profile registry's compiled packet, not the renamed shape
previously shown by this guide. Its required top-level fields are
`schemaVersion`, `compilerVersion`, `releaseId`, `normalFormId`, `state`,
`resolution`, `canonicalProfile`, `photonic`, `harmonic`, `semantic`,
`domainProjection`, `creationConstraints`, `provenance`,
`intrinsicFingerprint`, `fingerprintInputCanonicalJson`, and `routeContext`.
Selected portions of the Acoustic response are shown below; only the long
canonical fingerprint-input string and the four described sections are elided.

```json
{
  "schemaVersion": "1.0.0",
  "compilerVersion": "0.1.1",
  "releaseId": "canonical-profile-registry:0.1.1",
  "normalFormId": "nf:scale:1749:landforms:v0.1.1",
  "state": {
    "stateId": 1749,
    "name": "Acoustic",
    "forteFamily": "7-34",
    "bit": "b101010110110",
    "pitchSet": "{0,2,4,6,7,9,10}",
    "role": "anchor",
    "fineRole": "anchor_A1",
    "tier": "A1",
    "chirality": "achiral",
    "orientation": "7-34 single orientation",
    "assignmentStatus": "validated",
    "resolutionClass": "validated_A1_anchor"
  },
  "resolution": {
    "office": "Moon",
    "officeIndex": 1,
    "officeBearing": true,
    "officeBasis": "validated A0 midpoint/phase-seam construction"
  },
  "canonicalProfile": {
    "profileId": "profile:moon:v0.1.1",
    "releaseId": "canonical-profile-registry:0.1.1",
    "office": "Moon",
    "canonicalStateId": 2741,
    "intrinsicFingerprint": "c4d2ede73648b2482b0dcc063b340a2665dcbf8816044734738eaac31258aede"
  },
  "creationConstraints": {
    "required": [
      {
        "featureId": "harmonic.scale_state",
        "value": 1749,
        "reason": "Intrinsic rooted state identity."
      },
      {
        "featureId": "semantic.governor_office",
        "value": "Moon",
        "reason": "Resolved State Governor."
      },
      {
        "featureId": "semantic.thermodynamic_function",
        "value": "reception",
        "reason": "Canonical office process correspondence."
      },
      {
        "featureId": "semantic.directionality",
        "value": "inward_centripetal",
        "reason": "Canonical office orientation."
      }
    ],
    "softPriors": [
      {
        "featureId": "semantic.archetypal_role",
        "value": "the experience of reality",
        "reason": "Guide salience and interpretation without requiring literal depiction."
      }
    ],
    "referencePool": [
      {
        "poolId": "landforms:moon:canonical",
        "featureId": "domain.landforms",
        "candidates": ["lakes", "ponds", "tidal pools", "estuaries", "marshes", "foggy valleys"],
        "selectionRule": "select_zero_or_more_without_implying_exhaustiveness",
        "authority": "framework_declared_reference_library"
      }
    ],
    "promoted": [],
    "suppressed": [],
    "prohibited": [
      {
        "featureId": "physical.musical_to_optical_causation",
        "reason": "A musical mutation does not physically alter the representative wavelength."
      },
      {
        "featureId": "semantic.unproven_operator_effect",
        "reason": "No promote/suppress/transform claim may be added without semantic admission evidence."
      }
    ],
    "unresolved": ["operator_specific_semantic_delta_if_a_route_is_applied"],
    "creativeAffordances": [
      "composition",
      "scale",
      "weather",
      "material",
      "viewpoint",
      "inhabitants",
      "surface detail"
    ]
  },
  "provenance": {
    "releaseId": "canonical-profile-registry:0.1.1",
    "providerContract": "1.0.0",
    "providerUsed": "neo4j",
    "providerExcludedFromIntrinsicIdentity": true,
    "stateAuthority": "audited topology",
    "canonicalProfileAuthority": "active versioned canonical profile",
    "projectionAuthority": "projection:landforms:v0.1.1",
    "compiler": "scripts/compiler.mjs"
  },
  "intrinsicFingerprint": "8077327cc0f809b85ab5379daefb0ab0dd61f4f7f1e52baf0e2020a68054652c",
  "fingerprintInputCanonicalJson": "{...}",
  "routeContext": null
}
```

The omitted top-level sections are `photonic`, `harmonic`, `semantic`, and
`domainProjection`. `domainProjection` repeats the domain-oriented values as
`requiredFeatures`, `softPriors`, `referencePool`, `promotedFeatures`,
`suppressedFeatures`, `prohibitedFeatures`, `unresolvedFeatures`,
`creativeAffordances`, and `renderingBrief`.

The compiled schema requires `resolution.office` and
`resolution.officeBearing`; additional resolution metadata is emitted only
when the selected provider projects it. In particular, the installed topology
graph projects `officeBasis` but not `officeStatus`.

The arrays are semantically distinct:

| `creationConstraints` field | Element shape / behavior |
|---|---|
| `required` | feature objects that must be addressed |
| `softPriors` | feature objects guiding salience without literal requirement |
| `referencePool` | pool objects whose candidates may be selected zero or more times |
| `promoted` | feature objects with admitted increased salience; empty in `0.1.1` |
| `suppressed` | feature objects with admitted reduced salience; empty in `0.1.1` |
| `prohibited` | feature objects requiring rejection or repair |
| `unresolved` | string identifiers for unanswered feature scopes |
| `creativeAffordances` | string names of renderer-controlled variables |

Boundary states return `200` when their topology identity exists. Their
`canonicalProfile` and `photonic` values are `null`, semantic status is
`unresolved_boundary_semantics`, and the landform projection prohibits an
implicit office assignment.

## Route boundary

The profile registry's direct compiler API and file-backed CLI can accept a
route and return a populated `routeContext`. The installed HTTP endpoint does
**not** expose route-aware compilation: it does not accept `sourceStateId`,
`sourceId`, `operatorId`, `operator`, `routeId`, or an operator sequence. Such a
parameter is unknown and produces the endpoint's `400` validation response.
Consequently, successful HTTP responses currently have `routeContext: null`.

This distinction does not invalidate the bundled route fixtures. They prove
structural/normalization behavior in the profile registry; they are not public
HTTP request options and do not admit operator-specific semantic effects.

## Compilation and fingerprint behavior

For a valid HTTP request, the server:

1. requires the configured Neo4j graph;
2. resolves `ScaleState.id` through `Neo4jRegistryProvider`;
3. resolves the state's
   `(:GovernorOffice)-[:ACTIVE_PROFILE]->(:CanonicalFeatureProfile)` and
   `HAS_PHOTONIC_RECORD` when the state is seated;
4. resolves the requested release's `DomainProjection`;
5. compiles the landform packet and preserves unresolved semantic scopes;
6. hashes the normalized intrinsic object; and
7. returns no route context.

`intrinsicFingerprint` is a lowercase 64-character SHA-256 digest. Its input
includes release/compiler identity, destination state, office resolution,
canonical profile, photonic/harmonic/semantic sections, domain projection,
creation constraints, and provenance. `providerUsed` is normalized to `null`
for the hash, so equivalent file, snapshot, and Neo4j providers can agree.
Route context is added only after hashing and is excluded. Renderer state,
database connection details, query timing, and cache status are not packet
identity.

## HTTP errors

The public endpoint returns simple JSON error objects, not the candidate typed
error-code table formerly described here:

| Status | Body | Condition |
|---:|---|---|
| `400` | `{"error":"Expected one decimal stateId and an optional domain parameter"}` | missing/repeated/malformed `stateId`, repeated `domain`, or any unknown parameter |
| `400` | `{"error":"stateId must be a safe integer and domain must be landforms"}` | unsafe integer or unsupported domain |
| `404` | `{"error":"ScaleState not found"}` | no graph state with that ID |
| `405` | `{"error":"Method not allowed"}` | method other than `GET`; response includes `Allow: GET` |
| `503` | `{"error":"Neo4j is not configured"}` | connection environment is absent |
| `503` | `{"error":"Semantic registry unavailable"}` | Neo4j or active-profile resolution is unavailable |
| `500` | `{"error":"Creation packet failed"}` | other compiler failure; details remain server-side |

## Health and readiness

`GET /health.json` reports the immutable snapshot and current Neo4j inspection;
`GET /ready.json` returns `503` unless topology, mutation, and profile-registry
parity checks all pass. `?refresh=1` reruns inspection. Current expected active
semantic counts are seven canonical/active profiles, seven photonic records,
one domain projection, fifteen semantic shells and structural bindings, sixty
unresolved-scope bindings, forty landform references, and four materialized
compiled normal forms.

Fivefold and phenomenon counts are intentionally absent from readiness because
those companion extensions have not been admitted to the installed release.
