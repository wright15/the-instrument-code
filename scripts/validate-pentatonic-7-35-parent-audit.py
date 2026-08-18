#!/usr/bin/env python3
"""Independently validate the Phase 1 pentatonic-to-7-35 audit."""

from __future__ import annotations

from copy import deepcopy
import csv
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
    / "canonical/pentatonic-binding-candidates/pentatonic-7-35-parent-audit-v1.json"
)
NEGATIVE_CASES_PATH = (
    ROOT / "canonical/pentatonic-binding-candidates/negative-cases-v1.json"
)
CANDIDATE_SCHEMA_PATH = (
    ROOT
    / "schemas/pentatonic-binding/pentatonic-7-35-parent-audit-v1.schema.json"
)
NEGATIVE_SCHEMA_PATH = (
    ROOT
    / "schemas/pentatonic-binding/pentatonic-7-35-negative-cases-v1.schema.json"
)
REPORT_SCHEMA_PATH = (
    ROOT / "schemas/pentatonic-binding/pentatonic-7-35-validation-report-v1.schema.json"
)
REPORT_PATH = ROOT / "qa/pentatonic-7-35-parent-audit-validation.json"

SCHEMA_VERSION = "pre-epic-400.pentatonic-7-35-parent-audit.v1"
CANDIDATE_ID = "pentatonic-7-35-parent-audit-v1"
SPECIFICATION_ID = "pre-epic-400.pentatonic-7-35-binding.v1"
REPORT_SCHEMA_VERSION = "pre-epic-400.pentatonic-7-35-parent-audit-validation.v1"
UNIVERSAL_MASK = 4095
IONIAN_MASK = sum(1 << pitch for pitch in (0, 2, 4, 5, 7, 9, 11))

SOURCE_SPECS = (
    ("audit-specification", "docs/PENTATONIC_GRAPH_BINDING_AUDIT_SPEC.md", "corrected Phase 0 contract"),
    ("bridge-rootings", "seven-governors-court-substrate-v0.1.0/canonical/bridge-rootings.json", "reviewed admitted bridge realizations"),
    ("canonical-network", "canonical/universal-network-data.json", "authoritative rooted topology and Governor offices"),
    ("complement-map", "seven-governors-court-substrate-v0.1.0/canonical/complement-map.json", "frozen exact-complement evidence"),
    ("court-admission-authority", "docs/COURT_ADMISSION_AND_AUTHORITY.md", "Court namespace and write boundary"),
    ("court-admission-contract", "schemas/court-admission-contract.json", "machine-readable Court authority boundary"),
    ("court-admission-release", "provenance/court-admission-release.json", "current bounded Court admission"),
    ("court-rooted-positions", "seven-governors-court-substrate-v0.1.0/canonical/court-rooted-positions.json", "reviewed C0-C4 realizations"),
    ("governor-domain-authority", "docs/GOVERNOR_DOMAIN_AUTHORITY.md", "Governor and zodiac namespace boundary"),
    ("governor-offices", "neo4j/csv/governor-offices.csv", "canonical Governor mode and ScaleState IDs"),
    ("governor-registry", "schemas/governors.yaml", "constructive, internal-pole, and zodiac source vectors"),
    ("pentatonic-registry", "seven-governors-court-substrate-v0.1.0/canonical/pentatonic-set-class-registry.json", "complete 38-class registry"),
    ("pitch-class-lexicon", "court-mathematics/docs/01_COURT_LEXICON.md", "pitch-mask and relation definitions"),
    ("source-authority", "provenance/SOURCE_AUTHORITY.md", "release authority precedence"),
)

NEGATIVE_CASE_IDS = (
    "universal-three-parent-claim",
    "five-32-parent-promotion",
    "mars-pair-complement-substitution",
    "coordinate-collision-1321",
    "c2-c4-parent-window-swap",
    "class-as-subset-endpoint",
    "complement-as-parent-edge",
    "source-hash-drift",
    "pitch-set-parent-tamper",
)

RELATION_GUARDS = (
    {
        "guardId": "exact-realization-subset-endpoint",
        "status": "enforced",
        "statement": "Only exact or rooted realizations may be subset-edge endpoints; a TnI class summary may not be one.",
    },
    {
        "guardId": "complement-not-parent",
        "status": "enforced",
        "statement": "Exact complement evidence is disjoint from its pentatonic source and is not parent incidence.",
    },
    {
        "guardId": "projection-requires-filter-provenance",
        "status": "enforced",
        "statement": "Subset incidence does not authorize an unqualified PROJECTS_TO relation.",
    },
    {
        "guardId": "raw-complement-not-normalized-state",
        "status": "enforced",
        "statement": "A raw root-0 complement is not identical to its separately normalized ScaleState pointer.",
    },
    {
        "guardId": "active-graph-effect-none",
        "status": "enforced",
        "statement": "This candidate has no active Neo4j, runtime, topology, zodiac, or admission effect.",
    },
)

