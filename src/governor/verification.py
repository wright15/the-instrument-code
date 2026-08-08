"""Evidence-gated execution orchestration with deterministic ledger records."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from .evidence import (
    CleanupResult,
    EvidenceVerdict,
    VerificationDecision,
    VerifierResult,
    evidence_body,
    evaluate_victory,
)
from .executors import ExecutionAttempt, ExecutorRegistry
from .hashing import sha256_payload
from .lifecycle import LifecyclePhase, advance_lifecycle
from .loop_guards import (
    AttemptRecord,
    LoopDecision,
    LoopDecisionType,
    LoopPolicy,
    RecoveryMove,
    evaluate_loop_guards,
)
from .models import LedgerAnchor, LedgerEvent, thaw_json
from .runtime_ledger import append_runtime_event
from .runtime_models import (
    AgentState,
    TransitionError,
    ValidatedMove,
    agent_state_body,
    create_agent_state,
    create_runtime_event_body,
)
from .verifiers import VerifierRegistry


@dataclass(frozen=True, slots=True)
class ExecutionSessionResult:
    state: AgentState
    events: tuple[LedgerEvent, ...]
    guard: LoopDecision
    attempt: ExecutionAttempt | None
    verifier_results: tuple[VerifierResult, ...]
    decision: VerificationDecision | None
    cleanup: CleanupResult


def _authorization_reason(
    state: AgentState,
    move: ValidatedMove,
    executor_registry: ExecutorRegistry,
) -> str | None:
    spec = executor_registry.get_spec(move.operation_id)
    if spec is None:
        return "executor_not_registered"
    token = move.token
    checks = (
        (state.phase == LifecyclePhase.VALIDATED.value, "state_not_validated"),
        (token.token_id not in state.consumed_token_ids, "validation_token_reused"),
        (token.prior_state_sha256 == state.state_sha256, "stale_state"),
        (token.prior_ledger_sha256 == state.ledger_anchor.head_sha256, "stale_ledger"),
        (token.policy_sha256 == state.policy_sha256, "policy_fingerprint_mismatch"),
        (token.context_sha256 == state.context_sha256, "context_fingerprint_mismatch"),
        (token.capability == move.capability == spec.capability, "capability_mismatch"),
        (token.issued_revision == state.revision, "stale_validation_token"),
        (state.revision <= token.expires_after_revision, "expired_validation_token"),
        (token.normalized_parameters == move.normalized_parameters, "parameter_binding_mismatch"),
    )
    return next((reason for accepted, reason in checks if not accepted), None)


def _consume_token(state: AgentState, move: ValidatedMove) -> AgentState:
    if move.token.token_id in state.consumed_token_ids:
        return state
    return create_agent_state(
        task_id=state.task_id,
        revision=state.revision,
        phase=state.phase,
        policy_sha256=state.policy_sha256,
        context_sha256=state.context_sha256,
        capabilities=state.capabilities,
        data=state.data,
        pending_attempt_id=state.pending_attempt_id,
        consumed_token_ids=state.consumed_token_ids + (move.token.token_id,),
        ledger_anchor=state.ledger_anchor,
    )


def _record(
    events: tuple[LedgerEvent, ...],
    current: AgentState,
    next_state: AgentState,
    *,
    event_kind: str,
    operation_id: str,
    intrinsic_data: dict[str, Any],
    observation_data: dict[str, Any] | None = None,
) -> tuple[tuple[LedgerEvent, ...], AgentState]:
    body = create_runtime_event_body(
        event_kind=event_kind,
        task_id=current.task_id,
        prior_state_sha256=current.state_sha256,
        resulting_state_sha256=next_state.state_sha256,
        operation_id=operation_id,
        intrinsic_data={
            **intrinsic_data,
            "state_after": agent_state_body(next_state),
        },
        observation_data=observation_data or {},
    )
    return append_runtime_event(events, next_state, body)


def _failed_decision(reason: str) -> VerificationDecision:
    return VerificationDecision(False, (reason,), ())


def execute_validated_move(
    *,
    state: AgentState,
    events: tuple[LedgerEvent, ...],
    move: ValidatedMove,
    executor_registry: ExecutorRegistry,
    verifier_registry: VerifierRegistry,
    loop_policy: LoopPolicy,
    attempt_history: tuple[AttemptRecord, ...] = (),
    monotonic_now: float | None = None,
    deadline: float | None = None,
    recovery_candidates: tuple[RecoveryMove, ...] = (),
    declared_search_dimensions: tuple[str, ...] = (),
) -> ExecutionSessionResult:
    """Execute one exactly authorized attempt and preserve every outcome."""

    reason = _authorization_reason(state, move, executor_registry)
    if reason is not None:
        raise TransitionError(reason)
    spec = executor_registry.get_spec(move.operation_id)
    assert spec is not None
    guard = evaluate_loop_guards(
        prior_state_sha256=state.state_sha256,
        action_id=move.operation_id,
        normalized_parameters=move.normalized_parameters,
        history=attempt_history,
        policy=loop_policy,
        monotonic_now=monotonic_now,
        deadline=deadline,
        recovery_candidates=recovery_candidates,
        declared_search_dimensions=declared_search_dimensions,
    )
    if guard.decision is not LoopDecisionType.PROCEED:
        target = (
            LifecyclePhase.REPLAN
            if guard.decision is LoopDecisionType.REPLAN
            else LifecyclePhase.STOPPED
        )
        transitioned = _consume_token(
            advance_lifecycle(state, target, pending_attempt_id=guard.attempt_key), move
        )
        updated_events, transitioned = _record(
            events,
            state,
            transitioned,
            event_kind="guard_decided",
            operation_id=move.operation_id,
            intrinsic_data={
                "decision": guard.decision.value,
                "reason_code": guard.reason_code,
                "attempt_key": guard.attempt_key,
            },
        )
        return ExecutionSessionResult(
            transitioned,
            updated_events,
            guard,
            None,
            (),
            None,
            CleanupResult(False, True, False, "no_resource"),
        )

    attempt_id = sha256_payload(
        {
            "attempt_key": guard.attempt_key,
            "logical_event_sequence": len(events) + 1,
        }
    )
    started_events, started_state = _record(
        events,
        state,
        state,
        event_kind="execution_started",
        operation_id=move.operation_id,
        intrinsic_data={"attempt_id": attempt_id, "attempt_key": guard.attempt_key},
    )
    outcome = executor_registry.execute(
        move.operation_id,
        move.capability,
        move.normalized_parameters,
        attempt_id,
    )
    if not outcome.attempt.started:
        failed_state = _consume_token(
            advance_lifecycle(
                started_state,
                LifecyclePhase.FAILED,
                pending_attempt_id=attempt_id,
            ),
            move,
        )
        failed_events, failed_state = _record(
            started_events,
            started_state,
            failed_state,
            event_kind="execution_attempted",
            operation_id=move.operation_id,
            intrinsic_data={"attempt_id": attempt_id, "reason_code": outcome.attempt.reason_code},
            observation_data={"attempt": thaw_json(outcome.attempt.observation)},
        )
        cleanup = executor_registry.cleanup(move.operation_id, outcome.handle)
        failed_events, failed_state = _record(
            failed_events,
            failed_state,
            failed_state,
            event_kind="cleanup_recorded",
            operation_id=move.operation_id,
            intrinsic_data={"attempt_id": attempt_id, "succeeded": cleanup.succeeded},
            observation_data={"cleanup": thaw_json(cleanup.observation)},
        )
        return ExecutionSessionResult(
            failed_state,
            failed_events,
            guard,
            outcome.attempt,
            (),
            _failed_decision(outcome.attempt.reason_code),
            cleanup,
        )

    executed_state = _consume_token(
        advance_lifecycle(
            started_state,
            LifecyclePhase.EXECUTED,
            pending_attempt_id=attempt_id,
        ),
        move,
    )
    current_events, executed_state = _record(
        started_events,
        started_state,
        executed_state,
        event_kind="execution_attempted",
        operation_id=move.operation_id,
        intrinsic_data={"attempt_id": attempt_id, "reason_code": outcome.attempt.reason_code},
        observation_data={"attempt": thaw_json(outcome.attempt.observation)},
    )

    results: list[VerifierResult] = []
    verifier_failure: str | None = None
    for postcondition in spec.postconditions:
        try:
            results.append(
                verifier_registry.verify(
                    postcondition,
                    outcome.attempt,
                    outcome.handle,
                    deadline=deadline,
                )
            )
        except TransitionError as error:
            verifier_failure = error.reason_code
            break
    evidence_state = advance_lifecycle(
        executed_state,
        LifecyclePhase.EVIDENCE_RECORDED,
        pending_attempt_id=attempt_id,
    )
    current_events, evidence_state = _record(
        current_events,
        executed_state,
        evidence_state,
        event_kind="evidence_recorded",
        operation_id=move.operation_id,
        intrinsic_data={
            "attempt_id": attempt_id,
            "evidence_ids": [result.evidence.evidence_id for result in results],
            "verdicts": [result.evidence.verdict.value for result in results],
            "verifier_failure": verifier_failure,
        },
        observation_data={
            "evidence": [evidence_body(result.evidence) for result in results]
        },
    )

    cleanup = executor_registry.cleanup(move.operation_id, outcome.handle)
    current_events, evidence_state = _record(
        current_events,
        evidence_state,
        evidence_state,
        event_kind="cleanup_recorded",
        operation_id=move.operation_id,
        intrinsic_data={
            "attempt_id": attempt_id,
            "succeeded": cleanup.succeeded,
            "fallback_used": cleanup.fallback_used,
            "reason_code": cleanup.reason_code,
        },
        observation_data={"cleanup": thaw_json(cleanup.observation)},
    )

    if verifier_failure is not None:
        decision = _failed_decision(verifier_failure)
    else:
        decision = evaluate_victory(spec.victory_condition, tuple(results))
    if decision.passed and not cleanup.succeeded:
        decision = _failed_decision("cleanup_failed")
    if decision.passed:
        verified_data = thaw_json(evidence_state.data)
        verified_data.update(thaw_json(spec.verified_state_updates))
        final_state = advance_lifecycle(
            evidence_state,
            LifecyclePhase.VERIFIED,
            verified_data=verified_data,
        )
    else:
        final_state = advance_lifecycle(evidence_state, LifecyclePhase.FAILED)
    current_events, final_state = _record(
        current_events,
        evidence_state,
        final_state,
        event_kind="verification_decided",
        operation_id=move.operation_id,
        intrinsic_data={
            "attempt_id": attempt_id,
            "passed": decision.passed,
            "reason_codes": list(decision.reason_codes),
            "evidence_ids": list(decision.evidence_ids),
        },
    )
    return ExecutionSessionResult(
        final_state,
        current_events,
        guard,
        outcome.attempt,
        tuple(results),
        decision,
        cleanup,
    )
