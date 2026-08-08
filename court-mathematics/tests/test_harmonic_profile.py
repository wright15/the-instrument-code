from __future__ import annotations

from dataclasses import FrozenInstanceError
from decimal import Decimal
import hashlib
import os
from pathlib import Path
import subprocess
import sys

import pytest

from court_mathematics import (
    HarmonicCoordinates,
    HarmonicProfile,
    RootedScale,
    SymmetryCoordinate,
)
from court_mathematics._canonical import canonical_json_bytes


LEDGER_SHA256 = "6d2603a2499aea55b6bc13d11694ae10e6bfad1d62cb488506a57333e182f6c9"


def _aeolian_profile(pitch_classes: tuple[int, ...] = (0, 2, 3, 5, 7, 8, 10)) -> HarmonicProfile:
    return HarmonicProfile.from_pitch_classes(
        subject_id="scale-state:1453",
        source_id="universal-heptatonic-ledger:1453",
        pitch_classes=pitch_classes,
        root=0,
        source_sha256=LEDGER_SHA256,
    )


def _walk_numbers(value: object) -> tuple[object, ...]:
    values: list[object] = []
    if isinstance(value, dict):
        for item in value.values():
            values.extend(_walk_numbers(item))
    elif isinstance(value, list):
        for item in value:
            values.extend(_walk_numbers(item))
    elif isinstance(value, (int, float, Decimal)) and not isinstance(value, bool):
        values.append(value)
    return tuple(values)


def test_profile_materializes_all_four_coordinates_without_aggregate_c_h() -> None:
    profile = _aeolian_profile()

    assert profile.c_h.h_t.interval_vector == (2, 5, 4, 3, 6, 1)
    assert profile.c_h.h_t.weighted_dissonance_energy is None
    assert profile.c_h.h_v.metric_status == "provisional"
    assert len(profile.c_h.h_c.subset_lattice.dyads) == 21
    assert len(profile.c_h.h_c.subset_lattice.trichords) == 35
    assert len(profile.c_h.h_c.degree_triads) == 7
    assert profile.c_h.h_s.prime_form == (0, 1, 3, 5, 6, 8, 10)
    assert profile.aggregate_c_h is None
    assert profile.aggregate_harmonic_compression.status == "unresolved"
    assert profile.verify_fingerprint()


def test_profile_is_independent_of_input_pitch_enumeration_order() -> None:
    first = _aeolian_profile((0, 2, 3, 5, 7, 8, 10))
    second = _aeolian_profile((10, 8, 7, 5, 3, 2, 0))

    assert first.to_canonical_dict() == second.to_canonical_dict()
    assert first.canonical_bytes() == second.canonical_bytes()
    assert first.fingerprint_sha256 == second.fingerprint_sha256


def test_aeolian_profile_has_versioned_golden_fingerprint() -> None:
    profile = _aeolian_profile()

    assert profile.fingerprint_sha256 == (
        "3d48786309d428b467b29fa3473489e6b37b1f9f1efe58247ddd649dce2a2db8"
    )


def test_profile_identity_is_root_and_phase_sensitive() -> None:
    c_ionian = HarmonicProfile(
        subject_id="scale:C-ionian",
        source_id="fixture:ionian",
        rooted_scale=RootedScale.from_pitch_classes(
            (0, 2, 4, 5, 7, 9, 11),
            root=0,
        ),
        source_sha256=LEDGER_SHA256,
    )
    d_ionian = HarmonicProfile(
        subject_id="scale:D-ionian",
        source_id="fixture:ionian",
        rooted_scale=c_ionian.rooted_scale.transpose(2),
        source_sha256=LEDGER_SHA256,
    )

    assert c_ionian.c_h.h_s.prime_form == d_ionian.c_h.h_s.prime_form
    assert tuple(
        triad.quality for triad in c_ionian.c_h.h_c.degree_triads
    ) == tuple(triad.quality for triad in d_ionian.c_h.h_c.degree_triads)
    assert c_ionian.fingerprint_sha256 != d_ionian.fingerprint_sha256


def test_canonical_profile_contains_no_approximate_numbers() -> None:
    profile = _aeolian_profile()

    numbers = _walk_numbers(profile.to_canonical_dict())

    assert numbers
    assert all(type(number) is int for number in numbers)
    assert b"NaN" not in profile.canonical_bytes()
    assert b"Infinity" not in profile.canonical_bytes()


