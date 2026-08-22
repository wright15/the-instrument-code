from __future__ import annotations

from copy import deepcopy
import importlib.util
import json
from pathlib import Path
import sys
from typing import Any

import jsonschema
import pytest
import yaml


ROOT = Path(__file__).resolve().parents[1]
REGISTRY_PATH = ROOT / "schemas/mechanics_thermodynamics_registry_v2.0.0.yaml"
SCHEMA_PATH = ROOT / "schemas/mechanics-thermodynamics-registry-v2.0.0.schema.json"
REPORT_SCHEMA_PATH = (
    ROOT / "schemas/mechanics-thermodynamics-registry-validation-report-v2.0.0.schema.json"
)
REPORT_PATH = ROOT / "qa/mechanics-thermodynamics-registry-validation-v2.0.0.json"
VALIDATOR_PATH = ROOT / "scripts/validate-mechanics-thermodynamics-registry-v2.py"


def _load_module(path: Path, name: str):
    spec = importlib.util.spec_from_file_location(name, path)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


VALIDATOR = _load_module(VALIDATOR_PATH, "mechanics_thermodynamics_validator_v2")


@pytest.fixture(scope="module")
def document() -> dict[str, Any]:
    return yaml.safe_load(REGISTRY_PATH.read_text(encoding="utf-8"))


def _element(document: dict[str, Any], name: str) -> dict[str, Any]:
    return next(item for item in document["elements"] if item["element"] == name)


def test_registry_is_schema_valid_and_preserves_nonphysical_boundary(document) -> None:
    jsonschema.Draft202012Validator(
        json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
    ).validate(document)
    assert document["metadata"]["version"] == "2.0.0"
    assert document["metadata"]["physical_quantity_claim"] is False
    assert document["metadata"]["no_electromagnetic_equivalence"] is True
    assert document["metadata"]["no_thermodynamic_equivalence_with_kappa_court"] is True
    VALIDATOR.verify_registry_document(document)


def test_all_capability_channels_are_direct_rich_entry_arrays(document) -> None:
    assert [item["element"] for item in document["elements"]] == [
        "Fire",
        "Air",
        "Water",
        "Earth",
        "Quintessence",
    ]
    for item in document["elements"][:4]:
        assert set(item["capabilities"]) == {"electric_external", "magnetic_internal"}
        assert set(item["polarity_bindings"]) == {
            "electric_external",
            "magnetic_internal",
        }
        assert item["polarity_bindings"]["electric_external"]["polarity_bit"] == 0
        assert item["polarity_bindings"]["magnetic_internal"]["polarity_bit"] == 1
        assert all(isinstance(entries, list) and entries for entries in item["capabilities"].values())
        assert "phenomenon_categories" not in item
    mercury = document["elements"][-1]
    assert set(mercury["capabilities"]) == {"engine_interface"}
    assert isinstance(mercury["capabilities"]["engine_interface"], list)
    assert "polarity_bindings" not in mercury
    assert "phenomenon_categories" not in mercury


def test_every_leaf_uses_the_strict_rich_schema(document) -> None:
    entries = [entry for _, _, entry in VALIDATOR._all_entries(document)]
    assert len(entries) == 226
    assert all(
        VALIDATOR.RICH_ENTRY_REQUIRED_KEYS <= set(entry) <= VALIDATOR.RICH_ENTRY_KEYS
        for entry in entries
    )
    assert all(entry["definition"] and entry["value"] for entry in entries)
    assert all(entry["source_class"] == "authored_capability" for entry in entries)
    assert {entry["phenomenon_class"] for entry in entries} == {
        "capability_action",
        "high_enthalpy",
        "high_entropy",
        "low_enthalpy",
        "low_entropy",
    }
    tagged = [entry for entry in entries if "semantic_transition" in entry]
    assert {
        entry["mechanic_id"]: entry["semantic_transition"] for entry in tagged
    } == VALIDATOR.EXPECTED_SEMANTIC_TRANSITIONS


def test_four_part_scaffold_is_preserved_by_relation_type(document) -> None:
    for phenomenon_class, expected_counts in VALIDATOR.EXPECTED_CLASS_COUNTS.items():
        element, channel = VALIDATOR.POPULATED_CLASS_PLACEMENTS[phenomenon_class]
        entries = [
            entry
            for entry in _element(document, element)["capabilities"][channel]
            if entry["phenomenon_class"] == phenomenon_class
        ]
        actual = {
            relation: sum(entry["relation_type"] == relation for entry in entries)
            for relation in VALIDATOR.SCAFFOLD_RELATIONS.values()
        }
        assert actual == expected_counts


def test_water_low_enthalpy_catalog_is_electric_external_only(document) -> None:
    water = _element(document, "Water")
    electric = water["capabilities"]["electric_external"]
    magnetic = water["capabilities"]["magnetic_internal"]
    low_enthalpy_entries = [
        entry for entry in electric if entry["phenomenon_class"] == "low_enthalpy"
    ]
    assert len(low_enthalpy_entries) == 44
    assert all(entry["phenomenon_class"] != "low_enthalpy" for entry in magnetic)
    assert [entry["mechanic_id"] for entry in low_enthalpy_entries] == [
        mechanic_id
        for relation in VALIDATOR.SCAFFOLD_RELATIONS.values()
        for mechanic_id in VALIDATOR.EXPECTED_LOW_ENTHALPY_IDS[relation]
    ]
    assert all(
        entry["relation_type"] in VALIDATOR.SCAFFOLD_RELATIONS.values()
        for entry in low_enthalpy_entries
    )


