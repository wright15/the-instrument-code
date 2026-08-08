# GOV-203 — Deterministic Governor classification and physical evaluation

**Status:** Done · **Priority:** High · **Points:** 8 · **Epic:** [EPIC-002](EPIC-002-governor-domain-agent-runtime.md)

> **Closure evidence (2026-08-07):** implemented and verified by the
> `src/governor/classifier.py` pipeline and `tests/test_gov_203_classifier.py`
> (10 tests passing). Physical/symbolic separation, bridge-rule evaluation,
> and canonical-state resolution for `1749`/`2477`/`223` are covered by the
> topology locks in `tests/verification/test_graph_topology_locks.py`.
**Depends on:** GOV-202 · **Blocks:** GOV-204, GOV-206

## Story

As a local-agent user, I want a deterministic classifier that decomposes
entities into typed aspects, evaluates registered physical/harmonic operations,
and returns rule evidence or abstention, so the model never has to invent a
Governor assignment or perform precision math itself.

## Context

The classifier is not a replacement for canonical state lookup. A state ID or
12-position mask resolves through the existing topology. Operational text and
domain entities use the new TypedAspect policy. Physical calculations support
classification evidence but do not silently become symbolic bridge rules.

## Tasks

- [ ] Implement canonical Unicode/case/whitespace and quantity normalization.
- [ ] Implement registered wavelength/frequency/photon-energy conversion,
      dimensionless harmonic ratios, local `C_P`, and scoped relative Rayleigh
      evaluation using fixed constants and declared assumptions.
- [ ] Evaluate BridgeRules in stable order with explicit priority, conflict,
      negation, and missing-data behavior.
- [ ] Return per-aspect `classified`, `ambiguous`, `unresolved`, or `invalid`
      results with complete rule/provenance paths.
- [ ] Aggregate entities without forcing all aspects into one Governor.
- [ ] Expose read-only `classify`, `explain`, and `list-candidates` CLI/JSON
      operations; no classifier operation may mutate state.
- [ ] Add fixtures spanning all seven Governors, composites, conflicts,
      physical calculations, canonical states, and boundaries.

## Acceptance criteria

- **AC-1**: every `classified` aspect has exactly one primary Governor and at
  least one admitted rule/provenance path; ties or incompatible valid rules
  return `ambiguous` rather than using office order as a tiebreaker.
- **AC-2**: wavelength, frequency, photon energy, `C_P`, and relative
  Rayleigh fixtures reproduce expected values within declared tolerances and
  reject missing assumptions or incompatible dimensions.
- **AC-3**: Rayleigh scattering can link to Jupiter through an explicit blue-
  profile bridge while preserving the physical law and symbolic association
  as separate claims.
- **AC-4**: an aeolian process facet maps through atmospheric wind evidence;
  a mixed aeolian/fluvial entity retains separate process aspects instead of
  losing one through whole-entity classification.
- **AC-5**: state IDs `1749`, `2477`, and `223` resolve through canonical
  topology; operational classification cannot change their office fields.
- **AC-6**: reordered metadata, provider order, Neo4j availability, locale,
  and repeated execution do not change canonical result bytes or fingerprints.

## Verification

Run at least two positive fixtures per Governor plus empty input, tie,
negation, Unicode/case variants, reordered metadata, wrong units, mixed
genesis, provider-offline, and canonical-state regression fixtures. Compare
canonical output bytes across separate processes.

## Definition of done

Classifier, evaluator, CLI contracts, explanations, and fixtures are complete;
all classification and physical-integrity acceptance criteria have executable
tests; abstention is demonstrated; canonical office regressions are absent;
determinism passes twice; package/root validation, documentation, manifest,
and checksums are green.
