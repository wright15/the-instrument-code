---
name: seven-governors-inspect-court-state
description: Replay and inspect the exact authoritative Court state with optional read-only graph corroboration.
---

# Inspect Court State

## Trigger And Input

Use this skill to inspect a session before choosing a Court action or to recover after stale state, ledger, policy, or context. Accept only the closed `crt-307.inspect-court-state.input.v1` object: required `schemaVersion`, `requestId`, and `sessionId`, with optional `expectedStateSha256`, `includeGraphContext`, and `eventLimit`, within 65,536 UTF-8 bytes.

## Allow List And Authority

Invoke only `governor.court_agent_api.invoke`, operation `inspect_court_state`, once. The runtime may use `court.context.read` and `court.ledger.replay`; optional `court.graph.read.named` permits at most one `court_runtime_state_for_session` and one `court_verified_events_for_session` query, two queries total.

CRT-305 token scope is `none`. Runtime replay controls. The state graph is optional, read-only corroboration and never transition authority. The model cannot invent a Court position, poles, `kappaCourt`, filter, translocation, or evidence. Prose cannot claim success.

## Deterministic Procedure

1. Validate the complete input against `schemas/inspect-court-state.schema.json#/$defs/input`.
2. Invoke the allow-listed operation once; do not substitute raw Cypher, shell, or another tool.
3. Validate `crt-307.inspect-court-state.output.v1` in full, including exact `state`, `replay`, `graph`, and `menu` fields; only an `ok` result establishes replay validity.
4. Preserve exact state, status, reason, directive, receipts, and fingerprints. Treat graph disagreement as corroboration failure, not permission to replace replayed state.
5. Follow only `continue`, `reinspect`, `replan`, or `stop` from the runtime directive.

## Stops And Recovery

`stale_state` or `stale_ledger` requires a fresh inspection. `policy_fingerprint_mismatch` or `context_fingerprint_mismatch` requires `reinspect`. `court_position_not_canonical`, `kappa_cross_namespace_write`, or `capability_denied` stops for operator action. `non_adjacent_without_translocation` requires replanning from a fresh legal menu. `repetition_limit_reached` stops repeated inspection without progress. Any malformed response, invalid replay, or graph-derived authority claim fails closed.
