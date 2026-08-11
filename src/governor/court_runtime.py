"""CRT-305 deterministic Court runtime layered over the GOV-204 ledger."""

from __future__ import annotations

from collections.abc import Iterable, Mapping
from dataclasses import dataclass, field, replace
from fractions import Fraction
import hashlib
import json
import math
from pathlib import Path
import re
from typing import Any

from .evidence import VerificationDecision
from .hashing import sha256_payload
from .ledger import (
    GENESIS_SHA256,
    LEDGER_EVENT_SCHEMA_VERSION,
    compute_event_hash,
    verify_ledger,
)
from .models import LedgerAnchor, LedgerEvent, freeze_json, thaw_json


COURT_RUNTIME_POLICY_SCHEMA_VERSION = "crt-305.court-runtime-policy.v1"
COURT_RUNTIME_STATE_SCHEMA_VERSION = "crt-305.court-runtime-state.v1"
COURT_LEGAL_MOVE_SCHEMA_VERSION = "crt-305.court-legal-move.v1"
COURT_VALIDATION_TOKEN_SCHEMA_VERSION = "crt-305.court-validation-token.v1"
COURT_VALIDATED_MOVE_SCHEMA_VERSION = "crt-305.court-validated-move.v1"
COURT_TRANSLOCATION_SCHEMA_VERSION = "crt-305.topological-translocation.v1"
COURT_ROUTE_CONTEXT_SCHEMA_VERSION = "crt-305.court-route-context.v1"
COURT_RUNTIME_EVENT_SCHEMA_VERSION = "crt-305.court-transition-event.v1"
COURT_RUNTIME_SNAPSHOT_SCHEMA_VERSION = "crt-305.court-runtime-snapshot.v1"
COURT_RUNTIME_REPLAY_SCHEMA_VERSION = "crt-305.court-runtime-replay-result.v1"

COURT_POSITIONS = ("C0", "C1", "C2", "C3", "C4")
COURT_MASKS = (661, 677, 1189, 1193, 1321)
COURT_POLE_ORDER = ("Mars", "Jupiter", "Venus", "Saturn")
COURT_POLE_VECTORS = ("0000", "1000", "1100", "1110", "1111")
COURT_KAPPA = ((0, 1), (1, 4), (1, 2), (3, 4), (1, 1))
COURT_OPERATIONS = ("court:advance", "court:retreat", "court:translocate")
FORBIDDEN_KAPPA_NAMESPACES = (
    "physical.C_P",
    "harmonic.C_H",
    "semantic.C_S",
    "physical.temperature",
    "physical.entropy",
    "physical.enthalpy",
    "physical.freeEnergy",
)

_SHA256 = re.compile(r"^[0-9a-f]{64}$")
_SESSION_ID = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$")
_ROOT = Path(__file__).resolve().parents[2]
_POLICY_PATH = _ROOT / "schemas/court-runtime-policy.json"


class CourtRuntimeError(ValueError):
    """A stable, reason-coded, fail-closed Court runtime error."""

    def __init__(self, reason_code: str) -> None:
        super().__init__(reason_code)
        self.reason_code = reason_code


def _fail(reason: str) -> None:
    raise CourtRuntimeError(reason)


def _sha(value: Any, reason: str) -> str:
    if not isinstance(value, str) or not _SHA256.fullmatch(value):
        _fail(reason)
    return value


def _identifier(value: Any, reason: str) -> str:
    if not isinstance(value, str) or not value:
        _fail(reason)
    return value


def _exact_keys(value: Any, keys: set[str], reason: str) -> Mapping[str, Any]:
    if not isinstance(value, Mapping) or set(value) != keys:
        _fail(reason)
    return value


def _position_index(position: Any) -> int:
    try:
        return COURT_POSITIONS.index(position)
    except ValueError:
        _fail("court_position_not_canonical")
    except TypeError:
        _fail("court_position_not_canonical")


@dataclass(frozen=True, slots=True, order=True)
class ExactRatio:
    numerator: int
    denominator: int

    def __post_init__(self) -> None:
        if (
            type(self.numerator) is not int
            or type(self.denominator) is not int
            or self.denominator <= 0
        ):
            _fail("exact_ratio_invalid")
        divisor = math.gcd(self.numerator, self.denominator)
        if divisor != 1 or (self.numerator == 0 and self.denominator != 1):
            _fail("exact_ratio_not_normalized")

    @classmethod
    def normalized(cls, numerator: int, denominator: int) -> ExactRatio:
        try:
            value = Fraction(numerator, denominator)
        except (TypeError, ValueError, ZeroDivisionError) as error:
            raise CourtRuntimeError("exact_ratio_invalid") from error
        return cls(value.numerator, value.denominator)


@dataclass(frozen=True, slots=True)
class PoleRegister:
    pole_order: tuple[str, ...]
    vector: str
    internal_poles: tuple[str, ...]

    def __post_init__(self) -> None:
        if self.pole_order != COURT_POLE_ORDER:
            _fail("court_pole_order_mismatch")
        if self.vector not in COURT_POLE_VECTORS:
            _fail("court_pole_vector_off_chain")
        expected = tuple(
            pole for pole, bit in zip(self.pole_order, self.vector, strict=True) if bit == "1"
        )
        if self.internal_poles != expected:
            _fail("court_internal_poles_mismatch")


@dataclass(frozen=True, slots=True)
class CourtRuntimePolicy:
    policy_id: str
    admission: str
    policy_fingerprint: str
    dependencies: tuple[Mapping[str, Any], ...]
    positions: tuple[Mapping[str, Any], ...]
    ordinary_moves: tuple[tuple[str, str, str], ...]
    operation_allow_list: tuple[str, ...]
    required_capabilities: Mapping[str, str]
    translocation_evidence: Mapping[str, Any]
    document: Mapping[str, Any] = field(repr=False, compare=False)

    def __post_init__(self) -> None:
        if self.policy_id != "court-runtime-policy:0.1.0":
            _fail("court_policy_id_mismatch")
        if self.admission != "proposed_pending_crt_309":
            _fail("court_policy_admission_mismatch")
        _sha(self.policy_fingerprint, "court_policy_fingerprint_invalid")
        if self.operation_allow_list != COURT_OPERATIONS:
            _fail("court_policy_operation_allow_list_mismatch")
        if dict(self.required_capabilities) != {
            "court:advance": "court.transition",
            "court:retreat": "court.transition",
            "court:translocate": "court.translocate",
        }:
            _fail("court_policy_capability_map_mismatch")


def exact_ratio_body(value: ExactRatio) -> dict[str, int]:
    return {"numerator": value.numerator, "denominator": value.denominator}


def pole_register_body(value: PoleRegister) -> dict[str, Any]:
    return {
        "poleOrder": list(value.pole_order),
        "vector": value.vector,
        "internalPoles": list(value.internal_poles),
    }


def _policy_without_fingerprint(document: Mapping[str, Any]) -> dict[str, Any]:
    body = dict(document)
    body.pop("policyFingerprint", None)
    return body


def _dependency_file_sha256(path: Path) -> str:
    try:
        return hashlib.sha256(path.read_bytes()).hexdigest()
    except OSError as error:
        raise CourtRuntimeError("court_policy_dependency_unreadable") from error


