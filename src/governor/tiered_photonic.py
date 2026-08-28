"""Root-owned GOV-2XX tiered photonic sidecar over the Z7 office ring.

The candidate is derived from its six declared sources.  In particular, the
office wavelengths, A1/A2 anchors, construction provenance, physical
constants, C_H guard, and theorem binding are never maintained as local copies.
"""

from __future__ import annotations

from collections import defaultdict
from copy import deepcopy
import hashlib
import json
import math
from pathlib import Path
from typing import Any, Mapping

import yaml

from .hashing import canonical_json_bytes, sha256_payload


CANDIDATE_ID = "CH_TIERED_v1"
COORDINATE_ID = "photonic.tiered_v1"
RELEASE_ID = "tiered-photonic-candidate:CH_TIERED_v1:1.0.0"
SCHEMA_VERSION = "gov-2xx.tiered-photonic-candidate-release.v1"
ALGORITHM_VERSION = "gov-2xx.tiered-photonic-K-convolution.v1"
STORY_ID = "GOV-2XX"
SCOPE_TIERS = ("A1", "A2")
VARIANTS = ("sum_mixing", "geometric_mean")

SOURCE_BINDING_SPECS = (
    (
        "canonical-heptatonic-ledger",
        "canonical/universal-heptatonic-ledger.json",
        "authoritative_state_identity",
    ),
    (
        "canonical-network-data",
        "canonical/universal-network-data.json",
        "construction_edges_K_kernel",
    ),
    (
        "governor-registry",
        "schemas/governors.yaml",
        "A0_wavelength_source",
    ),
    (
        "photonic-records",
        "seven-governors-canonical-feature-profile-registry-v0.1.1/canonical/photonic-records.json",
        "physical_constants_and_C_P_convention",
    ),
    (
        "global-C_H-guard",
        "seven-governors-harmonic-invariants-v0.1.0/canonical/compression-namespace-guard.json",
        "global_namespace_boundary",
    ),
    (
        "tiered-photonic-theorem",
        "docs/TIERED_PHOTONIC_THEOREM.md",
        "scoped_research_theorem",
    ),
)


class TieredPhotonicError(ValueError):
    """Raised when a tiered-photonic source or invariant fails."""


def _file_sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _read_json(path: Path) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise TieredPhotonicError(f"invalid_json_source:{path}") from exc


def _read_yaml(path: Path) -> Any:
    try:
        return yaml.safe_load(path.read_text(encoding="utf-8"))
    except (OSError, yaml.YAMLError) as exc:
        raise TieredPhotonicError(f"invalid_yaml_source:{path}") from exc


def _is_finite_number(value: Any) -> bool:
    return (
        isinstance(value, (int, float))
        and not isinstance(value, bool)
        and math.isfinite(value)
    )


def _source_paths(root: Path) -> dict[str, Path]:
    return {
        binding_id: root / relative_path
        for binding_id, relative_path, _ in SOURCE_BINDING_SPECS
    }


def _office_order(network: Any) -> tuple[str, ...]:
    if not isinstance(network, Mapping):
        raise TieredPhotonicError("network_source_must_be_object")
    order = network.get("officeOrder")
    if (
        not isinstance(order, list)
        or len(order) != 7
        or any(not isinstance(office, str) or not office for office in order)
        or len(set(order)) != 7
    ):
        raise TieredPhotonicError("invalid_network_office_order")
    return tuple(order)


def _a0_wavelengths(governors_document: Any, office_order: tuple[str, ...]) -> dict[str, float]:
    if not isinstance(governors_document, Mapping):
        raise TieredPhotonicError("governor_registry_must_be_object")
    governors = governors_document.get("governors")
    if not isinstance(governors, Mapping):
        raise TieredPhotonicError("governor_registry_missing_governors")

    wavelengths: dict[str, float] = {}
    for governor in governors.values():
        if not isinstance(governor, Mapping):
            raise TieredPhotonicError("invalid_governor_registry_entry")
        office = governor.get("display_name")
        if office not in office_order:
            continue
        canonical_expression = governor.get("canonical_expression")
        if not isinstance(canonical_expression, Mapping):
            raise TieredPhotonicError(f"missing_canonical_expression:{office}")
        wavelength = canonical_expression.get("wavelength_nm")
        if not _is_finite_number(wavelength):
            raise TieredPhotonicError(f"invalid_A0_wavelength:{office}")
        if office in wavelengths:
            raise TieredPhotonicError(f"duplicate_A0_wavelength:{office}")
        if not 400.0 <= float(wavelength) <= 700.0:
            raise TieredPhotonicError(f"A0_wavelength_out_of_range:{office}")
        wavelengths[office] = float(wavelength)

    if set(wavelengths) != set(office_order):
        raise TieredPhotonicError("incomplete_A0_wavelength_source")
    return {office: wavelengths[office] for office in office_order}


