"""Sprint evidence pin for the BL-021 bipartite inclusion matrix.

Pins the admit-anchored containment facts the Andalusian golden path relies on: the
C-Ionian sliding window, the harmonic-minor zero-cornerstone destination, the concrete
5-23/5-27 bridge voicings, the census, and the tonic-vs-root and Tn/TnI distinctions.
Sprint evidence only: this file grants no admission status and resolves no gate.
"""

from __future__ import annotations

import importlib.util
import json
import os
from collections import Counter
from itertools import combinations
from pathlib import Path
import subprocess
import sys

import pytest


ROOT = Path(__file__).resolve().parents[1]
GENERATOR_PATH = ROOT / "scripts/generate_hypergraph_matrix.py"
ARTIFACT_PATH = ROOT / "derived/hypergraph/bipartite-inclusion-v1.json"
COURT_POSITIONS_PATH = (
    ROOT
    / "seven-governors-court-substrate-v0.1.0"
    / "canonical"
    / "court-rooted-positions.json"
)
COMMITTED_BYTES = ARTIFACT_PATH.read_bytes()

sys.path.insert(0, str(ROOT / "court-mathematics/src"))
from court_mathematics import (  # noqa: E402
    compute_interval_vector,
    compute_prime_form,
    transpose_mask,
)


def _load_module(path: Path, name: str):
    spec = importlib.util.spec_from_file_location(name, path)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


GENERATOR = _load_module(GENERATOR_PATH, "hypergraph_matrix_generator")


@pytest.fixture(scope="module")
def document() -> dict:
    return json.loads(COMMITTED_BYTES)


def _mask(pitch_classes) -> int:
    return sum(1 << pc for pc in pitch_classes)


def _pcs(mask: int) -> set[int]:
    return {pc for pc in range(12) if mask & (1 << pc)}


def _tn_key(mask: int) -> int:
    return min(transpose_mask(mask, step) for step in range(12))


def _node_by_pitch_classes(nodes: dict, pitch_classes) -> dict:
    expected = set(pitch_classes)
    for node in nodes.values():
        if set(node["pitchClasses"]) == expected:
            return node
    raise AssertionError(f"node_not_found:{sorted(expected)}")


def _forte_of_5_subset(subset) -> str:
    return GENERATOR._forte_index(ROOT)[5][compute_prime_form(_mask(subset))]


def test_universe_counts_ids_and_rooted_order(document) -> None:
    assert document["status"] == "planning_evidence"
    metadata = document["metadata"]
    assert metadata["totalRootedPentatonics"] == 330
    assert metadata["totalRootedHeptatonics"] == 462
    assert metadata["totalTnClasses"] == 66
    assert metadata["totalTnIClassesPerSide"] == 38

    pentatonic = document["pentatonicSubnodes"]
    heptatonic = document["heptatonicNodes"]
    assert len(pentatonic) == 330
    assert len(heptatonic) == 462
    assert len({node["setClassId"] for node in pentatonic.values()}) == 38
    assert len({node["setClassId"] for node in heptatonic.values()}) == 38
    assert sum(1 for node in pentatonic.values() if node["isCornerstone"]) == 5
    assert sum(1 for node in heptatonic.values() if node["setClassId"] == "7-35") == 7

    for node_id, node in {**pentatonic, **heptatonic}.items():
        assert node_id.split(":")[0] == node["setClassId"]
        assert node["pitchMask"] & 1
        assert _pcs(node["pitchMask"]) == set(node["pitchClasses"])
        assert node["pitchClasses"] == sorted(
            node["pitchClasses"], key=lambda pc: (pc - node["root"]) % 12
        )
        assert node["root"] in node["pitchClasses"]


def test_c_ionian_cornerstone_window(document) -> None:
    ionian = document["heptatonicNodes"]["7-35:0"]
    assert ionian["pitchClasses"] == [0, 2, 4, 5, 7, 9, 11]

    pentatonic = document["pentatonicSubnodes"]
    rooted = sorted(
        frozenset(node["pitchClasses"])
        for node in pentatonic.values()
        if node["id"] in ionian["subnodes"]
        and node["setClassId"] == "5-35"
        and 0 in node["pitchClasses"]
    )
    assert rooted == [frozenset({0, 2, 4, 7, 9}), frozenset({0, 2, 5, 7, 9})]

    unrooted = sorted(
        tuple(subset)
        for subset in combinations(ionian["pitchClasses"], 5)
        if _forte_of_5_subset(subset) == "5-35"
    )
    assert unrooted == [
        (0, 2, 4, 7, 9),
        (0, 2, 5, 7, 9),
        (2, 4, 7, 9, 11),
    ]
    assert ionian["cornerstoneCountRooted"] == 2
    assert ionian["cornerstoneCountUnrooted"] == 3


