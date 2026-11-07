#!/usr/bin/env python3
"""MVP8.1b-DIR-1 Task B: recompute the corrected B4-prime stem sanity metric
from the pinned stem bytes; carry B4b/c/d and B1/B2/B3."""
import importlib.util
import json
import sys
from pathlib import Path

MVP8 = Path("/home/erick/workspace/scratch-governed-loop-run/mvp8_pentatonic_q")
MVP81 = Path("/home/erick/workspace/scratch-governed-loop-run/mvp8_1_stem")
ROOT = Path("/home/erick/workspace/scratch-governed-loop-run/mvp8_1b_metric_fix")
sys.path.insert(0, str(MVP8))
sys.path.insert(0, str(MVP81 / "task-b"))
import mvp8_common as common

TASK_B = ROOT / "task-b"
RECEIPT = TASK_B / "mvp8_1b_task_b_receipt.json"
T0_RECEIPT = ROOT / "task-0/mvp8_1b_task_0_receipt.json"
TA_RECEIPT = ROOT / "task-a/mvp8_1b_task_a_receipt.json"
PREDECL = ROOT / "task-0/mvp8_1b_predeclared_bets.json"
TB81 = MVP81 / "task-b/mvp8_1_task_b_receipt.json"
STEMS = MVP81 / "task-a/stems"


def load_module(name, path):
    spec = importlib.util.spec_from_file_location(name, str(path))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def main():
    TASK_B.mkdir(parents=True, exist_ok=True)
    predecl = json.loads(PREDECL.read_text(encoding="utf-8"))
    if predecl.get("status") != "locked-before-evaluation":
        common.stop("S-9", "predeclaration not locked")
    t0 = json.loads(T0_RECEIPT.read_text(encoding="utf-8"))
    ta = json.loads(TA_RECEIPT.read_text(encoding="utf-8"))
    if not ta.get("pass"):
        common.stop("S-5", "Task A stem verification failed")
    tb81 = json.loads(TB81.read_text(encoding="utf-8"))
    lens = load_module("mvp81b_lens", common.REPO_INPUTS["lens"])
    mvp81_tb = load_module("mvp81b_measure", MVP81 / "task-b/mvp8_1_bets.py")
    planner = common.build_planner()

    rows = []
    for stem in t0["stems"]:
        label = stem["label"]
        trace_path = MVP8 / stem["tracePath"]
        lead_path = STEMS / f"{label}-lead.wav"
        corr = mvp81_tb.measure_stem(trace_path, lead_path, planner, lens)
        r_mean = corr["meanPcDeconfounded"]
        scored = bool(stem["scored"])
        scored_pass = (r_mean is not None and r_mean >= predecl["scoredStemRule"]["threshold"])
        rows.append({
            "label": label,
            "bars": stem["bars"],
            "officeCount": stem["officeCount"],
            "scored": scored,
            "reason": stem["reason"],
            "rMeanPc": r_mean,
            "rLeadPcSum": corr["leadDeconfounded"],
            "rContainer": corr["containerDeconfounded"],
            "windows": corr["windows"],
            "scoredPass": scored_pass if scored else None,
        })
    scored_rows = [row for row in rows if row["scored"]]
    b4a_passing = sum(1 for row in scored_rows if row["scoredPass"])
    b4a_pass = b4a_passing == len(scored_rows)

    governed = next(row for row in rows if row["label"] == "far-shore-pentatonic")
    control = next(row for row in rows if row["label"] == "far-shore-ungoverned-control")
    governed_margin = governed["rLeadPcSum"] - governed["rContainer"]
    control_margin = control["rLeadPcSum"] - control["rContainer"]
    b4b_pass = governed_margin > 0 and governed_margin >= control_margin
    b4c = tb81["symbolic"]["B4c"]
    b4d_pass = bool(tb81["symbolic"]["B4d"]["pass"]) and bool(ta["pass"])
    carried = tb81["symbolic"]["carriedReverification"]

    acoustic = {
        "stemTable": rows,
        "farShoreMargins": {
            "governed": {
                "rLead": governed["rLeadPcSum"],
                "rContainer": governed["rContainer"],
                "margin": governed_margin,
            },
            "ungovernedControl": {
                "rLead": control["rLeadPcSum"],
                "rContainer": control["rContainer"],
                "margin": control_margin,
            },
        },
    }
    symbolic = {
        "B4aPrime": {
            "scoredStems": len(scored_rows),
            "passing": b4a_passing,
            "threshold": "0.90",
            "metric": "mean emitted pc",
            "pass": b4a_pass,
        },
        "B4bCarriedRecomputed": {
            "governedMarginPositive": governed_margin > 0,
            "governedMarginAtLeastControl": governed_margin >= control_margin,
            "pass": b4b_pass,
        },
        "B4cCarried": b4c,
        "B4dCarried": {
            "stemIntegrity": bool(ta["pass"]),
            "pass": b4d_pass,
        },
        "carriedReverification": {
            "B1": carried["B1"],
            "B2": carried["B2"],
            "B3": carried["B3"],
            "pass": carried["pass"],
        },
    }
    receipt = {
        "schemaVersion": "governed-loop.mvp8_1b-task-b.v1",
        "directive": "MVP8.1b-DIR-1",
        "task": "MVP8.1b-TB",
        "status": "COMPLETE",
        "guardFlags": common.GUARD,
        "predeclarationSha256": common.sha256_file(PREDECL),
        "t0ReceiptSha256": common.sha256_file(T0_RECEIPT),
        "taskAReceiptSha256": common.sha256_file(TA_RECEIPT),
        "mvp81TaskBReceiptSha256": common.sha256_file(TB81),
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
        "B4aPrime": symbolic["B4aPrime"],
        "B4b": symbolic["B4bCarriedRecomputed"],
        "B4c": symbolic["B4cCarried"],
        "B4d": symbolic["B4dCarried"],
        "carried": symbolic["carriedReverification"],
        "margins": acoustic["farShoreMargins"],
        "scored": [
            {"label": row["label"], "rMeanPc": row["rMeanPc"],
             "pass": row["scoredPass"]}
            for row in scored_rows
        ],
        "floatValuesSymbolic": receipt["floatValuesSymbolic"],
    }, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
