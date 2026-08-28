#!/usr/bin/env python3
"""Validate source-derived shadow-ladder planning evidence."""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path
from typing import Any, Mapping

import jsonschema

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from governor.hashing import sha256_payload
from governor.shadow_ladder import (
    FIFTH_POS,
    SCHEMA_VERSION,
    ShadowLadderError,
    arc_positions,
    build_shadow_ladder_candidate,
    complement_mask,
    derive_shadow_ladder_model,
    fifth_arc,
    fifth_span,
    is_achiral,
    mask_pitch_classes,
    serialize_candidate,
    transpose_mask,
)


CANDIDATE_PATH = ROOT / "canonical/fivefold-incubator/shadow-ladder-v0.json"
CANDIDATE_SCHEMA_PATH = ROOT / "schemas/fivefold-incubator/shadow-ladder-v0.schema.json"
REPORT_PATH = ROOT / "qa/shadow-ladder-validation.json"
REPORT_SCHEMA_PATH = ROOT / "schemas/fivefold-incubator/shadow-ladder-validation.schema.json"


def _sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _record_geometry(record: Mapping[str, Any]) -> dict[str, Any] | None:
    try:
        mask = record["coreMask"]
        if not isinstance(mask, int) or isinstance(mask, bool):
            return None
        pitch_classes = mask_pitch_classes(mask)
        arc = fifth_arc(pitch_classes)
        coverage = arc_positions(arc)
        positions = {FIFTH_POS[pitch_class] for pitch_class in pitch_classes}
    except (KeyError, TypeError, ValueError, ShadowLadderError):
        return None
    return {
        "arc": arc,
        "coverage": coverage,
        "holes": [position for position in coverage if position not in positions],
        "positions": [position for position in coverage if position in positions],
        "span": fifth_span(pitch_classes),
    }


def _records_for_tier(document: Mapping[str, Any], tier: str) -> list[Mapping[str, Any]]:
    records = document.get("shadowLadder")
    if not isinstance(records, list):
        return []
    return [record for record in records if isinstance(record, Mapping) and record.get("tier") == tier]


def _same_rows(actual: list[Mapping[str, Any]], expected: list[Mapping[str, Any]]) -> bool:
    return list(actual) == list(expected)


def _contains_only_planning_evidence(document: Mapping[str, Any]) -> bool:
    forbidden_top_level = {"admissionEffect", "coordinateId", "globalAggregate", "releaseId"}
    return (
        document.get("status") == "planning_evidence"
        and not (set(document) & forbidden_top_level)
        and all(not isinstance(key, str) or not key.startswith("court.") for key in document)
    )


