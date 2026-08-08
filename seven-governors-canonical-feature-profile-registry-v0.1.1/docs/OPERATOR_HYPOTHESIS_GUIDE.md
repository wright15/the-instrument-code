# Graph-Derived Semantic Operator Hypothesis Guide

## Why these hypotheses exist

The mutation graph supplies evidence about *where to look*, not what the answer
must be. Four recurring structural patterns make semantic experiments
worthwhile:

- exact midpoint cospans provide confluence controls;
- direct satellites separate State Governor from Degree Governor;
- modal covariance supplies commuting-square tests;
- the repeated `Rk/Lk` family supplies inverse and conjugacy controls.

The first semantic research axis is `R4/L4` (Sun Degree) and `R7/L7` (Moon
Degree). This priority comes from familiar fixtures and canonical language, not
from a claim that the semantics have already been proved.

## Candidate experiments

| Hypothesis | Structural motivation | Semantic observation language | Required control |
|---|---|---|---|
| Sun-axis salience | `R4` participates in Acoustic and Lydian Minor cospans | source visibility, coherence, radiance, explicit organizing principle | compare `R4` and `L4` across multiple destination offices |
| Moon-axis salience | `L7` reaches Acoustic; `R7` reaches Harmonic Minor | reception, reflection, containment, situated experience | separate Moon Degree from destination State Governor |
| Modal semantic covariance | `M Rk M⁻¹ = R(k−1)` structurally | does the same normalized semantic delta rotate with degree address? | commuting squares such as Aeolian / Locrian ♮6 |
| Route confluence | two operators can reach one anchor | do both routes normalize to the same intrinsic feature packet? | Acoustic and Lydian Minor cospans |
| Satellite inheritance | Harmonic Minor has one A0 parent | which features come from the Jupiter seat and which, if any, are route context? | compare other `R7` satellites in different offices |
| Bridge identity | Acoustic has two A0 endpoints | does relational office identity outperform either endpoint profile? | direct satellite matched for family/tier |

The terms in “semantic observation language” are candidate coding labels. They
are not populated into the executable operator effects in v0.1.1.

## Recommended observation record

For each generated or analyzed asset, record:

- destination state and State Governor;
- source state and full operator route;
- Degree Governor for every step;
- domain;
- candidate feature identifier;
- observation score and scale;
- observer/model;
- prompt or creation packet fingerprint;
- whether the feature is intrinsic or route-contextual;
- confidence;
- counterevidence.

Prefer ordinal scales with written anchors over free-form impressions. For
example, a 0–4 “source visibility” scale should define what 0, 2, and 4 mean.

## Useful Neo4j cohorts

Start with operators that have both structural support and canonical fixtures:

```cypher
MATCH (release:RegistryRelease {active: true})
MATCH (s:SemanticOperator)-[:PART_OF_RELEASE]->(release)
MATCH (s)-[:REALIZES]->(m:MutationOperator)
WHERE size(s.structural_fixture_ids) > 0
RETURN s.structural_operator_id, s.degree_governor, s.direction,
       s.structural_fixture_ids, s.semantic_effect_fixture_ids,
       m.application_count
ORDER BY m.application_count DESC;
```

Find same-destination route controls:

```cypher
MATCH (release:RegistryRelease {active: true})
MATCH (r:DerivationRoute)-[:PART_OF_RELEASE]->(release)
MATCH (r)-[:PRODUCES]->(n:CompiledFeatureProfile)
WITH n, collect(r) AS routes
WHERE size(routes) > 1
RETURN n.state_name, n.office, n.intrinsic_fingerprint, routes;
```

Find a family-balanced operator sample:

```cypher
MATCH (step:DerivationStep)-[:APPLIES]->(op:SemanticOperator)
MATCH (step)-[:STARTS_AT]->(source:ScaleState)
MATCH (step)-[:ENDS_AT]->(target:ScaleState)
RETURN op.structural_operator_id AS operator,
       source.forte AS source_family,
       target.forte AS target_family,
       source.office AS source_office,
       target.office AS target_office,
       count(*) AS cases
ORDER BY operator, cases DESC;
```

The packaged fixture graph is intentionally small. Run these cohort queries
against the full mutation-algebra application graph for discovery, then promote
selected cases into versioned semantic-observation fixtures here. Do not
relabel a structural confluence fixture as semantic evidence.

## What would count as a real pattern

A candidate semantic delta becomes interesting when it:

- recurs across unrelated families or tiers;
- survives destination normalization;
- differs predictably between inverse operators;
- respects or clearly breaks modal covariance;
- predicts held-out examples;
- has an explicit boundary where it fails.

A result that appears only because all examples share one Governor office is an
office-profile effect, not yet an operator effect.
