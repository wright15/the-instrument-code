# Pentatonic Graph Binding Phase 2-4 Continuation Brief

**Status:** Phases 0-4 complete; planning-evidence closure only
**Parent plan:**
[`pre-epic-400-pentatonic-graph-binding-audit.md`](pre-epic-400-pentatonic-graph-binding-audit.md)
**Controlling specification:**
[`docs/PENTATONIC_GRAPH_BINDING_AUDIT_SPEC.md`](../docs/PENTATONIC_GRAPH_BINDING_AUDIT_SPEC.md)

This file is the self-contained continuation entry point for Phases 2-4. It
does not execute a phase, activate an epic, admit a class, or authorize an
active graph integration.

## Current state

| Phase | Status | Evidence |
|---|---|---|
| 0 | Complete | Corrected specification and handoff contract |
| 1 | Complete | 792 masks, 252 incidences, 38 classes, seven rooted witnesses |
| 2 | Complete | Detached Neo4j audit projection: 7 realizations, 19 incidences, 11 QA checks |
| 3 | Complete | Prose-tier zodiac appendix: 12 records, 5 `T1`/`In` witness pairs |
| 4 | Complete | 11-check closure report, refreshed release artifacts, 411 root checks |

Pinned Phase 1 evidence:

| Artifact | Fingerprint / result |
|---|---|
| `canonical/pentatonic-binding-candidates/pentatonic-7-35-parent-audit-v1.json` | `048d9195d156a769c05887ea41a6ccffae26b36757996fffdc12a0ade3122ec5` |
| `qa/pentatonic-7-35-parent-audit-validation.json` | `16969457214966f8f9138dad7b7e6221b4cf950a962e6806e5900fd87828629b` |
| Focused tests | 12 passed |
| Independent checks | 19 passed, 0 failed |
| Semantic negative controls | 9 rejected with case-specific codes |

Pinned Phase 2 evidence:

| Artifact / check | Fingerprint / result |
|---|---|
| `qa/pentatonic-binding-audit-neo4j-validation.json` | `fbe7f8fa8b98e6942bab1f7c66e3822c339716e5a2ef693ba0f780661d4fa037` |
| Detached projection | 7 exact realizations, 19 `SUBSET_OF_7_35` incidences |
| Native Neo4j live test | 1 passed; missing endpoint rejected; no process, port, or file residue |
| Detached Cypher invariants | 8 passed |
| Shared Cypher syntax validation | 23 files passed, including all five detached audit files |

Pinned Phase 3 evidence:

| Artifact / check | Fingerprint / result |
|---|---|
| `docs/verification/PENTATONIC_GRAPH_BINDING_AUDIT_REPORT.md` | SHA-256 `814512d4f4360dc7e9ab77b8190043a155ae8253d2729dbb21f33db91e37f1df` |
| Structured source replay | 7 Governors, 12 zodiac records, 5 `T1` checks, 5 inversion checks |
| Wording-boundary validation | 11 required guards passed |
| Admission-language review | No findings |

Pinned Phase 4 evidence:

| Artifact / check | Fingerprint / result |
|---|---|
| `qa/pentatonic-binding-audit-closure.json` | `84717a2e9c0b3bed7262420e2a109bf0407dca9df341d4e2d58874003a9324bb` |
| Closure checks | 11 passed, 0 failed |
| Full root validation | 411 passed, 0 failed |
| Release artifact inventory | 780 files; manifest/checksum parity passed |
| Admission effect | None; CRT-310 remains 35 proposed, 0 eligible, 0 admitted |

Do not reconstruct these values from chat history. Read the artifacts.

## Required reading order

1. `docs/PENTATONIC_GRAPH_BINDING_AUDIT_SPEC.md`, especially sections 4-5,
   6.3-6.4, 8-12.
2. `scrum/pre-epic-400-pentatonic-graph-binding-audit.md`.
3. `canonical/pentatonic-binding-candidates/pentatonic-7-35-parent-audit-v1.json`.
4. `qa/pentatonic-7-35-parent-audit-validation.json`.
5. `neo4j/court-mathematics/{schema,reset,validation}.cypher` as read-only
   style references.
