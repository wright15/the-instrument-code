"""GOV-207 dynamic menu filtering tests."""

from __future__ import annotations

import pytest

from governor.dynamic_menu import (
    NamedQueryBinding,
    build_dynamic_menu,
)
from governor.hashing import sha256_payload
from governor.lifecycle import LifecyclePhase
from governor.loop_guards import (
    AttemptRecord,
    LoopDecisionType,
    LoopPolicy,
    RecoveryMove,
    compute_attempt_key,
    evaluate_loop_guards,
)
from governor.runtime_models import create_agent_state

from conftest import GOV207_CONTEXT, GOV207_HOST_GRANTS, GOV207_POLICY


def _state(phase: str, capabilities=("runtime.context.read", "runtime.start-site")):
    return create_agent_state(
        task_id="task:menu",
        phase=phase,
        policy_sha256=GOV207_POLICY,
        context_sha256=GOV207_CONTEXT,
        capabilities=capabilities,
        data={},
    )


def _menu(state, catalog, **kwargs):
    return build_dynamic_menu(
        state=state,
        replay_valid=True,
        catalog=catalog,
        host_grants=kwargs.get("host_grants", GOV207_HOST_GRANTS),
        classifier_available=kwargs.get("classifier_available", False),
        named_query_bindings=kwargs.get("bindings", ()),
        machine_stopped=kwargs.get("machine_stopped", False),
    )


def test_inspected_menu_exposes_discovery_skills(gov207_catalog):
    menu = _menu(_state("INSPECTED"), gov207_catalog, classifier_available=True)
    assert menu["skills"] == [
        "classify_governor",
        "inspect_context",
        "list_legal_moves",
    ]
    assert {move["operationId"] for move in menu["moves"]} == {
        "operation:inspect-context",
        "operation:start-site",
    }
    assert menu["executorExposed"] is False


def test_validated_menu_exposes_exact_execute_workflow(gov207_catalog):
    menu = _menu(_state("VALIDATED"), gov207_catalog)
    assert menu["skills"] == [
        "inspect_context",
        "list_legal_moves",
        "validate_and_execute_move",
    ]
    assert menu["executorExposed"] is True


@pytest.mark.parametrize(
    "phase",
    ["EXECUTED", "EVIDENCE_RECORDED", "VERIFIED", "STOPPED"],
)
def test_terminal_and_pending_phases_expose_read_only_skills(gov207_catalog, phase):
    menu = _menu(_state(phase), gov207_catalog)
    assert menu["skills"] == ["inspect_context", "verify_outcome"]
    assert menu["moves"] == []
    assert menu["executorExposed"] is False


def test_failed_menu_offers_recovery_moves(gov207_catalog):
    menu = _menu(_state("FAILED"), gov207_catalog)
    assert menu["skills"] == [
        "inspect_context",
        "list_legal_moves",
        "verify_outcome",
    ]
    assert {move["operationId"] for move in menu["moves"]} == {
        "operation:start-site"
    }


def test_replay_failure_exposes_only_inspect_and_verify(gov207_catalog):
    menu = build_dynamic_menu(
        state=_state("INSPECTED"),
        replay_valid=False,
        catalog=gov207_catalog,
        host_grants=GOV207_HOST_GRANTS,
        classifier_available=True,
    )
    assert menu["skills"] == ["inspect_context", "verify_outcome"]
    assert menu["moves"] == []
    assert menu["executorExposed"] is False


def test_machine_stop_suppresses_executor(gov207_catalog):
    menu = _menu(_state("VALIDATED"), gov207_catalog, machine_stopped=True)
    assert menu["skills"] == ["inspect_context", "verify_outcome"]
    assert menu["executorExposed"] is False


def test_host_grant_intersection_filters_moves(gov207_catalog):
    menu = _menu(
        _state("INSPECTED"),
        gov207_catalog,
        host_grants=frozenset({"runtime.context.read"}),
    )
    assert {move["operationId"] for move in menu["moves"]} == {
        "operation:inspect-context"
    }


def test_state_capability_intersection_filters_moves(gov207_catalog):
    menu = _menu(
        _state("INSPECTED", capabilities=("runtime.context.read",)),
        gov207_catalog,
    )
    assert {move["operationId"] for move in menu["moves"]} == {
        "operation:inspect-context"
    }


def test_validated_menu_without_moves_hides_execute_skill(gov207_catalog):
    menu = _menu(
        _state("VALIDATED", capabilities=("runtime.context.read",)),
        gov207_catalog,
        host_grants=frozenset({"runtime.context.read"}),
    )
    assert menu["skills"] == ["inspect_context", "list_legal_moves"]
    assert menu["executorExposed"] is False
    assert menu["moves"] == []


def test_named_query_bindings_are_sorted_and_fingerprinted(gov207_catalog):
    bindings = (
        NamedQueryBinding(
            "rule_explanation", sha256_payload({"ruleId": "r"}), sha256_payload("b")
        ),
        NamedQueryBinding(
            "aspect_context", sha256_payload({"aspectId": "a"}), sha256_payload("a")
        ),
    )
    menu = _menu(_state("INSPECTED"), gov207_catalog, bindings=bindings)
    assert [query["queryId"] for query in menu["namedQueries"]] == [
        "aspect_context",
        "rule_explanation",
    ]
    assert all(query["queryVersion"] == "1.0.0" for query in menu["namedQueries"])


def test_menu_fingerprint_is_deterministic(gov207_catalog):
    first = _menu(_state("INSPECTED"), gov207_catalog, classifier_available=True)
    second = _menu(_state("INSPECTED"), gov207_catalog, classifier_available=True)
    assert first == second
    assert first["menuFingerprint"] == second["menuFingerprint"]


def test_repetition_replan_consumes_machine_reason_with_recovery() -> None:
    state_hash = sha256_payload("state")
    key = compute_attempt_key(state_hash, "operation:start-site", {"port": 1})
    history = tuple(
        AttemptRecord(key, "operation:start-site", "failed") for _ in range(3)
    )
    decision = evaluate_loop_guards(
        prior_state_sha256=state_hash,
        action_id="operation:start-site",
        normalized_parameters={"port": 1},
        history=history,
        policy=LoopPolicy(9, 3, 2),
        recovery_candidates=(
            RecoveryMove("operation:start-site", ("port",)),
            RecoveryMove("operation:rename", ("label",)),
        ),
        declared_search_dimensions=("port", "mode"),
    )
    assert decision.decision is LoopDecisionType.REPLAN
    assert decision.reason_code == "repetition_limit_reached"
    assert tuple(move.operation_id for move in decision.recovery_moves) == (
        "operation:start-site",
    )
