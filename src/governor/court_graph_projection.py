"""Deterministic, authority-free Neo4j projection for Court mathematics."""

from __future__ import annotations

from collections.abc import Iterable, Mapping
from dataclasses import dataclass
from typing import Any

from court_mathematics import HarmonicProfile, PitchClassSet

from .harmonic_models import CourtState
from .hashing import canonical_json_bytes, sha256_payload
from .models import _require_identifier, _require_sha256


COURT_GRAPH_SCHEMA_VERSION = "crt-306.court-graph-projection.v1"
TRIAD_DERIVATION_METHOD = "heptatonic-degree-stack-v1"
FILTER_DERIVATION_METHOD = "linear-diagonal-bit-and-v1"
NODE_LABELS = (
    "CourtCommutationRecord",
    "CourtFilterApplication",
    "CourtFilterOperator",
    "CourtRootedPosition",
    "CourtState",
    "PentatonicSetClass",
    "PoleRegister",
    "Triad",
)
RELATIONSHIP_TYPES = (
    "FILTERS",
    "HAS_COMMUTATION_RESULT",
    "HAS_POLE_REGISTER",
    "HAS_TRIAD",
    "USES_FILTER",
    "YIELDS_ADMITTED_SET",
)
COMMUTATION_RESULTS = frozenset(
    {
        "commutes",
        "does_not_commute",
        "left_undefined",
        "right_undefined",
        "both_undefined",
    }
)
POLE_NAMES = ("Mars", "Jupiter", "Venus", "Saturn")


class CourtGraphProjectionError(ValueError):
    """Stable rejection code for malformed or inconsistent projection inputs."""

    def __init__(self, reason_code: str) -> None:
        super().__init__(reason_code)
        self.reason_code = reason_code


def _identifier(value: str, field: str) -> str:
    try:
        _require_identifier(value, field)
    except (TypeError, ValueError) as error:
        raise CourtGraphProjectionError(str(error)) from error
    return value


def _sha256(value: str, field: str) -> str:
    try:
        _require_sha256(value, field)
    except (TypeError, ValueError) as error:
        raise CourtGraphProjectionError(str(error)) from error
    return value


def _admission(value: str) -> str:
    return _identifier(value, "admission_status")


def _mask(value: int, field: str) -> int:
    if type(value) is not int or not 0 < value < (1 << 12):
        raise CourtGraphProjectionError(f"{field}_must_be_12_bit_nonzero_mask")
    return value


@dataclass(frozen=True, slots=True)
class PentatonicSetClassProjection:
    set_class_id: str
    pitch_mask: int
    source_sha256: str
    admission_status: str

    def __post_init__(self) -> None:
        _identifier(self.set_class_id, "set_class_id")
        _mask(self.pitch_mask, "pentatonic_pitch_mask")
        _sha256(self.source_sha256, "pentatonic_source_sha256")
        _admission(self.admission_status)
        if PitchClassSet(self.pitch_mask).cardinality != 5:
            raise CourtGraphProjectionError("pentatonic_set_must_have_cardinality_five")


@dataclass(frozen=True, slots=True)
class CourtFilterOperatorProjection:
    filter_id: str
    court_mask: int
    source_sha256: str
    admission_status: str
    operator_type: str = "linear_diagonal"

    def __post_init__(self) -> None:
        _identifier(self.filter_id, "filter_id")
        _mask(self.court_mask, "court_filter_mask")
        _sha256(self.source_sha256, "filter_source_sha256")
        _admission(self.admission_status)
        if self.operator_type != "linear_diagonal":
            raise CourtGraphProjectionError("court_filter_operator_type_not_admitted")


@dataclass(frozen=True, slots=True)
class CourtCommutationProjection:
    commutation_id: str
    mutation_operator_id: str
    result: str
    route_semantics: str
    source_sha256: str
    admission_status: str
    ledger_pointer: str | None = None

    def __post_init__(self) -> None:
        _identifier(self.commutation_id, "commutation_id")
        _identifier(self.mutation_operator_id, "mutation_operator_id")
        _identifier(self.route_semantics, "route_semantics")
        _sha256(self.source_sha256, "commutation_source_sha256")
        _admission(self.admission_status)
        if self.result not in COMMUTATION_RESULTS:
            raise CourtGraphProjectionError("commutation_result_invalid")
        if self.ledger_pointer is not None:
            _identifier(self.ledger_pointer, "ledger_pointer")


@dataclass(frozen=True, slots=True)
class CourtFilterApplicationProjection:
    application_id: str
    harmonic_profile_sha256: str
    filter_id: str
    yielded_set_class_id: str
    commutation_ids: tuple[str, ...]
    source_sha256: str
    admission_status: str

    def __post_init__(self) -> None:
        _identifier(self.application_id, "application_id")
        _sha256(self.harmonic_profile_sha256, "application_profile_sha256")
        _identifier(self.filter_id, "application_filter_id")
        _identifier(self.yielded_set_class_id, "yielded_set_class_id")
        _sha256(self.source_sha256, "application_source_sha256")
        _admission(self.admission_status)
        normalized = tuple(sorted(self.commutation_ids))
        if len(set(normalized)) != len(normalized):
            raise CourtGraphProjectionError("application_commutation_id_duplicate")
        for commutation_id in normalized:
            _identifier(commutation_id, "application_commutation_id")
        object.__setattr__(self, "commutation_ids", normalized)