def _ledger_index(ledger: Any) -> dict[int, Mapping[str, Any]]:
    if not isinstance(ledger, list):
        raise TieredPhotonicError("ledger_source_must_be_array")
    by_id: dict[int, Mapping[str, Any]] = {}
    for record in ledger:
        if not isinstance(record, Mapping):
            raise TieredPhotonicError("invalid_ledger_record")
        state_id = record.get("id")
        if not isinstance(state_id, int) or isinstance(state_id, bool):
            raise TieredPhotonicError("invalid_ledger_state_id")
        if state_id in by_id:
            raise TieredPhotonicError(f"duplicate_ledger_state_id:{state_id}")
        by_id[state_id] = record
    return by_id


def _anchors_from_ledger(
    ledger: list[Any], office_order: tuple[str, ...]
) -> tuple[list[dict[str, Any]], list[str]]:
    office_index = {office: index for index, office in enumerate(office_order)}
    anchors: list[dict[str, Any]] = []
    for record in ledger:
        if not isinstance(record, Mapping):
            raise TieredPhotonicError("invalid_ledger_record")
        if record.get("role") != "anchor" or record.get("tier") not in SCOPE_TIERS:
            continue
        state_id = record.get("id")
        name = record.get("name")
        office = record.get("office")
        tier = record.get("tier")
        forte = record.get("forte")
        if not isinstance(state_id, int) or isinstance(state_id, bool):
            raise TieredPhotonicError("invalid_anchor_state_id")
        if not isinstance(name, str) or not name:
            raise TieredPhotonicError(f"invalid_anchor_name:{state_id}")
        if office not in office_index:
            raise TieredPhotonicError(f"invalid_anchor_office:{state_id}")
        if record.get("officeIndex") != office_index[office]:
            raise TieredPhotonicError(f"anchor_office_index_mismatch:{state_id}")
        if not isinstance(forte, str) or not forte:
            raise TieredPhotonicError(f"invalid_anchor_forte:{state_id}")
        anchors.append(
            {
                "stateId": state_id,
                "name": name,
                "office": office,
                "tier": tier,
                "forte": forte,
            }
        )

    if len(anchors) != len(SCOPE_TIERS) * len(office_order):
        raise TieredPhotonicError("tiered_anchor_count_mismatch")
    families: list[str] = []
    for tier in SCOPE_TIERS:
        tier_anchors = [anchor for anchor in anchors if anchor["tier"] == tier]
        if len(tier_anchors) != len(office_order):
            raise TieredPhotonicError(f"tiered_anchor_count_mismatch:{tier}")
        if {anchor["office"] for anchor in tier_anchors} != set(office_order):
            raise TieredPhotonicError(f"tiered_anchor_office_coverage_mismatch:{tier}")
        tier_families = {anchor["forte"] for anchor in tier_anchors}
        if len(tier_families) != 1:
            raise TieredPhotonicError(f"tiered_anchor_family_mismatch:{tier}")
        families.append(next(iter(tier_families)))

    anchors.sort(
        key=lambda anchor: (
            SCOPE_TIERS.index(anchor["tier"]),
            office_index[anchor["office"]],
        )
    )
    return anchors, families


def _neighbor_offices(office_order: tuple[str, ...], office: str) -> tuple[str, str]:
    index = office_order.index(office)
    return office_order[(index - 1) % len(office_order)], office_order[
        (index + 1) % len(office_order)
    ]


