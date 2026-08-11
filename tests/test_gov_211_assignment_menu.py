from __future__ import annotations

import copy
import json
from pathlib import Path
import time

import jsonschema
import pytest

from governor.agent_api import initialize_session
from governor.assignment_menu import (
    AssignmentAwareFacade,
    AssignmentMenuError,
    SnapshotAssignmentProvider,
    TrustedTopologyTargetBinding,
    seal_assignment_query_result,
    verify_assignment_aware_response,
)
from governor.court_agent_api import (
    CONTEXT_READ_CAPABILITY,
    FILTER_PROJECT_CAPABILITY,
    GRAPH_READ_NAMED_CAPABILITY,
    INSPECT_COURT_STATE,
    LEDGER_REPLAY_CAPABILITY,
    LIST_LEGAL_COURT_MOVES,
    MOVE_EXECUTE_CAPABILITY,
    MOVE_VALIDATE_CAPABILITY,
    MOVES_READ_CAPABILITY,
    OUTCOME_READ_CAPABILITY,
    POSTCONDITION_VERIFY_CAPABILITY,
    CourtAgentApi,
)
from governor.court_runtime import create_court_runtime_state, load_court_runtime_policy
from governor.court_session_store import CourtSessionStore
from governor.evidence import VerificationDecision
from governor.hashing import canonical_json_bytes, sha256_payload

from conftest import GOV207_CONTEXT, GOV207_HOST_GRANTS, GOV207_POLICY


ROOT = Path(__file__).resolve().parents[1]
TASK_ID = "task:gov211"
PROFILE = "1" * 64
COURT_CONTEXT = "2" * 64
EVIDENCE = "3" * 64
TOPOLOGY_BINDING_KEY = b"gov211-test-host-binding-key-0001"
COURT_GRANTS = frozenset(
    {
        CONTEXT_READ_CAPABILITY,
        LEDGER_REPLAY_CAPABILITY,
        GRAPH_READ_NAMED_CAPABILITY,
        MOVES_READ_CAPABILITY,
        MOVE_VALIDATE_CAPABILITY,
        MOVE_EXECUTE_CAPABILITY,
        POSTCONDITION_VERIFY_CAPABILITY,
        FILTER_PROJECT_CAPABILITY,
        OUTCOME_READ_CAPABILITY,
        "court.transition",
        "court.translocate",
    }
)


@pytest.fixture(scope="module")
def gov210_snapshot():
    return json.loads(
        (ROOT / "canonical/gov-210-availability-housing.json").read_text(encoding="utf-8")
    )


@pytest.fixture(scope="module")
def assignment_provider(gov210_snapshot):
    return SnapshotAssignmentProvider(gov210_snapshot)


def _init_governor(store):
    return initialize_session(
        store,
        task_id=TASK_ID,
        policy_sha256=GOV207_POLICY,
        context_sha256=GOV207_CONTEXT,
        capabilities=("runtime.context.read", "runtime.start-site"),
        data={"site_verified": False},
        phase="INSPECTED",
    )


def _governor_request():
    return {
        "schemaVersion": "gov-207.inspect-context.input.v1",
        "requestId": "req:gov211-governor",
        "taskId": TASK_ID,
    }


def _topology_binding(state, scale_state_id=1453):
    return TrustedTopologyTargetBinding.issue(
        scale_state_id=scale_state_id,
        task_id=state.task_id,
        revision=state.revision,
        state_sha256=state.state_sha256,
        ledger_head_sha256=state.ledger_anchor.head_sha256,
        policy_fingerprint=state.policy_sha256,
        context_fingerprint=state.context_sha256,
        authentication_key=TOPOLOGY_BINDING_KEY,
    )


def _court_api(tmp_path, *, position="C2"):
    policy = load_court_runtime_policy()
    state = create_court_runtime_state(
        session_id=f"gov211-{position}",
        position_id=position,
        harmonic_profile_sha256=PROFILE,
        context_fingerprint=COURT_CONTEXT,
        capabilities=("court.transition", "court.translocate"),
        policy=policy,
    )
    store = CourtSessionStore(tmp_path / f"court-{position}")
    store.create(state)
    api = CourtAgentApi(
        store=store,
        host_grants=COURT_GRANTS,
        verification_provider=lambda _state, _move: VerificationDecision(
            True, (), (EVIDENCE,)
        ),
    )
    request = {
        "schemaVersion": "crt-307.inspect-court-state.input.v1",
        "requestId": f"req:gov211-{position}",
        "sessionId": state.session_id,
    }
    return api, state, request


