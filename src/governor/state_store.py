"""External, atomic runtime-state storage with compare-and-swap semantics."""

from __future__ import annotations

from collections.abc import Mapping
import fcntl
import json
import os
from pathlib import Path
import re
import tempfile
from typing import Any

from .hashing import canonical_json_bytes
from .models import LedgerAnchor
from .runtime_models import (
    AgentState,
    TransitionError,
    agent_state_body,
    create_agent_state,
)


SAFE_TASK_ID = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._:-]*$")


def resolve_state_root(
    explicit_path: str | os.PathLike[str] | None = None,
    *,
    environment: Mapping[str, str] | None = None,
) -> Path:
    env = os.environ if environment is None else environment
    if explicit_path is not None:
        return Path(explicit_path).expanduser().resolve()
    xdg_root = env.get("XDG_STATE_HOME")
    if xdg_root:
        base = Path(xdg_root).expanduser()
    else:
        base = Path.home() / ".local" / "state"
    return (base / "seven-governors").resolve()


def _state_document(state: AgentState) -> dict[str, Any]:
    return {
        "state": agent_state_body(state),
        "state_sha256": state.state_sha256,
        "ledger_anchor": {
            "event_count": state.ledger_anchor.event_count,
            "head_sha256": state.ledger_anchor.head_sha256,
        },
    }


def _state_from_document(document: Mapping[str, Any]) -> AgentState:
    body = document["state"]
    anchor_body = document["ledger_anchor"]
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
            event_count=anchor_body.get("event_count"),
            head_sha256=anchor_body.get("head_sha256"),
        ),
    )
    if state.state_sha256 != document.get("state_sha256"):
        raise ValueError("stored_state_sha256_mismatch")
    return state


class StateStore:
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
        return self.root / f"{task_id}.json"

    def load(self, task_id: str) -> AgentState | None:
        path = self._path(task_id)
        if not path.exists():
            return None
        if path.is_symlink() or not path.is_file():
            raise TransitionError("unsafe_state_file")
        try:
            return _state_from_document(json.loads(path.read_text(encoding="utf-8")))
        except (KeyError, TypeError, ValueError, json.JSONDecodeError) as error:
            raise TransitionError("stored_state_invalid") from error

    def save(
        self,
        state: AgentState,
        *,
        expected_state_sha256: str | None,
        expected_ledger_sha256: str | None,
    ) -> None:
        self.root.mkdir(parents=True, exist_ok=True)
        path = self._path(state.task_id)
        lock_path = self.root / f"{state.task_id}.lock"
        if path.is_symlink() or lock_path.is_symlink():
            raise TransitionError("unsafe_state_file")
        with lock_path.open("a+b") as lock_file:
            fcntl.flock(lock_file.fileno(), fcntl.LOCK_EX)
            current = self.load(state.task_id)
            if current is None:
                if expected_state_sha256 is not None or expected_ledger_sha256 is not None:
                    raise TransitionError("state_compare_and_swap_failed")
            elif (
                current.state_sha256 != expected_state_sha256
                or current.ledger_anchor.head_sha256 != expected_ledger_sha256
            ):
                raise TransitionError("state_compare_and_swap_failed")
            descriptor, temporary_name = tempfile.mkstemp(
                dir=self.root,
                prefix=f".{state.task_id}.",
                suffix=".tmp",
            )
            try:
                with os.fdopen(descriptor, "wb") as temporary_file:
                    temporary_file.write(canonical_json_bytes(_state_document(state)))
                    temporary_file.flush()
                    os.fsync(temporary_file.fileno())
                os.replace(temporary_name, path)
            finally:
                if os.path.exists(temporary_name):
                    os.unlink(temporary_name)
