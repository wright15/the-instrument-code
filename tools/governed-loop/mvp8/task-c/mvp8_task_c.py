#!/usr/bin/env python3
"""MVP8-DIR-1 Task C: connector-aware focal-continuity planner.

C1: Aeolian 1453@0 -> Harmonic Minor 2477@0 shared-bridge crossing.
C2: 10 predeclared cross-family pairs, hop overhead <= +2.
C3a: major-mode triangle dwell pillars hold 5-35:0 with 0 dwell switches.
C3b: 7-32 satellite transits preserve the 4-note core {0,2,4,7} with <=1
     bridge switch per 2-hop leg and 0 hop overhead.
"""
import heapq
import importlib.util
import json
import sys
from pathlib import Path

sys.path.insert(0, "/home/erick/workspace/scratch-governed-loop-run/mvp8_pentatonic_q")
sys.path.insert(0, "/home/erick/workspace/scratch-governed-loop-run/mvp8_pentatonic_q/task-b")
import mvp8_common as common
from mvp8_pentatonic_q_engine import PentatonicEngine

TASK_C = common.SCRATCH / "task-c"
TRACES = TASK_C / "traces"
RENDERS = TASK_C / "renders"
RECEIPT = TASK_C / "mvp8_task_c_receipt.json"
FADE_SAMPLES = 2205


def load_module(name, path):
    spec = importlib.util.spec_from_file_location(name, str(path))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def governed_nodes(engine):
    core = common.strong_core(engine.planner)
    return set(core["governed"])


def bfs_path(engine, allowed, source, target, predicate=None):
    if source == target:
        return [source]
    if source not in allowed or target not in allowed:
        return None
    previous = {source: None}
    queue = [source]
    head = 0
    while head < len(queue):
        node = queue[head]
        head += 1
        for neighbor in engine.planner.adj.get(node, ()):
            if neighbor not in allowed or neighbor in previous:
                continue
            if predicate is not None and not predicate(neighbor):
                continue
            previous[neighbor] = node
            if neighbor == target:
                path = [target]
                while path[-1] != source:
                    path.append(previous[path[-1]])
                return list(reversed(path))
            queue.append(neighbor)
    return None


def container(engine, node):
    return set(engine.nodes[node]["pitchClasses"])


def anchored_ids(engine, node):
    return {sub["baseSubnodeId"] for sub in engine.nodes[node]["anchoredSubnodes"]}


def shared_ids(engine, *nodes):
    sets = [anchored_ids(engine, node) for node in nodes]
    return set.intersection(*sets) if sets else set()


def subnode_pcs(engine, node, base_id):
    for sub in engine.nodes[node]["anchoredSubnodes"]:
        if sub["baseSubnodeId"] == base_id:
            return set(sub["pitchClasses"])
    return None


def strict_path(engine, allowed, source, target, focal_pcs):
    return bfs_path(engine, allowed, source, target,
                    predicate=lambda node: focal_pcs <= container(engine, node))


def strict_subnode_path(engine, allowed, source, target, base_id):
    """Strict focal continuity on the predeclared base subnode identity.

    The subnode identity is phase-transposed per node, consistent with B3
    equivariance; this is the continuity object named in the predeclaration's
    strictFocalSubnodes field.
    """
    return bfs_path(engine, allowed, source, target,
                    predicate=lambda node: base_id in anchored_ids(engine, node))


def soft_cost_path(engine, allowed, source, target, focal_pcs, weights,
                   focal_base_id=None):
    if source == target:
        return {"path": [source], "cost": 0, "hops": 0,
                "focalBreaks": 0, "bridgeBreaks": 0}
    best = {source: (0, 0, (source,))}
    queue = [(0, 0, (source,), source)]
    while queue:
        cost, hops, path, node = heapq.heappop(queue)
        if best.get(node) != (cost, hops, path):
            continue
        if node == target:
            if focal_base_id is None:
                focal_breaks = sum(
                    1 for left, right in zip(path, path[1:])
                    if not (focal_pcs <= container(engine, right)))
            else:
                focal_breaks = sum(
                    1 for left, right in zip(path, path[1:])
                    if focal_base_id not in anchored_ids(engine, right))
            bridge_breaks = sum(
                1 for left, right in zip(path, path[1:])
                if not shared_ids(engine, left, right))
            return {"path": list(path), "cost": cost, "hops": hops,
                    "focalBreaks": focal_breaks, "bridgeBreaks": bridge_breaks}
        for neighbor in engine.planner.adj.get(node, ()):
            if neighbor not in allowed:
                continue
            if focal_base_id is None:
                focal_ok = focal_pcs <= container(engine, neighbor)
            else:
                focal_ok = focal_base_id in anchored_ids(engine, neighbor)
            bridge_ok = bool(shared_ids(engine, node, neighbor))
            step = (weights["w_hop"]
                    + weights["w_focal"] * (0 if focal_ok else 1)
                    + weights["w_bridge"] * (0 if bridge_ok else 1))
            candidate = (cost + step, hops + 1, path + (neighbor,))
            if neighbor not in best or candidate < best[neighbor]:
                best[neighbor] = candidate
                heapq.heappush(queue, (*candidate, neighbor))
    return None


