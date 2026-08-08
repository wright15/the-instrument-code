from __future__ import annotations

import copy
from dataclasses import FrozenInstanceError, replace
import hashlib
import os
from pathlib import Path
import subprocess
import sys

import pytest

from governor import (
    GENESIS_SHA256,
    LedgerAnchor,
    LedgerEvent,
    ProjectedAspect,
    ProjectionBoundaryError,
    ProjectionEdge,
    ProjectionNode,
    ProjectionStatus,
    ProvenanceRef,
    build_dynamic_view,
    canonical_json_bytes,
    compute_event_hash,
    project_verified_history,
    serialize_projection,
    sha256_payload,
    verify_ledger,
    verify_projection,
    verify_projection_audit_chain,
    verify_sha256_payload,
)
from governor.rebuild import ProjectionRepository


def _seal_event(
    sequence: int,
    previous_hash: str,
    payload: dict[str, object],
) -> LedgerEvent:
    payload_hash = sha256_payload(payload)
    draft = LedgerEvent(
        sequence=sequence,
        previous_event_sha256=previous_hash,
        payload=payload,
        payload_sha256=payload_hash,
        event_sha256=GENESIS_SHA256,
    )
    return replace(draft, event_sha256=compute_event_hash(draft))


def _ledger(
    *payloads: dict[str, object],
) -> tuple[tuple[LedgerEvent, ...], LedgerAnchor]:
    events: list[LedgerEvent] = []
    previous = GENESIS_SHA256
    for sequence, payload in enumerate(payloads, start=1):
        event = _seal_event(sequence, previous, payload)
        events.append(event)
        previous = event.event_sha256
    return tuple(events), LedgerAnchor(len(events), previous)


def _resolved_state(
    aspect_id: str = "aspect:wind",
    governor: str = "Jupiter",
    evidence_id: str = "evidence:wind-1",
) -> dict[str, object]:
    return {
        "aspect_id": aspect_id,
        "verification": "verified",
        "status": "resolved",
        "governor": governor,
        "evidence_ids": [evidence_id],
    }


def _payload(*states: dict[str, object], requested: tuple[str, ...] | None = None) -> dict[str, object]:
    requested_ids = requested or tuple(str(state["aspect_id"]) for state in states)
    return {
        "source_id": "classification:fixture",
        "requested_aspect_ids": list(requested_ids),
        "aspect_states": list(states),
        "canonical_context": {
            "ScaleState": {"office": "read-only-source-value"},
            "relationship": "OCCUPIES_OFFICE",
        },
    }


def _resolved_ledger(
    aspect_id: str = "aspect:wind",
    governor: str = "Jupiter",
    evidence_id: str = "evidence:wind-1",
) -> tuple[tuple[LedgerEvent, ...], LedgerAnchor]:
    return _ledger(_payload(_resolved_state(aspect_id, governor, evidence_id)))


def _walk_mapping_keys(value: object) -> tuple[str, ...]:
    keys: list[str] = []
    if isinstance(value, dict) or hasattr(value, "items"):
        for key, item in value.items():
            keys.append(str(key))
            keys.extend(_walk_mapping_keys(item))
    elif isinstance(value, tuple):
        for item in value:
            keys.extend(_walk_mapping_keys(item))
    return tuple(keys)


def test_generate_resolved_projection_preserves_verified_value_and_provenance() -> None:
    events, anchor = _resolved_ledger()

    projection = project_verified_history(events, anchor)

    assert projection.status is ProjectionStatus.RESOLVED
    assert projection.resolved_aspect_ids == ("aspect:wind",)
    assert projection.abstaining_aspect_ids == ()
    assert len(projection.aspects) == 1
    aspect = projection.aspects[0]
    assert aspect.governor == "Jupiter"
    assert aspect.evidence_ids == ("evidence:wind-1",)
    assert aspect.provenance == (
        ProvenanceRef(
            event_sequence=1,
            event_sha256=events[0].event_sha256,
            payload_sha256=events[0].payload_sha256,
            source_id="classification:fixture",
        ),
    )
    assert projection.source_anchor == anchor
    assert len(projection.canonical_payload_sha256) == 64
    assert len(projection.projection_sha256) == 64


