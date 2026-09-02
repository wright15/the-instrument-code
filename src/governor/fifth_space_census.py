"""Source-derived 462-record fifth-space census with no admission effect.

GOV-511: schema-closed census of fifth-space structure over all 462 canonical
state records. Fifth space is the coordinate relabeling f(p) = 7p mod 12
(pitch class -> circle-of-fifths position). The dataset, not any research
verdict, unblocks ORR-522; the census is descriptive planning evidence.
"""

from __future__ import annotations

from collections import defaultdict
from pathlib import Path
from typing import Any, Mapping

from .hashing import canonical_json_bytes, sha256_payload
from .shadow_ladder import (
    FIFTH_POS,
    FULL_MASK,
    ShadowLadderError,
    _mask,
    _read_json,
    _sha,
    fifth_arc,
    fifth_span,
    mask_pitch_classes,
)


SCHEMA_VERSION = "fivefold-incubator.fifth-space-census.v0"
CANDIDATE_ID = "FIFTH_SPACE_CENSUS_v0"
STATE_COUNT = 462
GOVERNS_OUT_DEGREE = {"A0": 6, "A1": 4, "A2": 6, "D1": 2, "D2": 4, "D3": 2, "D4": 4, "D5": 4, "D6": 2, "D7": 0}

SOURCE_BINDING_SPECS = (
    ("canonical-heptatonic-ledger", "canonical/universal-heptatonic-ledger.json", "authoritative_state_identity"),
    ("canonical-network-data", "canonical/universal-network-data.json", "selected_governing_edges"),
    ("court-rooted-positions", "seven-governors-court-substrate-v0.1.0/canonical/court-rooted-positions.json", "C0_court_window_binding"),
    ("decision-ledger", "provenance/DECISION_LEDGER.md", "release_boundary_context"),
    ("observation-ledger", "provenance/OBSERVATION_LEDGER.md", "derived_observation_context"),
)


class CensusError(ValueError):
    """Raised when canonical census inputs are inconsistent."""


def _source_paths(root: Path) -> dict[str, Path]:
    return {binding_id: root / relative for binding_id, relative, _ in SOURCE_BINDING_SPECS}


def _source_bindings(paths: Mapping[str, Path]) -> dict[str, str]:
    hashes = {binding_id: _sha(paths[binding_id]) for binding_id, _, _ in SOURCE_BINDING_SPECS}
    return {
        "canonicalLedgerSha256": hashes["canonical-heptatonic-ledger"],
        "networkFingerprint": hashes["canonical-network-data"],
        "courtRootedPositionsSha256": hashes["court-rooted-positions"],
        "decisionLedgerSha256": hashes["decision-ledger"],
        "observationLedgerSha256": hashes["observation-ledger"],
    }


def fifth_mask(pitch_classes: list[int]) -> int:
    """Relabeled fifth-space mask: bit i = fifth-position i occupied."""
    return sum(1 << FIFTH_POS[pitch_class] for pitch_class in pitch_classes)


def fifth_positions(pitch_classes: list[int]) -> list[int]:
    """Deterministic fifth positions derived from pitch classes via FIFTH_POS."""
    return sorted(FIFTH_POS[pitch_class] for pitch_class in pitch_classes)


def gap_multiset(pitch_classes: list[int]) -> list[int]:
    """Sorted cyclic gaps between fifth positions."""
    positions = fifth_positions(pitch_classes)
    gaps = [
        (positions[(index + 1) % len(positions)] - positions[index]) % 12
        for index in range(len(positions))
    ]
    return sorted(gaps)


def _office_order(network: Any) -> tuple[str, ...]:
    if not isinstance(network, Mapping):
        raise CensusError("network_source_must_be_object")
    offices = network.get("officeOrder")
    if (
        not isinstance(offices, list)
        or len(offices) != 7
        or len(set(offices)) != 7
        or any(not isinstance(office, str) or not office for office in offices)
    ):
        raise CensusError("invalid_network_office_order")
    return tuple(offices)


def _court_c0(court: Any) -> int:
    if not isinstance(court, Mapping) or not isinstance(court.get("courtRootedPositions"), list):
        raise CensusError("court_source_missing_positions")
    for position in court["courtRootedPositions"]:
        if isinstance(position, Mapping) and position.get("positionId") == "C0":
            mask = _mask(position.get("pitchMask"), "court_c0")
            if mask.bit_count() != 5 or position.get("setClassId") != "pentatonic:5-35":
                raise CensusError("invalid_court_c0_window")
            return mask
    raise CensusError("court_c0_missing")


