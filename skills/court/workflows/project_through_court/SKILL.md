---
name: seven-governors-project-through-court
description: Apply the runtime-bound current-position Court filter to one ambient 12-bit mask without state mutation.
---

# Project Through Court

## Trigger And Input

Use this skill to project a `sourceMask` through the current Court position and evaluate one `mutationOperatorId`. Every 12-bit mask from `0` through `4095` is valid and read-only. The closed `crt-307.project-through-court.input.v1` accepts only `schemaVersion`, `requestId`, `sessionId`, `expectedStateSha256`, `expectedLedgerHeadSha256`, `sourceMask`, and `mutationOperatorId` within 65,536 UTF-8 bytes.

## Allow List And Authority

Invoke only `governor.court_agent_api.invoke`, operation `project_through_court`, once. `court.ledger.replay` and `court.filter.project` are required and read-only. Optional `court.graph.read.named` permits at most one `court_filter_commutation_outputs` call and no other query. CRT-305 token scope is `none`.

The current-position filter is runtime-bound, never caller-selected. Runtime replay controls; the state graph is optional corroboration and cannot override projection. The model cannot invent a Court position, poles, `kappaCourt`, filter, translocation, route, commutation result, or evidence. Prose cannot claim success.

## Deterministic Procedure

1. Validate the exact state hashes, ambient `sourceMask`, and bounded `mutationOperatorId` against `schemas/project-through-court.schema.json#/$defs/input`; any commutation-query application ID is trusted host configuration, never model input.
2. Invoke the allow-listed operation once and accept only the filter bound by the replayed current position.
3. If requested, consume at most one five-valued commutation result; nullable route fields remain null when no verified route exists.
4. Validate all of `crt-307.project-through-court.output.v1` and preserve state, masks, filter and set IDs, route fields, status, reason, directive, receipts, evidence semantics, and fingerprints.

## Stops, Recovery, And Prohibitions

`stale_state` or `stale_ledger` requires `reinspect`. `policy_fingerprint_mismatch` or `context_fingerprint_mismatch` also requires `reinspect`. `court_position_not_canonical`, `kappa_cross_namespace_write`, or `capability_denied` stops for operator action. `non_adjacent_without_translocation` cannot be cured by projection. `repetition_limit_reached` requires `replan`; `retry_exhausted` requires `stop`.

This operation performs no state writes, office writes, `OCCUPIES_OFFICE` writes, Degree-Governor writes, topology writes, Governor writes, graph writes, or ledger writes. It cannot infer authority from graph proximity or prose.