def test_generate_multi_aspect_projection_uses_stable_logical_order() -> None:
    state_z = _resolved_state("aspect:zeta", "Venus", "evidence:z")
    state_a = _resolved_state("aspect:alpha", "Mars", "evidence:a")
    payload_one = {
        "source_id": "classification:fixture",
        "requested_aspect_ids": ["aspect:zeta", "aspect:alpha"],
        "aspect_states": [state_z, state_a],
    }
    payload_two = {
        "aspect_states": [dict(reversed(tuple(state_z.items()))), dict(reversed(tuple(state_a.items())))],
        "requested_aspect_ids": ["aspect:zeta", "aspect:alpha"],
        "source_id": "classification:fixture",
    }
    events_one, anchor_one = _ledger(payload_one)
    events_two, anchor_two = _ledger(payload_two)

    first = project_verified_history(events_one, anchor_one)
    second = project_verified_history(events_two, anchor_two)

    assert tuple(item.aspect_id for item in first.aspects) == (
        "aspect:alpha",
        "aspect:zeta",
    )
    assert anchor_one == anchor_two
    assert serialize_projection(first) == serialize_projection(second)


def test_projection_verification_matches_fresh_rebuild() -> None:
    events, anchor = _resolved_ledger()
    projection = project_verified_history(events, anchor)

    assert verify_projection(projection, events, anchor)
    rebuilt = project_verified_history(tuple(events), anchor)
    assert rebuilt.source_anchor.head_sha256 == anchor.head_sha256
    assert rebuilt.projection_sha256 == projection.projection_sha256
    assert serialize_projection(rebuilt) == serialize_projection(projection)


def test_projection_generation_does_not_mutate_source_history_or_state() -> None:
    source_state = _resolved_state()
    source_payload = _payload(source_state)
    source_state_before = copy.deepcopy(source_state)
    source_payload_before = copy.deepcopy(source_payload)
    events, anchor = _ledger(source_payload)
    events_before = copy.deepcopy(events)

    project_verified_history(events, anchor)

    assert source_state == source_state_before
    assert source_payload == source_payload_before
    assert events == events_before


def test_projection_models_are_deeply_immutable() -> None:
    events, anchor = _resolved_ledger()
    projection = project_verified_history(events, anchor)
    original_hash = projection.projection_sha256

    with pytest.raises((FrozenInstanceError, AttributeError)):
        projection.status = ProjectionStatus.UNRESOLVED  # type: ignore[misc]
    with pytest.raises(TypeError):
        projection.nodes[0].properties["new"] = True  # type: ignore[index]
    with pytest.raises((FrozenInstanceError, AttributeError)):
        projection.aspects[0].evidence_ids += ("evidence:other",)  # type: ignore[misc]
    with pytest.raises((FrozenInstanceError, AttributeError)):
        projection.edges[0].relationship_type = "CHANGED"  # type: ignore[misc]

    assert projection.projection_sha256 == original_hash
    assert verify_projection(projection, events, anchor)


def test_dynamic_projection_cannot_emit_scale_state_office() -> None:
    repository = ProjectionRepository()
    before = repository.snapshot()

    with pytest.raises(ProjectionBoundaryError, match="projection_reserved_office"):
        ProjectionNode(
            kind="ScaleState",
            logical_id="projection:state:1",
            properties={"office": "Jupiter"},
        )

    assert repository.snapshot() == before


def test_dynamic_projection_rejects_occupies_office_edges() -> None:
    repository = ProjectionRepository()
    before = repository.snapshot()

    with pytest.raises(
        ProjectionBoundaryError, match="projection_reserved_occupies_office"
    ):
        ProjectionEdge(
            relationship_type="OCCUPIES_OFFICE",
            source_id="projection:aspect:a",
            target_id="office:Jupiter",
            logical_id="forbidden:edge",
        )

    assert repository.snapshot() == before


def test_projection_repository_has_no_canonical_state_mutation_path() -> None:
    class CanonicalStateSentinel:
        def __init__(self) -> None:
            self.setter_calls = 0
            self.edge_calls = 0

        def set_office(self, value: str) -> None:
            self.setter_calls += 1

        def alter_occupies_office(self, value: str) -> None:
            self.edge_calls += 1

    canonical_state = CanonicalStateSentinel()
    events, anchor = _resolved_ledger()
    repository = ProjectionRepository()

    first = repository.rebuild_from_history(events, anchor)
    repository.wipe_projection()
    second = repository.rebuild_from_history(events, anchor)

    assert first.success and second.success
    assert canonical_state.setter_calls == 0
    assert canonical_state.edge_calls == 0
    projection = repository.snapshot().projection
    assert projection is not None
    assert all(
        key.casefold() not in {"office", "scalestate.office"}
        for node in projection.nodes
        for key in _walk_mapping_keys(node.properties)
    )
    assert all(edge.relationship_type != "OCCUPIES_OFFICE" for edge in projection.edges)


