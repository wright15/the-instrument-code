"""Root-owned GOV-227 D-tier harmonic-compression audit."""

from __future__ import annotations

from collections import defaultdict
from copy import deepcopy
from fractions import Fraction
from pathlib import Path
import hashlib
import json
import re
from typing import Any, Iterable, Mapping, Sequence

from court_mathematics import DegreeTriad, RootedScale

from .exact_lp import ExactLPResult, solve_exact_lp
from .harmonic_compression import (
    GLOBAL_GUARD_LITERAL,
    GOVERNOR_DEGREES,
    Q_BY_SIGNATURE,
    WEIGHT_DENOMINATOR,
    WEIGHT_NUMERATORS,
)
from .hashing import canonical_json_bytes, sha256_bytes, sha256_payload


CANDIDATE_ID = "CH_D17_q_v2"
COORDINATE_ID = "harmonic.CH_D17_q_v2"
RELEASE_ID = "harmonic-compression-candidate:CH_D17_q_v2:1.0.0"
SCHEMA_VERSION = "gov-227.d-tier-harmonic-compression-candidate.v1"
ALGORITHM_VERSION = "gov-227.rooted-triad-q-v2.v1"
D_TIERS = ("D1", "D2", "D3", "D4", "D5", "D6", "D7")
ALL_TIERS = ("A0", "A1", "A2", *D_TIERS)
TIER_FAMILIES = {
    "A0": "7-35",
    "A1": "7-34",
    "A2": "7-33",
    "D1": "7-22",
    "D2": "7-15",
    "D3": "7-Z37",
    "D4": "7-Z17",
    "D5": "7-Z12",
    "D6": "7-8",
    "D7": "7-1",
}
INTERVAL_CLASS_DISSONANCE = {
    1: Fraction(3),
    2: Fraction(2),
    3: Fraction(1, 2),
    4: Fraction(1, 2),
    5: Fraction(0),
    6: Fraction(5, 2),
}
A_TIER_FILE_SHA256 = "2c6ffae3acc7d5e6bc7154783967ad463d99fab96c0e410b69b27fb21af59c6e"
LP_NORMALIZATION = WEIGHT_DENOMINATOR
A0_ORDER_STATE_IDS = (2773, 2741, 1717, 1709, 1453, 1451, 1387)


class DTierHarmonicCompressionError(ValueError):
    """Raised when GOV-227 evidence does not close."""


def _read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def _file_sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _ratio(value: Fraction | int) -> dict[str, int]:
    fraction = Fraction(value)
    return {"numerator": fraction.numerator, "denominator": fraction.denominator}


def _pitch_classes(record: Mapping[str, Any]) -> tuple[int, ...]:
    value = record.get("pitchSet")
    if not isinstance(value, str):
        raise DTierHarmonicCompressionError("pitch_set_must_be_string")
    pitches = tuple(int(item) for item in re.findall(r"\d+", value))
    if len(pitches) != 7 or pitches[0] != 0 or len(set(pitches)) != 7:
        raise DTierHarmonicCompressionError(
            "pitch_set_must_be_root_normalized_heptatonic"
        )
    return pitches


def interval_dissonance(interval: int) -> Fraction:
    if type(interval) is not int or not 1 <= interval <= 11:
        raise DTierHarmonicCompressionError("interval_must_be_integer_1_through_11")
    return INTERVAL_CLASS_DISSONANCE[min(interval, 12 - interval)]


def combined_triad_dissonance(a: int, b: int) -> Fraction:
    if type(a) is not int or type(b) is not int or not 0 < a < b < 12:
        raise DTierHarmonicCompressionError("triad_signature_must_satisfy_0_a_b_12")
    return interval_dissonance(a) + interval_dissonance(b - a) + interval_dissonance(b)


def q_v2_bucket(a: int, b: int) -> str:
    combined_triad_dissonance(a, b)
    if b == 7 and {a, b - a} == {3, 4}:
        return "perfect_fifth_tertian"
    if a == b - a and b != 7:
        return "equal_stacked_nonperfect"
    return "dissonance_ranked_other"


