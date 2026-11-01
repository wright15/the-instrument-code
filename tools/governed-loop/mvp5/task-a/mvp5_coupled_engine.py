#!/usr/bin/env python3
"""MVP5 coupled macro x micro engine.

Scratch-only. Imports the frozen gate (mvp2.py), the native BFS planner
(mvp4_symbolic_planner.py), the intra-node Q projector (mvp4_q_intra_node.py),
and the frozen Quintessence table (src/fivefold/quintessence.py) read-only.

Zero floats in scoring and Q projection. The intra-node emission law keeps the
frozen projector's direct fifth-stack mode and evaluates the container-snapped
fallback on the canonical (untransposed) mask container plus phase, which makes
the overlay exactly phase-equivariant at +7 semitones.
"""
import hashlib
import importlib.util
import json
import os
import sys
from pathlib import Path

sys.dont_write_bytecode = True

REPO = Path(os.environ.get("GOVERNED_LOOP_REPO", "/home/erick/projects/integrated-release"))
SCRATCH = Path(os.environ.get("MVP5_SCRATCH", "/home/erick/workspace/scratch-governed-loop-run/mvp5"))
INPUT_REALM = Path(os.environ.get("GOVERNED_LOOP_SCRATCH", str(REPO / "tools" / "governed-loop")))
os.environ["GOVERNED_LOOP_SCRATCH"] = str(INPUT_REALM)
os.environ["GOVERNED_LOOP_REPO"] = str(REPO)

K_MICRO = 5
MICRO_STEP_MS = 300
MACRO_DWELL_MS = 1500
TRANSIT_REST_MS = 300
VETO_REST_MS = 1500
LAYER = "SPEC-001 §1.3 overlay dynamics"
GOV517_CORRESPONDENCE_CLAIMED = False
STILL_SET_LABEL = "still_set"

Q_RESET = "q_reset"
Q_CARRIED = "q_carried"

DEGREES = {"Saturn": 1, "Jupiter": 2, "Mars": 3, "Sun": 4,
           "Venus": 5, "Mercury": 6, "Moon": 7}
CATEGORY_RANK = {"tier-1": 0, "seamA:R1": 1, "seamA:L1": 2, "seamB:bridge": 3}


def sha256_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def canonical(obj):
    return json.dumps(obj, sort_keys=True, separators=(",", ":"))


def load_module(name, path):
    spec = importlib.util.spec_from_file_location(name, str(path))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def find_floats(value, path="root"):
    found = []
    if isinstance(value, float):
        found.append({"path": path, "value": repr(value)})
    elif isinstance(value, dict):
        for key, child in value.items():
            found.extend(find_floats(child, f"{path}.{key}"))
    elif isinstance(value, list):
        for index, child in enumerate(value):
            found.extend(find_floats(child, f"{path}[{index}]"))
    return found


