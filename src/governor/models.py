"""Immutable contracts for deterministic Governor read projections."""

from __future__ import annotations

from collections.abc import Iterator, Mapping
from dataclasses import dataclass, field
from decimal import Decimal
from enum import Enum
import math
import re
from typing import Any


SHA256_PATTERN = re.compile(r"^[0-9a-f]{64}$")
GOVERNORS = frozenset(
    {"Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"}
)


class ProjectionBoundaryError(ValueError):
    """Raised when a derivative projection crosses an authority boundary."""


class ProjectionStatus(str, Enum):
    RESOLVED = "resolved"
    UNRESOLVED = "unresolved"
    AMBIGUOUS = "ambiguous"
    PARTIAL = "partial"


class FrozenDict(Mapping[str, Any]):
    """A small recursively immutable mapping with deterministic iteration."""

    __slots__ = ("_items",)

    def __init__(self, values: Mapping[str, Any] | None = None) -> None:
        source = values or {}
        items: list[tuple[str, Any]] = []
        for key in sorted(source):
            if not isinstance(key, str):
                raise TypeError("json_object_key_must_be_string")
            items.append((key, freeze_json(source[key])))
        object.__setattr__(self, "_items", tuple(items))

    def __getitem__(self, key: str) -> Any:
        for item_key, value in self._items:
            if item_key == key:
                return value
        raise KeyError(key)

    def __iter__(self) -> Iterator[str]:
        return (key for key, _ in self._items)

    def __len__(self) -> int:
        return len(self._items)

    def __repr__(self) -> str:
        return f"FrozenDict({dict(self._items)!r})"

    def __setattr__(self, name: str, value: Any) -> None:
        raise TypeError("frozen_mapping")

    def __deepcopy__(self, memo: dict[int, Any]) -> FrozenDict:
        return self


def freeze_json(value: Any) -> Any:
    """Copy JSON-like input into recursively immutable values."""

    if isinstance(value, FrozenDict):
        return value
    if isinstance(value, Mapping):
        return FrozenDict(value)
    if isinstance(value, (list, tuple)):
        return tuple(freeze_json(item) for item in value)
    if value is None or isinstance(value, (str, bool, int, Decimal)):
        return value
    if isinstance(value, float):
        if not math.isfinite(value):
            raise ValueError("non_finite_number")
        return value
    raise TypeError(f"unsupported_json_type:{type(value).__name__}")


def thaw_json(value: Any) -> Any:
    """Return ordinary containers suitable for explicit serialization bodies."""

    if isinstance(value, Mapping):
        return {key: thaw_json(item) for key, item in value.items()}
    if isinstance(value, tuple):
        return [thaw_json(item) for item in value]
    return value


def _require_identifier(value: str, field_name: str) -> None:
    if not isinstance(value, str) or not value:
        raise ValueError(f"{field_name}_must_be_nonempty")


def _require_sha256(value: str, field_name: str) -> None:
    if not isinstance(value, str) or not SHA256_PATTERN.fullmatch(value):
        raise ValueError(f"{field_name}_must_be_lowercase_sha256")


def _sorted_unique(values: tuple[str, ...] | list[str], field_name: str) -> tuple[str, ...]:
    result = tuple(sorted(set(values)))
    if any(not isinstance(item, str) or not item for item in result):
        raise ValueError(f"{field_name}_must_contain_nonempty_strings")
    return result


def _contains_reserved_office(value: Any) -> bool:
    if isinstance(value, Mapping):
        for key, item in value.items():
            if key.casefold() in {"office", "scalestate.office"}:
                return True
            if _contains_reserved_office(item):
                return True
    elif isinstance(value, tuple):
        return any(_contains_reserved_office(item) for item in value)
    return False


@dataclass(frozen=True, slots=True)
class LedgerAnchor:
    event_count: int
    head_sha256: str

    def __post_init__(self) -> None:
        if isinstance(self.event_count, bool) or self.event_count < 0:
            raise ValueError("event_count_must_be_nonnegative")
        _require_sha256(self.head_sha256, "head_sha256")


@dataclass(frozen=True, slots=True)
class LedgerEvent:
    sequence: int
    previous_event_sha256: str
    payload: FrozenDict | Mapping[str, Any]
    payload_sha256: str
    event_sha256: str

    def __post_init__(self) -> None:
        if isinstance(self.sequence, bool) or self.sequence < 1:
            raise ValueError("sequence_must_start_at_one")
        _require_sha256(self.previous_event_sha256, "previous_event_sha256")
        _require_sha256(self.payload_sha256, "payload_sha256")
        _require_sha256(self.event_sha256, "event_sha256")
        object.__setattr__(self, "payload", freeze_json(self.payload))


