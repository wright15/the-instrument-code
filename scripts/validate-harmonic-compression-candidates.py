#!/usr/bin/env python3
"""Validate GOV-213 scoped harmonic-compression evidence."""

from __future__ import annotations

from copy import deepcopy
import json
from pathlib import Path
import sys

import jsonschema


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))
sys.path.insert(0, str(ROOT / "court-mathematics/src"))

from court_mathematics import PitchClassSet, RootedScale  # noqa: E402
from governor.harmonic_compression import (  # noqa: E402
    EXPECTED_A0_ORDER,
    GLOBAL_GUARD_LITERAL,
    Q_BY_SIGNATURE,
    SCOPE_TIERS,
    WEIGHT_DENOMINATOR,
    WEIGHT_NUMERATORS,
    HarmonicCompressionError,
    _q_signature,
    build_harmonic_compression_candidate,
    serialize_harmonic_compression_candidate,
    verify_harmonic_compression_candidate,
)
from governor.hashing import sha256_payload  # noqa: E402


CANDIDATE_PATH = ROOT / "canonical/harmonic-compression-candidates/CH_A012_q_v1.json"
SCHEMA_PATH = ROOT / "schemas/harmonic-compression-candidates/candidate-release.schema.json"
REPORT_SCHEMA_PATH = ROOT / "schemas/harmonic-compression-candidates/validation-report.schema.json"
REPORT_PATH = ROOT / "qa/harmonic-compression-candidates-validation.json"


def _read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def _rehash(document: dict) -> None:
    core = {key: value for key, value in document.items() if key != "candidateFingerprint"}
    document["candidateFingerprint"] = sha256_payload(core)


def _expect_rejected(document: dict) -> bool:
    try:
        verify_harmonic_compression_candidate(document, root=ROOT)
    except HarmonicCompressionError:
        return True
    return False


def _transposition_invariance(document: dict) -> list[int]:
    failures = []
    for record in document["records"]:
        base = RootedScale.from_pitch_classes(record["pitchClasses"], root=0)
        expected = tuple(record["triadicCompressionSignature"])
        for shift in range(12):
            actual, _ = _q_signature(base.transpose(shift))
            if actual != expected:
                failures.append(record["stateId"])
                break
    return failures


def _modal_covariance(document: dict) -> list[int]:
    failures = []
    for record in document["records"]:
        scale = RootedScale.from_pitch_classes(record["pitchClasses"], root=0)
        initial, _ = _q_signature(scale)
        current = scale
        for _ in range(7):
            next_root = current.ordered_pitch_classes[1]
            next_scale = RootedScale(current.pitch_set, next_root)
            next_signature, _ = _q_signature(next_scale)
            current_signature, _ = _q_signature(current)
            if next_signature != current_signature[1:] + current_signature[:1]:
                failures.append(record["stateId"])
                break
            current = next_scale
        final, _ = _q_signature(current)
        if final != initial or current.root != scale.root:
            failures.append(record["stateId"])
    return sorted(set(failures))


def _adversarial_results(document: dict) -> dict[str, bool]:
    results = {}

    tampered = deepcopy(document)
    tampered["records"][0]["role"] = "satellite"
    _rehash(tampered)
    results["tier-only-satellite-selection"] = _expect_rejected(tampered)

    tampered = deepcopy(document)
    tampered["records"][0]["stateId"] = 223
    tampered["records"][0]["role"] = "boundary"
    _rehash(tampered)
    results["boundary-selection"] = _expect_rejected(tampered)

    tampered = deepcopy(document)
    weights = tampered["method"]["weightNumerators"]
    weights[0], weights[3] = weights[3], weights[0]
    _rehash(tampered)
    results["invalid-chaldean-weights"] = _expect_rejected(tampered)

    tampered = deepcopy(document)
    tampered["sourceBindings"][0]["sha256"] = "0" * 64
    _rehash(tampered)
    results["source-hash-drift"] = _expect_rejected(tampered)

    tampered = deepcopy(document)
    tampered["records"][0]["triadicCompressionSignature"][0] = 3
    record_core = {
        key: value
        for key, value in tampered["records"][0].items()
        if key != "recordFingerprint"
    }
    tampered["records"][0]["recordFingerprint"] = sha256_payload(record_core)
    _rehash(tampered)
    results["signature-tamper"] = _expect_rejected(tampered)

    tampered = deepcopy(document)
    tampered["globalAggregate"]["status"] = "admitted"
    tampered["globalAggregate"]["value"] = 1
    _rehash(tampered)
    results["global-C-H-promotion"] = _expect_rejected(tampered)

    return results


