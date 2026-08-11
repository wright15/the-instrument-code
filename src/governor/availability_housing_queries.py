"""Bounded read-only named queries for the GOV-210 projection."""

from __future__ import annotations

from dataclasses import dataclass
import re
from types import MappingProxyType
from typing import Any, Mapping

from .availability_housing import AvailabilityHousingError


MAX_ROWS = 100
MAX_DEPTH = 3
TIMEOUT_MS = 1000
_IDENTIFIER = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$")


@dataclass(frozen=True, slots=True)
class Gov210NamedQuery:
    query_id: str
    required_parameters: tuple[str, ...]
    optional_parameters: tuple[str, ...]
    max_rows: int
    max_depth: int
    timeout_ms: int
    cypher: str


GOV210_QUERY_CATALOG = MappingProxyType(
    {
        "skills_for_topology_target": Gov210NamedQuery(
            "skills_for_topology_target",
            ("scaleStateId",),
            (),
            10,
            3,
            TIMEOUT_MS,
            """MATCH (skill:Gov210SkillAvailability)-[:GOV210_HAS_ELIGIBILITY]->(:Gov210SkillEligibility)-[:GOV210_ASSIGNS_SKILL]->(assignment:Gov210SkillAssignment)-[:GOV210_TARGETS]->(target:Gov210TopologyTarget {scaleStateId: $scaleStateId})
RETURN skill.skillId AS skillId, skill.name AS name,
       assignment.assignmentId AS assignmentId, assignment.basisKind AS basisKind,
       assignment.basisSha256 AS basisSha256, assignment.informationalOnly AS informationalOnly,
       assignment.runtimeAuthority AS runtimeAuthority, target.scaleStateId AS scaleStateId,
       target.role AS targetRole, target.tier AS targetTier, target.office AS targetOffice
ORDER BY skillId, assignmentId
LIMIT 10""",
        ),
        "skills_for_court_position": Gov210NamedQuery(
            "skills_for_court_position",
            ("positionId",),
            (),
            10,
            3,
            TIMEOUT_MS,
            """MATCH (skill:Gov210SkillAvailability)-[:GOV210_HAS_ELIGIBILITY]->(:Gov210SkillEligibility)-[:GOV210_ASSIGNS_SKILL]->(assignment:Gov210SkillAssignment)-[:GOV210_TARGETS]->(target:Gov210CourtTarget {positionId: $positionId})
RETURN skill.skillId AS skillId, skill.name AS name,
       assignment.assignmentId AS assignmentId, assignment.basisKind AS basisKind,
       assignment.basisSha256 AS basisSha256, assignment.informationalOnly AS informationalOnly,
       assignment.runtimeAuthority AS runtimeAuthority, target.positionId AS positionId,
       target.pitchMask AS pitchMask, target.kappaNumerator AS kappaNumerator,
       target.kappaDenominator AS kappaDenominator
ORDER BY skillId, assignmentId
LIMIT 10""",
        ),
        "skill_assignment_explanation": Gov210NamedQuery(
            "skill_assignment_explanation",
            ("assignmentId",),
            (),
            1,
            1,
            TIMEOUT_MS,
            """MATCH (assignment:Gov210SkillAssignment {assignmentId: $assignmentId})
RETURN assignment.assignmentId AS assignmentId, assignment.skillId AS skillId,
       assignment.targetNamespace AS targetNamespace, assignment.targetId AS targetId,
       assignment.basisKind AS basisKind, assignment.basisIds AS basisIds,
       assignment.applicationIds AS applicationIds, assignment.operatorIds AS operatorIds,
       assignment.edgeIds AS edgeIds, assignment.degreeAddresses AS degreeAddresses,
       assignment.directions AS directions, assignment.targetRole AS targetRole,
       assignment.targetTier AS targetTier, assignment.targetOffice AS targetOffice,
       assignment.basisSha256 AS basisSha256,
       assignment.informationalOnly AS informationalOnly,
       assignment.runtimeAuthority AS runtimeAuthority,
       assignment.recordSha256 AS recordSha256
ORDER BY assignmentId
LIMIT 1""",
        ),
        "skill_availability": Gov210NamedQuery(
            "skill_availability",
            ("skillId",),
            (),
            1,
            1,
            TIMEOUT_MS,
            """MATCH (skill:Gov210SkillAvailability {skillId: $skillId})-[:GOV210_HAS_ELIGIBILITY]->(eligibility:Gov210SkillEligibility)
RETURN skill.skillId AS skillId, skill.name AS name, skill.operationId AS operationId,
       skill.registryNamespace AS registryNamespace, skill.registrySha256 AS registrySha256,
       skill.apiVersion AS apiVersion, eligibility.targetNamespace AS targetNamespace,
       eligibility.basisSelector AS basisSelector,
       eligibility.assignmentSemantics AS assignmentSemantics,
       eligibility.runtimeAuthority AS runtimeAuthority
ORDER BY skillId
LIMIT 1""",
        ),
        "context_housing_for_note": Gov210NamedQuery(
            "context_housing_for_note",
            ("noteId",),
            (),
            2,
            1,
            TIMEOUT_MS,
            """MATCH (housing:Gov210ContextHousing {noteId: $noteId})
RETURN housing.housingId AS housingId, housing.noteId AS noteId,
       housing.contextNamespace AS contextNamespace, housing.depth AS depth,
       housing.frontmatterFields AS frontmatterFields, housing.sectionRoles AS sectionRoles,
       housing.sectionRoleStatus AS sectionRoleStatus,
       housing.resolvedLinkNoteIds AS resolvedLinkNoteIds,
       housing.linkStatuses AS linkStatuses, housing.provenanceRefs AS provenanceRefs,
       housing.contentSha256 AS contentSha256,
       housing.sourceBundleFingerprint AS sourceBundleFingerprint,
       housing.housingFingerprint AS housingFingerprint
ORDER BY housingId
LIMIT 2""",
        ),
        "skill_lifecycle_history": Gov210NamedQuery(
            "skill_lifecycle_history",
            ("skillId",),
            ("limit",),
            3,
            1,
            TIMEOUT_MS,
            """MATCH (event:Gov210SkillLifecycle)-[:GOV210_REFERENCES_SKILL]->(skill:Gov210SkillAvailability {skillId: $skillId})
RETURN event.eventId AS eventId, event.skillId AS skillId, event.action AS action,
       event.sequence AS sequence, event.priorEventSha256 AS priorEventSha256,
       event.evidenceSha256 AS evidenceSha256, event.eventSha256 AS eventSha256
ORDER BY sequence, eventId
LIMIT $limit""",
        ),
    }
)


