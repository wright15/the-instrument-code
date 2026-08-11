"""CRT-307 Court facade acceptance tests and deterministic trace runner."""

from __future__ import annotations

import json
from pathlib import Path
import time

import pytest

import governor.court_agent_api as facade_module
from governor.court_agent_api import (
    COURT_AGENT_TOOL_ID,
    CONTEXT_READ_CAPABILITY,
    FILTER_PROJECT_CAPABILITY,
    GRAPH_READ_NAMED_CAPABILITY,
    INSPECT_COURT_STATE,
    LEDGER_REPLAY_CAPABILITY,
    LIST_LEGAL_COURT_MOVES,
    MAX_REQUEST_BYTES,
    MOVE_EXECUTE_CAPABILITY,
    MOVE_VALIDATE_CAPABILITY,
    MOVES_READ_CAPABILITY,
    OUTCOME_READ_CAPABILITY,
    POSTCONDITION_VERIFY_CAPABILITY,
    PROJECT_THROUGH_COURT,
    VALIDATE_EXECUTE_COURT_TRANSITION,
    VERIFY_COURT_POSTCONDITION,
    CourtAgentApi,
    CourtAgentApiError,
    TrustedTranslocationBinding,
)
from governor.court_runtime import (
    create_court_route_context,
    create_court_runtime_state,
    create_topological_translocation_record,
    list_legal_court_moves as production_list_moves,
    load_court_runtime_policy,
    replay_court_runtime_ledger,
)
from governor.court_session_store import CourtSessionStore
from governor.evidence import VerificationDecision
from governor.hashing import canonical_json_bytes, sha256_payload


PROFILE = "1" * 64
CONTEXT = "2" * 64
EVIDENCE = "3" * 64
TRACE_DIR = Path(__file__).parent / "crt_307" / "traces"
INPUT_SCHEMAS = {
    INSPECT_COURT_STATE: "crt-307.inspect-court-state.input.v1",
    LIST_LEGAL_COURT_MOVES: "crt-307.list-legal-court-moves.input.v1",
    VALIDATE_EXECUTE_COURT_TRANSITION:
        "crt-307.validate-execute-court-transition.input.v1",
    PROJECT_THROUGH_COURT: "crt-307.project-through-court.input.v1",
    VERIFY_COURT_POSTCONDITION: "crt-307.verify-court-postcondition.input.v1",
}
ALL_GRANTS = frozenset((
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
))


def verified(_state, _move):
    return VerificationDecision(True, (), (EVIDENCE,))


def make_session(tmp_path, session="crt307", position="C0", capabilities=None):
    policy = load_court_runtime_policy()
    state = create_court_runtime_state(
        session_id=session,
        position_id=position,
        harmonic_profile_sha256=PROFILE,
        context_fingerprint=CONTEXT,
        capabilities=capabilities or ("court.transition", "court.translocate"),
        policy=policy,
    )
    store = CourtSessionStore(tmp_path / session)
    store.create(state)
    return store, state


def api_for(store, **kwargs):
    return CourtAgentApi(
        store=store,
        host_grants=kwargs.pop("host_grants", ALL_GRANTS),
        verification_provider=kwargs.pop("verification_provider", verified),
        **kwargs,
    )


def request(operation, request_id, session, **fields):
    return {
        "schemaVersion": INPUT_SCHEMAS[operation],
        "requestId": request_id,
        "sessionId": session,
        **fields,
    }


def expected(state):
    return {
        "revision": state.revision,
        "stateSha256": state.state_sha256,
        "ledgerHeadSha256": state.ledger_anchor.head_sha256,
        "policyFingerprint": state.policy_fingerprint,
        "contextFingerprint": state.context_fingerprint,
    }


def list_request(state, request_id="req:list"):
    return request(
        LIST_LEGAL_COURT_MOVES,
        request_id,
        state.session_id,
        expectedStateSha256=state.state_sha256,
        expectedLedgerHeadSha256=state.ledger_anchor.head_sha256,
    )


def selected(move):
    return {
        "operationId": move["operationId"],
        "targetPosition": move["targetPosition"],
        "moveHash": move["moveHash"],
        "translocationHash": move["translocationHash"],
    }


def execute(api, state, move, request_id="req:execute"):
    return api.invoke(
        VALIDATE_EXECUTE_COURT_TRANSITION,
        request(
            VALIDATE_EXECUTE_COURT_TRANSITION,
            request_id,
            state.session_id,
            selectedMove=selected(move),
            expected=expected(state),
        ),
    )