class CoupledEngine:
    def __init__(self):
        self.planner_module = load_module(
            "mvp5_symbolic_planner", REPO / "tools" / "governed-loop" / "mvp4" / "task-b" / "mvp4_symbolic_planner.py")
        self.q_module = load_module(
            "mvp5_q_intra_node", REPO / "tools" / "governed-loop" / "mvp4" / "task-c" / "mvp4_q_intra_node.py")
        self.planner = self.planner_module.Planner()
        self.world = self.planner.world
        self.card = json.loads(
            (REPO / "tools" / "governed-loop" / "mvp4" / "task-a" / "mvp4_dynamic_chaldean_card.json").read_text(encoding="utf-8"))
        params = self.card["parameters"]
        self.weights = {int(k): int(v) for k, v in params["weights_numerator"].items()}
        self.window = int(params["W"])
        self.alpha = int(params["alpha"])
        self.threshold = int(params["N_threshold"])
        self.beta = int(params["beta"])
        self.w_seam_base = int(params["W_seam_base"])
        self.traversal_cycle = tuple(int(x) for x in self.q_module.TRAVERSAL_CYCLE)
        self.still_set = tuple(int(x) for x in self.q_module.STILL_SET)
        census = json.loads((INPUT_REALM / "census_462.json").read_text(encoding="utf-8"))
        self.census_masks = {int(r["stateId"]): int(r["pitchMask"]) for r in census["records"]}
        self.canonical_pcs = {
            mask: [pc for pc in range(12) if (bits >> pc) & 1]
            for mask, bits in self.census_masks.items()
        }

    # ---- node helpers -----------------------------------------------------
    @staticmethod
    def parse_node(node):
        mask_text, phase_text = str(node).split("@", 1)
        return int(mask_text), int(phase_text)

    @staticmethod
    def node_id(mask, phase):
        return f"{int(mask)}@{int(phase)}"

    def office_of(self, node):
        mask, _ = self.parse_node(node)
        return self.planner.office.get(mask)

    def role_of(self, node):
        mask, _ = self.parse_node(node)
        return self.planner.role.get(mask)

    def is_boundary(self, node):
        return self.role_of(node) == "boundary"

    def pitch_classes(self, node):
        mask, phase = self.parse_node(node)
        return self.planner.pitch_classes(mask, phase)

    # ---- Q overlay --------------------------------------------------------
    def project(self, q_state, z_step, node):
        mask, phase = self.parse_node(node)
        base = self.q_module.project(int(q_state), int(z_step), mask, phase)
        emitted = int(base["emitted_pc"])
        module_emitted = emitted
        if base["projection_mode"] == "degree_modulo_7":
            emitted = (self.canonical_pcs[mask][int(base["orbit_index"]) % 7] + phase) % 12
        container = self.pitch_classes(node)
        if emitted not in container:
            raise RuntimeError(f"micro pitch {emitted} outside container {container} at {node}")
        return {
            "node": node,
            "mask": mask,
            "phase": phase,
            "qStateIn": int(q_state),
            "zStep": int(z_step),
            "nextQ": int(base["next_q"]),
            "orbitIndex": base["orbit_index"],
            "fifthStackPc": base["fifth_stack_pc"],
            "moduleEmittedPc": module_emitted,
            "emittedPc": emitted,
            "projectionMode": base["projection_mode"],
            "emissionLaw": "phase_equivariant_canonical_snap" if base["projection_mode"] == "degree_modulo_7" else "direct_fifth_stack",
            "inMask": True,
            "pitchClasses": container,
            "stillBehavior": base["still_behavior"],
            "layer": LAYER,
            "gov517_correspondence_claimed": GOV517_CORRESPONDENCE_CLAIMED,
            "still_set_label": STILL_SET_LABEL,
        }

    def advance(self, q_state):
        return int(self.q_module.load_quintessence().q1(int(q_state)))

    def micro_bar(self, node, q_in, mode):
        if self.is_boundary(node):
            raise RuntimeError(f"boundary dwell forbidden at {node}")
        start = 0 if mode == Q_RESET else int(q_in)
        q_state = start
        steps = []
        for sub in range(K_MICRO):
            z_step = 0 if sub == 0 else 1
            record = self.project(q_state, z_step, node)
            record["sub"] = sub
            steps.append(record)
            q_state = record["nextQ"]
        return steps, q_state

    # ---- dynamic card -----------------------------------------------------
    def category_of(self, row):
        kind = row["kind"]
        if kind == "tier-1":
            return "tier-1"
        if kind in ("seamA:R1", "seamA:L1", "seamB:bridge"):
            return kind
        return "boundary-auto-transit"

    def n_in_family(self, history):
        if len(history) < 2:
            return 0
        last_mask, last_phase = self.parse_node(history[-1])
        last_root = self.planner.gov_root.get(last_mask)
        count = 0
        for node in reversed(history[:-1]):
            mask, phase = self.parse_node(node)
            if self.planner.gov_root.get(mask) == last_root and phase == last_phase:
                count += 1
            else:
                break
        return count

    def base_weight(self, candidate_id, is_seam, variant):
        if is_seam:
            return self.w_seam_base
        if variant == "U":
            degree = self.office_of(candidate_id)
            return self.weights.get(degree, self.w_seam_base)
        target_mask, _ = self.parse_node(candidate_id)
        degree = DEGREES.get(self.planner.office.get(target_mask))
        return self.weights.get(degree, self.w_seam_base)

    def rank_candidates(self, node, history, variant):
        dwell = self.n_in_family(history)
        rows = []
        for row in self.planner.neighborhood(node)["legalOutboundMenu"]:
            candidate_id = row["candidateId"]
            if candidate_id == node:
                continue
            category = self.category_of(row)
            is_seam = category != "tier-1"
            base = self.base_weight(candidate_id, is_seam, variant)
            visits = sum(1 for state in history[-self.window:] if state == candidate_id)
            boost = self.beta * max(0, dwell - self.threshold + 1) if is_seam else 0
            target_mask, target_phase = self.parse_node(candidate_id)
            rows.append({
                "candidateId": candidate_id,
                "category": category,
                "kind": row["kind"],
                "operator": row.get("operator"),
                "citation": row.get("citation"),
                "W_base": base,
                "visits": visits,
                "n_in_family": dwell,
                "seam_boost": boost,
                "score": base - self.alpha * visits + boost,
                "target_mask": target_mask,
                "target_phase": target_phase,
            })
        rows.sort(key=lambda r: (-r["score"], CATEGORY_RANK.get(r["category"], 4),
                                 r["target_mask"], r["target_phase"], r["operator"] or ""))
        for index, row in enumerate(rows):
            row["presentedIndex"] = index
        return rows

    def auto_transit(self, node):
        rows = [row for row in self.planner.neighborhood(node)["legalOutboundMenu"]
                if self.category_of(row) == "boundary-auto-transit"]
        if not rows:
            raise RuntimeError(f"boundary {node} has no auto-transit exit")
        rows.sort(key=lambda r: (self.parse_node(r["candidateId"]), r.get("operator") or ""))
        target = rows[0]["candidateId"]
        verdict, reasons, checks, citation = self.world.gate(self.parse_node(node), self.parse_node(target))
        if verdict != "ACCEPT":
            raise RuntimeError(f"auto-transit veto {node}->{target}: {reasons}")
        return target, {
            "source": node,
            "target": target,
            "kind": "boundary-auto-transit",
            "citation": citation,
            "winningOperator": rows[0].get("operator"),
            "gateVerdict": verdict,
            "gateReasons": reasons,
        }

    # ---- walks ------------------------------------------------------------
    def greedy_walk(self, seed, variant, steps=20):
        node = seed
        history = [seed]
        trajectory = [seed]
        events = []
        decisions = 0
        while decisions < steps:
            if self.is_boundary(node):
                target, event = self.auto_transit(node)
                events.append(event)
                node = target
                history.append(node)
                trajectory.append(node)
                continue
            rows = self.rank_candidates(node, history, variant)
            if not rows:
                raise RuntimeError(f"no outbound candidate at {node}")
            chosen = rows[0]
            verdict, reasons, checks, citation = self.world.gate(self.parse_node(node), self.parse_node(chosen["candidateId"]))
            if verdict != "ACCEPT":
                raise RuntimeError(f"gate veto {node}->{chosen['candidateId']}: {reasons}")
            decisions += 1
            events.append({
                "source": node,
                "target": chosen["candidateId"],
                "kind": chosen["kind"],
                "citation": citation,
                "gateVerdict": verdict,
                "gateReasons": reasons,
                "presentedIndex": 0,
                "card": {k: chosen[k] for k in ("W_base", "visits", "n_in_family", "seam_boost", "score")},
            })
            node = chosen["candidateId"]
            history.append(node)
            trajectory.append(node)
        return {
            "seed": seed,
            "variant": variant,
            "trajectory": trajectory,
            "events": events,
            "finalState": trajectory[-1],
            "decisions": decisions,
            "llmCalls": 0,
        }

    # ---- trace assembly ---------------------------------------------------
    def build_trace(self, name, bar_nodes, macro_events, mode, description, source_trajectory=None):
        if any(self.is_boundary(node) for node in bar_nodes):
            raise RuntimeError(f"{name}: boundary bar forbidden")
        auto_after_bar = {}
        for event_index, event in enumerate(macro_events):
            if event.get("kind") != "boundary-auto-transit":
                continue
            preceding_choices = sum(1 for prior in macro_events[:event_index]
                                    if prior.get("kind") != "boundary-auto-transit")
            auto_after_bar[preceding_choices] = event
        bars = []
        micro_steps = []
        q_sequence = []
        rests = []
        timeline_ms = 0
        q_carried = 0
        carried_advances = 0
        for bar_index, node in enumerate(bar_nodes, start=1):
            steps, q_out = self.micro_bar(node, q_carried if mode == Q_CARRIED else 0, mode)
            bar = {
                "bar": bar_index,
                "node": node,
                "startMs": timeline_ms,
                "durationMs": MACRO_DWELL_MS,
                "office": self.office_of(node),
                "phase": self.parse_node(node)[1],
                "pitchClasses": self.pitch_classes(node),
                "qStateIn": 0 if mode == Q_RESET else q_carried,
                "qStateOut": q_out,
            }
            bars.append(bar)
            for step in steps:
                step["bar"] = bar_index
                step["barStartMs"] = timeline_ms
                step["barDurationMs"] = MACRO_DWELL_MS
                step["microStepMs"] = MICRO_STEP_MS
                micro_steps.append(step)
                q_sequence.append(step["nextQ"])
            timeline_ms += MACRO_DWELL_MS
            if bar_index in auto_after_bar:
                event = auto_after_bar[bar_index]
                rests.append({
                    "recordType": "rest",
                    "kind": "boundary-auto-transit",
                    "afterBar": bar_index,
                    "startMs": timeline_ms,
                    "source": event["source"],
                    "target": event["target"],
                    "durationMs": TRANSIT_REST_MS,
                    "oscillators": 0,
                })
                timeline_ms += TRANSIT_REST_MS
            if mode == Q_CARRIED:
                if bar_index < len(bar_nodes):
                    q_carried = self.advance(q_out)
                    carried_advances += 1
        trace = {
            "schemaVersion": "governed-loop.mvp5-coupled-trace.v1",
            "name": name,
            "description": description,
            "mode": mode,
            "layer": LAYER,
            "gov517_correspondence_claimed": GOV517_CORRESPONDENCE_CLAIMED,
            "still_set_label": STILL_SET_LABEL,
            "kMicro": K_MICRO,
            "kBoundary": 0,
            "microStepMs": MICRO_STEP_MS,
            "macroDwellMs": MACRO_DWELL_MS,
            "sourceTrajectory": source_trajectory,
            "bars": bars,
            "microSteps": micro_steps,
            "rests": rests,
            "macroEvents": macro_events,
            "qSequence": q_sequence,
            "carriedAdvances": carried_advances,
            "summary": self.summarize(trace_parts={
                "bars": bars, "microSteps": micro_steps, "rests": rests,
                "macroEvents": macro_events, "qSequence": q_sequence,
                "sourceTrajectory": source_trajectory, "mode": mode,
            }),
        }
        return trace

    def summarize(self, trace_parts):
        micro = trace_parts["microSteps"]
        q_sequence = trace_parts["qSequence"]
        emitted = [step["emittedPc"] for step in micro]
        intervals = {}
        for left, right in zip(emitted, emitted[1:]):
            delta = (right - left) % 12
            intervals[str(delta)] = intervals.get(str(delta), 0) + 1
        modes = {}
        for step in micro:
            modes[step["projectionMode"]] = modes.get(step["projectionMode"], 0) + 1
        windows = [tuple(emitted[i:i + 5]) for i in range(0, max(0, len(emitted) - 4), 5)]
        distinct_windows = len(set(windows))
        trajectory = trace_parts["sourceTrajectory"] or [bar["node"] for bar in trace_parts["bars"]]
        states = trajectory
        governed = [node for node in states if not self.is_boundary(node)]
        families = {self.planner.gov_root.get(self.parse_node(node)[0]) for node in governed}
        offices = {self.office_of(node) for node in governed}
        phases = {self.parse_node(node)[1] for node in states}
        decisions = [event for event in trace_parts["macroEvents"]
                     if event.get("kind") != "boundary-auto-transit"]
        seams = sum(1 for event in decisions if event.get("kind") != "tier-1")
        auto_count = sum(1 for event in trace_parts["macroEvents"]
                         if event.get("kind") == "boundary-auto-transit")
        gate_all = all(event.get("gateVerdict") == "ACCEPT" for event in trace_parts["macroEvents"])
        out_of_mask = sum(1 for step in micro if step["emittedPc"] not in step["pitchClasses"])
        boundary_dwell = sum(1 for bar in trace_parts["bars"] if self.is_boundary(bar["node"]))
        return {
            "bars": len(trace_parts["bars"]),
            "microSteps": len(micro),
            "rests": len(trace_parts["rests"]),
            "distinctMacroStates": len(set(states)),
            "distinctFamilies": len(families),
            "distinctOffices": len(offices),
            "distinctPhases": len(phases),
            "seamModulations": seams,
            "autoTransits": auto_count,
            "distinctQStates": len(set(q_sequence)),
            "qStatesVisited": sorted(set(q_sequence)),
            "stillSetEntries": sum(1 for q in q_sequence if q in self.still_set),
            "emittedPitchClasses": len(set(emitted)),
            "emittedPcs": sorted(set(emitted)),
            "intervalHistogram": dict(sorted(intervals.items(), key=lambda kv: int(kv[0]))),
            "projectionModes": dict(sorted(modes.items())),
            "directOrbitCount": modes.get("direct_orbit_pc", 0),
            "degreeModuloCount": modes.get("degree_modulo_7", 0),
            "ngram5Total": len(windows),
            "ngram5Distinct": distinct_windows,
            "ngram5Repeats": len(windows) - distinct_windows,
            "gateAcceptAll": gate_all,
            "outOfMaskPitches": out_of_mask,
            "boundaryDwell": boundary_dwell,
            "llmCalls": 0,
            "floatValues": 0,
        }


def write_trace(path, trace):
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
    path.write_text("".join(json.dumps(line, sort_keys=True) + "\n" for line in lines), encoding="utf-8")
    return sha256_file(path)


def load_arm_trajectories(receipt_path):
    receipt = json.loads(receipt_path.read_text(encoding="utf-8"))
    return receipt["arms"]


def events_from_receipt_steps(steps):
    events = []
    for step in steps:
        event = {
            "source": step["source"],
            "target": step["target"],
            "gateVerdict": step["gate"]["verdict"],
            "gateReasons": step["gate"]["reasons"],
            "citation": step["gate"].get("citation"),
        }
        if step["kind"] == "auto-transit":
            event["kind"] = "boundary-auto-transit"
            event["presentedIndex"] = None
            event["winningOperator"] = step.get("winning_operator")
        else:
            event["kind"] = step.get("chosen_category") or "tier-1"
            event["operator"] = step.get("chosen_operator")
            event["presentedIndex"] = step.get("presented_index")
            event["card"] = step.get("chosen_dynamic")
        events.append(event)
    return events
