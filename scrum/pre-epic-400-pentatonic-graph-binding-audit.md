# Pre-EPIC-400 Pentatonic Graph Binding Audit — Phase 0-4 Plan

**Status:** Done; Phases 0-4 complete as planning evidence · **Priority:** High · **Points:** TBD
**Epic:** None activated (planning only; candidate for EPIC-004 scope)
**Depends on:** CRT-302 substrate registry, CRT-306 Court graph projection,
`scrum/pre-epic-400-audit-notes.md` · **Blocks:** Any `SUBSET_OF` /
`PROJECTS_TO` graph binding, any zodiac sidecar promotion, any CRT-310
per-class parent evidence

Planning document authored 2026-08-16; Phase 0 completed the same day. It does
not activate an epic, admit a
pentatonic set class, promote the fivefold engine, change runtime behavior,
write zodiac material into any graph, or amend `provenance/DECISION_LEDGER.md`.
It records the corrected premises and the phased execution plan for the
heptatonic↔pentatonic graph-binding audit proposed by the 5-35 / 7-35
"three-parent" design intuition.

Fresh-context continuation for the remaining work:
[`pre-epic-400-pentatonic-graph-binding-phase-2-4-handoff.md`](pre-epic-400-pentatonic-graph-binding-phase-2-4-handoff.md).

## Story

As a release maintainer, I want a deterministic audit of the pentatonic↔
heptatonic subset structure (parent counts, complement pairs, root-anchored
mode naming) and a detached Neo4j binding experiment, so the Court/projection
design can be inspected as planning evidence without writing to the active
graph or violating the CRT-309 admission boundaries.

## Phase 0 correction record

The controlling corrected specification is
[`docs/PENTATONIC_GRAPH_BINDING_AUDIT_SPEC.md`](../docs/PENTATONIC_GRAPH_BINDING_AUDIT_SPEC.md).
It supersedes the informal arithmetic in the original prompt and records these
scope-critical corrections:

1. The three-parent property is expected to characterize 5-35, not every
   pentatonic class. Phase 1 must independently reproduce the complete 3/2/1/0
   distribution.
2. Repository binary fields use multiple named orientations. Mars
   `101011010110` is the constructive Mixolydian string and corresponds to
   canonical pitch mask 1717; `010101101011` is its `T1` internal-pole source
   string and also an `I3` output witness, but not its complement.
3. Constructive-coordinate integer 1321 and Court canonical pitch mask 1321
   are different coordinate claims. Equal integers cannot be compared without
   their representation namespace.
4. C2/mask 1189 has the Mars-Mercury-Jupiter parent window. C4/mask 1321 has
   Jupiter-Venus-Saturn. Both are 5-35; registered 5-32 has zero 7-35 parents.
5. Parent incidence is the subset relation. Exact complement, transposition,
   inversion, and filter projection are distinct operators even when outputs
   coincide for a particular symmetric set.
6. The structured sources partition twelve zodiac records among two
   luminaries and five bipolar governors, but they do not assign one pitch
   class to each sign. Equal cardinality is not yet a 12-TET isomorphism.

These are Phase 0 planning expectations, not admitted mathematical evidence.
Phase 1 must re-derive them through committed deterministic code.

## Guiding constraints

1. **Read-only planning evidence scope.** This audit produces inspection
   material. It does not promote zodiac, fivefold, or any pentatonic class to
   operational state, topology, or Governor authority
   (`docs/GOVERNOR_DOMAIN_AUTHORITY.md`; `schemas/court-admission-contract.json`
   `forbiddenWrites`).
2. **Zodiac remains prose-tier.** The twelve-sign Governor/pole sidecar stays
   "Prose context until separately admitted"
   (`docs/GOVERNOR_DOMAIN_AUTHORITY.md:171`). A pitch-class bijection remains
   unresolved.
3. **No in-place edits of frozen versioned packages.** Any substrate release
   (`seven-governors-court-substrate-v0.1.0/`) change, including a change to
   `complement-map.json` `rootedPairs`, requires a separately versioned
   follow-up, per `provenance/SOURCE_AUTHORITY.md`.
4. **Arithmetic comes from scripts.** No model-computed number enters any
   canonical artifact; scripts must re-derive and diff against the tables
   above.
5. **Negative cases are required.** 5-32 → 0 parents and 5-23/5-27 → 2 parents
   are mandatory assertions, mirroring the D-tier negative-case discipline.

## Phase 0 — Corrected audit spec (frontier reasoning, max effort) [Complete]

**Inputs:** this planning file, `pentatonic-set-class-registry.json`,
`complement-map.json`, `governor-offices.csv`, admission-contract and
domain-authority docs.

**Actions:**

1. Author the corrected audit specification as one committed document,
   replacing the false universal 3-parent premise with a discriminator that
   Phase 1 must test.
2. Lock the integer/pitch-string orientation namespaces; distinguish the Mars
   `T1` pole pair from complement; correct the 5-32/C2/C4 labels; and declare
   the root-anchored mode-naming convention.