def validate(document: Mapping[str, Any]) -> dict[str, Any]:
    """Return a deterministic report using canonical sources as the semantic oracle."""
    checks: list[dict[str, Any]] = []

    def record(check_id: str, passed: bool, diagnostic: Any) -> None:
        checks.append(
            {
                "checkId": check_id,
                "status": "PASS" if passed else "FAIL",
                "diagnostic": diagnostic,
            }
        )

    try:
        candidate_schema = json.loads(CANDIDATE_SCHEMA_PATH.read_text(encoding="utf-8"))
        jsonschema.Draft202012Validator(candidate_schema).validate(document)
    except (OSError, json.JSONDecodeError, jsonschema.ValidationError) as error:
        record("schema", False, str(error))
    else:
        record("schema", True, "valid")

    core = {key: value for key, value in document.items() if key != "candidateFingerprint"}
    record(
        "fingerprint",
        document.get("candidateFingerprint") == sha256_payload(core),
        document.get("candidateFingerprint"),
    )

    try:
        model = derive_shadow_ladder_model(root=ROOT)
        expected = build_shadow_ladder_candidate(root=ROOT)
        reordered = build_shadow_ladder_candidate(root=ROOT, reverse_input=True)
    except ShadowLadderError as error:
        model: dict[str, Any] | None = None
        expected: dict[str, Any] | None = None
        reordered: dict[str, Any] | None = None
        source_error = str(error)
    else:
        source_error = None

    record(
        "freshness",
        expected is not None and serialize_candidate(document) == serialize_candidate(expected),
        expected["candidateFingerprint"] if expected is not None else source_error,
    )
    record(
        "build-twice",
        expected is not None
        and serialize_candidate(expected) == serialize_candidate(build_shadow_ladder_candidate(root=ROOT)),
        "source-derived" if expected is not None else source_error,
    )

    actual_a1 = _records_for_tier(document, "A1")
    actual_a2 = _records_for_tier(document, "A2")
    expected_a1 = model["a1Records"] if model is not None else []
    expected_a2 = model["a2Records"] if model is not None else []
    candidate_rows = [*actual_a1, *actual_a2]
    geometries = [_record_geometry(record) for record in candidate_rows]

    record(
        "determinism-build-twice",
        expected is not None
        and serialize_candidate(expected) == serialize_candidate(build_shadow_ladder_candidate(root=ROOT)),
        "identical source builds" if expected is not None else source_error,
    )
    record(
        "determinism-reorder",
        expected is not None and reordered is not None and serialize_candidate(expected) == serialize_candidate(reordered),
        "ledger and construction-edge order independent" if expected is not None else source_error,
    )
    record(
        "determinism-schema",
        expected is not None
        and document.get("schemaVersion") == SCHEMA_VERSION
        and set(document) == set(expected),
        "stable candidate envelope" if expected is not None else source_error,
    )

    if model is None:
        source_masks: list[int] = []
        source_a1_groups: list[Mapping[str, Any]] = []
        source_a2_groups: list[Mapping[str, Any]] = []
        source_seams: list[Mapping[str, Any]] = []
    else:
        source_masks = [
            *[record["coreMask"] for record in expected_a1],
            *[record["coreMask"] for record in expected_a2],
            *model["predictedA3"],
        ]
        source_a1_groups = model["a1Interiors"]
        source_a2_groups = model["a2Interiors"]
        source_seams = [*model["a1Seams"], *model["a2Seams"]]

    record(
        "operators-Tn",
        model is not None
        and all(
            group["parents"][0]["id"] & group["parents"][1]["id"]
            == transpose_mask(complement_mask(group["parents"][1]["id"]), 1)
            == transpose_mask(complement_mask(group["parents"][0]["id"]), -1)
            for group in source_a1_groups
        ),
        "A1 shifted-complement identities" if model is not None else source_error,
    )
    record(
        "operators-comp",
        model is not None and all(complement_mask(complement_mask(mask)) == mask for mask in source_masks),
        "complement involution over all derived shadow masks" if model is not None else source_error,
    )
    record(
        "span-arc",
        model is not None
        and len(candidate_rows) == 10
        and all(
            geometry is not None
            and row.get("fifthArc") == geometry["arc"]
            and row.get("fifthSpan") == geometry["span"]
            for row, geometry in zip(candidate_rows, geometries)
        ),
        "all minimal fifth arcs" if model is not None else source_error,
    )
    record(
        "span-C0-negative",
        model is not None
        and fifth_span(mask_pitch_classes(model["courtMasks"][0])) == 4
        and model["courtMasks"][0] == expected_a1[0]["coreMask"],
        "C0 is a fifth-span four 5-35 window" if model is not None else source_error,
    )
    record(
        "span-holes",
        model is not None
        and all(
            geometry is not None
            and row.get("holes") == len(geometry["holes"])
            and row.get("holes") == row.get("fifthSpan", -1) + 1 - 5
            for row, geometry in zip(candidate_rows, geometries)
        ),
        "span plus one minus cardinality" if model is not None else source_error,
    )
    record(
        "span-ME-5-35",
        model is not None
        and all(row["fifthSpan"] == 4 for row in expected_a1)
        and all(row["fifthSpan"] == 6 for row in expected_a2)
        and all(model["auditByMask"][row["coreMask"]]["forteNumber"] == "5-35" for row in expected_a1)
        and all(model["auditByMask"][row["coreMask"]]["forteNumber"] == "5-34" for row in expected_a2),
        "source audit maps span four to 5-35 and span six to 5-34" if model is not None else source_error,
    )

    record(
        "court-mode-windows",
        model is not None
        and all(
            anchor["id"].bit_count() == 7 and fifth_span(mask_pitch_classes(anchor["id"])) == 6
            for anchor in model["a0ByOffice"].values()
        ),
        "seven source A0 mode windows" if model is not None else source_error,
    )
    record(
        "court-Cj",
        model is not None
        and len(model["courtMasks"]) == 5
        and all(fifth_span(mask_pitch_classes(mask)) == 4 for mask in model["courtMasks"]),
        "five source Court windows" if model is not None else source_error,
    )
    record(
        "court-intersection",
        model is not None and [row["coreMask"] for row in expected_a1] == model["courtMasks"],
        "A1 parent intersections equal C0-C4" if model is not None else source_error,
    )

    record(
        "A1-overhang",
        model is not None
        and _same_rows(actual_a1, expected_a1)
        and all(
            geometry is not None
            and row.get("holes") == 0
            and row.get("fifthPositions") == geometry["positions"]
            for row, geometry in zip(actual_a1, geometries[: len(actual_a1)])
        ),
        "five source-derived A1 cores" if model is not None else source_error,
    )
    record(
        "A1-rigid-shift",
        model is not None
        and all(
            transpose_mask(expected_a1[index]["coreMask"], 5) == expected_a1[index + 1]["coreMask"]
            for index in range(len(expected_a1) - 1)
        ),
        "successive A1 cores move by one fifth" if model is not None else source_error,
    )

    record(
        "A2-punching",
        model is not None
        and _same_rows(actual_a2, expected_a2)
        and all(
            geometry is not None
            and set(row.get("punched", [])) == set(geometry["holes"])
            and len(row.get("punched", [])) == 2
            for row, geometry in zip(actual_a2, geometries[len(actual_a1) :])
        ),
        "A2 parent-arc holes are source-derived" if model is not None else source_error,
    )
    record(
        "A2-office-matched",
        model is not None
        and _same_rows(actual_a2, expected_a2)
        and all(
            row["coreMask"] & model["a0ByOffice"][row["office"]]["id"] == row["coreMask"]
            for row in expected_a2
        ),
        "each A2 core is a subset of its same-office A0 anchor" if model is not None else source_error,
    )
    record(
        "A2-two-parents",
        model is not None
        and all(len(group["parents"]) == 2 and group["provenance"] == "exact midpoint construction" for group in source_a2_groups),
        "five selected A2 midpoint pairs" if model is not None else source_error,
    )

    record(
        "seam-pairs",
        model is not None
        and all(
            group["provenance"] == "phase-seam construction"
            and (
                transpose_mask(group["parents"][0]["id"], 1) == group["parents"][1]["id"]
                or transpose_mask(group["parents"][1]["id"], 1) == group["parents"][0]["id"]
            )
            for group in source_seams
        ),
        "four source phase-seam T1 twin pairs" if model is not None else source_error,
    )
    record(
        "seam-per-tier",
        model is not None and len(model["a1Seams"]) == 2 and len(model["a2Seams"]) == 2,
        "two seam pairs at A1 and A2" if model is not None else source_error,
    )
    record(
        "seam-chain",
        model is not None
        and [
            sorted(group["target"]["officeIndex"] for group in model["a1Seams"]),
            sorted(group["target"]["officeIndex"] for group in model["a2Seams"]),
        ]
        == [[0, 6], [1, 5]],
        "source seam midpoints march inward" if model is not None else source_error,
    )

    record(
        "termination-dH-census",
        model is not None and model["a2DistanceCounts"] == {2: 5, 4: 0, 10: 2},
        (
            {
                "dH2": model["a2DistanceCounts"][2],
                "dH4": model["a2DistanceCounts"][4],
                "dH10": model["a2DistanceCounts"][10],
            }
            if model is not None
            else source_error
        ),
    )
    record(
        "termination-hexachord",
        model is not None
        and all(
            pair["shared"] == model["wholeToneMask"]
            for pair in model["a2PairDistances"]
            if pair["distance"] == 2
        ),
        "all dH2 A2 pairs share the whole-tone hexachord" if model is not None else source_error,
    )
    record(
        "termination-no-dH4",
        model is not None and model["a2DistanceCounts"].get(4) == 0,
        "no A2 office-distance-two dH4 pair" if model is not None else source_error,
    )
    record(
        "termination-5-33-detachment",
        model is not None
        and all(
            model["auditByMask"][mask].get("forteNumber") == "5-33"
            and model["auditByMask"][mask].get("parentCount") == 0
            for mask in model["predictedA3"]
        ),
        "T1-complement A3 predictions are detached 5-33 masks" if model is not None else source_error,
    )

    record(
        "incidence-15-36",
        model is not None
        and sum(model["auditByMask"][row["coreMask"]]["parentCount"] for row in expected_a1) == 15
        and model["auditByForte"]["5-35"].get("realizationCount") == 12
        and model["auditByForte"]["5-35"].get("parentCountPerRealization") == 3,
        "five selected 5-35 cores contribute 15 of 36 incidences" if model is not None else source_error,
    )
    record(
        "incidence-5-120",
        model is not None
        and sum(model["auditByMask"][row["coreMask"]]["parentCount"] for row in expected_a2) == 5
        and model["oneParentCount"] == 120,
        "five selected 5-34 cores are in the 120-mask one-parent stratum" if model is not None else source_error,
    )
    record(
        "incidence-out-of-census",
        model is not None
        and len(source_a2_groups) * 2 == 10
        and all(group["provenance"] == "exact midpoint construction" for group in source_a2_groups),
        "ten A2-to-A1 construction incidences are outside the detached audit" if model is not None else source_error,
    )

    record(
        "guards-no-court",
        model is not None
        and all(row["coreMask"] not in model["courtMasks"] for row in expected_a2)
        and all("courtPosition" not in row and "admission" not in row for row in actual_a2),
        "Court positions cross-check A1 only" if model is not None else source_error,
    )
    record(
        "guards-seam-typed",
        model is not None and all(group["provenance"] == "phase-seam construction" for group in source_seams),
        "midpoint and phase-seam provenance remain distinct" if model is not None else source_error,
    )
    record(
        "guards-namespace",
        _contains_only_planning_evidence(document),
        "planning evidence has no admission or topology coordinate" if _contains_only_planning_evidence(document) else "boundary field present",
    )
    record(
        "achirality",
        model is not None and all(is_achiral(mask) for mask in source_masks),
        "all derived 5-35, 5-34, and predicted 5-33 masks are achiral" if model is not None else source_error,
    )

    bindings = document.get("evidenceBindings")
    record(
        "bindings-ledger-shas",
        isinstance(bindings, Mapping)
        and bindings.get("decisionLedgerSha256") == _sha256(ROOT / "provenance/DECISION_LEDGER.md")
        and bindings.get("observationLedgerSha256") == _sha256(ROOT / "provenance/OBSERVATION_LEDGER.md"),
        "frozen ledger bindings",
    )
    record(
        "bindings-source-derivation",
        model is not None and bindings == model["sourceBindings"],
        "all semantic source bindings" if model is not None else source_error,
    )

    failed = [check for check in checks if check["status"] == "FAIL"]
    report_core = {
        "schemaVersion": "shadow-ladder-validation.v0",
        "verdict": "FAIL" if failed else "PASS",
        "candidateId": document.get("candidateId"),
        "candidateFingerprint": document.get("candidateFingerprint"),
        "checksPassed": len(checks) - len(failed),
        "checksFailed": len(failed),
        "checks": checks,
    }
    return {**report_core, "reportFingerprint": sha256_payload(report_core)}


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--no-write", action="store_true")
    args = parser.parse_args(argv)
    document = json.loads(CANDIDATE_PATH.read_text(encoding="utf-8"))
    report = validate(document)
    report_schema = json.loads(REPORT_SCHEMA_PATH.read_text(encoding="utf-8"))
    jsonschema.Draft202012Validator(report_schema).validate(report)
    if not args.no_write:
        REPORT_PATH.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))
    return 0 if report["verdict"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