EXPECTED_EXACT_DISTRIBUTION = {0: 612, 1: 120, 2: 48, 3: 12}
EXPECTED_CLASS_DISTRIBUTION = {
    3: ("5-35",),
    2: ("5-23", "5-27"),
    1: ("5-Z12", "5-20", "5-24", "5-25", "5-29", "5-34"),
}
EXPECTED_WINDOWS = {
    "court-position:C0": ("Sun", "Moon", "Mars"),
    "court-position:C1": ("Moon", "Mars", "Mercury"),
    "court-position:C2": ("Mars", "Mercury", "Jupiter"),
    "court-position:C3": ("Mercury", "Jupiter", "Venus"),
    "court-position:C4": ("Jupiter", "Venus", "Saturn"),
    "bridge-rooting:5-23:aeolian-harmonic-minor": ("Mercury", "Jupiter"),
    "bridge-rooting:5-27:aeolian-harmonic-minor": ("Jupiter", "Venus"),
}
EXPECTED_INVERSION_WITNESSES = {
    "Mercury": 1,
    "Venus": 9,
    "Mars": 3,
    "Jupiter": 11,
    "Saturn": 7,
}
REPORT_CHECK_IDS = (
    "candidate-schema",
    "negative-case-schema",
    "candidate-fingerprint",
    "source-binding-freshness",
    "record-fingerprints",
    "independent-rebuild",
    "build-twice-identity",
    "reordered-input-identity",
    "universe-and-incidence-closure",
    "forte-class-discriminator",
    "reviewed-rooted-parent-windows",
    "complement-parent-separation",
    "bipolar-vector-relations",
    "mars-coordinate-namespace-guard",
    "relation-guard-closure",
    "admission-boundary",
    "negative-case-closure",
    "adversarial-rejection",
    "intrinsic-environment-independence",
)


class PentatonicAuditValidationError(ValueError):
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
    if isinstance(value, list) or isinstance(value, tuple):
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


def _pitch_classes(mask: int) -> tuple[int, ...]:
    if type(mask) is not int or not 0 <= mask <= UNIVERSAL_MASK:
        raise PentatonicAuditValidationError("mask_out_of_range")
    return tuple(pitch for pitch in range(12) if mask & (1 << pitch))


def _mask_from_pitches(pitches: Any) -> int:
    values = tuple(pitches)
    if any(type(value) is not int or not 0 <= value < 12 for value in values):
        raise PentatonicAuditValidationError("pitch_class_out_of_range")
    if len(set(values)) != len(values):
        raise PentatonicAuditValidationError("pitch_class_duplicate")
    return sum(1 << value for value in values)


def _transpose(mask: int, step: int) -> int:
    return sum(1 << ((pitch + step) % 12) for pitch in _pitch_classes(mask))


def _invert(mask: int, axis: int) -> int:
    return sum(1 << ((axis - pitch) % 12) for pitch in _pitch_classes(mask))


def _prime_form(mask: int) -> tuple[int, ...]:
    candidates = set()
    for index in range(12):
        for transformed in (_transpose(mask, index), _invert(mask, index)):
            pitches = _pitch_classes(transformed)
            if pitches and pitches[0] == 0:
                candidates.add(pitches)
    if not candidates:
        return ()
    return min(candidates, key=lambda pitches: (pitches[-1],) + pitches[1:-1])


def _pitch_mask12(mask: int) -> str:
    return "".join("1" if mask & (1 << pitch) else "0" for pitch in range(12))


def _mask_from_pitch_mask12(value: str) -> int:
    if not isinstance(value, str) or len(value) != 12 or set(value) - {"0", "1"}:
        raise PentatonicAuditValidationError("pitch_mask12_invalid")
    return sum(1 << index for index, bit in enumerate(value) if bit == "1")


def _record_with_fingerprint(core: dict[str, Any]) -> dict[str, Any]:
    return {**core, "recordFingerprint": _sha256_payload(core)}


def _source_bindings(root: Path) -> list[dict[str, str]]:
    records = []
    for binding_id, relative_path, role in SOURCE_SPECS:
        path = root / relative_path
        records.append(
            {
                "bindingId": binding_id,
                "path": relative_path,
                "role": role,
                "sha256": _sha256_bytes(path.read_bytes()),
            }
        )
    return sorted(records, key=lambda item: item["bindingId"])


def _load_offices(path: Path, reverse_input: bool) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8") as handle:
        rows = list(csv.DictReader(handle))
    if reverse_input:
        rows.reverse()
    return rows


def _load_canonical_offices(
    network: dict[str, Any], reverse_input: bool
) -> list[dict[str, Any]]:
    rows = [
        {
            "canonical_mode": node["name"],
            "canonical_scale_id": node["id"],
            "office": node["office"],
            "office_index": node["officeIndex"],
        }
        for node in network["nodes"]
        if node.get("forte") == "7-35"
        and node.get("tier") == "A0"
        and node.get("role") == "anchor"
        and node.get("assignmentStatus") == "canonical"
    ]
    if reverse_input:
        rows.reverse()
    if len(rows) != 7:
        raise PentatonicAuditValidationError("canonical_governor_office_count_mismatch")
    return rows


def _assert_projection_offices(
    canonical_offices: list[dict[str, Any]], projection_offices: list[dict[str, str]]
) -> None:
    canonical = sorted(
        (
            item["office"],
            int(item["office_index"]),
            int(item["canonical_scale_id"]),
            item["canonical_mode"],
        )
        for item in canonical_offices
    )
    projected = sorted(
        (
            item["office"],
            int(item["office_index"]),
            int(item["canonical_scale_id"]),
            item["canonical_mode"],
        )
        for item in projection_offices
    )
    if canonical != projected:
        raise PentatonicAuditValidationError("governor_office_projection_drift")


