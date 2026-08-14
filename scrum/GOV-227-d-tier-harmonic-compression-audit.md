# GOV-227 - D-tier additive harmonic-compression audit

**Status:** Done · **Priority:** High · **Points:** 8 · **Epic:** Proposed EPIC-005 formal completion
**Depends on:** GOV-213, `CH_A012_q_v1` theorem · **Blocks:** Review-gated D-tier admission and any later runtime or Neo4j integration

## Story

As a release maintainer, I want the 49 D1-D7 anchors audited through a
mathematically derived `q_v2` encoding and exact separation analysis so the
project can inspect D-tier harmonic-compression structure without changing the
admitted A-tier theorem, global `harmonic.C_H`, or graph projection.

## Approved Stage A scope

- Create the root-owned candidate `CH_D17_q_v2` at coordinate
  `harmonic.CH_D17_q_v2` for records satisfying both `role=anchor` and
  `tier in {D1,D2,D3,D4,D5,D6,D7}`.
- Derive `q_v2(a,b)` from the interval-class dissonance weights in
  `docs/MATHEMATICAL_REALIZATION_SPECIFICATION.md`, where the triad intervals
  are `a`, `b-a`, and `b`.
- Preserve exact `q_v1` values on its six A-tier signatures through a
  structural bucket plus dissonance-rank construction:
  - perfect-fifth tertian major/minor maps to `0`/`1`;
  - equal stacked non-perfect intervals map to `2`;
  - other signatures map to `3` plus exact combined-dissonance rank.
- Treat `(2,4)` as an equal stacked interval and therefore `q_v2=2`.
- Reuse the existing exact Chaldean witness
  `(116,56,41,35,77,44,38)/407` only as a descriptive fixed projection.
- Run a dependency-free, exact-rational linear-programming audit that tests:
  fixed-witness tier bands, declared-order adjacent-tier separation, and
  A-block versus D-block separation.
- Keep Stage A sidecar-only. Do not emit q_v2 data into Neo4j, runtime,
  classifiers, menus, or creation packets.
- Leave `CH_A012_q_v1` byte-identical and preserve global `harmonic.C_H` as
  `unresolved` with `value=null`.
- Produce the sidecar and QA evidence for review before any integrated-release
  version bump, provenance admission, manifest refresh, or checksum refresh.

## Implementation plan

1. Add deterministic q_v2 derivation and D-tier builder logic without changing
   q_v1 constants, selection, serialization, or candidate bytes.
2. Add an exact rational common-margin LP solver with deterministic pivoting,
   strict status semantics, and no undeclared numerical dependency.
3. Emit `CH_D17_q_v2` with 49 records, tier summaries, fixed-witness bands,
   LP results, D3/D4 Z-partner evidence, source bindings, and the global null
   guard.
4. Add strict candidate and validation schemas, adversarial fixtures, a
   deterministic generator, a validator, and focused tests.
5. Verify build-twice and reordered-input identity, q_v1 fidelity, joint
   transposition invariance, modal `M^7` covariance, exact LP replay, source
   freshness, negative controls, and the unchanged A-tier byte fingerprint.
6. Stop at the review gate. Release and authority integration are Stage B and
   require explicit approval after the sidecar and band results are inspected.

## Acceptance criteria

1. `q_v2` maps `(4,7),(3,7),(3,6),(4,8),(2,6),(4,6)` to the exact q_v1
   values `0,1,2,2,3,3` while accepting every D-tier anchor signature.
2. The candidate contains exactly 49 D1-D7 anchors, seven per tier, with no
   A-tier, satellite, or boundary records.
3. D3 / `7-Z37` and D4 / `7-Z17` retain their equal interval-vector evidence
   while q_v2 records distinguish their rooted triadic structures.
4. The fixed-witness and exact LP audits report band gaps or overlaps without
   promoting feasibility, ordering, or a solver witness to a natural law.
5. Exact LP output is deterministic, rational, independently replayed against
   every constraint, and returns `LIMIT` rather than a false infeasibility on
   configured resource exhaustion.
6. The canonical candidate and QA report have strict schemas, exact source and
   algorithm fingerprints, canonical serialization, and build-twice identity.
7. Adversarial fixtures reject scope drift, source drift, q-v2 tampering, LP
   result tampering, A-tier byte drift, and non-null global `harmonic.C_H`.
