from __future__ import annotations

import pytest

from governor.hashing import sha256_payload
from governor.lifecycle import LifecyclePhase, advance_lifecycle, can_transition
from governor.runtime_models import TransitionError, create_agent_state


POLICY = sha256_payload("policy")
CONTEXT = sha256_payload("context")


def _state(phase: LifecyclePhase, data=None):
    return create_agent_state(
        task_id="task:lifecycle",
        phase=phase.value,
        policy_sha256=POLICY,
        context_sha256=CONTEXT,
        capabilities=("runtime.start-site",),
        data=data or {"site_live": False},
        pending_attempt_id="attempt:1",
    )


def test_happy_path_uses_exact_lifecycle_order() -> None:
    state = _state(LifecyclePhase.INSPECTED)
    expected = (
        LifecyclePhase.PROPOSED,
        LifecyclePhase.VALIDATED,
        LifecyclePhase.EXECUTED,
        LifecyclePhase.EVIDENCE_RECORDED,
        LifecyclePhase.VERIFIED,
    )

    phases = []
    for target in expected:
        state = advance_lifecycle(
            state,
            target,
            verified_data={"site_live": True} if target is LifecyclePhase.VERIFIED else None,
        )
        phases.append(state.phase)

    assert tuple(phases) == tuple(item.value for item in expected)
    assert state.data["site_live"] is True
    assert state.pending_attempt_id is None


def test_every_undeclared_lifecycle_transition_is_rejected() -> None:
    for current in LifecyclePhase:
        for target in LifecyclePhase:
            if can_transition(current, target):
                continue
            with pytest.raises(TransitionError, match="illegal_lifecycle_transition"):
                advance_lifecycle(_state(current), target)


def test_executed_and_evidence_recorded_cannot_commit_success_state() -> None:
    validated = _state(LifecyclePhase.VALIDATED)
    with pytest.raises(TransitionError, match="authoritative_commit_requires_verified"):
        advance_lifecycle(
            validated,
            LifecyclePhase.EXECUTED,
            verified_data={"site_live": True},
        )
    executed = advance_lifecycle(validated, LifecyclePhase.EXECUTED)
    evidence = advance_lifecycle(executed, LifecyclePhase.EVIDENCE_RECORDED)

    assert executed.data["site_live"] is False
    assert evidence.data["site_live"] is False


def test_verified_and_stopped_are_terminal() -> None:
    verified = _state(LifecyclePhase.VERIFIED, {"site_live": True})
    stopped = _state(LifecyclePhase.STOPPED)

    assert all(not can_transition(verified.phase, phase) for phase in LifecyclePhase)
    assert all(not can_transition(stopped.phase, phase) for phase in LifecyclePhase)


def test_failure_can_only_replan_or_stop() -> None:
    failed = _state(LifecyclePhase.FAILED)
    assert can_transition(failed.phase, LifecyclePhase.REPLAN)
    assert can_transition(failed.phase, LifecyclePhase.STOPPED)
    assert not can_transition(failed.phase, LifecyclePhase.VERIFIED)
