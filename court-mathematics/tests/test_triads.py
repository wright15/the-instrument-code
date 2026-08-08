from __future__ import annotations

import pytest

from court_mathematics import (
    DegreeTriad,
    PitchClassError,
    RootedScale,
    TriadQuality,
    derive_degree_triads,
)


def _qualities(rooted_scale: RootedScale) -> tuple[str, ...]:
    return tuple(triad.quality.value for triad in derive_degree_triads(rooted_scale))


def test_ionian_degree_triads_follow_canonical_quality_sequence() -> None:
    ionian = RootedScale.from_pitch_classes((0, 2, 4, 5, 7, 9, 11), root=0)
    triads = derive_degree_triads(ionian)

    assert _qualities(ionian) == (
        "major",
        "minor",
        "minor",
        "major",
        "major",
        "minor",
        "diminished",
    )
    assert triads[0].stacked_degrees == (1, 3, 5)
    assert triads[0].interval_signature == (0, 4, 7)
    assert triads[6].stacked_degrees == (7, 2, 4)
    assert triads[6].subset_degrees == (2, 4, 7)
    assert triads[6].interval_signature == (0, 3, 6)


def test_harmonic_minor_inventory_contains_augmented_and_major_dominant() -> None:
    harmonic_minor = RootedScale.from_pitch_classes(
        (0, 2, 3, 5, 7, 8, 11),
        root=0,
    )
    triads = derive_degree_triads(harmonic_minor)

    assert _qualities(harmonic_minor) == (
        "minor",
        "diminished",
        "augmented",
        "minor",
        "major",
        "major",
        "diminished",
    )
    assert triads[2].quality is TriadQuality.AUGMENTED
    assert triads[4].quality is TriadQuality.MAJOR


def test_arbitrary_heptatonic_triads_use_other_instead_of_fabricating_quality() -> None:
    lydian_minor = RootedScale.from_pitch_classes(
        (0, 2, 4, 6, 7, 8, 10),
        root=0,
    )

    assert _qualities(lydian_minor) == (
        "major",
        "other",
        "diminished",
        "other",
        "minor",
        "augmented",
        "augmented",
    )


def test_degree_triads_are_covariant_under_transposition() -> None:
    c_ionian = RootedScale.from_pitch_classes((0, 2, 4, 5, 7, 9, 11), root=0)
    d_ionian = c_ionian.transpose(2)
    c_triads = derive_degree_triads(c_ionian)
    d_triads = derive_degree_triads(d_ionian)

    assert tuple(triad.quality for triad in c_triads) == tuple(
        triad.quality for triad in d_triads
    )
    assert tuple(triad.interval_signature for triad in c_triads) == tuple(
        triad.interval_signature for triad in d_triads
    )
    assert d_triads[0].root_pitch_class == 2


@pytest.mark.parametrize("degree", (0, 8, True))
def test_degree_triad_rejects_invalid_degree(degree: object) -> None:
    ionian = RootedScale.from_pitch_classes((0, 2, 4, 5, 7, 9, 11), root=0)

    with pytest.raises(PitchClassError, match="triad_degree_must_be_integer_1_through_7"):
        DegreeTriad(ionian, degree)  # type: ignore[arg-type]
