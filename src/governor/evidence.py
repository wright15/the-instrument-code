"""Strict objective-evidence records and deterministic victory evaluation."""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any

from .hashing import sha256_payload
from .models import (
    FrozenDict,
    _require_identifier,
    _require_sha256,
    _sorted_unique,
    freeze_json,
    thaw_json,
)


EVIDENCE_SCHEMA_VERSION = "gov-205.evidence.v1"


class EvidenceType(str, Enum):
    EXIT_STATUS = "exit_status"
    PROCESS = "process"
    FILE_SHA256 = "file_sha256"
    JSON_POINTER = "json_pointer"
    REGEX = "regex"
    HTTP = "http"


class EvidenceVerdict(str, Enum):
    PASS = "pass"
    FAIL = "fail"
    ERROR = "error"


@dataclass(frozen=True, slots=True)
class Postcondition:
    postcondition_id: str
    evidence_type: EvidenceType | str
    verifier_id: str
    request: FrozenDict | dict[str, Any]
    expected: FrozenDict | dict[str, Any]
    required: bool = True

    def __post_init__(self) -> None:
        _require_identifier(self.postcondition_id, "postcondition_id")
        object.__setattr__(self, "evidence_type", EvidenceType(self.evidence_type))
        _require_identifier(self.verifier_id, "verifier_id")
        object.__setattr__(self, "request", freeze_json(self.request))
        object.__setattr__(self, "expected", freeze_json(self.expected))


@dataclass(frozen=True, slots=True)
class VictoryCondition:
    condition_id: str
    required_postcondition_ids: tuple[str, ...]
    mode: str = "all"

    def __post_init__(self) -> None:
        _require_identifier(self.condition_id, "condition_id")
        identifiers = _sorted_unique(
            self.required_postcondition_ids, "required_postcondition_ids"
        )
        if not identifiers:
            raise ValueError("victory_condition_requires_postcondition")
        if self.mode != "all":
            raise ValueError("unsupported_victory_condition_mode")
        object.__setattr__(self, "required_postcondition_ids", identifiers)


@dataclass(frozen=True, slots=True)
class EvidenceRecord:
    schema_version: str
    evidence_id: str
    attempt_id: str
    capability: str
    postcondition_id: str
    evidence_type: EvidenceType | str
    normalized_request: FrozenDict | dict[str, Any]
    observation: FrozenDict | dict[str, Any]
    expected_postcondition: FrozenDict | dict[str, Any]
    verdict: EvidenceVerdict | str
    verifier_id: str
    verifier_version: str
    evidence_sha256: str

    def __post_init__(self) -> None:
        _require_identifier(self.schema_version, "schema_version")
        _require_sha256(self.evidence_id, "evidence_id")
        _require_identifier(self.attempt_id, "attempt_id")
        _require_identifier(self.capability, "capability")
        _require_identifier(self.postcondition_id, "postcondition_id")
        object.__setattr__(self, "evidence_type", EvidenceType(self.evidence_type))
        object.__setattr__(self, "normalized_request", freeze_json(self.normalized_request))
        object.__setattr__(self, "observation", freeze_json(self.observation))
        object.__setattr__(self, "expected_postcondition", freeze_json(self.expected_postcondition))
        object.__setattr__(self, "verdict", EvidenceVerdict(self.verdict))
        _require_identifier(self.verifier_id, "verifier_id")
        _require_identifier(self.verifier_version, "verifier_version")
        _require_sha256(self.evidence_sha256, "evidence_sha256")
        if compute_evidence_hash(self) != self.evidence_sha256:
            raise ValueError("evidence_sha256_mismatch")


def evidence_body(record: EvidenceRecord) -> dict[str, Any]:
    return {
        "schema_version": record.schema_version,
        "evidence_id": record.evidence_id,
        "attempt_id": record.attempt_id,
        "capability": record.capability,
        "postcondition_id": record.postcondition_id,
        "evidence_type": record.evidence_type.value,
        "normalized_request": thaw_json(record.normalized_request),
        "observation": thaw_json(record.observation),
        "expected_postcondition": thaw_json(record.expected_postcondition),
        "verdict": record.verdict.value,
        "verifier_id": record.verifier_id,
        "verifier_version": record.verifier_version,
    }