8. `canonical/harmonic-compression-candidates/CH_A012_q_v1.json` remains exactly
   15,208 bytes with SHA-256
   `fa2947440d90f67b65443ae03f1ce92a0cc8a6ca2e93e83dfdc2490a25723c98`.

## Explicit non-goals

- No admission decision or root release version bump in Stage A.
- No manifest, checksum, Neo4j, API, runtime, classifier, Court, or menu change.
- No satellite, boundary, or full 462-state extension.
- No mutation-operator delta audit or `C_P`/`C_H`/`C_S` correspondence claim.
- No global `harmonic.C_H` scalar and no office inference from q_v2 or W.
- No claim that the existing or LP-derived weights are physically or naturally
  unique.

## Stage A review gate

Stage A completed with the candidate sidecar, exact LP output, validation
report, and focused tests passing. Maintainer review accepted q_v2, the D2/D5
multiset-twin observation, and the tier interleaving as canonical scoped
evidence, authorizing Stage B release binding while prohibiting Neo4j data
projection and preserving global `harmonic.C_H` as unresolved/null.

## Stage A execution evidence

- The generated candidate contains 49/49 D1-D7 anchors and all 21 triad
  interval signatures observed across the 70 A0-D7 anchors are in q_v2's
  domain. The six q_v1 signatures retain values `0,1,2,2,3,3`; q_v2 extends
  the observed value range through `7`.
- Exact q_v1 preservation fixes combined-dissonance `5` exotic signatures at
  class `3`; classes `4` through `7` therefore enumerate descending lower
  dissonance levels within the exotic bucket. q_v2 is a framework-authored
  structural ordinal, not a monotone acoustic-energy magnitude or physical
  measurement.
- The D-tier q-v2 multiset sums are D1 `10`, D2 `34`, D3 `40`, D4 `19`, D5
  `34`, D6 `26`, and D7 `26`. These values are observations, not a monotone
  tier theorem.
- D3 / `7-Z37` and D4 / `7-Z17` retain the same interval vector
  `(4,3,4,5,4,1)` while their raw triad-signature multisets and q-v2 multisets
  differ, with no cross-tier rooted Q-tuple collision.
- D2 / `7-15` and D5 / `7-Z12` share q-v2 multiset
  `[2,3,3,6,6,7,7]` and sum `34`, but have distinct raw triad-signature
  multisets and no rooted Q-tuple collision. Rooted Q(S), rather than its
  multiset quotient, is required for this discrimination.
- Under the fixed Chaldean witness, adjacent declared-order comparisons are:
  A0-A1 `+3/407`, A1-A2 `+22/407`, A2-D1 `-372/407`, D1-D2
  `+1113/407`, D2-D3 `-117/407`, D3-D4 `-1581/407`, D4-D5
  `+516/407`, D5-D6 `-697/407`, and D6-D7 `-204/407`. Positive values
  are disjoint gaps and negative values are overlaps.
- The exact solver independently recovers the GOV-213 calibration witness
  `(116,56,41,35,77,44,38)` at normalization 407 with common margin `3`.
  The full A0-D7 declared-order model, D1-D7 declared-order model, and
  all-A-before-all-D model are each infeasible even at zero common margin under
  the required Chaldean ordering. This is evidence of interleaving, not a
  solver failure and not authority to redefine tier order.
- The GOV-227 validator passes 17/17 checks, its focused suite passes 12/12,
  the root Python suite passes 370/370, and GOV-213 remains 12/12 plus 9/9
  focused tests. The A-tier candidate remains exactly 15,208 bytes at its
  pinned SHA-256, global `harmonic.C_H` remains unresolved/null, and Neo4j,
  graph-data integration remains deferred.

## Stage B closure

- Candidate status is `admitted_scoped_D17` with admission effect
  `Q_and_W_D17_only` and release id
  `harmonic-compression-candidate:CH_D17_q_v2:1.0.0`.
- Release 1.6.0 binds the scoped coordinate without treating Q, W, or its tier
  bands as a global tier classifier or as global `harmonic.C_H`.
- The Chaldean hierarchy is a fixed framework constraint for the LP audit. The
  numeric witness retains `uniquenessClaim=false`: it is one feasible witness,
  not a natural law or unique solution.
- Neo4j baseline refresh is deferred because no graph data changed; only the
  release provenance version changed. Refresh is required at the next Neo4j
  availability.