def normalize_gov210_query_parameters(
    query_id: str, parameters: Mapping[str, object]
) -> dict[str, object]:
    spec = GOV210_QUERY_CATALOG.get(query_id)
    if spec is None:
        raise AvailabilityHousingError("query_not_allow_listed")
    allowed = set(spec.required_parameters) | set(spec.optional_parameters)
    if set(parameters) - allowed:
        raise AvailabilityHousingError("query_parameter_unknown")
    if set(spec.required_parameters) - set(parameters):
        raise AvailabilityHousingError("query_parameter_missing")
    normalized = dict(parameters)
    if "scaleStateId" in normalized:
        state_id = normalized["scaleStateId"]
        if type(state_id) is not int or not 0 < state_id < (1 << 12):
            raise AvailabilityHousingError("query_scale_state_id_invalid")
    for field in ("positionId", "assignmentId", "skillId", "noteId"):
        if field not in normalized:
            continue
        value = normalized[field]
        if not isinstance(value, str) or not _IDENTIFIER.fullmatch(value):
            raise AvailabilityHousingError(f"query_{field}_invalid")
    if "positionId" in normalized and normalized["positionId"] not in {
        "C0",
        "C1",
        "C2",
        "C3",
        "C4",
    }:
        raise AvailabilityHousingError("query_positionId_invalid")
    if "limit" in spec.optional_parameters:
        limit = normalized.get("limit", spec.max_rows)
        if type(limit) is not int or not 1 <= limit <= spec.max_rows:
            raise AvailabilityHousingError("query_limit_invalid")
        normalized["limit"] = limit
    return normalized


def _assignment_row(
    assignment: Mapping[str, Any], skill: Mapping[str, Any], target: Mapping[str, Any]
) -> dict[str, Any]:
    props = assignment["properties"]
    target_props = target["properties"]
    skill_props = skill["properties"]
    row = {
        "assignmentId": props["assignmentId"],
        "basisKind": props["basisKind"],
        "basisSha256": props["basisSha256"],
        "informationalOnly": props["informationalOnly"],
        "name": skill_props["name"],
        "runtimeAuthority": props["runtimeAuthority"],
        "skillId": skill_props["skillId"],
    }
    if props["targetNamespace"] == "topology":
        row.update(
            {
                "scaleStateId": target_props["scaleStateId"],
                "targetOffice": target_props["office"],
                "targetRole": target_props["role"],
                "targetTier": target_props["tier"],
            }
        )
    else:
        row.update(
            {
                "kappaDenominator": target_props["kappaDenominator"],
                "kappaNumerator": target_props["kappaNumerator"],
                "pitchMask": target_props["pitchMask"],
                "positionId": target_props["positionId"],
            }
        )
    return row


