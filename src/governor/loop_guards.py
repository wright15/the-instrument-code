"""Deterministic repetition, retry, progress, deadline, and recovery guards."""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any

from .hashing import sha256_payload
from .models import FrozenDict, _require_identifier, _require_sha256, _sorted_unique, freeze_json, thaw_json


class LoopDecisionType(str, Enum):
    PROCEED = "proceed"
    REPLAN = "replan"
    STOPPED = "stopped"


@dataclass(frozen=True, slots=True)
class ProgressMetric:
    metric_id: str
    direction: str
    tolerance: float = 0.0
    required: bool = True

    def __post_init__(self) -> None:
        _require_identifier(self.metric_id, "metric_id")
        if self.direction not in {"increase", "decrease"}:
            raise ValueError("invalid_progress_direction")
        if self.tolerance < 0:
            raise ValueError("progress_tolerance_must_be_nonnegative")


@dataclass(frozen=True, slots=True)
class LoopPolicy:
    max_retries: int
    repetition_limit: int
    no_progress_window: int
    metrics: tuple[ProgressMetric, ...] = ()

    def __post_init__(self) -> None:
        if self.max_retries < 0:
            raise ValueError("max_retries_must_be_nonnegative")
        if self.repetition_limit < 1:
            raise ValueError("repetition_limit_must_be_positive")
        if self.no_progress_window < 1:
            raise ValueError("no_progress_window_must_be_positive")
        metrics = tuple(sorted(self.metrics, key=lambda item: item.metric_id))
        if len({item.metric_id for item in metrics}) != len(metrics):
            raise ValueError("duplicate_progress_metric")
        object.__setattr__(self, "metrics", metrics)


@dataclass(frozen=True, slots=True)
class AttemptRecord:
    attempt_key: str
    action_id: str
    outcome: str
    metrics: FrozenDict | dict[str, Any] = field(default_factory=FrozenDict)

    def __post_init__(self) -> None:
        _require_sha256(self.attempt_key, "attempt_key")
        _require_identifier(self.action_id, "action_id")
        _require_identifier(self.outcome, "outcome")
        object.__setattr__(self, "metrics", freeze_json(self.metrics))


@dataclass(frozen=True, slots=True)
class RecoveryMove:
    operation_id: str
    changed_dimensions: tuple[str, ...]

    def __post_init__(self) -> None:
        _require_identifier(self.operation_id, "operation_id")
        dimensions = _sorted_unique(self.changed_dimensions, "changed_dimensions")
        if not dimensions:
            raise ValueError("recovery_requires_changed_dimension")
        object.__setattr__(self, "changed_dimensions", dimensions)


@dataclass(frozen=True, slots=True)
class LoopDecision:
    decision: LoopDecisionType | str
    reason_code: str
    attempt_key: str
    recovery_moves: tuple[RecoveryMove, ...] = ()

    def __post_init__(self) -> None:
        object.__setattr__(self, "decision", LoopDecisionType(self.decision))
        _require_identifier(self.reason_code, "reason_code")
        _require_sha256(self.attempt_key, "attempt_key")
        moves = tuple(sorted(self.recovery_moves, key=lambda item: item.operation_id))
        object.__setattr__(self, "recovery_moves", moves)


def compute_attempt_key(
    prior_state_sha256: str,
    action_id: str,
    normalized_parameters: FrozenDict | dict[str, Any],
) -> str:
    return sha256_payload(
        {
            "prior_state_sha256": prior_state_sha256,
            "action_id": action_id,
            "normalized_parameters": thaw_json(freeze_json(normalized_parameters)),
        }
    )


def select_recovery_moves(
    candidates: tuple[RecoveryMove, ...],
    declared_search_dimensions: tuple[str, ...],
) -> tuple[RecoveryMove, ...]:
    allowed = set(declared_search_dimensions)
    return tuple(
        sorted(
            (
                move
                for move in candidates
                if allowed.intersection(move.changed_dimensions)
            ),
            key=lambda item: item.operation_id,
        )
    )


def _metric_improved(metric: ProgressMetric, first: Any, last: Any) -> bool:
    if not isinstance(first, (int, float)) or isinstance(first, bool):
        return False
    if not isinstance(last, (int, float)) or isinstance(last, bool):
        return False
    delta = last - first
    return delta > metric.tolerance if metric.direction == "increase" else -delta > metric.tolerance


def evaluate_loop_guards(
    *,
    prior_state_sha256: str,
    action_id: str,
    normalized_parameters: FrozenDict | dict[str, Any],
    history: tuple[AttemptRecord, ...],
    policy: LoopPolicy,
    monotonic_now: float | None = None,
    deadline: float | None = None,
    recovery_candidates: tuple[RecoveryMove, ...] = (),
    declared_search_dimensions: tuple[str, ...] = (),
) -> LoopDecision:
    attempt_key = compute_attempt_key(
        prior_state_sha256, action_id, normalized_parameters
    )
    recoveries = select_recovery_moves(
        recovery_candidates, declared_search_dimensions
    )
    if deadline is not None and monotonic_now is not None and monotonic_now >= deadline:
        return LoopDecision(LoopDecisionType.STOPPED, "deadline_exhausted", attempt_key)
    same_action = tuple(item for item in history if item.action_id == action_id)
    if len(same_action) >= policy.max_retries + 1:
        return LoopDecision(LoopDecisionType.STOPPED, "retry_exhausted", attempt_key)
    repeated = tuple(item for item in history if item.attempt_key == attempt_key)
    if len(repeated) >= policy.repetition_limit:
        return LoopDecision(
            LoopDecisionType.REPLAN,
            "repetition_limit_reached",
            attempt_key,
            recoveries,
        )
    if policy.metrics and len(same_action) >= policy.no_progress_window:
        window = same_action[-policy.no_progress_window :]
        progress = any(
            _metric_improved(
                metric,
                window[0].metrics.get(metric.metric_id),
                window[-1].metrics.get(metric.metric_id),
            )
            for metric in policy.metrics
        )
        if not progress:
            return LoopDecision(
                LoopDecisionType.REPLAN,
                "no_progress",
                attempt_key,
                recoveries,
            )
    return LoopDecision(LoopDecisionType.PROCEED, "ok", attempt_key)