@dataclass(frozen=True, slots=True)
class CourtRootedPositionProjection:
    position_id: str
    set_class_id: str
    pitch_mask: int
    root_pc: int
    source_sha256: str
    admission_status: str

    def __post_init__(self) -> None:
        _identifier(self.position_id, "court_position_id")
        _identifier(self.set_class_id, "court_position_set_class_id")
        _mask(self.pitch_mask, "court_position_pitch_mask")
        if type(self.root_pc) is not int or not 0 <= self.root_pc < 12:
            raise CourtGraphProjectionError("court_position_root_pc_invalid")
        _sha256(self.source_sha256, "court_position_source_sha256")
        _admission(self.admission_status)


@dataclass(frozen=True, slots=True)
class PoleRegisterProjection:
    pole_register_id: str
    owner_label: str
    owner_id: str
    internal_poles: tuple[str, ...]
    source_sha256: str
    admission_status: str

    def __post_init__(self) -> None:
        _identifier(self.pole_register_id, "pole_register_id")
        _identifier(self.owner_id, "pole_register_owner_id")
        _sha256(self.source_sha256, "pole_register_source_sha256")
        _admission(self.admission_status)
        if self.owner_label not in {"CourtRootedPosition", "CourtState"}:
            raise CourtGraphProjectionError("pole_register_owner_label_invalid")
        normalized = tuple(pole for pole in POLE_NAMES if pole in self.internal_poles)
        if len(set(self.internal_poles)) != len(self.internal_poles) or set(
            self.internal_poles
        ) - set(POLE_NAMES):
            raise CourtGraphProjectionError("pole_register_internal_poles_invalid")
        object.__setattr__(self, "internal_poles", normalized)


@dataclass(frozen=True, slots=True)
class CypherIngestionBatch:
    sequence: int
    kind: str
    cypher: str
    parameters: Mapping[str, object]

    def canonical_bytes(self) -> bytes:
        return canonical_json_bytes(
            {
                "cypher": self.cypher,
                "kind": self.kind,
                "parameters": dict(self.parameters),
                "sequence": self.sequence,
            }
        )


def _scale_state_id(profile: HarmonicProfile) -> int:
    prefix = "scale-state:"
    if not profile.subject_id.startswith(prefix):
        raise CourtGraphProjectionError("profile_subject_must_identify_scale_state")
    raw = profile.subject_id[len(prefix) :]
    if not raw.isdigit() or int(raw) != profile.rooted_scale.pitch_set.mask:
        raise CourtGraphProjectionError("profile_scale_state_id_mask_mismatch")
    return int(raw)


def _node(
    label: str,
    logical_id: str,
    properties: Mapping[str, object],
    *,
    admission_status: str,
    source_sha256: str,
) -> dict[str, object]:
    core = {
        "admissionStatus": admission_status,
        "label": label,
        "logicalId": logical_id,
        "properties": dict(properties),
        "sourceSha256": source_sha256,
    }
    return {**core, "recordSha256": sha256_payload(core)}


def _relationship(
    relationship_type: str,
    logical_id: str,
    source_label: str,
    source_logical_id: str,
    target_label: str,
    target_logical_id: str,
    properties: Mapping[str, object],
    *,
    admission_status: str,
    source_sha256: str,
    source_scale_state_id: int | None = None,
) -> dict[str, object]:
    core: dict[str, object] = {
        "admissionStatus": admission_status,
        "logicalId": logical_id,
        "properties": dict(properties),
        "relationshipType": relationship_type,
        "sourceLabel": source_label,
        "sourceLogicalId": source_logical_id,
        "sourceSha256": source_sha256,
        "targetLabel": target_label,
        "targetLogicalId": target_logical_id,
    }
    if source_scale_state_id is not None:
        core["sourceScaleStateId"] = source_scale_state_id
    return {**core, "recordSha256": sha256_payload(core)}


def _append_unique(
    records: dict[str, dict[str, object]], record: dict[str, object], kind: str
) -> None:
    logical_id = str(record["logicalId"])
    existing = records.get(logical_id)
    if existing is not None and existing != record:
        raise CourtGraphProjectionError(f"conflicting_{kind}_logical_id")
    records[logical_id] = record


