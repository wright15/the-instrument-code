from __future__ import annotations

from fractions import Fraction

import pytest

from harmonic_invariants import (
    CourtInvariantError,
    court_kappa,
    court_position_index,
    signed_transition_vector,
    verify_court_gram,
    verify_disjoint_supports,
    verify_hamming_path,
    verify_weight_five,
)


MASKS = (661, 677, 1189, 1193, 1321)


def test_court_geometry_is_exact() -> None:
    vectors = tuple(
        signed_transition_vector(MASKS[index], MASKS[index + 1]) for index in range(4)
    )
    assert verify_court_gram(vectors) == (
        (2, 0, 0, 0),
        (0, 2, 0, 0),
        (0, 0, 2, 0),
        (0, 0, 0, 2),
    )
    assert verify_hamming_path(MASKS) == tuple(
        tuple(2 * abs(left - right) for right in range(5)) for left in range(5)
    )
    assert verify_weight_five(MASKS) == (5, 5, 5, 5, 5)
    assert tuple(court_kappa(index) for index in range(5)) == (
        Fraction(0, 1),
        Fraction(1, 4),
        Fraction(1, 2),
        Fraction(3, 4),
        Fraction(1, 1),
    )


def test_gram_failure_names_the_entry() -> None:
    vector = signed_transition_vector(MASKS[0], MASKS[1])
    with pytest.raises(CourtInvariantError, match="court_gram_entry_mismatch") as caught:
        verify_court_gram((vector, vector, signed_transition_vector(MASKS[2], MASKS[3]), signed_transition_vector(MASKS[3], MASKS[4])))
    assert caught.value.detail == {"row": 0, "column": 1, "expected": 0, "actual": 2}


def test_disjoint_support_failure_names_overlapping_pitch() -> None:
    assert verify_disjoint_supports(((4, 5), (9, 10), (2, 3), (7, 8)))
    with pytest.raises(CourtInvariantError, match="court_xor_support_overlap") as caught:
        verify_disjoint_supports(((4, 5), (5, 10), (2, 3), (7, 8)))
    assert caught.value.detail["pitch"] == 5


def test_weight_and_off_path_fail_closed() -> None:
    for mask, actual in ((15, 4), (63, 6)):
        with pytest.raises(CourtInvariantError, match="court_weight_mismatch") as caught:
            verify_weight_five((mask,))
        assert caught.value.detail["actual"] == actual
    with pytest.raises(CourtInvariantError, match="court_off_path_mask"):
        court_position_index(173, MASKS)
