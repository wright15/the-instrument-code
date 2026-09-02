from __future__ import annotations

from copy import deepcopy
import importlib.util
import json
from pathlib import Path
import subprocess
import sys


ROOT = Path(__file__).resolve().parents[1]
CAND = ROOT / "canonical/fivefold-incubator/fifth-space-census-v0.json"


def _rehash(document: dict) -> None:
    sys.path.insert(0, str(ROOT / "src"))
    from governor.hashing import sha256_payload

    document["candidateFingerprint"] = sha256_payload(
        {key: value for key, value in document.items() if key != "candidateFingerprint"}
    )


def _validator_module():
    spec = importlib.util.spec_from_file_location(
        "fifth_space_census_validator", ROOT / "scripts/validate-fifth-space-census.py"
    )
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_census_fresh() -> None:
    sys.path.insert(0, str(ROOT / "src"))
    from governor.fifth_space_census import build_census_candidate, serialize_candidate, verify_candidate

    document = json.loads(CAND.read_text())
    expected = build_census_candidate(root=ROOT)
    assert CAND.read_bytes() == serialize_candidate(expected)
    verify_candidate(document, root=ROOT)


def test_census_cardinality_and_reconciliation() -> None:
    document = json.loads(CAND.read_text())
    records = document["records"]
    assert len(records) == 462
    anchors = [record for record in records if record["role"] == "anchor"]
    satellites = [record for record in records if record["role"] == "satellite"]
    boundaries = [record for record in records if record["role"] == "boundary"]
    assert len(anchors) == 70 and len(satellites) == 238 and len(boundaries) == 154
    a_tier = [record for record in anchors if record["tier"] in {"A0", "A1", "A2"}]
    d_tier = [record for record in anchors if record["tier"] not in {"A0", "A1", "A2"}]
    assert len(a_tier) == 21 and len(d_tier) == 49
    assert all(record["tier"] is None and record["office"] is None for record in boundaries)


def test_fifth_mask_binary_equivalence() -> None:
    document = json.loads(CAND.read_text())
    for record in document["records"]:
        assert record["pitchMask"] == record["stateId"]
        assert record["fifthMask"] == sum(1 << position for position in record["fifthPositions"])
        assert record["fifthPositions"] == sorted(record["fifthPositions"])
        assert 0 < record["fifthMask"] <= 4095


def test_c0_binding_and_negative_fixture() -> None:
    sys.path.insert(0, str(ROOT / "src"))
    from governor.shadow_ladder import fifth_span, mask_pitch_classes

    document = json.loads(CAND.read_text())
    assert document["courtBinding"]["mask"] == 661
    assert fifth_span(mask_pitch_classes(661)) == 4
    assert fifth_span(mask_pitch_classes(681)) == 6
    assert document["researchVerdict"]["verdict"] == "confirmed"


def test_companion_checks() -> None:
    document = json.loads(CAND.read_text())
    companion = document["companionChecks"]
    assert companion["satelliteFamilyUniformity"]["verified"] is True
    assert companion["satelliteFamilyUniformity"]["familyCount"] == 17
    assert companion["governsOutDegree"]["verified"] is True
    expected = {"A0": 6, "A1": 4, "A2": 6, "D1": 2, "D2": 4, "D3": 2, "D4": 4, "D5": 4, "D6": 2, "D7": 0}
    for office, table in companion["governsOutDegree"]["byOffice"].items():
        assert table == expected
    addendum = companion["obs013Addendum"]
    assert addendum["verified"] is True
    assert addendum["ceilingRespected"] is True
    assert addendum["a2AnchorsAtCeiling"] is True
    assert addendum["d7AnchorsAtCeiling"] is True


def test_validator_rejects_tampering() -> None:
    validator = _validator_module()
    document = json.loads(CAND.read_text())

    cardinality_tamper = deepcopy(document)
    cardinality_tamper["records"] = cardinality_tamper["records"][:-1]
    _rehash(cardinality_tamper)
    cardinality_report = validator.validate(cardinality_tamper)
    assert next(check for check in cardinality_report["checks"] if check["checkId"] == "cardinality-462")["status"] == "FAIL"

    ordering_tamper = deepcopy(document)
    ordering_tamper["records"][0], ordering_tamper["records"][1] = (
        ordering_tamper["records"][1],
        ordering_tamper["records"][0],
    )
    _rehash(ordering_tamper)
    ordering_report = validator.validate(ordering_tamper)
    assert next(check for check in ordering_report["checks"] if check["checkId"] == "ordering-unique")["status"] == "FAIL"

    binary_tamper = deepcopy(document)
    binary_tamper["records"][0]["fifthMask"] += 1
    _rehash(binary_tamper)
    binary_report = validator.validate(binary_tamper)
    assert next(check for check in binary_report["checks"] if check["checkId"] == "binary-field-equivalence")["status"] == "FAIL"

    verdict_tamper = deepcopy(document)
    verdict_tamper["researchVerdict"]["verdict"] = "refuted"
    _rehash(verdict_tamper)
    verdict_report = validator.validate(verdict_tamper)
    assert next(check for check in verdict_report["checks"] if check["checkId"] == "research-verdict-consistency")["status"] == "FAIL"

    boundary_tamper = deepcopy(document)
    boundary_tamper["admissionEffect"] = "writes_topology"
    _rehash(boundary_tamper)
    boundary_report = validator.validate(boundary_tamper)
    assert next(check for check in boundary_report["checks"] if check["checkId"] == "guards-namespace")["status"] == "FAIL"


def test_census_is_orr522_consumable() -> None:
    document = json.loads(CAND.read_text())
    fifth_masks = {record["fifthMask"] for record in document["records"]}
    assert len(fifth_masks) == 462
    assert "verdict" not in document["records"][0]


def test_validator() -> None:
    result = subprocess.run(
        [sys.executable, "scripts/validate-fifth-space-census.py", "--no-write"],
        cwd=ROOT,
        capture_output=True,
        text=True,
    )
    assert result.returncode == 0
    assert json.loads(result.stdout)["verdict"] == "PASS"
