"""In-memory, projection-only storage with deterministic rebuild handlers."""

from __future__ import annotations

from dataclasses import replace
from threading import RLock
from collections.abc import Iterable

from .ledger import (
    GENESIS_SHA256,
    compute_projection_audit_hash,
    verify_ledger,
)
from .models import (
    DynamicProjection,
    LedgerAnchor,
    LedgerEvent,
    LedgerVerificationReport,
    ProjectionAuditEntry,
    ProjectionRepositorySnapshot,
    ProjectionStatus,
    RebuildReport,
)
from .projections import (
    project_verified_history,
    serialize_projection,
    verify_projection,
)


AUDIT_SCHEMA_VERSION = "gov-204.projection-audit.v1"


def _verification_failure(
    anchor: LedgerAnchor,
    reason: str,
    *,
    checked_count: int = 0,
) -> LedgerVerificationReport:
    return LedgerVerificationReport(
        valid=False,
        checked_count=checked_count,
        trusted_head_sha256=anchor.head_sha256,
        recomputed_head_sha256=anchor.head_sha256,
        first_failing_sequence=max(1, checked_count + 1),
        reason_code=reason,
    )


class ProjectionRepository:
    """Own only discardable projection state; never canonical/runtime state."""

    def __init__(self) -> None:
        self._projection: DynamicProjection | None = None
        self._audit_entries: tuple[ProjectionAuditEntry, ...] = ()
        self._lock = RLock()

    def snapshot(self) -> ProjectionRepositorySnapshot:
        with self._lock:
            return ProjectionRepositorySnapshot(
                projection=self._projection,
                audit_entries=self._audit_entries,
            )

    def wipe_projection(self) -> None:
        """Idempotently discard every local derivative and nothing upstream."""

        with self._lock:
            self._projection = None
            self._audit_entries = ()

    def replace_projection(self, candidate: DynamicProjection) -> None:
        """Atomically replace only the derivative projection namespace."""

        if not isinstance(candidate, DynamicProjection):
            raise TypeError("candidate_must_be_dynamic_projection")
        with self._lock:
            self._projection = candidate

    def _report(
        self,
        *,
        success: bool,
        anchor: LedgerAnchor,
        previous_hash: str | None,
        new_projection: DynamicProjection | None,
        verification: LedgerVerificationReport,
    ) -> RebuildReport:
        projection = new_projection if success else self._projection
        return RebuildReport(
            success=success,
            source_head_sha256=anchor.head_sha256,
            previous_projection_sha256=previous_hash,
            new_projection_sha256=(
                new_projection.projection_sha256 if success and new_projection else None
            ),
            aspect_count=len(projection.aspects) if projection else 0,
            node_count=len(projection.nodes) if projection else 0,
            edge_count=len(projection.edges) if projection else 0,
            verification=verification,
        )

    def rebuild_from_history(
        self,
        events: Iterable[LedgerEvent],
        anchor: LedgerAnchor,
    ) -> RebuildReport:
        """Verify, rebuild twice, and atomically replace the local projection."""

        materialized = tuple(events)
        with self._lock:
            previous_hash = (
                self._projection.projection_sha256 if self._projection else None
            )
            verification = verify_ledger(materialized, anchor)
            if not verification.valid:
                return self._report(
                    success=False,
                    anchor=anchor,
                    previous_hash=previous_hash,
                    new_projection=None,
                    verification=verification,
                )

            first_candidate = project_verified_history(materialized, anchor)
            second_candidate = project_verified_history(materialized, anchor)
            if serialize_projection(first_candidate) != serialize_projection(second_candidate):
                failure = _verification_failure(
                    anchor,
                    "projection_nondeterministic",
                    checked_count=verification.checked_count,
                )
                return self._report(
                    success=False,
                    anchor=anchor,
                    previous_hash=previous_hash,
                    new_projection=None,
                    verification=failure,
                )
            if not verify_projection(first_candidate, materialized, anchor):
                failure = _verification_failure(
                    anchor,
                    "projection_verification_failed",
                    checked_count=verification.checked_count,
                )
                return self._report(
                    success=False,
                    anchor=anchor,
                    previous_hash=previous_hash,
                    new_projection=None,
                    verification=failure,
                )

            counts = {
                status.value: sum(
                    aspect.status is status for aspect in first_candidate.aspects
                )
                for status in ProjectionStatus
            }
            previous_audit_hash = (
                self._audit_entries[-1].entry_sha256
                if self._audit_entries
                else GENESIS_SHA256
            )
            draft = ProjectionAuditEntry(
                schema_version=AUDIT_SCHEMA_VERSION,
                sequence=len(self._audit_entries) + 1,
                action="rebuild",
                previous_audit_sha256=previous_audit_hash,
                source_event_count=anchor.event_count,
                source_ledger_sha256=anchor.head_sha256,
                projection_sha256=first_candidate.projection_sha256,
                outcome_summary={
                    "projection_status": first_candidate.status.value,
                    "aspect_counts": counts,
                },
                entry_sha256=GENESIS_SHA256,
            )
            audit_entry = replace(
                draft, entry_sha256=compute_projection_audit_hash(draft)
            )

            self._projection = first_candidate
            self._audit_entries = self._audit_entries + (audit_entry,)
            return self._report(
                success=True,
                anchor=anchor,
                previous_hash=previous_hash,
                new_projection=first_candidate,
                verification=verification,
            )

    def verify_current_against_history(
        self,
        events: Iterable[LedgerEvent],
        anchor: LedgerAnchor,
    ) -> bool:
        """Compare current bytes with a fresh rebuild without writing."""

        materialized = tuple(events)
        with self._lock:
            if self._projection is None:
                return False
            verification = verify_ledger(materialized, anchor)
            if not verification.valid:
                return False
            candidate = project_verified_history(materialized, anchor)
            return (
                serialize_projection(self._projection)
                == serialize_projection(candidate)
                and self._projection.projection_sha256
                == candidate.projection_sha256
            )
