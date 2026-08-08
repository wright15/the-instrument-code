from __future__ import annotations

from dataclasses import FrozenInstanceError

import pytest

from court_mathematics import (
    PitchClassError,
    PitchClassSet,
    PitchClassSymmetry,
    RootedScale,
    compute_prime_form,
    invert_mask,
    transpose_mask,
)


def test_diatonic_set_derives_forte_compatible_invariants() -> None:
    ionian = PitchClassSet.from_pitch_classes((0, 2, 4, 5, 7, 9, 11))

    assert ionian.mask == 2741
    assert ionian.cardinality == 7
    assert ionian.prime_form == (0, 1, 3, 5, 6, 8, 10)
    assert ionian.interval_vector == (2, 5, 4, 3, 6, 1)
    assert ionian.symmetry.transpositional_stabilizers == (0,)
    assert ionian.symmetry.is_achiral
    assert ionian.tuning.value == "12-TET"


@pytest.mark.parametrize(
    "forte_prime_form",
    (
        (0, 1, 3, 7, 8),
        (0, 1, 3, 6, 8, 9),
        (0, 1, 3, 5, 8, 9),
        (0, 1, 2, 3, 5, 8, 9),
        (0, 1, 2, 4, 7, 8, 9),
        (0, 1, 2, 4, 5, 7, 9, 10),
    ),
)
def test_prime_form_uses_forte_left_packing_on_all_rahn_ties(
    forte_prime_form: tuple[int, ...],
) -> None:
    pitch_set = PitchClassSet.from_pitch_classes(forte_prime_form)

    assert pitch_set.prime_form == forte_prime_form


def test_prime_form_and_interval_vector_are_tni_invariant() -> None:
    source = PitchClassSet.from_pitch_classes((0, 1, 3, 5, 6, 8, 10))

    for index in range(12):
        transposed = PitchClassSet(transpose_mask(source.mask, index))
        inverted = PitchClassSet(invert_mask(source.mask, index))
        assert transposed.prime_form == source.prime_form
        assert inverted.prime_form == source.prime_form
        assert transposed.interval_vector == source.interval_vector
        assert inverted.interval_vector == source.interval_vector


def test_prime_form_partition_covers_all_224_tni_set_classes() -> None:
    prime_forms = {compute_prime_form(mask) for mask in range(1 << 12)}

    assert len(prime_forms) == 224


def test_symmetry_stores_exact_stabilizers_for_7_33() -> None:
    lydian_minor_prime = PitchClassSet.from_pitch_classes((0, 1, 2, 4, 6, 8, 10))

    assert lydian_minor_prime.interval_vector == (2, 6, 2, 6, 2, 3)
    assert lydian_minor_prime.symmetry.transpositional_stabilizers == (0,)
    assert lydian_minor_prime.symmetry.inversional_stabilizers == (2,)
    assert not lydian_minor_prime.symmetry.has_nontrivial_transpositional_symmetry


def test_whole_tone_subset_has_sixfold_transpositional_symmetry() -> None:
    whole_tone = PitchClassSet.from_pitch_classes((0, 2, 4, 6, 8, 10))

    assert whole_tone.symmetry.transpositional_stabilizers == (0, 2, 4, 6, 8, 10)


def test_symmetry_contract_rejects_stabilizers_not_realized_by_source() -> None:
    with pytest.raises(
        PitchClassError,
        match="symmetry_stabilizers_source_mismatch",
    ):
        PitchClassSymmetry(
            source_mask=1,
            transpositional_stabilizers=(0, 1),
            inversional_stabilizers=(),
        )


def test_rooted_scale_orders_degrees_from_nonzero_root() -> None:
    a_aeolian = RootedScale.from_pitch_classes(
        (0, 2, 4, 5, 7, 9, 11),
        root=9,
    )

    assert a_aeolian.ordered_pitch_classes == (9, 11, 0, 2, 4, 5, 7)
    assert a_aeolian.relative_intervals == (0, 2, 3, 5, 7, 8, 10)
    assert a_aeolian.step_intervals == (2, 1, 2, 2, 1, 2, 2)


@pytest.mark.parametrize("mask", (-1, 4096, True, 1.0))
def test_pitch_class_set_rejects_invalid_masks(mask: object) -> None:
    with pytest.raises(PitchClassError, match="mask_must_be_12_bit_integer"):
        PitchClassSet(mask)  # type: ignore[arg-type]


def test_pitch_class_set_rejects_duplicate_or_invalid_pitch_input() -> None:
    with pytest.raises(PitchClassError, match="pitch_classes_must_be_unique"):
        PitchClassSet.from_pitch_classes((0, 0, 7))
    with pytest.raises(PitchClassError, match="pitch_class_must_be_integer_0_through_11"):
        PitchClassSet.from_pitch_classes((0, True, 7))


def test_rooted_scale_requires_root_membership() -> None:
    with pytest.raises(PitchClassError, match="root_must_belong_to_pitch_set"):
        RootedScale.from_pitch_classes((0, 2, 4), root=1)


def test_value_objects_are_immutable() -> None:
    pitch_set = PitchClassSet.from_pitch_classes((0, 4, 7))

    with pytest.raises(FrozenInstanceError):
        pitch_set.mask = 0  # type: ignore[misc]
