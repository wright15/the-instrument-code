"""Sprint evidence pin for the BL-021a parallel-signature analysis.

Pins the per-voicing parallel-family signatures derived from the landed bipartite
containment artifact: the C-major named case with its three separated modal readings
(parallel parent modes, kernel-tonic modes, tonic-in-P modes), the hard ban on the
false pc-5 membership claim, the bridge-span census, the diatonic-parent and
distinct-family distributions, the class-level Tn-diversity distribution, and the H1
concentration correlations. Sprint evidence only: this file grants no admission status
and resolves no gate.
"""

from __future__ import annotations

import importlib.util
import json
import os
from collections import Counter, defaultdict
from pathlib import Path
import subprocess
import sys

import pytest


ROOT = Path(__file__).resolve().parents[1]
GENERATOR_PATH = ROOT / "scripts/analyze_parallel_signatures.py"
ARTIFACT_PATH = ROOT / "derived/hypergraph/parallel-signatures-v1.json"
BIPARTITE_PATH = ROOT / "derived/hypergraph/bipartite-inclusion-v1.json"
COURT_POSITIONS_PATH = (
    ROOT
    / "seven-governors-court-substrate-v0.1.0"
    / "canonical"
    / "court-rooted-positions.json"
)
COMMITTED_BYTES = ARTIFACT_PATH.read_bytes()

sys.path.insert(0, str(ROOT / "court-mathematics/src"))
from court_mathematics import transpose_mask  # noqa: E402


MODE_PATTERNS = {
    (0, 2, 4, 5, 7, 9, 11): "Ionian",
    (0, 2, 3, 5, 7, 9, 10): "Dorian",
    (0, 1, 3, 5, 7, 8, 10): "Phrygian",
    (0, 2, 4, 6, 7, 9, 11): "Lydian",
    (0, 2, 4, 5, 7, 9, 10): "Mixolydian",
    (0, 2, 3, 5, 7, 8, 10): "Aeolian",
    (0, 1, 3, 5, 6, 8, 10): "Locrian",
}


def _load_module(path: Path, name: str):
    spec = importlib.util.spec_from_file_location(name, path)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


GENERATOR = _load_module(GENERATOR_PATH, "parallel_signature_generator")


@pytest.fixture(scope="module")
def document() -> dict:
    return json.loads(COMMITTED_BYTES)


@pytest.fixture(scope="module")
def bipartite() -> dict:
    return json.loads(BIPARTITE_PATH.read_bytes())


@pytest.fixture(scope="module")
def court_positions() -> dict:
    return json.loads(COURT_POSITIONS_PATH.read_text(encoding="utf-8"))


def _tn_key(mask: int) -> int:
    return min(transpose_mask(mask, step) for step in range(12))


def _mode_name(root: int, pitch_classes) -> str:
    pattern = tuple(sorted((pc - root) % 12 for pc in pitch_classes))
    return MODE_PATTERNS[pattern]


def _pearson(xs, ys) -> float:
    n = len(xs)
    mean_x = sum(xs) / n
    mean_y = sum(ys) / n
    covariance = sum((x - mean_x) * (y - mean_y) for x, y in zip(xs, ys))
    variance_x = sum((x - mean_x) ** 2 for x in xs)
    variance_y = sum((y - mean_y) ** 2 for y in ys)
    return covariance / (variance_x * variance_y) ** 0.5


def _average_ranks(values) -> list[float]:
    order = sorted(range(len(values)), key=lambda index: values[index])
    ranks = [0.0] * len(values)
    position = 0
    while position < len(order):
        end = position
        while end + 1 < len(order) and values[order[end + 1]] == values[order[position]]:
            end += 1
        rank = (position + end) / 2.0
        for index in range(position, end + 1):
            ranks[order[index]] = rank
        position = end + 1
    return ranks


def _spearman(xs, ys) -> float:
    return _pearson(_average_ranks(xs), _average_ranks(ys))