def recursively_find_keys(value, fragments):
    found = []
    if isinstance(value, dict):
        for key, item in value.items():
            if any(fragment in key.lower() for fragment in fragments):
                found.append(key)
            found.extend(recursively_find_keys(item, fragments))
    elif isinstance(value, list):
        for item in value:
            found.extend(recursively_find_keys(item, fragments))
    return found


@pytest.mark.parametrize(
    ("position", "move_count", "kappa"),
    [
        ("C0", 1, {"numerator": 0, "denominator": 1}),
        ("C1", 2, {"numerator": 1, "denominator": 4}),
        ("C2", 2, {"numerator": 1, "denominator": 2}),
        ("C3", 2, {"numerator": 3, "denominator": 4}),
        ("C4", 1, {"numerator": 1, "denominator": 1}),
    ],
)
def test_all_ordinary_menus_are_position_and_kappa_scoped(
    tmp_path, position, move_count, kappa
):
    store, state = make_session(tmp_path, f"menu-{position}", position)
    output = api_for(store).invoke(
        INSPECT_COURT_STATE,
        request(INSPECT_COURT_STATE, f"req:{position}", state.session_id),
    )
    assert output["status"] == "ok"
    assert output["state"]["kappaCourt"] == kappa
    assert output["menu"]["positionId"] == position
    assert output["menu"]["kappaCourt"] == kappa
    assert len(output["menu"]["moves"]) == move_count
    assert output["menu"]["executorExposed"] is True
    assert output["menu"]["skills"] == sorted(output["menu"]["skills"])
    assert output["menu"]["namedQueries"] == sorted(output["menu"]["namedQueries"])
    menu_core = dict(output["menu"])
    fingerprint = menu_core.pop("menuFingerprint")
    assert fingerprint == sha256_payload(menu_core)


def test_inspection_is_redacted_and_explicit_replay_is_called(tmp_path, monkeypatch):
    store, state = make_session(tmp_path)
    calls = 0
    original = facade_module.replay_court_runtime_ledger

    def recording_replay(*args, **kwargs):
        nonlocal calls
        calls += 1
        return original(*args, **kwargs)

    monkeypatch.setattr(facade_module, "replay_court_runtime_ledger", recording_replay)
    output = api_for(store).invoke(
        INSPECT_COURT_STATE,
        request(INSPECT_COURT_STATE, "req:inspect", state.session_id),
    )
    assert calls == 1
    assert output["state"] == {
        "sessionId": state.session_id,
        "positionId": "C0",
        "revision": 0,
        "stateSha256": state.state_sha256,
        "ledgerHeadSha256": state.ledger_anchor.head_sha256,
        "eventCount": 0,
        "policyFingerprint": state.policy_fingerprint,
        "contextFingerprint": state.context_fingerprint,
        "harmonicProfileSha256": PROFILE,
        "pitchMask": 661,
        "poleVector": "0000",
        "internalPoles": [],
        "kappaCourt": {"numerator": 0, "denominator": 1},
        "snapshotHash": output["state"]["snapshotHash"],
    }
    assert recursively_find_keys(output, ("token", "provider", "cypher", "shell", "path", "deadline")) == []


def test_capabilities_intersect_state_host_and_facade_closure(tmp_path):
    store, state = make_session(tmp_path)
    denied = api_for(store, host_grants={"court.transition"}).invoke(
        INSPECT_COURT_STATE,
        request(INSPECT_COURT_STATE, "req:denied", state.session_id),
    )
    assert (denied["status"], denied["reasonCode"]) == ("denied", "capability_denied")

    read_only = api_for(
        store,
        host_grants={LEDGER_REPLAY_CAPABILITY, MOVES_READ_CAPABILITY},
    )
    listed = read_only.invoke(LIST_LEGAL_COURT_MOVES, list_request(state))
    assert listed["moves"] == []
    assert listed["menu"]["executorExposed"] is False


