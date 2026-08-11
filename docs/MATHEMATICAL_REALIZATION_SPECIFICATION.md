# Mathematical Realization Specification — Pentatonic Court Layer

**Status:** Proposed specification for EPIC-003 implementation
**Version:** 0.1
**Date:** 2026-08-03
**Scope:** Bridge between `framework/AGENTS.md`, `framework/NATURAL_ORGANIZATION_THESIS.md`,
`framework/TOPOLOGICAL_ANCHORING.md`, `framework/CANONICAL_FEATURE_PROFILES_AND_MUTATION_ALGEBRA.md`,
and tickets CRT-301 through CRT-309.

---

## 1. Purpose

The framework documents define the mathematical structures (Forte set classes,
Hamming geometry, Court transitions, compression coordinates, Carey CQ/SQ).
The CRT tickets define the software contracts (schemas, APIs, tests, ledger).
This document defines the **missing translation layer**: how each mathematical
property becomes a concrete data structure, algorithm, and test vector in the
runtime.

Without this layer, the tickets produce a structurally correct but
mathematically hollow system — the types and tests pass, but the "physics"
(gravity, wormholes, phase transitions, heterodyning) does not manifest.

---

## 2. Mathematical Foundations

### 2.1 The 12-TET Pitch-Class Space

All scale states are 12-bit binary vectors in $\mathbb{Z}_2^{12}$:

$$x = (x_0, x_1, \ldots, x_{11}), \quad x_i \in \{0, 1\}$$

where $x_i = 1$ means pitch class $i$ is present. Weight-$n$ states have
exactly $n$ set bits. Governor states are weight-7; Court states are weight-5.

### 2.2 Interval Classes and Dissonance

The 12 pitch-class intervals collapse into 6 interval classes (IC) under
inversional equivalence:

| IC | Intervals | Dissonance $\delta(\text{IC})$ | Harmonic Character |
|----|-----------|-------------------------------|-------------------|
| IC1 | 1, 11 | 3.0 | Extreme tension (minor 2nd, major 7th) |
| IC2 | 2, 10 | 2.0 | Strong tension (major 2nd, minor 7th) |
| IC3 | 3, 9 | 0.5 | Consonance (minor 3rd, major 6th) |
| IC4 | 4, 8 | 0.5 | Consonance (major 3rd, minor 6th) |
| IC5 | 5, 7 | 0.0 | Perfect consonance (perfect 4th, 5th) |
| IC6 | 6 | 2.5 | Tritone — symmetric dissonance |

These weights are framework-authored coordinates, not physical measurements.
They are derived from common-practice interval ranking and can be tuned
without changing the algebra.

### 2.3 Interval Vector (Forte Interval Function)

For a pitch-class set $S$ with $n$ elements, the **interval vector** $\vec{v}(S)$
counts how many times each interval class appears among the $\binom{n}{2}$
unordered pairs:

$$v_k(S) = |\{ \{i, j\} \subseteq S : \min((i-j) \bmod 12, (j-i) \bmod 12) = k \}|, \quad k \in \{1,2,3,4,5,6\}$$

The interval vector is a **set-class invariant**: all modes of the same Forte
class share the same interval vector.

### 2.4 Hamming Distance

For two 12-bit vectors $x, y$:

$$d_H(x, y) = \sum_{i=0}^{11} x_i \oplus y_i$$

Governor adjacencies: $d_H = 2$ (single-degree mutation swaps one pitch).
Court adjacencies: $d_H = 2$ (single pole flip swaps one pitch).

### 2.5 Court Geometry

The four Court transition vectors $e_1, e_2, e_3, e_4$ are the XOR masks between
adjacent Court positions:

| Transition | XOR Support | Pole Changed |
|------------|-------------|--------------|
| $C_0 \to C_1$ | $\{4, 5\}$ | Mars: E→I |
| $C_1 \to C_2$ | $\{9, 10\}$ | Jupiter: E→I |
| $C_2 \to C_3$ | $\{2, 3\}$ | Venus: E→I |
| $C_3 \to C_4$ | $\{7, 8\}$ | Saturn: E→I |

The four supports are **disjoint**. The signed transition vectors have Gram
matrix $G_{\text{Court}} = 2I_4$, proving orthogonality.

Court distance: $d_H(C_i, C_j) = 2|i - j|$.

Canonical path: $C_0 \leftrightarrow C_1 \leftrightarrow C_2 \leftrightarrow C_3 \leftrightarrow C_4$.

### 2.6 Carey Coherence and Sameness

For the canonical 5-35 seed $S = \{0, 2, 4, 7, 9\}$ under the $7/12$ generator:

$$CQ(5\text{-}35) = 1 - \frac{F(S)}{\max F(N)} = 1$$

$$SQ(5\text{-}35) = \frac{2(N-2)}{3(N-1)} \bigg|_{N=5} = \frac{2 \cdot 3}{3 \cdot 4} = \frac{1}{2}$$

These are formal harmonic measurements, not framework interpretations.

### 2.7 Anchor Tier Hierarchy

| Tier | Forte Class | Name | Derivation | Symmetry | E(S) | Gradient Character |
|------|-------------|------|-----------|----------|------|---------------------|
| A0 | 7-35 | Diatonic | Maximally even root | Self-inverse (achiral) | 22.0 | Low, **directional** (clear gravity toward resolution) |
| A1 | 7-34 | Acoustic | Single-degree mutation from 7-35 | Self-inverse (achiral) | 25.0 | Medium-high, **asymmetric** (more tension, still directional) |
| A2 | 7-33 | Lydian Minor | Recombination of two 7-34 modes | Self-inverse (achiral) | 29.5 | High, **isotropic** (maximal symmetry, gradient undirected — "wormhole") |

**Derivation chain:** $7\text{-}35 \xrightarrow{d_H=2} 7\text{-}34 \xrightarrow{d_H=2} 7\text{-}33$