def _construction_provenance(
    network: Any,
    ledger_by_id: Mapping[int, Mapping[str, Any]],
    anchors: list[dict[str, Any]],
    office_order: tuple[str, ...],
) -> dict[int, dict[str, list[Any]]]:
    if not isinstance(network, Mapping):
        raise TieredPhotonicError("network_source_must_be_object")
    structural_edges = network.get("structuralEdges")
    if not isinstance(structural_edges, list):
        raise TieredPhotonicError("network_missing_structural_edges")

    anchors_by_id = {anchor["stateId"]: anchor for anchor in anchors}
    incoming: dict[int, list[Mapping[str, Any]]] = defaultdict(list)
    for edge in structural_edges:
        if not isinstance(edge, Mapping):
            raise TieredPhotonicError("invalid_structural_edge")
        target = edge.get("target")
        if edge.get("type") == "CONSTRUCTS" and target in anchors_by_id:
            incoming[target].append(edge)

    provenance: dict[int, dict[str, list[Any]]] = {}
    prior_tier = {"A1": "A0", "A2": "A1"}
    office_index = {office: index for index, office in enumerate(office_order)}
    for anchor in anchors:
        state_id = anchor["stateId"]
        edges = incoming.get(state_id, [])
        if len(edges) != 2:
            raise TieredPhotonicError(f"construction_edge_count_mismatch:{state_id}")

        expected_parent_tier = prior_tier[anchor["tier"]]
        by_parent_office: dict[str, Mapping[str, Any]] = {}
        for edge in edges:
            edge_id = edge.get("id")
            parent_id = edge.get("source")
            if not isinstance(edge_id, str) or not edge_id.startswith("constructs:"):
                raise TieredPhotonicError(f"invalid_construction_edge_id:{state_id}")
            if not isinstance(parent_id, int) or isinstance(parent_id, bool):
                raise TieredPhotonicError(f"invalid_construction_edge_parent:{state_id}")
            if edge.get("target") != state_id:
                raise TieredPhotonicError(f"construction_edge_target_mismatch:{state_id}")
            if (
                edge.get("auditTier") != expected_parent_tier
                or edge.get("relationTier") != expected_parent_tier
                or edge.get("selected") is not True
            ):
                raise TieredPhotonicError(f"construction_edge_tier_mismatch:{edge_id}")
            parent = ledger_by_id.get(parent_id)
            if parent is None:
                raise TieredPhotonicError(f"construction_parent_missing_from_ledger:{edge_id}")
            parent_office = parent.get("office")
            if (
                parent.get("role") != "anchor"
                or parent.get("tier") != expected_parent_tier
                or parent_office not in office_index
                or parent.get("officeIndex") != office_index[parent_office]
            ):
                raise TieredPhotonicError(f"invalid_construction_parent:{edge_id}")
            if parent_office in by_parent_office:
                raise TieredPhotonicError(f"duplicate_construction_parent_office:{state_id}")
            by_parent_office[parent_office] = edge

        left, right = _neighbor_offices(office_order, anchor["office"])
        if set(by_parent_office) != {left, right}:
            raise TieredPhotonicError(f"construction_ring_neighbors_mismatch:{state_id}")
        provenance[state_id] = {
            "parentStateIds": [
                by_parent_office[left]["source"],
                by_parent_office[right]["source"],
            ],
            "constructionEdgeIds": [
                by_parent_office[left]["id"],
                by_parent_office[right]["id"],
            ],
            "parentOffices": [left, right],
        }
    return provenance


