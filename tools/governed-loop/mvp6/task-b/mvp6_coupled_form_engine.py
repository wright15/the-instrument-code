#!/usr/bin/env python3
"""MVP6-DIR-1 coupled form engine: variable-K bars, carried Q, boundary rest,
and the Law-5 terminal-bar convention.

Read-only against the repository. Symbolic output is int/str/bool only.
"""
import importlib.util
import json
import sys
from pathlib import Path

REPO = Path("/home/erick/projects/integrated-release")
SCRATCH = Path("/home/erick/workspace/scratch-governed-loop-run/mvp6")
ITINERARY_PATH = SCRATCH / "task-a" / "compiled_itinerary.json"

K_TRANSIT = 5
K_DWELL = 12
MICRO_STEP_MS = 300

GUARD = {
    "causationClaim": False,
    "physicalQuantityClaim": False,
    "tierClassifier": False,
    "globalCHNull": True,
    "gov517_correspondence_claimed": False,
    "still_set_label": "still_set",
    "layer": "SPEC-001 \u00a71.3 overlay dynamics",
}

BAND = {"Saturn": -12, "Moon": 0, "Mercury": 0, "Jupiter": 0,
        "Sun": 12, "Mars": 12, "Venus": 12}


def load_module(name, path):
    spec = importlib.util.spec_from_file_location(name, str(path))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class FormEngine:
    def __init__(self):
        sys.path.insert(0, str(REPO / "tools/governed-loop/mvp4/task-b"))
        sys.path.insert(0, str(REPO / "tools/governed-loop/mvp5/task-a"))
        self.ce = load_module(
            "mvp6_engine_coupled",
            REPO / "tools/governed-loop/mvp5/task-a/mvp5_coupled_engine.py")
        self.engine = self.ce.CoupledEngine()
        self.planner = self.engine.planner
        self.itinerary = json.loads(ITINERARY_PATH.read_text(encoding="utf-8"))
        self.still_set = tuple(self.engine.still_set)

    # ---- bar construction -------------------------------------------------
    def micro_bar(self, node, q_in, k):
        if self.engine.is_boundary(node):
            raise RuntimeError(f"boundary bar forbidden at {node}")
        q_state = int(q_in)
        steps = []
        for sub in range(int(k)):
            z_step = 0 if sub == 0 else 1
            record = self.engine.project(q_state, z_step, node)
            record["sub"] = sub
            steps.append(record)
            q_state = record["nextQ"]
        return steps, q_state

    def build_trace(self, name, bars, rests, description, macro_events=None):
        trace_bars = []
        micro = []
        timeline_ms = 0
        q_carried = 0
        rest_by_bar = {int(rest["afterBar"]): rest for rest in rests}
        for index, spec in enumerate(bars, start=1):
            node = spec["node"]
            k = int(spec.get("k", K_TRANSIT))
            steps, q_out = self.micro_bar(node, q_carried, k)
            office = self.engine.office_of(node)
            mask = int(node.split("@")[0])
            phase = int(node.split("@")[1])
            bar = {
                "bar": index,
                "section": spec.get("section"),
                "sectionKey": spec.get("sectionKey"),
                "role": spec.get("role"),
                "node": node,
                "mask": mask,
                "phase": phase,
                "office": office,
                "registerOffset": BAND.get(office, 0),
                "startMs": timeline_ms,
                "durationMs": k * MICRO_STEP_MS,
                "k": k,
                "pitchClasses": self.engine.pitch_classes(node),
                "qStateIn": q_carried,
                "qStateOut": q_out,
            }
            trace_bars.append(bar)
            for step in steps:
                record = dict(step)
                record["bar"] = index
                record["barStartMs"] = timeline_ms
                record["barDurationMs"] = bar["durationMs"]
                record["microStepMs"] = MICRO_STEP_MS
                record["section"] = spec.get("section")
                record["sectionKey"] = spec.get("sectionKey")
                record["role"] = spec.get("role")
                record["registerOffset"] = bar["registerOffset"]
                micro.append(record)
            timeline_ms += bar["durationMs"]
            q_carried = self.engine.advance(q_out)
            if index in rest_by_bar:
                rest = rest_by_bar[index]
                trace_bars[-1]["restAfter"] = {
                    "source": rest["source"],
                    "target": rest["target"],
                    "durationMs": int(rest["durationMs"]),
                }
                timeline_ms += int(rest["durationMs"])

        trace_rests = []
        for rest in rests:
            start = None
            for bar in trace_bars:
                if bar["bar"] == int(rest["afterBar"]):
                    start = bar["startMs"] + bar["durationMs"]
                    break
            trace_rests.append({
                "recordType": "rest",
                "kind": "boundary-transit",
                "afterBar": int(rest["afterBar"]),
                "startMs": start,
                "source": rest["source"],
                "boundary": rest.get("boundary"),
                "target": rest["target"],
                "durationMs": int(rest["durationMs"]),
                "oscillators": 0,
            })

        trace = {
            "schemaVersion": "governed-loop.mvp6-coupled-form-trace.v1",
            "name": name,
            "description": description,
            "mode": "q_carried",
            "layer": GUARD["layer"],
            "gov517_correspondence_claimed": False,
            "still_set_label": GUARD["still_set_label"],
            "microStepMs": MICRO_STEP_MS,
            "terminalVoiced": True,
            "bars": trace_bars,
            "rests": trace_rests,
            "microSteps": micro,
            "macroEvents": list(macro_events or []),
        }
        trace["summary"] = self.summarize(trace)
        return trace

    # ---- diagnostics ------------------------------------------------------
    def summarize(self, trace):
        micro = trace["microSteps"]
        emitted = [step["emittedPc"] for step in micro]
        intervals = {}
        for left, right in zip(emitted, emitted[1:]):
            delta = (right - left) % 12
            intervals[str(delta)] = intervals.get(str(delta), 0) + 1
        modes = {}
        for step in micro:
            modes[step["projectionMode"]] = modes.get(step["projectionMode"], 0) + 1
        windows = [tuple(emitted[i:i + 5]) for i in range(0, max(0, len(emitted) - 4), 5)]
        q_sequence = [step["nextQ"] for step in micro]
        out_of_mask = sum(1 for step in micro if step["emittedPc"] not in step["pitchClasses"])
        still_set_entries = sum(1 for q in q_sequence if q in self.still_set)
        boundary_bars = sum(1 for bar in trace["bars"]
                            if self.engine.is_boundary(bar["node"]))
        return {
            "bars": len(trace["bars"]),
            "microSteps": len(micro),
            "rests": len(trace["rests"]),
            "durationMs": max([bar["startMs"] + bar["durationMs"] for bar in trace["bars"]]
                              + [rest["startMs"] + rest["durationMs"] for rest in trace["rests"]]),
            "distinctMacroStates": len({bar["node"] for bar in trace["bars"]}),
            "distinctOffices": len({bar["office"] for bar in trace["bars"] if bar["office"]}),
            "distinctPhases": len({bar["phase"] for bar in trace["bars"]}),
            "distinctQStates": len(set(q_sequence)),
            "qStatesVisited": sorted(set(q_sequence)),
            "stillSetEntries": still_set_entries,
            "emittedPitchClasses": len(set(emitted)),
            "emittedPcs": sorted(set(emitted)),
            "intervalHistogram": dict(sorted(intervals.items(), key=lambda kv: int(kv[0]))),
            "projectionModes": dict(sorted(modes.items())),
            "directOrbitCount": modes.get("direct_orbit_pc", 0),
            "degreeModuloCount": modes.get("degree_modulo_7", 0),
            "ngram5Total": len(windows),
            "ngram5Distinct": len(set(windows)),
            "ngram5Repeats": len(windows) - len(set(windows)),
            "outOfMaskPitches": out_of_mask,
            "boundaryDwell": boundary_bars,
            "llmCalls": 0,
            "floatValues": 0,
        }

    def section_diagnostics(self, trace):
        sections = {}
        for bar in trace["bars"]:
            key = bar["sectionKey"]
            row = sections.setdefault(key, {
                "section": bar["section"],
                "bars": 0,
                "microSteps": 0,
                "leadPcSum": 0,
                "containerPcSum": 0,
                "registerOffsetSum": 0,
                "directCount": 0,
                "fallbackCount": 0,
                "distinctEmitted": set(),
                "qStates": set(),
                "nodes": [],
                "bandMismatch": 0,
            })
            row["bars"] += 1
            row["containerPcSum"] += sum(bar["pitchClasses"])
            row["registerOffsetSum"] += bar["registerOffset"]
            row["nodes"].append(bar["node"])
        for step in trace["microSteps"]:
            key = step["sectionKey"]
            row = sections[key]
            row["microSteps"] += 1
            row["leadPcSum"] += step["emittedPc"]
            row["distinctEmitted"].add(step["emittedPc"])
            row["qStates"].add(step["nextQ"])
            if step["projectionMode"] == "direct_orbit_pc":
                row["directCount"] += 1
            else:
                row["fallbackCount"] += 1
        rows = []
        for key in ["home_mirror", "departure", "first_dwell", "climax",
                    "shore", "return", "homecoming"]:
            row = sections[key]
            rows.append({
                "sectionKey": key,
                "section": row["section"],
                "bars": row["bars"],
                "microSteps": row["microSteps"],
                "leadPcSum": row["leadPcSum"],
                "containerPcSum": row["containerPcSum"],
                "registerOffsetSum": row["registerOffsetSum"],
                "distinctEmitted": len(row["distinctEmitted"]),
                "distinctQStates": len(row["qStates"]),
                "directCount": row["directCount"],
                "fallbackCount": row["fallbackCount"],
                "nodes": row["nodes"],
            })
        return rows

    def bar_diagnostics(self, trace):
        rows = []
        for bar in trace["bars"]:
            steps = [s for s in trace["microSteps"] if s["bar"] == bar["bar"]]
            rows.append({
                "bar": bar["bar"],
                "section": bar["section"],
                "sectionKey": bar["sectionKey"],
                "node": bar["node"],
                "k": bar["k"],
                "office": bar["office"],
                "phase": bar["phase"],
                "registerOffset": bar["registerOffset"],
                "startMs": bar["startMs"],
                "durationMs": bar["durationMs"],
                "containerPcSum": sum(bar["pitchClasses"]),
                "leadPcSum": sum(step["emittedPc"] for step in steps),
                "distinctEmitted": len({step["emittedPc"] for step in steps}),
                "distinctQ": len({step["nextQ"] for step in steps}),
                "directCount": sum(1 for s in steps if s["projectionMode"] == "direct_orbit_pc"),
                "fallbackCount": sum(1 for s in steps if s["projectionMode"] == "degree_modulo_7"),
            })
        return rows

    def write_trace(self, path, trace):
        import hashlib
        lines = []
        for event in trace["macroEvents"]:
            entry = {"recordType": "macro", "trace": trace["name"]}
            entry.update(event)
            lines.append(entry)
        for step in trace["microSteps"]:
            entry = {"recordType": "micro", "trace": trace["name"]}
            entry.update(step)
            lines.append(entry)
        for rest in trace["rests"]:
            entry = dict(rest)
            entry["trace"] = trace["name"]
            lines.append(entry)
        path.write_text("".join(json.dumps(line, sort_keys=True) + "\n"
                                for line in lines), encoding="utf-8")
        return hashlib.sha256(path.read_bytes()).hexdigest()
