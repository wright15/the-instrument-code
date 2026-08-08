# GOV-201 — Governor authority model and namespace contracts

**Status:** Done · **Priority:** High · **Points:** 5 · **Epic:** [EPIC-002](EPIC-002-governor-domain-agent-runtime.md)
**Depends on:** — · **Blocks:** GOV-202

## Story

As a framework maintainer, I want every use of “Governor,” “domain,” and
“state” assigned to an explicit namespace and authority layer, so later
schemas and agent tools cannot overwrite canonical topology or confuse
semantic association with office occupancy.

## Context

The repository already uses State Governor, Degree Governor, operator domain,
feature `domainScope`, `DomainProjection`, zodiacal topic domains, and proposed
Fivefold state. These terms are valid in their own scopes but do not yet form
one executable crosswalk. The active topology has 308 seated states and 154
office-withheld boundaries; `RELATIONAL_OFFICE_EVIDENCE` is explicitly
non-categorical.

## Tasks

- [x] Author `docs/GOVERNOR_DOMAIN_AUTHORITY.md` with the authority flow and
      namespace crosswalk.
- [x] Define `TypedAspect`, `primaryGovernor`, non-categorical association,
      entity composition, and the partial `occupiesOffice` relation.
- [x] Define `operationalGovernor` and agent runtime state as a separate
      namespace that cannot mutate harmonic identity.
- [x] Crosswalk all existing meanings of `domain`, including operator domain,
      feature scope, domain projection, topic lists, and physical assumptions.
- [x] Record the facet-level exclusivity / entity-level composition decision
      and the frozen-package extension strategy in `provenance/DECISION_LEDGER.md`.
- [x] Declare Court/Fivefold, phenomena, and pentatonic admission unchanged.

## Acceptance criteria

- **AC-1**: the specification defines one authoritative owner and allowed
  writers for every Governor/domain namespace; no namespace is overloaded.
- **AC-2**: the formal model states that each admitted TypedAspect has exactly
  one primary Governor while an entity may contain multiple aspects and
  non-categorical associations.
- **AC-3**: fixtures prove states `1749` and `2477` retain their canonical
  offices and boundary state `223` remains office-null under operational or
  contextual classification.
- **AC-4**: the 31 existing FeatureDefinitions are crosswalked as reusable,
  extended, or explicitly unresolved; no disconnected replacement vocabulary
  is introduced.
- **AC-5**: admission states (`admitted`, `proposed`, `unresolved`, validated
  evidence, and office-withheld) remain distinct axes in the specification.

## Verification

Run a reference/link check across the authority document and decision entry;
review the three topology fixtures against canonical JSON and Neo4j invariant
definitions; verify no versioned package source or canonical office data
changed.

Implementation evidence recorded 2026-08-01:

- all 13 primary source paths in the authority contract resolve;
- the FeatureDefinition crosswalk has exactly 31 unique rows matching the
  registry, with no missing, extra, or duplicate IDs (15 reusable, 15 extended,
  one unresolved);
- canonical and projection checks preserve `1749 -> Moon`, `2477 -> Jupiter`
  with incoming Degree Governor Moon, and office-null `223` with only
  non-categorical relational Jupiter evidence;
- topology counts remain 462 states, 308 seated, and 154 office-withheld; and
- `git status` is clean for all three frozen versioned package directories.

Full root validation passed 119/119 on 2026-08-01 with manifest/checksum parity
at 946 files. The final status/evidence edit was followed by a fresh manifest
build and final root validation.

## Definition of done

The authority document and decision-ledger entry are reviewed, source paths
resolve, namespace ownership and forbidden writes are explicit, the topology
fixture evidence is recorded, no frozen artifact changed, manifest/checksums
are refreshed, and the full root validator passes. **Done 2026-08-01.**
