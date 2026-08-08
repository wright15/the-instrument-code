"""Bounded read-only named queries for the CRT-306 Court projection."""

from __future__ import annotations

from dataclasses import dataclass
from types import MappingProxyType
from typing import Any, Mapping

from .court_graph_projection import CourtGraphProjectionError


MAX_ROWS = 100
MAX_DEPTH = 3
TIMEOUT_MS = 1000


@dataclass(frozen=True, slots=True)
class CourtNamedQuery:
    query_id: str
    required_parameters: tuple[str, ...]
    optional_parameters: tuple[str, ...]
    max_rows: int
    max_depth: int
    timeout_ms: int
    cypher: str


COURT_QUERY_CATALOG = MappingProxyType(
    {
        "degree_triads_for_scale": CourtNamedQuery(
            "degree_triads_for_scale",
            ("scaleStateId",),
            (),
            7,
            1,
            TIMEOUT_MS,
            """MATCH (state:ScaleState {id: $scaleStateId})-[has:HAS_TRIAD]->(triad:Triad)
RETURN state.id AS scaleStateId, has.degree AS degree,
       has.derivationMethod AS derivationMethod,
       has.harmonicProfileSha256 AS harmonicProfileSha256,
       triad.triadId AS triadId, triad.pitchMask AS pitchMask,
       triad.pitchClasses AS pitchClasses, triad.rootPc AS rootPc,
       triad.intervalSignature AS intervalSignature, triad.quality AS quality,
       triad.recordSha256 AS recordSha256, triad.admissionStatus AS admissionStatus
ORDER BY degree, triadId
LIMIT 7""",
        ),
        "modal_scale_states_by_triad_quality": CourtNamedQuery(
            "modal_scale_states_by_triad_quality",
            ("quality",),
            ("limit",),
            MAX_ROWS,
            1,
            TIMEOUT_MS,
            """MATCH (state:ScaleState)-[has:HAS_TRIAD]->(triad:Triad {quality: $quality})
RETURN state.id AS scaleStateId, has.degree AS degree,
       has.harmonicProfileSha256 AS harmonicProfileSha256,
       triad.triadId AS triadId, triad.quality AS quality,
       triad.recordSha256 AS recordSha256
ORDER BY scaleStateId, degree, triadId
LIMIT $limit""",
        ),
        "modal_scale_states_by_interval_vector": CourtNamedQuery(
            "modal_scale_states_by_interval_vector",
            ("intervalVector",),
            ("limit",),
            MAX_ROWS,
            1,
            TIMEOUT_MS,
            """MATCH (state:ScaleState)-[has:HAS_TRIAD]->(:Triad)
WHERE has.scaleIntervalVector = $intervalVector
WITH DISTINCT state.id AS scaleStateId,
     has.harmonicProfileSha256 AS harmonicProfileSha256
RETURN scaleStateId, harmonicProfileSha256
ORDER BY scaleStateId, harmonicProfileSha256
LIMIT $limit""",
        ),
        "court_filter_commutation_outputs": CourtNamedQuery(
            "court_filter_commutation_outputs",
            ("applicationId",),
            (),
            MAX_ROWS,
            2,
            TIMEOUT_MS,
            """MATCH (application:CourtFilterApplication {applicationId: $applicationId})-[:FILTERS]->(state:ScaleState)
MATCH (application)-[:USES_FILTER]->(filter:CourtFilterOperator)
MATCH (application)-[:YIELDS_ADMITTED_SET]->(yielded:PentatonicSetClass)
OPTIONAL MATCH (application)-[:HAS_COMMUTATION_RESULT]->(commutation:CourtCommutationRecord)
RETURN application.logicalId AS applicationLogicalId,
       application.applicationId AS applicationId,
       state.id AS scaleStateId, filter.filterId AS filterId,
       yielded.setClassId AS yieldedSetClassId,
       yielded.pitchMask AS yieldedPitchMask,
       commutation.commutationId AS commutationId,
       commutation.mutationOperatorId AS mutationOperatorId,
       commutation.result AS commutationResult,
       commutation.routeSemantics AS routeSemantics,
       commutation.ledgerPointer AS ledgerPointer,
       commutation.recordSha256 AS commutationRecordSha256
ORDER BY commutationId, mutationOperatorId
LIMIT 100""",
        ),
    }
)


