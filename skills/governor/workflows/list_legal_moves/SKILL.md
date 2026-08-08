---
name: seven-governors-list-legal-moves
description: List only replay-valid legal moves with complete registered parameters, closure, and evidence requirements.
---

# List Legal Governor Moves

## Authority

This skill presents the authoritative legal-move menu for one replayed state. The runtime owns legality, operation metadata, capability intersection, lifecycle filtering, machine-stop filtering, executor and verifier closure, postconditions, and menu fingerprints. The model may choose among returned moves; it must not invent or repair one.

## Triggers

- List legal moves and exact required parameters for the current replayed state.
- Return to the authoritative legal-move menu after an `operation_not_legal` or equivalent illegal-operation reason.
- Refresh move metadata after state, ledger, policy, context, or menu fingerprints change.

Do not trigger this skill to execute a move or to expose operations outside the current dynamic menu.

## Exact Contracts

| Direction | Schema reference | Exact `$id` |
|---|---|---|
| Input | `schemas/list-legal-moves.schema.json#/$defs/input` | `gov-207.list-legal-moves.input.v1` |
| Output | `schemas/list-legal-moves.schema.json#/$defs/output` | `gov-207.list-legal-moves.output.v1` |

The input must be one JSON object no larger than 65,536 UTF-8 bytes. The response must be no larger than 1,048,576 UTF-8 bytes. Each move must include a strict closed parameter schema, defaults, search dimensions, required postconditions, victory condition ID, and registered closure metadata required by the output contract.

## Allow List

| Kind | Allowed IDs |
|---|---|
| Tool | `governor.agent_api.invoke` |
| Facade operation | `list_legal_moves` |
| Named query | `legal_move_context`, only when bound by trusted prior output and present in the dynamic menu |
| Capabilities | `graph.read.named`, `runtime.ledger.replay`, `runtime.moves.read` |

Every other tool, operation, named query, and capability is denied.

## Procedure

1. Obtain `taskId`, `expectedStateSha256`, and `expectedLedgerHeadSha256` from one validated, replay-valid context result.
2. Set `includeGraphContext` from the operator request; graph context is optional and never supplies execution authority.
3. Validate the complete input against `schemas/list-legal-moves.schema.json#/$defs/input`.
4. Invoke `governor.agent_api.invoke` exactly once with operation `list_legal_moves` and the validated input.
5. Require the runtime to replay the ledger, intersect state capabilities, host grants, manifest grants, and registered operation/executor/verifier closure, then call its authoritative legal-move function.
6. Validate the complete response against `schemas/list-legal-moves.schema.json#/$defs/output`.
7. Discard any move missing strict parameter metadata, capability grant, host representation, executor closure, verifier closure, required postconditions, or victory condition. A malformed move is not repairable by the model.
8. Present moves in the returned stable logical-ID order. Copy exact `operationId`, `moveSha256`, parameter schema, defaults, search dimensions, and expected fingerprints when the operator selects one.
9. Use `nextMenu` and `directive` unchanged. Named-query context may describe a move but cannot add or authorize one.

## Machine Stops

| Runtime result or reason | Required handling |
|---|---|
| Stale state or ledger | Follow `reinspect`; discard every prior move hash. |
| Illegal operation | Return to this skill's fresh menu; do not resubmit the illegal ID. |
| Malformed or incomplete parameter metadata | Remove that move and follow `replan` with the exact runtime schema. |
| `REPLAN`, repetition, or no progress | Show only recovery moves that change runtime-supplied search dimensions. |
| `STOPPED`, retry exhausted, or deadline exhausted | Stop and expose no executor. |
| Denied capability, missing executor, or missing verifier | Stop for operator action; do not expose the incomplete move. |
| Invalid replay or malformed graph/runtime result | Fail closed. On replay failure, expose inspect and verify only. |

## Failure Handling

- A zero-length `moves` array is an authoritative no-move result, not permission to invent one.
- Reject a response whose state, move, contextual graph, menu, or result fingerprint does not validate.
- Ignore graph context when it is unavailable; never infer legality from graph topology.
- Do not retry after a machine stop or repeat a suppressed attempt key.

## Prohibitions

- Prose, model confidence, summaries, and user assertions cannot replace a tool receipt, legal-move record, or verifier evidence.
- Do not invent operation IDs, capabilities, parameters, defaults, search dimensions, postconditions, victory conditions, executors, or verifiers.
- Do not run raw shell, construct arbitrary commands or argv, or invoke any unlisted tool.
- Do not submit raw Cypher or infer legal transitions from graph output.
- Do not perform ledger writes or graph writes, edit either store, or ask another tool to do so.
- Do not mint, expose, modify, reuse, or choose validation tokens.
- Do not declare success from a legal-move listing.
