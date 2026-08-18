from __future__ import annotations

import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys
from typing import Any

import jsonschema
import pytest


ROOT = Path(__file__).resolve().parents[1]
GENERATOR_PATH = ROOT / "scripts/generate-pentatonic-7-35-parent-audit.py"
VALIDATOR_PATH = ROOT / "scripts/validate-pentatonic-7-35-parent-audit.py"
CANDIDATE_PATH = (
    ROOT
    / "canonical/pentatonic-binding-candidates/pentatonic-7-35-parent-audit-v1.json"
)
NEGATIVE_PATH = ROOT / "canonical/pentatonic-binding-candidates/negative-cases-v1.json"
CANDIDATE_SCHEMA_PATH = (
    ROOT
    / "schemas/pentatonic-binding/pentatonic-7-35-parent-audit-v1.schema.json"
)
NEGATIVE_SCHEMA_PATH = (
    ROOT
    / "schemas/pentatonic-binding/pentatonic-7-35-negative-cases-v1.schema.json"
)
REPORT_SCHEMA_PATH = (
    ROOT / "schemas/pentatonic-binding/pentatonic-7-35-validation-report-v1.schema.json"
)
REPORT_PATH = ROOT / "qa/pentatonic-7-35-parent-audit-validation.json"
COMMITTED_REPORT_BYTES = REPORT_PATH.read_bytes()


def _load_module(path: Path, name: str):
    spec = importlib.util.spec_from_file_location(name, path)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


GENERATOR = _load_module(GENERATOR_PATH, "pentatonic_parent_audit_generator")
VALIDATOR = _load_module(VALIDATOR_PATH, "pentatonic_parent_audit_validator")


@pytest.fixture(scope="module")
def document() -> dict[str, Any]:
    return json.loads(CANDIDATE_PATH.read_text(encoding="utf-8"))


def _has_float(value: Any) -> bool:
    if isinstance(value, float):
        return True
    if isinstance(value, dict):
        return any(_has_float(item) for item in value.values())
    if isinstance(value, list):
        return any(_has_float(item) for item in value)
    return False


def test_candidate_is_schema_valid_fresh_and_deterministic(document) -> None:
    first = GENERATOR.build_candidate(ROOT)
    second = GENERATOR.build_candidate(ROOT)
    reordered = GENERATOR.build_candidate(ROOT, reverse_input=True)
    first_bytes = GENERATOR.serialize_candidate(first)
    assert CANDIDATE_PATH.read_bytes() == first_bytes
    assert first_bytes == GENERATOR.serialize_candidate(second)
    assert first_bytes == GENERATOR.serialize_candidate(reordered)
    jsonschema.Draft202012Validator(
        json.loads(CANDIDATE_SCHEMA_PATH.read_text(encoding="utf-8"))
    ).validate(document)
    VALIDATOR.verify_candidate_document(document, ROOT)


def test_complete_universe_and_parent_incidence(document) -> None:
    records = document["pitchSetRecords"]
    assert len(records) == 792
    assert [item["pitchMask"] for item in records] == sorted(
        item["pitchMask"] for item in records
    )
    assert all(item["pitchMask"].bit_count() == 5 for item in records)
    assert sum(item["parentCount"] for item in records) == 252
    assert document["universeSummary"]["parentCountDistribution"] == [
        {"parentCount": 0, "pitchSetCount": 612},
        {"parentCount": 1, "pitchSetCount": 120},
        {"parentCount": 2, "pitchSetCount": 48},
        {"parentCount": 3, "pitchSetCount": 12},
    ]
    diatonic_masks = set(document["universeSummary"]["diatonicMasks"])
    assert len(diatonic_masks) == 12
    for item in records:
        assert item["parentCount"] == len(item["parentMasks"])
        assert item["parentMasks"] == sorted(item["parentMasks"])
        assert set(item["parentMasks"]) <= diatonic_masks
        assert all(item["pitchMask"] & parent == item["pitchMask"] for parent in item["parentMasks"])


def test_forte_class_discriminator_is_exact(document) -> None:
    classes_by_count: dict[int, list[str]] = {}
    for item in document["classSummaries"]:
        classes_by_count.setdefault(item["parentCountPerRealization"], []).append(
            item["forteNumber"]
        )
    assert classes_by_count[3] == ["5-35"]
    assert classes_by_count[2] == ["5-23", "5-27"]
    assert classes_by_count[1] == ["5-Z12", "5-20", "5-24", "5-25", "5-29", "5-34"]
    assert "5-32" in classes_by_count[0]
    assert len(document["classSummaries"]) == 38
    assert sum(item["realizationCount"] for item in document["classSummaries"]) == 792

    summary_by_id = {item["setClassId"]: item for item in document["classSummaries"]}
    for record in document["pitchSetRecords"]:
        assert record["parentCount"] == summary_by_id[record["setClassId"]][
            "parentCountPerRealization"
        ]


