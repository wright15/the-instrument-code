# GOV-204 — Authoritative transition engine and hash-chained ledger

**Status:** Done · **Priority:** High · **Points:** 8 · **Epic:** [EPIC-002](EPIC-002-governor-domain-agent-runtime.md)
**Depends on:** GOV-203 · **Blocks:** GOV-205, GOV-207

## Story

As an agent-runtime operator, I want the state machine to enumerate legal
moves, validate one proposed move, and record every accepted transition in a
replayable ledger, so neither the model nor the graph can invent runtime state.

## Context

The repository has mature algebraic operator/application ledgers for scale
states but no general agent-session state or executable `LedgerEvent` contract.
This story adds an operational lifecycle namespace; it does not redefine `M`,
`R1–R7`, `L1–L7`, State Governor, Degree Governor, or proposed Court states.

## Tasks

- [x] Add strict `AgentState`, `LegalMove`, `ValidatedMove`, `LedgerEvent`,
      `LedgerSnapshot`, and replay-result schemas.
- [x] Implement pure `listLegalMoves`, `validateMove`, `applyMove`, and
      `replayLedger` functions over canonical JSON.
- [x] Bind each validation token to policy fingerprint, normalized operation,
      prior state/event hash, context fingerprint, and capability scope.
- [x] Implement append-only sequence numbers, previous-event hashes, intrinsic
      event identities, snapshot fingerprints, and tamper verification.
- [x] Keep wall-clock observations outside intrinsic deterministic identity;
      use logical sequence for replay ordering.
- [x] Store live state under `XDG_STATE_HOME` (or an explicit external path),
      never inside release artifacts by default.
- [x] Require registered typed operations; arbitrary shell, Cypher, and direct
      ledger writes are not legal moves.

## Acceptance criteria

- **AC-1**: the engine returns an explicit finite legal-move set for the
  current state; attempts outside that set fail without a ledger delta.
- **AC-2**: only a non-expired token matching the exact prior state, policy,
  context, operation, and capability can authorize one transition; reuse and
  stale-state execution fail closed.
- **AC-3**: replay of a valid ledger reconstructs byte-identical state and
  snapshot fingerprints; modifying, deleting, inserting, or reordering an
  event is detected at the first broken link.
- **AC-4**: the same intrinsic transition inputs produce the same event
  identity in separate processes regardless of provider or wall-clock time.
- **AC-5**: Neo4j and the LLM are unable to authoritatively write runtime
  state; graph projection loss has no effect on replay.
- **AC-6**: canonical scale-state operator calls continue to use the admitted
  mutation registry and cannot be confused with operational lifecycle moves.

## Verification

Exercise valid transitions, every illegal transition class, stale/reused
tokens, wrong policy/context/capability, concurrent prior-state conflicts,
replay, four tamper modes, external state-path enforcement, and canonical
operator namespace regressions.

## Definition of done

All schemas and pure transition/ledger functions are implemented with an
external-state default; legal-move, token, replay, tamper, and namespace tests
pass; intrinsic artifacts are deterministic twice; no live ledger enters the
manifest; package/root validation, authority docs, and QA evidence are green.

Implementation evidence recorded 2026-08-01 (in-repo Python delivery, shared
with GOV-205 under `src/governor/`):

- Strict immutable contracts `AgentState`, `LegalMove`, `ValidatedMove`,
  `ValidationToken`, `RuntimeEventBody`, `LedgerSnapshot`, and runtime replay
  result in `src/governor/runtime_models.py`; pure legal-move enumeration,
  validation-token issuance, and move application over canonical JSON in
  `src/governor/transitions.py`.
- Validation tokens bind policy fingerprint, normalized (NFC) parameters,
  prior state/ledger hash, context fingerprint, and capability scope; tokens
  are one-use and stale/reused/expired tokens fail closed with no ledger delta.
- Append-only runtime ledger with sequential events, previous-event hash
  links, intrinsic event identities, snapshot fingerprints, and replay that
  detects modify/delete/insert/reorder at the first broken link
  (`src/governor/runtime_ledger.py`, `src/governor/ledger.py`).
- Wall-clock and provider observations stay outside intrinsic deterministic
  identity; logical sequence drives replay ordering.
- Live state defaults to `XDG_STATE_HOME`/`~/.local/state/seven-governors`
  (or an explicit external path) via atomic compare-and-swap writes that
  reject paths inside the repository (`src/governor/state_store.py`).
- Only registered typed operations are legal moves; raw shell, raw Cypher, and
  direct ledger writes are not operations.
- Tests: `tests/test_gov_204_projections.py` (26) and
  `tests/test_gov_204_transitions.py` (17) pass; full suite **86/86 PASS** at
  `PYTHONHASHSEED=1 TZ=UTC` and `PYTHONHASHSEED=987 TZ=Pacific/Honolulu`.

**Done 2026-08-01.**
