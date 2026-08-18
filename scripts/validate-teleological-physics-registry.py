#!/usr/bin/env python3
"""Independently validate the proposed Teleological Physics Registry v1.0.0."""

from __future__ import annotations

from copy import deepcopy
import hashlib
import json
from pathlib import Path
import sys
from typing import Any

import jsonschema
import yaml


ROOT = Path(__file__).resolve().parents[1]
REGISTRY_PATH = ROOT / "schemas/teleological_physics_registry_v1.0.0.yaml"
SCHEMA_PATH = ROOT / "schemas/teleological-physics-registry-v1.0.0.schema.json"
REPORT_SCHEMA_PATH = (
    ROOT / "schemas/teleological-physics-registry-validation-report-v1.0.0.schema.json"
)
REPORT_PATH = ROOT / "qa/teleological-physics-registry-validation.json"

POLICY_PATH = "schemas/court-runtime-policy.json"
HARMONIC_PATH = "seven-governors-harmonic-invariants-v0.1.0/canonical/harmonic-invariant-registry.json"
CONTRACT_PATH = "schemas/court-admission-contract.json"
SEMANTIC_PATH = "schemas/semantic_operator_registry_v1.0.1.yaml"

REPORT_SCHEMA_VERSION = "teleological-physics-registry-validation.v1.0.0"

EXPECTED_XOR_SUPPORTS = [[4, 5], [9, 10], [2, 3], [7, 8]]
EXPECTED_POLE_ORDER = ["Mars", "Jupiter", "Venus", "Saturn"]
EXPECTED_POSITIONS = {
    "C0": "0000",
    "C1": "1000",
    "C2": "1100",
    "C3": "1110",
    "C4": "1111",
}
ELEMENT_GOVERNORS = {
    "Fire (Mars)": "Mars",
    "Air (Jupiter)": "Jupiter",
    "Water (Venus)": "Venus",
    "Earth (Saturn)": "Saturn",
}
FORBIDDEN_RELATIONS = ("SETS_COURT_POLE", "EXECUTES_COURT_MOVE")
FORBIDDEN_PHYSICS_TERMS = (
    "temperature",
    "entropy",
    "enthalpy",
    "free energy",
    "physical quantity",
)

REPORT_CHECK_IDS = (
    "tpr-schema-identity",
    "tpr-admission-boundary",
    "tpr-source-bindings",
    "tpr-transition-coverage",
    "tpr-xor-support-replay",
    "tpr-pole-change-replay",
    "tpr-element-pole-coherence",
    "tpr-mercury-exclusion",
    "tpr-physics-guard",
    "tpr-forbidden-relations",
    "tpr-cross-registry-coherence",
    "tpr-guard-closure",
    "tpr-determinism",
    "tpr-negative-case-closure",
    "tpr-adversarial-rejection",
)


class TeleologicalRegistryValidationError(ValueError):
    """Stable independent-validation rejection."""

    def __init__(self, reason_code: str) -> None:
        super().__init__(reason_code)
        self.reason_code = reason_code


def _sha256_bytes(payload: bytes) -> str:
    return hashlib.sha256(payload).hexdigest()


def _read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def _require_intrinsic_json(value: Any) -> None:
    if value is None or isinstance(value, (str, bool)) or type(value) is int:
        return
    if isinstance(value, float):
        raise TypeError("non_integral_number_not_allowed")
    if isinstance(value, (list, tuple)):
        for item in value:
            _require_intrinsic_json(item)
        return
    if isinstance(value, dict):
        for item in value.values():
            _require_intrinsic_json(item)
        return
    raise TypeError(f"unsupported_json_type:{type(value).__name__}")


def _canonical_bytes(value: Any) -> bytes:
    _require_intrinsic_json(value)
    return json.dumps(
        value,
        ensure_ascii=False,
        allow_nan=False,
        separators=(",", ":"),
        sort_keys=True,
    ).encode("utf-8")


def _sha256_payload(value: Any) -> str:
    return _sha256_bytes(_canonical_bytes(value))


def _load_registry() -> dict[str, Any]:
    return yaml.safe_load(REGISTRY_PATH.read_text(encoding="utf-8"))


def _load_policy() -> dict[str, Any]:
    return _read_json(ROOT / POLICY_PATH)


def _load_harmonic() -> dict[str, Any]:
    return _read_json(ROOT / HARMONIC_PATH)


def _edge_index(from_position: str, to_position: str) -> int:
    left = int(from_position[1])
    right = int(to_position[1])
    if abs(left - right) != 1:
        raise TeleologicalRegistryValidationError("transition_adjacency_invalid")
    return min(left, right)


