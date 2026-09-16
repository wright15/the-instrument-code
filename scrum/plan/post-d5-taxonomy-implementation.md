# Post-D5 Taxonomy Implementation

Date: 2026-09-13. ORR-521/522/523 implementation follow-up; no story closure,
release authorization, or fixed-point receipt is claimed. Ticket statuses and
release versions were not changed.

## Integration Browser Follow-Up

The focused matrix now passes, recorded with source hashes in
`qa/post-d5-taxonomy-browser-receipt.json`. This supersedes the browser gap below
for that test's bounded coverage, not for release closure. Actual failures were:
optional context module delivery returned JSON MIME instead of JavaScript;
raw-module interception missed Vite's reordered query parameters; and an
"unavailable" substring wait incorrectly accepted a loading message. The
application now fetches optional JSON through its existing source allowlist;
the test matches parsed query parameters and waits for the exact terminal state.

The completed run exercised 15 outcome/fallback cases, nine source-link clicks,
keyboard filtering, invalid-ID/withheld-office handling, no API requests or
storage changes from exercised controls, and a 390x844 mobile inspector.
No known-game exception was used. All 144 unit tests and `npm run orrery:build`
passed again after the application fix. The build still emits its chunk warning.
This is not exhaustive browser traversal of every record or a GOV-512 gate test.

## Implemented

- Taxonomy and D-tier semantic parsing no longer runs eagerly at module import.
  A regression test imports both modules with malformed bundled objects and
  verifies bounded states rather than an import exception.
- Explorer loading uses separately caught raw-module loads and JSON decoding.
  Missing delivery and incompatible data have distinct visible states. Invalid
  IDs never select a nearby record. A missing canonical model also prevents
  D-tier substitute identities. While the D-tier module loads, source-backed
  identities are already visible in ordinal-by-tier fallback order.
- Added a native labelled source-authority selector alongside the established
  role/tier/Forte/office controls. Existing UI classes and layout are retained.
- Both taxonomy schemas now validate record fields and bindings rather than only
  array lengths. Runtime Ajv validation is followed by identity/order, role-count,
  declared-endpoint, census-binding, and fifth-space consistency checks. `holes`
  is correctly a count, not an array. Positions are checked against the state's
  fifth-space permutation; span, gaps, holes, mask, and arc are reconciled.
- Fallback records are grouped D1 through D7, source-ordered within each group,
  with ordinal numbering restarting at one. No fifth-space values or research
  verdicts are invented. Valid confirmed/refuted/partial inputs remain usable.
- The taxonomy builder now preserves canonical source-provenance and
  classification fields and projects only declared `structuralEdges` and
  `boundaryRelationRows` from `canonical/universal-network-data.json`. It does not
  compute new edges, traverse arbitrary graph paths, or promote `fieldEdges`
  audit proximity into a structural relationship.
- Explanations show source derivation, declared role and office status, direct
  declared relationships, and descriptive fifth-space data. Relationship IDs,
  endpoint order, direction, governing flags, provenance, and source authority
  are retained. The ORR-512 `MAX_ROWS` bound is reused; oversized explanations
  fail closed. There is no recursive explanation traversal or query surface.
- Optional GOV-510 presentation is separate from base explanations. Candidate
  identity/fingerprint, canonical-ledger binding, and supported verdict govern
  context availability. Confirmed/refuted/partial, absent, stale, and malformed
  unit cases leave the source-backed base explanation unchanged. This is not a
  full GOV-510 artifact validator or a GOV-512 research-gate decision.
- Source links use a fixed artifact allowlist and Vite-emitted source assets,
  not user-provided URLs or assumptions about repository-root HTTP routes.
  Links open with `noopener noreferrer`; explanations expose no execution
  controls. Text is rendered with DOM text content, not interpreted markup.

## Source Results

- Taxonomy: 462 records, comprising 70 anchors, 238 satellites, 154 boundary
  records. These counts remain source-derived and unchanged.
- Declared relationships: 1,064 unique source IDs across the two explicitly
  selected network collections; maximum 10 incident rows on any one record.
  Node tests compare every projected field and incident relationship list to
  the canonical source collections, including deterministic order.
- D-tier: 175 records. Source fields and measurements reconcile with the census;
  checked-in census verdict remains `confirmed`, not forced by this work.
- Taxonomy model, D-tier dataset, and field-derivation bundle were emitted by
  their existing builders. Field-derivation's existing confirmed-input guard
  passed on actual sources; that builder was not weakened or reused as the
  outcome-agnostic ORR-523 explanation contract.
- Optional evidence fingerprints are pinned separately from canonical source
  identity. Builder fixtures show absent or malformed optional evidence does
  not prevent building the canonical taxonomy model. A D-tier builder guard
  now rejects census identity drift instead of silently copying over it.

## Verification