def load_court_runtime_policy(
    path: str | Path | None = None,
    *,
    repository_root: str | Path | None = None,
) -> CourtRuntimePolicy:
    """Load the closed policy and verify its self-hash and local dependency closure."""

    policy_path = Path(path).resolve() if path is not None else _POLICY_PATH
    root = Path(repository_root).resolve() if repository_root is not None else _ROOT
    try:
        document = json.loads(policy_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        raise CourtRuntimeError("court_policy_unreadable") from error
    top_keys = {
        "schemaVersion", "policyId", "integratedAdmission", "policyFingerprint",
        "dependencies", "genericLedgerContract", "positions", "poleOrder",
        "ordinaryMoves", "operationAllowList", "requiredCapabilities",
        "kappaNamespace", "forbiddenKappaNamespaces", "translocationEvidence",
    }
    _exact_keys(document, top_keys, "court_policy_schema_invalid")
    if document["schemaVersion"] != COURT_RUNTIME_POLICY_SCHEMA_VERSION:
        _fail("court_policy_schema_version_mismatch")
    fingerprint = _sha(document["policyFingerprint"], "court_policy_fingerprint_invalid")
    if sha256_payload(_policy_without_fingerprint(document)) != fingerprint:
        _fail("court_policy_fingerprint_mismatch")
    if document["poleOrder"] != list(COURT_POLE_ORDER):
        _fail("court_policy_pole_order_mismatch")
    if document["kappaNamespace"] != "court.kappa_court":
        _fail("court_policy_kappa_namespace_mismatch")
    if document["forbiddenKappaNamespaces"] != list(FORBIDDEN_KAPPA_NAMESPACES):
        _fail("court_policy_forbidden_namespaces_mismatch")

    dependencies_document = document["dependencies"]
    if not isinstance(dependencies_document, list) or len(dependencies_document) != 8:
        _fail("court_policy_dependencies_invalid")
    dependencies: list[Mapping[str, Any]] = []
    dependency_ids: set[str] = set()
    for item in dependencies_document:
        dependency = _exact_keys(
            item,
            {"dependencyId", "path", "sha256", "fingerprintField", "fingerprint"},
            "court_policy_dependency_invalid",
        )
        dependency_id = _identifier(dependency["dependencyId"], "court_policy_dependency_invalid")
        if dependency_id in dependency_ids:
            _fail("court_policy_dependency_duplicate")
        dependency_ids.add(dependency_id)
        relative = Path(_identifier(dependency["path"], "court_policy_dependency_invalid"))
        if relative.is_absolute() or ".." in relative.parts:
            _fail("court_policy_dependency_path_unsafe")
        dependency_path = (root / relative).resolve()
        if root != dependency_path and root not in dependency_path.parents:
            _fail("court_policy_dependency_path_unsafe")
        expected_sha = _sha(dependency["sha256"], "court_policy_dependency_hash_invalid")
        if _dependency_file_sha256(dependency_path) != expected_sha:
            _fail(f"court_policy_dependency_hash_mismatch:{dependency_id}")
        expected_fingerprint = _sha(
            dependency["fingerprint"], "court_policy_dependency_fingerprint_invalid"
        )
        field_name = dependency["fingerprintField"]
        if field_name is None:
            if expected_fingerprint != expected_sha:
                _fail(f"court_policy_dependency_fingerprint_mismatch:{dependency_id}")
        else:
            if not isinstance(field_name, str) or not field_name:
                _fail("court_policy_dependency_fingerprint_field_invalid")
            try:
                dependency_document = json.loads(dependency_path.read_text(encoding="utf-8"))
            except (OSError, json.JSONDecodeError) as error:
                raise CourtRuntimeError("court_policy_dependency_unreadable") from error
            if dependency_document.get(field_name) != expected_fingerprint:
                _fail(f"court_policy_dependency_fingerprint_mismatch:{dependency_id}")
        dependencies.append(freeze_json(dependency))

    generic = _exact_keys(
        document["genericLedgerContract"],
        {"schemaVersion", "genesisSha256", "envelopeFields"},
        "court_policy_generic_ledger_invalid",
    )
    if (
        generic["schemaVersion"] != LEDGER_EVENT_SCHEMA_VERSION
        or generic["genesisSha256"] != GENESIS_SHA256
        or generic["envelopeFields"]
        != ["sequence", "previous_event_sha256", "payload", "payload_sha256", "event_sha256"]
    ):
        _fail("court_policy_generic_ledger_mismatch")

    positions_document = document["positions"]
    if not isinstance(positions_document, list) or len(positions_document) != 5:
        _fail("court_policy_positions_invalid")
    positions: list[Mapping[str, Any]] = []
    for index, item in enumerate(positions_document):
        position = _exact_keys(
            item,
            {"positionId", "index", "pitchMask", "poleVector", "internalPoles", "kappaCourt"},
            "court_policy_position_invalid",
        )
        ratio = _exact_keys(
            position["kappaCourt"], {"numerator", "denominator"}, "court_policy_kappa_invalid"
        )
        expected = {
            "positionId": COURT_POSITIONS[index],
            "index": index,
            "pitchMask": COURT_MASKS[index],
            "poleVector": COURT_POLE_VECTORS[index],
            "internalPoles": list(COURT_POLE_ORDER[:index]),
            "kappaCourt": {"numerator": COURT_KAPPA[index][0], "denominator": COURT_KAPPA[index][1]},
        }
        if dict(position) != expected or ExactRatio(ratio["numerator"], ratio["denominator"]) != ExactRatio(*COURT_KAPPA[index]):
            _fail("court_policy_position_derivation_mismatch")
        positions.append(freeze_json(position))

    moves_document = document["ordinaryMoves"]
    if not isinstance(moves_document, list) or len(moves_document) != 8:
        _fail("court_policy_ordinary_moves_invalid")
    moves: list[tuple[str, str, str]] = []
    for item in moves_document:
        move = _exact_keys(item, {"source", "target", "operationId"}, "court_policy_move_invalid")
        source_index = _position_index(move["source"])
        target_index = _position_index(move["target"])
        operation = move["operationId"]
        expected_operation = "court:advance" if target_index - source_index == 1 else "court:retreat"
        if abs(target_index - source_index) != 1 or operation != expected_operation:
            _fail("court_policy_move_not_adjacent")
        moves.append((move["source"], move["target"], operation))
    expected_moves = {
        (COURT_POSITIONS[i], COURT_POSITIONS[j], "court:advance" if j > i else "court:retreat")
        for i in range(5) for j in range(5) if abs(i - j) == 1
    }
    if set(moves) != expected_moves:
        _fail("court_policy_move_closure_mismatch")

    evidence = _validate_policy_translocation_evidence(document["translocationEvidence"])
    return CourtRuntimePolicy(
        policy_id=document["policyId"],
        admission=document["integratedAdmission"],
        policy_fingerprint=fingerprint,
        dependencies=tuple(dependencies),
        positions=tuple(positions),
        ordinary_moves=tuple(moves),
        operation_allow_list=tuple(document["operationAllowList"]),
        required_capabilities=freeze_json(document["requiredCapabilities"]),
        translocation_evidence=evidence,
        document=freeze_json(document),
    )


def _validate_policy_translocation_evidence(value: Any) -> Mapping[str, Any]:
    evidence = _exact_keys(
        value,
        {"evidencePath", "evidenceSha256", "filterAlgebraFingerprint", "classification", "routeCostStatus", "directions", "routes"},
        "court_policy_translocation_evidence_invalid",
    )
    if (
        evidence["evidencePath"] != "seven-governors-mutation-algebra-audit/audit/operator-applications.csv"
        or evidence["evidenceSha256"] != "1f7b2abb047132fa957f761a73e7c76038766f617bed9c916f971a8c0072f53e"
        or evidence["filterAlgebraFingerprint"] != "40bd74397ff9f4c8c0f0b845630e008cea66c9495413195c1e1c92ff02968589"
        or evidence["classification"] != "right_undefined"
        or evidence["routeCostStatus"] != "unresolved"
    ):
        _fail("court_policy_translocation_evidence_mismatch")
    directions = evidence["directions"]
    routes = evidence["routes"]
    if not isinstance(directions, list) or len(directions) != 2 or not isinstance(routes, list) or len(routes) != 4:
        _fail("court_policy_translocation_evidence_invalid")
    expected_direction_keys = {
        "operatorId", "alteredDegree", "degreeGovernor", "direction", "sourceScaleStateId",
        "sourcePitchMask", "sourceForte", "targetScaleStateId", "targetPitchMask",
        "targetForte", "sourcePitch", "targetPitch", "deltaSemitones", "applicationId",
    }
    expected_directions = {
        ("R7", 1453, "7-35", 2477, "7-32", 10, 11, 1, "raise", "R7:1453:2477"),
        ("L7", 2477, "7-32", 1453, "7-35", 11, 10, -1, "lower", "L7:2477:1453"),
    }
    actual_directions = set()
    for item in directions:
        direction = _exact_keys(item, expected_direction_keys, "court_policy_translocation_direction_invalid")
        if direction["alteredDegree"] != 7 or direction["degreeGovernor"] != "Moon" or direction["sourcePitchMask"] != direction["sourceScaleStateId"] or direction["targetPitchMask"] != direction["targetScaleStateId"]:
            _fail("court_policy_translocation_direction_mismatch")
        actual_directions.add((direction["operatorId"], direction["sourceScaleStateId"], direction["sourceForte"], direction["targetScaleStateId"], direction["targetForte"], direction["sourcePitch"], direction["targetPitch"], direction["deltaSemitones"], direction["direction"], direction["applicationId"]))
    if actual_directions != expected_directions:
        _fail("court_policy_translocation_direction_mismatch")
    route_keys = {"forteFamily", "filterId", "filterMask", "operatorId", "sourceScaleStateId", "targetScaleStateId", "staticRouteRecordId"}
    route_tuples = set()
    for item in routes:
        route = _exact_keys(item, route_keys, "court_policy_translocation_route_invalid")
        route_tuples.add((route["forteFamily"], route["operatorId"], route["sourceScaleStateId"], route["targetScaleStateId"], route["filterId"], route["filterMask"], route["staticRouteRecordId"]))
    expected_routes = set()
    for family, mask in (("5-23", 173), ("5-27", 425)):
        filter_id = f"court-filter:{family}:root-0"
        expected_routes.add((family, "R7", 1453, 2477, filter_id, mask, f"noncomm:{filter_id}:R7:1453"))
        expected_routes.add((family, "L7", 2477, 1453, filter_id, mask, f"noncomm:{filter_id}:L7:2477"))
    if route_tuples != expected_routes:
        _fail("court_policy_translocation_route_mismatch")
    return freeze_json(evidence)


@dataclass(frozen=True, slots=True)
class CourtRuntimeState:
    session_id: str
    position_id: str
    revision: int
    harmonic_profile_sha256: str
    policy_fingerprint: str
    context_fingerprint: str
    capabilities: tuple[str, ...]
    consumed_token_ids: tuple[str, ...]
    pitch_mask: int
    pole_register: PoleRegister
    kappa_court: ExactRatio
    ledger_anchor: LedgerAnchor
    state_sha256: str

    def __post_init__(self) -> None:
        if not isinstance(self.session_id, str) or not _SESSION_ID.fullmatch(self.session_id):
            _fail("unsafe_court_session_id")
        index = _position_index(self.position_id)
        if type(self.revision) is not int or self.revision < 0:
            _fail("court_revision_invalid")
        _sha(self.harmonic_profile_sha256, "court_harmonic_profile_invalid")
        _sha(self.policy_fingerprint, "court_policy_fingerprint_invalid")
        _sha(self.context_fingerprint, "court_context_fingerprint_invalid")
        capabilities = tuple(sorted(set(self.capabilities)))
        if not capabilities or any(not isinstance(item, str) or not item for item in capabilities):
            _fail("court_capabilities_invalid")
        consumed = tuple(sorted(set(self.consumed_token_ids)))
        if any(not isinstance(item, str) or not _SHA256.fullmatch(item) for item in consumed):
            _fail("court_consumed_tokens_invalid")
        if not isinstance(self.ledger_anchor, LedgerAnchor):
            _fail("court_ledger_anchor_invalid")
        if self.pitch_mask != COURT_MASKS[index]:
            _fail("court_pitch_mask_mismatch")
        if self.pole_register != PoleRegister(COURT_POLE_ORDER, COURT_POLE_VECTORS[index], COURT_POLE_ORDER[:index]):
            _fail("court_pole_register_mismatch")
        if self.kappa_court != ExactRatio(*COURT_KAPPA[index]):
            _fail("court_kappa_derivation_mismatch")
        object.__setattr__(self, "capabilities", capabilities)
        object.__setattr__(self, "consumed_token_ids", consumed)
        _sha(self.state_sha256, "court_state_hash_invalid")
        if compute_court_runtime_state_hash(self) != self.state_sha256:
            _fail("court_state_hash_mismatch")


def court_runtime_state_intrinsic_body(state: CourtRuntimeState) -> dict[str, Any]:
    """Return every authoritative state field except the generic ledger anchor."""

    return {
        "schemaVersion": COURT_RUNTIME_STATE_SCHEMA_VERSION,
        "sessionId": state.session_id,
        "positionId": state.position_id,
        "revision": state.revision,
        "harmonicProfileSha256": state.harmonic_profile_sha256,
        "policyFingerprint": state.policy_fingerprint,
        "contextFingerprint": state.context_fingerprint,
        "capabilities": list(state.capabilities),
        "consumedTokenIds": list(state.consumed_token_ids),
        "pitchMask": state.pitch_mask,
        "poleRegister": pole_register_body(state.pole_register),
        "kappaCourt": exact_ratio_body(state.kappa_court),
    }


def compute_court_runtime_state_hash(state: CourtRuntimeState) -> str:
    return sha256_payload(court_runtime_state_intrinsic_body(state))


def serialize_court_runtime_state(state: CourtRuntimeState) -> dict[str, Any]:
    return {
        **court_runtime_state_intrinsic_body(state),
        "stateSha256": state.state_sha256,
        "ledgerAnchor": {
            "eventCount": state.ledger_anchor.event_count,
            "headSha256": state.ledger_anchor.head_sha256,
        },
    }


def create_court_runtime_state(
    *,
    session_id: str,
    position_id: str,
    harmonic_profile_sha256: str,
    context_fingerprint: str,
    capabilities: Iterable[str],
    policy: CourtRuntimePolicy | None = None,
    revision: int = 0,
    consumed_token_ids: Iterable[str] = (),
    ledger_anchor: LedgerAnchor | None = None,
) -> CourtRuntimeState:
    policy = policy or load_court_runtime_policy()
    index = _position_index(position_id)
    anchor = ledger_anchor or LedgerAnchor(0, GENESIS_SHA256)
    values = {
        "session_id": session_id,
        "position_id": position_id,
        "revision": revision,
        "harmonic_profile_sha256": harmonic_profile_sha256,
        "policy_fingerprint": policy.policy_fingerprint,
        "context_fingerprint": context_fingerprint,
        "capabilities": tuple(capabilities),
        "consumed_token_ids": tuple(consumed_token_ids),
        "pitch_mask": COURT_MASKS[index],
        "pole_register": PoleRegister(COURT_POLE_ORDER, COURT_POLE_VECTORS[index], COURT_POLE_ORDER[:index]),
        "kappa_court": ExactRatio(*COURT_KAPPA[index]),
        "ledger_anchor": anchor,
    }
    draft = object.__new__(CourtRuntimeState)
    for name, value in values.items():
        object.__setattr__(draft, name, value)
    object.__setattr__(draft, "capabilities", tuple(sorted(set(values["capabilities"]))))
    object.__setattr__(draft, "consumed_token_ids", tuple(sorted(set(values["consumed_token_ids"]))))
    object.__setattr__(draft, "state_sha256", GENESIS_SHA256)
    return CourtRuntimeState(**values, state_sha256=compute_court_runtime_state_hash(draft))


def deserialize_court_runtime_state(value: Any) -> CourtRuntimeState:
    body = _exact_keys(
        value,
        {"schemaVersion", "sessionId", "positionId", "revision", "harmonicProfileSha256", "policyFingerprint", "contextFingerprint", "capabilities", "consumedTokenIds", "pitchMask", "poleRegister", "kappaCourt", "stateSha256", "ledgerAnchor"},
        "serialized_court_state_invalid",
    )
    if body["schemaVersion"] != COURT_RUNTIME_STATE_SCHEMA_VERSION:
        _fail("court_state_schema_version_mismatch")
    pole = _exact_keys(body["poleRegister"], {"poleOrder", "vector", "internalPoles"}, "serialized_court_poles_invalid")
    ratio = _exact_keys(body["kappaCourt"], {"numerator", "denominator"}, "serialized_court_kappa_invalid")
    anchor = _exact_keys(body["ledgerAnchor"], {"eventCount", "headSha256"}, "serialized_court_anchor_invalid")
    try:
        return CourtRuntimeState(
            session_id=body["sessionId"], position_id=body["positionId"], revision=body["revision"],
            harmonic_profile_sha256=body["harmonicProfileSha256"], policy_fingerprint=body["policyFingerprint"],
            context_fingerprint=body["contextFingerprint"], capabilities=tuple(body["capabilities"]),
            consumed_token_ids=tuple(body["consumedTokenIds"]), pitch_mask=body["pitchMask"],
            pole_register=PoleRegister(tuple(pole["poleOrder"]), pole["vector"], tuple(pole["internalPoles"])),
            kappa_court=ExactRatio(ratio["numerator"], ratio["denominator"]),
            ledger_anchor=LedgerAnchor(anchor["eventCount"], anchor["headSha256"]), state_sha256=body["stateSha256"],
        )
    except (KeyError, TypeError, ValueError) as error:
        if isinstance(error, CourtRuntimeError):
            raise
        raise CourtRuntimeError("serialized_court_state_invalid") from error


def write_kappa_coordinate(namespace: str, value: ExactRatio | Mapping[str, int]) -> ExactRatio:
    """Validate a typed kappa write without permitting cross-namespace aliases."""

    if namespace != "court.kappa_court":
        _fail("kappa_cross_namespace_write")
    if isinstance(value, ExactRatio):
        return value
    if isinstance(value, Mapping) and set(value) == {"numerator", "denominator"}:
        return ExactRatio(value["numerator"], value["denominator"])
    _fail("exact_ratio_invalid")


@dataclass(frozen=True, slots=True)
class CourtRouteContext:
    forte_family: str
    filter_id: str
    filter_mask: int
    classification: str
    static_route_record_id: str
    route_cost_status: str
    route_context_hash: str

    def __post_init__(self) -> None:
        if self.forte_family not in ("5-23", "5-27"):
            _fail("translocation_route_family_mismatch")
        expected_mask = 173 if self.forte_family == "5-23" else 425
        if self.filter_id != f"court-filter:{self.forte_family}:root-0" or self.filter_mask != expected_mask:
            _fail("translocation_filter_mismatch")
        if self.classification != "right_undefined":
            _fail("translocation_classification_mismatch")
        if self.route_cost_status != "unresolved":
            _fail("translocation_route_cost_must_be_unresolved")
        _sha(self.route_context_hash, "route_context_hash_invalid")
        if self.route_context_hash != sha256_payload(court_route_context_identity_body(self)):
            _fail("route_context_hash_mismatch")


def court_route_context_identity_body(value: CourtRouteContext) -> dict[str, Any]:
    return {
        "schemaVersion": COURT_ROUTE_CONTEXT_SCHEMA_VERSION,
        "forteFamily": value.forte_family,
        "filterId": value.filter_id,
        "filterMask": value.filter_mask,
        "classification": value.classification,
        "staticRouteRecordId": value.static_route_record_id,
        "routeCostStatus": value.route_cost_status,
    }


def serialize_court_route_context(value: CourtRouteContext) -> dict[str, Any]:
    return {**court_route_context_identity_body(value), "routeContextHash": value.route_context_hash}


def create_court_route_context(
    *, forte_family: str, operator_id: str, source_scale_state_id: int
) -> CourtRouteContext:
    filter_id = f"court-filter:{forte_family}:root-0"
    values = {
        "forte_family": forte_family,
        "filter_id": filter_id,
        "filter_mask": 173 if forte_family == "5-23" else 425,
        "classification": "right_undefined",
        "static_route_record_id": f"noncomm:{filter_id}:{operator_id}:{source_scale_state_id}",
        "route_cost_status": "unresolved",
    }
    draft = object.__new__(CourtRouteContext)
    for name, item in values.items():
        object.__setattr__(draft, name, item)
    object.__setattr__(draft, "route_context_hash", GENESIS_SHA256)
    return CourtRouteContext(**values, route_context_hash=sha256_payload(court_route_context_identity_body(draft)))


@dataclass(frozen=True, slots=True)
class TopologicalTranslocationRecord:
    source_position: str
    target_position: str
    source_scale_state_id: int
    source_pitch_mask: int
    source_forte: str
    target_scale_state_id: int
    target_pitch_mask: int
    target_forte: str
    operator_id: str
    altered_degree: int
    degree_governor: str
    direction: str
    source_pitch: int
    target_pitch: int
    delta_semitones: int
    application_id: str
    evidence_path: str
    evidence_sha256: str
    crt304_fingerprint: str
    filter_id: str
    filter_mask: int
    classification: str
    static_route_record_id: str
    record_hash: str

    def __post_init__(self) -> None:
        source_index = _position_index(self.source_position)
        target_index = _position_index(self.target_position)
        if source_index == target_index:
            _fail("same_state_not_ledger_move")
        if abs(source_index - target_index) == 1:
            _fail("translocation_must_be_non_adjacent")
        expected = _canonical_translocation_values(self.operator_id)
        actual = (
            self.source_scale_state_id, self.source_pitch_mask, self.source_forte,
            self.target_scale_state_id, self.target_pitch_mask, self.target_forte,
            self.altered_degree, self.degree_governor, self.direction, self.source_pitch,
            self.target_pitch, self.delta_semitones, self.application_id,
        )
        if actual != expected:
            _fail("translocation_mutation_evidence_mismatch")
        if self.evidence_path != "seven-governors-mutation-algebra-audit/audit/operator-applications.csv":
            _fail("translocation_evidence_path_mismatch")
        if self.evidence_sha256 != "1f7b2abb047132fa957f761a73e7c76038766f617bed9c916f971a8c0072f53e":
            _fail("translocation_evidence_hash_mismatch")
        if self.crt304_fingerprint != "40bd74397ff9f4c8c0f0b845630e008cea66c9495413195c1e1c92ff02968589":
            _fail("translocation_crt304_fingerprint_mismatch")
        family = "5-23" if self.filter_mask == 173 else "5-27" if self.filter_mask == 425 else None
        if family is None or self.filter_id != f"court-filter:{family}:root-0":
            _fail("translocation_filter_mismatch")
        if self.classification != "right_undefined":
            _fail("translocation_classification_mismatch")
        expected_record_id = f"noncomm:{self.filter_id}:{self.operator_id}:{self.source_scale_state_id}"
        if self.static_route_record_id != expected_record_id:
            _fail("translocation_static_route_record_mismatch")
        _sha(self.record_hash, "translocation_record_hash_invalid")
        if self.record_hash != sha256_payload(translocation_record_identity_body(self)):
            _fail("translocation_record_hash_mismatch")


def _canonical_translocation_values(operator_id: str) -> tuple[Any, ...]:
    if operator_id == "R7":
        return (1453, 1453, "7-35", 2477, 2477, "7-32", 7, "Moon", "raise", 10, 11, 1, "R7:1453:2477")
    if operator_id == "L7":
        return (2477, 2477, "7-32", 1453, 1453, "7-35", 7, "Moon", "lower", 11, 10, -1, "L7:2477:1453")
    _fail("translocation_operator_mismatch")


def translocation_record_identity_body(value: TopologicalTranslocationRecord) -> dict[str, Any]:
    return {
        "schemaVersion": COURT_TRANSLOCATION_SCHEMA_VERSION,
        "compoundTransitionSemantics": "court_position_plus_heptatonic_mutation_no_canonical_mapping",
        "sourcePosition": value.source_position, "targetPosition": value.target_position,
        "sourceScaleState": {"id": value.source_scale_state_id, "pitchMask": value.source_pitch_mask, "forte": value.source_forte},
        "targetScaleState": {"id": value.target_scale_state_id, "pitchMask": value.target_pitch_mask, "forte": value.target_forte},
        "mutation": {"operatorId": value.operator_id, "alteredDegree": value.altered_degree, "degreeGovernor": value.degree_governor, "direction": value.direction, "sourcePitch": value.source_pitch, "targetPitch": value.target_pitch, "deltaSemitones": value.delta_semitones, "applicationId": value.application_id},
        "evidence": {"path": value.evidence_path, "sha256": value.evidence_sha256},
        "crt304": {"fingerprint": value.crt304_fingerprint, "filterId": value.filter_id, "filterMask": value.filter_mask, "operatorId": value.operator_id, "sourceScaleStateId": value.source_scale_state_id, "targetScaleStateId": value.target_scale_state_id, "classification": value.classification, "staticRouteRecordId": value.static_route_record_id},
    }


def serialize_translocation_record(value: TopologicalTranslocationRecord) -> dict[str, Any]:
    return {**translocation_record_identity_body(value), "recordHash": value.record_hash}


def create_topological_translocation_record(
    *,
    source_position: str,
    target_position: str,
    operator_id: str,
    forte_family: str = "5-23",
) -> TopologicalTranslocationRecord:
    values = _canonical_translocation_values(operator_id)
    filter_id = f"court-filter:{forte_family}:root-0"
    filter_mask = {"5-23": 173, "5-27": 425}.get(forte_family)
    if filter_mask is None:
        _fail("translocation_route_family_mismatch")
    fields = {
        "source_position": source_position, "target_position": target_position,
        "source_scale_state_id": values[0], "source_pitch_mask": values[1], "source_forte": values[2],
        "target_scale_state_id": values[3], "target_pitch_mask": values[4], "target_forte": values[5],
        "operator_id": operator_id, "altered_degree": values[6], "degree_governor": values[7],
        "direction": values[8], "source_pitch": values[9], "target_pitch": values[10],
        "delta_semitones": values[11], "application_id": values[12],
        "evidence_path": "seven-governors-mutation-algebra-audit/audit/operator-applications.csv",
        "evidence_sha256": "1f7b2abb047132fa957f761a73e7c76038766f617bed9c916f971a8c0072f53e",
        "crt304_fingerprint": "40bd74397ff9f4c8c0f0b845630e008cea66c9495413195c1e1c92ff02968589",
        "filter_id": filter_id, "filter_mask": filter_mask, "classification": "right_undefined",
        "static_route_record_id": f"noncomm:{filter_id}:{operator_id}:{values[0]}",
    }
    draft = object.__new__(TopologicalTranslocationRecord)
    for name, item in fields.items():
        object.__setattr__(draft, name, item)
    object.__setattr__(draft, "record_hash", GENESIS_SHA256)
    return TopologicalTranslocationRecord(**fields, record_hash=sha256_payload(translocation_record_identity_body(draft)))


def deserialize_translocation_record(value: Any) -> TopologicalTranslocationRecord:
    body = _exact_keys(value, {"schemaVersion", "compoundTransitionSemantics", "sourcePosition", "targetPosition", "sourceScaleState", "targetScaleState", "mutation", "evidence", "crt304", "recordHash"}, "serialized_translocation_invalid")
    if body["schemaVersion"] != COURT_TRANSLOCATION_SCHEMA_VERSION or body["compoundTransitionSemantics"] != "court_position_plus_heptatonic_mutation_no_canonical_mapping":
        _fail("serialized_translocation_invalid")
    source = _exact_keys(body["sourceScaleState"], {"id", "pitchMask", "forte"}, "serialized_translocation_invalid")
    target = _exact_keys(body["targetScaleState"], {"id", "pitchMask", "forte"}, "serialized_translocation_invalid")
    mutation = _exact_keys(body["mutation"], {"operatorId", "alteredDegree", "degreeGovernor", "direction", "sourcePitch", "targetPitch", "deltaSemitones", "applicationId"}, "serialized_translocation_invalid")
    evidence = _exact_keys(body["evidence"], {"path", "sha256"}, "serialized_translocation_invalid")
    crt304 = _exact_keys(body["crt304"], {"fingerprint", "filterId", "filterMask", "operatorId", "sourceScaleStateId", "targetScaleStateId", "classification", "staticRouteRecordId"}, "serialized_translocation_invalid")
    if mutation["operatorId"] != crt304["operatorId"] or source["id"] != crt304["sourceScaleStateId"] or target["id"] != crt304["targetScaleStateId"]:
        _fail("serialized_translocation_invalid")
    return TopologicalTranslocationRecord(
        source_position=body["sourcePosition"], target_position=body["targetPosition"],
        source_scale_state_id=source["id"], source_pitch_mask=source["pitchMask"], source_forte=source["forte"],
        target_scale_state_id=target["id"], target_pitch_mask=target["pitchMask"], target_forte=target["forte"],
        operator_id=mutation["operatorId"], altered_degree=mutation["alteredDegree"], degree_governor=mutation["degreeGovernor"], direction=mutation["direction"], source_pitch=mutation["sourcePitch"], target_pitch=mutation["targetPitch"], delta_semitones=mutation["deltaSemitones"], application_id=mutation["applicationId"],
        evidence_path=evidence["path"], evidence_sha256=evidence["sha256"], crt304_fingerprint=crt304["fingerprint"], filter_id=crt304["filterId"], filter_mask=crt304["filterMask"], classification=crt304["classification"], static_route_record_id=crt304["staticRouteRecordId"], record_hash=body["recordHash"],
    )


def deserialize_court_route_context(value: Any) -> CourtRouteContext:
    body = _exact_keys(value, {"schemaVersion", "forteFamily", "filterId", "filterMask", "classification", "staticRouteRecordId", "routeCostStatus", "routeContextHash"}, "serialized_route_context_invalid")
    if body["schemaVersion"] != COURT_ROUTE_CONTEXT_SCHEMA_VERSION:
        _fail("serialized_route_context_invalid")
    return CourtRouteContext(body["forteFamily"], body["filterId"], body["filterMask"], body["classification"], body["staticRouteRecordId"], body["routeCostStatus"], body["routeContextHash"])


@dataclass(frozen=True, slots=True)
class CourtLegalMove:
    operation_id: str
    target_position: str
    capability: str
    prior_state_sha256: str
    policy_fingerprint: str
    translocation_hash: str | None
    route_context_hash: str | None
    move_hash: str

    def __post_init__(self) -> None:
        if self.operation_id not in COURT_OPERATIONS:
            _fail("court_operation_not_registered")
        _position_index(self.target_position)
        _identifier(self.capability, "court_capability_invalid")
        _sha(self.prior_state_sha256, "court_prior_state_hash_invalid")
        _sha(self.policy_fingerprint, "court_policy_fingerprint_invalid")
        if (self.translocation_hash is None) != (self.route_context_hash is None):
            _fail("court_move_translocation_binding_incomplete")
        if self.translocation_hash is not None:
            _sha(self.translocation_hash, "translocation_record_hash_invalid")
            _sha(self.route_context_hash, "route_context_hash_invalid")
        _sha(self.move_hash, "court_move_hash_invalid")
        if self.move_hash != sha256_payload(court_legal_move_identity_body(self)):
            _fail("court_move_hash_mismatch")


def court_legal_move_identity_body(move: CourtLegalMove) -> dict[str, Any]:
    return {"schemaVersion": COURT_LEGAL_MOVE_SCHEMA_VERSION, "operationId": move.operation_id, "targetPosition": move.target_position, "capability": move.capability, "priorStateSha256": move.prior_state_sha256, "policyFingerprint": move.policy_fingerprint, "translocationHash": move.translocation_hash, "routeContextHash": move.route_context_hash}


def serialize_court_legal_move(move: CourtLegalMove) -> dict[str, Any]:
    return {**court_legal_move_identity_body(move), "moveHash": move.move_hash}


def _create_legal_move(state: CourtRuntimeState, operation: str, target: str, translocation_hash: str | None = None, route_context_hash: str | None = None) -> CourtLegalMove:
    values = {"operation_id": operation, "target_position": target, "capability": "court.translocate" if operation == "court:translocate" else "court.transition", "prior_state_sha256": state.state_sha256, "policy_fingerprint": state.policy_fingerprint, "translocation_hash": translocation_hash, "route_context_hash": route_context_hash}
    draft = object.__new__(CourtLegalMove)
    for name, item in values.items(): object.__setattr__(draft, name, item)
    object.__setattr__(draft, "move_hash", GENESIS_SHA256)
    return CourtLegalMove(**values, move_hash=sha256_payload(court_legal_move_identity_body(draft)))


def list_legal_court_moves(
    state: CourtRuntimeState,
    policy: CourtRuntimePolicy | None = None,
    *,
    translocation_records: Iterable[TopologicalTranslocationRecord] = (),
) -> tuple[CourtLegalMove, ...]:
    """Purely enumerate adjacent moves plus explicitly supplied valid jumps."""

    policy = policy or load_court_runtime_policy()
    if state.policy_fingerprint != policy.policy_fingerprint:
        _fail("policy_fingerprint_mismatch")
    moves = [
        _create_legal_move(state, operation, target)
        for source, target, operation in policy.ordinary_moves
        if source == state.position_id
        and policy.required_capabilities[operation] in state.capabilities
    ]
    for record in translocation_records:
        if not isinstance(record, TopologicalTranslocationRecord):
            _fail("translocation_record_invalid")
        if record.source_position != state.position_id:
            continue
        if policy.required_capabilities["court:translocate"] not in state.capabilities:
            continue
        route = create_court_route_context(forte_family="5-23" if record.filter_mask == 173 else "5-27", operator_id=record.operator_id, source_scale_state_id=record.source_scale_state_id)
        moves.append(_create_legal_move(state, "court:translocate", record.target_position, record.record_hash, route.route_context_hash))
    return tuple(sorted(moves, key=lambda item: (item.target_position, item.operation_id, item.translocation_hash or "")))


@dataclass(frozen=True, slots=True)
class CourtValidationToken:
    token_id: str
    operation_id: str
    target_position: str
    prior_state_sha256: str
    prior_ledger_head: str
    policy_fingerprint: str
    context_fingerprint: str
    capability: str
    issued_revision: int
    expires_after_revision: int
    translocation_hash: str | None
    route_context_hash: str | None

    def __post_init__(self) -> None:
        _sha(self.token_id, "validation_token_id_invalid")
        if self.operation_id not in COURT_OPERATIONS: _fail("court_operation_not_registered")
        _position_index(self.target_position)
        for item, reason in ((self.prior_state_sha256, "court_prior_state_hash_invalid"), (self.prior_ledger_head, "court_prior_ledger_hash_invalid"), (self.policy_fingerprint, "court_policy_fingerprint_invalid"), (self.context_fingerprint, "court_context_fingerprint_invalid")):
            _sha(item, reason)
        _identifier(self.capability, "court_capability_invalid")
        if type(self.issued_revision) is not int or type(self.expires_after_revision) is not int or self.issued_revision < 0 or self.expires_after_revision < self.issued_revision:
            _fail("invalid_token_revision_window")
        if (self.translocation_hash is None) != (self.route_context_hash is None): _fail("validation_token_translocation_binding_incomplete")
        if self.translocation_hash is not None:
            _sha(self.translocation_hash, "translocation_record_hash_invalid"); _sha(self.route_context_hash, "route_context_hash_invalid")
        if self.token_id != sha256_payload(court_validation_token_identity_body(self)):
            _fail("validation_token_identity_mismatch")


def court_validation_token_identity_body(token: CourtValidationToken) -> dict[str, Any]:
    return {"schemaVersion": COURT_VALIDATION_TOKEN_SCHEMA_VERSION, "operationId": token.operation_id, "normalizedParameters": {"targetPosition": token.target_position}, "priorStateSha256": token.prior_state_sha256, "priorLedgerHead": token.prior_ledger_head, "policyFingerprint": token.policy_fingerprint, "contextFingerprint": token.context_fingerprint, "capability": token.capability, "issuedRevision": token.issued_revision, "expiresAfterRevision": token.expires_after_revision, "translocationHash": token.translocation_hash, "routeContextHash": token.route_context_hash}


def serialize_court_validation_token(token: CourtValidationToken) -> dict[str, Any]:
    return {**court_validation_token_identity_body(token), "tokenId": token.token_id}


def deserialize_court_validation_token(value: Any) -> CourtValidationToken:
    body = _exact_keys(value, {"schemaVersion", "operationId", "normalizedParameters", "priorStateSha256", "priorLedgerHead", "policyFingerprint", "contextFingerprint", "capability", "issuedRevision", "expiresAfterRevision", "translocationHash", "routeContextHash", "tokenId"}, "serialized_validation_token_invalid")
    parameters = _exact_keys(body["normalizedParameters"], {"targetPosition"}, "serialized_validation_token_invalid")
    if body["schemaVersion"] != COURT_VALIDATION_TOKEN_SCHEMA_VERSION: _fail("serialized_validation_token_invalid")
    return CourtValidationToken(body["tokenId"], body["operationId"], parameters["targetPosition"], body["priorStateSha256"], body["priorLedgerHead"], body["policyFingerprint"], body["contextFingerprint"], body["capability"], body["issuedRevision"], body["expiresAfterRevision"], body["translocationHash"], body["routeContextHash"])


@dataclass(frozen=True, slots=True)
class CourtValidatedMove:
    operation_id: str
    target_position: str
    capability: str
    token: CourtValidationToken
    translocation_record: TopologicalTranslocationRecord | None = None
    route_context: CourtRouteContext | None = None

    def __post_init__(self) -> None:
        if self.operation_id != self.token.operation_id: _fail("operation_binding_mismatch")
        if self.target_position != self.token.target_position: _fail("parameter_binding_mismatch")
        if self.capability != self.token.capability: _fail("capability_mismatch")
        if (self.translocation_record is None) != (self.route_context is None): _fail("validated_move_translocation_binding_incomplete")
        if self.translocation_record is None:
            if self.token.translocation_hash is not None: _fail("translocation_binding_mismatch")
        elif self.translocation_record.record_hash != self.token.translocation_hash or self.route_context.route_context_hash != self.token.route_context_hash:
            _fail("translocation_binding_mismatch")


def serialize_court_validated_move(move: CourtValidatedMove) -> dict[str, Any]:
    return {
        "schemaVersion": COURT_VALIDATED_MOVE_SCHEMA_VERSION,
        "operationId": move.operation_id,
        "targetPosition": move.target_position,
        "capability": move.capability,
        "token": serialize_court_validation_token(move.token),
        "translocationRecord": (
            serialize_translocation_record(move.translocation_record)
            if move.translocation_record is not None
            else None
        ),
        "routeContext": (
            serialize_court_route_context(move.route_context)
            if move.route_context is not None
            else None
        ),
    }


def deserialize_court_validated_move(value: Any) -> CourtValidatedMove:
    body = _exact_keys(
        value,
        {"schemaVersion", "operationId", "targetPosition", "capability", "token", "translocationRecord", "routeContext"},
        "serialized_validated_move_invalid",
    )
    if body["schemaVersion"] != COURT_VALIDATED_MOVE_SCHEMA_VERSION:
        _fail("serialized_validated_move_invalid")
    record = (
        deserialize_translocation_record(body["translocationRecord"])
        if body["translocationRecord"] is not None
        else None
    )
    route = (
        deserialize_court_route_context(body["routeContext"])
        if body["routeContext"] is not None
        else None
    )
    return CourtValidatedMove(
        body["operationId"],
        body["targetPosition"],
        body["capability"],
        deserialize_court_validation_token(body["token"]),
        record,
        route,
    )


def validate_court_move(
    state: CourtRuntimeState,
    operation_id: str,
    target_position: str,
    *,
    policy: CourtRuntimePolicy | None = None,
    policy_fingerprint: str | None = None,
    context_fingerprint: str | None = None,
    capability: str | None = None,
    expires_after_revision: int | None = None,
    translocation_record: TopologicalTranslocationRecord | None = None,
    route_context: CourtRouteContext | None = None,
) -> CourtValidatedMove:
    policy = policy or load_court_runtime_policy()
    if operation_id not in policy.operation_allow_list: _fail("court_operation_not_registered")
    source_index = _position_index(state.position_id)
    target_index = _position_index(target_position)
    if source_index == target_index: _fail("same_state_not_ledger_move")
    adjacent = abs(source_index - target_index) == 1
    if adjacent:
        expected_operation = "court:advance" if target_index > source_index else "court:retreat"
        if operation_id != expected_operation: _fail("operation_target_mismatch")
        if translocation_record is not None or route_context is not None: _fail("translocation_not_permitted_for_adjacent_move")
    else:
        if translocation_record is None: _fail("non_adjacent_without_translocation")
        if operation_id != "court:translocate": _fail("operation_target_mismatch")
        if translocation_record.source_position != state.position_id: _fail("translocation_source_position_mismatch")
        if translocation_record.target_position != target_position: _fail("translocation_target_position_mismatch")
        if route_context is None: _fail("translocation_route_context_required")
        if route_context.filter_id != translocation_record.filter_id or route_context.filter_mask != translocation_record.filter_mask or route_context.static_route_record_id != translocation_record.static_route_record_id:
            _fail("translocation_route_context_mismatch")
    bound_policy = policy_fingerprint or policy.policy_fingerprint
    bound_context = context_fingerprint or state.context_fingerprint
    expected_capability = policy.required_capabilities[operation_id]
    bound_capability = capability or expected_capability
    if state.policy_fingerprint != policy.policy_fingerprint or bound_policy != state.policy_fingerprint: _fail("policy_fingerprint_mismatch")
    if bound_context != state.context_fingerprint: _fail("context_fingerprint_mismatch")
    if bound_capability != expected_capability or bound_capability not in state.capabilities: _fail("capability_mismatch")
    expiry = state.revision if expires_after_revision is None else expires_after_revision
    values = {"operation_id": operation_id, "target_position": target_position, "prior_state_sha256": state.state_sha256, "prior_ledger_head": state.ledger_anchor.head_sha256, "policy_fingerprint": bound_policy, "context_fingerprint": bound_context, "capability": bound_capability, "issued_revision": state.revision, "expires_after_revision": expiry, "translocation_hash": translocation_record.record_hash if translocation_record else None, "route_context_hash": route_context.route_context_hash if route_context else None}
    draft = object.__new__(CourtValidationToken)
    for name, item in values.items(): object.__setattr__(draft, name, item)
    object.__setattr__(draft, "token_id", GENESIS_SHA256)
    token = CourtValidationToken(token_id=sha256_payload(court_validation_token_identity_body(draft)), **values)
    return CourtValidatedMove(operation_id, target_position, bound_capability, token, translocation_record, route_context)


@dataclass(frozen=True, slots=True)
class CourtTransitionEventBody:
    event_id: str
    event_kind: str
    session_id: str
    prior_state_sha256: str
    resulting_state_sha256: str
    operation_id: str
    intrinsic_data: Mapping[str, Any]
    observation_data: Mapping[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        _sha(self.event_id, "court_event_id_invalid"); _identifier(self.event_kind, "court_event_kind_invalid")
        if not _SESSION_ID.fullmatch(self.session_id): _fail("unsafe_court_session_id")
        _sha(self.prior_state_sha256, "court_prior_state_hash_invalid"); _sha(self.resulting_state_sha256, "court_result_state_hash_invalid")
        if self.operation_id not in COURT_OPERATIONS: _fail("court_operation_not_registered")
        object.__setattr__(self, "intrinsic_data", freeze_json(self.intrinsic_data)); object.__setattr__(self, "observation_data", freeze_json(self.observation_data))
        if self.event_id != sha256_payload(court_transition_event_identity_body(self)): _fail("court_event_id_mismatch")


def court_transition_event_identity_body(body: CourtTransitionEventBody) -> dict[str, Any]:
    return {"schemaVersion": COURT_RUNTIME_EVENT_SCHEMA_VERSION, "eventKind": body.event_kind, "sessionId": body.session_id, "priorStateSha256": body.prior_state_sha256, "resultingStateSha256": body.resulting_state_sha256, "operationId": body.operation_id, "intrinsicData": thaw_json(body.intrinsic_data)}


def serialize_court_transition_event_body(body: CourtTransitionEventBody) -> dict[str, Any]:
    return {**court_transition_event_identity_body(body), "eventId": body.event_id, "observationData": thaw_json(body.observation_data)}


@dataclass(frozen=True, slots=True)
class CourtTransitionResult:
    accepted: bool
    state: CourtRuntimeState
    events: tuple[LedgerEvent, ...]
    event_body: CourtTransitionEventBody | None
    reason_code: str


CourtApplyResult = CourtTransitionResult


def _reject_transition(state: CourtRuntimeState, events: tuple[LedgerEvent, ...], reason: str) -> CourtTransitionResult:
    return CourtTransitionResult(False, state, events, None, reason)


def _pole_delta(source: CourtRuntimeState, target: CourtRuntimeState) -> dict[str, Any] | None:
    source_index = _position_index(source.position_id); target_index = _position_index(target.position_id)
    if abs(source_index - target_index) != 1: return None
    pole_index = min(source_index, target_index)
    return {"pole": COURT_POLE_ORDER[pole_index], "from": source.pole_register.vector[pole_index], "to": target.pole_register.vector[pole_index]}


def _kappa_delta(source: CourtRuntimeState, target: CourtRuntimeState) -> ExactRatio:
    fraction = Fraction(target.kappa_court.numerator, target.kappa_court.denominator) - Fraction(source.kappa_court.numerator, source.kappa_court.denominator)
    return ExactRatio(fraction.numerator, fraction.denominator)


def apply_court_move(
    state: CourtRuntimeState,
    move: CourtValidatedMove,
    events: Iterable[LedgerEvent] = (),
    *,
    policy: CourtRuntimePolicy | None = None,
    verification_decision: VerificationDecision,
    current_revision: int | None = None,
    current_ledger_head: str | None = None,
    context_fingerprint: str | None = None,
    observation_data: Mapping[str, Any] | None = None,
) -> CourtTransitionResult:
    materialized = tuple(events)
    policy = policy or load_court_runtime_policy()
    token = move.token
    checks = (
        (verify_ledger(materialized, state.ledger_anchor).valid, "existing_court_ledger_invalid"),
        (token.token_id not in state.consumed_token_ids, "validation_token_reused"),
        (token.operation_id == move.operation_id, "operation_binding_mismatch"),
        (token.target_position == move.target_position, "parameter_binding_mismatch"),
        (token.prior_state_sha256 == state.state_sha256, "stale_state"),
        (token.prior_ledger_head == state.ledger_anchor.head_sha256, "stale_ledger"),
        (token.policy_fingerprint == state.policy_fingerprint == policy.policy_fingerprint, "policy_fingerprint_mismatch"),
        (token.context_fingerprint == state.context_fingerprint == (context_fingerprint or state.context_fingerprint), "context_fingerprint_mismatch"),
        (token.capability == move.capability == policy.required_capabilities.get(move.operation_id) and token.capability in state.capabilities, "capability_mismatch"),
        (token.issued_revision == state.revision, "stale_validation_token"),
        ((current_revision if current_revision is not None else state.revision) <= token.expires_after_revision, "expired_validation_token"),
        ((current_revision if current_revision is not None else state.revision) == state.revision, "stale_state"),
        ((current_ledger_head if current_ledger_head is not None else state.ledger_anchor.head_sha256) == state.ledger_anchor.head_sha256, "stale_ledger"),
    )
    for accepted, reason in checks:
        if not accepted: return _reject_transition(state, materialized, reason)
    if not isinstance(verification_decision, VerificationDecision):
        return _reject_transition(state, materialized, "verification_decision_invalid")
    if not verification_decision.passed:
        return _reject_transition(state, materialized, "verification_not_verified")
    evidence_ids = verification_decision.evidence_ids
    if not evidence_ids or any(not isinstance(item, str) or not _SHA256.fullmatch(item) or item == GENESIS_SHA256 for item in evidence_ids):
        return _reject_transition(state, materialized, "verification_evidence_invalid")
    try:
        revalidated = validate_court_move(state, move.operation_id, move.target_position, policy=policy, policy_fingerprint=token.policy_fingerprint, context_fingerprint=token.context_fingerprint, capability=token.capability, expires_after_revision=token.expires_after_revision, translocation_record=move.translocation_record, route_context=move.route_context)
    except CourtRuntimeError as error:
        return _reject_transition(state, materialized, error.reason_code)
    if revalidated.token.token_id != token.token_id: return _reject_transition(state, materialized, "validation_token_identity_mismatch")
    next_state = create_court_runtime_state(
        session_id=state.session_id, position_id=move.target_position, revision=state.revision + 1,
        harmonic_profile_sha256=state.harmonic_profile_sha256, context_fingerprint=state.context_fingerprint,
        capabilities=state.capabilities, policy=policy, consumed_token_ids=state.consumed_token_ids + (token.token_id,), ledger_anchor=state.ledger_anchor,
    )
    intrinsic = {
        "token": serialize_court_validation_token(token), "targetPosition": move.target_position,
        "verificationStatus": "VERIFIED", "evidenceEventIds": list(evidence_ids),
        "stateAfter": serialize_court_runtime_state(next_state),
        "poleDelta": _pole_delta(state, next_state), "kappaDelta": exact_ratio_body(_kappa_delta(state, next_state)),
        "translocationRecord": serialize_translocation_record(move.translocation_record) if move.translocation_record else None,
        "routeContext": serialize_court_route_context(move.route_context) if move.route_context else None,
    }
    draft = object.__new__(CourtTransitionEventBody)
    event_values = {"event_kind": "court_transition_applied", "session_id": state.session_id, "prior_state_sha256": state.state_sha256, "resulting_state_sha256": next_state.state_sha256, "operation_id": move.operation_id, "intrinsic_data": intrinsic, "observation_data": observation_data or {}}
    for name, item in event_values.items(): object.__setattr__(draft, name, freeze_json(item) if name.endswith("data") else item)
    object.__setattr__(draft, "event_id", GENESIS_SHA256)
    body = CourtTransitionEventBody(event_id=sha256_payload(court_transition_event_identity_body(draft)), **event_values)
    payload = serialize_court_transition_event_body(body)
    unsealed = LedgerEvent(len(materialized) + 1, state.ledger_anchor.head_sha256, payload, sha256_payload(payload), GENESIS_SHA256)
    event = replace(unsealed, event_sha256=compute_event_hash(unsealed))
    committed = replace(next_state, ledger_anchor=LedgerAnchor(event.sequence, event.event_sha256))
    return CourtTransitionResult(True, committed, materialized + (event,), body, "ok")


@dataclass(frozen=True, slots=True)
class CourtRuntimeSnapshot:
    state_sha256: str
    kappa_court: ExactRatio
    event_count: int
    ledger_head: str
    policy_fingerprint: str
    context_fingerprint: str
    snapshot_hash: str

    def __post_init__(self) -> None:
        _sha(self.state_sha256, "snapshot_state_hash_invalid"); _sha(self.ledger_head, "snapshot_ledger_head_invalid"); _sha(self.policy_fingerprint, "snapshot_policy_invalid"); _sha(self.context_fingerprint, "snapshot_context_invalid"); _sha(self.snapshot_hash, "snapshot_hash_invalid")
        if type(self.event_count) is not int or self.event_count < 0: _fail("snapshot_event_count_invalid")
        if self.snapshot_hash != sha256_payload(court_runtime_snapshot_identity_body(self)): _fail("snapshot_hash_mismatch")


CourtLedgerSnapshot = CourtRuntimeSnapshot


def court_runtime_snapshot_identity_body(snapshot: CourtRuntimeSnapshot) -> dict[str, Any]:
    return {"schemaVersion": COURT_RUNTIME_SNAPSHOT_SCHEMA_VERSION, "stateSha256": snapshot.state_sha256, "kappaCourt": exact_ratio_body(snapshot.kappa_court), "eventCount": snapshot.event_count, "ledgerHead": snapshot.ledger_head, "policyFingerprint": snapshot.policy_fingerprint, "contextFingerprint": snapshot.context_fingerprint}


def create_court_runtime_snapshot(state: CourtRuntimeState) -> CourtRuntimeSnapshot:
    values = {"state_sha256": state.state_sha256, "kappa_court": state.kappa_court, "event_count": state.ledger_anchor.event_count, "ledger_head": state.ledger_anchor.head_sha256, "policy_fingerprint": state.policy_fingerprint, "context_fingerprint": state.context_fingerprint}
    draft = object.__new__(CourtRuntimeSnapshot)
    for name, item in values.items(): object.__setattr__(draft, name, item)
    object.__setattr__(draft, "snapshot_hash", GENESIS_SHA256)
    return CourtRuntimeSnapshot(**values, snapshot_hash=sha256_payload(court_runtime_snapshot_identity_body(draft)))


def serialize_court_runtime_snapshot(snapshot: CourtRuntimeSnapshot) -> dict[str, Any]:
    return {**court_runtime_snapshot_identity_body(snapshot), "snapshotHash": snapshot.snapshot_hash}


def deserialize_court_runtime_snapshot(value: Any) -> CourtRuntimeSnapshot:
    body = _exact_keys(value, {"schemaVersion", "stateSha256", "kappaCourt", "eventCount", "ledgerHead", "policyFingerprint", "contextFingerprint", "snapshotHash"}, "serialized_snapshot_invalid")
    ratio = _exact_keys(body["kappaCourt"], {"numerator", "denominator"}, "serialized_snapshot_invalid")
    if body["schemaVersion"] != COURT_RUNTIME_SNAPSHOT_SCHEMA_VERSION: _fail("serialized_snapshot_invalid")
    return CourtRuntimeSnapshot(body["stateSha256"], ExactRatio(ratio["numerator"], ratio["denominator"]), body["eventCount"], body["ledgerHead"], body["policyFingerprint"], body["contextFingerprint"], body["snapshotHash"])


@dataclass(frozen=True, slots=True)
class CourtReplayResult:
    valid: bool
    state: CourtRuntimeState
    snapshot: CourtRuntimeSnapshot | None
    first_failing_sequence: int | None
    reason_code: str


CourtRuntimeReplayResult = CourtReplayResult
CourtRuntimeTransitionEventBody = CourtTransitionEventBody


def serialize_court_replay_result(result: CourtReplayResult) -> dict[str, Any]:
    return {
        "schemaVersion": COURT_RUNTIME_REPLAY_SCHEMA_VERSION,
        "valid": result.valid,
        "state": serialize_court_runtime_state(result.state),
        "snapshot": (
            serialize_court_runtime_snapshot(result.snapshot)
            if result.snapshot is not None
            else None
        ),
        "firstFailingSequence": result.first_failing_sequence,
        "reasonCode": result.reason_code,
    }


def _replay_failure(state: CourtRuntimeState, sequence: int | None, reason: str) -> CourtReplayResult:
    return CourtReplayResult(False, state, None, sequence, reason)


def _event_body_from_payload(value: Any) -> CourtTransitionEventBody:
    payload = _exact_keys(value, {"schemaVersion", "eventKind", "sessionId", "priorStateSha256", "resultingStateSha256", "operationId", "intrinsicData", "eventId", "observationData"}, "court_event_payload_invalid")
    if payload["schemaVersion"] != COURT_RUNTIME_EVENT_SCHEMA_VERSION: _fail("court_event_schema_mismatch")
    return CourtTransitionEventBody(payload["eventId"], payload["eventKind"], payload["sessionId"], payload["priorStateSha256"], payload["resultingStateSha256"], payload["operationId"], payload["intrinsicData"], payload["observationData"])


def replay_court_runtime_ledger(
    initial_state: CourtRuntimeState,
    events: Iterable[LedgerEvent],
    trusted_anchor: LedgerAnchor,
    *,
    policy: CourtRuntimePolicy | None = None,
    expected_snapshot: CourtRuntimeSnapshot | None = None,
) -> CourtReplayResult:
    materialized = tuple(events); policy = policy or load_court_runtime_policy()
    chain = verify_ledger(materialized, trusted_anchor)
    if not chain.valid: return _replay_failure(initial_state, chain.first_failing_sequence, chain.reason_code)
    if initial_state.revision != 0 or initial_state.consumed_token_ids or initial_state.ledger_anchor.event_count != 0 or initial_state.ledger_anchor.head_sha256 != GENESIS_SHA256:
        return _replay_failure(initial_state, 1 if materialized else None, "court_genesis_state_invalid")
    if initial_state.policy_fingerprint != policy.policy_fingerprint: return _replay_failure(initial_state, 1 if materialized else None, "policy_fingerprint_mismatch")
    state = initial_state
    for sequence, event in enumerate(materialized, 1):
        try:
            body = _event_body_from_payload(thaw_json(event.payload))
            if body.event_kind != "court_transition_applied": _fail("court_event_kind_invalid")
            if body.session_id != state.session_id: _fail("court_event_session_mismatch")
            if body.prior_state_sha256 != state.state_sha256: _fail("court_event_prior_state_mismatch")
            intrinsic = _exact_keys(thaw_json(body.intrinsic_data), {"token", "targetPosition", "verificationStatus", "evidenceEventIds", "stateAfter", "poleDelta", "kappaDelta", "translocationRecord", "routeContext"}, "court_event_intrinsic_invalid")
            if intrinsic["verificationStatus"] != "VERIFIED": _fail("verification_not_verified")
            evidence_ids = intrinsic["evidenceEventIds"]
            if not isinstance(evidence_ids, list) or not evidence_ids or evidence_ids != sorted(set(evidence_ids)) or any(not isinstance(item, str) or not _SHA256.fullmatch(item) or item == GENESIS_SHA256 for item in evidence_ids): _fail("verification_evidence_invalid")
            token = deserialize_court_validation_token(intrinsic["token"])
            if token.token_id in state.consumed_token_ids: _fail("validation_token_reused")
            if token.prior_state_sha256 != state.state_sha256: _fail("stale_state")
            if token.prior_ledger_head != state.ledger_anchor.head_sha256: _fail("stale_ledger")
            if token.policy_fingerprint != state.policy_fingerprint: _fail("policy_fingerprint_mismatch")
            if token.context_fingerprint != state.context_fingerprint: _fail("context_fingerprint_mismatch")
            if token.issued_revision != state.revision or state.revision > token.expires_after_revision: _fail("expired_validation_token")
            record = deserialize_translocation_record(intrinsic["translocationRecord"]) if intrinsic["translocationRecord"] is not None else None
            route = deserialize_court_route_context(intrinsic["routeContext"]) if intrinsic["routeContext"] is not None else None
            revalidated = validate_court_move(state, body.operation_id, intrinsic["targetPosition"], policy=policy, policy_fingerprint=token.policy_fingerprint, context_fingerprint=token.context_fingerprint, capability=token.capability, expires_after_revision=token.expires_after_revision, translocation_record=record, route_context=route)
            if revalidated.token.token_id != token.token_id: _fail("validation_token_identity_mismatch")
            serialized_after = dict(intrinsic["stateAfter"])
            anchor_body = serialized_after.get("ledgerAnchor")
            if anchor_body != {"eventCount": state.ledger_anchor.event_count, "headSha256": state.ledger_anchor.head_sha256}: _fail("court_event_uncommitted_anchor_mismatch")
            next_uncommitted = deserialize_court_runtime_state(serialized_after)
            if next_uncommitted.revision != state.revision + 1: _fail("court_transition_revision_mismatch")
            if next_uncommitted.session_id != state.session_id or next_uncommitted.harmonic_profile_sha256 != state.harmonic_profile_sha256 or next_uncommitted.policy_fingerprint != state.policy_fingerprint or next_uncommitted.context_fingerprint != state.context_fingerprint or next_uncommitted.capabilities != state.capabilities: _fail("court_result_state_binding_mismatch")
            if next_uncommitted.consumed_token_ids != tuple(sorted(state.consumed_token_ids + (token.token_id,))): _fail("court_consumed_tokens_mismatch")
            if body.resulting_state_sha256 != next_uncommitted.state_sha256: _fail("court_event_result_state_mismatch")
            expected_pole_delta = _pole_delta(state, next_uncommitted)
            if intrinsic["poleDelta"] != expected_pole_delta: _fail("court_pole_delta_mismatch")
            if intrinsic["kappaDelta"] != exact_ratio_body(_kappa_delta(state, next_uncommitted)): _fail("court_kappa_delta_mismatch")
            state = replace(next_uncommitted, ledger_anchor=LedgerAnchor(sequence, event.event_sha256))
        except (CourtRuntimeError, KeyError, TypeError, ValueError) as error:
            reason = error.reason_code if isinstance(error, CourtRuntimeError) else "court_event_semantic_invalid"
            return _replay_failure(state, sequence, reason)
    if state.ledger_anchor != trusted_anchor: return _replay_failure(state, max(1, len(materialized)), "court_anchor_mismatch")
    snapshot = create_court_runtime_snapshot(state)
    if expected_snapshot is not None and expected_snapshot != snapshot: return _replay_failure(state, max(1, len(materialized)), "court_snapshot_mismatch")
    return CourtReplayResult(True, state, snapshot, None, "ok")


def serialize_ledger_event(event: LedgerEvent) -> dict[str, Any]:
    return {"sequence": event.sequence, "previousEventSha256": event.previous_event_sha256, "payload": thaw_json(event.payload), "payloadSha256": event.payload_sha256, "eventSha256": event.event_sha256}


def deserialize_ledger_event(value: Any) -> LedgerEvent:
    body = _exact_keys(value, {"sequence", "previousEventSha256", "payload", "payloadSha256", "eventSha256"}, "serialized_ledger_event_invalid")
    try:
        event = LedgerEvent(body["sequence"], body["previousEventSha256"], body["payload"], body["payloadSha256"], body["eventSha256"])
    except (TypeError, ValueError) as error:
        raise CourtRuntimeError("serialized_ledger_event_invalid") from error
    return event


__all__ = (
    "COURT_RUNTIME_EVENT_SCHEMA_VERSION", "COURT_RUNTIME_POLICY_SCHEMA_VERSION", "COURT_RUNTIME_REPLAY_SCHEMA_VERSION",
    "COURT_RUNTIME_SNAPSHOT_SCHEMA_VERSION", "COURT_RUNTIME_STATE_SCHEMA_VERSION", "CourtApplyResult", "CourtLegalMove",
    "CourtLedgerSnapshot", "CourtReplayResult", "CourtRouteContext", "CourtRuntimeError", "CourtRuntimePolicy",
    "CourtRuntimeReplayResult", "CourtRuntimeSnapshot", "CourtRuntimeState", "CourtRuntimeTransitionEventBody", "CourtTransitionEventBody", "CourtTransitionResult", "CourtValidatedMove",
    "CourtValidationToken", "ExactRatio", "PoleRegister", "TopologicalTranslocationRecord", "apply_court_move",
    "compute_court_runtime_state_hash", "create_court_route_context", "create_court_runtime_snapshot",
    "create_court_runtime_state", "create_topological_translocation_record", "deserialize_court_route_context",
    "deserialize_court_runtime_snapshot", "deserialize_court_runtime_state", "deserialize_court_validated_move", "deserialize_court_validation_token",
    "deserialize_ledger_event", "deserialize_translocation_record", "list_legal_court_moves", "load_court_runtime_policy",
    "replay_court_runtime_ledger", "serialize_court_route_context", "serialize_court_runtime_snapshot",
    "serialize_court_legal_move", "serialize_court_replay_result", "serialize_court_runtime_state", "serialize_court_transition_event_body", "serialize_court_validated_move", "serialize_court_validation_token",
    "serialize_ledger_event", "serialize_translocation_record", "validate_court_move", "write_kappa_coordinate",
)
