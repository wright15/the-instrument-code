from __future__ import annotations

from collections import Counter
from dataclasses import replace
import json
from pathlib import Path
import re
import subprocess
import sys

import pytest

from court_mathematics import HarmonicProfile, PitchClassSet
from governor.court_graph_projection import (
    COURT_GRAPH_SCHEMA_VERSION,
    CourtCommutationProjection,
    CourtFilterApplicationProjection,
    CourtFilterOperatorProjection,
    CourtGraphProjectionError,
    CourtRootedPositionProjection,
    PentatonicSetClassProjection,
    PoleRegisterProjection,
    VerifiedCourtRuntimeSessionProjection,
    build_court_graph_projection,
    iter_cypher_ingestion_batches,
    serialize_court_graph_projection,
    verify_court_graph_projection,
)
from governor.court_graph_queries import (
    COURT_QUERY_CATALOG,
    execute_court_snapshot_query,
    normalize_court_query_parameters,
)
from governor.court_runtime import (
    apply_court_move,
    create_court_route_context,
    create_court_runtime_state,
    create_topological_translocation_record,
    load_court_runtime_policy,
    replay_court_runtime_ledger,
    validate_court_move,
)
from governor.evidence import VerificationDecision
from governor.harmonic_models import create_court_state
from governor.hashing import sha256_payload
from governor.models import LedgerAnchor


ROOT = Path(__file__).resolve().parents[1]
SOURCE_SHA256 = "6d2603a2499aea55b6bc13d11694ae10e6bfad1d62cb488506a57333e182f6c9"
FILTER_SOURCE_SHA256 = sha256_payload({"source": "court-filter-fixture"})
CRT304_SHA256 = "40bd74397ff9f4c8c0f0b845630e008cea66c9495413195c1e1c92ff02968589"
CONTEXT_SHA256 = sha256_payload({"context": "court-graph-test"})
COURT_MASK = PitchClassSet.from_pitch_classes((0, 2, 5, 7, 10)).mask
SESSION_ID = "crt-306-test-session"


def _runtime_session(session_id: str = SESSION_ID):
    profile = HarmonicProfile.from_pitch_classes(
        subject_id="scale-state:1453",
        source_id="universal-heptatonic-ledger:1453",
        source_sha256=SOURCE_SHA256,
        pitch_classes=(0, 2, 3, 5, 7, 8, 10),
        root=0,
    )
    policy = load_court_runtime_policy()
    genesis = create_court_runtime_state(
        session_id=session_id,
        position_id="C0",
        harmonic_profile_sha256=profile.fingerprint_sha256,
        context_fingerprint=CONTEXT_SHA256,
        capabilities=("court.transition", "court.translocate"),
        policy=policy,
    )
    first_move = validate_court_move(genesis, "court:advance", "C1", policy=policy)
    first = apply_court_move(
        genesis,
        first_move,
        policy=policy,
        verification_decision=VerificationDecision(True, (), ("3" * 64,)),
    )
    record = create_topological_translocation_record(
        source_position="C1",
        target_position="C4",
        operator_id="R7",
        forte_family="5-23",
    )
    route = create_court_route_context(
        forte_family="5-23", operator_id="R7", source_scale_state_id=1453
    )
    second_move = validate_court_move(
        first.state,
        "court:translocate",
        "C4",
        policy=policy,
        translocation_record=record,
        route_context=route,
    )
    second = apply_court_move(
        first.state,
        second_move,
        first.events,
        policy=policy,
        verification_decision=VerificationDecision(True, (), ("4" * 64,)),
    )
    assert first.accepted and second.accepted
    replay = replay_court_runtime_ledger(genesis, second.events, second.state.ledger_anchor)
    assert replay.valid and replay.state == second.state
    return profile, VerifiedCourtRuntimeSessionProjection(
        genesis, second.events, second.state.ledger_anchor
    ), second.state


