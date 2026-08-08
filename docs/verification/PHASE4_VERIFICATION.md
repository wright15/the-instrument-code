# Phase 4 Verification Suite And Structural Proofs

Status: Implemented and executable

## Scope

The Phase 4 suite is under `tests/verification/`. It verifies the canonical
462-state heptatonic field, admitted structural mutation algebra, harmonic
runtime fail-closed behavior, Agent and Court hash-chain replay, deterministic
graph exports, live Neo4j query bytes, and benchmark topology locks.

## Commands

```bash
python3 -m pytest tests/verification
python3 scripts/run-phase4-verification.py --output /tmp/phase4-verification.json
python3 scripts/run-phase4-verification.py --run-integration --output /tmp/phase4-full.json
node --test tests/court_graph/neo4j-live.test.mjs
python3 -m pytest
```

## Invariant Metrics

| Proof | Checked | Expected |
|---|---:|---:|
| Canonical rooted states | 462 | 462 |
| Dyads per state | all states | 21 |
| Trichords per state | all states | 35 |
| Incidences per state | all states | 105 |
| Degree triads per state | all states | 7 |
| Total dyads | 9,702 | 9,702 |
| Total trichords | 16,170 | 16,170 |
| Total degree triads | 3,234 | 3,234 |
| Canonical state/filter idempotence pairs | 1,892,352 | zero violations |
| Pitch-class ground triangle comparisons | 1,728 | zero violations |
| Property-based canonical voice-leading triples | 100 | zero violations |

The voice-leading proof combines the exhaustive 12-TET ground-metric triangle
check with the minimum-bijection composition theorem and property-based checks
against the executable `minimum_voice_leading()` implementation. The metric's
repository status remains `provisional`; the proof does not change admission.

## Carey Formula Proof

The suite uses exact `Fraction` arithmetic and the cited 12-TET 5-35 premises:

```text
N = 5
F(S) = 0
max F(N) = N(N-1)(N-2)(3N-5)/24 = 25
CQ = 1 - F(S)/max F(N) = 1/1

D(S) = 20
max D(N) = N(N-1)^2/2 = 40
SQ = 1 - D(S)/max D(N) = 1/2
```

This is explicitly a strict formula proof under the cited premises. The
repository still has no admitted generic Carey failure/difference enumerator,
so the suite does not misrepresent the premises as independently derived.

## Mutation Algebra Metrics

| Proof | Result |
|---|---:|
| Operators | 15 |
| Modal domain/image | 462 / 462 |
| Each local domain/image | 210 / 210 |
| Generated applications compared | 3,402 |
| Inverse witnesses | all generated applications |
| Local operator pairs | 91 |
| Both-defined equal squares | 7,644 |
| Common-domain value mismatches | 0 |
| One-sided domain asymmetries | 3,528 |

An independent Python oracle recomputes every operator target from the formal
mask definitions and compares it to the admitted CSV. It also recomputes every
commutation summary row and handles `left_undefined`, `right_undefined`, and
`both_undefined` as values rather than exceptions.

The Aeolian fixture proves:

```text
R7(1453) = 2477
L7(2477) = 1453
d_H(1453, 2477) = 2
d_VL(1453, 2477) = 1
```

## Runtime Security

The suite verifies:

- unknown/tampered harmonic context rejection before token construction;
- missing/invalid harmonic rule-set rejection before token construction;
- validation-token identity recomputation during application;
- harmonic revalidation during application to reject forged moves;
- zero reducer calls for every rejected harmonic case;
- exact Agent ledger replay and payload tamper detection;
- exact parallel Court ledger replay and modify/delete/insert/reorder detection;
- Court snapshots binding `courtStateSha256`, event count, and ledger head.

## Graph And Topology

The deterministic Court generator is run under different hash seeds and time
zones. Snapshot, ingestion-batch, and query-result bytes must remain identical.
The live Neo4j suite compares canonical JSON bytes for every named-query result,
then resets and rebuilds the projection and compares full node and relationship
properties.

Topology locks are asserted in canonical JSON and Neo4j CSV projection data:

- `1749`: Moon, A1, `anchor_A1`, exactly one Moon seat.
- `2477`: Jupiter, A0, `satellite_A0`, parent 1453, incoming Degree Governor Moon,
  exactly one Jupiter seat.
- `223`: categorical office/tier null, relational Jupiter evidence, no office
  seat, contact tiers `D3:1` and `D6:1`.

## Deterministic Report

`scripts/run-phase4-verification.py` independently reruns the canonical mask,
filter, mutation, commutation, Carey, and ground-metric checks. It emits compact
canonical JSON with no timestamps or provider metadata and seals the report with
`reportSha256`. Without `--run-integration`, its status is `STRUCTURAL_PASS` and
the external suite fields remain `NOT_RUN`. `PASS` is emitted only after the
Python verification suite and native Neo4j parity suite execute successfully.
