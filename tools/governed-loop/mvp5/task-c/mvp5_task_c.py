#!/usr/bin/env python3
"""MVP5-DIR-1 Task C: two-tier Orrery bridge replay and WebAudio frequency audit."""
import hashlib
import json
import math
import os
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.dont_write_bytecode = True

SCRATCH = Path(os.environ.get("MVP5_SCRATCH", "/home/erick/workspace/scratch-governed-loop-run/mvp5"))
REPO = Path(os.environ.get("GOVERNED_LOOP_REPO", "/home/erick/projects/integrated-release"))
TASK_DIR = SCRATCH / "task-c"
TRACES = SCRATCH / "task-a" / "traces"
BRIDGE_PORT = int(os.environ.get("MVP5_BRIDGE_PORT", "8771"))
VITE_PORT = int(os.environ.get("MVP5_VITE_PORT", "4211"))

REPLAYS = [
    ("track4_arm3b_dynamic_q_carried", TRACES / "arm3b_dynamic_q_carried.jsonl"),
    ("track5_equiv_base_p0", TRACES / "arm_tb_equiv_p0.jsonl"),
    ("track6_equiv_lifted_p7", TRACES / "arm_tb_equiv_p7.jsonl"),
]


def sha256_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def find_floats(value, path="root"):
    found = []
    if isinstance(value, float):
        found.append({"path": path, "value": repr(value)})
    elif isinstance(value, dict):
        for key, child in value.items():
            found.extend(find_floats(child, f"{path}.{key}"))
    elif isinstance(value, list):
        for index, child in enumerate(value):
            found.extend(find_floats(child, f"{path}[{index}]"))
    return found


def repo_snapshot():
    head = subprocess.run(["git", "rev-parse", "HEAD"], cwd=str(REPO), capture_output=True, text=True).stdout.strip()
    porcelain = subprocess.run(["git", "status", "--porcelain"], cwd=str(REPO), capture_output=True, text=True).stdout
    orrery = subprocess.run(["git", "status", "--porcelain", "--", "orrery/"], cwd=str(REPO),
                            capture_output=True, text=True).stdout
    return {"head": head, "treeClean": porcelain == "",
            "treeDigest": hashlib.sha256(porcelain.encode()).hexdigest(), "orreryClean": orrery == ""}


def rel(path):
    return str(Path(path).relative_to(SCRATCH))


