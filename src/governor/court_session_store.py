"""External atomic persistence for complete CRT-305 Court sessions."""

from __future__ import annotations

from collections.abc import Mapping
import fcntl
import json
import os
from pathlib import Path
import tempfile
from typing import Any

from .court_runtime import (
    CourtRuntimeError,
    CourtRuntimeSnapshot,
    CourtRuntimeState,
    create_court_runtime_snapshot,
    deserialize_court_runtime_snapshot,
    deserialize_court_runtime_state,
    deserialize_ledger_event,
    replay_court_runtime_ledger,
    serialize_court_runtime_snapshot,
    serialize_court_runtime_state,
    serialize_ledger_event,
)
from .hashing import canonical_json_bytes
from .ledger import GENESIS_SHA256
from .models import LedgerAnchor, LedgerEvent


COURT_SESSION_SCHEMA_VERSION = "crt-305.court-runtime-session.v1"
_REPOSITORY_ROOT = Path(__file__).resolve().parents[2]


def resolve_court_state_root(
    explicit_path: str | os.PathLike[str] | None = None,
    *,
    environment: Mapping[str, str] | None = None,
) -> Path:
    env = os.environ if environment is None else environment
    if explicit_path is not None:
        raw = Path(explicit_path).expanduser()
    else:
        state_home = env.get("XDG_STATE_HOME")
        base = Path(state_home).expanduser() if state_home else Path.home() / ".local" / "state"
        raw = base / "seven-governors" / "court"
    if raw.is_symlink():
        raise CourtRuntimeError("unsafe_court_state_root")
    return raw.resolve()


def serialize_court_session_document(
    genesis_state: CourtRuntimeState,
    current_state: CourtRuntimeState,
    events: tuple[LedgerEvent, ...],
) -> dict[str, Any]:
    snapshot = create_court_runtime_snapshot(current_state)
    return {
        "schemaVersion": COURT_SESSION_SCHEMA_VERSION,
        "genesisState": serialize_court_runtime_state(genesis_state),
        "currentState": serialize_court_runtime_state(current_state),
        "events": [serialize_ledger_event(event) for event in events],
        "trustedAnchor": {
            "eventCount": current_state.ledger_anchor.event_count,
            "headSha256": current_state.ledger_anchor.head_sha256,
        },
        "snapshot": serialize_court_runtime_snapshot(snapshot),
    }


def deserialize_court_session_document(
    value: Any,
) -> tuple[CourtRuntimeState, CourtRuntimeState, tuple[LedgerEvent, ...], CourtRuntimeSnapshot]:
    required = {
        "schemaVersion", "genesisState", "currentState", "events", "trustedAnchor", "snapshot"
    }
    if not isinstance(value, Mapping) or set(value) != required:
        raise CourtRuntimeError("stored_court_session_invalid")
    if value["schemaVersion"] != COURT_SESSION_SCHEMA_VERSION:
        raise CourtRuntimeError("stored_court_session_schema_mismatch")
    anchor_body = value["trustedAnchor"]
    if not isinstance(anchor_body, Mapping) or set(anchor_body) != {"eventCount", "headSha256"}:
        raise CourtRuntimeError("stored_court_session_invalid")
    events_body = value["events"]
    if not isinstance(events_body, list):
        raise CourtRuntimeError("stored_court_session_invalid")
    try:
        genesis = deserialize_court_runtime_state(value["genesisState"])
        current = deserialize_court_runtime_state(value["currentState"])
        events = tuple(deserialize_ledger_event(item) for item in events_body)
        trusted_anchor = LedgerAnchor(anchor_body["eventCount"], anchor_body["headSha256"])
        snapshot = deserialize_court_runtime_snapshot(value["snapshot"])
    except (KeyError, TypeError, ValueError) as error:
        if isinstance(error, CourtRuntimeError):
            raise
        raise CourtRuntimeError("stored_court_session_invalid") from error
    if genesis.session_id != current.session_id:
        raise CourtRuntimeError("stored_court_session_id_mismatch")
    if genesis.ledger_anchor != LedgerAnchor(0, GENESIS_SHA256):
        raise CourtRuntimeError("stored_court_genesis_invalid")
    if current.ledger_anchor != trusted_anchor:
        raise CourtRuntimeError("stored_court_anchor_mismatch")
    replay = replay_court_runtime_ledger(
        genesis,
        events,
        trusted_anchor,
        expected_snapshot=snapshot,
    )
    if not replay.valid:
        raise CourtRuntimeError(f"stored_court_replay_invalid:{replay.reason_code}")
    if replay.state != current:
        raise CourtRuntimeError("stored_court_current_state_mismatch")
    if replay.snapshot != snapshot:
        raise CourtRuntimeError("stored_court_snapshot_mismatch")
    return genesis, current, events, snapshot