def normalize_court_query_parameters(
    query_id: str, parameters: Mapping[str, object]
) -> dict[str, object]:
    spec = COURT_QUERY_CATALOG.get(query_id)
    if spec is None:
        raise CourtGraphProjectionError("court_query_not_allow_listed")
    allowed = set(spec.required_parameters) | set(spec.optional_parameters)
    if set(parameters) - allowed:
        raise CourtGraphProjectionError("court_query_parameter_unknown")
    if set(spec.required_parameters) - set(parameters):
        raise CourtGraphProjectionError("court_query_parameter_missing")
    normalized = dict(parameters)
    if "scaleStateId" in normalized:
        value = normalized["scaleStateId"]
        if type(value) is not int or not 0 < value < (1 << 12):
            raise CourtGraphProjectionError("court_query_scale_state_id_invalid")
    if "quality" in normalized and normalized["quality"] not in {
        "major",
        "minor",
        "diminished",
        "augmented",
        "other",
    }:
        raise CourtGraphProjectionError("court_query_quality_invalid")
    if "intervalVector" in normalized:
        vector = normalized["intervalVector"]
        if (
            not isinstance(vector, (list, tuple))
            or len(vector) != 6
            or any(type(value) is not int or value < 0 for value in vector)
        ):
            raise CourtGraphProjectionError("court_query_interval_vector_invalid")
        normalized["intervalVector"] = list(vector)
    if "applicationId" in normalized:
        value = normalized["applicationId"]
        if not isinstance(value, str) or not value:
            raise CourtGraphProjectionError("court_query_application_id_invalid")
    limit = normalized.get("limit", spec.max_rows)
    if type(limit) is not int or not 1 <= limit <= spec.max_rows:
        raise CourtGraphProjectionError("court_query_limit_invalid")
    normalized["limit"] = limit
    return normalized