def _triad_signatures(record: Mapping[str, Any]) -> tuple[tuple[int, int], ...]:
    rooted = RootedScale.from_pitch_classes(_pitch_classes(record), root=0)
    return tuple(
        (
            DegreeTriad(rooted, degree).interval_signature[1],
            DegreeTriad(rooted, degree).interval_signature[2],
        )
        for degree in range(1, 8)
    )


def derive_q_v2_domain(
    ledger: Iterable[Mapping[str, Any]],
) -> tuple[tuple[int, int], ...]:
    signatures = {
        signature
        for record in ledger
        if record.get("role") == "anchor" and record.get("tier") in ALL_TIERS
        for signature in _triad_signatures(record)
    }
    if len(signatures) != 21:
        raise DTierHarmonicCompressionError("q_v2_domain_must_have_21_signatures")
    return tuple(sorted(signatures))


def q_v2_value(
    a: int,
    b: int,
    *,
    domain: Sequence[tuple[int, int]],
) -> int:
    signature = (a, b)
    if signature not in domain:
        raise DTierHarmonicCompressionError(f"q_v2_signature_out_of_domain:{a}:{b}")
    bucket = q_v2_bucket(a, b)
    if bucket == "perfect_fifth_tertian":
        return 0 if a == 4 else 1
    if bucket == "equal_stacked_nonperfect":
        return 2
    energy = combined_triad_dissonance(a, b)
    ranked_energies = sorted(
        {
            combined_triad_dissonance(*item)
            for item in domain
            if q_v2_bucket(*item) == "dissonance_ranked_other"
        },
        reverse=True,
    )
    return 3 + ranked_energies.index(energy)


def q_v2_signature(
    rooted: RootedScale,
    *,
    domain: Sequence[tuple[int, int]],
) -> tuple[tuple[int, ...], tuple[tuple[int, int], ...]]:
    values: list[int] = []
    signatures: list[tuple[int, int]] = []
    for degree in range(1, 8):
        triad = DegreeTriad(rooted, degree)
        signature = (triad.interval_signature[1], triad.interval_signature[2])
        values.append(q_v2_value(*signature, domain=domain))
        signatures.append(signature)
    return tuple(values), tuple(signatures)


def _scope_records(
    ledger: Iterable[Mapping[str, Any]],
) -> list[Mapping[str, Any]]:
    selected = [
        record
        for record in ledger
        if record.get("role") == "anchor" and record.get("tier") in D_TIERS
    ]
    selected.sort(key=lambda record: (D_TIERS.index(record["tier"]), record["id"]))
    if len(selected) != 49:
        raise DTierHarmonicCompressionError("scope_must_select_exactly_49_anchors")
    return selected


def _state_record(
    record: Mapping[str, Any],
    *,
    domain: Sequence[tuple[int, int]],
) -> dict[str, Any]:
    pitches = _pitch_classes(record)
    rooted = RootedScale.from_pitch_classes(pitches, root=0)
    q_values, signatures = q_v2_signature(rooted, domain=domain)
    office = record.get("office")
    if office not in GOVERNOR_DEGREES:
        raise DTierHarmonicCompressionError("anchor_office_must_have_chaldean_degree")
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
        "weightedProjection": {
            "numerator": weighted_numerator,
            "denominator": WEIGHT_DENOMINATOR,
        },
    }
    return {**core, "recordFingerprint": sha256_payload(core)}


def _all_anchor_vectors(
    ledger: Iterable[Mapping[str, Any]],
    *,
    domain: Sequence[tuple[int, int]],
) -> dict[str, list[tuple[int, tuple[int, ...]]]]:
    by_tier: dict[str, list[tuple[int, tuple[int, ...]]]] = defaultdict(list)
    for record in ledger:
        if record.get("role") != "anchor" or record.get("tier") not in ALL_TIERS:
            continue
        rooted = RootedScale.from_pitch_classes(_pitch_classes(record), root=0)
        values, _ = q_v2_signature(rooted, domain=domain)
        by_tier[record["tier"]].append((record["id"], values))
    for tier in by_tier:
        by_tier[tier].sort()
    if set(by_tier) != set(ALL_TIERS) or any(len(values) != 7 for values in by_tier.values()):
        raise DTierHarmonicCompressionError("all_anchor_vector_domain_changed")
    return dict(by_tier)


