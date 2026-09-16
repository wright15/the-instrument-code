# Post-D5 Product Gate Status

Assessment date: 2026-09-13. Release remains `1.9.0-dev`. ORR-521,
ORR-522, ORR-523, and ORR-524 remain Backlog; no closure is claimed.
This is an execution/assessment record, not a release authorization, canonical
source, or replacement for a clean fixed-point receipt.

## Integration Follow-Up

Latest full validation after ordered packaging completed at **416 passed / 2
failed**. The remaining integrated gates are frozen composite payload identities
and declared full-database reproducibility/deployment evidence. Source freshness,
harmonic validation, manifest completeness/hash parity, and checksum parity pass.
The development release remains blocked, not closed. This later result supersedes
the earlier five-failure assessments below.

Latest continuation: taxonomy implementation and focused browser coverage have
advanced beyond the initial assessment below. See
`post-d5-taxonomy-implementation.md` and
`qa/post-d5-taxonomy-browser-receipt.json`: 144 unit tests, production build,
and the 15-case focused browser matrix pass. The fingerprint map now includes
taxonomy/D-tier/explanation rebuild paths. Harmonic schema resolution and
pentatonic closure freshness are repaired (`post-d5-release-repair.md`).
Neo4j's exact remaining mismatch is isolated to current-versus-retained release
provenance; independent imports/readbacks are byte-identical, but baseline
verification still fails (`post-d5-neo4j-investigation.md`). The historical
composite aggregate pins also need authority reconciliation despite exact
per-file parity with frozen package manifests. No pin or release was silently
rebaselined. Earlier failures below remain execution history, not current claims.

After the delegated assessment below, the integrating executor filed the original
capture, added six ranked NEXT_STEPS pointers, reviewed the drafts and code fixes,
and refreshed `MANIFEST.json` and `CHECKSUMS.sha256` using
`npm run package:manifest --silent`. The historical statements below about packaging
being prohibited apply to that delegated assessment only, not the whole task.
`node scripts/build-manifest.mjs --check` passed after generation and again after
validation (1070 files). `git diff --check` passed.

`env PATH="$PWD/.venv/bin:$PATH" npm run validate --silent` was attempted with a
120-second tool limit and timed out; retried with a 600-second limit, it completed
with **413 passed / 5 failed**, not release success. The current failure set is:

- Frozen composite package payload identities.
- Harmonic invariant package validation (the unresolved schema reference below).
- Pentatonic binding closure freshness.
- Pentatonic binding evidence fingerprint closure.
- Declared full-database reproducibility and deployment evidence.

Manifest completeness, hash parity, and checksum parity passed in that run.
These results supersede the earlier five-failure list below; an unchanged count
does not mean unchanged failures. No frozen package, baseline, release identity,
or decision/observation ledger was changed to suppress the failures. Product
implementation and release closure remain incomplete. This addendum changes
planning prose after the validation run; subsequent packaging binds that prose
but cannot turn the failed suite into a release fixed-point PASS.

## Authority And Scope

Read `framework/AGENTS.md`, all four ORR tickets,
`provenance/DECISION_LEDGER.md` (cycle-open Neo4j guard and eleven standing
rules), `scrum/plan/sprint-4-epic-520-research-handoff.md`,
`docs/verification/VERIFICATION_REPORT_GATE_STATUS.md`, GOV-512, and
`scrum/DEFECT-orrery-game-timeout.md`.

No ledger, manifest, checksum, release identity, shared package version, or
baseline was edited. No configured external database was touched. Native and
configured-local Neo4j runs each used a separate `Neo4jHarness` instance with
temporary storage, loopback ports, cleanup, and residual-file/port assertions.
Baseline capture was explicitly disabled for the native test.

The initial `git status --short` was empty. Other workers subsequently created
`continuous-typology-obs-draft.md`, `d4-boundary-draft.md`,
`post-d5-receipt-check.md`, and `post-d5-research-successors.md` in `scrum/plan/`.
Those files were not edited or reverted here. The manifest assessment includes
concurrent filesystem changes; this run is not a fixed point.

## Product Assessment

- **ORR-521: partial implementation, blocked.** The generated read model,
  builder, schema, runtime filter/lookup module, unit tests, and Explorer UI
  exist. `orrery:taxonomy:check` passes. Executing `buildBundle(process.cwd())`
  from `scripts/build-orrery-taxonomy-read-model.mjs` yields 462 records:
  70 anchors, 238 satellites, 154 boundary records. These are source-derived
  totals, not a new taxonomy decision. The UI at `orrery/src/main.ts:1060-1119`
  renders source identity and explicit absent-ID text. Runtime parsing is not
  full schema validation: several fields, source bindings, and role counts are
  cast rather than fully validated. The static import is parsed at module load;
  malformed/unavailable bundle handling is not an implemented bounded UI state.
  No taxonomy-specific browser assertions were found in the existing browser
  script. Keyboard filtering, unavailable taxonomy data, and invalid taxonomy
  ID browser acceptance remain unverified. Source-authority filtering exists
  in the model but has no dedicated UI selector.
