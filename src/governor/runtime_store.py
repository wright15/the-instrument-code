"""Atomic persistence of authoritative runtime sessions (state plus ledger).

The session store is the production counterpart to the in-memory test flows:
it keeps the genesis state, the current :class:`AgentState`, and the complete
append-only ledger event sequence in one canonical JSON document outside the
repository. All writes are compare-and-swap, locked, and atomic. The store
never grants transition authority; it only persists what the runtime already
decided.
"""

from __future__ import annotations

from collections.abc import Mapping
import fcntl
import json
import os
from pathlib import Path
import tempfile
from typing import Any

from .hashing import canonical_json_bytes
from .ledger import compute_event_hash, compute_event_payload_hash, verify_ledger
from .models import LedgerAnchor, LedgerEvent, thaw_json
from .runtime_models import (
    AgentState,
    TransitionError,
    agent_state_body,
    create_agent_state,
)
from .state_store import SAFE_TASK_ID, resolve_state_root


RUNTIME_SESSION_SCHEMA_VERSION = "gov-207.runtime-session.v1"


def _event_body(event: LedgerEvent) -> dict[str, Any]:
    return {
        "sequence": event.sequence,
        "previousEventSha256": event.previous_event_sha256,
        "payload": thaw_json(event.payload),
        "payloadSha256": event.payload_sha256,
        "eventSha256": event.event_sha256,
    }


def _event_from_body(body: Any) -> LedgerEvent:
    if not isinstance(body, Mapping):
        raise TransitionError("stored_event_invalid")
    try:
        event = LedgerEvent(
            sequence=body["sequence"],
            previous_event_sha256=body["previousEventSha256"],
            payload=body["payload"],
            payload_sha256=body["payloadSha256"],
            event_sha256=body["eventSha256"],
        )
    except (KeyError, TypeError, ValueError) as error:
        raise TransitionError("stored_event_invalid") from error
    if compute_event_payload_hash(event) != event.payload_sha256:
        raise TransitionError("stored_event_hash_mismatch")
    if compute_event_hash(event) != event.event_sha256:
        raise TransitionError("stored_event_hash_mismatch")
    return event


def _state_body(state: AgentState) -> dict[str, Any]:
    return {
        "state": agent_state_body(state),
        "stateSha256": state.state_sha256,
        "ledgerAnchor": {
            "eventCount": state.ledger_anchor.event_count,
            "headSha256": state.ledger_anchor.head_sha256,
        },
    }


def _session_document(
    initial_state: AgentState,
    state: AgentState,
    events: tuple[LedgerEvent, ...],
) -> dict[str, Any]:
    return {
        "schemaVersion": RUNTIME_SESSION_SCHEMA_VERSION,
        "initialState": _state_body(initial_state),
        "state": _state_body(state),
        "events": [_event_body(event) for event in events],
    }


def _state_from_document(document: Any) -> AgentState:
    if not isinstance(document, Mapping):
        raise TransitionError("stored_state_invalid")
    try:
        body = document["state"]
        anchor_body = document["ledgerAnchor"]
        if not isinstance(body, Mapping) or not isinstance(anchor_body, Mapping):
            raise ValueError("state_document_invalid")
        state = create_agent_state(
            task_id=body.get("task_id"),
            revision=body.get("revision"),
            phase=body.get("phase"),
            policy_sha256=body.get("policy_sha256"),
            context_sha256=body.get("context_sha256"),
            capabilities=tuple(body.get("capabilities", ())),
            data=body.get("data", {}),
            pending_attempt_id=body.get("pending_attempt_id"),
            consumed_token_ids=tuple(body.get("consumed_token_ids", ())),
            ledger_anchor=LedgerAnchor(
                event_count=anchor_body.get("eventCount"),
                head_sha256=anchor_body.get("headSha256"),
            ),
        )
    except (KeyError, TypeError, ValueError) as error:
        raise TransitionError("stored_state_invalid") from error
    if state.state_sha256 != document.get("stateSha256"):
        raise TransitionError("stored_state_hash_mismatch")
    return state


