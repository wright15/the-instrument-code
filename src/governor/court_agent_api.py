"""Strict CRT-307 JSON facade over the CRT-305/306 Court APIs."""

from __future__ import annotations

from collections.abc import Callable, Mapping, Sequence
from dataclasses import dataclass
import json
from pathlib import Path
from queue import Empty, Queue
import re
from threading import Thread
from time import monotonic
from types import MappingProxyType
from typing import Any

from court_filter_algebra import CourtFilterOperator, apply_filter, evaluate_commutation

from .court_graph_queries import normalize_court_query_parameters
from .court_runtime import (
    COURT_POSITIONS,
    CourtLegalMove,
    CourtRouteContext,
    CourtRuntimeError,
    CourtRuntimeState,
    TopologicalTranslocationRecord,
    apply_court_move,
    create_court_runtime_snapshot,
    list_legal_court_moves,
    load_court_runtime_policy,
    replay_court_runtime_ledger,
    validate_court_move,
)
from .court_session_store import CourtSessionStore
from .evidence import VerificationDecision
from .hashing import canonical_json_bytes, sha256_payload
from .loop_guards import (
    AttemptRecord,
    LoopDecisionType,
    LoopPolicy,
    evaluate_loop_guards,
)
from .models import LedgerEvent, thaw_json


COURT_AGENT_API_VERSION = "crt-307.court-agent-api.v1"
COURT_AGENT_TOOL_ID = "governor.court_agent_api.invoke"
TOOL_ID = COURT_AGENT_TOOL_ID
MAX_REQUEST_BYTES = 65536
MAX_RESPONSE_BYTES = 1048576
COURT_FILTER_ALGEBRA_FINGERPRINT = (
    "40bd74397ff9f4c8c0f0b845630e008cea66c9495413195c1e1c92ff02968589"
)

INSPECT_COURT_STATE = "inspect_court_state"
LIST_LEGAL_COURT_MOVES = "list_legal_court_moves"
VALIDATE_EXECUTE_COURT_TRANSITION = "validate_and_execute_court_transition"
PROJECT_THROUGH_COURT = "project_through_court"
VERIFY_COURT_POSTCONDITION = "verify_court_postcondition"

COURT_OPERATION_IDS = (
    INSPECT_COURT_STATE,
    LIST_LEGAL_COURT_MOVES,
    VALIDATE_EXECUTE_COURT_TRANSITION,
    PROJECT_THROUGH_COURT,
    VERIFY_COURT_POSTCONDITION,
)

_INPUT_SCHEMAS = {
    INSPECT_COURT_STATE: "crt-307.inspect-court-state.input.v1",
    LIST_LEGAL_COURT_MOVES: "crt-307.list-legal-court-moves.input.v1",
    VALIDATE_EXECUTE_COURT_TRANSITION:
        "crt-307.validate-execute-court-transition.input.v1",
    PROJECT_THROUGH_COURT: "crt-307.project-through-court.input.v1",
    VERIFY_COURT_POSTCONDITION: "crt-307.verify-court-postcondition.input.v1",
}
_OUTPUT_SCHEMAS = {
    operation: schema.replace(".input.v1", ".output.v1")
    for operation, schema in _INPUT_SCHEMAS.items()
}
_REQUEST_KEYS = {
    INSPECT_COURT_STATE: (
        frozenset(("schemaVersion", "requestId", "sessionId")),
        frozenset(("expectedStateSha256", "includeGraphContext", "eventLimit")),
    ),
    LIST_LEGAL_COURT_MOVES: (
        frozenset((
            "schemaVersion", "requestId", "sessionId", "expectedStateSha256",
            "expectedLedgerHeadSha256",
        )),
        frozenset(),
    ),
    VALIDATE_EXECUTE_COURT_TRANSITION: (
        frozenset((
            "schemaVersion", "requestId", "sessionId", "selectedMove", "expected",
        )),
        frozenset(),
    ),
    PROJECT_THROUGH_COURT: (
        frozenset((
            "schemaVersion", "requestId", "sessionId", "expectedStateSha256",
            "expectedLedgerHeadSha256", "sourceMask", "mutationOperatorId",
        )),
        frozenset(),
    ),
    VERIFY_COURT_POSTCONDITION: (
        frozenset((
            "schemaVersion", "requestId", "sessionId", "eventId",
            "expectedStateSha256", "expectedLedgerHeadSha256",
        )),
        frozenset(("includeGraphContext",)),
    ),
}
_SHA256 = re.compile(r"^[0-9a-f]{64}$")
_IDENTIFIER = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$")
_MUTATION_IDS = frozenset(("M", *(f"R{i}" for i in range(1, 8)), *(f"L{i}" for i in range(1, 8))))
_QUERY_ROW_LIMITS = {
    "court_runtime_state_for_session": 1,
    "court_verified_events_for_session": 100,
    "court_filter_commutation_outputs": 100,
}
_ROOT = Path(__file__).resolve().parents[2]
_FILTER_REGISTRY = (
    _ROOT
    / "seven-governors-court-filter-algebra-v0.1.0"
    / "canonical"
    / "filter-operator-registry.json"
)

CONTEXT_READ_CAPABILITY = "court.context.read"
LEDGER_REPLAY_CAPABILITY = "court.ledger.replay"
GRAPH_READ_NAMED_CAPABILITY = "court.graph.read.named"
MOVES_READ_CAPABILITY = "court.moves.read"
MOVE_VALIDATE_CAPABILITY = "court.move.validate"
MOVE_EXECUTE_CAPABILITY = "court.move.execute"
POSTCONDITION_VERIFY_CAPABILITY = "court.postcondition.verify"
FILTER_PROJECT_CAPABILITY = "court.filter.project"
OUTCOME_READ_CAPABILITY = "court.outcome.read"
CRT304_FILTER_TRANSFORM = "court.filter.projection"
_FACADE_MOVE_CAPABILITIES = frozenset(("court.transition", "court.translocate"))
_OPERATION_BASE_GRANTS = {
    INSPECT_COURT_STATE: frozenset((
        CONTEXT_READ_CAPABILITY, LEDGER_REPLAY_CAPABILITY,
    )),
    LIST_LEGAL_COURT_MOVES: frozenset((
        LEDGER_REPLAY_CAPABILITY, MOVES_READ_CAPABILITY,
    )),
    VALIDATE_EXECUTE_COURT_TRANSITION: frozenset((
        LEDGER_REPLAY_CAPABILITY,
        MOVE_VALIDATE_CAPABILITY,
        MOVE_EXECUTE_CAPABILITY,
        POSTCONDITION_VERIFY_CAPABILITY,
    )),
    PROJECT_THROUGH_COURT: frozenset((
        LEDGER_REPLAY_CAPABILITY, FILTER_PROJECT_CAPABILITY,
    )),
    VERIFY_COURT_POSTCONDITION: frozenset((
        LEDGER_REPLAY_CAPABILITY,
        OUTCOME_READ_CAPABILITY,
        POSTCONDITION_VERIFY_CAPABILITY,
    )),
}
MAX_GRAPH_ROW_BYTES = 262144
MAX_GRAPH_ELAPSED_MS = 1000


