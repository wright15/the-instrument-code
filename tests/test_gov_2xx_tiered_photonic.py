from __future__ import annotations

import json
from copy import deepcopy
from pathlib import Path
import shutil
import subprocess
import sys

import jsonschema
import pytest
import yaml

from governor.tiered_photonic import (
    TieredPhotonicError,
    build_tiered_photonic_candidate,
    serialize_tiered_photonic_candidate,
    verify_tiered_photonic_candidate,
)
from governor.hashing import sha256_payload

ROOT = Path(__file__).resolve().parents[1]
CANDIDATE_PATH = ROOT / "canonical/tiered-photonic-candidates/tiered-photonic-v1.json"
SCHEMA_PATH = ROOT / "schemas/tiered-photonic-candidates/candidate-release.schema.json"
DECLARED_SOURCE_PATHS = (
    "canonical/universal-heptatonic-ledger.json",
    "canonical/universal-network-data.json",
    "schemas/governors.yaml",
    "seven-governors-canonical-feature-profile-registry-v0.1.1/canonical/photonic-records.json",
    "seven-governors-harmonic-invariants-v0.1.0/canonical/compression-namespace-guard.json",
    "docs/TIERED_PHOTONIC_THEOREM.md",
)


@pytest.fixture(scope="module")
def document():
    return json.loads(CANDIDATE_PATH.read_text(encoding="utf-8"))


def _rehash(document):
    core = {k: v for k, v in document.items() if k != "candidateFingerprint"}
    document["candidateFingerprint"] = sha256_payload(core)


def _copy_declared_sources(destination: Path) -> None:
    for relative_path in DECLARED_SOURCE_PATHS:
        target = destination / relative_path
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(ROOT / relative_path, target)


def _write_json(path: Path, value) -> None:
    path.write_text(json.dumps(value), encoding="utf-8")


def test_canonical_candidate_is_fresh_schema_valid_and_deterministic(document) -> None:
    expected = build_tiered_photonic_candidate(root=ROOT)
    second = build_tiered_photonic_candidate(root=ROOT)
    rev = build_tiered_photonic_candidate(root=ROOT, reverse_input=True)
    assert CANDIDATE_PATH.read_bytes() == serialize_tiered_photonic_candidate(expected)
    assert serialize_tiered_photonic_candidate(expected) == serialize_tiered_photonic_candidate(second)
    assert serialize_tiered_photonic_candidate(expected) == serialize_tiered_photonic_candidate(rev)
    jsonschema.Draft202012Validator(json.loads(SCHEMA_PATH.read_text())).validate(document)
    verify_tiered_photonic_candidate(document, root=ROOT)


def test_scope_28_records_14_anchors_channel_blind(document) -> None:
    assert len(document["records"]) == 28
    assert document["scope"]["anchorStateCount"] == 14
    assert document["scope"]["recordCount"] == 28
    assert len({r["stateId"] for r in document["records"]}) == 14
    variants = [r["variant"] for r in document["records"]]
    assert variants.count("sum_mixing") == 14
    assert variants.count("geometric_mean") == 14
    assert all(r["channelIndependence"] is True for r in document["records"])
    assert all(len(r["parentStateIds"]) == 2 for r in document["records"])
    assert all(len(r["constructionEdgeIds"]) == 2 for r in document["records"])
    # seam inclusion 4/4 both variants
    seams = {1371, 2901, 1367, 3413}
    for sid in seams:
        assert sum(1 for r in document["records"] if r["stateId"] == sid) == 2


def test_photonic_compression_domain_per_variant(document) -> None:
    for r in document["records"]:
        if r["variant"] == "sum_mixing":
            assert r["photonicCompression"] is None
        else:
            assert isinstance(r["photonicCompression"], float)
            assert 0 <= r["photonicCompression"] <= 1


def test_mean_doubling_and_bands(document) -> None:
    doubling = document["method"]["sumDoubling"]
    assert abs(doubling["ratioA1"] - 2.0) < 1e-9
    assert abs(doubling["ratioA2"] - 2.0) < 1e-9
    expected_bands = {
        ("sum_mixing", "A1"): [216.09, 317.19],
        ("sum_mixing", "A2"): [114.06, 144.78],
        ("geometric_mean", "A1"): [433.59, 637.18],
        ("geometric_mean", "A2"): [462.79, 591.25],
    }
    assert document["method"]["variantA"]["numericBandA1Nm"] == expected_bands[("sum_mixing", "A1")]
    assert document["method"]["variantA"]["numericBandA2Nm"] == expected_bands[("sum_mixing", "A2")]
    assert document["method"]["variantB"]["numericBandA1Nm"] == expected_bands[("geometric_mean", "A1")]
    assert document["method"]["variantB"]["numericBandA2Nm"] == expected_bands[("geometric_mean", "A2")]
    assert document["invariants"]["strictBands"] == {
        "sum_A1": expected_bands[("sum_mixing", "A1")],
        "sum_A2": expected_bands[("sum_mixing", "A2")],
        "geom_A1": expected_bands[("geometric_mean", "A1")],
        "geom_A2": expected_bands[("geometric_mean", "A2")],
    }
    for record in document["records"]:
        assert record["bandMetadata"]["numericBandNm"] == expected_bands[
            (record["variant"], record["tier"])
        ]


