from __future__ import annotations

from court_mathematics import PitchClassSet, minimum_voice_leading

from ._oracles import (
    LOCAL_OPERATORS,
    OPERATORS,
    apply_court_filter,
    apply_inverse,
    apply_operator,
    canonical_masks,
    classify_partial_composition,
    commutation_metrics,
    inverse_operator,
    mutation_application_map,
    operator_pairs,
    read_csv,
)


MASKS = canonical_masks()
MASK_SET = set(MASKS)


def test_all_15_operator_domains_images_and_generated_applications_match() -> None:
    registry = read_csv("operator-registry.csv")
    application_rows = read_csv("operator-applications.csv")
    applications = mutation_application_map()

    assert tuple(row["operator_id"] for row in registry) == OPERATORS
    assert len(registry) == 15
    assert len(application_rows) == len(applications) == 3402
    for operator_id in OPERATORS:
        expected = {
            source: target
            for source in MASKS
            if (target := apply_operator(operator_id, source)) is not None
        }
        generated = {
            source: target
            for (operator, source), target in applications.items()
            if operator == operator_id
        }
        expected_size = 462 if operator_id == "M" else 210
        assert expected == generated
        assert len(expected) == expected_size
        assert len(set(expected.values())) == expected_size
        assert set(expected.values()) <= MASK_SET


def test_all_operator_inverse_laws_hold_on_exact_domains_and_images() -> None:
    for operator_id in OPERATORS:
        domain = {
            source
            for source in MASKS
            if apply_operator(operator_id, source) is not None
        }
        image = set()
        for source in domain:
            target = apply_operator(operator_id, source)
            assert target is not None
            image.add(target)
            assert apply_inverse(operator_id, target) == source
        if operator_id == "M":
            assert image == MASK_SET
            for source in MASKS:
                target = source
                for _ in range(7):
                    target = apply_operator("M", target)
                    assert target is not None
                assert target == source
        else:
            assert image == {
                state
                for state in MASKS
                if apply_operator(inverse_operator(operator_id), state) is not None
            }


def test_aeolian_r7_harmonic_minor_transition_is_exact() -> None:
    source = 1453
    target = 2477
    result = apply_operator("R7", source)

    assert result == target
    assert apply_operator("L7", target) == source
    assert apply_operator("R7", target) is None
    assert (source ^ target).bit_count() == 2
    assert PitchClassSet(source).hamming_distance(PitchClassSet(target)) == 2
    assert minimum_voice_leading(PitchClassSet(source), PitchClassSet(target)).distance == 1


def test_commutation_table_is_complete_and_matches_independent_partial_oracle() -> None:
    rows = read_csv("commutation-summary.csv")
    by_pair = {(row["operator_a"], row["operator_b"]): row for row in rows}
    integer_fields = (
        "source_states_tested",
        "a_then_b_defined",
        "b_then_a_defined",
        "both_defined",
        "equal_when_both_defined",
        "unequal_when_both_defined",
        "domain_asymmetry",
        "neither_defined",
        "both_first_steps_defined",
        "direct_diamonds",
        "blocked_critical_pairs",
    )

    assert len(rows) == len(operator_pairs()) == 91
    assert set(by_pair) == set(operator_pairs())
    total_equal = 0
    total_asymmetry = 0
    for pair in operator_pairs():
        expected = commutation_metrics(*pair, MASKS)
        row = by_pair[pair]
        for field in integer_fields:
            assert int(row[field]) == expected[field]
        assert row["classification"] == expected["classification"]
        total_equal += expected["equal_when_both_defined"]
        total_asymmetry += expected["domain_asymmetry"]

    assert total_equal == 7644
    assert total_asymmetry == 3528
    assert all(row["unequal_when_both_defined"] == "0" for row in rows)


def test_undefined_compositions_are_five_valued_and_never_raise() -> None:
    observed = set()
    for operator_a, operator_b in operator_pairs():
        for source in MASKS:
            a_target = apply_operator(operator_a, source)
            b_target = apply_operator(operator_b, source)
            left = apply_operator(operator_b, a_target) if a_target is not None else None
            right = apply_operator(operator_a, b_target) if b_target is not None else None
            observed.add(classify_partial_composition(left, right))
    assert observed == {"commutes", "left_undefined", "right_undefined", "both_undefined"}

    court_mask = 1189
    mutation_then_filter = apply_court_filter(apply_operator("R7", 1453), court_mask)
    filter_then_mutation = apply_operator("R7", apply_court_filter(1453, court_mask))
    assert mutation_then_filter == (2477 & court_mask) == 165
    assert filter_then_mutation is None
    assert classify_partial_composition(mutation_then_filter, filter_then_mutation) == "right_undefined"