def _record(raw: Mapping[str, Any]) -> dict[str, Any]:
    mask = _mask(raw.get("id"), "ledger_state")
    if mask.bit_count() != 7:
        raise CensusError(f"ledger_state_not_heptatonic:{mask}")
    pitch_classes = mask_pitch_classes(mask)
    positions = fifth_positions(pitch_classes)
    span = fifth_span(pitch_classes)
    arc = fifth_arc(pitch_classes)
    return {
        "stateId": mask,
        "name": raw.get("name"),
        "forte": raw.get("forte"),
        "role": raw.get("role"),
        "fineRole": raw.get("fineRole"),
        "tier": raw.get("tier"),
        "office": raw.get("office"),
        "officeIndex": raw.get("officeIndex"),
        "chirality": raw.get("chirality"),
        "pitchMask": mask,
        "pitchClasses": pitch_classes,
        "fifthMask": fifth_mask(pitch_classes),
        "fifthPositions": positions,
        "fifthSpan": span,
        "fifthArc": arc,
        "holes": span + 1 - len(pitch_classes),
        "gapMultiset": gap_multiset(pitch_classes),
        "provenancePath": "canonical/universal-heptatonic-ledger.json",
    }


def _records(ledger: Any) -> list[dict[str, Any]]:
    if not isinstance(ledger, list) or len(ledger) != STATE_COUNT:
        raise CensusError(f"ledger_state_count_mismatch:{len(ledger) if isinstance(ledger, list) else 'non-list'}")
    seen: set[int] = set()
    records = []
    for raw in sorted(ledger, key=lambda row: row.get("id") if isinstance(row, Mapping) else -1):
        if not isinstance(raw, Mapping):
            raise CensusError("ledger_row_must_be_object")
        mask = _mask(raw.get("id"), "ledger_state")
        if mask in seen:
            raise CensusError(f"duplicate_ledger_state:{mask}")
        seen.add(mask)
        records.append(_record(raw))
    return records


def _role_reconciliation(records: list[dict[str, Any]]) -> dict[str, Any]:
    by_role = defaultdict(int)
    for record in records:
        by_role[record["role"]] += 1
    a_tier = sum(record["role"] == "anchor" and record["tier"] in {"A0", "A1", "A2"} for record in records)
    d_tier = sum(
        record["role"] == "anchor" and isinstance(record["tier"], str) and record["tier"].startswith("D")
        for record in records
    )
    boundaries = sum(record["role"] == "boundary" and record["tier"] is None for record in records)
    expected = {"anchor": 70, "satellite": 238, "boundary": 154}
    return {
        "byRole": dict(sorted(by_role.items())),
        "expectedRoles": expected,
        "aTierAnchors": a_tier,
        "dTierAnchors": d_tier,
        "boundaries": boundaries,
        "reconciled": by_role == expected and a_tier == 21 and d_tier == 49 and boundaries == 154,
    }


def _satellite_family_uniformity(records: list[dict[str, Any]]) -> dict[str, Any]:
    families: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))
    for record in records:
        if record["role"] == "satellite":
            families[record["forte"]][record["office"]] += 1
    per_family_ok = all(
        len(offices) == 7 and set(offices.values()) == {2}
        for offices in families.values()
    )
    per_office = defaultdict(int)
    for offices in families.values():
        for office, count in offices.items():
            per_office[office] += count
    expected_offices = {office: 34 for office in per_office}
    verified = (
        len(families) == 17
        and per_family_ok
        and dict(per_office) == expected_offices
        and sum(per_office.values()) == 238
    )
    return {
        "familyCount": len(families),
        "satellitesPerFamily": 14,
        "statesPerOfficePerFamily": 2,
        "satellitesPerOffice": dict(sorted(per_office.items())),
        "perFamilyUniform": per_family_ok,
        "verified": verified,
    }


