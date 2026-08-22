# GOV-228 - A0 Governor Landform Registry

**Status:** Done · **Priority:** Medium · **Points:** 3 · **Epic:** Ontological geography
**Depends on:** Canonical Governor profiles · **Blocks:** GOV-214 semantic effects and GOV-215 end-to-end artifact compilation

## Story

As a release maintainer, I want a source-backed A0 landform glossary assigned
one-to-one to the seven canonical Governors so the ontology layer can provide
empirical noun records without creating alternate-tier, runtime, graph, or
admission effects.

## Scope

- Replace the Jupiter-only authoring list with direct `sun`, `moon`, `mars`,
  `mercury`, `venus`, `saturn`, and `jupiter` blocks in
  `schemas/domain_landform_registry.yaml`.
- Preserve the rich empirical record shape for every entry:
  `entity_id`, `definition`, `relation_type`, `value`, `governor`,
  `canonicality`, and `source_class`.
- Assign each landform to exactly one primary Governor. Preserve supplied
  crossover information only in the definition string.
- Seed A0 only. Do not create A1/A2 variants, graph records, runtime behavior,
  or semantic-operator effects.
- Apply the Jupiter corrections: move `desert_pavement` and `dry_lake` to Sun,
  replace `ripple_marks` with `aeolian_ripple`, retain cryogenic qualification
  for `sastrugi` and `snowdrift`, and place `wind_gap` under Venus.

## Acceptance Criteria

1. The registry has seven direct Governor blocks and remains `tier: A0` with
   `domain: landform`.
2. All 393 records are unique, lowercase-slugged, primary empirical domain
   facts whose entry governor matches the containing block.
3. The inventory is Sun 34, Moon 40, Mars 66, Mercury 62, Venus 88, Saturn 62,
   and Jupiter 41.
4. Every supplied crossover remains in its definition without multi-governor
   arrays or tags.
5. The regenerated pentatonic planning-evidence audit remains current after
   the source-authority update and all root validation checks pass.

## Verification

```bash
npm run validate:pentatonic-binding-audit
node scripts/build-pentatonic-binding-audit-closure.mjs --check
npm run package:manifest
npm run validate:release
npm run validate
```

**Results (2026-08-22):** 393-record structural validation passed; the
pentatonic audit passed Phase 1 (19/19), detached Neo4j projection, and closure
(11/11); root validation passed 411/411 checks.

## Boundary

This ticket completes only the A0 ontological glossary ingestion. GOV-214 and
GOV-215 remain separate, incomplete roadmap work for source-backed semantic
effects and persisted end-to-end artifact compilation.
