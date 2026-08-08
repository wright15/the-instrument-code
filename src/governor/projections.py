"""Pure replay and dynamic-view generation over verified ledger history."""

from __future__ import annotations

from collections.abc import Iterable, Mapping, Sequence
from typing import Any

from .hashing import canonical_json_bytes, sha256_payload
from .ledger import GENESIS_SHA256, verify_ledger
from .models import (
    GOVERNORS,
    DynamicProjection,
    LedgerAnchor,
    LedgerEvent,
    ProjectedAspect,
    ProjectionEdge,
    ProjectionNode,
    ProjectionStatus,
    ProvenanceRef,
    thaw_json,
)


PROJECTION_SCHEMA_VERSION = "gov-204.projection.v1"


def _string_values(value: Any) -> tuple[str, ...]:
    if value is None:
        return ()
    if isinstance(value, str):
        return (value,) if value else ()
    if isinstance(value, Sequence) and not isinstance(value, (bytes, bytearray)):
        return tuple(item for item in value if isinstance(item, str) and item)
    return ()


def _provenance_body(item: ProvenanceRef) -> dict[str, Any]:
    return {
        "event_sequence": item.event_sequence,
        "event_sha256": item.event_sha256,
        "payload_sha256": item.payload_sha256,
        "source_id": item.source_id,
    }


def _aspect_body(item: ProjectedAspect) -> dict[str, Any]:
    body: dict[str, Any] = {
        "aspect_id": item.aspect_id,
        "status": item.status.value,
        "candidates": list(item.candidates),
        "reason_codes": list(item.reason_codes),
        "evidence_ids": list(item.evidence_ids),
        "provenance": [_provenance_body(ref) for ref in item.provenance],
    }
    if item.governor is not None:
        body["governor"] = item.governor
    return body


def _node_body(item: ProjectionNode) -> dict[str, Any]:
    return {
        "kind": item.kind,
        "logical_id": item.logical_id,
        "properties": thaw_json(item.properties),
    }


def _edge_body(item: ProjectionEdge) -> dict[str, Any]:
    return {
        "relationship_type": item.relationship_type,
        "source_id": item.source_id,
        "target_id": item.target_id,
        "logical_id": item.logical_id,
        "properties": thaw_json(item.properties),
    }


def _payload_body(
    aspects: tuple[ProjectedAspect, ...],
    nodes: tuple[ProjectionNode, ...],
    edges: tuple[ProjectionEdge, ...],
    status: ProjectionStatus,
    resolved_ids: tuple[str, ...],
    abstaining_ids: tuple[str, ...],
) -> dict[str, Any]:
    return {
        "status": status.value,
        "resolved_aspect_ids": list(resolved_ids),
        "abstaining_aspect_ids": list(abstaining_ids),
        "aspects": [_aspect_body(item) for item in aspects],
        "nodes": [_node_body(item) for item in nodes],
        "edges": [_edge_body(item) for item in edges],
    }


def _projection_core(projection: DynamicProjection) -> dict[str, Any]:
    payload = _payload_body(
        projection.aspects,
        projection.nodes,
        projection.edges,
        projection.status,
        projection.resolved_aspect_ids,
        projection.abstaining_aspect_ids,
    )
    return {
        "schema_version": projection.schema_version,
        "source_anchor": {
            "event_count": projection.source_anchor.event_count,
            "head_sha256": projection.source_anchor.head_sha256,
        },
        "canonical_payload_sha256": projection.canonical_payload_sha256,
        "payload": payload,
    }


def _aggregate_status(aspects: tuple[ProjectedAspect, ...]) -> ProjectionStatus:
    if not aspects:
        return ProjectionStatus.UNRESOLVED
    statuses = {item.status for item in aspects}
    if statuses == {ProjectionStatus.RESOLVED}:
        return ProjectionStatus.RESOLVED
    if statuses == {ProjectionStatus.AMBIGUOUS}:
        return ProjectionStatus.AMBIGUOUS
    if statuses == {ProjectionStatus.UNRESOLVED}:
        return ProjectionStatus.UNRESOLVED
    return ProjectionStatus.PARTIAL