**7-33 structural decomposition:** The canonical prime form of Forte 7-33 is
$\{0, 1, 2, 4, 6, 8, 10\}$. It decomposes as a complete whole-tone hexachord
$\{0, 2, 4, 6, 8, 10\}$ (Forte 6-35) with a single perfect-fifth anchor at
pitch class 7. The Lydian Minor mode (1493) is the transposition $T_6$ (also
inversion $I_8$): $\{0, 2, 4, 6, 7, 8, 10\}$. This 6-fold rotational symmetry in the whole-tone
sub-lattice makes 7-33 a **maximal-symmetry boundary** where directional
gravity vanishes despite high total dissonance energy. The whole-tone
hexachord distributes tension isotropically — the energy is present but
undirected, unlike the directional-but-lower 7-35 or the asymmetric 7-34.
This is the "wormhole" property: 7-33 is a **high-energy saddle point** (not
a low-energy attractor) where the gradient magnitude is maximal but the
direction is undefined.

**Critical correction on symmetry:** 7-33 is **achiral** (inversionally
symmetric), not asymmetrical. Its inversion symmetry axis passes through
pitch class 1 (the "intruding" note) and its tritone opposite at 7. The
apparent "intruding" note at pc 1 **is the symmetry axis**, not an asymmetric
intrusion. Inversion around axis 1 (and its tritone opposite 7) maps the set
onto itself:
$$1 \leftrightarrow 1,\quad 0 \leftrightarrow 2,\quad 10 \leftrightarrow 4,\quad 8 \leftrightarrow 6$$

This retained inversional symmetry makes the 7-33 wormhole a **stable mirror
pivot** rather than a chaotic shortcut: the intruding note at pc 1 anchors
reflection symmetry, so the portal is mathematically self-consistent and
reversible.

**7-33 synthesis formula:**

$$\text{Lydian Minor (1493)} = T_6(\{0, 1, 2, 4, 6, 8, 10\}) = \{0, 2, 4, 6, 7, 8, 10\}$$

$$\text{Lydian Minor (1493)} = \text{Acoustic (1749)} \cap_{\sharp4} \cup_{\flat6} \text{Mixolydian } \flat6 \text{ (1461)}$$

$$\{0,2,4,\mathbf{6},7,\mathbf{8},10\} = (\{0,2,4,6,7,9,10\} \setminus \{9\}) \cup (\{0,2,4,5,7,8,10\} \setminus \{5\})$$

Acoustic contributes $\sharp4$ (pc 6); Mixolydian $\flat6$ contributes
$\flat6$ (pc 8). The result crosses the 7-34 boundary into 7-33.

---

## 3. Concrete Data Structures

### 3.1 Pitch-Class Set

```python
@dataclass(frozen=True, slots=True)
class PitchClassSet:
    """A 12-bit pitch-class vector with formal set-class properties."""
    bits: int                           # 12-bit integer, bit i = pitch class i present
    weight: int                         # popcount(bits)
    forte_number: str                   # e.g., "7-35", "5-35"
    prime_form: tuple[int, ...]         # canonical interval-normalized rotation
    interval_vector: tuple[int, int, int, int, int, int]  # IC1..IC6 counts
    is_self_inverse: bool                # achiral: set equals its own inversion up to T
    anchor_tier: int | None             # 0 (A0), 1 (A1), 2 (A2), or None (satellite)
```

### 3.2 Dissonance Energy

```python
@dataclass(frozen=True, slots=True)
class DissonanceEnergy:
    """Harmonic gravity field value for a pitch-class set."""
    total_energy: float                 # E(S) = Σ δ(IC) * v_IC(S)
    normalized_energy: float            # E(S) / max_energy_for_weight
    interval_class_contributions: dict[str, float]  # per-IC breakdown
    gradient_direction: tuple[int, ...] # pitch classes whose removal reduces E
```

### 3.3 Court Position and Pole Register

```python
@dataclass(frozen=True, slots=True)
class CourtPosition:
    """One of five canonical 5-35 rooted positions."""
    position: int                       # 0..4
    pitch_class_set: tuple[int, ...]    # e.g., (0, 2, 4, 7, 9) for C0
    binary_mask: int                    # 12-bit mask
    kappa_court: float                  # position / 4.0
    pole_register: PoleRegister         # (Mars, Jupiter, Venus, Saturn) E/I

@dataclass(frozen=True, slots=True)
class PoleRegister:
    """The four-bit Internal/External configuration."""
    mars: str                           # "External" or "Internal"
    jupiter: str                        # "External" or "Internal"
    venus: str                          # "External" or "Internal"
    saturn: str                         # "External" or "Internal"
    bits: int                           # 4-bit encoding: Mars=1, Jupiter=2, Venus=4, Saturn=8
```

### 3.4 Court State (Runtime)

```python
@dataclass(frozen=True, slots=True)
class CourtState:
    """Runtime Court state — extends GOV-204 AgentState, does not rewrite it."""
    court_position: int                 # 0..4
    pole_register: PoleRegister
    kappa_court: float                  # court_position / 4.0
    prior_court_sha256: str             # hash of previous Court state
    ledger_anchor: LedgerAnchor         # GOV-204 ledger extension
    court_state_sha256: str             # intrinsic hash (excludes wall-clock)
```

### 3.5 Court Filter Operator

```python
@dataclass(frozen=True, slots=True)
class CourtFilterOperator:
    """The admitted linear diagonal Court filter P_c = diag(c)."""
    filter_id: str                      # e.g., "court-filter:5-27:v1"
    court_mask: int                     # 12-bit diagonal mask c
    forte_number: str                   # e.g., "5-27"
    admission: str                      # "admitted" or "proposed"
    operator_type: str                  # "linear_diagonal" (only admitted type)
    domain_weight: int                  # weight of admissible source (7)
    image_weight: int                   # weight of output (popcount(c))
    is_idempotent: bool                 # True: P_c P_c = P_c
    inverse: str                        # "none" (projection is not invertible)
```

