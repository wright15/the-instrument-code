# DEFECT - Orrery game browser 30s timeout

**Status:** Open · **Priority:** High · **Affected sprints:** Sprint 3, Sprint 4

## Defect

The `orrery-game` browser session reaches its 30-second timeout in persistent
single-session runs across Sprint 3 and Sprint 4. Single-session isolation does
not mitigate the flake.

## Reproduction

- Run the affected browser-gated `orrery-game` session in isolation.
- The session reproduces the 30-second timeout.

## Authorized Closure Condition

Browser-gated story closures that cite this defect ticket alongside six passing
sessions are authorized to proceed. This exception records the known persistent
flake; it does not mark the timeout resolved.

## Follow-up

Retain this ticket until a browser-session fix demonstrates that the isolated
`orrery-game` session no longer times out.