def _facade(*, governor_api=None, court_api=None, provider=None, fingerprint=None, **kwargs):
    if governor_api is not None and provider is not None:
        kwargs.setdefault("topology_binding_key", TOPOLOGY_BINDING_KEY)
    return AssignmentAwareFacade(
        governor_api=governor_api,
        court_api=court_api,
        assignment_provider=provider,
        projection_fingerprint=fingerprint,
        **kwargs,
    )


def test_governor_end_to_end_organizes_without_changing_base(
    gov207_api, gov207_store, assignment_provider
) -> None:
    state = _init_governor(gov207_store)
    request = _governor_request()
    original = gov207_api.invoke("inspect_context", request)
    facade = _facade(
        governor_api=gov207_api,
        provider=assignment_provider,
        fingerprint=assignment_provider.projection_fingerprint,
    )
    wrapped = facade.invoke_governor(
        "inspect_context", request, topology_binding=_topology_binding(state)
    )

    assert canonical_json_bytes(wrapped["baseOutput"]) == canonical_json_bytes(original)
    organization = wrapped["organization"]
    assert organization["status"] == "organized"
    assert organization["originalSkillIds"] == [
        "classify_governor",
        "inspect_context",
        "list_legal_moves",
    ]
    assert organization["presentationOrder"] == [
        "inspect_context",
        "list_legal_moves",
        "classify_governor",
    ]
    assert [row["skillId"] for row in organization["assignedSkills"]] == [
        "inspect_context",
        "list_legal_moves",
    ]
    assert organization["unassignedSkillIds"] == ["classify_governor"]
    assert organization["baseMovesFingerprint"] == sha256_payload(
        original["menu"]["moves"]
    )
    assert organization["baseMenuUnchanged"] is True
    assert organization["skillMembershipChanged"] is False
    assert organization["moveSetChanged"] is False
    assert organization["executorExposureChanged"] is False
    assert verify_assignment_aware_response(wrapped)


def test_court_end_to_end_uses_replayed_position_and_preserves_menu(
    tmp_path, assignment_provider
) -> None:
    api, _, request = _court_api(tmp_path)
    original = api.invoke(INSPECT_COURT_STATE, request)
    facade = _facade(
        court_api=api,
        provider=assignment_provider,
        fingerprint=assignment_provider.projection_fingerprint,
    )
    wrapped = facade.invoke_court(INSPECT_COURT_STATE, request)

    assert canonical_json_bytes(wrapped["baseOutput"]) == canonical_json_bytes(original)
    organization = wrapped["organization"]
    assert organization["status"] == "organized"
    assert organization["target"]["targetId"] == "C2"
    assert organization["presentationOrder"] == [
        "inspect_court_state",
        "list_legal_court_moves",
        "validate_and_execute_court_transition",
        "project_through_court",
    ]
    assert set(organization["presentationOrder"]) == set(original["menu"]["skills"])
    assert organization["baseMovesFingerprint"] == sha256_payload(
        original["menu"]["moves"]
    )
    assert verify_assignment_aware_response(wrapped)


