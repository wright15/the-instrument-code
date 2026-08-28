"""Source-derived shadow-ladder planning evidence with no admission effect."""

from __future__ import annotations

from collections import defaultdict
import hashlib
import json
from pathlib import Path
from typing import Any, Mapping

from .hashing import canonical_json_bytes, sha256_payload


SCHEMA_VERSION = "fivefold-incubator.shadow-ladder.v0"
CANDIDATE_ID = "SHADOW_LADDER_v0"
FULL_MASK = (1 << 12) - 1
TIERS = ("A0", "A1", "A2")
FAMILIES = {"A0": "7-35", "A1": "7-34", "A2": "7-33"}

# Fifth positions: C(0), G(1), D(2), A(3), E(4), B(5), F#(6), C#(7), G#(8), D#(9), A#(10), F(11).
FIFTH_ORDER = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5]
FIFTH_POS = {pitch_class: index for index, pitch_class in enumerate(FIFTH_ORDER)}

SOURCE_BINDING_SPECS = (
    (
        "canonical-heptatonic-ledger",
        "canonical/universal-heptatonic-ledger.json",
        "authoritative_anchor_identity",
    ),
    (
        "canonical-network-data",
        "canonical/universal-network-data.json",
        "selected_construction_provenance",
    ),
    (
        "pentatonic-binding-audit",
        "canonical/pentatonic-binding-candidates/pentatonic-7-35-parent-audit-v1.json",
        "pentatonic_class_and_parent_census",
    ),
    (
        "court-rooted-positions",
        "seven-governors-court-substrate-v0.1.0/canonical/court-rooted-positions.json",
        "A1_court_window_cross_check",
    ),
    (
        "decision-ledger",
        "provenance/DECISION_LEDGER.md",
        "release_boundary_context",
    ),
    (
        "observation-ledger",
        "provenance/OBSERVATION_LEDGER.md",
        "derived_observation_context",
    ),
)


class ShadowLadderError(ValueError):
    """Raised when canonical shadow-ladder inputs are inconsistent."""


def _read_json(path: Path) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        raise ShadowLadderError(f"invalid_json_source:{path}") from error


def _sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _mask(value: Any, label: str) -> int:
    if not isinstance(value, int) or isinstance(value, bool) or not 0 < value <= FULL_MASK:
        raise ShadowLadderError(f"invalid_mask:{label}")
    return value


def _hamming(left: int, right: int) -> int:
    return (left ^ right).bit_count()


def transpose_mask(mask: int, semitones: int) -> int:
    """Transpose a 12-bit pitch-class mask by ``semitones``."""
    mask = _mask(mask, "transpose")
    semitones %= 12
    return ((mask << semitones) | (mask >> (12 - semitones))) & FULL_MASK


def complement_mask(mask: int) -> int:
    """Return the 12-tone complement of a pitch-class mask."""
    return FULL_MASK ^ _mask(mask, "complement")


def inversion_mask(mask: int) -> int:
    """Invert a pitch-class mask about pitch class zero."""
    return sum(1 << ((-pitch_class) % 12) for pitch_class in mask_pitch_classes(mask))


def is_achiral(mask: int) -> bool:
    inverted = inversion_mask(mask)
    return any(transpose_mask(inverted, shift) == mask for shift in range(12))


def mask_pitch_classes(mask: int) -> list[int]:
    """Return the pitch classes present in a 12-bit mask."""
    return [pitch_class for pitch_class in range(12) if _mask(mask, "pitch_classes") & (1 << pitch_class)]


def fifth_span(pitch_classes: list[int]) -> int:
    """Return the minimal fifth-space covering arc: 12 minus its largest gap."""
    positions = sorted(FIFTH_POS[pitch_class] for pitch_class in pitch_classes)
    if not positions or len(set(positions)) != len(positions):
        raise ShadowLadderError("invalid_fifth_position_set")
    gaps = [
        (positions[(index + 1) % len(positions)] - positions[index]) % 12
        for index in range(len(positions))
    ]
    return 12 - max(gaps)