def test_missing_aspect_state_emits_unresolved_without_default_governor() -> None:
    events, anchor = _ledger(_payload(requested=("aspect:missing",)))

    projection = project_verified_history(events, anchor)

    assert projection.status is ProjectionStatus.UNRESOLVED
    aspect = projection.aspects[0]
    assert aspect.aspect_id == "aspect:missing"
    assert aspect.status is ProjectionStatus.UNRESOLVED
    assert aspect.reason_codes == ("aspect_missing",)
    assert aspect.governor is None
    assert aspect.candidates == ()


def test_unverified_aspect_state_emits_unresolved() -> None:
    state = {
        "aspect_id": "aspect:pending",
        "verification": "pending",
        "status": "resolved",
        "governor": "Sun",
        "evidence_ids": ["evidence:pending"],
    }
    events, anchor = _ledger(_payload(state))

    aspect = project_verified_history(events, anchor).aspects[0]

    assert aspect.status is ProjectionStatus.UNRESOLVED
    assert aspect.reason_codes == ("aspect_unverified",)
    assert aspect.governor is None


def test_conflicting_candidates_emit_ambiguous_without_office_order_tiebreak() -> None:
    state = {
        "aspect_id": "aspect:conflict",
        "verification": "verified",
        "status": "ambiguous",
        "candidates": ["Saturn", "Moon"],
        "evidence_ids": ["evidence:one", "evidence:two"],
    }
    events, anchor = _ledger(_payload(state))

    projection = project_verified_history(events, anchor)
    aspect = projection.aspects[0]

    assert projection.status is ProjectionStatus.AMBIGUOUS
    assert aspect.status is ProjectionStatus.AMBIGUOUS
    assert aspect.candidates == ("Moon", "Saturn")
    assert aspect.governor is None


def test_mixed_resolved_and_abstaining_facets_emit_partial() -> None:
    resolved = _resolved_state("aspect:known", "Mars", "evidence:known")
    unresolved = {
        "aspect_id": "aspect:unknown",
        "verification": "pending",
        "status": "resolved",
        "governor": "Venus",
        "evidence_ids": ["evidence:unverified"],
    }
    events, anchor = _ledger(_payload(unresolved, resolved))

    projection = project_verified_history(events, anchor)

    assert projection.status is ProjectionStatus.PARTIAL
    assert projection.resolved_aspect_ids == ("aspect:known",)
    assert projection.abstaining_aspect_ids == ("aspect:unknown",)
    unknown = next(item for item in projection.aspects if item.aspect_id == "aspect:unknown")
    assert unknown.governor is None
    assert unknown.evidence_ids == ()


def test_invalid_ledger_returns_unresolved_and_does_not_replace_last_good_projection() -> None:
    events, anchor = _resolved_ledger()
    repository = ProjectionRepository()
    assert repository.rebuild_from_history(events, anchor).success
    before = repository.snapshot()
    tampered = (
        replace(events[0], payload={"source_id": "tampered", "aspect_states": []}),
    )

    unresolved = project_verified_history(tampered, anchor)
    report = repository.rebuild_from_history(tampered, anchor)

    assert unresolved.status is ProjectionStatus.UNRESOLVED
    assert unresolved.aspects[0].reason_codes == ("ledger_verification_failed",)
    assert not report.success
    assert report.verification.reason_code == "payload_hash_mismatch"
    assert repository.snapshot() == before


def test_sha256_payload_verification_accepts_exact_canonical_payload() -> None:
    payload = {"z": "x", "a": [True, None, 1.25]}
    expected_bytes = b'{"a":[true,null,1.25],"z":"x"}'
    expected_hash = hashlib.sha256(expected_bytes).hexdigest()

    assert canonical_json_bytes(payload) == expected_bytes
    assert sha256_payload(payload) == expected_hash
    assert verify_sha256_payload(payload, expected_hash)


def test_sha256_payload_is_independent_of_mapping_insertion_order() -> None:
    first = {"z": {"two": 2, "one": 1}, "a": "value"}
    second = {"a": "value", "z": {"one": 1, "two": 2}}

    assert canonical_json_bytes(first) == canonical_json_bytes(second)
    assert sha256_payload(first) == sha256_payload(second)


