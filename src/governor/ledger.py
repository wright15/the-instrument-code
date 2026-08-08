"""Verification-only hash-chain operations for primary and projection ledgers."""

from __future__ import annotations

from collections.abc import Iterable

from .hashing import sha256_payload
from .models import (
    LedgerAnchor,
    LedgerEvent,
    LedgerVerificationReport,
    ProjectionAuditEntry,
    thaw_json,
)


GENESIS_SHA256 = "0" * 64
LEDGER_EVENT_SCHEMA_VERSION = "gov-204.ledger-event.v1"


def compute_event_payload_hash(event: LedgerEvent) -> str:
    return sha256_payload(event.payload)


def compute_event_hash(event: LedgerEvent) -> str:
    """Hash only the explicit intrinsic event envelope."""

    return sha256_payload(
        {
            "schema_version": LEDGER_EVENT_SCHEMA_VERSION,
            "sequence": event.sequence,
            "previous_event_sha256": event.previous_event_sha256,
            "payload_sha256": event.payload_sha256,
        }
    )


def _report(
    *,
    valid: bool,
    checked_count: int,
    trusted_head: str,
    recomputed_head: str,
    failing_sequence: int | None,
    reason: str,
) -> LedgerVerificationReport:
    return LedgerVerificationReport(
        valid=valid,
        checked_count=checked_count,
        trusted_head_sha256=trusted_head,
        recomputed_head_sha256=recomputed_head,
        first_failing_sequence=failing_sequence,
        reason_code=reason,
    )


def verify_event(
    event: LedgerEvent,
    expected_sequence: int,
    expected_previous_hash: str,
) -> LedgerVerificationReport:
    """Verify one event without mutating it or accepting it as authority."""

    if event.sequence != expected_sequence:
        return _report(
            valid=False,
            checked_count=0,
            trusted_head=event.event_sha256,
            recomputed_head=expected_previous_hash,
            failing_sequence=expected_sequence,
            reason="event_sequence_mismatch",
        )
    if compute_event_payload_hash(event) != event.payload_sha256:
        return _report(
            valid=False,
            checked_count=0,
            trusted_head=event.event_sha256,
            recomputed_head=expected_previous_hash,
            failing_sequence=expected_sequence,
            reason="payload_hash_mismatch",
        )
    if compute_event_hash(event) != event.event_sha256:
        return _report(
            valid=False,
            checked_count=0,
            trusted_head=event.event_sha256,
            recomputed_head=expected_previous_hash,
            failing_sequence=expected_sequence,
            reason="event_hash_mismatch",
        )
    if event.previous_event_sha256 != expected_previous_hash:
        return _report(
            valid=False,
            checked_count=0,
            trusted_head=event.event_sha256,
            recomputed_head=expected_previous_hash,
            failing_sequence=expected_sequence,
            reason="previous_event_hash_mismatch",
        )
    return _report(
        valid=True,
        checked_count=1,
        trusted_head=event.event_sha256,
        recomputed_head=event.event_sha256,
        failing_sequence=None,
        reason="ok",
    )


def verify_ledger(
    events: Iterable[LedgerEvent], anchor: LedgerAnchor
) -> LedgerVerificationReport:
    """Verify event order, payloads, links, and the trusted terminal anchor."""

    materialized = tuple(events)
    previous_hash = GENESIS_SHA256
    checked_count = 0
    for expected_sequence, event in enumerate(materialized, start=1):
        result = verify_event(event, expected_sequence, previous_hash)
        if not result.valid:
            return _report(
                valid=False,
                checked_count=checked_count,
                trusted_head=anchor.head_sha256,
                recomputed_head=previous_hash,
                failing_sequence=result.first_failing_sequence,
                reason=result.reason_code,
            )
        checked_count += 1
        previous_hash = event.event_sha256

    if len(materialized) != anchor.event_count:
        failing_sequence = min(len(materialized), anchor.event_count) + 1
        return _report(
            valid=False,
            checked_count=checked_count,
            trusted_head=anchor.head_sha256,
            recomputed_head=previous_hash,
            failing_sequence=failing_sequence,
            reason="event_count_mismatch",
        )
    if previous_hash != anchor.head_sha256:
        return _report(
            valid=False,
            checked_count=checked_count,
            trusted_head=anchor.head_sha256,
            recomputed_head=previous_hash,
            failing_sequence=max(1, anchor.event_count),
            reason="ledger_head_mismatch",
        )
    return _report(
        valid=True,
        checked_count=checked_count,
        trusted_head=anchor.head_sha256,
        recomputed_head=previous_hash,
        failing_sequence=None,
        reason="ok",
    )


def compute_projection_audit_hash(entry: ProjectionAuditEntry) -> str:
    """Hash only deterministic projection-audit fields."""

    return sha256_payload(
        {
            "schema_version": entry.schema_version,
            "sequence": entry.sequence,
            "action": entry.action,
            "previous_audit_sha256": entry.previous_audit_sha256,
            "source_event_count": entry.source_event_count,
            "source_ledger_sha256": entry.source_ledger_sha256,
            "projection_sha256": entry.projection_sha256,
            "outcome_summary": thaw_json(entry.outcome_summary),
        }
    )


def verify_projection_audit_chain(
    entries: Iterable[ProjectionAuditEntry],
) -> LedgerVerificationReport:
    """Verify a derivative audit chain; it does not authorize primary state."""

    materialized = tuple(entries)
    previous_hash = GENESIS_SHA256
    trusted_head = materialized[-1].entry_sha256 if materialized else GENESIS_SHA256
    checked_count = 0
    for expected_sequence, entry in enumerate(materialized, start=1):
        if entry.sequence != expected_sequence:
            return _report(
                valid=False,
                checked_count=checked_count,
                trusted_head=trusted_head,
                recomputed_head=previous_hash,
                failing_sequence=expected_sequence,
                reason="audit_sequence_mismatch",
            )
        if entry.previous_audit_sha256 != previous_hash:
            return _report(
                valid=False,
                checked_count=checked_count,
                trusted_head=trusted_head,
                recomputed_head=previous_hash,
                failing_sequence=expected_sequence,
                reason="audit_previous_hash_mismatch",
            )
        recomputed = compute_projection_audit_hash(entry)
        if recomputed != entry.entry_sha256:
            return _report(
                valid=False,
                checked_count=checked_count,
                trusted_head=trusted_head,
                recomputed_head=previous_hash,
                failing_sequence=expected_sequence,
                reason="audit_entry_hash_mismatch",
            )
        checked_count += 1
        previous_hash = entry.entry_sha256
    return _report(
        valid=True,
        checked_count=checked_count,
        trusted_head=trusted_head,
        recomputed_head=previous_hash,
        failing_sequence=None,
        reason="ok",
    )
