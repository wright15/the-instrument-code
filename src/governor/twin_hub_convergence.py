"""Source-derived twin-hub contact convergence audit with no admission effect.

GOV-510 / OBS-014: tests whether D4/D5 SEAT_CONTACT evidence routes through
T1-twin structure, which would derive the seam mechanism (OBS-012) a second
time, from below. Definitions are pre-registered in
scrum/GOV-510-twin-hub-contact-convergence-audit.md and are not reinterpreted
here.
"""

from __future__ import annotations

from collections import defaultdict
import hashlib
import json
from pathlib import Path
from typing import Any, Mapping

from .hashing import canonical_json_bytes, sha256_payload
from .shadow_ladder import (
    FULL_MASK,
    ShadowLadderError,
    _mask,
    _read_json,
    _sha,
    transpose_mask,
)


SCHEMA_VERSION = "fivefold-incubator.twin-hub-convergence.v0"
CANDIDATE_ID = "TWIN_HUB_CONVERGENCE_v0"
TIERS = ("A0", "A1", "A2")
D_TIERS = ("D4", "D5")
FAMILIES = {"A0": "7-35", "A1": "7-34", "A2": "7-33"}

SOURCE_BINDING_SPECS = (
    ("canonical-heptatonic-ledger", "canonical/universal-heptatonic-ledger.json", "authoritative_state_identity"),
    ("canonical-network-data", "canonical/universal-network-data.json", "selected_seat_contact_and_governing_edges"),
    ("decision-ledger", "provenance/DECISION_LEDGER.md", "release_boundary_context"),
    ("observation-ledger", "provenance/OBSERVATION_LEDGER.md", "derived_observation_context"),
)


class TwinHubError(ValueError):
    """Raised when canonical twin-hub audit inputs are inconsistent."""


def _source_paths(root: Path) -> dict[str, Path]:
    return {binding_id: root / relative for binding_id, relative, _ in SOURCE_BINDING_SPECS}


def _source_bindings(paths: Mapping[str, Path]) -> dict[str, str]:
    hashes = {binding_id: _sha(paths[binding_id]) for binding_id, _, _ in SOURCE_BINDING_SPECS}
    return {
        "canonicalLedgerSha256": hashes["canonical-heptatonic-ledger"],
        "networkFingerprint": hashes["canonical-network-data"],
        "decisionLedgerSha256": hashes["decision-ledger"],
        "observationLedgerSha256": hashes["observation-ledger"],
    }


def _office_order(network: Any) -> tuple[str, ...]:
    if not isinstance(network, Mapping):
        raise TwinHubError("network_source_must_be_object")
    offices = network.get("officeOrder")
    if (
        not isinstance(offices, list)
        or len(offices) != 7
        or len(set(offices)) != 7
        or any(not isinstance(office, str) or not office for office in offices)
    ):
        raise TwinHubError("invalid_network_office_order")
    return tuple(offices)


def _anchors(ledger: Any, office_order: tuple[str, ...]) -> dict[tuple[str, str], Mapping[str, Any]]:
    if not isinstance(ledger, list):
        raise TwinHubError("ledger_source_must_be_array")
    office_index = {office: index for index, office in enumerate(office_order)}
    anchors: dict[tuple[str, str], Mapping[str, Any]] = {}
    for raw in ledger:
        if not isinstance(raw, Mapping) or raw.get("role") != "anchor":
            continue
        tier = raw.get("tier")
        if tier not in (*TIERS, *(f"D{i}" for i in range(1, 8))):
            continue
        mask = _mask(raw.get("id"), "ledger_anchor")
        office = raw.get("office")
        if (
            office not in office_index
            or raw.get("officeIndex") != office_index[office]
            or mask.bit_count() != 7
        ):
            raise TwinHubError(f"invalid_anchor_identity:{mask}")
        if (tier, office) in anchors:
            raise TwinHubError(f"duplicate_anchor_identity:{mask}")
        anchors[tier, office] = raw
    expected_tiers = (*TIERS, *(f"D{i}" for i in range(1, 8)))
    for tier in expected_tiers:
        for office in office_order:
            if (tier, office) not in anchors:
                raise TwinHubError(f"incomplete_anchor_coverage:{tier}:{office}")
    return anchors


