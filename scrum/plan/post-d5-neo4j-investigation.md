# Post-D5 Neo4j Investigation

Assessment date: 2026-09-13. Current identity: `1.9.0-dev`.
Result: **current-release baseline acceptance remains FAIL**. The retained
`1.8.1` baseline is preserved. This report is diagnostic, not baseline admission,
fresh historical reproducibility evidence, or release closure.

## Exact Fingerprint Blocker

The native failure at `tests/neo4j/full-database-live.test.mjs:130` is the
provenance namespace comparison in
`graph/runtime/neo4j-roundtrip.mjs:321`, not a count, schema, connectivity, or
byte-stability failure. Six namespaces match the retained baseline exactly:
topology, mutation, semantic, governorRuntime, court, and gov210.

Observed provenance fingerprints:

```text
retained 1.8.1: 1c3e6edf80af60ce1f64a4f5b7b4b519b9865bca47ab47ee1d876cee6a1b4127
current dev:    ba2756b427f2d84fca099ba884c097da3e19845f71f65f0fcefece38ec8259b5
```

These values were derived from the actual local configured run, not assumed
from old planning prose. Counts remain 3,061 nodes and 10,506 relationships.
The current complete snapshot fingerprint is
`7584e88fb566b5a03334ff7c19114cd7bdb2277cd45874085795a4d33b2d5aeb`.

### Source-to-Projection Fingerprint Chain

1. `scripts/bootstrap-neo4j.mjs:130-131` loads current `provenance/release.json`.
2. `graph/runtime/neo4j-bootstrap.mjs:402-430` intentionally binds that current
   release as an `AuditRelease` node, including `sha256(release)` as its
   `sourceFingerprint`, five document links, and four invariant links.
3. `scripts/bootstrap-neo4j.mjs:70-97` builds verification inputs using the
   current release identity, current source hashes and projection fingerprints,
   but the seven namespace fingerprints from the retained 1.8.1 baseline.
4. The normalized snapshot correctly contains the current development release
   node. Its provenance fingerprint therefore cannot equal the historical pin.
   The top-level release-ID and source-binding checks pass because those checks
   compare to current inputs, not the baseline's release ID/source bindings.

Only one of the seven source bindings differs from the retained baseline:
`provenance/release.json`. Raw file SHA-256 values:

```text
retained: bd854a8c1ff61c55016ec024e927a899ba83f232f967ef7f4f00495d2b579e17
current:  0ff74fc356a6eda0c694863ae185441dd94c986198062daa77d0b90aff4212fc
```

The projected source fingerprint is a canonical-JSON hash, not that raw-file
hash. Historical/current canonical hashes are respectively:

```text
1.8.1:     a87c6558bb43f0aeb971a879a0ee02a2e150f5496ca2fcdb47539fab779dfd2b
1.9.0-dev: 08b8d32967901cdabd34ae438934b0a8feb65eb4b2f56f70e46163ed7022e941
```

Read-only history inspection identified `21e0eec` as the sealed 1.8.1 commit
and `4a3989f` as the development opening. `git diff 21e0eec --
provenance/release.json` shows the changed release ID, version, status, and
baseline-status declaration; date and canonical counts are unchanged.

An in-memory causal check replaced ONLY the current release node's logical ID,
`releaseId`, `version`, `status`, and `sourceFingerprint` with the values derived
from `git show 21e0eec:provenance/release.json`, and rebound its nine outgoing
relationship source IDs. Re-sorting and hashing that namespace produced the
retained provenance fingerprint **exactly**. No other node, relationship
property, count, source file, or database was changed in this check. This
accounts for the entire namespace mismatch, not just a plausible contributing
factor. It is not a fresh full historical database reproduction.

## Runtime Disposition

No runtime import/export correction is justified by this failure. Relabeling
the live development release as 1.8.1, omitting provenance from verification,
or accepting observed fingerprints as baseline authority would conceal the
real identity change.

The native assertion now includes current release ID and differing namespace
expected/actual fingerprints. Its acceptance condition is unchanged and still
fails. Added `tests/neo4j/investigate-roundtrip.mjs` provides a repeatable,
local-only diagnostic, not an automatically discovered passing gate test.
It runs configured bootstrap, independent configured readback, and a second
bootstrap against its own disposable harness. It reports child exit statuses,
all namespace comparisons, source hashes, and provenance records.

The diagnostic also invokes the verifier with observed namespace fingerprints
in memory to isolate the remaining checks. That returns true, proving the
remaining verifier conditions pass; it does NOT independently establish
baseline authority. Production verification continues using the retained pins.

## Executed Commands

