# Seven Governors: Toward Deterministic Structured State Representation

**Technical report — working proposal (v0.1 draft)**

**Author:** Erick Wright
**Date:** 2026-08-07
**Status:** Work in progress. This document describes an approach in active
development and states where the mathematics and logic are pointing. Verified
results are marked **[Proven]** and backed by the executable suite in this
repository. Design directions are marked **[Proposed]** or **[Unresolved]**
and are hypotheses the author intends to prove with further work.

**Cite as:**
> Erick Wright. *Seven Governors: Toward Deterministic Structured State
> Representation.* 2026. MIT license for code; CC BY 4.0 for curated data.
> https://github.com/wright15/the-instrument-code

**Archived snapshot:** `<ZENODO-DOI>` (add DOI after archival).

---

## Abstract

This report introduces Seven Governors, a computational research program that
organizes a complete rooted-heptatonic field into a deterministic, auditable,
and graph-projectable structure. The program rests on three layers: (1) a
canonical 462-state pitch-class field with an exact subset and tertian
structure, (2) a family of harmonic compression coordinates and a Court filter
algebra with exact, idempotent operations, and (3) a runtime that binds every
operation to a fingerprint, validates fail-closed before any effect, and keeps
an append-only, tamper-evident ledger. The mathematical core is fully
executable and the verification suite proves a concrete set of invariants today
(Section 7). The long-term research hypothesis — still unproven — is that this
kind of exact, provenance-bound symbolic layer offers a deterministic
complement to stochastic machine intelligence.

---

## Status legend

| Marker | Meaning |
|---|---|
| **[Proven]** | Enforced by the executable verification suite in this repository. |
| **[Proposed]** | Design is documented; not yet admitted or fully implemented. |
| **[Unresolved]** | Explicitly not yet resolved by design; the report says so rather than assuming it. |

---

## 1. Introduction and motivation

Mainstream machine learning operates on statistical inference over continuous
representations. This is enormously capable and, at the same time, non-
deterministic and difficult to audit. Seven Governors explores the complementary
direction: **canonical, discrete, provenance-bound structure** that can be
derived, verified, and replayed exactly. The premise is not that symbolic
structure replaces statistical learning, but that a deterministic layer —
an "instrument," in the project's sense — can ground, constrain, and audit it.

Music theory provides an unusually mature formal laboratory for this idea:
a finite, well-understood pitch-class universe (`Z_12`) with published
mathematical structure (Forte set classes; well-formed-scale theory; voice-
leading geometry). The project builds a complete rooted field over that
universe, attaches exact coordinates, and wraps it in a deterministic runtime.

## 2. Background

- **Pitch-class set theory.** Forte's set theory classifies the 4096 subsets
  of the twelve pitch classes into 224 `TnI` equivalence classes [1]. The
  interval vector and prime form are the two principal invariants.
- **Well-formed and pairwise well-formed scales.** Carey's coherence (`CQ`) and
  sameness (`SQ`) quotients formalize how close a scale is to a maximally
  generated "well-formed" state [2]. For the 5-35 pentatonic set class these
  take the exact values 1 and 1/2 (Section 5).
- **Voice leading.** Minimum voice leading between equal-cardinality sets is an
  assignment (bijection) problem under circular pitch-class distance [3]; the
  resulting metric satisfies the triangle inequality (Section 7).
- **Source data.** The 462 rooted heptatonic states are enumerated and audited
  from the publicly available Ian Ring scale database [4], normalized to root
  pitch class 0.

## 3. The canonical field

**Definition.** The field `S` is the set of 12-bit masks with exactly seven set
bits and bit 0 set (rooted at pitch class 0). `|S| = 462` **[Proven]**.

Each state derives an exact structure:

| Structure | Per state | Total (462 states) |
|---|---:|---:|
| Dyads (2-subsets) | 21 | 9,702 |
| Trichords (3-subsets) | 35 | 16,170 |
| Subset incidences | 105 | 48,510 |
| Degree-stacked triads | 7 | 3,234 |

All four counts are enforced for every one of the 462 states by the
verification suite, which also recomputes each state's harmonic profile
fingerprint from scratch **[Proven]** (Section 7).

**Design position.** Because every state is a rooted mask, identity is a
number, and every derived object (dyad, trichord, triad, coordinate) is a
deterministic function of that number. There is no hidden state.

## 4. Harmonic coordinates

Each rooted state carries a coordinate tuple `C_h = (H_t, H_v, H_c, H_s)`:

- `H_t` — tension descriptors (interval-vector, step-interval, leading-tone
  presence).
- `H_v` — voice-leading coordinate (identity distance and single-semitone
  move inventory). **[Proposed]** metric status: the metric itself is proven to
  satisfy the triangle inequality; its musical semantics remain provisional.
- `H_c` — chordal coordinate: the full 21/35/105 subset lattice plus the seven
  degree triads and their quality counts.
- `H_s` — symmetry coordinate: prime form, interval vector, and
  transpositional/inversional stabilizers.

An aggregate compression `C_H` is **explicitly `[Unresolved]`**: the four
coordinates are not shown to totalize, and the project does not claim a single
scalar compression until the algebra is established.

## 5. Court algebra

The Court layer organizes a subset of the field into an algebra with exact
operations.