def gate_accept(engine, source, target):
    if source == target:
        return True
    meta = engine.planner.edge_meta(source, target)
    return meta["verdict"] == "ACCEPT"


def render_trace(engine, label, trace, out_dir):
    renderer = load_module("mvp8_c_renderer", common.REPO_INPUTS["fade_renderer"])
    palettes = renderer.base.extract_audio_parameters(
        common.REPO / "orrery/src/audio.ts")["offices"]
    office_lookup = {mask: office for mask, office in engine.planner.office.items() if office}
    trace_path = TRACES / f"{label}.jsonl"
    trace_hash = engine.write_trace(trace_path, trace)
    result = renderer.render_track_faded(
        label, trace_path, palettes, office_lookup, {len(trace["bars"])}, FADE_SAMPLES)
    wav_path = RENDERS / f"{label}.wav"
    midi_path = RENDERS / f"{label}.mid"
    wav_path.write_bytes(result["wavBytes"])
    midi_path.write_bytes(result["midiBytes"])
    return {
        "label": label,
        "tracePath": f"task-c/traces/{label}.jsonl",
        "traceSha256": trace_hash,
        "wavPath": f"task-c/renders/{label}.wav",
        "wavSha256": common.sha256_file(wav_path),
        "midiPath": f"task-c/renders/{label}.mid",
        "midiSha256": common.sha256_file(midi_path),
        "samples": result["samples"],
        "durationMs": result["durationMs"],
        "barCount": result["barCount"],
        "reRenderMatch": result["reRenderMatch"],
        "clippedSamples": result["clippedSamples"],
        "nonFiniteSamples": result["nonFiniteSamples"],
    }


