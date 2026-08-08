"""Typed runtime event sealing, append, and side-effect-free semantic replay."""

from __future__ import annotations

from collections.abc import Iterable, Mapping
from dataclasses import dataclass, replace
from typing import Any

from .hashing import sha256_payload
from .ledger import GENESIS_SHA256, compute_event_hash, verify_ledger
from .models import LedgerAnchor, LedgerEvent, thaw_json
from .runtime_models import (
    AgentState,
    RuntimeEventBody,
    RuntimeReplayResult,
    TransitionError,
    compute_runtime_event_id,
    create_agent_state,
    create_ledger_snapshot,
    state_with_anchor,
)


RUNTIME_EVENT_KINDS = frozenset(
    {
        "state_inspected",
        "move_proposed",
        "move_validated",
        "move_applied",
        "transition_failed",
        "execution_started",
        "execution_attempted",
        "evidence_recorded",
        "verification_decided",
        "guard_decided",
        "cleanup_recorded",
    }
)
RUNTIME_EVENT_SCHEMA_VERSION = "gov-204.runtime-event.v1"


@dataclass(frozen=True, slots=True)
class StagedRuntimeEvent:
    """A deterministically sealed event not yet promoted to working history."""

    prior_anchor: LedgerAnchor
    event: LedgerEvent
    state: AgentState


def runtime_event_payload(body: RuntimeEventBody) -> dict[str, Any]:
    return {
        "schema_version": RUNTIME_EVENT_SCHEMA_VERSION,
        "event_kind": body.event_kind,
        "event_id": body.event_id,
        "task_id": body.task_id,
        "prior_state_sha256": body.prior_state_sha256,
        "resulting_state_sha256": body.resulting_state_sha256,
        "operation_id": body.operation_id,
        "intrinsic_data": thaw_json(body.intrinsic_data),
        "observation_data": thaw_json(body.observation_data),
    }


def seal_runtime_event(
    body: RuntimeEventBody,
    sequence: int,
    previous_event_sha256: str,
) -> LedgerEvent:
    if body.event_kind not in RUNTIME_EVENT_KINDS:
        raise TransitionError("runtime_event_kind_not_registered")
    payload = runtime_event_payload(body)
    payload_sha256 = sha256_payload(payload)
    draft = LedgerEvent(
        sequence=sequence,
        previous_event_sha256=previous_event_sha256,
        payload=payload,
        payload_sha256=payload_sha256,
        event_sha256=GENESIS_SHA256,
    )
    return replace(draft, event_sha256=compute_event_hash(draft))


def stage_runtime_event(
    events: Iterable[LedgerEvent],
    state: AgentState,
    body: RuntimeEventBody,
) -> StagedRuntimeEvent:
    materialized = tuple(events)
    verification = verify_ledger(materialized, state.ledger_anchor)
    if not verification.valid:
        raise TransitionError("existing_runtime_ledger_invalid")
    if body.task_id != state.task_id:
        raise TransitionError("runtime_event_task_mismatch")
    if body.resulting_state_sha256 != state.state_sha256:
        raise TransitionError("runtime_event_result_state_mismatch")
    event = seal_runtime_event(
        body,
        sequence=len(materialized) + 1,
        previous_event_sha256=state.ledger_anchor.head_sha256,
    )
    anchor = LedgerAnchor(len(materialized) + 1, event.event_sha256)
    return StagedRuntimeEvent(
        prior_anchor=state.ledger_anchor,
        event=event,
        state=state_with_anchor(state, anchor),
    )


def commit_staged_runtime_event(
    events: Iterable[LedgerEvent],
    prior_state: AgentState,
    staged: StagedRuntimeEvent,
    *,
    expected_result_state: AgentState,
) -> tuple[tuple[LedgerEvent, ...], AgentState]:
    materialized = tuple(events)
    verification = verify_ledger(materialized, prior_state.ledger_anchor)
    if not verification.valid:
        raise TransitionError("existing_runtime_ledger_invalid")
    if prior_state.ledger_anchor != staged.prior_anchor:
        raise TransitionError("staged_runtime_event_stale")
    if staged.event.sequence != len(materialized) + 1:
        raise TransitionError("staged_runtime_event_sequence_mismatch")
    if staged.event.previous_event_sha256 != prior_state.ledger_anchor.head_sha256:
        raise TransitionError("staged_runtime_event_previous_hash_mismatch")
    if staged.state.task_id != prior_state.task_id:
        raise TransitionError("staged_runtime_event_task_mismatch")
    if (
        staged.state.state_sha256 != expected_result_state.state_sha256
        or staged.state.ledger_anchor != expected_result_state.ledger_anchor
    ):
        raise TransitionError("staged_runtime_event_result_state_mismatch")
    return materialized + (staged.event,), staged.state


