"""Strict JSON facade exposing the five GOV-207 skill operations.

The facade is an orchestration and serialization layer only. It loads
operator-configured sessions, replays ledgers, drives the proposal/validation
lifecycle, invokes the authoritative transition and verification APIs, and
emits schema-shaped records with deterministic fingerprints. It never exposes
validation tokens, private state data, raw shell, raw Cypher, or any direct
ledger/graph write path.
"""

from __future__ import annotations

from collections.abc import Callable, Mapping
import json
import time
from typing import Any

from .classifier import ClassifierError, classify
from .dynamic_menu import (
    NamedQueryBinding,
    build_dynamic_menu,
    directive,
    recovery_move_bodies,
)
from .evidence import EvidenceRecord, evidence_body
from .harmonic_models import HarmonicContextManifest
from .hashing import canonical_json_bytes, sha256_payload
from .ledger import GENESIS_SHA256, verify_ledger
from .lifecycle import LifecyclePhase, advance_lifecycle
from .loop_guards import AttemptRecord, LoopDecisionType
from .models import LedgerAnchor, LedgerEvent, thaw_json
from .operation_catalog import RuntimeCatalog
from .outcome_reader import read_attempt_outcome
from .runtime_ledger import (
    append_runtime_event,
    commit_staged_runtime_event,
    replay_runtime_ledger,
    stage_runtime_event,
)
from .runtime_models import (
    AgentState,
    TransitionError,
    agent_state_body,
    create_agent_state,
    create_runtime_event_body,
)
from .runtime_store import RuntimeSessionStore
from .transitions import validate_move
from .verification import execute_validated_move


AGENT_API_VERSION = "gov-207.agent-api.v1"
TOOL_ID = "governor.agent_api.invoke"
MAX_REQUEST_BYTES = 65536

_OPERATION_IDS = (
    "classify_governor",
    "inspect_context",
    "list_legal_moves",
    "validate_and_execute_move",
    "verify_outcome",
)


class AgentApiError(ValueError):
    def __init__(self, reason_code: str) -> None:
        super().__init__(reason_code)
        self.reason_code = reason_code


def _require_mapping(value: Any, reason: str) -> Mapping[str, Any]:
    if not isinstance(value, Mapping):
        raise AgentApiError(reason)
    return value


def _require_str(value: Any, reason: str) -> str:
    if not isinstance(value, str) or not value:
        raise AgentApiError(reason)
    return value


def _state_ref(state: AgentState) -> dict[str, Any]:
    return {
        "taskId": state.task_id,
        "revision": state.revision,
        "phase": state.phase,
        "stateSha256": state.state_sha256,
        "ledgerHeadSha256": state.ledger_anchor.head_sha256,
        "policyFingerprint": state.policy_sha256,
        "contextFingerprint": state.context_sha256,
    }


def _evidence_record_body(record: EvidenceRecord) -> dict[str, Any]:
    body = evidence_body(record)
    return {
        "schemaVersion": body["schema_version"],
        "evidenceId": body["evidence_id"],
        "attemptId": body["attempt_id"],
        "capability": body["capability"],
        "postconditionId": body["postcondition_id"],
        "evidenceType": body["evidence_type"],
        "normalizedRequest": body["normalized_request"],
        "observation": body["observation"],
        "expectedPostcondition": body["expected_postcondition"],
        "verdict": body["verdict"],
        "verifierId": body["verifier_id"],
        "verifierVersion": body["verifier_version"],
        "evidenceSha256": record.evidence_sha256,
    }


def _attempt_history(events: tuple[LedgerEvent, ...]) -> tuple[AttemptRecord, ...]:
    started: dict[str, tuple[str, str]] = {}
    records: list[AttemptRecord] = []
    for event in events:
        kind = event.payload.get("event_kind")
        intrinsic = event.payload.get("intrinsic_data")
        if not isinstance(intrinsic, Mapping):
            continue
        if kind == "execution_started":
            attempt_id = intrinsic.get("attempt_id")
            attempt_key = intrinsic.get("attempt_key")
            operation_id = event.payload.get("operation_id")
            if (
                isinstance(attempt_id, str)
                and isinstance(attempt_key, str)
                and isinstance(operation_id, str)
            ):
                started[attempt_id] = (attempt_key, operation_id)
        elif kind == "verification_decided":
            attempt_id = intrinsic.get("attempt_id")
            if isinstance(attempt_id, str) and attempt_id in started:
                attempt_key, operation_id = started[attempt_id]
                records.append(
                    AttemptRecord(
                        attempt_key=attempt_key,
                        action_id=operation_id,
                        outcome="verified" if intrinsic.get("passed") else "failed",
                    )
                )
    return tuple(records)


