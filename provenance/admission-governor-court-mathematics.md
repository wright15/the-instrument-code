# Admission Record — Governor runtime and bounded Court

**Record ID:** ADM-2026-08-07-01
**Date:** 2026-08-07
**Status:** Superseded by final GOV-209 / CRT-309 admission on 2026-08-10
**Decision ledger:** see `provenance/DECISION_LEDGER.md` and
`provenance/court-admission-release.json`

## Admission scope

| Surface | Status |
|---|---|
| Governor runtime (`src/governor/`): GOV-203 classification, GOV-204 transition engine + hash-chained ledger, GOV-205 verification/loop guards, GOV-206 graph read projection, GOV-207 agent skills | **Admitted by GOV-209 / release 1.3.0** |
| `court-mathematics` package: pitch-class primitives, subset lattice, degree triads, voice leading, harmonic coordinates, exact rational serialization | **Admitted (evidenced candidate)** |
| CRT-306 Court Neo4j projection v2, replay-derived runtime records, six-query bounded catalog, deterministic fixture generator | **Admitted by CRT-309 at actual v2 scope** |
| CRT-302 Court substrate registry: 38 set classes, C0-C4, 5-23/5-27 bridge rootings, T5 cycle, complement maps | **C0-C4 and 5-23/5-27 admitted; remaining 35 classes proposed** |
| CRT-303 harmonic invariant registry: Court geometry, exact `kappa_court`, scoped Carey evaluator, aggregate `C_H` guard | **Bounded exact invariants admitted; aggregate `C_H` unresolved** |
| CRT-304 Court filter algebra: seven linear diagonal filters, complete mutation-domain commutation table, bridge-route evidence | **Seven concrete linear diagonal filters admitted** |
| CRT-305 Court runtime policy: derived Court state, token lifecycle, typed events, translocations, replay, external sessions | **Admitted by CRT-309** |
| CRT-307 Court agent facade and five-skill Hermes/generic bundle | **Admitted by CRT-309** |
| GOV-208 / CRT-308 optional read-only vault context | **Admitted as evidence-only providers; disabled by default** |
| Phase 4 verification suite and deterministic structural-proof report | **Admitted (evidenced)** |
| Broader Pentatonic/Fivefold controller and natural-phenomena material | **Proposed** (not admitted) |
| Aggregate `C_H` | **Unresolved** |
| Carey CQ/SQ (5-35) | Independently enumerated under the scoped 12-TET CRT-303 evaluator: `CQ=1`, `SQ=1/2` |
| Voice-leading metric semantics | Structurally proven; musically **provisional** |
| Exact intrinsic `kappa_court` values and pole registers | Implemented in the CRT-302/303 candidate registries |
| Runtime translocation policy and Court session store | Admitted CRT-305 behavior; live state remains external |
| Runtime graph authority | Python CRT-305 replay only; Neo4j is disposable and stores terminal state/snapshot/event/translocation evidence without authorization power |

## Evidence

- Root validation `qa/integrated-release-validation.json`: **PASS**, 281/281.
- Root pytest: **323 passed**; `court-mathematics`: **52 passed**.
- GOV-206 Node contract suite: **33 passed**; native live-Neo4j Court parity:
  **passed** (six-query byte-exact rows, full property comparison, negative
  tamper validation, reset/rebuild).
- CRT-306 focused projection/topology suite: **23 passed**; bounded fixture:
  **21 Court-owned nodes, 19 relationships, one ScaleState reference**.
- CRT-307 facade: **44 passed**; schema/adapter/installer suite: **17 passed**;
  unchanged GOV-207 regressions: **42 passed**; local Qwen observation: **8/8
  trace decisions passed** and excluded from canonical fingerprints.
- Phase 4 structural proofs: `tests/verification/` (45 tests) plus
  `scripts/run-phase4-verification.py --run-integration` emitting status
  `PASS`.
- GOV-209 report: **7/7**; CRT-309 report: **18/18**; both deterministic.
- Topology locks for `1749`, `2477`, `223` asserted against canonical JSON and
  Neo4j CSV projections.

## Admissions definitions

1. **Evidenced** means the executable suite enforces the claim; prose is never
   accepted as proof (global scrum DoD item 3).
2. **Candidate-but-evidenced** means the implementation and proofs are
   accepted for research/reference use without canonical topology admission.
3. CRT-309 admits only the exact narrow scope in its machine record; historical
   candidate package fields remain evidence of the pre-admission state.
4. Neo4j remains a rebuildable read projection; it is never authority.

## Change control

Any change to the admitted candidate surface requires a new decision-ledger
entry and a green root validation run (`npm run validate` plus the root pytest,
Node, and live-Neo4j suites).
