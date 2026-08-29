# Source Authority

## Authority order

1. **Framework sources** declare the intended conceptual and mathematical
   rules.
2. **Canonical release files and admitted registries** contain the accepted
   result of applying and auditing those rules.
3. **Versioned authority/admission contracts and runtime policies** may define
   bounded post-release namespaces without changing an earlier release
   retroactively. Their admission state must be explicit.
4. **Neo4j** is a reproducible property-graph projection of upstream owners.
5. **The renderer** displays the projection and may add only presentation
   state.

When two layers disagree, the conflict must be resolved upstream and followed
by a downstream rebuild. A renderer coordinate or manual database edit cannot
be promoted into a topology fact.

## Framework-document roles

| Source | Authority role | Database use |
|---|---|---|
| `framework/TOPOLOGICAL_ANCHORING.md` | Normative topology specification | Defines anchor, precedence, office, satellite, and phase rules |
| `framework/CANONICAL_FEATURE_PROFILES_AND_MUTATION_ALGEBRA.md` | Semantic enrichment specification | Defines future feature and transformation properties |
| `framework/AGENTS.md` | Operational behavior | Defines agent execution and framework correspondences |
| `framework/NATURAL_ORGANIZATION_THESIS.md` | Theoretical foundation | Supplies interpretation and research rationale |
| `schemas/governors.yaml` | Machine registry | Supplies structured Governor and Court constants |
| `docs/GOVERNOR_DOMAIN_AUTHORITY.md` | Governor/runtime namespace contract | Defines GOV-201 ownership, non-equivalence, and forbidden writes |
| `docs/COURT_ADMISSION_AND_AUTHORITY.md` | Court admission authority contract | Extends GOV-201 with Court namespaces and the amended EPIC-003 boundary; does not itself admit the Court subsystem |
| `schemas/court-admission-contract.json` | Machine Court authority contract | Enforces exact `kappa_court` guards, allowed writers, forbidden writes, field dispositions, topology locks, and explicit out-of-scope material |
| `seven-governors-court-substrate-v0.1.0/canonical/substrate-registry-release.json` | Historical candidate bytes admitted selectively by CRT-309 | Supplies the fingerprinted 38-class field; CRT-309 admits C0-C4, 5-23, and 5-27 only |
| `seven-governors-harmonic-invariants-v0.1.0/canonical/harmonic-invariant-registry.json` | Historical candidate bytes admitted selectively by CRT-309 | Computes exact Court geometry, scoped Carey 5-35 CQ/SQ, exact `kappa_court`, and the still-unresolved aggregate `C_H` guard |
| `seven-governors-court-filter-algebra-v0.1.0/canonical/filter-algebra-release.json` | Historical candidate bytes admitted selectively by CRT-309 | CRT-309 admits the seven concrete `linear_diagonal` filters and their mutation-domain evidence; other filter families remain proposed |
| `schemas/court-runtime-policy.json` | Court runtime policy admitted by external CRT-309 record | Binds C0-C4 derived state, legal operations, exact kappa guards, GOV ledger envelope, translocation evidence, and CRT-304 route records under fingerprint `90431c...c456` |
| `src/governor/court_graph_projection.py` | Rebuildable Court read projection | Independently replays typed CRT-305 sessions and projects terminal state, events, snapshots, and translocation-to-route evidence; it is downstream evidence, never runtime or topology authority |
| `skills/court/registry.json` | Court skill registry admitted by CRT-309 | Declares five bounded CRT-307 workflows; skills select runtime operations but never own Court state, evidence, filters, graph facts, or success |
| `src/governor/vault_context.py` | Optional GOV-208 context provider | Compiles bounded, fingerprinted public Markdown context while preserving exact no-provider classifier parity |
| `src/governor/court_vault_context.py` | Optional CRT-308 Court context provider | Validates Court note claims against CRT-302/303/304 and cannot change runtime policy, graph queries, or admission |
| `provenance/court-admission-release.json` | CRT-309 admission authority | Admits the exact bounded Court identities and records all still-proposed scope without rewriting historical package bytes |
| `provenance/pentatonic-set-class-admission-backlog.json` | CRT-310 planning evidence only | Tracks seven per-class gates for the 35 proposed set classes; it has no admission, runtime, filter, graph, or topology effect |
| `canonical/pentatonic-binding-candidates/pentatonic-7-35-parent-audit-v1.json` | Root-owned `planning_evidence` sidecar | Enumerates finite pentatonic-to-7-35 parent incidence and seven reviewed rooted witnesses; it grants no class admission, runtime, topology, zodiac, or active-graph authority |
| `docs/verification/PENTATONIC_GRAPH_BINDING_AUDIT_REPORT.md` | Prose-tier `planning_evidence` appendix | Records the authored twelve-record zodiac partition and non-equivalence boundaries without assigning signs to pitch classes or creating graph/runtime authority |
| `qa/pentatonic-binding-audit-closure.json` | `planning_evidence` closure report | Binds deterministic audit checks and detached Neo4j evidence; it has no admission or decision-ledger effect |
| `canonical/fivefold-capability-candidates/fivefold-capability-teleology-v1.json` | CRT-347 root-owned `planning_evidence` sidecar | Registers the authored State/Capability/Teleology separation, five capability schools, the twelve-facet zodiac partition, and authored win conditions; it grants no admission, runtime, graph, policy, ledger, or physics authority and cannot write `court.poleDisposition` or global `harmonic.C_H` |
| `schemas/fivefold-engine-admission-contract.json` | CRT-348-admitted Fivefold promotion contract | Admitted by the 2026-08-17 decision-ledger entry; binds the ten promoted `fivefold_engine` items to their enforcing sources and exact values while `macro_bracket`, `controller`, and `runtime_cycle` remain proposed |
| `provenance/fivefold-engine-admission-release.json` | CRT-348 admission authority | Admits the ten-item Fivefold promotion scope under release identity 1.7.0 with exact artifact and evidence bindings; it creates no runtime, graph, policy, or ledger authority beyond the admitted declarative fields |
| `docs/ARCHITECTURAL_BLUEPRINT.md` | Canonical architecture description | Dual-core (Ontology/Teleology) blueprint with admitted, authored-correspondence, proposed, and unresolved status markers; descriptive documentation, not machine authority |
| `schemas/teleological_physics_registry_v1.0.0.yaml` | CRT-349 proposed Layer-4 registry | Maps the 8 directional Court transitions to electromagnetic symbolic anchors with `physical_quantity_claim: false`; shades rendering only and never executes, authorizes, or redefines a Court transition |
| `schemas/elemental_pentatonic_scale_map_v1.0.0.yaml` | CRT-350 proposed scale map | Binds the five elemental schools to their audited Ian Ring 5-35 identities (661/677/1189/1193/1321) with dual-core Photonic/Electromagnetic domain categorization; authored emblems with zero authority effect |
| `schemas/mechanics_thermodynamics_registry.yaml` | CRT-351 proposed Layer-4 capability glossary | Maps authored heat/energy action semantics to the five elemental schools, splitting the four Court poles into Electric/External and Magnetic/Internal capabilities while Mercury remains an excluded engine interface; assigns one four-part thermodynamic phenomenon category to each element: Fire High-Enthalpy, Air High-Entropy, Water Low-Enthalpy, Earth Low-Entropy, and Quintessence Equilibrium. Fire/Electric and Air/Electric are populated, while Air High-Entropy excludes the Magnetic/Internal glossary; facilities and computational simulation/modeling terms remain reserved for future `schemas/mechanics_instrumentation_registry.yaml`, while the authored two-temperature and multi-temperature structural descriptors remain phenomena rather than tooling; `physical_quantity_claim: false` and zero runtime, graph, policy, ledger, admission, or physics effect |
| `schemas/mechanics_thermodynamics_registry_v2.0.0.yaml` | CRT-351 proposed Layer-4 capability glossary v2 | Preserves the v1 registry while moving every rich glossary entry into its owning direct capability array and moving polarity metadata to sibling bindings. Every leaf has the same strict `phenomenon_class` field; the existing Electric/External glossaries remain intact, while Magnetic/Internal adds the four-part High-Enthalpy Fire, High-Entropy Air, Low-Enthalpy Water, Low-Entropy Earth, and Equilibrium Quintessence catalogs. Magnetic/Internal is an authored semantic polarity rather than a claim about literal fields; Mercury's semantic Magnetic/Internal channel adds no binary Court polarity metadata, zodiac facet, or register membership. `physical_quantity_claim: false` and all runtime, graph, policy, ledger, admission, and physics effects remain zero |
| `canonical/gov-210-availability-housing.json` | GOV-210 informational catalog | Projects exact skill availability, eligibility, assignment bases, and optional privacy-preserving housing without runtime authority |
| `schemas/gov-211/menu-organization-policy.json` | GOV-211 presentation policy | Orders only already-legal base-menu skills and cannot alter membership, moves, queries, capabilities, executors, or success |
| `graph/runtime/neo4j-bootstrap.mjs` | Rebuild orchestration | Imports upstream records through fixed, parameterized, projection-scoped boundaries; Neo4j remains disposable |
| `graph/runtime/neo4j-roundtrip.mjs` | Independent projection verification | Removes storage identity and verifies normalized graph content against authoritative source identities |
| `provenance/neo4j-full-database-baseline.json` | Retained closed-release projection baseline | Pins the exact seven normalized namespace fingerprints and source bindings accepted by release 1.8.1; its isolated clean-import and separately configured bootstrap/roundtrip receipts remain distinct evidence records during 1.9.0-dev |
| `qa/neo4j-full-database-validation.json` | Native reproducibility receipt | Proves two isolated clean imports produce byte-identical normalized snapshots without using deployment credentials |
| `qa/neo4j-deployment-roundtrip-validation.json` | Configured deployment receipt | Records bootstrap and roundtrip evidence without persisting URI, credentials, or import-directory details |
| `provenance/neo4j-ingestion-template-baseline.json` | Ingestion safety baseline | Pins every generated Court/GOV-210 Cypher template by kind and SHA-256 so no unreviewed query text can execute during bootstrap |
| `docs/A_TIER_TRIADIC_COMPRESSION_THEOREM.md` | Independently reproduced scoped theorem admitted by GOV-213 | Defines the bounded 21-anchor theorem; the machine sidecar and decision ledger own executable admission evidence |
| `canonical/harmonic-compression-candidates/CH_A012_q_v1.json` | GOV-213 root-owned scoped harmonic descriptor | Admits exact `Q(S)` and `W_A012(S)` only for A0-A2 anchors; cannot infer offices or write global `harmonic.C_H`, `C_P`, `C_S`, Court, runtime, or topology state |
| `docs/D_TIER_TRIADIC_COMPRESSION_THEOREM.md` | GOV-227 finite D-tier theorem | Records the universal 70-anchor seat invariant, q_v2 discrimination limits, and exact tier-band interleaving without replacing graph topology |
| `canonical/harmonic-compression-candidates/CH_D17_q_v2.json` | GOV-227 root-owned scoped harmonic descriptor | Admits exact q_v2 `Q(S)` and `W_D17(S)` only for D1-D7 anchors; cannot infer tiers or offices, emit Neo4j data, or write global `harmonic.C_H` |

The documents remain complete files rather than being copied into every scale
node. Neo4j records their identity, role, and hash through
`FrameworkDocument`, `AuditRelease`, and `InvariantDefinition` nodes.

## Categorical versus evidentiary authority

`OCCUPIES_OFFICE` is categorical. `RELATIONAL_OFFICE_EVIDENCE` and contact
relationships are evidentiary. A database traversal may discover evidence
toward an office without authorizing office membership.

Any future promotion of a boundary family must be performed as a new declared
rule, audited canonical release, and versioned provenance record.

The CRT-301 Court contract permits only new root-owned/versioned extensions.
It does not authorize editing the frozen mutation-audit, profile-registry,
companion-toolkit, or Governor-runtime package directories in place.
