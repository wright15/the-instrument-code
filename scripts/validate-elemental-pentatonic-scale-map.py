#!/usr/bin/env python3
"""Independently validate the proposed Elemental Pentatonic Scale Map v1.0.0."""

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
REGISTRY_PATH = ROOT / "schemas/elemental_pentatonic_scale_map_v1.0.0.yaml"
SCHEMA_PATH = ROOT / "schemas/elemental-pentatonic-scale-map-v1.0.0.schema.json"
REPORT_SCHEMA_PATH = (
    ROOT / "schemas/elemental-pentatonic-scale-map-validation-report-v1.0.0.schema.json"
)
REPORT_PATH = ROOT / "qa/elemental-pentatonic-scale-map-validation.json"

POLICY_PATH = "schemas/court-runtime-policy.json"
COMPLEMENT_PATH = "seven-governors-court-substrate-v0.1.0/canonical/complement-map.json"
NETWORK_PATH = "canonical/universal-network-data.json"
PENTATONIC_REGISTRY_PATH = "seven-governors-court-substrate-v0.1.0/canonical/pentatonic-set-class-registry.json"
CRT347_PATH = "canonical/fivefold-capability-candidates/fivefold-capability-teleology-v1.json"
CRT349_PATH = "schemas/teleological_physics_registry_v1.0.0.yaml"

REPORT_SCHEMA_VERSION = "elemental-pentatonic-scale-map-validation.v1.0.0"

EXPECTED_COURT_MASKS = [661, 677, 1189, 1193, 1321]
EXPECTED_POSITION_ORDER = ["C0", "C1", "C2", "C3", "C4"]
EXPECTED_BRIGHTNESS = [22, 23, 24, 25, 26]
EXPECTED_KAPPA = [
    {"numerator": 0, "denominator": 1},
    {"numerator": 1, "denominator": 4},
    {"numerator": 1, "denominator": 2},
    {"numerator": 3, "denominator": 4},
    {"numerator": 1, "denominator": 1},
]
GOVERNOR_BY_MASK = {
    3434: "Saturn",
    3418: "Venus",
    2906: "Jupiter",
    2902: "Mercury",
    2774: "Mars",
}
FORBIDDEN_RELATIONS = ("SETS_COURT_POLE", "EXECUTES_COURT_MOVE")

REPORT_CHECK_IDS = (
    "epsm-schema-identity",
    "epsm-admission-boundary",
    "epsm-court-position-replay",
    "epsm-orientation-replay",
    "epsm-class-replay",
    "epsm-brightness-kappa-monotonic",
    "epsm-complement-replay",
    "epsm-mercury-exclusion",
    "epsm-physics-guard",
    "epsm-forbidden-relations",
    "epsm-cross-registry-refs",
    "epsm-guard-closure",
    "epsm-determinism",
    "epsm-negative-case-closure",
    "epsm-adversarial-rejection",
)

MUTATION_IDS = (
    "wrong-court-mask",
    "mercury-exclusion-violated",
    "orientation-mismatch",
    "kappa-mismatch",
    "brightness-non-monotonic",
    "physical-claim-true",
    "court-write-boundary",
    "complement-wrong",
    "forbidden-relation-injected",
    "duplicate-id",
)

EXPECTED_MUTATION_CODES = {
    "wrong-court-mask": "court_position_mask_mismatch",
    "mercury-exclusion-violated": "mercury_exclusion_invalid",
    "orientation-mismatch": "orientation_mismatch",
    "kappa-mismatch": "kappa_replay_mismatch",
    "brightness-non-monotonic": "brightness_monotonic_invalid",
    "physical-claim-true": "physical_claim_invalid",
    "court-write-boundary": "boundary_write_invalid",
    "complement-wrong": "complement_replay_mismatch",
    "forbidden-relation-injected": "forbidden_relation",
    "duplicate-id": "duplicate_id_rejected",
}


class ElementalScaleMapValidationError(ValueError):
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


def _complement_pairs_by_position() -> dict[str, dict[str, int]]:
    complement = _read_json(ROOT / COMPLEMENT_PATH)
    pairs = {}
    for item in complement["complementMaps"]:
        if item["pentatonicSetClassId"] == "pentatonic:5-35":
            for pair in item["rootedPairs"]:
                pairs[pair["rootedRecordId"]] = pair
    return pairs


