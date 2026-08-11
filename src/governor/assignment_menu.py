"""GOV-211 authority-free menu organization over closed agent responses."""

from __future__ import annotations

from collections.abc import Callable, Mapping, Sequence
from dataclasses import dataclass
import hashlib
import hmac
from queue import Empty, Queue
import re
from threading import Lock, Thread
from time import monotonic
from typing import Any

from .availability_housing import verify_availability_housing_projection
from .availability_housing_queries import (
    execute_gov210_snapshot_query,
    normalize_gov210_query_parameters,
)
from .hashing import canonical_json_bytes, sha256_payload
from .models import thaw_json


GOV211_RESPONSE_SCHEMA_VERSION = "gov-211.assignment-aware-response.v1"
GOV211_ORGANIZATION_SCHEMA_VERSION = "gov-211.menu-organization.v1"
GOV211_QUERY_RESULT_SCHEMA_VERSION = "gov-211.assignment-query-result.v1"
GOV211_POLICY_FINGERPRINT = (
    "798336db2b977d40d819b6b64282b88eda5191f44954a87a5bb2386a6b0ab98a"
)
CANONICAL_TOPOLOGY_SHA256 = (
    "21e2a632837ecf40fe9229e9eb4ec0a5cceb9e2043fe89cb8e1d320518d7bdbc"
)
MAX_ASSIGNMENT_ROWS = 10
MAX_ASSIGNMENT_BYTES = 262144
MAX_ASSIGNMENT_ELAPSED_MS = 1000
_SHA256 = re.compile(r"^[0-9a-f]{64}$")
_BASIS_ORDER = {
    "topology": (
        "topology_node_identity",
        "mutation_application_source",
        "mutation_application_target",
        "availability_only",
    ),
    "court": (
        "court_position_identity",
        "court_ordinary_move_source",
        "court_filter_position",
        "court_ordinary_move_target",
    ),
}
_EXPECTED_BASIS = {
    "inspect_context": "topology_node_identity",
    "list_legal_moves": "mutation_application_source",
    "validate_and_execute_move": "mutation_application_source",
    "verify_outcome": "mutation_application_target",
    "inspect_court_state": "court_position_identity",
    "list_legal_court_moves": "court_ordinary_move_source",
    "validate_and_execute_court_transition": "court_ordinary_move_source",
    "project_through_court": "court_filter_position",
    "verify_court_postcondition": "court_ordinary_move_target",
}
_EXPECTED_ASSIGNMENT_SKILLS = {
    "governor": frozenset(
        {
            "inspect_context",
            "list_legal_moves",
            "validate_and_execute_move",
            "verify_outcome",
        }
    ),
    "court": frozenset(
        {
            "inspect_court_state",
            "list_legal_court_moves",
            "project_through_court",
            "validate_and_execute_court_transition",
            "verify_court_postcondition",
        }
    ),
}
_KNOWN_SKILLS = {
    "governor": _EXPECTED_ASSIGNMENT_SKILLS["governor"] | {"classify_governor"},
    "court": _EXPECTED_ASSIGNMENT_SKILLS["court"],
}
_COMMON_ROW_KEYS = frozenset(
    {
        "assignmentId",
        "basisKind",
        "basisSha256",
        "informationalOnly",
        "name",
        "runtimeAuthority",
        "skillId",
    }
)
_TOPOLOGY_ROW_KEYS = _COMMON_ROW_KEYS | {
    "scaleStateId",
    "targetOffice",
    "targetRole",
    "targetTier",
}
_COURT_ROW_KEYS = _COMMON_ROW_KEYS | {
    "kappaDenominator",
    "kappaNumerator",
    "pitchMask",
    "positionId",
}
_BASE_OUTPUT_KEYS = {
    "classify_governor": frozenset(
        {
            "classificationResult", "directive", "explanations", "nextMenu",
            "outcomeSummary", "requestId", "resultFingerprint", "schemaVersion",
            "skillId", "state", "status", "toolReceipts",
        }
    ),
    "inspect_context": frozenset(
        {
            "context", "directive", "menu", "requestId", "resultFingerprint",
            "schemaVersion", "skillId", "status", "toolReceipts",
        }
    ),
    "list_legal_moves": frozenset(
        {
            "directive", "moves", "nextMenu", "requestId", "resultFingerprint",
            "schemaVersion", "skillId", "state", "status", "toolReceipts",
        }
    ),
    "validate_and_execute_move": frozenset(
        {
            "claimableSuccess", "cleanup", "directive", "execution", "ledgerDelta",
            "nextMenu", "requestId", "resultFingerprint", "schemaVersion", "skillId",
            "stateAfter", "stateBefore", "status", "toolReceipts", "validation",
            "verification",
        }
    ),
    "verify_outcome": frozenset(
        {
            "attempt", "claim", "cleanup", "decision", "directive", "evidence",
            "nextMenu", "replay", "requestId", "resultFingerprint", "schemaVersion",
            "skillId", "state", "status", "toolReceipts",
        }
    ),
    "inspect_court_state": frozenset(
        {
            "directive", "graph", "menu", "reasonCode", "replay", "requestId",
            "resultFingerprint", "schemaVersion", "skillId", "state", "status",
            "toolReceipts",
        }
    ),
    "list_legal_court_moves": frozenset(
        {
            "directive", "menu", "moves", "reasonCode", "requestId",
            "resultFingerprint", "schemaVersion", "skillId", "state", "status",
            "toolReceipts",
        }
    ),
    "validate_and_execute_court_transition": frozenset(
        {
            "directive", "ledgerDelta", "menu", "reasonCode", "requestId",
            "resultFingerprint", "schemaVersion", "skillId", "stateAfter",
            "stateBefore", "status", "toolReceipts", "transition",
        }
    ),
    "project_through_court": frozenset(
        {
            "directive", "graph", "menu", "projection", "reasonCode", "requestId",
            "resultFingerprint", "schemaVersion", "skillId", "stateAfter",
            "stateBefore", "status", "toolReceipts",
        }
    ),
    "verify_court_postcondition": frozenset(
        {
            "claim", "directive", "graph", "menu", "postcondition", "reasonCode",
            "replay", "requestId", "resultFingerprint", "schemaVersion", "skillId",
            "state", "status", "toolReceipts",
        }
    ),
}
_BASE_OUTPUT_KEYS["inspect_context"] |= {"priorVerifiedOutcomes"}
_BASE_OUTPUT_SCHEMAS = {
    "classify_governor": "gov-207.classify-governor.output.v1",
    "inspect_context": "gov-207.inspect-context.output.v1",
    "list_legal_moves": "gov-207.list-legal-moves.output.v1",
    "validate_and_execute_move": "gov-207.validate-execute.output.v1",
    "verify_outcome": "gov-207.verify-outcome.output.v1",
    "inspect_court_state": "crt-307.inspect-court-state.output.v1",
    "list_legal_court_moves": "crt-307.list-legal-court-moves.output.v1",
    "validate_and_execute_court_transition":
        "crt-307.validate-execute-court-transition.output.v1",
    "project_through_court": "crt-307.project-through-court.output.v1",
    "verify_court_postcondition": "crt-307.verify-court-postcondition.output.v1",
}
_GOVERNOR_OPERATIONS = frozenset(_KNOWN_SKILLS["governor"])
_COURT_OPERATIONS = frozenset(_KNOWN_SKILLS["court"])
_ORGANIZATION_KEYS = frozenset(
    {
        "assignedSkills", "authority", "baseMenuFingerprint", "baseMenuUnchanged",
        "baseMovesFingerprint", "baseResultFingerprint", "baseSkillsFingerprint",
        "executorExposureChanged", "moveSetChanged", "namespace",
        "organizationFingerprint", "originalSkillIds", "policyFingerprint",
        "presentationOrder", "projectionFingerprint", "queryResultFingerprint",
        "reasonCode", "runtimeAuthority", "schemaVersion", "skillMembershipChanged",
        "status", "target", "unassignedSkillIds",
    }
)


