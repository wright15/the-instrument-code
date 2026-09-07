from __future__ import annotations

from copy import deepcopy
import importlib.util
import json
from pathlib import Path
import subprocess
import sys


ROOT = Path(__file__).resolve().parents[1]
CANDIDATE_PATH = ROOT / "canonical/fivefold-incubator/d-shadow-uniqueness-check-v0.json"


def _rehash(document: dict) -> None:
    sys.path.insert(0, str(ROOT / "src"))
    from governor.hashing import sha256_payload

    document["candidateFingerprint"] = sha256_payload(
        {key: value for key, value in document.items() if key != "candidateFingerprint"}
    )


def _validator_module():
    spec = importlib.util.spec_from_file_location("d_shadow_uniqueness_validator", ROOT / "scripts/validate-d-shadow-uniqueness.py")
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_candidate_is_fresh_and_complete() -> None:
    sys.path.insert(0, str(ROOT / "src"))
    from governor.d_shadow_uniqueness import build_d_shadow_uniqueness_candidate, serialize_candidate, verify_candidate

    document = json.loads(CANDIDATE_PATH.read_text())
    first = build_d_shadow_uniqueness_candidate(root=ROOT)
    second = build_d_shadow_uniqueness_candidate(root=ROOT)
    reordered = build_d_shadow_uniqueness_candidate(root=ROOT, reverse_input=True)
    assert CANDIDATE_PATH.read_bytes() == serialize_candidate(first)
    assert serialize_candidate(first) == serialize_candidate(second) == serialize_candidate(reordered)
    assert document["candidateSet"]["coordinates"] == [
        row["coordinate"]
        for row in document["inputTierSummaries"]
        if row["maxRunLength"] == document["candidateSet"]["maximumMaxRunLength"]
    ]
    verify_candidate(document, root=ROOT)


def test_validator_rejects_rehashed_semantic_tampering() -> None:
    validator = _validator_module()
    document = json.loads(CANDIDATE_PATH.read_text())
    cases = [
        lambda value: value["inputTierSummaries"].reverse(),
        lambda value: value["candidateSet"].update(enumerationComplete=False),
        lambda value: value["hypothesisDisposition"].update(H2="supports H2"),
        lambda value: value["evidenceBindings"].update(dShadowCandidateSha256="0" * 64),
        lambda value: value.update(admissionEffect="changes_topology"),
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
        "source-binding", "schema", "exhaustive-completion", "build-twice", "reordered-input", "negative-control", "adversarial-tamper"
    }
    assert all(item["status"] == "ran" and item["reason"] for item in report["suiteStatus"])


def test_validator_command() -> None:
    result = subprocess.run([sys.executable, "scripts/validate-d-shadow-uniqueness.py", "--no-write"], cwd=ROOT, capture_output=True, text=True)
    assert result.returncode == 0, result.stdout + result.stderr
    assert json.loads(result.stdout)["verdict"] == "PASS"
