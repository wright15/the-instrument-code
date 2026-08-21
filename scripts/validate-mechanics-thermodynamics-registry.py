#!/usr/bin/env python3
"""Independently validate the proposed Mechanics Thermodynamics Registry v1.0.0."""

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
REGISTRY_PATH = ROOT / "schemas/mechanics_thermodynamics_registry.yaml"
SCHEMA_PATH = ROOT / "schemas/mechanics-thermodynamics-registry-v1.0.0.schema.json"
REPORT_SCHEMA_PATH = (
    ROOT / "schemas/mechanics-thermodynamics-registry-validation-report-v1.0.0.schema.json"
)
REPORT_PATH = ROOT / "qa/mechanics-thermodynamics-registry-validation.json"

CRT347_PATH = "canonical/fivefold-capability-candidates/fivefold-capability-teleology-v1.json"
CRT349_PATH = "schemas/teleological_physics_registry_v1.0.0.yaml"
CRT350_PATH = "schemas/elemental_pentatonic_scale_map_v1.0.0.yaml"

REPORT_SCHEMA_VERSION = "mechanics-thermodynamics-registry-validation.v1.0.0"

EXPECTED_SCALE_IDS = {
    "Fire": 661,
    "Air": 677,
    "Water": 1193,
    "Earth": 1321,
    "Quintessence": 1189,
}
EXPECTED_GOVERNORS = {
    "Fire": "Mars",
    "Air": "Jupiter",
    "Water": "Venus",
    "Earth": "Saturn",
    "Quintessence": "Mercury",
}
EXPECTED_ZODIACS = {
    "Fire": {"electric_external": "Aries", "magnetic_internal": "Scorpio"},
    "Air": {"electric_external": "Sagittarius", "magnetic_internal": "Pisces"},
    "Water": {"electric_external": "Libra", "magnetic_internal": "Taurus"},
    "Earth": {"electric_external": "Aquarius", "magnetic_internal": "Capricorn"},
}
EXPECTED_BINDINGS = {
    "Fire": {
        "school_ref": "fivefold.capability_school.fire",
        "scale_map_ref": "schemas/elemental_pentatonic_scale_map_v1.0.0.yaml#scale_bindings[Fire (Mars)]",
        "transition_refs": ["court_advance_C0_to_C1", "court_retreat_C1_to_C0"],
        "capability_transition_refs": {
            "electric_external": "court_retreat_C1_to_C0",
            "magnetic_internal": "court_advance_C0_to_C1",
        },
    },
    "Air": {
        "school_ref": "fivefold.capability_school.air",
        "scale_map_ref": "schemas/elemental_pentatonic_scale_map_v1.0.0.yaml#scale_bindings[Air / Wind (Jupiter)]",
        "transition_refs": ["court_advance_C1_to_C2", "court_retreat_C2_to_C1"],
        "capability_transition_refs": {
            "electric_external": "court_retreat_C2_to_C1",
            "magnetic_internal": "court_advance_C1_to_C2",
        },
    },
    "Water": {
        "school_ref": "fivefold.capability_school.water",
        "scale_map_ref": "schemas/elemental_pentatonic_scale_map_v1.0.0.yaml#scale_bindings[Water (Venus)]",
        "transition_refs": ["court_advance_C2_to_C3", "court_retreat_C3_to_C2"],
        "capability_transition_refs": {
            "electric_external": "court_retreat_C3_to_C2",
            "magnetic_internal": "court_advance_C2_to_C3",
        },
    },
    "Earth": {
        "school_ref": "fivefold.capability_school.earth",
        "scale_map_ref": "schemas/elemental_pentatonic_scale_map_v1.0.0.yaml#scale_bindings[Earth (Saturn)]",
        "transition_refs": ["court_advance_C3_to_C4", "court_retreat_C4_to_C3"],
        "capability_transition_refs": {
            "electric_external": "court_retreat_C4_to_C3",
            "magnetic_internal": "court_advance_C3_to_C4",
        },
    },
    "Quintessence": {
        "school_ref": "fivefold.capability_school.quintessence",
        "scale_map_ref": "schemas/elemental_pentatonic_scale_map_v1.0.0.yaml#scale_bindings[Quintessence (Mercury)]",
        "engine_interface_ref": "mercury_engine_cycle",
    },
}
EXPECTED_ELEMENTS_FINGERPRINT = "2297f70e7c598c77c83678dc04a570b7c439a340e08c6d0a61023a15075fdb90"
FORBIDDEN_RELATIONS = ("SETS_COURT_POLE", "EXECUTES_COURT_MOVE")
AUTHORED_RELATION_VOCABULARY = {
    "activated_by",
    "resists_by",
    "distributes",
    "constrains",
    "exchanges",
    "absorbs",
    "repels",
    "fixes",
    "transduces",
}

