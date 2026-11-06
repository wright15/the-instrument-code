#!/usr/bin/env python3
"""MVP6.1-DIR-1 Task A: macro re-derivation against the frozen L23 control.

Re-runs the in-tree form compiler, proves the macro is structurally identical
to the L23 itinerary, and emits the MVP6.1 itinerary with the de-loop carry
rule declared.
"""
import hashlib
import json
import sys
from pathlib import Path

REPO = Path("/home/erick/projects/integrated-release")
SCRATCH = Path("/home/erick/workspace/scratch-governed-loop-run/mvp6_1")
OUT = SCRATCH / "task-a"
CONTROL_ITINERARY = REPO / "tools/governed-loop/mvp6/task-a/compiled_itinerary.json"
PREDECL = SCRATCH / "task-0" / "mvp6_1_predeclared_deloop.json"
ITINERARY = OUT / "mvp6_1_itinerary.json"

sys.path.insert(0, str(REPO / "tools/governed-loop/mvp6/task-a"))


def stop(rule, detail):
    print(f"STOP: {rule} {detail}")
    sys.exit(2)


def sha256_file(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


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


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    control = json.loads(CONTROL_ITINERARY.read_text(encoding="utf-8"))
    predecl = json.loads(PREDECL.read_text(encoding="utf-8"))

    import mvp6_form_compiler as compiler_module
    compiler = compiler_module.FormCompiler()
    bars, rests = compiler.compile_itinerary()
    transitions = compiler.gates_for_bars(bars)
    rest_events = compiler.gates_for_rests(rests)
    reproduction = {variant: compiler.reproduce_legs(variant) for variant in ("D", "U")}
    coverage = compiler.coverage(bars, rests)
    negatives = compiler.negative_tests()

    if bars != control["bars"]:
        stop("S-3", "bar structure differs from the L23 control")
    if rests != control["rests"]:
        stop("S-3", "rest structure differs from the L23 control")
    if reproduction["D"]["legs"] != control["legs"]:
        stop("S-3", "Variant D legs differ from the L23 control")
    if reproduction["D"]["legs"] != reproduction["U"]["legs"]:
        stop("S-3", "Variant D/U legs diverge")
    if coverage != control["coverage"]:
        stop("S-3", "coverage differs from the L23 control")
    if negatives != control["negativeTests"]:
        stop("S-3", "negative tests differ from the L23 control")

    control_transitions = control["macroTransitions"]
    rest_iter = iter(rest_events)
    ordered = []
    previous = None
    pending_rest = None
    for step in compiler.nodes:
        if step["type"] == "rest":
            ordered.append(next(rest_iter))
            ordered.append(next(rest_iter))
            pending_rest = step["target"]
            previous = step["target"]
            continue
        node = step["node"]
        if previous is None:
            previous = node
            continue
        if pending_rest is not None:
            if node != pending_rest:
                stop("S-3", f"post-rest bar {node} != {pending_rest}")
            pending_rest = None
            previous = node
            continue
        if node == previous:
            ordered.append(compiler._self_loop(node, step["section"]))
        else:
            ordered.append(compiler._graph_edge(previous, node, step["section"], "transit"))
        previous = node
    if ordered != control_transitions:
        stop("S-3", "macro transition sequence differs from the L23 control")
    redriven_transitions = len(ordered)
    accepted = sum(1 for event in ordered if event["gateVerdict"] == "ACCEPT")
    if accepted != 55:
        stop("S-3", f"gate ACCEPT count {accepted}")
    self_loops = sum(1 for event in ordered if event["role"] == "dwell-extension")
    if self_loops != 9:
        stop("S-3", f"self-loop count {self_loops}")

    itinerary = dict(control)
    itinerary["schemaVersion"] = "governed-loop.mvp6_1-itinerary.v1"
    itinerary["pieceId"] = predecl["pieceId"]
    itinerary["controlItinerarySha256"] = sha256_file(CONTROL_ITINERARY)
    itinerary["carryRule"] = predecl["rule"]
    itinerary["macroFrozen"] = True
    itinerary["macroIdenticalToControl"] = True
    itinerary["deloopExpectation"] = predecl["expected"]
    floats = find_floats(itinerary)
    if floats:
        stop("S-5", f"floats in itinerary {floats[:5]}")
    ITINERARY.write_text(json.dumps(itinerary, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    receipt = {
        "schemaVersion": "governed-loop.mvp6_1-task-a.v1",
        "directive": "MVP6.1-DIR-1",
        "task": "MVP6_1-TA",
        "status": "COMPLETE",
        "control": {"path": str(CONTROL_ITINERARY), "sha256": sha256_file(CONTROL_ITINERARY)},
        "predeclaration": {"path": str(PREDECL), "sha256": sha256_file(PREDECL)},
        "itinerary": {"path": str(ITINERARY), "sha256": sha256_file(ITINERARY),
                      "bytes": ITINERARY.stat().st_size},
        "macro": {
            "bars": len(bars),
            "rests": len(rests),
            "transitions": redriven_transitions,
            "gateAccepted": accepted,
            "selfLoops": self_loops,
            "identicalToControl": True,
        },
        "variantReproduction": {
            "D": reproduction["D"]["historyLength"],
            "U": reproduction["U"]["historyLength"],
            "identical": True,
        },
        "coverage": coverage,
        "negativeTests": negatives,
        "llmCalls": 0,
        "floatValues": 0,
        "stopRules": [],
    }
    (OUT / "mvp6_1_task_a_receipt.json").write_text(
        json.dumps(receipt, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps({
        "status": "COMPLETE",
        "bars": len(bars),
        "transitions": redriven_transitions,
        "gateAccepted": accepted,
        "selfLoops": self_loops,
        "macroIdentical": True,
        "itinerarySha256": receipt["itinerary"]["sha256"],
    }, indent=2))


if __name__ == "__main__":
    main()
