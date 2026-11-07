#!/usr/bin/env python3
"""MVP7-INTENTION-DIR-1 Task B: cadential and modal benchmark suite.

Compiles the predeclared Andalusian and borrowed-minor waypoint suites inside
the governed strong core, verifies every hop with the frozen gate, renders the
controls with the frozen legato+fade law, and measures each section with the
Task A log-spectral lens.

Read-only against the repository; writes only under the MVP-7 scratch realm.
"""
import hashlib
import importlib.util
import json
import math
import os
import statistics
import sys
from collections import deque
from pathlib import Path

import numpy as np

REPO = Path("/home/erick/projects/integrated-release")
SCRATCH = Path("/home/erick/workspace/scratch-governed-loop-run/mvp7_intention")
TASK_B = SCRATCH / "task-b"
RENDERS = TASK_B / "renders"
PREDECL = SCRATCH / "task-0" / "mvp7_predeclared_bets_and_schema.json"
RECEIPT = TASK_B / "mvp7_task_b_receipt.json"

BAND = {"Saturn": -12, "Moon": 0, "Mercury": 0, "Jupiter": 0,
        "Sun": 12, "Mars": 12, "Venus": 12}
GUARD = {
    "causationClaim": False, "physicalQuantityClaim": False,
    "tierClassifier": False, "globalCHNull": True,
    "gov517_correspondence_claimed": False, "still_set_label": "still_set",
    "layer": "SPEC-001 \u00a71.3 overlay dynamics",
}
FADE_SAMPLES = 2205


def stop(rule, detail):
    print(f"STOP: {rule} {detail}")
    sys.exit(2)


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


def build_context():
    sys.path.insert(0, str(REPO / "tools/governed-loop/mvp4/task-b"))
    sys.path.insert(0, str(REPO / "tools/governed-loop/mvp5/task-a"))
    os.environ["GOVERNED_LOOP_SCRATCH"] = str(REPO / "tools/governed-loop")
    os.environ["GOVERNED_LOOP_REPO"] = str(REPO)
    form_engine_module = load_module(
        "mvp7_form_engine",
        REPO / "tools/governed-loop/mvp6/task-b/mvp6_coupled_form_engine.py")
    engine = form_engine_module.FormEngine()
    planner = engine.planner
    seed = "1387@0"
    out_dist = planner.distances(seed)
    reverse = planner.reverse_adjacency()
    in_dist = {seed: 0}
    queue = deque([seed])
    while queue:
        node = queue.popleft()
        for predecessor in reverse[node]:
            if predecessor not in in_dist:
                in_dist[predecessor] = in_dist[node] + 1
                queue.append(predecessor)
    strong = set(out_dist) & set(in_dist)
    governed = sorted(node for node in strong
                      if planner.role.get(int(node.split("@")[0])) != "boundary")
    return form_engine_module, engine, planner, seed, governed


def shortest_path(planner, allowed, source, target):
    if source == target:
        return [source]
    dist = {source: 0}
    previous = {}
    queue = deque([source])
    while queue:
        node = queue.popleft()
        if node == target:
            break
        for neighbor in planner.adj[node]:
            if neighbor in allowed and neighbor not in dist:
                dist[neighbor] = dist[node] + 1
                previous[neighbor] = node
                queue.append(neighbor)
    if target not in dist:
        return None
    path = [target]
    while path[-1] != source:
        path.append(previous[path[-1]])
    return list(reversed(path))


def find_candidates(planner, governed, required, band=None, exclude=()):
    required = set(required)
    rows = []
    for node in governed:
        mask, phase = int(node.split("@")[0]), int(node.split("@")[1])
        pcs = set(planner.pitch_classes(mask, phase))
        if not required <= pcs:
            continue
        if any(pc in pcs for pc in exclude):
            continue
        office = planner.office.get(mask)
        band_value = BAND.get(office, 0)
        if band is not None and band_value != band:
            continue
        rows.append({
            "node": node,
            "mask": mask,
            "phase": phase,
            "office": office,
            "registerOffset": band_value,
            "pitchClasses": sorted(pcs),
            "orbit": planner.orbit_of.get(mask),
            "pcSum": planner.pcsum.get(mask),
            "bandMatch": band is None or band_value == band,
        })
    rows.sort(key=lambda row: (row["phase"] not in (0, 11), row["mask"], row["phase"]))
    return rows


