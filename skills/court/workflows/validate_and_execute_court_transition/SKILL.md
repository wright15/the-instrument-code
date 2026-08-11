---
name: seven-governors-validate-and-execute-court-transition
description: Atomically validate, execute, and verify one trusted-menu Court transition.
---

# Validate And Execute Court Transition

## Trigger And Input

Use this skill only for one exact move from the latest trusted legal-move menu. Accept only `crt-307.validate-execute-court-transition.input.v1`: `schemaVersion`, `requestId`, `sessionId`; `selectedMove` containing exactly `operationId`, `targetPosition`, `moveHash`, and nullable `translocationHash`; and `expected` containing exactly `revision`, `stateSha256`, `ledgerHeadSha256`, `policyFingerprint`, and `contextFingerprint`. Inputs contain no caller-provided validation authority or evidence decision.

## Allow List And Authority

Invoke only `governor.court_agent_api.invoke`, operation `validate_and_execute_court_transition`, once. Base capabilities are `court.ledger.replay`, `court.move.validate`, `court.move.execute`, and `court.postcondition.verify`. The exact dynamic capability is only `court.transition` or `court.translocate`, bound by trusted-menu match, exact state match, host grant, policy fingerprint, and registered verifier. The graph-query budget is zero.

CRT-305 scope is `internal-single-use-created-and-consumed-one-invocation-never-emitted`. The runtime creates and consumes that authority internally in the atomic invocation; the model cannot receive, choose, reuse, or emit it.

No-progress attempt history is facade-local and never enters CRT-305 state or ledger records. Restarting the facade process resets this guard history; hosts requiring continuity across restarts must preserve process continuity or apply an external retry guard.

Runtime replay controls. The state graph is optional corroboration only and never execution authority. The model cannot invent a Court position, poles, `kappaCourt`, filter, translocation, route, or evidence. Prose cannot claim success.

## Deterministic Procedure

1. Construct `selectedMove` from only the four allowed fields of one current menu move. Never copy its `capability`, route context, parameter schema, postconditions, or the full menu object. Construct `expected` from the current inspected state hashes and revision.
2. Validate the complete input against `schemas/validate-execute-court-transition.schema.json#/$defs/input`.
3. Invoke the one allow-listed operation exactly once; never split validation, execution, and postcondition verification.
4. Validate `crt-307.validate-execute-court-transition.output.v1` and preserve `stateBefore`, `stateAfter`, `transition`, `ledgerDelta`, and `menu` plus status, reason, directive, receipts, and fingerprints.
5. A success claim is allowed only when the runtime returns `verified`, a persisted one-event ledger delta, and a non-null verified transition.

## Stops And Recovery

`non_adjacent_without_translocation` requires a fresh menu; do not relabel the move. `stale_state` or `stale_ledger` requires `reinspect` and no execution. `policy_fingerprint_mismatch` or `context_fingerprint_mismatch` also requires `reinspect`. `court_position_not_canonical`, `kappa_cross_namespace_write`, or `capability_denied` stops for operator action. `repetition_limit_reached` forbids retrying the same transition and requires `replan`; `retry_exhausted` requires `stop`. Failed evidence, missing verifier, malformed output, or invalid replay prohibits success.
