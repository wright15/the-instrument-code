#!/usr/bin/env python3
"""Independently validate the CRT-348 Fivefold engine promotion evidence."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
import sys
from typing import Any

import jsonschema
import yaml


ROOT = Path(__file__).resolve().parents[1]
EVIDENCE_PATH = ROOT / "qa/fivefold-engine-promotion-evidence.json"
EVIDENCE_SCHEMA_PATH = ROOT / "schemas/fivefold-engine-promotion-evidence.schema.json"
CONTRACT_PATH = ROOT / "schemas/fivefold-engine-admission-contract.json"
CONTRACT_SCHEMA_PATH = ROOT / "schemas/fivefold-engine-admission-contract.schema.json"

SCHEMA_VERSION = "crt-348.fivefold-engine-promotion-evidence.v1"
EVIDENCE_ID = "fivefold-engine-promotion-evidence-v1"

FROZEN_ENGINE_SHA256 = "9cbf038c93a72719387e6a8094f5b466a79e61ce03371f5b2334fb26a480b64a"
DECISION_LEDGER_SHA256 = "32f08a16eeb4c13187939281621b4085fe377778539cc1268913e3cb285b9bc6"

SOURCE_PATHS = (
    "schemas/court-admission-contract.json",
    "provenance/court-admission-release.json",
    "schemas/court-runtime-policy.json",
    "schemas/court-runtime/court-runtime-types.schema.json",
    "src/governor/court_runtime.py",
    "seven-governors-state-machine-spec-and-authoring-toolkit-v0.2.0/schemas/fivefold_engine.yaml",
    "seven-governors-state-machine-spec-and-authoring-toolkit-v0.2.0/schemas/fivefold-engine.schema.json",
    "seven-governors-harmonic-invariants-v0.1.0/canonical/harmonic-invariant-registry.json",
)

EXPECTED_HAMMING_MATRIX = [
    [0, 2, 4, 6, 8],
    [2, 0, 2, 4, 6],
    [4, 2, 0, 2, 4],
    [6, 4, 2, 0, 2],
    [8, 6, 4, 2, 0],
]
EXPECTED_GRAM_MATRIX = [[2, 0, 0, 0], [0, 2, 0, 0], [0, 0, 2, 0], [0, 0, 0, 2]]

EXPECTED_GUARDS = (
    "Ordinary movement is adjacent.",
    "A non-adjacent jump must be expanded or explicitly marked exceptional.",
    "Court state is runtime context, not State Governor identity.",
    "kappa_court is not C_P, C_H, C_S, temperature, entropy, enthalpy, or free energy.",
)


class PromotionEvidenceValidationError(ValueError):
    """Stable independent-validation rejection."""


def _sha256_bytes(payload: bytes) -> str:
    return hashlib.sha256(payload).hexdigest()


def _read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def _require_intrinsic_json(value: Any) -> None:
    if value is None or isinstance(value, (str, bool)) or type(value) is int:
        return
    if isinstance(value, float):
        raise TypeError("non_integral_number_not_allowed")
    if isinstance(value, (list, tuple)):
        for item in value:
            _require_intrinsic_json(item)
        return
    if isinstance(value, dict):
        for item in value.values():
            _require_intrinsic_json(item)
        return
    raise TypeError(f"unsupported_json_type:{type(value).__name__}")


def _canonical_bytes(value: Any) -> bytes:
    _require_intrinsic_json(value)
    return json.dumps(
        value,
        ensure_ascii=False,
        allow_nan=False,
        separators=(",", ":"),
        sort_keys=True,
    ).encode("utf-8")


def _sha256_payload(value: Any) -> str:
    return _sha256_bytes(_canonical_bytes(value))


def _ratio(value: Any) -> dict[str, int]:
    if isinstance(value, dict):
        return {"numerator": value["numerator"], "denominator": value["denominator"]}
    from fractions import Fraction

    fraction = Fraction(value).limit_denominator(4)
    return {"numerator": fraction.numerator, "denominator": fraction.denominator}


def _load_engine() -> dict[str, Any]:
    return yaml.safe_load(
        (
            ROOT
            / "seven-governors-state-machine-spec-and-authoring-toolkit-v0.2.0/schemas/fivefold_engine.yaml"
        ).read_text(encoding="utf-8")
    )["fivefold_engine"]


def _engine_state_replay(engine: dict[str, Any]) -> list[dict[str, Any]]:
    return [
        {
            "stateId": item["state_id"],
            "vector": item["vector"],
            "internalPoles": item["internal_poles"],
            "kappaCourt": _ratio(item["kappa_court"]),
        }
        for item in engine["canonical_states"]
    ]


def _engine_transition_replay(engine: dict[str, Any]) -> list[dict[str, Any]]:
    return [
        {
            "transitionId": item["transition_id"],
            "from": item["from"],
            "to": item["to"],
            "pole": item["pole"],
        }
        for item in engine["canonical_transitions"]
    ]


def _engine_pole_order_replay(engine: dict[str, Any]) -> list[dict[str, Any]]:
    return [
        {
            "governor": item["governor"],
            "element": item["element"],
            "function": item["function"],
            "diagnosticQuestion": item["diagnostic_question"],
        }
        for item in engine["pole_order"]
    ]


def _contract_replays_sources(contract: dict[str, Any], engine: dict[str, Any]) -> None:
    promoted = contract["promotedFields"]
    if promoted["physicalQuantityClaim"]["value"] is not False:
        raise PromotionEvidenceValidationError("contract_physical_claim_drift")
    if promoted["poleOrder"] != _engine_pole_order_replay(engine):
        raise PromotionEvidenceValidationError("contract_pole_order_drift")
    if promoted["bitSemantics"] != {
        "0": engine["bit_semantics"]["0"],
        "1": engine["bit_semantics"]["1"],
        "zodiacSignNames": "excluded",
        "sourcePointer": "fivefold_engine.bit_semantics",
    }:
        raise PromotionEvidenceValidationError("contract_bit_semantics_drift")
    if promoted["canonicalStates"] != _engine_state_replay(engine):
        raise PromotionEvidenceValidationError("contract_canonical_states_drift")
    if promoted["canonicalTransitions"] != _engine_transition_replay(engine):
        raise PromotionEvidenceValidationError("contract_canonical_transitions_drift")
    geometry = promoted["geometry"]
    if (
        geometry["kappaFormula"] != engine["geometry"]["kappa_formula"]
        or geometry["pairedMaskHammingFormula"]
        != engine["geometry"]["paired_mask_hamming_formula"]
        or geometry["signedGramMatrix"] != engine["geometry"]["signed_gram_matrix"]
        or geometry["canonicalPathSize"] != engine["geometry"]["canonical_path_size"]
        or geometry["hammingMatrix"] != EXPECTED_HAMMING_MATRIX
        or geometry["gramMatrix"] != EXPECTED_GRAM_MATRIX
    ):
        raise PromotionEvidenceValidationError("contract_geometry_drift")
    if [item["guardLiteral"] for item in promoted["guards"]] != list(EXPECTED_GUARDS):
        raise PromotionEvidenceValidationError("contract_guards_drift")

    admission_contract = _read_json(ROOT / "schemas/court-admission-contract.json")
    disposition = admission_contract["fivefoldFieldDisposition"]
    if contract["promotionInventory"] != disposition["eligibleForPromotionAtCrt309"]:
        raise PromotionEvidenceValidationError("contract_promotion_inventory_drift")
    if contract["remainProposed"] != disposition["remainProposed"]:
        raise PromotionEvidenceValidationError("contract_remain_proposed_drift")
    if contract["admission"] != "admitted":
        raise PromotionEvidenceValidationError("contract_admission_status_invalid")


def _evidence_is_internally_consistent(evidence: dict[str, Any]) -> None:
    if evidence.get("admissionStatus") != "admitted":
        raise PromotionEvidenceValidationError("evidence_admission_status_invalid")
    if evidence.get("contractSha256") != _sha256_bytes(CONTRACT_PATH.read_bytes()):
        raise PromotionEvidenceValidationError("evidence_contract_sha256_drift")
    groups = evidence.get("itemEvidence", []) + evidence.get("exclusionEvidence", [])
    for group in groups:
        computed = "PASS" if all(check["pass"] for check in group["checks"]) else "FAIL"
        if group["status"] != computed:
            raise PromotionEvidenceValidationError("evidence_group_status_inconsistent")
    verdict = "PASS" if all(group["status"] == "PASS" for group in groups) else "FAIL"
    if evidence.get("verdict") != verdict:
        raise PromotionEvidenceValidationError("evidence_verdict_inconsistent")
    if (
        len(evidence.get("itemEvidence", [])) != 10
        or len(evidence.get("exclusionEvidence", [])) != 11
    ):
        raise PromotionEvidenceValidationError("evidence_group_count_invalid")


def _recompute_critical_checks() -> None:
    policy = _read_json(ROOT / "schemas/court-runtime-policy.json")
    if policy["poleOrder"] != ["Mars", "Jupiter", "Venus", "Saturn"]:
        raise PromotionEvidenceValidationError("policy_pole_order_drift")
    if [item["positionId"] for item in policy["positions"]] != ["C0", "C1", "C2", "C3", "C4"]:
        raise PromotionEvidenceValidationError("policy_positions_drift")
    if len(policy["ordinaryMoves"]) != 8:
        raise PromotionEvidenceValidationError("policy_ordinary_moves_drift")
    registry = _read_json(
        ROOT
        / "seven-governors-harmonic-invariants-v0.1.0/canonical/harmonic-invariant-registry.json"
    )
    if registry["courtGeometry"]["hammingMatrix"] != EXPECTED_HAMMING_MATRIX:
        raise PromotionEvidenceValidationError("harmonic_hamming_drift")
    if registry["courtGeometry"]["gramMatrix"] != EXPECTED_GRAM_MATRIX:
        raise PromotionEvidenceValidationError("harmonic_gram_drift")
    if _sha256_bytes(
        (
            ROOT
            / "seven-governors-state-machine-spec-and-authoring-toolkit-v0.2.0/schemas/fivefold_engine.yaml"
        ).read_bytes()
    ) != FROZEN_ENGINE_SHA256:
        raise PromotionEvidenceValidationError("frozen_engine_digest_drift")
    if (
        _sha256_bytes((ROOT / "provenance/DECISION_LEDGER.md").read_bytes())
        != DECISION_LEDGER_SHA256
    ):
        raise PromotionEvidenceValidationError("decision_ledger_digest_drift")
    backlog = _read_json(ROOT / "provenance/pentatonic-set-class-admission-backlog.json")
    if backlog.get("bulkPromotionAllowed") is not False:
        raise PromotionEvidenceValidationError("crt310_bulk_promotion_drift")


def validate_evidence(evidence: dict[str, Any]) -> None:
    core = {key: value for key, value in evidence.items() if key != "evidenceFingerprint"}
    if evidence.get("evidenceFingerprint") != _sha256_payload(core):
        raise PromotionEvidenceValidationError("evidence_fingerprint_mismatch")
    if evidence.get("schemaVersion") != SCHEMA_VERSION or evidence.get("evidenceId") != EVIDENCE_ID:
        raise PromotionEvidenceValidationError("evidence_identity_invalid")
    jsonschema.Draft202012Validator(_read_json(EVIDENCE_SCHEMA_PATH)).validate(evidence)
    contract = _read_json(CONTRACT_PATH)
    jsonschema.Draft202012Validator(_read_json(CONTRACT_SCHEMA_PATH)).validate(contract)
    _contract_replays_sources(contract, _load_engine())
    _evidence_is_internally_consistent(evidence)
    _recompute_critical_checks()
    declared = {item["path"]: item["sha256"] for item in evidence.get("sourceBindings", [])}
    for relative_path in SOURCE_PATHS:
        if declared.get(relative_path) != _sha256_bytes((ROOT / relative_path).read_bytes()):
            raise PromotionEvidenceValidationError(f"source_binding_drift:{relative_path}")


def main() -> int:
    evidence = _read_json(EVIDENCE_PATH)
    validate_evidence(evidence)
    print(
        json.dumps(
            {
                "evidenceId": evidence["evidenceId"],
                "evidenceFingerprint": evidence["evidenceFingerprint"],
                "verdict": evidence["verdict"],
            },
            sort_keys=True,
        )
    )
    return 0 if evidence["verdict"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
