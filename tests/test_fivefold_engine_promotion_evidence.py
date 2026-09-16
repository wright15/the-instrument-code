from __future__ import annotations

from copy import deepcopy
import hashlib
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
from typing import Any

import jsonschema
import pytest


ROOT = Path(__file__).resolve().parents[1]
GENERATOR_PATH = ROOT / "scripts/build-fivefold-engine-promotion-evidence.py"
VALIDATOR_PATH = ROOT / "scripts/validate-fivefold-engine-promotion-evidence.py"
EVIDENCE_PATH = ROOT / "qa/fivefold-engine-promotion-evidence.json"
EVIDENCE_SCHEMA_PATH = ROOT / "schemas/fivefold-engine-promotion-evidence.schema.json"
CONTRACT_PATH = ROOT / "schemas/fivefold-engine-admission-contract.json"
CONTRACT_SCHEMA_PATH = ROOT / "schemas/fivefold-engine-admission-contract.schema.json"

FROZEN_ENGINE_SHA256 = "9cbf038c93a72719387e6a8094f5b466a79e61ce03371f5b2334fb26a480b64a"

PROMOTION_ITEMS = [
    "fivefold_engine.physical_quantity_claim=false",
    "fivefold_engine.pole_order",
    "fivefold_engine.bit_semantics",
    "fivefold_engine.canonical_states",
    "fivefold_engine.canonical_transitions",
    "fivefold_engine.geometry.kappa_formula",
    "fivefold_engine.geometry.paired_mask_hamming_formula",
    "fivefold_engine.geometry.signed_gram_matrix",
    "fivefold_engine.geometry.canonical_path_size",
    "fivefold_engine.guards",
]

ZODIAC_NAMES = (
    "Aries", "Scorpio", "Sagittarius", "Pisces", "Libra", "Taurus",
    "Aquarius", "Capricorn", "Gemini", "Virgo", "Leo", "Cancer",
)


def _load_module(path: Path, name: str):
    spec = importlib.util.spec_from_file_location(name, path)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


GENERATOR = _load_module(GENERATOR_PATH, "fivefold_promotion_evidence_generator")
VALIDATOR = _load_module(VALIDATOR_PATH, "fivefold_promotion_evidence_validator")


@pytest.fixture(scope="module")
def evidence() -> dict[str, Any]:
    return json.loads(EVIDENCE_PATH.read_text(encoding="utf-8"))


@pytest.fixture(scope="module")
def contract() -> dict[str, Any]:
    return json.loads(CONTRACT_PATH.read_text(encoding="utf-8"))


def test_evidence_is_fresh_schema_valid_and_fingerprinted(evidence) -> None:
    rebuilt = GENERATOR.build_evidence(ROOT)
    assert GENERATOR._canonical_bytes(rebuilt) + b"\n" == EVIDENCE_PATH.read_bytes()
    jsonschema.Draft202012Validator(
        json.loads(EVIDENCE_SCHEMA_PATH.read_text(encoding="utf-8"))
    ).validate(evidence)
    core = {key: value for key, value in evidence.items() if key != "evidenceFingerprint"}
    assert evidence["evidenceFingerprint"] == GENERATOR._sha256_payload(core)
    assert evidence["admissionStatus"] == "admitted"
    assert evidence["verdict"] == "PASS"


def test_contract_is_proposed_and_replays_sources(contract) -> None:
    jsonschema.Draft202012Validator(
        json.loads(CONTRACT_SCHEMA_PATH.read_text(encoding="utf-8"))
    ).validate(contract)
    assert contract["admission"] == "admitted"
    assert contract["contractStatus"] == "accepted_crt_348"
    assert contract["promotionInventory"] == PROMOTION_ITEMS
    assert contract["remainProposed"] == [
        "fivefold_engine.macro_bracket",
        "fivefold_engine.controller",
        "fivefold_engine.runtime_cycle",
    ]
    assert contract["effectBoundary"] == {
        "runtimeEffect": False,
        "graphEffect": False,
        "policyEffect": False,
        "ledgerEffect": False,
        "admissionEffect": False,
        "physicalQuantityClaim": False,
    }
    assert contract["sourceSha256"] == FROZEN_ENGINE_SHA256


def test_all_item_evidence_groups_pass(evidence) -> None:
    assert len(evidence["itemEvidence"]) == 10
    assert [item["itemId"] for item in evidence["itemEvidence"]] == [
        f"fivefold_engine.{name}"
        for name in (
            "physical_quantity_claim=false",
            "pole_order",
            "bit_semantics",
            "canonical_states",
            "canonical_transitions",
            "geometry.kappa_formula",
            "geometry.paired_mask_hamming_formula",
            "geometry.signed_gram_matrix",
            "geometry.canonical_path_size",
            "guards",
        )
    ]
    assert all(item["status"] == "PASS" for item in evidence["itemEvidence"])
    assert all(
        check["pass"] for item in evidence["itemEvidence"] for check in item["checks"]
    )


def test_all_exclusion_evidence_groups_pass(evidence) -> None:
    assert len(evidence["exclusionEvidence"]) == 11
    assert all(item["status"] == "PASS" for item in evidence["exclusionEvidence"])


def test_bit_semantics_contains_no_zodiac_signs(contract) -> None:
    assert contract["promotedFields"]["bitSemantics"]["zodiacSignNames"] == "excluded"
    contract_text = CONTRACT_PATH.read_text(encoding="utf-8")
    assert not any(name in contract_text for name in ZODIAC_NAMES)


