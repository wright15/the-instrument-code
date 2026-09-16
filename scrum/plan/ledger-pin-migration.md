# Ledger Pin Migration

**Scope:** promotion-evidence freshness class-fix and planning intake only.
No decision-ledger edit, D4 spec, engine, admission change, or release flip.
The migration and its green verification precede any new D4 ledger content.

## Mechanism

The promotion builder snapshots live `provenance/DECISION_LEDGER.md` bytes into
artifact field `decisionLedgerSha256`, incorporates it into the evidence
fingerprint, and checks for ledger drift before returning a completed build.
The independent validator compares that field AND the embedded digest-check
record against live bytes, rejecting stale evidence with regenerate-required.
It separately checks that the CRT-348 admission entry remains present. A matching
new digest cannot excuse a missing admission entry or relax the frozen toolkit pin.

Regeneration replaces only current promotion evidence. The artifact schema now
requires the carried binding; older documents require regeneration, not a silent
compatibility fallback. Historical `provenance/fivefold-engine-admission-release.json`
receipt bindings are left untouched; a green current validator does not rebind
that historical admission decision or enlarge its scope.

## Inventory Guard

`npm run validate:ledger-pins` runs `scripts/validate-ledger-pins.py` and its
adversarial tests. It is also the first stage of `npm run validate`, before
content/release validation. It enumerates ledger-consuming scripts and named
literal SHA assignments. Ledger-named literals cannot be allowlisted. Other
named literal pins require exact path/name/digest entries in
`schemas/ledger-pin-allowlist.json`, each with a non-empty reason as data.
Unused and duplicate exceptions fail. No generic frozen-prefix exemption exists.

The initial inventory passed across 75 Python/JavaScript/TypeScript script files,
listing eight ledger consumers and five immutable non-ledger exceptions. Python
uses AST assignment/dictionary inspection; JS/TS uses lexical declarations and
ledger-keyed literals. This is not an arbitrary-code data-flow proof: computed,
encoded or externally loaded constants and sources outside the declared script
scope require review. Immutable research/authoring baselines retain their exact
reviewed pins; none is mislabeled as a live ledger freshness pin.

## Verification Before Planning Edits

- Ran `npm run build:fivefold-engine-promotion-evidence --silent`: PASS,
  10 item groups and 11 exclusion groups; current evidence regenerated.
- Ran `npm run validate:fivefold-engine-promotion-evidence --silent`: PASS,
  independent validator and 12 tests, including simulated ledger-edit rejection,
  regeneration without code changes, rehashed tampering and concurrent drift.
- Ran `npm run validate:ledger-pins --silent`: PASS, inventory and 8 tests,
  including Python/JS/TS literals, unreviewed aliases, missing/blank reasons,
  stale/duplicate exceptions and non-allowlistable ledger pins.

Python commands use the existing project virtual environment. No production
ledger was mutated by tests. The D4 boundary remains at
SHA-256 `751d56d4f01ea1a0d054c8119d178a64b20787aa9fb095a02c99f3ba3b135de2`.

A subsequent independent-entry-removal regression also passed: even regenerated
evidence carrying a matching live hash is rejected if the admission entry is
missing. The final focused rerun passed 13 promotion tests and 8 inventory tests.

## Scheduling And Limits

NEXT_STEPS now explicitly places both open authority decisions in ORR-524's
closure entry. The proposed baseline lifecycle remains a proposal, not a policy
made by queue text. The five-stage implementation-spec checklist, including
verbatim predicate checking, is in `d4-freeze-handoff.md`. Spec relay follows
under separate gates; it is not an output of this pass.

Terminal packaging/validation must report its actual remaining checks, not assume
the earlier 416/2 is still fresh. No green release fixed point is implied by this
class-fix. Browser and Neo4j reruns are not a substitute for the two pending
authority decisions.

## Terminal Execution Record

- Ran the shadow-ladder, twin-hub, fifth-space census and pentatonic closure
  builders, followed by field-derivation, taxonomy and D-tier projection builders.
  Ledger-bound outputs retained their current values: this pass made no ledger
  edit. No research verdict or canonical topology was changed.
- Ran `npm run orrery:check` and `npm run orrery:test`: PASS; 144 tests passed.
- Ran `npm run package:manifest --silent`, then
  `node scripts/build-manifest.mjs --check`: PASS.
- Ran `npm run validate --silent` with project-native Python: the new inventory
  precheck passed; the integrated receipt is **416 passed / 2 failed**.
  Its exact failing names are `frozen composite package payload identities` and
  `declared full-database reproducibility and deployment evidence`. An explicit
  assertion checked that no other integrated check failed.
- Ran prose-consistency and Cypher separately after the red integrated gate
  short-circuited their chained execution: PASS; zero prose violations.
- Ran live promotion-binding and frozen-boundary SHA checks: PASS. The decision
  ledger and the reviewed D4 boundary were not edited by this migration pass.
- Ran `git diff --check`: PASS. Existing unrelated worktree changes were retained.
- Skipped new browser, Neo4j, D4 implementation-spec/engine/pre-flight/production
  execution: outside this migration/intake pass. No historical browser or
  admission-release receipt was relabeled as fresh evidence.

The promotion failure documented during ENTRY 9 landing is resolved by current
regeneration and independent validation, not waived. The two integrated authority
gates remain correctly fail-closed pending the ORR-524 decisions; this result is
not a green release fixed point. Execution logs are retained locally under
`/tmp/opencode/pin-migration-*.log`.
