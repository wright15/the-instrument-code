#!/usr/bin/env python3
"""Validate GOV-227 D-tier harmonic-compression evidence."""

from __future__ import annotations

from copy import deepcopy
import hashlib
import json
from pathlib import Path
import sys

import jsonschema


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))
sys.path.insert(0, str(ROOT / "court-mathematics/src"))

from court_mathematics import RootedScale  # noqa: E402
from governor.harmonic_compression import GLOBAL_GUARD_LITERAL  # noqa: E402
from governor.harmonic_compression_d_tier import (  # noqa: E402
    A_TIER_FILE_SHA256,
    D_TIERS,
    DTierHarmonicCompressionError,
    build_d_tier_harmonic_compression_candidate,
    derive_q_v2_domain,
    q_v2_signature,
    serialize_d_tier_candidate,
    verify_d_tier_candidate,
)
from governor.hashing import sha256_payload  # noqa: E402


CANDIDATE_PATH = ROOT / "canonical/harmonic-compression-candidates/CH_D17_q_v2.json"
SCHEMA_PATH = ROOT / "schemas/harmonic-compression-candidates/d-tier-candidate-release.schema.json"
REPORT_SCHEMA_PATH = ROOT / "schemas/harmonic-compression-candidates/d-tier-validation-report.schema.json"
REPORT_PATH = ROOT / "qa/d-tier-harmonic-compression-validation.json"
NEGATIVE_CASES_PATH = ROOT / "canonical/harmonic-compression-candidates/d-tier-negative-cases.json"
A_TIER_PATH = ROOT / "canonical/harmonic-compression-candidates/CH_A012_q_v1.json"


def _read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def _rehash_record(record: dict) -> None:
    core = {key: value for key, value in record.items() if key != "recordFingerprint"}
    record["recordFingerprint"] = sha256_payload(core)


def _rehash(document: dict) -> None:
    core = {key: value for key, value in document.items() if key != "candidateFingerprint"}
    document["candidateFingerprint"] = sha256_payload(core)


def _expect_rejected(document: dict) -> bool:
    try:
        verify_d_tier_candidate(document, root=ROOT)
    except DTierHarmonicCompressionError:
        return True
    return False


def _transposition_invariance(document: dict) -> list[int]:
    ledger = _read_json(ROOT / "canonical/universal-heptatonic-ledger.json")
    domain = derive_q_v2_domain(ledger)
    failures = []
    for record in document["records"]:
        base = RootedScale.from_pitch_classes(record["pitchClasses"], root=0)
        expected = tuple(record["triadicCompressionSignature"])
        for shift in range(12):
            actual, _ = q_v2_signature(base.transpose(shift), domain=domain)
            if actual != expected:
                failures.append(record["stateId"])
                break
    return failures


def _modal_covariance(document: dict) -> list[int]:
    ledger = _read_json(ROOT / "canonical/universal-heptatonic-ledger.json")
    domain = derive_q_v2_domain(ledger)
    failures = []
    for record in document["records"]:
        scale = RootedScale.from_pitch_classes(record["pitchClasses"], root=0)
        initial, _ = q_v2_signature(scale, domain=domain)
        current = scale
        for _ in range(7):
            next_root = current.ordered_pitch_classes[1]
            next_scale = RootedScale(current.pitch_set, next_root)
            next_signature, _ = q_v2_signature(next_scale, domain=domain)
            current_signature, _ = q_v2_signature(current, domain=domain)
            if next_signature != current_signature[1:] + current_signature[:1]:
                failures.append(record["stateId"])
                break
            current = next_scale
        final, _ = q_v2_signature(current, domain=domain)
        if final != initial or current.root != scale.root:
            failures.append(record["stateId"])
    return sorted(set(failures))


