#!/usr/bin/env python3
"""MVP6-DIR-1 Task A: strong-core form compiler.

Compiles the locked form spec into a gate-verified itinerary, enforces the
SCC (Law 2) on every return-form node, reproduces the card-steered legs under
both disclosed weighting variants, and runs the negative return tests.

Read-only against the repository. Zero floats in symbolic output.
"""
import hashlib
import importlib.util
import json
import sys
from collections import deque
from pathlib import Path

REPO = Path("/home/erick/projects/integrated-release")
SCRATCH = Path("/home/erick/workspace/scratch-governed-loop-run/mvp6")
FORM_SPEC_PATH = SCRATCH / "task-0" / "mvp6_form_spec.json"
OUT_DIR = SCRATCH / "task-a"
ITINERARY_PATH = OUT_DIR / "compiled_itinerary.json"

GUARD = {
    "causationClaim": False,
    "physicalQuantityClaim": False,
    "tierClassifier": False,
    "globalCHNull": True,
    "gov517_correspondence_claimed": False,
    "still_set_label": "still_set",
    "layer": "SPEC-001 \u00a71.3 overlay dynamics",
}

STEERING_LEGS = [
    ("1387@0", "1709@0", ["1643@0"]),
    ("1709@0", "1387@0", ["1645@0"]),
    ("1387@0", "1453@6", ["2773@11", "2905@11", "727@11", "1453@10", "2905@9",
                          "727@9", "1453@8", "2905@7", "727@7"]),
    ("1453@6", "623@8", ["2485@6", "2745@6", "1373@7", "1245@7"]),
    ("623@8", "379@7", ["635@8", "1269@7", "699@7", "1397@6", "885@6", "443@7"]),
    ("379@7", "1397@5", ["443@7", "885@6", "699@6"]),
    ("1397@5", "623@2", ["699@5", "1397@4", "2793@3", "699@3", "1397@2",
                         "2793@1", "1269@1", "635@2"]),
    ("623@2", "1387@0", ["1245@1", "861@1", "1721@0", "859@0"]),
]

STAYS = [
    [("1709@0", 1)],
    [("1387@0", 1)],
    [("1453@6", 3)],
    [("623@8", 4)],
    [("379@7", 2), ("REST", 0), ("379@7", 1)],
    [("1397@5", 1)],
    [("623@2", 1)],
    [("1387@0", 4)],
]


def stop(rule, detail):
    print(f"STOP: {rule} {detail}")
    sys.exit(2)


def sha256_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def canonical(obj):
    return json.dumps(obj, sort_keys=True, separators=(",", ":"))


def find_floats(obj, path="$"):
    found = []
    if isinstance(obj, float):
        found.append(path)
    elif isinstance(obj, dict):
        for key, value in obj.items():
            found.extend(find_floats(value, f"{path}.{key}"))
    elif isinstance(obj, (list, tuple)):
        for index, value in enumerate(obj):
            found.extend(find_floats(value, f"{path}[{index}]"))
    return found