def fifth_arc(pitch_classes: list[int]) -> str:
    """Return the minimal fifth-space arc as ``[start,end]``."""
    positions = sorted(FIFTH_POS[pitch_class] for pitch_class in pitch_classes)
    if not positions or len(set(positions)) != len(positions):
        raise ShadowLadderError("invalid_fifth_position_set")
    gaps = [
        (positions[(index + 1) % len(positions)] - positions[index]) % 12
        for index in range(len(positions))
    ]
    largest_gap = max(range(len(gaps)), key=gaps.__getitem__)
    return f"[{positions[(largest_gap + 1) % len(positions)]},{positions[largest_gap]}]"


def arc_positions(arc: str) -> list[int]:
    try:
        start_text, end_text = arc.removeprefix("[").removesuffix("]").split(",")
        start, end = int(start_text), int(end_text)
    except (AttributeError, TypeError, ValueError) as error:
        raise ShadowLadderError(f"invalid_fifth_arc:{arc}") from error
    if not 0 <= start < 12 or not 0 <= end < 12:
        raise ShadowLadderError(f"invalid_fifth_arc:{arc}")
    positions = [start]
    while positions[-1] != end:
        positions.append((positions[-1] + 1) % 12)
    return positions


def _geometry(mask: int) -> dict[str, Any]:
    pitch_classes = mask_pitch_classes(mask)
    positions = {FIFTH_POS[pitch_class] for pitch_class in pitch_classes}
    arc = fifth_arc(pitch_classes)
    coverage = arc_positions(arc)
    return {
        "arc": arc,
        "coverage": coverage,
        "holes": [position for position in coverage if position not in positions],
        "positions": [position for position in coverage if position in positions],
        "span": fifth_span(pitch_classes),
    }


def _source_paths(root: Path) -> dict[str, Path]:
    return {
        binding_id: root / relative_path
        for binding_id, relative_path, _ in SOURCE_BINDING_SPECS
    }


def _office_order(network: Any) -> tuple[str, ...]:
    if not isinstance(network, Mapping):
        raise ShadowLadderError("network_source_must_be_object")
    office_order = network.get("officeOrder")
    if (
        not isinstance(office_order, list)
        or len(office_order) != 7
        or len(set(office_order)) != 7
        or any(not isinstance(office, str) or not office for office in office_order)
    ):
        raise ShadowLadderError("invalid_network_office_order")
    return tuple(office_order)


def _anchors(
    ledger: Any, office_order: tuple[str, ...]
) -> tuple[dict[int, dict[str, Any]], dict[tuple[str, str], dict[str, Any]]]:
    if not isinstance(ledger, list):
        raise ShadowLadderError("ledger_source_must_be_array")
    office_index = {office: index for index, office in enumerate(office_order)}
    by_id: dict[int, dict[str, Any]] = {}
    by_tier_office: dict[tuple[str, str], dict[str, Any]] = {}
    for raw in ledger:
        if not isinstance(raw, Mapping) or raw.get("role") != "anchor" or raw.get("tier") not in TIERS:
            continue
        mask = _mask(raw.get("id"), "ledger_anchor")
        tier = raw["tier"]
        office = raw.get("office")
        if (
            office not in office_index
            or raw.get("officeIndex") != office_index[office]
            or raw.get("forte") != FAMILIES[tier]
            or raw.get("chirality") != "achiral"
            or mask.bit_count() != 7
            or not isinstance(raw.get("name"), str)
            or not raw["name"]
        ):
            raise ShadowLadderError(f"invalid_anchor_identity:{mask}")
        if mask in by_id or (tier, office) in by_tier_office:
            raise ShadowLadderError(f"duplicate_anchor_identity:{mask}")
        anchor = {
            "id": mask,
            "name": raw["name"],
            "tier": tier,
            "office": office,
            "officeIndex": office_index[office],
            "forte": raw["forte"],
        }
        by_id[mask] = anchor
        by_tier_office[tier, office] = anchor
    for tier in TIERS:
        tier_anchors = [by_tier_office.get((tier, office)) for office in office_order]
        if any(anchor is None for anchor in tier_anchors):
            raise ShadowLadderError(f"incomplete_anchor_office_coverage:{tier}")
    return by_id, by_tier_office