6. `tests/court_graph/neo4j-live.test.mjs` and
   `graph/runtime/neo4j-harness.mjs` for the isolated native test pattern.
7. `scripts/validate-cypher-syntax.mjs` before adding any detached Cypher.
8. `provenance/court-admission-release.json` and
   `provenance/SOURCE_AUTHORITY.md` before changing any authority wording.

## Invariant pins

```text
SPEC_ID=pre-epic-400.pentatonic-7-35-binding.v1
SCOPE=planning_evidence_only
ARITHMETIC=integer pitchMask; bit p means pitch class p
DISPLAY=pitchMask12 is b0..b11; do not parse as ordinary MSB mask
MARS_PAIR=101011010110 ->T1/I3 010101101011; not complement
MARS_CANONICAL_MASK=1717
MARS_COMPLEMENT_MASK=2378
COURT_C4_MASK=1321; coordinate collision is not identity
PARENT_COUNTS_EXACT=0:612,1:120,2:48,3:12
PARENT_COUNTS_CLASS=3:{5-35};2:{5-23,5-27};1:{5-Z12,5-20,5-24,5-25,5-29,5-34};0:{all others}
COURT_WINDOWS=C0:Sun-Moon-Mars;C1:Moon-Mars-Mercury;C2:Mars-Mercury-Jupiter;C3:Mercury-Jupiter-Venus;C4:Jupiter-Venus-Saturn
RELATIONS=parent incidence is subset; complement,Tn,In,projection remain distinct operators (outputs may coincide)
GRAPH=detached audit only; exact realization -> ScaleState SUBSET_OF_7_35
ZODIAC=authored 12-record partition; no pitch-class isomorphism admitted
FROZEN_PACKAGES=no in-place edits
ADMISSION=no class, runtime, topology, zodiac, or physical promotion
```

## Phase 2 work package

Phase 2 creates only these artifacts:

- `neo4j/pentatonic-binding-audit/README.md`
- `neo4j/pentatonic-binding-audit/schema.cypher`
- `neo4j/pentatonic-binding-audit/import.cypher`
- `neo4j/pentatonic-binding-audit/validation.cypher`
- `neo4j/pentatonic-binding-audit/reset.cypher`
- `neo4j/pentatonic-binding-audit/teardown.cypher`
- `tests/pentatonic_binding_audit/neo4j-live.test.mjs`
- `qa/pentatonic-binding-audit-neo4j-validation.json`

### Exact graph scope

Only seven reviewed root-0 realizations may be projected:

| Realization | Mask | Parent `ScaleState` IDs | Governor window |
|---|---:|---|---|
| C0 | 661 | 2773, 2741, 1717 | Sun, Moon, Mars |
| C1 | 677 | 2741, 1717, 1709 | Moon, Mars, Mercury |
| C2 | 1189 | 1717, 1709, 1453 | Mars, Mercury, Jupiter |
| C3 | 1193 | 1709, 1453, 1451 | Mercury, Jupiter, Venus |
| C4 | 1321 | 1453, 1451, 1387 | Jupiter, Venus, Saturn |
| 5-23 bridge | 173 | 1709, 1453 | Mercury, Jupiter |
| 5-27 bridge | 425 | 1453, 1451 | Jupiter, Venus |

The candidate artifact, not this table, is the machine source.

The only new audit node label is `PentatonicAuditRealization`. The only new
relationship type is `SUBSET_OF_7_35`. The source endpoint is an exact audit
realization; a TnI class summary is never an endpoint. The target is an ID-only
read of an existing canonical `ScaleState`.

No direct `PROJECTS_TO`, `COMPLEMENT_OF`, Zodiac, office, pole, or runtime
relationship is permitted.

### Isolation requirement

Use `graph/runtime/neo4j-harness.mjs`. It starts a native Neo4j 5 process with:

- a unique temporary root;
- temporary data, config, logs, run, and import directories;
- random loopback Bolt/HTTP ports;
- authentication disabled for the fixture only; and
- process and directory cleanup in `finally`.