def _static_inputs(*, reverse_commutations: bool = False):
    profile, _, _ = _runtime_session()
    operator = CourtFilterOperatorProjection(
        filter_id="filter:C2",
        court_mask=COURT_MASK,
        source_sha256=FILTER_SOURCE_SHA256,
        admission_status="proposed",
    )
    set_class = PentatonicSetClassProjection(
        set_class_id="5-35:C2",
        pitch_mask=COURT_MASK,
        source_sha256=FILTER_SOURCE_SHA256,
        admission_status="proposed",
    )
    commutations = (
        CourtCommutationProjection(
            commutation_id="C2:R7:1453",
            mutation_operator_id="R7",
            result="right_undefined",
            route_semantics="mutation_then_filter_only",
            source_sha256=FILTER_SOURCE_SHA256,
            admission_status="proposed",
        ),
        CourtCommutationProjection(
            commutation_id="C2:L7:1453",
            mutation_operator_id="L7",
            result="right_undefined",
            route_semantics="mutation_then_filter_only",
            source_sha256=FILTER_SOURCE_SHA256,
            admission_status="proposed",
        ),
        CourtCommutationProjection(
            commutation_id="noncomm:court-filter:5-23:root-0:R7:1453",
            mutation_operator_id="R7",
            result="right_undefined",
            route_semantics="mutation_then_filter_only",
            source_sha256=CRT304_SHA256,
            admission_status="proposed",
        ),
    )
    if reverse_commutations:
        commutations = tuple(reversed(commutations))
    application = CourtFilterApplicationProjection(
        application_id="C2:1453",
        harmonic_profile_sha256=profile.fingerprint_sha256,
        filter_id=operator.filter_id,
        yielded_set_class_id=set_class.set_class_id,
        commutation_ids=("C2:L7:1453", "C2:R7:1453"),
        source_sha256=FILTER_SOURCE_SHA256,
        admission_status="proposed",
    )
    position = CourtRootedPositionProjection(
        position_id="C2",
        set_class_id=set_class.set_class_id,
        pitch_mask=COURT_MASK,
        root_pc=0,
        source_sha256=FILTER_SOURCE_SHA256,
        admission_status="proposed",
    )
    return operator, set_class, commutations, application, position


def _snapshot(*, reverse_commutations: bool = False):
    profile, session, _ = _runtime_session()
    operator, set_class, commutations, application, position = _static_inputs(
        reverse_commutations=reverse_commutations
    )
    return build_court_graph_projection(
        (profile,),
        (session,),
        filter_operators=(operator,),
        pentatonic_set_classes=(set_class,),
        filter_applications=(application,),
        commutation_records=commutations,
        rooted_positions=(position,),
    )


def _rehash_snapshot(snapshot):
    core = {key: value for key, value in snapshot.items() if key != "projectionFingerprint"}
    snapshot["projectionFingerprint"] = sha256_payload(core)


def _rehash_record(record):
    core = {key: value for key, value in record.items() if key != "recordSha256"}
    record["recordSha256"] = sha256_payload(core)


def test_fixture_projection_has_exact_schema_counts_and_types() -> None:
    snapshot = _snapshot()
    assert snapshot["schemaVersion"] == "crt-306.court-graph-projection.v2"
    assert snapshot["schemaVersion"] == COURT_GRAPH_SCHEMA_VERSION
    assert snapshot["counts"] == {
        "nodeCount": 21,
        "relationshipCount": 19,
        "scaleStateReferenceCount": 1,
    }
    assert Counter(node["label"] for node in snapshot["nodes"]) == {
        "Triad": 7,
        "CourtCommutationRecord": 3,
        "CourtTransitionEvent": 2,
        "CourtRuntimeSession": 1,
        "CourtLedgerSnapshot": 1,
        "TopologicalTranslocationRecord": 1,
        "CourtFilterApplication": 1,
        "CourtFilterOperator": 1,
        "CourtRootedPosition": 1,
        "CourtState": 1,
        "PentatonicSetClass": 1,
        "PoleRegister": 1,
    }
    assert Counter(edge["relationshipType"] for edge in snapshot["relationships"]) == {
        "HAS_TRIAD": 7,
        "HAS_COMMUTATION_RESULT": 2,
        "HAS_TRANSITION_EVENT": 2,
        "FILTERS": 1,
        "USES_FILTER": 1,
        "YIELDS_ADMITTED_SET": 1,
        "HAS_POLE_REGISTER": 1,
        "HAS_LEDGER_SNAPSHOT": 1,
        "SNAPSHOTS_STATE": 1,
        "HAS_TRANSLOCATION": 1,
        "USES_ROUTE_RECORD": 1,
    }
    assert verify_court_graph_projection(snapshot)


