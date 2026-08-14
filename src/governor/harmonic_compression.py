"""Root-owned GOV-213 scoped harmonic-compression sidecar."""

from __future__ import annotations

from copy import deepcopy
from pathlib import Path
import hashlib
import json
import re
from typing import Any, Iterable, Mapping

from court_mathematics import DegreeTriad, RootedScale

from .hashing import canonical_json_bytes, sha256_payload


CANDIDATE_ID = "CH_A012_q_v1"
COORDINATE_ID = "harmonic.CH_A012_q_v1"
RELEASE_ID = "harmonic-compression-candidate:CH_A012_q_v1:1.0.0"
SCHEMA_VERSION = "gov-213.harmonic-compression-candidate-release.v1"
ALGORITHM_VERSION = "gov-213.rooted-triad-q-v1.v1"
GLOBAL_GUARD_LITERAL = (
    "C_H is a derived harmonic property, not a photonic measurement, not C_P, "
    "not C_S, not kappa_court, and not a thermodynamic quantity: not temperature, "
    "entropy, enthalpy, or free energy."
)
SCOPE_TIERS = ("A0", "A1", "A2")
TIER_FAMILIES = {"A0": "7-35", "A1": "7-34", "A2": "7-33"}
GOVERNOR_DEGREES = {
    "Saturn": 1,
    "Jupiter": 2,
    "Mars": 3,
    "Sun": 4,
    "Venus": 5,
    "Mercury": 6,
    "Moon": 7,
}
Q_BY_SIGNATURE = {
    (4, 7): 0,
    (3, 7): 1,
    (3, 6): 2,
    (4, 8): 2,
    (2, 6): 3,
    (4, 6): 3,
}
WEIGHT_NUMERATORS = (116, 56, 41, 35, 77, 44, 38)
WEIGHT_DENOMINATOR = 407
EXPECTED_TIER_MULTISETS = {
    "A0": (0, 0, 0, 1, 1, 1, 2),
    "A1": (0, 0, 1, 1, 2, 2, 2),
    "A2": (0, 1, 2, 2, 2, 3, 3),
}
EXPECTED_A0_ORDER = (
    "Lydian",
    "Ionian",
    "Mixolydian",
    "Dorian",
    "Aeolian",
    "Phrygian",
    "Locrian",
)


class HarmonicCompressionError(ValueError):
    """Raised when a GOV-213 sidecar invariant fails."""


def _read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def _file_sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _pitch_classes(record: Mapping[str, Any]) -> tuple[int, ...]:
    value = record.get("pitchSet")
    if not isinstance(value, str):
        raise HarmonicCompressionError("pitch_set_must_be_string")
    pitches = tuple(int(item) for item in re.findall(r"\d+", value))
    if len(pitches) != 7 or pitches[0] != 0 or len(set(pitches)) != 7:
        raise HarmonicCompressionError("pitch_set_must_be_root_normalized_heptatonic")
    return pitches


def _q_signature(rooted: RootedScale) -> tuple[tuple[int, ...], tuple[tuple[int, int], ...]]:
    values: list[int] = []
    abbreviated: list[tuple[int, int]] = []
    for degree in range(1, 8):
        triad = DegreeTriad(rooted, degree)
        signature = (triad.interval_signature[1], triad.interval_signature[2])
        try:
            value = Q_BY_SIGNATURE[signature]
        except KeyError as error:
            raise HarmonicCompressionError(
                f"q_v1_signature_out_of_domain:{signature[0]}:{signature[1]}"
            ) from error
        values.append(value)
        abbreviated.append(signature)
    return tuple(values), tuple(abbreviated)


def _ratio(numerator: int, denominator: int = WEIGHT_DENOMINATOR) -> dict[str, int]:
    return {"numerator": numerator, "denominator": denominator}


