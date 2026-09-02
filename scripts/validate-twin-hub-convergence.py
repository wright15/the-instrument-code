#!/usr/bin/env python3
"""Validate source-derived twin-hub contact convergence planning evidence."""

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
from governor.shadow_ladder import transpose_mask
from governor.twin_hub_convergence import (
    SCHEMA_VERSION,
    TwinHubError,
    build_twin_hub_candidate,
    derive_twin_hub_model,
    serialize_candidate,
)


CANDIDATE_PATH = ROOT / "canonical/fivefold-incubator/twin-hub-convergence-v0.json"
CANDIDATE_SCHEMA_PATH = ROOT / "schemas/fivefold-incubator/twin-hub-convergence-v0.schema.json"
REPORT_PATH = ROOT / "qa/twin-hub-convergence-validation.json"
REPORT_SCHEMA_PATH = ROOT / "schemas/fivefold-incubator/twin-hub-convergence-validation.schema.json"


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
        model = derive_twin_hub_model(root=ROOT)
        expected = build_twin_hub_candidate(root=ROOT)
        reordered = build_twin_hub_candidate(root=ROOT, reverse_input=True)
    except TwinHubError as error:
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
        and serialize_candidate(expected) == serialize_candidate(build_twin_hub_candidate(root=ROOT)),
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

    receipt = document.get("t1Receipt") or {}
    record(
        "t1-receipt-positive",
        receipt.get("ionianMask") == 2741
        and receipt.get("locrianMask") == 1387
        and receipt.get("verified") is True
        and transpose_mask(2741, 1) == 1387,
        "T1(Ionian)=Locrian under the declared mask convention",
    )
    near_match = transpose_mask(1387, 1)
    record(
        "t1-receipt-near-match-rejected",
        near_match == 2774
        and near_match != 2741
        and transpose_mask(2741, 1) != near_match,
        f"T1(Locrian)={near_match} is not accepted as the pre-registered partner",
    )
    record(
        "t1-receipt-root-phase-edges",
        isinstance(receipt.get("rootPhaseReceipts"), list)
        and len(receipt.get("rootPhaseReceipts", [])) == 2
        and sorted(
            item.get("seamTarget") for item in receipt.get("rootPhaseReceipts", [])
        )
        == [1371, 2901],
        "Ionian and Locrian are joined by root_phase phase-seam edges",
    )

    census = document.get("twinCensus") or {}
    expected_pairs = {
        "A0": [[1387, 2741], [1451, 2773]],
        "A1": [[1371, 2733], [1707, 2901]],
        "A2": [[1367, 2731], [2731, 3413]],
    }
    census_matches = True
    for tier, pair_list in expected_pairs.items():
        entry = census.get(tier) or {}
        actual = [
            sorted([pair.get("leftMask"), pair.get("rightMask")])
            for pair in entry.get("pairs", [])
            if isinstance(pair, Mapping)
        ]
        if sorted(actual) != sorted(sorted(pair) for pair in pair_list):
            census_matches = False
    record(
        "twin-census-pre-registered",
        census_matches and len(census) == 3,
        expected_pairs,
    )
    record(
        "twin-pair-dH10",
        all(
            isinstance(pair, Mapping)
            and pair.get("hamming") == 10
            for entry in census.values()
            for pair in entry.get("pairs", [])
        ),
        "every T1-twin pair sits at dH10",
    )

    record(
        "hub-A0-undefined",
        census.get("A0", {}).get("hub") is None
        and census.get("A1", {}).get("hub") is None,
        "A0 and A1 twin office pairs are disjoint; no hub",
    )
    record(
        "hub-A2-mercury",
        census.get("A2", {}).get("hub") == "Mercury",
        "A2 twin pairs share the Mercury hub",
    )

    d4 = document.get("d4Case") or {}
    record(
        "d4-midpoints-seated",
        d4.get("midpoints") == ["Saturn", "Sun"]
        and d4.get("seamsSeated") is True
        and d4.get("midpointSeamAnchors") == [1371, 2901],
        "A1-generating twin midpoints {Sun, Saturn} are seated phase seams",
    )
    record(
        "d4-pairs-disjoint-no-hub",
        d4.get("pairsDisjoint") is True and d4.get("hub") is None,
        "D4 twin pairs disjoint; hub undefined",
    )
    record(
        "d4-chains-valid",
        d4.get("seatContactRows") == 14 and d4.get("chainValid") is True,
        "all 14 D4 seat-contact rows route the permitted chain",
    )
    record(
        "d4-case-verified",
        d4.get("verified") is True,
        d4.get("summary"),
    )

    d5 = document.get("d5Case") or {}
    record(
        "d5-midpoints-unseated",
        d5.get("midpoints") == ["Jupiter", "Mars"]
        and d5.get("midpointsUnseatedAsSeams") is True
        and d5.get("a3Absent") is True,
        "A2 twin midpoints {Mars, Jupiter} are unseated as seams; no A3",
    )
    record(
        "d5-hub-mercury",
        d5.get("hubIsMercury") is True and d5.get("hub") == "Mercury",
        "D5 twins share the Mercury hub",
    )
    record(
        "d5-chains-valid",
        d5.get("seatContactRows") == 14 and d5.get("chainValid") is True,
        "all 14 D5 seat-contact rows route the permitted chain",
    )
    record(
        "d5-seats-unseated-offices",
        d5.get("seatsUnseatedMidpointOffices") is True,
        "D5 anchors seat the unseated-midpoint offices Mars and Jupiter",
    )
    record(
        "d5-case-verified",
        d5.get("verified") is True,
        d5.get("summary"),
    )

    chain = document.get("chainAudit") or {}
    record(
        "chain-total-28",
        chain.get("total") == 28 and chain.get("validCount") == 28,
        {"total": chain.get("total"), "valid": chain.get("validCount")},
    )
    record(
        "chain-two-contacts-per-anchor",
        chain.get("twoContactsPerAnchor") is True,
        "exactly two selected contacts per D4/D5 anchor",
    )
    record(
        "chain-no-violations",
        chain.get("violations") == [],
        "no missing, reversed, or cross-tier relation accepted",
    )

    controls = document.get("negativeControls") or []
    record(
        "negative-controls",
        isinstance(controls, list)
        and len(controls) == 6
        and all(
            isinstance(control, Mapping)
            and bool(control.get("value")) is True
            and bool(control.get("expected")) is True
            for control in controls
        ),
        "six negative controls pass",
    )

    record(
        "verdict-consistency",
        document.get("verdict") == (model["verdict"] if model is not None else None)
        and document.get("verdict") in {"confirmed", "refuted", "partial"},
        document.get("verdict"),
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
        "frozen ledger bindings",
    )
    record(
        "bindings-source-derivation",
        model is not None and bindings == model["sourceBindings"],
        "all semantic source bindings" if model is not None else source_error,
    )

    failed = [check for check in checks if check["status"] == "FAIL"]
    report_core = {
        "schemaVersion": "twin-hub-convergence-validation.v0",
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
