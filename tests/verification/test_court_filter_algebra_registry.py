from __future__ import annotations

import csv
import json

import pytest

from court_filter_algebra import (
    CourtFilterError,
    CourtFilterOperator,
    apply_filter,
    evaluate_commutation,
)
from court_filter_algebra.builder import OUTPUT_NAMES, build_artifacts

from ._oracles import ROOT


PACKAGE_ROOT = ROOT / "seven-governors-court-filter-algebra-v0.1.0"
CANONICAL_ROOT = PACKAGE_ROOT / "canonical"


def _load(name: str) -> dict[str, object]:
    return json.loads((CANONICAL_ROOT / name).read_text(encoding="utf-8"))


def test_canonical_filter_artifacts_match_the_production_builder() -> None:
    assert build_artifacts() == {
        name: (CANONICAL_ROOT / name).read_bytes() for name in OUTPUT_NAMES
    }


def test_commutation_table_covers_every_filter_operator_and_operand() -> None:
    release = _load("filter-algebra-release.json")
    table = _load("commutation-table.json")
    with (
        ROOT
        / "seven-governors-mutation-algebra-audit/audit/operator-registry.csv"
    ).open(newline="", encoding="utf-8") as handle:
        operator_ids = {row["operator_id"] for row in csv.DictReader(handle)}
    assert release["summary"] == {
        "filterCount": 7,
        "mutationOperatorCount": 15,
        "canonicalOperandCount": 462,
        "evaluationCount": 48510,
        "summaryRowCount": 105,
        "nonCommutationRecordCount": 23814,
        "mutationAuditApplicationCount": 3402,
        "mutationAuditParity": "exact",
    }
    assert len(table["rows"]) == 105
    assert {row["operatorId"] for row in table["rows"]} == operator_ids
    assert all(row["operandCount"] == 462 for row in table["rows"])
    assert table["classificationTotals"] == {
        "commutes": 0,
        "does_not_commute": 0,
        "left_undefined": 0,
        "right_undefined": 23814,
        "both_undefined": 24696,
    }


def test_every_route_asymmetry_is_typed_without_an_invented_event() -> None:
    artifact = _load("non-commutation-records.json")
    assert artifact["recordCount"] == 23814
    assert all(
        record["ledgerDeclaration"]
        == {
            "namespace": "court.routeSemantics",
            "runtimeEventRequired": True,
            "eventPointer": None,
        }
        for record in artifact["records"]
    )
    sample = next(
        record
        for record in artifact["records"]
        if record["filterMask"] == 173
        and record["operatorId"] == "R7"
        and record["sourceState"]["id"] == 1453
    )
    assert sample["targetState"]["id"] == 2477
    assert sample["leftResult"]["outputMask"] == 173
    assert sample["rightUndefinedReason"] == (
        "mutation_domain_not_rooted_weight_seven"
    )


def test_bridge_routes_are_distinct_and_filter_api_fails_closed() -> None:
    bridge = _load("bridge-route-comparison.json")
    assert bridge["minimalAdditionalBridgeFilters"] == []
    assert [route["filterMask"] for route in bridge["routes"]] == [173, 425]
    assert bridge["routes"][0]["retainedPitchClasses"]["source"] != bridge[
        "routes"
    ][1]["retainedPitchClasses"]["source"]
    assert all(
        route["routeCost"]["status"] == "unresolved"
        and route["spectralMeasures"]["admission"] == "not_admitted"
        for route in bridge["routes"]
    )

    operator = CourtFilterOperator(
        "court-filter:5-23:root-0", "linear_diagonal", 173, "pentatonic:5-23"
    )
    application = apply_filter(operator, 1453)
    assert (application.output_mask, application.exact_bit_reduction) == (173, 2)
    result = evaluate_commutation(operator, "R7", 1453)
    assert (result.classification, result.left_result, result.right_result) == (
        "right_undefined",
        173,
        None,
    )
    with pytest.raises(CourtFilterError, match="filter_mask_not_admitted"):
        CourtFilterOperator("bad", "linear_diagonal", 31, "pentatonic:5-1")
