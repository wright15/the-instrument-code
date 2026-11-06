#!/usr/bin/env python3
"""MVP6-DIR-1 Task B: the Law-5 terminal-bar convention.

Form pieces voice the terminal destination; the L21 source-node convention is
left byte-untouched and is reproduced here as the unvoiced control.
"""
import hashlib
import json
import sys
from pathlib import Path

SCRATCH = Path("/home/erick/workspace/scratch-governed-loop-run/mvp6")
OUT = SCRATCH / "task-b"
sys.path.insert(0, str(OUT))
sys.path.insert(0, str(Path("/home/erick/projects/integrated-release/tools/governed-loop/mvp4/task-b")))

from mvp6_coupled_form_engine import FormEngine, GUARD


def sha256_file(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    engine = FormEngine()
    itinerary = engine.itinerary
    terminal_event = None
    for event in itinerary["macroTransitions"]:
        if event["source"] == "859@0" and event["target"] == "1387@0":
            terminal_event = event
    if terminal_event is None:
        raise SystemExit("STOP: S-3 terminal macro event missing")

    unvoiced = engine.build_trace(
        "control_unvoiced_terminal",
        [{"node": "859@0", "k": 5, "section": 7, "sectionKey": "control",
          "role": "transit"}],
        [],
        "L21 source-node convention: last decision bar at 859@0, terminal 1387@0 silent.",
        [terminal_event])
    voiced = engine.build_trace(
        "control_voiced_terminal",
        [{"node": "859@0", "k": 5, "section": 7, "sectionKey": "control",
          "role": "transit"},
         {"node": "1387@0", "k": 12, "section": 7, "sectionKey": "control",
          "role": "dwell"}],
        [],
        "MVP-6 Law 5: terminal 1387@0 voiced as a 12-step homecoming bar.",
        [terminal_event])

    u_path = OUT / "traces" / "control_unvoiced_terminal.jsonl"
    v_path = OUT / "traces" / "control_voiced_terminal.jsonl"
    u_path.parent.mkdir(parents=True, exist_ok=True)
    u_sha = engine.write_trace(u_path, unvoiced)
    v_sha = engine.write_trace(v_path, voiced)

    u_sum = unvoiced["summary"]
    v_sum = voiced["summary"]
    if u_sum["microSteps"] != 5 or u_sum["bars"] != 1:
        raise SystemExit(f"STOP: S-4 unvoiced control shape {u_sum}")
    if v_sum["microSteps"] != 17 or v_sum["bars"] != 2:
        raise SystemExit(f"STOP: S-4 voiced control shape {v_sum}")
    if u_sum["durationMs"] != 1500 or v_sum["durationMs"] != 5100:
        raise SystemExit("STOP: S-4 control durations")
    if any(step["node"] == "1387@0" for step in unvoiced["microSteps"]):
        raise SystemExit("STOP: S-4 unvoiced control voiced the terminal")
    terminal_steps = [s for s in voiced["microSteps"] if s["node"] == "1387@0"]
    if len(terminal_steps) != 12:
        raise SystemExit("STOP: S-4 terminal bar step count")
    if len({s["nextQ"] for s in terminal_steps}) != 12:
        raise SystemExit("STOP: S-4 terminal bar does not traverse the full Q cycle")
    if any(s["emittedPc"] not in s["pitchClasses"] for s in voiced["microSteps"]):
        raise SystemExit("STOP: S-4 control out-of-mask pitch")

    receipt = {
        "schemaVersion": "governed-loop.mvp6-task-b.v1",
        "directive": "MVP6-DIR-1",
        "task": "MVP6-TB",
        "status": "COMPLETE",
        "law5": {
            "convention": "terminal bar voiced for form pieces only",
            "l21ConventionUntouched": True,
            "terminalEvent": {"source": terminal_event["source"],
                              "target": terminal_event["target"],
                              "kind": terminal_event["kind"],
                              "gateVerdict": terminal_event["gateVerdict"]},
        },
        "controls": {
            "unvoicedTerminal": {
                "trace": str(u_path), "sha256": u_sha,
                "bars": u_sum["bars"], "microSteps": u_sum["microSteps"],
                "durationMs": u_sum["durationMs"],
                "terminalVoiced": False,
            },
            "voicedTerminal": {
                "trace": str(v_path), "sha256": v_sha,
                "bars": v_sum["bars"], "microSteps": v_sum["microSteps"],
                "durationMs": v_sum["durationMs"],
                "terminalVoiced": True,
                "terminalMicroSteps": len(terminal_steps),
                "terminalDistinctQ": len({s["nextQ"] for s in terminal_steps}),
            },
        },
        "delta": {
            "extraMicroSteps": v_sum["microSteps"] - u_sum["microSteps"],
            "extraDurationMs": v_sum["durationMs"] - u_sum["durationMs"],
        },
        "guardFlags": GUARD,
        "llmCalls": 0,
        "floatValues": 0,
        "stopRules": [],
    }
    (OUT / "mvp6_task_b_receipt.json").write_text(
        json.dumps(receipt, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps({
        "status": "COMPLETE",
        "unvoiced": [u_sum["bars"], u_sum["microSteps"], u_sum["durationMs"]],
        "voiced": [v_sum["bars"], v_sum["microSteps"], v_sum["durationMs"]],
        "deltaSteps": receipt["delta"]["extraMicroSteps"],
        "unvoicedSha256": u_sha,
        "voicedSha256": v_sha,
    }, indent=2))


if __name__ == "__main__":
    main()
