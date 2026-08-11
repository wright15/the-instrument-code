from __future__ import annotations

import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

from _bootstrap import PACKAGE_ROOT
from court_filter_algebra.builder import OUTPUT_NAMES
from court_filter_algebra.canonical import canonical_json_bytes, sha256_file, write_atomic


temporary_root = Path(tempfile.mkdtemp(prefix="court-filter-algebra-"))
directories = {"cleanA": temporary_root / "clean-a", "cleanB": temporary_root / "clean-b", "reordered": temporary_root / "reordered"}
for directory in directories.values():
    directory.mkdir()


def run(arguments: list[str]) -> dict[str, object]:
    result = subprocess.run([sys.executable, str(PACKAGE_ROOT / "scripts/build_filters.py"), *arguments], cwd=PACKAGE_ROOT, text=True, capture_output=True, check=False)
    stable_arguments = [argument.replace(str(temporary_root), "<temporary-root>") for argument in arguments]
    return {"arguments": stable_arguments, "exitCode": result.returncode, "passed": result.returncode == 0}


runs = [
    run(["--emit", "--output-dir", str(directories["cleanA"])]),
    run(["--check", "--output-dir", str(directories["cleanA"])]),
    run(["--emit", "--output-dir", str(directories["cleanB"])]),
    run(["--check", "--output-dir", str(directories["cleanB"])]),
    run(["--emit", "--output-dir", str(directories["reordered"]), "--test-reverse-input-order"]),
    run(["--check", "--output-dir", str(directories["reordered"]), "--test-reverse-input-order"]),
]
hashes = {label: {name: sha256_file(directory / name) for name in OUTPUT_NAMES} for label, directory in directories.items()}
installed_hashes = {name: sha256_file(PACKAGE_ROOT / "canonical" / name) for name in OUTPUT_NAMES}
byte_identical = all(hashes["cleanA"][name] == hashes["cleanB"][name] == hashes["reordered"][name] == installed_hashes[name] for name in OUTPUT_NAMES)
fingerprints = [json.loads((directory / "filter-algebra-release.json").read_text(encoding="utf-8"))["filterAlgebraFingerprint"] for directory in directories.values()]
checks = [
    {"name": "separate-process-check-emit-check", "status": "PASS" if all(item["passed"] for item in runs) else "FAIL", "detail": runs},
    {"name": "two-clean-builds-byte-identical", "status": "PASS" if byte_identical else "FAIL", "detail": {"outputCount": 5, "installedHashes": installed_hashes}},
    {"name": "reordered-input-byte-identical", "status": "PASS" if byte_identical else "FAIL", "detail": {"fixtureId": "reordered-filter-input", "temporaryRoot": "<temporary-root>"}},
    {"name": "filter-algebra-fingerprint-identical", "status": "PASS" if len(set(fingerprints)) == 1 else "FAIL", "detail": {"filterAlgebraFingerprint": fingerprints[0]}},
]
failed = [item for item in checks if item["status"] == "FAIL"]
report = {
    "schemaVersion": "1.0.0", "packageVersion": "0.1.0", "releaseId": "court-filter-algebra:0.1.0",
    "status": "failed" if failed else "passed", "summary": {"checks": len(checks), "passed": len(checks) - len(failed), "failed": len(failed)}, "checks": checks,
}
write_atomic(PACKAGE_ROOT / "qa/determinism-report.json", canonical_json_bytes(report))
shutil.rmtree(temporary_root)
print(json.dumps({"status": report["status"], "summary": report["summary"]}))
raise SystemExit(1 if failed else 0)