def build_court_graph_projection(
    harmonic_profiles: Iterable[HarmonicProfile],
    court_states: Iterable[CourtState],
    *,
    filter_operators: Iterable[CourtFilterOperatorProjection] = (),
    pentatonic_set_classes: Iterable[PentatonicSetClassProjection] = (),
    filter_applications: Iterable[CourtFilterApplicationProjection] = (),
    commutation_records: Iterable[CourtCommutationProjection] = (),
    rooted_positions: Iterable[CourtRootedPositionProjection] = (),
    pole_registers: Iterable[PoleRegisterProjection] = (),
    profile_admission_status: str = "canonical",
) -> dict[str, object]:
    """Build a canonical graph snapshot from immutable, fingerprinted inputs."""

    profile_admission_status = _admission(profile_admission_status)
    profiles = tuple(sorted(harmonic_profiles, key=lambda item: item.fingerprint_sha256))
    state_records = tuple(court_states)
    states_by_sha = {item.court_state_sha256: item for item in state_records}
    states = tuple(sorted(state_records, key=lambda item: item.court_state_sha256))
    operator_records = tuple(filter_operators)
    set_class_records = tuple(pentatonic_set_classes)
    commutation_input_records = tuple(commutation_records)
    position_records = tuple(rooted_positions)
    operators = {item.filter_id: item for item in operator_records}
    set_classes = {item.set_class_id: item for item in set_class_records}
    commutations = {item.commutation_id: item for item in commutation_input_records}
    application_records = tuple(filter_applications)
    applications_by_id = {item.application_id: item for item in application_records}
    applications = tuple(sorted(application_records, key=lambda item: item.application_id))
    positions = {item.position_id: item for item in position_records}
    pole_records = tuple(pole_registers)
    poles_by_id = {item.pole_register_id: item for item in pole_records}
    poles = tuple(sorted(pole_records, key=lambda item: item.pole_register_id))

    for collection, supplied, reason in (
        (operators, operator_records, "duplicate_filter_id"),
        (set_classes, set_class_records, "duplicate_set_class_id"),
        (commutations, commutation_input_records, "duplicate_commutation_id"),
        (positions, position_records, "duplicate_court_position_id"),
        (applications_by_id, application_records, "duplicate_filter_application_id"),
        (poles_by_id, pole_records, "duplicate_pole_register_id"),
        (states_by_sha, state_records, "duplicate_court_state_sha256"),
    ):
        if len(collection) != len(supplied):
            raise CourtGraphProjectionError(reason)

    profile_by_sha: dict[str, HarmonicProfile] = {}
    nodes: dict[str, dict[str, object]] = {}
    relationships: dict[str, dict[str, object]] = {}
    scale_state_references: dict[int, dict[str, object]] = {}

    for profile in profiles:
        if type(profile) is not HarmonicProfile or not profile.verify_fingerprint():
            raise CourtGraphProjectionError("harmonic_profile_not_verified")
        if profile.fingerprint_sha256 in profile_by_sha:
            raise CourtGraphProjectionError("duplicate_harmonic_profile_sha256")
        profile_by_sha[profile.fingerprint_sha256] = profile
        scale_state_id = _scale_state_id(profile)
        if scale_state_id in scale_state_references:
            raise CourtGraphProjectionError("duplicate_scale_state_harmonic_profile")
        scale_logical_id = f"scale-state:{scale_state_id}"
        scale_state_references[scale_state_id] = {
            "logicalId": scale_logical_id,
            "scaleStateId": scale_state_id,
        }
        interval_vector = list(profile.rooted_scale.pitch_set.interval_vector)
        for triad in profile.coordinates.h_c.degree_triads:
            triad_id = f"triad:{triad.root_pitch_class}:{triad.pitch_set.mask}"
            triad_properties = {
                "intervalSignature": list(triad.interval_signature),
                "pitchClasses": list(triad.pitch_classes),
                "pitchMask": triad.pitch_set.mask,
                "quality": triad.quality.value,
                "rootPc": triad.root_pitch_class,
                "triadId": triad_id,
            }
            triad_node = _node(
                "Triad",
                triad_id,
                triad_properties,
                admission_status=profile_admission_status,
                source_sha256=sha256_payload(
                    {
                        "derivationMethod": TRIAD_DERIVATION_METHOD,
                        **triad_properties,
                    }
                ),
            )
            _append_unique(nodes, triad_node, "node")
            edge = _relationship(
                "HAS_TRIAD",
                f"has-triad:{profile.fingerprint_sha256}:{triad.degree}",
                "ScaleState",
                scale_logical_id,
                "Triad",
                triad_id,
                {
                    "degree": triad.degree,
                    "derivationMethod": TRIAD_DERIVATION_METHOD,
                    "harmonicProfileSha256": profile.fingerprint_sha256,
                    "scaleIntervalVector": interval_vector,
                },
                admission_status=profile_admission_status,
                source_sha256=profile.source_sha256,
                source_scale_state_id=scale_state_id,
            )
            _append_unique(relationships, edge, "relationship")

    for state in states:
        if type(state) is not CourtState:
            raise CourtGraphProjectionError("court_state_must_be_court_state")
        if state.harmonic_profile_sha256 not in profile_by_sha:
            raise CourtGraphProjectionError("court_state_profile_not_projected")
        logical_id = f"court-state:{state.court_state_sha256}"
        state_node = _node(
            "CourtState",
            logical_id,
            {
                "courtPolicySha256": state.court_policy_sha256,
                "courtPositionId": state.court_position_id,
                "courtStateSha256": state.court_state_sha256,
                "eventCount": state.ledger_anchor.event_count,
                "harmonicProfileSha256": state.harmonic_profile_sha256,
                "ledgerHeadSha256": state.ledger_anchor.head_sha256,
                "revision": state.revision,
            },
            admission_status="runtime",
            source_sha256=state.court_state_sha256,
        )
        _append_unique(nodes, state_node, "node")

    for set_class in sorted(set_classes.values(), key=lambda item: item.set_class_id):
        pitch_set = PitchClassSet(set_class.pitch_mask)
        set_node = _node(
            "PentatonicSetClass",
            f"pentatonic-set-class:{set_class.set_class_id}",
            {
                "intervalVector": list(pitch_set.interval_vector),
                "pitchClasses": list(pitch_set.pitch_classes),
                "pitchMask": pitch_set.mask,
                "setClassId": set_class.set_class_id,
            },
            admission_status=set_class.admission_status,
            source_sha256=set_class.source_sha256,
        )
        _append_unique(nodes, set_node, "node")

    for operator in sorted(operators.values(), key=lambda item: item.filter_id):
        filter_node = _node(
            "CourtFilterOperator",
            f"court-filter:{operator.filter_id}",
            {
                "courtMask": operator.court_mask,
                "filterId": operator.filter_id,
                "idempotent": True,
                "inverse": "none",
                "operatorType": operator.operator_type,
            },
            admission_status=operator.admission_status,
            source_sha256=operator.source_sha256,
        )
        _append_unique(nodes, filter_node, "node")

    for commutation in sorted(commutations.values(), key=lambda item: item.commutation_id):
        commutation_node = _node(
            "CourtCommutationRecord",
            f"court-commutation:{commutation.commutation_id}",
            {
                "commutationId": commutation.commutation_id,
                "ledgerPointer": commutation.ledger_pointer,
                "mutationOperatorId": commutation.mutation_operator_id,
                "result": commutation.result,
                "routeSemantics": commutation.route_semantics,
            },
            admission_status=commutation.admission_status,
            source_sha256=commutation.source_sha256,
        )
        _append_unique(nodes, commutation_node, "node")

    for position in sorted(positions.values(), key=lambda item: item.position_id):
        set_class = set_classes.get(position.set_class_id)
        if set_class is None or set_class.pitch_mask != position.pitch_mask:
            raise CourtGraphProjectionError("court_position_set_class_mismatch")
        position_node = _node(
            "CourtRootedPosition",
            f"court-position:{position.position_id}",
            {
                "pitchClasses": list(PitchClassSet(position.pitch_mask).pitch_classes),
                "pitchMask": position.pitch_mask,
                "positionId": position.position_id,
                "rootPc": position.root_pc,
                "setClassId": position.set_class_id,
            },
            admission_status=position.admission_status,
            source_sha256=position.source_sha256,
        )
        _append_unique(nodes, position_node, "node")

    for application in applications:
        profile = profile_by_sha.get(application.harmonic_profile_sha256)
        operator = operators.get(application.filter_id)
        yielded = set_classes.get(application.yielded_set_class_id)
        if profile is None:
            raise CourtGraphProjectionError("filter_application_profile_missing")
        if operator is None:
            raise CourtGraphProjectionError("filter_application_operator_missing")
        if yielded is None:
            raise CourtGraphProjectionError("filter_application_yield_missing")
        result_mask = profile.rooted_scale.pitch_set.mask & operator.court_mask
        if result_mask != yielded.pitch_mask:
            raise CourtGraphProjectionError("filter_application_result_mask_mismatch")
        missing_commutations = set(application.commutation_ids) - set(commutations)
        if missing_commutations:
            raise CourtGraphProjectionError("filter_application_commutation_missing")
        scale_state_id = _scale_state_id(profile)
        application_logical_id = f"court-filter-application:{application.application_id}"
        source_pitch_classes = set(profile.rooted_scale.pitch_set.pitch_classes)
        result_pitch_classes = set(PitchClassSet(result_mask).pitch_classes)
        app_node = _node(
            "CourtFilterApplication",
            application_logical_id,
            {
                "applicationId": application.application_id,
                "derivationMethod": FILTER_DERIVATION_METHOD,
                "harmonicProfileSha256": profile.fingerprint_sha256,
                "resultMask": result_mask,
                "retainedPitchClasses": sorted(result_pitch_classes),
                "sourceMask": profile.rooted_scale.pitch_set.mask,
                "suppressedPitchClasses": sorted(source_pitch_classes - result_pitch_classes),
            },
            admission_status=application.admission_status,
            source_sha256=application.source_sha256,
        )
        _append_unique(nodes, app_node, "node")
        edges = (
            _relationship(
                "FILTERS",
                f"filters:{application.application_id}:{scale_state_id}",
                "CourtFilterApplication",
                application_logical_id,
                "ScaleState",
                f"scale-state:{scale_state_id}",
                {"harmonicProfileSha256": profile.fingerprint_sha256},
                admission_status=application.admission_status,
                source_sha256=application.source_sha256,
            ),
            _relationship(
                "USES_FILTER",
                f"uses-filter:{application.application_id}:{application.filter_id}",
                "CourtFilterApplication",
                application_logical_id,
                "CourtFilterOperator",
                f"court-filter:{application.filter_id}",
                {"derivationMethod": FILTER_DERIVATION_METHOD},
                admission_status=application.admission_status,
                source_sha256=application.source_sha256,
            ),
            _relationship(
                "YIELDS_ADMITTED_SET",
                f"yields-set:{application.application_id}:{application.yielded_set_class_id}",
                "CourtFilterApplication",
                application_logical_id,
                "PentatonicSetClass",
                f"pentatonic-set-class:{application.yielded_set_class_id}",
                {"resultMask": result_mask},
                admission_status=application.admission_status,
                source_sha256=application.source_sha256,
            ),
        )
        for edge in edges:
            _append_unique(relationships, edge, "relationship")
        for commutation_id in application.commutation_ids:
            edge = _relationship(
                "HAS_COMMUTATION_RESULT",
                f"has-commutation:{application.application_id}:{commutation_id}",
                "CourtFilterApplication",
                application_logical_id,
                "CourtCommutationRecord",
                f"court-commutation:{commutation_id}",
                {},
                admission_status=application.admission_status,
                source_sha256=application.source_sha256,
            )
            _append_unique(relationships, edge, "relationship")

    state_ids = {state.court_state_sha256 for state in states}
    for pole in poles:
        if pole.owner_label == "CourtState":
            if pole.owner_id not in state_ids:
                raise CourtGraphProjectionError("pole_register_court_state_missing")
            owner_logical_id = f"court-state:{pole.owner_id}"
        else:
            if pole.owner_id not in positions:
                raise CourtGraphProjectionError("pole_register_position_missing")
            owner_logical_id = f"court-position:{pole.owner_id}"
        vector = [1 if name in pole.internal_poles else 0 for name in POLE_NAMES]
        pole_node = _node(
            "PoleRegister",
            f"pole-register:{pole.pole_register_id}",
            {
                "internalPoles": list(pole.internal_poles),
                "poleOrder": list(POLE_NAMES),
                "poleRegisterId": pole.pole_register_id,
                "vector": vector,
            },
            admission_status=pole.admission_status,
            source_sha256=pole.source_sha256,
        )
        _append_unique(nodes, pole_node, "node")
        edge = _relationship(
            "HAS_POLE_REGISTER",
            f"has-pole-register:{pole.owner_label}:{pole.owner_id}:{pole.pole_register_id}",
            pole.owner_label,
            owner_logical_id,
            "PoleRegister",
            f"pole-register:{pole.pole_register_id}",
            {},
            admission_status=pole.admission_status,
            source_sha256=pole.source_sha256,
        )
        _append_unique(relationships, edge, "relationship")

    sorted_nodes = sorted(nodes.values(), key=lambda item: str(item["logicalId"]))
    sorted_relationships = sorted(
        relationships.values(), key=lambda item: str(item["logicalId"])
    )
    source_fingerprints = sorted(
        {
            str(record["sourceSha256"])
            for record in (*sorted_nodes, *sorted_relationships)
        }
    )
    core: dict[str, object] = {
        "counts": {
            "nodeCount": len(sorted_nodes),
            "relationshipCount": len(sorted_relationships),
            "scaleStateReferenceCount": len(scale_state_references),
        },
        "nodes": sorted_nodes,
        "relationships": sorted_relationships,
        "scaleStateReferences": [
            scale_state_references[key] for key in sorted(scale_state_references)
        ],
        "schemaVersion": COURT_GRAPH_SCHEMA_VERSION,
        "sourceFingerprints": source_fingerprints,
    }
    return {**core, "projectionFingerprint": sha256_payload(core)}