def update_staging(entries):
    manifest_path = SCRATCH / "l21_staging_manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    existing = {entry["path"] for entry in manifest["entries"]}
    for entry in entries:
        if entry["path"] not in existing:
            manifest["entries"].append(entry)
    manifest["entries"].sort(key=lambda entry: entry["path"])
    manifest["entryCount"] = len(manifest["entries"])
    manifest["allHashVerified"] = all(
        (SCRATCH / entry["path"]).exists() and sha256_file(SCRATCH / entry["path"]) == entry["sha256"]
        for entry in manifest["entries"]
    )
    manifest_path.write_text(json.dumps(manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return sha256_file(manifest_path), manifest["entryCount"], manifest["allHashVerified"]


def analyze_replay(payload, replay_log):
    bars = {bar["bar"]: bar for bar in payload["bars"]}
    captures = replay_log["microCaptures"]
    min_capture = 1.0
    result = {
        "trace": replay_log["trace"],
        "mode": replay_log["mode"],
        "bars": len(payload["bars"]),
        "hops": len(replay_log["hops"]),
        "microTotal": len(captures),
        "frequencyMatches": 0,
        "outOfMask": 0,
        "captureClean": 0,
        "distinctPitchClasses": len({capture["expectedPc"] for capture in captures}),
        "distinctCapturedFrequencies": len({round(capture["frequency"], 6) for capture in captures}),
        "captureWitnesses": [],
        "boundary": replay_log.get("boundary"),
        "finalNode": replay_log.get("finalNode"),
        "hopVerdicts": [hop["verdict"] for hop in replay_log["hops"]],
        "barsVisited": replay_log.get("barsVisited", []),
    }
    for capture in captures:
        bar = bars[capture["bar"]]
        frequency = capture["frequency"]
        captured = capture["captured"]
        actual_pc = round(69 + 12 * math.log2(frequency / 440)) % 12
        matched = actual_pc == capture["expectedPc"]
        out = actual_pc not in bar["pitchClasses"]
        clean = len(captured) == 1 and abs(captured[0] - frequency) < 1e-6
        result["frequencyMatches"] += 1 if matched else 0
        result["outOfMask"] += 1 if out else 0
        result["captureClean"] += 1 if clean else 0
        if (not matched or out or not clean) and len(result["captureWitnesses"]) < 5:
            result["captureWitnesses"].append({
                "bar": capture["bar"], "sub": capture["sub"], "node": capture["node"],
                "expectedPc": capture["expectedPc"], "actualPc": actual_pc,
                "frequency": round(frequency, 6), "capturedCount": len(captured),
                "matched": matched, "outOfMask": out, "clean": clean,
            })
    boundary = replay_log.get("boundary")
    if boundary:
        result["boundary"] = {
            "source": boundary["source"],
            "target": boundary["target"],
            "kind": boundary["kind"],
            "microScheduled": boundary["microScheduled"],
            "boundaryChipActive": boundary["boundaryChipActive"],
            "boundaryChipPhase": boundary["boundaryChipPhase"],
            "targetChipActive": boundary.get("targetChipActive"),
            "macroFrequencies": len(boundary["macroFrequencies"]),
        }
    return result


def main():
    TASK_DIR.mkdir(parents=True, exist_ok=True)
    sys.path.insert(0, str(TASK_DIR))
    from mvp5_two_tier_bridge import (build_replay_payload, write_probe, run_session,
                                      BRIDGE_PORT as PORT, VITE_PORT as VPORT, SCHEDULER)

    stop = []
    opened = repo_snapshot()
    if opened["head"] != "ba6ae1fe2c8b31ab739c91593701177678bff18b" or not opened["treeClean"]:
        stop.append({"rule": "S-1" if opened["head"] != "ba6ae1fe2c8b31ab739c91593701177678bff18b" else "S-3",
                     "detail": "opening repository state drift"})

    task_b_receipt = json.loads((SCRATCH / "task-b" / "mvp5_task_b_receipt.json").read_text(encoding="utf-8"))
    palettes = task_b_receipt["parameterAuthority"]["offices"]
    census = json.loads((REPO / "tools" / "governed-loop" / "census_462.json").read_text(encoding="utf-8"))
    office_lookup = {int(record["stateId"]): record["office"] for record in census["records"]}
    mode = "live" if os.environ.get("ORRERY_BRIDGE_MODE") == "live" else "headless"

    payloads = [
        build_replay_payload(trace_path, palettes, office_lookup, name, mode=mode)
        for name, trace_path in REPLAYS
    ]
    probe_path = TASK_DIR / "mvp5_two_tier_probe.js"
    probe_sha = write_probe(probe_path, payloads)
    out_path = TASK_DIR / "two_tier_probe_out.json"
    session = run_session(probe_path, out_path)
    log = session.get("log") or {}
    replays = log.get("replays", [])

    receipt = {
        "schemaVersion": "governed-loop.mvp5-task-c.v1",
        "task": "MVP5-DIR-1 Task C",
        "directive": "MVP5-DIR-1",
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "layer": "SPEC-001 §1.3 overlay dynamics",
        "gov517_correspondence_claimed": False,
        "still_set_label": "still_set",
        "opening": opened,
        "harness": {
            "bridgePort": PORT,
            "vitePort": VPORT,
            "mode": mode,
            "probe": rel(probe_path),
            "probeSha256": probe_sha,
            "scheduler": rel(SCHEDULER),
            "schedulerSha256": sha256_file(SCHEDULER),
            "overlay": str(REPO / "tools" / "governed-loop" / "orrery_nav_overlay.js"),
            "overlaySha256": sha256_file(REPO / "tools" / "governed-loop" / "orrery_nav_overlay.js"),
            "bridgeNodes": session.get("bridgeNodes"),
            "runnerExitCode": session.get("runnerExitCode"),
            "seconds": session.get("seconds"),
            "stdout": session.get("stdout"),
            "stderr": session.get("stderr"),
        },
        "browser": {
            "inspect": log.get("inspect"),
            "consoleErrors": log.get("consoleErrors", []),
            "pageErrors": log.get("pageErrors", []),
            "probeFailures": log.get("failures", []),
            "probeAllPass": log.get("allPass", False),
        },
        "replays": [],
        "checks": {},
        "staging": {},
    }
    analyzed = {}
    for payload, replay_log in zip(payloads, replays):
        result = analyze_replay(payload, replay_log)
        analyzed[result["trace"]] = result
        receipt["replays"].append(result)

    inspect = log.get("inspect") or {}
    arm3b = analyzed.get("track4_arm3b_dynamic_q_carried", {})
    base = analyzed.get("track5_equiv_base_p0", {})
    lift = analyzed.get("track6_equiv_lifted_p7", {})
    boundary = arm3b.get("boundary") or {}
    checks = {
        "inspect84Cells": inspect.get("cells") == 84,
        "inspect12BoundaryChips": inspect.get("boundaryChips") == 12,
        "inspect5544Nodes": inspect.get("nodes") == 5544,
        "inspect5130SeamMoves": inspect.get("seamCatalog") == 5130,
        "inspect256BoundaryRows": inspect.get("boundaryRows") == 256,
        "arm3bBars20": arm3b.get("bars") == 20,
        "arm3bHops21": arm3b.get("hops") == 21,
        "arm3bMicro100": arm3b.get("microTotal") == 100,
        "arm3bFrequencyMatches100": arm3b.get("frequencyMatches") == 100,
        "arm3bCaptureClean100": arm3b.get("captureClean") == 100,
        "arm3bOutOfMaskZero": arm3b.get("outOfMask") == 0,
        "equivP0Micro15": base.get("microTotal") == 15,
        "equivP0FrequencyMatches15": base.get("frequencyMatches") == 15,
        "equivP0OutOfMaskZero": base.get("outOfMask") == 0,
        "equivP7Micro15": lift.get("microTotal") == 15,
        "equivP7FrequencyMatches15": lift.get("frequencyMatches") == 15,
        "equivP7OutOfMaskZero": lift.get("outOfMask") == 0,
        "boundaryAutoHopPresent": boundary.get("source") == "847@0" and boundary.get("target") == "1693@11",
        "boundaryAutoHopZeroMicro": boundary.get("microScheduled") == 0,
        "boundaryChipHighlighted": boundary.get("boundaryChipActive") is True,
        "boundaryChipPhaseZero": boundary.get("boundaryChipPhase") == 0,
        "allHopVerdictsAccept": all(verdict == "ACCEPT" for entry in analyzed.values()
                                    for verdict in entry.get("hopVerdicts", [])),
        "consoleErrorsZero": len(log.get("consoleErrors", [])) == 0,
        "pageErrorsZero": len(log.get("pageErrors", [])) == 0,
        "probeAllPass": bool(log.get("allPass")),
    }
    receipt["checks"] = checks
    receipt["checksPassed"] = sum(1 for value in checks.values() if value)
    receipt["checksTotal"] = len(checks)
    for name, passed in checks.items():
        if passed:
            continue
        if "console" in name.lower() or "page" in name.lower() or "probe" in name.lower():
            rule = "S-11"
        elif "outofmask" in name.lower():
            rule = "S-7"
        elif "boundary" in name.lower():
            rule = "S-9"
        else:
            rule = "S-11"
        stop.append({"rule": rule, "detail": f"task C check failed: {name}"})

    floats = find_floats(receipt)
    receipt["floatScan"] = {"values": len(floats), "witnesses": floats[:5]}
    if floats:
        stop.append({"rule": "S-6", "detail": "float contamination in Task C receipt", "detailData": floats[:5]})

    close = repo_snapshot()
    receipt["close"] = close
    if close["head"] != opened["head"] or not close["treeClean"] or not close["orreryClean"]:
        stop.append({"rule": "S-3", "detail": "repository write or orrery change at Task C close"})
    if not close["orreryClean"]:
        stop.append({"rule": "S-11", "detail": "orrery working tree not clean at Task C close"})

    receipt["constraints"] = {"repoWrites": 0, "orreryChanges": 0, "gateBytesTouched": False}
    receipt["stopRulesTriggered"] = stop
    receipt["status"] = "COMPLETE" if not stop else "STOP"
    receipt_path = TASK_DIR / "mvp5_task_c_receipt.json"
    receipt_path.write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    bridge_log_path = TASK_DIR / "two_tier_bridge_log.json"
    bridge_log = {
        "schemaVersion": "governed-loop.mvp5-two-tier-bridge-log.v1",
        "generatedAt": receipt["generatedAt"],
        "session": receipt["harness"],
        "browser": receipt["browser"],
        "replays": receipt["replays"],
    }
    bridge_log_path.write_text(json.dumps(bridge_log, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    entries = [{
        "path": rel(receipt_path), "sha256": sha256_file(receipt_path), "bytes": receipt_path.stat().st_size,
        "origin": "task-c", "role": "receipt",
    }, {
        "path": rel(bridge_log_path), "sha256": sha256_file(bridge_log_path), "bytes": bridge_log_path.stat().st_size,
        "origin": "task-c", "role": "bridge-log",
    }, {
        "path": rel(Path(__file__)), "sha256": sha256_file(Path(__file__)), "bytes": Path(__file__).stat().st_size,
        "origin": "task-c", "role": "runner",
    }, {
        "path": rel(TASK_DIR / "mvp5_two_tier_bridge.py"),
        "sha256": sha256_file(TASK_DIR / "mvp5_two_tier_bridge.py"),
        "bytes": (TASK_DIR / "mvp5_two_tier_bridge.py").stat().st_size,
        "origin": "task-c", "role": "module",
    }, {
        "path": rel(SCHEDULER), "sha256": sha256_file(SCHEDULER), "bytes": SCHEDULER.stat().st_size,
        "origin": "task-c", "role": "scheduler",
    }, {
        "path": rel(probe_path), "sha256": probe_sha, "bytes": probe_path.stat().st_size,
        "origin": "task-c", "role": "probe",
    }]
    if out_path.exists():
        entries.append({"path": rel(out_path), "sha256": sha256_file(out_path), "bytes": out_path.stat().st_size,
                        "origin": "task-c", "role": "probe-output"})
    manifest_sha, manifest_count, manifest_ok = update_staging(entries)
    receipt["staging"] = {"manifest": rel(SCRATCH / "l21_staging_manifest.json"),
                          "manifestSha256": manifest_sha, "manifestEntries": manifest_count,
                          "allHashVerified": manifest_ok}
    receipt_path.write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    print("MVP5 TASK C")
    print(f"  inspect: cells {inspect.get('cells')} / chips {inspect.get('boundaryChips')} / "
          f"nodes {inspect.get('nodes')} / seams {inspect.get('seamCatalog')} / boundary rows {inspect.get('boundaryRows')}")
    for result in receipt["replays"]:
        print(f"  {result['trace']}: bars {result['bars']} / hops {result['hops']} / "
              f"micro {result['microTotal']} / freq match {result['frequencyMatches']} / "
              f"oom {result['outOfMask']} / clean {result['captureClean']}")
    print(f"  boundary auto: {boundary}")
    print(f"  checks: {receipt['checksPassed']}/{receipt['checksTotal']} / status {receipt['status']} / "
          f"stop {[s['rule'] for s in stop]}")
    print(f"  receipt: {receipt_path}")
    return 0 if not stop else 1


if __name__ == "__main__":
    sys.exit(main())
