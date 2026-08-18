#!/usr/bin/env python3
"""Build the CRT-347 Fivefold Capability Teleology planning-evidence sidecar."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import sys
from typing import Any

import yaml


ROOT = Path(__file__).resolve().parents[1]

SCHEMA_VERSION = "crt-347.fivefold-capability-teleology.v1"
CANDIDATE_ID = "fivefold-capability-teleology-v1"
REGISTRY_ID = "fivefold-capability-teleology"
VERSION = "1.0.0"
STORY_ID = "CRT-347"
FOLLOW_ON_STORY_ID = "CRT-348"

AUTHORED_SOURCE_PATH = "schemas/fivefold-capability/fivefold-capability-teleology.yaml"

SOURCE_SPECS = (
    ("court-admission-contract", "schemas/court-admission-contract.json", "machine-readable Court authority boundary"),
    ("court-admission-release", "provenance/court-admission-release.json", "current bounded Court admission"),
    ("court-runtime-policy", "schemas/court-runtime-policy.json", "admitted Court runtime policy and pole order"),
    ("fivefold-engine", "seven-governors-state-machine-spec-and-authoring-toolkit-v0.2.0/schemas/fivefold_engine.yaml", "frozen proposed fivefold engine source"),
    ("framework-agents", "framework/AGENTS.md", "element table and the four Victory Conditions"),
    ("governor-registry", "schemas/governors.yaml", "Governor archetypes and zodiacal systems"),
    ("semantic-operator-registry", "schemas/semantic_operator_registry_v1.0.1.yaml", "canonical Governor rendering contract"),
    ("source-authority", "provenance/SOURCE_AUTHORITY.md", "release authority precedence"),
)

NEGATIVE_CASE_IDS = (
    "duplicate-school-id",
    "mercury-fifth-court-bit",
    "mercury-in-pole-order",
    "zodiac-writes-court-disposition",
    "sun-moon-capability-school-pole",
    "numeric-ch-while-unresolved",
    "physical-quantity-claim-true",
    "win-condition-runtime-predicate",
    "active-complement-relation",
    "active-subset-of-7-35-relation",
    "source-hash-drift",
    "unresolved-foreign-key",
)

PUBLISHED_INVERSION_WITNESS_AXES = {
    "Mars": 3,
    "Jupiter": 11,
    "Venus": 9,
    "Saturn": 7,
    "Mercury": 1,
}

FORBIDDEN_CAPABILITY_IDS = {
    "court.transition",
    "court.translocate",
    "court.advance",
    "court.retreat",
}

FORBIDDEN_ID_PREFIXES = ("court.", "gov210.", "gov-210.", "capability:")

ELEMENTAL_SCHOOL_GOVERNORS = ("Mars", "Jupiter", "Venus", "Saturn")


class FivefoldTeleologyBuildError(ValueError):
    """Stable CRT-347 build failure."""


def _read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def _sha256_bytes(payload: bytes) -> str:
    return hashlib.sha256(payload).hexdigest()


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
        if any(not isinstance(key, str) for key in value):
            raise TypeError("json_object_key_must_be_string")
        for item in value.values():
            _require_intrinsic_json(item)
        return
    raise TypeError(f"unsupported_json_type:{type(value).__name__}")


def canonical_json_bytes(value: Any) -> bytes:
    _require_intrinsic_json(value)
    return json.dumps(
        value,
        ensure_ascii=False,
        allow_nan=False,
        separators=(",", ":"),
        sort_keys=True,
    ).encode("utf-8")


def _sha256_payload(value: Any) -> str:
    return _sha256_bytes(canonical_json_bytes(value))


def serialize_candidate(document: dict[str, Any]) -> bytes:
    return canonical_json_bytes(document) + b"\n"


def _record_with_fingerprint(core: dict[str, Any]) -> dict[str, Any]:
    return {**core, "recordFingerprint": _sha256_payload(core)}


def _source_bindings(root: Path) -> list[dict[str, str]]:
    bindings = []
    for binding_id, relative_path, role in SOURCE_SPECS:
        path = root / relative_path
        if not path.is_file():
            raise FivefoldTeleologyBuildError(f"source_missing:{relative_path}")
        bindings.append(
            {
                "bindingId": binding_id,
                "path": relative_path,
                "role": role,
                "sha256": _sha256_bytes(path.read_bytes()),
            }
        )
    return sorted(bindings, key=lambda item: item["bindingId"])


def _mask_from_pitch_mask12(value: str) -> int:
    if not isinstance(value, str) or len(value) != 12 or set(value) - {"0", "1"}:
        raise FivefoldTeleologyBuildError("pitch_mask12_invalid")
    return sum(1 << index for index, bit in enumerate(value) if bit == "1")


def _pitch_mask12(mask: int) -> str:
    if type(mask) is not int or not 0 <= mask <= 4095:
        raise FivefoldTeleologyBuildError("pitch_mask_out_of_range")
    return "".join("1" if mask & (1 << pitch) else "0" for pitch in range(12))


def _pitch_classes(mask: int) -> tuple[int, ...]:
    return tuple(pitch for pitch in range(12) if mask & (1 << pitch))


def _transpose(mask: int, step: int) -> int:
    return sum(1 << ((pitch + step) % 12) for pitch in _pitch_classes(mask))


def _invert(mask: int, axis: int) -> int:
    return sum(1 << ((axis - pitch) % 12) for pitch in _pitch_classes(mask))


def _assert_no_unqualified_capability_identity(value: Any, location: str = "root") -> None:
    if isinstance(value, dict):
        for key, item in value.items():
            if key.lower() == "capability":
                raise FivefoldTeleologyBuildError(
                    f"unqualified_capability_identity_forbidden:{location}"
                )
            _assert_no_unqualified_capability_identity(item, f"{location}.{key}")
    elif isinstance(value, list):
        for index, item in enumerate(value):
            _assert_no_unqualified_capability_identity(item, f"{location}[{index}]")


def _assert_id_vocabulary(identifier: str) -> None:
    if identifier in FORBIDDEN_CAPABILITY_IDS or identifier.startswith(FORBIDDEN_ID_PREFIXES):
        raise FivefoldTeleologyBuildError(f"capability_namespace_collision:{identifier}")


def _governor_registry(root: Path) -> dict[str, Any]:
    return yaml.safe_load((root / "schemas/governors.yaml").read_text(encoding="utf-8"))


def _load_authored(root: Path) -> dict[str, Any]:
    source = yaml.safe_load(
        (root / AUTHORED_SOURCE_PATH).read_text(encoding="utf-8")
    )
    _assert_no_unqualified_capability_identity(source)
    if source.get("metadata", {}).get("admission_status") != "planning_evidence":
        raise FivefoldTeleologyBuildError("authored_admission_status_invalid")
    if source.get("admission_boundary", {}).get("physical_quantity_claim") is not False:
        raise FivefoldTeleologyBuildError("physical_quantity_claim_invalid")
    ch = source.get("compression_coordinate_contract", {}).get("C_H", {})
    if ch.get("status") != "unresolved" or ch.get("value") is not None:
        raise FivefoldTeleologyBuildError("ch_unresolved_guard_invalid")
    return source


def _verify_fivefold_engine_source(root: Path) -> dict[str, Any]:
    engine = yaml.safe_load(
        (
            root
            / "seven-governors-state-machine-spec-and-authoring-toolkit-v0.2.0/schemas/fivefold_engine.yaml"
        ).read_text(encoding="utf-8")
    )["fivefold_engine"]
    if engine.get("physical_quantity_claim") is not False:
        raise FivefoldTeleologyBuildError("engine_physical_claim_invalid")
    controller = engine["controller"]
    if controller.get("governor") != "Mercury" or controller.get("is_binary_court_pole") is not False:
        raise FivefoldTeleologyBuildError("engine_controller_contract_invalid")
    pole_order = engine["pole_order"]
    if [item["governor"] for item in pole_order] != list(ELEMENTAL_SCHOOL_GOVERNORS):
        raise FivefoldTeleologyBuildError("engine_pole_order_mismatch")
    states = engine["canonical_states"]
    expected_states = [
        {"state_id": "C0", "vector": "0000", "internal_poles": [], "kappa_court": 0},
        {"state_id": "C1", "vector": "1000", "internal_poles": ["Mars"], "kappa_court": 0.25},
        {"state_id": "C2", "vector": "1100", "internal_poles": ["Mars", "Jupiter"], "kappa_court": 0.5},
        {"state_id": "C3", "vector": "1110", "internal_poles": ["Mars", "Jupiter", "Venus"], "kappa_court": 0.75},
        {"state_id": "C4", "vector": "1111", "internal_poles": ["Mars", "Jupiter", "Venus", "Saturn"], "kappa_court": 1},
    ]
    replay = [
        {
            "state_id": item["state_id"],
            "vector": item["vector"],
            "internal_poles": item["internal_poles"],
            "kappa_court": item["kappa_court"],
        }
        for item in states
    ]
    if replay != expected_states:
        raise FivefoldTeleologyBuildError("engine_canonical_states_mismatch")
    transitions = engine["canonical_transitions"]
    expected_transitions = [
        ("court:C0:C1", "C0", "C1", "Mars"),
        ("court:C1:C2", "C1", "C2", "Jupiter"),
        ("court:C2:C3", "C2", "C3", "Venus"),
        ("court:C3:C4", "C3", "C4", "Saturn"),
    ]
    if [
        (item["transition_id"], item["from"], item["to"], item["pole"])
        for item in transitions
    ] != expected_transitions:
        raise FivefoldTeleologyBuildError("engine_canonical_transitions_mismatch")
    geometry = engine["geometry"]
    if (
        geometry["kappa_formula"] != "kappa(C_i) = i/4"
        or geometry["paired_mask_hamming_formula"] != "d_H(C_i,C_j) = 2*abs(i-j)"
        or geometry["signed_gram_matrix"] != "2*I_4"
        or geometry["canonical_path_size"] != 5
    ):
        raise FivefoldTeleologyBuildError("engine_geometry_mismatch")
    return engine


def _verify_runtime_policy(root: Path) -> dict[str, Any]:
    policy = _read_json(root / "schemas/court-runtime-policy.json")
    if policy["poleOrder"] != list(ELEMENTAL_SCHOOL_GOVERNORS):
        raise FivefoldTeleologyBuildError("runtime_pole_order_mismatch")
    positions = policy["positions"]
    if [item["positionId"] for item in positions] != ["C0", "C1", "C2", "C3", "C4"]:
        raise FivefoldTeleologyBuildError("runtime_positions_mismatch")
    if [item["poleVector"] for item in positions] != ["0000", "1000", "1100", "1110", "1111"]:
        raise FivefoldTeleologyBuildError("runtime_pole_vectors_mismatch")
    if policy["operationAllowList"] != ["court:advance", "court:retreat", "court:translocate"]:
        raise FivefoldTeleologyBuildError("runtime_operation_allow_list_mismatch")
    return policy


def _build_court_parity_replay(engine: dict[str, Any], policy: dict[str, Any]) -> dict[str, Any]:
    positions = [
        {
            "positionId": item["positionId"],
            "poleVector": item["poleVector"],
            "internalPoles": item["internalPoles"],
            "kappaCourt": item["kappaCourt"],
        }
        for item in policy["positions"]
    ]
    transitions = [
        {
            "transitionId": item["transition_id"],
            "from": item["from"],
            "to": item["to"],
            "pole": item["pole"],
        }
        for item in engine["canonical_transitions"]
    ]
    return {
        "poleOrder": list(policy["poleOrder"]),
        "positions": positions,
        "transitions": transitions,
        "operationAllowList": list(policy["operationAllowList"]),
        "ordinaryMoveCount": len(policy["ordinaryMoves"]),
        "kappaFormula": engine["geometry"]["kappa_formula"],
    }


ACTIVE_CROSS_GRAPH_RELATIONS = {
    "declaredActive": ["filter_projection"],
    "declaredInactive": ["complement_map", "SUBSET_OF_7_35"],
}


def _verify_promotion_inventory(
    root: Path, authored: dict[str, Any]
) -> dict[str, Any]:
    contract = _read_json(root / "schemas/court-admission-contract.json")
    source = contract["fivefoldFieldDisposition"]
    eligible = source["eligibleForPromotionAtCrt309"]
    remain = source["remainProposed"]
    authored_eligible = authored["promotion_inventory_replay"]["eligible_for_promotion_at_crt309"]
    authored_remain = authored["promotion_inventory_replay"]["remain_proposed"]
    if list(eligible) != authored_eligible:
        raise FivefoldTeleologyBuildError("promotion_inventory_eligible_mismatch")
    if list(remain) != authored_remain:
        raise FivefoldTeleologyBuildError("promotion_inventory_remain_proposed_mismatch")
    if len(eligible) != 10:
        raise FivefoldTeleologyBuildError("promotion_inventory_count_mismatch")
    return {
        "source": "schemas/court-admission-contract.json#fivefoldFieldDisposition",
        "eligibleForPromotionAtCrt309": list(eligible),
        "remainProposed": list(remain),
        "role": "read_only_evidence_for_crt_348",
    }


def _build_schools(
    authored: dict[str, Any], engine: dict[str, Any], governors: dict[str, Any]
) -> list[dict[str, Any]]:
    authored_schools = list(authored["capability_schools"])
    identities: set[str] = set()
    records = []
    for item in authored_schools:
        school_id = item["school_id"]
        _assert_id_vocabulary(school_id)
        if school_id in identities:
            raise FivefoldTeleologyBuildError("duplicate_school_id")
        identities.add(school_id)
        governor_key = item["governor_ref"].rsplit(".", 1)[1]
        governor = governors.get(governor_key)
        if governor is None:
            raise FivefoldTeleologyBuildError(f"foreign_key_unresolved:{item['governor_ref']}")
        element = item["element"]
        if governor.get("archetype", {}).get("element") != element:
            raise FivefoldTeleologyBuildError(f"school_element_mismatch:{school_id}")
        pole_index = item["court_pole_index"]
        is_binary_pole = item["is_binary_court_pole"]
        if element == "Quintessence":
            if is_binary_pole or pole_index is not None:
                raise FivefoldTeleologyBuildError("mercury_register_membership_invalid")
            if governor_key != "mercury":
                raise FivefoldTeleologyBuildError("quintessence_governor_mismatch")
        else:
            if governor_key not in {"mars", "jupiter", "venus", "saturn"}:
                raise FivefoldTeleologyBuildError("sun_moon_school_pole_invalid")
            if not is_binary_pole or pole_index not in (0, 1, 2, 3):
                raise FivefoldTeleologyBuildError("elemental_pole_index_invalid")
            ref_index_text = item["court_pole_ref"].rsplit("pole_order[", 1)[1].rstrip("]")
            if ref_index_text != str(pole_index):
                raise FivefoldTeleologyBuildError(f"school_pole_ref_index_mismatch:{school_id}")
            expected_runtime_ref = f"schemas/court-runtime-policy.json#/poleOrder/{pole_index}"
            if (
                item["court_pole_runtime_ref"] != expected_runtime_ref
                or engine["pole_order"][pole_index]["governor"].lower() != governor_key
                or engine["pole_order"][pole_index]["element"] != element
                or engine["pole_order"][pole_index]["function"] != item["source_function"]
                or engine["pole_order"][pole_index]["diagnostic_question"] != item["diagnostic_question"]
            ):
                raise FivefoldTeleologyBuildError(f"school_pole_binding_mismatch:{school_id}")
        if item["runtime_effect"] is not False:
            raise FivefoldTeleologyBuildError(f"school_runtime_effect_invalid:{school_id}")
        if item["semantic_relation"] not in ("AFFORDS", "AMPLIFIES", "CONSTRAINS", "OPPOSES", "CORRESPONDS_TO"):
            raise FivefoldTeleologyBuildError(f"school_relation_invalid:{school_id}")
        if item["semantic_relation"] in ("SETS_COURT_POLE", "EXECUTES_COURT_MOVE"):
            raise FivefoldTeleologyBuildError("excluded_relation_forbidden")
        records.append(
            {
                "schoolId": school_id,
                "element": element,
                "governorRef": item["governor_ref"],
                "courtPoleRef": item["court_pole_ref"],
                "courtPoleRuntimeRef": item["court_pole_runtime_ref"],
                "courtPoleIndex": pole_index,
                "sourceFunction": item["source_function"],
                "authoredVerb": item["authored_verb"],
                "diagnosticQuestion": item["diagnostic_question"],
                "winConditionRef": item["win_condition_ref"],
                "zodiacExternalFacetRef": item["zodiac_external_facet_ref"],
                "zodiacInternalFacetRef": item["zodiac_internal_facet_ref"],
                "semanticRelation": item["semantic_relation"],
                "isBinaryCourtPole": is_binary_pole,
                "runtimeEffect": item["runtime_effect"],
                "provenance": list(item["provenance"]),
            }
        )
    records.sort(key=lambda record: record["schoolId"])
    records = [_record_with_fingerprint(core) for core in records]
    if len(records) != 5:
        raise FivefoldTeleologyBuildError("school_count_mismatch")
    binary_count = sum(record["isBinaryCourtPole"] for record in records)
    if binary_count != 4:
        raise FivefoldTeleologyBuildError("binary_school_count_mismatch")
    return records


def _zodiac_source_data(governors: dict[str, Any]) -> dict[str, dict[str, Any]]:
    data: dict[str, dict[str, Any]] = {}
    for governor_key, governor in governors.items():
        for zodiac_key, system in governor.get("zodiacal_systems", {}).items():
            derives = system.get("derives_from")
            if derives not in ("canonical_expression.binary_12bit", "canonical_expression.binary_12bit_lsb"):
                raise FivefoldTeleologyBuildError(f"zodiac_derives_from_invalid:{zodiac_key}")
            expression = governor["canonical_expression"]
            vector = expression.get(derives.rsplit(".", 1)[1])
            if vector is None:
                raise FivefoldTeleologyBuildError(f"zodiac_vector_missing:{zodiac_key}")
            data[zodiac_key] = {
                "governor": governor_key,
                "governor_type": governor.get("type"),
                "derives_from": derives,
                "vector": vector,
            }
    if len(data) != 12:
        raise FivefoldTeleologyBuildError("zodiac_source_count_mismatch")
    return data


def _governor_pair_transforms(governors: dict[str, Any]) -> dict[str, dict[str, Any]]:
    transforms: dict[str, dict[str, Any]] = {}
    for governor_key, governor in governors.items():
        if governor.get("type") != "bipolar_engine_governor":
            continue
        expression = governor["canonical_expression"]
        constructive = expression["binary_12bit"]
        internal = expression["binary_12bit_lsb"]
        constructive_mask = _mask_from_pitch_mask12(constructive)
        internal_mask = _mask_from_pitch_mask12(internal)
        t1_mask = _transpose(constructive_mask, 1)
        inversion_axes = [
            axis for axis in range(12) if _invert(constructive_mask, axis) == internal_mask
        ]
        if len(inversion_axes) != 1 or t1_mask != internal_mask:
            raise FivefoldTeleologyBuildError(f"bipolar_vector_relation_mismatch:{governor_key}")
        office = governor_key.capitalize()
        published_axis = PUBLISHED_INVERSION_WITNESS_AXES.get(office)
        if published_axis is None or inversion_axes[0] != published_axis:
            raise FivefoldTeleologyBuildError(f"published_inversion_witness_mismatch:{governor_key}")
        transforms[governor_key] = {
            "constructive": constructive,
            "internal": internal,
            "t1String": _pitch_mask12(t1_mask),
            "inversionAxis": inversion_axes[0],
            "publishedInversionAxis": published_axis,
        }
    if len(transforms) != 5:
        raise FivefoldTeleologyBuildError("bipolar_governor_count_mismatch")
    return transforms


def _build_facets(
    authored: dict[str, Any],
    governors: dict[str, Any],
    transforms: dict[str, dict[str, Any]],
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    zodiac_data = _zodiac_source_data(governors)
    identities: set[str] = set()
    zodiac_records = []
    for item in authored["zodiac_facets"]:
        facet_id = item["facet_id"]
        _assert_id_vocabulary(facet_id)
        if facet_id in identities:
            raise FivefoldTeleologyBuildError("duplicate_facet_id")
        identities.add(facet_id)
        zodiac_key = item["zodiac"]
        source = zodiac_data.get(zodiac_key)
        if source is None:
            raise FivefoldTeleologyBuildError(f"foreign_key_unresolved:{item['facet_id']}")
        governor_key = item["governor_ref"].rsplit(".", 1)[1]
        if source["governor"] != governor_key or source["derives_from"] != item["derives_from"]:
            raise FivefoldTeleologyBuildError(f"facet_source_binding_mismatch:{facet_id}")
        if source["vector"] != item["source_vector"]:
            raise FivefoldTeleologyBuildError(f"facet_source_vector_mismatch:{facet_id}")
        if item["writes_court_pole_disposition"] is not False:
            raise FivefoldTeleologyBuildError("zodiac_court_write_forbidden")
        if item["relation_to_court"] != "authored_correspondence":
            raise FivefoldTeleologyBuildError(f"facet_court_relation_invalid:{facet_id}")
        if item["polarity"] == "Internal":
            pair = transforms[governor_key]
            t1_relation = {
                "matches": item["source_vector"] == pair["internal"],
                "witness": pair["t1String"],
            }
            inversion_relation = {
                "matches": _mask_from_pitch_mask12(item["source_vector"])
                == _mask_from_pitch_mask12(pair["internal"]),
                "witnessAxis": pair["inversionAxis"],
                "publishedWitnessAxis": pair["publishedInversionAxis"],
            }
            if not t1_relation["matches"] or not inversion_relation["matches"]:
                raise FivefoldTeleologyBuildError(f"facet_transform_mismatch:{facet_id}")
        else:
            t1_relation = None
            inversion_relation = None
        zodiac_records.append(
            {
                "facetId": facet_id,
                "zodiac": zodiac_key,
                "governorRef": item["governor_ref"],
                "polarity": item["polarity"],
                "derivesFrom": item["derives_from"],
                "sourceVector": item["source_vector"],
                "schoolRef": item["school_ref"],
                "facetCategory": "capability_school_facet",
                "relationToCourt": "authored_correspondence",
                "writesCourtPoleDisposition": False,
                "provenance": item["provenance"],
                "t1Relation": t1_relation,
                "inversionRelation": inversion_relation,
            }
        )
    system_records = []
    for item in authored["system_level_facets"]:
        facet_id = item["facet_id"]
        _assert_id_vocabulary(facet_id)
        if facet_id in identities:
            raise FivefoldTeleologyBuildError("duplicate_facet_id")
        identities.add(facet_id)
        zodiac_key = item["zodiac"]
        source = zodiac_data.get(zodiac_key)
        if source is None:
            raise FivefoldTeleologyBuildError(f"foreign_key_unresolved:{facet_id}")
        governor_key = item["governor_ref"].rsplit(".", 1)[1]
        if (
            source["governor"] != governor_key
            or source["governor_type"] != "monopolar_luminary"
            or source["derives_from"] != item["derives_from"]
            or source["vector"] != item["source_vector"]
        ):
            raise FivefoldTeleologyBuildError(f"system_facet_source_binding_mismatch:{facet_id}")
        if item["writes_court_pole_disposition"] is not False:
            raise FivefoldTeleologyBuildError("zodiac_court_write_forbidden")
        system_records.append(
            {
                "facetId": facet_id,
                "zodiac": zodiac_key,
                "governorRef": item["governor_ref"],
                "governorType": item["governor_type"],
                "polarity": item["polarity"],
                "derivesFrom": item["derives_from"],
                "sourceVector": item["source_vector"],
                "facetCategory": "system_level_facet",
                "correspondence": item["correspondence"],
                "relationToCourt": "authored_correspondence",
                "writesCourtPoleDisposition": False,
                "provenance": item["provenance"],
            }
        )
    zodiac_records.sort(key=lambda record: record["facetId"])
    system_records.sort(key=lambda record: record["facetId"])
    zodiac_records = [_record_with_fingerprint(core) for core in zodiac_records]
    system_records = [_record_with_fingerprint(core) for core in system_records]
    if len(zodiac_records) != 10 or len(system_records) != 2:
        raise FivefoldTeleologyBuildError("zodiac_partition_count_mismatch")
    return zodiac_records, system_records


def _build_win_conditions(authored: dict[str, Any]) -> list[dict[str, Any]]:
    identities: set[str] = set()
    records = []
    for item in authored["win_conditions"]:
        win_id = item["win_condition_id"]
        _assert_id_vocabulary(win_id)
        if win_id in identities:
            raise FivefoldTeleologyBuildError("duplicate_win_condition_id")
        identities.add(win_id)
        if (
            item["classification"] != "authored_teleology"
            or item["runtime_enforced"] is not False
            or item["policy_effect"] is not False
            or item["ledger_success_effect"] is not False
            or item["admission_effect"] is not False
            or item["contains_executable_predicate"] is not False
        ):
            raise FivefoldTeleologyBuildError("teleology_boundary_invalid")
        records.append(
            {
                "winConditionId": win_id,
                "schoolRef": item["school_ref"],
                "title": item["title"],
                "description": item["description"],
                "classification": item["classification"],
                "runtimeEnforced": item["runtime_enforced"],
                "policyEffect": item["policy_effect"],
                "ledgerSuccessEffect": item["ledger_success_effect"],
                "admissionEffect": item["admission_effect"],
                "containsExecutablePredicate": item["contains_executable_predicate"],
                "provenance": item["provenance"],
            }
        )
    records.sort(key=lambda record: record["winConditionId"])
    records = [_record_with_fingerprint(core) for core in records]
    if len(records) != 5:
        raise FivefoldTeleologyBuildError("win_condition_count_mismatch")
    return records


def _transcribe(authored: dict[str, Any]) -> dict[str, Any]:
    boundary = authored["admission_boundary"]
    separation = authored["separation_contract"]
    compression = authored["compression_coordinate_contract"]
    physical = authored["physical_claim_contract"]
    vocabulary = separation["relation_vocabulary"]
    return {
        "metadata": {
            "registryId": authored["metadata"]["registry_id"],
            "candidateId": authored["metadata"]["candidate_id"],
            "version": authored["metadata"]["version"],
            "schemaVersion": authored["metadata"]["schema_version"],
            "storyId": authored["metadata"]["story_id"],
            "followOnStoryId": authored["metadata"]["follow_on_story_id"],
            "admissionStatus": authored["metadata"]["admission_status"],
            "authority": authored["metadata"]["authority"],
            "description": authored["metadata"]["description"],
        },
        "admissionBoundary": {
            "runtimeEffect": boundary["runtime_effect"],
            "graphEffect": boundary["graph_effect"],
            "policyEffect": boundary["policy_effect"],
            "ledgerEffect": boundary["ledger_effect"],
            "admissionEffect": boundary["admission_effect"],
            "neo4jAuthority": boundary["neo4j_authority"],
            "crt310GateEffect": boundary["crt310_gate_effect"],
            "physicalQuantityClaim": boundary["physical_quantity_claim"],
        },
        "separationContract": {
            "topologyScaleState": separation["topology_scale_state"],
            "courtState": separation["court_state"],
            "capabilitySchool": separation["capability_school"],
            "teleologyWinCondition": separation["teleology_win_condition"],
            "nonEquivalence": list(separation["non_equivalence"]),
            "semanticFieldWritesCourtRegister": separation[
                "semantic_field_writes_court_register"
            ],
            "governorRenderingContract": {
                "canonical": separation["governor_rendering_contract"]["canonical"],
                "contextualModelOnly": separation["governor_rendering_contract"][
                    "contextual_model_only"
                ],
            },
            "relationVocabulary": {
                "allowed": list(vocabulary["allowed"]),
                "excluded": list(vocabulary["excluded"]),
            },
        },
        "compressionCoordinateContract": {
            "CP": {
                "access": compression["C_P"]["access"],
                "source": compression["C_P"]["source"],
                "writableByThisRegistry": compression["C_P"]["writable_by_this_registry"],
            },
            "CH": {
                "status": compression["C_H"]["status"],
                "value": compression["C_H"]["value"],
                "scopedAuthorities": list(compression["C_H"]["scoped_authorities"]),
                "writableByThisRegistry": compression["C_H"]["writable_by_this_registry"],
                "rule": compression["C_H"]["rule"],
            },
            "CS": {
                "access": compression["C_S"]["access"],
                "source": compression["C_S"]["source"],
                "rule": compression["C_S"]["rule"],
            },
            "kappaCourt": {
                "access": compression["kappa_court"]["access"],
                "rule": compression["kappa_court"]["rule"],
                "forbiddenEquivalences": list(
                    compression["kappa_court"]["forbidden_equivalences"]
                ),
            },
        },
        "physicalClaimContract": {
            "physicalQuantityClaim": physical["physical_quantity_claim"],
            "polarityLabels": physical["polarity_labels"],
            "noSiUnits": physical["no_si_units"],
            "noElectromagneticEquivalence": physical["no_electromagnetic_equivalence"],
            "noEnergyEquations": physical["no_energy_equations"],
            "noPhysicalCausation": physical["no_physical_causation"],
        },
        "guards": [
            {
                "guardId": item["guard_id"],
                "status": item["status"],
                "statement": item["statement"],
            }
            for item in sorted(authored["guards"], key=lambda guard: guard["guard_id"])
        ],
    }


def _verify_guards(transcribed: dict[str, Any]) -> None:
    guard_ids = {item["guardId"] for item in transcribed["guards"]}
    expected = {
        "governor_court_teleology_non_equivalence",
        "zodiac_no_court_write",
        "mercury_not_fifth_bit",
        "complement_relation_inactive",
        "subset_of_7_35_detached",
        "crt310_untouched",
        "physical_quantity_claim_false",
        "ch_unresolved_preserved",
        "win_conditions_authored_only",
        "excluded_relation_vocabulary_absent",
    }
    if guard_ids != expected or len(transcribed["guards"]) != 10:
        raise FivefoldTeleologyBuildError("guard_closure_mismatch")


def _verify_semantic_registry_contract(root: Path, transcribed: dict[str, Any]) -> None:
    registry = yaml.safe_load(
        (root / "schemas/semantic_operator_registry_v1.0.1.yaml").read_text(encoding="utf-8")
    )
    canonical = (
        registry.get("metadata", {}).get("architecture", {})
        .get("canonical_rendering_definition")
    )
    if canonical != transcribed["separationContract"]["governorRenderingContract"]["canonical"]:
        raise FivefoldTeleologyBuildError("governor_rendering_contract_mismatch")
    guard = registry.get("immutability_guard", {})
    if "C_H" not in guard.get("overlays_may_not_overwrite", []):
        raise FivefoldTeleologyBuildError("semantic_registry_ch_guard_missing")


def build_candidate(root: Path = ROOT, *, reverse_input: bool = False) -> dict[str, Any]:
    source_bindings = _source_bindings(root)
    authored = _load_authored(root)
    engine = _verify_fivefold_engine_source(root)
    policy = _verify_runtime_policy(root)
    promotion = _verify_promotion_inventory(root, authored)
    court_parity = _build_court_parity_replay(engine, policy)
    governors_doc = _governor_registry(root)
    governors = dict(governors_doc["governors"])
    if reverse_input:
        governors = dict(reversed(tuple(governors.items())))
    transforms = _governor_pair_transforms(governors)
    schools = _build_schools(authored, engine, governors)
    zodiac_facets, system_facets = _build_facets(authored, governors, transforms)
    win_conditions = _build_win_conditions(authored)
    transcribed = _transcribe(authored)
    _verify_guards(transcribed)
    _verify_semantic_registry_contract(root, transcribed)

    school_ids = {item["schoolId"] for item in schools}
    facet_ids = {item["facetId"] for item in zodiac_facets} | {
        item["facetId"] for item in system_facets
    }
    win_ids = {item["winConditionId"] for item in win_conditions}
    for school in schools:
        if school["winConditionRef"] not in win_ids:
            raise FivefoldTeleologyBuildError("win_condition_foreign_key_unresolved")
        if (
            school["zodiacExternalFacetRef"] not in facet_ids
            or school["zodiacInternalFacetRef"] not in facet_ids
        ):
            raise FivefoldTeleologyBuildError("zodiac_foreign_key_unresolved")
    for facet in zodiac_facets:
        if facet["schoolRef"] not in school_ids:
            raise FivefoldTeleologyBuildError("school_foreign_key_unresolved")
    for win in win_conditions:
        if win["schoolRef"] not in school_ids:
            raise FivefoldTeleologyBuildError("win_school_foreign_key_unresolved")
    _ = policy

    core = {
        "schemaVersion": SCHEMA_VERSION,
        "candidateId": CANDIDATE_ID,
        "registryId": REGISTRY_ID,
        "version": VERSION,
        "storyId": STORY_ID,
        "status": "planning_evidence",
        "admissionEffect": "none",
        "authority": "root_owned_non_admitted_planning_evidence_sidecar",
        "metadata": transcribed["metadata"],
        "admissionBoundary": transcribed["admissionBoundary"],
        "separationContract": transcribed["separationContract"],
        "compressionCoordinateContract": transcribed["compressionCoordinateContract"],
        "physicalClaimContract": transcribed["physicalClaimContract"],
        "promotionInventoryReplay": promotion,
        "courtParityReplay": court_parity,
        "activeCrossGraphRelations": ACTIVE_CROSS_GRAPH_RELATIONS,
        "sourceBindings": source_bindings,
        "capabilitySchools": schools,
        "zodiacFacets": zodiac_facets,
        "systemLevelFacets": system_facets,
        "winConditions": win_conditions,
        "guards": transcribed["guards"],
        "negativeCaseIds": list(NEGATIVE_CASE_IDS),
    }
    document = {**core, "candidateFingerprint": _sha256_payload(core)}
    if _source_bindings(root) != source_bindings:
        raise FivefoldTeleologyBuildError("source_changed_during_build")
    return document


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--output",
        type=Path,
        default=ROOT
        / "canonical/fivefold-capability-candidates/fivefold-capability-teleology-v1.json",
    )
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()

    document = build_candidate(ROOT)
    payload = serialize_candidate(document)
    if args.check:
        if not args.output.is_file() or args.output.read_bytes() != payload:
            raise SystemExit("STALE_FIVEFOLD_CAPABILITY_TELEOLOGY")
    else:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_bytes(payload)
    print(
        json.dumps(
            {
                "candidateFingerprint": document["candidateFingerprint"],
                "candidateId": document["candidateId"],
                "schoolCount": len(document["capabilitySchools"]),
                "zodiacFacetCount": len(document["zodiacFacets"]),
                "systemLevelFacetCount": len(document["systemLevelFacets"]),
                "winConditionCount": len(document["winConditions"]),
                "promotionItemCount": len(
                    document["promotionInventoryReplay"][
                        "eligibleForPromotionAtCrt309"
                    ]
                ),
                "status": document["status"],
            },
            sort_keys=True,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
