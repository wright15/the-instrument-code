"""State-derived dynamic skill, query, and move menus for GOV-207 hosts.

The menu is computed from the replayed authoritative state, the operator
catalog, host capability grants, and the closed skill manifest. It never
grants authority: it only exposes what the runtime already considers legal.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from .hashing import sha256_payload
from .models import _require_identifier, _require_sha256
from .operation_catalog import RuntimeCatalog
from .runtime_models import AgentState


SKILL_IDS = (
    "classify_governor",
    "inspect_context",
    "list_legal_moves",
    "validate_and_execute_move",
    "verify_outcome",
)
NAMED_QUERY_IDS = (
    "aspect_context",
    "governor_profile",
    "legal_move_context",
    "prior_verified_outcomes",
    "provenance_path",
    "rule_explanation",
)

_MOVE_PHASES = frozenset({"INSPECTED", "PROPOSED", "VALIDATED", "FAILED", "REPLAN"})


@dataclass(frozen=True, slots=True)
class NamedQueryBinding:
    """A trusted query exposure whose parameters came from runtime output."""

    query_id: str
    parameter_fingerprint: str
    source_result_fingerprint: str

    def __post_init__(self) -> None:
        if self.query_id not in NAMED_QUERY_IDS:
            raise ValueError("named_query_id_invalid")
        _require_sha256(self.parameter_fingerprint, "parameter_fingerprint")
        _require_sha256(self.source_result_fingerprint, "source_result_fingerprint")


def compute_menu_fingerprint(menu_core: dict[str, Any]) -> str:
    return sha256_payload(menu_core)


def _phase_skills(phase: str, *, classifier_available: bool) -> tuple[str, ...]:
    if phase in {"INSPECTED", "PROPOSED"}:
        skills = ["inspect_context", "list_legal_moves"]
        if classifier_available:
            skills.append("classify_governor")
        return tuple(sorted(skills))
    if phase == "VALIDATED":
        return tuple(
            sorted(
                (
                    "inspect_context",
                    "list_legal_moves",
                    "validate_and_execute_move",
                )
            )
        )
    if phase in {"EXECUTED", "EVIDENCE_RECORDED", "VERIFIED", "STOPPED"}:
        return tuple(sorted(("inspect_context", "verify_outcome")))
    if phase == "FAILED":
        return tuple(
            sorted(("inspect_context", "list_legal_moves", "verify_outcome"))
        )
    if phase == "REPLAN":
        return tuple(sorted(("inspect_context", "list_legal_moves")))
    return tuple(sorted(("inspect_context",)))


def build_dynamic_menu(
    *,
    state: AgentState | None,
    replay_valid: bool,
    catalog: RuntimeCatalog,
    host_grants: frozenset[str] | set[str] | tuple[str, ...],
    classifier_available: bool,
    named_query_bindings: tuple[NamedQueryBinding, ...] = (),
    machine_stopped: bool = False,
) -> dict[str, Any]:
    """Build the schema-shaped dynamic menu for the current runtime state."""

    grants = frozenset(host_grants)
    if state is None or not replay_valid:
        skills = tuple(sorted(("inspect_context", "verify_outcome")))
        moves: tuple[dict[str, Any], ...] = ()
        executor_exposed = False
    elif machine_stopped:
        skills = tuple(sorted(("inspect_context", "verify_outcome")))
        moves = ()
        executor_exposed = False
    else:
        skills = _phase_skills(state.phase, classifier_available=classifier_available)
        if state.phase in _MOVE_PHASES:
            moves = catalog.describe_legal_moves(state, host_grants=grants)
        else:
            moves = ()
        executor_exposed = (
            "validate_and_execute_move" in skills
            and any(move["effectClass"] == "external" for move in moves)
        )
        if not moves and "validate_and_execute_move" in skills:
            skills = tuple(
                sorted(skill for skill in skills if skill != "validate_and_execute_move")
            )
            executor_exposed = False

    queries = [
        {
            "queryId": binding.query_id,
            "queryVersion": "1.0.0",
            "parameterFingerprint": binding.parameter_fingerprint,
            "sourceResultFingerprint": binding.source_result_fingerprint,
        }
        for binding in sorted(named_query_bindings, key=lambda item: item.query_id)
    ]
    core: dict[str, Any] = {
        "stateSha256": state.state_sha256 if state is not None else None,
        "skills": list(skills),
        "namedQueries": queries,
        "moves": list(moves),
        "executorExposed": executor_exposed,
    }
    return {**core, "menuFingerprint": compute_menu_fingerprint(core)}


def directive(
    action: str,
    reason_code: str,
    *,
    recovery_moves: tuple[dict[str, Any], ...] = (),
    operator_action_required: bool = False,
) -> dict[str, Any]:
    _require_identifier(reason_code, "reason_code")
    return {
        "action": action,
        "reasonCode": reason_code,
        "recoveryMoves": list(recovery_moves),
        "operatorActionRequired": operator_action_required,
    }


def recovery_move_bodies(moves: tuple[Any, ...]) -> tuple[dict[str, Any], ...]:
    return tuple(
        {
            "operationId": move.operation_id,
            "changedDimensions": list(move.changed_dimensions),
        }
        for move in sorted(moves, key=lambda item: item.operation_id)
    )