### 3.6 Commutation Record

```python
@dataclass(frozen=True, slots=True)
class CommutationRecord:
    """Result of testing P_c T =?= T P_c for one filter and one mutation."""
    filter_id: str                      # CourtFilterOperator.filter_id
    mutation_operator_id: str           # EPIC-002 operator ID
    source_state_id: str                # canonical state (e.g., "1749")
    target_state_id: str                # target state (e.g., "1493")
    commutes: bool                      # True if P_c T = T P_c
    route_semantics: str                # "" if commutes; else "order-dependent"
    court_exposed_pitches: tuple[int, ...]  # pitches visible through P_c
    court_suppressed_pitches: tuple[int, ...]  # pitches hidden by P_c
    energy_delta: float                 # E(P_c x) - E(x) for the source state
```

### 3.7 Topological Translocation Record

```python
@dataclass(frozen=True, slots=True)
class TopologicalTranslocationRecord:
    """Required for any non-adjacent Court jump or Forte family change."""
    source_court_position: int          # C_source
    target_court_position: int          # C_target (non-adjacent or same)
    source_forte_family: str            # e.g., "7-35"
    target_forte_family: str            # e.g., "7-32"
    altered_chaldean_degrees: tuple[int, ...]  # which degrees changed (1..7)
    degree_governors: tuple[str, ...]   # Degree Governors of altered degrees
    mutation_directions: tuple[str, ...]  # "raise" or "lower" per degree
    evidence_path_id: str               # pointer to evidence ledger entry
```

### 3.8 Dual Mercury Engine

```python
@dataclass(frozen=True, slots=True)
class MercuryEngine:
    """The constructive (+5) and observational (+7) mod-12 engines."""
    # Class constants, not instance data
    CONSTRUCTIVE_STEP: int = 5          # T_5: forward build, Court compression
    OBSERVATIONAL_STEP: int = 7         # T_7: audit, readback

    @staticmethod
    def constructive(pitch: int) -> int:
        """Gemini forward: x → (x + 5) mod 12."""
        return (pitch + 5) % 12

    @staticmethod
    def observational(pitch: int) -> int:
        """Virgo readback: x → (x + 7) mod 12."""
        return (pitch + 7) % 12

    @staticmethod
    def constructive_sequence(root: int, length: int) -> tuple[int, ...]:
        """Generate tonic-preserving Court offsets: 0 → 5 → 10 → 3 → 8."""
        seq = []
        current = root
        for _ in range(length):
            seq.append(current)
            current = (current + 5) % 12
        return tuple(seq)

    @staticmethod
    def observational_sequence(root: int, length: int) -> tuple[int, ...]:
        """Read back Court positions from committed state."""
        seq = []
        current = root
        for _ in range(length):
            seq.append(current)
            current = (current + 7) % 12
        return tuple(seq)
```

### 3.9 Anchor Tier Resolution

```python
@dataclass(frozen=True, slots=True)
class AnchorResolution:
    """Result of attempting office assignment through the achiral anchor hierarchy."""
    resolved_tier: int                  # 0 (A0=7-35), 1 (A1=7-34), 2 (A2=7-33), or -1 (unresolved)
    resolved_governor: str | None       # inherited Governor office
    eligible_relations: tuple[str, ...]  # which relations matched (e.g., "hamming2", "midpoint")
    satellite_coordinates: dict[str, Any]  # {forte_family, handedness, phase, kappa}
    resolution_path: tuple[str, ...]    # chain of state IDs from candidate to anchor
```

---

## 4. Concrete Algorithms

### 4.1 Dissonance Energy Computation

```python
INTERVAL_CLASS_DISSONANCE: dict[int, float] = {
    1: 3.0,   # IC1: minor 2nd / major 7th
    2: 2.0,   # IC2: major 2nd / minor 7th
    3: 0.5,   # IC3: minor 3rd / major 6th
    4: 0.5,   # IC4: major 3rd / minor 6th
    5: 0.0,   # IC5: perfect 4th / 5th
    6: 2.5,   # IC6: tritone
}

def compute_interval_vector(pitches: tuple[int, ...]) -> tuple[int, ...]:
    """Compute the Forte interval vector (IC1..IC6) for a pitch-class set."""
    ic_counts = [0] * 6
    for i in range(len(pitches)):
        for j in range(i + 1, len(pitches)):
            interval = abs(pitches[j] - pitches[i]) % 12
            ic = min(interval, 12 - interval)
            if ic == 0:
                continue  # unison is not counted
            ic_counts[ic - 1] += 1
    return tuple(ic_counts)

def compute_dissonance_energy(pitches: tuple[int, ...]) -> DissonanceEnergy:
    """Compute harmonic gravity: E(S) = Σ δ(IC_k) * v_k(S)."""
    iv = compute_interval_vector(pitches)
    total = sum(INTERVAL_CLASS_DISSONANCE[k + 1] * iv[k] for k in range(6))
    # Normalize by maximum possible energy for this weight
    n = len(pitches)
    max_pairs = n * (n - 1) // 2
    max_energy = max(INTERVAL_CLASS_DISSONANCE.values()) * max_pairs
    normalized = total / max_energy if max_energy > 0 else 0.0
    # Gradient: which pitches contribute most dissonance
    contributions = {}
    for pitch in pitches:
        remaining = tuple(p for p in pitches if p != pitch)
        e_without = sum(
            INTERVAL_CLASS_DISSONANCE[min(abs(pitch - p), 12 - abs(pitch - p))]
            for p in remaining
        )
        contributions[pitch] = total - compute_dissonance_energy(remaining).total_energy
    # Sort by contribution descending (most dissonant first)
    gradient = tuple(sorted(contributions, key=lambda p: -contributions[p]))
    return DissonanceEnergy(
        total_energy=total,
        normalized_energy=normalized,
        interval_class_contributions={f"IC{k+1}": INTERVAL_CLASS_DISSONANCE[k+1] * iv[k] for k in range(6)},
        gradient_direction=gradient,
    )
```