def build_projection_graph(
    projected_aspects: Iterable[ProjectedAspect],
) -> tuple[tuple[ProjectionNode, ...], tuple[ProjectionEdge, ...]]:
    """Build a namespaced logical graph without canonical-office write fields."""

    aspects = tuple(sorted(projected_aspects, key=lambda item: item.aspect_id))
    nodes: dict[str, ProjectionNode] = {}
    edges: dict[str, ProjectionEdge] = {}
    for aspect in aspects:
        aspect_node_id = f"projection:aspect:{aspect.aspect_id}"
        aspect_properties: dict[str, Any] = {
            "aspect_id": aspect.aspect_id,
            "status": aspect.status.value,
            "candidates": aspect.candidates,
            "reason_codes": aspect.reason_codes,
            "evidence_ids": aspect.evidence_ids,
            "provenance": tuple(_provenance_body(ref) for ref in aspect.provenance),
        }
        if aspect.governor is not None:
            aspect_properties["governor"] = aspect.governor
        nodes[aspect_node_id] = ProjectionNode(
            kind="ProjectedAspect",
            logical_id=aspect_node_id,
            properties=aspect_properties,
        )

        projected_governors = (
            (aspect.governor,) if aspect.governor is not None else aspect.candidates
        )
        for governor in projected_governors:
            governor_id = f"projection:governor-reference:{governor}"
            nodes[governor_id] = ProjectionNode(
                kind="GovernorReference",
                logical_id=governor_id,
                properties={"name": governor},
            )
            relationship = (
                "PROJECTS_GOVERNOR"
                if aspect.governor is not None
                else "HAS_GOVERNOR_CANDIDATE"
            )
            edge_id = f"{aspect_node_id}|{relationship}|{governor_id}"
            edges[edge_id] = ProjectionEdge(
                relationship_type=relationship,
                source_id=aspect_node_id,
                target_id=governor_id,
                logical_id=edge_id,
            )

        for evidence_id in aspect.evidence_ids:
            evidence_node_id = f"projection:evidence:{evidence_id}"
            nodes[evidence_node_id] = ProjectionNode(
                kind="EvidenceReference",
                logical_id=evidence_node_id,
                properties={"evidence_id": evidence_id},
            )
            edge_id = f"{aspect_node_id}|SUPPORTED_BY|{evidence_node_id}"
            edges[edge_id] = ProjectionEdge(
                relationship_type="SUPPORTED_BY",
                source_id=aspect_node_id,
                target_id=evidence_node_id,
                logical_id=edge_id,
            )

    return (
        tuple(sorted(nodes.values(), key=lambda item: (item.kind, item.logical_id))),
        tuple(
            sorted(
                edges.values(),
                key=lambda item: (
                    item.relationship_type,
                    item.source_id,
                    item.target_id,
                    item.logical_id,
                ),
            )
        ),
    )


def build_dynamic_view(
    replayed_state: Mapping[str, ProjectedAspect] | Iterable[ProjectedAspect],
    source_anchor: LedgerAnchor,
) -> DynamicProjection:
    """Create and hash one immutable view from replayed aspect states."""

    values = replayed_state.values() if isinstance(replayed_state, Mapping) else replayed_state
    aspects = tuple(sorted(tuple(values), key=lambda item: item.aspect_id))
    if any(not isinstance(item, ProjectedAspect) for item in aspects):
        raise TypeError("replayed_state_must_contain_projected_aspects")
    nodes, edges = build_projection_graph(aspects)
    status = _aggregate_status(aspects)
    resolved_ids = tuple(
        item.aspect_id for item in aspects if item.status is ProjectionStatus.RESOLVED
    )
    abstaining_ids = tuple(
        item.aspect_id for item in aspects if item.status is not ProjectionStatus.RESOLVED
    )
    payload = _payload_body(
        aspects, nodes, edges, status, resolved_ids, abstaining_ids
    )
    payload_sha256 = sha256_payload(payload)
    core = {
        "schema_version": PROJECTION_SCHEMA_VERSION,
        "source_anchor": {
            "event_count": source_anchor.event_count,
            "head_sha256": source_anchor.head_sha256,
        },
        "canonical_payload_sha256": payload_sha256,
        "payload": payload,
    }
    projection_sha256 = sha256_payload(core)
    return DynamicProjection(
        schema_version=PROJECTION_SCHEMA_VERSION,
        source_anchor=source_anchor,
        aspects=aspects,
        nodes=nodes,
        edges=edges,
        status=status,
        resolved_aspect_ids=resolved_ids,
        abstaining_aspect_ids=abstaining_ids,
        canonical_payload_sha256=payload_sha256,
        projection_sha256=projection_sha256,
    )


