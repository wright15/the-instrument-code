from __future__ import annotations

from copy import deepcopy
import json
from pathlib import Path

from jsonschema import Draft202012Validator, RefResolver

from _bootstrap import INTEGRATED_ROOT, PACKAGE_ROOT
from court_filter_algebra import CourtFilterError, CourtFilterOperator
from court_filter_algebra.builder import OUTPUT_NAMES, build_artifacts
from court_filter_algebra.canonical import canonical_json_bytes, sha256_file, write_atomic


def load_json(path: Path) -> object:
    return json.loads(path.read_text(encoding="utf-8"))


schema_names = (
    "common.schema.json",
    "filter-operator.schema.json",
    "filter-operator-registry.schema.json",
    "filter-algebra-release.schema.json",
    "bridge-route-comparison.schema.json",
    "commutation-table.schema.json",
    "non-commutation-records.schema.json",
)
schemas = {name: load_json(PACKAGE_ROOT / "schemas" / name) for name in schema_names}
store = {schema["$id"]: schema for schema in schemas.values()}


def validator(name: str) -> Draft202012Validator:
    schema = schemas[name]
    return Draft202012Validator(schema, resolver=RefResolver.from_schema(schema, store=store))


artifact_schemas = {
    "filter-algebra-release.json": "filter-algebra-release.schema.json",
    "filter-operator-registry.json": "filter-operator-registry.schema.json",
    "bridge-route-comparison.json": "bridge-route-comparison.schema.json",
    "commutation-table.json": "commutation-table.schema.json",
    "non-commutation-records.json": "non-commutation-records.schema.json",
}
artifacts = {name: load_json(PACKAGE_ROOT / "canonical" / name) for name in OUTPUT_NAMES}
checks = []


def record(name: str, passed: bool, detail: object) -> None:
    checks.append({"name": name, "status": "PASS" if passed else "FAIL", "detail": detail})


schema_details = {}
for name, schema_name in artifact_schemas.items():
    errors = sorted(validator(schema_name).iter_errors(artifacts[name]), key=lambda error: list(error.path))
    schema_details[name] = [error.message for error in errors[:5]]
record("strict-schemas", not any(schema_details.values()), schema_details)
expected = build_artifacts()
installed_bytes = {name: (PACKAGE_ROOT / "canonical" / name).read_bytes() for name in OUTPUT_NAMES}
record("builder-parity", expected == installed_bytes, {name: sha256_file(PACKAGE_ROOT / "canonical" / name) for name in OUTPUT_NAMES})

release = artifacts["filter-algebra-release.json"]
dependencies_ok = all(sha256_file(INTEGRATED_ROOT / item["path"]) == item["sha256"] for item in release["dependencyBindings"])
record("dependency-bindings", dependencies_ok, {item["dependencyId"]: item["fingerprint"] for item in release["dependencyBindings"]})
commutation = artifacts["commutation-table.json"]
record(
    "aggregate-coverage",
    commutation["evaluationCount"] == 48510
    and commutation["summaryRowCount"] == 105
    and commutation["classificationTotals"] == {"commutes": 0, "does_not_commute": 0, "left_undefined": 0, "right_undefined": 23814, "both_undefined": 24696},
    commutation["classificationTotals"],
)
records = artifacts["non-commutation-records.json"]
record(
    "route-semantics-records",
    records["recordCount"] == 23814
    and all(item["ledgerDeclaration"] == {"namespace": "court.routeSemantics", "runtimeEventRequired": True, "eventPointer": None} for item in records["records"]),
    {"recordCount": records["recordCount"], "namespace": "court.routeSemantics"},
)
bridge = artifacts["bridge-route-comparison.json"]
record(
    "bridge-comparison",
    bridge["minimalAdditionalBridgeFilters"] == []
    and [route["filterMask"] for route in bridge["routes"]] == [173, 425]
    and all(route["exactBitReduction"] == {"source": 2, "target": 2} for route in bridge["routes"]),
    {"routeCount": len(bridge["routes"]), "minimalAdditionalBridgeFilters": []},
)

operator_validator = validator("filter-operator.schema.json")
registry = artifacts["filter-operator-registry.json"]


def run_negative(case: dict[str, object]) -> str:
    operation = case["operation"]
    candidate = deepcopy(registry["operators"][0])
    if operation == "set_filter_type":
        candidate["filterType"] = case["value"]
    elif operation == "set_mask":
        candidate["mask"] = case["value"]
        try:
            CourtFilterOperator("fixture", "linear_diagonal", case["value"], "pentatonic:5-35")
        except CourtFilterError as error:
            return error.reason_code
    elif operation == "remove_declaration":
        del candidate[case["value"]]
    elif operation == "claim_office_write":
        candidate["authorizedTransforms"].append("ScaleState.office")
    elif operation == "dangling_operator_id":
        row = deepcopy(commutation["rows"][0])
        row["operatorId"] = "R8"
        altered = deepcopy(commutation)
        altered["rows"][0] = row
        error = next(validator("commutation-table.schema.json").iter_errors(altered))
        return f"schema_{error.validator}"
    elif operation == "invent_ledger_event":
        altered = deepcopy(records)
        altered["records"][0]["ledgerDeclaration"]["eventPointer"] = "court-event:missing"
        error = next(validator("non-commutation-records.schema.json").iter_errors(altered))
        return f"schema_{error.validator}"
    else:
        raise AssertionError(f"unknown_fixture_operation:{operation}")
    error = next(operator_validator.iter_errors(candidate))
    return f"schema_{error.validator}"


negative = load_json(PACKAGE_ROOT / "fixtures/negative-cases.json")
fixture_results = []
for case in negative["cases"]:
    actual = run_negative(case)
    fixture_results.append({"fixtureId": case["fixtureId"], "expectedReason": case["expectedReason"], "actualReason": actual, "passed": actual == case["expectedReason"]})
record("negative-fixtures", all(item["passed"] for item in fixture_results), fixture_results)
positive = load_json(PACKAGE_ROOT / "fixtures/positive-cases.json")
record("positive-fixtures", len(positive["cases"]) == 9, [item["fixtureId"] for item in positive["cases"]])

failed = [item for item in checks if item["status"] == "FAIL"]
report = {
    "schemaVersion": "1.0.0",
    "packageVersion": "0.1.0",
    "releaseId": release["releaseId"],
    "filterAlgebraFingerprint": release["filterAlgebraFingerprint"],
    "status": "failed" if failed else "passed",
    "summary": {"checks": len(checks), "passed": len(checks) - len(failed), "failed": len(failed)},
    "checks": checks,
}
write_atomic(PACKAGE_ROOT / "qa/validation-report.json", canonical_json_bytes(report))
print(json.dumps({"status": report["status"], "summary": report["summary"]}))
raise SystemExit(1 if failed else 0)
