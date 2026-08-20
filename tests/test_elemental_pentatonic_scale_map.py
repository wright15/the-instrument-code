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
REGISTRY_PATH = ROOT / "schemas/elemental_pentatonic_scale_map_v1.0.0.yaml"
SCHEMA_PATH = ROOT / "schemas/elemental-pentatonic-scale-map-v1.0.0.schema.json"
REPORT_SCHEMA_PATH = (
    ROOT / "schemas/elemental-pentatonic-scale-map-validation-report-v1.0.0.schema.json"
)
REPORT_PATH = ROOT / "qa/elemental-pentatonic-scale-map-validation.json"
VALIDATOR_PATH = ROOT / "scripts/validate-elemental-pentatonic-scale-map.py"


def _load_module(path: Path, name: str):
    spec = importlib.util.spec_from_file_location(name, path)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


VALIDATOR = _load_module(VALIDATOR_PATH, "elemental_scale_map_validator")


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
    VALIDATOR.verify_registry_document(document)


def test_five_bindings_replay_court_positions_exactly(document) -> None:
    bindings = document["scale_bindings"]
    assert len(bindings) == 5
    policy = json.loads(
        (ROOT / "schemas/court-runtime-policy.json").read_text(encoding="utf-8")
    )
    assert [item["pitch_mask"] for item in bindings] == [
        position["pitchMask"] for position in policy["positions"]
    ]
    assert [item["court_position"] for item in bindings] == [
        position["positionId"] for position in policy["positions"]
    ]


def test_ian_ring_ids_and_names_match_audited_map(document) -> None:
    expected = {
        "Fire (Mars)": (661, "Major Pentatonic", "C0"),
        "Air / Wind (Jupiter)": (677, "Scottish Pentatonic", "C1"),
        "Quintessence (Mercury)": (1189, "Qing Yu", "C2"),
        "Water (Venus)": (1193, "Minor Pentatonic", "C3"),
        "Earth (Saturn)": (1321, "Man Gong", "C4"),
    }
    for item in document["scale_bindings"]:
        ring_id, name, position = expected[item["element"]]
        assert item["ian_ring_id"] == ring_id
        assert item["ian_ring_name"] == name
        assert item["court_position"] == position
    assert [item["ian_ring_id"] for item in document["scale_bindings"]] == [
        661, 677, 1189, 1193, 1321
    ]


def test_orientation_policy_holds_for_every_mask(document) -> None:
    for item in document["scale_bindings"]:
        msb = item["mask_string_msb"]
        assert int(msb[::-1], 2) == item["pitch_mask"]
        assert int(msb, 2) == item["as_written_msb_integer"]
        assert int(msb, 2) != item["pitch_mask"]


def test_all_masks_are_single_class_5_35(document) -> None:
    for item in document["scale_bindings"]:
        mask = item["pitch_mask"]
        pitch_classes = sorted(p for p in range(12) if mask & (1 << p))
        assert pitch_classes == item["pitch_classes"]
        assert len(pitch_classes) == 5
        assert item["prime_form"] == [0, 2, 4, 7, 9]
        assert item["forte_class"] == "5-35"
        assert item["interval_vector"] == [0, 3, 2, 1, 4, 0]
        assert sum(pitch_classes) == item["brightness"]


def test_brightness_tracks_kappa_monotonically(document) -> None:
    bindings = document["scale_bindings"]
    assert [item["brightness"] for item in bindings] == [22, 23, 24, 25, 26]
    assert [item["kappa_court"] for item in bindings] == [
        {"numerator": 0, "denominator": 1},
        {"numerator": 1, "denominator": 4},
        {"numerator": 1, "denominator": 2},
        {"numerator": 3, "denominator": 4},
        {"numerator": 1, "denominator": 1},
    ]


def test_complement_evidence_replays_frozen_map(document) -> None:
    complement = json.loads(
        (
            ROOT
            / "seven-governors-court-substrate-v0.1.0/canonical/complement-map.json"
        ).read_text(encoding="utf-8")
    )
    pairs = {}
    for entry in complement["complementMaps"]:
        if entry["pentatonicSetClassId"] == "pentatonic:5-35":
            for pair in entry["rootedPairs"]:
                pairs[pair["rootedRecordId"]] = pair
    for item in document["scale_bindings"]:
        pair = pairs[f"court-position:{item['court_position']}"]
        assert pair["pentatonicMask"] == item["pitch_mask"]
        assert pair["rawHeptatonicComplementMask"] == (
            4095 ^ item["pitch_mask"]
        )
        assert (
            item["complement_evidence"]["raw_heptatonic_complement_mask"]
            == 4095 ^ item["pitch_mask"]
        )
        assert (
            item["complement_evidence"]["relation_admission"]
            == "frozen_evidence_not_active_graph_relation"
        )


def test_mercury_is_emblem_only(document) -> None:
    mercury = next(
        item
        for item in document["scale_bindings"]
        if item["element"] == "Quintessence (Mercury)"
    )
    assert mercury["is_binary_court_pole"] is False
    assert mercury["court_pole_index"] is None
    assert mercury["register_membership"] == "excluded"
    assert mercury["engine_interface_ref"] == "mercury_engine_cycle"
    assert mercury["transition_refs"] == []


def test_cross_registry_references_resolve(document) -> None:
    crt347 = json.loads(
        (
            ROOT
            / "canonical/fivefold-capability-candidates/fivefold-capability-teleology-v1.json"
        ).read_text(encoding="utf-8")
    )
    school_ids = {item["schoolId"] for item in crt347["capabilitySchools"]}
    facet_ids = {
        item["facetId"]
        for item in crt347["zodiacFacets"] + crt347["systemLevelFacets"]
    }
    crt349 = yaml.safe_load(
        (ROOT / "schemas/teleological_physics_registry_v1.0.0.yaml").read_text(
            encoding="utf-8"
        )
    )
    transition_ids = {item["transition_id"] for item in crt349["transitions"]}
    for item in document["scale_bindings"]:
        assert item["school_ref"] in school_ids
        assert all(facet in facet_ids for facet in item["zodiac_facets"])
        assert all(transition in transition_ids for transition in item["transition_refs"])


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