def test_published_operation_grants_are_accepted(tmp_path):
    grants = {
        row["skillId"]: frozenset(row["capabilities"])
        for row in json.loads(
            (Path(__file__).parents[1] / "skills" / "court" / "capabilities.json")
            .read_text(encoding="utf-8")
        )["grants"]
    }
    store, state = make_session(tmp_path)
    assert api_for(
        store, host_grants=grants[INSPECT_COURT_STATE]
    ).invoke(
        INSPECT_COURT_STATE,
        request(INSPECT_COURT_STATE, "req:published:inspect", state.session_id),
    )["status"] == "ok"
    assert api_for(
        store, host_grants=grants[LIST_LEGAL_COURT_MOVES]
    ).invoke(
        LIST_LEGAL_COURT_MOVES, list_request(state, "req:published:list")
    )["status"] == "ok"
    assert api_for(
        store, host_grants=grants[PROJECT_THROUGH_COURT]
    ).invoke(
        PROJECT_THROUGH_COURT,
        request(
            PROJECT_THROUGH_COURT,
            "req:published:project",
            state.session_id,
            expectedStateSha256=state.state_sha256,
            expectedLedgerHeadSha256=state.ledger_anchor.head_sha256,
            sourceMask=0,
            mutationOperatorId="M",
        ),
    )["status"] == "ok"

    all_api = api_for(store)
    move = all_api.invoke(LIST_LEGAL_COURT_MOVES, list_request(state))["moves"][0]
    execute_grants = grants[VALIDATE_EXECUTE_COURT_TRANSITION] | {
        "court.transition"
    }
    committed = execute(
        api_for(store, host_grants=execute_grants), state, move, "req:published:execute"
    )
    assert committed["status"] == "verified"
    current = store.load(state.session_id)[1]
    verify_grants = grants[VERIFY_COURT_POSTCONDITION]
    verified_output = api_for(store, host_grants=verify_grants).invoke(
        VERIFY_COURT_POSTCONDITION,
        request(
            VERIFY_COURT_POSTCONDITION,
            "req:published:verify",
            state.session_id,
            eventId=committed["transition"]["eventId"],
            expectedStateSha256=current.state_sha256,
            expectedLedgerHeadSha256=current.ledger_anchor.head_sha256,
        ),
    )
    assert verified_output["status"] == "verified"


@pytest.mark.parametrize(
    "missing",
    [
        LEDGER_REPLAY_CAPABILITY,
        MOVE_VALIDATE_CAPABILITY,
        MOVE_EXECUTE_CAPABILITY,
        POSTCONDITION_VERIFY_CAPABILITY,
    ],
)
def test_each_missing_execute_base_grant_replays_then_denies_before_validation(
    tmp_path, monkeypatch, missing
):
    store, state = make_session(tmp_path, f"missing-{missing}")
    move = api_for(store).invoke(
        LIST_LEGAL_COURT_MOVES, list_request(state)
    )["moves"][0]
    calls = 0
    replay_calls = 0
    original = facade_module.validate_court_move
    original_replay = facade_module.replay_court_runtime_ledger

    def recording_validation(*args, **kwargs):
        nonlocal calls
        calls += 1
        return original(*args, **kwargs)

    def recording_replay(*args, **kwargs):
        nonlocal replay_calls
        replay_calls += 1
        return original_replay(*args, **kwargs)

    monkeypatch.setattr(facade_module, "validate_court_move", recording_validation)
    monkeypatch.setattr(
        facade_module, "replay_court_runtime_ledger", recording_replay
    )
    grants = set(ALL_GRANTS)
    grants.remove(missing)
    output = execute(api_for(store, host_grants=grants), state, move)
    assert (output["status"], output["reasonCode"]) == (
        "denied", "capability_denied"
    )
    assert calls == 0
    assert replay_calls == 1
    assert store.load(state.session_id)[1] == state


def test_missing_operation_derived_dynamic_grant_cannot_commit(tmp_path, monkeypatch):
    store, state = make_session(tmp_path, "missing-dynamic")
    move = api_for(store).invoke(
        LIST_LEGAL_COURT_MOVES, list_request(state)
    )["moves"][0]
    calls = 0
    original = facade_module.validate_court_move

    def recording_validation(*args, **kwargs):
        nonlocal calls
        calls += 1
        return original(*args, **kwargs)

    monkeypatch.setattr(facade_module, "validate_court_move", recording_validation)
    grants = set(ALL_GRANTS)
    grants.remove("court.transition")
    output = execute(api_for(store, host_grants=grants), state, move)
    assert (output["status"], output["reasonCode"]) == (
        "denied", "capability_denied"
    )
    assert calls == 0
    assert store.load(state.session_id)[1] == state