- **ORR-522: partial implementation, blocked.** The dataset builder, schema,
  runtime view, fallback helper, unit tests, and D-tier list exist. Executing
  `buildDataset(process.cwd())` from
  `scripts/build-orrery-d-tier-taxonomy-dataset.mjs` yields 175 D-tier records,
  including 49 anchors. This differs in scope from the GOV-227 anchor-only
  census, not in arithmetic. The checked-in dataset fails freshness with
  `STALE_D_TIER_TAXONOMY_DATASET`. Runtime parsing does not validate the full
  fifth-space schema or census freshness. `D_TIER_DATASET` is parsed eagerly
  before `dTierDatasetView` can select a fallback, and the UI always supplies
  that static dataset. Unit fallback behavior does not prove browser fallback
  availability. The fallback uses global source-order ordinals, not an
  explicitly grouped ordinal-by-tier layout. Confirmed/refuted/partial unit
  cases pass, but browser outcome/fallback/source-label coverage is absent.
- **ORR-523: acceptance implementation missing/incomplete, blocked.** The
  taxonomy inspector is a plain identity/provenance-path string. Inspection did
  not find a full-taxonomy bounded explanation contract, declared relationship
  rendering, optional GOV-510 context matrix, deterministic source-link tests,
  or negative-action tests for every explanation affordance. Existing anchor
  provenance and field-derivation surfaces are not substitutes. In particular,
  `scripts/build-field-derivation-bundle.mjs:137-142` requires confirmed inputs;
  it cannot silently supply the outcome-agnostic ORR-523 contract.
- **ORR-524: blocked.** Orrery check/build, current release validation,
  manifest freshness, and both Neo4j gates fail. The fingerprint map in
  `docs/verification/FINGERPRINT_BLAST_RADIUS.md` lacks the taxonomy read-model
  and D-tier dataset artifact-to-pin/rebuild edges. GOV-512's checked-in ticket
  explicitly describes its fixture matrix as analytic only; no executable
  Research Gate 3 matrix harness was found. A historical Done label is not a
  fresh matrix receipt. No version flip, ticket closure, tag, push, or manifest
  regeneration was attempted.

## Minimal Fixes

Two genuine input-validation defects were reproduced with regression tests:

- `filterTaxonomyRecords` accepted unsupported keys such as `name`, expanding
  the declared filter contract. It now rejects keys outside role, tier, Forte,
  office status, and authority.
- `parseDTierDataset` accepted unknown/duplicate IDs and drifted identity fields
  as ready data. Unknown IDs could leave `identity` undefined for the renderer.
  It now reconciles the full ordered D-tier identity fields against the
  canonical taxonomy model, selecting incompatible fallback on mismatch.

The regression run failed four assertions before the fixes (117 passed,
4 failed). After the fixes, all 121 tests passed. These are bounded guards,
not claims that all schema, freshness, rendering, or browser gaps are fixed.
Generated data was not refreshed merely to make stale-source gates green.

## Executed Suites

Commands ran from the repository root unless stated otherwise. Native Python
commands used `env PATH="$PWD/.venv/bin:$PATH"` so `python3` and pytest resolve
to the existing project environment; no dependencies or package versions were
changed. Shared suites are listed once here and apply to every dependent story.
Logs below are local execution output under `/tmp/opencode/`, not packaged QA
artifacts. Commands without a log path have results in the execution transcript.

- `npm run orrery:catalog:check`: **ran indirectly**, PASS through the identical
  catalog check invoked by `orrery:check` and `orrery:build`; 60 legal moves.
- `npm run orrery:check`: **ran**, FAIL at `STALE_FIELD_DERIVATION_BUNDLE`, both
  before and after the fixes. Catalog and evidence-bundle stages passed
  (evidence 14/0); downstream stages were short-circuited. Final log:
  `/tmp/opencode/post-d5-final-orrery-check.log`.
- `npm run orrery:taxonomy:check`: **ran**, PASS, source-fresh 462-record model.
- `npm run orrery:d-tier:check`: **ran**, FAIL,
  `STALE_D_TIER_TAXONOMY_DATASET`; its downstream schema validator did not run.