Do not use Docker for this phase. Do not use an active database or
`graph/runtime/neo4j-bootstrap.mjs`.

After the harness starts, the test must set the connection contract explicitly:

```text
PENTATONIC_BINDING_AUDIT_NEO4J_URI=<harness.uri>
PENTATONIC_BINDING_AUDIT_EPHEMERAL=1
```

The connection helper must reject a missing guard, a missing dedicated URI, or
a normalized dedicated endpoint equal to `NEO4J_URI`. It must never fall back
to `NEO4J_URI`. Before fixture seeding, query the harness database and require
zero nodes and zero relationships and no audit-named constraints/indexes. The
inherited process environment is not proof of isolation; the test-level helper
owns this check.

The test setup may seed ID-only `ScaleState {id}` fixture records. The audit
`import.cypher` must resolve them with `MATCH`, fail on a missing endpoint, and
must never `MERGE`, `SET`, or `REMOVE` a `ScaleState`.

Capture normalized `ScaleState` labels/properties before import and require the
same fingerprint after import, validation, reset, and teardown. Teardown must
remove all audit constraints and indexes before the native harness is stopped.

Before calling `stop()`, retain the original temporary directory, PID, Bolt
port, and HTTP port. After `stop()`, poll and require: the original directory is
absent, the original PID is not alive, and both ports can be rebound. Do not
rely only on `harness.tempDir` after `stop()` because the current harness clears
that field even when best-effort directory deletion fails. Run the same checks
from the failure-path `finally` block.

### Cypher syntax validator integration

`scripts/validate-cypher-syntax.mjs` is hardcoded, not recursive. Phase 2 must
extend it only after the new files exist:

Add label:

```text
PentatonicAuditRealization
```

Add relationship type:

```text
SUBSET_OF_7_35
```

Add files:

```text
pentatonic-binding-audit/schema.cypher
pentatonic-binding-audit/reset.cypher
pentatonic-binding-audit/import.cypher
pentatonic-binding-audit/validation.cypher
pentatonic-binding-audit/teardown.cypher
```

Regenerate `qa/neo4j-cypher-syntax-report.json`. This report is existing shared
QA output; it does not authorize active graph bootstrap.

The current validator writes a new `generatedAt` timestamp on every run. Before
Phase 4, add a no-write `--check` mode:

1. Default/build mode recomputes and writes the report once.
2. `--check` recomputes `verdict`, `validator`, and `files`, compares those
   deterministic fields with the committed report while ignoring only
   `generatedAt`, and exits nonzero on drift.
3. `--check` must not write any file.
4. Phase 4 changes root `validate:cypher` to use `--check` and adds a separate
   build command for intentionally refreshing the shared report.

Without this separation, full validation can never reach a no-tracked-change
fixed point.

### Phase 2 acceptance

1. All 19 subset edges are created exactly once and are idempotent on reimport.
2. C0-C4 each have three edges; 5-23 and 5-27 each have two.
3. Every edge independently replays `(pentatonicMask AND scaleStateId) = pentatonicMask`.
4. Missing `ScaleState` fixtures make import fail; they are never manufactured
   by audit import.
5. No class-summary, complement, projection, zodiac, office, pole, or runtime
   edge exists.
6. Seeded `ScaleState` fingerprints are unchanged through the complete test.
7. Reset removes audit data; teardown removes audit schema; the harness leaves
   no process, port, or file residue.
8. Active CRT-306, bootstrap, query-catalog, and round-trip source hashes remain
   unchanged.
9. Focused live test and syntax validation pass.

### Phase 2 completion evidence (2026-08-16)

- The dedicated connection helper rejected a missing ephemeral guard, a
  missing dedicated URI, and a dedicated endpoint equal to the normalized
  application endpoint.
- The native harness began with zero nodes, relationships, or audit-named
  schema objects and ended with no process, port, directory, data, or schema
  residue.
- Candidate-derived import created exactly seven
  `PentatonicAuditRealization` nodes and 19 `SUBSET_OF_7_35` relationships;
  reimport remained 7/19.
- A missing `ScaleState` endpoint rolled the import transaction back without
  manufacturing the endpoint or retaining partial audit data.
