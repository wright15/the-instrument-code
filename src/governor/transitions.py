"""Finite registered legal moves, exact validation tokens, and pure application."""

from __future__ import annotations

from collections.abc import Callable, Mapping
from types import MappingProxyType
from typing import TYPE_CHECKING, Any
import unicodedata

from .hashing import sha256_payload
from .models import FrozenDict, freeze_json, thaw_json
from .runtime_models import (
    AgentState,
    LegalMove,
    OperationSpec,
    TransitionError,
    TransitionResult,
    ValidatedMove,
    ValidationToken,
    agent_state_body,
    create_agent_state,
    create_runtime_event_body,
)

if TYPE_CHECKING:
    from .harmonic import HarmonicValidator


OperationReducer = Callable[[FrozenDict, FrozenDict], Mapping[str, Any]]


class OperationRegistry:
    """An immutable allow-list of typed operation specifications and reducers."""

    def __init__(
        self,
        operations: Mapping[str, tuple[OperationSpec, OperationReducer]],
        *,
        harmonic_validator: HarmonicValidator | None = None,
    ) -> None:
        records: dict[str, tuple[OperationSpec, OperationReducer]] = {}
        for operation_id, record in operations.items():
            spec, reducer = record
            if operation_id != spec.operation_id:
                raise ValueError("operation_registry_id_mismatch")
            if operation_id in records:
                raise ValueError("duplicate_operation_id")
            if not callable(reducer):
                raise TypeError("operation_reducer_must_be_callable")
            records[operation_id] = (spec, reducer)
        if harmonic_validator is not None:
            from .harmonic import HarmonicValidator as HarmonicValidatorType

            if not isinstance(harmonic_validator, HarmonicValidatorType):
                raise TypeError("harmonic_validator_must_be_harmonic_validator")
        if harmonic_validator is None and any(
            spec.requires_harmonic_validation for spec, _ in records.values()
        ):
            raise TransitionError("harmonic_validator_missing")
        self._records = MappingProxyType(records)
        self._harmonic_validator = harmonic_validator

    def operation_ids(self) -> tuple[str, ...]:
        return tuple(sorted(self._records))

    def get(self, operation_id: str) -> tuple[OperationSpec, OperationReducer] | None:
        return self._records.get(operation_id)

    def validate_harmonics(
        self,
        state: AgentState,
        operation_spec: OperationSpec,
        normalized_parameters: FrozenDict,
    ) -> None:
        if not operation_spec.requires_harmonic_validation:
            return
        if self._harmonic_validator is None:
            raise TransitionError("harmonic_validator_missing")
        try:
            self._harmonic_validator.validate(
                state=state,
                operation_spec=operation_spec,
                normalized_parameters=normalized_parameters,
            )
        except TransitionError:
            raise
        except Exception as error:
            raise TransitionError("harmonic_validation_failed") from error


def _normalize_value(value: Any) -> Any:
    if isinstance(value, str):
        return unicodedata.normalize("NFC", value)
    if isinstance(value, Mapping):
        return {
            unicodedata.normalize("NFC", key): _normalize_value(item)
            for key, item in value.items()
        }
    if isinstance(value, (list, tuple)):
        return [_normalize_value(item) for item in value]
    return value


def _matches_type(value: Any, type_name: str) -> bool:
    return {
        "string": isinstance(value, str),
        "integer": isinstance(value, int) and not isinstance(value, bool),
        "number": isinstance(value, (int, float)) and not isinstance(value, bool),
        "boolean": isinstance(value, bool),
        "object": isinstance(value, Mapping),
        "array": isinstance(value, (list, tuple)),
    }.get(type_name, False)


def normalize_parameters(
    operation_spec: OperationSpec,
    parameters: Mapping[str, Any],
) -> FrozenDict:
    unknown = set(parameters) - set(operation_spec.parameter_schema)
    if unknown:
        raise TransitionError("unknown_operation_parameter")
    normalized = thaw_json(operation_spec.defaults)
    normalized.update({key: _normalize_value(value) for key, value in parameters.items()})
    missing = set(operation_spec.required_parameters) - set(normalized)
    if missing:
        raise TransitionError("missing_operation_parameter")
    for name, value in normalized.items():
        type_name = operation_spec.parameter_schema[name]
        if not isinstance(type_name, str) or not _matches_type(value, type_name):
            raise TransitionError("operation_parameter_type_mismatch")
    return freeze_json(normalized)


def list_legal_moves(
    state: AgentState,
    registry: OperationRegistry,
) -> tuple[LegalMove, ...]:
    moves: list[LegalMove] = []
    for operation_id in registry.operation_ids():
        spec, _ = registry.get(operation_id)  # type: ignore[misc]
        if state.phase not in spec.allowed_phases or spec.capability not in state.capabilities:
            continue
        body = {
            "operation_id": spec.operation_id,
            "capability": spec.capability,
            "prior_state_sha256": state.state_sha256,
            "policy_sha256": state.policy_sha256,
        }
        moves.append(
            LegalMove(
                operation_id=spec.operation_id,
                capability=spec.capability,
                prior_state_sha256=state.state_sha256,
                policy_sha256=state.policy_sha256,
                move_sha256=sha256_payload(body),
            )
        )
    return tuple(moves)


