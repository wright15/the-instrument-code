#!/usr/bin/env python3
"""MVP6.3-DIR-1 Task A: macro re-verification against the frozen L25 itinerary.

No new itinerary is written; the L25 itinerary is referenced by hash.
"""
import hashlib
import json
import sys
from pathlib import Path

REPO = Path("/home/erick/projects/integrated-release")
SCRATCH = Path("/home/erick/workspace/scratch-governed-loop-run/mvp6_3")
OUT = SCRATCH / "task-a"
CONTROL_ITINERARY = REPO / "tools/governed-loop/mvp6_2/task-a/mvp6_2_itinerary.json"
PREDECL = SCRATCH / "task-0" / "mvp6_3_predeclared_fade.json"
EXPECTED_ITINERARY = "d62a3c260c56bdf15304da0f7fd0978de2d6e91c517d4f8485e02a6e793eef44"

sys.path.insert(0, str(REPO / "tools/governed-loop/mvp6/task-a"))


def stop(rule, detail):
    print(f"STOP: {rule} {detail}")
    sys.exit(2)


def sha256_file(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    if sha256_file(CONTROL_ITINERARY) != EXPECTED_ITINERARY:
        stop("S-1", "L25 itinerary drift")
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

    if bars != control["bars"] or rests != control["rests"]:
        stop("S-3", "bar/rest structure differs from L25")
    if reproduction["D"]["legs"] != control["legs"]:
        stop("S-3", "Variant D legs differ from L25")
    if reproduction["D"]["legs"] != reproduction["U"]["legs"]:
        stop("S-3", "Variant D/U legs diverge")
    if coverage != control["coverage"] or negatives != control["negativeTests"]:
        stop("S-3", "coverage/negative tests differ from L25")

    rest_iter = iter(rest_events)
    ordered = []
    previous = None
    pending_rest = None
    for step in compiler.nodes:
        if step["type"] == "rest":
            ordered.append(next(rest_iter)); ordered.append(next(rest_iter))
            pending_rest = step["target"]; previous = step["target"]; continue
        node = step["node"]
        if previous is None:
            previous = node; continue
        if pending_rest is not None:
            if node != pending_rest:
                stop("S-3", f"post-rest bar {node} != {pending_rest}")
            pending_rest = None; previous = node; continue
        if node == previous:
            ordered.append(compiler._self_loop(node, step["section"]))
        else:
            ordered.append(compiler._graph_edge(previous, node, step["section"], "transit"))
        previous = node
    if ordered != control["macroTransitions"]:
        stop("S-3", "macro transition sequence differs from L25")
    accepted = sum(1 for event in ordered if event["gateVerdict"] == "ACCEPT")
    self_loops = sum(1 for event in ordered if event["role"] == "dwell-extension")
    if accepted != 55 or self_loops != 9:
        stop("S-3", f"transition census {accepted}/{self_loops}")

    receipt = {
        "schemaVersion": "governed-loop.mvp6_3-task-a.v1",
        "directive": "MVP6.3-DIR-1",
        "task": "MVP6_3-TA",
        "status": "COMPLETE",
        "itinerary": {"path": str(CONTROL_ITINERARY), "sha256": EXPECTED_ITINERARY,
                      "referencedNotRewritten": True},
        "predeclaration": {"path": str(PREDECL), "sha256": sha256_file(PREDECL)},
        "macro": {"bars": len(bars), "rests": len(rests), "transitions": len(ordered),
                  "gateAccepted": accepted, "selfLoops": self_loops,
                  "identicalToL25": True},
        "variantReproduction": {"D": reproduction["D"]["historyLength"],
                                "U": reproduction["U"]["historyLength"],
                                "identical": True},
        "coverage": coverage,
        "negativeTests": negatives,
        "llmCalls": 0,
        "floatValues": 0,
        "stopRules": [],
    }
    (OUT / "mvp6_3_task_a_receipt.json").write_text(
        json.dumps(receipt, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps({"status": "COMPLETE", "macroIdentical": True,
                      "transitions": len(ordered), "gateAccepted": accepted,
                      "selfLoops": self_loops,
                      "itinerarySha256": EXPECTED_ITINERARY}, indent=2))


if __name__ == "__main__":
    main()