def verify_court_graph_projection(snapshot: Mapping[str, object]) -> bool:
    if snapshot.get("schemaVersion") != COURT_GRAPH_SCHEMA_VERSION:
        return False
    core = {key: value for key, value in snapshot.items() if key != "projectionFingerprint"}
    if sha256_payload(core) != snapshot.get("projectionFingerprint"):
        return False
    nodes = snapshot.get("nodes")
    relationships = snapshot.get("relationships")
    references = snapshot.get("scaleStateReferences")
    counts = snapshot.get("counts")
    source_fingerprints = snapshot.get("sourceFingerprints")
    if (
        not isinstance(nodes, list)
        or not isinstance(relationships, list)
        or not isinstance(references, list)
        or not isinstance(counts, Mapping)
        or not isinstance(source_fingerprints, list)
    ):
        return False
    if counts != {
        "nodeCount": len(nodes),
        "relationshipCount": len(relationships),
        "scaleStateReferenceCount": len(references),
    }:
        return False
    if any(not isinstance(record, Mapping) for record in (*nodes, *relationships, *references)):
        return False
    node_ids = [record.get("logicalId") for record in nodes]
    reference_ids = [record.get("logicalId") for record in references]
    relationship_ids = [record.get("logicalId") for record in relationships]
    for reference in references:
        scale_state_id = reference.get("scaleStateId")
        if (
            type(scale_state_id) is not int
            or reference.get("logicalId") != f"scale-state:{scale_state_id}"
        ):
            return False
    expected_reference_ids = [
        reference["logicalId"]
        for reference in sorted(references, key=lambda item: item["scaleStateId"])
    ]
    if (
        any(
            not isinstance(value, str)
            for value in (*node_ids, *reference_ids, *relationship_ids)
        )
        or len(set(node_ids)) != len(nodes)
        or len(set(reference_ids)) != len(references)
        or len(set(relationship_ids)) != len(relationships)
        or node_ids != sorted(node_ids)
        or relationship_ids != sorted(relationship_ids)
        or reference_ids != expected_reference_ids
        or any(not isinstance(value, str) for value in source_fingerprints)
        or source_fingerprints != sorted(set(source_fingerprints))
    ):
        return False
    node_id_set = set(node_ids)
    reference_id_set = set(reference_ids)
    node_label_by_id: dict[object, object] = {}
    node_by_id: dict[object, Mapping[str, object]] = {}
    for record in nodes:
        label = record.get("label")
        if label not in NODE_LABELS:
            return False
        properties = record.get("properties")
        if not isinstance(properties, Mapping):
            return False
        if label == "CourtFilterOperator" and (
            properties.get("operatorType") != "linear_diagonal"
            or properties.get("idempotent") is not True
            or properties.get("inverse") != "none"
            or type(properties.get("courtMask")) is not int
        ):
            return False
        if label == "PentatonicSetClass":
            pitch_mask = properties.get("pitchMask")
            if (
                type(pitch_mask) is not int
                or pitch_mask.bit_count() != 5
                or not isinstance(properties.get("pitchClasses"), list)
                or len(properties["pitchClasses"]) != 5
                or not isinstance(properties.get("intervalVector"), list)
                or len(properties["intervalVector"]) != 6
            ):
                return False
        if label == "CourtCommutationRecord" and properties.get(
            "result"
        ) not in COMMUTATION_RESULTS:
            return False
        node_label_by_id[record.get("logicalId")] = label
        node_by_id[record.get("logicalId")] = record
        record_core = {key: value for key, value in record.items() if key != "recordSha256"}
        if sha256_payload(record_core) != record.get("recordSha256"):
            return False
    triad_groups: dict[tuple[object, object], set[object]] = {}
    triad_group_counts: dict[tuple[object, object], int] = {}
    application_relationships: dict[object, dict[object, int]] = {}
    application_edges: dict[object, dict[object, list[Mapping[str, object]]]] = {}
    pole_owner_counts: dict[object, int] = {}
    used_reference_ids: set[object] = set()
    for record in relationships:
        if record.get("relationshipType") not in RELATIONSHIP_TYPES:
            return False
        if not isinstance(record.get("properties"), Mapping):
            return False
        record_core = {key: value for key, value in record.items() if key != "recordSha256"}
        if sha256_payload(record_core) != record.get("recordSha256"):
            return False
        if record.get("sourceLogicalId") not in node_id_set | reference_id_set:
            return False
        if record.get("targetLogicalId") not in node_id_set | reference_id_set:
            return False
        if record.get("sourceLogicalId") in reference_id_set:
            used_reference_ids.add(record.get("sourceLogicalId"))
        if record.get("targetLogicalId") in reference_id_set:
            used_reference_ids.add(record.get("targetLogicalId"))
        relationship_type = record.get("relationshipType")
        actual_source_label = (
            "ScaleState"
            if record.get("sourceLogicalId") in reference_id_set
            else node_label_by_id.get(record.get("sourceLogicalId"))
        )
        actual_target_label = (
            "ScaleState"
            if record.get("targetLogicalId") in reference_id_set
            else node_label_by_id.get(record.get("targetLogicalId"))
        )
        if (
            record.get("sourceLabel") != actual_source_label
            or record.get("targetLabel") != actual_target_label
        ):
            return False
        expected_endpoints = {
            "FILTERS": ("CourtFilterApplication", "ScaleState"),
            "HAS_COMMUTATION_RESULT": (
                "CourtFilterApplication",
                "CourtCommutationRecord",
            ),
            "USES_FILTER": ("CourtFilterApplication", "CourtFilterOperator"),
            "YIELDS_ADMITTED_SET": (
                "CourtFilterApplication",
                "PentatonicSetClass",
            ),
        }
        if relationship_type in expected_endpoints and (
            record.get("sourceLabel"), record.get("targetLabel")
        ) != expected_endpoints[relationship_type]:
            return False
        if relationship_type == "HAS_TRIAD":
            if record.get("sourceLabel") != "ScaleState" or record.get("targetLabel") != "Triad":
                return False
            properties = record["properties"]
            if record.get("sourceScaleStateId") != int(
                str(record.get("sourceLogicalId")).removeprefix("scale-state:")
            ):
                return False
            key = (record.get("sourceLogicalId"), properties.get("harmonicProfileSha256"))
            triad_groups.setdefault(key, set()).add(properties.get("degree"))
            triad_group_counts[key] = triad_group_counts.get(key, 0) + 1
        if relationship_type in {
            "FILTERS",
            "HAS_COMMUTATION_RESULT",
            "USES_FILTER",
            "YIELDS_ADMITTED_SET",
        }:
            counts_by_type = application_relationships.setdefault(
                record.get("sourceLogicalId"), {}
            )
            counts_by_type[relationship_type] = counts_by_type.get(relationship_type, 0) + 1
            application_edges.setdefault(record.get("sourceLogicalId"), {}).setdefault(
                relationship_type, []
            ).append(record)
        if relationship_type == "HAS_POLE_REGISTER" and (
            record.get("sourceLabel") not in {"CourtRootedPosition", "CourtState"}
            or record.get("targetLabel") != "PoleRegister"
        ):
            return False
        if relationship_type == "HAS_POLE_REGISTER":
            target_id = record.get("targetLogicalId")
            pole_owner_counts[target_id] = pole_owner_counts.get(target_id, 0) + 1
    if any(
        degrees != set(range(1, 8)) or triad_group_counts.get(key) != 7
        for key, degrees in triad_groups.items()
    ):
        return False
    triad_sources = [key[0] for key in triad_groups]
    if len(set(triad_sources)) != len(triad_sources):
        return False
    if used_reference_ids != reference_id_set:
        return False
    required_application_edges = {"FILTERS", "USES_FILTER", "YIELDS_ADMITTED_SET"}
    application_node_ids = {
        logical_id
        for logical_id, label in node_label_by_id.items()
        if label == "CourtFilterApplication"
    }
    if set(application_relationships) != application_node_ids or any(
        any(counts.get(relationship_type) != 1 for relationship_type in required_application_edges)
        for counts in application_relationships.values()
    ):
        return False
    for application_id in application_node_ids:
        application = node_by_id[application_id]
        application_properties = application["properties"]
        edges = application_edges[application_id]
        filters_edge = edges["FILTERS"][0]
        uses_edge = edges["USES_FILTER"][0]
        yields_edge = edges["YIELDS_ADMITTED_SET"][0]
        operator = node_by_id[uses_edge["targetLogicalId"]]
        yielded = node_by_id[yields_edge["targetLogicalId"]]
        operator_properties = operator["properties"]
        yielded_properties = yielded["properties"]
        source_mask = application_properties.get("sourceMask")
        court_mask = operator_properties.get("courtMask")
        result_mask = application_properties.get("resultMask")
        if (
            type(source_mask) is not int
            or type(court_mask) is not int
            or type(result_mask) is not int
            or result_mask != source_mask & court_mask
            or result_mask != yielded_properties.get("pitchMask")
            or result_mask.bit_count() != 5
            or filters_edge["targetLogicalId"] != f"scale-state:{source_mask}"
            or filters_edge["properties"].get("harmonicProfileSha256")
            != application_properties.get("harmonicProfileSha256")
            or uses_edge["properties"].get("derivationMethod")
            != FILTER_DERIVATION_METHOD
            or yields_edge["properties"].get("resultMask") != result_mask
            or operator_properties.get("operatorType") != "linear_diagonal"
            or operator_properties.get("idempotent") is not True
            or operator_properties.get("inverse") != "none"
        ):
            return False
        for commutation_edge in edges.get("HAS_COMMUTATION_RESULT", []):
            commutation = node_by_id[commutation_edge["targetLogicalId"]]
            if commutation["properties"].get("result") not in COMMUTATION_RESULTS:
                return False
    pole_node_ids = {
        logical_id
        for logical_id, label in node_label_by_id.items()
        if label == "PoleRegister"
    }
    if set(pole_owner_counts) != pole_node_ids or any(
        count != 1 for count in pole_owner_counts.values()
    ):
        return False
    source_values = {record.get("sourceSha256") for record in (*nodes, *relationships)}
    if any(not isinstance(value, str) for value in source_values):
        return False
    actual_source_fingerprints = sorted(source_values)
    if source_fingerprints != actual_source_fingerprints:
        return False
    return True


