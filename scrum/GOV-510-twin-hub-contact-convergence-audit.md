# GOV-510 - Twin-hub contact convergence audit

**Status:** Backlog · **Priority:** High · **Points:** TBD · **Epic:** [EPIC-510](EPIC-510-full-field-derivation.md) · **Sprint:** Sprint 2
**Depends on:** GOV-501 · **Blocks:** GOV-512, ORR-524

## Story

As a research maintainer, I want the T1 twin-hub convergence claim defined and
tested before it is visualized or generalized so the project can record a
falsifiable verdict without smuggling a new operator into authority.

## Scope

- Pre-register the T1 twin relation: same Forte class, root-0 comparison, and
  `m(B)=T+/-1(m(A))` under the declared mask convention.
- Define the `root_phase` edge, the `T1(Ionian)=Locrian` receipt, a hub, an
  office-ring midpoint, and the permitted source-backed chain between them.
- *(i) $T_1$-twin pair:* Two root-0 states of the same Forte family with $m(B) = T_{\pm 1}(m(A))$, joined by a `root_phase` edge ($T_1(\text{Ionian}) = \text{Locrian}$).
- *(ii) Hub:* The office appearing in both twin pairs of a tier; may be undefined (A1 pairs {Moon,Saturn}/{Sun,Venus} are disjoint); undefinedness constitutes D4/D5 asymmetry.
- *(iii) Ring midpoint:* For a distance-2 office pair $\{k-1, k+1\}$, office $k$ is the unique vertex adjacent to both.
- *(iv) Permitted parent-chain path:* D-anchor $\leftarrow$ `SEAT_CONTACT` $\leftarrow$ satellite $\leftarrow$ `GOVERNS` $\leftarrow$ parent anchor (single hop, satellite tier = parent tier).
- Test the documented D4/D5 asymmetry rather than flattening it into a single
  convergence claim.
- Emit a deterministic, source-bound result with confirm, refute, or partial
  verdict semantics.

## Acceptance criteria

1. The artifact defines every term used by the claim, including mask operation,
   same-Forte constraint, root-phase relation, hub, ring midpoint, and permitted
   chain, with a source reference for each non-derived input.
2. The T1 receipt explicitly tests the stated Ionian-to-Locrian relation and
   rejects a near-match that does not satisfy the pre-registered relation.
3. D4 and D5 are tested as distinct cases: D4 twin convergence through the
   documented A1 behavior and D5 convergence onto unseated A2 midpoints.
4. Positive, negative, and malformed-chain fixtures prove that no missing,
   reversed, or cross-tier relation is silently accepted.
5. The result states `confirmed`, `refuted`, or `partial` from the executable
   checks and closes this story under any of those outcomes.

## Non-goals and guards

- The artifact is `planning_evidence` only and cannot add graph edges, office
  assignments, runtime actions, admission, or a global `harmonic.C_H` value.
- A visual resemblance, prose assertion, or a D4 result cannot stand in for the
  D5 test.
- Arithmetic output wins over planning assumptions. Record every derived
  cardinality and its source path rather than silently normalizing it.

## Verification

- Deterministic build-twice and reordered-input checks for the research artifact.
- Focused D4/D5 positive and negative fixtures.
- Source-binding freshness and schema validation.
- `npm run validate --silent` after the artifact is intentionally wired.

## Definition of done

The pre-registered definitions, D4/D5 tests, negative controls, and explicit
verdict are recorded. GOV-512 can consume the result without interpreting prose.

## References

- `provenance/OBSERVATION_LEDGER.md`
- `provenance/NEXT_STEPS.md`
- `docs/AUDIT_METHOD_AND_REPRODUCIBILITY.md`
- `docs/TOPOLOGY_IDENTITY_AND_INVARIANTS.md`
