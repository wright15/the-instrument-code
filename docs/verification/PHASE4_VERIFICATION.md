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

## Carey Enumeration

The suite calls the production CRT-303 evaluator rather than supplying Carey
difference or failure counts. For the 12-TET 5-35 seed `(0, 2, 4, 7, 9)`, it
enumerates 20 directed interval instances, all 40 same-generic comparison
slots, and all 150 cross-generic comparisons. The resulting exact counts are:

```text
interval instances = 20
difference slots = 40
D(S) = 20
ambiguities = 0
contradictions = 0
F(S) = 0
CQ = 1/1
SQ = 1/2
```

`evaluate_carey_535()` fails closed unless its input has Forte 5-35 prime form,
uses 12-TET, and declares generator step 7. The lower-level diagnostic
enumerator may inspect other five-note sets but cannot assign them scoped 5-35
results. Provenance cites Carey 2007, DOI `10.1080/17459730701376743`.

The same production package recomputes the Court signed transition vectors,
`G_Court = 2I_4`, all 25 Hamming path entries, disjoint XOR supports,
weight-five values, and exact `kappa_court = i/4` ratios. Its aggregate
`harmonic.C_H` remains explicitly `unresolved` and distinct from photonic,
semantic, Court-compression, and thermodynamic namespaces.

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

## Court Filter Algebra

The production CRT-304 package defines `P_c(x) = x AND c` over the ambient
12-bit binary-vector domain. Seven concrete filters are admitted within the
candidate package: C0-C4 plus rooted 5-23 and 5-27. The global projection has
no inverse because it is non-injective; its restriction to its image is the
identity.

The complete filter/mutation evaluation covers:

| Metric | Result |
|---|---:|
| Filters | 7 |
| Mutation operators | 15 |
| Canonical operands | 462 |
| Filter/operator summaries | 105 |
| Evaluations | 48,510 |
| `right_undefined` route asymmetries | 23,814 |
| `both_undefined` | 24,696 |
| Other classifications | 0 |

The package independently reproduces all 3,402 admitted mutation applications.
Filtered outputs have weight at most five, while admitted mutations require a
rooted weight-seven operand. Consequently, a defined mutation-then-filter route
has no admitted filter-then-mutation counterpart. Each such asymmetry has a
typed record; it declares `court.routeSemantics` and requires a runtime event
without inventing an event pointer before CRT-305.

The 5-23 and 5-27 bridge routes retain different pitch information for the
same Aeolian `1453` to Harmonic Minor `2477` endpoints. Route cost remains
`unresolved`, and spectral measures remain `not_admitted`.

## Court Runtime Lifecycle

CRT-305 binds a strict candidate policy to the CRT-301 through CRT-304
fingerprints and the unchanged GOV-204 ledger envelope. The runtime derives
mask, pole register, and normalized exact `kappa_court` from C0-C4 rather than
accepting them as caller-authored fields.

| Runtime proof | Result |
|---|---:|
| Canonical positions | 5 |
| Directed ordinary moves | 8 |
| Legal moves at C0-C4 | 1 / 2 / 2 / 2 / 1 |
| Exact kappa values | 5 |
| Forbidden kappa namespaces | 7 |
| Verified translocation directions | R7 forward / L7 reverse |
| Verified bridge route contexts | 5-23 / 5-27 |

Every committed transition requires a single-use token bound to the exact
state, ledger head, policy, context, capability, operation, target, revision
window, and optional translocation/route hashes. A typed passing GOV-205
`VerificationDecision` with evidence IDs is mandatory. Rejected moves retain
the original state and ledger bytes.

Non-adjacent moves are compound runtime records: a Court-position jump plus an
independently evidenced heptatonic R7/L7 mutation. This does not assert a new
canonical mapping between Forte family and Court position. Runtime events point
back to CRT-304 route records; the static records remain immutable.

Semantic replay recomputes state, poles, kappa, token consumption, event
identity, translocation evidence, and snapshots without Neo4j. Live sessions
default to `${XDG_STATE_HOME:-~/.local/state}/seven-governors/court`, use atomic
compare-and-swap persistence, and remain outside release artifacts.

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

CRT-306 projection schema v2 independently replays the CRT-305 ledger before
emitting runtime records. Its bounded fixture contains 21 Court-owned nodes, 19
relationships, and one ID-only `ScaleState` reference. The two-event history is
C0 -> C1 followed by a compound C1 -> C4 R7/5-23 translocation. The event points
to the exact CRT-304 route row while every static `ledgerPointer` remains null.
Python snapshot verification and live Cypher validation both reject missing
verification evidence, broken chain/snapshot closure, and mismatched route ID,
operator, classification, semantics, or CRT-304 fingerprint.

## Court Agent Skills

CRT-307 adds a separate five-operation facade and bundle without changing the
closed GOV-207 contract. Every operation replays CRT-305 first. Execution
requires exact current menu/state/capability closure, a trusted typed verifier,
semantic postcondition replay, and CAS persistence; no token or verifier
decision is model-authored or emitted. Historical outcomes are read from the
ledger without rerunning effects.

The acceptance corpus covers all C0-C4 menus, adjacent and translocation
commits, off-chain and non-adjacent rejection, stale bindings, denied grants,
malformed verification, graph absence/timeout/size failures, read-only CRT-304
projection, deterministic replan then stop, schema/facade parity, both host
adapters, and installer collision/symlink/rollback behavior. Eight trace
decisions also passed against a loopback Qwen 35B endpoint with thinking
disabled. That observation is explicitly non-canonical.

Topology locks are asserted in canonical JSON and Neo4j CSV projection data:

- `1749`: Moon, A1, `anchor_A1`, exactly one Moon seat.
- `2477`: Jupiter, A0, `satellite_A0`, parent 1453, incoming Degree Governor Moon,
  exactly one Jupiter seat.
- `223`: categorical office/tier null, relational Jupiter evidence, no office
  seat, contact tiers `D3:1` and `D6:1`.

## Deterministic Report

`scripts/run-phase4-verification.py` independently reruns the canonical mask,
filter, mutation, commutation, production Carey enumerator, invariant-registry
builder, production Court-filter evaluator, Court runtime policy/replay, and
ground-metric checks. It emits compact canonical JSON with no timestamps or
provider metadata and seals the report with `reportSha256`.
Without `--run-integration`, its status is `STRUCTURAL_PASS` and the external
suite fields remain `NOT_RUN`. `PASS` is emitted only after the Python
verification suite and native Neo4j parity suite execute successfully.