def compute_evidence_hash(record: EvidenceRecord) -> str:
    return sha256_payload(evidence_body(record))


def create_evidence_record(
    *,
    attempt_id: str,
    capability: str,
    postcondition: Postcondition,
    observation: dict[str, Any] | FrozenDict,
    verdict: EvidenceVerdict | str,
    verifier_version: str,
) -> EvidenceRecord:
    verdict_value = EvidenceVerdict(verdict)
    identity_body = {
        "attempt_id": attempt_id,
        "postcondition_id": postcondition.postcondition_id,
        "verifier_id": postcondition.verifier_id,
        "request": thaw_json(postcondition.request),
    }
    evidence_id = sha256_payload(identity_body)
    draft = object.__new__(EvidenceRecord)
    values = {
        "schema_version": EVIDENCE_SCHEMA_VERSION,
        "evidence_id": evidence_id,
        "attempt_id": attempt_id,
        "capability": capability,
        "postcondition_id": postcondition.postcondition_id,
        "evidence_type": postcondition.evidence_type,
        "normalized_request": freeze_json(postcondition.request),
        "observation": freeze_json(observation),
        "expected_postcondition": freeze_json(postcondition.expected),
        "verdict": verdict_value,
        "verifier_id": postcondition.verifier_id,
        "verifier_version": verifier_version,
    }
    for name, value in values.items():
        object.__setattr__(draft, name, value)
    object.__setattr__(draft, "evidence_sha256", "0" * 64)
    return EvidenceRecord(**values, evidence_sha256=sha256_payload(evidence_body(draft)))


@dataclass(frozen=True, slots=True)
class VerifierResult:
    postcondition_id: str
    evidence: EvidenceRecord
    reason_code: str

    def __post_init__(self) -> None:
        _require_identifier(self.postcondition_id, "postcondition_id")
        _require_identifier(self.reason_code, "reason_code")
        if self.evidence.postcondition_id != self.postcondition_id:
            raise ValueError("verifier_result_postcondition_mismatch")


@dataclass(frozen=True, slots=True)
class VerificationDecision:
    passed: bool
    reason_codes: tuple[str, ...]
    evidence_ids: tuple[str, ...]

    def __post_init__(self) -> None:
        reasons = _sorted_unique(self.reason_codes, "reason_codes")
        evidence = _sorted_unique(self.evidence_ids, "evidence_ids")
        if self.passed and reasons:
            raise ValueError("passing_decision_cannot_have_reasons")
        if not self.passed and not reasons:
            raise ValueError("failed_decision_requires_reason")
        object.__setattr__(self, "reason_codes", reasons)
        object.__setattr__(self, "evidence_ids", evidence)


def evaluate_victory(
    condition: VictoryCondition,
    results: tuple[VerifierResult, ...],
) -> VerificationDecision:
    by_id = {result.postcondition_id: result for result in results}
    reasons: list[str] = []
    evidence_ids: list[str] = []
    for identifier in condition.required_postcondition_ids:
        result = by_id.get(identifier)
        if result is None:
            reasons.append(f"missing_evidence:{identifier}")
            continue
        evidence_ids.append(result.evidence.evidence_id)
        if result.evidence.verdict is not EvidenceVerdict.PASS:
            reasons.append(f"postcondition_failed:{identifier}")
    return VerificationDecision(
        passed=not reasons,
        reason_codes=tuple(reasons),
        evidence_ids=tuple(evidence_ids),
    )


@dataclass(frozen=True, slots=True)
class CleanupResult:
    attempted: bool
    succeeded: bool
    fallback_used: bool
    reason_code: str
    observation: FrozenDict | dict[str, Any] = field(default_factory=FrozenDict)

    def __post_init__(self) -> None:
        _require_identifier(self.reason_code, "reason_code")
        object.__setattr__(self, "observation", freeze_json(self.observation))
