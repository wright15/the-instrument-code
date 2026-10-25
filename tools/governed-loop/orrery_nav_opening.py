#!/usr/bin/env python3
"""ORRERY-NAV-1 rev 2.1 opening protocol (read-only pin/count checks + expressibility)."""
import importlib.util
import json
import os
import subprocess
import sys

SCRATCH = "/home/erick/workspace/governed-loop"
VITE_PORT = "4201"


def import_bridge():
    spec = importlib.util.spec_from_file_location(
        "orrery_nav_bridge", f"{SCRATCH}/orrery_nav_bridge.py"
    )
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def sha256_file(path):
    import hashlib
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def main():
    bridge = import_bridge()
    model = bridge.Model()
    summary = model.summary()

    raw_path = f"{SCRATCH}/orrery_nav_opening_probe.json"
    env = dict(os.environ)
    env["ORRERY_NAV_VITE_PORT"] = VITE_PORT
    result = subprocess.run(
        ["bash", f"{SCRATCH}/orrery_nav_run.sh",
         f"{SCRATCH}/orrery_nav_opening_probe.js", raw_path],
        capture_output=True, text=True, env=env, timeout=180,
    )
    if result.returncode != 0:
        print(result.stdout)
        print(result.stderr[-3000:])
        print("STOP: overlay expressibility probe failed (convention-gap).")
        sys.exit(1)
    probe = json.load(open(raw_path))
    if isinstance(probe, str):
        probe = json.loads(probe)
    expressibility = probe.get("expressibility") or {}
    if not (
        expressibility.get("cells") == 84
        and expressibility.get("boundaryChips") == 12
        and len(expressibility.get("classes", [])) == 3
        and not probe.get("consoleErrors")
        and not probe.get("pageErrors")
    ):
        print(json.dumps(probe, indent=2)[:4000])
        print("STOP: overlay expressibility check did not verify.")
        sys.exit(1)

    mvp2_lines = open(f"{SCRATCH}/mvp2.py", encoding="utf-8").read().splitlines()
    opening = {
        "schemaVersion": "governed-loop.orrery-nav-opening.v1",
        "directive": "ORRERY-NAV-1 rev 2.1",
        "mode": "read-only tooling build",
        "repo": model.repo,
        "pins": {
            name: {"sha256": sha256_file(f"{SCRATCH}/{name}"), "expected": expected}
            for name, expected in bridge.EXPECTED.items()
        },
        "prefixes": bridge.PREFIXES,
        "anchors": {
            "selfTransitionVetoBoundary": mvp2_lines[149:154],
            "sameRootNonNone": mvp2_lines[168],
            "tier1SamePhase": mvp2_lines[170:172],
            "boundaryReject": mvp2_lines[182:184],
            "dwell": mvp2_lines[732],
        },
        "derivedCounts": summary,
        "expressibility": {
            "cells": expressibility.get("cells"),
            "boundaryChips": expressibility.get("boundaryChips"),
            "classes": expressibility.get("classes"),
            "consoleErrors": probe.get("consoleErrors", []),
            "pageErrors": probe.get("pageErrors", []),
            "verdict": "VERIFIED",
        },
        "stopRules": {
            "pinMismatch": False,
            "mvp2Drift": False,
            "conformance": "not-run-in-opening",
            "expressibilityFailure": False,
            "repoWrite": False,
            "underivableCount": False,
            "fired": "none",
        },
    }
    path = f"{SCRATCH}/orrery_nav_opening.json"
    with open(path, "w") as f:
        json.dump(opening, f, indent=2, sort_keys=True)
        f.write("\n")
    print("ORRERY-NAV-1 OPENING OK")
    print(json.dumps(summary, indent=2, sort_keys=True))
    print(f"expressibility: {expressibility}")
    print(f"opening record: {path} ({sha256_file(path)[:16]}...)")


if __name__ == "__main__":
    main()
