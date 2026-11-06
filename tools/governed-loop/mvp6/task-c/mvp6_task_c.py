#!/usr/bin/env python3
"""MVP6-DIR-1 Task C: full coupled form trace, dwell-phrase law, and lead-line
contour diagnostics.

Law 3: the lead line must carry the section contour.
Law 4: dwell placement is the orchestration; phase is terrain, not a dial.
"""
import hashlib
import json
import sys
from pathlib import Path

SCRATCH = Path("/home/erick/workspace/scratch-governed-loop-run/mvp6")
OUT = SCRATCH / "task-c"
sys.path.insert(0, str(SCRATCH / "task-b"))
sys.path.insert(0, str(Path("/home/erick/projects/integrated-release/tools/governed-loop/mvp4/task-b")))

from mvp6_coupled_form_engine import FormEngine, GUARD, K_DWELL, K_TRANSIT


def sha256_file(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    engine = FormEngine()
    itinerary = engine.itinerary
    bars = [{"node": bar["node"], "k": bar["k"], "section": bar["section"],
             "sectionKey": bar["sectionKey"], "role": bar["role"]}
            for bar in itinerary["bars"]]
    rests = [{"afterBar": rest["afterBar"], "source": rest["source"],
              "boundary": rest["boundary"], "target": rest["target"],
              "durationMs": rest["durationMs"]} for rest in itinerary["rests"]]
    trace = engine.build_trace(
        "piece_a_far_shore",
        bars,
        rests,
        "MVP-6 Destination A: 1387@0 mirror gesture, 23-hop biased outbound to "
        "757@6 with quiet and climax dwells, independent 19-hop return, voiced homecoming.",
        itinerary["macroTransitions"])

    trace_path = OUT / "traces" / "piece_a_far_shore.jsonl"
    trace_path.parent.mkdir(parents=True, exist_ok=True)
    trace_sha = engine.write_trace(trace_path, trace)

    summary = trace["summary"]
    sections = engine.section_diagnostics(trace)
    bar_rows = engine.bar_diagnostics(trace)

    # Law 4: every dwell bar traverses the full Q cycle and emits the full container.
    dwell_bars = [row for row in bar_rows if row["k"] == K_DWELL]
    transit_bars = [row for row in bar_rows if row["k"] == K_TRANSIT]
    if len(dwell_bars) != 19 or len(transit_bars) != 36:
        raise SystemExit(f"STOP: S-4 bar split {len(dwell_bars)}/{len(transit_bars)}")
    for row in dwell_bars:
        if row["distinctQ"] != 12 or row["distinctEmitted"] != 7:
            raise SystemExit(f"STOP: S-4 dwell law violated at bar {row['bar']} {row['node']}")
    # Transit bars are deliberately partial: they must not claim the full cycle.
    for row in transit_bars:
        if row["distinctQ"] != 5 or row["distinctEmitted"] > 7:
            raise SystemExit(f"STOP: S-4 transit law violated at bar {row['bar']}")

    # Shape checks.
    if summary["bars"] != 55 or summary["microSteps"] != 408:
        raise SystemExit(f"STOP: S-4 trace shape {summary}")
    if summary["durationMs"] != 122700:
        raise SystemExit(f"STOP: S-4 duration {summary['durationMs']}")
    if summary["rests"] != 1 or summary["boundaryDwell"] != 0:
        raise SystemExit(f"STOP: S-4 rest/boundary {summary['rests']}/{summary['boundaryDwell']}")
    if summary["outOfMaskPitches"] != 0 or summary["stillSetEntries"] != 0:
        raise SystemExit("STOP: S-4 mask/still-set leak")
    if summary["distinctQStates"] != 12:
        raise SystemExit(f"STOP: S-4 Q coverage {summary['distinctQStates']}")
    if summary["distinctMacroStates"] != 41:
        raise SystemExit(f"STOP: S-4 macro states {summary['distinctMacroStates']}")
    if summary["distinctOffices"] != 7 or summary["distinctPhases"] != 12:
        raise SystemExit("STOP: S-4 office/phase coverage")

    rest = trace["rests"][0]
    if rest["source"] != "379@7" or rest["boundary"] != "757@6" or rest["target"] != "379@7":
        raise SystemExit("STOP: S-4 rest route")
    if rest["durationMs"] != 300 or rest["oscillators"] != 0 or rest["afterBar"] != 33:
        raise SystemExit(f"STOP: S-4 rest shape {rest}")

    # Law 3: the lead line carries the section contrast. Compare the quiet dwell
    # (Jupiter, band 0) with the climax dwell (Venus, band +12).
    by_key = {row["sectionKey"]: row for row in sections}
    quiet = by_key["first_dwell"]
    climax = by_key["climax"]
    if quiet["registerOffsetSum"] != 0:
        raise SystemExit("STOP: S-4 quiet register")
    if climax["registerOffsetSum"] <= 0:
        raise SystemExit("STOP: S-4 climax register not high")
    lead_quiet = quiet["leadPcSum"]
    lead_climax = climax["leadPcSum"]
    if lead_quiet == lead_climax:
        raise SystemExit("STOP: S-4 lead pcSum fails to separate sections")
    bands = sorted({row["registerOffsetSum"] for row in sections
                    if row["sectionKey"] not in ("home_mirror",)})
    if len(bands) < 2:
        raise SystemExit("STOP: S-4 no register-band contrast across sections")

    receipt = {
        "schemaVersion": "governed-loop.mvp6-task-c.v1",
        "directive": "MVP6-DIR-1",
        "task": "MVP6-TC",
        "status": "COMPLETE",
        "trace": {
            "path": str(trace_path),
            "sha256": trace_sha,
            "bytes": trace_path.stat().st_size,
        },
        "summary": summary,
        "laws": {
            "law3LeadLine": {
                "quietSectionLeadPcSum": lead_quiet,
                "climaxSectionLeadPcSum": lead_climax,
                "quietRegisterOffsetSum": quiet["registerOffsetSum"],
                "climaxRegisterOffsetSum": climax["registerOffsetSum"],
                "sectionRegisterBands": bands,
                "leadLineSeparatesSections": True,
            },
            "law4DwellTerrain": {
                "dwellBars": len(dwell_bars),
                "transitBars": len(transit_bars),
                "dwellBarsFullQCycle": all(row["distinctQ"] == 12 for row in dwell_bars),
                "dwellBarsFullContainer": all(row["distinctEmitted"] == 7 for row in dwell_bars),
                "quietPhase": 6,
                "climaxPhase": 8,
            },
            "law5TerminalVoiced": trace["terminalVoiced"],
        },
        "sections": sections,
        "boundaryRest": rest,
        "guardFlags": GUARD,
        "llmCalls": 0,
        "floatValues": 0,
        "stopRules": [],
    }
    (OUT / "mvp6_task_c_receipt.json").write_text(
        json.dumps(receipt, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps({
        "status": "COMPLETE",
        "bars": summary["bars"],
        "microSteps": summary["microSteps"],
        "durationMs": summary["durationMs"],
        "distinctQ": summary["distinctQStates"],
        "emittedPcs": summary["emittedPcs"],
        "quietLead": lead_quiet,
        "climaxLead": lead_climax,
        "sectionBands": bands,
        "traceSha256": trace_sha,
    }, indent=2))


if __name__ == "__main__":
    main()