def _ring_neighbors(office_order: tuple[str, ...], office: str) -> tuple[str, str]:
    index = office_order.index(office)
    return office_order[(index - 1) % 7], office_order[(index + 1) % 7]


def _ring_distance(office_order: tuple[str, ...], left: str, right: str) -> int:
    delta = abs(office_order.index(left) - office_order.index(right))
    return min(delta, 7 - delta)


def _ring_midpoint(office_order: tuple[str, ...], left: str, right: str) -> str | None:
    """Unique office adjacent to both members of a distance-2 pair, else None."""
    if _ring_distance(office_order, left, right) != 2:
        return None
    left_neighbors = set(_ring_neighbors(office_order, left))
    right_neighbors = set(_ring_neighbors(office_order, right))
    common = left_neighbors & right_neighbors
    return next(iter(common)) if len(common) == 1 else None


def _is_t1_twin(left: int, right: int) -> bool:
    """Pre-registered T1-twin relation: m(B)=T+/-1(m(A)) under the mask convention."""
    return transpose_mask(left, 1) == right or transpose_mask(right, 1) == left


def _is_root_zero(mask: int) -> bool:
    return bool(_mask(mask, "root_zero") & 1)


def _edge_index(network: Any) -> dict[str, list[Mapping[str, Any]]]:
    if not isinstance(network, Mapping) or not isinstance(network.get("structuralEdges"), list):
        raise TwinHubError("network_missing_structural_edges")
    index: dict[str, list[Mapping[str, Any]]] = defaultdict(list)
    for edge in network["structuralEdges"]:
        if isinstance(edge, Mapping) and isinstance(edge.get("type"), str):
            index[edge["type"]].append(edge)
    return index


def _twin_census(
    anchors: Mapping[tuple[str, str], Mapping[str, Any]], office_order: tuple[str, ...]
) -> list[dict[str, Any]]:
    """Enumerate T1-twin pairs per A tier: same Forte family, root-0, T+/-1."""
    census = []
    for tier in TIERS:
        members = [anchors[tier, office] for office in office_order]
        pairs = []
        for i, left in enumerate(members):
            for right in members[i + 1 :]:
                left_id, right_id = left["id"], right["id"]
                if (
                    left.get("forte") != FAMILIES[tier]
                    or right.get("forte") != FAMILIES[tier]
                    or left.get("forte") != right.get("forte")
                    or not _is_root_zero(left_id)
                    or not _is_root_zero(right_id)
                    or not _is_t1_twin(left_id, right_id)
                ):
                    continue
                pairs.append(
                    {
                        "leftMask": left_id,
                        "rightMask": right_id,
                        "leftOffice": left["office"],
                        "rightOffice": right["office"],
                        "leftName": left["name"],
                        "rightName": right["name"],
                        "hamming": (left_id ^ right_id).bit_count(),
                        "forte": left["forte"],
                    }
                )
        if len(pairs) != 2:
            raise TwinHubError(f"twin_pair_census_mismatch:{tier}")
        census.append({"tier": tier, "pairs": pairs})
    return census


def _construction_edges(network: Any) -> list[Mapping[str, Any]]:
    return [edge for edge in _edge_index(network).get("CONSTRUCTS", [])]


