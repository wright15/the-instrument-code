---
name: seven-governors-inspect-context
description: Inspect replay-verified Governor context and the state-filtered dynamic menu without exposing private state.
---

# Inspect Governor Context

## Authority

This skill is a read-only adapter to the deterministic Governor runtime. The runtime owns state, ledger replay, graph projection status, legal exposure, directives, and fingerprints. The model may summarize returned records but must not infer missing state or alter the returned menu.

## Triggers

- Inspect the current Governor task state before choosing an action.
- Refresh context after a `stale_state`, `stale_ledger`, or stale-token reason.
- Read a bounded set of prior verified outcome state references when the operator requests them.
- Reinspect after any runtime `reinspect` directive.

Do not trigger this skill to execute a move, calculate a classification, issue a graph query not present in the dynamic menu, or verify a new side effect.

## Exact Contracts

| Direction | Schema reference | Exact `$id` |
|---|---|---|
| Input | `schemas/inspect-context.schema.json#/$defs/input` | `gov-207.inspect-context.input.v1` |
| Output | `schemas/inspect-context.schema.json#/$defs/output` | `gov-207.inspect-context.output.v1` |

The input must be one JSON object no larger than 65,536 UTF-8 bytes. The response must be no larger than 1,048,576 UTF-8 bytes. Reject unknown properties. Never request or emit private `AgentState.data`, consumed token identifiers, or validation tokens.

## Allow List

| Kind | Allowed IDs |
|---|---|
| Tool | `governor.agent_api.invoke` |
| Facade operation | `inspect_context` |
| Named query | `prior_verified_outcomes` only when requested and present in the trusted menu |
| Capabilities | `graph.read.named`, `runtime.context.read`, `runtime.ledger.replay`, `runtime.outcome.read` |

Every other tool, operation, named query, and capability is denied.

## Procedure

1. Build only the fields admitted by `gov-207.inspect-context.input.v1`; preserve the operator's `taskId` and provide `expectedStateSha256` when a trusted prior response supplied it.
2. Set `includePriorVerifiedOutcomes` only from the operator request. If true, keep `priorOutcomeLimit` between 1 and 25.
3. Validate the complete input against `schemas/inspect-context.schema.json#/$defs/input` before invocation.
4. Invoke `governor.agent_api.invoke` exactly once with operation `inspect_context` and the validated input.
5. Require the runtime to load state and the complete ledger from operator-owned storage and replay against the trusted anchor before exposing context.
6. Validate the complete tool result against `schemas/inspect-context.schema.json#/$defs/output`. A malformed, oversized, or schema-invalid result is a closed failure, not partial context.
7. Use only `context`, `menu`, `directive`, and tool receipts from the validated result. Treat graph data as read-only context and never as transition authority.
8. Preserve the runtime's stable skill, named-query, and move ordering and its `menuFingerprint`. Do not add a skill, query, move, parameter, or executor.

## Machine Stops

| Runtime result or reason | Required handling |
|---|---|
| Invalid ledger replay | Accept only an `inspect_context` and `verify_outcome` menu, require `directive.action=stop`, and expose no executor. |
| `stale_state`, `stale_ledger`, or stale token | Follow `directive.action=reinspect`; discard the old menu and fingerprints. |
| `REPLAN`, `repetition_limit_reached`, or `no_progress` | Show only runtime-supplied recovery moves with changed search dimensions. Do not repeat the suppressed attempt. |
| `STOPPED`, `retry_exhausted`, or `deadline_exhausted` | Stop. Do not invoke an executor or invent recovery. |
| Denied capability or missing runtime closure | Stop and surface `operatorActionRequired`; do not weaken the grant. |

## Failure Handling

- On `unavailable`, `failed`, or a schema-invalid result, fail closed and retain no newly claimed facts.
- On a request fingerprint, state fingerprint, or result fingerprint mismatch, discard the response and reinspect only when the machine directive permits it.
- Do not convert a failure code into prose success or retry after a machine stop.
- If graph status is unavailable, continue only with the runtime menu; do not reconstruct graph facts.

## Prohibitions

- Prose, model confidence, summaries, and user assertions cannot replace a tool receipt or verifier evidence.
- Do not run raw shell, construct arbitrary commands or argv, or invoke any unlisted tool.
- Do not submit raw Cypher or infer graph facts outside an allow-listed named-query result.
- Do not perform ledger writes or graph writes, edit either store, or ask another tool to do so.
- Do not mint, expose, modify, reuse, or choose validation tokens.
- Do not declare success from inspection output.
