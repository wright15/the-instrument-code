# Admission Record — Governor runtime and court-mathematics (candidate-but-evidenced)

**Record ID:** ADM-2026-08-07-01
**Date:** 2026-08-07
**Status:** Admitted as **candidate-but-evidenced** (full ceremony pending)
**Decision ledger:** see `provenance/DECISION_LEDGER.md`, "Phases 1–4 closure" entry

## Admission scope

| Surface | Status |
|---|---|
| Governor runtime (`src/governor/`): GOV-203 classification, GOV-204 transition engine + hash-chained ledger, GOV-205 verification/loop guards, GOV-206 graph read projection, GOV-207 agent skills | **Admitted (evidenced candidate)** |
| `court-mathematics` package: pitch-class primitives, subset lattice, degree triads, voice leading, harmonic coordinates, exact rational serialization | **Admitted (evidenced candidate)** |
| CRT-306 Court Neo4j projection, bounded query catalog, deterministic generator | **Admitted (evidenced candidate)** |
| Phase 4 verification suite and deterministic structural-proof report | **Admitted (evidenced)** |
| Pentatonic topology, Court/Fivefold, natural-phenomena material | **Proposed** (not admitted) |
| Aggregate `C_H` | **Unresolved** |
| Carey CQ/SQ (5-35) | Exact formula proofs under cited 12-TET premises; no independent enumerator admitted |
| Voice-leading metric semantics | Structurally proven; musically **provisional** |
| `kappa_court`, pole registers, translocation, Court session store | **Not implemented** (open on CRT-305) |

## Evidence

- Root validation `qa/integrated-release-validation.json`: **PASS**, 136/136.
- Root pytest: **195 passed**; `court-mathematics`: **52 passed**.
- GOV-206 Node contract suite: **33 passed**; native live-Neo4j Court parity:
  **passed** (byte-exact rows, full property comparison, reset/rebuild).
- Phase 4 structural proofs: `tests/verification/` (23 tests) plus
  `scripts/run-phase4-verification.py --run-integration` emitting status
  `PASS`.
- Topology locks for `1749`, `2477`, `223` asserted against canonical JSON and
  Neo4j CSV projections.

## Admissions definitions

1. **Evidenced** means the executable suite enforces the claim; prose is never
   accepted as proof (global scrum DoD item 3).
2. **Candidate-but-evidenced** means the implementation and proofs are
   accepted for research/reference use without canonical topology admission.
3. Full admission ceremony (CRT-301 admission contract, CRT-309 release
   closure) is required before these surfaces may be treated as canonical
   release authority.
4. Neo4j remains a rebuildable read projection; it is never authority.

## Change control

Any change to the admitted candidate surface requires a new decision-ledger
entry and a green root validation run (`npm run validate` plus the root pytest,
Node, and live-Neo4j suites).
