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
SCAFFOLD_KEYS = (
    "energy_states",
    "transformations",
    "structural_forms",
    "transfer_modes",
)
EXPECTED_FRAMEWORK_PARENT_CATEGORIES = [
    {
        "category_id": "high_enthalpy_phenomena",
        "section_id": "high_enthalpy_thermodynamics",
        "population_status": "populated_in_this_registry",
    },
    {
        "category_id": "high_entropy_phenomena",
        "section_id": "high_entropy_thermodynamics",
        "population_status": "populated_in_this_registry",
    },
    {
        "category_id": "low_enthalpy_phenomena",
        "section_id": "low_enthalpy_thermodynamics",
        "population_status": "placeholder_future_category",
    },
    {
        "category_id": "low_entropy_phenomena",
        "section_id": "low_entropy_thermodynamics",
        "population_status": "placeholder_future_category",
    },
    {
        "category_id": "equilibrium_phenomena",
        "section_id": "equilibrium_thermodynamics",
        "population_status": "placeholder_future_category",
    },
    {
        "category_id": "kinetics",
        "section_id": None,
        "population_status": "placeholder_future_category",
    },
    {
        "category_id": "kinematics",
        "section_id": None,
        "population_status": "placeholder_future_category",
    },
    {
        "category_id": "weather_dynamics",
        "section_id": None,
        "population_status": "placeholder_future_category",
    },
]
EXPECTED_INSTRUMENTATION_BOUNDARY = {
    "registry_id": "mechanics_instrumentation_registry",
    "registry_path": "schemas/mechanics_instrumentation_registry.yaml",
    "status": "future_separate_registry",
    "inclusion": "excluded_from_this_registry",
    "scope": "facilities_and_computational_simulation_models",
    "structural_descriptors_retained": [
        "two_temperature_model",
        "multi_temperature_model",
    ],
}
EXPECTED_HIGH_ENTHALPY_IDS = {
    "energy_states": (
        "enthalpy",
        "specific_enthalpy",
        "total_stagnation_enthalpy",
        "sensible_enthalpy",
        "chemical_enthalpy",
        "formation_enthalpy",
        "static_total_temperature",
        "entropy",
        "gibbs_free_energy",
        "partition_function",
        "electron_heavy_particle_temperature",
        "translational_rotational_vibrational_electronic_excitation",
        "internal_energy_mode",
    ),
    "transformations": (
        "dissociation",
        "recombination",
        "ionization",
        "electron_impact_ionization",
        "associative_ionization",
        "charge_exchange",
        "attachment",
        "detachment",
        "excitation",
        "de_excitation",
        "mode_coupling",
        "vibrational_freezing",
        "endothermic_reaction",
        "exothermic_reaction",
        "post_shock_relaxation",
        "expansion_cooling",
        "chemical_freezing_during_expansion",
    ),
    "structural_forms": (
        "thermal_equilibrium",
        "chemical_equilibrium",
        "thermochemical_equilibrium",
        "thermal_nonequilibrium",
        "chemical_nonequilibrium",
        "thermochemical_nonequilibrium",
        "local_thermodynamic_equilibrium",
        "non_lte_plasma",
        "frozen_flow",
        "equilibrium_flow",
        "reacting_flow",
        "two_temperature_model",
        "multi_temperature_model",
        "normal_shock_wave",
        "oblique_shock_wave",
        "bow_shock_wave",
        "shock_layer",
        "shock_standoff_distance",
        "stagnation_region",
        "boundary_layer",
        "knudsen_layer",
        "rarefied_flow",
        "continuum_breakdown",
        "plasma",
        "quasineutrality",
        "plasma_sheath",
    ),
    "transfer_modes": (
        "convective_heating",
        "radiative_heating",
        "radiative_cooling",
        "bound_bound_transitions",
        "bound_free_transitions",
        "free_free_transitions",
        "line_radiation",
        "continuum_radiation",
        "optically_thin",
        "optically_thick",
        "radiative_transfer",
        "radiative_precursor",
        "ambipolar_diffusion",
        "debye_shielding",
        "debye_length",
        "catalytic_wall",
        "wall_catalycity",
        "catalytic_recombination_heating",
        "ablation",
        "pyrolysis",
        "char_formation",
        "blowing",
        "convective_blockage",
        "sublimation",
        "vaporization",
        "oxidation",
        "nitridation",
    ),
}
EXPECTED_HIGH_ENTROPY_IDS = {
    "energy_states": (
        "anergy",
        "boltzmann_entropy",
        "chemical_potential",
        "configurational_entropy",
        "air_entropy",
        "entropy_of_mixing",
        "exergy",
        "free_energy",
        "air_gibbs_free_energy",
        "high_entropy_state",
        "information_entropy",
        "macrostate",
        "microstate",
        "residual_entropy",
        "specific_entropy",
        "thermodynamic_probability",
        "vibrational_entropy",
    ),
    "transformations": (
        "dissipation",
        "entropy_generation",
        "entropy_production",
        "equilibration",
        "irreversibility",
        "isentropic_process",
        "mixing",
        "order_disorder_transition",
        "phase_separation",
        "relaxation",
        "thermalization",
        "viscous_dissipation",
    ),
    "structural_forms": (
        "dissipative_structure",
        "entropy_balance",
        "entropy_reservoir",
        "equilibrium",
        "high_entropy_alloy",
        "high_entropy_material",
        "maximum_entropy_principle",
        "nonequilibrium",
        "nonequilibrium_steady_state",
        "open_system",
        "second_law_of_thermodynamics",
        "statistical_mechanics",
    ),
    "transfer_modes": (
        "diffusion",
        "entropic_force",
        "entropy_flux",
    ),
}
EXPECTED_CATEGORY_RELATION_TYPES = {
    "energy_states": "characterizes",
    "transformations": "transforms",
    "structural_forms": "structures",
    "transfer_modes": "transfers",
}
PHENOMENON_CATEGORY_SECTION_IDS = {
    "high_enthalpy_phenomena": "high_enthalpy_thermodynamics",
    "high_entropy_phenomena": "high_entropy_thermodynamics",
    "low_enthalpy_phenomena": "low_enthalpy_thermodynamics",
    "low_entropy_phenomena": "low_entropy_thermodynamics",
    "equilibrium_phenomena": "equilibrium_thermodynamics",
}
EXPECTED_ELEMENT_PHENOMENON_CATEGORIES = {
    "Fire": "high_enthalpy_phenomena",
    "Air": "high_entropy_phenomena",
    "Water": "low_enthalpy_phenomena",
    "Earth": "low_entropy_phenomena",
    "Quintessence": "equilibrium_phenomena",
}
EXPECTED_POPULATED_PHENOMENON_CATALOGS = {
    ("Fire", "high_enthalpy_phenomena"): EXPECTED_HIGH_ENTHALPY_IDS,
    ("Air", "high_entropy_phenomena"): EXPECTED_HIGH_ENTROPY_IDS,
}
CATEGORY_VALIDATION_PREFIXES = {
    "high_enthalpy_phenomena": "high_enthalpy",
    "high_entropy_phenomena": "high_entropy",
}
RICH_ENTRY_KEYS = {
    "mechanic_id",
    "definition",
    "relation_type",
    "value",
    "source_class",
}
INSTRUMENTATION_MECHANIC_IDS = {
    "shock_tube",
    "shock_tunnel",
    "reflected_shock_tunnel",
    "expansion_tube",
    "arc_jet_facility",
    "plasma_wind_tunnel",
    "inductively_coupled_plasma_torch",
    "reservoir_region",
    "test_section",
    "navier_stokes_equations",
    "euler_equations",
    "direct_simulation_monte_carlo",
    "finite_rate_reaction_model",
    "equilibrium_flow_model",
    "frozen_flow_model",
    "radiation_transport_model",
    "line_by_line_radiation_model",
    "state_to_state_kinetics",
    "state_specific_kinetics",
    "saha_equation",
    "knudsen_number",
    "damkohler_number",
}
KINETICS_RESERVED_MECHANIC_IDS = {
    "finite_rate_chemistry",
    "reaction_mechanism",
    "third_body_reaction",
}
EXPECTED_AUTHORING_FINGERPRINT = "d4d31aec34f5568014b21b57340682e5b461cc348dc8d2333bf86695449536ff"
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
    "characterizes",
    "transforms",
    "structures",
    "transfers",
}