def _physical_constants(
    photonic_document: Any,
    a0_wavelengths: Mapping[str, float],
    office_order: tuple[str, ...],
) -> dict[str, float]:
    if not isinstance(photonic_document, Mapping):
        raise TieredPhotonicError("photonic_records_source_must_be_object")
    records = photonic_document.get("records")
    if not isinstance(records, list):
        raise TieredPhotonicError("photonic_records_missing_records")

    records_by_office: dict[str, Mapping[str, Any]] = {}
    for record in records:
        if not isinstance(record, Mapping):
            raise TieredPhotonicError("invalid_photonic_record")
        office = record.get("office")
        if office not in a0_wavelengths:
            continue
        if office in records_by_office:
            raise TieredPhotonicError(f"duplicate_photonic_record:{office}")
        records_by_office[office] = record
    if set(records_by_office) != set(office_order):
        raise TieredPhotonicError("incomplete_photonic_record_source")

    source_names = {
        "speedOfLightMS": "speedOfLightMS",
        "planckJS": "planckConstantJS",
        "electronVoltJ": "electronVoltJ",
    }
    reference: dict[str, float] | None = None
    for office in office_order:
        record = records_by_office[office]
        if record.get("officeIndex") != office_order.index(office):
            raise TieredPhotonicError(f"photonic_office_index_mismatch:{office}")
        if record.get("coordinateSymbol") != "C_P":
            raise TieredPhotonicError(f"photonic_coordinate_mismatch:{office}")
        wavelength = record.get("representativeWavelengthNm")
        if not _is_finite_number(wavelength) or float(wavelength) != a0_wavelengths[office]:
            raise TieredPhotonicError(f"photonic_A0_wavelength_mismatch:{office}")
        calculation = record.get("calculation")
        constants = calculation.get("constants") if isinstance(calculation, Mapping) else None
        if not isinstance(constants, Mapping):
            raise TieredPhotonicError(f"missing_physical_constants:{office}")
        current = {
            candidate_name: float(constants.get(source_name))
            for candidate_name, source_name in source_names.items()
            if _is_finite_number(constants.get(source_name))
        }
        if len(current) != len(source_names) or any(value <= 0 for value in current.values()):
            raise TieredPhotonicError(f"invalid_physical_constants:{office}")
        if reference is None:
            reference = current
        elif current != reference:
            raise TieredPhotonicError("inconsistent_physical_constants")

    if reference is None:
        raise TieredPhotonicError("missing_physical_constants")
    return reference


def _global_guard(guard_document: Any) -> dict[str, Any]:
    if not isinstance(guard_document, Mapping):
        raise TieredPhotonicError("C_H_guard_source_must_be_object")
    guard = guard_document.get("compressionGuard")
    if not isinstance(guard, Mapping):
        raise TieredPhotonicError("C_H_guard_missing_compression_guard")
    forbidden = guard.get("forbiddenEquivalences")
    if (
        guard.get("namespace") != "harmonic.C_H"
        or guard.get("symbol") != "C_H"
        or guard.get("status") != "unresolved"
        or guard.get("value") is not None
        or not isinstance(guard.get("guardLiteral"), str)
        or not guard["guardLiteral"].strip()
        or not isinstance(forbidden, list)
        or not forbidden
        or any(not isinstance(value, str) or not value for value in forbidden)
    ):
        raise TieredPhotonicError("invalid_C_H_guard")
    return {
        "namespace": guard["namespace"],
        "status": guard["status"],
        "value": guard["value"],
        "guardLiteral": guard["guardLiteral"],
    }


def _validate_theorem(path: Path) -> None:
    try:
        theorem = path.read_text(encoding="utf-8")
    except OSError as exc:
        raise TieredPhotonicError("tiered_photonic_theorem_missing") from exc
    required_markers = (
        "# Tiered Photonic Constants Theorem",
        STORY_ID,
        CANDIDATE_ID,
        COORDINATE_ID,
    )
    if not theorem.strip() or any(marker not in theorem for marker in required_markers):
        raise TieredPhotonicError("tiered_photonic_theorem_identity_mismatch")


def _source_bindings(paths: Mapping[str, Path]) -> list[dict[str, str]]:
    return [
        {
            "bindingId": binding_id,
            "path": relative_path,
            "sha256": _file_sha256(paths[binding_id]),
            "role": role,
        }
        for binding_id, relative_path, role in SOURCE_BINDING_SPECS
    ]