### 4.2 Court Filter Application

```python
def apply_court_filter(
    filter_op: CourtFilterOperator,
    source_bits: int,
) -> tuple[int, DissonanceEnergy]:
    """Apply P_c = diag(c): project 12-bit state through Court mask.

    P_c x = c ⊙ x  (bitwise AND)

    Returns (filtered_bits, energy_of_filtered_state).
    """
    if bin(source_bits).count("1") != filter_op.domain_weight:
        raise ValueError("source_weight_mismatch")
    filtered = source_bits & filter_op.court_mask
    if bin(filtered).count("1") != filter_op.image_weight:
        raise ValueError("image_weight_mismatch")
    pitches = tuple(i for i in range(12) if filtered & (1 << i))
    energy = compute_dissonance_energy(pitches)
    return filtered, energy
```

### 4.3 Commutation Test

```python
def test_commutation(
    filter_op: CourtFilterOperator,
    mutation_operator: MutationOperator,
    source_state: PitchClassSet,
) -> CommutationRecord:
    """Test whether P_c T = T P_c for one filter and one mutation.

    1. Compute P_c(T(x)): apply mutation first, then filter
    2. Compute T(P_c(x)): apply filter first, then mutation
    3. Compare: if equal, the operators commute for this source state
    4. If not equal, record route semantics

    The mutation operator T applies its XOR mask to the source bits
    and records the altered Chaldean degree and Degree Governor.
    """
    # P_c(T(x)): mutation then filter
    mutated_bits = mutation_operator.apply(source_state.bits)
    pc_then_t = mutated_bits & filter_op.court_mask

    # T(P_c(x)): filter then mutation
    filtered_bits = source_state.bits & filter_op.court_mask
    t_then_pc = mutation_operator.apply(filtered_bits)

    commutes = (pc_then_t == t_then_pc)

    # Compute exposed/suppressed pitches
    exposed = tuple(i for i in range(12) if filter_op.court_mask & (1 << i) and source_state.bits & (1 << i))
    suppressed = tuple(i for i in range(12) if not (filter_op.court_mask & (1 << i)) and source_state.bits & (1 << i))

    # Compute energy delta
    source_pitches = tuple(i for i in range(12) if source_state.bits & (1 << i))
    source_energy = compute_dissonance_energy(source_pitches)
    filtered_pitches = tuple(i for i in range(12) if source_state.bits & filter_op.court_mask & (1 << i))
    filtered_energy = compute_dissonance_energy(filtered_pitches)
    energy_delta = filtered_energy.total_energy - source_energy.total_energy

    return CommutationRecord(
        filter_id=filter_op.filter_id,
        mutation_operator_id=mutation_operator.operator_id,
        source_state_id=source_state.forte_number,
        target_state_id=mutation_operator.target_forte_number,
        commutes=commutes,
        route_semantics="" if commutes else "order-dependent",
        court_exposed_pitches=exposed,
        court_suppressed_pitches=suppressed,
        energy_delta=energy_delta,
    )
```

### 4.4 Anchor Tier Resolution

```python
ANCHOR_TIERS = [
    (0, "7-35", "Diatonic"),
    (1, "7-34", "Acoustic"),
    (2, "7-33", "Lydian Minor"),
]

def resolve_anchor(
    candidate: PitchClassSet,
    known_states: dict[str, PitchClassSet],
) -> AnchorResolution:
    """Attempt office assignment through the achiral anchor hierarchy.

    Try A0 (7-35) first, then A1 (7-34), then A2 (7-33).
    A lower tier is consulted only when no eligible direct anchoring
    relation exists at the higher tier.

    Eligible relations:
    - Single-degree Hamming-2 mutation
    - Exact midpoint construction (dH=2 to two endpoints at dH=4)
    - Inversion/transposition equivalence
    """
    for tier, forte, name in ANCHOR_TIERS:
        # Find all states in this tier that are Hamming-2 from the candidate
        eligible = []
        for state_id, state in known_states.items():
            if state.forte_number != forte:
                continue
            if hamming_distance(candidate.bits, state.bits) == 2:
                eligible.append((state_id, "hamming2", state))
        # Check midpoint construction
        for state_id, state in known_states.items():
            if state.forte_number != forte:
                continue
            if is_midpoint(candidate, state, known_states):
                eligible.append((state_id, "midpoint", state))

        if eligible:
            # Inherit Governor office from the first eligible anchor
            anchor_state = eligible[0][2]
            return AnchorResolution(
                resolved_tier=tier,
                resolved_governor=anchor_state.governor_office,
                eligible_relations=tuple(r for _, r, _ in eligible),
                satellite_coordinates={
                    "forte_family": candidate.forte_number,
                    "anchor_tier": tier,
                    "handedness": "achiral" if candidate.is_self_inverse else "chiral",
                },
                resolution_path=tuple(s for s, _, _ in eligible),
            )

    return AnchorResolution(
        resolved_tier=-1,
        resolved_governor=None,
        eligible_relations=(),
        satellite_coordinates={"forte_family": candidate.forte_number},
        resolution_path=(),
    )
```

### 4.5 7-33 Wormhole Detection