def _semantic_rejection_code(document: dict[str, Any]) -> str | None:
    metadata = document.get("metadata", {})
    if (
        metadata.get("physical_quantity_claim") is not False
        or metadata.get("no_electromagnetic_equivalence") is not True
        or metadata.get("equations_symbolic_only") is not True
    ):
        return "physical_claim_invalid"
    boundary = document.get("admission_boundary", {})
    if (
        boundary.get("writes_court_pole_disposition") is not False
        or boundary.get("runtime_effect") is not False
        or boundary.get("no_thermodynamic_equivalence") is not True
    ):
        return "boundary_write_invalid"

    transitions = document.get("transitions", [])
    ids = [item.get("transition_id") for item in transitions]
    if len(set(ids)) != len(ids):
        return "duplicate_id_rejected"
    if len(transitions) != 8:
        return "transition_count_invalid"
    for item in transitions:
        _edge_index(item.get("from_position", ""), item.get("to_position", ""))

    policy = _load_policy()
    policy_pairs = {
        (item["source"], item["target"], item["operationId"])
        for item in policy["ordinaryMoves"]
    }
    registry_pairs = {
        (item.get("from_position"), item.get("to_position"), item.get("operation_id"))
        for item in transitions
    }
    if registry_pairs != policy_pairs:
        return "transition_coverage_mismatch"

    harmonic = _load_harmonic()
    xor_by_index = harmonic["courtGeometry"]["xorSupports"]
    for item in transitions:
        edge = _edge_index(item.get("from_position", ""), item.get("to_position", ""))
        if item.get("xor_support") != xor_by_index[edge]:
            return "xor_support_mismatch"
        element = item.get("element")
        governor = ELEMENT_GOVERNORS.get(element)
        if governor is None:
            return "element_pole_mismatch"
        from_vector = EXPECTED_POSITIONS.get(item.get("from_position", ""))
        to_vector = EXPECTED_POSITIONS.get(item.get("to_position", ""))
        if from_vector is None or to_vector is None:
            return "position_invalid"
        flipped = [
            EXPECTED_POLE_ORDER[index]
            for index in range(4)
            if from_vector[index] != to_vector[index]
        ]
        if flipped != [governor]:
            return "element_pole_mismatch"
        flipped_index = next(
            index for index in range(4) if from_vector[index] != to_vector[index]
        )
        expected_change = (
            "external_to_internal"
            if from_vector[flipped_index] == "0"
            else "internal_to_external"
        )
        if item.get("pole_change") != expected_change:
            return "pole_change_mismatch"

    for interface in document.get("engine_interface", []):
        if (
            interface.get("is_transition") is not False
            or interface.get("is_binary_court_pole") is not False
            or interface.get("xor_support") is not None
            or interface.get("pole_change") != "none"
        ):
            return "mercury_transition_invalid"

    text = json.dumps(document, ensure_ascii=False, default=str)

    def _has_forbidden_relation_key(value: Any) -> bool:
        if isinstance(value, dict):
            if any(key in FORBIDDEN_RELATIONS for key in value):
                return True
            return any(_has_forbidden_relation_key(item) for item in value.values())
        if isinstance(value, list):
            return any(_has_forbidden_relation_key(item) for item in value)
        return False

    if _has_forbidden_relation_key(document):
        return "forbidden_relation"
    return None


def verify_registry_document(document: dict[str, Any]) -> None:
    semantic_rejection = _semantic_rejection_code(document)
    if semantic_rejection is not None:
        raise TeleologicalRegistryValidationError(semantic_rejection)
    try:
        jsonschema.Draft202012Validator(_read_json(SCHEMA_PATH)).validate(document)
    except jsonschema.ValidationError as error:
        raise TeleologicalRegistryValidationError("registry_schema_invalid") from error


