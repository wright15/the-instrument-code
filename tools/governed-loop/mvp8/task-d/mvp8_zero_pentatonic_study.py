#!/usr/bin/env python3
"""MVP8-DIR-1 Task D: zero-5-35 dwell evidence study.

Three arms on Harmonic Minor 2477@0 (zero 5-35 subsets):
  D1 borrowed_connector (shared bridge subnode carried from 1453@0)
  D2 native_class_dwell (5-27:0)
  D3 naked_fifth_stack (no focal context)

Both an Aeolian -> Harmonic Minor -> Aeolian arc and a pure 2477@0 probe are
rendered under the frozen legato + 50 ms fade law. The ear verdict stays
PENDING_HUMAN.
"""
import importlib.util
import json
import statistics
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, "/home/erick/workspace/scratch-governed-loop-run/mvp8_pentatonic_q")
sys.path.insert(0, "/home/erick/workspace/scratch-governed-loop-run/mvp8_pentatonic_q/task-b")
import mvp8_common as common
from mvp8_pentatonic_q_engine import PentatonicEngine

TASK_D = common.SCRATCH / "task-d"
TRACES = TASK_D / "traces"
RENDERS = TASK_D / "renders"
RECEIPT = TASK_D / "mvp8_task_d_receipt.json"
MANIFEST = TASK_D / "mvp8_ear_manifest.json"
C1_WAV = common.SCRATCH / "task-c/renders/c1-aeolian-harmonic-minor.wav"
C3B_WAV = common.SCRATCH / "task-c/renders/c3b-major-mode-triangle.wav"
FADE_SAMPLES = 2205


def load_module(name, path):
    spec = importlib.util.spec_from_file_location(name, str(path))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def arm_bars(engine, arm, arc=True):
    if arc:
        specs = [
            ("1453@0", 12, "aeolian", "aeolian_departure"),
            ("1453@0", 12, "aeolian", "aeolian_departure"),
            ("2477@0", 12, "harmonic_minor", "hm_dwell_1"),
            ("2477@0", 12, "harmonic_minor", "hm_dwell_1"),
            ("2477@0", 12, "harmonic_minor", "hm_dwell_2"),
            ("2477@0", 12, "harmonic_minor", "hm_dwell_2"),
            ("1453@0", 12, "aeolian", "aeolian_return"),
            ("1453@0", 12, "aeolian", "aeolian_return"),
        ]
    else:
        specs = [("2477@0", 12, "harmonic_minor", "pure_dwell") for _ in range(6)]
    bars = []
    for node, k, section, key in specs:
        row = {"node": node, "k": k, "role": "dwell", "sectionKey": key,
               "section": 1 if key.startswith("aeolian") else 2}
        if arm == "borrowed_connector" and node == "2477@0":
            row["focalOverride"] = engine.planned_focal(node, "5-23:0", "borrowed_connector")
        bars.append(row)
    return bars


def measure_render(engine, label, trace, renderer, palettes, office_lookup, lens):
    trace_path = TRACES / f"{label}.jsonl"
    trace_hash = engine.write_trace(trace_path, trace)
    result = renderer.render_track_faded(
        label, trace_path, palettes, office_lookup,
        {len(trace["bars"])}, FADE_SAMPLES)
    wav_path = RENDERS / f"{label}.wav"
    midi_path = RENDERS / f"{label}.mid"
    wav_path.write_bytes(result["wavBytes"])
    midi_path.write_bytes(result["midiBytes"])
    samples = lens.load_wav(wav_path)
    windows = lens.window_descriptors(samples, np.hanning(lens.FFT_SIZE))
    bar_rows = []
    for bar in trace["bars"]:
        row = lens.aggregate(windows, bar["startMs"], bar["startMs"] + bar["durationMs"])
        steps = [step for step in trace["microSteps"] if step["bar"] == bar["bar"]]
        row.update({
            "bar": bar["bar"], "node": bar["node"], "phase": bar["phase"],
            "sectionKey": bar["sectionKey"],
            "focalSubnode": bar["focalContext"]["subnodeId"],
            "leadPcSum": sum(step["emittedPc"] for step in steps),
            "containerPcSum": sum(bar["pitchClasses"]),
        })
        bar_rows.append(row)
    global_row = lens.aggregate(windows, 0, trace["summary"]["durationMs"])
    seam_meter = renderer.legato.SeamMeter(samples.astype(np.float64))
    seams = seam_meter.measure([bar["startMs"] for bar in trace["bars"][1:]])
    return {
        "label": label,
        "tracePath": f"task-d/traces/{label}.jsonl",
        "traceSha256": trace_hash,
        "wavPath": f"task-d/renders/{label}.wav",
        "wavSha256": common.sha256_file(wav_path),
        "midiPath": f"task-d/renders/{label}.mid",
        "midiSha256": common.sha256_file(midi_path),
        "samples": result["samples"],
        "durationMs": result["durationMs"],
        "barCount": result["barCount"],
        "reRenderMatch": result["reRenderMatch"],
        "clippedSamples": result["clippedSamples"],
        "nonFiniteSamples": result["nonFiniteSamples"],
        "midiAudit": result["midiAudit"],
        "maxAbsLast32": int(np.max(np.abs(samples[-32:]))),
        "seamMetric": {"boundaries": seams["boundaries"],
                       "medianDepthDb": seams["medianDepthDb"],
                       "maxDepthDb": seams["maxDepthDb"]},
        "global": global_row,
        "bars": bar_rows,
        "summary": trace["summary"],
    }


