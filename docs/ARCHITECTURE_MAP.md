# Repository Cross-Layer Architectural Map

**Maintenance rule:** This map reflects repo state as of its landing commit; re-verify tier/status columns after any admission ceremony or new artifact class.

**Status of this document:** sprint artifact. It makes no claims, carries no evidence obligations, and creates no receipts. It is a structural index: every statement below cites the artifact that owns it. A statement without a resolvable receipt does not belong here.

**Scope and collision disambiguation.** This map indexes *node universes and their edge algebras* — four structural layers. It is not the same "four layers" as either existing scheme:

| Existing scheme | What it describes | Where |
|---|---|---|
| Authority pipeline | audit → canonical release → Neo4j projection → renderer | `docs/FOUR_LAYER_FORMALIZATION.md:1-13`; `docs/START_HERE.md` ("The four formal layers") |
| Implementation stack | six layers: substrate, profiles, topology, mutation, domain, runtime | `framework/CANONICAL_FEATURE_PROFILES_AND_MUTATION_ALGEBRA.md:218-236` |
| **This map** | heptatonic universe / bipartite containment / pentatonic space / engagement substrate | this document |

## Status legend

| Label | Meaning |
|---|---|
| **admitted** | GOV/CRT admission landed with a receipt or ledger entry |
| **audited** | exhaustive structural audit passes; no semantic, topology, or office promotion implied |
| **planning_evidence** | deterministic artifact, byte-stable, test-pinned; admission effect none |
| **proposed / proposed_pending_crt_309** | registered for closure; blocked from canonical or runtime use |
| **gated** | type contract defined; concrete instantiation deliberately deferred |
| **prose** | document-level description or fragment only; no executable admission |

---

## 1. The four structural layers

### Layer 1 — Heptatonic universe (462 rooted nodes)

- **Domain:** rooted weight-7 pitch-class sets containing pc 0 (462 = C(11,6)).
- **Edge semantics:** intra-family transitions; owned by algebra #1 (`M`, `R1–R7`, `L1–L7`).
- **Status:** canonical release admitted; structural audit allPass.
- **Primary artifacts:**
  - `canonical/universal-network-data.json` — schema `4.0.0-universal-heptatonic`; `nodes: 462`; summary `registeredStates: 462`, `officeNetworkStates: 308`, `boundaryStates: 154`, `structuralEdges: 588`, `fieldEdges: 760`, `boundaryRelationEdges: 476`.
  - `canonical/universal-heptatonic-ledger.json` (462 entries) and `canonical/universal-heptatonic-ledger.csv` (462 data rows).
  - Projections: `neo4j/csv/scale-states.csv` (462 rows); `neo4j/validation.cypher:4-9` (expects 462); `graph/index.html:167,199` ("462 states"; 308 seated + 154 typed boundary).
- **Boundary note:** the numerals `66` and `38` recur on both sides with different meanings; never carry a count across layers without its quotient name (see §3).

### Layer 2 — Bipartite containment (330 ↔ 462)

- **Domain:** directed containment edges pentatonic node (P) ↔ heptatonic node (H), i.e. P ⊂ H.
- **Edge semantics:** pure mathematical set inclusion. No algebra owns these edges; they are given by membership.
- **Status:** **planning_evidence** (both artifacts; `status: planning_evidence` asserted by test).
- **Primary artifacts:**
  - `derived/hypergraph/bipartite-inclusion-v1.json` — `heptatonicNodes` 462, `pentatonicSubnodes` 330; every heptatonic node has `subnodes` length 15; every pentatonic node has `parentsRooted` length 21; `metadata.bridgeCensus.totalBridgeSubnodes: 70`; `isCornerstone` true on 5 nodes (the five 5-35 positions).
  - `derived/hypergraph/parallel-signatures-v1.json` — `pentatonicSignatures` 330, `pentatonicClassProfiles` 66 (= `metadata.totalTnOrbits`).
  - Generators: `scripts/generate_hypergraph_matrix.py`, `scripts/analyze_parallel_signatures.py`.
