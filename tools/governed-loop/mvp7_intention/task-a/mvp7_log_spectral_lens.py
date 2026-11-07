#!/usr/bin/env python3
"""MVP7-INTENTION-DIR-1 Task A: log/geometric spectral lens.

Read-only measurement of landed WAVs in the coordinate where L22 proved the
container sums achromatic. The lens reports per-window log-spectral centroid
and spread, aggregated per 300 ms micro step region, per bar, and per protocol
section. No entropy, no C_H formulation, no perceptual model.

Modality 2: continuous values are external boundary-conditioned measurements
carrying the four registered guard flags.
"""
import hashlib
import json
import math
import statistics
import struct
import sys
import wave
from pathlib import Path

import numpy as np

REPO = Path("/home/erick/projects/integrated-release")
SCRATCH = Path("/home/erick/workspace/scratch-governed-loop-run/mvp7_intention")
TASK_A = SCRATCH / "task-a"
CATALOG = TASK_A / "log_spectral_catalog_far_shore.json"
RECEIPT = TASK_A / "mvp7_task_a_receipt.json"
PREDECL = SCRATCH / "task-0" / "mvp7_predeclared_bets_and_schema.json"

SR = 44100
FFT_SIZE = 4096
HOP = 1024
REF_HZ = 440.0
BAND_LOW = 27.5
BAND_HIGH = 4186.01
MIN_POWER = 1e-12

WAVS = {
    "L21_reset": "tools/governed-loop/mvp5/task-b/renders/track3_arm3a_dynamic_q_reset.wav",
    "L21_carried": "tools/governed-loop/mvp5/task-b/renders/track4_arm3b_dynamic_q_carried.wav",
    "L23": "tools/governed-loop/mvp6/task-d/renders/piece_a_far_shore.wav",
    "L24": "tools/governed-loop/mvp6_1/task-d/renders/piece_a_far_shore_delooped.wav",
    "L25": "tools/governed-loop/mvp6_2/task-d/renders/piece_a_far_shore_legato.wav",
    "L26": "tools/governed-loop/mvp6_3/task-d/renders/piece_a_far_shore_faded.wav",
}
EXPECTED_HASHES = {
    "L21_reset": "b4e9b1674fd4ae3b94fc9e0921e3c461c642403fa34a91869fe851e069398307",
    "L21_carried": "d0fe3d2727593d22ee49ed50d64b0253ed36f52e64d9f202d43596106e735738",
    "L23": "e5c8bf2b0e31f32d36a8816e6011f09e10b26cce5b94c4782aefd28406567a77",
    "L24": "b2ce0b3f5ac39d0ac226083e5c2646a1d116222acc5473b746173a0d3125d7f1",
    "L25": "defd27219fb292fb9e1071b4fa13020d4adc62e2f981bce88d9b936d6a3e9f50",
    "L26": "330abb9c9224f8526f52f25763c6902d581da3a0fe3ac3127161ae22056ae1a9",
}
TRACES = {
    "L21_reset": "tools/governed-loop/mvp5/task-a/traces/arm3a_dynamic_q_reset.jsonl",
    "L21_carried": "tools/governed-loop/mvp5/task-a/traces/arm3b_dynamic_q_carried.jsonl",
    "L23": "tools/governed-loop/mvp6/task-c/traces/piece_a_far_shore.jsonl",
    "L24": "tools/governed-loop/mvp6_1/task-c/traces/piece_a_far_shore_delooped.jsonl",
    "L25": "tools/governed-loop/mvp6_1/task-c/traces/piece_a_far_shore_delooped.jsonl",
    "L26": "tools/governed-loop/mvp6_1/task-c/traces/piece_a_far_shore_delooped.jsonl",
}
SECTIONS = [
    ("home_mirror", 0, 13800),
    ("departure", 13800, 27300),
    ("first_dwell", 27300, 38100),
    ("climax", 38100, 58500),
    ("shore", 58500, 78600),
    ("return", 78600, 108300),
    ("homecoming", 108300, 122700),
]
GUARD = {
    "causationClaim": False, "physicalQuantityClaim": False,
    "tierClassifier": False, "globalCHNull": True,
    "gov517_correspondence_claimed": False, "still_set_label": "still_set",
    "layer": "SPEC-001 \u00a71.3 overlay dynamics",
}