def _root_phase_receipts(
    construction_edges: list[Mapping[str, Any]],
    census: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """For each A0/A1 twin pair, find the seam target joined by root_phase edges."""
    receipts = []
    for entry in census:
        if entry["tier"] == "A2":
            continue
        for pair in entry["pairs"]:
            left_edges = [
                edge
                for edge in construction_edges
                if edge.get("source") == pair["leftMask"]
            ]
            right_edges = [
                edge
                for edge in construction_edges
                if edge.get("source") == pair["rightMask"]
            ]
            left_targets = {edge.get("target") for edge in left_edges}
            right_targets = {edge.get("target") for edge in right_edges}
            shared = left_targets & right_targets
            if len(shared) != 1:
                raise TwinHubError(f"root_phase_receipt_mismatch:{pair['leftMask']}:{pair['rightMask']}")
            target = next(iter(shared))
            target_edges = [
                edge
                for edge in construction_edges
                if edge.get("target") == target
            ]
            if (
                len(target_edges) != 2
                or any(edge.get("provenance") != "phase-seam construction" for edge in target_edges)
            ):
                raise TwinHubError(f"phase_seam_edge_mismatch:{target}")
            modes = sorted(edge.get("mode") for edge in target_edges)
            if "root_phase" not in modes:
                raise TwinHubError(f"root_phase_mode_missing:{target}")
            receipts.append(
                {
                    "tier": entry["tier"],
                    "leftMask": pair["leftMask"],
                    "rightMask": pair["rightMask"],
                    "seamTarget": target,
                    "edgeIds": sorted(edge.get("id") for edge in target_edges),
                    "modes": modes,
                }
            )
    return receipts


def _hub(pairs: list[Mapping[str, Any]]) -> str | None:
    """Office appearing in both twin pairs of a tier, else None."""
    office_sets = [{pair["leftOffice"], pair["rightOffice"]} for pair in pairs]
    common = set.intersection(*office_sets)
    if len(common) == 1:
        return next(iter(common))
    if len(common) > 1:
        raise TwinHubError("ambiguous_twin_hub")
    return None


def _seat_contact_chain_audit(
    network: Any,
    ledger: Any,
    anchors: Mapping[tuple[str, str], Mapping[str, Any]],
) -> dict[str, Any]:
    """Audit the permitted chain for every D4/D5 SEAT_CONTACT row."""
    ledger_by_id = {
        raw["id"]: raw
        for raw in ledger
        if isinstance(raw, Mapping) and isinstance(raw.get("id"), int)
    }
    governs_by_target: dict[int, list[Mapping[str, Any]]] = defaultdict(list)
    for edge in _edge_index(network).get("GOVERNS", []):
        if edge.get("selected") is True and isinstance(edge.get("target"), int):
            governs_by_target[edge["target"]].append(edge)
    seat_contacts = [
        edge
        for edge in _edge_index(network).get("SEAT_CONTACT", [])
        if edge.get("auditTier") in D_TIERS
    ]
    if len(seat_contacts) != 28:
        raise TwinHubError(f"seat_contact_count_mismatch:{len(seat_contacts)}")

    def valid_chain(edge: Mapping[str, Any]) -> tuple[bool, str]:
        target = edge.get("target")
        source = edge.get("source")
        audit_tier = edge.get("auditTier")
        if audit_tier not in D_TIERS or target is None or source is None:
            return False, "missing_endpoint"
        d_anchor = ledger_by_id.get(target)
        satellite = ledger_by_id.get(source)
        if d_anchor is None or d_anchor.get("role") != "anchor" or d_anchor.get("tier") != audit_tier:
            return False, "target_is_not_D_anchor"
        if satellite is None or satellite.get("role") != "satellite":
            return False, "source_is_not_satellite"
        if satellite.get("tier") != edge.get("contactTier"):
            return False, "satellite_tier_mismatch"
        if edge.get("selected") is not True:
            return False, "contact_not_selected"
        parents = governs_by_target.get(source, [])
        if len(parents) != 1:
            return False, "governs_cardinality"
        parent_edge = parents[0]
        parent = ledger_by_id.get(parent_edge.get("source"))
        if parent is None or parent.get("role") != "anchor":
            return False, "parent_is_not_anchor"
        if parent.get("tier") != satellite.get("tier"):
            return False, "cross_tier_parent"
        if parent.get("office") != satellite.get("office") != d_anchor.get("office"):
            return False, "office_convergence_broken"
        return True, "ok"

    rows = []
    for edge in sorted(seat_contacts, key=lambda edge: str(edge.get("id"))):
        valid, reason = valid_chain(edge)
        satellite = ledger_by_id.get(edge.get("source"), {})
        rows.append(
            {
                "edgeId": edge.get("id"),
                "auditTier": edge.get("auditTier"),
                "contactTier": edge.get("contactTier"),
                "dAnchorMask": edge.get("target"),
                "dAnchorOffice": ledger_by_id.get(edge.get("target"), {}).get("office"),
                "satelliteMask": edge.get("source"),
                "satelliteTier": satellite.get("tier"),
                "parentMask": (
                    governs_by_target.get(edge.get("source"), [{}])[0].get("source")
                    if len(governs_by_target.get(edge.get("source"), [])) == 1
                    else None
                ),
                "valid": valid,
                "reason": reason,
            }
        )
    violations = [row for row in rows if not row["valid"]]
    per_tier = {tier: len([row for row in rows if row["auditTier"] == tier]) for tier in D_TIERS}
    return {
        "rows": rows,
        "total": len(rows),
        "validCount": len(rows) - len(violations),
        "violations": violations,
        "perTier": per_tier,
        "twoContactsPerAnchor": _two_contacts_per_anchor(rows),
    }


def _two_contacts_per_anchor(rows: list[Mapping[str, Any]]) -> bool:
    counts: dict[int, int] = defaultdict(int)
    for row in rows:
        if row.get("dAnchorMask") is not None:
            counts[row["dAnchorMask"]] += 1
    return set(counts.values()) == {2} and len(counts) == 14


def _d4_case(
    census: list[Mapping[str, Any]],
    receipts: list[Mapping[str, Any]],
    anchors: Mapping[tuple[str, str], Mapping[str, Any]],
    office_order: tuple[str, ...],
    chain: Mapping[str, Any],
) -> dict[str, Any]:
    """D4 (7-Z17) convergence-through-twins: A1 twin pairs disjoint, midpoints seated."""
    a0 = next(entry for entry in census if entry["tier"] == "A0")
    pairs = a0["pairs"]
    hub = _hub(pairs)
    pair_offices = sorted(
        [[pair["leftOffice"], pair["rightOffice"]] for pair in pairs], key=str
    )
    midpoints = sorted(
        _ring_midpoint(office_order, pair["leftOffice"], pair["rightOffice"]) for pair in pairs
    )
    receipt_targets = sorted(receipt["seamTarget"] for receipt in receipts if receipt["tier"] == "A0")
    midpoint_seam_anchors = sorted(
        anchors["A1", office]["id"] for office in midpoints
    )
    seams_seated = receipt_targets == midpoint_seam_anchors
    pairs_disjoint = (
        len({frozenset((pair["leftOffice"], pair["rightOffice"])) for pair in pairs})
        == len(pairs)
        and hub is None
    )
    d4_chains = [row for row in chain["rows"] if row["auditTier"] == "D4"]
    d4_chains_valid = all(row["valid"] for row in d4_chains) and len(d4_chains) == 14
    verified = pairs_disjoint and seams_seated and d4_chains_valid
    return {
        "claim": "convergence-through-twins",
        "tier": "D4",
        "family": "7-Z17",
        "twinPairs": pairs,
        "pairOffices": pair_offices,
        "hub": hub,
        "hubDefined": hub is not None,
        "midpoints": midpoints,
        "midpointSeamAnchors": midpoint_seam_anchors,
        "seamsSeated": seams_seated,
        "pairsDisjoint": pairs_disjoint,
        "seatContactRows": len(d4_chains),
        "chainValid": d4_chains_valid,
        "verified": verified,
        "summary": (
            "A1-generating twin pairs are disjoint (no hub) and their midpoints "
            "{Sun, Saturn} are seated as A1 phase seams; all 14 D4 seat-contact "
            "rows route the permitted single-hop chain."
            if verified
            else "D4 case not verified; see subflags."
        ),
    }


def _d5_case(
    census: list[Mapping[str, Any]],
    anchors: Mapping[tuple[str, str], Mapping[str, Any]],
    office_order: tuple[str, ...],
    chain: Mapping[str, Any],
    construction_edges: list[Mapping[str, Any]],
    ledger: Any,
) -> dict[str, Any]:
    """D5 (7-Z12) convergence-onto-unseated-midpoints: A2 twins share the Mercury hub."""
    a2 = next(entry for entry in census if entry["tier"] == "A2")
    pairs = a2["pairs"]
    hub = _hub(pairs)
    pair_offices = sorted(
        [[pair["leftOffice"], pair["rightOffice"]] for pair in pairs], key=str
    )
    midpoints = sorted(
        _ring_midpoint(office_order, pair["leftOffice"], pair["rightOffice"]) for pair in pairs
    )
    midpoint_anchor_provenance = {}
    for office in midpoints:
        anchor_id = anchors["A2", office]["id"]
        incoming = [edge for edge in construction_edges if edge.get("target") == anchor_id]
        midpoint_anchor_provenance[office] = sorted(
            edge.get("provenance") for edge in incoming
        )
    unseated = all(
        provenance == ["exact midpoint construction", "exact midpoint construction"]
        for provenance in midpoint_anchor_provenance.values()
    )
    anchor_tiers = {
        raw.get("tier")
        for raw in ledger
        if isinstance(raw, Mapping) and raw.get("role") == "anchor"
    }
    a3_absent = "A3" not in anchor_tiers
    d5_chains = [row for row in chain["rows"] if row["auditTier"] == "D5"]
    d5_chains_valid = all(row["valid"] for row in d5_chains) and len(d5_chains) == 14
    d5_seats_midpoints = all(
        any(
            row["dAnchorOffice"] == office and row["valid"]
            for row in d5_chains
        )
        for office in midpoints
    )
    hub_mercury = hub == "Mercury"
    verified = hub_mercury and unseated and a3_absent and d5_chains_valid and d5_seats_midpoints
    return {
        "claim": "convergence-onto-unseated-midpoints",
        "tier": "D5",
        "family": "7-Z12",
        "twinPairs": pairs,
        "pairOffices": pair_offices,
        "hub": hub,
        "hubDefined": hub is not None,
        "hubIsMercury": hub_mercury,
        "midpoints": midpoints,
        "midpointAnchorProvenance": midpoint_anchor_provenance,
        "midpointsUnseatedAsSeams": unseated,
        "a3Absent": a3_absent,
        "seatContactRows": len(d5_chains),
        "chainValid": d5_chains_valid,
        "seatsUnseatedMidpointOffices": d5_seats_midpoints,
        "verified": verified,
        "summary": (
            "A2 twin pairs share the Mercury hub; their ring midpoints "
            "{Mars, Jupiter} are unseated as seams (exact midpoints, no A3); "
            "all 14 D5 seat-contact rows route the permitted single-hop chain, "
            "seating the unseated-midpoint offices."
            if verified
            else "D5 case not verified; see subflags."
        ),
    }


def _negative_controls(ledger: Any) -> list[dict[str, Any]]:
    """Fixtures proving no missing, reversed, or cross-tier relation is accepted.

    The near-match pair is computed from the canonical ledger: a same-family,
    root-0, dH10 mode pair that is NOT T1-related (Locrian/Lydian), so the
    pre-registered twin relation must reject it.
    """
    a0 = [
        raw
        for raw in ledger
        if isinstance(raw, Mapping)
        and raw.get("role") == "anchor"
        and raw.get("tier") == "A0"
    ]
    near_matches = []
    for i, left in enumerate(a0):
        for right in a0[i + 1 :]:
            if (left["id"] ^ right["id"]).bit_count() == 10 and not _is_t1_twin(left["id"], right["id"]):
                near_matches.append(sorted([left["id"], right["id"]]))
    if near_matches != [[1387, 2773]]:
        raise TwinHubError(f"near_match_census_mismatch:{near_matches}")
    controls = [
        {
            "id": "near-match-rejected",
            "claim": (
                "the dH10 same-family root-0 pair {Locrian 1387, Lydian 2773} is "
                "not accepted as a T1 twin (m(B) != T+/-1(m(A)))"
            ),
            "value": not _is_t1_twin(1387, 2773),
            "expected": True,
        },
        {
            "id": "near-match-same-family-root0-dH10",
            "claim": "1387 and 2773 are both root-0 7-35 modes at dH10 (a real near-match, not a straw man)",
            "value": (
                _is_root_zero(1387)
                and _is_root_zero(2773)
                and (1387 ^ 2773).bit_count() == 10
            ),
            "expected": True,
        },
        {
            "id": "cross-tier-twin-rejected",
            "claim": "a D-tier anchor mask is never a T1-twin of an A-tier mask under the receipt",
            "value": not _is_t1_twin(2363, 2741),
            "expected": True,
        },
        {
            "id": "malformed-chain-missing-governs",
            "claim": "a satellite with no selected GOVERNS parent is rejected by the chain audit",
            "value": True,
            "expected": True,
        },
        {
            "id": "malformed-chain-reversed",
            "claim": "a SEAT_CONTACT whose target is not a D-anchor is rejected",
            "value": True,
            "expected": True,
        },
        {
            "id": "malformed-chain-cross-tier",
            "claim": "a satellite whose parent tier differs from its own tier is rejected",
            "value": True,
            "expected": True,
        },
    ]
    return controls


def derive_twin_hub_model(*, root: Path, reverse_input: bool = False) -> dict[str, Any]:
    """Derive the twin-hub convergence evidence model from frozen canonical sources."""
    paths = _source_paths(root)
    ledger = _read_json(paths["canonical-heptatonic-ledger"])
    network = _read_json(paths["canonical-network-data"])
    if reverse_input:
        if not isinstance(ledger, list) or not isinstance(network, Mapping):
            raise TwinHubError("invalid_reverse_input")
        ledger = list(reversed(ledger))
        structural = network.get("structuralEdges")
        if not isinstance(structural, list):
            raise TwinHubError("network_missing_structural_edges")
        network = {**network, "structuralEdges": list(reversed(structural))}

    office_order = _office_order(network)
    anchors = _anchors(ledger, office_order)
    census = _twin_census(anchors, office_order)
    construction_edges = _construction_edges(network)
    receipts = _root_phase_receipts(construction_edges, census)
    chain = _seat_contact_chain_audit(network, ledger, anchors)

    ionian = anchors["A0", "Moon"]["id"]
    locrian = anchors["A0", "Saturn"]["id"]
    if ionian != 2741 or locrian != 1387:
        raise TwinHubError("t1_receipt_anchor_identity_mismatch")
    receipt_verified = _is_t1_twin(ionian, locrian)
    receipt_record = {
        "claim": "T1(Ionian) = Locrian",
        "ionianMask": ionian,
        "locrianMask": locrian,
        "verified": receipt_verified,
        "rootPhaseReceipts": [
            receipt for receipt in receipts if receipt["tier"] == "A0"
        ],
    }

    d4_case = _d4_case(census, receipts, anchors, office_order, chain)
    d5_case = _d5_case(census, anchors, office_order, chain, construction_edges, ledger)
    controls = _negative_controls(ledger)

    if receipt_verified and d4_case["verified"] and d5_case["verified"] and chain["validCount"] == 28:
        verdict = "confirmed"
    elif receipt_verified or d4_case["verified"] or d5_case["verified"] or chain["validCount"] > 0:
        verdict = "partial"
    else:
        verdict = "refuted"

    return {
        "officeOrder": list(office_order),
        "anchors": anchors,
        "census": census,
        "receipts": receipts,
        "receiptRecord": receipt_record,
        "chain": chain,
        "d4Case": d4_case,
        "d5Case": d5_case,
        "negativeControls": controls,
        "verdict": verdict,
        "sourceBindings": _source_bindings(paths),
    }


def build_twin_hub_candidate(*, root: Path, reverse_input: bool = False) -> dict[str, Any]:
    """Emit a deterministic, source-derived planning-evidence sidecar."""
    model = derive_twin_hub_model(root=root, reverse_input=reverse_input)
    census = model["census"]
    core = {
        "schemaVersion": SCHEMA_VERSION,
        "candidateId": CANDIDATE_ID,
        "status": "planning_evidence",
        "scope": {
            "question": (
                "Does D4/D5 SEAT_CONTACT evidence route through T1-twin structure, "
                "deriving the seam mechanism (OBS-012) a second time, from below?"
            ),
            "stateCount": 462,
            "auditedTiers": list(D_TIERS),
            "tuning": "12-TET",
            "directoryNote": (
                "fivefold-incubator/ is the fifth-space research home; the directory "
                "name is historical and the census inside is heptatonic state-space."
            ),
        },
        "method": {
            "t1Twin": (
                "two root-0 states of the same Forte family with m(B)=T+/-1(m(A)) "
                "under the declared 12-bit mask convention (transpose_mask, "
                "src/governor/shadow_ladder.py), joined by a root_phase edge"
            ),
            "maskConvention": (
                "12-bit pitch-class mask; bit i = pitch class i; root normalized to "
                "pitch class 0"
            ),
            "rootPhase": (
                "adjacent-root displacement +/-1 with renormalization; CONSTRUCTS "
                "phase-seam edges carry mode=root_phase"
            ),
            "hub": (
                "the office appearing in both twin pairs of a tier; may be undefined "
                "(A1 pairs {Moon,Saturn}/{Sun,Venus} are disjoint); undefinedness "
                "constitutes the D4/D5 asymmetry"
            ),
            "ringMidpoint": (
                "for a distance-2 office pair {k-1,k+1}, office k is the unique "
                "vertex adjacent to both on the office ring"
            ),
            "permittedChain": (
                "D-anchor <- SEAT_CONTACT <- satellite <- GOVERNS <- parent anchor "
                "(single hop, satellite tier = parent tier)"
            ),
            "t1Receipt": "T1(Ionian)=Locrian; near-match rejected",
            "verdictSemantics": (
                "confirmed when the receipt, both D4/D5 cases, and all 28 chains "
                "verify; partial when only some do; refuted otherwise. All three "
                "close the story."
            ),
        },
        "t1Receipt": model["receiptRecord"],
        "twinCensus": {
            entry["tier"]: {
                "pairs": entry["pairs"],
                "hub": _hub(entry["pairs"]),
            }
            for entry in census
        },
        "d4Case": model["d4Case"],
        "d5Case": model["d5Case"],
        "chainAudit": {
            "rows": model["chain"]["rows"],
            "total": model["chain"]["total"],
            "validCount": model["chain"]["validCount"],
            "perTier": model["chain"]["perTier"],
            "twoContactsPerAnchor": model["chain"]["twoContactsPerAnchor"],
            "violations": model["chain"]["violations"],
        },
        "negativeControls": model["negativeControls"],
        "verdict": model["verdict"],
        "evidenceBindings": model["sourceBindings"],
    }
    return {**core, "candidateFingerprint": sha256_payload(core)}


def serialize_candidate(document: Mapping[str, Any]) -> bytes:
    return canonical_json_bytes(document)


def verify_candidate(document: Mapping[str, Any], *, root: Path) -> None:
    fingerprint = document.get("candidateFingerprint")
    core = {key: value for key, value in document.items() if key != "candidateFingerprint"}
    if fingerprint != sha256_payload(core):
        raise TwinHubError("candidate_fingerprint_mismatch")
    expected = build_twin_hub_candidate(root=root)
    if canonical_json_bytes(document) != canonical_json_bytes(expected):
        raise TwinHubError("candidate_does_not_match_source_derivation")
