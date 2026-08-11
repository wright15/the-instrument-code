#!/usr/bin/env python3
"""Generate the bounded CRT-306 fixture snapshot and deterministic Cypher batches."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))
sys.path.insert(0, str(ROOT / "court-mathematics" / "src"))

from court_mathematics import HarmonicProfile  # noqa: E402
from governor.court_graph_projection import (  # noqa: E402
    CourtCommutationProjection,
    CourtFilterApplicationProjection,
    CourtFilterOperatorProjection,
    CourtRootedPositionProjection,
    PentatonicSetClassProjection,
    PoleRegisterProjection,
    VerifiedCourtRuntimeSessionProjection,
    build_court_graph_projection,
    iter_cypher_ingestion_batches,
    serialize_court_graph_projection,
)
from governor.court_graph_queries import (  # noqa: E402
    execute_court_snapshot_query,
    normalize_court_query_parameters,
)
from governor.court_runtime import (  # noqa: E402
    apply_court_move,
    create_court_route_context,
    create_court_runtime_state,
    create_topological_translocation_record,
    load_court_runtime_policy,
    replay_court_runtime_ledger,
    validate_court_move,
)
from governor.evidence import VerificationDecision  # noqa: E402
from governor.hashing import canonical_json_bytes  # noqa: E402


_EXPECTED_RUNTIME_FIXTURE = {
    "sessionId": "crt-306-runtime-fixture",
    "genesisPositionId": "C0",
    "harmonicProfileSha256": "3d48786309d428b467b29fa3473489e6b37b1f9f1efe58247ddd649dce2a2db8",
    "policyFingerprint": "90431c79b8bc06da7e6f5cb5ce207cb6cbfd86519bdb91df5aacc137065ec456",
    "contextFingerprint": "7bfb0cb975fca7bf074a8e6170ac8d7fbd92c0b665bcb42551595f44c9d6364c",
    "capabilities": ["court.transition", "court.translocate"],
    "transitions": [
        {
            "operationId": "court:advance",
            "targetPosition": "C1",
            "evidenceEventIds": ["8" + "1" * 63],
        },
        {
            "operationId": "court:translocate",
            "targetPosition": "C4",
            "operatorId": "R7",
            "forteFamily": "5-23",
            "evidenceEventIds": ["9" + "2" * 63],
        },
    ],
}


def _profile(record):
    return HarmonicProfile.from_pitch_classes(
        subject_id=record["subjectId"],
        source_id=record["sourceId"],
        source_sha256=record["sourceSha256"],
        pitch_classes=record["pitchClasses"],
        root=record["rootPc"],
    )


def _runtime_fixture_session(record):
    if record != _EXPECTED_RUNTIME_FIXTURE:
        raise ValueError("runtime_fixture_recipe_mismatch")
    policy = load_court_runtime_policy()
    if record["policyFingerprint"] != policy.policy_fingerprint:
        raise ValueError("runtime_fixture_policy_fingerprint_mismatch")
    genesis = create_court_runtime_state(
        session_id=record["sessionId"],
        position_id=record["genesisPositionId"],
        harmonic_profile_sha256=record["harmonicProfileSha256"],
        context_fingerprint=record["contextFingerprint"],
        capabilities=tuple(record["capabilities"]),
        policy=policy,
    )
    state = genesis
    events = ()
    for transition in record.get("transitions", ()):
        translocation = None
        route = None
        if transition["operationId"] == "court:translocate":
            translocation = create_topological_translocation_record(
                source_position=state.position_id,
                target_position=transition["targetPosition"],
                operator_id=transition["operatorId"],
                forte_family=transition["forteFamily"],
            )
            route = create_court_route_context(
                forte_family=transition["forteFamily"],
                operator_id=transition["operatorId"],
                source_scale_state_id=translocation.source_scale_state_id,
            )
        move = validate_court_move(
            state,
            transition["operationId"],
            transition["targetPosition"],
            policy=policy,
            translocation_record=translocation,
            route_context=route,
        )
        result = apply_court_move(
            state,
            move,
            events,
            policy=policy,
            verification_decision=VerificationDecision(
                True, (), tuple(transition["evidenceEventIds"])
            ),
        )
        if not result.accepted:
            raise ValueError(f"runtime_fixture_transition_rejected:{result.reason_code}")
        state, events = result.state, result.events
    replay = replay_court_runtime_ledger(genesis, events, state.ledger_anchor, policy=policy)
    if not replay.valid or replay.state != state:
        raise ValueError(f"runtime_fixture_replay_invalid:{replay.reason_code}")
    return VerifiedCourtRuntimeSessionProjection(genesis, events, state.ledger_anchor)


def _projection(document):
    profiles = tuple(_profile(record) for record in document.get("harmonicProfiles", ()))
    runtime_records = document.get("runtimeSessions", ())
    if not isinstance(runtime_records, list) or len(runtime_records) != 1:
        raise ValueError("runtime_fixture_session_cardinality_invalid")
    sessions = tuple(_runtime_fixture_session(record) for record in runtime_records)
    return build_court_graph_projection(
        profiles,
        sessions,
        filter_operators=(
            CourtFilterOperatorProjection(
                filter_id=record["filterId"],
                court_mask=record["courtMask"],
                source_sha256=record["sourceSha256"],
                admission_status=record["admissionStatus"],
                operator_type=record.get("operatorType", "linear_diagonal"),
            )
            for record in document.get("filterOperators", ())
        ),
        pentatonic_set_classes=(
            PentatonicSetClassProjection(
                set_class_id=record["setClassId"],
                pitch_mask=record["pitchMask"],
                source_sha256=record["sourceSha256"],
                admission_status=record["admissionStatus"],
            )
            for record in document.get("pentatonicSetClasses", ())
        ),
        filter_applications=(
            CourtFilterApplicationProjection(
                application_id=record["applicationId"],
                harmonic_profile_sha256=record["harmonicProfileSha256"],
                filter_id=record["filterId"],
                yielded_set_class_id=record["yieldedSetClassId"],
                commutation_ids=tuple(record.get("commutationIds", ())),
                source_sha256=record["sourceSha256"],
                admission_status=record["admissionStatus"],
            )
            for record in document.get("filterApplications", ())
        ),
        commutation_records=(
            CourtCommutationProjection(
                commutation_id=record["commutationId"],
                mutation_operator_id=record["mutationOperatorId"],
                result=record["result"],
                route_semantics=record["routeSemantics"],
                ledger_pointer=record.get("ledgerPointer"),
                source_sha256=record["sourceSha256"],
                admission_status=record["admissionStatus"],
            )
            for record in document.get("commutationRecords", ())
        ),
        rooted_positions=(
            CourtRootedPositionProjection(
                position_id=record["positionId"],
                set_class_id=record["setClassId"],
                pitch_mask=record["pitchMask"],
                root_pc=record["rootPc"],
                source_sha256=record["sourceSha256"],
                admission_status=record["admissionStatus"],
            )
            for record in document.get("rootedPositions", ())
        ),
        pole_registers=(
            PoleRegisterProjection(
                pole_register_id=record["poleRegisterId"],
                owner_label=record["ownerLabel"],
                owner_id=record["ownerId"],
                internal_poles=tuple(record.get("internalPoles", ())),
                source_sha256=record["sourceSha256"],
                admission_status=record["admissionStatus"],
            )
            for record in document.get("poleRegisters", ())
        ),
        profile_admission_status=document.get("profileAdmissionStatus", "canonical"),
    )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--snapshot", required=True, type=Path)
    parser.add_argument("--batches", required=True, type=Path)
    parser.add_argument("--query-results", type=Path)
    parser.add_argument("--batch-size", type=int, default=100)
    args = parser.parse_args()

    document = json.loads(args.input.read_text(encoding="utf-8"))
    snapshot = _projection(document)
    batches = iter_cypher_ingestion_batches(snapshot, batch_size=args.batch_size)
    args.snapshot.parent.mkdir(parents=True, exist_ok=True)
    args.batches.parent.mkdir(parents=True, exist_ok=True)
    args.snapshot.write_bytes(serialize_court_graph_projection(snapshot))
    args.batches.write_bytes(
        canonical_json_bytes(
            [
                {
                    "cypher": batch.cypher,
                    "kind": batch.kind,
                    "parameters": dict(batch.parameters),
                    "sequence": batch.sequence,
                }
                for batch in batches
            ]
        )
    )
    if args.query_results is not None:
        query_results = []
        for request in document.get("queryCorpus", ()):
            query_id = request["queryId"]
            request_parameters = request.get("parameters", {})
            parameters = normalize_court_query_parameters(
                query_id, request_parameters
            )
            query_results.append(
                {
                    "parameters": parameters,
                    "queryId": query_id,
                    "rows": list(
                        execute_court_snapshot_query(
                            snapshot,
                            query_id,
                            request_parameters,
                        )
                    ),
                }
            )
        args.query_results.parent.mkdir(parents=True, exist_ok=True)
        args.query_results.write_bytes(canonical_json_bytes(query_results))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