def test_theorem_uses_current_identifier_and_authoritative_table() -> None:
    theorem = (ROOT / "docs/TIERED_PHOTONIC_THEOREM.md").read_text(encoding="utf-8")
    assert "GOV-2XX" in theorem
    assert "GOV-214" not in theorem
    assert "A1 `[216.09,317.19]`, A2 `[114.06,144.78]`" in theorem
    assert "A1 `[433.59,637.18]`, A2 `[462.79,591.25]`" in theorem
    for row in (
        "| Sun `k0` | 241.58 | 493.96 | 144.78 | 591.25 |",
        "| Moon `k1` | 317.19 | 637.18 | 130.45 | 529.97 |",
        "| Mars `k2` | 283.60 | 568.59 | 142.77 | 576.78 |",
        "| Mercury `k3` | 259.62 | 522.11 | 129.22 | 521.00 |",
        "| Jupiter `k4` | 237.40 | 477.39 | 117.93 | 475.80 |",
        "| Venus `k5` | 216.09 | 433.59 | 125.53 | 511.77 |",
        "| Saturn `k6` | 266.37 | 548.63 | 114.06 | 462.79 |",
    ):
        assert row in theorem


def test_global_aggregate_and_interpretation_flags(document) -> None:
    assert document["globalAggregate"]["namespace"] == "harmonic.C_H"
    assert document["globalAggregate"]["status"] == "unresolved"
    assert document["globalAggregate"]["value"] is None
    policy = document["interpretationPolicy"]
    assert policy["causationClaim"] is False
    assert policy["physicalQuantityClaim"] is False
    assert policy["tierClassifier"] is False
    assert policy["globalCHNull"] is True


def test_source_bindings_include_photonic_records(document) -> None:
    bindings = document["sourceBindings"]
    assert len(bindings) == 6
    assert any(b["bindingId"] == "photonic-records" for b in bindings)
    assert any(b["bindingId"] == "canonical-network-data" for b in bindings)
    assert [binding["path"] for binding in bindings] == list(DECLARED_SOURCE_PATHS)
    assert bindings[-1]["bindingId"] == "tiered-photonic-theorem"
    assert bindings[-1]["sha256"] != "0" * 64


def test_declared_sources_drive_candidate(tmp_path) -> None:
    source_root = tmp_path / "sources"
    _copy_declared_sources(source_root)
    baseline = build_tiered_photonic_candidate(root=source_root)

    governors_path = source_root / "schemas/governors.yaml"
    governors = yaml.safe_load(governors_path.read_text(encoding="utf-8"))
    governors["governors"]["sun"]["canonical_expression"]["wavelength_nm"] = 690
    governors_path.write_text(yaml.safe_dump(governors), encoding="utf-8")
    photonic_path = source_root / (
        "seven-governors-canonical-feature-profile-registry-v0.1.1/"
        "canonical/photonic-records.json"
    )
    photonic = json.loads(photonic_path.read_text(encoding="utf-8"))
    next(record for record in photonic["records"] if record["office"] == "Sun")[
        "representativeWavelengthNm"
    ] = 690
    _write_json(photonic_path, photonic)

    a0_mutated = build_tiered_photonic_candidate(root=source_root)
    assert a0_mutated["method"]["a0WavelengthsNm"]["Sun"] == 690
    assert a0_mutated["method"]["variantB"]["numericBandA1Nm"] != baseline["method"]["variantB"]["numericBandA1Nm"]
    with pytest.raises(TieredPhotonicError):
        verify_tiered_photonic_candidate(baseline, root=source_root)

    ledger_path = source_root / "canonical/universal-heptatonic-ledger.json"
    ledger = json.loads(ledger_path.read_text(encoding="utf-8"))
    source_anchor = next(
        record
        for record in ledger
        if record["role"] == "anchor" and record["tier"] == "A1"
    )
    source_anchor["name"] = "Source-derived A1 anchor"
    source_anchor_id = source_anchor["id"]
    _write_json(ledger_path, ledger)
    anchor_mutated = build_tiered_photonic_candidate(root=source_root)
    assert next(
        record["name"]
        for record in anchor_mutated["records"]
        if record["stateId"] == source_anchor_id
    ) == "Source-derived A1 anchor"

    for record in photonic["records"]:
        record["calculation"]["constants"]["speedOfLightMS"] = 299000000
    _write_json(photonic_path, photonic)
    constants_mutated = build_tiered_photonic_candidate(root=source_root)
    assert constants_mutated["method"]["constants"]["speedOfLightMS"] == 299000000
    assert constants_mutated["records"][0]["derivedFrequencyHz"] != anchor_mutated["records"][0]["derivedFrequencyHz"]


