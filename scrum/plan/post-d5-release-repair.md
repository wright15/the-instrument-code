# Post-D5 Release Repair Followup

Assessment date: 2026-09-13. Read the Integration Follow-Up in
`scrum/plan/post-d5-product-gate-status.md`; that shared status file was not edited.
This is a bounded repair receipt, not release closure or baseline authorization.
Release identity remains `1.9.0-dev`.

Integration follow-up: the root `validate:harmonic-invariants` alias now routes
to the scoped runner. The alias was run successfully: 8 package tests,
11 registry checks, 4 determinism checks, and the frozen 31-file manifest check.
This supersedes the entrypoint limitation below, without editing frozen bytes.

## Scope And Ownership

Changed only the validation files and derived receipts listed below. The initial
worktree already contained manifest/checksum, Orrery, planning, and QA changes.
Concurrent Orrery, taxonomy-builder/schema, and Neo4j investigation changes were
observed and left untouched. No frozen package payload, package manifest, root
manifest/checksum, release identity, package.json, decision/observation ledger,
or database baseline was edited by this repair.

## Frozen Composite Fingerprint Identity

The payload walker included `__pycache__` and `.pytest_cache`, although the frozen
Python package manifest builders explicitly exclude both. The integrated walker
now uses those same non-payload exclusions. No expected fingerprint was changed.
Regression tests cover cache independence and detection of payload additions,
deletions, and byte changes, plus exact live-to-frozen-manifest record parity for
both affected packages.

This fixes unstable traversal, **not the baseline authority mismatch**:

| Package | Original pin receipt count | Frozen payload count | Current cache-free payload hash |
| --- | ---: | ---: | --- |
| harmonic-invariants v0.1.0 | 40 | 31 | `1f5b656e4c962eba5e60ac8a28d975ef35d7ddd833993545589bc09925ed7335` |
| court-filter-algebra v0.1.0 | 44 | 36 | `3d4f3b658dbd360cdd9dec0c05e5ff12695da9e4c0ec603d27bfb341af395679` |

The original pins are still `3bf5f181...` and `a2ca5141...`. They were introduced
in commit `dbc878e`; its `qa/integrated-release-validation.json` recorded PASS
over 40/44 files, rather than the 31/36 declared payload records. The current
pre-repair receipt counted 43/47 files. Both directories have no tracked changes
since their admission commit `4ea389a`; `git diff dbc878e --stat` for them is empty.
Every current non-cache payload record matches its frozen package manifest,
including size and SHA-256. The other five composite payload pins pass unchanged.

The historical aggregate receipt does not preserve the extra files' bytes or
paths. Current cache contamination is established; exact reconstruction of the
historical extra-file aggregate is not claimed. Substituting the cache-free hashes
for the two existing pins requires explicit authority reconciliation. The gate
continues to FAIL rather than accepting newly calculated baseline values.

## Harmonic Schema Resolver

Reproduced the existing package command: builder freshness and all 8 pytest tests
pass, but the negative compression-guard fixture's second release validation
raises `Unresolvable JSON pointer: '$defs/courtGeometry'`. The definition exists;
the deprecated mutable `RefResolver` has lost the root scope after external schema
traversal. This is not a missing schema definition or an invalid canonical record.

Added `scripts/validate-harmonic-invariants.py`, an integrated execution adapter.
It executes the unchanged frozen builder check, tests, package validator,
determinism validator, and package-manifest check. During the frozen validators'
execution it constructs Draft 2020-12 validators using an immutable `referencing`
registry containing the same resolver-store schemas. No schema constraint or
negative fixture is removed. The frozen report writer is replaced with exact byte
comparison: differing results fail with `FROZEN_REPORT_MISMATCH`, not a rewrite.
Determinism builds still execute in the frozen script's temporary directories.
Bytecode generation is disabled, including in child processes.

The integrated release validator now invokes this adapter. New regressions test
repeated valid/tampered/valid resolution across local and external references,
report mismatch rejection without writes, and the full runner preserving every
frozen payload and manifest byte. The runner passes 8 package tests, 11 registry
checks, 4 determinism checks, and the 31-file package-manifest check.

