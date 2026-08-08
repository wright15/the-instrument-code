"""Bounded registered objective verifier adapters."""

from __future__ import annotations

from collections.abc import Callable, Mapping
from dataclasses import dataclass
import hashlib
import http.client
import ipaddress
from pathlib import Path
import re
import time
from types import MappingProxyType
from typing import Any

from .evidence import (
    EvidenceType,
    EvidenceVerdict,
    Postcondition,
    VerifierResult,
    create_evidence_record,
)
from .executors import ExecutionAttempt, _ExecutionHandle
from .models import FrozenDict, _require_identifier, thaw_json
from .runtime_models import TransitionError


@dataclass(frozen=True, slots=True)
class VerifierSpec:
    verifier_id: str
    evidence_type: EvidenceType | str
    capability: str
    version: str

    def __post_init__(self) -> None:
        _require_identifier(self.verifier_id, "verifier_id")
        object.__setattr__(self, "evidence_type", EvidenceType(self.evidence_type))
        _require_identifier(self.capability, "capability")
        _require_identifier(self.version, "version")


@dataclass(frozen=True, slots=True)
class VerificationContext:
    attempt: ExecutionAttempt
    handle: _ExecutionHandle | None
    allowed_roots: tuple[Path, ...]
    regex_patterns: Mapping[str, re.Pattern[str]]
    max_bytes: int
    deadline: float | None
    monotonic: Callable[[], float]
    sleep: Callable[[float], None]


VerifierFunction = Callable[
    [Postcondition, VerificationContext],
    tuple[dict[str, Any], EvidenceVerdict, str],
]


class VerifierRegistry:
    def __init__(
        self,
        entries: Mapping[str, tuple[VerifierSpec, VerifierFunction]],
        *,
        allowed_roots: tuple[str | Path, ...] = (),
        regex_patterns: Mapping[str, str] | None = None,
        max_bytes: int = 1_048_576,
        monotonic: Callable[[], float] = time.monotonic,
        sleep: Callable[[float], None] = time.sleep,
    ) -> None:
        records: dict[str, tuple[VerifierSpec, VerifierFunction]] = {}
        for verifier_id, entry in entries.items():
            spec, verifier = entry
            if verifier_id != spec.verifier_id:
                raise ValueError("verifier_registry_id_mismatch")
            if not callable(verifier):
                raise TypeError("verifier_must_be_callable")
            records[verifier_id] = entry
        compiled = {
            identifier: re.compile(pattern)
            for identifier, pattern in (regex_patterns or {}).items()
            if len(pattern) <= 512
        }
        self._records = MappingProxyType(records)
        self._allowed_roots = tuple(Path(root).resolve() for root in allowed_roots)
        self._regex_patterns = MappingProxyType(compiled)
        self._max_bytes = max_bytes
        self._monotonic = monotonic
        self._sleep = sleep

    def has(self, verifier_id: str) -> bool:
        return verifier_id in self._records

    def verify(
        self,
        postcondition: Postcondition,
        attempt: ExecutionAttempt,
        handle: _ExecutionHandle | None,
        *,
        deadline: float | None = None,
    ) -> VerifierResult:
        record = self._records.get(postcondition.verifier_id)
        if record is None:
            raise TransitionError("verifier_not_registered")
        spec, verifier = record
        if spec.capability != attempt.capability:
            raise TransitionError("verifier_capability_mismatch")
        if spec.evidence_type is not postcondition.evidence_type:
            raise TransitionError("verifier_evidence_type_mismatch")
        context = VerificationContext(
            attempt=attempt,
            handle=handle,
            allowed_roots=self._allowed_roots,
            regex_patterns=self._regex_patterns,
            max_bytes=self._max_bytes,
            deadline=deadline,
            monotonic=self._monotonic,
            sleep=self._sleep,
        )
        try:
            observation, verdict, reason = verifier(postcondition, context)
        except Exception:
            observation, verdict, reason = (
                {"error": "verifier_exception"},
                EvidenceVerdict.ERROR,
                "verifier_exception",
            )
        evidence = create_evidence_record(
            attempt_id=attempt.attempt_id,
            capability=attempt.capability,
            postcondition=postcondition,
            observation=observation,
            verdict=verdict,
            verifier_version=spec.version,
        )
        return VerifierResult(postcondition.postcondition_id, evidence, reason)