def _build_class_membership(
    registry_records: list[dict[str, Any]],
) -> tuple[dict[int, dict[str, Any]], dict[str, dict[str, Any]]]:
    class_by_mask: dict[int, dict[str, Any]] = {}
    class_by_id: dict[str, dict[str, Any]] = {}
    for item in registry_records:
        representative = item["representativeMask"]
        if len(_pitch_classes(representative)) != 5:
            raise PentatonicAuditValidationError("registry_representative_not_pentatonic")
        orbit = {
            transformed
            for index in range(12)
            for transformed in (_transpose(representative, index), _invert(representative, index))
        }
        for mask in orbit:
            existing = class_by_mask.get(mask)
            if existing is not None and existing["setClassId"] != item["setClassId"]:
                raise PentatonicAuditValidationError("registry_tni_orbit_overlap")
            class_by_mask[mask] = item
        class_by_id[item["setClassId"]] = item
    if len(class_by_mask) != 792 or len(class_by_id) != 38:
        raise PentatonicAuditValidationError("registry_tni_partition_mismatch")
    return class_by_mask, class_by_id


def _assert_current_admission_release(
    release: dict[str, Any], registry_records: list[dict[str, Any]]
) -> None:
    admitted = release.get("admittedScope", {})
    proposed = release.get("proposedScope", {})
    proposed_classes = proposed.get("pentatonicSetClasses", [])
    expected_proposed = sorted(
        item["forteNumber"]
        for item in registry_records
        if item["admissionStatus"] == "proposed"
    )
    if (
        release.get("status") != "admitted"
        or release.get("admissionGate") != "CRT-309"
        or admitted.get("canonicalSetClass") != "5-35"
        or admitted.get("canonicalRootedPositions") != ["C0", "C1", "C2", "C3", "C4"]
        or admitted.get("bridgeSetClasses") != ["5-23", "5-27"]
        or proposed.get("pentatonicSetClassCount") != 35
        or len(proposed_classes) != 35
        or len(set(proposed_classes)) != 35
        or sorted(proposed_classes) != expected_proposed
        or "ComplementMap" not in release.get("projectionRuling", {}).get(
            "explicitlyNotClaimed", []
        )
    ):
        raise PentatonicAuditValidationError("current_court_admission_release_mismatch")


