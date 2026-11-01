#!/usr/bin/env python3
"""Headed live listening run for the MVP-5 two-tier bridge.

Runs the real WebAudio scheduler (no fake context) for Arm 3b and the
equivariant pair. Writes task-d/live_listen_log.json only; it does not touch
the certified Task C receipt or the L21 staging manifest.
"""
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.dont_write_bytecode = True

SCRATCH = Path(os.environ.get("MVP5_SCRATCH", "/home/erick/workspace/scratch-governed-loop-run/mvp5"))
REPO = Path(os.environ.get("GOVERNED_LOOP_REPO", "/home/erick/projects/integrated-release"))
TASK_C = SCRATCH / "task-c"
TASK_D = SCRATCH / "task-d"
TRACES = SCRATCH / "task-a" / "traces"

os.environ.setdefault("MVP5_BRIDGE_PORT", "8772")
os.environ.setdefault("MVP5_VITE_PORT", "4212")

sys.path.insert(0, str(TASK_C))
sys.path.insert(0, str(TASK_D))
from mvp5_two_tier_bridge import build_replay_payload, write_probe, run_session


def main():
    task_b_receipt = json.loads((SCRATCH / "task-b" / "mvp5_task_b_receipt.json").read_text(encoding="utf-8"))
    palettes = task_b_receipt["parameterAuthority"]["offices"]
    census = json.loads((REPO / "tools" / "governed-loop" / "census_462.json").read_text(encoding="utf-8"))
    office_lookup = {int(record["stateId"]): record["office"] for record in census["records"]}
    replays = [
        build_replay_payload(TRACES / "arm3b_dynamic_q_carried.jsonl", palettes, office_lookup,
                             "track4_arm3b_dynamic_q_carried", mode="live"),
        build_replay_payload(TRACES / "arm_tb_equiv_p0.jsonl", palettes, office_lookup,
                             "track5_equiv_base_p0", mode="live"),
        build_replay_payload(TRACES / "arm_tb_equiv_p7.jsonl", palettes, office_lookup,
                             "track6_equiv_lifted_p7", mode="live"),
    ]
    probe_path = TASK_D / "mvp5_live_listen_probe.js"
    write_probe(probe_path, replays)
    output_path = TASK_D / "live_listen_log.json"
    session = run_session(probe_path, output_path, timeout_seconds=900, fake_audio=False, headed=True)
    log = session.get("log") or {}
    record = {
        "schemaVersion": "governed-loop.mvp5-live-listen.v1",
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "mode": "live",
        "fakeAudio": False,
        "headed": True,
        "session": {
            "bridgePort": os.environ["MVP5_BRIDGE_PORT"],
            "vitePort": os.environ["MVP5_VITE_PORT"],
            "seconds": session.get("seconds"),
            "runnerExitCode": session.get("runnerExitCode"),
            "bridgeNodes": session.get("bridgeNodes"),
        },
        "browser": {
            "inspect": log.get("inspect"),
            "consoleErrors": log.get("consoleErrors", []),
            "pageErrors": log.get("pageErrors", []),
            "probeFailures": log.get("failures", []),
            "probeAllPass": log.get("allPass", False),
        },
        "replays": [
            {"trace": replay.get("trace"), "bars": len(replay.get("barsVisited", [])),
             "hops": len(replay.get("hops", [])), "micro": len(replay.get("microCaptures", []))}
            for replay in log.get("replays", [])
        ],
        "note": "Live listening run; frequencies are not captured (real AudioContext). "
                "The certified frequency audit is task-c/mvp5_task_c_receipt.json.",
    }
    output_path.write_text(json.dumps(record, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print("MVP5 LIVE LISTEN")
    print(f"  inspect: {record['browser']['inspect']}")
    print(f"  replays: {[(entry['trace'], entry['micro']) for entry in record['replays']]}")
    print(f"  console errors: {len(record['browser']['consoleErrors'])} / "
          f"page errors: {len(record['browser']['pageErrors'])}")
    print(f"  log: {output_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