@pytest.mark.parametrize(
    ("field", "value", "reason"),
    [
        ("revision", 1, "stale_revision"),
        ("stateSha256", "4" * 64, "stale_state"),
        ("ledgerHeadSha256", "4" * 64, "stale_ledger"),
        ("policyFingerprint", "4" * 64, "policy_fingerprint_mismatch"),
        ("contextFingerprint", "4" * 64, "context_fingerprint_mismatch"),
    ],
)
def test_execute_rejects_all_stale_bindings(tmp_path, field, value, reason):
    store, state = make_session(tmp_path, f"stale-{field}")
    api = api_for(store)
    move = api.invoke(LIST_LEGAL_COURT_MOVES, list_request(state))["moves"][0]
    bound = expected(state)
    bound[field] = value
    output = api.invoke(
        VALIDATE_EXECUTE_COURT_TRANSITION,
        request(
            VALIDATE_EXECUTE_COURT_TRANSITION,
            "req:stale",
            state.session_id,
            selectedMove=selected(move),
            expected=bound,
        ),
    )
    assert output["status"] == "reinspect"
    assert output["reasonCode"] == reason
    assert store.load(state.session_id)[1] == state


def test_stale_list_and_move_hash_are_structured(tmp_path):
    store, state = make_session(tmp_path)
    api = api_for(store)
    stale = list_request(state)
    stale["expectedLedgerHeadSha256"] = "4" * 64
    output = api.invoke(LIST_LEGAL_COURT_MOVES, stale)
    assert output["status"] == "reinspect"
    assert output["moves"] == []
    move = api.invoke(LIST_LEGAL_COURT_MOVES, list_request(state))["moves"][0]
    choice = selected(move)
    choice["moveHash"] = "4" * 64
    output = api.invoke(
        VALIDATE_EXECUTE_COURT_TRANSITION,
        request(
            VALIDATE_EXECUTE_COURT_TRANSITION,
            "req:hash",
            state.session_id,
            selectedMove=choice,
            expected=expected(state),
        ),
    )
    assert (output["status"], output["reasonCode"]) == ("rejected", "move_hash_mismatch")


def test_no_verifier_and_malformed_verifier_never_commit(tmp_path):
    store, state = make_session(tmp_path)
    without = api_for(store, verification_provider=None)
    move = without.invoke(LIST_LEGAL_COURT_MOVES, list_request(state))["moves"][0]
    output = execute(without, state, move)
    assert output["reasonCode"] == "verification_provider_unavailable"
    assert output["menu"]["executorExposed"] is False
    malformed = api_for(store, verification_provider=lambda _state, _move: {"passed": True})
    move = malformed.invoke(LIST_LEGAL_COURT_MOVES, list_request(state))["moves"][0]
    output = execute(malformed, state, move)
    assert output["reasonCode"] == "verification_decision_invalid"
    assert store.load(state.session_id)[1] == state


def test_adjacent_commit_and_replay_only_postcondition_verification(tmp_path):
    store, state = make_session(tmp_path)
    provider_calls = 0

    def provider(_state, _move):
        nonlocal provider_calls
        provider_calls += 1
        return VerificationDecision(True, (), (EVIDENCE,))

    api = api_for(store, verification_provider=provider)
    move = api.invoke(LIST_LEGAL_COURT_MOVES, list_request(state))["moves"][0]
    output = execute(api, state, move)
    assert output["status"] == "verified"
    assert output["stateAfter"]["positionId"] == "C1"
    assert output["ledgerDelta"] == {"persisted": True, "eventsAppended": 1}
    assert provider_calls == 1
    assert recursively_find_keys(
        output, ("token", "provider", "cypher", "shell", "path", "deadline")
    ) == []
    _, committed, events = store.load(state.session_id)
    replay = replay_court_runtime_ledger(state, events, committed.ledger_anchor)
    assert replay.valid and replay.state == committed
    verify = api.invoke(
        VERIFY_COURT_POSTCONDITION,
        request(
            VERIFY_COURT_POSTCONDITION,
            "req:verify",
            state.session_id,
            eventId=output["transition"]["eventId"],
            expectedStateSha256=committed.state_sha256,
            expectedLedgerHeadSha256=committed.ledger_anchor.head_sha256,
        ),
    )
    assert provider_calls == 1
    assert verify["claim"] == {
        "mayDeclareSuccess": True,
        "claimCode": "verified_recorded_court_postcondition",
    }
    assert all(verify["postcondition"]["checks"].values())