def _unresolved_projection(anchor: LedgerAnchor, reason: str) -> DynamicProjection:
    return build_dynamic_view(
        (
            ProjectedAspect(
                aspect_id="projection:state",
                status=ProjectionStatus.UNRESOLVED,
                reason_codes=(reason,),
            ),
        ),
        anchor,
    )


def _provenance_for(event: LedgerEvent) -> ProvenanceRef:
    source_id = event.payload.get("source_id")
    if not isinstance(source_id, str) or not source_id:
        source_id = f"ledger-event:{event.sequence}"
    return ProvenanceRef(
        event_sequence=event.sequence,
        event_sha256=event.event_sha256,
        payload_sha256=event.payload_sha256,
        source_id=source_id,
    )


def _unresolved_aspect(
    aspect_id: str,
    reasons: Iterable[str],
    provenance: tuple[ProvenanceRef, ...] = (),
) -> ProjectedAspect:
    reason_values = tuple(sorted(set(reasons))) or ("aspect_unresolved",)
    return ProjectedAspect(
        aspect_id=aspect_id,
        status=ProjectionStatus.UNRESOLVED,
        reason_codes=reason_values,
        provenance=provenance,
    )


def _project_record(
    record: Mapping[str, Any], provenance: ProvenanceRef
) -> ProjectedAspect:
    aspect_id = record.get("aspect_id")
    if not isinstance(aspect_id, str) or not aspect_id:
        return _unresolved_aspect(
            "projection:invalid-aspect",
            ("aspect_id_missing",),
            (provenance,),
        )
    reasons = _string_values(record.get("reason_codes"))
    if record.get("verification") != "verified":
        verification_reason = (
            "verification_missing"
            if "verification" not in record
            else "aspect_unverified"
        )
        return _unresolved_aspect(
            aspect_id, reasons + (verification_reason,), (provenance,)
        )

    raw_status = record.get("status", record.get("outcome"))
    if raw_status == "classified":
        raw_status = "resolved"
    if raw_status == "invalid":
        return _unresolved_aspect(
            aspect_id, reasons + ("aspect_invalid",), (provenance,)
        )
    governor = record.get("governor", record.get("primary_governor"))
    candidates = set(_string_values(record.get("candidates")))
    if isinstance(governor, str) and governor:
        candidates.add(governor)
    if any(candidate not in GOVERNORS for candidate in candidates):
        return _unresolved_aspect(
            aspect_id, reasons + ("invalid_governor",), (provenance,)
        )
    evidence_ids = _string_values(record.get("evidence_ids"))

    if raw_status == "ambiguous" or len(candidates) > 1:
        if len(candidates) < 2:
            return _unresolved_aspect(
                aspect_id,
                reasons + ("ambiguous_candidates_incomplete",),
                (provenance,),
            )
        return ProjectedAspect(
            aspect_id=aspect_id,
            status=ProjectionStatus.AMBIGUOUS,
            candidates=tuple(candidates),
            reason_codes=reasons,
            evidence_ids=evidence_ids,
            provenance=(provenance,),
        )
    if raw_status == "partial":
        return ProjectedAspect(
            aspect_id=aspect_id,
            status=ProjectionStatus.PARTIAL,
            reason_codes=reasons or ("aspect_partial",),
            evidence_ids=evidence_ids,
            provenance=(provenance,),
        )
    if raw_status == "unresolved":
        return _unresolved_aspect(
            aspect_id, reasons or ("aspect_unresolved",), (provenance,)
        )
    if raw_status not in (None, "resolved"):
        return _unresolved_aspect(
            aspect_id, reasons + ("aspect_status_invalid",), (provenance,)
        )
    if len(candidates) != 1:
        return _unresolved_aspect(
            aspect_id, reasons + ("governor_missing",), (provenance,)
        )
    if not evidence_ids:
        return _unresolved_aspect(
            aspect_id, reasons + ("evidence_missing",), (provenance,)
        )
    return ProjectedAspect(
        aspect_id=aspect_id,
        status=ProjectionStatus.RESOLVED,
        governor=next(iter(candidates)),
        evidence_ids=evidence_ids,
        provenance=(provenance,),
    )


