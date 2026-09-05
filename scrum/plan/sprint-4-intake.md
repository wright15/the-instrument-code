# Sprint 4 Intake - EPIC-520 research track

**Status:** Approved for execution · **Sprint:** Sprint 4 · **Release:** `1.9.0-dev`
**Policy receipt:** `provenance/DECISION_LEDGER.md` - Sprint 4 research-track shape, option 2, 2026-09-05

## Shape

| EPIC-520-1 section 4 check | Ticket | Sprint 4 action |
|---|---|---|
| (i) D-shadow | [GOV-513](../GOV-513-d-shadow-complement-span-audit.md) | Execute |
| (ii) GOV-227 interleaving | [GOV-514](../GOV-514-d-tier-compression-interleaving-check.md) | Execute |
| (iii) Ring-force enumeration | [GOV-515](../GOV-515-ring-force-enumeration-definition.md) | Define only; do not execute |
| (iv) Single D4-or-D5 signature derivation | Unopened second child | Deferred |

**Boundary rationale:** GOV-515's hypothesis-laden input boundary needs an
unhurried definitional pass; running it beside two executing checks risks
rigging H2 in either direction. The ledger entry is received policy, not a
claim to reopen or argue during execution.

## Execution order

1. GOV-513 and GOV-514 may run in parallel after recording current source
   fingerprints and environment/suite status.
2. GOV-515 defines and freezes Stage 1 only. Maintainer review is the required
   re-audit channel before a separate Stage 2 successor can be opened.
3. Each research ticket closes under its own outcome-honest semantics; no
   outcome authorizes a unified operator or cross-ticket synthesis.

## Sprint guards

- Every ticket-named verification suite records `ran` or `skipped` plus reason.
- Gate-time and current fingerprints remain separate receipts.
- A source/spec/output mismatch fails the phase and returns through maintainer
  re-audit; it is never silently adopted.
- No ticket may use its result to write topology, offices, admission, runtime,
  Neo4j, release pins, or global `harmonic.C_H`.

## References

- [EPIC-520-1](../EPIC-520-1-unified-operator-planning.md)
- `provenance/DECISION_LEDGER.md` - Sprint 4 research-track shape
- `docs/verification/VERIFICATION_REPORT_GATE_STATUS.md`
