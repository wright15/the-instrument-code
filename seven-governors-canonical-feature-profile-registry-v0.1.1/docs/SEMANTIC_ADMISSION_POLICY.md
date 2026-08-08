# Semantic Admission Policy

## Purpose

The registry distinguishes a structurally valid mutation from an admitted
semantic operator. A Hamming relation, a Degree Governor label, a photonic
coordinate, or a compelling metaphor can generate a hypothesis; none is
sufficient by itself to create canon.

The default state of a semantic effect is `unresolved`.

## Effect vocabulary

Every semantic operator has five possible effect lists:

| Effect | Meaning |
|---|---|
| `PRESERVES` | destination retains a named feature under the stated domain and normalization |
| `TRANSFORMS` | a named source value becomes a named destination value |
| `PROMOTES` | feature salience or required strength increases |
| `SUPPRESSES` | feature salience or allowed strength decreases |
| `PROHIBITS` | a feature is incompatible with the normalized destination |

Absence from those lists means “not admitted,” not “no effect.”

## Evidence record

A proposed effect must include:

```json
{
  "claimId": "claim:R7:landforms:containment:v0.1.1",
  "operatorId": "R7",
  "effectType": "PROMOTES",
  "featureId": "landform.containment",
  "sourceValue": null,
  "targetValue": "increased",
  "domain": "landforms",
  "normalizationRule": "resolve destination State Governor first",
  "positiveFixtures": [],
  "counterexamples": [],
  "failureBoundary": null,
  "status": "proposed",
  "provenance": []
}
```

## Promotion states

1. `unresolved` — an unanswered scope in the registry.
2. `proposed` — a falsifiable claim with an identified feature and domain.
3. `fixture_supported` — repeatable positive observations exist, but coverage
   or counterexamples remain incomplete.
4. `provisionally_admitted` — tests cover multiple offices/families and at
   least one declared failure boundary.
5. `canonical` — incorporated into the framework source and regression suite.

Only stages 4–5 may populate executable semantic effect lists. Stage 3 may be
queried as research evidence but must not alter production creation packets.

## Minimum admission evidence

A provisionally admitted effect requires:

- one named source feature and one named target feature or value;
- effect direction and magnitude convention;
- domain restriction;
- destination normalization rule;
- inverse behavior or an explicit irreversibility declaration;
- at least two positive fixtures that are not modal duplicates of one another;
- at least one counterexample, negative control, or explicit failure boundary;
- a confluence test when two routes reach the same state;
- a provenance record and framework version.

The packaged Acoustic, Harmonic Minor, Lydian Minor, and Aeolian-square
fixtures test structure, office resolution, and normal-form confluence. Their
`semanticEffectEvidence` value is `false`; they cannot fill
`positiveFixtures` in a semantic claim without a separate observation protocol
and semantic result.

The author may tighten these thresholds. Relaxing them is a canonical design
change, not an implementation convenience.

## Non-negotiable separations

- Physical values cannot be transformed by a musical operator. A destination
  state obtains the representative photonic record of its resolved office.
- Degree Governor is edge evidence and cannot overwrite State Governor.
- `C_P`, `C_H`, and `C_S` cannot be substituted for one another.
- Carey `CQ` and `SQ` remain family-and-tuning properties.
- Route-dependent observations stay on `DerivationRoute` or
  `DerivationStep` unless normalization proves them intrinsic.
- A boundary state receives no categorical office or canonical semantic profile
  without a new declared resolution rule.

## Confluence gate

If routes `r1` and `r2` reach the same rooted state `s`, then all admitted
intrinsic effects must satisfy:

```text
normalize(apply(r1)) = normalize(apply(r2)) = normal_form(s)
```

Any repeatable difference that survives only because the route differs is
contextual provenance. Model it as a route feature; do not duplicate the
intrinsic state.