class AssignmentMenuError(ValueError):
    """Stable failure code at the GOV-211 composition boundary."""

    def __init__(self, reason_code: str) -> None:
        super().__init__(reason_code)
        self.reason_code = reason_code


@dataclass(frozen=True, slots=True)
class TrustedTopologyTargetBinding:
    """Host-authenticated topology identity sealed to a full Governor state ref."""

    scale_state_id: int
    task_id: str
    revision: int
    state_sha256: str
    ledger_head_sha256: str
    policy_fingerprint: str
    context_fingerprint: str
    authentication_tag: str
    source_sha256: str = CANONICAL_TOPOLOGY_SHA256

    def __post_init__(self) -> None:
        if (
            type(self.scale_state_id) is not int
            or not 0 < self.scale_state_id < (1 << 12)
            or self.scale_state_id & 1 == 0
            or self.scale_state_id.bit_count() != 7
        ):
            raise AssignmentMenuError("topology_target_binding_id_invalid")
        if not isinstance(self.task_id, str) or not self.task_id:
            raise AssignmentMenuError("topology_target_binding_task_invalid")
        if type(self.revision) is not int or self.revision < 0:
            raise AssignmentMenuError("topology_target_binding_revision_invalid")
        for value in (
            self.state_sha256,
            self.ledger_head_sha256,
            self.policy_fingerprint,
            self.context_fingerprint,
            self.authentication_tag,
            self.source_sha256,
        ):
            if not isinstance(value, str) or not _SHA256.fullmatch(value):
                raise AssignmentMenuError("topology_target_binding_fingerprint_invalid")
        if self.source_sha256 != CANONICAL_TOPOLOGY_SHA256:
            raise AssignmentMenuError("topology_target_binding_source_mismatch")

    @classmethod
    def issue(
        cls,
        scale_state_id: int,
        *,
        task_id: str,
        revision: int,
        state_sha256: str,
        ledger_head_sha256: str,
        policy_fingerprint: str,
        context_fingerprint: str,
        authentication_key: bytes,
    ) -> TrustedTopologyTargetBinding:
        if not isinstance(authentication_key, bytes) or len(authentication_key) < 32:
            raise AssignmentMenuError("topology_binding_key_invalid")
        core = {
            "contextFingerprint": context_fingerprint,
            "ledgerHeadSha256": ledger_head_sha256,
            "policyFingerprint": policy_fingerprint,
            "revision": revision,
            "scaleStateId": scale_state_id,
            "sourceSha256": CANONICAL_TOPOLOGY_SHA256,
            "stateSha256": state_sha256,
            "taskId": task_id,
        }
        authentication_tag = hmac.new(
            authentication_key, canonical_json_bytes(core), hashlib.sha256
        ).hexdigest()
        return cls(authentication_tag=authentication_tag, **{
            "scale_state_id": scale_state_id,
            "task_id": task_id,
            "revision": revision,
            "state_sha256": state_sha256,
            "ledger_head_sha256": ledger_head_sha256,
            "policy_fingerprint": policy_fingerprint,
            "context_fingerprint": context_fingerprint,
        })

    def _core(self) -> dict[str, object]:
        return {
            "contextFingerprint": self.context_fingerprint,
            "ledgerHeadSha256": self.ledger_head_sha256,
            "policyFingerprint": self.policy_fingerprint,
            "revision": self.revision,
            "scaleStateId": self.scale_state_id,
            "sourceSha256": self.source_sha256,
            "stateSha256": self.state_sha256,
            "taskId": self.task_id,
        }

    def authenticated_by(self, authentication_key: bytes) -> bool:
        if not isinstance(authentication_key, bytes) or len(authentication_key) < 32:
            return False
        expected = hmac.new(
            authentication_key, canonical_json_bytes(self._core()), hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(self.authentication_tag, expected)

    @property
    def binding_fingerprint(self) -> str:
        return sha256_payload({**self._core(), "authenticationTag": self.authentication_tag})


AssignmentProvider = Callable[[str, Mapping[str, object]], Mapping[str, object]]


def seal_assignment_query_result(
    query_id: str,
    parameters: Mapping[str, object],
    rows: Sequence[Mapping[str, object]],
    *,
    projection_fingerprint: str,
) -> dict[str, object]:
    """Seal rows returned by a trusted snapshot, file, or Neo4j provider."""

    if query_id not in {"skills_for_topology_target", "skills_for_court_position"}:
        raise AssignmentMenuError("assignment_query_not_allowed")
    if not isinstance(projection_fingerprint, str) or not _SHA256.fullmatch(
        projection_fingerprint
    ):
        raise AssignmentMenuError("assignment_projection_fingerprint_invalid")
    try:
        normalized = normalize_gov210_query_parameters(query_id, parameters)
    except ValueError as error:
        raise AssignmentMenuError("assignment_query_parameters_invalid") from error
    if (
        isinstance(rows, (str, bytes, bytearray, Mapping))
        or not isinstance(rows, Sequence)
        or len(rows) > MAX_ASSIGNMENT_ROWS
        or any(not isinstance(row, Mapping) for row in rows)
    ):
        raise AssignmentMenuError("assignment_query_rows_invalid")
    materialized = [thaw_json(row) for row in rows]
    if len(canonical_json_bytes(materialized)) > MAX_ASSIGNMENT_BYTES:
        raise AssignmentMenuError("assignment_query_budget_exceeded")
    core = {
        "parameterFingerprint": sha256_payload(normalized),
        "parameters": normalized,
        "projectionFingerprint": projection_fingerprint,
        "queryId": query_id,
        "rows": materialized,
        "schemaVersion": GOV211_QUERY_RESULT_SCHEMA_VERSION,
    }
    return {**core, "resultFingerprint": sha256_payload(core)}


class SnapshotAssignmentProvider:
    """Reference provider used for file/Neo4j/provider parity."""

    def __init__(self, snapshot: Mapping[str, object]) -> None:
        if not verify_availability_housing_projection(snapshot):
            raise AssignmentMenuError("assignment_snapshot_invalid")
        self._snapshot = snapshot
        self.projection_fingerprint = str(snapshot["projectionFingerprint"])

    def __call__(
        self, query_id: str, parameters: Mapping[str, object]
    ) -> Mapping[str, object]:
        rows = execute_gov210_snapshot_query(self._snapshot, query_id, parameters)
        return seal_assignment_query_result(
            query_id,
            parameters,
            rows,
            projection_fingerprint=self.projection_fingerprint,
        )


def _extract_menu(base_output: Mapping[str, object]) -> Mapping[str, object] | None:
    for field in ("menu", "nextMenu"):
        value = base_output.get(field)
        if isinstance(value, Mapping):
            return value
    return None


def _extract_state(
    base_output: Mapping[str, object], namespace: str
) -> Mapping[str, object] | None:
    candidates: list[object] = []
    if namespace == "governor":
        context = base_output.get("context")
        if isinstance(context, Mapping):
            candidates.append(context.get("state"))
    candidates.extend(
        base_output.get(field) for field in ("state", "stateAfter", "stateBefore")
    )
    return next((item for item in candidates if isinstance(item, Mapping)), None)


def _verify_seal(value: Mapping[str, object], fingerprint_field: str) -> bool:
    fingerprint = value.get(fingerprint_field)
    if not isinstance(fingerprint, str) or not _SHA256.fullmatch(fingerprint):
        return False
    core = {key: item for key, item in value.items() if key != fingerprint_field}
    return fingerprint == sha256_payload(core)


def _verify_state_ref(namespace: str, state: Mapping[str, object]) -> bool:
    if namespace == "governor":
        expected = {
            "contextFingerprint", "ledgerHeadSha256", "phase", "policyFingerprint",
            "revision", "stateSha256", "taskId",
        }
        identity = state.get("taskId")
    else:
        expected = {
            "contextFingerprint", "eventCount", "harmonicProfileSha256",
            "internalPoles", "kappaCourt", "ledgerHeadSha256", "pitchMask",
            "policyFingerprint", "poleVector", "positionId", "revision", "sessionId",
            "snapshotHash", "stateSha256",
        }
        identity = state.get("sessionId")
    if set(state) != expected or not isinstance(identity, str) or not identity:
        return False
    if type(state.get("revision")) is not int or int(state["revision"]) < 0:
        return False
    fingerprint_fields = {
        "contextFingerprint", "ledgerHeadSha256", "policyFingerprint", "stateSha256"
    }
    if namespace == "court":
        fingerprint_fields |= {"harmonicProfileSha256", "snapshotHash"}
    return all(
        isinstance(state.get(field), str) and _SHA256.fullmatch(str(state[field]))
        for field in fingerprint_fields
    )


def _verify_menu_contract(namespace: str, menu: Mapping[str, object]) -> bool:
    expected = {
        "executorExposed", "menuFingerprint", "moves", "namedQueries", "skills"
    }
    expected.add("stateSha256" if namespace == "governor" else "schemaVersion")
    if namespace == "court":
        expected |= {"positionId", "kappaCourt"}
    skills = menu.get("skills")
    moves = menu.get("moves")
    if (
        set(menu) != expected
        or not _verify_seal(menu, "menuFingerprint")
        or not isinstance(skills, list)
        or len(skills) > 5
        or len(skills) != len(set(skills))
        or any(skill not in _KNOWN_SKILLS[namespace] for skill in skills)
        or not isinstance(moves, list)
        or type(menu.get("executorExposed")) is not bool
    ):
        return False
    if namespace == "governor":
        state_sha256 = menu.get("stateSha256")
        return state_sha256 is None or (
            isinstance(state_sha256, str) and _SHA256.fullmatch(state_sha256) is not None
        )
    return (
        menu.get("schemaVersion") == "crt-307.court-menu.v1"
        and menu.get("positionId") in {"C0", "C1", "C2", "C3", "C4"}
    )


def _verify_base_contract(
    namespace: str,
    operation_id: object,
    base: Mapping[str, object],
    *,
    request_id: object | None = None,
) -> bool:
    operations = _GOVERNOR_OPERATIONS if namespace == "governor" else _COURT_OPERATIONS
    if not isinstance(operation_id, str) or operation_id not in operations:
        return False
    allowed = _BASE_OUTPUT_KEYS[operation_id]
    required = allowed - ({"priorVerifiedOutcomes"} if operation_id == "inspect_context" else set())
    if (
        not required.issubset(base)
        or not set(base).issubset(allowed)
        or base.get("schemaVersion") != _BASE_OUTPUT_SCHEMAS[operation_id]
        or base.get("skillId") != operation_id
        or not isinstance(base.get("requestId"), str)
        or (request_id is not None and base.get("requestId") != request_id)
        or not isinstance(base.get("status"), str)
        or not _verify_seal(base, "resultFingerprint")
    ):
        return False
    menu = _extract_menu(base)
    if menu is not None and not _verify_menu_contract(namespace, menu):
        return False
    state = _extract_state(base, namespace)
    return state is None or _verify_state_ref(namespace, state)


def _base_replay_valid(namespace: str, base: Mapping[str, object]) -> bool:
    replay = base.get("replay")
    if isinstance(replay, Mapping) and replay.get("valid") is not True:
        return False
    if namespace == "governor" and base.get("skillId") == "inspect_context":
        context = base.get("context")
        ledger = context.get("ledger") if isinstance(context, Mapping) else None
        return isinstance(ledger, Mapping) and ledger.get("replayValid") is True
    return True


def _fallback_organization(
    *,
    namespace: str,
    reason_code: str,
    base_output: Mapping[str, object],
    menu: Mapping[str, object] | None,
    target: Mapping[str, object] | None = None,
) -> dict[str, object]:
    skills = list(menu.get("skills", [])) if menu is not None else []
    moves = list(menu.get("moves", [])) if menu is not None else []
    base_result_fingerprint = sha256_payload(
        {key: value for key, value in base_output.items() if key != "resultFingerprint"}
    )
    menu_fingerprint = None
    if menu is not None:
        menu_fingerprint = sha256_payload(
            {key: value for key, value in menu.items() if key != "menuFingerprint"}
        )
    core = {
        "assignedSkills": [],
        "authority": "presentation_order_only",
        "baseMenuFingerprint": menu_fingerprint,
        "baseMenuUnchanged": True,
        "baseMovesFingerprint": sha256_payload(moves),
        "baseResultFingerprint": base_result_fingerprint,
        "baseSkillsFingerprint": sha256_payload(skills),
        "executorExposureChanged": False,
        "moveSetChanged": False,
        "namespace": namespace,
        "originalSkillIds": skills,
        "policyFingerprint": GOV211_POLICY_FINGERPRINT,
        "presentationOrder": skills,
        "projectionFingerprint": None,
        "queryResultFingerprint": None,
        "reasonCode": reason_code,
        "runtimeAuthority": False,
        "schemaVersion": GOV211_ORGANIZATION_SCHEMA_VERSION,
        "skillMembershipChanged": False,
        "status": "fallback",
        "target": dict(target) if target is not None else None,
        "unassignedSkillIds": skills,
    }
    return {**core, "organizationFingerprint": sha256_payload(core)}


def _validate_assignment_rows(
    namespace: str,
    target_id: int | str,
    rows: object,
) -> tuple[dict[str, object], ...]:
    if not isinstance(rows, list) or len(rows) > MAX_ASSIGNMENT_ROWS:
        raise AssignmentMenuError("assignment_query_rows_invalid")
    expected_keys = _TOPOLOGY_ROW_KEYS if namespace == "governor" else _COURT_ROW_KEYS
    target_namespace = "topology" if namespace == "governor" else "court"
    seen: set[str] = set()
    accepted = []
    rank_order = _BASIS_ORDER[target_namespace]
    for raw in rows:
        if not isinstance(raw, Mapping) or set(raw) != expected_keys:
            raise AssignmentMenuError("assignment_query_row_shape_invalid")
        skill_id = raw.get("skillId")
        basis_kind = raw.get("basisKind")
        if (
            not isinstance(skill_id, str)
            or skill_id not in _KNOWN_SKILLS[namespace]
            or skill_id in seen
            or basis_kind != _EXPECTED_BASIS.get(skill_id)
            or basis_kind not in rank_order
            or raw.get("informationalOnly") is not True
            or raw.get("runtimeAuthority") is not False
            or not isinstance(raw.get("basisSha256"), str)
            or not _SHA256.fullmatch(str(raw["basisSha256"]))
            or not isinstance(raw.get("name"), str)
            or not 1 <= len(str(raw["name"])) <= 256
            or raw.get("assignmentId")
            != f"assignment:{skill_id}:{target_namespace}:{target_id}"
        ):
            raise AssignmentMenuError("assignment_query_row_invalid")
        if namespace == "governor" and raw.get("scaleStateId") != target_id:
            raise AssignmentMenuError("assignment_query_target_mismatch")
        if namespace == "court" and raw.get("positionId") != target_id:
            raise AssignmentMenuError("assignment_query_target_mismatch")
        seen.add(skill_id)
        accepted.append(dict(raw))
    if seen != _EXPECTED_ASSIGNMENT_SKILLS[namespace]:
        raise AssignmentMenuError("assignment_query_skill_coverage_invalid")
    return tuple(accepted)


class AssignmentAwareFacade:
    """Compose GOV-210 organization around unchanged GOV-207/CRT-307 output."""

    def __init__(
        self,
        *,
        governor_api: object | None = None,
        court_api: object | None = None,
        assignment_provider: AssignmentProvider | None = None,
        projection_fingerprint: str | None = None,
        topology_binding_key: bytes | None = None,
        timeout_ms: int = MAX_ASSIGNMENT_ELAPSED_MS,
    ) -> None:
        if governor_api is None and court_api is None:
            raise AssignmentMenuError("base_facade_required")
        if assignment_provider is not None and (
            not isinstance(projection_fingerprint, str)
            or not _SHA256.fullmatch(projection_fingerprint)
        ):
            raise AssignmentMenuError("assignment_projection_fingerprint_invalid")
        if governor_api is not None and assignment_provider is not None and (
            not isinstance(topology_binding_key, bytes) or len(topology_binding_key) < 32
        ):
            raise AssignmentMenuError("topology_binding_key_invalid")
        if type(timeout_ms) is not int or not 1 <= timeout_ms <= MAX_ASSIGNMENT_ELAPSED_MS:
            raise AssignmentMenuError("assignment_timeout_invalid")
        self._governor_api = governor_api
        self._court_api = court_api
        self._provider = assignment_provider
        self._projection_fingerprint = projection_fingerprint
        self._topology_binding_key = topology_binding_key
        self._timeout_ms = timeout_ms
        self._worker: Thread | None = None
        self._provider_lock = Lock()

    def invoke_governor(
        self,
        operation_id: str,
        request: Mapping[str, object],
        *,
        topology_binding: TrustedTopologyTargetBinding | None = None,
    ) -> dict[str, object]:
        if self._governor_api is None or not hasattr(self._governor_api, "invoke"):
            raise AssignmentMenuError("governor_facade_unavailable")
        base = self._governor_api.invoke(operation_id, request)
        return self._compose(
            "governor",
            operation_id,
            request.get("requestId"),
            base,
            topology_binding=topology_binding,
        )

    def invoke_court(
        self, operation_id: str, request: Mapping[str, object]
    ) -> dict[str, object]:
        if self._court_api is None or not hasattr(self._court_api, "invoke"):
            raise AssignmentMenuError("court_facade_unavailable")
        base = self._court_api.invoke(operation_id, request)
        return self._compose("court", operation_id, request.get("requestId"), base)

    def _call_provider(
        self, query_id: str, parameters: Mapping[str, object]
    ) -> Mapping[str, object]:
        if self._provider is None:
            raise AssignmentMenuError("assignment_provider_unavailable")
        if not self._provider_lock.acquire(blocking=False):
            raise AssignmentMenuError("assignment_provider_busy")
        try:
            if self._worker is not None:
                if self._worker.is_alive():
                    raise AssignmentMenuError("assignment_provider_busy")
                self._worker = None
            result_queue: Queue[tuple[bool, object]] = Queue(maxsize=1)

            def invoke() -> None:
                try:
                    result_queue.put((True, self._provider(query_id, parameters)))
                except BaseException as error:
                    result_queue.put((False, error))

            worker = Thread(target=invoke, daemon=True)
            self._worker = worker
            worker.start()
            worker.join(self._timeout_ms / 1000)
            if worker.is_alive():
                raise AssignmentMenuError("assignment_provider_timeout")
            self._worker = None
            try:
                succeeded, result = result_queue.get_nowait()
            except Empty as error:
                raise AssignmentMenuError("assignment_provider_result_missing") from error
            if not succeeded or not isinstance(result, Mapping):
                raise AssignmentMenuError("assignment_provider_failed")
            return result
        finally:
            self._provider_lock.release()

    def _compose(
        self,
        namespace: str,
        operation_id: str,
        request_id: object,
        base_output: Mapping[str, object],
        *,
        topology_binding: TrustedTopologyTargetBinding | None = None,
    ) -> dict[str, object]:
        base = thaw_json(base_output)
        if not isinstance(base, Mapping):
            raise AssignmentMenuError("base_output_invalid")
        menu = _extract_menu(base)
        state = _extract_state(base, namespace)
        reason = None
        target = None
        query_id = None
        parameters: dict[str, object] = {}
        if not _verify_base_contract(
            namespace, operation_id, base, request_id=request_id
        ):
            reason = "base_response_contract_invalid"
        elif menu is None:
            reason = "base_menu_fingerprint_invalid"
        elif base.get("status") not in {"ok", "verified"}:
            reason = "base_result_not_organizable"
        elif not _base_replay_valid(namespace, base):
            reason = "base_replay_invalid"
        elif state is None:
            reason = "base_state_unavailable"
        elif self._provider is None:
            reason = "assignment_provider_unavailable"
        elif namespace == "governor":
            if topology_binding is None:
                reason = "topology_target_binding_unavailable"
            elif not topology_binding.authenticated_by(self._topology_binding_key or b""):
                reason = "topology_target_binding_unauthenticated"
            elif (
                topology_binding.task_id != state.get("taskId")
                or topology_binding.revision != state.get("revision")
                or topology_binding.state_sha256 != state.get("stateSha256")
                or topology_binding.ledger_head_sha256 != state.get("ledgerHeadSha256")
                or topology_binding.policy_fingerprint != state.get("policyFingerprint")
                or topology_binding.context_fingerprint != state.get("contextFingerprint")
                or topology_binding.state_sha256 != menu.get("stateSha256")
            ):
                reason = "topology_target_binding_stale"
            else:
                target = {
                    "bindingFingerprint": topology_binding.binding_fingerprint,
                    "targetId": topology_binding.scale_state_id,
                    "targetNamespace": "topology",
                }
                query_id = "skills_for_topology_target"
                parameters = {"scaleStateId": topology_binding.scale_state_id}
        else:
            position_id = state.get("positionId")
            if position_id != menu.get("positionId") or position_id not in {
                "C0",
                "C1",
                "C2",
                "C3",
                "C4",
            }:
                reason = "court_target_binding_invalid"
            else:
                target_core = {
                    "baseResultFingerprint": base.get("resultFingerprint"),
                    "menuFingerprint": menu.get("menuFingerprint"),
                    "state": dict(state),
                }
                target = {
                    "bindingFingerprint": sha256_payload(target_core),
                    "targetId": position_id,
                    "targetNamespace": "court",
                }
                query_id = "skills_for_court_position"
                parameters = {"positionId": position_id}

        if reason is not None:
            organization = _fallback_organization(
                namespace=namespace,
                reason_code=reason,
                base_output=base,
                menu=menu,
                target=target,
            )
            return self._wrap(namespace, base, organization)

        assert query_id is not None and target is not None and menu is not None
        try:
            started = monotonic()
            result = self._call_provider(query_id, parameters)
            expected_result_core = {
                key: value for key, value in result.items() if key != "resultFingerprint"
            }
            if (
                set(result)
                != {
                    "parameterFingerprint",
                    "parameters",
                    "projectionFingerprint",
                    "queryId",
                    "resultFingerprint",
                    "rows",
                    "schemaVersion",
                }
                or result.get("schemaVersion") != GOV211_QUERY_RESULT_SCHEMA_VERSION
                or result.get("queryId") != query_id
                or result.get("parameters") != parameters
                or result.get("parameterFingerprint") != sha256_payload(parameters)
                or result.get("projectionFingerprint") != self._projection_fingerprint
                or result.get("resultFingerprint") != sha256_payload(expected_result_core)
                or len(canonical_json_bytes(result)) > MAX_ASSIGNMENT_BYTES
                or (monotonic() - started) * 1000 > self._timeout_ms
            ):
                raise AssignmentMenuError("assignment_query_result_invalid")
            rows = _validate_assignment_rows(namespace, target["targetId"], result.get("rows"))
            original_skills = list(menu.get("skills", []))
            if (
                len(original_skills) != len(set(original_skills))
                or any(skill not in _KNOWN_SKILLS[namespace] for skill in original_skills)
            ):
                raise AssignmentMenuError("base_menu_skills_invalid")
            rank_order = _BASIS_ORDER[str(target["targetNamespace"])]
            row_by_skill = {str(row["skillId"]): row for row in rows}
            assigned = []
            for skill_id in original_skills:
                row = row_by_skill.get(skill_id)
                if row is None:
                    continue
                assigned.append(
                    {
                        "assignmentId": row["assignmentId"],
                        "basisKind": row["basisKind"],
                        "basisSha256": row["basisSha256"],
                        "rank": rank_order.index(str(row["basisKind"])),
                        "skillId": skill_id,
                    }
                )
            assigned.sort(key=lambda row: (int(row["rank"]), str(row["skillId"])))
            assigned_ids = [str(row["skillId"]) for row in assigned]
            unassigned = [skill for skill in original_skills if skill not in assigned_ids]
            moves = list(menu.get("moves", []))
            organization_core = {
                "assignedSkills": assigned,
                "authority": "presentation_order_only",
                "baseMenuFingerprint": menu["menuFingerprint"],
                "baseMenuUnchanged": True,
                "baseMovesFingerprint": sha256_payload(moves),
                "baseResultFingerprint": base["resultFingerprint"],
                "baseSkillsFingerprint": sha256_payload(original_skills),
                "executorExposureChanged": False,
                "moveSetChanged": False,
                "namespace": namespace,
                "originalSkillIds": original_skills,
                "policyFingerprint": GOV211_POLICY_FINGERPRINT,
                "presentationOrder": [*assigned_ids, *unassigned],
                "projectionFingerprint": self._projection_fingerprint,
                "queryResultFingerprint": result["resultFingerprint"],
                "reasonCode": "ok",
                "runtimeAuthority": False,
                "schemaVersion": GOV211_ORGANIZATION_SCHEMA_VERSION,
                "skillMembershipChanged": False,
                "status": "organized",
                "target": target,
                "unassignedSkillIds": unassigned,
            }
            organization = {
                **organization_core,
                "organizationFingerprint": sha256_payload(organization_core),
            }
        except (AssignmentMenuError, TypeError, ValueError):
            organization = _fallback_organization(
                namespace=namespace,
                reason_code="assignment_query_failed",
                base_output=base,
                menu=menu,
                target=target,
            )
        return self._wrap(namespace, base, organization)

    @staticmethod
    def _wrap(
        namespace: str,
        base_output: Mapping[str, object],
        organization: Mapping[str, object],
    ) -> dict[str, object]:
        base_result_fingerprint = sha256_payload(
            {
                key: value
                for key, value in base_output.items()
                if key != "resultFingerprint"
            }
        )
        core = {
            "baseOutput": dict(base_output),
            "baseResultFingerprint": base_result_fingerprint,
            "namespace": namespace,
            "organization": dict(organization),
            "schemaVersion": GOV211_RESPONSE_SCHEMA_VERSION,
        }
        return {**core, "resultFingerprint": sha256_payload(core)}


def verify_assignment_aware_response(response: Mapping[str, object]) -> bool:
    """Verify wrapper, base response, menu, and organization seals."""

    try:
        if set(response) != {
            "baseOutput",
            "baseResultFingerprint",
            "namespace",
            "organization",
            "resultFingerprint",
            "schemaVersion",
        } or response.get("schemaVersion") != GOV211_RESPONSE_SCHEMA_VERSION:
            return False
        core = {key: value for key, value in response.items() if key != "resultFingerprint"}
        if response.get("resultFingerprint") != sha256_payload(core):
            return False
        base = response["baseOutput"]
        organization = response["organization"]
        if not isinstance(base, Mapping) or not isinstance(organization, Mapping):
            return False
        namespace = response.get("namespace")
        if namespace not in {"governor", "court"}:
            return False
        operation_id = base.get("skillId")
        if not _verify_base_contract(str(namespace), operation_id, base):
            return False
        base_core = {key: value for key, value in base.items() if key != "resultFingerprint"}
        if (
            response.get("baseResultFingerprint") != sha256_payload(base_core)
            or response.get("baseResultFingerprint") != base.get("resultFingerprint")
        ):
            return False
        if set(organization) != _ORGANIZATION_KEYS:
            return False
        organization_core = {
            key: value for key, value in organization.items() if key != "organizationFingerprint"
        }
        if organization.get("organizationFingerprint") != sha256_payload(organization_core):
            return False
        if (
            organization.get("authority") != "presentation_order_only"
            or organization.get("schemaVersion") != GOV211_ORGANIZATION_SCHEMA_VERSION
            or organization.get("namespace") != namespace
            or organization.get("policyFingerprint") != GOV211_POLICY_FINGERPRINT
            or organization.get("baseResultFingerprint") != base.get("resultFingerprint")
            or organization.get("runtimeAuthority") is not False
            or organization.get("baseMenuUnchanged") is not True
            or organization.get("skillMembershipChanged") is not False
            or organization.get("moveSetChanged") is not False
            or organization.get("executorExposureChanged") is not False
        ):
            return False
        original = organization.get("originalSkillIds")
        presentation = organization.get("presentationOrder")
        unassigned = organization.get("unassignedSkillIds")
        assigned = organization.get("assignedSkills")
        if (
            not isinstance(original, list)
            or not isinstance(presentation, list)
            or not isinstance(unassigned, list)
            or not isinstance(assigned, list)
            or len(original) != len(set(original))
            or len(presentation) != len(set(presentation))
            or sorted(original) != sorted(presentation)
            or any(skill not in _KNOWN_SKILLS[str(namespace)] for skill in original)
        ):
            return False
        menu = _extract_menu(base)
        if menu is None:
            return (
                organization.get("status") == "fallback"
                and original == []
                and presentation == []
                and unassigned == []
                and assigned == []
                and organization.get("baseMenuFingerprint") is None
            )
        if (
            original != menu.get("skills")
            or organization.get("baseMenuFingerprint") != menu.get("menuFingerprint")
            or organization.get("baseMovesFingerprint")
            != sha256_payload(menu.get("moves", []))
            or organization.get("baseSkillsFingerprint")
            != sha256_payload(menu.get("skills", []))
        ):
            return False
        status = organization.get("status")
        target = organization.get("target")
        if target is not None:
            if (
                not isinstance(target, Mapping)
                or set(target) != {"bindingFingerprint", "targetId", "targetNamespace"}
                or not isinstance(target.get("bindingFingerprint"), str)
                or _SHA256.fullmatch(str(target["bindingFingerprint"])) is None
                or target.get("targetNamespace")
                != ("topology" if namespace == "governor" else "court")
            ):
                return False
        if status == "fallback":
            return (
                organization.get("reasonCode") != "ok"
                and presentation == original
                and unassigned == original
                and assigned == []
                and organization.get("projectionFingerprint") is None
                and organization.get("queryResultFingerprint") is None
            )
        if status != "organized" or target is None:
            return False
        if (
            organization.get("reasonCode") != "ok"
            or organization.get("projectionFingerprint") is None
            or organization.get("queryResultFingerprint") is None
            or _SHA256.fullmatch(str(organization["projectionFingerprint"])) is None
            or _SHA256.fullmatch(str(organization["queryResultFingerprint"])) is None
        ):
            return False
        target_namespace = str(target["targetNamespace"])
        rank_order = _BASIS_ORDER[target_namespace]
        assigned_ids = []
        expected_assigned = []
        for item in assigned:
            if (
                not isinstance(item, Mapping)
                or set(item)
                != {"assignmentId", "basisKind", "basisSha256", "rank", "skillId"}
                or item.get("skillId") not in original
                or item.get("skillId") in assigned_ids
                or item.get("basisKind") != _EXPECTED_BASIS.get(item.get("skillId"))
                or item.get("basisKind") not in rank_order
                or item.get("rank") != rank_order.index(str(item["basisKind"]))
                or not isinstance(item.get("basisSha256"), str)
                or _SHA256.fullmatch(str(item["basisSha256"])) is None
                or item.get("assignmentId")
                != f"assignment:{item.get('skillId')}:{target_namespace}:{target.get('targetId')}"
            ):
                return False
            assigned_ids.append(item["skillId"])
            expected_assigned.append(item)
        if expected_assigned != sorted(
            expected_assigned, key=lambda item: (int(item["rank"]), str(item["skillId"]))
        ):
            return False
        expected_unassigned = [skill for skill in original if skill not in assigned_ids]
        return unassigned == expected_unassigned and presentation == [
            *assigned_ids, *expected_unassigned
        ]
    except (KeyError, TypeError, ValueError):
        return False
