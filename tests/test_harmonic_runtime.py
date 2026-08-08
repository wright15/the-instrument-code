from __future__ import annotations

from dataclasses import FrozenInstanceError

import pytest

from court_mathematics import HarmonicProfile, PitchClassSet
from governor.harmonic import HarmonicRule, HarmonicRuleSet, HarmonicValidator
from governor.harmonic_models import (
    CourtState,
    HarmonicContextManifest,
    court_state_body,
    court_state_with_anchor,
    create_court_state,
    harmonic_context_body,
)
from governor.hashing import sha256_payload
from governor.ledger import GENESIS_SHA256, verify_ledger
from governor.models import LedgerAnchor
from governor.runtime_models import (
    AgentState,
    OperationSpec,
    TransitionError,
    create_agent_state,
)
from governor.transitions import OperationRegistry, apply_validated_move, validate_move


SOURCE_SHA256 = "6d2603a2499aea55b6bc13d11694ae10e6bfad1d62cb488506a57333e182f6c9"
POLICY_SHA256 = sha256_payload({"policy": "harmonic-runtime-test"})
RELEASE_SHA256 = sha256_payload({"release": "court-mathematics:0.1.0"})
COURT_POLICY_SHA256 = sha256_payload({"policy": "court:test"})
OPERATION_ID = "operation:harmonic-mutate"


def _profile() -> HarmonicProfile:
    return HarmonicProfile.from_pitch_classes(
        subject_id="scale-state:1453",
        source_id="universal-heptatonic-ledger:1453",
        source_sha256=SOURCE_SHA256,
        pitch_classes=(0, 2, 3, 5, 7, 8, 10),
        root=0,
    )