3. Record the scope statement: read-only planning evidence; no admission
   claims; no `forbiddenWrites` surface; zodiac stays prose-tier.
4. Define the exact phase 1-4 artifacts, schemas, and acceptance criteria.

**Outputs:**

- `docs/PENTATONIC_GRAPH_BINDING_AUDIT_SPEC.md`
- the verbatim phase handoff block in specification section 12

**Model note:** this phase is pure design and admission-gate language. It is
the highest-value frontier step. The re-derivation diff (phase 1) is its
verification gate, not model prose.

## Phase 1 — Deterministic enumeration (worker-capable; frontier reviews negative cases) [Complete]

**Inputs:** corrected spec; the pentatonic registry; complement map; Court and
bridge rooting registries; canonical network; Governor-office projection CSV;
`governors.yaml`; current Court admission release; and the authority documents
listed in specification section 3.

**Actions:**

1. Add the exact generator/validator/schema/test paths declared in the Phase 0
   specification; enumerate all 792 five-note sets × the 12 diatonic sets; emit
   per-class parent tables, per
   Court-mask parent evidence, and complement-pair records.
2. Assert the mandatory negative cases in specification section 7, including
   5-32 → 0, the Mars `T1`/`I3`/not-complement guard, the
   coordinate-collision guard, and the C2/C4 parent-window distinction.
3. Emit parent-incidence evidence separately from the existing exact-complement
   `rootedPairs`; do not modify the substrate release in place.
4. Diff script output against specification section 6; any
   mismatch fails the phase and is re-audited, never silently adopted.

**Outputs:** the exact Phase 1 generator, validator, schemas, tests, candidate,
negative cases, and `qa/pentatonic-7-35-parent-audit-validation.json` paths in
specification section 7. The QA report owns the expected-baseline diff result.

**Completion evidence (2026-08-16):**

- candidate fingerprint:
  `048d9195d156a769c05887ea41a6ccffae26b36757996fffdc12a0ade3122ec5`;
- independent QA report fingerprint:
  `16969457214966f8f9138dad7b7e6221b4cf950a962e6806e5900fd87828629b`;
- 792 exact pentatonic masks, 252 subset incidences, 38 TnI class summaries,
  and seven reviewed root-0 witnesses;
- 19/19 independent validation checks and nine semantic adversarial rejections;
  and
- focused test result: 12 passed.

## Phase 2 — Detached Neo4j audit projection (frontier designs invariants; execution is mechanical) [Complete]

**Inputs:** phase 1 artifact and the active `neo4j/court-mathematics/` assets as
read-only design references.

**Actions:**

1. Create the detached `neo4j/pentatonic-binding-audit/` experiment declared
   in the specification. Run it only in a disposable Neo4j instance with a
   temporary volume; reject the active application URI and do not modify or
   wire into active CRT-306 assets.
2. Add audit-scoped exact-realization `SUBSET_OF_7_35` edges to ID-only
   `ScaleState` reads. A set-class summary cannot be a subset-edge endpoint.
3. Add validation invariants for C0-C4 and the two bridge rootings while
   keeping complement evidence and filter projection separate.
4. Read-projection only: no zodiac nodes, no office writes, no pole
   disposition, no writable-runtime change, and no direct `PROJECTS_TO` edge.

**Outputs:** the detached README, schema/import/reset/teardown/validation
Cypher, `tests/pentatonic_binding_audit/neo4j-live.test.mjs`, and
`qa/pentatonic-binding-audit-neo4j-validation.json`; no active query-catalog or
bootstrap change.

**Completion evidence (2026-08-16):**

- seven candidate-derived exact realizations and 19 `SUBSET_OF_7_35` edges,
  idempotent on reimport;
- all eight detached Cypher invariants passed, including exact C0-C4 and bridge
  cardinalities and independent bitwise subset replay;
- missing `ScaleState` endpoint rejection rolled back without manufacturing an
  endpoint or retaining partial audit data;
- ID-only `ScaleState` fingerprint
  `ab76011d687455c08f23791a8607fb32bb0015730240fcf94aacdc8e572449ff`
  remained unchanged through import, validation, reset, and teardown;
- native harness test: 1 passed with no process, port, schema, or temporary-file
  residue;
- shared Cypher syntax validation: 23 files passed, including all five detached
  audit files; and
- QA report fingerprint:
  `fbe7f8fa8b98e6942bab1f7c66e3822c339716e5a2ef693ba0f780661d4fa037`.

## Phase 3 — Zodiac sidecar planning appendix (frontier reasoning) [Complete]

**Inputs:** `governors.yaml` zodiacal systems, `framework/AGENTS.md` tier
structure.

**Actions:**

1. Author the twelve-sign Governor/pole/source-vector table (2 monopolar
   luminaries, 5 bipolar governors) as a planning appendix of the audit report.