def test_harmonic_minor_destination_zero_cornerstones(document) -> None:
    heptatonic = document["heptatonicNodes"]
    for node_id in ("7-32:9", "7-32:4"):
        node = heptatonic[node_id]
        assert node["cornerstoneCountRooted"] == 0
        assert node["cornerstoneCountUnrooted"] == 0
    assert {node["setClassId"] for node in heptatonic.values() if node["setClassId"] == "7-32"} == {"7-32"}
    for node in heptatonic.values():
        if node["setClassId"] == "7-32":
            assert node["cornerstoneCountRooted"] == 0
            assert node["cornerstoneCountUnrooted"] == 0


def test_andalusian_bridge_voicings_parentage(document) -> None:
    pentatonic = document["pentatonicSubnodes"]
    for node_id, pitch_classes in (
        ("5-23:9", {9, 11, 0, 2, 4}),
        ("5-27:9", {0, 2, 4, 5, 9}),
    ):
        node = pentatonic[node_id]
        assert set(node["pitchClasses"]) == pitch_classes
        assert node["isCornerstone"] is False
        assert node["isBridge"] is True
        assert len(node["parentsRooted"]) == 21
        assert {"7-35:0", "7-32:9"} <= set(node["parentsRooted"])

    bridge = _node_by_pitch_classes(pentatonic, {9, 11, 0, 2, 4})
    assert bridge["id"] == "5-23:9"
    assert bridge["setClassId"] == "5-23"
    assert {"7-35", "7-32"} <= set(bridge["parentsUnrooted"])
    assert bridge["parentsUnrooted"] == sorted(set(bridge["parentsUnrooted"]))


def test_tonic_vs_root_destination_pin(document) -> None:
    heptatonic = document["heptatonicNodes"]
    e_harmonic_minor = heptatonic["7-32:4"]
    a_harmonic_minor = heptatonic["7-32:9"]
    assert set(e_harmonic_minor["pitchClasses"]) == {0, 3, 4, 6, 7, 9, 11}
    assert set(a_harmonic_minor["pitchClasses"]) == {0, 2, 4, 5, 8, 9, 11}
    assert e_harmonic_minor["pitchClasses"] != a_harmonic_minor["pitchClasses"]

    ionian = set(heptatonic["7-35:0"]["pitchClasses"])
    wrong_reading = set(e_harmonic_minor["pitchClasses"]) & ionian
    assert wrong_reading == {0, 4, 7, 9, 11}
    pentatonic = document["pentatonicSubnodes"]
    shared_with_wrong_destination = [
        node
        for node in pentatonic.values()
        if set(node["pitchClasses"]) <= set(e_harmonic_minor["pitchClasses"])
        and set(node["pitchClasses"]) <= ionian
    ]
    assert [node["setClassId"] for node in shared_with_wrong_destination] == ["5-27"]
    assert shared_with_wrong_destination[0]["id"] == "5-27:4"

    corrected_reading = set(a_harmonic_minor["pitchClasses"]) & ionian
    assert corrected_reading == {0, 2, 4, 5, 9, 11}
    shared_with_route = {
        node["id"]
        for node in pentatonic.values()
        if set(node["pitchClasses"]) <= set(a_harmonic_minor["pitchClasses"])
        and set(node["pitchClasses"]) <= ionian
        and node["setClassId"] in {"5-23", "5-27"}
    }
    assert shared_with_route == {"5-23:9", "5-27:9"}
    for node_id in shared_with_route:
        assert {"7-32:9", "7-35:0"} <= set(pentatonic[node_id]["parentsRooted"])


def test_bridge_census(document) -> None:
    census = document["metadata"]["bridgeCensus"]
    assert census["totalBridgeSubnodes"] == 70
    assert census["bySetClass"] == {
        "5-Z12": 5,
        "5-20": 10,
        "5-23": 10,
        "5-24": 10,
        "5-25": 10,
        "5-27": 10,
        "5-29": 10,
        "5-34": 5,
    }
    assert "5-35" not in census["bySetClass"]
    assert sum(census["bySetClass"].values()) == census["totalBridgeSubnodes"]
    flagged = [node for node in document["pentatonicSubnodes"].values() if node["isBridge"]]
    assert len(flagged) == census["totalBridgeSubnodes"]
    assert document["metadata"]["orbitSpanParentageTotal"] == 330


