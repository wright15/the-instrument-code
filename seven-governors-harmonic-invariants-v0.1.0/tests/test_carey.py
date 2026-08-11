from __future__ import annotations

from collections import Counter
from fractions import Fraction

import pytest

from court_mathematics import PitchClassSet
from harmonic_invariants import CareyScopeError, enumerate_carey, evaluate_carey_535


COURT_SETS = (
    (0, 2, 4, 7, 9),
    (0, 2, 5, 7, 9),
    (0, 2, 5, 7, 10),
    (0, 3, 5, 7, 10),
    (0, 3, 5, 8, 10),
)


def test_carey_535_enumerates_counts_and_exact_quotients() -> None:
    result = evaluate_carey_535(COURT_SETS[0])
    assert len(result.interval_instances) == 20
    assert result.difference_slots == 40
    assert result.difference_count == 20
    assert result.failure_slots == 25
    assert result.cross_generic_comparisons == 150
    assert result.ambiguity_count == 0
    assert result.contradiction_count == 0
    assert result.failure_count == 0
    assert result.coherence_quotient == Fraction(1, 1)
    assert result.sameness_quotient == Fraction(1, 2)


def test_difference_histogram_independently_matches_witness_enumerator() -> None:
    result = evaluate_carey_535(COURT_SETS[0])
    by_generic = {}
    for interval in result.interval_instances:
        by_generic.setdefault(interval["generic"], Counter())[interval["specific"]] += 1
    histogram_differences = sum(
        left_count * right_count
        for counts in by_generic.values()
        for left_index, left_count in enumerate(counts.values())
        for right_count in list(counts.values())[left_index + 1 :]
    )
    assert histogram_differences == result.difference_count == 20


def test_all_court_modes_and_tni_forms_preserve_carey_counts() -> None:
    for pitches in COURT_SETS:
        result = evaluate_carey_535(pitches)
        assert (result.difference_count, result.failure_count) == (20, 0)
    seed = PitchClassSet.from_pitch_classes(COURT_SETS[0])
    for step in range(12):
        for transformed in (seed.transpose(step), seed.invert(step)):
            result = evaluate_carey_535(reversed(transformed.pitch_classes))
            assert (result.difference_count, result.failure_count) == (20, 0)


def test_5_23_raw_enumerator_is_diagnostic_but_scoped_evaluator_rejects() -> None:
    pitches = (0, 2, 3, 5, 7)
    raw = enumerate_carey(pitches)
    assert (
        raw.difference_count,
        raw.ambiguity_count,
        raw.contradiction_count,
        raw.failure_count,
    ) == (30, 4, 10, 14)
    with pytest.raises(CareyScopeError, match="carey_scope_requires_forte_5_35"):
        evaluate_carey_535(pitches)
