from __future__ import annotations

from copy import deepcopy
from fractions import Fraction
import hashlib
import json
from pathlib import Path
import subprocess
import sys

import jsonschema
import pytest

from governor.exact_lp import ExactLPError, solve_exact_lp
from governor.harmonic_compression_d_tier import (
    A_TIER_FILE_SHA256,
    DTierHarmonicCompressionError,
    build_d_tier_harmonic_compression_candidate,
    derive_q_v2_domain,
    q_v2_value,
    serialize_d_tier_candidate,
    verify_d_tier_candidate,
)
from governor.hashing import sha256_payload


ROOT = Path(__file__).resolve().parents[1]
CANDIDATE_PATH = ROOT / "canonical/harmonic-compression-candidates/CH_D17_q_v2.json"
SCHEMA_PATH = ROOT / "schemas/harmonic-compression-candidates/d-tier-candidate-release.schema.json"
A_TIER_PATH = ROOT / "canonical/harmonic-compression-candidates/CH_A012_q_v1.json"


@pytest.fixture(scope="module")
def document():
    return json.loads(CANDIDATE_PATH.read_text(encoding="utf-8"))


def _rehash(document):
    core = {key: value for key, value in document.items() if key != "candidateFingerprint"}
    document["candidateFingerprint"] = sha256_payload(core)


def test_exact_lp_solver_and_input_guards() -> None:
    result = solve_exact_lp([[-1], [1]], [0, 1], [1])
    assert result.status == "OPTIMAL"
    assert result.objective == Fraction(1)
    assert result.variables == (Fraction(1),)
    assert solve_exact_lp([[1], [-1]], [0, -1], [1]).status == "INFEASIBLE"
    assert solve_exact_lp([[-1]], [0], [1], max_iterations=1).status in {"LIMIT", "UNBOUNDED"}
    with pytest.raises(ExactLPError, match="exact_rationals"):
        solve_exact_lp([[0.5]], [1], [1])


def test_candidate_is_fresh_schema_valid_and_deterministic(document) -> None:
    first = build_d_tier_harmonic_compression_candidate(root=ROOT)
    second = build_d_tier_harmonic_compression_candidate(root=ROOT)
    reversed_input = build_d_tier_harmonic_compression_candidate(root=ROOT, reverse_input=True)
    assert CANDIDATE_PATH.read_bytes() == serialize_d_tier_candidate(first)
    assert serialize_d_tier_candidate(first) == serialize_d_tier_candidate(second)
    assert serialize_d_tier_candidate(first) == serialize_d_tier_candidate(reversed_input)
    jsonschema.Draft202012Validator(json.loads(SCHEMA_PATH.read_text())).validate(document)
    verify_d_tier_candidate(document, root=ROOT)


def test_q_v2_reproduces_q_v1_and_scales(document) -> None:
    ledger = json.loads((ROOT / "canonical/universal-heptatonic-ledger.json").read_text())
    domain = derive_q_v2_domain(ledger)
    expected = {(4, 7): 0, (3, 7): 1, (3, 6): 2, (4, 8): 2, (2, 6): 3, (4, 6): 3}
    assert {signature: q_v2_value(*signature, domain=domain) for signature in expected} == expected
    assert q_v2_value(2, 4, domain=domain) == 2
    assert max(item["value"] for item in document["method"]["signatureClasses"]) == 7