REPORT_CHECK_IDS = (
    "mtr-schema-identity",
    "mtr-admission-boundary",
    "mtr-element-coverage",
    "mtr-scale-map-replay",
    "mtr-polarity-bit-replay",
    "mtr-zodiac-facet-refs",
    "mtr-mercury-exclusion",
    "mtr-cross-registry-refs",
    "mtr-physics-guard",
    "mtr-forbidden-relations",
    "mtr-relation-vocabulary",
    "mtr-guard-closure",
    "mtr-determinism",
    "mtr-negative-case-closure",
    "mtr-adversarial-rejection",
)

MUTATION_IDS = (
    "wrong-scale-id",
    "mercury-with-polarity-bit",
    "physical-claim-true",
    "court-write-boundary",
    "forbidden-relation-injected",
    "duplicate-mechanic-id",
    "wrong-polarity-bit",
    "wrong-governor",
    "zodiac-swapped",
    "sixth-element",
    "school-ref-swapped",
    "scale-map-ref-tampered",
    "capability-transition-swapped",
    "capability-definition-drift",
    "mercury-transition-injected",
)

EXPECTED_MUTATION_CODES = {
    "wrong-scale-id": "scale_map_replay_mismatch",
    "mercury-with-polarity-bit": "mercury_exclusion_invalid",
    "physical-claim-true": "physical_claim_invalid",
    "court-write-boundary": "boundary_write_invalid",
    "forbidden-relation-injected": "forbidden_relation",
    "duplicate-mechanic-id": "duplicate_id_rejected",
    "wrong-polarity-bit": "polarity_bit_mismatch",
    "wrong-governor": "governor_mismatch",
    "zodiac-swapped": "zodiac_mismatch",
    "sixth-element": "element_count_invalid",
    "school-ref-swapped": "cross_registry_binding_mismatch",
    "scale-map-ref-tampered": "cross_registry_binding_mismatch",
    "capability-transition-swapped": "cross_registry_binding_mismatch",
    "capability-definition-drift": "authored_contract_mismatch",
    "mercury-transition-injected": "mercury_exclusion_invalid",
}


class MechanicsThermodynamicsValidationError(ValueError):
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


def _load_crt347() -> dict[str, Any]:
    return _read_json(ROOT / CRT347_PATH)


def _load_crt349() -> dict[str, Any]:
    return yaml.safe_load((ROOT / CRT349_PATH).read_text(encoding="utf-8"))


def _load_crt350() -> dict[str, Any]:
    return yaml.safe_load((ROOT / CRT350_PATH).read_text(encoding="utf-8"))


def _cross_registry_binding_failures(elements: list[dict[str, Any]]) -> list[str]:
    failures = []
    for item in elements:
        element = item["element"]
        expected = EXPECTED_BINDINGS[element]
        for key in ("school_ref", "scale_map_ref"):
            if item.get(key) != expected[key]:
                failures.append(f"{element}:{key}")
        if element == "Quintessence":
            if item.get("engine_interface_ref") != expected["engine_interface_ref"]:
                failures.append(f"{element}:engine_interface_ref")
            continue
        if item.get("transition_refs") != expected["transition_refs"]:
            failures.append(f"{element}:transition_refs")
        for capability_key, transition_ref in expected["capability_transition_refs"].items():
            if item.get("capabilities", {}).get(capability_key, {}).get("transition_ref") != transition_ref:
                failures.append(f"{element}:{capability_key}:transition_ref")
    return failures


