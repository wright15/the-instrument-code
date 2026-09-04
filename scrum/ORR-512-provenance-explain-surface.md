# ORR-512 - Provenance explain surface

**Status:** Done · **Priority:** High · **Points:** TBD · **Epic:** [EPIC-511](EPIC-511-orrery-evidence-surfaces.md) · **Sprint:** Sprint 3
**Depends on:** ORR-511 · **Blocks:** —

## Story

As an Orrery user, I want a bounded provenance explanation surface so I can see
why an inspected value or legal move is available without being offered raw
queries or an unverified causal narrative.

## Scope

- Consume only named, read-only explanation contracts such as
  `rule_explanation`, `legal_move_context`, and `provenance_path`.
- Align `skills/governor/schemas/inspect-context.schema.json` so it explicitly
  references `rule_explanation`, `legal_move_context`, and `provenance_path` as
  the allowed named query contracts.
- Render an ordered evidence path with source identity, authority status, and
  explicit unavailable or incompatible states.
- Reuse ORR-511's exact labels and source bundle rather than reconstructing
  provenance in the browser.

## Acceptance criteria

1. The surface requests only bounded named query contracts and never submits raw
   Cypher, raw query text, credentials, or a write operation.
2. Each displayed path identifies the source record, relationship or rule, and
   authority status that supports the presentation.
3. A missing source, invalid response, unavailable projection, or incompatible
   release has a visible non-inferential state.
4. The explanation of a legal move preserves the current catalog provenance and
   does not make a move legal merely because a visual path exists.
5. Ordering and formatting are deterministic for the same source response.
6. `skills/governor/schemas/inspect-context.schema.json` explicitly references
   `rule_explanation`, `legal_move_context`, and `provenance_path` as the
   allowed named query contracts.

## Non-goals and guards

- No new `/api/explain` or `/api/inspect` route is assumed without a separately
  versioned bounded contract.
- No raw `/api/query`, Neo4j write, or browser-held credential is permitted.
- Arithmetic output wins over planning assumptions. Evidence-path counts and
  labels must be derived from returned records and cited source artifacts.

## Verification

- Contract tests for every named query input/output and deterministic ordering.
- Browser tests for successful, unavailable, incompatible, invalid, and empty
  provenance paths.
- Negative tests prove raw-query and mutation affordances are absent.

## Definition of done

The surface explains only bounded, source-identified evidence and fails visibly
without inventing a path, value, or legal action.

## References

- `docs/GOVERNOR_GRAPH_READ_API.md`
- `server.mjs`
- `skills/governor/schemas/inspect-context.schema.json`
- `orrery/README.md`
