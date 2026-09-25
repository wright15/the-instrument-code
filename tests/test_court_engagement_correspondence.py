"""Sprint evidence pin for the BL-011 court engagement correspondence candidate.

Pins the machine-checkable core of the candidate claim (engagement-Cn = Court
registry position Cn with the derived element-degree mapping) so the admission
ceremony cites a verified artifact rather than a promise. Sprint evidence only:
this file grants no admission status and resolves no gate. Sources:
scrum/plan/fivefold-mesh-adjudication.md (A1, A2);
scrum/plan/bl-011-ceremony-plan.md.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from fivefold import quintessence as q  # noqa: E402

REGISTRY_PATH = (
    ROOT
    / "seven-governors-court-substrate-v0.1.0"
    / "canonical"
    / "court-rooted-positions.json"
)

POSITION_ORDER = ("C0", "C1", "C2", "C3", "C4")
VECTORS = ("0000", "1000", "1100", "1110", "1111")
INTERNAL_POLES = (
    (),
    ("Mars",),
    ("Mars", "Jupiter"),
    ("Mars", "Jupiter", "Venus"),
    ("Mars", "Jupiter", "Venus", "Saturn"),
)
MASKS = (
    frozenset({0, 2, 4, 7, 9}),
    frozenset({0, 2, 5, 7, 9}),
    frozenset({0, 2, 5, 7, 10}),
    frozenset({0, 3, 5, 7, 10}),
    frozenset({0, 3, 5, 8, 10}),
)
XOR_SUPPORTS = (
    None,
    frozenset({4, 5}),
    frozenset({9, 10}),
    frozenset({2, 3}),
    frozenset({7, 8}),
)
ELEMENT_DEGREE_MAP = (
    ("Mars", frozenset({4, 5})),
    ("Jupiter", frozenset({9, 10})),
    ("Venus", frozenset({2, 3})),
    ("Saturn", frozenset({7, 8})),
)


def _positions() -> list[dict]:
    document = json.loads(REGISTRY_PATH.read_text(encoding="utf-8"))
    return document["courtRootedPositions"]


def _built_vectors() -> list[str]:
    states = (
        q.engagement_configuration(),
        q.engagement_configuration(Fire=True),
        q.engagement_configuration(Fire=True, Air=True),
        q.engagement_configuration(Fire=True, Air=True, Water=True),
        q.engagement_configuration(Fire=True, Air=True, Water=True, Earth=True),
    )
    return [f"{state:04b}" for state in states]


def test_registry_order_is_c0_to_c4() -> None:
    assert [position["positionId"] for position in _positions()] == list(POSITION_ORDER)


def test_registry_vectors_equal_substrate_construction() -> None:
    registry_vectors = [position["poleRegister"]["vector"] for position in _positions()]
    assert registry_vectors == list(VECTORS)
    assert registry_vectors == _built_vectors()


def test_internal_poles_match_vectors() -> None:
    internal_poles = [
        tuple(position["poleRegister"]["internalPoles"]) for position in _positions()
    ]
    assert internal_poles == list(INTERNAL_POLES)


def test_masks_equal_keep_or_sharpen_chain() -> None:
    masks = [frozenset(position["pitchClasses"]) for position in _positions()]
    assert masks == list(MASKS)


def test_forced_element_degree_mapping() -> None:
    positions = _positions()
    for index, (element, support) in enumerate(ELEMENT_DEGREE_MAP, start=1):
        previous_poles = set(positions[index - 1]["poleRegister"]["internalPoles"])
        current_poles = set(positions[index]["poleRegister"]["internalPoles"])
        assert current_poles - previous_poles == {element}
        assert frozenset(positions[index]["xorSupportFromPrevious"]) == support
        removed, added = sorted(support)
        previous_pitches = set(positions[index - 1]["pitchClasses"])
        current_pitches = set(positions[index]["pitchClasses"])
        assert previous_pitches - current_pitches == {removed}
        assert current_pitches - previous_pitches == {added}


def test_supports_are_disjoint_and_cover_the_four_degrees() -> None:
    supports = [
        frozenset(position["xorSupportFromPrevious"]) for position in _positions()[1:]
    ]
    assert all(len(support) == 2 for support in supports)
    union: set[int] = set()
    for support in supports:
        assert union.isdisjoint(support)
        union |= support
    assert union == {2, 3, 4, 5, 7, 8, 9, 10}


def test_rejected_polarity_does_not_match_registry() -> None:
    masks = {
        position["positionId"]: frozenset(position["pitchClasses"])
        for position in _positions()
    }
    assert masks["C4"] != frozenset({0, 2, 4, 7, 9})
    assert 4 not in masks["C1"] and 5 in masks["C1"]
    assert 9 not in masks["C2"] and 10 in masks["C2"]
    assert 2 not in masks["C3"] and 3 in masks["C3"]
    assert 7 not in masks["C4"] and 8 in masks["C4"]


def test_origin_window_equals_seed_mask() -> None:
    seed_mask = frozenset(_positions()[0]["pitchClasses"])
    assert q.GENERATIVE_WINDOW == q.TRAVERSAL_CYCLE[:5]
    assert frozenset(q.GENERATIVE_WINDOW) == seed_mask