def _adversarial_results(document: dict) -> dict[str, bool]:
    results = {}

    tampered = deepcopy(document)
    tampered["records"][0]["role"] = "satellite"
    _rehash_record(tampered["records"][0]); _rehash(tampered)
    results["d-tier-satellite-selection"] = _expect_rejected(tampered)

    tampered = deepcopy(document)
    tampered["records"][0].update(stateId=223, role="boundary")
    _rehash_record(tampered["records"][0]); _rehash(tampered)
    results["boundary-selection"] = _expect_rejected(tampered)

    tampered = deepcopy(document)
    tampered["records"][0]["tier"] = "A0"
    _rehash_record(tampered["records"][0]); _rehash(tampered)
    results["a-tier-selection"] = _expect_rejected(tampered)

    tampered = deepcopy(document)
    tampered["records"][0]["triadicCompressionSignature"][0] += 1
    _rehash_record(tampered["records"][0]); _rehash(tampered)
    results["q-v2-signature-tamper"] = _expect_rejected(tampered)

    tampered = deepcopy(document)
    tampered["linearProgrammingAudit"]["models"][0]["status"] = "OPTIMAL_STRICT"
    tampered["linearProgrammingAudit"]["models"][0]["margin"] = {"numerator": 1, "denominator": 407}
    _rehash(tampered)
    results["lp-result-tamper"] = _expect_rejected(tampered)

    tampered = deepcopy(document)
    tampered["sourceBindings"][0]["sha256"] = "0" * 64
    _rehash(tampered)
    results["source-hash-drift"] = _expect_rejected(tampered)

    tampered = deepcopy(document)
    next(
        binding
        for binding in tampered["sourceBindings"]
        if binding["bindingId"] == "a-tier-byte-pinned-baseline"
    )["sha256"] = "0" * 64
    _rehash(tampered)
    results["a-tier-baseline-drift"] = _expect_rejected(tampered)

    tampered = deepcopy(document)
    tampered["globalAggregate"].update(status="admitted", value=1)
    _rehash(tampered)
    results["global-C-H-promotion"] = _expect_rejected(tampered)

    return results


