from __future__ import annotations

import pytest

from court_mathematics import (
    PitchClassSet,
    VoiceLeadingAssignment,
    VoiceLeadingError,
    VoiceLeadingResult,
    minimum_voice_leading,
    single_semitone_moves,
)


def test_aeolian_to_harmonic_minor_distinguishes_hamming_and_voice_leading() -> None:
    aeolian = PitchClassSet.from_pitch_classes((0, 2, 3, 5, 7, 8, 10))
    harmonic_minor = PitchClassSet.from_pitch_classes((0, 2, 3, 5, 7, 8, 11))

    result = minimum_voice_leading(aeolian, harmonic_minor)

    assert aeolian.hamming_distance(harmonic_minor) == 2
    assert result.distance == 1
    assert result.common_tone_count == 6
    assert tuple(
        (
            assignment.source_pitch_class,
            assignment.target_pitch_class,
            assignment.signed_displacement,
        )
        for assignment in result.assignments
        if assignment.signed_displacement
    ) == ((10, 11, 1),)


def test_voice_leading_distance_is_symmetric_for_reference_transition() -> None:
    source = PitchClassSet.from_pitch_classes((0, 2, 3, 5, 7, 8, 10))
    target = PitchClassSet.from_pitch_classes((0, 2, 3, 5, 7, 8, 11))

    assert minimum_voice_leading(source, target).distance == minimum_voice_leading(
        target, source
    ).distance


def test_voice_leading_tie_break_preserves_available_common_tone() -> None:
    source = PitchClassSet.from_pitch_classes((0, 1))
    target = PitchClassSet.from_pitch_classes((1, 2))

    result = minimum_voice_leading(source, target)

    assert result.distance == 2
    assert tuple(
        (assignment.source_pitch_class, assignment.target_pitch_class)
        for assignment in result.assignments
    ) == ((0, 2), (1, 1))


def test_voice_leading_result_rejects_nonminimal_public_witness() -> None:
    source = PitchClassSet.from_pitch_classes((0, 1))

    with pytest.raises(
        VoiceLeadingError,
        match="voice_leading_witness_not_canonical_minimum",
    ):
        VoiceLeadingResult(
            source_mask=source.mask,
            target_mask=source.mask,
            distance=2,
            common_tone_count=2,
            assignments=(
                VoiceLeadingAssignment(0, 1, 1),
                VoiceLeadingAssignment(1, 0, -1),
            ),
        )


def test_voice_leading_assignment_rejects_boolean_displacement() -> None:
    with pytest.raises(
        VoiceLeadingError,
        match="assignment_displacement_must_be_integer",
    ):
        VoiceLeadingAssignment(0, 1, True)  # type: ignore[arg-type]


def test_single_semitone_inventory_contains_r7_move() -> None:
    aeolian = PitchClassSet.from_pitch_classes((0, 2, 3, 5, 7, 8, 10))

    moves = single_semitone_moves(aeolian)

    assert any(
        move.source_pitch_class == 10
        and move.target_pitch_class == 11
        and move.signed_displacement == 1
        for move in moves
    )
    assert all(abs(move.signed_displacement) == 1 for move in moves)


def test_voice_leading_rejects_cardinality_mismatch() -> None:
    triad = PitchClassSet.from_pitch_classes((0, 4, 7))
    tetrad = PitchClassSet.from_pitch_classes((0, 4, 7, 11))

    with pytest.raises(VoiceLeadingError, match="voice_leading_requires_equal_cardinality"):
        minimum_voice_leading(triad, tetrad)
