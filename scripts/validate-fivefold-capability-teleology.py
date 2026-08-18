#!/usr/bin/env python3
"""Independently validate the CRT-347 Fivefold Capability Teleology sidecar."""

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
CANDIDATE_PATH = (
    ROOT
    / "canonical/fivefold-capability-candidates/fivefold-capability-teleology-v1.json"
)
NEGATIVE_CASES_PATH = (
    ROOT
    / "canonical/fivefold-capability-candidates/fivefold-capability-teleology-negative-cases-v1.json"
)
CANDIDATE_SCHEMA_PATH = (
    ROOT
    / "schemas/fivefold-capability/fivefold-capability-teleology.schema.json"
)
NEGATIVE_SCHEMA_PATH = (
    ROOT
    / "schemas/fivefold-capability/fivefold-capability-teleology-negative-cases.schema.json"
)
REPORT_SCHEMA_PATH = (
    ROOT
    / "schemas/fivefold-capability/fivefold-capability-teleology-validation-report.schema.json"
)
REPORT_PATH = ROOT / "qa/fivefold-capability-teleology-validation.json"
AUTHORED_SOURCE_PATH = "schemas/fivefold-capability/fivefold-capability-teleology.yaml"
GENERATOR_SCRIPT_PATH = "scripts/build-fivefold-capability-teleology.py"

SCHEMA_VERSION = "crt-347.fivefold-capability-teleology.v1"
CANDIDATE_ID = "fivefold-capability-teleology-v1"
REGISTRY_ID = "fivefold-capability-teleology"
REPORT_SCHEMA_VERSION = "crt-347.fivefold-capability-teleology-validation.v1"
NEGATIVE_SCHEMA_VERSION = "crt-347.fivefold-capability-teleology-negative-cases.v1"

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

FORBIDDEN_IMPORT_TOKENS = (
    "import court_runtime",
    "import court_graph",
    "from src.governor",
    "from governor import",
    "neo4j-bootstrap",
    "graph.runtime",
)

REPORT_CHECK_IDS = (
    "candidate-schema",
    "negative-case-schema",
    "candidate-fingerprint",
    "source-binding-freshness",
    "record-fingerprints",
    "independent-rebuild",
    "build-twice-identity",
    "reordered-input-identity",
    "FCT-001-schema-and-identity",
    "FCT-002-source-bindings",
    "FCT-003-namespace-separation",
    "FCT-004-school-cardinality",
    "FCT-005-court-parity",
    "FCT-006-mercury-exclusion",
    "FCT-007-zodiac-partition",
    "FCT-008-zodiac-replay",
    "FCT-009-forbidden-write-guard",
    "FCT-010-compression-physics-guard",
    "FCT-011-teleology-boundary",
    "FCT-012-determinism-admission-boundary",
    "negative-case-closure",
    "adversarial-rejection",
)


class FivefoldTeleologyValidationError(ValueError):
    """Stable independent-validation rejection."""

    def __init__(self, reason_code: str) -> None:
        super().__init__(reason_code)
        self.reason_code = reason_code


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
        if any(not isinstance(key, str) for key in value):
            raise TypeError("json_object_key_must_be_string")
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


def _sha256_bytes(payload: bytes) -> str:
    return hashlib.sha256(payload).hexdigest()


def _sha256_payload(value: Any) -> str:
    return _sha256_bytes(_canonical_bytes(value))


def _serialize_candidate(document: dict[str, Any]) -> bytes:
    return _canonical_bytes(document) + b"\n"


def _record_with_fingerprint(core: dict[str, Any]) -> dict[str, Any]:
    return {**core, "recordFingerprint": _sha256_payload(core)}


def _rehash_candidate(document: dict[str, Any]) -> None:
    core = {key: value for key, value in document.items() if key != "candidateFingerprint"}
    document["candidateFingerprint"] = _sha256_payload(core)


def _rehash_record(record: dict[str, Any]) -> None:
    core = {key: value for key, value in record.items() if key != "recordFingerprint"}
    record["recordFingerprint"] = _sha256_payload(core)


def _source_bindings(root: Path) -> list[dict[str, str]]:
    records = []
    for binding_id, relative_path, role in SOURCE_SPECS:
        records.append(
            {
                "bindingId": binding_id,
                "path": relative_path,
                "role": role,
                "sha256": _sha256_bytes((root / relative_path).read_bytes()),
            }
        )
    return sorted(records, key=lambda item: item["bindingId"])


def _mask_from_pitch_mask12(value: str) -> int:
    if not isinstance(value, str) or len(value) != 12 or set(value) - {"0", "1"}:
        raise FivefoldTeleologyValidationError("pitch_mask12_invalid")
    return sum(1 << index for index, bit in enumerate(value) if bit == "1")


def _pitch_mask12(mask: int) -> str:
    if type(mask) is not int or not 0 <= mask <= 4095:
        raise FivefoldTeleologyValidationError("pitch_mask_out_of_range")
    return "".join("1" if mask & (1 << pitch) else "0" for pitch in range(12))