def test_universe_and_signature_invariants(document, bipartite) -> None:
    assert document["status"] == "planning_evidence"
    assert document["schemaVersion"] == "parallel-signatures.v1"
    assert document["generator"] == "scripts/analyze_parallel_signatures.py"
    assert document["metadata"]["totalPentatonicNodes"] == 330
    assert document["metadata"]["totalTnOrbits"] == 66

    signatures = document["pentatonicSignatures"]
    heptatonic = bipartite["heptatonicNodes"]
    assert set(signatures) == set(bipartite["pentatonicSubnodes"])
    for node_id, record in signatures.items():
        node = bipartite["pentatonicSubnodes"][node_id]
        recomputed = Counter(
            heptatonic[parent]["setClassId"] for parent in node["parentsRooted"]
        )
        assert record["signature"] == dict(sorted(recomputed.items()))
        assert sum(record["signature"].values()) == 21
        assert record["distinctFamilies"] == len(record["signature"])
        assert record["maxFamilyMultiplicity"] == max(record["signature"].values())
        assert record["diatonicParentCount"] == len(record["diatonicParents"])
        assert len(record["diatonicParents"]) + len(record["bridgeParents"]) == 21
        assert record["isBridge"] is node["isBridge"]
        assert record["isCornerstone"] is node["isCornerstone"]


def test_c_major_named_case(document, bipartite) -> None:
    named = document["pentatonicSignatures"]["5-35:0"]
    assert named["signature"] == {
        "7-20": 2,
        "7-23": 4,
        "7-24": 2,
        "7-25": 2,
        "7-27": 4,
        "7-29": 2,
        "7-34": 1,
        "7-35": 3,
        "7-Z12": 1,
    }
    assert named["diatonicParents"] == ["7-35:0", "7-35:5", "7-35:7"]
    assert named["diatonicParentCount"] == 3
    assert named["isCornerstone"] is True
    assert named["isBridge"] is False
    assert [entry["window"] for entry in named["kernelWindows"]] == [
        "C0",
        "C0",
        "C0",
    ]

    context = {entry["parent"]: entry for entry in named["modeContext"]}
    assert context["7-35:0"]["parallelModes"] == ["Ionian"]
    assert context["7-35:5"]["parallelModes"] == ["Mixolydian"]
    assert context["7-35:7"]["parallelModes"] == ["Lydian"]
    assert context["7-35:0"]["kernelTonicModes"] == [
        "Ionian",
        "Lydian",
        "Mixolydian",
    ]
    assert context["7-35:0"]["relativeModesInP"] == [
        "Ionian",
        "Dorian",
        "Phrygian",
        "Mixolydian",
        "Aeolian",
    ]

    pentatonic_pitches = set(
        bipartite["pentatonicSubnodes"]["5-35:0"]["pitchClasses"]
    )
    assert pentatonic_pitches == {0, 2, 4, 7, 9}
    assert 5 not in pentatonic_pitches
    assert 7 in pentatonic_pitches
    diatonic_pitches = set(bipartite["heptatonicNodes"]["7-35:0"]["pitchClasses"])
    assert {0, 5, 7} <= diatonic_pitches
    assert "Lydian" in context["7-35:0"]["kernelTonicModes"]


def test_mode_context_reading_shapes(document) -> None:
    for record in document["pentatonicSignatures"].values():
        assert len(record["modeContext"]) == record["diatonicParentCount"]
        assert [entry["parent"] for entry in record["modeContext"]] == record[
            "diatonicParents"
        ]
        for entry in record["modeContext"]:
            assert len(entry["parallelModes"]) == 1
            assert len(entry["kernelTonicModes"]) == 3
            assert len(entry["relativeModesInP"]) == 5


def test_modal_readings_match_gap_patterns(document, bipartite) -> None:
    heptatonic = bipartite["heptatonicNodes"]
    pentatonic = bipartite["pentatonicSubnodes"]
    for node_id, record in document["pentatonicSignatures"].items():
        root = pentatonic[node_id]["root"]
        for entry in record["modeContext"]:
            parent_pitches = heptatonic[entry["parent"]]["pitchClasses"]
            assert entry["parallelModes"] == [_mode_name(root, parent_pitches)]
            kernel_tonics = sorted(
                tonic
                for tonic in range(12)
                if tonic in parent_pitches
                and _is_kernel_tonic(entry["parent"], tonic, heptatonic)
            )
            assert entry["kernelTonicModes"] == [
                _mode_name(tonic, parent_pitches) for tonic in kernel_tonics
            ]
            assert entry["relativeModesInP"] == [
                _mode_name(tonic, parent_pitches)
                for tonic in sorted(pentatonic[node_id]["pitchClasses"])
            ]