@pytest.mark.parametrize("mutation", ["a0", "anchors", "edges", "constants", "guard", "theorem"])
def test_invalid_declared_source_mutations_are_rejected(tmp_path, mutation) -> None:
    source_root = tmp_path / mutation
    _copy_declared_sources(source_root)

    if mutation == "a0":
        path = source_root / "schemas/governors.yaml"
        source = yaml.safe_load(path.read_text(encoding="utf-8"))
        source["governors"]["sun"]["canonical_expression"]["wavelength_nm"] = 900
        path.write_text(yaml.safe_dump(source), encoding="utf-8")
    elif mutation == "anchors":
        path = source_root / "canonical/universal-heptatonic-ledger.json"
        source = json.loads(path.read_text(encoding="utf-8"))
        next(
            record
            for record in source
            if record["role"] == "anchor" and record["tier"] == "A1"
        )["tier"] = "A0"
        _write_json(path, source)
    elif mutation == "edges":
        path = source_root / "canonical/universal-network-data.json"
        source = json.loads(path.read_text(encoding="utf-8"))
        next(
            edge for edge in source["structuralEdges"] if edge["type"] == "CONSTRUCTS"
        )["target"] = -1
        _write_json(path, source)
    elif mutation == "constants":
        path = source_root / (
            "seven-governors-canonical-feature-profile-registry-v0.1.1/"
            "canonical/photonic-records.json"
        )
        source = json.loads(path.read_text(encoding="utf-8"))
        source["records"][0]["calculation"]["constants"]["speedOfLightMS"] = 0
        _write_json(path, source)
    elif mutation == "guard":
        path = source_root / (
            "seven-governors-harmonic-invariants-v0.1.0/"
            "canonical/compression-namespace-guard.json"
        )
        source = json.loads(path.read_text(encoding="utf-8"))
        source["compressionGuard"]["status"] = "resolved"
        _write_json(path, source)
    else:
        path = source_root / "docs/TIERED_PHOTONIC_THEOREM.md"
        path.write_text("# Tiered Photonic Constants Theorem\n", encoding="utf-8")

    with pytest.raises(TieredPhotonicError):
        build_tiered_photonic_candidate(root=source_root)


@pytest.mark.parametrize(
    "mutator",
    [
        lambda d: d["records"][0].update(tier="A0"),
        lambda d: d["records"][0].update(derivedWavelengthNm=50.0),
        lambda d: d["interpretationPolicy"].update(causationClaim=True),
        lambda d: d["interpretationPolicy"].update(tierClassifier=True),
        lambda d: d["records"][0].update(parentStateIds=[2773, 2773]),
        lambda d: d["method"].update(variantA={**d["method"]["variantA"], "formula": "W-dependent"}),
        lambda d: d["method"]["a0WavelengthsNm"].__setitem__("Sun", 900),
        lambda d: d["sourceBindings"][5].__setitem__("sha256", "0" * 64),
    ],
)
def test_tampered_rehashed_candidate_is_rejected(document, mutator) -> None:
    tampered = deepcopy(document)
    mutator(tampered)
    # rehash record fingerprint if needed
    if tampered["records"][0].get("derivedWavelengthNm") == 50.0:
        core = {k: v for k, v in tampered["records"][0].items() if k != "recordFingerprint"}
        tampered["records"][0]["recordFingerprint"] = sha256_payload(core)
    if tampered["records"][0].get("parentStateIds") == [2773, 2773]:
        core = {k: v for k, v in tampered["records"][0].items() if k != "recordFingerprint"}
        tampered["records"][0]["recordFingerprint"] = sha256_payload(core)
    _rehash(tampered)
    with pytest.raises(TieredPhotonicError):
        verify_tiered_photonic_candidate(tampered, root=ROOT)


def test_builder_check_and_validator_commands_pass() -> None:
    build = subprocess.run(
        [sys.executable, "scripts/generate-tiered-photonic-candidates.py", "--check"],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    assert build.returncode == 0, build.stderr
    validation = subprocess.run(
        [sys.executable, "scripts/validate-tiered-photonic-candidates.py"],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    assert validation.returncode == 0, validation.stdout + validation.stderr
    assert json.loads(validation.stdout)["verdict"] == "PASS"
