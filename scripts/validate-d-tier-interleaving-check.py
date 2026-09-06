#!/usr/bin/env python3
"""Validate the bounded GOV-514 reproduction receipt."""

from __future__ import annotations

import argparse
from copy import deepcopy
import hashlib
import json
import subprocess
import sys
from pathlib import Path
from typing import Any, Mapping

import jsonschema

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))
sys.path.insert(0, str(ROOT / "court-mathematics/src"))

from governor.d_tier_interleaving_check import (
    CANDIDATE_ID,
    DTierInterleavingError,
    SCHEMA_VERSION,
    build_d_tier_interleaving_candidate,
    derive_d_tier_interleaving_model,
    serialize_candidate,
    verify_candidate,
)
from governor.hashing import sha256_payload


CANDIDATE_PATH = ROOT / "canonical/fivefold-incubator/d-tier-interleaving-check-v0.json"
CANDIDATE_SCHEMA_PATH = ROOT / "schemas/fivefold-incubator/d-tier-interleaving-check-v0.schema.json"
REPORT_PATH = ROOT / "qa/d-tier-interleaving-check-validation.json"
REPORT_SCHEMA_PATH = ROOT / "schemas/fivefold-incubator/d-tier-interleaving-check-validation.schema.json"


def _sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _rehash(document: dict[str, Any]) -> None:
    document["candidateFingerprint"] = sha256_payload(
        {key: value for key, value in document.items() if key != "candidateFingerprint"}
    )


def _is_rejected(document: dict[str, Any]) -> bool:
    try:
        verify_candidate(document, root=ROOT)
    except DTierInterleavingError:
        return True
    return False


def _run_suite(suite: str, command: list[str], reason: str) -> dict[str, str]:
    result = subprocess.run(command, cwd=ROOT, capture_output=True, text=True, check=False)
    if result.returncode == 0:
        return {"suite": suite, "status": "ran", "reason": reason}
    diagnostic = (result.stderr or result.stdout).strip().replace("\n", " ")[:400]
    return {"suite": suite, "status": "skipped", "reason": f"command failed ({result.returncode}): {diagnostic or 'no diagnostic'}"}


def _suite_status() -> list[dict[str, str]]:
    return [
        _run_suite("fresh-source", [sys.executable, "scripts/generate-d-tier-harmonic-compression.py", "--check"], "fresh GOV-227 source sidecar check executed"),
        _run_suite("validator", [sys.executable, "scripts/validate-d-tier-harmonic-compression.py"], "GOV-227 validator executed"),
        _run_suite("focused-test", [sys.executable, "-m", "pytest", "-p", "no:cacheprovider", "-q", "tests/test_gov_227_d_tier_harmonic_compression.py"], "GOV-227 focused test suite executed"),
        _run_suite("gov227-validation-command", ["npm", "run", "validate:gov227", "--silent"], "ticket-required GOV-227 validation command executed"),
    ]