def test_trusted_translocation_commits_but_untrusted_jump_does_not(tmp_path):
    record = create_topological_translocation_record(
        source_position="C0", target_position="C4", operator_id="R7"
    )
    route = create_court_route_context(
        forte_family="5-23", operator_id="R7", source_scale_state_id=1453
    )
    store, state = make_session(tmp_path)
    plain = api_for(store)
    invalid = plain.invoke(
        VALIDATE_EXECUTE_COURT_TRANSITION,
        request(
            VALIDATE_EXECUTE_COURT_TRANSITION,
            "req:no-record",
            state.session_id,
            selectedMove={
                "operationId": "court:translocate",
                "targetPosition": "C4",
                "moveHash": "4" * 64,
                "translocationHash": None,
            },
            expected=expected(state),
        ),
    )
    assert invalid["reasonCode"] == "non_adjacent_without_translocation"
    trusted = api_for(
        store,
        translocation_bindings={
            record.record_hash: TrustedTranslocationBinding(record, route)
        },
    )
    moves = trusted.invoke(LIST_LEGAL_COURT_MOVES, list_request(state))["moves"]
    jump = next(move for move in moves if move["operationId"] == "court:translocate")
    assert jump["translocationHash"] == record.record_hash
    output = execute(trusted, state, jump, "req:translocation")
    assert output["status"] == "verified"
    assert output["stateAfter"]["positionId"] == "C4"
    assert recursively_find_keys(output, ("translocationrecord", "routerecord")) == []


def test_repetition_guard_replans_then_stops_without_more_provider_calls(tmp_path):
    store, state = make_session(tmp_path)
    calls = 0

    def malformed(_state, _move):
        nonlocal calls
        calls += 1
        return "VERIFIED"

    api = api_for(store, verification_provider=malformed)
    move = api.invoke(LIST_LEGAL_COURT_MOVES, list_request(state))["moves"][0]
    first = execute(api, state, move, "req:repeat:1")
    second = execute(api, state, move, "req:repeat:2")
    third = execute(api, state, move, "req:repeat:3")
    fourth = execute(api, state, move, "req:repeat:4")
    assert (first["status"], first["reasonCode"]) == (
        "rejected", "verification_decision_invalid"
    )
    assert (second["status"], second["reasonCode"]) == (
        "replan", "repetition_limit_reached"
    )
    assert second["directive"]["action"] == "replan"
    assert (third["status"], third["reasonCode"]) == (
        "stopped", "retry_exhausted"
    )
    assert third["directive"]["action"] == "stop"
    assert (fourth["status"], fourth["reasonCode"]) == (
        "stopped", "retry_exhausted"
    )
    assert second["menu"]["executorExposed"] is False
    assert third["menu"]["executorExposed"] is False
    assert calls == 1
    assert len(api._attempt_history[state.session_id]) == 2
    assert store.load(state.session_id)[1] == state


def test_projection_is_exact_and_cannot_mutate_runtime(tmp_path):
    store, state = make_session(tmp_path)
    api = api_for(store)
    output = api.invoke(
        PROJECT_THROUGH_COURT,
        request(
            PROJECT_THROUGH_COURT,
            "req:project",
            state.session_id,
            expectedStateSha256=state.state_sha256,
            expectedLedgerHeadSha256=state.ledger_anchor.head_sha256,
            sourceMask=1453,
            mutationOperatorId="R7",
        ),
    )
    projection = output["projection"]
    assert output["status"] == "ok"
    assert projection["outputMask"] == 133
    assert projection["outputVector12"] == "000010000101"
    assert projection["weights"] == {"source": 7, "retained": 3}
    assert projection["exactBitReduction"] == 4
    assert projection["routeSemantics"] == {
        "mutationOperatorId": "R7",
        "classification": "right_undefined",
        "leftResultMask": 133,
        "rightResultMask": None,
        "leftUndefinedReason": None,
        "rightUndefinedReason": "mutation_domain_not_rooted_weight_seven",
    }
    assert projection["runtimeUnchanged"] is True
    assert output["stateBefore"] == output["stateAfter"]
    assert store.load(state.session_id)[1] == state


@pytest.mark.parametrize("source_mask", [0, 4095])
def test_projection_accepts_full_ambient_domain(tmp_path, source_mask):
    store, state = make_session(tmp_path, f"ambient-{source_mask}")
    output = api_for(store).invoke(
        PROJECT_THROUGH_COURT,
        request(
            PROJECT_THROUGH_COURT,
            "req:ambient",
            state.session_id,
            expectedStateSha256=state.state_sha256,
            expectedLedgerHeadSha256=state.ledger_anchor.head_sha256,
            sourceMask=source_mask,
            mutationOperatorId="M",
        ),
    )
    assert output["status"] == "ok"


