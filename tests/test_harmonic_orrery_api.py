from __future__ import annotations

import asyncio
import json
from pathlib import Path
from types import SimpleNamespace

import jsonschema
import pytest
from starlette.requests import Request

import main


ROOT = Path(__file__).parents[1]
SCHEMA_PATH = ROOT / "schemas/harmonic-orrery-nodes.schema.json"


def _profile_data_by_office() -> dict[str, dict[str, object]]:
    profiles = json.loads(
        (
            ROOT
            / "seven-governors-canonical-feature-profile-registry-v0.1.1"
            / "canonical/canonical-governor-profiles.json"
        ).read_text(encoding="utf-8")
    )["profiles"]
    return {profile["office"]: profile for profile in profiles}


def _photonic_data_by_office() -> dict[str, dict[str, object]]:
    records = json.loads(
        (
            ROOT
            / "seven-governors-canonical-feature-profile-registry-v0.1.1"
            / "canonical/photonic-records.json"
        ).read_text(encoding="utf-8")
    )["records"]
    return {record["office"]: record for record in records}


@pytest.fixture(scope="module")
def candidate() -> main.HarmonicCandidate:
    return main.load_harmonic_candidate()


@pytest.fixture(scope="module")
def neo4j_rows(candidate: main.HarmonicCandidate) -> list[dict[str, object]]:
    profiles = _profile_data_by_office()
    photonic = _photonic_data_by_office()
    rows: list[dict[str, object]] = []

    for descriptor in candidate.records_by_state_id.values():
        office = descriptor["stateGovernor"]
        profile = profiles[office]
        light = photonic[office]
        rows.append(
            {
                "stateId": descriptor["stateId"],
                "nodeId": f"scale:{descriptor['stateId']}",
                "name": descriptor["name"],
                "forteFamily": descriptor["forte"],
                "tier": descriptor["tier"],
                "role": "anchor",
                "chirality": "achiral",
                "office": office,
                "profileId": profile["profileId"],
                "profileVersion": profile["profileVersion"],
                "profileOffice": office,
                "photonicId": light["photonicId"],
                "photonicOffice": office,
                "representativeWavelengthNm": light["representativeWavelengthNm"],
                "photonicCompression": light["photonicCompression"],
                "profileRegistryReleaseId": profile["releaseId"],
                "landforms": profile["domainReferences"]["landforms"],
            }
        )

    return sorted(rows, key=lambda row: (row["tier"], row["office"]))


def test_nodes_response_matches_versioned_schema(
    candidate: main.HarmonicCandidate,
    neo4j_rows: list[dict[str, object]],
) -> None:
    response = main.build_nodes_response(neo4j_rows, candidate).model_dump()
    schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))

    jsonschema.Draft202012Validator(schema).validate(response)
    assert response["schemaVersion"] == "harmonic-orrery.nodes.v2"
    assert response["nodeCount"] == 21
    assert len(response["nodes"]) == 21


def test_nodes_response_preserves_exact_a0_a2_harmonic_values(
    candidate: main.HarmonicCandidate,
    neo4j_rows: list[dict[str, object]],
) -> None:
    response = main.build_nodes_response(neo4j_rows, candidate).model_dump()
    by_state_id = {node["state"]["stateId"]: node for node in response["nodes"]}

    assert by_state_id[2773]["scopedHarmonicDescriptor"] == {
        "coordinateId": "harmonic.CH_A012_q_v1",
        "status": "admitted_scoped_A012",
        "stateGovernor": "Sun",
        "weightedProjection": {"numerator": 193, "denominator": 407},
    }
    assert by_state_id[1373]["scopedHarmonicDescriptor"]["weightedProjection"] == {
        "numerator": 779,
        "denominator": 407,
    }
    assert by_state_id[2773]["state"] == {
        "stateId": 2773,
        "pitchMask": 2773,
        "pitchClasses": [0, 2, 4, 6, 7, 9, 11],
        "intervalVector": [2, 5, 4, 3, 6, 1],
        "chirality": "achiral",
        "nodeId": "scale:2773",
        "name": "Lydian",
        "forteFamily": "7-35",
        "tier": "A0",
        "role": "anchor",
    }


