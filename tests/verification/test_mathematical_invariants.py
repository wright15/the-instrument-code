from __future__ import annotations

import csv

from hypothesis import given, settings, strategies as st

from court_mathematics import (
    HarmonicProfile,
    PitchClassSet,
    RootedScale,
    SubsetLattice,
    derive_degree_triads,
    minimum_voice_leading,
)
from harmonic_invariants import evaluate_carey_535

from ._oracles import (
    apply_court_filter,
    canonical_masks,
    canonical_records,
    pitch_classes,
    LEDGER_CSV,
    source_sha256,
)


MASKS = canonical_masks()


def test_all_462_states_have_complete_subset_and_degree_triad_structure() -> None:
    records = canonical_records()
    source_hash = source_sha256()
    profile_fingerprints = set()
    totals = {"dyads": 0, "trichords": 0, "incidences": 0, "degree_triads": 0}

    assert len(records) == len(MASKS) == 462
    assert len(set(MASKS)) == 462
    for record in records:
        mask = int(record["id"])
        pitches = pitch_classes(mask)
        assert mask.bit_count() == 7
        assert pitches[0] == 0
        assert record["pitchSet"] == "{" + ",".join(str(pc) for pc in pitches) + "}"
        rooted = RootedScale(PitchClassSet(mask), 0)
        lattice = SubsetLattice(rooted)
        triads = derive_degree_triads(rooted)
        profile = HarmonicProfile.from_pitch_classes(
            subject_id=f"scale-state:{mask}",
            source_id=f"universal-heptatonic-ledger:{mask}",
            pitch_classes=pitches,
            root=0,
            source_sha256=source_hash,
        )

        assert len(lattice.dyads) == 21
        assert len(lattice.trichords) == 35
        assert len(lattice.incidences) == 105
        assert len(triads) == 7
        assert tuple(triad.degree for triad in triads) == tuple(range(1, 8))
        assert profile.coordinates.h_c.degree_triads == triads
        assert profile.verify_fingerprint()
        profile_fingerprints.add(profile.fingerprint_sha256)
        totals["dyads"] += len(lattice.dyads)
        totals["trichords"] += len(lattice.trichords)
        totals["incidences"] += len(lattice.incidences)
        totals["degree_triads"] += len(triads)

    assert len(profile_fingerprints) == 462
    assert totals == {
        "dyads": 9702,
        "trichords": 16170,
        "incidences": 48510,
        "degree_triads": 3234,
    }


def test_canonical_json_and_csv_bind_the_same_462_state_universe() -> None:
    with LEDGER_CSV.open(newline="", encoding="utf-8") as handle:
        csv_records = tuple(csv.DictReader(handle))
    json_by_id = {int(record["id"]): record for record in canonical_records()}
    csv_by_id = {int(record["id"]): record for record in csv_records}

    assert len(csv_records) == len(csv_by_id) == len(json_by_id) == 462
    assert set(csv_by_id) == set(json_by_id)
    for state_id, csv_record in csv_by_id.items():
        json_record = json_by_id[state_id]
        assert csv_record["name"] == json_record["name"]
        assert csv_record["forte"] == json_record["forte"]
        assert csv_record["pitchSet"] == json_record["pitchSet"]
        assert csv_record["intervalVector"] == json_record["intervalVector"]
        assert csv_record["role"] == json_record["role"]
        assert csv_record["fineRole"] == json_record["fineRole"]
        assert csv_record["tier"] == (json_record["tier"] or "")
        assert csv_record["office"] == (json_record["office"] or "")


@given(
    source_mask=st.integers(min_value=0, max_value=4095),
    court_mask=st.integers(min_value=0, max_value=4095),
)
@settings(max_examples=500, derandomize=True, deadline=None)
def test_court_filter_is_idempotent_for_arbitrary_12_bit_inputs(
    source_mask: int,
    court_mask: int,
) -> None:
    once = apply_court_filter(source_mask, court_mask)
    twice = apply_court_filter(once, court_mask)
    assert twice == once


def test_every_canonical_state_is_idempotent_under_every_12_bit_filter() -> None:
    for source_mask in MASKS:
        for court_mask in range(4096):
            result = apply_court_filter(source_mask, court_mask)
            assert apply_court_filter(result, court_mask) == result


def test_carey_535_counts_and_quotients_are_independently_enumerated() -> None:
    result = evaluate_carey_535((0, 2, 4, 7, 9))
    assert len(result.interval_instances) == 20
    assert result.difference_slots == 40
    assert result.difference_count == 20
    assert result.failure_slots == 25
    assert result.cross_generic_comparisons == 150
    assert result.ambiguity_count == 0
    assert result.contradiction_count == 0
    assert result.coherence_quotient.numerator == result.coherence_quotient.denominator == 1
    assert (result.sameness_quotient.numerator, result.sameness_quotient.denominator) == (1, 2)


def test_pitch_class_ground_metric_satisfies_triangle_inequality() -> None:
    circular_distance = lambda left, right: min((left - right) % 12, (right - left) % 12)
    for left in range(12):
        for middle in range(12):
            for right in range(12):
                assert circular_distance(left, right) <= (
                    circular_distance(left, middle) + circular_distance(middle, right)
                )


@given(
    left=st.sampled_from(MASKS),
    middle=st.sampled_from(MASKS),
    right=st.sampled_from(MASKS),
)
@settings(max_examples=100, derandomize=True, deadline=None)
def test_voice_leading_metric_triangle_inequality_on_canonical_state_space(
    left: int,
    middle: int,
    right: int,
) -> None:
    left_set = PitchClassSet(left)
    middle_set = PitchClassSet(middle)
    right_set = PitchClassSet(right)
    direct = minimum_voice_leading(left_set, right_set).distance
    via_middle = (
        minimum_voice_leading(left_set, middle_set).distance
        + minimum_voice_leading(middle_set, right_set).distance
    )
    assert direct <= via_middle