def _fixed_witness_bands(
    vectors: Mapping[str, Sequence[tuple[int, tuple[int, ...]]]],
) -> dict[str, Any]:
    tiers = []
    extrema: dict[str, tuple[int, int]] = {}
    for tier in ALL_TIERS:
        values = [
            (state_id, sum(weight * value for weight, value in zip(WEIGHT_NUMERATORS, vector, strict=True)))
            for state_id, vector in vectors[tier]
        ]
        minimum = min(values, key=lambda item: (item[1], item[0]))
        maximum = max(values, key=lambda item: (item[1], item[0]))
        extrema[tier] = (minimum[1], maximum[1])
        tiers.append(
            {
                "tier": tier,
                "minimum": {"stateId": minimum[0], "value": _ratio(Fraction(minimum[1], 407))},
                "maximum": {"stateId": maximum[0], "value": _ratio(Fraction(maximum[1], 407))},
            }
        )
    adjacent = []
    for lower, upper in zip(ALL_TIERS, ALL_TIERS[1:]):
        gap = extrema[upper][0] - extrema[lower][1]
        adjacent.append(
            {
                "lowerTier": lower,
                "upperTier": upper,
                "gap": _ratio(Fraction(gap, 407)),
                "relation": "disjoint" if gap > 0 else "touching" if gap == 0 else "overlap",
            }
        )
    return {
        "weightNumerators": list(WEIGHT_NUMERATORS),
        "weightDenominator": WEIGHT_DENOMINATOR,
        "tiers": tiers,
        "adjacentComparisons": adjacent,
        "declaredOrderStrictlySeparated": all(item["relation"] == "disjoint" for item in adjacent),
    }


def _constraint_rows(
    vectors: Mapping[str, Sequence[tuple[int, tuple[int, ...]]]],
    tier_pairs: Iterable[tuple[str, str]],
) -> tuple[tuple[str, tuple[int, ...]], ...]:
    rows: list[tuple[str, tuple[int, ...]]] = []
    hierarchy = ((0, 4), (4, 1), (1, 5), (5, 2), (2, 6), (6, 3))
    for higher, lower in hierarchy:
        row = [0] * 7
        row[higher] = 1
        row[lower] = -1
        rows.append((f"weight-order:w{higher + 1}>w{lower + 1}", tuple(row)))
    positivity = [0] * 7
    positivity[3] = 1
    rows.append(("weight-positive:w4", tuple(positivity)))
    for lower_tier, upper_tier in tier_pairs:
        for lower_id, lower_vector in vectors[lower_tier]:
            for upper_id, upper_vector in vectors[upper_tier]:
                rows.append(
                    (
                        f"band:{lower_tier}:{lower_id}<{upper_tier}:{upper_id}",
                        tuple(
                            upper - lower
                            for lower, upper in zip(lower_vector, upper_vector, strict=True)
                        ),
                    )
                )
    return tuple(rows)


