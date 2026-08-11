from __future__ import annotations

from copy import deepcopy
import json
from pathlib import Path

from jsonschema import Draft202012Validator, RefResolver

from _bootstrap import INTEGRATED_ROOT, PACKAGE_ROOT

from harmonic_invariants import (
    CareyScopeError,
    CourtInvariantError,
    court_position_index,
    evaluate_carey_535,
    signed_transition_vector,
    verify_court_gram,
    verify_disjoint_supports,
    verify_weight_five,
)
from harmonic_invariants.builder import build_release
from harmonic_invariants.canonical import (
    canonical_json_bytes,
    compact_json_bytes,
    sha256_bytes,
    sha256_file,
    write_atomic,
)


def load_json(path: Path) -> object:
    return json.loads(path.read_text(encoding="utf-8"))


schemas = {
    name: load_json(PACKAGE_ROOT / "schemas" / name)
    for name in (
        "common.schema.json",
        "invariant-record.schema.json",
        "harmonic-invariant-release.schema.json",
    )
}
store = {schema["$id"]: schema for schema in schemas.values()}
release_schema = schemas["harmonic-invariant-release.schema.json"]
release_validator = Draft202012Validator(
    release_schema,
    resolver=RefResolver.from_schema(release_schema, store=store),
)
invariant_schema = schemas["invariant-record.schema.json"]
invariant_validator = Draft202012Validator(
    invariant_schema,
    resolver=RefResolver.from_schema(invariant_schema, store=store),
)
release = load_json(PACKAGE_ROOT / "canonical/harmonic-invariant-registry.json")
checks = []


def record(name: str, passed: bool, detail: object) -> None:
    checks.append({"name": name, "status": "PASS" if passed else "FAIL", "detail": detail})


schema_errors = sorted(release_validator.iter_errors(release), key=lambda error: list(error.path))
record(
    "release-schema",
    not schema_errors,
    "valid" if not schema_errors else [error.message for error in schema_errors],
)
expected = build_release()
record(
    "builder-parity",
    canonical_json_bytes(expected) == canonical_json_bytes(release),
    release["invariantFingerprint"],
)
release_core = {key: value for key, value in release.items() if key != "invariantFingerprint"}
record(
    "invariant-fingerprint",
    sha256_bytes(compact_json_bytes(release_core)) == release["invariantFingerprint"],
    release["invariantFingerprint"],
)
recomputed_source_hashes = [
    {"path": item["path"], "sha256": sha256_file(INTEGRATED_ROOT / item["path"])}
    for item in release["sourceHashes"]
]
record(
    "source-hash-parity",
    recomputed_source_hashes == release["sourceHashes"]
    and sha256_bytes(compact_json_bytes(release["sourceHashes"]))
    == release["sourceFingerprint"],
    {"sourceCount": len(recomputed_source_hashes), "sourceFingerprint": release["sourceFingerprint"]},
)
substrate = load_json(INTEGRATED_ROOT / release["substrateDependency"]["path"])
record(
    "substrate-dependency",
    substrate["releaseId"] == release["substrateDependency"]["releaseId"]
    and substrate["substrateFingerprint"]
    == release["substrateDependency"]["substrateFingerprint"],
    release["substrateDependency"],
)
record(
    "provenance-closure",
    all(item["provenance"] for item in release["invariants"])
    and all(
        provenance["sourceType"] == "external_doi"
        or sha256_file(INTEGRATED_ROOT / provenance["path"]) == provenance["sha256"]
        for item in release["invariants"]
        for provenance in item["provenance"]
    ),
    {"invariantCount": len(release["invariants"])},
)
record(
    "court-geometry",
    release["courtGeometry"]["gramMatrix"]
    == [[2, 0, 0, 0], [0, 2, 0, 0], [0, 0, 2, 0], [0, 0, 0, 2]]
    and release["courtGeometry"]["weights"] == [5, 5, 5, 5, 5],
    {
        "gramMatrix": release["courtGeometry"]["gramMatrix"],
        "weights": release["courtGeometry"]["weights"],
    },
)
record(
    "carey-enumerator",
    release["carey535"]["counts"]
    == {
        "intervalInstances": 20,
        "differenceSlots": 40,
        "differences": 20,
        "failureSlots": 25,
        "ambiguities": 0,
        "contradictions": 0,
        "failures": 0,
        "crossGenericComparisons": 150,
    }
    and release["carey535"]["CQ"] == {"numerator": 1, "denominator": 1}
    and release["carey535"]["SQ"] == {"numerator": 1, "denominator": 2},
    release["carey535"]["counts"],
)
record(
    "compression-namespace-guard",
    release["compressionGuard"]["status"] == "unresolved"
    and release["compressionGuard"]["value"] is None
    and set(release["compressionGuard"]["forbiddenEquivalences"])
    == {
        "physical.C_P",
        "semantic.C_S",
        "court.kappa_court",
        "physical.temperature",
        "physical.entropy",
        "physical.enthalpy",
        "physical.freeEnergy",
    },
    release["compressionGuard"],
)
positive = load_json(PACKAGE_ROOT / "fixtures/positive-cases.json")
record("positive-fixtures", len(positive["cases"]) == 6, [item["fixtureId"] for item in positive["cases"]])