def serialize_court_graph_projection(snapshot: Mapping[str, object]) -> bytes:
    if not verify_court_graph_projection(snapshot):
        raise CourtGraphProjectionError("court_graph_projection_invalid")
    return canonical_json_bytes(snapshot)


_NODE_INGEST = {
    label: f"""UNWIND $records AS record
MERGE (n:{label} {{logicalId: record.logicalId}})
SET n = record.properties
SET n.logicalId = record.logicalId,
    n.recordSha256 = record.recordSha256,
    n.sourceSha256 = record.sourceSha256,
    n.admissionStatus = record.admissionStatus,
    n.projectionFingerprint = $projectionFingerprint"""
    for label in NODE_LABELS
}

_RELATIONSHIP_INGEST = {
    "HAS_TRIAD": """UNWIND $records AS record
MATCH (source:ScaleState {id: record.sourceScaleStateId})
MATCH (target:Triad {logicalId: record.targetLogicalId})
MERGE (source)-[r:HAS_TRIAD {logicalId: record.logicalId}]->(target)
SET r = record.properties
SET r.logicalId = record.logicalId, r.recordSha256 = record.recordSha256,
    r.sourceSha256 = record.sourceSha256, r.admissionStatus = record.admissionStatus,
    r.projectionFingerprint = $projectionFingerprint""",
    "FILTERS": """UNWIND $records AS record
MATCH (source:CourtFilterApplication {logicalId: record.sourceLogicalId})
MATCH (target:ScaleState {id: record.targetScaleStateId})
MERGE (source)-[r:FILTERS {logicalId: record.logicalId}]->(target)
SET r = record.properties
SET r.logicalId = record.logicalId, r.recordSha256 = record.recordSha256,
    r.sourceSha256 = record.sourceSha256, r.admissionStatus = record.admissionStatus,
    r.projectionFingerprint = $projectionFingerprint""",
    "USES_FILTER": """UNWIND $records AS record
MATCH (source:CourtFilterApplication {logicalId: record.sourceLogicalId})
MATCH (target:CourtFilterOperator {logicalId: record.targetLogicalId})
MERGE (source)-[r:USES_FILTER {logicalId: record.logicalId}]->(target)
SET r = record.properties
SET r.logicalId = record.logicalId, r.recordSha256 = record.recordSha256,
    r.sourceSha256 = record.sourceSha256, r.admissionStatus = record.admissionStatus,
    r.projectionFingerprint = $projectionFingerprint""",
    "YIELDS_ADMITTED_SET": """UNWIND $records AS record
MATCH (source:CourtFilterApplication {logicalId: record.sourceLogicalId})
MATCH (target:PentatonicSetClass {logicalId: record.targetLogicalId})
MERGE (source)-[r:YIELDS_ADMITTED_SET {logicalId: record.logicalId}]->(target)
SET r = record.properties
SET r.logicalId = record.logicalId, r.recordSha256 = record.recordSha256,
    r.sourceSha256 = record.sourceSha256, r.admissionStatus = record.admissionStatus,
    r.projectionFingerprint = $projectionFingerprint""",
    "HAS_COMMUTATION_RESULT": """UNWIND $records AS record
MATCH (source:CourtFilterApplication {logicalId: record.sourceLogicalId})
MATCH (target:CourtCommutationRecord {logicalId: record.targetLogicalId})
MERGE (source)-[r:HAS_COMMUTATION_RESULT {logicalId: record.logicalId}]->(target)
SET r = record.properties
SET r.logicalId = record.logicalId, r.recordSha256 = record.recordSha256,
    r.sourceSha256 = record.sourceSha256, r.admissionStatus = record.admissionStatus,
    r.projectionFingerprint = $projectionFingerprint""",
    "HAS_POLE_REGISTER": """UNWIND $records AS record
CALL (record) {
  WITH record WHERE record.sourceLabel = 'CourtState'
  MATCH (owner:CourtState {logicalId: record.sourceLogicalId}) RETURN owner
  UNION
  WITH record WHERE record.sourceLabel = 'CourtRootedPosition'
  MATCH (owner:CourtRootedPosition {logicalId: record.sourceLogicalId}) RETURN owner
}
MATCH (target:PoleRegister {logicalId: record.targetLogicalId})
MERGE (owner)-[r:HAS_POLE_REGISTER {logicalId: record.logicalId}]->(target)
SET r = record.properties
SET r.logicalId = record.logicalId, r.recordSha256 = record.recordSha256,
    r.sourceSha256 = record.sourceSha256, r.admissionStatus = record.admissionStatus,
    r.projectionFingerprint = $projectionFingerprint""",
}


