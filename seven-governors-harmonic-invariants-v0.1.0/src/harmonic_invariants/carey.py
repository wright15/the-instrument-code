"""Independent exact enumeration of Carey/Rahn differences and failures."""

from __future__ import annotations

from dataclasses import dataclass
from fractions import Fraction
from itertools import combinations
from typing import Iterable

from court_mathematics import PitchClassSet


CAREY_535_PRIME_FORM = (0, 2, 4, 7, 9)


class CareyScopeError(ValueError):
    """Stable scoped-evaluator rejection."""

    def __init__(self, reason_code: str) -> None:
        super().__init__(reason_code)
        self.reason_code = reason_code


@dataclass(frozen=True, slots=True)
class CareyEnumeration:
    pitch_classes: tuple[int, ...]
    interval_instances: tuple[dict[str, int], ...]
    difference_witnesses: tuple[dict[str, object], ...]
    ambiguity_witnesses: tuple[dict[str, object], ...]
    contradiction_witnesses: tuple[dict[str, object], ...]
    difference_slots: int
    failure_slots: int
    difference_count: int
    cross_generic_comparisons: int
    ambiguity_count: int
    contradiction_count: int
    failure_count: int
    sameness_quotient: Fraction
    coherence_quotient: Fraction


def _interval_record(origin: int, generic: int, pitches: tuple[int, ...]) -> dict[str, int]:
    cardinality = len(pitches)
    destination = (origin + generic) % cardinality
    return {
        "origin": origin,
        "destination": destination,
        "generic": generic,
        "specific": (pitches[destination] - pitches[origin]) % 12,
    }


def _pair_witness(kind: str, left: dict[str, int], right: dict[str, int]) -> dict[str, object]:
    return {
        "witnessId": (
            f"{kind}:g{left['generic']}:o{left['origin']}:"
            f"g{right['generic']}:o{right['origin']}"
        ),
        "left": left,
        "right": right,
    }


def enumerate_carey(pitch_classes: Iterable[int]) -> CareyEnumeration:
    pitches = tuple(sorted(pitch_classes))
    if len(pitches) != 5 or len(set(pitches)) != 5 or any(
        type(pitch) is not int or not 0 <= pitch < 12 for pitch in pitches
    ):
        raise CareyScopeError("carey_requires_five_unique_12_tet_pitch_classes")
    by_address = {
        (origin, generic): _interval_record(origin, generic, pitches)
        for generic in range(1, 5)
        for origin in range(5)
    }
    interval_instances = tuple(
        by_address[(origin, generic)]
        for generic in range(1, 5)
        for origin in range(5)
    )
    differences = []
    for generic in range(1, 5):
        for left_origin, right_origin in combinations(range(5), 2):
            left = by_address[(left_origin, generic)]
            right = by_address[(right_origin, generic)]
            if left["specific"] != right["specific"]:
                differences.append(_pair_witness("difference", left, right))
    ambiguities = []
    contradictions = []
    cross_generic_comparisons = 0
    for lower_generic in range(1, 5):
        for higher_generic in range(lower_generic + 1, 5):
            for lower_origin in range(5):
                for higher_origin in range(5):
                    cross_generic_comparisons += 1
                    lower = by_address[(lower_origin, lower_generic)]
                    higher = by_address[(higher_origin, higher_generic)]
                    if lower["specific"] == higher["specific"]:
                        ambiguities.append(_pair_witness("ambiguity", lower, higher))
                    elif lower["specific"] > higher["specific"]:
                        contradictions.append(_pair_witness("contradiction", lower, higher))
    difference_slots = sum(1 for _generic in range(1, 5) for _ in combinations(range(5), 2))
    failure_slots = len(tuple(combinations(range(5), 3))) + 3 * len(
        tuple(combinations(range(5), 4))
    )
    difference_count = len(differences)
    failure_count = len(ambiguities) + len(contradictions)
    return CareyEnumeration(
        pitch_classes=pitches,
        interval_instances=interval_instances,
        difference_witnesses=tuple(differences),
        ambiguity_witnesses=tuple(ambiguities),
        contradiction_witnesses=tuple(contradictions),
        difference_slots=difference_slots,
        failure_slots=failure_slots,
        difference_count=difference_count,
        cross_generic_comparisons=cross_generic_comparisons,
        ambiguity_count=len(ambiguities),
        contradiction_count=len(contradictions),
        failure_count=failure_count,
        sameness_quotient=Fraction(difference_slots - difference_count, difference_slots),
        coherence_quotient=Fraction(failure_slots - failure_count, failure_slots),
    )


def evaluate_carey_535(
    pitch_classes: Iterable[int], *, tuning: str = "12-TET", generator_step: int = 7
) -> CareyEnumeration:
    if tuning != "12-TET":
        raise CareyScopeError("carey_tuning_unsupported")
    if generator_step != 7:
        raise CareyScopeError("carey_generator_mismatch")
    pitches = tuple(pitch_classes)
    pitch_set = PitchClassSet.from_pitch_classes(pitches)
    if pitch_set.prime_form != CAREY_535_PRIME_FORM:
        raise CareyScopeError("carey_scope_requires_forte_5_35")
    return enumerate_carey(pitches)
