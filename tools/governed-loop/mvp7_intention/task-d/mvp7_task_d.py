#!/usr/bin/env python3
"""MVP7-INTENTION-DIR-1 Task D: render the accepted intention plans, measure
the six predeclared takeaways, and prepare the blind A/B manifest.

The ear verdict is human-only and stays unsigned. Rendering uses the frozen
legato + 50 ms fade law. Read-only against the repository.
"""
import hashlib
import importlib.util
import json
import math
import statistics
from pathlib import Path

import numpy as np

REPO = Path("/home/erick/projects/integrated-release")
SCRATCH = Path("/home/erick/workspace/scratch-governed-loop-run/mvp7_intention")
TASK_C = SCRATCH / "task-c"
TASK_D = SCRATCH / "task-d"
RENDERS = TASK_D / "renders"
TRACES = TASK_D / "traces"
PREDECL = SCRATCH / "task-0" / "mvp7_predeclared_bets_and_schema.json"
TC_RECEIPT = TASK_C / "mvp7_task_c_receipt.json"
RECEIPT = TASK_D / "mvp7_task_d_receipt.json"
CONTROL_WAV = REPO / "tools/governed-loop/mvp6_3/task-d/renders/piece_a_far_shore_faded.wav"
CONTROL_SHA = "330abb9c9224f8526f52f25763c6902d581da3a0fe3ac3127161ae22056ae1a9"
FADE_SAMPLES = 2205

GUARD = {
    "causationClaim": False, "physicalQuantityClaim": False,
    "tierClassifier": False, "globalCHNull": True,
    "gov517_correspondence_claimed": False, "still_set_label": "still_set",
    "layer": "SPEC-001 \u00a71.3 overlay dynamics",
}


def sha256_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


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


def render_plan(tb, ctx, label, trace):
    renderer = load_module(
        "mvp7_td_fade_renderer",
        REPO / "tools/governed-loop/mvp6_3/task-b/mvp6_3_fade_renderer.py")
    base = renderer.base
    palettes = base.extract_audio_parameters(REPO / "orrery/src/audio.ts")["offices"]
    office_lookup = {mask: office for mask, office in ctx["planner"].office.items() if office}
    trace_path = TRACES / f"{label}.jsonl"
    trace_hash = ctx["form_engine_module"].FormEngine.write_trace(
        ctx["engine"], trace_path, trace)
    exempt = {len(trace["bars"])}
    result = renderer.render_track_faded(
        label, trace_path, palettes, office_lookup, exempt, FADE_SAMPLES)
    wav_path = RENDERS / f"{label}.wav"
    midi_path = RENDERS / f"{label}.mid"
    wav_path.write_bytes(result["wavBytes"])
    midi_path.write_bytes(result["midiBytes"])
    samples = np.frombuffer(result["wavBytes"][44:], dtype="<i2")
    lens, _, windows = tb.analyze(wav_path)
    bars = trace["bars"]
    bar_rows = []
    for bar in bars:
        row = lens.aggregate(windows, bar["startMs"], bar["startMs"] + bar["durationMs"])
        row.update({key: bar[key] for key in ("bar", "node", "office", "phase", "sectionKey")})
        steps = [step for step in trace["microSteps"] if step["bar"] == bar["bar"]]
        row["leadPcSum"] = sum(step["emittedPc"] for step in steps)
        row["containerPcSum"] = sum(bar["pitchClasses"])
        bar_rows.append(row)
    sections = []
    for key in sorted({bar["sectionKey"] for bar in bars},
                      key=lambda key: next(bar["section"] for bar in bars if bar["sectionKey"] == key)):
        spans = [bar for bar in bars if bar["sectionKey"] == key]
        row = lens.aggregate(windows, spans[0]["startMs"],
                             spans[-1]["startMs"] + spans[-1]["durationMs"])
        row["sectionKey"] = key
        row["section"] = spans[0]["section"]
        sections.append(row)
    global_row = lens.aggregate(windows, 0, trace["summary"]["durationMs"])
    seam_meter = renderer.legato.SeamMeter(samples.astype(np.float64) / 32768.0)
    seams = seam_meter.measure([bar["startMs"] for bar in bars[1:]])

    centroids = [row["centroidOct"] for row in bar_rows if row["centroidOct"] is not None]
    offices = [row["office"] for row in bar_rows if row["centroidOct"] is not None]
    lead = [row["leadPcSum"] for row in bar_rows if row["centroidOct"] is not None]
    container = [row["containerPcSum"] for row in bar_rows if row["centroidOct"] is not None]
    lead_c = centered_by_office(lead, offices)
    container_c = centered_by_office(container, offices)
    centroid_c = centered_by_office(centroids, offices)
    return {
        "label": label,
        "tracePath": f"task-d/traces/{label}.jsonl",
        "traceSha256": trace_hash,
        "wavPath": f"task-d/renders/{label}.wav",
        "wavSha256": sha256_file(wav_path),
        "midiPath": f"task-d/renders/{label}.mid",
        "midiSha256": sha256_file(midi_path),
        "samples": result["samples"],
        "durationMs": result["durationMs"],
        "barCount": result["barCount"],
        "reRenderMatch": result["reRenderMatch"],
        "clippedSamples": result["clippedSamples"],
        "nonFiniteSamples": result["nonFiniteSamples"],
        "outOfMaskNotes": result["midiAudit"]["outOfMaskNotes"],
        "padContainerMatch": result["midiAudit"]["padContainerMatch"],
        "leadSequenceMatch": result["midiAudit"]["leadSequenceMatch"],
        "maxAbsLast32": int(np.max(np.abs(samples[-32:]))),
        "seamMetric": {"boundaries": seams["boundaries"],
                       "medianDepthDb": seams["medianDepthDb"],
                       "maxDepthDb": seams["maxDepthDb"]},
        "global": global_row,
        "sections": sections,
        "bars": bar_rows,
        "correlations": {
            "leadRaw": pearson(centroids, lead),
            "containerRaw": pearson(centroids, container),
            "leadDeconfounded": pearson(centroid_c, lead_c),
            "containerDeconfounded": pearson(centroid_c, container_c),
        },
    }


