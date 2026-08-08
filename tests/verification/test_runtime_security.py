from __future__ import annotations

from dataclasses import replace

import pytest

from court_mathematics import HarmonicProfile
from governor.court_ledger import append_court_transition, replay_court_ledger
from governor.harmonic import HarmonicRule, HarmonicRuleSet, HarmonicValidator
from governor.harmonic_models import HarmonicContextManifest, create_court_state
from governor.hashing import sha256_payload
from governor.models import freeze_json, thaw_json
from governor.runtime_ledger import append_runtime_event, replay_runtime_ledger
from governor.runtime_models import (
    OperationSpec,
    TransitionError,
    ValidatedMove,
    ValidationToken,
    create_agent_state,
)
from governor.transitions import OperationRegistry, apply_validated_move, validate_move


SOURCE_SHA256 = "6d2603a2499aea55b6bc13d11694ae10e6bfad1d62cb488506a57333e182f6c9"
POLICY_SHA256 = sha256_payload({"policy": "phase4-security"})
RELEASE_SHA256 = sha256_payload({"release": "phase4-security"})
COURT_POLICY_SHA256 = sha256_payload({"policy": "phase4-court"})
OPERATION_ID = "operation:phase4-harmonic"


def _harmonic_fixture(*, rule_operation_id: str = OPERATION_ID):
    profile = HarmonicProfile.from_pitch_classes(
        subject_id="scale-state:1453",
        source_id="universal-heptatonic-ledger:1453",
        source_sha256=SOURCE_SHA256,
        pitch_classes=(0, 2, 3, 5, 7, 8, 10),
        root=0,
    )
    rule_set = HarmonicRuleSet(
        release_id="phase4-rules",
        rules=(
            HarmonicRule(
                operation_id=rule_operation_id,
                target_mask_parameter="target_mask",
                max_hamming_distance=2,
                max_voice_leading_distance=0,
            ),
        ),
    )
    manifest = HarmonicContextManifest(
        harmonic_subject_id=profile.subject_id,
        harmonic_profile_sha256=profile.fingerprint_sha256,
        harmonic_release_sha256=RELEASE_SHA256,
        harmonic_rule_set_sha256=rule_set.harmonic_rule_set_sha256,
    )
    validator = HarmonicValidator(
        manifests=(manifest,),
        profiles=(profile,),
        rule_sets=(rule_set,),
        admitted_release_sha256s=(RELEASE_SHA256,),
    )
    calls = []

    def reducer(data, parameters):
        calls.append(parameters["target_mask"])
        return {**dict(data), "target_mask": parameters["target_mask"]}

    spec = OperationSpec(
        operation_id=OPERATION_ID,
        capability="runtime.harmonic",
        allowed_phases=("INSPECTED",),
        result_phase="PROPOSED",
        parameter_schema={"target_mask": "integer"},
        required_parameters=("target_mask",),
        requires_harmonic_validation=True,
    )
    registry = OperationRegistry({OPERATION_ID: (spec, reducer)}, harmonic_validator=validator)
    state = create_agent_state(
        task_id="task:phase4-security",
        phase="INSPECTED",
        policy_sha256=POLICY_SHA256,
        capabilities=("runtime.harmonic",),
        harmonic_context_manifest=manifest,
    )
    return profile, rule_set, manifest, registry, state, calls


def test_tampered_context_fails_before_validation_token_construction(monkeypatch) -> None:
    _, _, _, registry, state, calls = _harmonic_fixture()
    tampered_state = create_agent_state(
        task_id=state.task_id,
        phase=state.phase,
        policy_sha256=state.policy_sha256,
        context_sha256="f" * 64,
        capabilities=state.capabilities,
    )
    token_constructed = False

    def forbidden_token(*args, **kwargs):
        nonlocal token_constructed
        token_constructed = True
        raise AssertionError("token constructed before context validation")

    monkeypatch.setattr("governor.transitions.ValidationToken", forbidden_token)
    with pytest.raises(TransitionError, match="harmonic_context_unavailable"):
        validate_move(
            tampered_state,
            OPERATION_ID,
            {"target_mask": 1453},
            registry,
            policy_sha256=tampered_state.policy_sha256,
            context_sha256=tampered_state.context_sha256,
            capability="runtime.harmonic",
        )
    assert token_constructed is False
    assert calls == []
    assert tampered_state.revision == 0
    assert tampered_state.ledger_anchor.event_count == 0