def symbolic_counts(engine, trace, hm_only=True):
    steps = trace["microSteps"]
    if hm_only:
        steps = [step for step in steps if step["node"] == "2477@0"]
    actions = {}
    for step in steps:
        actions[step["governanceAction"]] = actions.get(step["governanceAction"], 0) + 1
    intervals = {}
    for step in steps:
        delta = (step["emittedPc"] - step["phase"]) % 12
        intervals[str(delta)] = intervals.get(str(delta), 0) + 1
    return {
        "microSteps": len(steps),
        "focalHits": sum(1 for step in steps if step["focalHit"]),
        "focalTotal": len(steps),
        "structuralHits": sum(1 for step in steps
                              if step["focalHit"] and step["orbitIndex"] is not None
                              and 0 <= step["orbitIndex"] <= 4),
        "structuralTotal": sum(1 for step in steps
                               if step["orbitIndex"] is not None
                               and 0 <= step["orbitIndex"] <= 4),
        "initiations": actions.get("initiated_to_focal", 0),
        "snaps": actions.get("snapped_to_focal", 0),
        "modalColorPasses": actions.get("modal_color_pass", 0),
        "pc8Count": sum(1 for step in steps if step["emittedPc"] == 8),
        "pc11Count": sum(1 for step in steps if step["emittedPc"] == 11),
        "rubCensus": {
            "minorSecond": intervals.get("1", 0),
            "majorSeventh": intervals.get("11", 0),
            "histogram": dict(sorted(intervals.items(), key=lambda kv: int(kv[0]))),
        },
        "focalSequence": sorted({step["focalSubnodeId"] for step in steps
                                 if step["focalSubnodeId"]}),
        "outOfMask": sum(1 for step in steps if not step["inMask"]),
    }