def _harmonic_runtime(
    *,
    max_hamming_distance: int = 2,
    max_voice_leading_distance: int = 0,
):
    profile = _profile()
    rule_set = HarmonicRuleSet(
        release_id="harmonic-rules:test",
        rules=(
            HarmonicRule(
                operation_id=OPERATION_ID,
                target_mask_parameter="target_mask",
                max_hamming_distance=max_hamming_distance,
                max_voice_leading_distance=max_voice_leading_distance,
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
    spec = OperationSpec(
        operation_id=OPERATION_ID,
        capability="runtime.harmonic.mutate",
        allowed_phases=("INSPECTED",),
        result_phase="PROPOSED",
        parameter_schema={"target_mask": "integer"},
        required_parameters=("target_mask",),
        requires_harmonic_validation=True,
    )
    reducer_calls: list[int] = []

    def reducer(data, parameters):
        reducer_calls.append(parameters["target_mask"])
        return {**dict(data), "target_mask": parameters["target_mask"]}

    registry = OperationRegistry(
        {OPERATION_ID: (spec, reducer)},
        harmonic_validator=validator,
    )
    state = create_agent_state(
        task_id="task:harmonic",
        phase="INSPECTED",
        policy_sha256=POLICY_SHA256,
        capabilities=("runtime.harmonic.mutate",),
        harmonic_context_manifest=manifest,
        data={"objective": "harmonic-test"},
    )
    return profile, rule_set, manifest, registry, state, reducer_calls


def test_harmonic_manifest_is_the_agent_context_fingerprint() -> None:
    profile, rule_set, manifest, _, state, _ = _harmonic_runtime()

    assert manifest.context_sha256 == sha256_payload(harmonic_context_body(manifest))
    assert state.context_sha256 == manifest.context_sha256
    assert manifest.harmonic_profile_sha256 == profile.fingerprint_sha256
    assert manifest.harmonic_rule_set_sha256 == rule_set.harmonic_rule_set_sha256
    assert "harmonic" not in state.data


def test_explicit_context_must_match_harmonic_manifest() -> None:
    _, _, manifest, _, _, _ = _harmonic_runtime()

    with pytest.raises(ValueError, match="harmonic_context_fingerprint_mismatch"):
        create_agent_state(
            task_id="task:mismatch",
            phase="INSPECTED",
            policy_sha256=POLICY_SHA256,
            context_sha256="0" * 64,
            capabilities=("runtime.harmonic.mutate",),
            harmonic_context_manifest=manifest,
        )


def test_invalid_harmonic_move_issues_no_token_and_changes_no_ledger(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    profile, _, _, registry, state, reducer_calls = _harmonic_runtime()
    harmonic_minor = PitchClassSet.from_pitch_classes((0, 2, 3, 5, 7, 8, 11))
    token_constructed = False

    def forbidden_token(*args, **kwargs):
        nonlocal token_constructed
        token_constructed = True
        raise AssertionError("token construction must follow harmonic validation")

    monkeypatch.setattr("governor.transitions.ValidationToken", forbidden_token)

    with pytest.raises(
        TransitionError,
        match="harmonic_voice_leading_limit_exceeded",
    ):
        validate_move(
            state,
            OPERATION_ID,
            {"target_mask": harmonic_minor.mask},
            registry,
            policy_sha256=state.policy_sha256,
            context_sha256=state.context_sha256,
            capability="runtime.harmonic.mutate",
        )

    assert profile.rooted_scale.pitch_set.hamming_distance(harmonic_minor) == 2
    assert token_constructed is False
    assert reducer_calls == []
    assert state.revision == 0
    assert state.ledger_anchor == LedgerAnchor(0, GENESIS_SHA256)
    assert verify_ledger((), state.ledger_anchor).valid


def test_valid_harmonic_move_binds_manifest_and_reaches_reducer() -> None:
    profile, _, manifest, registry, state, reducer_calls = _harmonic_runtime()

    move = validate_move(
        state,
        OPERATION_ID,
        {"target_mask": profile.rooted_scale.pitch_set.mask},
        registry,
        policy_sha256=state.policy_sha256,
        context_sha256=state.context_sha256,
        capability="runtime.harmonic.mutate",
    )
    result = apply_validated_move(state, move, registry)

    assert move.token.context_sha256 == manifest.context_sha256
    assert result.accepted
    assert reducer_calls == [profile.rooted_scale.pitch_set.mask]


def test_harmonic_operation_requires_validator_at_registry_construction() -> None:
    spec = OperationSpec(
        operation_id=OPERATION_ID,
        capability="runtime.harmonic.mutate",
        allowed_phases=("INSPECTED",),
        result_phase="PROPOSED",
        parameter_schema={"target_mask": "integer"},
        required_parameters=("target_mask",),
        requires_harmonic_validation=True,
    )

    with pytest.raises(TransitionError, match="harmonic_validator_missing"):
        OperationRegistry({OPERATION_ID: (spec, lambda data, parameters: data)})


def test_non_harmonic_registry_and_opaque_context_remain_compatible() -> None:
    context_sha256 = sha256_payload({"legacy": "context"})
    spec = OperationSpec(
        operation_id="operation:legacy",
        capability="runtime.legacy",
        allowed_phases=("INSPECTED",),
        result_phase="PROPOSED",
        parameter_schema={},
    )
    registry = OperationRegistry(
        {spec.operation_id: (spec, lambda data, parameters: dict(data))}
    )
    state = create_agent_state(
        task_id="task:legacy",
        phase="INSPECTED",
        policy_sha256=POLICY_SHA256,
        context_sha256=context_sha256,
        capabilities=("runtime.legacy",),
    )

    move = validate_move(
        state,
        spec.operation_id,
        {},
        registry,
        policy_sha256=state.policy_sha256,
        context_sha256=context_sha256,
        capability=spec.capability,
    )

    assert move.token.context_sha256 == context_sha256


def test_court_state_is_parallel_fingerprinted_record() -> None:
    profile = _profile()
    court = create_court_state(
        court_position_id="court-position:C2",
        harmonic_profile_sha256=profile.fingerprint_sha256,
        court_policy_sha256=COURT_POLICY_SHA256,
    )
    anchored = court_state_with_anchor(
        court,
        LedgerAnchor(1, sha256_payload({"court-event": 1})),
    )

    assert isinstance(court, CourtState)
    assert not isinstance(court, AgentState)
    assert court_state_body(court) == {
        "schema_version": "crt-305.court-state.v1",
        "court_position_id": "court-position:C2",
        "revision": 0,
        "harmonic_profile_sha256": profile.fingerprint_sha256,
        "court_policy_sha256": COURT_POLICY_SHA256,
    }
    assert anchored.court_state_sha256 == court.court_state_sha256
    assert anchored.ledger_anchor.event_count == 1
    with pytest.raises(FrozenInstanceError):
        court.court_position_id = "court-position:C3"  # type: ignore[misc]
