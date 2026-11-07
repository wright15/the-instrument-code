#!/usr/bin/env python3
"""Post-processing for Task C: proposal-level divergence and the judgment map.

No LLM calls. Divergence is measured on the C1 first-attempt intention objects
(the free choices), independent of whether they compiled. Legality stays a
separate takeaway.
"""
import importlib.util
import json
from pathlib import Path

SCRATCH = Path("/home/erick/workspace/scratch-governed-loop-run/mvp7_intention")
TASK_C = SCRATCH / "task-c"
RECEIPT = TASK_C / "mvp7_task_c_receipt.json"


def load_module(name, path):
    spec = importlib.util.spec_from_file_location(name, str(path))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def jaccard_distance(left, right):
    left, right = set(left), set(right)
    if not left and not right:
        return 0.0
    return 1.0 - len(left & right) / len(left | right)


def default_signature(ctx):
    form_spec = ctx["form_spec"]
    dwell_nodes = []
    for section in form_spec["sections"]:
        for step in section["steps"]:
            if step.get("role") == "dwell" and step.get("node"):
                dwell_nodes.append(step["node"])
    phases = {int(node.split("@")[1]) for node in dwell_nodes}
    orbits = {ctx["planner"].orbit_of.get(int(node.split("@")[0])) for node in dwell_nodes}
    classes = {ctx["orbit_class"].get(orbit) for orbit in orbits if orbit}
    return {
        "destinationPhilosophy": "far_shore_return",
        "sectionCount": 7,
        "dwellPhases": sorted(phases),
        "orbits": sorted(orbit for orbit in orbits if orbit),
        "dispersionClasses": sorted(klass for klass in classes if klass),
    }


