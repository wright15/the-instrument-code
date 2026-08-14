# GOV-212 - Integrated release 1.4.0 closure

**Status:** Done · **Priority:** High · **Points:** 8 · **Epic:** Framework follow-on
**Depends on:** GOV-210, GOV-211, CRT-310 planning workflow

## Story

As a release maintainer, I want GOV-210 and GOV-211 bound into a versioned root
release with reproducible full-database bootstrap and round-trip proof so the
post-1.3.0 additions are deployable, provenance-closed, and independently
verifiable.

## Scope

- Advance only the root integrated release to 1.4.0.
- Preserve every frozen package and the historical CRT-309/GOV-209 admission.
- Bind GOV-210, GOV-211, and CRT-310 planning identities explicitly.
- Bootstrap all seven integrated graph namespaces through one safe command.
- Export a normalized graph without Neo4j internal IDs and prove import-twice
  byte identity against authoritative topology, mutation, and semantic IDs.
- Exclude logs, live state, private vault content, and temporary artifacts from
  canonical identity.

## Acceptance criteria

1. Root package, citation, provenance, docs, QA, manifest, and checksums identify
   release 1.4.0 consistently.
2. The full isolated database contains exactly 3,061 nodes and 10,506
   relationships with all seven projection groups ready.
3. A second clean bootstrap produces a byte-identical normalized snapshot.
4. GOV-207, CRT-307, GOV-210, CRT-309, and all frozen package identities remain
   unchanged.
5. CRT-310 contains 35 proposed items, zero eligible items, and zero admissions.
6. Focused, root, native Neo4j, and integrated validation pass at fixed point.

## Verification

- Root Python suite: 349 passed.
- CRT-310: 12/12 validator checks and 3/3 adversarial tests passed.
- Native full database: 6/6 checks passed with exact namespace fingerprints,
  import-twice byte identity, destructive-batch rejection, and mixed-label reset
  isolation.
- Frozen Court substrate, harmonic-invariant, and filter-algebra package suites
  passed; all seven historical package manifests are SHA-256 pinned.
- Root `npm run validate` passes at manifest/checksum fixed point.