All commands ran from the repository root. No `.env` was sourced. Python used
the existing project virtual environment; no dependencies were changed.

```sh
env -u NEO4J_FULL_CAPTURE_BASELINE -u NEO4J_FULL_SNAPSHOT_SUMMARY_OUTPUT PATH="$PWD/.venv/bin:$PATH" npm run test:neo4j:full:raw
env PATH="$PWD/.venv/bin:$PATH" node tests/neo4j/investigate-roundtrip.mjs > /tmp/opencode/post-d5-neo4j-investigation.json
git log --oneline -8 -- provenance/release.json
git diff 21e0eec -- provenance/release.json
git diff --check
```

- Native raw suite: **ran twice**, before/after diagnostic assertion change;
  both runs **1 passed / 1 failed / 0 skipped**. Trusted-ingestion rejection
  passed. Bootstrap readiness/counts and normalized schema passed before the
  baseline assertion failed. The final failure prints precisely the provenance
  fingerprints above. The native import-twice/reset-isolation assertions remain
  unreached; no pass is claimed for them.
- Local configured diagnostic: **ran**, exited 0 (diagnostic completion only).
  Child `scripts/bootstrap-neo4j.mjs --roundtrip-output <temporary-path>` exited
  0, `scripts/verify-neo4j-roundtrip.mjs --output <temporary-path>` exited 1 with
  verdict FAIL, and the second bootstrap exited 0. All use explicit harness
  URI, empty local credentials, database `neo4j`, and temporary import storage.
- Bootstrap export versus independent configured read: **ran**, canonical bytes
  equal, despite baseline rejection. Second import versus first import: **ran**,
  canonical bytes equal. This corrects the ambiguity in the earlier configured
  wrapper's `normalized_snapshot_mismatch` diagnostic: its byte-identity gate
  requires roundtrip PASS before comparing, so that failure was not evidence
  of observed byte instability.
- Non-baseline verifier isolation: **ran**, true with observed hashes substituted
  only in memory. Retained-baseline verification remained false.
- Historical in-memory causal reconstruction: **ran**, exact retained namespace
  hash reproduced, one node and nine source endpoints changed in the copy.
- Cleanup: **ran** for every harness. The diagnostic additionally retains the
  original temp-directory path and directly asserts its removal after stop;
  loopback-port residual assertions passed. Temporary snapshot files were
  removed. The JSON diagnostic log above remains outside the repository.
- `git diff --check`: **ran**, passed.
- `test:neo4j:full` QA-writing wrapper and
  `scripts/validate-neo4j-deployment-roundtrip.mjs`: **skipped in this follow-up**
  to avoid overwriting retained/shared QA receipts. Their underlying native
  suite and configured child commands actually ran as described above. The
  prior wrapper failure is recorded in `post-d5-product-gate-status.md`.
- External configured target: **skipped**, intentionally prohibited. All DB
  writes were confined to newly created local harness instances.
- Baseline capture, candidate emission, full release validation, manifest and
  checksum generation: **skipped**, outside the bounded diagnostic task and
  not needed to identify this mismatch.

## Required Decision

`provenance/DECISION_LEDGER.md:5-27` retains 1.8.1 and requires fresh native and
separately configured evidence before current-release closure after provenance
changes. `provenance/SOURCE_AUTHORITY.md:55-60` explicitly distinguishes retained
baseline, native receipt, configured receipt, and ingestion safety authority.
The product-gate follow-up calls for an authorized current-release baseline
decision, not recapture merely to suppress failures. No such new decision was
made here and no candidate baseline was emitted.

The actionable blocker is therefore **authorize and wire a separate
current-release Neo4j baseline/evidence lifecycle**, retaining the closed 1.8.1
files/authority. Under that decision, generate/review a separate candidate from
current sources, select the authorized baseline explicitly for current-release
verification, rerun native reproducibility including tamper/reset isolation and
the separately configured gate, and only then perform authorized packaging and
fixed-point release validation. Do not treat this diagnostic log or its observed
hash override as that decision or evidence substitute.

## Change Scope

Own changes, identified by focused diff/status:

- `tests/neo4j/full-database-live.test.mjs`: failure diagnostic only.
- `tests/neo4j/investigate-roundtrip.mjs`: local-only diagnostic runner.
- `scrum/plan/post-d5-neo4j-investigation.md`: this report.

No graph/runtime behavior, frozen baseline, ingestion baseline, manifest,
checksum, ledger, release declaration, frozen package, or QA receipt was edited
by this investigation. Existing and concurrent modifications elsewhere were
left untouched. This working tree is not a release fixed point.
