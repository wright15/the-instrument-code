#!/usr/bin/env python3
import importlib.util
import json
import os
from functools import lru_cache

SCRATCH = os.environ.get("GOVERNED_LOOP_SCRATCH", "/home/erick/workspace/scratch-governed-loop-run/mvp4")
REPO = os.environ.get("GOVERNED_LOOP_REPO", "/home/erick/projects/integrated-release")
LAYER = "SPEC-001 §1.3 overlay dynamics"
GOV517_CORRESPONDENCE_CLAIMED = False
STILL_SET_LABEL = "still_set"
STILL_SET = (12, 13, 14, 15)
TRAVERSAL_CYCLE = (0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5)
TRAVERSAL_SET = frozenset(TRAVERSAL_CYCLE)
GENERATIVE_WINDOW = TRAVERSAL_CYCLE[:5]


@lru_cache(maxsize=1)
def load_quintessence():
    path = os.path.join(REPO, "src", "fivefold", "quintessence.py")
    spec = importlib.util.spec_from_file_location("fivefold_quintessence_task_c", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


@lru_cache(maxsize=1)
def census_masks():
    data = json.load(open(os.path.join(SCRATCH, "census_462.json"), encoding="utf-8"))
    return {int(record["stateId"]): int(record["pitchMask"]) for record in data["records"]}


def parse_node(node_id):
    mask_text, phase_text = str(node_id).split("@", 1)
    mask, phase = int(mask_text), int(phase_text)
    if not (0 <= phase < 12):
        raise ValueError(f"phase outside 0..11: {node_id!r}")
    return mask, phase


def pitch_classes(mask, phase):
    return sorted((pc + phase) % 12 for pc in range(12) if (int(mask) >> pc) & 1)


def project(q_state, z_step, mask, phase, still_behavior="fixed"):
    quintessence = load_quintessence()
    if not (0 <= int(q_state) < 16):
        raise ValueError(f"q_state outside 0..15: {q_state!r}")
    if int(z_step) < 0:
        raise ValueError(f"negative z_step: {z_step!r}")
    if still_behavior not in quintessence.STILL_BEHAVIORS:
        raise ValueError(f"unknown still behavior: {still_behavior!r}")
    next_q = quintessence.q_power(int(z_step), int(q_state), still_behavior=still_behavior)
    container = pitch_classes(mask, phase)
    if len(container) != 7:
        raise ValueError(f"mask {mask} is not heptatonic: {len(container)} pitch classes")
    orbit_index = None
    fifth_stack_pc = None
    if next_q in TRAVERSAL_SET:
        orbit_index = TRAVERSAL_CYCLE.index(next_q)
        fifth_stack_pc = (7 * orbit_index + int(phase)) % 12
        if fifth_stack_pc in container:
            emitted_pc = fifth_stack_pc
            projection_mode = "direct_orbit_pc"
        else:
            emitted_pc = container[orbit_index % 7]
            projection_mode = "degree_modulo_7"
    elif next_q in STILL_SET:
        emitted_pc = int(phase) % 12
        projection_mode = "still_set_hold"
    else:
        raise RuntimeError(f"q_power returned state outside substrate: {next_q}")
    return {
        "mask": int(mask),
        "phase": int(phase),
        "q_state": int(q_state),
        "z_step": int(z_step),
        "next_q": int(next_q),
        "orbit_index": orbit_index,
        "fifth_stack_pc": fifth_stack_pc,
        "emitted_pc": int(emitted_pc),
        "projection_mode": projection_mode,
        "in_mask": int(emitted_pc) in container,
        "pitch_classes": container,
        "still_behavior": still_behavior,
    }


def step_intra_node(node_id, q_state, z_step=1, still_behavior="fixed"):
    mask, phase = parse_node(node_id)
    if mask not in census_masks():
        raise ValueError(f"mask {mask} not in census")
    result = project(q_state, z_step, mask, phase, still_behavior=still_behavior)
    result["node_id"] = f"{mask}@{phase}"
    result["layer"] = LAYER
    result["gov517_correspondence_claimed"] = GOV517_CORRESPONDENCE_CLAIMED
    result["still_set_label"] = STILL_SET_LABEL
    return result


def still_set_check(masks=None, phases=range(12), z_steps=range(1, 12), still_states=STILL_SET):
    if masks is None:
        masks = sorted(census_masks())
    total = 0
    leaks = []
    modes = {}
    for state in still_states:
        for z_step in z_steps:
            for mask in masks:
                for phase in phases:
                    result = project(state, z_step, mask, phase, still_behavior="fixed")
                    total += 1
                    modes[result["projection_mode"]] = modes.get(result["projection_mode"], 0) + 1
                    if result["next_q"] != state or not result["in_mask"] or result["emitted_pc"] != phase % 12:
                        leaks.append({"q_state": state, "z_step": z_step, "mask": mask,
                                      "phase": phase, "result": result})
    return {"evaluations": total, "leaks": len(leaks), "leakExamples": leaks[:8],
            "modeCounts": modes, "status": "PASS" if not leaks else "FAIL"}
