"""Exact pitch-class set and rooted-scale value objects for 12-TET."""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from itertools import combinations
from typing import Iterable, TypeAlias


PITCH_CLASS_MODULUS = 12
PITCH_CLASS_MASK = (1 << PITCH_CLASS_MODULUS) - 1
IntervalVector: TypeAlias = tuple[int, int, int, int, int, int]


class PitchClassError(ValueError):
    """A stable rejection raised by a pitch-class contract."""

    def __init__(self, reason_code: str) -> None:
        super().__init__(reason_code)
        self.reason_code = reason_code


class TuningSystem(str, Enum):
    TWELVE_TET = "12-TET"


def _require_pitch_class(value: object, field_name: str = "pitch_class") -> int:
    if type(value) is not int or not 0 <= value < PITCH_CLASS_MODULUS:
        raise PitchClassError(f"{field_name}_must_be_integer_0_through_11")
    return value


def _require_step(value: object) -> int:
    if type(value) is not int:
        raise PitchClassError("transposition_step_must_be_integer")
    return value % PITCH_CLASS_MODULUS


def pitch_classes_from_mask(mask: int) -> tuple[int, ...]:
    if type(mask) is not int or not 0 <= mask <= PITCH_CLASS_MASK:
        raise PitchClassError("mask_must_be_12_bit_integer")
    return tuple(pc for pc in range(PITCH_CLASS_MODULUS) if mask & (1 << pc))


def mask_from_pitch_classes(pitch_classes: Iterable[int]) -> int:
    values = tuple(pitch_classes)
    checked = tuple(_require_pitch_class(value) for value in values)
    if len(set(checked)) != len(checked):
        raise PitchClassError("pitch_classes_must_be_unique")
    return sum(1 << pc for pc in checked)


def transpose_mask(mask: int, steps: int) -> int:
    pitches = pitch_classes_from_mask(mask)
    shift = _require_step(steps)
    return sum(1 << ((pc + shift) % PITCH_CLASS_MODULUS) for pc in pitches)


def invert_mask(mask: int, axis_index: int = 0) -> int:
    """Apply the pitch-class inversion I_n(pc) = n - pc (mod 12)."""

    pitches = pitch_classes_from_mask(mask)
    axis = _require_step(axis_index)
    return sum(1 << ((axis - pc) % PITCH_CLASS_MODULUS) for pc in pitches)


def compute_prime_form(mask: int) -> tuple[int, ...]:
    """Return the Forte left-packed TnI prime form for a 12-bit set."""

    pitches = pitch_classes_from_mask(mask)
    if not pitches:
        return ()

    candidates: set[tuple[int, ...]] = set()
    for index in range(PITCH_CLASS_MODULUS):
        for transformed in (transpose_mask(mask, index), invert_mask(mask, index)):
            candidate = pitch_classes_from_mask(transformed)
            if candidate[0] == 0:
                candidates.add(candidate)

    def forte_rank(candidate: tuple[int, ...]) -> tuple[int, ...]:
        return (candidate[-1],) + candidate[1:-1]

    return min(candidates, key=forte_rank)


def compute_interval_vector(mask: int) -> IntervalVector:
    pitches = pitch_classes_from_mask(mask)
    counts = [0, 0, 0, 0, 0, 0]
    for left, right in combinations(pitches, 2):
        directed = (right - left) % PITCH_CLASS_MODULUS
        interval_class = min(directed, PITCH_CLASS_MODULUS - directed)
        counts[interval_class - 1] += 1
    result: IntervalVector = (
        counts[0],
        counts[1],
        counts[2],
        counts[3],
        counts[4],
        counts[5],
    )
    if sum(result) != len(pitches) * (len(pitches) - 1) // 2:
        raise AssertionError("interval_vector_pair_count_mismatch")
    return result


