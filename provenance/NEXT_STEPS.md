# Recommended Next Steps

Current release: `seven-governors-integrated-1.8.0`, closed at fixed point 2026-08-27, no further emissions this cycle.

**Fixed-point declaration:** `1.8.0` closed at fixed point; `681` geometry correction (`OBS-011` punched holes `{10,2}`) folded into this point; `OBS-014` queued. Next emissions are `planning_evidence` only.

## Queued — OBS-014 — twin-hub convergence audit (untested)

Twin-hub convergence at the `A2` boundary: `D4` (`7-Z17`, `2× A1-sat`) and `D5` (`7-Z12`, `2× A2-sat`) seat contacts should route through `T₁`-twin satellites converging via Mercury hub. **Tier asymmetry:** at `A2` twins share Mercury hub and midpoints `{Mars,Jupiter}` are **unseated** (`field closes its own seams from below` — strongest hypothesis); at `A1` twins `{Moon–Saturn, Sun–Venus}` are disjoint (no hub) and midpoints `{Sun,Saturn}` already seated as `A1` seams — so `D4` = convergence-through-twins, `D5` = convergence-onto-unseated-midpoints. Falsifiable from ledger data (`seat-contact.csv` + `constructionEdges` + `T₁` `transpose_mask 1`).

## Queued — q_v2 design for D-tier compression

Domain cracks already documented (`1447→(2,7)` `2859→(3,8)`; interval-class basis, inversion-aware). Design before needed, not during.

## Queued — FM/DFG variant-C (declared β, chiral sideband typing)

Proposed, no urgency — true FM `β` Bessel sidebands, declared `β`, chiral typing.

## Queued — CRT-310 namespace question

Whether `shadow.*` coordinates ever get admitted or stay proposed forever — a decision, not an audit.

## Queued — Intersection lattice d=3/d=4 strata

Prose only: `d=3→4` consecutive fifths, `d=4→3` (quartal/sus, not tertian triads) — not strata of this lattice.

---

Current release: `seven-governors-integrated-1.6.0` was the prior baseline.
The release includes the audited topology, mutation algebra, canonical profile
registry/compiler, Governor runtime, bounded Pentatonic Court, read projection,
agent skills, optional read-only vault context, GOV-210 availability/housing,
GOV-211 presentation-only assignment-aware menu organization, GOV-213's scoped
A0-A2 harmonic-compression sidecar, and GOV-227's scoped D1-D7 q_v2 sidecar.

## 1. Establish the full database

Release 1.6 changes no graph payload, but its `release.json` provenance identity
is newer than the retained 1.5 Neo4j baseline. At the next Neo4j availability,
use `npm run bootstrap:neo4j` with `NEO4J_URI`, `NEO4J_USERNAME`,
`NEO4J_PASSWORD`, `NEO4J_IMPORT_DIR`, and optional `NEO4J_DATABASE`, then
capture the new provenance namespace and normalized snapshot. Do not claim
current-release baseline parity before that refresh.

## 2. Use explanation-first queries

Begin with queries that answer:

- Why does this state occupy its office?
- Which selected parent governs this satellite?
- Which contacts support this convergence?
- Why is this boundary state categorically withheld?
- Which operator applied to which state, and does its inverse witness pass?
- Which release and document define the applicable rule?

Examples are available in `neo4j/example-queries.cypher`,
`neo4j/integrated-example-queries.cypher`, the mutation audit's
`algebra-validation.cypher`, and the companion's query cookbook.

## 3. Serve the API and check parity

`npm run check:neo4j` inspects topology, mutation, and semantic counts;
`npm start` serves the graph and `GET /api/creation-packet`. `GET /ready.json`
returns `503` unless all parity groups pass.

## 4. Prove round-trip reproducibility

After the deferred baseline refresh, run `npm run verify:neo4j:roundtrip`
against the deployed database and retain the normalized snapshot fingerprint.
Then `npm run test:neo4j:full` independently proves that two clean imports
produce identical bytes and that no canonical topology record, mutation ID,
semantic ID, or projection fingerprint is lost or invented.

## 5. Preserve bounded admission

The bounded Court remains admitted by CRT-309 through
`provenance/court-admission-release.json`. CRT-310 tracks the remaining 35 pentatonic classes,
broader Fivefold controller claims, natural-phenomenon, and thermodynamic models
remain proposed work. Any expansion still requires a new versioned release that:

- moves or references schemas from the root authority namespace;
- updates source-authority records and adds release provenance;
- versions Neo4j node identities and adds imports and validation;
- includes them in readiness checks, explorer presets, and creation packets
  where appropriate; and
- records the decision in this ledger.

CRT-302's versioned pentatonic substrate registry is complete at
`seven-governors-court-substrate-v0.1.0`. CRT-303's versioned invariant
registry and independent Carey enumerator are complete at
`seven-governors-harmonic-invariants-v0.1.0`. CRT-304's versioned filter
algebra and complete commutation evidence are complete at
`seven-governors-court-filter-algebra-v0.1.0`. CRT-305's runtime policy,
route-event/translocation lifecycle, semantic replay, and external session
store are complete under `schemas/court-runtime-policy.json` and
`src/governor/court_runtime.py`. CRT-306 projection schema v2 now independently
replays those sessions and exposes terminal state plus ordered verified events
through six bounded read-only queries. CRT-307 supplies five replay-bound Court
skills. GOV-208 and CRT-308 now supply bounded read-only context with exact
disabled parity, and CRT-309 records the narrow admission. Do not edit frozen
package or companion Fivefold bytes in place.

## 6. Preserve assignment-aware menu boundaries

GOV-210 and GOV-211 are complete. Consume assignments only through the two
bounded target queries and treat GOV-211 `presentationOrder` as guidance, never
as runtime legality. Keep host topology-binding keys outside requests and
responses; preserve full replay identity in every binding; and retain exact
fallback order whenever assignment evidence is absent or invalid. Any new skill,
assignment basis, target namespace, query, or ordering policy requires a
versioned policy and fresh admission evidence.

## 7. Extend harmonic compression only through separate evidence

GOV-213 admits q_v1 `Q(S)` and `W_A012(S)` for 21 A0-A2 anchors. GOV-227
separately admits q_v2 `Q(S)` and `W_D17(S)` for 49 D1-D7 anchors. The finite
Governor Seat Invariant holds across all 70 anchors, but scalar bands interleave
and cannot resolve tier identity; consume the graph topology and declared
precedence rules for tier resolution. Global `harmonic.C_H` remains null.
Future work may independently test satellites and boundaries, all 15 operator
deltas, and `C_P`/`C_H`/`C_S` correspondence.

The Neo4j baseline remains the retained release 1.5.0 baseline because release
1.6.0 changes no graph data. Refresh it at the next Neo4j availability before
claiming current-release round-trip evidence.

## 8. Version every protocol change

Create a new `AuditRelease` and a new integrated release whenever a
qualification rule, precedence rule, operator, or canonical assignment
changes. Presentation-only changes can retain the same topology release.
