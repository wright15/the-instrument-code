# CRT-347 — Fivefold Capability Teleology planning evidence

**Status:** Done · **Priority:** Medium · **Points:** 5 · **Epic:** pre-EPIC-400 follow-on (planned; no epic activated)
**Depends on:** CRT-309 admission records, semantic-operator-registry v1.0.1 · **Blocks:** CRT-348 (Fivefold promotion gate plan) · **Follow-on reserved:** CRT-348

## Story

As the release owner, I want the authored State/Capability/Teleology separation
encoded as deterministic, independently validated `planning_evidence`, so the
Fivefold capability schools, zodiac-facet partition, and win conditions are
machine-replayable without granting any runtime, graph, policy, ledger,
admission, or physics authority.

## Context

The pre-EPIC-400 audit notes and the fivefold teleology design distinguish:

- `topology.ScaleState` — State/Representation (Governor graph).
- `court.state` — Capability Disposition (four-pole Pentatonic Court).
- `fivefold.capability_school` — authored semantic school namespace.
- `fivefold.teleology.win_condition` — authored goal namespace.

CRT-309 admitted only C0-C4, 5-23, and 5-27 with linear diagonal filters and
left `fivefoldFieldDisposition` items un-actioned. The committed planning
authority (`scrum/pre-epic-400-semantic-and-empirical-audit.md`) already
reserves CRT-311 for anchor sufficiency and CRT-312–CRT-346 for per-class
pentatonic evidence, so this story uses **CRT-347** (this registry) with
**CRT-348** reserved for the later Fivefold promotion gate plan.

The source-controlled `eligibleForPromotionAtCrt309` array contains **ten**
items verbatim (`schemas/court-admission-contract.json:138-149`), not the
eight or nine cited in earlier prose; this story replays all ten plus
`remainProposed` = `macro_bracket`, `controller`, `runtime_cycle`.

## Tasks

- [x] Author `schemas/fivefold-capability/fivefold-capability-teleology.yaml`
      (five schools, twelve zodiac facets, five authored win conditions,
      ten replayed promotion items, guards).
- [x] Author candidate, validation-report, and negative-case JSON Schemas.
- [x] Build `scripts/build-fivefold-capability-teleology.py` with `--check`,
      foreign-key rejection, namespace-collision rejection, and deterministic
      canonical serialization.
- [x] Build `scripts/validate-fivefold-capability-teleology.py` with
      independently re-derived candidate reconstruction, FCT-001–FCT-012,
      and twelve adversarial mutations.
- [x] Emit `canonical/fivefold-capability-candidates/fivefold-capability-teleology-v1.json`
      and `fivefold-capability-teleology-negative-cases-v1.json`.
- [x] Add `tests/test_fivefold_capability_teleology.py` (16 tests).
- [x] Emit `qa/fivefold-capability-teleology-validation.json` (22/22 PASS).
- [x] Add one additive `planning_evidence` row to `provenance/SOURCE_AUTHORITY.md`
      (amendment 4 of the approved plan; no authority change).
- [x] Add root package scripts for build/test/validate (not joined to the
      root `validate` chain, matching the pentatonic-binding-audit precedent).
- [x] Refresh `MANIFEST.json` / `CHECKSUMS.sha256` via `npm run package:manifest`.
- [x] Run the full root validation to a fixed point.

## Acceptance criteria

- **AC-1**: generator `--check` passes against the committed sidecar.
- **AC-2**: two clean builds and a reordered-input build are byte-identical.
- **AC-3**: independent validator reports FCT-001–FCT-012 and all structural
  checks PASS (22/22) in `qa/fivefold-capability-teleology-validation.json`.
- **AC-4**: all twelve negative mutations are rejected with their expected
  codes (see negative-case fixture).
- **AC-5**: `admission_status: planning_evidence` with zero runtime, graph,
  policy, ledger, admission, or physics effect; `physical_quantity_claim: false`.
- **AC-6**: Mercury/Quintessence carries `is_binary_court_pole: false` and
  `court_pole_index: null` and never enters `poleOrder`.
- **AC-7**: zodiac facets never write `court.poleDisposition`; complement map
  and `SUBSET_OF_7_35` remain declared inactive.
- **AC-8**: global `harmonic.C_H` remains unresolved/null.
- **AC-9**: frozen `fivefold_engine.yaml` digest equals the preflight value
  `9cbf038c…64a`; CRT-309 admission bytes unchanged; CRT-310 untouched.
- **AC-10**: root validation passes after the manifest refresh; final diff is
  a delta over the pre-existing dirty worktree.

## Verification

```bash
python3 scripts/build-fivefold-capability-teleology.py --check
python3 scripts/validate-fivefold-capability-teleology.py
python3 -m pytest -p no:cacheprovider -q tests/test_fivefold_capability_teleology.py
npm run validate
```

**Results (2026-08-17):** generator `--check` PASS; build-twice + reordered
identity PASS (candidateFingerprint `a27ae8e7…b7f9`); independent validator
22/22 PASS; pytest 16/16; root validation PASS (411/411 checks); manifest and
checksums refreshed. Promotion inventory replays 10 items verbatim.

## Definition of done

All acceptance criteria pass; QA evidence and Scrum record are current; the
sidecar remains `planning_evidence` with a single additive SOURCE_AUTHORITY
row; no runtime, graph, bootstrap, query-catalog, complement-map,
subset-incidence, controller, ledger-policy, CRT-310, or decision-ledger
surface changed; CRT-348 remains reserved for the promotion gate plan.
