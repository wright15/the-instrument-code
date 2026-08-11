#!/usr/bin/env python3
"""Emit deterministic Phase 4 structural-proof metrics from canonical inputs."""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
from pathlib import Path
import subprocess
import sys


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))
sys.path.insert(0, str(ROOT / "court-mathematics" / "src"))
sys.path.insert(0, str(ROOT / "seven-governors-harmonic-invariants-v0.1.0" / "src"))
sys.path.insert(0, str(ROOT / "seven-governors-court-filter-algebra-v0.1.0" / "src"))
sys.path.insert(0, str(ROOT / "tests" / "verification"))

from court_filter_algebra import (  # noqa: E402
    CourtFilterOperator,
    evaluate_commutation,
)
from governor.court_runtime import (  # noqa: E402
    CourtRuntimeError,
    apply_court_move,
    create_court_route_context,
    create_court_runtime_state,
    create_topological_translocation_record,
    list_legal_court_moves,
    load_court_runtime_policy,
    replay_court_runtime_ledger,
    validate_court_move,
    write_kappa_coordinate,
)
from governor.evidence import VerificationDecision  # noqa: E402
from governor.hashing import canonical_json_bytes, sha256_payload  # noqa: E402
from harmonic_invariants import evaluate_carey_535  # noqa: E402
from harmonic_invariants.builder import build_release as build_invariant_release  # noqa: E402
from _oracles import (  # noqa: E402
    LOCAL_OPERATORS,
    OPERATORS,
    apply_court_filter,
    apply_operator,
    canonical_masks,
    canonical_records,
    commutation_metrics,
    mutation_application_map,
    operator_pairs,
    source_sha256,
)


def _require(condition: bool, reason: str) -> None:
    if not condition:
        raise RuntimeError(reason)