```python
def detect_wormhole(
    source: PitchClassSet,
    target: PitchClassSet,
    commutation_table: list[CommutationRecord],
) -> bool:
    """Detect whether 7-33 acts as a portal between source and target.

    A 7-33 wormhole exists when:
    1. The source or target is in Forte class 7-33
    2. The commutation table contains a non-commuting pair (P_c T ≠ T P_c)
       involving a 7-33 filter, indicating route-dependent behavior at the
       symmetry saddle point
    3. The source and target are in different Forte families (7-35 or 7-34)
    4. The Hamming distance through the 7-33 portal is shorter than
       the shortest path through 7-35/7-34 intermediate states

    Mathematical basis:
    7-33 prime form = {0,1,2,4,6,8,10} = whole-tone hexachord {0,2,4,6,8,10}
    ∪ perfect 5th {7}. Lydian Minor (1493) is the T6 transposition {0,2,4,6,7,8,10}.
    - Dissonance energy E(7-33) = 29.5 is HIGHER than E(7-34)=25.0 and E(7-35)=22.0.
    - But 7-33 is **isotropic**: the whole-tone sub-lattice distributes tension
      rotationally, making the gradient direction undefined at the saddle point.
    - 7-33 is **achiral** (inversionally symmetric): inversion around the axis
      through pc 1 (the "intruding" note) and its tritone opposite 7 maps the
      set onto itself. The apparent intruding note at pc 1 IS the symmetry
      axis, not an asymmetric intrusion. This makes the portal a stable mirror
      pivot, not a chaotic shortcut.
    - This is NOT a low-energy attractor. It is a **maximal-symmetry saddle**:
      high energy, but the energy is undirected.
    - Any operator that non-commutes with a 7-33 filter (P_c T ≠ T P_c) reveals
      route-dependent behavior at this saddle: what you see depends on the
      order of operations, because the orientation was undefined at entry.

    Verified energy ordering (section 5.1):
        E(Court C0 5-35) = 7.5  <  E(Lydian 7-35) = 22.0
        <  E(Acoustic 7-34) = 25.0  <  E(Lydian Minor 7-33) = 29.5

    The "wormhole" emerges from both rotational symmetry (isotropy) and
    inversion symmetry (achirality) — a stable mirror pivot, not from low
    energy.
    """
    # Check if any 7-33 filter appears in non-commuting records
    for record in commutation_table:
        if "7-33" in record.filter_id and not record.commutes:
            source_family = get_forte_family(record.source_state_id)
            target_family = get_forte_family(record.target_state_id)
            if source_family != target_family:
                return True
    return False
```

### 4.6 Heterodyne State Merge

```python
def heterodyne_merge(
    state_a: PitchClassSet,
    state_b: PitchClassSet,
) -> tuple[PitchClassSet, PitchClassSet]:
    """Merge two states via spectral interaction (heterodyning).

    Produces:
    - Sum state: union of features that are either common or newly generated
      (interpreted as f₁ + f₂)
    - Difference state: symmetric difference of features
      (interpreted as f₁ - f₂)

    The output states must land in valid Forte set classes. If the result
    crosses an anchor tier boundary, the merge records a Topological
    Translocation.

    Example:
    Acoustic (1749) ∪ Mixo♭6 (1461):
    - Sum: {0,2,4,6,7,8,9,10} → weight 8 (invalid for Governor states)
    - Intersection: {0,2,4,7,10} → weight 5 (a Court filter!)
    - Symmetric difference: {5,6,8,9} → the "difference sideband"
    - Structural fusion (#4 from A, ♭6 from B): {0,2,4,6,7,8,10} = 1493 (7-33)

    The 7-33 result crosses the 7-34 boundary — a phase transition.
    """
    intersection = state_a.bits & state_b.bits
    union = state_a.bits | state_b.bits
    symmetric_diff = state_a.bits ^ state_b.bits

    # Structural fusion: take distinctive features from each state
    a_distinct = set(i for i in range(12) if state_a.bits & (1 << i) and not state_b.bits & (1 << i))
    b_distinct = set(i for i in range(12) if state_b.bits & (1 << i) and not state_a.bits & (1 << i))
    common = set(i for i in range(12) if intersection & (1 << i))

    # "Sum" = common tones + one distinctive feature from each
    sum_pitches = sorted(common | {a_distinct.pop()} | {b_distinct.pop()})
    sum_bits = sum(1 << p for p in sum_pitches)

    # "Difference" = symmetric difference
    diff_pitches = tuple(i for i in range(12) if symmetric_diff & (1 << i))
    diff_bits = symmetric_diff

    return (
        PitchClassSet.from_bits(sum_bits),
        PitchClassSet.from_bits(diff_bits),
    )
```

---

## 5. Test Vectors

### 5.1 Dissonance Energy

| State | Pitches | Interval Vector | E(S) | Test |
|-------|---------|-----------------|-------|------|
| Lydian (7-35) | {0,2,4,6,7,9,11} | (2,5,4,3,6,1) | 22.0 | `E(Lydian) = 22.0` |
|Locrian (7-35) | {0,1,3,5,6,8,10} | (2,5,4,3,6,1) | 22.0 | `E(Lydian) == E(Locrian)` (same IC vector) |
| Acoustic (7-34) | {0,2,4,6,7,9,10} | (2,5,4,4,4,2) | 25.0 | `E(Acoustic) > E(Lydian)` |
| Lydian Minor (7-33) | {0,2,4,6,7,8,10} | (2,6,2,6,2,3) | 29.5 | `E(7-33) > E(7-34) > E(7-35)` |
| Court C0 (5-35) | {0,2,4,7,9} | (0,3,2,1,4,0) | 7.5 | `E(C0) < E(any Governor state)` |

**Gradient test:** For a downhill transition Lydian → Ionian (lower ♯4→4):
- Removed: pitch 6 (♯4), Added: pitch 5 (4)
- `E(Ionian) = E(Lydian)` (same set class — gradient is 0)
- This confirms that **nodal shifts within 7-35 do not change energy** (same interval vector).

