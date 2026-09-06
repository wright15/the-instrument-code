# GOV-514 - D-tier compression interleaving check

**Status:** Done · **Priority:** High · **Points:** TBD · **Epic:** [EPIC-520](EPIC-520-unified-operator.md) · **Sprint:** Sprint 4
**Depends on:** [EPIC-520-1](EPIC-520-1-unified-operator-planning.md), GOV-227 · **Blocks:** Scalar-evidence disposition for the EPIC-520 research track

**Mapping:** EPIC-520-1 §4 check (ii) GOV-227 interleaving -> GOV-514. This is
a newly specified reproduction and discrimination check, not a new compression
coordinate or tier classifier.

**Completion receipt:** `provenance/DECISION_LEDGER.md`, "Sprint 4 research
receipts - 2026-09-05"; verdict `confirmed` in
`canonical/fivefold-incubator/d-tier-interleaving-check-v0.json`, validated by
`qa/d-tier-interleaving-check-validation.json`.

## Story

As a research maintainer, I want GOV-227's exact-rational scalar evidence
reproduced and bounded against the D4/D5 question so a local scalar gap cannot
be mistaken for global tier, office, contact, or operator evidence.

## Scope

- Read the GOV-227 D1-D7 anchor sidecar and its 70-anchor comparison universe;
  exclude satellites, boundaries, runtime, Neo4j, graph writes, and global
  aggregation.
- Reproduce the fixed-witness bands, all declared-adjacent signed gaps, and the
  three exact LP models with their registered `WEAK_SYSTEM_INFEASIBLE` results.
- Retain the D2/D5 q-multiset collision and D3/D4 interval-vector collision as
  quotient controls. A D4->D5 fixed-witness gap is local evidence only and must
  not be reported as global tier separation.
- Emit a source-bound `confirmed`, `refuted`, or `partial` verdict for this
  reproduction claim. It does not settle any EPIC-520 hypothesis.

## Hypothesis dispositions

| Check outcome | H1 common construction | H2 ring force | H3 declared D signatures |
|---|---|---|---|
| Confirmed: bands interleave and all registered LP models are exactly infeasible | Partial weakening: scalar evidence cannot supply every D4/D5 contact, office, or orientation condition. | Neutral; no ring-force enumeration occurred. | Partial support that non-scalar topology remains necessary; irreducibility is not proven. |
| Partial: only named reproductions close, or an exact solver result is unavailable | Retain all H1 possibilities; no scalar conclusion. | Neutral. | Neutral. |
| Refuted: fresh valid evidence contradicts a registered GOV-227 result | No hypothesis disposition; investigate source or version divergence first. | Neutral. | Neutral. |

`partial` means the exact set of successful and unresolved reproductions is
recorded. A `LIMIT`, unavailable solver, schema failure, source drift, or tamper
failure cannot be restated as exact infeasibility or hypothesis evidence.

## Acceptance criteria

1. The receipt records exact candidate/source fingerprints, all fixed-witness
   comparisons, LP model statuses, collision controls, and a bounded verdict.
2. Success from the D4->D5 gap alone is rejected unless every declared-adjacent
   comparison and all three LP models are evaluated.
3. D2/D5 shared q multiset and D3/D4 shared interval vector reject multiset,
   sum, and interval-vector tier classification.
4. The result leaves `Q(S)`/`W_D17(S)` D1-D7-scoped, leaves office/tier
   resolution to topology and declared precedence, and retains global
   `harmonic.C_H` as null.
5. Fresh build, build twice, and reordered source input reproduce the intrinsic
   bytes and result.

## Negative controls and tamper fixtures

- Reject scalar cherry-picking, including a D4->D5-only success claim.
- Reject injected satellite, boundary, or A-tier records and any changed scope
  count.
- Reject rehashed semantic tampering of q-v2 signatures, LP status/margin,
  signed-gap polarity, source SHA, A-tier baseline, candidate fingerprint, or
  global `harmonic.C_H` guard.
- Treat `LIMIT` as inconclusive/partial rather than exact infeasibility.
- Reject an authority-bearing field, Neo4j projection, office assignment, tier
  classifier, runtime action, admission effect, or operator claim.

## Verification

- Run `npm run validate:gov227 --silent` and record fresh-source, validator,
  and focused-test outcomes separately.
- Record each named suite as `ran` or `skipped` with a non-empty reason. The
  intended check is exact local arithmetic and has no Neo4j, browser, or remote
  environment dependency; any such dependency is a fail-closed gap.
- Re-audit a source/spec/output mismatch through the maintainer review channel;
  no worker-drafted interpretation is silently adopted.

## Definition of done

A deterministic, source-bound interleaving receipt gives an outcome-honest
reproduction verdict and its explicitly limited H1/H2/H3 dispositions. It does
not create a unified operator or change topology, authority, admission, runtime,
or global compression.

## References

- [EPIC-520-1](EPIC-520-1-unified-operator-planning.md)
- [GOV-227](GOV-227-d-tier-harmonic-compression-audit.md)
- `canonical/harmonic-compression-candidates/CH_D17_q_v2.json`
- `qa/d-tier-harmonic-compression-validation.json`
- `docs/D_TIER_TRIADIC_COMPRESSION_THEOREM.md:116-193`
- `scripts/validate-d-tier-harmonic-compression.py`
- `docs/verification/VERIFICATION_REPORT_GATE_STATUS.md`