def test_global_distributions(document) -> None:
    pentatonic_distribution = Counter(
        sum(1 for parent in node["parentsRooted"] if parent.startswith("7-35:"))
        for node in document["pentatonicSubnodes"].values()
    )
    assert dict(sorted(pentatonic_distribution.items())) == {0: 255, 1: 50, 2: 20, 3: 5}

    heptatonic_distribution = Counter(
        node["cornerstoneCountRooted"] for node in document["heptatonicNodes"].values()
    )
    assert dict(sorted(heptatonic_distribution.items())) == {0: 381, 1: 60, 2: 18, 3: 3}

    ionian = document["heptatonicNodes"]["7-35:0"]
    pitch_classes = sorted(ionian["pitchClasses"])
    counts_by_root = {}
    for root in pitch_classes:
        counts_by_root[root] = sum(
            1
            for subset in combinations(pitch_classes, 5)
            if root in subset and _forte_of_5_subset(subset) == "5-35"
        )
    modal_order = (5, 0, 7, 2, 9, 4, 11)
    assert [counts_by_root[root] for root in modal_order] == [1, 2, 3, 3, 3, 2, 1]
    assert dict(sorted(Counter(counts_by_root.values()).items())) == {1: 2, 2: 2, 3: 3}


def test_byte_stability(document) -> None:
    first = GENERATOR.serialize_document(GENERATOR.build_document(ROOT))
    second = GENERATOR.serialize_document(GENERATOR.build_document(ROOT))
    assert first == second
    assert first == COMMITTED_BYTES
    assert document["generator"] == "scripts/generate_hypergraph_matrix.py"


def test_entry13_correspondence_cross_link(document) -> None:
    positions = json.loads(COURT_POSITIONS_PATH.read_text(encoding="utf-8"))
    c0 = positions["courtRootedPositions"][0]
    assert c0["positionId"] == "C0"
    assert c0["pitchClasses"] == [0, 2, 4, 7, 9]

    c0_node = document["pentatonicSubnodes"]["5-35:0"]
    assert c0_node["pitchClasses"] == c0["pitchClasses"]
    assert c0_node["isCornerstone"] is True
    assert c0_node["isBridge"] is False
    assert "7-35:0" in c0_node["parentsRooted"]


def test_tn_versus_tni_pin(document) -> None:
    assert document["metadata"]["totalTnClasses"] == 66
    assert document["metadata"]["totalTnIClassesPerSide"] == 38

    for cardinality in (5, 7):
        masks = [m for m in range(1 << 12) if m.bit_count() == cardinality]
        tn_orbits = {_tn_key(mask) for mask in masks}
        tni_classes = {compute_prime_form(mask) for mask in masks}
        assert len(tn_orbits) == 66
        assert len(tni_classes) == 38

    z_first = _mask({0, 1, 2, 5, 8})
    z_second = _mask({0, 1, 4, 5, 7})
    assert compute_interval_vector(z_first) == compute_interval_vector(z_second)
    assert compute_prime_form(z_first) != compute_prime_form(z_second)
    assert _tn_key(z_first) != _tn_key(z_second)


def test_generator_is_environment_independent(tmp_path: Path) -> None:
    output = tmp_path / "bipartite-inclusion-v1.json"
    environment = os.environ.copy()
    environment.update({"PYTHONHASHSEED": "8675309", "TZ": "Pacific/Honolulu"})
    result = subprocess.run(
        [
            sys.executable,
            str(GENERATOR_PATH),
            "--output",
            str(output),
        ],
        cwd=ROOT,
        env=environment,
        capture_output=True,
        text=True,
        check=False,
    )
    assert result.returncode == 0, result.stdout + result.stderr
    assert output.read_bytes() == COMMITTED_BYTES


def test_bipartite_containment_symmetry(document) -> None:
    pentatonic = document["pentatonicSubnodes"]
    heptatonic = document["heptatonicNodes"]
    for node in pentatonic.values():
        assert len(node["parentsRooted"]) == 21
        assert node["parentsUnrooted"] == sorted(
            {heptatonic[parent]["setClassId"] for parent in node["parentsRooted"]}
        )
        for parent_id in node["parentsRooted"]:
            assert node["id"] in heptatonic[parent_id]["subnodes"]
    for node in heptatonic.values():
        assert len(node["subnodes"]) == 15
        assert node["subnodes"] == sorted(node["subnodes"])
        for subnode_id in node["subnodes"]:
            assert node["id"] in pentatonic[subnode_id]["parentsRooted"]