def test_next_menu_and_court_list_outputs_compose(
    gov207_api, gov207_store, tmp_path, assignment_provider
) -> None:
    state = _init_governor(gov207_store)
    governor_request = {
        "schemaVersion": "gov-207.list-legal-moves.input.v1",
        "requestId": "req:gov211-governor-list",
        "taskId": TASK_ID,
        "expectedStateSha256": state.state_sha256,
        "expectedLedgerHeadSha256": state.ledger_anchor.head_sha256,
    }
    governor = _facade(
        governor_api=gov207_api,
        provider=assignment_provider,
        fingerprint=assignment_provider.projection_fingerprint,
    ).invoke_governor(
        "list_legal_moves",
        governor_request,
        topology_binding=_topology_binding(state),
    )
    assert governor["organization"]["status"] == "organized"
    assert governor["organization"]["baseMenuFingerprint"] == (
        governor["baseOutput"]["nextMenu"]["menuFingerprint"]
    )
    assert verify_assignment_aware_response(governor)

    court_api, court_state, _ = _court_api(tmp_path)
    court_request = {
        "schemaVersion": "crt-307.list-legal-court-moves.input.v1",
        "requestId": "req:gov211-court-list",
        "sessionId": court_state.session_id,
        "expectedStateSha256": court_state.state_sha256,
        "expectedLedgerHeadSha256": court_state.ledger_anchor.head_sha256,
    }
    court = _facade(
        court_api=court_api,
        provider=assignment_provider,
        fingerprint=assignment_provider.projection_fingerprint,
    ).invoke_court(LIST_LEGAL_COURT_MOVES, court_request)
    assert court["organization"]["status"] == "organized"
    assert verify_assignment_aware_response(court)


@pytest.mark.parametrize("namespace", ("governor", "court"))
def test_no_provider_is_exact_authority_neutral_fallback(
    namespace, gov207_api, gov207_store, tmp_path
) -> None:
    if namespace == "governor":
        state = _init_governor(gov207_store)
        request = _governor_request()
        original = gov207_api.invoke("inspect_context", request)
        wrapped = _facade(governor_api=gov207_api).invoke_governor(
            "inspect_context", request, topology_binding=_topology_binding(state)
        )
    else:
        api, _, request = _court_api(tmp_path)
        original = api.invoke(INSPECT_COURT_STATE, request)
        wrapped = _facade(court_api=api).invoke_court(INSPECT_COURT_STATE, request)
    assert wrapped["baseOutput"] == original
    organization = wrapped["organization"]
    assert organization["status"] == "fallback"
    assert organization["reasonCode"] == "assignment_provider_unavailable"
    assert organization["presentationOrder"] == organization["originalSkillIds"]
    assert organization["assignedSkills"] == []
    assert verify_assignment_aware_response(wrapped)


def test_missing_and_stale_governor_binding_never_calls_provider(
    gov207_api, gov207_store, assignment_provider
) -> None:
    state = _init_governor(gov207_store)
    calls = 0

    def recording(query_id, parameters):
        nonlocal calls
        calls += 1
        return assignment_provider(query_id, parameters)

    facade = _facade(
        governor_api=gov207_api,
        provider=recording,
        fingerprint=assignment_provider.projection_fingerprint,
    )
    missing = facade.invoke_governor("inspect_context", _governor_request())
    assert missing["organization"]["reasonCode"] == "topology_target_binding_unavailable"
    stale = TrustedTopologyTargetBinding.issue(
        1453,
        task_id=state.task_id,
        revision=state.revision,
        state_sha256="f" * 64,
        ledger_head_sha256=state.ledger_anchor.head_sha256,
        policy_fingerprint=state.policy_sha256,
        context_fingerprint=state.context_sha256,
        authentication_key=TOPOLOGY_BINDING_KEY,
    )
    stale_output = facade.invoke_governor(
        "inspect_context", _governor_request(), topology_binding=stale
    )
    assert stale_output["organization"]["reasonCode"] == "topology_target_binding_stale"
    assert calls == 0


def test_malformed_authority_row_falls_back_without_menu_mutation(
    gov207_api, gov207_store, assignment_provider
) -> None:
    state = _init_governor(gov207_store)

    def authority_provider(query_id, parameters):
        result = copy.deepcopy(assignment_provider(query_id, parameters))
        result["rows"][0]["runtimeAuthority"] = True
        core = {key: value for key, value in result.items() if key != "resultFingerprint"}
        result["resultFingerprint"] = sha256_payload(core)
        return result

    facade = _facade(
        governor_api=gov207_api,
        provider=authority_provider,
        fingerprint=assignment_provider.projection_fingerprint,
    )
    wrapped = facade.invoke_governor(
        "inspect_context",
        _governor_request(),
        topology_binding=_topology_binding(state),
    )
    organization = wrapped["organization"]
    assert organization["status"] == "fallback"
    assert organization["reasonCode"] == "assignment_query_failed"
    assert organization["presentationOrder"] == wrapped["baseOutput"]["menu"]["skills"]
    assert organization["moveSetChanged"] is False