2. Record that the five bipolar external/internal source-vector pairs satisfy
   `T1`, not complement, and separately record their coincident inversion
   witnesses without treating inversion as the authored derivation.
3. Explicitly mark it "prose context, not admitted" per
   `GOVERNOR_DOMAIN_AUTHORITY.md:171`; no Zodiac labels in Cypher, no
   `court_zodiac.py` runtime change, and no invented sign-to-pitch mapping.

**Outputs:** appendix section with the mapping table and its non-admission
statement.

**Completion evidence (2026-08-16):**

- all 12 authored zodiac records list exact node, sign, Governor, pole,
  source-vector field, source vector, `T1` pair, and coincident inversion
  witness where applicable;
- structured replay passed for seven Governors, 12 records, five `T1` checks,
  five inversion checks, and all 12 rendered rows;
- eleven admission/non-equivalence wording guards passed and independent
  admission-language review found no remaining issue;
- Mercury remains the engine/ledger pair and Mars/Jupiter/Venus/Saturn remain
  the four Court registers; and
- report SHA-256:
  `814512d4f4360dc7e9ab77b8190043a155ae8253d2729dbb21f33db91e37f1df`.

## Phase 4 — Closure (worker executes; wording signed off by frontier review or maintainer) [Complete]

**Inputs:** all phase artifacts, handoff package.

**Actions:**

1. Add and run `build:pentatonic-binding-audit`,
   `test:pentatonic-binding-audit`, and `validate:pentatonic-binding-audit`,
   including build-twice, negative controls, and detached Cypher checks.
2. Run focused validators, refresh `MANIFEST.json` and `CHECKSUMS.sha256`, then
   run full root validation against the refreshed state. Repeat refresh and
   full validation if any validator writes a tracked artifact.
3. Draft cross-references into `scrum/README.md`, `provenance/SOURCE_AUTHORITY.md`,
   QA records, the pre-epic-400 notes
    (Step 2 zodiac sidecar row), and CRT-310 workflow as planning evidence only.
4. **Wording gate:** admission-language edits in scrum/provenance records are
   reviewed by a frontier pass or the maintainer before being finalized;
   worker-drafted wording is not silently adopted.

**Outputs:** `qa/pentatonic-binding-audit-closure.json`, refreshed
manifest/checksums, updated cross-references, this file marked Done, and a full
validation pass that produces no further tracked change.

**Completion evidence (2026-08-16):**

- maintainer authority-refresh approval was obtained before the
  `SOURCE_AUTHORITY.md` edit;
- refreshed candidate, Phase 1 QA, and Phase 2 QA fingerprints are
  `048d9195...2ec5`, `16969457...629b`, and `fbe7f8fa...a037`; all mathematical
  counts and witness windows remain unchanged;
- all three package entry points pass, including 12 focused Python tests, the
  isolated native Neo4j test, 19 independent checks, nine adversarial
  rejections, and 23 Cypher syntax files;
- deterministic closure report: 11 passed, 0 failed, fingerprint
  `84717a2e9c0b3bed7262420e2a109bf0407dca9df341d4e2d58874003a9324bb`;
- `MANIFEST.json` and `CHECKSUMS.sha256` include the closure and all audit
  artifacts; full root validation passes 411 checks with zero failures; and
- no decision-ledger entry, CRT-310 execution, admission, active graph wiring,
  runtime change, topology promotion, or zodiac implementation occurred.

## Model and effort assignments

| Phase | Primary runner | Model value | Effort |
|---|---|---|---|
| 0 | Frontier (max reasoning), completed | Design, gate language, error correction | High |
| 1 | Worker (scripts) | None needed for arithmetic; frontier reviews negative-case design | Low |
| 2 | Frontier for invariant design; worker executes | Invariant correctness | Medium |
| 3 | Frontier | Admission-gate language | Medium |
| 4 | Worker; frontier sign-off on wording | Wording compliance | Low |

Environment note: Phase 0 used the current frontier session. If a different
frontier provider is intended for later review, configure it before that phase;
the deterministic evidence remains provider-independent.

## Phase handoff package

Each phase boundary ships the verbatim block in specification section 12.
Phase 4 in a fresh context must not reconstruct it from memory.

## Acceptance criteria (planning level)

1. Phase 1 output diff matches the planning-time tables exactly, including all
   negative cases.
2. Phase 2 detached Cypher passes the repo syntax validator and the parent-count
   invariants hold on the seeded audit projection without active graph wiring.
3. Phase 3 appendix contains no admission claim and cites the prose-tier
   authority line.
4. Phase 4 validation cascade is green and manifests/checksums are refreshed.
5. No frozen package is edited in place and no `forbiddenWrites` surface is
   touched in any phase.

## Explicit non-goals

- No epic activation, no admission decision, no CRT-310 gate execution.
- No zodiac/fivefold promotion, no Mercury-engine implementation.
- No writable-runtime or office/pole-disposition changes.
- No in-place substrate release mutation; the existing exact-complement
  `rootedPairs` remain unchanged.