@pytest.mark.parametrize("mode", ["absent", "failure"])
def test_graph_absence_and_failure_are_authority_neutral(tmp_path, mode):
    store, state = make_session(tmp_path, f"graph-{mode}")
    provider = None
    if mode == "failure":
        def provider(_query_id, _parameters):
            raise RuntimeError("offline")
    api = api_for(store, graph_provider=provider)
    output = api.invoke(
        INSPECT_COURT_STATE,
        request(
            INSPECT_COURT_STATE,
            "req:graph",
            state.session_id,
            includeGraphContext=True,
        ),
    )
    assert output["status"] == "ok"
    assert output["replay"]["valid"] is True
    assert output["graph"]["status"] == (
        "unavailable" if mode == "absent" else "failed"
    )
    assert output["graph"]["authoritative"] is False
    assert len(output["menu"]["moves"]) == 1


def test_graph_queries_are_allow_listed_normalized_and_redacted(tmp_path):
    store, state = make_session(tmp_path)
    calls = []

    def graph(query_id, parameters):
        calls.append((query_id, dict(parameters)))
        return [{"tokenId": "private", "providerIdentity": "private"}]

    output = api_for(store, graph_provider=graph).invoke(
        INSPECT_COURT_STATE,
        request(
            INSPECT_COURT_STATE,
            "req:graph-ok",
            state.session_id,
            includeGraphContext=True,
            eventLimit=7,
        ),
    )
    assert calls == [
        ("court_runtime_state_for_session", {"sessionId": state.session_id}),
        ("court_verified_events_for_session", {"sessionId": state.session_id, "limit": 7}),
    ]
    assert output["graph"]["status"] == "ok"
    assert recursively_find_keys(output, ("token", "provideridentity")) == []


def test_graph_total_row_bytes_and_elapsed_budget_fail_neutrally(
    tmp_path, monkeypatch
):
    store, state = make_session(tmp_path)
    oversized = api_for(
        store,
        graph_provider=lambda _query_id, _parameters: [{"value": "x" * 262144}],
    ).invoke(
        INSPECT_COURT_STATE,
        request(
            INSPECT_COURT_STATE,
            "req:graph-oversized",
            state.session_id,
            includeGraphContext=True,
        ),
    )
    assert (oversized["status"], oversized["graph"]["status"]) == ("ok", "failed")
    assert oversized["graph"]["reasonCode"] == "graph_query_failed"

    ticks = iter((10.0, 11.001))
    monkeypatch.setattr(facade_module, "monotonic", lambda: next(ticks))
    slow = api_for(store, graph_provider=lambda _query_id, _parameters: []).invoke(
        INSPECT_COURT_STATE,
        request(
            INSPECT_COURT_STATE,
            "req:graph-slow",
            state.session_id,
            includeGraphContext=True,
        ),
    )
    assert (slow["status"], slow["graph"]["status"]) == ("ok", "failed")
    assert slow["graph"]["reasonCode"] == "graph_query_failed"

    monkeypatch.setattr(facade_module, "monotonic", time.monotonic)
    monkeypatch.setattr(facade_module, "MAX_GRAPH_ELAPSED_MS", 10)
    timed_out = api_for(
        store,
        graph_provider=lambda _query_id, _parameters: (time.sleep(0.05), [])[1],
    ).invoke(
        INSPECT_COURT_STATE,
        request(
            INSPECT_COURT_STATE,
            "req:graph-timeout",
            state.session_id,
            includeGraphContext=True,
        ),
    )
    assert (timed_out["status"], timed_out["graph"]["status"]) == (
        "ok", "failed"
    )


def test_projection_graph_query_requires_trusted_application_id(tmp_path):
    store, state = make_session(tmp_path)
    calls = []

    def graph(query_id, parameters):
        calls.append((query_id, dict(parameters)))
        return []

    api = api_for(
        store,
        graph_provider=graph,
        filter_application_ids={"C0": "filter-application:C0:1453"},
    )
    output = api.invoke(
        PROJECT_THROUGH_COURT,
        request(
            PROJECT_THROUGH_COURT,
            "req:project-graph",
            state.session_id,
            expectedStateSha256=state.state_sha256,
            expectedLedgerHeadSha256=state.ledger_anchor.head_sha256,
            sourceMask=1453,
            mutationOperatorId="R7",
        ),
    )
    assert calls == [
        (
            "court_filter_commutation_outputs",
            {"applicationId": "filter-application:C0:1453"},
        )
    ]
    assert output["graph"]["status"] == "ok"
    assert output["projection"]["runtimeUnchanged"] is True