def run_negative(test_case: dict[str, object]) -> tuple[str, dict[str, object]]:
    operation = test_case["operation"]
    try:
        if operation == "duplicate_transition_vector":
            masks = release["courtGeometry"]["positionMasks"]
            vector = signed_transition_vector(masks[0], masks[1])
            verify_court_gram(
                (
                    vector,
                    vector,
                    signed_transition_vector(masks[2], masks[3]),
                    signed_transition_vector(masks[3], masks[4]),
                )
            )
        elif operation == "resolve_off_path_mask":
            court_position_index(test_case["value"], release["courtGeometry"]["positionMasks"])
        elif operation == "overlap_xor_support":
            verify_disjoint_supports(((4, 5), (5, 10), (2, 3), (7, 8)))
        elif operation == "verify_weight":
            verify_weight_five((test_case["value"],))
        elif operation == "evaluate_noncanonical_carey":
            evaluate_carey_535(test_case["value"])
        elif operation == "remove_invariant_provenance":
            invariant = deepcopy(release["invariants"][0])
            invariant["provenance"] = []
            error = next(invariant_validator.iter_errors(invariant))
            return f"schema_{error.validator}", {}
        elif operation == "tamper_compression_guard":
            tampered = deepcopy(release)
            tampered["compressionGuard"]["guardLiteral"] = "C_H equals kappa_court."
            errors = list(release_validator.iter_errors(tampered))
            error = next(error for error in errors if error.validator == "const")
            return f"schema_{error.validator}", {}
        else:
            raise AssertionError(f"unknown_fixture_operation:{operation}")
    except (CourtInvariantError, CareyScopeError) as error:
        return error.reason_code, getattr(error, "detail", {})
    raise AssertionError(f"negative_fixture_did_not_fail:{test_case['fixtureId']}")


negative = load_json(PACKAGE_ROOT / "fixtures/negative-cases.json")
fixture_results = []
for test_case in negative["cases"]:
    reason, detail = run_negative(test_case)
    expected_detail = test_case.get("expectedDetail", {})
    passed = reason == test_case["expectedReason"] and all(
        detail.get(key) == value for key, value in expected_detail.items()
    )
    fixture_results.append(
        {
            "fixtureId": test_case["fixtureId"],
            "expectedReason": test_case["expectedReason"],
            "actualReason": reason,
            "detail": detail,
            "passed": passed,
        }
    )
record("negative-fixtures", all(item["passed"] for item in fixture_results), fixture_results)

failed = [item for item in checks if item["status"] == "FAIL"]
report = {
    "schemaVersion": "1.0.0",
    "packageVersion": release["packageVersion"],
    "releaseId": release["releaseId"],
    "invariantFingerprint": release["invariantFingerprint"],
    "status": "failed" if failed else "passed",
    "summary": {
        "checks": len(checks),
        "passed": len(checks) - len(failed),
        "failed": len(failed),
    },
    "checks": checks,
}
write_atomic(PACKAGE_ROOT / "qa/validation-report.json", canonical_json_bytes(report))
print(json.dumps({"status": report["status"], "summary": report["summary"]}))
raise SystemExit(1 if failed else 0)
