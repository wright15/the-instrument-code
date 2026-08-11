from __future__ import annotations

from dataclasses import fields, replace
from itertools import permutations

import pytest

from governor.court_runtime import (
    COURT_KAPPA,
    COURT_MASKS,
    COURT_POLE_ORDER,
    COURT_POLE_VECTORS,
    CourtRuntimeError,
    ExactRatio,
    PoleRegister,
    apply_court_move,
    create_court_route_context,
    create_court_runtime_state,
    create_topological_translocation_record,
    list_legal_court_moves,
    load_court_runtime_policy,
    replay_court_runtime_ledger,
    validate_court_move,
    write_kappa_coordinate,
)
from governor.evidence import VerificationDecision
from governor.models import LedgerEvent
from governor.runtime_models import AgentState


PROFILE = "1" * 64
CONTEXT = "2" * 64
EVIDENCE = ("3" * 64,)
VERIFIED = VerificationDecision(True, (), EVIDENCE)


@pytest.fixture(scope="module")
def policy():
    return load_court_runtime_policy()


def state(policy, position="C0", *, session="court-test"):
    return create_court_runtime_state(
        session_id=session,
        position_id=position,
        harmonic_profile_sha256=PROFILE,
        context_fingerprint=CONTEXT,
        capabilities=("court.transition", "court.translocate"),
        policy=policy,
    )


def test_legal_move_counts_and_exact_directed_edge_closure(policy) -> None:
    states = [state(policy, f"C{i}", session=f"moves-{i}") for i in range(5)]
    assert [len(list_legal_court_moves(item, policy)) for item in states] == [1, 2, 2, 2, 1]
    edges = {
        (item.position_id, move.target_position, move.operation_id)
        for item in states
        for move in list_legal_court_moves(item, policy)
    }
    assert len(edges) == 8
    assert all(abs(int(source[1]) - int(target[1])) == 1 for source, target, _ in edges)


def test_legal_move_enumeration_honors_capability_scope(policy) -> None:
    limited = create_court_runtime_state(
        session_id="limited-capability",
        position_id="C2",
        harmonic_profile_sha256=PROFILE,
        context_fingerprint=CONTEXT,
        capabilities=("court.translocate",),
        policy=policy,
    )
    assert list_legal_court_moves(limited, policy) == ()


@pytest.mark.parametrize(
    ("source", "target", "operation"),
    [
        (f"C{i}", f"C{j}", "court:advance" if j > i else "court:retreat")
        for i in range(5)
        for j in range(5)
        if abs(i - j) == 1
    ],
)
def test_all_eight_ordinary_moves_commit(source, target, operation, policy) -> None:
    initial = state(policy, source, session=f"accept-{source}-{target}")
    move = validate_court_move(initial, operation, target, policy=policy)
    result = apply_court_move(
        initial,
        move,
        policy=policy,
        verification_decision=VERIFIED,
    )
    assert (result.accepted, result.reason_code, result.state.position_id) == (True, "ok", target)
    assert len(result.events) == 1


@pytest.mark.parametrize(
    ("source", "target"),
    [(f"C{i}", f"C{j}") for i, j in permutations(range(5), 2) if abs(i - j) > 1],
)
def test_all_twelve_non_adjacent_moves_require_translocation(source, target, policy) -> None:
    initial = state(policy, source, session=f"reject-{source}-{target}")
    with pytest.raises(CourtRuntimeError) as caught:
        validate_court_move(initial, "court:translocate", target, policy=policy)
    assert caught.value.reason_code == "non_adjacent_without_translocation"
    assert initial.revision == 0 and initial.ledger_anchor.event_count == 0


@pytest.mark.parametrize("position", [f"C{i}" for i in range(5)])
def test_same_state_is_not_a_ledger_move(position, policy) -> None:
    initial = state(policy, position, session=f"same-{position}")
    with pytest.raises(CourtRuntimeError) as caught:
        validate_court_move(initial, "court:advance", position, policy=policy)
    assert caught.value.reason_code == "same_state_not_ledger_move"
    assert initial.ledger_anchor.event_count == 0