def test_runtime_state_snapshot_and_poles_are_replay_derived() -> None:
    snapshot = _snapshot()
    _, session, terminal = _runtime_session()
    state = next(node for node in snapshot["nodes"] if node["label"] == "CourtState")
    state_props = state["properties"]
    assert state["logicalId"] == f"court-state:{terminal.state_sha256}"
    assert state_props == {
        "courtStateSha256": terminal.state_sha256,
        "sessionId": SESSION_ID,
        "courtPositionId": "C4",
        "revision": 2,
        "pitchMask": 1321,
        "poleVector": "1111",
        "kappaNumerator": 1,
        "kappaDenominator": 1,
        "harmonicProfileSha256": terminal.harmonic_profile_sha256,
        "policyFingerprint": terminal.policy_fingerprint,
        "contextFingerprint": terminal.context_fingerprint,
        "eventCount": 2,
        "ledgerHeadSha256": session.trusted_anchor.head_sha256,
        "consumedTokenCount": 2,
    }
    pole = next(node for node in snapshot["nodes"] if node["label"] == "PoleRegister")
    assert pole["properties"]["vector"] == "1111"
    assert pole["properties"]["internalPoles"] == list(terminal.pole_register.internal_poles)
    assert next(
        edge for edge in snapshot["relationships"] if edge["relationshipType"] == "HAS_POLE_REGISTER"
    )["sourceLogicalId"] == state["logicalId"]


def test_events_are_ordered_chain_bound_and_route_linked_exactly() -> None:
    snapshot = _snapshot()
    events = sorted(
        (node for node in snapshot["nodes"] if node["label"] == "CourtTransitionEvent"),
        key=lambda node: node["properties"]["sequence"],
    )
    session = next(node for node in snapshot["nodes"] if node["label"] == "CourtRuntimeSession")
    assert [event["properties"]["sequence"] for event in events] == [1, 2]
    assert events[0]["properties"]["priorStateSha256"] == session["properties"]["genesisStateSha256"]
    assert events[0]["properties"]["previousEventSha256"] == "0" * 64
    assert events[0]["properties"]["resultingStateSha256"] == events[1]["properties"]["priorStateSha256"]
    assert events[1]["properties"]["previousEventSha256"] == events[0]["properties"]["eventSha256"]
    assert events[1]["properties"]["resultingStateSha256"] == session["properties"]["currentStateSha256"]
    assert events[1]["properties"]["eventSha256"] == session["properties"]["ledgerHeadSha256"]
    assert all(event["properties"]["verificationStatus"] == "VERIFIED" for event in events)
    assert all(event["properties"]["evidenceEventIds"] for event in events)

    ordinary_edges = [
        edge for edge in snapshot["relationships"] if edge["sourceLogicalId"] == events[0]["logicalId"]
    ]
    compound_edges = [
        edge for edge in snapshot["relationships"] if edge["sourceLogicalId"] == events[1]["logicalId"]
    ]
    assert ordinary_edges == []
    assert {edge["relationshipType"] for edge in compound_edges} == {
        "HAS_TRANSLOCATION",
        "USES_ROUTE_RECORD",
    }
    route_edge = next(edge for edge in compound_edges if edge["relationshipType"] == "USES_ROUTE_RECORD")
    route = next(node for node in snapshot["nodes"] if node["logicalId"] == route_edge["targetLogicalId"])
    translocation = next(
        node for node in snapshot["nodes"] if node["label"] == "TopologicalTranslocationRecord"
    )
    assert route["properties"]["commutationId"] == translocation["properties"]["staticRouteRecordId"]
    assert route["properties"]["commutationId"] == "noncomm:court-filter:5-23:root-0:R7:1453"
    assert "degreeGovernor" not in translocation["properties"]
    assert all(
        node["properties"]["ledgerPointer"] is None
        for node in snapshot["nodes"]
        if node["label"] == "CourtCommutationRecord"
    )