REPORT_CHECK_IDS = (
    "mtr-schema-identity",
    "mtr-admission-boundary",
    "mtr-element-coverage",
    "mtr-category-scaffold",
    "mtr-high-enthalpy-fire-population",
    "mtr-high-entropy-air-population",
    "mtr-scale-map-replay",
    "mtr-polarity-bit-replay",
    "mtr-zodiac-facet-refs",
    "mtr-mercury-exclusion",
    "mtr-cross-registry-refs",
    "mtr-physics-guard",
    "mtr-instrumentation-separation",
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
    "missing-category-scaffold",
    "fire-glossary-wrong-polarity",
    "high-enthalpy-definition-drift",
    "air-high-entropy-wrong-polarity",
    "high-entropy-definition-drift",
    "high-entropy-glossary-duplicate-id",
    "instrumentation-term-injected",
    "kinetics-term-injected",
    "glossary-duplicate-id",
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
    "missing-category-scaffold": "category_scaffold_invalid",
    "fire-glossary-wrong-polarity": "high_enthalpy_polarity_invalid",
    "high-enthalpy-definition-drift": "authored_contract_mismatch",
    "air-high-entropy-wrong-polarity": "high_entropy_polarity_invalid",
    "high-entropy-definition-drift": "authored_contract_mismatch",
    "high-entropy-glossary-duplicate-id": "duplicate_id_rejected",
    "instrumentation-term-injected": "instrumentation_term_forbidden",
    "kinetics-term-injected": "kinetics_term_forbidden",
    "glossary-duplicate-id": "duplicate_id_rejected",
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


def _phenomenon_category(
    item: dict[str, Any], category_id: str
) -> dict[str, Any]:
    categories = item.get("phenomenon_categories", {})
    return categories.get(category_id, {})


def _glossary_entries(elements: list[dict[str, Any]]) -> list[dict[str, Any]]:
    entries = []
    for item in elements:
        category_id = EXPECTED_ELEMENT_PHENOMENON_CATEGORIES.get(item.get("element"))
        if category_id is None:
            continue
        child_scaffold = _phenomenon_category(item, category_id).get(
            "child_scaffold", {}
        )
        for scaffold_key in SCAFFOLD_KEYS:
            entries.extend(child_scaffold.get(scaffold_key, []))
    return entries


def _framework_errors(document: dict[str, Any]) -> list[str]:
    framework = document.get("framework", {})
    errors = []
    if framework.get("framework_id") != "teleological_phenomenon_master_framework":
        errors.append("framework_id")
    if framework.get("child_scaffold") != list(SCAFFOLD_KEYS):
        errors.append("child_scaffold")
    if framework.get("parent_categories") != EXPECTED_FRAMEWORK_PARENT_CATEGORIES:
        errors.append("parent_categories")
    return errors


def _scaffold_errors(elements: list[dict[str, Any]]) -> list[str]:
    errors = []
    for item in elements:
        element = item.get("element", "unknown")
        category_id = EXPECTED_ELEMENT_PHENOMENON_CATEGORIES.get(element)
        if category_id is None:
            errors.append(f"{element}:phenomenon_category")
            continue
        categories = item.get("phenomenon_categories", {})
        if set(categories) != {category_id}:
            errors.append(f"{element}:phenomenon_category_ownership")
            continue
        category = _phenomenon_category(item, category_id)
        if not category:
            errors.append(f"{element}:{category_id}")
            continue
        if category.get("section_id") != PHENOMENON_CATEGORY_SECTION_IDS[category_id]:
            errors.append(f"{element}:section_id")
        child_scaffold = category.get("child_scaffold")
        if not isinstance(child_scaffold, dict) or set(child_scaffold) != set(SCAFFOLD_KEYS):
            errors.append(f"{element}:child_scaffold")
            continue
        if (element, category_id) not in EXPECTED_POPULATED_PHENOMENON_CATALOGS:
            if category.get("population_status") != "placeholder":
                errors.append(f"{element}:population_status")
            if category.get("polarity_scope") != "unassigned":
                errors.append(f"{element}:polarity_scope")
            if any(child_scaffold[part] for part in SCAFFOLD_KEYS):
                errors.append(f"{element}:placeholder_entries")
    return errors


def _population_errors(
    item: dict[str, Any], category_id: str, expected_ids: dict[str, tuple[str, ...]]
) -> list[str]:
    category = _phenomenon_category(item, category_id)
    errors = []
    if category.get("population_status") != "populated":
        errors.append("population_status")
    if category.get("polarity_scope") != "electric_external":
        errors.append("polarity_scope")
    child_scaffold = category.get("child_scaffold", {})
    for scaffold_key, scaffold_ids in expected_ids.items():
        entries = child_scaffold.get(scaffold_key, [])
        if [entry.get("mechanic_id") for entry in entries] != list(scaffold_ids):
            errors.append(f"{scaffold_key}:mechanic_ids")
        if any(
            not isinstance(entry, dict)
            or set(entry) != RICH_ENTRY_KEYS
            or not entry.get("definition")
            or not entry.get("value")
            or entry.get("relation_type") != EXPECTED_CATEGORY_RELATION_TYPES[scaffold_key]
            or entry.get("source_class") != "authored_capability"
            for entry in entries
        ):
            errors.append(f"{scaffold_key}:rich_schema")
    return errors


def _instrumentation_errors(
    document: dict[str, Any], elements: list[dict[str, Any]]
) -> list[str]:
    errors = []
    if document.get("framework", {}).get("instrumentation_registry") != EXPECTED_INSTRUMENTATION_BOUNDARY:
        errors.append("instrumentation_registry_boundary")
    glossary_ids = {
        entry.get("mechanic_id") for entry in _glossary_entries(elements)
    }
    forbidden_instrumentation = sorted(glossary_ids & INSTRUMENTATION_MECHANIC_IDS)
    if forbidden_instrumentation:
        errors.extend(f"instrumentation:{item}" for item in forbidden_instrumentation)
    forbidden_kinetics = sorted(glossary_ids & KINETICS_RESERVED_MECHANIC_IDS)
    if forbidden_kinetics:
        errors.extend(f"kinetics:{item}" for item in forbidden_kinetics)
    return errors


def _authoring_payload(document: dict[str, Any]) -> dict[str, Any]:
    return {"framework": document.get("framework"), "elements": document.get("elements")}


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
    if _framework_errors(document) or _scaffold_errors(elements):
        return "category_scaffold_invalid"

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
    mechanic_ids.extend(entry.get("mechanic_id") for entry in _glossary_entries(elements))

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
    instrumentation_errors = _instrumentation_errors(document, elements)
    if "instrumentation_registry_boundary" in instrumentation_errors:
        return "instrumentation_boundary_invalid"
    if any(error.startswith("instrumentation:") for error in instrumentation_errors):
        return "instrumentation_term_forbidden"
    if any(error.startswith("kinetics:") for error in instrumentation_errors):
        return "kinetics_term_forbidden"
    for (element, category_id), expected_ids in (
        EXPECTED_POPULATED_PHENOMENON_CATALOGS.items()
    ):
        item = next(item for item in elements if item["element"] == element)
        population_errors = _population_errors(item, category_id, expected_ids)
        validation_prefix = CATEGORY_VALIDATION_PREFIXES[category_id]
        if "polarity_scope" in population_errors:
            return f"{validation_prefix}_polarity_invalid"
        if population_errors:
            return f"{validation_prefix}_catalog_invalid"
    if _cross_registry_binding_failures(elements):
        return "cross_registry_binding_mismatch"
    if _sha256_payload(_authoring_payload(document)) != EXPECTED_AUTHORING_FINGERPRINT:
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

    tampered = deepcopy(document)
    del next(item for item in tampered["elements"] if item["element"] == "Air")[
        "phenomenon_categories"
    ]["high_entropy_phenomena"]["child_scaffold"]["transfer_modes"]
    cases["missing-category-scaffold"] = tampered

    tampered = deepcopy(document)
    next(item for item in tampered["elements"] if item["element"] == "Fire")[
        "phenomenon_categories"
    ]["high_enthalpy_phenomena"]["polarity_scope"] = "magnetic_internal"
    cases["fire-glossary-wrong-polarity"] = tampered

    tampered = deepcopy(document)
    next(item for item in tampered["elements"] if item["element"] == "Fire")[
        "phenomenon_categories"
    ]["high_enthalpy_phenomena"]["child_scaffold"]["energy_states"][0][
        "definition"
    ] += " Drift."
    cases["high-enthalpy-definition-drift"] = tampered

    tampered = deepcopy(document)
    next(item for item in tampered["elements"] if item["element"] == "Air")[
        "phenomenon_categories"
    ]["high_entropy_phenomena"]["polarity_scope"] = "magnetic_internal"
    cases["air-high-entropy-wrong-polarity"] = tampered

    tampered = deepcopy(document)
    next(item for item in tampered["elements"] if item["element"] == "Air")[
        "phenomenon_categories"
    ]["high_entropy_phenomena"]["child_scaffold"]["energy_states"][0][
        "definition"
    ] += " Drift."
    cases["high-entropy-definition-drift"] = tampered

    tampered = deepcopy(document)
    next(item for item in tampered["elements"] if item["element"] == "Air")[
        "phenomenon_categories"
    ]["high_entropy_phenomena"]["child_scaffold"]["energy_states"][4][
        "mechanic_id"
    ] = "entropy"
    cases["high-entropy-glossary-duplicate-id"] = tampered

    tampered = deepcopy(document)
    next(item for item in tampered["elements"] if item["element"] == "Fire")[
        "phenomenon_categories"
    ]["high_enthalpy_phenomena"]["child_scaffold"]["transfer_modes"].append(
        {
            "mechanic_id": "shock_tube",
            "definition": "Injected instrumentation term.",
            "relation_type": "transfers",
            "value": "instrumentation",
            "source_class": "authored_capability",
        }
    )
    cases["instrumentation-term-injected"] = tampered

    tampered = deepcopy(document)
    next(item for item in tampered["elements"] if item["element"] == "Fire")[
        "phenomenon_categories"
    ]["high_enthalpy_phenomena"]["child_scaffold"]["transformations"].append(
        {
            "mechanic_id": "finite_rate_chemistry",
            "definition": "Injected Kinetics term.",
            "relation_type": "transforms",
            "value": "kinetics",
            "source_class": "authored_capability",
        }
    )
    cases["kinetics-term-injected"] = tampered

    tampered = deepcopy(document)
    next(item for item in tampered["elements"] if item["element"] == "Fire")[
        "phenomenon_categories"
    ]["high_enthalpy_phenomena"]["child_scaffold"]["energy_states"][0][
        "mechanic_id"
    ] = "explosive_emission"
    cases["glossary-duplicate-id"] = tampered

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

    framework_errors = _framework_errors(document)
    scaffold_errors = _scaffold_errors(elements)
    record(
        "mtr-category-scaffold",
        not framework_errors and not scaffold_errors,
        {"framework": framework_errors, "elements": scaffold_errors},
        str(REGISTRY_PATH) + "#framework",
        {
            "childScaffold": list(SCAFFOLD_KEYS),
            "parentCategories": EXPECTED_FRAMEWORK_PARENT_CATEGORIES,
        },
        document.get("framework"),
    )

    def record_population(
        check_id: str,
        element: str,
        category_id: str,
        expected_ids: dict[str, tuple[str, ...]],
    ) -> None:
        item = next(item for item in elements if item["element"] == element)
        population_errors = _population_errors(item, category_id, expected_ids)
        category = _phenomenon_category(item, category_id)
        children = category.get("child_scaffold", {})
        record(
            check_id,
            not population_errors,
            population_errors,
            str(REGISTRY_PATH)
            + f"#elements[{element}].phenomenon_categories.{category_id}",
            {
                "polarityScope": "electric_external",
                "entryCounts": {
                    scaffold_key: len(ids)
                    for scaffold_key, ids in expected_ids.items()
                },
            },
            {
                "polarityScope": category.get("polarity_scope"),
                "entryCounts": {
                    scaffold_key: len(children.get(scaffold_key, []))
                    for scaffold_key in SCAFFOLD_KEYS
                },
            },
        )

    record_population(
        "mtr-high-enthalpy-fire-population",
        "Fire",
        "high_enthalpy_phenomena",
        EXPECTED_HIGH_ENTHALPY_IDS,
    )
    record_population(
        "mtr-high-entropy-air-population",
        "Air",
        "high_entropy_phenomena",
        EXPECTED_HIGH_ENTROPY_IDS,
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

    instrumentation_errors = _instrumentation_errors(document, elements)
    record(
        "mtr-instrumentation-separation",
        not instrumentation_errors,
        instrumentation_errors,
        str(REGISTRY_PATH) + "#framework.instrumentation_registry",
        {
            "instrumentationRegistry": EXPECTED_INSTRUMENTATION_BOUNDARY,
            "forbiddenInstrumentationTerms": [],
            "reservedKineticsTerms": [],
        },
        {
            "instrumentationRegistry": document.get("framework", {}).get(
                "instrumentation_registry"
            ),
            "separationErrors": instrumentation_errors,
        },
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

    authored_entries = [
        capability
        for item in elements
        for capability in item["capabilities"].values()
    ] + _glossary_entries(elements)
    relation_types = {capability["relation_type"] for capability in authored_entries}
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
        "instrumentation_and_modeling_separated",
        "kinetics_mechanism_terms_reserved",
    }
    record(
        "mtr-guard-closure",
        guard_ids == expected_guards and len(document["guards"]) == 11,
        sorted(guard_ids),
        str(REGISTRY_PATH) + "#guards",
    )

    record(
        "mtr-determinism",
        _canonical_bytes(document) == _canonical_bytes(_load_registry())
        and _sha256_payload(_authoring_payload(document))
        == EXPECTED_AUTHORING_FINGERPRINT,
        {
            "document": _sha256_payload(document),
            "authoring": _sha256_payload(_authoring_payload(document)),
        },
        str(REGISTRY_PATH),
        EXPECTED_AUTHORING_FINGERPRINT,
        _sha256_payload(_authoring_payload(document)),
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
