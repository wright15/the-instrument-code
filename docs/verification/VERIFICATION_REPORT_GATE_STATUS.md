# Verification Report Gate Status

Every verification report — a `qa/*-validation.json` completion receipt — must
state what was actually executed, not only what passed. This is a standing
cycle rule, not a preference.

Each report carries a top-level `suiteStatus` array. Every verification suite
named in the ticket's `Verification` section appears exactly once:

- `status: "ran"` when the suite executed to a deterministic pass/fail verdict.
- `status: "skipped"` when the suite could not execute, with a non-empty
  `reason` (environment gap, missing dependency, time-bound, blocked input).
- A suite that was not run must be recorded as `skipped` with its reason, never
  omitted.

Validator-owned suites are populated by the validator itself. Suites executed
by sibling commands (pytest, vitest, browser) are annotated by the story closer
in the completion record; a `skipped` entry is mandatory when the closer cannot
run one. Arithmetic output wins: the recorded status describes the run, never
assumes it from a green check count.

Reference implementation: `orrery/scripts/validate-orrery-evidence-bundle.mjs`
emits `suiteStatus` for its eleven validator-owned suites; the ORR-511 closer
records the sibling `orrery:test` (vitest) and `orrery:browser:test` suites in
the completion record with ran/skipped plus reason.

## Why this rule exists

Sprint 2 closed with the browser suite un-runnable in the build environment
(`starlette` missing from the host interpreter; the Orrery Vite dev server
would not start from the repo root). The original completion record was silent
on that gap — every suite it named appeared green, while one had never run. A
receipt that lists only what passed cannot distinguish "verified" from
"untested", so a future gate could consume un-executed evidence as executed.

## Location note

This convention is recorded in `docs/verification/` (regenerated in the
manifest, not hash-pinned by a frozen package). It is deliberately not written
into `framework/AGENTS.md`: that file is a framework source pinned by
`provenance/release.json:frameworkSources` and by frozen package dependency
manifests, and editing it would cascade forbidden frozen-byte changes.
