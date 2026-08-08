# CRT-305 — Court runtime lifecycle and ledger extension

**Status:** Partial · **Priority:** High · **Points:** 8 · **Epic:** [EPIC-003](EPIC-003-pentatonic-court-admission.md)

> **Status note (2026-08-07):** parallel `CourtState` fingerprint records and a
> hash-chained Court transition ledger with byte-exact replay and
> modify/delete/insert/reorder detection are implemented in
> `src/governor/court_ledger.py` and verified in
> `tests/verification/test_runtime_security.py`. Transitions are restricted to
> registered adjacent moves over the canonical `C0`–`C4` positions.
> **Remaining:** exact `kappa_court`, pole-register derivation, translocation
> records, a Court session store, and the full Court token lifecycle.
**Depends on:** CRT-302, GOV-204 · **Blocks:** CRT-307, CRT-309

## Story

As an agent-runtime operator, I want the Court state machine to enumerate
legal Court transitions, validate one proposed transition, and record every
accepted Court transition in a replayable ledger extension, so neither the
model nor the graph can invent Court state, skip an adjacent transition, or
silently equate $\kappa_{\text{court}}$ with another compression coordinate.

## Context

The Court lifecycle is described in `framework/TOPOLOGICAL_ANCHORING.md`
and `framework/AGENTS.md`:

- Five canonical Court states $C_0$–$C_4$ on the path
  $C_0 \leftrightarrow C_1 \leftrightarrow C_2 \leftrightarrow C_3
  \leftrightarrow C_4$.
- Ordinary modulation moves only to an adjacent position; non-adjacent
  jumps require an explicit Topological Translocation record (per
  AGENTS.md's three-way distinction between Nodal Shift, Court Modulation,
  and Topological Translocation).
- Each adjacent transition changes exactly one of the four Element poles
  (Mars → Jupiter → Venus → Saturn); the complementary adjacent direction
  is the release.
- The Master's Flip is a neighboring Court transition, not a permission to
  invent a Court.
- $\kappa_{\text{court}} \in \{0, 0.25, 0.5, 0.75, 1\}$ is a fourth,
  explicitly-distinct compression coordinate (CRT-301).
- The chosen `fivefold_engine.yaml` already records `canonical_states`,
  `canonical_transitions`, `geometry`, `runtime_cycle`, and `guards`.

GOV-204 establishes the authoritative transition engine, validation tokens,
and hash-chained ledger. CRT-305 extends that ledger namespace; it does not
overwrite the GOV-204 supplied `AgentState`/`LedgerEvent` contracts. Court
events are a typed extension to the ledger, serialized as
`CourtTransitionEvent` records with their own intrinsic identity.

## Tasks

- [ ] Add strict `CourtState`, `CourtLegalMove`, `CourtValidatedMove`,
      `CourtTransitionEvent`, `CourtLedgerSnapshot`,
      `TopologicalTranslocationRecord`, Court replay-result schemas.
- [ ] Implement pure `listLegalCourtMoves`, `validateCourtMove`,
      `applyCourtMove`, and `replayCourtLedger` functions over canonical
      JSON; ordinary moves are adjacent-only and the adjacency guard runs
      before validation.
- [ ] Implement $\kappa_{\text{court}}$ derivation
      $\kappa(C_i) = i/4$ and persist it as a typed fourth coordinate; the
      runtime refuses to write $\kappa_{\text{court}}$ into any $C_P$, $C_H$,
      $C_S$, temperature, entropy, enthalpy, or free-energy field.
- [ ] Bind each Court validation token to Court policy fingerprint,
      normalized Court operation, prior Court-state hash, context
      fingerprint, and capability scope.
- [ ] Implement append-only Court sequence numbers, previous-event hashes,
      intrinsic Court-event identities, Court-snapshot fingerprints, and
      tamper verification.
- [ ] Implement the Topological Translocation contract: any non-adjacent
      Court jump must be accompanied by a Topological Translocation record
      citing the source state, the target state, the Forte family change,
      the altered Chaldean degree(s), the Degree Governor(s), and the
      evidence path; jumps without that record fail closed.
- [ ] Keep wall-clock observations outside intrinsic Court-event identity;
      use logical sequence for replay ordering. Store live Court state
      under `XDG_STATE_HOME` (or an explicit external path), never inside
      release artifacts by default.
- [ ] Require registered typed Court operations; raw shell, raw Cypher,
  arbitrary ledger writes, and arbitrary Court-position writes are not
      legal moves.

## Acceptance criteria

- **AC-1**: the engine returns the explicit finite Court legal-move set for
  the current Court state; only adjacent states on the canonical path are
  listed unless a Topological Translocation record is supplied; attempts
  outside that set fail without a Court-ledger delta.
- **AC-2**: only a non-expired token matching the exact prior Court state,
  Court policy, context, Court operation, and capability can authorize one
  Court transition; reuse and stale-state execution fail closed.
- **AC-3**: replay of a valid Court ledger reconstructs byte-identical
  Court state, $\kappa_{\text{court}}$, and snapshot fingerprints;
  modifying, deleting, inserting, or reordering a Court event is detected
  at the first broken link.
- **AC-4**: $\kappa_{\text{court}}$ is persisted as a typed fourth
  coordinate; any attempt to store it into a $C_P$, $C_H$, $C_S$,
  temperature, entropy, enthalpy, or free-energy field is rejected with a
  machine-readable reason.
- **AC-5**: a non-adjacent Court jump without a Topological Translocation
  record is rejected with `non_adjacent_without_translocation`; jumps with
  a record are accepted only when the cited source/target/Forte change
  degrees match the actual transition.
- **AC-6**: intrinsic Court-event identities are byte-identical across
  separate processes regardless of provider or wall-clock time; Neo4j and
  the LLM cannot authoritatively write Court state; graph projection loss
  has no effect on Court-ledger replay.
- **AC-7**: GOV-204's ledger contracts remain unchanged; Court events are
  a typed extension; the GOV-205 evidence lifecycle still gates
  `VERIFIED` transitions; the GOV-204 `AgentState`/`LedgerEvent`
  schemas are not rewritten.

## Verification

Exercise valid adjacent transitions in both directions, every illegal
transition class (non-adjacent without translocation record, off-chain
mask, wrong policy/context/capability, concurrent prior-Court-state
conflicts), stale/reused tokens, Court-ledger replay, Court-ledger tamper
modes, Topological Translocation acceptance and rejection,
$\kappa_{\text{court}}$ cross-namespace-write rejection, external-state-path
enforcement, and the canonical scope-state regression (Governor office
unchanged by any Court transition). Confirm the GOV-204 root ledger remains
authoritative and Court events are a typed extension.

## Definition of done

All Court schemas, pure transition/ledger extension functions, the
$\kappa_{\text{court}}$ coordinate, Topological Translocation contract, and
external-state default are implemented; adjacency, token, replay, tamper,
$\kappa_{\text{court}}$ cross-namespace-rejection, and Topological
Translocation tests pass; intrinsic artifacts are deterministic twice; no
live Court-ledger state enters the manifest; GOV-204's contracts remain
unchanged; package/root validation, authority docs, and QA evidence are
green.