def validate_move(
    state: AgentState,
    operation_id: str,
    parameters: Mapping[str, Any],
    registry: OperationRegistry,
    *,
    policy_sha256: str,
    context_sha256: str,
    capability: str,
) -> ValidatedMove:
    record = registry.get(operation_id)
    if record is None:
        raise TransitionError("operation_not_registered")
    spec, _ = record
    legal_ids = {move.operation_id for move in list_legal_moves(state, registry)}
    if operation_id not in legal_ids:
        raise TransitionError("operation_not_legal")
    if policy_sha256 != state.policy_sha256:
        raise TransitionError("policy_fingerprint_mismatch")
    if context_sha256 != state.context_sha256:
        raise TransitionError("context_fingerprint_mismatch")
    if capability != spec.capability or capability not in state.capabilities:
        raise TransitionError("capability_mismatch")
    normalized = normalize_parameters(spec, parameters)
    registry.validate_harmonics(state, spec, normalized)
    token_body = {
        "operation_id": operation_id,
        "normalized_parameters": thaw_json(normalized),
        "prior_state_sha256": state.state_sha256,
        "prior_ledger_sha256": state.ledger_anchor.head_sha256,
        "policy_sha256": policy_sha256,
        "context_sha256": context_sha256,
        "capability": capability,
        "issued_revision": state.revision,
        "expires_after_revision": state.revision,
    }
    token = ValidationToken(
        token_id=sha256_payload(token_body),
        operation_id=operation_id,
        normalized_parameters=normalized,
        prior_state_sha256=state.state_sha256,
        prior_ledger_sha256=state.ledger_anchor.head_sha256,
        policy_sha256=policy_sha256,
        context_sha256=context_sha256,
        capability=capability,
        issued_revision=state.revision,
        expires_after_revision=state.revision,
    )
    return ValidatedMove(
        operation_id=operation_id,
        capability=capability,
        result_phase=spec.result_phase,
        normalized_parameters=normalized,
        token=token,
    )


def _reject(state: AgentState, reason: str) -> TransitionResult:
    return TransitionResult(False, state, None, reason)


def apply_validated_move(
    state: AgentState,
    move: ValidatedMove,
    registry: OperationRegistry,
) -> TransitionResult:
    token = move.token
    record = registry.get(move.operation_id)
    if record is None:
        return _reject(state, "operation_not_registered")
    spec, reducer = record
    if token.token_id in state.consumed_token_ids:
        return _reject(state, "validation_token_reused")
    token_body = {
        "operation_id": token.operation_id,
        "normalized_parameters": thaw_json(token.normalized_parameters),
        "prior_state_sha256": token.prior_state_sha256,
        "prior_ledger_sha256": token.prior_ledger_sha256,
        "policy_sha256": token.policy_sha256,
        "context_sha256": token.context_sha256,
        "capability": token.capability,
        "issued_revision": token.issued_revision,
        "expires_after_revision": token.expires_after_revision,
    }
    checks = (
        (sha256_payload(token_body) == token.token_id, "validation_token_identity_mismatch"),
        (token.operation_id == move.operation_id, "operation_binding_mismatch"),
        (move.result_phase == spec.result_phase, "result_phase_binding_mismatch"),
        (token.prior_state_sha256 == state.state_sha256, "stale_state"),
        (token.prior_ledger_sha256 == state.ledger_anchor.head_sha256, "stale_ledger"),
        (token.policy_sha256 == state.policy_sha256, "policy_fingerprint_mismatch"),
        (token.context_sha256 == state.context_sha256, "context_fingerprint_mismatch"),
        (
            token.capability == spec.capability == move.capability
            and spec.capability in state.capabilities,
            "capability_mismatch",
        ),
        (token.issued_revision == state.revision, "stale_validation_token"),
        (state.revision <= token.expires_after_revision, "expired_validation_token"),
        (state.phase in spec.allowed_phases, "operation_not_legal"),
        (token.normalized_parameters == move.normalized_parameters, "parameter_binding_mismatch"),
    )
    for accepted, reason in checks:
        if not accepted:
            return _reject(state, reason)
    try:
        normalized = normalize_parameters(spec, thaw_json(move.normalized_parameters))
        if normalized != move.normalized_parameters:
            return _reject(state, "parameter_binding_mismatch")
        registry.validate_harmonics(state, spec, move.normalized_parameters)
    except TransitionError as error:
        return _reject(state, error.reason_code)
    try:
        next_data = reducer(state.data, move.normalized_parameters)
        frozen_next_data = freeze_json(next_data)
    except Exception:
        return _reject(state, "operation_reducer_failed")
    next_state = create_agent_state(
        task_id=state.task_id,
        revision=state.revision + 1,
        phase=spec.result_phase,
        policy_sha256=state.policy_sha256,
        context_sha256=state.context_sha256,
        capabilities=state.capabilities,
        data=frozen_next_data,
        pending_attempt_id=token.token_id,
        consumed_token_ids=state.consumed_token_ids + (token.token_id,),
        ledger_anchor=state.ledger_anchor,
    )
    event_body = create_runtime_event_body(
        event_kind="move_applied",
        task_id=state.task_id,
        prior_state_sha256=state.state_sha256,
        resulting_state_sha256=next_state.state_sha256,
        operation_id=move.operation_id,
        intrinsic_data={
            "token_id": token.token_id,
            "normalized_parameters": thaw_json(move.normalized_parameters),
            "state_after": agent_state_body(next_state),
        },
    )
    return TransitionResult(True, next_state, event_body, "ok")
