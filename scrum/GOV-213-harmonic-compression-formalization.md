# GOV-213 - Scoped A-tier harmonic-compression formalization

**Status:** Done · **Priority:** High · **Points:** 8 · **Epic:** Proposed EPIC-005 formal completion
**Depends on:** GOV-212, `CH_A012_q_v1` theorem · **Blocks:** GOV-214 evidence sequencing only; global extension remains separate

## Story

As a release maintainer, I want the independently reproduced A0-A2 rooted-triad
theorem compiled into a strict, deterministic, root-owned sidecar so the 21
canonical anchors expose an admitted Triadic Compression Signature `Q(S)` and
bounded weighted projection `W_A012(S)` without silently defining a global
aggregate `harmonic.C_H` or modifying frozen packages.

## Agreed scope

- Admit `Q(S)` and `W_A012(S)` only for records satisfying both
  `role=anchor` and `tier in {A0,A1,A2}`.
- Identify the scoped coordinate as `harmonic.CH_A012_q_v1`.
- Preserve global `harmonic.C_H` as `unresolved` with `value=null`.
- Use `q_v1` as an authored ordinal triadic encoding, not physical,
  psychoacoustic, thermodynamic, photonic, or semantic energy.
- Use the exact feasible weight witness
  `(116,56,41,35,77,44,38)/407`; do not claim uniqueness.
- Reuse the existing root-owned access to `court_mathematics.DegreeTriad` for
  derivation while leaving every frozen package byte unchanged.
- Defer D1-D7 anchors, satellites, convergence states, junctions, leaves,
  boundaries, full 462-state collision analysis, mutation-operator deltas, and
  `C_P`/`C_H`/`C_S` correspondence tests to separately activated work.

## Implementation plan

1. Add strict candidate-release and validation schemas under
   `schemas/harmonic-compression-candidates/`.
2. Add root-owned derivation and verification logic in
   `src/governor/harmonic_compression.py` and a deterministic Python builder at
   `scripts/generate-harmonic-compression-candidates.py`.
3. Emit the canonical sidecar under
   `canonical/harmonic-compression-candidates/` with exact ratios, source
   bindings, scope, per-state signatures, tier summaries, invariant results,
   and a self-fingerprint.
4. Add adversarial fixtures, focused Python tests, and a root validator that
   checks schema closure, fresh build identity, source hashes, theorem values,
   scope rejection, weight constraints, and the unchanged global `C_H` guard.
5. Bind the scoped admission in release, authority, theorem, decision-ledger,
   QA, and Scrum records; refresh manifest/checksums and validate twice.

## Acceptance criteria

1. The canonical sidecar contains exactly 21 records and is reproducible from
   the canonical ledger through one command.
2. Every `Q(S)` and exact `W_A012(S)` value is independently recomputed; the
   21/21 seat invariant, tier multisets, sums, A0 ordering, and strict A-tier
   bands pass.
3. Negative fixtures reject tier-only satellite selection, boundary selection,
   invalid Chaldean weights, source-hash drift, signature tampering, and a
   non-null global `harmonic.C_H` substitution.
4. Joint transposition/root normalization and modal `M^7` closure are tested
   where the scoped model claims invariance or covariance.
5. The candidate has strict schemas, exact source and algorithm fingerprints,
   canonical float-free serialization, build-twice identity, and a validation
   report fingerprint.
6. The existing harmonic-invariant package, Court Mathematics package, profile
   registry, and all other frozen package payloads remain byte-identical.
7. Authority and release records state that the sidecar is admitted only in its
   A0-A2 scope and that global `harmonic.C_H` remains unresolved/null.
8. Focused tests and two consecutive full root validation runs pass at manifest
   and checksum fixed point before this story moves to Done.

## Explicit non-goals

- No global scalar theorem over all 462 rooted states.
- No office inference from `Q`, `W_A012`, or `argmax`.
- No change to State Governor or Degree Governor authority.
- No `C_P`, `C_S`, `kappa_court`, natural-phenomenon, or thermodynamic
  equivalence.
- No claim that the Fibonacci observation is causal or canonical.
- No activation of follow-on story numbers by implication.

## Definition of done

The root-owned sidecar, schemas, builder, adversarial fixtures, tests,
validation report, release binding, authority record, decision-ledger entry,
theorem references, and Scrum closure are complete; global `harmonic.C_H`
remains null; all frozen package identities remain unchanged; manifest and
checksums match; and full validation passes twice.

## Closure evidence

- Canonical sidecar contains 21/21 scoped anchor records and preserves global
  `harmonic.C_H` as unresolved/null.
- GOV-213 validator passes 12/12 checks, including build-twice and
  reordered-input identity, joint transposition, modal `M^7`, theorem closure,
  and namespace safety.
- Six adversarial tamper cases and nine focused Python tests pass.
- Root release 1.5.0 binds the scoped coordinate without modifying any frozen
  package identity; full validation and final manifest evidence are recorded by
  the integrated release report.