def _neighbors(office_order: tuple[str, ...], office: str) -> tuple[str, str]:
    index = office_order.index(office)
    return office_order[(index - 1) % len(office_order)], office_order[(index + 1) % len(office_order)]


def _construction_groups(
    network: Any,
    anchors_by_id: Mapping[int, Mapping[str, Any]],
    anchors_by_tier_office: Mapping[tuple[str, str], Mapping[str, Any]],
    office_order: tuple[str, ...],
) -> dict[tuple[str, str], dict[str, Any]]:
    if not isinstance(network, Mapping) or not isinstance(network.get("structuralEdges"), list):
        raise ShadowLadderError("network_missing_structural_edges")
    targets = {
        anchor["id"]
        for (tier, _), anchor in anchors_by_tier_office.items()
        if tier in {"A1", "A2"}
    }
    incoming: dict[int, list[Mapping[str, Any]]] = defaultdict(list)
    for edge in network["structuralEdges"]:
        if isinstance(edge, Mapping) and edge.get("type") == "CONSTRUCTS" and edge.get("target") in targets:
            incoming[edge["target"]].append(edge)

    groups: dict[tuple[str, str], dict[str, Any]] = {}
    for tier in ("A1", "A2"):
        parent_tier = "A0" if tier == "A1" else "A1"
        for office in office_order:
            target = anchors_by_tier_office[tier, office]
            edges = incoming.get(target["id"], [])
            if len(edges) != 2:
                raise ShadowLadderError(f"construction_edge_count_mismatch:{target['id']}")
            left_office, right_office = _neighbors(office_order, office)
            by_office: dict[str, Mapping[str, Any]] = {}
            for edge in edges:
                edge_id = edge.get("id")
                parent_id = edge.get("source")
                parent = anchors_by_id.get(parent_id)
                if (
                    not isinstance(edge_id, str)
                    or not edge_id.startswith("constructs:")
                    or edge.get("auditTier") != parent_tier
                    or edge.get("relationTier") != parent_tier
                    or edge.get("selected") is not True
                    or parent is None
                    or parent["tier"] != parent_tier
                    or parent["office"] in by_office
                ):
                    raise ShadowLadderError(f"invalid_construction_edge:{edge_id}")
                by_office[parent["office"]] = edge
            if set(by_office) != {left_office, right_office}:
                raise ShadowLadderError(f"construction_ring_neighbors_mismatch:{target['id']}")
            ordered_edges = (by_office[left_office], by_office[right_office])
            parents = tuple(anchors_by_id[edge["source"]] for edge in ordered_edges)
            distance = _hamming(parents[0]["id"], parents[1]["id"])
            expected_provenance = (
                "exact midpoint construction" if distance == 4 else "phase-seam construction"
            )
            if distance not in {4, 10} or any(
                edge.get("provenance") != expected_provenance for edge in ordered_edges
            ):
                raise ShadowLadderError(f"construction_geometry_mismatch:{target['id']}")
            groups[tier, office] = {
                "target": target,
                "parents": parents,
                "edges": ordered_edges,
                "distance": distance,
                "provenance": expected_provenance,
            }
    return groups


