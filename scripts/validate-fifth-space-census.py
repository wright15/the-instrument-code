#!/usr/bin/env python3
"""Validate the source-derived 462-record fifth-space census planning evidence."""

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

from governor.fifth_space_census import (
    SCHEMA_VERSION,
    CensusError,
    build_census_candidate,
    derive_census_model,
    fifth_mask,
    fifth_positions,
    gap_multiset,
    serialize_candidate,
)
from governor.hashing import sha256_payload
from governor.shadow_ladder import (
    FIFTH_POS,
    fifth_arc,
    fifth_span,
    mask_pitch_classes,
)


CANDIDATE_PATH = ROOT / "canonical/fivefold-incubator/fifth-space-census-v0.json"
CANDIDATE_SCHEMA_PATH = ROOT / "schemas/fivefold-incubator/fifth-space-census-v0.schema.json"
REPORT_PATH = ROOT / "qa/fifth-space-census-validation.json"
REPORT_SCHEMA_PATH = ROOT / "schemas/fivefold-incubator/fifth-space-census-validation.schema.json"


def _sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


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
        model = derive_census_model(root=ROOT)
        expected = build_census_candidate(root=ROOT)
        reordered = build_census_candidate(root=ROOT, reverse_input=True)
    except CensusError as error:
        model = None
        expected = None
        reordered = None
        source_error = str(error)
    else:
        source_error = None

    record(
        "freshness",
        expected is not None and serialize_candidate(document) == serialize_candidate(expected),
        expected["candidateFingerprint"] if expected is not None else source_error,
    )
    record(
        "determinism-build-twice",
        expected is not None
        and serialize_candidate(expected) == serialize_candidate(build_census_candidate(root=ROOT)),
        "identical source builds" if expected is not None else source_error,
    )
    record(
        "determinism-reorder",
        expected is not None and reordered is not None and serialize_candidate(expected) == serialize_candidate(reordered),
        "ledger and structural-edge order independent" if expected is not None else source_error,
    )
    record(
        "determinism-schema",
        expected is not None
        and document.get("schemaVersion") == SCHEMA_VERSION
        and set(document) == set(expected),
        "stable candidate envelope" if expected is not None else source_error,
    )

    records = document.get("records") or []
    record(
        "cardinality-462",
        isinstance(records, list) and len(records) == 462,
        len(records) if isinstance(records, list) else "non-list",
    )
    ids = [record.get("stateId") for record in records if isinstance(record, Mapping)]
    record(
        "ordering-unique",
        len(ids) == 462 and ids == sorted(ids) and len(set(ids)) == 462,
        "records sorted by stateId ascending, unique",
    )
    record(
        "role-reconciliation",
        document.get("roleReconciliation", {}).get("reconciled") is True,
        document.get("roleReconciliation"),
    )

    record(
        "binary-field-equivalence",
        all(
            isinstance(record, Mapping)
            and record.get("fifthMask") == fifth_mask(mask_pitch_classes(record.get("stateId")))
            and record.get("fifthPositions") == fifth_positions(mask_pitch_classes(record.get("stateId")))
            and record.get("fifthMask") == sum(1 << position for position in record.get("fifthPositions", []))
            and record.get("pitchMask") == record.get("stateId")
            and record.get("pitchClasses") == mask_pitch_classes(record.get("stateId"))
            for record in records
        ),
        "fifthMask/fifthPositions byte-identical to FIFTH_POS derivation",
    )
    record(
        "span-arc-holes",
        all(
            isinstance(record, Mapping)
            and record.get("fifthSpan") == fifth_span(mask_pitch_classes(record.get("stateId")))
            and record.get("fifthArc") == fifth_arc(mask_pitch_classes(record.get("stateId")))
            and record.get("holes") == record.get("fifthSpan") + 1 - 7
            for record in records
        ),
        "span is the minimal covering arc; holes = span+1-cardinality",
    )
    record(
        "gap-multiset",
        all(
            isinstance(record, Mapping)
            and record.get("gapMultiset") == gap_multiset(mask_pitch_classes(record.get("stateId")))
            for record in records
        ),
        "sorted cyclic fifth-gap multiset",
    )
    record(
        "span-ceiling-10",
        all(
            isinstance(record, Mapping) and record.get("fifthSpan") <= 10
            for record in records
        ),
        "no state exceeds the geometric span ceiling",
    )

    court_binding = document.get("courtBinding") or {}
    record(
        "c0-binding",
        court_binding.get("positionId") == "C0"
        and court_binding.get("mask") == 661
        and fifth_span(mask_pitch_classes(661)) == 4
        and court_binding.get("expectedSpan") == 4,
        "C0 binds court-rooted-positions.json mask 661 (span 4)",
    )
    record(
        "c0-negative-fixture",
        fifth_span(mask_pitch_classes(661)) == 4 and fifth_span(mask_pitch_classes(681)) == 6,
        "C0=661 is the negative fixture proving the minimal-covering-arc definition",
    )

    companion = document.get("companionChecks") or {}
    record(
        "satellite-family-uniformity",
        companion.get("satelliteFamilyUniformity", {}).get("verified") is True,
        companion.get("satelliteFamilyUniformity"),
    )
    record(
        "governs-out-degree",
        companion.get("governsOutDegree", {}).get("verified") is True,
        companion.get("governsOutDegree"),
    )
    record(
        "obs013-addendum",
        companion.get("obs013Addendum", {}).get("verified") is True,
        companion.get("obs013Addendum"),
    )

    verdict = document.get("researchVerdict") or {}
    record(
        "research-verdict-consistency",
        verdict.get("verdict") == (model["researchVerdict"]["verdict"] if model is not None else None)
        and verdict.get("verdict") in {"confirmed", "refuted", "partial"}
        and verdict.get("questionId") == "FSC-RQ-001",
        verdict.get("verdict"),
    )
    record(
        "research-verdict-non-gating",
        isinstance(records, list)
        and len(records) == 462
        and "verdict" not in (records[0] if records else {}),
        "records carry no truth-value gate; ORR-522 consumes them regardless",
    )

    record(
        "guards-namespace",
        _contains_only_planning_evidence(document),
        "planning evidence has no admission or topology coordinate" if _contains_only_planning_evidence(document) else "boundary field present",
    )

    bindings = document.get("evidenceBindings")
    record(
        "bindings-ledger-shas",
        isinstance(bindings, Mapping)
        and bindings.get("decisionLedgerSha256") == _sha256(ROOT / "provenance/DECISION_LEDGER.md")
        and bindings.get("observationLedgerSha256") == _sha256(ROOT / "provenance/OBSERVATION_LEDGER.md"),
        "frozen ledger bindings (both ledgers)",
    )
    record(
        "bindings-court",
        isinstance(bindings, Mapping)
        and bindings.get("courtRootedPositionsSha256")
        == _sha256(ROOT / "seven-governors-court-substrate-v0.1.0/canonical/court-rooted-positions.json"),
        "frozen Court position binding",
    )
    record(
        "bindings-source-derivation",
        model is not None and bindings == model["sourceBindings"],
        "all semantic source bindings" if model is not None else source_error,
    )

    failed = [check for check in checks if check["status"] == "FAIL"]
    report_core = {
        "schemaVersion": "fifth-space-census-validation.v0",
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
