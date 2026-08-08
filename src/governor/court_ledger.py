"""Hash-chained transition ledger and deterministic replay for parallel CourtState."""

from __future__ import annotations

from collections.abc import Iterable, Mapping
from dataclasses import dataclass, replace
from typing import Any

from .harmonic_models import (
    COURT_STATE_SCHEMA_VERSION,
    CourtState,
    court_state_body,
    court_state_with_anchor,
    create_court_state,
)
from .hashing import sha256_payload
from .ledger import GENESIS_SHA256, compute_event_hash, verify_ledger
from .models import (
    LedgerAnchor,
    LedgerEvent,
    _require_identifier,
    _require_sha256,
    freeze_json,
    thaw_json,
)


COURT_EVENT_SCHEMA_VERSION = "crt-305.court-transition-event.v1"
COURT_SNAPSHOT_SCHEMA_VERSION = "crt-305.court-ledger-snapshot.v1"
COURT_POSITION_IDS = tuple(f"court-position:C{index}" for index in range(5))


@dataclass(frozen=True, slots=True)
class CourtTransitionEventBody:
    event_id: str
    event_kind: str
    prior_court_state_sha256: str
    resulting_court_state_sha256: str
    operation_id: str
    state_after: Mapping[str, Any]

    def __post_init__(self) -> None:
        _require_sha256(self.event_id, "court_event_id")
        _require_identifier(self.event_kind, "court_event_kind")
        _require_sha256(self.prior_court_state_sha256, "prior_court_state_sha256")
        _require_sha256(self.resulting_court_state_sha256, "resulting_court_state_sha256")
        _require_identifier(self.operation_id, "court_operation_id")
        object.__setattr__(self, "state_after", freeze_json(self.state_after))
        if self.event_id != sha256_payload(court_event_identity_body(self)):
            raise ValueError("court_event_id_mismatch")


@dataclass(frozen=True, slots=True)
class CourtLedgerSnapshot:
    state: CourtState
    anchor: LedgerAnchor
    snapshot_sha256: str

    def __post_init__(self) -> None:
        if self.anchor != self.state.ledger_anchor:
            raise ValueError("court_snapshot_anchor_mismatch")
        _require_sha256(self.snapshot_sha256, "court_snapshot_sha256")
        if self.snapshot_sha256 != compute_court_snapshot_hash(self.state, self.anchor):
            raise ValueError("court_snapshot_sha256_mismatch")


@dataclass(frozen=True, slots=True)
class CourtReplayResult:
    valid: bool
    state: CourtState
    snapshot: CourtLedgerSnapshot | None
    first_failing_sequence: int | None
    reason_code: str


def court_event_identity_body(body: CourtTransitionEventBody) -> dict[str, object]:
    return {
        "schemaVersion": COURT_EVENT_SCHEMA_VERSION,
        "eventKind": body.event_kind,
        "priorCourtStateSha256": body.prior_court_state_sha256,
        "resultingCourtStateSha256": body.resulting_court_state_sha256,
        "operationId": body.operation_id,
        "stateAfter": thaw_json(body.state_after),
    }


