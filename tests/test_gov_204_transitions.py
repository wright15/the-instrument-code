from __future__ import annotations

from dataclasses import replace
from pathlib import Path

import pytest

from governor.hashing import sha256_payload
from governor.ledger import GENESIS_SHA256, verify_ledger
from governor.models import LedgerAnchor, ProjectionBoundaryError, ProjectionEdge
from governor.runtime_ledger import (
    append_runtime_event,
    replay_runtime_ledger,
    seal_runtime_event,
)
from governor.runtime_models import (
    OperationSpec,
    TransitionError,
    create_agent_state,
    create_runtime_event_body,
)
from governor.state_store import StateStore, resolve_state_root
from governor.transitions import (
    OperationRegistry,
    apply_validated_move,
    list_legal_moves,
    validate_move,
)


POLICY = sha256_payload({"policy": "fixture"})
CONTEXT = sha256_payload({"context": "fixture"})


def _state(*, phase: str = "INSPECTED", data: dict[str, object] | None = None):
    return create_agent_state(
        task_id="task:fixture",
        phase=phase,
        policy_sha256=POLICY,
        context_sha256=CONTEXT,
        capabilities=("runtime.inspect", "runtime.validate"),
        data=data or {"objective": "test"},
    )


def _registry() -> OperationRegistry:
    inspect = OperationSpec(
        operation_id="operation:inspect",
        capability="runtime.inspect",
        allowed_phases=("INSPECTED",),
        result_phase="PROPOSED",
        parameter_schema={"target": "string", "depth": "integer"},
        required_parameters=("target",),
        defaults={"depth": 1},
        search_dimensions=("target",),
    )
    validate = OperationSpec(
        operation_id="operation:validate",
        capability="runtime.validate",
        allowed_phases=("PROPOSED",),
        result_phase="VALIDATED",
        parameter_schema={},
    )

    def inspect_reducer(data, parameters):
        return {**dict(data), "inspected_target": parameters["target"], "depth": parameters["depth"]}

    def validate_reducer(data, parameters):
        return dict(data)

    return OperationRegistry(
        {
            inspect.operation_id: (inspect, inspect_reducer),
            validate.operation_id: (validate, validate_reducer),
        }
    )


def _validated(state=None):
    current = state or _state()
    return validate_move(
        current,
        "operation:inspect",
        {"target": "site"},
        _registry(),
        policy_sha256=POLICY,
        context_sha256=CONTEXT,
        capability="runtime.inspect",
    )


def test_list_legal_moves_returns_finite_stable_registered_set() -> None:
    registry = _registry()
    first = list_legal_moves(_state(), registry)
    second = list_legal_moves(_state(), registry)

    assert tuple(move.operation_id for move in first) == ("operation:inspect",)
    assert first == second
    assert all(move.operation_id in registry.operation_ids() for move in first)


def test_operation_outside_legal_set_has_no_ledger_delta() -> None:
    state = _state()
    with pytest.raises(TransitionError, match="operation_not_legal"):
        validate_move(
            state,
            "operation:validate",
            {},
            _registry(),
            policy_sha256=POLICY,
            context_sha256=CONTEXT,
            capability="runtime.validate",
        )
    assert state.revision == 0
    assert state.ledger_anchor == LedgerAnchor(0, GENESIS_SHA256)


def test_validation_token_binds_exact_transition_inputs() -> None:
    state = _state()
    move = _validated(state)
    token = move.token

    assert token.prior_state_sha256 == state.state_sha256
    assert token.prior_ledger_sha256 == state.ledger_anchor.head_sha256
    assert token.policy_sha256 == POLICY
    assert token.context_sha256 == CONTEXT
    assert token.capability == "runtime.inspect"
    assert dict(token.normalized_parameters) == {"depth": 1, "target": "site"}


def test_stale_validation_token_fails_closed() -> None:
    state = _state()
    move = _validated(state)
    changed = create_agent_state(
        task_id=state.task_id,
        revision=1,
        phase=state.phase,
        policy_sha256=POLICY,
        context_sha256=CONTEXT,
        capabilities=state.capabilities,
        data={"objective": "changed"},
    )

    result = apply_validated_move(changed, move, _registry())

    assert not result.accepted
    assert result.event_body is None
    assert result.state == changed
    assert result.reason_code == "stale_state"


def test_reused_validation_token_fails_closed() -> None:
    state = _state()
    move = _validated(state)
    first = apply_validated_move(state, move, _registry())
    reused_state = create_agent_state(
        task_id=state.task_id,
        revision=state.revision,
        phase=state.phase,
        policy_sha256=state.policy_sha256,
        context_sha256=state.context_sha256,
        capabilities=state.capabilities,
        data=dict(state.data),
        consumed_token_ids=(move.token.token_id,),
    )

    second = apply_validated_move(reused_state, move, _registry())

    assert first.accepted
    assert not second.accepted
    assert second.reason_code == "validation_token_reused"


