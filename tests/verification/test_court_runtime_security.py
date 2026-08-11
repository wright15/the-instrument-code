from __future__ import annotations

from dataclasses import replace
import json
import os
from pathlib import Path
import subprocess
import sys

import pytest
from jsonschema import Draft202012Validator, RefResolver

from governor.court_runtime import (
    apply_court_move,
    create_court_runtime_snapshot,
    create_court_runtime_state,
    create_topological_translocation_record,
    list_legal_court_moves,
    load_court_runtime_policy,
    replay_court_runtime_ledger,
    serialize_court_legal_move,
    serialize_court_replay_result,
    serialize_court_runtime_snapshot,
    serialize_court_runtime_state,
    serialize_court_transition_event_body,
    serialize_court_validated_move,
    serialize_court_validation_token,
    serialize_translocation_record,
    validate_court_move,
)
from governor.court_session_store import serialize_court_session_document
from governor.evidence import VerificationDecision
from governor.hashing import sha256_payload
from governor.ledger import compute_event_hash
from governor.models import LedgerAnchor, LedgerEvent


ROOT = Path(__file__).resolve().parents[2]


def flow(session="security"):
    policy = load_court_runtime_policy()
    initial = create_court_runtime_state(
        session_id=session, position_id="C0", harmonic_profile_sha256="1" * 64,
        context_fingerprint="2" * 64, capabilities=("court.transition", "court.translocate"),
        policy=policy,
    )
    move = validate_court_move(initial, "court:advance", "C1", policy=policy)
    result = apply_court_move(
        initial,
        move,
        policy=policy,
        verification_decision=VerificationDecision(True, (), ("3" * 64,)),
    )
    assert result.accepted
    return policy, initial, move, result


def test_policy_fingerprint_and_dependency_closure() -> None:
    policy = load_court_runtime_policy()
    document = json.loads((ROOT / "schemas/court-runtime-policy.json").read_text(encoding="utf-8"))
    fingerprint = document.pop("policyFingerprint")
    assert fingerprint == policy.policy_fingerprint
    assert fingerprint == sha256_payload(document)
    assert {item["dependencyId"] for item in policy.dependencies} == {
        "crt-301-contract", "crt-302-substrate", "crt-303-invariants",
        "crt-304-filter-algebra", "mutation-operator-registry",
        "mutation-operator-applications", "gov-generic-ledger", "gov-generic-ledger-model",
    }


def test_all_created_schemas_validate_runtime_artifacts() -> None:
    policy, initial, move, result = flow("schemas")
    schema_root = ROOT / "schemas/court-runtime"
    type_schema = json.loads((schema_root / "court-runtime-types.schema.json").read_text(encoding="utf-8"))
    type_uri = type_schema["$id"]
    store = {type_uri: type_schema}
    artifacts = {
        "court-runtime-state.schema.json": serialize_court_runtime_state(initial),
        "court-legal-move.schema.json": serialize_court_legal_move(list_legal_court_moves(initial, policy)[0]),
        "court-validation-token.schema.json": serialize_court_validation_token(move.token),
        "court-validated-move.schema.json": serialize_court_validated_move(move),
        "court-transition-event.schema.json": serialize_court_transition_event_body(result.event_body),
        "court-runtime-snapshot.schema.json": serialize_court_runtime_snapshot(create_court_runtime_snapshot(result.state)),
        "court-runtime-replay-result.schema.json": serialize_court_replay_result(
            replay_court_runtime_ledger(initial, result.events, result.state.ledger_anchor, policy=policy)
        ),
        "court-runtime-session.schema.json": serialize_court_session_document(initial, result.state, result.events),
        "topological-translocation-record.schema.json": serialize_translocation_record(
            create_topological_translocation_record(
                source_position="C0", target_position="C4", operator_id="R7"
            )
        ),
    }
    for name, artifact in artifacts.items():
        schema = json.loads((schema_root / name).read_text(encoding="utf-8"))
        resolver = RefResolver.from_schema(schema, store=store)
        Draft202012Validator(schema, resolver=resolver).validate(artifact)
    policy_schema = json.loads((ROOT / "schemas/court-runtime-policy.schema.json").read_text(encoding="utf-8"))
    policy_document = json.loads((ROOT / "schemas/court-runtime-policy.json").read_text(encoding="utf-8"))
    Draft202012Validator(policy_schema).validate(policy_document)

    invalid_policy = {**policy_document, "unexpected": True}
    assert list(Draft202012Validator(policy_schema).iter_errors(invalid_policy))
    event_schema = json.loads(
        (schema_root / "court-transition-event.schema.json").read_text(
            encoding="utf-8"
        )
    )
    event = serialize_court_transition_event_body(result.event_body)
    event["unexpected"] = True
    assert list(
        Draft202012Validator(
            event_schema,
            resolver=RefResolver.from_schema(event_schema, store=store),
        ).iter_errors(event)
    )


