"""Trusted runtime-context export for the GOV-206 graph read projection.

This module is the sole bridge from the authoritative Python runtime into the
deterministic graph projection. It accepts ONLY a verified ``RuntimeReplayResult``
produced by :func:`governor.runtime_ledger.replay_runtime_ledger` and emits a
canonical, fingerprinted JSON document containing verified ledger snapshots and
purely contextual legal moves. It never exports private ``state.data``, validation
tokens, executor handles, or any mutable runtime authority.
"""

from __future__ import annotations

from collections.abc import Iterable, Mapping
from dataclasses import dataclass
from typing import Any

from .hashing import canonical_json_bytes, sha256_bytes, sha256_payload
from .runtime_models import (
    AgentState,
    LegalMove,
    LedgerSnapshot,
    RuntimeReplayResult,
    TransitionError,
    agent_state_body,
)


RUNTIME_EXPORT_SCHEMA_VERSION = "gov-206.runtime-export.v1"


class GraphExportError(ValueError):
    """A stable rejection code for untrusted or malformed export inputs."""

    def __init__(self, reason_code: str) -> None:
        super().__init__(reason_code)
        self.reason_code = reason_code


@dataclass(frozen=True, slots=True)
class LegalMoveContext:
    operation_id: str
    capability: str
    move_sha256: str
    prior_state_sha256: str
    policy_fingerprint: str

    def __post_init__(self) -> None:
        if not isinstance(self.operation_id, str) or not self.operation_id:
            raise GraphExportError("legal_move_operation_id_missing")
        if not isinstance(self.capability, str) or not self.capability:
            raise GraphExportError("legal_move_capability_missing")
        if not isinstance(self.move_sha256, str) or len(self.move_sha256) != 64:
            raise GraphExportError("legal_move_sha256_invalid")
        if not isinstance(self.prior_state_sha256, str) or len(self.prior_state_sha256) != 64:
            raise GraphExportError("legal_move_prior_state_invalid")
        if not isinstance(self.policy_fingerprint, str) or len(self.policy_fingerprint) != 64:
            raise GraphExportError("legal_move_policy_invalid")


def _verify_replay_result(result: RuntimeReplayResult) -> None:
    """Reject anything that is not a fully verified, intact replay result."""

    if type(result) is not RuntimeReplayResult:
        raise GraphExportError("export_requires_verified_replay_result")
    if not result.valid or result.reason_code != "ok":
        raise GraphExportError("replay_result_not_valid")
    if result.first_failing_sequence is not None:
        raise GraphExportError("replay_result_has_failing_sequence")
    if result.snapshot is None:
        raise GraphExportError("replay_result_missing_snapshot")
    snapshot = result.snapshot
    state = result.state
    if snapshot.state != state:
        raise GraphExportError("snapshot_state_mismatch")
    if snapshot.anchor != state.ledger_anchor:
        raise GraphExportError("snapshot_anchor_mismatch")
    if snapshot.state.state_sha256 != state.state_sha256:
        raise GraphExportError("snapshot_state_hash_mismatch")
    if snapshot.anchor.head_sha256 != state.ledger_anchor.head_sha256:
        raise GraphExportError("snapshot_anchor_hash_mismatch")
    if state.state_sha256 != sha256_payload(agent_state_body(state)):
        raise GraphExportError("state_hash_recompute_mismatch")


def _legal_move_contexts(moves: Iterable[LegalMove]) -> tuple[LegalMoveContext, ...]:
    records: list[LegalMoveContext] = []
    seen: set[tuple[str, str]] = set()
    for move in moves:
        if type(move) is not LegalMove:
            raise GraphExportError("legal_move_must_be_legal_move")
        key = (move.operation_id, move.capability)
        if key in seen:
            raise GraphExportError("legal_move_duplicate")
        seen.add(key)
        records.append(
            LegalMoveContext(
                operation_id=move.operation_id,
                capability=move.capability,
                move_sha256=move.move_sha256,
                prior_state_sha256=move.prior_state_sha256,
                policy_fingerprint=move.policy_sha256,
            )
        )
    records.sort(key=lambda item: (item.operation_id, item.capability))
    return tuple(records)