def test_provider_fingerprint_and_timeout_fail_closed(
    gov207_api, gov207_store, assignment_provider
) -> None:
    state = _init_governor(gov207_store)

    def wrong_fingerprint(query_id, parameters):
        result = dict(assignment_provider(query_id, parameters))
        result["projectionFingerprint"] = "f" * 64
        core = {key: value for key, value in result.items() if key != "resultFingerprint"}
        result["resultFingerprint"] = sha256_payload(core)
        return result

    wrong = _facade(
        governor_api=gov207_api,
        provider=wrong_fingerprint,
        fingerprint=assignment_provider.projection_fingerprint,
    ).invoke_governor(
        "inspect_context", _governor_request(), topology_binding=_topology_binding(state)
    )
    assert wrong["organization"]["reasonCode"] == "assignment_query_failed"

    def slow_provider(_query_id, _parameters):
        time.sleep(0.05)
        return {}

    timed_out = _facade(
        governor_api=gov207_api,
        provider=slow_provider,
        fingerprint=assignment_provider.projection_fingerprint,
        timeout_ms=1,
    ).invoke_governor(
        "inspect_context", _governor_request(), topology_binding=_topology_binding(state)
    )
    assert timed_out["organization"]["reasonCode"] == "assignment_query_failed"


def test_snapshot_and_file_provider_results_are_byte_identical(
    gov210_snapshot, assignment_provider
) -> None:
    file_provider = SnapshotAssignmentProvider(
        json.loads(
            (ROOT / "canonical/gov-210-availability-housing.json").read_text(
                encoding="utf-8"
            )
        )
    )
    for query_id, parameters in (
        ("skills_for_topology_target", {"scaleStateId": 1453}),
        ("skills_for_court_position", {"positionId": "C2"}),
    ):
        first = assignment_provider(query_id, parameters)
        second = file_provider(query_id, parameters)
        assert canonical_json_bytes(first) == canonical_json_bytes(second)
        rows = first["rows"]
        resealed = seal_assignment_query_result(
            query_id,
            parameters,
            rows,
            projection_fingerprint=gov210_snapshot["projectionFingerprint"],
        )
        assert resealed == first


def test_response_and_provider_schemas_validate(
    gov207_api, gov207_store, assignment_provider
) -> None:
    state = _init_governor(gov207_store)
    wrapped = _facade(
        governor_api=gov207_api,
        provider=assignment_provider,
        fingerprint=assignment_provider.projection_fingerprint,
    ).invoke_governor(
        "inspect_context", _governor_request(), topology_binding=_topology_binding(state)
    )
    schema_root = ROOT / "schemas/gov-211"
    organization_schema = json.loads(
        (schema_root / "menu-organization.schema.json").read_text(encoding="utf-8")
    )
    response_schema = json.loads(
        (schema_root / "assignment-aware-response.schema.json").read_text(encoding="utf-8")
    )
    resolver = jsonschema.RefResolver.from_schema(
        response_schema,
        store={
            "menu-organization.schema.json": organization_schema,
            organization_schema["$id"]: organization_schema,
        },
    )
    jsonschema.Draft202012Validator(response_schema, resolver=resolver).validate(wrapped)
    query_schema = json.loads(
        (schema_root / "assignment-query-result.schema.json").read_text(encoding="utf-8")
    )
    jsonschema.Draft202012Validator(query_schema).validate(
        assignment_provider("skills_for_topology_target", {"scaleStateId": 1453})
    )
    mixed = copy.deepcopy(
        assignment_provider("skills_for_topology_target", {"scaleStateId": 1453})
    )
    mixed["rows"][0]["positionId"] = "C2"
    with pytest.raises(jsonschema.ValidationError):
        jsonschema.Draft202012Validator(query_schema).validate(mixed)
    loose_parameters = copy.deepcopy(
        assignment_provider("skills_for_topology_target", {"scaleStateId": 1453})
    )
    loose_parameters["parameters"]["positionId"] = "C2"
    with pytest.raises(jsonschema.ValidationError):
        jsonschema.Draft202012Validator(query_schema).validate(loose_parameters)