def _solve_margin_audit(
    audit_id: str,
    rows: Sequence[tuple[str, tuple[int, ...]]],
) -> dict[str, Any]:
    # Variables are w1..w7 and common margin m. A row r*w >= m becomes -r*w+m <= 0.
    matrix = [tuple(-value for value in row) + (1,) for _, row in rows]
    bounds = [0] * len(rows)
    matrix.extend([(1, 1, 1, 1, 1, 1, 1, 0), (-1, -1, -1, -1, -1, -1, -1, 0)])
    bounds.extend([LP_NORMALIZATION, -LP_NORMALIZATION])
    result = solve_exact_lp(matrix, bounds, (0, 0, 0, 0, 0, 0, 0, 1))
    if result.status in {"LIMIT", "INFEASIBLE"}:
        return {
            "auditId": audit_id,
            "status": "LIMIT" if result.status == "LIMIT" else "WEAK_SYSTEM_INFEASIBLE",
            "constraintCount": len(rows),
            "constraintFingerprint": sha256_payload(
                [{"constraintId": item_id, "row": list(row)} for item_id, row in rows]
            ),
            "iterations": result.iterations,
            "weights": None,
            "margin": None,
            "activeConstraintIds": [],
            "verification": (
                "not_run"
                if result.status == "LIMIT"
                else "phase_one_exact_infeasibility"
            ),
        }
    if result.status != "OPTIMAL" or result.variables is None or result.objective is None:
        raise DTierHarmonicCompressionError(f"lp_solver_failed:{audit_id}:{result.status}")
    weights = result.variables[:7]
    margin = result.variables[7]
    slacks = [sum(Fraction(value) * weight for value, weight in zip(row, weights, strict=True)) - margin for _, row in rows]
    if sum(weights) != LP_NORMALIZATION or min(weights) < 0 or min(slacks) < 0:
        raise DTierHarmonicCompressionError(f"lp_primal_replay_failed:{audit_id}")
    active = [constraint_id for (constraint_id, _), slack in zip(rows, slacks, strict=True) if slack == 0]
    status = "OPTIMAL_STRICT" if margin > 0 else "OPTIMAL_ZERO_MARGIN"
    return {
        "auditId": audit_id,
        "status": status,
        "constraintCount": len(rows),
        "constraintFingerprint": sha256_payload(
            [{"constraintId": item_id, "row": list(row)} for item_id, row in rows]
        ),
        "iterations": result.iterations,
        "weights": [_ratio(value) for value in weights],
        "margin": _ratio(margin),
        "activeConstraintIds": active,
        "verification": "all_constraints_replayed_exactly",
    }


def build_lp_audit(
    vectors: Mapping[str, Sequence[tuple[int, tuple[int, ...]]]],
) -> dict[str, Any]:
    declared_pairs = tuple(zip(ALL_TIERS, ALL_TIERS[1:]))
    d_pairs = tuple(zip(D_TIERS, D_TIERS[1:]))
    a_d_pairs = tuple((a_tier, d_tier) for a_tier in ALL_TIERS[:3] for d_tier in D_TIERS)
    calibration_rows = list(
        _constraint_rows(vectors, (("A0", "A1"), ("A1", "A2")))
    )
    a0_vectors = dict(vectors["A0"])
    for previous, following in zip(A0_ORDER_STATE_IDS, A0_ORDER_STATE_IDS[1:]):
        calibration_rows.append(
            (
                f"a0-order:{previous}<{following}",
                tuple(
                    following_value - previous_value
                    for previous_value, following_value in zip(
                        a0_vectors[previous], a0_vectors[following], strict=True
                    )
                ),
            )
        )
    calibration = _solve_margin_audit(
        "GOV-213-A-tier-calibration",
        tuple(calibration_rows),
    )
    if calibration["status"] != "OPTIMAL_STRICT":
        raise DTierHarmonicCompressionError("a_tier_lp_calibration_failed")
    return {
        "schemaVersion": "gov-227.exact-tier-separation-audit.v1",
        "solver": {
            "algorithm": "two_phase_simplex",
            "arithmetic": "fractions.Fraction",
            "pivotRule": "bland",
            "normalization": LP_NORMALIZATION,
            "objective": "maximize_common_strict_margin",
        },
        "fixedWitness": _fixed_witness_bands(vectors),
        "calibration": calibration,
        "models": [
            _solve_margin_audit(
                "declared-order-A0-through-D7",
                _constraint_rows(vectors, declared_pairs),
            ),
            _solve_margin_audit(
                "D1-through-D7",
                _constraint_rows(vectors, d_pairs),
            ),
            _solve_margin_audit(
                "A-block-before-D-block",
                _constraint_rows(vectors, a_d_pairs),
            ),
        ],
    }


