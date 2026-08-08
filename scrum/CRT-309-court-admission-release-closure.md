# CRT-309 — Admission, validator cascade, decision ledger, release closure

**Status:** Ready · **Priority:** High · **Points:** 5 · **Epic:** [EPIC-003](EPIC-003-pentatonic-court-admission.md)
**Depends on:** CRT-301, CRT-302, CRT-303, CRT-304, CRT-305, CRT-306, CRT-307, CRT-308 · **Blocks:** —

## Story

As the release owner, I want the Court admission's authority, substrate,
invariants, filter algebra, runtime ledger, graph projection, agent
skills, optional vault context, and amended admission scope proven end
to end, so the Pentatonic Court subsystem is releasable without weakening
the canonical Seven Governors system or the EPIC-002 namespace contract.

## Context

This is an admission gate, not a paperwork-only closeout. The Decision
Ledger's 1.2.0 entry previously recorded "scope: all 38 pentatonic set
classes" as the pending admission project. The agreed EPIC-003 scope is
narrower (5 canonical rooted positions plus 5–23, 5–27, and minimally
required bridge set classes; Carey CQ/SQ only for the 5–35 seed; only
$P_c=\operatorname{diag}(c)$ as an admitted filter), and this story
records the amendment. The natural-phenomena and thermodynamic-mapping
packages remain `admission: proposed` for a future EPIC-004. Runtime
state and private vault data remain outside release artifacts; existing
versioned packages remain frozen and accepted changes get new versioned
identities.

## Tasks

- [ ] Add package/root scripts and a canonical
      `qa/court-admission-validation.json` PASS/FAIL report covering every
      EPIC-003 success criterion and Court story-specific acceptance
      criteria, with failures tied to fixture IDs.
- [ ] Validate Court schema closure, source fingerprints, deterministic
      builds, substrate fixtures, harmonic-invariant fixtures, Carey
      reproductions, filter-algebra commutation table, Court-ledger
      replay/tamper, Court-transition adjacency, Topological Translocation
      evidence, Court graph parity, Court skill installation, and Court
      vault privacy in the integrated validator.
- [ ] Run end-to-end test cases for: the canonical $C_0$–$C_4$ cycle,
      Cayley Carey $\mathrm{CQ}=1$/$\mathrm{SQ}=\tfrac12$ reproduction,
      the Aeolian → Harmonic Minor bridge through 5–23 vs 5–27,
      $\kappa_{\text{court}}$ cross-namespace-write rejection,
      Topological Translocation acceptance and rejection, Court-ledger
      tamper detection, Court graph rebuild after deletion, installed
      Court skill traces, and the Court vault context-free parity proof.
- [ ] Benchmark Court-aware configurations against model-only and
      retrieval-only baselines with the same Court task corpus; record
      success, off-chain-rejection, non-adjacent-rejection, filter-
      non-commutation, and recovery rates without treating model prose
      as truth.
- [ ] Update `docs/COURT_ADMISSION_AND_AUTHORITY.md`, authority/API/
      operator/graph/skill/vault docs, `START_HERE`,
      `provenance/SOURCE_AUTHORITY.md`, and `provenance/DECISION_LEDGER.md`
      for the Court admission; resolve or explicitly quarantine discovered
      version/path/check-count drift and never copy stale literals into
      new contracts.
- [ ] Append a Decision Ledger amendment entry that explicitly supersedes
      the 1.2.0 "all 38 pentatonic set classes" scope with the narrower
      agreed EPIC-003 scope and cites this validation report as evidence.
- [ ] Perform admission and security review; refresh manifest/checksums;
      run package plus full root validation twice.

## Acceptance criteria

- **AC-1**: one command validates every EPIC-003 success criterion and
  emits a deterministic machine-readable report with failures tied to
  fixture IDs.
- **AC-2**: the end-to-end corpus proves Court substrate closure, Court
  invariant integrity, Court-filter $P_c$ commutation table, Court-
  transition adjacency, $\kappa_{\text{court}}$ namespace separation,
  Topological Translocation gating, Court-ledger replay/tamper detection,
  Court graph rebuildability, Court skill safety, and Court vault privacy.
- **AC-3**: the benchmark records success, off-chain-rejection,
  non-adjacent-rejection, filter-non-commutation, repeated-action, and
  recovery rates without treating model prose as truth.
- **AC-4**: live Neo4j parity is captured for the CRT-306 Court projection
  while the Court classifier, Court-ledger replay, and invariant computation
  also pass with Neo4j unavailable.
- **AC-5**: no secret, personal vault content, absolute private path, live
  Court-ledger state, temporary process, or unreviewed Court-generated
  context appears in the release package or manifest.
- **AC-6**: admission records explicitly state which Court schemas,
  operators, set classes, transitions, and providers are admitted and which
  pentatonic set classes, Fourier/spectral/semantic filters, natural-
  phenomena packages, and thermodynamic mappings remain `proposed` for
  EPIC-004.
- **AC-7**: the Decision Ledger amendment superseding the previous "all
  38 pentatonic set classes" scope is recorded with the narrower EPIC-003
  scope, the responsible admission gate, and a pointer to
  `qa/court-admission-validation.json`.
- **AC-8**: two consecutive clean builds and two full validation runs pass
  with identical intrinsic artifacts and manifest/checksum parity.

## Verification

Execute the package Court suite in isolated state/config directories; an
ephemeral Neo4j Court integration suite; Court-skill explicit-target
installation; synthetic Court vault tests; security/secret scans; the
shared Court benchmark corpus; clean deterministic builds; manifest
generation; and the full root validator twice. Confirm all temporary
servers, databases, target directories, and Court state files are removed.

## Definition of done

All EPIC-003 success criteria and every CRT-3xx story-specific acceptance
criterion are linked to passing evidence; benchmark and QA reports are
reviewed; admission, authority, API, graph, skill, vault, and
decision-ledger amendment records are current; the narrower agreed
admission scope supersedes the original "all 38 pentatonic set classes"
record; no candidate Court system was silently promoted beyond the agreed
scope; release artifacts are deterministic and private-data-free; manifest
/checksums match; full validation passes twice; all nine Court stories and
EPIC-003 are moved to Done; the natural-phenomena and thermodynamic-mapping
packages remain explicitly `admission: proposed` for EPIC-004.