class RuntimeSessionStore:
    """Persist one task's genesis state, current state, and complete ledger."""

    def __init__(
        self,
        root: str | os.PathLike[str] | None = None,
        *,
        repository_root: str | os.PathLike[str] | None = None,
        environment: Mapping[str, str] | None = None,
    ) -> None:
        self.root = resolve_state_root(root, environment=environment)
        if repository_root is not None:
            repository = Path(repository_root).resolve()
            if self.root == repository or repository in self.root.parents:
                raise TransitionError("state_path_inside_repository")

    def _path(self, task_id: str) -> Path:
        if not SAFE_TASK_ID.fullmatch(task_id):
            raise TransitionError("unsafe_task_id")
        return self.root / f"{task_id}.session.json"

    def load(
        self, task_id: str
    ) -> tuple[AgentState, AgentState, tuple[LedgerEvent, ...]] | None:
        """Return ``(initial_state, current_state, events)`` or ``None``."""

        path = self._path(task_id)
        if not path.exists():
            return None
        if path.is_symlink() or not path.is_file():
            raise TransitionError("unsafe_state_file")
        try:
            document = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as error:
            raise TransitionError("stored_session_invalid") from error
        if not isinstance(document, Mapping):
            raise TransitionError("stored_session_invalid")
        if document.get("schemaVersion") != RUNTIME_SESSION_SCHEMA_VERSION:
            raise TransitionError("stored_session_schema_mismatch")
        initial_state = _state_from_document(document.get("initialState"))
        state = _state_from_document(document.get("state"))
        events_document = document.get("events")
        if not isinstance(events_document, list):
            raise TransitionError("stored_session_invalid")
        events = tuple(_event_from_body(item) for item in events_document)
        if initial_state.task_id != state.task_id:
            raise TransitionError("stored_session_task_mismatch")
        verification = verify_ledger(events, state.ledger_anchor)
        if not verification.valid:
            raise TransitionError("stored_ledger_invalid")
        return initial_state, state, events

    def create(self, state: AgentState) -> None:
        """Create a new session with an empty ledger; fail if one exists."""

        if self.load(state.task_id) is not None:
            raise TransitionError("session_already_exists")
        self._write(state, state, ())

    def save(
        self,
        state: AgentState,
        events: tuple[LedgerEvent, ...],
        *,
        expected_state_sha256: str | None,
        expected_ledger_sha256: str | None,
    ) -> None:
        """Compare-and-swap the current state and extended ledger."""

        verification = verify_ledger(events, state.ledger_anchor)
        if not verification.valid:
            raise TransitionError("session_ledger_invalid")
        self.root.mkdir(parents=True, exist_ok=True)
        path = self._path(state.task_id)
        lock_path = self.root / f"{state.task_id}.session.lock"
        if path.is_symlink() or lock_path.is_symlink():
            raise TransitionError("unsafe_state_file")
        with lock_path.open("a+b") as lock_file:
            fcntl.flock(lock_file.fileno(), fcntl.LOCK_EX)
            current = self.load(state.task_id)
            if current is None:
                raise TransitionError("session_not_found")
            initial_state, current_state, _ = current
            if (
                current_state.state_sha256 != expected_state_sha256
                or current_state.ledger_anchor.head_sha256 != expected_ledger_sha256
            ):
                raise TransitionError("state_compare_and_swap_failed")
            self._write(initial_state, state, events)

    def _write(
        self,
        initial_state: AgentState,
        state: AgentState,
        events: tuple[LedgerEvent, ...],
    ) -> None:
        verification = verify_ledger(events, state.ledger_anchor)
        if not verification.valid:
            raise TransitionError("session_ledger_invalid")
        self.root.mkdir(parents=True, exist_ok=True)
        path = self._path(state.task_id)
        if path.is_symlink():
            raise TransitionError("unsafe_state_file")
        descriptor, temporary_name = tempfile.mkstemp(
            dir=self.root,
            prefix=f".{state.task_id}.",
            suffix=".tmp",
        )
        try:
            with os.fdopen(descriptor, "wb") as temporary_file:
                temporary_file.write(
                    canonical_json_bytes(
                        _session_document(initial_state, state, events)
                    )
                )
                temporary_file.flush()
                os.fsync(temporary_file.fileno())
            os.replace(temporary_name, path)
        finally:
            if os.path.exists(temporary_name):
                os.unlink(temporary_name)
