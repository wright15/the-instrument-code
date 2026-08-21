# Scrum Board — Seven Governors integrated workstreams

Completed release 1.3.0 work, integrated release 1.4.0 database closure,
release 1.5.0 GOV-213 admission, and release 1.6.0 GOV-227 D-tier admission.

## EPIC-001 — Bestiary network replica

| ID | Title | Points | Priority | Status |
|---|---|---|---|---|
| [EPIC-001](EPIC-001-network-replica.md) | Deterministic Seven Governors network replica (dashboard Network view) | — | High | **Done** |
| [NET-101](NET-101-office-lane-layout.md) | Office-lane layout engine (`networkLayout.ts` rewrite) | 8 | High | **Done** |
| [NET-102](NET-102-tier-shapes-palette-guides.md) | Tier shapes, fixed palette, lane/row guides | 5 | High | **Done** |
| [NET-103](NET-103-non-state-placement.md) | Non-state archetype placement (all-598 contract) | 3 | Medium | **Done** |
| [NET-104](NET-104-edges-interaction.md) | Structural edges + filter/hover interaction | 8 | High | **Done** |
| [NET-105](NET-105-toggle-defaults.md) | Toggle UX + default view | 3 | Medium | **Done** |
| [NET-106](NET-106-docs-closure.md) | Docs (ARCH-SPEC) + release closure | 5 | High | **Done** |

Total story points: **32**.

## EPIC-002 — Governor domain algebra and local-agent runtime

| ID | Title | Points | Priority | Status |
|---|---|---|---|---|
| [EPIC-002](EPIC-002-governor-domain-agent-runtime.md) | Governor domain algebra and deterministic local-agent runtime | — | High | **Done** |
| [GOV-201](GOV-201-authority-namespaces.md) | Governor authority model and namespace contracts | 5 | High | **Done** |
| [GOV-202](GOV-202-typed-aspects-quantities-bridges.md) | Typed aspects, quantities, and bridge-rule contracts | 8 | High | **Done** |
| [GOV-203](GOV-203-deterministic-classification.md) | Deterministic Governor classification and physical evaluation | 8 | High | **Done** |
| [GOV-204](GOV-204-transition-engine-ledger.md) | Authoritative transition engine and hash-chained ledger | 8 | High | **Done** |
| [GOV-205](GOV-205-verification-loop-guards.md) | Evidence verification and no-progress loop guards | 8 | High | **Done** |
| [GOV-206](GOV-206-graph-read-projection.md) | Neo4j read projection and bounded context queries | 5 | High | **Done** |
| [GOV-207](GOV-207-local-agent-skills.md) | First-party local-agent skill bundle | 5 | High | **Done** |
| [GOV-208](GOV-208-obsidian-context-bundles.md) | Optional read-only Obsidian context bundles | 5 | Medium | **Done** |
| [GOV-209](GOV-209-release-closure.md) | QA, admission, documentation, and release closure | 5 | High | **Done** |

Planned story points: **57**.

## EPIC-003 — Pentatonic Court admission and harmonic-invariant runtime

| ID | Title | Points | Priority | Status |
|---|---|---|---|---|
| [EPIC-003](EPIC-003-pentatonic-court-admission.md) | Pentatonic Court admission and harmonic-invariant runtime | — | High | **Done** |
| [CRT-301](CRT-301-court-admission-contract.md) | Court admission contract and namespace crosswalk | 5 | High | **Done** |
| [CRT-302](CRT-302-pentatonic-substrate-registry.md) | Pentatonic substrate registry (5 canonical + 5–23, 5–27 bridges) | 8 | High | **Done** |
| [CRT-303](CRT-303-harmonic-invariant-library.md) | Harmonic-invariant library and Carey CQ/SQ for 5–35 seed | 8 | High | **Done** |
| [CRT-304](CRT-304-court-filter-algebra.md) | Linear Court-filter algebra $P_c=\operatorname{diag}(c)$ and commutation tests | 8 | High | **Done** |
| [CRT-305](CRT-305-court-runtime-ledger.md) | Court runtime lifecycle, $\kappa_{\text{court}}$, adjacent-only transitions | 8 | High | **Done** |
| [CRT-306](CRT-306-court-graph-projection.md) | Court Neo4j projection and bounded named queries | 5 | High | **Done** |
| [CRT-307](CRT-307-court-agent-skills.md) | Court-aware first-party agent skills | 5 | High | **Done** |
| [CRT-308](CRT-308-court-vault-context.md) | Optional Court context in vault bundles | 5 | Medium | **Done** |
| [CRT-309](CRT-309-court-admission-release-closure.md) | Admission, validator cascade, decision ledger amendment, release closure | 5 | High | **Done** |

