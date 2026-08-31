# GOV-502 - Documentation and validation census reconciliation

**Status:** Done · **Priority:** High · **Points:** TBD · **Epic:** [EPIC-500](EPIC-500-state-honesty-and-baseline-parity.md) · **Sprint:** Sprint 1
**Depends on:** GOV-501 · **Blocks:** -

## Story

As a release maintainer, I want compatibility prose and validation totals to be
derived from current artifacts so users can distinguish the current 60-move
Orrery contract from historical 1.7 sign-off language.

## Scope

- Update `orrery/README.md` with a current compatibility section without
  rewriting the historical 1.7 sign-off.
- Add a current compatibility section to `orrery/RELEASE_CHECKLIST.md` without
  changing its historical release record.
- Add a census composition table (`docs/VALIDATION_CENSUS.md`) that traces
  artifact, declared scope, per-validator count, and runner command, with the
  414→418 release-total transition as its first composition entry.
- Add a generalized, fail-closed validation-prose consistency check
  (`scripts/validate-validation-prose-consistency.mjs`) that requires every
  validation-total claim in current-facing prose to match the emitted
  `qa/integrated-release-validation.json` total or carry a release qualifier,
  records audio/line-number/registry-cardinality exemptions, and emits
  `qa/validation-prose-consistency.json`. Wire it after `validate:release`.
- State the legal predicate as 60 source-backed fixed-degree R/L applications
  from 12 operators, covering all 21 anchors as both source and target.

## Acceptance criteria

1. The compatibility sections distinguish the current parallel R/L catalog from
   historical 21-modal-M wording and link the source-backed catalog and its
   validator.
2. The census table derives every reported total from an artifact, scope,
   per-validator count, and runner; prose is not an independent count source.
3. The emitted `qa/integrated-release-validation.json` total is the sole authoritative current validation count; hard-coded totals are prohibited in prose. 440 and 441 are recognized as historical planning-prose artifacts only and must not be recorded as current validation totals.
4. The documentation does not present 441 or 440 as a current validation total.
5. This story changes documentation and census wiring only; it does not alter
   legal moves, canonical data, API behavior, admission, or runtime authority.

## Non-goals and guards

- Do not rewrite or relabel the 1.7 sign-off as though it had used the current
  catalog predicate.
- Do not infer a count from a ticket estimate or a stale release note.
- Arithmetic output wins over planning assumptions. Any delta from the planning
  baseline must name the generated checks that account for it.

## Verification

- `npm run orrery:catalog:check`
- `npm run validate:prose-consistency`
- Inspect the generated census against `qa/integrated-release-validation.json`.
- `npm run validate --silent`

## Definition of done

The two Orrery documents contain the current compatibility section, the census
table has an executable derivation path (414→418 as its first composition
entry), the prose-consistency check is wired after `validate:release` and green,
and all current totals agree with the generated receipts.

## Completion

- `docs/VALIDATION_CENSUS.md` records 414 (`1.8.0`) → 418 (`1.9.0-dev`) as the
  first composition entry and lists the per-validator receipt totals.
- `qa/integrated-release-validation.json` (418 checks, 0 failed) is the sole
  authoritative current total; `440` and `441` are not presented as current.
- `qa/validation-prose-consistency.json` verdict PASS, zero violations; the
  check exempts audio (`A4=440 Hz`), line-number (`session.ts:440`), and
  registry-cardinality numbers rather than counting them as totals.

## References

- `orrery/src/generated/legal-moves.v2.json`
- `scripts/build-orrery-legal-move-catalog.mjs`
- `orrery/scripts/validate-orrery-legal-move-catalog.mjs`
- `scripts/validate-validation-prose-consistency.mjs`
- `docs/VALIDATION_CENSUS.md`
- `qa/integrated-release-validation.json`
- `qa/validation-prose-consistency.json`
- `docs/RELEASE_1_8_TAXONOMY_AND_ORRERY_GUIDE.md`
