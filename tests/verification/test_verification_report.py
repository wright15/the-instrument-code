from __future__ import annotations

import json
from pathlib import Path
import subprocess
import sys

from governor.hashing import canonical_json_bytes, sha256_payload

from ._oracles import ROOT


def test_phase4_verification_report_is_deterministic_and_recomputable(tmp_path: Path) -> None:
    outputs = []
    for index in range(2):
        output = tmp_path / f"phase4-{index}.json"
        subprocess.run(
            [
                sys.executable,
                str(ROOT / "scripts/run-phase4-verification.py"),
                "--output",
                str(output),
            ],
            cwd=ROOT,
            check=True,
        )
        outputs.append(output.read_bytes())

    assert outputs[0] == outputs[1]
    report = json.loads(outputs[0])
    assert outputs[0] == canonical_json_bytes(report)
    report_core = {key: value for key, value in report.items() if key != "reportSha256"}
    assert report["reportSha256"] == sha256_payload(report_core)
    assert report["status"] == "STRUCTURAL_PASS"
    assert report["integrationSuites"] == {
        "liveNeo4jParitySuite": "NOT_RUN",
        "pythonVerificationSuite": "NOT_RUN",
    }
    assert report["canonicalSource"]["stateCount"] == 462
    assert report["courtFilter"]["canonicalStateMaskPairsChecked"] == 1892352
    assert report["mutationAlgebra"]["applicationCount"] == 3402
    assert report["mutationAlgebra"]["commutationPairCount"] == 91
    assert report["carey535"]["scope"] == (
        "independent-directed-interval-enumerator-for-TnI-class-5-35"
    )
    assert report["carey535"]["differenceCount"] == 20
    assert report["carey535"]["coherenceFailureCount"] == 0
    assert report["courtGeometry"]["gramMatrix"] == [
        [2, 0, 0, 0],
        [0, 2, 0, 0],
        [0, 0, 2, 0],
        [0, 0, 0, 2],
    ]
    assert report["compressionNamespaceGuard"]["status"] == "unresolved"
    assert report["courtFilterAlgebra"]["evaluationCount"] == 48510
    assert report["courtFilterAlgebra"]["nonCommutationRecordCount"] == 23814
    assert report["courtFilterAlgebra"]["classificationTotals"] == {
        "both_undefined": 24696,
        "commutes": 0,
        "does_not_commute": 0,
        "left_undefined": 0,
        "right_undefined": 23814,
    }
    assert report["courtFilterAlgebra"]["sampleRoute"]["classification"] == (
        "right_undefined"
    )
    assert report["courtRuntime"]["policyFingerprint"] == (
        "90431c79b8bc06da7e6f5cb5ce207cb6cbfd86519bdb91df5aacc137065ec456"
    )
    assert report["courtRuntime"]["legalMoveCounts"] == [1, 2, 2, 2, 1]
    assert report["courtRuntime"]["c2DerivedState"] == {
        "pitchMask": 1189,
        "poleVector": "1100",
        "kappaCourt": {"numerator": 1, "denominator": 2},
    }
    assert report["courtRuntime"]["adjacentTransition"]["replayStatus"] == "ok"
    assert report["courtRuntime"]["translocation"]["operatorId"] == "R7"
    assert report["courtRuntime"]["translocation"]["replayStatus"] == "ok"
    assert report["courtRuntime"]["kappaNamespaceGuard"] == (
        "kappa_cross_namespace_write"
    )
