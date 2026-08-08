"""Authoritative runtime contracts layered over the generic ledger envelope."""

from __future__ import annotations

from dataclasses import dataclass, field, replace
from typing import Any

from .harmonic_models import HarmonicContextManifest
from .hashing import sha256_payload
from .ledger import GENESIS_SHA256
from .models import (
    FrozenDict,
    LedgerAnchor,
    _require_identifier,
    _require_sha256,
    _sorted_unique,
    freeze_json,
    thaw_json,
)


RUNTIME_SCHEMA_VERSION = "gov-204.runtime.v1"


class TransitionError(ValueError):
    """A stable fail-closed transition rejection."""

    def __init__(self, reason_code: str) -> None:
        super().__init__(reason_code)
        self.reason_code = reason_code


@dataclass(frozen=True, slots=True)
class OperationSpec:
    operation_id: str
    capability: str
    allowed_phases: tuple[str, ...]
    result_phase: str
    parameter_schema: FrozenDict | dict[str, Any] = field(default_factory=FrozenDict)
    required_parameters: tuple[str, ...] = ()
    defaults: FrozenDict | dict[str, Any] = field(default_factory=FrozenDict)
    search_dimensions: tuple[str, ...] = ()
    requires_harmonic_validation: bool = False

    def __post_init__(self) -> None:
        _require_identifier(self.operation_id, "operation_id")
        _require_identifier(self.capability, "capability")
        phases = _sorted_unique(self.allowed_phases, "allowed_phases")
        if not phases:
            raise ValueError("operation_requires_allowed_phase")
        _require_identifier(self.result_phase, "result_phase")
        schema = freeze_json(self.parameter_schema)
        defaults = freeze_json(self.defaults)
        required = _sorted_unique(self.required_parameters, "required_parameters")
        dimensions = _sorted_unique(self.search_dimensions, "search_dimensions")
        if any(name not in schema for name in required):
            raise ValueError("required_parameter_missing_schema")
        if any(name not in schema for name in defaults):
            raise ValueError("default_parameter_missing_schema")
        if type(self.requires_harmonic_validation) is not bool:
            raise ValueError("requires_harmonic_validation_must_be_boolean")
        object.__setattr__(self, "allowed_phases", phases)
        object.__setattr__(self, "parameter_schema", schema)
        object.__setattr__(self, "required_parameters", required)
        object.__setattr__(self, "defaults", defaults)
        object.__setattr__(self, "search_dimensions", dimensions)


@dataclass(frozen=True, slots=True)
class AgentState:
    task_id: str
    revision: int
    phase: str
    policy_sha256: str
    context_sha256: str
    capabilities: tuple[str, ...]
    data: FrozenDict | dict[str, Any]
    pending_attempt_id: str | None
    consumed_token_ids: tuple[str, ...]
    ledger_anchor: LedgerAnchor
    state_sha256: str

    def __post_init__(self) -> None:
        _require_identifier(self.task_id, "task_id")
        if isinstance(self.revision, bool) or self.revision < 0:
            raise ValueError("revision_must_be_nonnegative")
        _require_identifier(self.phase, "phase")
        _require_sha256(self.policy_sha256, "policy_sha256")
        _require_sha256(self.context_sha256, "context_sha256")
        capabilities = _sorted_unique(self.capabilities, "capabilities")
        if not capabilities:
            raise ValueError("state_requires_capability")
        if self.pending_attempt_id is not None:
            _require_identifier(self.pending_attempt_id, "pending_attempt_id")
        tokens = _sorted_unique(self.consumed_token_ids, "consumed_token_ids")
        object.__setattr__(self, "capabilities", capabilities)
        object.__setattr__(self, "consumed_token_ids", tokens)
        object.__setattr__(self, "data", freeze_json(self.data))
        _require_sha256(self.state_sha256, "state_sha256")
        if compute_agent_state_hash(self) != self.state_sha256:
            raise ValueError("state_sha256_mismatch")


def agent_state_body(state: AgentState) -> dict[str, Any]:
    """Return authoritative state fields; ledger position is bound separately."""

    return {
        "schema_version": RUNTIME_SCHEMA_VERSION,
        "task_id": state.task_id,
        "revision": state.revision,
        "phase": state.phase,
        "policy_sha256": state.policy_sha256,
        "context_sha256": state.context_sha256,
        "capabilities": list(state.capabilities),
        "data": thaw_json(state.data),
        "pending_attempt_id": state.pending_attempt_id,
        "consumed_token_ids": list(state.consumed_token_ids),
    }


def compute_agent_state_hash(state: AgentState) -> str:
    return sha256_payload(agent_state_body(state))


