"""Exact pitch-class voice-leading metrics and parsimonious move inventory."""

from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache

from .pitch_class import PitchClassSet


VOICE_LEADING_METRIC_ID = "pc-taxicab-bijection-v1"


class VoiceLeadingError(ValueError):
    def __init__(self, reason_code: str) -> None:
        super().__init__(reason_code)
        self.reason_code = reason_code


def signed_pitch_class_displacement(source: int, target: int) -> int:
    if type(source) is not int or not 0 <= source < 12:
        raise VoiceLeadingError("source_pitch_class_must_be_integer_0_through_11")
    if type(target) is not int or not 0 <= target < 12:
        raise VoiceLeadingError("target_pitch_class_must_be_integer_0_through_11")
    displacement = (target - source) % 12
    return displacement - 12 if displacement > 6 else displacement


@dataclass(frozen=True, slots=True)
class VoiceLeadingMove:
    source_mask: int
    target_mask: int
    source_pitch_class: int
    target_pitch_class: int
    signed_displacement: int

    def __post_init__(self) -> None:
        source = PitchClassSet(self.source_mask)
        target = PitchClassSet(self.target_mask)
        if not source.contains(self.source_pitch_class):
            raise VoiceLeadingError("move_source_pitch_missing")
        if source.contains(self.target_pitch_class):
            raise VoiceLeadingError("move_target_pitch_already_present")
        expected_mask = (source.mask ^ (1 << self.source_pitch_class)) | (
            1 << self.target_pitch_class
        )
        if target.mask != expected_mask:
            raise VoiceLeadingError("move_target_mask_mismatch")
        expected_displacement = signed_pitch_class_displacement(
            self.source_pitch_class,
            self.target_pitch_class,
        )
        if self.signed_displacement != expected_displacement:
            raise VoiceLeadingError("move_displacement_mismatch")
        if type(self.signed_displacement) is not int:
            raise VoiceLeadingError("move_displacement_must_be_integer")

    def to_canonical_dict(self) -> dict[str, object]:
        return {
            "signedDisplacement": self.signed_displacement,
            "sourceMask": self.source_mask,
            "sourcePitchClass": self.source_pitch_class,
            "targetMask": self.target_mask,
            "targetPitchClass": self.target_pitch_class,
        }


@dataclass(frozen=True, slots=True)
class VoiceLeadingAssignment:
    source_pitch_class: int
    target_pitch_class: int
    signed_displacement: int

    def __post_init__(self) -> None:
        if type(self.signed_displacement) is not int:
            raise VoiceLeadingError("assignment_displacement_must_be_integer")
        expected = signed_pitch_class_displacement(
            self.source_pitch_class,
            self.target_pitch_class,
        )
        if self.signed_displacement != expected:
            raise VoiceLeadingError("assignment_displacement_mismatch")

    def to_canonical_dict(self) -> dict[str, object]:
        return {
            "signedDisplacement": self.signed_displacement,
            "sourcePitchClass": self.source_pitch_class,
            "targetPitchClass": self.target_pitch_class,
        }


def _minimum_assignment(
    source: PitchClassSet,
    target: PitchClassSet,
) -> tuple[int, tuple[tuple[int, int, int], ...]]:
    sources = source.pitch_classes
    targets = target.pitch_classes
    count = len(sources)

    @lru_cache(maxsize=None)
    def solve(
        source_index: int,
        used_targets: int,
    ) -> tuple[int, tuple[tuple[int, int, int], ...]]:
        if source_index == count:
            return 0, ()
        candidates: list[tuple[int, tuple[tuple[int, int, int], ...]]] = []
        source_pc = sources[source_index]
        for target_index, target_pc in enumerate(targets):
            if used_targets & (1 << target_index):
                continue
            displacement = signed_pitch_class_displacement(source_pc, target_pc)
            remainder_cost, remainder = solve(
                source_index + 1,
                used_targets | (1 << target_index),
            )
            assignments = ((source_pc, target_pc, displacement),) + remainder
            candidates.append((abs(displacement) + remainder_cost, assignments))
        return min(
            candidates,
            key=lambda item: (
                item[0],
                -sum(source_pc == target_pc for source_pc, target_pc, _ in item[1]),
                item[1],
            ),
        )

    return solve(0, 0)