def main():
    TASK_D.mkdir(parents=True, exist_ok=True)
    TRACES.mkdir(parents=True, exist_ok=True)
    RENDERS.mkdir(parents=True, exist_ok=True)
    predecl = common.load_predecl()
    engine = PentatonicEngine()
    renderer = load_module("mvp8_d_renderer", common.REPO_INPUTS["fade_renderer"])
    palettes = renderer.base.extract_audio_parameters(
        common.REPO / "orrery/src/audio.ts")["offices"]
    office_lookup = {mask: office for mask, office in engine.planner.office.items() if office}
    lens = load_module("mvp8_d_lens", common.REPO_INPUTS["lens"])

    arms = {}
    renders = []
    measured_by_label = {}
    for arm in predecl["taskD"]["arms"]:
        for arc, suffix in ((True, "arc"), (False, "pure")):
            label = f"d-{arm}-{suffix}"
            bars = arm_bars(engine, arm, arc=arc)
            trace = engine.build_trace(
                label, bars,
                f"Task D {arm} {'Aeolian-HM-Aeolian arc' if arc else 'pure HM probe'}",
                focal_mode="none" if arm == "naked_fifth_stack" else "governed")
            measured = measure_render(
                engine, label, trace, renderer, palettes, office_lookup, lens)
            counts = symbolic_counts(engine, trace, hm_only=True)
            measured_by_label[label] = measured
            arms.setdefault(arm, {})[suffix] = {
                "symbolic": counts,
                "renderRef": {
                    "label": measured["label"],
                    "tracePath": measured["tracePath"],
                    "traceSha256": measured["traceSha256"],
                    "wavPath": measured["wavPath"],
                    "wavSha256": measured["wavSha256"],
                    "midiPath": measured["midiPath"],
                    "midiSha256": measured["midiSha256"],
                    "barCount": measured["barCount"],
                    "durationMs": measured["durationMs"],
                    "reRenderMatch": measured["reRenderMatch"],
                    "clippedSamples": measured["clippedSamples"],
                    "nonFiniteSamples": measured["nonFiniteSamples"],
                    "midiAudit": measured["midiAudit"],
                    "maxAbsLast32": measured["maxAbsLast32"],
                },
            }
            renders.append(measured)

    integrity = []
    for arm, probes in arms.items():
        for suffix, row in probes.items():
            render = measured_by_label[row["renderRef"]["label"]]
            integrity.append({
                "arm": arm,
                "probe": suffix,
                "reRenderMatch": render["reRenderMatch"],
                "clippedSamples": render["clippedSamples"],
                "nonFiniteSamples": render["nonFiniteSamples"],
                "outOfMaskNotes": render["midiAudit"]["outOfMaskNotes"],
                "padContainerMatch": render["midiAudit"]["padContainerMatch"],
                "leadSequenceMatch": render["midiAudit"]["leadSequenceMatch"],
                "endPass": render["maxAbsLast32"] < 10,
                "outOfMaskPitches": row["symbolic"]["outOfMask"],
                "pass": (render["reRenderMatch"] and render["clippedSamples"] == 0
                         and render["nonFiniteSamples"] == 0
                         and render["midiAudit"]["outOfMaskNotes"] == 0
                         and render["maxAbsLast32"] < 10
                         and row["symbolic"]["outOfMask"] == 0),
            })
    task_d_pass = all(row["pass"] for row in integrity)

    compare = {}
    for suffix in ("arc", "pure"):
        compare[suffix] = {}
        for arm in predecl["taskD"]["arms"]:
            symbolic = arms[arm][suffix]["symbolic"]
            compare[suffix][arm] = {
                "focalHits": symbolic["focalHits"],
                "focalTotal": symbolic["focalTotal"],
                "modalColorPasses": symbolic["modalColorPasses"],
                "pc8Count": symbolic["pc8Count"],
                "pc11Count": symbolic["pc11Count"],
                "rubCensus": symbolic["rubCensus"],
            }

    manifest = {
        "schemaVersion": "governed-loop.mvp8-ear-manifest.v1",
        "status": "PENDING_HUMAN",
        "listener": "Erick (primary)",
        "listener2": None,
        "questions": {f"Q{i}": None for i in range(1, 10)},
        "q9Question": predecl["taskD"]["earGate"],
        "renders": [
            {"label": row["label"], "wavPath": row["wavPath"],
             "wavSha256": row["wavSha256"]}
            for row in renders
        ] + [
            {"label": "c1-crossing", "wavPath": "task-c/renders/c1-aeolian-harmonic-minor.wav",
             "wavSha256": common.sha256_file(C1_WAV) if C1_WAV.exists() else None},
            {"label": "c3b-triangle", "wavPath": "task-c/renders/c3b-major-mode-triangle.wav",
             "wavSha256": common.sha256_file(C3B_WAV) if C3B_WAV.exists() else None},
        ],
        "note": "The agent must not author or infer listener verdicts.",
    }
    MANIFEST.write_text(json.dumps(manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    receipt = {
        "schemaVersion": "governed-loop.mvp8-task-d.v1",
        "directive": "MVP8-DIR-1",
        "task": "MVP8-TD",
        "status": "COMPLETE",
        "guardFlags": common.GUARD,
        "predeclarationSha256": common.sha256_file(common.PREDECL_PATH),
        "studyNode": "2477@0",
        "arms": arms,
        "compare": compare,
        "integrity": integrity,
        "pass": task_d_pass,
        "earManifest": {
            "path": "task-d/mvp8_ear_manifest.json",
            "sha256": common.sha256_file(MANIFEST),
            "status": "PENDING_HUMAN",
            "signed": False,
        },
        "llmCalls": 0,
        "stopRules": [],
    }
    acoustic = {"renders": renders}
    receipt["acoustic"] = acoustic
    symbolic = {key: value for key, value in receipt.items()
                if key not in ("acoustic",)}
    receipt["floatValuesSymbolic"] = len(common.find_floats(symbolic))
    RECEIPT.write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps({
        "status": "COMPLETE",
        "pass": task_d_pass,
        "integrity": {row["arm"] + "-" + row["probe"]: row["pass"] for row in integrity},
        "compare": compare,
        "earManifest": receipt["earManifest"],
        "floatValuesSymbolic": receipt["floatValuesSymbolic"],
    }, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
