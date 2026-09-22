from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from fivefold import quintessence as q  # noqa: E402

FIXTURE = ROOT / "tests/fixtures/fivefold_q_table.v1.json"

STATES = tuple(range(16))


def test_q0_is_identity() -> None:
    for behavior in q.STILL_BEHAVIORS:
        for state in STATES:
            assert q.q_power(0, state, still_behavior=behavior) == state


def test_traversal_cycle_structure() -> None:
    orbit: list[int] = []
    state = 0
    for _ in range(12):
        orbit.append(state)
        state = q.q1(state)
    assert tuple(orbit) == q.TRAVERSAL_CYCLE
    assert state == 0
    assert q.TRAVERSAL_SET == frozenset(range(12))


def test_still_set_invariance_both_variants() -> None:
    for behavior in q.STILL_BEHAVIORS:
        mapped = {q.q1(state, still_behavior=behavior) for state in q.STILL_SET}
        assert mapped == q.STILL_SET_MEMBERS


def test_still_set_primary_fixed_points() -> None:
    for state in q.STILL_SET:
        assert q.q1(state) == state
        assert q.q_power(11, state) == state


def test_still_set_rotation_four_cycle() -> None:
    orbit: list[int] = []
    state = q.STILL_SET[0]
    for _ in range(4):
        orbit.append(state)
        state = q.q1(state, still_behavior=q.STILL_ROTATION)
    assert tuple(orbit) == q.STILL_SET
    assert state == q.STILL_SET[0]


def test_composition_all_pairs_both_variants() -> None:
    for behavior in q.STILL_BEHAVIORS:
        for a in range(12):
            for b in range(12):
                for state in STATES:
                    lhs = q.q_power(a, q.q_power(b, state, still_behavior=behavior), still_behavior=behavior)
                    rhs = q.q_power((a + b) % 12, state, still_behavior=behavior)
                    assert lhs == rhs


def test_bijectivity_inverse() -> None:
    for behavior in q.STILL_BEHAVIORS:
        for z in range(12):
            for state in STATES:
                image = q.q_power(z, state, still_behavior=behavior)
                assert q.q_power((12 - z) % 12, image, still_behavior=behavior) == state
        for z in range(12):
            images = {q.q_power(z, state, still_behavior=behavior) for state in STATES}
            assert images == set(STATES)


def test_completion_window_at_z4() -> None:
    assert q.q_power(4, 0) != 0
    segment = tuple(q.q_power(z, 0) for z in range(5))
    assert segment == q.GENERATIVE_WINDOW
    assert set(segment) == {0, 7, 2, 9, 4}


def test_closure_at_z12() -> None:
    for behavior in q.STILL_BEHAVIORS:
        for state in STATES:
            assert q.q_power(12, state, still_behavior=behavior) == state


def test_partition_disjoint_and_total() -> None:
    assert q.TRAVERSAL_SET.isdisjoint(q.STILL_SET_MEMBERS)
    assert q.TRAVERSAL_SET | q.STILL_SET_MEMBERS == set(STATES)


def test_bit_order_pinned_to_canon() -> None:
    assert q.is_internal(0b1000, "Fire") is True
    for element in ("Air", "Water", "Earth"):
        assert q.is_internal(0b1000, element) is False
    assert q.engagement_configuration(Fire=True) == 0b1000
    assert q.engagement_configuration(Fire=True, Earth=True) == 0b1001
    assert q.engagement_configuration() == 0b0000
    assert q.ELEMENTS == {"Fire": "Mars", "Air": "Jupiter", "Water": "Venus", "Earth": "Saturn"}
    assert q.AXES == {"Mars": 3, "Jupiter": 2, "Venus": 1, "Saturn": 0}


def test_table_dimensions_and_range() -> None:
    rows = q.q_table()
    assert len(rows) == 12 * 16 == 192
    assert all(0 <= target < 16 for _, _, target in rows)


def test_replay_fixture_bytes() -> None:
    assert FIXTURE.exists(), "fixture missing; regenerate from the module"
    assert FIXTURE.read_text() == q.serialize_q_table()
