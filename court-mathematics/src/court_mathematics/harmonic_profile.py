"""Immutable, self-fingerprinted harmonic profiles and C_h coordinates."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Iterable
import unicodedata

from ._canonical import canonical_json_bytes, is_sha256, sha256_payload
from .pitch_class import (
    IntervalVector,
    PitchClassSet,
    PitchClassSymmetry,
    RootedScale,
    TuningSystem,
)
from .subset_lattice import SubsetLattice
from .triads import DegreeTriad, TriadQuality, derive_degree_triads
from .voice_leading import (
    VOICE_LEADING_METRIC_ID,
    VoiceLeadingMove,
    single_semitone_moves,
)


PROFILE_SCHEMA_VERSION = "court-mathematics.harmonic-profile.v1"
PROFILE_ALGORITHM_VERSION = "court-mathematics.phase1.v1"


def _normalized_identifier(value: object, field_name: str) -> str:
    if not isinstance(value, str) or not value:
        raise ValueError(f"{field_name}_must_be_nonempty")
    normalized = unicodedata.normalize("NFC", value)
    if not normalized:
        raise ValueError(f"{field_name}_must_be_nonempty")
    return normalized


@dataclass(frozen=True, slots=True)
class TensionCoordinate:
    """Policy-free structural inputs for H_t; no weighted energy is implied."""

    method_id: str
    source_mask: int
    root_pitch_class: int
    interval_vector: IntervalVector
    step_intervals: tuple[int, ...]
    semitone_pair_count: int
    tritone_pair_count: int
    leading_tone_present: bool
    leading_tone_pitch_class: int | None
    weighted_dissonance_energy: None = None

    def __post_init__(self) -> None:
        if not isinstance(self.interval_vector, tuple):
            raise TypeError("tension_interval_vector_must_be_tuple")
        if not isinstance(self.step_intervals, tuple):
            raise TypeError("tension_step_intervals_must_be_tuple")
        interval_vector = tuple(self.interval_vector)
        step_intervals = tuple(self.step_intervals)
        object.__setattr__(self, "interval_vector", interval_vector)
        object.__setattr__(self, "step_intervals", step_intervals)
        if self.method_id != "structural-tension-descriptors-v1":
            raise ValueError("unsupported_tension_method")
        source = PitchClassSet(self.source_mask)
        rooted = RootedScale(source, self.root_pitch_class)
        if len(interval_vector) != 6 or any(type(value) is not int or value < 0 for value in interval_vector):
            raise ValueError("invalid_tension_interval_vector")
        if not step_intervals or any(type(step) is not int or step < 1 for step in step_intervals):
            raise ValueError("invalid_tension_step_intervals")
        if sum(step_intervals) != 12:
            raise ValueError("tension_step_intervals_must_span_octave")
        if interval_vector != source.interval_vector:
            raise ValueError("tension_interval_vector_source_mismatch")
        if step_intervals != rooted.step_intervals:
            raise ValueError("tension_step_intervals_source_mismatch")
        if type(self.semitone_pair_count) is not int or self.semitone_pair_count != interval_vector[0]:
            raise ValueError("semitone_pair_count_mismatch")
        if type(self.tritone_pair_count) is not int or self.tritone_pair_count != interval_vector[5]:
            raise ValueError("tritone_pair_count_mismatch")
        if type(self.leading_tone_present) is not bool:
            raise ValueError("leading_tone_present_must_be_boolean")
        if self.leading_tone_present != (self.leading_tone_pitch_class is not None):
            raise ValueError("leading_tone_presence_mismatch")
        expected_leading_tone = (self.root_pitch_class - 1) % 12
        if self.leading_tone_pitch_class is not None:
            if type(self.leading_tone_pitch_class) is not int:
                raise ValueError("leading_tone_pitch_class_must_be_integer")
            if self.leading_tone_pitch_class != expected_leading_tone:
                raise ValueError("leading_tone_pitch_class_mismatch")
        if self.leading_tone_present != source.contains(expected_leading_tone):
            raise ValueError("leading_tone_source_mismatch")
        if self.weighted_dissonance_energy is not None:
            raise ValueError("aggregate_dissonance_energy_must_remain_unresolved")

    def to_canonical_dict(self) -> dict[str, object]:
        return {
            "intervalVector": list(self.interval_vector),
            "leadingTonePitchClass": self.leading_tone_pitch_class,
            "leadingTonePresent": self.leading_tone_present,
            "methodId": self.method_id,
            "rootPitchClass": self.root_pitch_class,
            "semitonePairCount": self.semitone_pair_count,
            "stepIntervals": list(self.step_intervals),
            "sourceMask": self.source_mask,
            "tritonePairCount": self.tritone_pair_count,
            "weightedDissonanceEnergy": self.weighted_dissonance_energy,
        }


@dataclass(frozen=True, slots=True)
class VoiceLeadingCoordinate:
    """Executable H_v affordances with pairwise distance computed on demand."""

    metric_id: str
    metric_status: str
    source_mask: int
    identity_distance: int
    single_semitone_moves: tuple[VoiceLeadingMove, ...]

    def __post_init__(self) -> None:
        if not isinstance(self.single_semitone_moves, tuple):
            raise TypeError("single_semitone_moves_must_be_tuple")
        moves = tuple(self.single_semitone_moves)
        object.__setattr__(self, "single_semitone_moves", moves)
        source = PitchClassSet(self.source_mask)
        if self.metric_id != VOICE_LEADING_METRIC_ID:
            raise ValueError("unsupported_voice_leading_metric")
        if self.metric_status != "provisional":
            raise ValueError("voice_leading_metric_must_remain_provisional")
        if type(self.identity_distance) is not int or self.identity_distance != 0:
            raise ValueError("voice_leading_identity_distance_must_be_zero")
        if any(not isinstance(move, VoiceLeadingMove) for move in moves):
            raise TypeError("single_semitone_moves_must_be_voice_leading_moves")
        if any(move.source_mask != self.source_mask for move in moves):
            raise ValueError("voice_leading_move_source_mismatch")
        if any(abs(move.signed_displacement) != 1 for move in self.single_semitone_moves):
            raise ValueError("voice_leading_move_must_be_single_semitone")
        if moves != single_semitone_moves(source):
            raise ValueError("voice_leading_move_inventory_mismatch")

    def to_canonical_dict(self) -> dict[str, object]:
        return {
            "identityDistance": self.identity_distance,
            "metricId": self.metric_id,
            "metricStatus": self.metric_status,
            "singleSemitoneMoves": [
                move.to_canonical_dict() for move in self.single_semitone_moves
            ],
            "sourceMask": self.source_mask,
        }


@dataclass(frozen=True, slots=True)
class TriadQualityCount:
    quality: TriadQuality
    count: int

    def __post_init__(self) -> None:
        if not isinstance(self.quality, TriadQuality):
            raise TypeError("quality_must_be_triad_quality")
        if type(self.count) is not int or self.count < 0:
            raise ValueError("triad_quality_count_must_be_nonnegative_integer")

    def to_canonical_dict(self) -> dict[str, object]:
        return {"count": self.count, "quality": self.quality.value}


@dataclass(frozen=True, slots=True)
class ChordalCoordinate:
    """The complete H_c dyad/trichord inventory and seven degree triads."""

    method_id: str
    subset_lattice: SubsetLattice
    degree_triads: tuple[DegreeTriad, ...]
    quality_counts: tuple[TriadQualityCount, ...]

    def __post_init__(self) -> None:
        if not isinstance(self.degree_triads, tuple):
            raise TypeError("degree_triads_must_be_tuple")
        if not isinstance(self.quality_counts, tuple):
            raise TypeError("quality_counts_must_be_tuple")
        degree_triads = tuple(self.degree_triads)
        quality_counts = tuple(self.quality_counts)
        object.__setattr__(self, "degree_triads", degree_triads)
        object.__setattr__(self, "quality_counts", quality_counts)
        if not isinstance(self.subset_lattice, SubsetLattice):
            raise TypeError("subset_lattice_must_be_subset_lattice")
        if self.method_id != "heptatonic-subset-and-tertian-v1":
            raise ValueError("unsupported_chordal_method")
        if any(not isinstance(triad, DegreeTriad) for triad in degree_triads):
            raise TypeError("degree_triads_must_be_degree_triads")
        if tuple(triad.degree for triad in degree_triads) != tuple(range(1, 8)):
            raise ValueError("chordal_coordinate_requires_seven_ordered_triads")
        if any(triad.rooted_scale != self.subset_lattice.rooted_scale for triad in degree_triads):
            raise ValueError("chordal_coordinate_scale_mismatch")
        expected_qualities = tuple(TriadQuality)
        if any(not isinstance(item, TriadQualityCount) for item in quality_counts):
            raise TypeError("quality_counts_must_be_triad_quality_counts")
        if tuple(item.quality for item in quality_counts) != expected_qualities:
            raise ValueError("triad_quality_counts_must_follow_canonical_order")
        if sum(item.count for item in quality_counts) != 7:
            raise ValueError("triad_quality_counts_must_sum_to_seven")
        for item in quality_counts:
            expected_count = sum(triad.quality is item.quality for triad in degree_triads)
            if item.count != expected_count:
                raise ValueError("triad_quality_count_mismatch")

    def to_canonical_dict(self) -> dict[str, object]:
        return {
            "degreeTriads": [
                triad.to_canonical_dict(include_source=False)
                for triad in self.degree_triads
            ],
            "methodId": self.method_id,
            "qualityCounts": [item.to_canonical_dict() for item in self.quality_counts],
            "subsetLattice": self.subset_lattice.to_canonical_dict(include_source=False),
        }


@dataclass(frozen=True, slots=True)
class SymmetryCoordinate:
    """The H_s set-class descriptors and concrete Tn/In stabilizers."""

    method_id: str
    source_mask: int
    prime_form: tuple[int, ...]
    interval_vector: IntervalVector
    symmetry: PitchClassSymmetry

    def __post_init__(self) -> None:
        if not isinstance(self.prime_form, tuple):
            raise TypeError("symmetry_prime_form_must_be_tuple")
        if not isinstance(self.interval_vector, tuple):
            raise TypeError("symmetry_interval_vector_must_be_tuple")
        prime_form = tuple(self.prime_form)
        interval_vector = tuple(self.interval_vector)
        object.__setattr__(self, "prime_form", prime_form)
        object.__setattr__(self, "interval_vector", interval_vector)
        if self.method_id != "forte-left-packed-tni-v1":
            raise ValueError("unsupported_symmetry_method")
        if any(type(value) is not int for value in prime_form + interval_vector):
            raise ValueError("symmetry_coordinate_values_must_be_integers")
        source = PitchClassSet(self.source_mask)
        if prime_form != source.prime_form:
            raise ValueError("symmetry_prime_form_source_mismatch")
        if interval_vector != source.interval_vector:
            raise ValueError("symmetry_interval_vector_source_mismatch")
        if self.symmetry != source.symmetry:
            raise ValueError("symmetry_stabilizer_source_mismatch")

    def to_canonical_dict(self) -> dict[str, object]:
        return {
            "intervalVector": list(self.interval_vector),
            "methodId": self.method_id,
            "primeForm": list(self.prime_form),
            "sourceMask": self.source_mask,
            "symmetry": self.symmetry.to_canonical_dict(),
        }


@dataclass(frozen=True, slots=True)
class HarmonicCoordinates:
    """The structured harmonic coordinate C_h = (H_t, H_v, H_c, H_s)."""

    h_t: TensionCoordinate
    h_v: VoiceLeadingCoordinate
    h_c: ChordalCoordinate
    h_s: SymmetryCoordinate

    def __post_init__(self) -> None:
        if not isinstance(self.h_t, TensionCoordinate):
            raise TypeError("h_t_must_be_tension_coordinate")
        if not isinstance(self.h_v, VoiceLeadingCoordinate):
            raise TypeError("h_v_must_be_voice_leading_coordinate")
        if not isinstance(self.h_c, ChordalCoordinate):
            raise TypeError("h_c_must_be_chordal_coordinate")
        if not isinstance(self.h_s, SymmetryCoordinate):
            raise TypeError("h_s_must_be_symmetry_coordinate")
        source_masks = {
            self.h_t.source_mask,
            self.h_v.source_mask,
            self.h_c.subset_lattice.rooted_scale.pitch_set.mask,
            self.h_s.source_mask,
        }
        if len(source_masks) != 1:
            raise ValueError("harmonic_coordinate_source_mismatch")
        if self.h_t.root_pitch_class != self.h_c.subset_lattice.rooted_scale.root:
            raise ValueError("harmonic_coordinate_root_mismatch")

    def to_canonical_dict(self) -> dict[str, object]:
        return {
            "H_c": self.h_c.to_canonical_dict(),
            "H_s": self.h_s.to_canonical_dict(),
            "H_t": self.h_t.to_canonical_dict(),
            "H_v": self.h_v.to_canonical_dict(),
            "symbol": "C_h",
        }


@dataclass(frozen=True, slots=True)
class AggregateHarmonicCompression:
    """Explicit unresolved aggregate C_H; component measures do not totalize it."""

    symbol: str = "C_H"
    status: str = "unresolved"
    value: None = None

    def __post_init__(self) -> None:
        if (self.symbol, self.status, self.value) != ("C_H", "unresolved", None):
            raise ValueError("aggregate_harmonic_compression_must_remain_unresolved")

    def to_canonical_dict(self) -> dict[str, object]:
        return {"status": self.status, "symbol": self.symbol, "value": self.value}


@dataclass(frozen=True, slots=True)
class HarmonicProfile:
    """A deterministic harmonic description of one rooted seven-note subject."""

    subject_id: str
    source_id: str
    rooted_scale: RootedScale
    source_sha256: str
    schema_version: str = field(init=False, default=PROFILE_SCHEMA_VERSION)
    algorithm_version: str = field(init=False, default=PROFILE_ALGORITHM_VERSION)
    coordinates: HarmonicCoordinates = field(init=False)
    aggregate_harmonic_compression: AggregateHarmonicCompression = field(init=False)
    fingerprint_sha256: str = field(init=False)

    def __post_init__(self) -> None:
        subject_id = _normalized_identifier(self.subject_id, "subject_id")
        source_id = _normalized_identifier(self.source_id, "source_id")
        if not isinstance(self.rooted_scale, RootedScale):
            raise TypeError("rooted_scale_must_be_rooted_scale")
        self.rooted_scale.require_cardinality(7)
        if not is_sha256(self.source_sha256):
            raise ValueError("source_sha256_must_be_lowercase_sha256")
        object.__setattr__(self, "subject_id", subject_id)
        object.__setattr__(self, "source_id", source_id)

        pitch_set = self.rooted_scale.pitch_set
        lattice = SubsetLattice(self.rooted_scale)
        triads = derive_degree_triads(self.rooted_scale)
        quality_counts = tuple(
            TriadQualityCount(
                quality,
                sum(triad.quality is quality for triad in triads),
            )
            for quality in TriadQuality
        )
        leading_tone_pc = (self.rooted_scale.root - 1) % 12
        leading_tone_present = pitch_set.contains(leading_tone_pc)
        coordinates = HarmonicCoordinates(
            h_t=TensionCoordinate(
                method_id="structural-tension-descriptors-v1",
                source_mask=pitch_set.mask,
                root_pitch_class=self.rooted_scale.root,
                interval_vector=pitch_set.interval_vector,
                step_intervals=self.rooted_scale.step_intervals,
                semitone_pair_count=pitch_set.interval_vector[0],
                tritone_pair_count=pitch_set.interval_vector[5],
                leading_tone_present=leading_tone_present,
                leading_tone_pitch_class=leading_tone_pc if leading_tone_present else None,
            ),
            h_v=VoiceLeadingCoordinate(
                metric_id=VOICE_LEADING_METRIC_ID,
                metric_status="provisional",
                source_mask=pitch_set.mask,
                identity_distance=0,
                single_semitone_moves=single_semitone_moves(pitch_set),
            ),
            h_c=ChordalCoordinate(
                method_id="heptatonic-subset-and-tertian-v1",
                subset_lattice=lattice,
                degree_triads=triads,
                quality_counts=quality_counts,
            ),
            h_s=SymmetryCoordinate(
                method_id="forte-left-packed-tni-v1",
                source_mask=pitch_set.mask,
                prime_form=pitch_set.prime_form,
                interval_vector=pitch_set.interval_vector,
                symmetry=pitch_set.symmetry,
            ),
        )
        aggregate = AggregateHarmonicCompression()
        object.__setattr__(self, "coordinates", coordinates)
        object.__setattr__(self, "aggregate_harmonic_compression", aggregate)
        object.__setattr__(self, "fingerprint_sha256", sha256_payload(self.identity_body()))

    @classmethod
    def from_pitch_classes(
        cls,
        *,
        subject_id: str,
        source_id: str,
        pitch_classes: Iterable[int],
        root: int,
        tuning: TuningSystem | str = TuningSystem.TWELVE_TET,
        source_sha256: str,
    ) -> HarmonicProfile:
        return cls(
            subject_id=subject_id,
            source_id=source_id,
            rooted_scale=RootedScale.from_pitch_classes(
                pitch_classes,
                root=root,
                tuning=tuning,
            ),
            source_sha256=source_sha256,
        )

    @property
    def c_h(self) -> HarmonicCoordinates:
        return self.coordinates

    @property
    def aggregate_c_h(self) -> None:
        return self.aggregate_harmonic_compression.value

    def identity_body(self) -> dict[str, object]:
        return {
            "aggregateHarmonicCompression": self.aggregate_harmonic_compression.to_canonical_dict(),
            "algorithmVersion": self.algorithm_version,
            "coordinates": self.coordinates.to_canonical_dict(),
            "rootedScale": self.rooted_scale.to_canonical_dict(),
            "schemaVersion": self.schema_version,
            "source": {
                "sourceId": self.source_id,
                "sourceSha256": self.source_sha256,
            },
            "subjectId": self.subject_id,
        }

    def to_canonical_dict(self) -> dict[str, object]:
        return {**self.identity_body(), "fingerprintSha256": self.fingerprint_sha256}

    def canonical_bytes(self) -> bytes:
        return canonical_json_bytes(self.to_canonical_dict())

    def identity_bytes(self) -> bytes:
        """Return the exact byte stream covered by `fingerprint_sha256`."""

        return canonical_json_bytes(self.identity_body())

    def verify_fingerprint(self) -> bool:
        return sha256_payload(self.identity_body()) == self.fingerprint_sha256
