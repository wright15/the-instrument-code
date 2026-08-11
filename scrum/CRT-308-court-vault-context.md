# CRT-308 — Optional Court context in Obsidian vault bundles

**Status:** Done · **Priority:** Medium · **Points:** 5 · **Epic:** [EPIC-003](EPIC-003-pentatonic-court-admission.md)
**Depends on:** CRT-307, GOV-208 · **Blocks:** CRT-309

## Story

As a framework author, I want an optional Obsidian vault adapter that
compiles selected Court and Fivefold notes into bounded, fingerprinted
context, so I can personalize the local agent with Court pedagogy and
exemplars through transparent Markdown without making the vault a hidden
Court authority or execution database.

## Context

GOV-208 establishes the opt-in Obsidian vault provider, strict frontmatter,
deterministic link resolution, traversal limits, context-bundle compilation,
privacy controls, and context-free parity. The vault can already carry
explanations for Governor domains, bridge rules, examples, and successful
traces; CRT-308 extends the same pattern to Court substrate, invariants,
filters, transitions, and the Aeolian → Harmonic Minor bridge example.
Vault notes remain authored context and evidence; canonical Court policy,
classification, transition, and admission still come from versioned runtime
artifacts and the CRT-305 Court-ledger extension.

## Tasks

- [x] Extend GOV-208's opt-in vault provider with Court-specific frontmatter
      fields: `courtRootedPosition`, `pentatonicSetClass`, `kappaCourt`,
      `courtFilterMask`, `admissionStatus`, and `courtProvenanceRef`; the
      provider's disabled/no-path behavior must match context-free Court
      runtime behavior exactly.
- [x] Extend deterministic link resolution and traversal limits to Court
      notes; broken links return explicit results and never silently promote
      a Court note to admitted policy.
- [x] Extend the canonical `ContextBundle` JSON to carry Court substrate
      references, Court invariant citations, Court filter route-semantics
      pointers, $\kappa_{\text{court}}$ values, and provenance; preserve
      CRT-302 admission status as a separate axis from any contextual
      refinement.
- [x] Preserve the base Court classification (`admitted`, `admitted-bridge`,
      `proposed`); represent any contextual Court refinement as a
      separate rule-evidenced result that can abstain and be replayed
      without changing admitted scope.
- [x] Never write the vault or raw private Court note content into Neo4j,
      release artifacts, logs, model traces, or the CRT-305 Court ledger
      by default; run the vault provider alongside the CRT-306 projection
      without changing Court-query fingerprints.
- [x] Add Court privacy fixtures and synthetic vault content covering the
      canonical $C_0$–$C_4$ cycle, 5–23 and 5–27 bridge notes, a
      Topological Translocation example note, and a vault note that
      mislabels a proposed Court set class as `admitted` (must be rejected
      or downgraded).

## Acceptance criteria

- **AC-1**: the same allowed vault snapshot and Court request produce
  byte-identical context bundles independent of filesystem enumeration
  order, locale, and absolute machine path; repeated builds across two
  clean invocations match hashes.
- **AC-2**: with no configured vault, the Court runtime produces the exact
  context-free classification/replay result/fingerprint; enabling Court
  context never silently changes canonical Court policy, $\kappa_{\text{court}}$,
  CRT-302 admission status, or office occupancy.
- **AC-3**: traversal cannot escape the vault or exceed declared limits;
  symlinks, hidden paths, `.obsidian`, binaries, oversized notes, and
  malformed Court frontmatter fail or exclude with deterministic
  diagnostics.
- **AC-4**: Court note claims marked `proposed` or `admitted-bridge` remain
  evidence candidates; they cannot become admitted canonical Court policy
  without the normal admission path from CRT-309; a note mislabeling a
  proposed set class as admitted is rejected or downgraded with a
  diagnostic naming the responsible admission gate.
- **AC-5**: privacy fixtures prove sensitive/raw Court note text, absolute
  paths, and live vault fingerprints are absent from Neo4j exports, the
  release manifest, QA fixtures, logs, installed Court skills, and the
  CRT-305 Court ledger.
- **AC-6**: a ContextBundle that references a Court invariant (e.g.
  $G_{\text{Court}}=2I_4$) cites the CRT-303 provenance pointer; missing
  or dangling Court invariant pointers are schema failures.

## Verification

Use synthetic Court vault fixtures for stable traversal, cyclic Court links,
broken links, duplicate Court note IDs, malformed Court frontmatter,
symlink escape, hidden/binary/oversized Court files, Court sensitivity,
contextual Court conflict (a vault note overclaiming admission), context-
free parity, and repeated-build byte comparison. No personal vault is
required for automated tests.

## Definition of done

The Court-extended vault provider, Court frontmatter, Court `ContextBundle`
fields, deterministic compiler, safety/limit controls, synthetic Court
fixtures, privacy tests, and Court context-free parity proof are complete;
the provider remains read-only and disabled by default; package/root
validation and Court context documentation pass; no Court vault or live
state artifact enters the release manifest; GOV-208 contracts remain
unchanged.

**Closure evidence (2026-08-10):** `src/governor/court_vault_context.py`, strict
Court frontmatter/bundle schemas, seven focused tests, deterministic 3/3 report,
exact CRT-302..306 byte bindings, false-admission downgrade, and unchanged
runtime-policy/query hashes pass.
