"""Read-only reconstruction of one recorded execution attempt.

The outcome reader replays the authoritative ledger and extracts exactly what
the runtime recorded for one attempt: start record, evidence, verification
decision, and cleanup result. It never invokes executors, verifiers, clocks,
HTTP clients, or the filesystem.
"""

from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass
from typing import Any

from .evidence import CleanupResult, EvidenceRecord
from .hashing import sha256_payload
from .models import LedgerAnchor, LedgerEvent, _require_identifier, thaw_json
from .runtime_models import (
    AgentState,
    RuntimeReplayResult,
    TransitionError,
)
from .runtime_ledger import replay_runtime_ledger


@dataclass(frozen=True, slots=True)
class AttemptOutcome:
    attempt_id: str
    operation_id: str | None
    found: bool
    started: bool
    start_reason_code: str
    evidence: tuple[EvidenceRecord, ...]
    decision_passed: bool | None
    decision_reason_codes: tuple[str, ...]
    decision_evidence_ids: tuple[str, ...]
    cleanup: CleanupResult | None
    final_phase: str | None
    recorded_state_sha256: str | None

    def __post_init__(self) -> None:
        _require_identifier(self.attempt_id, "attempt_id")
        if self.operation_id is not None:
            _require_identifier(self.operation_id, "operation_id")
        _require_identifier(self.start_reason_code, "start_reason_code")


@dataclass(frozen=True, slots=True)
class OutcomeReadResult:
    replay: RuntimeReplayResult
    outcome: AttemptOutcome | None


def _intrinsic(event: LedgerEvent) -> Mapping[str, Any]:
    intrinsic = event.payload.get("intrinsic_data")
    return intrinsic if isinstance(intrinsic, Mapping) else {}


def _observation(event: LedgerEvent) -> Mapping[str, Any]:
    observation = event.payload.get("observation_data")
    return observation if isinstance(observation, Mapping) else {}


def _evidence_from_body(body: Any) -> EvidenceRecord:
    if not isinstance(body, Mapping):
        raise TransitionError("recorded_evidence_invalid")
    try:
        return EvidenceRecord(
            schema_version=body["schema_version"],
            evidence_id=body["evidence_id"],
            attempt_id=body["attempt_id"],
            capability=body["capability"],
            postcondition_id=body["postcondition_id"],
            evidence_type=body["evidence_type"],
            normalized_request=body["normalized_request"],
            observation=body["observation"],
            expected_postcondition=body["expected_postcondition"],
            verdict=body["verdict"],
            verifier_id=body["verifier_id"],
            verifier_version=body["verifier_version"],
            evidence_sha256=sha256_payload(thaw_json(body)),
        )
    except (KeyError, TypeError, ValueError) as error:
        raise TransitionError("recorded_evidence_invalid") from error


def read_attempt_outcome(
    initial_state: AgentState,
    events: tuple[LedgerEvent, ...],
    anchor: LedgerAnchor,
    attempt_id: str,
) -> OutcomeReadResult:
    """Replay the ledger and return the recorded outcome for one attempt."""

    _require_identifier(attempt_id, "attempt_id")
    replay = replay_runtime_ledger(initial_state, events, anchor)
    if not replay.valid:
        return OutcomeReadResult(replay, None)

    operation_id: str | None = None
    found = False
    started = False
    start_reason = "attempt_not_found"
    evidence: list[EvidenceRecord] = []
    decision_passed: bool | None = None
    decision_reasons: tuple[str, ...] = ()
    decision_evidence_ids: tuple[str, ...] = ()
    cleanup: CleanupResult | None = None
    final_phase: str | None = None
    recorded_state_sha256: str | None = None

    for event in events:
        kind = event.payload.get("event_kind")
        intrinsic = _intrinsic(event)
        if intrinsic.get("attempt_id") != attempt_id:
            continue
        if kind == "execution_attempted":
            found = True
            start_reason = str(intrinsic.get("reason_code", "started"))
            started = start_reason == "started"
            raw_operation = event.payload.get("operation_id")
            operation_id = raw_operation if isinstance(raw_operation, str) else None
        elif kind == "evidence_recorded":
            raw_evidence = _observation(event).get("evidence", ())
            if isinstance(raw_evidence, tuple):
                evidence.extend(_evidence_from_body(item) for item in raw_evidence)
        elif kind == "cleanup_recorded":
            cleanup = CleanupResult(
                attempted=True,
                succeeded=bool(intrinsic.get("succeeded")),
                fallback_used=bool(intrinsic.get("fallback_used")),
                reason_code=str(intrinsic.get("reason_code", "cleanup_recorded")),
                observation=_observation(event).get("cleanup", {}),
            )
        elif kind == "verification_decided":
            decision_passed = bool(intrinsic.get("passed"))
            raw_reasons = intrinsic.get("reason_codes", ())
            raw_ids = intrinsic.get("evidence_ids", ())
            decision_reasons = tuple(
                sorted(str(item) for item in raw_reasons)
            ) if isinstance(raw_reasons, tuple) else ()
            decision_evidence_ids = tuple(
                sorted(str(item) for item in raw_ids)
            ) if isinstance(raw_ids, tuple) else ()
            state_after = intrinsic.get("state_after")
            if isinstance(state_after, Mapping):
                raw_phase = state_after.get("phase")
                final_phase = raw_phase if isinstance(raw_phase, str) else None
            recorded_state_sha256 = event.payload.get("resulting_state_sha256")

    if not found:
        outcome = AttemptOutcome(
            attempt_id=attempt_id,
            operation_id=None,
            found=False,
            started=False,
            start_reason_code="attempt_not_found",
            evidence=(),
            decision_passed=None,
            decision_reason_codes=(),
            decision_evidence_ids=(),
            cleanup=None,
            final_phase=None,
            recorded_state_sha256=None,
        )
        return OutcomeReadResult(replay, outcome)

    outcome = AttemptOutcome(
        attempt_id=attempt_id,
        operation_id=operation_id,
        found=True,
        started=started,
        start_reason_code=start_reason,
        evidence=tuple(evidence),
        decision_passed=decision_passed,
        decision_reason_codes=decision_reasons,
        decision_evidence_ids=decision_evidence_ids,
        cleanup=cleanup,
        final_phase=final_phase,
        recorded_state_sha256=recorded_state_sha256,
    )
    return OutcomeReadResult(replay, outcome)