def _governs_out_degree(
    network: Any, ledger: Any, office_order: tuple[str, ...]
) -> dict[str, Any]:
    """GOVERNS out-degree per office per parent anchor tier, from selected edges."""
    if not isinstance(network, Mapping) or not isinstance(network.get("structuralEdges"), list):
        raise CensusError("network_missing_structural_edges")
    ledger_by_id = {
        raw["id"]: raw
        for raw in ledger
        if isinstance(raw, Mapping) and isinstance(raw.get("id"), int)
    }
    out_degree: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))
    edge_count = 0
    for edge in network["structuralEdges"]:
        if edge.get("type") != "GOVERNS" or edge.get("selected") is not True:
            continue
        parent = ledger_by_id.get(edge.get("source"))
        satellite = ledger_by_id.get(edge.get("target"))
        if (
            parent is None
            or satellite is None
            or parent.get("role") != "anchor"
            or satellite.get("role") != "satellite"
            or satellite.get("tier") != parent.get("tier")
            or satellite.get("office") != parent.get("office")
        ):
            raise CensusError(f"invalid_governs_edge:{edge.get('id')}")
        out_degree[parent["office"]][parent["tier"]] += 1
        edge_count += 1
    if edge_count != 238:
        raise CensusError(f"governs_edge_count_mismatch:{edge_count}")
    expected = {office: dict(GOVERNS_OUT_DEGREE) for office in office_order}
    tiers = tuple(GOVERNS_OUT_DEGREE)
    actual = {
        office: {tier: out_degree[office].get(tier, 0) for tier in tiers}
        for office in office_order
    }
    verified = actual == expected and all(
        sum(actual[office].values()) == 34 for office in office_order
    )
    return {
        "byOffice": actual,
        "expected": expected,
        "perOfficeTotal": {office: sum(actual[office].values()) for office in office_order},
        "edgeCount": edge_count,
        "verified": verified,
    }


def _obs013_addendum(records: list[dict[str, Any]]) -> dict[str, Any]:
    """Geometric termination addendum: 7 points on the 12-cycle force a gap >= 2."""
    spans = [record["fifthSpan"] for record in records]
    ceiling_respected = max(spans) <= 10
    ceiling_states = [
        {
            "stateId": record["stateId"],
            "name": record["name"],
            "forte": record["forte"],
            "role": record["role"],
            "tier": record["tier"],
            "office": record["office"],
            "gapMultiset": record["gapMultiset"],
        }
        for record in records
        if record["fifthSpan"] == 10
    ]
    a2_anchors = [record for record in records if record["role"] == "anchor" and record["tier"] == "A2"]
    d7_anchors = [record for record in records if record["role"] == "anchor" and record["tier"] == "D7"]
    a2_at_ceiling = all(record["fifthSpan"] == 10 for record in a2_anchors)
    d7_at_ceiling = all(record["fifthSpan"] == 10 for record in d7_anchors)
    return {
        "theorem": (
            "seven points on the 12-cycle have seven gaps summing to 12, so the "
            "largest gap is at least 2 and the minimal covering arc span is at "
            "most 10: the A-ladder ceiling is geometry, not fiat"
        ),
        "spanCeiling": 10,
        "ceilingRespected": ceiling_respected,
        "ceilingStateCount": len(ceiling_states),
        "ceilingStates": ceiling_states,
        "a2AnchorsAtCeiling": a2_at_ceiling,
        "d7AnchorsAtCeiling": d7_at_ceiling,
        "verified": ceiling_respected and a2_at_ceiling and d7_at_ceiling,
    }


def _research_verdict(records: list[dict[str, Any]], addendum: Mapping[str, Any]) -> dict[str, Any]:
    """Pre-registered research question, computed from the census data only."""
    question_id = "FSC-RQ-001"
    question = (
        "Do all 462 states respect the geometric fifth-span ceiling of 10, with "
        "the 7-33 (A2) and 7-1 (D7) anchor families sitting at the ceiling?"
    )
    a2_anchors = [record for record in records if record["role"] == "anchor" and record["tier"] == "A2"]
    d7_anchors = [record for record in records if record["role"] == "anchor" and record["tier"] == "D7"]
    ceiling_ok = addendum["ceilingRespected"]
    a2_ok = len(a2_anchors) == 7 and all(record["fifthSpan"] == 10 for record in a2_anchors)
    d7_ok = len(d7_anchors) == 7 and all(record["fifthSpan"] == 10 for record in d7_anchors)
    if ceiling_ok and a2_ok and d7_ok:
        verdict = "confirmed"
    elif ceiling_ok or a2_ok or d7_ok:
        verdict = "partial"
    else:
        verdict = "refuted"
    return {
        "questionId": question_id,
        "question": question,
        "verdict": verdict,
        "ceilingRespected": ceiling_ok,
        "a2AnchorsAtCeiling": a2_ok,
        "d7AnchorsAtCeiling": d7_ok,
        "derivation": (
            "computed spans over the census records: no state exceeds span 10; "
            "all seven 7-33 A2 anchors and all seven 7-1 D7 anchors attain "
            "span 10 (gap multiset with maximum gap 2)"
            if verdict == "confirmed"
            else "see subflags"
        ),
    }


