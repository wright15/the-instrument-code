---
name: seven-governors-list-legal-court-moves
description: List only legal Court transitions from an exact replay-verified state.
---

# List Legal Court Moves

## Trigger And Input

Use this skill after inspection to obtain the trusted menu, or after a rejected transition to refresh it. Accept only `crt-307.list-legal-court-moves.input.v1`: `schemaVersion`, `requestId`, `sessionId`, `expectedStateSha256`, and `expectedLedgerHeadSha256`, within 65,536 UTF-8 bytes.

## Allow List And Authority

Invoke only `governor.court_agent_api.invoke`, operation `list_legal_court_moves`, once. The runtime may use `court.ledger.replay` and `court.moves.read`. The named-query budget is zero and CRT-305 token scope is `none`.

Runtime replay controls. The state graph is optional corroboration in the bundle generally but is not queried by this operation and never controls legality. The model cannot invent a Court position, poles, `kappaCourt`, filter, translocation, move hash, or evidence. Prose cannot claim success.

## Deterministic Procedure

1. Bind the session and exact state/head hashes from the latest inspection and validate the complete input against `schemas/list-legal-court-moves.schema.json#/$defs/input`.
2. Invoke the allow-listed operation once with no graph query or side effect.
3. Validate `crt-307.list-legal-court-moves.output.v1`; preserve exact `state`, `moves`, and `menu` fields plus status, reason, directive, receipts, and fingerprints.
4. Select no move here. A later transition copies only the returned move's `operationId`, `targetPosition`, `moveHash`, and nullable `translocationHash`.

## Stops And Recovery

`stale_state` or `stale_ledger` requires `reinspect`. `policy_fingerprint_mismatch` or `context_fingerprint_mismatch` also requires `reinspect`. `non_adjacent_without_translocation` requires selecting an actually listed adjacent move or an evidenced `court:translocate`; never invent a bridge. `court_position_not_canonical`, `kappa_cross_namespace_write`, or `capability_denied` stops for operator action. `repetition_limit_reached` requires `replan`; `retry_exhausted` requires `stop`. Malformed output or invalid fingerprints fail closed.