def _build_expected_candidate(root: Path, *, reverse_input: bool = False) -> dict[str, Any]:
    source_bindings = _source_bindings(root)
    registry = _read_json(
        root
        / "seven-governors-court-substrate-v0.1.0/canonical/pentatonic-set-class-registry.json"
    )
    complement = _read_json(
        root / "seven-governors-court-substrate-v0.1.0/canonical/complement-map.json"
    )
    positions = _read_json(
        root / "seven-governors-court-substrate-v0.1.0/canonical/court-rooted-positions.json"
    )
    bridges = _read_json(
        root / "seven-governors-court-substrate-v0.1.0/canonical/bridge-rootings.json"
    )
    canonical_network = _read_json(root / "canonical/universal-network-data.json")
    governors_doc = yaml.safe_load((root / "schemas/governors.yaml").read_text(encoding="utf-8"))
    admission_release = _read_json(root / "provenance/court-admission-release.json")
    projected_offices = _load_offices(root / "neo4j/csv/governor-offices.csv", reverse_input)
    offices = _load_canonical_offices(canonical_network, reverse_input)
    _assert_projection_offices(offices, projected_offices)

    registry_records = list(registry["pentatonicSetClasses"])
    complement_records = list(complement["complementMaps"])
    position_records = list(positions["courtRootedPositions"])
    bridge_records = list(bridges["bridgeRootings"])
    governor_records = dict(governors_doc["governors"])
    if reverse_input:
        registry_records.reverse()
        complement_records.reverse()
        position_records.reverse()
        bridge_records.reverse()
        governor_records = dict(reversed(tuple(governor_records.items())))

    _assert_current_admission_release(admission_release, registry_records)

    class_by_mask, class_by_id = _build_class_membership(registry_records)
    diatonic_masks = tuple(sorted({_transpose(IONIAN_MASK, step) for step in range(12)}))
    pitch_records = []
    for mask in range(UNIVERSAL_MASK + 1):
        if mask.bit_count() != 5:
            continue
        class_item = class_by_mask[mask]
        parent_masks = [parent for parent in diatonic_masks if mask & parent == mask]
        core = {
            "forteNumber": class_item["forteNumber"],
            "parentCount": len(parent_masks),
            "parentMasks": parent_masks,
            "pitchClasses": list(_pitch_classes(mask)),
            "pitchMask": mask,
            "pitchMask12": _pitch_mask12(mask),
            "recordId": f"pentatonic-mask:{mask}",
            "setClassId": class_item["setClassId"],
        }
        pitch_records.append(_record_with_fingerprint(core))

    records_by_class: dict[str, list[dict[str, Any]]] = {}
    for record in pitch_records:
        records_by_class.setdefault(record["setClassId"], []).append(record)
    class_summaries = []
    for item in sorted(registry_records, key=lambda value: value["forteOrdinal"]):
        members = records_by_class[item["setClassId"]]
        counts = {member["parentCount"] for member in members}
        if len(counts) != 1:
            raise PentatonicAuditValidationError("class_parent_count_not_invariant")
        class_summaries.append(
            {
                "admissionStatus": item["admissionStatus"],
                "complementMapId": item["complementMapId"],
                "forteNumber": item["forteNumber"],
                "forteOrdinal": item["forteOrdinal"],
                "parentCountPerRealization": next(iter(counts)),
                "primeForm": list(_prime_form(item["representativeMask"])),
                "realizationCount": len(members),
                "representativeMask": item["representativeMask"],
                "setClassId": item["setClassId"],
            }
        )

    pitch_by_mask = {item["pitchMask"]: item for item in pitch_records}
    complement_by_class = {
        item["pentatonicSetClassId"]: item for item in complement_records
    }
    office_rows = sorted(offices, key=lambda row: int(row["office_index"]))
    reviewed: list[tuple[int, int, str, dict[str, Any]]] = []
    for item in position_records:
        reviewed.append((0, int(item["positionId"][1:]), f"court-position:{item['positionId']}", item))
    for item in bridge_records:
        reviewed.append(
            (
                1,
                class_by_id[item["setClassId"]]["forteOrdinal"],
                item["bridgeRootingId"],
                item,
            )
        )
    witnesses = []
    for witness_order, _, witness_id, item in sorted(reviewed):
        class_item = class_by_id[item["setClassId"]]
        if (
            _mask_from_pitches(item["pitchClasses"]) != item["pitchMask"]
            or _pitch_mask12(item["pitchMask"]) != item["pitchMask12"]
            or item["rootPc"] not in item["pitchClasses"]
        ):
            raise PentatonicAuditValidationError("rooted_witness_representation_mismatch")
        parent_states = []
        for office in office_rows:
            scale_mask = int(office["canonical_scale_id"])
            if item["pitchMask"] & scale_mask == item["pitchMask"]:
                parent_states.append(
                    {
                        "governor": office["office"],
                        "mode": office["canonical_mode"],
                        "officeIndex": int(office["office_index"]),
                        "scaleStateId": scale_mask,
                    }
                )
        if sorted(parent["scaleStateId"] for parent in parent_states) != pitch_by_mask[
            item["pitchMask"]
        ]["parentMasks"]:
            raise PentatonicAuditValidationError("rooted_parent_resolution_mismatch")
        map_record = complement_by_class[item["setClassId"]]
        rooted_pair = next(
            pair for pair in map_record["rootedPairs"] if pair["rootedRecordId"] == witness_id
        )
        if (
            rooted_pair["pentatonicMask"] != item["pitchMask"]
            or rooted_pair["rawHeptatonicComplementMask"]
            != (UNIVERSAL_MASK ^ item["pitchMask"])
        ):
            raise PentatonicAuditValidationError("rooted_complement_source_mismatch")
        normalized_node = next(
            (
                node
                for node in canonical_network["nodes"]
                if node["id"] == rooted_pair["normalizedHeptatonicScaleStateId"]
            ),
            None,
        )
        if normalized_node is None or normalized_node.get("forte") != map_record[
            "heptatonicFamilyId"
        ]:
            raise PentatonicAuditValidationError("normalized_complement_family_mismatch")
        witnesses.append(
            {
                "admissionStatus": item["admissionStatus"],
                "complementEvidence": {
                    "complementMapId": map_record["complementMapId"],
                    "normalizedHeptatonicScaleStateId": rooted_pair[
                        "normalizedHeptatonicScaleStateId"
                    ],
                    "rawHeptatonicComplementMask": rooted_pair[
                        "rawHeptatonicComplementMask"
                    ],
                    "relationAdmission": "frozen_evidence_not_active_graph_relation",
                },
                "forteNumber": class_item["forteNumber"],
                "parentCount": len(parent_states),
                "parentScaleStates": parent_states,
                "pitchClasses": item["pitchClasses"],
                "pitchMask": item["pitchMask"],
                "pitchMask12": item["pitchMask12"],
                "rootPc": item["rootPc"],
                "setClassId": item["setClassId"],
                "witnessId": witness_id,
                "witnessType": "court_position" if witness_order == 0 else "bridge_rooting",
            }
        )

    office_by_name = {row["office"].lower(): row for row in offices}
    vectors = []
    for governor_id, governor in governor_records.items():
        if governor.get("type") != "bipolar_engine_governor":
            continue
        office = office_by_name[governor_id]
        expression = governor["canonical_expression"]
        constructive = expression["binary_12bit"]
        internal = expression["binary_12bit_lsb"]
        canonical_mask = _mask_from_pitch_mask12(constructive)
        internal_mask = _mask_from_pitch_mask12(internal)
        if (
            canonical_mask != int(office["canonical_scale_id"])
            or int(expression["mode_details"]["decimal"]) != canonical_mask
        ):
            raise PentatonicAuditValidationError("governor_canonical_mask_mismatch")
        t1_mask = _transpose(canonical_mask, 1)
        inversion_axes = [axis for axis in range(12) if _invert(canonical_mask, axis) == internal_mask]
        if len(inversion_axes) != 1:
            raise PentatonicAuditValidationError("bipolar_inversion_witness_mismatch")
        complement_string = "".join("0" if bit == "1" else "1" for bit in constructive)
        vectors.append(
            {
                "canonicalPitchMask": canonical_mask,
                "complementMatchesInternal": complement_string == internal,
                "complementPitchMask": UNIVERSAL_MASK ^ canonical_mask,
                "complementString": complement_string,
                "constructiveInteger": int(constructive, 2),
                "constructiveString": constructive,
                "governor": office["office"],
                "internalPitchMask": internal_mask,
                "internalString": internal,
                "inversionMatches": _invert(canonical_mask, inversion_axes[0]) == internal_mask,
                "inversionWitness": inversion_axes[0],
                "mode": office["canonical_mode"],
                "officeIndex": int(office["office_index"]),
                "t1Matches": t1_mask == internal_mask,
                "t1String": _pitch_mask12(t1_mask),
            }
        )
    vectors.sort(key=lambda item: item["officeIndex"])
    mars = next(item for item in vectors if item["governor"] == "Mars")

    distribution = [
        {
            "parentCount": count,
            "pitchSetCount": sum(1 for item in pitch_records if item["parentCount"] == count),
        }
        for count in range(4)
    ]
    core = {
        "admissionEffect": "none",
        "authority": "root_owned_non_admitted_audit_sidecar",
        "candidateId": CANDIDATE_ID,
        "classSummaries": class_summaries,
        "negativeCaseIds": list(NEGATIVE_CASE_IDS),
        "pitchSetRecords": pitch_records,
        "relationGuards": list(RELATION_GUARDS),
        "representationChecks": {
            "bipolarGovernorVectors": vectors,
            "marsCoordinateGuard": {
                "canonicalPitchMask": mars["canonicalPitchMask"],
                "complementCanonicalPitchMask": mars["complementPitchMask"],
                "complementConstructiveInteger": int(mars["complementString"], 2),
                "constructiveInteger": mars["constructiveInteger"],
                "coordinateCollisionIsIdentity": False,
                "courtC4PitchMask": 1321,
            },
        },
        "representationPolicy": {
            "binary12bitLsbObservedRelation": "T1_with_coincident_inversion_witness",
            "canonicalPitchMaskDefinition": "sum(2^p for p in P)",
            "constructiveIntegerDefinition": "parse_as_written_msb_integer",
            "ordinaryBinaryParseOfPitchMask12Forbidden": True,
            "pitchMask12Definition": "b0_through_b11_pitch_class_order",
            "relationSeparation": [
                "parent_incidence_is_subset",
                "exact_complement_is_not_parent",
                "transposition_and_inversion_are_distinct_operators",
                "projection_requires_filter_provenance",
            ],
            "universalMask": UNIVERSAL_MASK,
        },
        "reviewedRootedWitnesses": witnesses,
        "schemaVersion": SCHEMA_VERSION,
        "scope": {
            "activeGraphEffect": "none",
            "crt310Execution": False,
            "diatonicSetClass": "7-35",
            "diatonicSetCount": len(diatonic_masks),
            "fiveNoteSetCount": len(pitch_records),
            "pitchClassModulus": 12,
            "reviewedRootedWitnessCount": len(witnesses),
            "setClassCount": len(class_summaries),
            "tuning": "12-TET",
        },
        "sourceBindings": source_bindings,
        "specificationId": SPECIFICATION_ID,
        "status": "planning_evidence",
        "universeSummary": {
            "diatonicMasks": list(diatonic_masks),
            "incidenceCount": sum(item["parentCount"] for item in pitch_records),
            "maximumParentCount": max(item["parentCount"] for item in pitch_records),
            "parentCountDistribution": distribution,
            "pitchSetCount": len(pitch_records),
        },
    }
    document = {**core, "candidateFingerprint": _sha256_payload(core)}
    if _source_bindings(root) != source_bindings:
        raise PentatonicAuditValidationError("source_changed_during_build")
    return document