def _pitch_classes(mask: int) -> tuple[int, ...]:
    return tuple(pitch for pitch in range(12) if mask & (1 << pitch))


def _transpose(mask: int, step: int) -> int:
    return sum(1 << ((pitch + step) % 12) for pitch in _pitch_classes(mask))


def _invert(mask: int, axis: int) -> int:
    return sum(1 << ((axis - pitch) % 12) for pitch in _pitch_classes(mask))


def _load_authored(root: Path) -> dict[str, Any]:
    return yaml.safe_load(
        (root / AUTHORED_SOURCE_PATH).read_text(encoding="utf-8")
    )


def _load_engine(root: Path) -> dict[str, Any]:
    return yaml.safe_load(
        (
            root
            / "seven-governors-state-machine-spec-and-authoring-toolkit-v0.2.0/schemas/fivefold_engine.yaml"
        ).read_text(encoding="utf-8")
    )["fivefold_engine"]


def _load_policy(root: Path) -> dict[str, Any]:
    return _read_json(root / "schemas/court-runtime-policy.json")


def _load_governors(root: Path) -> dict[str, Any]:
    doc = yaml.safe_load((root / "schemas/governors.yaml").read_text(encoding="utf-8"))
    return dict(doc["governors"])


def _governor_pair_transforms(governors: dict[str, Any]) -> dict[str, dict[str, Any]]:
    transforms: dict[str, dict[str, Any]] = {}
    for governor_key, governor in governors.items():
        if governor.get("type") != "bipolar_engine_governor":
            continue
        expression = governor["canonical_expression"]
        constructive_mask = _mask_from_pitch_mask12(expression["binary_12bit"])
        internal_mask = _mask_from_pitch_mask12(expression["binary_12bit_lsb"])
        axes = [axis for axis in range(12) if _invert(constructive_mask, axis) == internal_mask]
        if len(axes) != 1 or _transpose(constructive_mask, 1) != internal_mask:
            raise FivefoldTeleologyValidationError("bipolar_vector_relation_mismatch")
        office = governor_key.capitalize()
        published = PUBLISHED_INVERSION_WITNESS_AXES.get(office)
        if published is None or axes[0] != published:
            raise FivefoldTeleologyValidationError("published_inversion_witness_mismatch")
        transforms[governor_key] = {
            "t1String": _pitch_mask12(_transpose(constructive_mask, 1)),
            "inversionAxis": axes[0],
            "publishedInversionAxis": published,
        }
    if len(transforms) != 5:
        raise FivefoldTeleologyValidationError("bipolar_governor_count_mismatch")
    return transforms


def _expected_promotion_inventory(root: Path) -> dict[str, Any]:
    contract = _read_json(root / "schemas/court-admission-contract.json")
    source = contract["fivefoldFieldDisposition"]
    return {
        "source": "schemas/court-admission-contract.json#fivefoldFieldDisposition",
        "eligibleForPromotionAtCrt309": list(source["eligibleForPromotionAtCrt309"]),
        "remainProposed": list(source["remainProposed"]),
        "role": "read_only_evidence_for_crt_348",
    }


def _expected_court_parity_replay(root: Path) -> dict[str, Any]:
    engine = _load_engine(root)
    policy = _load_policy(root)
    return {
        "poleOrder": list(policy["poleOrder"]),
        "positions": [
            {
                "positionId": item["positionId"],
                "poleVector": item["poleVector"],
                "internalPoles": item["internalPoles"],
                "kappaCourt": item["kappaCourt"],
            }
            for item in policy["positions"]
        ],
        "transitions": [
            {
                "transitionId": item["transition_id"],
                "from": item["from"],
                "to": item["to"],
                "pole": item["pole"],
            }
            for item in engine["canonical_transitions"]
        ],
        "operationAllowList": list(policy["operationAllowList"]),
        "ordinaryMoveCount": len(policy["ordinaryMoves"]),
        "kappaFormula": engine["geometry"]["kappa_formula"],
    }


def _expected_active_cross_graph_relations() -> dict[str, Any]:
    return {
        "declaredActive": ["filter_projection"],
        "declaredInactive": ["complement_map", "SUBSET_OF_7_35"],
    }


def _expected_schools(root: Path, *, reverse_input: bool = False) -> list[dict[str, Any]]:
    authored = _load_authored(root)
    engine = _load_engine(root)
    records = []
    for item in _reversed(authored["capability_schools"], reverse_input):
        records.append(
            {
                "schoolId": item["school_id"],
                "element": item["element"],
                "governorRef": item["governor_ref"],
                "courtPoleRef": item["court_pole_ref"],
                "courtPoleRuntimeRef": item["court_pole_runtime_ref"],
                "courtPoleIndex": item["court_pole_index"],
                "sourceFunction": item["source_function"],
                "authoredVerb": item["authored_verb"],
                "diagnosticQuestion": item["diagnostic_question"],
                "winConditionRef": item["win_condition_ref"],
                "zodiacExternalFacetRef": item["zodiac_external_facet_ref"],
                "zodiacInternalFacetRef": item["zodiac_internal_facet_ref"],
                "semanticRelation": item["semantic_relation"],
                "isBinaryCourtPole": item["is_binary_court_pole"],
                "runtimeEffect": item["runtime_effect"],
                "provenance": list(item["provenance"]),
            }
        )
    records.sort(key=lambda record: record["schoolId"])
    return [_record_with_fingerprint(core) for core in records]