def test_exact_derived_state_and_namespace_guards(policy) -> None:
    for index in range(5):
        item = state(policy, f"C{index}", session=f"derive-{index}")
        assert item.pitch_mask == COURT_MASKS[index]
        assert item.pole_register == PoleRegister(
            COURT_POLE_ORDER, COURT_POLE_VECTORS[index], COURT_POLE_ORDER[:index]
        )
        assert item.kappa_court == ExactRatio(*COURT_KAPPA[index])
    for namespace in (
        "physical.C_P", "harmonic.C_H", "semantic.C_S", "physical.temperature",
        "physical.entropy", "physical.enthalpy", "physical.freeEnergy",
    ):
        with pytest.raises(CourtRuntimeError, match="kappa_cross_namespace_write"):
            write_kappa_coordinate(namespace, ExactRatio(1, 2))
    assert write_kappa_coordinate("court.kappa_court", {"numerator": 1, "denominator": 2}) == ExactRatio(1, 2)


def test_state_construction_rejects_off_chain_and_inconsistent_derivations(policy) -> None:
    with pytest.raises(CourtRuntimeError, match="court_position_not_canonical"):
        state(policy, "C5")
    item = state(policy)
    with pytest.raises(CourtRuntimeError, match="court_pitch_mask_mismatch"):
        replace(item, pitch_mask=0)
    with pytest.raises(CourtRuntimeError, match="court_pole_vector_off_chain"):
        replace(item, pole_register=PoleRegister(COURT_POLE_ORDER, "0101", ("Jupiter", "Saturn")))


def test_token_reuse_stale_expiry_and_gating_reject_without_delta(policy) -> None:
    initial = state(policy, session="token-cases")
    move = validate_court_move(initial, "court:advance", "C1", policy=policy)
    rejected = apply_court_move(
        initial,
        move,
        policy=policy,
        verification_decision=VerificationDecision(False, ("failed",), EVIDENCE),
    )
    assert not rejected.accepted and rejected.reason_code == "verification_not_verified"
    assert rejected.state is initial and rejected.events == ()
    invalid_decision = apply_court_move(
        initial,
        move,
        policy=policy,
        verification_decision="VERIFIED",  # type: ignore[arg-type]
    )
    assert not invalid_decision.accepted
    assert invalid_decision.reason_code == "verification_decision_invalid"
    rejected = apply_court_move(
        initial,
        move,
        policy=policy,
        verification_decision=VerificationDecision(True, (), ()),
    )
    assert not rejected.accepted and rejected.reason_code == "verification_evidence_invalid"
    committed = apply_court_move(
        initial, move, policy=policy, verification_decision=VERIFIED
    )
    reused = apply_court_move(
        committed.state, move, committed.events, policy=policy,
        verification_decision=VERIFIED,
    )
    assert not reused.accepted and reused.reason_code == "validation_token_reused"
    other = state(policy, session="concurrent")
    stale = apply_court_move(
        other, move, policy=policy, verification_decision=VERIFIED
    )
    assert not stale.accepted and stale.reason_code == "stale_state"
    expired = apply_court_move(
        initial, move, policy=policy, verification_decision=VERIFIED,
        current_revision=1,
    )
    assert not expired.accepted and expired.reason_code == "expired_validation_token"


def test_validation_rejects_policy_context_capability_and_operation(policy) -> None:
    initial = state(policy, session="binding-cases")
    cases = (
        ({"policy_fingerprint": "9" * 64}, "policy_fingerprint_mismatch"),
        ({"context_fingerprint": "9" * 64}, "context_fingerprint_mismatch"),
        ({"capability": "court.translocate"}, "capability_mismatch"),
    )
    for kwargs, reason in cases:
        with pytest.raises(CourtRuntimeError) as caught:
            validate_court_move(initial, "court:advance", "C1", policy=policy, **kwargs)
        assert caught.value.reason_code == reason
    with pytest.raises(CourtRuntimeError, match="court_operation_not_registered"):
        validate_court_move(initial, "shell:raw", "C1", policy=policy)
    with pytest.raises(CourtRuntimeError, match="operation_target_mismatch"):
        validate_court_move(initial, "court:retreat", "C1", policy=policy)


def test_c0_c4_c0_round_trip_replays_exactly(policy) -> None:
    initial = state(policy, session="round-trip")
    current = initial
    events = ()
    for target in ("C1", "C2", "C3", "C4", "C3", "C2", "C1", "C0"):
        operation = "court:advance" if int(target[1]) > int(current.position_id[1]) else "court:retreat"
        move = validate_court_move(current, operation, target, policy=policy)
        result = apply_court_move(
            current, move, events, policy=policy, verification_decision=VERIFIED,
        )
        assert result.accepted
        current, events = result.state, result.events
    assert current.position_id == "C0"
    assert current.kappa_court == ExactRatio(0, 1)
    assert len(events) == 8
    replay = replay_court_runtime_ledger(initial, events, current.ledger_anchor, policy=policy)
    assert replay.valid and replay.state == current


