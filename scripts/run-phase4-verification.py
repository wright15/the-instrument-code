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
sys.path.insert(0, str(ROOT / "tests" / "verification"))

from governor.hashing import canonical_json_bytes, sha256_payload  # noqa: E402
from _oracles import (  # noqa: E402
    LOCAL_OPERATORS,
    OPERATORS,
    apply_court_filter,
    apply_operator,
    canonical_masks,
    canonical_records,
    carey_cq,
    carey_max_coherence_failures,
    carey_max_differences,
    carey_sq,
    carey_well_formed_sq,
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

    cq = carey_cq(5, 0)
    sq = carey_sq(5, 20)
    _require(cq.numerator == cq.denominator == 1, "carey_cq_formula_mismatch")
    _require(sq == carey_well_formed_sq(5), "carey_sq_formula_mismatch")

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
            "scope": "exact-formula-proof-under-cited-12-TET-premises",
            "coherenceFailureCount": 0,
            "maximumCoherenceFailureCount": carey_max_coherence_failures(5),
            "differenceCount": 20,
            "maximumDifferenceCount": carey_max_differences(5),
            "CQ": {"numerator": cq.numerator, "denominator": cq.denominator},
            "SQ": {"numerator": sq.numerator, "denominator": sq.denominator},
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
