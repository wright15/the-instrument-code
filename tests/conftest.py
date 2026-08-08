"""Shared GOV-207 fixtures: production catalog, session store, and agent API."""

from __future__ import annotations

import hashlib
from pathlib import Path
import socket

import pytest

from governor.evidence import EvidenceType, Postcondition, VictoryCondition
from governor.executors import ExecutorRegistry, ExecutorSpec, make_start_site_executor
from governor.hashing import sha256_payload
from governor.lifecycle import LifecyclePhase
from governor.loop_guards import LoopPolicy
from governor.operation_catalog import OperationDescription, RuntimeCatalog
from governor.runtime_models import OperationSpec
from governor.runtime_store import RuntimeSessionStore
from governor.transitions import OperationRegistry
from governor.verifiers import VerifierRegistry, default_verifier_entries
from governor.agent_api import AgentApi


GOV207_POLICY = sha256_payload({"policy": "gov-207"})
GOV207_CONTEXT = sha256_payload({"context": "gov-207"})
GOV207_CAPABILITIES = ("runtime.context.read", "runtime.start-site")
GOV207_HOST_GRANTS = frozenset(GOV207_CAPABILITIES)
SITE_SERVER_SCRIPT = (
    Path(__file__).parent / "fixtures" / "gov_205" / "site_server.py"
)
CLASSIFIER_POLICY_FINGERPRINT = "a" * 64
CLASSIFIER_SOURCE_FINGERPRINT = "b" * 64
CLASSIFIER_SOURCE_ID = "source:test:canonical"


def free_port() -> int:
    with socket.socket() as listener:
        listener.bind(("127.0.0.1", 0))
        return int(listener.getsockname()[1])


def classifier_policy() -> dict:
    return {
        "schemaVersion": "1.0.0",
        "releaseId": "governor-runtime:test",
        "policyFingerprint": CLASSIFIER_POLICY_FINGERPRINT,
        "sourceFingerprint": CLASSIFIER_SOURCE_FINGERPRINT,
        "typedAspects": [
            {
                "schemaVersion": "1.0.0",
                "aspectId": "aspect:test:distribution:v1",
                "aspectVersion": "1.0.0",
                "facetPath": "/process",
                "featureId": "semantic.thermodynamic_function",
                "ownerScope": "entity.aspect",
                "valueContractId": "semantic:test",
                "epistemicClass": "authored_correspondence",
                "admission": "canonical",
                "primaryGovernor": "Jupiter",
                "provenance": [
                    {"sourceId": CLASSIFIER_SOURCE_ID, "pointer": "/aspects/test"}
                ],
            }
        ],
        "bridgeRules": [
            {
                "schemaVersion": "1.0.0",
                "ruleId": "rule:test:distribution:v1",
                "ruleVersion": "1.0.0",
                "antecedents": [
                    {
                        "antecedentId": "antecedent:test:feature",
                        "kind": "feature_equals",
                        "subjectScope": "entity.aspect",
                        "featureId": "semantic.thermodynamic_function",
                        "expectedValue": "distribution",
                        "provenance": [
                            {"sourceId": CLASSIFIER_SOURCE_ID, "pointer": "/rules/test"}
                        ],
                    }
                ],
                "output": {
                    "aspectId": "aspect:test:distribution:v1",
                    "primaryGovernor": "Jupiter",
                },
                "ruleScope": "entity.facet",
                "authoritySourceIds": [CLASSIFIER_SOURCE_ID],
                "epistemicClass": "authored_correspondence",
                "admission": "canonical",
                "priority": 100,
                "missingPolicy": "return_unresolved",
                "conflictPolicy": "return_ambiguous",
                "causalClaim": False,
                "provenance": [
                    {"sourceId": CLASSIFIER_SOURCE_ID, "pointer": "/rules/test"}
                ],
            }
        ],
        "operations": [],
        "activeAspectIds": ["aspect:test:distribution:v1"],
        "activeRuleIds": ["rule:test:distribution:v1"],
    }


def classification_request() -> dict:
    return {
        "schemaVersion": "1.0.0",
        "policyReleaseId": "governor-runtime:test",
        "subject": {"subjectId": "subject:test", "subjectType": "domain_entity"},
        "facts": [
            {
                "schemaVersion": "1.0.0",
                "factId": "fact:test:distribution",
                "kind": "feature_value",
                "facetPath": "/process",
                "featureId": "semantic.thermodynamic_function",
                "value": "Distribution",
                "epistemicClass": "authored_correspondence",
                "provenance": [
                    {"sourceId": CLASSIFIER_SOURCE_ID, "pointer": "/facts/test"}
                ],
            }
        ],
        "quantities": [],
        "requestedAspectIds": ["aspect:test:distribution:v1"],
    }