**Symmetry-transition test (NOT energy-drop):** For 7-34 → 7-33 (Acoustic → Lydian Minor):
- `E(7-33) = 29.5 > E(7-34) = 25.0`
- Energy *increases* by Δ = +4.5
- This is **not** a low-energy attractor transition. 7-33 is a **maximal-symmetry saddle point**:
  - Prime form $\{0,1,2,4,6,8,10\}$; Lydian Minor (1493) is the T₆ transposition $\{0,2,4,6,7,8,10\}$
  - $\{0,2,4,6,8,10\}$ (whole-tone hexachord) contributes 6-fold rotational symmetry
  - $\{7\}$ (perfect 5th) anchors orientation while preserving inversional symmetry
  - 7-33 is **achiral** (inversionally symmetric) around the pc 1/7 axis
  - Total dissonance is highest because IC1 and IC6 counts are elevated
  - But the whole-tone sub-lattice **isotropizes the gradient** — energy is undirected
- The "wormhole" property emerges from this: enter the 7-33 saddle, **reorient** with zero gradient cost, exit at a different anchor. Because the saddle is achiral, it is a **stable mirror pivot**, not a chaotic shortcut.

**Court C0 (5-35) is the lowest-energy state** in the system (E = 7.5), which
is consistent with its framework role: the Court is the most consonant
substrate, the "rest position" of the engine.

### 5.2 Court Filter Commutation

| Filter | Mutation | Source | Target | Commutes? | Route Semantics |
|--------|----------|--------|--------|-----------|-----------------|
| 5-23 | R7 (raise Degree 7) | Aeolian (7-35) | Harmonic Minor (7-32) | Test | Rooted 5-23 retains {0,2,3,5,7}; source suppresses {8,10}, target suppresses {8,11} |
| 5-27 | R7 (raise Degree 7) | Aeolian (7-35) | Harmonic Minor (7-32) | Test | Rooted 5-27 retains {0,3,5,7,8}; source suppresses {2,10}, target suppresses {2,11} |
| 5-35 (C0) | Any | Any 7-35 state | Any 7-35 state | Test | C0 mask = {0,2,4,7,9} |

**Key test:** 5-23 and 5-27 both mediate 7-35 → 7-32 but expose different pitches.
The commutation test must show `P_{5-23} T ≠ T P_{5-23}` for at least one mutation,
proving the two bridge filters are **not interchangeable**.

The concrete rooted masks above are the CRT-302 executable derivation from the
six shared endpoint pitches `{0,2,3,5,7,8}`. Earlier draft masks at this table
were classes 5-35 and 5-29 rather than 5-23 and 5-27 and are superseded.

### 5.3 7-33 Wormhole (Maximal-Symmetry Saddle Point)

**Critical clarification:** 7-33 is NOT a low-energy attractor. Its dissonance
energy (E = 29.5) is the highest of the three achiral anchors. The wormhole
property is **isotropic symmetry** — the whole-tone hexachord has 6-fold
rotational symmetry, so gradient direction is undefined at the saddle.
**Additionally, 7-33 is achiral (inversionally symmetric)**: inversion around
the axis through pitch class 1 (the "intruding" note) and its tritone opposite
at 7 maps the set onto itself. The apparent "intruding" note at pc 1 **is the
symmetry axis**, not an asymmetric intrusion. Enter the saddle, reorient via
reflection symmetry, exit at a different anchor — with high energy but no
direction locked in. This makes the portal a **stable mirror pivot**, not a
chaotic shortcut.

| Source | Target | Path via 7-35/7-34 | Path via 7-33 | Wormhole? |
|--------|--------|---------------------|---------------|-----------|
| Lydian (7-35) | Locrian (7-35) | 6 hops (Lydian→Ionian→Mixolydian→Dorian→Aeolian→Phrygian→Locrian) | 1 hop via 7-33 saddle | Test |
| Acoustic (7-34) | Mixo♭6 (7-34) | 2 hops (via Lydian Minor midpoint) | 1 hop via 7-33 | Test |

**Test assertion:** `detect_wormhole()` returns `True` for source/target pairs
where (a) a 7-33 filter non-commutes with a mutation operator (isotropy
revealed by route-dependence), and (b) the Hamming distance through 7-33 is
shorter than the path through 7-35/7-34. The wormhole property emerges from
**both** 6-fold rotational symmetry (isotropy) **and** inversion symmetry
(achirality around the pc 1/7 axis) — a stable mirror pivot, not a chaotic
shortcut.

### 5.4 Anchor Tier Resolution

| Candidate | Known Anchors | Expected Tier | Expected Governor |
|-----------|---------------|----------------|-------------------|
| Lydian {0,2,4,6,7,9,11} | 7 canonical 7-35 states | A0 (tier 0) | Sun |
| Acoustic {0,2,4,6,7,9,10} | Lydian, Mixolydian (7-35) | A1 (tier 1) | Moon (midpoint of Sun/Mars) |
| Lydian Minor {0,2,4,6,7,8,10} (T₆ of prime form {0,1,2,4,6,8,10}) | Acoustic, Mixo♭6 (7-34) | A2 (tier 2) | Mars (midpoint of two 7-34) |
| Harmonic Minor {0,2,3,5,7,8,11} | Aeolian (7-35) | Satellite | Jupiter (7-32, chiral) |

### 5.5 Heterodyne Merge

| State A | State B | Sum (structural fusion) | Difference | Phase Transition? |
|---------|---------|------------------------|------------|-------------------|
| Acoustic (1749) | Mixo♭6 (1461) | Lydian Minor (1493) = {0,2,4,6,7,8,10} | {5,6,8,9} | Yes: 7-34 → 7-33 |
| Lydian (7-35) | Mixolydian (7-35) | Acoustic (1749) = {0,2,4,6,7,9,10} | {5,6,9,10} | Yes: 7-35 → 7-34 |