def _rehash_candidate(document: dict[str, Any]) -> None:
    core = {key: value for key, value in document.items() if key != "candidateFingerprint"}
    document["candidateFingerprint"] = _sha256_payload(core)


def _rehash_pitch_record(record: dict[str, Any]) -> None:
    core = {key: value for key, value in record.items() if key != "recordFingerprint"}
    record["recordFingerprint"] = _sha256_payload(core)


def _semantic_rejection_code(document: dict[str, Any], root: Path) -> str | None:
    if document.get("sourceBindings") != _source_bindings(root):
        return "source_binding_mismatch"

    summaries = document.get("classSummaries", [])
    if summaries and all(item.get("parentCountPerRealization") == 3 for item in summaries):
        return "universal_three_parent_claim_rejected"
    five_32 = next((item for item in summaries if item.get("forteNumber") == "5-32"), None)
    if five_32 is None or five_32.get("parentCountPerRealization") != 0:
        return "five_32_parent_count_invalid"

    vectors = document.get("representationChecks", {}).get("bipolarGovernorVectors", [])
    mars = next((item for item in vectors if item.get("governor") == "Mars"), None)
    if mars is None:
        return "mars_internal_relation_invalid"
    try:
        constructive_mask = _mask_from_pitch_mask12(mars["constructiveString"])
        internal_mask = _mask_from_pitch_mask12(mars["internalString"])
        complement_string = "".join(
            "0" if bit == "1" else "1" for bit in mars["constructiveString"]
        )
    except (KeyError, PentatonicAuditValidationError):
        return "mars_internal_relation_invalid"
    if (
        internal_mask != _transpose(constructive_mask, 1)
        or internal_mask != _invert(constructive_mask, 3)
        or mars.get("t1Matches") is not True
        or mars.get("inversionMatches") is not True
        or mars.get("complementMatchesInternal") is not False
        or mars.get("complementString") != complement_string
        or mars["internalString"] == complement_string
    ):
        return "mars_internal_relation_invalid"

    coordinate = document.get("representationChecks", {}).get("marsCoordinateGuard", {})
    if coordinate.get("coordinateCollisionIsIdentity") is not False:
        return "coordinate_collision_identity_forbidden"

    witnesses = {
        item.get("witnessId"): item
        for item in document.get("reviewedRootedWitnesses", [])
    }
    c2 = witnesses.get("court-position:C2")
    if c2 is None or tuple(
        item.get("governor") for item in c2.get("parentScaleStates", [])
    ) != EXPECTED_WINDOWS["court-position:C2"]:
        return "c2_parent_window_invalid"

    endpoint_guard = next(
        (
            item
            for item in document.get("relationGuards", [])
            if item.get("guardId") == "exact-realization-subset-endpoint"
        ),
        None,
    )
    expected_endpoint_guard = next(
        item for item in RELATION_GUARDS if item["guardId"] == "exact-realization-subset-endpoint"
    )
    if endpoint_guard != expected_endpoint_guard:
        return "class_subset_endpoint_guard_invalid"

    diatonic_masks = sorted({_transpose(IONIAN_MASK, step) for step in range(12)})
    for record in document.get("pitchSetRecords", []):
        mask = record.get("pitchMask")
        if type(mask) is not int:
            return "parent_incidence_invalid"
        declared_parents = record.get("parentMasks", [])
        complement = UNIVERSAL_MASK ^ mask
        if complement in declared_parents:
            return "complement_used_as_parent"
        expected_parents = [parent for parent in diatonic_masks if mask & parent == mask]
        if declared_parents != expected_parents or record.get("parentCount") != len(
            expected_parents
        ):
            return "parent_incidence_invalid"
    return None