- All eight detached Cypher invariants passed, including independent bitwise
  subset replay and exact per-realization parent cardinality.
- The ID-only `ScaleState` fixture fingerprint remained
  `ab76011d687455c08f23791a8607fb32bb0015730240fcf94aacdc8e572449ff`
  after import, validation, reset, and teardown.
- Active CRT-306 projection/query, bootstrap, query-catalog, and round-trip
  source hashes remained unchanged.
- `qa/pentatonic-binding-audit-neo4j-validation.json` records 11/11 checks
  passing with report fingerprint
  `fbe7f8fa8b98e6942bab1f7c66e3822c339716e5a2ef693ba0f780661d4fa037`.

Stop after Phase 2 evidence and review. Do not wire the detached projection
into active graph paths.

## Phase 3 work package

Create only:

```text
docs/verification/PENTATONIC_GRAPH_BINDING_AUDIT_REPORT.md
```

Primary inputs:

- `schemas/governors.yaml` metadata bit-order policy, seven Governor records,
  and twelve `zodiacal_systems` records;
- `framework/AGENTS.md` sections "12-Node State Machine" and "Canonical 5-35
  Pentatonic Court";
- `docs/GOVERNOR_DOMAIN_AUTHORITY.md:160-171,217-218`;
- `schemas/court-admission-contract.json:27-34`; and
- Phase 1 representation checks and Court windows.

The appendix must list node ID, sign, Governor, pole, source-vector field,
`T1` relation, and coincident inversion witness. It must preserve Mercury as
engine/ledger and Mars/Jupiter/Venus/Saturn as the four Court registers.

Required wording boundaries:

- "prose context, not admitted";
- no sign-to-pitch-class assignment;
- no 12-TET isomorphism claim from cardinality alone;
- no claim that Lydian/Ionian spacing proves luminary status;
- no physical equivalence among electric, magnetic, photonic, or `physical.C_P`;
- no Zodiac node or runtime/Cypher implementation; and
- no admission or decision-ledger effect.

Phase 3 is independent of Phase 2 and may be completed first. It must not edit
the Phase 0 specification, because the Phase 1 candidate binds that file by
SHA-256.

### Phase 3 completion evidence (2026-08-16)

- `docs/verification/PENTATONIC_GRAPH_BINDING_AUDIT_REPORT.md` records all 12
  authored node/sign/Governor/pole/source-vector rows and has SHA-256
  `814512d4f4360dc7e9ab77b8190043a155ae8253d2729dbb21f33db91e37f1df`.
- Independent structured replay checked seven Governor records, 12 zodiac
  records, five `T1` pairs, five coincident inversion witnesses, and all 12
  rendered table rows.
- Eleven required wording guards passed, including sign-to-pitch,
  cardinality/isomorphism, luminary, physical, graph/runtime, and admission
  boundaries.
- Admission-language review found no remaining namespace ambiguity or
  overclaim.
- Mercury remains the engine/ledger pair; only Mars, Jupiter, Venus, and
  Saturn are the four Court registers.
- No Phase 0 specification, graph, runtime, Cypher, admission, or decision
  ledger artifact was changed by Phase 3.

## Phase 4 work package

Phase 4 adds these package scripts:

```text
build:pentatonic-binding-audit
test:pentatonic-binding-audit
validate:pentatonic-binding-audit
```

Expected command composition:

```text
build: python3 scripts/generate-pentatonic-7-35-parent-audit.py
test: python3 -m pytest -p no:cacheprovider -q tests/test_pentatonic_7_35_parent_audit.py && node --test tests/pentatonic_binding_audit/neo4j-live.test.mjs
validate: generator --check + independent validator + focused Python tests + detached live Neo4j test + Cypher syntax validation
```

Phase 4 emits:

```text
qa/pentatonic-binding-audit-closure.json
```

Closure order:

1. Run focused generation, validation, negative controls, tests, detached
   Neo4j, and Cypher syntax checks.
2. Stop at an authority-refresh review gate before editing
   `provenance/SOURCE_AUTHORITY.md`. That file is a Phase 1 candidate source
   binding; changing it intentionally makes the current candidate stale.