def execute_court_snapshot_query(
    snapshot: Mapping[str, object],
    query_id: str,
    parameters: Mapping[str, object],
) -> tuple[dict[str, Any], ...]:
    """Reference snapshot provider used to enforce file/Neo4j result parity."""

    params = normalize_court_query_parameters(query_id, parameters)
    nodes = snapshot.get("nodes")
    relationships = snapshot.get("relationships")
    if not isinstance(nodes, list) or not isinstance(relationships, list):
        raise CourtGraphProjectionError("court_query_snapshot_invalid")
    node_by_id = {node["logicalId"]: node for node in nodes}
    if query_id == "degree_triads_for_scale":
        source_id = f"scale-state:{params['scaleStateId']}"
        rows = []
        for edge in relationships:
            if edge["relationshipType"] != "HAS_TRIAD" or edge["sourceLogicalId"] != source_id:
                continue
            triad = node_by_id[edge["targetLogicalId"]]
            props = triad["properties"]
            rel_props = edge["properties"]
            rows.append(
                {
                    "admissionStatus": triad["admissionStatus"],
                    "degree": rel_props["degree"],
                    "derivationMethod": rel_props["derivationMethod"],
                    "harmonicProfileSha256": rel_props["harmonicProfileSha256"],
                    "intervalSignature": props["intervalSignature"],
                    "pitchClasses": props["pitchClasses"],
                    "pitchMask": props["pitchMask"],
                    "quality": props["quality"],
                    "recordSha256": triad["recordSha256"],
                    "rootPc": props["rootPc"],
                    "scaleStateId": params["scaleStateId"],
                    "triadId": props["triadId"],
                }
            )
        rows.sort(key=lambda row: (row["degree"], row["triadId"]))
        return tuple(rows[: COURT_QUERY_CATALOG[query_id].max_rows])
    if query_id == "modal_scale_states_by_triad_quality":
        rows = []
        for edge in relationships:
            if edge["relationshipType"] != "HAS_TRIAD":
                continue
            triad = node_by_id[edge["targetLogicalId"]]
            if triad["properties"]["quality"] != params["quality"]:
                continue
            rel_props = edge["properties"]
            rows.append(
                {
                    "degree": rel_props["degree"],
                    "harmonicProfileSha256": rel_props["harmonicProfileSha256"],
                    "quality": triad["properties"]["quality"],
                    "recordSha256": triad["recordSha256"],
                    "scaleStateId": int(str(edge["sourceLogicalId"]).split(":")[-1]),
                    "triadId": triad["properties"]["triadId"],
                }
            )
        rows.sort(key=lambda row: (row["scaleStateId"], row["degree"], row["triadId"]))
        return tuple(rows[: int(params["limit"])])
    if query_id == "modal_scale_states_by_interval_vector":
        rows_by_key = {}
        for edge in relationships:
            if edge["relationshipType"] != "HAS_TRIAD":
                continue
            rel_props = edge["properties"]
            if rel_props["scaleIntervalVector"] != params["intervalVector"]:
                continue
            row = {
                "harmonicProfileSha256": rel_props["harmonicProfileSha256"],
                "scaleStateId": int(str(edge["sourceLogicalId"]).split(":")[-1]),
            }
            rows_by_key[(row["scaleStateId"], row["harmonicProfileSha256"])] = row
        rows = [rows_by_key[key] for key in sorted(rows_by_key)]
        return tuple(rows[: int(params["limit"])])
    if query_id == "court_filter_commutation_outputs":
        app = next(
            (
                node
                for node in nodes
                if node["label"] == "CourtFilterApplication"
                and node["properties"]["applicationId"] == params["applicationId"]
            ),
            None,
        )
        if app is None:
            return ()
        outgoing = [edge for edge in relationships if edge["sourceLogicalId"] == app["logicalId"]]
        by_type = {}
        for edge in outgoing:
            by_type.setdefault(edge["relationshipType"], []).append(edge)
        state_id = int(by_type["FILTERS"][0]["targetLogicalId"].split(":")[-1])
        filter_node = node_by_id[by_type["USES_FILTER"][0]["targetLogicalId"]]
        yielded = node_by_id[by_type["YIELDS_ADMITTED_SET"][0]["targetLogicalId"]]
        commutation_edges = by_type.get("HAS_COMMUTATION_RESULT", [None])
        rows = []
        for edge in commutation_edges:
            commutation = node_by_id[edge["targetLogicalId"]] if edge else None
            commutation_props = commutation["properties"] if commutation else {}
            rows.append(
                {
                    "applicationId": params["applicationId"],
                    "applicationLogicalId": app["logicalId"],
                    "commutationId": commutation_props.get("commutationId"),
                    "commutationRecordSha256": commutation.get("recordSha256") if commutation else None,
                    "commutationResult": commutation_props.get("result"),
                    "filterId": filter_node["properties"]["filterId"],
                    "ledgerPointer": commutation_props.get("ledgerPointer"),
                    "mutationOperatorId": commutation_props.get("mutationOperatorId"),
                    "routeSemantics": commutation_props.get("routeSemantics"),
                    "scaleStateId": state_id,
                    "yieldedPitchMask": yielded["properties"]["pitchMask"],
                    "yieldedSetClassId": yielded["properties"]["setClassId"],
                }
            )
        rows.sort(key=lambda row: (row["commutationId"] or "", row["mutationOperatorId"] or ""))
        return tuple(rows[: COURT_QUERY_CATALOG[query_id].max_rows])
    raise CourtGraphProjectionError("court_query_not_allow_listed")
