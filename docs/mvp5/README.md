# MVP-5 / L21 Documentation Set

This directory documents the MVP-5 sprint and the L21 landing of the coupled
two-tier symbolic-acoustic engine. The documents are derived from the landed
state; they are explanatory artifacts, not part of the sixty-four-payload L21
landing set.

## Reading order

1. [Sprint Review](01-sprint-review.md) — what the directive asked for, what was
   executed, what changed, and how acceptance was decided.
2. [Product Increment](02-product-increment.md) — what the increment delivers,
   where the artifacts live, how to use them, and what is intentionally out of
   scope.
3. [Architecture and Design](03-architecture-and-design.md) — how the coupled
   engine works, why the two tiers are separated, the invariants that keep it
   auditable, and the extension points.

## Canonical evidence

| Surface | Location |
|---|---|
| L21 ledger entry | `provenance/DECISION_LEDGER.md` |
| Landing receipt | `qa/mvp5_landing_receipt.json` |
| Task receipts | `qa/mvp5_task_0_receipt.json`, `qa/mvp5_task_a_receipt.json`, `qa/mvp5_task_b_receipt.json`, `qa/mvp5_task_c_receipt.json`, `qa/mvp5_task_d_receipt.json` |
| Sprint closing report | `scrum/plan/mvp5-sprint-closing-report.md` |
| Ear-validation protocol | `tools/governed-loop/mvp5/task-d/EAR_VALIDATION_PROTOCOL.md` |
| Code and traces | `tools/governed-loop/mvp5/` |
| Audio renders | `tools/governed-loop/mvp5/task-b/renders/` |
| Policy-v3 sweep | `tools/governed-loop/plv3_sweep_predeclared.json`, `plv3_sweep.json`, `plv3_sweep.py` |

## Fixed point

The L21 landing opened on repository `HEAD`
`ba6ae1fe2c8b31ab739c91593701177678bff18b` with a clean tree. The L20 ledger was
`8d0a04732370167e84b439a1a019ff6475c951ab86c258b84c79304534f2102d`
(340,531 bytes / 4,112 lines). The L21 ledger after append is
`e74cf6a2d79e9170c6686f2fb5287043ab1dd2c41d4f9a56d62b97f766c8f1c4`
(356,466 bytes / 4,189 lines). The L20 prefix is preserved byte-for-byte.

The release closure is `seven-governors-integrated-1.9.0` with **418 passing
checks** and no failures.

## Non-claims

This material is overlay-dynamics documentation for `SPEC-001 §1.3`. It does not
claim GOV-517 correspondence, canonical identity, physical causation, a GSL
number, or a `C_H` value. Session prose is context, not evidence.
