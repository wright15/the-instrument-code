# GOV-210 Availability And Housing

GOV-210 is a deterministic read projection for organizing registered skills at
topology states and Court positions. It is an informational catalog, not an
authorization or execution surface. Runtime replay, capability checks,
validation tokens, transition policy, and verifier evidence remain
authoritative.

## Inputs

- Skill availability comes only from the exact GOV-207 and CRT-307 registries.
- Eligibility comes from `schemas/gov-210/skill-eligibility-policy.json`.
- Topology assignments cite exact scale-state identities or mutation
  application IDs from the canonical mutation audit.
- Court assignments cite exact Court-position identities, ordinary move IDs, or
  position filter IDs.
- Optional housing comes from already bounded GOV-208/CRT-308 context bundles.
  The projection discards excerpts, raw text, relative paths, and unresolved
  link targets. Path-like note identities are replaced by stable redacted
  identifiers, and provenance values are retained only as SHA-256 references.
- Housing section roles are derived from the explicit frontmatter-field and
  link-topology rules in the GOV-210 eligibility policy, never from note prose.

No mapping is inferred from skill names, descriptions, triggers, mythology, or
elemental analogies. Degree-Governor addresses and target offices appear only
as cited topology basis; they do not assign a skill affinity.

## Build And Query

Run `python3 scripts/generate-availability-housing.py` to rebuild
`canonical/gov-210-availability-housing.json`. Use `--check` to verify exact
byte identity and `--batches PATH` to emit deterministic Neo4j MERGE batches.
Contextual or lifecycle builds require an explicit `--output`; they cannot
overwrite the canonical no-context snapshot by default. Generated ingestion
batches begin with a GOV-210-only cleanup, making repeated imports converge to
the requested snapshot without touching GOV-206, CRT-306, or core topology.

The bounded query catalog in
`src/governor/availability_housing_queries.py` exposes:

- `skills_for_topology_target`
- `skills_for_court_position`
- `skill_assignment_explanation`
- `skill_availability`
- `context_housing_for_note`
- `skill_lifecycle_history`

All queries are allow-listed, parameterized, read-only, depth-bounded,
row-bounded, and timeout-bounded. Neo4j constraints, validation queries, and an
isolated reset procedure are under `neo4j/gov-210/`.

## Optional Records

Housing is empty when no context bundle is supplied, preserving no-context
parity. Lifecycle records are also optional and accept only the ordered prefix
`publish`, `validate`, `retire`, with each event hash-bound to evidence and its
predecessor.