def append_runtime_event(
    events: Iterable[LedgerEvent],
    state: AgentState,
    body: RuntimeEventBody,
) -> tuple[tuple[LedgerEvent, ...], AgentState]:
    staged = stage_runtime_event(events, state, body)
    return commit_staged_runtime_event(
        events,
        state,
        staged,
        expected_result_state=staged.state,
    )


def _body_from_payload(payload: Mapping[str, Any]) -> RuntimeEventBody:
    if payload.get("schema_version") != RUNTIME_EVENT_SCHEMA_VERSION:
        raise TransitionError("runtime_event_schema_mismatch")
    return RuntimeEventBody(
        event_kind=payload.get("event_kind"),
        event_id=payload.get("event_id"),
        task_id=payload.get("task_id"),
        prior_state_sha256=payload.get("prior_state_sha256"),
        resulting_state_sha256=payload.get("resulting_state_sha256"),
        operation_id=payload.get("operation_id"),
        intrinsic_data=payload.get("intrinsic_data", {}),
        observation_data=payload.get("observation_data", {}),
    )


def verify_runtime_event_body(event: LedgerEvent) -> RuntimeEventBody:
    try:
        body = _body_from_payload(event.payload)
    except (TypeError, ValueError) as error:
        raise TransitionError("runtime_event_body_invalid") from error
    if body.event_kind not in RUNTIME_EVENT_KINDS:
        raise TransitionError("runtime_event_kind_not_registered")
    if compute_runtime_event_id(body) != body.event_id:
        raise TransitionError("runtime_event_identity_invalid")
    return body


def _state_from_body(
    value: Mapping[str, Any], anchor: LedgerAnchor
) -> AgentState:
    return create_agent_state(
        task_id=value.get("task_id"),
        revision=value.get("revision"),
        phase=value.get("phase"),
        policy_sha256=value.get("policy_sha256"),
        context_sha256=value.get("context_sha256"),
        capabilities=tuple(value.get("capabilities", ())),
        data=value.get("data", {}),
        pending_attempt_id=value.get("pending_attempt_id"),
        consumed_token_ids=tuple(value.get("consumed_token_ids", ())),
        ledger_anchor=anchor,
    )


def replay_runtime_ledger(
    initial_state: AgentState,
    events: Iterable[LedgerEvent],
    anchor: LedgerAnchor,
) -> RuntimeReplayResult:
    materialized = tuple(events)
    verification = verify_ledger(materialized, anchor)
    if not verification.valid:
        return RuntimeReplayResult(
            False,
            initial_state,
            None,
            verification.first_failing_sequence,
            verification.reason_code,
        )
    state = state_with_anchor(initial_state, LedgerAnchor(0, GENESIS_SHA256))
    for sequence, event in enumerate(materialized, start=1):
        try:
            body = verify_runtime_event_body(event)
        except TransitionError as error:
            return RuntimeReplayResult(False, state, None, sequence, error.reason_code)
        if body.task_id != state.task_id:
            return RuntimeReplayResult(False, state, None, sequence, "runtime_event_task_mismatch")
        if body.prior_state_sha256 != state.state_sha256:
            return RuntimeReplayResult(False, state, None, sequence, "runtime_prior_state_mismatch")
        state_after = body.intrinsic_data.get("state_after")
        if not isinstance(state_after, Mapping):
            return RuntimeReplayResult(False, state, None, sequence, "runtime_state_after_missing")
        prefix_anchor = LedgerAnchor(sequence, event.event_sha256)
        try:
            next_state = _state_from_body(state_after, prefix_anchor)
        except (TypeError, ValueError):
            return RuntimeReplayResult(False, state, None, sequence, "runtime_state_after_invalid")
        if next_state.state_sha256 != body.resulting_state_sha256:
            return RuntimeReplayResult(False, state, None, sequence, "runtime_result_state_mismatch")
        if next_state.state_sha256 == state.state_sha256:
            if next_state.revision != state.revision or next_state.phase != state.phase:
                return RuntimeReplayResult(False, state, None, sequence, "runtime_revision_mismatch")
        else:
            if next_state.revision != state.revision + 1:
                return RuntimeReplayResult(False, state, None, sequence, "runtime_revision_mismatch")
            try:
                from .lifecycle import can_transition

                lifecycle_known = can_transition(state.phase, next_state.phase)
            except ValueError:
                lifecycle_known = False
            if state.phase != next_state.phase and not lifecycle_known:
                return RuntimeReplayResult(False, state, None, sequence, "runtime_phase_transition_invalid")
        state = next_state
    snapshot = create_ledger_snapshot(state, anchor)
    return RuntimeReplayResult(True, state, snapshot, None, "ok")
