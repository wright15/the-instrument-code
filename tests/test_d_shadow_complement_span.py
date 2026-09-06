from __future__ import annotations

from copy import deepcopy
import importlib.util
import json
from pathlib import Path
import subprocess
import sys


ROOT = Path(__file__).resolve().parents[1]
CANDIDATE_PATH = ROOT / "canonical/fivefold-incubator/d-shadow-complement-span-v0.json"


def _rehash(document: dict) -> None:
    sys.path.insert(0, str(ROOT / "src"))
    from governor.hashing import sha256_payload

    document["candidateFingerprint"] = sha256_payload(
        {key: value for key, value in document.items() if key != "candidateFingerprint"}
    )


def _validator_module():
    spec = importlib.util.spec_from_file_location("d_shadow_validator", ROOT / "scripts/validate-d-shadow-complement-span.py")
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_candidate_is_fresh_and_deterministic() -> None:
    sys.path.insert(0, str(ROOT / "src"))
    from governor.d_shadow_complement_span import build_d_shadow_candidate, serialize_candidate, verify_candidate

    document = json.loads(CANDIDATE_PATH.read_text())
    first = build_d_shadow_candidate(root=ROOT)
    second = build_d_shadow_candidate(root=ROOT)
    reversed_input = build_d_shadow_candidate(root=ROOT, reverse_input=True)
    assert CANDIDATE_PATH.read_bytes() == serialize_candidate(first)
    assert serialize_candidate(first) == serialize_candidate(second) == serialize_candidate(reversed_input)
    verify_candidate(document, root=ROOT)


def test_direct_complement_arithmetic_and_verdict_are_generated() -> None:
    document = json.loads(CANDIDATE_PATH.read_text())
    assert len(document["records"]) == 49
    assert {record["tier"] for record in document["records"]} == {f"D{index}" for index in range(1, 8)}
    assert all(record["role"] == "anchor" for record in document["records"])
    assert document["verdict"] in {"confirmed", "partial", "refuted"}
    assert set(document["hypothesisDisposition"]) == {"H1", "H2", "H3"}
    assert all(record["complementHoles"] == record["complementSpan"] + 1 - 5 for record in document["records"])
    assert document["runSpace"]["dRunSequence"] == [3, 3, 3, 3, 5, 2, 2]
    assert all(record["complementSpan"] == 11 - record["maxRunLength"] for record in document["records"])
    assert document["runSpace"]["d5CourtRun"]["allD5MaxRunsAreCourtClass"] is True
    assert document["runSpace"]["d5CourtRun"]["twinOuterOfficeIntersection"]["stateIds"] == [2383, 3667]
    assert all(record["transposedComplementControl"]["spanInvariant"] is True for record in document["records"])


def test_validator_rejects_rehashed_semantic_tampering() -> None:
    validator = _validator_module()
    document = json.loads(CANDIDATE_PATH.read_text())
    cases = [
        lambda value: value["records"][0].update(tier="A0"),
        lambda value: value["records"][0].update(complementMask=1),
        lambda value: value["records"][0].update(maxRunLength=0),
        lambda value: value["shuffleControl"]["permutation"].__setitem__(0, 0),
        lambda value: value.update(admissionEffect="writes_topology"),
    ]
    for mutate in cases:
        tampered = deepcopy(document)
        mutate(tampered)
        _rehash(tampered)
        report = validator.validate(tampered)
        assert report["verdict"] == "FAIL"


def test_validator_records_every_ticket_suite() -> None:
    validator = _validator_module()
    report = validator.validate(json.loads(CANDIDATE_PATH.read_text()))
    assert report["verdict"] == "PASS"
    assert {item["suite"] for item in report["suiteStatus"]} == {
        "source-binding", "schema", "scope", "arithmetic", "build-twice", "reordered-input", "negative-control", "adversarial-tamper"
    }
    assert all(item["status"] == "ran" and item["reason"] for item in report["suiteStatus"])


def test_validator_command() -> None:
    result = subprocess.run([sys.executable, "scripts/validate-d-shadow-complement-span.py", "--no-write"], cwd=ROOT, capture_output=True, text=True)
    assert result.returncode == 0, result.stdout + result.stderr
    assert json.loads(result.stdout)["verdict"] == "PASS"