def iter_cypher_ingestion_batches(
    snapshot: Mapping[str, object], *, batch_size: int = 100
) -> tuple[CypherIngestionBatch, ...]:
    """Yield stable, parameterized MERGE batches in dependency order."""

    if not verify_court_graph_projection(snapshot):
        raise CourtGraphProjectionError("court_graph_projection_invalid")
    if type(batch_size) is not int or not 1 <= batch_size <= 1000:
        raise CourtGraphProjectionError("court_graph_batch_size_invalid")
    projection_fingerprint = str(snapshot["projectionFingerprint"])
    nodes = snapshot["nodes"]
    relationships = snapshot["relationships"]
    assert isinstance(nodes, list) and isinstance(relationships, list)
    batches: list[CypherIngestionBatch] = []

    def append_group(kind: str, cypher: str, records: list[dict[str, object]]) -> None:
        for offset in range(0, len(records), batch_size):
            batch_records = records[offset : offset + batch_size]
            batches.append(
                CypherIngestionBatch(
                    sequence=len(batches) + 1,
                    kind=kind,
                    cypher=cypher,
                    parameters={
                        "projectionFingerprint": projection_fingerprint,
                        "records": batch_records,
                    },
                )
            )

    references = snapshot["scaleStateReferences"]
    assert isinstance(references, list)
    append_group(
        "references:ScaleState",
        """UNWIND $records AS record
MERGE (n:ScaleState {id: record.scaleStateId})""",
        [dict(record) for record in references],
    )
    for label in NODE_LABELS:
        records = [dict(record) for record in nodes if record.get("label") == label]
        append_group(f"nodes:{label}", _NODE_INGEST[label], records)
    for relationship_type in RELATIONSHIP_TYPES:
        records = [
            dict(record)
            for record in relationships
            if record.get("relationshipType") == relationship_type
        ]
        if relationship_type == "FILTERS":
            for record in records:
                target = str(record["targetLogicalId"])
                record["targetScaleStateId"] = int(target.removeprefix("scale-state:"))
        append_group(
            f"relationships:{relationship_type}",
            _RELATIONSHIP_INGEST[relationship_type],
            records,
        )
    return tuple(batches)
