---
name: seven-governors-verify-court-postcondition
description: Replay a recorded Court event and report verifier-backed postcondition evidence without rerunning it.
---

# Verify Court Postcondition

## Trigger And Input

Use this skill to inspect any already recorded event without rerunning its effect. The closed `crt-307.verify-court-postcondition.input.v1` accepts only required `schemaVersion`, `requestId`, `sessionId`, `eventId`, `expectedStateSha256`, and `expectedLedgerHeadSha256`, with optional `includeGraphContext`, within 65,536 UTF-8 bytes. The caller supplies no evidence or verdict.

## Allow List And Authority

Invoke only `governor.court_agent_api.invoke`, operation `verify_court_postcondition`, once. The runtime may use `court.ledger.replay`, `court.outcome.read`, and `court.postcondition.verify`; optional `court.graph.read.named` permits one `court_runtime_state_for_session` and one `court_verified_events_for_session` query, two total. CRT-305 token scope is `none`.

Runtime replay and registered verifiers control the result. The state graph is optional, read-only corroboration and never proof by itself. The model cannot invent a Court position, poles, `kappaCourt`, filter, translocation, verifier evidence, or verdict. Prose cannot claim success.

## Deterministic Procedure

1. Validate the complete input against `schemas/verify-court-postcondition.schema.json#/$defs/input`.
2. Invoke the allow-listed operation once; never rerun the transition or query arbitrary graph text.
3. Require valid ledger replay and validate `crt-307.verify-court-postcondition.output.v1` in full.
4. Preserve exact `state`, `replay`, `postcondition`, `claim`, `graph`, and `menu` fields plus status, reason, directive, receipts, and fingerprints. Historical events close against the next recorded event; the terminal event closes against the current state and head.
5. Claim success only for `verified` with `claim.mayDeclareSuccess: true` and all recorded postcondition checks true.

## Stops And Recovery

`stale_state` or `stale_ledger` requires `reinspect`. `policy_fingerprint_mismatch` or `context_fingerprint_mismatch` also requires `reinspect`. `court_position_not_canonical`, `kappa_cross_namespace_write`, or `capability_denied` stops for operator action. `non_adjacent_without_translocation` remains a transition failure and cannot be repaired by prose. `repetition_limit_reached` forbids repeated verification without changed evidence; `retry_exhausted` requires `stop`. Missing, failed, malformed, or graph-only evidence forces a non-success result and fail-closed handling.