def _interior_record(group: Mapping[str, Any]) -> dict[str, Any]:
    target = group["target"]
    left, right = group["parents"]
    core = left["id"] & right["id"]
    geometry = _geometry(core)
    if core.bit_count() != 5 or core & target["id"] != core:
        raise ShadowLadderError(f"invalid_shadow_core:{target['id']}")
    record = {
        "tier": target["tier"],
        "office": target["office"],
        "coreMask": core,
        "fifthSpan": geometry["span"],
        "holes": len(geometry["holes"]),
        "fifthArc": geometry["arc"],
    }
    if target["tier"] == "A1":
        if (
            geometry["span"] != 4
            or geometry["holes"]
            or core != transpose_mask(complement_mask(right["id"]), 1)
            or core != transpose_mask(complement_mask(left["id"]), -1)
        ):
            raise ShadowLadderError(f"invalid_A1_shadow_identity:{target['id']}")
        return {**record, "fifthPositions": geometry["positions"]}

    parent_geometries = tuple(_geometry(parent["id"]) for parent in (left, right))
    punched = []
    for parent_geometry in parent_geometries:
        inside_holes = [
            position
            for position in geometry["coverage"]
            if position not in set(parent_geometry["positions"])
        ]
        if len(inside_holes) != 1:
            raise ShadowLadderError(f"invalid_A2_punch:{target['id']}")
        punched.append(inside_holes[0])
    if (
        geometry["span"] != 6
        or len(geometry["holes"]) != 2
        or set(punched) != set(geometry["holes"])
        or len(set(punched)) != 2
    ):
        raise ShadowLadderError(f"invalid_A2_shadow_identity:{target['id']}")
    return {
        **record,
        "parentArcs": [geometry["arc"] for geometry in parent_geometries],
        "punched": punched,
    }


def _audit_index(audit: Any) -> tuple[dict[int, Mapping[str, Any]], dict[str, Mapping[str, Any]]]:
    if not isinstance(audit, Mapping):
        raise ShadowLadderError("audit_source_must_be_object")
    records = audit.get("pitchSetRecords")
    summaries = audit.get("classSummaries")
    if not isinstance(records, list) or not isinstance(summaries, list):
        raise ShadowLadderError("audit_source_missing_census")
    by_mask: dict[int, Mapping[str, Any]] = {}
    for record in records:
        if not isinstance(record, Mapping):
            raise ShadowLadderError("invalid_audit_record")
        mask = _mask(record.get("pitchMask"), "audit")
        if mask in by_mask:
            raise ShadowLadderError(f"duplicate_audit_mask:{mask}")
        by_mask[mask] = record
    by_forte = {
        summary["forteNumber"]: summary
        for summary in summaries
        if isinstance(summary, Mapping) and isinstance(summary.get("forteNumber"), str)
    }
    return by_mask, by_forte


def _court_masks(court: Any) -> list[int]:
    if not isinstance(court, Mapping) or not isinstance(court.get("courtRootedPositions"), list):
        raise ShadowLadderError("court_source_missing_positions")
    positions = court["courtRootedPositions"]
    if len(positions) != 5:
        raise ShadowLadderError("court_position_count_mismatch")
    ordered = sorted(positions, key=lambda position: position.get("t5CycleIndex", -1))
    masks = []
    for index, position in enumerate(ordered):
        if (
            not isinstance(position, Mapping)
            or position.get("positionId") != f"C{index}"
            or position.get("setClassId") != "pentatonic:5-35"
            or position.get("t5CycleIndex") != index
        ):
            raise ShadowLadderError("invalid_court_position")
        mask = _mask(position.get("pitchMask"), "court")
        if mask.bit_count() != 5 or _geometry(mask)["span"] != 4:
            raise ShadowLadderError("invalid_court_window")
        masks.append(mask)
    return masks


def _source_bindings(paths: Mapping[str, Path]) -> dict[str, str]:
    hashes = {binding_id: _sha(paths[binding_id]) for binding_id, _, _ in SOURCE_BINDING_SPECS}
    return {
        "canonicalLedgerSha256": hashes["canonical-heptatonic-ledger"],
        "networkFingerprint": hashes["canonical-network-data"],
        "constructionEdgesFingerprint": hashes["canonical-network-data"],
        "auditFingerprint": hashes["pentatonic-binding-audit"],
        "courtRootedPositionsSha256": hashes["court-rooted-positions"],
        "decisionLedgerSha256": hashes["decision-ledger"],
        "observationLedgerSha256": hashes["observation-ledger"],
    }