def _tier_summaries(records: Sequence[Mapping[str, Any]]) -> list[dict[str, Any]]:
    summaries = []
    for tier in D_TIERS:
        members = [record for record in records if record["tier"] == tier]
        if len(members) != 7:
            raise DTierHarmonicCompressionError(f"tier_must_have_seven_anchors:{tier}")
        signatures = {
            tuple(sorted(record["triadicCompressionSignature"])) for record in members
        }
        if len(signatures) != 1:
            raise DTierHarmonicCompressionError(f"tier_q_multiset_mismatch:{tier}")
        q_multiset = next(iter(signatures))
        minimum = min(
            members,
            key=lambda item: (item["weightedProjection"]["numerator"], item["stateId"]),
        )
        maximum = max(
            members,
            key=lambda item: (item["weightedProjection"]["numerator"], -item["stateId"]),
        )
        summaries.append(
            {
                "tier": tier,
                "forte": TIER_FAMILIES[tier],
                "stateCount": 7,
                "compressionClassMultiset": list(q_multiset),
                "unweightedSum": sum(q_multiset),
                "governorSeatClassMultiset": sorted(
                    record["governorSeatCompressionClass"] for record in members
                ),
                "minimum": {
                    "stateId": minimum["stateId"],
                    "name": minimum["name"],
                    "value": minimum["weightedProjection"],
                },
                "maximum": {
                    "stateId": maximum["stateId"],
                    "name": maximum["name"],
                    "value": maximum["weightedProjection"],
                },
            }
        )
    return summaries


def _signature_classes(domain: Sequence[tuple[int, int]]) -> list[dict[str, Any]]:
    return [
        {
            "signature": list(signature),
            "bucket": q_v2_bucket(*signature),
            "combinedDissonance": _ratio(combined_triad_dissonance(*signature)),
            "value": q_v2_value(*signature, domain=domain),
            "qV1Value": Q_BY_SIGNATURE.get(signature),
        }
        for signature in domain
    ]


def _negative_controls(ledger: Sequence[Mapping[str, Any]]) -> dict[str, Any]:
    satellite = min(
        (
            record
            for record in ledger
            if record.get("tier") in D_TIERS and record.get("role") == "satellite"
        ),
        key=lambda record: record["id"],
    )
    boundary = min(
        (record for record in ledger if record.get("role") == "boundary"),
        key=lambda record: record["id"],
    )
    a_tier = min(
        (
            record
            for record in ledger
            if record.get("role") == "anchor" and record.get("tier") == "A0"
        ),
        key=lambda record: record["id"],
    )
    return {
        "tierOnlySatelliteSelection": {
            "stateId": satellite["id"],
            "tier": satellite["tier"],
            "role": satellite["role"],
            "result": "excluded",
        },
        "boundarySelection": {
            "stateId": boundary["id"],
            "tier": boundary.get("tier"),
            "role": boundary["role"],
            "result": "excluded",
        },
        "aTierSelection": {
            "stateId": a_tier["id"],
            "tier": a_tier["tier"],
            "role": a_tier["role"],
            "result": "excluded",
        },
    }


