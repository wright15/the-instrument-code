#!/usr/bin/env python3
"""MVP6.2-DIR-1 Task C: symbolic trace re-verification.

The legato change is WAV-only, so the L24 trace must be byte-identical. This
task re-verifies the invariants directly from the landed trace.
"""
import hashlib
import json
import sys
from pathlib import Path

REPO = Path("/home/erick/projects/integrated-release")
SCRATCH = Path("/home/erick/workspace/scratch-governed-loop-run/mvp6_3")
OUT = SCRATCH / "task-c"
TRACE = REPO / "tools/governed-loop/mvp6_1/task-c/traces/piece_a_far_shore_delooped.jsonl"
PREDECL = SCRATCH / "task-0" / "mvp6_3_predeclared_fade.json"
EXPECTED_TRACE = "38ab32e5ebd1af7854d3241ecdab5879d5240293c3d62f80c3c28ffc38ad9e1b"

GUARD = {
    "causationClaim": False, "physicalQuantityClaim": False,
    "tierClassifier": False, "globalCHNull": True,
    "gov517_correspondence_claimed": False, "still_set_label": "still_set",
    "layer": "SPEC-001 \u00a71.3 overlay dynamics",
}


def sha256_file(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    predecl = json.loads(PREDECL.read_text(encoding="utf-8"))
    if sha256_file(TRACE) != EXPECTED_TRACE:
        raise SystemExit("STOP: S-4 trace drift")
    records = [json.loads(line) for line in TRACE.read_text(encoding="utf-8").splitlines()]
    micro = [r for r in records if r.get("recordType") == "micro"]
    rests = [r for r in records if r.get("recordType") == "rest"]
    by_bar = {}
    for step in micro:
        by_bar.setdefault(step["bar"], []).append(step)
    for bar in by_bar:
        by_bar[bar].sort(key=lambda s: s["sub"])
    bars = sorted(by_bar)
    if len(bars) != 55 or len(micro) != 408:
        raise SystemExit(f"STOP: S-4 shape {len(bars)}/{len(micro)}")
    if len(rests) != 1:
        raise SystemExit("STOP: S-4 rest count")
    rest = rests[0]
    if (rest["source"], rest["boundary"], rest["target"], rest["durationMs"], rest["oscillators"]) != (
            "379@7", "757@6", "379@7", 300, 0):
        raise SystemExit("STOP: S-4 rest shape")
    out_of_mask = sum(1 for s in micro if s["emittedPc"] not in s["pitchClasses"])
    still = sum(1 for s in micro if s["nextQ"] in (12, 13, 14, 15))
    q_states = {s["nextQ"] for s in micro}
    nodes = {s["node"] for s in micro}
    sys.path.insert(0, str(REPO / "tools/governed-loop/mvp4/task-b"))
    import mvp4_symbolic_planner as planner_module
    planner = planner_module.Planner()
    offices = {planner.office.get(s["mask"]) for s in micro if planner.office.get(s["mask"])}
    phases = {s["phase"] for s in micro}
    if out_of_mask or still:
        raise SystemExit("STOP: S-4 mask/still leak")
    if len(q_states) != 12 or len(nodes) != 41 or len(offices) != 7 or len(phases) != 12:
        raise SystemExit(f"STOP: S-4 coverage {len(q_states)}/{len(nodes)}/{len(offices)}/{len(phases)}")
    dwell = [b for b in bars if len(by_bar[b]) == 12]
    if len(dwell) != 19:
        raise SystemExit(f"STOP: S-4 dwell bars {len(dwell)}")
    for bar in dwell:
        pcs = {s["emittedPc"] for s in by_bar[bar]}
        qs = {s["nextQ"] for s in by_bar[bar]}
        if len(pcs) != 7 or len(qs) != 12:
            raise SystemExit(f"STOP: S-4 dwell law bar {bar}")
    duration = max(rest["startMs"] + rest["durationMs"],
                   max(s["barStartMs"] + s["barDurationMs"] for s in micro))
    if duration != 122700:
        raise SystemExit(f"STOP: S-4 duration {duration}")
    receipt = {
        "schemaVersion": "governed-loop.mvp6_3-task-c.v1",
        "directive": "MVP6.3-DIR-1",
        "task": "MVP6_3-TC",
        "status": "COMPLETE",
        "trace": {"path": str(TRACE), "sha256": sha256_file(TRACE),
                  "bytes": TRACE.stat().st_size, "byteIdenticalToL24": True},
        "predeclaration": {"path": str(PREDECL), "sha256": sha256_file(PREDECL)},
        "invariants": {
            "bars": len(bars), "microSteps": len(micro), "durationMs": duration,
            "rests": len(rests), "outOfMaskPitches": out_of_mask,
            "stillSetEntries": still, "distinctQStates": len(q_states),
            "distinctMacroStates": len(nodes), "distinctOffices": len(offices),
            "distinctPhases": len(phases), "dwellBars": len(dwell),
            "dwellBarsFullQ": True, "dwellBarsFullContainer": True,
        },
        "guardFlags": GUARD,
        "llmCalls": 0,
        "floatValues": 0,
        "stopRules": [],
    }
    (OUT / "mvp6_3_task_c_receipt.json").write_text(
        json.dumps(receipt, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps({"status": "COMPLETE", "traceSha256": EXPECTED_TRACE,
                      "bars": len(bars), "micro": len(micro), "dwellBars": len(dwell)}, indent=2))


if __name__ == "__main__":
    main()
