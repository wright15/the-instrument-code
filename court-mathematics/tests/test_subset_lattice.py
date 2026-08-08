from __future__ import annotations

from collections import Counter
from dataclasses import FrozenInstanceError

import pytest

from court_mathematics import PitchClassSet, RootedScale, ScaleSubset, SubsetLattice


@pytest.fixture
def ionian_lattice() -> SubsetLattice:
    return SubsetLattice(
        RootedScale.from_pitch_classes((0, 2, 4, 5, 7, 9, 11), root=0)
    )


def test_heptatonic_lattice_has_complete_deterministic_layers(
    ionian_lattice: SubsetLattice,
) -> None:
    assert len(ionian_lattice.dyads) == 21
    assert len(ionian_lattice.trichords) == 35
    assert len(ionian_lattice.subtriads) == 35
    assert len(ionian_lattice.incidences) == 105
    assert ionian_lattice.dyads[0].degrees == (1, 2)
    assert ionian_lattice.dyads[-1].degrees == (6, 7)
    assert ionian_lattice.trichords[0].degrees == (1, 2, 3)
    assert ionian_lattice.trichords[-1].degrees == (5, 6, 7)


def test_every_trichord_has_three_dyad_predecessors(
    ionian_lattice: SubsetLattice,
) -> None:
    predecessor_counts = Counter(
        edge.trichord_degrees for edge in ionian_lattice.incidences
    )
    successor_counts = Counter(edge.dyad_degrees for edge in ionian_lattice.incidences)

    assert set(predecessor_counts.values()) == {3}
    assert set(successor_counts.values()) == {5}


def test_lattice_preserves_degree_identity_and_pitch_set(
    ionian_lattice: SubsetLattice,
) -> None:
    tonic_triad_subset = ionian_lattice.find_trichord((1, 3, 5))

    assert tonic_triad_subset.pitch_classes == (0, 4, 7)
    assert tonic_triad_subset.pitch_set.pitch_classes == (0, 4, 7)
    assert tonic_triad_subset.degree_mask == 0b0010101
    assert tonic_triad_subset.subset_id == "degrees:1-3-5"


def test_lattice_requires_exactly_seven_scale_degrees() -> None:
    pentatonic = RootedScale.from_pitch_classes((0, 2, 4, 7, 9), root=0)

    with pytest.raises(Exception, match="rooted_scale_requires_cardinality_7"):
        SubsetLattice(pentatonic)


def test_lattice_is_deeply_immutable(ionian_lattice: SubsetLattice) -> None:
    with pytest.raises(FrozenInstanceError):
        ionian_lattice.dyads = ()  # type: ignore[misc]
    with pytest.raises(TypeError):
        ionian_lattice.dyads[0].degrees[0] = 7  # type: ignore[index]


def test_subset_rejects_mutable_constructor_sequences() -> None:
    pitches = [0, 2]
    rooted_scale = RootedScale.from_pitch_classes(
        (0, 2, 4, 5, 7, 9, 11),
        root=0,
    )
    with pytest.raises(TypeError, match="subset_pitch_classes_must_be_tuple"):
        ScaleSubset(
            rooted_scale=rooted_scale,
            degrees=(1, 2),
            pitch_classes=pitches,  # type: ignore[arg-type]
            pitch_set=PitchClassSet.from_pitch_classes(pitches),
            degree_mask=0b11,
        )


def test_subset_rejects_degree_pitch_mapping_outside_parent_scale() -> None:
    rooted_scale = RootedScale.from_pitch_classes(
        (0, 2, 4, 5, 7, 9, 11),
        root=0,
    )

    with pytest.raises(Exception, match="subset_degree_pitch_mapping_mismatch"):
        ScaleSubset(
            rooted_scale=rooted_scale,
            degrees=(1, 2),
            pitch_classes=(0, 11),
            pitch_set=PitchClassSet.from_pitch_classes((0, 11)),
            degree_mask=0b11,
        )
