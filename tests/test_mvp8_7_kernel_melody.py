#!/usr/bin/env python3
"""Regression tests for MVP8.7 kernel-only melody (strict focal snap).

The landed engine snaps every non-focal orbit emission to the resolved focal
set. These tests pin the tail behavior, the forward snap rule, the untouched
structural window, the still-set hold, and the zero-modal-color posture on the
four plagal containers.
"""
import inspect
import os
import sys
from pathlib import Path

REPO = Path(os.environ.get("MVP8_7_TEST_REPO",
                           Path(__file__).resolve().parents[1]))
sys.path.insert(0, str(REPO / "tools/governed-loop/mvp8"))
sys.path.insert(0, str(REPO / "tools/governed-loop/mvp8/task-b"))

import mvp8_common as m8
from mvp8_pentatonic_q_engine import PentatonicEngine

PLAGAL_SEEDS = ["2741@0", "1453@0", "2773@0", "1717@0"]


def plagal_specs(node, bars=12):
    degrees = [4, 1] * (bars // 2)
    return [{"node": node, "k": 12, "role": "dwell", "degree": degree,
             "stride": 2, "depth": 3} for degree in degrees]


def build(node):
    engine = PentatonicEngine()
    trace = engine.build_trace(
        f"test-{node}", plagal_specs(node), "MVP8.7 landing test")
    return engine, trace


def test_tail_snaps_and_no_modal_color():
    engine, trace = build("2741@0")
    rows = trace["microSteps"]
    modal = [row for row in rows if row["governanceAction"] == "modal_color_pass"]
    tail = [row for row in rows if row["orbitIndex"] is not None
            and row["orbitIndex"] >= 5]
    snapped_tail = [row for row in tail
                    if row["governanceAction"] == "snapped_to_focal"]
    assert modal == []
    assert len(snapped_tail) == 48
    assert all(row["emittedPc"] in row["focalPitchClasses"] for row in rows)
    assert all(row["focalHit"] is True for row in rows)


def test_structural_window_is_unchanged_and_focal():
    _, trace = build("2741@0")
    structural = [row for row in trace["microSteps"]
                  if row["orbitIndex"] is not None
                  and 0 <= row["orbitIndex"] <= 4]
    assert structural
    assert all(row["emittedPc"] in row["focalPitchClasses"]
               for row in structural)
    assert all(row["governanceAction"] in (
        "direct_focal", "snapped_to_focal") for row in structural)


def test_snap_is_forward_in_station_order():
    engine = PentatonicEngine()
    focal = [0, 2, 4, 7, 9]
    assert engine._snap_pc(1, focal, 0) == 0
    assert engine._snap_pc(5, focal, 0) == 0
    assert engine._snap_pc(6, focal, 0) == 0
    assert engine._snap_pc(11, focal, 0) == 0
    assert engine._snap_pc(1, [2, 4, 7], 0) == 7
    assert engine._snap_pc(8, [9, 11, 1], 0) == 9
    source = inspect.getsource(PentatonicEngine._snap_pc)
    assert "return min(focal, key=lambda pc: (distance(pc), " \
           "common.station_index(pc, phase), pc))" in source


def test_still_set_hold_is_untouched():
    engine = PentatonicEngine()
    node = "2741@0"
    focal = engine.resolve_focal(node, q_in=12, role="dwell")
    row = engine.project(12, 0, node, focal, "orbit")
    assert row["projectionMode"] == "still_set_hold"
    assert row["emittedPc"] == row["phase"]
    assert row["governanceAction"] in (
        "still_set_hold_focal", "still_set_hold_nonfocal")


def test_initiation_lands_in_focal_on_four_plagal_containers():
    for seed in PLAGAL_SEEDS:
        _, trace = build(seed)
        first = trace["microSteps"][0]
        assert first["emittedPc"] in first["focalPitchClasses"]
        assert first["focalHit"] is True
        assert first["projectionMode"] != "still_set_hold"


def test_all_four_plagal_traces_have_zero_modal_color():
    for seed in PLAGAL_SEEDS:
        _, trace = build(seed)
        assert all(row["governanceAction"] != "modal_color_pass"
                   for row in trace["microSteps"])
        assert all(row["emittedPc"] in row["focalPitchClasses"]
                   for row in trace["microSteps"])