def stop(rule, detail):
    print(f"STOP: {rule} {detail}")
    sys.exit(2)


def sha256_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def load_wav(path):
    with wave.open(str(path), "rb") as handle:
        if (handle.getframerate() != SR or handle.getnchannels() != 1
                or handle.getsampwidth() != 2):
            stop("S-5", f"format drift {path}")
        frames = handle.readframes(handle.getnframes())
    samples = np.frombuffer(frames, dtype="<i2").astype(np.float64) / 32768.0
    return samples


def load_bars(trace_path):
    records = [json.loads(line) for line in
               Path(trace_path).read_text(encoding="utf-8").splitlines()]
    micro = [r for r in records if r.get("recordType") == "micro"]
    if not micro:
        return None
    bars = {}
    for record in micro:
        bar = int(record["bar"])
        entry = bars.setdefault(bar, {
            "bar": bar, "node": record["node"],
            "startMs": int(record["barStartMs"]),
            "durationMs": int(record["barDurationMs"]),
        })
    return [bars[key] for key in sorted(bars)]


def window_descriptors(samples, hann):
    total = len(samples)
    frequencies = np.arange(FFT_SIZE // 2 + 1) * SR / FFT_SIZE
    band = (frequencies >= BAND_LOW) & (frequencies <= BAND_HIGH)
    log_freq = np.log2(frequencies[band] / REF_HZ)
    rows = []
    for start in range(0, total - FFT_SIZE + 1, HOP):
        frame = samples[start:start + FFT_SIZE]
        spectrum = np.fft.rfft(frame * hann)
        power = (np.abs(spectrum) ** 2)[band]
        total_power = float(power.sum())
        center_ms = (start + FFT_SIZE / 2) / SR * 1000.0
        if total_power <= MIN_POWER:
            rows.append({
                "startSample": start, "centerMs": center_ms,
                "power": total_power, "silent": True,
                "centroidOct": None, "spreadOct": None,
                "arithmeticCentroidHz": None,
            })
            continue
        weights = power / total_power
        centroid = float((weights * log_freq).sum())
        variance = float((weights * (log_freq - centroid) ** 2).sum())
        arithmetic = float((weights * (2.0 ** log_freq) * REF_HZ).sum())
        rows.append({
            "startSample": start, "centerMs": center_ms,
            "power": total_power, "silent": False,
            "centroidOct": centroid, "spreadOct": math.sqrt(max(0.0, variance)),
            "arithmeticCentroidHz": arithmetic,
        })
    return rows


def aggregate(windows, start_ms, end_ms):
    selected = [row for row in windows
                if row["centroidOct"] is not None
                and start_ms <= row["centerMs"] < end_ms]
    if not selected:
        return {"windows": 0, "centroidOct": None, "spreadOct": None,
                "arithmeticCentroidHz": None, "silentWindows": 0}
    return {
        "windows": len(selected),
        "centroidOct": statistics.fmean(row["centroidOct"] for row in selected),
        "spreadOct": statistics.fmean(row["spreadOct"] for row in selected),
        "arithmeticCentroidHz": statistics.fmean(row["arithmeticCentroidHz"] for row in selected),
        "silentWindows": sum(1 for row in windows
                             if row["centroidOct"] is None
                             and start_ms <= row["centerMs"] < end_ms),
    }


def bar_rows(windows, bars):
    rows = []
    for bar in bars:
        row = aggregate(windows, bar["startMs"], bar["startMs"] + bar["durationMs"])
        row.update(bar)
        rows.append(row)
    return rows


def analyze(path):
    samples = load_wav(path)
    hann = np.hanning(FFT_SIZE)
    windows = window_descriptors(samples, hann)
    return samples, windows


def run_variance(bar_table, bars, node):
    values = [row["centroidOct"] for row in bar_table
              if row["node"] == node and row["centroidOct"] is not None]
    if len(values) < 2:
        return None
    return statistics.pvariance(values)


def q_results(catalog, predecl):
    a = catalog["files"]
    out = {}

    # Q1 opening gesture: bar 1/5 home, bar 3 apex, bar 6 first departure bar.
    opening = [row for row in a["L26"]["bars"] if row["bar"] in (1, 3, 5, 6)]
    out["Q1"] = {
        "bars": opening,
        "apexMinusHomeOct": a["L26"]["bars"][2]["centroidOct"] - a["L26"]["bars"][0]["centroidOct"],
        "departureMinusApexOct": a["L26"]["bars"][5]["centroidOct"] - a["L26"]["bars"][2]["centroidOct"],
    }

    # Q2 quiet vs climax section means.
    quiet = a["L26"]["sections"]["first_dwell"]
    climax = a["L26"]["sections"]["climax"]
    observed = climax["centroidOct"] - quiet["centroidOct"]
    out["Q2"] = {
        "quiet": quiet,
        "climax": climax,
        "octaveGap": observed,
        "protocolArithmeticMeansHz": {"quiet": 489.712, "climax": 793.337},
        "arithmeticGapOct": math.log2(793.337 / 489.712),
    }
    bet = predecl["bets"]["A1_Q2_calibration"]
    out["Q2"]["betA1"] = {
        "expectedOctaves": bet["expectedOctaves"],
        "passRule": bet["passRule"],
        "observedOctaves": observed,
        "pass": 0.60 <= observed <= 0.80,
        "label": bet["label"],
    }

    # Q3 shore rest.
    shore = a["L26"]["sections"]["shore"]
    rest_windows = [row for row in a["L26"]["windows"]
                    if 74700 <= row["centerMs"] < 75000]
    out["Q3"] = {
        "section": shore,
        "restWindowCount": len(rest_windows),
        "restSilentWindows": sum(1 for row in rest_windows if row["silent"]),
        "restCentroidsOct": [row["centroidOct"] for row in rest_windows],
        "restPowers": [row["power"] for row in rest_windows],
    }

    # Q4 return vs departure.
    departure = a["L26"]["sections"]["departure"]
    ret = a["L26"]["sections"]["return"]
    out["Q4"] = {
        "departure": departure,
        "return": ret,
        "centroidDeltaOct": ret["centroidOct"] - departure["centroidOct"],
        "spreadDeltaOct": ret["spreadOct"] - departure["spreadOct"],
    }

    # Q5 homecoming terminal bar vs bar 1.
    terminal = a["L26"]["bars"][-1]
    first = a["L26"]["bars"][0]
    out["Q5"] = {
        "terminalBar": terminal,
        "firstBar": first,
        "terminalMinusFirstOct": terminal["centroidOct"] - first["centroidOct"],
    }

    # Q6 de-loop run variance L23 vs L24.
    runs = [("1453@6", [15, 16, 17]), ("623@8", [22, 23, 24, 25]),
            ("379@7", [32, 33, 34]), ("1387@0", [52, 53, 54, 55])]
    q6 = []
    for node, bars in runs:
        q6.append({
            "node": node,
            "bars": bars,
            "varianceL23": run_variance(a["L23"]["bars"], a["L23"]["bars"], node),
            "varianceL24": run_variance(a["L24"]["bars"], a["L24"]["bars"], node),
        })
    out["Q6"] = q6

    # Q7 legato seam vs interior, L24 -> L25, window level.
    l24 = a["L24"]["windows"]
    l25 = a["L25"]["windows"]
    seam_deltas, interior_deltas = [], []
    boundaries = [row["startMs"] for row in a["L24"]["bars"][1:]]
    for left, right in zip(l24, l25):
        if left["centroidOct"] is None or right["centroidOct"] is None:
            continue
        delta = abs(right["centroidOct"] - left["centroidOct"])
        center = left["centerMs"]
        near_seam = any(abs(center - boundary) <= 300.0 for boundary in boundaries)
        in_interior = False
        for bar in a["L24"]["bars"]:
            start, end = bar["startMs"], bar["startMs"] + bar["durationMs"]
            if start <= center < end:
                margin = (end - start) * 0.25
                in_interior = start + margin <= center < end - margin
                break
        if near_seam:
            seam_deltas.append(delta)
        elif in_interior:
            interior_deltas.append(delta)
    seam_mean = statistics.fmean(seam_deltas) if seam_deltas else None
    interior_mean = statistics.fmean(interior_deltas) if interior_deltas else None
    out["Q7"] = {
        "seamWindows": len(seam_deltas),
        "interiorWindows": len(interior_deltas),
        "seamMeanAbsDeltaOct": seam_mean,
        "interiorMeanAbsDeltaOct": interior_mean,
        "seamMaxAbsDeltaOct": max(seam_deltas) if seam_deltas else None,
        "interiorMaxAbsDeltaOct": max(interior_deltas) if interior_deltas else None,
    }
    bet = predecl["bets"]["A2_negative_controls"]["legato"]
    out["Q7"]["betA2Legato"] = {
        "passRule": bet["passRule"],
        "observed": {"seamMean": seam_mean, "interiorMean": interior_mean},
        "pass": bool(seam_mean is not None and interior_mean is not None
                     and seam_mean > 10.0 * interior_mean
                     and interior_mean < 0.01),
    }

    # Q8 clean ending: bar-level delta L25 -> L26, last-50ms sample metrics.
    l25_samples = catalog["_samples"]["L25"]
    l26_samples = catalog["_samples"]["L26"]
    bar_deltas = []
    for bar in a["L26"]["bars"]:
        left = next(row for row in a["L25"]["bars"] if row["bar"] == bar["bar"])
        right = bar
        delta = (None if left["centroidOct"] is None or right["centroidOct"] is None
                 else abs(right["centroidOct"] - left["centroidOct"]))
        bar_deltas.append({"bar": bar["bar"], "deltaOct": delta})
    bars_1_54 = [row["deltaOct"] for row in bar_deltas if row["bar"] <= 54
                 and row["deltaOct"] is not None]
    bar_55 = [row["deltaOct"] for row in bar_deltas if row["bar"] == 55
              and row["deltaOct"] is not None]
    out["Q8"] = {
        "bars1to54MaxAbsDeltaOct": max(bars_1_54) if bars_1_54 else None,
        "bar55MaxAbsDeltaOct": max(bar_55) if bar_55 else None,
        "l25MaxAbsLast32": int(np.max(np.abs(l25_samples[-32:])) * 32768.0),
        "l26MaxAbsLast32": int(np.max(np.abs(l26_samples[-32:])) * 32768.0),
        "l25Last50msRms": float(np.sqrt(np.mean(l25_samples[-2205:] ** 2))),
        "l26Last50msRms": float(np.sqrt(np.mean(l26_samples[-2205:] ** 2))),
        "barDeltas": bar_deltas,
    }
    bet = predecl["bets"]["A2_negative_controls"]["fade"]
    out["Q8"]["betA2Fade"] = {
        "passRule": bet["passRule"],
        "observed": {"bars1to54Max": out["Q8"]["bars1to54MaxAbsDeltaOct"],
                     "bar55Max": out["Q8"]["bar55MaxAbsDeltaOct"]},
        "pass": bool(bars_1_54 and max(bars_1_54) == 0.0
                     and bar_55 and max(bar_55) > 0.0),
    }

    # A3 de-loop localisation at bar granularity.
    bet = predecl["bets"]["A3_deloop_localisation"]
    changed = set(bet["repeatBars"])
    tail_ms = bet["tailMs"]
    for successor in bet["successorBars"]:
        changed.add(successor)
    changed_deltas, unchanged_deltas = [], []
    for bar in a["L24"]["bars"]:
        left = next(row for row in a["L23"]["bars"] if row["bar"] == bar["bar"])
        right = bar
        if left["centroidOct"] is None or right["centroidOct"] is None:
            continue
        delta = abs(right["centroidOct"] - left["centroidOct"])
        if bar["bar"] in changed:
            changed_deltas.append(delta)
        else:
            unchanged_deltas.append(delta)
    # successor bars only count their first 500 ms at window level
    tail_changed = []
    for successor in bet["successorBars"]:
        bar = next(row for row in a["L24"]["bars"] if row["bar"] == successor)
        for left, right in zip(a["L23"]["windows"], a["L24"]["windows"]):
            if (left["centroidOct"] is None or right["centroidOct"] is None):
                continue
            if bar["startMs"] <= left["centerMs"] < bar["startMs"] + tail_ms:
                tail_changed.append(abs(right["centroidOct"] - left["centroidOct"]))
    base_changed = [row for row in changed_deltas
                    if row > 0.01]
    recall = len(base_changed) / len(changed_deltas) if changed_deltas else 0.0
    false_positive = (sum(1 for row in unchanged_deltas if row > 0.01)
                      / len(unchanged_deltas)) if unchanged_deltas else 0.0
    per_bar = []
    for bar in a["L24"]["bars"]:
        left = next(row for row in a["L23"]["bars"] if row["bar"] == bar["bar"])
        if left["centroidOct"] is None or bar["centroidOct"] is None:
            continue
        per_bar.append({
            "bar": bar["bar"],
            "node": bar["node"],
            "declaredChanged": bar["bar"] in changed,
            "centroidDeltaOct": bar["centroidOct"] - left["centroidOct"],
        })
    sweep = []
    for threshold in (0.0001, 0.001, 0.005, 0.01):
        changed_hits = sum(1 for row in per_bar
                           if row["declaredChanged"] and abs(row["centroidDeltaOct"]) > threshold)
        unchanged_hits = sum(1 for row in per_bar
                             if not row["declaredChanged"] and abs(row["centroidDeltaOct"]) > threshold)
        changed_total = sum(1 for row in per_bar if row["declaredChanged"])
        unchanged_total = sum(1 for row in per_bar if not row["declaredChanged"])
        sweep.append({
            "thresholdOct": threshold,
            "changedRecall": changed_hits / changed_total if changed_total else 0.0,
            "unchangedFalsePositiveRate": unchanged_hits / unchanged_total if unchanged_total else 0.0,
        })
    out["A3"] = {
        "changedBars": sorted(changed),
        "changedBarCentroidDeltas": changed_deltas,
        "unchangedBarCentroidDeltas": unchanged_deltas,
        "successorTailWindowDeltas": tail_changed,
        "perBar": per_bar,
        "changedBarRecall": recall,
        "unchangedBarFalsePositiveRate": false_positive,
        "passRule": bet["passRule"],
        "pass": recall == 1.0 and false_positive <= 0.05,
        "diagnosticThresholdSweep": sweep,
        "diagnosticNote": "post-hoc diagnostic only; the predeclared 0.01 threshold and pass rule are unchanged",
    }

    # A4 carried vs reset inter-bar variance.
    def bar_var(rows):
        values = [row["centroidOct"] for row in rows if row["centroidOct"] is not None]
        return statistics.pvariance(values) if len(values) > 1 else None
    var_reset = bar_var(a["L21_reset"]["bars"])
    var_carried = bar_var(a["L21_carried"]["bars"])
    bet = predecl["bets"]["A4_carried_vs_reset"]
    out["A4"] = {
        "varianceReset": var_reset,
        "varianceCarried": var_carried,
        "difference": (var_carried - var_reset
                       if var_reset is not None and var_carried is not None else None),
        "relativeUplift": ((var_carried - var_reset) / var_reset
                           if var_reset else None),
        "passRule": bet["passRule"],
        "pass": bool(var_reset is not None and var_carried is not None
                     and var_carried > var_reset),
        "diagnosticNote": "the margin is small; the bet tests direction only, not effect size",
    }
    return out


def main():
    TASK_A.mkdir(parents=True, exist_ok=True)
    predecl = json.loads(PREDECL.read_text(encoding="utf-8"))
    if predecl.get("status") != "locked-before-evaluation":
        stop("S-7", "predeclaration not locked")

    files = {}
    raw_samples = {}
    for key, rel in WAVS.items():
        path = REPO / rel
        actual = sha256_file(path)
        if actual != EXPECTED_HASHES[key]:
            stop("S-8", f"{key} hash {actual}")
        samples, windows = analyze(path)
        raw_samples[key] = samples
        bars = load_bars(REPO / TRACES[key])
        if bars is None:
            stop("S-8", f"{key} trace has no bars")
        sections = {}
        for name, start, end in SECTIONS:
            sections[name] = aggregate(windows, start, end)
        files[key] = {
            "path": rel,
            "sha256": actual,
            "durationMs": len(samples) * 1000 // SR,
            "windowCount": len(windows),
            "silentWindows": sum(1 for row in windows if row["silent"]),
            "sections": sections,
            "bars": bar_rows(windows, bars),
            "windows": windows,
        }

    catalog = {
        "schemaVersion": "governed-loop.mvp7-log-spectral-catalog.v1",
        "directive": "MVP7-INTENTION-DIR-1",
        "layer": GUARD["layer"],
        "guards": GUARD,
        "lens": predecl["lens"],
        "files": files,
        "_samples": raw_samples,
    }
    q = q_results(catalog, predecl)
    catalog.pop("_samples")
    catalog["questions"] = q
    CATALOG.write_text(json.dumps(catalog, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    bets = {
        "A1": q["Q2"]["betA1"],
        "A2_legato": q["Q7"]["betA2Legato"],
        "A2_fade": q["Q8"]["betA2Fade"],
        "A3": {"pass": q["A3"]["pass"], "recall": q["A3"]["changedBarRecall"],
               "falsePositiveRate": q["A3"]["unchangedBarFalsePositiveRate"]},
        "A4": q["A4"],
    }
    receipt = {
        "schemaVersion": "governed-loop.mvp7-task-a.v1",
        "directive": "MVP7-INTENTION-DIR-1",
        "task": "MVP7-TA",
        "status": "COMPLETE",
        "guardFlags": GUARD,
        "predeclarationSha256": sha256_file(PREDECL),
        "catalogSha256": sha256_file(CATALOG),
        "catalogPath": "task-a/log_spectral_catalog_far_shore.json",
        "inputs": {key: {"path": rel, "sha256": EXPECTED_HASHES[key]}
                   for key, rel in WAVS.items()},
        "bets": bets,
        "betsPassed": sum(1 for key in ("A1", "A2_legato", "A2_fade", "A3", "A4")
                          if (bets[key].get("pass") if isinstance(bets[key], dict) else False)),
        "q2OctaveGap": q["Q2"]["octaveGap"],
        "q2ArithmeticGapOct": q["Q2"]["arithmeticGapOct"],
        "q7SeamMeanAbsDeltaOct": q["Q7"]["seamMeanAbsDeltaOct"],
        "q7InteriorMeanAbsDeltaOct": q["Q7"]["interiorMeanAbsDeltaOct"],
        "q8Bars1to54MaxAbsDeltaOct": q["Q8"]["bars1to54MaxAbsDeltaOct"],
        "q8Bar55MaxAbsDeltaOct": q["Q8"]["bar55MaxAbsDeltaOct"],
        "a4VarianceReset": q["A4"]["varianceReset"],
        "a4VarianceCarried": q["A4"]["varianceCarried"],
        "llmCalls": 0,
        "stopRules": [],
    }
    RECEIPT.write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps({
        "status": receipt["status"],
        "betsPassed": receipt["betsPassed"],
        "bets": {key: bets[key].get("pass") if isinstance(bets[key], dict) else None
                 for key in bets},
        "q2OctaveGap": receipt["q2OctaveGap"],
        "q2ArithmeticGapOct": receipt["q2ArithmeticGapOct"],
        "q7": [receipt["q7SeamMeanAbsDeltaOct"], receipt["q7InteriorMeanAbsDeltaOct"]],
        "q8": [receipt["q8Bars1to54MaxAbsDeltaOct"], receipt["q8Bar55MaxAbsDeltaOct"]],
        "a4": [receipt["a4VarianceReset"], receipt["a4VarianceCarried"]],
    }, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