def derive_census_model(*, root: Path, reverse_input: bool = False) -> dict[str, Any]:
    """Derive the fifth-space census model from frozen canonical sources."""
    paths = _source_paths(root)
    ledger = _read_json(paths["canonical-heptatonic-ledger"])
    network = _read_json(paths["canonical-network-data"])
    court = _read_json(paths["court-rooted-positions"])
    if reverse_input:
        if not isinstance(ledger, list) or not isinstance(network, Mapping):
            raise CensusError("invalid_reverse_input")
        ledger = list(reversed(ledger))
        structural = network.get("structuralEdges")
        if not isinstance(structural, list):
            raise CensusError("network_missing_structural_edges")
        network = {**network, "structuralEdges": list(reversed(structural))}

    office_order = _office_order(network)
    c0_mask = _court_c0(court)
    records = _records(ledger)
    reconciliation = _role_reconciliation(records)
    satellite_uniformity = _satellite_family_uniformity(records)
    governs_degree = _governs_out_degree(network, ledger, office_order)
    addendum = _obs013_addendum(records)
    research_verdict = _research_verdict(records, addendum)

    return {
        "officeOrder": list(office_order),
        "c0Mask": c0_mask,
        "records": records,
        "reconciliation": reconciliation,
        "satelliteFamilyUniformity": satellite_uniformity,
        "governsOutDegree": governs_degree,
        "obs013Addendum": addendum,
        "researchVerdict": research_verdict,
        "sourceBindings": _source_bindings(paths),
    }


def build_census_candidate(*, root: Path, reverse_input: bool = False) -> dict[str, Any]:
    """Emit a deterministic, source-derived planning-evidence census sidecar."""
    model = derive_census_model(root=root, reverse_input=reverse_input)
    core = {
        "schemaVersion": SCHEMA_VERSION,
        "candidateId": CANDIDATE_ID,
        "status": "planning_evidence",
        "scope": {
            "stateCount": STATE_COUNT,
            "fifthSpace": "f(p) = 7p mod 12; pitch class -> circle-of-fifths position",
            "tuning": "12-TET",
            "roles": ["anchor", "satellite", "boundary"],
            "directoryNote": (
                "fivefold-incubator/ is the fifth-space research home; the directory "
                "name is historical and this census is heptatonic state-space."
            ),
            "consumer": "ORR-522 consumes records[] regardless of researchVerdict",
        },
        "method": {
            "fifthOrder": [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5],
            "fifthSpan": "minimal covering arc = 12 minus largest cyclic gap",
            "holes": "span + 1 - cardinality",
            "fifthMask": "integer 0..4095; bit i set iff fifth-position i occupied",
            "fifthPositions": "derived deterministically from pitchClasses via FIFTH_POS",
            "ordering": "records sorted by stateId ascending",
        },
        "courtBinding": {
            "positionId": "C0",
            "mask": model["c0Mask"],
            "source": "seven-governors-court-substrate-v0.1.0/canonical/court-rooted-positions.json",
            "expectedSpan": 4,
        },
        "records": model["records"],
        "roleReconciliation": model["reconciliation"],
        "companionChecks": {
            "satelliteFamilyUniformity": model["satelliteFamilyUniformity"],
            "governsOutDegree": model["governsOutDegree"],
            "obs013Addendum": model["obs013Addendum"],
        },
        "researchVerdict": model["researchVerdict"],
        "evidenceBindings": model["sourceBindings"],
    }
    return {**core, "candidateFingerprint": sha256_payload(core)}


def serialize_candidate(document: Mapping[str, Any]) -> bytes:
    return canonical_json_bytes(document)


def verify_candidate(document: Mapping[str, Any], *, root: Path) -> None:
    fingerprint = document.get("candidateFingerprint")
    core = {key: value for key, value in document.items() if key != "candidateFingerprint"}
    if fingerprint != sha256_payload(core):
        raise CensusError("candidate_fingerprint_mismatch")
    expected = build_census_candidate(root=root)
    if canonical_json_bytes(document) != canonical_json_bytes(expected):
        raise CensusError("candidate_does_not_match_source_derivation")
