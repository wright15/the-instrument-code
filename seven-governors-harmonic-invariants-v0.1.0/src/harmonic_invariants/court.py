"""Production Court geometry and exact coordinate invariants."""

from __future__ import annotations

from fractions import Fraction
from typing import Iterable, Sequence


class CourtInvariantError(ValueError):
    """Stable machine-readable Court invariant rejection."""

    def __init__(self, reason_code: str, **detail: object) -> None:
        super().__init__(reason_code)
        self.reason_code = reason_code
        self.detail = detail


def _require_mask(mask: object) -> int:
    if type(mask) is not int or not 0 < mask < (1 << 12):
        raise CourtInvariantError("court_mask_invalid", mask=mask)
    return mask


def signed_transition_vector(source_mask: int, target_mask: int) -> tuple[int, ...]:
    source = _require_mask(source_mask)
    target = _require_mask(target_mask)
    if (source ^ target).bit_count() != 2:
        raise CourtInvariantError(
            "court_transition_not_single_swap", sourceMask=source, targetMask=target
        )
    return tuple(
        (1 if target & (1 << pitch) else 0)
        - (1 if source & (1 << pitch) else 0)
        for pitch in range(12)
    )


def gram_matrix(vectors: Sequence[Sequence[int]]) -> tuple[tuple[int, ...], ...]:
    materialized = tuple(tuple(vector) for vector in vectors)
    if not materialized or any(len(vector) != 12 for vector in materialized):
        raise CourtInvariantError("court_vector_dimension_invalid")
    return tuple(
        tuple(sum(left[index] * right[index] for index in range(12)) for right in materialized)
        for left in materialized
    )


def verify_court_gram(vectors: Sequence[Sequence[int]]) -> tuple[tuple[int, ...], ...]:
    matrix = gram_matrix(vectors)
    if len(matrix) != 4:
        raise CourtInvariantError("court_gram_dimension_invalid", actual=len(matrix))
    for row, values in enumerate(matrix):
        for column, actual in enumerate(values):
            expected = 2 if row == column else 0
            if actual != expected:
                raise CourtInvariantError(
                    "court_gram_entry_mismatch",
                    row=row,
                    column=column,
                    expected=expected,
                    actual=actual,
                )
    return matrix


def court_hamming_matrix(position_masks: Sequence[int]) -> tuple[tuple[int, ...], ...]:
    masks = tuple(_require_mask(mask) for mask in position_masks)
    return tuple(tuple((left ^ right).bit_count() for right in masks) for left in masks)


def verify_hamming_path(position_masks: Sequence[int]) -> tuple[tuple[int, ...], ...]:
    matrix = court_hamming_matrix(position_masks)
    for left_index, row in enumerate(matrix):
        for right_index, actual in enumerate(row):
            expected = 2 * abs(left_index - right_index)
            if actual != expected:
                raise CourtInvariantError(
                    "court_hamming_path_mismatch",
                    leftIndex=left_index,
                    rightIndex=right_index,
                    expected=expected,
                    actual=actual,
                )
    return matrix


def court_position_index(mask: int, position_masks: Sequence[int]) -> int:
    checked = _require_mask(mask)
    try:
        return tuple(position_masks).index(checked)
    except ValueError as error:
        raise CourtInvariantError("court_off_path_mask", mask=checked) from error


def verify_disjoint_supports(supports: Iterable[Iterable[int]]) -> tuple[tuple[int, ...], ...]:
    materialized = tuple(tuple(support) for support in supports)
    seen: dict[int, int] = {}
    for support_index, support in enumerate(materialized):
        if len(support) != 2 or len(set(support)) != 2:
            raise CourtInvariantError("court_xor_support_invalid", supportIndex=support_index)
        for pitch in support:
            if type(pitch) is not int or not 0 <= pitch < 12:
                raise CourtInvariantError(
                    "court_xor_support_invalid", supportIndex=support_index, pitch=pitch
                )
            if pitch in seen:
                raise CourtInvariantError(
                    "court_xor_support_overlap",
                    pitch=pitch,
                    firstSupportIndex=seen[pitch],
                    secondSupportIndex=support_index,
                )
            seen[pitch] = support_index
    return materialized


def verify_weight_five(position_masks: Sequence[int]) -> tuple[int, ...]:
    weights = tuple(_require_mask(mask).bit_count() for mask in position_masks)
    for position_index, weight in enumerate(weights):
        if weight != 5:
            raise CourtInvariantError(
                "court_weight_mismatch",
                positionIndex=position_index,
                expected=5,
                actual=weight,
            )
    return weights


def court_kappa(position_index: int) -> Fraction:
    if type(position_index) is not int or not 0 <= position_index <= 4:
        raise CourtInvariantError("court_position_index_invalid", positionIndex=position_index)
    return Fraction(position_index, 4)
