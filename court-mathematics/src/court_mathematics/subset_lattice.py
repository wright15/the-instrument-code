"""Deterministic rank-2/rank-3 slices of a rooted heptatonic subset lattice."""

from __future__ import annotations

from dataclasses import dataclass, field
from itertools import combinations

from .pitch_class import PitchClassError, PitchClassSet, RootedScale


@dataclass(frozen=True, slots=True)
class ScaleSubset:
    """One degree-addressed dyad or trichord within a rooted scale."""

    rooted_scale: RootedScale
    degrees: tuple[int, ...]
    pitch_classes: tuple[int, ...]
    pitch_set: PitchClassSet
    degree_mask: int

    def __post_init__(self) -> None:
        if not isinstance(self.degrees, tuple):
            raise TypeError("subset_degrees_must_be_tuple")
        if not isinstance(self.pitch_classes, tuple):
            raise TypeError("subset_pitch_classes_must_be_tuple")
        degrees = tuple(self.degrees)
        pitch_classes = tuple(self.pitch_classes)
        if not isinstance(self.rooted_scale, RootedScale):
            raise TypeError("subset_rooted_scale_must_be_rooted_scale")
        self.rooted_scale.require_cardinality(7)
        if not isinstance(self.pitch_set, PitchClassSet):
            raise TypeError("subset_pitch_set_must_be_pitch_class_set")
        if len(degrees) not in {2, 3}:
            raise PitchClassError("scale_subset_rank_must_be_two_or_three")
        if degrees != tuple(sorted(set(degrees))):
            raise PitchClassError("subset_degrees_must_be_sorted_unique")
        if any(type(degree) is not int or not 1 <= degree <= 7 for degree in degrees):
            raise PitchClassError("subset_degree_must_be_integer_1_through_7")
        if len(pitch_classes) != len(degrees):
            raise PitchClassError("subset_pitch_count_mismatch")
        expected_pitches = tuple(
            self.rooted_scale.ordered_pitch_classes[degree - 1]
            for degree in degrees
        )
        if pitch_classes != expected_pitches:
            raise PitchClassError("subset_degree_pitch_mapping_mismatch")
        expected_set = PitchClassSet.from_pitch_classes(
            pitch_classes,
            tuning=self.pitch_set.tuning,
        )
        if expected_set != self.pitch_set:
            raise PitchClassError("subset_pitch_set_mismatch")
        expected_mask = sum(1 << (degree - 1) for degree in degrees)
        if type(self.degree_mask) is not int or self.degree_mask != expected_mask:
            raise PitchClassError("subset_degree_mask_mismatch")
        object.__setattr__(self, "degrees", degrees)
        object.__setattr__(self, "pitch_classes", pitch_classes)

    @property
    def rank(self) -> int:
        return len(self.degrees)

    @property
    def subset_id(self) -> str:
        return "degrees:" + "-".join(str(degree) for degree in self.degrees)

    def to_canonical_dict(self, *, include_source: bool = True) -> dict[str, object]:
        body: dict[str, object] = {
            "degreeMask": self.degree_mask,
            "degrees": list(self.degrees),
            "pitchClasses": list(self.pitch_classes),
            "pitchSet": self.pitch_set.to_canonical_dict(),
            "rank": self.rank,
            "subsetId": self.subset_id,
        }
        if include_source:
            body["rootedScale"] = self.rooted_scale.to_canonical_dict()
        return body