def test_rehashed_tampering_is_rejected(
    gov207_api, gov207_store, assignment_provider
) -> None:
    state = _init_governor(gov207_store)
    wrapped = _facade(
        governor_api=gov207_api,
        provider=assignment_provider,
        fingerprint=assignment_provider.projection_fingerprint,
    ).invoke_governor(
        "inspect_context", _governor_request(), topology_binding=_topology_binding(state)
    )
    tampered = copy.deepcopy(wrapped)
    tampered["organization"]["moveSetChanged"] = True
    organization_core = {
        key: value
        for key, value in tampered["organization"].items()
        if key != "organizationFingerprint"
    }
    tampered["organization"]["organizationFingerprint"] = sha256_payload(
        organization_core
    )
    response_core = {
        key: value for key, value in tampered.items() if key != "resultFingerprint"
    }
    tampered["resultFingerprint"] = sha256_payload(response_core)
    assert not verify_assignment_aware_response(tampered)

    bad_base = copy.deepcopy(wrapped)
    bad_base["baseOutput"]["resultFingerprint"] = "0" * 64
    response_core = {
        key: value for key, value in bad_base.items() if key != "resultFingerprint"
    }
    bad_base["resultFingerprint"] = sha256_payload(response_core)
    assert not verify_assignment_aware_response(bad_base)


def test_forged_binding_and_basis_kind_fall_back(
    gov207_api, gov207_store, assignment_provider
) -> None:
    state = _init_governor(gov207_store)
    valid = _topology_binding(state)
    forged = TrustedTopologyTargetBinding(
        scale_state_id=valid.scale_state_id,
        task_id=valid.task_id,
        revision=valid.revision,
        state_sha256=valid.state_sha256,
        ledger_head_sha256=valid.ledger_head_sha256,
        policy_fingerprint=valid.policy_fingerprint,
        context_fingerprint=valid.context_fingerprint,
        authentication_tag="f" * 64,
    )
    facade = _facade(
        governor_api=gov207_api,
        provider=assignment_provider,
        fingerprint=assignment_provider.projection_fingerprint,
    )
    forged_output = facade.invoke_governor(
        "inspect_context", _governor_request(), topology_binding=forged
    )
    assert (
        forged_output["organization"]["reasonCode"]
        == "topology_target_binding_unauthenticated"
    )

    def wrong_basis_provider(query_id, parameters):
        result = copy.deepcopy(assignment_provider(query_id, parameters))
        result["rows"][0]["basisKind"] = "mutation_application_target"
        core = {key: value for key, value in result.items() if key != "resultFingerprint"}
        result["resultFingerprint"] = sha256_payload(core)
        return result

    wrong_basis = _facade(
        governor_api=gov207_api,
        provider=wrong_basis_provider,
        fingerprint=assignment_provider.projection_fingerprint,
    ).invoke_governor(
        "inspect_context", _governor_request(), topology_binding=valid
    )
    assert wrong_basis["organization"]["reasonCode"] == "assignment_query_failed"


def test_binding_and_constructor_contracts_reject_untrusted_inputs() -> None:
    with pytest.raises(AssignmentMenuError, match="topology_target_binding_id_invalid"):
        TrustedTopologyTargetBinding.issue(
            1452,
            task_id=TASK_ID,
            revision=0,
            state_sha256="a" * 64,
            ledger_head_sha256="b" * 64,
            policy_fingerprint="c" * 64,
            context_fingerprint="d" * 64,
            authentication_key=TOPOLOGY_BINDING_KEY,
        )
    with pytest.raises(AssignmentMenuError, match="topology_target_binding_source_mismatch"):
        TrustedTopologyTargetBinding(
            scale_state_id=1453,
            task_id=TASK_ID,
            revision=0,
            state_sha256="a" * 64,
            ledger_head_sha256="b" * 64,
            policy_fingerprint="c" * 64,
            context_fingerprint="d" * 64,
            authentication_tag="e" * 64,
            source_sha256="f" * 64,
        )
    with pytest.raises(AssignmentMenuError, match="base_facade_required"):
        AssignmentAwareFacade()
    with pytest.raises(AssignmentMenuError, match="assignment_projection_fingerprint_invalid"):
        AssignmentAwareFacade(governor_api=object(), assignment_provider=lambda *_: {})
