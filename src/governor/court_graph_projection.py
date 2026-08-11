"""Deterministic, authority-free Neo4j projection for Court mathematics."""

from __future__ import annotations

from collections.abc import Iterable, Mapping
from dataclasses import dataclass
from typing import Any

from court_mathematics import HarmonicProfile, PitchClassSet

from .court_runtime import CourtRuntimeState, replay_court_runtime_ledger
from .hashing import canonical_json_bytes, sha256_payload
from .models import LedgerAnchor, LedgerEvent, _require_identifier, _require_sha256, thaw_json


COURT_GRAPH_SCHEMA_VERSION = "crt-306.court-graph-projection.v2"
TRIAD_DERIVATION_METHOD = "heptatonic-degree-stack-v1"
FILTER_DERIVATION_METHOD = "linear-diagonal-bit-and-v1"
CRT304_FINGERPRINT = "40bd74397ff9f4c8c0f0b845630e008cea66c9495413195c1e1c92ff02968589"
CRT304_TRANSLOCATION_ROUTE_SEMANTICS = "mutation_then_filter_only"
_GENESIS_SHA256 = "0" * 64
NODE_LABELS = (
    "CourtCommutationRecord",
    "CourtFilterApplication",
    "CourtFilterOperator",
    "CourtLedgerSnapshot",
    "CourtRootedPosition",
    "CourtRuntimeSession",
    "CourtState",
    "CourtTransitionEvent",
    "PentatonicSetClass",
    "PoleRegister",
    "TopologicalTranslocationRecord",
    "Triad",
)
RELATIONSHIP_TYPES = (
    "FILTERS",
    "HAS_COMMUTATION_RESULT",
    "HAS_LEDGER_SNAPSHOT",
    "HAS_POLE_REGISTER",
    "HAS_TRANSITION_EVENT",
    "HAS_TRANSLOCATION",
    "HAS_TRIAD",
    "SNAPSHOTS_STATE",
    "USES_FILTER",
    "USES_ROUTE_RECORD",
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
_FORBIDDEN_AUTHORITY_KEYS = frozenset(
    {
        "aspectprimarygovernor",
        "canonicalheptatonictopology",
        "degreegovernor",
        "hasgovernorseat",
        "mutationdegreegovernor",
        "office",
        "officeevidence",
        "officeindex",
        "operationalgovernor",
        "primarygovernor",
        "relationaloffice",
        "runtimeoperationalgovernor",
        "scalestatehasgovernorseat",
        "scalestateoffice",
        "scalestateofficeindex",
        "topologyofficeevidence",
    }
)


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


def _contains_forbidden_authority_key(value: object) -> bool:
    if isinstance(value, Mapping):
        for key, item in value.items():
            normalized = "".join(
                character for character in str(key).casefold() if character.isalnum()
            )
            if normalized in _FORBIDDEN_AUTHORITY_KEYS or _contains_forbidden_authority_key(item):
                return True
    elif isinstance(value, (list, tuple)):
        return any(_contains_forbidden_authority_key(item) for item in value)
    return False


def _is_sha256_value(value: object) -> bool:
    return (
        isinstance(value, str)
        and len(value) == 64
        and all(character in "0123456789abcdef" for character in value)
    )


def _is_verified_evidence_ids(value: object) -> bool:
    return (
        isinstance(value, list)
        and bool(value)
        and value == sorted(value)
        and len(value) == len(set(value))
        and all(_is_sha256_value(item) and item != _GENESIS_SHA256 for item in value)
    )


@dataclass(frozen=True, slots=True)
class VerifiedCourtRuntimeSessionProjection:
    """The only admitted runtime input: CRT-305 genesis, events, and trusted anchor."""

    genesis: CourtRuntimeState
    events: tuple[LedgerEvent, ...]
    trusted_anchor: LedgerAnchor

    def __post_init__(self) -> None:
        if type(self.genesis) is not CourtRuntimeState:
            raise CourtGraphProjectionError("runtime_session_genesis_invalid")
        if type(self.events) is not tuple or any(type(event) is not LedgerEvent for event in self.events):
            raise CourtGraphProjectionError("runtime_session_events_invalid")
        if type(self.trusted_anchor) is not LedgerAnchor:
            raise CourtGraphProjectionError("runtime_session_anchor_invalid")


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
            raise CourtGraphProjectionError("static_commutation_ledger_pointer_forbidden")


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
        if self.owner_label != "CourtRootedPosition":
            raise CourtGraphProjectionError("pole_register_runtime_owner_forbidden")
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
    if logical_id in records:
        raise CourtGraphProjectionError(f"duplicate_{kind}_logical_id")
    records[logical_id] = record


def _unique_by(items: tuple[Any, ...], attribute: str, reason: str) -> dict[str, Any]:
    result = {str(getattr(item, attribute)): item for item in items}
    if len(result) != len(items):
        raise CourtGraphProjectionError(reason)
    return result


def build_court_graph_projection(
    harmonic_profiles: Iterable[HarmonicProfile],
    runtime_sessions: Iterable[VerifiedCourtRuntimeSessionProjection],
    *,
    filter_operators: Iterable[CourtFilterOperatorProjection] = (),
    pentatonic_set_classes: Iterable[PentatonicSetClassProjection] = (),
    filter_applications: Iterable[CourtFilterApplicationProjection] = (),
    commutation_records: Iterable[CourtCommutationProjection] = (),
    rooted_positions: Iterable[CourtRootedPositionProjection] = (),
    pole_registers: Iterable[PoleRegisterProjection] = (),
    profile_admission_status: str = "canonical",
) -> dict[str, object]:
    """Build a canonical graph snapshot after independently replaying every session."""

    profile_admission_status = _admission(profile_admission_status)
    profiles = tuple(sorted(harmonic_profiles, key=lambda item: item.fingerprint_sha256))
    session_inputs = tuple(runtime_sessions)
    if any(type(item) is not VerifiedCourtRuntimeSessionProjection for item in session_inputs):
        raise CourtGraphProjectionError("runtime_session_projection_input_invalid")
    session_ids = [item.genesis.session_id for item in session_inputs]
    if len(set(session_ids)) != len(session_ids):
        raise CourtGraphProjectionError("duplicate_runtime_session_id")
    sessions = tuple(sorted(session_inputs, key=lambda item: item.genesis.session_id))
    replayed_sessions = []
    for runtime_input in sessions:
        replay = replay_court_runtime_ledger(
            runtime_input.genesis, runtime_input.events, runtime_input.trusted_anchor
        )
        if not replay.valid or replay.snapshot is None:
            raise CourtGraphProjectionError(f"runtime_session_replay_invalid:{replay.reason_code}")
        replayed_sessions.append((runtime_input, replay))

    operator_records = tuple(filter_operators)
    set_class_records = tuple(pentatonic_set_classes)
    commutation_input_records = tuple(commutation_records)
    application_records = tuple(filter_applications)
    position_records = tuple(rooted_positions)
    pole_records = tuple(pole_registers)
    operators = _unique_by(operator_records, "filter_id", "duplicate_filter_id")
    set_classes = _unique_by(set_class_records, "set_class_id", "duplicate_set_class_id")
    commutations = _unique_by(
        commutation_input_records, "commutation_id", "duplicate_commutation_id"
    )
    applications_by_id = _unique_by(
        application_records, "application_id", "duplicate_filter_application_id"
    )
    positions = _unique_by(position_records, "position_id", "duplicate_court_position_id")
    poles_by_id = _unique_by(pole_records, "pole_register_id", "duplicate_pole_register_id")

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
            properties = {
                "intervalSignature": list(triad.interval_signature),
                "pitchClasses": list(triad.pitch_classes),
                "pitchMask": triad.pitch_set.mask,
                "quality": triad.quality.value,
                "rootPc": triad.root_pitch_class,
                "triadId": triad_id,
            }
            _append_unique(
                nodes,
                _node(
                    "Triad",
                    triad_id,
                    properties,
                    admission_status=profile_admission_status,
                    source_sha256=sha256_payload(
                        {"derivationMethod": TRIAD_DERIVATION_METHOD, **properties}
                    ),
                ),
                "node",
            )
            _append_unique(
                relationships,
                _relationship(
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
                ),
                "relationship",
            )

    for set_class in sorted(set_classes.values(), key=lambda item: item.set_class_id):
        pitch_set = PitchClassSet(set_class.pitch_mask)
        _append_unique(
            nodes,
            _node(
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
            ),
            "node",
        )

    for operator in sorted(operators.values(), key=lambda item: item.filter_id):
        _append_unique(
            nodes,
            _node(
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
            ),
            "node",
        )

    for commutation in sorted(commutations.values(), key=lambda item: item.commutation_id):
        _append_unique(
            nodes,
            _node(
                "CourtCommutationRecord",
                f"court-commutation:{commutation.commutation_id}",
                {
                    "commutationId": commutation.commutation_id,
                    "ledgerPointer": None,
                    "mutationOperatorId": commutation.mutation_operator_id,
                    "result": commutation.result,
                    "routeSemantics": commutation.route_semantics,
                },
                admission_status=commutation.admission_status,
                source_sha256=commutation.source_sha256,
            ),
            "node",
        )

    for position in sorted(positions.values(), key=lambda item: item.position_id):
        set_class = set_classes.get(position.set_class_id)
        if set_class is None or set_class.pitch_mask != position.pitch_mask:
            raise CourtGraphProjectionError("court_position_set_class_mismatch")
        _append_unique(
            nodes,
            _node(
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
            ),
            "node",
        )

    for application in sorted(applications_by_id.values(), key=lambda item: item.application_id):
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
        if set(application.commutation_ids) - set(commutations):
            raise CourtGraphProjectionError("filter_application_commutation_missing")
        scale_state_id = _scale_state_id(profile)
        logical_id = f"court-filter-application:{application.application_id}"
        source_pitch_classes = set(profile.rooted_scale.pitch_set.pitch_classes)
        result_pitch_classes = set(PitchClassSet(result_mask).pitch_classes)
        _append_unique(
            nodes,
            _node(
                "CourtFilterApplication",
                logical_id,
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
            ),
            "node",
        )
        edges = (
            _relationship(
                "FILTERS", f"filters:{application.application_id}:{scale_state_id}",
                "CourtFilterApplication", logical_id, "ScaleState", f"scale-state:{scale_state_id}",
                {"harmonicProfileSha256": profile.fingerprint_sha256},
                admission_status=application.admission_status, source_sha256=application.source_sha256,
            ),
            _relationship(
                "USES_FILTER", f"uses-filter:{application.application_id}:{application.filter_id}",
                "CourtFilterApplication", logical_id, "CourtFilterOperator", f"court-filter:{application.filter_id}",
                {"derivationMethod": FILTER_DERIVATION_METHOD},
                admission_status=application.admission_status, source_sha256=application.source_sha256,
            ),
            _relationship(
                "YIELDS_ADMITTED_SET", f"yields-set:{application.application_id}:{application.yielded_set_class_id}",
                "CourtFilterApplication", logical_id, "PentatonicSetClass", f"pentatonic-set-class:{application.yielded_set_class_id}",
                {"resultMask": result_mask}, admission_status=application.admission_status,
                source_sha256=application.source_sha256,
            ),
        )
        for edge in edges:
            _append_unique(relationships, edge, "relationship")
        for commutation_id in application.commutation_ids:
            _append_unique(
                relationships,
                _relationship(
                    "HAS_COMMUTATION_RESULT",
                    f"has-commutation:{application.application_id}:{commutation_id}",
                    "CourtFilterApplication", logical_id, "CourtCommutationRecord",
                    f"court-commutation:{commutation_id}", {},
                    admission_status=application.admission_status,
                    source_sha256=application.source_sha256,
                ),
                "relationship",
            )

    for pole in sorted(poles_by_id.values(), key=lambda item: item.pole_register_id):
        if pole.owner_id not in positions:
            raise CourtGraphProjectionError("pole_register_position_missing")
        pole_logical_id = f"pole-register:{pole.pole_register_id}"
        _append_unique(
            nodes,
            _node(
                "PoleRegister",
                pole_logical_id,
                {
                    "internalPoles": list(pole.internal_poles),
                    "poleOrder": list(POLE_NAMES),
                    "poleRegisterId": pole.pole_register_id,
                    "vector": [1 if name in pole.internal_poles else 0 for name in POLE_NAMES],
                },
                admission_status=pole.admission_status,
                source_sha256=pole.source_sha256,
            ),
            "node",
        )
        _append_unique(
            relationships,
            _relationship(
                "HAS_POLE_REGISTER",
                f"has-pole-register:CourtRootedPosition:{pole.owner_id}:{pole.pole_register_id}",
                "CourtRootedPosition", f"court-position:{pole.owner_id}", "PoleRegister",
                pole_logical_id, {}, admission_status=pole.admission_status,
                source_sha256=pole.source_sha256,
            ),
            "relationship",
        )

    event_ids: set[str] = set()
    snapshot_ids: set[str] = set()
    translocation_ids: set[str] = set()
    for runtime_input, replay in replayed_sessions:
        state = replay.state
        snapshot = replay.snapshot
        if state.harmonic_profile_sha256 not in profile_by_sha:
            raise CourtGraphProjectionError("runtime_session_profile_not_projected")
        profile = profile_by_sha[state.harmonic_profile_sha256]
        session_id = state.session_id
        session_logical_id = f"court-runtime-session:{session_id}"
        state_logical_id = f"court-state:{state.state_sha256}"
        snapshot_logical_id = f"court-ledger-snapshot:{snapshot.snapshot_hash}"
        if snapshot.snapshot_hash in snapshot_ids:
            raise CourtGraphProjectionError("duplicate_runtime_snapshot_id")
        snapshot_ids.add(snapshot.snapshot_hash)

        _append_unique(
            nodes,
            _node(
                "CourtRuntimeSession",
                session_logical_id,
                {
                    "sessionId": session_id,
                    "genesisStateSha256": runtime_input.genesis.state_sha256,
                    "currentStateSha256": state.state_sha256,
                    "eventCount": state.ledger_anchor.event_count,
                    "ledgerHeadSha256": state.ledger_anchor.head_sha256,
                    "policyFingerprint": state.policy_fingerprint,
                    "contextFingerprint": state.context_fingerprint,
                    "replayVerified": True,
                },
                admission_status="runtime",
                source_sha256=state.ledger_anchor.head_sha256,
            ),
            "node",
        )
        _append_unique(
            nodes,
            _node(
                "CourtState",
                state_logical_id,
                {
                    "courtStateSha256": state.state_sha256,
                    "sessionId": session_id,
                    "courtPositionId": state.position_id,
                    "revision": state.revision,
                    "pitchMask": state.pitch_mask,
                    "poleVector": state.pole_register.vector,
                    "kappaNumerator": state.kappa_court.numerator,
                    "kappaDenominator": state.kappa_court.denominator,
                    "harmonicProfileSha256": state.harmonic_profile_sha256,
                    "policyFingerprint": state.policy_fingerprint,
                    "contextFingerprint": state.context_fingerprint,
                    "eventCount": state.ledger_anchor.event_count,
                    "ledgerHeadSha256": state.ledger_anchor.head_sha256,
                    "consumedTokenCount": len(state.consumed_token_ids),
                },
                admission_status="runtime",
                source_sha256=state.state_sha256,
            ),
            "node",
        )
        _append_unique(
            nodes,
            _node(
                "CourtLedgerSnapshot",
                snapshot_logical_id,
                {
                    "snapshotHash": snapshot.snapshot_hash,
                    "stateSha256": snapshot.state_sha256,
                    "eventCount": snapshot.event_count,
                    "ledgerHeadSha256": snapshot.ledger_head,
                    "policyFingerprint": snapshot.policy_fingerprint,
                    "contextFingerprint": snapshot.context_fingerprint,
                    "kappaNumerator": snapshot.kappa_court.numerator,
                    "kappaDenominator": snapshot.kappa_court.denominator,
                    "replayVerified": True,
                },
                admission_status="runtime",
                source_sha256=snapshot.snapshot_hash,
            ),
            "node",
        )
        runtime_pole_id = f"runtime:{state.state_sha256}"
        runtime_pole_logical_id = f"pole-register:{runtime_pole_id}"
        _append_unique(
            nodes,
            _node(
                "PoleRegister",
                runtime_pole_logical_id,
                {
                    "internalPoles": list(state.pole_register.internal_poles),
                    "poleOrder": list(state.pole_register.pole_order),
                    "poleRegisterId": runtime_pole_id,
                    "vector": state.pole_register.vector,
                },
                admission_status="runtime",
                source_sha256=state.state_sha256,
            ),
            "node",
        )
        for edge in (
            _relationship(
                "HAS_LEDGER_SNAPSHOT", f"has-ledger-snapshot:{session_id}:{snapshot.snapshot_hash}",
                "CourtRuntimeSession", session_logical_id, "CourtLedgerSnapshot", snapshot_logical_id,
                {}, admission_status="runtime", source_sha256=snapshot.snapshot_hash,
            ),
            _relationship(
                "SNAPSHOTS_STATE", f"snapshots-state:{snapshot.snapshot_hash}:{state.state_sha256}",
                "CourtLedgerSnapshot", snapshot_logical_id, "CourtState", state_logical_id,
                {}, admission_status="runtime", source_sha256=snapshot.snapshot_hash,
            ),
            _relationship(
                "HAS_POLE_REGISTER", f"has-pole-register:CourtState:{state.state_sha256}:{runtime_pole_id}",
                "CourtState", state_logical_id, "PoleRegister", runtime_pole_logical_id,
                {}, admission_status="runtime", source_sha256=state.state_sha256,
            ),
        ):
            _append_unique(relationships, edge, "relationship")

        expected_prior = runtime_input.genesis.state_sha256
        expected_previous = "0" * 64
        for sequence, event in enumerate(runtime_input.events, 1):
            payload = thaw_json(event.payload)
            intrinsic = payload["intrinsicData"]
            event_id = payload["eventId"]
            if event_id in event_ids:
                raise CourtGraphProjectionError("duplicate_runtime_event_id")
            event_ids.add(event_id)
            if event.sequence != sequence or event.previous_event_sha256 != expected_previous:
                raise CourtGraphProjectionError("runtime_event_chain_not_contiguous")
            if payload["sessionId"] != session_id or payload["priorStateSha256"] != expected_prior:
                raise CourtGraphProjectionError("runtime_event_session_chain_mismatch")
            expected_prior = payload["resultingStateSha256"]
            expected_previous = event.event_sha256
            token = intrinsic["token"]
            event_logical_id = f"court-transition-event:{event_id}"
            translocation = intrinsic["translocationRecord"]
            route = intrinsic["routeContext"]
            _append_unique(
                nodes,
                _node(
                    "CourtTransitionEvent",
                    event_logical_id,
                    {
                        "eventId": event_id,
                        "intrinsicSha256": event_id,
                        "eventSha256": event.event_sha256,
                        "envelopeSha256": event.payload_sha256,
                        "previousEventSha256": event.previous_event_sha256,
                        "sequence": event.sequence,
                        "sessionId": session_id,
                        "operationId": payload["operationId"],
                        "targetPosition": intrinsic["targetPosition"],
                        "priorStateSha256": payload["priorStateSha256"],
                        "resultingStateSha256": payload["resultingStateSha256"],
                        "verificationStatus": intrinsic["verificationStatus"],
                        "evidenceEventIds": intrinsic["evidenceEventIds"],
                        "tokenId": token["tokenId"],
                        "translocationRecordHash": translocation["recordHash"] if translocation else None,
                        "routeContextHash": route["routeContextHash"] if route else None,
                    },
                    admission_status="runtime",
                    source_sha256=event.event_sha256,
                ),
                "node",
            )
            _append_unique(
                relationships,
                _relationship(
                    "HAS_TRANSITION_EVENT", f"has-transition-event:{session_id}:{event_id}",
                    "CourtRuntimeSession", session_logical_id, "CourtTransitionEvent", event_logical_id,
                    {}, admission_status="runtime", source_sha256=event.event_sha256,
                ),
                "relationship",
            )
            if translocation is None:
                if route is not None:
                    raise CourtGraphProjectionError("runtime_event_translocation_route_pairing_invalid")
                continue
            if route is None:
                raise CourtGraphProjectionError("runtime_event_translocation_route_pairing_invalid")
            record_hash = translocation["recordHash"]
            if record_hash in translocation_ids:
                raise CourtGraphProjectionError("duplicate_translocation_record_id")
            translocation_ids.add(record_hash)
            source = translocation["sourceScaleState"]
            target = translocation["targetScaleState"]
            mutation = translocation["mutation"]
            evidence = translocation["evidence"]
            crt304 = translocation["crt304"]
            if source["id"] != _scale_state_id(profile):
                raise CourtGraphProjectionError("translocation_source_profile_mismatch")
            route_id = crt304["staticRouteRecordId"]
            static_route = commutations.get(route_id)
            if static_route is None:
                raise CourtGraphProjectionError("translocation_static_route_missing")
            if (
                route["staticRouteRecordId"] != route_id
                or static_route.mutation_operator_id != mutation["operatorId"]
                or static_route.result != crt304["classification"]
                or static_route.route_semantics != CRT304_TRANSLOCATION_ROUTE_SEMANTICS
                or static_route.source_sha256 != crt304["fingerprint"]
                or crt304["fingerprint"] != CRT304_FINGERPRINT
            ):
                raise CourtGraphProjectionError("translocation_static_route_mismatch")
            translocation_logical_id = f"topological-translocation:{record_hash}"
            _append_unique(
                nodes,
                _node(
                    "TopologicalTranslocationRecord",
                    translocation_logical_id,
                    {
                        "recordHash": record_hash,
                        "sourcePosition": translocation["sourcePosition"],
                        "targetPosition": translocation["targetPosition"],
                        "sourceScaleStateId": source["id"],
                        "sourceForte": source["forte"],
                        "targetScaleStateId": target["id"],
                        "targetForte": target["forte"],
                        "operatorId": mutation["operatorId"],
                        "alteredDegree": mutation["alteredDegree"],
                        "direction": mutation["direction"],
                        "applicationId": mutation["applicationId"],
                        "evidencePath": evidence["path"],
                        "evidenceSha256": evidence["sha256"],
                        "crt304Fingerprint": crt304["fingerprint"],
                        "filterId": crt304["filterId"],
                        "filterMask": crt304["filterMask"],
                        "classification": crt304["classification"],
                        "staticRouteRecordId": route_id,
                    },
                    admission_status="runtime",
                    source_sha256=record_hash,
                ),
                "node",
            )
            for edge in (
                _relationship(
                    "HAS_TRANSLOCATION", f"has-translocation:{event_id}:{record_hash}",
                    "CourtTransitionEvent", event_logical_id, "TopologicalTranslocationRecord",
                    translocation_logical_id, {}, admission_status="runtime", source_sha256=record_hash,
                ),
                _relationship(
                    "USES_ROUTE_RECORD", f"uses-route-record:{event_id}:{route_id}",
                    "CourtTransitionEvent", event_logical_id, "CourtCommutationRecord",
                    f"court-commutation:{route_id}", {}, admission_status="runtime",
                    source_sha256=route["routeContextHash"],
                ),
            ):
                _append_unique(relationships, edge, "relationship")

        if expected_prior != state.state_sha256 or expected_previous != state.ledger_anchor.head_sha256:
            raise CourtGraphProjectionError("runtime_session_terminal_chain_mismatch")

    sorted_nodes = sorted(nodes.values(), key=lambda item: str(item["logicalId"]))
    sorted_relationships = sorted(relationships.values(), key=lambda item: str(item["logicalId"]))
    source_fingerprints = sorted(
        {str(record["sourceSha256"]) for record in (*sorted_nodes, *sorted_relationships)}
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
    snapshot = {**core, "projectionFingerprint": sha256_payload(core)}
    if not verify_court_graph_projection(snapshot):
        raise CourtGraphProjectionError("built_court_graph_projection_invalid")
    return snapshot


_ENDPOINTS = {
    "FILTERS": ("CourtFilterApplication", "ScaleState"),
    "HAS_COMMUTATION_RESULT": ("CourtFilterApplication", "CourtCommutationRecord"),
    "HAS_LEDGER_SNAPSHOT": ("CourtRuntimeSession", "CourtLedgerSnapshot"),
    "HAS_TRANSITION_EVENT": ("CourtRuntimeSession", "CourtTransitionEvent"),
    "HAS_TRANSLOCATION": ("CourtTransitionEvent", "TopologicalTranslocationRecord"),
    "HAS_TRIAD": ("ScaleState", "Triad"),
    "SNAPSHOTS_STATE": ("CourtLedgerSnapshot", "CourtState"),
    "USES_FILTER": ("CourtFilterApplication", "CourtFilterOperator"),
    "USES_ROUTE_RECORD": ("CourtTransitionEvent", "CourtCommutationRecord"),
    "YIELDS_ADMITTED_SET": ("CourtFilterApplication", "PentatonicSetClass"),
}


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
    fingerprints = snapshot.get("sourceFingerprints")
    if not isinstance(nodes, list) or not isinstance(relationships, list) or not isinstance(references, list):
        return False
    if not isinstance(counts, Mapping) or not isinstance(fingerprints, list):
        return False
    if counts != {
        "nodeCount": len(nodes),
        "relationshipCount": len(relationships),
        "scaleStateReferenceCount": len(references),
    }:
        return False
    records: list[Any] = [*nodes, *relationships, *references]
    if any(not isinstance(record, Mapping) for record in records):
        return False
    if any(_contains_forbidden_authority_key(record) for record in records):
        return False
    node_ids = [record.get("logicalId") for record in nodes]
    relationship_ids = [record.get("logicalId") for record in relationships]
    reference_ids = [record.get("logicalId") for record in references]
    if (
        any(not isinstance(value, str) for value in (*node_ids, *relationship_ids, *reference_ids))
        or node_ids != sorted(node_ids)
        or relationship_ids != sorted(relationship_ids)
        or len(set(node_ids)) != len(node_ids)
        or len(set(relationship_ids)) != len(relationship_ids)
        or len(set(reference_ids)) != len(reference_ids)
    ):
        return False
    for reference in references:
        state_id = reference.get("scaleStateId")
        if set(reference) != {"logicalId", "scaleStateId"} or type(state_id) is not int:
            return False
        if reference.get("logicalId") != f"scale-state:{state_id}":
            return False
    if reference_ids != [item["logicalId"] for item in sorted(references, key=lambda item: item["scaleStateId"])]:
        return False

    node_by_id: dict[str, Mapping[str, Any]] = {}
    labels: dict[str, str] = {}
    business_ids: dict[str, set[object]] = {
        "CourtRuntimeSession": set(),
        "CourtTransitionEvent": set(),
        "CourtLedgerSnapshot": set(),
        "TopologicalTranslocationRecord": set(),
        "CourtState": set(),
    }
    for node in nodes:
        label = node.get("label")
        properties = node.get("properties")
        if label not in NODE_LABELS or not isinstance(properties, Mapping):
            return False
        record_core = {key: value for key, value in node.items() if key != "recordSha256"}
        if sha256_payload(record_core) != node.get("recordSha256"):
            return False
        logical_id = str(node["logicalId"])
        node_by_id[logical_id] = node
        labels[logical_id] = str(label)
        if label == "CourtCommutationRecord" and (
            properties.get("result") not in COMMUTATION_RESULTS
            or properties.get("ledgerPointer") is not None
        ):
            return False
        if label == "CourtFilterOperator" and (
            properties.get("operatorType") != "linear_diagonal"
            or properties.get("idempotent") is not True
            or properties.get("inverse") != "none"
        ):
            return False
        if label == "PentatonicSetClass":
            mask = properties.get("pitchMask")
            if type(mask) is not int or mask.bit_count() != 5:
                return False
        if label == "CourtRuntimeSession" and properties.get("replayVerified") is not True:
            return False
        if label == "CourtLedgerSnapshot" and properties.get("replayVerified") is not True:
            return False
        identity = {
            "CourtRuntimeSession": ("sessionId", "court-runtime-session:"),
            "CourtTransitionEvent": ("eventId", "court-transition-event:"),
            "CourtLedgerSnapshot": ("snapshotHash", "court-ledger-snapshot:"),
            "TopologicalTranslocationRecord": ("recordHash", "topological-translocation:"),
            "CourtState": ("courtStateSha256", "court-state:"),
        }.get(str(label))
        if identity is not None:
            field, prefix = identity
            business_id = properties.get(field)
            if business_id in business_ids[str(label)] or logical_id != f"{prefix}{business_id}":
                return False
            business_ids[str(label)].add(business_id)
        if label == "CourtTransitionEvent" and (
            properties.get("intrinsicSha256") != properties.get("eventId")
            or properties.get("verificationStatus") != "VERIFIED"
            or not _is_verified_evidence_ids(properties.get("evidenceEventIds"))
            or any(
                not _is_sha256_value(properties.get(field))
                for field in (
                    "eventId",
                    "eventSha256",
                    "envelopeSha256",
                    "previousEventSha256",
                    "priorStateSha256",
                    "resultingStateSha256",
                    "tokenId",
                )
            )
        ):
            return False

    reference_set = set(reference_ids)
    node_set = set(node_ids)
    outgoing: dict[str, dict[str, list[Mapping[str, Any]]]] = {}
    incoming: dict[str, dict[str, list[Mapping[str, Any]]]] = {}
    used_references: set[str] = set()
    for edge in relationships:
        relationship_type = edge.get("relationshipType")
        properties = edge.get("properties")
        if relationship_type not in RELATIONSHIP_TYPES or not isinstance(properties, Mapping):
            return False
        record_core = {key: value for key, value in edge.items() if key != "recordSha256"}
        if sha256_payload(record_core) != edge.get("recordSha256"):
            return False
        source_id = str(edge.get("sourceLogicalId"))
        target_id = str(edge.get("targetLogicalId"))
        if source_id not in node_set | reference_set or target_id not in node_set | reference_set:
            return False
        source_label = "ScaleState" if source_id in reference_set else labels[source_id]
        target_label = "ScaleState" if target_id in reference_set else labels[target_id]
        if edge.get("sourceLabel") != source_label or edge.get("targetLabel") != target_label:
            return False
        if relationship_type == "HAS_POLE_REGISTER":
            if source_label not in {"CourtRootedPosition", "CourtState"} or target_label != "PoleRegister":
                return False
        elif (source_label, target_label) != _ENDPOINTS[str(relationship_type)]:
            return False
        if source_id in reference_set:
            used_references.add(source_id)
        if target_id in reference_set:
            used_references.add(target_id)
        outgoing.setdefault(source_id, {}).setdefault(str(relationship_type), []).append(edge)
        incoming.setdefault(target_id, {}).setdefault(str(relationship_type), []).append(edge)
    if used_references != reference_set:
        return False

    triad_groups: dict[tuple[str, Any], list[Any]] = {}
    for edge in relationships:
        if edge["relationshipType"] != "HAS_TRIAD":
            continue
        props = edge["properties"]
        source_id = str(edge["sourceLogicalId"])
        if edge.get("sourceScaleStateId") != int(source_id.removeprefix("scale-state:")):
            return False
        triad_groups.setdefault((source_id, props.get("harmonicProfileSha256")), []).append(props.get("degree"))
    if any(sorted(degrees) != list(range(1, 8)) for degrees in triad_groups.values()):
        return False
    if len({key[0] for key in triad_groups}) != len(triad_groups):
        return False

    application_ids = [logical_id for logical_id, label in labels.items() if label == "CourtFilterApplication"]
    for application_id in application_ids:
        edges = outgoing.get(application_id, {})
        if any(len(edges.get(kind, [])) != 1 for kind in ("FILTERS", "USES_FILTER", "YIELDS_ADMITTED_SET")):
            return False
        application = node_by_id[application_id]["properties"]
        filter_node = node_by_id[str(edges["USES_FILTER"][0]["targetLogicalId"])]["properties"]
        yielded = node_by_id[str(edges["YIELDS_ADMITTED_SET"][0]["targetLogicalId"])]["properties"]
        source_mask = application.get("sourceMask")
        court_mask = filter_node.get("courtMask")
        result_mask = application.get("resultMask")
        if type(source_mask) is not int or type(court_mask) is not int or type(result_mask) is not int:
            return False
        if result_mask != source_mask & court_mask or result_mask != yielded.get("pitchMask"):
            return False

    pole_ids = [logical_id for logical_id, label in labels.items() if label == "PoleRegister"]
    if any(len(incoming.get(pole_id, {}).get("HAS_POLE_REGISTER", [])) != 1 for pole_id in pole_ids):
        return False

    session_ids = [logical_id for logical_id, label in labels.items() if label == "CourtRuntimeSession"]
    event_node_ids = {logical_id for logical_id, label in labels.items() if label == "CourtTransitionEvent"}
    snapshot_node_ids = {logical_id for logical_id, label in labels.items() if label == "CourtLedgerSnapshot"}
    translocation_node_ids = {logical_id for logical_id, label in labels.items() if label == "TopologicalTranslocationRecord"}
    seen_events: set[str] = set()
    seen_snapshots: set[str] = set()
    seen_states: set[str] = set()
    for session_id in session_ids:
        session = node_by_id[session_id]["properties"]
        session_edges = outgoing.get(session_id, {})
        event_edges = session_edges.get("HAS_TRANSITION_EVENT", [])
        snapshot_edges = session_edges.get("HAS_LEDGER_SNAPSHOT", [])
        if len(snapshot_edges) != 1 or len(event_edges) != session.get("eventCount"):
            return False
        events = [node_by_id[str(edge["targetLogicalId"])] for edge in event_edges]
        events.sort(key=lambda item: item["properties"].get("sequence"))
        if [item["properties"].get("sequence") for item in events] != list(range(1, len(events) + 1)):
            return False
        prior = session.get("genesisStateSha256")
        previous_event = "0" * 64
        for event in events:
            props = event["properties"]
            if (
                props.get("sessionId") != session.get("sessionId")
                or props.get("priorStateSha256") != prior
                or props.get("previousEventSha256") != previous_event
            ):
                return False
            prior = props.get("resultingStateSha256")
            previous_event = props.get("eventSha256")
        if events:
            if events[-1]["properties"].get("eventSha256") != session.get("ledgerHeadSha256"):
                return False
        elif session.get("ledgerHeadSha256") != "0" * 64:
            return False
        if prior != session.get("currentStateSha256"):
            return False
        snapshot_id = str(snapshot_edges[0]["targetLogicalId"])
        snapshot = node_by_id[snapshot_id]["properties"]
        state_edges = outgoing.get(snapshot_id, {}).get("SNAPSHOTS_STATE", [])
        if len(state_edges) != 1:
            return False
        state_id = str(state_edges[0]["targetLogicalId"])
        state = node_by_id[state_id]["properties"]
        closure = (
            snapshot.get("stateSha256") == state.get("courtStateSha256") == session.get("currentStateSha256")
            and snapshot.get("eventCount") == state.get("eventCount") == session.get("eventCount")
            and snapshot.get("ledgerHeadSha256") == state.get("ledgerHeadSha256") == session.get("ledgerHeadSha256")
            and snapshot.get("policyFingerprint") == state.get("policyFingerprint") == session.get("policyFingerprint")
            and snapshot.get("contextFingerprint") == state.get("contextFingerprint") == session.get("contextFingerprint")
            and snapshot.get("kappaNumerator") == state.get("kappaNumerator")
            and snapshot.get("kappaDenominator") == state.get("kappaDenominator")
            and state.get("sessionId") == session.get("sessionId")
            and state.get("revision") == session.get("eventCount")
            and state.get("consumedTokenCount") == session.get("eventCount")
        )
        if not closure:
            return False
        seen_events.update(str(edge["targetLogicalId"]) for edge in event_edges)
        seen_snapshots.add(snapshot_id)
        seen_states.add(state_id)
    if seen_events != event_node_ids or seen_snapshots != snapshot_node_ids:
        return False
    runtime_state_ids = {logical_id for logical_id, label in labels.items() if label == "CourtState"}
    if seen_states != runtime_state_ids:
        return False

    seen_translocations: set[str] = set()
    for event_id in event_node_ids:
        props = node_by_id[event_id]["properties"]
        trans_edges = outgoing.get(event_id, {}).get("HAS_TRANSLOCATION", [])
        route_edges = outgoing.get(event_id, {}).get("USES_ROUTE_RECORD", [])
        is_translocation = props.get("operationId") == "court:translocate"
        if is_translocation:
            if len(trans_edges) != 1 or len(route_edges) != 1:
                return False
            trans_id = str(trans_edges[0]["targetLogicalId"])
            trans = node_by_id[trans_id]["properties"]
            route_node = node_by_id[str(route_edges[0]["targetLogicalId"])]
            route = route_node["properties"]
            expected_route_id = (
                f"noncomm:{trans.get('filterId')}:{trans.get('operatorId')}:"
                f"{trans.get('sourceScaleStateId')}"
            )
            if (
                props.get("translocationRecordHash") != trans.get("recordHash")
                or not props.get("routeContextHash")
                or trans.get("staticRouteRecordId") != route.get("commutationId")
                or trans.get("staticRouteRecordId") != expected_route_id
                or trans.get("classification") != route.get("result")
                or trans.get("classification") != "right_undefined"
                or trans.get("operatorId") != route.get("mutationOperatorId")
                or trans.get("crt304Fingerprint") != CRT304_FINGERPRINT
                or route.get("routeSemantics") != CRT304_TRANSLOCATION_ROUTE_SEMANTICS
                or route_node.get("sourceSha256") != CRT304_FINGERPRINT
                or route.get("ledgerPointer") is not None
            ):
                return False
            seen_translocations.add(trans_id)
        elif trans_edges or route_edges or props.get("translocationRecordHash") is not None or props.get("routeContextHash") is not None:
            return False
    if seen_translocations != translocation_node_ids:
        return False

    source_values = {record.get("sourceSha256") for record in (*nodes, *relationships)}
    if any(not _is_sha256_value(value) for value in source_values):
        return False
    if fingerprints != sorted(source_values):
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


def _direct_relationship_ingest(relationship_type: str, source_label: str, target_label: str) -> str:
    return f"""UNWIND $records AS record
MATCH (source:{source_label} {{logicalId: record.sourceLogicalId}})
MATCH (target:{target_label} {{logicalId: record.targetLogicalId}})
MERGE (source)-[r:{relationship_type} {{logicalId: record.logicalId}}]->(target)
SET r = record.properties
SET r.logicalId = record.logicalId, r.recordSha256 = record.recordSha256,
    r.sourceSha256 = record.sourceSha256, r.admissionStatus = record.admissionStatus,
    r.projectionFingerprint = $projectionFingerprint"""


_RELATIONSHIP_INGEST = {
    relationship_type: _direct_relationship_ingest(relationship_type, *endpoints)
    for relationship_type, endpoints in _ENDPOINTS.items()
    if "ScaleState" not in endpoints
}
_RELATIONSHIP_INGEST.update(
    {
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
)


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
            batches.append(
                CypherIngestionBatch(
                    sequence=len(batches) + 1,
                    kind=kind,
                    cypher=cypher,
                    parameters={
                        "projectionFingerprint": projection_fingerprint,
                        "records": records[offset : offset + batch_size],
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
        append_group(
            f"nodes:{label}",
            _NODE_INGEST[label],
            [dict(record) for record in nodes if record.get("label") == label],
        )
    for relationship_type in RELATIONSHIP_TYPES:
        records = [
            dict(record)
            for record in relationships
            if record.get("relationshipType") == relationship_type
        ]
        if relationship_type == "FILTERS":
            for record in records:
                record["targetScaleStateId"] = int(
                    str(record["targetLogicalId"]).removeprefix("scale-state:")
                )
        append_group(
            f"relationships:{relationship_type}",
            _RELATIONSHIP_INGEST[relationship_type],
            records,
        )
    return tuple(batches)