def validate(document: dict) -> dict:
    checks = []

    def record(check_id: str, passed: bool, diagnostic) -> None:
        checks.append(
            {"checkId": check_id, "status": "PASS" if passed else "FAIL", "diagnostic": diagnostic}
        )

    schema = _read_json(SCHEMA_PATH)
    try:
        jsonschema.Draft202012Validator(schema).validate(document)
        record("schema", True, "valid")
    except jsonschema.ValidationError as error:
        record("schema", False, error.message)

    core = {key: value for key, value in document.items() if key != "candidateFingerprint"}
    record(
        "candidate-fingerprint",
        document.get("candidateFingerprint") == sha256_payload(core),
        document.get("candidateFingerprint"),
    )

    expected = build_harmonic_compression_candidate(root=ROOT)
    record(
        "checked-artifact-freshness",
        serialize_harmonic_compression_candidate(document)
        == serialize_harmonic_compression_candidate(expected),
        {"expected": expected["candidateFingerprint"], "actual": document.get("candidateFingerprint")},
    )
    first = build_harmonic_compression_candidate(root=ROOT)
    second = build_harmonic_compression_candidate(root=ROOT)
    reversed_input = build_harmonic_compression_candidate(root=ROOT, reverse_input=True)
    record(
        "build-twice-identity",
        serialize_harmonic_compression_candidate(first)
        == serialize_harmonic_compression_candidate(second),
        first["candidateFingerprint"],
    )
    record(
        "reordered-input-identity",
        serialize_harmonic_compression_candidate(first)
        == serialize_harmonic_compression_candidate(reversed_input),
        reversed_input["candidateFingerprint"],
    )

    records = document.get("records", [])
    record(
        "scope-and-theorem-closure",
        len(records) == 21
        and all(item.get("role") == "anchor" and item.get("tier") in SCOPE_TIERS for item in records)
        and all(item.get("governorSeatCompressionClass") == 2 for item in records)
        and document.get("invariants", {}).get("a0Order") == list(EXPECTED_A0_ORDER)
        and document.get("invariants", {}).get("tierSumOrder") == [5, 8, 13]
        and document.get("invariants", {}).get("a0A1Gap") == {"numerator": 3, "denominator": 407}
        and document.get("invariants", {}).get("a1A2Gap") == {"numerator": 22, "denominator": 407},
        {"recordCount": len(records), "seatPassCount": document.get("invariants", {}).get("governorSeatPassCount")},
    )
    record(
        "method-and-weight-closure",
        document.get("method", {}).get("weightNumerators") == list(WEIGHT_NUMERATORS)
        and document.get("method", {}).get("weightDenominator") == WEIGHT_DENOMINATOR
        and document.get("method", {}).get("uniquenessClaim") is False
        and len(Q_BY_SIGNATURE) == 6,
        document.get("method", {}),
    )

    transposition_failures = _transposition_invariance(document)
    record("joint-transposition-invariance", not transposition_failures, transposition_failures)
    modal_failures = _modal_covariance(document)
    record("modal-M7-covariance", not modal_failures, modal_failures)

    negative_controls = document.get("negativeControls", {})
    record(
        "negative-control-closure",
        negative_controls.get("intervalVectorOnlyCollision", {}).get("stateCount") == 7
        and negative_controls.get("intervalVectorOnlyCollision", {}).get("distinctQCount") == 7
        and negative_controls.get("tierOnlySelectionTrap", {}).get("result") == "excluded"
        and negative_controls.get("boundarySelectionTrap", {}).get("result") == "excluded",
        negative_controls,
    )
    adversarial = _adversarial_results(document)
    fixture_case_ids = {
        item["caseId"]
        for item in _read_json(
            ROOT / "canonical/harmonic-compression-candidates/negative-cases.json"
        )["cases"]
    }
    record(
        "adversarial-tamper-rejection",
        set(adversarial) == fixture_case_ids and all(adversarial.values()),
        adversarial,
    )

    global_aggregate = document.get("globalAggregate", {})
    record(
        "global-C-H-remains-unresolved",
        global_aggregate
        == {
            "namespace": "harmonic.C_H",
            "status": "unresolved",
            "value": None,
            "guardLiteral": GLOBAL_GUARD_LITERAL,
        },
        global_aggregate,
    )

    failed = [check for check in checks if check["status"] == "FAIL"]
    report_core = {
        "schemaVersion": "gov-213.harmonic-compression-candidate-validation.v1",
        "verdict": "FAIL" if failed else "PASS",
        "candidateId": "CH_A012_q_v1",
        "candidateFingerprint": document.get("candidateFingerprint", "0" * 64),
        "checksPassed": len(checks) - len(failed),
        "checksFailed": len(failed),
        "checks": checks,
    }
    return {**report_core, "reportFingerprint": sha256_payload(report_core)}


def main() -> int:
    document = _read_json(CANDIDATE_PATH)
    report = validate(document)
    jsonschema.Draft202012Validator(_read_json(REPORT_SCHEMA_PATH)).validate(report)
    REPORT_PATH.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))
    return 0 if report["verdict"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