def test_frozen_inputs_and_crt310_untouched(evidence) -> None:
    engine_digest = hashlib.sha256(
        (
            ROOT
            / "seven-governors-state-machine-spec-and-authoring-toolkit-v0.2.0/schemas/fivefold_engine.yaml"
        ).read_bytes()
    ).hexdigest()
    assert engine_digest == FROZEN_ENGINE_SHA256
    exclusion = {
        item["exclusionId"]: item for item in evidence["exclusionEvidence"]
    }
    backlog_check = next(
        check
        for check in exclusion["CRT-310 gate satisfaction"]["checks"]
        if check["checkId"] == "backlog-summary-unchanged"
    )
    assert backlog_check["actual"] == {
        "itemCount": 35,
        "proposedCount": 35,
        "eligibleForAdmissionReviewCount": 0,
        "admittedCount": 0,
    }


def test_generator_check_mode_rejects_drift(tmp_path) -> None:
    stale = tmp_path / "stale.json"
    stale.write_text("{}", encoding="utf-8")
    result = subprocess.run(
        [sys.executable, str(GENERATOR_PATH), "--check", "--output", str(stale)],
        capture_output=True,
        text=True,
    )
    assert result.returncode != 0
    assert "STALE_FIVEFOLD_ENGINE_PROMOTION_EVIDENCE" in result.stderr


def test_independent_validator_rejects_tampered_contract(tmp_path, monkeypatch) -> None:
    tampered = deepcopy(json.loads(CONTRACT_PATH.read_text(encoding="utf-8")))
    tampered["promotedFields"]["physicalQuantityClaim"]["value"] = True
    tampered_path = tmp_path / "tampered-contract.json"
    tampered_path.write_text(
        json.dumps(tampered, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    monkeypatch.setattr(VALIDATOR, "CONTRACT_PATH", tampered_path)
    with pytest.raises(
        (jsonschema.ValidationError, VALIDATOR.PromotionEvidenceValidationError)
    ):
        VALIDATOR.validate_evidence(json.loads(EVIDENCE_PATH.read_text(encoding="utf-8")))


def test_evidence_declares_no_active_relations(evidence) -> None:
    exclusion_ids = {item["exclusionId"] for item in evidence["exclusionEvidence"]}
    assert "active complement relation" in exclusion_ids
    assert "active SUBSET_OF_7_35 projection" in exclusion_ids
    assert "CRT-310 gate satisfaction" in exclusion_ids
    assert "win-condition enforcement" in exclusion_ids


def test_ledger_edit_requires_regeneration_without_constant_changes(evidence, monkeypatch):
    ledger = ROOT / "provenance/DECISION_LEDGER.md"
    read_bytes = Path.read_bytes
    changed = read_bytes(ledger) + b"\nPlanning-only test amendment.\n"
    monkeypatch.setattr(Path, "read_bytes", lambda path: changed if path == ledger else read_bytes(path))
    with pytest.raises(VALIDATOR.PromotionEvidenceValidationError, match="regenerate_required"):
        VALIDATOR.validate_evidence(evidence)
    rebuilt = GENERATOR.build_evidence(ROOT)
    assert rebuilt["decisionLedgerSha256"] == hashlib.sha256(changed).hexdigest()
    assert rebuilt["decisionLedgerSha256"] != evidence["decisionLedgerSha256"]
    assert rebuilt["verdict"] == "PASS"
    VALIDATOR.validate_evidence(rebuilt)
    assert GENERATOR.build_evidence(ROOT) == rebuilt


def test_rehashed_ledger_binding_tamper_rejected(evidence):
    for target in ("top-level", "check"):
        changed = deepcopy(evidence)
        if target == "top-level":
            changed["decisionLedgerSha256"] = "0" * 64
        else:
            for group in changed["exclusionEvidence"]:
                for check in group["checks"]:
                    if check["checkId"] == "decision-ledger-digest":
                        check["actual"] = "0" * 64
        core = {key: value for key, value in changed.items() if key != "evidenceFingerprint"}
        changed["evidenceFingerprint"] = GENERATOR._sha256_payload(core)
        with pytest.raises(VALIDATOR.PromotionEvidenceValidationError, match="decision_ledger"):
            VALIDATOR.validate_evidence(changed)


def test_ledger_change_during_build_is_rejected(monkeypatch):
    ledger = ROOT / "provenance/DECISION_LEDGER.md"
    read_bytes = Path.read_bytes
    calls = 0

    def changing_bytes(path):
        nonlocal calls
        data = read_bytes(path)
        if path == ledger:
            calls += 1
            if calls > 1:
                return data + b"\nConcurrent test amendment.\n"
        return data

    monkeypatch.setattr(Path, "read_bytes", changing_bytes)
    with pytest.raises(GENERATOR.PromotionEvidenceBuildError, match="source_changed_during_build"):
        GENERATOR.build_evidence(ROOT)


def test_live_binding_cannot_replace_missing_admission_entry(monkeypatch):
    ledger = ROOT / "provenance/DECISION_LEDGER.md"
    read_bytes, read_text = Path.read_bytes, Path.read_text
    changed = read_bytes(ledger).replace(b"Fivefold engine promotion admission (CRT-348)", b"Removed admission entry")
    monkeypatch.setattr(Path, "read_bytes", lambda path: changed if path == ledger else read_bytes(path))
    monkeypatch.setattr(Path, "read_text", lambda path, *args, **kwargs: changed.decode() if path == ledger else read_text(path, *args, **kwargs))
    rebuilt = GENERATOR.build_evidence(ROOT)
    assert rebuilt["decisionLedgerSha256"] == hashlib.sha256(changed).hexdigest()
    assert rebuilt["verdict"] == "FAIL"
    with pytest.raises(VALIDATOR.PromotionEvidenceValidationError, match="admission_entry_missing"):
        VALIDATOR.validate_evidence(rebuilt)