def create_agent_state(
    *,
    task_id: str,
    phase: str,
    policy_sha256: str,
    capabilities: tuple[str, ...],
    context_sha256: str | None = None,
    data: dict[str, Any] | FrozenDict | None = None,
    revision: int = 0,
    pending_attempt_id: str | None = None,
    consumed_token_ids: tuple[str, ...] = (),
    ledger_anchor: LedgerAnchor | None = None,
    harmonic_context_manifest: HarmonicContextManifest | None = None,
) -> AgentState:
    if harmonic_context_manifest is not None:
        if not isinstance(harmonic_context_manifest, HarmonicContextManifest):
            raise TypeError("harmonic_context_manifest_must_be_manifest")
        manifest_sha256 = harmonic_context_manifest.context_sha256
        if context_sha256 is not None and context_sha256 != manifest_sha256:
            raise ValueError("harmonic_context_fingerprint_mismatch")
        bound_context_sha256 = manifest_sha256
    else:
        if context_sha256 is None:
            raise ValueError("context_sha256_or_harmonic_manifest_required")
        bound_context_sha256 = context_sha256

    draft = object.__new__(AgentState)
    object.__setattr__(draft, "task_id", task_id)
    object.__setattr__(draft, "revision", revision)
    object.__setattr__(draft, "phase", phase)
    object.__setattr__(draft, "policy_sha256", policy_sha256)
    object.__setattr__(draft, "context_sha256", bound_context_sha256)
    object.__setattr__(draft, "capabilities", tuple(sorted(set(capabilities))))
    object.__setattr__(draft, "data", freeze_json(data or {}))
    object.__setattr__(draft, "pending_attempt_id", pending_attempt_id)
    object.__setattr__(draft, "consumed_token_ids", tuple(sorted(set(consumed_token_ids))))
    object.__setattr__(draft, "ledger_anchor", ledger_anchor or LedgerAnchor(0, GENESIS_SHA256))
    object.__setattr__(draft, "state_sha256", GENESIS_SHA256)
    return AgentState(
        task_id=task_id,
        revision=revision,
        phase=phase,
        policy_sha256=policy_sha256,
        context_sha256=bound_context_sha256,
        capabilities=capabilities,
        data=data or {},
        pending_attempt_id=pending_attempt_id,
        consumed_token_ids=consumed_token_ids,
        ledger_anchor=ledger_anchor or LedgerAnchor(0, GENESIS_SHA256),
        state_sha256=sha256_payload(agent_state_body(draft)),
    )


def state_with_anchor(state: AgentState, anchor: LedgerAnchor) -> AgentState:
    return replace(state, ledger_anchor=anchor)


@dataclass(frozen=True, slots=True)
class LegalMove:
    operation_id: str
    capability: str
    prior_state_sha256: str
    policy_sha256: str
    move_sha256: str

    def __post_init__(self) -> None:
        _require_identifier(self.operation_id, "operation_id")
        _require_identifier(self.capability, "capability")
        _require_sha256(self.prior_state_sha256, "prior_state_sha256")
        _require_sha256(self.policy_sha256, "policy_sha256")
        _require_sha256(self.move_sha256, "move_sha256")


@dataclass(frozen=True, slots=True)
class ValidationToken:
    token_id: str
    operation_id: str
    normalized_parameters: FrozenDict | dict[str, Any]
    prior_state_sha256: str
    prior_ledger_sha256: str
    policy_sha256: str
    context_sha256: str
    capability: str
    issued_revision: int
    expires_after_revision: int

    def __post_init__(self) -> None:
        _require_sha256(self.token_id, "token_id")
        _require_identifier(self.operation_id, "operation_id")
        object.__setattr__(self, "normalized_parameters", freeze_json(self.normalized_parameters))
        _require_sha256(self.prior_state_sha256, "prior_state_sha256")
        _require_sha256(self.prior_ledger_sha256, "prior_ledger_sha256")
        _require_sha256(self.policy_sha256, "policy_sha256")
        _require_sha256(self.context_sha256, "context_sha256")
        _require_identifier(self.capability, "capability")
        if self.issued_revision < 0 or self.expires_after_revision < self.issued_revision:
            raise ValueError("invalid_token_revision_window")


@dataclass(frozen=True, slots=True)
class ValidatedMove:
    operation_id: str
    capability: str
    result_phase: str
    normalized_parameters: FrozenDict | dict[str, Any]
    token: ValidationToken

    def __post_init__(self) -> None:
        _require_identifier(self.operation_id, "operation_id")
        _require_identifier(self.capability, "capability")
        _require_identifier(self.result_phase, "result_phase")
        object.__setattr__(self, "normalized_parameters", freeze_json(self.normalized_parameters))
        if self.operation_id != self.token.operation_id:
            raise ValueError("validated_move_token_operation_mismatch")


