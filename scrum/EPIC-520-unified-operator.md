# EPIC-520 - Unified Operator

**Status:** Backlog · **Priority:** High · **Owner:** Research governance
**Epic ID:** EPIC-520 · **Release:** `1.9.0-dev`
**Stories:** None. Zero child stories; activation opens the epic only, and the first story (a separate planning cycle) is spec'd fresh.

## Problem statement

Any unified-operator proposal would cross existing structural, planning, and
presentation boundaries. It must not be inferred from a single observation or
opened by a UI implementation.

## Goal

Provide a bounded placeholder that becomes an active epic only if Research Gate
3 records dual confirmation from GOV-510 and GOV-511.

## Scope

**In:** the activation condition, authority constraints, and a future planning
entry after the gate opens the epic.

**Out:** current implementation stories, a new operator, graph changes,
admission, runtime behavior, EPIC-520 release pins, or a precommitted design.

## Activation rule

EPIC-520 becomes `Backlog` only when GOV-512 records `open` from confirmed,
schema-valid, source-fresh GOV-510 and GOV-511 evidence. Any refuted, partial,
stale, invalid, unavailable, or deferred input leaves this record conditional
and creates no child story.

## Success criteria

1. The condition is machine-checkable from GOV-512's recorded inputs and result.
2. No ticket, artifact, or UI claim treats this placeholder as an active
   operator workstream before the gate opens it.
3. If opened, a separate planning cycle defines scope, authority, negative
   controls, validation, and release effects before implementation begins.

## Definition of done

For this conditional record, done means the activation rule is unambiguous and
no authority is granted before GOV-512 explicitly opens it.

## References

- [GOV-512](GOV-512-research-gate-3.md)
- `provenance/DECISION_LEDGER.md`
- `provenance/SOURCE_AUTHORITY.md`