3. After review approval, update Scrum, source authority, and QA
   cross-references using `planning_evidence`, never `admitted`.
4. Reopen the Phase 1 evidence build: regenerate the candidate, rerun the
   independent validator and 12 focused tests, and replace the candidate/QA
   fingerprint pins in this handoff and the parent Scrum plan. Counts and
   mathematical results must remain unchanged; only approved source-binding
   drift is allowed.
5. Generate `qa/pentatonic-binding-audit-closure.json` after the refreshed
   evidence is green and before packaging.
6. Build the shared Cypher syntax report once, then use no-write `--check` mode
   for all final validation.
7. Refresh `MANIFEST.json` and `CHECKSUMS.sha256`.
8. Run full root validation against the refreshed state.
9. If any other validation writes a tracked artifact, refresh and rerun until a complete
   pass produces no further tracked change.

No decision-ledger admission entry is created. CRT-310 remains a separate
per-class admission process.

### Phase 4 completion evidence (2026-08-16)

- The maintainer approved the `planning_evidence` authority wording before
  `provenance/SOURCE_AUTHORITY.md` was changed.
- `build:pentatonic-binding-audit`, `test:pentatonic-binding-audit`, and
  `validate:pentatonic-binding-audit` all pass.
- The approved authority refresh changed only source-binding identity: the
  candidate is now
  `048d9195d156a769c05887ea41a6ccffae26b36757996fffdc12a0ade3122ec5`,
  while all counts, class results, and reviewed windows remain unchanged.
- Refreshed Phase 1 QA fingerprint
  `16969457214966f8f9138dad7b7e6221b4cf950a962e6806e5900fd87828629b`
  records 19/19 checks and all nine adversarial rejections; 12 focused tests
  pass.
- Refreshed Phase 2 QA fingerprint
  `fbe7f8fa8b98e6942bab1f7c66e3822c339716e5a2ef693ba0f780661d4fa037`
  records 11/11 detached-live checks and unchanged active source hashes.
- `qa/pentatonic-binding-audit-closure.json` records 11/11 checks with report
  fingerprint
  `84717a2e9c0b3bed7262420e2a109bf0407dca9df341d4e2d58874003a9324bb`.
- The shared Cypher report was built once; `validate:cypher --check` and the
  closure `--check` mode perform no writes.
- The frozen CRT-302 package validates without changing its bytes. Its pinned
  CRT-310 Scrum source remains unchanged; the non-admission cross-reference is
  carried by `docs/CRT_310_ADMISSION_WORKFLOW.md` and closure QA instead.
- `MANIFEST.json` and `CHECKSUMS.sha256` include the closure, and full root
  validation passes 411 checks with no failures.
- No decision-ledger entry, class admission, active graph integration, runtime
  change, topology promotion, or zodiac implementation was created.

## Environment snapshot

Observed 2026-08-16; recheck before execution:

| Tool | State |
|---|---|
| Node | `v22.22.0` |
| npm | `10.9.4` |
| Neo4j | `5.26.28` available through native `neo4j` command |
| Docker | unavailable in this WSL distro; not required |

## Stop conditions

Stop and request review if any of these becomes necessary:

- changing the Phase 1 parent counts or witness windows;
- editing a frozen versioned package;
- creating an active graph/bootstrap/query integration;
- writing or mutating a canonical `ScaleState`;
- adding class-level subset edges;
- representing complement or filter projection as subset incidence;
- inventing a zodiac-to-pitch mapping;
- promoting a proposed class or executing a CRT-310 gate; or
- changing the Phase 0 specification without regenerating and revalidating the
  Phase 1 candidate.

## Fresh-context entry instruction

```text
Execute only the next incomplete phase in
scrum/pre-epic-400-pentatonic-graph-binding-phase-2-4-handoff.md.
Read the controlling specification and pinned Phase 1 candidate first.
Preserve planning-evidence and detached-graph boundaries. Do not begin a later
phase until the current phase's focused evidence is green and its status is
updated in Scrum.
```