def _state_record(record: Mapping[str, Any]) -> dict[str, Any]:
    pitches = _pitch_classes(record)
    rooted = RootedScale.from_pitch_classes(pitches, root=0)
    q_values, signatures = _q_signature(rooted)
    office = record.get("office")
    if office not in GOVERNOR_DEGREES:
        raise HarmonicCompressionError("anchor_office_must_have_chaldean_degree")
    seat_degree = GOVERNOR_DEGREES[office]
    weighted_numerator = sum(
        weight * value for weight, value in zip(WEIGHT_NUMERATORS, q_values, strict=True)
    )
    core = {
        "stateId": record["id"],
        "name": record["name"],
        "forte": record["forte"],
        "tier": record["tier"],
        "role": record["role"],
        "stateGovernor": office,
        "stateGovernorDegree": seat_degree,
        "pitchClasses": list(pitches),
        "intervalVector": [int(item) for item in str(record["intervalVector"]).split(",")],
        "stepIntervals": list(rooted.step_intervals),
        "triadIntervalSignatures": [list(item) for item in signatures],
        "triadicCompressionSignature": list(q_values),
        "governorSeatCompressionClass": q_values[seat_degree - 1],
        "weightedProjection": _ratio(weighted_numerator),
    }
    return {**core, "recordFingerprint": sha256_payload(core)}


def _scope_records(ledger: Iterable[Mapping[str, Any]]) -> list[Mapping[str, Any]]:
    selected = [
        record
        for record in ledger
        if record.get("role") == "anchor" and record.get("tier") in SCOPE_TIERS
    ]
    selected.sort(key=lambda record: (SCOPE_TIERS.index(record["tier"]), record["id"]))
    if len(selected) != 21:
        raise HarmonicCompressionError("scope_must_select_exactly_21_anchors")
    return selected


def _tier_summaries(records: Iterable[Mapping[str, Any]]) -> list[dict[str, Any]]:
    summaries = []
    for tier in SCOPE_TIERS:
        members = [record for record in records if record["tier"] == tier]
        numerators = [record["weightedProjection"]["numerator"] for record in members]
        multisets = {
            tuple(sorted(record["triadicCompressionSignature"])) for record in members
        }
        if len(members) != 7 or multisets != {EXPECTED_TIER_MULTISETS[tier]}:
            raise HarmonicCompressionError(f"tier_multiset_mismatch:{tier}")
        minimum = min(members, key=lambda record: record["weightedProjection"]["numerator"])
        maximum = max(members, key=lambda record: record["weightedProjection"]["numerator"])
        summaries.append(
            {
                "tier": tier,
                "forte": TIER_FAMILIES[tier],
                "stateCount": len(members),
                "compressionClassMultiset": list(EXPECTED_TIER_MULTISETS[tier]),
                "unweightedSum": sum(EXPECTED_TIER_MULTISETS[tier]),
                "minimum": {
                    "stateId": minimum["stateId"],
                    "name": minimum["name"],
                    "value": _ratio(min(numerators)),
                },
                "maximum": {
                    "stateId": maximum["stateId"],
                    "name": maximum["name"],
                    "value": _ratio(max(numerators)),
                },
            }
        )
    return summaries


def _negative_controls(
    ledger: Iterable[Mapping[str, Any]], records: Iterable[Mapping[str, Any]]
) -> dict[str, Any]:
    tier_only = [record for record in ledger if record.get("tier") in SCOPE_TIERS]
    non_anchor = min(
        (record for record in tier_only if record.get("role") != "anchor"),
        key=lambda record: record["id"],
    )
    boundary = next(record for record in ledger if record.get("id") == 223)
    if boundary.get("role") != "boundary":
        raise HarmonicCompressionError("boundary_negative_control_identity_changed")
    a0_records = [record for record in records if record["tier"] == "A0"]
    vectors = {tuple(record["intervalVector"]) for record in a0_records}
    if len(vectors) != 1:
        raise HarmonicCompressionError("a0_interval_vector_negative_control_failed")
    return {
        "intervalVectorOnlyCollision": {
            "forte": "7-35",
            "stateCount": 7,
            "intervalVector": list(next(iter(vectors))),
            "distinctQCount": len(
                {tuple(record["triadicCompressionSignature"]) for record in a0_records}
            ),
            "result": "interval_vector_only_cannot_distinguish_rooted_modes",
        },
        "tierOnlySelectionTrap": {
            "stateId": non_anchor["id"],
            "tier": non_anchor["tier"],
            "role": non_anchor["role"],
            "result": "excluded",
        },
        "boundarySelectionTrap": {
            "stateId": boundary["id"],
            "tier": boundary.get("tier"),
            "role": boundary["role"],
            "result": "excluded",
        },
    }