def _snapshot_body(snapshot: LedgerSnapshot, state: AgentState) -> dict[str, Any]:
    return {
        "snapshotSha256": snapshot.snapshot_sha256,
        "stateSha256": state.state_sha256,
        "ledgerHeadSha256": state.ledger_anchor.head_sha256,
        "eventCount": state.ledger_anchor.event_count,
        "taskId": state.task_id,
        "phase": state.phase,
        "revision": state.revision,
        "capabilities": list(state.capabilities),
        "ledgerVerified": True,
        "lifecycleVerified": state.phase == "VERIFIED",
    }


def _legal_move_body(move: LegalMoveContext) -> dict[str, Any]:
    return {
        "operationId": move.operation_id,
        "capability": move.capability,
        "moveSha256": move.move_sha256,
        "priorStateSha256": move.prior_state_sha256,
        "policyFingerprint": move.policy_fingerprint,
        "contextualOnly": True,
        "executionAuthority": "none",
        "requiresFreshValidation": True,
    }


def build_runtime_export(
    replay_result: RuntimeReplayResult,
    *,
    legal_moves: Iterable[LegalMove] = (),
) -> dict[str, Any]:
    """Build a canonical, fingerprinted runtime-context export document.

    ``replay_result`` must be a verified ``RuntimeReplayResult`` from
    :func:`governor.runtime_ledger.replay_runtime_ledger`. ``legal_moves`` is an
    optional iterable of :class:`LegalMove` records (e.g. from
    :func:`governor.transitions.list_legal_moves`); they are serialized as purely
    contextual metadata with zero execution authority.
    """

    _verify_replay_result(replay_result)
    moves = _legal_move_contexts(legal_moves)
    snapshot = replay_result.snapshot
    state = replay_result.state
    body: dict[str, Any] = {
        "schemaVersion": RUNTIME_EXPORT_SCHEMA_VERSION,
        "runtimeSnapshot": _snapshot_body(snapshot, state),
        "policyFingerprint": state.policy_sha256,
        "contextFingerprint": state.context_sha256,
        "legalMoves": [_legal_move_body(move) for move in moves],
    }
    fingerprint = sha256_payload(body)
    body["projectionInputFingerprint"] = fingerprint
    return body


def serialize_runtime_export(document: Mapping[str, Any]) -> bytes:
    """Serialize an export document to canonical compact UTF-8 bytes."""

    if not isinstance(document, Mapping):
        raise GraphExportError("export_document_must_be_mapping")
    if document.get("schemaVersion") != RUNTIME_EXPORT_SCHEMA_VERSION:
        raise GraphExportError("export_schema_version_mismatch")
    core = {key: value for key, value in document.items() if key != "projectionInputFingerprint"}
    expected = sha256_payload(core)
    if document.get("projectionInputFingerprint") != expected:
        raise GraphExportError("projection_input_fingerprint_mismatch")
    return canonical_json_bytes(document)


def verify_runtime_export(document: Mapping[str, Any]) -> bool:
    """Return True iff the export document's fingerprint recomputes exactly."""

    if not isinstance(document, Mapping):
        return False
    if document.get("schemaVersion") != RUNTIME_EXPORT_SCHEMA_VERSION:
        return False
    core = {key: value for key, value in document.items() if key != "projectionInputFingerprint"}
    return sha256_payload(core) == document.get("projectionInputFingerprint")


def export_runtime_context_bytes(
    replay_result: RuntimeReplayResult,
    *,
    legal_moves: Iterable[LegalMove] = (),
) -> bytes:
    """Convenience wrapper: build and serialize a verified runtime export."""

    return serialize_runtime_export(build_runtime_export(replay_result, legal_moves=legal_moves))