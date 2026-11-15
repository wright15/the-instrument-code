#!/usr/bin/env python3
"""MVP8.5 rev 2 harmonic design tests (scratch-authored, landed by L34)."""
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
OBS = REPO / "tools/governed-loop/node-observatory"
sys.path.insert(0, str(OBS))

import mvp8_2_common as common
import degree_ladder as ladder
import mvp8_5_harmonic as harmonic
import node_observatory_degree as drv
import node_observatory_engine as obs


def test_a_term_table():
    assert harmonic.a_term_for_band("H1") == 10
    assert harmonic.a_term_for_band("H2") == 5
    assert harmonic.a_term_for_band("H3") == 0
    assert harmonic.a_term_for_band("H4") == -5
    assert harmonic.a_term_for_band("H5") == -10


def test_p_term_cursor():
    assert harmonic.p_term((1, 2), (0, 3, 7), 0) == 50
    assert harmonic.p_term((1, 2), (0, 4, 7), 0) == 0
    assert harmonic.p_term((5, 1), (0, 1, 4), 3) == 50


def test_seam_boost_is_boolean():
    assert harmonic.seam_boost(3, 0, True) == 70
    assert harmonic.seam_boost(4, 0, True) == 70
    assert harmonic.seam_boost(3, 0, False) == 0
    assert harmonic.seam_boost(2, 1, True) == 70


def test_pressure_latch_and_reset():
    assert harmonic.pressure_accrue(4, 1) == (5, 1)
    assert harmonic.pressure_accrue(4, 0) == (4, 0)
    assert harmonic.pressure_reset_on_seam("familyA-seam") == (0, 0)
    assert harmonic.pressure_reset_on_seam("tier-1") is None


def test_seam_feasibility_andalusian():
    engine = common.load_engine()
    assert harmonic.seam_feasible(engine, engine.planner, "1453@0", ladder)


def test_chord_responsive_lead_reproduces_prototype(tmp_path):
    engine = common.load_engine()
    fade, palettes, _ = common.palettes_and_offices(engine)
    walk = [1, 7, 6, 5, 4, 3, 2, 1, 7, 6, 5, 4]
    blocks = ["A", "A", "S", "S", "A", "A", "S", "S", "A", "A", "S", "S"]
    specs = [{"node": "2773@0" if block == "A" else "2777@0",
              "degree": degree, "stride": 2, "depth": 3, "k": 12,
              "role": "dwell"}
             for block, degree in zip(blocks, walk)]
    plans, solver = drv.build_progression_plans(
        engine, specs, palettes, voice_lead=True)
    assert solver["rotationPath"] == [1, 1, 2, 2, 0, 0, 0, 1, 1, 2, 2, 0]
    assert solver["totalDisplacement"] == 54
    trace = obs.build_trace(engine, "test-mvp8-5-b3", specs,
                            "MVP8.5 B3 test", "governed_dyads_chord_responsive")
    rendered = obs.render_session(
        engine, trace, plans, fade, palettes, "test-mvp8-5-b3",
        "governed_dyads_chord_responsive", tmp_path)
    events = obs.lead_events(trace, "governed_dyads_chord_responsive", plans)
    assert len(events) == 144
    assert sum(1 for event in events if event["snapped"]) == 21
    assert sum(1 for event in events if event["partnerPc"] is not None) == 36
    assert rendered["wavSha256"] == (
        "7e7eb3eac1e83d82a7e4bf5b787c0690e222a8ed5535c8f32350bf58bfbd7a74")
    assert rendered["midiAudit"]["outOfMaskPadNotes"] == 0
    assert rendered["midiAudit"]["outOfMaskLeadNotes"] == 0


def test_b1_structural_and_passing_counts(tmp_path):
    engine = common.load_engine()
    fade, palettes, _ = common.palettes_and_offices(engine)
    specs = [{"node": "2741@0", "degree": (index % 7) + 1, "stride": 2,
              "depth": 3, "rotation": 0, "k": 12, "role": "dwell"}
             for index in range(16)]
    plans, solver = drv.build_progression_plans(
        engine, specs, palettes, voice_lead=False)
    trace = obs.build_trace(engine, "test-mvp8-5-b1", specs,
                            "MVP8.5 B1 test", "governed_dyads_chord_responsive")
    rendered = obs.render_session(
        engine, trace, plans, fade, palettes, "test-mvp8-5-b1",
        "governed_dyads_chord_responsive", tmp_path)
    events = obs.lead_events(trace, "governed_dyads_chord_responsive", plans)
    plans_by_bar = {plan["bar"]: plan for plan in plans}
    structural_chord = 0
    passing_chord = 0
    for step, event in zip(trace["microSteps"], events):
        structural = step["sub"] == 0 or step.get("orbitIndex") in (0, 2, 4)
        chord = set(int(pc) for pc in plans_by_bar[step["bar"]]["chordPcs"])
        if structural:
            if event["primaryPc"] not in chord:
                structural_chord += 1
        elif event["unsafeLanding"]:
            passing_chord += 1
    assert structural_chord == 0
    assert passing_chord == 38
    assert rendered["midiAudit"]["padVoicedMatch"] is True