| Command / Inspection | Actual Result |
| --- | --- |
| `node scripts/build-orrery-taxonomy-read-model.mjs` | PASS; emitted model |
| `node scripts/build-orrery-d-tier-taxonomy-dataset.mjs` | PASS; emitted dataset |
| `npm run orrery:field-derivation:build` | PASS; emitted three observations without outcome changes |
| `npm run orrery:test` / final direct Vitest run | PASS; 144 tests in 16 files |
| `node --test orrery/tests/taxonomy-builders.node.mjs` | PASS; 3 tests |
| `./node_modules/.bin/tsc --noEmit` from `orrery/` | PASS |
| `npm run orrery:check` | PASS; all prerequisite checks and TypeScript reached |
| `npm run orrery:build` | PASS; prerequisite checks, TypeScript, and Vite production build reached |
| `git diff --check` | PASS |
| Live browser basic inspection | 462 taxonomy buttons; D-tier status ready/confirmed |
| Focused taxonomy browser matrix | FAILED; timeout, not acceptance PASS |

Final check/build logs are local execution output, not packaged gate receipts:
`/tmp/opencode/post-d5-taxonomy-final-check.log` and
`/tmp/opencode/post-d5-taxonomy-final-build.log`.

The initial stronger-schema iteration rejected legitimate Z-labelled Forte
families; the pattern was corrected from source evidence. Intermediate
TypeScript failures were corrected before the final passing runs. No canonical
data was changed to satisfy those checks.

## Browser Gap

The new focused runner is `orrery/tests/taxonomy-browser.js`, invoked from
`orrery/` with:

```sh
./node_modules/.bin/playwright-cli -s=taxonomy-product open http://127.0.0.1:5183
./node_modules/.bin/playwright-cli -s=taxonomy-product run-code --filename=tests/taxonomy-browser.js
```

The development server used `npm run dev -- --port 5183`. The session opened,
and a separate live inspection confirmed the basic counts/status above. The
matrix command returned exactly:

```text
TimeoutError: page.waitForFunction: Timeout 30000ms exceeded.
```

No matrix completion receipt or per-case pass count was returned. Therefore no
claim is made that its keyboard, source-link, outcome/fallback, mobile, or
every-affordance negative-action assertions passed. The runner includes those
assertions, request-method/API guards, storage comparisons, and actual source
link clicks, but remains an unpassed acceptance test. Browser automation was
stopped after the CLI failure; the named browser and owned Vite process were
closed. Subsequent loading/measurement/type refinements received unit/type/build
checks, not another browser run.

## Remaining Gates

- Diagnose the focused browser timeout and obtain a complete browser receipt,
  including unavailable/incompatible delivery, keyboard filtering, grouped
  fallback visibility, context outcomes, every explanation link, and mobile.
- Browser negative-action coverage is authored but unverified. Passing pure
  unit no-network/no-input-mutation assertions are not a substitute for it.
- The production build emits a chunk-size warning (main chunk approximately
  1.54 MB before gzip). Existing static bundled defaults and separate raw UI
  loads duplicate some data; this is not a fully lazy asset architecture.
  Schema-invalid delivery is bounded, but physically invalid checked-in JSON
  can still fail the build through static imports, which is not a browser
  fallback receipt.
- Runtime schema/binding checks are not cryptographic authentication of
  arbitrary remote artifacts. Full byte/source freshness remains the existing
  builder/check responsibility. Source links reference build-time assets.
- Full legacy browser, release validation, GOV-512 matrix, Neo4j, packaging,
  and no-tracked-change fixed-point gates were not run in this work. Existing
  failures in the gate-status assessment are not cleared by product checks.
- No manifest/checksum refresh, ledger edit, shared release-validator edit,
  baseline change, or release-version change was performed by this worker.

## Files Owned

- `orrery/src/main.ts`
- `orrery/src/taxonomy-read-model.ts`
- `orrery/src/d-tier-taxonomy-dataset.ts`
- `orrery/src/d-tier-taxonomy-dataset.test.ts` (ordinal assertion; existing regressions retained)
- `orrery/src/taxonomy-explain.ts` (new)
- `orrery/src/taxonomy-explain.test.ts` (new)
- `orrery/src/generated/taxonomy-read-model.v1.json`
- `orrery/src/generated/d-tier-taxonomy-dataset.v1.json`
- `orrery/src/generated/field-derivation-bundle.v1.json`
- `scripts/build-orrery-taxonomy-read-model.mjs`
- `scripts/build-orrery-d-tier-taxonomy-dataset.mjs`
- `schemas/harmonic-orrery-taxonomy-read-model.schema.json`
- `schemas/harmonic-orrery-d-tier-taxonomy-dataset.schema.json`
- `orrery/tests/taxonomy-builders.node.mjs` (new)
- `orrery/tests/taxonomy-browser.js` (new, unpassed)
- `scrum/plan/post-d5-taxonomy-implementation.md` (this report)

The existing field-derivation validator additionally refreshed
`qa/orrery-field-derivation-bundle-validation.json` as a command side effect:
7 passed / 0 failed, binding the rebuilt bundle. No QA receipt was hand-edited.
The initially dirty worktree and concurrent changes in protected packaging,
release validators, ledgers/planning, QA, and Neo4j files were left alone; their
presence in global `git diff` is not attributed to this implementation.
