from __future__ import annotations

import json

from court_mathematics import PitchClassSet

from ._oracles import ROOT


RELEASE_PATH = (
    ROOT
    / "seven-governors-court-substrate-v0.1.0/canonical/substrate-registry-release.json"
)


def _release() -> dict[str, object]:
    return json.loads(RELEASE_PATH.read_text(encoding="utf-8"))


def test_substrate_registry_closes_all_38_complement_classes() -> None:
    release = _release()
    classes = release["pentatonicSetClasses"]
    complements = release["complementMaps"]
    network = json.loads(
        (ROOT / "canonical/universal-network-data.json").read_text(encoding="utf-8")
    )
    families = {item["forte"] for item in network["familyRegistry"]}

    assert len(classes) == len(complements) == len(families) == 38
    assert len({tuple(PitchClassSet(item["representativeMask"]).prime_form) for item in classes}) == 38
    assert {item["heptatonicFamilyId"] for item in complements} == families
    assert all(
        item["representativeHeptatonicMask"]
        == 4095 ^ item["representativePentatonicMask"]
        for item in complements
    )


def test_court_positions_have_exact_masks_kappa_poles_and_t5_segment() -> None:
    release = _release()
    positions = release["courtRootedPositions"]
    assert [item["pitchMask"] for item in positions] == [661, 677, 1189, 1193, 1321]
    assert [item["t5Offset"] for item in positions] == [0, 5, 10, 3, 8]
    assert [item["poleRegister"]["vector"] for item in positions] == [
        "0000",
        "1000",
        "1100",
        "1110",
        "1111",
    ]
    assert [item["kappaCourt"] for item in positions] == [
        {"numerator": 0, "denominator": 1},
        {"numerator": 1, "denominator": 4},
        {"numerator": 1, "denominator": 2},
        {"numerator": 3, "denominator": 4},
        {"numerator": 1, "denominator": 1},
    ]
    supports = [item["xorSupportFromPrevious"] for item in positions[1:]]
    assert supports == [[4, 5], [9, 10], [2, 3], [7, 8]]
    assert len({pitch for support in supports for pitch in support}) == 8
    assert all(PitchClassSet(item["pitchMask"]).cardinality == 5 for item in positions)
    assert all(PitchClassSet(item["pitchMask"]).prime_form == (0, 2, 4, 7, 9) for item in positions)


def test_bridge_rootings_are_distinct_shared_subsets_with_exact_complements() -> None:
    release = _release()
    bridges = release["bridgeRootings"]
    by_class = {item["setClassId"]: item for item in bridges}
    assert by_class["pentatonic:5-23"]["pitchClasses"] == [0, 2, 3, 5, 7]
    assert by_class["pentatonic:5-27"]["pitchClasses"] == [0, 3, 5, 7, 8]
    assert by_class["pentatonic:5-23"]["pitchMask"] == 173
    assert by_class["pentatonic:5-27"]["pitchMask"] == 425
    assert release["minimalAdditionalBridgeSetClasses"] == []

    for bridge in bridges:
        pitch_set = PitchClassSet(bridge["pitchMask"])
        assert bridge["pitchMask"] & bridge["sourceScaleStateId"] == bridge["pitchMask"]
        assert bridge["pitchMask"] & bridge["targetScaleStateId"] == bridge["pitchMask"]
        assert pitch_set.complement().mask == bridge["rawComplementMask"]
        assert bridge["t5Reference"] == {
            "cycleIndex": 0,
            "offset": 0,
            "semantics": "root_alignment_only",
        }


def test_t5_cycle_is_complete_and_court_sequence_is_only_a_segment() -> None:
    release = _release()
    cycle = release["t5Cycle"]
    assert [item["offset"] for item in cycle] == [0, 5, 10, 3, 8, 1, 6, 11, 4, 9, 2, 7]
    assert [item["nextOffset"] for item in cycle] == [5, 10, 3, 8, 1, 6, 11, 4, 9, 2, 7, 0]
    assert [item["courtPositionId"] for item in cycle[:5]] == ["C0", "C1", "C2", "C3", "C4"]
    assert all(item["courtPositionId"] is None for item in cycle[5:])