def build_d_tier_harmonic_compression_candidate(
    *,
    root: Path,
    reverse_input: bool = False,
) -> dict[str, Any]:
    ledger_path = root / "canonical/universal-heptatonic-ledger.json"
    spec_path = root / "docs/MATHEMATICAL_REALIZATION_SPECIFICATION.md"
    theorem_path = root / "docs/D_TIER_TRIADIC_COMPRESSION_THEOREM.md"
    a_tier_path = root / "canonical/harmonic-compression-candidates/CH_A012_q_v1.json"
    guard_path = root / "seven-governors-harmonic-invariants-v0.1.0/canonical/compression-namespace-guard.json"
    scrum_path = root / "scrum/GOV-227-d-tier-harmonic-compression-audit.md"
    if _file_sha256(a_tier_path) != A_TIER_FILE_SHA256 or a_tier_path.stat().st_size != 16_008:
        raise DTierHarmonicCompressionError("a_tier_candidate_byte_identity_changed")
    ledger = _read_json(ledger_path)
    if reverse_input:
        ledger = list(reversed(ledger))
    domain = derive_q_v2_domain(ledger)
    selected = _scope_records(ledger)
    records = [_state_record(record, domain=domain) for record in selected]
    records.sort(key=lambda record: (D_TIERS.index(record["tier"]), record["stateId"]))
    vectors = _all_anchor_vectors(ledger, domain=domain)
    q_v1_fidelity = [
        {
            "signature": list(signature),
            "qV1Value": value,
            "qV2Value": q_v2_value(*signature, domain=domain),
        }
        for signature, value in sorted(Q_BY_SIGNATURE.items())
    ]
    if any(item["qV1Value"] != item["qV2Value"] for item in q_v1_fidelity):
        raise DTierHarmonicCompressionError("q_v2_does_not_reproduce_q_v1")
    d3 = [record for record in records if record["tier"] == "D3"]
    d4 = [record for record in records if record["tier"] == "D4"]
    d2 = [record for record in records if record["tier"] == "D2"]
    d5 = [record for record in records if record["tier"] == "D5"]
    d3_q = {tuple(record["triadicCompressionSignature"]) for record in d3}
    d4_q = {tuple(record["triadicCompressionSignature"]) for record in d4}
    d2_q = {tuple(record["triadicCompressionSignature"]) for record in d2}
    d5_q = {tuple(record["triadicCompressionSignature"]) for record in d5}
    if d3_q & d4_q:
        raise DTierHarmonicCompressionError("z_partner_q_tuple_collision")
    guard = _read_json(guard_path)["compressionGuard"]
    if guard.get("namespace") != "harmonic.C_H" or guard.get("status") != "unresolved" or guard.get("value") is not None:
        raise DTierHarmonicCompressionError("global_C_H_guard_changed")
    core = {
        "schemaVersion": SCHEMA_VERSION,
        "releaseId": RELEASE_ID,
        "storyId": "GOV-227",
        "candidateId": CANDIDATE_ID,
        "coordinateId": COORDINATE_ID,
        "status": "admitted_scoped_D17",
        "authority": "root_owned_scoped_harmonic_audit",
        "admissionEffect": "Q_and_W_D17_only",
        "scope": {
            "selection": {"role": "anchor", "tiers": list(D_TIERS)},
            "families": [TIER_FAMILIES[tier] for tier in D_TIERS],
            "tuning": "12-TET",
            "rootConvention": "declared_root_normalized_to_pitch_class_0",
            "stateCount": 49,
            "excluded": [
                "A0-A2 anchors",
                "satellites",
                "boundary states",
                "Neo4j projection",
                "runtime integration",
                "global harmonic.C_H",
            ],
        },
        "method": {
            "algorithmVersion": ALGORITHM_VERSION,
            "triadDerivation": "court_mathematics.DegreeTriad",
            "qVersion": "q_v2",
            "qFormula": {
                "pairwiseIntervals": ["a", "b-a", "b"],
                "combinedDissonance": "delta(a)+delta(b-a)+delta(b)",
                "perfectFifthTertian": "major=0;minor=1",
                "equalStackedNonperfect": 2,
                "other": "3+descending-unique-combined-dissonance-rank",
                "rankDomain": "all 21 signatures observed across the 70 A0-D7 anchors",
                "ordinalInterpretation": "structural class, not a monotone acoustic-energy magnitude",
            },
            "intervalClassDissonance": [
                {"intervalClass": interval_class, "value": _ratio(value)}
                for interval_class, value in INTERVAL_CLASS_DISSONANCE.items()
            ],
            "signatureClasses": _signature_classes(domain),
            "degreeOrder": [1, 2, 3, 4, 5, 6, 7],
            "governorDegreeMap": GOVERNOR_DEGREES,
            "weightVersion": "chaldean_order_witness_v1_descriptive_only",
            "weightNumerators": list(WEIGHT_NUMERATORS),
            "weightDenominator": WEIGHT_DENOMINATOR,
            "weightOrdering": "w1>w5>w2>w6>w3>w7>w4>0",
            "uniquenessClaim": False,
        },
        "sourceBindings": [
            {"bindingId": "canonical-heptatonic-ledger", "path": "canonical/universal-heptatonic-ledger.json", "sha256": _file_sha256(ledger_path), "role": "authoritative_state_identity"},
            {"bindingId": "interval-class-dissonance-spec", "path": "docs/MATHEMATICAL_REALIZATION_SPECIFICATION.md", "sha256": _file_sha256(spec_path), "role": "q_v2_weight_source"},
            {"bindingId": "d-tier-triadic-theorem", "path": "docs/D_TIER_TRIADIC_COMPRESSION_THEOREM.md", "sha256": _file_sha256(theorem_path), "role": "scoped_research_theorem"},
            {"bindingId": "a-tier-byte-pinned-baseline", "path": "canonical/harmonic-compression-candidates/CH_A012_q_v1.json", "sha256": _file_sha256(a_tier_path), "role": "q_v1_fidelity_and_nonmutation_baseline"},
            {"bindingId": "global-C_H-guard", "path": "seven-governors-harmonic-invariants-v0.1.0/canonical/compression-namespace-guard.json", "sha256": _file_sha256(guard_path), "role": "global_namespace_boundary"},
            {"bindingId": "gov-227-admission-scope", "path": "scrum/GOV-227-d-tier-harmonic-compression-audit.md", "sha256": _file_sha256(scrum_path), "role": "reviewed_admission_scope"},
        ],
        "records": records,
        "tierSummaries": _tier_summaries(records),
        "comparisonEvidence": {
            "qV1Fidelity": q_v1_fidelity,
            "zPartnerD3D4": {
                "d3Forte": "7-Z37",
                "d4Forte": "7-Z17",
                "sharedIntervalVector": d3[0]["intervalVector"],
                "intervalVectorsEqual": d3[0]["intervalVector"] == d4[0]["intervalVector"],
                "distinctRawSignatureMultisets": sorted(d3[0]["triadIntervalSignatures"]) != sorted(d4[0]["triadIntervalSignatures"]),
                "distinctQMultisets": sorted(d3[0]["triadicCompressionSignature"]) != sorted(d4[0]["triadicCompressionSignature"]),
                "crossTierQTupleCollisionCount": len(d3_q & d4_q),
            },
            "d2D5MultisetTwins": {
                "d2Forte": "7-15",
                "d5Forte": "7-Z12",
                "sharedQMultiset": sorted(d2[0]["triadicCompressionSignature"]),
                "sharedUnweightedSum": sum(d2[0]["triadicCompressionSignature"]),
                "distinctRawSignatureMultisets": (
                    sorted(d2[0]["triadIntervalSignatures"])
                    != sorted(d5[0]["triadIntervalSignatures"])
                ),
                "crossTierQTupleCollisionCount": len(d2_q & d5_q),
                "interpretation": "rooted Q tuple required for discrimination, not the q_v2 multiset",
            },
        },
        "linearProgrammingAudit": build_lp_audit(vectors),
        "negativeControls": _negative_controls(ledger),
        "globalAggregate": {
            "namespace": "harmonic.C_H",
            "status": "unresolved",
            "value": None,
            "guardLiteral": GLOBAL_GUARD_LITERAL,
        },
        "reviewGate": {
            "stage": "B",
            "releaseBinding": "admitted_in_release_1_6_0",
            "neo4jIntegration": "prohibited",
        },
        "deferredWork": [
            "full_462_state_collision_analysis",
            "satellite_and_boundary_extension",
            "fifteen_operator_delta_audit",
            "C_P_C_H_C_S_correspondence_evaluation",
            "Neo4j_and_runtime_integration",
        ],
    }
    return {**core, "candidateFingerprint": sha256_payload(core)}


def serialize_d_tier_candidate(document: Mapping[str, Any]) -> bytes:
    return canonical_json_bytes(document)


def verify_d_tier_candidate(document: Mapping[str, Any], *, root: Path) -> None:
    if not isinstance(document, Mapping):
        raise DTierHarmonicCompressionError("candidate_must_be_object")
    fingerprint = document.get("candidateFingerprint")
    core = {key: value for key, value in document.items() if key != "candidateFingerprint"}
    if fingerprint != sha256_payload(core):
        raise DTierHarmonicCompressionError("candidate_fingerprint_mismatch")
    expected = build_d_tier_harmonic_compression_candidate(root=root)
    if canonical_json_bytes(document) != canonical_json_bytes(expected):
        raise DTierHarmonicCompressionError("candidate_does_not_match_fresh_build")


def d_tier_candidate_file_sha256(document: Mapping[str, Any]) -> str:
    return sha256_bytes(serialize_d_tier_candidate(document))


def tampered_copy(document: Mapping[str, Any]) -> dict[str, Any]:
    return deepcopy(document)
