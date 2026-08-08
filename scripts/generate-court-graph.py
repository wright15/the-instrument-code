#!/usr/bin/env python3
"""Generate a canonical CRT-306 snapshot and deterministic Cypher batches."""

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
    build_court_graph_projection,
    iter_cypher_ingestion_batches,
    serialize_court_graph_projection,
)
from governor.court_graph_queries import (  # noqa: E402
    execute_court_snapshot_query,
    normalize_court_query_parameters,
)
from governor.harmonic_models import create_court_state  # noqa: E402
from governor.hashing import canonical_json_bytes  # noqa: E402
from governor.models import LedgerAnchor  # noqa: E402


def _profile(record):
    return HarmonicProfile.from_pitch_classes(
        subject_id=record["subjectId"],
        source_id=record["sourceId"],
        source_sha256=record["sourceSha256"],
        pitch_classes=record["pitchClasses"],
        root=record["rootPc"],
    )


def _court_state(record):
    anchor = record.get("ledgerAnchor", {})
    return create_court_state(
        court_position_id=record["courtPositionId"],
        harmonic_profile_sha256=record["harmonicProfileSha256"],
        court_policy_sha256=record["courtPolicySha256"],
        revision=record.get("revision", 0),
        ledger_anchor=LedgerAnchor(
            anchor.get("eventCount", 0),
            anchor.get("headSha256", "0" * 64),
        ),
    )


def _projection(document):
    profiles = tuple(_profile(record) for record in document.get("harmonicProfiles", ()))
    states = tuple(_court_state(record) for record in document.get("courtStates", ()))
    return build_court_graph_projection(
        profiles,
        states,
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
