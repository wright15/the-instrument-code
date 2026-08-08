"""Capability-scoped executor registry and owned process cleanup."""

from __future__ import annotations

from collections.abc import Callable, Mapping
from dataclasses import dataclass, field
from pathlib import Path
import subprocess
import sys
from types import MappingProxyType
from typing import Any

from .evidence import CleanupResult, Postcondition, VictoryCondition
from .hashing import sha256_payload
from .models import FrozenDict, _require_identifier, freeze_json, thaw_json
from .runtime_models import TransitionError


@dataclass(frozen=True, slots=True)
class ExecutorSpec:
    executor_id: str
    operation_id: str
    capability: str
    postconditions: tuple[Postcondition, ...]
    victory_condition: VictoryCondition
    verified_state_updates: FrozenDict | dict[str, Any]
    cleanup_required: bool = True

    def __post_init__(self) -> None:
        _require_identifier(self.executor_id, "executor_id")
        _require_identifier(self.operation_id, "operation_id")
        _require_identifier(self.capability, "capability")
        postconditions = tuple(
            sorted(self.postconditions, key=lambda item: item.postcondition_id)
        )
        identifiers = {item.postcondition_id for item in postconditions}
        if len(identifiers) != len(postconditions):
            raise ValueError("duplicate_executor_postcondition")
        if not set(self.victory_condition.required_postcondition_ids).issubset(identifiers):
            raise ValueError("victory_condition_references_unknown_postcondition")
        if not self.cleanup_required:
            raise ValueError("executor_requires_cleanup_contract")
        object.__setattr__(self, "postconditions", postconditions)
        object.__setattr__(self, "verified_state_updates", freeze_json(self.verified_state_updates))


@dataclass(frozen=True, slots=True)
class ExecutionAttempt:
    attempt_id: str
    operation_id: str
    capability: str
    normalized_parameters: FrozenDict | dict[str, Any]
    started: bool
    reason_code: str
    observation: FrozenDict | dict[str, Any] = field(default_factory=FrozenDict)

    def __post_init__(self) -> None:
        _require_identifier(self.attempt_id, "attempt_id")
        _require_identifier(self.operation_id, "operation_id")
        _require_identifier(self.capability, "capability")
        _require_identifier(self.reason_code, "reason_code")
        object.__setattr__(self, "normalized_parameters", freeze_json(self.normalized_parameters))
        object.__setattr__(self, "observation", freeze_json(self.observation))


@dataclass(slots=True)
class _ExecutionHandle:
    attempt_id: str
    capability: str
    process: subprocess.Popen[bytes]
    executable_sha256: str
    argv_sha256: str
    endpoint: tuple[str, int] | None


@dataclass(frozen=True, slots=True)
class ExecutionOutcome:
    attempt: ExecutionAttempt
    handle: _ExecutionHandle | None


ExecutorFunction = Callable[[FrozenDict, str], ExecutionOutcome]
CleanupFunction = Callable[[_ExecutionHandle | None], CleanupResult]