def test_scope_tier_multisets_and_z_partner_evidence(document) -> None:
    assert len(document["records"]) == 49
    assert {record["tier"] for record in document["records"]} == {f"D{index}" for index in range(1, 8)}
    assert all(record["role"] == "anchor" for record in document["records"])
    expected_sums = {"D1": 10, "D2": 34, "D3": 40, "D4": 19, "D5": 34, "D6": 26, "D7": 26}
    assert {item["tier"]: item["unweightedSum"] for item in document["tierSummaries"]} == expected_sums
    assert document["comparisonEvidence"]["zPartnerD3D4"] == {
        "d3Forte": "7-Z37",
        "d4Forte": "7-Z17",
        "sharedIntervalVector": [4, 3, 4, 5, 4, 1],
        "intervalVectorsEqual": True,
        "distinctRawSignatureMultisets": True,
        "distinctQMultisets": True,
        "crossTierQTupleCollisionCount": 0,
    }
    assert document["comparisonEvidence"]["d2D5MultisetTwins"] == {
        "d2Forte": "7-15",
        "d5Forte": "7-Z12",
        "sharedQMultiset": [2, 3, 3, 6, 6, 7, 7],
        "sharedUnweightedSum": 34,
        "distinctRawSignatureMultisets": True,
        "crossTierQTupleCollisionCount": 0,
        "interpretation": "rooted Q tuple required for discrimination, not the q_v2 multiset",
    }


def test_exact_lp_reports_interleaving_not_a_witness(document) -> None:
    audit = document["linearProgrammingAudit"]
    assert audit["calibration"]["status"] == "OPTIMAL_STRICT"
    assert audit["calibration"]["weights"] == [
        {"numerator": value, "denominator": 1}
        for value in [116, 56, 41, 35, 77, 44, 38]
    ]
    assert audit["calibration"]["margin"] == {"numerator": 3, "denominator": 1}
    assert audit["fixedWitness"]["declaredOrderStrictlySeparated"] is False
    assert [item["relation"] for item in audit["fixedWitness"]["adjacentComparisons"]] == [
        "disjoint", "disjoint", "overlap", "disjoint", "overlap", "overlap", "disjoint", "overlap", "overlap"
    ]
    assert {item["status"] for item in audit["models"]} == {"WEAK_SYSTEM_INFEASIBLE"}
    assert all(item["verification"] == "phase_one_exact_infeasibility" for item in audit["models"])


def test_a_tier_and_global_boundaries_remain_unchanged(document) -> None:
    assert A_TIER_PATH.stat().st_size == 16_008
    assert hashlib.sha256(A_TIER_PATH.read_bytes()).hexdigest() == A_TIER_FILE_SHA256
    assert document["globalAggregate"]["status"] == "unresolved"
    assert document["globalAggregate"]["value"] is None
    assert document["status"] == "admitted_scoped_D17"
    assert document["admissionEffect"] == "Q_and_W_D17_only"
    assert document["reviewGate"] == {"stage": "B", "releaseBinding": "admitted_in_release_1_6_0", "neo4jIntegration": "prohibited"}


@pytest.mark.parametrize(
    "mutator",
    [
        lambda value: value["records"][0].update(role="satellite"),
        lambda value: value["records"][0].update(tier="A0"),
        lambda value: value["method"]["signatureClasses"][0].update(value=99),
        lambda value: value["linearProgrammingAudit"]["models"][0].update(status="OPTIMAL_STRICT"),
        lambda value: value["globalAggregate"].update(status="admitted", value=1),
    ],
)
def test_tampered_rehashed_candidate_is_rejected(document, mutator) -> None:
    tampered = deepcopy(document)
    mutator(tampered)
    _rehash(tampered)
    with pytest.raises(DTierHarmonicCompressionError, match="candidate_does_not_match_fresh_build"):
        verify_d_tier_candidate(tampered, root=ROOT)


def test_generator_check_and_validator_commands_pass() -> None:
    build = subprocess.run([sys.executable, "scripts/generate-d-tier-harmonic-compression.py", "--check"], cwd=ROOT, capture_output=True, text=True, check=False)
    assert build.returncode == 0, build.stderr
    validation = subprocess.run([sys.executable, "scripts/validate-d-tier-harmonic-compression.py"], cwd=ROOT, capture_output=True, text=True, check=False)
    assert validation.returncode == 0, validation.stdout + validation.stderr
    assert json.loads(validation.stdout)["verdict"] == "PASS"
