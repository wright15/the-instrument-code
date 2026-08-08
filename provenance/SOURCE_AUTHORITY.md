# Source Authority

## Authority order

1. **Framework sources** declare the intended conceptual and mathematical
   rules.
2. **Canonical release files** contain the accepted result of applying and
   auditing those rules.
3. **Neo4j** is a reproducible property-graph projection of the canonical
   release.
4. **The renderer** displays the projection and may add only presentation
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

The documents remain complete files rather than being copied into every scale
node. Neo4j records their identity, role, and hash through
`FrameworkDocument`, `AuditRelease`, and `InvariantDefinition` nodes.

## Categorical versus evidentiary authority

`OCCUPIES_OFFICE` is categorical. `RELATIONAL_OFFICE_EVIDENCE` and contact
relationships are evidentiary. A database traversal may discover evidence
toward an office without authorizing office membership.

Any future promotion of a boundary family must be performed as a new declared
rule, audited canonical release, and versioned provenance record.