def _reversed(items: list[Any], reverse_input: bool) -> list[Any]:
    return list(reversed(items)) if reverse_input else list(items)


def _expected_facets(root: Path, *, reverse_input: bool = False) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    authored = _load_authored(root)
    governors = _load_governors(root)
    transforms = _governor_pair_transforms(governors)
    zodiac_records = []
    for item in _reversed(authored["zodiac_facets"], reverse_input):
        governor_key = item["governor_ref"].rsplit(".", 1)[1]
        if item["polarity"] == "Internal":
            pair = transforms[governor_key]
            t1_relation = {"matches": True, "witness": pair["t1String"]}
            inversion_relation = {
                "matches": True,
                "witnessAxis": pair["inversionAxis"],
                "publishedWitnessAxis": pair["publishedInversionAxis"],
            }
        else:
            t1_relation = None
            inversion_relation = None
        zodiac_records.append(
            {
                "facetId": item["facet_id"],
                "zodiac": item["zodiac"],
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
    for item in _reversed(authored["system_level_facets"], reverse_input):
        system_records.append(
            {
                "facetId": item["facet_id"],
                "zodiac": item["zodiac"],
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
    return (
        [_record_with_fingerprint(core) for core in zodiac_records],
        [_record_with_fingerprint(core) for core in system_records],
    )


def _expected_win_conditions(root: Path, *, reverse_input: bool = False) -> list[dict[str, Any]]:
    authored = _load_authored(root)
    records = []
    for item in _reversed(authored["win_conditions"], reverse_input):
        records.append(
            {
                "winConditionId": item["win_condition_id"],
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
    return [_record_with_fingerprint(core) for core in records]


def _expected_contracts(root: Path) -> dict[str, Any]:
    authored = _load_authored(root)
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


def _build_expected_candidate(root: Path, *, reverse_input: bool = False) -> dict[str, Any]:
    source_bindings = _source_bindings(root)
    schools = _expected_schools(root, reverse_input=reverse_input)
    zodiac_facets, system_facets = _expected_facets(root, reverse_input=reverse_input)
    win_conditions = _expected_win_conditions(root, reverse_input=reverse_input)
    contracts = _expected_contracts(root)
    core = {
        "schemaVersion": SCHEMA_VERSION,
        "candidateId": CANDIDATE_ID,
        "registryId": REGISTRY_ID,
        "version": "1.0.0",
        "storyId": "CRT-347",
        "status": "planning_evidence",
        "admissionEffect": "none",
        "authority": "root_owned_non_admitted_planning_evidence_sidecar",
        "metadata": contracts["metadata"],
        "admissionBoundary": contracts["admissionBoundary"],
        "separationContract": contracts["separationContract"],
        "compressionCoordinateContract": contracts["compressionCoordinateContract"],
        "physicalClaimContract": contracts["physicalClaimContract"],
        "promotionInventoryReplay": _expected_promotion_inventory(root),
        "courtParityReplay": _expected_court_parity_replay(root),
        "activeCrossGraphRelations": _expected_active_cross_graph_relations(),
        "sourceBindings": source_bindings,
        "capabilitySchools": schools,
        "zodiacFacets": zodiac_facets,
        "systemLevelFacets": system_facets,
        "winConditions": win_conditions,
        "guards": contracts["guards"],
        "negativeCaseIds": list(NEGATIVE_CASE_IDS),
    }
    document = {**core, "candidateFingerprint": _sha256_payload(core)}
    if _source_bindings(root) != source_bindings:
        raise FivefoldTeleologyValidationError("source_changed_during_build")
    return document


def _has_unqualified_capability_identity(value: Any) -> bool:
    if isinstance(value, dict):
        if any(key.lower() == "capability" for key in value):
            return True
        return any(_has_unqualified_capability_identity(item) for item in value.values())
    if isinstance(value, list):
        return any(_has_unqualified_capability_identity(item) for item in value)
    return False


def _semantic_rejection_code(document: dict[str, Any], root: Path) -> str | None:
    if document.get("sourceBindings") != _source_bindings(root):
        return "source_binding_mismatch"

    schools = document.get("capabilitySchools", [])
    school_ids = [item.get("schoolId") for item in schools]
    if len(set(school_ids)) != len(school_ids):
        return "duplicate_identity_rejected"
    facets = document.get("zodiacFacets", []) + document.get("systemLevelFacets", [])
    facet_ids = [item.get("facetId") for item in facets]
    if len(set(facet_ids)) != len(facet_ids):
        return "duplicate_identity_rejected"
    win_ids = [item.get("winConditionId") for item in document.get("winConditions", [])]
    if len(set(win_ids)) != len(win_ids):
        return "duplicate_identity_rejected"

    governors = _load_governors(root)
    for school in schools:
        governor_key = school.get("governorRef", "").rsplit(".", 1)[1]
        if governor_key not in governors:
            return "foreign_key_unresolved"
        if school.get("element") == "Quintessence":
            if (
                school.get("isBinaryCourtPole") is not False
                or school.get("courtPoleIndex") is not None
            ):
                return "mercury_register_membership_invalid"
        else:
            if governor_key not in {"mars", "jupiter", "venus", "saturn"}:
                return "sun_moon_school_pole_invalid"

    pole_order = document.get("courtParityReplay", {}).get("poleOrder", [])
    if len(pole_order) != 4 or any(
        pole not in ELEMENTAL_SCHOOL_GOVERNORS for pole in pole_order
    ):
        return "mercury_pole_order_invalid"

    for facet in facets:
        if facet.get("writesCourtPoleDisposition") is not False:
            return "zodiac_court_write_forbidden"

    ch = document.get("compressionCoordinateContract", {}).get("CH", {})
    if ch.get("status") == "unresolved" and ch.get("value") is not None:
        return "ch_unresolved_guard_invalid"

    if (
        document.get("admissionBoundary", {}).get("physicalQuantityClaim") is not False
        or document.get("physicalClaimContract", {}).get("physicalQuantityClaim") is not False
    ):
        return "physical_claim_invalid"

    for win in document.get("winConditions", []):
        if (
            win.get("runtimeEnforced") is not False
            or win.get("policyEffect") is not False
            or win.get("ledgerSuccessEffect") is not False
            or win.get("containsExecutablePredicate") is not False
        ):
            return "teleology_boundary_invalid"

    active = document.get("activeCrossGraphRelations", {}).get("declaredActive", [])
    if set(active) != {"filter_projection"}:
        return "active_relation_forbidden"
    return None


def verify_candidate_document(document: dict[str, Any], root: Path = ROOT) -> None:
    fingerprint = document.get("candidateFingerprint")
    core = {key: value for key, value in document.items() if key != "candidateFingerprint"}
    if fingerprint != _sha256_payload(core):
        raise FivefoldTeleologyValidationError("candidate_fingerprint_mismatch")
    semantic_rejection = _semantic_rejection_code(document, root)
    if semantic_rejection is not None:
        raise FivefoldTeleologyValidationError(semantic_rejection)
    expected = _build_expected_candidate(root)
    if _serialize_candidate(document) != _serialize_candidate(expected):
        raise FivefoldTeleologyValidationError("candidate_does_not_match_independent_rebuild")
    try:
        jsonschema.Draft202012Validator(_read_json(CANDIDATE_SCHEMA_PATH)).validate(document)
    except jsonschema.ValidationError as error:
        raise FivefoldTeleologyValidationError("candidate_schema_invalid") from error


def _mutated_cases(document: dict[str, Any]) -> dict[str, dict[str, Any]]:
    cases: dict[str, dict[str, Any]] = {}

    tampered = deepcopy(document)
    next(
        item
        for item in tampered["capabilitySchools"]
        if item["schoolId"] == "fivefold.capability_school.air"
    )["schoolId"] = "fivefold.capability_school.fire"
    _rehash_record(
        next(
            item
            for item in tampered["capabilitySchools"]
            if item["schoolId"] == "fivefold.capability_school.fire"
        )
    )
    _rehash_candidate(tampered)
    cases["duplicate-school-id"] = tampered

    tampered = deepcopy(document)
    quintessence = next(
        item
        for item in tampered["capabilitySchools"]
        if item["element"] == "Quintessence"
    )
    quintessence["isBinaryCourtPole"] = True
    quintessence["courtPoleIndex"] = 4
    _rehash_record(quintessence)
    _rehash_candidate(tampered)
    cases["mercury-fifth-court-bit"] = tampered

    tampered = deepcopy(document)
    tampered["courtParityReplay"]["poleOrder"] = tampered["courtParityReplay"][
        "poleOrder"
    ] + ["Mercury"]
    _rehash_candidate(tampered)
    cases["mercury-in-pole-order"] = tampered

    tampered = deepcopy(document)
    facet = tampered["zodiacFacets"][0]
    facet["writesCourtPoleDisposition"] = True
    _rehash_record(facet)
    _rehash_candidate(tampered)
    cases["zodiac-writes-court-disposition"] = tampered

    tampered = deepcopy(document)
    solar = deepcopy(
        next(
            item
            for item in tampered["capabilitySchools"]
            if item["schoolId"] == "fivefold.capability_school.earth"
        )
    )
    solar["schoolId"] = "fivefold.capability_school.solar"
    solar["element"] = "Fire"
    solar["governorRef"] = "schemas/governors.yaml#governors.sun"
    _rehash_record(solar)
    tampered["capabilitySchools"].append(solar)
    tampered["capabilitySchools"].sort(key=lambda item: item["schoolId"])
    _rehash_candidate(tampered)
    cases["sun-moon-capability-school-pole"] = tampered

    tampered = deepcopy(document)
    tampered["compressionCoordinateContract"]["CH"]["value"] = 1
    _rehash_candidate(tampered)
    cases["numeric-ch-while-unresolved"] = tampered

    tampered = deepcopy(document)
    tampered["admissionBoundary"]["physicalQuantityClaim"] = True
    tampered["physicalClaimContract"]["physicalQuantityClaim"] = True
    _rehash_candidate(tampered)
    cases["physical-quantity-claim-true"] = tampered

    tampered = deepcopy(document)
    win = tampered["winConditions"][0]
    win["runtimeEnforced"] = True
    win["containsExecutablePredicate"] = True
    _rehash_record(win)
    _rehash_candidate(tampered)
    cases["win-condition-runtime-predicate"] = tampered

    tampered = deepcopy(document)
    tampered["activeCrossGraphRelations"]["declaredActive"] = (
        tampered["activeCrossGraphRelations"]["declaredActive"] + ["complement_map"]
    )
    _rehash_candidate(tampered)
    cases["active-complement-relation"] = tampered

    tampered = deepcopy(document)
    tampered["activeCrossGraphRelations"]["declaredActive"] = (
        tampered["activeCrossGraphRelations"]["declaredActive"] + ["SUBSET_OF_7_35"]
    )
    _rehash_candidate(tampered)
    cases["active-subset-of-7-35-relation"] = tampered

    tampered = deepcopy(document)
    tampered["sourceBindings"][0]["sha256"] = "0" * 64
    _rehash_candidate(tampered)
    cases["source-hash-drift"] = tampered

    tampered = deepcopy(document)
    next(
        item
        for item in tampered["capabilitySchools"]
        if item["schoolId"] == "fivefold.capability_school.earth"
    )["governorRef"] = "schemas/governors.yaml#governors.missing"
    _rehash_candidate(tampered)
    cases["unresolved-foreign-key"] = tampered

    return cases


def _adversarial_results(document: dict[str, Any], negative_fixture: dict[str, Any]) -> dict[str, str]:
    mutations = _mutated_cases(document)
    expected_codes = {item["caseId"]: item["expectedCode"] for item in negative_fixture["cases"]}
    if set(mutations) != set(expected_codes):
        raise FivefoldTeleologyValidationError("negative_case_implementation_mismatch")
    results = {}
    for case_id, mutated in mutations.items():
        try:
            verify_candidate_document(mutated, ROOT)
        except FivefoldTeleologyValidationError as error:
            results[case_id] = error.reason_code
        else:
            results[case_id] = "accepted_invalid_candidate"
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
        and len({item.get("checkId") for item in checks}) == len(checks)
        and report.get("checksPassed") == passed
        and report.get("checksFailed") == failed
        and report.get("verdict") == ("PASS" if failed == 0 else "FAIL")
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

    candidate_schema = _read_json(CANDIDATE_SCHEMA_PATH)
    try:
        jsonschema.Draft202012Validator(candidate_schema).validate(document)
        record("candidate-schema", True, "valid", str(CANDIDATE_SCHEMA_PATH))
    except jsonschema.ValidationError as error:
        record("candidate-schema", False, error.message, str(CANDIDATE_SCHEMA_PATH))

    negative_fixture = _read_json(NEGATIVE_CASES_PATH)
    try:
        jsonschema.Draft202012Validator(_read_json(NEGATIVE_SCHEMA_PATH)).validate(
            negative_fixture
        )
        record("negative-case-schema", True, "valid", str(NEGATIVE_SCHEMA_PATH))
    except jsonschema.ValidationError as error:
        record("negative-case-schema", False, error.message, str(NEGATIVE_SCHEMA_PATH))

    core = {key: value for key, value in document.items() if key != "candidateFingerprint"}
    fingerprint_match = document.get("candidateFingerprint") == _sha256_payload(core)
    record(
        "candidate-fingerprint",
        fingerprint_match,
        document.get("candidateFingerprint"),
        str(CANDIDATE_PATH),
        _sha256_payload(core),
        document.get("candidateFingerprint"),
    )

    source_bindings = _source_bindings(ROOT)
    bindings_match = document.get("sourceBindings") == source_bindings
    record(
        "source-binding-freshness",
        bindings_match,
        {"bindingCount": len(source_bindings)},
        str(CANDIDATE_PATH) + "#sourceBindings",
        source_bindings,
        document.get("sourceBindings"),
    )

    bad_records = []
    for item in (
        document.get("capabilitySchools", [])
        + document.get("zodiacFacets", [])
        + document.get("systemLevelFacets", [])
        + document.get("winConditions", [])
    ):
        item_core = {key: value for key, value in item.items() if key != "recordFingerprint"}
        if item.get("recordFingerprint") != _sha256_payload(item_core):
            bad_records.append(item.get("schoolId") or item.get("facetId") or item.get("winConditionId"))
    record("record-fingerprints", not bad_records, bad_records, str(CANDIDATE_PATH))

    expected = _build_expected_candidate(ROOT)
    rebuild_match = _serialize_candidate(document) == _serialize_candidate(expected)
    record(
        "independent-rebuild",
        rebuild_match,
        {
            "actual": document.get("candidateFingerprint"),
            "expected": expected["candidateFingerprint"],
        },
        AUTHORED_SOURCE_PATH,
        expected["candidateFingerprint"],
        document.get("candidateFingerprint"),
    )
    second = _build_expected_candidate(ROOT)
    record(
        "build-twice-identity",
        _serialize_candidate(expected) == _serialize_candidate(second),
        expected["candidateFingerprint"],
        GENERATOR_SCRIPT_PATH,
        expected["candidateFingerprint"],
        second["candidateFingerprint"],
    )
    reversed_input = _build_expected_candidate(ROOT, reverse_input=True)
    record(
        "reordered-input-identity",
        _serialize_candidate(expected) == _serialize_candidate(reversed_input),
        reversed_input["candidateFingerprint"],
        GENERATOR_SCRIPT_PATH,
        expected["candidateFingerprint"],
        reversed_input["candidateFingerprint"],
    )

    identity_ok = (
        document.get("schemaVersion") == SCHEMA_VERSION
        and document.get("candidateId") == CANDIDATE_ID
        and document.get("registryId") == REGISTRY_ID
        and document.get("version") == "1.0.0"
        and document.get("storyId") == "CRT-347"
        and document.get("metadata", {}).get("followOnStoryId") == "CRT-348"
        and len(
            {
                item["schoolId"]
                for item in document.get("capabilitySchools", [])
            }
        )
        == 5
        and len(
            {
                item["facetId"]
                for item in document.get("zodiacFacets", [])
                + document.get("systemLevelFacets", [])
            }
        )
        == 12
    )
    record(
        "FCT-001-schema-and-identity",
        identity_ok,
        "identity fields and stable-ID uniqueness",
        str(CANDIDATE_PATH) + "#metadata",
        "crt-347.fivefold-capability-teleology.v1 / CRT-347",
        {
            "schemaVersion": document.get("schemaVersion"),
            "storyId": document.get("storyId"),
            "followOnStoryId": document.get("metadata", {}).get("followOnStoryId"),
        },
    )

    record(
        "FCT-002-source-bindings",
        bindings_match and len(source_bindings) == 8,
        {"bindingCount": len(source_bindings)},
        str(CANDIDATE_PATH) + "#sourceBindings",
        8,
        len(source_bindings),
    )

    namespace_ok = (
        not _has_unqualified_capability_identity(document)
        and all(
            not identifier.startswith(FORBIDDEN_ID_PREFIXES)
            and identifier not in FORBIDDEN_CAPABILITY_IDS
            for identifier in school_ids(document)
            + facet_ids(document)
            + win_condition_ids(document)
        )
    )
    record(
        "FCT-003-namespace-separation",
        namespace_ok,
        "no unqualified capability identity; no runtime capability-ID collision",
        str(CANDIDATE_PATH) + "#capabilitySchools",
    )

    schools = document.get("capabilitySchools", [])
    binary_count = sum(item.get("isBinaryCourtPole") is True for item in schools)
    meta_count = sum(
        item.get("element") == "Quintessence" and item.get("isBinaryCourtPole") is False
        for item in schools
    )
    cardinality_ok = len(schools) == 5 and binary_count == 4 and meta_count == 1
    record(
        "FCT-004-school-cardinality",
        cardinality_ok,
        {"schools": len(schools), "binaryPoles": binary_count, "quintessenceMeta": meta_count},
        str(CANDIDATE_PATH) + "#capabilitySchools",
        {"schools": 5, "binaryPoles": 4, "quintessenceMeta": 1},
        {"schools": len(schools), "binaryPoles": binary_count, "quintessenceMeta": meta_count},
    )

    parity_expected = _expected_court_parity_replay(ROOT)
    parity_match = document.get("courtParityReplay") == parity_expected
    record(
        "FCT-005-court-parity",
        parity_match,
        parity_expected,
        str(CANDIDATE_PATH) + "#courtParityReplay",
        parity_expected,
        document.get("courtParityReplay"),
    )

    mercury_exclusion_ok = (
        document.get("courtParityReplay", {}).get("poleOrder")
        == list(ELEMENTAL_SCHOOL_GOVERNORS)
        and all(
            "Mercury" not in item.get("internalPoles", [])
            for item in document.get("courtParityReplay", {}).get("positions", [])
        )
        and all(
            item.get("element") != "Quintessence" or item.get("courtPoleIndex") is None
            for item in schools
        )
    )
    record(
        "FCT-006-mercury-exclusion",
        mercury_exclusion_ok,
        "Mercury absent from poleOrder, positions, and pole indices",
        str(CANDIDATE_PATH) + "#courtParityReplay",
        list(ELEMENTAL_SCHOOL_GOVERNORS),
        document.get("courtParityReplay", {}).get("poleOrder"),
    )

    partition_ok = (
        len(document.get("zodiacFacets", [])) == 10
        and len(document.get("systemLevelFacets", [])) == 2
        and all(
            item.get("facetCategory") == "capability_school_facet"
            for item in document.get("zodiacFacets", [])
        )
        and all(
            item.get("facetCategory") == "system_level_facet"
            and item.get("governorType") == "monopolar_luminary"
            for item in document.get("systemLevelFacets", [])
        )
    )
    record(
        "FCT-007-zodiac-partition",
        partition_ok,
        {
            "schoolFacets": len(document.get("zodiacFacets", [])),
            "systemFacets": len(document.get("systemLevelFacets", [])),
        },
        str(CANDIDATE_PATH) + "#zodiacFacets",
        {"schoolFacets": 10, "systemFacets": 2},
        {
            "schoolFacets": len(document.get("zodiacFacets", [])),
            "systemFacets": len(document.get("systemLevelFacets", [])),
        },
    )

    governors = _load_governors(ROOT)
    zodiac_replay_failures = []
    for item in document.get("zodiacFacets", []) + document.get("systemLevelFacets", []):
        governor_key = item["governorRef"].rsplit(".", 1)[1]
        governor = governors.get(governor_key)
        if governor is None:
            zodiac_replay_failures.append(f"{item['facetId']}:missing-governor")
            continue
        source = governor.get("zodiacal_systems", {}).get(item["zodiac"])
        if source is None or source.get("derives_from") != item["derivesFrom"]:
            zodiac_replay_failures.append(f"{item['facetId']}:derives-from-mismatch")
            continue
        field = item["derivesFrom"].rsplit(".", 1)[1]
        if governor["canonical_expression"].get(field) != item["sourceVector"]:
            zodiac_replay_failures.append(f"{item['facetId']}:vector-mismatch")
        if item.get("polarity") == "Internal":
            if (
                item.get("t1Relation") is None
                or item.get("inversionRelation") is None
                or item["t1Relation"].get("matches") is not True
                or item["inversionRelation"].get("matches") is not True
                or item["inversionRelation"].get("publishedWitnessAxis")
                != PUBLISHED_INVERSION_WITNESS_AXES.get(governor_key.capitalize())
            ):
                zodiac_replay_failures.append(f"{item['facetId']}:transform-mismatch")
    record(
        "FCT-008-zodiac-replay",
        not zodiac_replay_failures,
        zodiac_replay_failures,
        str(CANDIDATE_PATH) + "#zodiacFacets",
        [],
        zodiac_replay_failures,
    )

    forbidden_write_ok = (
        all(
            item.get("writesCourtPoleDisposition") is False
            for item in document.get("zodiacFacets", []) + document.get("systemLevelFacets", [])
        )
        and document.get("separationContract", {}).get("semanticFieldWritesCourtRegister")
        is False
    )
    record(
        "FCT-009-forbidden-write-guard",
        forbidden_write_ok,
        "no zodiac, school, or contract field writes court.poleDisposition",
        str(CANDIDATE_PATH) + "#zodiacFacets",
        False,
        [
            item.get("writesCourtPoleDisposition")
            for item in document.get("zodiacFacets", [])
        ],
    )

    compression = document.get("compressionCoordinateContract", {})
    physical = document.get("physicalClaimContract", {})
    physics_ok = (
        compression.get("CH", {}).get("status") == "unresolved"
        and compression.get("CH", {}).get("value") is None
        and compression.get("CH", {}).get("writableByThisRegistry") is False
        and compression.get("CP", {}).get("writableByThisRegistry") is False
        and compression.get("CS", {}).get("access") == "shade_only"
        and document.get("admissionBoundary", {}).get("physicalQuantityClaim") is False
        and physical.get("physicalQuantityClaim") is False
        and physical.get("noSiUnits") is True
        and physical.get("noElectromagneticEquivalence") is True
        and physical.get("noEnergyEquations") is True
        and physical.get("noPhysicalCausation") is True
    )
    record(
        "FCT-010-compression-physics-guard",
        physics_ok,
        compression.get("CH"),
        str(CANDIDATE_PATH) + "#compressionCoordinateContract",
        {"status": "unresolved", "value": None},
        compression.get("CH"),
    )

    win_ok = all(
        item.get("classification") == "authored_teleology"
        and item.get("runtimeEnforced") is False
        and item.get("policyEffect") is False
        and item.get("ledgerSuccessEffect") is False
        and item.get("admissionEffect") is False
        and item.get("containsExecutablePredicate") is False
        for item in document.get("winConditions", [])
    )
    record(
        "FCT-011-teleology-boundary",
        win_ok,
        {"winConditionCount": len(document.get("winConditions", []))},
        str(CANDIDATE_PATH) + "#winConditions",
        "authored-only teleology",
        [
            item.get("classification")
            for item in document.get("winConditions", [])
        ],
    )

    source_authority_text = (ROOT / "provenance/SOURCE_AUTHORITY.md").read_text(
        encoding="utf-8"
    )
    generator_text = (ROOT / GENERATOR_SCRIPT_PATH).read_text(encoding="utf-8")
    validator_text = Path(__file__).read_text(encoding="utf-8")

    def _script_imports_runtime(text: str) -> bool:
        for line in text.splitlines():
            stripped = line.strip()
            if not stripped.startswith(("import ", "from ")):
                continue
            if any(token in line for token in FORBIDDEN_IMPORT_TOKENS):
                return True
        return False

    hygiene_ok = not (
        _script_imports_runtime(generator_text)
        or _script_imports_runtime(validator_text)
    )
    boundary_ok = (
        document.get("status") == "planning_evidence"
        and document.get("admissionEffect") == "none"
        and document.get("activeCrossGraphRelations", {}).get("declaredActive")
        == ["filter_projection"]
        and document.get("activeCrossGraphRelations", {}).get("declaredInactive")
        == ["complement_map", "SUBSET_OF_7_35"]
        and document.get("promotionInventoryReplay", {}).get("role")
        == "read_only_evidence_for_crt_348"
        and len(
            document.get("promotionInventoryReplay", {}).get(
                "eligibleForPromotionAtCrt309", []
            )
        )
        == 10
        and "fivefold-capability-teleology-v1.json" in source_authority_text
        and "planning_evidence" in source_authority_text
        and hygiene_ok
    )
    record(
        "FCT-012-determinism-admission-boundary",
        boundary_ok,
        {
            "status": document.get("status"),
            "declaredActive": document.get("activeCrossGraphRelations", {}).get(
                "declaredActive"
            ),
            "promotionItemCount": len(
                document.get("promotionInventoryReplay", {}).get(
                    "eligibleForPromotionAtCrt309", []
                )
            ),
            "scriptHygiene": hygiene_ok,
            "sourceAuthorityRowPresent": "fivefold-capability-teleology-v1.json"
            in source_authority_text,
        },
        str(CANDIDATE_PATH) + "#status",
        "planning_evidence with no Stage 2 authority",
        {
            "status": document.get("status"),
            "declaredActive": document.get("activeCrossGraphRelations", {}).get(
                "declaredActive"
            ),
        },
    )

    fixture_case_ids = tuple(item["caseId"] for item in negative_fixture.get("cases", []))
    record(
        "negative-case-closure",
        fixture_case_ids == NEGATIVE_CASE_IDS
        and tuple(document.get("negativeCaseIds", [])) == NEGATIVE_CASE_IDS,
        list(fixture_case_ids),
        str(NEGATIVE_CASES_PATH),
        list(NEGATIVE_CASE_IDS),
        list(fixture_case_ids),
    )
    adversarial = _adversarial_results(document, negative_fixture)
    expected_codes = {item["caseId"]: item["expectedCode"] for item in negative_fixture["cases"]}
    record(
        "adversarial-rejection",
        adversarial == expected_codes,
        adversarial,
        str(NEGATIVE_CASES_PATH),
        expected_codes,
        adversarial,
    )

    failures = [item for item in checks if item["status"] == "FAIL"]
    report_core = {
        "candidateFingerprint": document.get("candidateFingerprint", "0" * 64),
        "candidateId": CANDIDATE_ID,
        "checks": checks,
        "checksFailed": len(failures),
        "checksPassed": len(checks) - len(failures),
        "schemaVersion": REPORT_SCHEMA_VERSION,
        "verdict": "FAIL" if failures else "PASS",
    }
    report = {**report_core, "reportFingerprint": _sha256_payload(report_core)}
    if not _report_shape_valid(report):
        raise FivefoldTeleologyValidationError("validation_report_shape_invalid")
    return report


def school_ids(document: dict[str, Any]) -> list[str]:
    return [item.get("schoolId", "") for item in document.get("capabilitySchools", [])]


def facet_ids(document: dict[str, Any]) -> list[str]:
    return [
        item.get("facetId", "")
        for item in document.get("zodiacFacets", []) + document.get("systemLevelFacets", [])
    ]


def win_condition_ids(document: dict[str, Any]) -> list[str]:
    return [item.get("winConditionId", "") for item in document.get("winConditions", [])]


def main() -> int:
    document = _read_json(CANDIDATE_PATH)
    report = validate(document)
    REPORT_PATH.write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0 if report["verdict"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