def build_route(planner, allowed, seed, waypoints, candidates, terminal_bars):
    bars = []
    legs = []
    current = seed
    for index, waypoint in enumerate(waypoints):
        candidate = candidates[index]
        path = shortest_path(planner, allowed, current, candidate["node"])
        if path is None:
            return None, {"reason": "DISCONNECTED_TRANSITION",
                          "from": current, "to": candidate["node"]}
        for node in path[1:-1]:
            bars.append({"node": node, "k": 5, "section": index + 1,
                         "sectionKey": waypoint["id"], "role": "transit"})
        dwell = terminal_bars if index == len(waypoints) - 1 else 2
        for _ in range(dwell):
            bars.append({"node": candidate["node"], "k": 12, "section": index + 1,
                         "sectionKey": waypoint["id"], "role": "dwell"})
        legs.append({"waypoint": waypoint["id"], "candidate": candidate,
                     "path": path, "hops": len(path) - 1,
                     "dwellBars": dwell})
        current = candidate["node"]
    return bars, {"legs": legs}


def macro_events_for(planner, bars):
    events = []
    for left, right in zip(bars, bars[1:]):
        if left["node"] == right["node"]:
            continue
        meta = planner.edge_meta(left["node"], right["node"])
        events.append({
            "source": left["node"],
            "target": right["node"],
            "kind": meta["kind"],
            "operator": meta.get("operator"),
            "citation": meta.get("citation"),
            "gateVerdict": meta["verdict"],
            "gateReasons": list(meta["reasons"]),
        })
    return events


def terminal_lead_pcs(trace, bar_count):
    return sorted({step["emittedPc"] for step in trace["microSteps"]
                   if step["bar"] == bar_count})


def analyze(path):
    lens = load_module("mvp7_lens", SCRATCH / "task-a/mvp7_log_spectral_lens.py")
    samples = lens.load_wav(path)
    windows = lens.window_descriptors(samples, np.hanning(lens.FFT_SIZE))
    return lens, samples, windows


def run_benchmark(form_engine_module, engine, planner, governed, predecl, spec):
    waypoints = spec["waypoints"]
    candidate_lists = []
    search = []
    for waypoint in waypoints:
        exclude = tuple(waypoint.get("excludePcs", ()))
        candidates = find_candidates(planner, governed, waypoint["requiredPcs"],
                                     waypoint.get("band"), exclude)
        search.append({
            "waypoint": waypoint["id"],
            "requiredPcs": waypoint["requiredPcs"],
            "band": waypoint.get("band"),
            "excludePcs": list(exclude),
            "candidateCount": len(candidates),
            "candidates": candidates[:12],
        })
        if not candidates:
            return None, {"reason": "EMPTY_CANDIDATE_INTERSECTION",
                          "waypoint": waypoint["id"], "search": search}
        candidate_lists.append(candidates)

    fixed = [row[0] for row in candidate_lists[:-2]]
    w4_options = candidate_lists[-2][:12]
    w5_options = candidate_lists[-1][:12]
    chosen = None
    attempts = 0
    for w4 in w4_options:
        for w5 in w5_options:
            attempts += 1
            trial_lists = fixed + [w4, w5]
            bars, route = build_route(planner, set(governed), "1387@0",
                                      waypoints, trial_lists,
                                      int(spec["terminalDwellBars"]))
            if bars is None:
                continue
            events = macro_events_for(planner, bars)
            if any(event["gateVerdict"] != "ACCEPT" for event in events):
                continue
            trace = form_engine_module.FormEngine.build_trace(
                engine, spec["id"], bars, [],
                f"MVP7 cadence benchmark {spec['id']}", events)
            if trace["summary"]["outOfMaskPitches"] != 0:
                continue
            if trace["summary"]["boundaryDwell"] != 0:
                continue
            final_pcs = terminal_lead_pcs(trace, len(bars))
            required_lead = next((wp.get("requiresLeadPc") for wp in waypoints[::-1]
                                  if wp.get("requiresLeadPc") is not None), None)
            if required_lead is not None and required_lead not in final_pcs:
                continue
            chosen = {"bars": bars, "route": route, "events": events,
                      "trace": trace, "finalPcs": final_pcs,
                      "trialLists": trial_lists, "attempts": attempts}
            break
        if chosen:
            break
    if chosen is None:
        return None, {"reason": "NO_LEGAL_COMPOSITION", "search": search,
                      "attempts": attempts}
    return chosen, {"search": search, "attempts": attempts}