def _replay_aspects(events: tuple[LedgerEvent, ...]) -> dict[str, ProjectedAspect]:
    state: dict[str, ProjectedAspect] = {}
    requested_ids: set[str] = set()
    for event in events:
        provenance = _provenance_for(event)
        event_requested = set(_string_values(event.payload.get("requested_aspect_ids")))
        requested_ids.update(event_requested)
        records = event.payload.get("aspect_states", ())
        if not isinstance(records, Sequence) or isinstance(records, (str, bytes, bytearray)):
            records = ()
        recorded_ids: set[str] = set()
        for record in records:
            if not isinstance(record, Mapping):
                continue
            projected = _project_record(record, provenance)
            state[projected.aspect_id] = projected
            recorded_ids.add(projected.aspect_id)
            requested_ids.add(projected.aspect_id)
        for missing_id in event_requested - recorded_ids:
            state[missing_id] = _unresolved_aspect(
                missing_id, ("aspect_missing",), (provenance,)
            )
    for missing_id in requested_ids - set(state):
        state[missing_id] = _unresolved_aspect(missing_id, ("aspect_missing",))
    return state


def project_verified_history(
    events: Iterable[LedgerEvent],
    anchor: LedgerAnchor,
    *,
    as_of_sequence: int | None = None,
) -> DynamicProjection:
    """Verify complete history, replay a prefix, and return a read-only view."""

    materialized = tuple(events)
    verification = verify_ledger(materialized, anchor)
    if not verification.valid:
        return _unresolved_projection(anchor, "ledger_verification_failed")
    if as_of_sequence is None:
        prefix = materialized
    elif (
        isinstance(as_of_sequence, bool)
        or as_of_sequence < 0
        or as_of_sequence > len(materialized)
    ):
        return _unresolved_projection(anchor, "invalid_as_of_sequence")
    else:
        prefix = materialized[:as_of_sequence]
    prefix_anchor = LedgerAnchor(
        event_count=len(prefix),
        head_sha256=prefix[-1].event_sha256 if prefix else GENESIS_SHA256,
    )
    state = _replay_aspects(prefix)
    if not state:
        state["projection:state"] = _unresolved_aspect(
            "projection:state", ("no_aspect_state",)
        )
    return build_dynamic_view(state, prefix_anchor)


def serialize_projection(projection: DynamicProjection) -> bytes:
    """Serialize the complete projection envelope to canonical UTF-8 bytes."""

    body = _projection_core(projection)
    body["projection_sha256"] = projection.projection_sha256
    return canonical_json_bytes(body)


def verify_projection(
    projection: DynamicProjection,
    events: Iterable[LedgerEvent],
    anchor: LedgerAnchor,
) -> bool:
    """Rebuild from primary history and compare exact bytes and identities."""

    materialized = tuple(events)
    as_of = (
        None
        if projection.source_anchor.event_count == anchor.event_count
        else projection.source_anchor.event_count
    )
    rebuilt = project_verified_history(materialized, anchor, as_of_sequence=as_of)
    return (
        projection.canonical_payload_sha256 == rebuilt.canonical_payload_sha256
        and projection.projection_sha256 == rebuilt.projection_sha256
        and serialize_projection(projection) == serialize_projection(rebuilt)
    )
