"""Quintessence (Q) overlay dynamics on the 16-state elemental-engagement substrate.

Authority and layer guards (read before use):

- This module is overlay dynamics per SPEC-001 section 1.3. It is NOT registered
  GOV-517 semantics. The registered GOV-517 coordinates are Z7 offices with Z12
  mask-bit traversal; Q_z is never tuned to simulate them. Correspondence remains
  gated per SPEC-001 section 6 item 4; the 4-states+1-law composition is a recorded
  hypothesis (scrum/plan/bl-010-q-table-freeze-memo.md), not a claim.
- The set {1100..1111} is the "still set" (overlay sense only). It is never called
  a kernel: canonical "kernel" means the five-note Court-family bridge
  (framework/CANONICAL_FEATURE_PROFILES_AND_MUTATION_ALGEBRA.md:1159).

State semantics:

- A state is an engagement configuration of the four elemental governors. Bits are
  MSB-first: b3 Mars/Fire, b2 Jupiter/Air, b1 Venus/Water, b0 Saturn/Earth.
  0 = External, 1 = Internal (canonical bit disposition, framework/AGENTS.md:279-283;
  framework/TOPOLOGICAL_ANCHORING.md:90-96).
- 0000 is the unengaged ground and the origin of the traversal (on-path). 1111 is
  the fully engaged configuration and lies in the still set (boundary, not a stop
  on the path).
- Position in the Q1 orbit corresponds to a pitch class via the fifth-stack
  t_k = 7k mod 12 (SPEC-001 section 2.1). The pitch label is a property of orbit
  position, not of the state.

The authored object is Q_1 plus the action law Q_z = Q_1^z; the 12 x 16 table is
generated, never transcribed.
"""

from __future__ import annotations

import json

SCHEMA_VERSION = "fivefold-q-table.v1"

TRAVERSAL_CYCLE: tuple[int, ...] = (0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5)
STILL_SET: tuple[int, ...] = (12, 13, 14, 15)
TRAVERSAL_SET = frozenset(TRAVERSAL_CYCLE)
STILL_SET_MEMBERS = frozenset(STILL_SET)
GENERATIVE_WINDOW: tuple[int, ...] = TRAVERSAL_CYCLE[:5]

STILL_FIXED = "fixed"
STILL_ROTATION = "rotation"
STILL_BEHAVIORS: tuple[str, ...] = (STILL_FIXED, STILL_ROTATION)

AXES: dict[str, int] = {"Mars": 3, "Jupiter": 2, "Venus": 1, "Saturn": 0}
ELEMENTS: dict[str, str] = {
    "Fire": "Mars",
    "Air": "Jupiter",
    "Water": "Venus",
    "Earth": "Saturn",
}

BIT_ORDER = "MSB-first b3=Mars/Fire b2=Jupiter/Air b1=Venus/Water b0=Saturn/Earth"
SEMANTICS_NOTE = "overlay dynamics per SPEC-001 1.3; not registered GOV-517 semantics; correspondence gated 6(4)"

_state_count = len(TRAVERSAL_SET | STILL_SET_MEMBERS)


def _successor_map(still_behavior: str) -> dict[int, int]:
    if still_behavior not in STILL_BEHAVIORS:
        raise ValueError(f"unknown still-set behavior: {still_behavior!r}")
    mapping = {
        state: TRAVERSAL_CYCLE[(index + 1) % len(TRAVERSAL_CYCLE)]
        for index, state in enumerate(TRAVERSAL_CYCLE)
    }
    for index, state in enumerate(STILL_SET):
        if still_behavior == STILL_FIXED:
            mapping[state] = state
        else:
            mapping[state] = STILL_SET[(index + 1) % len(STILL_SET)]
    return mapping


def q1(state: int, *, still_behavior: str = STILL_FIXED) -> int:
    """Apply one fifth-step of the Q1 generator."""
    if not 0 <= state < _state_count:
        raise ValueError(f"state out of substrate: {state!r}")
    return _successor_map(still_behavior)[state]


def q_power(z: int, state: int, *, still_behavior: str = STILL_FIXED) -> int:
    """Apply Q_z = Q_1^z (z taken modulo 12)."""
    if z < 0:
        raise ValueError(f"negative exponent: {z!r}")
    target = state
    for _ in range(z % 12):
        target = q1(target, still_behavior=still_behavior)
    return target


def q_table(*, still_behavior: str = STILL_FIXED) -> tuple[tuple[int, int, int], ...]:
    """The generated 12 x 16 overlay table as (z, state, target) rows."""
    return tuple(
        (z, state, q_power(z, state, still_behavior=still_behavior))
        for z in range(12)
        for state in range(_state_count)
    )


def serialize_q_table(*, still_behavior: str = STILL_FIXED) -> str:
    """Deterministic JSON serialization of the generated table."""
    document = {
        "schemaVersion": SCHEMA_VERSION,
        "semantics": SEMANTICS_NOTE,
        "bitOrder": BIT_ORDER,
        "stillSetBehavior": still_behavior,
        "traversalCycle": list(TRAVERSAL_CYCLE),
        "stillSet": list(STILL_SET),
        "generativeWindow": list(GENERATIVE_WINDOW),
        "entries": [list(row) for row in q_table(still_behavior=still_behavior)],
    }
    return json.dumps(document, indent=2) + "\n"


def is_internal(state: int, element: str) -> bool:
    """Whether `element` is designated Internal (1) in `state`."""
    if element not in ELEMENTS:
        raise ValueError(f"unknown element: {element!r}")
    return bool((state >> AXES[ELEMENTS[element]]) & 1)


def engagement_configuration(**internal: bool) -> int:
    """Build a state from keyword designations, e.g. Fire=True, Earth=False."""
    state = 0
    for element, designated in internal.items():
        if element not in ELEMENTS:
            raise ValueError(f"unknown element: {element!r}")
        if designated:
            state |= 1 << AXES[ELEMENTS[element]]
    return state