class CourtAgentApiError(ValueError):
    """A stable, reason-coded CRT-307 boundary error."""

    def __init__(self, reason_code: str) -> None:
        super().__init__(reason_code)
        self.reason_code = reason_code


@dataclass(frozen=True, slots=True)
class TrustedTranslocationBinding:
    """Host-owned binding that is never serialized as a model-facing record."""

    record: TopologicalTranslocationRecord
    route_context: CourtRouteContext

    def __post_init__(self) -> None:
        if not isinstance(self.record, TopologicalTranslocationRecord):
            raise CourtAgentApiError("trusted_translocation_record_invalid")
        if not isinstance(self.route_context, CourtRouteContext):
            raise CourtAgentApiError("trusted_route_context_invalid")
        if self.record.record_hash == "0" * 64:
            raise CourtAgentApiError("trusted_translocation_record_invalid")
        if (
            self.route_context.filter_id != self.record.filter_id
            or self.route_context.filter_mask != self.record.filter_mask
            or self.route_context.static_route_record_id
            != self.record.static_route_record_id
        ):
            raise CourtAgentApiError("trusted_translocation_binding_mismatch")


GraphProvider = Callable[[str, Mapping[str, object]], Sequence[Mapping[str, Any]]]
VerificationProvider = Callable[[CourtRuntimeState, CourtLegalMove], VerificationDecision]


def _mapping(value: Any, reason: str) -> Mapping[str, Any]:
    if not isinstance(value, Mapping):
        raise CourtAgentApiError(reason)
    return value


def _exact_keys(
    value: Any,
    required: frozenset[str],
    optional: frozenset[str],
    reason: str,
) -> Mapping[str, Any]:
    body = _mapping(value, reason)
    keys = set(body)
    if keys - required - optional:
        raise CourtAgentApiError(reason)
    if required - keys:
        raise CourtAgentApiError(reason)
    return body


def _identifier(value: Any, reason: str) -> str:
    if not isinstance(value, str) or not _IDENTIFIER.fullmatch(value):
        raise CourtAgentApiError(reason)
    return value


def _sha256(value: Any, reason: str) -> str:
    if not isinstance(value, str) or not _SHA256.fullmatch(value):
        raise CourtAgentApiError(reason)
    return value


def _boolean(value: Any, reason: str) -> bool:
    if type(value) is not bool:
        raise CourtAgentApiError(reason)
    return value


def _directive(
    action: str, reason_code: str, *, operator_action_required: bool = False
) -> dict[str, Any]:
    if action not in {"continue", "reinspect", "replan", "stop"}:
        raise CourtAgentApiError("directive_action_invalid")
    return {
        "action": action,
        "reasonCode": reason_code,
        "operatorActionRequired": operator_action_required,
    }


def _state_ref(state: CourtRuntimeState) -> dict[str, Any]:
    snapshot = create_court_runtime_snapshot(state)
    return {
        "sessionId": state.session_id,
        "positionId": state.position_id,
        "revision": state.revision,
        "stateSha256": state.state_sha256,
        "ledgerHeadSha256": state.ledger_anchor.head_sha256,
        "eventCount": state.ledger_anchor.event_count,
        "policyFingerprint": state.policy_fingerprint,
        "contextFingerprint": state.context_fingerprint,
        "harmonicProfileSha256": state.harmonic_profile_sha256,
        "pitchMask": state.pitch_mask,
        "poleVector": state.pole_register.vector,
        "internalPoles": list(state.pole_register.internal_poles),
        "kappaCourt": {
            "numerator": state.kappa_court.numerator,
            "denominator": state.kappa_court.denominator,
        },
        "snapshotHash": snapshot.snapshot_hash,
    }


def _replay_summary(replay: Any) -> dict[str, Any]:
    return {
        "valid": replay.valid,
        "eventCount": replay.state.ledger_anchor.event_count,
        "ledgerHeadSha256": replay.state.ledger_anchor.head_sha256,
        "firstFailingSequence": replay.first_failing_sequence,
        "reasonCode": replay.reason_code,
        "snapshotHash": replay.snapshot.snapshot_hash if replay.snapshot else None,
    }


def _move_body(move: CourtLegalMove) -> dict[str, Any]:
    return {
        "operationId": move.operation_id,
        "targetPosition": move.target_position,
        "capability": move.capability,
        "priorStateSha256": move.prior_state_sha256,
        "policyFingerprint": move.policy_fingerprint,
        "translocationHash": move.translocation_hash,
        "routeContextHash": move.route_context_hash,
        "moveHash": move.move_hash,
        "parameterSchema": {
            "type": "object",
            "required": ["targetPosition"],
            "properties": {
                "targetPosition": {"type": "string", "const": move.target_position}
            },
            "additionalProperties": False,
        },
        "postconditions": [
            "recorded_verified_evidence",
            "semantic_replay_valid",
            f"terminal_position:{move.target_position}",
        ],
    }


def _event_payload(event: LedgerEvent) -> Mapping[str, Any]:
    return _mapping(thaw_json(event.payload), "court_event_payload_invalid")


