from __future__ import annotations

from dataclasses import replace
import hashlib
from pathlib import Path
import socket
import time

import pytest

from governor.evidence import (
    CleanupResult,
    EvidenceType,
    EvidenceVerdict,
    Postcondition,
    VictoryCondition,
)
from governor.executors import (
    ExecutionOutcome,
    ExecutorRegistry,
    ExecutorSpec,
    make_start_site_executor,
    process_cleanup,
)
from governor.hashing import sha256_payload
from governor.lifecycle import LifecyclePhase
from governor.loop_guards import AttemptRecord, LoopDecisionType, LoopPolicy, compute_attempt_key
from governor.runtime_ledger import replay_runtime_ledger
from governor.runtime_models import OperationSpec, create_agent_state
from governor.transitions import OperationRegistry, validate_move
from governor.verification import execute_validated_move
from governor.verifiers import VerifierRegistry, default_verifier_entries


SCRIPT = Path(__file__).parent / "fixtures" / "gov_205" / "site_server.py"
CAPABILITY = "runtime.start-site"
OPERATION = "operation:start-site"
POLICY = sha256_payload("gov-205-policy")
CONTEXT = sha256_payload("gov-205-context")


def _port() -> int:
    with socket.socket() as listener:
        listener.bind(("127.0.0.1", 0))
        return int(listener.getsockname()[1])


def _operation_registry() -> OperationRegistry:
    spec = OperationSpec(
        operation_id=OPERATION,
        capability=CAPABILITY,
        allowed_phases=(LifecyclePhase.VALIDATED.value,),
        result_phase=LifecyclePhase.EXECUTED.value,
        parameter_schema={
            "port": "integer",
            "bind_port": "integer",
            "mode": "string",
            "status": "integer",
            "body": "string",
            "delay": "number",
        },
        required_parameters=("port",),
        defaults={
            "bind_port": 0,
            "mode": "normal",
            "status": 200,
            "body": "ready",
            "delay": 0,
        },
        search_dimensions=("port", "mode"),
    )
    return OperationRegistry({OPERATION: (spec, lambda data, parameters: dict(data))})


def _state():
    return create_agent_state(
        task_id="task:start-site",
        phase=LifecyclePhase.VALIDATED.value,
        policy_sha256=POLICY,
        context_sha256=CONTEXT,
        capabilities=(CAPABILITY,),
        data={"site_verified": False},
    )


def _move(state, *, port: int, **overrides):
    parameters = {
        "port": port,
        "bind_port": port,
        "mode": "normal",
        "status": 200,
        "body": "ready",
        "delay": 0,
    }
    parameters.update(overrides)
    return validate_move(
        state,
        OPERATION,
        parameters,
        _operation_registry(),
        policy_sha256=POLICY,
        context_sha256=CONTEXT,
        capability=CAPABILITY,
    )


def _executor_registry(port: int, *, cleanup=None, execute_entry=None) -> ExecutorRegistry:
    expected_body = hashlib.sha256(b"ready").hexdigest()
    postconditions = (
        Postcondition(
            "postcondition:http",
            EvidenceType.HTTP,
            "verifier:http-local",
            {"host": "127.0.0.1", "port": port, "path": "/"},
            {"status": 200, "body_sha256": expected_body},
        ),
        Postcondition(
            "postcondition:process",
            EvidenceType.PROCESS,
            "verifier:process",
            {},
            {"running": True},
        ),
    )
    spec = ExecutorSpec(
        "executor:start-site",
        OPERATION,
        CAPABILITY,
        postconditions,
        VictoryCondition(
            "victory:site-live",
            ("postcondition:http", "postcondition:process"),
        ),
        {"site_verified": True},
    )
    entry = make_start_site_executor(SCRIPT, spec)
    if cleanup is not None:
        entry = (entry[0], entry[1], cleanup)
    if execute_entry is not None:
        entry = (entry[0], execute_entry, entry[2])
    return ExecutorRegistry({OPERATION: entry})


def _verifier_registry(tmp_path, entries=None) -> VerifierRegistry:
    return VerifierRegistry(
        entries or default_verifier_entries(CAPABILITY),
        allowed_roots=(tmp_path,),
    )


def _execute(tmp_path, *, port=None, move_overrides=None, registry=None, verifiers=None, history=(), policy=None, deadline_seconds=2.0):
    state = _state()
    port = port or _port()
    move = _move(state, port=port, **(move_overrides or {}))
    result = execute_validated_move(
        state=state,
        events=(),
        move=move,
        executor_registry=registry or _executor_registry(port),
        verifier_registry=verifiers or _verifier_registry(tmp_path),
        loop_policy=policy or LoopPolicy(3, 3, 2),
        attempt_history=history,
        monotonic_now=time.monotonic(),
        deadline=time.monotonic() + deadline_seconds,
        declared_search_dimensions=("port", "mode"),
    )
    return state, move, result, port


def test_successful_start_site_requires_http_and_process_evidence_and_cleans_up(tmp_path) -> None:
    initial, move, result, port = _execute(tmp_path)
    assert result.state.phase == LifecyclePhase.VERIFIED.value
    assert result.state.data["site_verified"] is True
    assert result.decision is not None and result.decision.passed
    assert {item.evidence.evidence_type for item in result.verifier_results} == {
        EvidenceType.HTTP,
        EvidenceType.PROCESS,
    }
    assert result.cleanup.succeeded
    assert result.attempt is not None
    assert all(item.evidence.verdict is EvidenceVerdict.PASS for item in result.verifier_results)
    assert result.attempt.observation["pid"] > 0


