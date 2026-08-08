# Capability Matrix and Roadmap

## Status vocabulary

- **Active / admitted** means the capability is present in the installed
  integrated release and covered by its runtime or release artifacts.
- **Active / unresolved** means a runtime object deliberately records an open
  semantic scope rather than an invented answer.
- **Companion utility** means this package can perform the task locally, but
  its output is not canonical until promoted upstream.
- **Candidate / not admitted** means this package specifies or validates a
  proposal that the active graph, server, and readiness contract do not use.

## Installed capability

| Capability | Status | Executable authority |
|---|---|---|
| Universal rooted heptatonic topology: 462 states | Active / admitted | `../../canonical/`, integrated-release QA, and topology Neo4j import |
| A0-A2 and D1-D7 anchor/satellite/boundary classification | Active / admitted | Canonical topology and identity definitions |
| Fixed-tonic, phase, contact, family, and office relationships | Active / admitted | Canonical topology and Neo4j projection |
| Neo4j topology projection | Active / admitted | `../../neo4j/schema.cypher` and `../../neo4j/import.cypher` |
| Fifteen structural mutation operators | Active / admitted derived audit | Mutation-audit registry, proof ledgers, and algebra import |
| Seven canonical office profiles and photonic records | Active / admitted | Canonical profile registry `0.1.1` |
| Fifteen semantic operator shells | Active / unresolved by design | Profile semantic registry; 60 unresolved-scope bindings |
| Landform domain projection and 40 references | Active / admitted | Profile registry `0.1.1` |
| Four materialized `CompiledFeatureProfile` normal forms | Active / admitted | Profile registry Neo4j projection |
| Creation-packet compiler | Active / admitted | Profile registry compiler/provider contract |
| `GET /api/creation-packet` | Active / admitted | `../../server.mjs`; `stateId` plus optional `domain=landforms` only |
| Route-aware direct compilation | Available in registry library/CLI, not exposed by HTTP | Profile registry compiler and fixture packets |
| Proposal-first Governor editor | Companion utility | This package's CLI and package-local baseline |
| Explanatory invariant catalog and Cypher workbook | Companion utility | This package; upstream artifacts remain authoritative |
| Natural-phenomenon office mappings | Candidate / not admitted | This package's proposal and physical citations only |
| Fivefold Court graph/controller | Candidate / not admitted | This package's model only; no active runtime service or readiness check |
| Mercury/Virgo observation ledger | Not implemented | Research/implementation proposal |
| Aggregate harmonic compression `C_H` | Active status is unresolved | Profile registry harmonic-measure definition |
| Domains beyond landforms | Not implemented | Future profile-registry admission |

The public endpoint is an installed implementation fact, not a host API merely
reported elsewhere. It requires Neo4j, returns the compiler's complete packet,
and currently returns `routeContext: null`.

## Recommended next sequence

### 1. Keep public contract parity explicit

Check documentation and consumers against:

- `ScaleState.id`, `ScaleFamily.forte`, and `GovernorOffice.officeIndex`;
- active topology, mutation, and profile relationship names;
- the profile registry's compiled-profile schema;
- the server's accepted query parameters and error bodies; and
- health/readiness counts that exclude unadmitted extensions.

### 2. Run the semantic admission loop

For one operator and one admitted domain:

1. name a candidate feature delta;
2. compile positive fixtures;
3. compile counterexamples;
4. compare route-equivalent destinations;
5. decide whether the effect is structural, route-contextual, or intrinsic;
6. admit, restrict, or reject it in the profile registry; and
7. version and rebuild the registry projection.

`R7` from Aeolian to Harmonic Minor is a useful first case because it sharply
tests the State-Governor/Degree-Governor invariant. Structural support alone is
not semantic-effect evidence.

### 3. Decide whether to expose route-aware HTTP compilation

The direct compiler already accepts route context, but the HTTP endpoint does
not. An API extension would need an explicit request schema, operator/route
validation, stable errors, tests proving route exclusion from
`intrinsicFingerprint`, and a versioned public-contract decision. Until then,
clients must not send route parameters to `/api/creation-packet`.

### 4. Evaluate candidate extensions separately

Fivefold and natural-phenomenon work should pass an admission process before
any import is treated as active:

- identify the owning framework and canonical source;
- decide whether the candidate is canonical, derived, contextual, or only a
  research hypothesis;
- version the accepted machine-readable artifact outside this companion;
- define migration and rollback behavior;
- integrate graph labels/relationships deliberately;
- decide whether packets and readiness expose the extension; and
- rebuild and validate the integrated release.

Running this package's `context-projection.cypher` is not that process.

### 5. Add one creation domain at a time

After landforms, choose one coherent domain such as architecture or materials.
Define its feature vocabulary, required/prohibited behavior, reference-pool
semantics, physical-variable contract, schemas, and regression fixtures in the
profile registry before exposing it through the server.

### 6. Investigate `C_H`

Do not begin by forcing a scalar. Export a harmonic feature table and test:

- monotonicity with anchor precedence;
- invariance under modal orbit;
- sensitivity to phase;
- separation of anchors, satellites, and boundaries;
- stability across tuning-dependent measures; and
- explanatory value for semantic or generative outcomes.

The result may be a vector, family of measures, or partial order rather than
one number.

## Promotion gates

A proposed semantic, algebraic, Fivefold, phenomenon, or domain rule can become
active only when:

- the owning upstream artifact is identified;
- its epistemic class and admission status are explicit;
- its domain and failure boundary are explicit;
- positive fixtures and counterexamples exist;
- physical and authored semantic claims remain separated;
- topology, mutation, profile, provider, and API impacts are evaluated;
- the decision and release fingerprint are recorded; and
- downstream graph, server, renderer, and validation artifacts are rebuilt.

## What not to build yet

- an automatic rule miner that promotes correlations directly into canon;
- a single "energy" score mixing `C_P`, `C_H`, `C_S`, and candidate Court state;
- mutation semantics inferred only from Degree Governor names;
- an LLM allowed to edit canonical Neo4j nodes;
- global commutation claims based on one square;
- physical simulations without variables, units, and boundary conditions; or
- API fields and readiness counts for candidate extensions before admission.