def test_earth_low_entropy_catalog_is_electric_external_only(document) -> None:
    earth = _element(document, "Earth")
    electric = earth["capabilities"]["electric_external"]
    magnetic = earth["capabilities"]["magnetic_internal"]
    low_entropy_entries = [
        entry for entry in electric if entry["phenomenon_class"] == "low_entropy"
    ]
    assert len(low_entropy_entries) == 46
    assert all(entry["phenomenon_class"] != "low_entropy" for entry in magnetic)
    assert [entry["mechanic_id"] for entry in low_entropy_entries] == [
        mechanic_id
        for relation in VALIDATOR.SCAFFOLD_RELATIONS.values()
        for mechanic_id in VALIDATOR.EXPECTED_LOW_ENTROPY_IDS[relation]
    ]
    assert all(
        entry["relation_type"] in VALIDATOR.SCAFFOLD_RELATIONS.values()
        for entry in low_entropy_entries
    )
    assert {
        entry["mechanic_id"]: entry["semantic_transition"]
        for entry in low_entropy_entries
        if "semantic_transition" in entry
    } == VALIDATOR.EXPECTED_SEMANTIC_TRANSITIONS


def test_base_capability_actions_remain_distinct_from_glossaries(document) -> None:
    for (element, channel), expected in VALIDATOR.EXPECTED_ACTIONS.items():
        entry = _element(document, element)["capabilities"][channel][0]
        assert entry["phenomenon_class"] == "capability_action"
        assert tuple(
            entry[key] for key in ("mechanic_id", "definition", "relation_type", "value")
        ) == expected


def test_schema_rejects_nonuniform_direct_array_entries(document) -> None:
    schema_validator = jsonschema.Draft202012Validator(
        json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
    )
    missing_class = deepcopy(document)
    del _element(missing_class, "Water")["capabilities"]["electric_external"][1][
        "phenomenon_class"
    ]
    with pytest.raises(jsonschema.ValidationError):
        schema_validator.validate(missing_class)

    legacy_wrapper = deepcopy(document)
    _element(legacy_wrapper, "Air")["phenomenon_categories"] = {}
    with pytest.raises(jsonschema.ValidationError):
        schema_validator.validate(legacy_wrapper)

    swapped_binding = deepcopy(document)
    _element(swapped_binding, "Water")["polarity_bindings"]["electric_external"][
        "zodiac"
    ] = "Aries"
    with pytest.raises(jsonschema.ValidationError):
        schema_validator.validate(swapped_binding)

    invalid_transition = deepcopy(document)
    _element(invalid_transition, "Earth")["capabilities"]["electric_external"][
        1
    ]["semantic_transition"] = "unbounded_transition"
    with pytest.raises(jsonschema.ValidationError):
        schema_validator.validate(invalid_transition)


def test_semantic_validator_rejects_water_magnetic_glossary_contamination(document) -> None:
    tampered = deepcopy(document)
    water = _element(tampered, "Water")
    water["capabilities"]["magnetic_internal"].append(
        water["capabilities"]["electric_external"].pop(1)
    )
    with pytest.raises(VALIDATOR.MechanicsThermodynamicsValidationError) as error:
        VALIDATOR.verify_registry_document(tampered)
    assert error.value.reason_code == "phenomenon_class_placement_invalid"


def test_semantic_validator_rejects_earth_magnetic_glossary_contamination(document) -> None:
    tampered = deepcopy(document)
    earth = _element(tampered, "Earth")
    earth["capabilities"]["magnetic_internal"].append(
        earth["capabilities"]["electric_external"].pop(1)
    )
    with pytest.raises(VALIDATOR.MechanicsThermodynamicsValidationError) as error:
        VALIDATOR.verify_registry_document(tampered)
    assert error.value.reason_code == "phenomenon_class_placement_invalid"


def test_adversarial_mutations_are_rejected_with_stable_codes(document) -> None:
    assert VALIDATOR._adversarial_results(document) == VALIDATOR.EXPECTED_MUTATION_CODES


def test_v2_qa_report_is_schema_valid_fingerprinted_and_passing() -> None:
    report = json.loads(REPORT_PATH.read_text(encoding="utf-8"))
    jsonschema.Draft202012Validator(
        json.loads(REPORT_SCHEMA_PATH.read_text(encoding="utf-8"))
    ).validate(report)
    assert report["verdict"] == "PASS"
    assert report["checksPassed"] == 20
    assert report["checksFailed"] == 0
    assert tuple(item["checkId"] for item in report["checks"]) == VALIDATOR.REPORT_CHECK_IDS
    core = {key: value for key, value in report.items() if key != "reportFingerprint"}
    assert report["reportFingerprint"] == VALIDATOR._sha256_payload(core)
