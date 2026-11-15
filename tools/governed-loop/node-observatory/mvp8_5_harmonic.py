#!/usr/bin/env python3
"""MVP8.5 rev 2 harmonic-design steering helpers.

Pure integer scoring helpers for the cadence-aware card and the pressure
bridge, plus the seam-feasibility lookahead. No repository writes; no floats.
"""
A_TERM_BY_BAND = {"H1": 10, "H2": 5, "H3": 0, "H4": -5, "H5": -10}
P_TERM = 50
PRESSURE_N = 5
SEAM_BOOST = 70
ANDALUSIAN_TARGET = (
    (1, 2, (0, 3, 7)),
    (7, 2, (0, 4, 7)),
    (6, 2, (0, 4, 7)),
    (5, 1, (0, 1, 4)),
)
TARGET_FINAL = (5, 1, (0, 1, 4))


def band_of(m1):
    if m1 >= 25:
        return "H1"
    if m1 >= 22:
        return "H2"
    if m1 >= 18:
        return "H3"
    if m1 >= 15:
        return "H4"
    return "H5"


def a_term_for_band(band):
    return A_TERM_BY_BAND[band]


def p_term(step, shape_root, cursor, target=ANDALUSIAN_TARGET):
    """+50 when the bar matches the active cursor step, else 0."""
    if cursor < 0 or cursor >= len(target):
        return 0
    expected = target[cursor]
    if (int(step[0]), int(step[1]), tuple(shape_root)) == expected:
        return P_TERM
    return 0


def seam_boost(dwell_in_family, pressure_triggered, is_seam,
               threshold=3):
    """Non-stacking boolean seam boost."""
    if not is_seam:
        return 0
    if dwell_in_family >= threshold or pressure_triggered == 1:
        return SEAM_BOOST
    return 0


def pressure_accrue(count, unsafe_steps, n=PRESSURE_N):
    """Return (new_count, triggered) with the latch at N unsafe micro-steps."""
    count += int(unsafe_steps)
    return count, 1 if count >= n else 0


def pressure_reset_on_seam(category):
    """Pressure resets only after an accepted seam move."""
    return (0, 0) if category != "tier-1" else None


def seam_feasible(engine, planner, node, ladder,
                  target_final=TARGET_FINAL):
    """One-step lookahead: node u has a governed single-pc edge to a
    successor v that voices target[L-1] as a degree-3 stack."""
    container_u = ladder.container_from_row(engine.nodes[node])
    for successor in planner.adj.get(node, []):
        if successor == node:
            continue
        container_v = ladder.container_from_row(engine.nodes[successor])
        if len(set(container_u) ^ set(container_v)) != 2:
            continue
        degree, stride, _ = target_final
        depth = 3
        stack = ladder.degree_stack(container_v, degree, stride, depth, 0)
        root = container_v[degree - 1]
        shape = tuple(sorted((int(pc) - root) % 12
                             for pc in stack["pitchClasses"]))
        if shape == tuple(target_final[2]):
            return True
    return False