def pure_operation_spec() -> OperationSpec:
    return OperationSpec(
        operation_id="operation:inspect-context",
        capability="runtime.context.read",
        allowed_phases=(LifecyclePhase.INSPECTED.value,),
        result_phase=LifecyclePhase.PROPOSED.value,
        parameter_schema={"target": "string"},
        required_parameters=("target",),
        search_dimensions=("target",),
    )


def start_site_operation_spec() -> OperationSpec:
    return OperationSpec(
        operation_id="operation:start-site",
        capability="runtime.start-site",
        allowed_phases=(
            LifecyclePhase.INSPECTED.value,
            LifecyclePhase.PROPOSED.value,
            LifecyclePhase.VALIDATED.value,
            LifecyclePhase.FAILED.value,
            LifecyclePhase.REPLAN.value,
        ),
        result_phase=LifecyclePhase.EXECUTED.value,
        parameter_schema={
            "port": "integer",
            "bind_port": "integer",
            "mode": "string",
            "status": "integer",
            "body": "string",
            "delay": "number",
        },
        required_parameters=("port",),
        defaults={
            "bind_port": 0,
            "mode": "normal",
            "status": 200,
            "body": "ready",
            "delay": 0,
        },
        search_dimensions=("port", "mode"),
    )


def build_catalog(
    tmp_path: Path,
    *,
    loop_policy: LoopPolicy | None = None,
    port: int | None = None,
) -> RuntimeCatalog:
    port = port if port is not None else free_port()
    pure_spec = pure_operation_spec()
    site_spec = start_site_operation_spec()

    def inspect_reducer(data, parameters):
        return {**dict(data), "inspected_target": parameters["target"]}

    operations = OperationRegistry(
        {
            pure_spec.operation_id: (pure_spec, inspect_reducer),
            site_spec.operation_id: (site_spec, lambda data, parameters: dict(data)),
        }
    )
    expected_body = hashlib.sha256(b"ready").hexdigest()
    executor_spec = ExecutorSpec(
        "executor:start-site",
        site_spec.operation_id,
        "runtime.start-site",
        (
            Postcondition(
                "postcondition:http",
                EvidenceType.HTTP,
                "verifier:http-local",
                {"host": "127.0.0.1", "port": port, "path": "/"},
                {"status": 200, "body_sha256": expected_body},
            ),
            Postcondition(
                "postcondition:process",
                EvidenceType.PROCESS,
                "verifier:process",
                {},
                {"running": True},
            ),
        ),
        VictoryCondition(
            "victory:site-live",
            ("postcondition:http", "postcondition:process"),
        ),
        {"site_verified": True},
    )
    executors = ExecutorRegistry(
        {site_spec.operation_id: make_start_site_executor(SITE_SERVER_SCRIPT, executor_spec)}
    )
    verifiers = VerifierRegistry(
        default_verifier_entries("runtime.start-site"),
        allowed_roots=(tmp_path,),
    )
    return RuntimeCatalog(
        operations=operations,
        descriptions={
            pure_spec.operation_id: OperationDescription(
                pure_spec.operation_id, "pure", "victory:context-inspected"
            ),
            site_spec.operation_id: OperationDescription(
                site_spec.operation_id, "external", "victory:site-live"
            ),
        },
        loop_policy=loop_policy or LoopPolicy(3, 3, 2),
        executors=executors,
        verifiers=verifiers,
    )


@pytest.fixture()
def gov207_store(tmp_path: Path) -> RuntimeSessionStore:
    return RuntimeSessionStore(tmp_path / "sessions")


@pytest.fixture()
def gov207_catalog(tmp_path: Path) -> RuntimeCatalog:
    return build_catalog(tmp_path)


@pytest.fixture()
def gov207_api(tmp_path: Path, gov207_store, gov207_catalog) -> AgentApi:
    return AgentApi(
        store=gov207_store,
        catalog=gov207_catalog,
        host_grants=GOV207_HOST_GRANTS,
        classifier_policy=classifier_policy(),
        execution_deadline_seconds=3.0,
    )