def _mutated_cases(document: dict[str, Any]) -> dict[str, dict[str, Any]]:
    cases: dict[str, dict[str, Any]] = {}

    tampered = deepcopy(document)
    tampered["transitions"].append(deepcopy(tampered["transitions"][0]))
    tampered["transitions"][-1]["transition_id"] = "court_advance_C0_to_C1_duplicate"
    cases["ninth-transition-or-duplicate"] = tampered

    tampered = deepcopy(document)
    tampered["transitions"][0]["xor_support"] = [4, 6]
    cases["wrong-xor-support"] = tampered

    tampered = deepcopy(document)
    tampered["transitions"][0]["pole_change"] = "internal_to_external"
    cases["reversed-pole-change"] = tampered

    tampered = deepcopy(document)
    tampered["transitions"][0]["element"] = "Air (Jupiter)"
    cases["element-pole-mismatch"] = tampered

    tampered = deepcopy(document)
    tampered["transitions"][0]["to_position"] = "C2"
    cases["non-adjacent-transition"] = tampered

    tampered = deepcopy(document)
    tampered["engine_interface"][0]["is_transition"] = True
    cases["mercury-as-transition"] = tampered

    tampered = deepcopy(document)
    tampered["metadata"]["physical_quantity_claim"] = True
    cases["physical-claim-true"] = tampered

    tampered = deepcopy(document)
    tampered["admission_boundary"]["writes_court_pole_disposition"] = True
    cases["court-write-boundary"] = tampered

    tampered = deepcopy(document)
    tampered["transitions"][0]["semantic_delta"]["SETS_COURT_POLE"] = "C1"
    cases["forbidden-relation-injected"] = tampered

    return cases


EXPECTED_MUTATION_CODES = {
    "ninth-transition-or-duplicate": "transition_count_invalid",
    "wrong-xor-support": "xor_support_mismatch",
    "reversed-pole-change": "pole_change_mismatch",
    "element-pole-mismatch": "element_pole_mismatch",
    "non-adjacent-transition": "transition_adjacency_invalid",
    "mercury-as-transition": "mercury_transition_invalid",
    "physical-claim-true": "physical_claim_invalid",
    "court-write-boundary": "boundary_write_invalid",
    "forbidden-relation-injected": "forbidden_relation",
}


def _adversarial_results(document: dict[str, Any]) -> dict[str, str]:
    results = {}
    for case_id, mutated in _mutated_cases(document).items():
        try:
            verify_registry_document(mutated)
        except (TeleologicalRegistryValidationError, jsonschema.ValidationError) as error:
            reason = (
                error.reason_code
                if isinstance(error, TeleologicalRegistryValidationError)
                else "registry_schema_invalid"
            )
            results[case_id] = reason
        else:
            results[case_id] = "accepted_invalid_registry"
    return results


def _report_shape_valid(report: dict[str, Any]) -> bool:
    try:
        jsonschema.Draft202012Validator(_read_json(REPORT_SCHEMA_PATH)).validate(report)
    except jsonschema.ValidationError:
        return False
    checks = report.get("checks", [])
    passed = sum(item.get("status") == "PASS" for item in checks)
    failed = sum(item.get("status") == "FAIL" for item in checks)
    core = {key: value for key, value in report.items() if key != "reportFingerprint"}
    return (
        tuple(item.get("checkId") for item in checks) == REPORT_CHECK_IDS
        and report.get("checksPassed") == passed
        and report.get("checksFailed") == failed
        and report.get("verdict") == ("PASS" if failed == 0 else "FAIL")
        and report.get("reportFingerprint") == _sha256_payload(core)
    )