class AgentApi:
    """Fixed five-operation dispatch over the authoritative runtime."""

    def __init__(
        self,
        *,
        store: RuntimeSessionStore,
        catalog: RuntimeCatalog,
        host_grants: frozenset[str] | set[str] | tuple[str, ...],
        classifier_policy: Mapping[str, Any] | None = None,
        graph_provider: Callable[[str, Mapping[str, Any]], Mapping[str, Any]] | None = None,
        projection_fingerprint: str | None = None,
        execution_deadline_seconds: float = 5.0,
        monotonic: Callable[[], float] = time.monotonic,
    ) -> None:
        self._store = store
        self._catalog = catalog
        self._host_grants = frozenset(host_grants)
        self._classifier_policy = classifier_policy
        self._graph_provider = graph_provider
        self._projection_fingerprint = projection_fingerprint
        self._execution_deadline_seconds = execution_deadline_seconds
        self._monotonic = monotonic

    # ------------------------------------------------------------------
    # Public dispatch
    # ------------------------------------------------------------------
    def invoke(self, operation_id: str, request: Mapping[str, Any]) -> dict[str, Any]:
        if operation_id not in _OPERATION_IDS:
            raise AgentApiError("operation_not_registered")
        request = _require_mapping(request, "request_must_be_json_mapping")
        handler = {
            "inspect_context": self._inspect_context,
            "classify_governor": self._classify_governor,
            "list_legal_moves": self._list_legal_moves,
            "validate_and_execute_move": self._validate_and_execute_move,
            "verify_outcome": self._verify_outcome,
        }[operation_id]
        return handler(request)

    def invoke_json(self, operation_id: str, request_text: str) -> str:
        encoded = request_text.encode("utf-8")
        if len(encoded) > MAX_REQUEST_BYTES:
            raise AgentApiError("request_too_large")
        try:
            request = json.loads(encoded)
        except json.JSONDecodeError as error:
            raise AgentApiError("request_not_json") from error
        output = self.invoke(operation_id, request)
        return canonical_json_bytes(output).decode("utf-8")

    # ------------------------------------------------------------------
    # Shared helpers
    # ------------------------------------------------------------------
    def _load_session(
        self, task_id: str
    ) -> tuple[AgentState, AgentState, tuple[LedgerEvent, ...]] | None:
        return self._store.load(task_id)

    def _graph_status(self) -> dict[str, Any]:
        available = self._graph_provider is not None
        return {
            "available": available,
            "readOnly": True,
            "projectionFingerprint": (
                self._projection_fingerprint if available else None
            ),
            "reasonCode": "ok" if available else "graph_unavailable",
        }

    def _menu(
        self,
        state: AgentState | None,
        replay_valid: bool,
        *,
        bindings: tuple[NamedQueryBinding, ...] = (),
        machine_stopped: bool = False,
    ) -> dict[str, Any]:
        return build_dynamic_menu(
            state=state,
            replay_valid=replay_valid,
            catalog=self._catalog,
            host_grants=self._host_grants,
            classifier_available=self._classifier_policy is not None,
            named_query_bindings=bindings,
            machine_stopped=machine_stopped,
        )

    def _finalize(
        self,
        operation_id: str,
        status: str,
        reason_code: str,
        request_fingerprint: str,
        core: dict[str, Any],
    ) -> dict[str, Any]:
        output_core_fingerprint = sha256_payload(core)
        receipt = {
            "toolId": TOOL_ID,
            "operationId": operation_id,
            "status": status,
            "reasonCode": reason_code,
            "requestFingerprint": request_fingerprint,
            "resultFingerprint": sha256_payload(
                {
                    "operationId": operation_id,
                    "outputCoreFingerprint": output_core_fingerprint,
                    "requestFingerprint": request_fingerprint,
                    "status": status,
                }
            ),
        }
        body = {**core, "toolReceipts": [receipt]}
        return {**body, "resultFingerprint": sha256_payload(body)}

    def _request_fingerprint(self, request: Mapping[str, Any]) -> str:
        return sha256_payload(thaw_json(request))

    def _recovery_moves(self, state: AgentState) -> tuple[dict[str, Any], ...]:
        return recovery_move_bodies(
            self._catalog.recovery_moves(state, host_grants=self._host_grants)
        )

    # ------------------------------------------------------------------
    # inspect_context
    # ------------------------------------------------------------------
    def _inspect_context(self, request: Mapping[str, Any]) -> dict[str, Any]:
        operation_id = "inspect_context"
        request_fingerprint = self._request_fingerprint(request)
        task_id = _require_str(request.get("taskId"), "task_id_invalid")
        session = self._load_session(task_id)
        include_prior = request.get("includePriorVerifiedOutcomes") is True
        limit = request.get("priorOutcomeLimit", 25)
        if isinstance(limit, bool) or not isinstance(limit, int) or not 1 <= limit <= 25:
            raise AgentApiError("prior_outcome_limit_invalid")

        if session is None:
            core = {
                "schemaVersion": "gov-207.inspect-context.output.v1",
                "skillId": operation_id,
                "requestId": _require_str(request.get("requestId"), "request_id_invalid"),
                "status": "unavailable",
                "context": {
                    "state": None,
                    "ledger": {
                        "replayValid": False,
                        "eventCount": 0,
                        "headSha256": GENESIS_SHA256,
                        "reasonCode": "session_not_found",
                    },
                    "graph": self._graph_status(),
                    "pendingAttemptId": None,
                },
                "priorVerifiedOutcomes": [],
                "menu": self._menu(None, False),
                "directive": directive(
                    "stop", "session_not_found", operator_action_required=True
                ),
            }
            return self._finalize(
                operation_id, "unavailable", "session_not_found", request_fingerprint, core
            )

        initial_state, state, events = session
        replay = replay_runtime_ledger(initial_state, events, state.ledger_anchor)
        ledger_status = {
            "replayValid": replay.valid,
            "eventCount": state.ledger_anchor.event_count,
            "headSha256": state.ledger_anchor.head_sha256,
            "reasonCode": replay.reason_code,
        }
        expected = request.get("expectedStateSha256")
        stale = expected is not None and expected != state.state_sha256

        prior_outcomes: list[dict[str, Any]] = []
        if include_prior and replay.valid:
            for event in events:
                if event.payload.get("event_kind") != "verification_decided":
                    continue
                intrinsic = event.payload.get("intrinsic_data")
                if not isinstance(intrinsic, Mapping) or not intrinsic.get("passed"):
                    continue
                state_after = intrinsic.get("state_after")
                if not isinstance(state_after, Mapping):
                    continue
                prior_outcomes.append(
                    {
                        "taskId": state_after["task_id"],
                        "revision": state_after["revision"],
                        "phase": state_after["phase"],
                        "stateSha256": state_after["state_sha256"],
                        "ledgerHeadSha256": event.event_sha256,
                        "policyFingerprint": state_after["policy_sha256"],
                        "contextFingerprint": state_after["context_sha256"],
                    }
                )
            prior_outcomes = prior_outcomes[-limit:]

        bindings: tuple[NamedQueryBinding, ...] = ()
        if self._graph_provider is not None and replay.valid:
            bindings = (
                NamedQueryBinding(
                    "prior_verified_outcomes",
                    sha256_payload({"limit": limit, "taskId": task_id}),
                    sha256_payload(_state_ref(state)),
                ),
            )
        status = "failed" if stale else ("ok" if replay.valid else "failed")
        reason = "stale_state" if stale else replay.reason_code
        directive_body = (
            directive("reinspect", "stale_state")
            if stale
            else (
                directive("continue", "ok")
                if replay.valid
                else directive("stop", replay.reason_code, operator_action_required=True)
            )
        )
        core = {
            "schemaVersion": "gov-207.inspect-context.output.v1",
            "skillId": operation_id,
            "requestId": _require_str(request.get("requestId"), "request_id_invalid"),
            "status": status,
            "context": {
                "state": _state_ref(state),
                "ledger": ledger_status,
                "graph": self._graph_status(),
                "pendingAttemptId": state.pending_attempt_id,
            },
            "priorVerifiedOutcomes": prior_outcomes,
            "menu": self._menu(state, replay.valid, bindings=bindings),
            "directive": directive_body,
        }
        return self._finalize(operation_id, status, reason, request_fingerprint, core)

    # ------------------------------------------------------------------
    # classify_governor
    # ------------------------------------------------------------------
    def _classify_governor(self, request: Mapping[str, Any]) -> dict[str, Any]:
        operation_id = "classify_governor"
        request_fingerprint = self._request_fingerprint(request)
        request_id = _require_str(request.get("requestId"), "request_id_invalid")
        task_id = _require_str(request.get("taskId"), "task_id_invalid")
        session = self._load_session(task_id)

        def respond(
            status: str,
            reason: str,
            state: AgentState | None,
            result: Mapping[str, Any] | None,
            directive_body: dict[str, Any],
            bindings: tuple[NamedQueryBinding, ...] = (),
        ) -> dict[str, Any]:
            summary = {"classified": 0, "ambiguous": 0, "unresolved": 0, "invalid": 0}
            explanations: list[dict[str, Any]] = []
            if result is not None:
                for facet in result.get("facetResults", ()):
                    outcome = facet.get("outcome")
                    if outcome in summary:
                        summary[outcome] += 1
                    if request.get("includeExplanations", True):
                        reasons = facet.get("reasonCodes", facet.get("errorCodes", []))
                        evidence_ids: list[str] = []
                        for path in facet.get("evidencePaths", ()):
                            rule_id = path.get("ruleId")
                            if isinstance(rule_id, str):
                                evidence_ids.append(rule_id)
                        for candidate in facet.get("candidates", ()):
                            evidence_ids.extend(
                                item
                                for item in candidate.get("ruleIds", ())
                                if isinstance(item, str)
                            )
                        explanations.append(
                            {
                                "facetId": facet["facetId"],
                                "outcome": outcome,
                                "reasonCodes": sorted(set(reasons)),
                                "evidenceIds": sorted(set(evidence_ids)),
                                "classifierResultFingerprint": result["resultFingerprint"],
                                "graphContextFingerprint": None,
                            }
                        )
            core = {
                "schemaVersion": "gov-207.classify-governor.output.v1",
                "skillId": operation_id,
                "requestId": request_id,
                "status": status,
                "state": _state_ref(state) if state is not None else None,
                "classificationResult": (
                    thaw_json(result) if result is not None else None
                ),
                "outcomeSummary": summary,
                "explanations": explanations,
                "nextMenu": self._menu(state, state is not None, bindings=bindings),
                "directive": directive_body,
            }
            return self._finalize(operation_id, status, reason, request_fingerprint, core)

        if session is None:
            return respond(
                "failed",
                "session_not_found",
                None,
                None,
                directive("stop", "session_not_found", operator_action_required=True),
            )
        _, state, events = session
        expected_state = request.get("expectedStateSha256")
        if expected_state != state.state_sha256:
            return respond(
                "rejected",
                "stale_state",
                state,
                None,
                directive("reinspect", "stale_state"),
            )
        if self._classifier_policy is None:
            return respond(
                "unavailable",
                "classifier_unavailable",
                state,
                None,
                directive("stop", "classifier_unavailable", operator_action_required=True),
            )
        policy_fingerprint = self._classifier_policy.get("policyFingerprint")
        if request.get("expectedPolicyFingerprint") != policy_fingerprint:
            return respond(
                "rejected",
                "policy_fingerprint_mismatch",
                state,
                None,
                directive(
                    "stop", "policy_fingerprint_mismatch", operator_action_required=True
                ),
            )
        classification_request = request.get("classificationRequest")
        try:
            result = classify(self._classifier_policy, _require_mapping(
                classification_request, "classification_request_invalid"
            ))
        except ClassifierError as error:
            return respond(
                "rejected",
                error.reason_code,
                state,
                None,
                directive("replan", error.reason_code),
            )
        bindings: tuple[NamedQueryBinding, ...] = ()
        if self._graph_provider is not None:
            bound: list[NamedQueryBinding] = []
            for facet in result.get("facetResults", ()):
                if facet.get("outcome") == "classified":
                    bound.append(
                        NamedQueryBinding(
                            "aspect_context",
                            sha256_payload({"aspectId": facet["aspectId"]}),
                            result["resultFingerprint"],
                        )
                    )
                    bound.append(
                        NamedQueryBinding(
                            "governor_profile",
                            sha256_payload({"governor": facet["primaryGovernor"]}),
                            result["resultFingerprint"],
                        )
                    )
            bindings = tuple(bound)
        return respond("ok", "ok", state, result, directive("continue", "ok"), bindings)

    # ------------------------------------------------------------------
    # list_legal_moves
    # ------------------------------------------------------------------
    def _list_legal_moves(self, request: Mapping[str, Any]) -> dict[str, Any]:
        operation_id = "list_legal_moves"
        request_fingerprint = self._request_fingerprint(request)
        request_id = _require_str(request.get("requestId"), "request_id_invalid")
        task_id = _require_str(request.get("taskId"), "task_id_invalid")
        session = self._load_session(task_id)

        def respond(
            status: str,
            reason: str,
            state: AgentState | None,
            moves: tuple[dict[str, Any], ...],
            directive_body: dict[str, Any],
            replay_valid: bool = False,
        ) -> dict[str, Any]:
            core = {
                "schemaVersion": "gov-207.list-legal-moves.output.v1",
                "skillId": operation_id,
                "requestId": request_id,
                "status": status,
                "state": _state_ref(state) if state is not None else None,
                "moves": list(moves),
                "nextMenu": self._menu(state, replay_valid),
                "directive": directive_body,
            }
            return self._finalize(operation_id, status, reason, request_fingerprint, core)

        if session is None:
            return respond(
                "failed",
                "session_not_found",
                None,
                (),
                directive("stop", "session_not_found", operator_action_required=True),
            )
        _, state, events = session
        if request.get("expectedStateSha256") != state.state_sha256:
            return respond(
                "reinspect", "stale_state", state, (), directive("reinspect", "stale_state")
            )
        if request.get("expectedLedgerHeadSha256") != state.ledger_anchor.head_sha256:
            return respond(
                "reinspect", "stale_ledger", state, (), directive("reinspect", "stale_ledger")
            )
        replay = replay_runtime_ledger(
            session[0], events, state.ledger_anchor
        )
        if not replay.valid:
            return respond(
                "failed",
                replay.reason_code,
                state,
                (),
                directive("stop", replay.reason_code, operator_action_required=True),
            )
        moves = self._catalog.describe_legal_moves(state, host_grants=self._host_grants)
        return respond(
            "ok", "ok", state, moves, directive("continue", "ok"), replay_valid=True
        )

    # ------------------------------------------------------------------
    # validate_and_execute_move
    # ------------------------------------------------------------------
    def _neutral_blocks(
        self,
        reason: str,
        effect_class: str,
        victory_condition_id: str,
        head: str,
    ) -> dict[str, Any]:
        validation_core = {
            "accepted": False,
            "reasonCode": reason,
            "normalizedParameters": {},
        }
        execution_core = {
            "attemptId": None,
            "started": False,
            "reasonCode": "not_attempted",
            "effectClass": effect_class,
        }
        verification_core = {
            "passed": False,
            "reasonCodes": [reason],
            "evidenceIds": [],
            "victoryConditionId": victory_condition_id,
        }
        cleanup_core = {
            "attempted": False,
            "succeeded": False,
            "fallbackUsed": False,
            "reasonCode": "not_attempted",
        }
        return {
            "validation": {
                **validation_core,
                "validationFingerprint": sha256_payload(validation_core),
            },
            "execution": {
                **execution_core,
                "executionFingerprint": sha256_payload(execution_core),
            },
            "verification": {
                **verification_core,
                "verificationFingerprint": sha256_payload(verification_core),
            },
            "cleanup": {
                **cleanup_core,
                "cleanupFingerprint": sha256_payload(cleanup_core),
            },
            "ledgerDelta": {
                "eventsAppended": 0,
                "beforeHeadSha256": head,
                "afterHeadSha256": head,
                "persisted": False,
            },
        }

    def _validate_and_execute_move(self, request: Mapping[str, Any]) -> dict[str, Any]:
        operation_id = "validate_and_execute_move"
        request_fingerprint = self._request_fingerprint(request)
        request_id = _require_str(request.get("requestId"), "request_id_invalid")
        task_id = _require_str(request.get("taskId"), "task_id_invalid")
        selected = _require_mapping(request.get("selectedMove"), "selected_move_invalid")
        selected_operation = _require_str(
            selected.get("operationId"), "selected_move_invalid"
        )
        selected_move_sha = _require_str(
            selected.get("moveSha256"), "selected_move_invalid"
        )
        parameters = _require_mapping(request.get("parameters"), "parameters_invalid")
        session = self._load_session(task_id)

        def effect_class_for(op_id: str) -> str:
            try:
                return self._catalog.description(op_id).effect_class
            except TransitionError:
                return "external"

        def victory_for(op_id: str) -> str:
            try:
                return self._catalog.description(op_id).victory_condition_id
            except TransitionError:
                return "victory:unknown"

        def respond(
            status: str,
            reason: str,
            state_before: AgentState,
            state_after: AgentState,
            blocks: dict[str, Any],
            claimable: bool,
            directive_body: dict[str, Any],
            replay_valid: bool,
            machine_stopped: bool = False,
        ) -> dict[str, Any]:
            core = {
                "schemaVersion": "gov-207.validate-execute.output.v1",
                "skillId": operation_id,
                "requestId": request_id,
                "status": status,
                "stateBefore": _state_ref(state_before),
                "stateAfter": _state_ref(state_after),
                **blocks,
                "claimableSuccess": claimable,
                "nextMenu": self._menu(
                    state_after, replay_valid, machine_stopped=machine_stopped
                ),
                "directive": directive_body,
            }
            return self._finalize(operation_id, status, reason, request_fingerprint, core)

        if session is None:
            raise AgentApiError("session_not_found")
        initial_state, state, events = session
        head = state.ledger_anchor.head_sha256
        neutral = self._neutral_blocks(
            "rejected", effect_class_for(selected_operation), victory_for(selected_operation), head
        )

        expected = _require_mapping(request.get("expected"), "expected_invalid")
        expected_checks = (
            ("revision", state.revision),
            ("stateSha256", state.state_sha256),
            ("ledgerHeadSha256", state.ledger_anchor.head_sha256),
            ("policyFingerprint", state.policy_sha256),
            ("contextFingerprint", state.context_sha256),
        )
        for field, actual in expected_checks:
            if expected.get(field) != actual:
                reason = "stale_state" if field in {"revision", "stateSha256"} else (
                    "stale_ledger" if field == "ledgerHeadSha256" else f"{field}_mismatch"
                )
                blocks = self._neutral_blocks(
                    reason, effect_class_for(selected_operation), victory_for(selected_operation), head
                )
                return respond(
                    "rejected", reason, state, state, blocks, False,
                    directive("reinspect", reason), replay_valid=True,
                )

        replay = replay_runtime_ledger(initial_state, events, state.ledger_anchor)
        if not replay.valid:
            blocks = self._neutral_blocks(
                replay.reason_code, effect_class_for(selected_operation),
                victory_for(selected_operation), head,
            )
            return respond(
                "failed", replay.reason_code, state, state, blocks, False,
                directive("stop", replay.reason_code, operator_action_required=True),
                replay_valid=False, machine_stopped=True,
            )

        legal = {
            move["operationId"]: move
            for move in self._catalog.describe_legal_moves(
                state, host_grants=self._host_grants
            )
        }
        selected_description = legal.get(selected_operation)
        if (
            selected_description is None
            or selected_description["moveSha256"] != selected_move_sha
        ):
            blocks = self._neutral_blocks(
                "operation_not_legal", effect_class_for(selected_operation),
                victory_for(selected_operation), head,
            )
            return respond(
                "rejected", "operation_not_legal", state, state, blocks, False,
                directive("list_legal_moves", "operation_not_legal"), replay_valid=True,
            )

        description = self._catalog.description(selected_operation)
        effect_class = description.effect_class

        # Drive the proposal/validation lifecycle in memory first for
        # external-effect operations; nothing is persisted unless validation
        # and execution both complete. Pure operations validate in place.
        working_state = state
        working_events = events
        staged_validation = None
        staged_validation_prior_state = None
        try:
            if effect_class == "external":
                drive_targets = {
                    LifecyclePhase.INSPECTED.value: (LifecyclePhase.PROPOSED, "move_proposed"),
                    LifecyclePhase.PROPOSED.value: (LifecyclePhase.VALIDATED, "move_validated"),
                    LifecyclePhase.FAILED.value: (LifecyclePhase.REPLAN, "guard_decided"),
                    LifecyclePhase.REPLAN.value: (LifecyclePhase.PROPOSED, "move_proposed"),
                }
                while working_state.phase != LifecyclePhase.VALIDATED.value:
                    drive = drive_targets.get(working_state.phase)
                    if drive is None:
                        break
                    target, kind = drive
                    driven = advance_lifecycle(working_state, target)
                    body = create_runtime_event_body(
                        event_kind=kind,
                        task_id=working_state.task_id,
                        prior_state_sha256=working_state.state_sha256,
                        resulting_state_sha256=driven.state_sha256,
                        operation_id=selected_operation,
                        intrinsic_data={
                            "move_sha256": selected_move_sha,
                            "state_after": agent_state_body(driven),
                        },
                    )
                    if kind == "move_validated":
                        staged_validation_prior_state = driven
                        staged_validation = stage_runtime_event(
                            working_events,
                            driven,
                            body,
                        )
                        driven = staged_validation.state
                    else:
                        working_events, driven = append_runtime_event(
                            working_events, driven, body
                        )
                    working_state = driven
        except TransitionError as error:
            blocks = self._neutral_blocks(
                error.reason_code, effect_class, description.victory_condition_id, head
            )
            return respond(
                "rejected", error.reason_code, state, state, blocks, False,
                directive("reinspect", error.reason_code), replay_valid=True,
            )

        if effect_class == "external" and working_state.phase != LifecyclePhase.VALIDATED.value:
            reason = "state_not_validated"
            if working_state.phase in {
                LifecyclePhase.FAILED.value,
                LifecyclePhase.REPLAN.value,
            }:
                directive_body = directive(
                    "replan", reason, recovery_moves=self._recovery_moves(state)
                )
            elif working_state.phase in {
                LifecyclePhase.VERIFIED.value,
                LifecyclePhase.STOPPED.value,
            }:
                directive_body = directive("stop", reason)
            else:
                directive_body = directive("reinspect", reason)
            blocks = self._neutral_blocks(
                reason, effect_class, description.victory_condition_id, head
            )
            return respond(
                "rejected", reason, state, state, blocks, False,
                directive_body, replay_valid=True,
            )

        spec_record = self._catalog.operations.get(selected_operation)
        assert spec_record is not None
        spec, _ = spec_record
        try:
            move = validate_move(
                working_state,
                selected_operation,
                parameters,
                self._catalog.operations,
                policy_sha256=working_state.policy_sha256,
                context_sha256=working_state.context_sha256,
                capability=spec.capability,
            )
        except TransitionError as error:
            reason = error.reason_code
            if reason == "operation_not_legal":
                directive_body = directive("list_legal_moves", reason)
            elif reason in {
                "unknown_operation_parameter",
                "missing_operation_parameter",
                "operation_parameter_type_mismatch",
            }:
                directive_body = directive("replan", reason)
            else:
                directive_body = directive(
                    "stop", reason, operator_action_required=True
                )
            blocks = self._neutral_blocks(
                reason, effect_class, description.victory_condition_id, head
            )
            return respond(
                "rejected", reason, state, state, blocks, False,
                directive_body, replay_valid=True,
            )

        if staged_validation is not None:
            assert staged_validation_prior_state is not None
            working_events, working_state = commit_staged_runtime_event(
                working_events,
                staged_validation_prior_state,
                staged_validation,
                expected_result_state=working_state,
            )

        history = _attempt_history(working_events)
        if effect_class == "pure":
            from .transitions import apply_validated_move

            applied = apply_validated_move(
                working_state, move, self._catalog.operations
            )
            if not applied.accepted or applied.event_body is None:
                reason = applied.reason_code
                blocks = self._neutral_blocks(
                    reason, effect_class, description.victory_condition_id, head
                )
                return respond(
                    "rejected", reason, state, state, blocks, False,
                    directive("replan", reason), replay_valid=True,
                )
            final_events, final_state = append_runtime_event(
                working_events, applied.state, applied.event_body
            )
            decision_passed = True
            decision_reasons: tuple[str, ...] = ()
            decision_evidence_ids: tuple[str, ...] = ()
            cleanup_succeeded = True
            cleanup_attempted = False
            cleanup_fallback = False
            cleanup_reason = "no_resource"
            attempt_id: str | None = None
            started = True
            start_reason = "applied"
            evidence_records: tuple[EvidenceRecord, ...] = ()
        else:
            now = self._monotonic()
            result = execute_validated_move(
                state=working_state,
                events=working_events,
                move=move,
                executor_registry=self._catalog.executors,
                verifier_registry=self._catalog.verifiers,
                loop_policy=self._catalog.loop_policy,
                attempt_history=history,
                monotonic_now=now,
                deadline=now + self._execution_deadline_seconds,
                recovery_candidates=self._catalog.recovery_moves(
                    working_state, host_grants=self._host_grants
                ),
                declared_search_dimensions=self._catalog.declared_search_dimensions(),
            )
            final_state = result.state
            final_events = result.events
            decision = result.decision
            decision_passed = bool(decision and decision.passed)
            decision_reasons = decision.reason_codes if decision else (result.guard.reason_code,)
            decision_evidence_ids = decision.evidence_ids if decision else ()
            cleanup_succeeded = result.cleanup.succeeded
            cleanup_attempted = result.cleanup.attempted
            cleanup_fallback = result.cleanup.fallback_used
            cleanup_reason = result.cleanup.reason_code
            attempt_id = result.attempt.attempt_id if result.attempt else None
            started = bool(result.attempt and result.attempt.started)
            start_reason = result.attempt.reason_code if result.attempt else result.guard.reason_code
            evidence_records = tuple(item.evidence for item in result.verifier_results)

            if result.guard.decision is not LoopDecisionType.PROCEED:
                status = (
                    "replan"
                    if result.guard.decision is LoopDecisionType.REPLAN
                    else "stopped"
                )
                blocks = self._result_blocks(
                    move=move,
                    effect_class=effect_class,
                    victory_condition_id=description.victory_condition_id,
                    attempt_id=attempt_id,
                    started=started,
                    start_reason=start_reason,
                    decision_passed=False,
                    decision_reasons=tuple(decision_reasons),
                    decision_evidence_ids=(),
                    cleanup_attempted=cleanup_attempted,
                    cleanup_succeeded=cleanup_succeeded,
                    cleanup_fallback=cleanup_fallback,
                    cleanup_reason=cleanup_reason,
                    before_head=head,
                    after_head=final_state.ledger_anchor.head_sha256,
                    persisted=False,
                )
                directive_body = (
                    directive(
                        "replan",
                        result.guard.reason_code,
                        recovery_moves=recovery_move_bodies(result.guard.recovery_moves),
                    )
                    if status == "replan"
                    else directive("stop", result.guard.reason_code)
                )
                self._persist(
                    initial_state, state, final_state, final_events
                )
                blocks["ledgerDelta"] = {
                    "eventsAppended": len(final_events) - len(events),
                    "beforeHeadSha256": head,
                    "afterHeadSha256": final_state.ledger_anchor.head_sha256,
                    "persisted": True,
                }
                return respond(
                    status, result.guard.reason_code, state, final_state, blocks,
                    False, directive_body, replay_valid=True,
                    machine_stopped=status == "stopped",
                )

        self._persist(initial_state, state, final_state, final_events)
        final_replay = replay_runtime_ledger(
            initial_state, final_events, final_state.ledger_anchor
        )
        final_phase = final_state.phase
        if effect_class == "pure":
            status = "verified" if decision_passed and final_replay.valid else "failed"
        elif final_phase == LifecyclePhase.VERIFIED.value:
            status = "verified"
        elif final_phase == LifecyclePhase.REPLAN.value:
            status = "replan"
        elif final_phase == LifecyclePhase.STOPPED.value:
            status = "stopped"
        else:
            status = "failed"
        claimable = (
            status == "verified"
            and decision_passed
            and cleanup_succeeded
            and final_replay.valid
        )
        reason = "ok" if claimable else (
            decision_reasons[0] if decision_reasons else "verification_failed"
        )
        if status == "verified":
            directive_body = directive("continue", "ok")
        elif status == "replan":
            directive_body = directive(
                "replan", reason, recovery_moves=self._recovery_moves(final_state)
            )
        elif status == "stopped":
            directive_body = directive("stop", reason)
        elif not cleanup_succeeded and decision_passed:
            directive_body = directive(
                "stop", "cleanup_failed", operator_action_required=True
            )
            reason = "cleanup_failed"
        else:
            directive_body = directive(
                "replan", reason, recovery_moves=self._recovery_moves(final_state)
            )
        blocks = self._result_blocks(
            move=move,
            effect_class=effect_class,
            victory_condition_id=description.victory_condition_id,
            attempt_id=attempt_id,
            started=started,
            start_reason=start_reason,
            decision_passed=decision_passed,
            decision_reasons=tuple(decision_reasons),
            decision_evidence_ids=tuple(decision_evidence_ids),
            cleanup_attempted=cleanup_attempted,
            cleanup_succeeded=cleanup_succeeded,
            cleanup_fallback=cleanup_fallback,
            cleanup_reason=cleanup_reason,
            before_head=head,
            after_head=final_state.ledger_anchor.head_sha256,
            persisted=True,
            events_appended=len(final_events) - len(events),
        )
        return respond(
            status, reason, state, final_state, blocks, claimable,
            directive_body, replay_valid=final_replay.valid,
            machine_stopped=status == "stopped",
        )

    def _result_blocks(
        self,
        *,
        move: Any,
        effect_class: str,
        victory_condition_id: str,
        attempt_id: str | None,
        started: bool,
        start_reason: str,
        decision_passed: bool,
        decision_reasons: tuple[str, ...],
        decision_evidence_ids: tuple[str, ...],
        cleanup_attempted: bool,
        cleanup_succeeded: bool,
        cleanup_fallback: bool,
        cleanup_reason: str,
        before_head: str,
        after_head: str,
        persisted: bool,
        events_appended: int = 0,
    ) -> dict[str, Any]:
        validation_core = {
            "accepted": True,
            "reasonCode": "ok",
            "normalizedParameters": thaw_json(move.normalized_parameters),
        }
        execution_core = {
            "attemptId": attempt_id,
            "started": started,
            "reasonCode": start_reason,
            "effectClass": effect_class,
        }
        verification_core = {
            "passed": decision_passed,
            "reasonCodes": sorted(set(decision_reasons)),
            "evidenceIds": sorted(set(decision_evidence_ids)),
            "victoryConditionId": victory_condition_id,
        }
        cleanup_core = {
            "attempted": cleanup_attempted,
            "succeeded": cleanup_succeeded,
            "fallbackUsed": cleanup_fallback,
            "reasonCode": cleanup_reason,
        }
        return {
            "validation": {
                **validation_core,
                "validationFingerprint": sha256_payload(validation_core),
            },
            "execution": {
                **execution_core,
                "executionFingerprint": sha256_payload(execution_core),
            },
            "verification": {
                **verification_core,
                "verificationFingerprint": sha256_payload(verification_core),
            },
            "cleanup": {
                **cleanup_core,
                "cleanupFingerprint": sha256_payload(cleanup_core),
            },
            "ledgerDelta": {
                "eventsAppended": events_appended,
                "beforeHeadSha256": before_head,
                "afterHeadSha256": after_head,
                "persisted": persisted,
            },
        }

    def _persist(
        self,
        initial_state: AgentState,
        prior_state: AgentState,
        final_state: AgentState,
        final_events: tuple[LedgerEvent, ...],
    ) -> None:
        self._store.save(
            final_state,
            final_events,
            expected_state_sha256=prior_state.state_sha256,
            expected_ledger_sha256=prior_state.ledger_anchor.head_sha256,
        )

    # ------------------------------------------------------------------
    # verify_outcome
    # ------------------------------------------------------------------
    def _verify_outcome(self, request: Mapping[str, Any]) -> dict[str, Any]:
        operation_id = "verify_outcome"
        request_fingerprint = self._request_fingerprint(request)
        request_id = _require_str(request.get("requestId"), "request_id_invalid")
        task_id = _require_str(request.get("taskId"), "task_id_invalid")
        attempt_id = _require_str(request.get("attemptId"), "attempt_id_invalid")
        session = self._load_session(task_id)
        if session is None:
            raise AgentApiError("session_not_found")
        initial_state, state, events = session

        ledger_report = verify_ledger(events, state.ledger_anchor)
        replay_block = {
            "valid": ledger_report.valid,
            "checkedEventCount": ledger_report.checked_count,
            "trustedHeadSha256": ledger_report.trusted_head_sha256,
            "recomputedHeadSha256": ledger_report.recomputed_head_sha256,
            "firstFailingSequence": ledger_report.first_failing_sequence,
            "reasonCode": ledger_report.reason_code,
        }

        def respond(
            status: str,
            reason: str,
            attempt_block: dict[str, Any],
            decision_block: dict[str, Any],
            evidence_blocks: list[dict[str, Any]],
            cleanup_block: dict[str, Any],
            claim: dict[str, Any],
            directive_body: dict[str, Any],
            replay_valid: bool,
        ) -> dict[str, Any]:
            core = {
                "schemaVersion": "gov-207.verify-outcome.output.v1",
                "skillId": operation_id,
                "requestId": request_id,
                "status": status,
                "state": _state_ref(state),
                "replay": replay_block,
                "attempt": attempt_block,
                "decision": decision_block,
                "evidence": evidence_blocks,
                "cleanup": cleanup_block,
                "claim": claim,
                "nextMenu": self._menu(state, replay_valid),
                "directive": directive_body,
            }
            return self._finalize(operation_id, status, reason, request_fingerprint, core)

        def empty_attempt(reason: str) -> dict[str, Any]:
            core = {
                "attemptId": attempt_id,
                "operationId": "operation:unknown",
                "phase": state.phase,
                "started": False,
                "reasonCode": reason,
                "recordedStateSha256": state.state_sha256,
            }
            return {**core, "resultFingerprint": sha256_payload(core)}

        def decision_block_for(
            passed: bool, reasons: tuple[str, ...], evidence_ids: tuple[str, ...]
        ) -> dict[str, Any]:
            core = {
                "passed": passed,
                "reasonCodes": sorted(set(reasons)),
                "evidenceIds": sorted(set(evidence_ids)),
                "victoryConditionId": "victory:recorded",
            }
            return {**core, "verificationFingerprint": sha256_payload(core)}

        def cleanup_block_for(
            attempted: bool, succeeded: bool, fallback: bool, reason: str
        ) -> dict[str, Any]:
            core = {
                "attempted": attempted,
                "succeeded": succeeded,
                "fallbackUsed": fallback,
                "reasonCode": reason,
            }
            return {**core, "cleanupFingerprint": sha256_payload(core)}

        if request.get("expectedStateSha256") != state.state_sha256:
            return respond(
                "failed", "stale_state", empty_attempt("stale_state"),
                decision_block_for(False, ("stale_state",), ()),
                [], cleanup_block_for(False, False, False, "not_attempted"),
                {"mayDeclareSuccess": False, "claimCode": "invalid_ledger"},
                directive("reinspect", "stale_state"), replay_valid=ledger_report.valid,
            )
        if request.get("expectedLedgerHeadSha256") != state.ledger_anchor.head_sha256:
            return respond(
                "failed", "stale_ledger", empty_attempt("stale_ledger"),
                decision_block_for(False, ("stale_ledger",), ()),
                [], cleanup_block_for(False, False, False, "not_attempted"),
                {"mayDeclareSuccess": False, "claimCode": "invalid_ledger"},
                directive("reinspect", "stale_ledger"), replay_valid=ledger_report.valid,
            )

        read = read_attempt_outcome(initial_state, events, state.ledger_anchor, attempt_id)
        if not read.replay.valid or read.outcome is None:
            return respond(
                "failed", read.replay.reason_code, empty_attempt(read.replay.reason_code),
                decision_block_for(False, (read.replay.reason_code,), ()),
                [], cleanup_block_for(False, False, False, "not_attempted"),
                {"mayDeclareSuccess": False, "claimCode": "invalid_ledger"},
                directive("stop", read.replay.reason_code, operator_action_required=True),
                replay_valid=False,
            )
        outcome = read.outcome
        if not outcome.found:
            return respond(
                "not_verified", "attempt_not_found", empty_attempt("attempt_not_found"),
                decision_block_for(False, ("attempt_not_found",), ()),
                [], cleanup_block_for(False, False, False, "not_attempted"),
                {"mayDeclareSuccess": False, "claimCode": "missing_evidence"},
                directive("reinspect", "attempt_not_found"), replay_valid=True,
            )

        attempt_core = {
            "attemptId": outcome.attempt_id,
            "operationId": outcome.operation_id or "operation:unknown",
            "phase": outcome.final_phase or state.phase,
            "started": outcome.started,
            "reasonCode": outcome.start_reason_code,
            "recordedStateSha256": outcome.recorded_state_sha256 or state.state_sha256,
        }
        attempt_block = {
            **attempt_core, "resultFingerprint": sha256_payload(attempt_core)
        }
        evidence_blocks = [
            _evidence_record_body(record) for record in outcome.evidence
        ]
        cleanup = outcome.cleanup
        cleanup_block = cleanup_block_for(
            cleanup.attempted if cleanup else False,
            cleanup.succeeded if cleanup else False,
            cleanup.fallback_used if cleanup else False,
            cleanup.reason_code if cleanup else "not_recorded",
        )
        decision_block = decision_block_for(
            bool(outcome.decision_passed),
            outcome.decision_reason_codes,
            outcome.decision_evidence_ids,
        )

        if outcome.decision_passed is None:
            status, reason = "not_verified", "missing_evidence"
            claim = {"mayDeclareSuccess": False, "claimCode": "missing_evidence"}
            directive_body = directive("reinspect", reason)
        elif not outcome.decision_passed:
            status, reason = "not_verified", (
                outcome.decision_reason_codes[0]
                if outcome.decision_reason_codes
                else "failed_evidence"
            )
            claim = {"mayDeclareSuccess": False, "claimCode": "failed_evidence"}
            directive_body = directive(
                "replan", reason, recovery_moves=self._recovery_moves(state)
            )
        elif cleanup is None or not cleanup.succeeded:
            status, reason = "failed", "cleanup_failed"
            claim = {"mayDeclareSuccess": False, "claimCode": "cleanup_failed"}
            directive_body = directive(
                "stop", "cleanup_failed", operator_action_required=True
            )
        elif outcome.final_phase == LifecyclePhase.VERIFIED.value:
            status, reason = "verified", "ok"
            claim = {"mayDeclareSuccess": True, "claimCode": "verified_evidence"}
            directive_body = directive("continue", "ok")
        else:
            status, reason = "not_verified", "missing_evidence"
            claim = {"mayDeclareSuccess": False, "claimCode": "missing_evidence"}
            directive_body = directive("reinspect", reason)
        return respond(
            status, reason, attempt_block, decision_block, evidence_blocks,
            cleanup_block, claim, directive_body, replay_valid=True,
        )


def initialize_session(
    store: RuntimeSessionStore,
    *,
    task_id: str,
    policy_sha256: str,
    capabilities: tuple[str, ...],
    context_sha256: str | None = None,
    harmonic_context_manifest: HarmonicContextManifest | None = None,
    data: Mapping[str, Any] | None = None,
    phase: str = "INSPECTED",
) -> AgentState:
    """Create a fresh authoritative session with an empty ledger."""

    state = create_agent_state(
        task_id=task_id,
        phase=phase,
        policy_sha256=policy_sha256,
        context_sha256=context_sha256,
        capabilities=capabilities,
        data=dict(data or {}),
        harmonic_context_manifest=harmonic_context_manifest,
    )
    store.create(state)
    return state