def verify_exit_status(
    postcondition: Postcondition, context: VerificationContext
) -> tuple[dict[str, Any], EvidenceVerdict, str]:
    if context.handle is None:
        return {"exit_status": None}, EvidenceVerdict.ERROR, "process_handle_missing"
    status = context.handle.process.poll()
    expected = postcondition.expected.get("exit_status")
    verdict = EvidenceVerdict.PASS if status == expected else EvidenceVerdict.FAIL
    return {"exit_status": status}, verdict, "ok" if verdict is EvidenceVerdict.PASS else "exit_status_mismatch"


def verify_process(
    postcondition: Postcondition, context: VerificationContext
) -> tuple[dict[str, Any], EvidenceVerdict, str]:
    handle = context.handle
    if handle is None or handle.attempt_id != context.attempt.attempt_id:
        return {"owned": False}, EvidenceVerdict.ERROR, "process_handle_unowned"
    running = handle.process.poll() is None
    expected_running = postcondition.expected.get("running", True)
    expected_executable = postcondition.expected.get("executable_sha256")
    matches_executable = expected_executable in (None, handle.executable_sha256)
    passed = running == expected_running and matches_executable
    observation = {
        "owned": True,
        "pid": handle.process.pid,
        "running": running,
        "exit_status": handle.process.poll(),
        "executable_sha256": handle.executable_sha256,
        "argv_sha256": handle.argv_sha256,
    }
    return (
        observation,
        EvidenceVerdict.PASS if passed else EvidenceVerdict.FAIL,
        "ok" if passed else "process_identity_mismatch",
    )


def _allowed_path(path_value: Any, roots: tuple[Path, ...]) -> Path | None:
    if not isinstance(path_value, str):
        return None
    path = Path(path_value)
    if path.is_symlink():
        return None
    resolved = path.resolve()
    if not any(resolved == root or root in resolved.parents for root in roots):
        return None
    return resolved


def verify_file_sha256(
    postcondition: Postcondition, context: VerificationContext
) -> tuple[dict[str, Any], EvidenceVerdict, str]:
    path = _allowed_path(postcondition.request.get("path"), context.allowed_roots)
    if path is None:
        return {"allowed": False}, EvidenceVerdict.ERROR, "file_path_not_allowed"
    if not path.is_file():
        return {"allowed": True, "exists": False}, EvidenceVerdict.FAIL, "file_missing"
    size = path.stat().st_size
    if size > context.max_bytes:
        return {"allowed": True, "bytes": size}, EvidenceVerdict.ERROR, "file_too_large"
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    expected = postcondition.expected.get("sha256")
    passed = digest == expected
    return (
        {"allowed": True, "exists": True, "bytes": size, "sha256": digest},
        EvidenceVerdict.PASS if passed else EvidenceVerdict.FAIL,
        "ok" if passed else "file_sha256_mismatch",
    )


def _resolve_json_pointer(document: Any, pointer: str) -> Any:
    if pointer == "":
        return document
    if not pointer.startswith("/"):
        raise ValueError("invalid_json_pointer")
    current = document
    for raw_token in pointer[1:].split("/"):
        if re.search(r"~(?![01])", raw_token):
            raise ValueError("invalid_json_pointer_escape")
        token = raw_token.replace("~1", "/").replace("~0", "~")
        if isinstance(current, Mapping):
            current = current[token]
        elif isinstance(current, (list, tuple)):
            if token == "-" or not token.isdigit():
                raise KeyError(token)
            current = current[int(token)]
        else:
            raise KeyError(token)
    return current


def verify_json_pointer(
    postcondition: Postcondition, context: VerificationContext
) -> tuple[dict[str, Any], EvidenceVerdict, str]:
    document = thaw_json(postcondition.request.get("document"))
    pointer = postcondition.request.get("pointer")
    if not isinstance(pointer, str):
        return {"resolved": False}, EvidenceVerdict.ERROR, "json_pointer_invalid"
    try:
        actual = _resolve_json_pointer(document, pointer)
    except (KeyError, IndexError, ValueError):
        return {"resolved": False}, EvidenceVerdict.FAIL, "json_pointer_missing"
    expected = thaw_json(postcondition.expected.get("value"))
    passed = type(actual) is type(expected) and actual == expected
    return (
        {"resolved": True, "value": actual},
        EvidenceVerdict.PASS if passed else EvidenceVerdict.FAIL,
        "ok" if passed else "json_pointer_mismatch",
    )


