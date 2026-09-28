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
