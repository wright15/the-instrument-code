# CRT-304 Source Authority

## Scope

This package owns deterministic definitions and evidence for
`court.filter`. It does not own heptatonic state identity, Governor offices,
Degree-Governor addresses, mutation records, Court transition events, or
integrated admission. Admission remains `proposed_pending_crt_309`.

## Exact dependencies

The machine bindings, SHA-256 hashes, release IDs, and dependency fingerprints
are in `source/filter-input.json` and are copied into
`canonical/filter-algebra-release.json`. Builds fail closed if any bound byte
or declared dependency fingerprint changes.

Primary sources are:

- CRT-302 `canonical/substrate-registry-release.json` for C0-C4, rooted 5-23,
  rooted 5-27, and the proof that no additional bridge is required.
- CRT-303 `canonical/harmonic-invariant-registry.json` for the bound harmonic
  invariant release.
- The mutation audit operator registry and 3,402 application rows.
- `canonical/universal-heptatonic-ledger.json` for all 462 operands and state
  identity.
- `schemas/court-admission-contract.json` and
  `docs/COURT_ADMISSION_AND_AUTHORITY.md` for write authority.
- `framework/TOPOLOGICAL_ANCHORING.md` and `framework/AGENTS.md` for filter and
  route semantics.
- `court-mathematics/docs/01_COURT_LEXICON.md` for representation vocabulary.

No frozen dependency is copied or edited.

## Ledger declaration

Canonical non-commutation evidence declares the typed namespace
`court.routeSemantics`, `runtimeEventRequired: true`, and `eventPointer: null`.
These records require a future live event but never invent one. CRT-305 owns
runtime event realization.

## Proposed types

Fourier, graph-spectral, and semantic-scoped filters remain proposed with
explicit blocker pointers in the registry. They are not instances of
`CourtFilterOperator`; the strict operator schema admits only
`linear_diagonal`.