def render_and_measure(spec, chosen):
    renderer = load_module(
        "mvp7_fade_renderer",
        REPO / "tools/governed-loop/mvp6_3/task-b/mvp6_3_fade_renderer.py")
    base = renderer.base
    palettes = base.extract_audio_parameters(REPO / "orrery/src/audio.ts")["offices"]
    planner = chosen["planner"]
    office_lookup = {mask: office for mask, office in planner.office.items() if office}
    trace = chosen["trace"]
    trace_path = RENDERS / f"{spec['id']}.jsonl"
    form_engine_module = chosen["form_engine_module"]
    trace_hash = form_engine_module.FormEngine.write_trace(
        chosen["engine"], trace_path, trace)
    exempt = {len(trace["bars"])}
    result = renderer.render_track_faded(
        spec["id"], trace_path, palettes, office_lookup, exempt, FADE_SAMPLES)
    wav_path = RENDERS / f"{spec['id']}.wav"
    midi_path = RENDERS / f"{spec['id']}.mid"
    wav_path.write_bytes(result["wavBytes"])
    midi_path.write_bytes(result["midiBytes"])

    lens, samples, windows = analyze(wav_path)
    sections = []
    for key in sorted({bar["sectionKey"] for bar in trace["bars"]},
                      key=lambda k: next(b["section"] for b in trace["bars"] if b["sectionKey"] == k)):
        spans = [bar for bar in trace["bars"] if bar["sectionKey"] == key]
        start = spans[0]["startMs"]
        end = spans[-1]["startMs"] + spans[-1]["durationMs"]
        row = lens.aggregate(windows, start, end)
        row["sectionKey"] = key
        row["section"] = spans[0]["section"]
        row["startMs"] = start
        row["endMs"] = end
        sections.append(row)

    seam_meter = renderer.legato.SeamMeter(
        [value / 32768.0 for value in
         np.frombuffer(result["wavBytes"][44:], dtype="<i2").astype(np.int32)])
    boundaries = [bar["startMs"] for bar in trace["bars"][1:]]
    seams = seam_meter.measure(boundaries)
    return {
        "tracePath": f"task-b/renders/{spec['id']}.jsonl",
        "traceSha256": trace_hash,
        "wavPath": f"task-b/renders/{spec['id']}.wav",
        "wavSha256": sha256_file(wav_path),
        "midiPath": f"task-b/renders/{spec['id']}.mid",
        "midiSha256": sha256_file(midi_path),
        "samples": result["samples"],
        "durationMs": result["durationMs"],
        "barCount": result["barCount"],
        "reRenderMatch": result["reRenderMatch"],
        "clippedSamples": result["clippedSamples"],
        "nonFiniteSamples": result["nonFiniteSamples"],
        "midiAudit": result["midiAudit"],
        "maxAbsLast32": int(np.max(np.abs(
            np.frombuffer(result["wavBytes"][44:], dtype="<i2")[-32:]))),
        "sections": sections,
        "seamMetric": {"boundaries": seams["boundaries"],
                       "medianDepthDb": seams["medianDepthDb"],
                       "maxDepthDb": seams["maxDepthDb"]},
    }