def validate(document: Mapping[str, Any], *, suite_status: list[dict[str, str]] | None = None) -> dict[str, Any]:
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
        model = derive_d_tier_interleaving_model(root=ROOT)
        expected = build_d_tier_interleaving_candidate(root=ROOT)
        reordered = build_d_tier_interleaving_candidate(root=ROOT, reverse_input=True)
    except DTierInterleavingError as error:
        model = expected = reordered = None
        source_error = str(error)
    else:
        source_error = None

    record("freshness", expected is not None and serialize_candidate(document) == serialize_candidate(expected), expected["candidateFingerprint"] if expected else source_error)
    record("determinism-build-twice", expected is not None and serialize_candidate(expected) == serialize_candidate(build_d_tier_interleaving_candidate(root=ROOT)), "identical fresh reproductions" if expected else source_error)
    record("determinism-reorder", expected is not None and reordered is not None and serialize_candidate(expected) == serialize_candidate(reordered), "ledger order independent" if expected else source_error)
    record("determinism-schema", expected is not None and document.get("schemaVersion") == SCHEMA_VERSION and set(document) == set(expected), "stable candidate envelope" if expected else source_error)

    fixed = document.get("fixedWitness", {})
    comparisons = fixed.get("adjacentComparisons", []) if isinstance(fixed, Mapping) else []
    record(
        "all-declared-adjacent-gaps",
        len(comparisons) == 9
        and [item.get("relation") for item in comparisons if isinstance(item, Mapping)] == ["disjoint", "disjoint", "overlap", "disjoint", "overlap", "overlap", "disjoint", "overlap", "overlap"]
        and fixed.get("declaredOrderStrictlySeparated") is False,
        comparisons,
    )
    models = document.get("lpModels", [])
    record(
        "exact-lp-models",
        isinstance(models, list)
        and len(models) == 3
        and all(isinstance(model, Mapping) and model.get("status") == "WEAK_SYSTEM_INFEASIBLE" and model.get("verification") == "phase_one_exact_infeasibility" for model in models),
        models,
    )
    controls = document.get("collisionControls", {})
    record(
        "quotient-controls",
        isinstance(controls, Mapping)
        and controls.get("d2D5MultisetTwins", {}).get("sharedQMultiset") == [2, 3, 3, 6, 6, 7, 7]
        and controls.get("zPartnerD3D4", {}).get("intervalVectorsEqual") is True,
        controls,
    )
    record("verdict-case-logic", document.get("verdict") == (model or {}).get("verdict") and document.get("verdict") in {"confirmed", "partial", "refuted"}, document.get("verdict"))
    record(
        "global-boundary",
        document.get("scope", {}).get("excluded") == ["satellites", "boundary states", "runtime", "Neo4j", "global harmonic.C_H"],
        document.get("scope"),
    )
    bindings = document.get("evidenceBindings", {})
    record(
        "source-bindings",
        isinstance(bindings, Mapping)
        and bindings.get("gov227CandidateSha256") == _sha256(ROOT / "canonical/harmonic-compression-candidates/CH_D17_q_v2.json")
        and bindings.get("canonicalLedgerSha256") == _sha256(ROOT / "canonical/universal-heptatonic-ledger.json")
        and bindings.get("gov227GeneratorSha256") == _sha256(ROOT / "src/governor/harmonic_compression_d_tier.py")
        and bindings == (model or {}).get("sourceBindings"),
        bindings,
    )

    controls_result: dict[str, bool] = {}
    for control_id, mutate in {
        "D4-D5-cherry-pick-rejected": lambda candidate: candidate["fixedWitness"].update(adjacentComparisons=candidate["fixedWitness"]["adjacentComparisons"][6:7]),
        "LP-status-tamper-rejected": lambda candidate: candidate["lpModels"][0].update(status="OPTIMAL_STRICT"),
        "q-multiset-tamper-rejected": lambda candidate: candidate["collisionControls"]["d2D5MultisetTwins"].update(sharedQMultiset=[]),
        "source-binding-tamper-rejected": lambda candidate: candidate["evidenceBindings"].update(gov227CandidateSha256="0" * 64),
        "authority-field-rejected": lambda candidate: candidate.update(admissionEffect="changes_topology"),
    }.items():
        tampered = deepcopy(document)
        mutate(tampered)
        _rehash(tampered)
        controls_result[control_id] = _is_rejected(tampered)
    record("adversarial-tamper-rejection", all(controls_result.values()), controls_result)

    if suite_status is None:
        suite_status = _suite_status()
    record("required-suite-outcomes", all(item["status"] == "ran" for item in suite_status), suite_status)
    failed = [check for check in checks if check["status"] == "FAIL"]
    report_core = {
        "schemaVersion": "d-tier-interleaving-check-validation.v0",
        "verdict": "FAIL" if failed else "PASS",
        "candidateId": document.get("candidateId", CANDIDATE_ID),
        "candidateFingerprint": document.get("candidateFingerprint", "0" * 64),
        "checksPassed": len(checks) - len(failed),
        "checksFailed": len(failed),
        "checks": checks,
        "suiteStatus": suite_status,
    }
    return {**report_core, "reportFingerprint": sha256_payload(report_core)}


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--no-write", action="store_true")
    args = parser.parse_args(argv)
    suites = _suite_status()
    document = json.loads(CANDIDATE_PATH.read_text(encoding="utf-8"))
    report = validate(document, suite_status=suites)
    jsonschema.Draft202012Validator(json.loads(REPORT_SCHEMA_PATH.read_text(encoding="utf-8"))).validate(report)
    if not args.no_write:
        REPORT_PATH.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))
    return 0 if report["verdict"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
