"""GOV-207 agent API acceptance tests and canonical evaluation traces."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from governor.agent_api import AgentApi, initialize_session
from governor.hashing import sha256_payload
from governor.loop_guards import LoopPolicy
from governor.runtime_store import RuntimeSessionStore
from governor.runtime_models import TransitionError

from conftest import (
    CLASSIFIER_POLICY_FINGERPRINT,
    GOV207_CONTEXT,
    GOV207_HOST_GRANTS,
    GOV207_POLICY,
    build_catalog,
    classification_request,
    classifier_policy,
    free_port,
)


TASK_ID = "task:gov207"
TRACE_DIR = Path(__file__).parent / "gov_207" / "traces"


def _init(api_store, *, phase="INSPECTED", data=None):
    return initialize_session(
        api_store,
        task_id=TASK_ID,
        policy_sha256=GOV207_POLICY,
        context_sha256=GOV207_CONTEXT,
        capabilities=("runtime.context.read", "runtime.start-site"),
        data=data or {"site_verified": False},
        phase=phase,
    )


def _session_state(store):
    loaded = store.load(TASK_ID)
    assert loaded is not None
    return loaded[1]


def _event_kinds(store):
    loaded = store.load(TASK_ID)
    assert loaded is not None
    return tuple(event.payload["event_kind"] for event in loaded[2])


def _state_expected(store):
    state = _session_state(store)
    return {
        "revision": state.revision,
        "stateSha256": state.state_sha256,
        "ledgerHeadSha256": state.ledger_anchor.head_sha256,
        "policyFingerprint": state.policy_sha256,
        "contextFingerprint": state.context_sha256,
    }


def _list_moves(api, store):
    state = _session_state(store)
    return api.invoke(
        "list_legal_moves",
        {
            "schemaVersion": "gov-207.list-legal-moves.input.v1",
            "requestId": "req:list",
            "taskId": TASK_ID,
            "expectedStateSha256": state.state_sha256,
            "expectedLedgerHeadSha256": state.ledger_anchor.head_sha256,
        },
    )


def _move_sha(list_output, operation_id):
    for move in list_output["moves"]:
        if move["operationId"] == operation_id:
            return move["moveSha256"]
    raise AssertionError(f"move not listed: {operation_id}")


def _execute(api, store, operation_id, parameters, request_id="req:exec"):
    listed = _list_moves(api, store)
    assert listed["status"] == "ok"
    return api.invoke(
        "validate_and_execute_move",
        {
            "schemaVersion": "gov-207.validate-execute.input.v1",
            "requestId": request_id,
            "taskId": TASK_ID,
            "selectedMove": {
                "operationId": operation_id,
                "moveSha256": _move_sha(listed, operation_id),
            },
            "parameters": parameters,
            "expected": _state_expected(store),
        },
    )


def _catalog_port(catalog):
    spec = catalog.executors.get_spec("operation:start-site")
    assert spec is not None
    return spec.postconditions[0].request["port"]


def test_inspect_context_reports_state_ledger_graph_and_menu(gov207_api, gov207_store):
    _init(gov207_store)
    output = gov207_api.invoke(
        "inspect_context",
        {
            "schemaVersion": "gov-207.inspect-context.input.v1",
            "requestId": "req:inspect",
            "taskId": TASK_ID,
            "includePriorVerifiedOutcomes": True,
        },
    )
    assert output["status"] == "ok"
    assert output["context"]["state"]["taskId"] == TASK_ID
    assert output["context"]["ledger"]["replayValid"] is True
    assert output["context"]["graph"]["readOnly"] is True
    assert output["context"]["graph"]["available"] is False
    assert output["menu"]["skills"] == [
        "classify_governor",
        "inspect_context",
        "list_legal_moves",
    ]
    assert output["menu"]["executorExposed"] is False
    assert output["directive"] == {
        "action": "continue",
        "reasonCode": "ok",
        "recoveryMoves": [],
        "operatorActionRequired": False,
    }
    receipt = output["toolReceipts"][0]
    assert receipt["toolId"] == "governor.agent_api.invoke"
    assert receipt["status"] == "ok"
    assert len(output["resultFingerprint"]) == 64


def test_inspect_context_missing_session_is_unavailable(gov207_api):
    output = gov207_api.invoke(
        "inspect_context",
        {
            "schemaVersion": "gov-207.inspect-context.input.v1",
            "requestId": "req:inspect-missing",
            "taskId": TASK_ID,
        },
    )
    assert output["status"] == "unavailable"
    assert output["context"]["state"] is None
    assert output["directive"]["action"] == "stop"
    assert output["directive"]["operatorActionRequired"] is True


def test_list_legal_moves_exposes_typed_metadata(gov207_api, gov207_store):
    _init(gov207_store)
    output = _list_moves(gov207_api, gov207_store)
    assert output["status"] == "ok"
    by_id = {move["operationId"]: move for move in output["moves"]}
    assert set(by_id) == {"operation:inspect-context", "operation:start-site"}
    site = by_id["operation:start-site"]
    assert site["effectClass"] == "external"
    assert site["parameterSchema"]["required"] == ["port"]
    assert site["parameterSchema"]["additionalProperties"] is False
    assert site["defaults"]["mode"] == "normal"
    assert {item["postconditionId"] for item in site["requiredPostconditions"]} == {
        "postcondition:http",
        "postcondition:process",
    }
    assert site["victoryConditionId"] == "victory:site-live"
    pure = by_id["operation:inspect-context"]
    assert pure["effectClass"] == "pure"
    assert pure["requiredPostconditions"] == []


def test_list_legal_moves_stale_expectations_reinspect(gov207_api, gov207_store):
    _init(gov207_store)
    output = gov207_api.invoke(
        "list_legal_moves",
        {
            "schemaVersion": "gov-207.list-legal-moves.input.v1",
            "requestId": "req:list-stale",
            "taskId": TASK_ID,
            "expectedStateSha256": "0" * 64,
            "expectedLedgerHeadSha256": "0" * 64,
        },
    )
    assert output["status"] == "reinspect"
    assert output["directive"]["action"] == "reinspect"
    assert output["moves"] == []


def test_pure_move_executes_and_persists(gov207_api, gov207_store):
    _init(gov207_store)
    before = _session_state(gov207_store)
    output = _execute(
        gov207_api, gov207_store, "operation:inspect-context", {"target": "docs"}
    )
    assert output["status"] == "verified"
    assert output["claimableSuccess"] is True
    assert output["stateAfter"]["phase"] == "PROPOSED"
    assert output["ledgerDelta"]["persisted"] is True
    assert output["ledgerDelta"]["eventsAppended"] == 1
    after = _session_state(gov207_store)
    assert after.data["inspected_target"] == "docs"
    assert after.state_sha256 != before.state_sha256
    assert _event_kinds(gov207_store) == ("move_applied",)


def test_external_move_requires_evidence_and_verifies(gov207_api, gov207_store, gov207_catalog):
    _init(gov207_store)
    port = _catalog_port(gov207_catalog)
    output = _execute(
        gov207_api,
        gov207_store,
        "operation:start-site",
        {"port": port, "bind_port": port},
    )
    assert output["status"] == "verified"
    assert output["claimableSuccess"] is True
    assert output["stateAfter"]["phase"] == "VERIFIED"
    assert output["verification"]["passed"] is True
    assert output["cleanup"]["succeeded"] is True
    assert output["execution"]["attemptId"] is not None
    after = _session_state(gov207_store)
    assert after.data["site_verified"] is True
    assert _event_kinds(gov207_store) == (
        "move_proposed",
        "move_validated",
        "execution_started",
        "execution_attempted",
        "evidence_recorded",
        "cleanup_recorded",
        "verification_decided",
    )

    verify = gov207_api.invoke(
        "verify_outcome",
        {
            "schemaVersion": "gov-207.verify-outcome.input.v1",
            "requestId": "req:verify",
            "taskId": TASK_ID,
            "attemptId": output["execution"]["attemptId"],
            "expectedStateSha256": after.state_sha256,
            "expectedLedgerHeadSha256": after.ledger_anchor.head_sha256,
        },
    )
    assert verify["status"] == "verified"
    assert verify["claim"] == {
        "mayDeclareSuccess": True,
        "claimCode": "verified_evidence",
    }
    assert verify["replay"]["valid"] is True
    assert {item["evidenceType"] for item in verify["evidence"]} == {"http", "process"}
    assert all(item["verdict"] == "pass" for item in verify["evidence"])


def test_invalid_move_is_rejected_without_ledger_delta(gov207_api, gov207_store):
    _init(gov207_store)
    before = _session_state(gov207_store)
    output = gov207_api.invoke(
        "validate_and_execute_move",
        {
            "schemaVersion": "gov-207.validate-execute.input.v1",
            "requestId": "req:invalid",
            "taskId": TASK_ID,
            "selectedMove": {
                "operationId": "operation:does-not-exist",
                "moveSha256": "0" * 64,
            },
            "parameters": {},
            "expected": _state_expected(gov207_store),
        },
    )
    assert output["status"] == "rejected"
    assert output["directive"]["action"] == "list_legal_moves"
    assert output["claimableSuccess"] is False
    assert output["ledgerDelta"]["persisted"] is False
    after = _session_state(gov207_store)
    assert after.state_sha256 == before.state_sha256
    assert after.ledger_anchor == before.ledger_anchor


def test_wrong_move_hash_is_rejected(gov207_api, gov207_store):
    _init(gov207_store)
    output = gov207_api.invoke(
        "validate_and_execute_move",
        {
            "schemaVersion": "gov-207.validate-execute.input.v1",
            "requestId": "req:wrong-hash",
            "taskId": TASK_ID,
            "selectedMove": {
                "operationId": "operation:inspect-context",
                "moveSha256": "1" * 64,
            },
            "parameters": {"target": "docs"},
            "expected": _state_expected(gov207_store),
        },
    )
    assert output["status"] == "rejected"
    assert output["directive"]["reasonCode"] == "operation_not_legal"


def test_stale_expected_block_is_rejected(gov207_api, gov207_store):
    _init(gov207_store)
    expected = _state_expected(gov207_store)
    expected["stateSha256"] = "2" * 64
    output = gov207_api.invoke(
        "validate_and_execute_move",
        {
            "schemaVersion": "gov-207.validate-execute.input.v1",
            "requestId": "req:stale",
            "taskId": TASK_ID,
            "selectedMove": {
                "operationId": "operation:inspect-context",
                "moveSha256": "3" * 64,
            },
            "parameters": {"target": "docs"},
            "expected": expected,
        },
    )
    assert output["status"] == "rejected"
    assert output["directive"]["action"] == "reinspect"


def test_malformed_parameters_replan_with_schema(gov207_api, gov207_store):
    _init(gov207_store)
    output = _execute(
        gov207_api,
        gov207_store,
        "operation:inspect-context",
        {"target": "docs", "unexpected": True},
    )
    assert output["status"] == "rejected"
    assert output["directive"]["action"] == "replan"
    assert output["directive"]["reasonCode"] == "unknown_operation_parameter"


def test_external_parameter_rejection_never_persists_validation_event(
    gov207_api,
    gov207_store,
):
    _init(gov207_store)
    before = _session_state(gov207_store)

    output = _execute(
        gov207_api,
        gov207_store,
        "operation:start-site",
        {"port": "not-an-integer"},
    )

    after = _session_state(gov207_store)
    assert output["status"] == "rejected"
    assert output["directive"]["reasonCode"] == "operation_parameter_type_mismatch"
    assert output["ledgerDelta"]["persisted"] is False
    assert after == before
    assert _event_kinds(gov207_store) == ()


def test_external_validation_precedes_validation_event_promotion(
    monkeypatch,
    gov207_api,
    gov207_store,
    gov207_catalog,
):
    import governor.agent_api as agent_api_module

    _init(gov207_store)
    order: list[str] = []
    original_validate = agent_api_module.validate_move
    original_commit = agent_api_module.commit_staged_runtime_event

    def recording_validate(*args, **kwargs):
        move = original_validate(*args, **kwargs)
        order.append("validate_move_returned")
        return move

    def recording_commit(*args, **kwargs):
        order.append("move_validated_promoted")
        return original_commit(*args, **kwargs)

    monkeypatch.setattr(agent_api_module, "validate_move", recording_validate)
    monkeypatch.setattr(
        agent_api_module,
        "commit_staged_runtime_event",
        recording_commit,
    )
    port = _catalog_port(gov207_catalog)

    output = _execute(
        gov207_api,
        gov207_store,
        "operation:start-site",
        {"port": port, "bind_port": port},
    )

    assert output["status"] == "verified"
    assert order == ["validate_move_returned", "move_validated_promoted"]


def test_classify_governor_returns_authoritative_result(gov207_api, gov207_store):
    _init(gov207_store)
    state = _session_state(gov207_store)
    output = gov207_api.invoke(
        "classify_governor",
        {
            "schemaVersion": "gov-207.classify-governor.input.v1",
            "requestId": "req:classify",
            "taskId": TASK_ID,
            "expectedStateSha256": state.state_sha256,
            "expectedPolicyFingerprint": CLASSIFIER_POLICY_FINGERPRINT,
            "classificationRequest": classification_request(),
        },
    )
    assert output["status"] == "ok"
    assert output["outcomeSummary"] == {
        "classified": 1,
        "ambiguous": 0,
        "unresolved": 0,
        "invalid": 0,
    }
    result = output["classificationResult"]
    assert result["facetResults"][0]["primaryGovernor"] == "Jupiter"
    assert result["facetResults"][0]["outcome"] == "classified"
    assert output["explanations"][0]["evidenceIds"] == ["rule:test:distribution:v1"]


def test_classify_governor_unavailable_without_policy(gov207_store, gov207_catalog):
    api = AgentApi(
        store=gov207_store,
        catalog=gov207_catalog,
        host_grants=GOV207_HOST_GRANTS,
    )
    _init(gov207_store)
    state = _session_state(gov207_store)
    output = api.invoke(
        "classify_governor",
        {
            "schemaVersion": "gov-207.classify-governor.input.v1",
            "requestId": "req:classify-off",
            "taskId": TASK_ID,
            "expectedStateSha256": state.state_sha256,
            "expectedPolicyFingerprint": CLASSIFIER_POLICY_FINGERPRINT,
            "classificationRequest": classification_request(),
        },
    )
    assert output["status"] == "unavailable"
    assert output["classificationResult"] is None


def test_outputs_are_deterministic_across_fresh_runtimes(tmp_path):
    outputs = []
    for name in ("a", "b"):
        store = RuntimeSessionStore(tmp_path / name / "sessions")
        catalog = build_catalog(tmp_path / name)
        api = AgentApi(
            store=store,
            catalog=catalog,
            host_grants=GOV207_HOST_GRANTS,
            classifier_policy=classifier_policy(),
        )
        _init(store)
        state = _session_state(store)
        outputs.append(
            api.invoke(
                "classify_governor",
                {
                    "schemaVersion": "gov-207.classify-governor.input.v1",
                    "requestId": "req:determinism",
                    "taskId": TASK_ID,
                    "expectedStateSha256": state.state_sha256,
                    "expectedPolicyFingerprint": CLASSIFIER_POLICY_FINGERPRINT,
                    "classificationRequest": classification_request(),
                },
            )
        )
    assert outputs[0] == outputs[1]


def test_tampered_session_fails_closed(gov207_api, gov207_store):
    _init(gov207_store)
    path = gov207_store.root / f"{TASK_ID}.session.json"
    document = json.loads(path.read_text(encoding="utf-8"))
    document["events"] = document["events"][:0]
    document["state"]["ledgerAnchor"]["eventCount"] = 5
    path.write_text(json.dumps(document), encoding="utf-8")
    with pytest.raises(TransitionError):
        gov207_api.invoke(
            "inspect_context",
            {
                "schemaVersion": "gov-207.inspect-context.input.v1",
                "requestId": "req:tampered",
                "taskId": TASK_ID,
            },
        )


# ---------------------------------------------------------------------------
# Canonical evaluation traces
# ---------------------------------------------------------------------------

_INPUT_VERSIONS = {
    "inspect_context": "gov-207.inspect-context.input.v1",
    "classify_governor": "gov-207.classify-governor.input.v1",
    "list_legal_moves": "gov-207.list-legal-moves.input.v1",
    "validate_and_execute_move": "gov-207.validate-execute.input.v1",
    "verify_outcome": "gov-207.verify-outcome.input.v1",
}


def _trace_files() -> list[Path]:
    return sorted(TRACE_DIR.glob("*.json"))


def _resolve(value, context):
    if isinstance(value, dict):
        return {key: _resolve(item, context) for key, item in value.items()}
    if isinstance(value, list):
        return [_resolve(item, context) for item in value]
    if not isinstance(value, str) or not value.startswith("${"):
        return value
    token = value[2:-1]
    if token == "freePort":
        return context["port"]
    if token == "attemptId":
        return context["attemptId"]
    if token.startswith("moveSha256:"):
        return context["move_shas"][token.split(":", 1)[1]]
    if token == "policyFingerprint":
        return GOV207_POLICY
    if token == "contextFingerprint":
        return GOV207_CONTEXT
    raise AssertionError(f"unknown trace placeholder: {value}")


def _run_trace(trace_path: Path, tmp_path: Path) -> None:
    trace = json.loads(trace_path.read_text(encoding="utf-8"))
    setup = trace["setup"]
    task_id = setup["taskId"]
    policy = setup.get("loopPolicy", {})
    loop_policy = LoopPolicy(
        policy.get("maxRetries", 3),
        policy.get("repetitionLimit", 3),
        policy.get("noProgressWindow", 2),
    )
    port = free_port()
    store = RuntimeSessionStore(tmp_path / trace["traceId"] / "sessions")
    catalog = build_catalog(tmp_path / trace["traceId"], loop_policy=loop_policy, port=port)
    graph_provider = None
    projection_fingerprint = None
    if setup.get("withGraph"):
        graph_provider = lambda query_id, params: {"queryId": query_id, "rows": []}
        projection_fingerprint = "c" * 64
    api = AgentApi(
        store=store,
        catalog=catalog,
        host_grants=GOV207_HOST_GRANTS,
        classifier_policy=classifier_policy() if setup.get("withClassifier") else None,
        graph_provider=graph_provider,
        projection_fingerprint=projection_fingerprint,
        execution_deadline_seconds=3.0,
    )
    initialize_session(
        store,
        task_id=task_id,
        policy_sha256=GOV207_POLICY,
        context_sha256=GOV207_CONTEXT,
        capabilities=("runtime.context.read", "runtime.start-site"),
        data=setup.get("data", {}),
        phase=setup.get("phase", "INSPECTED"),
    )
    context = {"port": port, "attemptId": None, "move_shas": {}}
    last_claim_output: dict | None = None

    for index, step in enumerate(trace["steps"], start=1):
        operation = step["operation"]
        loaded = store.load(task_id)
        assert loaded is not None
        state = loaded[1]
        request = {
            "schemaVersion": _INPUT_VERSIONS[operation],
            "requestId": f"req:{trace['traceId']}:{index}",
            "taskId": task_id,
        }
        if operation == "validate_and_execute_move":
            listed = api.invoke(
                "list_legal_moves",
                {
                    "schemaVersion": _INPUT_VERSIONS["list_legal_moves"],
                    "requestId": f"req:{trace['traceId']}:{index}:list",
                    "taskId": task_id,
                    "expectedStateSha256": state.state_sha256,
                    "expectedLedgerHeadSha256": state.ledger_anchor.head_sha256,
                },
            )
            context["move_shas"] = {
                move["operationId"]: move["moveSha256"] for move in listed["moves"]
            }
        request.update(_resolve(step.get("request", {}), context))
        if operation in {"list_legal_moves", "verify_outcome"}:
            request.setdefault("expectedStateSha256", state.state_sha256)
            request.setdefault(
                "expectedLedgerHeadSha256", state.ledger_anchor.head_sha256
            )
        if operation == "classify_governor":
            request.setdefault("expectedStateSha256", state.state_sha256)
            request.setdefault(
                "expectedPolicyFingerprint", CLASSIFIER_POLICY_FINGERPRINT
            )
        if operation == "validate_and_execute_move":
            request["expected"] = {
                "revision": state.revision,
                "stateSha256": state.state_sha256,
                "ledgerHeadSha256": state.ledger_anchor.head_sha256,
                "policyFingerprint": state.policy_sha256,
                "contextFingerprint": state.context_sha256,
            }
        output = api.invoke(operation, request)
        if operation in {"validate_and_execute_move", "verify_outcome"}:
            last_claim_output = output

        if operation == "list_legal_moves":
            context["move_shas"] = {
                move["operationId"]: move["moveSha256"] for move in output["moves"]
            }
        if operation == "validate_and_execute_move":
            context["attemptId"] = output["execution"]["attemptId"]

        expect = step.get("expect", {})
        if "status" in expect:
            assert output["status"] == expect["status"], (
                f"{trace['traceId']} step {index}: {output['status']} != {expect['status']}"
            )
        if "directiveAction" in expect:
            assert output["directive"]["action"] == expect["directiveAction"]
        if "reasonCode" in expect:
            assert output["directive"]["reasonCode"] == expect["reasonCode"]
        if "claimableSuccess" in expect:
            assert output["claimableSuccess"] is expect["claimableSuccess"]
        if "mayDeclareSuccess" in expect:
            assert output["claim"]["mayDeclareSuccess"] is expect["mayDeclareSuccess"]
        if "movesContain" in expect:
            listed = {move["operationId"] for move in output["moves"]}
            assert set(expect["movesContain"]).issubset(listed)
        if "menuSkills" in expect:
            menu = output.get("menu") or output.get("nextMenu")
            assert menu["skills"] == expect["menuSkills"]
        if "namedQueriesContain" in expect:
            menu = output.get("menu") or output.get("nextMenu")
            bound = {query["queryId"] for query in menu["namedQueries"]}
            assert set(expect["namedQueriesContain"]).issubset(bound)
        if "outcomeSummary" in expect:
            for key, value in expect["outcomeSummary"].items():
                assert output["outcomeSummary"][key] == value
        if "phaseAfter" in expect:
            ref = output.get("stateAfter") or output.get("state") or output["context"]["state"]
            assert ref["phase"] == expect["phaseAfter"]
        if "ledgerPersisted" in expect:
            assert output["ledgerDelta"]["persisted"] is expect["ledgerPersisted"]

    final = trace.get("expectedFinal", {})
    if "phase" in final:
        loaded = store.load(task_id)
        assert loaded is not None
        assert loaded[1].phase == final["phase"]
    if "mayDeclareSuccess" in final and last_claim_output is not None:
        claim = last_claim_output.get("claim")
        if claim is not None:
            assert claim["mayDeclareSuccess"] is final["mayDeclareSuccess"]
        else:
            assert last_claim_output.get("claimableSuccess") is final["mayDeclareSuccess"]


@pytest.mark.parametrize("trace_path", _trace_files(), ids=lambda path: path.stem)
def test_evaluation_trace(trace_path: Path, tmp_path: Path) -> None:
    _run_trace(trace_path, tmp_path)
