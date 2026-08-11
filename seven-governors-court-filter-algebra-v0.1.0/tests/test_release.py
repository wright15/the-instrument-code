from __future__ import annotations

import json
from pathlib import Path

from court_filter_algebra.builder import build_release


PACKAGE_ROOT = Path(__file__).resolve().parents[1]


def test_complete_release_counts_and_audit_parity() -> None:
    built = build_release()
    assert built["release"]["summary"] == {
        "filterCount": 7,
        "mutationOperatorCount": 15,
        "canonicalOperandCount": 462,
        "evaluationCount": 48510,
        "summaryRowCount": 105,
        "nonCommutationRecordCount": 23814,
        "mutationAuditApplicationCount": 3402,
        "mutationAuditParity": "exact",
    }
    assert built["commutation"]["classificationTotals"] == {
        "commutes": 0,
        "does_not_commute": 0,
        "left_undefined": 0,
        "right_undefined": 23814,
        "both_undefined": 24696,
    }
    assert built["nonCommutation"]["recordCount"] == 23814


def test_bridge_records_exact_hidden_addresses() -> None:
    bridge = json.loads((PACKAGE_ROOT / "canonical/bridge-route-comparison.json").read_text(encoding="utf-8"))
    assert bridge["minimalAdditionalBridgeFilters"] == []
    assert bridge["routes"][0]["hiddenDegreeGovernorAddresses"] == [
        {"degree": 6, "degreeGovernor": "Mercury"},
        {"degree": 7, "degreeGovernor": "Moon"},
    ]
    assert bridge["routes"][1]["hiddenDegreeGovernorAddresses"] == [
        {"degree": 2, "degreeGovernor": "Jupiter"},
        {"degree": 7, "degreeGovernor": "Moon"},
    ]
    assert all(route["governorOfficeDisposition"] == "preserved_external_authority_not_transformed" for route in bridge["routes"])
