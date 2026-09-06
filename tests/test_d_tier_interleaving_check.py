from __future__ import annotations

from copy import deepcopy
import importlib.util
import json
from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parents[1]
CANDIDATE_PATH = ROOT / "canonical/fivefold-incubator/d-tier-interleaving-check-v0.json"
sys.path.insert(0, str(ROOT / "src"))
sys.path.insert(0, str(ROOT / "court-mathematics/src"))


def _rehash(document: dict) -> None:
    sys.path.insert(0, str(ROOT / "src"))
    from governor.hashing import sha256_payload

    document["candidateFingerprint"] = sha256_payload({key: value for key, value in document.items() if key != "candidateFingerprint"})


def _validator_module():
    spec = importlib.util.spec_from_file_location("d_tier_interleaving_validator", ROOT / "scripts/validate-d-tier-interleaving-check.py")
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def _ran_suites():
    return [
        {"suite": "fresh-source", "status": "ran", "reason": "test fixture"},
        {"suite": "validator", "status": "ran", "reason": "test fixture"},
        {"suite": "focused-test", "status": "ran", "reason": "test fixture"},
        {"suite": "gov227-validation-command", "status": "ran", "reason": "test fixture"},
    ]


def test_candidate_is_fresh_and_deterministic() -> None:
    sys.path.insert(0, str(ROOT / "src"))
    from governor.d_tier_interleaving_check import build_d_tier_interleaving_candidate, serialize_candidate, verify_candidate

    document = json.loads(CANDIDATE_PATH.read_text())
    first = build_d_tier_interleaving_candidate(root=ROOT)
    assert CANDIDATE_PATH.read_bytes() == serialize_candidate(first)
    assert serialize_candidate(first) == serialize_candidate(build_d_tier_interleaving_candidate(root=ROOT, reverse_input=True))
    verify_candidate(document, root=ROOT)


def test_complete_reproduction_is_bounded() -> None:
    document = json.loads(CANDIDATE_PATH.read_text())
    assert document["verdict"] == "confirmed"
    assert len(document["fixedWitness"]["adjacentComparisons"]) == 9
    assert all(model["status"] == "WEAK_SYSTEM_INFEASIBLE" for model in document["lpModels"])
    assert document["collisionControls"]["d2D5MultisetTwins"]["sharedQMultiset"] == [2, 3, 3, 6, 6, 7, 7]
    assert document["collisionControls"]["zPartnerD3D4"]["intervalVectorsEqual"] is True


def test_validator_rejects_rehashed_semantic_tampering() -> None:
    validator = _validator_module()
    document = json.loads(CANDIDATE_PATH.read_text())
    for mutate in [
        lambda value: value["lpModels"][0].update(status="OPTIMAL_STRICT"),
        lambda value: value["fixedWitness"].update(adjacentComparisons=[]),
        lambda value: value.update(admissionEffect="changes_topology"),
    ]:
        tampered = deepcopy(document)
        mutate(tampered)
        _rehash(tampered)
        assert validator.validate(tampered, suite_status=_ran_suites())["verdict"] == "FAIL"


def test_validator_records_required_suites() -> None:
    validator = _validator_module()
    report = validator.validate(json.loads(CANDIDATE_PATH.read_text()), suite_status=_ran_suites())
    assert report["verdict"] == "PASS"
    assert all(item["status"] == "ran" and item["reason"] for item in report["suiteStatus"])