def intent_signature(intent):
    sections = intent.get("sectionIntentions") or []
    dwell_roles = {"dwell", "shore_rest", "cadential_arrival", "mirror_gesture"}
    dwell_phases = set()
    for section in sections:
        if section.get("role") in dwell_roles:
            zone = section.get("phaseZone") or [0, 11]
            dwell_phases.add((int(zone[0]) + int(zone[1])) // 2)
    orbits = set()
    classes = set()
    pcs = set()
    for section in sections:
        orbits.update(section.get("targetOrbitFilter") or [])
        klass = section.get("targetDispersionClass")
        if klass:
            classes.add(klass)
        pcs.update(int(pc) for pc in section.get("requiredPitchClasses", []))
    return {
        "destinationPhilosophy": intent.get("destinationPhilosophy"),
        "sectionCount": len(sections),
        "dwellPhases": sorted(dwell_phases),
        "orbits": sorted(orbits),
        "dispersionClasses": sorted(classes),
        "requiredPitchClasses": sorted(pcs),
        "hasOrbitFilter": bool(orbits),
        "hasDispersionChoice": bool(classes),
    }


def divergence(default, plan):
    d1 = 1.0 if plan["destinationPhilosophy"] != default["destinationPhilosophy"] else 0.0
    d2 = abs(plan["sectionCount"] - default["sectionCount"]) / default["sectionCount"]
    d3 = 1.0 - len({6, 8} & set(plan["dwellPhases"])) / 2.0
    d4 = jaccard_distance(plan["orbits"], default["orbits"]) if plan["hasOrbitFilter"] else 0.0
    d5 = 1.0 if plan["requiredPitchClasses"] else 0.0
    d6 = (jaccard_distance(plan["dispersionClasses"], default["dispersionClasses"])
          if plan["hasDispersionChoice"] else 0.0)
    dimensions = {
        "destination": d1, "sectionCount": d2, "dwellPhases": d3,
        "orbits": d4, "pitchClassConstraints": d5, "dispersionClasses": d6,
    }
    return {"default": default, "plan": plan, "dimensions": dimensions,
            "score": sum(dimensions.values()) / len(dimensions)}


def main():
    tc = load_module("mvp7_tc", TASK_C / "mvp7_task_c.py")
    receipt = json.loads(RECEIPT.read_text(encoding="utf-8"))
    ctx = tc.context()
    default = default_signature(ctx)

    rows = []
    for row in receipt["runs"]:
        if row["arm"] != "C1":
            continue
        first = row["attempts"][0]
        parsed = first.get("parsed")
        if not isinstance(parsed, dict) or not isinstance(parsed.get("sectionIntentions"), list):
            continue
        rows.append({
            "label": row["label"], "prompt": row["prompt"], "trial": row["trial"],
            "compiled": row["compiled"], "firstPass": row["firstPass"],
            "signature": intent_signature(parsed),
            "divergence": divergence(default, intent_signature(parsed)),
        })
    mean = sum(row["divergence"]["score"] for row in rows) / len(rows) if rows else None
    by_prompt_divergence = {}
    for row in rows:
        by_prompt_divergence.setdefault(row["prompt"], []).append(row["divergence"]["score"])
    receipt["divergence"] = {
        "basis": "C1 first-attempt intention objects (free choices), independent of compilation",
        "meanScore": mean,
        "byPromptMean": {key: sum(values) / len(values)
                         for key, values in by_prompt_divergence.items()},
        "unconstrainedOpenArcOnly": (sum(by_prompt_divergence.get("open_arc", []))
                                     / len(by_prompt_divergence.get("open_arc", []))
                                     if by_prompt_divergence.get("open_arc") else None),
        "rows": rows,
    }

    c1_rows = [row for row in receipt["runs"] if row["arm"] == "C1"]
    c1_first_pass = (sum(1 for row in c1_rows if row["firstPass"]) / len(c1_rows)
                     if c1_rows else None)
    c1_compile = (sum(1 for row in c1_rows if row["compiled"]) / len(c1_rows)
                  if c1_rows else None)

    def dimension_map(dimension):
        if not rows:
            return {"classification": "NO_DATA", "divergenceRate": None,
                    "legality": c1_first_pass}
        rate = sum(1 for row in rows
                   if row["divergence"]["dimensions"][dimension] > 0.0) / len(rows)
        if rate < 0.10:
            classification = "KEEP_PLANNER_DEFAULT"
        elif c1_first_pass is not None and c1_first_pass >= 0.90:
            classification = "DELEGATE_TO_LLM"
        else:
            classification = "REQUIRE_VERIFIED_MENU"
        return {"classification": classification, "divergenceRate": rate,
                "legality": c1_first_pass, "trials": len(rows)}

    by_prompt = {}
    for row in c1_rows:
        by_prompt.setdefault(row["prompt"], []).append(row["firstPass"])
    receipt["judgmentMap"] = {
        "basis": "C1 first attempts; legality is C1 first-pass acceptance",
        "c1FirstPassRate": c1_first_pass,
        "c1CompileRate": c1_compile,
        "byPromptFirstPass": {key: f"{sum(values)}/{len(values)}"
                              for key, values in by_prompt.items()},
        "destinationPhilosophy": dimension_map("destination"),
        "sectionCount": dimension_map("sectionCount"),
        "dwellPlacement": dimension_map("dwellPhases"),
        "orbitSelection": dimension_map("orbits"),
        "pitchClassConstraints": dimension_map("pitchClassConstraints"),
        "registerBands": dimension_map("dispersionClasses"),
    }
    receipt["menuArm"] = {
        "firstPassRate": receipt["legality"]["firstPassRate"].get("C2"),
        "compileRate": receipt["legality"]["compileRate"].get("C2"),
        "note": "C2 selects compiler-verified nodes; it measures interface legality, not free divergence",
    }
    RECEIPT.write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps({
        "divergenceBasis": receipt["divergence"]["basis"],
        "meanScore": mean,
        "rows": [(row["label"], round(row["divergence"]["score"], 4),
                  {k: round(v, 3) for k, v in row["divergence"]["dimensions"].items()})
                 for row in rows],
        "judgmentMap": receipt["judgmentMap"],
    }, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
