from __future__ import annotations

from governor.hashing import sha256_payload
from governor.loop_guards import (
    AttemptRecord,
    LoopDecisionType,
    LoopPolicy,
    ProgressMetric,
    RecoveryMove,
    compute_attempt_key,
    evaluate_loop_guards,
    select_recovery_moves,
)


STATE = sha256_payload("state")


def _policy(**overrides):
    values = {
        "max_retries": 5,
        "repetition_limit": 3,
        "no_progress_window": 2,
        "metrics": (),
    }
    values.update(overrides)
    return LoopPolicy(**values)


def _record(parameters=None, *, metrics=None, state=STATE):
    return AttemptRecord(
        attempt_key=compute_attempt_key(
            state, "operation:start-site", parameters or {"port": 4321}
        ),
        action_id="operation:start-site",
        outcome="failed",
        metrics=metrics or {},
    )


def _decision(history=(), policy=None, **kwargs):
    return evaluate_loop_guards(
        prior_state_sha256=STATE,
        action_id="operation:start-site",
        normalized_parameters={"port": 4321},
        history=history,
        policy=policy or _policy(),
        **kwargs,
    )


def test_reordered_parameters_produce_same_attempt_key() -> None:
    first = compute_attempt_key(STATE, "operation:start-site", {"port": 4321, "host": "127.0.0.1"})
    second = compute_attempt_key(STATE, "operation:start-site", {"host": "127.0.0.1", "port": 4321})
    assert first == second


def test_irrelevant_metadata_does_not_bypass_repetition_key() -> None:
    first = _record()
    second = AttemptRecord(first.attempt_key, first.action_id, "different-diagnostic", {"noise": 9})
    assert first.attempt_key == second.attempt_key


def test_changed_prior_state_produces_new_attempt_key() -> None:
    assert _record().attempt_key != _record(state=sha256_payload("new-state")).attempt_key


def test_repetition_limit_blocks_next_side_effect_with_replan() -> None:
    history = (_record(), _record(), _record())
    decision = _decision(history, _policy(repetition_limit=3, max_retries=9))
    assert decision.decision is LoopDecisionType.REPLAN
    assert decision.reason_code == "repetition_limit_reached"


def test_retry_exhaustion_precedes_repetition_and_stops() -> None:
    history = (_record(), _record(), _record())
    decision = _decision(history, _policy(max_retries=2, repetition_limit=9))
    assert decision.decision is LoopDecisionType.STOPPED
    assert decision.reason_code == "retry_exhausted"


def test_unchanged_metrics_trigger_no_progress_replan() -> None:
    metric = ProgressMetric("responses", "increase", tolerance=0)
    history = (_record(metrics={"responses": 0}), _record(metrics={"responses": 0}))
    decision = _decision(history, _policy(metrics=(metric,)))
    assert decision.decision is LoopDecisionType.REPLAN
    assert decision.reason_code == "no_progress"


def test_improvement_beyond_tolerance_resets_no_progress_window() -> None:
    metric = ProgressMetric("responses", "increase", tolerance=0.5)
    history = (_record(metrics={"responses": 0}), _record(metrics={"responses": 1}))
    decision = _decision(history, _policy(metrics=(metric,)))
    assert decision.decision is LoopDecisionType.PROCEED


def test_missing_required_metric_does_not_count_as_progress() -> None:
    metric = ProgressMetric("responses", "increase", required=True)
    decision = _decision((_record(), _record()), _policy(metrics=(metric,)))
    assert decision.reason_code == "no_progress"


def test_exhausted_deadline_prevents_execution() -> None:
    decision = _decision(monotonic_now=10.0, deadline=10.0)
    assert decision.decision is LoopDecisionType.STOPPED
    assert decision.reason_code == "deadline_exhausted"


def test_recovery_requires_declared_search_dimension_and_is_stably_sorted() -> None:
    candidates = (
        RecoveryMove("operation:z", ("timeout",)),
        RecoveryMove("operation:a", ("port",)),
        RecoveryMove("operation:b", ("irrelevant",)),
    )
    selected = select_recovery_moves(candidates, ("port", "timeout"))
    assert tuple(item.operation_id for item in selected) == ("operation:a", "operation:z")


def test_replan_returns_only_legal_recovery_dimensions() -> None:
    recovery = RecoveryMove("operation:change-port", ("port",))
    decision = _decision(
        (_record(), _record(), _record()),
        _policy(repetition_limit=3, max_retries=9),
        recovery_candidates=(recovery, RecoveryMove("operation:rename", ("label",))),
        declared_search_dimensions=("port",),
    )
    assert decision.recovery_moves == (recovery,)