def create_court_transition_event_body(
    prior_state: CourtState,
    resulting_state: CourtState,
    *,
    operation_id: str,
) -> CourtTransitionEventBody:
    if type(prior_state) is not CourtState or type(resulting_state) is not CourtState:
        raise TypeError("court_transition_requires_court_states")
    _require_identifier(operation_id, "court_operation_id")
    if resulting_state.revision != prior_state.revision + 1:
        raise ValueError("court_transition_revision_mismatch")
    if resulting_state.harmonic_profile_sha256 != prior_state.harmonic_profile_sha256:
        raise ValueError("court_transition_profile_mismatch")
    if resulting_state.court_policy_sha256 != prior_state.court_policy_sha256:
        raise ValueError("court_transition_policy_mismatch")
    if resulting_state.ledger_anchor != prior_state.ledger_anchor:
        raise ValueError("court_transition_anchor_must_be_uncommitted")
    _validate_court_transition(prior_state, resulting_state, operation_id)
    draft = object.__new__(CourtTransitionEventBody)
    object.__setattr__(draft, "event_id", GENESIS_SHA256)
    object.__setattr__(draft, "event_kind", "court_transition_applied")
    object.__setattr__(draft, "prior_court_state_sha256", prior_state.court_state_sha256)
    object.__setattr__(draft, "resulting_court_state_sha256", resulting_state.court_state_sha256)
    object.__setattr__(draft, "operation_id", operation_id)
    object.__setattr__(draft, "state_after", freeze_json(court_state_body(resulting_state)))
    return CourtTransitionEventBody(
        event_id=sha256_payload(court_event_identity_body(draft)),
        event_kind=draft.event_kind,
        prior_court_state_sha256=draft.prior_court_state_sha256,
        resulting_court_state_sha256=draft.resulting_court_state_sha256,
        operation_id=operation_id,
        state_after=draft.state_after,
    )


def _validate_court_transition(
    prior_state: CourtState,
    resulting_state: CourtState,
    operation_id: str,
) -> None:
    try:
        prior_index = COURT_POSITION_IDS.index(prior_state.court_position_id)
        resulting_index = COURT_POSITION_IDS.index(resulting_state.court_position_id)
    except ValueError as error:
        raise ValueError("court_position_not_canonical") from error
    expected_delta = {"court:advance": 1, "court:retreat": -1}.get(operation_id)
    if expected_delta is None:
        raise ValueError("court_operation_not_registered")
    if resulting_index - prior_index != expected_delta:
        raise ValueError("court_transition_not_adjacent")


def _state_from_event_body(
    body: CourtTransitionEventBody,
    anchor: LedgerAnchor,
) -> CourtState:
    state_after = thaw_json(body.state_after)
    if state_after.get("schema_version") != COURT_STATE_SCHEMA_VERSION:
        raise ValueError("court_state_schema_mismatch")
    state = create_court_state(
        court_position_id=state_after.get("court_position_id"),
        revision=state_after.get("revision"),
        harmonic_profile_sha256=state_after.get("harmonic_profile_sha256"),
        court_policy_sha256=state_after.get("court_policy_sha256"),
        ledger_anchor=anchor,
    )
    if body.resulting_court_state_sha256 != state.court_state_sha256:
        raise ValueError("court_event_result_state_mismatch")
    return state


def _verify_existing_court_history(
    events: tuple[LedgerEvent, ...],
    terminal_state: CourtState,
) -> None:
    previous_state: CourtState | None = None
    for event in events:
        body = _event_body_from_payload(thaw_json(event.payload))
        if body.event_kind != "court_transition_applied":
            raise ValueError("court_event_kind_invalid")
        state = _state_from_event_body(
            body,
            LedgerAnchor(event.sequence, event.event_sha256),
        )
        if previous_state is not None:
            if body.prior_court_state_sha256 != previous_state.court_state_sha256:
                raise ValueError("court_event_prior_state_mismatch")
            if state.revision != previous_state.revision + 1:
                raise ValueError("court_transition_revision_mismatch")
            _validate_court_transition(previous_state, state, body.operation_id)
        previous_state = state
    if previous_state is not None and (
        previous_state.court_state_sha256 != terminal_state.court_state_sha256
        or previous_state.ledger_anchor != terminal_state.ledger_anchor
    ):
        raise ValueError("court_history_terminal_state_mismatch")


def court_event_payload(body: CourtTransitionEventBody) -> dict[str, object]:
    return {
        **court_event_identity_body(body),
        "eventId": body.event_id,
    }


