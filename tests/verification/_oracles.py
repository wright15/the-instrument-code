from __future__ import annotations

import csv
import hashlib
import json
from itertools import combinations
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
LEDGER_JSON = ROOT / "canonical/universal-heptatonic-ledger.json"
LEDGER_CSV = ROOT / "canonical/universal-heptatonic-ledger.csv"
NETWORK_JSON = ROOT / "canonical/universal-network-data.json"
MUTATION_ROOT = ROOT / "seven-governors-mutation-algebra-audit/audit"
OPERATORS = ("M",) + tuple(
    operator
    for degree in range(1, 8)
    for operator in (f"R{degree}", f"L{degree}")
)
LOCAL_OPERATORS = tuple(operator for operator in OPERATORS if operator != "M")


def canonical_records() -> tuple[dict[str, object], ...]:
    return tuple(json.loads(LEDGER_JSON.read_text(encoding="utf-8")))


def canonical_masks() -> tuple[int, ...]:
    return tuple(sorted(int(record["id"]) for record in canonical_records()))


def source_sha256() -> str:
    return hashlib.sha256(LEDGER_CSV.read_bytes()).hexdigest()


def pitch_classes(mask: int) -> tuple[int, ...]:
    return tuple(pc for pc in range(12) if mask & (1 << pc))


def mask_from_pitches(pitches) -> int:
    return sum(1 << pitch for pitch in pitches)


def _normalize(pitches, root: int) -> int:
    return mask_from_pitches((pitch - root) % 12 for pitch in pitches)


def apply_operator(operator_id: str, source_mask: int) -> int | None:
    pitches = pitch_classes(source_mask)
    if len(pitches) != 7 or pitches[0] != 0:
        return None
    if operator_id == "M":
        return _normalize(pitches, pitches[1])
    if len(operator_id) != 2 or operator_id[0] not in "RL" or operator_id[1] not in "1234567":
        raise ValueError("unknown_operator")
    direction = 1 if operator_id[0] == "R" else -1
    degree = int(operator_id[1])
    if degree == 1:
        target_root = 1 if direction == 1 else 11
        if target_root in pitches:
            return None
        absolute = (set(pitches) - {0}) | {target_root}
        return _normalize(absolute, target_root)
    source_pitch = pitches[degree - 1]
    target_pitch = source_pitch + direction
    if target_pitch <= 0 or target_pitch >= 12 or target_pitch in pitches:
        return None
    return mask_from_pitches((set(pitches) - {source_pitch}) | {target_pitch})


def inverse_operator(operator_id: str) -> str:
    if operator_id == "M":
        return "M^6"
    return ("L" if operator_id[0] == "R" else "R") + operator_id[1]


def apply_inverse(operator_id: str, source_mask: int) -> int | None:
    if operator_id != "M":
        return apply_operator(inverse_operator(operator_id), source_mask)
    result = source_mask
    for _ in range(6):
        result = apply_operator("M", result)
        assert result is not None
    return result


def read_csv(name: str) -> tuple[dict[str, str], ...]:
    with (MUTATION_ROOT / name).open(newline="", encoding="utf-8") as handle:
        return tuple(csv.DictReader(handle))


def mutation_application_map() -> dict[tuple[str, int], int]:
    rows = read_csv("operator-applications.csv")
    result = {
        (row["operator_id"], int(row["source_id"])): int(row["target_id"])
        for row in rows
    }
    if len(result) != len(rows):
        raise ValueError("duplicate_mutation_application")
    return result


def commutation_metrics(operator_a: str, operator_b: str, masks: tuple[int, ...]):
    metrics = {
        "source_states_tested": len(masks),
        "a_then_b_defined": 0,
        "b_then_a_defined": 0,
        "both_defined": 0,
        "equal_when_both_defined": 0,
        "unequal_when_both_defined": 0,
        "domain_asymmetry": 0,
        "neither_defined": 0,
        "both_first_steps_defined": 0,
        "direct_diamonds": 0,
        "blocked_critical_pairs": 0,
    }
    for source in masks:
        a_target = apply_operator(operator_a, source)
        b_target = apply_operator(operator_b, source)
        if a_target is not None and b_target is not None:
            metrics["both_first_steps_defined"] += 1
        left = apply_operator(operator_b, a_target) if a_target is not None else None
        right = apply_operator(operator_a, b_target) if b_target is not None else None
        left_defined = left is not None
        right_defined = right is not None
        metrics["a_then_b_defined"] += int(left_defined)
        metrics["b_then_a_defined"] += int(right_defined)
        if left_defined and right_defined:
            metrics["both_defined"] += 1
            if left == right:
                metrics["equal_when_both_defined"] += 1
                metrics["direct_diamonds"] += 1
            else:
                metrics["unequal_when_both_defined"] += 1
        elif left_defined or right_defined:
            metrics["domain_asymmetry"] += 1
        else:
            metrics["neither_defined"] += 1
    metrics["blocked_critical_pairs"] = (
        metrics["both_first_steps_defined"] - metrics["both_defined"]
    )
    metrics["classification"] = (
        "strong_partial_commutation"
        if metrics["domain_asymmetry"] == 0
        else "weak_common_domain_commutation"
    )
    return metrics


def classify_partial_composition(left: int | None, right: int | None) -> str:
    if left is None and right is None:
        return "both_undefined"
    if left is None:
        return "left_undefined"
    if right is None:
        return "right_undefined"
    return "commutes" if left == right else "does_not_commute"


def apply_court_filter(source_mask: int, court_mask: int) -> int:
    if type(source_mask) is not int or type(court_mask) is not int:
        raise TypeError("court_filter_masks_must_be_integers")
    if not 0 <= source_mask < 4096 or not 0 <= court_mask < 4096:
        raise ValueError("court_filter_masks_must_be_12_bit")
    return source_mask & court_mask


def operator_pairs():
    return tuple(combinations(LOCAL_OPERATORS, 2))
