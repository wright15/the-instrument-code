#!/usr/bin/env python3
"""Generate the Phase 1 pentatonic-to-7-35 parent-incidence sidecar."""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
from pathlib import Path
import sys
from typing import Any

import yaml


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "court-mathematics/src"))

from court_mathematics import PitchClassSet, invert_mask, transpose_mask  # noqa: E402


SCHEMA_VERSION = "pre-epic-400.pentatonic-7-35-parent-audit.v1"
CANDIDATE_ID = "pentatonic-7-35-parent-audit-v1"
SPECIFICATION_ID = "pre-epic-400.pentatonic-7-35-binding.v1"
UNIVERSAL_MASK = (1 << 12) - 1
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


class PentatonicAuditBuildError(ValueError):
    """Stable Phase 1 build failure."""


def _read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def _sha256_bytes(payload: bytes) -> str:
    return hashlib.sha256(payload).hexdigest()


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


def _source_bindings(root: Path) -> list[dict[str, str]]:
    bindings = []
    for binding_id, relative_path, role in SOURCE_SPECS:
        path = root / relative_path
        if not path.is_file():
            raise PentatonicAuditBuildError(f"source_missing:{relative_path}")
        bindings.append(
            {
                "bindingId": binding_id,
                "path": relative_path,
                "role": role,
                "sha256": _sha256_bytes(path.read_bytes()),
            }
        )
    return sorted(bindings, key=lambda item: item["bindingId"])


def _pitch_mask12(mask: int) -> str:
    if type(mask) is not int or not 0 <= mask <= UNIVERSAL_MASK:
        raise PentatonicAuditBuildError("pitch_mask_out_of_range")
    return "".join("1" if mask & (1 << pitch) else "0" for pitch in range(12))


def _mask_from_pitch_mask12(value: str) -> int:
    if not isinstance(value, str) or len(value) != 12 or set(value) - {"0", "1"}:
        raise PentatonicAuditBuildError("pitch_mask12_invalid")
    return sum(1 << index for index, bit in enumerate(value) if bit == "1")


def _record_with_fingerprint(core: dict[str, Any]) -> dict[str, Any]:
    return {**core, "recordFingerprint": _sha256_payload(core)}


def _load_governor_offices(path: Path, *, reverse_input: bool) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8") as handle:
        records = list(csv.DictReader(handle))
    if reverse_input:
        records.reverse()
    return records


