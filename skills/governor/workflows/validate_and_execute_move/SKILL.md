---
name: seven-governors-validate-and-execute-move
description: Submit one menu-selected move to atomic runtime validation, execution, evidence verification, and cleanup.
---

# Validate And Execute Governor Move

## Authority

This skill submits one exact dynamic-menu move to the deterministic runtime facade. The runtime alone checks legality and fingerprints, normalizes parameters, creates and consumes validation authority, applies loop guards, selects the registered executor and verifiers, records evidence and ledger events, performs cleanup, advances lifecycle state, and decides whether success is claimable.

## Triggers

- Execute one exact move selected from the current authoritative menu.
- Validate bounded parameters and consume the runtime's atomic execution result.
- Apply a machine-provided recovery move only after a fresh menu proves changed search dimensions.

Do not trigger this skill without a current `operationId`, `moveSha256`, closed parameter schema, and all five expected revision/fingerprint fields from the same replay-valid menu.

## Exact Contracts

| Direction | Schema reference | Exact `$id` |
|---|---|---|
| Input | `schemas/validate-execute.schema.json#/$defs/input` | `gov-207.validate-execute.input.v1` |
| Output | `schemas/validate-execute.schema.json#/$defs/output` | `gov-207.validate-execute.output.v1` |

The input must be one JSON object no larger than 65,536 UTF-8 bytes. The response must be no larger than 1,048,576 UTF-8 bytes. The input schema deliberately admits no capability, token, executor, verifier, command, argv, path, provider, or deadline field.

## Allow List

| Kind | Allowed IDs |
|---|---|
| Tool | `governor.agent_api.invoke` |
| Facade operation | `validate_and_execute_move` |
| Named queries | None |
| Base capabilities | `runtime.ledger.replay`, `runtime.move.execute`, `runtime.move.validate`, `runtime.outcome.verify` |
| Dynamic capability binding | `selected_move_capability`, only when the trusted menu, state grant, host grant, operation registry, executor registry, and verifier registry all match |

Every other tool, operation, named query, and capability is denied. The dynamic binding is not a wildcard and cannot be supplied by the model.

## Procedure

1. Select exactly one move from the most recent validated `list_legal_moves` output. Copy only its `operationId` and `moveSha256` into `selectedMove`.
2. Build `parameters` only from that move's strict `parameterSchema`; apply only runtime-published defaults. Never add facade authority fields.
3. Copy `revision`, state, ledger, policy, and context fingerprints from the same move menu into `expected`.
4. Validate the complete input against `schemas/validate-execute.schema.json#/$defs/input`. If parameters fail, return to the exact published schema rather than coercing values.
5. Invoke `governor.agent_api.invoke` exactly once with operation `validate_and_execute_move` and the validated input.
6. Let the facade replay state and ledger, recheck menu and capability closure, validate the move, and call the existing atomic `execute_validated_move()` path. Never split validation from execution in model-controlled calls.
7. Validate the complete response against `schemas/validate-execute.schema.json#/$defs/output`. Reject malformed receipts, state refs, evidence decisions, cleanup, ledger deltas, directives, or fingerprints.
8. Follow the runtime `status` and `directive` exactly. Treat `claimableSuccess=true` as meaningful only when status is `verified`, replay is valid, phase is `VERIFIED`, every required evidence record passed, cleanup succeeded, and the ledger delta persisted.
9. If execution reached an evidence-bearing phase, use `verify_outcome` for later inspection. Never rerun the side effect to verify it.

## Machine Stops

| Runtime result or reason | Required handling |
|---|---|
| Stale state, ledger, policy, context, move, or validation authority | Accept `rejected`, follow `reinspect`, and do not execute. |
| Illegal operation | Return to a fresh legal-move menu. Do not alter the operation ID. |
| Malformed parameters | Follow `replan` using the exact returned parameter schema; do not coerce or add fields. |
| `repetition_limit_reached` or `no_progress` | Accept `replan`; do not run the executor and choose only a recovery that changes listed dimensions. |
| `retry_exhausted` or `deadline_exhausted` | Accept `stopped`; stop with no executor exposure. |
| Denied capability, missing executor, or missing verifier | Stop for operator action. Do not substitute a tool or weaken closure. |
| Failed evidence or cleanup | Accept `failed`, require `claimableSuccess=false`, and prohibit a success claim. |
| Malformed runtime result or invalid replay | Fail closed; do not treat any observed side effect as verified. |

## Failure Handling

- `rejected`, `failed`, `replan`, and `stopped` are not success, even if a process started or prose says the goal appears complete.
- A missing or failed required evidence record, failed cleanup, unpersisted ledger delta, non-`VERIFIED` phase, or invalid fingerprint forces `claimableSuccess=false`.
- Never retry the same attempt after a repetition or no-progress result. Consume only machine-supplied changed-dimension recovery choices.
- On any schema-invalid response, retain no success claim and request operator action or reinspect as the last valid directive permits.

## Prohibitions

- Prose, model confidence, summaries, visible side effects, and user assertions cannot replace a tool receipt or verifier evidence.
- Do not provide or choose a capability, token, executor, verifier, command, argv, path, provider, or deadline.
- Do not run raw shell, construct arbitrary commands or argv, or invoke any unlisted tool.
- Do not submit raw Cypher or use graph output as execution authority.
- Do not perform ledger writes or graph writes, edit either store, or ask another tool to do so; only the deterministic runtime may append its own ledger events.
- Do not mint, expose, modify, reuse, or choose validation tokens.
- Do not rerun a side effect for verification and do not declare success unless the validated output explicitly permits it.