def build_harmonic_compression_candidate(
    *,
    root: Path,
    reverse_input: bool = False,
) -> dict[str, Any]:
    ledger_path = root / "canonical/universal-heptatonic-ledger.json"
    theorem_path = root / "docs/A_TIER_TRIADIC_COMPRESSION_THEOREM.md"
    guard_path = (
        root
        / "seven-governors-harmonic-invariants-v0.1.0/canonical/compression-namespace-guard.json"
    )
    ledger = _read_json(ledger_path)
    if reverse_input:
        ledger = list(reversed(ledger))
    selected = _scope_records(ledger)
    records = [_state_record(record) for record in selected]
    records.sort(key=lambda record: (SCOPE_TIERS.index(record["tier"]), record["stateId"]))
    tier_summaries = _tier_summaries(records)
    if any(record["governorSeatCompressionClass"] != 2 for record in records):
        raise HarmonicCompressionError("governor_seat_invariant_failed")
    a0_order = tuple(
        record["name"]
        for record in sorted(
            (record for record in records if record["tier"] == "A0"),
            key=lambda record: record["weightedProjection"]["numerator"],
        )
    )
    if a0_order != EXPECTED_A0_ORDER:
        raise HarmonicCompressionError("a0_order_mismatch")
    bands = {summary["tier"]: summary for summary in tier_summaries}
    gap_a0_a1 = (
        bands["A1"]["minimum"]["value"]["numerator"]
        - bands["A0"]["maximum"]["value"]["numerator"]
    )
    gap_a1_a2 = (
        bands["A2"]["minimum"]["value"]["numerator"]
        - bands["A1"]["maximum"]["value"]["numerator"]
    )
    if (gap_a0_a1, gap_a1_a2) != (3, 22):
        raise HarmonicCompressionError("tier_separation_margin_mismatch")
    guard = _read_json(guard_path)["compressionGuard"]
    if guard != {
        "forbiddenEquivalences": [
            "physical.C_P",
            "semantic.C_S",
            "court.kappa_court",
            "physical.temperature",
            "physical.entropy",
            "physical.enthalpy",
            "physical.freeEnergy",
        ],
        "guardLiteral": GLOBAL_GUARD_LITERAL,
        "namespace": "harmonic.C_H",
        "status": "unresolved",
        "symbol": "C_H",
        "value": None,
    }:
        raise HarmonicCompressionError("global_C_H_guard_changed")
    core = {
        "schemaVersion": SCHEMA_VERSION,
        "releaseId": RELEASE_ID,
        "storyId": "GOV-213",
        "candidateId": CANDIDATE_ID,
        "coordinateId": COORDINATE_ID,
        "status": "admitted_scoped_A012",
        "authority": "root_owned_scoped_harmonic_descriptor",
        "admissionEffect": "Q_and_W_A012_only",
        "scope": {
            "selection": {"role": "anchor", "tiers": list(SCOPE_TIERS)},
            "families": [TIER_FAMILIES[tier] for tier in SCOPE_TIERS],
            "tuning": "12-TET",
            "rootConvention": "declared_root_normalized_to_pitch_class_0",
            "stateCount": 21,
            "excluded": [
                "D1-D7 anchors",
                "satellites",
                "convergence states",
                "junctions",
                "leaves",
                "boundary states",
            ],
        },
        "method": {
            "algorithmVersion": ALGORITHM_VERSION,
            "triadDerivation": "court_mathematics.DegreeTriad",
            "qVersion": "q_v1",
            "qClasses": [
                {"signature": [4, 7], "runtimeQuality": "major", "value": 0},
                {"signature": [3, 7], "runtimeQuality": "minor", "value": 1},
                {"signature": [3, 6], "runtimeQuality": "diminished", "value": 2},
                {"signature": [4, 8], "runtimeQuality": "augmented", "value": 2},
                {"signature": [2, 6], "runtimeQuality": "other", "value": 3},
                {"signature": [4, 6], "runtimeQuality": "other", "value": 3},
            ],
            "degreeOrder": [1, 2, 3, 4, 5, 6, 7],
            "governorDegreeMap": GOVERNOR_DEGREES,
            "weightVersion": "chaldean_order_witness_v1",
            "weightNumerators": list(WEIGHT_NUMERATORS),
            "weightDenominator": WEIGHT_DENOMINATOR,
            "weightOrdering": "w1>w5>w2>w6>w3>w7>w4>0",
            "weightSum": _ratio(WEIGHT_DENOMINATOR),
            "uniquenessClaim": False,
        },
        "sourceBindings": [
            {
                "bindingId": "canonical-heptatonic-ledger",
                "path": "canonical/universal-heptatonic-ledger.json",
                "sha256": _file_sha256(ledger_path),
                "role": "authoritative_state_identity",
            },
            {
                "bindingId": "a-tier-triadic-theorem",
                "path": "docs/A_TIER_TRIADIC_COMPRESSION_THEOREM.md",
                "sha256": _file_sha256(theorem_path),
                "role": "scoped_research_theorem",
            },
            {
                "bindingId": "global-C_H-guard",
                "path": (
                    "seven-governors-harmonic-invariants-v0.1.0/canonical/"
                    "compression-namespace-guard.json"
                ),
                "sha256": _file_sha256(guard_path),
                "role": "global_namespace_boundary",
            },
        ],
        "records": records,
        "tierSummaries": tier_summaries,
        "invariants": {
            "governorSeatClass": 2,
            "governorSeatPassCount": 21,
            "a0Order": list(EXPECTED_A0_ORDER),
            "tierSumOrder": [5, 8, 13],
            "strictBandSeparation": True,
            "a0A1Gap": _ratio(gap_a0_a1),
            "a1A2Gap": _ratio(gap_a1_a2),
            "fibonacciObservation": {
                "observationId": "CH-OBS-001",
                "status": "observed_noncausal",
            },
        },
        "negativeControls": _negative_controls(ledger, records),
        "globalAggregate": {
            "namespace": "harmonic.C_H",
            "status": "unresolved",
            "value": None,
            "guardLiteral": GLOBAL_GUARD_LITERAL,
        },
        "deferredWork": [
            "full_462_state_collision_analysis",
            "D1_D7_anchor_extension",
            "satellite_and_boundary_extension",
            "fifteen_operator_delta_audit",
            "C_P_C_H_C_S_correspondence_evaluation",
        ],
    }
    return {**core, "candidateFingerprint": sha256_payload(core)}


def serialize_harmonic_compression_candidate(document: Mapping[str, Any]) -> bytes:
    return canonical_json_bytes(document)


def verify_harmonic_compression_candidate(document: Mapping[str, Any], *, root: Path) -> None:
    if not isinstance(document, Mapping):
        raise HarmonicCompressionError("candidate_must_be_object")
    fingerprint = document.get("candidateFingerprint")
    core = {key: value for key, value in document.items() if key != "candidateFingerprint"}
    if fingerprint != sha256_payload(core):
        raise HarmonicCompressionError("candidate_fingerprint_mismatch")
    expected = build_harmonic_compression_candidate(root=root)
    if canonical_json_bytes(document) != canonical_json_bytes(expected):
        raise HarmonicCompressionError("candidate_does_not_match_fresh_build")


def tampered_copy(document: Mapping[str, Any]) -> dict[str, Any]:
    return deepcopy(document)
