# GOV-520 — Ring-constraint forcing execution (gated shell)

**Status:** Done — category underdetermined (production receipt 475355836ef7bbbfb9a014f8e271447ebb625b5f03bdb07af718e422f892434b); closed per rule 5 · **Sprint:** Sprint 4 · **Epic:** EPIC-520
**Depends on:** GOV-518 at B₃ = `bee5f2a19a7ebca153fe0331cb9e8691c305c32c03c16f765396047201cba382`; GOV-519 scaffolding receipt; activation entry · **Blocks:** the H2 verdict only

**Lineage.** Mandate: DECISION_LEDGER.md:1309-1314. Grant: DECISION_LEDGER.md:1347-1349, as narrowed by "GOV-518 grant narrowing — execution condition — 2026-09-07". Authorized as a ticket by "GOV-518 boundary acceptance" paragraph (4) and the ticket-registration entry. Comparison semantics: amendment A1–A5.

**Authorization notice.** This ticket confers no execution authority by existing. Execution requires the gate below. The run emits a category — success is never presumed; all four categories close the story (rule 5).

**Gate (all required).** Frozen binding valid at run start (B₃ three-way: computed ↔ MANIFEST.json ↔ amendment entry) AND grant-as-narrowed conditions satisfied (acceptance landed; GOV-519 scaffolding receipt proven fail-closed; activation entry citing that receipt) AND GOV-516 state consistent with the registered grant. GOV-517 queue untouched.

**Pre-flight order.** Binding check → input-boundary screen (import-closure + tamper suite) → fixture/control runs (digests only, discarded, verdict-ineligible) → unconditional adversarial self-test → green or stop. Any detector red ⇒ the frozen invalid category; no H2 disposition.

**Execution.** Single production run; D8-pinned deterministic environment; single-threaded; registered comparator only; stdout purity (boundary id, counts, classes only).

**completion_certificate.** Records: the D8-declared orbit bound (60028; group D₇, order 14), visited orbit representatives equal to that bound, the admissible-class count, and the environment fingerprint. The orbit bound caps admissible orbits; timeout and deterministic pin per the registered D8 values. The admissible-class count is reported separately from the orbit count — the orbit count is search efficiency, not the D4 outcome count. Declared-vs-computed mismatch ⇒ anomalous per rule 1.

**Comparison entry point (separate).** Reads the fingerprint-verified canonical observation artifact (canonical_observation_record), recomputing SHA-256 against CHECKSUMS/MANIFEST at run time, recorded in the receipt. Membership-based per A3: a class matches iff comparison_target ∈ statistic_orbit(C) (`matches`). Type note: the observed value-set is of different type and is not a comparison operand.

**Receipt.** Full admissible-class list + representative statistics in registered order; verdict-only reporting prohibited. Categories, exact registered names: forced, forced_nonmatching, underdetermined, incomplete_or_anomalous/invalid. Per-signature D4/D5 readings require separate tickets; a D5-only result does not cover D4, and vice versa.

**Failure semantics.** Invalid/incomplete ⇒ no H2 disposition; no retry-with-changes; re-run only under the unchanged binding; any re-test = new boundary registration + new ticket, original verdict preserved as state (rule 8).

**Vocabulary disposition.** No new Rule-11 tokens introduced; the prose guard is the arbiter.

**Verification.** GOV-518:103 suites ran/skipped-with-reason in pre-flight; adversarial self-test unconditional.

**Definition of done.** One gated run completed with a valid completion_certificate and full receipt, or a recorded invalid with reason — and nothing beyond that.

**References.** GOV-518 ticket at B₃; amendment A1–A5; "GOV-518 grant narrowing — execution condition — 2026-09-07"; "GOV-518 boundary acceptance"; ticket-registration entry; GOV-519 scaffolding receipt (pending); DECISION_LEDGER.md:1309-1314,1347-1349; EPIC-520-1 addendum; MANIFEST.json.
