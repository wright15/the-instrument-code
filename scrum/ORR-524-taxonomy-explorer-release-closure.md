# ORR-524 - Taxonomy Explorer release closure

**Status:** Backlog · **Priority:** High · **Points:** TBD · **Epic:** [EPIC-512](EPIC-512-taxonomy-explorer.md) · **Sprint:** Sprint 5
**Depends on:** GOV-510, GOV-511, GOV-512, ORR-521, ORR-522, ORR-523, ORR-514 · **Blocks:** `1.9.0` release closure

## Story

As a release maintainer, I want the Taxonomy Explorer closed through explicit
validator, census, provenance, and fingerprint evidence so `1.9.0-dev` becomes
`1.9.0` only when the delivered interface and its authority boundaries are fully
verified.

## Scope

- Gate the version transition from `1.9.0-dev` to `1.9.0` on all required
  project, Orrery, schema, browser, source, and manifest validation.
- Require passing GOV-510, GOV-511, and GOV-512 artifact validators and their
  receipts before accepting dependent Explorer work as releasable.
- Retain direct native Python validation of GOV-213, GOV-2XX, and GOV-227 rather
  than relying on cross-runtime hash reproduction for their evidence.
- Reconcile every displayed taxonomy and D-tier count from generated artifacts.
- Update `docs/verification/FINGERPRINT_BLAST_RADIUS.md` with all new
  artifact-to-pin edges and their rebuild implications.
- Record release, Scrum, documentation, decision-ledger, manifest, and checksum
  closure only after the gate passes.

## Acceptance criteria

1. The release transition occurs only after ORR-521, ORR-522, and ORR-523 meet
   their acceptance criteria and all named validation receipts pass.
2. A census table traces every released taxonomy count to its source artifact,
   scope, validator, runner, and receipt; no stale planning literal survives.
3. The complete required validation suite, including relevant Orrery type/unit/
   browser checks and `npm run validate`, passes at a no-tracked-change fixed
   point.
4. `docs/verification/FINGERPRINT_BLAST_RADIUS.md` maps every new release
   artifact to its source pins, derived artifacts, and required rebuild paths.
5. Failure, stale source, schema incompatibility, missing negative-action test,
   or incomplete fingerprint map blocks the version flip.
6. GOV-510, GOV-511, and GOV-512 validators pass with source-fresh artifacts and
   receipts; GOV-213, GOV-2XX, and GOV-227 native Python validators also pass.

## Non-goals and guards

- This closure cannot promote planning evidence, activate EPIC-520, or change
  canonical topology, admission, Court policy, runtime authority, or global
  `harmonic.C_H` by packaging it.
- Do not tag or push unless separately requested.
- Arithmetic output wins over planning assumptions. The emitted census and
  receipts control final release totals and every delta has a written derivation.

## Verification

- All story-specific ORR-521 through ORR-523 validation suites.
- `npm run orrery:catalog:check`
- `npm run orrery:check`
- `npm run orrery:test`
- `npm run orrery:build`
- `npm run orrery:browser:test`
- `npm run validate:gov213 --silent`
- `npm run validate:tiered-photonic --silent`
- `npm run validate:gov227 --silent`
- `npm run validate:shadow-ladder --silent`
- `npm run package:manifest --silent && npm run validate --silent`
- `node scripts/build-manifest.mjs --check`

## Definition of done

The version is flipped only after the complete evidence chain, derived census,
fingerprint blast-radius map, manifest, checksums, and validation receipt close
at a clean fixed point.

## References

- `docs/verification/FINGERPRINT_BLAST_RADIUS.md`
- `MANIFEST.json`
- `CHECKSUMS.sha256`
- `qa/integrated-release-validation.json`
