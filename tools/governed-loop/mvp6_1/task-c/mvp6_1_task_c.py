#!/usr/bin/env python3
"""MVP6.1-DIR-1 Task C: de-looped coupled trace, novelty law, and A/B against
the frozen L23 control.
"""
import hashlib
import json
import sys
from pathlib import Path

REPO = Path("/home/erick/projects/integrated-release")
SCRATCH = Path("/home/erick/workspace/scratch-governed-loop-run/mvp6_1")
OUT = SCRATCH / "task-c"
CONTROL_TRACE = REPO / "tools/governed-loop/mvp6/task-c/traces/piece_a_far_shore.jsonl"
PREDECL = SCRATCH / "task-0" / "mvp6_1_predeclared_deloop.json"
sys.path.insert(0, str(SCRATCH / "task-b"))
sys.path.insert(0, str(REPO / "tools/governed-loop/mvp4/task-b"))

from mvp6_1_coupled_form_engine import DeloopFormEngine, GUARD, K_DWELL, K_TRANSIT


def sha256_file(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def sequences(path):
    records = [json.loads(line) for line in Path(path).read_text(encoding="utf-8").splitlines()]
    by_bar = {}
    for record in records:
        if record.get("recordType") != "micro":
            continue
        by_bar.setdefault(record["bar"], []).append(record)
    for bar in by_bar:
        by_bar[bar].sort(key=lambda r: r["sub"])
    return {bar: tuple(r["emittedPc"] for r in rows) for bar, rows in by_bar.items()}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    predecl = json.loads(PREDECL.read_text(encoding="utf-8"))
    engine = DeloopFormEngine()
    itinerary = engine.itinerary
    bars = [{"node": bar["node"], "k": bar["k"], "section": bar["section"],
             "sectionKey": bar["sectionKey"], "role": bar["role"]}
            for bar in itinerary["bars"]]
    rests = [{"afterBar": rest["afterBar"], "source": rest["source"],
              "boundary": rest["boundary"], "target": rest["target"],
              "durationMs": rest["durationMs"]} for rest in itinerary["rests"]]

    trace = engine.build_trace(
        "piece_a_far_shore_delooped",
        bars, rests,
        "MVP-6.1 Destination A: de-looped dwell repeats via run-local Q1 rotation. "
        "Macro frozen; repeat phrases rotate; non-repeat bars identical to the L23 control.",
        itinerary["macroTransitions"])

    trace_path = OUT / "traces" / "piece_a_far_shore_delooped.jsonl"
    trace_path.parent.mkdir(parents=True, exist_ok=True)
    trace_sha = engine.write_trace(trace_path, trace)

    summary = trace["summary"]
    sections = engine.section_diagnostics(trace)
    bar_rows = engine.bar_diagnostics(trace)
    runs = engine.novelty_report(trace)

    dwell_bars = [row for row in bar_rows if row["k"] == K_DWELL]
    transit_bars = [row for row in bar_rows if row["k"] == K_TRANSIT]
    if len(dwell_bars) != 19 or len(transit_bars) != 36:
        raise SystemExit(f"STOP: S-4 bar split {len(dwell_bars)}/{len(transit_bars)}")
    for row in dwell_bars:
        if row["distinctQ"] != 12 or row["distinctEmitted"] != 7:
            raise SystemExit(f"STOP: S-4 dwell law at bar {row['bar']}")
    for row in transit_bars:
        if row["distinctQ"] != 5 or row["distinctEmitted"] > 7:
            raise SystemExit(f"STOP: S-4 transit law at bar {row['bar']}")

    if summary["bars"] != 55 or summary["microSteps"] != 408:
        raise SystemExit(f"STOP: S-4 shape {summary}")
    if summary["durationMs"] != 122700:
        raise SystemExit("STOP: S-4 duration")
    if summary["rests"] != 1 or summary["boundaryDwell"] != 0:
        raise SystemExit("STOP: S-4 rest/boundary")
    if summary["outOfMaskPitches"] != 0 or summary["stillSetEntries"] != 0:
        raise SystemExit("STOP: S-4 mask/still-set")
    if summary["distinctQStates"] != 12 or summary["distinctMacroStates"] != 41:
        raise SystemExit("STOP: S-4 coverage")
    if summary["distinctOffices"] != 7 or summary["distinctPhases"] != 12:
        raise SystemExit("STOP: S-4 office/phase")

    expected_runs = predecl["expected"]["runDistinct"]
    observed_runs = {run["node"]: run["length"] for run in runs}
    if observed_runs != expected_runs:
        raise SystemExit(f"STOP: S-4 run census {observed_runs}")
    repeat_bars = []
    for run in runs:
        if run["distinctSignatures"] != run["length"]:
            raise SystemExit(f"STOP: S-4 run not fully distinct {run['node']}")
        for delta in run["deltas"]:
            if delta["delta"] < predecl["expected"]["minStepDelta"]:
                raise SystemExit(f"STOP: S-4 novelty delta {delta}")
            repeat_bars.append(delta["bar"])
    if sorted(repeat_bars) != predecl["expected"]["changedBars"]:
        raise SystemExit(f"STOP: S-4 repeat bars {sorted(repeat_bars)}")

    control = sequences(CONTROL_TRACE)
    delooped = sequences(trace_path)
    changed = sorted(bar for bar in control if control[bar] != delooped.get(bar))
    if changed != predecl["expected"]["changedBars"]:
        raise SystemExit(f"STOP: S-4 A/B changed-set {changed}")
    unchanged = sorted(bar for bar in control if control[bar] == delooped.get(bar))
    if len(unchanged) != predecl["expected"]["unchangedBars"]:
        raise SystemExit(f"STOP: S-4 unchanged count {len(unchanged)}")

    # First bar of every run must be identical to the control.
    first_of_run = [1] + [run["bars"][0] for run in runs if run["bars"][0] != 1]
    for bar in first_of_run:
        if control[bar] != delooped[bar]:
            raise SystemExit(f"STOP: S-4 first-of-run drift bar {bar}")

    by_key = {row["sectionKey"]: row for row in sections}
    quiet = by_key["first_dwell"]
    climax = by_key["climax"]
    if quiet["registerOffsetSum"] != 0 or climax["registerOffsetSum"] <= 0:
        raise SystemExit("STOP: S-4 register bands")
    if quiet["leadPcSum"] == climax["leadPcSum"]:
        raise SystemExit("STOP: S-4 lead separation")

    receipt = {
        "schemaVersion": "governed-loop.mvp6_1-task-c.v1",
        "directive": "MVP6.1-DIR-1",
        "task": "MVP6_1-TC",
        "status": "COMPLETE",
        "trace": {"path": str(trace_path), "sha256": trace_sha,
                  "bytes": trace_path.stat().st_size},
        "predeclaration": {"path": str(PREDECL), "sha256": sha256_file(PREDECL)},
        "summary": summary,
        "novelty": {
            "runs": runs,
            "repeatBars": repeat_bars,
            "allDeltasAtLeast": predecl["expected"]["minStepDelta"],
            "allRunsFullyDistinct": True,
        },
        "ab": {
            "controlTraceSha256": sha256_file(CONTROL_TRACE),
            "changedBars": changed,
            "unchangedBars": len(unchanged),
            "firstOfRunIdentical": True,
        },
        "laws": {
            "law3LeadLine": {
                "quietSectionLeadPcSum": quiet["leadPcSum"],
                "climaxSectionLeadPcSum": climax["leadPcSum"],
                "quietRegisterOffsetSum": quiet["registerOffsetSum"],
                "climaxRegisterOffsetSum": climax["registerOffsetSum"],
            },
            "law4DwellTerrain": {"dwellBars": len(dwell_bars),
                                 "transitBars": len(transit_bars),
                                 "fullQCycle": True, "fullContainer": True},
            "law5TerminalVoiced": trace["terminalVoiced"],
        },
        "sections": sections,
        "guardFlags": GUARD,
        "llmCalls": 0,
        "floatValues": 0,
        "stopRules": [],
    }
    (OUT / "mvp6_1_task_c_receipt.json").write_text(
        json.dumps(receipt, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps({
        "status": "COMPLETE",
        "bars": summary["bars"],
        "microSteps": summary["microSteps"],
        "durationMs": summary["durationMs"],
        "runs": [(r["node"], r["length"], r["distinctSignatures"]) for r in runs],
        "changedBars": changed,
        "unchangedBars": len(unchanged),
        "traceSha256": trace_sha,
    }, indent=2))


if __name__ == "__main__":
    main()