def _rehash_event(event: LedgerEvent, payload: dict) -> LedgerEvent:
    draft = LedgerEvent(
        event.sequence, event.previous_event_sha256, payload, sha256_payload(payload), "0" * 64
    )
    return replace(draft, event_sha256=compute_event_hash(draft))


def test_hash_consistent_semantic_forgery_is_rejected_at_first_sequence() -> None:
    policy, initial, _, result = flow("forgery")
    payload = dict(result.events[0].payload)
    payload["intrinsicData"] = dict(payload["intrinsicData"])
    payload["intrinsicData"]["targetPosition"] = "C2"
    forged = _rehash_event(result.events[0], payload)
    replay = replay_court_runtime_ledger(
        initial, (forged,), LedgerAnchor(1, forged.event_sha256), policy=policy
    )
    assert not replay.valid and replay.first_failing_sequence == 1
    assert replay.reason_code == "court_event_id_mismatch"


def test_modify_delete_insert_reorder_are_detected() -> None:
    policy = load_court_runtime_policy()
    initial = create_court_runtime_state(
        session_id="tamper-chain", position_id="C0", harmonic_profile_sha256="1" * 64,
        context_fingerprint="2" * 64, capabilities=("court.transition",), policy=policy,
    )
    current, events = initial, ()
    for target in ("C1", "C2", "C3"):
        move = validate_court_move(current, "court:advance", target, policy=policy)
        result = apply_court_move(
            current,
            move,
            events,
            policy=policy,
            verification_decision=VerificationDecision(True, (), ("3" * 64,)),
        )
        current, events = result.state, result.events
    payload = dict(events[1].payload)
    payload["observationData"] = {"provider": "forged"}
    modified = events[:1] + (_rehash_event(events[1], payload),) + events[2:]
    cases = (modified, events[:1] + events[2:], events[:1] + (events[0],) + events[1:], (events[1], events[0], events[2]))
    for candidate in cases:
        replay = replay_court_runtime_ledger(initial, candidate, current.ledger_anchor, policy=policy)
        assert not replay.valid and replay.first_failing_sequence is not None


def test_intrinsic_event_identity_ignores_observation_provider_and_clock() -> None:
    policy, initial, move, first = flow("stable-event")
    second = apply_court_move(
        initial,
        move,
        policy=policy,
        verification_decision=VerificationDecision(True, (), ("3" * 64,)),
        observation_data={"provider": "other", "wallClock": "2099-01-01T00:00:00Z", "absolutePath": "/tmp/other"},
    )
    assert first.event_body.event_id == second.event_body.event_id
    assert first.events[0].event_sha256 != second.events[0].event_sha256


def test_intrinsic_event_identity_is_stable_across_process_environments() -> None:
    script = """
from governor.court_runtime import apply_court_move, create_court_runtime_state, load_court_runtime_policy, validate_court_move
from governor.evidence import VerificationDecision
import os
policy = load_court_runtime_policy()
state = create_court_runtime_state(session_id='cross-process', position_id='C0', harmonic_profile_sha256='1' * 64, context_fingerprint='2' * 64, capabilities=('court.transition',), policy=policy)
move = validate_court_move(state, 'court:advance', 'C1', policy=policy)
result = apply_court_move(state, move, policy=policy, verification_decision=VerificationDecision(True, (), ('3' * 64,)), observation_data={'provider': os.environ['PROVIDER'], 'wallClock': os.environ['WALL_CLOCK']})
print(result.event_body.event_id)
"""
    outputs = []
    for seed, timezone, provider, wall_clock in (
        ("1", "UTC", "provider-a", "2026-01-01T00:00:00Z"),
        ("987", "Pacific/Honolulu", "provider-b", "2099-12-31T23:59:59Z"),
    ):
        environment = {
            **os.environ,
            "PYTHONHASHSEED": seed,
            "TZ": timezone,
            "PROVIDER": provider,
            "WALL_CLOCK": wall_clock,
            "PYTHONPATH": str(ROOT / "src"),
        }
        process = subprocess.run(
            [sys.executable, "-c", script],
            cwd=ROOT,
            env=environment,
            text=True,
            capture_output=True,
            check=True,
        )
        outputs.append(process.stdout.strip())
    assert len(set(outputs)) == 1