Planned story points: **57** (Court scope: 5 canonical rooted positions + 5–23 and 5–27 bridge set classes + minimal Aeolian→Harmonic Minor mediating set; Carey CQ/SQ only for 5–35 seed; only $P_c$ admitted; the original "all 38 pentatonic set classes" scope from the 1.2.0 ledger entry is superseded by CRT-309's amendment).

## Framework follow-on

Planning audits: [structural/runtime distinctions](pre-epic-400-audit-notes.md),
[semantic/empirical horizon](pre-epic-400-semantic-and-empirical-audit.md), and
[pentatonic graph binding audit](pre-epic-400-pentatonic-graph-binding-audit.md)
(`planning_evidence` closure complete). None of these audits activates an epic
or changes admission authority.

Continuation brief: [pentatonic graph binding Phases 2-4](pre-epic-400-pentatonic-graph-binding-phase-2-4-handoff.md).

| ID | Title | Points | Priority | Status |
|---|---|---|---|---|
| [GOV-210](GOV-210-graph-native-availability-housing.md) | Graph-native availability and housing layer | 8 | Medium | **Done** |
| [GOV-211](GOV-211-assignment-aware-menu-integration.md) | Assignment-aware menu organization sidecar | 8 | High | **Done** |
| [GOV-212](GOV-212-integrated-release-1.4-closure.md) | Integrated release 1.4.0 closure and full-database round trip | 8 | High | **Done** |
| [GOV-213](GOV-213-harmonic-compression-formalization.md) | Scoped A-tier harmonic-compression formalization | 8 | High | **Done** |
| [GOV-227](GOV-227-d-tier-harmonic-compression-audit.md) | D-tier additive harmonic-compression audit | 8 | High | **Done** |
| [CRT-310](CRT-310-remaining-pentatonic-admission.md) | Per-class pentatonic admission evidence backlog ([workflow](../docs/CRT_310_ADMISSION_WORKFLOW.md)) | TBD | Low | **Backlog** |
| [CRT-347](CRT-347-fivefold-capability-teleology.md) | Fivefold Capability Teleology planning evidence | 5 | Medium | **Done** |
| [CRT-348](CRT-348-fivefold-engine-promotion-gate.md) | Fivefold engine promotion gate plan | 8 | Medium | **Done** |
| [CRT-349](CRT-349-teleological-physics-registry.md) | Teleological Physics Registry (Court transition symbolic anchors) | 5 | Medium | **Done** |
| [CRT-350](CRT-350-elemental-pentatonic-scale-map.md) | Elemental Pentatonic Scale Map (dual-core physics categorization) | 5 | Medium | **Done** |
| [CRT-351](CRT-351-mechanics-thermodynamics-registry.md) | Mechanics Thermodynamics Registry (elemental capability glossary) | 5 | Medium | **Done** |

## Global definition of done

Every ticket also carries a story-specific definition of done. Globally:

1. Work respects `provenance/SOURCE_AUTHORITY.md` and does not edit frozen
   versioned packages in place.
2. New data and API surfaces have strict schemas, positive/negative fixtures,
   deterministic ordering, and explicit provenance/admission.
3. Claimed behavior has executable acceptance evidence; model prose is never
   accepted as proof of state, success, mathematics, or graph truth.
4. Intrinsic artifacts are built twice when determinism is claimed; live state,
   secrets, temporary processes, and private vault content stay outside the
   repository and release manifest.
5. Relevant package checks and `npm run validate` pass; release work refreshes
   `MANIFEST.json` and `CHECKSUMS.sha256`.
6. Authority, architecture/API, provenance, decision-ledger, QA, and Scrum
   records are updated for admitted work.

## Global constraints

- **Authority separation**: the state machine/policy and verified ledger own
  runtime state; Neo4j is a rebuildable read projection; an Obsidian vault is
  optional evidence/context only.
- **Namespace separation**: State Governor, Degree Governor, office occupancy,
  aspect Governor, and operational Governor cannot overwrite one another.
- **Abstention**: ambiguous, unresolved, invalid, proposed, admitted, and
  office-withheld are distinct outcomes; no office-order fallback.
- **Determinism**: fixed intrinsic inputs produce byte-identical canonical
  outputs; wall clock, provider, locale, and enumeration order are excluded
  from intrinsic identity.
- **Capability safety**: agent skills use allow-listed typed operations and
  named bounded queries, not raw shell, raw Cypher, direct ledger writes, or
  unverified success claims.
- **Privacy**: live state and vault access use explicit external paths and are
  excluded from release artifacts by default.

## Workflow

1. Pick a story from `Ready`, confirm dependencies, and move it to `In Progress`.
2. Implement and verify every acceptance criterion and story-specific DoD.
3. Update package/root QA and documentation; refresh release artifacts when
   applicable; move to `Done` only after evidence is recorded.
