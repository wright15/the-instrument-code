#!/usr/bin/env python3
"""MVP8.1-DIR-1 Task B: B4-prime stem measurements, directional diagnostic,
and symbolic re-verification of B1/B2/B3. Acoustic floats stay under the
acoustic block; symbolic fields are integer/string/bool only."""
import importlib.util
import json
import statistics
import sys
from pathlib import Path

import numpy as np

MVP8 = Path("/home/erick/workspace/scratch-governed-loop-run/mvp8_pentatonic_q")
sys.path.insert(0, str(MVP8))
sys.path.insert(0, str(MVP8 / "task-b"))
import mvp8_common as common
from mvp8_pentatonic_q_engine import PentatonicEngine

TASK_B = Path("/home/erick/workspace/scratch-governed-loop-run/mvp8_1_stem/task-b")
RECEIPT = TASK_B / "mvp8_1_task_b_receipt.json"
TASK_A_RECEIPT = Path("/home/erick/workspace/scratch-governed-loop-run/mvp8_1_stem/task-a/mvp8_1_task_a_receipt.json")
PREDECL = Path("/home/erick/workspace/scratch-governed-loop-run/mvp8_1_stem/task-0/mvp8_1_predeclared_bets.json")
STEMS = Path("/home/erick/workspace/scratch-governed-loop-run/mvp8_1_stem/task-a/stems")
BAND = {"Saturn": -12, "Moon": 0, "Mercury": 0, "Jupiter": 0,
        "Sun": 12, "Mars": 12, "Venus": 12}


def load_module(name, path):
    spec = importlib.util.spec_from_file_location(name, str(path))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def pearson(left, right):
    left = np.asarray(left, dtype=np.float64)
    right = np.asarray(right, dtype=np.float64)
    if len(left) < 3 or np.std(left) == 0 or np.std(right) == 0:
        return None
    return float(np.corrcoef(left, right)[0, 1])


def centered_by_office(values, offices):
    groups = {}
    for value, office in zip(values, offices):
        groups.setdefault(office, []).append(value)
    means = {office: statistics.fmean(rows) for office, rows in groups.items()}
    return [value - means[office] for value, office in zip(values, offices)]


def trace_bars(trace_path):
    records = [json.loads(line) for line in Path(trace_path).read_text(encoding="utf-8").splitlines()]
    micro = [r for r in records if r.get("recordType") == "micro"]
    bars = {}
    for record in micro:
        bar = int(record["bar"])
        entry = bars.setdefault(bar, {
            "bar": bar,
            "node": record["node"],
            "startMs": int(record["barStartMs"]),
            "durationMs": int(record["barDurationMs"]),
            "pitchClasses": record["pitchClasses"],
            "section": record.get("section"),
            "sectionKey": record.get("sectionKey"),
            "registerOffset": record.get("registerOffset"),
            "lead": [],
        })
        entry["lead"].append(int(record["emittedPc"]))
    return [bars[key] for key in sorted(bars)]


def bar_measurements(wav_path, bars, lens):
    samples = lens.load_wav(wav_path)
    windows = lens.window_descriptors(samples, np.hanning(lens.FFT_SIZE))
    rows = []
    for bar in bars:
        row = lens.aggregate(windows, bar["startMs"], bar["startMs"] + bar["durationMs"])
        row.update({
            "bar": bar["bar"],
            "node": bar["node"],
            "section": bar.get("section"),
            "sectionKey": bar.get("sectionKey"),
            "registerOffset": bar.get("registerOffset", 0),
            "leadPcSum": sum(bar["lead"]),
            "meanLeadPc": statistics.fmean(bar["lead"]),
            "containerPcSum": sum(bar["pitchClasses"]),
        })
        rows.append(row)
    return rows


def correlations(rows):
    valid = [row for row in rows if row["centroidOct"] is not None]
    centroids = [row["centroidOct"] for row in valid]
    offices = [row["office"] for row in valid]
    lead = [row["leadPcSum"] for row in valid]
    mean_pc = [row["meanLeadPc"] for row in valid]
    container = [row["containerPcSum"] for row in valid]
    return {
        "windows": len(valid),
        "leadRaw": pearson(centroids, lead),
        "containerRaw": pearson(centroids, container),
        "meanPcRaw": pearson(centroids, mean_pc),
        "leadDeconfounded": pearson(centered_by_office(centroids, offices),
                                    centered_by_office(lead, offices)),
        "containerDeconfounded": pearson(centered_by_office(centroids, offices),
                                         centered_by_office(container, offices)),
        "meanPcDeconfounded": pearson(centered_by_office(centroids, offices),
                                      centered_by_office(mean_pc, offices)),
    }


