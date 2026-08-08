# Seven Governors Companion Guide / Candidate Extensions

Version `0.2.0` is a **companion guide / candidate extensions** package for the
installed Seven Governors integrated release and canonical feature-profile
registry `0.1.1`. It is not the normative system specification and does not
promote its own catalogs, schemas, or optional Cypher into the active release.

The package directory retains its historical `state-machine-spec` name, but
authority remains with the installed framework, audited topology, mutation
audit, canonical profile registry, and their versioned release artifacts.

## Installed runtime versus this companion

The installed runtime already provides:

- the audited 462-state universal topology and Neo4j projection;
- the 15-operator structural mutation projection;
- seven active `CanonicalFeatureProfile` nodes and four materialized
  `CompiledFeatureProfile` normal forms from profile registry `0.1.1`; and
- `GET /api/creation-packet`, with `stateId` and optional `domain=landforms`.

This companion adds human-facing explanations, query examples, a
proposal-first `governors.yaml` editor, and package-local validation
checklists. Its Fivefold model, natural-phenomenon assignments, context
projection, and related schemas are **candidates**. They are not admitted to
the active integrated release, active Neo4j graph, creation-packet response, or
health/readiness contract.

## The central epistemic rule

The package keeps three claim classes apart:

1. **Physical fact or calculation** — a measured or scientifically defined
   quantity or relation, with assumptions and units.
2. **Framework assignment or candidate assignment** — an authored descriptive
   correspondence whose admission status must be stated. For example, this
   package proposes Rayleigh scattering as Jupiter's namespace-scoped primary
   phenomenon; the installed release has not admitted that mapping.
3. **Structural proof** — a graph or harmonic fact produced by the audit and
   checked by an invariant.

An assignment in class 2 does not turn into a causal or exclusive claim about
nature, and a validated candidate does not become active canon without an
upstream release decision. Musical mutation never changes optical wavelength.

## Start here

1. Read [`docs/START_HERE.md`](docs/START_HERE.md).
2. Read [`docs/ENTITY_AND_ALGEBRA_API.md`](docs/ENTITY_AND_ALGEBRA_API.md).
3. Review the candidate Fivefold model in
   [`docs/FIVEFOLD_ENGINE_AND_THERMODYNAMICS.md`](docs/FIVEFOLD_ENGINE_AND_THERMODYNAMICS.md).
4. Inspect the candidate office phenomena in
   [`docs/NATURAL_PHENOMENA_MODELS.md`](docs/NATURAL_PHENOMENA_MODELS.md).
5. Run:

```bash
npm ci
npm run validate
npm run governor:list
npm run governor:show -- --office Jupiter
```

## Safe authoring in one minute

```bash
# Create a small, editable proposal document.
npm run governor:draft -- --office Jupiter --out drafts/jupiter.yaml

# Change an authorable field in the draft.
npm run governor:set -- \
  --file drafts/jupiter.yaml \
  --field reference_library.landforms \
  --value '["mountain ranges","river deltas","wind-carved plateaus"]'

# Validate and make a review packet.
npm run governor:validate -- --file drafts/jupiter.yaml
npm run governor:proposal -- \
  --file drafts/jupiter.yaml \
  --out proposals/jupiter.json

# Produce a full candidate without touching source/governors.yaml.
npm run governor:materialize -- \
  --file drafts/jupiter.yaml \
  --out candidates/governors.candidate.yaml
```

The CLI never overwrites its package-local baseline at
`source/governors.yaml`. Identity, masks, canonical mode/state, wavelength,
and topology fields are locked by default. Drafts, proposals, and materialized
candidates are review artifacts only; they do not update the installed
registry or Neo4j.

## Package boundaries

This package is not a replacement for the topology audit, mutation audit,
profile registry, or profile compiler. It explains how they relate and offers
candidate authoring and validation material. Neo4j remains a rebuildable
runtime projection, not an authoring authority, and package-local validation
does not constitute integrated-release admission.

See [`docs/SOURCE_AUTHORITY.md`](docs/SOURCE_AUTHORITY.md) for the complete
authority order and [`docs/CAPABILITY_MATRIX_AND_ROADMAP.md`](docs/CAPABILITY_MATRIX_AND_ROADMAP.md)
for what is implemented, proposed, and unresolved.
