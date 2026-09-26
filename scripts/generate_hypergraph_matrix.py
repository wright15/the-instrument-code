#!/usr/bin/env python3
"""Generate the BL-021 bipartite containment matrix.

The artifact enumerates the 330 pentatonic and 462 heptatonic pitch-class sets of
cardinality 5 and 7 that contain pc 0 ("root-anchored"), links them by concrete set
inclusion, and classifies each pentatonic subnode as cornerstone (set class 5-35) or
bridge (a non-cornerstone whose anchored parents cross the diatonic boundary: at least
one 7-35 parent and at least one non-7-35 parent).

Node IDs are ``{forteTnI}:{root}``. "Root" is the canonical scale root: the
transposition carrying the class's canonical genus to the concrete set (Ionian for
7-35, harmonic minor for orientation-A 7-32, major pentatonic for 5-35, and the
lexicographically minimal orbit representative elsewhere). Tonic and root are distinct:
``7-35:0`` is the C-major pitch collection; A Aeolian is that node with tonic pc 9
carried as mode context. This distinction has now bitten three times (the
E-harmonic-minor brainstorm reading, the v1.1 node IDs, and the v1.3 destination); the
Andalusian destination is ``7-32:9`` (A harmonic minor).

Forte labels are TnI set-class labels (38 per side, from the admitted pentatonic
registry and the canonical heptatonic ledger). The 66 Tn classes per side are the
transposition orbits; bridging is decided on orbits/classes, not on prime form.

The containment direction that matters here is concrete: ``parentsRooted(P)`` is every
anchored heptatonic node whose concrete pc-set contains P's concrete pc-set. Every
anchored pentatonic has exactly 21 such parents, so the literal "parents span more than
one Tn orbit" reading marks all 330 subnodes; the emitted ``isBridge`` flag therefore
uses the multi-family (diatonic-boundary) definition above, and the literal total is
recorded as ``metadata.orbitSpanParentageTotal``.
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

from court_mathematics import compute_prime_form, transpose_mask  # noqa: E402


SCHEMA_VERSION = "bipartite-inclusion.v1"
STATUS = "planning_evidence"
GENERATOR_PATH = "scripts/generate_hypergraph_matrix.py"
DEFAULT_OUTPUT = "derived/hypergraph/bipartite-inclusion-v1.json"
PENTATONIC_REGISTRY_PATH = (
    "seven-governors-court-substrate-v0.1.0/canonical/pentatonic-set-class-registry.json"
)
HEPTATONIC_LEDGER_PATH = "canonical/universal-heptatonic-ledger.json"
PITCH_CLASS_MODULUS = 12
CORNERSTONE_CLASS = "5-35"
DIATONIC_CLASS = "7-35"
ADMITTED_BRIDGE_CLASSES = ("5-23", "5-27")
EXPECTED_PENTATONICS = 330
EXPECTED_HEPTATONICS = 462
EXPECTED_TN_CLASSES = 66
EXPECTED_TNI_CLASSES = 38
EXPECTED_PARENTS_PER_PENTATONIC = 21
EXPECTED_SUBNODES_PER_HEPTATONIC = 15
EXPECTED_TOTAL_SUBSETS_PER_HEPTATONIC = 21
EXPECTED_5_TO_7_35_DISTRIBUTION = {0: 255, 1: 50, 2: 20, 3: 5}
EXPECTED_7_SIDE_KERNEL_DISTRIBUTION = {0: 381, 1: 60, 2: 18, 3: 3}
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
EXPECTED_ORBIT_SPAN_TOTAL = 330


class HypergraphBuildError(ValueError):
    """A stable rejection raised during generation."""


def _mask(pitch_classes: tuple[int, ...]) -> int:
    return sum(1 << pc for pc in pitch_classes)


def _pitch_classes(mask: int) -> tuple[int, ...]:
    return tuple(pc for pc in range(PITCH_CLASS_MODULUS) if mask & (1 << pc))


def _anchored_masks(cardinality: int) -> list[int]:
    return sorted(
        1 | _mask(combo)
        for combo in combinations(range(1, PITCH_CLASS_MODULUS), cardinality - 1)
    )


def _all_masks(cardinality: int) -> list[int]:
    return [
        mask
        for mask in range(1 << PITCH_CLASS_MODULUS)
        if mask.bit_count() == cardinality
    ]


def _tn_key(mask: int) -> int:
    return min(transpose_mask(mask, step) for step in range(PITCH_CLASS_MODULUS))


def _transposition_index(source: int, target: int) -> int:
    for step in range(PITCH_CLASS_MODULUS):
        if transpose_mask(source, step) == target:
            return step
    raise HypergraphBuildError(f"no_transposition:{source}:{target}")


def _rooted_order(mask: int, root: int) -> list[int]:
    return sorted(
        _pitch_classes(mask),
        key=lambda pc: (pc - root) % PITCH_CLASS_MODULUS,
    )


def _parse_pitch_set(value: str) -> tuple[int, ...]:
    return tuple(int(part) for part in value.strip("{}").split(","))


def _read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def _sha256_file(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _forte_index(root: Path) -> dict[int, dict[tuple[int, ...], str]]:
    registry = _read_json(root / PENTATONIC_REGISTRY_PATH)
    ledger = _read_json(root / HEPTATONIC_LEDGER_PATH)

    prime_to_forte_5: dict[tuple[int, ...], str] = {}
    for record in registry["pentatonicSetClasses"]:
        prime = compute_prime_form(record["representativeMask"])
        if prime in prime_to_forte_5:
            raise HypergraphBuildError(f"pentatonic_prime_collision:{prime}")
        prime_to_forte_5[prime] = record["forteNumber"]

    prime_to_forte_7: dict[tuple[int, ...], str] = {}
    for record in ledger:
        prime = compute_prime_form(_mask(_parse_pitch_set(record["pitchSet"])))
        if prime in prime_to_forte_7 and prime_to_forte_7[prime] != record["forte"]:
            raise HypergraphBuildError(f"heptatonic_prime_collision:{prime}")
        prime_to_forte_7[prime] = record["forte"]

    if len(prime_to_forte_5) != EXPECTED_TNI_CLASSES:
        raise HypergraphBuildError("pentatonic_forte_index_incomplete")
    if len(prime_to_forte_7) != EXPECTED_TNI_CLASSES:
        raise HypergraphBuildError("heptatonic_forte_index_incomplete")
    return {5: prime_to_forte_5, 7: prime_to_forte_7}


def _ledger_orientation(root: Path) -> dict[int, str]:
    ledger = _read_json(root / HEPTATONIC_LEDGER_PATH)
    orientation: dict[int, str] = {}
    for record in ledger:
        mask = _mask(_parse_pitch_set(record["pitchSet"]))
        label = record["orientation"]
        if "orientation A" in label:
            value = "A"
        elif "orientation B" in label:
            value = "B"
        else:
            value = "single"
        if orientation.get(mask, value) != value:
            raise HypergraphBuildError(f"orientation_disagreement:{mask}")
        orientation[mask] = value
    if len(orientation) != EXPECTED_HEPTATONICS:
        raise HypergraphBuildError("ledger_orientation_incomplete")
    return orientation


def _canonical_genera() -> dict[int, dict[int, int]]:
    overrides_5 = (
        (0, 2, 4, 7, 9),
        (0, 2, 3, 5, 7),
        (0, 3, 5, 7, 8),
    )
    overrides_7 = (
        (0, 2, 4, 5, 7, 9, 11),
        (0, 2, 3, 5, 7, 8, 11),
        (0, 1, 4, 5, 7, 9, 10),
    )
    return {
        5: {_tn_key(_mask(genus)): _mask(genus) for genus in overrides_5},
        7: {_tn_key(_mask(genus)): _mask(genus) for genus in overrides_7},
    }


def _orbit_members(anchored: list[int]) -> dict[int, list[int]]:
    orbits: dict[int, list[int]] = defaultdict(list)
    for mask in anchored:
        orbits[_tn_key(mask)].append(mask)
    for members in orbits.values():
        members.sort()
    return dict(orbits)


def _orientation_maps(
    orbits: dict[int, list[int]],
    forte_of: dict[tuple[int, ...], str],
    ledger_orientation: dict[int, str] | None,
    genera: dict[int, int],
) -> dict[int, str]:
    if ledger_orientation is not None:
        orientation: dict[int, str] = {}
        for key, members in orbits.items():
            labels = {ledger_orientation[mask] for mask in members}
            if len(labels) != 1:
                raise HypergraphBuildError("ledger_orientation_disagreement")
            orientation[key] = labels.pop()
        return orientation
    orientation = {}
    by_class: dict[str, list[int]] = defaultdict(list)
    for key, members in orbits.items():
        by_class[forte_of[compute_prime_form(members[0])]].append(key)
    for class_keys in by_class.values():
        if len(class_keys) == 1:
            orientation[class_keys[0]] = "single"
            continue
        if len(class_keys) != 2:
            raise HypergraphBuildError("unexpected_orbit_multiplicity")
        overridden = [key for key in class_keys if key in genera]
        primary = overridden[0] if len(overridden) == 1 else min(class_keys)
        secondary = class_keys[1] if class_keys[0] == primary else class_keys[0]
        orientation[primary] = "A"
        orientation[secondary] = "B"
    return orientation


def _build_nodes(
    anchored: list[int],
    forte_of: dict[tuple[int, ...], str],
    genera: dict[int, int],
    ledger_orientation: dict[int, str] | None,
) -> dict[int, dict[str, Any]]:
    orbits = _orbit_members(anchored)
    orientation = _orientation_maps(orbits, forte_of, ledger_orientation, genera)
    nodes: dict[int, dict[str, Any]] = {}
    used_ids: set[str] = set()
    for key, members in orbits.items():
        genus = genera.get(key, key)
        for mask in members:
            root = _transposition_index(genus, mask)
            set_class = forte_of[compute_prime_form(mask)]
            base = f"{set_class}:{root}"
            node_id = base if orientation[key] != "B" else f"{base}B"
            if node_id in used_ids:
                raise HypergraphBuildError(f"node_id_collision:{node_id}")
            used_ids.add(node_id)
            nodes[mask] = {
                "id": node_id,
                "setClassId": set_class,
                "orientation": orientation[key],
                "root": root,
                "genus": genus,
                "tnOrbit": key,
            }
    if len(nodes) != len(anchored):
        raise HypergraphBuildError("node_count_mismatch")
    return nodes


def _node_payload(node: dict[str, Any], mask: int) -> dict[str, Any]:
    return {
        "id": node["id"],
        "pitchClasses": _rooted_order(mask, node["root"]),
        "pitchMask": mask,
        "root": node["root"],
        "setClassId": node["setClassId"],
        "orientation": node["orientation"],
    }


def _subset_masks(mask: int, cardinality: int) -> list[int]:
    return sorted(
        _mask(combo) for combo in combinations(_pitch_classes(mask), cardinality)
    )


def build_document(root: Path = ROOT) -> dict[str, Any]:
    forte_index = _forte_index(root)
    genera = _canonical_genera()
    ledger_orientation = _ledger_orientation(root)

    anchored_5 = _anchored_masks(5)
    anchored_7 = _anchored_masks(7)
    if len(anchored_5) != EXPECTED_PENTATONICS:
        raise HypergraphBuildError("pentatonic_universe_count_mismatch")
    if len(anchored_7) != EXPECTED_HEPTATONICS:
        raise HypergraphBuildError("heptatonic_universe_count_mismatch")

    nodes_5 = _build_nodes(anchored_5, forte_index[5], genera[5], None)
    nodes_7 = _build_nodes(anchored_7, forte_index[7], genera[7], ledger_orientation)

    if len({_tn_key(mask) for mask in _all_masks(5)}) != EXPECTED_TN_CLASSES:
        raise HypergraphBuildError("pentatonic_tn_class_count_mismatch")
    if len({_tn_key(mask) for mask in _all_masks(7)}) != EXPECTED_TN_CLASSES:
        raise HypergraphBuildError("heptatonic_tn_class_count_mismatch")

    parents_rooted: dict[int, list[int]] = {}
    for mask_5 in anchored_5:
        parents_rooted[mask_5] = [
            mask_7 for mask_7 in anchored_7 if mask_5 & mask_7 == mask_5
        ]

    pentatonic_subnodes: dict[str, dict[str, Any]] = {}
    for mask_5 in anchored_5:
        node = nodes_5[mask_5]
        parent_classes = sorted(
            {nodes_7[mask_7]["setClassId"] for mask_7 in parents_rooted[mask_5]}
        )
        is_cornerstone = node["setClassId"] == CORNERSTONE_CLASS
        is_bridge = (
            not is_cornerstone
            and DIATONIC_CLASS in parent_classes
            and any(
                set_class != DIATONIC_CLASS for set_class in parent_classes
            )
        )
        pentatonic_subnodes[node["id"]] = {
            **_node_payload(node, mask_5),
            "isCornerstone": is_cornerstone,
            "isBridge": is_bridge,
            "parentsRooted": sorted(nodes_7[mask_7]["id"] for mask_7 in parents_rooted[mask_5]),
            "parentsUnrooted": parent_classes,
        }

    heptatonic_nodes: dict[str, dict[str, Any]] = {}
    for mask_7 in anchored_7:
        node = nodes_7[mask_7]
        subsets = _subset_masks(mask_7, 5)
        anchored_subsets = [mask for mask in subsets if mask in nodes_5]
        if len(subsets) != EXPECTED_TOTAL_SUBSETS_PER_HEPTATONIC:
            raise HypergraphBuildError("heptatonic_subset_count_mismatch")
        if len(anchored_subsets) != EXPECTED_SUBNODES_PER_HEPTATONIC:
            raise HypergraphBuildError("anchored_subset_count_mismatch")
        cornerstones = [
            mask
            for mask in subsets
            if forte_index[5][compute_prime_form(mask)] == CORNERSTONE_CLASS
        ]
        heptatonic_nodes[node["id"]] = {
            **_node_payload(node, mask_7),
            "subnodes": sorted(nodes_5[mask]["id"] for mask in anchored_subsets),
            "cornerstoneCountRooted": sum(1 for mask in cornerstones if mask & 1),
            "cornerstoneCountUnrooted": len(cornerstones),
        }

    bridge_nodes = [node for node in pentatonic_subnodes.values() if node["isBridge"]]
    bridge_census = {
        "totalBridgeSubnodes": len(bridge_nodes),
        "bySetClass": dict(
            sorted(Counter(node["setClassId"] for node in bridge_nodes).items())
        ),
    }

    orbit_span_total = sum(
        1
        for mask_5 in anchored_5
        if len({nodes_7[mask_7]["tnOrbit"] for mask_7 in parents_rooted[mask_5]}) > 1
    )

    source_bindings = [
        {
            "path": PENTATONIC_REGISTRY_PATH,
            "sha256": _sha256_file(root / PENTATONIC_REGISTRY_PATH),
        },
        {
            "path": HEPTATONIC_LEDGER_PATH,
            "sha256": _sha256_file(root / HEPTATONIC_LEDGER_PATH),
        },
    ]

    document = {
        "status": STATUS,
        "schemaVersion": SCHEMA_VERSION,
        "generator": GENERATOR_PATH,
        "sourceBindings": source_bindings,
        "metadata": {
            "totalRootedPentatonics": len(pentatonic_subnodes),
            "totalRootedHeptatonics": len(heptatonic_nodes),
            "totalTnClasses": EXPECTED_TN_CLASSES,
            "totalTnIClassesPerSide": EXPECTED_TNI_CLASSES,
            "universeDefinition": (
                "All 12-bit pitch-class sets of cardinality 5 (330) and 7 (462) that "
                "contain pc 0; node IDs are {forteTnI}:{root} with orientation-B nodes "
                "suffixed B. pitchClasses are listed in rooted order from root."
            ),
            "rootConvention": (
                "root is the canonical scale root of the concrete set (Ionian 7-35, "
                "harmonic minor orientation-A 7-32, major pentatonic 5-35, "
                "lexicographically minimal orbit representative otherwise); tonic is "
                "mode context and is distinct from collection root."
            ),
            "bridgeDefinition": (
                "isBridge = non-cornerstone with at least one anchored 7-35 parent and "
                "at least one anchored non-7-35 parent (multi-family junction)."
            ),
            "orbitSpanParentageTotal": orbit_span_total,
            "bridgeCensus": bridge_census,
        },
        "pentatonicSubnodes": dict(sorted(pentatonic_subnodes.items())),
        "heptatonicNodes": dict(sorted(heptatonic_nodes.items())),
    }
    _self_validate(document)
    return document


def _self_validate(document: dict[str, Any]) -> None:
    metadata = document["metadata"]
    pentatonic = document["pentatonicSubnodes"]
    heptatonic = document["heptatonicNodes"]

    if len(pentatonic) != EXPECTED_PENTATONICS:
        raise HypergraphBuildError("self_validate_pentatonic_count")
    if len(heptatonic) != EXPECTED_HEPTATONICS:
        raise HypergraphBuildError("self_validate_heptatonic_count")
    if metadata["totalTnClasses"] != EXPECTED_TN_CLASSES:
        raise HypergraphBuildError("self_validate_tn_class_count")
    if len({node["setClassId"] for node in pentatonic.values()}) != EXPECTED_TNI_CLASSES:
        raise HypergraphBuildError("self_validate_pentatonic_class_count")
    if len({node["setClassId"] for node in heptatonic.values()}) != EXPECTED_TNI_CLASSES:
        raise HypergraphBuildError("self_validate_heptatonic_class_count")

    census = metadata["bridgeCensus"]
    if census["totalBridgeSubnodes"] <= 0:
        raise HypergraphBuildError("self_validate_empty_bridge_census")
    for set_class in ADMITTED_BRIDGE_CLASSES:
        if set_class not in census["bySetClass"]:
            raise HypergraphBuildError(f"self_validate_bridge_missing:{set_class}")

    ionian = heptatonic["7-35:0"]
    if ionian["pitchClasses"] != [0, 2, 4, 5, 7, 9, 11]:
        raise HypergraphBuildError("self_validate_ionian_pitch_classes")
    if ionian["cornerstoneCountRooted"] != 2:
        raise HypergraphBuildError("self_validate_ionian_rooted_kernels")
    if ionian["cornerstoneCountUnrooted"] != 3:
        raise HypergraphBuildError("self_validate_ionian_unrooted_kernels")

    harmonic_minor = heptatonic["7-32:9"]
    if harmonic_minor["pitchClasses"] != [9, 11, 0, 2, 4, 5, 8]:
        raise HypergraphBuildError("self_validate_harmonic_minor_pitch_classes")
    if harmonic_minor["cornerstoneCountRooted"] != 0:
        raise HypergraphBuildError("self_validate_harmonic_minor_rooted_kernels")
    if harmonic_minor["cornerstoneCountUnrooted"] != 0:
        raise HypergraphBuildError("self_validate_harmonic_minor_unrooted_kernels")

    bridge_expectations = {
        "5-23:9": [9, 11, 0, 2, 4],
        "5-27:9": [9, 0, 2, 4, 5],
    }
    for node_id, expected_pitches in bridge_expectations.items():
        node = pentatonic[node_id]
        if node["pitchClasses"] != expected_pitches:
            raise HypergraphBuildError(f"self_validate_bridge_pitches:{node_id}")
        if "7-35:0" not in node["parentsRooted"] or "7-32:9" not in node["parentsRooted"]:
            raise HypergraphBuildError(f"self_validate_bridge_parentage:{node_id}")

    distribution_5 = Counter(
        sum(1 for parent in node["parentsRooted"] if parent.startswith("7-35:"))
        for node in pentatonic.values()
    )
    if dict(sorted(distribution_5.items())) != EXPECTED_5_TO_7_35_DISTRIBUTION:
        raise HypergraphBuildError("self_validate_5_to_7_35_distribution")

    distribution_7 = Counter(
        node["cornerstoneCountRooted"] for node in heptatonic.values()
    )
    if dict(sorted(distribution_7.items())) != EXPECTED_7_SIDE_KERNEL_DISTRIBUTION:
        raise HypergraphBuildError("self_validate_7_side_kernel_distribution")

    if census["totalBridgeSubnodes"] != sum(EXPECTED_BRIDGE_CENSUS.values()):
        raise HypergraphBuildError("self_validate_bridge_census_total")
    if census["bySetClass"] != EXPECTED_BRIDGE_CENSUS:
        raise HypergraphBuildError("self_validate_bridge_census_breakdown")
    if metadata["orbitSpanParentageTotal"] != EXPECTED_ORBIT_SPAN_TOTAL:
        raise HypergraphBuildError("self_validate_orbit_span_total")


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
                "bridgeCensus": document["metadata"]["bridgeCensus"],
                "orbitSpanParentageTotal": document["metadata"][
                    "orbitSpanParentageTotal"
                ],
                "output": output_label,
                "pentatonicSubnodes": len(document["pentatonicSubnodes"]),
                "heptatonicNodes": len(document["heptatonicNodes"]),
                "status": document["status"],
            },
            sort_keys=True,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