def _semantic_rejection_code(document: dict[str, Any]) -> str | None:
    metadata = document.get("metadata", {})
    if (
        metadata.get("physical_quantity_claim") is not False
        or metadata.get("no_electromagnetic_equivalence") is not True
        or metadata.get("no_thermodynamic_equivalence_with_kappa_court") is not True
    ):
        return "physical_claim_invalid"
    boundary = document.get("admission_boundary", {})
    if boundary.get("writes_court_pole_disposition") is not False:
        return "boundary_write_invalid"

    elements = document.get("elements", [])
    if len(elements) != 5:
        return "element_count_invalid"
    names = [item.get("element") for item in elements]
    if sorted(names) != ["Air", "Earth", "Fire", "Quintessence", "Water"]:
        return "element_count_invalid"

    mechanic_ids = []
    for item in elements:
        if item.get("governor") != EXPECTED_GOVERNORS.get(item.get("element")):
            return "governor_mismatch"
        if item.get("scale_id") != EXPECTED_SCALE_IDS.get(item.get("element")):
            return "scale_map_replay_mismatch"
        capabilities = item.get("capabilities", {})
        if item.get("element") == "Quintessence":
            if "engine_interface" not in capabilities:
                return "mercury_exclusion_invalid"
            if (
                item.get("is_binary_court_pole") is not False
                or item.get("court_pole_index") is not None
                or item.get("register_membership") != "excluded"
                or "transition_refs" in item
            ):
                return "mercury_exclusion_invalid"
        else:
            electric = capabilities.get("electric_external")
            magnetic = capabilities.get("magnetic_internal")
            if electric is None or magnetic is None:
                return "polarity_bit_mismatch"
            if electric.get("polarity_bit") != 0 or magnetic.get("polarity_bit") != 1:
                return "polarity_bit_mismatch"
            expected_zodiacs = EXPECTED_ZODIACS.get(item.get("element"), {})
            if (
                electric.get("zodiac") != expected_zodiacs.get("electric_external")
                or magnetic.get("zodiac") != expected_zodiacs.get("magnetic_internal")
            ):
                return "zodiac_mismatch"
        for capability in capabilities.values():
            mechanic_ids.append(capability.get("mechanic_id"))

    if len(set(mechanic_ids)) != len(mechanic_ids):
        return "duplicate_id_rejected"

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
    if _cross_registry_binding_failures(elements):
        return "cross_registry_binding_mismatch"
    if _sha256_payload(elements) != EXPECTED_ELEMENTS_FINGERPRINT:
        return "authored_contract_mismatch"
    return None


def verify_registry_document(document: dict[str, Any]) -> None:
    semantic_rejection = _semantic_rejection_code(document)
    if semantic_rejection is not None:
        raise MechanicsThermodynamicsValidationError(semantic_rejection)
    try:
        jsonschema.Draft202012Validator(_read_json(SCHEMA_PATH)).validate(document)
    except jsonschema.ValidationError as error:
        raise MechanicsThermodynamicsValidationError("registry_schema_invalid") from error


def _mutated_cases(document: dict[str, Any]) -> dict[str, dict[str, Any]]:
    cases: dict[str, dict[str, Any]] = {}

    tampered = deepcopy(document)
    next(item for item in tampered["elements"] if item["element"] == "Air")["scale_id"] = 667
    cases["wrong-scale-id"] = tampered

    tampered = deepcopy(document)
    mercury = next(item for item in tampered["elements"] if item["element"] == "Quintessence")
    mercury["capabilities"] = {
        "electric_external": deepcopy(
            next(item for item in tampered["elements"] if item["element"] == "Fire")[
                "capabilities"
            ]["electric_external"]
        )
    }
    mercury["is_binary_court_pole"] = True
    mercury["court_pole_index"] = 2
    mercury["register_membership"] = "included"
    cases["mercury-with-polarity-bit"] = tampered

    tampered = deepcopy(document)
    tampered["metadata"]["physical_quantity_claim"] = True
    cases["physical-claim-true"] = tampered

    tampered = deepcopy(document)
    tampered["admission_boundary"]["writes_court_pole_disposition"] = True
    cases["court-write-boundary"] = tampered

    tampered = deepcopy(document)
    fire = next(item for item in tampered["elements"] if item["element"] == "Fire")
    fire["capabilities"]["electric_external"]["SETS_COURT_POLE"] = "C1"
    cases["forbidden-relation-injected"] = tampered

    tampered = deepcopy(document)
    next(item for item in tampered["elements"] if item["element"] == "Water")[
        "capabilities"
    ]["magnetic_internal"]["mechanic_id"] = "explosive_emission"
    cases["duplicate-mechanic-id"] = tampered

    tampered = deepcopy(document)
    next(item for item in tampered["elements"] if item["element"] == "Earth")[
        "capabilities"
    ]["electric_external"]["polarity_bit"] = 1
    cases["wrong-polarity-bit"] = tampered

    tampered = deepcopy(document)
    next(item for item in tampered["elements"] if item["element"] == "Air")["governor"] = "Mars"
    cases["wrong-governor"] = tampered

    tampered = deepcopy(document)
    fire = next(item for item in tampered["elements"] if item["element"] == "Fire")
    fire["capabilities"]["electric_external"]["zodiac"] = "Scorpio"
    cases["zodiac-swapped"] = tampered

    tampered = deepcopy(document)
    extra = deepcopy(next(item for item in tampered["elements"] if item["element"] == "Fire"))
    extra["element"] = "Wood"
    tampered["elements"].append(extra)
    cases["sixth-element"] = tampered

    tampered = deepcopy(document)
    next(item for item in tampered["elements"] if item["element"] == "Fire")[
        "school_ref"
    ] = "fivefold.capability_school.air"
    cases["school-ref-swapped"] = tampered

    tampered = deepcopy(document)
    next(item for item in tampered["elements"] if item["element"] == "Fire")[
        "scale_map_ref"
    ] = EXPECTED_BINDINGS["Air"]["scale_map_ref"]
    cases["scale-map-ref-tampered"] = tampered

    tampered = deepcopy(document)
    next(item for item in tampered["elements"] if item["element"] == "Fire")[
        "capabilities"
    ]["electric_external"]["transition_ref"] = "court_retreat_C2_to_C1"
    cases["capability-transition-swapped"] = tampered

    tampered = deepcopy(document)
    next(item for item in tampered["elements"] if item["element"] == "Water")[
        "capabilities"
    ]["magnetic_internal"]["definition"] += " Drift."
    cases["capability-definition-drift"] = tampered

    tampered = deepcopy(document)
    next(item for item in tampered["elements"] if item["element"] == "Quintessence")[
        "transition_refs"
    ] = ["court_advance_C0_to_C1", "court_retreat_C1_to_C0"]
    cases["mercury-transition-injected"] = tampered

    return cases