class ExecutorRegistry:
    """Immutable registry with no fallback or raw-command path."""

    def __init__(
        self,
        entries: Mapping[
            str, tuple[ExecutorSpec, ExecutorFunction, CleanupFunction]
        ],
    ) -> None:
        records: dict[
            str, tuple[ExecutorSpec, ExecutorFunction, CleanupFunction]
        ] = {}
        for operation_id, entry in entries.items():
            spec, executor, cleanup = entry
            if operation_id != spec.operation_id:
                raise ValueError("executor_registry_operation_mismatch")
            if not callable(executor) or not callable(cleanup):
                raise TypeError("executor_and_cleanup_must_be_callable")
            records[operation_id] = entry
        self._records = MappingProxyType(records)

    def get_spec(self, operation_id: str) -> ExecutorSpec | None:
        record = self._records.get(operation_id)
        return record[0] if record else None

    def execute(
        self,
        operation_id: str,
        capability: str,
        normalized_parameters: FrozenDict,
        attempt_id: str,
    ) -> ExecutionOutcome:
        record = self._records.get(operation_id)
        if record is None:
            raise TransitionError("executor_not_registered")
        spec, executor, _ = record
        if capability != spec.capability:
            raise TransitionError("executor_capability_mismatch")
        try:
            outcome = executor(normalized_parameters, attempt_id)
        except Exception:
            return ExecutionOutcome(
                ExecutionAttempt(
                    attempt_id,
                    operation_id,
                    capability,
                    normalized_parameters,
                    False,
                    "executor_exception",
                ),
                None,
            )
        if outcome.attempt.operation_id != operation_id:
            raise TransitionError("executor_attempt_operation_mismatch")
        if outcome.attempt.capability != capability:
            raise TransitionError("executor_attempt_capability_mismatch")
        return outcome

    def cleanup(
        self, operation_id: str, handle: _ExecutionHandle | None
    ) -> CleanupResult:
        record = self._records.get(operation_id)
        if record is None:
            raise TransitionError("executor_not_registered")
        try:
            return record[2](handle)
        except Exception:
            return CleanupResult(True, False, False, "cleanup_exception")


def process_cleanup(handle: _ExecutionHandle | None) -> CleanupResult:
    if handle is None:
        return CleanupResult(False, True, False, "no_resource")
    process = handle.process
    if process.poll() is not None:
        return CleanupResult(
            True,
            True,
            False,
            "already_exited",
            {"exit_status": process.returncode},
        )
    fallback_used = False
    try:
        process.terminate()
        process.wait(timeout=1.0)
    except subprocess.TimeoutExpired:
        fallback_used = True
        process.kill()
        try:
            process.wait(timeout=1.0)
        except subprocess.TimeoutExpired:
            return CleanupResult(
                True,
                False,
                True,
                "cleanup_timeout",
                {"pid": process.pid},
            )
    return CleanupResult(
        True,
        process.poll() is not None,
        fallback_used,
        "cleanup_complete" if process.poll() is not None else "cleanup_failed",
        {"exit_status": process.returncode, "pid": process.pid},
    )


def make_start_site_executor(
    script_path: str | Path,
    spec: ExecutorSpec,
) -> tuple[ExecutorSpec, ExecutorFunction, CleanupFunction]:
    """Bind a fixed test/first-party server program; parameters cannot supply argv."""

    script = Path(script_path).resolve()

    def execute(parameters: FrozenDict, attempt_id: str) -> ExecutionOutcome:
        port = parameters.get("port")
        bind_port = parameters.get("bind_port", port)
        mode = parameters.get("mode", "normal")
        status = parameters.get("status", 200)
        body = parameters.get("body", "ready")
        delay = parameters.get("delay", 0)
        if not isinstance(port, int) or not isinstance(bind_port, int):
            raise ValueError("start_site_port_invalid")
        argv = [
            sys.executable,
            str(script),
            "--port",
            str(bind_port),
            "--mode",
            str(mode),
            "--status",
            str(status),
            "--body",
            str(body),
            "--delay",
            str(delay),
        ]
        process = subprocess.Popen(
            argv,
            stdin=subprocess.DEVNULL,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        executable_sha = sha256_payload({"executable": sys.executable})
        handle = _ExecutionHandle(
            attempt_id=attempt_id,
            capability=spec.capability,
            process=process,
            executable_sha256=executable_sha,
            argv_sha256=sha256_payload(argv),
            endpoint=("127.0.0.1", port),
        )
        return ExecutionOutcome(
            ExecutionAttempt(
                attempt_id=attempt_id,
                operation_id=spec.operation_id,
                capability=spec.capability,
                normalized_parameters=parameters,
                started=True,
                reason_code="started",
                observation={
                    "pid": process.pid,
                    "executable_sha256": executable_sha,
                    "argv_sha256": handle.argv_sha256,
                },
            ),
            handle,
        )

    return spec, execute, process_cleanup
