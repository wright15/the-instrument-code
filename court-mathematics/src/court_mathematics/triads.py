"""Rooted degree-stacked triads for heptatonic scales."""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum

from .pitch_class import PitchClassError, PitchClassSet, RootedScale


class TriadQuality(str, Enum):
    MAJOR = "major"
    MINOR = "minor"
    DIMINISHED = "diminished"
    AUGMENTED = "augmented"
    OTHER = "other"


_QUALITY_BY_INTERVALS = {
    (4, 7): TriadQuality.MAJOR,
    (3, 7): TriadQuality.MINOR,
    (3, 6): TriadQuality.DIMINISHED,
    (4, 8): TriadQuality.AUGMENTED,
}


@dataclass(frozen=True, slots=True)
class DegreeTriad:
    """One root/third/fifth stack derived from a seven-note rooted scale."""

    rooted_scale: RootedScale
    degree: int
    root_pitch_class: int = field(init=False)
    stacked_degrees: tuple[int, int, int] = field(init=False)
    subset_degrees: tuple[int, int, int] = field(init=False)
    pitch_classes: tuple[int, int, int] = field(init=False)
    pitch_set: PitchClassSet = field(init=False)
    interval_signature: tuple[int, int, int] = field(init=False)
    quality: TriadQuality = field(init=False)

    def __post_init__(self) -> None:
        if not isinstance(self.rooted_scale, RootedScale):
            raise TypeError("rooted_scale_must_be_rooted_scale")
        self.rooted_scale.require_cardinality(7)
        if type(self.degree) is not int or not 1 <= self.degree <= 7:
            raise PitchClassError("triad_degree_must_be_integer_1_through_7")

        root_index = self.degree - 1
        indexes = (root_index, (root_index + 2) % 7, (root_index + 4) % 7)
        stacked_degrees = tuple(index + 1 for index in indexes)
        pitches = tuple(self.rooted_scale.ordered_pitch_classes[index] for index in indexes)
        extended = self.rooted_scale.relative_intervals + tuple(
            interval + 12 for interval in self.rooted_scale.relative_intervals
        )
        third = extended[root_index + 2] - extended[root_index]
        fifth = extended[root_index + 4] - extended[root_index]
        signature = (0, third, fifth)
        pitch_set = PitchClassSet.from_pitch_classes(
            pitches,
            tuning=self.rooted_scale.pitch_set.tuning,
        )

        object.__setattr__(self, "root_pitch_class", pitches[0])
        object.__setattr__(self, "stacked_degrees", stacked_degrees)
        object.__setattr__(self, "subset_degrees", tuple(sorted(stacked_degrees)))
        object.__setattr__(self, "pitch_classes", pitches)
        object.__setattr__(self, "pitch_set", pitch_set)
        object.__setattr__(self, "interval_signature", signature)
        object.__setattr__(
            self,
            "quality",
            _QUALITY_BY_INTERVALS.get((third, fifth), TriadQuality.OTHER),
        )

    def to_canonical_dict(self, *, include_source: bool = True) -> dict[str, object]:
        body: dict[str, object] = {
            "degree": self.degree,
            "intervalSignature": list(self.interval_signature),
            "pitchClasses": list(self.pitch_classes),
            "pitchSet": self.pitch_set.to_canonical_dict(),
            "quality": self.quality.value,
            "rootPitchClass": self.root_pitch_class,
            "stackedDegrees": list(self.stacked_degrees),
            "subsetDegrees": list(self.subset_degrees),
        }
        if include_source:
            body["rootedScale"] = self.rooted_scale.to_canonical_dict()
        return body


def derive_degree_triads(rooted_scale: RootedScale) -> tuple[DegreeTriad, ...]:
    rooted_scale.require_cardinality(7)
    return tuple(DegreeTriad(rooted_scale, degree) for degree in range(1, 8))