- `npm run orrery:photonic:check`: **ran separately**, PASS 9/0, 28 records
  across 14 anchors; this covers the stage short-circuited by Orrery check.
- `npm run orrery:test`: **ran**, initial 118/118; regression reproduction
  117 passed/4 failed; final 121/121 in 15 files. Includes taxonomy and D-tier
  contract tests, plus existing provenance and negative-action unit coverage.
  No claim of ORR-523 affordance coverage follows from those existing tests.
- `./node_modules/.bin/tsc --noEmit` from `orrery/`: **ran**, PASS after fixes.
  This is standalone typechecking, not a passing `orrery:check` receipt.
- `npm run orrery:build`: **ran**, FAIL at the stale field-derivation prerequisite;
  Vite production bundling was not reached.
  Log: `/tmp/opencode/post-d5-orrery-build.log`.
- `npm run orrery:browser:test`: **ran**, FAIL after six passing sessions;
  details and exception citation below. Command was captured with
  `set -o pipefail && npm run orrery:browser:test 2>&1 | tee /tmp/opencode/post-d5-product-browser.log`.
- `npm run validate:gov213 --silent`: **ran native Python**, PASS 14/0 plus
  19 pytest tests, including source freshness and exact certificate checks.
- `npm run validate:tiered-photonic --silent`: **ran native Python**, PASS 15/0
  plus 23 pytest tests. Also executed within the integrated command.
- `npm run validate:gov227 --silent`: **ran native Python**, PASS 17/0 plus
  12 pytest tests. Its scope remains 49 D-tier anchors, not all D-tier records.
- `npm run validate:twin-hub --silent`: **ran native Python**, PASS 30/0 plus
  8 pytest tests. Log: `/tmp/opencode/post-d5-twin-hub.log`.
- `npm run validate:fifth-space-census --silent`: **ran native Python**, PASS
  24/0 plus 8 pytest tests. Log: `/tmp/opencode/post-d5-fifth-space.log`.
- `npm run validate:shadow-ladder --silent`: **ran native Python**, PASS 37/0
  plus 6 pytest tests. Log: `/tmp/opencode/post-d5-shadow-ladder.log`.
- `env -u NEO4J_FULL_CAPTURE_BASELINE npm run test:neo4j:full:raw`: **ran** the
  native isolated full-database suite, 1 passed/1 failed, no skips. Trusted
  ingestion rejection passed. Bootstrap readiness/count and snapshot schema
  assertions were reached successfully; source/baseline snapshot verification
  returned false at `tests/neo4j/full-database-live.test.mjs:130`. Subsequent
  import-twice and reset-isolation assertions were not reached. This is not a
  missing-Neo4j or missing-URI skip, nor a native reproducibility pass.
- `node /tmp/opencode/post-d5-configured-roundtrip.mjs`: **ran** a separately
  configured disposable-local harness, executing
  `scripts/validate-neo4j-deployment-roundtrip.mjs` with explicit temporary
  `NEO4J_*` configuration. Bootstrap passed at 3,061 nodes/10,506 relationships;
  configured roundtrip and byte-identity gates failed (1 passed/2 failed).
  Receipt: `qa/neo4j-deployment-roundtrip-validation.json`;
  log: `/tmp/opencode/post-d5-configured-roundtrip.log`. The wrapper's identity
  gate requires a passing roundtrip, so its failure alone does not establish
  that two independently valid snapshots differed byte-for-byte.
- `node scripts/build-manifest.mjs --check`: **ran**, FAIL,
  `STALE_PACKAGE_MANIFEST`. No manifest/checksum write was authorized or made.
- `npm run validate --silent`: **ran**, FAIL at release validation, 413 checks
  passed/5 failed out of 418. Log: `/tmp/opencode/post-d5-validate.log`.
  Validator output updated `qa/integrated-release-validation.json`. Failures:
  manifest fixed point, harmonic invariant validation, pentatonic binding
  closure freshness, pentatonic binding evidence fingerprint closure, manifest
  completeness. This run preceded the final code/report changes and the new
  configured Neo4j failure receipt; it is not a final-state release receipt.
- `npm run validate:harmonic-invariants --silent`: **ran separately** to diagnose
  the integrated failure. Builder check and 8 pytest tests passed, then package
  validation raised `jsonschema.exceptions._RefResolutionError: Unresolvable
  JSON pointer: '$defs/courtGeometry'`. Log:
  `/tmp/opencode/post-d5-harmonic-invariants.log`. No frozen-package fix applied.
- `npm run validate:prose-consistency`: **ran separately** because integrated
  validation stopped earlier; PASS, zero violations. Its report reflects the
  executed release result, not a green release. Log: `/tmp/opencode/post-d5-prose.log`.
  Repeated after this assessment was added: PASS, zero violations.