def load_module(name, path):
    spec = importlib.util.spec_from_file_location(name, str(path))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class FormCompiler:
    def __init__(self):
        sys.path.insert(0, str(REPO / "tools/governed-loop/mvp4/task-b"))
        sys.path.insert(0, str(REPO / "tools/governed-loop/mvp5/task-a"))
        self.ce = load_module(
            "mvp6_coupled_engine",
            REPO / "tools/governed-loop/mvp5/task-a/mvp5_coupled_engine.py")
        self.engine = self.ce.CoupledEngine()
        self.planner = self.engine.planner
        self.world = self.engine.world
        self.spec = json.loads(FORM_SPEC_PATH.read_text(encoding="utf-8"))
        self.reverse = self.planner.reverse_adjacency()
        self.out_dist = self.planner.distances("1387@0")
        self.in_dist = self._distances_to("1387@0")
        self.strong_core = set(self.out_dist) & set(self.in_dist)
        self.nodes = self._flatten()

    def _distances_to(self, target):
        if target not in self.planner.node_set:
            raise KeyError(target)
        dist = {target: 0}
        queue = deque([target])
        while queue:
            node = queue.popleft()
            for predecessor in self.reverse[node]:
                if predecessor not in dist:
                    dist[predecessor] = dist[node] + 1
                    queue.append(predecessor)
        return dist

    def _flatten(self):
        flat = []
        for section in self.spec["sections"]:
            for step in section["steps"]:
                entry = dict(step)
                entry["section"] = section["id"]
                entry["sectionKey"] = section["key"]
                flat.append(entry)
        return flat

    def compile_itinerary(self):
        bars = []
        rests = []
        bar_index = 0
        for step in self.nodes:
            if step["type"] == "bar":
                bar_index += 1
                bars.append({
                    "bar": bar_index,
                    "section": step["section"],
                    "sectionKey": step["sectionKey"],
                    "node": step["node"],
                    "k": step["k"],
                    "role": step["role"],
                })
            else:
                rests.append({
                    "afterBar": bar_index,
                    "section": step["section"],
                    "sectionKey": step["sectionKey"],
                    "source": step["source"],
                    "boundary": step["boundary"],
                    "target": step["target"],
                    "durationMs": step["durationMs"],
                })
        return bars, rests

    def membership(self, node):
        if node not in self.planner.node_set:
            stop("S-3", f"node outside census grid {node}")
        return {
            "inCensus": True,
            "inStrongCore": node in self.strong_core,
            "outboundHops": self.out_dist.get(node),
            "returnHops": self.in_dist.get(node),
        }

    def gates_for_bars(self, bars):
        transitions = []
        for previous, current in zip(bars, bars[1:]):
            source, target = previous["node"], current["node"]
            if source == target:
                transitions.append(self._self_loop(source, current["section"]))
            else:
                transitions.append(self._graph_edge(source, target, current["section"], "transit"))
        return transitions

    def _graph_edge(self, source, target, section, role):
        meta = self.planner.edge_meta(source, target)
        verdict, reasons, checks, citation = self.world.gate(
            self.engine.parse_node(source), self.engine.parse_node(target))
        if verdict != "ACCEPT":
            stop("S-3", f"gate reject {source}->{target} {reasons}")
        return {
            "source": source, "target": target,
            "kind": meta["kind"], "operator": meta.get("operator"),
            "citation": citation or meta.get("citation"),
            "gateVerdict": verdict, "gateReasons": list(reasons),
            "section": section, "role": role,
        }

    def _self_loop(self, node, section):
        verdict, reasons, checks, citation = self.world.gate(
            self.engine.parse_node(node), self.engine.parse_node(node))
        if verdict != "ACCEPT":
            stop("S-3", f"self-loop reject {node} {reasons}")
        return {
            "source": node, "target": node,
            "kind": "tier-1:self", "operator": None,
            "citation": "mvp2.py:150-156",
            "gateVerdict": verdict, "gateReasons": list(reasons),
            "section": section, "role": "dwell-extension",
        }

    def gates_for_rests(self, rests):
        events = []
        for rest in rests:
            for source, target, role in [
                (rest["source"], rest["boundary"], "boundary-entry"),
                (rest["boundary"], rest["target"], "boundary-auto-transit"),
            ]:
                meta = self.planner.edge_meta(source, target)
                verdict, reasons, checks, citation = self.world.gate(
                    self.engine.parse_node(source), self.engine.parse_node(target))
                if verdict != "ACCEPT":
                    stop("S-3", f"boundary gate reject {source}->{target} {reasons}")
                events.append({
                    "source": source, "target": target,
                    "kind": meta["kind"], "operator": meta.get("operator"),
                    "citation": citation or meta.get("citation"),
                    "gateVerdict": verdict, "gateReasons": list(reasons),
                    "section": rest["section"], "role": role,
                    "afterBar": rest["afterBar"],
                })
        return events

    def card_walk(self, start, target, history, variant):
        dist = self._distances_to(target) if target != "1387@0" else dict(self.out_dist)
        current = start
        path = [current]
        hops = []
        while current != target:
            if self.engine.is_boundary(current):
                nxt, event = self.engine.auto_transit(current)
                if dist.get(nxt) != dist.get(current, 0) - 1:
                    stop("S-3", f"auto-transit leaves shortest path {current}->{nxt}")
                hops.append({"source": current, "target": nxt,
                             "kind": "boundary-auto-transit", "operator": event.get("winningOperator"),
                             "gateVerdict": "ACCEPT", "role": "boundary-auto-transit"})
                current = nxt
                history.append(current)
                path.append(current)
                continue
            candidates = self.engine.rank_candidates(current, history, variant)
            valid = [row for row in candidates
                     if row["candidateId"] in dist
                     and dist[row["candidateId"]] == dist[current] - 1]
            if not valid:
                stop("S-3", f"no shortest-path successor at {current} toward {target}")
            chosen = valid[0]
            hops.append({"source": current, "target": chosen["candidateId"],
                         "kind": chosen["kind"], "operator": chosen.get("operator"),
                         "gateVerdict": "ACCEPT", "role": "transit",
                         "score": chosen["score"], "presentedIndex": chosen["presentedIndex"]})
            current = chosen["candidateId"]
            history.append(current)
            path.append(current)
        return path, hops

    def reproduce_legs(self, variant):
        history = ["1387@0"]
        current = "1387@0"
        legs = []
        total_hops = 0
        for index, (start, target, via) in enumerate(STEERING_LEGS):
            if start != current:
                stop("S-3", f"leg {index} start mismatch {start} != {current}")
            path, hops = self.card_walk(start, target, history, variant)
            expected = [start] + via + [target]
            if path != expected:
                stop("S-3", f"leg {index} card path mismatch\n got {path}\n exp {expected}")
            total_hops += len(path) - 1
            legs.append({"index": index, "start": start, "target": target,
                         "expected": expected, "observed": path,
                         "hops": len(path) - 1, "verified": True})
            current = target
            for action, count in STAYS[index]:
                if action == "REST":
                    history += ["757@6", "379@7"]
                    current = "379@7"
                    total_hops += 2
                else:
                    if action != current:
                        stop("S-3", f"stay mismatch {action} != {current}")
                    for _ in range(count - 1):
                        history.append(action)
        return {
            "variant": variant,
            "legs": legs,
            "nonSelfHops": total_hops,
            "historyLength": len(history),
            "allExact": True,
        }

    def negative_tests(self):
        never_return = "1831@6"
        never_return_result = {
            "target": never_return,
            "inCensus": never_return in self.planner.node_set,
            "inStrongCore": never_return in self.strong_core,
            "outboundHops": self.out_dist.get(never_return),
            "returnHops": self.in_dist.get(never_return),
        }
        if never_return_result["inStrongCore"]:
            stop("S-3", "1831@6 unexpectedly in strong core")
        never_return_result["verdict"] = "OUTSIDE_STRONG_CORE"
        never_return_result["rejected"] = True

        isolated = sorted(self.planner.isolated_boundary)
        if not isolated:
            stop("S-3", "no isolated boundary masks found")
        isolated_mask = isolated[0]
        isolated_node = f"{isolated_mask}@0"
        isolated_result = {
            "target": isolated_node,
            "role": self.planner.role.get(isolated_mask),
            "boundaryStatus": self.planner.boundary_status(isolated_mask),
            "hasExit": isolated_mask in self.planner.exits_by_source,
        }
        if isolated_result["role"] != "boundary" or isolated_result["hasExit"]:
            stop("S-3", "isolated boundary selection drift")
        isolated_result["verdict"] = "ISOLATED_BOUNDARY"
        isolated_result["rejected"] = True

        return {
            "neverReturn": never_return_result,
            "isolatedBoundary": isolated_result,
            "bothRejected": True,
        }

    def coverage(self, bars, rests):
        nodes = {bar["node"] for bar in bars} | {rest["boundary"] for rest in rests}
        offices = sorted({self.planner.node_audit(n)["office"] for n in nodes
                          if self.planner.node_audit(n)["office"]})
        phases = sorted({self.planner.node_audit(n)["phase"] for n in nodes})
        orbits = sorted({self.planner.node_audit(n)["orbit"] for n in nodes
                         if self.planner.node_audit(n)["orbit"]})
        outside = sorted(n for n in nodes if n not in self.strong_core)
        if outside:
            stop("S-3", f"itinerary nodes outside strong core {outside}")
        if len(offices) != 7:
            stop("S-3", f"office coverage {offices}")
        if len(phases) != 12:
            stop("S-3", f"phase coverage {phases}")
        if len(nodes) != 42:
            stop("S-3", f"distinct state coverage {len(nodes)}")
        outbound = {bar["node"] for bar in bars
                    if bar["section"] <= 5} | {rest["boundary"] for rest in rests}
        return_path, _ = self.card_walk("757@6", "1387@0", ["757@6"], "D")
        interior = return_path[1:-1]
        new_interior = [node for node in interior if node not in outbound]
        if len(interior) != 18 or len(new_interior) != 15:
            stop("S-3", f"return novelty {len(new_interior)}/{len(interior)}")
        return {
            "distinctStates": len(nodes),
            "offices": offices,
            "phases": phases,
            "orbits": orbits,
            "allInStrongCore": True,
            "returnHops": len(return_path) - 1,
            "returnInteriorNodes": len(interior),
            "returnNewInteriorNodes": len(new_interior),
            "returnNewInterior": new_interior,
        }


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    compiler = FormCompiler()
    bars, rests = compiler.compile_itinerary()

    rest_events = compiler.gates_for_rests(rests)
    rest_iter = iter(rest_events)
    # Rebuild the macro order from the flat step sequence. A rest replaces the
    # transition across its gap with its two boundary events.
    ordered = []
    previous_bar = None
    pending_rest_target = None
    for step in compiler.nodes:
        if step["type"] == "rest":
            ordered.append(next(rest_iter))
            ordered.append(next(rest_iter))
            pending_rest_target = step["target"]
            previous_bar = step["target"]
            continue
        node = step["node"]
        if previous_bar is None:
            previous_bar = node
            continue
        if pending_rest_target is not None:
            if node != pending_rest_target:
                stop("S-3", f"post-rest bar {node} != target {pending_rest_target}")
            pending_rest_target = None
            previous_bar = node
            continue
        if node == previous_bar:
            ordered.append(compiler._self_loop(node, step["section"]))
        else:
            ordered.append(compiler._graph_edge(previous_bar, node, step["section"], "transit"))
        previous_bar = node

    total = len(ordered)
    self_loops = sum(1 for event in ordered if event["role"] == "dwell-extension")
    non_self = total - self_loops
    if total != 55 or self_loops != 9 or non_self != 46:
        stop("S-3", f"transition census {total}/{self_loops}/{non_self}")

    reproduction = {variant: compiler.reproduce_legs(variant) for variant in ("D", "U")}
    if reproduction["D"]["legs"] != reproduction["U"]["legs"]:
        stop("S-3", "variant D/U trajectories diverge")
    coverage = compiler.coverage(bars, rests)
    negatives = compiler.negative_tests()

    for node in sorted({bar["node"] for bar in bars}):
        membership = compiler.membership(node)
        if not membership["inStrongCore"]:
            stop("S-3", f"{node} outside strong core")

    itinerary = {
        "schemaVersion": "governed-loop.mvp6-itinerary.v1",
        "directive": "MVP6-DIR-1",
        "pieceId": compiler.spec["pieceId"],
        "formSpecSha256": sha256_file(FORM_SPEC_PATH),
        "destinationPhilosophy": compiler.spec["destinationPhilosophy"],
        "bars": bars,
        "rests": rests,
        "macroTransitions": ordered,
        "legs": reproduction["D"]["legs"],
        "coverage": coverage,
        "negativeTests": negatives,
        "summary": {
            "bars": len(bars),
            "transitBars": sum(1 for bar in bars if bar["k"] == 5),
            "dwellBars": sum(1 for bar in bars if bar["k"] == 12),
            "microSteps": sum(bar["k"] for bar in bars),
            "rests": len(rests),
            "restMs": sum(rest["durationMs"] for rest in rests),
            "durationMs": sum(bar["k"] for bar in bars) * 300
            + sum(rest["durationMs"] for rest in rests),
            "macroTransitions": total,
            "selfLoopExtensions": self_loops,
            "nonSelfHops": non_self,
            "gateAccepted": total,
            "gateRejected": 0,
            "llmCalls": 0,
        },
        "variantReproduction": {
            "D": reproduction["D"]["historyLength"],
            "U": reproduction["U"]["historyLength"],
            "identicalTrajectories": True,
        },
        "guardFlags": GUARD,
    }
    floats = find_floats(itinerary)
    if floats:
        stop("S-5", f"floats in itinerary {floats[:5]}")
    ITINERARY_PATH.write_text(json.dumps(itinerary, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    receipt = {
        "schemaVersion": "governed-loop.mvp6-task-a.v1",
        "directive": "MVP6-DIR-1",
        "task": "MVP6-TA",
        "status": "COMPLETE",
        "formSpec": {"path": str(FORM_SPEC_PATH), "sha256": sha256_file(FORM_SPEC_PATH)},
        "itinerary": {
            "path": str(ITINERARY_PATH),
            "sha256": sha256_file(ITINERARY_PATH),
            "bytes": ITINERARY_PATH.stat().st_size,
        },
        "laws": {
            "law1PlannerComposes": "deterministic BFS planner, zero LLM calls",
            "law2StrongCore": f"{len(compiler.strong_core)} nodes; all itinerary nodes inside",
            "law5VoicedArrival": "terminal-bar convention exercised by Task B/C",
        },
        "summary": itinerary["summary"],
        "coverage": coverage,
        "negativeTests": negatives,
        "variantReproduction": itinerary["variantReproduction"],
        "guardFlags": GUARD,
        "llmCalls": 0,
        "floatValues": 0,
        "stopRules": [],
    }
    floats = find_floats(receipt)
    if floats:
        stop("S-5", f"floats in receipt {floats[:5]}")
    (OUT_DIR / "mvp6_task_a_receipt.json").write_text(
        json.dumps(receipt, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps({
        "status": "COMPLETE",
        "macroTransitions": total,
        "selfLoops": self_loops,
        "nonSelfHops": non_self,
        "bars": len(bars),
        "durationMs": itinerary["summary"]["durationMs"],
        "distinctStates": coverage["distinctStates"],
        "returnNewInterior": coverage["returnNewInteriorNodes"],
        "negativeVerdicts": [negatives["neverReturn"]["verdict"],
                             negatives["isolatedBoundary"]["verdict"]],
        "itinerarySha256": receipt["itinerary"]["sha256"],
    }, indent=2))


if __name__ == "__main__":
    main()
