#!/usr/bin/env python3
"""MVP8.6 functional-harmony card helpers (F-term + hybrid P-term).

Pure integer scoring helpers for the Chaldean degree hierarchy. The recorded
degree weights enter ONLY through the tier-1 F-term; W_base stays flat 50 and
the mvp4_task_a.py office-name lookup stays unpatched (Option C). No floats;
no repository writes.
"""
W_BASE = 50
ALPHA = 40
VISIT_WINDOW = 8
SEAM_BOOST = 70
PRESSURE_N = 5
P_TERM = 50
F_TERM_DIVISOR = 50

CHALDEAN_WEIGHTS = {1: 116, 2: 56, 3: 41, 4: 35, 5: 77, 6: 44, 7: 38}
WEIGHTS_DENOMINATOR = 407
RANKING_ORDER = (1, 5, 2, 6, 3, 7, 4)
A_TERM_BY_BAND = {"H1": 10, "H2": 5, "H3": 0, "H4": -5, "H5": -10}

ANDALUSIAN = (
    (1, 2, (0, 3, 7)),
    (7, 2, (0, 4, 7)),
    (6, 2, (0, 4, 7)),
    (5, 1, (0, 1, 4)),
)

PATTERNS = {
    "plagal_4_1": {
        "kind": "walk",
        "label": "plagal degree walk 4->1",
        "walk": ((4, 2), (1, 2)),
    },
    "authentic_5_1": {
        "kind": "walk",
        "label": "authentic degree walk 5->1",
        "walk": ((5, 2), (1, 2)),
    },
    "deceptive_5_6": {
        "kind": "walk",
        "label": "deceptive degree walk 5->6",
        "walk": ((5, 2), (6, 2)),
    },
    "andalusian": {
        "kind": "exact",
        "label": "fixed Andalusian form (verbatim)",
        "walk": ANDALUSIAN,
    },
}


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


def trunc_div(numerator, denominator):
    """Integer truncation toward zero."""
    if numerator >= 0:
        return numerator // denominator
    return -((-numerator) // denominator)


def f_term(degree, band, divisor=F_TERM_DIVISOR):
    return trunc_div(CHALDEAN_WEIGHTS[degree] * A_TERM_BY_BAND[band], divisor)


def f_table(divisor=F_TERM_DIVISOR):
    return {degree: {band: trunc_div(
        CHALDEAN_WEIGHTS[degree] * value, divisor)
        for band, value in A_TERM_BY_BAND.items()}
        for degree in range(1, 8)}


def step_for(pattern, index):
    entry = pattern["walk"][index]
    return (entry[0], entry[1], 3)


def match_step(pattern, index, step, shape):
    entry = pattern["walk"][index]
    if pattern["kind"] == "exact":
        return (step[0], step[1], tuple(shape)) == (
            entry[0], entry[1], tuple(entry[2]))
    return (step[0], step[1]) == (entry[0], entry[1])


def p_term_for(pattern, index, step, shape):
    return P_TERM if match_step(pattern, index, step, shape) else 0


def patterns_json():
    return {
        name: {
            "kind": spec["kind"],
            "label": spec["label"],
            "depth": 3,
            "walk": [list(entry) for entry in spec["walk"]],
        }
        for name, spec in PATTERNS.items()
    }