def test_ledger_verification_reports_first_broken_link() -> None:
    events, anchor = _ledger(
        _payload(_resolved_state("aspect:one", "Sun", "evidence:one")),
        _payload(_resolved_state("aspect:two", "Moon", "evidence:two")),
        _payload(_resolved_state("aspect:three", "Mars", "evidence:three")),
    )
    tampered = (
        events[0],
        replace(events[1], payload={"source_id": "tampered"}),
        events[2],
    )

    report = verify_ledger(tampered, anchor)

    assert not report.valid
    assert report.checked_count == 1
    assert report.first_failing_sequence == 2
    assert report.reason_code == "payload_hash_mismatch"


def test_ledger_anchor_detects_event_deletion_insertion_and_reordering() -> None:
    events, anchor = _ledger(
        _payload(_resolved_state("aspect:one", "Sun", "evidence:one")),
        _payload(_resolved_state("aspect:two", "Moon", "evidence:two")),
        _payload(_resolved_state("aspect:three", "Mars", "evidence:three")),
    )

    deleted = verify_ledger(events[:-1], anchor)
    inserted = verify_ledger((events[0], events[0], events[1], events[2]), anchor)
    reordered = verify_ledger((events[1], events[0], events[2]), anchor)

    assert not deleted.valid and deleted.reason_code == "event_count_mismatch"
    assert not inserted.valid and inserted.reason_code == "event_sequence_mismatch"
    assert not reordered.valid and reordered.reason_code == "event_sequence_mismatch"


def test_projection_audit_chain_detects_modified_entry() -> None:
    events, anchor = _resolved_ledger()
    repository = ProjectionRepository()
    repository.rebuild_from_history(events, anchor)
    entry = repository.snapshot().audit_entries[0]
    tampered = replace(
        entry,
        outcome_summary={
            "projection_status": "unresolved",
            "aspect_counts": {"resolved": 0, "unresolved": 1},
        },
    )

    report = verify_projection_audit_chain((tampered,))

    assert not report.valid
    assert report.first_failing_sequence == 1
    assert report.reason_code == "audit_entry_hash_mismatch"


def test_projection_bytes_and_hash_are_identical_across_repeated_builds() -> None:
    first_events, first_anchor = _resolved_ledger()
    second_events, second_anchor = _resolved_ledger()
    first = project_verified_history(first_events, first_anchor)
    second = project_verified_history(second_events, second_anchor)
    first_repository = ProjectionRepository()
    second_repository = ProjectionRepository()
    first_repository.rebuild_from_history(first_events, first_anchor)
    second_repository.rebuild_from_history(second_events, second_anchor)

    assert serialize_projection(first) == serialize_projection(second)
    assert first.projection_sha256 == second.projection_sha256
    assert first.nodes == second.nodes
    assert first.edges == second.edges
    assert (
        first_repository.snapshot().audit_entries[0].entry_sha256
        == second_repository.snapshot().audit_entries[0].entry_sha256
    )


def test_projection_is_identical_across_subprocesses() -> None:
    root = Path(__file__).resolve().parents[1]
    script = """
from dataclasses import replace
import sys
from governor import GENESIS_SHA256, LedgerAnchor, LedgerEvent, compute_event_hash, project_verified_history, serialize_projection, sha256_payload
payload = {"source_id":"classification:fixture","requested_aspect_ids":["aspect:wind"],"aspect_states":[{"aspect_id":"aspect:wind","verification":"verified","status":"resolved","governor":"Jupiter","evidence_ids":["evidence:wind-1"]}]}
payload_hash = sha256_payload(payload)
draft = LedgerEvent(1, GENESIS_SHA256, payload, payload_hash, GENESIS_SHA256)
event = replace(draft, event_sha256=compute_event_hash(draft))
projection = project_verified_history((event,), LedgerAnchor(1, event.event_sha256))
sys.stdout.buffer.write(serialize_projection(projection))
"""
    environment_one = os.environ.copy()
    environment_two = os.environ.copy()
    environment_one.update(
        {"PYTHONPATH": str(root / "src"), "PYTHONHASHSEED": "1", "TZ": "UTC"}
    )
    environment_two.update(
        {"PYTHONPATH": str(root / "src"), "PYTHONHASHSEED": "987", "TZ": "Pacific/Honolulu"}
    )

    first = subprocess.run(
        [sys.executable, "-c", script],
        cwd=root,
        env=environment_one,
        check=True,
        capture_output=True,
    )
    second = subprocess.run(
        [sys.executable, "-c", script],
        cwd=root,
        env=environment_two,
        check=True,
        capture_output=True,
    )

    assert first.stdout == second.stdout
    assert hashlib.sha256(first.stdout).digest() == hashlib.sha256(second.stdout).digest()


