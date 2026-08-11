from __future__ import annotations

import csv
import json
import os
from pathlib import Path
import subprocess
import sys

from governor.court_ledger import append_court_transition
from governor.harmonic_models import court_state_body, create_court_state
from governor.hashing import canonical_json_bytes
from governor.models import thaw_json

from ._oracles import NETWORK_JSON, ROOT


def _csv_rows(name: str):
    with (ROOT / "neo4j/csv" / name).open(newline="", encoding="utf-8") as handle:
        return tuple(csv.DictReader(handle))


def test_benchmark_topology_locks_match_canonical_json() -> None:
    network = json.loads(NETWORK_JSON.read_text(encoding="utf-8"))
    nodes = {node["id"]: node for node in network["nodes"]}

    assert {
        key: nodes[1749][key]
        for key in (
            "name",
            "forte",
            "pitchSet",
            "office",
            "officeIndex",
            "tier",
            "role",
            "fineRole",
            "assignmentStatus",
            "resolutionClass",
            "chirality",
        )
    } == {
        "name": "Acoustic",
        "forte": "7-34",
        "pitchSet": "{0,2,4,6,7,9,10}",
        "office": "Moon",
        "officeIndex": 1,
        "tier": "A1",
        "role": "anchor",
        "fineRole": "anchor_A1",
        "assignmentStatus": "validated",
        "resolutionClass": "validated_A1_anchor",
        "chirality": "achiral",
    }
    assert {
        key: nodes[2477][key]
        for key in (
            "name",
            "forte",
            "pitchSet",
            "office",
            "officeIndex",
            "tier",
            "role",
            "fineRole",
            "assignmentStatus",
            "resolutionClass",
            "chirality",
        )
    } == {
        "name": "Harmonic Minor",
        "forte": "7-32",
        "pitchSet": "{0,2,3,5,7,8,11}",
        "office": "Jupiter",
        "officeIndex": 4,
        "tier": "A0",
        "role": "satellite",
        "fineRole": "satellite_A0",
        "assignmentStatus": "inherited",
        "resolutionClass": "A0_direct_satellite",
        "chirality": "chiral",
    }
    assert nodes[2477]["parents"] == [
        {
            "parentId": 1453,
            "tier": "A0",
            "phaseDelta": 0,
            "mode": "single_degree",
            "mutation": "D7 10→11 (+1)",
            "degree": 7,
            "degreeGovernor": "Moon",
            "provenance": "A0 eligible relation",
        }
    ]
    assert {
        key: nodes[223][key]
        for key in (
            "name",
            "forte",
            "pitchSet",
            "office",
            "officeIndex",
            "tier",
            "role",
            "fineRole",
            "assignmentStatus",
            "relationalOffice",
            "contactCount",
            "contactTierCounts",
            "chirality",
        )
    } == {
        "name": "Scale 223",
        "forte": "7-4",
        "pitchSet": "{0,1,2,3,4,6,7}",
        "office": None,
        "officeIndex": None,
        "tier": None,
        "role": "boundary",
        "fineRole": "oriented_convergence",
        "assignmentStatus": "unassigned",
        "relationalOffice": "Jupiter",
        "contactCount": 2,
        "contactTierCounts": {"D3": 1, "D6": 1},
        "chirality": "chiral",
    }


def test_benchmark_topology_locks_match_neo4j_projection_csvs() -> None:
    states = {int(row["id"]): row for row in _csv_rows("scale-states.csv")}
    seats = _csv_rows("occupies-office.csv")
    evidence = _csv_rows("relational-office-evidence.csv")
    governs = _csv_rows("governs.csv")

    expected = {
        1749: {
            "name": "Acoustic",
            "forte": "7-34",
            "pitch_set": "{0,2,4,6,7,9,10}",
            "office": "Moon",
            "office_index": "1",
            "tier": "A1",
            "role": "anchor",
            "fine_role": "anchor_A1",
            "assignment_status": "validated",
            "resolution_class": "validated_A1_anchor",
            "chirality": "achiral",
        },
        2477: {
            "name": "Harmonic Minor",
            "forte": "7-32",
            "pitch_set": "{0,2,3,5,7,8,11}",
            "office": "Jupiter",
            "office_index": "4",
            "tier": "A0",
            "role": "satellite",
            "fine_role": "satellite_A0",
            "assignment_status": "inherited",
            "resolution_class": "A0_direct_satellite",
            "chirality": "chiral",
        },
        223: {
            "name": "Scale 223",
            "forte": "7-4",
            "pitch_set": "{0,1,2,3,4,6,7}",
            "office": "",
            "office_index": "",
            "tier": "",
            "role": "boundary",
            "fine_role": "oriented_convergence",
            "assignment_status": "unassigned",
            "resolution_class": "validated_oriented_convergence_office_withheld",
            "chirality": "chiral",
        },
    }
    for state_id, fields in expected.items():
        assert {key: states[state_id][key] for key in fields} == fields
    assert states[223]["relational_office"] == "Jupiter"
    assert states[223]["contact_count"] == "2"
    assert states[223]["contact_tier_counts_json"] == '{"D3":1,"D6":1}'

    assert [row["id"] for row in seats if row["source_scale_id"] == "1749"] == [
        "occupies:1749:Moon"
    ]
    assert [row["id"] for row in seats if row["source_scale_id"] == "2477"] == [
        "occupies:2477:Jupiter"
    ]
    assert [row for row in seats if row["source_scale_id"] == "223"] == []
    evidence_223 = [row for row in evidence if row["source_scale_id"] == "223"]
    assert len(evidence_223) == 1
    assert evidence_223[0]["id"] == "office-evidence:223:Jupiter"
    assert evidence_223[0]["contact_office"] == "Jupiter"
    assert evidence_223[0]["evidence_count"] == "2"
    assert evidence_223[0]["categorical"] == "false"
    incoming = [row for row in governs if row["target_scale_id"] == "2477"]
    assert len(incoming) == 1
    transition = incoming[0]
    assert transition["id"] == "governs:A0:1453:2477:0"
    assert transition["hamming"] == "2"
    assert transition["mutation"] == "D7 10→11 (+1)"
    assert transition["degree"] == "7"
    assert transition["degree_governor"] == "Moon"
    assert transition["selected"] == "true"