def verify_candidate_document(document: dict[str, Any], root: Path = ROOT) -> None:
    fingerprint = document.get("candidateFingerprint")
    core = {key: value for key, value in document.items() if key != "candidateFingerprint"}
    if fingerprint != _sha256_payload(core):
        raise PentatonicAuditValidationError("candidate_fingerprint_mismatch")
    semantic_rejection = _semantic_rejection_code(document, root)
    if semantic_rejection is not None:
        raise PentatonicAuditValidationError(semantic_rejection)
    expected = _build_expected_candidate(root)
    if _serialize_candidate(document) != _serialize_candidate(expected):
        raise PentatonicAuditValidationError("candidate_does_not_match_independent_rebuild")
    try:
        jsonschema.Draft202012Validator(_read_json(CANDIDATE_SCHEMA_PATH)).validate(document)
    except jsonschema.ValidationError as error:
        raise PentatonicAuditValidationError("candidate_schema_invalid") from error


def _mutated_cases(document: dict[str, Any]) -> dict[str, dict[str, Any]]:
    cases: dict[str, dict[str, Any]] = {}

    tampered = deepcopy(document)
    for summary in tampered["classSummaries"]:
        summary["parentCountPerRealization"] = 3
    _rehash_candidate(tampered)
    cases["universal-three-parent-claim"] = tampered

    tampered = deepcopy(document)
    next(item for item in tampered["classSummaries"] if item["forteNumber"] == "5-32")[
        "parentCountPerRealization"
    ] = 3
    _rehash_candidate(tampered)
    cases["five-32-parent-promotion"] = tampered

    tampered = deepcopy(document)
    mars = next(
        item
        for item in tampered["representationChecks"]["bipolarGovernorVectors"]
        if item["governor"] == "Mars"
    )
    mars["internalString"] = mars["complementString"]
    mars["internalPitchMask"] = mars["complementPitchMask"]
    _rehash_candidate(tampered)
    cases["mars-pair-complement-substitution"] = tampered

    tampered = deepcopy(document)
    tampered["representationChecks"]["marsCoordinateGuard"][
        "coordinateCollisionIsIdentity"
    ] = True
    _rehash_candidate(tampered)
    cases["coordinate-collision-1321"] = tampered

    tampered = deepcopy(document)
    witnesses = {item["witnessId"]: item for item in tampered["reviewedRootedWitnesses"]}
    witnesses["court-position:C2"]["parentScaleStates"] = deepcopy(
        witnesses["court-position:C4"]["parentScaleStates"]
    )
    _rehash_candidate(tampered)
    cases["c2-c4-parent-window-swap"] = tampered

    tampered = deepcopy(document)
    guard = next(
        item
        for item in tampered["relationGuards"]
        if item["guardId"] == "exact-realization-subset-endpoint"
    )
    guard["statement"] = "A TnI class summary may be used as an exact subset endpoint."
    _rehash_candidate(tampered)
    cases["class-as-subset-endpoint"] = tampered

    tampered = deepcopy(document)
    record = tampered["pitchSetRecords"][0]
    complement_mask = UNIVERSAL_MASK ^ record["pitchMask"]
    record["parentMasks"].append(complement_mask)
    record["parentMasks"].sort()
    record["parentCount"] = len(record["parentMasks"])
    _rehash_pitch_record(record)
    _rehash_candidate(tampered)
    cases["complement-as-parent-edge"] = tampered

    tampered = deepcopy(document)
    tampered["sourceBindings"][0]["sha256"] = "0" * 64
    _rehash_candidate(tampered)
    cases["source-hash-drift"] = tampered

    tampered = deepcopy(document)
    record = next(item for item in tampered["pitchSetRecords"] if item["parentCount"] == 3)
    record["parentMasks"].pop()
    record["parentCount"] = 2
    _rehash_pitch_record(record)
    _rehash_candidate(tampered)
    cases["pitch-set-parent-tamper"] = tampered

    return cases


