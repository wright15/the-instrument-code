"""Emit actual deterministic CourtAgentApi records for AJV integration tests."""

from __future__ import annotations

import json
from pathlib import Path
import tempfile

from governor.court_agent_api import (
    INSPECT_COURT_STATE,
    LIST_LEGAL_COURT_MOVES,
    PROJECT_THROUGH_COURT,
    VALIDATE_EXECUTE_COURT_TRANSITION,
    VERIFY_COURT_POSTCONDITION,
    CourtAgentApi,
)
from governor.court_runtime import create_court_runtime_state, load_court_runtime_policy
from governor.court_session_store import CourtSessionStore
from governor.evidence import VerificationDecision


SCHEMAS = {
    INSPECT_COURT_STATE: "crt-307.inspect-court-state.input.v1",
    LIST_LEGAL_COURT_MOVES: "crt-307.list-legal-court-moves.input.v1",
    VALIDATE_EXECUTE_COURT_TRANSITION:
        "crt-307.validate-execute-court-transition.input.v1",
    PROJECT_THROUGH_COURT: "crt-307.project-through-court.input.v1",
    VERIFY_COURT_POSTCONDITION: "crt-307.verify-court-postcondition.input.v1",
}
GRANTS = frozenset((
    "court.context.read",
    "court.ledger.replay",
    "court.graph.read.named",
    "court.moves.read",
    "court.move.validate",
    "court.move.execute",
    "court.postcondition.verify",
    "court.filter.project",
    "court.outcome.read",
    "court.transition",
    "court.translocate",
))


def request(operation: str, request_id: str, session_id: str, **fields):
    return {
        "schemaVersion": SCHEMAS[operation],
        "requestId": request_id,
        "sessionId": session_id,
        **fields,
    }


def expected(state):
    return {
        "revision": state.revision,
        "stateSha256": state.state_sha256,
        "ledgerHeadSha256": state.ledger_anchor.head_sha256,
        "policyFingerprint": state.policy_fingerprint,
        "contextFingerprint": state.context_fingerprint,
    }


def selected(move):
    return {
        "operationId": move["operationId"],
        "targetPosition": move["targetPosition"],
        "moveHash": move["moveHash"],
        "translocationHash": move["translocationHash"],
    }