def test_nodes_response_excludes_court_toggle_data(
    candidate: main.HarmonicCandidate,
    neo4j_rows: list[dict[str, object]],
) -> None:
    response = main.build_nodes_response(neo4j_rows, candidate).model_dump()
    serialized = json.dumps(response)

    assert "kappa" not in serialized.lower()
    assert "court" not in serialized.lower()
    assert "is_binary_court_pole" not in serialized
    assert any(node["resolution"]["office"] == "Mercury" for node in response["nodes"])


def test_nodes_response_rejects_a_projection_mismatch(
    candidate: main.HarmonicCandidate,
    neo4j_rows: list[dict[str, object]],
) -> None:
    mismatched = [dict(row) for row in neo4j_rows]
    mismatched[0]["photonicOffice"] = "Moon"

    with pytest.raises(main.HTTPException) as error:
        main.build_nodes_response(mismatched, candidate)

    assert error.value.status_code == 503


def test_nodes_response_rejects_invalid_topology_presentation_data(
    candidate: main.HarmonicCandidate,
    neo4j_rows: list[dict[str, object]],
) -> None:
    invalid_chirality = [dict(row) for row in neo4j_rows]
    invalid_chirality[0]["chirality"] = "unresolved"

    with pytest.raises(main.HTTPException) as error:
        main.build_nodes_response(invalid_chirality, candidate)

    assert error.value.status_code == 503

    invalid_records = {
        state_id: {**record}
        for state_id, record in candidate.records_by_state_id.items()
    }
    invalid_records[2773]["intervalVector"] = [0, 0, 0, 0, 0, 0]
    invalid_candidate = main.HarmonicCandidate(
        release_id=candidate.release_id,
        candidate_id=candidate.candidate_id,
        coordinate_id=candidate.coordinate_id,
        status=candidate.status,
        fingerprint=candidate.fingerprint,
        records_by_state_id=invalid_records,
    )

    with pytest.raises(main.HTTPException) as error:
        main.build_nodes_response(neo4j_rows, invalid_candidate)

    assert error.value.status_code == 503


def test_nodes_query_filters_before_the_optional_landform_match() -> None:
    anchor_match = "MATCH (state:ScaleState)-[:OCCUPIES_OFFICE]->(office:GovernorOffice)"
    optional_match = "OPTIONAL MATCH (canonicalProfile)-[reference:REFERENCES_LANDFORM]"

    assert main.NODES_QUERY.index(anchor_match) < main.NODES_QUERY.index("WHERE state.role")
    assert main.NODES_QUERY.index("WHERE state.role") < main.NODES_QUERY.index(optional_match)


class _FakeResult:
    def __init__(self, rows: list[dict[str, object]]) -> None:
        self._rows = rows

    async def data(self) -> list[dict[str, object]]:
        return self._rows


class _FakeTransaction:
    def __init__(self, rows: list[dict[str, object]]) -> None:
        self._rows = rows

    async def run(self, query: str) -> _FakeResult:
        assert query == main.NODES_QUERY
        return _FakeResult(self._rows)


class _FakeSession:
    def __init__(self, rows: list[dict[str, object]], database: str) -> None:
        self._rows = rows
        self.database = database

    async def __aenter__(self) -> "_FakeSession":
        return self

    async def __aexit__(self, *_: object) -> None:
        return None

    async def execute_read(self, callback):
        return await callback(_FakeTransaction(self._rows))


class _FakeDriver:
    def __init__(self, rows: list[dict[str, object]]) -> None:
        self._rows = rows
        self.database: str | None = None

    def session(self, *, database: str) -> _FakeSession:
        self.database = database
        return _FakeSession(self._rows, database)


def test_nodes_endpoint_reads_the_neo4j_projection(
    candidate: main.HarmonicCandidate,
    neo4j_rows: list[dict[str, object]],
) -> None:
    driver = _FakeDriver(neo4j_rows)
    app = SimpleNamespace(
        state=SimpleNamespace(
            driver=driver,
            settings=SimpleNamespace(database="orrery"),
            harmonic_candidate=candidate,
        )
    )
    request = Request(
        {
            "type": "http",
            "method": "GET",
            "path": "/nodes",
            "headers": [],
            "app": app,
        }
    )

    response = asyncio.run(main.get_nodes(request))

    assert driver.database == "orrery"
    assert response.nodeCount == 21
    assert response.nodes[0].canonicalProfile.domainReferences.landforms
