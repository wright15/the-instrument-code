---
name: seven-governors-verify-outcome
description: Read one recorded attempt, replay its ledger history, and report whether evidence permits a success claim.
---

# Verify Governor Outcome

## Authority

This skill is a read-only historical outcome adapter. It reconstructs one exact attempt from persisted ledger history and recorded evidence. The runtime owns replay validity, attempt identity, evidence verdicts, victory evaluation, cleanup status, claim codes, and fingerprints. Verification never reruns an executor, verifier side effect, or target operation.

## Triggers

- Check whether one recorded attempt has replay-valid passing evidence and successful cleanup.
- Inspect an `EXECUTED`, `EVIDENCE_RECORDED`, `FAILED`, `VERIFIED`, or `STOPPED` attempt without rerunning it.
- Resolve whether a prior tool output permits a success claim.
- Inspect an attempt after ledger replay failure while keeping execution disabled.

Do not trigger this skill to create evidence, repair cleanup, repeat an action, or verify an unrecorded observation.

## Exact Contracts

| Direction | Schema reference | Exact `$id` |
|---|---|---|
| Input | `schemas/verify-outcome.schema.json#/$defs/input` | `gov-207.verify-outcome.input.v1` |
| Output | `schemas/verify-outcome.schema.json#/$defs/output` | `gov-207.verify-outcome.output.v1` |

The input must be one JSON object no larger than 65,536 UTF-8 bytes. The response must be no larger than 1,048,576 UTF-8 bytes. It identifies one exact `attemptId` and expected state and ledger heads; no command or mutable verification input is admitted.

## Allow List

| Kind | Allowed IDs |
|---|---|
| Tool | `governor.agent_api.invoke` |
| Facade operation | `verify_outcome` |
| Named query | `prior_verified_outcomes`, only when present in the trusted menu |
| Capabilities | `runtime.ledger.replay`, `runtime.outcome.read` |

Every other tool, operation, named query, and capability is denied.

## Procedure

1. Take `taskId`, `attemptId`, `expectedStateSha256`, and `expectedLedgerHeadSha256` only from a validated runtime result or operator-selected recorded attempt.
2. Validate the complete input against `schemas/verify-outcome.schema.json#/$defs/input`.
3. Invoke `governor.agent_api.invoke` exactly once with operation `verify_outcome` and the validated input.
4. Require the facade to load the complete persisted ledger, replay against its trusted anchor, and reconstruct exactly the requested historical attempt without side effects.
5. Validate the complete response against `schemas/verify-outcome.schema.json#/$defs/output`.
6. Check the structured `replay`, `attempt`, `decision`, `evidence`, `cleanup`, and `claim` records. Do not reinterpret evidence observations or verdicts.
7. A success statement is allowed only when `status=verified`, `replay.valid=true`, the recorded phase is `VERIFIED`, `decision.passed=true`, every required evidence verdict is `pass`, cleanup succeeded, and `claim.mayDeclareSuccess=true` with `claimCode=verified_evidence`.
8. Preserve `nextMenu`, `directive`, reason codes, evidence IDs, and fingerprints unchanged. Verification output does not authorize another execution.

## Machine Stops

| Runtime result or reason | Required handling |
|---|---|
| Invalid ledger replay | Return `not_verified` or `stopped`, use `claimCode=invalid_ledger`, and expose no executor. |
| Stale expected state or ledger head | Follow `reinspect`; do not read a different attempt as a substitute. |
| Missing attempt or evidence | Return `not_verified` with `missing_evidence`; do not manufacture evidence. |
| Failed or error evidence | Return `not_verified` with `failed_evidence`; do not override the verdict. |
| Cleanup failed | Return `not_verified` with `cleanup_failed`; an otherwise passing decision is not success. |
| `STOPPED`, retry exhausted, or deadline exhausted | Stop. Historical inspection remains read-only and must not invoke an executor. |
| Malformed runtime result or denied capability | Fail closed and require operator action. |

## Failure Handling

- Any replay failure, missing required evidence, failed evidence, cleanup failure, phase mismatch, or fingerprint mismatch prohibits success.
- A running process, reachable endpoint, changed file, or model observation outside recorded evidence has no verification authority.
- Do not call an executor or verifier to fill a historical gap. Report the exact machine reason instead.
- Do not retry after a machine stop or translate `not_verified`, `failed`, or `stopped` into partial success.

## Prohibitions

- Prose, model confidence, summaries, visible side effects, and user assertions cannot replace a tool receipt or verifier evidence.
- Do not create, edit, reinterpret, or backfill evidence records.
- Do not run raw shell, construct arbitrary commands or argv, or invoke any unlisted tool.
- Do not submit raw Cypher or infer verification from graph output.
- Do not perform ledger writes or graph writes, edit either store, or ask another tool to do so.
- Do not mint, expose, modify, reuse, or choose validation tokens.
- Do not rerun any side effect for verification and do not declare success unless `claim.mayDeclareSuccess` is true under the exact verified conditions above.