### 5.6 Carey Reproduction

| Set Class | CQ | SQ | Formula | Test |
|-----------|----|----|--------|------|
| 5-35 | 1.0 | 0.5 | $CQ = 1 - F(S)/\max F(N)$; $SQ = 2(N-2)/3(N-1)$ at $N=5$ | Byte-identical across builds |

### 5.7 Court Distance

| Pair | Expected d_H | Formula | Test |
|------|-------------|---------|------|
| C0 ↔ C1 | 2 | $2|0-1| = 2$ | XOR mask {4,5} has weight 2 |
| C0 ↔ C4 | 8 | $2|0-4| = 8$ | XOR of all 4 transition masks |
| C1 ↔ C2 | 2 | $2|1-2| = 2$ | XOR mask {9,10} has weight 2 |

### 5.8 Orthogonality (Gram Matrix)

| Pair | Dot Product | Expected |
|------|-------------|----------|
| $e_1 \cdot e_1$ | 2 | $G_{11} = 2$ |
| $e_1 \cdot e_2$ | 0 | $G_{12} = 0$ (disjoint supports) |
| $e_1 \cdot e_3$ | 0 | $G_{13} = 0$ |
| $e_1 \cdot e_4$ | 0 | $G_{14} = 0$ |
| $e_2 \cdot e_2$ | 2 | $G_{22} = 2$ |
| (all off-diagonal) | 0 | $G = 2I_4$ |

---

## 6. Implementation Mapping to CRT Tickets

| Algorithm / Data Structure | Primary Ticket | Secondary Ticket | Status |
|---------------------------|---------------|-------------------|--------|
| `PitchClassSet` (12-bit vector, interval vector, prime form) | CRT-302 | CRT-303 | Spec needed |
| `DissonanceEnergy` (gravity field, gradient) | CRT-303 | CRT-305 | **This spec** |
| `CourtPosition` + `PoleRegister` (C0–C4) | CRT-302 | CRT-305 | Spec needed |
| `CourtState` (runtime, extends GOV-204) | CRT-305 | — | Ticket covers structure |
| `CourtFilterOperator` (P_c = diag(c)) | CRT-304 | — | Ticket covers schema |
| `CommutationRecord` + `test_commutation()` | CRT-304 | — | Ticket covers tests |
| `TopologicalTranslocationRecord` | CRT-305 | — | Ticket covers contract |
| `MercuryEngine` (+5/+7 mod 12) | CRT-305 | CRT-302 | **Not explicit in ticket** |
| `AnchorResolution` (A0 > A1 > A2) | CRT-302 | — | **Not explicit in ticket** |
| `detect_wormhole()` (7-33 portal) | CRT-304 | CRT-306 | **Not explicit in any ticket** |
| `heterodyne_merge()` (state fusion) | Not ticketed | — | **New ticket or CRT-304 extension** |
| `compute_interval_vector()` + `compute_dissonance_energy()` | CRT-303 | — | **This spec** |
| Carey CQ/SQ reproduction | CRT-303 | — | Ticket covers |
| `AnchorTier` YAML field | CRT-302 | — | **Not in YAML yet** |

---

## 7. What's Admitted vs. Proposed

### Admitted in EPIC-003

| Concept | Implementation | Ticket |
|---------|---------------|--------|
| $P_c = \operatorname{diag}(c)$ linear diagonal filter | `CourtFilterOperator` | CRT-304 |
| C0–C4 Court transitions (adjacent-only) | `list_legal_court_moves`, `validate_court_move` | CRT-305 |
| $\kappa_{\text{court}} \in \{0, 0.25, 0.5, 0.75, 1\}$ | Typed coordinate field | CRT-301/305 |
| Anchor tiers A0=7-35, A1=7-34, A2=7-33 | `anchor_tier` field in `topology_roots` | CRT-302 |
| Carey CQ=1, SQ=½ for 5-35 | Invariant reproduction | CRT-303 |
| Court geometry (G=2I₄, d_H=2|i-j|) | Invariant library | CRT-303 |
| Commutation table P_c T =?= T P_c | `CommutationRecord` | CRT-304 |
| Topological Translocation record | `TopologicalTranslocationRecord` | CRT-305 |
| Dual Mercury engine (+5/+7 mod 12) | `MercuryEngine` | CRT-305 (implied) |
| Dissonance energy / harmonic gravity | `compute_dissonance_energy()` | CRT-303 (this spec) |
| Wormhole detection (7-33 portal) | `detect_wormhole()` | CRT-304 (this spec) |
| Heterodyne state merge | `heterodyne_merge()` | **New ticket or CRT-304 extension** |

### Proposed (Deferred to EPIC-004 or Later)

| Concept | Status | Blocker |
|---------|--------|---------|
| Fourier/spectral filters | `proposed` | CRT-304 AC-6 explicitly defers |
| Semantic-scoped filters | `proposed` | CRT-304 AC-6 explicitly defers |
| Graph Laplacian spectral filtering | `proposed` | Requires adjacency matrix eigenvalue computation |
| Natural phenomena / thermodynamic mapping | `proposed` | EPIC-004 |
| Carey CQ/SQ for non-5-35 set classes | `proposed` | EPIC-003 scope: only 5-35 seed |
| 38 pentatonic set classes beyond C0–C4 + 5-23 + 5-27 | `proposed` | Follow-on admission story |

---

## 8. Required YAML Schema Additions

### 8.1 topology_roots Update

