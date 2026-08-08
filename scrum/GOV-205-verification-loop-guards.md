# GOV-205 — Evidence verification and no-progress loop guards

**Status:** Done · **Priority:** High · **Points:** 8 · **Epic:** [EPIC-002](EPIC-002-governor-domain-agent-runtime.md)
**Depends on:** GOV-204 · **Blocks:** GOV-207, GOV-209

## Story

As a local-agent user, I want external actions to advance only after objective
postconditions pass and repeated failed approaches to stop or replan, so the
agent cannot report intent as success or loop indefinitely.

## Context

The observed failure mode is concrete: issuing an Astro launch command was
reported as “live” although nothing answered on port 4321. Skills cannot fix
that by prose alone. The runtime needs registered executors, registered
verifiers, evidence records, retry budgets, and progress semantics.

## Tasks

- [x] Implement the lifecycle `INSPECTED -> PROPOSED -> VALIDATED -> EXECUTED
      -> EVIDENCE_RECORDED -> VERIFIED`, with explicit `FAILED`, `REPLAN`, and
      `STOPPED` outcomes.
- [x] Add capability-scoped executor and verifier registries; disable arbitrary
      command execution by default.
- [x] Implement deterministic evidence adapters for exit status, process
      identity, file/content SHA-256, JSON Pointer assertion, bounded regex,
      and local HTTP status/body checks.
- [x] Define objective postconditions and victory conditions in each move
      contract; model-generated prose is never accepted as evidence.
- [x] Detect repeated `(state hash, action, normalized parameters)` tuples,
      unchanged objective metrics, bounded retries, and deadline exhaustion.
- [x] Emit structured diagnostics and legal recovery moves after failure;
      preserve every attempt and verifier result in the ledger.
- [x] Add an end-to-end `start_site` fixture that launches, waits, probes,
      records evidence, and cleans up a local server.

## Acceptance criteria

- **AC-1**: “site is live” cannot reach `VERIFIED` unless a registered local
  HTTP verifier receives the expected response from the bound host/port.
- **AC-2**: a process that exits early, binds another port, returns the wrong
  status/body, or times out records failure and cannot advance state.
- **AC-3**: repeating the same state/action/parameters beyond policy limits
  produces `REPLAN` or `STOPPED`; an alternative legal move must differ in a
  declared search dimension.
- **AC-4**: verifier evidence includes type, normalized request, observation,
  expected postcondition, verdict, source, and hash; replay preserves verdicts
  without rerunning historical side effects.
- **AC-5**: every executor has an allow-listed capability and cleanup rule;
  raw shell and raw Cypher are unavailable to agent skills.
- **AC-6**: injected failures, retries, cleanup, and stop reasons are covered
  without orphan processes or writes inside the release package.

## Verification

Run the successful site fixture plus early-exit, wrong-port, wrong-body,
timeout, stale-process, repeated-action, unchanged-metric, retry-exhaustion,
cleanup-failure, and replay-without-reexecution cases. Confirm no process or
temporary runtime state remains after the suite.

## Definition of done

Lifecycle, executor/verifier registries, evidence schema, loop guards, and
fixtures are implemented; false-success and repetition cases fail closed;
cleanup is proven; all attempts are replayable; no orphan process/live state
remains; package/root validation, security checks, docs, and QA report pass.

Implementation evidence recorded 2026-08-01 (in-repo Python delivery, shared
with GOV-204 under `src/governor/`):

- Lifecycle `INSPECTED -> PROPOSED -> VALIDATED -> EXECUTED ->
  EVIDENCE_RECORDED -> VERIFIED` with explicit `FAILED`, `REPLAN`, `STOPPED`;
  `VERIFIED` is reachable only from `EVIDENCE_RECORDED` and only when victory
  evidence passes and cleanup succeeds (`src/governor/lifecycle.py`,
  `src/governor/verification.py`).
- Capability-scoped executor and verifier registries with no fallback and no
  raw shell/Cypher path; six bounded verifiers (exit status, process, file
  SHA-256, JSON Pointer, bounded regex, loopback-only HTTP) in
  `src/governor/executors.py`, `src/governor/verifiers.py`.
- One-use validation tokens consumed on application; stale/reused tokens and
  concurrent prior-state conflicts fail closed with no ledger delta
  (`src/governor/transitions.py`, `src/governor/runtime_models.py`).
- Repetition, retry-exhaustion, no-progress, deadline, and recovery-dimension
  guards terminate deterministically (`src/governor/loop_guards.py`).
- External atomic state storage under `XDG_STATE_HOME`/explicit path with
  compare-and-swap and repository-escape rejection (`src/governor/state_store.py`).
- `start_site` end-to-end fixture launches a fixed first-party server, waits,
  probes loopback HTTP + process, records evidence, and cleans up
  (`tests/fixtures/gov_205/site_server.py`, `tests/test_gov_205_start_site.py`).
- Test suite: **86/86 PASS** at `PYTHONHASHSEED=1 TZ=UTC` (1.92s) and
  `PYTHONHASHSEED=987 TZ=Pacific/Honolulu` (1.80s), zero residual processes,
  zero runtime-state files, zero frozen-package modifications.

**Done 2026-08-01.**
