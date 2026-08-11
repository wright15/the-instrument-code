from __future__ import annotations

import argparse
import json
from pathlib import Path

from _bootstrap import PACKAGE_ROOT

from harmonic_invariants.canonical import (
    canonical_json_bytes,
    compact_json_bytes,
    sha256_bytes,
    sha256_file,
    write_atomic,
)


parser = argparse.ArgumentParser()
mode = parser.add_mutually_exclusive_group(required=True)
mode.add_argument("--check", action="store_true")
mode.add_argument("--emit", action="store_true")
arguments = parser.parse_args()
excluded = {"PACKAGE_MANIFEST.json", "__pycache__", ".pytest_cache"}
files = []
for path in sorted(PACKAGE_ROOT.rglob("*")):
    if not path.is_file() or any(part in excluded for part in path.parts):
        continue
    relative = path.relative_to(PACKAGE_ROOT).as_posix()
    files.append({"path": relative, "bytes": path.stat().st_size, "sha256": sha256_file(path)})
manifest = {
    "schemaVersion": "1.0.0",
    "packageName": "seven-governors-harmonic-invariants",
    "packageVersion": "0.1.0",
    "releaseId": "harmonic-invariants:0.1.0",
    "releaseDate": "2026-08-09",
    "manifestPolicy": "All package payload files except caches and this self-referential manifest.",
    "fileCount": len(files),
    "totalBytes": sum(item["bytes"] for item in files),
    "aggregateFingerprint": sha256_bytes(
        compact_json_bytes([[item["path"], item["sha256"]] for item in files])
    ),
    "files": files,
}
payload = canonical_json_bytes(manifest)
target = PACKAGE_ROOT / "PACKAGE_MANIFEST.json"
if arguments.emit:
    write_atomic(target, payload)
    print(json.dumps({"status": "emitted", "fileCount": len(files)}))
elif target.is_file() and target.read_bytes() == payload:
    print(json.dumps({"status": "passed", "fileCount": len(files)}))
else:
    print("STALE_PACKAGE_MANIFEST")
    raise SystemExit(1)