**Entrypoint limitation:** root `npm run validate:harmonic-invariants` still
delegates directly to the unchanged frozen package and reproduces the old error.
`scripts/validate-court-admission.mjs` also still uses that alias. This scripts-only
repair does not edit package.json or historical admission outputs. The integrating
owner should route the root validation alias to
`python3 scripts/validate-harmonic-invariants.py`; do not patch frozen package
source or regenerate its manifest. The integrated release gate already uses the
working runner directly.

## Pentatonic Closure

Reproduced `STALE_PENTATONIC_BINDING_AUDIT_CLOSURE`, then ran the existing builder
without changing it. The only artifact changes are its two decision-ledger hash
bindings and the resulting report fingerprint. All candidate, phase-1, phase-2,
phase-3, Cypher, backlog, and source-authority bindings remain unchanged.
The current ledger binding is derived from the existing ledger; the ledger itself
was not changed. This follows its cycle-open dependent-planning-evidence rebuild
rule and the user's execution/rebuild authorization, not a new baseline decision.

The rebuilt closure passes 11/11 checks, retains `planning_evidence`,
`admissionEffect: none`, `detached_audit_only`, and `crt310Execution: false`.
Fresh standalone validation also ran the detached Neo4j test successfully with
cleanup and no skips. Its phase-1 and phase-2 report bytes remained unchanged.
This detached audit is not full-database baseline or deployment evidence.

## Executed Verification

Python commands used the existing `.venv/bin` on PATH; no dependency changes.

- Ran original `npm run validate:harmonic-invariants --silent`: FAIL as reproduced
  above, after 8 passing tests and builder freshness.
- Ran `python3 scripts/validate-harmonic-invariants.py`: PASS, all original stages.
- Ran `python3 -B -m pytest -p no:cacheprovider -q scripts/test-release-repair.py`:
  PASS, 3 tests; deprecated imports in frozen code still emit warnings.
- Ran `node --test scripts/manifest-utils.test.mjs`: PASS, 3 tests.
- Ran `node scripts/build-pentatonic-binding-audit-closure.mjs`: PASS, 11/0;
  `--check` failed before rebuild and passed repeatedly afterward.
- Ran `npm run validate:pentatonic-binding-audit --silent`: PASS, 19 phase-1
  checks, 12 Python tests, 1 detached Neo4j test, and 23 Cypher files; zero skips.
  Log: `/tmp/opencode/post-d5-release-repair-pentatonic.log`.
- Ran `npm run validate --silent` with native Python and bytecode disabled:
  completed at **413 passed / 5 failed** in the 418-check release validator.
  Log: `/tmp/opencode/post-d5-release-repair-validate.log`.
  Harmonic validation, pentatonic closure freshness, and pentatonic evidence
  fingerprint closure now PASS. Remaining failures are release manifest fixed
  point, frozen composite payload identities, declared full-database reproducibility
  and deployment evidence, manifest completeness, and manifest hash parity.
  Checksum-to-manifest parity passes; this does not establish current-file parity.
- Ran `git diff --check`: PASS. Protected frozen-package/ledger/release/package.json
  diff inspection was empty. Root manifest/checksum changes predate this repair.
- Skipped manifest/checksum generation: outside ownership. New and concurrent
  changes necessarily leave packaging stale; no fixed-point PASS is claimed.
- Skipped fresh full-database native/configured deployment runs and all baseline
  recapture: separate investigation ownership and unresolved baseline authority.
- Skipped Orrery UI/unit/browser work: separate product ownership.

The full integrated command short-circuits before its final prose-consistency and
Cypher stages when release validation fails. Cypher was exercised separately by
the passing pentatonic suite. This receipt was added after the full validation run;
it is not a final-state packaging receipt.

## Files Owned By This Repair

Inventory reviewed against focused `git diff --stat` and `git status --short`;
pre-existing and concurrent changes are not claimed here.

- `scripts/manifest-utils.mjs`
- `scripts/manifest-utils.test.mjs` (new)
- `scripts/validate-release.mjs`
- `scripts/validate-harmonic-invariants.py` (new)
- `scripts/test-release-repair.py` (new)
- `qa/pentatonic-binding-audit-closure.json` (source-derived rebuild)
- `qa/integrated-release-validation.json` (updated existing failure receipt)
- `scrum/plan/post-d5-release-repair.md` (this report)

No shared product status update, release closure, tag, push, commit, or baseline
promotion was performed. Remaining integration work is explicit frozen-pin
authority reconciliation, root npm alias routing, separately owned database
evidence reconciliation, and authorized packaging at a stable final tree.