def derive_shadow_ladder_model(*, root: Path, reverse_input: bool = False) -> dict[str, Any]:
    """Derive the complete shadow evidence model from frozen canonical sources."""
    paths = _source_paths(root)
    ledger = _read_json(paths["canonical-heptatonic-ledger"])
    network = _read_json(paths["canonical-network-data"])
    audit = _read_json(paths["pentatonic-binding-audit"])
    court = _read_json(paths["court-rooted-positions"])
    if reverse_input:
        if not isinstance(ledger, list) or not isinstance(network, Mapping):
            raise ShadowLadderError("invalid_reverse_input")
        ledger = list(reversed(ledger))
        structural_edges = network.get("structuralEdges")
        if not isinstance(structural_edges, list):
            raise ShadowLadderError("network_missing_structural_edges")
        network = {**network, "structuralEdges": list(reversed(structural_edges))}

    office_order = _office_order(network)
    anchors_by_id, anchors_by_tier_office = _anchors(ledger, office_order)
    groups = _construction_groups(network, anchors_by_id, anchors_by_tier_office, office_order)
    a1_interiors = [groups["A1", office] for office in office_order if groups["A1", office]["distance"] == 4]
    a2_interiors = [groups["A2", office] for office in office_order if groups["A2", office]["distance"] == 4]
    a1_seams = [groups["A1", office] for office in office_order if groups["A1", office]["distance"] == 10]
    a2_seams = [groups["A2", office] for office in office_order if groups["A2", office]["distance"] == 10]
    if len(a1_interiors) != 5 or len(a2_interiors) != 5 or len(a1_seams) != 2 or len(a2_seams) != 2:
        raise ShadowLadderError("unexpected_midpoint_seam_census")

    a1_records = [_interior_record(group) for group in a1_interiors]
    a2_records = [_interior_record(group) for group in a2_interiors]
    a1_cores = [record["coreMask"] for record in a1_records]
    a2_cores = [record["coreMask"] for record in a2_records]
    court_masks = _court_masks(court)
    if a1_cores != court_masks or not all(
        transpose_mask(a1_cores[index], 5) == a1_cores[index + 1]
        for index in range(len(a1_cores) - 1)
    ):
        raise ShadowLadderError("A1_court_alignment_mismatch")

    a0_by_office = {office: anchors_by_tier_office["A0", office] for office in office_order}
    if not all(
        record["coreMask"] & a0_by_office[record["office"]]["id"] == record["coreMask"]
        for record in a2_records
    ):
        raise ShadowLadderError("A2_self_office_subset_mismatch")

    def twins(group: Mapping[str, Any]) -> bool:
        left, right = group["parents"]
        return transpose_mask(left["id"], 1) == right["id"] or transpose_mask(right["id"], 1) == left["id"]

    if not all(twins(group) for group in [*a1_seams, *a2_seams]):
        raise ShadowLadderError("seam_twin_mismatch")
    seam_offices = [
        sorted(group["target"]["officeIndex"] for group in a1_seams),
        sorted(group["target"]["officeIndex"] for group in a2_seams),
        [2, 4],
    ]
    if seam_offices != [[0, 6], [1, 5], [2, 4]]:
        raise ShadowLadderError("seam_inward_chain_mismatch")

    a2_pair_distances = []
    for office in office_order:
        left_office, right_office = _neighbors(office_order, office)
        left = anchors_by_tier_office["A2", left_office]["id"]
        right = anchors_by_tier_office["A2", right_office]["id"]
        a2_pair_distances.append({"office": office, "distance": _hamming(left, right), "shared": left & right})
    distance_counts = {distance: sum(item["distance"] == distance for item in a2_pair_distances) for distance in (2, 4, 10)}
    whole_tone_mask = sum(1 << pitch_class for pitch_class in range(0, 12, 2))
    if (
        distance_counts != {2: 5, 4: 0, 10: 2}
        or any(item["shared"] != whole_tone_mask for item in a2_pair_distances if item["distance"] == 2)
    ):
        raise ShadowLadderError("A3_termination_census_mismatch")

    audit_by_mask, audit_by_forte = _audit_index(audit)
    predicted_a3 = [
        transpose_mask(complement_mask(anchors_by_tier_office["A2", office]["id"]), 1)
        for office in office_order
    ]
    if not all(
        audit_by_mask.get(mask, {}).get("forteNumber") == "5-33"
        and audit_by_mask[mask].get("parentCount") == 0
        and audit_by_mask[mask].get("parentMasks") == []
        for mask in predicted_a3
    ):
        raise ShadowLadderError("A3_pentatonic_detachment_mismatch")
    if not all(forte in audit_by_forte for forte in ("5-34", "5-35", "5-33")):
        raise ShadowLadderError("missing_shadow_audit_classes")
    a1_audit = [audit_by_mask.get(mask, {}) for mask in a1_cores]
    a2_audit = [audit_by_mask.get(mask, {}) for mask in a2_cores]
    if (
        not all(record.get("forteNumber") == "5-35" and record.get("parentCount") == 3 for record in a1_audit)
        or not all(record.get("forteNumber") == "5-34" and record.get("parentCount") == 1 for record in a2_audit)
    ):
        raise ShadowLadderError("shadow_incidence_census_mismatch")
    one_parent_count = sum(record.get("parentCount") == 1 for record in audit_by_mask.values())
    if (
        audit_by_forte["5-35"].get("realizationCount") != 12
        or audit_by_forte["5-35"].get("parentCountPerRealization") != 3
        or audit_by_forte["5-34"].get("realizationCount") != 12
        or audit_by_forte["5-34"].get("parentCountPerRealization") != 1
        or audit_by_forte["5-33"].get("realizationCount") != 12
        or audit_by_forte["5-33"].get("parentCountPerRealization") != 0
        or one_parent_count != 120
    ):
        raise ShadowLadderError("shadow_class_summary_mismatch")
    all_shadow_masks = [*a1_cores, *a2_cores, *predicted_a3]
    if not all(is_achiral(mask) for mask in all_shadow_masks):
        raise ShadowLadderError("shadow_achirality_mismatch")

    return {
        "a1Records": a1_records,
        "a2Records": a2_records,
        "a1Interiors": a1_interiors,
        "a2Interiors": a2_interiors,
        "a1Seams": a1_seams,
        "a2Seams": a2_seams,
        "a2PairDistances": a2_pair_distances,
        "a2DistanceCounts": distance_counts,
        "a0ByOffice": a0_by_office,
        "courtMasks": court_masks,
        "predictedA3": predicted_a3,
        "auditByMask": audit_by_mask,
        "auditByForte": audit_by_forte,
        "oneParentCount": one_parent_count,
        "officeOrder": office_order,
        "wholeToneMask": whole_tone_mask,
        "sourceBindings": _source_bindings(paths),
    }