def append_court_transition(
    events: Iterable[LedgerEvent],
    prior_state: CourtState,
    resulting_state: CourtState,
    *,
    operation_id: str,
) -> tuple[tuple[LedgerEvent, ...], CourtState]:
    materialized = tuple(events)
    if not verify_ledger(materialized, prior_state.ledger_anchor).valid:
        raise ValueError("existing_court_ledger_invalid")
    _verify_existing_court_history(materialized, prior_state)
    body = create_court_transition_event_body(
        prior_state,
        resulting_state,
        operation_id=operation_id,
    )
    payload = court_event_payload(body)
    draft = LedgerEvent(
        sequence=len(materialized) + 1,
        previous_event_sha256=prior_state.ledger_anchor.head_sha256,
        payload=payload,
        payload_sha256=sha256_payload(payload),
        event_sha256=GENESIS_SHA256,
    )
    event = replace(draft, event_sha256=compute_event_hash(draft))
    anchor = LedgerAnchor(event.sequence, event.event_sha256)
    return materialized + (event,), court_state_with_anchor(resulting_state, anchor)


def compute_court_snapshot_hash(state: CourtState, anchor: LedgerAnchor) -> str:
    return sha256_payload(
        {
            "schemaVersion": COURT_SNAPSHOT_SCHEMA_VERSION,
            "courtStateSha256": state.court_state_sha256,
            "eventCount": anchor.event_count,
            "ledgerHeadSha256": anchor.head_sha256,
        }
    )


def create_court_ledger_snapshot(state: CourtState) -> CourtLedgerSnapshot:
    return CourtLedgerSnapshot(
        state=state,
        anchor=state.ledger_anchor,
        snapshot_sha256=compute_court_snapshot_hash(state, state.ledger_anchor),
    )


def _event_body_from_payload(payload: Mapping[str, Any]) -> CourtTransitionEventBody:
    if payload.get("schemaVersion") != COURT_EVENT_SCHEMA_VERSION:
        raise ValueError("court_event_schema_mismatch")
    return CourtTransitionEventBody(
        event_id=payload.get("eventId"),
        event_kind=payload.get("eventKind"),
        prior_court_state_sha256=payload.get("priorCourtStateSha256"),
        resulting_court_state_sha256=payload.get("resultingCourtStateSha256"),
        operation_id=payload.get("operationId"),
        state_after=payload.get("stateAfter", {}),
    )


def replay_court_ledger(
    initial_state: CourtState,
    events: Iterable[LedgerEvent],
    trusted_anchor: LedgerAnchor,
) -> CourtReplayResult:
    materialized = tuple(events)
    chain = verify_ledger(materialized, trusted_anchor)
    if not chain.valid:
        return CourtReplayResult(
            False,
            initial_state,
            None,
            chain.first_failing_sequence,
            chain.reason_code,
        )
    state = court_state_with_anchor(initial_state, LedgerAnchor(0, GENESIS_SHA256))
    for sequence, event in enumerate(materialized, start=1):
        try:
            body = _event_body_from_payload(thaw_json(event.payload))
            if body.event_kind != "court_transition_applied":
                raise ValueError("court_event_kind_invalid")
            if body.prior_court_state_sha256 != state.court_state_sha256:
                raise ValueError("court_event_prior_state_mismatch")
            next_state = _state_from_event_body(
                body,
                LedgerAnchor(sequence, event.event_sha256),
            )
            if next_state.revision != state.revision + 1:
                raise ValueError("court_transition_revision_mismatch")
            if next_state.harmonic_profile_sha256 != state.harmonic_profile_sha256:
                raise ValueError("court_transition_profile_mismatch")
            if next_state.court_policy_sha256 != state.court_policy_sha256:
                raise ValueError("court_transition_policy_mismatch")
            _validate_court_transition(state, next_state, body.operation_id)
            state = next_state
        except (TypeError, ValueError) as error:
            return CourtReplayResult(False, state, None, sequence, str(error))
    if state.ledger_anchor != trusted_anchor:
        return CourtReplayResult(False, state, None, max(1, len(materialized)), "court_anchor_mismatch")
    snapshot = create_court_ledger_snapshot(state)
    return CourtReplayResult(True, state, snapshot, None, "ok")
