#!/usr/bin/env python3
"""MVP8-DIR-1 shared scratch helpers.

Read-only against the repository. Everything written lives under the MVP-8
scratch realm. Symbolic outputs are int/str/bool only; acoustic lens blocks are
the only float-bearing regions and carry the guard flags.
"""
import hashlib
import importlib.util
import json
import os
import sys
from collections import deque
from pathlib import Path

sys.dont_write_bytecode = True

REPO = Path("/home/erick/projects/integrated-release")
SCRATCH = Path("/home/erick/workspace/scratch-governed-loop-run/mvp8_pentatonic_q")
LOOKUP_PATH = SCRATCH / "task-a" / "mvp8_pentatonic_lookup_v1.json"
PREDECL_PATH = SCRATCH / "task-0" / "mvp8_predeclared_bets.json"

GUARD = {
    "causationClaim": False,
    "physicalQuantityClaim": False,
    "tierClassifier": False,
    "globalCHNull": True,
    "gov517_correspondence_claimed": False,
    "still_set_label": "still_set",
    "layer": "SPEC-001 \u00a71.3 overlay dynamics",
    "bipartiteEvidenceStatus": "planning_evidence",
    "bipartiteAdmissionEffect": "none",
    "bipartiteGraphScope": "detached_audit_only",
}

TRAVERSAL_CYCLE = (0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5)
STILL_SET = (12, 13, 14, 15)
TRAVERSAL_SET = frozenset(TRAVERSAL_CYCLE)
GENERATIVE_WINDOW = TRAVERSAL_CYCLE[:5]

REPO_INPUTS = {
    "quintessence": REPO / "src/fivefold/quintessence.py",
    "bipartite": REPO / "derived/hypergraph/bipartite-inclusion-v1.json",
    "planner": REPO / "tools/governed-loop/mvp4/task-b/mvp4_symbolic_planner.py",
    "q_intra": REPO / "tools/governed-loop/mvp4/task-c/mvp4_q_intra_node.py",
    "coupled": REPO / "tools/governed-loop/mvp5/task-a/mvp5_coupled_engine.py",
    "census": REPO / "tools/governed-loop/census_462.json",
    "fade_renderer": REPO / "tools/governed-loop/mvp6_3/task-b/mvp6_3_fade_renderer.py",
    "lens": REPO / "tools/governed-loop/mvp7_intention/task-a/mvp7_log_spectral_lens.py",
    "mvp7_task_b": REPO / "tools/governed-loop/mvp7_intention/task-b/mvp7_task_b.py",
    "mvp7_task_0": REPO / "tools/governed-loop/mvp7_intention/task-0/mvp7_task_0.py",
}


def stop(rule, detail):
    print(f"STOP: {rule} {detail}")
    sys.exit(2)


def sha256_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def sha256_text(text):
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def canonical(obj):
    return json.dumps(obj, sort_keys=True, separators=(",", ":"))


def find_floats(value, path="root"):
    found = []
    if isinstance(value, float):
        found.append(path)
    elif isinstance(value, dict):
        for key, child in value.items():
            found.extend(find_floats(child, f"{path}.{key}"))
    elif isinstance(value, list):
        for index, child in enumerate(value):
            found.extend(find_floats(child, f"{path}[{index}]"))
    return found


def load_module(name, path):
    spec = importlib.util.spec_from_file_location(name, str(path))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def load_quintessence():
    return load_module("mvp8_quintessence", REPO_INPUTS["quintessence"])


def parse_node(node):
    mask_text, phase_text = str(node).split("@", 1)
    mask, phase = int(mask_text), int(phase_text)
    if not (0 <= phase < 12):
        raise ValueError(f"phase outside 0..11: {node!r}")
    return mask, phase


def node_id(mask, phase):
    return f"{int(mask)}@{int(phase)}"


def pitch_classes(mask, phase):
    return sorted((pc + int(phase)) % 12 for pc in range(12) if (int(mask) >> pc) & 1)


def station_index(pc, phase):
    """Fifth-stack station index of pc relative to phase (7 is self-inverse mod 12)."""
    return ((int(pc) - int(phase)) * 7) % 12


def fifth_stack_pc(station, phase):
    return (7 * int(station) + int(phase)) % 12


def q_table(quintessence):
    table = {}
    for z in range(12):
        for q in range(16):
            table[(z, q)] = quintessence.q_power(z, q)
    return table


def build_planner():
    os.environ["GOVERNED_LOOP_SCRATCH"] = str(REPO / "tools/governed-loop")
    os.environ["GOVERNED_LOOP_REPO"] = str(REPO)
    sys.path.insert(0, str(REPO / "tools/governed-loop/mvp4/task-b"))
    module = load_module("mvp8_planner", REPO_INPUTS["planner"])
    return module.Planner()


def strong_core(planner, seed="1387@0"):
    out_dist = planner.distances(seed)
    reverse = planner.reverse_adjacency()
    in_dist = {seed: 0}
    queue = deque([seed])
    while queue:
        node = queue.popleft()
        for predecessor in reverse[node]:
            if predecessor not in in_dist:
                in_dist[predecessor] = in_dist[node] + 1
                queue.append(predecessor)
    strong = set(out_dist) & set(in_dist)
    governed = sorted(node for node in strong
                      if planner.role.get(int(node.split("@")[0])) != "boundary")
    boundary = sorted(node for node in strong
                      if planner.role.get(int(node.split("@")[0])) == "boundary")
    return {
        "seed": seed,
        "outDist": out_dist,
        "inDist": in_dist,
        "strongCore": strong,
        "governed": governed,
        "boundary": boundary,
        "reachableNodes": len(out_dist),
        "strongCoreNodes": len(strong),
        "oneWayNodes": len(out_dist) - len(strong),
        "governedStrongCoreNodes": len(governed),
        "boundaryStrongCoreNodes": len(boundary),
    }


def load_lookup():
    if not LOOKUP_PATH.exists():
        stop("S-4", f"lookup missing: {LOOKUP_PATH}")
    return json.loads(LOOKUP_PATH.read_text(encoding="utf-8"))


def load_predecl():
    if not PREDECL_PATH.exists():
        stop("S-9", "predeclaration missing")
    predecl = json.loads(PREDECL_PATH.read_text(encoding="utf-8"))
    if predecl.get("status") != "locked-before-evaluation":
        stop("S-9", "predeclaration not locked")
    return predecl
