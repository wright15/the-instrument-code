"""GOV-207 read-only outcome reconstruction tests."""

from __future__ import annotations

from dataclasses import replace
import time

import pytest

from governor.evidence import EvidenceVerdict
from governor.hashing import sha256_payload
from governor.ledger import GENESIS_SHA256, compute_event_hash
from governor.lifecycle import LifecyclePhase
from governor.loop_guards import LoopPolicy
from governor.models import LedgerAnchor, thaw_json
from governor.outcome_reader import read_attempt_outcome
from governor.runtime_models import TransitionError, create_agent_state
from governor.transitions import OperationRegistry, validate_move
from governor.verification import execute_validated_move

from conftest import (
    GOV207_CONTEXT,
    GOV207_POLICY,
    start_site_operation_spec,
)


def _state():
    return create_agent_state(
        task_id="task:outcome",
        phase=LifecyclePhase.VALIDATED.value,
        policy_sha256=GOV207_POLICY,
        context_sha256=GOV207_CONTEXT,
        capabilities=("runtime.start-site",),
        data={"site_verified": False},
    )


def _operations() -> OperationRegistry:
    spec = start_site_operation_spec()
    return OperationRegistry(
        {spec.operation_id: (spec, lambda data, parameters: dict(data))}
    )


def _catalog_port(catalog) -> int:
    spec = catalog.executors.get_spec("operation:start-site")
    assert spec is not None
    return spec.postconditions[0].request["port"]


def _run(catalog, *, overrides=None):
    state = _state()
    port = _catalog_port(catalog)
    parameters = {
        "port": port,
        "bind_port": port,
        "mode": "normal",
        "status": 200,
        "body": "ready",
        "delay": 0,
    }
    parameters.update(overrides or {})
    move = validate_move(
        state,
        "operation:start-site",
        parameters,
        _operations(),
        policy_sha256=GOV207_POLICY,
        context_sha256=GOV207_CONTEXT,
        capability="runtime.start-site",
    )
    result = execute_validated_move(
        state=state,
        events=(),
        move=move,
        executor_registry=catalog.executors,
        verifier_registry=catalog.verifiers,
        loop_policy=LoopPolicy(3, 3, 2),
        monotonic_now=time.monotonic(),
        deadline=time.monotonic() + 3.0,
    )
    return state, result


def test_outcome_reader_reconstructs_verified_attempt(gov207_catalog):
    state, result = _run(gov207_catalog)
    assert result.state.phase == LifecyclePhase.VERIFIED.value
    read = read_attempt_outcome(
        state,
        result.events,
        result.state.ledger_anchor,
        result.attempt.attempt_id,
    )
    assert read.replay.valid
    outcome = read.outcome
    assert outcome is not None and outcome.found
    assert outcome.started is True
    assert outcome.operation_id == "operation:start-site"
    assert outcome.decision_passed is True
    assert outcome.final_phase == LifecyclePhase.VERIFIED.value
    assert outcome.cleanup is not None and outcome.cleanup.succeeded
    assert {record.evidence_type.value for record in outcome.evidence} == {
        "http",
        "process",
    }
    assert all(record.verdict is EvidenceVerdict.PASS for record in outcome.evidence)
    assert outcome.recorded_state_sha256 == result.state.state_sha256


def test_outcome_reader_reconstructs_failed_attempt(gov207_catalog):
    state, result = _run(gov207_catalog, overrides={"mode": "early_exit"})
    assert result.state.phase == LifecyclePhase.FAILED.value
    read = read_attempt_outcome(
        state,
        result.events,
        result.state.ledger_anchor,
        result.attempt.attempt_id,
    )
    outcome = read.outcome
    assert outcome is not None and outcome.found
    assert outcome.decision_passed is False
    assert outcome.final_phase == LifecyclePhase.FAILED.value
    assert any(
        record.verdict is not EvidenceVerdict.PASS for record in outcome.evidence
    )


def test_outcome_reader_reports_missing_attempt(gov207_catalog):
    state, result = _run(gov207_catalog)
    read = read_attempt_outcome(
        state,
        result.events,
        result.state.ledger_anchor,
        "f" * 64,
    )
    assert read.replay.valid
    assert read.outcome is not None
    assert read.outcome.found is False
    assert read.outcome.start_reason_code == "attempt_not_found"


def test_outcome_reader_detects_ledger_tampering(gov207_catalog):
    state, result = _run(gov207_catalog)
    tampered = tuple(
        replace(event, payload={"tampered": True}) if index == 2 else event
        for index, event in enumerate(result.events)
    )
    read = read_attempt_outcome(
        state,
        tampered,
        result.state.ledger_anchor,
        result.attempt.attempt_id,
    )
    assert not read.replay.valid
    assert read.outcome is None


def test_outcome_reader_rejects_malformed_recorded_evidence(gov207_catalog):
    state, result = _run(gov207_catalog)
    # Re-seal the chain with a structurally invalid evidence record so the
    # ledger links stay intact while the recorded evidence cannot be trusted.
    rebuilt = []
    previous = GENESIS_SHA256
    for index, event in enumerate(result.events):
        payload = thaw_json(event.payload)
        if payload.get("event_kind") == "evidence_recorded":
            del payload["observation_data"]["evidence"][0]["verifier_id"]
        sealed = replace(
            event,
            sequence=index + 1,
            previous_event_sha256=previous,
            payload=payload,
            payload_sha256=sha256_payload(payload),
            event_sha256=GENESIS_SHA256,
        )
        sealed = replace(sealed, event_sha256=compute_event_hash(sealed))
        rebuilt.append(sealed)
        previous = sealed.event_sha256
    new_anchor = LedgerAnchor(len(rebuilt), rebuilt[-1].event_sha256)
    with pytest.raises(TransitionError, match="recorded_evidence_invalid"):
        read_attempt_outcome(
            state,
            tuple(rebuilt),
            new_anchor,
            result.attempt.attempt_id,
        )