def test_intrinsic_hashes_exclude_wall_clock_and_process_metadata(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("TZ", "UTC")
    monkeypatch.setenv("HOSTNAME", "first-host")
    first_events, first_anchor = _resolved_ledger()
    first_projection = project_verified_history(first_events, first_anchor)

    monkeypatch.setenv("TZ", "Asia/Tokyo")
    monkeypatch.setenv("HOSTNAME", "second-host")
    monkeypatch.setenv("PROVIDER", "different-provider")
    second_events, second_anchor = _resolved_ledger()
    second_projection = project_verified_history(second_events, second_anchor)

    assert first_events[0].event_sha256 == second_events[0].event_sha256
    assert first_projection.projection_sha256 == second_projection.projection_sha256
    assert serialize_projection(first_projection) == serialize_projection(second_projection)


def test_wipe_removes_all_projection_data_without_touching_history() -> None:
    events, anchor = _resolved_ledger()
    events_before = copy.deepcopy(events)
    anchor_before = copy.deepcopy(anchor)
    repository = ProjectionRepository()
    repository.rebuild_from_history(events, anchor)

    repository.wipe_projection()

    snapshot = repository.snapshot()
    assert snapshot.projection is None
    assert snapshot.audit_entries == ()
    assert events == events_before
    assert anchor == anchor_before


def test_wipe_and_rebuild_restores_byte_identical_projection() -> None:
    events, anchor = _resolved_ledger()
    repository = ProjectionRepository()
    first_report = repository.rebuild_from_history(events, anchor)
    first = repository.snapshot()
    assert first.projection is not None
    first_bytes = serialize_projection(first.projection)

    repository.wipe_projection()
    second_report = repository.rebuild_from_history(events, anchor)
    second = repository.snapshot()

    assert first_report.success and second_report.success
    assert second.projection is not None
    assert serialize_projection(second.projection) == first_bytes
    assert second.projection.projection_sha256 == first.projection.projection_sha256
    assert second.audit_entries == first.audit_entries


def test_rebuild_discards_stale_or_extra_projection_records() -> None:
    target_events, target_anchor = _resolved_ledger("aspect:target", "Saturn", "evidence:target")
    stale_events, stale_anchor = _ledger(
        _payload(
            _resolved_state("aspect:stale", "Sun", "evidence:stale"),
            _resolved_state("aspect:extra", "Moon", "evidence:extra"),
        )
    )
    stale_projection = project_verified_history(stale_events, stale_anchor)
    repository = ProjectionRepository()
    repository.replace_projection(stale_projection)

    report = repository.rebuild_from_history(target_events, target_anchor)

    assert report.success
    projection = repository.snapshot().projection
    assert projection is not None
    assert tuple(item.aspect_id for item in projection.aspects) == ("aspect:target",)
    assert all("aspect:stale" not in node.logical_id for node in projection.nodes)
    assert all("aspect:extra" not in node.logical_id for node in projection.nodes)


def test_two_empty_repositories_rebuild_identically_from_same_history() -> None:
    events, anchor = _resolved_ledger()
    first = ProjectionRepository()
    second = ProjectionRepository()

    first_report = first.rebuild_from_history(events, anchor)
    second_report = second.rebuild_from_history(tuple(events), anchor)

    assert first_report == second_report
    assert first.snapshot() == second.snapshot()
    assert (
        first.snapshot().audit_entries[0].entry_sha256
        == second.snapshot().audit_entries[0].entry_sha256
    )


def test_failed_rebuild_is_atomic() -> None:
    events, anchor = _resolved_ledger()
    repository = ProjectionRepository()
    repository.rebuild_from_history(events, anchor)
    before = repository.snapshot()
    invalid_events = (replace(events[0], payload={"aspect_states": []}),)

    report = repository.rebuild_from_history(invalid_events, anchor)

    assert not report.success
    assert report.verification.reason_code == "payload_hash_mismatch"
    assert repository.snapshot() == before