@pytest.mark.parametrize(
    ("field", "value", "reason"),
    [
        ("policy_sha256", sha256_payload("other"), "policy_fingerprint_mismatch"),
        ("context_sha256", sha256_payload("other"), "context_fingerprint_mismatch"),
        ("capability", "runtime.validate", "capability_mismatch"),
    ],
)
def test_capability_policy_context_and_state_mismatches_fail_closed(field, value, reason) -> None:
    state = _state()
    arguments = {
        "policy_sha256": POLICY,
        "context_sha256": CONTEXT,
        "capability": "runtime.inspect",
    }
    arguments[field] = value

    with pytest.raises(TransitionError, match=reason):
        validate_move(
            state,
            "operation:inspect",
            {"target": "site"},
            _registry(),
            **arguments,
        )
    assert state.revision == 0


def test_concurrent_prior_state_conflict_fails_closed() -> None:
    state = _state()
    move = _validated(state)
    changed_anchor = LedgerAnchor(1, sha256_payload("concurrent-event"))
    concurrent = replace(state, ledger_anchor=changed_anchor)

    result = apply_validated_move(concurrent, move, _registry())

    assert not result.accepted
    assert result.reason_code == "stale_ledger"
    assert result.event_body is None


def test_apply_move_consumes_token_once() -> None:
    state = _state()
    move = _validated(state)

    result = apply_validated_move(state, move, _registry())

    assert result.accepted
    assert result.state.revision == 1
    assert result.state.phase == "PROPOSED"
    assert result.state.consumed_token_ids == (move.token.token_id,)
    assert result.state.data["inspected_target"] == "site"
    assert result.event_body is not None


def test_replay_reconstructs_byte_identical_state() -> None:
    initial = _state()
    move = _validated(initial)
    applied = apply_validated_move(initial, move, _registry())
    assert applied.event_body is not None
    events, committed = append_runtime_event((), applied.state, applied.event_body)

    replay = replay_runtime_ledger(initial, events, committed.ledger_anchor)

    assert replay.valid
    assert replay.state == committed
    assert replay.snapshot is not None
    assert replay.snapshot.state.state_sha256 == committed.state_sha256


def test_replay_detects_modify_delete_insert_and_reorder() -> None:
    initial = _state()
    applied = apply_validated_move(initial, _validated(initial), _registry())
    assert applied.event_body is not None
    first_event = seal_runtime_event(applied.event_body, 1, GENESIS_SHA256)
    anchor = LedgerAnchor(1, first_event.event_sha256)
    modified = replace(first_event, payload={"tampered": True})

    assert not replay_runtime_ledger(initial, (modified,), anchor).valid
    assert not replay_runtime_ledger(initial, (), anchor).valid
    assert not replay_runtime_ledger(initial, (first_event, first_event), anchor).valid
    assert not replay_runtime_ledger(initial, (replace(first_event, sequence=2),), anchor).valid


def test_intrinsic_event_identity_excludes_wall_clock_and_provider() -> None:
    state = _state()
    first = create_runtime_event_body(
        event_kind="transition_failed",
        task_id=state.task_id,
        prior_state_sha256=state.state_sha256,
        resulting_state_sha256=state.state_sha256,
        operation_id="operation:inspect",
        intrinsic_data={"reason": "failed"},
        observation_data={"observed_at": "first", "provider": "one", "pid": 1},
    )
    second = create_runtime_event_body(
        event_kind="transition_failed",
        task_id=state.task_id,
        prior_state_sha256=state.state_sha256,
        resulting_state_sha256=state.state_sha256,
        operation_id="operation:inspect",
        intrinsic_data={"reason": "failed"},
        observation_data={"observed_at": "second", "provider": "two", "pid": 999},
    )

    assert first.event_id == second.event_id
    assert seal_runtime_event(first, 1, GENESIS_SHA256).event_sha256 != seal_runtime_event(
        second, 1, GENESIS_SHA256
    ).event_sha256


def test_state_store_defaults_outside_repository(tmp_path: Path) -> None:
    root = resolve_state_root(environment={"XDG_STATE_HOME": str(tmp_path)})
    assert root == (tmp_path / "seven-governors").resolve()

    repository = tmp_path / "repository"
    repository.mkdir()
    with pytest.raises(TransitionError, match="state_path_inside_repository"):
        StateStore(repository / "runtime", repository_root=repository)


def test_state_store_compare_and_swap_is_atomic(tmp_path: Path) -> None:
    store = StateStore(tmp_path / "state")
    state = _state()
    store.save(state, expected_state_sha256=None, expected_ledger_sha256=None)
    assert store.load(state.task_id) == state

    with pytest.raises(TransitionError, match="state_compare_and_swap_failed"):
        store.save(state, expected_state_sha256=sha256_payload("wrong"), expected_ledger_sha256=GENESIS_SHA256)


def test_raw_shell_raw_cypher_and_direct_ledger_write_are_not_operations() -> None:
    operation_ids = _registry().operation_ids()
    assert "shell" not in operation_ids
    assert "cypher" not in operation_ids
    assert "ledger.write" not in operation_ids
    assert all("command" not in operation_id for operation_id in operation_ids)


def test_existing_projection_suite_remains_byte_identical() -> None:
    with pytest.raises(ProjectionBoundaryError):
        ProjectionEdge(
            relationship_type="OCCUPIES_OFFICE",
            source_id="projection:a",
            target_id="office:Jupiter",
            logical_id="forbidden",
        )
    assert verify_ledger((), LedgerAnchor(0, GENESIS_SHA256)).valid