def _semantic_rejection_code(document: dict[str, Any]) -> str | None:
    metadata = document.get("metadata", {})
    if (
        metadata.get("physical_quantity_claim") is not False
        or metadata.get("no_electromagnetic_equivalence") is not True
    ):
        return "physical_claim_invalid"
    boundary = document.get("admission_boundary", {})
    if boundary.get("writes_court_pole_disposition") is not False:
        return "boundary_write_invalid"

    bindings = document.get("scale_bindings", [])
    ids = [item.get("ian_ring_id") for item in bindings]
    if len(set(ids)) != len(ids):
        return "duplicate_id_rejected"

    policy = _load_policy()
    policy_masks = [item["pitchMask"] for item in policy["positions"]]
    policy_positions = [item["positionId"] for item in policy["positions"]]
    if len(bindings) != 5:
        return "binding_count_invalid"
    for index, item in enumerate(bindings):
        if (
            item.get("pitch_mask") != policy_masks[index]
            or item.get("court_position") != policy_positions[index]
        ):
            return "court_position_mask_mismatch"
        if int(item.get("mask_string_msb", "0")[::-1] or "0", 2) != item.get("pitch_mask"):
            return "orientation_mismatch"
        if int(item.get("mask_string_msb", "0"), 2) != item.get("as_written_msb_integer"):
            return "orientation_mismatch"
        if item.get("kappa_court") != EXPECTED_KAPPA[index]:
            return "kappa_replay_mismatch"

    brightnesses = [item.get("brightness") for item in bindings]
    if any(
        brightnesses[index] != EXPECTED_BRIGHTNESS[index]
        for index in range(5)
    ):
        return "brightness_monotonic_invalid"

    pairs = _complement_pairs_by_position()
    for item in bindings:
        position = item.get("court_position")
        pair = pairs.get(f"court-position:{position}")
        if pair is None or pair["pentatonicMask"] != item.get("pitch_mask"):
            return "complement_replay_mismatch"
        expected_complement = 4095 ^ item["pitch_mask"]
        if (
            pair["rawHeptatonicComplementMask"] != expected_complement
            or item.get("complement_evidence", {}).get("raw_heptatonic_complement_mask")
            != expected_complement
        ):
            return "complement_replay_mismatch"

    for item in bindings:
        if item.get("element") == "Quintessence (Mercury)":
            if (
                item.get("is_binary_court_pole") is not False
                or item.get("court_pole_index") is not None
                or item.get("register_membership") != "excluded"
            ):
                return "mercury_exclusion_invalid"

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
        raise ElementalScaleMapValidationError(semantic_rejection)
    try:
        jsonschema.Draft202012Validator(_read_json(SCHEMA_PATH)).validate(document)
    except jsonschema.ValidationError as error:
        raise ElementalScaleMapValidationError("registry_schema_invalid") from error


def _mutated_cases(document: dict[str, Any]) -> dict[str, dict[str, Any]]:
    cases: dict[str, dict[str, Any]] = {}

    tampered = deepcopy(document)
    tampered["scale_bindings"][1]["pitch_mask"] = 667
    cases["wrong-court-mask"] = tampered

    tampered = deepcopy(document)
    mercury = next(
        item for item in tampered["scale_bindings"] if item["element"] == "Quintessence (Mercury)"
    )
    mercury["is_binary_court_pole"] = True
    mercury["court_pole_index"] = 2
    mercury["register_membership"] = "included"
    cases["mercury-exclusion-violated"] = tampered

    tampered = deepcopy(document)
    tampered["scale_bindings"][0]["mask_string_msb"] = "101010010101"
    cases["orientation-mismatch"] = tampered

    tampered = deepcopy(document)
    tampered["scale_bindings"][2]["kappa_court"] = {"numerator": 1, "denominator": 3}
    cases["kappa-mismatch"] = tampered

    tampered = deepcopy(document)
    tampered["scale_bindings"][0]["brightness"] = 30
    cases["brightness-non-monotonic"] = tampered

    tampered = deepcopy(document)
    tampered["metadata"]["physical_quantity_claim"] = True
    cases["physical-claim-true"] = tampered

    tampered = deepcopy(document)
    tampered["admission_boundary"]["writes_court_pole_disposition"] = True
    cases["court-write-boundary"] = tampered

    tampered = deepcopy(document)
    tampered["scale_bindings"][4]["complement_evidence"]["raw_heptatonic_complement_mask"] = 2773
    cases["complement-wrong"] = tampered

    tampered = deepcopy(document)
    tampered["scale_bindings"][0]["SETS_COURT_POLE"] = "C1"
    cases["forbidden-relation-injected"] = tampered

    tampered = deepcopy(document)
    tampered["scale_bindings"][1]["ian_ring_id"] = 661
    cases["duplicate-id"] = tampered

    return cases


