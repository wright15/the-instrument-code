# CRT-302 — Pentatonic substrate registry

**Status:** Done · **Priority:** High · **Points:** 8 · **Epic:** [EPIC-003](EPIC-003-pentatonic-court-admission.md)
**Depends on:** CRT-301 · **Blocks:** CRT-303, CRT-305, CRT-306

> **Closure note (2026-08-09):**
> `seven-governors-court-substrate-v0.1.0` contains the strict 38-class
> registry, C0-C4, reviewed 5-23/5-27 bridge rootings, full T5 root cycle,
> complement maps, expected-failure fixtures, source fingerprints, and
> byte-identical clean/reordered builds. Internal record admission has no
> integrated effect before CRT-309.

## Story

As a Court runtime author, I want a machine-readable registry of the
admitted pentatonic set classes — the five canonical rooted positions
$C_0$–$C_4$ of Forte 5–35, plus Forte 5–23 and Forte 5–27, plus any other
set classes minimally required to mediate the Aeolian → Harmonic Minor
bridge — with their 12-bit masks, $T_5$ generator cycle positions, and
complement map to the 7-heptatonic topology, so the invariants,
transitions, and filter algebra can be computed against canonical data
rather than prose.

## Context

The substrate currently exists only in `schemas/governors.yaml` (canonical
Court constants), `fivefold_engine.yaml` (the five canonical states with
masks and pole registers), and `framework/AGENTS.md` (the $T_5$ cycle,
$C_0$–$C_4$ masks, and the Court pole-table). No machine-readable registry
unifies admitted and proposed pentatonic set classes, declares which are
canonical Court positions, and records the 5–35 ↔ 7–35 complement relation
against the existing 7-heptatonic topology in
`canonical/topology-identity-definitions.json`. The amended admission scope
(CRT-301) is narrower than the original "all 38 pentatonic set classes"
declaration; the registry must record admission status per set class.

## Tasks

- [x] Create a new versioned `court-substrate` package rather than editing
      the frozen `fivefold_engine.yaml` in place.
- [x] Add a strict schema for `PentatonicSetClass`, `CourtRootedPosition`,
      `T5CycleEntry`, `ComplementMap`, `AdmissionStatus`, and
      `SubstrateRegistryRelease`.
- [x] Register the five canonical rooted positions $C_0$–$C_4$ of Forte
      5–35 with: 12-bit mask, pitch-class set, Mars/Jupiter/Venus/Saturn
      pole register, internal-poles set, $\kappa_{\text{court}}$ value,
      XOR support against the previous position, and `admission: admitted`.
- [x] Register Forte 5–23 and Forte 5–27, plus any other pentatonic set
      classes minimally required to mediate the Aeolian (7–35) → Harmonic
      Minor (7–32) bridge, with masks, rootings, and
      `admission: admitted-bridge`.
- [x] Register every other pentatonic set class in the 38-class field
      with `admission: proposed` and an explicit `admission-blocker`
      pointing to the follow-on admission story; the registry must never
      silently promote a proposed set class to canonical status.
- [x] Record the $T_5$ generator cycle `0 → 5 → 10 → 3 → 8` and the
      rooted-position mapping; declare which rooted positions are Court
      candidates and which are not.
- [x] Record the set-class complement map 5–35 ↔ 7–35 against
      `canonical/topology-identity-definitions.json`; record complement
      pairs for the admitted bridge set classes.
- [x] Add deterministic `--check` and `--emit` build modes with source
      hashes; two clean builds from identical inputs produce byte-identical
      canonical JSON and the same substrate fingerprint.

## Acceptance criteria

- **AC-1**: the schema rejects unknown properties, invalid masks, weight
  other than 5, missing complement, missing $T_5$ cycle position, and
  dangling admission status.
- **AC-2**: every admitted set class (5 canonical rooted positions plus
  5–23, 5–27, and minimally required bridge set classes) has a 12-bit
  weight-5 mask, $T_5$ cycle position, complement pointer into the
  7-heptatonic registry, and admission status.
- **AC-3**: the registry marks the 5 canonical rooted positions
  `admission: admitted`, the bridge set classes
  `admission: admitted-bridge`, and every other pentatonic set class
  `admission: proposed` with a recorded blocker.
- **AC-4**: $T_5$ cycle entries reproduce the canonical sequence
  `0 → 5 → 10 → 3 → 8`; a $T_5$ entry outside the cycle is rejected.
- **AC-5**: off-chain configurations (any weight-5 mask outside the
  admitted set) that claim canonical status are rejected with a
  machine-readable `off_chain` reason and a pointer to the proposed-set-class
  record they would extend.
- **AC-6**: two clean builds from identical inputs produce byte-identical
  canonical JSON and the same substrate fingerprint; reordered input rows
  do not change canonical output.

## Verification

Validate positive fixtures (5 canonical positions, 5–23, 5–27, the Aeolian
→ Harmonic Minor bridge mediating set classes) plus unknown-field,
wrong-weight, dangling-complement, missing-$T_5$, off-chain-claim, and
reordered-input negative fixtures. Run `--check`/`--emit`/`--check` in
separate processes and compare bytes and hashes.

## Definition of done

The new `court-substrate` package, strict schema, registry, complement map,
$T_5$ cycle, admission-status ledger, builder, and fixture suite are
committed; all negative fixtures fail for the expected reason; deterministic
output is proven twice; existing frozen packages and the EPIC-002 GOV-202
contract remain unchanged; package and root validation pass; documentation,
manifest, and checksums include the new substrate.

## Recorded evidence

- Package validation report:
  `seven-governors-court-substrate-v0.1.0/qa/validation-report.json`.
- Determinism report:
  `seven-governors-court-substrate-v0.1.0/qa/determinism-report.json` (4/4).
- Negative fixtures cover unknown fields, invalid mask range, wrong weight,
  missing/dangling complements, missing/invalid T5 references, off-chain
  promotion with a proposed-record pointer, dangling admission status, wrong
  kappa, and wrong XOR support.
- `tests/verification/test_court_substrate_registry.py` independently checks
  38-class closure, C0-C4, bridge subsets/complements, and full T5 closure.