def validate(document: dict) -> dict:
    checks = []

    def record(check_id: str, passed: bool, diagnostic) -> None:
        checks.append({"checkId": check_id, "status": "PASS" if passed else "FAIL", "diagnostic": diagnostic})

    try:
        jsonschema.Draft202012Validator(_read_json(SCHEMA_PATH)).validate(document)
        record("schema", True, "valid")
    except jsonschema.ValidationError as error:
        record("schema", False, error.message)

    core = {key: value for key, value in document.items() if key != "candidateFingerprint"}
    record("candidate-fingerprint", document.get("candidateFingerprint") == sha256_payload(core), document.get("candidateFingerprint"))
    expected = build_d_tier_harmonic_compression_candidate(root=ROOT)
    record("checked-artifact-freshness", serialize_d_tier_candidate(document) == serialize_d_tier_candidate(expected), {"expected": expected["candidateFingerprint"], "actual": document.get("candidateFingerprint")})
    first = build_d_tier_harmonic_compression_candidate(root=ROOT)
    second = build_d_tier_harmonic_compression_candidate(root=ROOT)
    reversed_input = build_d_tier_harmonic_compression_candidate(root=ROOT, reverse_input=True)
    record("build-twice-identity", serialize_d_tier_candidate(first) == serialize_d_tier_candidate(second), first["candidateFingerprint"])
    record("reordered-input-identity", serialize_d_tier_candidate(first) == serialize_d_tier_candidate(reversed_input), reversed_input["candidateFingerprint"])

    records = document.get("records", [])
    record("scope-closure", len(records) == 49 and all(item.get("role") == "anchor" and item.get("tier") in D_TIERS for item in records) and {item["tier"] for item in records} == set(D_TIERS), {"recordCount": len(records), "tiers": sorted({item.get("tier") for item in records})})
    fidelity = document.get("comparisonEvidence", {}).get("qV1Fidelity", [])
    record("q-v1-fidelity", len(fidelity) == 6 and all(item["qV1Value"] == item["qV2Value"] for item in fidelity), fidelity)
    signature_classes = document.get("method", {}).get("signatureClasses", [])
    record("q-v2-domain-closure", len(signature_classes) == 21 and max(item["value"] for item in signature_classes) > 3 and next(item for item in signature_classes if item["signature"] == [2, 4])["value"] == 2, signature_classes)
    z_partner = document.get("comparisonEvidence", {}).get("zPartnerD3D4", {})
    record("D3-D4-z-partner-discrimination", z_partner.get("intervalVectorsEqual") is True and z_partner.get("distinctRawSignatureMultisets") is True and z_partner.get("distinctQMultisets") is True and z_partner.get("crossTierQTupleCollisionCount") == 0, z_partner)
    d2_d5 = document.get("comparisonEvidence", {}).get("d2D5MultisetTwins", {})
    record("D2-D5-multiset-twins", d2_d5 == {"d2Forte": "7-15", "d5Forte": "7-Z12", "sharedQMultiset": [2, 3, 3, 6, 6, 7, 7], "sharedUnweightedSum": 34, "distinctRawSignatureMultisets": True, "crossTierQTupleCollisionCount": 0, "interpretation": "rooted Q tuple required for discrimination, not the q_v2 multiset"}, d2_d5)

    lp_audit = document.get("linearProgrammingAudit", {})
    models = lp_audit.get("models", [])
    calibration = lp_audit.get("calibration", {})
    record("exact-lp-audit-replay", len(models) == 3 and calibration.get("status") == "OPTIMAL_STRICT" and calibration.get("weights") == [{"numerator": value, "denominator": 1} for value in [116, 56, 41, 35, 77, 44, 38]] and calibration.get("margin") == {"numerator": 3, "denominator": 1} and all(item.get("status") == "WEAK_SYSTEM_INFEASIBLE" and item.get("verification") == "phase_one_exact_infeasibility" for item in models) and lp_audit.get("fixedWitness", {}).get("declaredOrderStrictlySeparated") is False, {"calibration": calibration, "models": models, "fixedWitnessSeparated": lp_audit.get("fixedWitness", {}).get("declaredOrderStrictlySeparated")})

    transposition_failures = _transposition_invariance(document)
    record("joint-transposition-invariance", not transposition_failures, transposition_failures)
    modal_failures = _modal_covariance(document)
    record("modal-M7-covariance", not modal_failures, modal_failures)

    fixture_case_ids = {item["caseId"] for item in _read_json(NEGATIVE_CASES_PATH)["cases"]}
    adversarial = _adversarial_results(document)
    record("adversarial-tamper-rejection", set(adversarial) == fixture_case_ids and all(adversarial.values()), adversarial)

    a_tier_sha = hashlib.sha256(A_TIER_PATH.read_bytes()).hexdigest()
    record("A-tier-byte-pin", A_TIER_PATH.stat().st_size == 15_208 and a_tier_sha == A_TIER_FILE_SHA256, {"bytes": A_TIER_PATH.stat().st_size, "sha256": a_tier_sha})
    aggregate = document.get("globalAggregate", {})
    record("global-C-H-remains-unresolved", aggregate == {"namespace": "harmonic.C_H", "status": "unresolved", "value": None, "guardLiteral": GLOBAL_GUARD_LITERAL}, aggregate)
    review_gate = document.get("reviewGate", {})
    record("Stage-B-admission-boundary", document.get("releaseId") == "harmonic-compression-candidate:CH_D17_q_v2:1.0.0" and document.get("status") == "admitted_scoped_D17" and document.get("admissionEffect") == "Q_and_W_D17_only" and review_gate == {"stage": "B", "releaseBinding": "admitted_in_release_1_6_0", "neo4jIntegration": "prohibited"}, review_gate)

    failed = [check for check in checks if check["status"] == "FAIL"]
    report_core = {
        "schemaVersion": "gov-227.d-tier-harmonic-compression-validation.v1",
        "verdict": "FAIL" if failed else "PASS",
        "candidateId": "CH_D17_q_v2",
        "candidateFingerprint": document.get("candidateFingerprint", "0" * 64),
        "checksPassed": len(checks) - len(failed),
        "checksFailed": len(failed),
        "checks": checks,
    }
    return {**report_core, "reportFingerprint": sha256_payload(report_core)}


def main() -> int:
    document = _read_json(CANDIDATE_PATH)
    report = validate(document)
    jsonschema.Draft202012Validator(_read_json(REPORT_SCHEMA_PATH)).validate(report)
    REPORT_PATH.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))
    return 0 if report["verdict"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
