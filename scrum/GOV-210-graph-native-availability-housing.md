# GOV-210 — Graph-native availability and housing layer

**Status:** Done · **Priority:** Medium · **Points:** 8 · **Epic:** Framework follow-on
**Depends on:** GOV-209, CRT-309 · **Blocks:** —

## Story

As a framework author, I want skills represented as graph-native availability
and vault bundles represented as graph-native housing, so the state machine can
deterministically organize what may be useful at a node or Court position and
preserve that determination for later use without transferring runtime
authority to the graph, model, or vault.

## Agreed direction

- Derive `SkillAvailability` only from hash-bound GOV-207/CRT-307 registries.
- Keep machine records free of Governor-affinity labels; Mercury, Moon, or Mars
  analogies remain explanatory prose rather than fixed ownership.
- Project vault structure, frontmatter field names, link topology, section
  roles, provenance, and fingerprints only; never raw excerpts or private paths.
- Add a separate `SkillEligibility` mapping that references, but never edits,
  closed skill registries.
- Compute informational assignments over both node/office and Court-position
  namespaces from canonical mutation algebra and Court structure.
- Persist each assignment with exact operator, edge, anchor-tier,
  Degree-Governor-address, or Court-position basis so future consumers can ask
  what fits and why.
- Assignment informs catalog/menu organization only. Runtime replay, capability
  checks, and verifier evidence continue to own legality and execution.
- Optionally add deterministic `publish`, `validate`, and `retire` lifecycle
  records as the machine-checkable seed of build-skills-as-you-go behavior.

## Definition of done

Availability, eligibility, assignment, housing, and optional lifecycle schemas;
deterministic builders; bounded read projection and named queries; build-twice
identity; exact registry coverage; mutation/Court basis closure; no-context
parity; privacy fixtures; documentation; and root validation are complete
without modifying GOV-207, CRT-307, GOV-208, or CRT-308 contracts.