def _load_sources(root: Path, *, reverse_input: bool) -> dict[str, Any]:
    paths = _source_paths(root)
    ledger = _read_json(paths["canonical-heptatonic-ledger"])
    network = _read_json(paths["canonical-network-data"])
    governors = _read_yaml(paths["governor-registry"])
    photonic = _read_json(paths["photonic-records"])
    guard = _read_json(paths["global-C_H-guard"])
    _validate_theorem(paths["tiered-photonic-theorem"])

    if reverse_input:
        if not isinstance(ledger, list):
            raise TieredPhotonicError("ledger_source_must_be_array")
        ledger = list(reversed(ledger))
        if isinstance(network, Mapping) and isinstance(network.get("structuralEdges"), list):
            network = {
                **network,
                "structuralEdges": list(reversed(network["structuralEdges"])),
            }
        if isinstance(photonic, Mapping) and isinstance(photonic.get("records"), list):
            photonic = {**photonic, "records": list(reversed(photonic["records"]))}

    office_order = _office_order(network)
    a0_wavelengths = _a0_wavelengths(governors, office_order)
    ledger_by_id = _ledger_index(ledger)
    anchors, families = _anchors_from_ledger(ledger, office_order)
    provenance = _construction_provenance(network, ledger_by_id, anchors, office_order)
    constants = _physical_constants(photonic, a0_wavelengths, office_order)
    global_guard = _global_guard(guard)
    return {
        "a0WavelengthsNm": a0_wavelengths,
        "anchors": anchors,
        "constants": constants,
        "families": families,
        "globalGuard": global_guard,
        "officeOrder": office_order,
        "provenance": provenance,
        "sourceBindings": _source_bindings(paths),
    }


def _photonic_compression(wavelength_nm: float, a0_wavelengths: Mapping[str, float]) -> float:
    minimum = min(a0_wavelengths.values())
    maximum = max(a0_wavelengths.values())
    denominator = 1.0 / minimum - 1.0 / maximum
    if denominator <= 0:
        raise TieredPhotonicError("degenerate_A0_wavelength_range")
    return (1.0 / wavelength_nm - 1.0 / maximum) / denominator


def _physics_for_wavelength(
    wavelength_nm: float, constants: Mapping[str, float]
) -> dict[str, float]:
    frequency = constants["speedOfLightMS"] / (wavelength_nm * 1e-9)
    energy_j = constants["planckJS"] * frequency
    return {
        "vacuumFrequencyHz": frequency,
        "photonEnergyJ": energy_j,
        "photonEnergyEv": energy_j / constants["electronVoltJ"],
        "wavenumberPerM": 1.0 / (wavelength_nm * 1e-9),
        "wavenumberPerNm": 1.0 / wavelength_nm,
    }


def _build_derived_maps(
    office_order: tuple[str, ...],
    a0_wavelengths: Mapping[str, float],
    anchors: list[dict[str, Any]],
    provenance: Mapping[int, Mapping[str, list[Any]]],
) -> tuple[dict[str, float], dict[str, float], dict[str, float], dict[str, float]]:
    """Return A1/A2 sums and geometric means using source construction parents."""

    anchors_by_tier_office = {
        (anchor["tier"], anchor["office"]): anchor for anchor in anchors
    }

    def parent_offices(tier: str, office: str) -> list[str]:
        anchor = anchors_by_tier_office[(tier, office)]
        return provenance[anchor["stateId"]]["parentOffices"]

    nu_a0 = {office: 1.0 / wavelength for office, wavelength in a0_wavelengths.items()}
    nu_a1: dict[str, float] = {}
    lambda_a1_geom: dict[str, float] = {}
    for office in office_order:
        left, right = parent_offices("A1", office)
        nu_a1[office] = nu_a0[left] + nu_a0[right]
        lambda_a1_geom[office] = math.sqrt(a0_wavelengths[left] * a0_wavelengths[right])

    nu_a2: dict[str, float] = {}
    lambda_a2_geom: dict[str, float] = {}
    for office in office_order:
        left, right = parent_offices("A2", office)
        nu_a2[office] = nu_a1[left] + nu_a1[right]
        lambda_a2_geom[office] = math.sqrt(lambda_a1_geom[left] * lambda_a1_geom[right])
    return nu_a1, lambda_a1_geom, nu_a2, lambda_a2_geom


def _numeric_band(values: list[float]) -> list[float]:
    return [round(min(values), 2), round(max(values), 2)]


