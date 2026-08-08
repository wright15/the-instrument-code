# EPIC-002 — Governor domain algebra and deterministic local-agent runtime

**Status:** In Progress · **Priority:** High · **Owner:** governor runtime workstream
**Epic ID:** EPIC-002 · **Target:** post-1.2.0 admission, version TBD
**Stories:** [GOV-201](GOV-201-authority-namespaces.md),
[GOV-202](GOV-202-typed-aspects-quantities-bridges.md),
[GOV-203](GOV-203-deterministic-classification.md),
[GOV-204](GOV-204-transition-engine-ledger.md),
[GOV-205](GOV-205-verification-loop-guards.md),
[GOV-206](GOV-206-graph-read-projection.md),
[GOV-207](GOV-207-local-agent-skills.md),
[GOV-208](GOV-208-obsidian-context-bundles.md),
[GOV-209](GOV-209-release-closure.md)

## Problem statement

The framework provides a rich Seven Governors vocabulary, canonical profiles,
physical anchors, mutation algebra, topology, and proposed Fivefold control
language. A local model can read that material, but it has no executable
procedure for separating physical facts from symbolic associations, finding
legal moves, proving an action succeeded, or escaping a repeated failed plan.

Three different concepts are also at risk of being collapsed:

1. A rooted scale state's canonical State Governor / office occupancy.
2. A typed semantic or physical aspect's Governor-domain classification.
3. An agent task's operational Governor and current execution state.

That collapse would violate existing machine data. In particular, the 154
boundary states are admitted topology members whose office is intentionally
withheld; they must not acquire an `OCCUPIES_OFFICE` edge merely because some
context can be associated with a Governor.

## Goal

Create a deterministic Governor-domain runtime in which a small local model
selects bounded skills and proposes actions, while typed rules, a state
machine, evidence verifiers, and an append-only ledger decide what is true and
what may change. Neo4j remains a rebuildable read projection. An optional
Obsidian vault supplies transparent, fingerprinted context but never becomes
execution authority.

The formal classification boundary is:

```text
primaryGovernor: AdmittedTypedAspect -> one of seven Governors
entityAspects: Entity -> zero or more TypedAspects
occupiesOffice: ScaleState -> GovernorOffice?       (existing partial relation)
operationalGovernor: AgentTask -> GovernorDomain?  (new, separate namespace)
```

Raw input may return `ambiguous`, `unresolved`, or `invalid`. Completeness and
exclusivity apply to admitted typed-aspect mappings, not to every unreviewed
phrase supplied by a model.

## Authority flow

```text
framework + canonical topology + profile registry
                    |
                    v
       versioned aspect/rule policy
                    |
                    v
 deterministic classifier + transition engine ----> append-only ledger
                    |                                      |
                    v                                      v
          generated Neo4j read projection       verified runtime state
                    |
                    v
        named graph queries / agent skills

optional Obsidian vault -> bounded context bundle -> evidence only
```

For a fixed policy fingerprint, normalized request, prior state hash, and
context fingerprint, intrinsic outputs must be byte-identical. Wall-clock
time, provider identity, Neo4j availability, and filesystem enumeration order
must not affect intrinsic identity.

## Scope

**In:**

- A namespace and authority crosswalk for State Governor, Degree Governor,
  Governor domain, office occupancy, and operational Governor.
- Strict typed-aspect, quantity, bridge-rule, classification, state, evidence,
  and ledger contracts.
- Deterministic photonic/harmonic calculations and dimension checking.
- Facet-level classification with explicit abstention and provenance paths.
- Legal-move discovery, validate-before-execute tokens, replayable state, and
  evidence-gated transitions.
- Bounded named Neo4j reads, first-party local-agent skills, and an explicit-
  target installer compatible with Hermes-style skill workflows.
- Optional read-only Obsidian context bundles with privacy and path controls.
- QA, provenance, admission review, documentation, and release closure.

**Out:**

- Editing frozen versioned package directories in place.
- Admitting the proposed Fivefold Engine, Court states, or pentatonic topology
  as a side effect of this epic.
- Treating representative Governor wavelengths as empirical observations or
  as physical effects caused by musical states.
- Allowing an LLM, Obsidian vault, or Neo4j to authoritatively mutate runtime
  state or canonical office occupancy.
- Unrestricted model-generated Cypher, shell execution, or vault writes.
- Claiming that semantic categories are mathematically orthogonal before an
  explicit representation and its laws are defined and tested.

## Success criteria

- **SC-1 · Namespace safety**: operational and aspect classifications cannot
  write `ScaleState.office`, `OCCUPIES_OFFICE`, or Degree Governor metadata.
- **SC-2 · Typed completeness**: every admitted TypedAspect maps to exactly one
  primary Governor; composite entities retain multiple aspects; unresolved
  input abstains rather than being assigned by office order.
- **SC-3 · Physical integrity**: quantities carry dimensions/units; wavelength,
  frequency, photon energy, and scoped Rayleigh ratios reproduce fixtures;
  symbolic bridge rules remain distinguishable from physical derivations.
- **SC-4 · Determinism**: classification, legal moves, validation tokens,
  ledger event identities, replay, and context bundles are byte-identical for
  identical intrinsic inputs.
- **SC-5 · Evidence authority**: no external-effect transition reaches
  `VERIFIED` without a registered verifier and recorded evidence; stale or
  invalid validation tokens cannot execute.
- **SC-6 · Loop control**: repeated state/action/parameter tuples, bounded
  retries, and no-progress conditions produce explicit stop or replan states.
- **SC-7 · Projection safety**: deleting Neo4j does not change classification
  or replay; the graph can be rebuilt from verified canonical/runtime data.
- **SC-8 · Agent usability**: first-party skills expose inspect, list, validate,
  execute, and verify procedures without requiring the model to calculate the
  algebra or invent success claims.
- **SC-9 · Context safety**: vault access is opt-in, bounded, read-only, and
  fingerprinted; raw private content and live runtime state stay outside the
  release manifest and graph projection.
- **SC-10 · Release integrity**: schemas, fixtures, provider parity, security
  boundaries, documentation, provenance, manifests, and the full root
  validator are green twice before admission.

## Definition of done (epic)

All nine stories are Done with their story-specific evidence recorded. The
authority decision is in the decision ledger; versioned artifacts and schemas
are published without mutating frozen packages; deterministic and tamper
fixtures pass twice; graph projection is rebuildable; local-agent and optional
vault paths pass safety tests; the Scrum board, documentation, manifest, and
QA reports are current; and release admission is explicit rather than implied.

## Dependencies and sequencing

```text
GOV-201 -> GOV-202 -> GOV-203
                         |---> GOV-204 -> GOV-205 --|
                         |                         |---> GOV-207 -> GOV-208
                         |---> GOV-206 ------------|
                                                   |
                                                   ---> GOV-209
```

GOV-206 may proceed in parallel with GOV-204/205 after the typed classifier
contract is stable. GOV-208 remains optional at runtime but is part of this
epic's planned delivery and therefore closes before GOV-209.