@dataclass(frozen=True, slots=True)
class SubsetIncidence:
    """A Boolean-lattice cover edge from one dyad to one trichord."""

    dyad_degrees: tuple[int, int]
    trichord_degrees: tuple[int, int, int]

    def __post_init__(self) -> None:
        if not isinstance(self.dyad_degrees, tuple):
            raise TypeError("incidence_dyad_degrees_must_be_tuple")
        if not isinstance(self.trichord_degrees, tuple):
            raise TypeError("incidence_trichord_degrees_must_be_tuple")
        dyad = tuple(self.dyad_degrees)
        trichord = tuple(self.trichord_degrees)
        if len(dyad) != 2:
            raise PitchClassError("incidence_requires_two_dyad_degrees")
        if len(trichord) != 3:
            raise PitchClassError("incidence_requires_three_trichord_degrees")
        if any(type(degree) is not int or not 1 <= degree <= 7 for degree in dyad + trichord):
            raise PitchClassError("incidence_degree_must_be_integer_1_through_7")
        if dyad != tuple(sorted(set(dyad))):
            raise PitchClassError("incidence_dyad_degrees_must_be_sorted_unique")
        if trichord != tuple(sorted(set(trichord))):
            raise PitchClassError("incidence_trichord_degrees_must_be_sorted_unique")
        if not set(dyad).issubset(trichord):
            raise PitchClassError("incidence_requires_subset_relation")
        object.__setattr__(self, "dyad_degrees", dyad)
        object.__setattr__(self, "trichord_degrees", trichord)

    def to_canonical_dict(self) -> dict[str, object]:
        return {
            "dyadDegrees": list(self.dyad_degrees),
            "trichordDegrees": list(self.trichord_degrees),
        }


@dataclass(frozen=True, slots=True)
class SubsetLattice:
    """The complete dyad/trichord incidence structure of a seven-note scale."""

    rooted_scale: RootedScale
    dyads: tuple[ScaleSubset, ...] = field(init=False)
    trichords: tuple[ScaleSubset, ...] = field(init=False)
    incidences: tuple[SubsetIncidence, ...] = field(init=False)

    def __post_init__(self) -> None:
        if not isinstance(self.rooted_scale, RootedScale):
            raise TypeError("rooted_scale_must_be_rooted_scale")
        self.rooted_scale.require_cardinality(7)
        ordered = self.rooted_scale.ordered_pitch_classes

        def build_subset(indexes: tuple[int, ...]) -> ScaleSubset:
            degrees = tuple(index + 1 for index in indexes)
            pitches = tuple(ordered[index] for index in indexes)
            return ScaleSubset(
                rooted_scale=self.rooted_scale,
                degrees=degrees,
                pitch_classes=pitches,
                pitch_set=PitchClassSet.from_pitch_classes(
                    pitches,
                    tuning=self.rooted_scale.pitch_set.tuning,
                ),
                degree_mask=sum(1 << index for index in indexes),
            )

        dyads = tuple(build_subset(indexes) for indexes in combinations(range(7), 2))
        trichords = tuple(build_subset(indexes) for indexes in combinations(range(7), 3))
        incidences = tuple(
            SubsetIncidence(dyad.degrees, trichord.degrees)
            for dyad in dyads
            for trichord in trichords
            if set(dyad.degrees).issubset(trichord.degrees)
        )
        if (len(dyads), len(trichords), len(incidences)) != (21, 35, 105):
            raise AssertionError("heptatonic_subset_lattice_count_mismatch")
        object.__setattr__(self, "dyads", dyads)
        object.__setattr__(self, "trichords", trichords)
        object.__setattr__(self, "incidences", incidences)

    @property
    def subtriads(self) -> tuple[ScaleSubset, ...]:
        """Compatibility name for the 35 unrooted trichord subsets."""

        return self.trichords

    def find_trichord(self, degrees: tuple[int, int, int]) -> ScaleSubset:
        normalized = tuple(sorted(degrees))
        for trichord in self.trichords:
            if trichord.degrees == normalized:
                return trichord
        raise KeyError("trichord_not_found")

    def to_canonical_dict(self, *, include_source: bool = True) -> dict[str, object]:
        body: dict[str, object] = {
            "dyads": [
                dyad.to_canonical_dict(include_source=False)
                for dyad in self.dyads
            ],
            "incidences": [edge.to_canonical_dict() for edge in self.incidences],
            "trichords": [
                trichord.to_canonical_dict(include_source=False)
                for trichord in self.trichords
            ],
        }
        if include_source:
            body["rootedScale"] = self.rooted_scale.to_canonical_dict()
        return body