- **Census:** 70 bridge subnodes out of 330, across 8 bridge set-classes (`metadata.bridgeCensus.bySetClass`); `bridgeSpanCensus` records 55 spanning diatonic and harmonic minor, 15 without.
- **Consumers:** algebra #3 and #9 (filter/bridge mediation); BL-023 route catalog cites this layer rather than embedding it.

### Layer 3 — Pentatonic inter-node space (330 rooted nodes)

- **Domain:** rooted weight-5 pitch-class sets containing pc 0 (330 = C(11,4)).
- **Edge semantics:** **undefined globally. Tier 2 — the project's one known structural gap** (BL-024 capture, §4). Fragments exist in registered substrate artifacts: the `T5` root cycle, the five `C0–C4` 5-35 positions, and the 5-23 / 5-27 bridge rootings.
- **Status:** fragmentary. No global intra-330 adjacency artifact exists anywhere in the repo.
- **Primary artifacts (fragments):**
  - `seven-governors-court-substrate-v0.1.0/canonical/substrate-registry-release.json` — `integratedAdmission: proposed_pending_crt_309`; two `admitted-bridge` rootings (5-23, 5-27) with `integratedEffect: none_until_crt_309`; complement map is frozen evidence, not an active relation.
  - `seven-governors-court-filter-algebra-v0.1.0/canonical/filter-algebra-release.json` — `integratedAdmission: proposed_pending_crt_309`; canonical outputs include the commutation table and non-commutation records.
  - `docs/PENTATONIC_GRAPH_BINDING_AUDIT_SPEC.md:4,6` — Phases 0–1 complete; Phases 2–4 **not started**; planning evidence only.
  - `scrum/CRT-310-remaining-pentatonic-admission.md` — the per-class admission item for the remaining pentatonic classes.
- **Consumers:** algebra #5 (5-35 kernel positions); algebra #6 per-node instances remain a proposal (`scrum/plan/fivefold-mesh-spec-v3.md:135-138`).

### Layer 4 — Engagement substrate (16 states)