@dataclass(frozen=True, slots=True)
class VoiceLeadingResult:
    source_mask: int
    target_mask: int
    distance: int
    common_tone_count: int
    assignments: tuple[VoiceLeadingAssignment, ...]
    metric_id: str = VOICE_LEADING_METRIC_ID

    def __post_init__(self) -> None:
        if not isinstance(self.assignments, tuple):
            raise TypeError("voice_leading_assignments_must_be_tuple")
        source = PitchClassSet(self.source_mask)
        target = PitchClassSet(self.target_mask)
        assignments = tuple(self.assignments)
        object.__setattr__(self, "assignments", assignments)
        if source.cardinality != target.cardinality:
            raise VoiceLeadingError("voice_leading_requires_equal_cardinality")
        if type(self.distance) is not int or self.distance < 0:
            raise VoiceLeadingError("voice_leading_distance_must_be_nonnegative_integer")
        if type(self.common_tone_count) is not int or self.common_tone_count < 0:
            raise VoiceLeadingError("common_tone_count_must_be_nonnegative_integer")
        if len(assignments) != source.cardinality:
            raise VoiceLeadingError("voice_leading_assignment_count_mismatch")
        if any(not isinstance(item, VoiceLeadingAssignment) for item in assignments):
            raise VoiceLeadingError("assignments_must_be_voice_leading_assignments")
        if tuple(sorted(item.source_pitch_class for item in assignments)) != source.pitch_classes:
            raise VoiceLeadingError("voice_leading_source_assignment_mismatch")
        if tuple(sorted(item.target_pitch_class for item in assignments)) != target.pitch_classes:
            raise VoiceLeadingError("voice_leading_target_assignment_mismatch")
        if self.distance != sum(abs(item.signed_displacement) for item in assignments):
            raise VoiceLeadingError("voice_leading_distance_mismatch")
        expected_common = (source.mask & target.mask).bit_count()
        if self.common_tone_count != expected_common:
            raise VoiceLeadingError("voice_leading_common_tone_count_mismatch")
        if self.metric_id != VOICE_LEADING_METRIC_ID:
            raise VoiceLeadingError("unsupported_voice_leading_metric")
        expected_distance, expected_assignments = _minimum_assignment(source, target)
        actual_assignments = tuple(
            (item.source_pitch_class, item.target_pitch_class, item.signed_displacement)
            for item in assignments
        )
        if (self.distance, actual_assignments) != (expected_distance, expected_assignments):
            raise VoiceLeadingError("voice_leading_witness_not_canonical_minimum")

    def to_canonical_dict(self) -> dict[str, object]:
        return {
            "assignments": [item.to_canonical_dict() for item in self.assignments],
            "commonToneCount": self.common_tone_count,
            "distance": self.distance,
            "metricId": self.metric_id,
            "sourceMask": self.source_mask,
            "targetMask": self.target_mask,
        }


def minimum_voice_leading(
    source: PitchClassSet,
    target: PitchClassSet,
) -> VoiceLeadingResult:
    """Minimize total circular semitone displacement over all bijections."""

    if source.tuning is not target.tuning:
        raise VoiceLeadingError("voice_leading_tuning_mismatch")
    if source.cardinality != target.cardinality:
        raise VoiceLeadingError("voice_leading_requires_equal_cardinality")
    distance, raw_assignments = _minimum_assignment(source, target)
    assignments = tuple(
        VoiceLeadingAssignment(source_pc, target_pc, displacement)
        for source_pc, target_pc, displacement in raw_assignments
    )
    return VoiceLeadingResult(
        source_mask=source.mask,
        target_mask=target.mask,
        distance=distance,
        common_tone_count=(source.mask & target.mask).bit_count(),
        assignments=assignments,
    )


def single_semitone_moves(source: PitchClassSet) -> tuple[VoiceLeadingMove, ...]:
    """Enumerate every one-pitch, one-semitone replacement from a set."""

    moves: list[VoiceLeadingMove] = []
    absent = tuple(pc for pc in range(12) if not source.contains(pc))
    for source_pc in source.pitch_classes:
        for target_pc in absent:
            displacement = signed_pitch_class_displacement(source_pc, target_pc)
            if abs(displacement) != 1:
                continue
            target_mask = (source.mask ^ (1 << source_pc)) | (1 << target_pc)
            moves.append(
                VoiceLeadingMove(
                    source_mask=source.mask,
                    target_mask=target_mask,
                    source_pitch_class=source_pc,
                    target_pitch_class=target_pc,
                    signed_displacement=displacement,
                )
            )
    return tuple(moves)