def _adversarial_results(document: dict[str, Any]) -> dict[str, str]:
    results = {}
    for case_id, mutated in _mutated_cases(document).items():
        try:
            verify_registry_document(mutated)
        except (ElementalScaleMapValidationError, jsonschema.ValidationError) as error:
            reason = (
                error.reason_code
                if isinstance(error, ElementalScaleMapValidationError)
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
        "epsm-schema-identity",
        schema_valid
        and metadata.get("registry_id") == "elemental_pentatonic_scale_map"
        and metadata.get("version") == "1.0.0"
        and metadata.get("admission_status") == "proposed",
        schema_diagnostic,
        str(SCHEMA_PATH),
    )

    boundary = document["admission_boundary"]
    record(
        "epsm-admission-boundary",
        all(
            boundary.get(key) is False
            for key in ("runtime_effect", "graph_effect", "policy_effect", "ledger_effect", "admission_effect", "writes_court_pole_disposition")
        )
        and boundary.get("kappa_court_access") == "read_only_replay"
        and boundary.get("global_ch_access") == "no_write"
        and boundary.get("no_pentatonic_family_admission_claim") is True
        and boundary.get("crt310_gate_effect") is False,
        boundary,
        str(REGISTRY_PATH) + "#admission_boundary",
    )

    bindings = document["scale_bindings"]
    policy = _load_policy()
    policy_masks = [item["pitchMask"] for item in policy["positions"]]
    policy_positions = [item["positionId"] for item in policy["positions"]]
    replay_masks = [item["pitch_mask"] for item in bindings]
    replay_positions = [item["court_position"] for item in bindings]
    record(
        "epsm-court-position-replay",
        replay_masks == policy_masks and replay_positions == policy_positions,
        {"masks": replay_masks, "positions": replay_positions},
        POLICY_PATH + "#positions",
        {"masks": policy_masks, "positions": policy_positions},
        {"masks": replay_masks, "positions": replay_positions},
    )

    orientation_failures = []
    for item in bindings:
        if int(item["mask_string_msb"][::-1], 2) != item["pitch_mask"]:
            orientation_failures.append(item["ian_ring_id"])
        if int(item["mask_string_msb"], 2) != item["as_written_msb_integer"]:
            orientation_failures.append(item["ian_ring_id"])
    record(
        "epsm-orientation-replay",
        not orientation_failures,
        orientation_failures,
        str(REGISTRY_PATH) + "#orientation_policy",
    )

    class_failures = []
    for item in bindings:
        mask = item["pitch_mask"]
        pitch_classes = sorted(p for p in range(12) if mask & (1 << p))
        if (
            pitch_classes != item["pitch_classes"]
            or len(pitch_classes) != 5
            or item["prime_form"] != [0, 2, 4, 7, 9]
            or item["forte_class"] != "5-35"
            or item["interval_vector"] != [0, 3, 2, 1, 4, 0]
        ):
            class_failures.append(item["ian_ring_id"])
    registry = _read_json(ROOT / PENTATONIC_REGISTRY_PATH)
    admitted_535 = any(
        item["forteNumber"] == "5-35" and item["admissionStatus"] == "admitted"
        for item in registry["pentatonicSetClasses"]
    )
    record(
        "epsm-class-replay",
        not class_failures and admitted_535,
        class_failures,
        PENTATONIC_REGISTRY_PATH,
        "all 5-35 admitted",
        class_failures,
    )

    brightnesses = [item["brightness"] for item in bindings]
    kappas = [item["kappa_court"] for item in bindings]
    record(
        "epsm-brightness-kappa-monotonic",
        brightnesses == EXPECTED_BRIGHTNESS and kappas == EXPECTED_KAPPA,
        {"brightness": brightnesses, "kappa": kappas},
        str(REGISTRY_PATH) + "#invariants",
        {"brightness": EXPECTED_BRIGHTNESS, "kappa": EXPECTED_KAPPA},
        {"brightness": brightnesses, "kappa": kappas},
    )

    pairs = _complement_pairs_by_position()
    complement_failures = []
    for item in bindings:
        position = item["court_position"]
        pair = pairs.get(f"court-position:{position}")
        expected_complement = 4095 ^ item["pitch_mask"]
        if (
            pair is None
            or pair["pentatonicMask"] != item["pitch_mask"]
            or pair["rawHeptatonicComplementMask"] != expected_complement
            or item["complement_evidence"]["raw_heptatonic_complement_mask"] != expected_complement
            or item["complement_evidence"]["complement_governor"]
            != GOVERNOR_BY_MASK.get(expected_complement)
        ):
            complement_failures.append(item["ian_ring_id"])
    record(
        "epsm-complement-replay",
        not complement_failures,
        complement_failures,
        COMPLEMENT_PATH + "#rootedPairs",
        EXPECTED_COURT_MASKS,
        complement_failures,
    )

    mercury = next(
        item for item in bindings if item["element"] == "Quintessence (Mercury)"
    )
    mercury_ok = (
        mercury.get("is_binary_court_pole") is False
        and mercury.get("court_pole_index") is None
        and mercury.get("register_membership") == "excluded"
        and mercury.get("engine_interface_ref") == "mercury_engine_cycle"
    )
    record(
        "epsm-mercury-exclusion",
        mercury_ok,
        mercury,
        str(REGISTRY_PATH) + "#scale_bindings[2]",
    )

    text = json.dumps(document, ensure_ascii=False, default=str).lower()
    physics_ok = (
        metadata.get("physical_quantity_claim") is False
        and metadata.get("no_electromagnetic_equivalence") is True
        and "temperature" not in text
        and "entropy" not in text
        and "enthalpy" not in text
        and "free energy" not in text
    )
    record(
        "epsm-physics-guard",
        physics_ok,
        "authored correspondence only",
        str(REGISTRY_PATH) + "#metadata",
    )

    def _has_forbidden_relation_key(value: Any) -> bool:
        if isinstance(value, dict):
            if any(key in FORBIDDEN_RELATIONS for key in value):
                return True
            return any(_has_forbidden_relation_key(item) for item in value.values())
        if isinstance(value, list):
            return any(_has_forbidden_relation_key(item) for item in value)
        return False

    record(
        "epsm-forbidden-relations",
        not _has_forbidden_relation_key(document),
        "no executable Court relation keys",
        str(REGISTRY_PATH) + "#scale_bindings",
    )

    crt347 = _read_json(ROOT / CRT347_PATH)
    school_ids = {item["schoolId"] for item in crt347["capabilitySchools"]}
    facet_ids = {
        item["facetId"]
        for item in crt347["zodiacFacets"] + crt347["systemLevelFacets"]
    }
    crt349 = yaml.safe_load((ROOT / CRT349_PATH).read_text(encoding="utf-8"))
    transition_ids = {item["transition_id"] for item in crt349["transitions"]}
    ref_failures = []
    for item in bindings:
        if item["school_ref"] not in school_ids:
            ref_failures.append(f"{item['element']}:school")
        for facet in item["zodiac_facets"]:
            if facet not in facet_ids:
                ref_failures.append(f"{item['element']}:facet:{facet}")
        for transition in item["transition_refs"]:
            if transition not in transition_ids:
                ref_failures.append(f"{item['element']}:transition:{transition}")
    record(
        "epsm-cross-registry-refs",
        not ref_failures,
        ref_failures,
        CRT347_PATH,
        [],
        ref_failures,
    )

    guard_ids = {item["guard_id"] for item in document["guards"]}
    expected_guards = {
        "physics_authored_correspondence",
        "mercury_excluded_from_register",
        "no_court_writes",
        "no_unadmitted_classes",
        "complement_frozen_not_active",
        "kappa_and_ch_untouched",
        "crt310_untouched",
        "excluded_relation_vocabulary_absent",
    }
    record(
        "epsm-guard-closure",
        guard_ids == expected_guards and len(document["guards"]) == 8,
        sorted(guard_ids),
        str(REGISTRY_PATH) + "#guards",
    )

    record(
        "epsm-determinism",
        _canonical_bytes(document) == _canonical_bytes(_load_registry()),
        _sha256_payload(document),
        str(REGISTRY_PATH),
    )

    adversarial = _adversarial_results(document)
    record(
        "epsm-negative-case-closure",
        set(adversarial) == set(EXPECTED_MUTATION_CODES),
        list(adversarial),
        str(REPORT_PATH),
        sorted(EXPECTED_MUTATION_CODES),
        sorted(adversarial),
    )
    record(
        "epsm-adversarial-rejection",
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
        "registryId": "elemental_pentatonic_scale_map",
        "registryVersion": "1.0.0",
        "schemaVersion": REPORT_SCHEMA_VERSION,
        "verdict": "FAIL" if failures else "PASS",
    }
    report = {**report_core, "reportFingerprint": _sha256_payload(report_core)}
    if not _report_shape_valid(report):
        raise ElementalScaleMapValidationError("validation_report_shape_invalid")
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
