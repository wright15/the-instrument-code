#!/usr/bin/env python3
"""Independently validate the direct-capability Mechanics Thermodynamics Registry v2."""

from __future__ import annotations

from copy import deepcopy
import hashlib
import json
from pathlib import Path
from typing import Any

import jsonschema
import yaml


ROOT = Path(__file__).resolve().parents[1]
REGISTRY_PATH = ROOT / "schemas/mechanics_thermodynamics_registry_v2.0.0.yaml"
SCHEMA_PATH = ROOT / "schemas/mechanics-thermodynamics-registry-v2.0.0.schema.json"
REPORT_SCHEMA_PATH = (
    ROOT / "schemas/mechanics-thermodynamics-registry-validation-report-v2.0.0.schema.json"
)
REPORT_PATH = ROOT / "qa/mechanics-thermodynamics-registry-validation-v2.0.0.json"

CRT347_PATH = "canonical/fivefold-capability-candidates/fivefold-capability-teleology-v1.json"
CRT349_PATH = "schemas/teleological_physics_registry_v1.0.0.yaml"
CRT350_PATH = "schemas/elemental_pentatonic_scale_map_v1.0.0.yaml"
REPORT_SCHEMA_VERSION = "mechanics-thermodynamics-registry-validation.v2.0.0"