@dataclass(frozen=True, slots=True)
class PitchClassSymmetry:
    """Exact Tn and In stabilizers for one concrete pitch-class realization."""

    source_mask: int
    transpositional_stabilizers: tuple[int, ...]
    inversional_stabilizers: tuple[int, ...]

    def __post_init__(self) -> None:
        if not isinstance(self.transpositional_stabilizers, tuple):
            raise TypeError("transpositional_stabilizers_must_be_tuple")
        if not isinstance(self.inversional_stabilizers, tuple):
            raise TypeError("inversional_stabilizers_must_be_tuple")
        pitch_classes_from_mask(self.source_mask)
        transpositional = tuple(self.transpositional_stabilizers)
        inversional = tuple(self.inversional_stabilizers)
        expected_t = tuple(sorted(set(transpositional)))
        expected_i = tuple(sorted(set(inversional)))
        if transpositional != expected_t:
            raise PitchClassError("transpositional_stabilizers_must_be_sorted_unique")
        if inversional != expected_i:
            raise PitchClassError("inversional_stabilizers_must_be_sorted_unique")
        for value in expected_t + expected_i:
            _require_pitch_class(value, "stabilizer")
        if 0 not in expected_t:
            raise PitchClassError("transpositional_stabilizers_require_identity")
        actual_t = tuple(
            step for step in range(PITCH_CLASS_MODULUS)
            if transpose_mask(self.source_mask, step) == self.source_mask
        )
        actual_i = tuple(
            axis for axis in range(PITCH_CLASS_MODULUS)
            if invert_mask(self.source_mask, axis) == self.source_mask
        )
        if expected_t != actual_t or expected_i != actual_i:
            raise PitchClassError("symmetry_stabilizers_source_mismatch")
        object.__setattr__(self, "transpositional_stabilizers", transpositional)
        object.__setattr__(self, "inversional_stabilizers", inversional)

    @property
    def is_achiral(self) -> bool:
        return bool(self.inversional_stabilizers)

    @property
    def is_chiral(self) -> bool:
        return not self.is_achiral

    @property
    def has_nontrivial_transpositional_symmetry(self) -> bool:
        return len(self.transpositional_stabilizers) > 1

    def to_canonical_dict(self) -> dict[str, object]:
        return {
            "hasNontrivialTranspositionalSymmetry": self.has_nontrivial_transpositional_symmetry,
            "inversionalStabilizers": list(self.inversional_stabilizers),
            "isAchiral": self.is_achiral,
            "isChiral": self.is_chiral,
            "sourceMask": self.source_mask,
            "transpositionalStabilizers": list(self.transpositional_stabilizers),
        }


def compute_symmetry(mask: int) -> PitchClassSymmetry:
    pitch_classes_from_mask(mask)
    return PitchClassSymmetry(
        source_mask=mask,
        transpositional_stabilizers=tuple(
            step for step in range(PITCH_CLASS_MODULUS)
            if transpose_mask(mask, step) == mask
        ),
        inversional_stabilizers=tuple(
            axis for axis in range(PITCH_CLASS_MODULUS)
            if invert_mask(mask, axis) == mask
        ),
    )