def validate(document: dict[str, Any]) -> dict[str, Any]:
    checks: list[dict[str, Any]] = []

    def record(
        check_id: str, passed: bool, diagnostic: Any, locator: str,
        expected: Any = None, actual: Any = None,
    ) -> None:
        checks.append(
            {
                "checkId": check_id,
                "diagnostic": diagnostic,
                "evidenceLocator": locator,
                "expected": expected,
                "actual": actual,
                "status": "PASS" if passed else "FAIL",
            }
        )

    schema_valid = True
    schema_diagnostic = "valid"
    try:
        jsonschema.Draft202012Validator(_read_json(SCHEMA_PATH)).validate(document)
    except jsonschema.ValidationError as error:
        schema_valid = False
        schema_diagnostic = error.message

    metadata = document["metadata"]
    record(
        "tpr-schema-identity",
        schema_valid
        and metadata.get("registry_id") == "teleological_physics_registry"
        and metadata.get("version") == "1.0.0"
        and metadata.get("admission_status") == "proposed"
        and metadata.get("layer") == 4,
        schema_diagnostic,
        str(SCHEMA_PATH),
        "teleological_physics_registry 1.0.0 proposed",
        {
            "registryId": metadata.get("registry_id"),
            "version": metadata.get("version"),
            "admissionStatus": metadata.get("admission_status"),
        },
    )

    boundary = document["admission_boundary"]
    record(
        "tpr-admission-boundary",
        all(
            boundary.get(key) is False
            for key in (
                "runtime_effect", "graph_effect", "policy_effect",
                "ledger_effect", "admission_effect",
                "writes_court_pole_disposition",
            )
        )
        and boundary.get("kappa_court_access") == "read_only_replay"
        and boundary.get("global_ch_access") == "no_write"
        and boundary.get("no_thermodynamic_equivalence") is True
        and boundary.get("no_pentatonic_family_admission_claim") is True
        and boundary.get("crt310_gate_effect") is False,
        boundary,
        str(REGISTRY_PATH) + "#admission_boundary",
    )

    policy = _load_policy()
    harmonic = _load_harmonic()
    contract = _read_json(ROOT / CONTRACT_PATH)
    semantic_registry = yaml.safe_load((ROOT / SEMANTIC_PATH).read_text(encoding="utf-8"))
    record(
        "tpr-source-bindings",
        policy["poleOrder"] == EXPECTED_POLE_ORDER
        and len(policy["ordinaryMoves"]) == 8
        and harmonic["courtGeometry"]["xorSupports"] == EXPECTED_XOR_SUPPORTS
        and harmonic["courtGeometry"]["gramMatrix"] == [[2, 0, 0, 0], [0, 2, 0, 0], [0, 0, 2, 0], [0, 0, 0, 2]],
        {
            "policy": _sha256_bytes((ROOT / POLICY_PATH).read_bytes()),
            "harmonic": _sha256_bytes((ROOT / HARMONIC_PATH).read_bytes()),
            "contract": _sha256_bytes((ROOT / CONTRACT_PATH).read_bytes()),
        },
        POLICY_PATH,
    )

    transitions = document["transitions"]
    policy_pairs = {
        (item["source"], item["target"], item["operationId"])
        for item in policy["ordinaryMoves"]
    }
    registry_pairs = {
        (item["from_position"], item["to_position"], item["operation_id"])
        for item in transitions
    }
    record(
        "tpr-transition-coverage",
        registry_pairs == policy_pairs and len(transitions) == 8,
        {"policyPairs": len(policy_pairs), "registryTransitions": len(transitions)},
        POLICY_PATH + "#ordinaryMoves",
        sorted(policy_pairs),
        sorted(registry_pairs),
    )

    xor_failures = []
    for item in transitions:
        edge = _edge_index(item["from_position"], item["to_position"])
        if item["xor_support"] != harmonic["courtGeometry"]["xorSupports"][edge]:
            xor_failures.append(item["transition_id"])
    record(
        "tpr-xor-support-replay",
        not xor_failures,
        xor_failures,
        HARMONIC_PATH + "#courtGeometry.xorSupports",
        EXPECTED_XOR_SUPPORTS,
        [item["xor_support"] for item in transitions],
    )

    pole_failures = []
    change_failures = []
    for item in transitions:
        from_vector = EXPECTED_POSITIONS[item["from_position"]]
        to_vector = EXPECTED_POSITIONS[item["to_position"]]
        flipped = [
            EXPECTED_POLE_ORDER[index]
            for index in range(4)
            if from_vector[index] != to_vector[index]
        ]
        governor = ELEMENT_GOVERNORS.get(item["element"])
        if flipped != [governor]:
            pole_failures.append(item["transition_id"])
        flipped_index = next(
            index for index in range(4) if from_vector[index] != to_vector[index]
        )
        expected_change = (
            "external_to_internal"
            if from_vector[flipped_index] == "0"
            else "internal_to_external"
        )
        if item["pole_change"] != expected_change:
            change_failures.append(item["transition_id"])
    record(
        "tpr-pole-change-replay",
        not pole_failures and not change_failures,
        {"poleFailures": pole_failures, "changeFailures": change_failures},
        POLICY_PATH + "#positions",
        [item["pole_change"] for item in transitions],
        [item["pole_change"] for item in transitions],
    )

    element_failures = []
    for item in transitions:
        governor = ELEMENT_GOVERNORS.get(item["element"])
        if governor is None or f" ({governor})" not in item["element"]:
            element_failures.append(item["transition_id"])
    record(
        "tpr-element-pole-coherence",
        not element_failures,
        element_failures,
        str(REGISTRY_PATH) + "#transitions[].element",
    )

    interfaces = document["engine_interface"]
    mercury_ok = (
        len(interfaces) == 1
        and all(
            item.get("is_transition") is False
            and item.get("is_binary_court_pole") is False
            and item.get("xor_support") is None
            and item.get("pole_change") == "none"
            for item in interfaces
        )
    )
    record(
        "tpr-mercury-exclusion",
        mercury_ok,
        interfaces,
        str(REGISTRY_PATH) + "#engine_interface",
    )

    def _anchor_only(text: str) -> bool:
        anchors = []
        for item in transitions:
            anchors.append(item["physical_process"]["symbolic_anchor"])
        for item in interfaces:
            anchors.append(item["physical_process"]["symbolic_anchor"])
        lower = text.lower()
        return (
            metadata.get("physical_quantity_claim") is False
            and metadata.get("equations_symbolic_only") is True
            and not any(term in lower for term in FORBIDDEN_PHYSICS_TERMS)
        )

    record(
        "tpr-physics-guard",
        _anchor_only(json.dumps(document, default=str)),
        "symbolic anchors only",
        str(REGISTRY_PATH) + "#metadata",
    )

    text = json.dumps(document, ensure_ascii=False, default=str)

    def _has_forbidden_relation_key_in_document(value: Any) -> bool:
        if isinstance(value, dict):
            if any(key in FORBIDDEN_RELATIONS for key in value):
                return True
            return any(_has_forbidden_relation_key_in_document(item) for item in value.values())
        if isinstance(value, list):
            return any(_has_forbidden_relation_key_in_document(item) for item in value)
        return False

    record(
        "tpr-forbidden-relations",
        not _has_forbidden_relation_key_in_document(document),
        "no executable Court relation keys",
        str(REGISTRY_PATH) + "#transitions",
    )

    r1_anchor = next(
        item["physical_process"]["symbolic_anchor"]
        for item in semantic_registry["operators"]
        if item["operator_id"] == "saturn_degree_raise_v1"
    )
    r5_anchor = next(
        item["physical_process"]["symbolic_anchor"]
        for item in semantic_registry["operators"]
        if item["operator_id"] == "venus_degree_raise_v1"
    )
    saturn_advance = next(
        item for item in transitions if item["transition_id"] == "court_advance_C3_to_C4"
    )
    venus_advance = next(
        item for item in transitions if item["transition_id"] == "court_advance_C2_to_C3"
    )
    cross_ok = (
        "2d sin" in saturn_advance["physical_process"]["symbolic_anchor"]
        and "2d sin" in r1_anchor
        and "(1/2)F/L" in venus_advance["physical_process"]["symbolic_anchor"]
        and "(1/2)F/L" in r5_anchor
    )
    record(
        "tpr-cross-registry-coherence",
        cross_ok,
        {"r1": r1_anchor, "r5": r5_anchor},
        SEMANTIC_PATH + "#operators",
    )

    guard_ids = {item["guard_id"] for item in document["guards"]}
    expected_guards = {
        "physics_symbolic_only",
        "runtime_owns_transitions",
        "no_court_writes",
        "mercury_not_a_transition",
        "kappa_and_ch_untouched",
        "no_pentatonic_family_claims",
        "crt310_untouched",
        "excluded_relation_vocabulary_absent",
    }
    record(
        "tpr-guard-closure",
        guard_ids == expected_guards and len(document["guards"]) == 8,
        sorted(guard_ids),
        str(REGISTRY_PATH) + "#guards",
    )

    payload_a = _canonical_bytes(document)
    payload_b = _canonical_bytes(_load_registry())
    record(
        "tpr-determinism",
        payload_a == payload_b,
        _sha256_payload(document),
        str(REGISTRY_PATH),
    )

    adversarial = _adversarial_results(document)
    record(
        "tpr-negative-case-closure",
        set(adversarial) == set(EXPECTED_MUTATION_CODES),
        list(adversarial),
        str(REPORT_PATH),
        sorted(EXPECTED_MUTATION_CODES),
        sorted(adversarial),
    )
    record(
        "tpr-adversarial-rejection",
        adversarial == EXPECTED_MUTATION_CODES,
        adversarial,
        str(REGISTRY_PATH),
        EXPECTED_MUTATION_CODES,
        adversarial,
    )

    failures = [item for item in checks if item["status"] == "FAIL"]
    report_core = {
        "checks": checks,
        "checksFailed": len(failures),
        "checksPassed": len(checks) - len(failures),
        "registryId": "teleological_physics_registry",
        "registryVersion": "1.0.0",
        "schemaVersion": REPORT_SCHEMA_VERSION,
        "verdict": "FAIL" if failures else "PASS",
    }
    report = {**report_core, "reportFingerprint": _sha256_payload(report_core)}
    if not _report_shape_valid(report):
        raise TeleologicalRegistryValidationError("validation_report_shape_invalid")
    return report


def main() -> int:
    document = _load_registry()
    report = validate(document)
    REPORT_PATH.write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0 if report["verdict"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