SCAFFOLD_RELATIONS = {
    "energy_states": "characterizes",
    "transformations": "transforms",
    "structural_forms": "structures",
    "transfer_modes": "transfers",
}
RICH_ENTRY_REQUIRED_KEYS = {
    "mechanic_id",
    "definition",
    "relation_type",
    "value",
    "phenomenon_class",
    "source_class",
}
RICH_ENTRY_OPTIONAL_KEYS = {"semantic_transition"}
RICH_ENTRY_KEYS = RICH_ENTRY_REQUIRED_KEYS | RICH_ENTRY_OPTIONAL_KEYS
SEMANTIC_TRANSITION_VALUE = "failure_or_crossover"
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
    *SCAFFOLD_RELATIONS.values(),
}
PHENOMENON_CLASSES = {
    "capability_action",
    "high_enthalpy",
    "high_entropy",
    "low_enthalpy",
    "low_entropy",
    "equilibrium",
}
POPULATED_CLASS_PLACEMENTS = {
    "high_enthalpy": (
        ("Fire", "electric_external"),
        ("Fire", "magnetic_internal"),
    ),
    "high_entropy": (
        ("Air", "electric_external"),
        ("Air", "magnetic_internal"),
    ),
    "low_enthalpy": (
        ("Water", "electric_external"),
        ("Water", "magnetic_internal"),
    ),
    "low_entropy": (
        ("Earth", "electric_external"),
        ("Earth", "magnetic_internal"),
    ),
    "equilibrium": (
        ("Quintessence", "electric_external"),
        ("Quintessence", "magnetic_internal"),
    ),
}
EXPECTED_CLASS_COUNTS = {
    "high_enthalpy": {
        "characterizes": 13,
        "transforms": 17,
        "structures": 26,
        "transfers": 27,
    },
    "high_entropy": {
        "characterizes": 17,
        "transforms": 12,
        "structures": 12,
        "transfers": 3,
    },
    "low_enthalpy": {
        "characterizes": 13,
        "transforms": 12,
        "structures": 10,
        "transfers": 9,
    },
    "low_entropy": {
        "characterizes": 10,
        "transforms": 12,
        "structures": 12,
        "transfers": 12,
    },
    "equilibrium": {
        "characterizes": 11,
        "transforms": 12,
        "structures": 14,
        "transfers": 13,
    },
}
MAGNETIC_CLASS_COUNTS = {
    "high_enthalpy": {
        "characterizes": 8,
        "transforms": 8,
        "structures": 8,
        "transfers": 8,
    },
    "high_entropy": {
        "characterizes": 8,
        "transforms": 8,
        "structures": 8,
        "transfers": 8,
    },
    "low_enthalpy": {
        "characterizes": 8,
        "transforms": 8,
        "structures": 8,
        "transfers": 8,
    },
    "low_entropy": {
        "characterizes": 8,
        "transforms": 8,
        "structures": 8,
        "transfers": 8,
    },
    "equilibrium": {
        "characterizes": 9,
        "transforms": 9,
        "structures": 9,
        "transfers": 9,
    },
}
EXPECTED_LOW_ENTHALPY_IDS = {
    "characterizes": (
        "electrolyte_activity",
        "interfacial_capacitance",
        "interfacial_electric_field",
        "electrochemical_potential",
        "electrode_potential",
        "electrolyte_ionic_strength",
        "nernst_potential",
        "electrochemical_overpotential",
        "electrolyte_ph",
        "interfacial_polarization",
        "interfacial_surface_charge",
        "interfacial_surface_tension",
        "zeta_potential",
    ),
    "transforms": (
        "interfacial_adsorption",
        "interfacial_charge_separation",
        "electrochemical_condensation",
        "interfacial_desorption",
        "dielectric_polarization",
        "electrolyte_dissolution",
        "electrolysis",
        "electrowetting",
        "faradaic_process",
        "nonfaradaic_process",
        "electrochemical_redox_reaction",
        "electrolyte_solvation",
    ),
    "structures": (
        "aqueous_electrolyte",
        "ionic_charge_carrier",
        "electrolyte_counterion",
        "electrolyte_dielectric",
        "electric_double_layer",
        "electrochemical_cell",
        "electrochemical_equilibrium",
        "electrochemical_electrode",
        "galvanic_cell",
        "hydration_shell",
    ),
    "transfers": (
        "electrolyte_debye_length",
        "electrocapillarity",
        "electrodiffusion",
        "electroosmosis",
        "ionic_conduction",
        "ionic_mobility",
        "osmotic_transfer",
        "proton_conduction",
        "streaming_potential",
    ),
}
EXPECTED_LOW_ENTROPY_IDS = {
    "characterizes": (
        "band_gap",
        "crystalline_dielectric",
        "depletion_region",
        "dielectric_strength",
        "electric_displacement_field",
        "electrostatic_surface_potential",
        "ferroelectric_phase",
        "poled_ferroelectric_state",
        "piezoelectric_strain_state",
        "surface_charge_state",
    ),
    "transforms": (
        "anodization",
        "dielectric_breakdown",
        "dielectrophoretic_assembly",
        "electric_field_assisted_crystallization",
        "electric_field_directed_self_assembly",
        "electrodeposition",
        "electrochemical_passivation",
        "electrocrystallization",
        "electroepitaxy",
        "electrophoretic_deposition",
        "ferroelectric_domain_switching",
        "piezoelectric_actuation",
    ),
    "structures": (
        "crystal_lattice",
        "dielectric_layer",
        "domain_wall",
        "electrical_tree",
        "electrodeposited_coating",
        "electrocrystalline_dendrite",
        "epitaxial_film",
        "ferroelectric_domain",
        "passivation_layer",
        "pn_junction",
        "thermal_barrier_coating",
        "vacancy_ordered_crystal",
    ),
    "transfers": (
        "capacitive_coupling",
        "dielectric_displacement_current",
        "electrical_insulation",
        "electrostatic_induction",
        "electric_field_shielding",
        "field_emission",
        "piezoelectric_transduction",
        "radiative_reflection",
        "thermal_boundary_resistance",
        "thermal_insulation",
        "tunneling_current",
        "breakdown_conduction",
    ),
}
EXPECTED_EQUILIBRIUM_IDS = {
    "characterizes": (
        "dynamic_equilibrium",
        "mercury_electric_electrochemical_equilibrium",
        "equilibrium_potential",
        "isothermal_state",
        "open_circuit_thermoelectric_state",
        "phase_equilibrium",
        "quasi_static_state",
        "radiative_equilibrium",
        "reversible_state",
        "thermal_steady_state",
        "mercury_electric_nonequilibrium_steady_state",
    ),
    "transforms": (
        "electrocaloric_effect",
        "isothermal_expansion",
        "latent_heat_buffering",
        "peltier_effect",
        "phase_change_heat_rejection",
        "radiative_equilibration",
        "seebeck_effect",
        "thermal_feedback_stabilization",
        "thermoelectric_heat_pumping",
        "thomson_effect",
        "thermostatic_switching",
        "pyroelectric_conversion",
    ),
    "structures": (
        "blackbody_radiator",
        "heat_pipe_radiator",
        "isothermal_boundary",
        "phase_change_heat_exchanger",
        "phase_interface",
        "radiative_equilibrium_surface",
        "thermal_boundary_layer",
        "thermal_control_loop",
        "thermal_radiator",
        "thermal_strap",
        "thermocouple_junction",
        "thermoelectric_module",
        "thermopile",
        "two_phase_flow_loop",
    ),
    "transfers": (
        "conductive_heat_rejection",
        "convective_heat_rejection",
        "electrocaloric_heat_transfer",
        "entropy_export",
        "isothermal_heat_transfer",
        "latent_heat_transfer",
        "peltier_heat_pumping",
        "pyroelectric_signal_transduction",
        "mercury_electric_radiative_cooling",
        "seebeck_voltage_transduction",
        "thermal_radiation_exchange",
        "thermoelectric_power_generation",
        "two_phase_heat_transport",
    ),
}
EXPECTED_CATALOG_IDS = {
    "low_enthalpy": EXPECTED_LOW_ENTHALPY_IDS,
    "low_entropy": EXPECTED_LOW_ENTROPY_IDS,
    "equilibrium": EXPECTED_EQUILIBRIUM_IDS,
}
EXPECTED_MAGNETIC_CATALOG_IDS = {
    "Fire": {
        "characterizes": (
            "fire_magnetic_sensible_heat",
            "fire_magnetic_heat_capacity",
            "fire_magnetic_thermal_inertia",
            "fire_magnetic_heat_soak",
            "fire_magnetic_chemical_enthalpy_storage",
            "fire_magnetic_smoldering_combustion",
            "fire_magnetic_high_temperature_thermal_reservoir",
            "fire_magnetic_adiabatic_confinement",
        ),
        "transforms": (
            "fire_magnetic_endothermic_reaction",
            "fire_magnetic_endothermic_dissociation",
            "fire_magnetic_pyrolysis",
            "fire_magnetic_thermochemical_charging",
            "fire_magnetic_char_formation",
            "fire_magnetic_oxygen_limited_oxidation",
            "fire_magnetic_thermal_charging",
            "fire_magnetic_ablative_decomposition",
        ),
        "structures": (
            "fire_magnetic_ablative_heat_shield",
            "fire_magnetic_char_layer",
            "fire_magnetic_pyrolysis_front",
            "fire_magnetic_refractory_lining",
            "fire_magnetic_smoldering_front",
            "fire_magnetic_packed_fuel_bed",
            "fire_magnetic_thermal_penetration_layer",
            "fire_magnetic_insulated_hot_zone",
        ),
        "transfers": (
            "fire_magnetic_inward_heat_conduction",
            "fire_magnetic_radiative_absorption",
            "fire_magnetic_sensible_heat_uptake",
            "fire_magnetic_endothermic_heat_uptake",
            "fire_magnetic_thermal_diffusion",
            "fire_magnetic_volumetric_absorption",
            "fire_magnetic_thermochemical_heat_storage",
            "fire_magnetic_ablative_heat_absorption",
        ),
    },
    "Air": {
        "characterizes": (
            "air_magnetic_compressed_gas_state",
            "air_magnetic_stagnation_state",
            "air_magnetic_stagnation_pressure_loss",
            "air_magnetic_viscous_stress",
            "air_magnetic_bulk_viscous_stress",
            "air_magnetic_high_density_gas_state",
            "air_magnetic_viscosity_dominated_flow",
            "air_magnetic_stable_stratification",
        ),
        "transforms": (
            "air_magnetic_viscous_dissipation",
            "air_magnetic_irreversible_compression",
            "air_magnetic_shock_compression",
            "air_magnetic_flow_stagnation",
            "air_magnetic_turbulent_decay",
            "air_magnetic_aerodynamic_damping",
            "air_magnetic_acoustic_attenuation",
            "air_magnetic_vortex_trapping",
        ),
        "structures": (
            "air_magnetic_stagnation_region",
            "air_magnetic_viscous_boundary_layer",
            "air_magnetic_viscous_sublayer",
            "air_magnetic_recirculation_bubble",
            "air_magnetic_trapped_vortex",
            "air_magnetic_temperature_inversion_layer",
            "air_magnetic_compression_layer",
            "air_magnetic_stagnant_air_layer",
        ),
        "transfers": (
            "air_magnetic_viscous_drag",
            "air_magnetic_momentum_diffusion",
            "air_magnetic_bulk_viscous_dissipation",
            "air_magnetic_compressive_work",
            "air_magnetic_frictional_heating",
            "air_magnetic_acoustic_absorption",
            "air_magnetic_turbulent_dissipation",
            "air_magnetic_boundary_layer_momentum_absorption",
        ),
    },
    "Water": {
        "characterizes": (
            "water_magnetic_surface_tension",
            "water_magnetic_capillary_pressure",
            "water_magnetic_osmotic_pressure",
            "water_magnetic_latent_heat_of_fusion",
            "water_magnetic_latent_heat_of_vaporization",
            "water_magnetic_cohesive_energy_density",
            "water_magnetic_bound_water",
            "water_magnetic_hydrostatic_pressure",
        ),
        "transforms": (
            "water_magnetic_hydration",
            "water_magnetic_solvation",
            "water_magnetic_hydrogen_bond_formation",
            "water_magnetic_capillary_condensation",
            "water_magnetic_capillary_imbibition",
            "water_magnetic_osmotic_uptake",
            "water_magnetic_droplet_coalescence",
            "water_magnetic_phase_change_charging",
        ),
        "structures": (
            "water_magnetic_hydration_shell",
            "water_magnetic_hydrogen_bond_network",
            "water_magnetic_capillary_meniscus",
            "water_magnetic_liquid_bridge",
            "water_magnetic_bound_water_layer",
            "water_magnetic_semipermeable_membrane",
            "water_magnetic_capillary_pore_network",
            "water_magnetic_vesicle",
        ),
        "transfers": (
            "water_magnetic_latent_heat_absorption",
            "water_magnetic_osmotic_inflow",
            "water_magnetic_capillary_uptake",
            "water_magnetic_solvent_permeation",
            "water_magnetic_interfacial_adsorption",
            "water_magnetic_hygroscopic_absorption",
            "water_magnetic_condensational_heat_transfer",
            "water_magnetic_cohesive_retention",
        ),
    },
    "Earth": {
        "characterizes": (
            "earth_magnetic_crystalline_order",
            "earth_magnetic_lattice_energy",
            "earth_magnetic_elastic_strain_energy",
            "earth_magnetic_peierls_barrier",
            "earth_magnetic_yield_stress",
            "earth_magnetic_pinned_dislocation_state",
            "earth_magnetic_thermal_resistivity",
            "earth_magnetic_low_diffusivity_solid",
        ),
        "transforms": (
            "earth_magnetic_crystallization",
            "earth_magnetic_solidification",
            "earth_magnetic_recrystallization",
            "earth_magnetic_sintering",
            "earth_magnetic_precipitation_hardening",
            "earth_magnetic_grain_boundary_pinning",
            "earth_magnetic_zener_pinning",
            "earth_magnetic_dislocation_pinning",
        ),
        "structures": (
            "earth_magnetic_crystal_lattice",
            "earth_magnetic_grain_boundary",
            "earth_magnetic_second_phase_precipitate",
            "earth_magnetic_cottrell_atmosphere",
            "earth_magnetic_vacancy_ordered_crystal",
            "earth_magnetic_ceramic_insulating_layer",
            "earth_magnetic_phononic_crystal",
            "earth_magnetic_diffusion_barrier_layer",
        ),
        "transfers": (
            "earth_magnetic_thermal_insulation",
            "earth_magnetic_electrical_insulation",
            "earth_magnetic_suppressed_mass_diffusion",
            "earth_magnetic_thermal_boundary_resistance",
            "earth_magnetic_phonon_reflection",
            "earth_magnetic_acoustic_impedance_mismatch",
            "earth_magnetic_elastic_energy_storage",
            "earth_magnetic_dislocation_immobilization",
        ),
    },
    "Quintessence": {
        "characterizes": (
            "quintessence_magnetic_thermodynamic_equilibrium",
            "quintessence_magnetic_thermal_equilibrium",
            "quintessence_magnetic_chemical_equilibrium",
            "quintessence_magnetic_mechanical_equilibrium",
            "quintessence_magnetic_phase_equilibrium",
            "quintessence_magnetic_detailed_balance",
            "quintessence_magnetic_gibbs_free_energy_minimum",
            "quintessence_magnetic_stable_fixed_point",
            "quintessence_magnetic_nonequilibrium_steady_state",
        ),
        "transforms": (
            "quintessence_magnetic_thermal_equilibration",
            "quintessence_magnetic_relaxation_to_equilibrium",
            "quintessence_magnetic_negative_feedback_stabilization",
            "quintessence_magnetic_thermostatic_regulation",
            "quintessence_magnetic_phase_change_buffering",
            "quintessence_magnetic_thermal_anchoring_transformation",
            "quintessence_magnetic_calorimetric_integration",
            "quintessence_magnetic_re_equilibration",
            "quintessence_magnetic_temperature_clamping",
        ),
        "structures": (
            "quintessence_magnetic_thermal_reservoir",
            "quintessence_magnetic_thermal_bath",
            "quintessence_magnetic_heat_sink",
            "quintessence_magnetic_isothermal_enclosure",
            "quintessence_magnetic_adiabatic_calorimeter",
            "quintessence_magnetic_fixed_point_cell",
            "quintessence_magnetic_triple_point_cell",
            "quintessence_magnetic_bolometer",
            "quintessence_magnetic_thermal_anchor",
        ),
        "transfers": (
            "quintessence_magnetic_conductive_equilibration",
            "quintessence_magnetic_heat_sink_absorption",
            "quintessence_magnetic_latent_heat_buffering",
            "quintessence_magnetic_calorimetric_heat_uptake",
            "quintessence_magnetic_bolometric_absorption",
            "quintessence_magnetic_thermometric_transduction",
            "quintessence_magnetic_thermal_anchoring_transfer",
            "quintessence_magnetic_near_reversible_heat_exchange",
            "quintessence_magnetic_internal_feedback_compensation",
        ),
    },
}
EXPECTED_SEMANTIC_TRANSITIONS = {
    "dielectric_breakdown": SEMANTIC_TRANSITION_VALUE,
    "electrical_tree": SEMANTIC_TRANSITION_VALUE,
    "breakdown_conduction": SEMANTIC_TRANSITION_VALUE,
}
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
EXPECTED_BINDINGS = {
    "Fire": {
        "school_ref": "fivefold.capability_school.fire",
        "scale_map_ref": "schemas/elemental_pentatonic_scale_map_v1.0.0.yaml#scale_bindings[Fire (Mars)]",
        "transition_refs": ["court_advance_C0_to_C1", "court_retreat_C1_to_C0"],
        "polarity_bindings": {
            "electric_external": {
                "polarity_bit": 0,
                "zodiac": "Aries",
                "zodiac_facet_ref": "fivefold.zodiac.capability_school_facet.aries",
                "transition_ref": "court_retreat_C1_to_C0",
            },
            "magnetic_internal": {
                "polarity_bit": 1,
                "zodiac": "Scorpio",
                "zodiac_facet_ref": "fivefold.zodiac.capability_school_facet.scorpio",
                "transition_ref": "court_advance_C0_to_C1",
            },
        },
    },
    "Air": {
        "school_ref": "fivefold.capability_school.air",
        "scale_map_ref": "schemas/elemental_pentatonic_scale_map_v1.0.0.yaml#scale_bindings[Air / Wind (Jupiter)]",
        "transition_refs": ["court_advance_C1_to_C2", "court_retreat_C2_to_C1"],
        "polarity_bindings": {
            "electric_external": {
                "polarity_bit": 0,
                "zodiac": "Sagittarius",
                "zodiac_facet_ref": "fivefold.zodiac.capability_school_facet.sagittarius",
                "transition_ref": "court_retreat_C2_to_C1",
            },
            "magnetic_internal": {
                "polarity_bit": 1,
                "zodiac": "Pisces",
                "zodiac_facet_ref": "fivefold.zodiac.capability_school_facet.pisces",
                "transition_ref": "court_advance_C1_to_C2",
            },
        },
    },
    "Water": {
        "school_ref": "fivefold.capability_school.water",
        "scale_map_ref": "schemas/elemental_pentatonic_scale_map_v1.0.0.yaml#scale_bindings[Water (Venus)]",
        "transition_refs": ["court_advance_C2_to_C3", "court_retreat_C3_to_C2"],
        "polarity_bindings": {
            "electric_external": {
                "polarity_bit": 0,
                "zodiac": "Libra",
                "zodiac_facet_ref": "fivefold.zodiac.capability_school_facet.libra",
                "transition_ref": "court_retreat_C3_to_C2",
            },
            "magnetic_internal": {
                "polarity_bit": 1,
                "zodiac": "Taurus",
                "zodiac_facet_ref": "fivefold.zodiac.capability_school_facet.taurus",
                "transition_ref": "court_advance_C2_to_C3",
            },
        },
    },
    "Earth": {
        "school_ref": "fivefold.capability_school.earth",
        "scale_map_ref": "schemas/elemental_pentatonic_scale_map_v1.0.0.yaml#scale_bindings[Earth (Saturn)]",
        "transition_refs": ["court_advance_C3_to_C4", "court_retreat_C4_to_C3"],
        "polarity_bindings": {
            "electric_external": {
                "polarity_bit": 0,
                "zodiac": "Aquarius",
                "zodiac_facet_ref": "fivefold.zodiac.capability_school_facet.aquarius",
                "transition_ref": "court_retreat_C4_to_C3",
            },
            "magnetic_internal": {
                "polarity_bit": 1,
                "zodiac": "Capricorn",
                "zodiac_facet_ref": "fivefold.zodiac.capability_school_facet.capricorn",
                "transition_ref": "court_advance_C3_to_C4",
            },
        },
    },
    "Quintessence": {
        "school_ref": "fivefold.capability_school.quintessence",
        "scale_map_ref": "schemas/elemental_pentatonic_scale_map_v1.0.0.yaml#scale_bindings[Quintessence (Mercury)]",
        "engine_interface_ref": "mercury_engine_cycle",
    },
}
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
        "population_status": "populated_in_this_registry",
    },
    {
        "category_id": "low_entropy_phenomena",
        "section_id": "low_entropy_thermodynamics",
        "population_status": "populated_in_this_registry",
    },
    {
        "category_id": "equilibrium_phenomena",
        "section_id": "equilibrium_thermodynamics",
        "population_status": "populated_in_this_registry",
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
    "structural_descriptors_retained": ["two_temperature_model", "multi_temperature_model"],
}
EXPECTED_ACTIONS = {
    ("Fire", "electric_external"): (
        "explosive_emission",
        "Rapid, outward broadcast of kinetic and thermal energy.",
        "activated_by",
        "outward_kinetic_force",
    ),
    ("Fire", "magnetic_internal"): (
        "inductive_smoldering",
        "Absorbs external kinetic energy and stores it as sustained internal heat.",
        "resists_by",
        "inductive_resistance",
    ),
    ("Air", "electric_external"): (
        "thermal_updraft",
        "Expands and scatters heat outward, reducing localized energy density.",
        "distributes",
        "rarefied_heat_flow",
    ),
    ("Air", "magnetic_internal"): (
        "thermal_drag",
        "Stifles heat distribution, creating localized cold pockets or dense pressure.",
        "constrains",
        "ground_level_drag",
    ),
    ("Water", "electric_external"): (
        "convective_discharge",
        "Outward exchange of thermal energy; balancing the temperature of the environment.",
        "exchanges",
        "thermal_coupling",
    ),
    ("Water", "magnetic_internal"): (
        "latent_heat_storage",
        "Absorbs massive amounts of heat without changing state; internal pressure building.",
        "absorbs",
        "specific_heat_capacity",
    ),
    ("Earth", "electric_external"): (
        "dielectric_friction",
        "Generates static/thermal friction at the boundary, repelling external heat.",
        "repels",
        "thermal_insulation",
    ),
    ("Earth", "magnetic_internal"): (
        "crystallization_lock",
        "Flash-freezes internal energy into an immutable, solid lattice.",
        "fixes",
        "absolute_state_change",
    ),
    ("Quintessence", "engine_interface"): (
        "phase_transition",
        "Translates harmonic state mutations into elemental thermodynamic shifts.",
        "transduces",
        "em_induction_cycle",
    ),
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
FORBIDDEN_RELATIONS = ("SETS_COURT_POLE", "EXECUTES_COURT_MOVE")
EXPECTED_AUTHORING_FINGERPRINT = "0691837291afcd1cd2abe3ff998b4835dffdb03e5910be3a8ea3058662e8cf3c"

REPORT_CHECK_IDS = (
    "mtr-v2-schema-identity",
    "mtr-v2-admission-boundary",
    "mtr-v2-element-coverage",
    "mtr-v2-direct-capability-arrays",
    "mtr-v2-high-enthalpy-fire-population",
    "mtr-v2-high-entropy-air-population",
    "mtr-v2-low-enthalpy-water-population",
    "mtr-v2-low-entropy-earth-population",
    "mtr-v2-equilibrium-mercury-population",
    "mtr-v2-scale-map-replay",
    "mtr-v2-polarity-binding-replay",
    "mtr-v2-zodiac-facet-refs",
    "mtr-v2-mercury-exclusion",
    "mtr-v2-cross-registry-refs",
    "mtr-v2-physics-guard",
    "mtr-v2-instrumentation-separation",
    "mtr-v2-forbidden-relations",
    "mtr-v2-relation-vocabulary",
    "mtr-v2-guard-closure",
    "mtr-v2-determinism",
    "mtr-v2-adversarial-rejection",
)
EXPECTED_MUTATION_CODES = {
    "wrong-scale-id": "scale_map_replay_mismatch",
    "mercury-with-polarity": "mercury_exclusion_invalid",
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
    "binding-transition-swapped": "cross_registry_binding_mismatch",
    "capability-definition-drift": "authored_contract_mismatch",
    "mercury-transition-injected": "mercury_exclusion_invalid",
    "legacy-category-injected": "capability_array_invalid",
    "magnetic-catalog-id-substituted": "glossary_catalog_invalid",
    "fire-glossary-in-magnetic": "glossary_catalog_invalid",
    "water-glossary-in-magnetic": "glossary_catalog_invalid",
    "earth-glossary-in-magnetic": "glossary_catalog_invalid",
    "mercury-equilibrium-in-engine-interface": "phenomenon_class_placement_invalid",
    "mercury-equilibrium-in-magnetic": "glossary_catalog_invalid",
    "missing-phenomenon-class": "rich_entry_invalid",
    "missing-equilibrium-phenomenon-class": "rich_entry_invalid",
    "water-glossary-wrong-class": "phenomenon_class_placement_invalid",
    "earth-glossary-wrong-class": "phenomenon_class_placement_invalid",
    "equilibrium-glossary-wrong-class": "phenomenon_class_placement_invalid",
    "missing-earth-semantic-transition": "semantic_transition_invalid",
    "unexpected-semantic-transition": "semantic_transition_invalid",
    "instrumentation-term-injected": "instrumentation_term_forbidden",
    "kinetics-term-injected": "kinetics_term_forbidden",
    "glossary-duplicate-id": "duplicate_id_rejected",
}


class MechanicsThermodynamicsValidationError(ValueError):
    """Stable independent-validation rejection."""

    def __init__(self, reason_code: str) -> None:
        super().__init__(reason_code)
        self.reason_code = reason_code


def _canonical_bytes(value: Any) -> bytes:
    return json.dumps(
        value,
        ensure_ascii=False,
        allow_nan=False,
        separators=(",", ":"),
        sort_keys=True,
    ).encode("utf-8")


def _sha256_payload(value: Any) -> str:
    return hashlib.sha256(_canonical_bytes(value)).hexdigest()


def _read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def _load_registry() -> dict[str, Any]:
    return yaml.safe_load(REGISTRY_PATH.read_text(encoding="utf-8"))


def _load_crt347() -> dict[str, Any]:
    return _read_json(ROOT / CRT347_PATH)


def _load_crt349() -> dict[str, Any]:
    return yaml.safe_load((ROOT / CRT349_PATH).read_text(encoding="utf-8"))


def _load_crt350() -> dict[str, Any]:
    return yaml.safe_load((ROOT / CRT350_PATH).read_text(encoding="utf-8"))


def _element(document: dict[str, Any], element: str) -> dict[str, Any]:
    return next(item for item in document.get("elements", []) if item.get("element") == element)


def _entries(item: dict[str, Any], channel: str) -> list[dict[str, Any]]:
    entries = item.get("capabilities", {}).get(channel, [])
    return entries if isinstance(entries, list) else []


def _all_entries(document: dict[str, Any]) -> list[tuple[str, str, dict[str, Any]]]:
    entries = []
    for item in document.get("elements", []):
        element = item.get("element", "unknown")
        capabilities = item.get("capabilities", {})
        if not isinstance(capabilities, dict):
            continue
        for channel, channel_entries in capabilities.items():
            if isinstance(channel_entries, list):
                entries.extend((element, channel, entry) for entry in channel_entries)
    return entries


def _authoring_payload(document: dict[str, Any]) -> dict[str, Any]:
    return {"framework": document.get("framework"), "elements": document.get("elements")}


def _framework_errors(document: dict[str, Any]) -> list[str]:
    framework = document.get("framework", {})
    errors = []
    if framework.get("framework_id") != "teleological_phenomenon_master_framework":
        errors.append("framework_id")
    if framework.get("child_scaffold") != list(SCAFFOLD_RELATIONS):
        errors.append("child_scaffold")
    if framework.get("parent_categories") != EXPECTED_FRAMEWORK_PARENT_CATEGORIES:
        errors.append("parent_categories")
    if framework.get("instrumentation_registry") != EXPECTED_INSTRUMENTATION_BOUNDARY:
        errors.append("instrumentation_registry")
    return errors


def _array_layout_errors(document: dict[str, Any]) -> list[str]:
    errors = []
    for item in document.get("elements", []):
        element = item.get("element", "unknown")
        capabilities = item.get("capabilities")
        if "phenomenon_categories" in item:
            errors.append(f"{element}:legacy_phenomenon_categories")
        if not isinstance(capabilities, dict):
            errors.append(f"{element}:capabilities")
            continue
        if element == "Quintessence":
            if set(capabilities) != {
                "engine_interface",
                "electric_external",
                "magnetic_internal",
            }:
                errors.append("Quintessence:capability_channels")
            for channel in ("engine_interface", "electric_external", "magnetic_internal"):
                if not isinstance(capabilities.get(channel), list) or not capabilities.get(channel):
                    errors.append(f"Quintessence:{channel}:array")
            if "polarity_bindings" in item or "transition_refs" in item:
                errors.append("Quintessence:polar_metadata")
            continue
        if set(capabilities) != {"electric_external", "magnetic_internal"}:
            errors.append(f"{element}:binary_capabilities")
        for channel in ("electric_external", "magnetic_internal"):
            if not isinstance(capabilities.get(channel), list) or not capabilities.get(channel):
                errors.append(f"{element}:{channel}:array")
        bindings = item.get("polarity_bindings")
        if not isinstance(bindings, dict) or set(bindings) != {
            "electric_external",
            "magnetic_internal",
        }:
            errors.append(f"{element}:polarity_bindings")
    return errors


def _entry_errors(document: dict[str, Any]) -> list[str]:
    errors = []
    for element, channel, entry in _all_entries(document):
        if (
            not isinstance(entry, dict)
            or not RICH_ENTRY_REQUIRED_KEYS <= set(entry) <= RICH_ENTRY_KEYS
        ):
            errors.append(f"{element}:{channel}:rich_keys")
            continue
        if not all(
            isinstance(entry.get(key), str) and entry[key]
            for key in RICH_ENTRY_REQUIRED_KEYS
        ):
            errors.append(f"{element}:{channel}:rich_values")
            continue
        if "semantic_transition" in entry and not (
            isinstance(entry["semantic_transition"], str)
            and entry["semantic_transition"]
        ):
            errors.append(f"{element}:{channel}:semantic_transition")
            continue
        if entry["relation_type"] not in AUTHORED_RELATION_VOCABULARY:
            errors.append(f"{element}:{channel}:relation_type")
        if entry["phenomenon_class"] not in PHENOMENON_CLASSES:
            errors.append(f"{element}:{channel}:phenomenon_class")
        if entry["source_class"] != "authored_capability":
            errors.append(f"{element}:{channel}:source_class")
    return errors


def _action_errors(document: dict[str, Any]) -> list[str]:
    errors = []
    for (element, channel), expected in EXPECTED_ACTIONS.items():
        try:
            entries = _entries(_element(document, element), channel)
        except StopIteration:
            errors.append(f"{element}:{channel}:missing")
            continue
        action_entries = [
            entry
            for entry in entries
            if isinstance(entry, dict) and entry.get("phenomenon_class") == "capability_action"
        ]
        if len(action_entries) != 1 or not entries or entries[0] != action_entries[0]:
            errors.append(f"{element}:{channel}:action_position")
            continue
        action = action_entries[0]
        actual = tuple(
            action.get(key)
            for key in ("mechanic_id", "definition", "relation_type", "value")
        )
        if actual != expected:
            errors.append(f"{element}:{channel}:action_contract")
    return errors


def _class_placement_errors(document: dict[str, Any]) -> list[str]:
    errors = []
    for element, channel, entry in _all_entries(document):
        if not isinstance(entry, dict):
            continue
        phenomenon_class = entry.get("phenomenon_class")
        if phenomenon_class == "capability_action":
            if (element, channel) not in EXPECTED_ACTIONS:
                errors.append(f"{element}:{channel}:{phenomenon_class}:placement")
            continue
        expected_placements = POPULATED_CLASS_PLACEMENTS.get(phenomenon_class, ())
        if (element, channel) not in expected_placements:
            errors.append(f"{element}:{channel}:{phenomenon_class}:placement")
    return errors


def _catalog_errors(
    document: dict[str, Any], element: str, channel: str, phenomenon_class: str
) -> list[str]:
    errors = []
    try:
        entries = _entries(_element(document, element), channel)
    except StopIteration:
        return ["missing_element"]
    catalog = [
        entry
        for entry in entries
        if isinstance(entry, dict) and entry.get("phenomenon_class") == phenomenon_class
    ]
    expected_counts = (
        MAGNETIC_CLASS_COUNTS[phenomenon_class]
        if channel == "magnetic_internal"
        else EXPECTED_CLASS_COUNTS[phenomenon_class]
    )
    actual_counts = {
        relation: sum(entry.get("relation_type") == relation for entry in catalog)
        for relation in SCAFFOLD_RELATIONS.values()
    }
    if actual_counts != expected_counts:
        errors.append("scaffold_counts")
    if any(entry.get("relation_type") not in SCAFFOLD_RELATIONS.values() for entry in catalog):
        errors.append("scaffold_relation")
    expected_ids = (
        EXPECTED_MAGNETIC_CATALOG_IDS[element]
        if channel == "magnetic_internal"
        else EXPECTED_CATALOG_IDS.get(phenomenon_class)
    )
    if expected_ids is not None:
        actual_ids = {
            relation: tuple(
                entry.get("mechanic_id")
                for entry in catalog
                if entry.get("relation_type") == relation
            )
            for relation in SCAFFOLD_RELATIONS.values()
        }
        if actual_ids != expected_ids:
            errors.append(f"{phenomenon_class}_catalog_ids")
    if channel == "magnetic_internal":
        expected_prefix = f"{element.lower()}_magnetic_"
        if any(
            not isinstance(entry.get("mechanic_id"), str)
            or not entry["mechanic_id"].startswith(expected_prefix)
            for entry in catalog
        ):
            errors.append("magnetic_namespace")
    return errors


def _semantic_transition_errors(document: dict[str, Any]) -> list[str]:
    errors = []
    for element, channel, entry in _all_entries(document):
        if not isinstance(entry, dict):
            continue
        mechanic_id = entry.get("mechanic_id")
        if mechanic_id in EXPECTED_SEMANTIC_TRANSITIONS:
            if (
                (element, channel) != ("Earth", "electric_external")
                or entry.get("phenomenon_class") != "low_entropy"
                or entry.get("semantic_transition")
                != EXPECTED_SEMANTIC_TRANSITIONS[mechanic_id]
            ):
                errors.append(f"{element}:{channel}:{mechanic_id}")
        elif "semantic_transition" in entry:
            errors.append(f"{element}:{channel}:{mechanic_id}:unexpected")
    return errors


def _cross_registry_binding_failures(elements: list[dict[str, Any]]) -> list[str]:
    failures = []
    for item in elements:
        element = item.get("element")
        expected = EXPECTED_BINDINGS.get(element)
        if expected is None:
            continue
        for key in ("school_ref", "scale_map_ref"):
            if item.get(key) != expected[key]:
                failures.append(f"{element}:{key}")
        if element == "Quintessence":
            if item.get("engine_interface_ref") != expected["engine_interface_ref"]:
                failures.append("Quintessence:engine_interface_ref")
            continue
        if item.get("transition_refs") != expected["transition_refs"]:
            failures.append(f"{element}:transition_refs")
        if item.get("polarity_bindings") != expected["polarity_bindings"]:
            failures.append(f"{element}:polarity_bindings")
    return failures


def _has_forbidden_relation_key(value: Any) -> bool:
    if isinstance(value, dict):
        return any(key in FORBIDDEN_RELATIONS for key in value) or any(
            _has_forbidden_relation_key(item) for item in value.values()
        )
    if isinstance(value, list):
        return any(_has_forbidden_relation_key(item) for item in value)
    return False


def _instrumentation_errors(document: dict[str, Any]) -> list[str]:
    mechanic_ids = {
        entry.get("mechanic_id")
        for _, _, entry in _all_entries(document)
        if isinstance(entry, dict)
    }
    errors = [
        f"instrumentation:{mechanic_id}"
        for mechanic_id in sorted(mechanic_ids & INSTRUMENTATION_MECHANIC_IDS)
    ]
    errors.extend(
        f"kinetics:{mechanic_id}"
        for mechanic_id in sorted(mechanic_ids & KINETICS_RESERVED_MECHANIC_IDS)
    )
    return errors


def _semantic_rejection_code(document: dict[str, Any]) -> str | None:
    metadata = document.get("metadata", {})
    if (
        metadata.get("physical_quantity_claim") is not False
        or metadata.get("no_electromagnetic_equivalence") is not True
        or metadata.get("no_thermodynamic_equivalence_with_kappa_court") is not True
    ):
        return "physical_claim_invalid"
    if document.get("admission_boundary", {}).get("writes_court_pole_disposition") is not False:
        return "boundary_write_invalid"

    elements = document.get("elements", [])
    if len(elements) != 5 or [item.get("element") for item in elements] != [
        "Fire",
        "Air",
        "Water",
        "Earth",
        "Quintessence",
    ]:
        return "element_count_invalid"
    if _framework_errors(document):
        return "framework_invalid"

    mercury = elements[-1]
    if (
        mercury.get("is_binary_court_pole") is not False
        or mercury.get("court_pole_index") is not None
        or mercury.get("register_membership") != "excluded"
        or "transition_refs" in mercury
        or "polarity_bindings" in mercury
        or set(mercury.get("capabilities", {}))
        != {"engine_interface", "electric_external", "magnetic_internal"}
    ):
        return "mercury_exclusion_invalid"

    layout_errors = _array_layout_errors(document)
    if layout_errors:
        return "capability_array_invalid"

    for item in elements:
        element = item["element"]
        if item.get("governor") != EXPECTED_GOVERNORS[element]:
            return "governor_mismatch"
        if item.get("scale_id") != EXPECTED_SCALE_IDS[element]:
            return "scale_map_replay_mismatch"
        if element != "Quintessence":
            bindings = item.get("polarity_bindings", {})
            if (
                bindings.get("electric_external", {}).get("polarity_bit") != 0
                or bindings.get("magnetic_internal", {}).get("polarity_bit") != 1
            ):
                return "polarity_bit_mismatch"
            expected_bindings = EXPECTED_BINDINGS[element]["polarity_bindings"]
            if (
                bindings.get("electric_external", {}).get("zodiac")
                != expected_bindings["electric_external"]["zodiac"]
                or bindings.get("magnetic_internal", {}).get("zodiac")
                != expected_bindings["magnetic_internal"]["zodiac"]
            ):
                return "zodiac_mismatch"

    if _has_forbidden_relation_key(document):
        return "forbidden_relation"
    entry_errors = _entry_errors(document)
    if entry_errors:
        return "rich_entry_invalid"
    mechanic_ids = [entry["mechanic_id"] for _, _, entry in _all_entries(document)]
    if len(mechanic_ids) != len(set(mechanic_ids)):
        return "duplicate_id_rejected"
    instrumentation_errors = _instrumentation_errors(document)
    if any(error.startswith("instrumentation:") for error in instrumentation_errors):
        return "instrumentation_term_forbidden"
    if any(error.startswith("kinetics:") for error in instrumentation_errors):
        return "kinetics_term_forbidden"
    if _cross_registry_binding_failures(elements):
        return "cross_registry_binding_mismatch"
    if _class_placement_errors(document):
        return "phenomenon_class_placement_invalid"
    if _semantic_transition_errors(document):
        return "semantic_transition_invalid"
    if _action_errors(document):
        return "authored_contract_mismatch"
    if any(
        _catalog_errors(document, element, channel, phenomenon_class)
        for phenomenon_class, placements in POPULATED_CLASS_PLACEMENTS.items()
        for element, channel in placements
    ):
        return "glossary_catalog_invalid"
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


def _low_entry(document: dict[str, Any]) -> dict[str, Any]:
    water = _element(document, "Water")
    return next(
        entry
        for entry in _entries(water, "electric_external")
        if entry.get("phenomenon_class") == "low_enthalpy"
    )


def _low_entropy_entry(document: dict[str, Any]) -> dict[str, Any]:
    earth = _element(document, "Earth")
    return next(
        entry
        for entry in _entries(earth, "electric_external")
        if entry.get("phenomenon_class") == "low_entropy"
    )


def _equilibrium_entry(document: dict[str, Any]) -> dict[str, Any]:
    mercury = _element(document, "Quintessence")
    return next(
        entry
        for entry in _entries(mercury, "electric_external")
        if entry.get("phenomenon_class") == "equilibrium"
    )


def _mutated_cases(document: dict[str, Any]) -> dict[str, dict[str, Any]]:
    cases: dict[str, dict[str, Any]] = {}

    tampered = deepcopy(document)
    _element(tampered, "Air")["scale_id"] = 667
    cases["wrong-scale-id"] = tampered

    tampered = deepcopy(document)
    mercury = _element(tampered, "Quintessence")
    mercury["capabilities"] = deepcopy(_element(tampered, "Fire")["capabilities"])
    mercury["polarity_bindings"] = deepcopy(_element(tampered, "Fire")["polarity_bindings"])
    mercury["is_binary_court_pole"] = True
    mercury["court_pole_index"] = 2
    mercury["register_membership"] = "included"
    cases["mercury-with-polarity"] = tampered

    tampered = deepcopy(document)
    tampered["metadata"]["physical_quantity_claim"] = True
    cases["physical-claim-true"] = tampered

    tampered = deepcopy(document)
    tampered["admission_boundary"]["writes_court_pole_disposition"] = True
    cases["court-write-boundary"] = tampered

    tampered = deepcopy(document)
    _entries(_element(tampered, "Fire"), "electric_external")[0]["SETS_COURT_POLE"] = "C1"
    cases["forbidden-relation-injected"] = tampered

    tampered = deepcopy(document)
    _entries(_element(tampered, "Water"), "magnetic_internal")[0]["mechanic_id"] = "explosive_emission"
    cases["duplicate-mechanic-id"] = tampered

    tampered = deepcopy(document)
    _element(tampered, "Earth")["polarity_bindings"]["electric_external"]["polarity_bit"] = 1
    cases["wrong-polarity-bit"] = tampered

    tampered = deepcopy(document)
    _element(tampered, "Air")["governor"] = "Mars"
    cases["wrong-governor"] = tampered

    tampered = deepcopy(document)
    _element(tampered, "Fire")["polarity_bindings"]["electric_external"]["zodiac"] = "Scorpio"
    cases["zodiac-swapped"] = tampered

    tampered = deepcopy(document)
    extra = deepcopy(_element(tampered, "Fire"))
    extra["element"] = "Wood"
    tampered["elements"].append(extra)
    cases["sixth-element"] = tampered

    tampered = deepcopy(document)
    _element(tampered, "Fire")["school_ref"] = "fivefold.capability_school.air"
    cases["school-ref-swapped"] = tampered

    tampered = deepcopy(document)
    _element(tampered, "Fire")["scale_map_ref"] = EXPECTED_BINDINGS["Air"]["scale_map_ref"]
    cases["scale-map-ref-tampered"] = tampered

    tampered = deepcopy(document)
    _element(tampered, "Fire")["polarity_bindings"]["electric_external"]["transition_ref"] = "court_retreat_C2_to_C1"
    cases["binding-transition-swapped"] = tampered

    tampered = deepcopy(document)
    _entries(_element(tampered, "Water"), "magnetic_internal")[0]["definition"] += " Drift."
    cases["capability-definition-drift"] = tampered

    tampered = deepcopy(document)
    _element(tampered, "Quintessence")["transition_refs"] = [
        "court_advance_C0_to_C1",
        "court_retreat_C1_to_C0",
    ]
    cases["mercury-transition-injected"] = tampered

    tampered = deepcopy(document)
    _element(tampered, "Air")["phenomenon_categories"] = {}
    cases["legacy-category-injected"] = tampered

    tampered = deepcopy(document)
    fire = _element(tampered, "Fire")
    high_entry = fire["capabilities"]["electric_external"].pop(1)
    fire["capabilities"]["magnetic_internal"].append(high_entry)
    cases["fire-glossary-in-magnetic"] = tampered

    tampered = deepcopy(document)
    _entries(_element(tampered, "Fire"), "magnetic_internal")[1][
        "mechanic_id"
    ] = "fire_magnetic_unlisted_entry"
    cases["magnetic-catalog-id-substituted"] = tampered

    tampered = deepcopy(document)
    water = _element(tampered, "Water")
    low_entry = water["capabilities"]["electric_external"].pop(1)
    water["capabilities"]["magnetic_internal"].append(low_entry)
    cases["water-glossary-in-magnetic"] = tampered

    tampered = deepcopy(document)
    earth = _element(tampered, "Earth")
    low_entropy_entry = earth["capabilities"]["electric_external"].pop(1)
    earth["capabilities"]["magnetic_internal"].append(low_entropy_entry)
    cases["earth-glossary-in-magnetic"] = tampered

    tampered = deepcopy(document)
    mercury = _element(tampered, "Quintessence")
    mercury["capabilities"]["engine_interface"].append(
        mercury["capabilities"]["electric_external"].pop(0)
    )
    cases["mercury-equilibrium-in-engine-interface"] = tampered

    tampered = deepcopy(document)
    mercury = _element(tampered, "Quintessence")
    mercury["capabilities"]["magnetic_internal"].append(
        mercury["capabilities"]["electric_external"].pop(0)
    )
    cases["mercury-equilibrium-in-magnetic"] = tampered

    tampered = deepcopy(document)
    del _low_entry(tampered)["phenomenon_class"]
    cases["missing-phenomenon-class"] = tampered

    tampered = deepcopy(document)
    del _equilibrium_entry(tampered)["phenomenon_class"]
    cases["missing-equilibrium-phenomenon-class"] = tampered

    tampered = deepcopy(document)
    _low_entry(tampered)["phenomenon_class"] = "high_entropy"
    cases["water-glossary-wrong-class"] = tampered

    tampered = deepcopy(document)
    _low_entropy_entry(tampered)["phenomenon_class"] = "high_entropy"
    cases["earth-glossary-wrong-class"] = tampered

    tampered = deepcopy(document)
    _equilibrium_entry(tampered)["phenomenon_class"] = "high_entropy"
    cases["equilibrium-glossary-wrong-class"] = tampered

    tampered = deepcopy(document)
    dielectric_breakdown = next(
        entry
        for entry in _entries(_element(tampered, "Earth"), "electric_external")
        if entry["mechanic_id"] == "dielectric_breakdown"
    )
    del dielectric_breakdown["semantic_transition"]
    cases["missing-earth-semantic-transition"] = tampered

    tampered = deepcopy(document)
    _low_entropy_entry(tampered)["semantic_transition"] = SEMANTIC_TRANSITION_VALUE
    cases["unexpected-semantic-transition"] = tampered

    tampered = deepcopy(document)
    _element(tampered, "Fire")["capabilities"]["electric_external"].append(
        {
            "mechanic_id": "shock_tube",
            "definition": "Injected instrumentation term.",
            "relation_type": "transfers",
            "value": "instrumentation",
            "phenomenon_class": "high_enthalpy",
            "source_class": "authored_capability",
        }
    )
    cases["instrumentation-term-injected"] = tampered

    tampered = deepcopy(document)
    _element(tampered, "Fire")["capabilities"]["electric_external"].append(
        {
            "mechanic_id": "finite_rate_chemistry",
            "definition": "Injected Kinetics term.",
            "relation_type": "transforms",
            "value": "kinetics",
            "phenomenon_class": "high_enthalpy",
            "source_class": "authored_capability",
        }
    )
    cases["kinetics-term-injected"] = tampered

    tampered = deepcopy(document)
    _low_entry(tampered)["mechanic_id"] = "explosive_emission"
    cases["glossary-duplicate-id"] = tampered

    return cases


def _adversarial_results(document: dict[str, Any]) -> dict[str, str]:
    results = {}
    for case_id, mutated in _mutated_cases(document).items():
        try:
            verify_registry_document(mutated)
        except MechanicsThermodynamicsValidationError as error:
            results[case_id] = error.reason_code
        else:
            results[case_id] = "accepted_invalid_registry"
    return results


def _report_shape_valid(report: dict[str, Any]) -> bool:
    try:
        jsonschema.Draft202012Validator(_read_json(REPORT_SCHEMA_PATH)).validate(report)
    except jsonschema.ValidationError:
        return False
    checks = report.get("checks", [])
    failed = sum(check.get("status") == "FAIL" for check in checks)
    core = {key: value for key, value in report.items() if key != "reportFingerprint"}
    return (
        tuple(check.get("checkId") for check in checks) == REPORT_CHECK_IDS
        and report.get("checksPassed") == len(checks) - failed
        and report.get("checksFailed") == failed
        and report.get("verdict") == ("FAIL" if failed else "PASS")
        and report.get("reportFingerprint") == _sha256_payload(core)
    )


def validate(document: dict[str, Any]) -> dict[str, Any]:
    checks: list[dict[str, Any]] = []

    def record(
        check_id: str,
        passed: bool,
        diagnostic: Any,
        locator: str,
        expected: Any = None,
        actual: Any = None,
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

    try:
        jsonschema.Draft202012Validator(_read_json(SCHEMA_PATH)).validate(document)
        schema_valid, schema_diagnostic = True, "valid"
    except jsonschema.ValidationError as error:
        schema_valid, schema_diagnostic = False, error.message
    metadata = document["metadata"]
    record(
        "mtr-v2-schema-identity",
        schema_valid
        and metadata.get("registry_id") == "mechanics_thermodynamics_registry"
        and metadata.get("version") == "2.0.0",
        schema_diagnostic,
        str(SCHEMA_PATH),
    )
    boundary = document["admission_boundary"]
    record(
        "mtr-v2-admission-boundary",
        all(
            boundary.get(key) is False
            for key in (
                "runtime_effect",
                "graph_effect",
                "policy_effect",
                "ledger_effect",
                "admission_effect",
                "writes_court_pole_disposition",
            )
        )
        and boundary.get("kappa_court_access") == "read_only_replay"
        and boundary.get("global_ch_access") == "no_write",
        boundary,
        str(REGISTRY_PATH) + "#admission_boundary",
    )
    elements = document["elements"]
    record(
        "mtr-v2-element-coverage",
        [item["element"] for item in elements]
        == ["Fire", "Air", "Water", "Earth", "Quintessence"],
        [item["element"] for item in elements],
        str(REGISTRY_PATH) + "#elements",
    )
    layout_errors = _array_layout_errors(document) + _entry_errors(document)
    record(
        "mtr-v2-direct-capability-arrays",
        not layout_errors,
        layout_errors,
        str(REGISTRY_PATH) + "#elements",
        {
            "requiredEntryKeys": sorted(RICH_ENTRY_REQUIRED_KEYS),
            "optionalEntryKeys": sorted(RICH_ENTRY_OPTIONAL_KEYS),
            "noPhenomenonCategories": True,
        },
        {item["element"]: list(item["capabilities"]) for item in elements},
    )
    for check_id, phenomenon_class in (
        ("mtr-v2-high-enthalpy-fire-population", "high_enthalpy"),
        ("mtr-v2-high-entropy-air-population", "high_entropy"),
        ("mtr-v2-low-enthalpy-water-population", "low_enthalpy"),
        ("mtr-v2-low-entropy-earth-population", "low_entropy"),
        ("mtr-v2-equilibrium-mercury-population", "equilibrium"),
    ):
        placements = POPULATED_CLASS_PLACEMENTS[phenomenon_class]
        catalog_errors = [
            f"{element}:{channel}:{error}"
            for element, channel in placements
            for error in _catalog_errors(document, element, channel, phenomenon_class)
        ]
        transition_errors = (
            _semantic_transition_errors(document)
            if phenomenon_class == "low_entropy"
            else []
        )
        expected_counts = {
            f"{element}.{channel}": (
                MAGNETIC_CLASS_COUNTS[phenomenon_class]
                if channel == "magnetic_internal"
                else EXPECTED_CLASS_COUNTS[phenomenon_class]
            )
            for element, channel in placements
        }
        actual_counts = {}
        for element, channel in placements:
            catalog = [
                entry
                for entry in _entries(_element(document, element), channel)
                if entry.get("phenomenon_class") == phenomenon_class
            ]
            actual_counts[f"{element}.{channel}"] = {
                relation: sum(entry["relation_type"] == relation for entry in catalog)
                for relation in SCAFFOLD_RELATIONS.values()
            }
        record(
            check_id,
            not catalog_errors
            and not transition_errors
            and not _class_placement_errors(document),
            catalog_errors + transition_errors,
            str(REGISTRY_PATH) + "#elements",
            expected_counts,
            actual_counts,
        )
    crt350 = _load_crt350()
    scale_map = {
        item["element"].split(" (")[1].rstrip(")"): item["ian_ring_id"]
        for item in crt350["scale_bindings"]
    }
    scale_failures = [
        item["element"]
        for item in elements
        if item["scale_id"] != scale_map.get(item["governor"])
    ]
    record(
        "mtr-v2-scale-map-replay",
        not scale_failures,
        scale_failures,
        CRT350_PATH + "#scale_bindings",
        EXPECTED_SCALE_IDS,
        {item["element"]: item["scale_id"] for item in elements},
    )
    binding_failures = []
    for item in elements[:-1]:
        bindings = item["polarity_bindings"]
        if (
            bindings["electric_external"]["polarity_bit"] != 0
            or bindings["magnetic_internal"]["polarity_bit"] != 1
        ):
            binding_failures.append(item["element"])
    record(
        "mtr-v2-polarity-binding-replay",
        not binding_failures,
        binding_failures,
        str(REGISTRY_PATH) + "#elements.polarity_bindings",
        {"electric": 0, "magnetic": 1},
        binding_failures,
    )
    facet_ids = {
        item["facetId"]
        for item in _load_crt347()["zodiacFacets"] + _load_crt347()["systemLevelFacets"]
    }
    zodiac_failures = [
        f"{item['element']}:{channel}"
        for item in elements[:-1]
        for channel in ("electric_external", "magnetic_internal")
        if item["polarity_bindings"][channel]["zodiac_facet_ref"] not in facet_ids
    ]
    record(
        "mtr-v2-zodiac-facet-refs",
        not zodiac_failures,
        zodiac_failures,
        CRT347_PATH + "#zodiacFacets",
    )
    mercury = elements[-1]
    mercury_ok = (
        mercury.get("is_binary_court_pole") is False
        and mercury.get("court_pole_index") is None
        and mercury.get("register_membership") == "excluded"
        and set(mercury["capabilities"])
        == {"engine_interface", "electric_external", "magnetic_internal"}
        and "polarity_bindings" not in mercury
        and "transition_refs" not in mercury
    )
    record(
        "mtr-v2-mercury-exclusion",
        mercury_ok,
        mercury,
        str(REGISTRY_PATH) + "#elements[Quintessence]",
    )
    crt349 = _load_crt349()
    transition_ids = {item["transition_id"] for item in crt349["transitions"]}
    engine_ids = {item["interface_id"] for item in crt349["engine_interface"]}
    ref_failures = _cross_registry_binding_failures(elements)
    for item in elements[:-1]:
        for transition in item["transition_refs"]:
            if transition not in transition_ids:
                ref_failures.append(f"{item['element']}:{transition}")
        for binding in item["polarity_bindings"].values():
            if binding["transition_ref"] not in transition_ids:
                ref_failures.append(f"{item['element']}:{binding['transition_ref']}")
    if mercury["engine_interface_ref"] not in engine_ids:
        ref_failures.append("Quintessence:engine_interface_ref")
    record(
        "mtr-v2-cross-registry-refs",
        not ref_failures,
        ref_failures,
        CRT349_PATH,
    )
    physics_ok = (
        metadata.get("physical_quantity_claim") is False
        and metadata.get("no_electromagnetic_equivalence") is True
        and metadata.get("no_thermodynamic_equivalence_with_kappa_court") is True
        and metadata.get("architecture", {}).get("authored_game_mechanics_not_physics") is True
    )
    record(
        "mtr-v2-physics-guard",
        physics_ok,
        "authored game mechanics, no physics claim",
        str(REGISTRY_PATH) + "#metadata",
    )
    instrumentation_errors = _instrumentation_errors(document)
    record(
        "mtr-v2-instrumentation-separation",
        not instrumentation_errors,
        instrumentation_errors,
        str(REGISTRY_PATH) + "#framework.instrumentation_registry",
    )
    record(
        "mtr-v2-forbidden-relations",
        not _has_forbidden_relation_key(document),
        "no executable Court relation keys",
        str(REGISTRY_PATH) + "#elements",
    )
    relation_types = {
        entry["relation_type"] for _, _, entry in _all_entries(document) if isinstance(entry, dict)
    }
    record(
        "mtr-v2-relation-vocabulary",
        relation_types <= AUTHORED_RELATION_VOCABULARY,
        sorted(relation_types),
        str(REGISTRY_PATH) + "#elements",
        sorted(AUTHORED_RELATION_VOCABULARY),
        sorted(relation_types),
    )
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
    guard_ids = {item["guard_id"] for item in document["guards"]}
    record(
        "mtr-v2-guard-closure",
        guard_ids == expected_guards and len(document["guards"]) == 11,
        sorted(guard_ids),
        str(REGISTRY_PATH) + "#guards",
    )
    authoring_fingerprint = _sha256_payload(_authoring_payload(document))
    record(
        "mtr-v2-determinism",
        _canonical_bytes(document) == _canonical_bytes(_load_registry())
        and authoring_fingerprint == EXPECTED_AUTHORING_FINGERPRINT,
        {"authoring": authoring_fingerprint},
        str(REGISTRY_PATH),
        EXPECTED_AUTHORING_FINGERPRINT,
        authoring_fingerprint,
    )
    adversarial = _adversarial_results(document)
    record(
        "mtr-v2-adversarial-rejection",
        adversarial == EXPECTED_MUTATION_CODES,
        adversarial,
        str(REGISTRY_PATH),
        EXPECTED_MUTATION_CODES,
        adversarial,
    )
    failures = [check for check in checks if check["status"] == "FAIL"]
    report_core = {
        "checks": checks,
        "checksFailed": len(failures),
        "checksPassed": len(checks) - len(failures),
        "registryId": "mechanics_thermodynamics_registry",
        "registryVersion": "2.0.0",
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