def _record_for_anchor(
    anchor: Mapping[str, Any],
    variant: str,
    derived_wavelength: float,
    parent_wavelengths: list[float],
    *,
    a0_wavelengths: Mapping[str, float],
    bands: Mapping[str, Mapping[str, list[float]]],
    constants: Mapping[str, float],
    provenance: Mapping[int, Mapping[str, list[Any]]],
) -> dict[str, Any]:
    physics = _physics_for_wavelength(derived_wavelength, constants)
    tier = anchor["tier"]
    if variant == "geometric_mean":
        compression: float | None = _photonic_compression(
            derived_wavelength, a0_wavelengths
        )
        band_metadata = {
            "numericBandNm": list(bands[variant][tier]),
            "hullPreserved": True,
            "beyondVisible": False,
            "renderingHint": "visible palette",
        }
        derivation_note = (
            "K-mean in ln lambda: lambda_t[k]=sqrt(lambda_{t-1}[k-1]*"
            "lambda_{t-1}[k+1]) — arithmetic mean in log-space, hull-preserving"
        )
    else:
        compression = None
        band_metadata = {
            "numericBandNm": list(bands[variant][tier]),
            "hullPreserved": False,
            "beyondVisible": True,
            "renderingHint": "luminance/grain/pulse for vacuum UV (invisible, strongly absorbed)",
            "extendedGamutNote": "UV-C 100-280, UV-B 280-315, UV-A 315-400, vacuum UV 10-200 per ISO 21348 — canonical bands numeric only; labels are Layer-4 prose",
        }
        derivation_note = (
            "K-sum in wavenumber: nu_t[k]=nu_{t-1}[k-1]+nu_{t-1}[k+1] "
            "(nu_hat=1/lambda_nm) — sum gives octave doubling "
            "Σν_t=2^t Σν0"
        )
    source_provenance = provenance[anchor["stateId"]]
    base = {
        "stateId": anchor["stateId"],
        "name": anchor["name"],
        "office": anchor["office"],
        "tier": tier,
        "forte": anchor["forte"],
        "variant": variant,
        "parentStateIds": list(source_provenance["parentStateIds"]),
        "constructionEdgeIds": list(source_provenance["constructionEdgeIds"]),
        "parentWavelengthsNm": parent_wavelengths,
        "derivedWavelengthNm": derived_wavelength,
        "derivedWavenumberPerNm": physics["wavenumberPerNm"],
        "derivedWavenumberPerM": physics["wavenumberPerM"],
        "derivedFrequencyHz": physics["vacuumFrequencyHz"],
        "derivedPhotonEnergyJ": physics["photonEnergyJ"],
        "derivedPhotonEnergyEv": physics["photonEnergyEv"],
        "photonicCompression": compression,
        "bandMetadata": band_metadata,
        "derivationNote": derivation_note,
        "channelIndependence": True,
        "interpretationPolicy": {
            "causationClaim": False,
            "physicalQuantityClaim": False,
            "tierClassifier": False,
            "globalCHNull": True,
            "note": "Derived photonic constants are authored informational sidecar; not C_P replacement, not C_H, not kappa_court, not thermodynamic; not a tier classifier.",
        },
    }
    return {**base, "recordFingerprint": sha256_payload(base)}


