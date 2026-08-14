from __future__ import annotations

from copy import deepcopy
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
from governor.hashing import sha256_payload


ROOT = Path(__file__).resolve().parents[1]
CANDIDATE_PATH = ROOT / "canonical/harmonic-compression-candidates/CH_A012_q_v1.json"
SCHEMA_PATH = ROOT / "schemas/harmonic-compression-candidates/candidate-release.schema.json"


@pytest.fixture(scope="module")
def document():
    return json.loads(CANDIDATE_PATH.read_text(encoding="utf-8"))


def _rehash(document):
    core = {key: value for key, value in document.items() if key != "candidateFingerprint"}
    document["candidateFingerprint"] = sha256_payload(core)


def test_canonical_candidate_is_fresh_schema_valid_and_deterministic(document) -> None:
    expected = build_harmonic_compression_candidate(root=ROOT)
    second = build_harmonic_compression_candidate(root=ROOT)
    reversed_input = build_harmonic_compression_candidate(root=ROOT, reverse_input=True)
    assert CANDIDATE_PATH.read_bytes() == serialize_harmonic_compression_candidate(expected)
    assert serialize_harmonic_compression_candidate(expected) == serialize_harmonic_compression_candidate(second)
    assert serialize_harmonic_compression_candidate(expected) == serialize_harmonic_compression_candidate(reversed_input)
    jsonschema.Draft202012Validator(json.loads(SCHEMA_PATH.read_text())).validate(document)
    verify_harmonic_compression_candidate(document, root=ROOT)


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


@pytest.mark.parametrize(
    "mutator",
    [
        lambda value: value["records"][0].update(role="satellite"),
        lambda value: value["records"][0].update(stateId=223, role="boundary"),
        lambda value: value["method"]["weightNumerators"].__setitem__(0, 35),
        lambda value: value["sourceBindings"][0].update(sha256="0" * 64),
        lambda value: value["globalAggregate"].update(status="admitted", value=1),
    ],
)
def test_tampered_rehashed_candidate_is_rejected(document, mutator) -> None:
    tampered = deepcopy(document)
    mutator(tampered)
    _rehash(tampered)
    with pytest.raises(HarmonicCompressionError, match="candidate_does_not_match_fresh_build"):
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
        [sys.executable, "scripts/validate-harmonic-compression-candidates.py"],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    assert validation.returncode == 0, validation.stdout + validation.stderr
    assert json.loads(validation.stdout)["verdict"] == "PASS"
