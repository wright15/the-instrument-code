from __future__ import annotations

import importlib.util
import json
from pathlib import Path
import sys
from typing import Any

import jsonschema
import pytest
import yaml


ROOT = Path(__file__).resolve().parents[1]
REGISTRY_PATH = ROOT / "schemas/mechanics_thermodynamics_registry.yaml"
SCHEMA_PATH = ROOT / "schemas/mechanics-thermodynamics-registry-v1.0.0.schema.json"
REPORT_SCHEMA_PATH = (
    ROOT / "schemas/mechanics-thermodynamics-registry-validation-report-v1.0.0.schema.json"
)
REPORT_PATH = ROOT / "qa/mechanics-thermodynamics-registry-validation.json"
VALIDATOR_PATH = ROOT / "scripts/validate-mechanics-thermodynamics-registry.py"


def _load_module(path: Path, name: str):
    spec = importlib.util.spec_from_file_location(name, path)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


VALIDATOR = _load_module(VALIDATOR_PATH, "mechanics_thermodynamics_validator")


@pytest.fixture(scope="module")
def document() -> dict[str, Any]:
    return yaml.safe_load(REGISTRY_PATH.read_text(encoding="utf-8"))


def test_registry_is_schema_valid_and_proposed(document) -> None:
    jsonschema.Draft202012Validator(
        json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
    ).validate(document)
    assert document["metadata"]["status"] == "proposed_canonization"
    assert document["metadata"]["admission_status"] == "proposed"
    assert document["metadata"]["physical_quantity_claim"] is False
    assert document["metadata"]["no_electromagnetic_equivalence"] is True
    assert document["metadata"]["no_thermodynamic_equivalence_with_kappa_court"] is True
    VALIDATOR.verify_registry_document(document)


def test_five_elements_with_four_polar_splits_and_one_engine(document) -> None:
    elements = document["elements"]
    assert [item["element"] for item in elements] == [
        "Fire",
        "Air",
        "Water",
        "Earth",
        "Quintessence",
    ]
    for item in elements[:4]:
        capabilities = item["capabilities"]
        assert set(capabilities) == {"electric_external", "magnetic_internal"}
        assert capabilities["electric_external"]["polarity_bit"] == 0
        assert capabilities["magnetic_internal"]["polarity_bit"] == 1
    mercury = elements[4]
    assert set(mercury["capabilities"]) == {"engine_interface"}


def test_scale_ids_replay_audited_map(document) -> None:
    expected = {
        "Fire": 661,
        "Air": 677,
        "Water": 1193,
        "Earth": 1321,
        "Quintessence": 1189,
    }
    for item in document["elements"]:
        assert item["scale_id"] == expected[item["element"]]
    crt350 = yaml.safe_load(
        (ROOT / "schemas/elemental_pentatonic_scale_map_v1.0.0.yaml").read_text(
            encoding="utf-8"
        )
    )
    scale_map = {
        item["element"].split(" (")[1].rstrip(")"): item["ian_ring_id"]
        for item in crt350["scale_bindings"]
    }
    for item in document["elements"]:
        assert item["scale_id"] == scale_map[item["governor"]]
        expected_label = "Air / Wind" if item["element"] == "Air" else item["element"]
        assert item["scale_map_ref"] == (
            "schemas/elemental_pentatonic_scale_map_v1.0.0.yaml"
            f"#scale_bindings[{expected_label} ({item['governor']})]"
        )


def test_zodiacs_and_polarity_facets_align_with_crt347(document) -> None:
    crt347 = json.loads(
        (
            ROOT
            / "canonical/fivefold-capability-candidates/fivefold-capability-teleology-v1.json"
        ).read_text(encoding="utf-8")
    )
    facet_by_zodiac = {
        item["zodiac"]: item["facetId"] for item in crt347["zodiacFacets"]
    }
    expected = {
        "Fire": ("Aries", "Scorpio"),
        "Air": ("Sagittarius", "Pisces"),
        "Water": ("Libra", "Taurus"),
        "Earth": ("Aquarius", "Capricorn"),
    }
    for item in document["elements"]:
        if item["element"] == "Quintessence":
            continue
        electric, magnetic = expected[item["element"]]
        assert item["capabilities"]["electric_external"]["zodiac"] == electric
        assert item["capabilities"]["magnetic_internal"]["zodiac"] == magnetic
        assert (
            item["capabilities"]["electric_external"]["zodiac_facet_ref"]
            == facet_by_zodiac[electric.lower()]
        )
        assert (
            item["capabilities"]["magnetic_internal"]["zodiac_facet_ref"]
            == facet_by_zodiac[magnetic.lower()]
        )


