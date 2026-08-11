# GOV-209 — QA, admission, documentation, and release closure

**Status:** Done · **Priority:** High · **Points:** 5 · **Epic:** [EPIC-002](EPIC-002-governor-domain-agent-runtime.md)
**Depends on:** GOV-205, GOV-206, GOV-207, GOV-208 · **Blocks:** —

## Story

As the release owner, I want the Governor runtime’s authority, determinism,
agent behavior, graph projection, optional vault context, and admission status
proven end to end, so the local-agent harness is releasable without weakening
the canonical Seven Governors system.

## Context

This is an admission gate, not a paperwork-only closeout. Fivefold/Court and
pentatonic topology remain proposed unless separately reviewed. Runtime state
and private vault data remain outside release artifacts. Existing versioned
packages remain frozen; accepted changes receive new versioned identities.

## Tasks

- [x] Add package/root scripts and a canonical
      `qa/governor-runtime-validation.json` PASS/FAIL report.
- [x] Validate schema closure, source fingerprints, deterministic builds,
      classifier fixtures, physical calculations, ledger replay/tamper,
      verification/loop behavior, graph parity, skill installation, and vault
      privacy in the integrated validator.
- [x] Run end-to-end cases for Rayleigh/Jupiter, aeolian/mixed landforms,
      boundary office withholding, admitted scale mutation, verified Astro
      startup, invalid move rejection, and repeated-action stop.
- [x] Benchmark model-only, retrieval-only, deterministic-tool, and state-
      machine-backed configurations with the same task corpus.
- [x] Update authority/API/operator/graph/skill/vault docs, START_HERE,
      provenance release records, source authority, and decision ledger.
- [x] Resolve or explicitly quarantine discovered version/path/check-count
      drift; do not copy stale literals into new contracts.
- [x] Perform admission and security review, refresh manifest/checksums, and
      run package plus full root validation twice.

## Acceptance criteria

- **AC-1**: one command validates every epic success criterion and emits a
  deterministic machine-readable report with failures tied to fixture IDs.
- **AC-2**: the end-to-end corpus proves physical/symbolic separation,
  facet-level classification, office-withheld boundaries, validated moves,
  evidence-backed success, loop stopping, graph rebuildability, and vault
  privacy.
- **AC-3**: the benchmark records success, false-success, invalid-transition,
  loop, tool-call, and recovery rates without treating model prose as truth.
- **AC-4**: live Neo4j parity is captured for the projection story while the
  classifier/state machine also pass with Neo4j unavailable.
- **AC-5**: no secret, personal vault content, absolute private path, live
  runtime ledger, temporary process, or unreviewed generated context appears
  in the release package or manifest.
- **AC-6**: admission records explicitly state which runtime schemas, rules,
  skills, and providers are admitted and which Fivefold/phenomena/pentatonic
  items remain proposed or unresolved.
- **AC-7**: two consecutive clean builds and two full validation runs pass with
  identical intrinsic artifacts and manifest/checksum parity.

## Verification

Execute the package suite in isolated state/config directories, an ephemeral
Neo4j integration suite, explicit-target skill installation, synthetic vault
tests, security/secret scans, the shared benchmark corpus, clean deterministic
builds, manifest generation, and the full root validator twice. Confirm all
temporary servers, databases, target directories, and state files are removed.

## Definition of done

All EPIC-002 success criteria and every story-specific acceptance criterion are
linked to passing evidence; benchmark and QA reports are reviewed; admission,
authority, API, and decision records are current; no candidate system was
silently promoted; release artifacts are deterministic and private-data-free;
manifest/checksums match; full validation passes twice; all nine stories and
EPIC-002 are moved to Done.

**Closure evidence (2026-08-10):** release 1.3.0 records the exact Governor
runtime identity; GOV-208 proves context-free parity and privacy; existing
classifier/runtime/graph/skill suites plus integrated root validation pass. The
root suite passed 323 tests and 281/281 release checks. The Court is admitted
separately and narrowly by CRT-309 rather than implied here.
