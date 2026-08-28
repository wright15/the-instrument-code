from __future__ import annotations

from copy import deepcopy
from fractions import Fraction
import importlib.util
import json
from pathlib import Path
import subprocess
import sys

import jsonschema
import pytest

from governor.harmonic_compression import (
    HarmonicCompressionError,
    build_harmonic_compression_candidate,
    serialize_harmonic_compression_candidate,
    verify_harmonic_compression_candidate,
)
from governor.certificate_verifier import (
    BINDING_IDS,
    WEIGHT_STAR,
    CertificateVerificationError,
    derive_constraint_rows,
    verify_certificate_semantics,
)
from governor.hashing import sha256_payload


ROOT = Path(__file__).resolve().parents[1]
CANDIDATE_PATH = ROOT / "canonical/harmonic-compression-candidates/CH_A012_q_v1.json"
SCHEMA_PATH = ROOT / "schemas/harmonic-compression-candidates/candidate-release.schema.json"
VALIDATOR_PATH = ROOT / "scripts/validate-harmonic-compression-candidates.py"


@pytest.fixture(scope="module")
def document():
    return json.loads(CANDIDATE_PATH.read_text(encoding="utf-8"))


def _rehash(document):
    core = {key: value for key, value in document.items() if key != "candidateFingerprint"}
    document["candidateFingerprint"] = sha256_payload(core)


def _validator_module():
    spec = importlib.util.spec_from_file_location("gov_213_validator", VALIDATOR_PATH)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_canonical_candidate_is_fresh_schema_valid_and_deterministic(document) -> None:
    expected = build_harmonic_compression_candidate(root=ROOT)
    second = build_harmonic_compression_candidate(root=ROOT)
    reversed_input = build_harmonic_compression_candidate(root=ROOT, reverse_input=True)
    assert CANDIDATE_PATH.read_bytes() == serialize_harmonic_compression_candidate(expected)
    assert serialize_harmonic_compression_candidate(expected) == serialize_harmonic_compression_candidate(second)
    assert serialize_harmonic_compression_candidate(expected) == serialize_harmonic_compression_candidate(reversed_input)
    jsonschema.Draft202012Validator(json.loads(SCHEMA_PATH.read_text())).validate(document)
    verify_harmonic_compression_candidate(document, root=ROOT)


def test_v1_schema_accepts_the_historical_certificate_free_payload(document) -> None:
    historical_payload = deepcopy(document)
    historical_payload.pop("certificate")
    jsonschema.Draft202012Validator(json.loads(SCHEMA_PATH.read_text())).validate(
        historical_payload
    )


def test_exact_scope_invariants_and_bands(document) -> None:
    assert len(document["records"]) == 21
    assert {record["tier"] for record in document["records"]} == {"A0", "A1", "A2"}
    assert all(record["role"] == "anchor" for record in document["records"])
    assert all(record["governorSeatCompressionClass"] == 2 for record in document["records"])
    assert [summary["unweightedSum"] for summary in document["tierSummaries"]] == [5, 8, 13]
    assert document["tierSummaries"][0]["minimum"] == {"stateId": 2773, "name": "Lydian", "value": {"numerator": 193, "denominator": 407}}
    assert document["tierSummaries"][0]["maximum"] == {"stateId": 1387, "name": "Locrian", "value": {"numerator": 346, "denominator": 407}}
    assert document["tierSummaries"][1]["minimum"]["value"]["numerator"] == 349
    assert document["tierSummaries"][1]["maximum"]["value"]["numerator"] == 574
    assert document["tierSummaries"][2]["minimum"]["value"]["numerator"] == 596
    assert document["tierSummaries"][2]["maximum"]["value"]["numerator"] == 860
    assert document["invariants"]["a0A1Gap"]["numerator"] == 3
    assert document["invariants"]["a1A2Gap"]["numerator"] == 22


def test_global_aggregate_namespace_remains_unresolved(document) -> None:
    assert document["globalAggregate"]["namespace"] == "harmonic.C_H"
    assert document["globalAggregate"]["status"] == "unresolved"
    assert document["globalAggregate"]["value"] is None


def test_exact_certificate_semantics_derives_the_full_constraint_census(document) -> None:
    rows = derive_constraint_rows(document["records"])
    assert len(rows) == 111
    assert all(isinstance(coefficient, Fraction) for row in rows for coefficient in row.coefficients)
    assert sum(row.group == "chaldean" for row in rows) == 7
    assert sum(row.group == "a0-order" for row in rows) == 6
    assert sum(row.group == "a1-a0" for row in rows) == 49
    assert sum(row.group == "a2-a1" for row in rows) == 49

    certificate = verify_certificate_semantics(document)
    assert certificate.tight_set == BINDING_IDS
    assert certificate.next_tightest_id == "Acoustic-Phrygian"
    assert certificate.next_tightest_value == Fraction(6, 407)
    assert certificate.maximum_margin == Fraction(3, 407)
    assert certificate.witness == WEIGHT_STAR
    assert certificate.tight_system_rank == 8