def test_strict_unknown_properties_and_primitive_types(tmp_path):
    store, state = make_session(tmp_path)
    api = api_for(store)
    with pytest.raises(CourtAgentApiError, match="request_properties_invalid"):
        api.invoke(
            INSPECT_COURT_STATE,
            request(
                INSPECT_COURT_STATE,
                "req:unknown",
                state.session_id,
                unknown=True,
            ),
        )
    move = api.invoke(LIST_LEGAL_COURT_MOVES, list_request(state))["moves"][0]
    choice = selected(move)
    choice["targetPositionAuthoredByModel"] = "C4"
    with pytest.raises(CourtAgentApiError, match="selected_move_properties_invalid"):
        api.invoke(
            VALIDATE_EXECUTE_COURT_TRANSITION,
            request(
                VALIDATE_EXECUTE_COURT_TRANSITION,
                "req:nested",
                state.session_id,
                selectedMove=choice,
                expected=expected(state),
            ),
        )
    with pytest.raises(CourtAgentApiError, match="source_mask_invalid"):
        api.invoke(
            PROJECT_THROUGH_COURT,
            request(
                PROJECT_THROUGH_COURT,
                "req:bool",
                state.session_id,
                expectedStateSha256=state.state_sha256,
                expectedLedgerHeadSha256=state.ledger_anchor.head_sha256,
                sourceMask=True,
                mutationOperatorId="M",
            ),
        )


def test_canonical_output_and_receipt_seals_and_limits(tmp_path, monkeypatch):
    store, state = make_session(tmp_path)
    api = api_for(store)
    output = api.invoke(
        INSPECT_COURT_STATE,
        request(INSPECT_COURT_STATE, "req:seal", state.session_id),
    )
    output_core = dict(output)
    result_fingerprint = output_core.pop("resultFingerprint")
    assert result_fingerprint == sha256_payload(output_core)
    receipt = output["toolReceipts"][0]
    receipt_core = dict(receipt)
    receipt_fingerprint = receipt_core.pop("resultFingerprint")
    assert receipt_fingerprint == sha256_payload(receipt_core)
    assert receipt["toolId"] == COURT_AGENT_TOOL_ID
    assert len(canonical_json_bytes(output)) < 1048576
    too_large = "{" + " " * MAX_REQUEST_BYTES + "}"
    with pytest.raises(CourtAgentApiError, match="request_too_large"):
        api.invoke_json(INSPECT_COURT_STATE, too_large)
    monkeypatch.setattr(facade_module, "MAX_RESPONSE_BYTES", 1)
    with pytest.raises(CourtAgentApiError, match="response_too_large"):
        api.invoke(
            INSPECT_COURT_STATE,
            request(INSPECT_COURT_STATE, "req:response-limit", state.session_id),
        )


def test_fresh_facades_produce_identical_inspection_records(tmp_path):
    outputs = []
    for root in (tmp_path / "a", tmp_path / "b"):
        store, state = make_session(root, "deterministic", "C3")
        outputs.append(
            api_for(store).invoke(
                INSPECT_COURT_STATE,
                request(INSPECT_COURT_STATE, "req:deterministic", state.session_id),
            )
        )
    assert outputs[0] == outputs[1]


def test_crt305_legal_move_hash_and_noncanonical_guards_are_preserved(tmp_path):
    store, state = make_session(tmp_path)
    api = api_for(store)
    facade_moves = api.invoke(LIST_LEGAL_COURT_MOVES, list_request(state))["moves"]
    runtime_moves = production_list_moves(state, load_court_runtime_policy())
    assert [move["moveHash"] for move in facade_moves] == [
        move.move_hash for move in runtime_moves
    ]
    choice = selected(facade_moves[0])
    choice["targetPosition"] = "C5"
    output = api.invoke(
        VALIDATE_EXECUTE_COURT_TRANSITION,
        request(
            VALIDATE_EXECUTE_COURT_TRANSITION,
            "req:off-chain",
            state.session_id,
            selectedMove=choice,
            expected=expected(state),
        ),
    )
    assert output["reasonCode"] == "court_position_not_canonical"
    assert store.load(state.session_id)[1] == state


