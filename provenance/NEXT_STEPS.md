# Recommended Next Steps

Current release: `seven-governors-integrated-1.9.0-dev`, opened on `main` 2026-08-29.

**Development declaration:** `1.8.1` remains the sealed Neo4j baseline with separate native reproducibility and configured bootstrap/roundtrip receipts. `1.9.0-dev` plans bounded research and interface work on `main`; `681` geometry correction (`OBS-011` punched holes `{10,2}`) remains folded into the prior point. Sprint 2 closed `OBS-014` (twin-hub convergence, verdict `confirmed`, GOV-510), emitted the 462-record fifth-space census (GOV-511, verdict `confirmed`), and shipped the A-series evidence inspector bundle (ORR-511). No development emission changes canonical topology, admission, runtime authority, Court policy, or global `harmonic.C_H` without its own versioned evidence and release decision.

## Sprint 2 closure — shadow-ladder rebuild receipt — 2026-09-01

The S2→S3 boundary rebuild is owned by GOV-511 (primary) per the kickoff directive. Post-GOV-512 regeneration refreshed `canonical/fivefold-incubator/shadow-ladder-v0.json` to candidate fingerprint `2f2d59dba73f0d8c87de2c6bb95e16ac507f65742ec12c90a96c2388334428ab`; `npm run validate:shadow-ladder` re-verified `qa/shadow-ladder-validation.json` at 37/37 (report fingerprint `adabef8d6739a2dd9add17113dc3b18e176d647a655667979cf9e259635a0788`). Refreshed ledger SHAs bound by the regenerated artifact: `decisionLedgerSha256` `7a3d3236cb4cf1cf8bc54756c72111dac9cb3455197a8b9343b298184f53bdb7`, `observationLedgerSha256` `1fcdc4bcad1a5d7fa6198a40c312297dc4e970edd425c1471e1080d79b143978` (the ledger itself stays fingerprint-free — DAG: ledger → sidecar). Sprint 2 research artifacts: twin-hub `canonical/fivefold-incubator/twin-hub-convergence-v0.json` and fifth-space census `canonical/fivefold-incubator/fifth-space-census-v0.json` — each derived from the post-edit ledger SHAs and validated by their own qa receipts.

## Queued — Validation census scope seam (known, not a defect)

`docs/VALIDATION_CENSUS.md` shows 418 (`qa/integrated-release-validation.json`, integrated release validation — distinct scope: topology/audit/runtime/Court/Neo4j/manifest) vs per-validator column sum 120 (14+15+37+17+12+7+18) — not summable; precedent `411+15+14+1 ≠ 414` (the 1.8.0 close-out's planning arithmetic never matched the emitted 414; per-validator and integrated scopes differ by construction). Minimal fix is scope note in census doc (prose block); optional future GOV may derive the integrated 418's own composition as done for per-validator counts.

## Queued — OBS-014 — twin-hub convergence audit (resolved Sprint 2, GOV-510)

Twin-hub convergence at the `A2` boundary: `D4` (`7-Z17`, `2× A1-sat`) and `D5` (`7-Z12`, `2× A2-sat`) seat contacts should route through `T₁`-twin satellites converging via Mercury hub. **Tier asymmetry:** at `A2` twins share Mercury hub and midpoints `{Mars,Jupiter}` are **unseated** (`field closes its own seams from below` — strongest hypothesis); at `A1` twins `{Moon–Saturn, Sun–Venus}` are disjoint (no hub) and midpoints `{Sun,Saturn}` already seated as `A1` seams — so `D4` = convergence-through-twins, `D5` = convergence-onto-unseated-midpoints. Falsifiable from ledger data (`seat-contact.csv` + `constructionEdges` + `T₁` `transpose_mask 1`).

**Resolved:** verdict `confirmed` — recorded as `provenance/OBSERVATION_LEDGER.md:OBS-014`, artifact `canonical/fivefold-incubator/twin-hub-convergence-v0.json`, receipt `qa/twin-hub-convergence-validation.json` (28/28 chains valid, A2 hub Mercury, midpoints seated/unseated exactly as spec'd). GOV-512 consumes the artifact, not prose.

## Queued — fivefold-capability-teleology regeneration (known stale)

`canonical/fivefold-capability-candidates/fivefold-capability-teleology-v1.json` binds `provenance/SOURCE_AUTHORITY.md` at sha `7420bbcc…`, but the file has been at `b27e9a23…` since the 1.9.0-dev cycle open (`4a3989f`); the teleology tests were failing at HEAD before Sprint 2. Regeneration was not applied in Sprint 2 (out-of-directive); queue the rebuild plus a recommendations review of hard-coded source pins (same class as the promotion-evidence ledger pin, which Sprint 2 refreshed because its own ledger edit invalidated it).

## Queued — ORR-522 fifth-space census consumption

`canonical/fivefold-incubator/fifth-space-census-v0.json` (462 records, `fifthMask` integers, `records[]` ungated by `researchVerdict`) is the Sprint 2 dataset ORR-522 consumes in the Taxonomy Explorer workstream. The research verdict (`FSC-RQ-001`, `confirmed`) is structurally non-gating; treat span measurements as descriptive, never as a D-tier ranking.

## Queued — q_v2 design for D-tier compression

Domain cracks already documented (`1447→(2,7)` `2859→(3,8)`; interval-class basis, inversion-aware). Design before needed, not during.

## Queued — FM/DFG variant-C (declared β, chiral sideband typing)

Proposed, no urgency — true FM `β` Bessel sidebands, declared `β`, chiral typing.

## Queued — CRT-310 namespace question

Whether `shadow.*` coordinates ever get admitted or stay proposed forever — a decision, not an audit.

## Queued — Intersection lattice d=3/d=4 strata

Prose only: `d=3→4` consecutive fifths, `d=4→3` (quartal/sus, not tertian triads) — not strata of this lattice.

---

The retained Neo4j baseline is closed release `seven-governors-integrated-1.8.1`.
The release includes the audited topology, mutation algebra, canonical profile
registry/compiler, Governor runtime, bounded Pentatonic Court, read projection,
agent skills, optional read-only vault context, GOV-210 availability/housing,
GOV-211 presentation-only assignment-aware menu organization, GOV-213's scoped
A0-A2 harmonic-compression sidecar, and GOV-227's scoped D1-D7 q_v2 sidecar.

## 1. Establish the full database

Release 1.9.0-dev retains the 1.8.1 Neo4j baseline without changing graph
payload. The native reproducibility receipt and separately configured
bootstrap/roundtrip receipt remain in `qa/`; refresh both before a 1.9.0 close
claims parity for changed provenance or projected data.

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

For a future release-closing refresh, run `npm run verify:neo4j:roundtrip`
against the configured deployment and retain the normalized snapshot
fingerprint. Then `npm run test:neo4j:full` independently proves that two clean
imports produce identical bytes and that no canonical topology record,
mutation ID, semantic ID, or projection fingerprint is lost or invented.

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

The 1.8.1 Neo4j baseline is retained through the 1.9.0-dev cycle. A future
provenance or projected-data change requires fresh native reproducibility and
configured bootstrap/roundtrip evidence before claiming 1.9.0 round-trip
parity.

## 8. Version every protocol change

Create a new `AuditRelease` and a new integrated release whenever a
qualification rule, precedence rule, operator, or canonical assignment
changes. Presentation-only changes can retain the same topology release.
