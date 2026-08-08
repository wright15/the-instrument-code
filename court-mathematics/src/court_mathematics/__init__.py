"""Public Phase 1 API for exact Court harmonic mathematics."""

from .harmonic_profile import (
    AggregateHarmonicCompression,
    ChordalCoordinate,
    HarmonicCoordinates,
    HarmonicProfile,
    PROFILE_ALGORITHM_VERSION,
    PROFILE_SCHEMA_VERSION,
    SymmetryCoordinate,
    TensionCoordinate,
    TriadQualityCount,
    VoiceLeadingCoordinate,
)
from .pitch_class import (
    IntervalVector,
    PitchClassError,
    PitchClassSet,
    PitchClassSymmetry,
    RootedScale,
    TuningSystem,
    compute_interval_vector,
    compute_prime_form,
    compute_symmetry,
    invert_mask,
    mask_from_pitch_classes,
    pitch_classes_from_mask,
    transpose_mask,
)
from .subset_lattice import ScaleSubset, SubsetIncidence, SubsetLattice
from .triads import DegreeTriad, TriadQuality, derive_degree_triads
from .voice_leading import (
    VOICE_LEADING_METRIC_ID,
    VoiceLeadingAssignment,
    VoiceLeadingError,
    VoiceLeadingMove,
    VoiceLeadingResult,
    minimum_voice_leading,
    signed_pitch_class_displacement,
    single_semitone_moves,
)


__version__ = "0.1.0"

__all__ = [
    "AggregateHarmonicCompression",
    "ChordalCoordinate",
    "DegreeTriad",
    "HarmonicCoordinates",
    "HarmonicProfile",
    "IntervalVector",
    "PROFILE_ALGORITHM_VERSION",
    "PROFILE_SCHEMA_VERSION",
    "PitchClassError",
    "PitchClassSet",
    "PitchClassSymmetry",
    "RootedScale",
    "ScaleSubset",
    "SubsetIncidence",
    "SubsetLattice",
    "SymmetryCoordinate",
    "TensionCoordinate",
    "TriadQuality",
    "TriadQualityCount",
    "TuningSystem",
    "VOICE_LEADING_METRIC_ID",
    "VoiceLeadingAssignment",
    "VoiceLeadingCoordinate",
    "VoiceLeadingError",
    "VoiceLeadingMove",
    "VoiceLeadingResult",
    "compute_interval_vector",
    "compute_prime_form",
    "compute_symmetry",
    "derive_degree_triads",
    "invert_mask",
    "mask_from_pitch_classes",
    "minimum_voice_leading",
    "pitch_classes_from_mask",
    "signed_pitch_class_displacement",
    "single_semitone_moves",
    "transpose_mask",
]