def main():
    TASK_C.mkdir(parents=True, exist_ok=True)
    TRACES.mkdir(parents=True, exist_ok=True)
    RENDERS.mkdir(parents=True, exist_ok=True)
    predecl = common.load_predecl()
    engine = PentatonicEngine()
    allowed = governed_nodes(engine)
    weights = predecl["connectorWeights"]

    # ---- C1 --------------------------------------------------------------
    c1_spec = predecl["bets"]["C1_crossing"]
    source, target = c1_spec["source"], c1_spec["target"]
    direct = engine.planner.shortest_paths(source, target, max_paths=1)
    direct_path = direct["paths"][0]["path"]
    shared = sorted(shared_ids(engine, source, target))
    shared_valid = {
        sub_id: (set(engine.nodes[source]["pitchClasses"]) >= set(
                     next(row["pitchClasses"] for row in engine.nodes[source]["anchoredSubnodes"]
                          if row["baseSubnodeId"] == sub_id))
                 and set(engine.nodes[target]["pitchClasses"]) >= set(
                     next(row["pitchClasses"] for row in engine.nodes[target]["anchoredSubnodes"]
                          if row["baseSubnodeId"] == sub_id)))
        for sub_id in shared
    }
    connector_focal = engine.planned_focal(source, "5-27:0", "planned_connector")
    c1_bars = [
        {"node": source, "k": 12, "role": "dwell", "sectionKey": "aeolian",
         "focalOverride": connector_focal},
        {"node": target, "k": 12, "role": "dwell", "sectionKey": "harmonic_minor",
         "focalOverride": connector_focal},
    ]
    c1_gates = [gate_accept(engine, left["node"], right["node"])
                for left, right in zip(c1_bars, c1_bars[1:])]
    c1_trace = engine.build_trace("c1-aeolian-harmonic-minor", c1_bars,
                                  "C1 shared-bridge crossing 1453@0 -> 2477@0")
    c1_render = render_trace(engine, "c1-aeolian-harmonic-minor", c1_trace, TASK_C)
    c1_pass = (direct["hopCount"] == 1 and all(c1_gates)
               and all(shared_valid.values()) and len(shared) == 5
               and c1_trace["summary"]["focalSwitches"] == 0
               and c1_trace["summary"]["outOfMaskPitches"] == 0)

    # ---- C2 --------------------------------------------------------------
    c2_rows = []
    for pair in predecl["bets"]["C2_overhead"]["pairs"]:
        source, target = pair["source"], pair["target"]
        unconstrained = bfs_path(engine, allowed, source, target)
        focal_id = sorted(pair["strictFocalSubnodes"])[0]
        focal_pcs = subnode_pcs(engine, source, focal_id)
        if focal_pcs is None:
            c2_rows.append({**pair, "status": "FOCAL_NOT_IN_SOURCE", "pass": False})
            continue
        connector = strict_subnode_path(engine, allowed, source, target, focal_id)
        soft = soft_cost_path(engine, allowed, source, target, focal_pcs, weights,
                              focal_base_id=focal_id)
        overhead = (len(connector) - 1 - (len(unconstrained) - 1)
                    if connector is not None and unconstrained is not None else None)
        c2_rows.append({
            **pair,
            "strictFocalSubnode": focal_id,
            "strictFocalPitchClasses": sorted(focal_pcs),
            "continuityMode": "base_subnode_phase_transposed",
            "unconstrainedHops": len(unconstrained) - 1 if unconstrained else None,
            "connectorHops": len(connector) - 1 if connector else None,
            "hopOverhead": overhead,
            "connectorPath": connector,
            "softCostPath": soft["path"] if soft else None,
            "softCostHops": soft["hops"] if soft else None,
            "softCostFocalBreaks": soft["focalBreaks"] if soft else None,
            "softCostBridgeBreaks": soft["bridgeBreaks"] if soft else None,
            "gateAllAccept": (all(gate_accept(engine, left, right)
                                  for left, right in zip(connector, connector[1:]))
                              if connector else False),
            "pass": (connector is not None and overhead is not None
                     and overhead <= predecl["bets"]["C2_overhead"]["maxHopOverhead"]
                     and all(gate_accept(engine, left, right)
                             for left, right in zip(connector, connector[1:]))),
        })
    c2_pass = all(row["pass"] for row in c2_rows)

    # ---- C3a -------------------------------------------------------------
    pillars = predecl["bets"]["C3a_dwellPillars"]["waypoints"]
    c3a_rows = []
    for node in pillars:
        focal = engine.resolve_focal(node, q_in=0, role="dwell")
        c3a_rows.append({
            "node": node,
            "focalSubnode": focal["subnodeId"],
            "focalBaseSubnode": focal["baseSubnodeId"],
            "focalPitchClasses": focal["pitchClasses"],
            "is535": focal["setClassId"] == "5-35",
            "matchesTarget": (focal["baseSubnodeId"] == "5-35:0"
                              and focal["pitchClasses"] == [0, 2, 4, 7, 9]),
        })
    c3a_switches = sum(1 for left, right in zip(c3a_rows, c3a_rows[1:])
                       if left["focalSubnode"] != right["focalSubnode"])
    c3a_pass = all(row["matchesTarget"] for row in c3a_rows) and c3a_switches == 0

    # ---- C3b -------------------------------------------------------------
    triangle_specs = [
        ("2741@0", "5-35:0", "dwell", "pillar_a"),
        ("2485@0", "5-23:0B", "transit", "leg1_transit"),
        ("1717@0", "5-35:0", "dwell", "pillar_b"),
        ("2485@0", "5-27:11B", "transit", "leg2_transit"),
        ("2773@0", "5-35:0", "dwell", "pillar_c"),
        ("2485@0", "5-27:11B", "transit", "leg3_transit"),
        ("2741@0", "5-35:0", "dwell", "pillar_a_return"),
    ]
    c3b_bars = []
    for node, base_id, role, key in triangle_specs:
        c3b_bars.append({
            "node": node, "k": 12 if role == "dwell" else 5, "role": role,
            "sectionKey": key,
            "focalOverride": engine.planned_focal(node, base_id, "planned_connector"),
        })
    c3b_trace = engine.build_trace("c3b-major-mode-triangle", c3b_bars,
                                   "C3b major-mode triangle 2741 -> 1717 -> 2773 -> 2741")
    c3b_render = render_trace(engine, "c3b-major-mode-triangle", c3b_trace, TASK_C)
    core = set(predecl["bets"]["C3b_satelliteTransit"]["corePitchClasses"])
    core_per_bar = []
    for bar in c3b_trace["bars"]:
        core_per_bar.append({"bar": bar["bar"], "node": bar["node"],
                             "corePresent": core <= set(bar["pitchClasses"]),
                             "focalSubnode": bar["focalContext"]["subnodeId"]})
    legs = [
        {"leg": 1, "nodes": ["2741@0", "2485@0", "1717@0"],
         "transitBar": 2, "sharedIntersection": sorted(shared_ids(engine, "2741@0", "2485@0", "1717@0"))},
        {"leg": 2, "nodes": ["1717@0", "2485@0", "2773@0"],
         "transitBar": 4, "sharedIntersection": sorted(shared_ids(engine, "1717@0", "2485@0", "2773@0"))},
        {"leg": 3, "nodes": ["2773@0", "2485@0", "2741@0"],
         "transitBar": 6, "sharedIntersection": sorted(shared_ids(engine, "2773@0", "2485@0", "2741@0"))},
    ]
    for leg in legs:
        transit_focal = c3b_trace["bars"][leg["transitBar"] - 1]["focalContext"]["baseSubnodeId"]
        leg["transitFocal"] = transit_focal
        leg["bridgeSwitches"] = 0 if transit_focal in leg["sharedIntersection"] else 1
        leg["allowed"] = 0 if leg["sharedIntersection"] else 1
    c3b_gate = all(gate_accept(engine, left["node"], right["node"])
                   for left, right in zip(c3b_bars, c3b_bars[1:])
                   if left["node"] != right["node"])
    c3b_probe = []
    for node_a, node_b in [("2741@0", "1717@0"), ("1717@0", "2773@0"),
                           ("2773@0", "2741@0")]:
        unconstrained = bfs_path(engine, allowed, node_a, node_b)
        connector = strict_path(engine, allowed, node_a, node_b,
                                set(predecl["bets"]["C3b_satelliteTransit"]["corePitchClasses"]))
        c3b_probe.append({
            "leg": f"{node_a}->{node_b}",
            "unconstrainedHops": len(unconstrained) - 1 if unconstrained else None,
            "coreContinuousHops": len(connector) - 1 if connector else None,
            "coreContinuousPath": connector,
            "overhead": ((len(connector) - len(unconstrained)) if connector and unconstrained else None),
        })
    c3b_pass = (all(row["corePresent"] for row in core_per_bar)
                and all(leg["bridgeSwitches"] <= leg["allowed"] for leg in legs)
                and c3b_gate
                and c3b_trace["summary"]["outOfMaskPitches"] == 0
                and c3b_trace["summary"]["focalSwitches"] == 6
                and all(row["overhead"] == 0 for row in c3b_probe))

    receipt = {
        "schemaVersion": "governed-loop.mvp8-task-c.v1",
        "directive": "MVP8-DIR-1",
        "task": "MVP8-TC",
        "status": "COMPLETE",
        "guardFlags": common.GUARD,
        "predeclarationSha256": common.sha256_file(common.PREDECL_PATH),
        "connectorWeights": weights,
        "C1": {
            "source": source,
            "target": target,
            "hopCount": direct["hopCount"],
            "path": direct_path,
            "gate": direct["paths"][0]["hops"][0]["gate"],
            "sharedSubnodes": shared,
            "sharedSubnodeValid": shared_valid,
            "focalSubnode": connector_focal["subnodeId"],
            "focalPitchClasses": connector_focal["pitchClasses"],
            "focalSwitches": c1_trace["summary"]["focalSwitches"],
            "outOfMaskPitches": c1_trace["summary"]["outOfMaskPitches"],
            "pass": c1_pass,
            "render": c1_render,
        },
        "C2": {
            "pairs": c2_rows,
            "maxHopOverhead": predecl["bets"]["C2_overhead"]["maxHopOverhead"],
            "allPass": c2_pass,
        },
        "C3a": {
            "pillars": c3a_rows,
            "dwellFocalSwitches": c3a_switches,
            "pass": c3a_pass,
        },
        "C3b": {
            "bars": core_per_bar,
            "legs": legs,
            "gateAllAccept": c3b_gate,
            "focalSwitchesTotal": c3b_trace["summary"]["focalSwitches"],
            "outOfMaskPitches": c3b_trace["summary"]["outOfMaskPitches"],
            "probe": c3b_probe,
            "pass": c3b_pass,
            "render": c3b_render,
        },
        "llmCalls": 0,
        "stopRules": [],
    }
    symbolic = {key: value for key, value in receipt.items() if key != "guardFlags"}
    receipt["floatValuesSymbolic"] = len(common.find_floats(symbolic))
    RECEIPT.write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps({
        "status": "COMPLETE",
        "C1": {"pass": c1_pass, "hops": direct["hopCount"], "shared": len(shared),
               "focalSwitches": c1_trace["summary"]["focalSwitches"]},
        "C2": {"pass": c2_pass, "maxOverhead": max(
            (row["hopOverhead"] for row in c2_rows if row["hopOverhead"] is not None),
            default=None), "rows": len(c2_rows)},
        "C3a": {"pass": c3a_pass, "switches": c3a_switches},
        "C3b": {"pass": c3b_pass, "corePresent": sum(1 for row in core_per_bar if row["corePresent"]),
                "legs": legs, "probe": c3b_probe,
                "focalSwitches": c3b_trace["summary"]["focalSwitches"]},
        "floatValuesSymbolic": receipt["floatValuesSymbolic"],
    }, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
