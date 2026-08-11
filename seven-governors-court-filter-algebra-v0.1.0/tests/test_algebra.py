from __future__ import annotations

from dataclasses import FrozenInstanceError

import pytest

from court_filter_algebra import CourtFilterError, CourtFilterOperator, apply_admitted_mutation, apply_filter, evaluate_commutation


FILTERS = (
    CourtFilterOperator("court-filter:C0", "linear_diagonal", 661, "pentatonic:5-35"),
    CourtFilterOperator("court-filter:C1", "linear_diagonal", 677, "pentatonic:5-35"),
    CourtFilterOperator("court-filter:C2", "linear_diagonal", 1189, "pentatonic:5-35"),
    CourtFilterOperator("court-filter:C3", "linear_diagonal", 1193, "pentatonic:5-35"),
    CourtFilterOperator("court-filter:C4", "linear_diagonal", 1321, "pentatonic:5-35"),
    CourtFilterOperator("court-filter:5-23:root-0", "linear_diagonal", 173, "pentatonic:5-23"),
    CourtFilterOperator("court-filter:5-27:root-0", "linear_diagonal", 425, "pentatonic:5-27"),
)


def test_projection_invariants_over_the_ambient_domain() -> None:
    for operator in FILTERS:
        for source in range(4096):
            result = apply_filter(operator, source)
            assert result.output_mask & ~source == 0
            assert result.output_mask & ~operator.mask == 0
            assert apply_filter(operator, result.output_mask).output_mask == result.output_mask
            assert result.exact_bit_reduction == source.bit_count() - result.retained_weight


def test_api_is_immutable_and_reason_coded() -> None:
    result = apply_filter(FILTERS[0], 1453)
    with pytest.raises(FrozenInstanceError):
        result.output_mask = 0
    with pytest.raises(CourtFilterError, match="filter_type_not_admitted") as caught:
        CourtFilterOperator("bad", "fourier", 661, "pentatonic:5-35")
    assert caught.value.reason_code == "filter_type_not_admitted"
    with pytest.raises(CourtFilterError, match="filter_mask_not_admitted"):
        CourtFilterOperator("bad", "linear_diagonal", 31, "pentatonic:5-1")
    with pytest.raises(CourtFilterError, match="ambient_vector_invalid"):
        apply_filter(FILTERS[0], True)


def test_independent_mutation_and_five_valued_evaluator() -> None:
    mutation = apply_admitted_mutation("R7", 1453)
    assert mutation.target_mask == 2477
    result = evaluate_commutation(FILTERS[5], "R7", 1453)
    assert result.classification == "right_undefined"
    assert result.left_result == 173
    assert result.right_undefined_reason == "mutation_domain_not_rooted_weight_seven"
    undefined = evaluate_commutation(FILTERS[5], "R2", 1453)
    assert undefined.classification == "both_undefined"


def test_filter_never_changes_topology_records() -> None:
    source = {"id": 1453, "office": "Jupiter", "degreeGovernor": "Moon"}
    before = source.copy()
    apply_filter(FILTERS[5], source["id"])
    assert source == before