def execute_gov210_snapshot_query(
    snapshot: Mapping[str, object],
    query_id: str,
    parameters: Mapping[str, object],
) -> tuple[dict[str, Any], ...]:
    """Reference provider for deterministic snapshot/Neo4j result parity."""

    params = normalize_gov210_query_parameters(query_id, parameters)
    nodes = snapshot.get("nodes")
    relationships = snapshot.get("relationships")
    if not isinstance(nodes, list) or not isinstance(relationships, list):
        raise AvailabilityHousingError("query_snapshot_invalid")
    node_by_id = {node["logicalId"]: node for node in nodes}
    by_label: dict[str, list[Mapping[str, Any]]] = {}
    for node in nodes:
        by_label.setdefault(node["label"], []).append(node)

    if query_id in {"skills_for_topology_target", "skills_for_court_position"}:
        target_label = (
            "Gov210TopologyTarget"
            if query_id == "skills_for_topology_target"
            else "Gov210CourtTarget"
        )
        target_field = "scaleStateId" if target_label == "Gov210TopologyTarget" else "positionId"
        target = next(
            (
                node
                for node in by_label.get(target_label, [])
                if node["properties"][target_field] == params[target_field]
            ),
            None,
        )
        if target is None:
            return ()
        target_edges = [
            edge
            for edge in relationships
            if edge["relationshipType"] == "GOV210_TARGETS"
            and edge["targetLogicalId"] == target["logicalId"]
        ]
        rows = []
        for edge in target_edges:
            assignment = node_by_id[edge["sourceLogicalId"]]
            assignment_edge = next(
                candidate
                for candidate in relationships
                if candidate["relationshipType"] == "GOV210_ASSIGNS_SKILL"
                and candidate["targetLogicalId"] == assignment["logicalId"]
            )
            eligibility_id = assignment_edge["sourceLogicalId"]
            eligibility_edge = next(
                candidate
                for candidate in relationships
                if candidate["relationshipType"] == "GOV210_HAS_ELIGIBILITY"
                and candidate["targetLogicalId"] == eligibility_id
            )
            skill = node_by_id[eligibility_edge["sourceLogicalId"]]
            rows.append(_assignment_row(assignment, skill, target))
        rows.sort(key=lambda row: (row["skillId"], row["assignmentId"]))
        return tuple(rows[: GOV210_QUERY_CATALOG[query_id].max_rows])

    if query_id == "skill_assignment_explanation":
        assignment = next(
            (
                node
                for node in by_label.get("Gov210SkillAssignment", [])
                if node["properties"]["assignmentId"] == params["assignmentId"]
            ),
            None,
        )
        if assignment is None:
            return ()
        props = assignment["properties"]
        return (
            {
                "applicationIds": props["applicationIds"],
                "assignmentId": props["assignmentId"],
                "basisIds": props["basisIds"],
                "basisKind": props["basisKind"],
                "basisSha256": props["basisSha256"],
                "degreeAddresses": props["degreeAddresses"],
                "directions": props["directions"],
                "edgeIds": props["edgeIds"],
                "informationalOnly": props["informationalOnly"],
                "operatorIds": props["operatorIds"],
                "recordSha256": assignment["recordSha256"],
                "runtimeAuthority": props["runtimeAuthority"],
                "skillId": props["skillId"],
                "targetId": props["targetId"],
                "targetNamespace": props["targetNamespace"],
                "targetOffice": props["targetOffice"],
                "targetRole": props["targetRole"],
                "targetTier": props["targetTier"],
            },
        )

    if query_id == "skill_availability":
        skill = next(
            (
                node
                for node in by_label.get("Gov210SkillAvailability", [])
                if node["properties"]["skillId"] == params["skillId"]
            ),
            None,
        )
        if skill is None:
            return ()
        edge = next(
            edge
            for edge in relationships
            if edge["relationshipType"] == "GOV210_HAS_ELIGIBILITY"
            and edge["sourceLogicalId"] == skill["logicalId"]
        )
        eligibility = node_by_id[edge["targetLogicalId"]]["properties"]
        props = skill["properties"]
        return (
            {
                "apiVersion": props["apiVersion"],
                "assignmentSemantics": eligibility["assignmentSemantics"],
                "basisSelector": eligibility["basisSelector"],
                "name": props["name"],
                "operationId": props["operationId"],
                "registryNamespace": props["registryNamespace"],
                "registrySha256": props["registrySha256"],
                "runtimeAuthority": eligibility["runtimeAuthority"],
                "skillId": props["skillId"],
                "targetNamespace": eligibility["targetNamespace"],
            },
        )

    if query_id == "context_housing_for_note":
        rows = [
            dict(node["properties"])
            for node in by_label.get("Gov210ContextHousing", [])
            if node["properties"]["noteId"] == params["noteId"]
        ]
        rows.sort(key=lambda row: row["housingId"])
        return tuple(rows[:2])

    if query_id == "skill_lifecycle_history":
        rows = [
            dict(node["properties"])
            for node in by_label.get("Gov210SkillLifecycle", [])
            if node["properties"]["skillId"] == params["skillId"]
        ]
        rows.sort(key=lambda row: (row["sequence"], row["eventId"]))
        return tuple(rows[: int(params["limit"])])
    raise AvailabilityHousingError("query_not_allow_listed")
