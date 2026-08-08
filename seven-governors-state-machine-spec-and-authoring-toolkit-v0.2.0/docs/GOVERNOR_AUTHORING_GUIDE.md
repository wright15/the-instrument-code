# Governor Proposal Authoring Guide

## Know which `governors.yaml` you are editing

This companion edits only its frozen baseline at `source/governors.yaml`.
That file exists so the CLI can make reviewable drafts; it is not the running
Neo4j lookup and it is not independently authoritative over the installed
release.

- `../../schemas/governors.yaml` is the installed release's machine registry.
- `../../seven-governors-canonical-feature-profile-registry-v0.1.1/source/governors.yaml`
  is the frozen input recorded by profile registry `0.1.1`.
- that registry's `canonical/` artifacts are its deterministic versioned
  outputs;
- Neo4j is the integrated runtime projection; and
- the server and renderer are consumers.

Editing Neo4j directly would make it unclear whether a property came from
canon, a database patch, or a renderer experiment. Keep the graph rebuildable.
Likewise, editing or materializing a companion draft does not change any of the
installed artifacts above.

## Companion CLI change classes

These classes are safety policy for proposals produced by this package. They
do not grant authority to change an upstream field.

### Locked identity fields

The authoring CLI rejects these:

- Governor key, `display_name`, `symbol`, and type;
- canonical mode;
- all canonical masks, decimals, hex values, bit weights, and state IDs;
- anchor tier, Forte identity, and topology roots;
- representative wavelength and derived photonic quantities;
- primary phenomenon ID/office assignment; and
- source-authority metadata.

A necessary change to one of these is a migration, not ordinary authoring. It
requires an explicit decision record, audit impact analysis, new version, and
full rebuild.

### Guarded semantic fields

These may be proposed only with `--ack-guarded`:

- `archetype.directionality`;
- `canonical_expression.thermodynamic_function`; and
- `canonical_expression.optical_function`.

They affect canonical packet identity and require a new registry version.

### Authorable fields

The companion proposal workflow accepts:

- `reference_library.landforms`;
- `reference_library.architecture`;
- `reference_library.botany`;
- `reference_library.material`;
- `reference_library.color_associations`;
- `reference_library.symbolic_references`;
- `archetype.mythology_layer.narratives`;
- `archetype.mythology_layer.incarnational_layer`;
- `archetype.mythology_layer.canonical_phrases`; and
- `canonical_expression.visual_recipes`.

These would be canonical profile changes if admitted and promoted upstream,
but they do not alter harmonic identity.

### Experimental fields

Mutation hypotheses, observed semantic effects, candidate $C_H$ formulas, and
cross-office phenomena belong in a research record or hypothesis registry.
The installed release does not provide the proposed Mercury/Virgo ledger, and
these fields must not be inserted into `governors.yaml` as though canonical.

## Workflow

### Inspect

```bash
npm run governor:list
npm run governor:show -- --office Jupiter
```

### Create a draft

```bash
npm run governor:draft -- \
  --office Jupiter \
  --out drafts/jupiter.yaml
```

The draft records the exact SHA-256 of this package's baseline. If that baseline
changes, the proposal becomes stale and local validation fails. This check does
not establish parity with a newer upstream registry by itself.

### Add a change

Arrays and objects can be supplied as JSON:

```bash
npm run governor:set -- \
  --file drafts/jupiter.yaml \
  --field reference_library.landforms \
  --value '["mountain ranges","river deltas","wind-carved plateaus"]'
```

A guarded field requires acknowledgement:

```bash
npm run governor:set -- \
  --file drafts/jupiter.yaml \
  --field canonical_expression.thermodynamic_function \
  --value distribution \
  --ack-guarded
```

The command updates only the draft.

### Validate and review

```bash
npm run governor:validate -- --file drafts/jupiter.yaml
npm run governor:proposal -- \
  --file drafts/jupiter.yaml \
  --out proposals/jupiter.json
```

The review packet includes old and proposed values, field risk, potentially
impacted registries, and versioning requirements. These are review hints, not
an upstream admission decision.

### Materialize a candidate

```bash
npm run governor:materialize -- \
  --file drafts/jupiter.yaml \
  --out candidates/governors.candidate.yaml
```

The command refuses to use `source/governors.yaml` as its output. Before
writing, it validates the candidate against the **installed canonical profile
registry toolchain**: the candidate is rebuilt and revalidated by the real
`build-registry.mjs` / `validate-registry.mjs` pipeline and compiled by
`compile-profile.mjs` in an isolated temporary tree. Passing proves
buildability only; `promotionReady` remains `false` because admission requires
an upstream release decision.

### Submit for upstream promotion

Promotion is intentionally a deliberate project action:

1. review the proposal;
2. choose the next semantic registry version;
3. compare the proposal with the current owning framework and registry sources;
4. update the owning source only through the upstream decision process;
5. rebuild the canonical profile registry under the new version;
6. run profile, provider, compiler, and Cypher validations;
7. run packet-fingerprint migration checks;
8. import/rebuild Neo4j;
9. update health/readiness expectations if the admitted contract changed;
10. record the decision and release fingerprint; and
11. package the new integrated release.

## Proposing a phenomenon mapping

`schemas/physical_phenomena.yaml` is this companion's candidate registry, not an
active integrated-release authority. The installed graph has no admitted
`PhenomenonModel` or `PRIMARY_PHENOMENON` projection. Ordinary Governor editing
therefore cannot add or change an active phenomenon assignment.

A proposal should include:

- a physical definition and scientific source;
- assumptions and failure boundary;
- a scoped assignment rationale;
- semantic affordances and prohibited inferences;
- uniqueness check across all seven offices;
- a proposed registry version;
- an explicit upstream owner and admission path; and
- creation-packet/API impact analysis, because current packets contain no
  phenomenon field.

This package proposes Rayleigh scattering as Jupiter's sole primary model
within the candidate registry's namespace. That exclusivity is neither active
runtime canon nor a claim about where Rayleigh scattering occurs in nature.

## Review checklist

- Does the change alter identity or only descriptive content?
- Is every physical claim sourced and unit-aware?
- Is every framework correspondence labeled authored?
- Does the change conflict with another office's primary phenomenon?
- Will intrinsic fingerprints change?
- Are existing compiled packets expected to migrate?
- Does a mutation semantic effect belong in the semantic registry instead?
- Is a counterexample or failure boundary documented?
- Has Neo4j remained a projection rather than the authoring source?
- Is this still a companion proposal, or is there a recorded upstream
  admission and rebuilt release?