def test_projection_accepts_only_replay_input_and_rejects_tampering() -> None:
    profile, session, _ = _runtime_session()
    static = _static_inputs()
    kwargs = {
        "filter_operators": (static[0],),
        "pentatonic_set_classes": (static[1],),
        "filter_applications": (static[3],),
        "commutation_records": static[2],
        "rooted_positions": (static[4],),
    }
    legacy = create_court_state(
        court_position_id="court-position:C2",
        harmonic_profile_sha256=profile.fingerprint_sha256,
        court_policy_sha256="1" * 64,
    )
    with pytest.raises(CourtGraphProjectionError, match="runtime_session_projection_input_invalid"):
        build_court_graph_projection((profile,), (legacy,), **kwargs)  # type: ignore[arg-type]

    bad_event = replace(session.events[0], event_sha256="0" * 64)
    tampered_events = VerifiedCourtRuntimeSessionProjection(
        session.genesis, (bad_event, session.events[1]), session.trusted_anchor
    )
    with pytest.raises(CourtGraphProjectionError, match="runtime_session_replay_invalid"):
        build_court_graph_projection((profile,), (tampered_events,), **kwargs)

    bad_anchor = VerifiedCourtRuntimeSessionProjection(
        session.genesis, session.events, LedgerAnchor(2, "0" * 64)
    )
    with pytest.raises(CourtGraphProjectionError, match="runtime_session_replay_invalid"):
        build_court_graph_projection((profile,), (bad_anchor,), **kwargs)

    with pytest.raises(CourtGraphProjectionError, match="duplicate_runtime_session_id"):
        build_court_graph_projection((profile,), (session, session), **kwargs)


def test_missing_exact_route_and_static_ledger_pointer_fail_closed() -> None:
    profile, session, _ = _runtime_session()
    operator, set_class, commutations, application, position = _static_inputs()
    with pytest.raises(CourtGraphProjectionError, match="translocation_static_route_missing"):
        build_court_graph_projection(
            (profile,),
            (session,),
            filter_operators=(operator,),
            pentatonic_set_classes=(set_class,),
            filter_applications=(application,),
            commutation_records=commutations[:2],
            rooted_positions=(position,),
        )
    with pytest.raises(CourtGraphProjectionError, match="static_commutation_ledger_pointer_forbidden"):
        replace(commutations[0], ledger_pointer="court-ledger:event:1")

    exact_route = commutations[2]
    for malformed_route in (
        replace(exact_route, mutation_operator_id="L7"),
        replace(exact_route, route_semantics="both_undefined"),
        replace(exact_route, source_sha256="a" * 64),
    ):
        with pytest.raises(CourtGraphProjectionError, match="translocation_static_route_mismatch"):
            build_court_graph_projection(
                (profile,),
                (session,),
                filter_operators=(operator,),
                pentatonic_set_classes=(set_class,),
                filter_applications=(application,),
                commutation_records=(*commutations[:2], malformed_route),
                rooted_positions=(position,),
            )


def test_authored_poles_are_static_rooted_position_only() -> None:
    with pytest.raises(CourtGraphProjectionError, match="pole_register_runtime_owner_forbidden"):
        PoleRegisterProjection(
            pole_register_id="authored-runtime",
            owner_label="CourtState",
            owner_id="1" * 64,
            internal_poles=("Mars",),
            source_sha256=FILTER_SOURCE_SHA256,
            admission_status="proposed",
        )
    pole = PoleRegisterProjection(
        pole_register_id="C2:static",
        owner_label="CourtRootedPosition",
        owner_id="C2",
        internal_poles=("Mars", "Jupiter"),
        source_sha256=FILTER_SOURCE_SHA256,
        admission_status="proposed",
    )
    assert pole.owner_label == "CourtRootedPosition"


