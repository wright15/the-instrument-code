# GOV-207 — First-party local-agent skill bundle

**Status:** Done · **Priority:** High · **Points:** 5 · **Epic:** [EPIC-002](EPIC-002-governor-domain-agent-runtime.md)

> **Closure evidence (2026-08-07):** the five first-party operations
> (`inspect_context`, `classify_governor`, `list_legal_moves`,
> `validate_and_execute_move`, `verify_outcome`) are implemented in
> `src/governor/agent_api.py` and the `skills/` bundle. Evaluation traces live
> in `tests/gov_207/traces/` and are verified by `tests/test_gov_207_agent_api.py`
> (22 tests), `test_gov_207_dynamic_menu.py` (15), and `test_gov_207_outcomes.py`
> (5).
**Depends on:** GOV-205, GOV-206 · **Blocks:** GOV-208, GOV-209

## Story

As a local-model operator, I want a small first-party skill bundle that invokes
the deterministic runtime and presents only relevant legal capabilities, so a
Hermes-style agent can act coherently without memorizing the full framework or
being trusted to calculate, query, mutate, or verify by itself.

## Context

Skills are procedural guidance and typed adapters, not authority. The useful
primitive loop is inspect context, list legal moves, validate one move, execute
the validated move, and verify its outcome. The model may select and explain;
the runtime owns facts and transitions.

## Tasks

- [ ] Add first-party skills for `inspect_context`, `classify_governor`,
      `list_legal_moves`, `validate_and_execute_move`, and `verify_outcome`.
- [ ] Give each skill a trigger, bounded inputs, JSON output schema, allowed
      tools/capabilities, procedure, stop conditions, and failure handling.
- [ ] Load only the skill and named query/move menu relevant to the current
      state instead of exposing a flat unrestricted tool list.
- [ ] Require runtime CLI/API results for math, graph facts, validation,
      execution, and verification; prose cannot substitute for a tool result.
- [ ] Add explicit loop/replan instructions that consume machine stop reasons
      rather than relying on the model to notice repetition.
- [ ] Provide a framework-neutral skill registry plus an explicit-target
      installer/adapter suitable for Hermes and other local agent hosts.
- [ ] Add evaluation traces for classification, graph retrieval, a legal
      mutation, site launch verification, an invalid move, and a loop stop.

## Acceptance criteria

- **AC-1**: every skill consumes and emits schema-valid records and invokes
  only allow-listed runtime operations; no skill edits the ledger, writes the
  graph, runs raw shell/Cypher, or declares success without verifier evidence.
- **AC-2**: the local model is shown legal moves and required parameters for
  the current state; invalid selections receive structured machine reasons and
  recovery choices.
- **AC-3**: installing into an explicit temporary target produces a hash
  manifest and byte-identical files on repeated runs; no user configuration or
  existing skill is changed without explicit target/overwrite authorization.
- **AC-4**: skill behavior is portable across at least one Hermes-compatible
  host and one generic JSON tool-calling harness without changing authority or
  result semantics.
- **AC-5**: evaluation traces prove the model cannot turn an unverified server
  launch, invalid transition, graph write, or repeated action into success.

## Verification

Validate every skill document and capability manifest, install twice into
isolated targets, compare hashes, run the six evaluation traces with a mocked
model and at least one representative local model, and inject malformed tool
outputs, denied capabilities, stale tokens, and repeated actions.

## Definition of done

The skill registry, five bounded workflows, host adapters, explicit-target
installer, capability manifests, evaluation corpus, and safety tests are
complete; installation is deterministic/non-destructive; all claimed outcomes
are evidence-backed; package/root validation, docs, manifest, and QA pass.
