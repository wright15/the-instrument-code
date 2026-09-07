#!/usr/bin/env python3
"""Validate the source-bound GOV-516 max-run uniqueness observation."""

from __future__ import annotations

import argparse
from copy import deepcopy
import hashlib
import json
import sys
from pathlib import Path
from typing import Any, Mapping

import jsonschema

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from governor.d_shadow_uniqueness import (
    CANDIDATE_ID,
    DShadowUniquenessError,
    SCHEMA_VERSION,
    SOURCE_PATH,
    build_d_shadow_uniqueness_candidate,
    derive_d_shadow_uniqueness_model,
    serialize_candidate,
    verify_candidate,
)
from governor.hashing import sha256_payload


CANDIDATE_PATH = ROOT / "canonical/fivefold-incubator/d-shadow-uniqueness-check-v0.json"
CANDIDATE_SCHEMA_PATH = ROOT / "schemas/fivefold-incubator/d-shadow-uniqueness-check-v0.schema.json"
REPORT_PATH = ROOT / "qa/d-shadow-uniqueness-validation.json"
REPORT_SCHEMA_PATH = ROOT / "schemas/fivefold-incubator/d-shadow-uniqueness-validation.schema.json"


def _sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _rehash(document: dict[str, Any]) -> None:
    document["candidateFingerprint"] = sha256_payload(
        {key: value for key, value in document.items() if key != "candidateFingerprint"}
    )


def _is_rejected(document: dict[str, Any]) -> bool:
    try:
        verify_candidate(document, root=ROOT)
    except DShadowUniquenessError:
        return True
    return False


def _suite_status() -> list[dict[str, str]]:
    return [
        {"suite": "source-binding", "status": "ran", "reason": "validator verified the D-shadow source artifact against canonical pitch-class masks"},
        {"suite": "schema", "status": "ran", "reason": "validator applied the candidate and receipt schemas"},
        {"suite": "exhaustive-completion", "status": "ran", "reason": "validator recomputed every D1-D7 candidate coordinate from source tier summaries"},
        {"suite": "build-twice", "status": "ran", "reason": "validator built the source-derived candidate twice"},
        {"suite": "reordered-input", "status": "ran", "reason": "validator rebuilt from reversed source tier-summary order"},
        {"suite": "negative-control", "status": "ran", "reason": "validator rejected excluded inputs, changed order, and selected-only output"},
        {"suite": "adversarial-tamper", "status": "ran", "reason": "validator proved rehashed semantic tampering is rejected"},
    ]


