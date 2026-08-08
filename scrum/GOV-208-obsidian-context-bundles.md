# GOV-208 — Optional read-only Obsidian context bundles

**Status:** Ready · **Priority:** Medium · **Points:** 5 · **Epic:** [EPIC-002](EPIC-002-governor-domain-agent-runtime.md)
**Depends on:** GOV-207 · **Blocks:** GOV-209

## Story

As a framework author, I want an optional Obsidian vault adapter that compiles
selected notes and wikilinks into bounded, fingerprinted context, so I can
personalize the local agent through transparent Markdown without making the
vault a hidden database or execution authority.

## Context

Obsidian is useful as a human-readable contextual twin: notes can explain
Governor domains, bridge rules, examples, and successful traces. Vault notes
remain authored context/evidence. Canonical policy, classification, state, and
admission continue to come from versioned runtime artifacts and the ledger.

## Tasks

- [ ] Add an opt-in vault provider requiring an explicit absolute vault path;
      disabled/no-path behavior must match context-free runtime behavior.
- [ ] Define strict frontmatter for note ID, aspect/rule references, Governor,
      admission/status, source, sensitivity, and allowed traversal depth.
- [ ] Parse Markdown/frontmatter/wikilinks in normalized relative-path order
      with deterministic link resolution and explicit broken-link results.
- [ ] Exclude `.obsidian`, hidden files, attachments/binaries, ignored paths,
      and symlink escapes; enforce file-count, byte, depth, and result limits.
- [ ] Compile canonical `ContextBundle` JSON with selected excerpts, logical
      links, provenance, policy fingerprint, vault fingerprint, and exclusions.
- [ ] Preserve `baseClassification`; represent any contextual refinement as a
      separate rule-evidenced result that can abstain and be replayed.
- [ ] Never write the vault or project raw private note content into Neo4j,
      release artifacts, logs, or model traces by default.

## Acceptance criteria

- **AC-1**: the same allowed vault snapshot and request produce byte-identical
  context bundles independent of filesystem enumeration order, locale, and
  absolute machine path.
- **AC-2**: no configured vault yields the exact context-free classification
  result/fingerprint; enabling context never silently changes canonical policy
  or office occupancy.
- **AC-3**: traversal cannot escape the vault or exceed declared limits;
  symlinks, hidden paths, `.obsidian`, binaries, oversized notes, and malformed
  frontmatter fail or exclude with deterministic diagnostics.
- **AC-4**: note claims marked proposed/unresolved remain evidence candidates;
  they cannot become admitted BridgeRules without the normal admission path.
- **AC-5**: privacy fixtures prove sensitive/raw note text, absolute paths,
  and live vault fingerprints are absent from Neo4j exports, manifests, QA
  fixtures, logs, and installed skills.

## Verification

Use synthetic vault fixtures for stable traversal, cyclic links, broken links,
duplicate IDs, malformed frontmatter, symlink escape, hidden/binary/oversized
files, sensitivity, contextual conflict, no-vault parity, and repeated-build
byte comparison. No personal vault is required for automated tests.

## Definition of done

The opt-in provider, frontmatter and ContextBundle schemas, deterministic
compiler, safety/limit controls, synthetic fixtures, privacy tests, and
context-free parity proof are complete; the provider is read-only and disabled
by default; package/root validation and context documentation pass; no vault
or live-state artifact enters the release manifest.