def build_report(*, integration_results: dict[str, str] | None = None) -> dict[str, object]:
    masks = canonical_masks()
    records = canonical_records()
    applications = mutation_application_map()
    _require(len(masks) == len(records) == 462, "canonical_state_count_mismatch")
    _require(
        all(mask.bit_count() == 7 and mask & 1 for mask in masks),
        "canonical_state_domain_mismatch",
    )

    domain_sizes = {}
    image_sizes = {}
    for operator_id in OPERATORS:
        expected = {
            source: target
            for source in masks
            if (target := apply_operator(operator_id, source)) is not None
        }
        generated = {
            source: target
            for (operator, source), target in applications.items()
            if operator == operator_id
        }
        _require(expected == generated, f"mutation_application_mismatch:{operator_id}")
        domain_sizes[operator_id] = len(expected)
        image_sizes[operator_id] = len(set(expected.values()))

    commutation = [commutation_metrics(*pair, masks) for pair in operator_pairs()]
    _require(len(commutation) == 91, "commutation_pair_count_mismatch")
    _require(
        sum(item["unequal_when_both_defined"] for item in commutation) == 0,
        "commutation_value_mismatch",
    )
    with (ROOT / "seven-governors-mutation-algebra-audit/audit/commutation-summary.csv").open(
        newline="",
        encoding="utf-8",
    ) as handle:
        summary_rows = {
            (row["operator_a"], row["operator_b"]): row
            for row in csv.DictReader(handle)
        }
    _require(len(summary_rows) == 91, "commutation_summary_count_mismatch")
    for pair, metrics in zip(operator_pairs(), commutation):
        row = summary_rows[pair]
        integer_fields = (
            "source_states_tested",
            "a_then_b_defined",
            "b_then_a_defined",
            "both_defined",
            "equal_when_both_defined",
            "unequal_when_both_defined",
            "domain_asymmetry",
            "neither_defined",
            "both_first_steps_defined",
            "direct_diamonds",
            "blocked_critical_pairs",
        )
        _require(
            all(int(row[field]) == metrics[field] for field in integer_fields),
            f"commutation_summary_mismatch:{pair[0]}",
        )
        _require(
            row["classification"] == metrics["classification"],
            f"commutation_classification_mismatch:{pair[0]}",
        )

    filter_checks = 0
    for source in masks:
        for court_mask in range(4096):
            once = apply_court_filter(source, court_mask)
            _require(
                apply_court_filter(once, court_mask) == once,
                "court_filter_idempotence_violation",
            )
            filter_checks += 1

    ground_triangle_checks = 0
    for left in range(12):
        for middle in range(12):
            for right in range(12):
                distance = lambda a, b: min((a - b) % 12, (b - a) % 12)
                _require(
                    distance(left, right) <= distance(left, middle) + distance(middle, right),
                    "pitch_class_triangle_violation",
                )
                ground_triangle_checks += 1

    carey = evaluate_carey_535((0, 2, 4, 7, 9))
    _require(carey.difference_count == 20, "carey_difference_enumeration_mismatch")
    _require(carey.failure_count == 0, "carey_failure_enumeration_mismatch")
    _require(
        carey.coherence_quotient.numerator
        == carey.coherence_quotient.denominator
        == 1,
        "carey_cq_enumerator_mismatch",
    )
    _require(
        (carey.sameness_quotient.numerator, carey.sameness_quotient.denominator)
        == (1, 2),
        "carey_sq_enumerator_mismatch",
    )
    invariant_path = (
        ROOT
        / "seven-governors-harmonic-invariants-v0.1.0/canonical/harmonic-invariant-registry.json"
    )
    invariant_release = json.loads(invariant_path.read_text(encoding="utf-8"))
    _require(invariant_release == build_invariant_release(), "harmonic_invariant_release_stale")
    filter_root = ROOT / "seven-governors-court-filter-algebra-v0.1.0/canonical"
    filter_release = json.loads(
        (filter_root / "filter-algebra-release.json").read_text(encoding="utf-8")
    )
    filter_registry = json.loads(
        (filter_root / "filter-operator-registry.json").read_text(encoding="utf-8")
    )
    filter_commutation = json.loads(
        (filter_root / "commutation-table.json").read_text(encoding="utf-8")
    )
    bridge_filter = next(
        item for item in filter_registry["operators"] if item["mask"] == 173
    )
    bridge_operator = CourtFilterOperator(
        bridge_filter["filterId"],
        bridge_filter["filterType"],
        bridge_filter["mask"],
        bridge_filter["setClassId"],
    )
    route = evaluate_commutation(bridge_operator, "R7", 1453)
    _require(route.classification == "right_undefined", "court_filter_route_mismatch")
    _require(route.left_result == 173, "court_filter_left_result_mismatch")
    _require(filter_commutation["evaluationCount"] == 48510, "court_filter_coverage_mismatch")
    _require(
        filter_commutation["classificationTotals"]
        == {
            "both_undefined": 24696,
            "commutes": 0,
            "does_not_commute": 0,
            "left_undefined": 0,
            "right_undefined": 23814,
        },
        "court_filter_classification_totals_mismatch",
    )
    court_policy = load_court_runtime_policy()
    court_states = tuple(
        create_court_runtime_state(
            session_id=f"phase4-position-{index}",
            position_id=f"C{index}",
            harmonic_profile_sha256="a" * 64,
            context_fingerprint="b" * 64,
            capabilities=("court.transition", "court.translocate"),
            policy=court_policy,
        )
        for index in range(5)
    )
    legal_move_counts = [
        len(list_legal_court_moves(state, court_policy)) for state in court_states
    ]
    _require(legal_move_counts == [1, 2, 2, 2, 1], "court_legal_move_closure_mismatch")
    verification = VerificationDecision(True, (), ("c" * 64,))
    adjacent_move = validate_court_move(
        court_states[0], "court:advance", "C1", policy=court_policy
    )
    adjacent = apply_court_move(
        court_states[0],
        adjacent_move,
        policy=court_policy,
        verification_decision=verification,
    )
    _require(adjacent.accepted, "court_adjacent_transition_rejected")
    adjacent_replay = replay_court_runtime_ledger(
        court_states[0], adjacent.events, adjacent.state.ledger_anchor, policy=court_policy
    )
    _require(
        adjacent_replay.valid and adjacent_replay.state == adjacent.state,
        "court_adjacent_replay_mismatch",
    )
    translocation_state = create_court_runtime_state(
        session_id="phase4-translocation",
        position_id="C0",
        harmonic_profile_sha256="a" * 64,
        context_fingerprint="b" * 64,
        capabilities=("court.transition", "court.translocate"),
        policy=court_policy,
    )
    translocation_record = create_topological_translocation_record(
        source_position="C0",
        target_position="C4",
        operator_id="R7",
        forte_family="5-23",
    )
    route_context = create_court_route_context(
        forte_family="5-23", operator_id="R7", source_scale_state_id=1453
    )
    translocation_move = validate_court_move(
        translocation_state,
        "court:translocate",
        "C4",
        policy=court_policy,
        translocation_record=translocation_record,
        route_context=route_context,
    )
    translocation = apply_court_move(
        translocation_state,
        translocation_move,
        policy=court_policy,
        verification_decision=verification,
    )
    _require(translocation.accepted, "court_translocation_rejected")
    translocation_replay = replay_court_runtime_ledger(
        translocation_state,
        translocation.events,
        translocation.state.ledger_anchor,
        policy=court_policy,
    )
    _require(
        translocation_replay.valid and translocation_replay.state == translocation.state,
        "court_translocation_replay_mismatch",
    )
    try:
        write_kappa_coordinate("harmonic.C_H", court_states[2].kappa_court)
    except CourtRuntimeError as error:
        _require(error.reason_code == "kappa_cross_namespace_write", "court_kappa_guard_mismatch")
    else:
        _require(False, "court_kappa_guard_missing")

    ledger_csv = ROOT / "canonical/universal-heptatonic-ledger.csv"
    with ledger_csv.open(newline="", encoding="utf-8") as handle:
        csv_rows = tuple(csv.DictReader(handle))
    json_by_id = {int(record["id"]): record for record in records}
    csv_by_id = {int(record["id"]): record for record in csv_rows}
    _require(
        len(csv_rows) == len(csv_by_id) == len(json_by_id) == 462,
        "canonical_source_row_count_mismatch",
    )
    _require(set(csv_by_id) == set(json_by_id), "canonical_source_id_set_mismatch")
    for state_id, csv_record in csv_by_id.items():
        json_record = json_by_id[state_id]
        for field, csv_value in csv_record.items():
            json_value = json_record.get(field)
            if isinstance(json_value, bool):
                normalized = "true" if json_value else "false"
            elif json_value is None:
                normalized = ""
            else:
                normalized = str(json_value)
            _require(
                csv_value == normalized,
                f"canonical_source_column_mismatch:{state_id}:{field}",
            )
    integrations = integration_results or {
        "pythonVerificationSuite": "NOT_RUN",
        "liveNeo4jParitySuite": "NOT_RUN",
    }
    core = {
        "schemaVersion": "phase4.structural-proof-report.v1",
        "status": "PASS" if all(value == "PASS" for value in integrations.values()) else "STRUCTURAL_PASS",
        "canonicalSource": {
            "csv": {
                "path": "canonical/universal-heptatonic-ledger.csv",
                "sha256": source_sha256(),
            },
            "json": {
                "path": "canonical/universal-heptatonic-ledger.json",
                "sha256": hashlib.sha256(
                    (ROOT / "canonical/universal-heptatonic-ledger.json").read_bytes()
                ).hexdigest(),
            },
            "stateCount": len(masks),
            "crossBoundColumnsVerified": 27,
            "crossBoundRowCount": len(csv_rows),
        },
        "stateSpace": {
            "dyadsPerState": 21,
            "trichordsPerState": 35,
            "incidencesPerState": 105,
            "degreeTriadsPerState": 7,
            "totalDyads": len(masks) * 21,
            "totalTrichords": len(masks) * 35,
            "totalIncidences": len(masks) * 105,
            "totalDegreeTriads": len(masks) * 7,
        },
        "courtFilter": {
            "methodId": "linear-diagonal-bit-and-v1",
            "canonicalStateMaskPairsChecked": filter_checks,
            "idempotenceViolations": 0,
        },
        "carey535": {
            "scope": "independent-directed-interval-enumerator-for-TnI-class-5-35",
            "intervalInstanceCount": len(carey.interval_instances),
            "differenceCount": carey.difference_count,
            "differenceSlotCount": carey.difference_slots,
            "ambiguityCount": carey.ambiguity_count,
            "contradictionCount": carey.contradiction_count,
            "coherenceFailureCount": carey.failure_count,
            "failureSlotCount": carey.failure_slots,
            "crossGenericComparisons": carey.cross_generic_comparisons,
            "CQ": {
                "numerator": carey.coherence_quotient.numerator,
                "denominator": carey.coherence_quotient.denominator,
            },
            "SQ": {
                "numerator": carey.sameness_quotient.numerator,
                "denominator": carey.sameness_quotient.denominator,
            },
            "doi": "10.1080/17459730701376743",
        },
        "courtGeometry": invariant_release["courtGeometry"],
        "compressionNamespaceGuard": invariant_release["compressionGuard"],
        "harmonicInvariantRelease": {
            "path": "seven-governors-harmonic-invariants-v0.1.0/canonical/harmonic-invariant-registry.json",
            "releaseId": invariant_release["releaseId"],
            "substrateFingerprint": invariant_release["substrateDependency"]["substrateFingerprint"],
            "invariantFingerprint": invariant_release["invariantFingerprint"],
        },
        "courtFilterAlgebra": {
            "path": "seven-governors-court-filter-algebra-v0.1.0/canonical/filter-algebra-release.json",
            "releaseId": filter_release["releaseId"],
            "filterAlgebraFingerprint": filter_release["filterAlgebraFingerprint"],
            "filterCount": filter_release["summary"]["filterCount"],
            "mutationOperatorCount": filter_release["summary"]["mutationOperatorCount"],
            "canonicalOperandCount": filter_release["summary"]["canonicalOperandCount"],
            "evaluationCount": filter_release["summary"]["evaluationCount"],
            "nonCommutationRecordCount": filter_release["summary"]["nonCommutationRecordCount"],
            "classificationTotals": filter_commutation["classificationTotals"],
            "sampleRoute": {
                "filterId": route.filter_id,
                "operatorId": route.operator_id,
                "sourceMask": route.source_mask,
                "classification": route.classification,
                "leftResult": route.left_result,
                "rightUndefinedReason": route.right_undefined_reason,
            },
        },
        "courtRuntime": {
            "policyPath": "schemas/court-runtime-policy.json",
            "policyId": court_policy.policy_id,
            "policyFingerprint": court_policy.policy_fingerprint,
            "positionCount": len(court_policy.positions),
            "ordinaryDirectedMoveCount": len(court_policy.ordinary_moves),
            "legalMoveCounts": legal_move_counts,
            "c2DerivedState": {
                "pitchMask": court_states[2].pitch_mask,
                "poleVector": court_states[2].pole_register.vector,
                "kappaCourt": {
                    "numerator": court_states[2].kappa_court.numerator,
                    "denominator": court_states[2].kappa_court.denominator,
                },
            },
            "adjacentTransition": {
                "operationId": adjacent_move.operation_id,
                "sourcePosition": "C0",
                "targetPosition": adjacent.state.position_id,
                "eventId": adjacent.event_body.event_id,
                "replayStatus": adjacent_replay.reason_code,
            },
            "translocation": {
                "sourcePosition": translocation_record.source_position,
                "targetPosition": translocation_record.target_position,
                "operatorId": translocation_record.operator_id,
                "sourceScaleStateId": translocation_record.source_scale_state_id,
                "targetScaleStateId": translocation_record.target_scale_state_id,
                "recordHash": translocation_record.record_hash,
                "staticRouteRecordId": translocation_record.static_route_record_id,
                "eventId": translocation.event_body.event_id,
                "replayStatus": translocation_replay.reason_code,
            },
            "kappaNamespaceGuard": "kappa_cross_namespace_write",
            "sessionStoreDefault": "${XDG_STATE_HOME:-~/.local/state}/seven-governors/court",
        },
        "voiceLeading": {
            "metricId": "pc-taxicab-bijection-v1",
            "groundMetricTriangleChecks": ground_triangle_checks,
            "productionImplementationPropertySamplesInPytest": 100,
            "groundMetricTriangleViolations": 0,
            "proofBasis": "ground-metric-exhaustion-plus-minimum-bijection-composition-theorem",
            "status": "provisional_metric_theorem_proven_implementation_sampled",
        },
        "mutationAlgebra": {
            "operatorCount": len(OPERATORS),
            "localOperatorCount": len(LOCAL_OPERATORS),
            "applicationCount": len(applications),
            "domainSizes": domain_sizes,
            "imageSizes": image_sizes,
            "commutationPairCount": len(commutation),
            "bothDefinedEqualSquares": sum(
                item["equal_when_both_defined"] for item in commutation
            ),
            "commonDomainValueMismatches": 0,
            "oneSidedDomainAsymmetries": sum(
                item["domain_asymmetry"] for item in commutation
            ),
            "aeolianR7Target": apply_operator("R7", 1453),
            "aeolianR7Hamming": (1453 ^ 2477).bit_count(),
            "aeolianR7VoiceLeading": 1,
        },
        "integrationSuites": integrations,
        "securityAndParityRequirements": {
            "agentLedgerReplay": "tests/verification/test_runtime_security.py",
            "courtLedgerReplay": "tests/verification/test_runtime_security.py",
            "harmonicFailClosedBeforeToken": "tests/verification/test_runtime_security.py",
            "forgedTokenRejected": "tests/verification/test_runtime_security.py",
            "courtSnapshotFileNeo4jByteParity": "tests/court_graph/neo4j-live.test.mjs",
            "topologyLocks": [1749, 2477, 223],
        },
    }
    return {**core, "reportSha256": sha256_payload(core)}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--run-integration", action="store_true")
    args = parser.parse_args()
    integration_results = None
    if args.run_integration:
        subprocess.run(
            [
                sys.executable,
                "-m",
                "pytest",
                "-p",
                "no:cacheprovider",
                "tests/verification",
                "--ignore=tests/verification/test_verification_report.py",
            ],
            cwd=ROOT,
            check=True,
        )
        subprocess.run(
            ["node", "--test", "tests/court_graph/neo4j-live.test.mjs"],
            cwd=ROOT,
            check=True,
        )
        integration_results = {
            "pythonVerificationSuite": "PASS",
            "liveNeo4jParitySuite": "PASS",
        }
    report = build_report(integration_results=integration_results)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_bytes(canonical_json_bytes(report))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