def test_projection_bytes_are_order_independent_and_tampering_is_rejected() -> None:
    first = _snapshot()
    second = _snapshot(reverse_commutations=True)
    assert first["projectionFingerprint"] == second["projectionFingerprint"]
    assert serialize_court_graph_projection(first) == serialize_court_graph_projection(second)

    tampered = json.loads(serialize_court_graph_projection(first))
    state = next(node for node in tampered["nodes"] if node["label"] == "CourtState")
    state["properties"]["eventCount"] = 99
    _rehash_record(state)
    _rehash_snapshot(tampered)
    assert not verify_court_graph_projection(tampered)

    authority = json.loads(serialize_court_graph_projection(first))
    translocation = next(
        node for node in authority["nodes"] if node["label"] == "TopologicalTranslocationRecord"
    )
    translocation["properties"]["degreeGovernor"] = "Moon"
    _rehash_record(translocation)
    _rehash_snapshot(authority)
    assert not verify_court_graph_projection(authority)

    evidence = json.loads(serialize_court_graph_projection(first))
    event = next(node for node in evidence["nodes"] if node["label"] == "CourtTransitionEvent")
    event["properties"]["evidenceEventIds"] = ["not-a-sha256"]
    _rehash_record(event)
    _rehash_snapshot(evidence)
    assert not verify_court_graph_projection(evidence)

    route_binding = json.loads(serialize_court_graph_projection(first))
    route = next(
        node
        for node in route_binding["nodes"]
        if node["properties"].get("commutationId")
        == "noncomm:court-filter:5-23:root-0:R7:1453"
    )
    route["properties"]["mutationOperatorId"] = "L7"
    _rehash_record(route)
    _rehash_snapshot(route_binding)
    assert not verify_court_graph_projection(route_binding)


def test_ingestion_batches_are_stable_bounded_and_idempotent() -> None:
    snapshot = _snapshot()
    first = iter_cypher_ingestion_batches(snapshot, batch_size=2)
    second = iter_cypher_ingestion_batches(snapshot, batch_size=2)
    assert [batch.sequence for batch in first] == list(range(1, len(first) + 1))
    assert [batch.canonical_bytes() for batch in first] == [batch.canonical_bytes() for batch in second]
    assert all(len(batch.parameters["records"]) <= 2 for batch in first)
    assert all("MERGE" in batch.cypher for batch in first)
    assert all(not re.search(r"\b(?:CREATE|DELETE|DETACH)\b", batch.cypher) for batch in first)
    assert first[0].kind == "references:ScaleState"
    assert set(first[0].parameters["records"][0]) == {"logicalId", "scaleStateId"}
    assert not re.search(r"\b(?:SET|REMOVE|OCCUPIES_OFFICE)\b", first[0].cypher)


def test_six_named_queries_are_read_only_bounded_and_have_snapshot_parity() -> None:
    assert tuple(COURT_QUERY_CATALOG) == (
        "degree_triads_for_scale",
        "modal_scale_states_by_triad_quality",
        "modal_scale_states_by_interval_vector",
        "court_filter_commutation_outputs",
        "court_runtime_state_for_session",
        "court_verified_events_for_session",
    )
    for spec in COURT_QUERY_CATALOG.values():
        assert spec.max_rows <= 100
        assert spec.max_depth <= 2
        assert spec.timeout_ms <= 1000
        assert "ORDER BY" in spec.cypher and "LIMIT" in spec.cypher
        assert not re.search(
            r"\b(?:CREATE|MERGE|SET|DELETE|DETACH|DROP|REMOVE|CALL)\b",
            spec.cypher,
            flags=re.IGNORECASE,
        )

    snapshot = _snapshot()
    state_rows = execute_court_snapshot_query(
        snapshot, "court_runtime_state_for_session", {"sessionId": SESSION_ID}
    )
    event_rows = execute_court_snapshot_query(
        snapshot, "court_verified_events_for_session", {"sessionId": SESSION_ID}
    )
    assert len(state_rows) == 1
    assert state_rows[0]["courtPositionId"] == "C4"
    assert state_rows[0]["replayVerified"] is True
    assert [row["sequence"] for row in event_rows] == [1, 2]
    assert event_rows[0]["staticRouteRecordId"] is None
    assert event_rows[1]["staticRouteRecordId"] == "noncomm:court-filter:5-23:root-0:R7:1453"
    assert all(row["verificationStatus"] == "VERIFIED" for row in event_rows)


@pytest.mark.parametrize("session_id", ("", " bad", "bad/session", "x" * 129, 7))
def test_runtime_query_parameter_contract_rejects_unsafe_session_ids(session_id) -> None:
    with pytest.raises(CourtGraphProjectionError, match="court_query_session_id_invalid"):
        normalize_court_query_parameters(
            "court_runtime_state_for_session", {"sessionId": session_id}
        )


