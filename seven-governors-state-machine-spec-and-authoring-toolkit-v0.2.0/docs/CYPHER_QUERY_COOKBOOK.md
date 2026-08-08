# Cypher Query Cookbook

The read-only companion statements are in `neo4j/query-cookbook.cypher`. They
are ordered as a learning sequence, not an authoritative validation dump.
Topology, mutation, and profile imports remain the graph contract.

Queries Q01-Q19 and Q23 target installed topology/mutation/profile vocabulary.
Q20-Q22 target this package's optional candidate context projection. That
projection is not admitted or loaded as part of the active integrated release,
so those three queries must not be used as active readiness checks.

## How to read a result

For every query, record:

- the release fingerprint;
- the exact query ID;
- tested domain;
- returned support count;
- counterexamples;
- whether the result is structural, semantic, or physical; and
- whether it is an observation, fixture, or admitted rule.

## Query groups

| Queries | Question | Why the hypothesis exists |
|---|---|---|
| Q01–Q05 | Is identity and office projection internally consistent? | Roles and office inheritance are foundational invariants |
| Q06–Q08 | Do anchor rings, midpoint fixtures, and phase channels appear as declared? | Earlier audits revealed fixed-tonic and root-seam structures |
| Q09–Q11 | Are operators bound and inverses supported? | Raise/lower pairs suggest a partial inverse algebra |
| Q12 | Which operator pairs commute on a shared domain? | Independent single-degree changes sometimes form squares |
| Q13 | Where do multiple routes converge? | Acoustic and Lydian Minor show route-independent destinations |
| Q14–Q15 | How do operators move between offices and roles? | Repeated transition signatures may suggest restricted algebraic classes |
| Q16–Q18 | What is structurally known versus semantically unresolved? | Structural support does not authorize feature deltas |
| Q19 | What structure lives in the boundary field? | Unseated states can still have coherent relational evidence |
| Q20–Q22 | If the candidate context projection is loaded in a research database, is it internally complete? | Candidate-only exploration; not an active release invariant |
| Q23 | What should be researched next? | High support plus unresolved semantics defines a useful queue |

## The most important observation query

Q12 does not ask, “Do these operators commute?” in the abstract. It asks:

> On which source states are both compositions defined, how often do the
> destinations agree, and what are the counterexamples?

That is the proper shape of a partial-algebra claim.

## Framework-semantic patterns to observe

The following are hypotheses, not preloaded conclusions:

- `R/L` on a Moon-governed degree may change receptivity or closure language,
  but Harmonic Minor warns that destination identity can remain Jupiter.
- Jupiter-labeled degree operations may correlate with branching or
  distribution, but the Degree Governor cannot assign the destination office.
- Routes that converge on one normal form may retain different narrative
  emphasis while sharing required intrinsic features.
- transitions toward later $C_S$ offices may show more coupling/fixation
  constraints, but $C_S$ is nonmetric and this must be tested per domain.
- anchors may yield stable cross-domain priors while satellites may yield
  parent-inherited priors plus route context in direct, route-aware compiler
  experiments; the public HTTP endpoint does not accept that context.
- boundary convergence rings may support useful descriptive vectors without
  becoming categorical office states.
- candidate high Court $\kappa$ may suggest more constraints and fewer
  affordances in a future production session, but no such active runtime value
  exists and it could not change the scale state's office.

## Turning an observation into an assertion

Create a candidate only after a query returns:

```json
{
  "assertionType": "commutation | confluence | covariance | semantic_delta",
  "operatorIds": ["R4", "L7"],
  "domainDefinition": "explicit predicate",
  "testedDomainSize": 0,
  "supportCount": 0,
  "counterexampleCount": 0,
  "counterexamples": [],
  "normalizationPolicy": "destination_intrinsic",
  "semanticStatus": "hypothesis",
  "releaseFingerprint": "..."
}
```

The next owning audit should reproduce those counts from authoritative source
data, not only the current database or this companion's duplicated catalogs.
