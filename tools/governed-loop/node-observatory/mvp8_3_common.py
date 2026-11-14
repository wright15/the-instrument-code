#!/usr/bin/env python3
"""Degree-ladder shared helpers (MVP8.4 consolidated revision).

Consolidates the previously unlanded `mvp8_3_common` dependency: no scratch
imports and no user-specific paths. Importing modules resolve next to this file
or through the repository root discovered by mvp8_2_common.
"""
import sys
from pathlib import Path

sys.dont_write_bytecode = True

_HERE = Path(__file__).resolve().parent
if str(_HERE) not in sys.path:
    sys.path.insert(0, str(_HERE))

import mvp8_2_common as _base

REPO = _base.REPO
SCRATCH = _base.SCRATCH
GUARD = _base.GUARD
EXPECTED = _base.EXPECTED
PINS = _base.PINS
PREDECL = _base.PREDECL
EAR_SCORECARD = _base.EAR_SCORECARD
TEST_NODES = ["2677@0", "1453@0", "2477@0", "375@11", "1143@0", "379@0", "859@11"]

CHALDEAN_ADDRESSES = {
    1: "Saturn", 2: "Jupiter", 3: "Mars", 4: "Sun",
    5: "Venus", 6: "Mercury", 7: "Moon",
}

DIATONIC_MASKS = {
    2741: "Ionian",
    1709: "Dorian",
    1451: "Phrygian",
    2773: "Lydian",
    1717: "Mixolydian",
    1453: "Aeolian",
    1387: "Locrian",
}

stop = _base.stop
sha256_bytes = _base.sha256_bytes
sha256_text = _base.sha256_text
sha256_file = _base.sha256_file
canonical = _base.canonical
find_floats = _base.find_floats
load_module = _base.load_module
write_json = _base.write_json
load_m8 = _base.load_m8
load_engine = _base.load_engine
load_fade = _base.load_fade
palettes_and_offices = _base.palettes_and_offices
load_lens = _base.load_lens
load_predecl = _base.load_predecl

_LADDER_NAMES = ("degree_ladder",)


def load_degree_ladder():
    """The admitted L31 degree ladder, from the repo (read-only)."""
    return _base.load_module(
        "node_observatory_degree_ladder",
        REPO / "tools/governed-loop/node-observatory/degree_ladder.py")


def strong_core(engine):
    """Recompute the seeded strong core exactly as the landed MVP-8 helper."""
    planner = engine.planner
    seed = "1387@0"
    out_dist = planner.distances(seed)
    reverse = planner.reverse_adjacency()
    in_dist = {seed: 0}
    queue = [seed]
    head = 0
    while head < len(queue):
        node = queue[head]
        head += 1
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
        "strongCore": sorted(strong),
        "governed": governed,
        "boundary": boundary,
        "reachableNodes": len(out_dist),
        "strongCoreNodes": len(strong),
        "oneWayNodes": len(out_dist) - len(strong),
        "governedStrongCoreNodes": len(governed),
        "boundaryStrongCoreNodes": len(boundary),
        "inS000": len(strong),
    }


def guard_ok(guards):
    return guards == GUARD
