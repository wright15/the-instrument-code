"""Immutable production API for fixed-root Court projections."""

from __future__ import annotations

from dataclasses import dataclass
from types import MappingProxyType
from typing import Any, Literal, Mapping


Classification = Literal["commutes", "does_not_commute", "left_undefined", "right_undefined", "both_undefined"]
ADMITTED_FILTER_MASKS = frozenset((173, 425, 661, 677, 1189, 1193, 1321))


class CourtFilterError(ValueError):
    """A fail-closed API error with a stable machine reason."""

    def __init__(self, reason_code: str, **detail: Any) -> None:
        self.reason_code = reason_code
        self.detail: Mapping[str, Any] = MappingProxyType(detail)
        super().__init__(reason_code)


@dataclass(frozen=True, slots=True)
class CourtFilterOperator:
    filter_id: str
    filter_type: Literal["linear_diagonal"]
    mask: int
    set_class_id: str
    domain: str = "binary_vector_12"
    image: str = "support_subsets_of_c"
    global_inverse: Literal["none_non_injective_projection"] = "none_non_injective_projection"
    image_restriction_inverse: Literal["identity"] = "identity"
    commutation_declaration: Literal["five_valued_total_evaluator"] = "five_valued_total_evaluator"

    def __post_init__(self) -> None:
        if self.filter_type != "linear_diagonal":
            raise CourtFilterError("filter_type_not_admitted", filterType=self.filter_type)
        _validate_mask(self.mask, "filter_mask_invalid")
        if self.mask not in ADMITTED_FILTER_MASKS:
            raise CourtFilterError("filter_mask_not_admitted", mask=self.mask)


@dataclass(frozen=True, slots=True)
class FilterApplication:
    filter_id: str
    source_mask: int
    filter_mask: int
    output_mask: int
    source_weight: int
    retained_weight: int
    exact_bit_reduction: int


@dataclass(frozen=True, slots=True)
class MutationApplication:
    operator_id: str
    source_mask: int
    target_mask: int


@dataclass(frozen=True, slots=True)
class CommutationResult:
    filter_id: str
    operator_id: str
    source_mask: int
    classification: Classification
    left_result: int | None
    right_result: int | None
    left_undefined_reason: str | None
    right_undefined_reason: str | None


def _validate_mask(mask: int, reason: str = "ambient_vector_invalid") -> None:
    if isinstance(mask, bool) or not isinstance(mask, int) or not 0 <= mask <= 0xFFF:
        raise CourtFilterError(reason, mask=mask)


def apply_filter(operator: CourtFilterOperator, source_mask: int) -> FilterApplication:
    """Apply P_c(x) = x AND c in fixed root coordinates."""
    _validate_mask(source_mask)
    output = source_mask & operator.mask
    source_weight = source_mask.bit_count()
    retained_weight = output.bit_count()
    result = FilterApplication(
        filter_id=operator.filter_id,
        source_mask=source_mask,
        filter_mask=operator.mask,
        output_mask=output,
        source_weight=source_weight,
        retained_weight=retained_weight,
        exact_bit_reduction=source_weight - retained_weight,
    )
    if output & ~source_mask or output & ~operator.mask:
        raise CourtFilterError("filter_subset_invariant_failed")
    if (output & operator.mask) != output:
        raise CourtFilterError("filter_idempotence_invariant_failed")
    if retained_weight != (source_mask & operator.mask).bit_count():
        raise CourtFilterError("filter_retained_weight_invariant_failed")
    return result


def apply_admitted_mutation(operator_id: str, source_mask: int) -> MutationApplication:
    """Independent implementation of the audit's 15 admitted operators."""
    _validate_mask(source_mask, "mutation_source_invalid")
    pitches = [pitch for pitch in range(12) if source_mask & (1 << pitch)]
    if len(pitches) != 7 or pitches[0] != 0:
        raise CourtFilterError(
            "mutation_domain_not_rooted_weight_seven",
            operatorId=operator_id,
            sourceMask=source_mask,
            weight=len(pitches),
        )
    if operator_id == "M":
        root = pitches[1]
        target_pitches = [(pitch - root) % 12 for pitch in pitches]
    else:
        if len(operator_id) != 2 or operator_id[0] not in "RL" or operator_id[1] not in "1234567":
            raise CourtFilterError("mutation_operator_unknown", operatorId=operator_id)
        direction = 1 if operator_id[0] == "R" else -1
        degree = int(operator_id[1])
        if degree == 1:
            blocked = 1 if direction == 1 else 11
            if blocked in pitches:
                raise CourtFilterError("mutation_operator_undefined", operatorId=operator_id, sourceMask=source_mask)
            absolute = [pitch for pitch in pitches if pitch != 0] + [blocked]
            rotation = 11 if direction == 1 else 1
            target_pitches = [(pitch + rotation) % 12 for pitch in absolute]
        else:
            source_pitch = pitches[degree - 1]
            target_pitch = source_pitch + direction
            if target_pitch <= 0 or target_pitch >= 12 or target_pitch in pitches:
                raise CourtFilterError("mutation_operator_undefined", operatorId=operator_id, sourceMask=source_mask)
            target_pitches = [target_pitch if index == degree - 1 else pitch for index, pitch in enumerate(pitches)]
    target_mask = sum(1 << pitch for pitch in target_pitches)
    return MutationApplication(operator_id, source_mask, target_mask)


def evaluate_commutation(operator: CourtFilterOperator, mutation_operator_id: str, source_mask: int) -> CommutationResult:
    """Evaluate P_c T and T P_c in the required five-valued result space."""
    left_result = right_result = None
    left_reason = right_reason = None
    try:
        mutation = apply_admitted_mutation(mutation_operator_id, source_mask)
        left_result = apply_filter(operator, mutation.target_mask).output_mask
    except CourtFilterError as error:
        left_reason = error.reason_code
    filtered = apply_filter(operator, source_mask)
    try:
        right_result = apply_admitted_mutation(mutation_operator_id, filtered.output_mask).target_mask
    except CourtFilterError as error:
        right_reason = error.reason_code
    if left_reason and right_reason:
        classification: Classification = "both_undefined"
    elif left_reason:
        classification = "left_undefined"
    elif right_reason:
        classification = "right_undefined"
    elif left_result == right_result:
        classification = "commutes"
    else:
        classification = "does_not_commute"
    return CommutationResult(
        operator.filter_id,
        mutation_operator_id,
        source_mask,
        classification,
        left_result,
        right_result,
        left_reason,
        right_reason,
    )