def test_transition_refs_resolve_against_crt349(document) -> None:
    crt349 = yaml.safe_load(
        (ROOT / "schemas/teleological_physics_registry_v1.0.0.yaml").read_text(
            encoding="utf-8"
        )
    )
    transition_ids = {item["transition_id"] for item in crt349["transitions"]}
    engine_ids = {item["interface_id"] for item in crt349["engine_interface"]}
    expected = {
        "Fire": (
            ["court_advance_C0_to_C1", "court_retreat_C1_to_C0"],
            "court_retreat_C1_to_C0",
            "court_advance_C0_to_C1",
        ),
        "Air": (
            ["court_advance_C1_to_C2", "court_retreat_C2_to_C1"],
            "court_retreat_C2_to_C1",
            "court_advance_C1_to_C2",
        ),
        "Water": (
            ["court_advance_C2_to_C3", "court_retreat_C3_to_C2"],
            "court_retreat_C3_to_C2",
            "court_advance_C2_to_C3",
        ),
        "Earth": (
            ["court_advance_C3_to_C4", "court_retreat_C4_to_C3"],
            "court_retreat_C4_to_C3",
            "court_advance_C3_to_C4",
        ),
    }
    for item in document["elements"]:
        assert all(transition in transition_ids for transition in item.get("transition_refs", []))
        assert item["school_ref"] == f"fivefold.capability_school.{item['element'].lower()}"
        for capability in item["capabilities"].values():
            transition_ref = capability.get("transition_ref")
            if transition_ref:
                assert transition_ref in transition_ids
        if item["element"] != "Quintessence":
            transitions, electric, magnetic = expected[item["element"]]
            assert item["transition_refs"] == transitions
            assert item["capabilities"]["electric_external"]["transition_ref"] == electric
            assert item["capabilities"]["magnetic_internal"]["transition_ref"] == magnetic
    mercury = next(item for item in document["elements"] if item["element"] == "Quintessence")
    assert mercury["engine_interface_ref"] in engine_ids
    assert mercury["engine_interface_ref"] == "mercury_engine_cycle"
    assert "transition_refs" not in mercury


def test_mercury_is_engine_only_without_polarity(document) -> None:
    mercury = next(item for item in document["elements"] if item["element"] == "Quintessence")
    assert mercury["is_binary_court_pole"] is False
    assert mercury["court_pole_index"] is None
    assert mercury["register_membership"] == "excluded"
    engine = mercury["capabilities"]["engine_interface"]
    assert "polarity_bit" not in engine
    assert "zodiac" not in engine
    assert engine["relation_type"] == "transduces"


def test_relation_vocabulary_is_authored_only(document) -> None:
    vocabulary = {"activated_by", "resists_by", "distributes", "constrains", "exchanges", "absorbs", "repels", "fixes", "transduces"}
    expected = {
        "explosive_emission": (
            "Rapid, outward broadcast of kinetic and thermal energy.",
            "activated_by",
            "outward_kinetic_force",
        ),
        "inductive_smoldering": (
            "Absorbs external kinetic energy and stores it as sustained internal heat.",
            "resists_by",
            "inductive_resistance",
        ),
        "thermal_updraft": (
            "Expands and scatters heat outward, reducing localized energy density.",
            "distributes",
            "rarefied_heat_flow",
        ),
        "thermal_drag": (
            "Stifles heat distribution, creating localized cold pockets or dense pressure.",
            "constrains",
            "ground_level_drag",
        ),
        "convective_discharge": (
            "Outward exchange of thermal energy; balancing the temperature of the environment.",
            "exchanges",
            "thermal_coupling",
        ),
        "latent_heat_storage": (
            "Absorbs massive amounts of heat without changing state; internal pressure building.",
            "absorbs",
            "specific_heat_capacity",
        ),
        "dielectric_friction": (
            "Generates static/thermal friction at the boundary, repelling external heat.",
            "repels",
            "thermal_insulation",
        ),
        "crystallization_lock": (
            "Flash-freezes internal energy into an immutable, solid lattice.",
            "fixes",
            "absolute_state_change",
        ),
        "phase_transition": (
            "Translates harmonic state mutations into elemental thermodynamic shifts.",
            "transduces",
            "em_induction_cycle",
        ),
    }
    actual = {}
    for item in document["elements"]:
        for capability in item["capabilities"].values():
            assert capability["relation_type"] in vocabulary
            assert capability["source_class"] == "authored_capability"
            actual[capability["mechanic_id"]] = (
                capability["definition"],
                capability["relation_type"],
                capability["value"],
            )
    assert actual == expected


def test_no_executable_relations_or_court_writes(document) -> None:
    def walk(value: Any) -> None:
        if isinstance(value, dict):
            for key, item in value.items():
                assert key not in ("SETS_COURT_POLE", "EXECUTES_COURT_MOVE"), key
                walk(item)
        elif isinstance(value, list):
            for item in value:
                walk(item)

    walk(document)
    boundary = document["admission_boundary"]
    assert boundary["writes_court_pole_disposition"] is False
    assert boundary["kappa_court_access"] == "read_only_replay"
    assert boundary["global_ch_access"] == "no_write"


def test_negative_mutations_rejected_with_expected_codes(document) -> None:
    results = VALIDATOR._adversarial_results(document)
    assert results == VALIDATOR.EXPECTED_MUTATION_CODES


def test_qa_report_is_schema_valid_fingerprinted_and_passing() -> None:
    report = json.loads(REPORT_PATH.read_text(encoding="utf-8"))
    jsonschema.Draft202012Validator(
        json.loads(REPORT_SCHEMA_PATH.read_text(encoding="utf-8"))
    ).validate(report)
    assert report["verdict"] == "PASS"
    assert report["checksPassed"] == 15
    assert report["checksFailed"] == 0
    check_ids = tuple(item["checkId"] for item in report["checks"])
    assert check_ids == VALIDATOR.REPORT_CHECK_IDS
    core = {key: value for key, value in report.items() if key != "reportFingerprint"}
    assert report["reportFingerprint"] == VALIDATOR._sha256_payload(core)
