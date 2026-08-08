from __future__ import annotations

from dataclasses import replace
import subprocess
import sys

import pytest

from governor.evidence import (
    EVIDENCE_SCHEMA_VERSION,
    EvidenceType,
    EvidenceVerdict,
    Postcondition,
    VerifierResult,
    VictoryCondition,
    create_evidence_record,
    evaluate_victory,
)
from governor.executors import ExecutionAttempt, _ExecutionHandle, process_cleanup
from governor.hashing import sha256_payload
from governor.verifiers import VerifierRegistry, default_verifier_entries


def _postcondition(identifier="postcondition:http"):
    return Postcondition(
        postcondition_id=identifier,
        evidence_type=EvidenceType.HTTP,
        verifier_id="verifier:http-local",
        request={"host": "127.0.0.1", "port": 4321, "path": "/"},
        expected={"status": 200, "body_sha256": "a" * 64},
    )


def _result(identifier="postcondition:http", verdict=EvidenceVerdict.PASS):
    postcondition = _postcondition(identifier)
    evidence = create_evidence_record(
        attempt_id="attempt:1",
        capability="runtime.start-site",
        postcondition=postcondition,
        observation={"status": 200, "body_sha256": "a" * 64, "bytes": 2},
        verdict=verdict,
        verifier_version="1",
    )
    return VerifierResult(identifier, evidence, "ok" if verdict is EvidenceVerdict.PASS else "mismatch")


def test_evidence_record_contains_all_required_contract_fields() -> None:
    result = _result()
    evidence = result.evidence

    assert evidence.schema_version == EVIDENCE_SCHEMA_VERSION
    assert evidence.attempt_id == "attempt:1"
    assert evidence.capability == "runtime.start-site"
    assert evidence.evidence_type is EvidenceType.HTTP
    assert evidence.verdict is EvidenceVerdict.PASS
    assert evidence.verifier_id == "verifier:http-local"
    assert len(evidence.evidence_id) == 64
    assert len(evidence.evidence_sha256) == 64


def test_evidence_hash_is_independent_of_mapping_insertion_order() -> None:
    postcondition_one = Postcondition(
        "postcondition:file",
        EvidenceType.FILE_SHA256,
        "verifier:file",
        {"path": "fixture", "root": "tmp"},
        {"sha256": "b" * 64, "exists": True},
    )
    postcondition_two = Postcondition(
        "postcondition:file",
        EvidenceType.FILE_SHA256,
        "verifier:file",
        {"root": "tmp", "path": "fixture"},
        {"exists": True, "sha256": "b" * 64},
    )
    first = create_evidence_record(
        attempt_id="attempt:1",
        capability="runtime.file",
        postcondition=postcondition_one,
        observation={"sha256": "b" * 64, "exists": True},
        verdict="pass",
        verifier_version="1",
    )
    second = create_evidence_record(
        attempt_id="attempt:1",
        capability="runtime.file",
        postcondition=postcondition_two,
        observation={"exists": True, "sha256": "b" * 64},
        verdict="pass",
        verifier_version="1",
    )

    assert first.evidence_id == second.evidence_id
    assert first.evidence_sha256 == second.evidence_sha256


def test_evidence_tampering_is_rejected() -> None:
    evidence = _result().evidence
    with pytest.raises(ValueError, match="evidence_sha256_mismatch"):
        replace(evidence, observation={"status": 500})


def test_victory_requires_every_named_postcondition() -> None:
    condition = VictoryCondition(
        "victory:site-live",
        ("postcondition:http", "postcondition:process"),
    )

    incomplete = evaluate_victory(condition, (_result(),))
    complete = evaluate_victory(
        condition,
        (_result(), _result("postcondition:process")),
    )

    assert not incomplete.passed
    assert incomplete.reason_codes == ("missing_evidence:postcondition:process",)
    assert complete.passed
    assert complete.reason_codes == ()


def test_failed_or_error_evidence_cannot_satisfy_victory() -> None:
    condition = VictoryCondition("victory:site-live", ("postcondition:http",))

    failed = evaluate_victory(condition, (_result(verdict=EvidenceVerdict.FAIL),))
    errored = evaluate_victory(condition, (_result(verdict=EvidenceVerdict.ERROR),))

    assert not failed.passed
    assert not errored.passed
    assert failed.reason_codes == ("postcondition_failed:postcondition:http",)


def test_only_all_mode_is_accepted_for_victory_conditions() -> None:
    with pytest.raises(ValueError, match="unsupported_victory_condition_mode"):
        VictoryCondition("victory:any", ("postcondition:a",), mode="any")


def _attempt() -> ExecutionAttempt:
    return ExecutionAttempt(
        "attempt:adapter",
        "operation:test",
        "runtime.test",
        {},
        True,
        "started",
    )


def _registry(tmp_path, **kwargs) -> VerifierRegistry:
    return VerifierRegistry(
        default_verifier_entries("runtime.test"),
        allowed_roots=(tmp_path,),
        regex_patterns={"pattern:ready": r"^ready:[0-9]+$"},
        **kwargs,
    )


def test_file_sha_verifier_matches_and_rejects_unsafe_paths(tmp_path) -> None:
    target = tmp_path / "result.txt"
    target.write_bytes(b"verified")
    digest = __import__("hashlib").sha256(b"verified").hexdigest()
    postcondition = Postcondition(
        "postcondition:file",
        EvidenceType.FILE_SHA256,
        "verifier:file-sha256",
        {"path": str(target)},
        {"sha256": digest},
    )
    result = _registry(tmp_path).verify(postcondition, _attempt(), None)
    assert result.evidence.verdict is EvidenceVerdict.PASS

    outside = tmp_path.parent / "outside-gov-205.txt"
    outside.write_bytes(b"outside")
    try:
        rejected = _registry(tmp_path).verify(
            replace(postcondition, request={"path": str(outside)}),
            _attempt(),
            None,
        )
        assert rejected.evidence.verdict is EvidenceVerdict.ERROR
        assert rejected.reason_code == "file_path_not_allowed"
    finally:
        outside.unlink()