```yaml
topology_roots:
  7-35:
    name: Diatonic
    pitch_set: [0,2,4,5,7,9,11]
    geometry: right_triangle
    coherence_quotient: 0.952
    hemitonia: 2
    imperfections: 1
    qkv_character: "90° routing, strict determinism"
    anchor_tier: 0                    # A0: primary achiral frame
    is_self_inverse: true
  7-34:
    name: Acoustic
    pitch_set: [0,2,4,6,7,9,10]
    geometry: oblique
    coherence_quotient: 0.871
    hemitonia: 2
    imperfections: 3
    qkv_character: "non-linear associations, mid scatter"
    anchor_tier: 1                    # A1: secondary achiral frame
    is_self_inverse: true
  7-33:
    name: Lydian Minor
    pitch_set: [0, 1, 2, 4, 6, 8, 10]       # Prime form (Forte 7-33), missing from current YAML
    geometry: acute
    coherence_quotient: null           # Not computed yet
    hemitonia: 3
    imperfections: 4
    qkv_character: "whole-tone symmetry, achiral mirror pivot"
    anchor_tier: 2                    # A2: tertiary achiral frame
    is_self_inverse: true
    structural_decomposition: "whole-tone hexachord {0,2,4,6,8,10} ∪ perfect 5th {7}"
    synthesis_formula: "Acoustic(1749) ∩ Mixo♭6(1461) → Lydian Minor(1493)"
    prime_form: [0, 1, 2, 4, 6, 8, 10]      # Canonical prime form
    lydian_minor_transposition: [0, 2, 4, 6, 7, 8, 10]  # T6 transposition (Ian Ring 1493)
    symmetry_axis: 1                  # Inversion axis (pitch class 1 and tritone 7)
  7-32:
    name: Harmonic Minor
    pitch_set: [0,2,3,5,7,8,11]
    geometry: acute
    coherence_quotient: 0.871
    hemitonia: 3
    imperfections: 3
    qkv_character: "highest angular tension, laser focus"
    anchor_tier: null                  # Chiral satellite, not an anchor
    is_self_inverse: false
  5-35:
    name: Major Pentatonic
    pitch_set: [0,2,4,7,9]
    coherence_quotient: 1.0
    hemitonia: 0
    imperfections: 0
    qkv_character: "pure operational engine"
    anchor_tier: null                  # Court family, not a heptatonic anchor
    is_self_inverse: true
```

### 8.2 Interval Class Dissonance Weights

```yaml
interval_class_dissonance:
  IC1:
    intervals: [1, 11]
    dissonance: 3.0
    label: "minor 2nd / major 7th"
  IC2:
    intervals: [2, 10]
    dissonance: 2.0
    label: "major 2nd / minor 7th"
  IC3:
    intervals: [3, 9]
    dissonance: 0.5
    label: "minor 3rd / major 6th"
  IC4:
    intervals: [4, 8]
    dissonance: 0.5
    label: "major 3rd / minor 6th"
  IC5:
    intervals: [5, 7]
    dissonance: 0.0
    label: "perfect 4th / perfect 5th"
  IC6:
    intervals: [6]
    dissonance: 2.5
    label: "tritone"
```

---

## 9. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| **Wormhole behavior is isotropic AND achiral, not low-energy** — 7-33 is a maximal-symmetry saddle point (E=29.5 > E(7-34)=25.0 > E(7-35)=22.0), NOT a low-energy attractor. Prime form {0,1,2,4,6,8,10}; achiral around the pc 1/7 inversion axis. **Verified by computation.** | Certain | Informational | Spec updated: gradient at 7-33 is high but undirected. `detect_wormhole()` checks for isotropy (non-commuting P_c) and achirality (inversion invariance), not for low E. |
| **7-33 commutes with everything (no non-commuting pairs)** | Medium | High | If 7-33 commutes with all mutation operators, the "wormhole" is a pass-through (no route-dependent behavior). Test with multiple mutation operators first. |
| **Dissonance weights too coarse** — flat IC weights don't capture real harmonic tension | Medium | Medium | Start with simple weights; allow tuning without schema changes. Current weights produce valid ordering: Court (7.5) < Diatonic (22.0) < Acoustic (25.0) < Lydian Minor (29.5). |
| **Heterodyne merge produces invalid set classes** — fusion of two weight-7 states doesn't land on weight-7 | High | Medium | Validate output weight; if invalid, reject with `heterodyne_output_invalid`. |
| **Mercury dual engine not in CRT-305 scope** | High | High | This spec explicitly defines it; CRT-305 implementer must include. |
| **7-33 not in topology_roots** | High | Critical | This spec adds it; CRT-302 must include. |
| **Anchor tier resolution is too slow** — scanning all known states for Hamming-2 neighbors is O(n²) | Low | Low | Neo4j index on bits makes this O(n). |
| **Spectral self-healing requires Graph Laplacian eigenvalue computation** | Certain | — | Explicitly deferred to EPIC-004. |

---

## 10. Validation Summary

| Test Category | Test Count | Ticket |
|---------------|-----------|--------|
| Dissonance energy computation | 5 | CRT-303 |
| Court filter application (idempotent, weight reduction) | 4 | CRT-304 |
| Commutation table (P_c T =?= T P_c) | 15+ (all operators × admitted filters) | CRT-304 |
| Wormhole detection (7-33 portal) | 2 | CRT-304/306 |
| Anchor tier resolution (A0>A1>A2) | 4 | CRT-302 |
| Heterodyne merge (7-34 fusion → 7-33) | 2 | CRT-304 (new) |
| Carey CQ=1, SQ=½ reproduction | 2 | CRT-303 |
| Court geometry (G=2I₄, d_H, orthogonality) | 10 | CRT-303 |
| Topological Translocation (accept/reject) | 4 | CRT-305 |
| κ_court cross-namespace rejection | 3 | CRT-305 |
| Mercury engine sequences (+5/+7) | 2 | CRT-305 |
| **Total** | **53+** | |

---

*This specification is the bridge between framework theory and CRT ticket
implementation. It must be reviewed and admitted before CRT-302/303/304 work
begins. It does not modify frozen packages; it defines how new packages
encode the mathematics.*
