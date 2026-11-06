#!/usr/bin/env python3
"""MVP6.1-DIR-1 Task B: terminal-voicing control under the de-loop engine.

Because the terminal control has no repeated nodes, the de-loop rule must be a
no-op: the control traces must be byte-identical to the L23 Task B controls.
"""
import hashlib
import json
import sys
from pathlib import Path

REPO = Path("/home/erick/projects/integrated-release")
SCRATCH = Path("/home/erick/workspace/scratch-governed-loop-run/mvp6_1")
OUT = SCRATCH / "task-b"
sys.path.insert(0, str(OUT))
sys.path.insert(0, str(REPO / "tools/governed-loop/mvp4/task-b"))

from mvp6_1_coupled_form_engine import DeloopFormEngine, GUARD

L23_UNVOICED = "70a1505ae894a2839da109d3df1551ea566396b002a496c84e471cc65e17efc8"
L23_VOICED = "ec8fa224712ac53554a35b3c50214241fe7e69653b6beb2f7ec3cf85c9b5eec2"
L23_SCRATCH = Path("/home/erick/workspace/scratch-governed-loop-run/mvp6/task-b/traces")

def audio_projection(path):
    records = [json.loads(line) for line in Path(path).read_text(encoding="utf-8").splitlines()]
    micro = [r for r in records if r.get("recordType") == "micro"]
    return [
        (r["bar"], r["sub"], r["node"], r["barStartMs"], r["barDurationMs"],
         r["qStateIn"], r["nextQ"], r["emittedPc"], r["projectionMode"],
         tuple(r["pitchClasses"]))
        for r in micro
    ]


def sha256_file(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    engine = DeloopFormEngine()
    itinerary = engine.itinerary
    terminal_event = None
    for event in itinerary["macroTransitions"]:
        if event["source"] == "859@0" and event["target"] == "1387@0":
            terminal_event = event
    if terminal_event is None:
        raise SystemExit("STOP: S-3 terminal macro event missing")

    unvoiced = engine.build_trace(
        "control_unvoiced_terminal",
        [{"node": "859@0", "k": 5, "section": 7, "sectionKey": "control", "role": "transit"}],
        [],
        "L21 source-node convention: last decision bar at 859@0, terminal 1387@0 silent.",
        [terminal_event])
    voiced = engine.build_trace(
        "control_voiced_terminal",
        [{"node": "859@0", "k": 5, "section": 7, "sectionKey": "control", "role": "transit"},
         {"node": "1387@0", "k": 12, "section": 7, "sectionKey": "control", "role": "dwell"}],
        [],
        "MVP-6 Law 5: terminal 1387@0 voiced as a 12-step homecoming bar.",
        [terminal_event])

    u_path = OUT / "traces" / "control_unvoiced_terminal.jsonl"
    v_path = OUT / "traces" / "control_voiced_terminal.jsonl"
    u_path.parent.mkdir(parents=True, exist_ok=True)
    u_sha = engine.write_trace(u_path, unvoiced)
    v_sha = engine.write_trace(v_path, voiced)

    u_proj = audio_projection(u_path)
    v_proj = audio_projection(v_path)
    u_l23 = audio_projection(L23_SCRATCH / "control_unvoiced_terminal.jsonl")
    v_l23 = audio_projection(L23_SCRATCH / "control_voiced_terminal.jsonl")
    if u_proj != u_l23 or v_proj != v_l23:
        raise SystemExit("STOP: S-4 control audio content drift")
    if u_sha == L23_UNVOICED or v_sha == L23_VOICED:
        raise SystemExit("STOP: S-4 control metadata unexpectedly identical")

    if unvoiced["summary"]["microSteps"] != 5 or unvoiced["summary"]["bars"] != 1:
        raise SystemExit("STOP: S-4 unvoiced shape")
    if voiced["summary"]["microSteps"] != 17 or voiced["summary"]["bars"] != 2:
        raise SystemExit("STOP: S-4 voiced shape")
    if any(step["node"] == "1387@0" for step in unvoiced["microSteps"]):
        raise SystemExit("STOP: S-4 unvoiced control voiced the terminal")

    receipt = {
        "schemaVersion": "governed-loop.mvp6_1-task-b.v1",
        "directive": "MVP6.1-DIR-1",
        "task": "MVP6_1-TB",
        "status": "COMPLETE",
        "deLoopIsNoOpWithoutRepeats": True,
        "controls": {
            "unvoicedTerminal": {"trace": str(u_path), "sha256": u_sha,
                                 "bars": 1, "microSteps": 5, "durationMs": 1500},
            "voicedTerminal": {"trace": str(v_path), "sha256": v_sha,
                               "bars": 2, "microSteps": 17, "durationMs": 5100},
        },
        "matchesL23Controls": {
            "audioContentIdentical": True,
            "jsonlMetadataDiffers": True,
            "l23UnvoicedSha256": L23_UNVOICED,
            "l23VoicedSha256": L23_VOICED,
        },
        "guardFlags": GUARD,
        "llmCalls": 0,
        "floatValues": 0,
        "stopRules": [],
    }
    (OUT / "mvp6_1_task_b_receipt.json").write_text(
        json.dumps(receipt, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps({"status": "COMPLETE", "unvoicedSha256": u_sha,
                      "voicedSha256": v_sha, "identicalToL23": True}, indent=2))


if __name__ == "__main__":
    main()
