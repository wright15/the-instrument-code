"""Source-derived GOV-513 D-shadow complement-span planning evidence."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any, Mapping

from .hashing import canonical_json_bytes, sha256_payload
from .shadow_ladder import FULL_MASK, FIFTH_ORDER, FIFTH_POS, complement_mask, fifth_span, mask_pitch_classes, transpose_mask


SCHEMA_VERSION = "fivefold-incubator.d-shadow-complement-span.v0"
CANDIDATE_ID = "D_SHADOW_COMPLEMENT_SPAN_v0"
D_TIERS = ("D1", "D2", "D3", "D4", "D5", "D6", "D7")
SHUFFLE_SEED = 17
EXPECTED_D_TIER_RUN_SEQUENCE = (3, 3, 3, 3, 5, 2, 2)


class DShadowError(ValueError):
    """Raised when the GOV-513 source scope or derivation is inconsistent."""


def _read_json(path: Path) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        raise DShadowError(f"invalid_json_source:{path}") from error


def _sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _fifth_positions(mask: int) -> list[int]:
    return sorted(FIFTH_POS[pitch_class] for pitch_class in mask_pitch_classes(mask))


def _max_runs(positions: list[int]) -> tuple[int, list[list[int]]]:
    """Return all maximal consecutive runs on the cyclic fifth-position ring."""
    position_set = set(positions)
    if len(position_set) != len(positions) or not position_set:
        raise DShadowError("invalid_fifth_position_set")
    runs = []
    for start in sorted(position_set):
        if (start - 1) % 12 in position_set:
            continue
        run = [start]
        while (run[-1] + 1) % 12 in position_set:
            run.append((run[-1] + 1) % 12)
        runs.append(run)
    if not runs:
        raise DShadowError("no_cyclic_run_start")
    maximum = max(len(run) for run in runs)
    return maximum, [run for run in runs if len(run) == maximum]


def _mask_from_fifth_positions(positions: list[int]) -> int:
    return sum(1 << FIFTH_ORDER[position] for position in positions)


def _scope(ledger: Any) -> list[Mapping[str, Any]]:
    if not isinstance(ledger, list):
        raise DShadowError("ledger_source_must_be_array")
    selected = [
        record
        for record in ledger
        if isinstance(record, Mapping)
        and record.get("role") == "anchor"
        and record.get("tier") in D_TIERS
    ]
    selected.sort(key=lambda record: (D_TIERS.index(str(record["tier"])), int(record["id"])))
    if len(selected) != 49:
        raise DShadowError("scope_must_select_exactly_49_D_anchors")
    seen_ids: set[int] = set()
    for tier in D_TIERS:
        members = [record for record in selected if record["tier"] == tier]
        if len(members) != 7:
            raise DShadowError(f"tier_must_have_seven_D_anchors:{tier}")
        for record in members:
            mask = record.get("id")
            if (
                not isinstance(mask, int)
                or isinstance(mask, bool)
                or not 0 < mask <= FULL_MASK
                or mask.bit_count() != 7
                or mask in seen_ids
                or not isinstance(record.get("name"), str)
                or not isinstance(record.get("office"), str)
            ):
                raise DShadowError(f"invalid_D_anchor_identity:{mask}")
            seen_ids.add(mask)
    return selected


def _record(anchor: Mapping[str, Any]) -> dict[str, Any]:
    anchor_mask = int(anchor["id"])
    complement = complement_mask(anchor_mask)
    anchor_span = fifth_span(mask_pitch_classes(anchor_mask))
    complement_span = fifth_span(mask_pitch_classes(complement))
    expected = anchor_span - 2
    plus_one_span = fifth_span(mask_pitch_classes(transpose_mask(complement, 1)))
    minus_one_span = fifth_span(mask_pitch_classes(transpose_mask(complement, -1)))
    max_run, max_runs = _max_runs(_fifth_positions(anchor_mask))
    return {
        "tier": anchor["tier"],
        "role": "anchor",
        "stateId": anchor_mask,
        "name": anchor["name"],
        "office": anchor["office"],
        "anchorMask": anchor_mask,
        "complementMask": complement,
        "anchorFifthPositions": _fifth_positions(anchor_mask),
        "complementFifthPositions": _fifth_positions(complement),
        "anchorSpan": anchor_span,
        "maxRunLength": max_run,
        "maxRunFifthPositions": max_runs,
        "expectedComplementSpan": expected,
        "complementSpan": complement_span,
        "complementHoles": complement_span + 1 - 5,
        "directComplementRelationHolds": complement_span == expected,
        "transposedComplementControl": {
            "plusOneSpan": plus_one_span,
            "minusOneSpan": minus_one_span,
            "spanInvariant": plus_one_span == complement_span == minus_one_span,
        },
    }


def _run_summaries(records: list[Mapping[str, Any]]) -> list[dict[str, Any]]:
    summaries = []
    for tier in D_TIERS:
        members = [record for record in records if record["tier"] == tier]
        values = sorted({record["maxRunLength"] for record in members})
        if len(values) != 1:
            raise DShadowError(f"tier_max_run_is_not_uniform:{tier}")
        summaries.append(
            {
                "tier": tier,
                "anchorCount": len(members),
                "maxRunLength": values[0],
                "complementSpan": members[0]["complementSpan"],
                "identityHolds": all(
                    record["complementSpan"] == 11 - record["maxRunLength"]
                    for record in members
                ),
            }
        )
    return summaries


def _d5_court_run(
    records: list[Mapping[str, Any]], ledger: Any, network: Any, audit: Any, court: Any
) -> dict[str, Any]:
    if not isinstance(audit, Mapping) or not isinstance(audit.get("pitchSetRecords"), list):
        raise DShadowError("pentatonic_audit_missing_records")
    forte_by_mask = {
        item.get("pitchMask"): item.get("forteNumber")
        for item in audit["pitchSetRecords"]
        if isinstance(item, Mapping)
    }
    if not isinstance(court, Mapping) or not isinstance(court.get("courtRootedPositions"), list):
        raise DShadowError("court_source_missing_positions")
    if not all(
        isinstance(item, Mapping) and item.get("setClassId") == "pentatonic:5-35"
        for item in court["courtRootedPositions"]
    ):
        raise DShadowError("court_class_changed")
    d5_records = [record for record in records if record["tier"] == "D5"]
    run_rows = []
    for record in d5_records:
        run_masks = [_mask_from_fifth_positions(run) for run in record["maxRunFifthPositions"]]
        if (
            record["maxRunLength"] != 5
            or not all(len(run) == 5 for run in record["maxRunFifthPositions"])
            or not all(forte_by_mask.get(mask) == "5-35" for mask in run_masks)
        ):
            raise DShadowError(f"D5_max_run_is_not_court_class:{record['stateId']}")
        run_rows.append(
            {
                "stateId": record["stateId"],
                "maxRunFifthPositions": record["maxRunFifthPositions"],
                "maxRunMasks": run_masks,
                "forteNumber": "5-35",
            }
        )

    if not isinstance(ledger, list) or not isinstance(network, Mapping):
        raise DShadowError("invalid_twin_outer_office_sources")
    office_order = network.get("officeOrder")
    if not isinstance(office_order, list) or len(office_order) != 7 or len(set(office_order)) != 7:
        raise DShadowError("invalid_network_office_order")
    a2 = [
        record for record in ledger
        if isinstance(record, Mapping) and record.get("role") == "anchor" and record.get("tier") == "A2"
    ]
    pairs = []
    for index, left in enumerate(a2):
        for right in a2[index + 1:]:
            if (
                left.get("forte") == right.get("forte") == "7-33"
                and isinstance(left.get("id"), int)
                and isinstance(right.get("id"), int)
                and bool(left["id"] & 1)
                and bool(right["id"] & 1)
                and (transpose_mask(left["id"], 1) == right["id"] or transpose_mask(right["id"], 1) == left["id"])
            ):
                pairs.append((left, right))
    if len(pairs) != 2:
        raise DShadowError("A2_twin_pair_census_mismatch")
    office_counts: dict[str, int] = {}
    for left, right in pairs:
        for office in (left.get("office"), right.get("office")):
            if not isinstance(office, str):
                raise DShadowError("A2_twin_office_missing")
            office_counts[office] = office_counts.get(office, 0) + 1
    outer_offices = [office for office in office_order if office_counts.get(office) == 1]
    d5_by_office = {record["office"]: record["stateId"] for record in d5_records}
    if len(outer_offices) != 2 or any(office not in d5_by_office for office in outer_offices):
        raise DShadowError("D5_twin_outer_office_intersection_mismatch")
    return {
        "tier": "D5",
        "maxRunLength": 5,
        "courtClass": "5-35",
        "allD5MaxRunsAreCourtClass": True,
        "runs": run_rows,
        "twinOuterOfficeIntersection": {
            "offices": outer_offices,
            "stateIds": [d5_by_office[office] for office in outer_offices],
            "definition": "D5 anchors at the non-hub offices of the two A2 T1-twin pairs",
        },
    }


def _tier_summaries(records: list[Mapping[str, Any]]) -> list[dict[str, Any]]:
    summaries = []
    for tier in D_TIERS:
        members = [record for record in records if record["tier"] == tier]
        passed = [record["stateId"] for record in members if record["directComplementRelationHolds"]]
        failed = [record["stateId"] for record in members if not record["directComplementRelationHolds"]]
        summaries.append(
            {
                "tier": tier,
                "anchorCount": len(members),
                "passingStateIds": passed,
                "failingStateIds": failed,
                "tierPasses": len(passed) == len(members),
            }
        )
    return summaries


def _verdict(summaries: list[Mapping[str, Any]]) -> str:
    passing_tiers = [summary for summary in summaries if summary["tierPasses"]]
    failing_tiers = [summary for summary in summaries if not summary["tierPasses"]]
    if not failing_tiers:
        return "confirmed"
    if passing_tiers:
        return "partial"
    return "refuted"


def _hypothesis_disposition(verdict: str) -> dict[str, str]:
    if verdict == "confirmed":
        return {
            "H1": "supports one possible common-shadow route only; an authorized derivation of every D4/D5 contact, office, and orientation condition remains required",
            "H2": "no disposition; GOV-515 Stage 2 exhaustive ring-force enumeration remains required",
            "H3": "does not refute H3; declared-signature removal or variation remains its discriminating test",
        }
    if verdict == "partial":
        return {
            "H1": "retains only tier-named, non-generalized support for the passing subset",
            "H2": "no disposition",
            "H3": "compatible but not probative",
        }
    return {
        "H1": "weakens this D-shadow route to H1, not H1 as a whole",
        "H2": "no disposition",
        "H3": "compatible but not confirmation",
    }


def _shuffle_control(records: list[Mapping[str, Any]]) -> dict[str, Any]:
    count = len(records)
    permutation = [(index + SHUFFLE_SEED) % count for index in range(count)]
    if len(set(permutation)) != count or any(index == target for index, target in enumerate(permutation)):
        raise DShadowError("shuffle_must_be_a_derangement")
    rows = []
    for index, target_index in enumerate(permutation):
        anchor = records[index]
        paired_complement = records[target_index]
        rows.append(
            {
                "anchorStateId": anchor["stateId"],
                "pairedComplementFromStateId": paired_complement["stateId"],
                "anchorSpan": anchor["anchorSpan"],
                "expectedComplementSpan": anchor["expectedComplementSpan"],
                "pairedComplementSpan": paired_complement["complementSpan"],
                "relationHolds": paired_complement["complementSpan"] == anchor["expectedComplementSpan"],
            }
        )
    return {
        "algorithm": "canonical-record-order cyclic offset",
        "seed": SHUFFLE_SEED,
        "permutation": permutation,
        "isDerangement": True,
        "rows": rows,
        "passingPairCount": sum(row["relationHolds"] for row in rows),
        "totalPairCount": count,
        "interpretation": "null control only; it does not replace canonical identity pairings",
    }


def derive_d_shadow_model(*, root: Path, reverse_input: bool = False) -> dict[str, Any]:
    ledger_path = root / "canonical/universal-heptatonic-ledger.json"
    network_path = root / "canonical/universal-network-data.json"
    audit_path = root / "canonical/pentatonic-binding-candidates/pentatonic-7-35-parent-audit-v1.json"
    court_path = root / "seven-governors-court-substrate-v0.1.0/canonical/court-rooted-positions.json"
    ledger = _read_json(ledger_path)
    if reverse_input:
        if not isinstance(ledger, list):
            raise DShadowError("invalid_reverse_input")
        ledger = list(reversed(ledger))
    scope = _scope(ledger)
    records = [_record(anchor) for anchor in scope]
    summaries = _tier_summaries(records)
    run_summaries = _run_summaries(records)
    run_sequence = tuple(summary["maxRunLength"] for summary in run_summaries)
    if run_sequence != EXPECTED_D_TIER_RUN_SEQUENCE:
        raise DShadowError(f"D_tier_maxrun_sequence_mismatch:{run_sequence}")
    return {
        "records": records,
        "tierSummaries": summaries,
        "verdict": _verdict(summaries),
        "runSpace": {
            "identity": "span(complement(mask)) = 11 - maxRun(anchor fifth positions)",
            "tierSummaries": run_summaries,
            "dRunSequence": list(run_sequence),
            "d5CourtRun": _d5_court_run(
                records,
                ledger,
                _read_json(network_path),
                _read_json(audit_path),
                _read_json(court_path),
            ),
        },
        "shuffle": _shuffle_control(records),
        "sourceBindings": {
            "canonicalLedgerSha256": _sha256(ledger_path),
            "networkSha256": _sha256(network_path),
            "pentatonicAuditSha256": _sha256(audit_path),
            "courtRootedPositionsSha256": _sha256(court_path),
            "spanDefinitionSha256": _sha256(root / "src/governor/shadow_ladder.py"),
        },
    }


def build_d_shadow_candidate(*, root: Path, reverse_input: bool = False) -> dict[str, Any]:
    """Build the complete deterministic GOV-513 evidence sidecar."""
    model = derive_d_shadow_model(root=root, reverse_input=reverse_input)
    core = {
        "schemaVersion": SCHEMA_VERSION,
        "candidateId": CANDIDATE_ID,
        "status": "planning_evidence",
        "scope": {
            "selection": {"role": "anchor", "tiers": list(D_TIERS)},
            "anchorCount": 49,
            "anchorsPerTier": 7,
            "excluded": ["A anchors", "satellites", "boundary states", "graph projection"],
        },
        "method": {
            "maskComplement": "4095 ^ mask",
            "fifthPositions": "FIFTH_POS from src/governor/shadow_ladder.py",
            "span": "12 - largest cyclic fifth-position gap",
            "complementHoles": "span + 1 - 5",
            "maxRun": "largest number of consecutive anchor fifth positions on the 12-position cycle",
            "runSpaceIdentity": "span(complement(mask)) = 11 - maxRun(anchor fifth positions)",
            "relation": "span(complement(mask)) = span(mask) - 2",
            "transpositionControl": "T+/-1 preserves fifth-space span and cannot create a passing relation",
            "verdictSemantics": "confirmed=all seven tiers pass; partial=at least one whole tier passes and at least one fails; refuted=no whole tier passes after complete valid scope",
        },
        "records": model["records"],
        "tierSummaries": model["tierSummaries"],
        "runSpace": model["runSpace"],
        "shuffleControl": model["shuffle"],
        "verdict": model["verdict"],
        "hypothesisDisposition": _hypothesis_disposition(model["verdict"]),
        "evidenceBindings": model["sourceBindings"],
    }
    return {**core, "candidateFingerprint": sha256_payload(core)}


def serialize_candidate(document: Mapping[str, Any]) -> bytes:
    return canonical_json_bytes(document)


def verify_candidate(document: Mapping[str, Any], *, root: Path) -> None:
    if not isinstance(document, Mapping):
        raise DShadowError("candidate_must_be_object")
    core = {key: value for key, value in document.items() if key != "candidateFingerprint"}
    if document.get("candidateFingerprint") != sha256_payload(core):
        raise DShadowError("candidate_fingerprint_mismatch")
    if canonical_json_bytes(document) != serialize_candidate(build_d_shadow_candidate(root=root)):
        raise DShadowError("candidate_does_not_match_source_derivation")
