#!/usr/bin/env python3
"""MVP8-DIR-1 Task B: pentatonic-aware initiation bets B1-B4.

Scratch-only. Reads the repository read-only; writes only under the MVP-8
scratch realm. Acoustic measurements are the only float-bearing block.
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

TASK_B = common.SCRATCH / "task-b"
TRACES = TASK_B / "traces"
RENDERS = TASK_B / "renders"
RECEIPT = TASK_B / "mvp8_task_b_receipt.json"
FAR_SHORE_ITINERARY = Path("/home/erick/workspace/scratch-governed-loop-run/mvp6/task-a/compiled_itinerary.json")
MVP7_PREDECL = Path("/home/erick/workspace/scratch-governed-loop-run/mvp7_intention/task-0/mvp7_predeclared_bets_and_schema.json")
FADE_SAMPLES = 2205


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


def render_and_measure(engine, label, trace, renderer, palettes, office_lookup, lens):
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
        row.update({key: bar[key] for key in ("bar", "node", "office", "phase", "sectionKey")})
        steps = [step for step in trace["microSteps"] if step["bar"] == bar["bar"]]
        row["leadPcSum"] = sum(step["emittedPc"] for step in steps)
        row["containerPcSum"] = sum(bar["pitchClasses"])
        bar_rows.append(row)
    sections = []
    for key in sorted({bar["sectionKey"] for bar in trace["bars"] if bar["sectionKey"]},
                      key=lambda key: next(bar["section"] for bar in trace["bars"]
                                           if bar["sectionKey"] == key)):
        spans = [bar for bar in trace["bars"] if bar["sectionKey"] == key]
        row = lens.aggregate(windows, spans[0]["startMs"],
                             spans[-1]["startMs"] + spans[-1]["durationMs"])
        row["sectionKey"] = key
        row["section"] = spans[0]["section"]
        sections.append(row)
    global_row = lens.aggregate(windows, 0, trace["summary"]["durationMs"])
    seam_meter = renderer.legato.SeamMeter(samples.astype(np.float64))
    seams = seam_meter.measure([bar["startMs"] for bar in trace["bars"][1:]])

    valid = [row for row in bar_rows if row["centroidOct"] is not None]
    centroids = [row["centroidOct"] for row in valid]
    offices = [row["office"] for row in valid]
    lead = [row["leadPcSum"] for row in valid]
    container = [row["containerPcSum"] for row in valid]
    return {
        "label": label,
        "tracePath": f"task-b/traces/{label}.jsonl",
        "traceSha256": trace_hash,
        "wavPath": f"task-b/renders/{label}.wav",
        "wavSha256": common.sha256_file(wav_path),
        "midiPath": f"task-b/renders/{label}.mid",
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
        "sections": sections,
        "correlations": {
            "leadRaw": pearson(centroids, lead),
            "containerRaw": pearson(centroids, container),
            "leadDeconfounded": pearson(centered_by_office(centroids, offices),
                                        centered_by_office(lead, offices)),
            "containerDeconfounded": pearson(centered_by_office(centroids, offices),
                                             centered_by_office(container, offices)),
        },
        "summary": trace["summary"],
    }


def far_shore_bars():
    itinerary = json.loads(FAR_SHORE_ITINERARY.read_text(encoding="utf-8"))
    rest_by_bar = {int(rest["afterBar"]): rest for rest in itinerary.get("rests", [])}
    bars = []
    for index, spec in enumerate(itinerary["bars"], start=1):
        row = {
            "node": spec["node"],
            "k": int(spec["k"]),
            "section": spec.get("section"),
            "sectionKey": spec.get("sectionKey"),
            "role": spec.get("role"),
        }
        if index in rest_by_bar:
            rest = rest_by_bar[index]
            row["restAfter"] = {
                "source": rest.get("source", spec["node"]),
                "target": rest.get("target"),
                "boundary": rest.get("boundary"),
                "durationMs": int(rest.get("durationMs", 300)),
            }
        bars.append(row)
    return bars


def run_b1(engine):
    total = 0
    bad = 0
    for node in engine.nodes:
        focal = engine.resolve_focal(node, q_in=0, role="dwell")
        for q in range(16):
            for z in range(12):
                result = engine.project(q, z, node, focal, position="orbit")
                total += 1
                if not result["inMask"]:
                    bad += 1
    still_total = 0
    still_leaks = 0
    for q in common.STILL_SET:
        for z in range(1, 12):
            for node in engine.nodes:
                result = engine.base_project(q, z, node)
                still_total += 1
                if (result["nextQ"] != q or not result["inMask"]
                        or result["emittedPc"] != engine.parse(node)[1]):
                    still_leaks += 1
    return {
        "evaluations": total,
        "outOfMaskPitches": bad,
        "stillSetEvaluations": still_total,
        "stillSetLeaks": still_leaks,
        "pass": bad == 0 and still_leaks == 0,
    }


def run_b2(engine):
    node = "2741@0"
    focal = engine.resolve_focal(node, q_in=0, role="dwell")
    baseline = sum(1 for q in range(16) for z in range(12)
                   if engine.base_project(q, z, node)["emittedPc"] in focal["pitchClasses"])
    governed = 0
    for q in range(16):
        for z in range(12):
            result = engine.project(q, z, node, focal, position="initiation")
            governed += 1 if result["focalHit"] else 0
    structural_total = 0
    structural_hits = 0
    for q in range(16):
        for station in range(5):
            if q in common.TRAVERSAL_SET:
                z = (station - common.TRAVERSAL_CYCLE.index(q)) % 12
            else:
                z = station
            result = engine.project(q, z, node, focal, position="orbit")
            structural_total += 1
            structural_hits += 1 if result["focalHit"] else 0
    steps, _, _ = engine.micro_bar(node, 0, 12, role="dwell")
    modal = sum(1 for step in steps if step["governanceAction"] == "modal_color_pass")
    return {
        "baselineNumerator": baseline,
        "baselineDenominator": 192,
        "governedInitiationNumerator": governed,
        "governedInitiationDenominator": 192,
        "structuralNumerator": structural_hits,
        "structuralDenominator": structural_total,
        "tailModalColorPasses": modal,
        "pass": (baseline == 144 and governed >= 160
                 and structural_hits == structural_total and structural_total == 80
                 and modal >= 2),
    }


def run_b3(engine, predecl):
    bad_focal = []
    bad_emission_orbit = 0
    bad_emission_init = 0
    checks = 0
    for mask in predecl["b3SampleMasks"]:
        f0 = engine.resolve_focal(f"{mask}@0", q_in=0, role="dwell")
        for phase in range(12):
            fp = engine.resolve_focal(f"{mask}@{phase}", q_in=0, role="dwell")
            transposed = sorted((pc + phase) % 12 for pc in f0["pitchClasses"])
            if (fp["baseSubnodeId"] != f0["baseSubnodeId"]
                    or fp["pitchClasses"] != transposed
                    or fp["rootPc"] != (f0["rootPc"] + phase) % 12):
                bad_focal.append({"mask": mask, "phase": phase})
            for q in range(16):
                for z in range(12):
                    a = engine.project(q, z, f"{mask}@0", f0, position="orbit")
                    b = engine.project(q, z, f"{mask}@{phase}", fp, position="orbit")
                    if b["emittedPc"] != (a["emittedPc"] + phase) % 12:
                        bad_emission_orbit += 1
                    c = engine.project(q, z, f"{mask}@0", f0, position="initiation")
                    d = engine.project(q, z, f"{mask}@{phase}", fp, position="initiation")
                    if d["emittedPc"] != (c["emittedPc"] + phase) % 12:
                        bad_emission_init += 1
                    checks += 1
    return {
        "sampleMasks": predecl["b3SampleMasks"],
        "liftedNodes": len(predecl["b3SampleMasks"]) * 12,
        "emissionChecks": checks * 2,
        "badFocalSelections": len(bad_focal),
        "badOrbitEmissions": bad_emission_orbit,
        "badInitiationEmissions": bad_emission_init,
        "pass": not bad_focal and bad_emission_orbit == 0 and bad_emission_init == 0,
    }


def main():
    TASK_B.mkdir(parents=True, exist_ok=True)
    TRACES.mkdir(parents=True, exist_ok=True)
    RENDERS.mkdir(parents=True, exist_ok=True)
    predecl = common.load_predecl()
    engine = PentatonicEngine()

    b1 = run_b1(engine)
    b2 = run_b2(engine)
    b3 = run_b3(engine, predecl)

    renderer = load_module("mvp8_fade_renderer", common.REPO_INPUTS["fade_renderer"])
    palettes = renderer.base.extract_audio_parameters(
        common.REPO / "orrery/src/audio.ts")["offices"]
    office_lookup = {mask: office for mask, office in engine.planner.office.items() if office}
    lens = load_module("mvp8_lens", common.REPO_INPUTS["lens"])

    b4 = {"farShoreGoverned": None, "farShoreUngoverned": None, "cadences": {}}
    far_bars = far_shore_bars()
    far_trace = engine.build_trace("far-shore-pentatonic", far_bars,
                                   "Far Shore itinerary under pentatonic focal initiation")
    b4["farShoreGoverned"] = render_and_measure(
        engine, "far-shore-pentatonic", far_trace, renderer, palettes, office_lookup, lens)
    far_control_trace = engine.build_trace(
        "far-shore-ungoverned-control", far_bars,
        "Far Shore itinerary ungoverned control", focal_mode="none")
    b4["farShoreUngoverned"] = render_and_measure(
        engine, "far-shore-ungoverned-control", far_control_trace,
        renderer, palettes, office_lookup, lens)

    mvp7_tb = load_module("mvp8_mvp7_tb", common.REPO_INPUTS["mvp7_task_b"])
    mvp7_predecl = json.loads(MVP7_PREDECL.read_text(encoding="utf-8"))
    form_engine_module, form_engine, planner, seed, governed = mvp7_tb.build_context()
    for key in ("B1_andalusian", "B2_borrowed_minor"):
        spec = dict(mvp7_predecl["cadences"][key])
        spec["id"] = key.lower().replace("_", "-")
        if key == "B2_borrowed_minor":
            spec["waypoints"][1]["excludePcs"] = [9]
        chosen, diagnostic = mvp7_tb.run_benchmark(
            form_engine_module, form_engine, planner, governed, mvp7_predecl, spec)
        if chosen is None:
            b4["cadences"][key] = {"status": "INFEASIBLE", "diagnostic": diagnostic}
            continue
        events = mvp7_tb.macro_events_for(planner, chosen["bars"])
        trace = engine.build_trace(f"{spec['id']}-pentatonic", chosen["bars"],
                                   f"MVP7 cadence {spec['id']} under focal initiation",
                                   macro_events=events)
        rendered = render_and_measure(
            engine, f"{spec['id']}-pentatonic", trace,
            renderer, palettes, office_lookup, lens)
        rendered["status"] = "COMPLETE"
        b4["cadences"][key] = rendered

    gov = b4["farShoreGoverned"]["correlations"]
    b4_pass = (gov["leadDeconfounded"] is not None
               and gov["containerDeconfounded"] is not None
               and gov["leadDeconfounded"] > gov["containerDeconfounded"])
    cadence_lead_tracks = sum(
        1 for row in b4["cadences"].values()
        if row.get("correlations", {}).get("leadDeconfounded") is not None
        and row["correlations"].get("containerDeconfounded") is not None
        and row["correlations"]["leadDeconfounded"] > row["correlations"]["containerDeconfounded"])
    b4["pass"] = b4_pass
    b4["farShoreRule"] = "leadDeconfounded > containerDeconfounded"
    b4["cadenceLeadTracks"] = cadence_lead_tracks
    b4["l27Baseline"] = "MVP-7 deconfounded r_lead > r_container was 0/9 on waypoint-driven pieces"

    acoustic = {
        "B2Rates": {
            "baselineRate": b2["baselineNumerator"] / b2["baselineDenominator"],
            "governedInitiationRate": (b2["governedInitiationNumerator"]
                                       / b2["governedInitiationDenominator"]),
            "structuralRate": (b2["structuralNumerator"] / b2["structuralDenominator"]
                               if b2["structuralDenominator"] else None),
        },
        "farShoreGoverned": b4["farShoreGoverned"],
        "farShoreUngoverned": b4["farShoreUngoverned"],
        "cadences": b4["cadences"],
    }
    receipt = {
        "schemaVersion": "governed-loop.mvp8-task-b.v1",
        "directive": "MVP8-DIR-1",
        "task": "MVP8-TB",
        "status": "COMPLETE",
        "guardFlags": common.GUARD,
        "predeclarationSha256": common.sha256_file(common.PREDECL_PATH),
        "lookupSha256": common.sha256_file(common.LOOKUP_PATH),
        "B1": b1,
        "B2": b2,
        "B3": b3,
        "B4": b4,
        "acoustic": acoustic,
        "llmCalls": 0,
        "stopRules": [],
    }
    symbolic = {key: value for key, value in receipt.items()
                if key not in ("acoustic", "B4")}
    receipt["floatValuesSymbolic"] = len(common.find_floats(symbolic))
    RECEIPT.write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps({
        "status": "COMPLETE",
        "B1": b1,
        "B2": b2,
        "B3": {"pass": b3["pass"], "badFocal": b3["badFocalSelections"],
               "badOrbit": b3["badOrbitEmissions"], "badInit": b3["badInitiationEmissions"]},
        "B4": {"pass": b4["pass"],
               "farShoreLead": gov["leadDeconfounded"],
               "farShoreContainer": gov["containerDeconfounded"],
               "cadenceLeadTracks": cadence_lead_tracks,
               "farShoreWav": b4["farShoreGoverned"]["wavSha256"]},
        "floatValuesSymbolic": receipt["floatValuesSymbolic"],
    }, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