@dataclass(frozen=True, slots=True)
class RuntimeEventBody:
    event_kind: str
    event_id: str
    task_id: str
    prior_state_sha256: str
    resulting_state_sha256: str
    operation_id: str | None
    intrinsic_data: FrozenDict | dict[str, Any]
    observation_data: FrozenDict | dict[str, Any] = field(default_factory=FrozenDict)

    def __post_init__(self) -> None:
        _require_identifier(self.event_kind, "event_kind")
        _require_sha256(self.event_id, "event_id")
        _require_identifier(self.task_id, "task_id")
        _require_sha256(self.prior_state_sha256, "prior_state_sha256")
        _require_sha256(self.resulting_state_sha256, "resulting_state_sha256")
        if self.operation_id is not None:
            _require_identifier(self.operation_id, "operation_id")
        object.__setattr__(self, "intrinsic_data", freeze_json(self.intrinsic_data))
        object.__setattr__(self, "observation_data", freeze_json(self.observation_data))
        if compute_runtime_event_id(self) != self.event_id:
            raise ValueError("runtime_event_id_mismatch")


def runtime_event_identity_body(event: RuntimeEventBody) -> dict[str, Any]:
    return {
        "schema_version": RUNTIME_SCHEMA_VERSION,
        "event_kind": event.event_kind,
        "task_id": event.task_id,
        "prior_state_sha256": event.prior_state_sha256,
        "resulting_state_sha256": event.resulting_state_sha256,
        "operation_id": event.operation_id,
        "intrinsic_data": thaw_json(event.intrinsic_data),
    }


def compute_runtime_event_id(event: RuntimeEventBody) -> str:
    return sha256_payload(runtime_event_identity_body(event))


def create_runtime_event_body(
    *,
    event_kind: str,
    task_id: str,
    prior_state_sha256: str,
    resulting_state_sha256: str,
    operation_id: str | None,
    intrinsic_data: dict[str, Any] | FrozenDict,
    observation_data: dict[str, Any] | FrozenDict | None = None,
) -> RuntimeEventBody:
    draft = object.__new__(RuntimeEventBody)
    object.__setattr__(draft, "event_kind", event_kind)
    object.__setattr__(draft, "event_id", GENESIS_SHA256)
    object.__setattr__(draft, "task_id", task_id)
    object.__setattr__(draft, "prior_state_sha256", prior_state_sha256)
    object.__setattr__(draft, "resulting_state_sha256", resulting_state_sha256)
    object.__setattr__(draft, "operation_id", operation_id)
    object.__setattr__(draft, "intrinsic_data", freeze_json(intrinsic_data))
    object.__setattr__(draft, "observation_data", freeze_json(observation_data or {}))
    return RuntimeEventBody(
        event_kind=event_kind,
        event_id=sha256_payload(runtime_event_identity_body(draft)),
        task_id=task_id,
        prior_state_sha256=prior_state_sha256,
        resulting_state_sha256=resulting_state_sha256,
        operation_id=operation_id,
        intrinsic_data=intrinsic_data,
        observation_data=observation_data or {},
    )


@dataclass(frozen=True, slots=True)
class TransitionResult:
    accepted: bool
    state: AgentState
    event_body: RuntimeEventBody | None
    reason_code: str


@dataclass(frozen=True, slots=True)
class LedgerSnapshot:
    state: AgentState
    anchor: LedgerAnchor
    snapshot_sha256: str

    def __post_init__(self) -> None:
        _require_sha256(self.snapshot_sha256, "snapshot_sha256")
        expected = sha256_payload(
            {
                "state_sha256": self.state.state_sha256,
                "event_count": self.anchor.event_count,
                "head_sha256": self.anchor.head_sha256,
            }
        )
        if expected != self.snapshot_sha256:
            raise ValueError("snapshot_sha256_mismatch")


def create_ledger_snapshot(state: AgentState, anchor: LedgerAnchor) -> LedgerSnapshot:
    return LedgerSnapshot(
        state=state_with_anchor(state, anchor),
        anchor=anchor,
        snapshot_sha256=sha256_payload(
            {
                "state_sha256": state.state_sha256,
                "event_count": anchor.event_count,
                "head_sha256": anchor.head_sha256,
            }
        ),
    )


@dataclass(frozen=True, slots=True)
class RuntimeReplayResult:
    valid: bool
    state: AgentState
    snapshot: LedgerSnapshot | None
    first_failing_sequence: int | None
    reason_code: str


@dataclass(frozen=True, slots=True)
class RuntimeFailure:
    reason_code: str
    state_sha256: str
    ledger_head_sha256: str