def test_registered_court_operations_preserve_topology_authority() -> None:
    locked_paths = (
        NETWORK_JSON,
        ROOT / "neo4j/csv/scale-states.csv",
        ROOT / "neo4j/csv/occupies-office.csv",
        ROOT / "neo4j/csv/governs.csv",
        ROOT / "neo4j/csv/relational-office-evidence.csv",
    )
    before = {path: path.read_bytes() for path in locked_paths}
    initial = create_court_state(
        court_position_id="court-position:C1",
        harmonic_profile_sha256="1" * 64,
        court_policy_sha256="2" * 64,
    )
    advance_result = create_court_state(
        court_position_id="court-position:C2",
        revision=1,
        harmonic_profile_sha256=initial.harmonic_profile_sha256,
        court_policy_sha256=initial.court_policy_sha256,
        ledger_anchor=initial.ledger_anchor,
    )
    events, advanced = append_court_transition(
        (), initial, advance_result, operation_id="court:advance"
    )
    retreat_result = create_court_state(
        court_position_id="court-position:C1",
        revision=2,
        harmonic_profile_sha256=advanced.harmonic_profile_sha256,
        court_policy_sha256=advanced.court_policy_sha256,
        ledger_anchor=advanced.ledger_anchor,
    )
    events, retreated = append_court_transition(
        events, advanced, retreat_result, operation_id="court:retreat"
    )

    forbidden_keys = {
        "aspectprimarygovernor",
        "canonicalheptatonictopology",
        "degreegovernor",
        "hasgovernorseat",
        "mutationdegreegovernor",
        "office",
        "officeevidence",
        "officeindex",
        "operationalgovernor",
        "primarygovernor",
        "relationaloffice",
        "runtimeoperationalgovernor",
        "scalestatehasgovernorseat",
        "scalestateoffice",
        "scalestateofficeindex",
        "topologyofficeevidence",
    }

    def contains_forbidden_key(value: object) -> bool:
        if isinstance(value, dict):
            return any(
                "".join(
                    character
                    for character in str(key).casefold()
                    if character.isalnum()
                )
                in forbidden_keys
                or contains_forbidden_key(item)
                for key, item in value.items()
            )
        if isinstance(value, (list, tuple)):
            return any(contains_forbidden_key(item) for item in value)
        return False

    assert retreated.court_position_id == initial.court_position_id
    assert not contains_forbidden_key(court_state_body(retreated))
    assert all(not contains_forbidden_key(thaw_json(event.payload)) for event in events)
    assert {path: path.read_bytes() for path in locked_paths} == before

    network = json.loads(NETWORK_JSON.read_text(encoding="utf-8"))
    nodes = {node["id"]: node for node in network["nodes"]}
    assert (nodes[1749]["office"], nodes[1749]["assignmentStatus"]) == (
        "Moon",
        "validated",
    )
    assert (nodes[2477]["office"], nodes[2477]["parents"][0]["degreeGovernor"]) == (
        "Jupiter",
        "Moon",
    )
    assert (nodes[223]["office"], nodes[223]["relationalOffice"]) == (None, "Jupiter")


def test_graph_export_offline_hashes_and_query_files_are_byte_reproducible(
    tmp_path: Path,
) -> None:
    fixture = ROOT / "tests/court_graph/fixture-input.json"
    outputs = []
    for index, seed in enumerate(("1", "987")):
        snapshot = tmp_path / f"snapshot-{index}.json"
        batches = tmp_path / f"batches-{index}.json"
        queries = tmp_path / f"queries-{index}.json"
        environment = {**os.environ, "PYTHONHASHSEED": seed, "TZ": "UTC" if index == 0 else "Pacific/Honolulu"}
        subprocess.run(
            [
                sys.executable,
                str(ROOT / "scripts/generate-court-graph.py"),
                "--input",
                str(fixture),
                "--snapshot",
                str(snapshot),
                "--batches",
                str(batches),
                "--query-results",
                str(queries),
                "--batch-size",
                "2",
            ],
            cwd=ROOT,
            env=environment,
            check=True,
        )
        outputs.append((snapshot.read_bytes(), batches.read_bytes(), queries.read_bytes()))

    assert outputs[0] == outputs[1]
    document = json.loads(outputs[0][0])
    assert outputs[0][0] == canonical_json_bytes(document)
    court_node = next(node for node in document["nodes"] if node["label"] == "CourtState")
    fixture_document = json.loads(fixture.read_text(encoding="utf-8"))
    runtime_input = fixture_document["runtimeSessions"][0]
    assert runtime_input["sessionId"] == "crt-306-runtime-fixture"
    assert court_node["properties"]["sessionId"] == runtime_input["sessionId"]
    assert court_node["properties"]["courtPositionId"] == "C4"
    assert court_node["properties"]["eventCount"] == 2
    assert document["counts"] == {
        "nodeCount": 21,
        "relationshipCount": 19,
        "scaleStateReferenceCount": 1,
    }