def build_tiered_photonic_candidate(
    *, root: Path, reverse_input: bool = False
) -> dict[str, Any]:
    sources = _load_sources(root, reverse_input=reverse_input)
    office_order = sources["officeOrder"]
    a0_wavelengths = sources["a0WavelengthsNm"]
    anchors = sources["anchors"]
    provenance = sources["provenance"]
    constants = sources["constants"]

    nu_a1, lambda_a1_geom, nu_a2, lambda_a2_geom = _build_derived_maps(
        office_order, a0_wavelengths, anchors, provenance
    )
    sum_a1_wavelengths = [1.0 / nu_a1[office] for office in office_order]
    sum_a2_wavelengths = [1.0 / nu_a2[office] for office in office_order]
    geom_a1_wavelengths = [lambda_a1_geom[office] for office in office_order]
    geom_a2_wavelengths = [lambda_a2_geom[office] for office in office_order]
    bands = {
        "sum_mixing": {
            "A1": _numeric_band(sum_a1_wavelengths),
            "A2": _numeric_band(sum_a2_wavelengths),
        },
        "geometric_mean": {
            "A1": _numeric_band(geom_a1_wavelengths),
            "A2": _numeric_band(geom_a2_wavelengths),
        },
    }

    records: list[dict[str, Any]] = []
    for anchor in anchors:
        tier = anchor["tier"]
        parent_offices = provenance[anchor["stateId"]]["parentOffices"]
        if tier == "A1":
            sum_parent_wavelengths = [
                a0_wavelengths[office] for office in parent_offices
            ]
            geometric_parent_wavelengths = list(sum_parent_wavelengths)
            sum_wavelength = 1.0 / nu_a1[anchor["office"]]
            geometric_wavelength = lambda_a1_geom[anchor["office"]]
        else:
            sum_parent_wavelengths = [
                1.0 / nu_a1[office] for office in parent_offices
            ]
            geometric_parent_wavelengths = [
                lambda_a1_geom[office] for office in parent_offices
            ]
            sum_wavelength = 1.0 / nu_a2[anchor["office"]]
            geometric_wavelength = lambda_a2_geom[anchor["office"]]
        records.append(
            _record_for_anchor(
                anchor,
                "sum_mixing",
                sum_wavelength,
                sum_parent_wavelengths,
                a0_wavelengths=a0_wavelengths,
                bands=bands,
                constants=constants,
                provenance=provenance,
            )
        )
        records.append(
            _record_for_anchor(
                anchor,
                "geometric_mean",
                geometric_wavelength,
                geometric_parent_wavelengths,
                a0_wavelengths=a0_wavelengths,
                bands=bands,
                constants=constants,
                provenance=provenance,
            )
        )

    sum_nu_a0 = sum(1.0 / wavelength for wavelength in a0_wavelengths.values())
    sum_nu_a1 = sum(nu_a1.values())
    sum_nu_a2 = sum(nu_a2.values())
    if (
        abs(sum_nu_a1 - 2.0 * sum_nu_a0) > 1e-12
        or abs(sum_nu_a2 - 2.0 * sum_nu_a1) > 1e-12
    ):
        raise TieredPhotonicError("mean_doubling_invariant_failed")

    global_guard = sources["globalGuard"]
    core: dict[str, Any] = {
        "schemaVersion": SCHEMA_VERSION,
        "releaseId": RELEASE_ID,
        "storyId": STORY_ID,
        "candidateId": CANDIDATE_ID,
        "coordinateId": COORDINATE_ID,
        "status": "admitted_informational_sidecar",
        "authority": "root_owned_informational_sidecar",
        "admissionEffect": "tiered_photonic_constants_only",
        "scope": {
            "selection": {
                "role": "anchor",
                "tiers": list(SCOPE_TIERS),
                "families": sources["families"],
            },
            "tuning": "12-TET",
            "rootConvention": "declared_root_normalized_to_pitch_class_0",
            "anchorStateCount": len(anchors),
            "recordCount": len(records),
            "variants": list(VARIANTS),
            "excluded": [
                "A0 source bindings (not derived)",
                "D1-D7 anchors",
                "satellites",
                "boundaries",
            ],
        },
        "method": {
            "algorithmVersion": ALGORITHM_VERSION,
            "constructionKernel": "K = delta_{-1} + delta_{+1} over Z7 office ring (adjacency of C7)",
            "channelBlindDerivation": True,
            "edgeFaithfulProvenance": True,
            "variantA": {
                "id": "sum_mixing",
                "domain": "wavenumber nu_hat = 1/lambda_nm",
                "formula": "nu_t[k] = nu_{t-1}[k-1] + nu_{t-1}[k+1]",
                "gamut": "extended vacuum UV",
                "numericBandA1Nm": list(bands["sum_mixing"]["A1"]),
                "numericBandA2Nm": list(bands["sum_mixing"]["A2"]),
                "meanDoublingProof": "Σν_t = 2^t Σν_0 because each office parents exactly two children",
                "octaveSemantics": "frequency doubling 2:1 = musical octave — photonic octaves A0 visible -> A1 UV -> A2 EUV",
                "hullPreserved": False,
            },
            "variantB": {
                "id": "geometric_mean",
                "domain": "ln lambda_nm (geometric mean = arithmetic mean in log)",
                "formula": "lambda_t[k] = sqrt(lambda_{t-1}[k-1] * lambda_{t-1}[k+1])",
                "gamut": "hull-preserving within "
                f"[{min(a0_wavelengths.values()):g},{max(a0_wavelengths.values()):g}]",
                "numericBandA1Nm": list(bands["geometric_mean"]["A1"]),
                "numericBandA2Nm": list(bands["geometric_mean"]["A2"]),
                "hullProof": "geometric mean stays in convex hull of A0 lambdas by AM>=GM",
                "hullPreserved": True,
            },
            "spectrumNote": "Over R spectrum of K is 2cos(2πj/7); K^7=2δ0 holds in char 7 as office-ring formal signature (same family as M^7=id), never as R identity",
            "officeOrder": list(office_order),
            "a0WavelengthsNm": a0_wavelengths,
            "a0WavenumbersPerNm": {
                office: 1.0 / wavelength
                for office, wavelength in a0_wavelengths.items()
            },
            "derivedWavenumbers": {"nu_A1": nu_a1, "nu_A2": nu_a2},
            "derivedGeometricLambdas": {
                "lambda_A1_geom": lambda_a1_geom,
                "lambda_A2_geom": lambda_a2_geom,
            },
            "sumDoubling": {
                "sumNuA0": sum_nu_a0,
                "sumNuA1": sum_nu_a1,
                "sumNuA2": sum_nu_a2,
                "ratioA1": sum_nu_a1 / sum_nu_a0,
                "ratioA2": sum_nu_a2 / sum_nu_a1,
            },
            "constants": constants,
            "officeChaldeanDegrees": {
                "Saturn": 1,
                "Jupiter": 2,
                "Mars": 3,
                "Sun": 4,
                "Venus": 5,
                "Mercury": 6,
                "Moon": 7,
            },
        },
        "sourceBindings": sources["sourceBindings"],
        "records": records,
        "invariants": {
            "recordCount": len(records),
            "anchorCount": len(anchors),
            "variantsPerAnchor": len(VARIANTS),
            "channelBlindDerivation": True,
            "edgeFaithfulProvenance": True,
            "meanDoubling": {
                "sumNuA0": sum_nu_a0,
                "sumNuA1": sum_nu_a1,
                "sumNuA2": sum_nu_a2,
            },
            "strictBands": {
                "sum_A1": list(bands["sum_mixing"]["A1"]),
                "sum_A2": list(bands["sum_mixing"]["A2"]),
                "geom_A1": list(bands["geometric_mean"]["A1"]),
                "geom_A2": list(bands["geometric_mean"]["A2"]),
            },
        },
        "negativeControls": {
            "inputDriftGuard": "declared source mutation must regenerate a distinct candidate or fail source validation",
        },
        "globalAggregate": global_guard,
        "interpretationPolicy": {
            "causationClaim": False,
            "physicalQuantityClaim": False,
            "tierClassifier": False,
            "globalCHNull": global_guard["value"] is None,
            "note": "Derived constants are authored informational sidecar; numeric bands only canonical; UV labels Layer-4 prose; not C_P replacement, not C_H, not kappa_court, not thermodynamic; not a tier classifier.",
        },
        "deferredWork": [
            "D1-D7 extension",
            "satellite/boundary evaluation",
            "photonic-to-harmonic correspondence",
            "true FM Bessel sideband (requires authored beta)",
        ],
    }
    return {**core, "candidateFingerprint": sha256_payload(core)}


def serialize_tiered_photonic_candidate(document: Mapping[str, Any]) -> bytes:
    return canonical_json_bytes(document)


def verify_tiered_photonic_candidate(document: Mapping[str, Any], *, root: Path) -> None:
    if not isinstance(document, Mapping):
        raise TieredPhotonicError("candidate_must_be_object")
    fingerprint = document.get("candidateFingerprint")
    core = {key: value for key, value in document.items() if key != "candidateFingerprint"}
    if fingerprint != sha256_payload(core):
        raise TieredPhotonicError("candidate_fingerprint_mismatch")
    expected = build_tiered_photonic_candidate(root=root)
    if canonical_json_bytes(document) != canonical_json_bytes(expected):
        raise TieredPhotonicError("candidate_does_not_match_fresh_build")


def tampered_copy(document: Mapping[str, Any]) -> dict[str, Any]:
    return deepcopy(document)
