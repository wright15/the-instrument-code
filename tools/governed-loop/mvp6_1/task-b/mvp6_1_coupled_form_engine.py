#!/usr/bin/env python3
"""MVP6.1 de-loop form engine.

Subclasses the landed MVP-6 engine and changes exactly one law: within each
maximal same-node bar run, the voice carry starts at the canonical carry and
gains one extra Q1 advance between consecutive repeat bars. A parallel
canonical carry advances normally, so every non-repeat bar is byte-identical
to the L23 control.
"""
import sys
from pathlib import Path

REPO = Path("/home/erick/projects/integrated-release")
SCRATCH = Path("/home/erick/workspace/scratch-governed-loop-run/mvp6_1")
sys.path.insert(0, str(REPO / "tools/governed-loop/mvp6/task-b"))
sys.path.insert(0, str(REPO / "tools/governed-loop/mvp5/task-a"))
sys.path.insert(0, str(REPO / "tools/governed-loop/mvp4/task-b"))

from mvp6_coupled_form_engine import FormEngine, GUARD, K_TRANSIT, K_DWELL, MICRO_STEP_MS


class DeloopFormEngine(FormEngine):
    def __init__(self):
        super().__init__()
        import json
        self.itinerary = json.loads(
            (SCRATCH / "task-a" / "mvp6_1_itinerary.json").read_text(encoding="utf-8"))

    def build_trace(self, name, bars, rests, description, macro_events=None):
        trace_bars = []
        micro = []
        timeline_ms = 0
        q_voice = 0
        q_canonical = 0
        rest_by_bar = {int(rest["afterBar"]): rest for rest in rests}
        index = 0
        while index < len(bars):
            node = bars[index]["node"]
            end = index
            while end < len(bars) and bars[end]["node"] == node:
                end += 1
            q_voice = q_canonical
            for position in range(index, end):
                spec = bars[position]
                bar_number = position + 1
                k = int(spec.get("k", K_TRANSIT))
                steps, q_out_voice = self.micro_bar(node, q_voice, k)
                _, q_out_canonical = self.micro_bar(node, q_canonical, k)
                office = self.engine.office_of(node)
                mask = int(node.split("@")[0])
                phase = int(node.split("@")[1])
                bar = {
                    "bar": bar_number,
                    "section": spec.get("section"),
                    "sectionKey": spec.get("sectionKey"),
                    "role": spec.get("role"),
                    "node": node,
                    "mask": mask,
                    "phase": phase,
                    "office": office,
                    "registerOffset": self.register_offset(office),
                    "startMs": timeline_ms,
                    "durationMs": k * MICRO_STEP_MS,
                    "k": k,
                    "pitchClasses": self.engine.pitch_classes(node),
                    "qStateIn": q_voice,
                    "qStateOut": q_out_voice,
                    "qCanonicalIn": q_canonical,
                    "isRepeatBar": position > index,
                }
                trace_bars.append(bar)
                for step in steps:
                    record = dict(step)
                    record["bar"] = bar_number
                    record["barStartMs"] = timeline_ms
                    record["barDurationMs"] = bar["durationMs"]
                    record["microStepMs"] = MICRO_STEP_MS
                    record["section"] = spec.get("section")
                    record["sectionKey"] = spec.get("sectionKey")
                    record["role"] = spec.get("role")
                    record["registerOffset"] = bar["registerOffset"]
                    record["isRepeatBar"] = position > index
                    micro.append(record)
                timeline_ms += bar["durationMs"]
                q_voice = self.engine.advance(q_out_voice)
                q_canonical = self.engine.advance(q_out_canonical)
                if position + 1 < end:
                    q_voice = self.engine.advance(q_voice)
                if bar_number in rest_by_bar:
                    rest = rest_by_bar[bar_number]
                    bar["restAfter"] = {
                        "source": rest["source"],
                        "target": rest["target"],
                        "durationMs": int(rest["durationMs"]),
                    }
                    timeline_ms += int(rest["durationMs"])
            index = end

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
            "mode": "q_carried_run_local_rotation",
            "layer": GUARD["layer"],
            "gov517_correspondence_claimed": False,
            "still_set_label": GUARD["still_set_label"],
            "microStepMs": MICRO_STEP_MS,
            "terminalVoiced": True,
            "carryRule": "run_local_q1_rotation",
            "bars": trace_bars,
            "rests": trace_rests,
            "microSteps": micro,
            "macroEvents": list(macro_events or []),
        }
        trace["summary"] = self.summarize(trace)
        return trace

    @staticmethod
    def register_offset(office):
        from mvp6_coupled_form_engine import BAND
        return BAND.get(office, 0)

    def novelty_report(self, trace):
        by_bar = {}
        for step in trace["microSteps"]:
            by_bar.setdefault(step["bar"], []).append(step)
        for bar in by_bar:
            by_bar[bar].sort(key=lambda step: step["sub"])
        runs = []
        index = 1
        last = max(by_bar)
        while index <= last:
            node = by_bar[index][0]["node"]
            end = index
            while end + 1 <= last and by_bar[end + 1][0]["node"] == node:
                end += 1
            if end > index:
                signatures = {tuple(step["emittedPc"] for step in by_bar[b])
                              for b in range(index, end + 1)}
                deltas = []
                for b in range(index + 1, end + 1):
                    delta = sum(1 for left, right in zip(by_bar[b - 1], by_bar[b])
                                if left["emittedPc"] != right["emittedPc"])
                    deltas.append({"bar": b, "delta": delta})
                runs.append({"node": node, "bars": [index, end],
                             "length": end - index + 1,
                             "distinctSignatures": len(signatures),
                             "deltas": deltas})
            index = end + 1
        return runs