- **Domain:** 4-bit engagement configurations of the four elemental governors (MSB-first b3 Mars/Fire, b2 Jupiter/Air, b1 Venus/Water, b0 Saturn/Earth); 12 on-path states plus a 4-state still set.
- **Dynamics:** the Q overlay (#6); the five-position engine (#5) is the `C0–C4` path through the same field.
- **Status:** prose admission (SPEC-001 v0.2.1, document-only with deferrals); concrete Q table **gated**; ENTRY 13 correspondence admitted narrowly.
- **Primary artifacts:**
  - `src/fivefold/quintessence.py:1,16-28,37-41` — `TRAVERSAL_CYCLE=(0,7,2,9,4,11,6,1,8,3,10,5)`, `STILL_SET=(12,13,14,15)`, generated 12×16 table.
  - `docs/specs/fivefold_constructs_engine_spec.md` — type contract `Q:Z12→(16→16)` `[DEFINED]`; concrete table and overlay correspondence `[GATED]` (§6 items 2 and 4).
  - `docs/specs/fivefold-court-engagement-correspondence-v0.1.0.md` — `engagement-Cn = position-Cn` admitted at configuration level only.
  - `provenance/DECISION_LEDGER.md:2490-2565` (ENTRY 13) and `qa/specs/bl-011-correspondence-admission.json` (GOV-522, 2026-09-25) — the admission receipts.
- **Architectural boundary:** the Q engine operates strictly on the 16-state substrate. It does **not** model transitions between distinct 330 pentatonic nodes. The admitted correspondence identifies configurations, not trajectories: the Q1 orbit order bears no asserted relationship to Court register moves (`docs/specs/fivefold-court-engagement-correspondence-v0.1.0.md:95-99`).

---

## 2. Operator and algebra catalog

The user-facing phrase "the mutation algebra" resolves to **eleven distinct systems** plus one precursor roadmap. Each row states what it owns, what it reads, and how far its formalization has gone.

**Mechanical ownership rule:** an algebra may emit edges only in its *Owns edges in* column. Entries in *Consumes layer* are reads. Each new algebra gets a row here before it may emit edges.

| # | System | Owns edges in | Consumes layer | Status | Key artifacts (receipts) |
|---|---|---|---|---|---|
| 1 | Structural mutation algebra `M`, `R1–R7`, `L1–L7` | L1 intra-heptatonic edges | L1 | **audited** (semantic authority withheld) | `seven-governors-mutation-algebra-audit/`; `qa/mutation-algebra-validation.json` (15 operators, 3,402 applications, 66 modal cycles, `allPass: true`); `audit/mutation-algebra-hypotheses.md:8-23`; `tests/verification/test_mutation_algebra.py` |
| 2 | R/L parallel-mode math + Orrery legal-move catalog | Orrery move projection (not the repo graph) | L1 via #1 | **admitted** projection; 60 moves | `docs/R_L_OPERATOR_MATH.md:1-9`; `orrery/src/generated/legal-moves.v2.json` (60 moves); `orrery/src/moves.math.test.ts`; `orrery/src/moves.test.ts` |
| 3 | Court-filter algebra (`P_c(x) = x AND c`) | L2 crossings (filter application over L1 state) | L1 + L2 | **proposed_pending_crt_309** | `seven-governors-court-filter-algebra-v0.1.0/canonical/filter-operator-registry.json` (7 filters: C0–C4 + 5-23/5-27); `.../canonical/filter-algebra-release.json`; `tests/verification/test_court_filter_algebra_registry.py` |
| 4 | Semantic operator registry v1.0.1 | none (annotation only; never computes masks) | L1 | **admitted** | `schemas/semantic_operator_registry_v1.0.1.yaml` (`metadata.status: admitted`; 15 operators); `scripts/validate-semantic-operator-registry.mjs` |
| 5 | Fivefold engine `C0–C4` | L4 path (5 positions of the 16-state field) | L3 5-35 fragments + L4 | **admitted** gate CRT-348 | `schemas/fivefold-engine-admission-contract.json` (`contractStatus: accepted_crt_348`); `seven-governors-state-machine-spec-and-authoring-toolkit-v0.2.0/schemas/fivefold_engine.yaml`; `src/governor/court_runtime.py`; freshness pin `tests/test_fivefold_engine_promotion_evidence.py` currently red (§5) |
| 6 | Quintessence overlay `Q_z = Q_1^z` | L4 transitions (generated 12×16 table) | L4; per-node instances proposal only | **gated** (SPEC-001 §6 items 2, 4) | `src/fivefold/quintessence.py`; `docs/specs/fivefold_constructs_engine_spec.md:102-111`; `tests/test_fivefold_q_table.py`; `scrum/plan/bl-010-q-table-freeze-memo.md` |
| 7 | Harmonic invariants | none (measurements: Court geometry, Carey CQ/SQ, compression guard) | L3 5-35 fragment + L1 A0–A2 scope | **proposed_pending_crt_309** | `seven-governors-harmonic-invariants-v0.1.0/canonical/harmonic-invariant-registry.json`; `.../src/harmonic_invariants/`; `.../tests/test_court_invariants.py` |
| 8 | Governor-runtime policy (typed aspects, quantities, bridge rules) | none (classification) | L1 | **proposed** (`releaseAdmission`) | `seven-governors-governor-runtime-v0.1.0/canonical/policy-release.json`; `.../schemas/`; `scripts/policy-builder.mjs` |
| 9 | Court substrate + `T5` cycle + complement map | L3 fragment edges (`C0–C4` chain; 5-23/5-27 bridge rootings) | L2 bridge crossings + L3 | **proposed_pending_crt_309** (2 `admitted-bridge` rootings) | `seven-governors-court-substrate-v0.1.0/canonical/substrate-registry-release.json`; `.../canonical/complement-map.json`; `tests/verification/test_court_substrate_registry.py` |
| 10 | `T`-family primitives (`T5`, `T7`, `Tn`/`In`) | none (primitive pitch operations) | all layers (generic Z12 substrate) | **prose + partial Python** | `court-mathematics/docs/01_COURT_LEXICON.md:500-504`; `court-mathematics/src/court_mathematics/pitch_class.py:113-157`; `framework/AGENTS.md:271,503-504` |
| 11 | Intra-node dynamics | none (explicitly non-mutating) | single L1 node interior | **prose contract** | `docs/INTRA_NODE_DYNAMICS.md:1-11,38-51`; `schemas/execution_envelope.schema.json`; `orrery/src/harmony.ts`; `orrery/src/harmony.test.ts` |
| — | Precursor roadmap (not an algebra) | — | — | **prose only** | `framework/CANONICAL_FEATURE_PROFILES_AND_MUTATION_ALGEBRA.md` v0.1 (2026-07-24); realized in part by rows 1, 4, 8, 11 |

Worked examples of the ownership rule:

- Row 2 projects row 1 into Orrery moves. It cannot add structural edges to L1.
- Rows 3 and 9 mediate L2 crossings. Neither may invent containment edges; containment is set inclusion alone.
- Row 6 rides inside any admitted L4 instance. It does not connect distinct 330 nodes; per-node transposed instances are a recorded proposal, not a fact (`scrum/plan/fivefold-mesh-spec-v3.md:135-138`).
- Row 4 annotates transitions resolved by row 1; it never recomputes a mask (`schemas/semantic_operator_registry_v1.0.1.yaml:1-9`).

---

## 2.5 What each system means

**Authority of this section is descriptive.** It describes what the repo's documents say each system means; it does not adjudicate between competing meanings or supply missing ones. Adjudication of meaning is claim-event work when it ever matters. A row whose meaning exists nowhere in the repo is recorded as a finding, not invented text. §2.5 re-verifies under the maintenance rule above: a meaning that no longer resolves is dropped to finding status, not smoothed.

**Row 1 — Structural mutation algebra `M`, `R1–R7`, `L1–L7`.** *Means:* `M` is the total modal successor — it changes the state's center of gravity while remaining inside 7-35 (a Nodal Shift); `R`/`L` are partial fixed-degree semitone raises/lowers at immutable Chaldean addresses, producing parallel modes and, at family boundaries, Topological Translocations. The audit explicitly withholds semantic authority: semantic feature effects are "not declared," and running the audit "does not declare semantic feature effects." *Also recorded at:* `seven-governors-mutation-algebra-audit/README.md:9-16`; `audit/mutation-algebra-hypotheses.md:5-14,59-70,210-228`; `SOURCE_AUTHORITY.md:25-33`; `framework/AGENTS.md:24-29,44-47,64-78,82-110`. *Status:* sourced (structural-functional meaning; semantic effects explicitly withheld upstream).

**Row 2 — R/L parallel-mode math + Orrery legal-move catalog.** *Means:* `R`/`L` keep the same root and alter one interior pitch, creating parallel modes — the contrast with `M`, which keeps the 12-bit set and re-roots. The Orrery catalog is the legal-move availability surface: source-backed fixed-degree applications covering all 21 A0–A2 anchors as both source and target. No document records a purpose beyond mechanics and negative boundaries (no topology or Court-policy mutation, no global `C_H`, no cross-coordinate equivalence). *Also recorded at:* `docs/R_L_OPERATOR_MATH.md:3-4,89-91,121-125,301-302`; `orrery/README.md:30-33,61-67,177-185`; `schemas/harmonic-orrery-legal-moves.schema.json:97-185` (no description fields). *Status:* sourced (thin — one recorded meaning sentence; purpose remains a finding).

**Row 3 — Court-filter algebra (`P_c(x) = x AND c`).** *Means:* A Court filter is a selective observation of a larger pitch-class vector through a binary Court mask: it exposes retained coordinates and suppresses the rest (Governor functions made latent by omission) without changing the authoritative source state, its office, or its topology. Two filters may mediate the same source→target route while preserving and suppressing different information, so destination identity can be equal while route context is not. This route-dependence is now mechanically instantiated (commutation table, `seven-governors-court-filter-algebra-v0.1.0/canonical/bridge-route-comparison.json`) and quantified at mesh scale (70 bridge nodes; see §1 Layer 2). *Also recorded at:* `court-mathematics/docs/01_COURT_LEXICON.md:452-482,1363-1365`; `framework/AGENTS.md:67,472,501`; `framework/CANONICAL_FEATURE_PROFILES_AND_MUTATION_ALGEBRA.md:1155-1160,1171-1194`; `seven-governors-court-filter-algebra-v0.1.0/README.md:3-6,21-24`; `seven-governors-court-filter-algebra-v0.1.0/docs/OPERATOR_THEORY.md:5-30`; `canonical/bridge-route-comparison.json:3-27,66-83`. *Status:* sourced.

**Row 4 — Semantic operator registry v1.0.1.** *Means:* Operators are verbs, not nouns: each of the 15 structural operators maps to a Chaldean degree address, a physical process with a symbolic-only anchor (never numerically evaluated), promotes/suppresses lists, and domain projection deltas. The registry renders `Render(s, e) = IntrinsicNormalForm(s) ⊕ Δ_S(e)`; it never computes or duplicates structural masks, and intrinsic identity stays the state while contextual identity is the state plus the immediately traversed edge. *Also recorded at:* `schemas/semantic_operator_registry_v1.0.1.yaml:1-24,94-99,118-145,175-198,277-308,505-535`. *Status:* sourced (15/15 operators populated).

**Row 5 — Fivefold engine `C0–C4`.** *Means:* The five legal Court positions are the operational cycle: Court position is the thermodynamic configuration through which the four functions collaborate toward a Victory Condition (the objective — related but not interchangeable). Movement is adjacent-only; Court state is runtime context, not State Governor identity, and the thermodynamic vocabulary names controlled movement toward commitment, embodiment, and fixation — not temperature, entropy, enthalpy, or free energy. *Also recorded at:* `framework/AGENTS.md:351-368`; `seven-governors-state-machine-spec-and-authoring-toolkit-v0.2.0/docs/FIVEFOLD_ENGINE_AND_THERMODYNAMICS.md:12-16,42-48,96-97,124-134`; `docs/ARCHITECTURAL_BLUEPRINT.md:21-23`; `scrum/CRT-348-fivefold-engine-promotion-gate.md:29-48,57,70-80`. The yaml itself carries machine fields only, no gloss (`schemas/fivefold_engine.yaml`). *Status:* sourced (meaning lives in framework and package docs; the yaml is gloss-free).

**Row 6 — Quintessence overlay `Q_z = Q_1^z`.** *Means:* Quintessence is not a 13th node or a fifth Court pole: it is the operational coherence produced by the Mercury engine-ledger pair translating between the active bracket and the four Court registers, and in the overlay composition it is the transition law rather than a substrate bit. The admitted identification with the Court registry is configuration-level — shared states, not trajectories; the Q1 orbit order bears no asserted relationship to Court register moves, and the composition's use as the SPEC-001 §6(4) bridge remains hypothesis-grade. *Also recorded at:* `framework/AGENTS.md:257-261`; `scrum/plan/bl-010-q-table-freeze-memo.md:43-48,67-70,80-82`; `scrum/plan/harmonic-comprehension-map.md:32-39,49-53,64-79`; `docs/specs/fivefold-court-engagement-correspondence-v0.1.0.md:95-102`; ENTRY 13 scope `provenance/DECISION_LEDGER.md:2527-2534`. *Status:* sourced (admitted at configuration level; the bridge use is hypothesis).

**Row 7 — Harmonic invariants.** *Means:* The registry computes formal properties and refuses meaning-totalization: `CQ=1` and `SQ=½` express coherence without maximal sameness — "difference coordinated without contradiction" as an authored interpretation, with the numerical values formal. The compression guard holds `C_H` unresolved and forbids equating it with `C_P`, `C_S`, `kappa_court`, or thermodynamic quantities; operational coherence is explicitly not Carey CQ. *Also recorded at:* `seven-governors-harmonic-invariants-v0.1.0/README.md:3-11,31-32`; `docs/SOURCE_AUTHORITY.md:30-44`; `canonical/harmonic-invariant-registry.json` `compressionGuard.guardLiteral`; `framework/AGENTS.md:261,321-345`; `framework/CANONICAL_FEATURE_PROFILES_AND_MUTATION_ALGEBRA.md:1121-1126`. *Status:* sourced.

**Row 8 — Governor-runtime policy (typed aspects, quantities, bridge rules).** *Means:* No recorded meaning. The package publishes strict machine contracts — aspects, quantities, bridge rules, classification requests/results, policy releases — with epistemic typing (`causalClaim: false`, `authored_correspondence`, `framework_declared_physical_anchor`) but no purpose or gloss prose; it does not yet execute classification or project runtime records. *Also recorded at:* searched and empty of meaning-language: `seven-governors-governor-runtime-v0.1.0/README.md:3-32`; `docs/POLICY_CONTRACT.md:6-12,32-36,68-96`; `canonical/policy-release.json:2-9,43-199,242-429,689-762`; `canonical/feature-typed-aspect-crosswalk.json:2-6`; `docs/SOURCE_AUTHORITY.md:29-31`; `docs/RELEASE_NOTES.md:15-17`. *Status:* **finding: no repo source**.

**Row 9 — Court substrate + `T5` cycle + complement map.** *Means:* The Court is the local external/internal control configuration — its five rooted positions encode the deterministic compression sequence of pole internalization (Fire → Air/Wind → Water → Earth, with Mercury as engine-ledger coherence among the registers), and the Court family is the five-note kernel capable of operating within or bridging the active heptatonic topology. `T5` supplies the 12-entry root cycle whose first five-entry segment yields C0–C4; bridge rootings are shared subsets with `root_alignment_only` T5 semantics; the complement map pairs each pentatonic class with its same-numbered heptatonic complement family as frozen evidence, not an active graph relation. *Also recorded at:* `framework/AGENTS.md:17,232-246,267-312,341,368`; `framework/CANONICAL_FEATURE_PROFILES_AND_MUTATION_ALGEBRA.md:1130-1160,1196-1218`; `seven-governors-court-substrate-v0.1.0/README.md:3-22`; `docs/SOURCE_AUTHORITY.md:18-70`; `canonical/substrate-registry-release.json:2-17`; `canonical/bridge-rootings.json` (`root_alignment_only`); `docs/ARCHITECTURAL_BLUEPRINT.md:137-143`. *Status:* sourced.

**Row 10 — `T`-family primitives (`T5`, `T7`, `Tn`/`In`).** *Means:* No recorded meaning for transposition/inversion as operators. The lexicon gives arithmetic (`T_n(p) = p + n mod 12`; `I_n(p) = n − p mod 12`) and uses them for equivalence and symmetry/stabilizer records; the mutation-operator entry states operators "describe edges; they do not author semantic consequences." The sole meaning-language is Mercury-specific: +5 is constructive forward generation/execution (Gemini), +7 is observational reverse readback (Virgo), with the runtime role tagged proposed. *Also recorded at:* `court-mathematics/docs/01_COURT_LEXICON.md:51-52,160,224-227,300-306,488-516,654-656`; `court-mathematics/src/court_mathematics/pitch_class.py:54-64,113-157` (no purpose strings); `framework/AGENTS.md:221-229,271-275,503-504`. *Status:* **finding: no repo source** for generic `Tn`/`In` meaning; narrow Mercury-role pointer only.

**Row 11 — Intra-node dynamics.** *Means:* A post-tonal execution layer inside one resolved Forte 7-35 node: the envelope is additive rendering context (Render = baseline nouns/verbs + route overlay + set-theoretic elaboration + render parameters), a tactical safe-state view via an optional Court filter, and render-gravity/affordance labels that are rendering instructions rather than harmonic claims. The dyad/trichord apparatus (21/35) has no deeper recorded meaning than render-gravity input; the contract is primarily a non-mutation fence (never traverses edges, changes masks, moves Court state, or writes `C_H`). *Also recorded at:* `docs/INTRA_NODE_DYNAMICS.md:5-29,33-50,73-99,119-161,169-174`; `schemas/execution_envelope.schema.json:5-106`. *Status:* sourced (thin — purpose recorded; intrinsic meaning absent).

**Precursor — `framework/CANONICAL_FEATURE_PROFILES_AND_MUTATION_ALGEBRA.md` (roadmap, not an algebra).** *Means:* The roadmap's intended endpoint: a canonical semantic ontology plus harmonic transformation algebra, where deterministic compilation (state → normal form → domain projection → artifact specification) precedes language generation, and meaning is declared through inspectable operators rather than improvised. *Also recorded at:* `framework/CANONICAL_FEATURE_PROFILES_AND_MUTATION_ALGEBRA.md:11-45,108-122`. *Status:* sourced (prose roadmap; realized in part by rows 1, 4, 8, 11).

*Tally: 9 sourced rows (1–7, 9, 11 — rows 2 and 11 thin), 2 finding rows (8, 10), 1 sourced precursor. Findings are the inventory of where the ontology's self-description has holes.*

---

## 3. Invariant ledger

| Quantity | Value | Receipt |
|---|---:|---|
| Rooted heptatonic nodes | 462 | `canonical/universal-network-data.json` `nodes` |
| Officed / boundary heptatonic states | 308 / 154 | same, `summary.officeNetworkStates` / `summary.boundaryStates` |
| Rooted pentatonic nodes | 330 | `derived/hypergraph/bipartite-inclusion-v1.json` `pentatonicSubnodes` |
| `parentsRooted` per pentatonic node | 21 (all 330) | same artifact; verified full-population |
| `subnodes` per heptatonic node | 15 (all 462) | same artifact; verified full-population |
| Containment edges per direction | 6,930 (330×21 = 462×15) | arithmetic cross-check of the above |
| Bridge pentatonic nodes | 70 / 330 | `metadata.bridgeCensus.totalBridgeSubnodes` |
| Cornerstone pentatonic nodes | 5 / 330 (the five 5-35 positions) | `isCornerstone` census |
| Bridge set-classes | 8 | `metadata.bridgeCensus.bySetClass` |
| A0–A2 anchors | 21 | `summary.a0A2Anchors` |

**The three distinct 66s** (must not be conflated):

1. Heptatonic modal cycles `M^7`: **66** — `seven-governors-mutation-algebra-audit/qa/mutation-algebra-validation.json` `counts.modalCycles`.
2. Heptatonic modal orientations: **66** — `canonical/universal-network-data.json` `summary.modalOrientations`.
3. Pentatonic Tn orbits: **66** — `derived/hypergraph/parallel-signatures-v1.json` `metadata.totalTnOrbits` and `pentatonicClassProfiles` length.

**The 38s:** TnI classes are **38 per side** (`bipartite-inclusion-v1.json` `metadata.totalTnIClassesPerSide`), and the heptatonic side records **38** Forte classes (`summary.forteClasses`). Tn classes (66) and TnI classes (38) are different quotients of the same raw universe and are not interchangeable.

---

## 4. Structural gaps and fences

### Structural gaps

| # | Gap | Tier | Status |
|---|---|---|---|
| G1 | **Pentatonic intra-family edge rule (the 330-algebra)** — which pentatonic node connects to which, by what rule | **Tier 2 — the project's one known structural gap** | BL-024 capture (landed with this map) |
| G2 | Unified cross-layer route graph (one namespace, mixed cross-family and intra-family edges, weighted) | downstream of G1 | vision; build when the first route needs intra-family hops |

The edge rule for G1 is a design decision (semitone adjacency? complement relations? voice-leading distance?), to be driven by the first route or procedure that needs intra-family hops. Formalizing the 330 graph is not one task; each candidate rule defines a different graph.

### Bounded and fenced items (recorded, not structural gaps)

| Item | State | Receipt |
|---|---|---|
| Per-L3-node Q instances | proposal, not admitted | `scrum/plan/fivefold-mesh-spec-v3.md:135-138` |
| 11 off-chain engagement configurations | unlabeled, out of ENTRY 13 scope | `docs/specs/fivefold-court-engagement-correspondence-v0.1.0.md:100-102` |
| Q orbit order vs Court register trajectory | explicitly not identified | `docs/specs/fivefold-court-engagement-correspondence-v0.1.0.md:95-99` |
| SPEC-001 §6(4) overlay correspondence | unresolved; ENTRY 13 does not resolve it | `docs/specs/fivefold_constructs_engine_spec.md:290-296`; `provenance/DECISION_LEDGER.md:2527-2534` |
| Complement map | frozen harmonic evidence, not an active graph relation | `docs/ARCHITECTURAL_BLUEPRINT.md:137-143` |
| Global harmonic `C_H` | unresolved (`value: null`); no pipeline step may emit a global scalar | `docs/ARCHITECTURAL_BLUEPRINT.md:159-161`; `seven-governors-harmonic-invariants-v0.1.0/canonical/harmonic-invariant-registry.json` `compressionGuard` |
| Projection gaps: 30 phase pairs, 280 formal modal applications | recorded, not promoted into canon | `seven-governors-mutation-algebra-audit/qa/mutation-algebra-validation.json` counts |
| fa/ti luminary brackets | identity-level only (`type: monopolar_luminary`); no algebraic formalization; evenness does not prove luminary status | `docs/ARCHITECTURAL_BLUEPRINT.md:49-53`; `docs/verification/PENTATONIC_GRAPH_BINDING_AUDIT_REPORT.md:110` |
| Pentatonic binding Phases 2–4 | not started; runtime wiring prohibited in Phase 2 | `docs/PENTATONIC_GRAPH_BINDING_AUDIT_SPEC.md:4,6` |

Per the map's own capture rule: if grounding surfaces additional gaps, they get rows here rather than omissions.

---

## 5. Grounding receipts

Every invariant and status above was verified against the committed tree at the landing commit. The pinning test suites (all green at landing):

| Suite | Pins |
|---|---|
| `tests/test_bipartite_inclusion.py` | containment symmetry, sliding window, census, Tn/TnI distinctions; `:1-7` sprint-evidence disclaimer; `:84` status assertion |
| `tests/test_parallel_signatures.py` | signature invariants, census distributions; `:1-8` disclaimer; `:117-118` status assertion |
| `tests/verification/test_mutation_algebra.py` | operator domains/images, inverse laws, commutation (`:25-60`) |
| `tests/test_court_engagement_correspondence.py` | ENTRY 13 vectors, masks, degree map, rejected polarity (`:76-136`) |
| `tests/test_fivefold_q_table.py` | Q1 cycle, still set, closure at 12, bit order, replay fixture (`:16-111`) |
| `tests/verification/test_court_filter_algebra_registry.py` | filter artifacts vs builder, commutation coverage, route asymmetry typing (`:27-89`) |
| `tests/verification/test_court_substrate_registry.py` | Court substrate registry |
| Package suites | `seven-governors-harmonic-invariants-v0.1.0/tests/`, `seven-governors-court-filter-algebra-v0.1.0/tests/` |

Documents deliberately **not** cited as formalization: `docs/FOUR_LAYER_FORMALIZATION.md` (authority flow), `docs/START_HERE.md` (installed-release orientation), `framework/*` prose beyond its executable claims. Cross-references to ledger entries use `provenance/DECISION_LEDGER.md` line ranges; JSON artifacts are cited by path and field rather than line, since their formatting is generated.

**Tree health at landing (fail-loud).** The seven receipt suites above pass (58 tests). Two modules fail collection for environment reasons (`tests/test_harmonic_orrery_api.py`: `No module named 'main'`; `tests/verification/test_mathematical_invariants.py`: missing `hypothesis`). Ten further tests fail as **pre-existing candidate-freshness pins** that reproduce on the clean parent commit `d0ff0fd` — `tests/test_fifth_space_census.py`, `tests/test_fivefold_capability_teleology.py`, `tests/test_fivefold_engine_promotion_evidence.py`, `tests/test_shadow_ladder.py`, `tests/test_twin_hub_convergence.py`. They are candidate drift, not structural error, and none is attributed to this landing. Do not read this map as a green-release claim.

---

## 6. Rules for downstream features

1. **No speculative edges.** Until BL-024 defines an edge rule, no intra-330 adjacency may be assumed, rendered, or consumed. Visualization parity for the 330 waits on the rule.
2. **Containment ground truth.** Route-pricing and cross-family hops query `derived/hypergraph/bipartite-inclusion-v1.json` (or `parallel-signatures-v1.json`) and treat the result as planning evidence until an admission lands.
3. **Layer separation.** Q-engine substrate states (16) are never pentatonic node transformations (330). The admitted correspondence is configuration-level, not trajectory-level.
4. **Consumes-column rule.** New algebras get a catalog row before they emit edges; consumers read, they do not author.
5. **Naming rule.** Never write "the mutation algebra" unqualified; name the row number and scope (e.g., "row 1, structural, 462-side").
