# CRT-303 — Harmonic-invariant library and Carey CQ/SQ evaluation

**Status:** **Done** · **Priority:** High · **Points:** 8 · **Epic:** [EPIC-003](EPIC-003-pentatonic-court-admission.md)

> **Completion note (2026-08-09):**
> `seven-governors-harmonic-invariants-v0.1.0` computes the Court geometry,
> exact `kappa_court`, and scoped Carey 5-35 results from the fingerprinted
> CRT-302 substrate. The Carey evaluator independently enumerates 20 directed
> intervals, 40 difference slots, and 150 cross-generic comparisons, yielding
> `D=20`, `F=0`, `CQ=1`, and `SQ=1/2`. Aggregate `C_H` remains explicitly
> unresolved. The package remains `proposed_pending_crt_309`.
**Depends on:** CRT-302 · **Blocks:** CRT-304, CRT-306

## Story

As a Court runtime author, I want an executable library that proves the
canonical 5–35 Court harmonic invariants — Gram matrix $G_{\text{Court}}=2I_4$,
Hamming distance $d_H(C_i,C_j)=2|i-j|$, disjoint XOR supports, weight-5
invariant, and Norman Carey's Coherence Quotient $\mathrm{CQ}(5\text{–}{35})=1$
and Sameness Quotient $\mathrm{SQ}(5\text{–}{35})=\tfrac12$ — so the
$C_H$ compression namespace is machine-computable and provably distinct
from $C_P$, $C_S$, and $\kappa_{\text{court}}$.

## Context

`framework/TOPOLOGICAL_ANCHORING.md` §4 and `framework/AGENTS.md` establish
the following invariants for the canonical 5–35 Court seed
$S=\{0,2,4,7,9\}$:

- Each adjacent Court transition swaps exactly one pitch and one pole
  register; the four XOR supports $\{4,5\}$, $\{9,10\}$, $\{2,3\}$,
  $\{7,8\}$ are disjoint.
- The signed transition vectors $e_i$ have Gram matrix $e_i\cdot e_j=0$
  for $i\ne j$ and $e_i\cdot e_i=2$, so $G_{\text{Court}}=2I_4$.
- Court distance is exact: $d_H(C_i,C_j)=2|i-j|$.
- Every Court state has weight 5 on a 12-bit field.
- Carey's Coherence Quotient gives $\mathrm{CQ}(5\text{–}{35})=1$ (perfect
  coherence, no generic-to-specific interval-order failures) and
  Sameness Quotient $\mathrm{SQ}(5\text{–}{35})=\tfrac12$ for the
  12-TET `7/12`-generated five-note scale. Source: Carey 2007, DOI
  10.1080/17459730701376743.

The $C_H$ namespace is currently mathematical prose; it must become
executable to support CRT-304's commutation tests, CRT-305's runtime guard
that $\kappa_{\text{court}}\ne C_H$, and the SC-3 invariant-integrity gate.

## Tasks

- [x] Create a new versioned `harmonic-invariants` package dependent on the
      CRT-302 substrate rather than the frozen `fivefold_engine.yaml`.
- [x] Implement the Gram matrix computation over the four signed Court
      transition vectors $e_i$ taken from the XOR supports
      $\{4,5\}, \{9,10\}, \{2,3\}, \{7,8\}$; prove $G_{\text{Court}}=2I_4$.
- [x] Implement Hamming distance $d_H$ over the five canonical Court masks;
      prove $d_H(C_i,C_j)=2|i-j|$ for all $i,j\in\{0,1,2,3,4\}$.
- [x] Implement a disjoint-support check asserting the four XOR sets share
      no pitch.
- [x] Implement the weight-5 invariant over all admitted Court states.
- [x] Implement Norman Carey's Coherence Quotient $\mathrm{CQ}$ and Sameness
      Quotient $\mathrm{SQ}$ for the canonical 5–35 seed; reproduce
      $\mathrm{CQ}=1$ and $\mathrm{SQ}=\tfrac12$ under 12-TET.
- [x] Mark the $C_H$ namespace in the schema as a fourth compression
      coordinate distinct from $C_P$ (GOV-202 photonic),
      $C_S$ (semantic gradient), and $\kappa_{\text{court}}$ (CRT-305
      runtime); add the guard "$C_H$ is a derived harmonic property, not a
      photonic measurement, not a thermodynamic quantity".
- [x] Add schema-validated provenance citing Carey 2007 (DOI
      10.1080/17459730701376743) as the formal source of CQ/SQ; add
      document-internal provenance citations for $G_{\text{Court}}$,
      $d_H$, and the disjoint XOR supports.
- [x] Add deterministic `--check` and `--emit` build modes with source
      hashes; two clean builds reproduce every invariant value byte-identically.

## Acceptance criteria

- **AC-1**: the Gram matrix computation returns exactly $2I_4$ with
  byte-identical output across two clean builds; deviations are rejected
  with a machine-readable diagnostic naming the violating entry.
- **AC-2**: the Hamming distance function returns $2|i-j|$ for every pair
  $i,j\in\{0,1,2,3,4\}$ and rejects any off-path mask that does not satisfy
  the formula.
- **AC-3**: the disjoint-support check passes for the four canonical XOR
  sets and fails (with the overlapping pitch named) for any contrived
  overlapping set.
- **AC-4**: the weight-5 invariant holds for each of the 5 canonical Court
  states; a contrived weight-4 or weight-6 mask is rejected.
- **AC-5**: $\mathrm{CQ}(5\text{–}{35})=1$ and
  $\mathrm{SQ}(5\text{–}{35})=\tfrac12$ reproduce within declared tolerance
  across two clean builds; a non-canonical seed (e.g. 5–23 only) is
  rejected by the Carey computation or returns `unresolved` per the
  admission scope, never a fabricated number.
- **AC-6**: the $C_H$ guard is a machine-readable literal asserting that
  $C_H$ is not $C_P$, $C_S$, $\kappa_{\text{court}}$, temperature, entropy,
  enthalpy, or free energy; the runtime cannot silently equate $C_H$ with
  any of those.
- **AC-7**: provenance for every invariant cites Carey 2007 (DOI) or a
  document-internal reference; missing provenance is a schema failure.

## Verification

Run positive fixtures for $G_{\text{Court}}=2I_4$, $d_H=2|i-j|$, disjoint
supports, weight-5, $\mathrm{CQ}=1$, $\mathrm{SQ}=\tfrac12$. Run negative
fixtures: overlapping XOR supports, wrong-weight mask, off-cycle $T_5$
entry, non-canonical seed claiming Carey computation. Compare canonical
output bytes across two clean builds in separate processes.

Evidence is recorded in
`seven-governors-harmonic-invariants-v0.1.0/qa/validation-report.json`,
`seven-governors-harmonic-invariants-v0.1.0/qa/determinism-report.json`, and
`tests/verification/test_harmonic_invariant_registry.py`. The production
enumerator is also used directly by `scripts/run-phase4-verification.py`.

## Definition of done

The `harmonic-invariants` package, schema, library functions, Carey evaluator,
disjoint-support and weight checks, provenance, builder, and fixture suite
are committed; all positive fixtures reproduce expected values and all
negative fixtures fail for the expected reason; determinism passes twice;
the $C_H$ guard is machine-readable; provenance and source authority records
cite Carey 2007 and the framework documents; package/root validation,
documentation, manifest, and checksums are green.