def _adversarial_results(document: dict[str, Any], negative_fixture: dict[str, Any]) -> dict[str, str]:
    mutations = _mutated_cases(document)
    expected_codes = {item["caseId"]: item["expectedCode"] for item in negative_fixture["cases"]}
    if set(mutations) != set(expected_codes):
        raise PentatonicAuditValidationError("negative_case_implementation_mismatch")
    results = {}
    for case_id, mutated in mutations.items():
        try:
            verify_candidate_document(mutated, ROOT)
        except PentatonicAuditValidationError as error:
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

    def record(check_id: str, passed: bool, diagnostic: Any) -> None:
        checks.append(
            {
                "checkId": check_id,
                "diagnostic": diagnostic,
                "status": "PASS" if passed else "FAIL",
            }
        )

    candidate_schema = _read_json(CANDIDATE_SCHEMA_PATH)
    try:
        jsonschema.Draft202012Validator(candidate_schema).validate(document)
        record("candidate-schema", True, "valid")
    except jsonschema.ValidationError as error:
        record("candidate-schema", False, error.message)

    negative_fixture = _read_json(NEGATIVE_CASES_PATH)
    try:
        jsonschema.Draft202012Validator(_read_json(NEGATIVE_SCHEMA_PATH)).validate(
            negative_fixture
        )
        record("negative-case-schema", True, "valid")
    except jsonschema.ValidationError as error:
        record("negative-case-schema", False, error.message)

    core = {key: value for key, value in document.items() if key != "candidateFingerprint"}
    record(
        "candidate-fingerprint",
        document.get("candidateFingerprint") == _sha256_payload(core),
        document.get("candidateFingerprint"),
    )

    source_bindings = _source_bindings(ROOT)
    record(
        "source-binding-freshness",
        document.get("sourceBindings") == source_bindings,
        {"bindingCount": len(source_bindings)},
    )

    bad_record_fingerprints = []
    for item in document.get("pitchSetRecords", []):
        item_core = {key: value for key, value in item.items() if key != "recordFingerprint"}
        if item.get("recordFingerprint") != _sha256_payload(item_core):
            bad_record_fingerprints.append(item.get("pitchMask"))
    record("record-fingerprints", not bad_record_fingerprints, bad_record_fingerprints)

    expected = _build_expected_candidate(ROOT)
    record(
        "independent-rebuild",
        _serialize_candidate(document) == _serialize_candidate(expected),
        {
            "actual": document.get("candidateFingerprint"),
            "expected": expected["candidateFingerprint"],
        },
    )
    second = _build_expected_candidate(ROOT)
    reversed_input = _build_expected_candidate(ROOT, reverse_input=True)
    record(
        "build-twice-identity",
        _serialize_candidate(expected) == _serialize_candidate(second),
        expected["candidateFingerprint"],
    )
    record(
        "reordered-input-identity",
        _serialize_candidate(expected) == _serialize_candidate(reversed_input),
        reversed_input["candidateFingerprint"],
    )

    universe = document.get("universeSummary", {})
    distribution = {
        item.get("parentCount"): item.get("pitchSetCount")
        for item in universe.get("parentCountDistribution", [])
    }
    record(
        "universe-and-incidence-closure",
        len(document.get("pitchSetRecords", [])) == 792
        and universe.get("pitchSetCount") == 792
        and universe.get("incidenceCount") == 252
        and len(universe.get("diatonicMasks", [])) == 12
        and distribution == EXPECTED_EXACT_DISTRIBUTION,
        {
            "distribution": {str(key): value for key, value in sorted(distribution.items())},
            "incidenceCount": universe.get("incidenceCount"),
        },
    )

    classes_by_count: dict[int, list[str]] = {}
    for item in document.get("classSummaries", []):
        classes_by_count.setdefault(item.get("parentCountPerRealization"), []).append(
            item.get("forteNumber")
        )
    class_pass = all(
        tuple(classes_by_count.get(count, [])) == expected_classes
        for count, expected_classes in EXPECTED_CLASS_DISTRIBUTION.items()
    )
    class_pass = class_pass and len(document.get("classSummaries", [])) == 38
    record(
        "forte-class-discriminator",
        class_pass,
        {str(key): value for key, value in sorted(classes_by_count.items()) if key},
    )

    witnesses = {
        item["witnessId"]: tuple(parent["governor"] for parent in item["parentScaleStates"])
        for item in document.get("reviewedRootedWitnesses", [])
    }
    record(
        "reviewed-rooted-parent-windows",
        witnesses == EXPECTED_WINDOWS,
        witnesses,
    )

    canonical_network = _read_json(ROOT / "canonical/universal-network-data.json")
    topology_by_id = {node["id"]: node for node in canonical_network["nodes"]}
    complement_maps = _read_json(
        ROOT / "seven-governors-court-substrate-v0.1.0/canonical/complement-map.json"
    )["complementMaps"]
    complement_by_class = {
        item["pentatonicSetClassId"]: item for item in complement_maps
    }
    complement_failures = []
    for item in document.get("reviewedRootedWitnesses", []):
        evidence = item["complementEvidence"]
        map_record = complement_by_class.get(item["setClassId"])
        source_pair = next(
            (
                pair
                for pair in map_record.get("rootedPairs", [])
                if pair["rootedRecordId"] == item["witnessId"]
            ),
            None,
        ) if map_record is not None else None
        normalized_node = topology_by_id.get(evidence["normalizedHeptatonicScaleStateId"])
        if (
            _mask_from_pitches(item["pitchClasses"]) != item["pitchMask"]
            or _pitch_mask12(item["pitchMask"]) != item["pitchMask12"]
            or evidence["rawHeptatonicComplementMask"]
            != (UNIVERSAL_MASK ^ item["pitchMask"])
            or evidence["relationAdmission"] != "frozen_evidence_not_active_graph_relation"
            or evidence["rawHeptatonicComplementMask"]
            == evidence["normalizedHeptatonicScaleStateId"]
            or map_record is None
            or source_pair is None
            or source_pair["pentatonicMask"] != item["pitchMask"]
            or source_pair["rawHeptatonicComplementMask"]
            != evidence["rawHeptatonicComplementMask"]
            or source_pair["normalizedHeptatonicScaleStateId"]
            != evidence["normalizedHeptatonicScaleStateId"]
            or normalized_node is None
            or normalized_node.get("forte")
            != map_record.get("heptatonicFamilyId")
        ):
            complement_failures.append(item["witnessId"])
    record("complement-parent-separation", not complement_failures, complement_failures)

    vectors = document.get("representationChecks", {}).get("bipolarGovernorVectors", [])
    vector_witnesses = {item["governor"]: item["inversionWitness"] for item in vectors}
    canonical_governors = {
        node["office"]: (node["id"], node["name"], node["officeIndex"])
        for node in canonical_network["nodes"]
        if node.get("forte") == "7-35"
        and node.get("tier") == "A0"
        and node.get("role") == "anchor"
        and node.get("assignmentStatus") == "canonical"
    }
    vector_pass = (
        vector_witnesses == EXPECTED_INVERSION_WITNESSES
        and all(
            item["t1Matches"]
            and item["inversionMatches"]
            and not item["complementMatchesInternal"]
            and canonical_governors.get(item["governor"])
            == (item["canonicalPitchMask"], item["mode"], item["officeIndex"])
            and _mask_from_pitch_mask12(item["constructiveString"])
            == item["canonicalPitchMask"]
            for item in vectors
        )
    )
    record("bipolar-vector-relations", vector_pass, vector_witnesses)

    mars_guard = document.get("representationChecks", {}).get("marsCoordinateGuard", {})
    record(
        "mars-coordinate-namespace-guard",
        mars_guard
        == {
            "canonicalPitchMask": 1717,
            "complementCanonicalPitchMask": 2378,
            "complementConstructiveInteger": 1321,
            "constructiveInteger": 2774,
            "coordinateCollisionIsIdentity": False,
            "courtC4PitchMask": 1321,
        },
        mars_guard,
    )

    record(
        "relation-guard-closure",
        document.get("relationGuards") == list(RELATION_GUARDS),
        [item.get("guardId") for item in document.get("relationGuards", [])],
    )

    class_admission = {
        item["forteNumber"]: item["admissionStatus"]
        for item in document.get("classSummaries", [])
    }
    record(
        "admission-boundary",
        document.get("status") == "planning_evidence"
        and document.get("admissionEffect") == "none"
        and document.get("scope", {}).get("activeGraphEffect") == "none"
        and document.get("scope", {}).get("crt310Execution") is False
        and class_admission.get("5-35") == "admitted"
        and class_admission.get("5-23") == "admitted-bridge"
        and class_admission.get("5-27") == "admitted-bridge"
        and sum(value == "proposed" for value in class_admission.values()) == 35,
        {
            "candidateStatus": document.get("status"),
            "proposedClassCount": sum(
                value == "proposed" for value in class_admission.values()
            ),
        },
    )

    fixture_case_ids = tuple(item["caseId"] for item in negative_fixture.get("cases", []))
    record(
        "negative-case-closure",
        fixture_case_ids == NEGATIVE_CASE_IDS
        and tuple(document.get("negativeCaseIds", [])) == NEGATIVE_CASE_IDS,
        list(fixture_case_ids),
    )
    adversarial = _adversarial_results(document, negative_fixture)
    expected_codes = {item["caseId"]: item["expectedCode"] for item in negative_fixture["cases"]}
    record(
        "adversarial-rejection",
        adversarial == expected_codes,
        adversarial,
    )

    try:
        _require_intrinsic_json(document)
        intrinsic_valid = True
        intrinsic_diagnostic = "integer-only intrinsic JSON"
    except (TypeError, ValueError) as error:
        intrinsic_valid = False
        intrinsic_diagnostic = str(error)
    forbidden_keys = {"timestamp", "provider", "model", "locale"}

    def has_forbidden_key(value: Any) -> bool:
        if isinstance(value, dict):
            return bool(set(value) & forbidden_keys) or any(
                has_forbidden_key(item) for item in value.values()
            )
        if isinstance(value, list):
            return any(has_forbidden_key(item) for item in value)
        return False

    record(
        "intrinsic-environment-independence",
        intrinsic_valid and not has_forbidden_key(document),
        intrinsic_diagnostic,
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
        raise PentatonicAuditValidationError("validation_report_shape_invalid")
    return report


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
