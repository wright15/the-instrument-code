# CRT-349 — Teleological Physics Registry (Court Transition Registry)

**Status:** Done · **Priority:** Medium · **Points:** 5 · **Epic:** pre-EPIC-400 follow-on (planned; no epic activated)
**Depends on:** CRT-305 (Court runtime policy), CRT-309 (admission), CRT-347/CRT-348 (Fivefold teleology + promotion) · **Blocks:** —

## Story

As the release owner, I want the 8 directional Court transitions mapped to
their electromagnetic symbolic anchors as a Layer-4 translation dictionary,
so the Electric (External) and Magnetic (Internal) pole semantics have a
deterministic, validated, proposed registry that shades rendering without
owning or executing any transition.

## Context

The architectural blueprint (`docs/ARCHITECTURAL_BLUEPRINT.md`) records the
dual-core separation: Photonic `C_P` for the 7-Governor ontology layer and
authored Electric/Magnetic correspondence for the 4-pole Court teleology
layer. The semantic operator registry v1.0.1 already provides Layer-4
symbolic anchors for the 15 heptatonic mutation operators; this registry
provides the Court-side counterpart.

Every equation in this registry is a `symbolic_anchor` string. The registry
is `admission_status: proposed` with `physical_quantity_claim: false`,
`no_electromagnetic_equivalence: true`, and zero runtime, graph, policy,
ledger, or admission effect. The CRT-305 runtime remains the sole owner of
Court transitions; the registry's rendering model
`CourtTransitionRender(s, t) = IntrinsicCourtState(s) ⊕ EM_Delta(t)` is a
planning model only.

## Tasks

- [x] Author `schemas/teleological_physics_registry_v1.0.0.yaml`: 8
      transitions replaying `ordinaryMoves` + harmonic `xorSupports`
      exactly, pole definitions (0 Electric/External, 1 Magnetic/Internal),
      Mercury engine interface (not a transition), 8 guards.
- [x] Author the strict JSON Schema (`teleological-physics-registry-v1.0.0.schema.json`).
- [x] Build the independent validator
      (`scripts/validate-teleological-physics-registry.py`) with 15 named
      checks and 9 adversarial mutations; emit
      `qa/teleological-physics-registry-validation.json`.
- [x] Add `tests/test_teleological_physics_registry.py` (9 tests).
- [x] One additive `proposed` row in `provenance/SOURCE_AUTHORITY.md`.
- [x] Refresh manifest/checksums; run full root validation to a fixed point.

## Acceptance criteria

- **AC-1**: schema-valid; `admission_status: proposed`;
  `physical_quantity_claim: false`.
- **AC-2**: the 8 transitions exactly replay policy `ordinaryMoves`; XOR
  supports replay the harmonic registry (`{4,5}`, `{9,10}`, `{2,3}`, `{7,8}`);
  pole changes replay the position vectors.
- **AC-3**: Mercury is engine-only: no bit, no XOR support, no pole change.
- **AC-4**: no forbidden relations (`SETS_COURT_POLE`, `EXECUTES_COURT_MOVE`);
  no Court writes; `kappa_court` read-only replay; global `C_H` untouched; no
  thermodynamic equivalence.
- **AC-5**: Saturn-advance and Venus-advance anchors align with the semantic
  registry's R1/R5 anchors (Bragg's law, surface tension).
- **AC-6**: validator 15/15 PASS; pytest 9/9; root validation PASS.

## Verification

```bash
python3 scripts/validate-teleological-physics-registry.py
python3 -m pytest -p no:cacheprovider -q tests/test_teleological_physics_registry.py
npm run validate
```

**Results (2026-08-18):** validator 15/15 PASS; pytest 9/9; root validation
PASS; manifest and checksums refreshed.

## Definition of done

All acceptance criteria pass; the registry remains `proposed` with zero
authority effect; SOURCE_AUTHORITY carries one additive proposed row; no
runtime, graph, policy, ledger, CRT-310, decision-ledger, or frozen-toolkit
change occurred.

## Documented follow-up — runtime execution of symbolic EM anchors

**Status: future consideration only. Not scheduled, not admitted.**

The registry's equations exist solely as `symbolic_anchor` strings; their
symbolic existence is sufficient for the current architecture. A future story
may consider making the runtime numerically evaluate selected anchors (for
example, a game or simulation engine deriving drag, induction, or field
magnitudes from Court state).

That work, if ever pursued, would require:

1. a separate admission gate with `physical_quantity_claim` reconsidered per
   anchor — the current false claim is global and binding;
2. SI units, value ranges, and numeric semantics per admitted anchor;
3. a policy-level write path (a new runtime namespace), since the CRT-305
   policy admits no physical computation today;
4. proof that numeric evaluation never redefines Court state, `kappa_court`,
   or global `harmonic.C_H`; and
5. decision-ledger and SOURCE_AUTHORITY amendments at activation time.

Until that gate exists, the symbolic layer remains the operative contract.