def measure_stem(trace_path, wav_path, planner, lens):
    bars = trace_bars(trace_path)
    for bar in bars:
        mask = int(bar["node"].split("@")[0])
        bar["office"] = planner.office.get(mask)
        bar["registerOffset"] = BAND.get(bar["office"], 0)
    rows = bar_measurements(wav_path, bars, lens)
    for row, bar in zip(rows, bars):
        row["office"] = bar["office"]
        row["registerOffset"] = bar["registerOffset"]
    return correlations(rows)


def section_directional(trace_path, wav_path, lens):
    bars = trace_bars(trace_path)
    samples = lens.load_wav(wav_path)
    windows = lens.window_descriptors(samples, np.hanning(lens.FFT_SIZE))
    sections = {}
    for bar in bars:
        key = bar.get("sectionKey")
        if key is None:
            continue
        entry = sections.setdefault(key, {
            "section": bar.get("section"),
            "startMs": bar["startMs"],
            "endMs": bar["startMs"] + bar["durationMs"],
            "registerOffsets": [],
        })
        entry["endMs"] = max(entry["endMs"], bar["startMs"] + bar["durationMs"])
        entry["registerOffsets"].append(bar.get("registerOffset", 0))
    ordered = sorted(sections.items(), key=lambda kv: (kv[1]["section"], kv[0]))
    results = []
    for key, entry in ordered:
        row = lens.aggregate(windows, entry["startMs"], entry["endMs"])
        results.append({
            "sectionKey": key,
            "section": entry["section"],
            "centroidOct": row["centroidOct"],
            "registerOffset": statistics.fmean(entry["registerOffsets"]),
        })
    comparisons = []
    for left, right in zip(results, results[1:]):
        if left["centroidOct"] is None or right["centroidOct"] is None:
            continue
        d_centroid = right["centroidOct"] - left["centroidOct"]
        d_register = right["registerOffset"] - left["registerOffset"]
        comparisons.append({
            "from": left["sectionKey"],
            "to": right["sectionKey"],
            "deltaCentroidOct": d_centroid,
            "deltaRegisterOffset": d_register,
            "sameDirection": (d_centroid == 0 or d_register == 0
                              or (d_centroid > 0) == (d_register > 0)),
        })
    return {
        "sections": results,
        "comparisons": comparisons,
        "agreements": sum(1 for row in comparisons if row["sameDirection"]),
        "comparisonCount": len(comparisons),
    }


