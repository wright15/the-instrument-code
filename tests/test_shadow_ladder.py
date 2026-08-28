from __future__ import annotations

from copy import deepcopy
import importlib.util
import json
from pathlib import Path
import subprocess
import sys


ROOT = Path(__file__).resolve().parents[1]
CAND = ROOT / "canonical/fivefold-incubator/shadow-ladder-v0.json"


def _rehash(document: dict) -> None:
    sys.path.insert(0, str(ROOT / "src"))
    from governor.hashing import sha256_payload

    document["candidateFingerprint"] = sha256_payload(
        {key: value for key, value in document.items() if key != "candidateFingerprint"}
    )


def _validator_module():
    spec = importlib.util.spec_from_file_location(
        "shadow_ladder_validator", ROOT / "scripts/validate-shadow-ladder.py"
    )
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_shadow_ladder_fresh() -> None:
    sys.path.insert(0, str(ROOT / "src"))
    from governor.shadow_ladder import build_shadow_ladder_candidate, serialize_candidate, verify_candidate

    document = json.loads(CAND.read_text())
    expected = build_shadow_ladder_candidate(root=ROOT)
    assert CAND.read_bytes() == serialize_candidate(expected)
    verify_candidate(document, root=ROOT)


def test_span_and_holes() -> None:
    from governor.shadow_ladder import fifth_arc, fifth_span, mask_pitch_classes

    assert fifth_span([0, 2, 5, 7, 10]) == 4
    assert fifth_span([0, 7, 2, 9, 4]) == 4
    assert fifth_arc(mask_pitch_classes(661)) == "[0,4]"
    assert fifth_span(mask_pitch_classes(681)) == 6


def test_generated_record_geometry() -> None:
    document = json.loads(CAND.read_text())
    by_mask = {record["coreMask"]: record for record in document["shadowLadder"]}
    assert by_mask[661]["fifthArc"] == "[0,4]"
    assert by_mask[661]["fifthPositions"] == [0, 1, 2, 3, 4]
    assert by_mask[681]["holes"] == 2
    assert by_mask[681]["punched"] == [10, 2]


def test_source_model_derives_midpoints_seams_and_termination() -> None:
    sys.path.insert(0, str(ROOT / "src"))
    from governor.shadow_ladder import derive_shadow_ladder_model

    model = derive_shadow_ladder_model(root=ROOT)
    assert [record["coreMask"] for record in model["a1Records"]] == [661, 677, 1189, 1193, 1321]
    assert model["a2DistanceCounts"] == {2: 5, 4: 0, 10: 2}
    assert len(model["a1Seams"]) == len(model["a2Seams"]) == 2
    assert all(model["auditByMask"][mask]["parentCount"] == 0 for mask in model["predictedA3"])


def test_validator_rejects_rehashed_semantic_tampering() -> None:
    validator = _validator_module()
    document = json.loads(CAND.read_text())

    core_tamper = deepcopy(document)
    core_tamper["shadowLadder"][0]["coreMask"] = 1
    _rehash(core_tamper)
    core_report = validator.validate(core_tamper)
    assert next(check for check in core_report["checks"] if check["checkId"] == "A1-overhang")["status"] == "FAIL"

    punch_tamper = deepcopy(document)
    next(record for record in punch_tamper["shadowLadder"] if record["coreMask"] == 681)["punched"] = [10, 1]
    _rehash(punch_tamper)
    punch_report = validator.validate(punch_tamper)
    assert next(check for check in punch_report["checks"] if check["checkId"] == "A2-punching")["status"] == "FAIL"

    boundary_tamper = deepcopy(document)
    boundary_tamper["admissionEffect"] = "writes_topology"
    _rehash(boundary_tamper)
    boundary_report = validator.validate(boundary_tamper)
    assert next(check for check in boundary_report["checks"] if check["checkId"] == "guards-namespace")["status"] == "FAIL"


def test_validator() -> None:
    result = subprocess.run(
        [sys.executable, "scripts/validate-shadow-ladder.py", "--no-write"],
        cwd=ROOT,
        capture_output=True,
        text=True,
    )
    assert result.returncode == 0
    assert json.loads(result.stdout)["verdict"] == "PASS"