def test_float_free_canonical_json_has_stable_golden_vector() -> None:
    payload = {"z": "x", "a": [True, None, 1]}
    expected = b'{"a":[true,null,1],"z":"x"}'

    assert canonical_json_bytes(payload) == expected
    assert hashlib.sha256(expected).hexdigest() == (
        "c739c2101992f6afc384a99cb3fb32fb2a1162ee13d6e2a283b1fbcbd03f60dc"
    )
    with pytest.raises(TypeError, match="non_integral_number_not_allowed"):
        canonical_json_bytes({"value": 1.0})
    with pytest.raises(TypeError, match="non_integral_number_not_allowed"):
        canonical_json_bytes({"value": Decimal("1")})
    with pytest.raises(ValueError, match="unicode_surrogate_not_allowed"):
        canonical_json_bytes({"value": "\ud800"})


def test_profile_is_immutable() -> None:
    profile = _aeolian_profile()

    with pytest.raises(FrozenInstanceError):
        profile.subject_id = "changed"  # type: ignore[misc]
    with pytest.raises(TypeError):
        profile.c_h.h_c.degree_triads[0].pitch_classes[0] = 11  # type: ignore[index]


def test_fingerprint_covers_identity_bytes_and_requires_source_hash() -> None:
    profile = _aeolian_profile()

    assert hashlib.sha256(profile.identity_bytes()).hexdigest() == profile.fingerprint_sha256
    with pytest.raises(ValueError, match="source_sha256_must_be_lowercase_sha256"):
        HarmonicProfile.from_pitch_classes(
            subject_id="fixture:invalid-source",
            source_id="fixture:source",
            pitch_classes=(0, 2, 3, 5, 7, 8, 10),
            root=0,
            source_sha256="invalid",
        )


def test_coordinates_reject_mixed_modal_roots_on_same_pitch_mask() -> None:
    c_ionian = HarmonicProfile.from_pitch_classes(
        subject_id="scale:C-ionian",
        source_id="fixture:diatonic",
        pitch_classes=(0, 2, 4, 5, 7, 9, 11),
        root=0,
        source_sha256=LEDGER_SHA256,
    )
    a_aeolian = HarmonicProfile.from_pitch_classes(
        subject_id="scale:A-aeolian",
        source_id="fixture:diatonic",
        pitch_classes=(0, 2, 4, 5, 7, 9, 11),
        root=9,
        source_sha256=LEDGER_SHA256,
    )

    with pytest.raises(ValueError, match="harmonic_coordinate_root_mismatch"):
        HarmonicCoordinates(
            h_t=a_aeolian.c_h.h_t,
            h_v=c_ionian.c_h.h_v,
            h_c=c_ionian.c_h.h_c,
            h_s=c_ionian.c_h.h_s,
        )


def test_symmetry_coordinate_rejects_boolean_integer_aliases() -> None:
    profile = _aeolian_profile()
    symmetry = profile.c_h.h_s
    boolean_prime_form = (False,) + symmetry.prime_form[1:]

    with pytest.raises(
        ValueError,
        match="symmetry_coordinate_values_must_be_integers",
    ):
        SymmetryCoordinate(
            method_id=symmetry.method_id,
            source_mask=symmetry.source_mask,
            prime_form=boolean_prime_form,
            interval_vector=symmetry.interval_vector,
            symmetry=symmetry.symmetry,
        )


def test_profile_bytes_are_identical_across_process_environments() -> None:
    package_root = Path(__file__).resolve().parents[1]
    script = """
import sys
from court_mathematics import HarmonicProfile
profile = HarmonicProfile.from_pitch_classes(
    subject_id='scale-state:1453',
    source_id='universal-heptatonic-ledger:1453',
    pitch_classes=(0,2,3,5,7,8,10),
    root=0,
    source_sha256='6d2603a2499aea55b6bc13d11694ae10e6bfad1d62cb488506a57333e182f6c9',
)
sys.stdout.buffer.write(profile.canonical_bytes())
"""
    first_environment = os.environ.copy()
    second_environment = os.environ.copy()
    first_environment.update(
        {
            "PYTHONDONTWRITEBYTECODE": "1",
            "PYTHONHASHSEED": "1",
            "PYTHONPATH": str(package_root / "src"),
            "TZ": "UTC",
        }
    )
    second_environment.update(
        {
            "PYTHONDONTWRITEBYTECODE": "1",
            "PYTHONHASHSEED": "987",
            "PYTHONPATH": str(package_root / "src"),
            "TZ": "Pacific/Honolulu",
        }
    )

    first = subprocess.run(
        [sys.executable, "-c", script],
        cwd=package_root,
        env=first_environment,
        check=True,
        capture_output=True,
    )
    second = subprocess.run(
        [sys.executable, "-c", script],
        cwd=package_root,
        env=second_environment,
        check=True,
        capture_output=True,
    )

    assert first.stdout == second.stdout