def test_invalid_or_missing_harmonic_rule_set_fails_closed_before_token() -> None:
    profile, rule_set, _, _, _, _ = _harmonic_fixture()
    invalid_manifest = HarmonicContextManifest(
        harmonic_subject_id=profile.subject_id,
        harmonic_profile_sha256=profile.fingerprint_sha256,
        harmonic_release_sha256=RELEASE_SHA256,
        harmonic_rule_set_sha256="e" * 64,
    )
    with pytest.raises(ValueError, match="harmonic_manifest_rule_set_missing"):
        HarmonicValidator(
            manifests=(invalid_manifest,),
            profiles=(profile,),
            rule_sets=(rule_set,),
            admitted_release_sha256s=(RELEASE_SHA256,),
        )

    _, _, _, registry, state, calls = _harmonic_fixture(
        rule_operation_id="operation:different"
    )
    with pytest.raises(TransitionError, match="harmonic_operation_rule_missing"):
        validate_move(
            state,
            OPERATION_ID,
            {"target_mask": 1453},
            registry,
            policy_sha256=state.policy_sha256,
            context_sha256=state.context_sha256,
            capability="runtime.harmonic",
        )
    assert calls == []


def test_forged_token_identity_and_harmonic_parameters_cannot_reach_reducer() -> None:
    profile, _, _, registry, state, calls = _harmonic_fixture()
    valid = validate_move(
        state,
        OPERATION_ID,
        {"target_mask": profile.rooted_scale.pitch_set.mask},
        registry,
        policy_sha256=state.policy_sha256,
        context_sha256=state.context_sha256,
        capability="runtime.harmonic",
    )
    bad_identity = replace(valid, token=replace(valid.token, token_id="0" * 64))
    rejected = apply_validated_move(state, bad_identity, registry)
    assert not rejected.accepted
    assert rejected.reason_code == "validation_token_identity_mismatch"

    harmonic_minor_mask = 2477
    parameters = freeze_json({"target_mask": harmonic_minor_mask})
    forged_token = replace(valid.token, normalized_parameters=parameters)
    token_body = {
        "operation_id": forged_token.operation_id,
        "normalized_parameters": thaw_json(parameters),
        "prior_state_sha256": forged_token.prior_state_sha256,
        "prior_ledger_sha256": forged_token.prior_ledger_sha256,
        "policy_sha256": forged_token.policy_sha256,
        "context_sha256": forged_token.context_sha256,
        "capability": forged_token.capability,
        "issued_revision": forged_token.issued_revision,
        "expires_after_revision": forged_token.expires_after_revision,
    }
    forged_token = replace(forged_token, token_id=sha256_payload(token_body))
    forged_move = replace(valid, normalized_parameters=parameters, token=forged_token)
    rejected = apply_validated_move(state, forged_move, registry)
    assert not rejected.accepted
    assert rejected.reason_code == "harmonic_voice_leading_limit_exceeded"
    assert calls == []


def test_hash_consistent_forgery_cannot_bypass_capability_or_parameter_schema() -> None:
    calls = []
    spec = OperationSpec(
        operation_id="operation:privileged",
        capability="runtime.privileged",
        allowed_phases=("INSPECTED",),
        result_phase="PROPOSED",
        parameter_schema={"value": "integer"},
        required_parameters=("value",),
    )
    registry = OperationRegistry(
        {
            spec.operation_id: (
                spec,
                lambda data, parameters: calls.append(parameters["value"]) or dict(data),
            )
        }
    )
    context = sha256_payload({"context": "forgery"})

    def forged_move(state, value):
        parameters = freeze_json({"value": value})
        body = {
            "operation_id": spec.operation_id,
            "normalized_parameters": thaw_json(parameters),
            "prior_state_sha256": state.state_sha256,
            "prior_ledger_sha256": state.ledger_anchor.head_sha256,
            "policy_sha256": state.policy_sha256,
            "context_sha256": state.context_sha256,
            "capability": spec.capability,
            "issued_revision": state.revision,
            "expires_after_revision": state.revision,
        }
        token = ValidationToken(
            token_id=sha256_payload(body),
            operation_id=spec.operation_id,
            normalized_parameters=parameters,
            prior_state_sha256=state.state_sha256,
            prior_ledger_sha256=state.ledger_anchor.head_sha256,
            policy_sha256=state.policy_sha256,
            context_sha256=state.context_sha256,
            capability=spec.capability,
            issued_revision=state.revision,
            expires_after_revision=state.revision,
        )
        return ValidatedMove(
            operation_id=spec.operation_id,
            capability=spec.capability,
            result_phase=spec.result_phase,
            normalized_parameters=parameters,
            token=token,
        )

    unauthorized = create_agent_state(
        task_id="task:unauthorized",
        phase="INSPECTED",
        policy_sha256=POLICY_SHA256,
        context_sha256=context,
        capabilities=("runtime.other",),
    )
    rejected = apply_validated_move(unauthorized, forged_move(unauthorized, 7), registry)
    assert not rejected.accepted
    assert rejected.reason_code == "capability_mismatch"

    authorized = create_agent_state(
        task_id="task:authorized",
        phase="INSPECTED",
        policy_sha256=POLICY_SHA256,
        context_sha256=context,
        capabilities=(spec.capability,),
    )
    rejected = apply_validated_move(authorized, forged_move(authorized, "wrong"), registry)
    assert not rejected.accepted
    assert rejected.reason_code == "operation_parameter_type_mismatch"
    assert calls == []