@dataclass(frozen=True, slots=True)
class LedgerVerificationReport:
    valid: bool
    checked_count: int
    trusted_head_sha256: str
    recomputed_head_sha256: str
    first_failing_sequence: int | None
    reason_code: str

    def __post_init__(self) -> None:
        if isinstance(self.checked_count, bool) or self.checked_count < 0:
            raise ValueError("checked_count_must_be_nonnegative")
        _require_sha256(self.trusted_head_sha256, "trusted_head_sha256")
        _require_sha256(self.recomputed_head_sha256, "recomputed_head_sha256")
        if self.first_failing_sequence is not None and self.first_failing_sequence < 1:
            raise ValueError("first_failing_sequence_must_be_positive")
        _require_identifier(self.reason_code, "reason_code")
        if self.valid and (self.first_failing_sequence is not None or self.reason_code != "ok"):
            raise ValueError("valid_report_must_have_ok_reason")


@dataclass(frozen=True, slots=True)
class ProvenanceRef:
    event_sequence: int
    event_sha256: str
    payload_sha256: str
    source_id: str

    def __post_init__(self) -> None:
        if isinstance(self.event_sequence, bool) or self.event_sequence < 1:
            raise ValueError("event_sequence_must_be_positive")
        _require_sha256(self.event_sha256, "event_sha256")
        _require_sha256(self.payload_sha256, "payload_sha256")
        _require_identifier(self.source_id, "source_id")


@dataclass(frozen=True, slots=True)
class ProjectedAspect:
    aspect_id: str
    status: ProjectionStatus | str
    governor: str | None = None
    candidates: tuple[str, ...] = ()
    reason_codes: tuple[str, ...] = ()
    evidence_ids: tuple[str, ...] = ()
    provenance: tuple[ProvenanceRef, ...] = ()

    def __post_init__(self) -> None:
        _require_identifier(self.aspect_id, "aspect_id")
        status = ProjectionStatus(self.status)
        object.__setattr__(self, "status", status)
        candidates = _sorted_unique(self.candidates, "candidates")
        reasons = _sorted_unique(self.reason_codes, "reason_codes")
        evidence = _sorted_unique(self.evidence_ids, "evidence_ids")
        provenance = tuple(
            sorted(
                set(self.provenance),
                key=lambda item: (
                    item.event_sequence,
                    item.source_id,
                    item.event_sha256,
                    item.payload_sha256,
                ),
            )
        )
        object.__setattr__(self, "candidates", candidates)
        object.__setattr__(self, "reason_codes", reasons)
        object.__setattr__(self, "evidence_ids", evidence)
        object.__setattr__(self, "provenance", provenance)

        if status is ProjectionStatus.RESOLVED:
            if self.governor not in GOVERNORS:
                raise ValueError("resolved_aspect_requires_one_governor")
            if not evidence or not provenance:
                raise ValueError("resolved_aspect_requires_evidence_and_provenance")
            if candidates or reasons:
                raise ValueError("resolved_aspect_cannot_abstain")
        elif status is ProjectionStatus.AMBIGUOUS:
            if self.governor is not None or len(candidates) < 2:
                raise ValueError("ambiguous_aspect_requires_multiple_candidates")
            if not provenance:
                raise ValueError("ambiguous_aspect_requires_provenance")
        elif status is ProjectionStatus.UNRESOLVED:
            if self.governor is not None or candidates or not reasons:
                raise ValueError("unresolved_aspect_requires_reasons_without_result")
        elif status is ProjectionStatus.PARTIAL:
            if self.governor is not None or not reasons:
                raise ValueError("partial_aspect_requires_abstention_reasons")


@dataclass(frozen=True, slots=True)
class ProjectionNode:
    kind: str
    logical_id: str
    properties: FrozenDict | Mapping[str, Any] = field(default_factory=FrozenDict)

    def __post_init__(self) -> None:
        _require_identifier(self.kind, "kind")
        _require_identifier(self.logical_id, "logical_id")
        properties = freeze_json(self.properties)
        if _contains_reserved_office(properties):
            raise ProjectionBoundaryError("projection_reserved_office")
        object.__setattr__(self, "properties", properties)


@dataclass(frozen=True, slots=True)
class ProjectionEdge:
    relationship_type: str
    source_id: str
    target_id: str
    logical_id: str
    properties: FrozenDict | Mapping[str, Any] = field(default_factory=FrozenDict)

    def __post_init__(self) -> None:
        _require_identifier(self.relationship_type, "relationship_type")
        _require_identifier(self.source_id, "source_id")
        _require_identifier(self.target_id, "target_id")
        _require_identifier(self.logical_id, "logical_id")
        if self.relationship_type.casefold() == "occupies_office":
            raise ProjectionBoundaryError("projection_reserved_occupies_office")
        properties = freeze_json(self.properties)
        if _contains_reserved_office(properties):
            raise ProjectionBoundaryError("projection_reserved_office")
        if (
            self.relationship_type.casefold() == "relational_office_evidence"
            and properties.get("categorical") is True
        ):
            raise ProjectionBoundaryError("relational_evidence_cannot_be_categorical")
        object.__setattr__(self, "properties", properties)