def _is_kernel_tonic(parent_id: str, tonic: int, heptatonic: dict) -> bool:
    c0 = {0, 2, 4, 7, 9}
    kernel = {(pc + tonic) % 12 for pc in c0}
    return kernel <= set(heptatonic[parent_id]["pitchClasses"])


def test_h2_bridge_span_census(document, bipartite) -> None:
    heptatonic = bipartite["heptatonicNodes"]
    with_harmonic_minor = 0
    without_harmonic_minor = 0
    families_by_class: dict[str, set[str]] = defaultdict(set)
    counts_by_class: Counter = Counter()
    for node_id, node in bipartite["pentatonicSubnodes"].items():
        if not node["isBridge"]:
            continue
        families = {heptatonic[parent]["setClassId"] for parent in node["parentsRooted"]}
        set_class = node["setClassId"]
        counts_by_class[set_class] += 1
        families_by_class[set_class].update(families)
        if {"7-35", "7-32"} <= families:
            with_harmonic_minor += 1
        elif "7-35" in families:
            without_harmonic_minor += 1

    assert with_harmonic_minor == 55
    assert without_harmonic_minor == 15
    assert with_harmonic_minor + without_harmonic_minor == 70

    census = document["metadata"]["bridgeSpanCensus"]
    assert census["totalBridgeNodes"] == 70
    assert census["spansDiatonicAndHarmonicMinor"] == 55
    assert census["spansDiatonicWithoutHarmonicMinor"] == 15
    assert set(census["bySetClass"]) == set(counts_by_class)
    for set_class, entry in census["bySetClass"].items():
        assert entry["nodeCount"] == counts_by_class[set_class]
        assert entry["familiesSpanned"] == sorted(families_by_class[set_class])
        assert entry["familyCount"] == len(families_by_class[set_class])
        assert entry["includesHarmonicMinor"] is (
            "7-32" in families_by_class[set_class]
        )
    assert census["bySetClass"]["5-34"]["includesHarmonicMinor"] is False
    assert census["bySetClass"]["5-24"]["includesHarmonicMinor"] is False
    assert census["bySetClass"]["5-23"]["includesHarmonicMinor"] is True
    assert census["bySetClass"]["5-27"]["includesHarmonicMinor"] is True


def test_h3_diatonic_parent_distribution(document, bipartite) -> None:
    heptatonic = bipartite["heptatonicNodes"]
    distribution = Counter(
        sum(
            1
            for parent in node["parentsRooted"]
            if heptatonic[parent]["setClassId"] == "7-35"
        )
        for node in bipartite["pentatonicSubnodes"].values()
    )
    assert {str(key): value for key, value in sorted(distribution.items())} == {
        "0": 255,
        "1": 50,
        "2": 20,
        "3": 5,
    }
    assert document["metadata"]["diatonicParentCountDistribution"] == {
        "0": 255,
        "1": 50,
        "2": 20,
        "3": 5,
    }

    cornerstones = [
        record
        for record in document["pentatonicSignatures"].values()
        if record["isCornerstone"]
    ]
    assert len(cornerstones) == 5
    for record in cornerstones:
        assert record["diatonicParentCount"] == 3


