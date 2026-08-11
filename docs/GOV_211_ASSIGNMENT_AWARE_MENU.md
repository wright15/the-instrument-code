# GOV-211 Assignment-Aware Menu Organization

GOV-211 composes a presentation-only organization sidecar around unchanged
GOV-207 Governor or CRT-307 Court responses. The complete base response remains
under `baseOutput` with its original menu, moves, named queries, executor flag,
directive, receipts, and result fingerprint. `presentationOrder` is guidance to
a consumer; it is not a replacement runtime menu.

## Trust Boundary

- Only skills already present in the replay-derived base menu are organized.
- GOV-210 assignment rows are informational and cannot create, suppress,
  validate, execute, or authorize a skill or move.
- The provider may expose only `skills_for_topology_target` and
  `skills_for_court_position`. Results are bounded and sealed to exact query
  parameters and the GOV-210 projection fingerprint.
- Governor topology targets require a host-issued HMAC binding over task,
  revision, state, ledger head, policy, context, and canonical topology source.
  A caller-provided target ID or an unkeyed consistency hash is not accepted.
- Court position is derived from the closed replayed CRT-307 state and is bound
  to the full state reference plus the base response and menu seals.
- Missing, stale, unauthenticated, malformed, oversized, timed-out, or
  fingerprint-mismatched evidence yields fallback organization in the original
  menu order.

The organization policy fingerprint is
`798336db2b977d40d819b6b64282b88eda5191f44954a87a5bb2386a6b0ab98a`.
Its authority is `presentation_order_only` and `runtimeAuthority` is always
`false`.

## Composition

Use `SnapshotAssignmentProvider` for the canonical file provider or implement a
trusted provider that returns the same sealed result contract for live Neo4j.
The host keeps the topology binding key outside model-visible requests and
responses.

```python
from governor.assignment_menu import (
    AssignmentAwareFacade,
    SnapshotAssignmentProvider,
    TrustedTopologyTargetBinding,
)

provider = SnapshotAssignmentProvider(snapshot)
facade = AssignmentAwareFacade(
    governor_api=agent_api,
    assignment_provider=provider,
    projection_fingerprint=provider.projection_fingerprint,
    topology_binding_key=host_secret,
)
binding = TrustedTopologyTargetBinding.issue(
    1453,
    task_id=state.task_id,
    revision=state.revision,
    state_sha256=state.state_sha256,
    ledger_head_sha256=state.ledger_anchor.head_sha256,
    policy_fingerprint=state.policy_sha256,
    context_fingerprint=state.context_sha256,
    authentication_key=host_secret,
)
response = facade.invoke_governor(
    "inspect_context",
    request,
    topology_binding=binding,
)
```

`verify_assignment_aware_response` verifies the wrapper, organization, closed
base response, menu seals, identity cross-bindings, exact skill partition, and
all no-authority flags. It deliberately rejects a rehashed wrapper around an
invalid base response.

## Validation

Run:

```bash
npm run validate:gov211
npm run test:gov211:neo4j
```

The native test imports GOV-210 into an isolated Neo4j harness, executes both
assignment queries, seals their rows as GOV-211 provider results, proves byte
identity with the file provider, and verifies GOV-210-only reset behavior.