def trace_files():
    return sorted(TRACE_DIR.glob("*.json"))


def run_trace(path, tmp_path):
    trace = json.loads(path.read_text(encoding="utf-8"))
    setup = trace["setup"]
    session = trace["traceId"]
    store, state = make_session(tmp_path, session, setup.get("position", "C0"))
    record = route = None
    bindings = None
    if setup.get("trustedTranslocation"):
        record = create_topological_translocation_record(
            source_position="C0", target_position="C4", operator_id="R7"
        )
        route = create_court_route_context(
            forte_family="5-23", operator_id="R7", source_scale_state_id=1453
        )
        bindings = {record.record_hash: TrustedTranslocationBinding(record, route)}
    provider_mode = setup.get("verificationProvider", "verified")
    if provider_mode == "malformed":
        verifier = lambda _state, _move: "VERIFIED"
    elif provider_mode == "absent":
        verifier = None
    else:
        verifier = verified
    graph = None
    if setup.get("graph") == "available":
        graph = lambda _query_id, _parameters: []
    api = CourtAgentApi(
        store=store,
        host_grants=ALL_GRANTS,
        verification_provider=verifier,
        graph_provider=graph,
        translocation_bindings=bindings,
    )
    context = {"lastMove": None, "eventId": None}
    for index, step in enumerate(trace["steps"], 1):
        loaded = store.load(session)
        assert loaded is not None
        state = loaded[1]
        operation = step["operation"]
        if operation == INSPECT_COURT_STATE:
            body = request(
                operation,
                f"req:{session}:{index}",
                session,
                **step.get("request", {}),
            )
        elif operation == LIST_LEGAL_COURT_MOVES:
            body = list_request(state, f"req:{session}:{index}")
        elif operation == PROJECT_THROUGH_COURT:
            body = request(
                operation,
                f"req:{session}:{index}",
                session,
                expectedStateSha256=state.state_sha256,
                expectedLedgerHeadSha256=state.ledger_anchor.head_sha256,
                **step["request"],
            )
        elif operation == VALIDATE_EXECUTE_COURT_TRANSITION:
            if step.get("selection") == "listed_translocation":
                listed = api.invoke(LIST_LEGAL_COURT_MOVES, list_request(state))
                move = next(item for item in listed["moves"] if item["operationId"] == "court:translocate")
                choice = selected(move)
            elif step.get("selection") == "listed_adjacent":
                listed = api.invoke(LIST_LEGAL_COURT_MOVES, list_request(state))
                choice = selected(listed["moves"][0])
            else:
                choice = step["selectedMove"]
            body = request(
                operation,
                f"req:{session}:{index}",
                session,
                selectedMove=choice,
                expected=expected(state),
            )
        else:
            raise AssertionError(operation)
        output = api.invoke(operation, body)
        assert output["status"] == step["expect"]["status"]
        assert output["reasonCode"] == step["expect"]["reasonCode"]
        if "directive" in step["expect"]:
            assert output["directive"]["action"] == step["expect"]["directive"]
        if "positionAfter" in step["expect"]:
            assert output["stateAfter"]["positionId"] == step["expect"]["positionAfter"]
        if "graphStatus" in step["expect"]:
            assert output["graph"]["status"] == step["expect"]["graphStatus"]
        if "outputMask" in step["expect"]:
            assert output["projection"]["outputMask"] == step["expect"]["outputMask"]
    loaded = store.load(session)
    assert loaded is not None
    assert loaded[1].position_id == trace["expectedFinal"]["position"]
    assert loaded[1].ledger_anchor.event_count == trace["expectedFinal"]["eventCount"]


@pytest.mark.parametrize("trace_path", trace_files(), ids=lambda path: path.stem)
def test_deterministic_court_trace(trace_path, tmp_path):
    run_trace(trace_path, tmp_path)


def test_trace_corpus_is_complete_and_machine_neutral():
    paths = trace_files()
    assert [path.name for path in paths] == [
        "accepted-translocation.json",
        "court-state-inspection.json",
        "graph-retrieval.json",
        "invalid-move.json",
        "legal-adjacent-transition.json",
        "no-progress-loop-stop.json",
        "off-chain-rejection.json",
        "read-only-projection.json",
    ]
    for path in paths:
        text = path.read_text(encoding="utf-8")
        assert "/home/" not in text
        assert "timestamp" not in text.lower()
        assert "providerIdentity" not in text
