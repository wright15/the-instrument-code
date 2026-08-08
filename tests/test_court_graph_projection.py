from __future__ import annotations

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
from governor.harmonic_models import create_court_state
from governor.hashing import sha256_payload


ROOT = Path(__file__).resolve().parents[1]
SOURCE_SHA256 = "6d2603a2499aea55b6bc13d11694ae10e6bfad1d62cb488506a57333e182f6c9"
POLICY_SHA256 = sha256_payload({"policy": "court-graph-test"})
FILTER_SOURCE_SHA256 = sha256_payload({"source": "court-filter-fixture"})
COURT_MASK = PitchClassSet.from_pitch_classes((0, 2, 5, 7, 10)).mask


def _inputs(*, reverse_commutations: bool = False):
    profile = HarmonicProfile.from_pitch_classes(
        subject_id="scale-state:1453",
        source_id="universal-heptatonic-ledger:1453",
        source_sha256=SOURCE_SHA256,
        pitch_classes=(0, 2, 3, 5, 7, 8, 10),
        root=0,
    )
    state = create_court_state(
        court_position_id="court-position:C2",
        harmonic_profile_sha256=profile.fingerprint_sha256,
        court_policy_sha256=POLICY_SHA256,
    )
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
            ledger_pointer="court-ledger:event:1",
            source_sha256=FILTER_SOURCE_SHA256,
            admission_status="proposed",
        ),
        CourtCommutationProjection(
            commutation_id="C2:L7:1453",
            mutation_operator_id="L7",
            result="does_not_commute",
            route_semantics="both_routes_defined",
            ledger_pointer="court-ledger:event:2",
            source_sha256=FILTER_SOURCE_SHA256,
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
        commutation_ids=tuple(item.commutation_id for item in reversed(commutations)),
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
    pole = PoleRegisterProjection(
        pole_register_id="C2:runtime",
        owner_label="CourtState",
        owner_id=state.court_state_sha256,
        internal_poles=("Jupiter", "Mars"),
        source_sha256=FILTER_SOURCE_SHA256,
        admission_status="proposed",
    )
    return profile, state, operator, set_class, commutations, application, position, pole


def _snapshot(*, reverse_commutations: bool = False):
    profile, state, operator, set_class, commutations, application, position, pole = _inputs(
        reverse_commutations=reverse_commutations
    )
    return build_court_graph_projection(
        (profile,),
        (state,),
        filter_operators=(operator,),
        pentatonic_set_classes=(set_class,),
        filter_applications=(application,),
        commutation_records=commutations,
        rooted_positions=(position,),
        pole_registers=(pole,),
        profile_admission_status="canonical",
    )


def _rehash_snapshot(snapshot):
    core = {key: value for key, value in snapshot.items() if key != "projectionFingerprint"}
    snapshot["projectionFingerprint"] = sha256_payload(core)


def test_projection_has_exact_narrow_degree_triads() -> None:
    snapshot = _snapshot()
    triads = [node for node in snapshot["nodes"] if node["label"] == "Triad"]
    edges = [
        edge
        for edge in snapshot["relationships"]
        if edge["relationshipType"] == "HAS_TRIAD"
    ]

    assert snapshot["schemaVersion"] == COURT_GRAPH_SCHEMA_VERSION
    assert len(triads) == 7
    assert len(edges) == 7
    assert [edge["properties"]["degree"] for edge in edges] == list(range(1, 8))
    assert all(edge["sourceLabel"] == "ScaleState" for edge in edges)
    assert all(edge["targetLabel"] == "Triad" for edge in edges)
    assert all(
        set(node["properties"])
        == {
            "intervalSignature",
            "pitchClasses",
            "pitchMask",
            "quality",
            "rootPc",
            "triadId",
        }
        for node in triads
    )
    assert all(len(node["properties"]["pitchClasses"]) == 3 for node in triads)
    assert all(node["recordSha256"] for node in triads)
    assert all(node["admissionStatus"] == "canonical" for node in triads)


def test_filter_application_has_all_first_class_relationships() -> None:
    snapshot = _snapshot()
    application_id = "court-filter-application:C2:1453"
    outgoing = {
        edge["relationshipType"]: edge
        for edge in snapshot["relationships"]
        if edge["sourceLogicalId"] == application_id
    }

    assert set(outgoing) == {
        "FILTERS",
        "USES_FILTER",
        "YIELDS_ADMITTED_SET",
        "HAS_COMMUTATION_RESULT",
    }
    assert outgoing["FILTERS"]["targetLogicalId"] == "scale-state:1453"
    assert outgoing["USES_FILTER"]["targetLabel"] == "CourtFilterOperator"
    assert outgoing["YIELDS_ADMITTED_SET"]["targetLabel"] == "PentatonicSetClass"
    commutation_edges = [
        edge
        for edge in snapshot["relationships"]
        if edge["sourceLogicalId"] == application_id
        and edge["relationshipType"] == "HAS_COMMUTATION_RESULT"
    ]
    assert len(commutation_edges) == 2


def test_pole_registers_only_attach_to_allowed_owner_labels() -> None:
    snapshot = _snapshot()
    edge = next(
        edge
        for edge in snapshot["relationships"]
        if edge["relationshipType"] == "HAS_POLE_REGISTER"
    )
    assert edge["sourceLabel"] == "CourtState"
    assert edge["targetLabel"] == "PoleRegister"

    with pytest.raises(CourtGraphProjectionError, match="pole_register_owner_label_invalid"):
        PoleRegisterProjection(
            pole_register_id="invalid",
            owner_label="ScaleState",
            owner_id="scale-state:1453",
            internal_poles=(),
            source_sha256=FILTER_SOURCE_SHA256,
            admission_status="proposed",
        )


def test_projection_bytes_are_input_order_independent() -> None:
    first = _snapshot()
    second = _snapshot(reverse_commutations=True)

    assert verify_court_graph_projection(first)
    assert verify_court_graph_projection(second)
    assert first["projectionFingerprint"] == second["projectionFingerprint"]
    assert serialize_court_graph_projection(first) == serialize_court_graph_projection(second)


def test_tampered_record_or_projection_fingerprint_is_rejected() -> None:
    snapshot = _snapshot()
    tampered_record = json.loads(serialize_court_graph_projection(snapshot))
    tampered_record["nodes"][0]["admissionStatus"] = "canonical"
    assert not verify_court_graph_projection(tampered_record)

    tampered_root = json.loads(serialize_court_graph_projection(snapshot))
    tampered_root["projectionFingerprint"] = "0" * 64
    assert not verify_court_graph_projection(tampered_root)

    reordered = json.loads(serialize_court_graph_projection(snapshot))
    reordered["nodes"].reverse()
    reordered_core = {
        key: value for key, value in reordered.items() if key != "projectionFingerprint"
    }
    reordered["projectionFingerprint"] = sha256_payload(reordered_core)
    assert not verify_court_graph_projection(reordered)


def test_filter_result_must_equal_source_mask_and_filter_mask() -> None:
    profile, state, operator, _, commutations, application, _, _ = _inputs()
    wrong_set = PentatonicSetClassProjection(
        set_class_id="wrong",
        pitch_mask=PitchClassSet.from_pitch_classes((0, 2, 3, 5, 7)).mask,
        source_sha256=FILTER_SOURCE_SHA256,
        admission_status="proposed",
    )
    wrong_application = CourtFilterApplicationProjection(
        application_id=application.application_id,
        harmonic_profile_sha256=profile.fingerprint_sha256,
        filter_id=operator.filter_id,
        yielded_set_class_id=wrong_set.set_class_id,
        commutation_ids=application.commutation_ids,
        source_sha256=application.source_sha256,
        admission_status=application.admission_status,
    )

    with pytest.raises(CourtGraphProjectionError, match="filter_application_result_mask_mismatch"):
        build_court_graph_projection(
            (profile,),
            (state,),
            filter_operators=(operator,),
            pentatonic_set_classes=(wrong_set,),
            filter_applications=(wrong_application,),
            commutation_records=commutations,
        )


def test_duplicate_profile_application_and_pole_identities_fail_closed() -> None:
    profile, state, operator, set_class, commutations, application, position, pole = _inputs()
    alternate_profile = HarmonicProfile.from_pitch_classes(
        subject_id=profile.subject_id,
        source_id="alternate-ledger:1453",
        source_sha256=profile.source_sha256,
        pitch_classes=profile.rooted_scale.pitch_set.pitch_classes,
        root=profile.rooted_scale.root,
    )
    common = {
        "filter_operators": (operator,),
        "pentatonic_set_classes": (set_class,),
        "filter_applications": (application,),
        "commutation_records": commutations,
        "rooted_positions": (position,),
        "pole_registers": (pole,),
    }
    with pytest.raises(CourtGraphProjectionError, match="duplicate_scale_state_harmonic_profile"):
        build_court_graph_projection((profile, alternate_profile), (state,), **common)
    with pytest.raises(CourtGraphProjectionError, match="duplicate_filter_application_id"):
        build_court_graph_projection(
            (profile,),
            (state,),
            **{**common, "filter_applications": (application, application)},
        )
    with pytest.raises(CourtGraphProjectionError, match="duplicate_pole_register_id"):
        build_court_graph_projection(
            (profile,),
            (state,),
            **{**common, "pole_registers": (pole, pole)},
        )
    with pytest.raises(CourtGraphProjectionError, match="duplicate_court_state_sha256"):
        build_court_graph_projection(
            (profile,),
            (state, state),
            **common,
        )


def test_semantically_tampered_relationship_is_rejected_after_rehash() -> None:
    snapshot = json.loads(serialize_court_graph_projection(_snapshot()))
    edge = next(
        edge for edge in snapshot["relationships"] if edge["relationshipType"] == "HAS_TRIAD"
    )
    edge["sourceScaleStateId"] = 1
    edge_core = {key: value for key, value in edge.items() if key != "recordSha256"}
    edge["recordSha256"] = sha256_payload(edge_core)
    _rehash_snapshot(snapshot)

    assert not verify_court_graph_projection(snapshot)


def test_semantically_tampered_filter_algebra_is_rejected_after_rehash() -> None:
    snapshot = json.loads(serialize_court_graph_projection(_snapshot()))
    application = next(
        node for node in snapshot["nodes"] if node["label"] == "CourtFilterApplication"
    )
    application["properties"]["resultMask"] = 1
    application_core = {
        key: value for key, value in application.items() if key != "recordSha256"
    }
    application["recordSha256"] = sha256_payload(application_core)
    _rehash_snapshot(snapshot)

    assert not verify_court_graph_projection(snapshot)


def test_extra_degree_edge_and_noncanonical_summaries_are_rejected() -> None:
    snapshot = json.loads(serialize_court_graph_projection(_snapshot()))
    duplicate = dict(
        next(
            edge
            for edge in snapshot["relationships"]
            if edge["relationshipType"] == "HAS_TRIAD"
        )
    )
    duplicate["logicalId"] = duplicate["logicalId"] + ":duplicate"
    duplicate_core = {
        key: value for key, value in duplicate.items() if key != "recordSha256"
    }
    duplicate["recordSha256"] = sha256_payload(duplicate_core)
    snapshot["relationships"].append(duplicate)
    snapshot["relationships"].sort(key=lambda edge: edge["logicalId"])
    snapshot["counts"]["relationshipCount"] += 1
    _rehash_snapshot(snapshot)
    assert not verify_court_graph_projection(snapshot)

    bad_references = json.loads(serialize_court_graph_projection(_snapshot()))
    bad_references["scaleStateReferences"].append(
        {"logicalId": "scale-state:1", "scaleStateId": 1}
    )
    bad_references["counts"]["scaleStateReferenceCount"] += 1
    _rehash_snapshot(bad_references)
    assert not verify_court_graph_projection(bad_references)

    bad_sources = json.loads(serialize_court_graph_projection(_snapshot()))
    bad_sources["sourceFingerprints"] = ["0" * 64]
    _rehash_snapshot(bad_sources)
    assert not verify_court_graph_projection(bad_sources)


def test_snapshot_commutation_query_enforces_catalog_row_limit() -> None:
    profile, state, operator, set_class, _, application, _, _ = _inputs()
    commutations = tuple(
        CourtCommutationProjection(
            commutation_id=f"C2:R7:1453:{index:03d}",
            mutation_operator_id="R7",
            result="does_not_commute",
            route_semantics="both_routes_defined",
            source_sha256=FILTER_SOURCE_SHA256,
            admission_status="proposed",
        )
        for index in range(101)
    )
    bounded_application = CourtFilterApplicationProjection(
        application_id=application.application_id,
        harmonic_profile_sha256=application.harmonic_profile_sha256,
        filter_id=application.filter_id,
        yielded_set_class_id=application.yielded_set_class_id,
        commutation_ids=tuple(item.commutation_id for item in commutations),
        source_sha256=application.source_sha256,
        admission_status=application.admission_status,
    )
    snapshot = build_court_graph_projection(
        (profile,),
        (state,),
        filter_operators=(operator,),
        pentatonic_set_classes=(set_class,),
        filter_applications=(bounded_application,),
        commutation_records=commutations,
    )

    rows = execute_court_snapshot_query(
        snapshot,
        "court_filter_commutation_outputs",
        {"applicationId": application.application_id},
    )
    assert len(rows) == 100


def test_ingestion_batches_are_stable_bounded_and_idempotent_by_construction() -> None:
    snapshot = _snapshot()
    first = iter_cypher_ingestion_batches(snapshot, batch_size=2)
    second = iter_cypher_ingestion_batches(snapshot, batch_size=2)

    assert [batch.sequence for batch in first] == list(range(1, len(first) + 1))
    assert [batch.canonical_bytes() for batch in first] == [
        batch.canonical_bytes() for batch in second
    ]
    assert all(len(batch.parameters["records"]) <= 2 for batch in first)
    assert all("MERGE" in batch.cypher for batch in first)
    assert all(not re.search(r"\b(?:CREATE|DELETE|DETACH)\b", batch.cypher) for batch in first)
    assert first[0].kind == "references:ScaleState"


def test_named_queries_are_allow_listed_read_only_bounded_and_stable() -> None:
    assert set(COURT_QUERY_CATALOG) == {
        "degree_triads_for_scale",
        "modal_scale_states_by_triad_quality",
        "modal_scale_states_by_interval_vector",
        "court_filter_commutation_outputs",
    }
    for spec in COURT_QUERY_CATALOG.values():
        assert spec.max_rows <= 100
        assert spec.max_depth <= 3
        assert spec.timeout_ms <= 1000
        assert "ORDER BY" in spec.cypher
        assert "LIMIT" in spec.cypher
        assert not re.search(
            r"\b(?:CREATE|MERGE|SET|DELETE|DETACH|DROP|REMOVE|CALL)\b",
            spec.cypher,
            flags=re.IGNORECASE,
        )


def test_snapshot_query_parity_for_degree_quality_and_interval_vector() -> None:
    snapshot = _snapshot()
    profile = _inputs()[0]
    degree_rows = execute_court_snapshot_query(
        snapshot, "degree_triads_for_scale", {"scaleStateId": 1453}
    )
    quality_rows = execute_court_snapshot_query(
        snapshot,
        "modal_scale_states_by_triad_quality",
        {"quality": "minor", "limit": 100},
    )
    interval_rows = execute_court_snapshot_query(
        snapshot,
        "modal_scale_states_by_interval_vector",
        {"intervalVector": list(profile.rooted_scale.pitch_set.interval_vector)},
    )

    assert len(degree_rows) == 7
    assert [row["degree"] for row in degree_rows] == list(range(1, 8))
    assert quality_rows
    assert all(row["quality"] == "minor" for row in quality_rows)
    assert interval_rows == (
        {
            "harmonicProfileSha256": profile.fingerprint_sha256,
            "scaleStateId": 1453,
        },
    )


def test_snapshot_query_parity_for_filter_commutation_output() -> None:
    rows = execute_court_snapshot_query(
        _snapshot(),
        "court_filter_commutation_outputs",
        {"applicationId": "C2:1453"},
    )

    assert [row["commutationId"] for row in rows] == ["C2:L7:1453", "C2:R7:1453"]
    assert all(row["scaleStateId"] == 1453 for row in rows)
    assert all(row["yieldedPitchMask"] == COURT_MASK for row in rows)
    assert {row["routeSemantics"] for row in rows} == {
        "both_routes_defined",
        "mutation_then_filter_only",
    }


def test_named_query_parameter_contract_rejects_unbounded_or_unknown_input() -> None:
    with pytest.raises(CourtGraphProjectionError, match="court_query_limit_invalid"):
        normalize_court_query_parameters(
            "modal_scale_states_by_triad_quality",
            {"quality": "minor", "limit": 101},
        )
    with pytest.raises(CourtGraphProjectionError, match="court_query_parameter_unknown"):
        normalize_court_query_parameters(
            "degree_triads_for_scale",
            {"scaleStateId": 1453, "cypher": "MATCH (n) RETURN n"},
        )


def test_cypher_schema_covers_every_new_node_and_relationship_type() -> None:
    schema = (ROOT / "neo4j/court-mathematics/schema.cypher").read_text(encoding="utf-8")
    validation = (ROOT / "neo4j/court-mathematics/validation.cypher").read_text(
        encoding="utf-8"
    )
    for label in (
        "Triad",
        "CourtFilterApplication",
        "CourtFilterOperator",
        "PentatonicSetClass",
        "CourtCommutationRecord",
        "CourtState",
        "CourtRootedPosition",
        "PoleRegister",
    ):
        assert f"(n:{label})" in schema
    for relationship_type in (
        "HAS_TRIAD",
        "FILTERS",
        "USES_FILTER",
        "YIELDS_ADMITTED_SET",
        "HAS_COMMUTATION_RESULT",
        "HAS_POLE_REGISTER",
    ):
        assert f"[r:{relationship_type}]" in schema
    assert "IS UNIQUE" in schema
    assert "IS NOT NULL" in schema
    assert "CREATE INDEX" in schema
    assert "pole_register_endpoint_labels" in validation
    assert "degree_triad_narrow_cardinality" in validation


def test_projection_module_has_zero_transition_runtime_dependency() -> None:
    source = (ROOT / "src/governor/court_graph_projection.py").read_text(encoding="utf-8")
    query_source = (ROOT / "src/governor/court_graph_queries.py").read_text(encoding="utf-8")
    assert "transitions" not in source
    assert "transitions" not in query_source


def test_generator_cli_reproduces_identical_snapshot_and_batches(tmp_path: Path) -> None:
    profile, state, _, _, commutations, _, _, _ = _inputs()
    base = {
        "profileAdmissionStatus": "canonical",
        "harmonicProfiles": [
            {
                "subjectId": profile.subject_id,
                "sourceId": profile.source_id,
                "sourceSha256": profile.source_sha256,
                "pitchClasses": list(profile.rooted_scale.pitch_set.pitch_classes),
                "rootPc": profile.rooted_scale.root,
            }
        ],
        "courtStates": [
            {
                "courtPositionId": state.court_position_id,
                "harmonicProfileSha256": profile.fingerprint_sha256,
                "courtPolicySha256": state.court_policy_sha256,
            }
        ],
        "filterOperators": [
            {
                "filterId": "filter:C2",
                "courtMask": COURT_MASK,
                "sourceSha256": FILTER_SOURCE_SHA256,
                "admissionStatus": "proposed",
            }
        ],
        "pentatonicSetClasses": [
            {
                "setClassId": "5-35:C2",
                "pitchMask": COURT_MASK,
                "sourceSha256": FILTER_SOURCE_SHA256,
                "admissionStatus": "proposed",
            }
        ],
        "commutationRecords": [
            {
                "commutationId": item.commutation_id,
                "mutationOperatorId": item.mutation_operator_id,
                "result": item.result,
                "routeSemantics": item.route_semantics,
                "ledgerPointer": item.ledger_pointer,
                "sourceSha256": item.source_sha256,
                "admissionStatus": item.admission_status,
            }
            for item in commutations
        ],
        "filterApplications": [
            {
                "applicationId": "C2:1453",
                "harmonicProfileSha256": profile.fingerprint_sha256,
                "filterId": "filter:C2",
                "yieldedSetClassId": "5-35:C2",
                "commutationIds": [item.commutation_id for item in commutations],
                "sourceSha256": FILTER_SOURCE_SHA256,
                "admissionStatus": "proposed",
            }
        ],
    }
    first_input = tmp_path / "first.json"
    second_input = tmp_path / "second.json"
    first_input.write_text(json.dumps(base), encoding="utf-8")
    reordered = {**base, "commutationRecords": list(reversed(base["commutationRecords"]))}
    second_input.write_text(json.dumps(reordered), encoding="utf-8")

    outputs = []
    for index, input_path in enumerate((first_input, second_input)):
        snapshot_path = tmp_path / f"snapshot-{index}.json"
        batch_path = tmp_path / f"batches-{index}.json"
        subprocess.run(
            [
                sys.executable,
                str(ROOT / "scripts/generate-court-graph.py"),
                "--input",
                str(input_path),
                "--snapshot",
                str(snapshot_path),
                "--batches",
                str(batch_path),
                "--batch-size",
                "2",
            ],
            cwd=ROOT,
            check=True,
        )
        outputs.append((snapshot_path.read_bytes(), batch_path.read_bytes()))

    assert outputs[0] == outputs[1]
