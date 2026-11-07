#!/usr/bin/env python3
"""MVP8-DIR-1 pentatonic-aware Q projection engine (scratch).

The engine is a projection-layer successor to CoupledEngine.project() and the
MVP-6 FormEngine. It reads the Task A phase-extended bipartite lookup and adds:

  - Q2 focal resolution (5-35 dwell, native-class zero-5-35 dwell, borrowed
    connector transit, explicit planned overrides);
  - Q3 deterministic three-tier selection (phase-root, traversal head,
    canonical index);
  - Q4 structural-window governance (initiation + orbit positions 0..4 snap;
    tail positions 5..11 pass in-mask modal color);
  - per-micro-step focal receipts.

Repository reads only. No repository writes.
"""
import importlib.util
import json
import sys
from pathlib import Path

sys.path.insert(0, "/home/erick/workspace/scratch-governed-loop-run/mvp8_pentatonic_q")
import mvp8_common as common

K_TRANSIT = 5
K_DWELL = 12
MICRO_STEP_MS = 300
BAND = {"Saturn": -12, "Moon": 0, "Mercury": 0, "Jupiter": 0,
        "Sun": 12, "Mars": 12, "Venus": 12}


def load_engine():
    return PentatonicEngine()


class PentatonicEngine:
    def __init__(self):
        self.quintessence = common.load_quintessence()
        self.q_table = common.q_table(self.quintessence)
        self.lookup = common.load_lookup()
        self.nodes = self.lookup["nodes"]
        self.planner = common.build_planner()
        self.base_pcs = {
            int(key.split("@")[0]): common.parse_node(key)[0]
            for key in []
        }
        self.base_container = {}
        for key, row in self.nodes.items():
            if row["phase"] == 0:
                self.base_container[row["mask"]] = row["pitchClasses"]
        self._focal_cache = {}

    # ---- node helpers -----------------------------------------------------
    @staticmethod
    def parse(node):
        return common.parse_node(node)

    def office(self, node):
        return self.planner.office.get(common.parse_node(node)[0])

    def role(self, node):
        return self.planner.role.get(common.parse_node(node)[0])

    def pitch_classes(self, node):
        return self.nodes[node]["pitchClasses"]

    def advance(self, q_state):
        return self.quintessence.q1(int(q_state))

    # ---- focal resolution -------------------------------------------------
    def _subnode(self, node, base_subnode_id):
        row = self.nodes[node]
        for candidate in row["anchoredSubnodes"]:
            if candidate["baseSubnodeId"] == base_subnode_id:
                return dict(candidate)
        for candidate in row["allSubsets"]:
            if candidate["baseSubnodeId"] == base_subnode_id:
                return dict(candidate)
        return None

    def planned_focal(self, node, base_subnode_id, mode="planned"):
        candidate = self._subnode(node, base_subnode_id)
        if candidate is None:
            common.stop("S-5", f"planned focal {base_subnode_id} not in {node}")
        candidate["selectionMode"] = mode
        return candidate

    def _q3_select(self, candidates, node, q_in, phase, selection_mode):
        if not candidates:
            return None
        phase_matches = [row for row in candidates if row["rootPc"] == phase]
        if phase_matches:
            chosen = min(phase_matches, key=lambda row: row["baseSubnodeId"])
            chosen = dict(chosen)
            chosen["selectionMode"] = selection_mode + "_phase_root"
            return chosen
        if q_in in common.TRAVERSAL_SET:
            station = common.TRAVERSAL_CYCLE.index(q_in)
            head_pc = common.fifth_stack_pc(station, phase)
            head_matches = [row for row in candidates if head_pc in row["pitchClasses"]]
            if head_matches:
                chosen = min(head_matches, key=lambda row: row["baseSubnodeId"])
                chosen = dict(chosen)
                chosen["selectionMode"] = selection_mode + "_head_contained"
                return chosen
        chosen = min(candidates, key=lambda row: row["baseSubnodeId"])
        chosen = dict(chosen)
        chosen["selectionMode"] = selection_mode + "_canonical"
        return chosen

    def _native_candidates(self, node):
        row = self.nodes[node]
        priority = ["5-27", "5-23", "5-25", "5-29", "5-20", "5-Z12", "5-24", "5-34"]
        for set_class in priority:
            matches = [candidate for candidate in row["anchoredSubnodes"]
                       if candidate["setClassId"] == set_class]
            if matches:
                return matches
        return list(row["anchoredSubnodes"])

    def resolve_focal(self, node, q_in=0, role="dwell", prev_focal=None, prev_node=None):
        key = (node, int(q_in), role, prev_focal["subnodeId"] if prev_focal else None,
               prev_node)
        if key in self._focal_cache:
            return dict(self._focal_cache[key])
        row = self.nodes[node]
        container = set(row["pitchClasses"])
        if role == "transit" and prev_focal is not None:
            if set(prev_focal["pitchClasses"]) <= container:
                chosen = dict(prev_focal)
                chosen["selectionMode"] = "borrowed_connector"
                self._focal_cache[key] = chosen
                return dict(chosen)
            if prev_node is not None:
                prev_row = self.nodes[prev_node]
                prev_ids = {sub["baseSubnodeId"] for sub in prev_row["anchoredSubnodes"]}
                shared = [sub for sub in row["anchoredSubnodes"]
                          if sub["baseSubnodeId"] in prev_ids and sub["isBridge"]]
                if shared:
                    chosen = self._q3_select(shared, node, q_in, row["phase"],
                                             "borrowed_bridge")
                    if chosen is not None:
                        self._focal_cache[key] = chosen
                        return dict(chosen)
        five35 = [sub for sub in row["anchoredSubnodes"] if sub["setClassId"] == "5-35"]
        if five35:
            chosen = self._q3_select(five35, node, q_in, row["phase"], "5-35")
            self._focal_cache[key] = chosen
            return dict(chosen)
        native = self._native_candidates(node)
        chosen = self._q3_select(native, node, q_in, row["phase"], "native_class_dwell")
        self._focal_cache[key] = chosen
        return dict(chosen)

    # ---- base projection --------------------------------------------------
    def base_project(self, q_state, z_step, node):
        mask, phase = self.parse(node)
        if not (0 <= int(q_state) < 16):
            common.stop("S-5", f"q_state {q_state}")
        if int(z_step) < 0:
            common.stop("S-5", f"z_step {z_step}")
        next_q = self.q_table[(int(z_step) % 12, int(q_state))]
        container = self.nodes[node]["pitchClasses"]
        container_set = set(container)
        if next_q in common.TRAVERSAL_SET:
            orbit_index = common.TRAVERSAL_CYCLE.index(next_q)
            fifth_pc = common.fifth_stack_pc(orbit_index, phase)
            if fifth_pc in container_set:
                emitted = fifth_pc
                mode = "direct_orbit_pc"
            else:
                emitted = (self.base_container[mask][orbit_index % 7] + phase) % 12
                mode = "degree_modulo_7"
        elif next_q in common.STILL_SET:
            orbit_index = None
            emitted = phase % 12
            mode = "still_set_hold"
        else:
            common.stop("S-5", f"q_power outside substrate: {next_q}")
        return {
            "nextQ": int(next_q),
            "orbitIndex": orbit_index,
            "fifthStackPc": common.fifth_stack_pc(orbit_index, phase)
            if orbit_index is not None else None,
            "emittedPc": int(emitted),
            "projectionMode": mode,
            "inMask": int(emitted) in container_set,
        }

    def _snap_pc(self, emitted, focal_pcs, phase):
        focal = sorted(set(focal_pcs))
        def distance(pc):
            return (common.station_index(pc, phase)
                    - common.station_index(emitted, phase)) % 12
        return min(focal, key=lambda pc: (distance(pc), common.station_index(pc, phase), pc))

    def _initiate_q(self, q_state, z_step, node, focal_pcs):
        focal = set(focal_pcs)
        probe = self.base_project(q_state, z_step, node)
        if probe["emittedPc"] in focal:
            return int(q_state), probe, False
        if q_state in common.TRAVERSAL_SET:
            start = common.TRAVERSAL_CYCLE.index(q_state)
        else:
            start = 0
        for step in range(12):
            candidate = common.TRAVERSAL_CYCLE[(start + step) % 12]
            result = self.base_project(candidate, z_step, node)
            if result["emittedPc"] in focal:
                return int(candidate), result, True
        return int(q_state), probe, False

    # ---- governed projection ---------------------------------------------
    def project(self, q_state, z_step, node, focal=None, position="orbit"):
        requested = int(q_state)
        used = requested
        initiated = False
        if focal is None:
            base = self.base_project(requested, z_step, node)
            emitted = base["emittedPc"]
            action = "ungoverned"
            focal_hit = False
        else:
            focal_pcs = focal["pitchClasses"]
            if position == "initiation":
                used, base, initiated = self._initiate_q(requested, z_step, node, focal_pcs)
            else:
                base = self.base_project(requested, z_step, node)
            emitted = base["emittedPc"]
            orbit_index = base["orbitIndex"]
            if emitted in focal_pcs:
                action = "still_set_hold_focal" if base["projectionMode"] == "still_set_hold" else "direct_focal"
                focal_hit = True
            elif base["projectionMode"] == "still_set_hold":
                action = "still_set_hold_nonfocal"
                focal_hit = False
            elif position == "initiation" and initiated:
                action = "initiated_to_focal"
                focal_hit = True
            elif position == "initiation" and not initiated:
                emitted = self._snap_pc(emitted, focal_pcs, self.parse(node)[1])
                action = "snapped_to_focal"
                focal_hit = True
            elif orbit_index is not None and 0 <= orbit_index <= 4:
                emitted = self._snap_pc(emitted, focal_pcs, self.parse(node)[1])
                action = "snapped_to_focal"
                focal_hit = True
            else:
                action = "modal_color_pass"
                focal_hit = False
        container = set(self.nodes[node]["pitchClasses"])
        return {
            "node": node,
            "mask": self.parse(node)[0],
            "phase": self.parse(node)[1],
            "qStateIn": requested,
            "qStateUsed": used,
            "zStep": int(z_step),
            "nextQ": int(base["nextQ"]),
            "orbitIndex": base["orbitIndex"],
            "fifthStackPc": base["fifthStackPc"],
            "emittedPc": int(emitted),
            "moduleEmittedPc": int(base["emittedPc"]),
            "projectionMode": base["projectionMode"],
            "governanceAction": action,
            "focalHit": bool(focal_hit),
            "inMask": int(emitted) in container,
            "pitchClasses": sorted(container),
            "focalSubnodeId": focal["subnodeId"] if focal else None,
            "focalBaseSubnodeId": focal["baseSubnodeId"] if focal else None,
            "focalSetClassId": focal["setClassId"] if focal else None,
            "focalRootPc": focal["rootPc"] if focal else None,
            "focalPitchClasses": list(focal["pitchClasses"]) if focal else None,
            "focalSelectionMode": focal["selectionMode"] if focal else "NONE",
            "isBridge": bool(focal["isBridge"]) if focal else False,
            "isCornerstone": bool(focal["isCornerstone"]) if focal else False,
            "layer": common.GUARD["layer"],
            "gov517_correspondence_claimed": False,
            "still_set_label": "still_set",
        }

    # ---- micro bars and traces -------------------------------------------
    def micro_bar(self, node, q_in, k, role="transit", prev_focal=None,
                  prev_node=None, focal_override=None, focal_mode="governed"):
        if self.role(node) == "boundary":
            common.stop("S-5", f"boundary bar forbidden at {node}")
        if focal_mode == "none":
            focal = None
        elif focal_override is not None:
            focal = dict(focal_override)
        else:
            focal = self.resolve_focal(node, q_in=q_in, role=role,
                                       prev_focal=prev_focal, prev_node=prev_node)
        q_state = int(q_in)
        steps = []
        for sub in range(int(k)):
            z_step = 0 if sub == 0 else 1
            position = "initiation" if sub == 0 else "orbit"
            record = self.project(q_state, z_step, node, focal, position)
            record["sub"] = sub
            steps.append(record)
            q_state = record["nextQ"]
        return steps, q_state, focal

    def build_trace(self, name, bars, description, macro_events=None, focal_mode="governed"):
        trace_bars = []
        trace_rests = []
        micro = []
        timeline_ms = 0
        q_carried = 0
        prev_focal = None
        prev_node = None
        for index, spec in enumerate(bars, start=1):
            node = spec["node"]
            k = int(spec.get("k", K_TRANSIT))
            role = spec.get("role") or ("dwell" if k >= K_DWELL else "transit")
            override = spec.get("focalOverride")
            steps, q_out, focal = self.micro_bar(
                node, q_carried, k, role=role, prev_focal=prev_focal,
                prev_node=prev_node, focal_override=override, focal_mode=focal_mode)
            office = self.office(node)
            mask, phase = self.parse(node)
            bar = {
                "bar": index,
                "section": spec.get("section"),
                "sectionKey": spec.get("sectionKey"),
                "role": role,
                "node": node,
                "mask": mask,
                "phase": phase,
                "office": office,
                "registerOffset": BAND.get(office, 0),
                "startMs": timeline_ms,
                "durationMs": k * MICRO_STEP_MS,
                "k": k,
                "pitchClasses": self.nodes[node]["pitchClasses"],
                "qStateIn": q_carried,
                "qStateOut": q_out,
                "focalContext": {
                    "subnodeId": focal["subnodeId"] if focal else None,
                    "baseSubnodeId": focal["baseSubnodeId"] if focal else None,
                    "setClassId": focal["setClassId"] if focal else None,
                    "rootPc": focal["rootPc"] if focal else None,
                    "pitchClasses": list(focal["pitchClasses"]) if focal else None,
                    "selectionMode": focal["selectionMode"] if focal else "NONE",
                    "isBridge": bool(focal["isBridge"]) if focal else False,
                    "isCornerstone": bool(focal["isCornerstone"]) if focal else False,
                },
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
                record["role"] = role
                record["registerOffset"] = bar["registerOffset"]
                micro.append(record)
            timeline_ms += bar["durationMs"]
            if spec.get("restAfter"):
                rest = spec["restAfter"]
                trace_rests.append({
                    "recordType": "rest",
                    "kind": "boundary-transit",
                    "afterBar": index,
                    "startMs": timeline_ms,
                    "source": node,
                    "boundary": rest.get("boundary"),
                    "target": rest.get("target"),
                    "durationMs": int(rest.get("durationMs", 300)),
                    "oscillators": 0,
                })
                timeline_ms += int(rest.get("durationMs", 300))
            q_carried = self.advance(q_out)
            prev_focal = focal
            prev_node = node
        trace = {
            "schemaVersion": "governed-loop.mvp8-pentatonic-q-trace.v1",
            "name": name,
            "description": description,
            "mode": "pentatonic_focal_structural_window_snap",
            "layer": common.GUARD["layer"],
            "gov517_correspondence_claimed": False,
            "still_set_label": "still_set",
            "microStepMs": MICRO_STEP_MS,
            "terminalVoiced": True,
            "bars": trace_bars,
            "rests": trace_rests,
            "microSteps": micro,
            "macroEvents": list(macro_events or []),
        }
        trace["summary"] = self.summarize(trace)
        return trace

    def summarize(self, trace):
        micro = trace["microSteps"]
        emitted = [step["emittedPc"] for step in micro]
        focal_hits = sum(1 for step in micro if step["focalHit"])
        structural = [step for step in micro
                      if step["orbitIndex"] is not None and 0 <= step["orbitIndex"] <= 4]
        structural_hits = sum(1 for step in structural if step["focalHit"])
        actions = {}
        for step in micro:
            actions[step["governanceAction"]] = actions.get(step["governanceAction"], 0) + 1
        focal_sequence = []
        for bar in trace["bars"]:
            focal_sequence.append(bar["focalContext"]["subnodeId"])
        switches = sum(1 for left, right in zip(focal_sequence, focal_sequence[1:])
                       if left != right)
        return {
            "bars": len(trace["bars"]),
            "microSteps": len(micro),
            "durationMs": max([bar["startMs"] + bar["durationMs"] for bar in trace["bars"]]
                              + [rest["startMs"] + rest["durationMs"] for rest in trace["rests"]]
                              + [0]),
            "distinctOffices": len({bar["office"] for bar in trace["bars"] if bar["office"]}),
            "distinctPhases": len({bar["phase"] for bar in trace["bars"]}),
            "distinctQStates": len({step["nextQ"] for step in micro}),
            "outOfMaskPitches": sum(1 for step in micro if not step["inMask"]),
            "boundaryDwell": sum(1 for bar in trace["bars"]
                                 if self.role(bar["node"]) == "boundary"),
            "focalHits": focal_hits,
            "focalTotal": len(micro),
            "focalHitRate": focal_hits / len(micro) if micro else None,
            "structuralHits": structural_hits,
            "structuralTotal": len(structural),
            "structuralHitRate": structural_hits / len(structural) if structural else None,
            "initiations": actions.get("initiated_to_focal", 0),
            "snaps": actions.get("snapped_to_focal", 0),
            "modalColorPasses": actions.get("modal_color_pass", 0),
            "stillHolds": actions.get("still_set_hold_focal", 0) + actions.get("still_set_hold_nonfocal", 0),
            "focalSwitches": switches,
            "focalSequence": focal_sequence,
            "governanceActions": dict(sorted(actions.items())),
            "llmCalls": 0,
        }

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
