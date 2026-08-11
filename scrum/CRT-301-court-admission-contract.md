# CRT-301 — Court admission contract and namespace crosswalk

**Status:** Done · **Priority:** High · **Points:** 5 · **Epic:** [EPIC-003](EPIC-003-pentatonic-court-admission.md)
**Depends on:** GOV-201 (must be closed) · **Blocks:** CRT-302

> **Closure note (2026-08-09):** the root-owned authority document and strict
> machine contract are accepted; the pending all-38 scope is superseded; exact
> `kappa_court`, forbidden-write, source-link, and topology-lock checks are in
> the root verification cascade. This closes the contract only. Court subsystem
> admission remains proposed pending CRT-302 through CRT-309.

## Story

As a framework maintainer, I want every use of "Court state," "Court pole,"
"$\kappa_{\text{court}}$," and "Court filter" assigned to an explicit
namespace and authority layer, so the pentatonic substrate can be admitted
without overwriting canonical topology, office occupancy, or the
Governor-domain contract that EPIC-002 establishes.

## Context

The companion toolkit ships `fivefold_engine.yaml` as `admission: proposed`.
The framework documents (`AGENTS.md` and `TOPOLOGICAL_ANCHORING.md`) describe
the Court, $T_5$ generator, $C_0$–$C_4$ positions, four-bit pole register,
$\kappa_{\text{court}}$, and the $P_c=\operatorname{diag}(c)$ filter in prose
and observed behavior. EPIC-002's GOV-201 establishes the namespace contract
for State Governor, Degree Governor, office occupancy, aspect-Governor
classification, and operational-Governor agent state. The Court must extend
that contract, not rewrite it. The Decision Ledger's 1.1.0 entry records the
Fivefold Engine, Court coordinates, and natural-phenomenon mappings as
`proposed` pending a formal admission procedure; this story starts that
procedure for the Court coordinate only.

## Tasks

- [x] Author `docs/COURT_ADMISSION_AND_AUTHORITY.md` extending GOV-201's
      authority flow with Court State, Court pole register,
      $\kappa_{\text{court}}$, Court filter, and the Topological
      Translocation record.
- [x] Crosswalk each existing meaning of "Court," "fivefold," "pole," and
      "internal/external" against GOV-201's State Governor, Degree Governor,
      `occupiesOffice`, aspect `primaryGovernor`, and agent
      `operationalGovernor` namespaces; declare which are Court-owned,
      which inherit the GOV-201 boundary, and which remain proposed.
- [x] Declare the **fourth compression coordinate**: $\kappa_{\text{court}}
      \in\{0,0.25,0.5,0.75,1\}$, explicitly distinct from $C_P$, $C_H$,
      $C_S$, temperature, entropy, enthalpy, and free energy.
- [x] Record the guard rules: Court pole transitions cannot write
      `ScaleState.office`, `OCCUPIES_OFFICE`, or Degree-Governor metadata;
      $\kappa_{\text{court}}$ cannot equal any other compression coordinate
      or a physical quantity; a Master's Flip is a neighboring Court
      transition, not a permission to invent a Court.
- [x] Declare the amended admission scope in the authority document: the
      five canonical rooted positions $C_0$–$C_4$ of Forte 5–35, plus
      Forte 5–23 and Forte 5–27, plus any other pentatonic set classes
      minimally required to mediate the Aeolian → Harmonic Minor (7–35 →
      7–32) bridge example. Remaining pentatonic set classes stay
      `admission: proposed`.
- [x] Declare the natural-phenomena and thermodynamic-mapping packages
      `physical_phenomena.yaml` and `thermodynamic_processes.yaml` remain
      `admission: proposed` for EPIC-004.
- [x] Record the crosswalk and amended-scope decision in
      `provenance/DECISION_LEDGER.md` under the upcoming release entry.

## Acceptance criteria

- **AC-1**: the authority document defines one authoritative owner and
  allowed writers for every Court namespace; no namespace overloads GOV-201
  and no Court operation is authorized to mutate canonical office occupancy,
  Degree-Governor metadata, or the 7-heptatonic topology.
- **AC-2**: $\kappa_{\text{court}}$ is declared as a fourth, explicitly
  distinct coordinate with the full guard list ("not $C_P$, $C_H$, $C_S$,
  temperature, entropy, enthalpy, or free energy") recorded as a
  machine-readable assertion.
- **AC-3**: the amended admission scope (5 canonical rooted positions plus
  5–23, 5–27, and minimally required bridge set classes) is recorded
  explicitly; the previous "all 38 pentatonic set classes" scope from the
  1.2.0 decision-ledger entry is marked superseded.
- **AC-4**: the natural-phenomena and thermodynamic-mapping packages are
  explicitly declared out of scope; the authority document records that
  their admission belongs to a future EPIC-004.
- **AC-5**: the chosen `fivefold_engine.yaml` fields that promote from
  `proposed` to `admitted` are enumerated; fields that stay `proposed`
  (Fourier filter, semantic-scoped filter, thermodynamic analogies, all
  pentatonic set classes outside the agreed scope) are enumerated and
  crosswalked to the responsible follow-on epic.
- **AC-6**: fixtures prove canonical scale-state offices (`1749`, `2477`,
  boundary state `223`) remain unchanged under any Court operation; no Court
  operation produces an `OCCUPIES_OFFICE` edge.

## Verification

Run a reference/link check across the authority document and decision-ledger
entry; validate the three topology fixtures against canonical JSON and Neo4j
invariant definitions; verify no versioned package source or canonical office
data changed; assert the $\kappa_{\text{court}}$ guard list is a
machine-readable literal in the new Court schema.

## Definition of done

The authority document, namespace crosswalk, $\kappa_{\text{Court}}$ guard,
amended-scope declaration, and decision-ledger entry are reviewed; source
paths resolve; namespace ownership and forbidden writes are explicit; the
three topology fixtures are recorded as evidence; no frozen artifact
changed; manifest/checksums refresh; the EPIC-002 GOV-201 contract remains
the authoritative Governor-domain reference and is not rewritten.

## Recorded evidence

- `schemas/court-admission-contract.schema.json` validates the closed machine
  contract, including exact-ratio `kappa_court` values and the full guard.
- `tests/verification/test_court_admission_contract.py` checks namespace
  ownership, scope, source closure, out-of-scope declarations, and Fivefold
  field disposition.
- `tests/verification/test_graph_topology_locks.py` runs registered Court
  advance and retreat operations while locking states `1749`, `2477`, and
  `223` and their Neo4j CSV authority inputs.
- `tests/test_court_graph_projection.py` rejects forbidden authority fields,
  `OCCUPIES_OFFICE`, and non-ID-only `ScaleState` references even after
  internally consistent rehashing.