- `npm run validate:cypher`: **ran separately** for the same short-circuit
  reason; PASS. Log: `/tmp/opencode/post-d5-cypher.log`.
- Builder census inspection: **ran**, via `node --input-type=module -e` importing
  `buildBundle` and `buildDataset` and printing record/role/tier totals only.
  No builder outputs were written by that inspection.
- `git status --short`, `git diff --stat`, focused `git diff`,
  `git diff --check`, and protected-path `git diff --name-only`: **ran**.
  Whitespace check passed; protected paths had no diff at inspection time.

## Browser Receipt

The actual session suffix was `579252`. The script completed assertions for
`orrery-api-unavailable`, `orrery-webgl-unavailable`, `orrery-shared-session`,
`orrery-invalid-link`, `orrery-stale-session`, and
`orrery-incompatible-response` before entering `orrery-game`.

The game session emitted `TimeoutError: page.waitForFunction: Timeout 30000ms
exceeded`, then `Browser assertion failed: fresh-session modal objective and
invalid-route feedback` with `Actual result: false`. The script stopped and
cleaned up its sessions. It was not retried or relabelled as passing.

The six real passing sessions plus
`scrum/DEFECT-orrery-game-timeout.md:16-20` satisfy the documented exception's
six-session evidence condition. They do not resolve the defect, exercise the
missing taxonomy-specific browser cases, or waive other product/release gates.
Scene, mobile-scene, audio, and MVP sessions later in the script were **skipped**
because execution terminated at the game assertion. The script's temporary
screenshots/snapshots were cleaned up; the retained console log is the receipt.

## Skipped Or Unmet Gates

- Taxonomy browser suite (462 records, invalid taxonomy IDs, unavailable data,
  keyboard filters): **skipped**, no such assertions in the existing runner;
  the legacy six sessions are not substitutes.
- D-tier browser suite (outcome variants, fallback layout, source labels):
  **skipped**, no executable browser coverage or injectable UI fallback found.
- ORR-523 contract/unit/browser suites and every-affordance negative-action
  suite: **skipped**, full-taxonomy explanation implementation/tests missing.
- GOV-512 dual-confirmed/single-confirmed/refuted/partial/stale/absent gate
  matrix: **skipped**, no executable gate-decision harness found; analytic
  historical ticket text is not a fresh run.
- `npm run build:shadow-ladder --silent` emission: **skipped**, no ledger change
  made here and the existing source-fresh `--check`/validator/test chain passed;
  emission is not needed for this bounded assessment.
- `npm run test:neo4j:full` report-writing wrapper: **skipped**, the identical
  raw native suite ran and failed; no passing native QA receipt was fabricated.
- Existing external configured Neo4j target: **skipped**, shell configuration
  presence check found URI, username, password, import directory, and target
  class absent. `.env` was not read or sourced. The configured gate was instead
  actually attempted in the isolated disposable-local instance described above.
- `npm run package:manifest --silent && npm run validate --silent` closure
  sequence: **skipped as a sequence**, manifest/checksum modification prohibited.
  The validation half and read-only manifest check ran independently and failed.
- Final no-tracked-change release fixed point: **skipped**, prerequisite gates
  fail, protected packaging writes are prohibited, and concurrent work plus
  this report changes the assessed tree. No release closure claim is possible.

## Files Changed By This Assessment

Derived from `git diff --stat` and `git status`, excluding the four concurrent
planning drafts named above:

- `orrery/src/taxonomy-read-model.ts`
- `orrery/src/taxonomy-read-model.test.ts`
- `orrery/src/d-tier-taxonomy-dataset.ts`
- `orrery/src/d-tier-taxonomy-dataset.test.ts`
- `qa/integrated-release-validation.json` (validator-generated failure receipt)
- `qa/neo4j-deployment-roundtrip-validation.json` (fresh configured-local failure)
- `qa/validation-prose-consistency.json` (validator-generated scan receipt)
- `scrum/plan/post-d5-product-gate-status.md` (this assessment)

Temporary work outside the repository: the configured-local wrapper and logs
under `/tmp/opencode/post-d5-*`. No secrets are included in this report.

## Required Follow-Up

Complete the product acceptance gaps before closure; repair source-derived
artifact freshness with the appropriate rebuild/pin review, complete the
fingerprint map, investigate the frozen harmonic-invariant resolver failure,
and reconcile Neo4j snapshot verification under an authorized current-release
baseline decision. Do not recapture a baseline or update protected packaging
just to suppress failing evidence. Re-run all required gates and packaging at
an authorized, no-tracked-change fixed point afterward.
