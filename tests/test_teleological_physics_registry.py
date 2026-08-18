from __future__ import annotations

import importlib.util
import json
from pathlib import Path
import sys
from typing import Any

import jsonschema
import pytest
import yaml


ROOT = Path(__file__).resolve().parents[1]
REGISTRY_PATH = ROOT / "schemas/teleological_physics_registry_v1.0.0.yaml"
SCHEMA_PATH = ROOT / "schemas/teleological-physics-registry-v1.0.0.schema.json"
REPORT_SCHEMA_PATH = (
    ROOT / "schemas/teleological-physics-registry-validation-report-v1.0.0.schema.json"
)
REPORT_PATH = ROOT / "qa/teleological-physics-registry-validation.json"
VALIDATOR_PATH = ROOT / "scripts/validate-teleological-physics-registry.py"

EXPECTED_XOR_SUPPORTS = [[4, 5], [9, 10], [2, 3], [7, 8]]
EXPECTED_POLE_ORDER = ["Mars", "Jupiter", "Venus", "Saturn"]


def _load_module(path: Path, name: str):
    spec = importlib.util.spec_from_file_location(name, path)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


VALIDATOR = _load_module(VALIDATOR_PATH, "teleological_physics_validator")


@pytest.fixture(scope="module")
def document() -> dict[str, Any]:
    return yaml.safe_load(REGISTRY_PATH.read_text(encoding="utf-8"))


def test_registry_is_schema_valid_and_proposed(document) -> None:
    jsonschema.Draft202012Validator(
        json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
    ).validate(document)
    assert document["metadata"]["admission_status"] == "proposed"
    assert document["metadata"]["physical_quantity_claim"] is False
    assert document["metadata"]["no_electromagnetic_equivalence"] is True
    assert document["metadata"]["equations_symbolic_only"] is True
    VALIDATOR.verify_registry_document(document)


def test_eight_transitions_replay_policy_exactly(document) -> None:
    transitions = document["transitions"]
    assert len(transitions) == 8
    policy = json.loads(
        (ROOT / "schemas/court-runtime-policy.json").read_text(encoding="utf-8")
    )
    policy_pairs = {
        (item["source"], item["target"], item["operationId"])
        for item in policy["ordinaryMoves"]
    }
    registry_pairs = {
        (item["from_position"], item["to_position"], item["operation_id"])
        for item in transitions
    }
    assert registry_pairs == policy_pairs


def test_xor_supports_and_pole_changes_replay_sources(document) -> None:
    harmonic = json.loads(
        (
            ROOT
            / "seven-governors-harmonic-invariants-v0.1.0/canonical/harmonic-invariant-registry.json"
        ).read_text(encoding="utf-8")
    )
    xor_by_edge = harmonic["courtGeometry"]["xorSupports"]
    positions = {
        "C0": "0000",
        "C1": "1000",
        "C2": "1100",
        "C3": "1110",
        "C4": "1111",
    }
    for item in document["transitions"]:
        edge = min(int(item["from_position"][1]), int(item["to_position"][1]))
        assert item["xor_support"] == xor_by_edge[edge]
        from_vector = positions[item["from_position"]]
        to_vector = positions[item["to_position"]]
        flipped = [
            EXPECTED_POLE_ORDER[index]
            for index in range(4)
            if from_vector[index] != to_vector[index]
        ]
        governor = {
            "Fire (Mars)": "Mars",
            "Air (Jupiter)": "Jupiter",
            "Water (Venus)": "Venus",
            "Earth (Saturn)": "Saturn",
        }[item["element"]]
        assert flipped == [governor]
        expected = (
            "external_to_internal"
            if from_vector[[i for i in range(4) if from_vector[i] != to_vector[i]][0]] == "0"
            else "internal_to_external"
        )
        assert item["pole_change"] == expected


def test_mercury_engine_interface_is_not_a_transition(document) -> None:
    interfaces = document["engine_interface"]
    assert len(interfaces) == 1
    mercury = interfaces[0]
    assert mercury["is_transition"] is False
    assert mercury["is_binary_court_pole"] is False
    assert mercury["pole_change"] == "none"
    assert mercury["xor_support"] is None


def test_no_forbidden_relations_or_physical_claims(document) -> None:
    def walk(value: Any) -> None:
        if isinstance(value, dict):
            for key, item in value.items():
                assert key not in ("SETS_COURT_POLE", "EXECUTES_COURT_MOVE"), key
                walk(item)
        elif isinstance(value, list):
            for item in value:
                walk(item)

    walk(document)
    boundary = document["admission_boundary"]
    assert boundary["writes_court_pole_disposition"] is False
    assert boundary["no_thermodynamic_equivalence"] is True
    assert boundary["kappa_court_access"] == "read_only_replay"
    assert boundary["global_ch_access"] == "no_write"


def test_saturn_and_venus_anchors_align_with_semantic_registry(document) -> None:
    semantic = yaml.safe_load(
        (ROOT / "schemas/semantic_operator_registry_v1.0.1.yaml").read_text(
            encoding="utf-8"
        )
    )
    anchors = {
        item["operator_id"]: item["physical_process"]["symbolic_anchor"]
        for item in semantic["operators"]
    }
    saturn = next(
        item
        for item in document["transitions"]
        if item["transition_id"] == "court_advance_C3_to_C4"
    )
    venus = next(
        item
        for item in document["transitions"]
        if item["transition_id"] == "court_advance_C2_to_C3"
    )
    assert "2d sin" in saturn["physical_process"]["symbolic_anchor"]
    assert "2d sin" in anchors["saturn_degree_raise_v1"]
    assert "(1/2)F/L" in venus["physical_process"]["symbolic_anchor"]
    assert "(1/2)F/L" in anchors["venus_degree_raise_v1"]


def test_negative_mutations_rejected_with_expected_codes(document) -> None:
    results = VALIDATOR._adversarial_results(document)
    assert results == VALIDATOR.EXPECTED_MUTATION_CODES


def test_qa_report_is_schema_valid_fingerprinted_and_passing() -> None:
    report = json.loads(REPORT_PATH.read_text(encoding="utf-8"))
    jsonschema.Draft202012Validator(
        json.loads(REPORT_SCHEMA_PATH.read_text(encoding="utf-8"))
    ).validate(report)
    assert report["verdict"] == "PASS"
    assert report["checksPassed"] == 15
    assert report["checksFailed"] == 0
    check_ids = tuple(item["checkId"] for item in report["checks"])
    assert check_ids == VALIDATOR.REPORT_CHECK_IDS
    core = {key: value for key, value in report.items() if key != "reportFingerprint"}
    assert report["reportFingerprint"] == VALIDATOR._sha256_payload(core)


def test_guards_cover_all_required_boundaries(document) -> None:
    guard_ids = {item["guard_id"] for item in document["guards"]}
    assert guard_ids == {
        "physics_symbolic_only",
        "runtime_owns_transitions",
        "no_court_writes",
        "mercury_not_a_transition",
        "kappa_and_ch_untouched",
        "no_pentatonic_family_claims",
        "crt310_untouched",
        "excluded_relation_vocabulary_absent",
    }