@dataclass(frozen=True, slots=True)
class DynamicProjection:
    schema_version: str
    source_anchor: LedgerAnchor
    aspects: tuple[ProjectedAspect, ...]
    nodes: tuple[ProjectionNode, ...]
    edges: tuple[ProjectionEdge, ...]
    status: ProjectionStatus | str
    resolved_aspect_ids: tuple[str, ...]
    abstaining_aspect_ids: tuple[str, ...]
    canonical_payload_sha256: str
    projection_sha256: str

    def __post_init__(self) -> None:
        _require_identifier(self.schema_version, "schema_version")
        status = ProjectionStatus(self.status)
        aspects = tuple(sorted(self.aspects, key=lambda item: item.aspect_id))
        nodes = tuple(sorted(self.nodes, key=lambda item: (item.kind, item.logical_id)))
        edges = tuple(
            sorted(
                self.edges,
                key=lambda item: (
                    item.relationship_type,
                    item.source_id,
                    item.target_id,
                    item.logical_id,
                ),
            )
        )
        if len({item.aspect_id for item in aspects}) != len(aspects):
            raise ValueError("duplicate_projected_aspect")
        if len({item.logical_id for item in nodes}) != len(nodes):
            raise ValueError("duplicate_projection_node")
        if len({item.logical_id for item in edges}) != len(edges):
            raise ValueError("duplicate_projection_edge")
        object.__setattr__(self, "status", status)
        object.__setattr__(self, "aspects", aspects)
        object.__setattr__(self, "nodes", nodes)
        object.__setattr__(self, "edges", edges)

        expected_resolved = tuple(
            item.aspect_id for item in aspects if item.status is ProjectionStatus.RESOLVED
        )
        expected_abstaining = tuple(
            item.aspect_id for item in aspects if item.status is not ProjectionStatus.RESOLVED
        )
        resolved = _sorted_unique(self.resolved_aspect_ids, "resolved_aspect_ids")
        abstaining = _sorted_unique(self.abstaining_aspect_ids, "abstaining_aspect_ids")
        object.__setattr__(self, "resolved_aspect_ids", resolved)
        object.__setattr__(self, "abstaining_aspect_ids", abstaining)
        if resolved != expected_resolved or abstaining != expected_abstaining:
            raise ValueError("projection_status_ids_do_not_match_aspects")
        if status is ProjectionStatus.PARTIAL and (not resolved or not abstaining):
            raise ValueError("partial_projection_requires_resolved_and_abstaining_aspects")
        _require_sha256(self.canonical_payload_sha256, "canonical_payload_sha256")
        _require_sha256(self.projection_sha256, "projection_sha256")


@dataclass(frozen=True, slots=True)
class ProjectionAuditEntry:
    schema_version: str
    sequence: int
    action: str
    previous_audit_sha256: str
    source_event_count: int
    source_ledger_sha256: str
    projection_sha256: str | None
    outcome_summary: FrozenDict | Mapping[str, Any]
    entry_sha256: str

    def __post_init__(self) -> None:
        _require_identifier(self.schema_version, "schema_version")
        if isinstance(self.sequence, bool) or self.sequence < 1:
            raise ValueError("audit_sequence_must_start_at_one")
        _require_identifier(self.action, "action")
        _require_sha256(self.previous_audit_sha256, "previous_audit_sha256")
        if isinstance(self.source_event_count, bool) or self.source_event_count < 0:
            raise ValueError("source_event_count_must_be_nonnegative")
        _require_sha256(self.source_ledger_sha256, "source_ledger_sha256")
        if self.projection_sha256 is not None:
            _require_sha256(self.projection_sha256, "projection_sha256")
        object.__setattr__(self, "outcome_summary", freeze_json(self.outcome_summary))
        _require_sha256(self.entry_sha256, "entry_sha256")


@dataclass(frozen=True, slots=True)
class RebuildReport:
    success: bool
    source_head_sha256: str
    previous_projection_sha256: str | None
    new_projection_sha256: str | None
    aspect_count: int
    node_count: int
    edge_count: int
    verification: LedgerVerificationReport

    def __post_init__(self) -> None:
        _require_sha256(self.source_head_sha256, "source_head_sha256")
        if self.previous_projection_sha256 is not None:
            _require_sha256(self.previous_projection_sha256, "previous_projection_sha256")
        if self.new_projection_sha256 is not None:
            _require_sha256(self.new_projection_sha256, "new_projection_sha256")
        if any(
            isinstance(value, bool) or value < 0
            for value in (self.aspect_count, self.node_count, self.edge_count)
        ):
            raise ValueError("rebuild_counts_must_be_nonnegative")


@dataclass(frozen=True, slots=True)
class ProjectionRepositorySnapshot:
    projection: DynamicProjection | None
    audit_entries: tuple[ProjectionAuditEntry, ...]
