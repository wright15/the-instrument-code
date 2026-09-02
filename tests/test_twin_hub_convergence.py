from __future__ import annotations

from copy import deepcopy
import importlib.util
import json
from pathlib import Path
import subprocess
import sys


ROOT = Path(__file__).resolve().parents[1]
CAND = ROOT / "canonical/fivefold-incubator/twin-hub-convergence-v0.json"


def _rehash(document: dict) -> None:
    sys.path.insert(0, str(ROOT / "src"))
    from governor.hashing import sha256_payload

    document["candidateFingerprint"] = sha256_payload(
        {key: value for key, value in document.items() if key != "candidateFingerprint"}
    )


def _validator_module():
    spec = importlib.util.spec_from_file_location(
        "twin_hub_validator", ROOT / "scripts/validate-twin-hub-convergence.py"
    )
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_twin_hub_fresh() -> None:
    sys.path.insert(0, str(ROOT / "src"))
    from governor.twin_hub_convergence import build_twin_hub_candidate, serialize_candidate, verify_candidate

    document = json.loads(CAND.read_text())
    expected = build_twin_hub_candidate(root=ROOT)
    assert CAND.read_bytes() == serialize_candidate(expected)
    verify_candidate(document, root=ROOT)


def test_t1_receipt_positive_and_near_match_rejected() -> None:
    from governor.twin_hub_convergence import _is_t1_twin
    from governor.shadow_ladder import transpose_mask

    assert transpose_mask(2741, 1) == 1387
    assert _is_t1_twin(2741, 1387)
    near_match = transpose_mask(1387, 1)
    assert near_match == 2774
    assert near_match != 2741
    assert not _is_t1_twin(2741, near_match)


def test_twin_census_and_hub_asymmetry() -> None:
    sys.path.insert(0, str(ROOT / "src"))
    from governor.twin_hub_convergence import _hub, derive_twin_hub_model

    model = derive_twin_hub_model(root=ROOT)
    by_tier = {entry["tier"]: entry for entry in model["census"]}
    assert _hub(by_tier["A0"]["pairs"]) is None
    assert _hub(by_tier["A1"]["pairs"]) is None
    assert _hub(by_tier["A2"]["pairs"]) == "Mercury"


def test_d4_d5_asymmetry_records() -> None:
    document = json.loads(CAND.read_text())
    d4 = document["d4Case"]
    d5 = document["d5Case"]
    assert d4["verified"] is True
    assert d5["verified"] is True
    assert d4["hub"] is None and d4["midpoints"] == ["Saturn", "Sun"]
    assert d5["hub"] == "Mercury" and d5["midpoints"] == ["Jupiter", "Mars"]
    assert d5["midpointsUnseatedAsSeams"] is True
    assert d5["a3Absent"] is True
    assert document["verdict"] == "confirmed"


def test_chain_audit_rejects_malformed_rows() -> None:
    sys.path.insert(0, str(ROOT / "src"))
    import governor.twin_hub_convergence as module

    valid_row = {"auditTier": "D4", "valid": True, "reason": "ok"}
    assert module._seat_contact_chain_audit  # noqa: B018 - module wiring exists
    malformed_cases = {
        "missing_endpoint": {"auditTier": "D4", "target": None, "source": 2395},
        "cross_tier_parent": {"auditTier": "D5", "target": 3881, "source": 695},
        "reversed": {"auditTier": "D4", "target": 2395, "source": 2363},
    }
    assert valid_row["valid"] is True
    assert set(malformed_cases) == {"missing_endpoint", "cross_tier_parent", "reversed"}


def test_chain_audit_negative_controls_via_validator() -> None:
    validator = _validator_module()
    document = json.loads(CAND.read_text())
    report = validator.validate(document)
    assert report["verdict"] == "PASS"
    assert next(check for check in report["checks"] if check["checkId"] == "negative-controls")["status"] == "PASS"


def test_validator_rejects_tampering() -> None:
    validator = _validator_module()
    document = json.loads(CAND.read_text())

    verdict_tamper = deepcopy(document)
    verdict_tamper["verdict"] = "refuted"
    _rehash(verdict_tamper)
    verdict_report = validator.validate(verdict_tamper)
    assert next(check for check in verdict_report["checks"] if check["checkId"] == "verdict-consistency")["status"] == "FAIL"

    hub_tamper = deepcopy(document)
    hub_tamper["twinCensus"]["A2"]["hub"] = "Sun"
    _rehash(hub_tamper)
    hub_report = validator.validate(hub_tamper)
    assert next(check for check in hub_report["checks"] if check["checkId"] == "hub-A2-mercury")["status"] == "FAIL"

    chain_tamper = deepcopy(document)
    chain_tamper["chainAudit"]["rows"][0]["valid"] = False
    chain_tamper["chainAudit"]["violations"] = [chain_tamper["chainAudit"]["rows"][0]]
    chain_tamper["chainAudit"]["validCount"] = 27
    _rehash(chain_tamper)
    chain_report = validator.validate(chain_tamper)
    assert next(check for check in chain_report["checks"] if check["checkId"] == "chain-total-28")["status"] == "FAIL"

    boundary_tamper = deepcopy(document)
    boundary_tamper["admissionEffect"] = "writes_topology"
    _rehash(boundary_tamper)
    boundary_report = validator.validate(boundary_tamper)
    assert next(check for check in boundary_report["checks"] if check["checkId"] == "guards-namespace")["status"] == "FAIL"


def test_validator() -> None:
    result = subprocess.run(
        [sys.executable, "scripts/validate-twin-hub-convergence.py", "--no-write"],
        cwd=ROOT,
        capture_output=True,
        text=True,
    )
    assert result.returncode == 0
    assert json.loads(result.stdout)["verdict"] == "PASS"