def test_signature_histogram_and_tn_diversity(document, bipartite) -> None:
    heptatonic = bipartite["heptatonicNodes"]
    pentatonic = bipartite["pentatonicSubnodes"]

    histogram = Counter(
        len({heptatonic[parent]["setClassId"] for parent in node["parentsRooted"]})
        for node in pentatonic.values()
    )
    assert {str(key): value for key, value in sorted(histogram.items())} == {
        "7": 10,
        "9": 10,
        "10": 5,
        "11": 5,
        "12": 40,
        "13": 10,
        "15": 50,
        "16": 90,
        "17": 50,
        "18": 60,
    }
    assert document["metadata"]["signatureHistogram"] == {
        "7": 10,
        "9": 10,
        "10": 5,
        "11": 5,
        "12": 40,
        "13": 10,
        "15": 50,
        "16": 90,
        "17": 50,
        "18": 60,
    }

    orbits: dict[int, list[str]] = defaultdict(list)
    for node_id, node in pentatonic.items():
        orbits[_tn_key(node["pitchMask"])].append(node_id)
    assert len(orbits) == 66
    assert all(len(members) == 5 for members in orbits.values())

    diversity_distribution = Counter()
    for members in orbits.values():
        diversities = {
            len(
                {
                    _tn_key(heptatonic[parent]["pitchMask"])
                    for parent in pentatonic[node_id]["parentsRooted"]
                }
            )
            for node_id in members
        }
        assert len(diversities) == 1
        diversity_distribution[diversities.pop()] += 1
    assert {
        str(key): value for key, value in sorted(diversity_distribution.items())
    } == {
        "13": 2,
        "15": 2,
        "16": 1,
        "17": 4,
        "18": 5,
        "19": 4,
        "20": 39,
        "21": 9,
    }
    assert document["metadata"]["tnDiversityDistribution"] == {
        "13": 2,
        "15": 2,
        "16": 1,
        "17": 4,
        "18": 5,
        "19": 4,
        "20": 39,
        "21": 9,
    }


def test_h1_concentration_correlations(document) -> None:
    profiles = list(document["pentatonicClassProfiles"].values())
    assert len(profiles) == 66
    diversities = [profile["tnDiversity"] for profile in profiles]
    family_counts = [profile["distinctFamilies"] for profile in profiles]
    max_multiplicities = [profile["maxFamilyMultiplicity"] for profile in profiles]

    correlations = document["metadata"]["concentrationCorrelations"]
    assert correlations["tnDiversityVsDistinctFamilies"]["pearson"] == pytest.approx(
        _pearson(diversities, family_counts), abs=1e-6
    )
    assert correlations["tnDiversityVsDistinctFamilies"]["spearman"] == pytest.approx(
        _spearman(diversities, family_counts), abs=1e-6
    )
    assert correlations["tnDiversityVsMaxFamilyMultiplicity"][
        "pearson"
    ] == pytest.approx(_pearson(diversities, max_multiplicities), abs=1e-6)
    assert correlations["tnDiversityVsMaxFamilyMultiplicity"][
        "spearman"
    ] == pytest.approx(_spearman(diversities, max_multiplicities), abs=1e-6)

    assert correlations["tnDiversityVsMaxFamilyMultiplicity"]["pearson"] < -0.5
    assert correlations["tnDiversityVsMaxFamilyMultiplicity"]["spearman"] < -0.5
    assert correlations["tnDiversityVsDistinctFamilies"]["pearson"] > 0.5

    by_class = {profile["setClassId"]: profile for profile in profiles}
    assert by_class["5-35"]["tnDiversity"] == 15
    assert by_class["5-35"]["distinctFamilies"] == 9
    assert by_class["5-35"]["maxFamilyMultiplicity"] == 4


def test_entry13_link(document, court_positions) -> None:
    c0 = court_positions["courtRootedPositions"][0]
    assert c0["positionId"] == "C0"
    assert c0["pitchClasses"] == [0, 2, 4, 7, 9]

    named = document["pentatonicSignatures"]["5-35:0"]
    assert named["kernelWindows"] == [
        {"parent": "7-35:0", "window": "C0"},
        {"parent": "7-35:5", "window": "C0"},
        {"parent": "7-35:7", "window": "C0"},
    ]


def test_source_bindings_and_scope(document) -> None:
    import hashlib

    bindings = {entry["path"]: entry["sha256"] for entry in document["sourceBindings"]}
    for path in (BIPARTITE_PATH, COURT_POSITIONS_PATH):
        expected = hashlib.sha256(path.read_bytes()).hexdigest()
        assert bindings[str(path.relative_to(ROOT))] == expected
    assert document["metadata"]["scope"] == {
        "pentatonicSideOnly": True,
        "heptatonicMirror": (
            "deferred; derivable by bipartite inversion from parentsRooted edges"
        ),
    }


def test_byte_stability(document) -> None:
    first = GENERATOR.serialize_document(GENERATOR.build_document(ROOT))
    second = GENERATOR.serialize_document(GENERATOR.build_document(ROOT))
    assert first == second
    assert first == COMMITTED_BYTES


def test_generator_is_environment_independent(tmp_path: Path) -> None:
    output = tmp_path / "parallel-signatures-v1.json"
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