@pytest.mark.parametrize(
    ("overrides", "deadline_seconds"),
    [
        ({"mode": "early_exit"}, 0.5),
        ({"bind_port": 1}, 0.4),
        ({"status": 503}, 1.0),
        ({"body": "wrong"}, 1.0),
        ({"mode": "delayed_start", "delay": 1}, 0.2),
    ],
)
def test_start_site_failure_modes_never_verify(tmp_path, overrides, deadline_seconds) -> None:
    initial, move, result, port = _execute(
        tmp_path,
        move_overrides=overrides,
        deadline_seconds=deadline_seconds,
    )
    assert result.state.phase == LifecyclePhase.FAILED.value
    assert result.state.data["site_verified"] is False
    assert result.decision is not None and not result.decision.passed
    assert result.cleanup.succeeded


def test_repeated_action_is_replanned_before_executor_invocation(tmp_path) -> None:
    state = _state()
    port = _port()
    move = _move(state, port=port)
    key = compute_attempt_key(state.state_sha256, OPERATION, move.normalized_parameters)
    history = tuple(AttemptRecord(key, OPERATION, "failed") for _ in range(3))
    called = {"count": 0}
    base = _executor_registry(port)
    spec = base.get_spec(OPERATION)
    assert spec is not None

    def forbidden(parameters, attempt_id):
        called["count"] += 1
        raise AssertionError("executor must not run")

    registry = _executor_registry(port, execute_entry=forbidden)
    result = execute_validated_move(
        state=state,
        events=(),
        move=move,
        executor_registry=registry,
        verifier_registry=_verifier_registry(tmp_path),
        loop_policy=LoopPolicy(9, 3, 2),
        attempt_history=history,
        monotonic_now=0,
        deadline=1,
        declared_search_dimensions=("port",),
    )
    assert result.guard.decision is LoopDecisionType.REPLAN
    assert result.state.phase == LifecyclePhase.REPLAN.value
    assert called["count"] == 0


def test_retry_exhaustion_stops_before_executor_invocation(tmp_path) -> None:
    state = _state()
    port = _port()
    move = _move(state, port=port)
    key = compute_attempt_key(state.state_sha256, OPERATION, move.normalized_parameters)
    history = tuple(AttemptRecord(key, OPERATION, "failed") for _ in range(2))
    result = execute_validated_move(
        state=state,
        events=(),
        move=move,
        executor_registry=_executor_registry(port),
        verifier_registry=_verifier_registry(tmp_path),
        loop_policy=LoopPolicy(1, 9, 2),
        attempt_history=history,
        monotonic_now=0,
        deadline=1,
    )
    assert result.state.phase == LifecyclePhase.STOPPED.value
    assert result.guard.reason_code == "retry_exhausted"
    assert result.attempt is None


def test_executor_exception_is_recorded_and_fails_closed(tmp_path) -> None:
    state = _state()
    port = _port()
    move = _move(state, port=port)

    def explode(parameters, attempt_id):
        raise RuntimeError("injected")

    result = execute_validated_move(
        state=state,
        events=(),
        move=move,
        executor_registry=_executor_registry(port, execute_entry=explode),
        verifier_registry=_verifier_registry(tmp_path),
        loop_policy=LoopPolicy(3, 3, 2),
    )
    assert result.state.phase == LifecyclePhase.FAILED.value
    assert result.attempt is not None and result.attempt.reason_code == "executor_exception"
    assert result.decision is not None and not result.decision.passed


def test_verifier_exception_is_recorded_as_error_evidence(tmp_path) -> None:
    port = _port()
    entries = default_verifier_entries(CAPABILITY)
    spec, _ = entries["verifier:http-local"]

    def explode(postcondition, context):
        raise RuntimeError("injected")

    entries["verifier:http-local"] = (spec, explode)
    initial, move, result, actual_port = _execute(
        tmp_path,
        port=port,
        registry=_executor_registry(port),
        verifiers=_verifier_registry(tmp_path, entries),
    )
    assert result.state.phase == LifecyclePhase.FAILED.value
    assert any(
        item.evidence.verdict is EvidenceVerdict.ERROR
        for item in result.verifier_results
    )
    assert result.cleanup.succeeded


def test_cleanup_failure_prevents_verified_after_successful_evidence(tmp_path) -> None:
    port = _port()

    def cleanup_failure(handle):
        process_cleanup(handle)
        return CleanupResult(True, False, True, "injected_cleanup_failure")

    initial, move, result, actual_port = _execute(
        tmp_path,
        port=port,
        registry=_executor_registry(port, cleanup=cleanup_failure),
    )
    assert all(item.evidence.verdict is EvidenceVerdict.PASS for item in result.verifier_results)
    assert result.state.phase == LifecyclePhase.FAILED.value
    assert result.decision is not None
    assert result.decision.reason_codes == ("cleanup_failed",)


def test_runtime_replay_uses_recorded_results_without_side_effects(tmp_path) -> None:
    initial, move, result, port = _execute(tmp_path)
    replay = replay_runtime_ledger(initial, result.events, result.state.ledger_anchor)
    assert replay.valid
    assert replay.state == result.state
    assert replay.snapshot is not None


def test_no_runtime_files_or_processes_remain_after_suite_attempt(tmp_path) -> None:
    initial, move, result, port = _execute(tmp_path)
    assert result.cleanup.succeeded
    assert tuple(tmp_path.iterdir()) == ()
