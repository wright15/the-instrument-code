from __future__ import annotations

import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

from _bootstrap import PACKAGE_ROOT

from harmonic_invariants.builder import OUTPUT_NAMES
from harmonic_invariants.canonical import canonical_json_bytes, sha256_file, write_atomic


temporary_root = Path(tempfile.mkdtemp(prefix="harmonic-invariants-"))
directories = {
    "cleanA": temporary_root / "clean-a",
    "cleanB": temporary_root / "clean-b",
    "reordered": temporary_root / "reordered",
}
for directory in directories.values():
    directory.mkdir()


def run(arguments: list[str]) -> dict[str, object]:
    result = subprocess.run(
        [sys.executable, str(PACKAGE_ROOT / "scripts/build_invariants.py"), *arguments],
        cwd=PACKAGE_ROOT,
        text=True,
        capture_output=True,
        check=False,
    )
    stable_arguments = [
        argument.replace(str(temporary_root), "<temporary-root>") for argument in arguments
    ]
    return {
        "arguments": stable_arguments,
        "exitCode": result.returncode,
        "passed": result.returncode == 0,
    }


runs = [
    run(["--emit", "--output-dir", str(directories["cleanA"])]),
    run(["--check", "--output-dir", str(directories["cleanA"])]),
    run(["--emit", "--output-dir", str(directories["cleanB"])]),
    run(["--check", "--output-dir", str(directories["cleanB"])]),
    run(["--emit", "--output-dir", str(directories["reordered"]), "--test-reverse-input-order"]),
    run(["--check", "--output-dir", str(directories["reordered"]), "--test-reverse-input-order"]),
]
hashes = {
    label: {name: sha256_file(directory / name) for name in OUTPUT_NAMES}
    for label, directory in directories.items()
}
installed_hashes = {
    name: sha256_file(PACKAGE_ROOT / "canonical" / name) for name in OUTPUT_NAMES
}
byte_identical = all(
    hashes["cleanA"][name]
    == hashes["cleanB"][name]
    == hashes["reordered"][name]
    == installed_hashes[name]
    for name in OUTPUT_NAMES
)
release_a = json.loads((directories["cleanA"] / "harmonic-invariant-registry.json").read_text())
release_b = json.loads((directories["cleanB"] / "harmonic-invariant-registry.json").read_text())
release_reordered = json.loads(
    (directories["reordered"] / "harmonic-invariant-registry.json").read_text()
)
fingerprints_identical = all(
    release_a[key] == release_b[key] == release_reordered[key]
    for key in ("sourceFingerprint", "invariantFingerprint")
)
plan = json.loads((PACKAGE_ROOT / "fixtures/reordered-input-plan.json").read_text())
checks = [
    {
        "name": "separate-process-check-emit-check",
        "status": "PASS" if all(item["passed"] for item in runs) else "FAIL",
        "detail": runs,
    },
    {
        "name": "two-clean-builds-byte-identical",
        "status": "PASS" if byte_identical else "FAIL",
        "detail": {"outputCount": len(OUTPUT_NAMES), "installedHashes": installed_hashes},
    },
    {
        "name": "reordered-input-byte-identical",
        "status": "PASS"
        if byte_identical and plan["expectedResult"] == "byte_identical_canonical_outputs"
        else "FAIL",
        "detail": {"fixtureId": plan["fixtureId"], "reverseArrays": sorted(plan["reverseArrays"])},
    },
    {
        "name": "source-invariant-fingerprints-identical",
        "status": "PASS" if fingerprints_identical else "FAIL",
        "detail": {
            "sourceFingerprint": release_a["sourceFingerprint"],
            "invariantFingerprint": release_a["invariantFingerprint"],
        },
    },
]
failed = [item for item in checks if item["status"] == "FAIL"]
report = {
    "schemaVersion": "1.0.0",
    "packageVersion": "0.1.0",
    "releaseId": "harmonic-invariants:0.1.0",
    "status": "failed" if failed else "passed",
    "summary": {"checks": len(checks), "passed": len(checks) - len(failed), "failed": len(failed)},
    "checks": checks,
}
write_atomic(PACKAGE_ROOT / "qa/determinism-report.json", canonical_json_bytes(report))
shutil.rmtree(temporary_root)
print(json.dumps({"status": report["status"], "summary": report["summary"]}))
raise SystemExit(1 if failed else 0)
