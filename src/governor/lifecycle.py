"""Pure evidence-gated lifecycle transitions for external-effect attempts."""

from __future__ import annotations

from enum import Enum
from typing import Any

from .models import FrozenDict, freeze_json
from .runtime_models import AgentState, TransitionError, create_agent_state


class LifecyclePhase(str, Enum):
    INSPECTED = "INSPECTED"
    PROPOSED = "PROPOSED"
    VALIDATED = "VALIDATED"
    EXECUTED = "EXECUTED"
    EVIDENCE_RECORDED = "EVIDENCE_RECORDED"
    VERIFIED = "VERIFIED"
    FAILED = "FAILED"
    REPLAN = "REPLAN"
    STOPPED = "STOPPED"


LEGAL_PHASE_TRANSITIONS = {
    LifecyclePhase.INSPECTED: frozenset({LifecyclePhase.PROPOSED}),
    LifecyclePhase.PROPOSED: frozenset(
        {LifecyclePhase.VALIDATED, LifecyclePhase.FAILED}
    ),
    LifecyclePhase.VALIDATED: frozenset(
        {
            LifecyclePhase.EXECUTED,
            LifecyclePhase.FAILED,
            LifecyclePhase.REPLAN,
            LifecyclePhase.STOPPED,
        }
    ),
    LifecyclePhase.EXECUTED: frozenset(
        {LifecyclePhase.EVIDENCE_RECORDED, LifecyclePhase.FAILED}
    ),
    LifecyclePhase.EVIDENCE_RECORDED: frozenset(
        {LifecyclePhase.VERIFIED, LifecyclePhase.FAILED}
    ),
    LifecyclePhase.FAILED: frozenset(
        {LifecyclePhase.REPLAN, LifecyclePhase.STOPPED}
    ),
    LifecyclePhase.REPLAN: frozenset(
        {LifecyclePhase.PROPOSED, LifecyclePhase.STOPPED}
    ),
    LifecyclePhase.VERIFIED: frozenset(),
    LifecyclePhase.STOPPED: frozenset(),
}


def can_transition(current: LifecyclePhase | str, target: LifecyclePhase | str) -> bool:
    try:
        return LifecyclePhase(target) in LEGAL_PHASE_TRANSITIONS[LifecyclePhase(current)]
    except (KeyError, ValueError):
        return False


def advance_lifecycle(
    state: AgentState,
    target: LifecyclePhase | str,
    *,
    verified_data: FrozenDict | dict[str, Any] | None = None,
    pending_attempt_id: str | None = None,
) -> AgentState:
    """Advance one legal phase; authoritative data changes only at VERIFIED."""

    try:
        current_phase = LifecyclePhase(state.phase)
        target_phase = LifecyclePhase(target)
    except ValueError as error:
        raise TransitionError("unknown_lifecycle_phase") from error
    if target_phase not in LEGAL_PHASE_TRANSITIONS[current_phase]:
        raise TransitionError("illegal_lifecycle_transition")
    if verified_data is not None and target_phase is not LifecyclePhase.VERIFIED:
        if freeze_json(verified_data) != state.data:
            raise TransitionError("authoritative_commit_requires_verified")
    next_data = verified_data if target_phase is LifecyclePhase.VERIFIED and verified_data is not None else state.data
    return create_agent_state(
        task_id=state.task_id,
        revision=state.revision + 1,
        phase=target_phase.value,
        policy_sha256=state.policy_sha256,
        context_sha256=state.context_sha256,
        capabilities=state.capabilities,
        data=next_data,
        pending_attempt_id=(
            None
            if target_phase in {LifecyclePhase.VERIFIED, LifecyclePhase.STOPPED}
            else pending_attempt_id or state.pending_attempt_id
        ),
        consumed_token_ids=state.consumed_token_ids,
        ledger_anchor=state.ledger_anchor,
    )
