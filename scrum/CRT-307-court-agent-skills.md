# CRT-307 — Court-aware first-party agent skills

**Status:** Done · **Priority:** High · **Points:** 5 · **Epic:** [EPIC-003](EPIC-003-pentatonic-court-admission.md)

> **Closure evidence (2026-08-10):** parallel API
> `src/governor/court_agent_api.py`, standalone bundle under `skills/court/`,
> explicit-target installer/validator, eight deterministic traces, 44 Python
> facade tests, 17 Node schema/adapter/installer tests, unchanged GOV-207
> regressions (42 passed), and an 8/8 observational trace pass on local
> `koboldcpp/Qwen3.6-35B-A3B-UD-IQ2_XXS`. Model output is non-canonical QA;
> replay, schemas, and verifier evidence remain authoritative.
**Depends on:** CRT-305, CRT-306, GOV-207 · **Blocks:** CRT-308, CRT-309

## Story

As a local-model operator, I want a Court-aware extension to the
first-party agent skill bundle that invokes the deterministic Court runtime
and presents only relevant legal Court capabilities, so a Hermes-style
agent can act coherently across Court modulation without memorizing the
full framework or being trusted to calculate Court algebra, invent a Court,
or claim internalization success by prose.

## Context

GOV-207 ships the first-party agent skill bundle with `inspect_context`,
`classify_governor`, `list_legal_moves`, `validate_and_execute_move`, and
`verify_outcome`. The Court runtime (CRT-305), Court graph projection
(CRT-306), Court invariant library (CRT-303), and Court filter algebra
(CRT-304) extend the deterministic substrate but do not give the agent
Court-specific skills. The useful primitive Court loop is: inspect current
Court state, list legal Court moves, validate one Court move, execute the
validated Court move, apply an optional $P_c$ projection to inspect
information exposure, and verify the Court postcondition. The model may
select and explain; the runtime owns Court facts and transitions, exactly
as GOV-205/207 gate the GOV-204 transition lifecycle.

## Tasks

- [x] Add Court-aware first-party skills:
      `inspect_court_state`, `list_legal_court_moves`,
      `validate_and_execute_court_transition`,
      `project_through_court` (apply $P_c$ read-only), and
      `verify_court_postcondition`.
- [x] Give each skill a trigger, bounded inputs, JSON output schema,
      allowed tools/capabilities, procedure, stop conditions, and failure
      handling; each skill declares its CRT-305 token scope and
      CRT-306 named-query budget.
- [x] Load only the Court skill and named Court query relevant to the
      current Court state instead of exposing a flat unrestricted Court
      tool list; skill menus adapt to the current $\kappa_{\text{court}}$
      position.
- [x] Require runtime CLI/API results for Court math, Court graph facts,
      Court validation, Court execution, and Court verification; prose
      cannot substitute for a Court tool result, and the model cannot
      invent a Court position or pole register.
- [x] Add explicit Court loop/replan instructions that consume machine
      stop reasons (e.g. `non_adjacent_without_translocation`,
      `kappa_cross_namespace_write`, `off_chain`) rather than relying on
      the model to notice repetition.
- [x] Publish a parallel framework-neutral registry and explicit-target
      installer to publish Court skills into an explicit target directory
      without overwriting existing GOV-207 skills.
- [x] Add evaluation traces for Court classification, Court graph
      retrieval, a legal adjacent Court transition, an off-chain
      rejection, a Topological Translocation acceptance, an invalid Court
      move, and a no-progress Court loop stop.

## Implementation ruling

CRT-307 is a parallel `seven-governors-crt-307` bundle rather than a version
change to GOV-207's closed five-skill contract. It uses API
`crt-307.court-agent-api.v1` and tool
`governor.court_agent_api.invoke`; installing it never overwrites GOV-207
registry, capability, workflow, schema, or adapter bytes.

Every operation explicitly replays the external CRT-305 session. Transition
execution requires the published base capability intersection, an exact current
menu match, the state-owned `court.transition` or `court.translocate` grant, a
trusted typed verifier, postcondition replay, and CAS persistence. The model
cannot submit a token, capability, evidence decision, filter, route, or
translocation record. Historical event verification never reruns an effect.

`project_through_court` resolves `court-filter:{currentPosition}` from the
fingerprinted CRT-304 registry and accepts the full ambient 12-bit domain. It
returns `P_c(x)`, exact reduction, and five-valued route semantics while proving
state and ledger bytes unchanged. CRT-306 queries are optional, normalized, and
bounded; timeout, malformed, oversized, or unavailable graph output cannot
change runtime legality.

The no-progress guard deterministically returns `repetition_limit_reached`
then `retry_exhausted` without another verifier call. Its bounded history is
facade-local and resets on process restart; it is safety metadata, never CRT-305
state or ledger authority. Pathname installation rejects static and detected
symlink races and rolls back owned bytes, while adversarial OS-level TOCTOU
cannot be eliminated by a user-space Node installer.

Final closure: 305 root Python tests passed; Phase-4 passed 45 verification
tests plus native live Neo4j parity; root validation passed 236/236 checks; the
canonical manifest contains 645 files and excludes live Court sessions and the
non-canonical local-model observation report.

## Acceptance criteria

- **AC-1**: every Court skill consumes and emits schema-valid records and
  invokes only allow-listed CRT-306/CRT-305/CRT-303/CRT-304 runtime
  operations; no skill edits the Court ledger, writes the Court graph,
  runs raw shell/Cypher, or declares Court-success without verifier
  evidence.
- **AC-2**: the local model is shown legal Court moves and required
  parameters for the current $\kappa_{\text{court}}$ position; invalid
  Court selections receive structured machine reasons such as
  `non_adjacent_without_translocation` and recovery choices.
- **AC-3**: `project_through_court` is read-only; it returns the
  $P_c$-filtered 12-bit vector and a route-semantics record but never
  mutates `ScaleState.office`, `OCCUPIES_OFFICE`, Degree-Governor metadata,
  or the Court state itself.
- **AC-4**: installing Court skills into an explicit temporary target
  produces a hash manifest and byte-identical files on repeated runs; no
  GOV-207 skill, user configuration, or existing skill is changed without
  explicit target/overwrite authorization.
- **AC-5**: skill behavior is portable across at least one Hermes-
  compatible host and one generic JSON tool-calling harness without
  changing authority or result semantics.
- **AC-6**: evaluation traces prove the model cannot turn an off-chain
  mask, non-adjacent Court jump without a Topological Translocation
  record, repeated Court action, or unverified internalization into
  success.
- **AC-7**: skills cannot equate $\kappa_{\text{court}}$ with $C_P$,
  $C_H$, $C_S$, temperature, or entropy; the runtime refuses cross-namespace
  writes and the skill surfaces the refusal.

## Verification

Validate every Court skill document and capability manifest; install Court
skills twice into isolated targets and compare hashes; run the Court
evaluation traces with a mocked model and at least one representative
local model; inject malformed Court tool outputs, denied capabilities,
stale Court tokens, off-chain mask inputs, and repeated Court actions.
Confirm the GOV-207 skill bundle and its evaluation corpus continue to
pass unchanged.

## Definition of done

The Court skill registry, five bounded Court workflows, host adapters,
explicit-target installer, capability manifests, evaluation corpus, and
safety tests are complete; installation is deterministic and non-
destructive to GOV-207; all Court claimed outcomes are evidence-backed;
package/root validation, docs, manifest, and QA pass.