def _load_canonical_offices(
    network: dict[str, Any], *, reverse_input: bool
) -> list[dict[str, Any]]:
    records = [
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
        records.reverse()
    if len(records) != 7:
        raise PentatonicAuditBuildError("canonical_governor_office_count_mismatch")
    return records


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
        raise PentatonicAuditBuildError("governor_office_projection_drift")


def _build_class_index(
    registry_records: list[dict[str, Any]],
) -> tuple[dict[tuple[int, ...], dict[str, Any]], dict[str, dict[str, Any]]]:
    by_prime: dict[tuple[int, ...], dict[str, Any]] = {}
    by_id: dict[str, dict[str, Any]] = {}
    for item in registry_records:
        pitch_set = PitchClassSet(item["representativeMask"])
        if pitch_set.cardinality != 5:
            raise PentatonicAuditBuildError("registry_representative_not_pentatonic")
        if pitch_set.prime_form in by_prime:
            raise PentatonicAuditBuildError("registry_prime_form_duplicate")
        by_prime[pitch_set.prime_form] = item
        by_id[item["setClassId"]] = item
    if len(by_prime) != 38 or len(by_id) != 38:
        raise PentatonicAuditBuildError("registry_class_count_mismatch")
    return by_prime, by_id


def _build_pitch_set_records(
    class_by_prime: dict[tuple[int, ...], dict[str, Any]],
    diatonic_masks: tuple[int, ...],
) -> list[dict[str, Any]]:
    records = []
    for mask in range(UNIVERSAL_MASK + 1):
        if mask.bit_count() != 5:
            continue
        pitch_set = PitchClassSet(mask)
        class_record = class_by_prime.get(pitch_set.prime_form)
        if class_record is None:
            raise PentatonicAuditBuildError(f"pentatonic_class_missing:{mask}")
        parents = [parent for parent in diatonic_masks if mask & parent == mask]
        core = {
            "forteNumber": class_record["forteNumber"],
            "parentCount": len(parents),
            "parentMasks": parents,
            "pitchClasses": list(pitch_set.pitch_classes),
            "pitchMask": mask,
            "pitchMask12": _pitch_mask12(mask),
            "recordId": f"pentatonic-mask:{mask}",
            "setClassId": class_record["setClassId"],
        }
        records.append(_record_with_fingerprint(core))
    if len(records) != 792:
        raise PentatonicAuditBuildError("pentatonic_universe_count_mismatch")
    return records


def _build_class_summaries(
    registry_records: list[dict[str, Any]],
    pitch_set_records: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    records_by_class: dict[str, list[dict[str, Any]]] = {}
    for record in pitch_set_records:
        records_by_class.setdefault(record["setClassId"], []).append(record)

    summaries = []
    for item in sorted(registry_records, key=lambda value: value["forteOrdinal"]):
        members = records_by_class.get(item["setClassId"], [])
        parent_counts = {member["parentCount"] for member in members}
        if len(parent_counts) != 1:
            raise PentatonicAuditBuildError(
                f"class_parent_count_not_invariant:{item['forteNumber']}"
            )
        summaries.append(
            {
                "admissionStatus": item["admissionStatus"],
                "complementMapId": item["complementMapId"],
                "forteNumber": item["forteNumber"],
                "forteOrdinal": item["forteOrdinal"],
                "parentCountPerRealization": next(iter(parent_counts)),
                "primeForm": list(PitchClassSet(item["representativeMask"]).prime_form),
                "realizationCount": len(members),
                "representativeMask": item["representativeMask"],
                "setClassId": item["setClassId"],
            }
        )
    return summaries


def _build_reviewed_witnesses(
    *,
    positions: list[dict[str, Any]],
    bridges: list[dict[str, Any]],
    complement_maps: list[dict[str, Any]],
    office_rows: list[dict[str, str]],
    class_by_id: dict[str, dict[str, Any]],
    pitch_records_by_mask: dict[int, dict[str, Any]],
    topology_nodes_by_id: dict[int, dict[str, Any]],
) -> list[dict[str, Any]]:
    complement_by_class = {
        item["pentatonicSetClassId"]: item for item in complement_maps
    }
    offices = sorted(office_rows, key=lambda row: int(row["office_index"]))
    reviewed: list[tuple[int, int, str, dict[str, Any]]] = []
    for item in positions:
        reviewed.append((0, int(item["positionId"][1:]), f"court-position:{item['positionId']}", item))
    for item in bridges:
        class_item = class_by_id[item["setClassId"]]
        reviewed.append((1, class_item["forteOrdinal"], item["bridgeRootingId"], item))

    witnesses = []
    for witness_type_order, _, witness_id, item in sorted(reviewed):
        class_item = class_by_id[item["setClassId"]]
        if (
            PitchClassSet.from_pitch_classes(item["pitchClasses"]).mask != item["pitchMask"]
            or _pitch_mask12(item["pitchMask"]) != item["pitchMask12"]
            or item["rootPc"] not in item["pitchClasses"]
        ):
            raise PentatonicAuditBuildError(f"rooted_witness_representation_mismatch:{witness_id}")
        pitch_record = pitch_records_by_mask[item["pitchMask"]]
        parent_states = []
        for office in offices:
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
        if sorted(entry["scaleStateId"] for entry in parent_states) != pitch_record["parentMasks"]:
            raise PentatonicAuditBuildError(f"rooted_parent_resolution_mismatch:{witness_id}")

        complement_map = complement_by_class[item["setClassId"]]
        rooted_pair = next(
            (
                pair
                for pair in complement_map["rootedPairs"]
                if pair["rootedRecordId"] == witness_id
            ),
            None,
        )
        if rooted_pair is None:
            raise PentatonicAuditBuildError(f"complement_rooted_pair_missing:{witness_id}")
        if (
            rooted_pair["pentatonicMask"] != item["pitchMask"]
            or rooted_pair["rawHeptatonicComplementMask"]
            != (UNIVERSAL_MASK ^ item["pitchMask"])
        ):
            raise PentatonicAuditBuildError(f"raw_complement_mismatch:{witness_id}")
        normalized_node = topology_nodes_by_id.get(
            rooted_pair["normalizedHeptatonicScaleStateId"]
        )
        if (
            normalized_node is None
            or normalized_node.get("forte") != complement_map["heptatonicFamilyId"]
        ):
            raise PentatonicAuditBuildError(
                f"normalized_complement_family_mismatch:{witness_id}"
            )

        witnesses.append(
            {
                "admissionStatus": item["admissionStatus"],
                "complementEvidence": {
                    "complementMapId": complement_map["complementMapId"],
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
                "witnessType": "court_position" if witness_type_order == 0 else "bridge_rooting",
            }
        )
    if len(witnesses) != 7:
        raise PentatonicAuditBuildError("reviewed_witness_count_mismatch")
    return witnesses


def _build_representation_checks(
    governors: dict[str, Any], office_rows: list[dict[str, str]]
) -> dict[str, Any]:
    office_by_governor = {row["office"].lower(): row for row in office_rows}
    records = []
    for governor_id, governor in governors.items():
        if governor.get("type") != "bipolar_engine_governor":
            continue
        office = office_by_governor[governor_id]
        expression = governor["canonical_expression"]
        constructive = expression["binary_12bit"]
        internal = expression["binary_12bit_lsb"]
        constructive_mask = _mask_from_pitch_mask12(constructive)
        internal_mask = _mask_from_pitch_mask12(internal)
        t1_mask = transpose_mask(constructive_mask, 1)
        inversion_witnesses = [
            axis for axis in range(12) if invert_mask(constructive_mask, axis) == internal_mask
        ]
        if len(inversion_witnesses) != 1:
            raise PentatonicAuditBuildError(f"bipolar_inversion_witness_mismatch:{governor_id}")
        canonical_mask = int(office["canonical_scale_id"])
        if constructive_mask != canonical_mask:
            raise PentatonicAuditBuildError(f"governor_canonical_mask_mismatch:{governor_id}")
        if int(expression["mode_details"]["decimal"]) != canonical_mask:
            raise PentatonicAuditBuildError(f"governor_mode_decimal_mismatch:{governor_id}")
        complement_string = "".join("0" if bit == "1" else "1" for bit in constructive)
        records.append(
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
                "inversionMatches": True,
                "inversionWitness": inversion_witnesses[0],
                "mode": office["canonical_mode"],
                "officeIndex": int(office["office_index"]),
                "t1Matches": t1_mask == internal_mask,
                "t1String": _pitch_mask12(t1_mask),
            }
        )
    records.sort(key=lambda item: item["officeIndex"])
    if len(records) != 5 or not all(
        item["t1Matches"] and item["inversionMatches"] and not item["complementMatchesInternal"]
        for item in records
    ):
        raise PentatonicAuditBuildError("bipolar_vector_relation_mismatch")

    mars = next(item for item in records if item["governor"] == "Mars")
    return {
        "bipolarGovernorVectors": records,
        "marsCoordinateGuard": {
            "canonicalPitchMask": mars["canonicalPitchMask"],
            "complementCanonicalPitchMask": mars["complementPitchMask"],
            "complementConstructiveInteger": int(mars["complementString"], 2),
            "constructiveInteger": mars["constructiveInteger"],
            "coordinateCollisionIsIdentity": False,
            "courtC4PitchMask": 1321,
        },
    }


def _assert_phase_zero_baseline(document: dict[str, Any]) -> None:
    distribution = {
        item["parentCount"]: item["pitchSetCount"]
        for item in document["universeSummary"]["parentCountDistribution"]
    }
    if distribution != EXPECTED_EXACT_DISTRIBUTION:
        raise PentatonicAuditBuildError("phase_zero_exact_distribution_mismatch")

    by_count: dict[int, list[str]] = {}
    for item in document["classSummaries"]:
        by_count.setdefault(item["parentCountPerRealization"], []).append(item["forteNumber"])
    for count, expected in EXPECTED_CLASS_DISTRIBUTION.items():
        if tuple(by_count.get(count, [])) != expected:
            raise PentatonicAuditBuildError(f"phase_zero_class_distribution_mismatch:{count}")
    expected_zero = sorted(
        item["forteNumber"]
        for item in document["classSummaries"]
        if item["forteNumber"] not in {
            value for values in EXPECTED_CLASS_DISTRIBUTION.values() for value in values
        }
    )
    if sorted(by_count.get(0, [])) != expected_zero:
        raise PentatonicAuditBuildError("phase_zero_zero_parent_classes_mismatch")


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
        raise PentatonicAuditBuildError("current_court_admission_release_mismatch")


def build_candidate(root: Path = ROOT, *, reverse_input: bool = False) -> dict[str, Any]:
    source_bindings = _source_bindings(root)
    registry = _read_json(
        root
        / "seven-governors-court-substrate-v0.1.0/canonical/pentatonic-set-class-registry.json"
    )
    complement_map = _read_json(
        root / "seven-governors-court-substrate-v0.1.0/canonical/complement-map.json"
    )
    positions = _read_json(
        root / "seven-governors-court-substrate-v0.1.0/canonical/court-rooted-positions.json"
    )
    bridges = _read_json(
        root / "seven-governors-court-substrate-v0.1.0/canonical/bridge-rootings.json"
    )
    canonical_network = _read_json(root / "canonical/universal-network-data.json")
    governors = yaml.safe_load((root / "schemas/governors.yaml").read_text(encoding="utf-8"))
    admission_release = _read_json(root / "provenance/court-admission-release.json")
    projected_offices = _load_governor_offices(
        root / "neo4j/csv/governor-offices.csv", reverse_input=reverse_input
    )
    offices = _load_canonical_offices(canonical_network, reverse_input=reverse_input)
    _assert_projection_offices(offices, projected_offices)

    registry_records = list(registry["pentatonicSetClasses"])
    complement_records = list(complement_map["complementMaps"])
    position_records = list(positions["courtRootedPositions"])
    bridge_records = list(bridges["bridgeRootings"])
    governor_records = dict(governors["governors"])
    if reverse_input:
        registry_records.reverse()
        complement_records.reverse()
        position_records.reverse()
        bridge_records.reverse()
        governor_records = dict(reversed(tuple(governor_records.items())))

    _assert_current_admission_release(admission_release, registry_records)

    class_by_prime, class_by_id = _build_class_index(registry_records)
    diatonic_masks = tuple(sorted({transpose_mask(IONIAN_MASK, step) for step in range(12)}))
    if len(diatonic_masks) != 12:
        raise PentatonicAuditBuildError("diatonic_transposition_count_mismatch")
    pitch_set_records = _build_pitch_set_records(class_by_prime, diatonic_masks)
    class_summaries = _build_class_summaries(registry_records, pitch_set_records)
    records_by_mask = {item["pitchMask"]: item for item in pitch_set_records}
    witnesses = _build_reviewed_witnesses(
        positions=position_records,
        bridges=bridge_records,
        complement_maps=complement_records,
        office_rows=offices,
        class_by_id=class_by_id,
        pitch_records_by_mask=records_by_mask,
        topology_nodes_by_id={node["id"]: node for node in canonical_network["nodes"]},
    )
    representation_checks = _build_representation_checks(governor_records, offices)

    parent_distribution = [
        {
            "parentCount": count,
            "pitchSetCount": sum(
                1 for item in pitch_set_records if item["parentCount"] == count
            ),
        }
        for count in range(4)
    ]
    incidence_count = sum(item["parentCount"] for item in pitch_set_records)
    core = {
        "admissionEffect": "none",
        "authority": "root_owned_non_admitted_audit_sidecar",
        "candidateId": CANDIDATE_ID,
        "classSummaries": class_summaries,
        "negativeCaseIds": list(NEGATIVE_CASE_IDS),
        "pitchSetRecords": pitch_set_records,
        "relationGuards": list(RELATION_GUARDS),
        "representationChecks": representation_checks,
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
            "fiveNoteSetCount": len(pitch_set_records),
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
            "incidenceCount": incidence_count,
            "maximumParentCount": max(item["parentCount"] for item in pitch_set_records),
            "parentCountDistribution": parent_distribution,
            "pitchSetCount": len(pitch_set_records),
        },
    }
    document = {**core, "candidateFingerprint": _sha256_payload(core)}
    _assert_phase_zero_baseline(document)
    if _source_bindings(root) != source_bindings:
        raise PentatonicAuditBuildError("source_changed_during_build")
    return document


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--output",
        type=Path,
        default=ROOT
        / "canonical/pentatonic-binding-candidates/pentatonic-7-35-parent-audit-v1.json",
    )
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()

    document = build_candidate(ROOT)
    payload = serialize_candidate(document)
    if args.check:
        if not args.output.is_file() or args.output.read_bytes() != payload:
            raise SystemExit("STALE_PENTATONIC_7_35_PARENT_AUDIT")
    else:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_bytes(payload)
    print(
        json.dumps(
            {
                "candidateFingerprint": document["candidateFingerprint"],
                "candidateId": document["candidateId"],
                "classCount": len(document["classSummaries"]),
                "incidenceCount": document["universeSummary"]["incidenceCount"],
                "pitchSetCount": len(document["pitchSetRecords"]),
                "status": document["status"],
            },
            sort_keys=True,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