def build_shadow_ladder_candidate(*, root: Path, reverse_input: bool = False) -> dict[str, Any]:
    """Emit a deterministic, source-derived planning-evidence sidecar."""
    model = derive_shadow_ladder_model(root=root, reverse_input=reverse_input)
    a1_records = model["a1Records"]
    a2_records = model["a2Records"]
    distance_counts = model["a2DistanceCounts"]
    core_construction_count = len(a1_records) + len(a2_records)
    core_self_office_count = len(a2_records)
    core_535_incidence_count = sum(
        model["auditByMask"][record["coreMask"]]["parentCount"] for record in a1_records
    )
    core_534_incidence_count = sum(
        model["auditByMask"][record["coreMask"]]["parentCount"] for record in a2_records
    )
    core = {
        "schemaVersion": SCHEMA_VERSION,
        "candidateId": CANDIDATE_ID,
        "status": "planning_evidence",
        "scope": {
            "diatonicSetClass": "7-35",
            "shadowTiers": ["A1", "A2"],
            "A3": "termination proven, no A3",
            "tuning": "12-TET",
        },
        "method": {
            "fifthSpan": "minimal covering arc =12-largest cyclic gap",
            "holes": "span+1-cardinality",
            "Tn": "12-bit pitch-class rotation",
            "comp": "4095 ^ mask",
            "fifthOrder": FIFTH_ORDER,
        },
        "shadowLadder": [*a1_records, *a2_records],
        "courtAlignment": {
            "modeWindows": {
                "count": len(model["officeOrder"]),
                "verified": f"{len(model['officeOrder'])}/7",
                "windowSize": 7,
                "form": "mode(k)=[-k,6-k]",
            },
            "courtWindows": {
                "count": len(model["courtMasks"]),
                "verified": f"{len(model['courtMasks'])}/5",
                "windowSize": 5,
                "form": "C_j=[-j,4-j]",
            },
            "windowIntersection": {
                "verified": f"{len(a1_records)}/5",
                "theorem": "window(j) intersection window(j+d)=7-d; d=2 gives Court 5-35",
            },
        },
        "shadowRingGeometry": {
            "holePunching": {
                "verified": f"{len(a2_records)}/5",
                "description": "core(k,A2)=parent arcs intersection minus their inside holes",
            },
            "dHCensus": {
                "verified": f"{len(model['a2PairDistances'])}/7",
                "pairs": f"{distance_counts[2]}xdH2, {distance_counts[10]}xdH10, {distance_counts[4]}xdH4",
            },
            "hexachord": {
                "verified": f"{distance_counts[2]}/5",
                "WT": "{0,2,4,6,8,10}",
                "odd": "{1,3,5,7,9,11}",
                "neapolitan": "odd+{0}",
                "T1_swaps": all(
                    transpose_mask(group["parents"][0]["id"], 1) == group["parents"][1]["id"]
                    or transpose_mask(group["parents"][1]["id"], 1) == group["parents"][0]["id"]
                    for group in model["a2Seams"]
                ),
            },
            "seamTwins": {
                "verified": f"{len(model['a1Seams']) + len(model['a2Seams'])}/4",
                "perTier": len(model["a1Seams"]),
                "march": "{0,6}->{1,5}->{2,4}",
            },
            "spanME": {
                "fifthSpan4": "5-35",
                "fifthSpan6": "5-34",
                "fifthSpan8": "5-33",
                "holes": "span+1-5",
                "verified": "source-derived",
            },
        },
        "typedIncidences": {
            "coreConstructionPair": {
                "count": core_construction_count,
                "verified": f"{core_construction_count}/10 interior",
                "note": "core is the intersection of two source-selected parents",
            },
            "coreSelfOfficeDiatonic": {
                "count": core_self_office_count,
                "verified": f"{core_self_office_count}/5 interior",
                "note": "A2 core is a subset of the same-office A0 anchor",
            },
            "embeddingCensus": {
                "span4": f"{core_535_incidence_count}/36",
                "span6": f"{core_534_incidence_count}/{model['oneParentCount']}",
                "outOfCensus": f"{len(a2_records) * 2} edges (A2 to A1) outside 252",
            },
            "note": "Pentatonic parent counts are read from the detached audit; no topology is written.",
        },
        "evidenceBindings": model["sourceBindings"],
        "checks": {
            "total": 33,
            "groups": [
                "determinism 3",
                "operators 2",
                "span/ME 4",
                "court 3",
                "A1 2",
                "A2 3",
                "seam 3",
                "termination 4",
                "incidence 3",
                "guards 3",
                "achirality 1",
                "bindings 2",
            ],
        },
    }
    return {**core, "candidateFingerprint": sha256_payload(core)}


def serialize_candidate(document: Mapping[str, Any]) -> bytes:
    return canonical_json_bytes(document)


def verify_candidate(document: Mapping[str, Any], *, root: Path) -> None:
    fingerprint = document.get("candidateFingerprint")
    core = {key: value for key, value in document.items() if key != "candidateFingerprint"}
    if fingerprint != sha256_payload(core):
        raise ShadowLadderError("candidate_fingerprint_mismatch")
    expected = build_shadow_ladder_candidate(root=root)
    if canonical_json_bytes(document) != canonical_json_bytes(expected):
        raise ShadowLadderError("candidate_does_not_match_source_derivation")