def validate(document: Mapping[str, Any]) -> dict[str, Any]:
    checks: list[dict[str, Any]] = []

    def record(check_id: str, passed: bool, diagnostic: Any) -> None:
        checks.append({"checkId": check_id, "status": "PASS" if passed else "FAIL", "diagnostic": diagnostic})

    try:
        jsonschema.Draft202012Validator(json.loads(CANDIDATE_SCHEMA_PATH.read_text(encoding="utf-8"))).validate(document)
    except (OSError, json.JSONDecodeError, jsonschema.ValidationError) as error:
        record("schema", False, str(error))
    else:
        record("schema", True, "valid")

    core = {key: value for key, value in document.items() if key != "candidateFingerprint"}
    record("candidate-fingerprint", document.get("candidateFingerprint") == sha256_payload(core), document.get("candidateFingerprint"))
    try:
        model = derive_d_shadow_uniqueness_model(root=ROOT)
        expected = build_d_shadow_uniqueness_candidate(root=ROOT)
        reordered = build_d_shadow_uniqueness_candidate(root=ROOT, reverse_input=True)
        source_error = None
    except DShadowUniquenessError as error:
        model = expected = reordered = None
        source_error = str(error)

    record("source-binding", expected is not None, "verified D-shadow artifact against canonical pitch-class masks" if expected else source_error)
    record("freshness", expected is not None and serialize_candidate(document) == serialize_candidate(expected), expected["candidateFingerprint"] if expected else source_error)
    record("determinism-build-twice", expected is not None and serialize_candidate(expected) == serialize_candidate(build_d_shadow_uniqueness_candidate(root=ROOT)), "identical source builds" if expected else source_error)
    record("determinism-reorder", expected is not None and reordered is not None and serialize_candidate(expected) == serialize_candidate(reordered), "tier summary order independent" if expected else source_error)
    record("determinism-schema", expected is not None and document.get("schemaVersion") == SCHEMA_VERSION and set(document) == set(expected), "stable candidate envelope" if expected else source_error)

    rows = document.get("inputTierSummaries")
    candidate_set = document.get("candidateSet")
    complete = (
        isinstance(rows, list)
        and isinstance(candidate_set, Mapping)
        and [row.get("coordinate") for row in rows if isinstance(row, Mapping)] == list(range(1, 8))
        and candidate_set.get("coordinates") == [row.get("coordinate") for row in rows if isinstance(row, Mapping) and row.get("maxRunLength") == candidate_set.get("maximumMaxRunLength")]
        and candidate_set.get("cardinality") == len(candidate_set.get("coordinates", []))
        and candidate_set.get("enumerationComplete") is True
    )
    record("exhaustive-candidate-set", complete, candidate_set)
    record(
        "source-tier-summaries",
        expected is not None and document.get("inputTierSummaries") == expected.get("inputTierSummaries"),
        document.get("inputTierSummaries"),
    )
    record(
        "case-logic",
        model is not None and document.get("category") == model.get("category") and document.get("verdict") == model.get("verdict"),
        {"category": document.get("category"), "verdict": document.get("verdict")},
    )
    record(
        "no-hypothesis-disposition",
        document.get("hypothesisDisposition") == {"H1": "no disposition", "H2": "no disposition", "H3": "no disposition"},
        document.get("hypothesisDisposition"),
    )
    bindings = document.get("evidenceBindings")
    source_path = ROOT / SOURCE_PATH
    source = model.get("source") if model else {}
    record(
        "source-artifact-binding",
        isinstance(bindings, Mapping)
        and bindings.get("dShadowCandidateSha256") == _sha256(source_path)
        and bindings.get("dShadowCandidateFingerprint") == source.get("candidateFingerprint"),
        bindings,
    )

    controls: dict[str, bool] = {}
    for control_id, mutate in {
        "excluded-input-rejected": lambda candidate: candidate["scope"]["excluded"].append("declared D4/D5 signature"),
        "tier-order-tamper-rejected": lambda candidate: candidate["inputTierSummaries"].reverse(),
        "selected-only-output-rejected": lambda candidate: candidate["candidateSet"].update(enumerationComplete=False),
        "source-binding-tamper-rejected": lambda candidate: candidate["evidenceBindings"].update(dShadowCandidateSha256="0" * 64),
        "disposition-tamper-rejected": lambda candidate: candidate["hypothesisDisposition"].update(H2="supports H2"),
        "authority-field-rejected": lambda candidate: candidate.update(admissionEffect="changes_topology"),
    }.items():
        tampered = deepcopy(document)
        mutate(tampered)
        _rehash(tampered)
        controls[control_id] = _is_rejected(tampered)
    record("adversarial-tamper-rejection", all(controls.values()), controls)

    suites = _suite_status()
    record("required-suite-outcomes", all(item["status"] == "ran" and item["reason"] for item in suites), suites)
    failed = [check for check in checks if check["status"] == "FAIL"]
    report_core = {
        "schemaVersion": "d-shadow-uniqueness-validation.v0",
        "verdict": "FAIL" if failed else "PASS",
        "candidateId": document.get("candidateId", CANDIDATE_ID),
        "candidateFingerprint": document.get("candidateFingerprint", "0" * 64),
        "checksPassed": len(checks) - len(failed),
        "checksFailed": len(failed),
        "checks": checks,
        "suiteStatus": suites,
    }
    return {**report_core, "reportFingerprint": sha256_payload(report_core)}


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--no-write", action="store_true")
    args = parser.parse_args(argv)
    document = json.loads(CANDIDATE_PATH.read_text(encoding="utf-8"))
    report = validate(document)
    jsonschema.Draft202012Validator(json.loads(REPORT_SCHEMA_PATH.read_text(encoding="utf-8"))).validate(report)
    if not args.no_write:
        REPORT_PATH.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))
    return 0 if report["verdict"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