def verify_benchmark(spec, chosen, rendered):
    trace = chosen["trace"]
    waypoints = spec["waypoints"]
    legs = chosen["route"]["legs"]
    terminal_pcs = chosen["finalPcs"]
    terminal_check = None
    required_lead = next((wp.get("requiresLeadPc") for wp in waypoints[::-1]
                          if wp.get("requiresLeadPc") is not None), None)
    if required_lead is not None:
        terminal_check = {
            "requiredLeadPc": required_lead,
            "terminalBarPcs": terminal_pcs,
            "pass": required_lead in terminal_pcs,
        }
    support = []
    for waypoint, leg in zip(waypoints, legs):
        candidate = leg["candidate"]
        support.append({
            "waypoint": waypoint["id"],
            "requiredPcs": waypoint["requiredPcs"],
            "candidate": candidate["node"],
            "container": candidate["pitchClasses"],
            "supported": set(waypoint["requiredPcs"]) <= set(candidate["pitchClasses"]),
            "band": waypoint.get("band"),
            "registerOffset": candidate["registerOffset"],
            "bandOk": waypoint.get("band") is None
                      or candidate["registerOffset"] == waypoint.get("band"),
        })
    events = chosen["events"]
    checks = {
        "allWaypointsSupported": all(row["supported"] for row in support),
        "allBandsOk": all(row["bandOk"] for row in support),
        "allHopsGateAccept": all(event["gateVerdict"] == "ACCEPT" for event in events),
        "hopCount": len(events),
        "outOfMaskPitches": trace["summary"]["outOfMaskPitches"],
        "boundaryDwell": trace["summary"]["boundaryDwell"],
        "bars": trace["summary"]["bars"],
        "microSteps": trace["summary"]["microSteps"],
        "distinctOffices": trace["summary"]["distinctOffices"],
        "distinctPhases": trace["summary"]["distinctPhases"],
        "distinctQStates": trace["summary"]["distinctQStates"],
    }
    if terminal_check is not None:
        checks["terminalResolution"] = terminal_check
    checks["pass"] = (checks["allWaypointsSupported"] and checks["allBandsOk"]
                      and checks["allHopsGateAccept"]
                      and checks["outOfMaskPitches"] == 0
                      and checks["boundaryDwell"] == 0
                      and (terminal_check is None or terminal_check["pass"])
                      and rendered["reRenderMatch"]
                      and rendered["clippedSamples"] == 0
                      and rendered["nonFiniteSamples"] == 0
                      and rendered["midiAudit"]["outOfMaskNotes"] == 0)
    return {"support": support, "checks": checks}


def main():
    TASK_B.mkdir(parents=True, exist_ok=True)
    RENDERS.mkdir(parents=True, exist_ok=True)
    predecl = json.loads(PREDECL.read_text(encoding="utf-8"))
    if predecl.get("status") != "locked-before-evaluation":
        stop("S-9", "predeclaration not locked")

    form_engine_module, engine, planner, seed, governed = build_context()
    results = {}
    for key in ("B1_andalusian", "B2_borrowed_minor"):
        spec = dict(predecl["cadences"][key])
        spec["id"] = key.lower().replace("_", "-")
        if key == "B2_borrowed_minor":
            spec["waypoints"][1]["excludePcs"] = [9]
        chosen, diagnostic = run_benchmark(
            form_engine_module, engine, planner, governed, predecl, spec)
        if chosen is None:
            results[key] = {"status": "INFEASIBLE", "diagnostic": diagnostic}
            continue
        chosen["planner"] = planner
        chosen["form_engine_module"] = form_engine_module
        chosen["engine"] = engine
        rendered = render_and_measure(spec, chosen)
        verification = verify_benchmark(spec, chosen, rendered)
        results[key] = {
            "status": "COMPLETE",
            "spec": spec,
            "search": diagnostic["search"],
            "attempts": diagnostic["attempts"],
            "route": chosen["route"],
            "verification": verification,
            "render": rendered,
        }

    receipt = {
        "schemaVersion": "governed-loop.mvp7-task-b.v1",
        "directive": "MVP7-INTENTION-DIR-1",
        "task": "MVP7-TB",
        "status": "COMPLETE",
        "guardFlags": GUARD,
        "predeclarationSha256": sha256_file(PREDECL),
        "strongCore": {"governedNodes": len(governed), "seed": seed},
        "benchmarks": results,
        "llmCalls": 0,
        "stopRules": [],
    }
    RECEIPT.write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    summary = {}
    for key, row in results.items():
        if row["status"] != "COMPLETE":
            summary[key] = row
            continue
        summary[key] = {
            "status": row["status"],
            "pass": row["verification"]["checks"]["pass"],
            "bars": row["verification"]["checks"]["bars"],
            "hops": row["verification"]["checks"]["hopCount"],
            "wavSha256": row["render"]["wavSha256"],
            "sections": [(s["sectionKey"], round(s["centroidOct"], 4), round(s["spreadOct"], 4))
                         for s in row["render"]["sections"]],
            "seams": row["render"]["seamMetric"],
            "terminal": row["verification"]["checks"].get("terminalResolution"),
        }
    print(json.dumps(summary, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