def test_query_parameter_contract_rejects_unknown_and_unbounded_input() -> None:
    with pytest.raises(CourtGraphProjectionError, match="court_query_limit_invalid"):
        normalize_court_query_parameters(
            "court_verified_events_for_session", {"sessionId": SESSION_ID, "limit": 101}
        )
    with pytest.raises(CourtGraphProjectionError, match="court_query_parameter_unknown"):
        normalize_court_query_parameters(
            "court_runtime_state_for_session",
            {"sessionId": SESSION_ID, "cypher": "MATCH (n) RETURN n"},
        )


def test_cypher_contract_covers_runtime_labels_relationships_and_checks() -> None:
    schema = (ROOT / "neo4j/court-mathematics/schema.cypher").read_text(encoding="utf-8")
    validation = (ROOT / "neo4j/court-mathematics/validation.cypher").read_text(
        encoding="utf-8"
    )
    for label in (
        "CourtRuntimeSession",
        "CourtTransitionEvent",
        "CourtLedgerSnapshot",
        "TopologicalTranslocationRecord",
        "CourtState",
    ):
        assert f"(n:{label})" in schema
    for relationship_type in (
        "HAS_TRANSITION_EVENT",
        "HAS_LEDGER_SNAPSHOT",
        "SNAPSHOTS_STATE",
        "HAS_TRANSLOCATION",
        "USES_ROUTE_RECORD",
    ):
        assert f"[r:{relationship_type}]" in schema
    for check in (
        "runtime_session_event_snapshot_cardinality",
        "runtime_event_sequence_contiguous",
        "runtime_event_chain_closure",
        "runtime_snapshot_terminal_state_closure",
        "runtime_translocation_route_pairing",
        "runtime_exact_static_route_target",
        "runtime_source_profile_policy_context_closure",
    ):
        assert check in validation


def test_projection_import_boundary_excludes_mutable_runtime_dependencies() -> None:
    source = (ROOT / "src/governor/court_graph_projection.py").read_text(encoding="utf-8")
    for forbidden in (
        ".transitions",
        ".court_session_store",
        ".executors",
        "neo4j",
        "mutable_authority",
        ".harmonic_models",
    ):
        assert forbidden not in source
    assert "replay_court_runtime_ledger" in source


def test_generator_cli_reproduces_fixture_outputs(tmp_path: Path) -> None:
    fixture = ROOT / "tests/court_graph/fixture-input.json"
    outputs = []
    for index in range(2):
        snapshot_path = tmp_path / f"snapshot-{index}.json"
        batch_path = tmp_path / f"batches-{index}.json"
        query_path = tmp_path / f"queries-{index}.json"
        subprocess.run(
            [
                sys.executable,
                str(ROOT / "scripts/generate-court-graph.py"),
                "--input",
                str(fixture),
                "--snapshot",
                str(snapshot_path),
                "--batches",
                str(batch_path),
                "--query-results",
                str(query_path),
                "--batch-size",
                "2",
            ],
            cwd=ROOT,
            check=True,
        )
        outputs.append((snapshot_path.read_bytes(), batch_path.read_bytes(), query_path.read_bytes()))
    assert outputs[0] == outputs[1]


def test_generator_cli_rejects_non_fixture_runtime_recipe(tmp_path: Path) -> None:
    document = json.loads((ROOT / "tests/court_graph/fixture-input.json").read_text())
    document["runtimeSessions"][0]["transitions"][1]["targetPosition"] = "C5"
    input_path = tmp_path / "tampered-input.json"
    input_path.write_text(json.dumps(document), encoding="utf-8")
    result = subprocess.run(
        [
            sys.executable,
            str(ROOT / "scripts/generate-court-graph.py"),
            "--input",
            str(input_path),
            "--snapshot",
            str(tmp_path / "snapshot.json"),
            "--batches",
            str(tmp_path / "batches.json"),
            "--query-results",
            str(tmp_path / "queries.json"),
        ],
        cwd=ROOT,
        capture_output=True,
        text=True,
    )
    assert result.returncode != 0
    assert "runtime_fixture_recipe_mismatch" in result.stderr