@pytest.mark.parametrize("family", ["5-23", "5-27"])
@pytest.mark.parametrize(
    ("source", "target", "operator"),
    [("C0", "C4", "R7"), ("C4", "C0", "L7")],
)
def test_forward_and_reverse_compound_translocations(family, source, target, operator, policy) -> None:
    initial = state(policy, source, session=f"trans-{family}-{operator}")
    record = create_topological_translocation_record(
        source_position=source, target_position=target, operator_id=operator, forte_family=family
    )
    route = create_court_route_context(
        forte_family=family,
        operator_id=operator,
        source_scale_state_id=record.source_scale_state_id,
    )
    assert any(
        move.operation_id == "court:translocate" and move.target_position == target
        for move in list_legal_court_moves(initial, policy, translocation_records=(record,))
    )
    move = validate_court_move(
        initial, "court:translocate", target, policy=policy,
        translocation_record=record, route_context=route,
    )
    result = apply_court_move(
        initial, move, policy=policy, verification_decision=VERIFIED
    )
    assert result.accepted and result.state.position_id == target
    replay = replay_court_runtime_ledger(initial, result.events, result.state.ledger_anchor, policy=policy)
    assert replay.valid and replay.state == result.state


def test_translocation_evidence_rejects_wrong_bindings(policy) -> None:
    record = create_topological_translocation_record(
        source_position="C0", target_position="C4", operator_id="R7", forte_family="5-23"
    )
    route = create_court_route_context(
        forte_family="5-23", operator_id="R7", source_scale_state_id=1453
    )
    initial = state(policy, "C0", session="bad-trans")
    with pytest.raises(CourtRuntimeError, match="translocation_source_position_mismatch"):
        validate_court_move(state(policy, "C1", session="bad-source"), "court:translocate", "C4", policy=policy, translocation_record=record, route_context=route)
    with pytest.raises(CourtRuntimeError, match="translocation_target_position_mismatch"):
        validate_court_move(initial, "court:translocate", "C3", policy=policy, translocation_record=record, route_context=route)
    mutations = (
        ("source_forte", "7-34", "translocation_mutation_evidence_mismatch"),
        ("altered_degree", 6, "translocation_mutation_evidence_mismatch"),
        ("degree_governor", "Sun", "translocation_mutation_evidence_mismatch"),
        ("operator_id", "L7", "translocation_mutation_evidence_mismatch"),
        ("evidence_sha256", "9" * 64, "translocation_evidence_hash_mismatch"),
        ("crt304_fingerprint", "9" * 64, "translocation_crt304_fingerprint_mismatch"),
        ("static_route_record_id", "noncomm:wrong", "translocation_static_route_record_mismatch"),
    )
    for field_name, value, reason in mutations:
        with pytest.raises(CourtRuntimeError) as caught:
            replace(record, **{field_name: value})
        assert caught.value.reason_code == reason


def test_legacy_root_contract_field_sets_and_external_topology_are_unchanged(policy) -> None:
    assert tuple(item.name for item in fields(AgentState)) == (
        "task_id", "revision", "phase", "policy_sha256", "context_sha256",
        "capabilities", "data", "pending_attempt_id", "consumed_token_ids",
        "ledger_anchor", "state_sha256",
    )
    assert tuple(item.name for item in fields(LedgerEvent)) == (
        "sequence", "previous_event_sha256", "payload", "payload_sha256", "event_sha256"
    )
    topology = {
        "ScaleState": {"id": 2477, "office": "Jupiter", "hasGovernorSeat": True},
        "OCCUPIES_OFFICE": [{"source": 2477, "target": "Jupiter"}],
        "mutation": {"degreeGovernor": "Moon"},
    }
    expected = {
        "ScaleState": {"id": 2477, "office": "Jupiter", "hasGovernorSeat": True},
        "OCCUPIES_OFFICE": [{"source": 2477, "target": "Jupiter"}],
        "mutation": {"degreeGovernor": "Moon"},
    }
    initial = state(policy, session="external-topology")
    move = validate_court_move(initial, "court:advance", "C1", policy=policy)
    result = apply_court_move(
        initial, move, policy=policy, verification_decision=VERIFIED
    )
    assert result.accepted and topology == expected