def main():
    TASK_B.mkdir(parents=True, exist_ok=True)
    predecl = json.loads(PREDECL.read_text(encoding="utf-8"))
    if predecl.get("status") != "locked-before-evaluation":
        common.stop("S-9", "predeclaration not locked")
    ta = json.loads(TASK_A_RECEIPT.read_text(encoding="utf-8"))
    if not ta.get("pass"):
        common.stop("S-5", "Task A stem integrity failed")
    lens = load_module("mvp81_lens", common.REPO_INPUTS["lens"])
    planner = common.build_planner()

    stem_rows = []
    self_tracking = []
    for row in ta["stems"]:
        label = row["label"]
        trace_path = MVP8 / row["tracePath"]
        lead_path = Path("/home/erick/workspace/scratch-governed-loop-run/mvp8_1_stem") / row["lead"]["path"]
        pad_path = Path("/home/erick/workspace/scratch-governed-loop-run/mvp8_1_stem") / row["pad"]["path"]
        lead_corr = measure_stem(trace_path, lead_path, planner, lens)
        pad_corr = measure_stem(trace_path, pad_path, planner, lens)
        stem_rows.append({
            "label": label,
            "lead": lead_corr,
            "pad": pad_corr,
        })
        self_tracking.append({
            "label": label,
            "rLead": lead_corr["leadDeconfounded"],
            "rContainer": lead_corr["containerDeconfounded"],
            "pass": (lead_corr["leadDeconfounded"] is not None
                     and lead_corr["leadDeconfounded"] >= 0.90),
        })

    # B4'a: all 12 lead stems self-track >= 0.90
    b4a_passing = sum(1 for row in self_tracking if row["pass"])
    b4a_pass = b4a_passing == len(self_tracking)

    # Non-bet sanity diagnostic: mean emitted pc is the lead-tracking signal.
    defined_mean_pc = [row for row in stem_rows
                       if row["lead"]["meanPcDeconfounded"] is not None]
    mean_pc_passing = sum(1 for row in defined_mean_pc
                          if row["lead"]["meanPcDeconfounded"] >= 0.90)
    diagnostic_sanity = {
        "definedStems": len(defined_mean_pc),
        "passing": mean_pc_passing,
        "threshold": "0.90",
        "nonBet": True,
        "note": ("mean emitted pc is the intended lead-tracking signal; the locked "
                 "B4a proxy used pcSum. Single-office or two-bar stems have zero "
                 "residual variance after office deconfounding and are undefined, "
                 "not failed."),
    }

    # B4'b: Far Shore governed vs ungoverned stem margins
    governed_row = next(row for row in stem_rows if row["label"] == "far-shore-pentatonic")
    control_row = next(row for row in stem_rows if row["label"] == "far-shore-ungoverned-control")
    governed_margin = (governed_row["lead"]["leadDeconfounded"]
                       - governed_row["lead"]["containerDeconfounded"])
    control_margin = (control_row["lead"]["leadDeconfounded"]
                      - control_row["lead"]["containerDeconfounded"])
    b4b_pass = governed_margin > 0 and governed_margin >= control_margin

    # B4'c: full-mix directional diagnostic (report-only)
    directional = {}
    for label in ("far-shore-pentatonic", "far-shore-ungoverned-control"):
        directional[label] = section_directional(
            MVP8 / f"task-b/traces/{label}.jsonl",
            MVP8 / f"task-b/renders/{label}.wav", lens)

    # B1/B2/B3 symbolic re-verification
    mvp8_tb = load_module("mvp81_mvp8_tb", MVP8 / "task-b/mvp8_task_b.py")
    engine = PentatonicEngine()
    b1 = mvp8_tb.run_b1(engine)
    b2 = mvp8_tb.run_b2(engine)
    b3 = mvp8_tb.run_b3(engine, common.load_predecl())
    carried_ok = b1["pass"] and b2["pass"] and b3["pass"]

    acoustic = {
        "stemMeasurements": stem_rows,
        "stemSelfTracking": self_tracking,
        "farShoreMargins": {
            "governed": {
                "rLead": governed_row["lead"]["leadDeconfounded"],
                "rContainer": governed_row["lead"]["containerDeconfounded"],
                "margin": governed_margin,
            },
            "ungovernedControl": {
                "rLead": control_row["lead"]["leadDeconfounded"],
                "rContainer": control_row["lead"]["containerDeconfounded"],
                "margin": control_margin,
            },
        },
        "directionalDiagnostic": directional,
    }
    symbolic = {
        "B4a": {
            "stems": len(self_tracking),
            "passing": b4a_passing,
            "threshold": "0.90",
            "pass": b4a_pass,
        },
        "B4aDiagnosticSanity": diagnostic_sanity,
        "B4b": {
            "governedMarginPositive": governed_margin > 0,
            "governedMarginAtLeastControl": governed_margin >= control_margin,
            "pass": b4b_pass,
        },
        "B4c": {
            "governedAgreements": directional["far-shore-pentatonic"]["agreements"],
            "governedComparisons": directional["far-shore-pentatonic"]["comparisonCount"],
            "controlAgreements": directional["far-shore-ungoverned-control"]["agreements"],
            "controlComparisons": directional["far-shore-ungoverned-control"]["comparisonCount"],
            "diagnosticOnly": True,
        },
        "B4d": {
            "stemIntegrity": ta["pass"],
            "pass": bool(ta["pass"]),
        },
        "carriedReverification": {
            "B1": b1,
            "B2": b2,
            "B3": {
                "pass": b3["pass"],
                "badFocalSelections": b3["badFocalSelections"],
                "badOrbitEmissions": b3["badOrbitEmissions"],
                "badInitiationEmissions": b3["badInitiationEmissions"],
                "emissionChecks": b3["emissionChecks"],
            },
            "pass": carried_ok,
        },
    }
    receipt = {
        "schemaVersion": "governed-loop.mvp8_1-task-b.v1",
        "directive": "MVP8.1-DIR-1",
        "task": "MVP8.1-TB",
        "status": "COMPLETE",
        "guardFlags": common.GUARD,
        "predeclarationSha256": common.sha256_file(PREDECL),
        "taskAReceiptSha256": common.sha256_file(TASK_A_RECEIPT),
        "symbolic": symbolic,
        "acoustic": acoustic,
        "llmCalls": 0,
        "stopRules": [],
    }
    receipt["floatValuesSymbolic"] = len(common.find_floats(
        {**symbolic, "guardFlags": {}}))
    RECEIPT.write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps({
        "status": "COMPLETE",
        "B4a": symbolic["B4a"],
        "B4aDiagnosticSanity": symbolic["B4aDiagnosticSanity"],
        "B4b": symbolic["B4b"],
        "B4c": symbolic["B4c"],
        "B4d": symbolic["B4d"],
        "carried": symbolic["carriedReverification"],
        "margins": acoustic["farShoreMargins"],
        "floatValuesSymbolic": receipt["floatValuesSymbolic"],
    }, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