@pytest.mark.parametrize(
    ("mutator", "error"),
    [
        (
            lambda value: value["certificate"]["witness"]["weightNumerators"].__setitem__(0, 115),
            "certificate_witness_mismatch",
        ),
        (
            lambda value: value["certificate"]["tightSet"].__setitem__(0, "w1-w5"),
            "certificate_tight_set_mismatch",
        ),
        (
            lambda value: value["certificate"]["nextTightestSlack"].__setitem__("numerator", 7),
            "certificate_next_tightest_mismatch",
        ),
        (
            lambda value: value["certificate"]["dualCertificate"]["lambdaNumerators"].__setitem__(0, 0),
            "certificate_lambda_not_positive",
        ),
        (
            lambda value: (
                value["certificate"]["dualCertificate"]["lambdaNumerators"].__setitem__(0, 121),
                value["certificate"]["dualCertificate"]["lambdaNumerators"].__setitem__(1, 102),
            ),
            "certificate_dual_identity_failed",
        ),
        (
            lambda value: value["records"][0]["triadicCompressionSignature"].__setitem__(0, 1),
            "certificate_weighted_projection_mismatch:Locrian",
        ),
    ],
)
def test_certificate_semantics_rejects_tampering(document, mutator, error) -> None:
    tampered = deepcopy(document)
    mutator(tampered)
    with pytest.raises(CertificateVerificationError, match=error):
        verify_certificate_semantics(tampered)


def test_rehashed_certificate_tamper_is_rejected_before_fresh_build(document) -> None:
    tampered = deepcopy(document)
    tampered["certificate"]["dualCertificate"]["lambdaNumerators"][0] = 121
    tampered["certificate"]["dualCertificate"]["lambdaNumerators"][1] = 102
    _rehash(tampered)
    with pytest.raises(
        HarmonicCompressionError,
        match="certificate_semantic_verification_failed:certificate_dual_identity_failed",
    ):
        verify_harmonic_compression_candidate(tampered, root=ROOT)


def test_validator_uses_semantic_certificate_verification(document) -> None:
    tampered = deepcopy(document)
    tampered["certificate"]["dualCertificate"]["lambdaNumerators"][0] = 121
    tampered["certificate"]["dualCertificate"]["lambdaNumerators"][1] = 102
    report = _validator_module().validate(tampered)
    certificate_check = next(
        check for check in report["checks"] if check["checkId"] == "certificate-optimality"
    )
    assert certificate_check == {
        "checkId": "certificate-optimality",
        "status": "FAIL",
        "diagnostic": "certificate_dual_identity_failed",
    }


@pytest.mark.parametrize(
    ("mutator", "error"),
    [
        (
            lambda value: value["records"][0].update(role="satellite"),
            "candidate_does_not_match_fresh_build",
        ),
        (
            lambda value: value["records"][0].update(stateId=223, role="boundary"),
            "candidate_does_not_match_fresh_build",
        ),
        (
            lambda value: value["method"]["weightNumerators"].__setitem__(0, 35),
            "certificate_semantic_verification_failed:certificate_method_witness_mismatch",
        ),
        (
            lambda value: value["sourceBindings"][0].update(sha256="0" * 64),
            "candidate_does_not_match_fresh_build",
        ),
        (
            lambda value: value["globalAggregate"].update(status="admitted", value=1),
            "candidate_does_not_match_fresh_build",
        ),
    ],
)
def test_tampered_rehashed_candidate_is_rejected(document, mutator, error) -> None:
    tampered = deepcopy(document)
    mutator(tampered)
    _rehash(tampered)
    with pytest.raises(HarmonicCompressionError, match=error):
        verify_harmonic_compression_candidate(tampered, root=ROOT)


def test_builder_check_and_validator_commands_pass() -> None:
    build = subprocess.run(
        [sys.executable, "scripts/generate-harmonic-compression-candidates.py", "--check"],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    assert build.returncode == 0, build.stderr
    validation = subprocess.run(
        [sys.executable, "scripts/validate-harmonic-compression-candidates.py", "--no-write"],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    assert validation.returncode == 0, validation.stdout + validation.stderr
    assert json.loads(validation.stdout)["verdict"] == "PASS"