def test_reviewed_court_and_bridge_windows_are_exact(document) -> None:
    witnesses = {item["witnessId"]: item for item in document["reviewedRootedWitnesses"]}
    expected = {
        "court-position:C0": ["Sun", "Moon", "Mars"],
        "court-position:C1": ["Moon", "Mars", "Mercury"],
        "court-position:C2": ["Mars", "Mercury", "Jupiter"],
        "court-position:C3": ["Mercury", "Jupiter", "Venus"],
        "court-position:C4": ["Jupiter", "Venus", "Saturn"],
        "bridge-rooting:5-23:aeolian-harmonic-minor": ["Mercury", "Jupiter"],
        "bridge-rooting:5-27:aeolian-harmonic-minor": ["Jupiter", "Venus"],
    }
    assert {
        witness_id: [parent["governor"] for parent in witness["parentScaleStates"]]
        for witness_id, witness in witnesses.items()
    } == expected
    assert witnesses["court-position:C2"]["pitchMask"] == 1189
    assert witnesses["court-position:C4"]["pitchMask"] == 1321


def test_complement_evidence_is_not_parent_evidence(document) -> None:
    records = {item["pitchMask"]: item for item in document["pitchSetRecords"]}
    for witness in document["reviewedRootedWitnesses"]:
        evidence = witness["complementEvidence"]
        raw_complement = 4095 ^ witness["pitchMask"]
        assert evidence["rawHeptatonicComplementMask"] == raw_complement
        assert raw_complement not in records[witness["pitchMask"]]["parentMasks"]
        assert raw_complement != evidence["normalizedHeptatonicScaleStateId"]
        assert evidence["relationAdmission"] == "frozen_evidence_not_active_graph_relation"


def test_bipolar_vectors_and_coordinate_guard(document) -> None:
    vectors = {
        item["governor"]: item
        for item in document["representationChecks"]["bipolarGovernorVectors"]
    }
    assert {name: item["inversionWitness"] for name, item in vectors.items()} == {
        "Mars": 3,
        "Mercury": 1,
        "Jupiter": 11,
        "Venus": 9,
        "Saturn": 7,
    }
    assert all(item["t1Matches"] for item in vectors.values())
    assert all(item["inversionMatches"] for item in vectors.values())
    assert all(not item["complementMatchesInternal"] for item in vectors.values())
    assert document["representationChecks"]["marsCoordinateGuard"] == {
        "canonicalPitchMask": 1717,
        "complementCanonicalPitchMask": 2378,
        "complementConstructiveInteger": 1321,
        "constructiveInteger": 2774,
        "coordinateCollisionIsIdentity": False,
        "courtC4PitchMask": 1321,
    }


def test_negative_fixture_and_independent_rejections(document) -> None:
    negative = json.loads(NEGATIVE_PATH.read_text(encoding="utf-8"))
    jsonschema.Draft202012Validator(
        json.loads(NEGATIVE_SCHEMA_PATH.read_text(encoding="utf-8"))
    ).validate(negative)
    results = VALIDATOR._adversarial_results(document, negative)
    assert results == {
        item["caseId"]: item["expectedCode"] for item in negative["cases"]
    }
    validator_source = VALIDATOR_PATH.read_text(encoding="utf-8")
    assert "generate-pentatonic-7-35-parent-audit" not in validator_source
    assert "court_mathematics" not in validator_source


def test_intrinsic_candidate_has_no_environment_or_float_fields(document) -> None:
    assert not _has_float(document)
    serialized = GENERATOR.serialize_candidate(document)
    assert b'"timestamp"' not in serialized
    assert b'"provider"' not in serialized
    assert b'"model"' not in serialized
    assert b'"locale"' not in serialized


def test_committed_report_is_schema_valid_and_self_consistent(document) -> None:
    report = json.loads(COMMITTED_REPORT_BYTES)
    jsonschema.Draft202012Validator(
        json.loads(REPORT_SCHEMA_PATH.read_text(encoding="utf-8"))
    ).validate(report)
    assert VALIDATOR._report_shape_valid(report)
    assert report["candidateFingerprint"] == document["candidateFingerprint"]
    assert report["verdict"] == "PASS"
    fresh = VALIDATOR.validate(document)
    assert COMMITTED_REPORT_BYTES == (
        json.dumps(fresh, ensure_ascii=False, indent=2) + "\n"
    ).encode("utf-8")


def test_generator_check_and_validator_commands_pass() -> None:
    generated = subprocess.run(
        [sys.executable, str(GENERATOR_PATH), "--check"],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    assert generated.returncode == 0, generated.stdout + generated.stderr
    validated = subprocess.run(
        [sys.executable, str(VALIDATOR_PATH)],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    assert validated.returncode == 0, validated.stdout + validated.stderr
    assert json.loads(validated.stdout)["verdict"] == "PASS"
    report = json.loads(REPORT_PATH.read_text(encoding="utf-8"))
    assert report["verdict"] == "PASS"
    assert report["checksFailed"] == 0
    assert REPORT_PATH.read_bytes() == COMMITTED_REPORT_BYTES


@pytest.mark.parametrize(
    ("hash_seed", "timezone"),
    [("1", "UTC"), ("8675309", "Pacific/Honolulu")],
)
def test_generator_check_is_environment_independent(hash_seed: str, timezone: str) -> None:
    environment = os.environ.copy()
    environment.update({"PYTHONHASHSEED": hash_seed, "TZ": timezone})
    result = subprocess.run(
        [sys.executable, str(GENERATOR_PATH), "--check"],
        cwd=ROOT,
        env=environment,
        capture_output=True,
        text=True,
        check=False,
    )
    assert result.returncode == 0, result.stdout + result.stderr