def test_agent_ledger_end_to_end_replay_and_tamper_detection() -> None:
    context = sha256_payload({"context": "phase4-agent-ledger"})
    spec = OperationSpec(
        operation_id="operation:advance",
        capability="runtime.advance",
        allowed_phases=("INSPECTED",),
        result_phase="PROPOSED",
        parameter_schema={"value": "integer"},
        required_parameters=("value",),
    )
    registry = OperationRegistry(
        {spec.operation_id: (spec, lambda data, parameters: {"value": parameters["value"]})}
    )
    initial = create_agent_state(
        task_id="task:phase4-agent-ledger",
        phase="INSPECTED",
        policy_sha256=POLICY_SHA256,
        context_sha256=context,
        capabilities=(spec.capability,),
    )
    move = validate_move(
        initial,
        spec.operation_id,
        {"value": 7},
        registry,
        policy_sha256=initial.policy_sha256,
        context_sha256=initial.context_sha256,
        capability=spec.capability,
    )
    applied = apply_validated_move(initial, move, registry)
    assert applied.accepted and applied.event_body is not None
    events, committed = append_runtime_event((), applied.state, applied.event_body)
    replay = replay_runtime_ledger(initial, events, committed.ledger_anchor)

    assert replay.valid
    assert replay.state == committed
    assert replay.snapshot is not None
    tampered = replace(events[0], payload={**thaw_json(events[0].payload), "event_kind": "tampered"})
    report = replay_runtime_ledger(initial, (tampered,), committed.ledger_anchor)
    assert not report.valid
    assert report.first_failing_sequence == 1


def test_parallel_court_ledger_end_to_end_replay_and_tamper_detection() -> None:
    initial = create_court_state(
        court_position_id="court-position:C2",
        harmonic_profile_sha256="a" * 64,
        court_policy_sha256=COURT_POLICY_SHA256,
    )
    next_state = create_court_state(
        court_position_id="court-position:C3",
        revision=1,
        harmonic_profile_sha256=initial.harmonic_profile_sha256,
        court_policy_sha256=initial.court_policy_sha256,
        ledger_anchor=initial.ledger_anchor,
    )
    events, committed = append_court_transition(
        (), initial, next_state, operation_id="court:advance"
    )
    final_state = create_court_state(
        court_position_id="court-position:C4",
        revision=2,
        harmonic_profile_sha256=initial.harmonic_profile_sha256,
        court_policy_sha256=initial.court_policy_sha256,
        ledger_anchor=committed.ledger_anchor,
    )
    events, committed = append_court_transition(
        events, committed, final_state, operation_id="court:advance"
    )
    replay = replay_court_ledger(initial, events, committed.ledger_anchor)

    assert replay.valid
    assert replay.state == committed
    assert replay.snapshot is not None
    assert replay.snapshot.anchor == committed.ledger_anchor

    modified = replace(events[0], payload={**thaw_json(events[0].payload), "operationId": "tampered"})
    for tampered_events in (
        (modified, events[1]),
        (events[1],),
        (events[1], events[0]),
        (events[0], events[0], events[1]),
    ):
        result = replay_court_ledger(initial, tampered_events, committed.ledger_anchor)
        assert not result.valid
        assert result.first_failing_sequence is not None


def test_court_ledger_rejects_nonadjacent_and_unregistered_transitions() -> None:
    initial = create_court_state(
        court_position_id="court-position:C0",
        harmonic_profile_sha256="a" * 64,
        court_policy_sha256=COURT_POLICY_SHA256,
    )
    jump = create_court_state(
        court_position_id="court-position:C4",
        revision=1,
        harmonic_profile_sha256=initial.harmonic_profile_sha256,
        court_policy_sha256=initial.court_policy_sha256,
        ledger_anchor=initial.ledger_anchor,
    )
    with pytest.raises(ValueError, match="court_transition_not_adjacent"):
        append_court_transition((), initial, jump, operation_id="court:advance")

    adjacent = create_court_state(
        court_position_id="court-position:C1",
        revision=1,
        harmonic_profile_sha256=initial.harmonic_profile_sha256,
        court_policy_sha256=initial.court_policy_sha256,
        ledger_anchor=initial.ledger_anchor,
    )
    with pytest.raises(ValueError, match="court_operation_not_registered"):
        append_court_transition((), initial, adjacent, operation_id="court:invented")