def verify_regex(
    postcondition: Postcondition, context: VerificationContext
) -> tuple[dict[str, Any], EvidenceVerdict, str]:
    pattern_id = postcondition.request.get("pattern_id")
    text = postcondition.request.get("text")
    if not isinstance(pattern_id, str) or pattern_id not in context.regex_patterns:
        return {"registered": False}, EvidenceVerdict.ERROR, "regex_not_registered"
    if not isinstance(text, str) or len(text.encode("utf-8")) > context.max_bytes:
        return {"registered": True}, EvidenceVerdict.ERROR, "regex_input_too_large"
    matched = context.regex_patterns[pattern_id].search(text) is not None
    expected = postcondition.expected.get("matched", True)
    passed = matched is expected
    return (
        {"registered": True, "matched": matched, "pattern_id": pattern_id},
        EvidenceVerdict.PASS if passed else EvidenceVerdict.FAIL,
        "ok" if passed else "regex_mismatch",
    )


def verify_local_http(
    postcondition: Postcondition, context: VerificationContext
) -> tuple[dict[str, Any], EvidenceVerdict, str]:
    host = postcondition.request.get("host")
    port = postcondition.request.get("port")
    path = postcondition.request.get("path", "/")
    if not isinstance(host, str) or not isinstance(port, int) or not isinstance(path, str):
        return {"allowed": False}, EvidenceVerdict.ERROR, "http_request_invalid"
    try:
        if not ipaddress.ip_address(host).is_loopback:
            raise ValueError
    except ValueError:
        return {"allowed": False}, EvidenceVerdict.ERROR, "http_host_not_loopback"
    expected_status = postcondition.expected.get("status")
    expected_body_sha = postcondition.expected.get("body_sha256")
    last_reason = "http_timeout"
    while context.deadline is None or context.monotonic() < context.deadline:
        timeout = 0.2
        if context.deadline is not None:
            timeout = max(0.01, min(timeout, context.deadline - context.monotonic()))
        connection = http.client.HTTPConnection(host, port, timeout=timeout)
        try:
            connection.request("GET", path, headers={"Connection": "close"})
            response = connection.getresponse()
            body = response.read(context.max_bytes + 1)
            if len(body) > context.max_bytes:
                return (
                    {"allowed": True, "status": response.status, "bytes": len(body)},
                    EvidenceVerdict.ERROR,
                    "http_body_too_large",
                )
            digest = hashlib.sha256(body).hexdigest()
            passed = response.status == expected_status and expected_body_sha in (None, digest)
            observation = {
                "allowed": True,
                "status": response.status,
                "body_sha256": digest,
                "bytes": len(body),
            }
            return (
                observation,
                EvidenceVerdict.PASS if passed else EvidenceVerdict.FAIL,
                "ok" if passed else "http_postcondition_mismatch",
            )
        except (ConnectionError, OSError, TimeoutError, http.client.HTTPException):
            last_reason = "http_unavailable"
            if context.deadline is None:
                break
            context.sleep(min(0.02, max(0, context.deadline - context.monotonic())))
        finally:
            connection.close()
    return {"allowed": True, "reachable": False}, EvidenceVerdict.FAIL, last_reason


def default_verifier_entries(
    capability: str,
) -> dict[str, tuple[VerifierSpec, VerifierFunction]]:
    return {
        "verifier:exit-status": (
            VerifierSpec("verifier:exit-status", EvidenceType.EXIT_STATUS, capability, "1"),
            verify_exit_status,
        ),
        "verifier:process": (
            VerifierSpec("verifier:process", EvidenceType.PROCESS, capability, "1"),
            verify_process,
        ),
        "verifier:file-sha256": (
            VerifierSpec("verifier:file-sha256", EvidenceType.FILE_SHA256, capability, "1"),
            verify_file_sha256,
        ),
        "verifier:json-pointer": (
            VerifierSpec("verifier:json-pointer", EvidenceType.JSON_POINTER, capability, "1"),
            verify_json_pointer,
        ),
        "verifier:regex": (
            VerifierSpec("verifier:regex", EvidenceType.REGEX, capability, "1"),
            verify_regex,
        ),
        "verifier:http-local": (
            VerifierSpec("verifier:http-local", EvidenceType.HTTP, capability, "1"),
            verify_local_http,
        ),
    }