class CourtSessionStore:
    """Persist one Court genesis state, current state, and complete ledger."""

    def __init__(
        self,
        root: str | os.PathLike[str] | None = None,
        *,
        repository_root: str | os.PathLike[str] | None = None,
        environment: Mapping[str, str] | None = None,
    ) -> None:
        self.root = resolve_court_state_root(root, environment=environment)
        repository = (
            Path(repository_root).resolve()
            if repository_root is not None
            else _REPOSITORY_ROOT
        )
        if self.root == repository or repository in self.root.parents:
            raise CourtRuntimeError("court_state_path_inside_repository")

    def _path(self, session_id: str) -> Path:
        # State construction applies the same identifier rule; stores also guard direct calls.
        from .court_runtime import _SESSION_ID

        if not isinstance(session_id, str) or not _SESSION_ID.fullmatch(session_id):
            raise CourtRuntimeError("unsafe_court_session_id")
        return self.root / f"{session_id}.session.json"

    def _lock_path(self, session_id: str) -> Path:
        self._path(session_id)
        return self.root / f"{session_id}.session.lock"

    def load(
        self, session_id: str
    ) -> tuple[CourtRuntimeState, CourtRuntimeState, tuple[LedgerEvent, ...]] | None:
        path = self._path(session_id)
        if not path.exists():
            return None
        if path.is_symlink() or not path.is_file():
            raise CourtRuntimeError("unsafe_court_state_file")
        try:
            document = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as error:
            raise CourtRuntimeError("stored_court_session_invalid") from error
        genesis, current, events, _ = deserialize_court_session_document(document)
        if current.session_id != session_id:
            raise CourtRuntimeError("stored_court_session_id_mismatch")
        return genesis, current, events

    def create(self, state: CourtRuntimeState) -> None:
        if state.revision != 0 or state.consumed_token_ids or state.ledger_anchor != LedgerAnchor(0, GENESIS_SHA256):
            raise CourtRuntimeError("court_session_requires_genesis_state")
        self._ensure_root()
        path = self._path(state.session_id)
        lock_path = self._lock_path(state.session_id)
        self._reject_symlinks(path, lock_path)
        with lock_path.open("a+b") as lock_file:
            fcntl.flock(lock_file.fileno(), fcntl.LOCK_EX)
            if path.exists():
                raise CourtRuntimeError("court_session_already_exists")
            self._write(state, state, ())

    def save(
        self,
        state: CourtRuntimeState,
        events: tuple[LedgerEvent, ...],
        *,
        expected_state_sha256: str | None,
        expected_ledger_head: str | None,
    ) -> None:
        materialized = tuple(events)
        self._ensure_root()
        path = self._path(state.session_id)
        lock_path = self._lock_path(state.session_id)
        self._reject_symlinks(path, lock_path)
        with lock_path.open("a+b") as lock_file:
            fcntl.flock(lock_file.fileno(), fcntl.LOCK_EX)
            current = self.load(state.session_id)
            if current is None:
                raise CourtRuntimeError("court_session_not_found")
            genesis, stored_state, _ = current
            if (
                stored_state.state_sha256 != expected_state_sha256
                or stored_state.ledger_anchor.head_sha256 != expected_ledger_head
            ):
                raise CourtRuntimeError("court_state_compare_and_swap_failed")
            replay = replay_court_runtime_ledger(
                genesis, materialized, state.ledger_anchor
            )
            if not replay.valid or replay.state != state:
                reason = replay.reason_code if not replay.valid else "terminal_state_mismatch"
                raise CourtRuntimeError(f"court_session_semantic_replay_failed:{reason}")
            self._write(genesis, state, materialized)

    def _ensure_root(self) -> None:
        if self.root.exists() and (self.root.is_symlink() or not self.root.is_dir()):
            raise CourtRuntimeError("unsafe_court_state_root")
        self.root.mkdir(parents=True, exist_ok=True)
        if self.root.is_symlink():
            raise CourtRuntimeError("unsafe_court_state_root")

    @staticmethod
    def _reject_symlinks(*paths: Path) -> None:
        if any(path.is_symlink() for path in paths):
            raise CourtRuntimeError("unsafe_court_state_file")

    def _write(
        self,
        genesis: CourtRuntimeState,
        state: CourtRuntimeState,
        events: tuple[LedgerEvent, ...],
    ) -> None:
        replay = replay_court_runtime_ledger(genesis, events, state.ledger_anchor)
        if not replay.valid or replay.state != state:
            reason = replay.reason_code if not replay.valid else "terminal_state_mismatch"
            raise CourtRuntimeError(f"court_session_semantic_replay_failed:{reason}")
        path = self._path(state.session_id)
        if path.is_symlink():
            raise CourtRuntimeError("unsafe_court_state_file")
        descriptor, temporary_name = tempfile.mkstemp(
            dir=self.root,
            prefix=f".{state.session_id}.",
            suffix=".tmp",
        )
        try:
            with os.fdopen(descriptor, "wb") as temporary_file:
                temporary_file.write(
                    canonical_json_bytes(
                        serialize_court_session_document(genesis, state, events)
                    )
                )
                temporary_file.flush()
                os.fsync(temporary_file.fileno())
            os.replace(temporary_name, path)
        finally:
            if os.path.exists(temporary_name):
                os.unlink(temporary_name)


__all__ = (
    "COURT_SESSION_SCHEMA_VERSION",
    "CourtSessionStore",
    "deserialize_court_session_document",
    "resolve_court_state_root",
    "serialize_court_session_document",
)
