# GOV-211 — Assignment-aware menu organization sidecar

**Status:** Done · **Priority:** High · **Points:** 8 · **Epic:** Framework follow-on
**Depends on:** GOV-210 · **Blocks:** —

## Story

As a framework consumer, I want replay-derived Governor and Court menus organized
with GOV-210 assignment evidence so agents can see what fits a trusted target
and why without allowing graph data to create, suppress, validate, or authorize
skills, moves, capabilities, executors, transitions, or success claims.

## Agreed direction

- Preserve GOV-207 and CRT-307 response bytes and schemas unchanged.
- Return GOV-211 organization as a separate versioned wrapper/sidecar.
- Accept Governor topology identity only through a host-owned binding sealed to
  the replayed state and context; never infer it from office, Governor, prose,
  mythology, skill text, or model input.
- Derive Court position only from the replayed CRT-307 response.
- Query only the bounded GOV-210 `skills_for_topology_target` and
  `skills_for_court_position` surfaces through a fingerprinted provider result.
- Organize only skill IDs already exposed by the authoritative base menu.
- Preserve every base skill, move, query binding, executor flag, directive,
  receipt, and result fingerprint exactly.
- On absent, stale, timed-out, malformed, oversized, or fingerprint-mismatched
  assignment data, return deterministic fallback organization over the original
  menu with no authority effect.
- Keep GOV-206, CRT-306, GOV-207, CRT-307, and GOV-210 fingerprints unchanged.

## Definition of done

Strict provider, target-binding, organization, and wrapper contracts;
deterministic policy-ranked organization; Governor and Court facade composition;
no-provider and failure parity; provider build-twice identity; file/live-Neo4j
query parity; privacy and authority tamper fixtures; documentation; decision
ledger; and root validation are complete without editing closed skill/runtime
contracts or GOV-210 canonical identity.

## Closure evidence

- Focused GOV-211 tests: 13/13 passed.
- Full root Python tests: 349/349 passed.
- Native file/live-Neo4j sealed provider parity passed.
- Integrated validation: 316/316 checks passed over 709 canonical files.
- GOV-207, CRT-307, and GOV-210 release identities remained unchanged.
