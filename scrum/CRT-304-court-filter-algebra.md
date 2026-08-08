# CRT-304 — Court-filter algebra and operator-commutation tests

**Status:** Partial · **Priority:** High · **Points:** 8 · **Epic:** [EPIC-003](EPIC-003-pentatonic-court-admission.md)

> **Status note (2026-08-07):** the linear diagonal filter `P_c(x) = x AND c`
> is implemented in the projection layer and proven idempotent over all
> 1,892,352 canonical state/mask pairs. The five-valued commutation result
> space (`commutes`, `does_not_commute`, `left_undefined`, `right_undefined`,
> `both_undefined`) is implemented, with the `R7`-after-filter `right_undefined`
> case demonstrated. **Remaining:** a first-class `court-mathematics` filter
> operator API with explicit domain/image objects and an admitted commutation
> evaluator rather than authored records.
**Depends on:** CRT-303, GOV-202 mutation operator contract · **Blocks:** CRT-307

## Story

As a Court runtime author, I want the linear Court-filter operator
$P_c=\operatorname{diag}(c)$ declared with its domain, image, inverse, and
commutation rules against the EPIC-002 mutation operator registry, so the
runtime can compare bridge Courts that mediate the same scale-state
transition (such as Aeolian → Harmonic Minor via 5–23 vs 5–27) without
silently equating their route semantics.

## Context

`framework/TOPOLOGICAL_ANCHORING.md` §"Pentatonic Courts as Filters" and
`framework/AGENTS.md` establish:

- A binary Court mask $c$ yields a linear filter $P_c=\operatorname{diag}(c)$
  over the 12-bit pitch-class state.
- $P_c x$ is the information exposed to the local controller; two bridge
  Courts can connect the same source and target while exposing different
  information, so 5–23 and 5–27 are not interchangeable simply because both
  can mediate 7–35 → 7–32.
- If Court filtering and mutation do not commute,
  $P_c T \stackrel{?}{=} T P_c$, the order itself becomes route
  semantics and must be recorded by Virgo (the ledger).
- The operator-theory requirement declares: domain, admissible source
  topologies, image and possible target topologies, inverse where one
  exists, commutation rules with other mutations, interaction with Court
  filters, exact harmonic delta, optional Fourier/spectral action (out of
  scope here), semantic fields authorized to transform, preservation
  invariants, and validation tests.

CRT-304 admits only $P_c=\operatorname{diag}(c)$. Fourier, spectral, and
semantic-scoped filters remain `proposed`. The commutation tests use the
operator registry produced by the EPIC-002 mutation algebra audit and
referenced by GOV-202.

## Tasks

- [ ] Implement $P_c=\operatorname{diag}(c)$ as the sole admitted linear
      Court-filter operator in a new versioned `court-filter-algebra`
      package depending on CRT-302 and CRT-303.
- [ ] Declare the operator's domain (12-bit pitch-class vector or
      declared sub-state), admissible source topologies (the CRT-302
      admitted set classes), image (the filtered 12-bit vector), inverse
      ($P_c$ is an idempotent projection; inverse is `none` and the schema
      records this), exact harmonic delta (the bit-reduction count),
      preservation invariants (weight-count of retained bits), and
      validation tests.
- [ ] Implement a commutation test
      $P_c T \stackrel{?}{=} T P_c$ over every operator $T$ in the
      EPIC-202 mutation operator registry, restricted to the CRT-302
      admitted pentatonic set classes as filters and the canonical
      heptatonic states as operands.
- [ ] Record the Aeolian → Harmonic Minor (7–35 → 7–32) bridge through both
      a 5–23 filter and a 5–27 filter as canonical fixtures; compute the
      retained pitches, omitted Governor logic, route cost, and any
      declared spectral measures for each.
- [ ] When $P_c T \ne T P_c$, emit a non-commutation record containing the
      Court mask, mutation operator ID, source state, target state, route
      semantics note, and a pointer into the ledger namespace established
      by CRT-305 (or the GOV-204 ledger if CRT-305 has not landed yet).
- [ ] Add deterministic `--check` and `--emit` build modes with source
      hashes; two clean builds produce byte-identical commutation tables
      and the same filter-algebra fingerprint.
- [ ] Explicitly mark Fourier, graph-spectral, and semantic-scoped filter
      operators `admission: proposed` with blocker pointers to follow-on
      stories or EPIC-004; the filter schema must reject any operator type
      outside `{linear_diagonal}` until separately admitted.

## Acceptance criteria

- **AC-1**: $P_c=\operatorname{diag}(c)$ is the only admitted filter; the
  schema rejects any other filter type (`fourier`, `spectral`,
  `semantic_scoped`, unknown) with a machine-readable reason.
- **AC-2**: for each admitted bridge filter (5–23, 5–27, and a minimal
  mediating set), the operator records domain, image, idempotent
  `inverse: none` declaration, exact harmonic delta, preservation invariants,
  and validation tests; the Aeolian → Harmonic Minor bridge proves that
  5–23 and 5–27 expose different information even though both mediate the
  same source/target pair.
- **AC-3**: the commutation table $P_c T \stackrel{?}{=} T P_c$ covers every
  mutation operator in the EPIC-002 operator registry intersected with
  admitted pentatonic filters; every non-commuting pair produces a
  non-commutation record with Court mask, operator ID, source state, target
  state, and route semantics.
- **AC-4**: commutation results are independent of operator enumeration
  order, provider identity, and Neo4j availability; two clean builds
  produce byte-identical commutation tables.
- **AC-5**: a Court filter never mutates `ScaleState.office`,
  `OCCUPIES_OFFICE`, Degree-Governor metadata, or the source/target state
  of the mutation operator; the filter only produces a 12-bit projection
  and a route-semantics record.
- **AC-6**: the operator theory sheet is published as a machine-readable
  artifact; missing domain, missing image, missing inverse declaration, or
  missing commutation rules is a schema failure.

## Verification

Run positive fixtures for $P_c$ over each admitted pentatonic set class,
the Aeolian → Harmonic Minor bridge via 5–23 and via 5–27, and a sample of
$P_c T$ commutation tests across the EPIC-002 operator registry. Run
negative fixtures: Fourier/spectral/semantic filter rejection, off-chain
mask, dangling operator ID, missing inverse declaration, route-semantics
record pointing at a missing ledger entry, and a Court filter claiming to
mutate office occupancy. Compare canonical output bytes across two clean
builds in separate processes.

## Definition of done

The `court-filter-algebra` package, $P_c$ operator, operator theory sheet,
commutation test suite, Aeolian → Harmonic Minor fixtures, non-commutation
records, deterministic builder, and fixture suite are committed; all
positive commutations and bridge fixtures pass and all negative fixtures
fail for the expected reason; determinism passes twice; EPIC-002's
GOV-202 operator contract and GOV-201 namespace contract remain
unchanged; package/root validation, documentation, manifest, and
checksums are green.