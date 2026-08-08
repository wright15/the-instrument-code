"""Production operation catalog binding transitions, executors, and verifiers.

The catalog is the operator-owned registry the GOV-207 facade consults. It
combines the pure transition registry with capability-scoped executor and
verifier registries, publishes strict menu metadata for every legal move, and
refuses to expose any operation whose execution closure is incomplete.
"""

from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass
from typing import Any

from .executors import ExecutorRegistry, ExecutorSpec
from .loop_guards import LoopPolicy, RecoveryMove
from .models import FrozenDict, _require_identifier, thaw_json
from .runtime_models import AgentState, LegalMove, TransitionError
from .transitions import OperationRegistry
from .verifiers import VerifierRegistry


EFFECT_CLASSES = frozenset({"pure", "external"})
_MENU_PARAMETER_TYPES = {
    "string": "string",
    "integer": "integer",
    "number": "number",
    "boolean": "boolean",
    "array": "array",
}


@dataclass(frozen=True, slots=True)
class OperationDescription:
    """Public menu metadata for one registered operation."""

    operation_id: str
    effect_class: str
    victory_condition_id: str

    def __post_init__(self) -> None:
        _require_identifier(self.operation_id, "operation_id")
        if self.effect_class not in EFFECT_CLASSES:
            raise ValueError("operation_effect_class_invalid")
        _require_identifier(self.victory_condition_id, "victory_condition_id")


def _parameter_schema(spec_parameters: FrozenDict, required: tuple[str, ...]) -> dict[str, Any]:
    properties: dict[str, Any] = {}
    for name in sorted(spec_parameters):
        type_name = spec_parameters[name]
        mapped = _MENU_PARAMETER_TYPES.get(type_name)
        if mapped is None:
            raise TransitionError("operation_parameter_type_not_representable")
        properties[name] = {"type": mapped}
    return {
        "type": "object",
        "additionalProperties": False,
        "properties": properties,
        "required": list(required),
    }


def _postcondition_descriptions(spec: ExecutorSpec) -> list[dict[str, Any]]:
    return [
        {
            "postconditionId": item.postcondition_id,
            "evidenceType": item.evidence_type.value,
            "verifierId": item.verifier_id,
            "required": item.required,
        }
        for item in spec.postconditions
    ]


class RuntimeCatalog:
    """Immutable operator registry with closure-checked menu descriptions."""

    def __init__(
        self,
        *,
        operations: OperationRegistry,
        descriptions: Mapping[str, OperationDescription],
        loop_policy: LoopPolicy,
        executors: ExecutorRegistry | None = None,
        verifiers: VerifierRegistry | None = None,
    ) -> None:
        records: dict[str, OperationDescription] = {}
        for operation_id, description in descriptions.items():
            if operation_id != description.operation_id:
                raise ValueError("operation_description_id_mismatch")
            if operation_id in records:
                raise ValueError("duplicate_operation_description")
            records[operation_id] = description
        for operation_id in operations.operation_ids():
            if operation_id not in records:
                raise TransitionError("operation_description_missing")
            spec_record = operations.get(operation_id)
            assert spec_record is not None
            spec, _ = spec_record
            description = records[operation_id]
            _parameter_schema(spec.parameter_schema, spec.required_parameters)
            if description.effect_class == "external":
                if executors is None or executors.get_spec(operation_id) is None:
                    raise TransitionError("operation_executor_missing")
                if verifiers is None:
                    raise TransitionError("operation_verifier_registry_missing")
                executor_spec = executors.get_spec(operation_id)
                assert executor_spec is not None
                for postcondition in executor_spec.postconditions:
                    if not verifiers.has(postcondition.verifier_id):
                        raise TransitionError("operation_verifier_missing")
        self._operations = operations
        self._executors = executors
        self._verifiers = verifiers
        self._loop_policy = loop_policy
        self._descriptions = records

    @property
    def operations(self) -> OperationRegistry:
        return self._operations

    @property
    def executors(self) -> ExecutorRegistry:
        if self._executors is None:
            raise TransitionError("operation_executor_missing")
        return self._executors

    @property
    def verifiers(self) -> VerifierRegistry:
        if self._verifiers is None:
            raise TransitionError("operation_verifier_registry_missing")
        return self._verifiers

    @property
    def loop_policy(self) -> LoopPolicy:
        return self._loop_policy

    def description(self, operation_id: str) -> OperationDescription:
        description = self._descriptions.get(operation_id)
        if description is None:
            raise TransitionError("operation_not_registered")
        return description

    def is_execution_closed(self, operation_id: str) -> bool:
        description = self._descriptions.get(operation_id)
        if description is None:
            return False
        if description.effect_class == "pure":
            return True
        if self._executors is None or self._verifiers is None:
            return False
        spec = self._executors.get_spec(operation_id)
        if spec is None:
            return False
        return all(
            self._verifiers.has(item.verifier_id) for item in spec.postconditions
        )

    def describe_move(self, move: LegalMove) -> dict[str, Any]:
        record = self._operations.get(move.operation_id)
        if record is None:
            raise TransitionError("operation_not_registered")
        spec, _ = record
        description = self.description(move.operation_id)
        postconditions: list[dict[str, Any]] = []
        if description.effect_class == "external" and self._executors is not None:
            executor_spec = self._executors.get_spec(move.operation_id)
            if executor_spec is not None:
                postconditions = _postcondition_descriptions(executor_spec)
        return {
            "operationId": move.operation_id,
            "capability": move.capability,
            "moveSha256": move.move_sha256,
            "priorStateSha256": move.prior_state_sha256,
            "resultPhase": spec.result_phase,
            "effectClass": description.effect_class,
            "parameterSchema": _parameter_schema(
                spec.parameter_schema, spec.required_parameters
            ),
            "defaults": thaw_json(spec.defaults),
            "searchDimensions": list(spec.search_dimensions),
            "requiredPostconditions": postconditions,
            "victoryConditionId": description.victory_condition_id,
        }

    def describe_legal_moves(
        self,
        state: AgentState,
        *,
        host_grants: frozenset[str] | set[str] | tuple[str, ...],
    ) -> tuple[dict[str, Any], ...]:
        from .transitions import list_legal_moves

        grants = frozenset(host_grants)
        descriptions: list[dict[str, Any]] = []
        for move in list_legal_moves(state, self._operations):
            if move.capability not in grants:
                continue
            if not self.is_execution_closed(move.operation_id):
                continue
            descriptions.append(self.describe_move(move))
        return tuple(descriptions)

    def recovery_moves(
        self,
        state: AgentState,
        *,
        host_grants: frozenset[str] | set[str] | tuple[str, ...],
    ) -> tuple[RecoveryMove, ...]:
        from .transitions import list_legal_moves

        grants = frozenset(host_grants)
        moves: list[RecoveryMove] = []
        for move in list_legal_moves(state, self._operations):
            if move.capability not in grants:
                continue
            if not self.is_execution_closed(move.operation_id):
                continue
            record = self._operations.get(move.operation_id)
            assert record is not None
            spec, _ = record
            if spec.search_dimensions:
                moves.append(
                    RecoveryMove(move.operation_id, spec.search_dimensions)
                )
        return tuple(sorted(moves, key=lambda item: item.operation_id))

    def declared_search_dimensions(self) -> tuple[str, ...]:
        dimensions: set[str] = set()
        for operation_id in self._operations.operation_ids():
            record = self._operations.get(operation_id)
            assert record is not None
            spec, _ = record
            dimensions.update(spec.search_dimensions)
        return tuple(sorted(dimensions))