- **Filter operators.** A Court filter `P_c` is the linear diagonal operator
  `P_c(x) = x AND c` over 12-bit masks. Idempotence
  `P_c(P_c(x)) = P_c(x)` holds for **every** 12-bit mask pair
  (1,892,352 pairs checked, zero violations) **[Proven]**.
- **Carey quotients.** For the 5-35 set class, `CQ = 1` and `SQ = 1/2` under
  exact rational arithmetic, using the cited definitions and the
  full-convergent/well-formed premises **[Proven as a formula proof]**.
  A generic independent failure/difference enumerator is not yet implemented,
  so these values rest on the stated premises rather than on an independent
  evaluator.
- **Commutation.** Compositions of filters and mutation operators are classified
  into a five-valued result space: `commutes`, `does_not_commute`,
  `left_undefined`, `right_undefined`, `both_undefined`. For example,
  filtering Aeolian `1453` with the C2 mask then applying `R7` is undefined,
  because `R7` requires a seven-note input; the reverse order is defined
  **[Proposed]**, demonstrated on the fixture.
- **Pentatonic positions.** The canonical `C0–C4` rooted positions and their
  pole registers are a **[Proposed]** substrate. The runtime ledger records
  only adjacent canonical transitions (`court:advance` / `court:retreat`) and
  rejects all others **[Proven]**.

## 6. Deterministic runtime

The runtime binds every operation to exact, reproducible identity:

- **Fingerprint-bound context.** A state's `context_sha256` is a hash of the
  exact harmonic identities (subject, profile, release, rule set) it is bound
  to. Tampering with any component changes the fingerprint and is rejected.
- **Fail-closed validation.** A move is validated in this order: identity
  checks, parameter normalization, harmonic validation, then token issuance.
  Any failure issues no token, runs no reducer, and appends no ledger event
  **[Proven]**.
- **Tamper-evident ledgers.** Both the governor (`AgentState`) and the parallel
  Court runtime keep append-only hash-chained ledgers. Replay reconstructs the
  exact final state byte-for-byte; modifying, deleting, inserting, or reordering
  events is detected at the first failing sequence **[Proven]**.
- **Graph projection.** A deterministic, idempotent projection exports the
  field, the Court records, and the verified ledgers to Neo4j. Full wipe and
  re-import reproduces the identical graph, node for node **[Proven]**.

## 7. Verification

All **[Proven]** markers are enforced by the executable suite
(`tests/verification/`, `court-mathematics/`, `tests/court_graph/`):

| Invariant | Result |
|---|---:|
| Rooted heptatonic states | 462 |
| Dyads / trichords / incidences / degree triads per state | 21 / 35 / 105 / 7 |
| Unique verified profile fingerprints | 462 |
| Court-filter idempotence pairs | 1,892,352 (0 violations) |
| Ground pitch-class triangle comparisons | 1,728 (0 violations) |
| Property-based voice-leading triples | 100 (0 violations) |
| Mutation operators / applications | 15 / 3,402 |
| Operator domains: modal / local | 462 / 210 |
| Commutation pairs / equal squares / mismatches | 91 / 7,644 / 0 |
| `R7(1453) = 2477` (`d_H = 2`, `d_VL = 1`) | Proven |
| Ledger replay / tamper detection (governor + Court) | Proven |

The suite, including native live-Neo4j parity, passes in full. A deterministic
report is regenerated by `scripts/run-phase4-verification.py`.

## 8. Discussion — where the logic points

Three observations motivate the research program:

1. **Exactness is a feature.** A representation in which every derived object
   is a deterministic function of a small integer is trivially auditable,
   replayable, and projectable. This is the property that statistical models
   lack and that any accountability-critical system needs.
2. **A complete field is a structured state space.** The 462 states with their
   exact subset lattices form a finite, navigable state space — the kind of
   substrate on which controlled symbolic reasoning can be defined and tested
   before generalizing to larger or continuous domains.
3. **Deterministic grounding may complement learned systems.** The
   long-standing hypothesis is that a provenance-bound symbolic layer can
   constrain, verify, and steer stochastic inference. This is **not yet
   demonstrated**; it is the direction the author intends to prove with further
   work. This report's contribution is the verified mathematical core on which
   that program can be built.

## 9. Future work

- Implement the independent Carey failure/difference enumerator so `CQ` and
  `SQ` are derived, not premise-based.
- Resolve or rigorously justify the aggregate `C_H` coordinate.
- Complete the pentatonic substrate (`C0–C4`), pole registers, and the
  translocation contract; admit them through the project's decision process.
- Connect the runtime to learned systems and study whether the exact layer
  measurably improves determinism, auditability, or controllability.
- Publish this material as an arXiv preprint (candidate categories:
  `cs.AI`, `cs.SY`, `math.CO`) with the Zenodo DOI as permanent evidence of
  priority.

## References

1. A. Forte, *The Structure of Atonal Music*, Yale University Press, 1973.
2. N. Carey, "Coherence and sameness in well-formed and pairwise well-formed
   scales," *Journal of Mathematics and Music* 1(2), 79–98, 2007.
   DOI: 10.1080/17459730701376743
3. D. Tymoczko, *A Geometry of Music: Harmony and Counterpoint in the Extended
   Common Practice*, Oxford University Press, 2011.
4. I. Ring, "All the scales," https://ianring.com/musictheory/scales/
   (audited as the source of the canonical ledger in this repository).