def _adversarial_results(document: dict[str, Any]) -> dict[str, str]:
    results = {}
    for case_id, mutated in _mutated_cases(document).items():
        try:
            verify_registry_document(mutated)
        except (MechanicsThermodynamicsValidationError, jsonschema.ValidationError) as error:
            reason = (
                error.reason_code
                if isinstance(error, MechanicsThermodynamicsValidationError)
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
        "mtr-schema-identity",
        schema_valid
        and metadata.get("registry_id") == "mechanics_thermodynamics_registry"
        and metadata.get("version") == "1.0.0"
        and metadata.get("status") == "proposed_canonization"
        and metadata.get("admission_status") == "proposed",
        schema_diagnostic,
        str(SCHEMA_PATH),
    )

    boundary = document["admission_boundary"]
    record(
        "mtr-admission-boundary",
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

    elements = document["elements"]
    names = [item["element"] for item in elements]
    record(
        "mtr-element-coverage",
        sorted(names) == ["Air", "Earth", "Fire", "Quintessence", "Water"],
        names,
        str(REGISTRY_PATH) + "#elements",
        ["Air", "Earth", "Fire", "Quintessence", "Water"],
        sorted(names),
    )

    crt350 = _load_crt350()
    scale_map = {
        item["element"].split(" (")[1].rstrip(")"): item["ian_ring_id"]
        for item in crt350["scale_bindings"]
    }
    scale_failures = []
    for item in elements:
        expected_id = scale_map.get(EXPECTED_GOVERNORS[item["element"]])
        if item["scale_id"] != expected_id or item["governor"] != EXPECTED_GOVERNORS[item["element"]]:
            scale_failures.append(item["element"])
    record(
        "mtr-scale-map-replay",
        not scale_failures,
        scale_failures,
        CRT350_PATH + "#scale_bindings",
        EXPECTED_SCALE_IDS,
        {item["element"]: item["scale_id"] for item in elements},
    )

    bit_failures = []
    for item in elements:
        if item["element"] == "Quintessence":
            continue
        capabilities = item["capabilities"]
        if (
            capabilities["electric_external"]["polarity_bit"] != 0
            or capabilities["magnetic_internal"]["polarity_bit"] != 1
        ):
            bit_failures.append(item["element"])
    record(
        "mtr-polarity-bit-replay",
        not bit_failures,
        bit_failures,
        str(REGISTRY_PATH) + "#elements",
        {"electric": 0, "magnetic": 1},
        bit_failures,
    )

    crt347 = _load_crt347()
    facet_ids = {
        item["facetId"]
        for item in crt347["zodiacFacets"] + crt347["systemLevelFacets"]
    }
    zodiac_failures = []
    for item in elements:
        if item["element"] == "Quintessence":
            continue
        for key in ("electric_external", "magnetic_internal"):
            capability = item["capabilities"][key]
            if capability["zodiac_facet_ref"] not in facet_ids:
                zodiac_failures.append(capability["mechanic_id"])
    record(
        "mtr-zodiac-facet-refs",
        not zodiac_failures,
        zodiac_failures,
        CRT347_PATH + "#zodiacFacets",
        [],
        zodiac_failures,
    )

    mercury = next(item for item in elements if item["element"] == "Quintessence")
    mercury_ok = (
        mercury.get("is_binary_court_pole") is False
        and mercury.get("court_pole_index") is None
        and mercury.get("register_membership") == "excluded"
        and "engine_interface" in mercury["capabilities"]
        and "polarity_bit" not in mercury["capabilities"].get("engine_interface", {})
    )
    record(
        "mtr-mercury-exclusion",
        mercury_ok,
        mercury,
        str(REGISTRY_PATH) + "#elements[Quintessence]",
    )

    school_ids = {item["schoolId"] for item in crt347["capabilitySchools"]}
    crt349 = _load_crt349()
    transition_ids = {item["transition_id"] for item in crt349["transitions"]}
    engine_ids = {item["interface_id"] for item in crt349["engine_interface"]}
    ref_failures = _cross_registry_binding_failures(elements)
    for item in elements:
        if item["school_ref"] not in school_ids:
            ref_failures.append(f"{item['element']}:school")
        for transition in item.get("transition_refs", []):
            if transition not in transition_ids:
                ref_failures.append(f"{item['element']}:transition:{transition}")
        for capability in item["capabilities"].values():
            transition_ref = capability.get("transition_ref")
            if transition_ref and transition_ref not in transition_ids:
                ref_failures.append(f"{item['element']}:{capability['mechanic_id']}")
    if mercury.get("engine_interface_ref") not in engine_ids:
        ref_failures.append("Quintessence:engine_interface_ref")
    record(
        "mtr-cross-registry-refs",
        not ref_failures,
        ref_failures,
        CRT349_PATH,
        [],
        ref_failures,
    )

    physics_ok = (
        metadata.get("physical_quantity_claim") is False
        and metadata.get("no_electromagnetic_equivalence") is True
        and metadata.get("no_thermodynamic_equivalence_with_kappa_court") is True
        and metadata.get("architecture", {}).get("authored_game_mechanics_not_physics") is True
    )
    record(
        "mtr-physics-guard",
        physics_ok,
        "authored game mechanics, no physics claim",
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
        "mtr-forbidden-relations",
        not _has_forbidden_relation_key(document),
        "no executable Court relation keys",
        str(REGISTRY_PATH) + "#elements",
    )

    relation_types = {
        capability["relation_type"]
        for item in elements
        for capability in item["capabilities"].values()
    }
    record(
        "mtr-relation-vocabulary",
        relation_types <= AUTHORED_RELATION_VOCABULARY,
        sorted(relation_types),
        str(REGISTRY_PATH) + "#elements",
        sorted(AUTHORED_RELATION_VOCABULARY),
        sorted(relation_types),
    )

    guard_ids = {item["guard_id"] for item in document["guards"]}
    expected_guards = {
        "authored_game_mechanics_not_physics",
        "no_kappa_thermodynamic_equivalence",
        "mercury_excluded_from_register",
        "no_court_writes",
        "relation_vocabulary_authored",
        "no_unadmitted_scale_classes",
        "kappa_and_ch_untouched",
        "crt310_untouched",
        "excluded_relation_vocabulary_absent",
    }
    record(
        "mtr-guard-closure",
        guard_ids == expected_guards and len(document["guards"]) == 9,
        sorted(guard_ids),
        str(REGISTRY_PATH) + "#guards",
    )

    record(
        "mtr-determinism",
        _canonical_bytes(document) == _canonical_bytes(_load_registry())
        and _sha256_payload(elements) == EXPECTED_ELEMENTS_FINGERPRINT,
        {"document": _sha256_payload(document), "elements": _sha256_payload(elements)},
        str(REGISTRY_PATH),
        EXPECTED_ELEMENTS_FINGERPRINT,
        _sha256_payload(elements),
    )

    adversarial = _adversarial_results(document)
    record(
        "mtr-negative-case-closure",
        set(adversarial) == set(EXPECTED_MUTATION_CODES),
        list(adversarial),
        str(REPORT_PATH),
        sorted(EXPECTED_MUTATION_CODES),
        sorted(adversarial),
    )
    record(
        "mtr-adversarial-rejection",
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
        "registryId": "mechanics_thermodynamics_registry",
        "registryVersion": "1.0.0",
        "schemaVersion": REPORT_SCHEMA_VERSION,
        "verdict": "FAIL" if failures else "PASS",
    }
    report = {**report_core, "reportFingerprint": _sha256_payload(report_core)}
    if not _report_shape_valid(report):
        raise MechanicsThermodynamicsValidationError("validation_report_shape_invalid")
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