def test_file_sha_verifier_rejects_symlink_and_oversize(tmp_path) -> None:
    target = tmp_path / "large.txt"
    target.write_bytes(b"0123456789")
    link = tmp_path / "link.txt"
    link.symlink_to(target)
    postcondition = Postcondition(
        "postcondition:file",
        EvidenceType.FILE_SHA256,
        "verifier:file-sha256",
        {"path": str(link)},
        {"sha256": "0" * 64},
    )
    symlink_result = _registry(tmp_path, max_bytes=4).verify(postcondition, _attempt(), None)
    oversize_result = _registry(tmp_path, max_bytes=4).verify(
        replace(postcondition, request={"path": str(target)}), _attempt(), None
    )
    assert symlink_result.reason_code == "file_path_not_allowed"
    assert oversize_result.reason_code == "file_too_large"


def test_json_pointer_is_type_sensitive_and_validates_escapes(tmp_path) -> None:
    postcondition = Postcondition(
        "postcondition:json",
        EvidenceType.JSON_POINTER,
        "verifier:json-pointer",
        {"document": {"a/b": {"~key": 1}}, "pointer": "/a~1b/~0key"},
        {"value": 1},
    )
    registry = _registry(tmp_path)
    assert registry.verify(postcondition, _attempt(), None).evidence.verdict is EvidenceVerdict.PASS
    wrong_type = registry.verify(
        replace(postcondition, expected={"value": True}), _attempt(), None
    )
    invalid = registry.verify(
        replace(postcondition, request={"document": {}, "pointer": "/bad~2escape"}),
        _attempt(),
        None,
    )
    assert wrong_type.evidence.verdict is EvidenceVerdict.FAIL
    assert invalid.reason_code == "json_pointer_missing"


def test_regex_requires_registered_pattern_and_bounded_input(tmp_path) -> None:
    registry = _registry(tmp_path, max_bytes=16)
    postcondition = Postcondition(
        "postcondition:regex",
        EvidenceType.REGEX,
        "verifier:regex",
        {"pattern_id": "pattern:ready", "text": "ready:42"},
        {"matched": True},
    )
    assert registry.verify(postcondition, _attempt(), None).evidence.verdict is EvidenceVerdict.PASS
    unknown = registry.verify(
        replace(postcondition, request={"pattern_id": "model:raw", "text": ".*"}),
        _attempt(),
        None,
    )
    oversized = registry.verify(
        replace(postcondition, request={"pattern_id": "pattern:ready", "text": "x" * 100}),
        _attempt(),
        None,
    )
    assert unknown.reason_code == "regex_not_registered"
    assert oversized.reason_code == "regex_input_too_large"


def test_process_and_exit_status_bind_to_owned_handle(tmp_path) -> None:
    process = subprocess.Popen(
        [sys.executable, "-c", "import time; time.sleep(5)"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    attempt = _attempt()
    handle = _ExecutionHandle(
        attempt.attempt_id,
        attempt.capability,
        process,
        sha256_payload({"executable": sys.executable}),
        sha256_payload([sys.executable, "sleep"]),
        None,
    )
    registry = _registry(tmp_path)
    process_condition = Postcondition(
        "postcondition:process",
        EvidenceType.PROCESS,
        "verifier:process",
        {},
        {"running": True},
    )
    try:
        assert registry.verify(process_condition, attempt, handle).evidence.verdict is EvidenceVerdict.PASS
        unrelated = _ExecutionHandle(
            "attempt:other",
            handle.capability,
            process,
            handle.executable_sha256,
            handle.argv_sha256,
            None,
        )
        assert registry.verify(process_condition, attempt, unrelated).reason_code == "process_handle_unowned"
    finally:
        process_cleanup(handle)


def test_exit_status_verifier_handles_expected_and_unexpected_codes(tmp_path) -> None:
    process = subprocess.Popen([sys.executable, "-c", "raise SystemExit(3)"])
    process.wait(timeout=2)
    attempt = _attempt()
    handle = _ExecutionHandle(
        attempt.attempt_id,
        attempt.capability,
        process,
        sha256_payload({"executable": sys.executable}),
        sha256_payload([sys.executable, "exit"]),
        None,
    )
    condition = Postcondition(
        "postcondition:exit",
        EvidenceType.EXIT_STATUS,
        "verifier:exit-status",
        {},
        {"exit_status": 3},
    )
    registry = _registry(tmp_path)
    assert registry.verify(condition, attempt, handle).evidence.verdict is EvidenceVerdict.PASS
    assert registry.verify(replace(condition, expected={"exit_status": 0}), attempt, handle).evidence.verdict is EvidenceVerdict.FAIL


def test_http_verifier_rejects_non_loopback_without_network_access(tmp_path) -> None:
    condition = Postcondition(
        "postcondition:http",
        EvidenceType.HTTP,
        "verifier:http-local",
        {"host": "8.8.8.8", "port": 80, "path": "/"},
        {"status": 200},
    )
    result = _registry(tmp_path).verify(condition, _attempt(), None)
    assert result.evidence.verdict is EvidenceVerdict.ERROR
    assert result.reason_code == "http_host_not_loopback"


def test_unknown_verifier_fails_closed(tmp_path) -> None:
    condition = replace(_postcondition(), verifier_id="verifier:not-registered")
    with pytest.raises(Exception, match="verifier_not_registered"):
        _registry(tmp_path).verify(condition, _attempt(), None)