@dataclass(frozen=True, slots=True)
class PitchClassSet:
    """An immutable 12-bit pitch-class set with exact derived invariants."""

    mask: int
    tuning: TuningSystem = TuningSystem.TWELVE_TET
    pitch_classes: tuple[int, ...] = field(init=False)
    cardinality: int = field(init=False)
    prime_form: tuple[int, ...] = field(init=False)
    interval_vector: IntervalVector = field(init=False)
    symmetry: PitchClassSymmetry = field(init=False)

    def __post_init__(self) -> None:
        pitches = pitch_classes_from_mask(self.mask)
        try:
            tuning = TuningSystem(self.tuning)
        except (TypeError, ValueError) as error:
            raise PitchClassError("unsupported_tuning") from error
        object.__setattr__(self, "tuning", tuning)
        object.__setattr__(self, "pitch_classes", pitches)
        object.__setattr__(self, "cardinality", len(pitches))
        object.__setattr__(self, "prime_form", compute_prime_form(self.mask))
        object.__setattr__(self, "interval_vector", compute_interval_vector(self.mask))
        object.__setattr__(self, "symmetry", compute_symmetry(self.mask))

    @classmethod
    def from_pitch_classes(
        cls,
        pitch_classes: Iterable[int],
        *,
        tuning: TuningSystem | str = TuningSystem.TWELVE_TET,
    ) -> PitchClassSet:
        try:
            normalized_tuning = TuningSystem(tuning)
        except (TypeError, ValueError) as error:
            raise PitchClassError("unsupported_tuning") from error
        return cls(mask_from_pitch_classes(pitch_classes), normalized_tuning)

    def contains(self, pitch_class: int) -> bool:
        pc = _require_pitch_class(pitch_class)
        return bool(self.mask & (1 << pc))

    def transpose(self, steps: int) -> PitchClassSet:
        return PitchClassSet(transpose_mask(self.mask, steps), self.tuning)

    def invert(self, axis_index: int = 0) -> PitchClassSet:
        return PitchClassSet(invert_mask(self.mask, axis_index), self.tuning)

    def complement(self) -> PitchClassSet:
        return PitchClassSet(self.mask ^ PITCH_CLASS_MASK, self.tuning)

    def hamming_distance(self, other: PitchClassSet) -> int:
        if not isinstance(other, PitchClassSet):
            raise TypeError("other_must_be_pitch_class_set")
        if self.tuning is not other.tuning:
            raise PitchClassError("tuning_mismatch")
        return (self.mask ^ other.mask).bit_count()

    def to_canonical_dict(self) -> dict[str, object]:
        return {
            "cardinality": self.cardinality,
            "intervalVector": list(self.interval_vector),
            "mask": self.mask,
            "pitchClasses": list(self.pitch_classes),
            "primeForm": list(self.prime_form),
            "symmetry": self.symmetry.to_canonical_dict(),
            "tuning": self.tuning.value,
        }


@dataclass(frozen=True, slots=True)
class RootedScale:
    """A pitch-class set with an explicit tonic and deterministic degree order."""

    pitch_set: PitchClassSet
    root: int
    ordered_pitch_classes: tuple[int, ...] = field(init=False)
    relative_intervals: tuple[int, ...] = field(init=False)
    step_intervals: tuple[int, ...] = field(init=False)

    def __post_init__(self) -> None:
        if not isinstance(self.pitch_set, PitchClassSet):
            raise TypeError("pitch_set_must_be_pitch_class_set")
        root = _require_pitch_class(self.root, "root")
        if not self.pitch_set.contains(root):
            raise PitchClassError("root_must_belong_to_pitch_set")
        if self.pitch_set.cardinality == 0:
            raise PitchClassError("rooted_scale_cannot_be_empty")
        ordered = tuple(
            sorted(
                self.pitch_set.pitch_classes,
                key=lambda pc: (pc - root) % PITCH_CLASS_MODULUS,
            )
        )
        relative = tuple((pc - root) % PITCH_CLASS_MODULUS for pc in ordered)
        steps = tuple(
            relative[index + 1] - relative[index]
            for index in range(len(relative) - 1)
        ) + (PITCH_CLASS_MODULUS - relative[-1],)
        object.__setattr__(self, "ordered_pitch_classes", ordered)
        object.__setattr__(self, "relative_intervals", relative)
        object.__setattr__(self, "step_intervals", steps)

    @classmethod
    def from_pitch_classes(
        cls,
        pitch_classes: Iterable[int],
        *,
        root: int,
        tuning: TuningSystem | str = TuningSystem.TWELVE_TET,
    ) -> RootedScale:
        return cls(PitchClassSet.from_pitch_classes(pitch_classes, tuning=tuning), root)

    def require_cardinality(self, cardinality: int) -> None:
        if type(cardinality) is not int or cardinality < 1:
            raise PitchClassError("required_cardinality_must_be_positive_integer")
        if self.pitch_set.cardinality != cardinality:
            raise PitchClassError(f"rooted_scale_requires_cardinality_{cardinality}")

    def transpose(self, steps: int) -> RootedScale:
        shift = _require_step(steps)
        return RootedScale(
            self.pitch_set.transpose(shift),
            (self.root + shift) % PITCH_CLASS_MODULUS,
        )

    def to_canonical_dict(self) -> dict[str, object]:
        return {
            "orderedPitchClasses": list(self.ordered_pitch_classes),
            "pitchSet": self.pitch_set.to_canonical_dict(),
            "relativeIntervals": list(self.relative_intervals),
            "root": self.root,
            "stepIntervals": list(self.step_intervals),
        }