class CourtAgentApi:
    """Fixed five-operation Court facade with no direct model authority."""

    def __init__(
        self,
        *,
        store: CourtSessionStore,
        host_grants: frozenset[str] | set[str] | tuple[str, ...],
        verification_provider: VerificationProvider | None = None,
        graph_provider: GraphProvider | None = None,
        translocation_bindings: Mapping[
            str,
            TrustedTranslocationBinding
            | tuple[TopologicalTranslocationRecord, CourtRouteContext],
        ] | None = None,
        filter_application_ids: Mapping[str, str] | None = None,
    ) -> None:
        if not isinstance(store, CourtSessionStore):
            raise CourtAgentApiError("court_session_store_invalid")
        grants = tuple(host_grants)
        if any(not isinstance(item, str) or not item for item in grants):
            raise CourtAgentApiError("host_capability_grant_invalid")
        bindings: dict[str, TrustedTranslocationBinding] = {}
        for record_hash, value in (translocation_bindings or {}).items():
            _sha256(record_hash, "trusted_translocation_hash_invalid")
            if isinstance(value, TrustedTranslocationBinding):
                binding = value
            elif isinstance(value, tuple) and len(value) == 2:
                binding = TrustedTranslocationBinding(value[0], value[1])
            else:
                raise CourtAgentApiError("trusted_translocation_binding_invalid")
            if record_hash != binding.record.record_hash:
                raise CourtAgentApiError("trusted_translocation_hash_mismatch")
            bindings[record_hash] = binding
        applications: dict[str, str] = {}
        for position, application_id in (filter_application_ids or {}).items():
            if position not in COURT_POSITIONS:
                raise CourtAgentApiError("filter_application_position_invalid")
            applications[position] = _identifier(
                application_id, "filter_application_id_invalid"
            )
        self._store = store
        self._host_grants = frozenset(grants)
        self._verification_provider = verification_provider
        self._graph_provider = graph_provider
        self._translocation_bindings = MappingProxyType(bindings)
        self._filter_application_ids = MappingProxyType(applications)
        self._attempt_history: dict[str, tuple[AttemptRecord, ...]] = {}
        self._graph_worker: Thread | None = None
        self._loop_policy = LoopPolicy(
            max_retries=1, repetition_limit=1, no_progress_window=2
        )

    def invoke(self, operation_id: str, request: Mapping[str, Any]) -> dict[str, Any]:
        if operation_id not in COURT_OPERATION_IDS:
            raise CourtAgentApiError("operation_not_registered")
        request = _mapping(request, "request_must_be_json_mapping")
        try:
            encoded = canonical_json_bytes(request)
        except (TypeError, ValueError) as error:
            raise CourtAgentApiError("request_not_json_compatible") from error
        if len(encoded) > MAX_REQUEST_BYTES:
            raise CourtAgentApiError("request_too_large")
        required, optional = _REQUEST_KEYS[operation_id]
        body = _exact_keys(request, required, optional, "request_properties_invalid")
        if body["schemaVersion"] != _INPUT_SCHEMAS[operation_id]:
            raise CourtAgentApiError("request_schema_version_mismatch")
        _identifier(body["requestId"], "request_id_invalid")
        _identifier(body["sessionId"], "session_id_invalid")
        handler = {
            INSPECT_COURT_STATE: self._inspect,
            LIST_LEGAL_COURT_MOVES: self._list_moves,
            VALIDATE_EXECUTE_COURT_TRANSITION: self._execute,
            PROJECT_THROUGH_COURT: self._project,
            VERIFY_COURT_POSTCONDITION: self._verify,
        }[operation_id]
        return handler(body)

    def invoke_json(self, operation_id: str, request_text: str) -> str:
        if not isinstance(request_text, str):
            raise CourtAgentApiError("request_not_json")
        encoded = request_text.encode("utf-8")
        if len(encoded) > MAX_REQUEST_BYTES:
            raise CourtAgentApiError("request_too_large")
        try:
            request = json.loads(encoded)
        except (UnicodeDecodeError, json.JSONDecodeError) as error:
            raise CourtAgentApiError("request_not_json") from error
        return canonical_json_bytes(self.invoke(operation_id, request)).decode("utf-8")

    def _finalize(
        self,
        operation_id: str,
        request: Mapping[str, Any],
        status: str,
        reason_code: str,
        directive: Mapping[str, Any],
        fields: Mapping[str, Any],
    ) -> dict[str, Any]:
        request_fingerprint = sha256_payload(thaw_json(request))
        receipt_core = {
            "toolId": COURT_AGENT_TOOL_ID,
            "operationId": operation_id,
            "status": status,
            "requestFingerprint": request_fingerprint,
        }
        receipt = {
            **receipt_core,
            "resultFingerprint": sha256_payload(receipt_core),
        }
        output_core = {
            "schemaVersion": _OUTPUT_SCHEMAS[operation_id],
            "skillId": operation_id,
            "requestId": request["requestId"],
            "status": status,
            "reasonCode": reason_code,
            "directive": dict(directive),
            **dict(fields),
            "toolReceipts": [receipt],
        }
        output = {
            **output_core,
            "resultFingerprint": sha256_payload(output_core),
        }
        try:
            response = canonical_json_bytes(output)
        except (TypeError, ValueError) as error:
            raise CourtAgentApiError("response_not_json_compatible") from error
        if len(response) > MAX_RESPONSE_BYTES:
            raise CourtAgentApiError("response_too_large")
        return output

    def _load_replay(
        self, session_id: str
    ) -> tuple[CourtRuntimeState, CourtRuntimeState, tuple[LedgerEvent, ...], Any] | None:
        loaded = self._store.load(session_id)
        if loaded is None:
            return None
        genesis, current, events = loaded
        # CourtSessionStore replays on load; CRT-307 deliberately repeats the trust boundary.
        replay = replay_court_runtime_ledger(
            genesis,
            events,
            current.ledger_anchor,
            policy=load_court_runtime_policy(),
        )
        return genesis, current, events, replay

    def _trusted_records(self) -> tuple[TopologicalTranslocationRecord, ...]:
        return tuple(
            binding.record
            for _, binding in sorted(self._translocation_bindings.items())
        )

    def _effective_moves(self, state: CourtRuntimeState) -> tuple[CourtLegalMove, ...]:
        moves = list_legal_court_moves(
            state,
            load_court_runtime_policy(),
            translocation_records=self._trusted_records(),
        )
        return tuple(
            move
            for move in moves
            if move.capability in self._host_grants
            and move.capability in _FACADE_MOVE_CAPABILITIES
        )

    def _has_base_grants(self, operation_id: str) -> bool:
        return _OPERATION_BASE_GRANTS[operation_id].issubset(self._host_grants)

    def _can_read_state(self) -> bool:
        return self._has_base_grants(INSPECT_COURT_STATE)

    def _can_graph(self) -> bool:
        return (
            GRAPH_READ_NAMED_CAPABILITY in self._host_grants
            and self._graph_provider is not None
        )

    def _can_project(self) -> bool:
        return self._has_base_grants(PROJECT_THROUGH_COURT)

    def _call_graph_provider(
        self, query_id: str, normalized: Mapping[str, object]
    ) -> Sequence[Mapping[str, Any]]:
        if self._graph_provider is None:
            raise CourtAgentApiError("graph_unavailable")
        if self._graph_worker is not None:
            if self._graph_worker.is_alive():
                raise CourtAgentApiError("graph_provider_busy")
            self._graph_worker = None
        result_queue: Queue[tuple[bool, object]] = Queue(maxsize=1)

        def invoke_provider() -> None:
            try:
                result_queue.put((True, self._graph_provider(query_id, normalized)))
            except BaseException as error:
                result_queue.put((False, error))

        worker = Thread(target=invoke_provider, daemon=True)
        self._graph_worker = worker
        worker.start()
        worker.join(MAX_GRAPH_ELAPSED_MS / 1000)
        if worker.is_alive():
            raise CourtAgentApiError("graph_provider_budget_exceeded")
        self._graph_worker = None
        try:
            accepted, value = result_queue.get_nowait()
        except Empty as error:
            raise CourtAgentApiError("graph_provider_rows_invalid") from error
        if not accepted:
            raise CourtAgentApiError("graph_provider_failed") from value
        return value  # type: ignore[return-value]

    def _menu(
        self,
        state: CourtRuntimeState,
        events: tuple[LedgerEvent, ...],
        *,
        replay_valid: bool,
        suppress_executor: bool = False,
    ) -> dict[str, Any]:
        list_available = replay_valid and self._has_base_grants(
            LIST_LEGAL_COURT_MOVES
        )
        moves = self._effective_moves(state) if list_available else ()
        executor = bool(
            moves
            and self._has_base_grants(VALIDATE_EXECUTE_COURT_TRANSITION)
            and self._verification_provider is not None
            and not suppress_executor
        )
        skills = []
        if self._has_base_grants(INSPECT_COURT_STATE):
            skills.append(INSPECT_COURT_STATE)
        if list_available:
            skills.append(LIST_LEGAL_COURT_MOVES)
        if executor:
            skills.append(VALIDATE_EXECUTE_COURT_TRANSITION)
        if replay_valid and self._can_project():
            skills.append(PROJECT_THROUGH_COURT)
        if (
            replay_valid
            and events
            and self._has_base_grants(VERIFY_COURT_POSTCONDITION)
        ):
            skills.append(VERIFY_COURT_POSTCONDITION)
        named_queries: list[str] = []
        if replay_valid and self._can_graph():
            if (
                self._has_base_grants(INSPECT_COURT_STATE)
                or self._has_base_grants(VERIFY_COURT_POSTCONDITION)
            ):
                named_queries.extend((
                    "court_runtime_state_for_session",
                    "court_verified_events_for_session",
                ))
            if (
                self._has_base_grants(PROJECT_THROUGH_COURT)
                and state.position_id in self._filter_application_ids
            ):
                named_queries.append("court_filter_commutation_outputs")
        menu_core = {
            "schemaVersion": "crt-307.court-menu.v1",
            "positionId": state.position_id,
            "kappaCourt": {
                "numerator": state.kappa_court.numerator,
                "denominator": state.kappa_court.denominator,
            },
            "skills": sorted(skills),
            "namedQueries": sorted(named_queries),
            "moves": [_move_body(move) for move in moves],
            "executorExposed": executor,
        }
        return {**menu_core, "menuFingerprint": sha256_payload(menu_core)}

    def _graph_context(
        self,
        *,
        requested: bool,
        queries: tuple[tuple[str, Mapping[str, object]], ...],
    ) -> dict[str, Any]:
        if not requested:
            return {
                "requested": False,
                "available": self._can_graph(),
                "authoritative": False,
                "status": "not_requested",
                "reasonCode": "ok",
                "queryResults": [],
                "receipts": [],
            }
        if GRAPH_READ_NAMED_CAPABILITY not in self._host_grants:
            return {
                "requested": True,
                "available": False,
                "authoritative": False,
                "status": "denied",
                "reasonCode": "graph_capability_denied",
                "queryResults": [],
                "receipts": [],
            }
        if self._graph_provider is None:
            return {
                "requested": True,
                "available": False,
                "authoritative": False,
                "status": "unavailable",
                "reasonCode": "graph_unavailable",
                "queryResults": [],
                "receipts": [],
            }
        results = []
        receipts = []
        returned_row_bytes = 0
        started = monotonic()
        try:
            for query_id, parameters in queries:
                normalized = normalize_court_query_parameters(query_id, parameters)
                rows = self._call_graph_provider(
                    query_id, MappingProxyType(normalized)
                )
                if (
                    isinstance(rows, (str, bytes, bytearray, Mapping))
                    or not isinstance(rows, Sequence)
                    or any(not isinstance(row, Mapping) for row in rows)
                    or len(rows) > _QUERY_ROW_LIMITS[query_id]
                ):
                    raise CourtAgentApiError("graph_provider_rows_invalid")
                materialized = []
                for row in rows:
                    normalized_row = thaw_json(row)
                    returned_row_bytes += len(canonical_json_bytes(normalized_row))
                    if returned_row_bytes > MAX_GRAPH_ROW_BYTES:
                        raise CourtAgentApiError("graph_provider_budget_exceeded")
                    materialized.append(normalized_row)
                if (monotonic() - started) * 1000 > MAX_GRAPH_ELAPSED_MS:
                    raise CourtAgentApiError("graph_provider_budget_exceeded")
                rows_fingerprint = sha256_payload(materialized)
                results.append({
                    "queryId": query_id,
                    "rowCount": len(materialized),
                    "rowsFingerprint": rows_fingerprint,
                })
                receipt_core = {
                    "toolId": COURT_AGENT_TOOL_ID,
                    "operationId": query_id,
                    "status": "ok",
                    "requestFingerprint": sha256_payload(normalized),
                }
                receipts.append({
                    **receipt_core,
                    "resultFingerprint": sha256_payload(receipt_core),
                })
        except Exception:
            return {
                "requested": True,
                "available": True,
                "authoritative": False,
                "status": "failed",
                "reasonCode": "graph_query_failed",
                "queryResults": [],
                "receipts": [],
            }
        return {
            "requested": True,
            "available": True,
            "authoritative": False,
            "status": "ok",
            "reasonCode": "ok",
            "queryResults": sorted(results, key=lambda item: item["queryId"]),
            "receipts": sorted(receipts, key=lambda item: item["operationId"]),
        }

    def _empty_result(
        self,
        operation_id: str,
        request: Mapping[str, Any],
        status: str,
        reason: str,
    ) -> dict[str, Any]:
        empty_replay = {
            "valid": False,
            "eventCount": 0,
            "ledgerHeadSha256": "0" * 64,
            "firstFailingSequence": None,
            "reasonCode": reason,
            "snapshotHash": None,
        }
        fields: dict[str, Any]
        if operation_id == INSPECT_COURT_STATE:
            fields = {"state": None, "replay": empty_replay, "graph": None, "menu": None}
        elif operation_id == LIST_LEGAL_COURT_MOVES:
            fields = {"state": None, "moves": [], "menu": None}
        elif operation_id == VALIDATE_EXECUTE_COURT_TRANSITION:
            fields = {
                "stateBefore": None,
                "stateAfter": None,
                "transition": None,
                "ledgerDelta": {"persisted": False, "eventsAppended": 0},
                "menu": None,
            }
        elif operation_id == PROJECT_THROUGH_COURT:
            fields = {
                "stateBefore": None,
                "stateAfter": None,
                "projection": None,
                "graph": None,
                "menu": None,
            }
        else:
            fields = {
                "state": None,
                "replay": empty_replay,
                "postcondition": None,
                "claim": {"mayDeclareSuccess": False, "claimCode": reason},
                "graph": None,
                "menu": None,
            }
        return self._finalize(
            operation_id,
            request,
            status,
            reason,
            _directive("stop", reason, operator_action_required=True),
            fields,
        )

    def _unavailable(
        self, operation_id: str, request: Mapping[str, Any], reason: str
    ) -> dict[str, Any]:
        return self._empty_result(operation_id, request, "unavailable", reason)

    def _denied(
        self, operation_id: str, request: Mapping[str, Any]
    ) -> dict[str, Any]:
        return self._empty_result(
            operation_id, request, "denied", "capability_denied"
        )

    def _inspect(self, request: Mapping[str, Any]) -> dict[str, Any]:
        expected = request.get("expectedStateSha256")
        if expected is not None:
            _sha256(expected, "expected_state_sha256_invalid")
        include_graph = request.get("includeGraphContext", False)
        _boolean(include_graph, "include_graph_context_invalid")
        limit = request.get("eventLimit", 25)
        if type(limit) is not int or not 1 <= limit <= 25:
            raise CourtAgentApiError("event_limit_invalid")
        loaded = self._load_replay(request["sessionId"])
        if loaded is None:
            return self._unavailable(INSPECT_COURT_STATE, request, "session_not_found")
        _, state, events, replay = loaded
        if not self._has_base_grants(INSPECT_COURT_STATE):
            return self._denied(INSPECT_COURT_STATE, request)
        stale = expected is not None and expected != state.state_sha256
        graph = self._graph_context(
            requested=include_graph,
            queries=(
                ("court_runtime_state_for_session", {"sessionId": state.session_id}),
                ("court_verified_events_for_session", {"sessionId": state.session_id, "limit": limit}),
            ),
        )
        valid = replay.valid
        reason = "stale_state" if stale else replay.reason_code
        status = "reinspect" if stale else "ok" if valid else "rejected"
        action = "reinspect" if stale else "continue" if valid else "stop"
        return self._finalize(
            INSPECT_COURT_STATE,
            request,
            status,
            reason,
            _directive(action, reason, operator_action_required=not valid),
            {
                "state": _state_ref(state),
                "replay": _replay_summary(replay),
                "graph": graph,
                "menu": self._menu(state, events, replay_valid=valid),
            },
        )

    def _check_expected_pair(
        self, request: Mapping[str, Any], state: CourtRuntimeState
    ) -> str | None:
        state_hash = _sha256(
            request["expectedStateSha256"], "expected_state_sha256_invalid"
        )
        ledger_hash = _sha256(
            request["expectedLedgerHeadSha256"],
            "expected_ledger_head_sha256_invalid",
        )
        if state_hash != state.state_sha256:
            return "stale_state"
        if ledger_hash != state.ledger_anchor.head_sha256:
            return "stale_ledger"
        return None

    def _list_moves(self, request: Mapping[str, Any]) -> dict[str, Any]:
        _sha256(request["expectedStateSha256"], "expected_state_sha256_invalid")
        _sha256(
            request["expectedLedgerHeadSha256"],
            "expected_ledger_head_sha256_invalid",
        )
        loaded = self._load_replay(request["sessionId"])
        if loaded is None:
            return self._unavailable(LIST_LEGAL_COURT_MOVES, request, "session_not_found")
        _, state, events, replay = loaded
        if not self._has_base_grants(LIST_LEGAL_COURT_MOVES):
            return self._denied(LIST_LEGAL_COURT_MOVES, request)
        if not replay.valid:
            reason = replay.reason_code
        else:
            reason = self._check_expected_pair(request, state) or "ok"
        ok = reason == "ok"
        moves = self._effective_moves(state) if ok else ()
        action = "continue" if ok else "reinspect" if reason.startswith("stale_") else "stop"
        status = "ok" if ok else "reinspect" if reason.startswith("stale_") else "denied" if reason == "capability_denied" else "rejected"
        return self._finalize(
            LIST_LEGAL_COURT_MOVES,
            request,
            status,
            reason,
            _directive(action, reason, operator_action_required=action == "stop"),
            {
                "state": _state_ref(state),
                "moves": [_move_body(move) for move in moves],
                "menu": self._menu(state, events, replay_valid=replay.valid),
            },
        )

    def _transition_response(
        self,
        request: Mapping[str, Any],
        state: CourtRuntimeState,
        events: tuple[LedgerEvent, ...],
        replay_valid: bool,
        *,
        status: str,
        reason: str,
        action: str,
        suppress_executor: bool = False,
        transition: Mapping[str, Any] | None = None,
    ) -> dict[str, Any]:
        return self._finalize(
            VALIDATE_EXECUTE_COURT_TRANSITION,
            request,
            status,
            reason,
            _directive(
                action,
                reason,
                operator_action_required=status in {"unavailable", "denied"},
            ),
            {
                "stateBefore": _state_ref(state),
                "stateAfter": _state_ref(state),
                "transition": transition,
                "ledgerDelta": {"persisted": False, "eventsAppended": 0},
                "menu": self._menu(
                    state,
                    events,
                    replay_valid=replay_valid,
                    suppress_executor=suppress_executor,
                ),
            },
        )

    def _execute(self, request: Mapping[str, Any]) -> dict[str, Any]:
        selected = _exact_keys(
            request["selectedMove"],
            frozenset(("operationId", "targetPosition", "moveHash", "translocationHash")),
            frozenset(),
            "selected_move_properties_invalid",
        )
        expected = _exact_keys(
            request["expected"],
            frozenset((
                "revision", "stateSha256", "ledgerHeadSha256", "policyFingerprint",
                "contextFingerprint",
            )),
            frozenset(),
            "expected_properties_invalid",
        )
        operation = _identifier(selected["operationId"], "selected_operation_id_invalid")
        target = _identifier(selected["targetPosition"], "selected_target_position_invalid")
        move_hash = _sha256(selected["moveHash"], "selected_move_hash_invalid")
        translocation_hash = selected["translocationHash"]
        if translocation_hash is not None:
            _sha256(translocation_hash, "selected_translocation_hash_invalid")
        if type(expected["revision"]) is not int or expected["revision"] < 0:
            raise CourtAgentApiError("expected_revision_invalid")
        for key, reason in (
            ("stateSha256", "expected_state_sha256_invalid"),
            ("ledgerHeadSha256", "expected_ledger_head_sha256_invalid"),
            ("policyFingerprint", "expected_policy_fingerprint_invalid"),
            ("contextFingerprint", "expected_context_fingerprint_invalid"),
        ):
            _sha256(expected[key], reason)
        required_dynamic_capability = {
            "court:advance": "court.transition",
            "court:retreat": "court.transition",
            "court:translocate": "court.translocate",
        }.get(operation)
        loaded = self._load_replay(request["sessionId"])
        if loaded is None:
            return self._unavailable(
                VALIDATE_EXECUTE_COURT_TRANSITION, request, "session_not_found"
            )
        genesis, state, events, replay = loaded
        if (
            not self._has_base_grants(VALIDATE_EXECUTE_COURT_TRANSITION)
            or (
                required_dynamic_capability is not None
                and required_dynamic_capability not in self._host_grants
            )
        ):
            return self._denied(VALIDATE_EXECUTE_COURT_TRANSITION, request)
        if not replay.valid:
            return self._transition_response(
                request, state, events, False, status="rejected",
                reason=replay.reason_code, action="stop", suppress_executor=True,
            )
        expectation_checks = (
            (expected["revision"] == state.revision, "stale_revision"),
            (expected["stateSha256"] == state.state_sha256, "stale_state"),
            (expected["ledgerHeadSha256"] == state.ledger_anchor.head_sha256, "stale_ledger"),
            (expected["policyFingerprint"] == state.policy_fingerprint, "policy_fingerprint_mismatch"),
            (expected["contextFingerprint"] == state.context_fingerprint, "context_fingerprint_mismatch"),
        )
        for accepted, reason in expectation_checks:
            if not accepted:
                return self._transition_response(
                    request, state, events, True, status="reinspect", reason=reason,
                    action="reinspect",
                )
        if target not in COURT_POSITIONS:
            return self._transition_response(
                request, state, events, True, status="rejected",
                reason="court_position_not_canonical", action="replan",
            )
        if self._verification_provider is None:
            return self._transition_response(
                request, state, events, True, status="unavailable",
                reason="verification_provider_unavailable", action="stop",
                suppress_executor=True,
            )
        moves = self._effective_moves(state)
        exact_move = next(
            (
                move for move in moves
                if move.operation_id == operation
                and move.target_position == target
                and move.move_hash == move_hash
                and move.translocation_hash == translocation_hash
            ),
            None,
        )
        if exact_move is None:
            same_operation_target = next(
                (move for move in moves if move.operation_id == operation and move.target_position == target),
                None,
            )
            if operation == "court:translocate" and same_operation_target is None:
                reason = "non_adjacent_without_translocation"
            elif same_operation_target is not None and same_operation_target.move_hash != move_hash:
                reason = "move_hash_mismatch"
            elif same_operation_target is not None:
                reason = "translocation_binding_mismatch"
            elif operation in {"court:advance", "court:retreat", "court:translocate"}:
                required_capability = (
                    "court.translocate" if operation == "court:translocate" else "court.transition"
                )
                reason = (
                    "capability_denied"
                    if required_capability not in self._host_grants
                    or required_capability not in state.capabilities
                    else "operation_not_legal"
                )
            else:
                reason = "operation_not_legal"
            return self._transition_response(
                request, state, events, True,
                status="denied" if reason == "capability_denied" else "rejected",
                reason=reason,
                action="stop" if reason == "capability_denied" else "replan",
                suppress_executor=reason == "capability_denied",
            )
        normalized_selection = {
            "operationId": operation,
            "targetPosition": target,
            "moveHash": move_hash,
            "translocationHash": translocation_hash,
        }
        history = self._attempt_history.get(state.session_id, ())
        guard = evaluate_loop_guards(
            prior_state_sha256=state.state_sha256,
            action_id=operation,
            normalized_parameters=normalized_selection,
            history=history,
            policy=self._loop_policy,
        )
        if guard.decision is not LoopDecisionType.PROCEED:
            if guard.decision is LoopDecisionType.REPLAN:
                self._attempt_history[state.session_id] = (
                    history
                    + (AttemptRecord(guard.attempt_key, operation, "guard_replan"),)
                )[-8:]
            status = (
                "replan"
                if guard.decision is LoopDecisionType.REPLAN
                else "stopped"
            )
            return self._transition_response(
                request, state, events, True, status=status,
                reason=guard.reason_code,
                action="replan" if guard.decision is LoopDecisionType.REPLAN else "stop",
                suppress_executor=True,
            )

        def record_attempt(outcome: str) -> None:
            self._attempt_history[state.session_id] = (
                history + (AttemptRecord(guard.attempt_key, operation, outcome),)
            )[-8:]

        binding = (
            self._translocation_bindings.get(translocation_hash)
            if translocation_hash is not None else None
        )
        try:
            validated = validate_court_move(
                state,
                operation,
                target,
                policy=load_court_runtime_policy(),
                policy_fingerprint=expected["policyFingerprint"],
                context_fingerprint=expected["contextFingerprint"],
                capability=exact_move.capability,
                translocation_record=binding.record if binding else None,
                route_context=binding.route_context if binding else None,
            )
        except CourtRuntimeError as error:
            record_attempt("validation_rejected")
            return self._transition_response(
                request, state, events, True, status="rejected",
                reason=error.reason_code, action="replan",
            )
        try:
            decision = self._verification_provider(state, exact_move)
        except Exception:
            record_attempt("verification_provider_failed")
            return self._transition_response(
                request, state, events, True, status="rejected",
                reason="verification_provider_failed", action="replan",
            )
        if not isinstance(decision, VerificationDecision):
            record_attempt("verification_decision_invalid")
            return self._transition_response(
                request, state, events, True, status="rejected",
                reason="verification_decision_invalid", action="replan",
            )
        result = apply_court_move(
            state,
            validated,
            events,
            policy=load_court_runtime_policy(),
            verification_decision=decision,
            current_revision=state.revision,
            current_ledger_head=state.ledger_anchor.head_sha256,
            context_fingerprint=state.context_fingerprint,
        )
        if not result.accepted:
            record_attempt(result.reason_code)
            return self._transition_response(
                request, state, events, True, status="rejected",
                reason=result.reason_code, action="replan",
            )
        proposed_replay = replay_court_runtime_ledger(
            genesis,
            result.events,
            result.state.ledger_anchor,
            policy=load_court_runtime_policy(),
        )
        event_body = result.event_body
        postcondition_valid = bool(
            proposed_replay.valid
            and proposed_replay.state == result.state
            and result.state.position_id == target
            and result.state.revision == state.revision + 1
            and result.state.ledger_anchor.event_count == len(events) + 1
            and event_body is not None
        )
        # CourtTransitionEventBody binds target in intrinsicData, not as a dataclass field.
        if event_body is not None:
            intrinsic = thaw_json(event_body.intrinsic_data)
            postcondition_valid = postcondition_valid and bool(
                intrinsic.get("targetPosition") == target
                and intrinsic.get("verificationStatus") == "VERIFIED"
                and intrinsic.get("evidenceEventIds")
            )
        if not postcondition_valid:
            record_attempt("court_postcondition_failed")
            return self._transition_response(
                request, state, events, True, status="rejected",
                reason="court_postcondition_failed", action="stop",
                suppress_executor=True,
            )
        try:
            self._store.save(
                result.state,
                result.events,
                expected_state_sha256=state.state_sha256,
                expected_ledger_head=state.ledger_anchor.head_sha256,
            )
        except (CourtRuntimeError, OSError) as error:
            record_attempt("persistence_rejected")
            reason = (
                "court_state_compare_and_swap_failed"
                if isinstance(error, CourtRuntimeError)
                and error.reason_code == "court_state_compare_and_swap_failed"
                else "court_persistence_failed"
            )
            return self._transition_response(
                request, state, events, True, status="reinspect",
                reason=reason, action="reinspect",
            )
        committed = self._load_replay(state.session_id)
        if committed is None:
            raise CourtAgentApiError("committed_session_missing")
        _, committed_state, committed_events, committed_replay = committed
        if (
            not committed_replay.valid
            or committed_state != result.state
            or committed_events != result.events
        ):
            raise CourtAgentApiError("committed_court_replay_mismatch")
        self._attempt_history[state.session_id] = ()
        intrinsic = thaw_json(result.event_body.intrinsic_data)
        transition = {
            "eventId": result.event_body.event_id,
            "operationId": operation,
            "targetPosition": target,
            "moveHash": exact_move.move_hash,
            "translocationHash": exact_move.translocation_hash,
            "routeContextHash": exact_move.route_context_hash,
            "verificationStatus": "VERIFIED",
            "evidenceEventIds": list(intrinsic["evidenceEventIds"]),
        }
        return self._finalize(
            VALIDATE_EXECUTE_COURT_TRANSITION,
            request,
            "verified",
            "ok",
            _directive("continue", "ok"),
            {
                "stateBefore": _state_ref(state),
                "stateAfter": _state_ref(committed_state),
                "transition": transition,
                "ledgerDelta": {"persisted": True, "eventsAppended": 1},
                "menu": self._menu(
                    committed_state, committed_events, replay_valid=True
                ),
            },
        )

    def _load_filter_operator(self, position: str) -> CourtFilterOperator:
        try:
            document = json.loads(_FILTER_REGISTRY.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as error:
            raise CourtAgentApiError("court_filter_registry_unreadable") from error
        if (
            not isinstance(document, Mapping)
            or document.get("filterAlgebraFingerprint")
            != COURT_FILTER_ALGEBRA_FINGERPRINT
            or document.get("integratedAdmission") != "proposed_pending_crt_309"
            or not isinstance(document.get("operators"), list)
        ):
            raise CourtAgentApiError("court_filter_registry_binding_invalid")
        filter_id = f"court-filter:{position}"
        rows = [
            row
            for row in document["operators"]
            if isinstance(row, Mapping) and row.get("filterId") == filter_id
        ]
        if len(rows) != 1:
            raise CourtAgentApiError("court_filter_operator_not_found")
        row = rows[0]
        domain = row.get("domain")
        commutation = row.get("commutation")
        expected_mask = (661, 677, 1189, 1193, 1321)[COURT_POSITIONS.index(position)]
        if (
            row.get("admission") != "admitted"
            or row.get("authorizedTransforms") != [CRT304_FILTER_TRANSFORM]
            or row.get("filterType") != "linear_diagonal"
            or row.get("mask") != expected_mask
            or row.get("setClassId") != "pentatonic:5-35"
            or not isinstance(domain, Mapping)
            or domain.get("ambient") != "binary_vector_12"
            or domain.get("maskRange") != [0, 4095]
            or not isinstance(commutation, Mapping)
            or commutation.get("evaluator") != "evaluate_commutation"
            or commutation.get("resultSpace") != [
                "commutes", "does_not_commute", "left_undefined",
                "right_undefined", "both_undefined",
            ]
        ):
            raise CourtAgentApiError("court_filter_operator_metadata_invalid")
        return CourtFilterOperator(
            row["filterId"], row["filterType"], row["mask"], row["setClassId"]
        )

    def _project(self, request: Mapping[str, Any]) -> dict[str, Any]:
        source_mask = request["sourceMask"]
        if type(source_mask) is not int or not 0 <= source_mask <= 4095:
            raise CourtAgentApiError("source_mask_invalid")
        mutation_id = request["mutationOperatorId"]
        if mutation_id not in _MUTATION_IDS:
            raise CourtAgentApiError("mutation_operator_id_invalid")
        _sha256(request["expectedStateSha256"], "expected_state_sha256_invalid")
        _sha256(
            request["expectedLedgerHeadSha256"],
            "expected_ledger_head_sha256_invalid",
        )
        loaded = self._load_replay(request["sessionId"])
        if loaded is None:
            return self._unavailable(PROJECT_THROUGH_COURT, request, "session_not_found")
        _, state, events, replay = loaded
        if not self._has_base_grants(PROJECT_THROUGH_COURT):
            return self._denied(PROJECT_THROUGH_COURT, request)
        reason = self._check_expected_pair(request, state)
        if reason is not None:
            return self._finalize(
                PROJECT_THROUGH_COURT, request, "reinspect", reason,
                _directive("reinspect", reason),
                {"stateBefore": _state_ref(state), "stateAfter": _state_ref(state), "projection": None, "graph": None, "menu": self._menu(state, events, replay_valid=replay.valid)},
            )
        if not replay.valid:
            return self._finalize(
                PROJECT_THROUGH_COURT, request, "rejected", replay.reason_code,
                _directive("stop", replay.reason_code, operator_action_required=True),
                {"stateBefore": _state_ref(state), "stateAfter": _state_ref(state), "projection": None, "graph": None, "menu": self._menu(state, events, replay_valid=False)},
            )
        operator = self._load_filter_operator(state.position_id)
        application = apply_filter(operator, source_mask)
        route = evaluate_commutation(operator, mutation_id, source_mask)
        application_id = self._filter_application_ids.get(state.position_id)
        graph = self._graph_context(
            requested=application_id is not None,
            queries=(
                ("court_filter_commutation_outputs", {"applicationId": application_id}),
            ) if application_id is not None else (),
        )
        after = self._load_replay(state.session_id)
        if after is None:
            raise CourtAgentApiError("court_session_disappeared")
        _, after_state, after_events, after_replay = after
        unchanged = bool(
            after_replay.valid
            and after_state == state
            and after_events == events
            and after_state.ledger_anchor == state.ledger_anchor
        )
        projection = {
            "sourceMask": application.source_mask,
            "filterMask": application.filter_mask,
            "outputMask": application.output_mask,
            "outputVector12": format(application.output_mask, "012b"),
            "weights": {
                "source": application.source_weight,
                "retained": application.retained_weight,
            },
            "exactBitReduction": application.exact_bit_reduction,
            "filterId": application.filter_id,
            "filterAlgebraFingerprint": COURT_FILTER_ALGEBRA_FINGERPRINT,
            "routeSemantics": {
                "mutationOperatorId": route.operator_id,
                "classification": route.classification,
                "leftResultMask": route.left_result,
                "rightResultMask": route.right_result,
                "leftUndefinedReason": route.left_undefined_reason,
                "rightUndefinedReason": route.right_undefined_reason,
            },
            "runtimeUnchanged": unchanged,
        }
        reason = "ok" if unchanged else "projection_runtime_mutation_detected"
        return self._finalize(
            PROJECT_THROUGH_COURT,
            request,
            "ok" if unchanged else "rejected",
            reason,
            _directive(
                "continue" if unchanged else "stop",
                reason,
                operator_action_required=not unchanged,
            ),
            {
                "stateBefore": _state_ref(state),
                "stateAfter": _state_ref(after_state),
                "projection": projection,
                "graph": graph,
                "menu": self._menu(after_state, after_events, replay_valid=after_replay.valid),
            },
        )

    def _verify(self, request: Mapping[str, Any]) -> dict[str, Any]:
        event_id = _sha256(request["eventId"], "event_id_invalid")
        include_graph = request.get("includeGraphContext", False)
        _boolean(include_graph, "include_graph_context_invalid")
        _sha256(request["expectedStateSha256"], "expected_state_sha256_invalid")
        _sha256(
            request["expectedLedgerHeadSha256"],
            "expected_ledger_head_sha256_invalid",
        )
        loaded = self._load_replay(request["sessionId"])
        if loaded is None:
            return self._unavailable(VERIFY_COURT_POSTCONDITION, request, "session_not_found")
        _, state, events, replay = loaded
        if not self._has_base_grants(VERIFY_COURT_POSTCONDITION):
            return self._denied(VERIFY_COURT_POSTCONDITION, request)
        reason = self._check_expected_pair(request, state)
        if reason is not None:
            return self._finalize(
                VERIFY_COURT_POSTCONDITION, request, "reinspect", reason,
                _directive("reinspect", reason),
                {"state": _state_ref(state), "replay": _replay_summary(replay), "postcondition": None, "claim": {"mayDeclareSuccess": False, "claimCode": reason}, "graph": None, "menu": self._menu(state, events, replay_valid=replay.valid)},
            )
        found: tuple[int, LedgerEvent, Mapping[str, Any]] | None = None
        for index, event in enumerate(events, 1):
            payload = _event_payload(event)
            if payload.get("eventId") == event_id:
                found = (index, event, payload)
                break
        checks = {
            "eventFound": found is not None,
            "eventIdBound": False,
            "verifiedEvidenceRecorded": False,
            "targetStateBound": False,
            "chainValid": replay.valid,
            "eventChainClosure": False,
            "semanticReplayValid": replay.valid,
        }
        target_position = None
        operation_id = None
        if found is not None:
            sequence, event, payload = found
            intrinsic = payload.get("intrinsicData")
            intrinsic = intrinsic if isinstance(intrinsic, Mapping) else {}
            evidence = intrinsic.get("evidenceEventIds")
            target_position = intrinsic.get("targetPosition")
            operation_id = payload.get("operationId")
            checks["eventIdBound"] = bool(
                payload.get("eventId") == event_id
                and event.sequence == sequence
                and payload.get("sessionId") == state.session_id
            )
            checks["verifiedEvidenceRecorded"] = bool(
                intrinsic.get("verificationStatus") == "VERIFIED"
                and isinstance(evidence, list)
                and evidence
                and evidence == sorted(set(evidence))
                and all(isinstance(item, str) and _SHA256.fullmatch(item) for item in evidence)
            )
            state_after = intrinsic.get("stateAfter")
            checks["targetStateBound"] = bool(
                isinstance(state_after, Mapping)
                and state_after.get("positionId") == target_position
                and state_after.get("stateSha256") == payload.get("resultingStateSha256")
            )
            if sequence < len(events):
                next_event = events[sequence]
                next_payload = _event_payload(next_event)
                checks["eventChainClosure"] = bool(
                    event.event_sha256 == next_event.previous_event_sha256
                    and payload.get("resultingStateSha256")
                    == next_payload.get("priorStateSha256")
                )
            else:
                checks["eventChainClosure"] = bool(
                    payload.get("resultingStateSha256") == state.state_sha256
                    and event.event_sha256 == state.ledger_anchor.head_sha256
                )
        may_declare = all(checks.values())
        claim_code = (
            "verified_recorded_court_postcondition"
            if may_declare
            else "event_not_found" if found is None
            else "recorded_court_postcondition_invalid"
        )
        graph = self._graph_context(
            requested=include_graph,
            queries=(
                ("court_runtime_state_for_session", {"sessionId": state.session_id}),
                ("court_verified_events_for_session", {"sessionId": state.session_id, "limit": 25}),
            ),
        )
        return self._finalize(
            VERIFY_COURT_POSTCONDITION,
            request,
            "verified" if may_declare else "rejected",
            "ok" if may_declare else claim_code,
            _directive("continue" if may_declare else "reinspect", "ok" if may_declare else claim_code),
            {
                "state": _state_ref(state),
                "replay": _replay_summary(replay),
                "postcondition": {
                    "eventId": event_id,
                    "operationId": operation_id,
                    "targetPosition": target_position,
                    "checks": checks,
                },
                "claim": {
                    "mayDeclareSuccess": may_declare,
                    "claimCode": claim_code,
                },
                "graph": graph,
                "menu": self._menu(state, events, replay_valid=replay.valid),
            },
        )


__all__ = (
    "COURT_AGENT_API_VERSION",
    "COURT_AGENT_TOOL_ID",
    "COURT_FILTER_ALGEBRA_FINGERPRINT",
    "COURT_OPERATION_IDS",
    "CONTEXT_READ_CAPABILITY",
    "FILTER_PROJECT_CAPABILITY",
    "GRAPH_READ_NAMED_CAPABILITY",
    "INSPECT_COURT_STATE",
    "LEDGER_REPLAY_CAPABILITY",
    "LIST_LEGAL_COURT_MOVES",
    "MAX_REQUEST_BYTES",
    "MAX_RESPONSE_BYTES",
    "PROJECT_THROUGH_COURT",
    "MOVE_EXECUTE_CAPABILITY",
    "MOVE_VALIDATE_CAPABILITY",
    "MOVES_READ_CAPABILITY",
    "OUTCOME_READ_CAPABILITY",
    "POSTCONDITION_VERIFY_CAPABILITY",
    "TOOL_ID",
    "VALIDATE_EXECUTE_COURT_TRANSITION",
    "VERIFY_COURT_POSTCONDITION",
    "CourtAgentApi",
    "CourtAgentApiError",
    "TrustedTranslocationBinding",
)
