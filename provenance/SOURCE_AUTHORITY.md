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
