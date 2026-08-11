from __future__ import annotations

import json
from pathlib import Path

import pytest

from governor.court_runtime import (
    CourtRuntimeError,
    apply_court_move,
    create_court_runtime_state,
    load_court_runtime_policy,
    validate_court_move,
)
from governor.court_session_store import CourtSessionStore
from governor.evidence import VerificationDecision


def make_state(session_id="stored"):
    policy = load_court_runtime_policy()
    return policy, create_court_runtime_state(
        session_id=session_id,
        position_id="C0",
        harmonic_profile_sha256="1" * 64,
        context_fingerprint="2" * 64,
        capabilities=("court.transition", "court.translocate"),
        policy=policy,
    )


def advance(state, policy):
    move = validate_court_move(state, "court:advance", "C1", policy=policy)
    return apply_court_move(
        state,
        move,
        policy=policy,
        verification_decision=VerificationDecision(True, (), ("3" * 64,)),
    )


def test_xdg_default_and_explicit_external_root(tmp_path: Path) -> None:
    xdg = tmp_path / "xdg"
    store = CourtSessionStore(environment={"XDG_STATE_HOME": str(xdg)})
    assert store.root == (xdg / "seven-governors" / "court").resolve()
    explicit = CourtSessionStore(tmp_path / "external")
    assert explicit.root == (tmp_path / "external").resolve()


def test_repository_containment_is_rejected() -> None:
    repository = Path(__file__).resolve().parents[1]
    with pytest.raises(CourtRuntimeError, match="court_state_path_inside_repository"):
        CourtSessionStore(repository / ".court-state")


def test_create_save_load_and_cas(tmp_path: Path) -> None:
    policy, genesis = make_state()
    store = CourtSessionStore(tmp_path / "court")
    store.create(genesis)
    assert store.load(genesis.session_id) == (genesis, genesis, ())
    result = advance(genesis, policy)
    assert result.accepted
    store.save(
        result.state, result.events,
        expected_state_sha256=genesis.state_sha256,
        expected_ledger_head=genesis.ledger_anchor.head_sha256,
    )
    loaded = store.load(genesis.session_id)
    assert loaded == (genesis, result.state, result.events)
    with pytest.raises(CourtRuntimeError, match="court_state_compare_and_swap_failed"):
        store.save(
            result.state, result.events,
            expected_state_sha256=genesis.state_sha256,
            expected_ledger_head=genesis.ledger_anchor.head_sha256,
        )


def test_symlink_session_file_and_root_are_rejected(tmp_path: Path) -> None:
    _, genesis = make_state("symlink")
    root = tmp_path / "court"
    root.mkdir()
    target = tmp_path / "target.json"
    target.write_text("{}", encoding="utf-8")
    (root / "symlink.session.json").symlink_to(target)
    store = CourtSessionStore(root)
    with pytest.raises(CourtRuntimeError, match="unsafe_court_state_file"):
        store.load(genesis.session_id)
    linked_root = tmp_path / "linked"
    linked_root.symlink_to(root, target_is_directory=True)
    with pytest.raises(CourtRuntimeError, match="unsafe_court_state_root"):
        CourtSessionStore(linked_root)


def test_semantic_tamper_fails_closed_on_every_load(tmp_path: Path) -> None:
    policy, genesis = make_state("tamper")
    store = CourtSessionStore(tmp_path / "court")
    store.create(genesis)
    result = advance(genesis, policy)
    store.save(
        result.state, result.events,
        expected_state_sha256=genesis.state_sha256,
        expected_ledger_head=genesis.ledger_anchor.head_sha256,
    )
    path = store.root / "tamper.session.json"
    document = json.loads(path.read_text(encoding="utf-8"))
    document["snapshot"]["eventCount"] = 99
    path.write_text(json.dumps(document), encoding="utf-8")
    with pytest.raises(CourtRuntimeError):
        store.load("tamper")
