#!/usr/bin/env python3
"""Generate the BL-021a parallel-signature analysis over the landed bipartite artifact.

Read-only over ``derived/hypergraph/bipartite-inclusion-v1.json``: every anchored
pentatonic node's 21 ``parentsRooted`` edges are re-expressed as a per-voicing
parallel-family signature (class multiplicities), a diatonic-parent list, kernel-window
labels, and a three-reading modal context. No containment is recomputed; class identity
is looked up through ``heptatonicNodes`` (never parsed from node IDs) so orientation-B
IDs are safe.

Modal readings carried per diatonic parent (the three readings that one underspecified
sentence once conflated):

* ``parallelModes`` (Reading C) -- the parent collection's mode name at P's canonical
  root, via a static gap-pattern table. For 5-35:0 this yields 7-35:0 = Ionian,
  7-35:5 = Mixolydian, 7-35:7 = Lydian.
* ``kernelTonicModes`` (Reading B) -- the parent's mode names at its three 5-35 kernel
  tonics, ordered by tonic pitch class. For 7-35:0 the kernel tonics are {0, 5, 7}
  (subset of H), yielding Ionian, Lydian, Mixolydian.
* ``relativeModesInP`` (Reading A) -- the parent's mode names at P's five pitch classes,
  ordered by pitch class; five modes for a five-note P, never the triple.

Hard ban: a kernel tonic is a member of H, not of P. For P = {0,2,4,7,9}, pc 5 is in
7-35:0 but not in P; no field or rule may assert ``5 in P``.

All inputs and outputs are canonical JSON: sorted keys, compact separators, trailing
newline, no timestamps.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from collections import Counter, defaultdict
from itertools import combinations
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "court-mathematics/src"))

from court_mathematics import transpose_mask  # noqa: E402


SCHEMA_VERSION = "parallel-signatures.v1"
STATUS = "planning_evidence"
GENERATOR_PATH = "scripts/analyze_parallel_signatures.py"
DEFAULT_OUTPUT = "derived/hypergraph/parallel-signatures-v1.json"
BIPARTITE_PATH = "derived/hypergraph/bipartite-inclusion-v1.json"
COURT_POSITIONS_PATH = (
    "seven-governors-court-substrate-v0.1.0/canonical/court-rooted-positions.json"
)
PITCH_CLASS_MODULUS = 12
DIATONIC_CLASS = "7-35"
HARMONIC_MINOR_CLASS = "7-32"
CORNERSTONE_CLASS = "5-35"
ADMITTED_BRIDGE_CLASSES = ("5-23", "5-27")
EXPECTED_PENTATONIC_NODES = 330
EXPECTED_PARENTS_PER_NODE = 21
EXPECTED_CORNERSTONE_NODES = 5
EXPECTED_BRIDGE_NODES = 70
EXPECTED_BRIDGE_WITH_HARMONIC_MINOR = 55
EXPECTED_BRIDGE_WITHOUT_HARMONIC_MINOR = 15
EXPECTED_SIGNATURE_HISTOGRAM = {
    7: 10,
    9: 10,
    10: 5,
    11: 5,
    12: 40,
    13: 10,
    15: 50,
    16: 90,
    17: 50,
    18: 60,
}
EXPECTED_DIATONIC_PARENT_DISTRIBUTION = {0: 255, 1: 50, 2: 20, 3: 5}
EXPECTED_TN_DIVERSITY_DISTRIBUTION = {
    13: 2,
    15: 2,
    16: 1,
    17: 4,
    18: 5,
    19: 4,
    20: 39,
    21: 9,
}
EXPECTED_BRIDGE_CENSUS = {
    "5-Z12": 5,
    "5-20": 10,
    "5-23": 10,
    "5-24": 10,
    "5-25": 10,
    "5-27": 10,
    "5-29": 10,
    "5-34": 5,
}

MODE_PATTERNS = {
    (0, 2, 4, 5, 7, 9, 11): "Ionian",
    (0, 2, 3, 5, 7, 9, 10): "Dorian",
    (0, 1, 3, 5, 7, 8, 10): "Phrygian",
    (0, 2, 4, 6, 7, 9, 11): "Lydian",
    (0, 2, 4, 5, 7, 9, 10): "Mixolydian",
    (0, 2, 3, 5, 7, 8, 10): "Aeolian",
    (0, 1, 3, 5, 6, 8, 10): "Locrian",
}

C0_NAMED_CASE = {
    "id": "5-35:0",
    "signature": {
        "7-20": 2,
        "7-23": 4,
        "7-24": 2,
        "7-25": 2,
        "7-27": 4,
        "7-29": 2,
        "7-34": 1,
        "7-35": 3,
        "7-Z12": 1,
    },
    "diatonicParents": ["7-35:0", "7-35:5", "7-35:7"],
    "parallelModes": ["Ionian", "Mixolydian", "Lydian"],
    "kernelTonicModes": ["Ionian", "Lydian", "Mixolydian"],
    "relativeModesInP": ["Ionian", "Dorian", "Phrygian", "Mixolydian", "Aeolian"],
}


class SignatureBuildError(ValueError):
    """A stable rejection raised during generation."""


def _read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def _sha256_file(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _mask(pitch_classes: tuple[int, ...]) -> int:
    return sum(1 << pc for pc in pitch_classes)


def _pitch_classes(mask: int) -> tuple[int, ...]:
    return tuple(pc for pc in range(PITCH_CLASS_MODULUS) if mask & (1 << pc))


def _tn_key(mask: int) -> int:
    return min(transpose_mask(mask, step) for step in range(PITCH_CLASS_MODULUS))


def _mode_name(root: int, pitch_classes: tuple[int, ...]) -> str:
    pattern = tuple(sorted((pc - root) % PITCH_CLASS_MODULUS for pc in pitch_classes))
    name = MODE_PATTERNS.get(pattern)
    if name is None:
        raise SignatureBuildError(f"no_diatonic_mode_at_root:{root}")
    return name


def _kernel_tonics(diatonic_mask: int, c0_mask: int) -> list[tuple[int, frozenset[int]]]:
    kernels = []
    for subset in combinations(_pitch_classes(diatonic_mask), 5):
        subset_mask = _mask(subset)
        for step in range(PITCH_CLASS_MODULUS):
            if transpose_mask(c0_mask, step) == subset_mask:
                kernels.append((step, frozenset(subset)))
                break
    kernels.sort()
    if len(kernels) != 3:
        raise SignatureBuildError(f"diatonic_kernel_count:{diatonic_mask}:{len(kernels)}")
    return kernels


def _pearson(xs: list[float], ys: list[float]) -> float:
    n = len(xs)
    mean_x = sum(xs) / n
    mean_y = sum(ys) / n
    covariance = sum((x - mean_x) * (y - mean_y) for x, y in zip(xs, ys))
    variance_x = sum((x - mean_x) ** 2 for x in xs)
    variance_y = sum((y - mean_y) ** 2 for y in ys)
    if variance_x == 0 or variance_y == 0:
        raise SignatureBuildError("correlation_zero_variance")
    return covariance / (variance_x * variance_y) ** 0.5


def _average_ranks(values: list[int]) -> list[float]:
    order = sorted(range(len(values)), key=lambda index: values[index])
    ranks = [0.0] * len(values)
    position = 0
    while position < len(order):
        end = position
        while (
            end + 1 < len(order)
            and values[order[end + 1]] == values[order[position]]
        ):
            end += 1
        rank = (position + end) / 2.0
        for index in range(position, end + 1):
            ranks[order[index]] = rank
        position = end + 1
    return ranks


def _spearman(xs: list[int], ys: list[float]) -> float:
    return _pearson(_average_ranks(xs), _average_ranks(ys))


def _court_positions(root: Path) -> tuple[list[dict[str, Any]], int]:
    document = _read_json(root / COURT_POSITIONS_PATH)
    positions = sorted(
        document["courtRootedPositions"], key=lambda item: item["positionId"]
    )
    expected_ids = [f"C{index}" for index in range(len(positions))]
    if [item["positionId"] for item in positions] != expected_ids:
        raise SignatureBuildError("court_position_ids_unexpected")
    window_by_mask = {
        _mask(tuple(item["pitchClasses"])): item["positionId"] for item in positions
    }
    if len(window_by_mask) != len(positions):
        raise SignatureBuildError("court_position_mask_collision")
    return positions, window_by_mask


def _node_record(
    node: dict[str, Any],
    heptatonic: dict[str, dict[str, Any]],
    window_by_mask: dict[int, str],
    c0_mask: int,
) -> dict[str, Any]:
    parents = node["parentsRooted"]
    if len(parents) != EXPECTED_PARENTS_PER_NODE:
        raise SignatureBuildError(f"parent_count:{node['id']}:{len(parents)}")

    parent_classes = [heptatonic[parent]["setClassId"] for parent in parents]
    signature = dict(sorted(Counter(parent_classes).items()))
    diatonic_parents = sorted(
        parent for parent in parents if heptatonic[parent]["setClassId"] == DIATONIC_CLASS
    )
    bridge_parents = sorted(
        parent for parent in parents if heptatonic[parent]["setClassId"] != DIATONIC_CLASS
    )

    window = window_by_mask.get(node["pitchMask"])
    kernel_windows = [
        {"parent": parent, "window": window} for parent in diatonic_parents
    ]

    pentatonic_pitches = tuple(node["pitchClasses"])
    mode_context = []
    for parent in diatonic_parents:
        parent_pitches = tuple(heptatonic[parent]["pitchClasses"])
        parallel = _mode_name(node["root"], parent_pitches)
        kernels = _kernel_tonics(heptatonic[parent]["pitchMask"], c0_mask)
        kernel_tonic_modes = [
            _mode_name(tonic, parent_pitches) for tonic, _ in kernels
        ]
        relative_modes = [
            _mode_name(tonic, parent_pitches) for tonic in sorted(pentatonic_pitches)
        ]
        mode_context.append(
            {
                "parent": parent,
                "parallelModes": [parallel],
                "kernelTonicModes": kernel_tonic_modes,
                "relativeModesInP": relative_modes,
            }
        )

    return {
        "id": node["id"],
        "signature": signature,
        "distinctFamilies": len(signature),
        "maxFamilyMultiplicity": max(signature.values()),
        "diatonicParents": diatonic_parents,
        "diatonicParentCount": len(diatonic_parents),
        "bridgeParents": bridge_parents,
        "kernelWindows": kernel_windows,
        "modeContext": mode_context,
        "isBridge": node["isBridge"],
        "isCornerstone": node["isCornerstone"],
    }


def _aggregate_bridge_span(
    signatures: dict[str, dict[str, Any]],
    class_by_node: dict[str, str],
) -> dict[str, Any]:
    by_class: dict[str, dict[str, Any]] = defaultdict(
        lambda: {"nodeCount": 0, "familiesSpanned": set()}
    )
    with_harmonic_minor = 0
    without_harmonic_minor = 0
    for node_id, record in signatures.items():
        if not record["isBridge"]:
            continue
        families = set(record["signature"])
        entry = by_class[class_by_node[node_id]]
        entry["nodeCount"] += 1
        entry["familiesSpanned"].update(families)
        if {DIATONIC_CLASS, HARMONIC_MINOR_CLASS} <= families:
            with_harmonic_minor += 1
        elif DIATONIC_CLASS in families:
            without_harmonic_minor += 1

    by_set_class = {}
    for set_class, entry in sorted(by_class.items()):
        families = sorted(entry["familiesSpanned"])
        by_set_class[set_class] = {
            "nodeCount": entry["nodeCount"],
            "familyCount": len(families),
            "familiesSpanned": families,
            "includesHarmonicMinor": HARMONIC_MINOR_CLASS in families,
        }

    return {
        "totalBridgeNodes": with_harmonic_minor + without_harmonic_minor,
        "spansDiatonicAndHarmonicMinor": with_harmonic_minor,
        "spansDiatonicWithoutHarmonicMinor": without_harmonic_minor,
        "bySetClass": by_set_class,
    }


def _aggregate_class_profiles(
    signatures: dict[str, dict[str, Any]],
    pentatonic_masks: dict[str, int],
    tn_diversities: dict[str, int],
    class_by_node: dict[str, str],
) -> dict[str, Any]:
    orbits: dict[int, list[str]] = defaultdict(list)
    for node_id in signatures:
        orbits[_tn_key(pentatonic_masks[node_id])].append(node_id)

    profiles = {}
    for tn_key, node_ids in sorted(orbits.items()):
        node_ids.sort()
        diversities = {tn_diversities[node_id] for node_id in node_ids}
        if len(diversities) != 1:
            raise SignatureBuildError(f"tn_diversity_not_orbit_invariant:{tn_key}")
        family_counts = {
            signatures[node_id]["distinctFamilies"] for node_id in node_ids
        }
        max_multiplicities = {
            signatures[node_id]["maxFamilyMultiplicity"] for node_id in node_ids
        }
        if len(family_counts) != 1 or len(max_multiplicities) != 1:
            raise SignatureBuildError(f"signature_not_orbit_invariant:{tn_key}")
        profiles[str(tn_key)] = {
            "setClassId": class_by_node[node_ids[0]],
            "nodeIds": node_ids,
            "tnDiversity": diversities.pop(),
            "distinctFamilies": family_counts.pop(),
            "maxFamilyMultiplicity": max_multiplicities.pop(),
        }
    if len(profiles) != 66:
        raise SignatureBuildError("tn_orbit_count_mismatch")
    return profiles


def _aggregate_distribution(
    signatures: dict[str, dict[str, Any]], key: str
) -> dict[int, int]:
    return dict(sorted(Counter(record[key] for record in signatures.values()).items()))


def build_document(root: Path = ROOT) -> dict[str, Any]:
    bipartite = _read_json(root / BIPARTITE_PATH)
    pentatonic = bipartite["pentatonicSubnodes"]
    heptatonic = bipartite["heptatonicNodes"]
    if len(pentatonic) != EXPECTED_PENTATONIC_NODES:
        raise SignatureBuildError("pentatonic_universe_count_mismatch")

    positions, window_by_mask = _court_positions(root)
    c0_mask = _mask(tuple(positions[0]["pitchClasses"]))
    if positions[0]["positionId"] != "C0":
        raise SignatureBuildError("c0_position_not_first")
    if 5 in pentatonic[C0_NAMED_CASE["id"]]["pitchClasses"]:
        raise SignatureBuildError("false_membership_ban")

    signatures = {
        node_id: _node_record(
            pentatonic[node_id], heptatonic, window_by_mask, c0_mask
        )
        for node_id in sorted(pentatonic)
    }
    class_by_node = {
        node_id: pentatonic[node_id]["setClassId"] for node_id in pentatonic
    }
    tn_diversities = {
        node_id: len(
            {
                _tn_key(heptatonic[parent]["pitchMask"])
                for parent in pentatonic[node_id]["parentsRooted"]
            }
        )
        for node_id in pentatonic
    }

    signature_histogram = _aggregate_distribution(signatures, "distinctFamilies")
    diatonic_distribution = _aggregate_distribution(signatures, "diatonicParentCount")
    bridge_span = _aggregate_bridge_span(signatures, class_by_node)
    class_profiles = _aggregate_class_profiles(
        signatures,
        {node_id: pentatonic[node_id]["pitchMask"] for node_id in pentatonic},
        tn_diversities,
        class_by_node,
    )

    tn_diversity_distribution = dict(
        sorted(
            Counter(
                profile["tnDiversity"] for profile in class_profiles.values()
            ).items()
        )
    )
    diversities = [profile["tnDiversity"] for profile in class_profiles.values()]
    family_counts = [
        profile["distinctFamilies"] for profile in class_profiles.values()
    ]
    max_multiplicities = [
        profile["maxFamilyMultiplicity"] for profile in class_profiles.values()
    ]
    concentration = {
        "tnDiversityVsDistinctFamilies": {
            "pearson": round(_pearson(diversities, family_counts), 6),
            "spearman": round(_spearman(diversities, family_counts), 6),
        },
        "tnDiversityVsMaxFamilyMultiplicity": {
            "pearson": round(_pearson(diversities, max_multiplicities), 6),
            "spearman": round(_spearman(diversities, max_multiplicities), 6),
        },
        "distinctFamiliesVsMaxFamilyMultiplicity": {
            "pearson": round(_pearson(family_counts, max_multiplicities), 6),
            "spearman": round(_spearman(family_counts, max_multiplicities), 6),
        },
    }

    source_bindings = [
        {
            "path": BIPARTITE_PATH,
            "sha256": _sha256_file(root / BIPARTITE_PATH),
        },
        {
            "path": COURT_POSITIONS_PATH,
            "sha256": _sha256_file(root / COURT_POSITIONS_PATH),
        },
    ]

    document = {
        "status": STATUS,
        "schemaVersion": SCHEMA_VERSION,
        "generator": GENERATOR_PATH,
        "sourceBindings": source_bindings,
        "metadata": {
            "totalPentatonicNodes": len(signatures),
            "totalTnOrbits": len(class_profiles),
            "scope": {
                "pentatonicSideOnly": True,
                "heptatonicMirror": (
                    "deferred; derivable by bipartite inversion from parentsRooted edges"
                ),
            },
            "signatureHistogram": signature_histogram,
            "diatonicParentCountDistribution": diatonic_distribution,
            "tnDiversityDistribution": tn_diversity_distribution,
            "bridgeSpanCensus": bridge_span,
            "concentrationCorrelations": concentration,
            "windowDefinition": (
                "For each anchored diatonic (7-35) parent, kernelWindows names the "
                "registered court-rooted position (court-rooted-positions.json) equal to "
                "the node's concrete pitch set, or null when the node is not one of the "
                "five registered positions (i.e., not class 5-35)."
            ),
            "modalReadings": (
                "modeContext carries one entry per anchored diatonic parent. "
                "parallelModes (Reading C) is a singleton naming that parent "
                "collection's mode at the node's canonical root. kernelTonicModes "
                "(Reading B) lists the parent's mode names at its three 5-35 kernel "
                "tonics ordered by tonic pitch class; kernel tonics are members of the "
                "parent collection, not of the pentatonic node. relativeModesInP "
                "(Reading A) lists the parent's mode names at the node's five pitch "
                "classes ordered by pitch class. For node 5-35:0 the kernel tonics "
                "{0,5,7} lie in 7-35:0 but 5 is not a member of {0,2,4,7,9}; no reading "
                "asserts pc 5 belongs to the pentatonic."
            ),
            "bridgeDefinition": (
                "bridgeParents lists non-7-35 parents of a node. The bridge span census "
                "counts the 70 isBridge nodes and which families they span; span is an "
                "inclusion test over the families touched, not an exact-pair test."
            ),
        },
        "pentatonicSignatures": signatures,
        "pentatonicClassProfiles": class_profiles,
    }
    _self_validate(document)
    return document


def _self_validate(document: dict[str, Any]) -> None:
    signatures = document["pentatonicSignatures"]
    metadata = document["metadata"]

    if len(signatures) != EXPECTED_PENTATONIC_NODES:
        raise SignatureBuildError("self_validate_node_count")
    for node_id, record in signatures.items():
        if sum(record["signature"].values()) != EXPECTED_PARENTS_PER_NODE:
            raise SignatureBuildError(f"self_validate_signature_sum:{node_id}")
        if record["distinctFamilies"] != len(record["signature"]):
            raise SignatureBuildError(f"self_validate_distinct:{node_id}")
        if record["maxFamilyMultiplicity"] != max(record["signature"].values()):
            raise SignatureBuildError(f"self_validate_max:{node_id}")
        if record["diatonicParentCount"] != len(record["diatonicParents"]):
            raise SignatureBuildError(f"self_validate_diatonic_count:{node_id}")
        if len(record["diatonicParents"]) + len(record["bridgeParents"]) != (
            EXPECTED_PARENTS_PER_NODE
        ):
            raise SignatureBuildError(f"self_validate_parent_partition:{node_id}")

    if metadata["signatureHistogram"] != EXPECTED_SIGNATURE_HISTOGRAM:
        raise SignatureBuildError("self_validate_signature_histogram")
    if metadata["diatonicParentCountDistribution"] != (
        EXPECTED_DIATONIC_PARENT_DISTRIBUTION
    ):
        raise SignatureBuildError("self_validate_diatonic_distribution")
    if metadata["tnDiversityDistribution"] != EXPECTED_TN_DIVERSITY_DISTRIBUTION:
        raise SignatureBuildError("self_validate_tn_diversity_distribution")

    census = metadata["bridgeSpanCensus"]
    if census["totalBridgeNodes"] != EXPECTED_BRIDGE_NODES:
        raise SignatureBuildError("self_validate_bridge_total")
    if census["spansDiatonicAndHarmonicMinor"] != (
        EXPECTED_BRIDGE_WITH_HARMONIC_MINOR
    ):
        raise SignatureBuildError("self_validate_bridge_with_harmonic_minor")
    if census["spansDiatonicWithoutHarmonicMinor"] != (
        EXPECTED_BRIDGE_WITHOUT_HARMONIC_MINOR
    ):
        raise SignatureBuildError("self_validate_bridge_without_harmonic_minor")
    by_class = {
        set_class: entry["nodeCount"] for set_class, entry in census["bySetClass"].items()
    }
    if by_class != EXPECTED_BRIDGE_CENSUS:
        raise SignatureBuildError("self_validate_bridge_by_class")
    for set_class in ADMITTED_BRIDGE_CLASSES:
        if set_class not in by_class:
            raise SignatureBuildError(f"self_validate_admitted_bridge:{set_class}")

    cornerstones = [
        record for record in signatures.values() if record["isCornerstone"]
    ]
    if len(cornerstones) != EXPECTED_CORNERSTONE_NODES:
        raise SignatureBuildError("self_validate_cornerstone_count")
    for record in cornerstones:
        if record["diatonicParentCount"] != 3:
            raise SignatureBuildError(f"self_validate_cornerstone_window:{record['id']}")

    named = signatures[C0_NAMED_CASE["id"]]
    if named["signature"] != C0_NAMED_CASE["signature"]:
        raise SignatureBuildError("self_validate_named_signature")
    if named["diatonicParents"] != C0_NAMED_CASE["diatonicParents"]:
        raise SignatureBuildError("self_validate_named_diatonic_parents")
    windows = [entry["window"] for entry in named["kernelWindows"]]
    if windows != ["C0", "C0", "C0"]:
        raise SignatureBuildError("self_validate_named_windows")
    if not named["isCornerstone"] or named["isBridge"]:
        raise SignatureBuildError("self_validate_named_flags")
    parallel = [entry["parallelModes"][0] for entry in named["modeContext"]]
    if parallel != C0_NAMED_CASE["parallelModes"]:
        raise SignatureBuildError("self_validate_named_parallel_modes")
    kernel_tonic = named["modeContext"][0]["kernelTonicModes"]
    if kernel_tonic != C0_NAMED_CASE["kernelTonicModes"]:
        raise SignatureBuildError("self_validate_named_kernel_tonic_modes")
    relative = named["modeContext"][0]["relativeModesInP"]
    if relative != C0_NAMED_CASE["relativeModesInP"]:
        raise SignatureBuildError("self_validate_named_relative_modes")


def serialize_document(document: dict[str, Any]) -> bytes:
    return (
        json.dumps(
            document,
            ensure_ascii=False,
            allow_nan=False,
            separators=(",", ":"),
            sort_keys=True,
        )
        + "\n"
    ).encode("utf-8")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=ROOT / DEFAULT_OUTPUT)
    args = parser.parse_args()

    document = build_document(ROOT)
    payload = serialize_document(document)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_bytes(payload)
    try:
        output_label = str(args.output.relative_to(ROOT))
    except ValueError:
        output_label = str(args.output)
    print(
        json.dumps(
            {
                "bridgeNodes": document["metadata"]["bridgeSpanCensus"][
                    "totalBridgeNodes"
                ],
                "correlations": document["metadata"]["concentrationCorrelations"],
                "output": output_label,
                "pentatonicNodes": len(document["pentatonicSignatures"]),
                "status": document["status"],
                "tnOrbits": document["metadata"]["totalTnOrbits"],
            },
            sort_keys=True,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