def main():
    TASK_D.mkdir(parents=True, exist_ok=True)
    RENDERS.mkdir(parents=True, exist_ok=True)
    TRACES.mkdir(parents=True, exist_ok=True)
    predecl = json.loads(PREDECL.read_text(encoding="utf-8"))
    tc_receipt = json.loads(TC_RECEIPT.read_text(encoding="utf-8"))
    tb = load_module("mvp7_td_tb", SCRATCH / "task-b/mvp7_task_b.py")
    form_engine_module, engine, planner, seed, governed = tb.build_context()
    ctx = {"tb": tb, "form_engine_module": form_engine_module,
           "engine": engine, "planner": planner}
    accepted = [row for row in tc_receipt["runs"] if row["compiled"]]
    renders = []
    for row in accepted:
        trace = json.loads((TASK_C / (row["label"] + "_trace.json")).read_text(encoding="utf-8"))
        renders.append(render_plan(tb, ctx, row["label"], trace))

    control_lens, control_samples, control_windows = tb.analyze(CONTROL_WAV)
    control_global = control_lens.aggregate(control_windows, 0, 122700)
    distances = []
    for row in renders:
        delta_c = row["global"]["centroidOct"] - control_global["centroidOct"]
        delta_s = row["global"]["spreadOct"] - control_global["spreadOct"]
        distances.append({
            "label": row["label"],
            "deltaCentroidOct": delta_c,
            "deltaSpreadOct": delta_s,
            "distanceOct": math.sqrt(delta_c ** 2 + delta_s ** 2),
        })

    # Blind manifest: pair each render with the control, order by hash parity.
    pairs = []
    for row in renders:
        key = f"{row['wavSha256']}:{CONTROL_SHA}"
        digest = hashlib.sha256(key.encode()).hexdigest()
        order = ["A_control", "B_llm"] if int(digest[-1], 16) % 2 == 0 else ["A_llm", "B_control"]
        pairs.append({
            "pairId": digest[:12],
            "llmLabel": row["label"],
            "controlWav": "tools/governed-loop/mvp6_3/task-d/renders/piece_a_far_shore_faded.wav",
            "llmWav": row["wavPath"],
            "playOrder": order,
            "q9": {"preferred": None, "distinct": None, "notes": None},
        })
    blind = {
        "schemaVersion": "governed-loop.mvp7-blind-ab.v1",
        "status": "PENDING_HUMAN",
        "listener": "Erick (primary)",
        "listener2": None,
        "questions": {f"Q{i}": None for i in range(1, 10)},
        "q9Question": "Which render better realizes the stated prompt, and is the divergence preferred over the planner default?",
        "pairs": pairs,
        "note": "The agent must not author listener verdicts.",
    }
    (TASK_D / "blind_manifest.json").write_text(
        json.dumps(blind, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    acoustic = []
    for row in renders:
        corr = row["correlations"]
        acoustic.append({
            "label": row["label"],
            "durationMs": row["durationMs"],
            "bars": row["barCount"],
            "seams": row["seamMetric"],
            "seamGatePass": (row["seamMetric"]["medianDepthDb"] < 6.0
                             and row["seamMetric"]["maxDepthDb"] < 12.0),
            "maxAbsLast32": row["maxAbsLast32"],
            "endPass": row["maxAbsLast32"] < 10,
            "reRenderMatch": row["reRenderMatch"],
            "clippedSamples": row["clippedSamples"],
            "nonFiniteSamples": row["nonFiniteSamples"],
            "outOfMaskNotes": row["outOfMaskNotes"],
            "padContainerMatch": row["padContainerMatch"],
            "leadSequenceMatch": row["leadSequenceMatch"],
            "leadTracks": (corr["leadDeconfounded"] is not None
                           and corr["containerDeconfounded"] is not None
                           and corr["leadDeconfounded"] > corr["containerDeconfounded"]),
            "correlations": corr,
        })

    fm = tc_receipt["failureModes"]
    divergence = tc_receipt["divergence"]
    c1_first = tc_receipt["legality"]["firstPassRate"]["C1"]
    c1_compile = tc_receipt["legality"]["compileRate"]["C1"]
    c2_first = tc_receipt["legality"]["firstPassRate"]["C2"]
    deterministic_outcome_1 = (divergence["meanScore"] is not None
                               and divergence["meanScore"] >= 0.25 and c1_first >= 0.90
                               and not fm["FM4_VOCABULARY_DRIFT"])
    deterministic_outcome_3 = (divergence["meanScore"] is not None
                               and divergence["meanScore"] < 0.10)
    if deterministic_outcome_1:
        provisional = "OUTCOME_1_INTENTION_PROPOSER_PENDING_EAR"
    elif deterministic_outcome_3:
        provisional = "OUTCOME_3_EXPLAINER_ANNOTATOR_ONLY"
    elif c1_first < 0.90 and c2_first is not None and c2_first >= 0.90:
        provisional = "CONDITIONAL_OUTCOME_2_GUEST_CURATOR_MENU_BOUND_PENDING_EAR"
    else:
        provisional = "CONDITIONAL_PENDING_EAR"
    verdict = {
        "divergencePass": divergence["meanScore"] is not None and divergence["meanScore"] >= 0.25,
        "divergenceScore": divergence["meanScore"],
        "openArcDivergence": divergence.get("unconstrainedOpenArcOnly"),
        "c1FirstPassLegality": c1_first,
        "c1CompileLegality": c1_compile,
        "c2FirstPassLegality": c2_first,
        "fm4Clean": not fm["FM4_VOCABULARY_DRIFT"],
        "earGate": "PENDING_HUMAN",
        "outcome1Deterministic": deterministic_outcome_1,
        "outcome3Deterministic": deterministic_outcome_3,
        "provisionalOutcome": provisional,
        "rule": predecl["outcomes"],
    }

    receipt = {
        "schemaVersion": "governed-loop.mvp7-task-d.v1",
        "directive": "MVP7-INTENTION-DIR-1",
        "task": "MVP7-TD",
        "status": "COMPLETE",
        "guardFlags": GUARD,
        "predeclarationSha256": sha256_file(PREDECL),
        "taskCReceiptSha256": sha256_file(TC_RECEIPT),
        "control": {"path": str(CONTROL_WAV.relative_to(REPO)),
                    "sha256": sha256_file(CONTROL_WAV),
                    "global": control_global},
        "renders": renders,
        "objectiveDistances": distances,
        "blindAB": {"path": "task-d/blind_manifest.json",
                    "sha256": sha256_file(TASK_D / "blind_manifest.json"),
                    "status": "PENDING_HUMAN", "pairs": len(pairs)},
        "takeaways": {
            "1_divergence": divergence,
            "2_earAB": {"status": "PENDING_HUMAN",
                        "objectiveDistances": distances,
                        "blindManifest": "task-d/blind_manifest.json"},
            "3_legality": tc_receipt["legality"],
            "4_judgmentMap": tc_receipt["judgmentMap"],
            "5_failuresAndBijection": {"failureModes": fm, "acoustic": acoustic},
            "6_costAndSafety": {
                "cost": tc_receipt["cost"],
                "plannerCost": {"llmCalls": 0, "tokens": 0, "usd": 0.0},
                "safety": {
                    "gateModifications": 0,
                    "outOfMaskPitches": sum(row["outOfMaskNotes"] for row in renders),
                    "boundaryDwells": sum(
                        1 for row in renders for bar in row["bars"]
                        if planner.role.get(int(bar["node"].split("@")[0])) == "boundary"),
                    "twoPassIdentical": all(row["reRenderMatch"] for row in renders),
                    "clippedSamples": sum(row["clippedSamples"] for row in renders),
                    "nonFiniteSamples": sum(row["nonFiniteSamples"] for row in renders),
                },
            },
        },
        "verdict": verdict,
        "llmCalls": tc_receipt["cost"]["calls"],
        "stopRules": [],
    }
    RECEIPT.write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps({
        "status": "COMPLETE",
        "renders": len(renders),
        "seamGatePass": sum(1 for row in acoustic if row["seamGatePass"]),
        "endPass": sum(1 for row in acoustic if row["endPass"]),
        "leadTracks": sum(1 for row in acoustic if row["leadTracks"]),
        "outcome": verdict,
        "distanceRange": [min(row["distanceOct"] for row in distances),
                          max(row["distanceOct"] for row in distances)],
        "ear": "PENDING_HUMAN",
    }, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
