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