def main() -> None:
    with tempfile.TemporaryDirectory(prefix="crt-307-schema-") as temporary:
        state = create_court_runtime_state(
            session_id="schema-session",
            position_id="C0",
            harmonic_profile_sha256="1" * 64,
            context_fingerprint="2" * 64,
            capabilities=("court.transition", "court.translocate"),
            policy=load_court_runtime_policy(),
        )
        store = CourtSessionStore(Path(temporary) / "store")
        store.create(state)
        api = CourtAgentApi(
            store=store,
            host_grants=GRANTS,
            verification_provider=lambda _state, _move: VerificationDecision(
                True, (), ("3" * 64,)
            ),
        )
        records = []

        def invoke(operation, body, kind, facade=api):
            records.append({"schemaId": SCHEMAS[operation], "value": body, "kind": kind})
            output = facade.invoke(operation, body)
            records.append({
                "schemaId": SCHEMAS[operation].replace(".input.v1", ".output.v1"),
                "value": output,
                "kind": kind,
            })
            return output

        invoke(
            INSPECT_COURT_STATE,
            request(INSPECT_COURT_STATE, "schema:inspect:ok", state.session_id),
            "success",
        )
        list_body = request(
            LIST_LEGAL_COURT_MOVES,
            "schema:list:ok",
            state.session_id,
            expectedStateSha256=state.state_sha256,
            expectedLedgerHeadSha256=state.ledger_anchor.head_sha256,
        )
        listed = invoke(LIST_LEGAL_COURT_MOVES, list_body, "success")
        invoke(
            PROJECT_THROUGH_COURT,
            request(
                PROJECT_THROUGH_COURT,
                "schema:project:ok",
                state.session_id,
                expectedStateSha256=state.state_sha256,
                expectedLedgerHeadSha256=state.ledger_anchor.head_sha256,
                sourceMask=1453,
                mutationOperatorId="R7",
            ),
            "success",
        )
        execute_body = request(
            VALIDATE_EXECUTE_COURT_TRANSITION,
            "schema:execute:ok",
            state.session_id,
            selectedMove=selected(listed["moves"][0]),
            expected=expected(state),
        )
        executed = invoke(
            VALIDATE_EXECUTE_COURT_TRANSITION, execute_body, "success"
        )
        current = store.load(state.session_id)[1]
        invoke(
            VERIFY_COURT_POSTCONDITION,
            request(
                VERIFY_COURT_POSTCONDITION,
                "schema:verify:ok",
                state.session_id,
                eventId=executed["transition"]["eventId"],
                expectedStateSha256=current.state_sha256,
                expectedLedgerHeadSha256=current.ledger_anchor.head_sha256,
            ),
            "success",
        )

        current_list = invoke(
            LIST_LEGAL_COURT_MOVES,
            request(
                LIST_LEGAL_COURT_MOVES,
                "schema:list:current",
                state.session_id,
                expectedStateSha256=current.state_sha256,
                expectedLedgerHeadSha256=current.ledger_anchor.head_sha256,
            ),
            "success",
        )
        invoke(
            INSPECT_COURT_STATE,
            request(
                INSPECT_COURT_STATE,
                "schema:inspect:reinspect",
                state.session_id,
                expectedStateSha256="7" * 64,
            ),
            "rejection",
        )
        invoke(
            LIST_LEGAL_COURT_MOVES,
            request(
                LIST_LEGAL_COURT_MOVES,
                "schema:list:reinspect",
                state.session_id,
                expectedStateSha256=current.state_sha256,
                expectedLedgerHeadSha256="7" * 64,
            ),
            "rejection",
        )
        invalid_selection = selected(current_list["moves"][0])
        invalid_selection["targetPosition"] = "C5"
        invoke(
            VALIDATE_EXECUTE_COURT_TRANSITION,
            request(
                VALIDATE_EXECUTE_COURT_TRANSITION,
                "schema:execute:rejected",
                state.session_id,
                selectedMove=invalid_selection,
                expected=expected(current),
            ),
            "rejection",
        )
        loop_api = CourtAgentApi(
            store=store,
            host_grants=GRANTS,
            verification_provider=lambda _state, _move: "invalid",
        )
        loop_selection = selected(current_list["moves"][0])
        for attempt in range(1, 4):
            invoke(
                VALIDATE_EXECUTE_COURT_TRANSITION,
                request(
                    VALIDATE_EXECUTE_COURT_TRANSITION,
                    f"schema:execute:loop:{attempt}",
                    state.session_id,
                    selectedMove=loop_selection,
                    expected=expected(current),
                ),
                "rejection",
                loop_api,
            )
        invoke(
            PROJECT_THROUGH_COURT,
            request(
                PROJECT_THROUGH_COURT,
                "schema:project:reinspect",
                state.session_id,
                expectedStateSha256="7" * 64,
                expectedLedgerHeadSha256=current.ledger_anchor.head_sha256,
                sourceMask=0,
                mutationOperatorId="M",
            ),
            "rejection",
        )
        invoke(
            VERIFY_COURT_POSTCONDITION,
            request(
                VERIFY_COURT_POSTCONDITION,
                "schema:verify:rejected",
                state.session_id,
                eventId="7" * 64,
                expectedStateSha256=current.state_sha256,
                expectedLedgerHeadSha256=current.ledger_anchor.head_sha256,
            ),
            "rejection",
        )

        missing = "missing-session"
        unavailable_requests = {
            INSPECT_COURT_STATE: request(
                INSPECT_COURT_STATE, "schema:inspect:missing", missing
            ),
            LIST_LEGAL_COURT_MOVES: request(
                LIST_LEGAL_COURT_MOVES,
                "schema:list:missing",
                missing,
                expectedStateSha256="4" * 64,
                expectedLedgerHeadSha256="5" * 64,
            ),
            VALIDATE_EXECUTE_COURT_TRANSITION: request(
                VALIDATE_EXECUTE_COURT_TRANSITION,
                "schema:execute:missing",
                missing,
                selectedMove=selected(listed["moves"][0]),
                expected=expected(state),
            ),
            PROJECT_THROUGH_COURT: request(
                PROJECT_THROUGH_COURT,
                "schema:project:missing",
                missing,
                expectedStateSha256="4" * 64,
                expectedLedgerHeadSha256="5" * 64,
                sourceMask=0,
                mutationOperatorId="M",
            ),
            VERIFY_COURT_POSTCONDITION: request(
                VERIFY_COURT_POSTCONDITION,
                "schema:verify:missing",
                missing,
                eventId="6" * 64,
                expectedStateSha256="4" * 64,
                expectedLedgerHeadSha256="5" * 64,
            ),
        }
        for operation, body in unavailable_requests.items():
            invoke(operation, body, "unavailable")

        print(json.dumps(records, separators=(",", ":"), sort_keys=True))


if __name__ == "__main__":
    main()
